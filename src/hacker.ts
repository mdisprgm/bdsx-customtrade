import { Item } from "bdsx/bds/inventory";
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
