# Настройка бота на Vercel (webhook)

## 1. Деплой

Vercel подхватит изменения из GitHub. Либо вручную: **Redeploy** в dashboard.

**Root Directory** в настройках проекта должен быть: `delivery-calculator-test-main/telegram-bot`

## 2. Установить webhook в Telegram

После деплоя выполни **один раз** (подставь свой URL и токен):

```bash
curl "https://api.telegram.org/bot<ТВОЙ_BOT_TOKEN>/setWebhook?url=https://delivery-bot-telegram.vercel.app/api/webhook"
```

Или в браузере:
```
https://api.telegram.org/bot<ТВОЙ_BOT_TOKEN>/setWebhook?url=https://delivery-bot-telegram.vercel.app/api/webhook
```

Ответ `{"ok":true}` — webhook установлен.

## 3. Переменные окружения в Vercel

В настройках проекта → Environment Variables:
- `TELEGRAM_BOT_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_USER_ID` (опционально)

## 4. Если бот был на Railway (polling)

После установки webhook **отключи** бота на Railway, иначе будут конфликты.
