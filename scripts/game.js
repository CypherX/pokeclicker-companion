Notifier.notify = () => {};
SaveSelector.loadSaves = () => {};
SortModules = () => {};

EnigmaMutation.prototype.fromJSON = () => {};

QuestLineHelper.loadQuestLinesReal = QuestLineHelper.loadQuestLines;
QuestLineHelper.loadQuestLines = () => {
	if (App.game.quests.questLines().length > 0) {
		return;
	}

	QuestLineHelper.loadQuestLinesReal()
}

const initGame = () => {
  player = new Player();
  player.highestRegion(0);
  const multiplier = new Multiplier();
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
  App.game.farming.initialize();

  QuestLineHelper.loadQuestLines();

  // optimizations
  App.game.badgeCase.maxLevel.extend({ deferred: true });
};

initGame();

GenericDeal.generateDeals();
AchievementHandler.initialize(App.game.multiplier, App.game.challenges);
SafariPokemonList.generateSafariLists();

// Knockout tooltip bindings
ko.bindingHandlers.tooltip = {
  init: (element, valueAccessor) => {
      const local = ko.utils.unwrapObservable(valueAccessor()), options = {};

      ko.utils.extend(options, ko.bindingHandlers.tooltip.options);
      ko.utils.extend(options, local);

      $(element).tooltip(options);

      ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
          $(element).tooltip('dispose');
      });
  },
  'update': function (element, valueAccessor) {
    const local = ko.utils.unwrapObservable(valueAccessor());
    const options = {};

    ko.utils.extend(options, ko.bindingHandlers.tooltip.options);
    ko.utils.extend(options, local);

    // Update the config of the tooltip
    const tooltipData = bootstrap.Tooltip.getInstance(element);
    tooltipData._config.title = options.title;

    // If the tooltip is visible, update its text
    const tooltipInner = tooltipData.tip && tooltipData.tip.querySelector('.tooltip-inner');
    if (tooltipInner) {
        tooltipInner.innerHTML = tooltipData._config.title || '';
    }
    if (tooltipData && tooltipData._config) {
        if (tooltipData._config.title === '') {
            $(element).tooltip('hide');
        }
    }
  }
};

module.exports = {
  initGame,
};