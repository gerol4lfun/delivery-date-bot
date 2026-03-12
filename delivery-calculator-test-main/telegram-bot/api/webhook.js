/**
 * Vercel Serverless: Telegram webhook (единственный режим на Vercel)
 * index.js с polling здесь НЕ используется
 */

const TelegramBot = require('node-telegram-bot-api');
const { parseDeliveryDates, formatParsedResults } = require('../parser');

let bot = null;

function getBot() {
    if (!bot) {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token) throw new Error('TELEGRAM_BOT_TOKEN не установлен');
        bot = new TelegramBot(token, { webHook: false });
    }
    return bot;
}

// Прямой fetch к Supabase REST API — обходим @supabase/supabase-js (TLS-проблемы на Vercel)
async function updateDeliveryDatesFetch(deliveryData) {
    const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY не установлены');

    const rows = deliveryData.map((item) => ({
        city_name: item.city,
        delivery_date: item.date,
        updated_at: new Date().toISOString(),
        restrictions: item.restrictions ?? null
    }));

    const doUpsert = (data) =>
        fetch(`${url}/rest/v1/delivery_dates?on_conflict=city_name`, {
            method: 'POST',
            headers: {
                apikey: key,
                Authorization: `Bearer ${key}`,
                'Content-Type': 'application/json',
                Prefer: 'resolution=merge-duplicates,return=minimal'
            },
            body: JSON.stringify(data)
        });

    let res = await doUpsert(rows);
    if (!res.ok) {
        const errText = await res.text();
        if (/restrictions|column.*does not exist/i.test(errText)) {
            const rowsNoRestrictions = rows.map(({ restrictions, ...r }) => r);
            res = await doUpsert(rowsNoRestrictions);
            if (!res.ok) throw new Error(`Supabase: ${res.status} ${await res.text()}`);
        } else {
            throw new Error(`Supabase: ${res.status} ${errText}`);
        }
    }

    return {
        success: deliveryData.map((item) => ({ city: item.city, action: 'updated', date: item.date })),
        failed: [],
        total: deliveryData.length
    };
}

async function handleMessage(chatId, text, fromId) {
    const ADMIN_USER_ID = process.env.ADMIN_USER_ID ? parseInt(process.env.ADMIN_USER_ID) : null;
    const b = getBot();

    if (ADMIN_USER_ID && fromId !== ADMIN_USER_ID) {
        await b.sendMessage(chatId, '❌ У вас нет доступа к этому боту.');
        return;
    }

    if (!text || !text.trim()) {
        await b.sendMessage(chatId, '❌ Пожалуйста, отправьте текст с датами доставки.');
        return;
    }

    await b.sendMessage(chatId, '⏳ Обрабатываю данные...');

    const parsedData = parseDeliveryDates(text);

    if (parsedData.length === 0) {
        await b.sendMessage(chatId, '❌ Не найдено ни одной записи в правильном формате.\n\nИспользуйте формат: "Город с ДД.ММ"\n\nПример: Москва с 9.02');
        return;
    }

    const preview = formatParsedResults(parsedData);
    await b.sendMessage(chatId, preview + '\n\n⏳ Обновляю данные в Supabase...');

    let results;
    try {
        results = await updateDeliveryDatesFetch(parsedData);
        console.log('[webhook] Supabase upsert ok, rows:', results.total);
    } catch (supabaseErr) {
        console.error('[webhook] Supabase failed:', supabaseErr.message);
        throw supabaseErr;
    }

    let report = `✅ <b>Обновление завершено!</b>\n\n`;
    report += `📊 Всего обработано: ${results.total}\n`;
    report += `✅ Успешно: ${results.success.length}\n`;

    if (results.failed.length > 0) {
        report += `❌ Ошибок: ${results.failed.length}\n\n`;
        report += `<b>Ошибки:</b>\n`;
        results.failed.forEach((item) => {
            report += `• ${item.city}: ${item.error}\n`;
        });
    }

    if (results.success.length > 0) {
        report += `\n<b>Обновленные города:</b>\n`;
        results.success.slice(0, 10).forEach((item) => {
            report += `• ${item.city} - ${item.date} (${item.action === 'created' ? 'создан' : 'обновлен'})\n`;
        });
        if (results.success.length > 10) {
            report += `\n... и еще ${results.success.length - 10} городов`;
        }
    }

    await b.sendMessage(chatId, report, { parse_mode: 'HTML' });
}

async function handleCommand(chatId, text) {
    const b = getBot();
    if (text === '/start') {
        const msg = `🤖 <b>Бот для обновления дат доставки</b>

📝 <b>Как использовать:</b>
Просто отправьте мне текст в формате:

<i>Москва с 9.02
Тула с 9.02
Воронеж с 12.02</i>

Или с исключениями:
<i>Москва с 9.02 (кроме 16)</i>

Бот автоматически обновит данные в Supabase.`;
        await b.sendMessage(chatId, msg, { parse_mode: 'HTML' });
    } else if (text === '/help') {
        const msg = `📋 <b>Формат:</b> Город с ДД.ММ

Примеры:
• Москва с 9.02
• Воронеж с 12.02 (кроме 16, 20)`;
        await b.sendMessage(chatId, msg, { parse_mode: 'HTML' });
    }
}

function parseBody(body) {
    if (body == null) return null;
    if (typeof body === 'object') return body;
    if (typeof body === 'string') {
        try {
            return JSON.parse(body);
        } catch (e) {
            console.error('[webhook] JSON.parse failed:', e.message);
            return null;
        }
    }
    return null;
}

module.exports = async (req, res) => {
    console.log('[webhook] method:', req.method);

    if (req.method !== 'POST') {
        res.status(405).end();
        return;
    }

    const update = parseBody(req.body);
    if (!update) {
        console.error('[webhook] body empty or parse failed');
        res.status(200).end();
        return;
    }

    const hasMessage = !!update?.message;
    console.log('[webhook] update.message exists:', hasMessage);

    if (!hasMessage) {
        res.status(200).end();
        return;
    }

    const { chat, text, from } = update.message;
    const chatId = chat?.id;
    const fromId = from?.id ?? null;

    console.log('[webhook] chatId:', chatId, 'fromId:', fromId, 'path:', text?.startsWith('/') ? 'command' : 'text');

    if (!chatId) {
        console.error('[webhook] chatId missing');
        res.status(200).end();
        return;
    }

    try {
        if (text && text.startsWith('/')) {
            await handleCommand(chatId, text);
            console.log('[webhook] command ok');
        } else if (text) {
            await handleMessage(chatId, text, fromId);
            console.log('[webhook] message ok, Supabase updated');
        }
    } catch (err) {
        console.error('[webhook] error:', err.message);
        try {
            await getBot().sendMessage(chatId, `❌ Ошибка: ${err.message}`);
        } catch (sendErr) {
            console.error('[webhook] sendMessage failed:', sendErr.message);
        }
    }

    res.status(200).end();
};
