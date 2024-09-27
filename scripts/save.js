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

const loadSaveData = (saveString, fileName) => {
    const saveFile = JSON.parse(saveString);

    if (file() !== undefined) {
        Companion.initGame();
    }

    player.highestRegion(saveFile.player.highestRegion);
    player.trainerId = saveFile.player.trainerId;
    App.game.challenges.list.slowEVs.active(saveFile.save.challenges.list.slowEVs);

    Enigma.revealHintsCounter(0);
    VitaminTracker.highestRegion(player.highestRegion());
    Companion.typeDamageDistribution(undefined);
    isDamageLoaded(false);

    file(saveFile);

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

    bananaCheck(saveFile);
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

const bananaCheck = (saveData) => {
    let banana = 0;

    // If Discord ID is invalid
    if (saveData.save?.discord?.ID && saveData.save?.discord?.ID.length < 17) {
        banana++;
    }

    // Check if the player has more than 3 oak items active
    if (Object.values(saveData.save?.oakItems || {}).filter(i => i.isActive).length > 3) {
        banana++;
    }

    // If more than 10 billion of any ball type
    if (Math.max(...saveData.save?.pokeballs?.pokeballs || []) > 1e10) {
        banana++;
    }

    // More Master balls total than obtained
    const masterballsObtained = saveData.save?.statistics?.pokeballsObtained?.[GameConstants.Pokeball.Masterball] || 0;
    const masterballsTotal = (saveData.save?.pokeballs?.pokeballs?.[GameConstants.Pokeball.Masterball] || 0) + (saveData.save?.statistics.pokeballsUsed?.[GameConstants.Pokeball.Masterball] || 0);
    // give leeway for x masterballs
    if (masterballsTotal > (masterballsObtained + 500)) {
        banana++;
    }

    // More gems than gems gained
    const gemsCheck = saveData.save?.statistics?.gemsGained?.some((v, i) => (saveData.save?.gems?.gemWallet?.[i] || 0) > v);
    if (gemsCheck) {
        banana++;
    }

    if (banana > 0) {
        Util.notify({
            message: '🍌'.repeat(banana),
            type: 'primary',
            timeout: 15000
        });
    }
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
    const prevSaves = localStorage.getItem('prevLoadedSaves');
    if (prevSaves) {
        prevLoadedSaves(JSON.parse(prevSaves));
    }

    prevLoadedSaves.subscribe((value) => {
        localStorage.setItem('prevLoadedSaves', JSON.stringify(value));
    });
};

const origAchievementBonus = AchievementHandler.achievementBonus;
const loadAttackData = () => {
    if (!isLoaded() || isDamageLoaded()) {
        return;
    }

    AchievementHandler.achievementList = [];
    AchievementHandler.achievementBonus = origAchievementBonus;
    AchievementHandler.initialize(App.game.multiplier, App.game.challenges);

    // load starters
    player.regionStarters = [];
    const savedPlayer = SaveData.file().player;
    for (let i = 0; i <= GameConstants.MAX_AVAILABLE_REGION; i++) {
        if (savedPlayer.regionStarters && savedPlayer.regionStarters[i] != undefined) {
            player.regionStarters.push(ko.observable(savedPlayer.regionStarters[i]));
        } else if (i < (savedPlayer.highestRegion ?? 0)) {
            player.regionStarters.push(ko.observable(GameConstants.Starter.Grass));
        } else if (i == (savedPlayer.highestRegion ?? 0)) {
            player.regionStarters.push(ko.observable(GameConstants.Starter.None));
        } else {
            this.regionStarters.push(ko.observable(GameConstants.Starter.None));
        }
    }

    player.effectList = Save.initializeEffects(SaveData.file().player.effectList);
    const itemList = SaveData.file().player._itemList;
    player.itemList = Save.initializeItemlist();
    if (itemList) {
        for (const key in itemList) {
            if (player.itemList[key]) {
                player.itemList[key](itemList[key]);
            }
        }
    }

    GameHelper.enumStrings(GameConstants.FluteItemType).forEach((flute) => {
        player.effectList[flute](0);
        player.itemList[flute](1);
    })

    EffectEngineRunner.initialize(App.game.multiplier, GameHelper.enumStrings(GameConstants.BattleItemType).map((name) => ItemList[name]));
    FluteEffectRunner.initialize(App.game.multiplier);

    // everything we need to load to calculate true damage
    const thingsToLoad = ['breeding', 'keyItems', 'badgeCase', 'oakItems', 'party', 'gems', 'farming', 'statistics', 'quests', 'challenges', 'multiplier'];

    Object.keys(App.game).filter(key => thingsToLoad.includes(key)).filter(key => App.game[key]?.saveKey).forEach(key => {
    //Object.keys(App.game).filter(key => App.game[key]?.saveKey).forEach(key => {
        const saveKey = App.game[key].saveKey;
        App.game[key].fromJSON(SaveData.file().save[saveKey]);
    });

    SaveData.file().save.achievements?.forEach((achievementName) => {
        const achievement = AchievementHandler.findByName(achievementName);
        if (achievement) {
            achievement.unlocked(true);
        }
    });

    AchievementHandler.preCheckAchievements();
    AchievementHandler.calculateMaxBonus();
    AchievementHandler.achievementList.forEach(a => {
        if (a.unlocked()) {
            a.isCompleted = () => true;
        } else {
            a.isCompleted = () => false;
        }
    });
    const bonus = AchievementHandler.achievementBonus();
    AchievementHandler.achievementBonus = () => bonus;

    // set all pokemon to max level to handle attack calculations better
    App.game.party.caughtPokemon.forEach(p => p.level = App.game.badgeCase.maxLevel());

    BattleCalculator.settings.xAttackEnabled(false);
    BattleCalculator.settings.activeFlutes([]);

    isDamageLoaded(true);
};

module.exports = {
    file,
    prevLoadedSaves,

    loadFile,
    loadPreviousFile,
    loadAttackData,

    isLoaded,
    isOlderVersion,
    getMonoType,

    initialize,
    isDamageLoaded,
}