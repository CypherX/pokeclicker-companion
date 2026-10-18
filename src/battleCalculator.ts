import { bindAllFlutesToggle, deactivateAllFlutes, setActiveFlutes } from './flutes';
import * as SaveData from './save';
import * as Settings from './settings';
import { getRegionGymNames } from './statistics';
import { getStoredFlag, persistFlag } from './util';

const { Region, AlolaSubRegions } = GameConstants;

/** Weather setting value that applies each region's current weather */
const CURRENT_REGIONAL_WEATHER = -1;

/** An enemy pokémon, with observables for its calculated results */
interface CalcPokemon extends GymPokemon {
    type1: PokemonType;
    type2: PokemonType;
    /** Damage cache keys for both type orders, since damage is symmetric in type order */
    damageKey1: string;
    damageKey2: string;
    typeString: string;
    formattedMaxHealth: string;
    partyDamage: KnockoutObservable<number>;
    formattedPartyDamage: KnockoutObservable<string>;
    secondsToDefeat: KnockoutObservable<number>;
    formattedSeconds: KnockoutObservable<string>;
    secondsRemainder: KnockoutObservable<string>;
}

/** Fields added to the game's Gym and TemporaryBattle objects for the calculator */
interface CalcBattleFields {
    townObj: Town;
    pokemonList: CalcPokemon[];
    totalHealth: number;
    formattedTotalHealth: string;
    isCompleted: KnockoutObservable<boolean>;
    secondsToWin: KnockoutObservable<number>;
    formattedSecondsToWin: KnockoutObservable<string>;
    timeClass: KnockoutComputed<string>;
    clickDamage: KnockoutObservable<number>;
    formattedClickDamage: KnockoutObservable<string>;
}

type CalcGym = Gym & CalcBattleFields;
type CalcTemporaryBattle = TemporaryBattle & CalcBattleFields;
type CalcBattle = CalcGym | CalcTemporaryBattle;

export const showResult = ko.observable(false);
export const gymList = ko.observable<CalcGym[]>([]);
export const tempBattleList = ko.observable<CalcTemporaryBattle[]>([]);

export const settings = {
    xAttackEnabled: ko.observable(false),
    weather: ko.observable<WeatherType | typeof CURRENT_REGIONAL_WEATHER>(WeatherType.Clear),
    hideCompleted: ko.observable(true),
    hideLocked: ko.observable(false),
    activeFlutes: ko.observableArray<GameConstants.FluteItemType>([]),
    allFlutesToggle: ko.observable(false),
    /** Bound to a text input, so may hold a string */
    clicksPerSecond: ko.observable<number | string>(0),
    xClickEnabled: ko.observable(false),
    rockyHelmetEnabled: ko.observable(false),
    autoCollapseConfig: ko.observable(true),
    runCalcImmediately: ko.observable(true),
};

/** Region used by the patched Party.getRegionAttackMultiplier during calculations; -1 when not calculating */
let regionMultiplierOverride: number = -1;

// Party.getRegionAttackMultiplier is used internally by App.game.party.calculateOnePokemonAttack.
// Override it so calculations can apply the multiplier of the region being battled in.
const originalGetRegionAttackMultiplier = Party.prototype.getRegionAttackMultiplier;
Party.prototype.getRegionAttackMultiplier = function (this: Party) {
    const region = Math.max(regionMultiplierOverride, player.highestRegion());
    return originalGetRegionAttackMultiplier.call(this, region);
};

const isMagikarpJump = (town: Town): boolean =>
    town.region === Region.alola && town.subRegion === AlolaSubRegions.MagikarpJump;

/* ------------------------------------------------------------------ */
/* Damage calculation                                                 */
/* ------------------------------------------------------------------ */

/**
 * Type effectiveness of a party type combination against an enemy type combination, measured
 * on a representative pokémon. Region and weather scale both sides equally, so they aren't keys.
 */
