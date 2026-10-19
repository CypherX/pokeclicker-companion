const { Region } = GameConstants;

/** Pokémon data from the game, augmented by the companion */
export interface CompanionPokemon extends PokemonListData {
    /** Region the pokémon is realistically obtainable in; used for "missing" lists */
    obtainRegion: GameConstants.Region;
}

export const UnobtainablePokemon: PokemonNameType[] = [
    'Mega Altaria',
    'Arceus (Fire)',
    'Arceus (Water)',
    'Arceus (Electric)',
    'Arceus (Grass)',
    'Arceus (Ice)',
    'Arceus (Fighting)',
    'Arceus (Poison)',
    'Arceus (Ground)',
    'Arceus (Flying)',
    'Arceus (Psychic)',
    'Arceus (Bug)',
    'Arceus (Rock)',
    'Arceus (Ghost)',
    'Arceus (Dragon)',
    'Arceus (Dark)',
    'Arceus (Steel)',
    'Arceus (Fairy)',
    'Dugtrio (Punk)',
    'Weepinbell (Fancy)',
    'Gengar (Punk)',
    'Onix (Rocker)',
    'Tangela (Pom-pom)',
    'Goldeen (Diva)',
    'Pikachu (Rock Star)',
    'Pikachu (Belle)',
    'Pikachu (Pop Star)',
    'Pikachu (Ph. D.)',
    'Pikachu (Libre)',
    'Furfrou (Heart)',
];

export const EventDiscordClientPokemon: PokemonNameType[] = [
    'Bulbasaur (Clone)',
    'Spooky Bulbasaur',
    'Bulbasaur (Rose)',
    'Ivysaur (Clone)',
    'Spooky Ivysaur',
    'Ivysaur (Rose)',
    'Venusaur (Clone)',
    'Spooky Venusaur',
    'Venusaur (Rose)',
    'Charmander (Clone)',
    'Charmeleon (Clone)',
    'Charizard (Clone)',
    'Squirtle (Clone)',
    'Wartortle (Clone)',
    'Blastoise (Clone)',
    'Pikachu (Clone)',
    'Pikachu (Easter)',
    'Red Spearow',
    'Flying Pikachu',
    'Surfing Pikachu',
    'Pikachu (Gengar)',
    'Let\'s Go Pikachu',
    'Charity Chansey',
    'Santa Jynx',
    'Let\'s Go Eevee',
    'Santa Snorlax',
    'Snorlax (Snowman)',
    'Armored Mewtwo',
    'Spooky Togepi',
    'Togepi (Flowering Crown)',
    'Spooky Togetic',
    'Reindeer Stantler',
    'Blessing Blissey',
    'Grinch Celebi',
    'Torchic (Egg)',
    'Handout Happiny',
    'Elf Munchlax',
    'Spooky Togekiss',
    'Rotom (Discord)',
    'Vivillon (Fancy)',
    'Captain Charizard',
    'Magikarp (Pirate)',
    'Gyarados (Captain)',
    'Captain Lucario',
    'Zorua (Pirate)',
    'Captain Hoopa',
    'Bounsweet (Pirate)',
    'Steenee (Pirate)',
    'Tsareena (Captain)',
    'Scorbunny (Pirate)',
    'Raboot (Pirate)',
    'Cinderace (Captain)',
    'Captain Zacian',
];

const regionFor = (filter: (p: PokemonListData) => boolean, region: GameConstants.Region) =>
    Object.fromEntries(pokemonList.filter(filter).map(p => [p.name, region]));

