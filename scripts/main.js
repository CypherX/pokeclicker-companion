const package = require('../pokeclicker/package.json');

window.Companion = {
    package,
    ...require('./game'),
    ...require('./app'),
    data: require('./data'),
}
