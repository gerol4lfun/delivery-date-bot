> **DEPRECATED.** Railway no longer used. Not source of truth. См. [ARCHITECTURE.md](ARCHITECTURE.md), [VERCEL_НАСТРОЙКА.md](VERCEL_НАСТРОЙКА.md).

---

# Запуск бота на Railway (рабочий вариант)

Polling, без webhook. Бот работает стабильно.

---

## Шаг 1: Удалить webhook (если был)

Открой в браузере:
```
https://api.telegram.org/bot<ТВОЙ_BOT_TOKEN>/deleteWebhook
```
Ответ `{"ok":true}` — ок.

---

## Шаг 2: Railway

1. Зайди на [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub repo**
3. Выбери **gerol4lfun/delivery-date-bot**
4. Railway создаст сервис

---

## Шаг 3: Настройки в Railway

1. Кликни на сервис → **Settings**
2. **Root Directory:** `delivery-calculator-test-main/telegram-bot`
3. **Variables** — добавь:
   - `TELEGRAM_BOT_TOKEN` = твой токен от @BotFather
   - `SUPABASE_URL` = твой URL из Supabase
   - `SUPABASE_SERVICE_ROLE_KEY` = твой ключ из Supabase
   - `ADMIN_USER_ID` = твой Telegram ID (опционально)

4. **Deploy** — Railway задеплоит сам

---

## Шаг 4: Проверка

Отправь боту список городов. Должно обновиться за несколько секунд.

---

## Стоимость

Railway даёт $5 в месяц бесплатно. Бот, который обновляет раз в день, укладывается в лимит.
