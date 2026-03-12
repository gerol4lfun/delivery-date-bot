/**
 * Модуль для работы с Supabase
 */

const { createClient } = require('@supabase/supabase-js');

let supabaseClient = null;

/**
 * Инициализирует клиент Supabase
 */
function initSupabase(url, serviceRoleKey) {
    if (!url || !serviceRoleKey) {
        throw new Error('Supabase URL и Service Role Key обязательны!');
    }

    supabaseClient = createClient(url, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    return supabaseClient;
}

const UPDATE_TIMEOUT_MS = 30000; // 30 сек — не ждём бесконечно

/**
 * Обновляет даты доставки в Supabase (пакетный upsert — 1 запрос вместо 2×N)
 * @param {Array} deliveryData - Массив объектов {city, date, restrictions}
 * @returns {Promise<Object>} Результат обновления
 */
async function updateDeliveryDates(deliveryData) {
    if (!supabaseClient) {
        throw new Error('Supabase клиент не инициализирован!');
    }

    const results = {
        success: [],
        failed: [],
        total: deliveryData.length
    };

    // Готовим данные для пакетного upsert (1 запрос вместо 2×N)
    const rows = deliveryData.map((item) => {
        const row = {
            city_name: item.city,
            delivery_date: item.date,
            updated_at: new Date().toISOString()
        };
        if (item.restrictions !== null) {
            row.restrictions = item.restrictions;
        }
        return row;
    });

    const doUpdate = async () => {
        try {
            const { error } = await supabaseClient
                .from('delivery_dates')
                .upsert(rows, {
                    onConflict: 'city_name',
                    ignoreDuplicates: false
                });

            if (error) {
                throw error;
            }

            deliveryData.forEach((item) => {
                results.success.push({
                    city: item.city,
                    action: 'updated',
                    date: item.date
                });
            });
        } catch (error) {
            console.warn('Пакетный upsert не удался, пробуем по одному:', error.message);
            for (const item of deliveryData) {
                try {
                    const row = {
                        city_name: item.city,
                        delivery_date: item.date,
                        updated_at: new Date().toISOString()
                    };
                    if (item.restrictions !== null) {
                        row.restrictions = item.restrictions;
                    }

                    const { error: upsertError } = await supabaseClient
                        .from('delivery_dates')
                        .upsert([row], { onConflict: 'city_name', ignoreDuplicates: false });

                    if (upsertError) throw upsertError;

                    results.success.push({ city: item.city, action: 'updated', date: item.date });
                } catch (err) {
                    results.failed.push({ city: item.city, error: err.message });
                }
            }
        }
        return results;
    };

    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
            () => reject(new Error(`Превышено время ожидания (${UPDATE_TIMEOUT_MS / 1000} сек). Supabase может быть занят — попробуйте позже.`)),
            UPDATE_TIMEOUT_MS
        );
    });

    return Promise.race([doUpdate(), timeoutPromise]);
}

/**
 * Получает все даты доставки (для проверки)
 */
async function getAllDeliveryDates() {
    if (!supabaseClient) {
        throw new Error('Supabase клиент не инициализирован!');
    }

    const { data, error } = await supabaseClient
        .from('delivery_dates')
        .select('city_name, delivery_date, restrictions')
        .order('city_name');

    if (error) {
        throw error;
    }

    return data;
}

module.exports = {
    initSupabase,
    updateDeliveryDates,
    getAllDeliveryDates
};
