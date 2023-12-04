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
  new DreamOrbController()
);
App.game.farming.initialize();
App.game.breeding.initialize();
QuestLineHelper.loadQuestLines();


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