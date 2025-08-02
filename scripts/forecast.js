const unownForecast = ko.observableArray();
const weatherForecast = ko.observableArray();
const boostedRoutes = ko.observableArray();
const berryMasters = ko.observableArray();

const summaryDate = ko.observable(new Date());
const summary = ko.observable({
    unown: [],
    weather: [],
    boostedRoutes: [],
    berryTrades: [],
    islandScan: {},
});

const generateForecasts = (date = new Date()) => {
    const currentHour = date.getHours();
    const unownData = [];
    const weatherData = [];
    const boostedRouteData = [];
    const berryMasterData = [];

    for (let day = 0; day < 180; day++) {
        const saveDate = new Date(date);

        // Unown
        unownData.push({
            startDate: saveDate,
            unowns: getUnownByDate(date),
        });

        // Berry Masters
        berryMasterData.push({
            date: saveDate,
            traderDeals: getBerryDealsByDate(date),
        });

        // Weather
        weatherData.push(...getRegionalWeatherByDate(date));

        // Boosted Routes
        // only generate a few days worth
        if (boostedRouteData.length < 9) {
            boostedRouteData.push(...getBoostedRoutesByDate(date));
        }

        date.setDate(date.getDate() + 1);
    }

    // Remove past data
    weatherData.splice(0, Math.floor(currentHour / Weather.period));
    boostedRouteData.splice(0, Math.floor(currentHour / RoamingPokemonList.period));

    unownForecast(unownData);
    weatherForecast(weatherData);
    boostedRoutes(boostedRouteData.slice(0, 6));
    berryMasters(berryMasterData);
};

const generateDailySummary = (date = new Date()) => {
    summaryDate(new Date(date));
    summary({
        unown: getUnownByDate(date),
        weather: getRegionalWeatherByDate(date),
        boostedRoutes: getBoostedRoutesByDate(date),
        berryTrades: getBerryDealsByDate(date),
        islandScan: getIslandScanPokemonByDate(date),
    });
};

const getUnownByDate = (date = new Date()) => {
    SeededDateRand.seedWithDate(date);
    return [
        getDailyUnown(date, AlphUnownList),
        getDailyUnown(date, TanobyUnownList),
        getDailyUnown(date, SolaceonUnownList),
    ];
};

const getDailyUnown = (date, unownList) => {
    SeededRand.seedWithDate(date);
    const shuffled = SeededRand.shuffleArray([...Array(unownList.length).keys()]);
    return shuffled.slice(0, 3).map(idx => unownList[idx]);
};

const getBerryDealsByDate = (date = new Date()) => {
    BerryDeal.generateDeals(date);
    return Object.values(BerryDeal.list).map((d) => [...d()]);
};

const getRegionalWeatherByDate = (date = new Date()) => {
    const weatherData = [];
    for (let hour = 0; hour <= 23; hour += Weather.period) {
        const hourDate = new Date(date.setHours(hour, 0, 0, 0));
        const weather = { startDate: hourDate, regionalWeather: {} };
        for (let region = GameConstants.Region.kanto; region <= GameConstants.MAX_AVAILABLE_REGION; region++) {
            weather.regionalWeather[region] = Weather.getWeather(region, hourDate);
        }
        weatherData.push(weather);
    }
    return weatherData;
};

const getBoostedRoutesByDate = (date = new Date()) => {
    const routeData = [];
    for (let hour = 0; hour <= 23; hour += RoamingPokemonList.period) {
        const hourDate = new Date(date.setHours(hour, 0, 0, 0));
        RoamingPokemonList.generateIncreasedChanceRoutes(hourDate);

        const boostedRoute = { startDate: hourDate, regionalRoutes: [] };
        Companion.data.roamerGroups.forEach((rg) => {
            const route = RoamingPokemonList.getIncreasedChanceRouteBySubRegionGroup(rg.region, rg.subRegionGroup)();
            boostedRoute.regionalRoutes.push(route.routeName.replace('Route ', ''));
        });

        routeData.push(boostedRoute);
    }
    return routeData;
};

const getEnigmaDirectionByDate = (date = new Date()) => {
    SeededRand.seedWithDate(date);
    return directionFromIndex(SeededRand.floor(4));
};

const directionFromIndex = (index) => {
    switch (index) {
        case 0:
            return 'North';
        case 1:
            return 'West';
        case 2:
            return 'East';
        case 3:
            return 'South';
    }
}

