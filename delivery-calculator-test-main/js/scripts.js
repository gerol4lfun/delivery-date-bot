
// Константа для контроля отладки
const DEBUG = false; // Отключено для продакшена
const APP_VERSION = "v6"; // Версия 6: старая система авторизации полностью отключена

// Флаг для включения/выключения вывода даты доставки в коммерческое предложение
const SHOW_DELIVERY_DATE_IN_OFFER = false; // Установите true, чтобы включить вывод даты доставки в КП

/**
 * Функция форматирования чисел с точками
 * @param {number} num - Число для форматирования
 * @returns {string} - Отформатированное число
 */
function formatPrice(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Функция нормализации строк (убирает пробелы и приводит к нижнему регистру)
function normalizeString(str) {
    if (!str) return "";
    // Заменяем обычные и неразрывные пробелы на пустую строку
    return str.trim().toLowerCase().replace(/[\s\u00A0]+/g, "");
}

// Функция нормализации названий городов (заменяет Ё на Е для сравнения)
function normalizeCityName(cityName) {
    if (!cityName) return "";
    return cityName.trim().toLowerCase().replace(/ё/g, "е").replace(/Ё/g, "Е");
}

// Функция поиска города в выпадающем списке по нормализованному названию
function findCityInDropdown(cityName) {
    if (!cityName) return null;
    const cityDropdown = document.getElementById('city');
    if (!cityDropdown || !cityDropdown.options) return null;
    
    const normalizedTarget = normalizeCityName(cityName);
    
    // Ищем точное совпадение по нормализованному названию
    for (let i = 0; i < cityDropdown.options.length; i++) {
        const option = cityDropdown.options[i];
        if (option.value && normalizeCityName(option.value) === normalizedTarget) {
            return option.value; // Возвращаем оригинальное название из списка
        }
    }
    
    // Если точного совпадения нет, ищем частичное (для "Набережные Челны" vs "Челны")
    for (let i = 0; i < cityDropdown.options.length; i++) {
        const option = cityDropdown.options[i];
        if (option.value) {
            const normalizedOption = normalizeCityName(option.value);
            if (normalizedTarget.includes(normalizedOption) || normalizedOption.includes(normalizedTarget)) {
                return option.value;
            }
        }
    }
    
    return null;
}

// Пользователи (СТАРАЯ СИСТЕМА УДАЛЕНА - больше не используется!)
// ВСЕ пароли теперь хранятся ТОЛЬКО в Supabase в таблице users
// Этот массив оставлен для справки, но не используется для авторизации
// УДАЛИТЕ ЭТОТ МАССИВ, ЕСЛИ ХОТИТЕ ПОЛНОСТЬЮ УБРАТЬ СТАРЫЕ ПАРОЛИ ИЗ КОДА
const users = []; // Пустой массив - старая система отключена

// Ключ для админа в localStorage (для доступа к админ-панели)
const ADMIN_KEY = 'admin_access_granted';

// Приоритеты форм (чем меньше число, тем выше в списке)
const formPriority = {
    "Арочная": 1,
    "Каплевидная": 2,
    "Прямостенная": 3,
    "Домиком": 4,
    "Пристенная": 5,
    "Миттлайдер арочная": 6,
    "Миттлайдер прямостенная": 7,
    "Промышленная прямостенная": 8,
    "Промышленная домиком": 9,
    "Навес": 10,
    "Прочие": 11
};

// Массив регионов доставки с ключевыми словами
const deliveryRegions = [
    { keywords: ["москва", "msk", "московская область"] },
    { keywords: ["санкт-петербург", "spb", "питер", "ленинградская область"] },
    { keywords: ["белгород", "belgorod", "белгородская область"] },
    { keywords: ["великий новгород", "новгород", "новгородская область"] },
    { keywords: ["владимир", "vladimir", "владимирская область"] },
    { keywords: ["вологда", "vologda", "вологодская область"] },
    { keywords: ["воронеж", "voronezh", "воронежская область"] },
    { keywords: ["екатеринбург", "ekaterinburg", "свердловская область"] },
    { keywords: ["иваново", "ivanovo", "ивановская область"] },
    { keywords: ["йошкар-ола", "yoshkar-ola", "марий эл", "республика марий эл"] },
    { keywords: ["казань", "kazan", "татарстан", "республика татарстан"] },
    { keywords: ["калуга", "kaluga", "калужская область"] },
    { keywords: ["кемерово", "kemerovo", "кемеровская область", "кузбасс"] },
    { keywords: ["кострома", "kostroma", "костромская область"] },
    { keywords: ["краснодар", "krasnodar", "краснодарский край", "кубань"] },
    { keywords: ["курск", "kursk", "курская область"] },
    { keywords: ["липецк", "lipetsk", "липецкая область"] },
    { keywords: ["майкоп", "maykop", "адыгея", "республика адыгея"] },
    { keywords: ["набережные челны", "nab-chelny", "челны", "республика татарстан"] },
    { keywords: ["нижний новгород", "nizh-novgorod", "нн", "нижегородская область"] },
    { keywords: ["новосибирск", "novosibirsk", "новосибирская область"] },
    { keywords: ["орел", "orel", "орловская область"] },
    { keywords: ["рязань", "ryazan", "рязанская область"] },
    { keywords: ["ставрополь", "stavropol", "ставропольский край"] },
    { keywords: ["тамбов", "tambov", "тамбовская область"] },
    { keywords: ["тверь", "tver", "тверская область"] },
    { keywords: ["тула", "tula", "тульская область"] },
    { keywords: ["ульяновск", "ulyanovsk", "ульяновская область"] },
    { keywords: ["чебоксары", "cheboksary", "чувашия", "республика чувашия"] },
    { keywords: ["челябинск", "chelyabinsk", "челябинская область"] },
    { keywords: ["черкесск", "cherkessk", "карачай-черкесия", "карачаево-черкесская республика"] },
    { keywords: ["ярославль", "yaroslavl", "ярославская область"] }
];

// Города для карты
const citiesForMap = [
    { name: "Москва", coords: [55.751244, 37.618423], boundaryDistance: 20 },
    { name: "Санкт-Петербург", coords: [59.934280, 30.335099], boundaryDistance: 20 },
    { name: "Белгород", coords: [50.597735, 36.585823], boundaryDistance: 10 },
    { name: "Великий Новгород", coords: [58.521400, 31.275505], boundaryDistance: 10 },
    { name: "Владимир", coords: [56.129057, 40.407031], boundaryDistance: 12 },
    { name: "Вологда", coords: [59.220492, 39.891568], boundaryDistance: 10 },
    { name: "Воронеж", coords: [51.661535, 39.200287], boundaryDistance: 15 },
    { name: "Екатеринбург", coords: [56.838926, 60.605703], boundaryDistance: 15 },
    { name: "Иваново", coords: [57.000348, 40.973921], boundaryDistance: 12 },
    { name: "Йошкар-Ола", coords: [56.634431, 47.899888], boundaryDistance: 12 },
    { name: "Казань", coords: [55.796391, 49.108891], boundaryDistance: 15 },
    { name: "Калуга", coords: [54.506043, 36.251593], boundaryDistance: 12 },
    { name: "Кемерово", coords: [55.354968, 86.087314], boundaryDistance: 15 },
    { name: "Кострома", coords: [57.767961, 40.926858], boundaryDistance: 10 },
    { name: "Краснодар", coords: [45.035470, 38.975313], boundaryDistance: 12 },
    { name: "Курск", coords: [51.730361, 36.192647], boundaryDistance: 10 },
    { name: "Липецк", coords: [52.610150, 39.594180], boundaryDistance: 12 },
    { name: "Майкоп", coords: [44.607782, 40.105690], boundaryDistance: 10 },
    { name: "Набережные Челны", coords: [55.727110, 52.404913], boundaryDistance: 12 },
    { name: "Нижний Новгород", coords: [56.296504, 43.936059], boundaryDistance: 15 },
    { name: "Новосибирск", coords: [55.008352, 82.935733], boundaryDistance: 15 },
    { name: "Орёл", coords: [52.967257, 36.069647], boundaryDistance: 10 },
    { name: "Рязань", coords: [54.629704, 39.741146], boundaryDistance: 12 },
    { name: "Ставрополь", coords: [45.044838, 41.969230], boundaryDistance: 10 },
    { name: "Тамбов", coords: [52.721219, 41.452274], boundaryDistance: 10 },
    { name: "Тверь", coords: [56.858539, 35.917596], boundaryDistance: 12 },
    { name: "Тула", coords: [54.193122, 37.617348], boundaryDistance: 12 },
    { name: "Ульяновск", coords: [54.316685, 48.403123], boundaryDistance: 12 },
    { name: "Чебоксары", coords: [56.146223, 47.251931], boundaryDistance: 12 },
    { name: "Челябинск", coords: [55.164442, 61.436843], boundaryDistance: 15 },
    { name: "Черкесск", coords: [44.226863, 42.046782], boundaryDistance: 10 },
    { name: "Ярославль", coords: [57.626559, 39.893813], boundaryDistance: 10 }
];

// Дополнительные услуги данные
const additionalServicesData = {
    "Брус": {
        price_by_length: {
            4: 5490,
            6: 6990,
            8: 8490,
            10: 9990,
            12: 11490,
            14: 12990,
            16: 14490
        }
    },
    "Штыри": {
        price_per_unit: 249,
        quantity_by_length: {
            "without_bracing": { "4": 10, "6": 14, "8": 18, "10": 22, "12": 26, "14": 30, "16": 34 },
            "with_bracing": { "4": 6, "6": 10, "8": 14, "10": 18, "12": 22, "14": 26, "16": 30 }
        }
    }
    // Сборка теперь обрабатывается через assemblyPrices
};

// Структура данных для сборки теплиц
const assemblyPrices = {
    "Арочная": {
        "2.5М": { 4: 4990, 6: 6490, 8: 7990, 10: 9490, 12: 11990 },
        "3М": { 4: 4990, 6: 6490, 8: 7990, 10: 9490, 12: 11990 },
        "3.5М": { 4: 5990, 6: 7990, 8: 9990, 10: 11990, 12: 13990 },
        "4М": { 4: 7990, 6: 11490, 8: 14990, 10: 18490, 12: 22490 }
    },
    "Каплевидная": {
        "2.5М": { 4: 4990, 6: 6490, 8: 7990, 10: 9490, 12: 11990 },
        "3М": { 4: 4990, 6: 6490, 8: 7990, 10: 9490, 12: 11990 },
        "3.5М": { 4: 5990, 6: 7990, 8: 9990, 10: 11990, 12: 13990 }
    },
    "Прямостенная": {
        "2.5М": { 4: 5990, 6: 7990, 8: 9990, 10: 11990, 12: 13990 },
        "3М": { 4: 5990, 6: 7990, 8: 9990, 10: 11990, 12: 13990 },
        "3.5М": { 4: 5990, 6: 7990, 8: 9990, 10: 11990, 12: 13990 },
        "4М": { 4: 7990, 6: 11490, 8: 14990, 10: 18490, 12: 22490 }
    },
    "Домиком": {
        "2.5М": { 4: 5990, 6: 7990, 8: 9990, 10: 11990, 12: 13990 },
        "3М": { 4: 5990, 6: 7990, 8: 9990, 10: 11990, 12: 13990 },
        "3.5М": { 4: 5990, 6: 7990, 8: 9990, 10: 11990, 12: 13990 },
        "4М": { 4: 7990, 6: 11490, 8: 14990, 10: 18490, 12: 22490 }
    },
    "Пристенная": {
        "2.5М": { 4: 5990, 6: 7990, 8: 9990, 10: 11990, 12: 13990 },
        "3М": { 4: 5990, 6: 7990, 8: 9990, 10: 11990, 12: 13990 }
    },
    "Миттлайдер арочная": {
        "3М": { 4: 7990, 6: 11490, 8: 14990, 10: 18490, 12: 22490 },
        "3.5М": { 4: 7990, 6: 11490, 8: 14990, 10: 18490, 12: 22490 }
    },
    "Миттлайдер прямостенная": {
        "3М": { 4: 7990, 6: 11490, 8: 14990, 10: 18490, 12: 22490 },
        "3.5М": { 4: 7990, 6: 11490, 8: 14990, 10: 18490, 12: 22490 }
    },
    "Промышленная прямостенная": {
        "5М": { 4: 9990, 6: 14990, 8: 19990, 10: 24990, 12: 29990, 14: 34990, 16: 39990 },
        "6М": { 4: 9990, 6: 14990, 8: 19990, 10: 24990, 12: 29990, 14: 34990, 16: 39990 }
    },
    "Промышленная домиком": {
        "7М": { 4: 9990, 6: 14990, 8: 19990, 10: 24990, 12: 29990, 14: 34990, 16: 39990 },
        "8М": { 4: 9990, 6: 14990, 8: 19990, 10: 24990, 12: 29990, 14: 34990, 16: 39990 }
    },
    "Навес": {
        "3М": { 4: 5990, 6: 7990, 8: 9990, 10: 11990, 12: 13990 },
        "3.5М": { 4: 5990, 6: 7990, 8: 9990, 10: 11990, 12: 13990 },
        "4М": { 4: 7990, 6: 11490, 8: 14990, 10: 18490, 12: 22490 },
        "5М": { 4: 7990, 6: 11490, 8: 14990, 10: 18490, 12: 22490 },
        "6М": { 4: 7990, 6: 11490, 8: 14990, 10: 18490, 12: 22490 }
    }
};

// Определение доступных форм теплиц и их названий
const availableForms = {
    "Арочная": [
        { name: "ТЕПЛИЦА БОЯРСКАЯ 2.5М", frame: "20х20" },
        { name: "ТЕПЛИЦА БОЯРСКАЯ 3М", frame: "20х20" },
        { name: "ТЕПЛИЦА БОЯРСКАЯ ЛЮКС 2.5М", frame: "40х20" },
        { name: "ТЕПЛИЦА БОЯРСКАЯ ЛЮКС 3М", frame: "40х20" },
        { name: "ТЕПЛИЦА БОЯРСКАЯ ЛЮКС 3.5М", frame: "40х20" },
        { name: "ТЕПЛИЦА БОЯРСКАЯ ДЕЛЮКС 2.5М", frame: "20х20+20х20" },
        { name: "ТЕПЛИЦА БОЯРСКАЯ ДЕЛЮКС 3М", frame: "20х20+20х20" },
        { name: "ТЕПЛИЦА БОЯРСКАЯ ПРЕМИУМ 2.5М", frame: "40х20+20х20" },
        { name: "ТЕПЛИЦА БОЯРСКАЯ ПРЕМИУМ 3М", frame: "40х20+20х20" },
        { name: "ТЕПЛИЦА БОЯРСКАЯ ПРЕМИУМ 3.5М", frame: "40х20+20х20" },
        { name: "ТЕПЛИЦА БОЯРСКАЯ ПРЕМИУМ 4М", frame: "40х20+20х20" }
    ],
    "Каплевидная": [
        { name: "ТЕПЛИЦА СТРЕЛЕЦКАЯ ЛЮКС 2.5М", frame: "40х20" },
        { name: "ТЕПЛИЦА СТРЕЛЕЦКАЯ ЛЮКС 3М", frame: "40х20" },
        { name: "ТЕПЛИЦА СТРЕЛЕЦКАЯ ЛЮКС 3.5М", frame: "40х20" }
    ],
    "Прямостенная": [
        { name: "ТЕПЛИЦА ЦАРСКАЯ ЛЮКС 2.5М", frame: "40х20" },
        { name: "ТЕПЛИЦА ЦАРСКАЯ ЛЮКС 3М", frame: "40х20" },
        { name: "ТЕПЛИЦА ЦАРСКАЯ ЛЮКС 3.5М", frame: "40х20" },
        { name: "ТЕПЛИЦА ЦАРСКАЯ ПРЕМИУМ 2.5М", frame: "40х20+20х20" },
        { name: "ТЕПЛИЦА ЦАРСКАЯ ПРЕМИУМ 3М", frame: "40х20+20х20" },
        { name: "ТЕПЛИЦА ЦАРСКАЯ ПРЕМИУМ 3.5М", frame: "40х20+20х20" },
        { name: "ТЕПЛИЦА ЦАРСКАЯ ПРЕМИУМ 4М", frame: "40х20+20х20" }
    ],
    "Домиком": [
        { name: "ТЕПЛИЦА ДВОРЦОВАЯ ЛЮКС 2.5М", frame: "40х20" },
        { name: "ТЕПЛИЦА ДВОРЦОВАЯ ЛЮКС 3М", frame: "40х20" },
        { name: "ТЕПЛИЦА ДВОРЦОВАЯ ЛЮКС 3.5М", frame: "40х20" },
        { name: "ТЕПЛИЦА ДВОРЦОВАЯ ПРЕМИУМ 2.5М", frame: "40х20+20х20" },
        { name: "ТЕПЛИЦА ДВОРЦОВАЯ ПРЕМИУМ 3М", frame: "40х20+20х20" },
        { name: "ТЕПЛИЦА ДВОРЦОВАЯ ПРЕМИУМ 3.5М", frame: "40х20+20х20" },
        { name: "ТЕПЛИЦА ДВОРЦОВАЯ ПРЕМИУМ 4М", frame: "40х20+20х20" }
    ],
    "Пристенная": [
        { name: "ТЕПЛИЦА ПРИСТЕННАЯ ЛЮКС 2.5М", frame: "40х20" },
        { name: "ТЕПЛИЦА ПРИСТЕННАЯ ЛЮКС 3М", frame: "40х20" },
        { name: "ТЕПЛИЦА ПРИСТЕННАЯ ПРЕМИУМ 2.5М", frame: "40х20+20х20" },
        { name: "ТЕПЛИЦА ПРИСТЕННАЯ ПРЕМИУМ 3М", frame: "40х20+20х20" }
    ],
    "Миттлайдер арочная": [
        { name: "ТЕПЛИЦА МИТТЛАЙДЕР ЛЮКС 3М", frame: "40х20" },
        { name: "ТЕПЛИЦА МИТТЛАЙДЕР ЛЮКС 3.5М", frame: "40х20" },
        { name: "ТЕПЛИЦА МИТТЛАЙДЕР ПРЕМИУМ 3М", frame: "40х20+20х20" },
        { name: "ТЕПЛИЦА МИТТЛАЙДЕР ПРЕМИУМ 3.5М", frame: "40х20+20х20" }
    ],
    "Миттлайдер прямостенная": [
        { name: "ТЕПЛИЦА МИТТЛАЙДЕР ЭЛИТ 3М", frame: "40х20+20х20" },
        { name: "ТЕПЛИЦА МИТТЛАЙДЕР ЭЛИТ 3.5М", frame: "40х20+20х20" }
    ],
    "Промышленная прямостенная": [
        { name: "ТЕПЛИЦА ПРЕМЬЕР ПРЕМИУМ 5М", frame: "40х20+40х20" },
        { name: "ТЕПЛИЦА ПРЕМЬЕР ПРЕМИУМ 6М", frame: "40х20+40х20" }
    ],
    "Промышленная домиком": [
        { name: "ТЕПЛИЦА МОНАРХ ПРЕМИУМ 7М", frame: "40х20+40х20" },
        { name: "ТЕПЛИЦА МОНАРХ ПРЕМИУМ 8М", frame: "40х20+40х20" }
    ],
    "Навес": [
        { name: "НАВЕС ЛЮКС 3.5М", frame: "40х20+20х20" },
        { name: "НАВЕС ЛЮКС 4М", frame: "40х20+20х20" },
        { name: "НАВЕС ПРЕМИУМ 5М", frame: "40х20+40х20" },
        { name: "НАВЕС ПРЕМИУМ 6М", frame: "40х20+40х20" }
    ]
};

// Создание обратной карты: form_name -> category
const formNameToCategory = {};

Object.keys(availableForms).forEach(category => {
    availableForms[category].forEach(form => {
        formNameToCategory[normalizeString(form.name)] = category;
    });
});

// Функция определения категории на основе имени формы
function getFormCategory(formName) {
    if (!formName || typeof formName !== "string") return "Прочие";
    const normalizedFormName = normalizeString(formName);
    const category = formNameToCategory[normalizedFormName];
    if (category) {
        return category;
    } else {
        return "Прочие";
    }
}

let currentCityData = []; // Данные для текущего города
let deliveryCost = 0; // Стоимость доставки
let currentDeliveryDate = null; // Текущая дата доставки для выбранного города
let activeOfferTab = 'short'; // Активная вкладка КП: 'short' или 'long'

// Кеширование для оптимизации производительности
let citiesCache = null; // Кеш списка городов
let cityDataCache = {}; // Кеш данных по городам {cityName: data}

// Инициализация Supabase
const SUPABASE_URL = 'https://dyoibmfdohpvjltfaygr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5b2libWZkb2hwdmpsdGZheWdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5ODAxMzcsImV4cCI6MjA0OTU1NjEzN30.ZHj1JJsmSN45-0cv83uJDpaqtv3R6_U7CZmbkK-H24s'; // Ваш Anon Public Key

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let mapInstance;
let currentRoute;

ymaps.ready(() => {
    mapInstance = new ymaps.Map("map", {
        center: [55.751244, 37.618423],
        zoom: 7
    });

    // Инициализация SuggestView для автодополнения адреса
    // const suggestView = new ymaps.SuggestView('address'); // Удалено, т.к. мы используем собственные подсказки
});

// Функция аутентификации через Supabase
async function authenticate() {
    const loginInput = document.getElementById("login");
    const passwordInput = document.getElementById("password");
    const authError = document.getElementById("auth-error");

    const login = loginInput.value.trim();
    const password = passwordInput.value.trim();

    if (!login || !password) {
        authError.style.display = "block";
        return;
    }

    try {
        // Проверяем логин и пароль в Supabase
        const { data, error } = await supabaseClient
            .from('users')
            .select('id, login, password, password_version, is_active')
            .eq('login', login)
            .eq('is_active', true)
            .single();

        if (error || !data) {
            // Если не найдено в Supabase - пользователь не существует
            console.error("Пользователь не найден в Supabase:", error);
            authError.style.display = "block";
            return;
        }

        // Проверяем пароль
        if (data.password !== password) {
            authError.style.display = "block";
            return;
        }

        // Если всё верно, сохраняем данные в localStorage
        authError.style.display = "none";
        localStorage.setItem('savedLogin', login);
        localStorage.setItem('appVersion', APP_VERSION);
        localStorage.setItem('passwordVersion', data.password_version.toString());
        localStorage.setItem('userId', data.id.toString());

        // Проверяем, не админ ли это (для доступа к админ-панели)
        // Важно: проверяем точно как 'admin' (без toLowerCase, так как в базе может быть другой регистр)
        // СТРОГАЯ проверка: только пользователь с логином точно "admin"
        if (login && login.trim().toLowerCase() === 'admin') {
            localStorage.setItem(ADMIN_KEY, 'true');
        } else {
            localStorage.removeItem(ADMIN_KEY);
        }

        document.getElementById("auth-container").classList.add("hidden");
        document.getElementById("calculator-container").classList.remove("hidden");
        await initializeCalculator();
    } catch (err) {
        console.error("Ошибка при авторизации:", err);
        authError.style.display = "block";
    }
}


// Функция выхода
function logout() {
    try {
        const savedLogin = localStorage.getItem('savedLogin');
        
        localStorage.removeItem('savedLogin');
        localStorage.removeItem('passwordVersion');
        localStorage.removeItem('userId');
        localStorage.removeItem(ADMIN_KEY);
        
        const authContainer = document.getElementById("auth-container");
        const calcContainer = document.getElementById("calculator-container");
        
        if (authContainer) {
            authContainer.classList.remove("hidden");
        } else {
            console.error("auth-container не найден!");
        }
        
        if (calcContainer) {
            calcContainer.classList.add("hidden");
        } else {
            console.error("calculator-container не найден!");
        }
        
        // Скрываем админ-панель, если открыта
        const adminPanel = document.getElementById("admin-panel");
        if (adminPanel) {
            adminPanel.classList.add("hidden");
        }
        
        // Сброс калькулятора при выходе
        resetDropdown('form', 'Сначала выберите город');
        resetDropdown('width', 'Сначала выберите форму');
        resetDropdown('length', 'Сначала выберите ширину');
        resetDropdown('frame', 'Сначала выберите длину');
        resetDropdown('polycarbonate', 'Сначала выберите город');
        resetDropdown('arcStep', 'Выберите шаг');
        resetAdditionalOptions();
        
        const offerField = document.getElementById("commercial-offer");
        if (offerField) {
            offerField.value = "Здесь будет ваше коммерческое предложение.";
        }
        
        const resultDiv = document.getElementById("result");
        if (resultDiv) {
            resultDiv.innerText = "";
        }
        
        if (mapInstance && currentRoute) {
            mapInstance.geoObjects.remove(currentRoute);
        }
        
    } catch (error) {
        console.error("❌ Ошибка при выходе:", error);
        // Принудительная очистка localStorage и перезагрузка
        localStorage.clear();
        location.reload();
    }
}

// Функция проверки актуальности пароля пользователя
async function checkPasswordVersion() {
    const savedLogin = localStorage.getItem('savedLogin');
    const savedPasswordVersion = localStorage.getItem('passwordVersion');

    if (!savedLogin || !savedPasswordVersion) {
        return false; // Нет сохраненных данных
    }

    try {
        const { data, error } = await supabaseClient
            .from('users')
            .select('password_version, is_active')
            .eq('login', savedLogin)
            .single();

        if (error || !data) {
            // Если это сетевая ошибка - НЕ разлогиниваем, продолжаем работу
            if (isNetworkError(error)) {
                console.error("Ошибка сети при проверке версии пароля (возможно блокировка Supabase). Продолжаем работу.");
                return true; // Продолжаем работу при сетевых ошибках
            }
            // Другие ошибки (пользователь не найден) - разлогиниваем
            console.error("Пользователь не найден в Supabase при проверке версии:", error);
            logout();
            return false;
        }

        // Если пользователь деактивирован или версия пароля не совпадает - выход
        if (!data.is_active || data.password_version.toString() !== savedPasswordVersion) {
            logout();
            // Показываем alert только если версия пароля реально изменилась (пароль был изменён)
            if (data.password_version.toString() !== savedPasswordVersion) {
                alert("Сессия истекла. Пожалуйста, войдите снова.");
            }
            return false;
        }

        return true;
    } catch (err) {
        // Если ошибка сети - продолжаем работу, не разлогиниваем
        if (isNetworkError(err)) {
            console.error("Ошибка сети при проверке версии пароля. Продолжаем работу.");
            return true; // Продолжаем работу при сетевых ошибках
        }
        console.error("Ошибка при проверке версии пароля:", err);
        return true; // Даже при других ошибках продолжаем работу (менее агрессивно)
    }
}

// Функция проверки сетевых ошибок
function isNetworkError(error) {
    if (!error) return false;
    const errorStr = JSON.stringify(error).toLowerCase();
    return errorStr.includes('load failed') || 
           errorStr.includes('network') || 
           errorStr.includes('timeout') ||
           errorStr.includes('err_network_changed') ||
           errorStr.includes('err_name_not_resolved') ||
           errorStr.includes('failed to fetch') ||
           errorStr.includes('networkerror') ||
           (error.message && error.message.toLowerCase().includes('failed to fetch'));
}

// Функция загрузки даты доставки для города
async function loadDeliveryDate(cityName) {
    if (!cityName) {
        currentDeliveryDate = null;
        updateDeliveryDateDisplay();
        return null;
    }

    try {
        // Пробуем найти точное совпадение
        let { data, error } = await supabaseClient
            .from('delivery_dates')
            .select('delivery_date')
            .eq('city_name', cityName)
            .single();

        // Если не найдено, пробуем найти альтернативные названия (например, "Питер" для "Санкт-Петербург")
        if (error || !data) {
            if (DEBUG) console.log(`Точное совпадение не найдено для "${cityName}", ищем альтернативы...`, error);
            
            // Пробуем найти по нормализованному названию
            const normalizedCity = normalizeCityName(cityName);
            const { data: altData, error: altError } = await supabaseClient
                .from('delivery_dates')
                .select('city_name, delivery_date')
                .limit(100);

            if (altError) {
                console.error("Ошибка при загрузке альтернативных дат:", altError);
                currentDeliveryDate = null;
                updateDeliveryDateDisplay();
                return null;
            }

            if (altData && altData.length > 0) {
                const found = altData.find(item => {
                    const normalizedItem = normalizeCityName(item.city_name);
                    return normalizedItem === normalizedCity || 
                           normalizedCity.includes(normalizedItem) || 
                           normalizedItem.includes(normalizedCity);
                });
                if (found) {
                    if (DEBUG) console.log(`Найдена дата для "${cityName}" через альтернативное название "${found.city_name}": ${found.delivery_date}`);
                    currentDeliveryDate = found.delivery_date;
                    updateDeliveryDateDisplay();
                    return found.delivery_date;
                }
            }
            
            if (DEBUG) console.log(`Дата доставки не найдена для города "${cityName}"`);
            currentDeliveryDate = null;
            updateDeliveryDateDisplay();
            return null;
        }

        if (DEBUG) console.log(`Найдена дата доставки для "${cityName}": ${data.delivery_date}`);
        currentDeliveryDate = data.delivery_date;
        updateDeliveryDateDisplay();
        return data.delivery_date;
    } catch (err) {
        console.error("Ошибка при загрузке даты доставки:", err);
        currentDeliveryDate = null;
        updateDeliveryDateDisplay();
        return null;
    }
}

// Функция обновления отображения даты доставки в интерфейсе
// УДАЛЕНО: больше не показываем дату под выпадающим списком города
function updateDeliveryDateDisplay() {
    // Функция оставлена для совместимости, но ничего не делает
    // Дата теперь показывается только в модальном окне
}

// Функция для загрузки городов из Supabase с учётом пагинации
async function loadCities() {
    // Проверяем кеш
    if (citiesCache) {
        const cityDropdown = document.getElementById('city');
        if (cityDropdown && cityDropdown.options.length > 1) {
            return; // Уже загружено
        }
    }
    
    const pageSize = 1000; // Максимальное количество строк за один запрос
    let allCities = [];
    let page = 0;

    while (true) {
        try {
        // Запрос данных с пагинацией
        let { data, error } = await supabaseClient
            .from('prices')
            .select('city_name') // Запрашиваем города
            .range(page * pageSize, (page + 1) * pageSize - 1); // Пагинация

        if (error) {
            console.error("Ошибка при загрузке городов из Supabase:", error);
                // Показываем пользователю понятное сообщение
                const cityDropdown = document.getElementById('city');
                if (cityDropdown) {
                    cityDropdown.innerHTML = '<option value="" disabled selected>Ошибка загрузки данных</option>';
                }
                // Не показываем alert для сетевых ошибок, просто логируем
                console.warn("Не удалось загрузить города. Возможно, проблема с подключением к Supabase.");
            return;
        }

        // Если данных на странице меньше, чем pageSize, значит, это последняя страница
        if (data.length === 0) break;

        // Добавляем города в общий массив
        allCities = allCities.concat(data.map(item => item.city_name));
        page++;
        } catch (err) {
            console.error("Критическая ошибка при загрузке городов:", err);
            const cityDropdown = document.getElementById('city');
            if (cityDropdown) {
                cityDropdown.innerHTML = '<option value="" disabled selected>Ошибка загрузки данных</option>';
            }
            // Не показываем alert для сетевых ошибок, просто логируем
            console.warn("Не удалось загрузить города. Возможно, проблема с подключением к Supabase.");
            return;
        }
    }

    // Убираем дубликаты городов
    let uniqueCities = [...new Set(allCities)];

    // Приоритетные города
    const priorityCities = ["Москва", "Санкт-Петербург"];

    // Удаляем приоритетные города из основного списка
    uniqueCities = uniqueCities.filter(city => !priorityCities.includes(city));

    // Сортируем оставшиеся города по алфавиту
    uniqueCities.sort((a, b) => a.localeCompare(b, 'ru'));

    // Объединяем приоритетные города и отсортированные города
    const finalCities = [...priorityCities, ...uniqueCities];

    // Обновляем выпадающий список
    const cityDropdown = document.getElementById('city');
    cityDropdown.innerHTML = '<option value="" disabled selected>Выберите город</option>';

    finalCities.forEach(city => {
        cityDropdown.innerHTML += `<option value="${city}">${city}</option>`;
    });
    
    // Сохраняем в кеш
    citiesCache = finalCities;
}

// Функция обработки изменения города
async function onCityChange() {
    const city = document.getElementById('city').value;

    // Если город не выбран – сбрасываем все поля
    if (!city) {
        resetDropdown('form', 'Сначала выберите город');
        resetDropdown('width', 'Сначала выберите форму');
        resetDropdown('length', 'Сначала выберите ширину');
        resetDropdown('frame', 'Сначала выберите длину');
        resetDropdown('arcStep', 'Выберите шаг');
        resetDropdown('polycarbonate', 'Сначала выберите город');
        resetAdditionalOptions();
        currentDeliveryDate = null;
        updateDeliveryDateDisplay();
        return;
    }

    // Проверяем кеш
    if (cityDataCache[city]) {
        currentCityData = cityDataCache[city];
    } else {
    let { data, error } = await supabaseClient
        .from('prices')
        .select('form_name, polycarbonate_type, width, length, frame_description, price, snow_load, height, horizontal_ties, equipment') // Добавлены новые поля
        .eq('city_name', city)
        .limit(30000);

    if (error) {
        console.error('Ошибка при получении данных по городу:', error);
            // Показываем понятное сообщение пользователю
            alert("Не удалось загрузить данные для выбранного города. Проверьте подключение к интернету и попробуйте снова.");
        return;
    }

    if (!data || data.length === 0) {
        alert("Данные для выбранного города не найдены. Попробуйте другой город.");
        return; // Остановить выполнение функции
    }

        // Сохраняем в кеш
        cityDataCache[city] = data;
    currentCityData = data;
    }

    // 1. Обновляем выпадающий список поликарбоната
    const polycarbonateDropdown = document.getElementById('polycarbonate');
    polycarbonateDropdown.innerHTML = '<option value="" disabled selected>Выберите поликарбонат</option>';

    // Упорядочиваем поликарбонат в порядке: Стандарт 4 мм / Люкс 4 мм / Премиум 6 мм / Без поликарбоната
    const rawPolys = currentCityData.map(g => g.polycarbonate_type).filter(Boolean);
    const uniquePoly = [...new Set(rawPolys)];
    const preferredOrder = ["Стандарт 4 мм", "Люкс 4 мм", "Премиум 6 мм", "Без поликарбоната"];

    // Сначала добавляем по порядку, если есть
    const orderedPolys = preferredOrder.filter(poly => uniquePoly.includes(poly));

    // Добавляем остальные в конец (если есть непредусмотренные значения)
    const extraPolys = uniquePoly.filter(poly => !preferredOrder.includes(poly));
    orderedPolys.push(...extraPolys);

    // Добавляем упорядоченные варианты
    orderedPolys.forEach(poly => {
        const option = document.createElement('option');
        option.value = poly;
        option.textContent = poly;
        polycarbonateDropdown.appendChild(option);
    });

    // Устанавливаем "Стандарт 4 мм" по умолчанию, если доступно
    if (uniquePoly.includes("Стандарт 4 мм")) {
        polycarbonateDropdown.value = "Стандарт 4 мм";
    } else if (uniquePoly.length > 0) {
        polycarbonateDropdown.value = orderedPolys[0]; // Выбираем первый доступный вариант
    }

    // 2. Фильтруем формы на основе availableForms
    const formCategories = Object.keys(availableForms);
    const formsAvailable = formCategories.filter(formType =>
        currentCityData.some(item => availableForms[formType].some(form => normalizeString(item.form_name) === normalizeString(form.name)))
    );

    // Сортируем формы по приоритету
    formsAvailable.sort((a, b) => (formPriority[a] || 100) - (formPriority[b] || 100)); // Прочие формы получат низкий приоритет

    // 3. Обновляем выпадающий список форм теплиц
    const formDropdown = document.getElementById('form');
    formDropdown.innerHTML = '<option value="" disabled selected>Выберите форму</option>';

    formsAvailable.forEach(form => {
        if (form && form !== "Прочие") {
            const option = document.createElement('option');
            option.value = form;
            option.textContent = form;
            formDropdown.appendChild(option);
        }
    });

    // 4. Сбрасываем размеры и каркасы
    resetDropdown('width', 'Сначала выберите форму');
    resetDropdown('length', 'Сначала выберите ширину');
    resetDropdown('frame', 'Сначала выберите длину');
    resetDropdown('arcStep', 'Выберите шаг');

    // Сброс дополнительных опций
    resetAdditionalOptions();

    // Загружаем дату доставки для выбранного города
    await loadDeliveryDate(city);
}

// Функция обработки изменения формы
function onFormChange() {
    const form = document.getElementById("form").value;

    const widthSelect = document.getElementById("width");
    widthSelect.innerHTML = '<option value="" disabled selected>Выберите ширину</option>';

    if (!form) {
        return;
    }

    // Фильтруем данные по выбранной форме на основе availableForms
    const filteredData = currentCityData.filter(item => {
        const category = getFormCategory(item.form_name);
        return category === form;
    });

    // Проверка на пустые данные
    if (filteredData.length === 0) {
        alert("Теплица с указанными параметрами не найдена. Попробуйте выбрать другие параметры.");
        return;
    }

    // Получаем уникальные значения ширины
    const uniqueWidths = [...new Set(filteredData.map(item => item.width))].sort((a, b) => a - b);

    // Заполняем выпадающий список ширины
    uniqueWidths.forEach(width => {
        widthSelect.innerHTML += `<option value="${width}">${formatPrice(width)} м</option>`;
    });

    // Сброс длины и каркасов
    resetDropdown('length', 'Сначала выберите ширину');
    resetDropdown('frame', 'Сначала выберите длину');
    resetDropdown('arcStep', 'Выберите шаг');

    // Сброс дополнительных опций
    resetAdditionalOptions();
}

// Функция обработки изменения ширины
function onWidthChange() {
    const form = document.getElementById("form").value;
    const width = parseFloat(document.getElementById("width").value);

    const lengthSelect = document.getElementById("length");
    lengthSelect.innerHTML = '<option value="" disabled selected>Выберите длину</option>';

    if (isNaN(width)) {
        return;
    }

    // Фильтруем данные по форме и ширине
    const filteredData = currentCityData.filter(item => {
        const category = getFormCategory(item.form_name);
        return category === form && parseFloat(item.width) === width;
    });

    // Проверка на пустые данные
    if (filteredData.length === 0) {
        alert("Теплица с указанными параметрами не найдена. Попробуйте выбрать другие параметры.");
        return;
    }

    // Получаем уникальные значения длины
    const uniqueLengths = [...new Set(filteredData.map(item => item.length))].sort((a, b) => a - b);

    // Заполняем выпадающий список длины
    uniqueLengths.forEach(length => {
        lengthSelect.innerHTML += `<option value="${length}">${formatPrice(length)} м</option>`;
    });

    // Сброс каркаса и шага дуг
    resetDropdown('frame', 'Сначала выберите длину');
    resetDropdown('arcStep', 'Выберите шаг');

    // Сброс дополнительных опций
    resetAdditionalOptions();
}

// Функция обработки изменения длины
function onLengthChange() {
    const form = document.getElementById("form").value;
    const width = parseFloat(document.getElementById("width").value);
    const length = parseFloat(document.getElementById("length").value);

    const frameSelect = document.getElementById("frame");
    frameSelect.innerHTML = '<option value="" disabled selected>Выберите каркас</option>';

    if (isNaN(length)) {
        return;
    }

    // Фильтруем данные по форме, ширине и длине
    const filteredData = currentCityData.filter(item => {
        const category = getFormCategory(item.form_name);
        return category === form && parseFloat(item.width) === width && parseFloat(item.length) === length;
    });

    // Проверка на пустые данные
    if (filteredData.length === 0) {
        alert("Теплица с указанными параметрами не найдена. Попробуйте выбрать другие параметры.");
        return;
    }

    // Задаём порядок сортировки каркасов
    const frameOrder = ["20х20", "40х20", "20х20+20х20", "40х20+20х20", "40х20+40х20"];

    // Получаем уникальные значения каркаса
    let uniqueFrames = [...new Set(filteredData.map(item => {
        // Отладочное логирование: вывод названия и исходного описания

        // Нормализуем описание:
        // 1. Удаляем слово "двойная" (с любыми пробелами после него)
        // 2. Удаляем "оцинкованная труба" (без учета регистра)
        // 3. Удаляем символы "мм"
        let cleanDescription = item.frame_description
            .replace(/двойная\s*/gi, "")  // добавлено удаление слова "двойная"
            .replace(/оцинкованная труба/gi, "")
            .replace(/мм/gi, "")
            .trim();

        // Убираем лишние пробелы вокруг знака "+"
        cleanDescription = cleanDescription.replace(/\s*\+\s*/g, "+");

        // Если строка содержит "+", значит, это составной каркас – возвращаем её целиком
        if (cleanDescription.includes('+')) {
            return cleanDescription;
        }

        // Если нет знака "+", ищем простое совпадение для "20х20" или "40х20"
        const matches = cleanDescription.match(/(20х20|40х20)/gi);
        if (matches) {
        }

        return matches ? matches.join(",") : cleanDescription;
    }))];

    uniqueFrames = [...new Set(uniqueFrames.flatMap(f => f.split(",")))];

    uniqueFrames.sort((a, b) => {
        const iA = frameOrder.indexOf(a.trim());
        const iB = frameOrder.indexOf(b.trim());
        if (iA === -1 && iB === -1) {
            return a.localeCompare(b);
        } else if (iA === -1) {
            return 1;
        } else if (iB === -1) {
            return -1;
        }
        return iA - iB;
    });

    uniqueFrames.forEach(frame => {
        frameSelect.innerHTML += `<option value="${frame.trim()}">${frame.trim()}</option>`;
    });

    // Сброс шага дуг
    resetDropdown('arcStep', 'Выберите шаг');

    // Сброс дополнительных опций
    resetAdditionalOptions();
}

// Функция обработки изменения каркаса
function onFrameChange() {
    // Здесь вы можете добавить дополнительную логику, если требуется
    // Например, обновление шага дуг на основе выбранного каркаса
    resetDropdown('arcStep', 'Выберите шаг');
    resetAdditionalOptions();
}

// Функция сброса выпадающих списков
function resetDropdown(elementId, placeholderText) {
    const dropdown = document.getElementById(elementId);
    if (dropdown) {
        if (elementId === 'arcStep') {
            dropdown.value = "1"; // Устанавливаем значение по умолчанию
        } else if (elementId === 'polycarbonate') {
            // Для поликарбоната устанавливаем "Стандарт 4 мм", если доступно
            const options = dropdown.options;
            let standardFound = false;
            for (let i = 0; i < options.length; i++) {
                if (normalizeString(options[i].text) === normalizeString("Стандарт 4 мм")) {
                    dropdown.selectedIndex = i;
                    standardFound = true;
                    break;
                }
            }
            if (!standardFound && options.length > 1) {
                dropdown.selectedIndex = 1; // Выбираем первый доступный вариант, если "Стандарт 4 мм" не найден
            }
        } else {
            dropdown.innerHTML = `<option value="" disabled selected>${placeholderText}</option>`;
        }
    }
}

// Функция сброса дополнительных опций
function resetAdditionalOptions() {
    const additionalProducts = document.querySelectorAll('.additional-products input[type="checkbox"]');
    additionalProducts.forEach(checkbox => {
        if (checkbox) {
            checkbox.checked = false;
        }
    });

    const additionalServices = document.querySelectorAll('.additional-services input[type="checkbox"]');
    additionalServices.forEach(checkbox => {
        if (checkbox) {
            checkbox.checked = false;
        }
    });
}

// Функция получения категории сборки на основе формы и ширины
function getAssemblyCategory(form, width) {
    return `${width}М`;
}

// Функция расчёта стоимости сборки
function calculateAssemblyCost(form, assemblyCategory, length) {
    if (!form || !assemblyPrices[form] || !assemblyPrices[form][assemblyCategory] || !assemblyPrices[form][assemblyCategory][length]) {
        return 0;
    }
    const price = assemblyPrices[form][assemblyCategory][length];
    return price;
}

// Функция расчёта стоимости теплицы
// Переменная для debounce calculateGreenhouseCost
let calculateDebounceTimer = null;

async function calculateGreenhouseCost(event = null) {
    const city = document.getElementById("city").value.trim();
    const form = document.getElementById("form").value.trim();
    const width = parseFloat(document.getElementById("width").value);
    const length = parseFloat(document.getElementById("length").value);
    const frame = document.getElementById("frame").value.trim();
    const polycarbonate = document.getElementById("polycarbonate").value.trim();
    const arcStep = parseFloat(document.getElementById("arcStep").value);

    // Проверка на заполнение всех обязательных полей
    const isFormComplete =
        city && form && !isNaN(width) && !isNaN(length) && frame && polycarbonate && !isNaN(arcStep);

    // Если поля не заполнены, проверяем изменение поликарбоната
    const isPolycarbonateChange =
        event && event.target && event.target.id === "polycarbonate";

    if (!isFormComplete) {
        if (isPolycarbonateChange) {
            return; // Не показываем alert при изменении поликарбоната
        }
        // Не показываем alert при каждом изменении - только если это явный вызов (кнопка)
        if (event && event.type === 'click') {
        alert("Пожалуйста, заполните все обязательные поля.");
        }
        return;
    }
    
    // Debounce для оптимизации - не пересчитываем при каждом изменении
    if (calculateDebounceTimer) {
        clearTimeout(calculateDebounceTimer);
    }
    
    // Если это клик по кнопке - выполняем сразу, иначе с задержкой 300ms
    const delay = (event && event.type === 'click') ? 0 : 300;
    
    calculateDebounceTimer = setTimeout(async () => {
        await performCalculation(city, form, width, length, frame, polycarbonate, arcStep);
    }, delay);
}

// Вынесена логика расчета в отдельную функцию для переиспользования
async function performCalculation(city, form, width, length, frame, polycarbonate, arcStep) {

    // Фильтрация вручную для выбранной комбинации
    const selectedEntry = currentCityData.find(item => {
        return (
            getFormCategory(item.form_name) === form &&
            parseFloat(item.width) === width &&
            parseFloat(item.length) === length &&
            normalizeString(item.frame_description.replace(/двойная\s*/gi, "")).includes(normalizeString(frame)) &&
            normalizeString(item.polycarbonate_type) === normalizeString(polycarbonate)
        );
    });

    if (!selectedEntry) {
        alert("Теплица с заданными параметрами не найдена.");
        return;
    }

    let basePrice = 0; // Стоимость теплицы
    let assemblyCost = 0; // Стоимость сборки
    let foundationCost = 0; // Стоимость основания (брус)
    let additionalProductsCost = 0; // Стоимость дополнительных товаров
    let finalTotalPrice = 0; // Итоговая стоимость

    let basePriceText = "";
    let assemblyText = "";
    let foundationText = "";
    let additionalProductsText = "";
    let deliveryText = "";

    // Берём базовую цену
    basePrice = selectedEntry.price;
    basePriceText = `Стоимость с учетом скидки - ${formatPrice(basePrice)} рублей`;

    // 1) Вытаскиваем из базы текст, например "284 кг/м2"
    let originalSnowLoadText = selectedEntry.snow_load || "0 кг/м2";

    // 2) Извлекаем только число (например "284") для расчётов
    let rawSnowLoad = originalSnowLoadText.match(/\d+(\.\d+)?/); // Находим число
    let snowLoadNum = rawSnowLoad ? parseFloat(rawSnowLoad[0]) : 0; // Преобразуем в число

    if (isNaN(snowLoadNum)) {
        snowLoadNum = 0;
    }

    // 3) Шаг дуг 0.65 м => +25% к нагрузке, + добавка к basePrice
    if (arcStep === 0.65) {
        // Находим базовую цену для "Стандарт 4мм" с учётом возможных вариантов написания
        const baseEntry = currentCityData.find(item => {
            return (
                getFormCategory(item.form_name) === form &&
                parseFloat(item.width) === width &&
                parseFloat(item.length) === length &&
                normalizeString(item.frame_description).includes(normalizeString(frame)) &&
                (normalizeString(item.polycarbonate_type) === normalizeString("стандарт4мм") ||
                    normalizeString(item.polycarbonate_type) === normalizeString("стандарт 4мм"))
            );
        });

        if (!baseEntry) {
            alert('Не найдена базовая цена для покрытия "Стандарт 4 мм".');
            return;
        }

        const basePriceStandard = baseEntry.price;
        const additionalCost = 0.25 * basePriceStandard;

        // Прибавляем к базовой цене
        basePrice += additionalCost;
        // Округляем до ближайшего 10
        basePrice = Math.ceil(basePrice / 10) * 10;
        basePriceText = `Стоимость с учетом скидки - ${formatPrice(basePrice)} рублей`;

        // Увеличиваем снеговую нагрузку на 25%
        snowLoadNum = Math.round(snowLoadNum * 1.25);
    }

    // 4) При поликарбонате Люкс => +10% к нагрузке, Премиум => +20%
    const polyStr = normalizeString(polycarbonate);
    if (polyStr === "люкс4мм" || polyStr === "люкс4 мм") {
        snowLoadNum = Math.round(snowLoadNum * 1.1);
    }
    if (polyStr === "премиум6мм" || polyStr === "премиум6 мм") {
        snowLoadNum = Math.round(snowLoadNum * 1.2);
    }

    // 5) Формируем строку для КП, например "355 кг/м2"
    let snowLoadFinalText = `${snowLoadNum} кг/м2`;

    // Дополнительные услуги
    const bracingCheckbox = document.getElementById('bracing');
    const groundHooksCheckbox = document.getElementById('ground-hooks');
    const assemblyCheckbox = document.getElementById('assembly');
    const onWoodCheckbox = document.getElementById('on-wood');
    const onConcreteCheckbox = document.getElementById('on-concrete');

    const bracingChecked = bracingCheckbox ? bracingCheckbox.checked : false;
    const groundHooksChecked = groundHooksCheckbox ? groundHooksCheckbox.checked : false;
    const assemblyChecked = assemblyCheckbox ? assemblyCheckbox.checked : false;
    const onWoodChecked = onWoodCheckbox ? onWoodCheckbox.checked : false;
    const onConcreteChecked = onConcreteCheckbox ? onConcreteCheckbox.checked : false;

    // Расчёт стоимости бруса
    if (bracingChecked) {
        const bracingPrice = additionalServicesData["Брус"].price_by_length[length];
        if (bracingPrice) {
            foundationCost += bracingPrice;
            foundationText += `\nОснование из бруса - ${formatPrice(bracingPrice)} рублей`;
        } else {
            alert(`Не найдена стоимость бруса для длины ${length} м.`);
            return;
        }
    }

    // Расчёт стоимости штырей
    if (groundHooksChecked) {
        // Если выбраны с брусом, используем соответствующие данные, иначе – другие
        const quantityData = bracingChecked
            ? additionalServicesData["Штыри"].quantity_by_length["with_bracing"]
            : additionalServicesData["Штыри"].quantity_by_length["without_bracing"];
        const stakesQuantity = quantityData[length];
        if (stakesQuantity) {
            const stakesCost = stakesQuantity * additionalServicesData["Штыри"].price_per_unit;
            foundationCost += stakesCost;
            foundationText += `\nГрунтозацепы ${stakesQuantity} шт - ${formatPrice(stakesCost)} рублей`;
        } else {
            alert(`Не найдена информация о количестве штырей для длины ${length} м.`);
            return;
        }
    }

    // Расчёт стоимости сборки (если выбрана)
    if (assemblyChecked) {
        const assemblyCategory = getAssemblyCategory(form, width); // Получаем категорию сборки
        if (assemblyCategory) {
            const assemblyCostCalculated = calculateAssemblyCost(form, assemblyCategory, length);
            if (assemblyCostCalculated > 0) {
                assemblyCost += assemblyCostCalculated;
                assemblyText += `\nСборка и установка - ${formatPrice(assemblyCostCalculated)} рублей`;
            } else {
                alert(`Не найдена стоимость сборки для формы "${form}", ширины "${width}М" и длины "${length} м".`);
                return;
            }
        } else {
            alert(`Категория сборки для формы "${form}" и ширины "${width}М" не определена.`);
            return;
        }
    }

    // Расчёт стоимости монтажа на фундамент клиента (если выбрана опция "на брус")
    if (onWoodChecked) {
        const woodPrice = onWoodCheckbox ? parseFloat(onWoodCheckbox.getAttribute('data-price')) : 0;
        if (woodPrice) {
            foundationCost += woodPrice;
            foundationText += `\nМонтаж на брус клиента - ${formatPrice(woodPrice)} рублей`;
        } else {
            alert(`Не найдена стоимость монтажа на брус.`);
            return;
        }
    }

    // Расчёт стоимости монтажа на фундамент клиента (если выбрана опция "на бетон")
    if (onConcreteChecked) {
        const concretePrice = onConcreteCheckbox ? parseFloat(onConcreteCheckbox.getAttribute('data-price')) : 0;
        if (concretePrice) {
            foundationCost += concretePrice;
            foundationText += `\nМонтаж на бетон клиента - ${formatPrice(concretePrice)} рублей`;
        } else {
            alert(`Не найдена стоимость монтажа на бетон.`);
            return;
        }
    }

    // Дополнительные товары (новая логика с выбором количества через select)
const additionalProducts = [];
const productSelects = document.querySelectorAll('.additional-products .product-item select');
productSelects.forEach(select => {
    const quantity = parseInt(select.value, 10);
    if (quantity > 0) {
        // Получаем название товара
        const productNameElement = select.parentElement.querySelector('.product-name');
        const productName = productNameElement ? productNameElement.textContent.trim() : "";
        // Если нужно исключить товары типа "перегородка", можно добавить проверку:
        if (productName.toLowerCase().includes("перегородка")) {
            return;
        }
        const productPrice = parseFloat(select.getAttribute('data-price'));
        if (!isNaN(productPrice) && productPrice > 0) {
            additionalProducts.push({ 
                name: productName, 
                cost: productPrice * quantity,
                quantity: quantity 
            });
            additionalProductsCost += productPrice * quantity;
        }
    }
});

    // Формируем текст дополнительных товаров с указанием количества, если больше 1
if (additionalProducts.length > 0) {
    additionalProductsText = additionalProducts.map(product => {
        if (product.quantity > 1) {
            return `${product.name} x ${product.quantity} - ${formatPrice(product.cost)} рублей`;
        } else {
            return `${product.name} - ${formatPrice(product.cost)} рублей`;
        }
    }).join('\n');
}

    // Итоговая стоимость (без доставки)
    finalTotalPrice = basePrice + assemblyCost + foundationCost + additionalProductsCost;

    // Округление вверх до ближайшего десятка
    finalTotalPrice = Math.ceil(finalTotalPrice / 10) * 10;

    // Получаем стоимость доставки из блока доставки
    const deliveryPrice = deliveryCost;

    // Итоговая стоимость с доставкой
    finalTotalPrice += deliveryPrice;

    // Формирование итогового резюме (которое теперь будет лишь в КП)
    let summaryText = `Итоговая стоимость теплицы: ${formatPrice(finalTotalPrice)} рублей\n`;
    summaryText += `${basePriceText}\n`;
    if (assemblyText) {
        summaryText += `${assemblyText}\n`;
    }
    if (foundationText) {
        summaryText += `${foundationText}\n`;
    }
    if (additionalProductsText) {
        summaryText += `\nДополнительные товары:\n${additionalProductsText}\n`;
    }
    if (deliveryPrice > 0) {
        summaryText += `\nДоставка - ${formatPrice(deliveryPrice)} рублей\n`;
    }
    summaryText += `\nИтоговая стоимость - ${formatPrice(finalTotalPrice)} рублей`;

    // Генерация коммерческого предложения (длинное КП)
    await generateCommercialOffer(basePrice, assemblyCost, foundationCost, additionalProducts, additionalProductsCost, deliveryPrice, finalTotalPrice, selectedEntry, basePriceText, assemblyText, foundationText, additionalProductsText, snowLoadFinalText);
    
    // Генерация короткого КП
    await generateShortOffer(finalTotalPrice, selectedEntry);
    
    // Устанавливаем активной вкладку "Короткое КП" после расчёта
    setOfferTab('short');
}

async function calculateDelivery() {
    const addressInput = document.getElementById("address");
    const address = addressInput.value.trim().toLowerCase();
    const deliveryType = document.querySelector('input[name="deliveryType"]:checked').value;

    if (!address) {
        document.getElementById('result').innerText = "Введите адрес!";
        return;
    }

    try {
        const res = await ymaps.geocode(address, { results: 1 });
        const geoObject = res.geoObjects.get(0);

        if (!geoObject) {
            document.getElementById('result').innerText = "Адрес не найден!";
            return;
        }

        // Извлекаем населённые пункты и административные области,
        // приводим их к нижнему регистру для упрощённого сравнения.
        let localities = geoObject.getLocalities().map(loc => loc.toLowerCase());
        let administrativeAreas = geoObject.getAdministrativeAreas().map(area => area.toLowerCase());


        // Проверяем, содержит ли хотя бы одно ключевое слово из массива deliveryRegions
        // любое слово из localities или administrativeAreas
        const isInDeliveryRegion = deliveryRegions.some(regionEntry => {
            return regionEntry.keywords.some(keyword =>
                localities.some(loc => loc.includes(keyword)) ||
                administrativeAreas.some(area => area.includes(keyword))
            );
        });

        if (!isInDeliveryRegion) {
            document.getElementById('result').innerText = "Доставка в этот регион не осуществляется.";
            return;
        }

        const coords = geoObject.geometry.getCoordinates();
        const destinationLat = coords[0];
        const destinationLon = coords[1];

        let cityDistances = [];

// Шаг 1: Вычисляем прямые расстояния до всех городов
citiesForMap.forEach(city => {
    const geoDistance = ymaps.coordSystem.geo.getDistance(city.coords, [destinationLat, destinationLon]) / 1000; // расстояние в км
    cityDistances.push({ city: city, geoDistance: geoDistance });
});

// Сортируем города по прямому расстоянию и берём топ-5 ближайших
cityDistances.sort((a, b) => a.geoDistance - b.geoDistance);
const topCities = cityDistances.slice(0, 5); // Берём 5 ближайших городов

// Шаг 2: Теперь строим маршруты для этих 5 городов ПАРАЛЛЕЛЬНО и выбираем наименьший
let nearestCity = null;
let minRouteDistance = Infinity;

// Делаем запросы параллельно вместо последовательно для ускорения
const routePromises = topCities.map(async (entry) => {
    try {
        const route = await ymaps.route([entry.city.coords, [destinationLat, destinationLon]]);
        const routeDistance = route.getLength() / 1000; // расстояние по дорогам в км
        return { city: entry.city, distance: routeDistance, route: route };
    } catch (error) {
        console.error("Ошибка построения маршрута для города", entry.city.name, error);
        return null;
    }
});

// Ждем все запросы параллельно
const routeResults = await Promise.all(routePromises);

// Находим ближайший город
for (const result of routeResults) {
    if (result && result.distance < minRouteDistance) {
        minRouteDistance = result.distance;
        nearestCity = result.city;
    }
}

// Проверяем, нашёлся ли ближайший город
if (!nearestCity) {
    document.getElementById('result').innerText = "Ошибка: ближайший город не найден.";
    return;
}

        mapInstance.setCenter(nearestCity.coords, 7);

        // Автоматически установить найденный город в выпадающем списке "Город"
        // Используем нормализованное сравнение для поиска правильного названия
        const cityDropdown = document.getElementById('city');
        const foundCityName = findCityInDropdown(nearestCity.name);
        
        if (foundCityName) {
            cityDropdown.value = foundCityName;
            await onCityChange(); // Ждем загрузки данных города, включая дату доставки
        } else {
            // Если не найдено, пытаемся установить напрямую
            cityDropdown.value = nearestCity.name;
            // Загружаем дату доставки для найденного города (даже если он не в списке)
            await loadDeliveryDate(nearestCity.name);
            // Пробуем снова через небольшую задержку (на случай, если список ещё загружается)
            setTimeout(async () => {
                const foundAfterDelay = findCityInDropdown(nearestCity.name);
                if (foundAfterDelay) {
                    cityDropdown.value = foundAfterDelay;
                    await onCityChange();
                }
            }, 300);
        }

        if (currentRoute) {
            mapInstance.geoObjects.remove(currentRoute);
        }

        try {
            const route = await ymaps.route([nearestCity.coords, [destinationLat, destinationLon]]);
            currentRoute = route;
            mapInstance.geoObjects.add(route);

            const distanceInKm = route.getLength() / 1000;
            const distanceFromBoundary = Math.max(distanceInKm - nearestCity.boundaryDistance, 0);

            let cost;
            if (deliveryType === "withoutAssembly") {
                cost = Math.max(1000, 500 + 40 * distanceFromBoundary);
            } else {
                cost = Math.max(1000, 40 * distanceFromBoundary);
            }

            const roundedCost = Math.ceil(cost / 50) * 50;

            deliveryCost = roundedCost; // сохраняем стоимость доставки в глобальной переменной

            // Загружаем дату доставки для найденного города
            const deliveryDate = await loadDeliveryDate(nearestCity.name);
            
            // Формируем текст результата с датой доставки
            let resultText = `Стоимость доставки: ${formatPrice(roundedCost)} рублей (${nearestCity.name})`;
            if (deliveryDate) {
                const currentYear = new Date().getFullYear();
                resultText += `\n📅 Доставка: с ${deliveryDate}.${currentYear}`;
            }
            document.getElementById('result').innerText = resultText;
        } catch (routeError) {
            document.getElementById('result').innerText = "Ошибка при расчёте маршрута.";
        }

    } catch (geocodeError) {
        document.getElementById('result').innerText = "Ошибка при расчёте. Попробуйте снова.";
    }
}

// Функция формирования коммерческого предложения
async function generateCommercialOffer(basePrice, assemblyCost, foundationCost, additionalProducts, additionalProductsCost, deliveryPrice, finalTotalPrice, selectedEntry, basePriceText, assemblyText, foundationText, additionalProductsText, snowLoadFinalText) {
    // Извлечение дополнительных характеристик
    const height = selectedEntry.height ? selectedEntry.height : "Не указано";
    const horizontalTies = selectedEntry.horizontal_ties ? selectedEntry.horizontal_ties : "Не указано";
    const equipment = selectedEntry.equipment || "Не указано";

    // Получаем название теплицы из базы данных и приводим к верхнему регистру
    const baseName = selectedEntry.form_name.toUpperCase(); // например, "ДОМИК ЛЮКС 3М"

    // Выбранная форма (например, "ДОМИКОМ" или "АРОЧНАЯ")
    const selectedForm = document.getElementById("form").value.toUpperCase();

    // Массив ключевых слов, по которым определяется форма
    const formSynonyms = [
        "ДОМИК",
        "АРОЧНАЯ",
        "КАПЛЕВИДНАЯ",
        "ПРИСТЕННАЯ",
        "ПРЯМОСТЕННАЯ",
        "МИТТЛАЙДЕР",
        "ПРОМЫШЛЕННАЯ",
        "НАВЕС"
    ];

    // Функция, которая проверяет, содержится ли выбранная форма (или её синоним)
    // в baseName. Если хотя бы одно ключевое слово из selectedForm совпадает с частью baseName, то дописывать не нужно.
    function shouldAppendForm(baseName, selectedForm) {
        // Пройдемся по ключевым словам
        for (let i = 0; i < formSynonyms.length; i++) {
            const key = formSynonyms[i];
            // Если и baseName содержит это ключевое слово, и выбранная форма тоже содержит его, значит не нужно дописывать
            if (baseName.includes(key) && selectedForm.includes(key)) {
                return false;
            }
        }
        return true;
    }

    // Формируем итоговое название теплицы
    let cleanName = baseName;
    if (shouldAppendForm(baseName, selectedForm)) {
        cleanName += ` ${selectedForm}`;
    }

    const frameValue = document.getElementById("frame").value.trim();
    const widthValue = document.getElementById("width").value.trim();
    const lengthValue = document.getElementById("length").value.trim();
    const arcStepValue = document.getElementById("arcStep").value.trim();
    const polycarbonateValue = document.getElementById("polycarbonate").value.trim();

    // Формирование строки для каркаса с добавлением суффикса ", краб система"
    let frameLine = `Каркас: ${frameValue}`;
    if (frameValue) {
        frameLine += `, краб система`;
    }

    // Формирование строки для поликарбоната с добавлением веса (если выбран вариант, отличный от "Без поликарбоната")
    let polycarbonateLine = `Поликарбонат с УФ защитой: ${polycarbonateValue}`;
    const polyNormalized = polycarbonateValue.replace(/\s+/g, "").toLowerCase();
    if (polyNormalized !== "безполикарбоната") {
        if (polyNormalized === "стандарт4мм") {
            polycarbonateLine += `, 0.47 кг/м2`;
        } else if (polyNormalized === "люкс4мм" || polyNormalized === "люкс4 мм") {
            polycarbonateLine += `, 0.52 кг/м2`;
        } else if (polyNormalized === "премиум6мм" || polyNormalized === "премиум6 мм") {
            polycarbonateLine += `, 0.8 кг/м2`;
        }
    }

    // Формирование итогового коммерческого предложения
    let commercialOffer = `${cleanName}\n\n` +
        `${frameLine}\n` +
        `Ширина: ${widthValue} м\n` +
        `Длина: ${lengthValue} м\n` +
        `Высота: ${height}\n` +
        `Шаг дуги: ${arcStepValue} м\n` +
        `${polycarbonateLine}\n` +
        `Снеговая нагрузка: ${snowLoadFinalText}\n` +
        `Горизонтальные стяжки: ${horizontalTies}\n` +
        `Комплектация: ${equipment}\n` +
        `${basePriceText}\n`;

    if (assemblyText) {
        commercialOffer += `${assemblyText}\n`;
    }
    if (foundationText) {
        commercialOffer += `${foundationText}\n`;
    }
    if (additionalProductsText) {
        commercialOffer += `\nДополнительные товары:\n${additionalProductsText}\n`;
    }
    if (deliveryPrice > 0) {
        commercialOffer += `\nДоставка - ${formatPrice(deliveryPrice)} рублей\n`;
    }
    
    // Добавляем дату доставки в КП, если она есть (опционально, управляется флагом SHOW_DELIVERY_DATE_IN_OFFER)
    // Если дата не загружена, но город выбран - пробуем загрузить
    if (SHOW_DELIVERY_DATE_IN_OFFER) {
        if (!currentDeliveryDate) {
            const selectedCity = document.getElementById("city").value;
            if (selectedCity) {
                await loadDeliveryDate(selectedCity);
            }
        }
        
        if (currentDeliveryDate) {
            const currentYear = new Date().getFullYear();
            commercialOffer += `📅 Доставка: с ${currentDeliveryDate}.${currentYear}\n`;
        }
    }
    // Формируем дату: текущая дата + 7 дней
    const currentDate = new Date();
    const expirationDate = new Date(currentDate);
    expirationDate.setDate(currentDate.getDate() + 7);
    
    // Форматируем дату в формат ДД.ММ.ГГГГ
    const day = expirationDate.getDate().toString().padStart(2, '0');
    const month = (expirationDate.getMonth() + 1).toString().padStart(2, '0');
    const year = expirationDate.getFullYear();
    const formattedDate = `${day}.${month}.${year}`;
    
    // Если сумма больше 35000 рублей - используем расширенный формат с подарком
    if (finalTotalPrice > 35000) {
        commercialOffer += `\nИтого: ${formatPrice(finalTotalPrice)} рублей\n\n` +
            `💳 Без предоплаты — оплата по факту.\n` +
            `🎁 Вам доступен подарок.\n` +
            `🌱 Бесплатное хранение до весны с сохранением цены.\n` +
            `⏳ Предложение действительно до ${formattedDate}.`;
    } else {
        // Если сумма 35000 и меньше - стандартный формат
        commercialOffer += `\nИтоговая стоимость - ${formatPrice(finalTotalPrice)} рублей\n\n` +
            `💳 Без предоплаты — оплата по факту\n` +
            `🌱 Бесплатное хранение до весны с сохранением цены.\n\n` +
            `⏳ Предложение действительно до ${formattedDate}`;
    }

    // ========== ВАРИАНТ 2: С запасом по нагрузке ==========
    const reserveVariant = pickReserveVariant();
    if (reserveVariant) {
        const finalTotalPrice2 = computeFinalTotalPriceForVariant({
            frame: reserveVariant.altFrame,
            arcStep: reserveVariant.altArcStep,
            polycarbonate: reserveVariant.altPolycarbonate
        });
        
        if (finalTotalPrice2 !== null) {
            // Генерируем полное описание второго варианта
            const variant2Description = await generateVariant2Description(
                reserveVariant.altFrame,
                reserveVariant.altArcStep,
                reserveVariant.altPolycarbonate,
                reserveVariant.reasonText,
                finalTotalPrice2,
                selectedEntry
            );
            
            if (variant2Description) {
                commercialOffer += `\n\n${variant2Description}`;
            }
        }
    }

    // Выводим сформированное КП в textarea
    document.getElementById("commercial-offer").value = commercialOffer;
}

// Функция генерации полного описания второго варианта для длинного КП
async function generateVariant2Description(altFrame, altArcStep, altPolycarbonate, reasonText, finalTotalPrice2, baseSelectedEntry) {
    try {
        const form = document.getElementById("form").value.trim();
        const width = parseFloat(document.getElementById("width").value);
        const length = parseFloat(document.getElementById("length").value);
        
        // Находим entry для альтернативного варианта
        const altEntry = currentCityData.find(item => {
            return (
                getFormCategory(item.form_name) === form &&
                parseFloat(item.width) === width &&
                parseFloat(item.length) === length &&
                normalizeString(item.frame_description.replace(/двойная\s*/gi, "")).includes(normalizeString(altFrame)) &&
                normalizeString(item.polycarbonate_type) === normalizeString(altPolycarbonate)
            );
        });
        
        if (!altEntry) {
            return null; // Вариант не найден
        }
        
        // Извлечение дополнительных характеристик
        const height = altEntry.height ? altEntry.height : "Не указано";
        const horizontalTies = altEntry.horizontal_ties ? altEntry.horizontal_ties : "Не указано";
        const equipment = altEntry.equipment || "Не указано";
        
        // Получаем название теплицы
        const baseName = altEntry.form_name.toUpperCase();
        const selectedForm = document.getElementById("form").value.toUpperCase();
        
        const formSynonyms = [
            "ДОМИК", "АРОЧНАЯ", "КАПЛЕВИДНАЯ", "ПРИСТЕННАЯ",
            "ПРЯМОСТЕННАЯ", "МИТТЛАЙДЕР", "ПРОМЫШЛЕННАЯ", "НАВЕС"
        ];
        
        function shouldAppendForm(baseName, selectedForm) {
            for (let i = 0; i < formSynonyms.length; i++) {
                const key = formSynonyms[i];
                if (baseName.includes(key) && selectedForm.includes(key)) {
                    return false;
                }
            }
            return true;
        }
        
        let cleanName = baseName;
        if (shouldAppendForm(baseName, selectedForm)) {
            cleanName += ` ${selectedForm}`;
        }
        
        // Формирование строки для каркаса
        let frameLine = `Каркас: ${altFrame}`;
        if (altFrame) {
            frameLine += `, краб система`;
        }
        
        // Формирование строки для поликарбоната
        let polycarbonateLine = `Поликарбонат с УФ защитой: ${altPolycarbonate}`;
        const polyNormalized = altPolycarbonate.replace(/\s+/g, "").toLowerCase();
        if (polyNormalized !== "безполикарбоната") {
            if (polyNormalized === "стандарт4мм") {
                polycarbonateLine += `, 0.47 кг/м2`;
            } else if (polyNormalized === "люкс4мм" || polyNormalized === "люкс4 мм") {
                polycarbonateLine += `, 0.52 кг/м2`;
            } else if (polyNormalized === "премиум6мм" || polyNormalized === "премиум6 мм") {
                polycarbonateLine += `, 0.8 кг/м2`;
            }
        }
        
        // Расчёт снеговой нагрузки (как в calculateGreenhouseCost)
        let originalSnowLoadText = altEntry.snow_load || "0 кг/м2";
        let rawSnowLoad = originalSnowLoadText.match(/\d+(\.\d+)?/);
        let snowLoadNum = rawSnowLoad ? parseFloat(rawSnowLoad[0]) : 0;
        if (isNaN(snowLoadNum)) {
            snowLoadNum = 0;
        }
        
        // Надбавка за arcStep 0.65
        if (altArcStep === 0.65) {
            snowLoadNum = Math.round(snowLoadNum * 1.25);
        }
        
        // Надбавка за поликарбонат
        if (polyNormalized === "люкс4мм" || polyNormalized === "люкс4 мм") {
            snowLoadNum = Math.round(snowLoadNum * 1.1);
        }
        if (polyNormalized === "премиум6мм" || polyNormalized === "премиум6 мм") {
            snowLoadNum = Math.round(snowLoadNum * 1.2);
        }
        
        let snowLoadFinalText = `${snowLoadNum} кг/м2`;
        
        // Получаем те же дополнительные услуги и товары (они не меняются)
        const bracingCheckbox = document.getElementById('bracing');
        const groundHooksCheckbox = document.getElementById('ground-hooks');
        const assemblyCheckbox = document.getElementById('assembly');
        const onWoodCheckbox = document.getElementById('on-wood');
        const onConcreteCheckbox = document.getElementById('on-concrete');
        
        const bracingChecked = bracingCheckbox ? bracingCheckbox.checked : false;
        const groundHooksChecked = groundHooksCheckbox ? groundHooksCheckbox.checked : false;
        const assemblyChecked = assemblyCheckbox ? assemblyCheckbox.checked : false;
        const onWoodChecked = onWoodCheckbox ? onWoodCheckbox.checked : false;
        const onConcreteChecked = onConcreteCheckbox ? onConcreteCheckbox.checked : false;
        
        // Расчёт basePrice для альтернативного варианта
        let basePrice = altEntry.price;
        if (altArcStep === 0.65) {
            const baseEntry = currentCityData.find(item => {
                return (
                    getFormCategory(item.form_name) === form &&
                    parseFloat(item.width) === width &&
                    parseFloat(item.length) === length &&
                    normalizeString(item.frame_description).includes(normalizeString(altFrame)) &&
                    (normalizeString(item.polycarbonate_type) === normalizeString("стандарт4мм") ||
                        normalizeString(item.polycarbonate_type) === normalizeString("стандарт 4мм"))
                );
            });
            if (baseEntry) {
                const basePriceStandard = baseEntry.price;
                const additionalCost = 0.25 * basePriceStandard;
                basePrice += additionalCost;
                basePrice = Math.ceil(basePrice / 10) * 10;
            }
        }
        
        // Формируем тексты для дополнительных услуг (те же, что в основном варианте)
        let assemblyText = "";
        let foundationText = "";
        let additionalProductsText = "";
        
        if (assemblyChecked) {
            const assemblyCategory = getAssemblyCategory(form, width);
            if (assemblyCategory) {
                const assemblyCostCalculated = calculateAssemblyCost(form, assemblyCategory, length);
                if (assemblyCostCalculated > 0) {
                    assemblyText = `\nСборка и установка - ${formatPrice(assemblyCostCalculated)} рублей`;
                }
            }
        }
        
        if (bracingChecked) {
            const bracingPrice = additionalServicesData["Брус"].price_by_length[length];
            if (bracingPrice) {
                foundationText += `\nОснование из бруса - ${formatPrice(bracingPrice)} рублей`;
            }
        }
        
        if (groundHooksChecked) {
            const quantityData = bracingChecked
                ? additionalServicesData["Штыри"].quantity_by_length["with_bracing"]
                : additionalServicesData["Штыри"].quantity_by_length["without_bracing"];
            const stakesQuantity = quantityData[length];
            if (stakesQuantity) {
                const stakesCost = stakesQuantity * additionalServicesData["Штыри"].price_per_unit;
                foundationText += `\nГрунтозацепы ${stakesQuantity} шт - ${formatPrice(stakesCost)} рублей`;
            }
        }
        
        if (onWoodChecked) {
            const woodPrice = onWoodCheckbox ? parseFloat(onWoodCheckbox.getAttribute('data-price')) : 0;
            if (woodPrice) {
                foundationText += `\nМонтаж на брус клиента - ${formatPrice(woodPrice)} рублей`;
            }
        }
        
        if (onConcreteChecked) {
            const concretePrice = onConcreteCheckbox ? parseFloat(onConcreteCheckbox.getAttribute('data-price')) : 0;
            if (concretePrice) {
                foundationText += `\nМонтаж на бетон клиента - ${formatPrice(concretePrice)} рублей`;
            }
        }
        
        // Дополнительные товары (те же)
        const productSelects = document.querySelectorAll('.additional-products .product-item select');
        const additionalProducts = [];
        productSelects.forEach(select => {
            const quantity = parseInt(select.value, 10);
            if (quantity > 0) {
                const productNameElement = select.parentElement.querySelector('.product-name');
                const productName = productNameElement ? productNameElement.textContent.trim() : "";
                if (!productName.toLowerCase().includes("перегородка")) {
                    const productPrice = parseFloat(select.getAttribute('data-price'));
                    if (!isNaN(productPrice) && productPrice > 0) {
                        additionalProducts.push({
                            name: productName,
                            cost: productPrice * quantity,
                            quantity: quantity
                        });
                    }
                }
            }
        });
        
        if (additionalProducts.length > 0) {
            additionalProductsText = additionalProducts.map(product => {
                if (product.quantity > 1) {
                    return `${product.name} x ${product.quantity} - ${formatPrice(product.cost)} рублей`;
                } else {
                    return `${product.name} - ${formatPrice(product.cost)} рублей`;
                }
            }).join('\n');
        }
        
        // Получаем стоимость доставки (та же)
        const deliveryPrice = deliveryCost;
        
        // Формируем описание второго варианта
        let variant2Text = `\n${'='.repeat(50)}\n`;
        variant2Text += `ВАРИАНТ 2: С запасом по нагрузке (${reasonText})\n`;
        variant2Text += `${'='.repeat(50)}\n\n`;
        variant2Text += `${cleanName}\n\n`;
        variant2Text += `${frameLine}\n`;
        variant2Text += `Ширина: ${width} м\n`;
        variant2Text += `Длина: ${length} м\n`;
        variant2Text += `Высота: ${height}\n`;
        variant2Text += `Шаг дуги: ${altArcStep} м\n`;
        variant2Text += `${polycarbonateLine}\n`;
        variant2Text += `Снеговая нагрузка: ${snowLoadFinalText}\n`;
        variant2Text += `Горизонтальные стяжки: ${horizontalTies}\n`;
        variant2Text += `Комплектация: ${equipment}\n`;
        variant2Text += `Стоимость с учетом скидки - ${formatPrice(basePrice)} рублей\n`;
        
        if (assemblyText) {
            variant2Text += `${assemblyText}\n`;
        }
        if (foundationText) {
            variant2Text += `${foundationText}\n`;
        }
        if (additionalProductsText) {
            variant2Text += `\nДополнительные товары:\n${additionalProductsText}\n`;
        }
        if (deliveryPrice > 0) {
            variant2Text += `\nДоставка - ${formatPrice(deliveryPrice)} рублей\n`;
        }
        
        variant2Text += `\nИтого: ${formatPrice(finalTotalPrice2)} рублей`;
        
        return variant2Text;
    } catch (err) {
        console.error("Ошибка при генерации описания второго варианта:", err);
        return null;
    }
}

// ==================== КОРОТКОЕ КП ====================

// Функция выбора альтернативного варианта (для ИТОГО_2)
// Новая логика: шаг дуг → каркас → поликарбонат
function pickReserveVariant() {
    const currentFrame = document.getElementById("frame").value.trim();
    const currentArcStep = parseFloat(document.getElementById("arcStep").value);
    const currentPolycarbonate = document.getElementById("polycarbonate").value.trim();
    const frameSelect = document.getElementById("frame");
    const polycarbonateSelect = document.getElementById("polycarbonate");
    
    const normalizedCurrentFrame = normalizeString(currentFrame);
    const normalizedCurrentPoly = normalizeString(currentPolycarbonate);
    
    // ========== ШАГ 1: Улучшаем шаг дуг до 0.65 (если не 0.65) ==========
    if (currentArcStep !== 0.65) {
        return {
            altFrame: currentFrame,
            altArcStep: 0.65,
            altPolycarbonate: currentPolycarbonate,
            reasonText: "усиленный шаг дуг 0.65 м"
        };
    }
    
    // ========== ШАГ 2: Улучшаем каркас (если уже 0.65) ==========
    // Проверяем, одинарный ли каркас (без "+")
    const isDoubleFrame = normalizedCurrentFrame.includes("+");
    
    if (!isDoubleFrame) {
        // ОДИНАРНЫЙ КАРКАС: 20×20 → 40×20
        if (normalizedCurrentFrame.includes("20х20") && !normalizedCurrentFrame.includes("40х20")) {
            // Ищем "40×20" (одинарный) в доступных опциях
            for (let i = 0; i < frameSelect.options.length; i++) {
                const optionValue = frameSelect.options[i].value.trim();
                const normalizedOption = normalizeString(optionValue);
                // Ищем одинарный 40×20 (без "+")
                if (normalizedOption.includes("40х20") && !normalizedOption.includes("+")) {
                    return {
                        altFrame: optionValue,
                        altArcStep: currentArcStep,
                        altPolycarbonate: currentPolycarbonate,
                        reasonText: "усиленный каркас 40×20"
                    };
                }
            }
        }
        // Если уже 40×20 (одинарный), НЕ предлагаем двойную дугу - переходим к поликарбонату
    } else {
        // ДВОЙНАЯ ДУГА: 20×20+20×20 → 40×20+20×20
        if (normalizedCurrentFrame.includes("20х20+20х20")) {
            // Ищем "40×20+20×20" в доступных опциях
            for (let i = 0; i < frameSelect.options.length; i++) {
                const optionValue = frameSelect.options[i].value.trim();
                const normalizedOption = normalizeString(optionValue);
                if (normalizedOption.includes("40х20+20х20")) {
                    return {
                        altFrame: optionValue,
                        altArcStep: currentArcStep,
                        altPolycarbonate: currentPolycarbonate,
                        reasonText: "усиленный каркас 40×20+20×20"
                    };
                }
            }
        }
        // Если уже 40×20+20×20, переходим к поликарбонату
    }
    
    // ========== ШАГ 3: Улучшаем поликарбонат (если каркас уже максимальный) ==========
    // Стандарт 4мм → Люкс 4мм (писать "усиленный")
    if (normalizedCurrentPoly.includes("стандарт") && normalizedCurrentPoly.includes("4")) {
        // Ищем "Люкс 4 мм" в доступных опциях
        for (let i = 0; i < polycarbonateSelect.options.length; i++) {
            const optionValue = polycarbonateSelect.options[i].value.trim();
            const normalizedOption = normalizeString(optionValue);
            if (normalizedOption.includes("люкс") && normalizedOption.includes("4")) {
                    return {
                        altFrame: currentFrame,
                        altArcStep: currentArcStep,
                        altPolycarbonate: optionValue,
                        reasonText: "усиленный поликарбонат"
                    };
            }
        }
    }
    
    // Люкс 4мм → Премиум 6мм (писать "Премиум усиленный")
    if (normalizedCurrentPoly.includes("люкс") && normalizedCurrentPoly.includes("4")) {
        // Ищем "Премиум 6 мм" в доступных опциях
        for (let i = 0; i < polycarbonateSelect.options.length; i++) {
            const optionValue = polycarbonateSelect.options[i].value.trim();
            const normalizedOption = normalizeString(optionValue);
            if (normalizedOption.includes("премиум") && normalizedOption.includes("6")) {
                    return {
                        altFrame: currentFrame,
                        altArcStep: currentArcStep,
                        altPolycarbonate: optionValue,
                        reasonText: "премиум поликарбонат усиленный"
                    };
            }
        }
    }
    
    // Если ничего не найдено - все уже максимально улучшено
    return null;
}

// Функция расчёта итоговой стоимости для альтернативного варианта
function computeFinalTotalPriceForVariant(overrideParams) {
    try {
        // Получаем текущие параметры из DOM
        const city = document.getElementById("city").value.trim();
        const form = document.getElementById("form").value.trim();
        const width = parseFloat(document.getElementById("width").value);
        const length = parseFloat(document.getElementById("length").value);
        
        // Применяем overrideParams
        const frame = overrideParams.frame || document.getElementById("frame").value.trim();
        const arcStep = overrideParams.arcStep !== undefined ? overrideParams.arcStep : parseFloat(document.getElementById("arcStep").value);
        const polycarbonate = overrideParams.polycarbonate || document.getElementById("polycarbonate").value.trim();
        
        // Получаем состояние чекбоксов и доп. товаров
        const bracingCheckbox = document.getElementById('bracing');
        const groundHooksCheckbox = document.getElementById('ground-hooks');
        const assemblyCheckbox = document.getElementById('assembly');
        const onWoodCheckbox = document.getElementById('on-wood');
        const onConcreteCheckbox = document.getElementById('on-concrete');
        
        const bracingChecked = bracingCheckbox ? bracingCheckbox.checked : false;
        const groundHooksChecked = groundHooksCheckbox ? groundHooksCheckbox.checked : false;
        const assemblyChecked = assemblyCheckbox ? assemblyCheckbox.checked : false;
        const onWoodChecked = onWoodCheckbox ? onWoodCheckbox.checked : false;
        const onConcreteChecked = onConcreteCheckbox ? onConcreteCheckbox.checked : false;
        
        // Получаем дополнительные товары
        const additionalProducts = [];
        const productSelects = document.querySelectorAll('.additional-products .product-item select');
        productSelects.forEach(select => {
            const quantity = parseInt(select.value, 10);
            if (quantity > 0) {
                const productPrice = parseFloat(select.getAttribute('data-price'));
                if (!isNaN(productPrice) && productPrice > 0) {
                    additionalProducts.push({ 
                        cost: productPrice * quantity
                    });
                }
            }
        });
        
        // Находим selectedEntry в currentCityData
        const selectedEntry = currentCityData.find(item => {
            return (
                getFormCategory(item.form_name) === form &&
                parseFloat(item.width) === width &&
                parseFloat(item.length) === length &&
                normalizeString(item.frame_description.replace(/двойная\s*/gi, "")).includes(normalizeString(frame)) &&
                normalizeString(item.polycarbonate_type) === normalizeString(polycarbonate)
            );
        });
        
        if (!selectedEntry) {
            return null; // Вариант не найден
        }
        
        // Расчёт basePrice (как в calculateGreenhouseCost)
        let basePrice = selectedEntry.price;
        
        // Надбавка за arcStep 0.65
        if (arcStep === 0.65) {
            const baseEntry = currentCityData.find(item => {
                return (
                    getFormCategory(item.form_name) === form &&
                    parseFloat(item.width) === width &&
                    parseFloat(item.length) === length &&
                    normalizeString(item.frame_description).includes(normalizeString(frame)) &&
                    (normalizeString(item.polycarbonate_type) === normalizeString("стандарт4мм") ||
                        normalizeString(item.polycarbonate_type) === normalizeString("стандарт 4мм"))
                );
            });
            
            if (baseEntry) {
                const basePriceStandard = baseEntry.price;
                const additionalCost = 0.25 * basePriceStandard;
                basePrice += additionalCost;
                basePrice = Math.ceil(basePrice / 10) * 10;
            }
        }
        
        // Расчёт сборки
        let assemblyCost = 0;
        if (assemblyChecked) {
            const assemblyCategory = getAssemblyCategory(form, width);
            if (assemblyCategory) {
                const assemblyCostCalculated = calculateAssemblyCost(form, assemblyCategory, length);
                if (assemblyCostCalculated > 0) {
                    assemblyCost = assemblyCostCalculated;
                }
            }
        }
        
        // Расчёт основания
        let foundationCost = 0;
        if (bracingChecked) {
            const bracingPrice = additionalServicesData["Брус"].price_by_length[length];
            if (bracingPrice) {
                foundationCost += bracingPrice;
            }
        }
        
        if (groundHooksChecked) {
            const quantityData = bracingChecked
                ? additionalServicesData["Штыри"].quantity_by_length["with_bracing"]
                : additionalServicesData["Штыри"].quantity_by_length["without_bracing"];
            const stakesQuantity = quantityData[length];
            if (stakesQuantity) {
                const stakesCost = stakesQuantity * additionalServicesData["Штыри"].price_per_unit;
                foundationCost += stakesCost;
            }
        }
        
        if (onWoodChecked) {
            const woodPrice = onWoodCheckbox ? parseFloat(onWoodCheckbox.getAttribute('data-price')) : 0;
            if (woodPrice) {
                foundationCost += woodPrice;
            }
        }
        
        if (onConcreteChecked) {
            const concretePrice = onConcreteCheckbox ? parseFloat(onConcreteCheckbox.getAttribute('data-price')) : 0;
            if (concretePrice) {
                foundationCost += concretePrice;
            }
        }
        
        // Расчёт дополнительных товаров
        let additionalProductsCost = 0;
        additionalProducts.forEach(product => {
            additionalProductsCost += product.cost;
        });
        
        // Итоговая стоимость
        let finalTotalPriceAlt = basePrice + assemblyCost + foundationCost + additionalProductsCost + deliveryCost;
        finalTotalPriceAlt = Math.ceil(finalTotalPriceAlt / 10) * 10;
        
        return finalTotalPriceAlt;
    } catch (err) {
        console.error("Ошибка при расчёте альтернативного варианта:", err);
        return null;
    }
}

// Функция генерации короткого КП
async function generateShortOffer(finalTotalPrice1, selectedEntry) {
    const form = document.getElementById("form").value.trim();
    const width = document.getElementById("width").value.trim();
    const length = document.getElementById("length").value.trim();
    
    // Получаем адрес доставки и формируем заголовок
    const addressInput = document.getElementById("address");
    const deliveryAddress = addressInput ? addressInput.value.trim() : "";
    
    // Проверяем выбранные опции
    const assemblyCheckbox = document.getElementById('assembly');
    const bracingCheckbox = document.getElementById('bracing');
    const groundHooksCheckbox = document.getElementById('ground-hooks');
    
    const assemblyChecked = assemblyCheckbox ? assemblyCheckbox.checked : false;
    const bracingChecked = bracingCheckbox ? bracingCheckbox.checked : false;
    const groundHooksChecked = groundHooksCheckbox ? groundHooksCheckbox.checked : false;
    
    // Формируем заголовок
    let title = `${form} теплица ${width}×${length}`;
    
    // Добавляем информацию о доставке, если адрес указан
    if (deliveryAddress) {
        // Извлекаем последнюю часть адреса (последний элемент после запятой)
        // Например: "Республика Татарстан (Татарстан), Пестречинский район, Шигалеевское сельское поселение, СНТ Городок" -> "СНТ Городок"
        const addressParts = deliveryAddress.split(',').map(part => part.trim());
        const lastPart = addressParts[addressParts.length - 1];
        
        if (lastPart) {
            title += ` с доставкой до ${lastPart}`;
        }
    }
    
    // Добавляем информацию о сборке и комплектации
    // Логика: если сборка выбрана - пишем "со сборкой на...", если нет - "с ... в комплекте"
    
    if (assemblyChecked) {
        // Со сборкой - можно писать "на брусе", так как сборка подразумевает установку
        if (bracingChecked && groundHooksChecked) {
            title += " со сборкой на брус с грунтозацепами";
        } else if (bracingChecked) {
            title += " со сборкой на брусе";
        } else if (groundHooksChecked) {
            title += " со сборкой с грунтозацепами";
        } else {
            title += " со сборкой";
        }
    } else {
        // Без сборки - пишем "в комплекте", чтобы не вводить в заблуждение
        if (bracingChecked && groundHooksChecked) {
            title += " с брусом и грунтозацепами в комплекте";
        } else if (bracingChecked) {
            title += " с брусом в комплекте";
        } else if (groundHooksChecked) {
            title += " с грунтозацепами в комплекте";
        }
    }
    
    // СТРОКА 1: Заголовок с полной информацией
    let shortOffer = `${title}\n\n`;
    
    // ИТОГО_1 (стандарт)
    shortOffer += `1) Стандарт: ${formatPrice(finalTotalPrice1)} ₽\n`;
    
    // ИТОГО_2 (с запасом по нагрузке)
    const reserveVariant = pickReserveVariant();
    let finalTotalPrice2 = null;
    let reasonText = null;
    
    if (reserveVariant) {
        finalTotalPrice2 = computeFinalTotalPriceForVariant({
            frame: reserveVariant.altFrame,
            arcStep: reserveVariant.altArcStep,
            polycarbonate: reserveVariant.altPolycarbonate
        });
        reasonText = reserveVariant.reasonText;
        
        // Если не посчиталось, пробуем fallback с arcStep 0.65 (только если не был уже 0.65)
        if (finalTotalPrice2 === null && reserveVariant.altArcStep !== 0.65) {
            const currentArcStep = parseFloat(document.getElementById("arcStep").value);
            if (currentArcStep !== 0.65) {
                const fallbackVariant = {
                    altFrame: reserveVariant.altFrame || document.getElementById("frame").value.trim(),
                    altArcStep: 0.65,
                    altPolycarbonate: reserveVariant.altPolycarbonate || document.getElementById("polycarbonate").value.trim(),
                    reasonText: "усиленный шаг дуг 0.65 м"
                };
                finalTotalPrice2 = computeFinalTotalPriceForVariant({
                    frame: fallbackVariant.altFrame,
                    arcStep: fallbackVariant.altArcStep,
                    polycarbonate: fallbackVariant.altPolycarbonate
                });
                if (finalTotalPrice2 !== null) {
                    reasonText = fallbackVariant.reasonText;
                }
            }
        }
    }
    
    // Добавляем строку 2, если альтернатива посчиталась
    if (finalTotalPrice2 !== null && reasonText) {
        shortOffer += `2) С запасом по нагрузке: ${formatPrice(finalTotalPrice2)} ₽ (${reasonText})\n`;
    }
    
    // Условия оплаты - лаконично, без лишних эмодзи
    shortOffer += `\nБез предоплаты. Гарантия 15 лет. Бесплатная заморозка стоимости.\n`;
    
    // Подарок - если есть
    if (finalTotalPrice1 >= 35000) {
        shortOffer += `🎁 Вам доступен подарок.\n`;
    }
    
    // Дата доставки - просто информация, без призыва к действию
    let deliveryDateText = "17 февраля"; // По умолчанию
    if (currentDeliveryDate) {
        const currentYear = new Date().getFullYear();
        deliveryDateText = currentDeliveryDate + "." + currentYear;
    }
    shortOffer += `\nБлижайшая дата доставки — ${deliveryDateText}.`;
    
    // Записываем в textarea
    const shortOfferTextarea = document.getElementById("commercial-offer-short");
    if (shortOfferTextarea) {
        shortOfferTextarea.value = shortOffer;
    }
}

// Функция переключения вкладок КП
function setOfferTab(tab) {
    console.log("setOfferTab вызвана с параметром:", tab);
    
    if (tab !== 'short' && tab !== 'long') {
        console.error("Неверный параметр tab:", tab);
        return;
    }
    
    activeOfferTab = tab;
    
    // Обновляем визуальное состояние вкладок
    const tabs = document.querySelectorAll('.kp-tab');
    console.log("Найдено вкладок:", tabs.length);
    
    if (tabs.length < 2) {
        console.error("Вкладки не найдены! Проверьте HTML.");
        return;
    }
    
    // Убираем активный класс со всех вкладок
    tabs.forEach(t => {
        t.classList.remove('active');
        t.style.display = 'block'; // Принудительно показываем
    });
    
    // Скрываем все панели
    const panels = document.querySelectorAll('.kp-panel');
    panels.forEach(p => {
        if (p) {
            p.classList.add('hidden');
            p.style.display = 'none';
        }
    });
    
    if (tab === 'short') {
        const firstTab = tabs[0];
        const shortPanel = document.getElementById('kp-panel-short');
        if (firstTab) {
            firstTab.classList.add('active');
            firstTab.style.display = 'block';
        }
        if (shortPanel) {
            shortPanel.classList.remove('hidden');
            shortPanel.style.display = 'block';
        }
        console.log("Активирована вкладка 'Короткое КП'");
    } else {
        const lastTab = tabs[1];
        const longPanel = document.getElementById('kp-panel-long');
        if (lastTab) {
            lastTab.classList.add('active');
            lastTab.style.display = 'block';
        }
        if (longPanel) {
            longPanel.classList.remove('hidden');
            longPanel.style.display = 'block';
        }
        console.log("Активирована вкладка 'Длинное КП'");
    }
}

// Функция копирования КП (копирует активную вкладку)
function copyCommercialOffer() {
    const textareaId = activeOfferTab === 'short' ? 'commercial-offer-short' : 'commercial-offer';
    const offerText = document.getElementById(textareaId);
    
    if (!offerText) {
        alert("Ошибка: текстовое поле не найдено!");
        return;
    }
    
    // Проверяем, что текст не пустой и не содержит placeholder
    const textValue = offerText.value.trim();
    if (!textValue || 
        textValue === "Здесь будет ваше короткое КП." || 
        textValue === "Здесь будет ваше коммерческое предложение.") {
        alert("Сначала рассчитайте стоимость теплицы, чтобы сформировать коммерческое предложение.");
        return;
    }
    
    offerText.select();
    offerText.setSelectionRange(0, 99999); // Для мобильных устройств

    try {
        // Используем современный API, если доступен
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textValue).then(() => {
                alert("Коммерческое предложение скопировано!");
            }).catch(() => {
                // Fallback на старый метод
    document.execCommand("copy");
                alert("Коммерческое предложение скопировано!");
            });
        } else {
            // Fallback для старых браузеров
            document.execCommand("copy");
    alert("Коммерческое предложение скопировано!");
        }
    } catch (err) {
        console.error("Ошибка при копировании:", err);
        alert("Не удалось скопировать. Попробуйте выделить текст вручную.");
    }
}

