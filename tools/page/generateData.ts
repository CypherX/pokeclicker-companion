/**
 * Generates the companion's data files from a running game.
 * Bundled and injected into the game page by tools/updateData.ts, exposed as `CompanionDataGenerator`.
 */

import { calcEggSteps, getBestVitamins, getBreedingAttackBonus, type VitaminCounts } from '../../src/shared/breeding';
import { getTrophyGardenByDate, getUnownByDate } from '../../src/shared/dailyForecasts';
import type {
    ForecastBerryDeal, ForecastData, ForecastDay, ForecastGenericDeal, OptimalVitaminsData, RegionVitamins, SerializedDealCostOrProfit,
} from '../../src/types/dataFiles';
import { formatDate } from '../../src/util';

export const generateOptimalVitamins = (): OptimalVitaminsData => {
    const data: OptimalVitaminsData = {};
    for (const p of pokemonList.filter(p => p.id > 0)) {
        const regionVitamins: RegionVitamins[] = [];
        for (let region = 0; region <= GameConstants.MAX_AVAILABLE_REGION; region++) {
            const res = getBestVitamins(p, region);
            const vitamins: VitaminCounts = [res.protein, res.calcium, res.carbos];
            regionVitamins.push({
                bestVitamins: vitamins,
                breedingEfficiency: res.eff,
                vitaminEggSteps: calcEggSteps(vitamins, p.eggCycles),
                attackBonus: getBreedingAttackBonus(vitamins, p.attack),
            });
        }
        data[p.id] = regionVitamins;
    }
    return data;
};

const getBerryDealsByDate = (date: Date): ForecastBerryDeal[][] => {
    BerryDeal.generateDeals(date);
    return Object.values(BerryDeal.list).map(deals => [...deals!()].map(deal => ({
        berries: deal.berries,
        item: {
            amount: deal.item.amount,
            itemName: deal.item.itemType.name,
        },
    })));
};

// Note: these set the hour on the passed date in place
const getRegionalWeatherByDate = (date: Date): ForecastDay['weather'] => {
    return [0, 4, 8, 12, 16, 20].map(hour => {
        const hourDate = new Date(date.setHours(hour, 0, 0, 0));
        const weather: WeatherType[] = [];
        for (let region = GameConstants.Region.kanto; region <= GameConstants.MAX_AVAILABLE_REGION; region++) {
            weather.push(Weather.getWeather(region, hourDate));
        }
        return { hour, weather };
    });
};

const getBoostedRoutesByDate = (date: Date): ForecastDay['boostedRoute'] => {
    return [0, 8, 16].map(hour => {
        const hourDate = new Date(date.setHours(hour, 0, 0, 0));
        RoamingPokemonList.generateIncreasedChanceRoutes(hourDate);
        const routes = RoamingPokemonList.roamerGroups
            .filter((_, i) => i <= GameConstants.MAX_AVAILABLE_REGION)
            .map((regionGroup, region) => regionGroup.map((_, i) => {
                const route = RoamingPokemonList.getIncreasedChanceRouteBySubRegionGroup(region, i)();
                return route.routeName.replace('Route ', '');
            }));
        return { hour, routes };
    });
};

const serializeDealCostOrProfit = (costOrProfit: DealCostOrProfit): SerializedDealCostOrProfit => {
    const { type, amount } = costOrProfit;
    switch (costOrProfit.type) {
        case DealCostOrProfitType.Gem:
            return { type, amount, name: PokemonType[costOrProfit.gemType] };
        case DealCostOrProfitType.Shard:
            return { type, amount, name: costOrProfit.shardItem.name };
        case DealCostOrProfitType.Berry:
            return { type, amount, name: BerryType[costOrProfit.berryType] };
        case DealCostOrProfitType.Item:
            return { type, amount, name: costOrProfit.item.name };
        case DealCostOrProfitType.Amount:
            return { type, amount: amount * costOrProfit.currency.amount, name: GameConstants.Currency[costOrProfit.currency.currency] };
        default:
            return { type, amount };
    }
};

const getPirateDealsByDate = (date: Date): ForecastGenericDeal[] => {
    SeededRand.seedWithDate(date);
    return GenericDeal.generatePirateDeals(date).map((deal) => ({
        costs: deal.costs.map(serializeDealCostOrProfit),
        profits: deal.profits.map(serializeDealCostOrProfit),
    }));
};

/** Drops generic deals that are the same every day, leaving only the rotating ones worth forecasting */
const removeStaticGenericDeals = (forecasts: ForecastData) => {
    const shopDayCounts: Record<string, number> = {};
    const dealDayCounts: Record<string, Record<string, number>> = {};
    Object.values(forecasts).forEach(forecast => {
        Object.entries(forecast.genericDeals).forEach(([shopId, deals]) => {
            shopDayCounts[shopId] = (shopDayCounts[shopId] || 0) + 1;
            dealDayCounts[shopId] = dealDayCounts[shopId] || {};
            new Set(deals.map(deal => JSON.stringify(deal))).forEach(deal => {
                dealDayCounts[shopId][deal] = (dealDayCounts[shopId][deal] || 0) + 1;
            });
        });
    });

    Object.values(forecasts).forEach(forecast => {
        Object.entries(forecast.genericDeals).forEach(([shopId, deals]) => {
            const rotating = deals.filter(deal => dealDayCounts[shopId][JSON.stringify(deal)] !== shopDayCounts[shopId]);
            if (rotating.length) {
                forecast.genericDeals[shopId] = rotating;
            } else {
                // Every deal in this shop is static, so it has nothing to forecast
                delete forecast.genericDeals[shopId];
            }
        });
    });
};

/** Daily forecasts from yesterday until January 1st three years from now */
export const generateForecastData = (): ForecastData => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    startDate.setDate(startDate.getDate() - 1);
    const endDate = new Date(now.getFullYear() + 3, 0, 1);

    const currentDate = new Date(startDate);
    const forecasts: ForecastData = {};

    while (currentDate <= endDate) {
        // The order matters: some of these change the time of currentDate
        forecasts[formatDate(currentDate)] = {
            unown: getUnownByDate(currentDate),
            berryDeal: getBerryDealsByDate(currentDate),
            weather: getRegionalWeatherByDate(currentDate),
            boostedRoute: getBoostedRoutesByDate(currentDate),
            genericDeals: {
                'PirateFence': getPirateDealsByDate(currentDate),
            },
            trophyGarden: getTrophyGardenByDate(currentDate),
        };
        currentDate.setDate(currentDate.getDate() + 1);
    }

    removeStaticGenericDeals(forecasts);

    return forecasts;
};
