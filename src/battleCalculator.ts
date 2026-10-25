import { bindAllFlutesToggle, deactivateAllFlutes, setActiveFlutes } from './flutes';
import * as SaveData from './save';
import * as Settings from './settings';
import { calcDamage, getAttackBonus, groupAttackByType, inRegion, typeKey } from './shared/typeDamage';
import { getRegionGymNames } from './statistics';
import { clampNumberInput } from './util';

const { Region, AlolaSubRegions } = GameConstants;

/** Weather setting value that applies each region's current weather */
const CURRENT_REGIONAL_WEATHER = -1;

/** An enemy pokémon, with observables for its calculated results */
interface CalcPokemon extends GymPokemon {
    type1: PokemonType;
    type2: PokemonType;
    /** The packed type combination, used as its damage cache key */
    typeKey: number;
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
    /** Whether the pokémon details are shown. They're only rendered while shown, since rendering every battle's is slow. */
    expanded: KnockoutObservable<boolean>;
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
    // Stored in the browser: autoCollapseConfig, runCalcImmediately
    ...Settings.battleCalculator,
};

const isMagikarpJump = (town: Town): boolean =>
    town.region === Region.alola && town.subRegion === AlolaSubRegions.MagikarpJump;

/* ------------------------------------------------------------------ */
/* Damage calculation                                                 */
/* ------------------------------------------------------------------ */

const calcClickAttack = (region = 0, subRegion = 0): number => {
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

/**
 * Click damage per second shown in the configuration. The settings are only applied to the game while
 * calculating, so this applies them itself, and depends on the settings rather than the game's state.
 */
export const configClickAttack = ko.pureComputed(() => {
    SaveData.isDamageLoaded();
    settings.clicksPerSecond();
    settings.xClickEnabled();
    settings.rockyHelmetEnabled();
    settings.activeFlutes();

    return ko.ignoreDependencies(() => {
        applyBattleSettings();
        const clickAttack = calcClickAttack();
        resetBattleSettings();
        return clickAttack;
    });
});

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

    const party = App.game.party;
    const attackBonus = getAttackBonus();

    // Without the regional attack debuff, a region only affects attack through its weather,
    // so regions with the same weather share their results.
    const regionalDebuff = App.game.challenges.list.regionalAttackDebuff.active();
    const regionGroup: number[] = [];
    const groupKeys: number[] = [];
    /** The first region of each group, used to calculate the group's attack */
    const groupRegions: GameConstants.Region[] = [];
    for (let region = 0; region <= GameConstants.MAX_AVAILABLE_REGION; region++) {
        const key = regionalDebuff ? region : weatherLookup[region];
        let group = groupKeys.indexOf(key);
        if (group === -1) {
            group = groupKeys.push(key) - 1;
            groupRegions.push(region);
        }
        regionGroup[region] = group;
    }

    // Total party attack (before type effectiveness) per region group, summed by the party pokémon's types
    const attackByRegionGroup = groupRegions.map((region) => inRegion(region, () =>
        groupAttackByType(party.caughtPokemon, (pokemon) => party.calculateOnePokemonAttack(
            pokemon, PokemonType.None, PokemonType.None, region, false, true, false, weatherLookup[region], false, true,
        )),
    ));

    // Only Magikarp can battle in Magikarp Jump, so calculate them individually
    const magikarp = party.caughtPokemon.filter(p => Math.floor(p.id) === 129);
    const calcMkjAttack = (eType1: PokemonType, eType2: PokemonType, weather: WeatherType) => {
        let attack = 0;
        for (const karp of magikarp) {
            attack += party.calculateOnePokemonAttack(karp, eType1, eType2, Region.none, true, true, false, weather, false, true);
        }
        return Math.round(attack * attackBonus);
    };

    const clickDamage = calcClickAttack();
    const mkjClickDamage = calcClickAttack(Region.alola, AlolaSubRegions.MagikarpJump);
    // Party damage per type combination, for each region group, and for Magikarp Jump
    const damageCaches = groupRegions.map(() => new Map<number, number>());
    const mkjDamageCache = new Map<number, number>();

    const battles: CalcBattle[] = [...gymList.peek(), ...tempBattleList.peek()];
    for (const battle of battles) {
        const town = battle.townObj;
        const group = regionGroup[town.region];
        const isMkj = isMagikarpJump(town);
        const damageCache = isMkj ? mkjDamageCache : damageCaches[group];
        const currentClickDamage = isMkj ? mkjClickDamage : clickDamage;

        if (battle.clickDamage.peek() !== currentClickDamage) {
            battle.clickDamage(currentClickDamage);
            battle.formattedClickDamage(`(${currentClickDamage.toLocaleString()})`);
        }

        let totalSeconds = 0;

        for (const pokemon of battle.pokemonList) {
            let damage = damageCache.get(pokemon.typeKey);
            if (damage === undefined) {
                damage = isMkj
                    ? calcMkjAttack(pokemon.type1, pokemon.type2, weatherLookup[town.region])
                    : calcDamage(attackByRegionGroup[group], pokemon.typeKey, attackBonus);
                damageCache.set(pokemon.typeKey, damage);
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

const toCalcPokemon = (p: GymPokemon): CalcPokemon => {
    const pMap = pokemonMap[p.name];
    const type1 = pMap.type[0];
    const type2 = pMap.type[1] ?? PokemonType.None;

    return {
        ...p,
        type1,
        type2,
        typeKey: typeKey(type1, type2),
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
    calcBattle.pokemonList = battle.getPokemonList().map(toCalcPokemon);
    calcBattle.totalHealth = calcBattle.pokemonList.reduce((hp, p) => hp + p.maxHealth, 0);
    calcBattle.formattedTotalHealth = calcBattle.totalHealth.toLocaleString();
    calcBattle.isCompleted = ko.observable(completed).extend({ deferred: true });
    calcBattle.expanded = ko.observable(false);
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

bindAllFlutesToggle(settings.allFlutesToggle, settings.activeFlutes);

clampNumberInput(settings.clicksPerSecond, { min: 0, max: 20 });

// Recalculate when any setting that affects the results changes
const displayOnlySettings = new Set(['hideCompleted', 'hideLocked', 'allFlutesToggle', 'autoCollapseConfig', 'runCalcImmediately']);
Object.entries(settings).forEach(([name, setting]) => {
    if (displayOnlySettings.has(name)) return;
    (setting as KnockoutObservable<unknown>).subscribe(() => {
        if (showResult()) {
            calcBattleData();
        }
    });
});

