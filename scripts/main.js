const package = require('../pokeclicker/package.json');

window.Companion = {
    package,
    ...require('./game'),
    ...require('./app'),
    data: require('./data'),
    save: require('./save'),
    settings: require('./settings'),
}

window.Forecast = require('./forecast');
window.VitaminTracker = require('./vitaminTracker');
window.Enigma = require('./enigma');
window.Util = require('./util');
