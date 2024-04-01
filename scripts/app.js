const partyList = ko.pureComputed(() => {
    const saveData = SaveData.file();
    const party = saveData?.save.party.caughtPokemon ?? [];
    const statistics = saveData?.save.statistics;

    return party.reduce((_map, p) => {
        const partyPokemon = PokemonFactory.generatePartyPokemon(p.id);
        partyPokemon.fromJSON(p);

        partyPokemon.totalAttack = partyPokemon.calculateAttack(100);
        partyPokemon.baseBreedingEff = (partyPokemon.getBreedingAttackBonus() / partyPokemon.getEggSteps()) * GameConstants.EGG_CYCLE_MULTIPLIER;

        const heldItemBonus = partyPokemon.heldItem && partyPokemon.heldItem() instanceof AttackBonusHeldItem ? partyPokemon.heldItem().attackBonus : 1;
        const shadowBonus = partyPokemon.shadow == GameConstants.ShadowStatus.Shadow ? 0.8 : (partyPokemon.shadow == GameConstants.ShadowStatus.Purified ? 1.2 : 1);
        const attackBonus = partyPokemon.getBreedingAttackBonus() * partyPokemon.calculateEVAttackBonus() * heldItemBonus * shadowBonus;
        partyPokemon.breedingEff = (attackBonus / partyPokemon.getEggSteps()) * GameConstants.EGG_CYCLE_MULTIPLIER;

        partyPokemon.statistics = {
            totalObtained: statistics.pokemonCaptured[p.id] || 0,
            totalHatched: statistics.pokemonHatched[p.id] || 0,
            totalShinyObtained: statistics.shinyPokemonCaptured[p.id] || 0,
            totalShinyHatched: statistics.shinyPokemonHatched[p.id] || 0,
            totalDefeated: statistics.pokemonDefeated[p.id] || 0,
        };

        _map[p.id] = partyPokemon;
        return _map;
    }, {});
});

const pokemonStatTableSearch = ko.observable('');
const pokemonStatTableFilter = ko.observable('none');
const pokemonStatTableSort = ko.observable('id');
const pokemonStatTableSortDir = ko.observable(false);

const getSortedPartyList = ko.pureComputed(() => {
    const sortOption = pokemonStatTableSort();
    const sortDirection = pokemonStatTableSortDir();
    return Object.values(partyList()).sort(compareBy(sortOption, sortDirection));
}).extend({ rateLimit: 100 });

const getMissingPokemon = ko.pureComputed(() => {
    if (!SaveData.isLoaded()) {
        return [];
    }

    const caughtPokemon = partyList();
    const missingPokemon = {
        ...GameHelper.enumNumbers(GameConstants.Region)
            .filter(r => r !== GameConstants.Region.none && r <= GameConstants.MAX_AVAILABLE_REGION)
            .map(r => {
                return {
                    region: r,
                    regionName: GameConstants.camelCaseToString(GameConstants.Region[r]),
                    pokemon: []
                };
            })
    };

    missingPokemon[-2] = {
        region: -2,
        regionName: 'Event / Discord / Client',
        pokemon: []
    };

    const saveData = SaveData.file();
    const showRequiredOnly = Companion.settings.showRequiredOnly();
    const showAllRegions = Companion.settings.showAllRegions();

    Companion.data.obtainablePokemonList.forEach(p => {
        if (caughtPokemon[p.id]) {
            return;
        }

        const obtainRegion = p.obtainRegion;
        if (!showAllRegions && obtainRegion > player.highestRegion()) {
            return;
        }

        if (showRequiredOnly) {
            if (obtainRegion == -2) {
                return;
            }

            const formCaught = saveData.save.party.caughtPokemon.some(c => Math.floor(c.id) == Math.floor(p.id));
            if (formCaught) {
                return;
            }
        }

        missingPokemon[obtainRegion].pokemon.push(p);
    });

    return Object.values(missingPokemon).filter(r => r.pokemon.length);
});

const getMissingRegionPokemonCount = (region) => {
    return ko.pureComputed(() => {
        const data = getMissingPokemon().find(r => r.region == region);
        if (!data) {
            return 0;
        }

        return Companion.settings.showRequiredOnly() ? (new Set(data.pokemon.map(p => Math.floor(p.id)))).size : data.pokemon.length;
    });
};

