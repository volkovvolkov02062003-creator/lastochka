// ============================================================
// === STAGE 17: ОТПРАВКА ВИДЕО И ФАЙЛОВ ДО 15 МБ ЧАСТЯМИ  ===
// ============================================================
(function initStage17ChunkedMedia() {
    const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 МБ
    const TRIGGER_BYTES = 700 * 1024;        // Перехватываем всё тяжелее 700 КБ
    const CHUNK_CHAR_LEN = 450000;           // ~450 КБ текста на 1 документ Firestore
    const mediaBlobCache = {};
    let isUploadingChunked = false;

    function notifyToast(msg) {
        if (typeof showSyncToast === 'function') showSyncToast(msg);
    }

    function dataUrlToBlobUrl(dataUrl) {
        try {
            const parts = dataUrl.split(',');
            const mimeMatch = parts[0].match(/:(.*?);/);
            const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
            const bin = atob(parts[1]);
            const len = bin.length;
            const arr = new Uint8Array(len);
            for (let i = 0; i < len; i++) arr[i] = bin.charCodeAt(i);
            return URL.createObjectURL(new Blob([arr], { type: mime }));
        } catch (e) {
            return dataUrl;
        }
    }

    // 1. Перехват выбора тяжёлого видео/файла в чатах ДО срабатывания старого лимита 750 КБ
    document.addEventListener('change', function(e) {
        const input = e.target;
        if (!input || input.tagName !== 'INPUT' || input.type !== 'file') return;

        // Работаем только внутри экрана чатов (не трогаем Excel-импорт табеля/маршрутов)
        if (!input.closest('#chats-screen')) return;

        const file = input.files && input.files[0];
        if (!file) return;

        // Картинки/аватарки не трогаем — их сжимает базовый код
        const isVideo = (file.type || '').startsWith('video/') || /\.(mp4|mov|webm|mkv|avi|3gp)$/i.test(file.name);
        const isImage = (file.type || '').startsWith('image/');
        if (isImage) return;

        // Если файл меньше 700 КБ — пусть идёт обычным путём
        if (file.size <= TRIGGER_BYTES) return;

        // Блокируем старый обработчик с окном "Видео больше 750 КБ"
        e.stopImmediatePropagation();
        e.preventDefault();

        if (isUploadingChunked) {
            alert('Дождитесь завершения отправки предыдущего файла.');
            input.value = '';
            return;
        }

        if (file.size > MAX_FILE_BYTES) {
            alert(`Файл слишком большой (${(file.size / 1024 / 1024).toFixed(1)} МБ). Выберите файл до 15 МБ.`);
            input.value = '';
            return;
        }

        if (typeof db === 'undefined' || !db) {
            alert('Нет подключения к базе Firebase.');
            input.value = '';
            return;
        }

        if (typeof activeChatId === 'undefined' || !activeChatId) {
            alert('Сначала откройте нужный чат.');
            input.value = '';
            return;
        }

        uploadChunkedMediaToChat(file, isVideo);
        input.value = '';
    }, true);

    async function uploadChunkedMediaToChat(file, isVideo) {
        isUploadingChunked = true;
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        notifyToast(`⏳ Подготовка ${isVideo ? 'видео' : 'файла'} (${sizeMb} МБ)...`);

        try {
            const dataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = ev => resolve(ev.target.result);
                reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
                reader.readAsDataURL(file);
            });

            const mediaId = 'cm_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
            const totalChunks = Math.ceil(dataUrl.length / CHUNK_CHAR_LEN);

            // Загружаем частями по 450 КБ
            for (let i = 0; i < totalChunks; i++) {
                const slice = dataUrl.slice(i * CHUNK_CHAR_LEN, (i + 1) * CHUNK_CHAR_LEN);
                await db.collection('chat_media_chunks').doc(`${mediaId}_${i}`).set({
                    mediaId: mediaId,
                    index: i,
                    data: slice,
                    ts: Date.now()
                });
                const pct = Math.round(((i + 1) / totalChunks) * 100);
                notifyToast(`⏳ Загрузка ${isVideo ? 'видео' : 'файла'}: ${pct}%`);
            }

            const tag = isVideo ? '🎬 Видео' : '📎 Файл';
            const cleanName = (file.name || (isVideo ? 'video.mp4' : 'file')).replace(/[\[\]|]/g, '');
            const msgId = 'msg_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

            const msgObj = {
                id: msgId,
                chatId: activeChatId,
                tab: (typeof appState !== 'undefined' && appState.user?.tab) ? appState.user.tab : 'unknown',
                sender: (typeof appState !== 'undefined' && appState.user?.fio) ? appState.user.fio : 'Сотрудник',
                text: `[${tag}: ${cleanName} (${sizeMb} МБ) | ID:${mediaId}]`,
                time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
                ts: Date.now(),
                chunkedMedia: {
                    mediaId,
                    isVideo,
                    fileName: cleanName,
                    mime: file.type || (isVideo ? 'video/mp4' : 'application/octet-stream'),
                    sizeMb,
                    totalChunks
                }
            };

            await db.collection('chat_messages').doc(msgId).set(msgObj);
            // Сразу кэшируем локально, чтобы отправитель мог посмотреть мгновенно
            mediaBlobCache[mediaId] = dataUrlToBlobUrl(dataUrl);
            notifyToast(`✅ ${isVideo ? 'Видео' : 'Файл'} отправлено`);
        } catch (err) {
            console.error('Stage17 upload error:', err);
            alert('Ошибка отправки файла: ' + (err.message || err));
        } finally {
            isUploadingChunked = false;
        }
    }

    // 2. Сборка и воспроизведение видео/файла по клику
    window.loadStage17ChunkedMedia = async function(mediaId, isVideo, fileName, btnEl) {
        const wrap = btnEl.closest('.st17-media-card');
        if (!wrap) return;

        if (mediaBlobCache[mediaId]) {
            renderLoadedStage17Media(wrap, mediaBlobCache[mediaId], isVideo, fileName);
            return;
        }

        if (typeof db === 'undefined' || !db) {
            alert('Нет подключения к базе Firebase.');
            return;
        }

        btnEl.disabled = true;
        btnEl.innerText = '⏳ Загрузка...';

        try {
            const snap = await db.collection('chat_media_chunks').where('mediaId', '==', mediaId).get();
            if (snap.empty) {
                btnEl.innerText = '❌ Файл не найден в базе';
                return;
            }
            const parts = [];
            snap.forEach(d => parts.push(d.data()));
            parts.sort((a, b) => (a.index || 0) - (b.index || 0));
            const fullDataUrl = parts.map(p => p.data || '').join('');
            const blobUrl = dataUrlToBlobUrl(fullDataUrl);
            mediaBlobCache[mediaId] = blobUrl;

            renderLoadedStage17Media(wrap, blobUrl, isVideo, fileName);
        } catch (err) {
            console.error('Stage17 load error:', err);
            btnEl.disabled = false;
            btnEl.innerText = '🔄 Ошибка, попробовать снова';
        }
    };

    function renderLoadedStage17Media(wrap, blobUrl, isVideo, fileName) {
        const safeName = fileName.replace(/"/g, '&quot;');
        if (isVideo) {
            wrap.innerHTML = `
                <video src="${blobUrl}" controls playsinline autoplay style="width:100%;max-width:300px;max-height:320px;border-radius:10px;background:#000;display:block;"></video>
                <div style="margin-top:5px;display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#555;">
                    <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:190px;">${safeName}</span>
                    <a href="${blobUrl}" download="${safeName}" style="color:#0055aa;font-weight:bold;text-decoration:none;">⬇ Скачать</a>
                </div>
            `;
        } else {
            wrap.innerHTML = `
                <a href="${blobUrl}" download="${safeName}" style="display:inline-block;padding:7px 12px;background:#0055aa;color:#fff;border-radius:8px;text-decoration:none;font-size:12px;font-weight:bold;">
                    ⬇ Скачать: ${safeName}
                </a>
            `;
        }
    }

    // 3. Автоматическая подмена текстовой метки на красивый плеер/кнопку в сообщениях чата
    const MARKER_RE = /\[(🎬 Видео|📎 Файл):\s*(.+?)\s*\|\s*ID:(cm_[a-zA-Z0-9_]+)\]/;

    function upgradeChatMediaNodes() {
        const chatBox = document.getElementById('chatMsgs') || document.getElementById('chats-screen');
        if (!chatBox) return;

        const walker = document.createTreeWalker(chatBox, NodeFilter.SHOW_TEXT, null, false);
        const targets = [];
        let node;
        while ((node = walker.nextNode())) {
            if (node.nodeValue && node.nodeValue.includes('| ID:cm_')) {
                targets.push(node);
            }
        }

        targets.forEach(textNode => {
            const m = textNode.nodeValue.match(MARKER_RE);
            if (!m) return;
            const isVideo = m[1].includes('Видео');
            const label = m[2];
            const mediaId = m[3];
            const cleanFileName = label.replace(/\s*\([\d.]+\s*МБ\)\s*$/, '').trim() || (isVideo ? 'video.mp4' : 'file');

            const card = document.createElement('div');
            card.className = 'st17-media-card';
            card.style.cssText = 'margin:4px 0;padding:8px 10px;background:rgba(0,51,102,0.08);border:1px solid rgba(0,51,102,0.2);border-radius:10px;min-width:200px;';
            card.innerHTML = `
                <div style="font-size:12px;font-weight:bold;color:#003366;margin-bottom:6px;word-break:break-word;">${isVideo ? '🎬' : '📎'} ${label}</div>
                <button type="button" onclick="loadStage17ChunkedMedia('${mediaId}', ${isVideo}, '${cleanFileName.replace(/'/g, "\\'")}', this)" style="width:100%;margin:0;padding:7px 10px;background:#0055aa;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:bold;cursor:pointer;">
                    ${isVideo ? '▶ Смотреть видео' : '📥 Загрузить файл'}
                </button>
            `;

            if (textNode.parentNode) {
                textNode.parentNode.replaceChild(card, textNode);
            }
        });
    }

    window.addEventListener('load', () => {
        setTimeout(() => {
            const obs = new MutationObserver(() => upgradeChatMediaNodes());
            obs.observe(document.body, { childList: true, subtree: true });
            upgradeChatMediaNodes();
        }, 1200);
    });
})();
// ============================================================
// === ЗАЩИТА: «УДАЛИТЬ У ВСЕХ» ТОЛЬКО ДЛЯ СВОИХ СООБЩЕНИЙ  ===
// ============================================================
(function initStage17OwnMsgDeleteOnly() {
    let lastSelectedMsgIsMine = true;

    function detectIsMyMessage(target) {
        if (!target) return null;
        const chatBox = target.closest('#chatMsgs');
        if (!chatBox) return null;

        const el = target.closest('[data-msg-id], .wa-msg-row, .msg-row, .wa-msg-bubble, .msg-bubble');
        if (!el) return null;

        // Проверяем явные классы исходящего / входящего сообщения
        const chain = [el, el.parentElement, el.querySelector('.msg-bubble, .wa-msg-bubble')].filter(Boolean);
        for (const node of chain) {
            const cls = node.classList;
            if (!cls) continue;
            if (cls.contains('msg-out') || cls.contains('wa-msg-out') || cls.contains('mine') || cls.contains('out')) {
                return true;
            }
            if (cls.contains('msg-in') || cls.contains('wa-msg-in') || cls.contains('in')) {
                return false;
            }
        }

        // Резервная проверка по data-атрибутам отправителя
        const myTab = (typeof appState !== 'undefined' && appState.user?.tab) ? String(appState.user.tab) : '';
        const senderTab = el.getAttribute('data-tab') || el.getAttribute('data-sender-tab');
        if (myTab && senderTab) return senderTab === myTab;

        // Резервная проверка по выравниванию (свои сообщения справа)
        const st = window.getComputedStyle(el);
        if (st.alignSelf === 'flex-end' || st.justifyContent === 'flex-end') return true;
        if (st.alignSelf === 'flex-start' || st.justifyContent === 'flex-start') return false;

        return null;
    }

    function rememberMsgOwner(e) {
        const res = detectIsMyMessage(e.target);
        if (res !== null) {
            lastSelectedMsgIsMine = res;
            setTimeout(syncDeleteForAllButtons, 0);
            setTimeout(syncDeleteForAllButtons, 80);
        }
    }

    document.addEventListener('contextmenu', rememberMsgOwner, true);
    document.addEventListener('touchstart', rememberMsgOwner, { capture: true, passive: true });
    document.addEventListener('mousedown', rememberMsgOwner, true);

    function isDeleteForEveryoneMessageBtn(el) {
        if (!el || el.closest('#st14ChatCtxOverlay')) return false;
        const txt = (el.innerText || el.textContent || '').trim();
        if (!txt || txt.length > 60) return false;
        if (/групп/i.test(txt)) return false; // не трогаем «Удалить группу у всех»
        return /удалить.*(у|для)\s*всех/i.test(txt);
    }

    function syncDeleteForAllButtons() {
        const candidates = document.querySelectorAll('button, .st12-ctx-item, .st12-dots-opt, [onclick]');
        candidates.forEach(el => {
            if (!isDeleteForEveryoneMessageBtn(el)) return;
            if (!lastSelectedMsgIsMine) {
                if (el.getAttribute('data-st17-hide-del-all') !== '1') {
                    el.setAttribute('data-st17-prev-display', el.style.display || '');
                    el.setAttribute('data-st17-hide-del-all', '1');
                }
                el.style.setProperty('display', 'none', 'important');
            } else if (el.getAttribute('data-st17-hide-del-all') === '1') {
                const prev = el.getAttribute('data-st17-prev-display') || '';
                el.style.display = prev;
                el.removeAttribute('data-st17-hide-del-all');
            }
        });
    }

    // Двойная страховка на случай прямого клика
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('button, .st12-ctx-item, [onclick]');
        if (btn && isDeleteForEveryoneMessageBtn(btn) && !lastSelectedMsgIsMine) {
            e.stopImmediatePropagation();
            e.preventDefault();
            if (typeof showSyncToast === 'function') {
                showSyncToast('⚠️ Удалить у всех можно только свои сообщения');
            }
        }
    }, true);

    window.addEventListener('load', () => {
        const obs = new MutationObserver(() => syncDeleteForAllButtons());
        obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
    });
})();
