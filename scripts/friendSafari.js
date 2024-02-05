const allSafariPokemon = ko.pureComputed(() => {
    // List isn't needed until a save is loaded
    if (!SaveData.isLoaded()) {
        return [];
    }

    return pokemonList
        .filter((p) => PokemonHelper.isObtainableAndNotEvable(p.name)
            && PokemonHelper.calcNativeRegion(p.name) <= GameConstants.MAX_AVAILABLE_REGION)
        .map((p) => p.name);
});

const getRotation = ko.pureComputed(() => {
    if (!SaveData.isLoaded()) {
        return [];
    }

    const rotationSize = GameConstants.FRIEND_SAFARI_POKEMON;
    const trainerId = SaveData.file().player.trainerId || '000000';
    SeededRand.seed(+trainerId);
    const shuffledPokemon = new Array(rotationSize).fill(SeededRand.shuffleArray(allSafariPokemon())).flat();

    const batchCount = Math.ceil(shuffledPokemon.length / rotationSize);
    const date = new Date();
    let startIndex = (Math.floor((date.getTime() - date.getTimezoneOffset() * 60 * 1000) / (24 * 60 * 60 * 1000)) % batchCount) * rotationSize;

    const data = [];
    for (let i = 0; i < Math.ceil(allSafariPokemon().length / rotationSize); i++) {
        data.push({
            date: new Date(date),
            pokemon: shuffledPokemon.slice(startIndex, startIndex + rotationSize)
        });
        startIndex += rotationSize;
        if (startIndex >= shuffledPokemon.length) {
            startIndex = 0;
        }
        date.setDate(date.getDate() + 1);
    }

    return data;
});

const isInRotation = (pokemonName) => {
    return allSafariPokemon().includes(pokemonName);
};

const pokemonCount = () => allSafariPokemon().length;

module.exports = {
    getRotation,
    isInRotation,
    pokemonCount,
};