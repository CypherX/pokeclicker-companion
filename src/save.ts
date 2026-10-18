import { gameVersion } from './version';
import { notify } from './util';
import * as VitaminTracker from './vitaminTracker';
import type { SaveFile, SavedPartyPokemon } from './types/saveFile';

export const file = ko.observable<SaveFile | undefined>();
export const isDamageLoaded = ko.observable(false);

export const isLoaded = ko.pureComputed(() => file() !== undefined);

export const isOlderVersion = ko.pureComputed(() => {
    const saveVersion = file()?.save.update.version;
    return !!saveVersion && saveVersion != gameVersion;
});

/** The currently loaded save. Only call once a save is known to be loaded. */
export const current = (): SaveFile => file()!;

/** Berry counts by BerryType. Older saves call this berryList. */
export const getBerryInventory = (): number[] => {
    const farming = current().save.farming;
    return (farming.berryInventory ?? farming.berryList)!;
};

export const loadFile = (saveFile: File): void => {
    const fileReader = new FileReader();
    fileReader.addEventListener('load', () => {
        loadEncodedSave(fileReader.result as string);
    });

    fileReader.readAsText(saveFile);
};

const parseSave = (saveString: string): SaveFile | undefined => {
    try {
        const saveFile = JSON.parse(saveString);
        return saveFile?.player && saveFile?.save ? saveFile : undefined;
    } catch {
        return undefined;
    }
};

const notifyInvalidSave = () => notify({
    message: 'That doesn\'t look like a PokéClicker save file.',
    type: 'danger',
});

/**
 * Loads a save in the game's export format (base64 encoded JSON), as found in save files
 * and the clipboard. Returns whether it was a valid save.
 */
export const loadEncodedSave = (encoded: string): boolean => {
    let decoded: string;
    try {
        decoded = atob(encoded.trim());
    } catch {
        notifyInvalidSave();
        return false;
    }
    return loadSaveData(decoded);
};

/** Loads a decoded save (JSON). Returns whether it was a valid save. */
export const loadSaveData = (saveString: string): boolean => {
    const saveFile = parseSave(saveString);
    if (!saveFile) {
        notifyInvalidSave();
        return false;
    }

    // The game state can't be reset cleanly, so a second save is loaded after a reload
    if (file() !== undefined) {
        sessionStorage.setItem('fileDataToLoad', saveString);
        location.reload();
        return true;
    }

    player = new Player(saveFile.player);

    App.game.challenges.list.slowEVs.active(saveFile.save.challenges.list.slowEVs);
    Settings.setSettingByName('breedingEfficiencyAllModifiers', false);

    VitaminTracker.highestRegion(player.highestRegion());

    file(saveFile);

    showLoadMessages(saveFile);
    return true;
};

const showLoadMessages = (saveFile: SaveFile) => {
    const caughtPokemon = saveFile.save.party.caughtPokemon;

    if (!caughtPokemon?.length) {
        notify({
            message: 'Why don\'t you come back after catching some pokémon? Not a very good trainer, this one.',
            type: 'danger',
            timeout: 30000,
        });
    }

    const monoType = getMonoType(caughtPokemon);
    if (monoType) {
        notify({
            message: `Haha, look, they only have ${monoType.map(t => PokemonType[t]).join('/')} pokémon!`,
            type: 'danger',
            timeout: 30000,
        });
    }

    if (saveFile.save.profile.name.toLowerCase() == 'bailey') {
        notify({
            message: getBaileyGreeting(),
            type: 'danger',
            timeout: 30000,
        });
    }
};

