// ============================================================
// === STAGE 22: ВХОД ПО NFC-КАРТЕ (МКАССА / ПРОХОДЯШКА)    ===
// === И ПРИВЯЗКА КАРТ В ПРОФИЛЕ КАК ЗАПАСНОГО ПАРОЛЯ       ===
// ============================================================
(function initStage22NfcAuth() {
    let activeNfcController = null;

    function normalizeCardUid(raw) {
        return String(raw || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    }

    function readLocalNfcMap() {
        try {
            return JSON.parse(localStorage.getItem('kkl_nfc_cards_map') || '{}');
        } catch (e) {
            return {};
        }
    }

    function saveLocalNfcMap(tab, cardMkassa, cardPass) {
        if (!tab) return;
        const map = readLocalNfcMap();
        // Удаляем старые привязки этого табельного
        Object.keys(map).forEach(uid => {
            if (String(map[uid]) === String(tab)) delete map[uid];
        });
        if (cardMkassa) map[normalizeCardUid(cardMkassa)] = String(tab);
        if (cardPass) map[normalizeCardUid(cardPass)] = String(tab);
        try {
            localStorage.setItem('kkl_nfc_cards_map', JSON.stringify(map));
        } catch (e) {}
    }

    function stopActiveNfcScan() {
        if (activeNfcController) {
            try { activeNfcController.abort(); } catch (e) {}
            activeNfcController = null;
        }
    }

    function extractUidFromNfcEvent(event) {
        if (event && event.serialNumber) {
            return normalizeCardUid(event.serialNumber);
        }
        // Резервно читаем текстовую метку NDEF, если serialNumber скрыт
        try {
            const records = event?.message?.records || [];
            for (const rec of records) {
                if (rec.recordType === 'text' && rec.data) {
                    const dec = new TextDecoder(rec.encoding || 'utf-8');
                    const txt = normalizeCardUid(dec.decode(rec.data));
                    if (txt) return txt;
                }
            }
        } catch (e) {}
        return '';
    }

    // ========================================================
    // СТИЛИ
    // ========================================================
    function injectSt22Styles() {
        if (document.getElementById('st22-styles')) return;
        const st = document.createElement('style');
        st.id = 'st22-styles';
        st.innerHTML = `
            .st22-nfc-login-btn {
                width: 100%;
                margin-top: 10px !important;
                padding: 11px 14px !important;
                background: linear-gradient(135deg, #0ea5e9, #0369a1) !important;
                color: #ffffff !important;
                border: none !important;
                border-radius: 8px !important;
                font-size: 15px !important;
                font-weight: bold !important;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                box-shadow: 0 3px 10px rgba(3, 105, 161, 0.3);
            }
            .st22-nfc-status-box {
                display: none;
                margin-top: 10px;
                padding: 12px;
                border-radius: 8px;
                background: #e0f2fe;
                border: 2px dashed #0284c7;
                color: #0c4a6e;
                text-align: center;
                font-size: 13px;
            }
            .st22-nfc-status-title {
                font-size: 15px;
                font-weight: bold;
                color: #0369a1;
                margin-bottom: 4px;
            }
            .st22-pulse {
                display: inline-block;
                animation: st22PulseAnim 1.3s infinite;
            }
            @keyframes st22PulseAnim {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.18); opacity: 0.65; }
                100% { transform: scale(1); opacity: 1; }
            }
            .st22-card-row {
                display: flex;
                gap: 8px;
                align-items: center;
            }
            .st22-card-row input {
                flex: 1;
            }
            .st22-scan-btn {
                width: auto !important;
                margin: 0 !important;
                padding: 8px 12px !important;
                background: #0284c7 !important;
                color: #fff !important;
                border: none !important;
                border-radius: 6px !important;
                font-size: 12.5px !important;
                font-weight: bold !important;
                white-space: nowrap;
                cursor: pointer;
            }
            .st22-scan-btn.scanning {
                background: #f59e0b !important;
                color: #111 !important;
            }
            .st22-cards-hint {
                font-size: 11.5px;
                color: #475569;
                margin: -4px 0 10px;
            }
        `;
        document.head.appendChild(st);
    }

    // ========================================================
    // 1. КНОПКА NFC ПОД КНОПКОЙ «ВОЙТИ» НА ЭКРАНЕ ВХОДА
    // ========================================================
    function ensureLoginNfcButton() {
        const step1 = document.getElementById('loginStep1') || document.getElementById('login-screen');
        if (!step1 || document.getElementById('btnSt22LoginNfc')) return;

        const loginBtn = step1.querySelector('button[onclick*="checkUser"]') ||
            Array.from(step1.querySelectorAll('button')).find(b => /войти|далее|проверить/i.test(b.innerText || ''));
        if (!loginBtn) return;

        const wrap = document.createElement('div');
        wrap.id = 'st22LoginNfcWrap';
        wrap.innerHTML = `
            <button type="button" id="btnSt22LoginNfc" class="st22-nfc-login-btn" onclick="startSt22NfcLogin()">
                <span>📶</span> NFC
            </button>
            <div id="st22NfcLoginStatus" class="st22-nfc-status-box">
                <div class="st22-nfc-status-title"><span class="st22-pulse">📶</span> Авторизация по карте</div>
                <div id="st22NfcLoginHint" style="font-size:12px;line-height:1.45;">
                    Приложите карту МКассы или Проходяшку к задней панели телефона...
                </div>
                <button type="button" class="btn-secondary" style="width:auto;margin:8px auto 0;padding:4px 12px;font-size:11.5px;" onclick="cancelSt22NfcLogin()">Отмена</button>
            </div>
        `;
        loginBtn.insertAdjacentElement('afterend', wrap);
    }

    window.cancelSt22NfcLogin = function() {
        stopActiveNfcScan();
        const box = document.getElementById('st22NfcLoginStatus');
        if (box) box.style.display = 'none';
    };

    async function findWorkerByCardUid(uid) {
        const cleanUid = normalizeCardUid(uid);
        if (!cleanUid) return null;

        // 1. Ищем в уже загруженном списке сотрудников
        let list = Array.isArray(appState?.workers) ? appState.workers : [];
        let found = list.find(w =>
            normalizeCardUid(w.cardMkassa) === cleanUid ||
            normalizeCardUid(w.cardPass) === cleanUid
        );
        if (found) return found;

        // 2. Если база ещё не подгрузилась — запрашиваем напрямую из Firebase
        if (typeof db !== 'undefined' && db) {
            try {
                const snap = await db.collection('workers').get();
                const all = [];
                snap.forEach(d => all.push(d.data()));
                if (all.length && typeof appState !== 'undefined') appState.workers = all;
                found = all.find(w =>
                    normalizeCardUid(w.cardMkassa) === cleanUid ||
                    normalizeCardUid(w.cardPass) === cleanUid
                );
                if (found) return found;
            } catch (e) {}
        }

        // 3. Офлайн-резерв: ищем в локальной памяти телефона
        const localMap = readLocalNfcMap();
        const tabFromMap = localMap[cleanUid];
        if (tabFromMap) {
            try {
                const localProf = JSON.parse(localStorage.getItem('kkl_profile_' + tabFromMap) || 'null');
                if (localProf) return localProf;
            } catch (e) {}
        }

        return null;
    }

    async function completeLoginByNfcCard(uid) {
        const hintEl = document.getElementById('st22NfcLoginHint');
        if (hintEl) hintEl.innerText = `Карта считана (${uid}). Поиск профиля...`;

        const worker = await findWorkerByCardUid(uid);
        if (!worker) {
            if (hintEl) {
                hintEl.innerHTML = `<span style="color:#b91c1c;font-weight:bold;">Карта (${uid}) не привязана ни к одному профилю.</span><br>Войдите по табельному и отсканируйте карту в разделе «Профиль».`;
            }
            return;
        }

        stopActiveNfcScan();

        let savedLocal = null;
        try {
            savedLocal = JSON.parse(localStorage.getItem('kkl_profile_' + worker.tab) || 'null');
        } catch (e) {}

        const merged = { ...(savedLocal || {}), ...worker, completed: true };
        appState.user = merged;
        try {
            localStorage.setItem('kkl_profile', JSON.stringify(merged));
            localStorage.setItem('kkl_profile_' + merged.tab, JSON.stringify(merged));
            saveLocalNfcMap(merged.tab, merged.cardMkassa, merged.cardPass);
        } catch (e) {}

        const box = document.getElementById('st22NfcLoginStatus');
        if (box) box.style.display = 'none';

        if (typeof showSyncToast === 'function') {
            showSyncToast(`✅ Вход по карте: ${merged.fio}`);
        }

        if (merged.profileCompleted || savedLocal?.completed || merged.password) {
            if (typeof showMainScreen === 'function') showMainScreen(merged);
        } else if (typeof openRegistrationForUser === 'function') {
            openRegistrationForUser(merged);
        } else if (typeof showMainScreen === 'function') {
            showMainScreen(merged);
        }
    }

    window.startSt22NfcLogin = async function() {
        const box = document.getElementById('st22NfcLoginStatus');
        const hintEl = document.getElementById('st22NfcLoginHint');
        if (box) box.style.display = 'block';

        stopActiveNfcScan();

        if (!('NDEFReader' in window)) {
            if (hintEl) {
                hintEl.innerHTML = `
                    <span style="color:#b45309;font-weight:bold;">На этом устройстве / браузере NFC недоступен.</span><br>
                    Сканирование карт работает на Android-телефоне в приложении, установленном через Google Chrome (включите NFC в шторке телефона).
                `;
            }
            return;
        }

        if (hintEl) {
            hintEl.innerText = 'Приложите карту МКассы или Проходяшку к задней панели телефона...';
        }

        try {
            const ndef = new NDEFReader();
            activeNfcController = new AbortController();
            await ndef.scan({ signal: activeNfcController.signal });

            ndef.addEventListener('readingerror', () => {
                if (hintEl) hintEl.innerText = 'Не удалось прочитать карту — приложите ещё раз и подержите 1–2 сек.';
            });

            ndef.addEventListener('reading', (event) => {
                const uid = extractUidFromNfcEvent(event);
                if (!uid) {
                    if (hintEl) hintEl.innerText = 'Карта обнаружена, но номер не считался. Попробуйте ещё раз.';
                    return;
                }
                completeLoginByNfcCard(uid);
            });
        } catch (err) {
            if (err && err.name === 'AbortError') return;
            if (hintEl) {
                hintEl.innerHTML = `<span style="color:#b91c1c;">Не удалось запустить NFC: ${err?.message || 'проверьте, включён ли NFC на телефоне и выдано ли разрешение браузеру.'}</span>`;
            }
        }
    };

    // ========================================================
    // 2. ПОЛЯ «КАРТА МКАССЫ» И «ПРОХОДЯШКА» В ПРОФИЛЕ СОТРУДНИКА
    // ========================================================
    function ensureProfileCardFields() {
        const profScr = document.getElementById('profile-screen');
        if (!profScr || document.getElementById('st22ProfileCardsBlock')) return;

        // Ищем поле «Номер телефона» в профиле, чтобы вставить строго ПЕРЕД ним
        let anchorGroup = null;
        const groups = Array.from(profScr.querySelectorAll('.form-group'));
        for (const g of groups) {
            const lbl = (g.querySelector('label')?.innerText || '').toLowerCase();
            const inp = g.querySelector('input');
            const inpId = (inp?.id || '').toLowerCase();
            if (lbl.includes('телефон') || inpId.includes('phone') || inpId.includes('tel') || inp?.type === 'tel') {
                anchorGroup = g;
                break;
            }
        }

        // Резерв, если поле телефона не найдено — вставляем перед паролем или подписью
        if (!anchorGroup) {
            anchorGroup = document.getElementById('pfPass')?.closest('.form-group') ||
                document.getElementById('pfSigImg')?.closest('.form-group') ||
                null;
        }

        const block = document.createElement('div');
        block.id = 'st22ProfileCardsBlock';
        block.innerHTML = `
            <div class="form-group">
                <label>Карта МКассы (NFC):</label>
                <div class="st22-card-row">
                    <input type="text" id="pfCardMkassa" class="form-input pf-editable" placeholder="Не привязана — нажмите «Сканировать»" readonly>
                    <button type="button" id="btnScanCardMkassa" class="st22-scan-btn" onclick="scanSt22ProfileCard('mkassa')">📶 Сканировать</button>
                </div>
            </div>
            <div class="form-group">
                <label>Проходяшка (NFC):</label>
                <div class="st22-card-row">
                    <input type="text" id="pfCardPass" class="form-input pf-editable" placeholder="Не привязана — нажмите «Сканировать»" readonly>
                    <button type="button" id="btnScanCardPass" class="st22-scan-btn" onclick="scanSt22ProfileCard('pass')">📶 Сканировать</button>
                </div>
            </div>
            <div class="st22-cards-hint">
                🔑 Привязанные карты работают как дополнительный ключ для входа по кнопке NFC, если вы забыли пароль.
            </div>
        `;

        if (anchorGroup) {
            anchorGroup.insertAdjacentElement('beforebegin', block);
        } else {
            const card = profScr.querySelector('.card');
            if (card) card.appendChild(block);
        }

        syncProfileCardsValues();
    }

    function syncProfileCardsValues() {
        const u = appState?.user || {};
        const mkInp = document.getElementById('pfCardMkassa');
        const psInp = document.getElementById('pfCardPass');
        if (mkInp) mkInp.value = u.cardMkassa || '';
        if (psInp) psInp.value = u.cardPass || '';
    }

    function saveCardUidToProfile(cardType, uid) {
        const u = appState?.user;
        if (!u) return alert('Сначала войдите в профиль!');
        const cleanUid = normalizeCardUid(uid);

        if (cardType === 'mkassa') {
            u.cardMkassa = cleanUid;
            const inp = document.getElementById('pfCardMkassa');
            if (inp) inp.value = cleanUid;
        } else {
            u.cardPass = cleanUid;
            const inp = document.getElementById('pfCardPass');
            if (inp) inp.value = cleanUid;
        }

        // Обновляем локально и в облаке Firebase
        try {
            localStorage.setItem('kkl_profile', JSON.stringify(u));
            localStorage.setItem('kkl_profile_' + u.tab, JSON.stringify(u));
            saveLocalNfcMap(u.tab, u.cardMkassa, u.cardPass);
        } catch (e) {}

        if (typeof db !== 'undefined' && db && u.tab) {
            db.collection('workers').doc(String(u.tab)).set({
                cardMkassa: u.cardMkassa || '',
                cardPass: u.cardPass || ''
            }, { merge: true }).catch(() => {});
        }

        if (typeof showSyncToast === 'function') {
            const title = cardType === 'mkassa' ? 'Карта МКассы' : 'Проходяшка';
            showSyncToast(`✅ ${title} привязана (${cleanUid})`);
        }
    }

    window.scanSt22ProfileCard = async function(cardType) {
        const btnId = cardType === 'mkassa' ? 'btnScanCardMkassa' : 'btnScanCardPass';
        const btn = document.getElementById(btnId);
        const label = cardType === 'mkassa' ? 'Карту МКассы' : 'Проходяшку';

        stopActiveNfcScan();

        if (!('NDEFReader' in window)) {
            alert(`NFC-сканер доступен только на Android-телефоне (через Chrome).\nОткройте приложение на телефоне, включите NFC и нажмите «Сканировать».`);
            return;
        }

        if (btn) {
            btn.classList.add('scanning');
            btn.innerText = '⏳ Приложите карту...';
        }

        try {
            const ndef = new NDEFReader();
            activeNfcController = new AbortController();
            await ndef.scan({ signal: activeNfcController.signal });

            if (typeof showSyncToast === 'function') {
                showSyncToast(`📶 Приложите ${label} к задней панели телефона`);
            }

            ndef.addEventListener('readingerror', () => {
                if (typeof showSyncToast === 'function') {
                    showSyncToast('⚠️ Ошибка чтения — приложите карту ещё раз');
                }
            });

            ndef.addEventListener('reading', (event) => {
                const uid = extractUidFromNfcEvent(event);
                stopActiveNfcScan();
                if (btn) {
                    btn.classList.remove('scanning');
                    btn.innerText = '📶 Сканировать';
                }
                if (!uid) {
                    alert('Не удалось прочитать серийный номер карты. Попробуйте ещё раз.');
                    return;
                }
                saveCardUidToProfile(cardType, uid);
            });
        } catch (err) {
            if (btn) {
                btn.classList.remove('scanning');
                btn.innerText = '📶 Сканировать';
            }
            if (err && err.name !== 'AbortError') {
                alert('Не удалось включить NFC: ' + (err.message || 'проверьте, включён ли NFC в настройках телефона.'));
            }
        }
    };

    // ========================================================
    // ПЕРЕХВАТ ОТКРЫТИЯ И СОХРАНЕНИЯ ПРОФИЛЯ
    // ========================================================
    function hookProfileFunctions22() {
        if (typeof window.openProfileScreen === 'function') {
            const _origOpen = window.openProfileScreen;
            window.openProfileScreen = function() {
                const r = _origOpen.apply(this, arguments);
                ensureProfileCardFields();
                syncProfileCardsValues();
                return r;
            };
        }

        if (typeof window.saveProfileEdit === 'function') {
            const _origSave = window.saveProfileEdit;
            window.saveProfileEdit = function() {
                if (appState?.user) {
                    const mk = document.getElementById('pfCardMkassa')?.value.trim() || '';
                    const ps = document.getElementById('pfCardPass')?.value.trim() || '';
                    appState.user.cardMkassa = mk;
                    appState.user.cardPass = ps;
                    saveLocalNfcMap(appState.user.tab, mk, ps);
                }
                return _origSave.apply(this, arguments);
            };
        }
    }

    // ========================================================
    // ЗАПУСК
    // ========================================================
    window.addEventListener('load', () => {
        injectSt22Styles();
        setTimeout(() => {
            ensureLoginNfcButton();
            ensureProfileCardFields();
            hookProfileFunctions22();

            // Обновляем локальную карту привязок для уже вошедшего пользователя
            if (appState?.user?.tab) {
                saveLocalNfcMap(appState.user.tab, appState.user.cardMkassa, appState.user.cardPass);
            }

            const obs = new MutationObserver(() => {
                ensureLoginNfcButton();
                ensureProfileCardFields();
            });
            obs.observe(document.body, { childList: true, subtree: true });
        }, 2800);
    });
})();
