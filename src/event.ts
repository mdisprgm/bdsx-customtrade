import { ItemStack } from "bdsx/bds/inventory";
import { CompoundTag, NBT, Tag } from "bdsx/bds/nbt";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { PlayerPermission } from "bdsx/bds/player";
import { serverInstance } from "bdsx/bds/server";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { CustomTrade, VillagerInteractEvent } from "..";
import { Player$setCarriedItem } from "./hacker";

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

const AIR_ITEM = ItemStack.constructWith("minecraft:air", 1);
events.serverLeave.on(() => {
    AIR_ITEM.destruct();
});

function allocateRecipeTag(
    buyItemA: ItemStack,
    buyItemB: ItemStack | null,
    destroy: boolean,
    priceMultiplifer: number,
    sellItem: ItemStack,
    tier: number,
    maxUses: number,
    traderExp: number = -1
): Tag {
    if (tier > 4) tier = 4;

    let rewardExp: boolean;
    if (traderExp > 0) {
        rewardExp = true;
    } else {
        rewardExp = false;
        traderExp = 0;
    }

    const buyATag = buyItemA.save();
    const sellTag = sellItem.save();

    const retTag: any = {
        buyA: buyATag,
        buyACount: buyATag.Count,
        buyBCount: NBT.int(0),
        sell: sellTag,
        demand: NBT.int(0),
        maxUses: maxUses,
        priceMultiplierA: priceMultiplifer,
        rewardExp: rewardExp,
        traderExp: traderExp,
        uses: NBT.int(0),
        tier: tier,
    };
    if (buyItemB) {
        const buyBTag = buyItemB.save();
        retTag.buyB = buyBTag;
        retTag.buyBCount = buyBTag.Count;
        destroy && buyItemB.destruct();
    }
    destroy && buyItemA.destruct();
    destroy && sellItem.destruct();

    return NBT.allocate(retTag);
}

CustomTrade.onVillagerInteract.on((ev) => {
    const player = ev.player;
    const ni = player.getNetworkIdentifier();
    const villager = ev.villager;
    const item = ev.item;
    if (!CustomTrade.IsWand(item)) return;
    if (player.getPermissionLevel() !== PlayerPermission.OPERATOR) {
        Player$setCarriedItem(player, AIR_ITEM);
        return;
    }
    // const OffersRecipes = villager.save().Offers.Recipes;
    const recipe1 = allocateRecipeTag(
        ItemStack.constructWith("minecraft:diamond", 3),
        null,
        true,
        0,
        ItemStack.constructWith("minecraft:emerald", 1),
        0,
        2147483647,
        10
    );
    console.log(recipe1);

    const villTag = villager.allocateAndSave();
    const list = NBT.allocate([recipe1, recipe1]);
    villTag.get<CompoundTag>("Offers")!.set("Recipes", list);
    list.dispose();
    villager.load(villTag);
    villTag.dispose();

    return CANCEL;
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
