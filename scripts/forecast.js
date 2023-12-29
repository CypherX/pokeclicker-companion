const unownForecast = ko.observableArray();
const weatherForecast = ko.observableArray();
const boostedRoutes = ko.observableArray();
const berryMasters = ko.observableArray();
const dailyDeals = ko.observableArray();

const generateForecasts = (date = new Date()) => {
    const currentHour = date.getHours();
    const unownData = [];
    const weatherData = [];
    const boostedRouteData = [];
    const berryMasterData = [];
    const dailyDealData = [];

    for (let day = 0; day < 365; day++) {
        const saveDate = new Date(date);

        // Unown
        SeededDateRand.seedWithDate(date);
        unownData.push({
            startDate: saveDate,
            unowns: [
                SeededDateRand.fromArray(AlphUnownList),
                SeededDateRand.fromArray(TanobyUnownList),
                SeededDateRand.fromArray(SolaceonUnownList),
            ]
        });

        // Berry Masters
        BerryDeal.generateDeals(date);
        berryMasterData.push({
            date: saveDate,
            traderDeals: Object.values(BerryDeal.list).map((d) => [...d()])
        });

        // Daily Deals
        DailyDeal.generateDeals(5, date);
        dailyDealData.push({
            date: saveDate,
            deals: [...DailyDeal.list()]
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
    berryMasters(berryMasterData);
    dailyDeals(dailyDealData);
};

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

    getBerryMasterDeals(berryTrader).forEach((t) => t.deals.forEach((d) => {
        const itemName = d.item.itemType.name;
        if (!items[itemName]) {
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

const getUndergroundItemList = () => {
    return UndergroundItems.list
        .filter(i => i.valueType !== UndergroundItemValueType.MegaStone)
        .map(i => i.name)
        .sort((a, b) => a.localeCompare(b))
};

const getNextOccurrenceUndergroundItems = () => {
    const items = getUndergroundItemList().reduce((a, v) => ({ ...a, [v]: {} }), {});
    dailyDeals().forEach((d) => d.deals.forEach((deal) => {
        if (!items[deal.item1.name].give) {
            items[deal.item1.name].give = {
                date: d.date,
                ...deal
            };
        }

        if (!items[deal.item2.name].receive) {
            items[deal.item2.name].receive = {
                date: d.date,
                ...deal
            };
        }
    }));

    return items;
};

const selectedDailyDealItemNextTrades = ko.pureComputed(() => {
    const item = selectedDailyDealItem();
    if (!item) {
        return [];
    }

    return findNextTradesForItem(item);
});

const findNextTradesForItem = (itemName, days = 1095) => {
    if (!itemName) {
        return [];
    }

    const date = new Date();
    const deals = [];
    for (let i = 0; i < days; i++) {
        DailyDeal.generateDeals(5, date);
        const saveDate = new Date(date);
        deals.push(
            ...DailyDeal.list()
                .filter((deal) => deal.item1.name == itemName || deal.item2.name == itemName)
                .map((deal) => ({ date: saveDate, ...deal }))
        );
        date.setDate(date.getDate() + 1);
    }

    return deals;
};

const selectedDailyDealItem = ko.observable();

module.exports = {
    unownForecast,
    weatherForecast,
    boostedRoutes,
    berryMasters,
    dailyDeals,

    selectedDailyDealItem,
    selectedDailyDealItemNextTrades,

    generateForecasts,
    getUpcomingWeather,
    getNextWeatherDate,
    getBerryMasterDeals,
    getBerryMasterNextItemDate,
    getBerryMasterPokemonMinMaxCost,
    getUndergroundItemList,
    getNextOccurrenceUndergroundItems,
};