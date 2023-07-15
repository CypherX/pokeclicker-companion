const saveData = ko.observable(undefined);
const showRequiredOnly = ko.observable(false);
const showAllRegions = ko.observable(false);

const partyList = ko.pureComputed(() => {
    if (!saveData()) {
        return {};
    }

    const party = saveData().save.party.caughtPokemon;
    return party.reduce((_map, p) => {
        const partyPokemon = PokemonFactory.generatePartyPokemon(p.id);
        partyPokemon.fromJSON(p);
        _map[p.id] = partyPokemon;
        return _map;
    }, {});
});

const pokemonStatTableSearch = ko.observable('');
const pokemonStatTableFilter = ko.observable('none');

//const pokemonStatTableSort = ko.observable('name');
//const pokemonStatTableSortDir = ko.observable('desc');

const loadFile = (file) => {
    fr.readAsText(file);
};

const loadSaveData = () => {
    const saveFile = JSON.parse(atob(fr.result));
    player.highestRegion(saveFile.player.highestRegion);
    App.game.challenges.list.slowEVs.active(saveFile.save.challenges.list.slowEVs);

    saveData(saveFile);
};

const fr = new FileReader();
fr.addEventListener('load', loadSaveData);

const isSaveLoaded = ko.pureComputed(() => {
    return saveData() !== undefined;
});

const getMissingPokemon = ko.pureComputed(() => {
    if (!isSaveLoaded()) {
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

    getObtainablePokemonList().forEach(p => {
        if (caughtPokemon[p.id]) {
            return;
        }

        const nativeRegion = getPokemonNativeRegion(p.name);
        if (!showAllRegions() && nativeRegion > player.highestRegion()) {
            return;
        }

        if (showRequiredOnly()) {
            if (nativeRegion == -2) {
                return;
            }

            //const gameRegion = PokemonHelper.calcNativeRegion(p.name);
            const formCaught = saveData().save.party.caughtPokemon.some(c => Math.floor(c.id) == Math.floor(p.id));
            if (formCaught) {
                return;
            }
        }

        missingPokemon[nativeRegion].pokemon.push(p);
    });

    return Object.values(missingPokemon).filter(r => r.pokemon.length);
});

const getMissingRegionPokemonCount = (region) => {
    return ko.pureComputed(() => {
        const data = getMissingPokemon().find(r => r.region == region);
        if (!data) {
            return 0;
        }

        return showRequiredOnly() ? (new Set(data.pokemon.map(p => Math.floor(p.id)))).size : data.pokemon.length;
    });
};

const getTotalMissingPokemonCount = ko.pureComputed(() => {
    return getMissingPokemon().reduce((count, r) => {
        return count + getMissingRegionPokemonCount(r.region)();
    }, 0);
});

const getPokemonNativeRegion = (pokemonName) => {
    return Companion.data.pokemonRegionOverride[pokemonName] || PokemonHelper.calcNativeRegion(pokemonName);
};

const getObtainablePokemonList = () => {
    const unobtainableList = Companion.data.UnobtainablePokemon.filter(p => typeof p === 'string');
    const unobtainableListRegex = Companion.data.UnobtainablePokemon.filter(p => typeof p === 'object').map(p => new RegExp(p));

    const pokemon = pokemonList.filter(p => {
        if (p.id < 1) {
            return false;
        }

        if (PokemonHelper.calcNativeRegion(p.name) > GameConstants.MAX_AVAILABLE_REGION) {
            return false;
        }

        if (unobtainableList.includes(p.name) || unobtainableListRegex.some(r => r.test(p.name))) {
            return false;
        }

        return true;
    });

    return pokemon;
};

const getObtainablePokemonListByRegion = ko.pureComputed(() => {
    const data = {};
    getObtainablePokemonList().forEach(p => {
        const nativeRegion = getPokemonNativeRegion(p.name);
        data[nativeRegion] = data[nativeRegion] || [];
        data[nativeRegion].push(p.name);
    });
    return data;
});

const hideFromPokemonStatsTable = (partyPokemon) => {
    return ko.pureComputed(() => {
        const searchVal = pokemonStatTableSearch();
        if (searchVal) {
            if (!partyPokemon.id.toString().includes(searchVal)
                && !partyPokemon.name.toLowerCase().includes(searchVal)) {
                return true;
            }
        }

        const filterVal = pokemonStatTableFilter();

        if (filterVal) {
            const isResistant = partyPokemon.pokerus === GameConstants.Pokerus.Resistant;
            const isFriendSafari = Companion.data.friendSafariPokemon.includes(partyPokemon.name);
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

const getPokeballImage = (partyPokemon) => {
    return `/pokeclicker/docs/assets/images/pokeball/Pokeball${partyPokemon.shiny ? '-shiny' : ''}.svg`;
};

const getPokerusImage = (partyPokemon) => {
    return `/pokeclicker/docs/assets/images/breeding/pokerus/${GameConstants.Pokerus[partyPokemon.pokerus]}.png`;
};

const getDungeonData = ko.pureComputed(() => {
    const dungeonList = [];
    const dungeonOverrides = Companion.data.DungeonListOverride.map(d => d.dungeons).flat();

    GameConstants.RegionDungeons.forEach((rd, idx) => {
        dungeonList.push({
            region: idx,
            dungeons: rd.filter(d => !dungeonOverrides.includes(d))
        });
    });

    Companion.data.DungeonListOverride.forEach((rd) => dungeonList.push({...rd}));

    dungeonList.forEach(d => {
        d.dungeons = d.dungeons.map(dungeon => ({
            name: dungeon,
            clears: isSaveLoaded() ? getDungeonClearCount(dungeon) : 0
        }));
    });
    
    return dungeonList.sort((a, b) => a.region - b.region);
});

const getDungeonClearCount = (dungeon) => {
    if (!isSaveLoaded()) {
        return 0;
    }

    const dungeonIndex = GameConstants.getDungeonIndex(dungeon);
    return saveData().save.statistics.dungeonsCleared[dungeonIndex] || 0;
};

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
            clears: isSaveLoaded() ? getGymClearCount(gym) : 0
        }));
    });

    return gymList.sort((a, b) => a.region - b.region);
});

