// ============================================================
// === ЭТАП 5: ТЕХ. ЗАНЯТИЕ, РАПОРТА/АКТЫ И ОСМОТРЫ ===
// ============================================================

let techLessonsDb = [
    {
        id: "tech_1",
        title: "Первое техническое занятие: Правила проезда и оформления ПД",
        content: "Изучение актуальных правил оформления разовых билетов, льготных ПД и порядка действий при сбое МКассы.",
        questions: [
            { q: "В каком случае оформляется билет без дополнительного сбора?", options: ["При посадке со станции без работающей кассы", "По желанию пассажира", "В любом поезде Ласточка"], correct: 0 },
            { q: "Сколько пробников считается при 1 смене и номерах 128/129?", options: ["1", "2", "3"], correct: 2 }
        ]
    },
    {
        id: "tech_2",
        title: "Второе техническое занятие: Охрана труда и безопасность в пути",
        content: "Требования безопасности при проходе по составу, проверке вагонов и взаимодействии с локомотивной бригадой.",
        questions: [
            { q: "Что обязан сделать ККЛ при обнаружении неисправности дверей вагона?", options: ["Игнорировать", "Немедленно сообщить машинисту и оформить осмотр/рапорт", "Починить самостоятельно"], correct: 1 },
            { q: "Куда направляется рапорт смены ФДУ при закрытии?", options: ["На роспись оператору ГУО", "Удаляется", "Только в чат"], correct: 0 }
        ]
    }
];

let classnessQuestionsDb = [
    { q: "1. Максимальное время синхронизации МКассы в штатном режиме?", options: ["До 15–20 минут", "Более 3 часов", "Синхронизация не требуется"], correct: 0 },
    { q: "2. Как отмечается в листе «Просинхрон» касса, находящаяся в ремонте?", options: ["Зеленой галочкой ✅", "Красным крестиком ❌", "Жирной буквой Р"], correct: 1 },
    { q: "3. Как отмечается в листе «Просинхрон» касса, находящаяся в работе?", options: ["Жирной буквой Р", "Красным крестиком ❌", "Прочерком"], correct: 0 },
    { q: "4. При оформлении льготного билета с суммой сбора 0 ₽ куда вносится запись?", options: ["В Реестр", "Никуда", "Только в чат"], correct: 0 }
];

let classnessAssignedTabs = []; // Табельные номера сотрудников, выбранных инструктором на сдачу классности
let techResultsDb = [];
let raportsDb = [];
let inspectionsDb = [];

let stage5State = {
    activeTestMode: null, // 'lesson' | 'classness'
    activeLessonId: null,
    currentAnswers: {},
    uploadedTemplateImg: '',
    pendingDocHtml: '',
    pendingDocMeta: null
};

const docSubtypesMap = {
    "Рапорт": [
        "Рапорт на отсутствие ТБ",
        "Рапорт на перенаселенность"
    ],
    "АКТ": [
        "АКТ на клининговые услуги",
        "Акт на дефектные разовые ПД",
        "Акт на дефектные пробники"
    ]
};

const defaultDocTemplates = {
    "Рапорт на отсутствие ТБ":
        "Начальнику участка АО «МТ ППК»\nот ____________________\n\nРАПОРТ\n\nДовожу до Вашего сведения, что «____» __________ 202__ г. в электропоезде № ______ сообщением ____________________ при проверке выявлено отсутствие транспортной безопасности (ТБ) на участке ____________________ в ______ ч. ____ мин.\n\nКомментарий: ________________________________________",
    "Рапорт на перенаселенность":
        "Начальнику участка АО «МТ ППК»\nот ____________________\n\nРАПОРТ\n\nДовожу до Вашего сведения, что «____» __________ 202__ г. в электропоезде № ______ сообщением ____________________ на перегоне ____________________ зафиксирована перенаселенность состава (свыше ____%), что затруднило проверку ПД в вагонах № ________.\n\nДополнительно: ________________________________________",
    "АКТ на клининговые услуги":
        "АКТ № ____\nо качестве клининговых услуг\n\nДата: «____» __________ 202__ г.  Поезд № ______  Состав № ______\nУчасток / станция: ____________________\nВыявленные замечания по уборке вагонов № ________: ________________________________________\nЗамечания зафиксировал: ____________________",
    "Акт на дефектные разовые ПД":
        "АКТ № ____\nна дефектные разовые проездные документы (ПД)\n\nДата: «____» __________ 202__ г.  № МКассы: ________\nМаршрут № ______  Поезд № ______\nНомера дефектных билетов: ____________________\nКоличество: ____ шт.  На сумму: ________ руб.\nПричина дефекта: ________________________________________",
    "Акт на дефектные пробники":
        "АКТ № ____\nна дефектные пробные билеты\n\nДата: «____» __________ 202__ г.  № МКассы: ________\nСмена № ______  Номера дефектных пробников: ____________________\nКоличество: ____ шт.\nПричина: ________________________________________"
};

