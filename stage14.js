// ============================================================
// === ЭТАП 14: ИСПРАВЛЕНИЕ 3 ТОЧЕК В КАРТОЧКЕ ГРУППЫ       ===
// === И УДАЛЕНИЕ / ВЫХОД ИЗ ЧАТА ПО УДЕРЖАНИЮ ИЛИ ПКМ      ===
// ============================================================

let st14State = {
    ctxChatId: null,
    pressTimer: null
};

window.addEventListener('load', () => {
    injectStage14Styles();
    injectStage14Modal();
    setTimeout(initStage14, 2150);
});

function st14Esc(str) {
    return String(str || '').replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}

function isGroupChatSt14(c) {
    if (!c) return false;
    if (c.isGroup === false) return false;
    if ((c.id || '').startsWith('dm_')) return false;
    return true;
}

function injectStage14Styles() {
    if (document.getElementById('st14-styles')) return;
    let st = document.createElement('style');
    st.id = 'st14-styles';
    st.innerHTML = `
        /* ЧЕТКАЯ КНОПКА 3 ТОЧКИ В ПРАВОМ ВЕРХНЕМ УГЛУ КАРТОЧКИ ГРУППЫ */
        .st12-dots-btn {
            width: 36px !important;
            height: 36px !important;
            min-width: 36px !important;
            border-radius: 50% !important;
            background: #e5e7eb !important;
            color: #111b21 !important;
            font-size: 22px !important;
            line-height: 1 !important;
            font-weight: bold !important;
            margin: 0 !important;
            padding: 0 !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            border: 1px solid #cbd5e1 !important;
            flex-shrink: 0 !important;
        }
        .st12-dots-btn:hover {
            background: #cbd5e1 !important;
        }
    `;
    document.head.appendChild(st);
}

function initStage14() {
    // 1. Исправляем определение группового чата для старых и новых групп
    window.getChatDisplayMeta = function(c) {
        let myTab = appState.user?.tab || '';
        if (isGroupChatSt14(c)) {
            return {
                name: c.name || 'Группа',
                avatarText: c.avatar || (c.name || 'Г').slice(0, 2).toUpperCase(),
                photo: c.photo || '',
                isGroup: true,
                peerTab: null
            };
        }
        let peerTab = (c.participants || []).find(t => t !== myTab) || null;
        if (!peerTab && c.id && c.id.startsWith('dm_')) {
            peerTab = c.id.replace('dm_', '').split('_').find(t => t !== myTab) || null;
        }
        let peerW = (appState.workers || []).find(w => w.tab === peerTab);
        let name = peerW?.fio || c.participantNames?.[peerTab] || c.name || 'Собеседник';
        let init = name.split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase();
        return { name, avatarText: init, photo: peerW?.avatar || '', isGroup: false, peerTab, peerWorker: peerW };
    };

    // 2. Учитываем скрытые/удаленные чаты (hiddenFor)
    const _origVisible = window.isChatVisibleToMe;
    window.isChatVisibleToMe = function(c) {
        let myTab = appState.user?.tab || '';
        if (myTab && Array.isArray(c.hiddenFor) && c.hiddenFor.includes(myTab)) return false;
        return typeof _origVisible === 'function' ? _origVisible(c) : true;
    };

    // Если снова открыть личный чат с тем, кого удаляли — возвращаем его в список
    if (typeof window.startPrivateDmWithWorker === 'function') {
        const _origDm = window.startPrivateDmWithWorker;
        window.startPrivateDmWithWorker = function(w) {
            let myTab = appState.user?.tab || '0';
            let pairId = 'dm_' + [myTab, w.tab].sort().join('_');
            let ex = (cloudChatsList || []).find(c => c.id === pairId);
            if (ex && Array.isArray(ex.hiddenFor) && ex.hiddenFor.includes(myTab)) {
                ex.hiddenFor = ex.hiddenFor.filter(t => t !== myTab);
                if (typeof db !== 'undefined' && db) {
                    db.collection('chats').doc(pairId).set({ hiddenFor: ex.hiddenFor }, { merge: true }).catch(() => {});
                }
            }
            _origDm(w);
        };
    }

    // 3. Добавляем пункт «Выйти из группы» в меню 3 точек (если не админ или для всех)
    const _origRenderInfo = window.renderStage12ChatInfoBody;
    if (typeof _origRenderInfo === 'function') {
        window.renderStage12ChatInfoBody = function(c) {
            _origRenderInfo(c);
            let menu = document.getElementById('st12DotsMenu');
            if (menu && isGroupChatSt14(c) && !menu.querySelector('[data-st14-leave]')) {
                let leaveOpt = document.createElement('div');
                leaveOpt.className = 'st12-dots-opt danger';
                leaveOpt.setAttribute('data-st14-leave', '1');
                leaveOpt.innerText = '🚪 Удалить чат и выйти';
                leaveOpt.onclick = () => {
                    closeModal('waInfoModal');
                    st14State.ctxChatId = c.id;
                    executeSt14DeleteOrLeaveChat(false);
                };
                menu.appendChild(leaveOpt);
            }
        };
    }

    // 4. Правый клик (ПК) и удержание (телефон) на любой строке чата в списке
    document.addEventListener('contextmenu', e => {
        let row = e.target.closest('#cloudChatListBox .wa-chat-row');
        if (!row || (typeof waState !== 'undefined' && waState.tab !== 'chats')) return;
        let chatId = extractChatIdFromRow(row);
        if (!chatId) return;
        e.preventDefault();
        openSt14ChatContextMenu(chatId);
    });

    document.addEventListener('touchstart', e => {
        let row = e.target.closest('#cloudChatListBox .wa-chat-row');
        if (!row || (typeof waState !== 'undefined' && waState.tab !== 'chats')) return;
        let chatId = extractChatIdFromRow(row);
        if (!chatId) return;
        clearSt14ChatPress();
        st14State.pressTimer = setTimeout(() => {
            openSt14ChatContextMenu(chatId);
        }, 450);
    }, { passive: true });

    document.addEventListener('touchend', clearSt14ChatPress, { passive: true });
    document.addEventListener('touchmove', clearSt14ChatPress, { passive: true });
    document.addEventListener('touchcancel', clearSt14ChatPress, { passive: true });
}

