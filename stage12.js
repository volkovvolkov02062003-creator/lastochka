// ============================================================
// === ЭТАП 12: ПОЛНОЦЕННЫЕ ГРУППЫ WHATSAPP, КОНТЕКСТНОЕ    ===
// === МЕНЮ СООБЩЕНИЙ, ПРОФИЛЬ В ЧАТЕ И МАСКА ТЕЛЕФОНА +7   ===
// ============================================================

let st12State = {
    newGroupPhoto: '',
    ctxMsgId: null,
    pressTimer: null,
    infoTab: 'media', // media | voice | links
    manageMemberTab: null
};

window.addEventListener('load', () => {
    injectStage12Styles();
    injectStage12Modals();
    setTimeout(() => {
        initStage12();
    }, 1750);
});

function st12Esc(str) {
    return String(str || '').replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}

function injectStage12Styles() {
    if (document.getElementById('st12-styles')) return;
    let st = document.createElement('style');
    st.id = 'st12-styles';
    st.innerHTML = `
        /* ГРУППОВОЕ СООБЩЕНИЕ С ФОТО ПРОФИЛЯ */
        .wa-msg-row { display: flex; align-items: flex-end; gap: 7px; max-width: 100%; }
        .wa-msg-row.out { justify-content: flex-end; }
        .wa-msg-row.in { justify-content: flex-start; }
        .wa-msg-mini-av {
            width: 30px; height: 30px; min-width: 30px; border-radius: 50%;
            background: #008069; color: #fff; font-size: 11px; font-weight: bold;
            display: flex; align-items: center; justify-content: center;
            overflow: hidden; cursor: pointer; margin-bottom: 2px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .wa-sender-link { cursor: pointer; text-decoration: none; }
        .wa-sender-link:hover { text-decoration: underline; }
        .wa-fwd-tag { font-size: 11px; font-style: italic; color: #667781; margin-bottom: 3px; }

        /* КОНТЕКСТНОЕ МЕНЮ СООБЩЕНИЯ */
        .st12-ctx-overlay {
            display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.35);
            z-index: 4500; justify-content: center; align-items: center;
        }
        .st12-ctx-menu {
            background: #ffffff; color: #111b21; border-radius: 12px;
            width: 240px; max-width: 88vw; box-shadow: 0 8px 28px rgba(0,0,0,0.4);
            overflow: hidden; padding: 6px 0;
        }
        body.dark-theme .st12-ctx-menu { background: #233138; color: #e9edef; }
        .st12-ctx-item {
            display: flex; align-items: center; gap: 12px; padding: 11px 16px;
            font-size: 14px; cursor: pointer; user-select: none;
        }
        .st12-ctx-item:hover { background: rgba(0,0,0,0.06); }
        body.dark-theme .st12-ctx-item:hover { background: rgba(255,255,255,0.08); }
        .st12-ctx-item.danger { color: #dc3545; font-weight: 600; }

        /* КАРТОЧКА ИНФО О ГРУППЕ / ЧАТЕ */
        .st12-info-head-bar {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 6px; position: relative;
        }
        .st12-dots-btn {
            width: 34px !important; height: 34px; border-radius: 50%;
            background: #f0f2f5; color: #333; font-size: 20px; font-weight: bold;
            margin: 0; padding: 0; display: inline-flex; align-items: center; justify-content: center;
        }
        .st12-dots-dropdown {
            display: none; position: absolute; right: 0; top: 38px;
            background: #fff; border: 1px solid #d1d7db; border-radius: 8px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.22); z-index: 20; min-width: 195px;
            overflow: hidden;
        }
        .st12-dots-opt {
            padding: 10px 14px; font-size: 13px; cursor: pointer; color: #111b21;
            border-bottom: 1px solid #f0f2f5;
        }
        .st12-dots-opt:hover { background: #eef6ff; }
        .st12-dots-opt.danger { color: #dc3545; font-weight: bold; }

        .st12-about-box {
            display: flex; align-items: center; justify-content: space-between; gap: 8px;
            background: #f4f6f9; border-radius: 8px; padding: 10px 12px; margin: 10px 0;
        }
        .st12-gray-pencil {
            width: 32px !important; height: 32px; min-width: 32px; border-radius: 50%;
            background: #e5e7eb !important; color: #6b7280 !important;
            margin: 0 !important; padding: 0 !important; font-size: 15px;
            display: inline-flex; align-items: center; justify-content: center;
        }

        /* 3 ВКЛАДКИ: МЕДИАФАЙЛЫ / ГОЛОСОВЫЕ / ССЫЛКИ */
        .st12-tabs {
            display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;
            margin: 12px 0 8px;
        }
        .st12-tab-btn {
            margin: 0 !important; padding: 8px 4px !important; font-size: 12px !important;
            background: #f0f2f5 !important; color: #54656f !important; border-radius: 8px !important;
        }
        .st12-tab-btn.active {
            background: #008069 !important; color: #ffffff !important;
        }
        .st12-tab-panel {
            background: #fafafa; border: 1px solid #e5e7eb; border-radius: 8px;
            padding: 8px; max-height: 190px; overflow-y: auto; margin-bottom: 12px;
        }
        .st12-role-badge {
            font-size: 10px; font-weight: bold; padding: 2px 7px; border-radius: 10px;
            margin-left: 6px;
        }
        .st12-role-admin { background: #d9fdd3; color: #008069; }
        .st12-role-deputy { background: #dbeafe; color: #1d4ed8; }
        .st12-member-row {
            display: flex; align-items: center; gap: 10px; padding: 7px 6px;
            border-bottom: 1px solid #eee; cursor: pointer;
        }
        .st12-member-row:hover { background: #eef6ff; }
    `;
    document.head.appendChild(st);
}