// === ИНИЦИАЛИЗАЦИЯ МОДАЛОК И СИНХРОНИЗАЦИИ ЭТАПА 5 ===
window.addEventListener('load', () => {
    injectStage5Modals();
    startStage5CloudSync();
});

// Перехватываем navTo, чтобы при открытии экранов они сразу перерисовывались
const _origNavToStage5 = window.navTo;
window.navTo = function(id) {
    if (typeof _origNavToStage5 === 'function') _origNavToStage5(id);
    if (id === 'tech') renderTechScreen();
    if (id === 'raports') renderRaportsScreen();
    if (id === 'inspections') renderInspectionsScreen();
};

function startStage5CloudSync() {
    if (typeof db === 'undefined' || !db) return;
    db.collection('tech_lessons').onSnapshot(s => {
        if (!s.empty) { techLessonsDb = []; s.forEach(d => techLessonsDb.push(d.data())); renderTechScreen(); }
    });
    db.collection('tech_meta').doc('classness').onSnapshot(doc => {
        if (doc.exists) {
            let d = doc.data();
            if (Array.isArray(d.assignedTabs)) classnessAssignedTabs = d.assignedTabs;
            if (Array.isArray(d.questions) && d.questions.length) classnessQuestionsDb = d.questions;
            renderTechScreen();
        }
    });
    db.collection('tech_results').onSnapshot(s => {
        techResultsDb = []; s.forEach(d => techResultsDb.push(d.data()));
        techResultsDb.sort((a,b) => (b.ts||0) - (a.ts||0));
        renderTechScreen();
    });
    db.collection('raports_docs').onSnapshot(s => {
        raportsDb = []; s.forEach(d => raportsDb.push(d.data()));
        raportsDb.sort((a,b) => (b.ts||0) - (a.ts||0));
        renderRaportsScreen();
    });
    db.collection('inspections').onSnapshot(s => {
        inspectionsDb = []; s.forEach(d => inspectionsDb.push(d.data()));
        inspectionsDb.sort((a,b) => (b.ts||0) - (a.ts||0));
        renderInspectionsScreen();
    });
}

function isInstructorOrAdmin() {
    let r = typeof getUserRole === 'function' ? getUserRole() : 'viewer';
    return r === 'founder' || r === 'admin' || r === 'instructor';
}

// ============================================================
// === 1. МОДУЛЬ «ТЕХ. ЗАНЯТИЕ» И «ТЕСТ НА КЛАССНОСТЬ» ===
// ============================================================
function renderTechScreen() {
    let scr = document.getElementById('tech-screen');
    if (!scr) return;
    let myTab = appState.user?.tab || '';
    let isAssigned = classnessAssignedTabs.includes(myTab);
    let canManage = isInstructorOrAdmin();

    let lessonsHtml = techLessonsDb.map(l => {
        let myRes = techResultsDb.find(r => r.mode === 'lesson' && r.lessonId === l.id && r.tab === myTab);
        let badge = myRes ? `<span style="background:#d4edda;color:#155724;padding:3px 8px;border-radius:12px;font-size:12px;font-weight:bold;">Сдано: ${myRes.percent}%</span>` : '';
        return `
            <div class="folder-card" style="text-align:left;">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
                    <strong style="font-size:15px;color:#003366;">📘 ${l.title}</strong>
                    ${badge}
                </div>
                <p style="font-size:13px;color:#444;margin:8px 0;">${l.content || ''}</p>
                <div style="display:flex;gap:8px;align-items:center;">
                    <button class="btn-action" style="width:auto;padding:8px 16px;" onclick="startTechTest('lesson','${l.id}')">📝 Тест (${(l.questions||[]).length} вопр.)</button>
                </div>
            </div>
        `;
    }).join('');

    let classnessResultsHtml = '';
    if (canManage) {
        let cRes = techResultsDb.filter(r => r.mode === 'classness');
        if (cRes.length) {
            classnessResultsHtml = `<div style="margin-top:14px;background:#eef6ff;border:1px solid #b8daff;border-radius:8px;padding:12px;text-align:left;">
                <h4 style="margin:0 0 8px;color:#003366;">📄 Сданные тесты на классность (для инструктора):</h4>
                ${cRes.map((r, i) => `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px dashed #b8daff;font-size:13px;">
                        <span><strong>${r.fio}</strong> (${r.date}) — <b>${r.correctCount}/${r.totalCount} (${r.percent}%)</b></span>
                        <button class="btn-danger" style="width:auto;margin:0;padding:5px 10px;font-size:12px;" onclick="printClassnessPdfById('${r.id}')">📄 PDF (4 колонки)</button>
                    </div>
                `).join('')}
            </div>`;
        }
    }

    scr.innerHTML = `
        <div class="card" style="max-width:900px;margin:20px auto;">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:14px;">
                <h2 style="margin:0;">🎓 Технические занятия</h2>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button class="btn-success" style="width:auto;margin:0;padding:8px 14px;" onclick="openAddLessonModal()">➕ Добавить тех. занятие</button>
                    ${canManage ? `<button class="btn-warning" style="width:auto;margin:0;padding:8px 14px;" onclick="openAssignClassnessModal()">👥 Выбрать на классность</button>` : ''}
                </div>
            </div>

            ${lessonsHtml}

            <div class="folder-card" style="background:#fff8e1;border:2px solid #ffc107;text-align:left;margin-top:16px;">
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                    <strong style="font-size:16px;color:#856404;">🏆 Технический тест на классность</strong>
                    ${isAssigned ? '<span style="background:#dc3545;color:#fff;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:bold;">Вы назначены инструктором (результат уйдет в PDF)</span>' : '<span style="color:#666;font-size:12px;">Режим самопроверки (никуда не отправляется)</span>'}
                </div>
                <p style="font-size:13px;color:#555;margin:8px 0;">Вопросов в базе: <strong>${classnessQuestionsDb.length}</strong></p>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button class="btn-action" style="background:#856404;width:auto;padding:8px 16px;" onclick="startTechTest('classness', null)">📝 Пройти тест на классность</button>
                    ${canManage ? `<button class="btn-secondary" style="width:auto;margin:0;padding:8px 12px;font-size:12px;" onclick="openAddClassnessQuestionModal()">➕ Добавить вопрос</button>` : ''}
                </div>
            </div>

            ${classnessResultsHtml}
            <button class="btn-secondary" style="margin-top:16px;" onclick="backToMain()">Назад</button>
        </div>
    `;
}