const typeMultCache = new Map<number, number>();
const getTypeMult = (
    pType1: number, pType2: number, eType1: PokemonType, eType2: PokemonType,
    repPokemon: PartyPokemon, region: GameConstants.Region, weather: WeatherType,
): number => {
    // Types range from -1 (None) to 17, so pack the four into one integer key
    const key = (((pType1 + 1) * 19 + pType2 + 1) * 19 + eType1 + 1) * 19 + eType2 + 1;
    let mult = typeMultCache.get(key);
    if (mult === undefined) {
        const party = App.game.party;
        const dummyBase = party.calculateOnePokemonAttack(repPokemon, PokemonType.None, PokemonType.None, region, true, true, false, weather, false, false);
        mult = dummyBase === 0
            ? 1
            : party.calculateOnePokemonAttack(repPokemon, eType1, eType2, region, true, true, false, weather, false, false) / dummyBase;
        typeMultCache.set(key, mult);
    }
    return mult;
};

export const calcClickAttack = (region = 0, subRegion = 0): number => {
    const clicksPerSecond = +settings.clicksPerSecond();
    if (clicksPerSecond <= 0) return 0;

    const caughtPokemon = App.game.party.partyPokemonActiveInSubRegion(region, subRegion);
    const baseClickAttack = Math.pow(caughtPokemon.reduce((total, p) => total + p.clickAttackBonus(), 1), 1.4);
    const bonus = App.game.multiplier.getBonus('clickAttack', false);
    const clickAttack = Math.floor(baseClickAttack * bonus);
    return clickAttack * Math.floor(clicksPerSecond);
};

const applyBattleSettings = () => {
    player.effectList['xAttack'](settings.xAttackEnabled() ? 1 : 0);
    player.effectList['xClick'](settings.xClickEnabled() ? 1 : 0);
    App.game.oakItems.itemList[OakItemType.Rocky_Helmet].isActiveKO(settings.rockyHelmetEnabled());
    setActiveFlutes(settings.activeFlutes());
};

const resetBattleSettings = () => {
    player.effectList['xAttack'](0);
    player.effectList['xClick'](0);
    App.game.oakItems.itemList[OakItemType.Rocky_Helmet].isActiveKO(false);
    deactivateAllFlutes();
};