// Функция сброса всех фильтров
function resetAllFilters() {
    // Сбрасываем выпадающие списки
    resetDropdown('form', 'Сначала выберите город');
    resetDropdown('width', 'Сначала выберите форму');
    resetDropdown('length', 'Сначала выберите ширину');
    resetDropdown('frame', 'Сначала выберите длину');
    resetDropdown('arcStep', 'Выберите шаг');
    resetDropdown('polycarbonate', 'Сначала выберите город');

    // Сбрасываем все чекбоксы
    resetAdditionalOptions();

    // Сбрасываем текст КП и результатов
    const shortOfferTextarea = document.getElementById("commercial-offer-short");
    const longOfferTextarea = document.getElementById("commercial-offer");
    
    if (shortOfferTextarea) {
        shortOfferTextarea.value = "Здесь будет ваше короткое КП.";
    }
    if (longOfferTextarea) {
        longOfferTextarea.value = "Здесь будет ваше коммерческое предложение.";
    }
    
    // Возвращаем активной вкладку "Короткое КП"
    setOfferTab('short');
    
    document.getElementById("result").innerText = "";

    // Очищаем карту
    if (mapInstance && currentRoute) {
        mapInstance.geoObjects.remove(currentRoute);
    }

    // Сброс глобальной переменной стоимости доставки
    deliveryCost = 0;
}

