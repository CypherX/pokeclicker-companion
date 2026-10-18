/** Helpers for toggling flute effects on the game's player for damage calculations */

export const allFlutes: GameConstants.FluteItemType[] = Object.values(GameConstants.FluteItemType);

const isFluteActive = (flute: GameConstants.FluteItemType): boolean => !!player.effectList[flute]();

/** Activates or deactivates a flute without consuming gems or items */
export const setFluteActive = (flute: GameConstants.FluteItemType, active: boolean): void => {
    if (active === isFluteActive(flute)) {
        return;
    }

    if (active) {
        player.itemList[flute](0);
        player.effectList[flute](1);
    } else {
        player.effectList[flute](0);
        player.itemList[flute](1);
    }
    FluteEffectRunner.updateActiveGemTypes();
};

export const setActiveFlutes = (activeFlutes: GameConstants.FluteItemType[]): void => {
    allFlutes.forEach((flute) => setFluteActive(flute, activeFlutes.includes(flute)));
};

export const deactivateAllFlutes = (): void => setActiveFlutes([]);

/** Wires an "all flutes" checkbox to select or clear every flute */
export const bindAllFlutesToggle = (
    allFlutesToggle: KnockoutObservable<boolean>,
    activeFlutes: KnockoutObservableArray<GameConstants.FluteItemType>,
): void => {
    allFlutesToggle.subscribe((value) => activeFlutes(value ? [...allFlutes] : []));
};
