const selectedFix = ko.observable();
const selectedFile = ko.observable();
const saveFixError = ko.observable();

const fixList = [
    {
        name: 'v0.10.20 Game Stuck Loading',
        description: 'After selecting a save file the game never loads',
        requireCurrentVersion: true,
        fixFunction: (playerData, saveData, settingsData) => {
            if (settingsData.vitaminRegionFilter !== undefined) {
                settingsData.vitaminRegionFilter = -2;
            }

            if (settingsData.consumableRegionFilter !== undefined) {
                settingsData.consumableRegionFilter = -2;
            }

            if (settingsData.heldItemRegionFilter !== undefined) {
                settingsData.heldItemRegionFilter = -2;
            }

            return true;
        }
    },
    /*{
        name: 'Anomaly Mewtwo - Castelia City',
        description: 'Anomaly Mewtwo missing from Castelia City for the An Unrivaled Power quest line.',
        requireCurrentVersion: true,
        fixFunction: (playerData, saveData, settingsData) => {
            const tempBattleIndex = GameConstants.getTemporaryBattlesIndex('Anomaly Mewtwo 5');
            if (!saveData.statistics.temporaryBattleDefeated[tempBattleIndex]) {
                saveFixError('Battle is not marked as completed, nothing to fix.');
                return false;
            }

            const questState = saveData.quests.questLines.find(ql => ql.name === 'An Unrivaled Power')?.state ?? 0;
            if (questState === QuestLineState.ended) {
                saveFixError('Quest line has already been completed.');
                return false;
            }

            saveData.statistics.temporaryBattleDefeated[tempBattleIndex] = 0;
            return true;
        }
    },
    {
        name: 'A New World - Distortion World',
        description: 'The A New World quest line is softlocked because Distortion World is unavailable.',
        requireCurrentVersion: true,
        fixFunction: (playerData, saveData, settingsData) => {
            const dungeonIndex = GameConstants.getDungeonIndex('Distortion World');
            if (!saveData.statistics.dungeonsCleared[dungeonIndex]) {
                saveFixError('Distortion World has not been previously cleared, nothing to fix.');
                return false;
            }

            const questState = saveData.quests.questLines.find(ql => ql.name === 'A New World')?.state ?? 0;
            if (questState !== QuestLineState.started) {
                saveFixError('Quest line has already been completed or is not started.');
                return false;
            }

            saveData.statistics.dungeonsCleared[dungeonIndex] = 0;
            return true;
        }
    },*/
];

const canRunFix = ko.pureComputed(() => {
    return selectedFix() && selectedFile();
});

const fixSave = async () => {
    saveFixError(undefined);

    if (!canRunFix()) {
        saveFixError('Select a fix to apply and a save file.');
        return;
    }

    const file = selectedFile();
    const saveData = await loadFile(file);
    const fix = selectedFix();

    if (fix.requireCurrentVersion) {
        const saveVersion = saveData.save.update.version;
        if (saveVersion != Companion.package.version) {
            saveFixError(`This fix requires a save file from the current version - ${Companion.package.version}.`);
            return;
        }
    }

    if (fix.fixFunction(saveData.player, saveData.save, saveData.settings)) {
        const data = btoa(JSON.stringify(saveData));
        const fixedFileName = file.name.replace('.txt', '_Fixed.txt');
        Util.downloadFile(data, fixedFileName);
    }
};

const loadFile = (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = JSON.parse(atob(e.target.result));
            resolve(content);
        };
        reader.readAsText(file);
    });
}

module.exports = {
    selectedFix,
    selectedFile,
    saveFixError,
    fixList,

    canRunFix,
    fixSave,
};