export const pokemonRegionOverride: Record<PokemonNameType, GameConstants.Region> = {
    // Magikarp
    ...regionFor(p => Math.floor(p.id) == 129 && p.id > 129, Region.alola),
    'Magikarp (Feebas)': Region.hoenn,
    'Magikarp (Pirate)': Region.kanto,

    // Pikachu
    ...regionFor(p => Math.floor(p.id) == 25 && p.id > 25, Region.alola),
    'Pikachu (Palaeontologist)': Region.kanto,
    'Detective Pikachu': Region.kanto,
    'Detective Raichu': Region.kalos,
    'Pikachu (World Cap)': Region.galar,

    // Valencian and Pinkan
    ...regionFor(p => p.name.startsWith('Pinkan ') || p.name.startsWith('Valencian '), Region.hoenn),
    'Pink Butterfree': Region.hoenn,
    "Ash's Butterfree": Region.hoenn,
    'Pinkan Pikachu': Region.hoenn,
    'Crystal Onix': Region.hoenn,
    'Crystal Steelix': Region.hoenn,

    // Mega and Primal
    ...regionFor(p => p.name.startsWith('Mega ') || p.name.startsWith('Primal '), Region.kalos),

    // Gigantamax
    ...regionFor(p => p.name.startsWith('Gigantamax ') || p.name.startsWith('Eternamax'), Region.galar),

    'Meowth (Phanpy)': Region.johto,
    'Unown (E)': Region.sinnoh,
    'Unown (!)': Region.hoenn,
    'Unown (?)': Region.hoenn,
    'XD001': Region.unova,
    'Hoppip (Chimecho)': Region.hoenn,
    'Meltan': Region.alola,
    'Melmetal': Region.alola,
    'Ditto (Magikarp)': Region.alola,
    'Flowering Celebi': Region.galar,
    'Magearna (Original Color)': Region.galar,
    'Squad Leader Squirtle': Region.johto,
    'Deoxys (Green Core)': Region.unova,
    'Deoxys (Clone)': Region.unova,

    // Event / Discord / Client
    'Bulbasaur (Rose)': Region.sinnoh,
    'Ivysaur (Rose)': Region.sinnoh,
    'Venusaur (Rose)': Region.sinnoh,
    'Pikachu (Gengar)': Region.hoenn,
    'Flying Pikachu': Region.kanto,
    'Surfing Pikachu': Region.kanto,
    'Let\'s Go Pikachu': Region.kanto,
    'Pikachu (Clone)': Region.kanto,
    'Pikachu (Easter)': Region.hoenn,
    'Togepi (Flowering Crown)': Region.hoenn,
};

const isDevelopmentOnly = (requirements: Requirement[]) =>
    requirements.some(req => req instanceof DevelopmentRequirement);

const subRegionDungeons = (region: GameConstants.Region, subRegion: number): string[] =>
    Object.values(TownList)
        .filter(t => t.region == region && t.subRegion == subRegion && t instanceof DungeonTown)
        .map(t => t.name);

const subRegionRoutes = (region: GameConstants.Region, subRegion: number): RegionRoute[] =>
    Routes.regionRoutes.filter(r => r.region == region && r.subRegion == subRegion);

/**
 * Sub-regions shown as their own sections in the statistics pages.
 * Fractional regions sort them between the main regions.
 */
export interface DungeonListOverrideEntry {
    region: number;
    name: string;
    dungeons: string[];
}

export const DungeonListOverride: DungeonListOverrideEntry[] = [
    {
        region: 0.1,
        name: 'Sevii Islands 123',
        dungeons: subRegionDungeons(Region.kanto, GameConstants.KantoSubRegions.Sevii123),
    },
    {
        region: 2.1,
        name: 'Sevii Islands 4567',
        dungeons: subRegionDungeons(Region.kanto, GameConstants.KantoSubRegions.Sevii4567),
    },
    {
        region: 2.2,
        name: 'Orre',
        dungeons: subRegionDungeons(Region.hoenn, GameConstants.HoennSubRegions.Orre),
    },
];

export interface GymListOverrideEntry {
    region: number;
    name: string;
    gyms: string[];
}

export const GymListOverride: GymListOverrideEntry[] = [
    {
        region: 2.1,
        name: 'Orange League',
        gyms: [...GameConstants.OrangeGyms],
    },
    {
        region: 2.2,
        name: 'Orre',
        gyms: GameConstants.OrreGyms.filter(gym => !isDevelopmentOnly(GymList[gym].requirements)),
    },
    {
        region: 6.1,
        name: 'Magikarp Jump',
        gyms: [...GameConstants.MagikarpJumpGyms],
    },
];

