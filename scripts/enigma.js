const revealHintsCounter = ko.observable(0);
const revealHints = ko.pureComputed(() => revealHintsCounter() > 4);

const buttonTextList = [
    'Reveal Required Berries (may result in being judged)',
    'Are you SURE!?',
    'No, really, are you ABSOLUTELY SURE??',
    'Just get the hints normally, man.',
    'Fine. Have it your way >:(',
];

const buttonText = ko.pureComputed(() => buttonTextList[revealHintsCounter()] || '...');

const revealHintsButtonClick = () => revealHintsCounter(revealHintsCounter() + 1);

const getBerries = ko.pureComputed(() => {
    const berries = ['North', 'West', 'East', 'South'].map(d => ({ direction: d, berry: undefined }));
    if (!SaveData.isLoaded()) {
        return berries;
    }

    const enigmaMutationIdx = App.game.farming.mutations.findIndex(m => m.mutatedBerry == BerryType.Enigma);
    const hintsSeen = SaveData.file().save.farming.mutations[enigmaMutationIdx];

    for (let i = 0; i < berries.length; i++) {
        if (hintsSeen[i] || revealHints()) {
            berries[i].berry = BerryType[EnigmaMutation.getReqs()[i]];
        }
    }

    return berries;
});

module.exports = {
    revealHintsCounter,
    revealHints,
    buttonText,
    revealHintsButtonClick,
    getBerries,
};