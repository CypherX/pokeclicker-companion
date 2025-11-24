const settings = {
    xAttackEnabled: ko.observable(false),
    weather: ko.observable(WeatherType.Clear),
    hideCompleted: ko.observable(true),
    hideLocked: ko.observable(false),
    activeFlutes: ko.observableArray([]),
    allFlutesToggle: ko.observable(false),
    clicksPerSecond: ko.observable(0),
    xClickEnabled: ko.observable(false),
    rockyHelmetEnabled: ko.observable(false),
};

settings.xAttackEnabled.subscribe((value) => {
    player.effectList['xAttack'](value ? 1 : 0);
});

settings.xClickEnabled.subscribe((value) => {
    player.effectList['xClick'](value ? 1 : 0);
});

settings.activeFlutes.subscribe(() => {
    toggleActiveFlutes();
});

settings.allFlutesToggle.subscribe((value) => {
    if (value) {
        settings.activeFlutes(Object.values(GameConstants.FluteItemType));
    } else {
        settings.activeFlutes([]);
    }
});

settings.clicksPerSecond.subscribe((value) => {
    if (isNaN(value) || value < 0 || !value?.length) {
        settings.clicksPerSecond(0);
    }
    if (value > 20) {
        settings.clicksPerSecond(20);
    }
});

settings.rockyHelmetEnabled.subscribe((value) => {
    App.game.oakItems.itemList[OakItemType.Rocky_Helmet].isActiveKO(!!value);
});

const ignoreSettings = ['hideCompleted', 'hideLocked', 'allFlutesToggle'];
Object.entries(settings).forEach(([name, setting]) => {
    if (ignoreSettings.includes(name)) {
        return;
    }

    setting.subscribe(() => BattleCalculator.calcBattleData());
});

let regionMultiplierOverride = -1;

/*let baseGymList = undefined;
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
        if (!Companion.settings.showAllRegions() && Math.floor(g.region) > player.highestRegion()) {
            return false;
        }

        if (g.region > GameConstants.MAX_AVAILABLE_REGION) {
            return false;
        }

        if (settings.hideLocked() && !g.isUnlocked()) {
            return false;
        }

        if (settings.hideCompleted() && gymsDefeated[GameConstants.getGymIndex(g.town)] > 0) {
            return false;
        }

        return true;
    });

    return gymList;
});*/

/*const tempBattleList = ko.pureComputed(() => {
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

        if (settings.hideLocked() && !tb.isUnlocked()) {
            return false;
        }

        if (settings.hideCompleted() && temporaryBattleDefeated[GameConstants.getTemporaryBattlesIndex(tb.name)] > 0) {
            return false;
        }

        return true;
    });
});*/

/*const getBattleData = ko.pureComputed(() => {
    const battleData = {
        gyms: [],
        tempBattles: [],
    };

    if (!SaveData.isDamageLoaded()) {
        return battleData;
    }

    // xAttack
    player.effectList['xAttack'](settings.xAttackEnabled() ? 1 : 0);

    // xClick
    player.effectList['xClick'](settings.xClickEnabled() ? 1 : 0);

    // Flutes
    Object.values(GameConstants.FluteItemType).forEach((flute) => {
        toggleFlute(flute, settings.activeFlutes().includes(flute));
    });

    const clickDamage = calcClickAttack();
    const mkjclickDamage = calcClickAttack(GameConstants.Region.alola, GameConstants.AlolaSubRegions.MagikarpJump);

    damageCache.clear();
    const gymsDefeated = SaveData.file().save.statistics.gymsDefeated;
    const temporaryBattleDefeated = SaveData.file().save.statistics.temporaryBattleDefeated;

    // gyms
    const gymBattles = [...gymList()];
    gymBattles.forEach(g => {
        //if (!g.pokemonList) {
            g.pokemonList = g.getPokemonList();
        //}

        const town = TownList[g.parent?.name ?? g.town];
        g.townObj = town;

        regionMultiplierOverride = town.region;

        g.isCompleted = gymsDefeated[GameConstants.getGymIndex(g.town)] > 0;
        g.secondsToWin = 0;

        g.clickDamage = clickDamage;
        if (town.region === GameConstants.Region.alola && town.subRegion === GameConstants.AlolaSubRegions.MagikarpJump) {
            g.clickDamage = mkjclickDamage;
        }

        g.pokemonList.forEach(p => {
            const damage = calcPokemonDamage(p.name, town.region, town.subRegion ?? 0) + g.clickDamage;
            p.partyDamage = damage;
            p.secondsToDefeat = Math.max(1, Math.ceil(p.maxHealth / damage));
            if (damage > 0) {
                g.secondsToWin += p.secondsToDefeat;
            }
        });

        if (g.secondsToWin == 0) {
            g.secondsToWin = Infinity;
        }
    });

    battleData.gyms = gymBattles;

    // temp battles
    const tempBattles = [...tempBattleList()];
    tempBattles.forEach(tb => {
        //if (!tb.pokemonList) {
            tb.pokemonList = tb.getPokemonList();
        //}

        const town = tb.getTown();
        regionMultiplierOverride = town.region;

        tb.isCompleted = temporaryBattleDefeated[GameConstants.getTemporaryBattlesIndex(tb.name)] > 0;
        tb.secondsToWin = 0;

        tb.clickDamage = clickDamage;
        if (town.region === GameConstants.Region.alola && town.subRegion === GameConstants.AlolaSubRegions.MagikarpJump) {
            tb.clickDamage = mkjclickDamage;
        }

        tb.pokemonList.forEach(p => {
            const damage = calcPokemonDamage(p.name, town.region, town.subRegion ?? 0) + tb.clickDamage;
            p.partyDamage = damage;
            p.secondsToDefeat = Math.max(1, Math.ceil(p.maxHealth / damage));
            if (damage > 0) {
                tb.secondsToWin += p.secondsToDefeat;
            }
        });

        if (tb.secondsToWin == 0) {
            tb.secondsToWin = Infinity;
        }
    });

    battleData.tempBattles = tempBattles;
    regionMultiplierOverride = -1;

    return battleData;
}).extend({ rateLimit: 50 });*/

