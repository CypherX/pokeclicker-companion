import { changeLogData } from './data';
import * as Forecast from './forecast';
import { createNotifications } from './notifications';
import * as SaveData from './save';
import * as Settings from './settings';

/** Tab panes that have been shown, so expensive tabs only render once visited */
export const tabVisited = ko.observable<Record<string, boolean>>({});
export const activeTab = ko.observable('#mySaveContent');

export const selectedRoute = ko.observable<RegionRoute | undefined>(undefined);
export const selectedDungeon = ko.observable<string | undefined>(undefined);

const PILL_SELECTOR = 'button[data-bs-toggle="pill"]';

/** Reflects the active tabs in the URL, e.g. #!Forecast/Berry */
const updateNavigationHash = () => {
    const pages: string[] = [];
    $(`${PILL_SELECTOR}.active:visible`).each(function () {
        const path = $(this).data('path');
        if (path) {
            pages.push(path);
        }
    });

    if (pages.length) {
        window.history.replaceState(null, '', `#!${pages.join('/').replace(/\s+/g, '')}`);
    } else {
        window.history.replaceState(null, '', location.pathname);
    }
};

/** Shows the tabs in a #!Path/To/Tab URL */
const openTabsFromHash = () => {
    if (!window.location.hash.includes('#!')) {
        return;
    }

    // Read up front, as selecting the tabs below rewrites the hash via updateNavigationHash()
    const page = window.location.hash.replace(/.*#!/, '');
    const showTabsForPath = () => {
        page.split('/').forEach(s => {
            const tab = $(`${PILL_SELECTOR}[data-path="${decodeURIComponent(s)}"]`);
            if (tab.length) {
                tab.tab('show');
            }
        });
    };

    showTabsForPath();

    // Some tabs are rendered from forecast data that loads asynchronously, so their buttons don't exist yet. Re-apply the path once they do.
    if (!Forecast.dataLoaded()) {
        const subscription = Forecast.dataLoaded.subscribe((loaded) => {
            if (loaded) {
                subscription.dispose();
                showTabsForPath();
            }
        });
    }
};

const getClipboardText = async (item: DataTransferItem): Promise<string | null> => {
    if (item.kind === 'string') {
        return new Promise((resolve) => item.getAsString(resolve));
    }

    if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file && file.type === 'text/plain') {
            return await file.text();
        }
    }

    return null;
};

/** Save files can be loaded by dropping them anywhere on the page, or pasting their contents */
const bindSaveDropAndPaste = () => {
    $(document).on('dragover', (event) => {
        event.preventDefault();
    });

    document.addEventListener('drop', (event) => {
        event.preventDefault();

        const dataTransfer = event.dataTransfer;
        if (!dataTransfer) {
            return;
        }

        const files = dataTransfer.items
            ? [...dataTransfer.items].filter((item) => item.kind === 'file').map((item) => item.getAsFile())
            : [...dataTransfer.files];

        const file = files.find((f) => f?.name?.toLowerCase().endsWith('.txt'));
        if (file) {
            SaveData.loadFile(file);
        }
    });

    document.addEventListener('paste', async (event) => {
        const target = event.target as HTMLElement;
        if (
            target instanceof HTMLInputElement ||
            target instanceof HTMLTextAreaElement ||
            target.isContentEditable
        ) {
            return;
        }

        const items = event.clipboardData?.items;
        if (!items?.length) {
            return;
        }

        const text = await getClipboardText(items[0]);
        if (text && SaveData.loadEncodedSave(text)) {
            await navigator.clipboard.writeText('');
        }
    });
};

const bindChangelogAlert = () => {
    const latestChangelogTimestamp = changeLogData[0]?.timestamp;
    $('#changelogModal').on('shown.bs.modal', () => {
        $('#newChangelogAlert').toggleClass('d-none', true);
        if (latestChangelogTimestamp) {
            localStorage.setItem('lastSeenChangelog', `${latestChangelogTimestamp}`);
        }
    });

    const lastSeenChangelog = localStorage.getItem('lastSeenChangelog');
    if (latestChangelogTimestamp && (!lastSeenChangelog || +lastSeenChangelog < latestChangelogTimestamp)) {
        $('#newChangelogAlert').toggleClass('d-none', false);
    }
};

/** Highlights the row and column of the hovered cell */
const bindTableCrosshair = () => {
    const toggleCrosshair = (e: JQuery.TriggeredEvent, active: boolean) => {
        const cell = e.target as HTMLTableCellElement;
        const $cell = $(cell);
        const colIndex = cell.cellIndex + 1;

        $cell.closest('tr').find('td').toggleClass('hover-crosshair', active);
        $cell.closest('tbody').find(`td:nth-child(${colIndex})`).toggleClass('hover-crosshair', active);
        $cell.toggleClass('hover-cell-active', active);
    };

    $(document).on('mouseover', '.table-column-row-hover tbody td', (e) => toggleCrosshair(e, true));
    $(document).on('mouseout', '.table-column-row-hover tbody td', (e) => toggleCrosshair(e, false));
};

export const initialize = (): void => {
    const container = document.getElementById('container')!;
    ko.applyBindings({}, container);
    container.classList.remove('d-none');

    $('.btn-save-selector').on('click', () => {
        document.getElementById('file-selector')!.click();
    });

    $('#loadFromClipboard').on('click', () => {
        const data = ($('#saveDataInput').val() as string).trim();
        if (data.length && SaveData.loadEncodedSave(data)) {
            $('#loadFromClipboardModal').modal('hide');
            $('#saveDataInput').val('');
        }
    });

    $('#loadFromClipboardModal').on('shown.bs.modal', () => {
        document.getElementById('saveDataInput')!.focus();
    });

    $(document).on('shown.bs.tab', PILL_SELECTOR, (e) => {
        tabVisited({ ...tabVisited(), [$(e.target).data('bs-target')]: true });
    });

    $('#mainNavbar button.nav-link').on('show.bs.tab', (e) => {
        activeTab($(e.target).data('bs-target'));
    });

    openTabsFromHash();

    $(document).on('shown.bs.tab', PILL_SELECTOR, () => {
        updateNavigationHash();
    });

    bindSaveDropAndPaste();
    bindChangelogAlert();
    bindTableCrosshair();

    Settings.initialize();
    SaveData.initialize();
    createNotifications();

    updateNavigationHash();
};

