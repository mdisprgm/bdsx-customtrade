import { ItemStack } from "bdsx/bds/inventory";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { PlayerPermission } from "bdsx/bds/player";
import { serverInstance } from "bdsx/bds/server";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { CustomTrade, VillagerInteractEvent } from "..";
import { SNBT } from "@bdsx/snbt";
import { Player$setCarriedItem } from "./hacker";

const level = serverInstance.minecraft.getLevel();

const VILLAGER = "minecraft:villager_v2";

events
    .packetBefore(MinecraftPacketIds.InventoryTransaction)
    .on((pkt, ni, id) => {
        if (pkt.transaction.isItemUseOnEntityTransaction()) {
            const player = ni.getActor();
            if (!player?.isPlayer()) return;

            const data = pkt.transaction;

            const entity = level.getRuntimeEntity(data.runtimeId, false);
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

const AIR_ITEM = ItemStack.constructWith("minecraft:air", 1);
CustomTrade.onVillagerInteract.on((ev) => {
    const player = ev.player;
    const villager = ev.villager;
    const item = ev.item;
    if (!CustomTrade.IsWand(item)) return;
    if (player.getPermissionLevel() !== PlayerPermission.OPERATOR) {
        Player$setCarriedItem(player, AIR_ITEM);
        return;
    }
    const OffersRecipes = villager.save().Offers.Recipes;
    console.log(OffersRecipes);
    return CANCEL;
});
events.serverLeave.on(() => {
    AIR_ITEM.destruct();
});

/**
 * Offers . Recipes
 * {
                'buyA': {
                    'Count': 11b,
                    'Damage': 32767s,
                    'Name': 'minecraft:emerald',
                    'WasPickedUp': 0b
                },
                'buyB': {
                    'Count': 1b,
                    'Damage': 32767s,
                    'Name': 'minecraft:book',
                    'WasPickedUp': 0b
                },
                'buyCountA': 11,
                'buyCountB': 1,
                'demand': 0,
                'maxUses': 12,
                'priceMultiplierA': 0.20000000298023224f,
                'priceMultiplierB': 0.20000000298023224f,
                'rewardExp': 1b,
                'sell': {
                    'Count': 1b,
                    'Damage': 0s,
                    'Name': 'minecraft:enchanted_book',
                    'WasPickedUp': 0b,
                    'tag': {
                        'ench': [
                            {
                                'id': 13s,
                                'lvl': 1s
                            }
                        ]
                    }
                },
                'tier': 2,
                'traderExp': 10,
                'uses': 0
            },
 */