const getUpcomingWeather = () => {
    const dayForecast = weatherForecast.slice(0, 18).reduce((map, wf) => {
        const date = Util.formatDate(wf.startDate);
        map[date] = map[date] || [];
        map[date].push(wf);
        return map;
    }, {});

    return Object.entries(dayForecast).map(([date, forecast]) => ({ date, forecast }));
};

const getNextWeatherDate = (region, weather) => {
    return weatherForecast().find(wf => wf.regionalWeather[region] === weather)?.startDate;
};

const getBerryMasterDeals = (berryTrader, days = undefined) => {
    const deals = days != undefined ? berryMasters().slice(0, days) : berryMasters();
    return deals.map(d => ({ date: d.date, deals: d.traderDeals[berryTrader] }));
};

const getBerryMasterNextItemDate = (berryTrader) => {
    const items = {};
    const timestamp = new Date().setHours(0, 0, 0, 0);

    getBerryMasterDeals(berryTrader).forEach((t) => t.deals.forEach((d) => {
        const itemName = d.item.itemType.name;
        if (!items[itemName] && t.date.setHours(0, 0, 0, 0) > timestamp) {
            items[itemName] = {
                date: t.date,
                item: d.item.itemType._displayName || itemName,
                amount: d.item.amount,
                berries: d.berries
            };
        }
    }));

    return Object.values(items).sort((a, b) => a.item.localeCompare(b.item));
};

const isAvailableFromBerryMasterToday = (berryTrader, item) => {
    const deals = getBerryMasterDeals(berryTrader, 1)[0].deals;
    return deals?.some(d => (d.item.itemType._displayName || d.item.itemType.name) == item) ?? false;
}

const getBerryMasterPokemonMinMaxCost = (berryTrader) => {
    const pokemonList = [...Companion.data.berryMasterPokemonCosts[berryTrader]];
    pokemonList.forEach((p) => {
        p.minDate = getBerryMasterNextPokemonCost(berryTrader, p.pokemon, p.minCost),
        p.maxDate = getBerryMasterNextPokemonCost(berryTrader, p.pokemon, p.maxCost)
    });

    return pokemonList;
};

const getBerryMasterNextPokemonCost = (berryTrader, pokemonName, cost) => {
    return getBerryMasterDeals(berryTrader).find(t => t.deals.find(d => d.item.itemType.name == pokemonName && d.berries[0].amount == cost))?.date;
};

const getIslandScanPokemonByDate = (date = new Date()) => {
    const data = { route: [], dungeon: [] };

    for (const route of Routes.getRoutesByRegion(GameConstants.Region.alola)) {
        const special = route.pokemon.special.filter(s => s.req instanceof DayOfWeekRequirement && s.req.DayOfWeekNum == date.getDay());
        if (special.length) {
            data.route.push({
                name: route.routeName,
                pokemon: special.flatMap(s => s.pokemon),
            });
        }
    }

    GameConstants.RegionDungeons[GameConstants.Region.alola].forEach((name) => {
        const dungeon = dungeonList[name];
        const pokemon = [];

        const enemies = dungeon.enemyList.filter(e => {
            if (typeof e !== 'object') {
                return false;
            }

            const req = e.options.requirement instanceof DayOfWeekRequirement
                ? e.options.requirement
                : e.options.requirement?.requirements?.find(r => r instanceof DayOfWeekRequirement);

            if (req?.DayOfWeekNum !== date.getDay()) {
                return false;
            }

            return true;
        });

        if (enemies.length) {
            pokemon.push(...enemies.flatMap(e => e.pokemon));
        }

        const bosses = dungeon.bossList.filter(b => {
            const req = b.options?.requirement instanceof DayOfWeekRequirement
                ? b.options?.requirement
                : b.options?.requirement?.requirements?.find(r => r instanceof DayOfWeekRequirement);

            if (req?.DayOfWeekNum !== date.getDay()) {
                return false;
            }

            return true;
        });

        if (bosses.length) {
            pokemon.push(...bosses.flatMap(b => b.name));
        }

        if (pokemon.length) {
            data.dungeon.push({
                name: name,
                pokemon: pokemon,
            })
        }
    });

    return data;
};

module.exports = {
    unownForecast,
    weatherForecast,
    boostedRoutes,
    berryMasters,
    summary,
    summaryDate,

    generateForecasts,
    generateDailySummary,
    getUpcomingWeather,
    getNextWeatherDate,
    getBerryMasterDeals,
    getBerryMasterNextItemDate,
    getBerryMasterPokemonMinMaxCost,
    isAvailableFromBerryMasterToday,
    getIslandScanPokemonByDate,
};