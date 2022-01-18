import { Actor } from "bdsx/bds/actor";
import {
    ItemStack,
    ItemUseOnActorInventoryTransaction,
} from "bdsx/bds/inventory";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { ServerPlayer } from "bdsx/bds/player";
import { serverInstance } from "bdsx/bds/server";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { CustomTrade } from "..";

const MCLEVEL = serverInstance.minecraft.getLevel();

export class VillagerInteractEvent {
    constructor(
        public player: ServerPlayer,
        public villager: Actor,
        public item: ItemStack,
        public transaction: ItemUseOnActorInventoryTransaction
    ) {}
}

events
    .packetBefore(MinecraftPacketIds.InventoryTransaction)
    .on((pkt, ni, id) => {
        if (pkt.transaction.isItemUseOnEntityTransaction()) {
            const player = ni.getActor();
            if (!player?.isPlayer()) return;

            const data = pkt.transaction;

            const entity = MCLEVEL.getRuntimeEntity(data.runtimeId, false);
            if (!entity) return;
            if (CustomTrade.IsValidTrader(entity)) {
                const event = new VillagerInteractEvent(
                    player,
                    entity,
                    player.getMainhandSlot(),
                    data
                );
                const canceled =
                    CustomTrade.onVillagerInteract.fire(event) === CANCEL;
                if (canceled) return CANCEL;
            }
        }
    });
