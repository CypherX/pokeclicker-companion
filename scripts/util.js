const formatDate = (date) => {
    if (!date) return undefined;
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
};

const formatDateTime = (date) => {
    if (!date) return undefined;
    return `${formatDate(date)} ${formatTime24Hours(date)}`;
};

const formatTime24Hours = (date) => {
    if (!date) return undefined;
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const dateAddHours = (startDate, hours) => {
    const date = new Date(startDate);
    date.setHours(date.getHours() + hours);
    return date;
};

const arrayToWhatever = (array) => {
    const newArray = [];
    for (let i = 0; i < array.length; i += 2) {
        newArray.push([array[i], array?.[i+1] ]);
    }
    return newArray;
};

const splitArrayAlternating = (array, n = 2) => {
    const newArray = Array.from({ length: n }, _ => []);
    for (let i = 0; i < array.length; i++) {
        newArray[i % n].push(array[i]);
    }

    return newArray;
};

const splitArrayChunked = (array, n = 2) => {
    const remainder = array.length % n;
    const size = Math.floor(array.length / n);
    let j = 0;
    return Array.from({ length: n }, (_, i) => array.slice(j, j += size + (i < remainder)));
};

const exportToCsv = (headers, data, fileName = 'export.csv') => {
    const rows = [
        headers.join(','),
        ...data.map(d => d.join(','))
    ];

    downloadFile(rows.join('\n'), fileName, 'text/csv');
};

const downloadFile = (data, fileName, type = 'text/plain') => {
    const blob = new Blob([data], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `${fileName}`);
    a.click();
};

const lzutf8 = require('lzutf8');

const compressString = (input, outputEncoding = 'Base64') => {
    return lzutf8.compress(input, { outputEncoding });
};

const decompressString = (input, inputEncoding = 'Base64') => {
    return lzutf8.decompress(input, { inputEncoding });
};

const notify = ({
    message,
    type = 'primary',
    timeout = 5000,
    title = '',
    onHideFunction = undefined,
}) => {
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
    $(`#${toastId}`)?.toast('show');

    $(`#${toastId}`).on('shown.bs.toast', () => {
        setTimeout(() => {
            $(`#${toastId}`).toast('hide');
        }, timeout);
    });

    $(`#${toastId}`).on('hidden.bs.toast', () => {
        document.getElementById(toastId).remove();
        onHideFunction?.();
    });
};

const getRegionNameText = (region, subRegion = 0) => {
    const regionName = GameConstants.camelCaseToString(GameConstants.Region[region]);
    const subRegionName = SubRegions.getSubRegionById(region, subRegion)?.name;
    if (regionName == subRegionName || !subRegionName) {
        return regionName;
    }
    return `${regionName} / ${subRegionName}`;
};

const notifications = [
    {
        id: 'newfeatbattlecalculator',
        title: 'New Feature',
        message: 'Check out the new Battle Calculator on the Tools tab to see if your party is ready to take on their next challenge!',
        type: 'info',
        timeout: 30000,
        expires: new Date(2024, 2, 22),
    },
];

const createNotifications = () => {
    const seenNotifications = JSON.parse(localStorage.getItem('seenNotifications')) || [];
    notifications.filter(n => Date.now() < n.expires && !seenNotifications.includes(n.id)).forEach(n => {
        Util.notify({
            message: n.message,
            type: n.type,
            timeout: n.timeout,
            title: n.title,
            onHideFunction: () => {
                const seen = JSON.parse(localStorage.getItem('seenNotifications')) || [];
                seen.push(n.id);
                localStorage.setItem('seenNotifications', JSON.stringify(seen));
            }
        });
    });
};

module.exports = {
    formatDate,
    formatDateTime,
    formatTime24Hours,
    dateAddHours,

    arrayToWhatever,
    splitArrayAlternating,
    splitArrayChunked,

    exportToCsv,
    downloadFile,

    compressString,
    decompressString,

    notify,
    getRegionNameText,
    createNotifications,
};