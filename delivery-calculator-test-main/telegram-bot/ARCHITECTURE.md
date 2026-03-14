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

## Storage

| Таблица | Формат | Парсер |
|---------|--------|--------|
| `delivery_dates` | Старый: город + одна дата + restrictions | `parseDeliveryDates` |
| `delivery_calendar` | Новый: календарь по дням (X/ДС/Д/С) | `parseDeliveryCalendar` |

Календарь: `city_name`, `delivery_date` (DATE), `available_without_assembly`, `available_with_assembly`, `raw_status`. SQL: `sql/delivery_calendar_setup.sql`.

## Railway

- Root Directory: `delivery-calculator-test-main/telegram-bot`
- Запуск: `npm start` → `index.js` (polling)
- Перед запуском: `deleteWebhook` в Telegram
