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

module.exports = {
    unownForecast,
    weatherForecast,
    boostedRoutes,

    generateForecasts,
    getNextWeatherDate,

    defaultToForecastsTab,
};