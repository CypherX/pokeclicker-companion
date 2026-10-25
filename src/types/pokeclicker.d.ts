/**
 * Ambient declarations for the PokéClicker game globals used by the companion.
 *
 * The game is loaded at runtime from pokeclicker/docs/scripts (modules.min.js + script.min.js),
 * which define everything below on the global scope. Only the subset of the game API that the
 * companion touches is declared here; signatures mirror the game source (see pokeclicker-dev/src).
 *
 * Some members that are private in the game source are declared public here because the
 * companion reads or overrides them directly.
 */

/* ------------------------------------------------------------------ */
/* Enums                                                              */
/* ------------------------------------------------------------------ */

declare enum PokemonType {
    None = -1, Normal = 0, Fire = 1, Water = 2, Electric = 3, Grass = 4, Ice = 5, Fighting = 6, Poison = 7,
    Ground = 8, Flying = 9, Psychic = 10, Bug = 11, Rock = 12, Ghost = 13, Dragon = 14, Dark = 15, Steel = 16, Fairy = 17,
}

declare enum WeatherType {
    Clear = 0, Overcast, Rain, Thunderstorm, Snow, Hail, Blizzard, Harsh_Sunlight, Sandstorm, Fog, Windy,
}

declare enum BerryType {
    None = -1, Cheri, Chesto, Pecha, Rawst, Aspear, Leppa, Oran, Sitrus, Persim, Razz, Bluk, Nanab, Wepear, Pinap,
    Figy, Wiki, Mago, Aguav, Iapapa, Lum, Pomeg, Kelpsy, Qualot, Hondew, Grepa, Tamato, Cornn, Magost, Rabuta, Nomel,
    Spelon, Pamtre, Watmel, Durin, Belue, Pinkan, Occa, Passho, Wacan, Rindo, Yache, Chople, Kebia, Shuca, Coba,
    Payapa, Tanga, Charti, Kasib, Haban, Colbur, Babiri, Chilan, Roseli, Snover, Micle, Custap, Jaboca, Rowap, Kee,
    Maranga, Liechi, Ganlon, Salac, Petaya, Apicot, Lansat, Starf, Enigma, Hopo,
}

declare enum OakItemType {
    Magic_Ball = 0, Amulet_Coin, Rocky_Helmet, Exp_Share, Sprayduck, Shiny_Charm, Magma_Stone, Cell_Battery,
    Squirtbottle, Sprinklotad, Explosive_Charge, Treasure_Scanner,
}

declare enum QuestLineState { inactive, started, ended, suspended }

declare enum PartyPokemonSaveKeys {
    attackBonusPercent = 0, attackBonusAmount, vitaminsUsed, exp, breeding, shiny, category, levelEvolutionTriggered,
    pokerus, effortPoints, heldItem, defaultFemaleSprite, hideShinyImage, nickname, shadow, showShadowImage,
}

declare namespace GameConstants {
    enum Region {
        none = -1, kanto = 0, johto = 1, hoenn = 2, sinnoh = 3, unova = 4, kalos = 5, alola = 6, galar = 7,
        hisui = 8, paldea = 9, final = 10,
    }
    enum KantoSubRegions { Kanto = 0, Sevii123, Sevii4567 }
    enum HoennSubRegions { Hoenn = 0, Orre }
    enum AlolaSubRegions { MelemeleIsland = 0, AkalaIsland, UlaulaIsland, PoniIsland, MagikarpJump }
    type SubRegions = number;

    enum ShadowStatus { None, Shadow, Purified }
    enum Pokerus { Uninfected = 0, Infected, Contagious, Resistant }
    enum VitaminType { Protein, Calcium, Carbos }

