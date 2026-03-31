const file = ko.observable();
const prevLoadedSaves = ko.observableArray();
const isDamageLoaded = ko.observable(false);

const loadFile = (file) => {
    const fileName = file.name;
    const fileReader = new FileReader();
    fileReader.addEventListener('load', () => {
        loadSaveData(atob(fileReader.result), fileName);
    });

    fileReader.readAsText(file);
};

const loadSaveData = (saveString, fileName = null) => {
    if (file() !== undefined) {
        sessionStorage.setItem('fileDataToLoad', saveString);
        location.reload();
        return;
    }

    const saveFile = JSON.parse(saveString);

    if (!saveFile.player || !saveFile.save) {
        return;
    }

    player = new Player(saveFile.player);

    /*if (file() !== undefined) {
        Companion.initGame();
    }*/

    //player.highestRegion(saveFile.player.highestRegion);
    //player.trainerId = saveFile.player.trainerId;

    App.game.challenges.list.slowEVs.active(saveFile.save.challenges.list.slowEVs);
    Settings.setSettingByName('breedingEfficiencyAllModifiers', false);

    Enigma.revealHintsCounter(0);
    VitaminTracker.highestRegion(player.highestRegion());
    Companion.typeDamageDistribution(undefined);
    //BattleCalculator.showData(false);
    BattleFrontierSim.simulationResult(null);
    isDamageLoaded(false);

    file(saveFile);

    /*if (fileName) {
        const prevDataIndex = prevLoadedSaves().findIndex((save) => save.name == fileName);
        if (prevDataIndex > 0) {
            prevLoadedSaves.unshift(prevLoadedSaves.splice(prevDataIndex, 1)[0]);
        } else if (prevDataIndex == -1) {
            const compressed = Util.compressString(saveString);
            const arr = prevLoadedSaves();
            arr.unshift({ name: fileName, data: compressed });
            arr.length = Math.min(arr.length, 5);
            prevLoadedSaves(arr);
        }
    }*/

    if (!saveFile.save.party.caughtPokemon?.length) {
        Util.notify({
            message: 'Why don\'t you come back after catching some pokémon? Not a very good trainer, this one.',
            type: 'danger',
            timeout: 30000
        });
    }

    const monoType = getMonoType(saveFile.save.party.caughtPokemon);
    if (monoType) {
        Util.notify({
            message: `Haha, look, they only have ${monoType.map(t => PokemonType[t]).join('/')} pokémon!`,
            type: 'danger',
            timeout: 30000
        });
    }

    if (saveFile.save.profile.name.toLowerCase() == 'bailey') {
        let msg;
        if (Rand.intBetween(1, 20) == 1) {
            msg = 'Ȟ̷̨̠͈͖̲̠͍͓̊͂̐e̵͈͖̮̼̼͚͍̳̠̖̺͚̓͝ĺ̷̢̧̧̻̫͚̒l̴̛̲̼͒̽́͒̆̑͑̃̌̎o̸̡̘̞̝̭̙̠̰͋̆̚.̵̡̛̹͙̤̺̳̱͚̹̏͌̓̓̌̿̊̒́͂̂̊͂̚ ̵̨̨̖̭̞̰͖̞̮͚̺̟̰̔B̴̢̰̳͓̬̤̯̬͍̙͎̟͉͓̙̓̈́̓̽͑̍̓̂͑́͘͘a̵̛̭̬͎̪̔͋͌̀͂̏i̷̱͉̪͖̫͇̮͔̯͆̄̔͋͂ḽ̵̳͕͆̎̈́ę̶̛͕̘͎̮̯͙̱͔̙͓͉̿̽̍͂̋̇̏̐̈̽͜y̷̡̟̦̓̍͐̓̆̀̍̂̕.̶̤͖͚̅̅̒̔͘͘ ̴̧̤͔̜̪̦͇̿̀̋͒̾̋͋̚W̸̨̜͍̲̖̱̯̖͇̣̩̉̏͘͘͘͜͝͝e̴̛̩͈̥̻̺̝̲̹͂̈́̉͆̀̀͊́͐.̶̢̱͙̱̱͈͖̳̫̝͇̰̐̏̀̂̎̇͋͛͛̇̉͐́̚̕ͅͅ ̸̙̩̥͕̪̖̅̆̓̏̕͝͝͝ͅS̸̙͈̺͙̟͓̠̼͍͖̭͇͂̍̊͂̎̃̂͜e̸̟͊́̈́͆̉̽̎̔̈̊̔̑̕̕̚e̷̛̯̼̱͐͊͒̈́́̽͐̏̉̔.̴̧̛̉̈̊͛͐ ̶̨͕̗̱̙͚̗̩͉̖̥͈̠̬̑̉̀Ỹ̷̡͖̪̝̦͈̲͘͝o̵̢͍̗͍̱̪̮̊͛͛͋̂̆̔̒͊́̈͂̾̋ͅû̶̹̳̽͌̊̌̓̑͝.̶̡̢̹̤͚͚̟͇͕͖̦̠̪͆̍̈̉̉̈́͆̑̎̆͘̚͝ ̶̙͈͋̾͊̆̒̌͐̂Ŵ̸̧̺̗̥̲͈̳̟̜͚̜͚̏̽͗̊̾̐̿̉͝ȩ̵̼̪͎͉͇͙̭͎̻͈͗̈́͂̓̈́̒̃̈̔̋̉̂̈̕ͅ.̷̤͔͕̎̎̐̂͆̈́̀ ̸̢̧̻̗̯̥͓̥͕̱̖̬̲̅́̒͌̿̎̔͌̈͌̀͠͠ͅͅÂ̸̛̛̖͕̱̫̲̞̯̫͉͖̻̳͂̂̅̈́̑̓́͐̈̀r̷̢̗̳̗̤͔͓̻̳̳̠̳̬̩̞̆̎̾̈́͋̊̕͝e̴͓͇͙̬͔̼͔͇̋̋̐̐̽͐̈́͘̚.̸͍̞̼͈̖̩̮̹̈́̊̄͠ ̴͓͔̬̟̈́̈W̵͍͍̼̜̤͔̭̻̞̫̹̎̇̿́̀͘ͅa̷̡̡̨̩̙͍͖̜̍̾̈́͊̽̂͂͜t̵̟͚͙͇̫͚̠̭͈̣̘̫͆͒̑͊̀͒̆̉́͑͋̊̕͘ͅç̶̮͉͍̫̋̅̅̓͑͠ḩ̷͕̟̠̩̼̼͓̜̳̦͝ĭ̵̧̢̨̼͓̩͈̮͖͖͓̰͕̈́̈́͂̋̅̐̍̔̎̀́̕n̸̛͚͕̝̐́̿͌͂̊͛̓̂̓̓͑͋͝g̸̞̠̭͖̯̲͕̫̗͖͔͙̀̿̇͜.̸̨̡̢̱͖͙̰͍͙̟͈͓̪͙͊̓̆̃́̀̀̈́';
        } else {
            const hour = (new Date()).getHours();
            if (hour < 5) {
                msg = 'Bailey! What are you still doing up!? GO TO BED!';
            } else if (hour < 12) {
                msg = 'Good morning, Bailey! Did you sleep well?';
            } else if (hour < 18) {
                msg = 'Good afternoon, Bailey! We missed you. Enjoy your stay.';
            } else if (hour < 22) {
                msg = 'Good evening, Bailey. How was your day?';
            } else {
                msg = 'Hello, Bailey. It\'s getting kind of late, perhaps consider retiring to bed soon?';
            }
        }
        if (msg) {
            Util.notify({
                message: msg,
                type: 'danger',
                timeout: 30000
            });
        }
    }
};