// Функция сброса доставки
function resetDelivery() {
    document.getElementById("address").value = "";
    document.getElementById("result").innerText = "";

    // Удаляем маршрут с карты, если есть
    if (mapInstance && currentRoute) {
        mapInstance.geoObjects.remove(currentRoute);
    }

    // Сброс глобальной переменной стоимости доставки
    deliveryCost = 0;
    // Не сбрасываем currentDeliveryDate, т.к. она привязана к выбранному городу
}

// Инициализация при загрузке страницы
window.onload = async function () {
    if (localStorage.getItem('appVersion') !== APP_VERSION) {
        localStorage.clear();
    }
    const savedLogin = localStorage.getItem('savedLogin');
    
    if (savedLogin) {
        // Убеждаемся, что admin флаг установлен, если это admin (ДО проверки пароля)
        if (savedLogin === 'admin' || savedLogin.toLowerCase() === 'admin') {
            localStorage.setItem(ADMIN_KEY, 'true');
        }
        
        // Проверяем актуальность версии пароля
        const isPasswordValid = await checkPasswordVersion();
        if (isPasswordValid) {
            document.getElementById("login").value = savedLogin;
            document.getElementById("password").focus();
            document.getElementById("auth-container").classList.add("hidden");
            document.getElementById("calculator-container").classList.remove("hidden");
            
            await initializeCalculator();
        } else {
            // Версия пароля не совпадает - разлогиниваем
            localStorage.clear();
            document.getElementById("login").value = savedLogin;
        }
    } else {
    }
    
    // Периодическая проверка версии пароля каждые 5 минут (увеличено с 30 секунд)
    // Проверка только если страница видна и пользователь залогинен
    setInterval(async () => {
        const savedLogin = localStorage.getItem('savedLogin');
        if (savedLogin && document.getElementById("calculator-container") && !document.getElementById("calculator-container").classList.contains("hidden")) {
            // Тихо проверяем версию пароля (не разлогиниваем при сетевых ошибках)
            await checkPasswordVersion();
        }
    }, 300000); // Проверка каждые 5 минут (300000 мс) вместо 30 секунд
    
    // Принудительная проверка кнопки админа через 1 секунду (на случай задержки)
    setTimeout(() => {
        const savedLogin = localStorage.getItem('savedLogin');
        if (savedLogin === 'admin' || savedLogin?.toLowerCase() === 'admin') {
            const adminBtn = document.getElementById('admin-button');
            if (adminBtn) {
                adminBtn.classList.remove('hidden');
                adminBtn.style.display = 'block';
                adminBtn.style.visibility = 'visible';
            } else {
                console.error("❌ Кнопка admin-button всё ещё не найдена после задержки");
            }
        }
    }, 1000);
}

