import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// ========== НАСТРОЙКА FIREBASE ==========
// Для работы синхронизации вставьте сюда данные своего проекта Firebase.
const firebaseConfig = {
    apiKey: "PASTE_YOUR_API_KEY",
    authDomain: "PASTE_YOUR_AUTH_DOMAIN",
    databaseURL: "PASTE_YOUR_DATABASE_URL",
    projectId: "PASTE_YOUR_PROJECT_ID",
    storageBucket: "PASTE_YOUR_STORAGE_BUCKET",
    messagingSenderId: "PASTE_YOUR_MESSAGING_SENDER_ID",
    appId: "PASTE_YOUR_APP_ID"
};

const firebaseReady = !Object.values(firebaseConfig).some(value => String(value).startsWith("PASTE_"));
let db = null;
let announcementRef = null;

if (firebaseReady) {
    const app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    announcementRef = ref(db, 'olimp/sharedAnnouncement');
}

// ========== ДАННЫЕ ДЛЯ КЛИЕНТОВ ==========
const clientsData = [
    {
        client_id: 1001,
        client_name: "Иванов Петр",
        membership_type: "Фитнес",
        goal: "Похудение",
        experience_level: "Новичок (0-2 лет)",
        medical_restrictions: "Нет ограничений",
        age_group: "Взрослые (18-59)",
        preferred_activity_type: "Кардио",
        training_format: "Групповые"
    },
    {
        client_id: 1002,
        client_name: "Сидорова Анна",
        membership_type: "Бассейн",
        goal: "Поддержание формы",
        experience_level: "Опытный (2-5 лет)",
        medical_restrictions: "Проблемы с суставами",
        age_group: "Взрослые (18-59)",
        preferred_activity_type: "Функциональные",
        training_format: "Персональные"
    },
    {
        client_id: 1003,
        client_name: "Козлов Дмитрий",
        membership_type: "Комбо",
        goal: "Набор массы",
        experience_level: "Профессионал (от 5 лет)",
        medical_restrictions: "Нет ограничений",
        age_group: "Взрослые (18-59)",
        preferred_activity_type: "Силовые",
        training_format: "Персональные"
    },
    {
        client_id: 1004,
        client_name: "Морозова Елена",
        membership_type: "Фитнес",
        goal: "Реабилитация",
        experience_level: "Новичок (0-2 лет)",
        medical_restrictions: "Послеоперационная реабилитация",
        age_group: "Взрослые (18-59)",
        preferred_activity_type: "Функциональные",
        training_format: "Персональные"
    },
    {
        client_id: 1005,
        client_name: "Волков Сергей",
        membership_type: "Комбо",
        goal: "Повышение выносливости",
        experience_level: "Опытный (2-5 лет)",
        medical_restrictions: "Нет ограничений",
        age_group: "Взрослые (18-59)",
        preferred_activity_type: "Кардио",
        training_format: "Групповые"
    }
];

const recommendationsData = {
    1001: ["Кардио-тренировка (групповая)", "Функциональный тренинг", "Стретчинг"],
    1002: ["Aqua-фитнес", "Кинезиотейпирование", "SMR-сессия (роллинг)"],
    1003: ["Персональная тренировка (зал)", "Спортивный массаж", "Функциональный тренинг"],
    1004: ["SMR-сессия (роллинг)", "Стретчинг", "Оздоровительная гимнастика"],
    1005: ["Кардио-тренировка (групповая)", "Плавание с инструктором", "Функциональный тренинг"]
};

// ========== ДАННЫЕ ДЛЯ КОНСУЛЬТАНТА ==========
let originalServices = null;
let currentServices = null;
let anomalyIndices = new Set();
let stats = { mean: 0, sigma: 0, lowerBound: 0, upperBound: 0 };

// ========== АВТОРИЗАЦИЯ ==========
const users = {
    consultant: { password: "123", role: "consultant", name: "Консультант" },
    client: { password: "123", role: "client", name: "Клиент" }
};

let currentUser = null;