function clearSt14ChatPress() {
    if (st14State.pressTimer) {
        clearTimeout(st14State.pressTimer);
        st14State.pressTimer = null;
    }
}

function extractChatIdFromRow(row) {
    let oc = row.getAttribute('onclick') || '';
    let m = oc.match(/openCloudChat\('([^']+)'\)/);
    return m ? m[1] : null;
}

function openSt14ChatContextMenu(chatId) {
    let c = (cloudChatsList || []).find(x => x.id === chatId);
    if (!c) return;
    st14State.ctxChatId = chatId;

    let meta = getChatDisplayMeta(c);
    let isGrp = isGroupChatSt14(c);
    let amAdmin = isGrp && typeof isMeAdminInChat === 'function' && isMeAdminInChat(c);

    document.getElementById('st14ChatCtxTitle').innerText = meta.name;

    let html = '';
    if (isGrp) {
        html += `<div class="st12-ctx-item danger" onclick="executeSt14DeleteOrLeaveChat(false)"><span>🚪</span> Удалить чат и выйти</div>`;
        if (amAdmin) {
            html += `<div class="st12-ctx-item danger" onclick="executeSt14DeleteOrLeaveChat(true)"><span>🗑️</span> Удалить группу у всех</div>`;
        }
    } else {
        html += `<div class="st12-ctx-item danger" onclick="executeSt14DeleteOrLeaveChat(false)"><span>🗑️</span> Удалить чат</div>`;
    }
    html += `<div class="st12-ctx-item" onclick="closeSt14ChatContextMenu()"><span>✕</span> Отмена</div>`;

    document.getElementById('st14ChatCtxItems').innerHTML = html;
    document.getElementById('st14ChatCtxOverlay').style.display = 'flex';
}

function closeSt14ChatContextMenu() {
    document.getElementById('st14ChatCtxOverlay').style.display = 'none';
}

