/**
 * Post-import verifier для delivery_calendar.
 * Проверяет rows до записи в Supabase. Не меняет данные.
 */

function daysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
}

function verifyDeliveryCalendarRows(rows) {
    const errors = [];
    let citiesOk = 0;

    if (!rows || rows.length === 0) {
        return { ok: true, reportText: '[Verifier] Нет данных для проверки.' };
    }

    const byCityMonth = {};
    const byKey = {};

    for (const r of rows) {
        const cn = r.city_name || '';
        const iso = r.delivery_date || '';
        const status = (r.raw_status || '').trim();
        const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!m) continue;
        const year = parseInt(m[1], 10);
        const month = parseInt(m[2], 10);
        const key = cn + '\x1f' + iso;
        const groupKey = cn + '\x1f' + year + '\x1f' + month;

        if (!byCityMonth[groupKey]) byCityMonth[groupKey] = { dates: new Set(), statusByDate: {} };
        byCityMonth[groupKey].dates.add(iso);

        if (!byKey[key]) byKey[key] = [];
        byKey[key].push({ status });

        const statusMap = byCityMonth[groupKey].statusByDate;
        if (!statusMap[iso]) statusMap[iso] = new Set();
        statusMap[iso].add(status);
    }

    const cityMonths = Object.keys(byCityMonth);
    const sep = '\x1f';
    for (const gk of cityMonths) {
        const parts = gk.split(sep);
        const city = parts.slice(0, -2).join(sep) || parts[0];
        const year = parts[parts.length - 2];
        const month = parts[parts.length - 1];
        const y = parseInt(year, 10);
        const m = parseInt(month, 10);
        const expected = daysInMonth(y, m);
        const { dates, statusByDate } = byCityMonth[gk];
        const count = dates.size;

        if (count !== expected) {
            errors.push({ city, msg: `${count} дат (ожидалось ${expected} за ${m}/${y})` });
            continue;
        }

        for (let d = 1; d <= expected; d++) {
            const pad = (n) => String(n).padStart(2, '0');
            const iso = `${year}-${pad(month)}-${pad(d)}`;
            if (!dates.has(iso)) {
                errors.push({ city, msg: `пропуск даты ${iso}` });
                break;
            }
        }
        if (errors.some((e) => e.city === city && e.msg && e.msg.startsWith('пропуск'))) continue;

        const statusConflicts = [];
        for (const [date, statuses] of Object.entries(statusByDate)) {
            if (statuses.size > 1) {
                statusConflicts.push(`${date} (${[...statuses].join(' vs ')})`);
            }
        }
        if (statusConflicts.length > 0) {
            errors.push({ city, msg: `конфликт raw_status: ${statusConflicts.slice(0, 3).join('; ')}${statusConflicts.length > 3 ? '...' : ''}` });
            continue;
        }

        citiesOk++;
    }

    for (const [key, items] of Object.entries(byKey)) {
        if (items.length <= 1) continue;
        const idx = key.indexOf('\x1f');
        const city = idx >= 0 ? key.slice(0, idx) : key;
        const date = idx >= 0 ? key.slice(idx + 1) : '';
        const statuses = [...new Set(items.map((i) => i.status))];
        errors.push({ city, msg: statuses.length > 1 ? `дубль ${date} (${statuses.join(' vs ')})` : `дубль ${date}` });
    }

    let reportText;
    if (errors.length === 0) {
        reportText = `[Verifier] ✅ Все проверки пройдены (${citiesOk} городов, ${rows.length} дат)`;
    } else {
        const errLines = errors.slice(0, 10).map((e) => `  • ${e.city}: ${e.msg}`).join('\n');
        reportText = `[Verifier]\n✅ Городов ок: ${citiesOk}\n❌ Ошибки:\n${errLines}${errors.length > 10 ? `\n  ... и ещё ${errors.length - 10}` : ''}`;
    }

    return {
        ok: errors.length === 0,
        reportText
    };
}

module.exports = { verifyDeliveryCalendarRows };