// ============================================================
// === ИНИЦИАЛИЗАЦИЯ И ПЕРЕОПРЕДЕЛЕНИЯ ЭТАПА 12 ===
// ============================================================
function initStage12() {
    // 1. Новое окно создания группы (название + фото + участники)
    window.createNewCloudChat = openSt12CreateGroupModal;

    // 2. Видимость групповых чатов по списку участников (если список задан)
    window.isChatVisibleToMe = function(c) {
        let myTab = appState.user?.tab || '';
        if (!myTab) return false;
        if (c.isGroup === false) {
            if (Array.isArray(c.participants)) return c.participants.includes(myTab);
            return (c.id || '').split('_').includes(myTab);
        }
        if (Array.isArray(c.members) && c.members.length > 0) {
            return c.members.includes(myTab);
        }
        return true;
    };

    // 3. Обновляем вывод сообщений (аватарка, клик по ФИО, контекстное меню, статус прочтения)
    window.subscribeToChatMessages = subscribeStage12ChatMessages;

    // 4. Обновляем карточку инфо о группе / личном чате
    window.openWaChatInfoModal = openStage12ChatInfoModal;

    // 5. Маска +7 в окне «Пригласить / найти друга»
    bindPhonePlus7Mask('contactManualPhone');
    const _origOpenContacts = window.openContactsInviteModal;
    window.openContactsInviteModal = function() {
        if (typeof _origOpenContacts === 'function') _origOpenContacts();
        let inp = document.getElementById('contactManualPhone');
        if (inp) {
            inp.value = '+7 ';
            inp.placeholder = '+7 9XX XXX-XX-XX';
        }
    };

    // Перерисовываем чат, если он уже открыт
    if (document.getElementById('chats-screen')?.classList.contains('active-screen')) {
        renderCloudChatsLayout();
    }
}

// ============================================================
// === 1. АВТОПОДСТАНОВКА +7 ПРИ ВВОДЕ НОМЕРА ТЕЛЕФОНА ===
// ============================================================
function bindPhonePlus7Mask(inputId) {
    let inp = document.getElementById(inputId);
    if (!inp || inp.dataset.maskBound) return;
    inp.dataset.maskBound = '1';

    const formatRuPhone = () => {
        let digits = inp.value.replace(/\D/g, '');
        if (digits.startsWith('7') || digits.startsWith('8')) digits = digits.slice(1);
        digits = digits.slice(0, 10);
        let out = '+7 ';
        if (digits.length > 0) out += digits.slice(0, 3);
        if (digits.length > 3) out += ' ' + digits.slice(3, 6);
        if (digits.length > 6) out += '-' + digits.slice(6, 8);
        if (digits.length > 8) out += '-' + digits.slice(8, 10);
        inp.value = out;
    };

    inp.addEventListener('focus', () => {
        if (!inp.value.trim().startsWith('+7')) inp.value = '+7 ';
        setTimeout(() => inp.setSelectionRange(inp.value.length, inp.value.length), 0);
    });
    inp.addEventListener('input', formatRuPhone);
}

// ============================================================
// === 2. СОЗДАНИЕ ГРУППЫ (НАЗВАНИЕ + ФОТО + УЧАСТНИКИ) ===
// ============================================================
function openSt12CreateGroupModal() {
    st12State.newGroupPhoto = '';
    document.getElementById('st12GrpName').value = '';
    document.getElementById('st12GrpAbout').value = '';
    document.getElementById('st12GrpPhotoPreview').innerHTML = '📷';

    let myTab = appState.user?.tab || '';
    let box = document.getElementById('st12GrpMembersList');
    box.innerHTML = (appState.workers || []).map(w => {
        let isMe = w.tab === myTab;
        return `
            <label style="display:flex;align-items:center;gap:8px;padding:6px;border-bottom:1px solid #eee;cursor:pointer;font-size:13px;">
                <input type="checkbox" class="st12-new-grp-cb" value="${st12Esc(w.tab)}" ${isMe ? 'checked disabled' : ''} style="width:17px;height:17px;">
                <span><strong>${st12Esc(w.fio)}</strong> ${isMe ? '<small style="color:#008069;">(Вы — Админ)</small>' : `<small style="color:#666;">(${st12Esc(w.sector || w.station || '')})</small>`}</span>
            </label>
        `;
    }).join('');
    openModal('st12CreateGroupModal');
}

function handleSt12NewGroupPhoto(e) {
    let f = e.target.files[0]; if (!f) return;
    compressImageFile(f, 220, 0.72, dataUrl => {
        st12State.newGroupPhoto = dataUrl;
        document.getElementById('st12GrpPhotoPreview').innerHTML = `<img src="${dataUrl}" class="wa-avatar-img">`;
    });
    e.target.value = '';
}

function confirmSt12CreateGroup() {
    let name = document.getElementById('st12GrpName').value.trim();
    if (!name) return alert("Введите название группы!");
    let about = document.getElementById('st12GrpAbout').value.trim();
    let myTab = appState.user?.tab || 'unknown';
    let members = Array.from(document.querySelectorAll('.st12-new-grp-cb:checked')).map(c => c.value);
    if (!members.includes(myTab)) members.unshift(myTab);

    let avatar = name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
    let obj = {
        id: 'chat_' + Date.now(),
        name,
        avatar,
        photo: st12State.newGroupPhoto || '',
        description: about || 'Рабочая группа',
        isGroup: true,
        creatorTab: myTab,
        roles: { [myTab]: 'admin' },
        members,
        lastText: 'Группа создана',
        lastTime: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        lastTs: Date.now()
    };

    if (db) db.collection('chats').doc(obj.id).set(obj);
    else cloudChatsList.unshift(obj);

    closeModal('st12CreateGroupModal');
    openCloudChat(obj.id);
    showSyncToast(`✅ Группа «${name}» создана`);
}

// ============================================================
// === 3. РОЛИ В ГРУППЕ И КАРТОЧКА ИНФОРМАЦИИ О ЧАТЕ        ===
// ============================================================
function getMemberRoleInChat(chat, tab) {
    if (!chat) return 'member';
    if (chat.creatorTab === tab) return 'admin';
    return chat.roles?.[tab] || 'member';
}

function isMeAdminInChat(chat) {
    let myTab = appState.user?.tab || '';
    if (!chat || !myTab) return false;
    if (!chat.creatorTab) return true; // для старых групп по умолчанию
    return getMemberRoleInChat(chat, myTab) === 'admin';
}

function isMeAdminOrDeputy(chat) {
    let myTab = appState.user?.tab || '';
    let r = getMemberRoleInChat(chat, myTab);
    return !chat.creatorTab || r === 'admin' || r === 'deputy';
}

function getGroupMembersWorkers(chat) {
    let all = appState.workers || [];
    if (Array.isArray(chat.members) && chat.members.length > 0) {
        return chat.members.map(tab => all.find(w => w.tab === tab) || { tab, fio: `Таб. ${tab}`, sector: '' });
    }
    return all;
}

