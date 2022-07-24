import { Enchant } from "bdsx/bds/enchants";

type Keys = keyof typeof Enchant.Type;
type ToText = Record<Keys, string>;

const EnchToTxt: ToText = {
    ArmorAll: "protect.all",
    ArmorFire: "protect.fire",
    ArmorFall: "protect.fall",
    ArmorExplosive: "protect.explosion",
    ArmorProjectile: "protect.projectile",
    ArmorThorns: "thorns",
    WaterBreath: "oxygen",
    WaterSpeed: "waterWalker",
    WaterAffinity: "waterWorker",
    WeaponDamage: "damage.all",
    WeaponUndead: "damage.undead",
    WeaponArthropod: "damage.arthropods",
    WeaponKnockback: "knockback",
    WeaponFire: "fire",
    WeaponLoot: "lootBonus",
    MiningEfficiency: "digging",
    MiningSilkTouch: "untouching",
    MiningDurability: "durability",
    MiningLoot: "lootBonusDigger",
    BowDamage: "arrowDamage",
    BowKnockback: "arrowKnockback",
    BowFire: "arrowFire",
    BowInfinity: "arrowInfinite",
    FishingLoot: "lootBonusFishing",
    FishingLure: "fishingSpeed",
    FrostWalker: "frostwalker",
    Mending: "mending",
    CurseBinding: "curse.binding",
    CurseVanishing: "curse.vanishing",
    TridentImpaling: "tridentImpaling",
    TridentRiptide: "tridentRiptide",
    TridentLoyalty: "tridentLoyalty",
    TridentChanneling: "tridentChanneling",
    CrossbowMultishot: "crossbowMultishot",
    CrossbowPiercing: "crossbowPiercing",
    CrossbowQuickCharge: "crossbowQuickCharge",
    SoulSpeed: "soul_speed",
    NumEnchantments: "N",
    InvalidEnchantment: "invalid",
};

function translateEnchType(type: Enchant.Type): string {
    const ench = "enchantment.";
    const _type = Enchant.Type[type];
    return ench + (EnchToTxt[_type as Keys] ?? _type);
}

export default { translateEnchType };