const getGymClearCount = (gym) => {
    if (!saveData()) {
        return 0;
    }

    const gymIndex = GameConstants.getGymIndex(gym);
    return saveData().save.statistics.gymsDefeated[gymIndex] || 0;
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
            route.defeats = isSaveLoaded() ? getRouteDefeatCount(route.region, route.number) : 0;
        });
    });

    return routeList.sort((a, b) =>
        (a.displayRegion || a.region) - (b.displayRegion || b.region)
        || (a.displaySubRegion || a.subRegion) - (b.displaySubRegion || b.subRegion));
});

const getRouteDefeatCount = (region, routeNumber) => {
    if (!saveData()) {
        return 0;
    }

    const regionName = GameConstants.Region[region];
    return saveData().save.statistics.routeKills[regionName][routeNumber] || 0;
};

const hideOtherStatSection = (data) => {
    if (data.hidden) {
        return true;
    }

    const region = data.displayRegion ?? data.region;
    if (region > GameConstants.MAX_AVAILABLE_REGION) {
        return true;
    }

    if (!showAllRegions() && Math.floor(region) > player.highestRegion()) {
        return true;
    }

    return false;
};

$(document).ready(() => {
    const container = document.getElementById('container');
    ko.applyBindings({}, container);
    container.classList.remove('d-none');

    /*document.querySelectorAll('#mainTabs button.nav-link').addEventListener('show.bs.tab', (event) => {
        console.log(event.target);
    });*/

    /*$('#mainTabs button.nav-link').on('show.bs.tab', (event) => {
        //const tab = event.target.dataset.bsTarget
        activeTab(event.target.dataset.bsTarget.substring(1));
        console.log(event.target.dataset.bsTarget.substring(1));
    });*/
});

const arrayToWhatever = (array) => {
    const newArray = [];
    for (let i = 0; i < array.length; i += 2) {
        newArray.push([array[i], array?.[i+1] ]);
    }
    return newArray;
};

/*const activeTab = ko.observable('dungeon-stats');
const isTabActive = (id) => {
    return ko.pureComputed(() => {
        return id == activeTab();
    });
}*/

module.exports = {
    saveData,
    showRequiredOnly,
    showAllRegions,

    loadFile,
    isSaveLoaded,

    getMissingPokemon,
    getTotalMissingPokemonCount,
    getMissingRegionPokemonCount,

    partyList,
    hideFromPokemonStatsTable,
    getPokemonStatsTableCount,
    pokemonStatTableSearch,
    pokemonStatTableFilter,
    isEventDiscordClientPokemon,
    getPokeballImage,
    getPokerusImage,

    getDungeonData,
    getGymData,
    getRouteData,
    hideOtherStatSection,

    arrayToWhatever,
    //isTabActive,
};
