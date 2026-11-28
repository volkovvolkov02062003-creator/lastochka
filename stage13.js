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
// ============================================================
// === КАРТОЧКА СОТРУДНИКА: «СОХРАНИТЬ» -> «ИЗМЕНИТЬ СОХРАНЕНИЯ»
// ============================================================
let st13WorkerInitial = null;

function getWorkerModalSnapshot() {
    return {
        tab: document.getElementById('newWorkerTab')?.value.trim() || '',
        sector: document.getElementById('newWorkerSector')?.value.trim() || '',
        fio: document.getElementById('newWorkerFio')?.value.trim() || '',
        station: document.getElementById('newWorkerStation')?.value.trim() || '',
        pos: document.getElementById('newWorkerPos')?.value || '',
        hire: document.getElementById('newWorkerHire')?.value || '',
        fire: document.getElementById('newWorkerFire')?.value || ''
    };
}

function updateWorkerSaveButtonLabel() {
    let modal = document.getElementById('createWorkerModal');
    if (!modal) return;
    let btn = modal.querySelector('button[onclick*="saveWorkerForm"]');
    if (!btn) return;

    if (!appState.editingId || !st13WorkerInitial) {
        btn.innerText = 'Сохранить';
        btn.className = 'btn-success';
        return;
    }

    let cur = getWorkerModalSnapshot();
    let changed = Object.keys(st13WorkerInitial).some(k => cur[k] !== st13WorkerInitial[k]);
    if (changed) {
        btn.innerText = 'Изменить сохранения';
        btn.className = 'btn-warning';
    } else {
        btn.innerText = 'Сохранить';
        btn.className = 'btn-success';
    }
}

function initStage13WorkerEditButton() {
    let modal = document.getElementById('createWorkerModal');
    if (!modal) return;

    modal.querySelectorAll('input, select').forEach(el => {
        if (el.dataset.st13Bound) return;
        el.dataset.st13Bound = '1';
        el.addEventListener('input', updateWorkerSaveButtonLabel);
        el.addEventListener('change', updateWorkerSaveButtonLabel);
    });

    const _origOpenWorker = window.openWorkerModal;
    window.openWorkerModal = function(tab) {
        if (typeof _origOpenWorker === 'function') _origOpenWorker(tab);
        let h3 = modal.querySelector('h3');
        if (h3) h3.innerText = tab ? 'Редактировать сотрудника' : 'Создать сотрудника';
        st13WorkerInitial = tab ? getWorkerModalSnapshot() : null;
        updateWorkerSaveButtonLabel();
    };

    window.saveWorkerForm = function() {
        let tab = document.getElementById('newWorkerTab').value.trim();
        let fio = document.getElementById('newWorkerFio').value.trim();
        if (!tab || !fio) return alert('Заполните Табельный и ФИО');

        let oldTab = appState.editingId || null;
        let existing = (appState.workers || []).find(w => w.tab === (oldTab || tab)) || {};
        let posName = document.getElementById('newWorkerPos').value;
        let posObj = (positionsDb || []).find(p => p.name === posName);

        let obj = {
            ...existing,
            tab,
            fio,
            sector: document.getElementById('newWorkerSector').value.trim() || 'УФОСЭ Клин',
            station: document.getElementById('newWorkerStation').value.trim() || 'Клин',
            position: posName,
            role: tab === '8065' ? 'founder' : (posObj?.role || existing.role || 'viewer'),
            hireDate: document.getElementById('newWorkerHire').value,
            fireDate: document.getElementById('newWorkerFire').value,
            shiftStatus: existing.shiftStatus || 'none'
        };

        let isEdit = !!oldTab;
        if (typeof db !== 'undefined' && db) {
            if (oldTab && oldTab !== tab) {
                db.collection('workers').doc(oldTab).delete().catch(() => {});
            }
            db.collection('workers').doc(tab).set(obj, { merge: true }).then(() => {
                showSyncToast(isEdit ? `☁️ Изменения по ${fio} сохранены` : `☁️ Сотрудник ${fio} сохранен`);
            });
        } else {
            let idx = (appState.workers || []).findIndex(x => x.tab === (oldTab || tab));
            if (idx >= 0) appState.workers[idx] = obj;
            else appState.workers.push(obj);
            if (typeof renderTabel === 'function') renderTabel();
            if (typeof renderOrgTable === 'function') renderOrgTable();
        }

        if (appState.user && appState.user.tab === (oldTab || tab)) {
            appState.user = { ...appState.user, ...obj, completed: true };
            localStorage.setItem('kkl_profile', JSON.stringify(appState.user));
            localStorage.setItem('kkl_profile_' + tab, JSON.stringify(appState.user));
            if (typeof applyRolePermissions === 'function') applyRolePermissions();
        }

        st13WorkerInitial = null;
        appState.editingId = null;
        closeModal('createWorkerModal');
    };
}