const calcClickAttack = (region = 0, subRegion = 0) => {
    const clicksPerSecond = settings.clicksPerSecond();
    if (clicksPerSecond <= 0)
        return 0;

    const caughtPokemon = App.game.party.partyPokemonActiveInSubRegion(region, subRegion);
    const baseClickAttack = Math.pow(caughtPokemon.reduce((total, p) => total + p.clickAttackBonus(), 1), 1.4);
    const bonus = App.game.multiplier.getBonus('clickAttack', false);
    const clickAttack = Math.floor(baseClickAttack * bonus);
    return clickAttack * Math.floor(clicksPerSecond);
};

const timeFluteEnabled = ko.pureComputed(() => {
    return settings.activeFlutes().includes('Time_Flute');
});

const getGymBattleTime = ko.pureComputed(() => {
    if (!SaveData.isDamageLoaded() || !timeFluteEnabled()) {
        return GameConstants.GYM_TIME / 1000;
    }

    const fluteBonus = (ItemList["Time_Flute"].multiplyBy - 1) * (AchievementHandler.achievementBonus() + 1) + 1;
    const battleTime = GameConstants.GYM_TIME * fluteBonus;
    return Math.ceil(battleTime / 100) / 10;
});

const getTempBattleTime = ko.pureComputed(() => {
    if (!SaveData.isDamageLoaded() || !timeFluteEnabled()) {
        return GameConstants.TEMP_BATTLE_TIME / 1000;
    }

    const fluteBonus = (ItemList["Time_Flute"].multiplyBy - 1) * (AchievementHandler.achievementBonus() + 1) + 1;
    const battleTime = GameConstants.TEMP_BATTLE_TIME * fluteBonus;
    return Math.ceil(battleTime / 100) / 10;
});

//let calcTimes = 0;
//let calcTime = 0;

const damageCache = new Map();
const calcPokemonDamage = (pokemonName, battleRegion, battleSubRegion) => {
    //const start = performance.now();
    const pokemon = pokemonMap[pokemonName];
    const type1 = pokemon.type[0];
    const type2 = pokemon.type[1] ?? PokemonType.None;

    let damageCacheKey = `${battleRegion}|${type1}|${type2}`;
    let damageCacheKey2 = `${battleRegion}|${type2}|${type1}`;
    if (battleRegion == GameConstants.Region.alola && battleSubRegion == GameConstants.AlolaSubRegions.MagikarpJump) {
        damageCacheKey = `${damageCacheKey}|mkj`;
        damageCacheKey2 = `${damageCacheKey2}|mkj`;
    }

    let damage = damageCache.get(damageCacheKey) || damageCache.get(damageCacheKey2);
    if (damage === undefined) {
        damage = calcPartyAttack(type1, type2, battleRegion, settings.weather(), battleRegion, battleSubRegion);
        //calcTimes += 1;
        damageCache.set(damageCacheKey, damage);
    }

    //const end = performance.now();
    //calcTime += (end - start);

    return damage;
}