const getBaileyGreeting = (): string => {
    if (Rand.intBetween(1, 20) == 1) {
        return 'Ȟ̷̨̠͈͖̲̠͍͓̊͂̐e̵͈͖̮̼̼͚͍̳̠̖̺͚̓͝ĺ̷̢̧̧̻̫͚̒l̴̛̲̼͒̽́͒̆̑͑̃̌̎o̸̡̘̞̝̭̙̠̰͋̆̚.̵̡̛̹͙̤̺̳̱͚̹̏͌̓̓̌̿̊̒́͂̂̊͂̚ ̵̨̨̖̭̞̰͖̞̮͚̺̟̰̔B̴̢̰̳͓̬̤̯̬͍̙͎̟͉͓̙̓̈́̓̽͑̍̓̂͑́͘͘a̵̛̭̬͎̪̔͋͌̀͂̏i̷̱͉̪͖̫͇̮͔̯͆̄̔͋͂ḽ̵̳͕͆̎̈́ę̶̛͕̘͎̮̯͙̱͔̙͓͉̿̽̍͂̋̇̏̐̈̽͜y̷̡̟̦̓̍͐̓̆̀̍̂̕.̶̤͖͚̅̅̒̔͘͘ ̴̧̤͔̜̪̦͇̿̀̋͒̾̋͋̚W̸̨̜͍̲̖̱̯̖͇̣̩̉̏͘͘͘͜͝͝e̴̛̩͈̥̻̺̝̲̹͂̈́̉͆̀̀͊́͐.̶̢̱͙̱̱͈͖̳̫̝͇̰̐̏̀̂̎̇͋͛͛̇̉͐́̚̕ͅͅ ̸̙̩̥͕̪̖̅̆̓̏̕͝͝͝ͅS̸̙͈̺͙̟͓̠̼͍͖̭͇͂̍̊͂̎̃̂͜e̸̟͊́̈́͆̉̽̎̔̈̊̔̑̕̕̚e̷̛̯̼̱͐͊͒̈́́̽͐̏̉̔.̴̧̛̉̈̊͛͐ ̶̨͕̗̱̙͚̗̩͉̖̥͈̠̬̑̉̀Ỹ̷̡͖̪̝̦͈̲͘͝o̵̢͍̗͍̱̪̮̊͛͛͋̂̆̔̒͊́̈͂̾̋ͅû̶̹̳̽͌̊̌̓̑͝.̶̡̢̹̤͚͚̟͇͕͖̦̠̪͆̍̈̉̉̈́͆̑̎̆͘̚͝ ̶̙͈͋̾͊̆̒̌͐̂Ŵ̸̧̺̗̥̲͈̳̟̜͚̜͚̏̽͗̊̾̐̿̉͝ȩ̵̼̪͎͉͇͙̭͎̻͈͗̈́͂̓̈́̒̃̈̔̋̉̂̈̕ͅ.̷̤͔͕̎̎̐̂͆̈́̀ ̸̢̧̻̗̯̥͓̥͕̱̖̬̲̅́̒͌̿̎̔͌̈͌̀͠͠ͅͅÂ̸̛̛̖͕̱̫̲̞̯̫͉͖̻̳͂̂̅̈́̑̓́͐̈̀r̷̢̗̳̗̤͔͓̻̳̳̠̳̬̩̞̆̎̾̈́͋̊̕͝e̴͓͇͙̬͔̼͔͇̋̋̐̐̽͐̈́͘̚.̸͍̞̼͈̖̩̮̹̈́̊̄͠ ̴͓͔̬̟̈́̈W̵͍͍̼̜̤͔̭̻̞̫̹̎̇̿́̀͘ͅa̷̡̡̨̩̙͍͖̜̍̾̈́͊̽̂͂͜t̵̟͚͙͇̫͚̠̭͈̣̘̫͆͒̑͊̀͒̆̉́͑͋̊̕͘ͅç̶̮͉͍̫̋̅̅̓͑͠ḩ̷͕̟̠̩̼̼͓̜̳̦͝ĭ̵̧̢̨̼͓̩͈̮͖͖͓̰͕̈́̈́͂̋̅̐̍̔̎̀́̕n̸̛͚͕̝̐́̿͌͂̊͛̓̂̓̓͑͋͝g̸̞̠̭͖̯̲͕̫̗͖͔͙̀̿̇͜.̸̨̡̢̱͖͙̰͍͙̟͈͓̪͙͊̓̆̃́̀̀̈́';
    }

    const hour = (new Date()).getHours();
    if (hour < 5) {
        return 'Bailey! What are you still doing up!? GO TO BED!';
    } else if (hour < 12) {
        return 'Good morning, Bailey! Did you sleep well?';
    } else if (hour < 18) {
        return 'Good afternoon, Bailey! We missed you. Enjoy your stay.';
    } else if (hour < 22) {
        return 'Good evening, Bailey. How was your day?';
    }
    return 'Hello, Bailey. It\'s getting kind of late, perhaps consider retiring to bed soon?';
};