export interface RouteListOverrideEntry {
    region: GameConstants.Region;
    subRegion: number;
    displayRegion?: number;
    displaySubRegion?: number;
    name: string;
    routes: RegionRoute[];
}

export const RouteListOverride: RouteListOverrideEntry[] = [
    {
        region: Region.kanto,
        subRegion: GameConstants.KantoSubRegions.Sevii123,
        name: 'Sevii Islands 123',
        routes: subRegionRoutes(Region.kanto, GameConstants.KantoSubRegions.Sevii123),
    },
    {
        region: Region.kanto,
        displayRegion: Region.hoenn,
        subRegion: GameConstants.KantoSubRegions.Sevii4567,
        name: 'Sevii Islands 4567',
        routes: subRegionRoutes(Region.kanto, GameConstants.KantoSubRegions.Sevii4567),
    },
    {
        region: Region.hoenn,
        subRegion: GameConstants.HoennSubRegions.Orre,
        displaySubRegion: 2,
        name: 'Orre',
        routes: subRegionRoutes(Region.hoenn, GameConstants.HoennSubRegions.Orre),
    },
    {
        region: Region.alola,
        subRegion: GameConstants.AlolaSubRegions.MagikarpJump,
        name: 'Magikarp Jump',
        routes: subRegionRoutes(Region.alola, GameConstants.AlolaSubRegions.MagikarpJump),
    },
];

export const obtainablePokemonList: CompanionPokemon[] = (() => {
    const unobtainable = new Set(UnobtainablePokemon);

    return pokemonList
        .filter(p => p.id >= 1
            && p.nativeRegion <= GameConstants.MAX_AVAILABLE_REGION
            && !unobtainable.has(p.name))
        .map(p => {
            // The game's pokemon data objects are augmented in place
            const pokemon = p as CompanionPokemon;
            pokemon.obtainRegion = pokemonRegionOverride[p.name] || pokemon.nativeRegion;
            return pokemon;
        });
})();

export const obtainablePokemonMap: Record<number, CompanionPokemon> =
    Object.fromEntries(obtainablePokemonList.map(p => [p.id, p]));

/** Names of all shadow pokémon obtainable from Orre dungeon trainers */
export const shadowPokemon: Set<PokemonNameType> = (() => {
    const dungeons = Object.values(TownList)
        .filter(t => t.region == Region.hoenn
            && t.subRegion == GameConstants.HoennSubRegions.Orre
            && t instanceof DungeonTown
            && !isDevelopmentOnly(t.requirements))
        .map(t => t.dungeon!);

    const pokemon: PokemonNameType[] = [];
    const addShadowTeam = (enemy: DungeonEnemy | DungeonBoss) => {
        if (enemy instanceof DungeonTrainer) {
            pokemon.push(...enemy.getTeam().filter(p => p.shadow == GameConstants.ShadowStatus.Shadow).map(p => p.name));
        }
    };
    dungeons.forEach(d => {
        d.enemyList.forEach(addShadowTeam);
        d.bossList.forEach(addShadowTeam);
    });

    return new Set(pokemon);
})();

export const validRegions: GameConstants.Region[] = GameHelper.enumNumbers(Region)
    .filter(region => region > Region.none && region <= GameConstants.MAX_AVAILABLE_REGION);
export const validRegionNames: string[] = validRegions.map(region => GameConstants.camelCaseToString(Region[region]));

export interface RoamerGroup {
    name: string;
    region: GameConstants.Region;
    subRegionGroup: number;
}

export const roamerGroups: RoamerGroup[] = RoamingPokemonList.roamerGroups
    .map((rg, ri) => rg.map((sr, si) => ({ name: sr.name, region: ri, subRegionGroup: si })))
    .flat()
    .filter((rg) => rg.region <= GameConstants.MAX_AVAILABLE_REGION);

