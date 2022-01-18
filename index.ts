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

export class VillagerInteractEvent {
    constructor(
        public player: ServerPlayer,
        public villager: Actor,
        public item: ItemStack
    ) {}
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
    export function IsVillager(entity: Actor) {
        return entity.getIdentifier() === VILLAGER;
    }
    export function allocateRecipeTag(
        buyItemA: ItemStack,
        priceMultiplierA: number,
        buyItemB: ItemStack | null,
        priceMultiplierB: number | null,
        destroy: boolean,
        sellItem: ItemStack,
        demand: number = 0,
        traderExp: number = 0,
        maxUses: number = 0x7fffffff,
        tier: number = 0
    ): Tag {
        if (tier > RECIPE_MAX_TIER) tier = RECIPE_MAX_TIER;

        let rewardExp: boolean;
        if (traderExp > 0) {
            rewardExp = true;
        } else {
            rewardExp = false;
            traderExp = 0;
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
            uses: NBT.int(0),
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

    export const onVillagerInteract = new Event<
        (event: VillagerInteractEvent) => void | CANCEL
    >();
}

events.serverLeave.on(() => {
    CustomTrade.AIR_ITEM.destruct();
});

const CONFIG = loadConfig();
if (!CONFIG.lang) {
    throw new Error("`lnag` is undefined in the config");
}
const lang = CONFIG.lang;
const f = fs.readFileSync(
    path.join(CustomTrade.DIRNAME, `./data/lang/${lang}.ini`),
    "utf8"
);

const __TRANSLATOR__ = ini.parse(f);