export const calcBattleData = (): void => {
    const start = performance.now();

    const weatherLookup: WeatherType[] = new Array(GameConstants.MAX_AVAILABLE_REGION + 1);
    const weatherSetting = settings.weather();
    if (weatherSetting === CURRENT_REGIONAL_WEATHER) {
        const date = new Date();
        for (let i = 0; i <= GameConstants.MAX_AVAILABLE_REGION; i++) {
            weatherLookup[i] = Weather.getWeather(i, date);
        }
    } else {
        weatherLookup.fill(weatherSetting);
    }

    applyBattleSettings();

    // Total party attack (before type effectiveness) per region, bucketed by the party pokémon's
    // types, plus one representative pokémon per type combination to measure type effectiveness.
    // Plain objects are used deliberately: their key order determines the floating point summation order.
    const regionBuckets: Record<number, Record<number, Record<number, number>>> = {};
    const reps: Record<number, Record<number, PartyPokemon>> = {};

    for (let region = 0; region <= GameConstants.MAX_AVAILABLE_REGION; region++) {
        regionBuckets[region] = {};
    }

    for (const pokemon of App.game.party.caughtPokemon) {
        const pMap = pokemonMap[pokemon.name];
        const pType1 = pMap.type[0];
        const pType2 = pMap.type[1] ?? PokemonType.None;

        reps[pType1] ??= {};
        reps[pType1][pType2] ??= pokemon;

        for (let region = 0; region <= GameConstants.MAX_AVAILABLE_REGION; region++) {
            const typeBuckets = (regionBuckets[region][pType1] ??= {});
            regionMultiplierOverride = region;
            const baseRegAttack = App.game.party.calculateOnePokemonAttack(
                pokemon, PokemonType.None, PokemonType.None, region, false, true, false, weatherLookup[region], false, true,
            );

            typeBuckets[pType2] = (typeBuckets[pType2] || 0) + baseRegAttack;
        }
    }

    const calcAggregatedPartyAttack = (eType1: PokemonType, eType2: PokemonType, region: GameConstants.Region, weather: WeatherType) => {
        let attack = 0;
        const buckets = regionBuckets[region];

        for (const pType1 in buckets) {
            for (const pType2 in buckets[pType1]) {
                const baseRegAttack = buckets[pType1][pType2];
                if (baseRegAttack === 0) continue;

                const repPokemon = reps[pType1][pType2];
                attack += baseRegAttack * getTypeMult(+pType1, +pType2, eType1, eType2, repPokemon, region, weather);
            }
        }

        return Math.round(attack * App.game.party.multiplier.getBonus('pokemonAttack'));
    };

    // Only Magikarp can battle in Magikarp Jump, so calculate them individually
    const calcMkjAttack = (eType1: PokemonType, eType2: PokemonType, weather: WeatherType) => {
        const magikarp = App.game.party.caughtPokemon.filter(p => Math.floor(p.id) === 129);
        let attack = 0;
        for (const karp of magikarp) {
            attack += App.game.party.calculateOnePokemonAttack(karp, eType1, eType2, Region.none, true, true, false, weather, false, true);
        }
        return Math.round(attack * App.game.party.multiplier.getBonus('pokemonAttack'));
    };

    const clickDamage = calcClickAttack();
    const mkjClickDamage = calcClickAttack(Region.alola, AlolaSubRegions.MagikarpJump);
    const damageCache = new Map<string, number>();

    const battles: CalcBattle[] = [...gymList.peek(), ...tempBattleList.peek()];
    for (const battle of battles) {
        const town = battle.townObj;
        regionMultiplierOverride = town.region;

        const isMkj = isMagikarpJump(town);
        const currentClickDamage = isMkj ? mkjClickDamage : clickDamage;

        if (battle.clickDamage.peek() !== currentClickDamage) {
            battle.clickDamage(currentClickDamage);
            battle.formattedClickDamage(`(${currentClickDamage.toLocaleString()})`);
        }

        let totalSeconds = 0;

        for (const pokemon of battle.pokemonList) {
            let damage = damageCache.get(pokemon.damageKey1) ?? damageCache.get(pokemon.damageKey2);
            if (damage === undefined) {
                const weather = weatherLookup[town.region];
                damage = isMkj
                    ? calcMkjAttack(pokemon.type1, pokemon.type2, weather)
                    : calcAggregatedPartyAttack(pokemon.type1, pokemon.type2, town.region, weather);
                damageCache.set(pokemon.damageKey1, damage);
            }

            const totalDmg = damage + currentClickDamage;

            if (pokemon.partyDamage.peek() !== totalDmg) {
                pokemon.partyDamage(totalDmg);
                pokemon.formattedPartyDamage(totalDmg.toLocaleString());
            }

            const secondsToDefeat = Math.max(1, pokemon.maxHealth / totalDmg);
            if (pokemon.secondsToDefeat.peek() !== secondsToDefeat) {
                pokemon.secondsToDefeat(secondsToDefeat);
                pokemon.formattedSeconds(Math.ceil(secondsToDefeat).toLocaleString());

                const hasRemainder = secondsToDefeat !== Infinity && secondsToDefeat % 1 !== 0;
                pokemon.secondsRemainder(hasRemainder ? secondsToDefeat.toLocaleString() : '-');
            }

            if (totalDmg > 0) {
                totalSeconds += Math.ceil(secondsToDefeat);
            }
        }

        if (totalSeconds === 0) totalSeconds = Infinity;
        if (battle.secondsToWin.peek() !== totalSeconds) {
            battle.secondsToWin(totalSeconds);
            battle.formattedSecondsToWin(totalSeconds.toLocaleString());
        }
    }

    resetBattleSettings();
    regionMultiplierOverride = -1;

    const end = performance.now();
    console.log(`[calcBattleData] ${end - start}ms`);
};