export const unownDungeonList = ['Ruins of Alph', 'Tanoby Ruins', 'Solaceon Ruins'];
export const unownList = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!?'.split('');

const { BerryTraderLocations } = GameConstants;

export const berryMasterPokemonLocations: GameConstants.BerryTraderLocations[] = [
    BerryTraderLocations['Pinkan Pokémon Reserve'],
    BerryTraderLocations['Secret Berry Shop'],
];

export interface BerryMasterPokemonCost {
    pokemon: PokemonNameType;
    minCost: number;
    maxCost: number;
}

export const berryMasterPokemonCosts: Partial<Record<GameConstants.BerryTraderLocations, BerryMasterPokemonCost[]>> = {
    [BerryTraderLocations['Pinkan Pokémon Reserve']]: [
        { pokemon: 'Pinkan Arbok', minCost: 40, maxCost: 60 },
        { pokemon: 'Pinkan Oddish', minCost: 20, maxCost: 40 },
        { pokemon: 'Pinkan Poliwhirl', minCost: 40, maxCost: 60 },
        { pokemon: 'Pinkan Geodude', minCost: 20, maxCost: 40 },
        { pokemon: 'Pinkan Weezing', minCost: 80, maxCost: 100 },
        { pokemon: 'Pinkan Scyther', minCost: 80, maxCost: 100 },
        { pokemon: 'Pinkan Electabuzz', minCost: 80, maxCost: 100 },
    ],
    [BerryTraderLocations['Secret Berry Shop']]: [
        { pokemon: 'Grotle (Acorn)', minCost: 80, maxCost: 100 },
    ],
};

export const genericDealLabels: Record<string, string> = {
    'PirateFence': 'Shady Fence (Pirate Event)',
};

export interface ChangeLogEntry {
    timestamp: number;
    dateLabel?: string;
    changes: string[];
}

export const changeLogData: ChangeLogEntry[] = [
    {
        timestamp: 1789784531216,
        changes: [
            'Battle Frontier Simulator - the Power Herb held item should now apply correctly during calculations.',
        ],
    },
    {
        timestamp: 1788538483660,
        changes: [
            'Forecasts for Trophy Garden and the Shady Fence (Pirate Event trader) are available at [Forecasts] → [Other]',
        ],
    },
    {
        timestamp: 1774917973018,
        changes: [
            'Battle Calculator - major performance improvements & optimizations',
        ],
    },
    {
        timestamp: 1774625069477,
        changes: [
            'Battle Calculator now has a "Current Regional" weather option. This will apply the current weather in each region to the battle calculations.',
            'Berry Master forecasts now show how many of each berry you own after loading a save file.',
        ],
    },
    {
        timestamp: 1774476425624,
        changes: [
            'Added a heatmap to the [My Save] → [Statistics & More] → [Type Damage] grid.',
            'Additional minor changes to the Battle Calculator.',
        ],
    },
    {
        timestamp: 1774399889214,
        changes: [
            'Visual & performance updates to the Battle Calculator. Should be a bit more useable on mobile now as well.',
        ],
    },
    {
        timestamp: 1772412579939,
        changes: [
            'Orre dungeons on the [My Save] → [Statistics & More] → [Dungeons] page now include Shadow status in the info & completion display.',
        ],
    },
    {
        timestamp: 1768449600000,
        changes: [
            'Battle Frontier Simulator - Optimized simulation speed (~4x faster) and greatly reduced memory usage.',
        ],
    },
    {
        timestamp: 1765814400000,
        changes: [
            'Battle Frontier Simulator - Fixed bug that caused the simulator to always include xAttack in calculations even when it was not toggled on.',
        ],
    },
    {
        timestamp: 1764081000000,
        changes: [
            'Battle Frontier Simulator - Various fixes and optimizations.',
        ],
    },
    {
        timestamp: 1763946000000,
        changes: [
            'Implemented Battle Frontier Simulator under the Tools tab.',
        ],
    },
    {
        timestamp: 0,
        dateLabel: 'Earlier',
        changes: [
            'Everything else!',
        ],
    },
];
