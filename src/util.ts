const pad2 = (n: number) => n.toString().padStart(2, '0');

export function formatDate(date: Date): string;
export function formatDate(date: Date | undefined | null): string | undefined;
export function formatDate(date: Date | undefined | null): string | undefined {
    if (!date) return undefined;
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export const formatTime24Hours = (date: Date | undefined | null): string | undefined => {
    if (!date) return undefined;
    return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};

export const formatDateTime = (date: Date | undefined | null): string | undefined => {
    if (!date) return undefined;
    return `${formatDate(date)} ${formatTime24Hours(date)}`;
};

/** Formats a duration as e.g. "1d 2h 3m 4s", omitting zero parts */
export const formatTime = (seconds: number): string => {
    seconds = Math.floor(seconds);

    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    const parts: string[] = [];
    if (d > 0) parts.push(`${d.toLocaleString()}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || parts.length === 0) parts.push(`${s}s`);

    return parts.join(' ');
};

export const dateAddHours = (startDate: Date, hours: number): Date => {
    const date = new Date(startDate);
    date.setHours(date.getHours() + hours);
    return date;
};

export const downloadFile = (data: BlobPart, fileName: string, type = 'text/plain'): void => {
    const blob = new Blob([data], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', fileName);
    a.click();
};

export const exportToCsv = (headers: string[], data: unknown[][], fileName = 'export.csv'): void => {
    const rows = [
        headers.join(','),
        ...data.map(d => d.join(',')),
    ];

    downloadFile(rows.join('\n'), fileName, 'text/csv');
};

export interface NotifyOptions {
    message: string;
    type?: string;
    timeout?: number;
    title?: string;
    onHideFunction?: () => void;
}

export const notify = ({
    message,
    type = 'primary',
    timeout = 5000,
    title = '',
    onHideFunction = undefined,
}: NotifyOptions): void => {
    const toastId = Rand.string(7);
    const toastHtml =
    `<div id="${toastId}" class="toast bg-${type}" data-bs-autohide="false">
        ${title ? `<div class="toast-header">
            <strong class="me-auto">${title}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>` : ''}
        <div class="toast-body d-flex">
            <span class="flex-grow-1">${message.replace(/\n/g, '<br/>')}</span>
            ${title ? '' : '<button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>'}
        </div>
    </div>`;

    $('#toaster').prepend(toastHtml);
    const $toast = $(`#${toastId}`);
    $toast.toast('show');

    $toast.on('shown.bs.toast', () => {
        setTimeout(() => $toast.toast('hide'), timeout);
    });

    $toast.on('hidden.bs.toast', () => {
        document.getElementById(toastId)?.remove();
        onHideFunction?.();
    });
};

export const getRegionNameText = (region: GameConstants.Region, subRegion = 0): string => {
    const regionName = GameConstants.camelCaseToString(GameConstants.Region[region]);
    const subRegionName = SubRegions.getSubRegionById(region, subRegion)?.name;
    if (regionName == subRegionName || !subRegionName) {
        return regionName;
    }
    return `${regionName} / ${subRegionName}`;
};

export const sleep = (ms: number): Promise<void> => new Promise(r => setTimeout(r, ms));

/** Reads a boolean flag persisted as "0"/"1" */
export const getStoredFlag = (key: string, defaultValue = false): boolean => {
    const value = localStorage.getItem(key);
    return value === null ? defaultValue : !!+value;
};

/** Persists a boolean observable to localStorage as "0"/"1" whenever it changes */
export const persistFlag = (observable: KnockoutObservable<boolean>, key: string): void => {
    observable.subscribe((value) => localStorage.setItem(key, `${+value}`));
};

/** Builds a comparator for table sorting. Ties fall back to ascending id. */
export const compareBy = <T extends { id: number }>(
    getSortValue: (item: T) => number | string,
    descending: boolean,
): ((a: T, b: T) => number) => {
    const dir = descending ? -1 : 1;
    return (a, b) => {
        const aValue = getSortValue(a);
        const bValue = getSortValue(b);

        if (aValue == bValue) {
            return a.id - b.id;
        }
        if (aValue < bValue) {
            return -dir;
        }
        if (aValue > bValue) {
            return dir;
        }
        return 0;
    };
};

/** Toggles a sortable table column: same column flips direction, a new column sorts descending */
export const bindSortableTable = (
    tableSelector: string,
    sort: KnockoutObservable<string>,
    sortDescending: KnockoutObservable<boolean>,
): void => {
    $(document).on('click', `${tableSelector} thead th.sortable`, (e) => {
        const column = (e.currentTarget as HTMLElement).dataset.sort ?? '';
        if (sort() == column) {
            sortDescending(!sortDescending());
        } else {
            sort(column);
            sortDescending(true);
        }
    });
};
