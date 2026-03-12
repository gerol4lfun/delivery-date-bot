/**
 * Telegram бот — режим POLLING (Railway / локально)
 * На Vercel НЕ используется — там только api/webhook.js
 */

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { parseDeliveryDates, formatParsedResults } = require('./parser');
const { initSupabase, updateDeliveryDates } = require('./supabase');

// Проверка переменных окружения
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_USER_ID = process.env.ADMIN_USER_ID ? parseInt(process.env.ADMIN_USER_ID) : null;

if (!BOT_TOKEN) {
    console.error('❌ Ошибка: TELEGRAM_BOT_TOKEN не установлен!');
    process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Ошибка: SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY не установлены!');
    process.exit(1);
}

// Инициализация бота
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Инициализация Supabase
try {
    initSupabase(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    console.log('✅ Supabase подключен');
} catch (error) {
    console.error('❌ Ошибка подключения к Supabase:', error.message);
    process.exit(1);
}

console.log('🤖 Бот запущен и готов к работе!');

// Команда /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeMessage = `
🤖 <b>Бот для обновления дат доставки</b>

📝 <b>Как использовать:</b>
Просто отправьте мне текст в формате:

<i>Москва с 9.02
Тула с 9.02
Питер с 8.02
Воронеж с 12.02</i>

Или с исключениями:
<i>Москва с 9.02 (кроме 16)
Тула с 9.02 (кроме 16, 20)</i>

Бот автоматически:
1️⃣ Распарсит данные
2️⃣ Покажет что будет обновлено
3️⃣ Обновит данные в Supabase
4️⃣ Отправит подтверждение

📋 <b>Команды:</b>
/start - показать это сообщение
/help - помощь
    `;

    bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'HTML' });
});

// Команда /help
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    const helpMessage = `
📋 <b>Формат данных:</b>

Каждая строка должна быть в формате:
<b>Город с ДД.ММ</b>

Примеры:
• Москва с 9.02
• Санкт-Петербург с 8.02
• Воронеж с 12.02 (кроме 16)
• Тула с 9.02 (кроме 16, 20, 25)

<b>Важно:</b>
• Каждый город на новой строке
• Дата в формате ДД.ММ (например: 9.02, 12.02)
• Исключения указываются в скобках: (кроме 16)
    `;

    bot.sendMessage(chatId, helpMessage, { parse_mode: 'HTML' });
});

// Обработка текстовых сообщений
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Пропускаем команды
    if (text && text.startsWith('/')) {
        return;
    }

    // Проверка прав доступа (если установлен ADMIN_USER_ID)
    if (ADMIN_USER_ID && msg.from.id !== ADMIN_USER_ID) {
        bot.sendMessage(chatId, '❌ У вас нет доступа к этому боту.');
        return;
    }

    // Если это не текст, игнорируем
    if (!text || text.trim().length === 0) {
        bot.sendMessage(chatId, '❌ Пожалуйста, отправьте текст с датами доставки.');
        return;
    }

    try {
        // Парсим текст
        bot.sendMessage(chatId, '⏳ Обрабатываю данные...');

        const parsedData = parseDeliveryDates(text);

        if (parsedData.length === 0) {
            bot.sendMessage(chatId, '❌ Не найдено ни одной записи в правильном формате.\n\nИспользуйте формат: "Город с ДД.ММ"\n\nПример: Москва с 9.02');
            return;
        }

        // Показываем что будет обновлено
        const preview = formatParsedResults(parsedData);
        bot.sendMessage(chatId, preview + '\n\n⏳ Обновляю данные в Supabase...');

        // Обновляем данные в Supabase
        const results = await updateDeliveryDates(parsedData);

        // Формируем отчет
        let report = `✅ <b>Обновление завершено!</b>\n\n`;
        report += `📊 Всего обработано: ${results.total}\n`;
        report += `✅ Успешно: ${results.success.length}\n`;
        
        if (results.failed.length > 0) {
            report += `❌ Ошибок: ${results.failed.length}\n\n`;
            report += `<b>Ошибки:</b>\n`;
            results.failed.forEach(item => {
                report += `• ${item.city}: ${item.error}\n`;
            });
        }

        if (results.success.length > 0) {
            report += `\n<b>Обновленные города:</b>\n`;
            results.success.slice(0, 10).forEach(item => {
                report += `• ${item.city} - ${item.date} (${item.action === 'created' ? 'создан' : 'обновлен'})\n`;
            });
            if (results.success.length > 10) {
                report += `\n... и еще ${results.success.length - 10} городов`;
            }
        }

        bot.sendMessage(chatId, report, { parse_mode: 'HTML' });

    } catch (error) {
        console.error('Ошибка обработки сообщения:', error);
        bot.sendMessage(chatId, `❌ Произошла ошибка: ${error.message}\n\nПопробуйте еще раз или обратитесь к администратору.`);
    }
});

// Обработка ошибок
bot.on('polling_error', (error) => {
    console.error('Ошибка polling:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Остановка бота...');
    bot.stopPolling();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Остановка бота...');
    bot.stopPolling();
    process.exit(0);
});
