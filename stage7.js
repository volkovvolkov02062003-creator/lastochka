// ============================================================
// === ЭТАП 7: ВИДЕО/ГОЛОСОВЫЕ, КОНТАКТЫ, КАМЕРА СТАТУСА,   ===
// === АВАТАРКИ/ПРИВАТНОСТЬ, СИНХРОН УСТРОЙСТВ И ПРОФИЛЬ ГУО ===
// ============================================================

let st7State = {
    mediaRecorder: null,
    audioChunks: [],
    isRecording: false,
    recTimer: null,
    recSec: 0,
    camStream: null,
    statusCapturedImg: "",
    activeChatMsgs: [],
    lastLocalShiftSyncTs: 0,
    activeShiftUnsub: null,
    ownProfileUnsub: null,
    guoTargetWorkerTab: null
};

window.addEventListener('load', () => {
    injectStage7Styles();
    injectStage7Modals();
    upgradeProfileAndOrgForStage7();
    setTimeout(() => {
        initStage7CrossDeviceSync();
        patchStage7GuoDashboard();
    }, 800);
});

// ============================================================
// === СТИЛИ ЭТАПА 7 ===
// ============================================================
function injectStage7Styles() {
    if (document.getElementById('st7-styles')) return;
    let st = document.createElement('style');
    st.id = 'st7-styles';
    st.innerHTML = `
        .wa-avatar-img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block; }
        .wa-audio-attach { width: 220px; max-width: 100%; height: 36px; margin-top: 4px; }
        .wa-video-attach { max-width: 260px; max-height: 220px; border-radius: 8px; display: block; margin: 4px 0; background: #000; }
        .wa-rec-btn.recording { background: #dc3545 !important; color: #fff !important; animation: waPulse 1s infinite; }
        @keyframes waPulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }

        /* КАМЕРА СТАТУСА */
        .cam-modal { display: none; position: fixed; inset: 0; background: #000; z-index: 4000; flex-direction: column; justify-content: space-between; color: #fff; }
        .cam-top { padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.5); z-index: 2; }
        .cam-stage { flex: 1; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #111; }
        .cam-stage video, .cam-stage img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .cam-bottom { padding: 14px 20px 26px; background: rgba(0,0,0,0.75); display: flex; flex-direction: column; gap: 12px; z-index: 2; }
        .cam-caption { width: 100%; padding: 10px 14px; border-radius: 22px; border: 1px solid #444; background: #222; color: #fff; font-size: 14px; box-sizing: border-box; outline: none; }
        .cam-controls { display: flex; justify-content: space-around; align-items: center; }
        .cam-side-btn { width: 50px !important; height: 50px; border-radius: 50%; background: rgba(255,255,255,0.18); color: #fff; font-size: 22px; margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; }
        .cam-shutter { width: 68px !important; height: 68px; border-radius: 50%; background: #fff; border: 5px solid rgba(255,255,255,0.45); margin: 0; padding: 0; cursor: pointer; }
        .cam-send-arrow { width: 54px !important; height: 54px; border-radius: 50%; background: #00a884; color: #fff; font-size: 24px; margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; }

        /* ПРОСМОТР СТАТУСА */
        .st-view-modal { display: none; position: fixed; inset: 0; background: #0b141a; z-index: 4100; flex-direction: column; color: #fff; }
        .st-view-bar { padding: 14px 18px; display: flex; align-items: center; gap: 12px; background: rgba(0,0,0,0.6); }
        .st-view-body { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 16px; text-align: center; overflow: auto; }
        .st-view-body img { max-width: 100%; max-height: 70vh; border-radius: 10px; margin-bottom: 12px; }

        /* СЕТКА МЕДИА В КАРТОЧКЕ ГРУППЫ */
        .wa-media-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-top: 8px; max-height: 220px; overflow-y: auto; }
        .wa-media-thumb { width: 100%; height: 80px; object-fit: cover; border-radius: 6px; cursor: pointer; border: 1px solid #ddd; }

        /* КНОПКА ГУО */
        .guo-main-btn { background: linear-gradient(135deg, #003366, #0066cc) !important; color: #fff; font-size: 20px !important; padding: 26px 20px !important; border-radius: 12px !important; box-shadow: 0 6px 18px rgba(0,51,102,0.35); margin: 20px 0 !important; }
    `;
    document.head.appendChild(st);
}

