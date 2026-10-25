import { DungeonListOverride, GymListOverride, RouteListOverride } from './data';
import { partyList, type CompanionPartyPokemon } from './party';
import * as SaveData from './save';
import * as Settings from './settings';

const { Region, ShadowStatus, Pokerus } = GameConstants;

type Party = Record<number, CompanionPartyPokemon>;

/** Number of clears needed for each dungeon achievement */
const DUNGEON_CLEAR_GOAL = 500;
/** Number of defeats needed for each route achievement */
const ROUTE_DEFEAT_GOAL = 10000;

export const isPokerusUnlocked = ko.pureComputed(() => {
    if (!SaveData.isLoaded()) {
        return false;
    }
    return SaveData.current().save.keyItems.Pokerus_virus === true;
});

const hasEventRequirement = (req: Requirement | null | undefined): boolean => {
    if (!req) {
        return false;
    }
    return req instanceof SpecialEventRequirement || !!req.requirements?.some(r => r instanceof SpecialEventRequirement);
};

const countParty = (pokemon: PokemonNameType[], party: Party, predicate: (p: CompanionPartyPokemon) => boolean): number => {
    return pokemon.reduce((total, name) => {
        const partyPokemon = party[pokemonMap[name].id];
        return partyPokemon && predicate(partyPokemon) ? total + 1 : total;
    }, 0);
};

const getShinyCount = (pokemon: PokemonNameType[], party: Party) => countParty(pokemon, party, p => p.shiny);
const getShadowCount = (pokemon: PokemonNameType[], party: Party) => countParty(pokemon, party, p => p.shadow >= ShadowStatus.Shadow);
const getResistCount = (pokemon: PokemonNameType[], party: Party) => countParty(pokemon, party, p => p.pokerus === Pokerus.Resistant);

/** Hides regions the player hasn't reached yet, unless all regions are shown */
export const hideOtherStatSection = (data: { hidden?: boolean; region: number; displayRegion?: number }): boolean => {
    if (data.hidden) {
        return true;
    }

    const region = data.displayRegion ?? data.region;
    if (region > GameConstants.MAX_AVAILABLE_REGION) {
        return true;
    }

    return !Settings.showAllRegions() && Math.floor(region) > player.highestRegion();
};

/* ------------------------------------------------------------------ */
/* Dungeons                                                           */
/* ------------------------------------------------------------------ */

interface DungeonPokemon {
    pokemon: PokemonNameType;
    boss?: boolean;
    shadow?: boolean;
}

interface DungeonData {
    name: string;
    clears: number;
    cost: number;
    cost500: number;
    remaining: number;
    hide: boolean;
    pokemonList: DungeonPokemon[];
    pokemonCount: number;
    shadowPokemonCount: number;
    shinyCount: number;
    shadowCount: number;
    resistCount: number;
    isComplete: boolean;
}

interface RegionDungeonData {
    region: number;
    name?: string;
    dungeons: DungeonData[];
}

const getDungeonClearCount = (dungeon: string): number => {
    if (!SaveData.isLoaded()) {
        return 0;
    }

    const dungeonIndex = GameConstants.getDungeonIndex(dungeon);
    return SaveData.current().save.statistics.dungeonsCleared[dungeonIndex] || 0;
};

// Mirrors Dungeon.tokenCost, but using the clear count from the save data.
// The game's getter reads the live dungeonsCleared observables, which would subscribe
// getDungeonData to all of them and re-render the whole list on every write while loading a save.
const getDungeonTokenCost = (dungeon: string, clears: number): number => {
    const { baseTokenCost, difficulty } = dungeonList[dungeon];
    const baseSize = GameConstants.BASE_DUNGEON_SIZE + difficulty;
    const fullSize = Math.max(GameConstants.MIN_DUNGEON_SIZE, baseSize);
    const reducedSize = Math.max(GameConstants.MIN_DUNGEON_SIZE, baseSize - Math.max(0, clears.toString().length - 1));
    return Math.ceil(baseTokenCost * reducedSize / fullSize);
};

/** Total tokens spent clearing a dungeon from fromClears to toClears */
const getDungeonTokenCostRange = (dungeon: string, fromClears: number, toClears: number): number => {
    let total = 0;
    for (let clears = Math.max(0, fromClears); clears < toClears;) {
        // The cost only changes when the number of digits in the clear count does
        const next = Math.min(toClears, Math.pow(10, clears.toString().length));
        total += (next - clears) * getDungeonTokenCost(dungeon, clears);
        clears = next;
    }
    return total;
};