function openAddLessonModal() {
    document.getElementById('newLessonTitle').value = '';
    document.getElementById('newLessonContent').value = '';
    document.getElementById('newLessonQText').value = '';
    document.getElementById('newLessonOpt1').value = '';
    document.getElementById('newLessonOpt2').value = '';
    document.getElementById('newLessonOpt3').value = '';
    document.getElementById('newLessonCorrect').value = '0';
    openModal('addLessonModal');
}

function saveNewLesson() {
    let title = document.getElementById('newLessonTitle').value.trim();
    if (!title) return alert("Введите название технического занятия!");
    let content = document.getElementById('newLessonContent').value.trim();
    let qText = document.getElementById('newLessonQText').value.trim();
    let opts = [
        document.getElementById('newLessonOpt1').value.trim(),
        document.getElementById('newLessonOpt2').value.trim(),
        document.getElementById('newLessonOpt3').value.trim()
    ].filter(Boolean);
    let questions = [];
    if (qText && opts.length >= 2) {
        questions.push({ q: qText, options: opts, correct: Math.min(+document.getElementById('newLessonCorrect').value || 0, opts.length - 1) });
    }
    let obj = { id: 'tech_' + Date.now(), title, content, questions };
    if (db) db.collection('tech_lessons').doc(obj.id).set(obj);
    else { techLessonsDb.push(obj); renderTechScreen(); }
    closeModal('addLessonModal');
    showSyncToast("☁️ Тех. занятие добавлено");
}

function openAddClassnessQuestionModal() {
    let q = prompt("Введите текст вопроса для теста на классность:");
    if (!q) return;
    let o1 = prompt("Вариант ответа 1:");
    let o2 = prompt("Вариант ответа 2:");
    let o3 = prompt("Вариант ответа 3 (необязательно):") || "";
    let corr = parseInt(prompt("Номер правильного ответа (1, 2 или 3):"), 10) - 1;
    let opts = [o1, o2, o3].filter(Boolean);
    if (opts.length < 2) return alert("Нужно минимум 2 варианта ответа.");
    classnessQuestionsDb.push({ q: `${classnessQuestionsDb.length + 1}. ${q}`, options: opts, correct: Math.max(0, Math.min(corr, opts.length - 1)) });
    if (db) db.collection('tech_meta').doc('classness').set({ questions: classnessQuestionsDb, assignedTabs: classnessAssignedTabs }, { merge: true });
    renderTechScreen();
}

function openAssignClassnessModal() {
    let box = document.getElementById('assignClassnessList');
    box.innerHTML = appState.workers.map(w => `
        <label style="display:flex;align-items:center;gap:8px;padding:6px;border-bottom:1px solid #eee;cursor:pointer;">
            <input type="checkbox" class="assign-cl-cb" value="${w.tab}" ${classnessAssignedTabs.includes(w.tab)?'checked':''} style="width:18px;height:18px;">
            <span><strong>${w.fio}</strong> (таб. ${w.tab})</span>
        </label>
    `).join('');
    openModal('assignClassnessModal');
}

function saveAssignedClassness() {
    classnessAssignedTabs = Array.from(document.querySelectorAll('.assign-cl-cb:checked')).map(c => c.value);
    if (db) db.collection('tech_meta').doc('classness').set({ assignedTabs: classnessAssignedTabs, questions: classnessQuestionsDb }, { merge: true });
    closeModal('assignClassnessModal');
    sendCloudNotification(`🏆 Инструктор назначил сдачу теста на классность (${classnessAssignedTabs.length} сотр.).`);
    renderTechScreen();
    showSyncToast("☁️ Список на классность сохранен");
}

