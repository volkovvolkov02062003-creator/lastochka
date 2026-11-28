// ============================================================
// === STAGE 19: ПРОФИЛЬ ГУО — «НА НАЧАЛО РАБОТЫ КОНТРОЛЁРОВ» ===
// === ДОКУМЕНТЫ НА ПОДПИСЬ И 3 ЖУРНАЛА (МКАССА, БОБИНЫ, РФ) ===
// ============================================================
(function initStage19GuoStartAndJournals() {
    let st19Records = [];
    let st19ActiveJournalTab = 'mkassa';
    let st19ActiveDocId = null;

    function st19Esc(str) {
        return String(str ?? '').replace(/[&<>"']/g, m => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[m]));
    }

    function todayDateStr() {
        return new Date().toLocaleDateString('ru-RU');
    }

    function nowTimeStr() {
        return new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }

    function getCanvasDataIfDrawn(canvasId) {
        if (typeof sigCtxMap === 'undefined' || !sigCtxMap[canvasId]) return '';
        const c = sigCtxMap[canvasId].c;
        const blank = document.createElement('canvas');
        blank.width = c.width;
        blank.height = c.height;
        return c.toDataURL() !== blank.toDataURL() ? c.toDataURL() : '';
    }

    window.clearSt19Canvas = function(canvasId) {
        if (typeof sigCtxMap !== 'undefined' && sigCtxMap[canvasId]) {
            const s = sigCtxMap[canvasId];
            s.ctx.clearRect(0, 0, s.c.width, s.c.height);
        }
    };

    function renderSigCell(sigData, fallbackName) {
        if (sigData && sigData.startsWith('data:image')) {
            return `<img src="${sigData}" style="max-height:34px;max-width:95px;display:block;margin:0 auto;background:#fff;border:1px solid #ddd;border-radius:3px;">`;
        }
        return fallbackName ? `<span style="font-size:11px;color:#003366;">${st19Esc(fallbackName)}</span>` : '—';
    }

    // ========================================================
    // СТИЛИ
    // ========================================================
    function injectSt19Styles() {
        if (document.getElementById('st19-styles')) return;
        const st = document.createElement('style');
        st.id = 'st19-styles';
        st.innerHTML = `
            .st19-guo-start-btn {
                width: 100%;
                padding: 16px 14px;
                margin-bottom: 12px;
                background: linear-gradient(135deg, #0055aa, #003366);
                color: #fff;
                border: none;
                border-radius: 10px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                box-shadow: 0 3px 10px rgba(0,51,102,0.28);
            }
            .st19-doc-card {
                background: #f8fafc;
                border: 1px solid #cbd5e1;
                border-left: 4px solid #0055aa;
                border-radius: 8px;
                padding: 10px 12px;
                margin-bottom: 8px;
                font-size: 13px;
            }
            .st19-doc-card.pending {
                background: #fffbeb;
                border-left-color: #e63946;
            }
            .st19-doc-card.done {
                background: #f0fdf4;
                border-left-color: #28a745;
            }
            .st19-jtabs {
                display: flex;
                gap: 6px;
                flex-wrap: wrap;
                margin-bottom: 10px;
            }
            .st19-jtab-btn {
                flex: 1;
                min-width: 140px;
                padding: 9px 10px !important;
                margin: 0 !important;
                font-size: 12.5px !important;
                background: #e2e8f0 !important;
                color: #1e293b !important;
                border-radius: 7px !important;
                font-weight: 600;
            }
            .st19-jtab-btn.active {
                background: #003366 !important;
                color: #fff !important;
            }
            .st19-table-wrap {
                overflow-x: auto;
                max-height: 55vh;
                border: 1px solid #cbd5e1;
                border-radius: 6px;
                background: #fff;
            }
            .st19-jtable {
                width: 100%;
                border-collapse: collapse;
                font-size: 12px;
                min-width: 720px;
            }
            .st19-jtable th, .st19-jtable td {
                border: 1px solid #cbd5e1;
                padding: 6px 8px;
                text-align: center;
                vertical-align: middle;
                color: #111;
            }
            .st19-jtable th {
                background: #dce6f1;
                color: #003366;
                font-weight: bold;
                position: sticky;
                top: 0;
                z-index: 2;
            }
            #st19CtrlBanner {
                background: #fff3cd;
                border: 2px solid #f59e0b;
                border-radius: 10px;
                padding: 10px 12px;
                margin: 10px 0;
                display: none;
                font-size: 13px;
                color: #1e293b;
            }
        `;
        document.head.appendChild(st);
    }

    // ========================================================
    // ДОБАВЛЕНИЕ КНОПКИ В ПРОФИЛЬ ГУО И БАННЕРА КОНТРОЛЁРУ
    // ========================================================
    function ensureGuoStartButton() {
        const box = document.getElementById('guoDashboardBox');
        if (!box || document.getElementById('btnGuoStartControllers')) return;

        const btn = document.createElement('button');
        btn.id = 'btnGuoStartControllers';
        btn.type = 'button';
        btn.className = 'st19-guo-start-btn';
        btn.onclick = () => window.openSt19GuoStartModal();
        btn.innerHTML = `📋 На начало работы контролёров <span id="guoStartBadge" class="guo-count-badge">0</span>`;

        const finishBtn = box.querySelector('.guo-main-btn');
        if (finishBtn) box.insertBefore(btn, finishBtn);
        else box.prepend(btn);
    }

    function updateGuoStartBadge() {
        const badge = document.getElementById('guoStartBadge');
        const pendingCount = st19Records.filter(r => !r.issueSignedByCtrl || !r.issueSignedByGuo).length;
        if (badge) {
            if (pendingCount > 0) {
                badge.innerText = pendingCount;
                badge.style.display = 'inline-flex';
            } else {
                badge.style.display = 'none';
            }
        }
        renderControllerPendingBanner();
    }

    // Если контролёр вошёл в свой профиль и ему пришли документы на подпись от ГУО
    function renderControllerPendingBanner() {
        const mainScr = document.getElementById('main-screen');
        if (!mainScr || !appState?.user?.tab) return;

        let banner = document.getElementById('st19CtrlBanner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'st19CtrlBanner';
            const card = mainScr.querySelector('.card');
            if (card) card.prepend(banner);
            else mainScr.prepend(banner);
        }

        const myTab = String(appState.user.tab);
        const myPending = st19Records.filter(r => String(r.tab) === myTab && !r.issueSignedByCtrl);

        if (!myPending.length) {
            banner.style.display = 'none';
            return;
        }

        const rec = myPending[0];
        banner.style.display = 'block';
        banner.innerHTML = `
            <div style="font-weight:bold;color:#92400e;margin-bottom:4px;">📋 ГУО оформил выдачу на начало смены (нужна ваша подпись):</div>
            <div style="margin-bottom:8px;">
                № МКассы: <b>${st19Esc(rec.mkassa)}</b> • Бобины: <b>${st19Esc(rec.bobbinsTaken)} шт.</b> • Разм. фонд: <b>${st19Esc(rec.changeFund)} ₽</b>
            </div>
            <button type="button" class="btn-success" style="width:auto;margin:0;padding:7px 14px;font-size:12.5px;" onclick="st19ControllerSignOwnIssue('${rec.id}')">✍️ Подписать получение своей подписью</button>
        `;
    }

    window.st19ControllerSignOwnIssue = function(docId) {
        const rec = st19Records.find(r => r.id === docId);
        if (!rec) return;
        const sig = appState?.user?.signature || '';
        const updateData = {
            issueSignedByCtrl: true,
            ctrlIssueSig: sig,
            issueDate: rec.issueDate || todayDateStr(),
            issueTime: rec.issueTime || nowTimeStr(),
            tsUpdated: Date.now()
        };
        if (typeof db !== 'undefined' && db) {
            db.collection('guo_start_records').doc(docId).set(updateData, { merge: true }).catch(() => {});
        } else {
            Object.assign(rec, updateData);
            updateGuoStartBadge();
        }
        if (typeof showSyncToast === 'function') showSyncToast('✅ Получение МКассы, бобин и разм. фонда подписано!');
    };

    // ========================================================
    // ОКНО «НА НАЧАЛО РАБОТЫ КОНТРОЛЁРОВ»
    // ========================================================
    window.openSt19GuoStartModal = function() {
        ensureSt19Modals();

        // Заполняем список сотрудников
        const sel = document.getElementById('st19CtrlSelect');
        if (sel) {
            const workers = Array.isArray(appState?.workers) ? appState.workers : [];
            sel.innerHTML = `<option value="">-- Выберите контролёра --</option>` +
                workers.map(w => `<option value="${st19Esc(w.tab)}">${st19Esc(w.fio)} (Таб. ${st19Esc(w.tab)})</option>`).join('');
        }

        // Заполняем подсказки по МКассам
        const dl = document.getElementById('st19MkassaDatalist');
        if (dl && typeof mkassasDb !== 'undefined' && Array.isArray(mkassasDb)) {
            dl.innerHTML = mkassasDb.map(m => `<option value="${st19Esc(m.num || m.name || m.id || '')}">`).join('');
        }

        document.getElementById('st19MkassaInput').value = '';
        document.getElementById('st19BobbinsInput').value = '2';
        document.getElementById('st19FundInput').value = '';

        renderSt19PendingDocsList();
        openModal('st19GuoStartModal');
    };

    window.saveSt19StartRecord = function() {
        const tab = document.getElementById('st19CtrlSelect').value.trim();
        const mkassa = document.getElementById('st19MkassaInput').value.trim();
        const bobbinsTaken = document.getElementById('st19BobbinsInput').value.trim() || '0';
        const changeFund = document.getElementById('st19FundInput').value.trim() || '0';

        if (!tab) return alert('Выберите ФИО контролёра!');
        if (!mkassa) return alert('Укажите № МКассы (машинки)!');

        const w = (appState?.workers || []).find(x => String(x.tab) === String(tab));
        const fio = w ? w.fio : `Сотрудник ${tab}`;
        const docId = 'gstart_' + Date.now() + '_' + tab;

        const rec = {
            id: docId,
            tab: String(tab),
            fio,
            mkassa,
            bobbinsTaken,
            changeFund,
            createdAt: new Date().toLocaleString('ru-RU'),
            createdByGuo: appState?.user?.fio || 'Оператор ГУО',
            // Выдача
            issueDate: todayDateStr(),
            issueTime: nowTimeStr(),
            issueSignedByCtrl: false,
            issueSignedByGuo: false,
            ctrlIssueSig: '',
            guoIssueSig: '',
            // Сдача
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
            db.collection('guo_start_records').doc(docId).set(rec).catch(err => alert('Ошибка сохранения: ' + err.message));
        } else {
            st19Records.unshift(rec);
            renderSt19PendingDocsList();
            updateGuoStartBadge();
        }

        if (typeof sendCloudNotification === 'function') {
            sendCloudNotification(`📋 ГУО выдал на смену (${fio}): МКасса №${mkassa}, бобин: ${bobbinsTaken}, разм. фонд: ${changeFund} ₽. Документы ждут подписи.`);
        }

        document.getElementById('st19CtrlSelect').value = '';
        document.getElementById('st19MkassaInput').value = '';
        document.getElementById('st19FundInput').value = '';
        if (typeof showSyncToast === 'function') showSyncToast('✅ Сохранено! Документ добавлен на подпись.');
    };

    function renderSt19PendingDocsList() {
        const box = document.getElementById('st19DocsListBox');
        if (!box) return;

        if (!st19Records.length) {
            box.innerHTML = '<div style="text-align:center;color:#64748b;padding:14px;font-size:12.5px;">Документов на подпись пока нет. Заполните форму выше и нажмите «Сохранить».</div>';
            return;
        }

        box.innerHTML = st19Records.slice(0, 40).map(r => {
            const issueDone = r.issueSignedByCtrl && r.issueSignedByGuo;
            const returnDone = r.returnSignedByCtrl && r.returnSignedByGuo;
            const cardCls = returnDone ? 'done' : (issueDone ? '' : 'pending');

            const statusIssue = `Выдача: Контролёр ${r.issueSignedByCtrl ? '✅' : '⏳'} | ГУО ${r.issueSignedByGuo ? '✅' : '⏳'}`;
            const statusReturn = returnDone
                ? `Сдача: ✅ ${st19Esc(r.returnDate)} ${st19Esc(r.returnTime)} (бобин сдано: ${st19Esc(r.bobbinsReturned || '0')})`
                : (issueDone ? 'Сдача: ⏳ на линии' : '');

            return `
                <div class="st19-doc-card ${cardCls}">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap;">
                        <div>
                            <div style="font-weight:bold;color:#003366;">${st19Esc(r.fio)} <span style="font-weight:normal;color:#555;">(Таб. ${st19Esc(r.tab)})</span></div>
                            <div style="margin-top:2px;">
                                № МКассы: <b>${st19Esc(r.mkassa)}</b> • Бобины: <b>${st19Esc(r.bobbinsTaken)}</b> • Разм. фонд: <b>${st19Esc(r.changeFund)} ₽</b>
                            </div>
                            <div style="font-size:11.5px;color:#475569;margin-top:3px;">${statusIssue}${statusReturn ? '<br>' + statusReturn : ''}</div>
                        </div>
                        <div style="display:flex;gap:6px;flex-wrap:wrap;">
                            ${!issueDone ? `<button type="button" class="btn-success" style="width:auto;margin:0;padding:6px 10px;font-size:12px;" onclick="openSt19IssueSignModal('${r.id}')">✍️ Подписать выдачу</button>` : ''}
                            ${issueDone && !returnDone ? `<button type="button" class="btn-action" style="width:auto;margin:0;padding:6px 10px;font-size:12px;background:#0055aa;" onclick="openSt19ReturnSignModal('${r.id}')">📥 Оформить сдачу</button>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ========================================================
    // ПОДПИСЬ ВЫДАЧИ (КОНТРОЛЁР + ОПЕРАТОР ГУО)
    // ========================================================
    window.openSt19IssueSignModal = function(docId) {
        const rec = st19Records.find(r => r.id === docId);
        if (!rec) return;
        st19ActiveDocId = docId;

        const w = (appState?.workers || []).find(x => String(x.tab) === String(rec.tab));
        const ctrlSavedSig = rec.ctrlIssueSig || w?.signature || '';
        const guoSavedSig = rec.guoIssueSig || appState?.user?.signature || '';

        document.getElementById('st19SignInfo').innerHTML = `
            <strong>Контролёр:</strong> ${st19Esc(rec.fio)} (Таб. ${st19Esc(rec.tab)})<br>
            <strong>№ МКассы:</strong> ${st19Esc(rec.mkassa)} | <strong>Бобины:</strong> ${st19Esc(rec.bobbinsTaken)} шт. | <strong>Разм. фонд:</strong> ${st19Esc(rec.changeFund)} ₽
        `;

        const cPrev = document.getElementById('st19CtrlSavedSigPreview');
        cPrev.innerHTML = ctrlSavedSig
            ? `<small style="color:#15803d;">✅ Подпись контролёра найдена (можно не рисовать заново):</small><br><img src="${ctrlSavedSig}" style="max-height:42px;border:1px solid #ccc;background:#fff;">`
            : `<small style="color:#b45309;">Подпись контролёра не сохранена — распишитесь ниже:</small>`;

        const gPrev = document.getElementById('st19GuoSavedSigPreview');
        gPrev.innerHTML = guoSavedSig
            ? `<small style="color:#15803d;">✅ Ваша подпись из профиля ГУО (можно не рисовать заново):</small><br><img src="${guoSavedSig}" style="max-height:42px;border:1px solid #ccc;background:#fff;">`
            : `<small style="color:#b45309;">Подпись оператора ГУО — распишитесь ниже:</small>`;

        openModal('st19IssueSignModal');
        setTimeout(() => {
            if (typeof initCanvas === 'function') {
                initCanvas('st19CtrlIssueCanvas');
                initCanvas('st19GuoIssueCanvas');
            }
        }, 100);
    };

    window.confirmSt19IssueSign = function() {
        const rec = st19Records.find(r => r.id === st19ActiveDocId);
        if (!rec) return;

        const w = (appState?.workers || []).find(x => String(x.tab) === String(rec.tab));
        const ctrlSig = getCanvasDataIfDrawn('st19CtrlIssueCanvas') || rec.ctrlIssueSig || w?.signature || '';
        const guoSig = getCanvasDataIfDrawn('st19GuoIssueCanvas') || rec.guoIssueSig || appState?.user?.signature || '';

        const updateData = {
            issueDate: todayDateStr(),
            issueTime: nowTimeStr(),
            issueSignedByCtrl: true,
            issueSignedByGuo: true,
            ctrlIssueSig: ctrlSig,
            guoIssueSig: guoSig,
            guoIssueName: appState?.user?.fio || 'Оператор ГУО',
            tsUpdated: Date.now()
        };

        if (typeof db !== 'undefined' && db) {
            db.collection('guo_start_records').doc(rec.id).set(updateData, { merge: true }).catch(() => {});
        } else {
            Object.assign(rec, updateData);
            renderSt19PendingDocsList();
            updateGuoStartBadge();
        }

        closeModal('st19IssueSignModal');
        if (typeof showSyncToast === 'function') showSyncToast('✅ Выдача подписана и записана во все 3 журнала!');
    };

    // ========================================================
    // ОФОРМЛЕНИЕ СДАЧИ (МКАССА + БОБИНЫ)
    // ========================================================
    window.openSt19ReturnSignModal = function(docId) {
        const rec = st19Records.find(r => r.id === docId);
        if (!rec) return;
        st19ActiveDocId = docId;

        document.getElementById('st19ReturnInfo').innerHTML = `
            <strong>Контролёр:</strong> ${st19Esc(rec.fio)} (Таб. ${st19Esc(rec.tab)})<br>
            <strong>№ МКассы:</strong> ${st19Esc(rec.mkassa)} | <strong>Взял бобин:</strong> ${st19Esc(rec.bobbinsTaken)} шт.
        `;
        document.getElementById('st19BobbinsReturnInput').value = rec.bobbinsReturned || '0';

        openModal('st19ReturnSignModal');
        setTimeout(() => {
            if (typeof initCanvas === 'function') {
                initCanvas('st19CtrlReturnCanvas');
                initCanvas('st19GuoReturnCanvas');
            }
        }, 100);
    };

    window.confirmSt19ReturnSign = function() {
        const rec = st19Records.find(r => r.id === st19ActiveDocId);
        if (!rec) return;

        const w = (appState?.workers || []).find(x => String(x.tab) === String(rec.tab));
        const bobbinsReturned = document.getElementById('st19BobbinsReturnInput').value.trim() || '0';
        const ctrlSig = getCanvasDataIfDrawn('st19CtrlReturnCanvas') || w?.signature || rec.ctrlIssueSig || '';
        const guoSig = getCanvasDataIfDrawn('st19GuoReturnCanvas') || appState?.user?.signature || rec.guoIssueSig || '';

        const updateData = {
            returnDate: todayDateStr(),
            returnTime: nowTimeStr(),
            bobbinsReturned,
            returnSignedByCtrl: true,
            returnSignedByGuo: true,
            ctrlReturnSig: ctrlSig,
            guoReturnSig: guoSig,
            guoReturnName: appState?.user?.fio || 'Оператор ГУО',
            tsUpdated: Date.now()
        };

        if (typeof db !== 'undefined' && db) {
            db.collection('guo_start_records').doc(rec.id).set(updateData, { merge: true }).catch(() => {});
        } else {
            Object.assign(rec, updateData);
            renderSt19PendingDocsList();
        }

        closeModal('st19ReturnSignModal');
        if (typeof showSyncToast === 'function') showSyncToast('✅ Сдача оформлена и записана в журналы!');
    };

    // ========================================================
    // ПРОСМОТР 3 ЖУРНАЛОВ
    // ========================================================
    window.openSt19JournalsModal = function(tabName) {
        ensureSt19Modals();
        st19ActiveJournalTab = tabName || 'mkassa';
        renderSt19JournalTable();
        openModal('st19JournalsModal');
    };

    window.switchSt19JournalTab = function(tabName) {
        st19ActiveJournalTab = tabName;
        renderSt19JournalTable();
    };

    function renderSt19JournalTable() {
        document.querySelectorAll('.st19-jtab-btn').forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-jtab') === st19ActiveJournalTab);
        });

        const box = document.getElementById('st19JournalTableBox');
        if (!box) return;

        const rows = st19Records;
        let html = '';

        if (st19ActiveJournalTab === 'mkassa') {
            // 1. Журнал о выдаче МКассы
            html = `
                <table class="st19-jtable">
                    <thead>
                        <tr>
                            <th colspan="5" style="background:#cfe2ff;">Выдача МКассы</th>
                            <th colspan="4" style="background:#d1e7dd;">Сдача МКассы</th>
                        </tr>
                        <tr>
                            <th>Дата</th>
                            <th>Время</th>
                            <th>№ МКассы</th>
                            <th>Подпись (получил)</th>
                            <th>Роспись оператора ГУО</th>
                            <th>Дата</th>
                            <th>Время</th>
                            <th>Подпись (сдал)</th>
                            <th>Роспись оператора ГУО</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.length === 0 ? '<tr><td colspan="9" style="color:#64748b;padding:16px;">Записей в журнале пока нет</td></tr>' : rows.map(r => `
                            <tr>
                                <td>${st19Esc(r.issueDate || '—')}</td>
                                <td>${st19Esc(r.issueTime || '—')}</td>
                                <td><b>${st19Esc(r.mkassa)}</b><br><small style="color:#555;">${st19Esc(r.fio)}</small></td>
                                <td>${r.issueSignedByCtrl ? renderSigCell(r.ctrlIssueSig, r.fio) : '<span style="color:#b45309;">⏳</span>'}</td>
                                <td>${r.issueSignedByGuo ? renderSigCell(r.guoIssueSig, r.guoIssueName || r.createdByGuo) : '<span style="color:#b45309;">⏳</span>'}</td>
                                <td>${st19Esc(r.returnDate || '—')}</td>
                                <td>${st19Esc(r.returnTime || '—')}</td>
                                <td>${r.returnSignedByCtrl ? renderSigCell(r.ctrlReturnSig, r.fio) : '—'}</td>
                                <td>${r.returnSignedByGuo ? renderSigCell(r.guoReturnSig, r.guoReturnName) : '—'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else if (st19ActiveJournalTab === 'bobbins') {
            // 2. Журнал выдачи бобин
            html = `
                <table class="st19-jtable">
                    <thead>
                        <tr>
                            <th>Дата</th>
                            <th>№ МКассы</th>
                            <th>ФИО контролёра</th>
                            <th>Кол-во взял</th>
                            <th>Подпись контролёра</th>
                            <th>Кол-во сдал</th>
                            <th>Подпись контролёра</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.length === 0 ? '<tr><td colspan="7" style="color:#64748b;padding:16px;">Записей в журнале пока нет</td></tr>' : rows.map(r => `
                            <tr>
                                <td>${st19Esc(r.issueDate || '—')}</td>
                                <td><b>${st19Esc(r.mkassa)}</b></td>
                                <td>${st19Esc(r.fio)}</td>
                                <td><b>${st19Esc(r.bobbinsTaken)}</b></td>
                                <td>${r.issueSignedByCtrl ? renderSigCell(r.ctrlIssueSig, r.fio) : '<span style="color:#b45309;">⏳</span>'}</td>
                                <td><b>${st19Esc(r.bobbinsReturned || '—')}</b></td>
                                <td>${r.returnSignedByCtrl ? renderSigCell(r.ctrlReturnSig, r.fio) : '—'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            // 3. Журнал о выдаче денежных средств
            html = `
                <table class="st19-jtable">
                    <thead>
                        <tr>
                            <th>Дата</th>
                            <th>№ МКассы</th>
                            <th>ФИО контролёра</th>
                            <th>Выдача разм. фонд</th>
                            <th>Подпись контролёра</th>
                            <th></th>
                            <th></th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.length === 0 ? '<tr><td colspan="8" style="color:#64748b;padding:16px;">Записей в журнале пока нет</td></tr>' : rows.map(r => `
                            <tr>
                                <td>${st19Esc(r.issueDate || '—')}</td>
                                <td><b>${st19Esc(r.mkassa)}</b></td>
                                <td>${st19Esc(r.fio)}</td>
                                <td><b>${st19Esc(r.changeFund)} ₽</b></td>
                                <td>${r.issueSignedByCtrl ? renderSigCell(r.ctrlIssueSig, r.fio) : '<span style="color:#b45309;">⏳</span>'}</td>
                                <td></td>
                                <td></td>
                                <td></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }

        box.innerHTML = html;
    }

    window.printSt19ActiveJournal = function() {
        const titles = {
            mkassa: 'Журнал о выдаче МКассы',
            bobbins: 'Журнал выдачи бобин',
            money: 'Журнал о выдаче денежных средств'
        };
        const content = document.getElementById('st19JournalTableBox')?.innerHTML || '';
        const w = window.open('', '_blank');
        if (!w) return alert('Разрешите всплывающие окна для печати.');
        w.document.write(`
            <html><head><title>${titles[st19ActiveJournalTab]}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 14px; }
                h2 { text-align: center; color: #003366; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; }
                th, td { border: 1px solid #333; padding: 6px; text-align: center; }
                th { background: #dce6f1; }
            </style></head><body>
            <h2>${titles[st19ActiveJournalTab]}</h2>
            ${content}
            <script>window.onload = function(){ window.print(); };<\/script>
            </body></html>
        `);
        w.document.close();
    };

    // ========================================================
    // МОДАЛЬНЫЕ ОКНА
    // ========================================================
    function ensureSt19Modals() {
        if (document.getElementById('st19GuoStartModal')) return;
        const wrap = document.createElement('div');
        wrap.innerHTML = `
            <!-- 1. Главное окно: На начало работы контролёров -->
            <div id="st19GuoStartModal" class="modal">
                <div class="modal-content modal-wide" style="max-height:90vh;overflow-y:auto;">
                    <h3 style="margin-top:0;color:#003366;">📋 На начало работы контролёров</h3>

                    <div style="background:#eef6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;margin-bottom:14px;">
                        <div class="form-group">
                            <label>ФИО контролёра:</label>
                            <select id="st19CtrlSelect" class="form-input"></select>
                        </div>
                        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;">
                            <div class="form-group" style="margin-bottom:0;">
                                <label>№ МКассы (машинка):</label>
                                <input type="text" id="st19MkassaInput" list="st19MkassaDatalist" placeholder="Например, 13340" class="form-input">
                                <datalist id="st19MkassaDatalist"></datalist>
                            </div>
                            <div class="form-group" style="margin-bottom:0;">
                                <label>Сколько взял бобин (шт.):</label>
                                <input type="number" id="st19BobbinsInput" min="0" value="2" class="form-input">
                            </div>
                            <div class="form-group" style="margin-bottom:0;">
                                <label>Разменный фонд (₽):</label>
                                <input type="number" id="st19FundInput" min="0" placeholder="Например, 5000" class="form-input">
                            </div>
                        </div>
                        <button type="button" class="btn-success" style="margin-top:12px;" onclick="saveSt19StartRecord()">💾 Сохранить (отправить на подпись)</button>
                    </div>

                    <h4 style="margin:6px 0 8px;color:#003366;">✍️ Документы на подпись (по каждому контролёру):</h4>
                    <div id="st19DocsListBox" style="max-height:260px;overflow-y:auto;margin-bottom:14px;"></div>

                    <div style="display:flex;gap:10px;flex-wrap:wrap;border-top:1px solid #ddd;padding-top:12px;">
                        <button type="button" class="btn-action" style="flex:1;background:#003366;margin:0;" onclick="openSt19JournalsModal('mkassa')">📖 Посмотреть журнал</button>
                        <button type="button" class="btn-secondary" style="width:auto;margin:0;" onclick="closeModal('st19GuoStartModal')">Закрыть</button>
                    </div>
                </div>
            </div>

            <!-- 2. Окно подписи выдачи -->
            <div id="st19IssueSignModal" class="modal">
                <div class="modal-content modal-wide" style="max-height:90vh;overflow-y:auto;">
                    <h3 style="margin-top:0;">✍️ Подпись выдачи (МКасса, бобины, разм. фонд)</h3>
                    <div id="st19SignInfo" style="background:#f8fafc;padding:10px;border-radius:6px;margin-bottom:10px;font-size:13px;"></div>

                    <div class="form-group">
                        <div id="st19CtrlSavedSigPreview" style="margin-bottom:4px;"></div>
                        <label>Подпись контролёра (получил):</label>
                        <canvas id="st19CtrlIssueCanvas" style="border:2px dashed #003366;background:#fafafa;width:100%;height:75px;cursor:crosshair;"></canvas>
                        <button type="button" class="btn-danger" style="width:auto;padding:3px 8px;font-size:11px;margin-top:4px;" onclick="clearSt19Canvas('st19CtrlIssueCanvas')">Очистить</button>
                    </div>

                    <div class="form-group">
                        <div id="st19GuoSavedSigPreview" style="margin-bottom:4px;"></div>
                        <label>Роспись оператора ГУО (выдал):</label>
                        <canvas id="st19GuoIssueCanvas" style="border:2px dashed #003366;background:#fafafa;width:100%;height:75px;cursor:crosshair;"></canvas>
                        <button type="button" class="btn-danger" style="width:auto;padding:3px 8px;font-size:11px;margin-top:4px;" onclick="clearSt19Canvas('st19GuoIssueCanvas')">Очистить</button>
                    </div>

                    <div style="display:flex;gap:10px;">
                        <button type="button" class="btn-success" onclick="confirmSt19IssueSign()">✅ Подписать выдачу</button>
                        <button type="button" class="btn-secondary" onclick="closeModal('st19IssueSignModal')">Отмена</button>
                    </div>
                </div>
            </div>

            <!-- 3. Окно оформления сдачи -->
            <div id="st19ReturnSignModal" class="modal">
                <div class="modal-content modal-wide" style="max-height:90vh;overflow-y:auto;">
                    <h3 style="margin-top:0;">📥 Оформление сдачи (МКасса и бобины)</h3>
                    <div id="st19ReturnInfo" style="background:#f8fafc;padding:10px;border-radius:6px;margin-bottom:10px;font-size:13px;"></div>

                    <div class="form-group">
                        <label>Кол-во сдал бобин (шт.):</label>
                        <input type="number" id="st19BobbinsReturnInput" min="0" value="0" class="form-input">
                    </div>

                    <div class="form-group">
                        <label>Подпись контролёра при сдаче (если пусто — возьмётся из профиля):</label>
                        <canvas id="st19CtrlReturnCanvas" style="border:2px dashed #003366;background:#fafafa;width:100%;height:75px;cursor:crosshair;"></canvas>
                        <button type="button" class="btn-danger" style="width:auto;padding:3px 8px;font-size:11px;margin-top:4px;" onclick="clearSt19Canvas('st19CtrlReturnCanvas')">Очистить</button>
                    </div>

                    <div class="form-group">
                        <label>Роспись оператора ГУО при приёме (если пусто — возьмётся из профиля):</label>
                        <canvas id="st19GuoReturnCanvas" style="border:2px dashed #003366;background:#fafafa;width:100%;height:75px;cursor:crosshair;"></canvas>
                        <button type="button" class="btn-danger" style="width:auto;padding:3px 8px;font-size:11px;margin-top:4px;" onclick="clearSt19Canvas('st19GuoReturnCanvas')">Очистить</button>
                    </div>

                    <div style="display:flex;gap:10px;">
                        <button type="button" class="btn-success" onclick="confirmSt19ReturnSign()">✅ Подписать сдачу</button>
                        <button type="button" class="btn-secondary" onclick="closeModal('st19ReturnSignModal')">Отмена</button>
                    </div>
                </div>
            </div>

            <!-- 4. Окно с 3 журналами -->
            <div id="st19JournalsModal" class="modal">
                <div class="modal-content modal-wide" style="max-width:960px;width:96%;max-height:92vh;overflow-y:auto;">
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
                        <h3 style="margin:0;color:#003366;">📖 Журналы выдачи и сдачи (ГУО)</h3>
                        <button type="button" class="btn-action" style="width:auto;margin:0;padding:6px 12px;font-size:12px;background:#0055aa;" onclick="printSt19ActiveJournal()">🖨️ Печать / PDF</button>
                    </div>

                    <div class="st19-jtabs">
                        <button type="button" class="st19-jtab-btn active" data-jtab="mkassa" onclick="switchSt19JournalTab('mkassa')">1. Выдача МКассы</button>
                        <button type="button" class="st19-jtab-btn" data-jtab="bobbins" onclick="switchSt19JournalTab('bobbins')">2. Выдача бобин</button>
                        <button type="button" class="st19-jtab-btn" data-jtab="money" onclick="switchSt19JournalTab('money')">3. Выдача ден. средств</button>
                    </div>

                    <div id="st19JournalTableBox" class="st19-table-wrap"></div>

                    <div style="margin-top:12px;text-align:right;">
                        <button type="button" class="btn-secondary" style="width:auto;margin:0;" onclick="closeModal('st19JournalsModal')">Назад</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(wrap);
    }

    // ========================================================
    // АВТО-ЗАПИСЬ СДАЧИ ПРИ ПОДПИСИ ФДУ В ПРОФИЛЕ ГУО (STAGE 8)
    // ========================================================
    function hookFduSignAutoReturn() {
        if (typeof window.confirmSt8GuoSignature !== 'function') return;
        const _origConfirm = window.confirmSt8GuoSignature;
        window.confirmSt8GuoSignature = function() {
            const docId = typeof st8ActiveReviewDocId !== 'undefined' ? st8ActiveReviewDocId : null;
            const rep = (typeof cloudPendingFdu !== 'undefined' && docId)
                ? cloudPendingFdu.find(x => x.id === docId)
                : null;

            const res = _origConfirm.apply(this, arguments);

            if (rep) {
                const activeRec = st19Records.find(r =>
                    String(r.tab) === String(rep.tab) && !r.returnSignedByGuo
                );
                if (activeRec) {
                    const w = (appState?.workers || []).find(x => String(x.tab) === String(rep.tab));
                    const upd = {
                        returnDate: todayDateStr(),
                        returnTime: nowTimeStr(),
                        bobbinsReturned: rep.tapeLeft && rep.tapeLeft !== '—' ? rep.tapeLeft : (activeRec.bobbinsReturned || '0'),
                        returnSignedByCtrl: true,
                        returnSignedByGuo: true,
                        ctrlReturnSig: w?.signature || activeRec.ctrlIssueSig || '',
                        guoReturnSig: appState?.user?.signature || activeRec.guoIssueSig || '',
                        guoReturnName: appState?.user?.fio || 'Оператор ГУО',
                        tsUpdated: Date.now()
                    };
                    if (typeof db !== 'undefined' && db) {
                        db.collection('guo_start_records').doc(activeRec.id).set(upd, { merge: true }).catch(() => {});
                    }
                }
            }
            return res;
        };
    }

    // ========================================================
    // ЗАПУСК И ПОДПИСКА НА FIREBASE
    // ========================================================
    window.addEventListener('load', () => {
        injectSt19Styles();
        ensureSt19Modals();

        setTimeout(() => {
            ensureGuoStartButton();
            hookFduSignAutoReturn();

            // Перехватываем обновление экрана ГУО, чтобы кнопка всегда была на месте
            if (typeof window.applyGuoMainScreenMode === 'function') {
                const _origGuo = window.applyGuoMainScreenMode;
                window.applyGuoMainScreenMode = function() {
                    const r = _origGuo.apply(this, arguments);
                    ensureGuoStartButton();
                    updateGuoStartBadge();
                    return r;
                };
            }

            if (typeof window.showMainScreen === 'function') {
                const _origShow = window.showMainScreen;
                window.showMainScreen = function() {
                    const r = _origShow.apply(this, arguments);
                    setTimeout(() => {
                        ensureGuoStartButton();
                        updateGuoStartBadge();
                    }, 150);
                    return r;
                };
            }

            if (typeof db !== 'undefined' && db) {
                db.collection('guo_start_records').onSnapshot(snap => {
                    st19Records = [];
                    snap.forEach(d => st19Records.push(d.data()));
                    st19Records.sort((a, b) => (b.ts || 0) - (a.ts || 0));
                    updateGuoStartBadge();
                    renderSt19PendingDocsList();
                    if (document.getElementById('st19JournalsModal')?.style.display === 'flex') {
                        renderSt19JournalTable();
                    }
                });
            }
        }, 2500);
    });
})();
