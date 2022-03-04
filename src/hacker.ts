import { Item, ItemStack } from "bdsx/bds/inventory";
import { Player } from "bdsx/bds/player";
import { pdb } from "bdsx/core";
import { bool_t, void_t } from "bdsx/nativetype";
import { CustomTrade } from "..";

/**
 * @deprecated doesn't work yet
 */
export const Item$setIsGlint = CustomTrade.hacker.hooking(
    "Item::setIsGlint",
    void_t,
    null,
    Item,
    bool_t,
)((self, value) => {
    return Item$setIsGlint(self, value);
});

export const Player$setCarriedItem = CustomTrade.hacker.hooking(
    "Player::setCarriedItem",
    void_t,
    null,
    Player,
    ItemStack,
)((self, item) => {
    return Player$setCarriedItem(self, item);
});
pdb.close();