// slightly modified Party.calculatePokemonAttack() to allow overriding the player region
const calcPartyAttack = (type1, type2, region, weather, playerRegion = 0, playerSubRegion = 0) => {
    let attack = 0;
    for (const pokemon of App.game.party.caughtPokemon) {
        let ignoreRegionMultiplier = false;
        if (region == GameConstants.Region.alola && playerRegion == GameConstants.Region.alola && playerSubRegion == GameConstants.AlolaSubRegions.MagikarpJump) {
            if (Math.floor(pokemon.id) == 129) {
                ignoreRegionMultiplier = true;
            } else {
                // Only magikarps can attack in magikarp jump
                continue;
            }
        }
        attack += App.game.party.calculateOnePokemonAttack(pokemon, type1, type2, region, ignoreRegionMultiplier, true, false, weather, false, true);
    }

    const bonus = App.game.party.multiplier.getBonus('pokemonAttack');
    return Math.round(attack * bonus);
};

// modified Party.getRegionAttackMultiplier
const getRegionAttackMultiplier = Party.prototype.getRegionAttackMultiplier;
Party.prototype.getRegionAttackMultiplier = () => {
    const region = Math.max(regionMultiplierOverride, player.highestRegion());
    return getRegionAttackMultiplier(region);
};

const toggleActiveFlutes = () => {
    Object.values(GameConstants.FluteItemType).forEach((flute) => {
        toggleFlute(flute, settings.activeFlutes().includes(flute));
    });
};

const toggleFlute = (flute, active) => {
    if (active && !isFluteActive(flute)) {
        player.itemList[flute](0);
        player.effectList[flute](1);
        updateFluteActiveGemTypes();
    }

    if (!active && isFluteActive(flute)) {
        player.effectList[flute](0);
        player.itemList[flute](1);
        updateFluteActiveGemTypes();
    }
}

const isFluteActive = (flute) => {
    return !!player.effectList[flute]();
};

const updateFluteActiveGemTypes = () => {
    FluteEffectRunner.activeGemTypes.removeAll();
    const gemTypes = new Set();
    GameHelper.enumStrings(GameConstants.FluteItemType).forEach(flute => {
        if (isFluteActive(flute)) {
            ItemList[flute].gemTypes.forEach(idx => gemTypes.add(PokemonType[idx]));
        }
    });
    [...gemTypes].forEach(x => FluteEffectRunner.activeGemTypes.push(x));
};

const formattedSecondsToWin = (secondsToWin) => {
    return secondsToWin.toLocaleString();
};


const showData = ko.observable(false);
const gymList = ko.observable([]);
const tempBattleList = ko.observable([]);

const calculate = async () => {
    //const start = performance.now();

    if (!SaveData.isDamageLoaded()) {
        SaveData.loadAttackData();
    }

    loadGymList();
    loadTempBattleList();
    calcBattleData();
    showData(true);

    //const end = performance.now();
    //console.log(`[calculate] ${end - start}ms`);
};

const loadGymList = () => {
    let list = [];
    GameConstants.RegionGyms.forEach((gyms, region) => {
        if (region > GameConstants.MAX_AVAILABLE_REGION) {
            return;
        }

        if (region == GameConstants.Region.alola) {
            gyms = gyms.filter(g => !g.endsWith(' Trial'));
        }

        list.push({
            region: region,
            gyms: gyms
        });
    });

    const gymsDefeated = SaveData.file().save.statistics.gymsDefeated;
    Companion.data.GymListOverride.forEach((g) => list.push({...g}));
    list = list.sort((a, b) => a.region - b.region).flatMap(rg => rg.gyms.map(g => {
        const gym = GymList[g];
        gym.region = rg.region;
        gym.townObj = TownList[gym.parent?.name ?? gym.town];
        gym.pokemonList = gym.getPokemonList().map((p) => {
            return {
                ...p,
                partyDamage: ko.observable(0),
                secondsToDefeat: ko.observable(0),
            };
        });
        gym.isCompleted = gymsDefeated[GameConstants.getGymIndex(gym.town)] > 0;
        gym.isVisible = ko.pureComputed(() => {
            if (!Companion.settings.showAllRegions() && Math.floor(gym.region) > player.highestRegion()) {
                return false;
            }
    
            if (settings.hideLocked() && !gym.isUnlocked()) {
                return false;
            }

            if (settings.hideCompleted() && gym.isCompleted) {
                return false;
            }
    
            return true;
        });
        gym.secondsToWin = ko.observable(0);
        gym.clickDamage = ko.observable(0);

        return gym;
    }));

    gymList(list);
};

