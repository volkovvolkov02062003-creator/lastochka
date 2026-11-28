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
