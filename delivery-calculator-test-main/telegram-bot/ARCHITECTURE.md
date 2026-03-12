# Архитектура бота

## Два режима — только один активен

| Режим | Файл | Где | Webhook |
|-------|------|-----|---------|
| **Vercel** | `api/webhook.js` | Vercel serverless | ✅ Обязательно |
| **Railway** | `index.js` | Railway / локально | ❌ Удалить (deleteWebhook) |

**Важно:** Одновременно может работать только один режим. Если webhook установлен — Telegram шлёт только на Vercel. Если webhook удалён — нужен polling (Railway/index.js).

## Vercel (рекомендуется, бесплатно)

- Root Directory: `delivery-calculator-test-main/telegram-bot`
- Работает только `api/webhook.js` — index.js не используется
- После деплоя: `setWebhook?url=https://...vercel.app/api/webhook`

## Railway

- Root Directory: `delivery-calculator-test-main/telegram-bot`
- Запуск: `npm start` → `index.js` (polling)
- Перед запуском: `deleteWebhook` в Telegram
