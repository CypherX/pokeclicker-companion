import { obtainablePokemonList, type CompanionPokemon } from './data';
import { partyList, type CompanionPartyPokemon } from './party';
import * as SaveData from './save';
import * as Settings from './settings';
import { calcEggSteps, getBreedingAttackBonus, type VitaminCounts } from './shared/breeding';
import type { OptimalVitaminsData, RegionVitamins } from './types/dataFiles';
import { bindSortableTable, compareBy, exportToCsv, loadDataFile } from './util';

/** A pokémon's vitamin data that's the same in every region */
interface VitaminPokemon {
    pokemon: CompanionPokemon;
    baseAttackBonus: number;
    baseEggSteps: number;
    /** Optimal vitamins, indexed by region */
    regionVitamins: RegionVitamins[];
}

/** A row of the table: a pokémon with its optimal vitamins for the selected region */
interface VitaminRow extends RegionVitamins, Omit<VitaminPokemon, 'regionVitamins'> {
    /** The pokémon's id, which sorting breaks ties with */
    id: number;
    partyPokemon?: CompanionPartyPokemon;
    /** The vitamins the pokémon currently has, when a save is loaded */
    currentVitamins?: VitaminCounts;
    hasOptimalVitamins: boolean;
    vitaminText: (number | string)[];
}

const { VitaminType } = GameConstants;

export const loadVitaminTrackerTable = ko.observable(false);
export const highestRegion = ko.observable<GameConstants.Region>(GameConstants.Region.kanto);
export const searchValue = ko.observable('');
export const { hidePokemonOptimalVitamins, hideUncaughtPokemon, hideShinyPokemon } = Settings.vitaminTracker;

const tableSort = ko.observable('id');
const tableSortDescending = ko.observable(false);

let pokemonVitaminList: VitaminPokemon[] = [];

/**
 * The rows for the selected region, which only change with the region or the save. Searching, filtering, and
 * sorting select from these same rows, so the table only adds, removes, and moves rows for them.
 */
const regionRows = ko.pureComputed((): VitaminRow[] => {
    if (!loadVitaminTrackerTable()) { // wait until the optimal vitamin data has loaded
        return [];
    }

    const region = highestRegion();
    const saveLoaded = SaveData.isLoaded();
    const party = partyList();

    return pokemonVitaminList.filter(p => p.pokemon.obtainRegion <= region).map(({ pokemon, baseAttackBonus, baseEggSteps, regionVitamins }): VitaminRow => {
        const vitamins = regionVitamins[region];
        const partyPokemon = party[pokemon.id];
        const currentVitamins = saveLoaded
            ? vitamins.bestVitamins.map((_, i) => partyPokemon?.vitaminsUsed[i as GameConstants.VitaminType].peek() ?? 0) as VitaminCounts
            : undefined;

        return {
            ...vitamins,
            id: pokemon.id,
            pokemon,
            baseAttackBonus,
            baseEggSteps,
            partyPokemon,
            currentVitamins,
            hasOptimalVitamins: !!partyPokemon && vitamins.bestVitamins.every((v, i) => v === currentVitamins![i]),
            vitaminText: vitamins.bestVitamins.map((v, i) => {
                const current = currentVitamins?.[i] ?? v;
                return current === v ? v : `${current} <span class="text-warning">(${v})</span>`;
            }),
        };
    });
});

const getSortValue = (sortOption: string) => (row: VitaminRow): number | string => {
    switch (sortOption) {
        case 'name':
            return row.pokemon.name;
        case 'base-attack':
            return row.pokemon.attack;
        case 'base-bonus':
            return row.baseAttackBonus;
        case 'base-steps':
            return row.baseEggSteps;
        case 'vitamin-bonus':
            return row.attackBonus;
        case 'vitamin-steps':
            return row.vitaminEggSteps;
        case 'breeding-efficiency':
            return row.breedingEfficiency;
        case 'id':
        default:
            return row.pokemon.id;
    }
};

export const getSortedVitaminList = ko.pureComputed((): VitaminRow[] => {
    const searchVal = searchValue()?.toLowerCase();
    const hideUncaught = SaveData.isLoaded() && hideUncaughtPokemon();
    const hideShiny = hideShinyPokemon();
    const hideOptimal = hidePokemonOptimalVitamins();

    return regionRows().filter((row) => {
        if (searchVal && !row.pokemon.id.toString().includes(searchVal) && !row.pokemon.name.toLowerCase().includes(searchVal)) {
            return false;
        }
        if (hideUncaught && !row.partyPokemon) {
            return false;
        }
        if (hideShiny && row.partyPokemon?.shiny) {
            return false;
        }
        if (hideOptimal && row.hasOptimalVitamins) {
            return false;
        }
        return true;
    }).sort(compareBy(getSortValue(tableSort()), tableSortDescending()));
});

