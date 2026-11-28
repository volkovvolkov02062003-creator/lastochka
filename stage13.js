// ============================================================
// === ЭТАП 13: СИНИЙ КРУЖОЧЕК «В СЕТИ» НА АВАТАРКЕ         ===
// === И СИСТЕМНЫЕ УВЕДОМЛЕНИЯ БЕЗ ВХОДА В ПРОГРАММУ        ===
// ============================================================

let st13State = {
    pageLoadTs: Date.now(),
    heartbeatTimer: null,
    seenNotifIds: new Set(),
    seenMsgIds: new Set(),
    lastPopupTab: null,
    decorateTimer: null
};

window.addEventListener('load', () => {
    injectStage13Styles();
    initStage13BackgroundNotifications();
    setTimeout(() => {
        initStage13PresenceAndDots();
    }, 1900);
});

// ============================================================
// === СТИЛИ: СИНИЙ КРУЖОЧЕК «В СЕТИ» (ВНИЗУ СПРАВА)        ===
// ============================================================
function injectStage13Styles() {
    if (document.getElementById('st13-styles')) return;
    let st = document.createElement('style');
    st.id = 'st13-styles';
    st.innerHTML = `
        /* Разрешаем кружочку отображаться поверх края аватарки без обрезки */
        .wa-avatar, .wa-msg-mini-av {
            position: relative !important;
            overflow: visible !important;
        }
        .wa-online-blue-dot {
            position: absolute;
            bottom: -1px;
            right: -1px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #2196f3;
            border: 2px solid #ffffff;
            box-shadow: 0 0 4px rgba(33, 150, 243, 0.85);
            z-index: 6;
            pointer-events: none;
        }
        .wa-msg-mini-av .wa-online-blue-dot {
            width: 9px;
            height: 9px;
            border-width: 1.5px;
        }
        body.dark-theme .wa-online-blue-dot {
            border-color: #111b21;
        }
        .st13-notif-bar {
            position: fixed;
            bottom: 14px;
            left: 50%;
            transform: translateX(-50%);
            background: #003366;
            color: #ffffff;
            padding: 10px 16px;
            border-radius: 24px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.4);
            z-index: 4800;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 13px;
            max-width: 92vw;
        }
        .st13-notif-bar button {
            width: auto !important;
            margin: 0 !important;
            padding: 6px 12px !important;
            font-size: 12px !important;
            border-radius: 16px !important;
        }
    `;
    document.head.appendChild(st);
}

// ============================================================
// === 1. ОНЛАЙН-СТАТУС (HEARTBEAT) И СИНИЙ КРУЖОЧЕК        ===
// ============================================================
function getSt13CurrentTab() {
    if (appState?.user?.tab) return appState.user.tab;
    try {
        let saved = JSON.parse(localStorage.getItem('kkl_profile') || 'null');
        return saved?.tab || '';
    } catch (e) { return ''; }
}

function sendOnlineHeartbeat(isOnline) {
    let tab = getSt13CurrentTab();
    if (!tab || typeof db === 'undefined' || !db) return;
    db.collection('workers').doc(tab).set({
        online: !!isOnline,
        lastSeen: Date.now()
    }, { merge: true }).catch(() => {});
}

function isWorkerOnlineSt13(w) {
    if (!w) return false;
    if (!w.online || !w.lastSeen) return false;
    return (Date.now() - Number(w.lastSeen)) < 90000; // онлайн, если был активен последние 90 сек
}