    enum FluteItemType {
        Yellow_Flute = 'Yellow_Flute', Black_Flute = 'Black_Flute', Time_Flute = 'Time_Flute',
        Red_Flute = 'Red_Flute', White_Flute = 'White_Flute', Blue_Flute = 'Blue_Flute',
    }
    enum BattleItemType {
        xAttack = 'xAttack', xClick = 'xClick', Lucky_egg = 'Lucky_egg', Token_collector = 'Token_collector',
        Dowsing_machine = 'Dowsing_machine', Lucky_incense = 'Lucky_incense',
    }
    enum Currency { money, questPoint, dungeonToken, diamond, farmPoint, battlePoint, contestToken }
    enum BerryTraderLocations {
        'None' = -1, 'Goldenrod City' = 0, 'Mauville City', 'Pinkan Pokémon Reserve', 'Hearthome City',
        'Secret Berry Shop', 'Driftveil City',
    }

    const MAX_AVAILABLE_REGION: Region;
    const EGG_CYCLE_MULTIPLIER: number;
    const BREEDING_ATTACK_BONUS: number;
    const BASE_DUNGEON_SIZE: number;
    const MIN_DUNGEON_SIZE: number;
    const GYM_TIME: number;
    const TEMP_BATTLE_TIME: number;
    const FRIEND_SAFARI_POKEMON: number;

    const RegionDungeons: string[][];
    const RegionGyms: string[][];
    const OrangeGyms: string[];
    const OrreGyms: string[];
    const MagikarpJumpGyms: string[];

