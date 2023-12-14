const showRequiredOnly = ko.observable(false);
const showAllRegions = ko.observable(false);
const defaultTab = ko.observable('tab-my-save');

showRequiredOnly.subscribe((value) => localStorage.setItem('showRequiredOnly', +value));
showAllRegions.subscribe((value) => localStorage.setItem('showAllRegions', +value));
defaultTab.subscribe((value) => localStorage.setItem('defaultTab', value));

const initialize = () => {
    if (+localStorage.getItem('showRequiredOnly')) {
        showRequiredOnly(true);
    }
    
    if (+localStorage.getItem('showAllRegions')) {
        showAllRegions(true);
    }
    
    if (localStorage.getItem('defaultTab')) {
        const tab = localStorage.getItem('defaultTab');
        if (document.getElementById(tab)) {
            defaultTab(tab);
            (new bootstrap.Tab(document.getElementById(tab))).show();
        }
    }
};

module.exports = {
    showRequiredOnly,
    showAllRegions,
    defaultTab,

    initialize,
};