function startTechTest(mode, lessonId) {
    stage5State.activeTestMode = mode;
    stage5State.activeLessonId = lessonId;
    let questions = [];
    let title = "";
    if (mode === 'lesson') {
        let l = techLessonsDb.find(x => x.id === lessonId);
        if (!l || !l.questions || !l.questions.length) return alert("В этом занятии пока нет вопросов.");
        questions = l.questions;
        title = `Тест: ${l.title}`;
    } else {
        questions = classnessQuestionsDb;
        title = "🏆 Технический тест на классность";
    }

    document.getElementById('testRunnerTitle').innerText = title;
    document.getElementById('testRunnerResult').style.display = 'none';
    document.getElementById('btnSubmitTechTest').style.display = 'block';
    document.getElementById('testRunnerQuestions').innerHTML = questions.map((item, idx) => `
        <div style="background:#f8f9fa;border:1px solid #ddd;border-radius:6px;padding:10px;margin-bottom:10px;">
            <div style="font-weight:bold;margin-bottom:6px;font-size:13px;">${idx + 1}. ${item.q}</div>
            ${item.options.map((opt, oi) => `
                <label style="display:block;font-size:13px;padding:3px 0;cursor:pointer;">
                    <input type="radio" name="tq_${idx}" value="${oi}"> ${opt}
                </label>
            `).join('')}
        </div>
    `).join('');
    openModal('techTestModal');
}

function submitTechTest() {
    let mode = stage5State.activeTestMode;
    let lesson = mode === 'lesson' ? techLessonsDb.find(x => x.id === stage5State.activeLessonId) : null;
    let questions = mode === 'lesson' ? (lesson?.questions || []) : classnessQuestionsDb;

    let correctCount = 0;
    let details = [];
    questions.forEach((item, idx) => {
        let sel = document.querySelector(`input[name="tq_${idx}"]:checked`);
        let ansIdx = sel ? parseInt(sel.value, 10) : -1;
        let isRight = ansIdx === item.correct;
        if (isRight) correctCount++;
        details.push({
            num: idx + 1,
            question: item.q,
            correctText: item.options[item.correct] || '—',
            wrongText: isRight ? '—' : (ansIdx >= 0 ? item.options[ansIdx] : 'Не отвечено'),
            userText: ansIdx >= 0 ? item.options[ansIdx] : 'Не отвечено',
            isRight
        });
    });

    let totalCount = questions.length;
    let percent = totalCount ? Math.round((correctCount / totalCount) * 100) : 0;

    // Разбор ответов на экране (показывает неправильный и правильный ответ)
    let breakdownHtml = `
        <div style="background:${percent>=70?'#d4edda':'#f8d7da'};padding:10px;border-radius:6px;margin-bottom:10px;font-weight:bold;font-size:15px;">
            Результат: ${correctCount} из ${totalCount} (${percent}%)
        </div>
        ${details.map(d => `
            <div style="padding:8px;border-bottom:1px solid #ddd;font-size:12px;background:${d.isRight?'#f1fff3':'#fff2f2'};">
                <div><strong>${d.num}. ${d.question}</strong></div>
                <div>Ваш ответ: <strong style="color:${d.isRight?'green':'#cc0000'};">${d.userText}</strong></div>
                ${!d.isRight ? `<div>Правильный ответ: <strong style="color:green;">${d.correctText}</strong></div>` : ''}
            </div>
        `).join('')}
    `;
    let resBox = document.getElementById('testRunnerResult');
    resBox.innerHTML = breakdownHtml;
    resBox.style.display = 'block';
    document.getElementById('btnSubmitTechTest').style.display = 'none';

    let myTab = appState.user?.tab || '—';
    let myFio = appState.user?.fio || 'Сотрудник';
    let dateStr = new Date().toLocaleString('ru-RU');

    if (mode === 'lesson') {
        let rec = { id: 'tres_' + Date.now(), mode: 'lesson', lessonId: lesson.id, lessonTitle: lesson.title, tab: myTab, fio: myFio, correctCount, totalCount, percent, date: dateStr, ts: Date.now(), details };
        if (db) db.collection('tech_results').doc(rec.id).set(rec);
        else techResultsDb.unshift(rec);
        sendCloudNotification(`🎓 Старшему инструктору: ${myFio} сдал «${lesson.title}» на ${percent}% (${correctCount}/${totalCount}).`);
    } else if (mode === 'classness') {
        if (classnessAssignedTabs.includes(myTab)) {
            let pdfHtml = buildClassnessPdfHtml(myFio, myTab, dateStr, details, correctCount, totalCount, percent);
            let rec = { id: 'clres_' + Date.now(), mode: 'classness', tab: myTab, fio: myFio, correctCount, totalCount, percent, date: dateStr, ts: Date.now(), details, html: pdfHtml };
            if (db) db.collection('tech_results').doc(rec.id).set(rec);
            else techResultsDb.unshift(rec);

            let arch = { id: 'rep_class_' + Date.now(), folder: `Тест на классность — ${myFio} (${percent}%)`, author: myFio, ts: Date.now(), html: pdfHtml };
            if (db) db.collection('archive_reports').doc(arch.id).set(arch);
            else cloudArchive.unshift(arch);

            sendCloudNotification(`🏆 Инструктору: ${myFio} прошел назначенный тест на классность — ${percent}% (${correctCount}/${totalCount}). PDF готов в Архиве отчетов.`);
        }
    }
    renderTechScreen();
}