function executeSt14DeleteOrLeaveChat(deleteForEveryone) {
    let chatId = st14State.ctxChatId;
    closeSt14ChatContextMenu();
    let c = (cloudChatsList || []).find(x => x.id === chatId);
    if (!c) return;

    let myTab = appState.user?.tab || '';
    let isGrp = isGroupChatSt14(c);
    let meta = getChatDisplayMeta(c);

    if (isGrp && deleteForEveryone) {
        if (!confirm(`Удалить группу «${meta.name}» для всех участников?`)) return;
        cloudChatsList = cloudChatsList.filter(x => x.id !== chatId);
        if (typeof db !== 'undefined' && db) db.collection('chats').doc(chatId).delete().catch(() => {});
        showSyncToast(`🗑️ Группа «${meta.name}» удалена`);
    } else if (isGrp) {
        if (!confirm(`Выйти из группы «${meta.name}» и удалить чат из списка?`)) return;
        let hidden = Array.isArray(c.hiddenFor) ? [...c.hiddenFor] : [];
        if (myTab && !hidden.includes(myTab)) hidden.push(myTab);
        c.hiddenFor = hidden;

        let updateObj = { hiddenFor: hidden };
        if (Array.isArray(c.members)) {
            c.members = c.members.filter(t => t !== myTab);
            updateObj.members = c.members;
        }
        if (typeof db !== 'undefined' && db) db.collection('chats').doc(chatId).set(updateObj, { merge: true }).catch(() => {});
        showSyncToast(`🚪 Вы вышли из группы «${meta.name}»`);
    } else {
        if (!confirm(`Удалить личный чат с «${meta.name}»?`)) return;
        let hidden = Array.isArray(c.hiddenFor) ? [...c.hiddenFor] : [];
        if (myTab && !hidden.includes(myTab)) hidden.push(myTab);
        c.hiddenFor = hidden;
        if (typeof db !== 'undefined' && db) db.collection('chats').doc(chatId).set({ hiddenFor: hidden }, { merge: true }).catch(() => {});
        showSyncToast(`🗑️ Чат «${meta.name}» удален`);
    }

    if (activeChatId === chatId) {
        let next = (cloudChatsList || []).filter(isChatVisibleToMe)[0];
        activeChatId = next ? next.id : '';
        if (typeof waState !== 'undefined') waState.mobileChatOpen = false;
    }
    if (typeof renderCloudChatsLayout === 'function') renderCloudChatsLayout();
}

function injectStage14Modal() {
    let wrap = document.createElement('div');
    wrap.innerHTML = `
        <div id="st14ChatCtxOverlay" class="st12-ctx-overlay" onclick="closeSt14ChatContextMenu()">
            <div class="st12-ctx-menu" onclick="event.stopPropagation()">
                <div id="st14ChatCtxTitle" style="padding:10px 16px 6px;font-size:13px;font-weight:bold;color:#008069;border-bottom:1px solid #eee;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Чат</div>
                <div id="st14ChatCtxItems"></div>
            </div>
        </div>
    `;
    document.body.appendChild(wrap);
}
// ============================================================
// === ЗЕЛЕНАЯ КНОПКА «+» ВНИЗУ ЧАТОВ + 3 КНОПКИ ВВЕРХ      ===
// === И РАЗДЕЛЕНИЕ ТЕЛЕФОННОЙ КНИГИ (ЕСТЬ / НЕТ В ПРОГРАММЕ)===
// ============================================================
function injectStage14FabStyles() {
    if (document.getElementById('st14-fab-styles')) return;
    let st = document.createElement('style');
    st.id = 'st14-fab-styles';
    st.innerHTML = `
        .wa-sidebar { position: relative !important; }
        /* Скрываем старую кнопку «бумага с карандашом» сверху */
        .wa-side-header button[onclick*="openWaNewChatMenu"] { display: none !important; }

        /* Зеленая круглая кнопка «+» внизу списка чатов */
        .wa-fab-plus {
            position: absolute;
            bottom: 18px;
            right: 18px;
            width: 54px !important;
            height: 54px !important;
            min-width: 54px !important;
            border-radius: 50% !important;
            background: #25d366 !important;
            color: #ffffff !important;
            font-size: 30px !important;
            line-height: 1 !important;
            font-weight: 400 !important;
            margin: 0 !important;
            padding: 0 !important;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
            z-index: 30;
            transition: transform 0.2s ease, background 0.2s ease;
        }
        .wa-fab-plus:hover { background: #1ebe5d !important; transform: scale(1.06); }
        .wa-fab-plus.open { transform: rotate(45deg); background: #008069 !important; }

        /* 3 кнопки, выезжающие вверх над зеленым «+» */
        .wa-fab-menu {
            display: none;
            position: absolute;
            bottom: 82px;
            right: 18px;
            flex-direction: column;
            gap: 8px;
            z-index: 31;
            width: 255px;
            max-width: calc(100% - 36px);
        }
        .wa-fab-menu.open { display: flex; }
        .wa-fab-action-btn {
            display: flex !important;
            align-items: center;
            gap: 10px;
            width: 100% !important;
            margin: 0 !important;
            padding: 11px 14px !important;
            border-radius: 12px !important;
            background: #ffffff !important;
            color: #111b21 !important;
            font-size: 13px !important;
            font-weight: 600 !important;
            text-align: left !important;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
            border: 1px solid #d1d7db !important;
        }
        .wa-fab-action-btn:hover { background: #e7fce3 !important; color: #008069 !important; }
        body.dark-theme .wa-fab-action-btn {
            background: #233138 !important;
            color: #e9edef !important;
            border-color: #2a3942 !important;
        }
    `;
    document.head.appendChild(st);
}

