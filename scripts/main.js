const package = require('../pokeclicker/package.json');

window.Companion = {
    package,
    ...require('./game'),
    ...require('./app'),
    data: require('./data'),
}

window.Forecast = require('./forecast');
window.VitaminTracker = require('./vitaminTracker');
