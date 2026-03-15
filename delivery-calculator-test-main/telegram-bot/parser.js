/**
 * Парсер текста для извлечения городов и дат доставки
 */

const STATUS_MAP = {
    'ДС': { available_without_assembly: true, available_with_assembly: true },
    'Д': { available_without_assembly: true, available_with_assembly: false },
    'С': { available_without_assembly: false, available_with_assembly: true },
    'X': { available_without_assembly: false, available_with_assembly: false },
    'Х': { available_without_assembly: false, available_with_assembly: false }
};

const MONTH_NAMES = {
    'январь': 1, 'января': 1, 'февраль': 2, 'февраля': 2, 'март': 3, 'марта': 3,
    'апрель': 4, 'апреля': 4, 'май': 5, 'мая': 5, 'июнь': 6, 'июня': 6,
    'июль': 7, 'июля': 7, 'август': 8, 'августа': 8, 'сентябрь': 9, 'сентября': 9,
    'октябрь': 10, 'октября': 10, 'ноябрь': 11, 'ноября': 11, 'декабрь': 12, 'декабря': 12
};

const DIRECTION_ALIAS = {
    'москва и мо': 'Москва',
    'москва и м.о.': 'Москва',
    'москва': 'Москва',
    'санкт-петербург и обл.': 'Санкт-Петербург',
    'санкт-петербург и ло': 'Санкт-Петербург',
    'спб и ло': 'Санкт-Петербург',
    'питер': 'Санкт-Петербург',
    'петербург': 'Санкт-Петербург',
    'спб': 'Санкт-Петербург',
    'великий новгород': 'Великий Новгород',
    'нижний новгород': 'Нижний Новгород',
    'набережные челны': 'Набережные Челны',
    'йошкар-ола': 'Йошкар-Ола',
    'ростов-на-дону': 'Ростов-на-Дону'
};

function statusToFlags(raw) {
    const s = (raw || '').trim().toUpperCase();
    return STATUS_MAP[s] ?? { available_without_assembly: false, available_with_assembly: false };
}

function toCanonicalDirection(name) {
    const lower = (name || '').trim().toLowerCase();
    if (DIRECTION_ALIAS[lower]) return DIRECTION_ALIAS[lower];
    for (const [key, val] of Object.entries(DIRECTION_ALIAS)) {
        if (lower.includes(key) || key.includes(lower)) return val;
    }
    return normalizeCityName(name);
}

function ddMmToIsoDate(dd, mm, year) {
    const d = parseInt(dd, 10);
    const m = parseInt(mm, 10);
    if (isNaN(d) || isNaN(m) || d < 1 || d > 31 || m < 1 || m > 12) return null;
    const y = year || new Date().getFullYear();
    const pad = (n) => String(n).padStart(2, '0');
    return `${y}-${pad(m)}-${pad(d)}`;
}

const validStatus = /^[ДСXХ]{1,2}$/i;

/**
 * Парсит календарный формат: месяц/год в заголовке, строка с днями, строки направлений, ячейки X/ДС/Д/С.
 * Дни берутся из строки-заголовка, не из индекса колонки.
 * Возвращает { rows, confident }. confident=true только при полном успешном разборе.
 */
function parseDeliveryCalendar(text) {
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

    const tableResult = parseDeliveryCalendarTable(lines);
    if (tableResult.confident && tableResult.rows.length > 0) return tableResult;

    const textRows = parseDeliveryCalendarTextFallback(lines);
    return { rows: textRows, confident: textRows.length > 0, error: textRows.length > 0 ? null : (tableResult.error || null) };
}

