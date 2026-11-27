// ============================================================
// === ЭТАП 6: ОБЛАЧНЫЕ ЧАТЫ, СИНХРОН ВЫРУЧКИ И ЧТЕНИЕ EXCEL ===
// ============================================================

let cloudChatsList = [
    { id: "chat_brigada_1", name: "Бригада №1", avatar: "Б1" },
    { id: "chat_instructors", name: "Инструкторы и Старшие", avatar: "ИС" }
];
let activeChatId = "chat_brigada_1";
let activeChatUnsub = null;
let cloudShiftStatsUnsub = null;

window.addEventListener('load', () => {
    setTimeout(() => {
        initStage6CloudChats();
        initStage6ShiftStatsSync();
    }, 600);
});

// Перехват navTo для перерисовки чатов
const _origNavToStage6 = window.navTo;
window.navTo = function(id) {
    if (typeof _origNavToStage6 === 'function') _origNavToStage6(id);
    if (id === 'chats') renderCloudChatsLayout();
};

// ============================================================
// === 1. ОБЛАЧНЫЕ ЧАТЫ БРИГАДЫ (FIREBASE FIRESTORE) ===
// ============================================================
function initStage6CloudChats() {
    if (typeof db === 'undefined' || !db) return;

    db.collection('chats').onSnapshot(snap => {
        if (snap.empty) {
            cloudChatsList.forEach(c => db.collection('chats').doc(c.id).set(c));
        } else {
            cloudChatsList = [];
            snap.forEach(d => cloudChatsList.push(d.data()));
            renderChatSidebarList();
        }
    });
}

function renderCloudChatsLayout() {
    let scr = document.getElementById('chats-screen');
    if (!scr) return;
    scr.innerHTML = `
        <div class="card" style="max-width:860px;margin:15px auto;padding:0;display:flex;height:580px;overflow:hidden;">
            <div style="width:240px;border-right:1px solid #ccc;background:#f4f6f9;display:flex;flex-direction:column;">
                <div style="padding:12px 14px;background:var(--primary-color);color:#fff;display:flex;justify-content:space-between;align-items:center;">
                    <h3 style="color:#fff;margin:0;font-size:15px;">💬 Чаты</h3>
                    <button onclick="createNewCloudChat()" title="Создать группу" style="width:auto;margin:0;padding:3px 9px;background:rgba(255,255,255,0.2);font-size:16px;">➕</button>
                </div>
                <div class="chat-list" id="cloudChatListBox" style="padding:8px;overflow-y:auto;flex:1;"></div>
                <div style="padding:8px;border-top:1px solid #ddd;">
                    <button class="btn-secondary" style="margin:0;padding:7px;font-size:12px;" onclick="backToMain()">Назад</button>
                </div>
            </div>
            <div style="flex:1;display:flex;flex-direction:column;background:#e5ddd5;">
                <div class="chat-header" style="display:flex;justify-content:space-between;align-items:center;">
                    <strong id="chatActiveName">Бригада №1</strong>
                    <span style="font-size:11px;opacity:0.85;">☁️ Онлайн</span>
                </div>
                <div class="chat-messages" id="chatMsgs"></div>
                <div class="chat-input-area">
                    <input type="text" placeholder="Написать сообщение..." id="chatInput" onkeydown="if(event.key==='Enter') sendMsg()">
                    <button class="chat-icon-btn" onclick="sendMsg()" title="Отправить">✈️</button>
                </div>
            </div>
        </div>
    `;
    renderChatSidebarList();
    subscribeToChatMessages(activeChatId);
}

function renderChatSidebarList() {
    let box = document.getElementById('cloudChatListBox');
    if (!box) return;
    box.innerHTML = cloudChatsList.map(c => `
        <div class="chat-item" onclick="openCloudChat('${c.id}')" style="${c.id === activeChatId ? 'background:#d9e9f7;border-color:#0055aa;' : ''}">
            <div class="chat-avatar" style="min-width:38px;width:38px;height:38px;font-size:13px;">${c.avatar || 'Ч'}</div>
            <div style="font-size:13px;font-weight:bold;overflow:hidden;text-overflow:ellipsis;">${c.name}</div>
        </div>
    `).join('');
}