const getTotalMissingPokemonCount = ko.pureComputed(() => {
    return getMissingPokemon().reduce((count, r) => {
        return count + getMissingRegionPokemonCount(r.region)();
    }, 0);
});

const caughtPokemonCount = ko.pureComputed(() => {
    if (!SaveData.isLoaded()) {
        return 0;
    }

    return SaveData.file().save.party.caughtPokemon
        .filter(p => Companion.data.obtainablePokemonMap[p.id]).length;
});

const caughtShinyCount = ko.pureComputed(() => {
    if (!SaveData.isLoaded()) {
        return 0;
    }

    return SaveData.file().save.party.caughtPokemon
        .filter(p => p[PartyPokemonSaveKeys.shiny] === true).length;
});

const caughtResistantCount = ko.pureComputed(() => {
    if (!SaveData.isLoaded()) {
        return 0;
    }

    return SaveData.file().save.party.caughtPokemon
        .filter(p => p[PartyPokemonSaveKeys.pokerus] === GameConstants.Pokerus.Resistant).length;
});

const hideFromPokemonStatsTable = (partyPokemon) => {
    return ko.pureComputed(() => {
        const searchVal = pokemonStatTableSearch();
        if (searchVal) {
            if (!partyPokemon.id.toString().includes(searchVal)
                && !partyPokemon.name.toLowerCase().includes(searchVal.toLowerCase())) {
                return true;
            }
        }

        const filterVal = pokemonStatTableFilter();

        if (filterVal) {
            const isResistant = partyPokemon.pokerus === GameConstants.Pokerus.Resistant;
            const isFriendSafari = FriendSafari.isInRotation(partyPokemon.name);

            switch (filterVal) {
                case 'not-shiny':
                    if (partyPokemon.shiny) {
                        return true;
                    }
                    break;
                case 'not-resistant':
                    if (isResistant) {
                        return true;
                    }
                    break;
                case 'not-resistant-not-friend-safari':
                    if (isResistant || isFriendSafari) {
                        return true;
                    }
                    break;
                case 'not-resistant-friend-safari':
                    if (isResistant || !isFriendSafari) {
                        return true;
                    }
                    break;
                case 'resistant':
                    if (!isResistant) {
                        return true;
                    }
                    break;
                case 'infected':
                    if (partyPokemon.pokerus != GameConstants.Pokerus.Infected) {
                        return true;
                    }
                    break;
                case 'missing-shadow':
                    if (partyPokemon.shadow || !Companion.data.shadowPokemon.has(partyPokemon.name)) {
                        return true;
                    }
                break;
                case 'missing-purified':
                    if (partyPokemon.shadow == GameConstants.ShadowStatus.Purified || !Companion.data.shadowPokemon.has(partyPokemon.name)) {
                        return true;
                    }
                break;
                case 'shadow':
                    if (partyPokemon.shadow != GameConstants.ShadowStatus.Shadow) {
                        return true;
                    }
                break;
                case 'purified':
                    if (partyPokemon.shadow != GameConstants.ShadowStatus.Purified) {
                        return true;
                    }
                break;
            }
        }

        return false;
    });
};

const getPokemonStatsTableCount = ko.pureComputed(() => {
    return Object.values(partyList()).reduce((sum, p) => !hideFromPokemonStatsTable(p)() ? sum + 1 : sum, 0);
});

const isEventDiscordClientPokemon = (pokemonName) => {
    return Companion.data.EventDiscordClientPokemon.includes(pokemonName);
};

const isPokemonCaught = (pokemonName) => {
    return partyList()[PokemonHelper.getPokemonByName(pokemonName).id] != undefined;
};

const getCaughtPokeballImage = (pokemonName) => {
    const partyPokemon = partyList()[PokemonHelper.getPokemonByName(pokemonName).id];
    if (partyPokemon) {
        return `assets/images/pokeball/Pokeball${partyPokemon.shiny ? '-shiny' : ''}.svg`;
    } else {
        return '';
    }
};

const hasPokerus = (pokemonName) => {
    const partyPokemon = partyList()[PokemonHelper.getPokemonByName(pokemonName).id];
    return (partyPokemon?.pokerus ?? 0) > 0;
};

const getPokerusImage = (pokemonName) => {
    const partyPokemon = partyList()[PokemonHelper.getPokemonByName(pokemonName).id];
    if (!partyPokemon || partyPokemon.pokerus == GameConstants.Pokerus.Uninfected) {
        return '//:0';
    }

    return `assets/images/breeding/pokerus/${GameConstants.Pokerus[partyPokemon.pokerus]}.png`;
};

