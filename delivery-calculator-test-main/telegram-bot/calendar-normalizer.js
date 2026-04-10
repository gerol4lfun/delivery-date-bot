/**
 * Single source of truth for delivery calendar city/status normalization.
 * Used by Vercel endpoints and text parser before writing delivery_calendar.
 */

const STATUS_MAP = {
    'ДС': { available_without_assembly: true, available_with_assembly: true },
    'Д': { available_without_assembly: true, available_with_assembly: false },
    'С': { available_without_assembly: true, available_with_assembly: false },
    'X': { available_without_assembly: false, available_with_assembly: false },
    'Х': { available_without_assembly: false, available_with_assembly: false }
};

const DIRECTION_ALIAS = {
    'москва и мо': 'Москва и МО',
    'москва и м.о.': 'Москва и МО',
    'москва': 'Москва и МО',
    'мск': 'Москва и МО',
    'msk': 'Москва и МО',
    'московская область': 'Москва и МО',
    'санкт-петербург и обл.': 'Санкт-Петербург',
    'санкт-петербург и ло': 'Санкт-Петербург',
    'спб и ло': 'Санкт-Петербург',
    'питер': 'Санкт-Петербург',
    'петербург': 'Санкт-Петербург',
    'спб': 'Санкт-Петербург',
    'ленинградская область': 'Санкт-Петербург',
    'белгород': 'Белгород',
    'белгородская область': 'Белгород',
    'великий новгород': 'Великий Новгород',
    'новгородская область': 'Великий Новгород',
    'владимир': 'Владимир',
    'владимирская область': 'Владимир',
    'вологда': 'Вологда',
    'вологодская область': 'Вологда',
    'вологодская обл.': 'Вологда',
    'воронеж': 'Воронеж',
    'воронежская область': 'Воронеж',
    'екатеринбург': 'Екатеринбург',
    'свердловская область': 'Екатеринбург',
    'свердловская обл.': 'Екатеринбург',
    'иваново': 'Иваново',
    'ивановская область': 'Иваново',
    'ивановская обл.': 'Иваново',
    'йошкар-ола': 'Йошкар-Ола',
    'марий эл': 'Йошкар-Ола',
    'республика марий эл': 'Йошкар-Ола',
    'казань': 'Казань',
    'калуга': 'Калуга',
    'калужская область': 'Калуга',
    'кемерово': 'Кемерово',
    'кемеровская область': 'Кемерово',
    'кузбасс': 'Кемерово',
    'кострома': 'Кострома',
    'костромская область': 'Кострома',
    'костромская обл.': 'Кострома',
    'краснодар': 'Краснодар',
    'краснодарский край': 'Краснодар',
    'кубань': 'Краснодар',
    'курск': 'Курск',
    'курская область': 'Курск',
    'липецк': 'Липецк',
    'липецкая область': 'Липецк',
    'майкоп': 'Майкоп',
    'адыгея': 'Майкоп',
    'республика адыгея': 'Майкоп',
    'набережные челны': 'Набережные Челны',
    'челны': 'Набережные Челны',
    'нижний новгород': 'Нижний Новгород',
    'нн': 'Нижний Новгород',
    'нижний': 'Нижний Новгород',
    'нижегородская область': 'Нижний Новгород',
    'нижегородская обл.': 'Нижний Новгород',
    'новосибирск': 'Новосибирск',
    'новосибирская область': 'Новосибирск',
    'орел': 'Орел',
    'орёл': 'Орел',
    'орловская область': 'Орел',
    'рязань': 'Рязань',
    'рязанская область': 'Рязань',
    'ставрополь': 'Ставрополь',
    'ставропольский край': 'Ставрополь',
    'тамбов': 'Тамбов',
    'тамбовская область': 'Тамбов',
    'тверь': 'Тверь',
    'тверская область': 'Тверь',
    'тула': 'Тула',
    'тульская область': 'Тула',
    'ульяновск': 'Ульяновск',
    'ульяновская область': 'Ульяновск',
    'чебоксары': 'Чебоксары',
    'чувашия': 'Чебоксары',
    'республика чувашия': 'Чебоксары',
    'челябинск': 'Челябинск',
    'челябинская область': 'Челябинск',
    'челябинская обл.': 'Челябинск',
    'черкесск': 'Черкесск',
    'карачай-черкесия': 'Черкесск',
    'карачаево-черкесская республика': 'Черкесск',
    'ярославль': 'Ярославль',
    'ярославская область': 'Ярославль',
    'ярославская обл.': 'Ярославль',
    'ярославкая обл.': 'Ярославль',
    'ростов-на-дону': 'Ростов-на-Дону'
};

function normalizeDirectionKey(value) {
    return (value || '')
        .toString()
        .trim()
        .toLowerCase()
        .replace(/ё/g, 'е')
        .replace(/^(г\.\s*|город\s+)/, '')
        .replace(/\s+/g, ' ');
}

function titleCaseFallback(value) {
    return (value || '')
        .toString()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
}

function toCanonicalDirection(name) {
    const lower = normalizeDirectionKey(name);
    if (!lower) return '';
    if (DIRECTION_ALIAS[lower]) return DIRECTION_ALIAS[lower];
    for (const [key, val] of Object.entries(DIRECTION_ALIAS)) {
        if (lower.includes(key) || key.includes(lower)) return val;
    }
    return titleCaseFallback(name);
}

function normalizeStatus(raw) {
    return (raw || '').toString().trim().toUpperCase();
}

function isKnownStatus(raw) {
    return Object.prototype.hasOwnProperty.call(STATUS_MAP, normalizeStatus(raw));
}

function statusToFlags(raw) {
    return STATUS_MAP[normalizeStatus(raw)] || {
        available_without_assembly: false,
        available_with_assembly: false
    };
}

function normalizeDeliveryCalendarRow(row) {
    const status = normalizeStatus(row && row.raw_status);
    const flags = isKnownStatus(status)
        ? statusToFlags(status)
        : {
            available_without_assembly: !!(row && row.available_without_assembly),
            available_with_assembly: !!(row && row.available_with_assembly)
        };

    return {
        ...row,
        city_name: toCanonicalDirection(row && row.city_name),
        available_without_assembly: flags.available_without_assembly,
        available_with_assembly: flags.available_with_assembly,
        raw_status: status || null
    };
}

function normalizeDeliveryCalendarRows(rows) {
    return (rows || [])
        .map(normalizeDeliveryCalendarRow)
        .filter((row) => row.city_name && row.delivery_date);
}

module.exports = {
    STATUS_MAP,
    DIRECTION_ALIAS,
    isKnownStatus,
    statusToFlags,
    toCanonicalDirection,
    normalizeDeliveryCalendarRow,
    normalizeDeliveryCalendarRows
};