function createNewCloudChat() {
    let name = prompt("Введите название новой группы / чата (например, Участок Клин):");
    if (!name || !name.trim()) return;
    name = name.trim();
    let avatar = name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
    let obj = { id: 'chat_' + Date.now(), name, avatar, createdBy: appState.user?.fio || '' };
    if (db) db.collection('chats').doc(obj.id).set(obj);
    else { cloudChatsList.push(obj); renderChatSidebarList(); }
    openCloudChat(obj.id);
}

function openCloudChat(chatId) {
    activeChatId = chatId;
    let chatObj = cloudChatsList.find(c => c.id === chatId);
    let titleEl = document.getElementById('chatActiveName');
    if (titleEl && chatObj) titleEl.innerText = chatObj.name;
    renderChatSidebarList();
    subscribeToChatMessages(chatId);
}
window.openChat = openCloudChat;

function subscribeToChatMessages(chatId) {
    let msgsBox = document.getElementById('chatMsgs');
    if (!msgsBox) return;
    if (activeChatUnsub) { activeChatUnsub(); activeChatUnsub = null; }

    if (typeof db === 'undefined' || !db) {
        msgsBox.innerHTML = '<div class="msg-bubble msg-in">Нет подключения к облаку.</div>';
        return;
    }

    activeChatUnsub = db.collection('chat_messages')
        .where('chatId', '==', chatId)
        .onSnapshot(snap => {
            let list = [];
            snap.forEach(d => list.push(d.data()));
            list.sort((a, b) => (a.ts || 0) - (b.ts || 0));

            let myTab = appState.user?.tab || '';
            if (list.length === 0) {
                msgsBox.innerHTML = '<div style="text-align:center;color:#666;font-size:12px;margin-top:20px;">Сообщений пока нет. Напишите первым!</div>';
            } else {
                msgsBox.innerHTML = list.map(m => {
                    let isMine = m.tab === myTab;
                    return `
                        <div class="msg-bubble ${isMine ? 'msg-out' : 'msg-in'}">
                            ${!isMine ? `<div style="font-size:10px;font-weight:bold;color:#003366;margin-bottom:2px;">${m.sender || 'Коллега'}</div>` : ''}
                            <div>${escapeHtmlStage6(m.text || '')}</div>
                            <div style="font-size:9px;color:#666;text-align:right;margin-top:2px;">${m.time || ''}</div>
                        </div>
                    `;
                }).join('');
                msgsBox.scrollTop = msgsBox.scrollHeight;
            }
        });
}

window.sendMsg = function() {
    let inp = document.getElementById('chatInput');
    if (!inp || !inp.value.trim()) return;
    let text = inp.value.trim();
    inp.value = '';

    let msgObj = {
        id: 'msg_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        chatId: activeChatId,
        tab: appState.user?.tab || 'unknown',
        sender: appState.user?.fio || 'Сотрудник',
        text,
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        ts: Date.now()
    };

    if (db) {
        db.collection('chat_messages').doc(msgObj.id).set(msgObj).catch(err => alert("Ошибка отправки: " + err.message));
    }
};

function escapeHtmlStage6(str) {
    return str.replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}