window.addEventListener('load', () => {
    setTimeout(initStage13WorkerEditButton, 1950);
});
// ============================================================
// === ПОДПИСЬ В ПРОФИЛЕ, ПЕРВЫЙ ВХОД БЕЗ ПАРОЛЯ, ПРИМЕР 1111 ===
// ============================================================
function initStage13ProfileSigAndLogin() {
    // 1. Примеры на начальном экране входа: 1111 и Иванов
    let loginTabInp = document.getElementById('loginTab');
    let loginLastInp = document.getElementById('loginLast');
    if (loginTabInp) loginTabInp.placeholder = 'Например, 1111';
    if (loginLastInp) loginLastInp.placeholder = 'Например, Иванов';

    let regPassInp = document.getElementById('regPass');
    if (regPassInp) regPassInp.placeholder = 'Придумайте личный пароль для входа';

    // 2. Первый вход без пароля -> пароль придумывается при регистрации профиля
    window.checkUserStep1 = function() {
        let tab = document.getElementById('loginTab').value.trim();
        let last = document.getElementById('loginLast').value.trim();
        let found = (appState.workers || []).find(w => w.tab === tab && w.fio.toLowerCase().includes(last.toLowerCase()));
        if (!found) return alert('Сотрудник не найден! (Пример: 1111 и Иванов)');

        appState.user = found;
        document.getElementById('loginStep1').style.display = 'none';
        document.getElementById('logFoundName').innerText = last;
        document.getElementById('logFoundTab').innerText = tab;
        document.getElementById('logFoundFull').innerText = found.fio;

        let savedLocal = JSON.parse(localStorage.getItem('kkl_profile_' + tab) || 'null');
        let hasPass = !!(found.password || savedLocal?.password);

        let passInp = document.getElementById('loginPassInput');
        let passBox = passInp ? passInp.parentElement : null;
        if (passBox) passBox.style.display = hasPass ? 'block' : 'none';
        if (passInp) passInp.value = '';
        let passLbl = document.getElementById('loginPassLabel');
        if (passLbl) passLbl.innerText = 'Введите ваш пароль:';

        document.getElementById('loginStep2').style.display = 'block';
    };

    window.confirmLoginUser = function() {
        let tab = appState.user.tab;
        let savedLocal = JSON.parse(localStorage.getItem('kkl_profile_' + tab) || 'null');
        let storedPass = appState.user.password || savedLocal?.password || '';

        if (storedPass) {
            let enteredPass = document.getElementById('loginPassInput').value.trim();
            if (enteredPass !== storedPass) return alert('Неверный пароль!');
            let merged = { ...(savedLocal || {}), ...appState.user, password: storedPass, completed: true };
            appState.user = merged;
            localStorage.setItem('kkl_profile', JSON.stringify(merged));
            if (merged.profileCompleted || savedLocal?.completed) showMainScreen(merged);
            else openRegistrationForUser(merged);
        } else {
            // Первый вход без пароля -> сразу в регистрацию, где сотрудник задает свой пароль
            openRegistrationForUser({ ...(savedLocal || {}), ...appState.user });
        }
    };

    // 3. Редактирование личной подписи в Профиле (при нажатии на карандаш ✏️)
    let pfSigImg = document.getElementById('pfSigImg');
    if (pfSigImg && !document.getElementById('pfSigEditWrap')) {
        let wrap = document.createElement('div');
        wrap.id = 'pfSigEditWrap';
        wrap.style.cssText = 'display:none;margin-top:8px;text-align:left;';
        wrap.innerHTML = `
            <div style="font-size:12px;color:#555;margin-bottom:4px;">Нарисуйте новую подпись (если нужно изменить):</div>
            <canvas id="pfSigCanvas" style="border:2px dashed #003366;background:#fafafa;width:100%;height:95px;cursor:crosshair;display:block;"></canvas>
            <button type="button" class="btn-danger" style="width:auto;padding:4px 10px;font-size:11px;margin-top:6px;" onclick="clearPfSignature()">Очистить подпись</button>
        `;
        pfSigImg.insertAdjacentElement('afterend', wrap);
    }

    const _origOpenProf13 = window.openProfileScreen;
    window.openProfileScreen = function() {
        if (typeof _origOpenProf13 === 'function') _origOpenProf13();
        let w = document.getElementById('pfSigEditWrap');
        if (w) w.style.display = 'none';
    };

    const _origEnableProf13 = window.enableProfileEdit;
    window.enableProfileEdit = function() {
        if (typeof _origEnableProf13 === 'function') _origEnableProf13();
        let w = document.getElementById('pfSigEditWrap');
        if (w) {
            w.style.display = 'block';
            setTimeout(() => { if (typeof initCanvas === 'function') initCanvas('pfSigCanvas'); }, 40);
        }
    };

    const _origSaveProf13 = window.saveProfileEdit;
    window.saveProfileEdit = function() {
        if (appState.user && typeof sigCtxMap !== 'undefined' && sigCtxMap['pfSigCanvas']) {
            let c = sigCtxMap['pfSigCanvas'].c;
            let blank = document.createElement('canvas');
            blank.width = c.width;
            blank.height = c.height;
            if (c.toDataURL() !== blank.toDataURL()) {
                appState.user.signature = c.toDataURL();
                let img = document.getElementById('pfSigImg');
                if (img) img.src = appState.user.signature;
            }
        }
        if (typeof _origSaveProf13 === 'function') _origSaveProf13();
        let w = document.getElementById('pfSigEditWrap');
        if (w) w.style.display = 'none';
    };
}

