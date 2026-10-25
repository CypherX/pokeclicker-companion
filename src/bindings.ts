/** Bootstrap 5 tooltip binding, replacing the game's Bootstrap 4 based one: `tooltip: { title: ..., ... }` */

/** Internals of bootstrap.Tooltip used to update a tooltip's title in place */
interface TooltipInternals {
    _config: { title?: string };
    tip?: HTMLElement | null;
}

const getOptions = (valueAccessor: () => any): Partial<bootstrap.Tooltip.Options> => ({ ...ko.utils.unwrapObservable(valueAccessor()) });

ko.bindingHandlers.tooltip = {
    init: (element: HTMLElement, valueAccessor: () => any) => {
        $(element).tooltip(getOptions(valueAccessor));

        ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
            $(element).tooltip('dispose');
        });
    },
    update: (element: HTMLElement, valueAccessor: () => any) => {
        const options = getOptions(valueAccessor);
        const tooltip = bootstrap.Tooltip.getInstance(element) as unknown as TooltipInternals;

        // Update the config of the tooltip
        tooltip._config.title = options.title as string | undefined;

        // If the tooltip is visible, update its text
        const tooltipInner = tooltip.tip?.querySelector('.tooltip-inner');
        if (tooltipInner) {
            tooltipInner.innerHTML = tooltip._config.title || '';
        }

        if (tooltip._config.title === '') {
            $(element).tooltip('hide');
        }
    },
};
