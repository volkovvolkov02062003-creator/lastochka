// ============================================================
// === ЭТАП 6: WHATSAPP-ЧАТЫ (БЕЗ ЗВОНКОВ/СООБЩЕСТВ), ВЫРУЧКА И EXCEL ===
// ============================================================

let cloudChatsList = [
    { id: "chat_brigada_1", name: "Бригада №1", avatar: "Б1", isGroup: true, lastText: "Добро пожаловать в чат бригады", lastTime: "", lastTs: 0 },
    { id: "chat_instructors", name: "Инструкторы и Старшие", avatar: "ИС", isGroup: true, lastText: "Рабочие вопросы", lastTime: "", lastTs: 0 }
];
let cloudStatusesList = [];
let activeChatId = "chat_brigada_1";
let activeChatUnsub = null;
let cloudShiftStatsUnsub = null;
let waState = {
    tab: "chats", // chats | updates
    filter: "all", // all | unread | groups
    searchQuery: "",
    msgSearchQuery: "",
    msgSearchOpen: false,
    replyTo: null, // { sender, text }
    emojiOpen: false,
    mobileChatOpen: false,
    readTimestamps: JSON.parse(localStorage.getItem("wa_read_ts") || "{}")
};

const waQuickEmojis = ["👍","👌","✅","🚆","📄","⚡","😊","😂","🤝","⚠️","🔴","🟢","🙏","🔥","👀","💪"];

window.addEventListener('load', () => {
    injectWhatsAppStyles();
    setTimeout(() => {
        initStage6CloudChats();
        initStage6ShiftStatsSync();
    }, 600);
});

const _origNavToStage6 = window.navTo;
window.navTo = function(id) {
    if (typeof _origNavToStage6 === 'function') _origNavToStage6(id);
    if (id === 'chats') renderCloudChatsLayout();
};