function clearPfSignature() {
    if (typeof sigCtxMap !== 'undefined' && sigCtxMap['pfSigCanvas']) {
        let s = sigCtxMap['pfSigCanvas'];
        s.ctx.clearRect(0, 0, s.c.width, s.c.height);
    }
}

window.addEventListener('load', () => {
    setTimeout(initStage13ProfileSigAndLogin, 2000);
});
// ============================================================
// === ГАЛОЧКИ СТАТУСА СООБЩЕНИЙ: ✓ ДОСТАВЛЕНО / ✓✓ ПРОЧИТАНО ===
// ============================================================
function injectStage13TickStyles() {
    if (document.getElementById('st13-tick-styles')) return;
    let st = document.createElement('style');
    st.id = 'st13-tick-styles';
    st.innerHTML = `
        .wa-ticks-delivered { color: #8696a0 !important; font-weight: bold; font-size: 12px; }
        .wa-ticks-read { color: #53bdeb !important; font-weight: bold; font-size: 12px; }
    `;
    document.head.appendChild(st);
}

function updateStage13MessageTicks() {
    let msgs = (typeof st7State !== 'undefined' && Array.isArray(st7State.activeChatMsgs))
        ? st7State.activeChatMsgs : [];
    if (!msgs.length) return;

    document.querySelectorAll('#chatMsgs .wa-bubble.out').forEach(bubble => {
        let tickEl = bubble.querySelector('.wa-ticks');
        if (!tickEl) return;

        let oc = bubble.getAttribute('oncontextmenu') || '';
        let match = oc.match(/openSt12MsgContextMenu\('([^']+)'\)/);
        if (!match) return;

        let m = msgs.find(x => x.id === match[1]);
        if (!m) return;

        let readBy = m.readBy || {};
        let isRead = Object.keys(readBy).some(tab => tab && tab !== m.tab);

        let targetText = isRead ? '✓✓' : '✓';
        let targetClass = isRead ? 'wa-ticks wa-ticks-read' : 'wa-ticks wa-ticks-delivered';
        let targetTitle = isRead ? 'Прочитано' : 'Доставлено';

        if (tickEl.innerText !== targetText) tickEl.innerText = targetText;
        if (tickEl.className !== targetClass) tickEl.className = targetClass;
        if (tickEl.title !== targetTitle) tickEl.title = targetTitle;
    });
}

