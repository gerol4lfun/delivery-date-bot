-- Таблица календаря дат доставки (новый формат)
-- Выполнить в Supabase SQL Editor

CREATE TABLE IF NOT EXISTS delivery_calendar (
    city_name TEXT NOT NULL,
    delivery_date DATE NOT NULL,
    available_without_assembly BOOLEAN NOT NULL DEFAULT false,
    available_with_assembly BOOLEAN NOT NULL DEFAULT false,
    raw_status TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (city_name, delivery_date)
);

CREATE INDEX IF NOT EXISTS idx_delivery_calendar_city ON delivery_calendar(city_name);
CREATE INDEX IF NOT EXISTS idx_delivery_calendar_date ON delivery_calendar(delivery_date);

ALTER TABLE delivery_calendar ENABLE ROW LEVEL SECURITY;
