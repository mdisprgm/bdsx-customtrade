import { RecipesMgmt } from ".";
import { CustomTrade } from "..";

export namespace VillagerTradeAPI {
    export const addRecipe = RecipesMgmt.addRecipe;
    export const addSimpleRecipe = RecipesMgmt.addSimpleRecipe;
    export const removeAllRecipes = RecipesMgmt.removeAllRecipes;
    export const allocateRecipeTag = CustomTrade.allocateRecipeTag;
    export const onVillagerInteract = CustomTrade.onVillagerInteract;

    export const RECIPE_MAX_TIER = CustomTrade.RECIPE_MAX_TIER;
    export const RECIPE_DEFAULT_TIER = CustomTrade.RECIPE_DEFAULT_TIER;
    export const RECIPE_MAX_USES = CustomTrade.RECIPE_MAX_USES;

    export const RECIPE_DEFAULT_TRADER_EXP =
        CustomTrade.RECIPE_DEFAULT_TRADER_EXP;

    export const RECIPE_DEFAULT_PRICE_MULTIPLIER =
        CustomTrade.RECIPE_DEFAULT_PRICE_MULTIPLIER;

    export const RECIPE_DEFAULT_DEMAND = CustomTrade.RECIPE_DEFAULT_DEMAND;
}
