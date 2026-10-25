/**
 * Data files precomputed from the game by tools/updateData.ts, served from assets/data/v<version>/.
 * They hold everything that is too slow to compute in the browser.
 */

import type { VitaminCounts } from '../shared/breeding';

/* optimalVitamins.json: pokémon id => best vitamins for each region (indexed by region) */

export interface RegionVitamins {
    bestVitamins: VitaminCounts;
    breedingEfficiency: number;
    vitaminEggSteps: number;
    attackBonus: number;
}

export type OptimalVitaminsData = Record<number, RegionVitamins[]>;

/* forecastData.json: YYYY-MM-DD => that day's forecast */

export interface BerryCost {
    berryType: BerryType;
    amount: number;
}

export interface ForecastBerryDeal {
    berries: BerryCost[];
    item: { amount: number; itemName: string };
}

export interface SerializedDealCostOrProfit {
    type: DealCostOrProfitType;
    amount: number;
    name?: string;
}

export interface ForecastGenericDeal {
    costs: SerializedDealCostOrProfit[];
    profits: SerializedDealCostOrProfit[];
}

export interface ForecastDay {
    /** Daily unown for each of the unown dungeons */
    unown: string[][];
    /** Deals indexed by BerryTraderLocations */
    berryDeal: ForecastBerryDeal[][];
    /** Weather by region, for each weather period of the day */
    weather: { hour: number; weather: WeatherType[] }[];
    /** Boosted route names by region and sub-region group, for each roamer period of the day */
    boostedRoute: { hour: number; routes: string[][] }[];
    /** Rotating deals by generic shop. Shops whose deals never change are omitted. */
    genericDeals: Record<string, ForecastGenericDeal[]>;
    trophyGarden: PokemonNameType[];
}

export type ForecastData = Record<string, ForecastDay>;
