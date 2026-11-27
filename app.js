// === FIREBASE ===
const firebaseConfig = {
    apiKey: "AIzaSyDjrcAZhOTvcTorM-apvpSj6juS6efiPAc",
    authDomain: "lastochka-mtppk.firebaseapp.com",
    projectId: "lastochka-mtppk",
    storageBucket: "lastochka-mtppk.firebasestorage.app",
    messagingSenderId: "3989081786",
    appId: "1:3989081786:web:1d2a539775f49ddfd1bc83"
};

let db = null;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    db.enablePersistence().catch(() => {});
} catch (e) { console.error(e); }

const monthNamesRu = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const monthNamesGen = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
const dayNamesRu = ["воскресенье","понедельник","вторник","среда","четверг","пятница","суббота"];
const allPermKeys = ["fdu","myShift","occupancy","trainReport","registry","tabel","sync","tech","raports","inspections","chats","org","stats","reports","settings"];
const stationDefaultRoutes = { "Клин": "13", "Москва": "12-2", "Крюково": "11-1", "Тверь": "25" };

// === СПРАВОЧНИКИ (СИНХРОНИЗИРУЮТСЯ С FIREBASE) ===
let positionsDb = [
    { id: "pos_founder", name: "Основатель", role: "founder", perms: [...allPermKeys] },
    { id: "pos_admin", name: "Администратор", role: "admin", perms: [...allPermKeys] },
    { id: "pos_inst", name: "Инструктор", role: "instructor", perms: ["fdu","myShift","occupancy","trainReport","registry","tabel","sync","tech","raports","inspections","chats","stats","reports"] },
    { id: "pos_kkl", name: "Кассир-контролер", role: "viewer", perms: ["fdu","myShift","occupancy","trainReport","registry","tabel","tech","raports","inspections","chats","stats","reports"] }
];
let departmentsDb = [{ id: "dep_1", name: "УФОСЭ Клин", station: "Клин" }];
let stationsDb = [
    { id: "st_1", name: "Москва Окт.", zone: 0 }, { id: "st_2", name: "Лихоборы", zone: 1 },
    { id: "st_3", name: "Химки", zone: 2 }, { id: "st_4", name: "Сходня", zone: 3 },
    { id: "st_5", name: "Зел.Крюково", zone: 4 }, { id: "st_6", name: "Поварово 1", zone: 6 },
    { id: "st_7", name: "Берёзки-Дачные", zone: 7 }, { id: "st_8", name: "Подсолнечная", zone: 7 },
    { id: "st_9", name: "Клин", zone: 10 }, { id: "st_10", name: "Тверь", zone: 18 }
];
let mkassasDb = [
    { id: "mk_13347", num: "13347", station: "Клин", sector: "УФОСЭ Клин" },
    { id: "mk_13348", num: "13348", station: "Клин", sector: "УФОСЭ Клин" },
    { id: "mk_13349", num: "13349", station: "Клин", sector: "УФОСЭ Клин" }
];
let routesDb = [
    {
        id: "rt_13", num: "13", hours: "9,9", startTime: "06:24", desc: "Клин — Москва",
        rows: [
            { train: "7901", route: "Клин-Москва", start: "06:24", end: "07:30", dur: "1:06", cond: "", shared: [] },
            { train: "7904", route: "Москва-Клин", start: "08:32", end: "09:40", dur: "1:08", cond: "", shared: [] },
            { train: "7101", route: "Клин-Москва", start: "12:37", end: "13:49", dur: "1:12", cond: "", shared: [] },
            { train: "7936", route: "Москва-Крюково", start: "13:57", end: "14:28", dur: "0:31", cond: "", shared: ["8","9","16","17","50-1"] },
            { train: "7551", route: "Крюково-Москва", start: "15:30", end: "16:00", dur: "0:30", cond: "", shared: ["21"] },
            { train: "7558", route: "Москва-Крюково", start: "16:12", end: "16:45", dur: "0:33", cond: "", shared: [] },
            { train: "7565", route: "Крюково-Москва", start: "17:36", end: "18:05", dur: "0:29", cond: "", shared: [] },
            { train: "7910", route: "Москва-Клин", start: "18:12", end: "19:25", dur: "1:13", cond: "", shared: [] }
        ]
    },
    { id: "rt_12_2", num: "12-2", hours: "9,3", startTime: "04:02", desc: "ежедневный, 2 ККЛ", rows: [{ train: "7529", route: "Крюково-Москва", start: "04:12", end: "04:47", dur: "0:35", cond: "2 ККЛ на 10 вагонов" }] },
    { id: "rt_22", num: "22", hours: "10,3", startTime: "08:53", desc: "Основной", rows: [{ train: "7903", route: "Клин-Москва", start: "08:53", end: "10:05", dur: "1:12", cond: "" }] },
    { id: "rt_v", num: "В", hours: "", startTime: "", desc: "Выходной", rows: [] }
];
let trainsDb = [
    { id: "tr_7901", num: "7901", from: "Клин", to: "Москва", dep: "06:24", arr: "07:30", stops: [{name:"Клин",time:"06:24"},{name:"Подсолнечная",time:"06:42"},{name:"Поварово 1",time:"06:51"},{name:"Зел.Крюково",time:"07:02"},{name:"Сходня",time:"07:10"},{name:"Химки",time:"07:18"},{name:"Лихоборы",time:"07:24"},{name:"Москва",time:"07:30"}] },
    { id: "tr_7903", num: "7903", from: "Клин", to: "Москва", dep: "06:25", arr: "07:40", stops: [{name:"Клин",time:"06:25"},{name:"Подсолнечная",time:"06:45"},{name:"Зел.Крюково",time:"07:05"},{name:"Москва",time:"07:40"}] },
    { id: "tr_7904", num: "7904", from: "Москва", to: "Клин", dep: "08:32", arr: "09:40", stops: [{name:"Москва",time:"08:32"},{name:"Лихоборы",time:"08:40"},{name:"Химки",time:"08:48"},{name:"Сходня",time:"08:56"},{name:"Зел.Крюково",time:"09:05"},{name:"Поварово 1",time:"09:15"},{name:"Подсолнечная",time:"09:24"},{name:"Клин",time:"09:40"}] },
    { id: "tr_7101", num: "7101", from: "Клин", to: "Москва", dep: "12:37", arr: "13:49", stops: [{name:"Клин",time:"12:37"},{name:"Подсолнечная",time:"12:55"},{name:"Поварово 1",time:"13:04"},{name:"Зел.Крюково",time:"13:16"},{name:"Сходня",time:"13:25"},{name:"Химки",time:"13:34"},{name:"Москва",time:"13:49"}] },
    { id: "tr_7936", num: "7936", from: "Москва", to: "Крюково", dep: "13:57", arr: "14:28", stops: [{name:"Москва",time:"13:57"},{name:"Химки",time:"14:12"},{name:"Сходня",time:"14:20"},{name:"Зел.Крюково",time:"14:28"}] },
    { id: "tr_7551", num: "7551", from: "Крюково", to: "Москва", dep: "15:30", arr: "16:00", stops: [{name:"Зел.Крюково",time:"15:30"},{name:"Сходня",time:"15:38"},{name:"Химки",time:"15:46"},{name:"Москва",time:"16:00"}] },
    { id: "tr_7558", num: "7558", from: "Москва", to: "Крюково", dep: "16:12", arr: "16:45", stops: [{name:"Москва",time:"16:12"},{name:"Химки",time:"16:28"},{name:"Сходня",time:"16:36"},{name:"Зел.Крюково",time:"16:45"}] },
    { id: "tr_7565", num: "7565", from: "Крюково", to: "Москва", dep: "17:36", arr: "18:05", stops: [{name:"Зел.Крюково",time:"17:36"},{name:"Сходня",time:"17:44"},{name:"Химки",time:"17:52"},{name:"Москва",time:"18:05"}] },
    { id: "tr_7910", num: "7910", from: "Москва", to: "Клин", dep: "18:12", arr: "19:25", stops: [{name:"Москва",time:"18:12"},{name:"Химки",time:"18:27"},{name:"Зел.Крюково",time:"18:45"},{name:"Подсолнечная",time:"19:08"},{name:"Клин",time:"19:25"}] }
];

const exactPairPrices = { "Москва Окт.|Зел.Крюково": 391, "Зел.Крюково|Москва Окт.": 391, "Поварово 1|Берёзки-Дачные": 122, "Зел.Крюково|Подсолнечная": 200, "Тверь|Москва Окт.": 900, "Москва Окт.|Химки": 278, "Москва Окт.|Клин": 597 };

let cloudOccupancy = {}, cloudRegistry = [], cloudNotifications = [], cloudTabelByMonth = {}, cloudArchive = [];
let lastNotifCount = 0;

let workersTabelDb = [
    { tab: "6527", fio: "Бурлаков Даниил Сергеевич", role: "viewer", position: "Кассир-контролер", station: "Клин", sector: "УФОСЭ Клин", shiftStatus: "none" },
    { tab: "8065", fio: "Волков Виктор Сергеевич", role: "founder", position: "Основатель", station: "Клин", sector: "УФОСЭ Клин", shiftStatus: "none" }
];

function getEmptyBenefits() { return { rzd:{count:0,sum:0}, fed:{count:0,sum:0}, reg:{count:0,sum:0}, stud:{count:0,sum:0}, vohr:{count:0,sum:0} }; }

let appState = {
    user: null, trainsInFdu: 0, lastMkassaTix: 0, lastMkassaMoney: 0,
    extraCash: [], extraShifts: [], extraTests: [], currentShiftMkassa: "",
    shiftState: "none",
    shiftHistory: JSON.parse(localStorage.getItem('kkl_shift_history') || '[]'),
    syncStation: "Клин", syncRoute: "13", syncRecords: [],
    workers: workersTabelDb, tabelDirty: false, drawerTarget: null, distDay: 'today',
    orgTab: 'positions', orgSelectedId: null, editingId: null,
    settingsTab: 'mkassas', settingsSelectedId: null, routeSaveStep: 1,
    msHideDone: false, msCalMonth: new Date().getMonth(), msCalYear: new Date().getFullYear(), msCalVisible: true
};
let currentTrainBenefits = getEmptyBenefits(), activeBenefitCategory = null, rcTripMode = "oneway";

// === АВТОСОХРАНЕНИЕ АКТИВНОЙ СМЕНЫ И ФДУ (ВЫЖИВАЕТ ПОСЛЕ F5) ===
function persistActiveShift() {
    let fduLeftRows = Array.from(document.querySelectorAll('#fduLeftBody .train-slot-row')).map(tr => ({
        num: tr.querySelector('.fdu-train-num')?.value || '',
        route: tr.querySelector('.fdu-train-route')?.value || '',
        time: tr.querySelector('.fdu-train-time')?.value || '',
        tix: tr.querySelector('.fdu-train-tix')?.value || '',
        sum: tr.querySelector('.fdu-train-sum')?.value || ''
    }));
    let fduRightRows = Array.from(document.querySelectorAll('#fduRightBody .benefit-slot-row')).map(tr =>
        Array.from(tr.querySelectorAll('input')).map(i => i.value)
    );
    let snap = {
        shiftState: appState.shiftState,
        trainsInFdu: appState.trainsInFdu,
        lastMkassaTix: appState.lastMkassaTix,
        lastMkassaMoney: appState.lastMkassaMoney,
        currentShiftMkassa: appState.currentShiftMkassa,
        extraCash: appState.extraCash, extraShifts: appState.extraShifts, extraTests: appState.extraTests,
        fduFields: {
            fduD0: document.getElementById('fduD0')?.value || '',
            fduRouteVal: document.getElementById('fduRouteVal')?.value || '',
            fduCashVal: document.getElementById('fduCashVal')?.value || '',
            fduFundVal: document.getElementById('fduFundVal')?.value || '',
            fduPersVal: document.getElementById('fduPersVal')?.value || '',
            fduWorkTypeVal: document.getElementById('fduWorkTypeVal')?.value || '',
            fduVideoRegVal: document.getElementById('fduVideoRegVal')?.value || '',
            fduTestTicketCount: document.getElementById('fduTestTicketCount')?.value || '',
            fduTapeLeft: document.getElementById('fduTapeLeft')?.value || '',
            fduTotalSumBottom: document.getElementById('fduTotalSumBottom')?.value || '',
            fduShiftEndTime: document.getElementById('fduShiftEndTime')?.value || '',
            fduGuoSignField: document.getElementById('fduGuoSignField')?.value || ''
        },
        fduGrandTickets: document.getElementById('fduGrandTickets')?.innerText || '0',
        fduGrandSum: document.getElementById('fduGrandSum')?.innerText || '0.00',
        shCells: {
            shCellNum1: document.getElementById('shCellNum1')?.innerText || '—',
            shCellTest1: document.getElementById('shCellTest1')?.innerText || '—',
            shCellTariff1: document.getElementById('shCellTariff1')?.innerText || '—',
            shCellFee1: document.getElementById('shCellFee1')?.innerText || '—',
            shCellCash1: document.getElementById('shCellCash1')?.innerText || '—',
            shCellCard1: document.getElementById('shCellCard1')?.innerText || '—',
            shCellBen1: document.getElementById('shCellBen1')?.innerText || '—'
        },
        fduLeftRows, fduRightRows
    };
    localStorage.setItem('kkl_active_shift_v4', JSON.stringify(snap));
}