function initStage13ReadTicks() {
    injectStage13TickStyles();
    let timer = null;
    const scheduleTicks = () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(updateStage13MessageTicks, 30);
    };

    const obs = new MutationObserver(scheduleTicks);
    obs.observe(document.body, { childList: true, subtree: true });
    updateStage13MessageTicks();
}

window.addEventListener('load', () => {
    setTimeout(initStage13ReadTicks, 2050);
});
// ============================================================
// === ПЕРЕХОД ПО ССЫЛКЕ ПРИГЛАШЕНИЯ -> ВСЕГДА ЭКРАН ВХОДА  ===
// ============================================================
(function handleInviteLinkEarly() {
    let params = new URLSearchParams(window.location.search);
    if (params.get('invite') === '1') {
        // Сбрасываем авто-вход, чтобы всегда открылся начальный экран (№ таб. и фамилия)
        localStorage.removeItem('kkl_profile');
        if (window.history && window.history.replaceState) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        window.addEventListener('load', () => {
            setTimeout(() => {
                if (typeof hideAllScreens === 'function') hideAllScreens();
                let menuBtn = document.getElementById('menuBtn');
                let bellBtn = document.getElementById('bellBtn');
                if (menuBtn) menuBtn.style.display = 'none';
                if (bellBtn) bellBtn.style.display = 'none';

                let loginScr = document.getElementById('login-screen');
                if (loginScr) loginScr.classList.add('active-screen');
                if (typeof resetLogin === 'function') resetLogin();

                let tabInp = document.getElementById('loginTab');
                let lastInp = document.getElementById('loginLast');
                if (tabInp) tabInp.value = '';
                if (lastInp) lastInp.value = '';
            }, 1850);
        });
    }
})();