function extractLinksFromText(text) {
    if (!text) return [];
    let re = /((https?:\/\/|www\.)[^\s]+|[a-zA-Z0-9.-]+\.(ru|com|org|net|io|рф)(\/[^\s]*)?)/gi;
    return text.match(re) || [];
}

function openStage12ChatInfoModal() {
    let c = cloudChatsList.find(x => x.id === activeChatId);
    if (!c) return;
    st12State.infoTab = 'media';
    renderStage12ChatInfoBody(c);
    openModal('waInfoModal');
}

function switchSt12InfoTab(tab) {
    st12State.infoTab = tab;
    let c = cloudChatsList.find(x => x.id === activeChatId);
    if (c) renderStage12ChatInfoBody(c);
}

function renderStage12ChatInfoBody(c) {
    let meta = getChatDisplayMeta(c);
    let body = document.getElementById('waInfoModalBody');
    let myTab = appState.user?.tab || '';
    let amAdmin = isMeAdminInChat(c);
    let amMod = isMeAdminOrDeputy(c);

    // Фильтруем сообщения, не удалённые для меня
    let msgs = (st7State.activeChatMsgs || []).filter(m => !Array.isArray(m.deletedFor) || !m.deletedFor.includes(myTab));
    let mediaMsgs = msgs.filter(m => m.img || m.video);
    let voiceMsgs = msgs.filter(m => m.audio);
    let linkItems = [];
    msgs.forEach(m => {
        extractLinksFromText(m.text).forEach(url => {
            linkItems.push({ url, sender: m.sender, time: m.time });
        });
    });

    let tabContent = '';
    if (st12State.infoTab === 'media') {
        tabContent = mediaMsgs.length === 0
            ? '<div style="font-size:12px;color:#666;text-align:center;padding:12px;">Фотографий и видео пока нет</div>'
            : `<div class="wa-media-grid">${mediaMsgs.map(m =>
                m.img
                    ? `<img src="${m.img}" class="wa-media-thumb" onclick="window.open('${m.img}','_blank')">`
                    : `<video src="${m.video}" class="wa-media-thumb" controls></video>`
            ).join('')}</div>`;
    } else if (st12State.infoTab === 'voice') {
        tabContent = voiceMsgs.length === 0
            ? '<div style="font-size:12px;color:#666;text-align:center;padding:12px;">Голосовых сообщений пока нет</div>'
            : voiceMsgs.map(m => `
                <div style="padding:6px 0;border-bottom:1px solid #eee;font-size:12px;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:3px;"><strong>${st12Esc(m.sender)}</strong><span style="color:#666;">${m.time || ''}</span></div>
                    <audio controls src="${m.audio}" style="width:100%;height:32px;"></audio>
                </div>
            `).join('');
    } else {
        tabContent = linkItems.length === 0
            ? '<div style="font-size:12px;color:#666;text-align:center;padding:12px;">Ссылок в чате пока нет</div>'
            : linkItems.map(l => {
                let href = l.url.startsWith('http') ? l.url : 'https://' + l.url;
                return `<div style="padding:6px 0;border-bottom:1px solid #eee;font-size:12px;">
                    <a href="${st12Esc(href)}" target="_blank" style="color:#0055aa;word-break:break-all;font-weight:bold;">🔗 ${st12Esc(l.url)}</a>
                    <div style="font-size:11px;color:#666;">${st12Esc(l.sender)} • ${l.time || ''}</div>
                </div>`;
            }).join('');
    }

    let tabsBlock = `
        <div class="st12-tabs">
            <button type="button" class="st12-tab-btn ${st12State.infoTab==='media'?'active':''}" onclick="switchSt12InfoTab('media')">🖼️ Медиафайлы (${mediaMsgs.length})</button>
            <button type="button" class="st12-tab-btn ${st12State.infoTab==='voice'?'active':''}" onclick="switchSt12InfoTab('voice')">🎤 Голосовые (${voiceMsgs.length})</button>
            <button type="button" class="st12-tab-btn ${st12State.infoTab==='links'?'active':''}" onclick="switchSt12InfoTab('links')">🔗 Ссылки (${linkItems.length})</button>
        </div>
        <div class="st12-tab-panel">${tabContent}</div>
    `;

    // === ЛИЧНЫЙ ЧАТ 1-НА-1 ===
    if (!meta.isGroup) {
        let w = meta.peerWorker || {};
        body.innerHTML = `
            <div style="text-align:center;margin-bottom:10px;">
                <div class="wa-avatar" style="width:92px;height:92px;font-size:30px;margin:0 auto 8px;overflow:hidden;">${renderAvatarInner(meta.photo, meta.avatarText)}</div>
                <h3 style="margin:0;">${st12Esc(meta.name)}</h3>
                <div style="font-size:12px;color:#666;margin-top:4px;">📞 ${st12Esc(w.phone || 'Телефон не указан')} • 🏢 ${st12Esc(w.sector || w.station || 'Участок не указан')}</div>
            </div>
            ${tabsBlock}
        `;
        return;
    }

    // === ГРУППОВОЙ ЧАТ ===
    let members = getGroupMembersWorkers(c);
    let membersHtml = members.map(w => {
        let role = getMemberRoleInChat(c, w.tab);
        let badge = role === 'admin'
            ? `<span class="st12-role-badge st12-role-admin">${c.creatorTab === w.tab ? 'Админ (Создатель)' : 'Админ'}</span>`
            : (role === 'deputy' ? '<span class="st12-role-badge st12-role-deputy">Зам. админа</span>' : '');
        let init = (w.fio || 'С').split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase();
        return `
            <div class="st12-member-row" onclick="onSt12GroupMemberClick('${st12Esc(w.tab)}')">
                <div class="wa-avatar" style="width:36px;height:36px;min-width:36px;font-size:12px;overflow:hidden;">${renderAvatarInner(w.avatar, init)}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;font-weight:600;">${st12Esc(w.fio)}${badge}</div>
                    <div style="font-size:11px;color:#666;">${st12Esc(w.sector || w.station || 'Сотрудник')}</div>
                </div>
            </div>
        `;
    }).join('');

    body.innerHTML = `
        <div class="st12-info-head-bar">
            <span style="font-size:12px;color:#666;font-weight:bold;">Информация о группе</span>
            <div style="position:relative;">
                <button type="button" class="st12-dots-btn" onclick="toggleSt12DotsMenu()" title="Меню группы">⋮</button>
                <div id="st12DotsMenu" class="st12-dots-dropdown">
                    ${amMod ? `<div class="st12-dots-opt" onclick="openSt12AddMembersModal()">➕ Добавить участников</div>` : ''}
                    ${amMod ? `<div class="st12-dots-opt" onclick="st12PromptRenameGroup()">✏️ Изменить название</div>` : ''}
                    ${amMod ? `<div class="st12-dots-opt" onclick="openSt12KickMembersModal()">🚫 Изгнать участников</div>` : ''}
                    ${amAdmin ? `<div class="st12-dots-opt danger" onclick="st12DeleteActiveGroup()">🗑️ Удалить группу</div>` : ''}
                </div>
            </div>
        </div>

        <div style="text-align:center;margin-bottom:8px;">
            <div class="wa-avatar group" id="waGroupAvPreview" style="width:94px;height:94px;font-size:30px;margin:0 auto 6px;overflow:hidden;cursor:pointer;border:3px solid #00a884;"
                onclick="document.getElementById('waGroupPhotoFile').click()" title="Нажмите, чтобы изменить фото группы">
                ${renderAvatarInner(meta.photo, meta.avatarText)}
            </div>
            <input type="file" id="waGroupPhotoFile" accept="image/*" style="display:none;" onchange="handleGroupPhotoUpload(event)">
            <div style="font-size:11px;color:#008069;cursor:pointer;" onclick="document.getElementById('waGroupPhotoFile').click()">Изменить фото</div>
            <h3 style="margin:6px 0 0;">${st12Esc(meta.name)}</h3>
        </div>

        <!-- О ГРУППЕ + СЕРЫЙ КАРАНДАШИК СПРАВА -->
        <div class="st12-about-box">
            <div style="flex:1;min-width:0;">
                <div style="font-size:11px;color:#666;font-weight:bold;">О группе:</div>
                <div style="font-size:13px;color:#111b21;">${st12Esc(c.description || 'Описание не добавлено')}</div>
            </div>
            <button type="button" class="st12-gray-pencil" onclick="st12EditGroupAbout()" title="Редактировать описание">✏️</button>
        </div>

        ${tabsBlock}

        <!-- УЧАСТНИКИ И КОЛИЧЕСТВО -->
        <div style="font-size:13px;font-weight:bold;color:#003366;margin:6px 0;">👥 Участники: ${members.length}</div>
        <div style="max-height:190px;overflow-y:auto;border:1px solid #e5e7eb;border-radius:8px;background:#fff;">
            ${membersHtml}
        </div>
    `;
}