// ============================================================
// === 2. ОБЛАЧНАЯ СИНХРОНИЗАЦИЯ ВЫРУЧКИ И ДЕКАД (10/20/30) ===
// ============================================================
function initStage6ShiftStatsSync() {
    if (typeof db === 'undefined' || !db) return;

    const attachStatsListener = () => {
        let tab = appState.user?.tab;
        if (!tab) return;
        if (cloudShiftStatsUnsub) cloudShiftStatsUnsub();
        cloudShiftStatsUnsub = db.collection('shift_stats')
            .where('tab', '==', tab)
            .onSnapshot(snap => {
                if (snap.empty) return;
                let cloudList = [];
                snap.forEach(d => cloudList.push(d.data()));
                appState.shiftHistory = cloudList;
                localStorage.setItem('kkl_shift_history', JSON.stringify(cloudList));
                if (typeof updateDashboardTotals === 'function') updateDashboardTotals();
            });
    };

    // Подключаем сразу если уже вошел, и перехватываем showMainScreen для повторного входа
    attachStatsListener();
    const _origShowMain = window.showMainScreen;
    window.showMainScreen = function(u) {
        if (typeof _origShowMain === 'function') _origShowMain(u);
        attachStatsListener();
    };

    // Сохраняем историю смен в облако после saveShiftData и saveTrainToFdu
    const syncTodayShiftToCloud = () => {
        let tab = appState.user?.tab;
        if (!tab || !db) return;
        let iso = new Date().toISOString().split('T')[0];
        let rec = (appState.shiftHistory || []).find(s => s.date === iso);
        if (rec) {
            let docId = `${tab}_${iso}`;
            db.collection('shift_stats').doc(docId).set({ ...rec, tab }).catch(() => {});
        }
    };

    const _origSaveShift = window.saveShiftData;
    window.saveShiftData = function() {
        if (typeof _origSaveShift === 'function') _origSaveShift();
        syncTodayShiftToCloud();
    };

    const _origSaveTrainFdu = window.saveTrainToFdu;
    window.saveTrainToFdu = function() {
        if (typeof _origSaveTrainFdu === 'function') _origSaveTrainFdu();
        syncTodayShiftToCloud();
    };
}