const getShadowStatusImage = (shadowStatus) => {
    if (shadowStatus == GameConstants.ShadowStatus.None) {
        return '//:0';
    }

    return `assets/images/status/${shadowStatus == GameConstants.ShadowStatus.Shadow ? 'shadow' : 'purified'}.svg`;
};

const exportPartyPokemon = () => {
    const headers = [
        '#', 'Pokemon', 'Type 1', 'Type 2', 'Shiny', 'Pokerus', 'Shadow Status', 'Native Region',
        'Attack', 'Base Breeding Eff', 'Breeding Eff', 'Obtained', 'Hatched',
        'Shiny Obtained', 'Shiny Hatched', 'Defeated', 'Effort Points',
        'EVs', 'EV Bonus'
    ];

    const data = getSortedPartyList().map((p) => [
        p.id,
        `"${p.name}"`,
        PokemonType[pokemonMap[p.id].type[0]],
        PokemonType[pokemonMap[p.id].type[1] ?? -1],
        p.shiny ? 1 : 0,
        p.pokerus,
        Companion.data.shadowPokemon.has(p.name) ? p.shadow : -1,
        GameConstants.camelCaseToString(GameConstants.Region[PokemonHelper.calcNativeRegion(p.name)]),
        p.totalAttack,
        p.baseBreedingEff,
        p.breedingEff,
        p.statistics.totalObtained,
        p.statistics.totalHatched,
        p.statistics.totalShinyObtained,
        p.statistics.totalShinyHatched,
        p.statistics.totalDefeated,
        p.effortPoints,
        p.evs(),
        p.calculateEVAttackBonus(),
    ]);

    Util.exportToCsv(headers, data, `PartyPokemon-${Date.now()}.csv`);
};

const getDungeonData = ko.pureComputed(() => {
    const dungeonData = [];
    const dungeonOverrides = Companion.data.DungeonListOverride.map(d => d.dungeons).flat();

    GameConstants.RegionDungeons.forEach((rd, idx) => {
        dungeonData.push({
            region: idx,
            dungeons: rd.filter(d => !dungeonOverrides.includes(d))
        });
    });

    Companion.data.DungeonListOverride.forEach((rd) => dungeonData.push({...rd}));

    dungeonData.forEach(d => {
        d.dungeons = d.dungeons.map(dungeon => {
            const clears = getDungeonClearCount(dungeon);
            const cost = dungeonList[dungeon].tokenCost;
            return {
                name: dungeon,
                clears: clears,
                cost: cost,
                remaining: Math.max((cost * 500) - (cost * clears), 0),
                hide: TownList[dungeon].requirements.some(req => req instanceof DevelopmentRequirement),
            };
        }).filter(d => !d.hide);
    });
    
    return dungeonData.filter(d => d.region <= GameConstants.MAX_AVAILABLE_REGION).sort((a, b) => a.region - b.region);
});

const getDungeonDataFlat = ko.pureComputed(() => getDungeonData().flatMap(d => d.dungeons));

const getDungeonClearCount = (dungeon) => {
    if (!SaveData.isLoaded()) {
        return 0;
    }

    const dungeonIndex = GameConstants.getDungeonIndex(dungeon);
    return SaveData.file().save.statistics.dungeonsCleared[dungeonIndex] || 0;
};

const totalDungeonClears = ko.pureComputed(() => {
    return getDungeonDataFlat().reduce((sum, dungeon) => sum + dungeon.clears, 0);
});

const totalDungeonTokensSpent = ko.pureComputed(() => {
    return getDungeonDataFlat().reduce((sum, dungeon) => sum + dungeon.clears * dungeon.cost, 0);
});

const totalDungeonCost500Clears = ko.pureComputed(() => {
    return getDungeonDataFlat().reduce((sum, dungeon) => sum + (dungeon.cost * 500), 0);
});

const remainingDungeonCost500Clears = ko.pureComputed(() => {
    return getDungeonDataFlat().reduce((sum, dungeon) => sum + dungeon.remaining, 0);
});

const getMostClearedDungeons = ko.pureComputed(() => {
    return getDungeonDataFlat().sort((a, b) => b.clears - a.clears).slice(0, 5);
});

