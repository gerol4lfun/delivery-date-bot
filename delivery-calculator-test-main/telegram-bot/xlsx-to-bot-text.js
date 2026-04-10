#!/usr/bin/env node
/**
 * xlsx → нормализованный текст для Telegram-бота
 * Минимальный мост: читает xlsx, выводит текст в формате parseDeliveryCalendar.
 *
 * Ожидаемая структура xlsx:
 *   - строка: "Март 2026" (месяц + год)
 *   - строка: номера дней (14 15 16 17 ...)
 *   - строка: дни недели (Пн Вт Ср ...) — пропускается
 *   - строки: направление + статусы X/ДС/Д/С
 *
 * Использование: node xlsx-to-bot-text.js [путь/к/файлу.xlsx]
 * Вывод: готовый текст для вставки в бота (stdout)
 */

const XLSX = require('xlsx');
const path = require('path');
const { toCanonicalDirection } = require('./calendar-normalizer');

const MONTH_NAMES = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
const VALID_STATUS = /^[ДСXХ]{1,2}$/i;
const DAY_NAMES_PATTERN = /^(пн|вт|ср|чт|пт|сб|вс|пон|вто|сре|чет|пят|суб|вос|пнд|втр|срд|чтв|птн|сбт|вск)[.\s]*$/i;

function extractDayNumber(val) {
    if (val == null || val === '') return null;
    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= 1 && n <= 31) return n;
    const s = String(val).trim();
    const m = s.match(/^(\d{1,2})[.\s]/) || s.match(/^(\d{1,2})$/);
    if (m) {
        const d = parseInt(m[1], 10);
        if (d >= 1 && d <= 31) return d;
    }
    return null;
}

function isMonthHeader(cell) {
    if (!cell || typeof cell !== 'string') return null;
    const m = cell.match(/^(январь|февраль|март|апрель|май|июнь|июль|август|сентябрь|октябрь|ноябрь|декабрь)\s*(\d{4})?$/i);
    if (m) return { month: m[1].toLowerCase(), year: m[2] ? parseInt(m[2], 10) : new Date().getFullYear() };
    return null;
}

function isDayNamesRow(cells) {
    if (!cells || cells.length < 3) return false;
    let matchCount = 0;
    for (const c of cells) {
        const s = String(c || '').trim();
        if (DAY_NAMES_PATTERN.test(s) || s === '') matchCount++;
    }
    return matchCount >= Math.min(5, cells.length);
}

function normalizeStatus(s) {
    const t = String(s || '').trim().toUpperCase();
    return VALID_STATUS.test(t) ? t : null;
}

function processSheet(rows) {
    const blocks = [];
    let i = 0;

    while (i < rows.length) {
        const row = rows[i];
        if (!Array.isArray(row) || row.length === 0) { i++; continue; }

        let monthInfo = null;
        for (const cell of row) {
            monthInfo = isMonthHeader(cell);
            if (monthInfo) break;
        }
        if (monthInfo) {
            const year = monthInfo.year;
            const monthNum = MONTH_NAMES.indexOf(monthInfo.month) + 1;
            if (monthNum < 1) { i++; continue; }

            i++;
            if (i >= rows.length) break;

            const daysRow = rows[i];
            const dayNumbers = [];
            if (Array.isArray(daysRow)) {
                for (let c = 0; c < daysRow.length; c++) {
                    const d = extractDayNumber(daysRow[c]);
                    if (d != null) dayNumbers.push(d);
                    else if (dayNumbers.length > 0) break;
                }
            }

            if (dayNumbers.length === 0) { i++; continue; }
            i++;

            if (i < rows.length && isDayNamesRow(rows[i])) i++;

            const dataRows = [];
            while (i < rows.length) {
                const r = rows[i];
                if (!Array.isArray(r) || r.length < 2) { i++; break; }

                let directionEnd = -1;
                for (let k = 0; k < r.length; k++) {
                    if (normalizeStatus(r[k])) { directionEnd = k; break; }
                }
                if (directionEnd < 0) { i++; break; }

                const direction = r.slice(0, directionEnd).map(c => String(c || '').trim()).join(' ').trim();
                if (!direction) { i++; continue; }

                const statusCells = r.slice(directionEnd).map(c => normalizeStatus(c)).filter(Boolean);
                if (statusCells.length !== dayNumbers.length) { i++; continue; }

                dataRows.push({ direction: toCanonicalDirection(direction), statuses: statusCells });
                i++;
            }

            blocks.push({ month: monthInfo.month, year, monthNum, dayNumbers, dataRows });
            continue;
        }
        i++;
    }

    return blocks;
}

function formatOutput(blocks) {
    const lines = [];
    for (const b of blocks) {
        const monthTitle = b.month.charAt(0).toUpperCase() + b.month.slice(1) + ' ' + b.year;
        lines.push(monthTitle);
        lines.push(b.dayNumbers.join(' '));
        for (const r of b.dataRows) {
            lines.push(r.direction + ' ' + r.statuses.join(' '));
        }
        lines.push('');
    }
    return lines.join('\n').trim();
}

function main() {
    const filePath = process.argv[2] || 'Актуальные даты.xlsx';
    const absPath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);

    try {
        const wb = XLSX.readFile(absPath);
        let allBlocks = [];

        for (const sheetName of wb.SheetNames) {
            const ws = wb.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
            const blocks = processSheet(rows);
            allBlocks = allBlocks.concat(blocks);
        }

        allBlocks.sort((a, b) => a.year !== b.year ? a.year - b.year : a.monthNum - b.monthNum);

        const blocks = allBlocks;
        if (blocks.length === 0) {
            console.error('Не найдено блоков календаря (ожидается: Март 2026, строка дней, строки направлений)');
            process.exit(1);
        }

        console.log(formatOutput(blocks));
    } catch (err) {
        console.error('Ошибка:', err.message);
        process.exit(1);
    }
}

main();
