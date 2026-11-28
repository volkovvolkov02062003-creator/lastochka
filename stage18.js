// ============================================================
// === STAGE 18: АДМИН-УДАЛЕНИЕ С ПОМЕТКОЙ, МЕНЮ ЧАТОВ,     ===
// === КНОПКА «НАЗАД» НА ТЕЛЕФОНЕ, PUSH И СЧЁТЧИК НА ИКОНКЕ ===
// ============================================================
(function initStage18All() {
    // ========================================================
    // 1. УДАЛЕНИЕ СООБЩЕНИЙ: СВОИ — АВТОРУ, ЧУЖИЕ — АДМИНУ
    //    (после удаления админом остаётся пометка в чате)
    // ========================================================
    const ADMIN_DELETED_TEXT = '🚫 Сообщение было удалено Администратором';
    let lastMsgCtx = {
        isMine: true,
        msgId: null,
        text: '',
        time: ''
    };

    function getCurrentChatObj() {
        if (typeof cloudChatsList === 'undefined' || typeof activeChatId === 'undefined') return null;
        return cloudChatsList.find(c => c.id === activeChatId) || null;
    }

    function isGroupChat18(c) {
        if (!c) return false;
        if (typeof isGroupChatSt14 === 'function') return isGroupChatSt14(c);
        if (c.isGroup === false) return false;
        if ((c.id || '').startsWith('dm_')) return false;
        return true;
    }

    function isMeGroupAdmin18(c) {
        if (!c || !isGroupChat18(c)) return false;
        if (typeof isMeAdminInChat === 'function') {
            try { if (isMeAdminInChat(c)) return true; } catch (e) {}
        }
        const myTab = String(appState?.user?.tab || '');
        const myFio = String(appState?.user?.fio || '');
        if (!myTab) return false;
        if (myTab === '8065' || appState?.user?.role === 'founder') return true;
        if (Array.isArray(c.admins) && c.admins.map(String).includes(myTab)) return true;
        if (c.roles && (c.roles[myTab] === 'admin' || c.roles[myTab] === 'creator')) return true;
        if (c.createdByTab && String(c.createdByTab) === myTab) return true;
        if (c.createdBy && myFio && c.createdBy === myFio) return true;
        return false;
    }

    function extractMessageMeta(target) {
        if (!target || !target.closest('#chatMsgs')) return null;
        const el = target.closest('[data-msg-id], [data-id], .wa-msg-row, .msg-row, .wa-msg-bubble, .msg-bubble');
        if (!el) return null;

        let isMine = null;
        const chain = [el, el.parentElement, el.querySelector('.msg-bubble, .wa-msg-bubble')].filter(Boolean);
        for (const node of chain) {
            const cls = node.classList;
            if (!cls) continue;
            if (cls.contains('msg-out') || cls.contains('wa-msg-out') || cls.contains('mine') || cls.contains('out')) {
                isMine = true; break;
            }
            if (cls.contains('msg-in') || cls.contains('wa-msg-in') || cls.contains('in')) {
                isMine = false; break;
            }
        }
        const myTab = String(appState?.user?.tab || '');
        const senderTab = el.getAttribute('data-tab') || el.getAttribute('data-sender-tab');
        if (isMine === null && myTab && senderTab) isMine = (senderTab === myTab);
        if (isMine === null) {
            const st = window.getComputedStyle(el);
            if (st.alignSelf === 'flex-end' || st.justifyContent === 'flex-end') isMine = true;
            else if (st.alignSelf === 'flex-start' || st.justifyContent === 'flex-start') isMine = false;
        }

        // Пытаемся извлечь ID сообщения из атрибутов или обработчиков
        let msgId = el.getAttribute('data-msg-id') || el.getAttribute('data-id') || null;
        if (!msgId) {
            const rawAttrs = (el.outerHTML || '').slice(0, 600);
            const m = rawAttrs.match(/msg_[0-9_]+/);
            if (m) msgId = m[0];
        }

        const rawText = (el.innerText || '').trim();
        const timeMatch = rawText.match(/\b\d{2}:\d{2}\b/);
        return {
            isMine: isMine !== null ? isMine : false,
            msgId,
            text: rawText,
            time: timeMatch ? timeMatch[0] : ''
        };
    }

    function captureMsgTarget(e) {
        const meta = extractMessageMeta(e.target);
        if (meta) {
            lastMsgCtx = meta;
            setTimeout(syncDeleteButtons18, 0);
            setTimeout(syncDeleteButtons18, 80);
        }
    }

    document.addEventListener('contextmenu', captureMsgTarget, true);
    document.addEventListener('touchstart', captureMsgTarget, { capture: true, passive: true });
    document.addEventListener('mousedown', captureMsgTarget, true);

    function isDeleteForAllMsgBtn(el) {
        if (!el || el.closest('#st14ChatCtxOverlay')) return false;
        const txt = (el.innerText || el.textContent || '').trim();
        if (!txt || txt.length > 70) return false;
        if (/групп/i.test(txt)) return false;
        return /удалить.*(у|для)\s*всех/i.test(txt);
    }

    function syncDeleteButtons18() {
        const chatObj = getCurrentChatObj();
        const canAdminDeleteOther = !lastMsgCtx.isMine && isMeGroupAdmin18(chatObj);
        const allowDeleteAll = lastMsgCtx.isMine || canAdminDeleteOther;

        document.querySelectorAll('button, .st12-ctx-item, .st12-dots-opt, [onclick]').forEach(el => {
            if (!isDeleteForAllMsgBtn(el)) return;
            if (!allowDeleteAll) {
                el.style.setProperty('display', 'none', 'important');
                el.setAttribute('data-st18-hidden', '1');
            } else if (el.getAttribute('data-st18-hidden') === '1') {
                el.style.removeProperty('display');
                el.removeAttribute('data-st18-hidden');
            }
        });
    }

    async function adminSoftDeleteMessage() {
        if (typeof db === 'undefined' || !db || typeof activeChatId === 'undefined') return;
        let msgId = lastMsgCtx.msgId || window.st12State?.ctxMsgId || window.st12State?.selectedMsgId || null;

        try {
            if (!msgId) {
                // Резервный поиск сообщения в активном чате по тексту и времени
                const snap = await db.collection('chat_messages').where('chatId', '==', activeChatId).get();
                let candidates = [];
                snap.forEach(d => candidates.push({ id: d.id, ...d.data() }));
                const matched = candidates.find(m =>
                    m.text && lastMsgCtx.text.includes(m.text.slice(0, 30)) &&
                    (!lastMsgCtx.time || m.time === lastMsgCtx.time)
                );
                if (matched) msgId = matched.id;
            }

            if (!msgId) {
                alert('Не удалось определить ID сообщения для удаления.');
                return;
            }

            await db.collection('chat_messages').doc(msgId).set({
                text: ADMIN_DELETED_TEXT,
                deletedByAdmin: true,
                deletedByAdminName: appState?.user?.fio || 'Администратор',
                img: '',
                image: '',
                audio: '',
                voice: '',
                video: '',
                fileData: '',
                fileName: '',
                media: null,
                chunkedMedia: null,
                attachment: null
            }, { merge: true });

            // Закрываем открытые контекстные меню / окна удаления
            document.querySelectorAll('.st12-ctx-overlay, #st12CtxOverlay, #st12DelModal').forEach(o => {
                o.style.display = 'none';
            });
            if (typeof showSyncToast === 'function') {
                showSyncToast('🛡️ Сообщение удалено Администратором');
            }
        } catch (err) {
            console.error('Stage18 admin delete error:', err);
            alert('Ошибка удаления сообщения: ' + (err.message || err));
        }
    }

    // Перехват клика по «Удалить у всех»
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('button, .st12-ctx-item, [onclick]');
        if (!btn || !isDeleteForAllMsgBtn(btn)) return;

        if (lastMsgCtx.isMine) return; // Своё сообщение удаляется стандартно

        const chatObj = getCurrentChatObj();
        e.stopImmediatePropagation();
        e.preventDefault();

        if (isMeGroupAdmin18(chatObj)) {
            if (confirm('Удалить это сообщение у всех от имени Администратора? В чате останется пометка об удалении.')) {
                adminSoftDeleteMessage();
            }
        } else if (typeof showSyncToast === 'function') {
            showSyncToast('⚠️ Чужие сообщения может удалять только Администратор группы');
        }
    }, true);

    function styleAdminDeletedPlaceholders() {
        const box = document.getElementById('chatMsgs');
        if (!box) return;
        box.querySelectorAll('.msg-bubble, .wa-msg-bubble').forEach(b => {
            if (b.innerText && b.innerText.includes('Сообщение было удалено Администратором')) {
                b.style.fontStyle = 'italic';
                b.style.opacity = '0.78';
            }
        });
    }

    // ========================================================
    // 2. МЕНЮ УДАЛЕНИЯ ЧАТОВ (ЛС: удалить чат;
    //    ГРУППА: удалить и выйти + просто удалить чат)
    // ========================================================
    window.executeSt18JustDeleteGroupChat = function() {
        const chatId = window.st14State?.ctxChatId;
        if (typeof closeSt14ChatContextMenu === 'function') closeSt14ChatContextMenu();
        if (!chatId || typeof cloudChatsList === 'undefined') return;

        const c = cloudChatsList.find(x => x.id === chatId);
        if (!c) return;
        const meta = typeof getChatDisplayMeta === 'function' ? getChatDisplayMeta(c) : { name: c.name || 'Группа' };
        if (!confirm(`Просто удалить чат «${meta.name}» из вашего списка (без выхода из группы)?`)) return;

        const myTab = appState?.user?.tab || '';
        const hidden = Array.isArray(c.hiddenFor) ? [...c.hiddenFor] : [];
        if (myTab && !hidden.includes(myTab)) hidden.push(myTab);
        c.hiddenFor = hidden;

        if (typeof db !== 'undefined' && db) {
            db.collection('chats').doc(chatId).set({ hiddenFor: hidden }, { merge: true }).catch(() => {});
        }
        if (typeof activeChatId !== 'undefined' && activeChatId === chatId) {
            const next = cloudChatsList.filter(x => typeof isChatVisibleToMe === 'function' ? isChatVisibleToMe(x) : true)[0];
            activeChatId = next ? next.id : '';
            if (typeof waState !== 'undefined') waState.mobileChatOpen = false;
        }
        if (typeof showSyncToast === 'function') showSyncToast(`🗑️ Чат «${meta.name}» скрыт из списка`);
        if (typeof renderCloudChatsLayout === 'function') renderCloudChatsLayout();
    };

    function patchChatContextMenu18() {
        if (typeof window.openSt14ChatContextMenu !== 'function') return;
        window.openSt14ChatContextMenu = function(chatId) {
            const c = (cloudChatsList || []).find(x => x.id === chatId);
            if (!c) return;
            if (window.st14State) window.st14State.ctxChatId = chatId;

            const meta = typeof getChatDisplayMeta === 'function' ? getChatDisplayMeta(c) : { name: c.name || 'Чат' };
            const isGrp = isGroupChat18(c);
            const amAdmin = isMeGroupAdmin18(c);

            const titleEl = document.getElementById('st14ChatCtxTitle');
            if (titleEl) titleEl.innerText = meta.name;

            let html = '';
            if (isGrp) {
                html += `<div class="st12-ctx-item danger" onclick="executeSt14DeleteOrLeaveChat(false)"><span>🚪</span> Удалить и выйти</div>`;
                html += `<div class="st12-ctx-item" onclick="executeSt18JustDeleteGroupChat()"><span>🗑️</span> Просто удалить чат</div>`;
                if (amAdmin) {
                    html += `<div class="st12-ctx-item danger" onclick="executeSt14DeleteOrLeaveChat(true)"><span>💥</span> Удалить группу у всех</div>`;
                }
            } else {
                html += `<div class="st12-ctx-item danger" onclick="executeSt14DeleteOrLeaveChat(false)"><span>🗑️</span> Удалить чат</div>`;
            }
            html += `<div class="st12-ctx-item" onclick="closeSt14ChatContextMenu()"><span>✕</span> Отмена</div>`;

            const itemsEl = document.getElementById('st14ChatCtxItems');
            if (itemsEl) itemsEl.innerHTML = html;
            const ov = document.getElementById('st14ChatCtxOverlay');
            if (ov) ov.style.display = 'flex';
        };
    }

    // ========================================================
    // 3. КНОПКА «НАЗАД» НА ТЕЛЕФОНЕ (ВОЗВРАТ ПО ОКНАМ)
    // ========================================================
    let handlingBack18 = false;

    function pushNavStep18(tag) {
        if (handlingBack18) return;
        try {
            window.history.pushState({ st18: tag, ts: Date.now() }, '');
        } catch (e) {}
    }

    function initMobileBackButton18() {
        try {
            window.history.replaceState({ st18: 'root' }, '');
        } catch (e) {}

        // Перехватываем открытия экранов, модалок и чатов, чтобы кнопка «Назад» знала куда вернуться
        if (typeof window.navTo === 'function') {
            const _origNav = window.navTo;
            window.navTo = function(id) {
                if (id && id !== 'main') pushNavStep18('screen:' + id);
                return _origNav.apply(this, arguments);
            };
        }
        if (typeof window.openModal === 'function') {
            const _origModal = window.openModal;
            window.openModal = function(id) {
                pushNavStep18('modal:' + id);
                return _origModal.apply(this, arguments);
            };
        }
        if (typeof window.openCloudChat === 'function') {
            const _origChat = window.openCloudChat;
            window.openCloudChat = function(chatId) {
                if (window.innerWidth <= 900) pushNavStep18('chat:' + chatId);
                return _origChat.apply(this, arguments);
            };
        }

        window.addEventListener('popstate', function() {
            handlingBack18 = true;
            try {
                // 1) Контекстные меню поверх всего
                const ctxOverlays = Array.from(document.querySelectorAll('.st12-ctx-overlay, #st14ChatCtxOverlay, #st12CtxOverlay'))
                    .filter(el => window.getComputedStyle(el).display !== 'none');
                if (ctxOverlays.length) {
                    ctxOverlays.forEach(el => { el.style.display = 'none'; });
                    return;
                }

                // 2) Открытые модальные окна
                const openModals = Array.from(document.querySelectorAll('.modal, [id$="Modal"]'))
                    .filter(el => {
                        const d = window.getComputedStyle(el).display;
                        return d === 'flex' || d === 'block';
                    });
                if (openModals.length) {
                    const topModal = openModals[openModals.length - 1];
                    if (typeof closeModal === 'function' && topModal.id) closeModal(topModal.id);
                    else topModal.style.display = 'none';
                    return;
                }

                // 3) Боковое меню
                const sb = document.getElementById('sidebar');
                if (sb && sb.classList.contains('open')) {
                    if (typeof toggleSidebar === 'function') toggleSidebar();
                    return;
                }

                // 4) Открытый диалог внутри «Чатов» на телефоне -> назад к списку чатов
                const chatsScr = document.getElementById('chats-screen');
                if (chatsScr && chatsScr.classList.contains('active-screen') && typeof waState !== 'undefined' && waState.mobileChatOpen) {
                    waState.mobileChatOpen = false;
                    if (typeof renderCloudChatsLayout === 'function') renderCloudChatsLayout();
                    return;
                }

                // 5) Любой внутренний экран -> возврат на Главный экран
                const activeScr = document.querySelector('.screen.active-screen');
                if (activeScr && activeScr.id !== 'main-screen' && activeScr.id !== 'login-screen') {
                    if (typeof backToMain === 'function') backToMain();
                    return;
                }
            } finally {
                setTimeout(() => { handlingBack18 = false; }, 120);
            }
        });
    }

    // ========================================================
    // 4. СИСТЕМНЫЕ УВЕДОМЛЕНИЯ ТЕЛЕФОНА + ЦИФРЫ НА ИКОНКЕ
    // ========================================================
    let seenNotifIds18 = new Set();
    let seenMsgIds18 = new Set();
    let notifReady18 = false;
    let msgReady18 = false;

    function requestPhoneNotifPermission() {
        if (!('Notification' in window)) return;
        if (Notification.permission === 'default') {
            Notification.requestPermission().catch(() => {});
        }
    }

    async function showPhoneSystemNotification(title, body, tag) {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;
        const opts = {
            body: String(body || '').slice(0, 180),
            icon: 'icon-192.png',
            badge: 'icon-192.png',
            vibrate: [200, 100, 200],
            tag: tag || ('lastochka_' + Date.now()),
            renotify: true
        };
        try {
            if ('serviceWorker' in navigator) {
                const reg = await navigator.serviceWorker.ready;
                if (reg && typeof reg.showNotification === 'function') {
                    await reg.showNotification(title, opts);
                    return;
                }
            }
            new Notification(title, opts);
        } catch (e) {}
    }

    function updateAppIconBadge18() {
        let count = 0;
        const bell = document.getElementById('bellBadge');
        if (bell && bell.style.display !== 'none') {
            count = parseInt(bell.innerText, 10) || 0;
        } else if (typeof cloudNotifications !== 'undefined' && Array.isArray(cloudNotifications)) {
            count = cloudNotifications.filter(n => !n.read).length;
        }
        try {
            if (typeof navigator.setAppBadge === 'function') {
                if (count > 0) navigator.setAppBadge(count).catch(() => {});
                else if (typeof navigator.clearAppBadge === 'function') navigator.clearAppBadge().catch(() => {});
            }
        } catch (e) {}
    }

    function initPhoneNotifications18() {
        // Запрашиваем разрешение на уведомления при первом касании экрана
        const askOnce = () => {
            requestPhoneNotifPermission();
            document.removeEventListener('click', askOnce);
            document.removeEventListener('touchstart', askOnce);
        };
        document.addEventListener('click', askOnce, { once: true });
        document.addEventListener('touchstart', askOnce, { once: true, passive: true });

        if (typeof db === 'undefined' || !db) return;

        // Слушаем системные уведомления (колокольчик -> телефон + цифра на иконке)
        db.collection('notifications').onSnapshot(snap => {
            snap.forEach(d => {
                const data = d.data() || {};
                if (!seenNotifIds18.has(d.id)) {
                    seenNotifIds18.add(d.id);
                    if (notifReady18 && !data.read) {
                        showPhoneSystemNotification('Ласточка МТППК', data.text || 'Новое уведомление', 'notif_' + d.id);
                    }
                }
            });
            notifReady18 = true;
            setTimeout(updateAppIconBadge18, 200);
        });

        // Слушаем новые входящие сообщения в чатах (уведомление в телефон)
        db.collection('chat_messages').orderBy('ts', 'desc').limit(15).onSnapshot(snap => {
            const myTab = String(appState?.user?.tab || '');
            snap.forEach(d => {
                const m = d.data() || {};
                if (!seenMsgIds18.has(d.id)) {
                    seenMsgIds18.add(d.id);
                    if (msgReady18 && myTab && String(m.tab) !== myTab && !m.deletedByAdmin) {
                        const isChatFocused = !document.hidden &&
                            document.getElementById('chats-screen')?.classList.contains('active-screen') &&
                            typeof activeChatId !== 'undefined' && activeChatId === m.chatId;
                        if (!isChatFocused) {
                            showPhoneSystemNotification(
                                `💬 ${m.sender || 'Новое сообщение'}`,
                                m.text || 'Вложение',
                                'chat_' + m.chatId
                            );
                        }
                    }
                }
            });
            msgReady18 = true;
        });

        // Обновляем цифру на иконке при любых изменениях колокольчика
        const bell = document.getElementById('bellBadge');
        if (bell) {
            new MutationObserver(updateAppIconBadge18).observe(bell, {
                childList: true, characterData: true, subtree: true, attributes: true
            });
        }
        updateAppIconBadge18();
    }

    // ========================================================
    // ЗАПУСК ВСЕХ ФУНКЦИЙ STAGE 18
    // ========================================================
    window.addEventListener('load', () => {
        setTimeout(() => {
            patchChatContextMenu18();
            initMobileBackButton18();
            initPhoneNotifications18();

            const obs = new MutationObserver(() => {
                syncDeleteButtons18();
                styleAdminDeletedPlaceholders();
            });
            obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
        }, 2400);
    });
})();
