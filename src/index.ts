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
import { TraderCommand } from "./command";
import { events } from "bdsx/event";

import { NBT } from "bdsx/bds/nbt";

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

    export async function SetProperties(
        target: NetworkIdentifier,
        prop: TraderMgmt.Properties
    ) {
        return await Form.sendTo(
            target,
            EditorWindow.createSetProperties(prop)
        );
    }
}
export namespace TraderMgmt {
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
        if (!villager.ctxbase.isVaild() || !CustomTrade.IsValidTrader(villager))
            return;
        const villTag = villager.save();
        villTag.Offers.Recipes = [];
        villager.load(villTag);
    }

    function getAttribute(entity: Actor, key: string) {
        if (!CustomTrade.IsValidTrader(entity)) return;
        const villTag = entity.save();
        const attribute = villTag.Attributes.find((v: any) => {
            return v.Name === key;
        });
        return attribute;
    }
    function getAttributes(entity: Actor) {
        if (!CustomTrade.IsValidTrader(entity)) return;
        const villTag = entity.save();
        return villTag.Attributes;
    }
    export function setInvincibility(
        villager: Actor,
        nohurt: boolean,
        nomovement: boolean
    ) {
        if (!villager.ctxbase.isVaild() || !CustomTrade.IsValidTrader(villager))
            return;
        if (nohurt) villager.addTag(TraderMgmt.Invincbility.NoHurt);
        else villager.removeTag(TraderMgmt.Invincbility.NoHurt);

        const villTag = villager.save();
        const movement = villTag.Attributes.find((v: any) => {
            return v.Name === TraderMgmt.Invincbility.ATTR_KEY_MOVEMENT;
        });

        if (nomovement) {
            movement.Current = TraderMgmt.Invincbility.NBT_MOVEMENT_SLOWED;
        } else movement.Current = TraderMgmt.Invincbility.NBT_MOVEMENT_NORMAL;
        villager.load(villTag);
    }
    export function getInvincibility(villager: Actor) {
        if (!villager.ctxbase.isVaild() || !CustomTrade.IsValidTrader(villager))
            return { NoHurt: false, NoMovement: false };
        return {
            NoHurt: villager.hasTag(TraderMgmt.Invincbility.NoHurt),
            NoMovement:
                getAttribute(
                    villager,
                    TraderMgmt.Invincbility.ATTR_KEY_MOVEMENT
                ).Current < TraderMgmt.Invincbility.MOVEMENT_NORMAL,
        };
    }
}

//Invincibiltiy
events.entityHurt.on((ev) => {
    if (ev.entity.hasTag(TraderMgmt.Invincbility.NoHurt)) {
        return CANCEL;
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
                    TraderMgmt.addSimpleRecipe(
                        villager,
                        buyA,
                        buyB,
                        sell,
                        false
                    );
                    TraderCommand.dynamicAddRecipeOutput(
                        player,
                        buyA,
                        buyB,
                        sell
                    );
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
                });
            }
            if (resp === EditorWindow.MainMenuChoices.SetProperties) {
                const invc = TraderMgmt.getInvincibility(villager);
                OpenTo.SetProperties(
                    ni,
                    new TraderMgmt.Properties(
                        villager.getName(),
                        invc.NoHurt,
                        invc.NoMovement
                    )
                ).then((resp) => {
                    if (resp === null) return;
                    const [name, NoHurt, NoMovement] = resp;
                    if (!villager.ctxbase.isVaild()) return;
                    TraderMgmt.setInvincibility(villager, NoHurt, NoMovement);
                    villager.setNameTag(name);
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
