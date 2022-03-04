import { Actor, ActorUniqueID } from "bdsx/bds/actor";
import { Vec3 } from "bdsx/bds/blockpos";
import { ActorCommandSelector, CommandItem, CommandPermissionLevel } from "bdsx/bds/command";
import { ItemStack, ItemUseOnActorInventoryTransaction } from "bdsx/bds/inventory";
import { CompoundTag, NBT } from "bdsx/bds/nbt";
import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { PlayerPermission, ServerPlayer } from "bdsx/bds/player";
import { command } from "bdsx/command";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { bool_t, CxxString, float32_t, int32_t } from "bdsx/nativetype";
import { TraderMgmt } from ".";
import { CustomTrade } from "..";
import { Player$setCarriedItem } from "./hacker";

export namespace TraderCommand {
    export function assertHasTargets(player: ServerPlayer): number {
        const count = HasTargets(player);
        if (count) {
            return count;
        } else {
            CustomTrade.SendTranslated(player, "command.addRecipe.error.no_targets");
            return 0;
        }
    }
    export function dynamicAddRecipeOutput(player: ServerPlayer, buyA: ItemStack, buyB: ItemStack, sell: ItemStack) {
        if (CustomTrade.IsAir(buyB, false)) {
            CustomTrade.SendTranslated(player, "addRecipe.success", `${buyA.getName()}`, `${buyA.getAmount()}`, `${sell.getName()}`, `${sell.getAmount()}`);
        } else {
            CustomTrade.SendTranslated(
                player,
                "addRecipe.buyB.success",
                `${buyA.getName()}`,
                `${buyA.getAmount()}`,
                `${buyB.getName()}`,
                `${buyB.getAmount()}`,
                `${sell.getName()}`,
                `${sell.getAmount()}`,
            );
        }
    }
}

const cmd_trader = command.register("custom_trader", "custom trader commands", CommandPermissionLevel.Operator);
cmd_trader.alias("tradermgmt");

class EditingTarget {
    constructor(public readonly id: ActorUniqueID, public readonly pos: Vec3) {}
}

export const EditingTargets = new Map<NetworkIdentifier, Set<EditingTarget>>();

events.playerJoin.on((ev) => {
    const ni = ev.player.getNetworkIdentifier();
    EditingTargets.delete(ni);
    EditingTargets.set(ni, new Set());
});
events.networkDisconnected.on((ni) => {
    EditingTargets.delete(ni);
});

function GetTargets(from: ServerPlayer): Set<EditingTarget> | null {
    return EditingTargets.get(from.getNetworkIdentifier()) ?? null;
}
function DeleteTargets(from: ServerPlayer): boolean {
    const ni = from.getNetworkIdentifier();
    if (EditingTargets.has(ni)) {
        EditingTargets.get(ni)!.clear();
        return true;
    }
    return false;
}
function HasTargets(from: ServerPlayer): number {
    const ni = from.getNetworkIdentifier();
    return EditingTargets.get(ni)?.size ?? 0;
}

CustomTrade.onVillagerInteract.on((ev) => {
    const player = ev.player;
    const villager = ev.villager;
    const villPos = villager.getPosition();

    const ni = player.getNetworkIdentifier();
    if (!TraderMgmt.isValidTrader(villager)) return;
    const item = player.getMainhandSlot();
    if (!CustomTrade.IsWand(item)) return;
    if (player.getPermissionLevel() !== PlayerPermission.OPERATOR) {
        Player$setCarriedItem(player, CustomTrade.AIR_ITEM);
        return;
    }

    if (player.isSneaking()) {
        if (ev.transaction.actionType !== ItemUseOnActorInventoryTransaction.ActionType.Attack) {
            EditingTargets.get(ni)?.add(new EditingTarget(villager.getUniqueIdBin(), Vec3.construct(villPos)));
            CustomTrade.SendTranslated(player, "editingTarget.selected", villPos.x.toFixed(2), villPos.y.toFixed(2), villPos.z.toFixed(2));
        } else {
            if (EditingTargets.has(ni)) {
                EditingTargets.get(ni)!.clear();
                CustomTrade.SendTranslated(player, "editingTarget.unselected");
            }
        }
        return CANCEL;
    }
});

cmd_trader.overload(
    (p, o, op) => {
        const player = o.getEntity();
        if (!player?.isPlayer()) return;

        // Item$setIsGlint(wand.item, true);
        const wand = ItemStack.constructWith("minecraft:blaze_rod", 1);
        wand.setCustomName("§r§l§dTrading Editor");

        const oldTag = wand.save();

        const wandTag = NBT.allocate({
            ...oldTag,
            tag: {
                ...oldTag.tag,
                IsCustomTradeWand: true,
                ench: [{ id: NBT.short(-1), lvl: NBT.short(1) }],
            },
        }) as CompoundTag;
        wand.load(wandTag);

        player.addItem(wand);
        player.sendInventory();
        wand.destruct();
        wandTag.dispose();
    },
    {
        option: command.enum("CustomTradeWand", "wand"),
    },
);

//0.5 is default for villagers
cmd_trader.overload(
    (p, o, op) => {
        for (const actor of p.targets.newResults(o)) {
            if (actor.isPlayer() || !TraderMgmt.isValidTrader(actor)) continue;
            const tag = actor.save();
            const att = tag.Attributes.find((v: any) => v.Name === "minecraft:movement");
            att.Current = NBT.float(p.value);
            actor.load(tag);
        }
    },
    {
        option: command.enum("Speed", "speed"),
        targets: ActorCommandSelector,
        value: float32_t,
    },
);