window.addEventListener('load', () => {
    setTimeout(() => {
        // Обновляем функцию приглашения, чтобы ссылка всегда шла с ?invite=1
        window.sendAppInvite = async function(name, tel) {
            let url = window.location.origin + window.location.pathname + '?invite=1';
            let text = `Привет, ${name || 'коллега'}! Подключайся к приложению «Ласточка МТППК»: ${url}`;
            if (navigator.share) {
                try { await navigator.share({ title: 'Ласточка МТППК', text, url }); return; } catch (e) {}
            }
            if (tel) {
                window.open(`sms:${tel.replace(/[^\d+]/g, '')}?body=${encodeURIComponent(text)}`, '_blank');
            } else if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
                alert("Ссылка-приглашение скопирована! Отправьте её другу.");
            } else {
                prompt("Скопируйте приглашение:", text);
            }
        };
    }, 2100);
});
// ============================================================
// === СТАТУС «В СЕТИ» ПО УСТРОЙСТВУ: СИНИЙ — ТЕЛЕФОН,      ===
// === ЗЕЛЁНЫЙ — КОМПЬЮТЕР, БЕЗ КРУЖКА — НЕ В СЕТИ          ===
// ============================================================
(function initStage13DevicePresence() {
    if (!document.getElementById('st13-device-dot-styles')) {
        let st = document.createElement('style');
        st.id = 'st13-device-dot-styles';
        st.innerHTML = `
            .wa-online-green-dot {
                background: #22c55e !important;
                box-shadow: 0 0 4px rgba(34, 197, 94, 0.85) !important;
            }
        `;
        document.head.appendChild(st);
    }

    function detectSt13Device() {
        let ua = navigator.userAgent || '';
        let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua)
            || (window.matchMedia && window.matchMedia('(max-width: 768px)').matches && ('ontouchstart' in window || navigator.maxTouchPoints > 0));
        return isMobile ? 'mobile' : 'desktop';
    }

    // Отправляем в Firebase не только статус онлайн, но и тип устройства (mobile / desktop)
    window.sendOnlineHeartbeat = function(isOnline) {
        let tab = getSt13CurrentTab();
        if (!tab || typeof db === 'undefined' || !db) return;
        db.collection('workers').doc(tab).set({
            online: !!isOnline,
            device: detectSt13Device(),
            lastSeen: Date.now()
        }, { merge: true }).catch(() => {});
    };

    function setDeviceDotOnAvatar(avatarEl, worker) {
        if (!avatarEl) return;
        let isOnline = isWorkerOnlineSt13(worker);
        let existing = avatarEl.querySelector('.wa-online-blue-dot');

        if (!isOnline) {
            if (existing) existing.remove();
            return;
        }

        let isDesktop = worker?.device === 'desktop';
        let dot = existing;
        if (!dot) {
            dot = document.createElement('span');
            avatarEl.appendChild(dot);
        }
        dot.className = isDesktop ? 'wa-online-blue-dot wa-online-green-dot' : 'wa-online-blue-dot';
        dot.title = isDesktop ? 'В сети (компьютер)' : 'В сети (телефон)';
    }

    window.decorateOnlineBlueDots = function() {
        let workers = appState?.workers || [];
        const findW = tab => workers.find(w => w.tab === tab);

        // 1. Список личных чатов слева
        document.querySelectorAll('#cloudChatListBox .wa-chat-row').forEach(row => {
            let oc = row.getAttribute('onclick') || '';
            let m = oc.match(/openCloudChat\('([^']+)'\)/);
            if (!m) return;
            let c = (cloudChatsList || []).find(x => x.id === m[1]);
            let av = row.querySelector('.wa-avatar');
            if (!c || c.isGroup !== false) { setDeviceDotOnAvatar(av, null); return; }
            let meta = typeof getChatDisplayMeta === 'function' ? getChatDisplayMeta(c) : null;
            setDeviceDotOnAvatar(av, meta?.peerTab ? findW(meta.peerTab) : null);
        });

        // 2. Шапка открытого личного чата (кружок + текстовый статус)
        let headerAv = document.getElementById('waHeaderAvatar');
        let headerSub = document.getElementById('waHeaderSub');
        if (headerAv && typeof activeChatId !== 'undefined') {
            let c = (cloudChatsList || []).find(x => x.id === activeChatId);
            if (c && c.isGroup === false && typeof getChatDisplayMeta === 'function') {
                let meta = getChatDisplayMeta(c);
                let peerW = meta?.peerTab ? findW(meta.peerTab) : null;
                setDeviceDotOnAvatar(headerAv, peerW);
                if (headerSub) {
                    if (isWorkerOnlineSt13(peerW)) {
                        headerSub.innerText = peerW?.device === 'desktop'
                            ? 'в сети (компьютер) · инфо'
                            : 'в сети (телефон) · инфо';
                    } else {
                        headerSub.innerText = 'не в сети · инфо';
                    }
                }
            } else {
                setDeviceDotOnAvatar(headerAv, null);
            }
        }

        // 3. Мини-аватарки в сообщениях группового чата
        document.querySelectorAll('#chatMsgs .wa-msg-mini-av').forEach(av => {
            let oc = av.getAttribute('onclick') || '';
            let m = oc.match(/openSt12UserProfilePopup\('([^']+)'\)/);
            if (!m) return;
            setDeviceDotOnAvatar(av, findW(m[1]));
        });

        // 4. Список участников в карточке группы
        document.querySelectorAll('#waInfoModalBody .st12-member-row').forEach(row => {
            let oc = row.getAttribute('onclick') || '';
            let m = oc.match(/onSt12GroupMemberClick\('([^']+)'\)/);
            if (!m) return;
            setDeviceDotOnAvatar(row.querySelector('.wa-avatar'), findW(m[1]));
        });

        // 5. Карточка профиля сотрудника при клике на ФИО
        let popAv = document.getElementById('st12PopAv');
        if (popAv && st13State.lastPopupTab) {
            setDeviceDotOnAvatar(popAv, findW(st13State.lastPopupTab));
        }
    };
})();