function toggleSt12DotsMenu() {
    let m = document.getElementById('st12DotsMenu');
    if (m) m.style.display = m.style.display === 'block' ? 'none' : 'block';
}

function st12EditGroupAbout() {
    let c = cloudChatsList.find(x => x.id === activeChatId); if (!c) return;
    let txt = prompt("О группе:", c.description || "");
    if (txt === null) return;
    c.description = txt.trim();
    if (db) db.collection('chats').doc(c.id).set({ description: c.description }, { merge: true });
    renderStage12ChatInfoBody(c);
    showSyncToast("☁️ Описание группы обновлено");
}

function st12PromptRenameGroup() {
    toggleSt12DotsMenu();
    let c = cloudChatsList.find(x => x.id === activeChatId); if (!c) return;
    let name = prompt("Новое название группы:", c.name || "");
    if (!name || !name.trim()) return;
    c.name = name.trim();
    if (db) db.collection('chats').doc(c.id).set({ name: c.name }, { merge: true });
    let tEl = document.getElementById('chatActiveName');
    if (tEl) tEl.innerText = c.name;
    renderChatSidebarList();
    renderStage12ChatInfoBody(c);
}

function openSt12AddMembersModal() {
    toggleSt12DotsMenu();
    let c = cloudChatsList.find(x => x.id === activeChatId); if (!c) return;
    let curTabs = new Set(getGroupMembersWorkers(c).map(w => w.tab));
    let candidates = (appState.workers || []).filter(w => !curTabs.has(w.tab));
    let box = document.getElementById('st12MembersActionList');
    document.getElementById('st12MembersActionTitle').innerText = '➕ Добавить участников';
    document.getElementById('st12MembersActionBtn').innerText = 'Добавить выбранных';
    document.getElementById('st12MembersActionBtn').onclick = confirmSt12AddMembers;
    box.innerHTML = candidates.length === 0
        ? '<div style="padding:14px;text-align:center;color:#666;">Все сотрудники уже в группе</div>'
        : candidates.map(w => `<label style="display:flex;align-items:center;gap:8px;padding:7px;border-bottom:1px solid #eee;font-size:13px;"><input type="checkbox" class="st12-ma-cb" value="${st12Esc(w.tab)}" style="width:17px;height:17px;"><span><b>${st12Esc(w.fio)}</b> (${st12Esc(w.sector || w.station || '')})</span></label>`).join('');
    openModal('st12MembersActionModal');
}

function confirmSt12AddMembers() {
    let c = cloudChatsList.find(x => x.id === activeChatId); if (!c) return;
    let addTabs = Array.from(document.querySelectorAll('.st12-ma-cb:checked')).map(cb => cb.value);
    if (!addTabs.length) return closeModal('st12MembersActionModal');
    let cur = getGroupMembersWorkers(c).map(w => w.tab);
    let merged = Array.from(new Set([...cur, ...addTabs]));
    c.members = merged;
    if (db) db.collection('chats').doc(c.id).set({ members: merged }, { merge: true });
    closeModal('st12MembersActionModal');
    renderStage12ChatInfoBody(c);
    showSyncToast(`✅ Добавлено участников: ${addTabs.length}`);
}

