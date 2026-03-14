# Архитектура TG-бота (source of truth)

**Главный документ по текущему устройству бота.** Обновляется при изменении runtime, storage или форматов.

---

## Текущий runtime

| Компонент | Значение |
|-----------|----------|
| **Платформа** | Vercel (serverless) |
| **Режим** | Webhook |
| **Точка входа** | `api/webhook.js` |
| **Root Directory** | `delivery-calculator-test-main/telegram-bot` |

**Используется только Vercel + webhook.** Railway больше не используется. Polling (`index.js`) не используется на продакшене.

**Рабочие файлы:**
- `api/webhook.js` — Vercel handler, fetch к Supabase
- `parser.js` — parseDeliveryCalendar, parseDeliveryDates, канонизация направлений
- `sql/delivery_calendar_setup.sql` — миграция таблицы delivery_calendar
- `vercel.json`, `package.json`

`index.js`, `supabase.js` — для Railway/polling, на Vercel не используются.

---

## Поток данных

1. Telegram → webhook POST → `api/webhook.js`
2. `parseDeliveryCalendar(text)` или `parseDeliveryDates(text)` → `parser.js`
3. `updateDeliveryCalendarFetch()` или `updateDeliveryDatesFetch()` → Supabase REST API
4. Ответ пользователю в Telegram

---

## Storage

| Таблица | Формат | Назначение |
|---------|--------|------------|
| `delivery_calendar` | **Основной:** календарь по дням (X/ДС/Д/С), ограничения по датам | Новый формат |
| `delivery_dates` | Legacy: город + одна дата + restrictions | Fallback, старый формат |

**delivery_calendar:** `city_name`, `delivery_date` (DATE), `available_without_assembly`, `available_with_assembly`, `raw_status`, `updated_at`. SQL: `sql/delivery_calendar_setup.sql`.

---

## Межсистемный контракт (TG-бот ↔ калькулятор)

- **TG-бот пишет ограничения** — что загружено в `delivery_calendar` и `delivery_dates`, то и считается ограничением.
- **delivery_calendar — слой ограничений**, а не полный список разрешённых дат.
- **Будущие даты без загруженных ограничений** калькулятор трактует как **доступные**.

---

## Формат поставщика

**Новый календарный формат:**
- Заголовок: месяц + год (например, «Март 2026»)
- Строка с номерами дней (14, 15, 16, …)
- Строки направлений с ячейками X / ДС / Д / С

**Маппинг статусов:**
- ДС → available_without_assembly + available_with_assembly
- Д → available_without_assembly, без сборки
- С, X → недоступно

**Текущий статус загрузки:** март загружен; апрель и май планируются.

---

## Канонизация направлений

Парсер нормализует названия через `DIRECTION_ALIAS` и `normalizeCityName` в `parser.js`:

- Москва, МО, м.о. → **Москва**
- Питер, СПб, Петербург → **Санкт-Петербург**
- Великий Новгород → **Великий Новгород**
- Нижний Новгород, НН → **Нижний Новгород**
- Набережные Челны, Челны → **Набережные Челны**
- Йошкар-Ола → **Йошкар-Ола**
- Ростов-на-Дону → **Ростов-на-Дону**
- Орёл → **Орёл**

---

## Рабочий процесс

1. Поставщик присылает даты в **новом табличном формате** (месяц/год, дни, направления, X/ДС/Д/С).
2. При необходимости **скрины сначала преобразуются во внешний текстовый формат** вручную или через отдельный AI-шаг.
3. **TG-бот не OCR-система** — он принимает готовый текстовый формат и парсит его.

---

## Webhook

После деплоя выполнить один раз:

```
https://api.telegram.org/bot<ТОКЕН>/setWebhook?url=https://<ТВОЙ_ПРОЕКТ>.vercel.app/api/webhook
```

---

## Документация

**Актуальные:**
- `ARCHITECTURE.md` — source of truth (этот документ)
- `README.md` — входная точка, навигатор
- `VERCEL_НАСТРОЙКА.md` — операционная инструкция
- `ИНСТРУКЦИЯ_ПО_НАСТРОЙКЕ.md` — подробная настройка Vercel

**Устаревшие (DEPRECATED, Railway no longer used, not source of truth):**
- `ЗАПУСК_НА_RAILWAY.md`
- `ПОШАГОВАЯ_ИНСТРУКЦИЯ.md`
- `БЫСТРЫЙ_СТАРТ.md`
- `ДЕПЛОЙ.md`
- `ПРОСТАЯ_ИНСТРУКЦИЯ.txt`
- `ЗАГРУЗКА_В_РЕПОЗИТОРИЙ.md`
- `ШАГИ_СОЗДАНИЯ_РЕПОЗИТОРИЯ.md`
- `РЕШЕНИЕ_ПРОБЛЕМЫ_GIT.md`
- `../TELEGRAM_BOT_PLAN.md` — старый план (Railway, Heroku)
