// ============================================================
// === ЭТАП 9: ПОЛНЫЙ БЛАНК ФДУ ПРИ ПОДПИСИ ГУО, ПАПКИ ПО   ===
// === ДАТАМ + КРЕСТИК УДАЛЕНИЯ + ЗАКРЫТЬ МЕСЯЦ + АДАПТИВ   ===
// ============================================================

let st9ClosedFolders = {}; // запоминаем свернутые папки дат
let st9ClosedMonths = [];

window.addEventListener('load', () => {
    injectStage9Styles();
    setTimeout(() => {
        initStage9();
    }, 1150);
});

function st9Esc(str) {
    return String(str || '').replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}

// ============================================================
// === 1. АДАПТИВНАЯ ВЕРСТКА ПОД ТЕЛЕФОН И КОМПЬЮТЕР        ===
// ============================================================
function injectStage9Styles() {
    if (document.getElementById('st9-styles')) return;
    let st = document.createElement('style');
    st.id = 'st9-styles';
    st.innerHTML = `
        html, body {
            max-width: 100%;
            overflow-x: hidden;
            box-sizing: border-box;
        }
        *, *::before, *::after { box-sizing: border-box; }

        /* ШАПКА АРХИВА ОТЧЕТОВ С КНОПКОЙ «ЗАКРЫТЬ МЕСЯЦ» СЛЕВА */
        .reports-top-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            flex-wrap: wrap;
            margin-bottom: 14px;
            border-bottom: 2px solid #eef2f7;
            padding-bottom: 10px;
        }
        .reports-top-left {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
        }
        .reports-top-left h2 {
            margin: 0 !important;
            text-align: left !important;
        }
        .btn-close-month {
            width: auto !important;
            margin: 0 !important;
            padding: 8px 14px !important;
            font-size: 13px !important;
            background: #cc0000 !important;
            color: #fff !important;
            border-radius: 6px;
        }

        /* ПАПКИ ПО ДАТАМ В АРХИВЕ */
        .date-folder-box {
            border: 1px solid #c5d4e6;
            border-radius: 8px;
            margin-bottom: 12px;
            overflow: hidden;
            background: #ffffff;
        }
        .date-folder-head {
            background: #dce6f1;
            color: #003366;
            padding: 10px 14px;
            font-weight: bold;
            font-size: 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            user-select: none;
        }
        .date-folder-head:hover { background: #cfe0f3; }
        .date-folder-items { padding: 8px 10px; background: #f8fafc; }
        .report-item-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
            padding: 8px 10px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            margin-bottom: 6px;
            color: #000;
        }
        .report-item-row:last-child { margin-bottom: 0; }
        .report-actions-group {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-shrink: 0;
        }
        .btn-rep-del {
            width: 30px !important;
            height: 30px;
            min-width: 30px;
            padding: 0 !important;
            margin: 0 !important;
            background: #dc3545 !important;
            color: #fff !important;
            border-radius: 5px;
            font-size: 14px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }

        /* АДАПТАЦИЯ ПОД ПК */
        @media (min-width: 769px) {
            .screen { padding: 14px 20px; }
            .wa-app {
                width: 100%;
                max-width: 1120px;
                height: calc(100dvh - 86px);
                margin: 52px auto 12px;
            }
        }

        /* АДАПТАЦИЯ ПОД ТЕЛЕФОН (БЕЗ ГОРИЗОНТАЛЬНОГО ВЫЛЕЗАНИЯ) */
        @media (max-width: 768px) {
            .screen {
                margin: 0 !important;
                padding: 58px 8px 14px 8px !important;
                width: 100% !important;
                max-width: 100vw !important;
            }
            .card {
                padding: 12px !important;
                margin: 0 0 12px 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                border-radius: 8px;
            }
            .menu-toggle-btn {
                top: 10px !important;
                left: 10px !important;
                padding: 7px 12px !important;
                font-size: 14px !important;
            }
            .bell-btn {
                top: 8px !important;
                right: 10px !important;
                width: 40px !important;
                height: 40px !important;
                font-size: 18px !important;
            }
            .form-row {
                flex-direction: column !important;
                gap: 8px !important;
            }
            .stats-dashboard {
                grid-template-columns: repeat(2, 1fr) !important;
                gap: 8px !important;
            }
            .stats-dashboard .stat-card:last-child {
                grid-column: span 2 !important;
            }
            .stat-card { padding: 11px !important; }
            .stat-card .val { font-size: 18px !important; }
            .action-grid {
                grid-template-columns: 1fr !important;
            }
            .modal-content {
                width: 96vw !important;
                max-width: 96vw !important;
                padding: 14px !important;
                max-height: 92dvh !important;
            }
            .ms-wrapper {
                margin: 0 !important;
                padding: 14px !important;
                width: 100% !important;
                border-radius: 10px !important;
            }
            .animated-title { font-size: 34px !important; }

            /* ЧАТЫ WHATSAPP НА ТЕЛЕФОНЕ — СТРОГО ПО РАЗМЕРУ ЭКРАНА */
            #chats-screen {
                padding: 54px 0 0 0 !important;
                margin: 0 !important;
                width: 100vw !important;
                max-width: 100vw !important;
                overflow: hidden !important;
            }
            .wa-app {
                width: 100vw !important;
                max-width: 100vw !important;
                height: calc(100dvh - 54px) !important;
                min-height: 0 !important;
                margin: 0 !important;
                border-radius: 0 !important;
            }
            .wa-rail { width: 46px !important; min-width: 46px !important; padding: 8px 0 !important; }
            .wa-sidebar { width: calc(100vw - 46px) !important; max-width: calc(100vw - 46px) !important; }
            .wa-main { width: calc(100vw - 46px) !important; max-width: calc(100vw - 46px) !important; }
            .wa-composer { padding: 6px 8px !important; gap: 4px !important; }
            .wa-composer input[type="text"] { min-width: 0 !important; padding: 8px 12px !important; font-size: 14px !important; }
            .wa-send-btn { width: 38px !important; height: 38px !important; min-width: 38px !important; font-size: 16px !important; }
            .wa-icon-btn { width: 32px !important; height: 32px !important; font-size: 16px !important; }
            .wa-messages { padding: 10px !important; }
            .wa-bubble { max-width: 88% !important; }
            .wa-img-attach, .wa-video-attach { max-width: 100% !important; }
        }
    `;
    document.head.appendChild(st);
}