function restoreActiveShift() {
    let snap = JSON.parse(localStorage.getItem('kkl_active_shift_v4') || 'null');
    if (!snap) return;
    appState.shiftState = snap.shiftState || 'none';
    appState.trainsInFdu = snap.trainsInFdu || 0;
    appState.lastMkassaTix = snap.lastMkassaTix || 0;
    appState.lastMkassaMoney = snap.lastMkassaMoney || 0;
    appState.currentShiftMkassa = snap.currentShiftMkassa || '';
    appState.extraCash = snap.extraCash || [];
    appState.extraShifts = snap.extraShifts || [];
    appState.extraTests = snap.extraTests || [];

    Object.keys(snap.fduFields || {}).forEach(id => { let el = document.getElementById(id); if (el) el.value = snap.fduFields[id]; });
    if (document.getElementById('fduGrandTickets')) document.getElementById('fduGrandTickets').innerText = snap.fduGrandTickets || '0';
    if (document.getElementById('fduGrandSum')) document.getElementById('fduGrandSum').innerText = snap.fduGrandSum || '0.00';
    Object.keys(snap.shCells || {}).forEach(id => { let el = document.getElementById(id); if (el) el.innerText = snap.shCells[id]; });

    let lRows = document.querySelectorAll('#fduLeftBody .train-slot-row');
    (snap.fduLeftRows || []).forEach((r, i) => {
        if (!lRows[i]) return;
        lRows[i].querySelector('.fdu-train-num').value = r.num;
        lRows[i].querySelector('.fdu-train-route').value = r.route;
        lRows[i].querySelector('.fdu-train-time').value = r.time;
        lRows[i].querySelector('.fdu-train-tix').value = r.tix;
        lRows[i].querySelector('.fdu-train-sum').value = r.sum;
    });
    let rRows = document.querySelectorAll('#fduRightBody .benefit-slot-row');
    (snap.fduRightRows || []).forEach((vals, i) => {
        if (!rRows[i]) return;
        let inps = rRows[i].querySelectorAll('input');
        vals.forEach((v, j) => { if (inps[j]) inps[j].value = v; });
    });
    updateShiftMainButton();
}

function updateShiftMainButton() {
    let btn = document.getElementById('btnMainShift');
    if (!btn) return;
    if (appState.shiftState === 'open') {
        btn.className = "btn-shift-status btn-success";
        btn.innerText = "🟢 Смена открыта (Редакт.)";
    } else if (appState.shiftState === 'closed') {
        btn.className = "btn-shift-status btn-danger";
        btn.innerText = "🔴 Смена закрыта";
    } else {
        btn.className = "btn-shift-status btn-danger";
        btn.innerText = "🔴 Смена не открыта";
    }
}

// === РОЛИ И ПРАВА ===
function getUserRole() { return !appState.user ? 'viewer' : (appState.user.tab === '8065' ? 'founder' : (appState.user.role || 'viewer')); }
function canCreateWorker() { let r = getUserRole(); return r === 'founder' || r === 'admin'; }
function canEditTabel() { let r = getUserRole(); return r === 'founder' || r === 'admin' || r === 'tabel'; }

function applyRolePermissions() {
    let role = getUserRole();
    if (role === 'founder') {
        document.querySelectorAll('[data-perm]').forEach(el => el.style.display = '');
        document.getElementById('menuSettings').style.display = 'block';
        return;
    }
    let posObj = positionsDb.find(p => p.name === appState.user?.position || p.role === role);
    let allowed = posObj ? posObj.perms : allPermKeys;
    document.querySelectorAll('[data-perm]').forEach(el => {
        let k = el.getAttribute('data-perm');
        if (k === 'main' || k === 'profile') return;
        el.style.display = allowed.includes(k) ? '' : 'none';
    });
}

// === ЗВУК И УВЕДОМЛЕНИЯ ===
function playNotificationSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator(), g = ctx.createGain();
        osc.frequency.setValueAtTime(880, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
        g.gain.setValueAtTime(0.15, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(g); g.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.35);
    } catch(e) {}
}
function sendCloudNotification(text, dedupeId) {
    let id = dedupeId || ('notif_' + Date.now());
    let obj = { text, time: new Date().toLocaleString('ru-RU'), ts: Date.now(), read: false };
    if (db) db.collection('notifications').doc(id).get().then(d => { if (!d.exists) db.collection('notifications').doc(id).set(obj); }).catch(()=>{});
}
function showSyncToast(msg) { let t = document.getElementById('autoSyncToast'); if(t){ t.innerText = msg; t.style.display = 'block'; setTimeout(()=>t.style.display='none', 2500); } }
function rebuildStationsDatalist() { let dl = document.getElementById('stationsDatalist'); if(dl) dl.innerHTML = stationsDb.map(s => `<option value="${s.name}">`).join(''); }

// === FIREBASE СИНХРОНИЗАЦИЯ ===
function startCloudSync() {
    if (!db) return;
    db.collection('workers').onSnapshot(s => {
        if (s.empty) workersTabelDb.forEach(w => db.collection('workers').doc(w.tab).set(w));
        else { appState.workers = []; s.forEach(d => appState.workers.push(d.data())); renderTabel(); if(appState.orgTab==='workers') renderOrgTable(); }
    });
    db.collection('tabel').onSnapshot(s => { s.forEach(d => cloudTabelByMonth[d.id] = d.data()); renderTabel(); checkMissedShiftsAndNotify(); });
    db.collection('occupancy').onSnapshot(s => { s.forEach(d => cloudOccupancy[d.id] = d.data()); });
    db.collection('registry').onSnapshot(s => { cloudRegistry = []; s.forEach(d => cloudRegistry.push(d.data())); cloudRegistry.sort((a,b)=>(a.date||'').localeCompare(b.date||'')); renderRegistryTable(); });
    db.collection('notifications').onSnapshot(s => {
        cloudNotifications = []; s.forEach(d => cloudNotifications.push({ id: d.id, ...d.data() }));
        cloudNotifications.sort((a,b)=>(b.ts||0)-(a.ts||0));
        let unread = cloudNotifications.filter(n => !n.read).length;
        if (unread > lastNotifCount) playNotificationSound();
        lastNotifCount = unread;
        let badge = document.getElementById('bellBadge'); if(badge){ badge.innerText = unread; badge.style.display = unread > 0 ? 'flex' : 'none'; }
    });
    db.collection('positions').onSnapshot(s => { if(!s.empty){ positionsDb = []; s.forEach(d => positionsDb.push(d.data())); if(appState.orgTab==='positions') renderOrgTable(); applyRolePermissions(); } });
    db.collection('departments').onSnapshot(s => { if(!s.empty){ departmentsDb = []; s.forEach(d => departmentsDb.push(d.data())); if(appState.orgTab==='departments') renderOrgTable(); } });
    db.collection('mkassas').onSnapshot(s => { if(!s.empty){ mkassasDb = []; s.forEach(d => mkassasDb.push(d.data())); if(appState.settingsTab==='mkassas') renderSettingsTable(); } });
    db.collection('routes').onSnapshot(s => { if(!s.empty){ routesDb = []; s.forEach(d => routesDb.push(d.data())); if(appState.settingsTab==='routes') renderSettingsTable(); } });
    db.collection('trains').onSnapshot(s => { if(!s.empty){ trainsDb = []; s.forEach(d => trainsDb.push(d.data())); if(appState.settingsTab==='trains') renderSettingsTable(); } });
    db.collection('stations').onSnapshot(s => { if(!s.empty){ stationsDb = []; s.forEach(d => stationsDb.push(d.data())); rebuildStationsDatalist(); if(appState.settingsTab==='stations') renderSettingsTable(); } });
    db.collection('archive_reports').onSnapshot(s => { cloudArchive = []; s.forEach(d => cloudArchive.push(d.data())); cloudArchive.sort((a,b)=>(b.ts||0)-(a.ts||0)); renderReportsArchive(); });
}

