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
};