const loginForm = document.getElementById('loginForm');
const consultantPanel = document.getElementById('consultantPanel');
const clientPanel = document.getElementById('clientPanel');
const loginInput = document.getElementById('loginInput');
const passwordInput = document.getElementById('passwordInput');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const sharedAnnouncementInput = document.getElementById('sharedAnnouncementInput');
const sharedAnnouncementView = document.getElementById('sharedAnnouncementView');
const saveSharedAnnouncementBtn = document.getElementById('saveSharedAnnouncementBtn');
const syncStatus = document.getElementById('syncStatus');

function showLoginForm() {
    loginForm.style.display = 'block';
    consultantPanel.style.display = 'none';
    clientPanel.style.display = 'none';
    currentUser = null;
}

function showConsultantPanel() {
    loginForm.style.display = 'none';
    consultantPanel.style.display = 'block';
    clientPanel.style.display = 'none';
}

function showClientPanel() {
    loginForm.style.display = 'none';
    consultantPanel.style.display = 'none';
    clientPanel.style.display = 'block';

    const client = clientsData[0];
    displayClientProfile(client);
    displayRecommendations(client.client_id);
}

function displayClientProfile(client) {
    const profileDiv = document.getElementById('clientProfile');
    profileDiv.innerHTML = `
        <div class="client-card">
            <p><strong>Клиент:</strong> ${client.client_name}</p>
            <p><strong>ID клиента:</strong> ${client.client_id}</p>
            <p><strong>Тип абонемента:</strong> ${client.membership_type}</p>
            <p><strong>Цель посещения:</strong> ${client.goal}</p>
            <p><strong>Опыт занятий:</strong> ${client.experience_level}</p>
            <p><strong>Медицинские ограничения:</strong> ${client.medical_restrictions}</p>
            <p><strong>Возрастная категория:</strong> ${client.age_group}</p>
            <p><strong>Предпочитаемый вид активности:</strong> ${client.preferred_activity_type}</p>
            <p><strong>Формат тренировок:</strong> ${client.training_format}</p>
        </div>
    `;
}

function displayRecommendations(clientId) {
    const recs = recommendationsData[clientId] || ["Нет рекомендаций"];
    const recDiv = document.getElementById('recommendedServices');
    recDiv.innerHTML = recs.map(service => `
        <div class="service-item">
            <strong>🏋️ ${service}</strong>
        </div>
    `).join('');
}

function setAnnouncementText(text) {
    const safeText = text?.trim() || 'Здесь будет отображаться общее объявление.';
    if (sharedAnnouncementInput) sharedAnnouncementInput.value = safeText === 'Здесь будет отображаться общее объявление.' ? '' : safeText;
    if (sharedAnnouncementView) sharedAnnouncementView.textContent = safeText;
}

function initSharedAnnouncement() {
    if (!firebaseReady) {
        syncStatus.textContent = 'Firebase не подключен. Для реальной синхронизации между ПК и смартфоном вставьте настройки проекта Firebase.';
        const localValue = localStorage.getItem('olimp_shared_announcement') || '';
        setAnnouncementText(localValue);
        return;
    }

    syncStatus.textContent = 'Firebase подключен. Изменения синхронизируются между устройствами в реальном времени.';
    onValue(announcementRef, (snapshot) => {
        const data = snapshot.val();
        const text = data?.text || '';
        setAnnouncementText(text);
    });
}

async function saveSharedAnnouncement() {
    const text = sharedAnnouncementInput.value.trim();

    if (!firebaseReady) {
        localStorage.setItem('olimp_shared_announcement', text);
        setAnnouncementText(text);
        syncStatus.textContent = 'Firebase не подключен. Изменение сохранено только в этом браузере.';
        return;
    }

    try {
        await set(announcementRef, {
            text,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser?.name || 'Пользователь'
        });
        syncStatus.textContent = 'Объявление сохранено. Изменения видны на других устройствах.';
    } catch (error) {
        syncStatus.textContent = `Ошибка синхронизации: ${error.message}`;
    }
}