function buildClassnessPdfHtml(fio, tab, dateStr, details, correctCount, totalCount, percent) {
    let rows = details.map(d => `
        <tr>
            <td style="text-align:left;">${d.num}. ${d.question}</td>
            <td style="color:green;">${d.correctText}</td>
            <td style="color:#cc0000;">${d.wrongText}</td>
            <td><strong>${d.userText}</strong></td>
        </tr>
    `).join('');
    return `
        <h3>Протокол сдачи технического теста на классность</h3>
        <p><strong>Сотрудник:</strong> ${fio} (Таб. № ${tab}) | <strong>Дата:</strong> ${dateStr}</p>
        <table border="1" style="border-collapse:collapse;width:100%;font-size:12px;">
            <tr style="background:#dce6f1;">
                <th style="width:40%;">Номер и вопрос</th>
                <th style="width:20%;">Правильный ответ</th>
                <th style="width:20%;">Неправильный ответ</th>
                <th style="width:20%;">Ваш ответ</th>
            </tr>
            ${rows}
            <tr style="background:#f8f9fa;font-weight:bold;">
                <td colspan="4" style="text-align:right;padding:8px;">
                    Ответили: ${correctCount} / ${totalCount} вопросов &nbsp;|&nbsp; Процент сдачи: ${percent}%
                </td>
            </tr>
        </table>
    `;
}

function printClassnessPdfById(id) {
    let r = techResultsDb.find(x => x.id === id);
    if (!r) return;
    let html = r.html || buildClassnessPdfHtml(r.fio, r.tab, r.date, r.details || [], r.correctCount, r.totalCount, r.percent);
    let w = window.open('', '_blank');
    w.document.write(`<html><head><meta charset="utf-8"><title>Классность — ${r.fio}</title><style>body{font-family:Arial;padding:20px;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #000;padding:6px;text-align:center;}</style></head><body>${html}</body></html>`);
    w.document.close(); setTimeout(() => w.print(), 300);
}

// ============================================================
// === 2. МОДУЛЬ «РАПОРТА И АКТЫ» (С ПОДЧЕРКИВАНИЯМИ И ПОДПИСЬЮ) ===
// ============================================================
function renderRaportsScreen() {
    let scr = document.getElementById('raports-screen');
    if (!scr) return;
    let listHtml = raportsDb.length === 0
        ? '<div style="text-align:center;color:#666;padding:20px;">Созданных рапортов и актов пока нет.</div>'
        : raportsDb.map((doc, idx) => `
            <div class="folder-card" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                <div>
                    <strong>📄 ${doc.category}: ${doc.subtype}</strong><br>
                    <small style="color:#666;">${doc.date} • Автор: ${doc.author} • ✅ Подписано</small>
                </div>
                <button class="btn-danger" style="width:auto;margin:0;padding:6px 12px;font-size:12px;" onclick="printRaportPdf(${idx})">📄 Открыть PDF</button>
            </div>
        `).join('');

    scr.innerHTML = `
        <div class="card" style="max-width:900px;margin:20px auto;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
                <h2 style="margin:0;">📝 Рапорта и Акты</h2>
                <button class="btn-success" style="width:auto;margin:0;padding:8px 16px;" onclick="openCreateRaportModal()">➕ Создать</button>
            </div>
            ${listHtml}
            <button class="btn-secondary" style="margin-top:14px;" onclick="backToMain()">Назад</button>
        </div>
    `;
}

function openCreateRaportModal() {
    stage5State.uploadedTemplateImg = '';
    document.getElementById('rapCategorySel').value = 'Рапорт';
    onRaportCategoryChange();
    document.getElementById('rapTemplateImgPreview').style.display = 'none';
    document.getElementById('rapSignStep').style.display = 'none';
    document.getElementById('rapFormStep').style.display = 'block';
    openModal('createRaportModal');
}

function onRaportCategoryChange() {
    let cat = document.getElementById('rapCategorySel').value;
    let subSel = document.getElementById('rapSubtypeSel');
    subSel.innerHTML = (docSubtypesMap[cat] || []).map(s => `<option value="${s}">${s}</option>`).join('');
    loadSelectedRaportTemplate();
}

function loadSelectedRaportTemplate() {
    let subtype = document.getElementById('rapSubtypeSel').value;
    let raw = defaultDocTemplates[subtype] || "Документ от ____ __________ 202__ г.\nТекст: ____________________";
    renderUnderlineTemplate(raw);
}

