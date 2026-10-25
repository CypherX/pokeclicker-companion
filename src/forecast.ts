import { berryMasterPokemonCosts, roamerGroups, type BerryMasterPokemonCost } from './data';
import * as SaveData from './save';
import { getTrophyGardenByDate, getUnownByDate } from './shared/dailyForecasts';
import type { BerryCost, ForecastBerryDeal, ForecastData, ForecastGenericDeal } from './types/dataFiles';
import { formatDate, loadDataFile } from './util';

/* ------------------------------------------------------------------ */
/* Forecasts                                                          */
/* ------------------------------------------------------------------ */

interface UnownForecast { startDate: Date; unowns: string[][] }
interface WeatherForecast { startDate: Date; regionalWeather: Record<number, WeatherType> }
interface BoostedRouteForecast { startDate: Date; regionalRoutes: string[] }
interface BerryMasterForecast { date: Date; traderDeals: ForecastBerryDeal[][] }
interface GenericDealForecast { date: Date; deals: Record<string, ForecastGenericDeal[]> }
interface TrophyGardenForecast { date: Date; encounters: PokemonNameType[] }

export const unownForecast = ko.observableArray<UnownForecast>();
export const weatherForecast = ko.observableArray<WeatherForecast>();
export const boostedRoutes = ko.observableArray<BoostedRouteForecast>();
export const berryMasters = ko.observableArray<BerryMasterForecast>();
export const genericDealForecast = ko.observableArray<GenericDealForecast>();
export const trophyGardenForecast = ko.observableArray<TrophyGardenForecast>();

export const dataLoaded = ko.observable(false);

export const berryMasterList = GameHelper.enumStrings(GameConstants.BerryTraderLocations).filter(s => s != 'None');

export const genericDealList = ko.pureComputed(() => {
    const unique = new Set(genericDealForecast().flatMap(a => Object.keys(a.deals)));
    return [...unique];
});

const generateForecasts = (data: ForecastData) => {
    const unownData: UnownForecast[] = [];
    const weatherData: WeatherForecast[] = [];
    const boostedRouteData: BoostedRouteForecast[] = [];
    const berryMasterData: BerryMasterForecast[] = [];
    const genericDealData: GenericDealForecast[] = [];
    const trophyGardenData: TrophyGardenForecast[] = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const atHour = (date: Date, hour: number) => {
        const hourDate = new Date(date);
        hourDate.setHours(hour);
        return hourDate;
    };

    for (const [strDate, forecast] of Object.entries(data)) {
        const [y, m, d] = strDate.split('-').map(Number);
        const date = new Date(y, m - 1, d);

        if (date < today) { // skip previous days
            continue;
        }

        unownData.push({ startDate: date, unowns: forecast.unown });
        berryMasterData.push({ date, traderDeals: forecast.berryDeal });

        for (const weather of forecast.weather) {
            weatherData.push({ startDate: atHour(date, weather.hour), regionalWeather: weather.weather });
        }

        for (const boosted of forecast.boostedRoute) {
            boostedRouteData.push({ startDate: atHour(date, boosted.hour), regionalRoutes: boosted.routes.flat() });
        }

        genericDealData.push({ date, deals: forecast.genericDeals });
        trophyGardenData.push({ date, encounters: forecast.trophyGarden });
    }

    // Remove periods that have already passed today
    const currentHour = new Date().getHours();
    weatherData.splice(0, Math.floor(currentHour / Weather.period));
    boostedRouteData.splice(0, Math.floor(currentHour / RoamingPokemonList.period));

    unownForecast(unownData);
    weatherForecast(weatherData);
    boostedRoutes(boostedRouteData.slice(0, 6));
    berryMasters(berryMasterData);
    genericDealForecast(genericDealData);
    trophyGardenForecast(trophyGardenData);
};

/* ------------------------------------------------------------------ */
/* Daily summary (computed live from the game for the selected date)  */
/* ------------------------------------------------------------------ */

interface IslandScanData {
    route: { name: string; pokemon: PokemonNameType[] }[];
    dungeon: { name: string; pokemon: PokemonNameType[] }[];
}

interface DailySummary {
    unown: string[][];
    weather: WeatherForecast[];
    boostedRoutes: BoostedRouteForecast[];
    berryTrades: BerryDeal[][];
    islandScan: IslandScanData | Record<string, never>;
    trophyGarden: PokemonNameType[];
}