// ============================================================
// === СТИЛИ WHATSAPP ===
// ============================================================
function injectWhatsAppStyles() {
    if (document.getElementById('wa-chat-styles')) return;
    let st = document.createElement('style');
    st.id = 'wa-chat-styles';
    st.innerHTML = `
        .wa-app { max-width: 1080px; height: calc(100vh - 80px); min-height: 540px; margin: 45px auto 10px; background: #fff; border-radius: 10px; overflow: hidden; display: flex; box-shadow: 0 6px 28px rgba(0,0,0,0.4); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #111b21; position: relative; }
        body.dark-theme .wa-app { background: #111b21; color: #e9edef; }

        /* ЛЕВАЯ РЕЛЬСА НАВИГАЦИИ (ТОЛЬКО ЧАТЫ И АКТУАЛЬНОЕ) */
        .wa-rail { width: 58px; background: #f0f2f5; border-right: 1px solid #d1d7db; display: flex; flex-direction: column; align-items: center; padding: 12px 0; gap: 10px; flex-shrink: 0; }
        body.dark-theme .wa-rail { background: #202c33; border-color: #2a3942; }
        .wa-rail-btn { width: 40px !important; height: 40px; border-radius: 50%; background: transparent; color: #54656f; font-size: 20px; display: flex; align-items: center; justify-content: center; margin: 0; padding: 0; position: relative; }
        .wa-rail-btn.active { background: #d9fdd3; color: #008069; }
        body.dark-theme .wa-rail-btn { color: #aebac1; }
        body.dark-theme .wa-rail-btn.active { background: #005c4b; color: #e9edef; }

        /* ЛЕВАЯ ПАНЕЛЬ СПИСКА ЧАТОВ */
        .wa-sidebar { width: 340px; border-right: 1px solid #d1d7db; display: flex; flex-direction: column; background: #fff; flex-shrink: 0; }
        body.dark-theme .wa-sidebar { background: #111b21; border-color: #2a3942; }
        .wa-side-header { padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
        .wa-side-header h3 { margin: 0; font-size: 21px; color: #111b21; text-align: left; }
        body.dark-theme .wa-side-header h3 { color: #e9edef; }
        .wa-icon-btn { width: 36px !important; height: 36px; border-radius: 50%; background: transparent; color: #54656f; font-size: 18px; margin: 0; padding: 0; display: inline-flex; align-items: center; justify-content: center; }
        .wa-icon-btn:hover { background: rgba(0,0,0,0.06); }
        body.dark-theme .wa-icon-btn { color: #aebac1; }

        .wa-search-wrap { padding: 0 12px 8px; }
        .wa-search-box { display: flex; align-items: center; background: #f0f2f5; border-radius: 8px; padding: 6px 12px; gap: 8px; }
        body.dark-theme .wa-search-box { background: #202c33; }
        .wa-search-box input { border: none; background: transparent; outline: none; width: 100%; font-size: 13px; color: inherit; }

        .wa-filters { display: flex; gap: 6px; padding: 0 12px 10px; }
        .wa-pill { width: auto !important; margin: 0; padding: 5px 12px; border-radius: 16px; font-size: 12px; font-weight: 500; background: #f0f2f5; color: #54656f; }
        .wa-pill.active { background: #e7fce3; color: #008069; font-weight: bold; }
        body.dark-theme .wa-pill { background: #202c33; color: #8696a0; }
        body.dark-theme .wa-pill.active { background: #0a332c; color: #00a884; }

        .wa-list { flex: 1; overflow-y: auto; }
        .wa-chat-row { display: flex; align-items: center; gap: 12px; padding: 10px 14px; cursor: pointer; border-bottom: 1px solid #f0f2f5; transition: background 0.15s; }
        .wa-chat-row:hover { background: #f5f6f6; }
        .wa-chat-row.active { background: #f0f2f5; }
        body.dark-theme .wa-chat-row { border-color: #202c33; }
        body.dark-theme .wa-chat-row:hover, body.dark-theme .wa-chat-row.active { background: #2a3942; }
        .wa-avatar { width: 46px; height: 46px; min-width: 46px; border-radius: 50%; background: #00a884; color: #fff; font-weight: bold; font-size: 16px; display: flex; align-items: center; justify-content: center; }
        .wa-avatar.group { background: #008069; }
        .wa-row-body { flex: 1; min-width: 0; }
        .wa-row-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 3px; }
        .wa-row-name { font-size: 15px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .wa-row-time { font-size: 11px; color: #667781; flex-shrink: 0; margin-left: 6px; }
        .wa-row-bottom { display: flex; justify-content: space-between; align-items: center; gap: 6px; }
        .wa-row-preview { font-size: 13px; color: #667781; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .wa-unread-dot { background: #25d366; color: #fff; font-size: 11px; font-weight: bold; min-width: 19px; height: 19px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; padding: 0 5px; }

        /* ПРАВАЯ ПАНЕЛЬ ЧАТА */
        .wa-main { flex: 1; display: flex; flex-direction: column; background-color: #efeae2; background-image: radial-gradient(rgba(0,0,0,0.06) 1px, transparent 1px); background-size: 18px 18px; position: relative; min-width: 0; }
        body.dark-theme .wa-main { background-color: #0b141a; background-image: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px); }
        .wa-main-header { background: #f0f2f5; padding: 10px 16px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #d1d7db; }
        body.dark-theme .wa-main-header { background: #202c33; border-color: #2a3942; }
        .wa-back-mobile { display: none; width: 34px !important; height: 34px; margin: 0; padding: 0; background: transparent; color: #54656f; font-size: 20px; }
        .wa-msg-search-bar { display: none; padding: 6px 14px; background: #fff; border-bottom: 1px solid #d1d7db; }
        body.dark-theme .wa-msg-search-bar { background: #111b21; border-color: #2a3942; }

        .wa-messages { flex: 1; overflow-y: auto; padding: 16px 24px; display: flex; flex-direction: column; gap: 6px; }
        .wa-date-pill { align-self: center; background: #ffffff; color: #54656f; font-size: 11px; padding: 4px 12px; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); margin: 8px 0; }
        body.dark-theme .wa-date-pill { background: #182229; color: #8696a0; }

        .wa-bubble { max-width: 72%; padding: 7px 10px 5px; border-radius: 8px; font-size: 14px; line-height: 1.38; position: relative; box-shadow: 0 1px 1px rgba(0,0,0,0.12); word-wrap: break-word; cursor: pointer; }
        .wa-bubble.in { align-self: flex-start; background: #ffffff; border-top-left-radius: 0; color: #111b21; }
        .wa-bubble.out { align-self: flex-end; background: #d9fdd3; border-top-right-radius: 0; color: #111b21; }
        body.dark-theme .wa-bubble.in { background: #202c33; color: #e9edef; }
        body.dark-theme .wa-bubble.out { background: #005c4b; color: #e9edef; }
        .wa-sender { font-size: 12px; font-weight: bold; color: #008069; margin-bottom: 2px; }
        body.dark-theme .wa-sender { color: #53bdeb; }
        .wa-quote { background: rgba(0,0,0,0.06); border-left: 3px solid #00a884; border-radius: 4px; padding: 4px 8px; margin-bottom: 5px; font-size: 12px; }
        .wa-meta { display: flex; justify-content: flex-end; align-items: center; gap: 4px; font-size: 10.5px; color: #667781; margin-top: 2px; }
        body.dark-theme .wa-meta { color: #aebac1; }
        .wa-ticks { color: #53bdeb; font-weight: bold; font-size: 12px; }
        .wa-img-attach { max-width: 260px; max-height: 240px; border-radius: 6px; display: block; margin: 4px 0; cursor: pointer; }

        /* ПАНЕЛЬ ОТВЕТА, ЭМОДЗИ И ВВОДА */
        .wa-reply-bar { display: none; background: #f0f2f5; padding: 8px 14px; border-top: 1px solid #d1d7db; align-items: center; justify-content: space-between; gap: 10px; }
        body.dark-theme .wa-reply-bar { background: #202c33; border-color: #2a3942; }
        .wa-emoji-bar { display: none; background: #f0f2f5; padding: 8px 14px; border-top: 1px solid #d1d7db; flex-wrap: wrap; gap: 6px; }
        body.dark-theme .wa-emoji-bar { background: #202c33; border-color: #2a3942; }
        .wa-emoji-item { font-size: 20px; cursor: pointer; padding: 3px 5px; border-radius: 6px; }
        .wa-emoji-item:hover { background: rgba(0,0,0,0.08); }

        .wa-composer { background: #f0f2f5; padding: 8px 12px; display: flex; align-items: center; gap: 8px; }
        body.dark-theme .wa-composer { background: #202c33; }
        .wa-composer input[type="text"] { flex: 1; background: #ffffff; border: none; border-radius: 20px; padding: 10px 16px; font-size: 14px; outline: none; color: #111b21; }
        body.dark-theme .wa-composer input[type="text"] { background: #2a3942; color: #e9edef; }
        .wa-send-btn { width: 42px !important; height: 42px; min-width: 42px; border-radius: 50%; background: #00a884; color: #fff; font-size: 18px; margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; }

        /* СТАТУСЫ («АКТУАЛЬНОЕ») */
        .wa-status-ring { width: 46px; height: 46px; min-width: 46px; border-radius: 50%; border: 2.5px solid #25d366; padding: 2px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; }
        .wa-status-ring .wa-avatar { width: 38px; height: 38px; min-width: 38px; font-size: 13px; }

        /* МОБИЛЬНАЯ АДАПТАЦИЯ */
        @media (max-width: 740px) {
            .wa-app { height: calc(100vh - 64px); margin: 52px 0 0; border-radius: 0; }
            .wa-rail { width: 48px; }
            .wa-sidebar { width: calc(100% - 48px); }
            .wa-main { display: none; width: calc(100% - 48px); }
            .wa-app.mobile-chat-open .wa-sidebar { display: none; }
            .wa-app.mobile-chat-open .wa-main { display: flex; }
            .wa-back-mobile { display: inline-flex; align-items: center; justify-content: center; }
            .wa-messages { padding: 12px; }
            .wa-bubble { max-width: 86%; }
        }
    `;
    document.head.appendChild(st);
}

