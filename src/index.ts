import "./command";
import "./event";

import { PlayerPermission } from "bdsx/bds/player";
import { CANCEL } from "bdsx/common";
import { CustomTrade } from "..";
import { Player$setCarriedItem } from "./hacker";
import { Form } from "bdsx/bds/form";
import { EditorWindow } from "./forms";
import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { ItemStack } from "bdsx/bds/inventory";

async function openToChooseMenu(
    target: NetworkIdentifier
): Promise<number | null> {
    return await Form.sendTo(target, EditorWindow.ChooseMenu);
}

async function openToAddRecipe(
    target: NetworkIdentifier
): Promise<any[] | null> {
    return await Form.sendTo(target, EditorWindow.AddRecipe);
}

async function openToRemoveAllRecipes(
    target: NetworkIdentifier
): Promise<any[] | null> {
    return await Form.sendTo(target, EditorWindow.RemoveAllRecipes);
}

CustomTrade.onVillagerInteract.on((ev) => {
    const player = ev.player;
    const ni = player.getNetworkIdentifier();
    const villager = ev.villager;
    const item = ev.item;
    if (!CustomTrade.IsWand(item)) return;
    if (player.getPermissionLevel() !== PlayerPermission.OPERATOR) {
        Player$setCarriedItem(player, CustomTrade.AIR_ITEM);
        return;
    }
    if (!player.isSneaking()) {
        openToChooseMenu(ni).then((resp) => {
            if (resp === null) return;
            if (resp === EditorWindow.MainMenuChoices.AddRecipe) {
                openToAddRecipe(ni).then((resp) => {
                    if (resp === null) return;
                    const [
                        buyAItem,
                        buyACount,
                        buyBItem,
                        buyBCount,
                        sellItem,
                        sellCount,
                    ] = resp;

                    const buyBItemStack = ItemStack.constructWith(
                        buyBItem,
                        buyBCount
                    );
                    const recipe = CustomTrade.allocateRecipeTag(
                        ItemStack.constructWith(buyAItem, buyACount), //buyA
                        0, //priceMultiplierA
                        buyBItemStack.sameItem(CustomTrade.AIR_ITEM)
                            ? null
                            : buyBItemStack,
                        0, //priceMultiplierB
                        true, //destroy parameters ItemStack
                        ItemStack.constructWith(sellItem, sellCount), //sell
                        0, //tier
                        2147483647, //max uses
                        0 //trade reward Exp
                    );
                    if (recipe === null) return;
                    const villTag = villager.save();
                    const list = [recipe];
                    recipe.dispose();
                    villTag.Offers.Recipes.push(list[0]);
                    villager.load(villTag);
                });
            }
            if (resp === EditorWindow.MainMenuChoices.RemoveAllRecipes) {
                openToRemoveAllRecipes(ni).then((resp) => {
                    if (resp === null) return;
                    const [, confirmed] = resp;
                    if (!confirmed) return;

                    const villTag = villager.save();
                    villTag.Offers.Recipes = [];
                    villager.load(villTag);
                });
            }
        });
        return CANCEL;
    } else {
        return CANCEL;
    }
});
/**
 * Sample
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
