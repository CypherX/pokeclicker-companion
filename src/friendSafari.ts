import * as SaveData from './save';

const allSafariPokemon = ko.pureComputed((): PokemonNameType[] => {
    // List isn't needed until a save is loaded
    if (!SaveData.isLoaded()) {
        return [];
    }

    return pokemonList
        .filter((p) => PokemonLocations.isObtainableAndNotEvable(p.name)
            && PokemonHelper.calcNativeRegion(p.name) <= GameConstants.MAX_AVAILABLE_REGION)
        .map((p) => p.name);
});

interface SafariDay {
    date: Date;
    pokemon: PokemonNameType[];
}

/** Mirrors the game's Friend Safari rotation, which is seeded by the player's trainer id */
export const getRotation = ko.pureComputed((): SafariDay[] => {
    if (!SaveData.isLoaded()) {
        return [];
    }

    const rotationSize = GameConstants.FRIEND_SAFARI_POKEMON;
    const trainerId = SaveData.current().player.trainerId || '000000';
    SeededRand.seed(+trainerId);
    const shuffledPokemon = new Array(rotationSize).fill(SeededRand.shuffleArray(allSafariPokemon())).flat();

    const batchCount = Math.ceil(shuffledPokemon.length / rotationSize);
    const date = new Date();
    const dayNumber = Math.floor((date.getTime() - date.getTimezoneOffset() * 60 * 1000) / (24 * 60 * 60 * 1000));
    let startIndex = (dayNumber % batchCount) * rotationSize;

    const data: SafariDay[] = [];
    for (let i = 0; i < Math.ceil(allSafariPokemon().length / rotationSize); i++) {
        data.push({
            date: new Date(date),
            pokemon: shuffledPokemon.slice(startIndex, startIndex + rotationSize),
        });
        startIndex += rotationSize;
        if (startIndex >= shuffledPokemon.length) {
            startIndex = 0;
        }
        date.setDate(date.getDate() + 1);
    }

    return data;
});

export const isInRotation = (pokemonName: PokemonNameType): boolean => allSafariPokemon().includes(pokemonName);

export const pokemonCount = (): number => allSafariPokemon().length;