// ============================================================
// === 2. ПОЛНЫЙ СБОР ДАННЫХ ФДУ + 2 ДОКУМЕНТА ПОСЛЕ ПОДПИСИ ===
// ============================================================
function initStage9() {
    // Подписка на закрытые месяцы
    if (typeof db !== 'undefined' && db) {
        db.collection('closed_months').onSnapshot(snap => {
            st9ClosedMonths = [];
            snap.forEach(d => st9ClosedMonths.push(d.data()));
            renderReportsArchive();
        });
    }

    // 2.1. Расширяем отправку ФДУ в ГУО — сохраняем ВСЕ ячейки левой и правой страниц ФДУ
    window.sendControllerFduToGuo = function() {
        if (!appState.user) return alert("Сначала войдите в профиль!");
        if (!confirm("Отправить рапорт смены ФДУ на подпись оператору ГУО?")) return;

        let route = document.getElementById('fduRouteVal')?.value.trim() || '—';
        let mkassa = document.getElementById('fduCashVal')?.value.trim() || '—';
        let grandTix = document.getElementById('fduGrandTickets')?.innerText || '0';
        let grandSum = document.getElementById('fduGrandSum')?.innerText || '0.00';
        let testTix = document.getElementById('fduTestTicketCount')?.value || '0';
        let tapeLeft = document.getElementById('fduTapeLeft')?.value || '—';

        // Полные 11 строк левой страницы (сохраняем по индексам!)
        let fullLeftRows = Array.from(document.querySelectorAll('#fduLeftBody .train-slot-row')).map(tr => ({
            num: tr.querySelector('.fdu-train-num')?.value.trim() || '',
            route: tr.querySelector('.fdu-train-route')?.value.trim() || '',
            time: tr.querySelector('.fdu-train-time')?.value.trim() || '',
            tix: tr.querySelector('.fdu-train-tix')?.value.trim() || '',
            sum: tr.querySelector('.fdu-train-sum')?.value.trim() || ''
        }));

        // Полные 11 строк правой страницы (льготы)
        let fullRightRows = Array.from(document.querySelectorAll('#fduRightBody .benefit-slot-row')).map(tr =>
            Array.from(tr.querySelectorAll('input')).map(i => i.value.trim())
        );

        let fduMeta = {
            date: document.getElementById('fduD0')?.value.trim() || new Date().toLocaleDateString('ru-RU'),
            route,
            mkassa,
            fund: document.getElementById('fduFundVal')?.value.trim() || '',
            pers: document.getElementById('fduPersVal')?.value.trim() || '',
            workType: document.getElementById('fduWorkTypeVal')?.value.trim() || '',
            videoReg: document.getElementById('fduVideoRegVal')?.value.trim() || '',
            totalBottom: document.getElementById('fduTotalSumBottom')?.value.trim() || grandSum,
            shNum1: document.getElementById('shCellNum1')?.innerText || '—',
            shTest1: document.getElementById('shCellTest1')?.innerText || '—',
            shTariff1: document.getElementById('shCellTariff1')?.innerText || '—',
            shFee1: document.getElementById('shCellFee1')?.innerText || '—',
            shCash1: document.getElementById('shCellCash1')?.innerText || '—',
            shCard1: document.getElementById('shCellCard1')?.innerText || '—',
            shBen1: document.getElementById('shCellBen1')?.innerText || '—'
        };

        let filledRows = fullLeftRows.filter(r => r.num);
        let routeInfo = (typeof getRouteStartStation === 'function' && route !== '—')
            ? getRouteStartStation(route)
            : { station: '', firstTrain: '' };
        let startStation = routeInfo.station || appState.user.station || appState.user.sector || 'Клин';

        let todayIso = new Date().toISOString().split('T')[0];
        let docId = `${appState.user.tab}_${todayIso}`;
        let sentAt = new Date().toLocaleString('ru-RU');

        let payload = {
            id: docId,
            tab: appState.user.tab,
            fio: appState.user.fio,
            route, mkassa, startStation,
            firstTrain: routeInfo.firstTrain || (filledRows[0] ? `${filledRows[0].num} (${filledRows[0].route})` : '—'),
            grandTix, grandSum, testTix, tapeLeft,
            rows: filledRows,
            fullLeftRows,
            fullRightRows,
            fduMeta,
            status: 'pending',
            sentAt,
            ts: Date.now()
        };

        if (db) {
            db.collection('pending_fdu_reports').doc(docId).set(payload).catch(err => alert("Ошибка отправки: " + err.message));
        } else {
            cloudPendingFdu = cloudPendingFdu.filter(x => x.id !== docId);
            cloudPendingFdu.unshift(payload);
        }

        appState.shiftState = 'pending_guo';
        if (typeof persistActiveShift === 'function') persistActiveShift();
        if (typeof updateShiftMainButton === 'function') updateShiftMainButton();

        if (typeof sendCloudNotification === 'function') {
            sendCloudNotification(`📄 В ГУО (${startStation}): ${appState.user.fio} (маршрут ${route}) отправил ФДУ на подпись.`);
        }
        if (typeof addLog === 'function') addLog(`Рапорт ФДУ отправлен на подпись оператору ГУО (${startStation}).`);
        alert(`Рапорт ФДУ отправлен оператору ГУО (${startStation}) на подпись!`);
        backToMain();
    };
    window.openGuoSignModal = window.sendControllerFduToGuo;

    // 2.2. При подписании оператором ГУО формируем И сводный лист, И полный бланк ФДУ (как в «Открыть ФДУ»)
    window.confirmSt8GuoSignature = function() {
        let rep = cloudPendingFdu.find(x => x.id === st8ActiveReviewDocId);
        if (!rep) return;

        let guoFio = appState.user?.fio || 'Оператор ГУО';
        let now = new Date();
        let closedAt = now.toLocaleString('ru-RU');
        let dateKey = now.toLocaleDateString('ru-RU');

        let sigImg = appState.user?.signature || '';
        if (typeof sigCtxMap !== 'undefined' && sigCtxMap['st8GuoDrawCanvas']) {
            let c = sigCtxMap['st8GuoDrawCanvas'].c;
            let blank = document.createElement('canvas'); blank.width = c.width; blank.height = c.height;
            if (c.toDataURL() !== blank.toDataURL()) sigImg = c.toDataURL();
        }

        // --- ДОКУМЕНТ 1: Сводный лист закрытия ---
        let rowsHtml = (rep.rows || []).map(r => `<tr><td>${st9Esc(r.num)}</td><td>${st9Esc(r.route)}</td><td>${st9Esc(r.time)}</td><td>${st9Esc(r.tix)}</td><td>${st9Esc(r.sum)}</td></tr>`).join('');
        let summaryHtml = `
            <h3>Сводный лист закрытия смены — Маршрут ${st9Esc(rep.route)}</h3>
            <p><strong>Контролёр:</strong> ${st9Esc(rep.fio)} (Таб. ${st9Esc(rep.tab)}) | <strong>Участок:</strong> ${st9Esc(rep.startStation)}</p>
            <p><strong>Закрыто:</strong> ${closedAt} | <strong>Оператор ГУО:</strong> ${st9Esc(guoFio)}</p>
            <table border="1" style="border-collapse:collapse;width:100%;">
                <tr style="background:#dce6f1;"><th>№ поезда</th><th>Перегон</th><th>Время</th><th>Билетов</th><th>Сумма</th></tr>
                ${rowsHtml}
                <tr style="font-weight:bold;"><td colspan="3">Итого:</td><td>${st9Esc(rep.grandTix)}</td><td>${st9Esc(rep.grandSum)}</td></tr>
            </table>
            <p>Пробных билетов: ${st9Esc(rep.testTix)} | Остаток ленты: ${st9Esc(rep.tapeLeft)}</p>
            <p>Подпись оператора ГУО (${st9Esc(guoFio)}):<br>${sigImg ? `<img src="${sigImg}" style="height:50px;border:1px solid #ccc;">` : '________________'}</p>
        `;

        // --- ДОКУМЕНТ 2: ПОЛНЫЙ РАПОРТ ФДУ (КАК В КНОПКЕ «ОТКРЫТЬ ФДУ») ---
        let fullFduHtml = buildFullFduBlankHtml(rep, guoFio, closedAt, sigImg);

        let tsNow = Date.now();
        let archSummary = {
            id: 'rep_sum_' + tsNow,
            dateKey,
            folder: `Сводный лист ФДУ (Маршрут ${rep.route}) — ${rep.fio}`,
            author: `${rep.fio} / ГУО: ${guoFio} (${closedAt})`,
            ts: tsNow,
            html: summaryHtml
        };
        let archFullFdu = {
            id: 'rep_fdu_blank_' + (tsNow + 1),
            dateKey,
            folder: `Рапорт ФДУ (полный бланк, Маршрут ${rep.route}) — ${rep.fio}`,
            author: `${rep.fio} / ГУО: ${guoFio} (${closedAt})`,
            ts: tsNow + 1,
            html: fullFduHtml
        };

        if (db) {
            db.collection('pending_fdu_reports').doc(rep.id).update({ status: 'signed', signedBy: guoFio, signedAt: closedAt }).catch(() => {});
            db.collection('archive_reports').doc(archSummary.id).set(archSummary).catch(() => {});
            db.collection('archive_reports').doc(archFullFdu.id).set(archFullFdu).catch(() => {});
            db.collection('workers').doc(rep.tab).update({ shiftActive: false, shiftStatus: 'closed' }).catch(() => {});
            db.collection('active_shifts').doc(rep.tab).set({
                shiftState: 'closed',
                lastMkassaTix: 0,
                lastMkassaMoney: 0,
                'fduFields.fduShiftEndTime': closedAt,
                'fduFields.fduGuoSignField': `${guoFio} (${closedAt})`,
                ts: Date.now()
            }, { merge: true }).catch(() => {});
        } else {
            cloudArchive.unshift(archFullFdu, archSummary);
        }

        if (typeof sendCloudNotification === 'function') {
            sendCloudNotification(`✅ Оператор ГУО (${guoFio}) подписал ФДУ контролёра ${rep.fio}. Сформированы Сводный лист и полный бланк Рапорта ФДУ!`);
        }

        closeModal('st8GuoReviewModal');
        showSyncToast(`✍️ Смена ${rep.fio} закрыта! В Архив добавлен полный бланк ФДУ`);
        setTimeout(() => { if (typeof openGuoFinishControllersModal === 'function') openGuoFinishControllersModal(false); }, 350);
    };

    // 2.3. Обновляем рендер Архива Отчетов (кнопка «Закрыть месяц» слева, папки по датам, крестик удаления)
    window.renderReportsArchive = renderStage9ReportsArchive;
    renderStage9ReportsArchive();
}

