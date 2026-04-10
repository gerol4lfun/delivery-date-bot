/**
 * Delivery sync endpoint: принимает rows от Apps Script, валидирует, пишет в Supabase.
 * Защита: X-Sync-Secret должен совпадать с DELIVERY_SYNC_SECRET.
 * Dry-run: по умолчанию или dry_run=true в body — только логирует, не пишет.
 * Apply: DELIVERY_SYNC_APPLY=true в env И dry_run=false в body.
 */

const { verifyDeliveryCalendarRows } = require('../verifier');
const { normalizeDeliveryCalendarRows } = require('../calendar-normalizer');

async function updateDeliveryCalendarFetch(rows) {
    const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY не установлены');

    const data = rows.map((r) => ({
        city_name: r.city_name,
        delivery_date: r.delivery_date,
        available_without_assembly: r.available_without_assembly,
        available_with_assembly: r.available_with_assembly,
        raw_status: r.raw_status ?? null,
        updated_at: new Date().toISOString()
    }));

    const res = await fetch(`${url}/rest/v1/delivery_calendar?on_conflict=city_name,delivery_date`, {
        method: 'POST',
        headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates,return=minimal'
        },
        body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error(`Supabase: ${res.status} ${await res.text()}`);
    return { total: rows.length };
}

function parseBody(body) {
    if (body == null) return null;
    if (typeof body === 'object') return body;
    if (typeof body === 'string') {
        try {
            return JSON.parse(body);
        } catch (e) {
            return null;
        }
    }
    return null;
}

function isValidRow(r) {
    return (
        r &&
        typeof r.city_name === 'string' &&
        typeof r.delivery_date === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(r.delivery_date) &&
        typeof r.available_without_assembly === 'boolean' &&
        typeof r.available_with_assembly === 'boolean'
    );
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const secret = req.headers['x-sync-secret'] || req.headers['X-Sync-Secret'];
    const expectedSecret = process.env.DELIVERY_SYNC_SECRET;
    if (!expectedSecret || secret !== expectedSecret) {
        console.log('[sync-delivery] 401: invalid or missing secret');
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const body = parseBody(req.body);
    if (!body || !Array.isArray(body.rows)) {
        res.status(400).json({ error: 'Body must have { rows: [...] }' });
        return;
    }

    const applyEnabled = process.env.DELIVERY_SYNC_APPLY === 'true';
    const dryRun = !applyEnabled || body.dry_run === true;
    const rows = normalizeDeliveryCalendarRows(body.rows.filter(isValidRow));

    if (rows.length === 0) {
        const msg = 'No valid rows (expected: city_name, delivery_date, available_without_assembly, available_with_assembly)';
        console.log('[sync-delivery]', msg);
        res.status(400).json({ error: msg });
        return;
    }

    const verifierResult = verifyDeliveryCalendarRows(rows);
    const logPayload = {
        ts: new Date().toISOString(),
        dry_run: dryRun,
        rows_count: rows.length,
        verifier_ok: verifierResult.ok,
        verifier_report: verifierResult.reportText,
        sample: rows.slice(0, 2)
    };

    console.log('[sync-delivery]', JSON.stringify(logPayload));

    if (dryRun) {
        res.status(200).json({
            ok: true,
            dry_run: true,
            rows_count: rows.length,
            verifier_ok: verifierResult.ok,
            verifier_report: verifierResult.reportText,
            message: 'Dry-run: no Supabase write'
        });
        return;
    }

    try {
        const result = await updateDeliveryCalendarFetch(rows);
        console.log('[sync-delivery] Supabase upsert ok, rows:', result.total);
        res.status(200).json({
            ok: true,
            dry_run: false,
            rows_count: result.total,
            verifier_ok: verifierResult.ok,
            verifier_report: verifierResult.reportText
        });
    } catch (err) {
        console.error('[sync-delivery] Supabase failed:', err.message);
        res.status(500).json({ error: err.message });
    }
};
