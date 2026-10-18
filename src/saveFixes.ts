import type { SaveData, SaveFile, SavePlayer } from './types/saveFile';
import { downloadFile } from './util';
import { gameVersion } from './version';

interface SaveFix {
    name: string;
    description: string;
    /** Only allow fixing saves from the current game version */
    requireCurrentVersion: boolean;
    /** Modifies the save in place. Returns false (after setting saveFixError) if there was nothing to fix. */
    fixFunction: (playerData: SavePlayer, saveData: SaveData, settingsData: Record<string, any>) => boolean;
}

export const selectedFix = ko.observable<SaveFix | undefined>();
export const selectedFile = ko.observable<File | undefined>();
export const saveFixError = ko.observable<string | undefined>();

/*
 * Fixes are added here when a game bug leaves saves in a broken state, and removed once
 * they are no longer relevant. Example of a previous fix:
 *
 * {
 *     name: 'A New World - Distortion World',
 *     description: 'The A New World quest line is softlocked because Distortion World is unavailable.',
 *     requireCurrentVersion: true,
 *     fixFunction: (playerData, saveData, settingsData) => {
 *         const dungeonIndex = GameConstants.getDungeonIndex('Distortion World');
 *         if (!saveData.statistics.dungeonsCleared[dungeonIndex]) {
 *             saveFixError('Distortion World has not been previously cleared, nothing to fix.');
 *             return false;
 *         }
 *
 *         const questState = saveData.quests.questLines.find(ql => ql.name === 'A New World')?.state ?? 0;
 *         if (questState !== QuestLineState.started) {
 *             saveFixError('Quest line has already been completed or is not started.');
 *             return false;
 *         }
 *
 *         saveData.statistics.dungeonsCleared[dungeonIndex] = 0;
 *         return true;
 *     },
 * },
 */
export const fixList: SaveFix[] = [];

export const canRunFix = ko.pureComputed(() => !!(selectedFix() && selectedFile()));

const readSaveFile = (saveFile: File): Promise<SaveFile | undefined> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                resolve(JSON.parse(atob((reader.result as string).trim())));
            } catch {
                resolve(undefined);
            }
        };
        reader.readAsText(saveFile);
    });
};

export const fixSave = async (): Promise<void> => {
    saveFixError(undefined);

    const saveFile = selectedFile();
    const fix = selectedFix();
    if (!saveFile || !fix) {
        saveFixError('Select a fix to apply and a save file.');
        return;
    }

    const saveData = await readSaveFile(saveFile);
    if (!saveData?.save) {
        saveFixError('That doesn\'t look like a PokéClicker save file.');
        return;
    }

    if (fix.requireCurrentVersion && saveData.save.update.version != gameVersion) {
        saveFixError(`This fix requires a save file from the current version - ${gameVersion}.`);
        return;
    }

    if (fix.fixFunction(saveData.player, saveData.save, saveData.settings)) {
        const data = btoa(JSON.stringify(saveData));
        const fixedFileName = saveFile.name.replace('.txt', '_Fixed.txt');
        downloadFile(data, fixedFileName);
    }
};
