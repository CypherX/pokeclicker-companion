const saveData = ko.observable(undefined);
const showRequiredOnly = ko.observable(false);
const showAllRegions = ko.observable(false);

const partyList = ko.pureComputed(() => {
    if (!saveData()) {
        return {};
    }

    const party = saveData().save.party.caughtPokemon;
    const statistics = saveData().save.statistics;

    return party.reduce((_map, p) => {
        const partyPokemon = PokemonFactory.generatePartyPokemon(p.id);
        partyPokemon.fromJSON(p);

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

const loadFile = (file) => {
    fr.readAsText(file);
};

const loadSaveData = () => {
    const saveFile = JSON.parse(atob(fr.result));
    player.highestRegion(saveFile.player.highestRegion);
    player.trainerId = saveFile.player.trainerId;
    App.game.challenges.list.slowEVs.active(saveFile.save.challenges.list.slowEVs);

    revealEnigmaHintsCounter(0);

    saveData(saveFile);

    if (saveFile.save.profile.name.toLowerCase() == 'bailey') {
        if (Rand.intBetween(1, 20) == 1) {
            alert('Ȟ̷̨̠͈͖̲̠͍͓̊͂̐e̵͈͖̮̼̼͚͍̳̠̖̺͚̓͝ĺ̷̢̧̧̻̫͚̒l̴̛̲̼͒̽́͒̆̑͑̃̌̎o̸̡̘̞̝̭̙̠̰͋̆̚.̵̡̛̹͙̤̺̳̱͚̹̏͌̓̓̌̿̊̒́͂̂̊͂̚ ̵̨̨̖̭̞̰͖̞̮͚̺̟̰̔B̴̢̰̳͓̬̤̯̬͍̙͎̟͉͓̙̓̈́̓̽͑̍̓̂͑́͘͘a̵̛̭̬͎̪̔͋͌̀͂̏i̷̱͉̪͖̫͇̮͔̯͆̄̔͋͂ḽ̵̳͕͆̎̈́ę̶̛͕̘͎̮̯͙̱͔̙͓͉̿̽̍͂̋̇̏̐̈̽͜y̷̡̟̦̓̍͐̓̆̀̍̂̕.̶̤͖͚̅̅̒̔͘͘ ̴̧̤͔̜̪̦͇̿̀̋͒̾̋͋̚W̸̨̜͍̲̖̱̯̖͇̣̩̉̏͘͘͘͜͝͝e̴̛̩͈̥̻̺̝̲̹͂̈́̉͆̀̀͊́͐.̶̢̱͙̱̱͈͖̳̫̝͇̰̐̏̀̂̎̇͋͛͛̇̉͐́̚̕ͅͅ ̸̙̩̥͕̪̖̅̆̓̏̕͝͝͝ͅS̸̙͈̺͙̟͓̠̼͍͖̭͇͂̍̊͂̎̃̂͜e̸̟͊́̈́͆̉̽̎̔̈̊̔̑̕̕̚e̷̛̯̼̱͐͊͒̈́́̽͐̏̉̔.̴̧̛̉̈̊͛͐ ̶̨͕̗̱̙͚̗̩͉̖̥͈̠̬̑̉̀Ỹ̷̡͖̪̝̦͈̲͘͝o̵̢͍̗͍̱̪̮̊͛͛͋̂̆̔̒͊́̈͂̾̋ͅû̶̹̳̽͌̊̌̓̑͝.̶̡̢̹̤͚͚̟͇͕͖̦̠̪͆̍̈̉̉̈́͆̑̎̆͘̚͝ ̶̙͈͋̾͊̆̒̌͐̂Ŵ̸̧̺̗̥̲͈̳̟̜͚̜͚̏̽͗̊̾̐̿̉͝ȩ̵̼̪͎͉͇͙̭͎̻͈͗̈́͂̓̈́̒̃̈̔̋̉̂̈̕ͅ.̷̤͔͕̎̎̐̂͆̈́̀ ̸̢̧̻̗̯̥͓̥͕̱̖̬̲̅́̒͌̿̎̔͌̈͌̀͠͠ͅͅÂ̸̛̛̖͕̱̫̲̞̯̫͉͖̻̳͂̂̅̈́̑̓́͐̈̀r̷̢̗̳̗̤͔͓̻̳̳̠̳̬̩̞̆̎̾̈́͋̊̕͝e̴͓͇͙̬͔̼͔͇̋̋̐̐̽͐̈́͘̚.̸͍̞̼͈̖̩̮̹̈́̊̄͠ ̴͓͔̬̟̈́̈W̵͍͍̼̜̤͔̭̻̞̫̹̎̇̿́̀͘ͅa̷̡̡̨̩̙͍͖̜̍̾̈́͊̽̂͂͜t̵̟͚͙͇̫͚̠̭͈̣̘̫͆͒̑͊̀͒̆̉́͑͋̊̕͘ͅç̶̮͉͍̫̋̅̅̓͑͠ḩ̷͕̟̠̩̼̼͓̜̳̦͝ĭ̵̧̢̨̼͓̩͈̮͖͖͓̰͕̈́̈́͂̋̅̐̍̔̎̀́̕n̸̛͚͕̝̐́̿͌͂̊͛̓̂̓̓͑͋͝g̸̞̠̭͖̯̲͕̫̗͖͔͙̀̿̇͜.̸̨̡̢̱͖͙̰͍͙̟͈͓̪͙͊̓̆̃́̀̀̈́');
        } else {
            const hour = (new Date()).getHours();
            if (hour < 5) {
                alert('Bailey! What are you still doing up!? GO TO BED!');
            } else if (hour < 12) {
                alert('Good morning, Bailey! Did you sleep well?');
            } else if (hour < 18) {
                alert('Good afternoon, Bailey! We missed you. Enjoy your stay.');
            } else if (hour < 22) {
                alert('Good evening, Bailey. How was your day? ');
            } else {
                alert('Hello, Bailey. It\'s getting kind of late, perhaps consider retiring to bed soon?');
            }
        }
    }
};

const fr = new FileReader();
fr.addEventListener('load', loadSaveData);

const isSaveLoaded = ko.pureComputed(() => {
    return saveData() !== undefined;
});

const getSortedPartyList = ko.pureComputed(() => {
    if (!saveData()) {
        return [];
    }

    const sortOption = pokemonStatTableSort();
    const sortDirection = pokemonStatTableSortDir();
    return Object.values(partyList()).sort(compareBy(sortOption, sortDirection));
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
        return `./pokeclicker/docs/assets/images/pokeball/Pokeball${partyPokemon.shiny ? '-shiny' : ''}.svg`;
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
    if (partyPokemon) {
        return `./pokeclicker/docs/assets/images/breeding/pokerus/${GameConstants.Pokerus[partyPokemon.pokerus]}.png`;
    } else {
        return '';
    }
};

const getShadowStatusImage = (shadowStatus) => {
    return `./pokeclicker/docs/assets/images/status/${shadowStatus == 1 ? 'shadow' : 'purified'}.svg`;
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
            clears: isSaveLoaded() ? getDungeonClearCount(dungeon) : 0,
            hide: TownList[dungeon].requirements.some(req => req instanceof DevelopmentRequirement),
        })).filter(d => !d.hide);
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

const getFriendSafariForecast = ko.pureComputed(() => {
    if (!saveData()) {
        return [];
    }

    const trainerId = saveData().player.trainerId || '000000';
    SeededRand.seed(+trainerId);
    const shuffledPokemon = new Array(5).fill(SeededRand.shuffleArray(Companion.data.friendSafariPokemon)).flat();

    const batchCount = Math.ceil(shuffledPokemon.length / 5);
    const date = new Date();
    let startIndex = (Math.floor((date.getTime() - date.getTimezoneOffset() * 60 * 1000) / (24 * 60 * 60 * 1000)) % batchCount) * 5;

    const data = [];
    for (let i = 0; i < Math.ceil(Companion.data.friendSafariPokemon.length / 5); i++) {
        data.push({
            date: new Date(date),
            pokemon: shuffledPokemon.slice(startIndex, startIndex + 5)
        });
        startIndex += 5;
        if (startIndex >= shuffledPokemon.length) {
            startIndex = 0;
        }
        date.setDate(date.getDate() + 1);
    }

    return data;
});

// Enigma
const revealEnigmaHints = ko.pureComputed(() => revealEnigmaHintsCounter() > 4);
const revealEnigmaHintsCounter = ko.observable(0);
const revealEnigmaHintsButtonText = ko.pureComputed(() => {
    const textOptions = [
        'Reveal Required Berries (may result in being judged)',
        'Are you SURE!?',
        'No, really, are you ABSOLUTELY SURE??',
        'Just get the hints normally, man.',
        'Fine. Have it your way >:(',
    ];
    return textOptions[revealEnigmaHintsCounter()] || '...';
});
const revealEnigmaHintsButtonClick = () => {
    revealEnigmaHintsCounter(revealEnigmaHintsCounter() + 1);
}
const getEnigmaBerries = ko.pureComputed(() => {
    const berries = ['North', 'West', 'East', 'South'].map(d => ({ direction: d, berry: undefined }));
    if (!saveData()) {
        return berries;
    }

    const enigmaMutationIdx = App.game.farming.mutations.findIndex(m => m.mutatedBerry == BerryType.Enigma);
    const hintsSeen = saveData().save.farming.mutations[enigmaMutationIdx];

    for (let i = 0; i < berries.length; i++) {
        if (hintsSeen[i] || revealEnigmaHints()) {
            berries[i].berry = BerryType[EnigmaMutation.getReqs()[i]];
        }
    }

    return berries;
});
// Enigma - End

// Forecasts

const unownForecast = ko.observableArray();
const weatherForecast = ko.observableArray();
const boostedRoutes = ko.observableArray();

const generateForecasts = () => {
    const date = new Date();
    const currentHour = date.getHours();
    const unownData = [];
    const weatherData = [];
    const boostedRouteData = [];

    for (let day = 0; day < 120; day++) {

        // Unown
        SeededDateRand.seedWithDate(date);
        unownData.push({
            startDate: new Date(date),
            unowns: [
                SeededDateRand.fromArray(AlphUnownList),
                SeededDateRand.fromArray(TanobyUnownList),
                SeededDateRand.fromArray(SolaceonUnownList),
            ]
        });

        // Weather
        for (let hour = 0; hour <= 23; hour += Weather.period) {
            const hourDate = new Date(date.setHours(hour, 0, 0, 0));
            const weather = { startDate: hourDate, regionalWeather: {} };
            for (let region = GameConstants.Region.kanto; region <= GameConstants.MAX_AVAILABLE_REGION; region++) {
                weather.regionalWeather[region] = Weather.getWeather(region, hourDate);
            }
            weatherData.push(weather);
        }

        // Boosted Routes
        // only generate a few days worth
        if (boostedRouteData.length < 9) {
            for (let hour = 0; hour <= 23; hour += RoamingPokemonList.period) {
                const hourDate = new Date(date.setHours(hour, 0, 0, 0));
                RoamingPokemonList.generateIncreasedChanceRoutes(hourDate);

                const boostedRoute = { startDate: hourDate, regionalRoutes: [] };
                Companion.data.roamerGroups.forEach((rg) => {
                    const route = RoamingPokemonList.getIncreasedChanceRouteBySubRegionGroup(rg.region, rg.subRegionGroup)();
                    boostedRoute.regionalRoutes.push(route.routeName.replace('Route ', ''));
                });

                boostedRouteData.push(boostedRoute);
            }
        }

        date.setDate(date.getDate() + 1);
    }

    // Remove past data
    weatherData.splice(0, Math.floor(currentHour / Weather.period));
    boostedRouteData.splice(0, Math.floor(currentHour / RoamingPokemonList.period));

    unownForecast(unownData);
    weatherForecast(weatherData);
    boostedRoutes(boostedRouteData.slice(0, 6));
};

const getNextWeatherDate = (region, weather) => {
    return weatherForecast().find(wf => wf.regionalWeather[region] === weather)?.startDate;
};

const defaultToForecastsTab = ko.observable(false);
defaultToForecastsTab.subscribe((value) => {
    localStorage.setItem('defaultToForecastsTab', +value);
});

if (+localStorage.getItem('defaultToForecastsTab')) {
    defaultToForecastsTab(true);
    (new bootstrap.Tab(document.getElementById('forecasts-tab'))).show();
}

// Forecasts - End

$(document).ready(() => {
    const container = document.getElementById('container');
    ko.applyBindings({}, container);
    container.classList.remove('d-none');

    $('#pokemonStatsTable > thead th.sortable').click((e) => {
        const sort = e.target.dataset.sort;
        if (pokemonStatTableSort() == sort) {
            pokemonStatTableSortDir(!pokemonStatTableSortDir());
        } else {
            pokemonStatTableSort(sort);
            pokemonStatTableSortDir(true);
        }
    });

    generateForecasts();
});

const arrayToWhatever = (array) => {
    const newArray = [];
    for (let i = 0; i < array.length; i += 2) {
        newArray.push([array[i], array?.[i+1] ]);
    }
    return newArray;
};

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

const dateAddHours = (startDate, hours) => {
    const date = new Date(startDate);
    date.setHours(date.getHours() + hours);
    return date;
};

const formatTime24Hours = (date) => {
    if (!date) return undefined;
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const formatDate = (date) => {
    if (!date) return undefined;
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
};

const formatDateTime = (date) => {
    if (!date) return undefined;
    return `${formatDate(date)} ${formatTime24Hours(date)}`;
};

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
    getSortedPartyList,

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

    getDungeonData,
    getGymData,
    getRouteData,
    hideOtherStatSection,

    getEnigmaBerries,
    revealEnigmaHints,
    revealEnigmaHintsButtonText,
    revealEnigmaHintsButtonClick,

    generateForecasts,
    defaultToForecastsTab,
    unownForecast,
    weatherForecast,
    boostedRoutes,
    getFriendSafariForecast,
    getNextWeatherDate,

    formatDate,
    formatDateTime,
    formatTime24Hours,
    dateAddHours,

    arrayToWhatever,
};
