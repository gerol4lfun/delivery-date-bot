/**
 * Парсер текста для извлечения городов и дат доставки
 */

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

    // Если не найдено, возвращаем с заглавной буквы
    return city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
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
    normalizeCityName,
    formatParsedResults
};
