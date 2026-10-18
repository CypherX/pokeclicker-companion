import { EventDiscordClientPokemon, obtainablePokemonList, obtainablePokemonMap, shadowPokemon, type CompanionPokemon } from './data';
import * as FriendSafari from './friendSafari';
import * as SaveData from './save';
import * as Settings from './settings';
import { bindSortableTable, compareBy, exportToCsv } from './util';

const { Pokerus, ShadowStatus } = GameConstants;

export interface CompanionPartyPokemon extends PartyPokemon {
    totalAttack: number;
    baseBreedingEff: number;
    breedingEff: number;
    statistics: {
        totalObtained: number;
        totalHatched: number;
        totalShinyObtained: number;
        totalShinyHatched: number;
        totalDefeated: number;
    };
}

/** The player's caught pokémon by id, as game PartyPokemon instances built from the save */
export const partyList = ko.pureComputed((): Record<number, CompanionPartyPokemon> => {
    const saveData = SaveData.file();
    const party = saveData?.save.party.caughtPokemon ?? [];
    const statistics = saveData?.save.statistics;

    const map: Record<number, CompanionPartyPokemon> = {};
    for (const p of party) {
        if (!obtainablePokemonMap[p.id]) {
            continue;
        }

        const partyPokemon = PokemonFactory.generatePartyPokemon(p.id) as CompanionPartyPokemon;
        partyPokemon.fromJSON(p);

        partyPokemon.totalAttack = partyPokemon.calculateAttack(true);
        partyPokemon.baseBreedingEff = (partyPokemon.getBreedingAttackBonus() / partyPokemon.getEggSteps()) * GameConstants.EGG_CYCLE_MULTIPLIER;

        const heldItem = partyPokemon.heldItem?.();
        const heldItemBonus = heldItem instanceof AttackBonusHeldItem ? heldItem.attackBonus : 1;
        const shadowBonus = partyPokemon.shadow == ShadowStatus.Shadow ? 0.8 : (partyPokemon.shadow == ShadowStatus.Purified ? 1.2 : 1);
        const attackBonus = partyPokemon.getBreedingAttackBonus() * partyPokemon.calculateEVAttackBonus() * heldItemBonus * shadowBonus;
        partyPokemon.breedingEff = (attackBonus / partyPokemon.getEggSteps()) * GameConstants.EGG_CYCLE_MULTIPLIER;

        partyPokemon.statistics = {
            totalObtained: statistics!.pokemonCaptured[p.id] || 0,
            totalHatched: statistics!.pokemonHatched[p.id] || 0,
            totalShinyObtained: statistics!.shinyPokemonCaptured[p.id] || 0,
            totalShinyHatched: statistics!.shinyPokemonHatched[p.id] || 0,
            totalDefeated: statistics!.pokemonDefeated[p.id] || 0,
        };

        map[p.id] = partyPokemon;
    }
    return map;
});

const getPartyPokemonByName = (pokemonName: PokemonNameType): CompanionPartyPokemon | undefined =>
    partyList()[PokemonHelper.getPokemonByName(pokemonName).id];

/* ------------------------------------------------------------------ */
/* Party stats table                                                  */
/* ------------------------------------------------------------------ */

export const pokemonStatTableSearch = ko.observable('');
export const pokemonStatTableFilter = ko.observable('none');
const pokemonStatTableSort = ko.observable('id');
const pokemonStatTableSortDescending = ko.observable(false);
bindSortableTable('#partyPokemonTable', pokemonStatTableSort, pokemonStatTableSortDescending);

