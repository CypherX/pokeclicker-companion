/**
 * Date-seeded daily occurrences, mirroring the game's own selection logic.
 * Shared by the live daily summary and the forecast data generator (tools/updateData.ts).
 */

const getDailyUnown = (date: Date, unownList: string[]): string[] => {
    SeededRand.seedWithDate(date);
    const shuffled = SeededRand.shuffleArray([...Array(unownList.length).keys()]);
    return shuffled.slice(0, 3).map(idx => unownList[idx]);
};

/** Daily unown for the Ruins of Alph, Tanoby Ruins and Solaceon Ruins */
export const getUnownByDate = (date: Date): string[][] => {
    SeededDateRand.seedWithDate(date);
    return [
        getDailyUnown(date, AlphUnownList),
        getDailyUnown(date, TanobyUnownList),
        getDailyUnown(date, SolaceonUnownList),
    ];
};

const findDateSelectRequirement = (requirement: Requirement | null | undefined): SeededDateSelectNRequirement | null => {
    if (!requirement) {
        return null;
    }

    if (requirement instanceof SeededDateSelectNRequirement) {
        return requirement;
    }

    for (const subRequirement of requirement.requirements ?? []) {
        const found = findDateSelectRequirement(subRequirement);
        if (found) {
            return found;
        }
    }

    return null;
};

interface TrophyGardenPool {
    total: number;
    select: number;
    /** Pokémon indexed by their SeededDateSelectNRequirement index */
    pokemon: PokemonNameType[];
}

let trophyGardenPool: TrophyGardenPool | undefined;
const getTrophyGardenPool = (): TrophyGardenPool => {
    if (!trophyGardenPool) {
        const route = Routes.regionRoutes.find(r => r.routeName === 'Trophy Garden')!;
        const specials = route.pokemon.special
            .map(special => ({ name: special.pokemon[0], requirement: findDateSelectRequirement(special.req) }))
            .filter((special): special is { name: PokemonNameType; requirement: SeededDateSelectNRequirement } => !!special.requirement);

        const pokemon: PokemonNameType[] = [];
        specials.forEach(special => {
            pokemon[special.requirement.index] = special.name;
        });

        const { total, select } = specials[0].requirement;
        trophyGardenPool = { total, select, pokemon };
    }
    return trophyGardenPool;
};

/** The Trophy Garden's daily rotating encounters */
export const getTrophyGardenByDate = (date: Date): PokemonNameType[] => {
    const { total, select, pokemon } = getTrophyGardenPool();

    SeededRand.seedWithDate(date);
    const shuffled = SeededRand.shuffleArray([...Array(total).keys()]);
    return shuffled.slice(0, select).map(index => pokemon[index]);
};