// ============================================================
// === УТИЛИТА СЖАТИЯ ФОТО (ДЛЯ АВАТАРОК И СТАТУСОВ) ===
// ============================================================
function compressImageFile(file, maxW, quality, cb) {
    let reader = new FileReader();
    reader.onload = ev => {
        let img = new Image();
        img.onload = () => {
            let c = document.createElement('canvas');
            let scale = Math.min(1, maxW / img.width);
            c.width = Math.round(img.width * scale);
            c.height = Math.round(img.height * scale);
            c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
            cb(c.toDataURL('image/jpeg', quality));
        };
        img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
}

function renderAvatarInner(photo, fallbackText) {
    if (photo && photo.startsWith('data:image')) {
        return `<img src="${photo}" class="wa-avatar-img">`;
    }
    return escapeHtmlStage6(fallbackText || 'Ч');
}

// ============================================================
// === 1. ПРОФИЛЬ: ЗАГРУЗКА ФОТО + ПОЛЕ ТЕЛЕФОНА + РОЛЬ ГУО ===
// ============================================================
function upgradeProfileAndOrgForStage7() {
    // Добавляем роль "Оператор ГУО" в список ролей должностей
    let roleSel = document.getElementById('posRoleInput');
    if (roleSel && !roleSel.querySelector('option[value="guo"]')) {
        let opt = document.createElement('option');
        opt.value = 'guo';
        opt.innerText = 'Оператор ГУО';
        roleSel.appendChild(opt);
    }
    if (typeof positionsDb !== 'undefined' && !positionsDb.some(p => p.role === 'guo')) {
        positionsDb.push({ id: "pos_guo", name: "Оператор ГУО", role: "guo", perms: [...allPermKeys] });
    }

    // Добавляем аватарку и поле "Телефон" в экран Профиля
    let profCard = document.querySelector('#profile-screen .card');
    if (profCard && !document.getElementById('pfAvatarWrap')) {
        let h2 = profCard.querySelector('h2');
        let avBlock = document.createElement('div');
        avBlock.id = 'pfAvatarWrap';
        avBlock.style.cssText = 'display:flex;flex-direction:column;align-items:center;margin-bottom:14px;';
        avBlock.innerHTML = `
            <div id="pfAvatarCircle" onclick="document.getElementById('pfAvatarFile').click()" title="Нажмите, чтобы загрузить фото профиля"
                style="width:86px;height:86px;border-radius:50%;background:#003366;color:#fff;font-size:28px;font-weight:bold;display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;border:3px solid #00a884;box-shadow:0 3px 10px rgba(0,0,0,0.2);">👤</div>
            <input type="file" id="pfAvatarFile" accept="image/*" style="display:none;" onchange="handleProfileAvatarUpload(event)">
            <button type="button" class="btn-action" style="width:auto;margin-top:6px;padding:5px 12px;font-size:12px;" onclick="document.getElementById('pfAvatarFile').click()">📷 Загрузить фото профиля</button>
        `;
        h2.insertAdjacentElement('afterend', avBlock);

        let pfPass = document.getElementById('pfPass');
        if (pfPass) {
            let phoneWrap = document.createElement('div');
            phoneWrap.className = 'form-group';
            phoneWrap.innerHTML = `<label>Номер телефона:</label><input type="tel" id="pfPhone" class="form-input pf-editable" placeholder="+7 (999) 000-00-00" disabled>`;
            pfPass.closest('.form-row').insertAdjacentElement('afterend', phoneWrap);
        }
    }

    const _origOpenProf = window.openProfileScreen;
    window.openProfileScreen = function() {
        if (typeof _origOpenProf === 'function') _origOpenProf();
        let u = appState.user || {};
        let phoneEl = document.getElementById('pfPhone');
        if (phoneEl) phoneEl.value = u.phone || '';
        let avEl = document.getElementById('pfAvatarCircle');
        if (avEl) {
            let init = (u.fio || 'С').split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase();
            avEl.innerHTML = renderAvatarInner(u.avatar, init);
        }
    };

    const _origSaveProf = window.saveProfileEdit;
    window.saveProfileEdit = function() {
        if (appState.user && document.getElementById('pfPhone')) {
            appState.user.phone = document.getElementById('pfPhone').value.trim();
        }
        if (typeof _origSaveProf === 'function') _origSaveProf();
    };
}

function handleProfileAvatarUpload(e) {
    let f = e.target.files[0]; if (!f || !appState.user) return;
    compressImageFile(f, 220, 0.72, dataUrl => {
        appState.user.avatar = dataUrl;
        localStorage.setItem('kkl_profile', JSON.stringify(appState.user));
        localStorage.setItem('kkl_profile_' + appState.user.tab, JSON.stringify(appState.user));
        if (db) db.collection('workers').doc(appState.user.tab).set({ avatar: dataUrl }, { merge: true }).catch(()=>{});
        let avEl = document.getElementById('pfAvatarCircle');
        if (avEl) avEl.innerHTML = renderAvatarInner(dataUrl, '');
        showSyncToast('☁️ Фото профиля обновлено на всех устройствах');
    });
    e.target.value = '';
}

// ============================================================
// === 2. ПОЛНАЯ СИНХРОНИЗАЦИЯ ДАННЫХ МЕЖДУ УСТРОЙСТВАМИ ===
// ============================================================
function initStage7CrossDeviceSync() {
    if (typeof db === 'undefined' || !db) return;

    // Перехватываем persistActiveShift, чтобы отправлять смену и ФДУ в облако
    const _origPersist = window.persistActiveShift;
    window.persistActiveShift = function() {
        if (typeof _origPersist === 'function') _origPersist();
        let tab = appState.user?.tab;
        if (!tab || !db) return;
        let snap = JSON.parse(localStorage.getItem('kkl_active_shift_v4') || 'null');
        if (snap) {
            st7State.lastLocalShiftSyncTs = Date.now();
            snap.ts = st7State.lastLocalShiftSyncTs;
            snap.tab = tab;
            db.collection('active_shifts').doc(tab).set(snap).catch(() => {});
        }
    };

    const subscribeUserCloudData = () => {
        let tab = appState.user?.tab;
        if (!tab || !db) return;

        // 1) Подписка на активную смену и ФДУ с других устройств
        if (st7State.activeShiftUnsub) st7State.activeShiftUnsub();
        st7State.activeShiftUnsub = db.collection('active_shifts').doc(tab).onSnapshot(doc => {
            if (!doc.exists) return;
            let data = doc.data();
            if (data.ts && data.ts > st7State.lastLocalShiftSyncTs) {
                st7State.lastLocalShiftSyncTs = data.ts;
                localStorage.setItem('kkl_active_shift_v4', JSON.stringify(data));
                if (typeof restoreActiveShift === 'function') restoreActiveShift();
            }
        });

        // 2) Подписка на обновления собственного профиля (аватар, телефон, должность, роль)
        if (st7State.ownProfileUnsub) st7State.ownProfileUnsub();
        st7State.ownProfileUnsub = db.collection('workers').doc(tab).onSnapshot(doc => {
            if (!doc.exists) return;
            let w = doc.data();
            appState.user = { ...appState.user, ...w, completed: true };
            localStorage.setItem('kkl_profile', JSON.stringify(appState.user));
            localStorage.setItem('kkl_profile_' + tab, JSON.stringify(appState.user));
            applyGuoMainScreenMode();
        });
    };

    subscribeUserCloudData();
    const _origShowMain7 = window.showMainScreen;
    window.showMainScreen = function(u) {
        if (typeof _origShowMain7 === 'function') _origShowMain7(u);
        subscribeUserCloudData();
        applyGuoMainScreenMode();
    };
}

// ============================================================
// === 3. ЧАТЫ WHATSAPP: ВИДЕО, ГОЛОСОВЫЕ, ПРИВАТНОСТЬ,     ===
// ===    КАМЕРА СТАТУСА, КОНТАКТЫ И КАРТОЧКА АВАТАРКИ      ===
// ============================================================
function getChatDisplayMeta(c) {
    let myTab = appState.user?.tab || '';
    if (c.isGroup) {
        return { name: c.name, avatarText: c.avatar || 'Г', photo: c.photo || '', isGroup: true, peerTab: null };
    }
    // Для личного чата 1-на-1 показываем имя и фото СОБЕСЕДНИКА
    let peerTab = (c.participants || []).find(t => t !== myTab) || null;
    if (!peerTab && c.id && c.id.startsWith('dm_')) {
        peerTab = c.id.replace('dm_', '').split('_').find(t => t !== myTab) || null;
    }
    let peerW = (appState.workers || []).find(w => w.tab === peerTab);
    let name = peerW?.fio || c.participantNames?.[peerTab] || c.name || 'Собеседник';
    let init = name.split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase();
    return { name, avatarText: init, photo: peerW?.avatar || '', isGroup: false, peerTab, peerWorker: peerW };
}

function isChatVisibleToMe(c) {
    if (c.isGroup !== false) return true; // Группы видны
    let myTab = appState.user?.tab || '';
    if (!myTab) return false;
    if (Array.isArray(c.participants)) return c.participants.includes(myTab);
    return (c.id || '').split('_').includes(myTab);
}

// Переопределяем рендер чатов с поддержкой фото-аватарок, 🎤, 🎬 и кликабельной аватарки
window.renderCloudChatsLayout = function() {
    let scr = document.getElementById('chats-screen');
    if (!scr) return;
    let visibleChats = cloudChatsList.filter(isChatVisibleToMe);
    let activeObj = visibleChats.find(c => c.id === activeChatId) || visibleChats[0];
    if (activeObj) activeChatId = activeObj.id;
    let meta = activeObj ? getChatDisplayMeta(activeObj) : { name: 'Чат', avatarText: 'Ч', photo: '', isGroup: true };

    scr.innerHTML = `
        <div class="wa-app ${waState.mobileChatOpen ? 'mobile-chat-open' : ''}" id="waAppRoot">
            <div class="wa-rail">
                <button class="wa-rail-btn ${waState.tab==='chats'?'active':''}" onclick="switchWaTab('chats')" title="Чаты">💬</button>
                <button class="wa-rail-btn ${waState.tab==='updates'?'active':''}" onclick="switchWaTab('updates')" title="Актуальное (Статусы)">⭕</button>
                <div style="flex:1;"></div>
                <button class="wa-rail-btn" onclick="openContactsInviteModal()" title="Найти друзей из телефонной книги">👥</button>
                <button class="wa-rail-btn" onclick="backToMain()" title="Назад в Ласточку">🏠</button>
            </div>

            <div class="wa-sidebar">
                <div class="wa-side-header">
                    <h3 id="waSideTitle">${waState.tab === 'chats' ? 'Чаты' : 'Актуальное'}</h3>
                    <div>
                        ${waState.tab === 'chats'
                            ? `<button class="wa-icon-btn" onclick="openContactsInviteModal()" title="Телефонная книга и приглашения">📱</button>
                               <button class="wa-icon-btn" onclick="openWaNewChatMenu()" title="Новый чат или группа">📝</button>`
                            : `<button class="wa-icon-btn" onclick="openWaStatusCamera()" title="Камера для статуса">📷</button>`}
                    </div>
                </div>
                <div class="wa-search-wrap" style="display:${waState.tab==='chats'?'block':'none'};">
                    <div class="wa-search-box">
                        <span>🔍</span>
                        <input type="text" id="waSearchInp" placeholder="Поиск или новый чат" value="${escapeHtmlStage6(waState.searchQuery)}" oninput="waState.searchQuery=this.value;renderChatSidebarList()">
                    </div>
                </div>
                <div class="wa-filters" style="display:${waState.tab==='chats'?'flex':'none'};">
                    <button class="wa-pill ${waState.filter==='all'?'active':''}" onclick="setWaFilter('all')">Все</button>
                    <button class="wa-pill ${waState.filter==='unread'?'active':''}" onclick="setWaFilter('unread')">Непрочитанные</button>
                    <button class="wa-pill ${waState.filter==='groups'?'active':''}" onclick="setWaFilter('groups')">Группы</button>
                </div>
                <div class="wa-list" id="cloudChatListBox"></div>
            </div>

            <div class="wa-main">
                <div class="wa-main-header">
                    <button class="wa-back-mobile" onclick="closeWaMobileChat()">←</button>
                    <div class="wa-avatar ${meta.isGroup?'group':''}" id="waHeaderAvatar" onclick="openWaChatInfoModal()" title="Информация о контакте / группе"
                        style="width:42px;height:42px;min-width:42px;font-size:14px;cursor:pointer;overflow:hidden;">${renderAvatarInner(meta.photo, meta.avatarText)}</div>
                    <div style="flex:1;min-width:0;cursor:pointer;" onclick="openWaChatInfoModal()">
                        <div id="chatActiveName" style="font-weight:600;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtmlStage6(meta.name)}</div>
                        <div id="waHeaderSub" style="font-size:12px;color:#667781;">${meta.isGroup ? 'нажмите на аватарку для инфо о группе' : 'личный чат (приватно) · инфо'}</div>
                    </div>
                    <button class="wa-icon-btn" onclick="toggleWaMsgSearch()" title="Поиск по сообщениям">🔍</button>
                </div>

                <div class="wa-msg-search-bar" id="waMsgSearchBar">
                    <div class="wa-search-box"><span>🔍</span><input type="text" id="waMsgSearchInp" placeholder="Поиск сообщений..." oninput="waState.msgSearchQuery=this.value;subscribeToChatMessages(activeChatId)"></div>
                </div>

                <div class="wa-messages" id="chatMsgs"></div>

                <div class="wa-reply-bar" id="waReplyBar">
                    <div style="border-left:3px solid #00a884;padding-left:8px;min-width:0;flex:1;">
                        <div id="waReplySender" style="font-size:12px;font-weight:bold;color:#008069;"></div>
                        <div id="waReplyText" style="font-size:12px;color:#54656f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></div>
                    </div>
                    <button class="wa-icon-btn" onclick="cancelWaReply()">✕</button>
                </div>

                <div class="wa-emoji-bar" id="waEmojiBar">
                    ${waQuickEmojis.map(em => `<span class="wa-emoji-item" onclick="insertWaEmoji('${em}')">${em}</span>`).join('')}
                </div>

                <div class="wa-composer">
                    <button class="wa-icon-btn" onclick="toggleWaEmoji()" title="Эмодзи">😊</button>
                    <button class="wa-icon-btn" onclick="document.getElementById('waMediaAttach').click()" title="Фото или Видео">📎</button>
                    <input type="file" id="waMediaAttach" accept="image/*,video/*" style="display:none;" onchange="handleWaMediaAttach(event)">
                    <input type="text" id="chatInput" placeholder="Введите сообщение" onkeydown="if(event.key==='Enter') sendMsg()">
                    <button id="waVoiceBtn" class="wa-icon-btn wa-rec-btn" onclick="toggleWaVoiceRecord()" title="Голосовое сообщение">🎤</button>
                    <button class="wa-send-btn" onclick="sendMsg()" title="Отправить">➤</button>
                </div>
            </div>
        </div>
    `;
    renderChatSidebarList();
    if (activeChatId) subscribeToChatMessages(activeChatId);
};

// Обновленный список чатов и статусов (с приватностью и камерой)
window.renderChatSidebarList = function() {
    let box = document.getElementById('cloudChatListBox');
    if (!box) return;

    if (waState.tab === 'updates') {
        let u = appState.user || {};
        let myInit = (u.fio || 'Я').split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase();
        let myLatest = cloudStatusesList.find(s => s.tab === u.tab);
        let html = `
            <div class="wa-chat-row" onclick="openWaStatusCamera()">
                <div class="wa-status-ring"><div class="wa-avatar" style="overflow:hidden;">${renderAvatarInner(u.avatar, myInit)}</div></div>
                <div class="wa-row-body">
                    <div class="wa-row-name">Мой статус</div>
                    <div class="wa-row-preview">${myLatest ? 'Нажмите, чтобы снять/выбрать фото' : 'Нажмите, чтобы открыть камеру'}</div>
                </div>
                ${myLatest ? `<button class="wa-pill active" onclick="event.stopPropagation();viewWaStatus('${myLatest.id}')">Смотреть</button>` : ''}
            </div>
            <div style="padding:10px 14px 4px;font-size:12px;font-weight:bold;color:#008069;">НЕДАВНИЕ ОБНОВЛЕНИЯ</div>
        `;
        html += cloudStatusesList.length === 0
            ? '<div style="padding:16px;font-size:13px;color:#667781;text-align:center;">Статусов пока нет</div>'
            : cloudStatusesList.map(st => `
                <div class="wa-chat-row" onclick="viewWaStatus('${st.id}')">
                    <div class="wa-status-ring"><div class="wa-avatar" style="overflow:hidden;">${renderAvatarInner(st.img || st.avatarImg, st.avatar || 'К')}</div></div>
                    <div class="wa-row-body">
                        <div class="wa-row-top"><span class="wa-row-name">${escapeHtmlStage6(st.sender)}</span><span class="wa-row-time">${st.time || ''}</span></div>
                        <div class="wa-row-preview">${st.img ? '📷 ' : ''}${escapeHtmlStage6(st.text || 'Фото-статус')}</div>
                    </div>
                </div>
            `).join('');
        box.innerHTML = html;
        return;
    }

    let q = (waState.searchQuery || '').trim().toLowerCase();
    let list = cloudChatsList.filter(isChatVisibleToMe).filter(c => {
        let meta = getChatDisplayMeta(c);
        if (q && !meta.name.toLowerCase().includes(q)) return false;
        if (waState.filter === 'groups' && !meta.isGroup) return false;
        if (waState.filter === 'unread') {
            let lastRead = waState.readTimestamps[c.id] || 0;
            if (!c.lastTs || c.lastTs <= lastRead) return false;
        }
        return true;
    });

    box.innerHTML = list.length === 0
        ? '<div style="padding:20px;text-align:center;color:#667781;font-size:13px;">Чаты не найдены</div>'
        : list.map(c => {
            let meta = getChatDisplayMeta(c);
            let lastRead = waState.readTimestamps[c.id] || 0;
            let hasUnread = c.lastTs && c.lastTs > lastRead && c.id !== activeChatId;
            return `
                <div class="wa-chat-row ${c.id === activeChatId ? 'active' : ''}" onclick="openCloudChat('${c.id}')">
                    <div class="wa-avatar ${meta.isGroup?'group':''}" style="overflow:hidden;">${renderAvatarInner(meta.photo, meta.avatarText)}</div>
                    <div class="wa-row-body">
                        <div class="wa-row-top">
                            <span class="wa-row-name">${escapeHtmlStage6(meta.name)}</span>
                            <span class="wa-row-time" style="${hasUnread?'color:#25d366;font-weight:bold;':''}">${c.lastTime || ''}</span>
                        </div>
                        <div class="wa-row-bottom">
                            <span class="wa-row-preview">${escapeHtmlStage6(c.lastText || 'Нет сообщений')}</span>
                            ${hasUnread ? '<span class="wa-unread-dot">1</span>' : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
};

// Переопределяем openCloudChat для обновления фото-аватарки в шапке
window.openCloudChat = function(chatId) {
    activeChatId = chatId;
    waState.mobileChatOpen = true;
    waState.readTimestamps[chatId] = Date.now();
    localStorage.setItem("wa_read_ts", JSON.stringify(waState.readTimestamps));
    let root = document.getElementById('waAppRoot');
    if (root) root.classList.add('mobile-chat-open');

    let c = cloudChatsList.find(x => x.id === chatId);
    if (c) {
        let meta = getChatDisplayMeta(c);
        let tEl = document.getElementById('chatActiveName');
        let sEl = document.getElementById('waHeaderSub');
        let aEl = document.getElementById('waHeaderAvatar');
        if (tEl) tEl.innerText = meta.name;
        if (sEl) sEl.innerText = meta.isGroup ? 'нажмите на аватарку для инфо о группе' : 'личный чат (приватно) · инфо';
        if (aEl) aEl.innerHTML = renderAvatarInner(meta.photo, meta.avatarText);
    }
    cancelWaReply();
    renderChatSidebarList();
    subscribeToChatMessages(chatId);
};
window.openChat = window.openCloudChat;

// Приватный личный чат 1-на-1 с participants
window.openWaNewChatMenu = function() {
    let choice = prompt("1 — Создать новую группу\n2 — Написать коллеге лично (1 на 1, приватно)\n3 — Найти друзей из телефонной книги и пригласить\n\nВведите 1, 2 или 3:", "2");
    if (choice === '1') createNewCloudChat();
    else if (choice === '3') openContactsInviteModal();
    else if (choice === '2') {
        let q = prompt("Введите фамилию или табельный номер коллеги:");
        if (!q) return;
        let w = (appState.workers || []).find(x => x.tab === q.trim() || x.fio.toLowerCase().includes(q.trim().toLowerCase()));
        if (!w) return alert("Сотрудник не найден в базе!");
        startPrivateDmWithWorker(w);
    }
};

function startPrivateDmWithWorker(w) {
    let myTab = appState.user?.tab || '0';
    let myFio = appState.user?.fio || 'Я';
    let pair = [myTab, w.tab].sort();
    let pairId = 'dm_' + pair.join('_');
    let ex = cloudChatsList.find(c => c.id === pairId);
    if (!ex) {
        let obj = {
            id: pairId,
            name: w.fio,
            isGroup: false,
            participants: pair,
            participantNames: { [myTab]: myFio, [w.tab]: w.fio },
            lastText: "Приватный чат открыт",
            lastTime: "",
            lastTs: Date.now()
        };
        if (db) db.collection('chats').doc(pairId).set(obj);
        else cloudChatsList.unshift(obj);
    }
    openCloudChat(pairId);
}

// Сообщения с поддержкой ФОТО + ВИДЕО + ГОЛОСОВЫХ
window.subscribeToChatMessages = function(chatId) {
    let msgsBox = document.getElementById('chatMsgs');
    if (!msgsBox) return;
    if (activeChatUnsub) { activeChatUnsub(); activeChatUnsub = null; }
    if (typeof db === 'undefined' || !db) return;

    activeChatUnsub = db.collection('chat_messages')
        .where('chatId', '==', chatId)
        .onSnapshot(snap => {
            let list = [];
            snap.forEach(d => list.push(d.data()));
            list.sort((a, b) => (a.ts || 0) - (b.ts || 0));
            st7State.activeChatMsgs = list;

            let mq = (waState.msgSearchQuery || '').trim().toLowerCase();
            if (mq) list = list.filter(m => (m.text || '').toLowerCase().includes(mq) || (m.sender || '').toLowerCase().includes(mq));

            let myTab = appState.user?.tab || '';
            if (list.length === 0) {
                msgsBox.innerHTML = '<div class="wa-date-pill">Сообщений пока нет. Напишите первым!</div>';
                return;
            }

            let html = '', lastDate = '';
            list.forEach(m => {
                let dStr = m.date || new Date(m.ts || Date.now()).toLocaleDateString('ru-RU');
                if (dStr !== lastDate) { html += `<div class="wa-date-pill">${dStr}</div>`; lastDate = dStr; }
                let isMine = m.tab === myTab;
                let quoteHtml = m.replyTo ? `<div class="wa-quote"><strong style="color:#008069;">${escapeHtmlStage6(m.replyTo.sender)}</strong><br>${escapeHtmlStage6(m.replyTo.text)}</div>` : '';
                let imgHtml = m.img ? `<img src="${m.img}" class="wa-img-attach" onclick="event.stopPropagation();window.open(this.src,'_blank')">` : '';
                let videoHtml = m.video ? `<video controls playsinline src="${m.video}" class="wa-video-attach" onclick="event.stopPropagation()"></video>` : '';
                let audioHtml = m.audio ? `<audio controls src="${m.audio}" class="wa-audio-attach" onclick="event.stopPropagation()"></audio>` : '';
                let previewFallback = m.img ? '📷 Фото' : (m.video ? '🎬 Видео' : (m.audio ? '🎤 Голосовое' : ''));
                let safeSender = escapeHtmlStage6(m.sender || 'Коллега').replace(/'/g, "\\'");
                let safeText = escapeHtmlStage6(m.text || previewFallback).replace(/'/g, "\\'");

                html += `
                    <div class="wa-bubble ${isMine ? 'out' : 'in'}" onclick="setWaReply('${safeSender}','${safeText}')" title="Нажмите, чтобы ответить">
                        ${!isMine ? `<div class="wa-sender">${escapeHtmlStage6(m.sender || 'Коллега')}</div>` : ''}
                        ${quoteHtml}${imgHtml}${videoHtml}${audioHtml}
                        ${m.text ? `<div>${escapeHtmlStage6(m.text)}</div>` : ''}
                        <div class="wa-meta"><span>${m.time || ''}</span>${isMine ? '<span class="wa-ticks">✓✓</span>' : ''}</div>
                    </div>
                `;
            });
            msgsBox.innerHTML = html;
            msgsBox.scrollTop = msgsBox.scrollHeight;
            waState.readTimestamps[chatId] = Date.now();
            localStorage.setItem("wa_read_ts", JSON.stringify(waState.readTimestamps));
        });
};

function sendWaRichMessage({ text = '', img = '', video = '', audio = '' }) {
    let now = new Date();
    let timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    let dateStr = now.toLocaleDateString('ru-RU');
    let ts = Date.now();

    let msgObj = {
        id: 'msg_' + ts + '_' + Math.floor(Math.random() * 1000),
        chatId: activeChatId,
        tab: appState.user?.tab || 'unknown',
        sender: appState.user?.fio || 'Сотрудник',
        text, img, video, audio,
        replyTo: waState.replyTo || null,
        time: timeStr, date: dateStr, ts
    };
    cancelWaReply();
    if (waState.emojiOpen) toggleWaEmoji();

    let preview = img ? '📷 Фото' : (video ? '🎬 Видео' : (audio ? '🎤 Голосовое сообщение' : text));
    if (db) {
        db.collection('chat_messages').doc(msgObj.id).set(msgObj).catch(err => alert("Ошибка отправки (возможно, файл слишком большой): " + err.message));
        db.collection('chats').doc(activeChatId).set({ lastText: preview, lastTime: timeStr, lastTs: ts }, { merge: true }).catch(() => {});
    }
}

window.sendMsg = function() {
    let inp = document.getElementById('chatInput');
    if (!inp || !inp.value.trim()) return;
    let t = inp.value.trim(); inp.value = '';
    sendWaRichMessage({ text: t });
};

// Прикрепление ФОТО или ВИДЕО
function handleWaMediaAttach(e) {
    let f = e.target.files[0]; if (!f) return;
    if (f.type.startsWith('image/')) {
        compressImageFile(f, 640, 0.68, dataUrl => sendWaRichMessage({ img: dataUrl }));
    } else if (f.type.startsWith('video/')) {
        if (f.size > 750 * 1024) {
            alert("Видео больше 750 КБ — база Firebase не примет такой тяжелый файл. Пожалуйста, выберите короткий ролик до 750 КБ.");
            e.target.value = '';
            return;
        }
        let r = new FileReader();
        r.onload = ev => sendWaRichMessage({ video: ev.target.result });
        r.readAsDataURL(f);
    }
    e.target.value = '';
}

// Запись и отправка ГОЛОСОВОГО СООБЩЕНИЯ
async function toggleWaVoiceRecord() {
    let btn = document.getElementById('waVoiceBtn');
    if (st7State.isRecording && st7State.mediaRecorder) {
        st7State.mediaRecorder.stop();
        st7State.isRecording = false;
        clearInterval(st7State.recTimer);
        if (btn) { btn.classList.remove('recording'); btn.innerText = '🎤'; }
        return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return alert("Ваш браузер не поддерживает запись голосовых сообщений.");
    }
    try {
        let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        st7State.audioChunks = [];
        let mr = new MediaRecorder(stream);
        st7State.mediaRecorder = mr;
        mr.ondataavailable = ev => { if (ev.data.size > 0) st7State.audioChunks.push(ev.data); };
        mr.onstop = () => {
            stream.getTracks().forEach(t => t.stop());
            let blob = new Blob(st7State.audioChunks, { type: mr.mimeType || 'audio/webm' });
            if (blob.size > 750 * 1024) return alert("Голосовое получилось слишком длинным для базы (макс. ~45 сек).");
            let r = new FileReader();
            r.onload = ev => sendWaRichMessage({ audio: ev.target.result });
            r.readAsDataURL(blob);
        };
        mr.start();
        st7State.isRecording = true;
        st7State.recSec = 0;
        if (btn) { btn.classList.add('recording'); btn.innerText = '⏹️'; }
        st7State.recTimer = setInterval(() => {
            st7State.recSec++;
            if (btn) btn.title = `Запись: ${st7State.recSec} сек (нажмите для отправки)`;
            if (st7State.recSec >= 45) toggleWaVoiceRecord();
        }, 1000);
    } catch (err) {
        alert("Нет доступа к микрофону: " + err.message);
    }
}

// ============================================================
// === 4. КАМЕРА СТАТУСА (ГАЛЕРЕЯ СЛЕВА + СТРЕЛКА СПРАВА) ===
// ============================================================
async function openWaStatusCamera() {
    st7State.statusCapturedImg = '';
    document.getElementById('waCamPreviewImg').style.display = 'none';
    document.getElementById('waCamVideo').style.display = 'block';
    document.getElementById('waStatusCaption').value = '';
    document.getElementById('waStatusCameraModal').style.display = 'flex';

    try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            st7State.camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
            document.getElementById('waCamVideo').srcObject = st7State.camStream;
        }
    } catch (e) {
        // Если камеры нет — пользователь всё равно может выбрать фото из галереи слева или написать текст
    }
}

function closeWaStatusCamera() {
    if (st7State.camStream) {
        st7State.camStream.getTracks().forEach(t => t.stop());
        st7State.camStream = null;
    }
    document.getElementById('waStatusCameraModal').style.display = 'none';
}

function takeWaStatusPhoto() {
    let vid = document.getElementById('waCamVideo');
    let img = document.getElementById('waCamPreviewImg');
    if (st7State.statusCapturedImg) {
        // Повторное нажатие — переснять
        st7State.statusCapturedImg = '';
        img.style.display = 'none';
        vid.style.display = 'block';
        return;
    }
    if (!vid.videoWidth) return alert("Камера не активна — выберите фото из галереи слева (🖼️).");
    let c = document.createElement('canvas');
    let scale = Math.min(1, 640 / vid.videoWidth);
    c.width = vid.videoWidth * scale;
    c.height = vid.videoHeight * scale;
    c.getContext('2d').drawImage(vid, 0, 0, c.width, c.height);
    st7State.statusCapturedImg = c.toDataURL('image/jpeg', 0.72);
    img.src = st7State.statusCapturedImg;
    img.style.display = 'block';
    vid.style.display = 'none';
}

function handleWaStatusGallery(e) {
    let f = e.target.files[0]; if (!f) return;
    compressImageFile(f, 640, 0.72, dataUrl => {
        st7State.statusCapturedImg = dataUrl;
        let img = document.getElementById('waCamPreviewImg');
        img.src = dataUrl;
        img.style.display = 'block';
        document.getElementById('waCamVideo').style.display = 'none';
    });
    e.target.value = '';
}

function publishWaStatusFromCamera() {
    let caption = document.getElementById('waStatusCaption').value.trim();
    if (!st7State.statusCapturedImg && !caption) return alert("Сделайте фото, выберите из галереи или введите подпись!");
    let u = appState.user || {};
    let fio = u.fio || 'Сотрудник';
    let obj = {
        id: 'st_' + Date.now(),
        tab: u.tab || '',
        sender: fio,
        avatar: fio.split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase(),
        avatarImg: u.avatar || '',
        img: st7State.statusCapturedImg || '',
        text: caption,
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        ts: Date.now()
    };
    if (db) db.collection('chat_statuses').doc(obj.id).set(obj);
    else cloudStatusesList.unshift(obj);
    closeWaStatusCamera();
    renderChatSidebarList();
    showSyncToast("⭕ Статус опубликован!");
}

function viewWaStatus(id) {
    let st = cloudStatusesList.find(x => x.id === id); if (!st) return;
    document.getElementById('stViewAvatar').innerHTML = renderAvatarInner(st.avatarImg, st.avatar);
    document.getElementById('stViewName').innerText = st.sender || 'Коллега';
    document.getElementById('stViewTime').innerText = st.time || '';
    let img = document.getElementById('stViewImg');
    if (st.img) { img.src = st.img; img.style.display = 'block'; } else { img.style.display = 'none'; }
    document.getElementById('stViewCaption').innerText = st.text || '';
    document.getElementById('waStatusViewerModal').style.display = 'flex';
}

// ============================================================
// === 5. КЛИК ПО АВАТАРКЕ: ИНФО О ЧЕЛОВЕКЕ / ГРУППЕ + МЕДИА ===
// ============================================================
function openWaChatInfoModal() {
    let c = cloudChatsList.find(x => x.id === activeChatId);
    if (!c) return;
    let meta = getChatDisplayMeta(c);
    let body = document.getElementById('waInfoModalBody');

    let mediaMsgs = (st7State.activeChatMsgs || []).filter(m => m.img || m.video || m.audio);
    let mediaHtml = mediaMsgs.length === 0
        ? '<div style="font-size:12px;color:#666;padding:6px 0;">Медиафайлов в этом чате пока нет.</div>'
        : `<div class="wa-media-grid">${mediaMsgs.map(m => {
            if (m.img) return `<img src="${m.img}" class="wa-media-thumb" onclick="window.open('${m.img}','_blank')">`;
            if (m.video) return `<video src="${m.video}" class="wa-media-thumb" controls></video>`;
            return `<div style="background:#eef6ff;border-radius:6px;padding:6px;font-size:11px;display:flex;align-items:center;justify-content:center;">🎤 ${m.time||''}</div>`;
        }).join('')}</div>`;

    if (!meta.isGroup) {
        let w = meta.peerWorker || {};
        body.innerHTML = `
            <div style="text-align:center;margin-bottom:14px;">
                <div class="wa-avatar" style="width:92px;height:92px;font-size:30px;margin:0 auto 10px;overflow:hidden;">${renderAvatarInner(meta.photo, meta.avatarText)}</div>
                <h3 style="margin:0;">${escapeHtmlStage6(meta.name)}</h3>
                <div style="font-size:12px;color:#666;">Личный приватный чат (1 на 1)</div>
            </div>
            <div style="background:#f4f6f9;border-radius:8px;padding:12px;font-size:13px;line-height:1.8;">
                <div><strong>📞 Номер телефона:</strong> ${escapeHtmlStage6(w.phone || 'Не указан')}</div>
                <div><strong>🏢 Участок:</strong> ${escapeHtmlStage6(w.sector || 'Не указан')}</div>
                <div><strong>🚉 Станция:</strong> ${escapeHtmlStage6(w.station || 'Не указана')}</div>
                <div><strong>🪪 Табельный №:</strong> ${escapeHtmlStage6(w.tab || meta.peerTab || '—')}</div>
            </div>
            <h4 style="margin:14px 0 4px;">🖼️ Медиафайлы (${mediaMsgs.length})</h4>
            ${mediaHtml}
        `;
    } else {
        let count = (appState.workers || []).length;
        body.innerHTML = `
            <div style="text-align:center;margin-bottom:12px;">
                <div class="wa-avatar group" id="waGroupAvPreview" style="width:92px;height:92px;font-size:30px;margin:0 auto 8px;overflow:hidden;cursor:pointer;" onclick="document.getElementById('waGroupPhotoFile').click()">${renderAvatarInner(meta.photo, meta.avatarText)}</div>
                <input type="file" id="waGroupPhotoFile" accept="image/*" style="display:none;" onchange="handleGroupPhotoUpload(event)">
                <button type="button" class="btn-action" style="width:auto;padding:5px 12px;font-size:12px;" onclick="document.getElementById('waGroupPhotoFile').click()">📷 Изменить фото группы</button>
                <h3 style="margin:8px 0 2px;">${escapeHtmlStage6(meta.name)}</h3>
                <div style="font-size:12px;color:#666;">Группа · Участников: <strong>${count}</strong></div>
            </div>
            <h4 style="margin:10px 0 4px;">🖼️ Медиафайлы (${mediaMsgs.length})</h4>
            ${mediaHtml}
            <h4 style="margin:12px 0 4px;">⚙️ Настройки чата</h4>
            <div style="display:flex;gap:8px;margin-bottom:10px;">
                <input id="waRenameGroupInp" class="form-input" value="${escapeHtmlStage6(meta.name)}" style="margin:0;">
                <button class="btn-success" style="width:auto;margin:0;padding:8px 12px;" onclick="renameActiveGroup()">Сохранить</button>
            </div>
            <h4 style="margin:10px 0 4px;">👥 Участники (${count})</h4>
            <div style="max-height:150px;overflow-y:auto;border:1px solid #eee;border-radius:6px;padding:6px;font-size:12px;">
                ${(appState.workers || []).map(w => `<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px dashed #eee;"><span>${escapeHtmlStage6(w.fio)}</span><span style="color:#666;">${escapeHtmlStage6(w.sector || w.station || '')}</span></div>`).join('')}
            </div>
        `;
    }
    openModal('waInfoModal');
}

function handleGroupPhotoUpload(e) {
    let f = e.target.files[0]; if (!f) return;
    compressImageFile(f, 220, 0.72, dataUrl => {
        if (db) db.collection('chats').doc(activeChatId).set({ photo: dataUrl }, { merge: true });
        let c = cloudChatsList.find(x => x.id === activeChatId);
        if (c) c.photo = dataUrl;
        let p = document.getElementById('waGroupAvPreview');
        if (p) p.innerHTML = renderAvatarInner(dataUrl, '');
        let h = document.getElementById('waHeaderAvatar');
        if (h) h.innerHTML = renderAvatarInner(dataUrl, '');
        renderChatSidebarList();
        showSyncToast('☁️ Фото группы обновлено');
    });
    e.target.value = '';
}

function renameActiveGroup() {
    let name = document.getElementById('waRenameGroupInp')?.value.trim();
    if (!name) return;
    if (db) db.collection('chats').doc(activeChatId).set({ name }, { merge: true });
    let tEl = document.getElementById('chatActiveName');
    if (tEl) tEl.innerText = name;
    closeModal('waInfoModal');
    showSyncToast('☁️ Название группы обновлено');
}

// ============================================================
// === 6. ТЕЛЕФОННАЯ КНИГА И ПРИГЛАШЕНИЕ ДРУЗЕЙ ===
// ============================================================
function openContactsInviteModal() {
    document.getElementById('contactManualPhone').value = '';
    document.getElementById('contactManualName').value = '';
    document.getElementById('pickedContactsList').innerHTML = '';
    openModal('contactsInviteModal');
}

async function pickFromPhonebook() {
    if ('contacts' in navigator && 'ContactsManager' in window) {
        try {
            const contacts = await navigator.contacts.select(['name', 'tel'], { multiple: true });
            renderPickedContacts(contacts.map(c => ({
                name: (c.name && c.name[0]) || 'Без имени',
                tel: (c.tel && c.tel[0]) || ''
            })));
            return;
        } catch (err) {
            // Пользователь отменил или ошибка доступа
        }
    }
    alert("Прямой доступ к телефонной книге работает в Chrome на Android. На этом устройстве введите имя и номер ниже — и нажмите «Пригласить»!");
}

function renderPickedContacts(list) {
    let box = document.getElementById('pickedContactsList');
    if (!list.length) return;
    box.innerHTML = list.map(c => {
        let existing = (appState.workers || []).find(w => w.phone && c.tel && w.phone.replace(/\D/g,'').slice(-10) === c.tel.replace(/\D/g,'').slice(-10));
        return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border-bottom:1px solid #eee;font-size:13px;">
                <div><strong>${escapeHtmlStage6(c.name)}</strong><br><small style="color:#666;">${escapeHtmlStage6(c.tel)}</small></div>
                ${existing
                    ? `<button class="btn-success" style="width:auto;margin:0;padding:5px 10px;font-size:12px;" onclick="closeModal('contactsInviteModal');startPrivateDmWithWorker(appState.workers.find(x=>x.tab==='${existing.tab}'))">Написать</button>`
                    : `<button class="btn-action" style="width:auto;margin:0;padding:5px 10px;font-size:12px;" onclick="sendAppInvite('${escapeHtmlStage6(c.name)}','${escapeHtmlStage6(c.tel)}')">Пригласить</button>`}
            </div>
        `;
    }).join('');
}

function sendManualInvite() {
    let name = document.getElementById('contactManualName').value.trim() || 'Коллега';
    let tel = document.getElementById('contactManualPhone').value.trim();
    sendAppInvite(name, tel);
}

async function sendAppInvite(name, tel) {
    let url = window.location.origin + window.location.pathname;
    let text = `Привет, ${name}! Подключайся к приложению «Ласточка МТППК»: ${url}`;
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
}

// ============================================================
// === 7. ПРОФИЛЬ ОПЕРАТОРА ГУО («ЗАВЕРШЕНИЕ РАБОТЫ КОНТРОЛЁРОВ») ===
// ============================================================
function patchStage7GuoDashboard() {
    let mainCard = document.querySelector('#main-screen .card');
    if (mainCard && !document.getElementById('guoDashboardBox')) {
        let box = document.createElement('div');
        box.id = 'guoDashboardBox';
        box.style.display = 'none';
        box.innerHTML = `
            <div style="font-size:13px;color:#555;margin-bottom:8px;">Профиль оператора ГУО • Участок: <strong id="guoMyStationLabel">—</strong></div>
            <button class="guo-main-btn" onclick="openGuoFinishControllersModal()">✅ Завершение работы контролёров</button>
        `;
        let h2 = mainCard.querySelector('h2');
        h2.insertAdjacentElement('afterend', box);
    }
    applyGuoMainScreenMode();
}

function applyGuoMainScreenMode() {
    let role = typeof getUserRole === 'function' ? getUserRole() : 'viewer';
    let isGuo = (role === 'guo') || (appState.user?.position || '').toLowerCase().includes('гуо');
    let mainCard = document.querySelector('#main-screen .card');
    let guoBox = document.getElementById('guoDashboardBox');
    if (!mainCard || !guoBox) return;

    Array.from(mainCard.children).forEach(ch => {
        if (ch.tagName === 'H2' || ch.id === 'guoDashboardBox') return;
        ch.style.display = isGuo ? 'none' : '';
    });
    guoBox.style.display = isGuo ? 'block' : 'none';
    if (isGuo) {
        let stLabel = document.getElementById('guoMyStationLabel');
        if (stLabel) stLabel.innerText = appState.user?.station || appState.user?.sector || 'Клин';
    }
}

// Определение станции заступления по ПЕРВОМУ ПОЕЗДУ маршрута (например, "Клин-Москва Окт." -> "Клин")
function getRouteStartStation(routeNum) {
    let rObj = (routesDb || []).find(r => r.num === routeNum);
    if (!rObj || !rObj.rows) return { station: '', firstTrain: '' };
    let firstTrainRow = rObj.rows.find(r => r.train && r.route);
    if (!firstTrainRow) return { station: '', firstTrain: '' };
    let startStation = firstTrainRow.route.split(/[-—–→]/)[0].trim();
    return { station: startStation, firstTrain: `${firstTrainRow.train} (${firstTrainRow.route})` };
}

function openGuoFinishControllersModal(showAll) {
    let myStation = (appState.user?.station || appState.user?.sector || 'Клин').trim();
    document.getElementById('guoFilterStationTitle').innerText = showAll ? 'Все участки' : `Участок заступления: ${myStation}`;
    document.getElementById('guoToggleAllBtn').innerText = showAll ? `Только мой участок (${myStation})` : 'Показать все участки';
    document.getElementById('guoToggleAllBtn').onclick = () => openGuoFinishControllersModal(!showAll);

    let now = new Date();
    let ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    let dToday = String(now.getDate());
    let todayTabel = cloudTabelByMonth[ym] || {};

    let list = (appState.workers || []).map(w => {
        let cell = todayTabel[w.tab]?.[dToday];
        let routeNum = cell?.route || '';
        let info = routeNum && routeNum !== 'В' ? getRouteStartStation(routeNum) : { station: '', firstTrain: '' };
        let startSt = info.station || w.station || '';
        let matchesStation = showAll || !myStation || startSt.toLowerCase().includes(myStation.toLowerCase()) || myStation.toLowerCase().includes(startSt.toLowerCase());
        let isWorkingToday = (routeNum && routeNum !== 'В') || w.shiftActive || w.shiftStatus === 'open';
        return { w, routeNum, firstTrain: info.firstTrain, startSt, matchesStation, isWorkingToday };
    }).filter(x => x.isWorkingToday && x.matchesStation);

    let box = document.getElementById('guoControllersList');
    if (list.length === 0) {
        box.innerHTML = `<div style="text-align:center;color:#666;padding:18px;">Нет заступивших контролёров на участке «${escapeHtmlStage6(myStation)}».</div>`;
    } else {
        box.innerHTML = list.map(item => {
            let statusTxt = item.w.shiftStatus === 'closed' ? '🔵 Смена закрыта' : (item.w.shiftActive || item.w.shiftStatus === 'open' ? '🟢 На смене' : '🟡 По графику');
            return `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;border-bottom:1px solid #ddd;gap:8px;flex-wrap:wrap;">
                    <div style="font-size:13px;">
                        <strong>${escapeHtmlStage6(item.w.fio)}</strong> (Таб. ${item.w.tab})<br>
                        <small style="color:#555;">Маршрут: <b>${item.routeNum || '—'}</b> • 1-й поезд: <b>${escapeHtmlStage6(item.firstTrain || '—')}</b> • Заступал: <b>${escapeHtmlStage6(item.startSt || '—')}</b></small><br>
                        <small>${statusTxt}</small>
                    </div>
                    ${item.w.shiftStatus === 'closed'
                        ? '<span style="color:#28a745;font-weight:bold;font-size:12px;">✅ Принято</span>'
                        : `<button class="btn-success" style="width:auto;margin:0;padding:7px 12px;font-size:12px;" onclick="guoSignControllerShift('${item.w.tab}')">✍️ Принять и завершить</button>`}
                </div>
            `;
        }).join('');
    }
    openModal('guoFinishModal');
}

function guoSignControllerShift(tab) {
    let w = (appState.workers || []).find(x => x.tab === tab);
    if (!w) return;
    let opName = appState.user?.fio || 'Оператор ГУО';
    let closedAt = new Date().toLocaleString('ru-RU');
    if (!confirm(`Подписать рапорт и завершить смену контролёра ${w.fio}?`)) return;

    if (db) {
        db.collection('workers').doc(tab).update({ shiftActive: false, shiftStatus: 'closed' }).catch(() => {});
        db.collection('active_shifts').doc(tab).set({ shiftState: 'closed', ts: Date.now() }, { merge: true }).catch(() => {});
        let arch = {
            id: 'rep_guo_' + Date.now(),
            folder: `Закрытие смены ГУО — ${w.fio} (${closedAt})`,
            author: `${w.fio} / ГУО: ${opName}`,
            ts: Date.now(),
            html: `<h3>Закрытие смены контролёра</h3><p><b>Контролёр:</b> ${w.fio} (Таб. ${w.tab})</p><p><b>Закрыл оператор ГУО:</b> ${opName}</p><p><b>Дата и время:</b> ${closedAt}</p>`
        };
        db.collection('archive_reports').doc(arch.id).set(arch).catch(() => {});
    }
    sendCloudNotification(`✅ Оператор ГУО (${opName}) закрыл смену контролёра ${w.fio} (${closedAt}).`);
    showSyncToast(`✅ Смена ${w.fio} закрыта`);
    setTimeout(() => openGuoFinishControllersModal(false), 400);
}

// ============================================================
// === ИНЪЕКЦИЯ МОДАЛЬНЫХ ОКОН ЭТАПА 7 ===
// ============================================================
function injectStage7Modals() {
    let wrap = document.createElement('div');
    wrap.innerHTML = `
        <!-- КАМЕРА ДЛЯ СТАТУСА -->
        <div id="waStatusCameraModal" class="cam-modal">
            <div class="cam-top">
                <strong>📷 Мой статус</strong>
                <button onclick="closeWaStatusCamera()" style="width:auto;margin:0;padding:4px 12px;background:rgba(255,255,255,0.2);">✕</button>
            </div>
            <div class="cam-stage">
                <video id="waCamVideo" autoplay playsinline muted></video>
                <img id="waCamPreviewImg" style="display:none;">
            </div>
            <div class="cam-bottom">
                <input type="text" id="waStatusCaption" class="cam-caption" placeholder="Добавить подпись к статусу...">
                <div class="cam-controls">
                    <!-- СЛЕВА: ГАЛЕРЕЯ -->
                    <button type="button" class="cam-side-btn" onclick="document.getElementById('waStatusGalleryInp').click()" title="Выбрать из галереи">🖼️</button>
                    <input type="file" id="waStatusGalleryInp" accept="image/*" style="display:none;" onchange="handleWaStatusGallery(event)">
                    <!-- ПО ЦЕНТРУ: КРУГ КАМЕРЫ -->
                    <button type="button" class="cam-shutter" onclick="takeWaStatusPhoto()" title="Сфотографировать"></button>
                    <!-- СПРАВА: СТРЕЛКА ВПРАВО (ОТПРАВИТЬ В СТАТУС) -->
                    <button type="button" class="cam-send-arrow" onclick="publishWaStatusFromCamera()" title="Отправить в Мой статус">➡️</button>
                </div>
            </div>
        </div>

        <!-- ПРОСМОТР СТАТУСА -->
        <div id="waStatusViewerModal" class="st-view-modal">
            <div class="st-view-bar">
                <div class="wa-avatar" id="stViewAvatar" style="width:40px;height:40px;min-width:40px;overflow:hidden;"></div>
                <div style="flex:1;"><strong id="stViewName"></strong><br><small id="stViewTime" style="color:#aebac1;"></small></div>
                <button onclick="document.getElementById('waStatusViewerModal').style.display='none'" style="width:auto;margin:0;padding:4px 12px;background:rgba(255,255,255,0.2);">✕</button>
            </div>
            <div class="st-view-body">
                <img id="stViewImg" style="display:none;">
                <div id="stViewCaption" style="font-size:18px;max-width:600px;"></div>
            </div>
        </div>

        <!-- ИНФОРМАЦИЯ О ЧЕЛОВЕКЕ / ГРУППЕ -->
        <div id="waInfoModal" class="modal">
            <div class="modal-content">
                <div id="waInfoModalBody"></div>
                <button class="btn-secondary" style="margin-top:14px;" onclick="closeModal('waInfoModal')">Закрыть</button>
            </div>
        </div>

        <!-- ТЕЛЕФОННАЯ КНИГА И ПРИГЛАШЕНИЯ -->
        <div id="contactsInviteModal" class="modal">
            <div class="modal-content">
                <h3 style="margin-top:0;">📱 Найти друзей и пригласить</h3>
                <button type="button" class="btn-success" onclick="pickFromPhonebook()">📖 Открыть телефонную книгу</button>
                <div id="pickedContactsList" style="max-height:180px;overflow-y:auto;margin:10px 0;"></div>
                <hr style="border:none;border-top:1px solid #ddd;margin:12px 0;">
                <div class="form-group"><label>Имя друга:</label><input id="contactManualName" class="form-input" placeholder="Иван"></div>
                <div class="form-group"><label>Номер телефона:</label><input id="contactManualPhone" type="tel" class="form-input" placeholder="+7 (999) 000-00-00"></div>
                <div style="display:flex;gap:10px;">
                    <button class="btn-action" onclick="sendManualInvite()">📩 Отправить приглашение</button>
                    <button class="btn-secondary" onclick="closeModal('contactsInviteModal')">Закрыть</button>
                </div>
            </div>
        </div>

        <!-- ОКНО ГУО: ЗАВЕРШЕНИЕ РАБОТЫ КОНТРОЛЁРОВ -->
        <div id="guoFinishModal" class="modal">
            <div class="modal-content modal-wide">
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
                    <h3 style="margin:0;">✅ Завершение работы контролёров</h3>
                    <button id="guoToggleAllBtn" class="btn-warning" style="width:auto;margin:0;padding:6px 12px;font-size:12px;">Показать все участки</button>
                </div>
                <div id="guoFilterStationTitle" style="font-size:13px;font-weight:bold;color:#003366;margin-bottom:10px;"></div>
                <div id="guoControllersList" style="max-height:360px;overflow-y:auto;border:1px solid #ddd;border-radius:6px;"></div>
                <button class="btn-secondary" style="margin-top:12px;" onclick="closeModal('guoFinishModal')">Закрыть</button>
            </div>
        </div>
    `;
    document.body.appendChild(wrap);
}
