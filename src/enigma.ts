import * as SaveData from './save';

export const revealHintsCounter = ko.observable(0);
export const revealHints = ko.pureComputed(() => revealHintsCounter() > 4);

const buttonTextList = [
    'Reveal Required Berries (may result in being judged)',
    'Are you SURE!?',
    'No, really, are you ABSOLUTELY SURE??',
    'Just get the hints normally, man.',
    'Fine. Have it your way >:(',
];

export const buttonText = ko.pureComputed(() => buttonTextList[revealHintsCounter()] || '...');

export const revealHintsButtonClick = (): void => revealHintsCounter(revealHintsCounter() + 1);

interface EnigmaHint {
    direction: string;
    berry: string | undefined;
}

/** The Enigma berry mutation requirements, shown once the player has seen the hint (or insists) */
export const getBerries = ko.pureComputed((): EnigmaHint[] => {
    const berries: EnigmaHint[] = ['North', 'West', 'East', 'South'].map(d => ({ direction: d, berry: undefined }));
    if (!SaveData.isLoaded()) {
        return berries;
    }

    const enigmaMutationIdx = App.game.farming.mutations.findIndex(m => m.mutatedBerry == BerryType.Enigma);
    const enigmaMutation = SaveData.current().save.farming.mutations[enigmaMutationIdx];
    const hintsSeen = (Array.isArray(enigmaMutation) ? enigmaMutation : enigmaMutation?.seen) ?? [];

    for (let i = 0; i < berries.length; i++) {
        if (hintsSeen[i] || revealHints()) {
            berries[i].berry = BerryType[EnigmaMutation.getReqs()[i]];
        }
    }

    return berries;
});