const getGymData = ko.pureComputed(() => {
    const gymList = [];

    GameConstants.RegionGyms.forEach((gyms, region) => {
        if (region > GameConstants.MAX_AVAILABLE_REGION) {
            return;
        }

        if (region == GameConstants.Region.alola) {
            gyms = gyms.filter(g => !g.endsWith(' Trial'));
        }

        gymList.push({
            region: region,
            gyms: gyms
        });
    });

    Companion.data.GymListOverride.forEach((g) => gymList.push({...g}));

    gymList.forEach(g => {
        g.gyms = g.gyms.map(gym => ({
            name: gym,
            clears: getGymClearCount(gym)
        }));
    });

    return gymList.sort((a, b) => a.region - b.region);
});

const getGymClearCount = (gym) => {
    if (!SaveData.isLoaded()) {
        return 0;
    }

    const gymIndex = GameConstants.getGymIndex(gym);
    return SaveData.file().save.statistics.gymsDefeated[gymIndex] || 0;
};

const getRouteData = ko.pureComputed(() => {
    const routeList = [];
    const routeOverrides = Companion.data.RouteListOverride;

    GameHelper.enumNumbers(GameConstants.Region).forEach(region => {
        if (region > GameConstants.MAX_AVAILABLE_REGION || region < 0) {
            return;
        }

        const regionRoutes = Routes.regionRoutes.filter(r => r.region == region);
        const routes = SubRegions.list[region].length == 1 ? regionRoutes
            : regionRoutes.filter(r => !routeOverrides.some(o => o.region === r.region && o.subRegion === r.subRegion));

        routeList.push({
            region: region,
            subRegion: 0,
            routes: routes
        });
    });

    routeOverrides.forEach((r) => routeList.push({...r}));

    routeList.forEach(r => {
        const regionName = GameConstants.camelCaseToString(GameConstants.Region[r.region]);
        r.routes.forEach(route => {
            route.routeName = route.routeName.replace(regionName, '').trim();
            route.defeats = getRouteDefeatCount(route.region, route.number);
        });
    });

    return routeList.sort((a, b) =>
        (a.displayRegion || a.region) - (b.displayRegion || b.region)
        || (a.displaySubRegion || a.subRegion) - (b.displaySubRegion || b.subRegion));
});

const getRouteDefeatCount = (region, routeNumber) => {
    if (!SaveData.isLoaded()) {
        return 0;
    }

    const regionName = GameConstants.Region[region];
    return SaveData.file().save.statistics.routeKills[regionName][routeNumber] || 0;
};

const hideOtherStatSection = (data) => {
    if (data.hidden) {
        return true;
    }

    const region = data.displayRegion ?? data.region;
    if (region > GameConstants.MAX_AVAILABLE_REGION) {
        return true;
    }

    if (!Companion.settings.showAllRegions() && Math.floor(region) > player.highestRegion()) {
        return true;
    }

    return false;
};

const typeDamageDistribution = ko.observable();
const includeXAttack = ko.observable(true);
const includeYellowFlute = ko.observable(true);
const includeGems = ko.observable(true);
const typeDamageWeather = ko.observable(WeatherType.Clear);
const typeDamageRegion = ko.observable(GameConstants.Region.none);

const calculateTypeDamageDistribution = () => {
    // load shit
    SaveData.loadAttackData();

    player.effectList['xAttack'](includeXAttack() ? 1 : 0);
    App.game.challenges.list.disableGems.active(!includeGems());
    if (includeYellowFlute() != FluteEffectRunner.isActive('Yellow_Flute')()) {
        FluteEffectRunner.toggleEffect('Yellow_Flute');
    }

    const ignoreRegionMultiplier = typeDamageRegion() == GameConstants.Region.none;

    const result = {};
    let max = 0;
    let min = Number.MAX_SAFE_INTEGER;

    for (let type1 = 0; type1 <= 17; ++type1) {
        result[PokemonType[type1]] = {};
        for (let type2 = 0; type2 <= 17; ++type2) {
            let dmg = App.game.party.calculatePokemonAttack(type1, type2, ignoreRegionMultiplier, typeDamageRegion(), true, false, typeDamageWeather(), true, true);
            result[PokemonType[type1]][PokemonType[type2]] = dmg.toLocaleString();
            max = Math.max(max, dmg);
            min = Math.min(min, dmg);
        }
    }

    typeDamageDistribution({
        distribution: result,
        max,
        min,
    });
};

const tabVisited = ko.observable({});
const activeTab = ko.observable('#mySaveContent');

