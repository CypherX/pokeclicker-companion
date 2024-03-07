const settings = {
    xAttackEnabled: ko.observable(false),
    yellowFluteEnabled: ko.observable(false),
    weather: ko.observable(WeatherType.Clear),
    hideCompleted: ko.observable(true),
};


let baseGymList = undefined;
const gymList = ko.pureComputed(() => {
    if (!SaveData.isDamageLoaded()) {
        return [];
    }

    if (!baseGymList) {
        baseGymList = [];
        GameConstants.RegionGyms.forEach((gyms, region) => {
            if (region > GameConstants.MAX_AVAILABLE_REGION) {
                return;
            }
    
            if (region == GameConstants.Region.alola) {
                gyms = gyms.filter(g => !g.endsWith(' Trial'));
            }
    
            baseGymList.push({
                region: region,
                gyms: gyms
            });
        });

        Companion.data.GymListOverride.forEach((g) => baseGymList.push({...g}));
        baseGymList = baseGymList.sort((a, b) => a.region - b.region)
            .flatMap(rg => rg.gyms.map(g => {
                const gym = GymList[g];
                gym.region = rg.region;
                return gym;
            }));
    }

    const gymsDefeated = SaveData.file().save.statistics.gymsDefeated;
    const gymList = baseGymList.filter(g => {
        if (!Companion.settings.showAllRegions() && g.region > player.highestRegion()) {
            return false;
        }

        if (g.region > GameConstants.MAX_AVAILABLE_REGION) {
            return false;
        }

        if (settings.hideCompleted() && gymsDefeated[GameConstants.getGymIndex(g.town)] > 0) {
            return false;
        }

        return true;
    });

    return gymList;
});

const tempBattleList = ko.pureComputed(() => {
    if (!SaveData.isDamageLoaded()) {
        return [];
    }

    const temporaryBattleDefeated = SaveData.file().save.statistics.temporaryBattleDefeated;
    return Object.values(TemporaryBattleList).filter(tb => {
        if (!Companion.settings.showAllRegions() && tb.getTown().region > player.highestRegion()) {
            return false;
        }

        if (tb.getTown().region > GameConstants.MAX_AVAILABLE_REGION) {
            return false;
        }

        if (settings.hideCompleted() && temporaryBattleDefeated[GameConstants.getTemporaryBattlesIndex(tb.name)] > 0) {
            return false;
        }

        return true;
    });
});

const getBattleData = ko.pureComputed(() => {
    const battleData = {
        gyms: [],
        tempBattles: [],
    };

    if (!SaveData.isDamageLoaded()) {
        return battleData;
    }

    // xAttack
    player.effectList['xAttack'](settings.xAttackEnabled() ? 1 : 0);

    // Yellow Flute
    if (settings.yellowFluteEnabled() != FluteEffectRunner.isActive('Yellow_Flute')()) {
        FluteEffectRunner.toggleEffect('Yellow_Flute');
    }

    damageCache.clear();
    const gymsDefeated = SaveData.file().save.statistics.gymsDefeated;
    const temporaryBattleDefeated = SaveData.file().save.statistics.temporaryBattleDefeated;

    // gyms
    const gymBattles = [...gymList()];
    gymBattles.forEach(g => {
        if (!g.pokemonList) {
            g.pokemonList = g.getPokemonList();
        }

        const town = TownList[g.parent?.name ?? g.town];
        g.townObj = town;

        g.isCompleted = gymsDefeated[GameConstants.getGymIndex(g.town)] > 0;
        g.secondsToWin = 0;

        g.pokemonList.forEach(p => {
            const damage = calcPokemonDamage(p.name, town.region, town.subRegion ?? 0);
            p.partyDamage = damage;
            p.secondsToDefeat = Math.max(1, Math.ceil(p.maxHealth / damage));
            g.secondsToWin += p.secondsToDefeat;
        });
    });

    battleData.gyms = gymBattles;

    // temp battles
    const tempBattles = [...tempBattleList()];
    tempBattles.forEach(tb => {
        if (!tb.pokemonList) {
            tb.pokemonList = tb.getPokemonList();
        }

        const town = tb.getTown();

        tb.isCompleted = temporaryBattleDefeated[GameConstants.getTemporaryBattlesIndex(tb.name)] > 0;
        tb.secondsToWin = 0;

        tb.pokemonList.forEach(p => {
            const damage = calcPokemonDamage(p.name, town.region, town.subRegion ?? 0);
            p.partyDamage = damage;
            p.secondsToDefeat = Math.max(1, Math.ceil(p.maxHealth / damage));
            tb.secondsToWin += p.secondsToDefeat;
        });
    });

    battleData.tempBattles = tempBattles;

    return battleData;
}).extend({ rateLimit: 50 });

const damageCache = new Map();
const calcPokemonDamage = (pokemonName, battleRegion, battleSubRegion) => {
    const pokemon = pokemonMap[pokemonName];
    const type1 = pokemon.type[0];
    const type2 = pokemon.type[1] ?? PokemonType.None;

    let damageCacheKey = `${battleRegion}|${type1}|${type2}`;
    if (battleRegion == GameConstants.Region.alola && battleSubRegion == GameConstants.AlolaSubRegions.MagikarpJump) {
        damageCacheKey = `${damageCacheKey}|mkj`;
    }

    let damage = damageCache.get(damageCacheKey);
    if (damage === undefined) {
        damage = calcPartyAttack(type1, type2, battleRegion, settings.weather(), battleRegion, battleSubRegion);
        damageCache.set(damageCacheKey, damage);
    }

    return damage;
}

// slightly modified Party.calculatePokemonAttack() to allow overriding the player region
const calcPartyAttack = (type1, type2, region, weather, playerRegion = 0, playerSubRegion = 0) => {
    let attack = 0;
    for (const pokemon of App.game.party.caughtPokemon) {
        if (region == GameConstants.Region.alola && playerRegion == GameConstants.Region.alola && playerSubRegion == GameConstants.AlolaSubRegions.MagikarpJump
            && Math.floor(pokemon.id) != 129) {
            // Only magikarps can attack in magikarp jump
            continue;
        }
        attack += App.game.party.calculateOnePokemonAttack(pokemon, type1, type2, region, false, true, false, weather, true, true);
    }

    const bonus = App.game.party.multiplier.getBonus('pokemonAttack');
    return Math.round(attack * bonus);
};

const initialize = () => {
    SaveData.file.subscribe((file) => {
        if (file) {
            //const challenges = SaveData.file().save.challenges.list;
            //settings.xAttackEnabled(!challenges.disableBattleItems);
            //settings.yellowFluteEnabled(!challenges.disableBattleItems);
        }
    });
};

module.exports = {
    initialize,
    settings,
    getBattleData,
};