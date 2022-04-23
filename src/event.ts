import { Mob } from "bdsx/bds/actor";
import { ItemStack, ItemUseOnActorInventoryTransaction } from "bdsx/bds/inventory";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { ServerPlayer } from "bdsx/bds/player";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { bedrockServer } from "bdsx/launcher";
import { TraderMgmt } from ".";
import { CustomTrade } from "..";

const mc_level = bedrockServer.level;
export class VillagerInteractEvent {
    constructor(public player: ServerPlayer, public villager: Mob, public item: ItemStack, public transaction: ItemUseOnActorInventoryTransaction) {}
}

events.packetBefore(MinecraftPacketIds.InventoryTransaction).on((pkt, ni, id) => {
    if (pkt.transaction?.isItemUseOnEntityTransaction()) {
        const player = ni.getActor();
        if (!player?.isPlayer()) return;

        const data = pkt.transaction;

        const entity = mc_level.getRuntimeEntity(data.runtimeId, false);
        if (!entity) return;
        if (TraderMgmt.isValidTrader(entity)) {
            const event = new VillagerInteractEvent(player, entity, player.getMainhandSlot(), data);
            const canceled = CustomTrade.onVillagerInteract.fire(event) === CANCEL;
            if (canceled) return CANCEL;
        }
    }
});