/** The types shared by every pokémon in the party, if there are any */
export const getMonoType = (party: SavedPartyPokemon[] | undefined): PokemonType[] | undefined => {
    if (!party?.length) {
        return undefined;
    }

    let types = pokemonMap[party[0].id].type;
    for (let i = 1; i < party.length; i++) {
        const ptypes = pokemonMap[party[i].id].type;
        types = types.filter(t => ptypes.includes(t));
        if (!types.length) {
            return undefined;
        }
    }

    return types;
};

export const initialize = (): void => {
    // Previously loaded saves are no longer stored
    localStorage.removeItem('prevLoadedSaves');

    const fileDataToLoad = sessionStorage.getItem('fileDataToLoad');
    if (fileDataToLoad) {
        sessionStorage.removeItem('fileDataToLoad');
        loadSaveData(fileDataToLoad);
    }
};

/** Large per-pokémon statistics that aren't needed for damage calculations and are slow to load */
const excludedStatistics = new Set([
    'pokemonCaptured',
    'pokemonDefeated',
    'pokemonEncountered',
    'pokemonHatched',
    'pokemonSeen',
    'shadowPokemonCaptured',
    'shadowPokemonDefeated',
    'shinyPokemonCaptured',
    'shinyPokemonDefeated',
    'shinyPokemonEncountered',
    'shinyPokemonHatched',
]);

const excludedSaveKeys = new Set(['PurifyChamber']);

/**
 * Loads the rest of the save into the game instance so the game's own attack calculations
 * reflect the player's party, achievements, items, etc. Only runs once per save.
 */
export const loadAttackData = (): void => {
    if (!isLoaded() || isDamageLoaded()) {
        return;
    }

    const start = performance.now();

    const currentSave = file()?.save;
    if (!currentSave) return;

    // Clear Achievement multiplier bonuses
    Object.values(App.game.multiplier.multipliers).forEach((multiplier) => {
        const index = multiplier.findIndex(b => b.source === 'Achievements');
        if (index > -1) {
            multiplier.splice(index, 1);
        }
    });

    // Init Achievements
    AchievementHandler.achievementList = [];
    AchievementHandler.initialize(App.game.multiplier, App.game.challenges);

    // Disable Battle Items & Flutes
    player.effectList['xAttack'](0);
    player.effectList['xClick'](0);

    GameHelper.enumStrings(GameConstants.FluteItemType).forEach((flute) => {
        player.effectList[flute](0);
        player.itemList[flute](1);
    });

    // Init Battle Item & Flute effect runners
    const battleItems = GameHelper.enumStrings(GameConstants.BattleItemType).map((name) => ItemList[name]);
    EffectEngineRunner.initialize(App.game.multiplier, battleItems);
    FluteEffectRunner.initialize(App.game.multiplier);

    // Load remaining data from save file to calculate true damage
    for (const key in App.game) {
        const saveKey: string | undefined = App.game[key]?.saveKey;
        if (saveKey && currentSave[saveKey] && !excludedSaveKeys.has(saveKey)) {
            let data = currentSave[saveKey];

            if (saveKey === 'statistics') {
                data = Object.fromEntries(
                    Object.entries(data).filter(([statistic]) => !excludedStatistics.has(statistic)),
                );
            }

            App.game[key].fromJSON(data);
        }
    }

    AchievementHandler.fromJSON(currentSave.achievements);

    // Calc Achievement Bonus
    AchievementHandler.preCheckAchievements();
    AchievementHandler.calculateMaxBonus();
    AchievementHandler.achievementList.forEach(a => {
        const isUnlocked = a.unlocked();
        a.isCompleted = () => isUnlocked;
    });

    // Set all pokemon to max level and reset breeding flag
    const maxLevel = App.game.badgeCase.maxLevel();
    App.game.party.caughtPokemon.forEach(p => {
        p.level = maxLevel;
        p.breeding = false;
    });

    const end = performance.now();
    console.log(`[loadAttackData] ${end - start}ms`);

    isDamageLoaded(true);
};
