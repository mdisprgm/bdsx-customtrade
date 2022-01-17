import { command } from "bdsx/command";
import { CommandPermissionLevel } from "bdsx/bds/command";
import { ItemStack } from "bdsx/bds/inventory";
import { CompoundTag, NBT } from "bdsx/bds/nbt";
import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { ActorUniqueID } from "bdsx/bds/actor";
import { CustomTrade } from "..";
import { Player$setCarriedItem } from "./hacker";
import { PlayerPermission } from "bdsx/bds/player";
import { CANCEL } from "bdsx/common";

const cmd_trader = command.register(
    "custom_trader",
    "custom trader commands",
    CommandPermissionLevel.Operator
);

export const EditingTargets = new Map<NetworkIdentifier, ActorUniqueID>();

CustomTrade.onVillagerInteract.on((ev) => {
    const player = ev.player;
    const villager = ev.villager;
    if (!CustomTrade.IsVillager(villager)) return;
    const item = player.getMainhandSlot();
    if (!CustomTrade.IsWand(item)) return;
    if (player.getPermissionLevel() !== PlayerPermission.OPERATOR) {
        Player$setCarriedItem(player, CustomTrade.AIR_ITEM);
        return;
    }
    if (player.isSneaking()) {
        EditingTargets.set(
            player.getNetworkIdentifier(),
            villager.getUniqueIdBin()
        );
        const villPos = ev.villager.getPosition();
        player.sendMessage(
            CustomTrade.Translate(
                "editingTarget.selected",
                villPos.x.toFixed(2),
                villPos.y.toFixed(2),
                villPos.z.toFixed(2)
            )
        );
        return CANCEL;
    }
});

cmd_trader.alias("trademgmt");

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
        value: command.enum("CustomTradeWand", "wand"),
    }
);