function mountWaGreenFab() {
    let sidebar = document.querySelector('#chats-screen .wa-sidebar');
    if (!sidebar) return;
    let isChatsTab = typeof waState === 'undefined' || waState.tab === 'chats';

    let oldFab = document.getElementById('waFabPlusBtn');
    let oldMenu = document.getElementById('waFabUpMenu');
    if (!isChatsTab) {
        if (oldFab) oldFab.remove();
        if (oldMenu) oldMenu.remove();
        return;
    }
    if (oldFab) return;

    let menu = document.createElement('div');
    menu.id = 'waFabUpMenu';
    menu.className = 'wa-fab-menu';
    menu.innerHTML = `
        <button type="button" class="wa-fab-action-btn" onclick="closeWaFabMenu();openSt12CreateGroupModal();">
            <span>👥</span> <span>1. Создать новую группу</span>
        </button>
        <button type="button" class="wa-fab-action-btn" onclick="closeWaFabMenu();openSt14DmPickerModal();">
            <span>💬</span> <span>2. Написать личное сообщение</span>
        </button>
        <button type="button" class="wa-fab-action-btn" onclick="closeWaFabMenu();openContactsInviteModal();">
            <span>📱</span> <span>3. Найти друга по телефонной книге</span>
        </button>
    `;

    let fab = document.createElement('button');
    fab.type = 'button';
    fab.id = 'waFabPlusBtn';
    fab.className = 'wa-fab-plus';
    fab.title = 'Новый чат';
    fab.innerText = '+';
    fab.onclick = toggleWaFabMenu;

    sidebar.appendChild(menu);
    sidebar.appendChild(fab);
}

function toggleWaFabMenu() {
    let m = document.getElementById('waFabUpMenu');
    let b = document.getElementById('waFabPlusBtn');
    if (!m || !b) return;
    let open = m.classList.toggle('open');
    b.classList.toggle('open', open);
}

function closeWaFabMenu() {
    let m = document.getElementById('waFabUpMenu');
    let b = document.getElementById('waFabPlusBtn');
    if (m) m.classList.remove('open');
    if (b) b.classList.remove('open');
}

// Модалка выбора коллеги для личного сообщения (кнопка 2)
function openSt14DmPickerModal() {
    let inp = document.getElementById('st14DmSearchInp');
    if (inp) inp.value = '';
    renderSt14DmPickerList('');
    openModal('st14DmPickerModal');
}

