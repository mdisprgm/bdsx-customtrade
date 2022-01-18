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
import { Actor } from "bdsx/bds/actor";

namespace OpenTo {
    export async function ChooseMenu(
        target: NetworkIdentifier
    ): Promise<number | null> {
        return await Form.sendTo(target, EditorWindow.ChooseMenu);
    }

    export async function AddSimpleRecipe(
        target: NetworkIdentifier
    ): Promise<any[] | null> {
        return await Form.sendTo(target, EditorWindow.AddRecipe);
    }

    export async function RemoveAllRecipes(
        target: NetworkIdentifier
    ): Promise<any[] | null> {
        return await Form.sendTo(target, EditorWindow.RemoveAllRecipes);
    }
}

export namespace RecipesMgmt {
    export function addSimpleRecipe(
        villager: Actor,
        buyAItem: ItemStack,
        buyBItem: ItemStack,
        sellItem: ItemStack,
        destroy: boolean = true
    ) {
        if (!villager.ctxbase.isVaild() || !CustomTrade.IsVillager(villager))
            return;
        const recipe = CustomTrade.allocateRecipeTag(
            buyAItem, //buyA
            0, //priceMultiplierA
            buyBItem.sameItem(CustomTrade.AIR_ITEM) ? null : buyBItem,
            0, //priceMultiplierB
            true, //destroy parameters ItemStack
            sellItem,
            0, //tier
            2147483647, //max uses
            0 //trade reward Exp
        );

        const villTag = villager.save();
        const list = [recipe];
        villTag.Offers.Recipes.push(list[0]);
        villager.load(villTag);
        recipe.dispose();

        if (destroy) {
            buyAItem.destruct();
            buyBItem.destruct();
            sellItem.destruct();
        }
    }

    export function removeAllRecipes(villager: Actor) {
        if (!villager.ctxbase.isVaild() || CustomTrade.IsVillager(villager)) {
            const villTag = villager.save();
            villTag.Offers.Recipes = [];
            villager.load(villTag);
        }
    }
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
        OpenTo.ChooseMenu(ni).then((resp) => {
            if (resp === null) return;
            if (resp === EditorWindow.MainMenuChoices.AddRecipe) {
                OpenTo.AddSimpleRecipe(ni).then((resp) => {
                    if (resp === null) return;
                    const [
                        buyAItemName,
                        buyACount,
                        buyBItemName,
                        buyBCount,
                        sellItemName,
                        sellCount,
                    ] = resp;

                    RecipesMgmt.addSimpleRecipe(
                        villager,
                        ItemStack.constructWith(buyAItemName, buyACount),
                        ItemStack.constructWith(buyBItemName, buyBCount),
                        ItemStack.constructWith(sellItemName, sellCount)
                    );
                });
            }
            if (resp === EditorWindow.MainMenuChoices.RemoveAllRecipes) {
                OpenTo.RemoveAllRecipes(ni).then((resp) => {
                    if (resp === null) return;
                    const [, confirmed] = resp;
                    if (!confirmed) return;

                    RecipesMgmt.removeAllRecipes(villager);
                });
            }
        });
        return CANCEL;
    } /*
    else >>> src/command.ts
    */
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
