import { command } from "bdsx/command";
import { ActorCommandSelector, CommandPermissionLevel } from "bdsx/bds/command";
import { ItemStack } from "bdsx/bds/inventory";
import { CompoundTag, NBT } from "bdsx/bds/nbt";
import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { ActorUniqueID } from "bdsx/bds/actor";
import { CustomTrade } from "..";
import { Player$setCarriedItem } from "./hacker";
import { PlayerPermission } from "bdsx/bds/player";
import { CANCEL } from "bdsx/common";
import { float32_t } from "bdsx/nativetype";

const cmd_trader = command.register(
    "custom_trader",
    "custom trader commands",
    CommandPermissionLevel.Operator
);
cmd_trader.alias("trademgmt");

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

//0.5 is default for villagers
cmd_trader.overload(
    (p, o, op) => {
        for (const actor of p.targets.newResults(o)) {
            if (actor.isPlayer()) continue;
            const tag = actor.save();
            const att = tag.Attributes.find(
                (v: any) => v.Name === "minecraft:movement"
            );
            console.log(att.Current);
            att.Current = NBT.float(p.value);
            actor.load(tag);
        }
    },
    {
        noai: command.enum("Speed", "speed"),
        targets: ActorCommandSelector,
        value: float32_t,
    }
);