// ============================================================
// === 1. ОБЛАЧНЫЕ ЧАТЫ WHATSAPP (FIREBASE FIRESTORE) ===
// ============================================================
function initStage6CloudChats() {
    if (typeof db === 'undefined' || !db) return;

    db.collection('chats').onSnapshot(snap => {
        if (snap.empty) {
            cloudChatsList.forEach(c => db.collection('chats').doc(c.id).set(c));
        } else {
            cloudChatsList = [];
            snap.forEach(d => cloudChatsList.push(d.data()));
            cloudChatsList.sort((a, b) => (b.lastTs || 0) - (a.lastTs || 0));
            renderChatSidebarList();
        }
    });

    db.collection('chat_statuses').onSnapshot(snap => {
        cloudStatusesList = [];
        snap.forEach(d => cloudStatusesList.push(d.data()));
        cloudStatusesList.sort((a, b) => (b.ts || 0) - (a.ts || 0));
        if (waState.tab === 'updates') renderChatSidebarList();
    });
}

function renderCloudChatsLayout() {
    let scr = document.getElementById('chats-screen');
    if (!scr) return;
    let activeObj = cloudChatsList.find(c => c.id === activeChatId) || cloudChatsList[0];
    if (activeObj) activeChatId = activeObj.id;

    scr.innerHTML = `
        <div class="wa-app ${waState.mobileChatOpen ? 'mobile-chat-open' : ''}" id="waAppRoot">
            <!-- ЛЕВАЯ РЕЛЬСА: ТОЛЬКО ЧАТЫ И АКТУАЛЬНОЕ (БЕЗ ЗВОНКОВ И СООБЩЕСТВ) -->
            <div class="wa-rail">
                <button class="wa-rail-btn ${waState.tab==='chats'?'active':''}" onclick="switchWaTab('chats')" title="Чаты">💬</button>
                <button class="wa-rail-btn ${waState.tab==='updates'?'active':''}" onclick="switchWaTab('updates')" title="Актуальное (Статусы)">⭕</button>
                <div style="flex:1;"></div>
                <button class="wa-rail-btn" onclick="backToMain()" title="Назад в Ласточку">🏠</button>
            </div>

            <!-- СПИСОК ЧАТОВ / СТАТУСОВ -->
            <div class="wa-sidebar">
                <div class="wa-side-header">
                    <h3 id="waSideTitle">${waState.tab === 'chats' ? 'Чаты' : 'Актуальное'}</h3>
                    <div>
                        ${waState.tab === 'chats'
                            ? `<button class="wa-icon-btn" onclick="openWaNewChatMenu()" title="Новый чат или группа">📝</button>`
                            : `<button class="wa-icon-btn" onclick="postWaStatus()" title="Добавить статус">➕</button>`}
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

            <!-- ОКНО ПЕРЕПИСКИ -->
            <div class="wa-main">
                <div class="wa-main-header">
                    <button class="wa-back-mobile" onclick="closeWaMobileChat()">←</button>
                    <div class="wa-avatar ${activeObj?.isGroup?'group':''}" id="waHeaderAvatar" style="width:40px;height:40px;min-width:40px;font-size:14px;">${activeObj?.avatar || 'Ч'}</div>
                    <div style="flex:1;min-width:0;">
                        <div id="chatActiveName" style="font-weight:600;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${activeObj?.name || 'Чат'}</div>
                        <div id="waHeaderSub" style="font-size:12px;color:#667781;">${activeObj?.isGroup ? 'групповой чат · в сети' : 'в сети'}</div>
                    </div>
                    <button class="wa-icon-btn" onclick="toggleWaMsgSearch()" title="Поиск по сообщениям">🔍</button>
                </div>

                <div class="wa-msg-search-bar" id="waMsgSearchBar">
                    <div class="wa-search-box">
                        <span>🔍</span>
                        <input type="text" id="waMsgSearchInp" placeholder="Поиск сообщений в этом чате..." oninput="waState.msgSearchQuery=this.value;subscribeToChatMessages(activeChatId)">
                    </div>
                </div>

                <div class="wa-messages" id="chatMsgs"></div>

                <!-- ЦИТАТА ОТВЕТА -->
                <div class="wa-reply-bar" id="waReplyBar">
                    <div style="border-left:3px solid #00a884;padding-left:8px;min-width:0;flex:1;">
                        <div id="waReplySender" style="font-size:12px;font-weight:bold;color:#008069;"></div>
                        <div id="waReplyText" style="font-size:12px;color:#54656f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></div>
                    </div>
                    <button class="wa-icon-btn" onclick="cancelWaReply()">✕</button>
                </div>

                <!-- ПАНЕЛЬ ЭМОДЗИ -->
                <div class="wa-emoji-bar" id="waEmojiBar">
                    ${waQuickEmojis.map(em => `<span class="wa-emoji-item" onclick="insertWaEmoji('${em}')">${em}</span>`).join('')}
                </div>

                <!-- СТРОКА ВВОДА -->
                <div class="wa-composer">
                    <button class="wa-icon-btn" onclick="toggleWaEmoji()" title="Эмодзи">😊</button>
                    <button class="wa-icon-btn" onclick="document.getElementById('waFileAttach').click()" title="Прикрепить фото">📎</button>
                    <input type="file" id="waFileAttach" accept="image/*" style="display:none;" onchange="handleWaPhotoAttach(event)">
                    <input type="text" id="chatInput" placeholder="Введите сообщение" onkeydown="if(event.key==='Enter') sendMsg()">
                    <button class="wa-send-btn" onclick="sendMsg()" title="Отправить">➤</button>
                </div>
            </div>
        </div>
    `;
    renderChatSidebarList();
    subscribeToChatMessages(activeChatId);
}