// Функция загрузки городов при инициализации калькулятора
async function initializeCalculator() {
    await loadCities();
    // addAdditionalProductsEventListeners() - не нужна, т.к. в HTML уже есть onchange
    
    // Убираем дублирование - в HTML уже есть onchange для polycarbonate и arcStep
    // document.getElementById("polycarbonate").addEventListener("change", calculateGreenhouseCost);
    // document.getElementById("arcStep").addEventListener("change", calculateGreenhouseCost);
    
    // Устанавливаем активной вкладку "Короткое КП" по умолчанию
    setOfferTab('short');
    
    // Проверяем права админа и показываем/скрываем кнопку админ-панели
    const savedLogin = localStorage.getItem('savedLogin');
    
    // СТРОГАЯ проверка: только пользователь с логином точно "admin" (без пробелов, без регистра)
    const isAdmin = savedLogin && savedLogin.trim().toLowerCase() === 'admin';
    
    // Если это админ, но флаг не установлен - устанавливаем
    if (isAdmin && localStorage.getItem(ADMIN_KEY) !== 'true') {
        localStorage.setItem(ADMIN_KEY, 'true');
    }
    
    // Если это НЕ админ, обязательно удаляем флаг
    if (!isAdmin) {
        localStorage.removeItem(ADMIN_KEY);
    }
    
    // Даём немного времени на рендеринг DOM
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const adminButton = document.getElementById("admin-button");
    
    if (adminButton) {
        if (isAdmin) {
            adminButton.classList.remove("hidden");
            adminButton.style.display = "block";
            adminButton.style.visibility = "visible";
            await loadUsersForAdmin(); // Загружаем список пользователей для админ-панели
        } else {
            adminButton.classList.add("hidden");
            adminButton.style.display = "none";
            adminButton.style.visibility = "hidden";
        }
    }
}