export const summaryDate = ko.observable(new Date());
export const summary = ko.observable<DailySummary>({
    unown: [],
    weather: [],
    boostedRoutes: [],
    berryTrades: [],
    islandScan: {},
    trophyGarden: [],
});

export const generateDailySummary = (date = new Date()): void => {
    summaryDate(new Date(date));
    summary({
        unown: getUnownByDate(date),
        weather: getRegionalWeatherByDate(date),
        boostedRoutes: getBoostedRoutesByDate(date),
        berryTrades: getBerryDealsByDate(date),
        islandScan: getIslandScanPokemonByDate(date),
        trophyGarden: getTrophyGardenByDate(date),
    });
};

const getBerryDealsByDate = (date: Date): BerryDeal[][] => {
    BerryDeal.generateDeals(date);
    return Object.values(BerryDeal.list).map((d) => [...d!()]);
};

// Note: these set the hour on the passed date in place, matching the game's own forecast generation
const getRegionalWeatherByDate = (date: Date): WeatherForecast[] => {
    const weatherData: WeatherForecast[] = [];
    for (let hour = 0; hour <= 23; hour += Weather.period) {
        const hourDate = new Date(date.setHours(hour, 0, 0, 0));
        const weather: WeatherForecast = { startDate: hourDate, regionalWeather: {} };
        for (let region = GameConstants.Region.kanto; region <= GameConstants.MAX_AVAILABLE_REGION; region++) {
            weather.regionalWeather[region] = Weather.getWeather(region, hourDate);
        }
        weatherData.push(weather);
    }
    return weatherData;
};

const getBoostedRoutesByDate = (date: Date): BoostedRouteForecast[] => {
    const routeData: BoostedRouteForecast[] = [];
    for (let hour = 0; hour <= 23; hour += RoamingPokemonList.period) {
        const hourDate = new Date(date.setHours(hour, 0, 0, 0));
        RoamingPokemonList.generateIncreasedChanceRoutes(hourDate);

        const regionalRoutes = roamerGroups.map((rg) => {
            const route = RoamingPokemonList.getIncreasedChanceRouteBySubRegionGroup(rg.region, rg.subRegionGroup)();
            return route.routeName.replace('Route ', '');
        });

        routeData.push({ startDate: hourDate, regionalRoutes });
    }
    return routeData;
};

const findDayOfWeekRequirement = (requirement: Requirement | null | undefined): DayOfWeekRequirement | undefined => {
    return requirement instanceof DayOfWeekRequirement
        ? requirement
        : requirement?.requirements?.find((r): r is DayOfWeekRequirement => r instanceof DayOfWeekRequirement);
};

/** Alola pokémon that only appear on certain days of the week */
const getIslandScanPokemonByDate = (date: Date): IslandScanData => {
    const data: IslandScanData = { route: [], dungeon: [] };
    const day = date.getDay();

    for (const route of Routes.getRoutesByRegion(GameConstants.Region.alola)) {
        const special = route.pokemon.special.filter(s => s.req instanceof DayOfWeekRequirement && s.req.DayOfWeekNum == day);
        if (special.length) {
            data.route.push({
                name: route.routeName,
                pokemon: special.flatMap(s => s.pokemon),
            });
        }
    }

    GameConstants.RegionDungeons[GameConstants.Region.alola].forEach((name) => {
        const dungeon = dungeonList[name];

        const enemies = dungeon.enemyList.filter((e): e is DetailedPokemon | DungeonTrainer =>
            typeof e === 'object' && findDayOfWeekRequirement(e.options?.requirement)?.DayOfWeekNum === day);

        const bosses = dungeon.bossList.filter(b =>
            findDayOfWeekRequirement(b.options?.requirement)?.DayOfWeekNum === day);

        const pokemon = [
            ...enemies.flatMap(e => (e as DetailedPokemon).pokemon),
            ...bosses.flatMap(b => b.name),
        ];

        if (pokemon.length) {
            data.dungeon.push({ name, pokemon });
        }
    });

    return data;
};

/* ------------------------------------------------------------------ */
/* Weather                                                            */
/* ------------------------------------------------------------------ */

export const getUpcomingWeather = (): { date: string; forecast: WeatherForecast[] }[] => {
    const dayForecast: Record<string, WeatherForecast[]> = {};
    weatherForecast().slice(0, 18).forEach((wf) => {
        const date = formatDate(wf.startDate);
        (dayForecast[date] ??= []).push(wf);
    });

    return Object.entries(dayForecast).map(([date, forecast]) => ({ date, forecast }));
};

