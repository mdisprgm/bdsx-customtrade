import { Actor, ActorFlags } from "bdsx/bds/actor";
import { Form } from "bdsx/bds/form";
import { ItemStack } from "bdsx/bds/inventory";
import { NBT } from "bdsx/bds/nbt";
import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { PlayerPermission } from "bdsx/bds/player";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { CustomTrade } from "..";
import "./command";
import { TraderCommand } from "./command";
import "./event";
import { EditorWindow } from "./forms";
import { Player$setCarriedItem } from "./hacker";

namespace OpenTo {
    export async function ChooseMenu(target: NetworkIdentifier): Promise<number | null> {
        return await Form.sendTo(target, EditorWindow.ChooseMenu);
    }

    export async function AddSimpleRecipe(target: NetworkIdentifier): Promise<any[] | null> {
        return await Form.sendTo(target, EditorWindow.AddSimpleRecipe);
    }

    export async function RemoveAllRecipes(target: NetworkIdentifier): Promise<any[] | null> {
        return await Form.sendTo(target, EditorWindow.RemoveAllRecipes);
    }

    export async function SetProperties(target: NetworkIdentifier, prop: TraderMgmt.Properties) {
        return await Form.sendTo(target, EditorWindow.createSetProperties(prop));
    }
}
export namespace TraderMgmt {
    export function isValidTrader(villager: Actor) {
        const id = villager.getIdentifier();
        const validId = id === CustomTrade.VILLAGER || id === CustomTrade.WANDERING_TRADER;
        return validId && villager.save().Offers?.Recipes !== undefined && villager.ctxbase.isValid();
    }

    export class Properties {
        name: string;
        noMovement: boolean;
        noHurt: boolean;
        constructor(name: string, noHurt: boolean, noMovement: boolean) {
            this.name = name;
            this.noHurt = noHurt;
            this.noMovement = noMovement;
        }
    }
    export namespace Invincbility {
        export const NoHurt = "Trader_NoHurt";
        export const NoMovement = "Trader_NoMovement";

        export const ATTR_KEY_MOVEMENT = "minecraft:movement";
        export const ATTR_KEY_HEALTH = "minecraft:health";

        export const MOVEMENT_SLOWED = 0;
        export const MOVEMENT_NORMAL = 0.5;

        export const NBT_MOVEMENT_SLOWED = NBT.float(MOVEMENT_SLOWED);
        export const NBT_MOVEMENT_NORMAL = NBT.float(MOVEMENT_NORMAL);
    }
    export async function addRecipe(
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
        destruct: boolean = true,
    ) {
        if (!villager.ctxbase.isValid() || !TraderMgmt.isValidTrader(villager)) return;
        const B_IS_AIR = CustomTrade.IsAir(buyBItem);
        const recipe = CustomTrade.allocateRecipeTag(
            buyAItem, //buyA
            priceMultiplierA, //priceMultiplierA
            B_IS_AIR ? null : buyBItem,
            B_IS_AIR ? CustomTrade.RECIPE_DEFAULT_PRICE_MULTIPLIER : priceMultiplierB, //priceMultiplierB
            sellItem,
            demand,
            traderExp, //trade reward Exp
            maxUses, //max uses
            tier, //tier
            destruct, //destroy parameters ItemStack
        );

        const villTag = villager.save();
        villTag.Offers.Recipes.push(recipe);

        villTag.Offers.TierExpRequirements = [{ "0": 0 }, { "1": 10 }, { "2": 70 }, { "3": 150 }, { "4": 250 }];

        villager.load(villTag);
        recipe.dispose();
        if (destruct) {
            buyAItem.destruct();
            buyBItem.destruct();
            sellItem.destruct();
        }
    }
    export function addSimpleRecipe(villager: Actor, buyAItem: ItemStack, buyBItem: ItemStack, sellItem: ItemStack, destruct: boolean = true) {
        if (!villager.ctxbase.isValid() || !TraderMgmt.isValidTrader(villager)) return;
        addRecipe(
            villager,
            buyAItem,
            CustomTrade.RECIPE_DEFAULT_PRICE_MULTIPLIER,
            buyBItem,
            CustomTrade.RECIPE_DEFAULT_PRICE_MULTIPLIER,
            sellItem,
            CustomTrade.RECIPE_DEFAULT_DEMAND,
            CustomTrade.RECIPE_DEFAULT_TRADER_EXP,
            CustomTrade.RECIPE_MAX_USES,
            CustomTrade.RECIPE_DEFAULT_TIER,
            destruct,
        );
    }