loginBtn.addEventListener('click', () => {
    const login = loginInput.value.trim();
    const password = passwordInput.value.trim();

    if (users[login] && users[login].password === password) {
        currentUser = { login, ...users[login] };
        loginError.style.display = 'none';

        if (currentUser.role === 'consultant') {
            showConsultantPanel();
            initConsultantPanel();
        } else if (currentUser.role === 'client') {
            showClientPanel();
        }
    } else {
        loginError.style.display = 'block';
    }
});

saveSharedAnnouncementBtn?.addEventListener('click', saveSharedAnnouncement);

// ========== ФУНКЦИИ КОНСУЛЬТАНТА ==========
let fileInput, detectBtn, statusDiv, servicesTableContainer, servicesTableBody;
let anomalyEditPanel, exportPanel, statsSummarySpan, applyCorrectionsBtn, resetToOriginalBtn, exportJsonBtn;

function initConsultantPanel() {
    fileInput = document.getElementById('fileInput');
    detectBtn = document.getElementById('detectBtn');
    statusDiv = document.getElementById('statusMessage');
    servicesTableContainer = document.getElementById('servicesTableContainer');
    servicesTableBody = document.getElementById('servicesTableBody');
    anomalyEditPanel = document.getElementById('anomalyEditPanel');
    exportPanel = document.getElementById('exportPanel');
    statsSummarySpan = document.getElementById('statsSummary');
    applyCorrectionsBtn = document.getElementById('applyCorrectionsBtn');
    resetToOriginalBtn = document.getElementById('resetToOriginalBtn');
    exportJsonBtn = document.getElementById('exportJsonBtn');

    originalServices = null;
    currentServices = null;
    anomalyIndices.clear();

    if (servicesTableContainer) servicesTableContainer.style.display = 'none';
    if (anomalyEditPanel) anomalyEditPanel.style.display = 'none';
    if (exportPanel) exportPanel.style.display = 'none';
    if (detectBtn) detectBtn.disabled = true;
    if (statusDiv) statusDiv.style.display = 'none';

    if (fileInput) {
        fileInput.removeEventListener('change', fileChangeHandler);
        fileInput.addEventListener('change', fileChangeHandler);
    }
    if (detectBtn) {
        detectBtn.removeEventListener('click', detectHandler);
        detectBtn.addEventListener('click', detectHandler);
    }
    if (applyCorrectionsBtn) {
        applyCorrectionsBtn.removeEventListener('click', applyHandler);
        applyCorrectionsBtn.addEventListener('click', applyHandler);
    }
    if (resetToOriginalBtn) {
        resetToOriginalBtn.removeEventListener('click', resetHandler);
        resetToOriginalBtn.addEventListener('click', resetHandler);
    }
    if (exportJsonBtn) {
        exportJsonBtn.removeEventListener('click', exportHandler);
        exportJsonBtn.addEventListener('click', exportHandler);
    }
}

function fileChangeHandler(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
        loadServicesFromJson(ev.target.result, file.name);
    };
    reader.onerror = () => showMessage('Ошибка чтения файла.', true);
    reader.readAsText(file, 'UTF-8');
}

function detectHandler() {
    detectAnomaliesAndHighlight();
}

function applyHandler() {
    applyCorrections();
}

function resetHandler() {
    resetToOriginalPrices();
}

function exportHandler() {
    exportToJson();
}

function showMessage(text, isError = false, isSuccess = false) {
    if (!statusDiv) return;
    statusDiv.style.display = 'block';
    statusDiv.textContent = text;
    statusDiv.className = '';
    if (isError) statusDiv.classList.add('error-status');
    else if (isSuccess) statusDiv.classList.add('success-status');
}

function calculateStatsAndAnomalies(servicesArray) {
    if (!servicesArray || servicesArray.length === 0) return [];

    const prices = servicesArray.map(s => {
        let p = parseFloat(s.price);
        return isNaN(p) ? 0 : p;
    });

    const n = prices.length;
    const mean = prices.reduce((sum, p) => sum + p, 0) / n;
    const variance = prices.reduce((sum, p) => sum + (p - mean) ** 2, 0) / n;
    const sigma = Math.sqrt(variance);
    const lower = mean - 3 * sigma;
    const upper = mean + 3 * sigma;

    stats = { mean, sigma, lowerBound: lower, upperBound: upper };

    const anomalies = [];
    prices.forEach((price, idx) => {
        let isAnomaly = false;

        if (price < lower || price > upper) isAnomaly = true;
        if (price <= 0) isAnomaly = true;
        if (price > 0 && price < 50) isAnomaly = true;

        if (isAnomaly) anomalies.push(idx);
    });

    return anomalies;
}

