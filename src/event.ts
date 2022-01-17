import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { serverInstance } from "bdsx/bds/server";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { CustomTrade, VillagerInteractEvent } from "..";

const MCLEVEL = serverInstance.minecraft.getLevel();

const VILLAGER = "minecraft:villager_v2";

events
    .packetBefore(MinecraftPacketIds.InventoryTransaction)
    .on((pkt, ni, id) => {
        if (pkt.transaction.isItemUseOnEntityTransaction()) {
            const player = ni.getActor();
            if (!player?.isPlayer()) return;

            const data = pkt.transaction;

            const entity = MCLEVEL.getRuntimeEntity(data.runtimeId, false);
            if (!entity) return;
            if (entity.getIdentifier() === VILLAGER) {
                const event = new VillagerInteractEvent(
                    player,
                    entity,
                    player.getMainhandSlot()
                );
                const canceled =
                    CustomTrade.onVillagerInteract.fire(event) === CANCEL;
                if (canceled) return CANCEL;
            }
        }
    });
