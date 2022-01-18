import { RecipesMgmt } from ".";
import { CustomTrade } from "..";

export namespace VillagerTradeAPI {
    export const addRecipe = RecipesMgmt.addSimpleRecipe;
    export const removeAllRecipes = RecipesMgmt.removeAllRecipes;
    export const allocateRecipeTag = CustomTrade.allocateRecipeTag;
    export const onVillagerInteract = CustomTrade.onVillagerInteract;
}