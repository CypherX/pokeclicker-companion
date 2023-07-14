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
            switch (filterVal) {
                case 'not-shiny':
                    if (partyPokemon.shiny) {
                        return true;
                    }
                    break;
                case 'not-resistant':
                    if (partyPokemon.pokerus === GameConstants.Pokerus.Resistant) {
                        return true;
                    }
                    break;
                case 'not-resistant-evable':

                    break;
                case 'resistant':
                    if (partyPokemon.pokerus !== GameConstants.Pokerus.Resistant) {
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

const getDungeonList = () => {
    const dungeonList = [];
    const dungeonOverrides = Companion.data.DungeonListOverride.map(d => d.dungeons).flat();

    GameConstants.RegionDungeons.forEach((rd, idx) => {
        dungeonList.push({
            region: idx,
            dungeons: rd.filter(d => !dungeonOverrides.includes(d))
        });
    });

    Companion.data.DungeonListOverride.forEach((rd) => dungeonList.push({...rd}));
    return dungeonList.sort((a, b) => a.region - b.region);
};

const getDungeonClearCount = (dungeon) => {
    if (!saveData()) {
        return 0;
    }

    const dungeonIndex = GameConstants.getDungeonIndex(dungeon);
    return saveData().save.statistics.dungeonsCleared[dungeonIndex] || 0;
};

const getGymList = () => {
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
    return gymList.sort((a, b) => a.region - b.region);
};

const getGymClearCount = (gym) => {
    if (!saveData()) {
        return 0;
    }

    const gymIndex = GameConstants.getGymIndex(gym);
    return saveData().save.statistics.gymsDefeated[gymIndex] || 0;
};

const getRouteList = () => {
    const routeList = [];
    const overrides = Companion.data.RouteListOverride;

    GameHelper.enumNumbers(GameConstants.Region).forEach(region => {
        if (region > GameConstants.MAX_AVAILABLE_REGION || region < 0) {
            return;
        }

        const regionRoutes = Routes.regionRoutes.filter(r => r.region == region);
        const routes = SubRegions.list[region].length == 1 ? regionRoutes
            : regionRoutes.filter(r => !overrides.some(o => o.region === r.region && o.subRegion === r.subRegion));

        routeList.push({
            region: region,
            subRegion: 0,
            routes: routes
        });
    });

    overrides.forEach((r) => routeList.push({...r}));

    routeList.forEach(r => {
        const regionName = GameConstants.camelCaseToString(GameConstants.Region[r.region]);
        r.routes.forEach(route => {
            route.routeName = route.routeName.replace(regionName, '').trim();
        });
    });

    return routeList.sort((a, b) => (a.displayRegion || a.region) - (b.displayRegion || b.region)
        || (a.displaySubRegion || a.subRegion) - (b.displaySubRegion || b.subRegion));
};

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
    partyList,
    hideFromPokemonStatsTable,
    getPokemonStatsTableCount,
    pokemonStatTableSearch,
    pokemonStatTableFilter,
    isEventDiscordClientPokemon,
    getPokeballImage,
    getPokerusImage,

    getDungeonList,
    getDungeonClearCount,
    getGymList,
    getGymClearCount,
    getRouteList,
    getRouteDefeatCount,
    hideOtherStatSection,

    arrayToWhatever,
    //isTabActive,
};


