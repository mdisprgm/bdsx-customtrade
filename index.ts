import { events } from "bdsx/event";
import { bedrockServer } from "bdsx/launcher";
import { ProcHacker } from "bdsx/prochacker";
import { UNDNAME_NAME_ONLY } from "bdsx/dbghelp";
import { Event } from "bdsx/eventtarget";
import { CANCEL } from "bdsx/common";
import { ServerPlayer } from "bdsx/bds/player";
import { Actor } from "bdsx/bds/actor";
import { ItemStack } from "bdsx/bds/inventory";
import { NBT, Tag } from "bdsx/bds/nbt";

import path = require("path");
import fs = require("fs");
import ini = require("ini");

import "bdsx/bds/implements";
import { VillagerInteractEvent } from "./src/event";

console.log("[CustomTrade] allocated");

events.serverOpen.on(() => {
    console.log("[CustomTrade] launching");
});

events.serverClose.on(() => {
    console.log("[CustomTrade] closed");
});

bedrockServer.afterOpen().then(() => {
    require("./src");
});

function loadConfig() {
    try {
        const f = fs.readFileSync(
            path.join(__dirname, "./config.json"),
            "utf8"
        );
        return JSON.parse(f);
    } catch (err) {
        throw err;
    }
}

export namespace CustomTrade {
    export const RECIPE_MAX_TIER = 4;
    export const RECIPE_DEFAULT_TIER = 0;
    export const RECIPE_MAX_USES = 0x7fffffff;
    export const RECIPE_DEFAULT_TRADER_EXP = 0;
    export const RECIPE_DEFAULT_PRICE_MULTIPLIER = 0;
    export const RECIPE_DEFAULT_DEMAND = 0;

    export const DIRNAME = __dirname;

    const FORMAT_SPECIFIER = "%v";
    export function Translate(key: string, ...args: any[]): string {
        const raw: string | undefined = __TRANSLATOR__[key];
        if (raw === undefined) return key;
        let str = String(raw).replace(/\\n/g, "\n");
        for (let i = 0; i < args.length; ) {
            const idx = str.lastIndexOf(FORMAT_SPECIFIER);
            if (idx < 0) return str;
            str = str.replace(FORMAT_SPECIFIER, args[i++]);
        }
        return str;
    }

    export const hacker = ProcHacker.load(
        path.join(CustomTrade.DIRNAME, "./hacker.ini"),
        ["Item::setIsGlint", "Player::setCarriedItem"],
        UNDNAME_NAME_ONLY
    );
    export function IsWand(item: ItemStack): boolean {
        const tag = item.save();
        return tag.tag?.IsCustomTradeWand ?? false;
    }
    export const VILLAGER = "minecraft:villager_v2";
    export const WANDERING_TRADER = "minecraft:wandering_trader";
    export function IsValidTrader(entity: Actor): boolean {
        const id = entity.getIdentifier();
        const validEntity = id === VILLAGER || id === WANDERING_TRADER;
        return validEntity && entity.save().Offers?.Recipes;
    }
    /**
     * @deprecated Use IsValidTrader
     */
    export const IsVillager = IsValidTrader;

    /**
     *
     * @param buyItemA buyA
     * @param priceMultiplierA multiplier for buyA
     * @param buyItemB buyB
     * @param priceMultiplierB multiplier for buyB
     * @param sellItem sell item
     * @param demand demand for the item
     * @param traderExp trader exp
     * @param maxUses max of uses
     * @param tier tier of the recipe
     * @param destroy wheter destroy the `ItemStack` instances in parameters
     * @returns allocated recipe tag
     */
    export function allocateRecipeTag(
        buyItemA: ItemStack,
        priceMultiplierA: number,
        buyItemB: ItemStack | null,
        priceMultiplierB: number | null,
        sellItem: ItemStack,
        demand: number = RECIPE_DEFAULT_DEMAND,
        traderExp: number = RECIPE_DEFAULT_TRADER_EXP,
        maxUses: number = RECIPE_MAX_USES,
        tier: number = RECIPE_DEFAULT_TIER,
        destroy: boolean = true
    ): Tag {
        if (tier > RECIPE_MAX_TIER) tier = RECIPE_MAX_TIER;

        let rewardExp: boolean;
        if (traderExp > RECIPE_DEFAULT_TIER) {
            rewardExp = true;
        } else {
            rewardExp = false;
            traderExp = RECIPE_DEFAULT_TIER;
        }

        const buyATag = buyItemA.save();
        const sellTag = sellItem.save();

        const retTag: any = {
            buyA: buyATag,
            buyACount: buyATag.Count,
            buyBCount: NBT.int(0),
            sell: sellTag,
            demand: NBT.int(demand),
            maxUses: maxUses,
            priceMultiplierA: priceMultiplierA,
            priceMultiplierB: NBT.float(0),
            rewardExp: rewardExp,
            traderExp: traderExp,
            uses: NBT.int(tier),
            tier: tier,
        };
        if (buyItemB) {
            const buyBTag = buyItemB.save();
            retTag.buyB = buyBTag;
            retTag.buyBCount = buyBTag.Count;
            retTag.priceMultiplierB = priceMultiplierB ?? 0;
            if (destroy) buyItemB.destruct();
        }
        if (destroy) {
            buyItemA.destruct();
            sellItem.destruct();
        }

        return NBT.allocate(retTag);
    }
    export const AIR_ITEM = ItemStack.constructWith("minecraft:air", 1);

    /**
     * @param item Item to check
     * @param destroy If the Item will be destructed
     * @returns If the Item is the `minecraft:air`
     */
    export function IsAir(item: ItemStack, destroy: boolean = true): boolean {
        const isAir = item.sameItem(AIR_ITEM);
        if (destroy) item.destruct();
        return isAir;
    }

    export const onVillagerInteract = new Event<
        (event: VillagerInteractEvent) => void | CANCEL
    >();
}

events.serverLeave.on(() => {
    CustomTrade.AIR_ITEM.destruct();
});

const CONFIG = loadConfig();
if (!CONFIG.lang) {
    throw new Error("`lang` is undefined in the config");
}
const lang = CONFIG.lang;
const f = fs.readFileSync(
    path.join(CustomTrade.DIRNAME, `./data/lang/${lang}.ini`),
    "utf8"
);

const __TRANSLATOR__ = ini.parse(f);