// Функция добавления обработчиков событий для дополнительных опций
// ЗАМЕЧАНИЕ: Эта функция больше не используется, т.к. все обработчики уже есть в HTML через onchange
// Оставлена для совместимости, но не вызывается
function addAdditionalProductsEventListeners() {
    // Все обработчики уже в HTML через onchange="calculateGreenhouseCost()"
    // Дублирование убрано для оптимизации
}

// Код Яндекс.Карт для подсказок (восстановлен из рабочей версии - БЕЗ debounce)
ymaps.ready(() => {
    const input = document.getElementById('address'); // Поле ввода адреса
    const resultsContainer = document.getElementById('suggestions'); // Используем существующий блок

    input.addEventListener('input', () => {
        const query = input.value.trim();

        if (query.length > 2) {
            ymaps.geocode(query, { results: 5 }).then(res => {
                const items = res.geoObjects.toArray();
                resultsContainer.innerHTML = ''; // Очищаем старые подсказки

                if (items.length === 0) {
                    resultsContainer.style.display = 'none'; // Скрываем контейнер, если нет результатов
                    return;
                } else {
                    resultsContainer.style.display = 'block'; // Показываем контейнер
                }

                items.forEach(item => {
                    const suggestion = document.createElement('div');
                    suggestion.classList.add('suggestion');

                    // Выделяем совпадения жирным
                    const regex = new RegExp(`(${query})`, 'gi');
                    const address = item.getAddressLine();
                    const highlightedAddress = address.replace(regex, '<span class="highlight">$1</span>');
                    suggestion.innerHTML = highlightedAddress;

                    suggestion.addEventListener('click', () => {
                        input.value = address;
                        resultsContainer.innerHTML = ''; // Убираем подсказки
                        resultsContainer.style.display = 'none'; // Скрываем контейнер
                        calculateDelivery(); // Автоматически рассчитываем доставку при выборе адреса
                    });

                    resultsContainer.appendChild(suggestion);
                });
            }).catch(err => {
                console.error('Ошибка при получении геокодинга:', err);
                resultsContainer.style.display = 'none'; // Скрываем контейнер при ошибке
            });
        } else {
            resultsContainer.innerHTML = ''; // Убираем подсказки при коротком вводе
            resultsContainer.style.display = 'none'; // Скрываем контейнер
        }
    });

    // Закрытие подсказок при клике вне области
    document.addEventListener('click', (event) => {
        if (!document.querySelector('.address-container').contains(event.target)) {
            resultsContainer.style.display = 'none';
        }
    });
});