// Превращает все подчеркивания (____) в поля ввода прямо внутри документа
function renderUnderlineTemplate(rawText) {
    let idx = 0;
    let html = rawText.replace(/\n/g, '<br>').replace(/_{3,}/g, (match) => {
        let w = Math.min(260, Math.max(55, match.length * 9));
        return `<input type="text" class="rap-inline-inp" data-idx="${idx++}" style="width:${w}px;border:none;border-bottom:1.5px solid #003366;background:#eef6ff;padding:1px 4px;font-family:inherit;font-size:13px;color:#000;outline:none;">`;
    });
    document.getElementById('rapDynamicForm').innerHTML = html;
}

function handleRaportTemplateUpload(e) {
    let file = e.target.files[0];
    if (!file) return;
    if (file.type.startsWith('image/')) {
        let reader = new FileReader();
        reader.onload = ev => {
            stage5State.uploadedTemplateImg = ev.target.result;
            let img = document.getElementById('rapTemplateImgPreview');
            img.src = ev.target.result;
            img.style.display = 'block';
            showSyncToast("🖼️ Образец загружен — заполните поля под подчеркнутыми линиями");
        };
        reader.readAsDataURL(file);
    } else {
        let reader = new FileReader();
        reader.onload = ev => {
            renderUnderlineTemplate(ev.target.result || '');
            showSyncToast("📄 Текстовый шаблон распознан: линии ____ заменены на поля ввода");
        };
        reader.readAsText(file);
    }
    e.target.value = '';
}

function proceedToRaportSign() {
    // Собираем финальный HTML документа, заменяя инпуты на введенные значения с подчеркиванием
    let clone = document.getElementById('rapDynamicForm').cloneNode(true);
    let origInputs = document.querySelectorAll('#rapDynamicForm .rap-inline-inp');
    clone.querySelectorAll('.rap-inline-inp').forEach((inp, i) => {
        let val = origInputs[i]?.value.trim() || '________';
        let span = document.createElement('span');
        span.style.cssText = 'border-bottom:1px solid #000;padding:0 4px;font-weight:bold;';
        span.innerText = val;
        inp.replaceWith(span);
    });
    stage5State.pendingDocHtml = clone.innerHTML;
    document.getElementById('rapSignPreviewDoc').innerHTML = clone.innerHTML;

    let sig = appState.user?.signature || '';
    let sigImg = document.getElementById('rapUserSigImg');
    if (sig) {
        sigImg.src = sig;
        sigImg.style.display = 'block';
        document.getElementById('rapNoSigNote').style.display = 'none';
    } else {
        sigImg.style.display = 'none';
        document.getElementById('rapNoSigNote').style.display = 'block';
    }

    document.getElementById('rapFormStep').style.display = 'none';
    document.getElementById('rapSignStep').style.display = 'block';
}

function confirmSignAndSaveRaport() {
    let cat = document.getElementById('rapCategorySel').value;
    let subtype = document.getElementById('rapSubtypeSel').value;
    let dateStr = new Date().toLocaleString('ru-RU');
    let author = appState.user?.fio || 'Сотрудник';
    let sig = appState.user?.signature || '';

    let finalHtml = `
        <div style="font-family:Times New Roman, serif;font-size:14px;line-height:1.6;">
            ${stage5State.uploadedTemplateImg ? `<div style="margin-bottom:10px;"><img src="${stage5State.uploadedTemplateImg}" style="max-width:100%;max-height:260px;border:1px solid #ccc;"></div>` : ''}
            <div>${stage5State.pendingDocHtml}</div>
            <div style="margin-top:24px;display:flex;justify-content:space-between;align-items:flex-end;">
                <div>Дата: ${dateStr}</div>
                <div style="text-align:right;">
                    ${sig ? `<img src="${sig}" style="height:48px;display:block;margin-left:auto;">` : ''}
                    <div>________________ / ${author}</div>
                </div>
            </div>
        </div>
    `;

    let docObj = { id: 'rap_' + Date.now(), category: cat, subtype, author, date: dateStr, ts: Date.now(), html: finalHtml };
    if (db) db.collection('raports_docs').doc(docObj.id).set(docObj);
    else raportsDb.unshift(docObj);

    let archObj = { id: 'rep_rap_' + Date.now(), folder: `${cat}: ${subtype} (${dateStr})`, author, ts: Date.now(), html: finalHtml };
    if (db) db.collection('archive_reports').doc(archObj.id).set(archObj);
    else cloudArchive.unshift(archObj);

    closeModal('createRaportModal');
    renderRaportsScreen();
    showSyncToast("✍️ Документ подписан и сохранен в Архив");
}

function printRaportPdf(idx) {
    let doc = raportsDb[idx]; if (!doc) return;
    let w = window.open('', '_blank');
    w.document.write(`<html><head><meta charset="utf-8"><title>${doc.subtype}</title></head><body style="padding:30px;">${doc.html}</body></html>`);
    w.document.close(); setTimeout(() => w.print(), 300);
}