$(document).ready(() => {
    const container = document.getElementById('container');
    ko.applyBindings({}, container);
    container.classList.remove('d-none');

    $('.btn-save-selector').click(() => {
        document.getElementById('file-selector').click();
    });

    $(document).on('shown.bs.tab', 'button[data-bs-toggle="pill"]', (e) => {
        tabVisited({ ...tabVisited(), [$(e.target).data('bs-target')]: true });
    });

    $('#mainNavbar button.nav-link').on('show.bs.tab', (e) => {
        activeTab($(e.target).data('bs-target'));
    });

    $(document).on('click', '#partyPokemonTable thead th.sortable', (e) => {
        const sort = e.currentTarget.dataset.sort;
        if (pokemonStatTableSort() == sort) {
            pokemonStatTableSortDir(!pokemonStatTableSortDir());
        } else {
            pokemonStatTableSort(sort);
            pokemonStatTableSortDir(true);
        }
    });

    Companion.settings.initialize();
    SaveData.initialize();
    Forecast.generateForecasts();

    Util.createNotifications();
});

function compareBy(sortOption, direction) {
    return function (a, b) {
        let res, dir = direction ? -1 : 1;

        const aValue = getSortValue(sortOption, a);
        const bValue = getSortValue(sortOption, b);
        
        if (aValue == bValue) {
            return a.id - b.id;
        } else if (aValue < bValue) {
            res = -1;
        } else if (aValue > bValue) {
            res = 1;
        } else {
            res = 0;
        }

        return res * dir;
    }
}

function getSortValue(sortOption, partyPokemon) {
    switch (sortOption) {
        case 'name':
            return partyPokemon.name;
        case 'attack':
            return partyPokemon.totalAttack;
        case 'base-breeding-eff':
            return partyPokemon.baseBreedingEff;
        case 'breeding-eff':
            return partyPokemon.breedingEff;
        case 'obtained':
            return partyPokemon.statistics.totalObtained;
        case 'hatched':
            return partyPokemon.statistics.totalHatched;
        case 'shiny-obtained':
            return partyPokemon.statistics.totalShinyObtained;
        case 'shiny-hatched':
            return partyPokemon.statistics.totalShinyHatched;
        case 'defeated':
            return partyPokemon.statistics.totalDefeated;
        case 'evs':
            return partyPokemon.evs();
        case 'ev-bonus':
            return partyPokemon.calculateEVAttackBonus();
        case 'id':
        default:
            return partyPokemon.id;
    }
}

$(document).on('mouseover', '.table-column-row-hover tbody td', (e) => {
    const cell = e.target;
    $(cell).closest('tr').find('td').css('background-color', 'rgba(100, 100, 60, 0.1)');
    $(cell).closest('tbody').find(`td:nth-child(${cell.cellIndex + 1})`).css('background-color', 'rgba(100, 100, 60, 0.1)');
    cell.style.backgroundColor = 'rgba(100, 100, 60, 0.25)';
});

$(document).on('mouseout', '.table-column-row-hover tbody td', (e) => {
    const cell = e.target;
    $(cell).closest('tr').find('td').css('background-color', '');
    $(cell).closest('tbody').find(`td:nth-child(${cell.cellIndex + 1})`).css('background-color', '');
});

module.exports = {
    getMissingPokemon,
    getTotalMissingPokemonCount,
    getMissingRegionPokemonCount,

    partyList,
    getSortedPartyList,
    caughtPokemonCount,
    caughtShinyCount,
    caughtResistantCount,

    hideFromPokemonStatsTable,
    getPokemonStatsTableCount,
    pokemonStatTableSearch,
    pokemonStatTableFilter,
    isEventDiscordClientPokemon,

    isPokemonCaught,
    getCaughtPokeballImage,
    hasPokerus,
    getPokerusImage,
    getShadowStatusImage,
    exportPartyPokemon,

    getDungeonData,
    totalDungeonClears,
    totalDungeonTokensSpent,
    totalDungeonCost500Clears,
    remainingDungeonCost500Clears,
    getMostClearedDungeons,

    getGymData,
    getRouteData,
    hideOtherStatSection,

    typeDamageDistribution,
    calculateTypeDamageDistribution,
    includeXAttack,
    includeYellowFlute,
    includeGems,
    typeDamageWeather,
    typeDamageRegion,

    tabVisited,
    activeTab,
};
