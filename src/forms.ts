import { FormDataCustom, FormDataSimple } from "bdsx/bds/form";
import { TraderMgmt } from ".";
import { CustomTrade } from "..";

const VILLAGER_EDITOR_TITLE = "§l§aVillager Editor";
export namespace EditorWindow {
    export enum MainMenuChoices {
        AddSimpleRecipe = 0,
        RemoveAllRecipes = 1,
        SetProperties = 2,
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
    export const AddSimpleRecipe: FormDataCustom = {
        type: "custom_form",
        title: VILLAGER_EDITOR_TITLE,
        content: [
            {
                type: "input",
                text: CustomTrade.Translate("addSimpleRecipe.input.buyA.itemName"),
            },
            {
                type: "slider",
                text: CustomTrade.Translate("addSimpleRecipe.input.buyA.count"),
                max: 64,
                min: 1,
                default: 1,
            },
            {
                type: "input",
                text: CustomTrade.Translate("addSimpleRecipe.input.buyB.itemName"),
            },
            {
                type: "slider",
                text: CustomTrade.Translate("addSimpleRecipe.input.buyB.count"),
                max: 64,
                min: 1,
                default: 1,
            },
            {
                type: "input",
                text: CustomTrade.Translate("addSimpleRecipe.input.sell.itemName"),
            },
            {
                type: "slider",
                text: CustomTrade.Translate("addSimpleRecipe.input.sell.count"),
                max: 64,
                min: 1,
                default: 1,
            },
        ],
    };

    export function createSetProperties(
        prop: TraderMgmt.Properties
    ): FormDataCustom {
        return {
            type: "custom_form",
            title: VILLAGER_EDITOR_TITLE,
            content: [
                {
                    type: "input",
                    text: CustomTrade.Translate("setProp.entity.name"),
                    default: prop.name,
                },
                {
                    type: "toggle",
                    text: CustomTrade.Translate("setInvc.passive.nohurt"),
                    default: prop.noHurt,
                },
                {
                    type: "toggle",
                    text: CustomTrade.Translate("setInvc.passive.nomovement"),
                    default: prop.noMovement,
                },
            ],
        };
    }
    /**
     * @deprecated WILL BE DELETED. Use {@link createSetProperties}
     */
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