function buildFullFduBlankHtml(rep, guoFio, closedAt, sigImg) {
    let m = rep.fduMeta || {};
    let lRows = rep.fullLeftRows && rep.fullLeftRows.length ? rep.fullLeftRows : Array.from({ length: 11 }, (_, i) => (rep.rows && rep.rows[i]) || {});
    let rRows = rep.fullRightRows && rep.fullRightRows.length ? rep.fullRightRows : Array.from({ length: 11 }, () => ['','','','','','','','']);

    const colALabels = [
        m.date || new Date().toLocaleDateString('ru-RU'),
        '<b>Номер маршрута</b>',
        st9Esc(m.route || rep.route || ''),
        '<b>№ МКассы</b>',
        st9Esc(m.mkassa || rep.mkassa || ''),
        '<b>Сумма разм. фонда</b>',
        st9Esc(m.fund || ''),
        '<b>Сумма личн. денег</b>',
        st9Esc(m.pers || ''),
        '<b>Вид работы</b>',
        st9Esc(m.workType || '')
    ];

    let leftBody = '';
    for (let i = 0; i < 11; i++) {
        let r = lRows[i] || {};
        leftBody += `<tr>
            <td style="text-align:left;padding:2px 4px;">${colALabels[i]}</td>
            <td>${st9Esc(r.num || '')}</td>
            <td>${st9Esc(r.route || '')}</td>
            <td>${st9Esc(r.time || '')}</td>
            <td>${st9Esc(r.tix || '')}</td>
            <td>${st9Esc(r.sum || '')}</td>
        </tr>`;
    }

    let rightBody = '';
    for (let i = 0; i < 11; i++) {
        let rr = rRows[i] || [];
        rightBody += `<tr>${Array.from({ length: 8 }, (_, j) => `<td>${st9Esc(rr[j] || '')}</td>`).join('')}</tr>`;
    }

    return `
        <div style="font-family:Arial,sans-serif;font-size:11px;color:#000;">
            <h3 style="text-align:center;margin:0 0 8px;">РАПОРТ о результатах произведенных проверок поездов (ФДУ)</h3>
            <p style="margin:0 0 8px;font-size:11px;"><b>Контролёр:</b> ${st9Esc(rep.fio)} (Таб. ${st9Esc(rep.tab)}) | <b>Участок:</b> ${st9Esc(rep.startStation)} | <b>Закрыто:</b> ${closedAt}</p>

            <table border="1" style="border-collapse:collapse;width:100%;font-size:10px;text-align:center;margin-bottom:14px;">
                <thead>
                    <tr style="background:#f2f2f2;">
                        <th rowspan="2">Дата проверки</th><th rowspan="2">№ поезда</th><th rowspan="2">Перегон фактич.</th><th rowspan="2">Отметка о сбое / время</th><th colspan="2">Оформлено тарифа</th>
                    </tr>
                    <tr style="background:#f2f2f2;"><th>кол-во</th><th>на сумму</th></tr>
                    <tr><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th></tr>
                </thead>
                <tbody>
                    ${leftBody}
                    <tr>
                        <td style="text-align:left;font-weight:bold;">№ Видеорег.</td><td></td><td></td>
                        <td style="text-align:right;font-weight:bold;">Итого:</td>
                        <td style="font-weight:bold;color:#cc0000;">${st9Esc(rep.grandTix)}</td>
                        <td style="font-weight:bold;color:#cc0000;">${st9Esc(rep.grandSum)}</td>
                    </tr>
                    <tr>
                        <td>${st9Esc(m.videoReg || '')}</td><td></td><td></td>
                        <td colspan="2" style="text-align:right;font-weight:bold;">Всего по маршруту:</td>
                        <td style="font-weight:bold;">${st9Esc(m.totalBottom || rep.grandSum)}</td>
                    </tr>
                    <tr><td colspan="6" style="text-align:left;padding:4px 8px;"><b>Окончание смены:</b> ${st9Esc(closedAt)}</td></tr>
                    <tr>
                        <td colspan="2"><b>Кол. пробных билетов:</b><br>${st9Esc(rep.testTix)}</td>
                        <td colspan="2"><b>Остаток бил. ленты:</b><br>${st9Esc(rep.tapeLeft)}</td>
                        <td colspan="2"><b>Роспись оператора ГУО:</b><br>${st9Esc(guoFio)}<br>${sigImg ? `<img src="${sigImg}" style="height:36px;">` : ''}</td>
                    </tr>
                </tbody>
            </table>

            <table border="1" style="border-collapse:collapse;width:280px;font-size:10px;text-align:center;margin-bottom:16px;">
                <thead><tr style="background:#f2f2f2;"><th>Показатель</th><th>Открытие</th><th>Закрытие</th></tr></thead>
                <tbody>
                    <tr><td>Смена</td><td>${st9Esc(m.shNum1 || '—')}</td><td>Закрыта</td></tr>
                    <tr><td>Пробники</td><td>${st9Esc(m.shTest1 || '—')}</td><td>${st9Esc(rep.testTix)}</td></tr>
                    <tr><td>Тариф</td><td>${st9Esc(m.shTariff1 || '—')}</td><td>${st9Esc(rep.grandSum)}</td></tr>
                    <tr><td>Сбор</td><td>${st9Esc(m.shFee1 || '—')}</td><td>—</td></tr>
                    <tr><td>Нал.</td><td>${st9Esc(m.shCash1 || '—')}</td><td>—</td></tr>
                    <tr><td>Безнал.</td><td>${st9Esc(m.shCard1 || '—')}</td><td>—</td></tr>
                    <tr><td>Льготники</td><td>${st9Esc(m.shBen1 || '—')}</td><td>—</td></tr>
                </tbody>
            </table>

            <h4 style="margin:8px 0 4px;">Правая страница ФДУ — Льготные категории</h4>
            <table border="1" style="border-collapse:collapse;width:100%;font-size:10px;text-align:center;">
                <thead>
                    <tr style="background:#f2f2f2;"><th colspan="2">Работники РЖД</th><th colspan="2">Федеральная</th><th colspan="2">Региональная</th><th colspan="2">Школьники / Студ.</th></tr>
                    <tr style="background:#f2f2f2;"><th>кол</th><th>сум</th><th>кол</th><th>сум</th><th>кол</th><th>сум</th><th>кол</th><th>сум</th></tr>
                </thead>
                <tbody>${rightBody}</tbody>
            </table>
        </div>
    `;
}