// ============================================================
// === 3. МОДУЛЬ «ОСМОТРЫ ПОЕЗДОВ» ===
// ============================================================
function renderInspectionsScreen() {
    let scr = document.getElementById('inspections-screen');
    if (!scr) return;
    let listHtml = inspectionsDb.length === 0
        ? '<div style="text-align:center;color:#666;padding:20px;">Записей осмотров пока нет.</div>'
        : inspectionsDb.map(ins => `
            <div class="folder-card" style="text-align:left;">
                <div style="display:flex;justify-content:space-between;flex-wrap:wrap;">
                    <strong>🚆 Поезд № ${ins.trainNum} (Состав: ${ins.consist || '—'})</strong>
                    <span style="font-size:12px;color:#555;">${ins.date}</span>
                </div>
                <div style="font-size:12px;color:#333;margin-top:6px;">
                    <strong>Состояние:</strong> ${ins.checks} <br>
                    <strong>Замечания:</strong> ${ins.notes || 'Без замечаний'}<br>
                    <small style="color:#666;">Осмотрел: ${ins.author}</small>
                </div>
            </div>
        `).join('');

    scr.innerHTML = `
        <div class="card" style="max-width:900px;margin:20px auto;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
                <h2 style="margin:0;">🔍 Осмотры поездов</h2>
                <button class="btn-success" style="width:auto;margin:0;padding:8px 16px;" onclick="openModal('createInspectionModal')">➕ Новый осмотр</button>
            </div>
            ${listHtml}
            <button class="btn-secondary" style="margin-top:14px;" onclick="backToMain()">Назад</button>
        </div>
    `;
}

function saveInspection() {
    let trainNum = document.getElementById('insTrainNum').value.trim();
    if (!trainNum) return alert("Введите номер поезда!");
    let checks = Array.from(document.querySelectorAll('.ins-cb:checked')).map(c => c.value).join(', ') || 'Замечаний нет';
    let obj = {
        id: 'ins_' + Date.now(),
        trainNum,
        consist: document.getElementById('insConsist').value.trim(),
        checks,
        notes: document.getElementById('insNotes').value.trim(),
        author: appState.user?.fio || 'Сотрудник',
        date: new Date().toLocaleString('ru-RU'),
        ts: Date.now()
    };
    if (db) db.collection('inspections').doc(obj.id).set(obj);
    else inspectionsDb.unshift(obj);
    ['insTrainNum','insConsist','insNotes'].forEach(id => document.getElementById(id).value = '');
    closeModal('createInspectionModal');
    renderInspectionsScreen();
    showSyncToast("☁️ Осмотр поезда сохранен");
}

