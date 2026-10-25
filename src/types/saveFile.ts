/**
 * Shape of a decoded PokéClicker save file, limited to the fields the companion reads.
 * Index signatures keep the rest of the data accessible, since whole sections are handed
 * back to the game's own fromJSON loaders.
 */

/** Serialised PartyPokemon: keyed by PartyPokemonSaveKeys, plus its id */
export interface SavedPartyPokemon {
    id: number;
    [key: number]: any;
}

export interface SavedStatistics {
    pokemonCaptured: Record<number, number>;
    pokemonHatched: Record<number, number>;
    pokemonDefeated: Record<number, number>;
    shinyPokemonCaptured: Record<number, number>;
    shinyPokemonHatched: Record<number, number>;
    dungeonsCleared: number[];
    gymsDefeated: number[];
    temporaryBattleDefeated: number[];
    routeKills: Record<string, Record<number, number>>;
    battleFrontierHighestStageCompleted?: number;
    [key: string]: any;
}

/** Enigma mutation hints were stored as a bare array in older saves */
export type SavedEnigmaMutation = boolean[] | { seen?: boolean[] } | undefined;

export interface SaveData {
    party: { caughtPokemon: SavedPartyPokemon[] };
    statistics: SavedStatistics;
    farming: {
        mutations: SavedEnigmaMutation[];
        berryInventory?: number[];
        /** Renamed to berryInventory in newer versions */
        berryList?: number[];
        [key: string]: any;
    };
    keyItems: Record<string, boolean>;
    challenges: { list: Record<string, boolean> };
    profile: { name: string; [key: string]: any };
    update: { version: string };
    quests: { questLines: { name: string; state: number }[]; [key: string]: any };
    achievements: string[];
    [key: string]: any;
}

export interface SavePlayer {
    trainerId?: string;
    highestRegion?: number;
    _itemList: Record<string, number>;
    [key: string]: any;
}

export interface SaveFile {
    player: SavePlayer;
    save: SaveData;
    settings: Record<string, any>;
}