function switchWaTab(tab) {
    waState.tab = tab;
    renderCloudChatsLayout();
}
function setWaFilter(f) {
    waState.filter = f;
    renderCloudChatsLayout();
}
function closeWaMobileChat() {
    waState.mobileChatOpen = false;
    let r = document.getElementById('waAppRoot');
    if (r) r.classList.remove('mobile-chat-open');
}
function toggleWaMsgSearch() {
    waState.msgSearchOpen = !waState.msgSearchOpen;
    let b = document.getElementById('waMsgSearchBar');
    if (b) b.style.display = waState.msgSearchOpen ? 'block' : 'none';
    if (!waState.msgSearchOpen) { waState.msgSearchQuery = ''; subscribeToChatMessages(activeChatId); }
}
function toggleWaEmoji() {
    waState.emojiOpen = !waState.emojiOpen;
    let b = document.getElementById('waEmojiBar');
    if (b) b.style.display = waState.emojiOpen ? 'flex' : 'none';
}
function insertWaEmoji(em) {
    let inp = document.getElementById('chatInput');
    if (inp) { inp.value += em; inp.focus(); }
}

function renderChatSidebarList() {
    let box = document.getElementById('cloudChatListBox');
    if (!box) return;

    if (waState.tab === 'updates') {
        let myFio = appState.user?.fio || 'Мой статус';
        let myInit = myFio.split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase();
        let html = `
            <div class="wa-chat-row" onclick="postWaStatus()">
                <div class="wa-status-ring"><div class="wa-avatar">${myInit}</div></div>
                <div class="wa-row-body">
                    <div class="wa-row-name">Мой статус</div>
                    <div class="wa-row-preview">Нажмите, чтобы добавить обновление</div>
                </div>
            </div>
            <div style="padding:10px 14px 4px;font-size:12px;font-weight:bold;color:#008069;">НЕДАВНИЕ ОБНОВЛЕНИЯ</div>
        `;
        html += cloudStatusesList.length === 0
            ? '<div style="padding:16px;font-size:13px;color:#667781;text-align:center;">Статусов от коллег пока нет</div>'
            : cloudStatusesList.map(st => `
                <div class="wa-chat-row" onclick="alert('${escapeHtmlStage6(st.sender)}: ' + '${escapeHtmlStage6(st.text)}')">
                    <div class="wa-status-ring"><div class="wa-avatar">${st.avatar || 'К'}</div></div>
                    <div class="wa-row-body">
                        <div class="wa-row-top"><span class="wa-row-name">${escapeHtmlStage6(st.sender)}</span><span class="wa-row-time">${st.time || ''}</span></div>
                        <div class="wa-row-preview">${escapeHtmlStage6(st.text)}</div>
                    </div>
                </div>
            `).join('');
        box.innerHTML = html;
        return;
    }

    let q = (waState.searchQuery || '').trim().toLowerCase();
    let list = cloudChatsList.filter(c => {
        if (q && !(c.name || '').toLowerCase().includes(q)) return false;
        if (waState.filter === 'groups' && !c.isGroup) return false;
        if (waState.filter === 'unread') {
            let lastRead = waState.readTimestamps[c.id] || 0;
            if (!c.lastTs || c.lastTs <= lastRead) return false;
        }
        return true;
    });

    box.innerHTML = list.length === 0
        ? '<div style="padding:20px;text-align:center;color:#667781;font-size:13px;">Чаты не найдены</div>'
        : list.map(c => {
            let lastRead = waState.readTimestamps[c.id] || 0;
            let hasUnread = c.lastTs && c.lastTs > lastRead && c.id !== activeChatId;
            return `
                <div class="wa-chat-row ${c.id === activeChatId ? 'active' : ''}" onclick="openCloudChat('${c.id}')">
                    <div class="wa-avatar ${c.isGroup?'group':''}">${c.avatar || 'Ч'}</div>
                    <div class="wa-row-body">
                        <div class="wa-row-top">
                            <span class="wa-row-name">${escapeHtmlStage6(c.name)}</span>
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
}

function postWaStatus() {
    let text = prompt("Введите ваш статус (видят все коллеги в «Актуальном»):");
    if (!text || !text.trim()) return;
    let fio = appState.user?.fio || 'Сотрудник';
    let obj = {
        id: 'st_' + Date.now(),
        sender: fio,
        avatar: fio.split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase(),
        text: text.trim(),
        time: new Date().toLocaleTimeString('ru-RU', { hour:'2-digit', minute:'2-digit' }),
        ts: Date.now()
    };
    if (db) db.collection('chat_statuses').doc(obj.id).set(obj);
    else { cloudStatusesList.unshift(obj); renderChatSidebarList(); }
}

function openWaNewChatMenu() {
    let choice = prompt("1 — Создать новую группу\n2 — Написать коллеге лично (по фамилии или табельному)\n\nВведите 1 или 2:", "1");
    if (choice === '1') {
        createNewCloudChat();
    } else if (choice === '2') {
        let q = prompt("Введите фамилию или табельный номер коллеги:");
        if (!q) return;
        let w = (appState.workers || []).find(x => x.tab === q.trim() || x.fio.toLowerCase().includes(q.trim().toLowerCase()));
        if (!w) return alert("Сотрудник не найден в базе!");
        let myTab = appState.user?.tab || '0';
        let pairId = 'dm_' + [myTab, w.tab].sort().join('_');
        let ex = cloudChatsList.find(c => c.id === pairId);
        if (!ex) {
            let obj = {
                id: pairId, name: w.fio,
                avatar: w.fio.split(/\s+/).map(p=>p[0]).join('').slice(0,2).toUpperCase(),
                isGroup: false, lastText: "Личный чат открыт", lastTime: "", lastTs: Date.now()
            };
            if (db) db.collection('chats').doc(pairId).set(obj);
            else cloudChatsList.unshift(obj);
        }
        openCloudChat(pairId);
    }
}

function createNewCloudChat() {
    let name = prompt("Название новой группы (например, Участок Клин):");
    if (!name || !name.trim()) return;
    name = name.trim();
    let avatar = name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
    let obj = { id: 'chat_' + Date.now(), name, avatar, isGroup: true, lastText: "Группа создана", lastTime: "", lastTs: Date.now(), createdBy: appState.user?.fio || '' };
    if (db) db.collection('chats').doc(obj.id).set(obj);
    else { cloudChatsList.unshift(obj); renderChatSidebarList(); }
    openCloudChat(obj.id);
}

function openCloudChat(chatId) {
    activeChatId = chatId;
    waState.mobileChatOpen = true;
    waState.readTimestamps[chatId] = Date.now();
    localStorage.setItem("wa_read_ts", JSON.stringify(waState.readTimestamps));

    let root = document.getElementById('waAppRoot');
    if (root) root.classList.add('mobile-chat-open');

    let chatObj = cloudChatsList.find(c => c.id === chatId);
    if (chatObj) {
        let tEl = document.getElementById('chatActiveName');
        let sEl = document.getElementById('waHeaderSub');
        let aEl = document.getElementById('waHeaderAvatar');
        if (tEl) tEl.innerText = chatObj.name;
        if (sEl) sEl.innerText = chatObj.isGroup ? 'групповой чат · в сети' : 'в сети';
        if (aEl) aEl.innerText = chatObj.avatar || 'Ч';
    }
    cancelWaReply();
    renderChatSidebarList();
    subscribeToChatMessages(chatId);
}
window.openChat = openCloudChat;

function setWaReply(sender, text) {
    waState.replyTo = { sender, text };
    document.getElementById('waReplySender').innerText = sender;
    document.getElementById('waReplyText').innerText = text;
    document.getElementById('waReplyBar').style.display = 'flex';
    document.getElementById('chatInput')?.focus();
}
function cancelWaReply() {
    waState.replyTo = null;
    let b = document.getElementById('waReplyBar');
    if (b) b.style.display = 'none';
}

function subscribeToChatMessages(chatId) {
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

            let mq = (waState.msgSearchQuery || '').trim().toLowerCase();
            if (mq) list = list.filter(m => (m.text || '').toLowerCase().includes(mq) || (m.sender || '').toLowerCase().includes(mq));

            let myTab = appState.user?.tab || '';
            if (list.length === 0) {
                msgsBox.innerHTML = '<div class="wa-date-pill">Сообщений пока нет. Напишите первым!</div>';
                return;
            }

            let html = '';
            let lastDate = '';
            list.forEach(m => {
                let dStr = m.date || new Date(m.ts || Date.now()).toLocaleDateString('ru-RU');
                if (dStr !== lastDate) {
                    html += `<div class="wa-date-pill">${dStr}</div>`;
                    lastDate = dStr;
                }
                let isMine = m.tab === myTab;
                let quoteHtml = m.replyTo ? `<div class="wa-quote"><strong style="color:#008069;">${escapeHtmlStage6(m.replyTo.sender)}</strong><br>${escapeHtmlStage6(m.replyTo.text)}</div>` : '';
                let imgHtml = m.img ? `<img src="${m.img}" class="wa-img-attach" onclick="event.stopPropagation();window.open(this.src,'_blank')">` : '';
                let safeSender = escapeHtmlStage6(m.sender || 'Коллега').replace(/'/g, "\\'");
                let safeText = escapeHtmlStage6(m.text || (m.img ? '📷 Фото' : '')).replace(/'/g, "\\'");

                html += `
                    <div class="wa-bubble ${isMine ? 'out' : 'in'}" onclick="setWaReply('${safeSender}','${safeText}')" title="Нажмите, чтобы ответить">
                        ${!isMine ? `<div class="wa-sender">${escapeHtmlStage6(m.sender || 'Коллега')}</div>` : ''}
                        ${quoteHtml}
                        ${imgHtml}
                        ${m.text ? `<div>${escapeHtmlStage6(m.text)}</div>` : ''}
                        <div class="wa-meta">
                            <span>${m.time || ''}</span>
                            ${isMine ? '<span class="wa-ticks">✓✓</span>' : ''}
                        </div>
                    </div>
                `;
            });
            msgsBox.innerHTML = html;
            msgsBox.scrollTop = msgsBox.scrollHeight;

            waState.readTimestamps[chatId] = Date.now();
            localStorage.setItem("wa_read_ts", JSON.stringify(waState.readTimestamps));
        });
}

function handleWaPhotoAttach(e) {
    let f = e.target.files[0];
    if (!f) return;
    let reader = new FileReader();
    reader.onload = ev => {
        let img = new Image();
        img.onload = () => {
            let canvas = document.createElement('canvas');
            let maxW = 600, scale = Math.min(1, maxW / img.width);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            let compressed = canvas.toDataURL('image/jpeg', 0.65);
            sendWaMessageInternal('', compressed);
        };
        img.src = ev.target.result;
    };
    reader.readAsDataURL(f);
    e.target.value = '';
}

function sendWaMessageInternal(text, imgData) {
    let now = new Date();
    let timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    let dateStr = now.toLocaleDateString('ru-RU');
    let ts = Date.now();

    let msgObj = {
        id: 'msg_' + ts + '_' + Math.floor(Math.random() * 1000),
        chatId: activeChatId,
        tab: appState.user?.tab || 'unknown',
        sender: appState.user?.fio || 'Сотрудник',
        text: text || '',
        img: imgData || '',
        replyTo: waState.replyTo || null,
        time: timeStr,
        date: dateStr,
        ts
    };

    cancelWaReply();
    if (waState.emojiOpen) toggleWaEmoji();

    if (db) {
        db.collection('chat_messages').doc(msgObj.id).set(msgObj).catch(err => alert("Ошибка: " + err.message));
        db.collection('chats').doc(activeChatId).set({
            lastText: imgData ? '📷 Фото' : text,
            lastTime: timeStr,
            lastTs: ts
        }, { merge: true }).catch(() => {});
    }
}

window.sendMsg = function() {
    let inp = document.getElementById('chatInput');
    if (!inp || !inp.value.trim()) return;
    let text = inp.value.trim();
    inp.value = '';
    sendWaMessageInternal(text, '');
};

function escapeHtmlStage6(str) {
    return String(str || '').replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
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

    attachStatsListener();
    const _origShowMain = window.showMainScreen;
    window.showMainScreen = function(u) {
        if (typeof _origShowMain === 'function') _origShowMain(u);
        attachStatsListener();
    };

    const syncTodayShiftToCloud = () => {
        let tab = appState.user?.tab;
        if (!tab || !db) return;
        let iso = new Date().toISOString().split('T')[0];
        let rec = (appState.shiftHistory || []).find(s => s.date === iso);
        if (rec) {
            db.collection('shift_stats').doc(`${tab}_${iso}`).set({ ...rec, tab }).catch(() => {});
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
            } catch (err) { alert("Не удалось прочитать Excel-файл: " + err.message); }
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

window.handleRouteFileImport = function(e) {
    let f = e.target.files[0]; if (!f) return;
    readAnySpreadsheetRows(f, rows => {
        openRouteModal(null);
        document.getElementById('rtNumInput').value = f.name.replace(/\.[^.]+$/, '');
        let tb = document.getElementById('routeRowsBody'); tb.innerHTML = '';
        let added = 0;

        rows.forEach(r => {
            let cells = r.map(c => String(c ?? '').trim()).filter(Boolean);
            if (!cells.length) return;
            let joined = cells.join(' ');
            let mRoute = joined.match(/маршрут\s*№?\s*([0-9а-яА-Я\-]+)/i);
            if (mRoute && !added) { document.getElementById('rtNumInput').value = mRoute[1]; return; }

            let times = r.map(normalizeExcelTime).filter(Boolean);
            let trainCell = cells.find(c => /^\d{4}$/.test(c)) || '';
            let isSpecial = /разрыв|обед|посадка|явка/i.test(joined);

            if (trainCell || (isSpecial && times.length >= 2)) {
                let routeText = cells.find(c => c !== trainCell && !/^\d{1,2}[:.]\d{2}$/.test(c) && c.length > 3) || '';
                let condText = cells.find(c => c !== trainCell && c !== routeText && !/^\d{1,2}[:.]\d{2}$/.test(c) && c.length > 3) || '';
                addRouteRow({ train: trainCell, route: routeText, start: times[0] || '', end: times[1] || '', dur: '', cond: condText });
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

window.handleTabelFileUpload = function(e) {
    let f = e.target.files[0]; if (!f) return;
    readAnySpreadsheetRows(f, rows => {
        let tom = new Date(); tom.setDate(tom.getDate() + 1);
        let ym = `${tom.getFullYear()}-${String(tom.getMonth() + 1).padStart(2, '0')}`, d = String(tom.getDate());
        if (!cloudTabelByMonth[ym]) cloudTabelByMonth[ym] = {};
        let matchedCount = 0;

        rows.forEach(r => {
            let cells = r.map(c => String(c ?? '').trim()).filter(Boolean);
            if (cells.length < 2) return;
            let worker = appState.workers.find(w => cells.some(c => c === w.tab || (c.length > 3 && w.fio.toLowerCase().includes(c.toLowerCase()))));
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
        alert(`Файл "${f.name}" прочитан! Маршруты обновлены только на завтра (${d}.${String(tom.getMonth() + 1).padStart(2, '0')}).`);
        e.target.value = '';
    });
};
