import { command } from "bdsx/command";
import { ActorCommandSelector, CommandPermissionLevel } from "bdsx/bds/command";
import {
    ItemStack,
    ItemUseOnActorInventoryTransaction,
} from "bdsx/bds/inventory";
import { CompoundTag, NBT } from "bdsx/bds/nbt";
import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { ActorUniqueID } from "bdsx/bds/actor";
import { CustomTrade } from "..";
import { Player$setCarriedItem } from "./hacker";
import { PlayerPermission } from "bdsx/bds/player";
import { CANCEL } from "bdsx/common";
import { float32_t } from "bdsx/nativetype";
import { Vec3 } from "bdsx/bds/blockpos";

const cmd_trader = command.register(
    "custom_trader",
    "custom trader commands",
    CommandPermissionLevel.Operator
);
cmd_trader.alias("trademgmt");

class EditingTarget {
    constructor(public readonly id: ActorUniqueID, public readonly pos: Vec3) {}
}

export const EditingTargets = new Map<NetworkIdentifier, EditingTarget>();

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
            EditingTargets.set(
                ni,
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
                const pos = EditingTargets.get(ni)!.pos;
                EditingTargets.delete(ni);
                CustomTrade.SendTranslated(
                    player,
                    "editingTarget.unselected",
                    pos.x.toFixed(2),
                    pos.y.toFixed(2),
                    pos.z.toFixed(2)
                );
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