    export function removeRecipe(villager: Actor, index: number): boolean {
        if (!TraderMgmt.isValidTrader(villager)) return false;
        const villTag = villager.save();
        index = index | 0;
        if (index < 0 || villTag.Offers.Recipes.length - 1 < index) {
            return false;
        }

        villTag.Offers.Recipes.splice(index | 0, 1);
        villager.load(villTag);
        return true;
    }

    export function removeAllRecipes(villager: Actor): boolean {
        if (!TraderMgmt.isValidTrader(villager)) return false;
        const villTag = villager.save();
        villTag.Offers.Recipes = [];
        villager.load(villTag);
        return true;
    }

    function getAttributes(entity: Actor) {
        if (!TraderMgmt.isValidTrader(entity)) return;
        const villTag = entity.save();
        return villTag.Attributes;
    }
    function getAttribute(entity: Actor, key: string): Record<string, any> | null {
        if (!TraderMgmt.isValidTrader(entity)) return null;
        const attribute = getAttributes(entity).find((v: any) => {
            return v.Name === key;
        });
        return attribute ?? null;
    }
    export function setInvincibility(villager: Actor, nohurt: boolean, nomovement: boolean) {
        if (!villager.ctxbase.isValid() || !TraderMgmt.isValidTrader(villager)) return;

        if (nohurt) villager.addTag(TraderMgmt.Invincbility.NoHurt);
        else villager.removeTag(TraderMgmt.Invincbility.NoHurt);

        nomovement ? villager.addTag(TraderMgmt.Invincbility.NoMovement) : villager.removeTag(TraderMgmt.Invincbility.NoMovement);

        villager.setStatusFlag(ActorFlags.NoAI, nomovement);
    }
    export function getInvincibility(villager: Actor) {
        if (!villager.ctxbase.isValid() || !TraderMgmt.isValidTrader(villager)) return { NoHurt: false, NoMovement: false };
        return {
            NoHurt: villager.hasTag(TraderMgmt.Invincbility.NoHurt),
            NoMovement: villager.hasTag(TraderMgmt.Invincbility.NoMovement),
        };
    }
}

//Invincibiltiy
events.entityHurt.on((ev) => {
    if (ev.entity.hasTag(TraderMgmt.Invincbility.NoHurt)) {
        return CANCEL;
    }
});

events.entityCreated.on((ev) => {
    if (TraderMgmt.isValidTrader(ev.entity)) {
        const invc = TraderMgmt.getInvincibility(ev.entity);
        TraderMgmt.setInvincibility(ev.entity, invc.NoHurt, invc.NoMovement);
    }
});

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
            if (resp === EditorWindow.MainMenuChoices.AddSimpleRecipe) {
                OpenTo.AddSimpleRecipe(ni).then((resp) => {
                    if (resp === null) return;
                    const [buyAItemName, buyACount, buyBItemName, buyBCount, sellItemName, sellCount] = resp;

                    const buyA = ItemStack.constructWith(buyAItemName, buyACount);
                    const buyB = ItemStack.constructWith(buyBItemName, buyBCount);
                    const sell = ItemStack.constructWith(sellItemName, sellCount);
                    TraderMgmt.addSimpleRecipe(villager, buyA, buyB, sell, false);
                    TraderCommand.dynamicAddRecipeOutput(player, buyA, buyB, sell);
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

                    TraderMgmt.removeAllRecipes(villager);
                    CustomTrade.SendTranslated(player, "removeAllRecipes.success");
                });
            }
            if (resp === EditorWindow.MainMenuChoices.SetProperties) {
                const invc = TraderMgmt.getInvincibility(villager);
                OpenTo.SetProperties(ni, new TraderMgmt.Properties(villager.getName(), invc.NoHurt, invc.NoMovement)).then((resp) => {
                    if (resp === null) return;
                    const [Name, NoHurt, NoMovement] = resp;
                    if (!villager.ctxbase.isValid()) return;
                    TraderMgmt.setInvincibility(villager, NoHurt, NoMovement);
                    villager.setNameTag(Name);
                    CustomTrade.SendTranslated(player, "command.properties.success", Name, NoHurt, NoMovement);
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
