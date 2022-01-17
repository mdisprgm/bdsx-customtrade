import { command } from "bdsx/command";
import { CommandPermissionLevel } from "bdsx/bds/command";
import { ItemStack } from "bdsx/bds/inventory";
import { CompoundTag, NBT } from "bdsx/bds/nbt";

const cmd_trader = command.register(
    "custom_trader",
    "custom trader commands",
    CommandPermissionLevel.Operator
);

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
