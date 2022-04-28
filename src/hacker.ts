import { Item } from "bdsx/bds/inventory";
import { bool_t } from "bdsx/nativetype";
import { CustomTrade } from "..";

/**
 * @deprecated not finished yet.
 */
export const Item$setIsGlint = CustomTrade.hacker.hooking(
    "?setIsGlint@Item@@UEAAAEAV1@_N@Z",
    Item,
    null,
    Item,
    bool_t,
)((self, value) => {
    return Item$setIsGlint(self, value);
});
