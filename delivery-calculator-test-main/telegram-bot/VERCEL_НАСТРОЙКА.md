# Настройка бота на Vercel (webhook)

Краткая операционная инструкция. Используется только Vercel + webhook. Source of truth: [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 1. Деплой

Vercel подхватывает изменения из GitHub. Либо вручную: **Redeploy** в dashboard.

**Root Directory:** `delivery-calculator-test-main/telegram-bot`

---

## 2. Webhook

После деплоя выполнить один раз (подставь URL и токен):

```
https://api.telegram.org/bot<ТВОЙ_BOT_TOKEN>/setWebhook?url=https://<ТВОЙ_ПРОЕКТ>.vercel.app/api/webhook
```

Ответ `{"ok":true}` — webhook установлен.

---

## 3. Переменные окружения

Settings → Environment Variables:

- `TELEGRAM_BOT_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_USER_ID` (опционально)

---

## 4. Railway

Railway больше не используется. Если бот когда-то был на Railway — отключи его, иначе конфликты с webhook.
