# Telegram бот для обновления дат доставки

Бот обновляет ограничения по датам доставки в Supabase:
1. **TG webhook** — текст из Telegram → парсинг → Supabase
2. **Delivery sync** — Google Sheet поставщика → Apps Script → Vercel api/sync-delivery → Supabase delivery_calendar

Используется только **Vercel + webhook**. Railway больше не используется.

---

## Навигация

| Документ | Назначение |
|----------|------------|
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | source of truth: устройство, runtime, storage, контракт |
| **[VERCEL_НАСТРОЙКА.md](VERCEL_НАСТРОЙКА.md)** | Операционная инструкция: деплой, webhook |
| **[ИНСТРУКЦИЯ_ПО_НАСТРОЙКЕ.md](ИНСТРУКЦИЯ_ПО_НАСТРОЙКЕ.md)** | Подробная настройка Vercel |

**Устаревшие документы** (Railway, не source of truth): см. раздел «Документация» в [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Форматы ввода

**Календарный (основной):**
```
Март 2026
14   15   16
Москва   ДС   Д   X
```

**Legacy (город + одна дата):**
```
Москва с 9.02
Тула с 9.02 (кроме 16)
```

---

## Команды

- `/start` — приветствие
- `/help` — справка
