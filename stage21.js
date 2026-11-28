// ============================================================
// === STAGE 21: АДРЕСНЫЕ УВЕДОМЛЕНИЯ ГУО -> ПОДПИСЬ В ПРОФИЛЕ ===
// === И ПРИЧИНА ЗАКРЫТИЯ СМЕНЫ + «ВАША ФДУ НА ПОДПИСИ»     ===
// ============================================================
(function initStage21SignAndFduReason() {
    let st21ActiveSignDocId = null;
    let st21ActiveNotifId = null;

    function st21Esc(str) {
        return String(str ?? '').replace(/[&<>"']/g, m => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[m]));
    }

    function todayDateStr21() {
        return new Date().toLocaleDateString('ru-RU');
    }

    function nowTimeStr21() {
        return new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }

    function getCanvasData21(canvasId) {
        if (typeof sigCtxMap === 'undefined' || !sigCtxMap[canvasId]) return '';
        const c = sigCtxMap[canvasId].c;
        const blank = document.createElement('canvas');
        blank.width = c.width;
        blank.height = c.height;
        return c.toDataURL() !== blank.toDataURL() ? c.toDataURL() : '';
    }

    window.clearSt21Canvas = function(canvasId) {
        if (typeof sigCtxMap !== 'undefined' && sigCtxMap[canvasId]) {
            const s = sigCtxMap[canvasId];
            s.ctx.clearRect(0, 0, s.c.width, s.c.height);
        }
    };

    // ========================================================
    // СТИЛИ
    // ========================================================
    function injectSt21Styles() {
        if (document.getElementById('st21-styles')) return;
        const st = document.createElement('style');
        st.id = 'st21-styles';
        st.innerHTML = `
            .st21-fdu-pending-yellow {
                background: #ffc107 !important;
                color: #111827 !important;
                border: 2px solid #d97706 !important;
                font-weight: bold !important;
                box-shadow: 0 2px 8px rgba(245, 158, 11, 0.45) !important;
            }
            .st21-notif-clickable {
                cursor: pointer;
                border-left: 4px solid #f59e0b !important;
                background: #fffbeb !important;
                transition: background 0.15s;
            }
            .st21-notif-clickable:hover {
                background: #fef3c7 !important;
            }
            .st21-reason-chip {
                width: auto !important;
                margin: 0 !important;
                padding: 5px 10px !important;
                font-size: 11.5px !important;
                background: #e2e8f0 !important;
                color: #1e293b !important;
                border: 1px solid #cbd5e1 !important;
                border-radius: 14px !important;
                cursor: pointer;
            }
            .st21-reason-chip:hover {
                background: #cbd5e1 !important;
            }
        `;
        document.head.appendChild(st);
    }

    // ========================================================
    // 1. АДРЕСНАЯ ОТПРАВКА ИЗ ГУО ТОЛЬКО УКАЗАННОМУ ПРОФИЛЮ
    // ========================================================
    function isNotifVisibleForMe(n) {
        if (!n) return false;
        if (!n.targetTab) return true; // общие уведомления
        const myTab = String(appState?.user?.tab || '');
        return myTab && String(n.targetTab) === myTab;
    }

    function updateMyBellBadge21() {
        if (typeof cloudNotifications === 'undefined' || !Array.isArray(cloudNotifications)) return;
        const myUnread = cloudNotifications.filter(n => isNotifVisibleForMe(n) && !n.read).length;
        const badge = document.getElementById('bellBadge');
        if (badge) {
            badge.innerText = myUnread;
            badge.style.display = myUnread > 0 ? 'flex' : 'none';
        }
    }

    function patchGuoStartSaveAndNotifications() {
        // Переопределяем сохранение в «На начало работы контролёров» (из stage19.js),
        // чтобы уведомление приходило адресно только выбранному контролёру
        window.saveSt19StartRecord = function() {
            const tab = document.getElementById('st19CtrlSelect')?.value.trim();
            const mkassa = document.getElementById('st19MkassaInput')?.value.trim();
            const bobbinsTaken = document.getElementById('st19BobbinsInput')?.value.trim() || '0';
            const changeFund = document.getElementById('st19FundInput')?.value.trim() || '0';

            if (!tab) return alert('Выберите ФИО контролёра!');
            if (!mkassa) return alert('Укажите № МКассы (машинки)!');

            const w = (appState?.workers || []).find(x => String(x.tab) === String(tab));
            const fio = w ? w.fio : `Сотрудник ${tab}`;
            const docId = 'gstart_' + Date.now() + '_' + tab;
            const guoFio = appState?.user?.fio || 'Оператор ГУО';

            const rec = {
                id: docId,
                tab: String(tab),
                fio,
                mkassa,
                bobbinsTaken,
                changeFund,
                createdAt: new Date().toLocaleString('ru-RU'),
                createdByGuo: guoFio,
                issueDate: todayDateStr21(),
                issueTime: nowTimeStr21(),
                issueSignedByCtrl: false,
                issueSignedByGuo: false,
                ctrlIssueSig: '',
                guoIssueSig: '',
                returnDate: '',
                returnTime: '',
                bobbinsReturned: '',
                returnSignedByCtrl: false,
                returnSignedByGuo: false,
                ctrlReturnSig: '',
                guoReturnSig: '',
                ts: Date.now()
            };

            if (typeof db !== 'undefined' && db) {
                db.collection('guo_start_records').doc(docId).set(rec)
                    .catch(err => alert('Ошибка сохранения: ' + err.message));

                // Адресное уведомление именно этому профилю (targetTab)
                const notifId = 'notif_guo_start_' + docId;
                db.collection('notifications').doc(notifId).set({
                    text: `✍️ ГУО (${guoFio}) отправил вам документ на подпись: МКасса №${mkassa}, бобин: ${bobbinsTaken} шт., разм. фонд: ${changeFund} ₽. Нажмите, чтобы открыть и подписать.`,
                    time: new Date().toLocaleString('ru-RU'),
                    ts: Date.now(),
                    read: false,
                    targetTab: String(tab),
                    targetFio: fio,
                    type: 'guo_start_sign',
                    docId: docId
                }).catch(() => {});
            }

            if (document.getElementById('st19CtrlSelect')) document.getElementById('st19CtrlSelect').value = '';
            if (document.getElementById('st19MkassaInput')) document.getElementById('st19MkassaInput').value = '';
            if (document.getElementById('st19FundInput')) document.getElementById('st19FundInput').value = '';
            if (typeof showSyncToast === 'function') {
                showSyncToast(`✅ Отправлено контролёру ${fio} на подпись!`);
            }
        };

        // Переопределяем окно уведомлений (колокольчик):
        // показываем только общие и личные уведомления + клик открывает подпись документа
        window.openNotificationsModal = function() {
            const listEl = document.getElementById('notificationsList');
            if (!listEl) return;

            const visible = (typeof cloudNotifications !== 'undefined' && Array.isArray(cloudNotifications))
                ? cloudNotifications.filter(isNotifVisibleForMe)
                : [];

            if (!visible.length) {
                listEl.innerHTML = '<div style="color:#666;text-align:center;padding:15px;">Нет уведомлений</div>';
            } else {
                listEl.innerHTML = visible.map(n => {
                    const isSignNotif = n.type === 'guo_start_sign' && n.docId;
                    const clickAttr = isSignNotif
                        ? `onclick="openSt21CtrlSignModal('${st21Esc(n.docId)}', '${st21Esc(n.id)}')"`
                        : '';
                    const extraCls = isSignNotif ? 'st21-notif-clickable' : '';
                    return `
                        <div class="${extraCls}" ${clickAttr} style="padding:10px;border-bottom:1px solid #eee;background:${n.read ? '#fff' : '#eef6ff'};border-radius:6px;margin-bottom:4px;">
                            <div style="font-size:11px;color:#666;">${st21Esc(n.time || '')}</div>
                            <div style="font-size:13px;color:#111;">${st21Esc(n.text || '')}</div>
                            ${isSignNotif ? '<div style="font-size:12px;font-weight:bold;color:#b45309;margin-top:4px;">👉 Нажмите, чтобы открыть и подписать в профиле</div>' : ''}
                        </div>
                    `;
                }).join('');
            }
            openModal('notificationsModal');
        };

        // Кнопка «Прочитать все» помечает прочитанными только свои/видимые уведомления
        window.markAllNotificationsRead = function() {
            if (typeof cloudNotifications !== 'undefined' && Array.isArray(cloudNotifications)) {
                cloudNotifications.forEach(n => {
                    if (isNotifVisibleForMe(n) && !n.read) {
                        n.read = true;
                        if (typeof db !== 'undefined' && db) {
                            db.collection('notifications').doc(n.id).update({ read: true }).catch(() => {});
                        }
                    }
                });
            }
            updateMyBellBadge21();
            closeModal('notificationsModal');
        };

        // Клик по кнопке баннера в stage19 тоже открывает полноценное окно подписи в профиле
        window.st19ControllerSignOwnIssue = function(docId) {
            window.openSt21CtrlSignModal(docId, null);
        };
    }

    // ========================================================
    // ОКНО ПОДПИСИ ДОКУМЕНТА ГУО В ПРОФИЛЕ КОНТРОЛЁРА
    // ========================================================
    window.openSt21CtrlSignModal = async function(docId, notifId) {
        ensureSt21Modals();
        closeModal('notificationsModal');

        st21ActiveSignDocId = docId;
        st21ActiveNotifId = notifId || null;

        let rec = null;
        if (typeof db !== 'undefined' && db) {
            try {
                const snap = await db.collection('guo_start_records').doc(docId).get();
                if (snap.exists) rec = snap.data();
            } catch (e) {}
        }

        if (!rec) {
            return alert('Документ не найден или уже удалён.');
        }

        const myTab = String(appState?.user?.tab || '');
        if (myTab && String(rec.tab) !== myTab) {
            return alert(`Этот документ предназначен для другого сотрудника (${rec.fio}).`);
        }

        const bodyEl = document.getElementById('st21CtrlSignBody');
        const alreadySigned = !!rec.issueSignedByCtrl;

        bodyEl.innerHTML = `
            <div style="background:#eef6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;font-size:13.5px;line-height:1.65;">
                <div><strong>ФИО контролёра:</strong> ${st21Esc(rec.fio)} (Таб. ${st21Esc(rec.tab)})</div>
                <div><strong>Оформил оператор ГУО:</strong> ${st21Esc(rec.createdByGuo || 'Оператор ГУО')}</div>
                <div><strong>Дата / время:</strong> ${st21Esc(rec.issueDate || '')} ${st21Esc(rec.issueTime || '')}</div>
                <hr style="border:none;border-top:1px solid #cbd5e1;margin:8px 0;">
                <div>📟 <strong>№ МКассы (машинка):</strong> ${st21Esc(rec.mkassa)}</div>
                <div>🧻 <strong>Бобины (взял):</strong> ${st21Esc(rec.bobbinsTaken)} шт.</div>
                <div>💵 <strong>Разменный фонд:</strong> ${st21Esc(rec.changeFund)} ₽</div>
            </div>
            ${alreadySigned ? '<div style="margin-top:8px;padding:8px;background:#dcfce7;color:#166534;border-radius:6px;font-size:12.5px;font-weight:bold;">✅ Вы уже подписали этот документ.</div>' : ''}
        `;

        const savedSig = appState?.user?.signature || '';
        const prevEl = document.getElementById('st21CtrlSavedSigBox');
        if (savedSig) {
            prevEl.innerHTML = `<div style="font-size:11.5px;color:#15803d;">✅ Ваша подпись из профиля (будет использована автоматически, если не рисовать ниже):</div><img src="${savedSig}" style="max-height:50px;margin-top:4px;border:1px solid #ccc;background:#fff;">`;
            prevEl.style.display = 'block';
        } else {
            prevEl.style.display = 'none';
        }

        const saveBtn = document.getElementById('st21BtnConfirmCtrlSign');
        if (saveBtn) saveBtn.style.display = alreadySigned ? 'none' : 'inline-block';

        openModal('st21CtrlSignModal');
        setTimeout(() => {
            if (typeof initCanvas === 'function') initCanvas('st21CtrlSignCanvas');
        }, 100);
    };

    window.confirmSt21CtrlSignAndSave = async function() {
        if (!st21ActiveSignDocId) return;

        const drawnSig = getCanvasData21('st21CtrlSignCanvas');
        const profileSig = appState?.user?.signature || '';
        const finalSig = drawnSig || profileSig;

        if (!finalSig) {
            return alert('Пожалуйста, нарисуйте вашу подпись в окне ниже!');
        }

        const updateData = {
            issueSignedByCtrl: true,
            ctrlIssueSig: finalSig,
            issueDate: todayDateStr21(),
            issueTime: nowTimeStr21(),
            tsUpdated: Date.now()
        };

        if (typeof db !== 'undefined' && db) {
            try {
                await db.collection('guo_start_records').doc(st21ActiveSignDocId).set(updateData, { merge: true });
                if (st21ActiveNotifId) {
                    db.collection('notifications').doc(st21ActiveNotifId).update({ read: true }).catch(() => {});
                } else {
                    db.collection('notifications').doc('notif_guo_start_' + st21ActiveSignDocId).update({ read: true }).catch(() => {});
                }
            } catch (err) {
                return alert('Ошибка сохранения подписи: ' + err.message);
            }
        }

        closeModal('st21CtrlSignModal');
        if (typeof showSyncToast === 'function') showSyncToast('✅ Подпись сохранена и передана в ГУО!');
    };

    // ========================================================
    // 2. ПРИЧИНА ЗАКРЫТИЯ СМЕНЫ ПРИ СОХРАНЕНИИ ФДУ
    //    + «ВАША ФДУ НА ПОДПИСИ» ЖЁЛТЫМ ЦВЕТОМ
    // ========================================================
    window.setSt21QuickReason = function(txt) {
        const inp = document.getElementById('st21CloseReasonInput');
        if (inp) {
            inp.value = txt;
            inp.focus();
        }
    };

    function patchFduCloseWithReason() {
        // При нажатии «Сохранить рапорт смены» открываем вопрос о причине закрытия
        window.openGuoSignModal = function() {
            if (!appState?.user) return alert('Сначала войдите в профиль!');
            ensureSt21Modals();
            const inp = document.getElementById('st21CloseReasonInput');
            if (inp) inp.value = '';
            openModal('st21CloseShiftReasonModal');
            setTimeout(() => { if (inp) inp.focus(); }, 100);
        };

        // Жёлтый статус «Ваша ФДУ на подписи»
        const _origUpdateBtn = window.updateShiftMainButton;
        window.updateShiftMainButton = function() {
            const btn = document.getElementById('btnMainShift');
            if (!btn) return;
            if (appState?.shiftState === 'pending_guo') {
                btn.className = 'btn-shift-status st21-fdu-pending-yellow';
                btn.innerText = '🟡 Ваша ФДУ на подписи';
            } else {
                btn.classList.remove('st21-fdu-pending-yellow');
                if (typeof _origUpdateBtn === 'function') _origUpdateBtn();
            }
        };
        window.updateShiftMainButton();

        // Показываем причину закрытия смены оператору ГУО при проверке ФДУ (stage8.js)
        if (typeof window.openGuoReviewAndSignModal === 'function') {
            const _origReview = window.openGuoReviewAndSignModal;
            window.openGuoReviewAndSignModal = function(docId) {
                _origReview(docId);
                const rep = (typeof cloudPendingFdu !== 'undefined')
                    ? cloudPendingFdu.find(x => x.id === docId)
                    : null;
                const body = document.getElementById('st8ReviewBody');
                if (rep && rep.closeReason && body && !body.querySelector('.st21-reason-view')) {
                    const box = document.createElement('div');
                    box.className = 'st21-reason-view';
                    box.style.cssText = 'background:#fffbeb;border:1px solid #f59e0b;border-radius:6px;padding:8px 10px;margin-bottom:10px;font-size:13px;color:#92400e;';
                    box.innerHTML = `<strong>💬 Причина закрытия смены:</strong> ${st21Esc(rep.closeReason)}`;
                    body.prepend(box);
                }
            };
        }
    }

    window.confirmSt21SendFduWithReason = function() {
        const reason = document.getElementById('st21CloseReasonInput')?.value.trim() || '';
        if (!reason) {
            return alert('Укажите причину закрытия смены в комментарии!');
        }
        if (!appState?.user) return alert('Сначала войдите в профиль!');

        const route = document.getElementById('fduRouteVal')?.value.trim() || '—';
        const mkassa = document.getElementById('fduCashVal')?.value.trim() || '—';
        const grandTix = document.getElementById('fduGrandTickets')?.innerText || '0';
        const grandSum = document.getElementById('fduGrandSum')?.innerText || '0.00';
        const testTix = document.getElementById('fduTestTicketCount')?.value || '0';
        const tapeLeft = document.getElementById('fduTapeLeft')?.value || '—';

        const rows = Array.from(document.querySelectorAll('#fduLeftBody .train-slot-row')).map(tr => ({
            num: tr.querySelector('.fdu-train-num')?.value.trim() || '',
            route: tr.querySelector('.fdu-train-route')?.value.trim() || '',
            time: tr.querySelector('.fdu-train-time')?.value.trim() || '',
            tix: tr.querySelector('.fdu-train-tix')?.value.trim() || '',
            sum: tr.querySelector('.fdu-train-sum')?.value.trim() || ''
        })).filter(r => r.num);

        const routeInfo = (typeof getRouteStartStation === 'function' && route !== '—')
            ? getRouteStartStation(route)
            : { station: '', firstTrain: '' };
        const startStation = routeInfo.station || appState.user.station || appState.user.sector || 'Клин';

        const todayIso = new Date().toISOString().split('T')[0];
        const docId = `${appState.user.tab}_${todayIso}`;
        const sentAt = new Date().toLocaleString('ru-RU');

        const payload = {
            id: docId,
            tab: appState.user.tab,
            fio: appState.user.fio,
            route,
            mkassa,
            startStation,
            firstTrain: routeInfo.firstTrain || (rows[0] ? `${rows[0].num} (${rows[0].route})` : '—'),
            grandTix,
            grandSum,
            testTix,
            tapeLeft,
            closeReason: reason,
            rows,
            status: 'pending',
            sentAt,
            ts: Date.now()
        };

        if (typeof db !== 'undefined' && db) {
            db.collection('pending_fdu_reports').doc(docId).set(payload)
                .catch(err => alert('Ошибка отправки: ' + err.message));
        } else if (typeof cloudPendingFdu !== 'undefined') {
            cloudPendingFdu = cloudPendingFdu.filter(x => x.id !== docId);
            cloudPendingFdu.unshift(payload);
        }

        appState.shiftState = 'pending_guo';
        if (typeof persistActiveShift === 'function') persistActiveShift();
        window.updateShiftMainButton();

        if (typeof sendCloudNotification === 'function') {
            sendCloudNotification(`📄 В ГУО (${startStation}): ${appState.user.fio} (маршрут ${route}) отправил ФДУ на подпись. Причина: ${reason}`);
        }
        if (typeof addLog === 'function') {
            addLog(`ФДУ отправлена на подпись в ГУО (${startStation}). Причина: ${reason}`);
        }

        // Закрываем окно причины и сворачиваем ФДУ на главный экран
        closeModal('st21CloseShiftReasonModal');
        if (typeof backToMain === 'function') backToMain();
        if (typeof showSyncToast === 'function') showSyncToast('🟡 Ваша ФДУ на подписи');
    };

    // ========================================================
    // МОДАЛЬНЫЕ ОКНА
    // ========================================================
    function ensureSt21Modals() {
        if (document.getElementById('st21CtrlSignModal')) return;
        const wrap = document.createElement('div');
        wrap.innerHTML = `
            <!-- Окно подписи документа ГУО в профиле контролёра -->
            <div id="st21CtrlSignModal" class="modal">
                <div class="modal-content modal-wide" style="max-height:90vh;overflow-y:auto;">
                    <h3 style="margin-top:0;color:#003366;">✍️ Документ от ГУО на подпись</h3>
                    <div id="st21CtrlSignBody" style="margin-bottom:12px;"></div>

                    <div id="st21CtrlSavedSigBox" style="display:none;background:#f0fdf4;padding:8px;border-radius:6px;text-align:center;margin-bottom:10px;"></div>

                    <div class="form-group">
                        <label>Ваша подпись (можно расписаться прямо здесь):</label>
                        <canvas id="st21CtrlSignCanvas" style="border:2px dashed #003366;background:#fafafa;width:100%;height:85px;cursor:crosshair;"></canvas>
                        <button type="button" class="btn-danger" style="width:auto;padding:4px 10px;font-size:11px;margin-top:4px;" onclick="clearSt21Canvas('st21CtrlSignCanvas')">Очистить</button>
                    </div>

                    <div style="display:flex;gap:10px;flex-wrap:wrap;">
                        <button type="button" id="st21BtnConfirmCtrlSign" class="btn-success" style="flex:1;" onclick="confirmSt21CtrlSignAndSave()">✅ Подписать и сохранить</button>
                        <button type="button" class="btn-secondary" style="width:auto;" onclick="closeModal('st21CtrlSignModal')">Закрыть</button>
                    </div>
                </div>
            </div>

            <!-- Окно «Почему вы закрываете смену?» перед отправкой ФДУ -->
            <div id="st21CloseShiftReasonModal" class="modal">
                <div class="modal-content">
                    <h3 style="margin-top:0;color:#003366;">❓ Почему вы закрываете смену?</h3>
                    <div style="font-size:12.5px;color:#475569;margin-bottom:8px;">
                        Укажите причину закрытия смены в комментарии перед отправкой ФДУ на подпись оператору ГУО:
                    </div>
                    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
                        <button type="button" class="st21-reason-chip" onclick="setSt21QuickReason('Окончание смены по графику')">Окончание смены</button>
                        <button type="button" class="st21-reason-chip" onclick="setSt21QuickReason('Замена / подмена на маршруте')">Замена / подмена</button>
                        <button type="button" class="st21-reason-chip" onclick="setSt21QuickReason('Неисправность МКассы')">Неисправность МКассы</button>
                    </div>
                    <div class="form-group">
                        <label>Комментарий (причина):</label>
                        <textarea id="st21CloseReasonInput" rows="3" class="form-input" placeholder="Например: Окончание смены по графику..."></textarea>
                    </div>
                    <div style="display:flex;gap:10px;flex-wrap:wrap;">
                        <button type="button" class="btn-success" style="flex:1;" onclick="confirmSt21SendFduWithReason()">📤 Сохранить и отправить ФДУ</button>
                        <button type="button" class="btn-secondary" style="width:auto;" onclick="closeModal('st21CloseShiftReasonModal')">Отмена</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(wrap);
    }

    // ========================================================
    // ЗАПУСК
    // ========================================================
    window.addEventListener('load', () => {
        injectSt21Styles();
        ensureSt21Modals();

        setTimeout(() => {
            patchGuoStartSaveAndNotifications();
            patchFduCloseWithReason();

            // Следим за колокольчиком, чтобы бейдж считал только уведомления для текущего профиля
            if (typeof db !== 'undefined' && db) {
                db.collection('notifications').onSnapshot(() => {
                    setTimeout(updateMyBellBadge21, 120);
                });
            }

            if (typeof window.showMainScreen === 'function') {
                const _origShow21 = window.showMainScreen;
                window.showMainScreen = function() {
                    const r = _origShow21.apply(this, arguments);
                    setTimeout(() => {
                        window.updateShiftMainButton();
                        updateMyBellBadge21();
                    }, 150);
                    return r;
                };
            }
        }, 2700);
    });
})();