function renderSt14DmPickerList(q) {
    let box = document.getElementById('st14DmPickerList');
    if (!box) return;
    let myTab = appState.user?.tab || '';
    let query = (q || '').trim().toLowerCase();
    let list = (appState.workers || []).filter(w =>
        w.tab !== myTab && (!query || (w.fio || '').toLowerCase().includes(query) || (w.tab || '').includes(query) || (w.phone || '').includes(query))
    );
    box.innerHTML = list.length === 0
        ? '<div style="padding:14px;text-align:center;color:#666;font-size:13px;">Сотрудники не найдены</div>'
        : list.map(w => {
            let init = (w.fio || 'С').split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase();
            return `
                <div class="st12-member-row" onclick="closeModal('st14DmPickerModal');startPrivateDmWithWorker(appState.workers.find(x=>x.tab==='${st14Esc(w.tab)}'))">
                    <div class="wa-avatar" style="width:36px;height:36px;min-width:36px;font-size:12px;overflow:hidden;">${renderAvatarInner(w.avatar, init)}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="font-size:13px;font-weight:600;">${st14Esc(w.fio)}</div>
                        <div style="font-size:11px;color:#666;">${st14Esc(w.sector \vert{}\vert{} w.station \vert{}\vert{} '')}${w.phone ? ' • ' + st14Esc(w.phone) : ''}</div>
                    </div>
                </div>
            `;
        }).join('');
}

// Улучшенный вывод телефонной книги: отдельно «Есть в программе» и «Нет в программе»
function initStage14FabAndPhonebook() {
    injectStage14FabStyles();

    // Инъекция модалки выбора собеседника для ЛС
    if (!document.getElementById('st14DmPickerModal')) {
        let wrap = document.createElement('div');
        wrap.innerHTML = `
            <div id="st14DmPickerModal" class="modal">
                <div class="modal-content" style="max-width:420px;">
                    <h3 style="margin-top:0;">💬 Написать личное сообщение</h3>
                    <input id="st14DmSearchInp" class="form-input" placeholder="Поиск по фамилии, табельному или телефону..." oninput="renderSt14DmPickerList(this.value)" style="margin-bottom:10px;">
                    <div id="st14DmPickerList" style="max-height:300px;overflow-y:auto;border:1px solid #eee;border-radius:6px;"></div>
                    <button class="btn-secondary" style="margin-top:10px;" onclick="closeModal('st14DmPickerModal')">Отмена</button>
                </div>
            </div>
        `;
        document.body.appendChild(wrap);
    }

    // Переопределяем отображение контактов из телефонной книги (разделяем на «Есть в программе» и «Нет»)
    window.renderPickedContacts = function(list) {
        let box = document.getElementById('pickedContactsList');
        if (!box || !list || !list.length) return;

        let inApp = [];
        let notInApp = [];
        list.forEach(c => {
            let digits = (c.tel || '').replace(/\D/g, '').slice(-10);
            let existing = digits.length >= 7
                ? (appState.workers || []).find(w => w.phone && w.phone.replace(/\D/g, '').slice(-10) === digits)
                : null;
            if (existing) inApp.push({ c, w: existing });
            else notInApp.push(c);
        });

        let html = '';
        if (inApp.length > 0) {
            html += `<div style="padding:5px 8px;background:#e7fce3;color:#008069;font-weight:bold;font-size:12px;border-radius:4px;margin-bottom:4px;">✅ Есть в нашей программе (${inApp.length})</div>`;
            html += inApp.map(({ c, w }) => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 6px;border-bottom:1px solid #eee;font-size:13px;">
                    <div><strong>${st14Esc(w.fio)}</strong><br><small style="color:#666;">${st14Esc(c.tel)} •${st14Esc(w.sector || w.station || '')}</small></div>
                    <button class="btn-success" style="width:auto;margin:0;padding:5px 10px;font-size:12px;" onclick="closeModal('contactsInviteModal');startPrivateDmWithWorker(appState.workers.find(x=>x.tab==='${st14Esc(w.tab)}'))">Написать</button>
                </div>
            `).join('');
        }
        if (notInApp.length > 0) {
            html += `<div style="padding:5px 8px;background:#f4f6f9;color:#555;font-weight:bold;font-size:12px;border-radius:4px;margin:8px 0 4px;">📩 Нет в программе — можно пригласить (${notInApp.length})</div>`;
            html += notInApp.map(c => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 6px;border-bottom:1px solid #eee;font-size:13px;">
                    <div><strong>${st14Esc(c.name)}</strong><br><small style="color:#666;">${st14Esc(c.tel)}</small></div>
                    <button class="btn-action" style="width:auto;margin:0;padding:5px 10px;font-size:12px;"