function openSt12KickMembersModal() {
    toggleSt12DotsMenu();
    let c = cloudChatsList.find(x => x.id === activeChatId); if (!c) return;
    let myTab = appState.user?.tab || '';
    // Создателя и самого себя изгнать нельзя
    let list = getGroupMembersWorkers(c).filter(w => w.tab !== c.creatorTab && w.tab !== myTab);
    let box = document.getElementById('st12MembersActionList');
    document.getElementById('st12MembersActionTitle').innerText = '🚫 Изгнать участников';
    document.getElementById('st12MembersActionBtn').innerText = 'Изгнать выбранных';
    document.getElementById('st12MembersActionBtn').onclick = confirmSt12KickMembers;
    box.innerHTML = list.length === 0
        ? '<div style="padding:14px;text-align:center;color:#666;">Нет участников, которых можно изгнать</div>'
        : list.map(w => `<label style="display:flex;align-items:center;gap:8px;padding:7px;border-bottom:1px solid #eee;font-size:13px;"><input type="checkbox" class="st12-ma-cb" value="${st12Esc(w.tab)}" style="width:17px;height:17px;"><span><b>${st12Esc(w.fio)}</b></span></label>`).join('');
    openModal('st12MembersActionModal');
}

function confirmSt12KickMembers() {
    let c = cloudChatsList.find(x => x.id === activeChatId); if (!c) return;
    let kickSet = new Set(Array.from(document.querySelectorAll('.st12-ma-cb:checked')).map(cb => cb.value));
    kickSet.delete(c.creatorTab); // защита создателя
    if (!kickSet.size) return closeModal('st12MembersActionModal');
    let nextMembers = getGroupMembersWorkers(c).map(w => w.tab).filter(t => !kickSet.has(t));
    c.members = nextMembers;
    if (db) db.collection('chats').doc(c.id).set({ members: nextMembers }, { merge: true });
    closeModal('st12MembersActionModal');
    renderStage12ChatInfoBody(c);
    showSyncToast(`🚫 Участники удалены из группы`);
}

function st12DeleteActiveGroup() {
    toggleSt12DotsMenu();
    let c = cloudChatsList.find(x => x.id === activeChatId); if (!c) return;
    if (!isMeAdminInChat(c)) return alert("Удалить группу может только Админ!");
    if (!confirm(`Удалить группу «${c.name}» для всех участников?`)) return;
    cloudChatsList = cloudChatsList.filter(x => x.id !== c.id);
    if (db) db.collection('chats').doc(c.id).delete().catch(() => {});
    closeModal('waInfoModal');
    activeChatId = cloudChatsList.filter(isChatVisibleToMe)[0]?.id || '';
    renderCloudChatsLayout();
    showSyncToast("🗑️ Группа удалена");
}

// Нажатие на участника в списке участников группы (назначить Админом / Зам. админа / Обычным)
function onSt12GroupMemberClick(tab) {
    let c = cloudChatsList.find(x => x.id === activeChatId);
    let w = (appState.workers || []).find(x => x.tab === tab);
    if (!c || !w) return;
    let myTab = appState.user?.tab || '';

    // Если нажали не админ или на создателя — просто показываем карточку сотрудника (написать в ЛС)
    if (!isMeAdminInChat(c) || tab === c.creatorTab || tab === myTab) {
        openSt12UserProfilePopup(tab);
        return;
    }

    st12State.manageMemberTab = tab;
    document.getElementById('st12RoleModalName').innerText = w.fio;
    openModal('st12MemberRoleModal');
}

function setSt12MemberRole(newRole) {
    let c = cloudChatsList.find(x => x.id === activeChatId);
    let tab = st12State.manageMemberTab;
    if (!c || !tab) return;
    if (tab === c.creatorTab) return alert("Нельзя изменить роль создателя группы!");
    let roles = { ...(c.roles || {}) };
    roles[tab] = newRole;
    c.roles = roles;
    if (db) db.collection('chats').doc(c.id).set({ roles }, { merge: true });
    closeModal('st12MemberRoleModal');
    renderStage12ChatInfoBody(c);
    showSyncToast("☁️ Роль участника обновлена");
}

// ============================================================
// === 4. КАРТОЧКА ПРОФИЛЯ СОТРУДНИКА ПО КЛИКУ НА ФИО В ЧАТЕ ===
// ============================================================
function openSt12UserProfilePopup(tab) {
    let w = (appState.workers || []).find(x => x.tab === tab);
    if (!w) return;
    let init = (w.fio || 'С').split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase();
    document.getElementById('st12PopAv').innerHTML = renderAvatarInner(w.avatar, init);
    document.getElementById('st12PopFio').innerText = w.fio;
    document.getElementById('st12PopMeta').innerText = `${w.sector || w.station || 'Сотрудник'}${w.phone ? ' • ' + w.phone : ''}`;
    let btn = document.getElementById('st12PopDmBtn');
    let isMe = w.tab === appState.user?.tab;
    btn.style.display = isMe ? 'none' : 'block';
    btn.onclick = () => {
        closeModal('st12UserProfileModal');
        closeModal('waInfoModal');
        startPrivateDmWithWorker(w);
    };
    openModal('st12UserProfileModal');
}

