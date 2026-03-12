/**
 * Vercel Serverless: Telegram webhook
 * Telegram шлёт POST сюда при каждом сообщении
 */

const TelegramBot = require('node-telegram-bot-api');
const { parseDeliveryDates, formatParsedResults } = require('../parser');
const { initSupabase, updateDeliveryDates } = require('../supabase');

let bot = null;

function getBot() {
    if (!bot) {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token) throw new Error('TELEGRAM_BOT_TOKEN не установлен');
        bot = new TelegramBot(token, { webHook: false });
    }
    return bot;
}

// Каждый запрос — свежее подключение к Supabase (избегаем stale connection в serverless)
function ensureSupabase() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY не установлены');
    initSupabase(url, key);
}

async function handleMessage(chatId, text, fromId) {
    const ADMIN_USER_ID = process.env.ADMIN_USER_ID ? parseInt(process.env.ADMIN_USER_ID) : null;
    const b = getBot();
    ensureSupabase();

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

    const results = await updateDeliveryDates(parsedData);

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

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).end();
        return;
    }

    const update = req.body;
    if (!update || !update.message) {
        res.status(200).end();
        return;
    }

    const { chat, text, from } = update.message;
    const chatId = chat.id;
    const fromId = from ? from.id : null;

    res.status(200).end(); // Сразу отвечаем Telegram, чтобы не было таймаута

    try {
        if (text && text.startsWith('/')) {
            await handleCommand(chatId, text);
        } else if (text) {
            await handleMessage(chatId, text, fromId);
        }
    } catch (err) {
        console.error('Webhook error:', err);
        try {
            await getBot().sendMessage(chatId, `❌ Ошибка: ${err.message}`);
        } catch (_) {}
    }
};