const getMonoType = (party) => {
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

const loadPreviousFile = (index) => {
    const file = prevLoadedSaves()[index];
    if (file) {
        const decompressed = Util.decompressString(file.data);
        loadSaveData(decompressed, file.name);
    }
};

const isLoaded = ko.pureComputed(() => {
    return file() !== undefined;
});

const isOlderVersion = ko.pureComputed(() => {
    const saveVersion = file()?.save.update.version;
    return saveVersion && saveVersion != Companion.package.version;
});

const initialize = () => {
    /*const prevSaves = localStorage.getItem('prevLoadedSaves');
    if (prevSaves) {
        prevLoadedSaves(JSON.parse(prevSaves));
    }

    prevLoadedSaves.subscribe((value) => {
        localStorage.setItem('prevLoadedSaves', JSON.stringify(value));
    });*/

    localStorage.removeItem('prevLoadedSaves');

    const fileDataToLoad = sessionStorage.getItem('fileDataToLoad');
    if (fileDataToLoad) {
        sessionStorage.removeItem('fileDataToLoad');
        loadSaveData(fileDataToLoad);
    }
};

const loadAttackData = () => {
    if (!isLoaded() || isDamageLoaded()) {
        return;
    }

    // Clear Achievement multiplier bonuses
    Object.values(App.game.multiplier.multipliers).forEach((multiplier) => {
        const index = multiplier.findIndex(b => b.source == 'Achievements');
        if (index > -1) {
            multiplier.splice(index, 1);
        }
    });

    // Init Achievements
    AchievementHandler.achievementList = [];
    AchievementHandler.initialize(App.game.multiplier, App.game.challenges);

    // Disable Battle Items & Flutes for Battle Calculator & BF Simulator
    player.effectList['xAttack'](0);
    player.effectList['xClick'](0);

    GameHelper.enumStrings(GameConstants.FluteItemType).forEach((flute) => {
        player.effectList[flute](0);
        player.itemList[flute](1);
    });

    // Init Battle Item & Flute effect runners
    EffectEngineRunner.initialize(App.game.multiplier, GameHelper.enumStrings(GameConstants.BattleItemType).map((name) => ItemList[name]));
    FluteEffectRunner.initialize(App.game.multiplier);

    // Load remaining data from save file to calculate true damage
    //const thingsToLoad = ['breeding', 'keyItems', 'badgeCase', 'oakItems', 'party', 'gems', 'farming', 'statistics', 'quests', 'challenges', 'multiplier', 'underground'];
    //Object.keys(App.game).filter(key => thingsToLoad.includes(key)).filter(key => App.game[key]?.saveKey).forEach(key => {
    Object.keys(App.game).filter(key => App.game[key]?.saveKey).forEach(key => {
        const saveKey = App.game[key].saveKey;
        App.game[key].fromJSON(SaveData.file().save[saveKey]);
    });

    AchievementHandler.fromJSON(SaveData.file().save.achievements);

    // Calc Achievement Bonus & minor optimization to not re-check achievement requirements
    AchievementHandler.preCheckAchievements();
    AchievementHandler.calculateMaxBonus();

    AchievementHandler.achievementList.forEach(a => {
        if (a.unlocked()) {
            a.isCompleted = () => true;
        } else {
            a.isCompleted = () => false;
        }
    });

    //const bonus = AchievementHandler.achievementBonus();
    //AchievementHandler.achievementBonus = () => bonus;

    // Set all pokemon to max level and reset breeding flag to include all pokemon
    // at their max power in attack calculations
    const maxLevel = App.game.badgeCase.maxLevel();
    App.game.party.caughtPokemon.forEach(p => {
        p.level = maxLevel;
        p.breeding = false;
    });

    // Reset some settings, need to handle this better
    /*BattleCalculator.settings.xAttackEnabled(false);
    BattleCalculator.settings.xClickEnabled(false);
    BattleCalculator.settings.rockyHelmetEnabled(false);
    BattleCalculator.settings.clicksPerSecond(0);
    BattleCalculator.settings.activeFlutes([]);
    BattleCalculator.settings.allFlutesToggle(false);*/

    isDamageLoaded(true);
};

module.exports = {
    file,
    prevLoadedSaves,

    loadFile,
    loadSaveData,
    loadPreviousFile,
    loadAttackData,

    isLoaded,
    isOlderVersion,
    getMonoType,

    initialize,
    isDamageLoaded,
}