// ==================== АДМИН-ПАНЕЛЬ ====================

// Загрузка списка пользователей для админ-панели
async function loadUsersForAdmin() {
    try {
        const { data, error } = await supabaseClient
            .from('users')
            .select('id, login, is_active')
            .order('login');

        if (error) {
            console.error("Ошибка при загрузке пользователей:", error);
            return;
        }

        const userSelect = document.getElementById('admin-user-select');
        if (!userSelect) return;

        userSelect.innerHTML = '<option value="" disabled selected>Выберите пользователя</option>';
        
        if (data && data.length > 0) {
            data.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = `${user.login}${!user.is_active ? ' (неактивен)' : ''}`;
                userSelect.appendChild(option);
            });
        }
    } catch (err) {
        console.error("Ошибка при загрузке пользователей:", err);
    }
}

// Переключение видимости админ-панели
function toggleAdminPanel() {
    const adminPanel = document.getElementById("admin-panel");
    if (!adminPanel) return;

    const isHidden = adminPanel.classList.contains("hidden");
    
    if (isHidden) {
        // Проверяем права админа перед показом
        const isAdmin = localStorage.getItem(ADMIN_KEY) === 'true';
        if (!isAdmin) {
            alert("У вас нет прав доступа к админ-панели.");
            return;
        }
        adminPanel.classList.remove("hidden");
        loadUsersForAdmin();
        // Очищаем поля при открытии
        document.getElementById("admin-new-password").value = "";
        document.getElementById("admin-confirm-password").value = "";
        document.getElementById("admin-message").innerText = "";
    } else {
        adminPanel.classList.add("hidden");
    }
}