function initStage13PresenceAndDots() {
    // Отправляем статус «в сети» сразу и каждые 30 секунд
    sendOnlineHeartbeat(true);
    if (st13State.heartbeatTimer) clearInterval(st13State.heartbeatTimer);
    st13State.heartbeatTimer = setInterval(() => {
        if (document.visibilityState === 'visible') sendOnlineHeartbeat(true);
        decorateOnlineBlueDots();
    }, 30000);

    document.addEventListener('visibilitychange', () => {
        sendOnlineHeartbeat(document.visibilityState === 'visible');
    });
    window.addEventListener('beforeunload', () => sendOnlineHeartbeat(false));
    window.addEventListener('pagehide', () => sendOnlineHeartbeat(false));

    // Запоминаем tab при открытии карточки профиля сотрудника
    if (typeof window.openSt12UserProfilePopup === 'function') {
        const _origPop = window.openSt12UserProfilePopup;
        window.openSt12UserProfilePopup = function(tab) {
            st13State.lastPopupTab = tab;
            _origPop(tab);
            setTimeout(decorateOnlineBlueDots, 30);
        };
    }

    // Автоматически обновляем синие кружочки при любом обновлении чатов и модалок
    const scheduleDecorate = () => {
        if (st13State.decorateTimer) clearTimeout(st13State.decorateTimer);
        st13State.decorateTimer = setTimeout(decorateOnlineBlueDots, 60);
    };

    const obs = new MutationObserver(scheduleDecorate);
    obs.observe(document.body, { childList: true, subtree: true });

    if (typeof db !== 'undefined' && db) {
        db.collection('workers').onSnapshot(() => scheduleDecorate());
    }

    decorateOnlineBlueDots();
}

function setBlueDotOnAvatar(avatarEl, isOnline) {
    if (!avatarEl) return;
    let existing = avatarEl.querySelector('.wa-online-blue-dot');
    if (isOnline) {
        if (!existing) {
            let dot = document.createElement('span');
            dot.className = 'wa-online-blue-dot';
            dot.title = 'В сети';
            avatarEl.appendChild(dot);
        }
    } else if (existing) {
        existing.remove();
    }
}

function decorateOnlineBlueDots() {
    let workers = appState?.workers || [];
    let myTab = getSt13CurrentTab();
    const findW = tab => workers.find(w => w.tab === tab);

    // 1. Список личных чатов слева
    document.querySelectorAll('#cloudChatListBox .wa-chat-row').forEach(row => {
        let oc = row.getAttribute('onclick') || '';
        let m = oc.match(/openCloudChat\('([^']+)'\)/);
        if (!m) return;
        let chatId = m[1];
        let c = (cloudChatsList || []).find(x => x.id === chatId);
        let av = row.querySelector('.wa-avatar');
        if (!c || c.isGroup !== false) { setBlueDotOnAvatar(av, false); return; }
        let meta = typeof getChatDisplayMeta === 'function' ? getChatDisplayMeta(c) : null;
        let peerW = meta?.peerTab ? findW(meta.peerTab) : null;
        setBlueDotOnAvatar(av, isWorkerOnlineSt13(peerW));
    });

    // 2. Аватарка в шапке открытого личного чата
    let headerAv = document.getElementById('waHeaderAvatar');
    if (headerAv && typeof activeChatId !== 'undefined') {
        let c = (cloudChatsList || []).find(x => x.id === activeChatId);
        if (c && c.isGroup === false && typeof getChatDisplayMeta === 'function') {
            let meta = getChatDisplayMeta(c);
            setBlueDotOnAvatar(headerAv, isWorkerOnlineSt13(findW(meta.peerTab)));
        } else {
            setBlueDotOnAvatar(headerAv, false);
        }
    }

    // 3. Мини-аватарки в сообщениях группового чата
    document.querySelectorAll('#chatMsgs .wa-msg-mini-av').forEach(av => {
        let oc = av.getAttribute('onclick') || '';
        let m = oc.match(/openSt12UserProfilePopup\('([^']+)'\)/);
        if (!m) return;
        setBlueDotOnAvatar(av, isWorkerOnlineSt13(findW(m[1])));
    });

    // 4. Список участников внутри карточки группы
    document.querySelectorAll('#waInfoModalBody .st12-member-row').forEach(row => {
        let oc = row.getAttribute('onclick') || '';
        let m = oc.match(/onSt12GroupMemberClick\('([^']+)'\)/);
        if (!m) return;
        let av = row.querySelector('.wa-avatar');
        setBlueDotOnAvatar(av, isWorkerOnlineSt13(findW(m[1])));
    });

    // 5. Карточка профиля сотрудника при клике на ФИО
    let popAv = document.getElementById('st12PopAv');
    if (popAv && st13State.lastPopupTab) {
        setBlueDotOnAvatar(popAv, isWorkerOnlineSt13(findW(st13State.lastPopupTab)));
    }
}