const getSortValue = (sortOption: string) => (partyPokemon: CompanionPartyPokemon): number | string => {
    switch (sortOption) {
        case 'name':
            return partyPokemon.name;
        case 'attack':
            return partyPokemon.totalAttack;
        case 'base-breeding-eff':
            return partyPokemon.baseBreedingEff;
        case 'breeding-eff':
            return partyPokemon.breedingEff;
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
};

export const getSortedPartyList = ko.pureComputed(() => {
    const comparator = compareBy(getSortValue(pokemonStatTableSort()), pokemonStatTableSortDescending());
    return Object.values(partyList()).sort(comparator);
}).extend({ rateLimit: 100 });

const isPokemonHiddenStatsTable = (partyPokemon: CompanionPartyPokemon, searchVal: string, filterVal: string): boolean => {
    if (searchVal) {
        if (!partyPokemon.id.toString().includes(searchVal)
            && !partyPokemon.name.toLowerCase().includes(searchVal.toLowerCase())) {
            return true;
        }
    }

    if (filterVal) {
        const isResistant = partyPokemon.pokerus === Pokerus.Resistant;
        const isFriendSafari = FriendSafari.isInRotation(partyPokemon.name);
        const isShadowObtainable = shadowPokemon.has(partyPokemon.name);

        switch (filterVal) {
            case 'not-shiny': return partyPokemon.shiny;
            case 'not-resistant': return isResistant;
            case 'not-resistant-not-friend-safari': return isResistant || isFriendSafari;
            case 'not-resistant-friend-safari': return isResistant || !isFriendSafari;
            case 'resistant': return !isResistant;
            case 'infected': return partyPokemon.pokerus != Pokerus.Infected;
            case 'missing-shadow': return !!partyPokemon.shadow || !isShadowObtainable;
            case 'missing-purified': return partyPokemon.shadow == ShadowStatus.Purified || !isShadowObtainable;
            case 'shadow': return partyPokemon.shadow != ShadowStatus.Shadow;
            case 'purified': return partyPokemon.shadow != ShadowStatus.Purified;
        }
    }
    return false;
};

export const hideFromPokemonStatsTable = (partyPokemon: CompanionPartyPokemon) => {
    return ko.pureComputed(() => isPokemonHiddenStatsTable(partyPokemon, pokemonStatTableSearch(), pokemonStatTableFilter()));
};

export const getPokemonStatsTableCount = ko.pureComputed(() => {
    const searchVal = pokemonStatTableSearch();
    const filterVal = pokemonStatTableFilter();

    return Object.values(partyList()).filter(p => !isPokemonHiddenStatsTable(p, searchVal, filterVal)).length;
});

export const exportPartyPokemon = (): void => {
    const headers = [
        '#', 'Pokemon', 'Type 1', 'Type 2', 'Shiny', 'Pokerus', 'Shadow Status', 'Native Region',
        'Attack', 'Base Breeding Eff', 'Breeding Eff', 'Obtained', 'Hatched',
        'Shiny Obtained', 'Shiny Hatched', 'Defeated', 'Effort Points',
        'EVs', 'EV Bonus',
    ];

    const data = getSortedPartyList().map((p) => [
        p.id,
        `"${p.name}"`,
        PokemonType[pokemonMap[p.id].type[0]],
        PokemonType[pokemonMap[p.id].type[1] ?? -1],
        p.shiny ? 1 : 0,
        p.pokerus,
        shadowPokemon.has(p.name) ? p.shadow : -1,
        GameConstants.camelCaseToString(GameConstants.Region[PokemonHelper.calcNativeRegion(p.name)]),
        p.totalAttack,
        p.baseBreedingEff,
        p.breedingEff,
        p.statistics.totalObtained,
        p.statistics.totalHatched,
        p.statistics.totalShinyObtained,
        p.statistics.totalShinyHatched,
        p.statistics.totalDefeated,
        p.effortPoints,
        p.evs(),
        p.calculateEVAttackBonus(),
    ]);

    exportToCsv(headers, data, `PartyPokemon-${Date.now()}.csv`);
};

/* ------------------------------------------------------------------ */
/* Counts                                                             */
/* ------------------------------------------------------------------ */

export const caughtPokemonCount = ko.pureComputed(() => {
    if (!SaveData.isLoaded()) return 0;
    return Object.keys(partyList()).length;
});

export const caughtShinyCount = ko.pureComputed(() => {
    if (!SaveData.isLoaded()) return 0;
    return Object.values(partyList()).filter(p => p.shiny).length;
});

export const caughtResistantCount = ko.pureComputed(() => {
    if (!SaveData.isLoaded()) return 0;
    return Object.values(partyList()).filter(p => p.pokerus === Pokerus.Resistant).length;
});

/* ------------------------------------------------------------------ */
/* Missing pokémon                                                    */
/* ------------------------------------------------------------------ */

interface MissingRegion {
    region: GameConstants.Region;
    regionName: string;
    pokemon: CompanionPokemon[];
}

export const getMissingPokemon = ko.pureComputed((): MissingRegion[] => {
    if (!SaveData.isLoaded()) {
        return [];
    }

    const caughtPokemon = partyList();
    const missingPokemon: Record<number, MissingRegion> = {};
    GameHelper.enumNumbers(GameConstants.Region)
        .filter(r => r !== GameConstants.Region.none && r <= GameConstants.MAX_AVAILABLE_REGION)
        .forEach((r) => {
            missingPokemon[r] = {
                region: r,
                regionName: GameConstants.camelCaseToString(GameConstants.Region[r]),
                pokemon: [],
            };
        });

    const showRequiredOnly = Settings.showRequiredOnly();
    const showAllRegions = Settings.showAllRegions();
    const caughtBaseIds = new Set(SaveData.current().save.party.caughtPokemon?.map(c => Math.floor(c.id)) ?? []);

    obtainablePokemonList.forEach(p => {
        if (caughtPokemon[p.id]) {
            return;
        }

        const obtainRegion = p.obtainRegion;
        if (!showAllRegions && obtainRegion > player.highestRegion()) {
            return;
        }

        if (showRequiredOnly && caughtBaseIds.has(Math.floor(p.id))) {
            return;
        }

        missingPokemon[obtainRegion].pokemon.push(p);
    });

    return Object.values(missingPokemon).filter(r => r.pokemon.length);
});

export const getMissingRegionPokemonCount = (region: GameConstants.Region) => {
    return ko.pureComputed(() => {
        const data = getMissingPokemon().find(r => r.region == region);
        if (!data) {
            return 0;
        }

        return Settings.showRequiredOnly() ? new Set(data.pokemon.map(p => Math.floor(p.id))).size : data.pokemon.length;
    });
};

export const getTotalMissingPokemonCount = ko.pureComputed(() => {
    return getMissingPokemon().reduce((count, r) => count + getMissingRegionPokemonCount(r.region)(), 0);
});

/* ------------------------------------------------------------------ */
/* Per-pokémon display helpers                                        */
/* ------------------------------------------------------------------ */

export const isEventDiscordClientPokemon = (pokemonName: PokemonNameType): boolean => {
    return EventDiscordClientPokemon.includes(pokemonName);
};

export const isPokemonCaught = (pokemonName: PokemonNameType): boolean => {
    return getPartyPokemonByName(pokemonName) != undefined;
};

export const getCaughtPokeballImage = (pokemonName: PokemonNameType): string => {
    const partyPokemon = getPartyPokemonByName(pokemonName);
    if (!partyPokemon) {
        return '';
    }
    return `assets/images/pokeball/Pokeball${partyPokemon.shiny ? '-shiny' : ''}.svg`;
};

export const hasPokerus = (pokemonName: PokemonNameType): boolean => {
    return (getPartyPokemonByName(pokemonName)?.pokerus ?? 0) > 0;
};

export const getPokerusImage = (pokemonName: PokemonNameType): string => {
    const partyPokemon = getPartyPokemonByName(pokemonName);
    if (!partyPokemon || partyPokemon.pokerus == Pokerus.Uninfected) {
        return '//:0';
    }

    return `assets/images/breeding/pokerus/${Pokerus[partyPokemon.pokerus]}.png`;
};

export const getShadowStatusImage = (shadowStatus: GameConstants.ShadowStatus): string => {
    if (shadowStatus == ShadowStatus.None) {
        return '//:0';
    }

    return `assets/images/status/${shadowStatus == ShadowStatus.Shadow ? 'shadow' : 'purified'}.svg`;
};