// ============================================================
// === 3. АРХИВ ОТЧЕТОВ: «ЗАКРЫТЬ МЕСЯЦ», ПАПКИ ПО ДАТАМ, ✕ ===
// ============================================================
function getReportDateKey(rep) {
    if (rep.dateKey) return rep.dateKey;
    if (rep.ts) return new Date(rep.ts).toLocaleDateString('ru-RU');
    let m = String(rep.folder || '').match(/(\d{2}\.\d{2}\.\d{4})/);
    return m ? m[1] : new Date().toLocaleDateString('ru-RU');
}

function renderStage9ReportsArchive() {
    let scr = document.getElementById('reports-screen');
    if (!scr) return;
    let card = scr.querySelector('.card');
    if (!card) return;

    // Перестраиваем шапку: кнопка «Закрыть месяц» СЛЕВА от «Архив Отчетов»
    if (!document.getElementById('reportsTopBarSt9')) {
        let oldH2 = card.querySelector('h2');
        let topBar = document.createElement('div');
        topBar.id = 'reportsTopBarSt9';
        topBar.className = 'reports-top-bar';
        topBar.innerHTML = `
            <div class="reports-top-left">
                <button type="button" class="btn-close-month" onclick="closeCurrentMonthReports()">🔒 Закрыть месяц</button>
                <h2>Архив Отчетов</h2>
            </div>
            <div id="closedMonthsHint" style="font-size:12px;color:#555;"></div>
        `;
        if (oldH2) oldH2.replaceWith(topBar);
        else card.prepend(topBar);
    }

    let hint = document.getElementById('closedMonthsHint');
    if (hint && st9ClosedMonths.length) {
        hint.innerText = 'Закрытые месяцы: ' + st9ClosedMonths.map(x => x.label).join(', ');
    }

    let box = document.getElementById('reportsArchiveList');
    if (!box) return;

    if (!cloudArchive || cloudArchive.length === 0) {
        box.innerHTML = '<div style="text-align:center;color:#666;padding:20px;">Отчетов пока нет.</div>';
        return;
    }

    // Группируем все отчеты по дате в одну папку
    let groups = {};
    cloudArchive.forEach(rep => {
        let dk = getReportDateKey(rep);
        if (!groups[dk]) groups[dk] = [];
        groups[dk].push(rep);
    });

    // Сортируем папки по дате (свежие сверху)
    let sortedDates = Object.keys(groups).sort((a, b) => {
        let pa = a.split('.').reverse().join('-');
        let pb = b.split('.').reverse().join('-');
        return pb.localeCompare(pa);
    });

    box.innerHTML = sortedDates.map(dk => {
        let items = groups[dk];
        let isCollapsed = !!st9ClosedFolders[dk];
        let safeDk = st9Esc(dk).replace(/'/g, "\\'");
        let itemsHtml = items.map(rep => `
            <div class="report-item-row">
                <div style="min-width:0;flex:1;">
                    <strong style="font-size:13px;">📄 ${st9Esc(rep.folder)}</strong><br>
                    <small style="color:#666;">${st9Esc(rep.author || '')}</small>
                </div>
                <div class="report-actions-group">
                    <button class="btn-success" style="width:auto;margin:0;padding:6px 11px;font-size:12px;" onclick="downloadArchiveExcelById('${rep.id}')">📥 Excel</button>
                    <button class="btn-action" style="width:auto;margin:0;padding:6px 11px;font-size:12px;background:#003366;" onclick="printArchivePdfById('${rep.id}')">📄 PDF</button>
                    <button class="btn-rep-del" onclick="deleteArchiveReportById('${rep.id}')" title="Удалить отчет">✕</button>
                </div>
            </div>
        `).join('');

        return `
            <div class="date-folder-box">
                <div class="date-folder-head" onclick="toggleDateFolderSt9('${safeDk}')">
                    <span>📁 ${st9Esc(dk)} <small style="font-weight:normal;color:#334155;">(${items.length} отч.)</small></span>
                    <span>${isCollapsed ? '▶' : '▼'}</span>
                </div>
                <div class="date-folder-items" style="display:${isCollapsed ? 'none' : 'block'};">
                    ${itemsHtml}
                </div>
            </div>
        `;
    }).join('');
}

function toggleDateFolderSt9(dk) {
    st9ClosedFolders[dk] = !st9ClosedFolders[dk];
    renderStage9ReportsArchive();
}

function downloadArchiveExcelById(id) {
    let r = (cloudArchive || []).find(x => x.id === id);
    if (!r) return;
    let a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([`<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body>${r.html}</body></html>`], { type: 'application/vnd.ms-excel' }));
    a.download = `${r.folder}.xls`;
    a.click();
}

