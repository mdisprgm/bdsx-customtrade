import { Enchant } from "bdsx/bds/enchants";

function translateEnchType(type: Enchant.Type): string {
    const ench = "enchantment.";
    switch (type) {
        case Enchant.Type.ArmorAll: {
            return ench + "protect.all";
        }
        case Enchant.Type.ArmorFire: {
            return ench + "protect.fire";
        }
        case Enchant.Type.ArmorFall: {
            return ench + "protect.fall";
        }
        case Enchant.Type.ArmorExplosive: {
            return ench + "protect.explosion";
        }
        case Enchant.Type.ArmorProjectile: {
            return ench + "protect.projectile";
        }
        case Enchant.Type.ArmorThorns: {
            return ench + "thorns";
        }
        case Enchant.Type.WaterBreath: {
            return ench + "oxygen";
        }
        case Enchant.Type.WaterSpeed: {
            return ench + "waterWalker";
        }
        case Enchant.Type.WaterAffinity: {
            return ench + "waterWorker";
        }
        case Enchant.Type.WeaponDamage: {
            return ench + "damage.all";
        }
        case Enchant.Type.WeaponUndead: {
            return ench + "damage.undead";
        }
        case Enchant.Type.WeaponArthropod: {
            return ench + "damage.arthropods";
        }
        case Enchant.Type.WeaponKnockback: {
            return ench + "knockback";
        }
        case Enchant.Type.WeaponFire: {
            return ench + "fire";
        }
        case Enchant.Type.WeaponLoot: {
            return ench + "lootBonus";
        }
        case Enchant.Type.MiningEfficiency: {
            return ench + "digging";
        }
        case Enchant.Type.MiningSilkTouch: {
            return ench + "untouching";
        }
        case Enchant.Type.MiningDurability: {
            return ench + "durability";
        }
        case Enchant.Type.MiningLoot: {
            return ench + "lootBonusDigger";
        }
        case Enchant.Type.BowDamage: {
            return ench + "arrowDamage";
        }
        case Enchant.Type.BowKnockback: {
            return ench + "arrowKnockback";
        }
        case Enchant.Type.BowFire: {
            return ench + "arrowFire";
        }
        case Enchant.Type.BowInfinity: {
            return ench + "arrowInfinite";
        }
        case Enchant.Type.FishingLoot: {
            return ench + "lootBonusFishing";
        }
        case Enchant.Type.FishingLure: {
            return ench + "fishingSpeed";
        }
        case Enchant.Type.FrostWalker: {
            return ench + "frostwalker";
        }
        case Enchant.Type.Mending: {
            return ench + "mending";
        }
        case Enchant.Type.CurseBinding: {
            return ench + "curse.binding";
        }
        case Enchant.Type.CurseVanishing: {
            return ench + "curse.vanishing";
        }
        case Enchant.Type.TridentImpaling: {
            return ench + "tridentImpaling";
        }
        case Enchant.Type.TridentRiptide: {
            return ench + "tridentRiptide";
        }
        case Enchant.Type.TridentLoyalty: {
            return ench + "tridentLoyalty";
        }
        case Enchant.Type.TridentChanneling: {
            return ench + "tridentChanneling";
        }
        case Enchant.Type.CrossbowMultishot: {
            return ench + "crossbowMultishot";
        }
        case Enchant.Type.CrossbowPiercing: {
            return ench + "crossbowPiercing";
        }
        case Enchant.Type.CrossbowQuickCharge: {
            return ench + "crossbowQuickCharge";
        }
        case Enchant.Type.SoulSpeed: {
            return ench + "soul_speed";
        }
    }
    return Enchant.Type[type];
}

export default { translateEnchType };