export const getNextWeatherDate = (region: GameConstants.Region, weather: WeatherType): Date | undefined => {
    return weatherForecast().find(wf => wf.regionalWeather[region] === weather)?.startDate;
};

/* ------------------------------------------------------------------ */
/* Berry Masters                                                      */
/* ------------------------------------------------------------------ */

export const getBerryMasterDeals = (berryTrader: GameConstants.BerryTraderLocations, days?: number) => {
    const deals = days != undefined ? berryMasters().slice(0, days) : berryMasters();
    return deals.map(d => ({ date: d.date, deals: d.traderDeals[berryTrader] }));
};

export const berryMasterSearchSetting = berryMasterList.map(() => ko.observable(''));
export const berryMasterDisplaySetting = berryMasterList.map(() => ko.observable('alpha'));

interface BerryMasterItemDeal {
    date: Date;
    amount: number;
    berries: BerryCost[];
}

export const getItemListByBerryMaster = (berryTrader: GameConstants.BerryTraderLocations) => {
    return ko.pureComputed(() => {
        const itemMap: Record<string, BerryMasterItemDeal[]> = {};

        for (const day of getBerryMasterDeals(berryTrader)) {
            for (const deal of day.deals) {
                const itemName = ItemList[deal.item.itemName].displayName;
                (itemMap[itemName] ??= []).push({
                    date: day.date,
                    amount: deal.item.amount,
                    berries: deal.berries,
                });
            }
        }

        const searchVal = berryMasterSearchSetting[berryTrader]().trim().toLowerCase();
        const sort = berryMasterDisplaySetting[berryTrader]();
        const itemList = Object.entries(itemMap)
            .filter(([itemName]) => !searchVal.length || itemName.toLowerCase().includes(searchVal))
            .map(([itemName, deals]) => ({ item: itemName, deals }));

        if (sort === 'next') {
            return itemList.sort((a, b) => (+a.deals[0].date - +b.deals[0].date || a.item.localeCompare(b.item)));
        }
        return itemList.sort((a, b) => a.item.localeCompare(b.item));
    });
};

/** How many times the player could make a trade with the berries in their save */
export const calcBerryMasterDealAfford = (berries: BerryCost[]): number => {
    if (!SaveData.isLoaded()) {
        return 0;
    }

    const berryInventory = SaveData.getBerryInventory();
    return Math.min(...berries.map(b => Math.floor(berryInventory[b.berryType] / b.amount)));
};

const getBerryMasterNextPokemonCost = (berryTrader: GameConstants.BerryTraderLocations, pokemonName: PokemonNameType, cost: number) => {
    return getBerryMasterDeals(berryTrader)
        .find(t => t.deals.find(d => d.item.itemName == pokemonName && d.berries[0].amount == cost))?.date;
};

export const getBerryMasterPokemonMinMaxCost = (berryTrader: GameConstants.BerryTraderLocations) => {
    return (berryMasterPokemonCosts[berryTrader] ?? []).map((p: BerryMasterPokemonCost) => ({
        ...p,
        minDate: getBerryMasterNextPokemonCost(berryTrader, p.pokemon, p.minCost),
        maxDate: getBerryMasterNextPokemonCost(berryTrader, p.pokemon, p.maxCost),
    }));
};

/* ------------------------------------------------------------------ */
/* Other                                                              */
/* ------------------------------------------------------------------ */

export const getGenericDealsByShop = (shop: string, days = 7) => {
    return genericDealForecast().slice(0, days).map(d => ({ date: d.date, deals: d.deals[shop] }));
};

export const getTrophyGardenNextPokemonDate = (includeToday = true): { pokemon: PokemonNameType; date: Date }[] => {
    const today = new Date().setHours(0, 0, 0, 0);
    const forecast = includeToday
        ? trophyGardenForecast()
        : trophyGardenForecast().filter(t => t.date.getTime() > today);

    const nextDates: Record<PokemonNameType, Date> = {};
    forecast.forEach((t) => t.encounters.forEach((name) => {
        nextDates[name] ??= t.date;
    }));

    return Object.entries(nextDates)
        .map(([pokemon, date]) => ({ pokemon, date }))
        .sort((a, b) => a.pokemon.localeCompare(b.pokemon));
};

export const initialize = (): void => {
    loadDataFile<ForecastData>('forecastData.json', (data) => {
        generateForecasts(data);
        generateDailySummary();
        dataLoaded(true);
    });
};
