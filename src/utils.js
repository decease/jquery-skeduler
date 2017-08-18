/**
 * Parse time string and present it in hours (ex. '13:30' => 13.5)
 * @param {*string} time - time in format like '13:50', '11:00', '14'
 */
export function parseTime(time) {
    return /\d{1,2}\:\d{2}/.test(time) ?
        parseInt(time.split(':')[0]) + parseInt(time.split(':')[1]) / 60 :
        parseInt(time);
}

export function toTime(value) {
    // TODO: vvv fix me
    return (value < 10 ? '0' : '') + Math.floor(value) + (Math.ceil(value) > Math.floor(value) ? ':30' : ':00');
}