export const getTotalVitaminsNeeded = ko.pureComputed(() => {
    if (!loadVitaminTrackerTable()) {
        return { vitaminCount: [0, 0, 0], totalCost: 0 };
    }

    const region = highestRegion();
    const amountNeeded = pokemonVitaminList.reduce((sum, p) => {
        if (p.pokemon.obtainRegion <= region) {
            p.regionVitamins[region].bestVitamins.forEach((count, i) => sum[i] += count);
        }
        return sum;
    }, [0, 0, 0]);

    const amountOwned = [0, 0, 0];

    if (SaveData.isLoaded()) {
        const saveFile = SaveData.current();
        GameHelper.enumStrings(VitaminType).forEach((v, i) => {
            amountOwned[i] += saveFile.player._itemList[v] ?? 0;
        });

        saveFile.save.party.caughtPokemon.forEach((pokemon) => {
            const vitaminsUsed: Record<number, number> = pokemon[PartyPokemonSaveKeys.vitaminsUsed];
            Object.values(vitaminsUsed).forEach((n, i) => amountOwned[i] += n);
        });
    }

    const totalPrice = (counts: number[]) => counts.reduce((sum, count, i) => sum + ItemList[VitaminType[i]].totalPrice(count), 0);
    const totalPriceAll = totalPrice(amountNeeded);
    const totalPriceOwned = totalPrice(amountOwned);

    return {
        vitaminCount: amountNeeded.map((v, i) => Math.max(0, v - amountOwned[i])),
        totalCost: Math.max(0, totalPriceAll - totalPriceOwned),
    };
});

export const exportData = (): void => {
    const isSaveLoaded = SaveData.isLoaded();
    const vitaminNames = GameHelper.enumStrings(VitaminType);

    const headers = ['#', 'Pokemon', 'Type 1', 'Type 2'];
    if (isSaveLoaded) {
        headers.push('Caught', 'Shiny');
    }
    headers.push('Native Region', 'Base Attack', 'Base Attack Bonus', 'Base Egg Steps');
    vitaminNames.forEach((v) => {
        if (isSaveLoaded) {
            headers.push(`Current ${v}`);
        }
        headers.push(`Optimal ${v}`);
    });
    headers.push('Vitamin Attack Bonus', 'Vitamin Egg Steps', 'Breeding Efficiency');

    const data = getSortedVitaminList().map(({ pokemon, baseAttackBonus, baseEggSteps, partyPokemon, currentVitamins, ...vitamins }) => {
        const types = pokemonMap[pokemon.id].type;
        const row: unknown[] = [pokemon.id, pokemon.name, PokemonType[types[0]], PokemonType[types[1] ?? -1]];

        if (isSaveLoaded) {
            row.push(partyPokemon ? 1 : 0, partyPokemon?.shiny ? 1 : 0);
        }

        row.push(
            GameConstants.camelCaseToString(GameConstants.Region[pokemon.nativeRegion]),
            pokemon.attack,
            baseAttackBonus,
            baseEggSteps,
        );

        vitamins.bestVitamins.forEach((v, i) => {
            if (currentVitamins) {
                row.push(currentVitamins[i]);
            }
            row.push(v);
        });

        row.push(vitamins.attackBonus, vitamins.vitaminEggSteps, vitamins.breedingEfficiency);
        return row;
    });

    exportToCsv(headers, data, `VitaminTracker-${Date.now()}.csv`);
};

const buildPokemonVitaminList = (optimalVitamins: OptimalVitaminsData) => {
    const noVitamins: VitaminCounts = [0, 0, 0];

    pokemonVitaminList = obtainablePokemonList.map((pokemon) => ({
        pokemon,
        baseAttackBonus: getBreedingAttackBonus(noVitamins, pokemon.attack),
        baseEggSteps: calcEggSteps(noVitamins, pokemon.eggCycles),
        regionVitamins: optimalVitamins[pokemon.id],
    }));
};

export const initialize = (): void => {
    bindSortableTable('#vitaminTrackerTable', tableSort, tableSortDescending);

    loadDataFile<OptimalVitaminsData>('optimalVitamins.json', (data) => {
        buildPokemonVitaminList(data);
        loadVitaminTrackerTable(true);
    });
};
