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
    export const DIRNAME = __dirname;

    export function Translate(key: string): string {
        const value: string = __TRANSLATOR__[key];
        if (value === undefined) return key;
        return String(value).replace(/\\n/g, "\n");
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
    export function allocateRecipeTag(
        buyItemA: ItemStack,
        priceMultipliferA: number,
        buyItemB: ItemStack | null,
        priceMultipliferB: number | null,
        destroy: boolean,
        sellItem: ItemStack,
        tier: number,
        maxUses: number,
        traderExp: number = -1
    ): Tag {
        console.log(CustomTrade.AIR_ITEM.getName());
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
            demand: NBT.int(0),
            maxUses: maxUses,
            priceMultiplierA: priceMultipliferA,
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
            retTag.priceMultiplierB = priceMultipliferB ?? 0;
            destroy && buyItemB.destruct();
        }
        destroy && buyItemA.destruct();
        destroy && sellItem.destruct();

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
