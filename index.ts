import "bdsx/bds/implements";
import { ItemStack } from "bdsx/bds/inventory";
import { ByteTag, CompoundTag, NBT, Tag } from "bdsx/bds/nbt";
import { ServerPlayer } from "bdsx/bds/player";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { Event } from "bdsx/eventtarget";
import { bedrockServer } from "bdsx/launcher";
import { procHacker } from "bdsx/prochacker";
import * as fs from "fs";
import * as ini from "ini";
import * as path from "path";
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
        const f = fs.readFileSync(path.join(__dirname, "./config.json"), "utf8");
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
        for (let i = 0; i < args.length; i++) {
            const idx = str.lastIndexOf(FORMAT_SPECIFIER);
            if (idx < 0) return str;
            str = str.replace(FORMAT_SPECIFIER, args[i]);
        }
        return str;
    }
    export function SendTranslated(player: ServerPlayer, key: string, ...args: any[]) {
        const message = Translate(key, ...args);
        player.sendMessage(message);
    }

    export const hacker = procHacker;
    export function IsWand(item: ItemStack): boolean {
        const tag = item.allocateAndSave();
        const data = tag.get<CompoundTag>("tag")?.get<ByteTag>("IsCustomTradeWand")?.data;
        const ret = Boolean(data);
        tag.dispose();
        return ret;
    }
    export const VILLAGER: EntityId = "minecraft:villager_v2";
    export const WANDERING_TRADER: EntityId = "minecraft:wandering_trader";

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
     * @param destruct whether destruct the `ItemStack` instances in parameters
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
        destruct: boolean = true,
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
            if (destruct) buyItemB.destruct();
        }
        if (destruct) {
            buyItemA.destruct();
            sellItem.destruct();
        }

        return NBT.allocate(retTag);
    }

    /**
     * @param item Item to check
     * @param destruct If the Item will be destructed
     * @returns If the Item is the `minecraft:air`
     */
    export function IsAir(item: ItemStack, destruct: boolean = false): boolean {
        const isAir = item.getId() === 0;
        if (destruct) item.destruct();
        return isAir;
    }

    export const onVillagerInteract = new Event<(event: VillagerInteractEvent) => void | CANCEL>();
}

const CONFIG = loadConfig();
if (!CONFIG.lang) {
    throw new Error("`lang` is undefined in the config");
}
const langFile = CONFIG.lang;
const langDB = fs.readFileSync(path.join(CustomTrade.DIRNAME, `./data/lang/${langFile}.ini`), "utf8");

const __TRANSLATOR__ = ini.parse(langDB);