// ============================================================
// === ИНЪЕКЦИЯ МОДАЛЬНЫХ ОКОН ЭТАПА 5 ===
// ============================================================
function injectStage5Modals() {
    let wrap = document.createElement('div');
    wrap.innerHTML = `
        <!-- ДОБАВИТЬ ТЕХ. ЗАНЯТИЕ -->
        <div id="addLessonModal" class="modal"><div class="modal-content">
            <h3>➕ Добавить техническое занятие</h3>
            <div class="form-group"><label>Название (например, Первое техническое занятие):</label><input id="newLessonTitle" class="form-input"></div>
            <div class="form-group"><label>Материал занятия:</label><textarea id="newLessonContent" rows="3" class="form-input"></textarea></div>
            <h4 style="margin:8px 0 4px;">Контрольный вопрос теста:</h4>
            <div class="form-group"><label>Вопрос:</label><input id="newLessonQText" class="form-input"></div>
            <div class="form-row">
                <div class="form-group"><label>Вариант 1:</label><input id="newLessonOpt1" class="form-input"></div>
                <div class="form-group"><label>Вариант 2:</label><input id="newLessonOpt2" class="form-input"></div>
                <div class="form-group"><label>Вариант 3:</label><input id="newLessonOpt3" class="form-input"></div>
            </div>
            <div class="form-group"><label>Правильный вариант:</label>
                <select id="newLessonCorrect" class="form-input"><option value="0">Вариант 1</option><option value="1">Вариант 2</option><option value="2">Вариант 3</option></select>
            </div>
            <div style="display:flex;gap:10px;"><button class="btn-success" onclick="saveNewLesson()">Сохранить</button><button class="btn-secondary" onclick="closeModal('addLessonModal')">Отмена</button></div>
        </div></div>

        <!-- ПРОХОЖДЕНИЕ ТЕСТА -->
        <div id="techTestModal" class="modal"><div class="modal-content modal-wide">
            <h3 id="testRunnerTitle">Тест</h3>
            <div id="testRunnerQuestions" style="max-height:360px;overflow-y:auto;"></div>
            <div id="testRunnerResult" style="display:none;margin-top:12px;max-height:280px;overflow-y:auto;"></div>
            <div style="display:flex;gap:10px;margin-top:12px;">
                <button id="btnSubmitTechTest" class="btn-success" onclick="submitTechTest()">Завершить тест</button>
                <button class="btn-secondary" onclick="closeModal('techTestModal')">Закрыть</button>
            </div>
        </div></div>

        <!-- ВЫБОР СОТРУДНИКОВ НА КЛАССНОСТЬ -->
        <div id="assignClassnessModal" class="modal"><div class="modal-content">
            <h3>👥 Назначить сотрудников на классность</h3>
            <p style="font-size:12px;color:#555;">После сдачи теста выбранными сотрудниками PDF на 4 колонки автоматически уйдет инструктору.</p>
            <div id="assignClassnessList" style="max-height:280px;overflow-y:auto;border:1px solid #ddd;border-radius:6px;padding:6px;"></div>
            <div style="display:flex;gap:10px;margin-top:12px;"><button class="btn-success" onclick="saveAssignedClassness()">Сохранить</button><button class="btn-secondary" onclick="closeModal('assignClassnessModal')">Отмена</button></div>
        </div></div>

        <!-- СОЗДАТЬ РАПОРТ / АКТ -->
        <div id="createRaportModal" class="modal"><div class="modal-content modal-wide">
            <h3>📝 Создать документ (Рапорт / АКТ)</h3>
            <div id="rapFormStep">
                <div class="form-row">
                    <div class="form-group"><label>Тип документа:</label>
                        <select id="rapCategorySel" class="form-input" onchange="onRaportCategoryChange()">
                            <option value="Рапорт">Рапорт</option><option value="АКТ">АКТ</option>
                        </select>
                    </div>
                    <div class="form-group"><label>Вид:</label>
                        <select id="rapSubtypeSel" class="form-input" onchange="loadSelectedRaportTemplate()"></select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Загрузить свой шаблон образца (изображение или текстовый файл с ____):</label>
                    <input type="file" accept="image/*,.txt" class="form-input" onchange="handleRaportTemplateUpload(event)">
                    <img id="rapTemplateImgPreview" style="display:none;max-width:100%;max-height:200px;margin-top:8px;border:1px solid #ccc;border-radius:6px;">
                </div>
                <div style="background:#fff;border:1.5px solid #003366;border-radius:6px;padding:14px;line-height:1.9;font-size:13px;" id="rapDynamicForm"></div>
                <div style="display:flex;gap:10px;margin-top:12px;">
                    <button class="btn-success" onclick="proceedToRaportSign()">Сохранить и перейти к подписи</button>
                    <button class="btn-secondary" onclick="closeModal('createRaportModal')">Отмена</button>
                </div>
            </div>
            <div id="rapSignStep" style="display:none;">
                <h4>Проверьте документ и подпишите личной подписью:</h4>
                <div id="rapSignPreviewDoc" style="background:#fafafa;border:1px solid #ccc;padding:12px;border-radius:6px;line-height:1.7;font-size:13px;margin-bottom:12px;"></div>
                <div style="text-align:center;background:#eef6ff;padding:10px;border-radius:6px;">
                    <div style="font-size:12px;color:#555;margin-bottom:6px;">Личная подпись из вашего профиля:</div>
                    <img id="rapUserSigImg" style="max-height:70px;margin:0 auto;display:none;background:#fff;border:1px solid #ccc;">
                    <div id="rapNoSigNote" style="display:none;color:#cc0000;font-size:12px;">Подпись не загружена в профиле (документ будет подписан по ФИО).</div>
                </div>
                <div style="display:flex;gap:10px;margin-top:12px;">
                    <button class="btn-success" onclick="confirmSignAndSaveRaport()">✍️ Подписать и сохранить</button>
                    <button class="btn-secondary" onclick="document.getElementById('rapSignStep').style.display='none';document.getElementById('rapFormStep').style.display='block';">Назад к правке</button>
                </div>
            </div>
        </div></div>

        <!-- НОВЫЙ ОСМОТР -->
        <div id="createInspectionModal" class="modal"><div class="modal-content">
            <h3>🔍 Осмотр поезда</h3>
            <div class="form-row">
                <div class="form-group"><label>№ поезда:</label><input id="insTrainNum" class="form-input" placeholder="7901"></div>
                <div class="form-group"><label>№ состава / вагона:</label><input id="insConsist" class="form-input" placeholder="ЭС2Г-035"></div>
            </div>
            <div class="form-group"><label>Выявленные нарушения (отметьте при наличии):</label>
                <div class="perm-grid">
                    <label class="perm-item"><input type="checkbox" class="ins-cb" value="Нет освещения"> Нет освещения</label>
                    <label class="perm-item"><input type="checkbox" class="ins-cb" value="Неисправен климат"> Неисправен климат</label>
                    <label class="perm-item"><input type="checkbox" class="ins-cb" value="Грязный салон"> Грязный салон</label>
                    <label class="perm-item"><input type="checkbox" class="ins-cb" value="Неисправны двери"> Неисправны двери</label>
                </div>
            </div>
            <div class="form-group"><label>Комментарий / замечания:</label><textarea id="insNotes" rows="3" class="form-input" placeholder="Все в исправном состоянии..."></textarea></div>
            <div style="display:flex;gap:10px;"><button class="btn-success" onclick="saveInspection()">Сохранить осмотр</button><button class="btn-secondary" onclick="closeModal('createInspectionModal')">Отмена</button></div>
        </div></div>
    `;
    document.body.appendChild(wrap);
}