// ============================================================
// === 5. СООБЩЕНИЯ С ФОТО ПРОФИЛЯ + КОНТЕКСТНОЕ МЕНЮ       ===
// ============================================================
function subscribeStage12ChatMessages(chatId) {
    let msgsBox = document.getElementById('chatMsgs');
    if (!msgsBox) return;
    if (activeChatUnsub) { activeChatUnsub(); activeChatUnsub = null; }
    if (typeof db === 'undefined' || !db) return;

    let chatObj = cloudChatsList.find(c => c.id === chatId);
    let isGroupChat = chatObj ? chatObj.isGroup !== false : true;

    activeChatUnsub = db.collection('chat_messages')
        .where('chatId', '==', chatId)
        .onSnapshot(snap => {
            let myTab = appState.user?.tab || '';
            let nowTime = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            let list = [];

            snap.forEach(d => {
                let m = d.data();
                if (Array.isArray(m.deletedFor) && m.deletedFor.includes(myTab)) return;
                list.push(m);
                // Отмечаем прочтение для окна «Данные»
                if (myTab && m.tab !== myTab && (!m.readBy || !m.readBy[myTab])) {
                    db.collection('chat_messages').doc(m.id).set({ readBy: { [myTab]: nowTime } }, { merge: true }).catch(() => {});
                }
            });

            list.sort((a, b) => (a.ts || 0) - (b.ts || 0));
            st7State.activeChatMsgs = list;

            let mq = (waState.msgSearchQuery || '').trim().toLowerCase();
            if (mq) list = list.filter(m => (m.text || '').toLowerCase().includes(mq) || (m.sender || '').toLowerCase().includes(mq));

            if (list.length === 0) {
                msgsBox.innerHTML = '<div class="wa-date-pill">Сообщений пока нет. Напишите первым!</div>';
                return;
            }

            let html = '', lastDate = '';
            list.forEach(m => {
                let dStr = m.date || new Date(m.ts || Date.now()).toLocaleDateString('ru-RU');
                if (dStr !== lastDate) { html += `<div class="wa-date-pill">${dStr}</div>`; lastDate = dStr; }
                let isMine = m.tab === myTab;
                let senderW = (appState.workers || []).find(w => w.tab === m.tab);
                let sInit = (m.sender || 'К').split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase();

                let avHtml = (!isMine && isGroupChat)
                    ? `<div class="wa-msg-mini-av" onclick="event.stopPropagation();openSt12UserProfilePopup('${st12Esc(m.tab)}')" title="Профиль">${renderAvatarInner(senderW?.avatar, sInit)}</div>`
                    : '';
                let senderHeader = (!isMine && isGroupChat)
                    ? `<div class="wa-sender wa-sender-link" onclick="event.stopPropagation();openSt12UserProfilePopup('${st12Esc(m.tab)}')">${st12Esc(m.sender || 'Коллега')}</div>`
                    : '';

                let fwdHtml = m.forwarded ? `<div class="wa-fwd-tag">↪️ Пересланное сообщение</div>` : '';
                let quoteHtml = m.replyTo ? `<div class="wa-quote"><strong style="color:#008069;">${st12Esc(m.replyTo.sender)}</strong><br>${st12Esc(m.replyTo.text)}</div>` : '';
                let imgHtml = m.img ? `<img src="${m.img}" class="wa-img-attach" onclick="event.stopPropagation();window.open(this.src,'_blank')">` : '';
                let videoHtml = m.video ? `<video controls playsinline src="${m.video}" class="wa-video-attach" onclick="event.stopPropagation()"></video>` : '';
                let audioHtml = m.audio ? `<audio controls src="${m.audio}" class="wa-audio-attach" onclick="event.stopPropagation()"></audio>` : '';

                html += `
                    <div class="wa-msg-row ${isMine ? 'out' : 'in'}">
                        ${avHtml}
                        <div class="wa-bubble ${isMine ? 'out' : 'in'}"
                            oncontextmenu="event.preventDefault();openSt12MsgContextMenu('${st12Esc(m.id)}')"
                            ontouchstart="startSt12MsgPress('${st12Esc(m.id)}')"
                            ontouchend="cancelSt12MsgPress()"
                            ontouchmove="cancelSt12MsgPress()">
                            ${senderHeader}${fwdHtml}${quoteHtml}${imgHtml}${videoHtml}${audioHtml}
                            ${m.text ? `<div>${st12Esc(m.text)}</div>` : ''}
                            <div class="wa-meta"><span>${m.time || ''}</span>${isMine ? '<span class="wa-ticks">✓✓</span>' : ''}</div>
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

function startSt12MsgPress(msgId) {
    cancelSt12MsgPress();
    st12State.pressTimer = setTimeout(() => {
        openSt12MsgContextMenu(msgId);
    }, 450);
}
function cancelSt12MsgPress() {
    if (st12State.pressTimer) { clearTimeout(st12State.pressTimer); st12State.pressTimer = null; }
}

function openSt12MsgContextMenu(msgId) {
    st12State.ctxMsgId = msgId;
    document.getElementById('st12CtxOverlay').style.display = 'flex';
}
function closeSt12MsgContextMenu() {
    document.getElementById('st12CtxOverlay').style.display = 'none';
}

function getCtxMsgObj() {
    return (st7State.activeChatMsgs || []).find(m => m.id === st12State.ctxMsgId) || null;
}

// 1) ОТВЕТИТЬ (⬅️)
function ctxActionReply() {
    let m = getCtxMsgObj(); closeSt12MsgContextMenu(); if (!m) return;
    let preview = m.text || (m.img ? '📷 Фото' : (m.video ? '🎬 Видео' : (m.audio ? '🎤 Голосовое' : 'Сообщение')));
    setWaReply(m.sender || 'Коллега', preview);
}

// 2) ПЕРЕСЛАТЬ (➡️)
function ctxActionForward() {
    let m = getCtxMsgObj(); closeSt12MsgContextMenu(); if (!m) return;
    let box = document.getElementById('st12ForwardList');
    let myTab = appState.user?.tab || '';
    let visChats = (cloudChatsList || []).filter(isChatVisibleToMe);

    let html = `<div style="font-size:12px;font-weight:bold;color:#008069;margin-bottom:4px;">Группы и чаты:</div>`;
    html += visChats.map(c => {
        let meta = getChatDisplayMeta(c);
        return `<div class="st12-member-row" onclick="executeSt12ForwardToChat('${st12Esc(c.id)}')">
            <div class="wa-avatar ${meta.isGroup?'group':''}" style="width:34px;height:34px;min-width:34px;font-size:12px;overflow:hidden;">${renderAvatarInner(meta.photo, meta.avatarText)}</div>
            <div style="font-size:13px;font-weight:600;">${st12Esc(meta.name)}</div>
        </div>`;
    }).join('');

    html += `<div style="font-size:12px;font-weight:bold;color:#008069;margin:10px 0 4px;">Сотрудники (лично):</div>`;
    html += (appState.workers || []).filter(w => w.tab !== myTab).map(w => {
        let init = (w.fio || 'С').split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase();
        return `<div class="st12-member-row" onclick="executeSt12ForwardToWorker('${st12Esc(w.tab)}')">
            <div class="wa-avatar" style="width:34px;height:34px;min-width:34px;font-size:12px;overflow:hidden;">${renderAvatarInner(w.avatar, init)}</div>
            <div style="font-size:13px;">${st12Esc(w.fio)}</div>
        </div>`;
    }).join('');

    box.innerHTML = html;
    openModal('st12ForwardModal');
}

function executeSt12ForwardToChat(targetChatId) {
    let m = getCtxMsgObj(); if (!m) return;
    let now = new Date();
    let timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    let ts = Date.now();
    let newMsg = {
        id: 'msg_' + ts + '_' + Math.floor(Math.random() * 1000),
        chatId: targetChatId,
        tab: appState.user?.tab || 'unknown',
        sender: appState.user?.fio || 'Сотрудник',
        text: m.text || '', img: m.img || '', video: m.video || '', audio: m.audio || '',
        forwarded: true,
        time: timeStr, date: now.toLocaleDateString('ru-RU'), ts
    };
    let preview = m.img ? '📷 Фото' : (m.video ? '🎬 Видео' : (m.audio ? '🎤 Голосовое' : (m.text || 'Переслано')));
    if (db) {
        db.collection('chat_messages').doc(newMsg.id).set(newMsg);
        db.collection('chats').doc(targetChatId).set({ lastText: '↪️ ' + preview, lastTime: timeStr, lastTs: ts }, { merge: true });
    }
    closeModal('st12ForwardModal');
    showSyncToast("↪️ Сообщение переслано");
}

function executeSt12ForwardToWorker(targetTab) {
    let w = (appState.workers || []).find(x => x.tab === targetTab);
    if (!w) return;
    let myTab = appState.user?.tab || '0';
    let myFio = appState.user?.fio || 'Я';
    let pair = [myTab, w.tab].sort();
    let pairId = 'dm_' + pair.join('_');
    if (db) {
        db.collection('chats').doc(pairId).set({
            id: pairId, name: w.fio, isGroup: false,
            participants: pair, participantNames: { [myTab]: myFio, [w.tab]: w.fio }
        }, { merge: true });
    }
    executeSt12ForwardToChat(pairId);
}

// 3) КОПИРОВАТЬ (📋)
function ctxActionCopy() {
    let m = getCtxMsgObj(); closeSt12MsgContextMenu(); if (!m) return;
    let txt = m.text || '';
    if (!txt) return showSyncToast("В этом сообщении нет текста");
    if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => showSyncToast("📋 Текст скопирован"));
    else prompt("Скопируйте текст:", txt);
}

// 4) УДАЛИТЬ (🗑️ — у всех или только у себя)
function ctxActionDelete() {
    let m = getCtxMsgObj(); closeSt12MsgContextMenu(); if (!m) return;
    let myTab = appState.user?.tab || '';
    let c = cloudChatsList.find(x => x.id === activeChatId);
    let canDelAll = (m.tab === myTab) || (c && isMeAdminInChat(c));
    document.getElementById('st12DelForAllBtn').style.display = canDelAll ? 'block' : 'none';
    openModal('st12DeleteMsgModal');
}

function executeSt12DeleteMsg(forAll) {
    let m = getCtxMsgObj(); if (!m) return;
    let myTab = appState.user?.tab || '';
    if (forAll) {
        if (db) db.collection('chat_messages').doc(m.id).delete().catch(() => {});
        showSyncToast("🗑️ Сообщение удалено у всех");
    } else {
        let cur = Array.isArray(m.deletedFor) ? m.deletedFor : [];
        if (!cur.includes(myTab)) cur.push(myTab);
        if (db) db.collection('chat_messages').doc(m.id).set({ deletedFor: cur }, { merge: true }).catch(() => {});
        showSyncToast("🗑️ Сообщение удалено у вас");
    }
    closeModal('st12DeleteMsgModal');
}

// 5) ДАННЫЕ (ℹ️ — кто прочитал, а кто нет)
function ctxActionInfo() {
    let m = getCtxMsgObj(); closeSt12MsgContextMenu(); if (!m) return;
    let c = cloudChatsList.find(x => x.id === activeChatId);
    let members = c && c.isGroup === false
        ? (appState.workers || []).filter(w => (c.participants || []).includes(w.tab))
        : getGroupMembersWorkers(c || {});

    let readBy = m.readBy || {};
    let readList = [];
    let unreadList = [];

    members.forEach(w => {
        if (w.tab === m.tab) return; // отправителя не считаем
        if (readBy[w.tab]) readList.push({ fio: w.fio, time: readBy[w.tab] });
        else unreadList.push({ fio: w.fio });
    });

    document.getElementById('st12MsgDataBody').innerHTML = `
        <div style="background:#f4f6f9;padding:8px 10px;border-radius:6px;margin-bottom:10px;font-size:12px;">
            <strong>Отправитель:</strong> ${st12Esc(m.sender)} (${m.date || ''} ${m.time || ''})
        </div>
        <div style="font-size:13px;font-weight:bold;color:#008069;margin-bottom:4px;">✓✓ Прочитали (${readList.length}):</div>
        <div style="max-height:130px;overflow-y:auto;border:1px solid #e5e7eb;border-radius:6px;padding:6px;margin-bottom:10px;font-size:12px;">
            ${readList.length ? readList.map(r => `<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px dashed #eee;"><span>${st12Esc(r.fio)}</span><span style="color:#008069;">${st12Esc(r.time)}</span></div>`).join('') : '<div style="color:#666;">Пока никто не прочитал</div>'}
        </div>
        <div style="font-size:13px;font-weight:bold;color:#666;margin-bottom:4px;">⏳ Не прочитали (${unreadList.length}):</div>
        <div style="max-height:130px;overflow-y:auto;border:1px solid #e5e7eb;border-radius:6px;padding:6px;font-size:12px;">
            ${unreadList.length ? unreadList.map(u => `<div style="padding:4px 0;border-bottom:1px dashed #eee;">${st12Esc(u.fio)}</div>`).join('') : '<div style="color:#008069;">Прочитали все участники!</div>'}
        </div>
    `;
    openModal('st12MsgDataModal');
}

// ============================================================
// === ИНЪЕКЦИЯ МОДАЛЬНЫХ ОКОН ЭТАПА 12 ===
// ============================================================
function injectStage12Modals() {
    let wrap = document.createElement('div');
    wrap.innerHTML = `
        <!-- КОНТЕКСТНОЕ МЕНЮ СООБЩЕНИЯ -->
        <div id="st12CtxOverlay" class="st12-ctx-overlay" onclick="closeSt12MsgContextMenu()">
            <div class="st12-ctx-menu" onclick="event.stopPropagation()">
                <div class="st12-ctx-item" onclick="ctxActionReply()"><span>⬅️</span> Ответить</div>
                <div class="st12-ctx-item" onclick="ctxActionForward()"><span>➡️</span> Переслать</div>
                <div class="st12-ctx-item" onclick="ctxActionCopy()"><span>📋</span> Копировать</div>
                <div class="st12-ctx-item" onclick="ctxActionInfo()"><span>ℹ️</span> Данные</div>
                <div class="st12-ctx-item danger" onclick="ctxActionDelete()"><span>🗑️</span> Удалить</div>
            </div>
        </div>

        <!-- СОЗДАТЬ ГРУППУ (НАЗВАНИЕ + ФОТО + УЧАСТНИКИ) -->
        <div id="st12CreateGroupModal" class="modal">
            <div class="modal-content">
                <h3 style="margin-top:0;">👥 Создать новую группу</h3>
                <div style="display:flex;align-items:center;gap:14px;margin-bottom:12px;">
                    <div id="st12GrpPhotoPreview" onclick="document.getElementById('st12GrpPhotoInp').click()"
                        style="width:68px;height:68px;min-width:68px;border-radius:50%;background:#008069;color:#fff;font-size:26px;display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;border:2px solid #00a884;">📷</div>
                    <input type="file" id="st12GrpPhotoInp" accept="image/*" style="display:none;" onchange="handleSt12NewGroupPhoto(event)">
                    <div style="flex:1;">
                        <label style="font-size:12px;font-weight:bold;">Название группы:</label>
                        <input id="st12GrpName" class="form-input" placeholder="Например, Участок Клин">
                    </div>
                </div>
                <div class="form-group">
                    <label>О группе (необязательно):</label>
                    <input id="st12GrpAbout" class="form-input" placeholder="Описание группы...">
                </div>
                <div class="form-group">
                    <label>Добавить участников:</label>
                    <div id="st12GrpMembersList" style="max-height:200px;overflow-y:auto;border:1px solid #ddd;border-radius:6px;padding:4px;"></div>
                </div>
                <div style="display:flex;gap:10px;">
                    <button class="btn-success" onclick="confirmSt12CreateGroup()">Создать группу</button>
                    <button class="btn-secondary" onclick="closeModal('st12CreateGroupModal')">Отмена</button>
                </div>
            </div>
        </div>

        <!-- ДОБАВИТЬ / ИЗГНАТЬ УЧАСТНИКОВ -->
        <div id="st12MembersActionModal" class="modal">
            <div class="modal-content" style="max-width:440px;">
                <h3 id="st12MembersActionTitle" style="margin-top:0;">Участники</h3>
                <div id="st12MembersActionList" style="max-height:260px;overflow-y:auto;border:1px solid #ddd;border-radius:6px;"></div>
                <div style="display:flex;gap:10px;margin-top:12px;">
                    <button id="st12MembersActionBtn" class="btn-success">Сохранить</button>
                    <button class="btn-secondary" onclick="closeModal('st12MembersActionModal')">Отмена</button>
                </div>
            </div>
        </div>

        <!-- НАЗНАЧИТЬ РОЛЬ УЧАСТНИКУ В ГРУППЕ -->
        <div id="st12MemberRoleModal" class="modal">
            <div class="modal-content" style="max-width:360px;text-align:center;">
                <h3 id="st12RoleModalName" style="margin-top:0;">Участник</h3>
                <button class="btn-success" onclick="setSt12MemberRole('admin')">👑 Назначить Админом</button>
                <button class="btn-action" style="background:#1d4ed8;" onclick="setSt12MemberRole('deputy')">⭐ Назначить Зам. админа</button>
                <button class="btn-warning" onclick="setSt12MemberRole('member')">👤 Сделать обычным сотрудником</button>
                <button class="btn-action" style="background:#008069;" onclick="closeModal('st12MemberRoleModal');openSt12UserProfilePopup(st12State.manageMemberTab)">💬 Написать в ЛС</button>
                <button class="btn-secondary" onclick="closeModal('st12MemberRoleModal')">Отмена</button>
            </div>
        </div>

        <!-- ОКНО ПРОФИЛЯ СОТРУДНИКА ПО КЛИКУ НА ФИО В ГРУППЕ -->
        <div id="st12UserProfileModal" class="modal">
            <div class="modal-content" style="max-width:340px;text-align:center;">
                <div id="st12PopAv" class="wa-avatar" style="width:110px;height:110px;font-size:36px;margin:0 auto 12px;overflow:hidden;border:3px solid #00a884;"></div>
                <h3 id="st12PopFio" style="margin:0 0 4px;"></h3>
                <div id="st12PopMeta" style="font-size:12px;color:#666;margin-bottom:14px;"></div>
                <button id="st12PopDmBtn" class="btn-success" style="background:#00a884;">💬 Написать личным сообщением</button>
                <button class="btn-secondary" onclick="closeModal('st12UserProfileModal')">Закрыть</button>
            </div>
        </div>

        <!-- ПЕРЕСЛАТЬ СООБЩЕНИЕ -->
        <div id="st12ForwardModal" class="modal">
            <div class="modal-content" style="max-width:420px;">
                <h3 style="margin-top:0;">↪️ Переслать сообщение</h3>
                <div id="st12ForwardList" style="max-height:320px;overflow-y:auto;"></div>
                <button class="btn-secondary" style="margin-top:10px;" onclick="closeModal('st12ForwardModal')">Отмена</button>
            </div>
        </div>

        <!-- УДАЛИТЬ СООБЩЕНИЕ (У ВСЕХ / У СЕБЯ) -->
        <div id="st12DeleteMsgModal" class="modal">
            <div class="modal-content" style="max-width:340px;text-align:center;">
                <h3 style="margin-top:0;">🗑️ Удалить сообщение?</h3>
                <button id="st12DelForAllBtn" class="btn-danger" onclick="executeSt12DeleteMsg(true)">Удалить у всех</button>
                <button class="btn-warning" onclick="executeSt12DeleteMsg(false)">Удалить только у меня</button>
                <button class="btn-secondary" onclick="closeModal('st12DeleteMsgModal')">Отмена</button>
            </div>
        </div>

        <!-- ДАННЫЕ СООБЩЕНИЯ (КТО ПРОЧИТАЛ) -->
        <div id="st12MsgDataModal" class="modal">
            <div class="modal-content" style="max-width:420px;">
                <h3 style="margin-top:0;">ℹ️ Данные сообщения</h3>
                <div id="st12MsgDataBody"></div>
                <button class="btn-secondary" style="margin-top:10px;" onclick="closeModal('st12MsgDataModal')">Закрыть</button>
            </div>
        </div>
    `;
    document.body.appendChild(wrap);
}
