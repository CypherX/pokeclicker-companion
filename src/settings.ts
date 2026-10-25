/**
 * The user's settings that are stored in the browser, grouped by where they're used. Each is
 * restored when it's created, so it has the stored value from the first render.
 */

const DEFAULT_TAB = 'tab-my-save';

/** A boolean stored as "0"/"1" under the given key */
const storedFlag = (key: string, defaultValue = false): KnockoutObservable<boolean> => {
    const value = localStorage.getItem(key);
    const setting = ko.observable(value === null ? defaultValue : !!+value);
    setting.subscribe((v) => localStorage.setItem(key, `${+v}`));
    return setting;
};

/** A string stored under the given key */
const storedString = (key: string, defaultValue: string): KnockoutObservable<string> => {
    const setting = ko.observable(localStorage.getItem(key) ?? defaultValue);
    setting.subscribe((v) => localStorage.setItem(key, v));
    return setting;
};

/* General, set in the settings modal */

export const showRequiredOnly = storedFlag('showRequiredOnly');
export const showAllRegions = storedFlag('showAllRegions');
/** The id of the main navigation tab to open on load */
export const defaultTab = storedString('defaultTab', DEFAULT_TAB);

/* Feature settings */

export const vitaminTracker = {
    hidePokemonOptimalVitamins: storedFlag('hidePokemonOptimalVitamins'),
    hideUncaughtPokemon: storedFlag('hideUncaughtPokemon'),
    hideShinyPokemon: storedFlag('hideShinyPokemon'),
};

export const battleCalculator = {
    autoCollapseConfig: storedFlag('autoCollapseBattleCalcConfig', true),
    runCalcImmediately: storedFlag('runBattleCalcImmediately', true),
};

export const typeDamage = {
    /** A key of the type damage heatmap color themes */
    colorTheme: storedString('typeDamageColorTheme', 'viridis'),
};

/** Opens the default tab, unless the URL links to a tab */
export const initialize = (): void => {
    const tabElement = document.getElementById(defaultTab());
    if (!tabElement) {
        // The tab no longer exists
        defaultTab(DEFAULT_TAB);
        return;
    }

    if (!window.location.hash.includes('#!')) {
        new bootstrap.Tab(tabElement).show();
    }
};