function renderServicesTable(servicesArray, anomalyIdxsSet) {
    if (!servicesArray || servicesArray.length === 0 || !servicesTableBody) return;

    servicesTableBody.innerHTML = '';

    servicesArray.forEach((service, idx) => {
        const isAnomaly = anomalyIdxsSet.has(idx);
        const row = document.createElement('tr');
        if (isAnomaly) row.classList.add('anomaly-row');

        const tdId = document.createElement('td');
        tdId.textContent = service.service_id ?? idx + 1;

        const tdName = document.createElement('td');
        tdName.textContent = service.service_name || '—';

        const tdDesc = document.createElement('td');
        const desc = service.description || '';
        tdDesc.textContent = desc.length > 80 ? desc.slice(0, 77) + '...' : desc;
        tdDesc.title = desc;

        const tdPrice = document.createElement('td');
        if (isAnomaly) {
            const input = document.createElement('input');
            input.type = 'number';
            input.step = '0.01';
            input.min = '50';
            input.value = service.price;
            input.classList.add('price-input');
            input.dataset.index = idx;
            input.addEventListener('change', (e) => {
                let newVal = parseFloat(e.target.value);
                if (isNaN(newVal)) newVal = 0;
                if (newVal < 50 && newVal > 0) {
                    showMessage(`Внимание: цена ${newVal} ₽ очень низкая. Рекомендуется установить от 50 ₽`, false);
                }
                if (newVal <= 0) {
                    showMessage(`Ошибка: цена не может быть ${newVal} ₽`, true);
                    e.target.value = service.price;
                    return;
                }
                currentServices[idx].price = newVal;
                showMessage(`Цена для "${service.service_name}" изменена на ${newVal} ₽`, false);
            });
            tdPrice.appendChild(input);
        } else {
            tdPrice.textContent = typeof service.price === 'number' ? service.price.toFixed(2) : service.price;
        }

        const tdActivity = document.createElement('td');
        tdActivity.textContent = service.activity_type || '—';

        const tdBadge = document.createElement('td');
        if (isAnomaly) {
            const badge = document.createElement('span');
            badge.className = 'badge';
            let reason = '';
            if (service.price <= 0) reason = 'некорректная цена';
            else if (service.price < 50) reason = 'слишком низкая цена';
            else reason = 'стат. аномалия';
            badge.textContent = reason;
            tdBadge.appendChild(badge);
        } else {
            tdBadge.textContent = '—';
        }

        row.appendChild(tdId);
        row.appendChild(tdName);
        row.appendChild(tdDesc);
        row.appendChild(tdPrice);
        row.appendChild(tdActivity);
        row.appendChild(tdBadge);
        servicesTableBody.appendChild(row);
    });

    if (statsSummarySpan) {
        statsSummarySpan.innerHTML = `Среднее: ${stats.mean.toFixed(2)} ₽, Ст. отклонение: ${stats.sigma.toFixed(2)} ₽, Интервал: [${stats.lowerBound.toFixed(2)} ; ${stats.upperBound.toFixed(2)}] ₽, Аномалий: ${anomalyIdxsSet.size}`;
    }
}

function detectAnomaliesAndHighlight() {
    if (!currentServices || currentServices.length === 0) {
        showMessage('Нет загруженных данных.', true);
        return false;
    }

    const anomaliesIdx = calculateStatsAndAnomalies(currentServices);
    anomalyIndices.clear();
    anomaliesIdx.forEach(i => anomalyIndices.add(i));

    renderServicesTable(currentServices, anomalyIndices);
    if (servicesTableContainer) servicesTableContainer.style.display = 'block';

    if (anomalyIndices.size > 0) {
        if (anomalyEditPanel) anomalyEditPanel.style.display = 'block';
        if (exportPanel) exportPanel.style.display = 'block';
        showMessage(`Обнаружено ${anomalyIndices.size} аномальных цен.`, false);
    } else {
        if (anomalyEditPanel) anomalyEditPanel.style.display = 'none';
        if (exportPanel) exportPanel.style.display = 'block';
        showMessage('Аномалий не обнаружено.', false, true);
    }

    return true;
}

