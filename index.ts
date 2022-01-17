import { events } from "bdsx/event";
import { bedrockServer } from "bdsx/launcher";
import { ProcHacker } from "bdsx/prochacker";
import { UNDNAME_NAME_ONLY } from "bdsx/dbghelp";

import path = require("path");
import { ItemStack } from "bdsx/bds/inventory";
import { Event } from "bdsx/eventtarget";
import { CANCEL } from "bdsx/common";
import { ServerPlayer } from "bdsx/bds/player";
import { Actor } from "bdsx/bds/actor";

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

export class VillagerInteractEvent {
    constructor(
        public player: ServerPlayer,
        public villager: Actor,
        public item: ItemStack
    ) {}
}

export namespace CustomTrade {
    export const DIRNAME = __dirname;
    export const hacker = ProcHacker.load(
        path.join(CustomTrade.DIRNAME, "./hacker.ini"),
        ["Item::setIsGlint", "Player::setCarriedItem"],
        UNDNAME_NAME_ONLY
    );
    export function IsWand(item: ItemStack): boolean {
        const tag = item.save();
        return tag.tag?.IsCustomTradeWand ?? false;
    }

    export const onVillagerInteract = new Event<
        (event: VillagerInteractEvent) => void | CANCEL
    >();
}