// Изменение пароля пользователя
async function changeUserPassword() {
    const userId = document.getElementById("admin-user-select").value;
    const newPassword = document.getElementById("admin-new-password").value.trim();
    const confirmPassword = document.getElementById("admin-confirm-password").value.trim();
    const messageDiv = document.getElementById("admin-message");

    // Валидация
    if (!userId) {
        messageDiv.innerText = "Выберите пользователя!";
        messageDiv.style.color = "red";
        return;
    }

    if (!newPassword) {
        messageDiv.innerText = "Введите новый пароль!";
        messageDiv.style.color = "red";
        return;
    }

    if (newPassword.length < 6) {
        messageDiv.innerText = "Пароль должен содержать минимум 6 символов!";
        messageDiv.style.color = "red";
        return;
    }

    if (newPassword !== confirmPassword) {
        messageDiv.innerText = "Пароли не совпадают!";
        messageDiv.style.color = "red";
        return;
    }

    // Проверяем права админа
    const isAdmin = localStorage.getItem(ADMIN_KEY) === 'true';
    if (!isAdmin) {
        messageDiv.innerText = "У вас нет прав для изменения паролей!";
        messageDiv.style.color = "red";
        return;
    }

    try {
        // Получаем логин пользователя
        const userSelect = document.getElementById("admin-user-select");
        const userLogin = userSelect.selectedOptions[0].textContent.split(' (')[0]; // Убираем "(неактивен)" если есть
        
        // Пробуем вызвать RPC функцию
        const { data: rpcData, error: rpcError } = await supabaseClient.rpc('update_user_password', {
            p_login: userLogin,
            p_new_password: newPassword
        });

        if (rpcError) {
            // Если RPC не работает, пытаемся обновить напрямую (может не работать из-за RLS политик)
            // Получаем текущую версию пароля
            const { data: currentUser, error: fetchError } = await supabaseClient
                .from('users')
                .select('password_version')
                .eq('id', userId)
                .single();

            if (fetchError) {
                throw new Error(`Не удалось получить данные пользователя: ${fetchError.message}`);
            }

            // Пробуем обновить напрямую
            const { error: updateError } = await supabaseClient
                .from('users')
                .update({
                    password: newPassword,
                    password_version: (currentUser.password_version || 1) + 1,
                    last_password_change: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (updateError) {
                // Если обновление не работает через anon роль (что вероятно из-за RLS)
                // Показываем инструкцию для использования SQL Editor
                const sqlQuery = `UPDATE users 
SET password = '${newPassword}', 
    password_version = password_version + 1, 
    last_password_change = NOW(),
    updated_at = NOW()
WHERE id = ${userId};`;
                
                messageDiv.innerHTML = `
                    <strong style="color: orange;">⚠️ Не удалось изменить пароль через интерфейс.</strong><br><br>
                    <strong>Используйте SQL Editor в Supabase:</strong><br>
                    <textarea style="width: 100%; height: 80px; margin-top: 10px; font-family: monospace;" readonly>${sqlQuery}</textarea>
                    <p style="margin-top: 10px;">Скопируйте SQL запрос выше и выполните его в SQL Editor вашего Supabase проекта.</p>
                    <p><strong>Или</strong> обновите политику RLS для таблицы users, разрешив админам обновлять пароли.</p>
                `;
                messageDiv.style.color = "orange";
                console.error("Ошибка обновления пароля:", updateError);
                return;
            }
        }

        // Если всё успешно
        messageDiv.innerText = `✅ Пароль успешно изменён! Все пользователи с логином "${userLogin}" будут разлогинены в течение 30 секунд.`;
        messageDiv.style.color = "green";

        // Очищаем поля
        document.getElementById("admin-new-password").value = "";
        document.getElementById("admin-confirm-password").value = "";
        document.getElementById("admin-user-select").value = "";

        // Перезагружаем список пользователей
        await loadUsersForAdmin();

    } catch (err) {
        console.error("Ошибка при изменении пароля:", err);
        messageDiv.innerText = `❌ Ошибка: ${err.message}`;
        messageDiv.style.color = "red";
    }
}

// ==================== МОДАЛЬНОЕ ОКНО С ДАТАМИ ДОСТАВКИ ====================

// Функция открытия модального окна с датами доставки
async function showDeliveryDatesModal() {
    console.log("Кнопка нажата, открываем модальное окно...");
    
    const modal = document.getElementById('delivery-dates-modal');
    const loadingDiv = document.getElementById('delivery-dates-loading');
    const contentDiv = document.getElementById('delivery-dates-content');
    
    if (!modal) {
        console.error("❌ Модальное окно не найдено!");
        alert("Ошибка: модальное окно не найдено. Обновите страницу.");
        return;
    }
    
    console.log("Модальное окно найдено, открываем...");
    
    try {
        // Убираем класс hidden и принудительно показываем модальное окно
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        console.log("Класс 'hidden' удален, display установлен в flex");
        console.log("Computed display:", window.getComputedStyle(modal).display);
        console.log("Computed visibility:", window.getComputedStyle(modal).visibility);
        
        // Показываем загрузку
        if (loadingDiv) {
            loadingDiv.style.display = 'block';
            loadingDiv.innerHTML = 'Загрузка данных...';
        }
        
        // Скрываем контент
        if (contentDiv) {
            contentDiv.style.display = 'none';
        }
        
        // Загружаем все даты доставки
        console.log("Начинаем загрузку данных...");
        await loadAllDeliveryDates();
        console.log("Данные загружены");
        
        // Скрываем загрузку и показываем контент
        if (loadingDiv) {
            loadingDiv.style.display = 'none';
        }
        if (contentDiv) {
            contentDiv.style.display = 'block';
        }
        
        console.log("Модальное окно должно быть видно!");
    } catch (err) {
        console.error("❌ Ошибка при открытии модального окна:", err);
        if (loadingDiv) {
            loadingDiv.innerHTML = '<div class="no-data" style="color: red; padding: 20px;">Ошибка загрузки данных. Проверьте подключение к интернету.<br><br>' + err.message + '</div>';
        }
    }
}

// Убеждаемся, что функция доступна глобально
window.showDeliveryDatesModal = showDeliveryDatesModal;
window.closeDeliveryDatesModal = closeDeliveryDatesModal;

// Функция закрытия модального окна
function closeDeliveryDatesModal() {
    console.log("Закрываем модальное окно...");
    const modal = document.getElementById('delivery-dates-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
        console.log("Модальное окно закрыто");
    }
}

// Функция загрузки всех дат доставки из Supabase
async function loadAllDeliveryDates() {
    const container = document.getElementById('delivery-dates-table-container');
    if (!container) {
        console.error("Контейнер для таблицы не найден!");
        return;
    }

    try {
        // Загружаем только базовые поля (без restrictions, т.к. поле может отсутствовать)
        const { data, error } = await supabaseClient
            .from('delivery_dates')
            .select('city_name, delivery_date')
            .order('city_name');

        // Добавляем пустое поле restrictions для совместимости с кодом отрисовки
        let dataWithRestrictions = null;
        if (data && !error) {
            dataWithRestrictions = data.map(item => ({ ...item, restrictions: null }));
        }

        if (error) {
            console.error("Ошибка при загрузке дат доставки:", error);
            container.innerHTML = 
                '<div class="no-data" style="color: red; padding: 20px;">Ошибка загрузки данных из базы. Проверьте подключение к Supabase.<br><br>Детали: ' + (error.message || 'Неизвестная ошибка') + '</div>';
            return;
        }

        if (!dataWithRestrictions || dataWithRestrictions.length === 0) {
            container.innerHTML = 
                '<div class="no-data">Данные о датах доставки отсутствуют в базе данных.</div>';
            return;
        }

        // Формируем таблицу
        renderDeliveryDatesTable(dataWithRestrictions);
        
        // Добавляем обработчик поиска
        setupDeliveryDatesSearch(dataWithRestrictions);
        
    } catch (err) {
        console.error("Ошибка при загрузке дат доставки:", err);
        if (container) {
            container.innerHTML = 
                '<div class="no-data" style="color: red; padding: 20px;">Критическая ошибка: ' + (err.message || 'Неизвестная ошибка') + '</div>';
        }
    }
}

// Функция отрисовки таблицы с датами доставки
function renderDeliveryDatesTable(data) {
    const container = document.getElementById('delivery-dates-table-container');
    
    if (!data || data.length === 0) {
        container.innerHTML = '<div class="no-data">Нет данных для отображения.</div>';
        return;
    }

    let html = '<table class="delivery-dates-table">';
    html += '<thead><tr>';
    html += '<th style="width: 40%;">Город</th>';
    html += '<th style="width: 30%;">Дата доставки</th>';
    html += '<th style="width: 30%;">Ограничения</th>';
    html += '</tr></thead>';
    html += '<tbody>';
    
    data.forEach(item => {
        const currentYear = new Date().getFullYear();
        const deliveryDateText = item.delivery_date ? `с ${item.delivery_date}.${currentYear}` : 'Не указано';
        
        let restrictionsText = '';
        if (item.restrictions && item.restrictions.trim()) {
            const restrictions = item.restrictions.split(',').map(r => r.trim()).filter(r => r);
            if (restrictions.length > 0) {
                restrictionsText = `кроме ${restrictions.join(', ')}`;
            }
        }
        
        html += '<tr>';
        html += `<td class="city-name">${item.city_name}</td>`;
        html += `<td class="delivery-date">${deliveryDateText}</td>`;
        html += `<td class="delivery-restrictions">${restrictionsText || '—'}</td>`;
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// Функция настройки поиска по городам
function setupDeliveryDatesSearch(allData) {
    const searchInput = document.getElementById('delivery-dates-search');
    if (!searchInput) return;
    
    // Очищаем предыдущий обработчик
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);
    
    newSearchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.trim().toLowerCase();
        
        if (!searchTerm) {
            renderDeliveryDatesTable(allData);
            return;
        }
        
        const filtered = allData.filter(item => {
            const cityName = normalizeCityName(item.city_name);
            const searchNormalized = normalizeCityName(searchTerm);
            return cityName.includes(searchNormalized) || searchNormalized.includes(cityName);
        });
        
        renderDeliveryDatesTable(filtered);
    });
}

// Убеждаемся, что функции доступны глобально для onclick
window.showDeliveryDatesModal = showDeliveryDatesModal;
window.closeDeliveryDatesModal = closeDeliveryDatesModal;
window.setOfferTab = setOfferTab;

// Закрытие модального окна при клике вне его (инициализация при загрузке)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDeliveryDatesModal);
} else {
    initDeliveryDatesModal();
}

function initDeliveryDatesModal() {
    document.addEventListener('click', (event) => {
        const modal = document.getElementById('delivery-dates-modal');
        if (modal && !modal.classList.contains('hidden')) {
            const modalContent = modal.querySelector('.delivery-dates-modal-content');
            if (modalContent && !modalContent.contains(event.target) && event.target === modal) {
                closeDeliveryDatesModal();
            }
        }
    });

    // Закрытие модального окна по клавише Escape
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeDeliveryDatesModal();
        }
    });
}