// === ЗАГРУЗКА ===
window.addEventListener('load', () => {
    startCloudSync();
    rebuildStationsDatalist();
    restoreActiveShift();

    let now = new Date();
    document.getElementById('tabelMonthSelect').value = now.getMonth();
    document.getElementById('tabelYearSelect').value = now.getFullYear();
    let fD = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    let lD = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    ['regFilterFrom','reDateFrom'].forEach(id => document.getElementById(id).value = fD);
    ['regFilterTo','reDateTo'].forEach(id => document.getElementById(id).value = lD);

    setTimeout(() => {
        let sp = document.getElementById('splash-screen');
        if(sp){ sp.style.opacity = '0'; setTimeout(() => {
            sp.style.display = 'none';
            let saved = JSON.parse(localStorage.getItem('kkl_profile') || 'null');
            if (saved && saved.completed) { appState.user = saved; showMainScreen(saved); }
            else { document.getElementById('login-screen').classList.add('active-screen'); initCanvas('sigCanvas'); }
        }, 400); }
    }, 1300);
});

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function toggleTheme() { document.body.classList.toggle('dark-theme'); }
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('sidebarOverlay').classList.toggle('active'); }
function hideAllScreens() { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active-screen')); }
function navTo(id) { hideAllScreens(); let s = document.getElementById(id + '-screen'); if(s) s.classList.add('active-screen'); document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebarOverlay').classList.remove('active'); }
function backToMain() { let p = JSON.parse(localStorage.getItem('kkl_profile') || 'null') || appState.user; if (p) showMainScreen(p); }
function sidebarNav(t) {
    toggleSidebar();
    if (t === 'tabel') openTabelScreen();
    else if (t === 'main') backToMain();
    else if (t === 'profile') openProfileScreen();
    else if (t === 'myShift') openMyShiftScreen();
    else if (t === 'registry') openRegistry();
    else if (t === 'org') { navTo('org'); switchOrgTab('positions'); }
    else if (t === 'settings') { navTo('settings'); switchSettingsTab('mkassas'); }
    else if (t === 'reports') { navTo('reports'); renderReportsArchive(); }
    else navTo(t);
}
function addLog(text) {
    let l = document.getElementById('auditLogList'); if(!l) return;
    let e = document.createElement('div'); e.className = 'audit-log-entry';
    e.innerHTML = `<strong>[${new Date().toLocaleTimeString('ru-RU')}]</strong> ${text}`;
    if (l.children.length === 1 && l.children[0].innerText.includes('отсутствуют')) l.innerHTML = '';
    l.prepend(e);
}

// === ВХОД С ПРОВЕРКОЙ / УСТАНОВКОЙ ПАРОЛЯ ===
function checkUserStep1() {
    let tab = document.getElementById('loginTab').value.trim(), last = document.getElementById('loginLast').value.trim();
    let found = appState.workers.find(w => w.tab === tab && w.fio.toLowerCase().includes(last.toLowerCase()));
    if (!found) return alert('Сотрудник не найден! (Пример: 8065 и Волков)');
    appState.user = found;
    document.getElementById('loginStep1').style.display = 'none';
    document.getElementById('logFoundName').innerText = last;
    document.getElementById('logFoundTab').innerText = tab;
    document.getElementById('logFoundFull').innerText = found.fio;

    let savedLocal = JSON.parse(localStorage.getItem('kkl_profile_' + tab) || 'null');
    let hasPass = !!(found.password || savedLocal?.password);
    document.getElementById('loginPassLabel').innerText = hasPass ? 'Введите ваш пароль:' : 'Пароль еще не установлен — придумайте пароль:';
    document.getElementById('loginPassInput').value = '';
    document.getElementById('loginStep2').style.display = 'block';
}
function confirmLoginUser() {
    let enteredPass = document.getElementById('loginPassInput').value.trim();
    let tab = appState.user.tab;
    let savedLocal = JSON.parse(localStorage.getItem('kkl_profile_' + tab) || 'null');
    let storedPass = appState.user.password || savedLocal?.password || '';

    if (storedPass) {
        if (enteredPass !== storedPass) return alert('Неверный пароль!');
        let merged = { ...(savedLocal || {}), ...appState.user, password: storedPass, completed: true };
        appState.user = merged;
        localStorage.setItem('kkl_profile', JSON.stringify(merged));
        if (merged.profileCompleted || savedLocal?.completed) showMainScreen(merged);
        else openRegistrationForUser(merged);
    } else {
        if (!enteredPass) return alert('Придумайте и введите пароль для защиты личных данных!');
        appState.user.password = enteredPass;
        if (db) db.collection('workers').doc(tab).set({ password: enteredPass }, { merge: true }).catch(()=>{});
        if (appState.user.profileCompleted || savedLocal?.completed) {
            let merged = { ...(savedLocal || {}), ...appState.user, password: enteredPass, completed: true };
            localStorage.setItem('kkl_profile', JSON.stringify(merged));
            localStorage.setItem('kkl_profile_' + tab, JSON.stringify(merged));
            showMainScreen(merged);
        } else openRegistrationForUser(appState.user);
    }
}
function openRegistrationForUser(u) {
    hideAllScreens();
    document.getElementById('register-screen').classList.add('active-screen');
    document.getElementById('regTab').value = u.tab;
    document.getElementById('regFio').value = u.fio;
    ['regPos','regDoc','regIssue','regExpiry','regStation','regVideoReg'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('regPass').value = u.password || '';
    initCanvas('sigCanvas');
}
function resetLogin() { document.getElementById('loginStep2').style.display='none'; document.getElementById('loginStep1').style.display='block'; }
function logout() { toggleSidebar(); hideAllScreens(); document.getElementById('menuBtn').style.display='none'; document.getElementById('bellBtn').style.display='none'; document.getElementById('login-screen').classList.add('active-screen'); resetLogin(); }

// === ХОЛСТ ПОДПИСИ ===
let sigCtxMap = {};
function initCanvas(canvasId) {
    let c = document.getElementById(canvasId); if (!c) return;
    let ctx = c.getContext('2d'); c.width = c.offsetWidth || 380; c.height = 90;
    ctx.lineWidth = 2; ctx.strokeStyle = '#003366';
    let painting = false;
    const getPos = e => { let r = c.getBoundingClientRect(), t = e.touches ? e.touches[0] : e; return { x: t.clientX - r.left, y: t.clientY - r.top }; };
    const start = e => { painting = true; let p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
    const move = e => { if (!painting) return; e.preventDefault(); let p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); };
    const end = () => { painting = false; };
    c.onmousedown = start; c.onmousemove = move; c.onmouseup = end;
    c.ontouchstart = start; c.ontouchmove = move; c.ontouchend = end;
    sigCtxMap[canvasId] = { c, ctx };
}
function clearSignature() { let s = sigCtxMap['sigCanvas']; if(s) s.ctx.clearRect(0,0,s.c.width,s.c.height); }
function clearGuoSig() { let s = sigCtxMap['guoSigCanvas']; if(s) s.ctx.clearRect(0,0,s.c.width,s.c.height); }

function saveRegistration() {
    let pass = document.getElementById('regPass').value.trim();
    if (!pass) return alert('Укажите пароль для входа!');
    let sigData = sigCtxMap['sigCanvas'] ? sigCtxMap['sigCanvas'].c.toDataURL() : '';
    let p = {
        tab: appState.user.tab, fio: appState.user.fio,
        role: appState.user.tab === '8065' ? 'founder' : (appState.user.role || 'viewer'),
        position: document.getElementById('regPos').value.trim(),
        doc: document.getElementById('regDoc').value.trim(),
        issue: document.getElementById('regIssue').value,
        expiry: document.getElementById('regExpiry').value,
        station: document.getElementById('regStation').value.trim(),
        sector: appState.user.sector || 'УФОСЭ Клин',
        videoReg: document.getElementById('regVideoReg').value.trim(),
        password: pass, signature: sigData,
        completed: true, profileCompleted: true
    };
    appState.user = p;
    localStorage.setItem('kkl_profile', JSON.stringify(p));
    localStorage.setItem('kkl_profile_' + p.tab, JSON.stringify(p));
    if(db) db.collection('workers').doc(p.tab).set(p, { merge: true }).catch(()=>{});
    showMainScreen(p);
}

// === ПРОФИЛЬ С КАРАНДАШОМ ✏️ ===
function openProfileScreen() {
    let u = appState.user || {};
    document.getElementById('pfTab').value = u.tab || '';
    document.getElementById('pfFio').value = u.fio || '';
    document.getElementById('pfPos').value = u.position || '';
    document.getElementById('pfDoc').value = u.doc || '';
    document.getElementById('pfIssue').value = u.issue || '';
    document.getElementById('pfExpiry').value = u.expiry || '';
    document.getElementById('pfStation').value = u.station || '';
    document.getElementById('pfSector').value = u.sector || '';
    document.getElementById('pfVideoReg').value = u.videoReg || '';
    document.getElementById('pfPass').value = u.password || '';
    document.getElementById('pfSigImg').src = u.signature || '';
    document.querySelectorAll('.pf-editable').forEach(i => i.disabled = true);
    document.getElementById('btnSaveProfileEdit').style.display = 'none';
    navTo('profile');
}
function enableProfileEdit() {
    document.querySelectorAll('.pf-editable').forEach(i => i.disabled = false);
    document.getElementById('btnSaveProfileEdit').style.display = 'block';
}
function saveProfileEdit() {
    let u = appState.user; if (!u) return;
    u.position = document.getElementById('pfPos').value.trim();
    u.doc = document.getElementById('pfDoc').value.trim();
    u.issue = document.getElementById('pfIssue').value;
    u.expiry = document.getElementById('pfExpiry').value;
    u.station = document.getElementById('pfStation').value.trim();
    u.sector = document.getElementById('pfSector').value.trim();
    u.videoReg = document.getElementById('pfVideoReg').value.trim();
    u.password = document.getElementById('pfPass').value.trim();
    localStorage.setItem('kkl_profile', JSON.stringify(u));
    localStorage.setItem('kkl_profile_' + u.tab, JSON.stringify(u));
    if (db) db.collection('workers').doc(u.tab).set(u, { merge: true }).catch(()=>{});
    document.querySelectorAll('.pf-editable').forEach(i => i.disabled = true);
    document.getElementById('btnSaveProfileEdit').style.display = 'none';
    showSyncToast('☁️ Профиль сохранен');
}

function showMainScreen(user) {
    hideAllScreens(); document.getElementById('main-screen').classList.add('active-screen');
    document.getElementById('menuBtn').style.display='block'; document.getElementById('bellBtn').style.display='flex';
    document.getElementById('mainTitleMonth').innerText = `Личные данные — ${monthNamesRu[new Date().getMonth()]}`;
    document.getElementById('sidebarUserName').innerText = user.fio || "Сотрудник";
    if (user.videoReg && document.getElementById('shVideoReg')) document.getElementById('shVideoReg').value = user.videoReg;
    updateShiftMainButton(); applyRolePermissions(); updateDashboardTotals(); checkMissedShiftsAndNotify();
}

// === МОЯ СМЕНА ===
function openMyShiftScreen() { navTo('myShift'); renderMyShift(); }
function timeToMin(t) { if(!t||!t.includes(':')) return null; let [h,m] = t.split(':').map(Number); return isNaN(h)||isNaN(m)?null:h*60+m; }
function formatDurMin(mins) { if (mins <= 0) return '0 мин'; let h = Math.floor(mins / 60), m = mins % 60; return h > 0 ? `${h} ч ${m} мин` : `${m} мин`; }
function getWorkerRouteForDate(tab, dObj) { let ym = `${dObj.getFullYear()}-${String(dObj.getMonth()+1).padStart(2,'0')}`; return cloudTabelByMonth[ym]?.[tab]?.[String(dObj.getDate())] || null; }

function renderMyShift() {
    let now = new Date(), tom = new Date(); tom.setDate(now.getDate() + 1);
    let myTab = appState.user?.tab || '8065';

    document.getElementById('msTodayDateLabel').innerText = `Сегодня, ${dayNamesRu[now.getDay()]} ${now.getDate()} ${monthNamesGen[now.getMonth()]}`;
    let todayCell = getWorkerRouteForDate(myTab, now);
    let routeNum = todayCell?.route || '13';
    let routeObj = routesDb.find(r => r.num === routeNum) || routesDb[0];
    let rows = (routeObj?.rows || []).filter(r => r.train);

    document.getElementById('msTodayRouteTitle').innerText = routeNum === 'В' ? 'Выходной' : `Маршрут ${routeNum}`;
    let firstT = rows[0]?.start || '06:24', lastT = rows[rows.length-1]?.end || '19:25';
    document.getElementById('msTodayTimeRange').innerText = `${routeObj?.hours || '9,9'} ч · ${firstT}–${lastT}`;
    document.getElementById('msTodayGraphNote').innerText = `По маршрутам ${routeObj?.hours || '9,9'} ч, в графике 10,3 ч. В табель идёт время по маршрутам.`;

    let curMin = now.getHours() * 60 + now.getMinutes(), doneCount = 0, html = '';
    rows.forEach((r, idx) => {
        let sM = timeToMin(r.start) ?? 0, eM = timeToMin(r.end) ?? 0, isDone = curMin >= eM;
        if (isDone) doneCount++;
        if (appState.msHideDone && isDone) return;

        let durM = eM >= sM ? eM - sM : eM + 1440 - sM;
        let trObj = trainsDb.find(t => t.num === r.train), stops = trObj?.stops || [];
        let sharedHtml = (r.shared && r.shared.length) ? `<div class="ms-shared-routes">Также на поезде маршруты ${r.shared.map(x=>`<span class="ms-route-pill">${x}</span>`).join('')}</div>` : '';
        let stopsHtml = stops.map(st => `<div style="display:flex;justify-content:space-between;padding:2px 0;"><span>${st.name}</span><span>${st.time}</span></div>`).join('') || '<div>Остановки не заданы в Настройках → Поезда</div>';
        let occExists = !!cloudOccupancy[getOccDocId(r.train)];

        html += `<div class="ms-train-card ${isDone?'done':''}">
            <div class="ms-train-top"><div class="ms-train-num">${r.train} <span class="ms-green-dot"></span></div><div class="ms-status-txt">${isDone ? 'завершён' : 'ожидается'}</div></div>
            <div class="ms-route-sub">${r.route}</div>
            <div class="ms-times">${r.start} → ${r.end} <span>· ${formatDurMin(durM)} в пути</span></div>
            ${sharedHtml}
            ${occExists ? '<div class="ms-colleague-ok">✓ внесено коллегой</div>' : ''}
            <div class="ms-btn-row">
                <button class="ms-act-btn" onclick="openOccupancyForTrain('${r.train}')">Исправить</button>
                <button class="ms-act-btn" onclick="sidebarNav('inspections')">Осмотр</button>
                <button class="ms-act-btn" onclick="sidebarNav('raports')">Рапорт</button>
            </div>
            <span class="ms-stops-toggle" onclick="toggleMsStops('msStops_${idx}')">Остановки (${stops.length})</span>
            <div class="ms-stops-list" id="msStops_${idx}">${stopsHtml}</div>
        </div>`;

        if (idx < rows.length - 1) {
            let nextS = timeToMin(rows[idx+1].start);
            if (nextS !== null && eM !== null && nextS > eM) html += `<div class="ms-break-line">перерыв ${formatDurMin(nextS - eM)}</div>`;
        }
    });

    document.getElementById('msCompletedCounter').innerText = `Завершено ${doneCount} из ${rows.length}`;
    document.getElementById('msHideDoneBtn').innerText = appState.msHideDone ? 'Показать завершённые' : 'Скрыть завершённые';
    document.getElementById('msTimelineContainer').innerHTML = html || '<div style="color:#64748b;padding:10px;">Все поезда скрыты или выходной</div>';

    let ymToday = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`, dToday = String(now.getDate());
    let peers = appState.workers.filter(w => cloudTabelByMonth[ymToday]?.[w.tab]?.[dToday]?.route === routeNum);
    let senior = peers.find(w => cloudTabelByMonth[ymToday]?.[w.tab]?.[dToday]?.senior);
    document.getElementById('msTodayCrewBox').innerHTML = `<strong>Старший:</strong> ${senior ? senior.fio : 'Не назначен'}<br>Со мной на маршруте: ${peers.map(w => w.fio).join(', ') || (appState.user?.fio || '—')}`;

    let tomCell = getWorkerRouteForDate(myTab, tom), tomRouteNum = tomCell?.route || '22';
    let tomObj = routesDb.find(r => r.num === tomRouteNum), tomRows = (tomObj?.rows || []).filter(r => r.train);
    let ymTom = `${tom.getFullYear()}-${String(tom.getMonth()+1).padStart(2,'0')}`, dTom = String(tom.getDate());
    let tomPeers = appState.workers.filter(w => cloudTabelByMonth[ymTom]?.[w.tab]?.[dTom]?.route === tomRouteNum);
    let tomSen = tomPeers.find(w => cloudTabelByMonth[ymTom]?.[w.tab]?.[dTom]?.senior);

    document.getElementById('msTomorrowBox').innerHTML = `
        <div class="ms-header-top">
            <div><div class="ms-date-sub">Завтра, ${dayNamesRu[tom.getDay()]} ${tom.getDate()} ${monthNamesGen[tom.getMonth()]}</div>
            <div style="font-size:20px;font-weight:bold;color:#fff;">${tomRouteNum==='В'?'Выходной':'Маршрут '+tomRouteNum}</div></div>
            <div class="ms-time-right">${tomObj?.hours||'10,3'} ч · ${tomRows[0]?.start||'08:53'}–${tomRows[tomRows.length-1]?.end||'21:24'}</div>
        </div>
        <div style="font-size:12px;color:#94a3b8;margin-bottom:8px;">Первый поезд ${tomRows[0]?.train||'7903'} в ${tomRows[0]?.start||'08:53'}.</div>
        <div style="font-size:13px;color:#cbd5e1;"><strong>Старший:</strong> ${tomSen?tomSen.fio:'Не назначен'}<br>Со мной на маршруте: ${tomPeers.map(w=>w.fio).join(', ')||'—'}</div>`;

    renderMyShiftCalendar();
}
function toggleMsStops(id) { let el = document.getElementById(id); if(el) el.style.display = el.style.display==='block'?'none':'block'; }
function toggleHideDoneTrains() { appState.msHideDone = !appState.msHideDone; renderMyShift(); }
function toggleMyShiftCal() { appState.msCalVisible = !appState.msCalVisible; document.getElementById('msCalWrap').style.display = appState.msCalVisible?'block':'none'; document.getElementById('msToggleCalBtn').innerText = appState.msCalVisible?'Скрыть график':'Показать график'; }
function shiftMyCalMonth(delta) { appState.msCalMonth += delta; if (appState.msCalMonth < 0) { appState.msCalMonth = 11; appState.msCalYear--; } if (appState.msCalMonth > 11) { appState.msCalMonth = 0; appState.msCalYear++; } renderMyShiftCalendar(); }
function renderMyShiftCalendar() {
    let m = appState.msCalMonth, y = appState.msCalYear, myTab = appState.user?.tab || '8065';
    let ym = `${y}-${String(m+1).padStart(2,'0')}`, daysInM = new Date(y, m+1, 0).getDate();
    let firstDow = (new Date(y, m, 1).getDay() + 6) % 7, now = new Date(), isCurM = now.getFullYear()===y && now.getMonth()===m;
    document.getElementById('msCalMonthTitle').innerText = `Мой ${monthNamesRu[m].toLowerCase()}`;
    let grid = ['пн','вт','ср','чт','пт','сб','вс'].map(d => `<div class="ms-cal-dow">${d}</div>`).join('');
    for(let i=0; i<firstDow; i++) grid += `<div></div>`;
    let shifts = 0, totalH = 0;
    for(let d=1; d<=daysInM; d++) {
        let cell = cloudTabelByMonth[ym]?.[myTab]?.[String(d)], isWork = cell?.route && cell.route !== 'В';
        if (isWork) { shifts++; totalH += parseFloat(String(cell.hours||'0').replace(',','.'))||0; }
        let cls = 'ms-cal-cell' + (isWork?' work':'') + (isCurM && d===now.getDate()?' today':'');
        grid += `<div class="${cls}"><span>${d}</span><small>${cell?.route || 'В'}</small></div>`;
    }
    document.getElementById('msCalStats').innerText = `${shifts} смен · ${totalH.toFixed(1).replace('.',',')} ч по маршрутам`;
    document.getElementById('msCalGrid').innerHTML = grid;
}
function openOccupancyForTrain(trNum) { openOccupancy(); document.getElementById('occTrainInput').value = trNum; checkOccupancyTrain(trNum); }
function verifyTrainsSchedule() {
    let myTab = appState.user?.tab || '8065', todayCell = getWorkerRouteForDate(myTab, new Date());
    let routeObj = routesDb.find(r => r.num === (todayCell?.route || '13')) || routesDb[0];
    let missing = [];
    (routeObj?.rows || []).filter(r => r.train).forEach(r => {
        let tr = trainsDb.find(t => t.num === r.train);
        if (!tr || !tr.stops || tr.stops.length < 2) missing.push(r.train);
        else { r.start = tr.dep; r.end = tr.arr; }
    });
    if (missing.length > 0) {
        if (confirm(`По поездам № ${missing.join(', ')} отсутствуют данные или остановки! Открыть Настройки → Поезда для создания/изменения?`)) {
            navTo('settings'); switchSettingsTab('trains');
        }
    } else {
        let now = new Date();
        document.getElementById('msYandexSyncBadge').innerText = `● Сверено ${String(now.getDate()).padStart(2,'0')}.${String(now.getMonth()+1).padStart(2,'0')} ${now.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}`;
        renderMyShift();
        showSyncToast('✅ Все поезда маршрута соответствуют по номеру и остановкам');
    }
}

// === ЗАКРЫТИЕ РАПОРТА СМЕНЫ ЧЕРЕЗ РОСПИСЬ ОПЕРАТОРА ГУО ===
function openGuoSignModal() { document.getElementById('guoOperatorName').value = ''; openModal('guoSignModal'); setTimeout(() => initCanvas('guoSigCanvas'), 100); }
function confirmGuoSignAndCloseShift() {
    let opName = document.getElementById('guoOperatorName').value.trim();
    if (!opName) return alert('Введите Ф.И.О. оператора ГУО!');
    let closedAt = new Date().toLocaleString('ru-RU');
    document.getElementById('fduShiftEndTime').value = closedAt;
    document.getElementById('fduGuoSignField').value = `${opName} (${closedAt})`;

    let sigImg = sigCtxMap['guoSigCanvas'] ? sigCtxMap['guoSigCanvas'].c.toDataURL() : '';
    let route = document.getElementById('fduRouteVal').value || '—';
    let grandTix = document.getElementById('fduGrandTickets').innerText;
    let grandSum = document.getElementById('fduGrandSum').innerText;
    let rowsHtml = Array.from(document.querySelectorAll('#fduLeftBody .train-slot-row')).map(tr => {
        let n = tr.querySelector('.fdu-train-num').value;
        if (!n) return '';
        return `<tr><td>${n}</td><td>${tr.querySelector('.fdu-train-route').value}</td><td>${tr.querySelector('.fdu-train-time').value}</td><td>${tr.querySelector('.fdu-train-tix').value}</td><td>${tr.querySelector('.fdu-train-sum').value}</td></tr>`;
    }).join('');

    let reportHtml = `<h3>Рапорт смены ФДУ — Маршрут ${route}</h3>
        <p><strong>Сотрудник:</strong> ${appState.user?.fio||''} | <strong>Закрыто:</strong> ${closedAt} | <strong>Оператор ГУО:</strong> ${opName}</p>
        <table border="1" style="border-collapse:collapse;width:100%;">
            <tr style="background:#dce6f1;"><th>№ поезда</th><th>Перегон</th><th>Время</th><th>Билетов</th><th>Сумма</th></tr>
            ${rowsHtml}
            <tr style="font-weight:bold;"><td colspan="3">Итого:</td><td>${grandTix}</td><td>${grandSum}</td></tr>
        </table>
        <p>Подпись оператора ГУО:<br><img src="${sigImg}" style="height:50px;border:1px solid #ccc;"></p>`;

    let archItem = { id: 'rep_fdu_' + Date.now(), folder: `ФДУ Маршрут ${route} — ${closedAt} (Закрыл: ${opName})`, author: `${appState.user?.fio||''} / ГУО: ${opName}`, ts: Date.now(), html: reportHtml };
    if (db) db.collection('archive_reports').doc(archItem.id).set(archItem); else cloudArchive.unshift(archItem);

    appState.shiftState = 'closed'; appState.lastMkassaTix = 0; appState.lastMkassaMoney = 0;
    if (appState.user) {
        appState.user.shiftActive = false; appState.user.shiftStatus = 'closed';
        if (db) db.collection('workers').doc(appState.user.tab).update({ shiftActive: false, shiftStatus: 'closed' }).catch(()=>{});
    }
    persistActiveShift(); updateShiftMainButton(); closeModal('guoSignModal');
    addLog(`Смена закрыта (${closedAt}), подписал оператор ГУО: ${opName}.`);
    alert(`Смена закрыта! Рапорт отправлен в Архив отчетов (PDF и Excel).`);
    sidebarNav('reports');
}

// === УВЕДОМЛЕНИЯ ===
function openNotificationsModal() {
    let l = document.getElementById('notificationsList');
    l.innerHTML = cloudNotifications.length === 0 ? '<div style="color:#666;text-align:center;padding:15px;">Нет уведомлений</div>'
        : cloudNotifications.map(n => `<div style="padding:8px;border-bottom:1px solid #eee;background:${n.read?'#fff':'#eef6ff'};"><div style="font-size:11px;color:#666;">${n.time||''}</div><div style="font-size:13px;">${n.text||''}</div></div>`).join('');
    openModal('notificationsModal');
}
function markAllNotificationsRead() { cloudNotifications.forEach(n => { if(!n.read && db) db.collection('notifications').doc(n.id).update({read:true}).catch(()=>{}); n.read=true; }); document.getElementById('bellBadge').style.display='none'; closeModal('notificationsModal'); }

// === СИНХРОН ===
function openSyncLoginModal() { toggleSidebar(); autoSyncRouteByStation(); openModal('syncLoginModal'); }
function autoSyncRouteByStation() { document.getElementById('syncRouteInp').value = stationDefaultRoutes[document.getElementById('syncStationSel').value] || '13'; }
function enterSyncDashboard() {
    appState.syncStation = document.getElementById('syncStationSel').value;
    appState.syncRoute = document.getElementById('syncRouteInp').value.trim();
    document.getElementById('syncHeaderInfo').innerText = `Станция: ${appState.syncStation} | Маршрут: № ${appState.syncRoute}`;
    let stM = mkassasDb.filter(m => !appState.syncStation || m.station.toLowerCase() === appState.syncStation.toLowerCase());
    if (!stM.length) stM = mkassasDb;
    appState.syncRecords = stM.map(m => ({ mkassa: m.num, station: m.sector || m.station, fio: '—', mktf: '', tin: '', tout: '', status: 'red', reason: '' }));
    closeModal('syncLoginModal'); navTo('sync-dashboard'); renderSyncList();
}
function formatTimeInp(v) { v = (v||'').trim(); return (v.length === 4 && !v.includes(':')) ? v.slice(0,2)+':'+v.slice(2,4) : v; }
function calcDiffMin(t1, t2) { let s=timeToMin(t1), e=timeToMin(t2); if(s===null||e===null) return ''; let d=e-s; if(d<0) d+=1440; return `${d} Мин`; }
function saveSyncAnalysis() {
    let m = document.getElementById('saCash').value.trim(); if(!m) return alert("Введите № МКассы");
    let fio = document.getElementById('saFio').value.trim() || '—', tin = formatTimeInp(document.getElementById('saTimeIn').value), tout = formatTimeInp(document.getElementById('saTimeOut').value), mktf = document.getElementById('saMktf').value.trim();
    let status = !tin ? 'red' : (!tout ? 'yellow' : 'done');
    let ex = appState.syncRecords.find(r => r.mkassa === m);
    if (ex) Object.assign(ex, { fio, tin, tout, mktf, status, reason: '' });
    else appState.syncRecords.push({ mkassa: m, station: appState.syncStation, fio, mktf, tin, tout, status, reason: '' });
    ['saCash','saFio','saTimeIn','saTimeOut','saMktf'].forEach(id => document.getElementById(id).value = '');
    closeModal('syncAnalysisModal'); renderSyncList();
}
function renderSyncList() {
    let c = document.getElementById('syncListContainer'); if(!c) return;
    document.getElementById('btnSyncUnf').innerText = `Не завершенные (${appState.syncRecords.filter(r => r.status !== 'done' && !r.reason).length})`;
    c.innerHTML = appState.syncRecords.map((r, i) => {
        let stL = r.status === 'done' ? '✅ Готово' : (r.reason ? (r.reason==='Р'?'Р (В работе)':(r.reason==='З'?'❌ Ремонт':r.reason)) : (r.status==='red'?'Не пост.':'Нет снят.'));
        return `<div class="sync-row ${r.status==='done'?'sync-done':(r.reason?'sync-white':'sync-'+r.status)}" onclick="quickEditSync(${i})"><strong style="width:70px;">${r.mkassa}</strong><span style="width:90px;">${r.station}</span><span style="flex:1;">${r.fio}</span><span style="width:65px;">${r.mktf||'—'}</span><span style="width:50px;">${r.tin||'--:--'}</span><span style="width:50px;">${r.tout||'--:--'}</span><strong style="width:85px;">${stL}</strong></div>`;
    }).join('');
}
function quickEditSync(i) { let r=appState.syncRecords[i]; document.getElementById('saCash').value=r.mkassa; document.getElementById('saFio').value=r.fio==='—'?'':r.fio; document.getElementById('saTimeIn').value=r.tin; document.getElementById('saTimeOut').value=r.tout; document.getElementById('saMktf').value=r.mktf; openModal('syncAnalysisModal'); }
function openSyncUnfinished() {
    let unf = appState.syncRecords.map((r, idx) => ({ ...r, idx })).filter(r => r.status !== 'done' && !r.reason);
    document.getElementById('syncUnfList').innerHTML = !unf.length ? '<div style="padding:12px;color:#28a745;font-weight:bold;">Все МКассы обработаны!</div>'
        : unf.map(r => `<div style="display:flex;gap:8px;align-items:center;padding:8px;border-bottom:1px solid #ddd;"><strong style="width:70px;">${r.mkassa}</strong><select id="unfReason_${r.idx}" class="form-input" style="margin:0;width:140px;"><option value="Р">Р — В работе</option><option value="З">❌ — В ремонте</option><option value="Другое">Комментарий</option></select><input id="unfComment_${r.idx}" class="form-input" style="margin:0;flex:1;" placeholder="Комментарий"><button class="btn-success" style="width:auto;margin:0;padding:7px 12px;" onclick="applySyncReason(${r.idx})">ОК</button></div>`).join('');
    openModal('syncUnfinishedModal');
}
function applySyncReason(idx) { let s=document.getElementById('unfReason_'+idx).value, c=document.getElementById('unfComment_'+idx).value.trim(); appState.syncRecords[idx].reason=(s==='Другое'&&c)?c:s; renderSyncList(); openSyncUnfinished(); }
function finishAllSync() {
    if (appState.syncRecords.some(r => r.status !== 'done' && !r.reason)) { openSyncUnfinished(); return; }
    let now = new Date(), dateStr = now.toLocaleDateString('ru-RU'), dayNum = now.getDate(), dim = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
    let sorted = [...appState.syncRecords].sort((a,b) => (a.tin||'99:99').localeCompare(b.tin||'99:99'));
    let aRows = sorted.map((r,i)=>`<tr><td>${i+1}</td><td>${r.fio}</td><td>${r.station}</td><td>${appState.syncRoute}</td><td>${r.mkassa}</td><td>${r.tin||'—'}</td><td>${r.tout||'—'}</td><td>${calcDiffMin(r.tin,r.tout)||r.reason||'—'}</td><td>${r.mktf||'—'}</td></tr>`).join('');
    let dH = ''; for(let d=1;d<=dim;d++) dH+=`<th>${d}</th>`;
    let pRows = sorted.map((r,i)=>{ let mk=r.status==='done'?'✅':(r.reason==='З'?'❌':'<b>Р</b>'); let c=''; for(let d=1;d<=dim;d++) c+=`<td>${d===dayNum?mk:''}</td>`; return `<tr><td>${i+1}</td><td>${r.mkassa}</td><td>${r.station}</td>${c}</tr>`; }).join('');
    let html = `<h3>Лист анализ — ${dateStr}</h3><table border="1" style="border-collapse:collapse;width:100%;"><tr><th>№</th><th>ФИО</th><th>Участок</th><th>Маршр</th><th>МКасса</th><th>Пост</th><th>Снят</th><th>Время</th><th>МКТФ</th></tr>${aRows}</table><h3>Лист Просинхрон</h3><table border="1" style="border-collapse:collapse;width:100%;"><tr><th>№</th><th>МКасса</th><th>Участок</th>${dH}</tr>${pRows}</table>`;
    let item = { id: 'rep_sync_'+Date.now(), folder: `Синхрон — ${dateStr} (${appState.syncStation})`, author: appState.user?.fio||'', ts: Date.now(), html };
    if(db) db.collection('archive_reports').doc(item.id).set(item); else cloudArchive.unshift(item);
    sendCloudNotification(`🔄 Инструктору: завершен Синхрон (${appState.syncStation}) — ${dateStr}.`);
    alert("Синхрон завершен и сохранен в Архив Отчетов!"); sidebarNav('reports');
}

// === АРХИВ ОТЧЕТОВ ===
function renderReportsArchive() {
    let box = document.getElementById('reportsArchiveList'); if(!box) return;
    box.innerHTML = !cloudArchive.length ? '<div style="text-align:center;color:#666;padding:20px;">Отчетов пока нет.</div>'
        : cloudArchive.map((rep, idx) => `<div class="folder-card"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;"><div><strong>📁 ${rep.folder}</strong><br><small style="color:#666;">${rep.author}</small></div><div style="display:flex;gap:8px;"><button class="btn-success" style="width:auto;margin:0;padding:6px 12px;font-size:12px;" onclick="downloadArchiveExcel(${idx})">📥 Excel</button><button class="btn-danger" style="width:auto;margin:0;padding:6px 12px;font-size:12px;" onclick="printArchivePdf(${idx})">📄 PDF</button></div></div></div>`).join('');
}
function downloadArchiveExcel(i) { let r=cloudArchive[i]; if(!r) return; let a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([`<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body>${r.html}</body></html>`],{type:'application/vnd.ms-excel'})); a.download=`${r.folder}.xls`; a.click(); }
function printArchivePdf(i) { let r=cloudArchive[i]; if(!r) return; let w=window.open('','_blank'); w.document.write(`<html><head><meta charset="utf-8"><title>${r.folder}</title><style>body{font-family:Arial;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #000;padding:4px;text-align:center;}</style></head><body>${r.html}</body></html>`); w.document.close(); setTimeout(()=>w.print(),300); }

// === ОРГ. СТРУКТУРА ===
function switchOrgTab(tab) { appState.orgTab=tab; appState.orgSelectedId=null; document.getElementById('orgTabTitle').innerText=tab==='positions'?'Должности':(tab==='workers'?'Сотрудники':'Подразделение'); renderOrgTable(); }
function selectOrgRow(id) { appState.orgSelectedId=id; renderOrgTable(); }
function renderOrgTable() {
    let box = document.getElementById('orgTableContainer'); if(!box) return;
    if (appState.orgTab === 'positions') box.innerHTML = `<table class="crud-table"><thead><tr><th>Должность</th><th>Роль</th><th>Кнопок</th></tr></thead><tbody>` + positionsDb.map(p=>`<tr class="${appState.orgSelectedId===p.id?'selected-row':''}" onclick="selectOrgRow('${p.id}')" ondblclick="openPositionModal('${p.id}')"><td>${p.name}</td><td>${p.role}</td><td>${(p.perms||[]).length}</td></tr>`).join('') + `</tbody></table>`;
    else if (appState.orgTab === 'departments') box.innerHTML = `<table class="crud-table"><thead><tr><th>Подразделение</th><th>Станция</th></tr></thead><tbody>` + departmentsDb.map(d=>`<tr class="${appState.orgSelectedId===d.id?'selected-row':''}" onclick="selectOrgRow('${d.id}')" ondblclick="openDepartmentModal('${d.id}')"><td>${d.name}</td><td>${d.station}</td></tr>`).join('') + `</tbody></table>`;
    else box.innerHTML = `<table class="crud-table"><thead><tr><th>Таб. №</th><th>Ф.И.О.</th><th>Участок</th><th>Станция</th><th>Должность</th><th>Договор</th><th>Увольнение</th></tr></thead><tbody>` + appState.workers.map(w=>`<tr class="${appState.orgSelectedId===w.tab?'selected-row':''}" onclick="selectOrgRow('${w.tab}')" ondblclick="openWorkerModal('${w.tab}')"><td>${w.tab}</td><td>${w.fio}</td><td>${w.sector||'—'}</td><td>${w.station||'—'}</td><td>${w.position||'—'}</td><td>${w.hireDate||'—'}</td><td>${w.fireDate||'—'}</td></tr>`).join('') + `</tbody></table>`;
}
function orgCreateClick() { if(appState.orgTab==='positions') openPositionModal(null); else if(appState.orgTab==='departments') openDepartmentModal(null); else openWorkerModal(null); }
function orgDeleteClick() {
    if(!appState.orgSelectedId || !confirm("Удалить выбранную запись?")) return;
    let id = appState.orgSelectedId;
    if(appState.orgTab==='positions'){ positionsDb=positionsDb.filter(x=>x.id!==id); if(db) db.collection('positions').doc(id).delete(); }
    else if(appState.orgTab==='departments'){ departmentsDb=departmentsDb.filter(x=>x.id!==id); if(db) db.collection('departments').doc(id).delete(); }
    else { appState.workers=appState.workers.filter(x=>x.tab!==id); if(db) db.collection('workers').doc(id).delete(); }
    appState.orgSelectedId=null; renderOrgTable();
}
function openPositionModal(id) { appState.editingId=id; let ex=positionsDb.find(p=>p.id===id); document.getElementById('posNameInput').value=ex?ex.name:''; document.getElementById('posRoleInput').value=ex?ex.role:'viewer'; document.querySelectorAll('#posPermsGrid input').forEach(cb=>cb.checked=ex?(ex.perms||[]).includes(cb.value):true); openModal('positionModal'); }
function savePosition() { let name=document.getElementById('posNameInput').value.trim(); if(!name) return alert("Введите название"); let obj={ id:appState.editingId||('pos_'+Date.now()), name, role:document.getElementById('posRoleInput').value, perms:Array.from(document.querySelectorAll('#posPermsGrid input:checked')).map(c=>c.value) }; if(db) db.collection('positions').doc(obj.id).set(obj); else { positionsDb.push(obj); renderOrgTable(); } closeModal('positionModal'); }
function openDepartmentModal(id) { appState.editingId=id; let ex=departmentsDb.find(d=>d.id===id); document.getElementById('depNameInput').value=ex?ex.name:''; document.getElementById('depStationInput').value=ex?ex.station:''; openModal('departmentModal'); }
function saveDepartment() { let name=document.getElementById('depNameInput').value.trim(); if(!name) return; let obj={ id:appState.editingId||('dep_'+Date.now()), name, station:document.getElementById('depStationInput').value.trim() }; if(db) db.collection('departments').doc(obj.id).set(obj); else { departmentsDb.push(obj); renderOrgTable(); } closeModal('departmentModal'); }
function openWorkerModal(tab) {
    appState.editingId = tab || null;
    let sel = document.getElementById('newWorkerPos'); sel.innerHTML = positionsDb.map(p=>`<option value="${p.name}">${p.name}</option>`).join('');
    let ex = appState.workers.find(w=>w.tab===tab);
    document.getElementById('newWorkerTab').value = ex?ex.tab:'';
    document.getElementById('newWorkerSector').value = ex?(ex.sector||''):'';
    document.getElementById('newWorkerFio').value = ex?ex.fio:'';
    document.getElementById('newWorkerStation').value = ex?(ex.station||''):'';
    if(ex?.position) sel.value = ex.position;
    document.getElementById('newWorkerHire').value = ex?(ex.hireDate||''):'';
    document.getElementById('newWorkerFire').value = ex?(ex.fireDate||''):'';
    openModal('createWorkerModal');
}
function saveWorkerForm() {
    let tab=document.getElementById('newWorkerTab').value.trim(), fio=document.getElementById('newWorkerFio').value.trim(); if(!tab||!fio) return alert("Заполните Табельный и ФИО");
    let posName=document.getElementById('newWorkerPos').value, posObj=positionsDb.find(p=>p.name===posName);
    let obj={ tab, fio, sector:document.getElementById('newWorkerSector').value.trim()||'УФОСЭ Клин', station:document.getElementById('newWorkerStation').value.trim()||'Клин', position:posName, role:tab==='8065'?'founder':(posObj?.role||'viewer'), hireDate:document.getElementById('newWorkerHire').value, fireDate:document.getElementById('newWorkerFire').value, shiftStatus:'none' };
    if(db) db.collection('workers').doc(tab).set(obj,{merge:true}).then(()=>showSyncToast(`☁️ Сотрудник ${fio} сохранен`));
    else { let i=appState.workers.findIndex(x=>x.tab===tab); if(i>=0) appState.workers[i]=obj; else appState.workers.push(obj); renderTabel(); renderOrgTable(); }
    closeModal('createWorkerModal');
}

// === НАСТРОЙКИ ===
function switchSettingsTab(tab) {
    appState.settingsTab=tab; appState.settingsSelectedId=null;
    const titles = { mkassas:'МКассы', routes:'Маршруты', trains:'Поезда', stations:'Станции' };
    document.getElementById('settingsTabTitle').innerText = titles[tab];
    document.getElementById('btnSettingsLoadRouteFile').style.display = tab==='routes'?'inline-block':'none';
    renderSettingsTable();
}
function selectSettingsRow(id) { appState.settingsSelectedId=id; renderSettingsTable(); }
function renderSettingsTable() {
    let box = document.getElementById('settingsTableContainer'); if(!box) return;
    if (appState.settingsTab === 'mkassas') box.innerHTML = `<table class="crud-table"><thead><tr><th>№ МКассы</th><th>Участок</th><th>Станция</th></tr></thead><tbody>` + mkassasDb.map(m=>`<tr class="${appState.settingsSelectedId===m.id?'selected-row':''}" onclick="selectSettingsRow('${m.id}')" ondblclick="openMkassaModal('${m.id}')"><td>${m.num}</td><td>${m.sector||'—'}</td><td>${m.station}</td></tr>`).join('') + `</tbody></table>`;
    else if (appState.settingsTab === 'routes') box.innerHTML = `<table class="crud-table"><thead><tr><th>№ Маршрута</th><th>Часы</th><th>Описание</th><th>Строк</th></tr></thead><tbody>` + routesDb.map(r=>`<tr class="${appState.settingsSelectedId===r.id?'selected-row':''}" onclick="selectSettingsRow('${r.id}')" ondblclick="openRouteModal('${r.id}')"><td><strong>${r.num}</strong></td><td>${r.hours||'—'}</td><td>${r.desc||'—'}</td><td>${(r.rows||[]).length}</td></tr>`).join('') + `</tbody></table>`;
    else if (appState.settingsTab === 'trains') box.innerHTML = `<table class="crud-table"><thead><tr><th>№ Поезда</th><th>Откуда</th><th>Куда</th><th>Отпр.</th><th>Приб.</th><th>Остановок</th></tr></thead><tbody>` + trainsDb.map(t=>`<tr class="${appState.settingsSelectedId===t.id?'selected-row':''}" onclick="selectSettingsRow('${t.id}')" ondblclick="openTrainModal('${t.id}')"><td><strong>${t.num}</strong></td><td>${t.from}</td><td>${t.to}</td><td>${t.dep}</td><td>${t.arr}</td><td>${(t.stops||[]).length}</td></tr>`).join('') + `</tbody></table>`;
    else box.innerHTML = `<table class="crud-table"><thead><tr><th>Станция</th><th>Тарифная зона</th></tr></thead><tbody>` + stationsDb.map(s=>`<tr class="${appState.settingsSelectedId===s.id?'selected-row':''}" onclick="selectSettingsRow('${s.id}')" ondblclick="openStationModal('${s.id}')"><td><strong>${s.name}</strong></td><td>${s.zone}</td></tr>`).join('') + `</tbody></table>`;
}
function settingsCreateClick() { if(appState.settingsTab==='mkassas') openMkassaModal(null); else if(appState.settingsTab==='routes') openRouteModal(null); else if(appState.settingsTab==='trains') openTrainModal(null); else openStationModal(null); }
function settingsDeleteClick() {
    if(!appState.settingsSelectedId || !confirm("Удалить выбранную запись?")) return;
    let id = appState.settingsSelectedId;
    if(appState.settingsTab==='mkassas'){ mkassasDb=mkassasDb.filter(x=>x.id!==id); if(db) db.collection('mkassas').doc(id).delete(); }
    else if(appState.settingsTab==='routes'){ routesDb=routesDb.filter(x=>x.id!==id); if(db) db.collection('routes').doc(id).delete(); }
    else if(appState.settingsTab==='trains'){ trainsDb=trainsDb.filter(x=>x.id!==id); if(db) db.collection('trains').doc(id).delete(); }
    else { stationsDb=stationsDb.filter(x=>x.id!==id); if(db) db.collection('stations').doc(id).delete(); rebuildStationsDatalist(); }
    appState.settingsSelectedId=null; renderSettingsTable();
}
function openMkassaModal(id) { appState.editingId=id; let ex=mkassasDb.find(m=>m.id===id); document.getElementById('mkNumInput').value=ex?ex.num:''; document.getElementById('mkStationInput').value=ex?ex.station:''; document.getElementById('mkSectorInput').value=ex?(ex.sector||''):''; openModal('mkassaModal'); }
function saveMkassa() { let num=document.getElementById('mkNumInput').value.trim(); if(!num) return; let obj={ id:appState.editingId||('mk_'+num), num, station:document.getElementById('mkStationInput').value.trim(), sector:document.getElementById('mkSectorInput').value.trim() }; if(db) db.collection('mkassas').doc(obj.id).set(obj); else { mkassasDb.push(obj); renderSettingsTable(); } closeModal('mkassaModal'); }
function openStationModal(id) { appState.editingId=id; let ex=stationsDb.find(s=>s.id===id); document.getElementById('stNameInput').value=ex?ex.name:''; document.getElementById('stZoneInput').value=ex?ex.zone:0; openModal('stationModal'); }
function saveStationSetting() { let name=document.getElementById('stNameInput').value.trim(); if(!name) return; let obj={ id:appState.editingId||('st_'+Date.now()), name, zone:+document.getElementById('stZoneInput').value||0 }; if(db) db.collection('stations').doc(obj.id).set(obj); else { stationsDb.push(obj); renderSettingsTable(); } rebuildStationsDatalist(); closeModal('stationModal'); }

function openRouteModal(id) { appState.editingId=id; appState.routeSaveStep=1; document.getElementById('routeSummaryPreview').style.display='none'; document.getElementById('btnSaveRouteModal').innerText='Сохранить (рассчитать итоги)'; let ex=routesDb.find(r=>r.id===id); document.getElementById('rtNumInput').value=ex?ex.num:''; document.getElementById('rtTotalHoursInput').value=ex?ex.hours:''; document.getElementById('rtDescInput').value=ex?ex.desc:''; let tb=document.getElementById('routeRowsBody'); tb.innerHTML=''; (ex?.rows?.length?ex.rows:[{}]).forEach(r=>addRouteRow(r)); openModal('routeModal'); }
function addRouteRow(d) { d=d||{}; let tr=document.createElement('tr'); tr.innerHTML=`<td><input class="form-input rt-tr" value="${d.train||''}" style="margin:0;padding:4px;"></td><td><input class="form-input rt-way" value="${d.route||''}" style="margin:0;padding:4px;"></td><td><input class="form-input rt-st" value="${d.start||''}" style="margin:0;padding:4px;" oninput="calcRouteRowDur(this)"></td><td><input class="form-input rt-en" value="${d.end||''}" style="margin:0;padding:4px;" oninput="calcRouteRowDur(this)"></td><td><input class="form-input rt-dur" value="${d.dur||''}" readonly style="margin:0;padding:4px;"></td><td><input class="form-input rt-cnd" value="${d.cond||''}" style="margin:0;padding:4px;"></td><td><button type="button" class="btn-danger" style="margin:0;padding:3px 6px;" onclick="this.closest('tr').remove()">✕</button></td>`; document.getElementById('routeRowsBody').appendChild(tr); }
function calcRouteRowDur(i) { let tr=i.closest('tr'), s=timeToMin(tr.querySelector('.rt-st').value), e=timeToMin(tr.querySelector('.rt-en').value); if(s!==null&&e!==null){ let d=e-s; if(d<0) d+=1440; tr.querySelector('.rt-dur').value=`${Math.floor(d/60)}:${String(d%60).padStart(2,'0')}`; } }
function saveRouteStep() {
    let num=document.getElementById('rtNumInput').value.trim(); if(!num) return alert("Введите № маршрута");
    let rows=Array.from(document.querySelectorAll('#routeRowsBody tr')).map(tr=>({ train:tr.querySelector('.rt-tr').value.trim(), route:tr.querySelector('.rt-way').value.trim(), start:tr.querySelector('.rt-st').value.trim(), end:tr.querySelector('.rt-en').value.trim(), dur:tr.querySelector('.rt-dur').value.trim(), cond:tr.querySelector('.rt-cnd').value.trim() })).filter(r=>r.train||r.route||r.start);
    let wM=0, bM=0, lM=0, nM=0, tc=0;
    rows.forEach(r=>{ let s=timeToMin(r.start), e=timeToMin(r.end), d=(s!==null&&e!==null)?(e>=s?e-s:e+1440-s):0, lo=r.route.toLowerCase(); if(lo.includes('разрыв')) bM+=d; else if(lo.includes('обед')) lM+=d; else { wM+=d; if(r.train) tc++; if(s!==null&&e!==null) for(let m=0;m<d;m++){ let hm=(s+m)%1440; if(hm>=1320||hm<360) nM++; } } });
    let wH=+(wM/60).toFixed(1), totH=+(wH+0.3).toFixed(1);
    document.getElementById('rtTotalHoursInput').value = String(totH).replace('.',',');
    if (appState.routeSaveStep === 1) {
        document.getElementById('routeSummaryBody').innerHTML = `<tr class="decade-bold"><td>Итого:</td><td>${String(totH).replace('.',',')}</td></tr><tr><td>Рабочее время:</td><td>${String(wH).replace('.',',')}</td></tr><tr><td>Явка/сдача:</td><td>0,3</td></tr><tr><td>Обед:</td><td>${(lM/60).toFixed(1).replace('.',',')}</td></tr><tr><td>Разрыв:</td><td>${(bM/60).toFixed(1).replace('.',',')}</td></tr><tr><td>Ночные:</td><td>${(nM/60).toFixed(1).replace('.',',')}</td></tr><tr class="decade-bold"><td>Поездов:</td><td>${tc}</td></tr>`;
        document.getElementById('routeSummaryPreview').style.display='block'; document.getElementById('btnSaveRouteModal').innerText='✅ Подтвердить и сохранить'; appState.routeSaveStep=2; return;
    }
    let obj={ id:appState.editingId||('rt_'+num.replace(/\W/g,'_')), num, hours:String(totH).replace('.',','), startTime:rows[0]?.start||'06:00', desc:document.getElementById('rtDescInput').value.trim(), rows };
    if(db) db.collection('routes').doc(obj.id).set(obj); else { routesDb.push(obj); renderSettingsTable(); }
    closeModal('routeModal');
}
function handleRouteFileImport(e) { let f=e.target.files[0]; if(!f) return; let r=new FileReader(); r.onload=ev=>{ openRouteModal(null); document.getElementById('rtNumInput').value=f.name.replace(/\.[^.]+$/,''); let tb=document.getElementById('routeRowsBody'); tb.innerHTML=''; (ev.target.result||'').split(/\r?\n/).filter(Boolean).forEach(l=>{ let p=l.split(/[;,\t]/); if(p.length>=2) addRouteRow({train:p[0],route:p[1],start:p[2]||'',end:p[3]||'',cond:p[4]||''}); }); e.target.value=''; }; r.readAsText(f); }

function openTrainModal(id) {
    appState.editingId=id; let ex=trainsDb.find(t=>t.id===id);
    document.getElementById('trSetNum').value=ex?ex.num:''; document.getElementById('trSetFrom').value=ex?ex.from:''; document.getElementById('trSetTo').value=ex?ex.to:''; document.getElementById('trSetDep').value=ex?ex.dep:''; document.getElementById('trSetArr').value=ex?ex.arr:'';
    let b=document.getElementById('trainStopsEditBody'); b.innerHTML='';
    let st=ex?.stops?.length>=2?ex.stops:[{name:ex?.from||'',time:ex?.dep||''},{name:ex?.to||'',time:ex?.arr||''}];
    st.forEach((s,i)=>{ let ed=(i===0||i===st.length-1); b.innerHTML+=`<tr class="${i===0?'tr-stop-first':(i===st.length-1?'tr-stop-last':'tr-stop-mid')}"><td><input class="form-input st-name" value="${s.name}" ${ed?'readonly':''} style="margin:0;"></td><td><input class="form-input st-time" value="${s.time}" style="margin:0;"></td><td>${ed?'':'<button type="button" class="btn-danger" style="margin:0;padding:3px 6px;" onclick="this.closest(\'tr\').remove()">✕</button>'}</td></tr>`; });
    openModal('trainModal');
}
function syncTrainEndpoints() { let f=document.querySelector('.tr-stop-first'), l=document.querySelector('.tr-stop-last'); if(f){f.querySelector('.st-name').value=document.getElementById('trSetFrom').value; f.querySelector('.st-time').value=document.getElementById('trSetDep').value;} if(l){l.querySelector('.st-name').value=document.getElementById('trSetTo').value; l.querySelector('.st-time').value=document.getElementById('trSetArr').value;} }
function addTrainMidStop() { let l=document.querySelector('.tr-stop-last'), tr=document.createElement('tr'); tr.className='tr-stop-mid'; tr.innerHTML=`<td><input class="form-input st-name" placeholder="Станция" style="margin:0;"></td><td><input class="form-input st-time" placeholder="06:50" style="margin:0;"></td><td><button type="button" class="btn-danger" style="margin:0;padding:3px 6px;" onclick="this.closest('tr').remove()">✕</button></td>`; l.parentNode.insertBefore(tr,l); }
function saveTrainSetting() { let num=document.getElementById('trSetNum').value.trim(); if(!num) return; let stops=Array.from(document.querySelectorAll('#trainStopsEditBody tr')).map(tr=>({name:tr.querySelector('.st-name').value.trim(),time:tr.querySelector('.st-time').value.trim()})).filter(s=>s.name); let obj={ id:appState.editingId||('tr_'+num), num, from:document.getElementById('trSetFrom').value.trim(), to:document.getElementById('trSetTo').value.trim(), dep:document.getElementById('trSetDep').value.trim(), arr:document.getElementById('trSetArr').value.trim(), stops }; if(db) db.collection('trains').doc(obj.id).set(obj); else { trainsDb.push(obj); renderSettingsTable(); } closeModal('trainModal'); }

// === ТАБЕЛЬ (С БЛОКИРОВКОЙ ПО ДАТЕ ДОГОВОРА И УВОЛЬНЕНИЯ) ===
function getSelectedMonthKey() { return `${document.getElementById('tabelYearSelect').value}-${String(parseInt(document.getElementById('tabelMonthSelect').value)+1).padStart(2,'0')}`; }
function openTabelScreen() { let n=new Date(); document.getElementById('tabelMonthSelect').value=n.getMonth(); document.getElementById('tabelYearSelect').value=n.getFullYear(); navTo('tabel'); renderTabel(); }
function prevTabelMonth() { let m=document.getElementById('tabelMonthSelect'), y=document.getElementById('tabelYearSelect'); if(+m.value===0){m.value=11;y.value=Math.max(2025,+y.value-1);} else m.value=+m.value-1; renderTabel(); }
function nextTabelMonth() { let m=document.getElementById('tabelMonthSelect'), y=document.getElementById('tabelYearSelect'); if(+m.value===11){m.value=0;y.value=Math.min(2028,+y.value+1);} else m.value=+m.value+1; renderTabel(); }
function isDateAllowedForWorker(w, y, m, d) {
    let iso = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    if (w.hireDate && iso < w.hireDate) return false;
    if (w.fireDate && iso > w.fireDate) return false;
    return true;
}
function getWorkerTodayStatus(w) {
    let now=new Date(), ym=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`, cell=cloudTabelByMonth[ym]?.[w.tab]?.[String(now.getDate())];
    if (!cell || !cell.route || cell.route === 'В') return { code:'weekend', dotClass:'dot-weekend', label:'Выходной' };
    if (w.shiftStatus === 'open' || w.shiftActive) return { code:'open', dotClass:'dot-green', label:'Смена открыта' };
    if (w.shiftStatus === 'closed') return { code:'closed', dotClass:'dot-blue', label:'Смена закрыта' };
    let rObj=routesDb.find(r=>r.num===cell.route), startMin=timeToMin(rObj?.startTime)??480, curMin=now.getHours()*60+now.getMinutes();
    return curMin>=startMin ? { code:'not_started', dotClass:'dot-red', label:'Не заступил вовремя!', late:true } : { code:'not_started', dotClass:'dot-gray', label:'Еще не заступил' };
}
function checkMissedShiftsAndNotify() { if(!canCreateWorker()) return; let t=new Date().toISOString().split('T')[0]; appState.workers.forEach(w=>{ if(getWorkerTodayStatus(w).late) sendCloudNotification(`⚠️ ${w.fio} (таб. ${w.tab}) не заступил на смену!`, `missed_${t}_${w.tab}`); }); }
function renderTabel() {
    let m=+document.getElementById('tabelMonthSelect').value, y=+document.getElementById('tabelYearSelect').value, dim=new Date(y,m+1,0).getDate(), ym=getSelectedMonthKey(), md=cloudTabelByMonth[ym]||{}, fv=document.getElementById('tabelStatusFilter')?.value||'all';
    let now=new Date(), isCurM=now.getFullYear()===y&&now.getMonth()===m, tNum=now.getDate();
    document.getElementById('tabelDaysColspan').colSpan=dim;
    let dr=document.getElementById('tabelDaysHeaderRow'); if(!dr) return; dr.innerHTML='';
    for(let d=1;d<=dim;d++) dr.innerHTML+=`<th ${isCurM&&d===tNum?'style="background:#ffe599;"':''}>${d}</th>`;
    let tb=document.getElementById('tabelBody'); if(!tb) return; tb.innerHTML='';
    appState.workers.filter(w=>fv==='all'||getWorkerTodayStatus(w).code===fv).forEach((w,idx)=>{
        let st=getWorkerTodayStatus(w), wd=0, th=0, c1='', c2='', wDays=md[w.tab]||{};
        for(let d=1;d<=dim;d++){
            let allowed = isDateAllowedForWorker(w, y, m, d);
            let cell = allowed ? wDays[String(d)] : null;
            let rTxt = !allowed ? '—' : (cell?.route ? (cell.senior?`⭐${cell.route}`:cell.route) : '+');
            let hTxt = cell?.hours || '';
            if (cell?.route && cell.route!=='В') { wd++; th+=parseFloat(String(hTxt||'0').replace(',','.'))||0; }
            let cls = 'tabel-cell-day' + (!allowed?' cell-locked':'') + (isCurM&&d===tNum?' cell-today-col':'') + (cell?.route==='В'?' cell-weekend':'') + (isCurM&&d===tNum&&st.code==='open'?' cell-shift-active':'');
            let clk = (allowed && canEditTabel()) ? `onclick="openTabelDrawer('${w.tab}',${d})"` : '';
            c1+=`<td class="${cls}" ${clk}>${rTxt}</td>`; c2+=`<td class="${cls}" ${clk}>${hTxt}</td>`;
        }
        tb.innerHTML+=`<tr><td rowspan="2">${idx+1}</td><td rowspan="2">${w.tab}</td><td rowspan="2" style="text-align:left;font-weight:bold;padding-left:4px;">${w.fio} <span class="status-dot ${st.dotClass}" title="${st.label}"></span></td><td style="font-size:8.5px;background:#f7f7f7;">маршр.</td>${c1}<td rowspan="2"><strong>${wd}</strong></td><td rowspan="2"><strong>${th.toFixed(1).replace('.',',')}</strong></td></tr><tr><td style="font-size:8.5px;background:#f7f7f7;">часы</td>${c2}</tr>`;
    });
    document.getElementById('btnTabelCreateWorker').style.display=canCreateWorker()?'inline-block':'none';
    document.getElementById('btnTabelLoadFile').style.display=canEditTabel()?'inline-block':'none';
    document.getElementById('btnTabelDistribute').style.display=canEditTabel()?'inline-block':'none';
    document.getElementById('btnTabelNotify').style.display=(appState.tabelDirty&&canEditTabel())?'inline-block':'none';
}
function openTabelDrawer(tab, day) {
    let w=appState.workers.find(x=>x.tab===tab), ym=getSelectedMonthKey(), ex=cloudTabelByMonth[ym]?.[tab]?.[String(day)]||{route:'',hours:'',senior:false};
    appState.drawerTarget={tab,day,ymKey:ym};
    document.getElementById('drawerWorkerInfo').innerHTML=`<strong>${w?.fio||tab}</strong><br>Дата: ${day} ${monthNamesRu[+document.getElementById('tabelMonthSelect').value]}`;
    document.getElementById('drawerRouteInput').value=ex.route; document.getElementById('drawerHoursInput').value=ex.hours; document.getElementById('drawerSeniorCheck').checked=!!ex.senior;
    renderDrawerSuggestions(ex.route); document.getElementById('drawerOverlay').classList.add('active'); document.getElementById('tabelRightDrawer').classList.add('open');
}
function closeTabelDrawer() { document.getElementById('drawerOverlay').classList.remove('active'); document.getElementById('tabelRightDrawer').classList.remove('open'); }
function renderDrawerSuggestions(q) { q=(q||'').trim().toLowerCase(); document.getElementById('drawerSuggestList').innerHTML=routesDb.filter(r=>r.num.toLowerCase().includes(q)||(r.desc||'').toLowerCase().includes(q)).map(r=>`<div class="route-suggest-item" onclick="selectDrawerRoute('${r.num}','${r.hours||''}')"><strong>Маршрут ${r.num}</strong><span>${r.hours?r.hours+' ч':'Выходной'}</span></div>`).join(''); let ex=routesDb.find(r=>r.num.toLowerCase()===q); if(ex) document.getElementById('drawerHoursInput').value=ex.hours||''; }
function selectDrawerRoute(n, h) { document.getElementById('drawerRouteInput').value=n; document.getElementById('drawerHoursInput').value=h; }
function saveTabelCellFromDrawer() { let {tab,day,ymKey}=appState.drawerTarget, r=document.getElementById('drawerRouteInput').value.trim(), h=document.getElementById('drawerHoursInput').value.trim(), s=document.getElementById('drawerSeniorCheck').checked; if(!cloudTabelByMonth[ymKey]) cloudTabelByMonth[ymKey]={}; if(!cloudTabelByMonth[ymKey][tab]) cloudTabelByMonth[ymKey][tab]={}; cloudTabelByMonth[ymKey][tab][String(day)]=r?{route:r,hours:h,senior:s}:null; appState.tabelDirty=true; renderTabel(); closeTabelDrawer(); }
function saveAndNotifyStaff() { let ym=getSelectedMonthKey(); if(db) db.collection('tabel').doc(ym).set(cloudTabelByMonth[ym]||{}).then(()=>{ showSyncToast("☁️ Табель сохранен"); sendCloudNotification(`📅 График работы обновлен!`); }); appState.tabelDirty=false; renderTabel(); alert("Табель сохранен!"); }
function handleTabelFileUpload(e) { let f=e.target.files[0]; if(!f) return; let r=new FileReader(); r.onload=ev=>{ let tom=new Date(); tom.setDate(tom.getDate()+1); let ym=`${tom.getFullYear()}-${String(tom.getMonth()+1).padStart(2,'0')}`, d=String(tom.getDate()); if(!cloudTabelByMonth[ym]) cloudTabelByMonth[ym]={}; appState.workers.forEach((w,i)=>{ if(!isDateAllowedForWorker(w,tom.getFullYear(),tom.getMonth(),tom.getDate())) return; let rt=routesDb[i%Math.max(1,routesDb.length-1)]; if(!cloudTabelByMonth[ym][w.tab]) cloudTabelByMonth[ym][w.tab]={}; cloudTabelByMonth[ym][w.tab][d]={route:rt.num,hours:rt.hours,senior:false}; }); appState.tabelDirty=true; renderTabel(); alert(`Файл "${f.name}" обработан (обновлено только на завтра).`); e.target.value=''; }; r.readAsText(f); }
function openDistributeModal() { let t=new Date(), tm=new Date(); tm.setDate(t.getDate()+1); document.getElementById('distDateToday').innerText=t.toLocaleDateString('ru-RU'); document.getElementById('distDateTomorrow').innerText=tm.toLocaleDateString('ru-RU'); switchDistDay('tomorrow'); openModal('distributeRoutesModal'); }
function switchDistDay(m) { appState.distDay=m; document.getElementById('distBtnToday').classList.toggle('active',m==='today'); document.getElementById('distBtnTomorrow').classList.toggle('active',m==='tomorrow'); renderDistributeList(); }
function getDistTargetDate() { let d=new Date(); if(appState.distDay==='tomorrow') d.setDate(d.getDate()+1); return { dObj:d, ymKey:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, day:String(d.getDate()) }; }
function renderDistributeList() { let {dObj,ymKey,day}=getDistTargetDate(), opts=`<option value="">— Выходной —</option>`+routesDb.map(r=>`<option value="${r.num}">Маршрут ${r.num}</option>`).join(''); document.getElementById('distWorkersList').innerHTML=appState.workers.filter(w=>isDateAllowedForWorker(w,dObj.getFullYear(),dObj.getMonth(),dObj.getDate())).map(w=>{ let cur=cloudTabelByMonth[ymKey]?.[w.tab]?.[day]?.route||''; return `<div class="dist-row"><div style="flex:1.5;"><strong>${w.fio}</strong><br><small>${w.sector||w.station||'Клин'}</small></div><select class="form-input dist-route-sel" data-tab="${w.tab}" style="flex:1;margin:0;" onchange="checkSharedRoutesForSenior()">${opts.replace(`value="${cur}"`,`value="${cur}" selected`)}</select></div>`; }).join(''); checkSharedRoutesForSenior(); }
function checkSharedRoutesForSenior() { let g={}; document.querySelectorAll('.dist-route-sel').forEach(s=>{ if(s.value&&s.value!=='В') (g[s.value]=g[s.value]||[]).push(s.dataset.tab); }); let html=Object.keys(g).filter(r=>g[r].length>1).map(r=>`<div style="display:flex;gap:8px;margin-bottom:6px;align-items:center;"><strong>Маршрут ${r}:</strong><select class="form-input dist-senior-sel" data-route="${r}" style="margin:0;">${g[r].map(t=>`<option value="${t}">${appState.workers.find(x=>x.tab===t)?.fio||t}</option>`).join('')}</select></div>`).join(''); document.getElementById('distSeniorList').innerHTML=html; document.getElementById('distSeniorBox').style.display=html?'block':'none'; }
function saveDistributedRoutes() { let {ymKey,day}=getDistTargetDate(), sen={}; if(!cloudTabelByMonth[ymKey]) cloudTabelByMonth[ymKey]={}; document.querySelectorAll('.dist-senior-sel').forEach(s=>sen[s.dataset.route]=s.value); document.querySelectorAll('.dist-route-sel').forEach(s=>{ let t=s.dataset.tab, r=s.value, ro=routesDb.find(x=>x.num===r); if(!cloudTabelByMonth[ymKey][t]) cloudTabelByMonth[ymKey][t]={}; cloudTabelByMonth[ymKey][t][day]=r?{route:r,hours:ro?.hours||'',senior:sen[r]===t}:{route:'В',hours:'',senior:false}; }); appState.tabelDirty=true; renderTabel(); closeModal('distributeRoutesModal'); }

// === СМЕНА, ФДУ, ОТЧЕТ ПО ПОЕЗДУ, РЕЕСТР, НАСЕЛЕННОСТЬ ===
function openFduScreen() { navTo('fdu'); }
function addExtraCash() { let v=document.getElementById('shCashNum').value.trim(); if(!v) return; appState.extraCash.push(v); document.getElementById('shCashNum').value=''; document.getElementById('extraCashList').innerText='МКассы: '+appState.extraCash.join(', '); }
function addExtraShift() { let v=document.getElementById('shNum').value.trim(); if(!v) return; appState.extraShifts.push(v); document.getElementById('shNum').value=''; document.getElementById('extraShiftList').innerText='Смены: '+appState.extraShifts.join(', '); recalcTestTickets(); }
function addTestTix() { let v=document.getElementById('shTestInp').value.trim(); if(!v) return; appState.extraTests.push(v); document.getElementById('shTestInp').value=''; document.getElementById('extraTestList').innerText='Пробники: '+appState.extraTests.join(', '); recalcTestTickets(); }
function recalcTestTickets() { let sc=appState.extraShifts.length+(document.getElementById('shNum').value.trim()?1:0), tl=[...appState.extraTests,...(document.getElementById('shTestInp').value.trim()?[document.getElementById('shTestInp').value.trim()]:[])], nc=tl.reduce((a,it)=>a+it.split(/[\/,\s]+/).filter(Boolean).length,0); document.getElementById('shTestVal').innerText=`${sc+nc} шт.`; return sc+nc; }
function saveShiftData() {
    let p=recalcTestTickets(), rt=document.getElementById('shRouteNum').value.trim(), cCur=document.getElementById('shCashNum').value.trim();
    let allC=[...appState.extraCash,...(cCur?[cCur]:[])].join(' / '); appState.currentShiftMkassa=cCur||appState.extraCash[0]||'';
    let tar=+document.getElementById('shTariff').value||0, fee=+document.getElementById('shFee').value||0;
    document.getElementById('fduD0').value=new Date().toLocaleDateString('ru-RU'); document.getElementById('fduRouteVal').value=rt; document.getElementById('fduCashVal').value=allC;
    document.getElementById('fduFundVal').value=document.getElementById('shFundSum').value; document.getElementById('fduPersVal').value=document.getElementById('shPersonalMoney').value;
    document.getElementById('fduWorkTypeVal').value=document.getElementById('shWorkType').value; document.getElementById('fduVideoRegVal').value=document.getElementById('shVideoReg').value;
    document.getElementById('fduTestTicketCount').value=p;
    document.getElementById('shCellNum1').innerText=document.getElementById('shNum').value||'1-я'; document.getElementById('shCellTest1').innerText=p+' шт.';
    document.getElementById('shCellTariff1').innerText=tar; document.getElementById('shCellFee1').innerText=fee;
    document.getElementById('shCellCash1').innerText=document.getElementById('shCash').value||'0'; document.getElementById('shCellCard1').innerText=document.getElementById('shCard').value||'0';
    document.getElementById('shCellBen1').innerText=document.getElementById('shBenefits').value||'0';
    let iso=new Date().toISOString().split('T')[0], idx=appState.shiftHistory.findIndex(s=>s.date===iso), en=idx>=0?appState.shiftHistory[idx]:{date:iso,tariff:0,fee:0,tickets:0,benefits:getEmptyBenefits()};
    en.tariff=tar; en.fee=fee; if(idx>=0) appState.shiftHistory[idx]=en; else appState.shiftHistory.push(en);
    localStorage.setItem('kkl_shift_history', JSON.stringify(appState.shiftHistory));
    appState.shiftState = 'open';
    if(appState.user){ appState.user.shiftActive=true; appState.user.shiftStatus='open'; if(db) db.collection('workers').doc(appState.user.tab).update({shiftActive:true,shiftStatus:'open'}).catch(()=>{}); }
    persistActiveShift(); updateShiftMainButton(); updateDashboardTotals();
    addLog(`Смена открыта: Маршрут ${rt}, МКасса ${allC}`); closeModal('shiftModal');
}
function updateDashboardTotals() {
    let now=new Date(), ym=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`, mt=0, mf=0, mti=0, bt=getEmptyBenefits();
    appState.shiftHistory.filter(s=>(s.date||'').startsWith(ym)).forEach(s=>{ mt+=s.tariff||0; mf+=s.fee||0; mti+=s.tickets||0; ['rzd','fed','reg','stud','vohr'].forEach(k=>{ bt[k].count+=s.benefits?.[k]?.count||0; bt[k].sum+=s.benefits?.[k]?.sum||0; }); });
    let bs=bt.rzd.sum+bt.fed.sum+bt.reg.sum+bt.stud.sum+bt.vohr.sum, bc=bt.rzd.count+bt.fed.count+bt.reg.count+bt.stud.count+bt.vohr.count;
    document.getElementById('dashTariff').innerText=mt.toFixed(2)+' ₽'; document.getElementById('dashFee').innerText=mf.toFixed(2)+' ₽';
    document.getElementById('dashBenSum').innerText=bs.toFixed(2)+' ₽'; document.getElementById('dashBenTix').innerText='Билетов: '+bc;
    document.getElementById('dashTotalRev').innerText=(mt+mf).toFixed(2)+' ₽'; document.getElementById('dashTotalTix').innerText='Билетов: '+mti;
    ['Rzd','Fed','Reg','Stud','Vohr'].forEach(K=>{ let k=K.toLowerCase(); document.getElementById('bd'+K+'S').innerText=bt[k].sum; document.getElementById('bd'+K+'C').innerText=bt[k].count; });
}
function openDecadeStatsModal() {
    let n=new Date(), y=n.getFullYear(), m=n.getMonth(), dim=new Date(y,m+1,0).getDate(), ym=`${y}-${String(m+1).padStart(2,'0')}`;
    document.getElementById('decadeModalTitle').innerText=`Отчет за ${monthNamesRu[m]} ${y} г.`;
    document.getElementById('decadeTablesContainer').innerHTML=[{t:'За 10 дней (01–10)',d:10},{t:'За 20 дней (01–20)',d:20},{t:`За месяц (01–${dim})`,d:dim}].map(r=>{
        let tix=0, rev=0, b=getEmptyBenefits();
        appState.shiftHistory.filter(s=>(s.date||'').startsWith(ym)&&+s.date.split('-')[2]<=r.d).forEach(s=>{ tix+=s.tickets||0; rev+=(s.tariff||0)+(s.fee||0); ['rzd','fed','reg','stud','vohr'].forEach(k=>{ b[k].count+=s.benefits?.[k]?.count||0; b[k].sum+=s.benefits?.[k]?.sum||0; }); });
        let ac=b.rzd.count+b.fed.count+b.reg.count+b.stud.count+b.vohr.count, as=b.rzd.sum+b.fed.sum+b.reg.sum+b.stud.sum+b.vohr.sum;
        return `<h4 style="margin:6px 0;">${r.t}</h4><table class="decade-table"><thead><tr><th></th><th>Билетов</th><th>Выручка (₽)</th></tr></thead><tbody><tr class="decade-bold"><td>Взыскано тарифа</td><td>${tix}</td><td>${rev.toFixed(2)}</td></tr><tr class="decade-bold"><td>Работники ж/д</td><td>${b.rzd.count}</td><td>${b.rzd.sum.toFixed(2)}</td></tr><tr><td>Федеральные</td><td>${b.fed.count}</td><td>${b.fed.sum.toFixed(2)}</td></tr><tr><td>Региональные</td><td>${b.reg.count}</td><td>${b.reg.sum.toFixed(2)}</td></tr><tr><td>Студенты</td><td>${b.stud.count}</td><td>${b.stud.sum.toFixed(2)}</td></tr><tr><td>ВОХР</td><td>${b.vohr.count}</td><td>${b.vohr.sum.toFixed(2)}</td></tr><tr class="decade-bold"><td>Общее по льготникам</td><td>${ac}</td><td>${as.toFixed(2)}</td></tr></tbody></table>`;
    }).join('');
    openModal('decadeStatsModal');
}
function openTrainReport() { document.getElementById('prevMkassaTix').innerText=appState.lastMkassaTix; document.getElementById('prevMkassaMoney').innerText=appState.lastMkassaMoney.toFixed(2); document.getElementById('trStatTickets').value=appState.lastMkassaTix; document.getElementById('trStatMoney').value=appState.lastMkassaMoney; calculateTrainStats(); navTo('trainReport'); }
function autoFillTrainSchedule(v) { let t=trainsDb.find(x=>x.num===v.trim()); if(t){ document.getElementById('trFrom').value=t.from; document.getElementById('trTo').value=t.to; document.getElementById('trDepTime').value=t.dep; document.getElementById('trArrTime').value=t.arr; } }
function calculateTrainStats() { let ct=+document.getElementById('trStatTickets').value||0, cm=+document.getElementById('trStatMoney').value||0, bt=+document.getElementById('trBaggageCount').value||0, bs=+document.getElementById('trBaggageSum').value||0; document.getElementById('resTrainTickets').innerText=Math.max(0,ct-appState.lastMkassaTix)+bt; document.getElementById('resTrainMoney').innerText=(Math.max(0,cm-appState.lastMkassaMoney)+bs).toFixed(2); }
function openBenefitModal(k,t) { activeBenefitCategory=k; document.getElementById('benefitModalTitle').innerText=t; document.getElementById('benCount').value=currentTrainBenefits[k].count||1; document.getElementById('benIncome').value=currentTrainBenefits[k].sum||0; document.getElementById('benFee').value=0; openModal('benefitModal'); }
function saveBenefitCategory() { let c=+document.getElementById('benCount').value||0, i=+document.getElementById('benIncome').value||0, f=+document.getElementById('benFee').value||0; currentTrainBenefits[activeBenefitCategory]={count:c,sum:i}; document.getElementById('benSumLbl_'+activeBenefitCategory).innerText=i.toFixed(2)+' ₽'; closeModal('benefitModal'); if(f===0&&c>0&&confirm("Сумма сбора 0. Внести в Реестр?")){ openRegistry(); openRegistryCreateModal(i); } }
function saveTrainToFdu() {
    let lRows=document.querySelectorAll('#fduLeftBody .train-slot-row'); if(appState.trainsInFdu>=lRows.length) return alert("Строки ФДУ заполнены!");
    let tix=+document.getElementById('resTrainTickets').innerText||0, mon=+document.getElementById('resTrainMoney').innerText||0, r=lRows[appState.trainsInFdu];
    r.querySelector('.fdu-train-num').value=document.getElementById('trNum').value; r.querySelector('.fdu-train-route').value=document.getElementById('trTo').value;
    r.querySelector('.fdu-train-time').value=document.getElementById('trDepTime').value+' - '+document.getElementById('trArrTime').value;
    r.querySelector('.fdu-train-tix').value=tix; r.querySelector('.fdu-train-sum').value=mon;
    appState.lastMkassaTix=+document.getElementById('trStatTickets').value||appState.lastMkassaTix; appState.lastMkassaMoney=+document.getElementById('trStatMoney').value||appState.lastMkassaMoney;
    let gt=(+document.getElementById('fduGrandTickets').innerText||0)+tix, gs=(+document.getElementById('fduGrandSum').innerText||0)+mon;
    document.getElementById('fduGrandTickets').innerText=gt; document.getElementById('fduGrandSum').innerText=gs.toFixed(2); document.getElementById('fduTotalSumBottom').value=gs.toFixed(2);
    let iso=new Date().toISOString().split('T')[0], idx=appState.shiftHistory.findIndex(s=>s.date===iso), en=idx>=0?appState.shiftHistory[idx]:{date:iso,tariff:0,fee:0,tickets:0,benefits:getEmptyBenefits()};
    en.tickets+=tix; ['rzd','fed','reg','stud','vohr'].forEach(k=>{ en.benefits[k].count+=currentTrainBenefits[k].count; en.benefits[k].sum+=currentTrainBenefits[k].sum; });
    if(idx>=0) appState.shiftHistory[idx]=en; else appState.shiftHistory.push(en);
    localStorage.setItem('kkl_shift_history', JSON.stringify(appState.shiftHistory));
    currentTrainBenefits=getEmptyBenefits(); ['rzd','fed','reg','stud','vohr'].forEach(k=>document.getElementById('benSumLbl_'+k).innerText='0.00 ₽');
    appState.trainsInFdu++; persistActiveShift(); updateDashboardTotals(); navTo('fdu');
}

function openRegistry() { navTo('registry'); renderRegistryTable(); }
function openRegistryCreateModal(p) { document.getElementById('rcDate').value=new Date().toISOString().split('T')[0]; document.getElementById('rcMkassa').value=appState.currentShiftMkassa||''; document.getElementById('rcPrice').value=p||''; rcTripMode='oneway'; document.getElementById('rcTripBtn').innerText='Туда'; openModal('regCreateModal'); }
function toggleOrderNumField() { document.getElementById('rcOrderNumWrap').style.display=document.getElementById('rcType').value==='Приказ №'?'block':'none'; }
function toggleTripType() { rcTripMode=rcTripMode==='oneway'?'roundtrip':'oneway'; document.getElementById('rcTripBtn').innerText=rcTripMode==='oneway'?'Туда':'Туда/Обратно'; calcStationPrice(); }
function calcStationPrice() {
    let f=document.getElementById('rcFrom').value.trim(), t=document.getElementById('rcTo').value.trim(); if(!f||!t) return;
    let s1=stationsDb.find(x=>x.name===f), s2=stationsDb.find(x=>x.name===t);
    let bp=exactPairPrices[`${f}|${t}`]||((s1&&s2)?60+Math.max(1,Math.abs(s2.zone-s1.zone))*46:0);
    if(bp) document.getElementById('rcPrice').value=rcTripMode==='roundtrip'?bp*2:bp;
}
function saveRegistryEntry() { let d=document.getElementById('rcDate').value, f=document.getElementById('rcFrom').value.trim(), t=document.getElementById('rcTo').value.trim(); if(!d||!f||!t) return alert("Заполните поля"); let ty=document.getElementById('rcType').value, on=document.getElementById('rcOrderNum').value.trim(); let en={ id:'reg_'+Date.now(), date:d, mkassa:document.getElementById('rcMkassa').value.trim(), reason:ty==='Приказ №'?`Приказ № ${on}`:ty, isOrder53:(ty==='Приказ №'&&on==='53'), ticketNum:document.getElementById('rcTicketNum').value.trim(), tripMode:rcTripMode, from:f, to:t, price:+document.getElementById('rcPrice').value||0 }; if(db) db.collection('registry').doc(en.id).set(en); else { cloudRegistry.push(en); renderRegistryTable(); } closeModal('regCreateModal'); }
function renderRegistryTable() { let tb=document.getElementById('registryTableBody'); if(!tb) return; let df=document.getElementById('regFilterFrom').value, dt=document.getElementById('regFilterTo').value, fl=cloudRegistry.filter(r=>(!df||r.date>=df)&&(!dt||r.date<=dt)); tb.innerHTML=!fl.length?'<tr><td colspan="11">Записей нет</td></tr>':fl.map((r,i)=>{ let p=(r.date||'').split('-'); return `<tr class="reg-highlight"><td>${i+1}</td><td>${r.mkassa||'—'}</td><td>${p.length===3?`${p[2]}.${p[1]}.${p[0]}`:r.date}</td><td>${r.reason}</td><td>${r.ticketNum||'—'}</td><td>—</td><td>${r.tripMode==='oneway'?'.':''}</td><td>${r.tripMode==='roundtrip'?'.':''}</td><td>${r.from}</td><td>${r.to}</td><td>${r.price}</td></tr>`; }).join(''); }
function exportRegistryExcel() { let df=document.getElementById('reDateFrom').value, dt=document.getElementById('reDateTo').value, tp=document.getElementById('reType').value, fl=cloudRegistry.filter(r=>(!df||r.date>=df)&&(!dt||r.date<=dt)&&((tp==='p53')?r.isOrder53:!r.isOrder53)); let rows=fl.map((r,i)=>`<tr><td>${i+1}</td><td>${r.mkassa}</td><td>${r.date}</td><td>${r.reason}</td><td>${r.ticketNum}</td><td>-</td><td>${r.tripMode==='oneway'?'.':''}</td><td>${r.tripMode==='roundtrip'?'.':''}</td><td>${r.from}</td><td>${r.to}</td><td>${r.price}</td></tr>`).join(''); let a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([`<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1">${rows}</table></body></html>`],{type:'application/vnd.ms-excel'})); a.download=`Реестр_${tp}.xls`; a.click(); closeModal('regExportModal'); }

function openOccupancy() { document.getElementById('occTrainInput').value=''; document.getElementById('occWarningBox').style.display='none'; document.getElementById('occStopsContainer').style.display='none'; document.getElementById('occRouteTitle').style.display='none'; navTo('occupancy'); }
function getOccDocId(tr) { return `${new Date().toLocaleDateString('ru-RU').replace(/\./g,'-')}_${tr}`; }
function getTrainStopsPairs(tr) { let t=trainsDb.find(x=>x.num===tr); if(!t||!t.stops||t.stops.length<2) return null; let p=[]; for(let i=0;i<t.stops.length-1;i++) p.push(`${t.stops[i].name} — ${t.stops[i+1].name}`); return { title:`${t.from} → ${t.to}`, stops:p }; }
function checkOccupancyTrain(v) { let tr=v.trim(), info=getTrainStopsPairs(tr), wb=document.getElementById('occWarningBox'), sc=document.getElementById('occStopsContainer'), tl=document.getElementById('occRouteTitle'), sb=document.getElementById('occSaveBtn'); wb.style.display='none'; sc.style.display='none'; tl.style.display='none'; sb.style.opacity='0.5'; sb.style.pointerEvents='none'; if(info){ tl.innerText=info.title; tl.style.display='block'; let pd=cloudOccupancy[getOccDocId(tr)]; if(pd){ wb.querySelector('p').innerHTML=`Последние данные: <strong>${pd.userName}</strong> (${pd.time})`; wb.style.display='block'; } else renderOccupancyStops(tr); } }
function continueOccupancy() { document.getElementById('occWarningBox').style.display='none'; renderOccupancyStops(document.getElementById('occTrainInput').value.trim()); }
function renderOccupancyStops(tr) { let info=getTrainStopsPairs(tr), p=cloudOccupancy[getOccDocId(tr)]?.percentages||{}; document.getElementById('occStopsList').innerHTML=info.stops.map((s,i)=>`<div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:10px;border-bottom:1px solid #2d3748;"><span>${s}</span><input type="number" id="occ_input_${i}" value="${p[i]||''}" placeholder="0" style="width:55px;background:#11151c;color:#fff;border:1px solid #4a5568;border-radius:6px;padding:5px;text-align:right;"></div>`).join(''); document.getElementById('occStopsContainer').style.display='block'; let sb=document.getElementById('occSaveBtn'); sb.style.opacity='1'; sb.style.pointerEvents='auto'; }
function saveOccupancyChanges() { let tr=document.getElementById('occTrainInput').value.trim(), info=getTrainStopsPairs(tr); if(!info) return; let p={}; info.stops.forEach((_,i)=>p[i]=document.getElementById('occ_input_'+i).value); let rec={ trainNum:tr, userName:appState.user?.fio||'Сотрудник', time:new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}), date:new Date().toLocaleDateString('ru-RU'), percentages:p }; cloudOccupancy[getOccDocId(tr)]=rec; if(db) db.collection('occupancy').doc(getOccDocId(tr)).set(rec); alert('Сохранено!'); backToMain(); }
function sendMsg() { let i=document.getElementById('chatInput'); if(!i.value.trim()) return; document.getElementById('chatMsgs').innerHTML+=`<div class="msg-bubble msg-out">${i.value}</div>`; i.value=''; }
function openChat(n) { document.getElementById('chatActiveName').innerText=n; }

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
