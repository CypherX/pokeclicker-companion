const unownForecast = ko.observableArray();
const weatherForecast = ko.observableArray();
const boostedRoutes = ko.observableArray();
const berryMasters = ko.observableArray();

const generateForecasts = () => {
    const date = new Date();
    const currentHour = date.getHours();
    const unownData = [];
    const weatherData = [];
    const boostedRouteData = [];
    const berryMasterData = [];

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

        // Berry Masters
        BerryDeal.generateDeals(date);
        berryMasterData.push({
            date: new Date(date),
            traderDeals: Object.values(BerryDeal.list).map((d) => [...d()])
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

module.exports = {
    unownForecast,
    weatherForecast,
    boostedRoutes,
    berryMasters,

    generateForecasts,
    getNextWeatherDate,
    getBerryMasterDeals,
    getBerryMasterNextItemDate,
    getBerryMasterPokemonMinMaxCost,
};