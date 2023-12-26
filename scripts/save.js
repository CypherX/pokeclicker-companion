const saveData = ko.observable();
const prevLoadedSaves = ko.observableArray();

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

    if (saveData() !== undefined) {
        Companion.initGame();
    }

    player.highestRegion(saveFile.player.highestRegion);
    player.trainerId = saveFile.player.trainerId;
    App.game.challenges.list.slowEVs.active(saveFile.save.challenges.list.slowEVs);

    Enigma.revealHintsCounter(0);
    VitaminTracker.highestRegion(player.highestRegion());
    Companion.typeDamageDistribution(undefined);

    saveData(saveFile);

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

    if (saveFile.save.party.caughtPokemon.every(p => pokemonMap[p.id].type.includes(PokemonType.Poison))) {
        alert('Haha, look, they only have poison pokemon!');
    }

    if (saveFile.save.profile.name.toLowerCase() == 'bailey') {
        if (Rand.intBetween(1, 20) == 1) {
            alert('Ȟ̷̨̠͈͖̲̠͍͓̊͂̐e̵͈͖̮̼̼͚͍̳̠̖̺͚̓͝ĺ̷̢̧̧̻̫͚̒l̴̛̲̼͒̽́͒̆̑͑̃̌̎o̸̡̘̞̝̭̙̠̰͋̆̚.̵̡̛̹͙̤̺̳̱͚̹̏͌̓̓̌̿̊̒́͂̂̊͂̚ ̵̨̨̖̭̞̰͖̞̮͚̺̟̰̔B̴̢̰̳͓̬̤̯̬͍̙͎̟͉͓̙̓̈́̓̽͑̍̓̂͑́͘͘a̵̛̭̬͎̪̔͋͌̀͂̏i̷̱͉̪͖̫͇̮͔̯͆̄̔͋͂ḽ̵̳͕͆̎̈́ę̶̛͕̘͎̮̯͙̱͔̙͓͉̿̽̍͂̋̇̏̐̈̽͜y̷̡̟̦̓̍͐̓̆̀̍̂̕.̶̤͖͚̅̅̒̔͘͘ ̴̧̤͔̜̪̦͇̿̀̋͒̾̋͋̚W̸̨̜͍̲̖̱̯̖͇̣̩̉̏͘͘͘͜͝͝e̴̛̩͈̥̻̺̝̲̹͂̈́̉͆̀̀͊́͐.̶̢̱͙̱̱͈͖̳̫̝͇̰̐̏̀̂̎̇͋͛͛̇̉͐́̚̕ͅͅ ̸̙̩̥͕̪̖̅̆̓̏̕͝͝͝ͅS̸̙͈̺͙̟͓̠̼͍͖̭͇͂̍̊͂̎̃̂͜e̸̟͊́̈́͆̉̽̎̔̈̊̔̑̕̕̚e̷̛̯̼̱͐͊͒̈́́̽͐̏̉̔.̴̧̛̉̈̊͛͐ ̶̨͕̗̱̙͚̗̩͉̖̥͈̠̬̑̉̀Ỹ̷̡͖̪̝̦͈̲͘͝o̵̢͍̗͍̱̪̮̊͛͛͋̂̆̔̒͊́̈͂̾̋ͅû̶̹̳̽͌̊̌̓̑͝.̶̡̢̹̤͚͚̟͇͕͖̦̠̪͆̍̈̉̉̈́͆̑̎̆͘̚͝ ̶̙͈͋̾͊̆̒̌͐̂Ŵ̸̧̺̗̥̲͈̳̟̜͚̜͚̏̽͗̊̾̐̿̉͝ȩ̵̼̪͎͉͇͙̭͎̻͈͗̈́͂̓̈́̒̃̈̔̋̉̂̈̕ͅ.̷̤͔͕̎̎̐̂͆̈́̀ ̸̢̧̻̗̯̥͓̥͕̱̖̬̲̅́̒͌̿̎̔͌̈͌̀͠͠ͅͅÂ̸̛̛̖͕̱̫̲̞̯̫͉͖̻̳͂̂̅̈́̑̓́͐̈̀r̷̢̗̳̗̤͔͓̻̳̳̠̳̬̩̞̆̎̾̈́͋̊̕͝e̴͓͇͙̬͔̼͔͇̋̋̐̐̽͐̈́͘̚.̸͍̞̼͈̖̩̮̹̈́̊̄͠ ̴͓͔̬̟̈́̈W̵͍͍̼̜̤͔̭̻̞̫̹̎̇̿́̀͘ͅa̷̡̡̨̩̙͍͖̜̍̾̈́͊̽̂͂͜t̵̟͚͙͇̫͚̠̭͈̣̘̫͆͒̑͊̀͒̆̉́͑͋̊̕͘ͅç̶̮͉͍̫̋̅̅̓͑͠ḩ̷͕̟̠̩̼̼͓̜̳̦͝ĭ̵̧̢̨̼͓̩͈̮͖͖͓̰͕̈́̈́͂̋̅̐̍̔̎̀́̕n̸̛͚͕̝̐́̿͌͂̊͛̓̂̓̓͑͋͝g̸̞̠̭͖̯̲͕̫̗͖͔͙̀̿̇͜.̸̨̡̢̱͖͙̰͍͙̟͈͓̪͙͊̓̆̃́̀̀̈́');
        } else {
            const hour = (new Date()).getHours();
            if (hour < 5) {
                alert('Bailey! What are you still doing up!? GO TO BED!');
            } else if (hour < 12) {
                alert('Good morning, Bailey! Did you sleep well?');
            } else if (hour < 18) {
                alert('Good afternoon, Bailey! We missed you. Enjoy your stay.');
            } else if (hour < 22) {
                alert('Good evening, Bailey. How was your day? ');
            } else {
                alert('Hello, Bailey. It\'s getting kind of late, perhaps consider retiring to bed soon?');
            }
        }
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
    return saveData() !== undefined;
});

const isOlderVersion = ko.pureComputed(() => {
    const saveVersion = saveData()?.save.update.version;
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


module.exports = {
    saveData,
    prevLoadedSaves,

    loadFile,
    loadPreviousFile,

    isLoaded,
    isOlderVersion,

    initialize,
}