const getDungeonPokemon = (dungeonName: string): DungeonPokemon[] => {
    const dungeon = dungeonList[dungeonName];
    const pokemonList: DungeonPokemon[] = [];

    const getPokemonFromEncounter = (encounter: DungeonEnemy | DungeonBoss, isBoss = false): DungeonPokemon[] => {
        if (typeof encounter === 'string') {
            return [{ pokemon: encounter }];
        }

        if (Object.prototype.hasOwnProperty.call(encounter, 'pokemon')) {
            return [{ pokemon: (encounter as DetailedPokemon).pokemon }];
        }

        if (encounter instanceof DungeonBossPokemon) {
            return [{ pokemon: encounter.name, boss: true }];
        }

        if (encounter instanceof DungeonTrainer) { // include shadows
            return encounter.team
                .filter(pokemon => pokemon.shadow >= ShadowStatus.Shadow)
                .map(pokemon => ({ pokemon: pokemon.name, boss: isBoss, shadow: true }));
        }

        return [];
    };

    for (const enemy of dungeon.enemyList) {
        // exclude event encounters
        if (typeof enemy !== 'string' && hasEventRequirement(enemy.options?.requirement)) {
            continue;
        }

        pokemonList.push(...getPokemonFromEncounter(enemy));
    }

    for (const boss of dungeon.bossList) {
        if (hasEventRequirement(boss.options?.requirement)) {
            continue;
        }

        pokemonList.push(...getPokemonFromEncounter(boss, true));
    }

    // remove dupes
    const seen = new Set<string>();
    return pokemonList.filter(item => {
        const key = `${item.pokemon}-${item.boss}-${item.shadow}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

export const getDungeonData = ko.pureComputed((): RegionDungeonData[] => {
    const dungeonOverrides = new Set(DungeonListOverride.flatMap(d => d.dungeons));

    const regionDungeons: { region: number; name?: string; dungeons: string[] }[] = [
        ...GameConstants.RegionDungeons.map((rd, idx) => ({
            region: idx,
            dungeons: rd.filter(d => !dungeonOverrides.has(d)),
        })),
        ...DungeonListOverride.map(rd => ({ ...rd })),
    ];

    const isDungeonComplete = (data: DungeonData) => data.clears >= DUNGEON_CLEAR_GOAL
        && data.shinyCount >= data.pokemonCount
        && data.shadowCount >= data.shadowPokemonCount
        && (!isPokerusUnlocked() || data.resistCount >= data.pokemonCount);

    const currentParty = partyList();

    return regionDungeons
        .map(d => ({
            ...d,
            dungeons: d.dungeons.map((dungeon): DungeonData => {
                const clears = getDungeonClearCount(dungeon);
                const pokemonList = getDungeonPokemon(dungeon);
                const pokemonNames = pokemonList.map(p => p.pokemon);
                const data: DungeonData = {
                    name: dungeon,
                    clears,
                    cost: getDungeonTokenCost(dungeon, clears),
                    cost500: getDungeonTokenCostRange(dungeon, 0, DUNGEON_CLEAR_GOAL),
                    remaining: getDungeonTokenCostRange(dungeon, Math.min(clears, DUNGEON_CLEAR_GOAL), DUNGEON_CLEAR_GOAL),
                    hide: TownList[dungeon].requirements.some(req => req instanceof DevelopmentRequirement),
                    pokemonList,
                    pokemonCount: pokemonList.length,
                    shadowPokemonCount: pokemonList.filter(p => p.shadow).length,
                    shinyCount: getShinyCount(pokemonNames, currentParty),
                    shadowCount: getShadowCount(pokemonNames, currentParty),
                    resistCount: getResistCount(pokemonNames, currentParty),
                    isComplete: false,
                };
                data.isComplete = isDungeonComplete(data);
                return data;
            }).filter(d => !d.hide),
        }))
        .filter(d => d.region <= GameConstants.MAX_AVAILABLE_REGION)
        .sort((a, b) => a.region - b.region);
});

const getDungeonDataFlat = ko.pureComputed(() => getDungeonData().flatMap(d => d.dungeons));

export const totalDungeonClears = ko.pureComputed(() => {
    return getDungeonDataFlat().reduce((sum, dungeon) => sum + dungeon.clears, 0);
});

export const totalDungeonCost500Clears = ko.pureComputed(() => {
    return getDungeonDataFlat().reduce((sum, dungeon) => sum + dungeon.cost500, 0);
});

export const remainingDungeonCost500Clears = ko.pureComputed(() => {
    return getDungeonDataFlat().reduce((sum, dungeon) => sum + dungeon.remaining, 0);
});

/** Share of the clears needed for every dungeon achievement */
export const dungeonAchievementProgress = ko.pureComputed(() => {
    const dungeons = getDungeonDataFlat();
    if (!dungeons.length) {
        return 0;
    }

    const cleared = dungeons.reduce((sum, dungeon) => sum + Math.min(dungeon.clears, DUNGEON_CLEAR_GOAL), 0);
    return cleared / (dungeons.length * DUNGEON_CLEAR_GOAL);
});

export const getMostClearedDungeons = ko.pureComputed(() => {
    return [...getDungeonDataFlat()].sort((a, b) => b.clears - a.clears).slice(0, 5);
});

/* ------------------------------------------------------------------ */
/* Gyms                                                               */
/* ------------------------------------------------------------------ */

const getGymClearCount = (gym: string): number => {
    if (!SaveData.isLoaded()) {
        return 0;
    }

    const gymIndex = GameConstants.getGymIndex(gym);
    return SaveData.current().save.statistics.gymsDefeated[gymIndex] || 0;
};

/** Gym names grouped by region, with sub-region leagues split into their own sections */
export const getRegionGymNames = (): { region: number; name?: string; gyms: string[] }[] => {
    const gymList: { region: number; name?: string; gyms: string[] }[] = [];

    GameConstants.RegionGyms.forEach((gyms, region) => {
        if (region > GameConstants.MAX_AVAILABLE_REGION) {
            return;
        }

        if (region == Region.alola) {
            gyms = gyms.filter(g => !g.endsWith(' Trial'));
        }

        gymList.push({ region, gyms });
    });

    GymListOverride.forEach((g) => gymList.push({ ...g }));

    return gymList.sort((a, b) => a.region - b.region);
};

export const getGymData = ko.pureComputed(() => {
    return getRegionGymNames().map(g => ({
        ...g,
        gyms: g.gyms.map(gym => ({
            name: gym,
            clears: getGymClearCount(gym),
        })),
    }));
});

/* ------------------------------------------------------------------ */
/* Routes                                                             */
/* ------------------------------------------------------------------ */

interface RouteData extends RegionRoute {
    pokemonList: PokemonNameType[];
    displayName: string;
    defeats: number;
    pokemonCount: number;
    shinyCount: number;
    resistCount: number;
    isComplete: boolean;
}

interface RegionRouteData {
    region: GameConstants.Region;
    subRegion: number;
    displayRegion?: number;
    displaySubRegion?: number;
    name?: string;
    routes: RouteData[];
}

const getRouteDefeatCount = (region: GameConstants.Region, routeNumber: number): number => {
    if (!SaveData.isLoaded()) {
        return 0;
    }

    const regionName = Region[region];
    return SaveData.current().save.statistics.routeKills[regionName][routeNumber] || 0;
};

const getRoutePokemon = (route: RegionRoute): PokemonNameType[] => {
    const pokemon = new Set([...route.pokemon.land, ...route.pokemon.water, ...route.pokemon.headbutt]);
    for (const special of route.pokemon.special) {
        // exclude event pokemon
        if (hasEventRequirement(special.req)) {
            continue;
        }

        special.pokemon.forEach(p => pokemon.add(p));
    }
    return [...pokemon];
};

export const getRouteData = ko.pureComputed((): RegionRouteData[] => {
    const routeList: { region: GameConstants.Region; subRegion: number; displayRegion?: number; displaySubRegion?: number; name?: string; routes: RegionRoute[] }[] = [];

    GameHelper.enumNumbers(Region).forEach(region => {
        if (region > GameConstants.MAX_AVAILABLE_REGION || region < 0) {
            return;
        }

        const regionRoutes = Routes.regionRoutes.filter(r => r.region == region);
        const routes = SubRegions.list[region].length == 1 ? regionRoutes
            : regionRoutes.filter(r => !RouteListOverride.some(o => o.region === r.region && o.subRegion === r.subRegion));

        routeList.push({ region, subRegion: 0, routes });
    });

    RouteListOverride.forEach((r) => routeList.push({ ...r }));

    const isRouteComplete = (route: RouteData) => route.defeats >= ROUTE_DEFEAT_GOAL
        && route.shinyCount >= route.pokemonCount
        && (!isPokerusUnlocked() || route.resistCount >= route.pokemonCount);

    const currentParty = partyList();

    routeList.forEach(r => {
        const regionName = GameConstants.camelCaseToString(Region[r.region]);
        // The game's route objects are augmented in place for the templates
        r.routes.forEach(regionRoute => {
            const route = regionRoute as RouteData;
            route.pokemonList = getRoutePokemon(route);
            route.displayName = route.routeName.replace(regionName, '').trim();
            route.defeats = getRouteDefeatCount(route.region, route.number);
            route.pokemonCount = route.pokemonList.length;
            route.shinyCount = getShinyCount(route.pokemonList, currentParty);
            route.resistCount = getResistCount(route.pokemonList, currentParty);
            route.isComplete = isRouteComplete(route);
        });
    });

    return (routeList as RegionRouteData[]).sort((a, b) =>
        (a.displayRegion || a.region) - (b.displayRegion || b.region)
        || (a.displaySubRegion || a.subRegion) - (b.displaySubRegion || b.subRegion));
});

/* ------------------------------------------------------------------ */
/* Gigantamax                                                         */
/* ------------------------------------------------------------------ */

/** The order Gigantamax pokémon become available at the Max Lair */
export const getGMaxOrder = ko.pureComputed(() => {
    if (!SaveData.isLoaded()) {
        return [];
    }

    const isQuestStepRequirement = (r: Requirement): r is QuestLineStepCompletedRequirement =>
        r instanceof QuestLineStepCompletedRequirement && typeof r.questIndex === 'function';

    const unlockableGMax = dungeonList['Max Lair'].bossList
        .filter(b => b.options?.requirement?.requirements?.some(isQuestStepRequirement));
    const quests = App.game.quests.getQuestLine('The Lair of Giants').quests();

    const gmax: { pokemon: PokemonNameType; questStep?: number; wishingPieces?: number }[] = unlockableGMax.map(b => {
        const req = b.options!.requirement!.requirements!.find((r): r is QuestLineStepCompletedRequirement => r instanceof QuestLineStepCompletedRequirement)!;
        const questStepIndex = (req.questIndex as () => number)();
        return {
            pokemon: (b as DungeonBossPokemon).name,
            questStep: questStepIndex,
            wishingPieces: quests[questStepIndex].amount,
        };
    }).sort((a, b) => a.questStep - b.questStep);

    // pikachu, meowth, eevee always first
    gmax.unshift({ pokemon: 'Gigantamax Pikachu' }, { pokemon: 'Gigantamax Meowth' }, { pokemon: 'Gigantamax Eevee' });

    // eternapants always last
    const monoType = SaveData.getMonoType(SaveData.current().save.party.caughtPokemon);
    const isMonoPoison = monoType?.length == 1 && monoType[0] == PokemonType.Poison;
    gmax.push({ pokemon: isMonoPoison ? 'Eternapants Eternapantatus' : 'Eternamax Eternatus' });

    return gmax;
});

/* ------------------------------------------------------------------ */
/* Type damage                                                        */
/* ------------------------------------------------------------------ */

interface TypeDamageCell {
    damage: number;
    /** Position on the heatmap: 0 (lowest damage) to 1 (highest damage) */
    percent?: number;
}

interface TypeDamageDistribution {
    distribution: Record<string, Record<string, TypeDamageCell>>;
    max: number;
    min: number;
}

export const typeDamageDistribution = ko.observable<TypeDamageDistribution>();
export const includeXAttack = ko.observable(true);
export const includeYellowFlute = ko.observable(true);
export const includeGems = ko.observable(true);
export const typeDamageWeather = ko.observable<WeatherType>(WeatherType.Clear);
export const typeDamageRegion = ko.observable<GameConstants.Region>(Region.none);

/** Party damage against every type combination */
export const calculateTypeDamageDistribution = (): void => {
    SaveData.loadAttackData();

    player.effectList['xAttack'](includeXAttack() ? 1 : 0);
    App.game.challenges.list.disableGems.active(!includeGems());
    if (includeYellowFlute() != FluteEffectRunner.isActive('Yellow_Flute')()) {
        FluteEffectRunner.toggleEffect('Yellow_Flute');
    }

    const ignoreRegionMultiplier = typeDamageRegion() == Region.none;
    const types = GameHelper.enumNumbers(PokemonType).filter(t => t != PokemonType.None);

    const distribution: TypeDamageDistribution['distribution'] = {};
    let max = 0;
    let min = Number.MAX_SAFE_INTEGER;

    for (const type1 of types) {
        distribution[PokemonType[type1]] = {};
        for (const type2 of types) {
            const damage = App.game.party.calculatePokemonAttack(type1, type2, ignoreRegionMultiplier, typeDamageRegion(), true, false, typeDamageWeather(), true, true);
            distribution[PokemonType[type1]][PokemonType[type2]] = { damage };
            max = Math.max(max, damage);
            min = Math.min(min, damage);
        }
    }

    // Place each value between min and max, the theme picks the color when rendering
    for (const row of Object.values(distribution)) {
        for (const cell of Object.values(row)) {
            cell.percent = max > min ? (cell.damage - min) / (max - min) : 1;
        }
    }

    typeDamageDistribution({ distribution, max, min });
};

interface TypeDamageTheme {
    label: string;
    /** Colors from lowest to highest damage, omitted for the red to green hue ramp */
    stops?: string[];
    /** Opacity over the black table, kept low enough for 4.5:1 text contrast on the brightest stop */
    alpha?: number;
}

/** Heatmap colors, the palettes stay readable with color blindness */
const typeDamageThemes: Record<string, TypeDamageTheme> = {
    viridis: {
        label: 'Viridis',
        stops: ['#440154', '#472d7b', '#3b528b', '#2c728e', '#21918c', '#28ae80', '#5ec962', '#addc30', '#fde725'],
        alpha: 0.4,
    },
    cividis: {
        label: 'Cividis',
        stops: ['#00224e', '#123570', '#3b496c', '#575d6d', '#707173', '#8a8779', '#a69d75', '#c4b56c', '#e4cf5b', '#fee838'],
        alpha: 0.4,
    },
    redGreen: { label: 'Red–Green' },
    redBlue: {
        label: 'Red–Blue',
        stops: ['#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#f7f7f7', '#d1e5f0', '#92c5de', '#4393c3', '#2166ac'],
        alpha: 0.4,
    },
    grayscale: {
        label: 'Grayscale',
        stops: ['#000000', '#ffffff'],
        alpha: 0.35,
    },
};

export const typeDamageThemeOptions = Object.entries(typeDamageThemes).map(([value, { label }]) => ({ value, label }));

const hexToRgb = (hex: string): number[] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** The heatmap color for a cell, in the selected theme */
export const typeDamageColor = (percent: number): string => {
    const theme = typeDamageThemes[Settings.typeDamage.colorTheme()] ?? typeDamageThemes.viridis;
    if (!theme.stops) {
        return `hsla(${percent * 120}, 70%, 40%, 0.4)`;
    }

    // Blend the two stops either side of the value
    const position = percent * (theme.stops.length - 1);
    const index = Math.min(Math.floor(position), theme.stops.length - 2);
    const from = hexToRgb(theme.stops[index]);
    const to = hexToRgb(theme.stops[index + 1]);
    const [r, g, b] = from.map((c, i) => Math.round(c + (to[i] - c) * (position - index)));
    return `rgba(${r}, ${g}, ${b}, ${theme.alpha})`;
};

/** Gradient for the legend, lowest damage on the left */
export const typeDamageLegendGradient = ko.pureComputed(() => {
    const steps = 10;
    const colors = Array.from({ length: steps + 1 }, (_, i) => typeDamageColor(i / steps));
    return `linear-gradient(to right, ${colors.join(', ')})`;
});

export const getPlayerBerryCount = (berryType: BerryType): number => {
    if (!SaveData.isLoaded()) {
        return 0;
    }

    return SaveData.getBerryInventory()[berryType] ?? 0;
};