//infinite health, zero movement speed
cmd_trader.overload(
    (p, o, op) => {
        const player = o.getEntity();
        if (!player?.isPlayer()) return;
        if (!TraderCommand.assertHasTargets(player)) return;

        const targets = GetTargets(player);
        if (!targets) return;

        for (const target of targets) {
            const entity = Actor.fromUniqueIdBin(target.id);
            if (!entity) return;

            TraderMgmt.setInvincibility(entity, p.NoHurt, p.NoMovement);
            entity.setNameTag(p.Name);
        }

        CustomTrade.SendTranslated(player, "command.properties.success", p.Name, p.NoHurt, p.NoMovement);
    },
    {
        option: command.enum("Properties", "prop", "properties"),
        Name: CxxString,
        NoHurt: bool_t,
        NoMovement: bool_t,
    },
);

const CommandRecipeOption = command.enum("recipe", "recipe");

cmd_trader.overload(
    (p, o, op) => {
        const player = o.getEntity();
        if (!player?.isPlayer()) return;
        DeleteTargets(player);
        CustomTrade.SendTranslated(player, "command.init_targets.success");
    },
    {
        opt1: command.enum("RecipeInitTargets", "init"),
    },
);

cmd_trader.overload(
    (p, o, op) => {
        const player = o.getEntity();
        if (!player?.isPlayer()) return;

        const targets = GetTargets(player);
        if (!targets) return;

        for (const target of targets) {
            const villager = Actor.fromUniqueIdBin(target.id);
            if (!villager) continue;
            TraderMgmt.removeRecipe(villager, p.index);
        }
        CustomTrade.SendTranslated(player, "command.remove.success", p.index);
    },
    {
        option: CommandRecipeOption,
        remove: command.enum("RecipeRemove", "remove"),
        index: int32_t,
    },
);

cmd_trader.overload(
    (p, o, op) => {
        const player = o.getEntity();
        if (!player?.isPlayer()) return;

        const targets = GetTargets(player);
        if (!targets) return;

        for (const target of targets) {
            const villager = Actor.fromUniqueIdBin(target.id);
            if (!villager) continue;
            TraderMgmt.removeAllRecipes(villager);
        }
        CustomTrade.SendTranslated(player, "command.removeAll.success");
    },
    {
        option: CommandRecipeOption,
        remove_all: command.enum("RecipeRemoveAll", "remove_all"),
    },
);

function recreateItemInstance(item: ItemStack, amount: number, data: number) {
    const recreated = ItemStack.constructWith(item.getName(), amount, data);
    item.destruct();
    return recreated;
}
cmd_trader.overload(
    (p, o, op) => {
        const player = o.getEntity();
        if (!player?.isPlayer()) return;
        if (!HasTargets(player)) {
            CustomTrade.SendTranslated(player, "command.addRecipe.error.no_targets");
            return;
        }
        const targets = GetTargets(player);
        if (!targets) return;

        const buyA = recreateItemInstance(p.buyA.createInstance(1), p.countA, p.dataA);
        const buyB = recreateItemInstance(p.buyB.createInstance(1), p.countB, p.dataB);
        const sell = recreateItemInstance(p.sell.createInstance(1), p.countSell, p.dataSell);

        for (const target of targets) {
            const villager = Actor.fromUniqueIdBin(target.id);
            if (!villager) continue;

            //items are destructed here
            TraderMgmt.addSimpleRecipe(villager, buyA, buyB, sell, false);
        }

        TraderCommand.dynamicAddRecipeOutput(player, buyA, buyB, sell);
        buyA.destruct();
        buyB.destruct();
        sell.destruct();
    },
    {
        option: CommandRecipeOption,
        opt1: command.enum("RecipeAddSim", "add_simple"),
        buyA: CommandItem,
        countA: int32_t,
        dataA: int32_t,
        buyB: CommandItem,
        countB: int32_t,
        dataB: int32_t,
        sell: CommandItem,
        countSell: int32_t,
        dataSell: int32_t,
    },
);

cmd_trader.overload(
    (p, o, op) => {
        const player = o.getEntity();
        if (!player?.isPlayer()) return;
        if (!TraderCommand.assertHasTargets(player)) return;

        const targets = GetTargets(player);
        if (!targets) return;

        const buyA = recreateItemInstance(p.buyA.createInstance(1), p.countA, p.dataA);
        const buyB = recreateItemInstance(p.buyB.createInstance(1), p.countB, p.dataB);
        const sell = recreateItemInstance(p.sell.createInstance(1), p.countSell, p.dataSell);

        for (const target of targets) {
            const villager = Actor.fromUniqueIdBin(target.id);
            if (!villager) continue;

            //items are destructed here
            TraderMgmt.addRecipe(villager, buyA, p.priceMultiA, buyB, p.priceMultiB, sell, p.demand, p.traderExp, p.maxUses, p.tier, false);
        }

        TraderCommand.dynamicAddRecipeOutput(player, buyA, buyB, sell);
        buyA.destruct();
        buyB.destruct();
        sell.destruct();
    },
    {
        option: CommandRecipeOption,
        opt1: command.enum("RecipeAdd", "add"),
        buyA: CommandItem,
        countA: int32_t,
        dataA: int32_t,
        priceMultiA: float32_t,
        buyB: CommandItem,
        countB: int32_t,
        dataB: int32_t,
        priceMultiB: float32_t,
        sell: CommandItem,
        countSell: int32_t,
        dataSell: int32_t,
        demand: [int32_t, true],
        traderExp: [int32_t, true],
        maxUses: [int32_t, true],
        tier: [int32_t, true],
    },
);