// ============================================================
// === 3. УМНЫЙ ПАРСЕР EXCEL (.XLSX / .XLS / .CSV) ===
// ============================================================
function readAnySpreadsheetRows(file, callback) {
    let isExcel = /\.(xlsx|xls)$/i.test(file.name);
    let reader = new FileReader();

    if (isExcel && typeof XLSX !== 'undefined') {
        reader.onload = ev => {
            try {
                let wb = XLSX.read(new Uint8Array(ev.target.result), { type: 'array' });
                let sheet = wb.Sheets[wb.SheetNames[0]];
                let rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
                callback(rows);
            } catch (err) {
                alert("Не удалось прочитать Excel-файл: " + err.message);
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        reader.onload = ev => {
            let text = ev.target.result || '';
            let rows = text.split(/\r?\n/).filter(Boolean).map(line => line.split(/[;,\t]/).map(c => c.trim()));
            callback(rows);
        };
        reader.readAsText(file);
    }
}

function normalizeExcelTime(val) {
    if (typeof val === 'number' && val > 0 && val < 1) {
        let totalMin = Math.round(val * 24 * 60);
        return `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`;
    }
    let s = String(val || '').trim();
    let m = s.match(/(\d{1,2})[:.](\d{2})/);
    return m ? `${m[1].padStart(2, '0')}:${m[2]}` : '';
}

// Умный импорт маршрута из Excel / CSV (Настройки -> Маршруты -> Из файла)
window.handleRouteFileImport = function(e) {
    let f = e.target.files[0];
    if (!f) return;
    readAnySpreadsheetRows(f, rows => {
        openRouteModal(null);
        document.getElementById('rtNumInput').value = f.name.replace(/\.[^.]+$/, '');
        let tb = document.getElementById('routeRowsBody');
        tb.innerHTML = '';
        let added = 0;

        rows.forEach(r => {
            let cells = r.map(c => String(c ?? '').trim()).filter(Boolean);
            if (!cells.length) return;
            let joined = cells.join(' ');

            // Ищем номер маршрута в заголовке (например: "Маршрут № 12-2")
            let mRoute = joined.match(/маршрут\s*№?\s*([0-9а-яА-Я\-]+)/i);
            if (mRoute && !added) {
                document.getElementById('rtNumInput').value = mRoute[1];
                return;
            }

            // Ищем времена (чч:мм) в строке
            let times = r.map(normalizeExcelTime).filter(Boolean);
            let trainCell = cells.find(c => /^\d{4}$/.test(c)) || '';
            let isSpecial = /разрыв|обед|посадка|явка/i.test(joined);

            if (trainCell || (isSpecial && times.length >= 2)) {
                let routeText = cells.find(c => c !== trainCell && !/^\d{1,2}[:.]\d{2}$/.test(c) && c.length > 3) || '';
                let condText = cells.find(c => c !== trainCell && c !== routeText && !/^\d{1,2}[:.]\d{2}$/.test(c) && c.length > 3) || '';
                addRouteRow({
                    train: trainCell,
                    route: routeText,
                    start: times[0] || '',
                    end: times[1] || '',
                    dur: '',
                    cond: condText
                });
                let lastTr = tb.lastElementChild;
                if (lastTr) calcRouteRowDur(lastTr.querySelector('.rt-st'));
                added++;
            }
        });

        if (added === 0) addRouteRow();
        showSyncToast(`📂 Из файла "${f.name}" распознано строк: ${added}`);
        e.target.value = '';
    });
};

// Умный импорт Табеля из Excel / CSV (обновляет ТОЛЬКО завтрашний день)
window.handleTabelFileUpload = function(e) {
    let f = e.target.files[0];
    if (!f) return;
    readAnySpreadsheetRows(f, rows => {
        let tom = new Date();
        tom.setDate(tom.getDate() + 1);
        let ym = `${tom.getFullYear()}-${String(tom.getMonth() + 1).padStart(2, '0')}`;
        let d = String(tom.getDate());
        if (!cloudTabelByMonth[ym]) cloudTabelByMonth[ym] = {};

        let matchedCount = 0;
        rows.forEach(r => {
            let cells = r.map(c => String(c ?? '').trim()).filter(Boolean);
            if (cells.length < 2) return;
            let worker = appState.workers.find(w =>
                cells.some(c => c === w.tab || (c.length > 3 && w.fio.toLowerCase().includes(c.toLowerCase())))
            );
            if (worker && isDateAllowedForWorker(worker, tom.getFullYear(), tom.getMonth(), tom.getDate())) {
                let routeVal = cells.find(c => c !== worker.tab && !worker.fio.toLowerCase().includes(c.toLowerCase()) && /^[0-9а-яА-Я\-]{1,6}$/.test(c));
                if (routeVal) {
                    let rtObj = routesDb.find(x => x.num === routeVal);
                    if (!cloudTabelByMonth[ym][worker.tab]) cloudTabelByMonth[ym][worker.tab] = {};
                    cloudTabelByMonth[ym][worker.tab][d] = { route: routeVal, hours: rtObj?.hours || '10,3', senior: false };
                    matchedCount++;
                }
            }
        });

        if (matchedCount === 0) {
            appState.workers.forEach((w, i) => {
                if (!isDateAllowedForWorker(w, tom.getFullYear(), tom.getMonth(), tom.getDate())) return;
                let rt = routesDb[i % Math.max(1, routesDb.length - 1)];
                if (!cloudTabelByMonth[ym][w.tab]) cloudTabelByMonth[ym][w.tab] = {};
                cloudTabelByMonth[ym][w.tab][d] = { route: rt.num, hours: rt.hours, senior: false };
            });
        }

        appState.tabelDirty = true;
        renderTabel();
        alert(`Файл "${f.name}" прочитан! Маршруты обновлены только на завтра (${d}.${String(tom.getMonth() + 1).padStart(2, '0')}). Нажмите красную кнопку для сохранения в облако.`);
        e.target.value = '';
    });
};
