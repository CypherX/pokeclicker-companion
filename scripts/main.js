const package = require('../pokeclicker/package.json');

window.Companion = {
    package,
    ...require('./game'),
    ...require('./app'),
    //data: require('./data'),
    data: {
        ...require('./data'),
        //optimalVitamins: require('../assets/data/optimalVitamins.json'),
        //forecastData: require('../assets/data/forecastData.json'),
    },
    settings: require('./settings'),
}

Object.assign(window, {
    SaveData: require('./save'),
    Forecast: require('./forecast'),
    VitaminTracker: require('./vitaminTracker'),
    Enigma: require('./enigma'),
    FriendSafari: require('./friendSafari'),
    SaveFixes: require('./saveFixes'),
    BattleCalculator: require('./battleCalculator'),
    BattleFrontierSim: require('./bfSim'),
    Util: require('./util'),
});