function parseDeliveryCalendarTable(lines) {
    if (lines.length < 3) return { rows: [], confident: false, error: null };

    const stripTrailingEllipsis = (s) => (s || '').replace(/\s*[.…]{2,}\s*$/g, '').trim();
    const cleanedLines = lines.map(stripTrailingEllipsis).filter((l) => l.length > 0);
    if (cleanedLines.length < 3) return { rows: [], confident: false, error: null };

    const monthMatch = cleanedLines[0].match(/^(январь|февраль|март|апрель|май|июнь|июль|август|сентябрь|октябрь|ноябрь|декабрь)\s+(\d{4})$/i);
    if (!monthMatch) return { rows: [], confident: false, error: null };

    const currentMonth = MONTH_NAMES[monthMatch[1].toLowerCase()];
    const currentYear = parseInt(monthMatch[2], 10);
    if (!currentMonth || isNaN(currentYear)) return { rows: [], confident: false, error: 'Не удалось распознать месяц и год в заголовке календаря.' };

    const dayCells = cleanedLines[1].split(/\s+/).filter((c) => c.length > 0);
    const dayNumbers = [];
    for (const c of dayCells) {
        const n = parseInt(c, 10);
        if (!isNaN(n) && n >= 1 && n <= 31) dayNumbers.push(n);
        else break;
    }
    if (dayNumbers.length === 0) return { rows: [], confident: false, error: 'Не удалось распознать строку дней в календаре.' };

    const results = [];
    const badRows = [];
    for (let i = 2; i < cleanedLines.length; i++) {
        const line = cleanedLines[i];
        let cells = line.split(/\s{2,}|\t/).filter((c) => c.length > 0);
        if (cells.length < 2) cells = line.split(/\s+/).filter((c) => c.length > 0);
        if (cells.length < 2) continue;

        let directionEnd = -1;
        for (let k = 0; k < cells.length; k++) {
            if (validStatus.test(cells[k].trim())) {
                directionEnd = k;
                break;
            }
        }
        if (directionEnd < 0) continue;

        const direction = cells.slice(0, directionEnd).join(' ').trim();
        const statusCells = cells.slice(directionEnd).map((c) => c.trim()).filter((c) => validStatus.test(c));
        if (statusCells.length !== dayNumbers.length) {
            badRows.push({ direction, got: statusCells.length, expected: dayNumbers.length });
            continue;
        }

        const canonical = toCanonicalDirection(direction);
        for (let j = 0; j < dayNumbers.length; j++) {
            const iso = ddMmToIsoDate(String(dayNumbers[j]), String(currentMonth), currentYear);
            if (!iso) {
                badRows.push({ direction, got: statusCells.length, expected: dayNumbers.length, msg: 'ошибка даты' });
                break;
            }
            const status = statusCells[j].toUpperCase();
            if (!STATUS_MAP[status]) {
                badRows.push({ direction, got: statusCells.length, expected: dayNumbers.length, msg: `неизвестный статус "${status}"` });
                break;
            }
            const flags = statusToFlags(status);
            results.push({
                city_name: canonical,
                delivery_date: iso,
                available_without_assembly: flags.available_without_assembly,
                available_with_assembly: flags.available_with_assembly,
                raw_status: status
            });
        }
    }

    if (badRows.length > 0) {
        const report = badRows.map((r) => `«${r.direction}»: ${r.got} статусов (ожидалось ${r.expected})${r.msg ? ' — ' + r.msg : ''}`).join('; ');
        return {
            rows: [],
            confident: false,
            error: `Неверное количество статусов (${dayNumbers.length} дней в заголовке): ${report}`
        };
    }
    return { rows: results, confident: results.length > 0, error: results.length > 0 ? null : 'Календарный формат распознан, но валидных записей не найдено.' };
}

function parseDeliveryCalendarTextFallback(lines) {
    const currentYear = new Date().getFullYear();
    const results = [];
    const pairRe = /(\d{1,2})\.(\d{1,2})\s+([ДСXХ]{1,2})/gi;
    for (const line of lines) {
        const pairs = [];
        let m;
        while ((m = pairRe.exec(line)) !== null) {
            pairs.push({ dd: m[1], mm: m[2], status: m[3].toUpperCase() });
        }
        if (pairs.length === 0) continue;
        const dirEnd = line.search(/\d{1,2}\.\d{1,2}\s+[ДСXХ]/i);
        const direction = dirEnd >= 0 ? line.slice(0, dirEnd).trim() : line.trim();
        if (!direction) continue;
        const canonical = toCanonicalDirection(direction);
        for (const p of pairs) {
            const iso = ddMmToIsoDate(p.dd, p.mm, currentYear);
            if (iso && STATUS_MAP[p.status]) {
                const flags = statusToFlags(p.status);
                results.push({
                    city_name: canonical,
                    delivery_date: iso,
                    available_without_assembly: flags.available_without_assembly,
                    available_with_assembly: flags.available_with_assembly,
                    raw_status: p.status
                });
            }
        }
    }
    return results;
}

