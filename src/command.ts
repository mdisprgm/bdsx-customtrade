import { command } from "bdsx/command";
import {
    ActorCommandSelector,
    CommandItem,
    CommandPermissionLevel,
} from "bdsx/bds/command";
import {
    ItemStack,
    ItemUseOnActorInventoryTransaction,
} from "bdsx/bds/inventory";
import { CompoundTag, NBT } from "bdsx/bds/nbt";
import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { Actor, ActorUniqueID } from "bdsx/bds/actor";
import { CustomTrade } from "..";
import { Player$setCarriedItem } from "./hacker";
import { PlayerPermission, ServerPlayer } from "bdsx/bds/player";
import { CANCEL } from "bdsx/common";
import { float32_t, int32_t } from "bdsx/nativetype";
import { Vec3 } from "bdsx/bds/blockpos";
import { RecipesMgmt } from ".";
import { events } from "bdsx/event";

const cmd_trader = command.register(
    "custom_trader",
    "custom trader commands",
    CommandPermissionLevel.Operator
);
cmd_trader.alias("trademgmt");

class EditingTarget {
    constructor(public readonly id: ActorUniqueID, public readonly pos: Vec3) {}
}

export const EditingTargets = new Map<NetworkIdentifier, EditingTarget[]>();

events.playerJoin.on((ev) => {
    const ni = ev.player.getNetworkIdentifier();
    EditingTargets.set(ni, []);
});
events.networkDisconnected.on((ni) => {
    EditingTargets.delete(ni);
});

function GetTargets(from: ServerPlayer): EditingTarget[] | null {
    return EditingTargets.get(from.getNetworkIdentifier()) ?? null;
}
function DeleteTargets(from: ServerPlayer): boolean {
    const ni = from.getNetworkIdentifier();
    if (EditingTargets.has(ni)) {
        EditingTargets.delete(ni);
    }
    return false;
}
function HasTargets(from: ServerPlayer): number {
    const ni = from.getNetworkIdentifier();
    return EditingTargets.get(ni)?.length ?? 0;
}

CustomTrade.onVillagerInteract.on((ev) => {
    const player = ev.player;
    const villager = ev.villager;
    const villPos = villager.getPosition();

    const ni = player.getNetworkIdentifier();
    if (!CustomTrade.IsValidTrader(villager)) return;
    const item = player.getMainhandSlot();
    if (!CustomTrade.IsWand(item)) return;
    if (player.getPermissionLevel() !== PlayerPermission.OPERATOR) {
        Player$setCarriedItem(player, CustomTrade.AIR_ITEM);
        return;
    }

    if (player.isSneaking()) {
        if (
            ev.transaction.actionType !==
            ItemUseOnActorInventoryTransaction.ActionType.Attack
        ) {
            EditingTargets.get(ni)?.push(
                new EditingTarget(
                    villager.getUniqueIdBin(),
                    Vec3.construct(villPos)
                )
            );
            CustomTrade.SendTranslated(
                player,
                "editingTarget.selected",
                villPos.x.toFixed(2),
                villPos.y.toFixed(2),
                villPos.z.toFixed(2)
            );
        } else {
            if (EditingTargets.has(ni)) {
                const list = EditingTargets.get(ni)!;
                list.splice(0, list.length);
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
    }
);

//0.5 is default for villagers
cmd_trader.overload(
    (p, o, op) => {
        for (const actor of p.targets.newResults(o)) {
            if (actor.isPlayer() || !CustomTrade.IsValidTrader(actor)) continue;
            const tag = actor.save();
            const att = tag.Attributes.find(
                (v: any) => v.Name === "minecraft:movement"
            );
            att.Current = NBT.float(p.value);
            actor.load(tag);
        }
    },
    {
        option: command.enum("Speed", "speed"),
        targets: ActorCommandSelector,
        value: float32_t,
    }
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
            RecipesMgmt.removeAllRecipes(villager);
            CustomTrade.SendTranslated(player, "command.removeAll.success");
        }
    },
    {
        option: command.enum("recipe", "recipe"),
        opt1: command.enum("RecipeRemoveAll", "remove_all"),
    }
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
            CustomTrade.SendTranslated(
                player,
                "command.addRecipe.error.no_targets"
            );
            return;
        }
        const targets = GetTargets(player);
        if (!targets) return;

        for (const target of targets) {
            const villager = Actor.fromUniqueIdBin(target.id);
            if (!villager) continue;

            const buyA = recreateItemInstance(
                p.buyA.createInstance(1),
                p.countA,
                p.dataA
            );
            const buyB = recreateItemInstance(
                p.buyB.createInstance(1),
                p.countB,
                p.dataB
            );
            const sell = recreateItemInstance(
                p.sell.createInstance(1),
                p.countSell,
                p.dataSell
            );
            RecipesMgmt.addSimpleRecipe(villager, buyA, buyB, sell, true);
        }
    },
    {
        option: command.enum("recipe", "recipe"),
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
    }
);

cmd_trader.overload(
    (p, o, op) => {
        const player = o.getEntity();
        if (!player?.isPlayer()) return;
        if (!HasTargets(player)) {
            CustomTrade.SendTranslated(
                player,
                "command.addRecipe.error.no_targets"
            );
            return;
        }
        const targets = GetTargets(player);
        if (!targets) return;

        for (const target of targets) {
            const villager = Actor.fromUniqueIdBin(target.id);
            if (!villager) continue;

            const buyA = recreateItemInstance(
                p.buyA.createInstance(1),
                p.countA,
                p.dataA
            );
            const buyB = recreateItemInstance(
                p.buyB.createInstance(1),
                p.countB,
                p.dataB
            );
            const sell = recreateItemInstance(
                p.sell.createInstance(1),
                p.countSell,
                p.dataSell
            );
            RecipesMgmt.addRecipe(
                villager,
                buyA,
                p.priceMultiA,
                buyB,
                p.priceMultiB,
                sell,
                p.demand,
                p.traderExp,
                p.maxUses,
                p.tier,
                true
            );
        }
    },
    {
        option: command.enum("recipe", "recipe"),
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
    }
);
