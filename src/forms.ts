import { FormDataCustom, FormDataSimple } from "bdsx/bds/form";
import { CustomTrade } from "..";

const VILLAGER_EDITOR_TITLE = "§l§aVillager Editor";
export namespace EditorWindow {
    export enum MainMenuChoices {
        AddRecipe = 0,
        RemoveAllRecipes = 1,
        SetInvincibility,
    }

    export const ChooseMenu: FormDataSimple = {
        type: "form",
        title: VILLAGER_EDITOR_TITLE,
        content: CustomTrade.Translate("chooseMenu.chooseMenu"),
        buttons: [
            {
                text: CustomTrade.Translate("chooseMenu.AddRecipe"),
                image: {
                    type: "path",
                    data: "textures/ui/MCoin",
                },
            },
            {
                text: CustomTrade.Translate("chooseMenu.RemoveAllRecipes"),
                image: {
                    type: "path",
                    data: "textures/blocks/barrier",
                },
            },
            {
                text: CustomTrade.Translate("chooseMenu.SetInvincibility"),
                image: {
                    type: "path",
                    data: "textures/items/turtle_helmet",
                },
            },
        ],
    };
    export const RemoveAllRecipes: FormDataCustom = {
        type: "custom_form",
        title: VILLAGER_EDITOR_TITLE,
        content: [
            {
                type: "label",
                text: CustomTrade.Translate("removeAllRecipes.warning"),
            },
            {
                type: "toggle",
                text: CustomTrade.Translate("removeAllRecipes.understand"),
            },
        ],
    };
    export const AddRecipe: FormDataCustom = {
        type: "custom_form",
        title: VILLAGER_EDITOR_TITLE,
        content: [
            {
                type: "input",
                text: CustomTrade.Translate("addRecipe.input.buyA.itemName"),
            },
            {
                type: "slider",
                text: CustomTrade.Translate("addRecipe.input.buyA.count"),
                max: 64,
                min: 1,
                default: 1,
            },
            {
                type: "input",
                text: CustomTrade.Translate("addRecipe.input.buyB.itemName"),
            },
            {
                type: "slider",
                text: CustomTrade.Translate("addRecipe.input.buyB.count"),
                max: 64,
                min: 1,
                default: 1,
            },
            {
                type: "input",
                text: CustomTrade.Translate("addRecipe.input.sell.itemName"),
            },
            {
                type: "slider",
                text: CustomTrade.Translate("addRecipe.input.sell.count"),
                max: 64,
                min: 1,
                default: 1,
            },
        ],
    };
    export const SetInvincibility: FormDataCustom = {
        type: "custom_form",
        title: VILLAGER_EDITOR_TITLE,
        content: [
            {
                type: "toggle",
                text: CustomTrade.Translate("setInvc.passive.nohurt"),
                default: false,
            },
            {
                type: "toggle",
                text: CustomTrade.Translate("setInvc.passive.nomovement"),
                default: false,
            },
        ],
    };
}
