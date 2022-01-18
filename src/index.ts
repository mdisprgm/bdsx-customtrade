import "./command";
import "./event";

import { Actor } from "bdsx/bds/actor";
import { Form } from "bdsx/bds/form";
import { ItemStack } from "bdsx/bds/inventory";
import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { PlayerPermission } from "bdsx/bds/player";
import { CANCEL } from "bdsx/common";
import { CustomTrade } from "..";
import { EditorWindow } from "./forms";
import { Player$setCarriedItem } from "./hacker";

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
    export function addRecipe(
        villager: Actor,
        buyAItem: ItemStack,
        priceMultiplierA: number,
        buyBItem: ItemStack,
        priceMultiplierB: number,
        sellItem: ItemStack,
        demand: number = CustomTrade.RECIPE_DEFAULT_DEMAND,
        traderExp: number = CustomTrade.RECIPE_DEFAULT_TRADER_EXP,
        maxUses: number = CustomTrade.RECIPE_MAX_USES /*MAX OF INT32 */,
        tier: number = CustomTrade.RECIPE_DEFAULT_TIER,
        destroy: boolean = true
    ) {
        if (!villager.ctxbase.isVaild() || !CustomTrade.IsValidTrader(villager))
            return;
        const B_IS_AIR = CustomTrade.IsAir(buyBItem);
        const recipe = CustomTrade.allocateRecipeTag(
            buyAItem, //buyA
            priceMultiplierA, //priceMultiplierA
            B_IS_AIR ? null : buyBItem,
            B_IS_AIR
                ? CustomTrade.RECIPE_DEFAULT_PRICE_MULTIPLIER
                : priceMultiplierB, //priceMultiplierB
            sellItem,
            demand,
            traderExp, //trade reward Exp
            maxUses, //max uses
            tier, //tier
            destroy //destroy parameters ItemStack
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
    export function addSimpleRecipe(
        villager: Actor,
        buyAItem: ItemStack,
        buyBItem: ItemStack,
        sellItem: ItemStack,
        destroy: boolean = true
    ) {
        if (!villager.ctxbase.isVaild() || !CustomTrade.IsValidTrader(villager))
            return;
        const B_IS_AIR = CustomTrade.IsAir(buyBItem);
        const recipe = CustomTrade.allocateRecipeTag(
            buyAItem, //buyA
            CustomTrade.RECIPE_DEFAULT_PRICE_MULTIPLIER, //priceMultiplierA
            B_IS_AIR ? null : buyBItem,
            CustomTrade.RECIPE_DEFAULT_PRICE_MULTIPLIER, //priceMultiplierB
            sellItem,
            CustomTrade.RECIPE_DEFAULT_DEMAND,
            CustomTrade.RECIPE_DEFAULT_TRADER_EXP, //trade reward Exp
            CustomTrade.RECIPE_MAX_USES, //max uses
            CustomTrade.RECIPE_DEFAULT_TIER, //tier
            destroy //destroy parameters ItemStack
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
        if (
            !villager.ctxbase.isVaild() ||
            CustomTrade.IsValidTrader(villager)
        ) {
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

                    const buyA = ItemStack.constructWith(
                        buyAItemName,
                        buyACount
                    );
                    const buyB = ItemStack.constructWith(
                        buyBItemName,
                        buyBCount
                    );
                    const sell = ItemStack.constructWith(
                        sellItemName,
                        sellCount
                    );
                    RecipesMgmt.addSimpleRecipe(
                        villager,
                        buyA,
                        buyB,
                        sell,
                        false
                    );
                    if (CustomTrade.IsAir(buyB, false)) {
                        CustomTrade.SendTranslated(
                            player,
                            "addRecipe.success",
                            `${buyA.getName()}`,
                            `${buyA.getAmount()}`,
                            `${sell.getName()}`,
                            `${sell.getAmount()}`
                        );
                    } else {
                        CustomTrade.SendTranslated(
                            player,
                            "addRecipe.buyB.success",
                            `${buyA.getName()}`,
                            `${buyA.getAmount()}`,
                            `${buyB.getName()}`,
                            `${buyB.getAmount()}`,
                            `${sell.getName()}`,
                            `${sell.getAmount()}`
                        );
                    }
                    buyA.destruct();
                    buyB.destruct();
                    sell.destruct();
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