function formatParsedCalendarResults(rows) {
    if (rows.length === 0) return '❌ Не найдено записей в календарном формате';
    const byCity = {};
    for (const r of rows) {
        if (!byCity[r.city_name]) byCity[r.city_name] = [];
        byCity[r.city_name].push(r);
    }
    let msg = `✅ Найдено записей: ${rows.length}\n\n`;
    for (const [city, items] of Object.entries(byCity)) {
        msg += `${city}: ${items.length} дат\n`;
    }
    return msg;
}

function normalizeRestrictions(raw) {
    if (!raw || !raw.trim()) return null;
    return raw
        .split(/[\s,]+/)
        .map((r) => r.trim())
        .filter((r) => /^\d{1,2}\.\d{1,2}$/.test(r))
        .join(', ') || null;
}

/**
 * Парсит текст и извлекает информацию о городах и датах доставки
 * @param {string} text - Текст для парсинга
 * @returns {Array} Массив объектов {city, date, restrictions}
 */
function parseDeliveryDates(text) {
    const rawLines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    const lines = [];

    for (let i = 0; i < rawLines.length; i++) {
        let line = rawLines[i].replace(/\s+/g, ' ');
        if (i + 1 < rawLines.length && /кроме\s*$/i.test(line) && /^\d{1,2}\.\d{1,2}/.test(rawLines[i + 1])) {
            line = line + ' ' + rawLines[i + 1].replace(/\s+/g, ' ');
            i++;
        }
        lines.push(line);
    }

    const results = [];
    const patterns = [
        /^(.+?)\s+с\s+(\d{1,2}\.\d{1,2})\s*[,(]\s*кроме\s+([\d.,\s]+)\s*\)?\s*$/i,
        /^(.+?)\s+с\s+(\d{1,2}\.\d{1,2})\s*\(кроме\s+([\d.,\s]+)\)\s*$/i,
        /^(.+?)\s+с\s+(\d{1,2}\.\d{1,2})\s*$/i
    ];

    for (const line of lines) {
        let match = null;
        for (const p of patterns) {
            match = line.match(p);
            if (match) break;
        }
        if (match) {
            const city = match[1].trim();
            const date = match[2].trim();
            const restrictions = match[3] ? normalizeRestrictions(match[3]) : null;

            results.push({
                city: normalizeCityName(city),
                originalCity: city,
                date: date,
                restrictions: restrictions
            });
        }
    }

    return results;
}

/**
 * Нормализует название города (приводит к стандартному виду)
 */
function normalizeCityName(city) {
    const cityMap = {
        'питер': 'Санкт-Петербург',
        'петербург': 'Санкт-Петербург',
        'спб': 'Санкт-Петербург',
        'нн': 'Нижний Новгород',
        'нижний': 'Нижний Новгород',
        'челны': 'Набережные Челны',
        'набережные челны': 'Набережные Челны',
        'йошкар-ола': 'Йошкар-Ола',
        'орёл': 'Орёл',
        'орёл': 'Орёл'
    };

    const lowerCity = city.toLowerCase().trim();
    
    // Проверяем точное совпадение
    if (cityMap[lowerCity]) {
        return cityMap[lowerCity];
    }

    // Проверяем частичное совпадение
    for (const [key, value] of Object.entries(cityMap)) {
        if (lowerCity.includes(key) || key.includes(lowerCity)) {
            return value;
        }
    }

    return toTitleCase(city.trim());
}

function toTitleCase(str) {
    if (!str || !str.trim()) return str;
    return str.toLowerCase().trim().replace(/(^|[\s\-])(.)/g, (m, sep, c) => sep + c.toUpperCase());
}

/**
 * Форматирует результаты парсинга для отображения пользователю
 */
function formatParsedResults(results) {
    if (results.length === 0) {
        return '❌ Не найдено ни одной записи в формате "Город с ДД.ММ"';
    }

    let message = `✅ Найдено записей: ${results.length}\n\n`;
    
    results.forEach((item, index) => {
        message += `${index + 1}. ${item.city} - ${item.date}`;
        if (item.restrictions) {
            message += ` (кроме ${item.restrictions})`;
        }
        message += '\n';
    });

    return message;
}

module.exports = {
    parseDeliveryDates,
    parseDeliveryCalendar,
    formatParsedResults,
    formatParsedCalendarResults,
    normalizeCityName
};
