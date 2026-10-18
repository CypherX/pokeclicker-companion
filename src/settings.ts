import { getStoredFlag, persistFlag } from './util';

export const showRequiredOnly = ko.observable(false);
export const showAllRegions = ko.observable(false);
export const defaultTab = ko.observable('tab-my-save');

persistFlag(showRequiredOnly, 'showRequiredOnly');
persistFlag(showAllRegions, 'showAllRegions');
defaultTab.subscribe((value) => localStorage.setItem('defaultTab', value));

export const initialize = (): void => {
    if (getStoredFlag('showRequiredOnly')) {
        showRequiredOnly(true);
    }

    if (getStoredFlag('showAllRegions')) {
        showAllRegions(true);
    }

    const tab = localStorage.getItem('defaultTab');
    if (tab && !window.location.hash.includes('#!')) {
        const tabElement = document.getElementById(tab);
        if (tabElement) {
            defaultTab(tab);
            new bootstrap.Tab(tabElement).show();
        }
    }
};
