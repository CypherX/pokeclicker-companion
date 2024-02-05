const package = require('../pokeclicker/package.json');

window.Companion = {
    package,
    ...require('./game'),
    ...require('./app'),
    data: require('./data'),
    settings: require('./settings'),
}

Object.assign(window, {
    SaveData: require('./save'),
    Forecast: require('./forecast'),
    VitaminTracker: require('./vitaminTracker'),
    Enigma: require('./enigma'),
    FriendSafari: require('./friendSafari'),
    SaveFixes: require('./saveFixes'),
    Util: require('./util'),
});