export const runFirstCalc = (): void => {
    loadGymList();
    loadTempBattleList();
    calcBattleData();
    showResult(true);

    if (settings.autoCollapseConfig()) {
        new bootstrap.Collapse(document.getElementById('battleCalcConfigCollapse')!).hide();
    }
};

/* ------------------------------------------------------------------ */
/* Battle time limits                                                 */
/* ------------------------------------------------------------------ */

const timeFluteEnabled = ko.pureComputed(() => settings.activeFlutes().includes(GameConstants.FluteItemType.Time_Flute));

/** Battle time limit in seconds, extended by the Time Flute when it's enabled */
const battleTimeLimit = (baseTime: number) => ko.pureComputed(() => {
    if (!SaveData.isDamageLoaded() || !timeFluteEnabled()) return baseTime / 1000;
    const fluteBonus = (ItemList.Time_Flute.multiplyBy - 1) * (AchievementHandler.achievementBonus() + 1) + 1;
    return Math.ceil(baseTime * fluteBonus / 100) / 10;
});

export const getGymBattleTime = battleTimeLimit(GameConstants.GYM_TIME);
export const getTempBattleTime = battleTimeLimit(GameConstants.TEMP_BATTLE_TIME);

/* ------------------------------------------------------------------ */
/* Battle lists                                                       */
/* ------------------------------------------------------------------ */

const toCalcPokemon = (p: GymPokemon, town: Town): CalcPokemon => {
    const pMap = pokemonMap[p.name];
    const type1 = pMap.type[0];
    const type2 = pMap.type[1] ?? PokemonType.None;

    const suffix = isMagikarpJump(town) ? '|mkj' : '';

    return {
        ...p,
        type1,
        type2,
        damageKey1: `${town.region}|${type1}|${type2}${suffix}`,
        damageKey2: `${town.region}|${type2}|${type1}${suffix}`,
        typeString: pMap.type.map(t => PokemonType[t]).join(' / '),
        formattedMaxHealth: p.maxHealth.toLocaleString(),
        partyDamage: ko.observable(0).extend({ deferred: true }),
        formattedPartyDamage: ko.observable('0').extend({ deferred: true }),
        secondsToDefeat: ko.observable(0).extend({ deferred: true }),
        formattedSeconds: ko.observable('0').extend({ deferred: true }),
        secondsRemainder: ko.observable('').extend({ deferred: true }),
    };
};

/** Adds the calculator's fields to a game Gym or TemporaryBattle */
const initCalcBattle = <T extends Gym | TemporaryBattle>(
    battle: T, town: Town, completed: boolean, battleTime: KnockoutComputed<number>,
): T & CalcBattleFields => {
    const calcBattle = battle as T & CalcBattleFields;
    calcBattle.townObj = town;
    calcBattle.pokemonList = battle.getPokemonList().map((p) => toCalcPokemon(p, town));
    calcBattle.totalHealth = calcBattle.pokemonList.reduce((hp, p) => hp + p.maxHealth, 0);
    calcBattle.formattedTotalHealth = calcBattle.totalHealth.toLocaleString();
    calcBattle.isCompleted = ko.observable(completed).extend({ deferred: true });
    calcBattle.secondsToWin = ko.observable(0).extend({ deferred: true });
    calcBattle.formattedSecondsToWin = ko.observable('0').extend({ deferred: true });
    calcBattle.timeClass = ko.pureComputed<string>(() => calcBattle.secondsToWin() <= battleTime() ? 'text-success' : 'text-danger').extend({ deferred: true });
    calcBattle.clickDamage = ko.observable(0).extend({ deferred: true });
    calcBattle.formattedClickDamage = ko.observable('').extend({ deferred: true });
    return calcBattle;
};

const updateCompleted = (battles: CalcBattle[], isCompleted: (battle: CalcBattle) => boolean) => {
    for (const battle of battles) {
        const completed = isCompleted(battle);
        if (battle.isCompleted.peek() !== completed) battle.isCompleted(completed);
    }
};

