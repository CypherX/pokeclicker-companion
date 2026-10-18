import { obtainablePokemonList, type CompanionPokemon } from './data';
import { partyList } from './party';
import * as SaveData from './save';
import { calcEggSteps, getBreedingAttackBonus, type VitaminCounts } from './shared/breeding';
import type { OptimalVitaminsData, RegionVitamins } from './types/dataFiles';
import { bindSortableTable, compareBy, exportToCsv, getStoredFlag, persistFlag } from './util';
import { dataUrl } from './version';

interface VitaminPokemon extends CompanionPokemon {
    baseAttackBonus: number;
    baseEggSteps: number;
    regionVitamins: RegionVitamins[];

    // Values for the currently selected region
    bestVitamins: VitaminCounts;
    breedingEfficiency: number;
    vitaminEggSteps: number;
    attackBonus: number;
    vitaminText: (number | string)[];
}

const { VitaminType } = GameConstants;

export const loadVitaminTrackerTable = ko.observable(false);
export const highestRegion = ko.observable<GameConstants.Region>(GameConstants.Region.kanto);
export const searchValue = ko.observable('');
export const hidePokemonOptimalVitamins = ko.observable(false);
export const hideUncaughtPokemon = ko.observable(false);
export const hideShinyPokemon = ko.observable(false);

persistFlag(hidePokemonOptimalVitamins, 'hidePokemonOptimalVitamins');
persistFlag(hideUncaughtPokemon, 'hideUncaughtPokemon');
persistFlag(hideShinyPokemon, 'hideShinyPokemon');

const tableSort = ko.observable('id');
const tableSortDescending = ko.observable(false);

let pokemonVitaminList: VitaminPokemon[] = [];

const getFilteredVitaminList = (): VitaminPokemon[] => {
    const region = highestRegion();
    const searchVal = searchValue()?.toLowerCase();

    return pokemonVitaminList.filter((pokemon) => {
        if (pokemon.obtainRegion > region) {
            return false;
        }

        if (searchVal) {
            if (!pokemon.id.toString().includes(searchVal)
                && !pokemon.name.toLowerCase().includes(searchVal)) {
                return false;
            }
        }

        const partyPokemon = partyList()[pokemon.id];
        if (SaveData.isLoaded() && hideUncaughtPokemon() && !partyPokemon) {
            return false;
        }

        if (partyPokemon?.shiny && hideShinyPokemon()) {
            return false;
        }

        if (hidePokemonOptimalVitamins()) {
            const bestVitamins = pokemon.regionVitamins[region].bestVitamins;
            if (partyPokemon && GameHelper.enumNumbers(VitaminType).every((v) => bestVitamins[v] == partyPokemon.vitaminsUsed[v as GameConstants.VitaminType]())) {
                return false;
            }
        }

        return true;
    });
};

const getVitaminPokemonList = ko.pureComputed((): VitaminPokemon[] => {
    if (!loadVitaminTrackerTable()) { // wait until the optimal vitamin data has loaded
        return [];
    }

    const region = highestRegion();
    const saveLoaded = SaveData.isLoaded();
    const pokemon = getFilteredVitaminList();
    pokemon.forEach((p) => {
        const regionVitamins = p.regionVitamins[region];
        p.bestVitamins = regionVitamins.bestVitamins;
        p.breedingEfficiency = regionVitamins.breedingEfficiency;
        p.vitaminEggSteps = regionVitamins.vitaminEggSteps;
        p.attackBonus = regionVitamins.attackBonus;
        p.vitaminText = p.bestVitamins.map((v, i) => {
            if (!saveLoaded) {
                return v;
            }

            const current = partyList()[p.id]?.vitaminsUsed[i as GameConstants.VitaminType]() ?? 0;
            return current === v ? v : `${current} <span class="text-warning">(${v})</span>`;
        });
    });

    return pokemon;
});

const getSortValue = (sortOption: string) => (pokemon: VitaminPokemon): number | string => {
    switch (sortOption) {
        case 'name':
            return pokemon.name;
        case 'base-attack':
            return pokemon.attack;
        case 'base-bonus':
            return pokemon.baseAttackBonus;
        case 'base-steps':
            return pokemon.baseEggSteps;
        case 'vitamin-bonus':
            return pokemon.attackBonus;
        case 'vitamin-steps':
            return pokemon.vitaminEggSteps;
        case 'breeding-efficiency':
            return pokemon.breedingEfficiency;
        case 'id':
        default:
            return pokemon.id;
    }
};

export const getSortedVitaminList = ko.pureComputed(() => {
    return [...getVitaminPokemonList()].sort(compareBy(getSortValue(tableSort()), tableSortDescending()));
});

export const getTotalVitaminsNeeded = ko.pureComputed(() => {
    if (!loadVitaminTrackerTable()) {
        return { vitaminCount: [0, 0, 0], totalCost: 0 };
    }

    const region = highestRegion();
    const amountNeeded = pokemonVitaminList.reduce((sum, p) => {
        if (p.obtainRegion <= region) {
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

    const data = getSortedVitaminList().map((p) => {
        const types = pokemonMap[p.id].type;
        const partyPokemon = partyList()[p.id];
        const row: unknown[] = [p.id, `"${p.name}"`, PokemonType[types[0]], PokemonType[types[1] ?? -1]];

        if (isSaveLoaded) {
            row.push(partyPokemon ? 1 : 0, partyPokemon?.shiny ? 1 : 0);
        }

        row.push(
            GameConstants.camelCaseToString(GameConstants.Region[p.nativeRegion]),
            p.attack,
            p.baseAttackBonus,
            p.baseEggSteps,
        );

        p.bestVitamins.forEach((v, i) => {
            if (isSaveLoaded) {
                row.push(partyPokemon?.vitaminsUsed[i as GameConstants.VitaminType]() ?? 0);
            }
            row.push(v);
        });

        row.push(p.attackBonus, p.vitaminEggSteps, p.breedingEfficiency);
        return row;
    });

    exportToCsv(headers, data, `VitaminTracker-${Date.now()}.csv`);
};

const buildPokemonVitaminList = (optimalVitamins: OptimalVitaminsData) => {
    const noVitamins: VitaminCounts = [0, 0, 0];

    // Augments the shared pokemon data objects in place
    pokemonVitaminList = obtainablePokemonList.map((p) => {
        const pokemon = p as VitaminPokemon;
        pokemon.baseAttackBonus = getBreedingAttackBonus(noVitamins, p.attack);
        pokemon.baseEggSteps = calcEggSteps(noVitamins, p.eggCycles);
        pokemon.regionVitamins = optimalVitamins[p.id];
        return pokemon;
    });
};

export const initialize = (): void => {
    if (getStoredFlag('hidePokemonOptimalVitamins')) {
        hidePokemonOptimalVitamins(true);
    }

    if (getStoredFlag('hideUncaughtPokemon')) {
        hideUncaughtPokemon(true);
    }

    if (getStoredFlag('hideShinyPokemon')) {
        hideShinyPokemon(true);
    }

    bindSortableTable('#vitaminTrackerTable', tableSort, tableSortDescending);

    fetch(dataUrl('optimalVitamins.json'))
        .then(resp => resp.json())
        .then((json: OptimalVitaminsData) => {
            buildPokemonVitaminList(json);
            loadVitaminTrackerTable(true);
        });
};
