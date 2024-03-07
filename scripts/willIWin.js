const settings = {
    xAttackEnabled: ko.observable(true),
    yellowFluteEnabled: ko.observable(true),
    weather: ko.observable(WeatherType.Clear),
    hideCompleted: ko.observable(true),
};

const gymList = ko.pureComputed(() => {
    if (!SaveData.isDamageLoaded()) {
        return [];
    }

    return Object.values(GymList).filter(gym => {
        const region = gym.parent?.region ?? GameConstants.Region.final;
        if (region > player.highestRegion()) {
            return false;
        }

        return true;
    });
});

const tempBattleList = ko.pureComputed(() => {
    if (!SaveData.isDamageLoaded()) {
        return [];
    }

    return Object.values(TemporaryBattleList).filter(tb => {
        if (tb.getTown().region > player.highestRegion()) {
            return false;
        }

        if (settings.hideCompleted() && SaveData.file().save.statistics.temporaryBattleDefeated[GameConstants.getTemporaryBattlesIndex(tb.name)] > 0) {
            return false;
        }

        return true;
    });
});

const getTempBattleData = ko.pureComputed(() => {
    if (!SaveData.isDamageLoaded()) {
        return [];
    }

    // xAttack
    player.effectList['xAttack'](settings.xAttackEnabled() ? 1 : 0);

    // Yellow Flute
    if (settings.yellowFluteEnabled() != FluteEffectRunner.isActive('Yellow_Flute')()) {
        FluteEffectRunner.toggleEffect('Yellow_Flute');
    }

    const weather = settings.weather();
    const damageCache = new Map();
    const tempBattles = [...tempBattleList()];

    const start = performance.now();

    tempBattles.forEach(tb => {
        if (!tb.pokemonList) {
            tb.pokemonList = tb.getPokemonList();
        }

        tb.isCompleted = SaveData.file().save.statistics.temporaryBattleDefeated[GameConstants.getTemporaryBattlesIndex(tb.name)] > 0;

        const town = tb.getTown();
        let playerRegion = 0;
        let playerSubRegion = 0;

        let keySuffix = null;
        if (town.region == GameConstants.Region.alola && town.subRegion == GameConstants.AlolaSubRegions.MagikarpJump) {
            keySuffix = 'mkj';
            playerRegion = GameConstants.Region.alola;
            playerSubRegion = GameConstants.AlolaSubRegions.MagikarpJump;
        }

        tb.secondsToWin = 0;
        tb.pokemonList.forEach(p => {
            const pokemon = pokemonMap[p.name];
            const type1 = pokemon.type[0];
            const type2 = pokemon.type[1] ?? PokemonType.None;

            let key = `${town.region}|${type1}|${type2}${(keySuffix ? `|${keySuffix}` : '')}`;
            let damage = damageCache.get(key);
            if (damage === undefined) {
                damage = calcPartyAttack(type1, type2, town.region, weather, playerRegion, playerSubRegion);
                damageCache.set(key, damage);
            }

            p.partyDamage = damage;
            p.secondsToDefeat = Math.max(1, Math.ceil(p.maxHealth / damage));
            tb.secondsToWin += p.secondsToDefeat;
        });
    });

    const end = performance.now();
    console.log(`${end-start}ms`);

    return tempBattles;
});

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

module.exports = {
    settings,
    getTempBattleData,
    gymList,
};