function loadServicesFromJson(jsonText, fileNameHint = 'файл') {
    try {
        const parsed = JSON.parse(jsonText);

        if (!Array.isArray(parsed)) {
            throw new Error('Корневой элемент должен быть массивом услуг.');
        }

        const validServices = parsed.map((item, idx) => {
            let priceVal = parseFloat(item.price);
            if (isNaN(priceVal)) priceVal = 0;
            return {
                service_id: item.service_id ?? idx + 1,
                service_name: item.service_name || 'Услуга',
                description: item.description || '',
                price: priceVal,
                activity_type: item.activity_type || 'Общая'
            };
        });

        originalServices = validServices;
        currentServices = originalServices.map(s => ({ ...s }));
        anomalyIndices.clear();
        if (servicesTableContainer) servicesTableContainer.style.display = 'none';
        if (anomalyEditPanel) anomalyEditPanel.style.display = 'none';
        if (exportPanel) exportPanel.style.display = 'none';

        showMessage(`Файл "${fileNameHint}" загружен. Услуг: ${currentServices.length}`, false, true);
        if (detectBtn) detectBtn.disabled = false;

        return true;
    } catch (err) {
        showMessage(`Ошибка разбора JSON: ${err.message}`, true);
        return false;
    }
}

function resetToOriginalPrices() {
    if (!originalServices) {
        showMessage('Нет исходных данных.', true);
        return;
    }

    currentServices = originalServices.map(s => ({ ...s }));
    anomalyIndices.clear();

    if (servicesTableContainer && servicesTableContainer.style.display === 'block') {
        detectAnomaliesAndHighlight();
    } else {
        showMessage('Цены сброшены к исходным.', false);
    }
}

function applyCorrections() {
    if (!currentServices) return;

    const inputs = document.querySelectorAll('#servicesTableBody .price-input');
    inputs.forEach(input => {
        const idx = parseInt(input.dataset.index);
        if (!isNaN(idx) && currentServices[idx]) {
            let newVal = parseFloat(input.value);
            if (isNaN(newVal)) newVal = 0;
            if (newVal <= 0) {
                showMessage(`Цена ${newVal} ₽ недопустима. Пропускаем изменение.`, true);
                return;
            }
            currentServices[idx].price = newVal;
        }
    });

    originalServices = currentServices.map(s => ({ ...s }));

    const newAnomalies = calculateStatsAndAnomalies(currentServices);
    anomalyIndices.clear();
    newAnomalies.forEach(i => anomalyIndices.add(i));

    renderServicesTable(currentServices, anomalyIndices);

    if (anomalyIndices.size === 0) {
        showMessage('Все аномалии исправлены!', false, true);
        if (anomalyEditPanel) anomalyEditPanel.style.display = 'none';
    } else {
        showMessage(`Осталось ${anomalyIndices.size} аномалий.`, false);
        if (anomalyEditPanel) anomalyEditPanel.style.display = 'block';
    }

    if (exportPanel) exportPanel.style.display = 'block';
}

function exportToJson() {
    if (!currentServices || currentServices.length === 0) {
        showMessage('Нет данных для экспорта.', true);
        return;
    }

    const exportData = currentServices.map(s => ({
        service_id: s.service_id,
        service_name: s.service_name,
        description: s.description,
        price: s.price,
        activity_type: s.activity_type
    }));

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'services_updated.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showMessage('Файл services_updated.json скачан.', false, true);
}

document.getElementById('logoutBtn1')?.addEventListener('click', showLoginForm);
document.getElementById('logoutBtn2')?.addEventListener('click', showLoginForm);

initSharedAnnouncement();
showLoginForm();