let isGymListInitialized = false;
const loadGymList = () => {
    const gymsDefeated = SaveData.current().save.statistics.gymsDefeated;
    const isCompleted = (gym: Gym) => gymsDefeated[GameConstants.getGymIndex(gym.town)] > 0;

    if (isGymListInitialized) {
        updateCompleted(gymList.peek(), (gym) => isCompleted(gym as CalcGym));
        return;
    }

    const list = getRegionGymNames().flatMap(rg => rg.gyms.map(name => {
        const gym = GymList[name];
        const town = TownList[gym.parent?.name ?? gym.town];
        return initCalcBattle(gym, town, isCompleted(gym), getGymBattleTime);
    }));

    gymList(list);
    isGymListInitialized = true;
};

/** Temporary battles that are part of Alola's island trials, which are covered by the gym list */
const excludedTempBattles = new Set(['Captain Mina', 'Captain Ilima', 'Captain Mallow', 'Captain Lana', 'Captain Kiawe', 'Captain Sophocles', 'Kahuna Nanu']);

let isTempBattleListInitialized = false;
const loadTempBattleList = () => {
    const temporaryBattleDefeated = SaveData.current().save.statistics.temporaryBattleDefeated;
    const isCompleted = (tb: TemporaryBattle) => temporaryBattleDefeated[GameConstants.getTemporaryBattlesIndex(tb.name)] > 0;

    if (isTempBattleListInitialized) {
        updateCompleted(tempBattleList.peek(), (tb) => isCompleted(tb as CalcTemporaryBattle));
        return;
    }

    const list = Object.values(TemporaryBattleList)
        .filter(tb => tb.getTown().region <= GameConstants.MAX_AVAILABLE_REGION && !excludedTempBattles.has(tb.name))
        .map(tb => initCalcBattle(tb, tb.getTown(), isCompleted(tb), getTempBattleTime));

    tempBattleList(list);
    isTempBattleListInitialized = true;
};

const isBattleVisible = (battle: CalcBattle, region: GameConstants.Region) => {
    if (!Settings.showAllRegions() && region > player.highestRegion()) return false;
    if (settings.hideLocked() && !battle.isUnlocked()) return false;
    if (settings.hideCompleted() && battle.isCompleted()) return false;
    return true;
};

export const hasVisibleGyms = ko.pureComputed(() => {
    return gymList().some(gym => isBattleVisible(gym, gym.parent.region));
});

export const hasVisibleTempBattles = ko.pureComputed(() => {
    return tempBattleList().some(tb => isBattleVisible(tb, tb.getTown().region));
});

/* ------------------------------------------------------------------ */
/* Settings                                                           */
/* ------------------------------------------------------------------ */

settings.autoCollapseConfig(getStoredFlag('autoCollapseBattleCalcConfig', true));
persistFlag(settings.autoCollapseConfig, 'autoCollapseBattleCalcConfig');

settings.runCalcImmediately(getStoredFlag('runBattleCalcImmediately', true));
persistFlag(settings.runCalcImmediately, 'runBattleCalcImmediately');

// Applied immediately so the click attack shown in the settings reflects the selected flutes
settings.activeFlutes.subscribe(() => setActiveFlutes(settings.activeFlutes()));

bindAllFlutesToggle(settings.allFlutesToggle, settings.activeFlutes);

settings.clicksPerSecond.subscribe((value) => {
    if (isNaN(+value) || +value < 0 || !(value as string)?.length) {
        settings.clicksPerSecond(0);
    }
    if (+value > 20) {
        settings.clicksPerSecond(20);
    }
});

// Recalculate when any setting that affects the results changes
const displayOnlySettings = new Set(['hideCompleted', 'hideLocked', 'allFlutesToggle', 'autoCollapseConfig']);
Object.entries(settings).forEach(([name, setting]) => {
    if (displayOnlySettings.has(name)) return;
    (setting as KnockoutObservable<unknown>).subscribe(() => {
        if (showResult()) {
            calcBattleData();
        }
    });
});