function printArchivePdfById(id) {
    let r = (cloudArchive || []).find(x => x.id === id);
    if (!r) return;
    let w = window.open('', '_blank');
    w.document.write(`<html><head><meta charset="utf-8"><title>${st9Esc(r.folder)}</title><style>body{font-family:Arial;padding:16px;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #000;padding:4px;text-align:center;}</style></head><body>${r.html}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
}

function deleteArchiveReportById(id) {
    let r = (cloudArchive || []).find(x => x.id === id);
    if (!r) return;
    if (!confirm(`Удалить отчет «${r.folder}»?`)) return;
    cloudArchive = cloudArchive.filter(x => x.id !== id);
    if (db) db.collection('archive_reports').doc(id).delete().catch(err => alert("Ошибка удаления: " + err.message));
    renderStage9ReportsArchive();
    showSyncToast("🗑️ Отчет удален из архива");
}

function closeCurrentMonthReports() {
    let now = new Date();
    let mIdx = now.getMonth(), y = now.getFullYear();
    let mName = (typeof monthNamesRu !== 'undefined' ? monthNamesRu[mIdx] : String(mIdx + 1));
    let monthKey = `${y}-${String(mIdx + 1).padStart(2, '0')}`;
    let monthSuffix = `.${String(mIdx + 1).padStart(2, '0')}.${y}`;

    if (!confirm(`Закрыть месяц «${mName} ${y}»? Все отчеты за этот месяц будут собраны в итоговый месячный отчет.`)) return;

    let monthReps = (cloudArchive || []).filter(r => getReportDateKey(r).endsWith(monthSuffix));
    let closedAt = now.toLocaleString('ru-RU');
    let byFio = appState.user?.fio || 'Сотрудник';

    let listHtml = monthReps.length
        ? monthReps.map((r, i) => `<tr><td>${i + 1}</td><td>${st9Esc(getReportDateKey(r))}</td><td style="text-align:left;">${st9Esc(r.folder)}</td><td>${st9Esc(r.author || '')}</td></tr>`).join('')
        : '<tr><td colspan="4">Отчетов за месяц не найдено</td></tr>';

    let summaryHtml = `
        <h2>Итоговый отчет — Закрытие месяца: ${mName} ${y} г.</h2>
        <p><strong>Закрыл:</strong> ${st9Esc(byFio)} | <strong>Дата и время:</strong> ${closedAt} | <strong>Всего документов за месяц:</strong> ${monthReps.length}</p>
        <table border="1" style="border-collapse:collapse;width:100%;font-size:12px;">
            <tr style="background:#dce6f1;"><th>№</th><th>Дата</th><th>Наименование отчета</th><th>Автор / ГУО</th></tr>
            ${listHtml}
        </table>
    `;

    let archItem = {
        id: 'rep_month_close_' + monthKey + '_' + Date.now(),
        dateKey: now.toLocaleDateString('ru-RU'),
        folder: `🔒 ЗАКРЫТИЕ МЕСЯЦА — ${mName} ${y} г. (${monthReps.length} док.)`,
        author: byFio,
        ts: Date.now(),
        html: summaryHtml
    };

    if (db) {
        db.collection('archive_reports').doc(archItem.id).set(archItem).catch(() => {});
        db.collection('closed_months').doc(monthKey).set({ id: monthKey, label: `${mName} ${y}`, closedBy: byFio, closedAt, count: monthReps.length }).catch(() => {});
    } else {
        cloudArchive.unshift(archItem);
        st9ClosedMonths.push({ id: monthKey, label: `${mName} ${y}` });
    }

    if (typeof sendCloudNotification === 'function') {
        sendCloudNotification(`🔒 Месяц ${mName} ${y} закрыт (${byFio}). Сформирован итоговый отчет в Архиве.`);
    }
    renderStage9ReportsArchive();
    alert(`Месяц «${mName} ${y}» успешно закрыт! Итоговый файл добавлен в Архив отчетов.`);
}