// ============================================================
// === 2. СИСТЕМНЫЕ УВЕДОМЛЕНИЯ БЕЗ ВХОДА В ПРОГРАММУ       ===
// ============================================================
function initStage13BackgroundNotifications() {
    // Показываем кнопку включения уведомлений, если разрешение еще не выдано
    if ('Notification' in window && Notification.permission === 'default') {
        showEnableNotificationsBanner();
    }

    // Подписываемся на уведомления и сообщения сразу при загрузке (даже до входа)
    if (typeof db === 'undefined' || !db) return;

    // A) Системные уведомления (Табель, ГУО, Синхрон, Тех. занятия)
    db.collection('notifications').onSnapshot(snap => {
        let myTab = getSt13CurrentTab();
        snap.docChanges().forEach(change => {
            if (change.type !== 'added') return;
            let n = change.doc.data();
            let id = change.doc.id;
            if (st13State.seenNotifIds.has(id)) return;
            st13State.seenNotifIds.add(id);

            // Показываем только свежие уведомления (пришедшие после открытия)
            if ((n.ts || 0) <= st13State.pageLoadTs) return;
            if (n.targetTab && myTab && n.targetTab !== myTab) return;

            fireOsNotification('Ласточка МТППК', n.text || 'Новое уведомление');
        });
    });

    // Б) Новые сообщения в чатах
    db.collection('chat_messages').onSnapshot(snap => {
        let myTab = getSt13CurrentTab();
        snap.docChanges().forEach(change => {
            if (change.type !== 'added') return;
            let m = change.doc.data();
            let id = change.doc.id;
            if (st13State.seenMsgIds.has(id)) return;
            st13State.seenMsgIds.add(id);

            if ((m.ts || 0) <= st13State.pageLoadTs) return;
            if (myTab && m.tab === myTab) return;

            // Если чат скрыт или приложение свернуто / на экране входа — шлем системное уведомление
            let chatVisible = document.visibilityState === 'visible'
                && document.getElementById('chats-screen')?.classList.contains('active-screen')
                && typeof activeChatId !== 'undefined' && activeChatId === m.chatId;

            if (!chatVisible) {
                let body = m.text || (m.img ? '📷 Фотография' : (m.video ? '🎬 Видео' : (m.audio ? '🎤 Голосовое сообщение' : 'Новое сообщение')));
                fireOsNotification(`💬 ${m.sender || 'Чат Ласточка'}`, body);
            }
        });
    });
}

function showEnableNotificationsBanner() {
    if (document.getElementById('st13NotifBanner')) return;
    let bar = document.createElement('div');
    bar.id = 'st13NotifBanner';
    bar.className = 'st13-notif-bar';
    bar.innerHTML = `
        <span>🔔 Включить уведомления на телефон?</span>
        <button class="btn-success" onclick="requestSt13NotifPermission()">Включить</button>
        <button class="btn-secondary" onclick="this.parentElement.remove()">Позже</button>
    `;
    document.body.appendChild(bar);
}

async function requestSt13NotifPermission() {
    let bar = document.getElementById('st13NotifBanner');
    if (bar) bar.remove();
    if (!('Notification' in window)) return alert("Браузер не поддерживает системные уведомления.");
    let res = await Notification.requestPermission();
    if (res === 'granted') {
        fireOsNotification('Ласточка МТППК', 'Уведомления успешно включены!');
    } else {
        alert("Уведомления запрещены в настройках браузера.");
    }
}

function fireOsNotification(title, body) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    let opts = {
        body: body,
        icon: 'train.jpg',
        badge: 'train.jpg',
        vibrate: [200, 100, 200],
        tag: 'lastochka_' + Date.now()
    };

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(reg => {
            if (reg && reg.showNotification) {
                reg.showNotification(title, opts);
            } else {
                new Notification(title, opts);
            }
        }).catch(() => {
            try { new Notification(title, opts); } catch (e) {}
        });
    } else {
        try { new Notification(title, opts); } catch (e) {}
    }
}
