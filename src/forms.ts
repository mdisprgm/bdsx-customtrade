import { Enchant } from "bdsx/bds/enchants";
import { FormDataCustom, FormDataSimple, FormItemInput } from "bdsx/bds/form";
import { TraderMgmt } from ".";
import { CustomTrade } from "..";
import utils from "./utils";

const VILLAGER_EDITOR_TITLE = "§l§aVillager Editor";

const Translate = CustomTrade.Translate;
export namespace EditorWindow {
    export enum MainMenuChoices {
        AddSimpleRecipe = 0,
        RemoveAllRecipes = 1,
        SetProperties = 2,
    }

    export const ChooseMenu: FormDataSimple = {
        type: "form",
        title: VILLAGER_EDITOR_TITLE,
        content: Translate("chooseMenu.chooseMenu"),
        buttons: [
            {
                text: Translate("chooseMenu.AddRecipe"),
                image: {
                    type: "path",
                    data: "textures/ui/MCoin",
                },
            },
            {
                text: Translate("chooseMenu.RemoveAllRecipes"),
                image: {
                    type: "path",
                    data: "textures/blocks/barrier",
                },
            },
            {
                text: Translate("chooseMenu.SetInvincibility"),
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
                text: Translate("removeAllRecipes.warning"),
            },
            {
                type: "toggle",
                text: Translate("removeAllRecipes.understand"),
            },
        ],
    };
    export const AddSimpleRecipe: FormDataCustom = {
        type: "custom_form",
        title: VILLAGER_EDITOR_TITLE,
        content: [
            {
                type: "input",
                text: Translate("addSimpleRecipe.input.buyA.itemName"),
            },
            {
                type: "slider",
                text: Translate("addSimpleRecipe.input.buyA.count"),
                max: 64,
                min: 1,
                default: 1,
            },
            {
                type: "input",
                text: Translate("addSimpleRecipe.input.buyB.itemName"),
            },
            {
                type: "slider",
                text: Translate("addSimpleRecipe.input.buyB.count"),
                max: 64,
                min: 1,
                default: 1,
            },
            {
                type: "input",
                text: Translate("addSimpleRecipe.input.sell.itemName"),
            },
            {
                type: "slider",
                text: Translate("addSimpleRecipe.input.sell.count"),
                max: 64,
                min: 1,
                default: 1,
            },
            {
                type: "toggle",
                text: Translate("addSimpleRecipe.input.enchanted"),
            },
        ],
    };

    export function createSetProperties(prop: TraderMgmt.Properties): FormDataCustom {
        return {
            type: "custom_form",
            title: VILLAGER_EDITOR_TITLE,
            content: [
                {
                    type: "input",
                    text: Translate("setProp.entity.name"),
                    default: prop.name,
                },
                {
                    type: "toggle",
                    text: Translate("setInvc.passive.nohurt"),
                    default: prop.noHurt,
                },
                {
                    type: "toggle",
                    text: Translate("setInvc.passive.nomovement"),
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
                text: Translate("setInvc.passive.nohurt"),
                default: false,
            },
            {
                type: "toggle",
                text: Translate("setInvc.passive.nomovement"),
                default: false,
            },
        ],
    };
    const MAX_ENCH_TYPE = Enchant.Type.SoulSpeed;
    const types = Object.keys(Enchant.Type).filter((v) => {
        const t = +v;
        return !isNaN(t) && t <= MAX_ENCH_TYPE;
    });
    const enchant_contents: FormItemInput[] = [];
    for (const type of types) {
        enchant_contents.push({
            type: "input",
            text: Translate("recipe.enchantments.levelOf", "%" + utils.translateEnchType(+type)) + "§a",
            placeholder: "Level",
        });
    }
    export function createEnchanting(itemStr: string): FormDataCustom {
        return {
            type: "custom_form",
            title: VILLAGER_EDITOR_TITLE,
            content: [
                {
                    type: "label",
                    text: Translate("recipe.enchantments.main", itemStr),
                },
                ...enchant_contents,
            ],
        };
    }
}