const loadTempBattleList = () => {
    const list = [];
    const temporaryBattleDefeated = SaveData.file().save.statistics.temporaryBattleDefeated;

    const excludedBattles = new Set(
        ['Captain Mina', 'Captain Ilima', 'Captain Mallow', 'Captain Lana', 'Captain Kiawe', 'Captain Sophocles', 'Kahuna Nanu']
    );

    Object.values(TemporaryBattleList).forEach((tb) => {
        if (tb.getTown().region > GameConstants.MAX_AVAILABLE_REGION) {
            return;
        }

        if (excludedBattles.has(tb.name)) {
            return;
        }

        tb.pokemonList = tb.getPokemonList().map((p) => {
            return {
                ...p,
                partyDamage: ko.observable(0),
                secondsToDefeat: ko.observable(0),
            };
        });
        tb.isCompleted = temporaryBattleDefeated[GameConstants.getTemporaryBattlesIndex(tb.name)] > 0;
        tb.isVisible = ko.pureComputed(() => {
            if (!Companion.settings.showAllRegions() && tb.getTown().region > player.highestRegion()) {
                return false;
            }
    
            if (settings.hideLocked() && !tb.isUnlocked()) {
                return false;
            }
    
            if (settings.hideCompleted() && tb.isCompleted) {
                return false;
            }
    
            return true;
        });
        tb.secondsToWin = ko.observable(0);
        tb.clickDamage = ko.observable(0);

        list.push(tb);
    });

    tempBattleList(list);
}

const calcBattleData = () => {
    const start = performance.now();
    damageCache.clear();

    //calcTimes = 0;
    //calcTime = 0;

    const clickDamage = calcClickAttack();
    const mkjClickDamage = calcClickAttack(GameConstants.Region.alola, GameConstants.AlolaSubRegions.MagikarpJump);

    for (const gym of gymList()) {
        regionMultiplierOverride = gym.townObj.region;
        gym.secondsToWin(0);

        gym.clickDamage(
            gym.townObj.region === GameConstants.Region.alola && gym.townObj.subRegion === GameConstants.AlolaSubRegions.MagikarpJump
                ? mkjClickDamage : clickDamage);

        for (const pokemon of gym.pokemonList) {
            const damage = calcPokemonDamage(pokemon.name, gym.townObj.region, gym.townObj.subRegion ?? 0) + gym.clickDamage();
            pokemon.partyDamage(damage);
            const secondsToDefeat = Math.max(1, Math.ceil(pokemon.maxHealth / damage));
            pokemon.secondsToDefeat(secondsToDefeat);
            if (damage > 0) {
                gym.secondsToWin(gym.secondsToWin() + secondsToDefeat);
            }
        }

        if (gym.secondsToWin() === 0) {
            gym.secondsToWin(Infinity);
        }
    }

    for (const tb of tempBattleList()) {
        const town = tb.getTown();
        regionMultiplierOverride = town.region;
        tb.secondsToWin(0);

        tb.clickDamage(
            town.region === GameConstants.Region.alola && town.subRegion === GameConstants.AlolaSubRegions.MagikarpJump
                ? mkjClickDamage : clickDamage);

        for (const pokemon of tb.pokemonList) {
            const damage = calcPokemonDamage(pokemon.name, town.region, town.subRegion ?? 0) + tb.clickDamage();
            pokemon.partyDamage(damage);
            const secondsToDefeat = Math.max(1, Math.ceil(pokemon.maxHealth / damage));
            pokemon.secondsToDefeat(secondsToDefeat);
            if (damage > 0) {
                tb.secondsToWin(tb.secondsToWin() + secondsToDefeat);
            }
        }

        if (tb.secondsToWin() === 0) {
            tb.secondsToWin(Infinity);
        }
    }

    //console.log(`[calcTimes] ${calcTimes}`);
    //console.log(`[calcTime] ${calcTime}ms`);

    regionMultiplierOverride = -1;

    const end = performance.now();
    console.log(`[calcBattleData] ${end - start}ms`);
}


module.exports = {
    settings,
    //getBattleData,
    getGymBattleTime,
    getTempBattleTime,
    formattedSecondsToWin,
    calcClickAttack,

    showData,
    gymList,
    tempBattleList,

    calculate,
    calcBattleData,
};