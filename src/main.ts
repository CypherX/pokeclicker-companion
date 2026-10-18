// The game instance must exist before any other module touches game state
import { initGame } from './game';
import './bindings';

import * as BattleCalculator from './battleCalculator';
import * as BattleFrontierSim from './bfSim';
import * as Data from './data';
import * as Enigma from './enigma';
import * as Forecast from './forecast';
import * as FriendSafari from './friendSafari';
import * as Party from './party';
import * as SaveData from './save';
import * as SaveFixes from './saveFixes';
import * as Settings from './settings';
import * as Statistics from './statistics';
import * as UI from './ui';
import * as Util from './util';
import { gameVersion } from './version';
import * as VitaminTracker from './vitaminTracker';

/** Everything the HTML templates use under the `Companion` global */
const Companion = {
    package: { version: gameVersion },
    initGame,
    ...Party,
    ...Statistics,
    tabVisited: UI.tabVisited,
    activeTab: UI.activeTab,
    selectedRoute: UI.selectedRoute,
    selectedDungeon: UI.selectedDungeon,
    data: { ...Data },
    settings: { ...Settings },
};

// The knockout templates bind to these globals. Module namespaces are copied into plain
// objects, as reading a namespace's exports goes through getters, and bindings read them constantly.
Object.assign(window, {
    Companion,
    SaveData: { ...SaveData },
    Forecast: { ...Forecast },
    VitaminTracker: { ...VitaminTracker },
    Enigma: { ...Enigma },
    FriendSafari: { ...FriendSafari },
    SaveFixes: { ...SaveFixes },
    BattleCalculator: { ...BattleCalculator },
    BattleFrontierSim: { ...BattleFrontierSim },
    Util: { ...Util },
});

$(() => {
    UI.initialize();
    Forecast.initialize();
    VitaminTracker.initialize();
});