    function getDungeonIndex(dungeon: string): number;
    function getGymIndex(gym: string): number;
    function getTemporaryBattlesIndex(temporaryBattle: string): number;
    function camelCaseToString(str: string): string;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

declare class GameHelper {
    static enumStrings(enumerable: any): string[];
    static enumNumbers(enumerable: any): number[];
}

declare class SeededRand {
    static seed(state: number): void;
    static seedWithDate(d: Date): void;
    static floor(max: number): number;
    static intBetween(min: number, max: number): number;
    static fromArray<T>(arr: T[]): T;
    static string(length: number): string;
    static shuffleArray<T>(arr: T[]): T[];
}
declare class Rand extends SeededRand {}
declare class SeededDateRand extends SeededRand {}

declare class MapHelper {
    static normalizeRoute(route: number, region: GameConstants.Region): number;
}

declare class Notifier {
    static notify(...args: any[]): unknown;
}
declare class SaveSelector {
    static loadSaves(...args: any[]): void;
}
declare var SortModules: () => void;

declare class Settings {
    static setSettingByName(name: string, value: any): void;
}

/* ------------------------------------------------------------------ */
/* Requirements                                                       */
/* ------------------------------------------------------------------ */

declare abstract class Requirement {
    isCompleted(): boolean;
    /** Present on MultiRequirement / OneFromManyRequirement */
    requirements?: Requirement[];
}
declare class MultiRequirement extends Requirement {
    requirements: Requirement[];
}
declare class DevelopmentRequirement extends Requirement {}
declare class SpecialEventRequirement extends Requirement {}
declare class DayOfWeekRequirement extends Requirement {
    DayOfWeekNum: number;
}
declare class QuestLineStepCompletedRequirement extends Requirement {
    questIndex: (() => number) | number;
}
declare class SeededDateSelectNRequirement extends Requirement {
    index: number;
    total: number;
    select: number;
}

/* ------------------------------------------------------------------ */
/* Pokémon                                                            */
/* ------------------------------------------------------------------ */

type PokemonNameType = string;

interface PokemonListData {
    id: number;
    name: PokemonNameType;
    /** Set for every pokémon when the game loads */
    nativeRegion: GameConstants.Region;
    type: PokemonType[];
    attack: number;
    eggCycles: number;
}

declare const pokemonList: PokemonListData[];
declare const pokemonMap: Record<number | PokemonNameType, PokemonListData>;

declare class PokemonHelper {
    static calcNativeRegion(pokemonName: PokemonNameType): GameConstants.Region;
    static getPokemonByName(name: PokemonNameType): { id: number; name: PokemonNameType; type1: PokemonType; type2: PokemonType };
}

declare class TypeHelper {
    /** Type effectiveness of an attacker with types a1/a2 against a defender with types d1/d2 */
    static getAttackModifier(a1: PokemonType, a2: PokemonType, d1: PokemonType, d2: PokemonType): number;
}

declare class PokemonLocations {
    static isObtainableAndNotEvable(pokemonName: PokemonNameType): boolean;
}

declare class PokemonFactory {
    static generatePartyPokemon(id: number): PartyPokemon;
}

declare class Item {
    name: string;
    readonly displayName: string;
    totalPrice(amount: number): number;
}
declare class BattleItem extends Item {
    multiplyBy?: number;
}
declare class FluteItem extends Item {
    gemTypes: (keyof typeof PokemonType)[];
    multiplyBy: number;
}
declare class HeldItem extends Item {
    applyCondition?: () => boolean;
}
declare class AttackBonusHeldItem extends HeldItem {
    attackBonus: number;
}

declare const ItemList: Record<string, Item> & {
    Time_Flute: FluteItem;
    Power_Herb: HeldItem;
};

declare class PartyPokemon {
    id: number;
    name: PokemonNameType;
    level: number;
    breeding: boolean;
    shiny: boolean;
    pokerus: GameConstants.Pokerus;
    shadow: GameConstants.ShadowStatus;
    effortPoints: number;
    evs: KnockoutComputed<number>;
    vitaminsUsed: Record<GameConstants.VitaminType, KnockoutObservable<number>>;
    heldItem: KnockoutObservable<HeldItem | undefined>;
    clickAttackBonus: KnockoutComputed<number>;
    calculateAttack(ignoreLevel?: boolean): number;
    calculateEVAttackBonus(): number;
    getBreedingAttackBonus(): number;
    getEggSteps(): number;
    fromJSON(json: Record<string, any>): void;
}

/* ------------------------------------------------------------------ */
/* World                                                              */
/* ------------------------------------------------------------------ */

declare class SpecialRoutePokemon {
    pokemon: PokemonNameType[];
    req: Requirement | null;
}

declare class RegionRoute {
    routeName: string;
    region: GameConstants.Region;
    number: number;
    subRegion?: number;
    pokemon: {
        land: PokemonNameType[];
        water: PokemonNameType[];
        headbutt: PokemonNameType[];
        special: SpecialRoutePokemon[];
    };
}

declare class Routes {
    static regionRoutes: RegionRoute[];
    static getRoutesByRegion(region: GameConstants.Region): RegionRoute[];
}

declare class SubRegion {
    name: string;
    id: number;
}
declare class SubRegions {
    static list: Record<number, SubRegion[]>;
    static getSubRegionById(region: GameConstants.Region, subregionID: number): SubRegion | undefined;
}

interface EnemyOptions {
    weight?: number;
    requirement?: Requirement;
    hide?: boolean;
}

declare class GymPokemon {
    name: PokemonNameType;
    maxHealth: number;
    level: number;
    shiny: boolean;
    shadow: GameConstants.ShadowStatus;
}

declare class Trainer {
    name: string;
    team: GymPokemon[];
    getTeam(): GymPokemon[];
}
declare class DungeonTrainer extends Trainer {
    options?: EnemyOptions;
}
declare class DungeonBossPokemon {
    name: PokemonNameType;
    options?: EnemyOptions;
}

interface DetailedPokemon {
    pokemon: PokemonNameType;
    options: EnemyOptions;
}

type DungeonEnemy = PokemonNameType | DetailedPokemon | DungeonTrainer;
type DungeonBoss = DungeonBossPokemon | DungeonTrainer;

declare class Dungeon {
    name: string;
    enemyList: DungeonEnemy[];
    bossList: DungeonBoss[];
    baseTokenCost: number;
    readonly difficulty: number;
}
declare const dungeonList: Record<string, Dungeon>;

declare class Town {
    name: string;
    region: GameConstants.Region;
    subRegion: GameConstants.SubRegions;
    requirements: Requirement[];
    dungeon?: Dungeon;
}
declare class DungeonTown extends Town {
    dungeon: Dungeon;
}
declare const TownList: Record<string, Town>;

declare abstract class TownContent {
    parent: Town;
    requirements: Requirement[];
    isUnlocked(): boolean;
}

declare class Gym extends TownContent {
    town: string;
    leaderName: string;
    getPokemonList(): GymPokemon[];
}
declare const GymList: Record<string, Gym>;

declare class TemporaryBattle extends TownContent {
    name: string;
    getTown(): Town;
    getPokemonList(): GymPokemon[];
}
declare const TemporaryBattleList: Record<string, TemporaryBattle>;

declare class Weather {
    static period: number;
    static getWeather(region: GameConstants.Region, date?: Date): WeatherType;
}

interface RoamingGroup {
    name: string;
}
declare class RoamingPokemonList {
    static roamerGroups: RoamingGroup[][];
    static period: number;
    static generateIncreasedChanceRoutes(date?: Date): void;
    static getIncreasedChanceRouteBySubRegionGroup(region: GameConstants.Region, subRegionGroup: number): KnockoutObservable<RegionRoute>;
}

declare const AlphUnownList: string[];
declare const TanobyUnownList: string[];
declare const SolaceonUnownList: string[];

declare class SafariPokemonList {
    static generateSafariLists(): void;
}

/* ------------------------------------------------------------------ */
/* Trading                                                            */
/* ------------------------------------------------------------------ */

declare class BerryDeal {
    berries: { berryType: BerryType; amount: number }[];
    item: { itemType: Item; amount: number };
    static list: Partial<Record<GameConstants.BerryTraderLocations, KnockoutObservableArray<BerryDeal>>>;
    static generateDeals(date: Date): void;
}

declare enum DealCostOrProfitType {
    Gem = 'Gem', Shard = 'Shard', Berry = 'Berry', Item = 'Item', Amount = 'Amount',
}

type DealCostOrProfit =
    | { type: DealCostOrProfitType.Gem; amount: number; gemType: PokemonType }
    | { type: DealCostOrProfitType.Shard; amount: number; shardItem: Item }
    | { type: DealCostOrProfitType.Berry; amount: number; berryType: BerryType }
    | { type: DealCostOrProfitType.Item; amount: number; item: Item }
    | { type: DealCostOrProfitType.Amount; amount: number; currency: { amount: number; currency: GameConstants.Currency } };

declare class GenericDeal {
    costs: DealCostOrProfit[];
    profits: DealCostOrProfit[];
    static generateDeals(date: Date): void;
    static generatePirateDeals(date: Date): GenericDeal[];
}

declare class EnigmaMutation {
    static getReqs(): BerryType[];
    fromJSON(json: any): void;
}

/* ------------------------------------------------------------------ */
/* Game state                                                         */
/* ------------------------------------------------------------------ */

type MultiplierTypeString = 'pokemonAttack' | 'clickAttack' | string;

declare class Multiplier {
    multipliers: Record<string, { source: string }[]>;
    getBonus(type: MultiplierTypeString, useBonus?: boolean): number;
}

interface Saveable {
    saveKey: string;
    fromJSON(json: any): void;
}

declare class Party {
    constructor(multiplier: Multiplier);
    saveKey: string;
    caughtPokemon: PartyPokemon[];
    multiplier: Multiplier;
    calculatePokemonAttack(
        type1?: PokemonType, type2?: PokemonType, ignoreRegionMultiplier?: boolean, region?: GameConstants.Region,
        includeBreeding?: boolean, useBaseAttack?: boolean, overrideWeather?: WeatherType, ignoreLevel?: boolean,
        includeTempBonuses?: boolean, subregion?: GameConstants.SubRegions,
    ): number;
    calculateOnePokemonAttack(
        pokemon: PartyPokemon, type1?: PokemonType, type2?: PokemonType, region?: GameConstants.Region,
        ignoreRegionMultiplier?: boolean, includeBreeding?: boolean, useBaseAttack?: boolean,
        overrideWeather?: WeatherType, ignoreLevel?: boolean, includeTempBonuses?: boolean,
    ): number;
    getRegionAttackMultiplier(highestRegion?: GameConstants.Region): number;
    partyPokemonActiveInSubRegion(region: GameConstants.Region, subregion: GameConstants.SubRegions): PartyPokemon[];
}

declare class Player {
    constructor(savedPlayer?: any);
    trainerId: string;
    highestRegion: KnockoutObservable<GameConstants.Region>;
    effectList: Record<string, KnockoutObservable<number>>;
    itemList: Record<string, KnockoutObservable<number>>;
}
declare let player: Player;

declare class Challenge {
    active: KnockoutObservable<boolean>;
}
declare class Challenges {
    list: Record<string, Challenge>;
}

declare class OakItem {
    isActiveKO: KnockoutObservable<boolean>;
}
declare class OakItems {
    constructor(maxLevels: number[], multiplier: Multiplier);
    itemList: OakItem[];
    use(...args: any[]): void;
    initialize(): void;
}

declare class Quest {
    amount: number;
}
declare class QuestLine {
    name: string;
    quests: KnockoutObservableArray<Quest>;
}
declare class Quests {
    questLines: KnockoutObservableArray<QuestLine>;
    getQuestLine(name: string): QuestLine;
}
declare class QuestLineHelper {
    static loadQuestLines(savedQuestLines?: any[]): void;
    /** Added by the companion: the original loader, wrapped to only run once */
    static loadQuestLinesReal: () => void;
}

declare class BadgeCase {
    maxLevel: KnockoutComputed<number>;
}

declare class Achievement {
    unlocked(): boolean;
    isCompleted: () => boolean;
}
declare class AchievementHandler {
    static achievementList: Achievement[];
    static initialize(multiplier: Multiplier, challenges: Challenges): void;
    static fromJSON(unlockedAchievements: string[]): void;
    static preCheckAchievements(): void;
    static calculateMaxBonus(): void;
    static achievementBonus(): number;
}

declare class EffectEngineRunner {
    static initialize(multiplier: Multiplier, items: Item[]): void;
}
declare class FluteEffectRunner {
    static activeGemTypes: KnockoutObservableArray<number>;
    static initialize(multiplier: Multiplier): void;
    static updateActiveGemTypes(): void;
    static isActive(itemName: string): KnockoutComputed<boolean>;
    static toggleEffect(itemName: string): void;
}

/** Game subsystems constructed by the companion. Only used members are typed. */
interface InitializableSubsystem { initialize(): void }
declare class Update {}
declare class Profile {}
declare class Breeding implements InitializableSubsystem { constructor(multiplier: Multiplier); initialize(): void }
declare class Pokeballs implements InitializableSubsystem { initialize(): void }
declare class PokeballFilters {}
declare class Wallet { constructor(multiplier: Multiplier) }
declare class KeyItems implements InitializableSubsystem { initialize(): void }
declare class OakItemLoadouts {}
declare class PokemonCategories {}
declare class Gems {}
declare class Underground implements InitializableSubsystem { initialize(): void }
declare class Farming implements InitializableSubsystem {
    constructor(multiplier: Multiplier);
    initialize(): void;
    mutations: { mutatedBerry: BerryType }[];
}
declare class LogBook {}
declare class RedeemableCodes {}
declare class Statistics {}
declare class SpecialEvents {}
declare class Discord {}
declare class AchievementTracker {}
declare class BattleFrontier {}
declare class SaveReminder {}
declare class BattleCafeSaveObject {}
declare class DreamOrbController {}
declare class PurifyChamber {}
declare class WeatherApp {}
declare class ZMoves {}

declare class Game {
    constructor(...subsystems: object[]);
    party: Party;
    breeding: Breeding;
    pokeballs: Pokeballs;
    keyItems: KeyItems;
    badgeCase: BadgeCase;
    oakItems: OakItems;
    underground: Underground;
    farming: Farming;
    quests: Quests;
    challenges: Challenges;
    multiplier: Multiplier;
    [key: string]: any;
}

declare class App {
    static game: Game;
    static start(): void;
}
