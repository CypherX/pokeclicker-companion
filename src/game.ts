/**
 * Sets up a headless instance of the game for the companion to call into.
 * Must be imported before anything that reads game state.
 */

// Disable game features that need the game's UI or would interfere with the companion
Notifier.notify = () => undefined;
SaveSelector.loadSaves = () => {};
SortModules = () => {};
EnigmaMutation.prototype.fromJSON = () => {};

// Quest lines are loaded during game init. Quests.fromJSON loads them again when a save is loaded,
// which would duplicate them, so only allow the first load.
QuestLineHelper.loadQuestLinesReal = QuestLineHelper.loadQuestLines;
QuestLineHelper.loadQuestLines = () => {
    if (App.game.quests.questLines().length > 0) {
        return;
    }

    QuestLineHelper.loadQuestLinesReal();
};

export const initGame = (): void => {
    player = new Player();
    player.highestRegion(0);
    const multiplier = new Multiplier();
    // Constructor argument order must match the game's Game class
    App.game = new Game(
        new Update(),
        new Profile(),
        new Breeding(multiplier),
        new Pokeballs(),
        new PokeballFilters(),
        new Wallet(multiplier),
        new KeyItems(),
        new BadgeCase(),
        new OakItems([20, 50, 100], multiplier),
        new OakItemLoadouts(),
        new PokemonCategories(),
        new Party(multiplier),
        new Gems(),
        new Underground(),
        new Farming(multiplier),
        new LogBook(),
        new RedeemableCodes(),
        new Statistics(),
        new Quests(),
        new SpecialEvents(),
        new Discord(),
        new AchievementTracker(),
        new Challenges(),
        new BattleFrontier(),
        multiplier,
        new SaveReminder(),
        new BattleCafeSaveObject(),
        new DreamOrbController(),
        new PurifyChamber(),
        new WeatherApp(),
        new ZMoves(),
    );
    App.game.farming.initialize();
    App.game.breeding.initialize();
    App.game.pokeballs.initialize();
    App.game.keyItems.initialize();
    App.game.oakItems.initialize();
    App.game.underground.initialize();

    QuestLineHelper.loadQuestLines();

    // optimizations
    App.game.badgeCase.maxLevel.extend({ deferred: true });

    App.game.oakItems.use = () => {};
};

initGame();

GenericDeal.generateDeals(new Date());
AchievementHandler.initialize(App.game.multiplier, App.game.challenges);
SafariPokemonList.generateSafariLists();
