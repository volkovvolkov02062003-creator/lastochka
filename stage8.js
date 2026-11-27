// ============================================================
// === ЭТАП 8: РОСПИСЬ ФДУ В ПРОФИЛЕ ГУО, СЧЕТЧИК НА КНОПКЕ ===
// === И РАЗДЕЛЕНИЕ ТАБЕЛЯ ПО СПИСКАМ УЧАСТКОВ              ===
// ============================================================

let cloudPendingFdu = [];
let st8LastPendingCount = 0;
let st8ActiveReviewDocId = null;
let st8SelectedSector = null;

window.addEventListener('load', () => {
    injectStage8Styles();
    injectStage8Modal();
    setTimeout(() => {
        initStage8GuoWorkflow();
        initStage8TabelBySector();
    }, 950);
});

function injectStage8Styles() {
    if (document.getElementById('st8-styles')) return;
    let st = document.createElement('style');
    st.id = 'st8-styles';
    st.innerHTML = `
        .guo-count-badge {
            display: none;
            align-items: center;
            justify-content: center;
            background: #e63946;
            color: #ffffff;
            font-size: 16px;
            font-weight: bold;
            min-width: 30px;
            height: 30px;
            padding: 0 8px;
            border-radius: 15px;
            margin-left: 10px;
            vertical-align: middle;
            box-shadow: 0 2px 8px rgba(0,0,0,0.35);
            border: 2px solid #ffffff;
        }
        .guo-fdu-pending-row {
            background: #fff8e1;
            border-left: 4px solid #e63946;
        }
        /* ВКЛАДКИ УЧАСТКОВ В ТАБЕЛЕ */
        .tabel-sector-bar {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            align-items: center;
            margin-bottom: 10px;
            padding: 8px 10px;
            background: #eef2f7;
            border-radius: 6px;
            border: 1px solid #cfd8e3;
        }
        .tabel-sector-tab {
            width: auto !important;
            margin: 0 !important;
            padding: 6px 12px !important;
            font-size: 12px !important;
            border-radius: 16px !important;
            background: #ffffff;
            color: #003366;
            border: 1px solid #b8c7dc !important;
        }
        .tabel-sector-tab.active {
            background: #003366 !important;
            color: #ffffff !important;
            border-color: #003366 !important;
        }
        .tabel-sector-header-row td {
            background: #dce6f1 !important;
            color: #003366 !important;
            font-weight: bold !important;
            text-align: left !important;
            padding: 6px 10px !important;
            font-size: 12px !important;
        }
    `;
    document.head.appendChild(st);
}

function st8Esc(str) {
    return String(str || '').replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}

function isCurrentUserGuo() {
    let role = typeof getUserRole === 'function' ? getUserRole() : 'viewer';
    return role === 'guo' || (appState.user?.position || '').toLowerCase().includes('гуо');
}

// ============================================================
// === ЧАСТЬ 1: РОСПИСЬ ФДУ В ПРОФИЛЕ ГУО + СЧЕТЧИК         ===
// ============================================================
function initStage8GuoWorkflow() {
    let guoBtn = document.querySelector('#guoDashboardBox .guo-main-btn');
    if (guoBtn && !document.getElementById('guoPendingBadge')) {
        guoBtn.innerHTML = `✅ Завершение работы контролёров <span id="guoPendingBadge" class="guo-count-badge">0</span>`;
    }

    const _origUpdateShiftBtn = window.updateShiftMainButton;
    window.updateShiftMainButton = function() {
        let btn = document.getElementById('btnMainShift');
        if (!btn) return;
        if (appState.shiftState === 'pending_guo') {
            btn.className = "btn-shift-status btn-warning";
            btn.innerText = "🟡 ФДУ отправлен в ГУО (ждет подписи)";
        } else if (typeof _origUpdateShiftBtn === 'function') {
            _origUpdateShiftBtn();
        }
    };
    window.updateShiftMainButton();

    window.openGuoSignModal = function() {
        sendControllerFduToGuo();
    };

    if (typeof db !== 'undefined' && db) {
        db.collection('pending_fdu_reports').onSnapshot(snap => {
            cloudPendingFdu = [];
            snap.forEach(d => cloudPendingFdu.push(d.data()));
            cloudPendingFdu.sort((a, b) => (b.ts || 0) - (a.ts || 0));
            updateGuoPendingBadge();
        });
    }

    const _origApplyGuo = window.applyGuoMainScreenMode;
    window.applyGuoMainScreenMode = function() {
        if (typeof _origApplyGuo === 'function') _origApplyGuo();
        updateGuoPendingBadge();
    };
    updateGuoPendingBadge();
}

function sendControllerFduToGuo() {
    if (!appState.user) return alert("Сначала войдите в профиль!");
    if (!confirm("Отправить рапорт смены ФДУ на подпись оператору ГУО?")) return;

    let route = document.getElementById('fduRouteVal')?.value.trim() || '—';
    let mkassa = document.getElementById('fduCashVal')?.value.trim() || '—';
    let grandTix = document.getElementById('fduGrandTickets')?.innerText || '0';
    let grandSum = document.getElementById('fduGrandSum')?.innerText || '0.00';
    let testTix = document.getElementById('fduTestTicketCount')?.value || '0';
    let tapeLeft = document.getElementById('fduTapeLeft')?.value || '—';

    let rows = Array.from(document.querySelectorAll('#fduLeftBody .train-slot-row')).map(tr => ({
        num: tr.querySelector('.fdu-train-num')?.value.trim() || '',
        route: tr.querySelector('.fdu-train-route')?.value.trim() || '',
        time: tr.querySelector('.fdu-train-time')?.value.trim() || '',
        tix: tr.querySelector('.fdu-train-tix')?.value.trim() || '',
        sum: tr.querySelector('.fdu-train-sum')?.value.trim() || ''
    })).filter(r => r.num);

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
        firstTrain: routeInfo.firstTrain || (rows[0] ? `${rows[0].num} (${rows[0].route})` : '—'),
        grandTix, grandSum, testTix, tapeLeft, rows,
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
    window.updateShiftMainButton();

    if (typeof sendCloudNotification === 'function') {
        sendCloudNotification(`📄 В ГУО (${startStation}): ${appState.user.fio} (маршрут ${route}) отправил ФДУ на подпись.`);
    }
    if (typeof addLog === 'function') addLog(`Рапорт ФДУ отправлен на подпись оператору ГУО (${startStation}).`);
    alert(`Рапорт ФДУ отправлен оператору ГУО (${startStation}) на подпись!\nСмена закроется автоматически, как только оператор ГУО подпишет его в своем профиле.`);
    backToMain();
}

function getPendingFduForMyStation(showAll) {
    let myStation = (appState.user?.station || appState.user?.sector || 'Клин').trim().toLowerCase();
    return cloudPendingFdu.filter(r => {
        if (r.status !== 'pending') return false;
        if (showAll || !myStation) return true;
        let st = (r.startStation || '').toLowerCase();
        return !st || st.includes(myStation) || myStation.includes(st);
    });
}

function updateGuoPendingBadge() {
    let badge = document.getElementById('guoPendingBadge');
    if (!badge) return;
    let count = getPendingFduForMyStation(false).length;
    if (count > 0) {
        badge.innerText = count;
        badge.style.display = 'inline-flex';
        if (isCurrentUserGuo() && count > st8LastPendingCount && typeof playNotificationSound === 'function') {
            playNotificationSound();
        }
    } else {
        badge.style.display = 'none';
    }
    st8LastPendingCount = count;
}

window.openGuoFinishControllersModal = function(showAll) {
    let myStation = (appState.user?.station || appState.user?.sector || 'Клин').trim();
    document.getElementById('guoFilterStationTitle').innerText = showAll ? 'Все участки' : `Участок заступления: ${myStation}`;
    document.getElementById('guoToggleAllBtn').innerText = showAll ? `Только мой участок (${myStation})` : 'Показать все участки';
    document.getElementById('guoToggleAllBtn').onclick = () => window.openGuoFinishControllersModal(!showAll);

    let pendingList = getPendingFduForMyStation(showAll);
    let pendingTabs = new Set(pendingList.map(p => p.tab));

    let now = new Date();
    let ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    let dToday = String(now.getDate());
    let todayTabel = cloudTabelByMonth[ym] || {};

    let otherWorkers = (appState.workers || []).filter(w => !pendingTabs.has(w.tab)).map(w => {
        let cell = todayTabel[w.tab]?.[dToday];
        let routeNum = cell?.route || '';
        let info = (routeNum && routeNum !== 'В' && typeof getRouteStartStation === 'function')
            ? getRouteStartStation(routeNum) : { station: '', firstTrain: '' };
        let startSt = info.station || w.station || '';
        let matchesStation = showAll || !myStation || startSt.toLowerCase().includes(myStation.toLowerCase()) || myStation.toLowerCase().includes(startSt.toLowerCase());
        let isWorkingToday = (routeNum && routeNum !== 'В') || w.shiftActive || w.shiftStatus === 'open';
        return { w, routeNum, firstTrain: info.firstTrain, startSt, matchesStation, isWorkingToday };
    }).filter(x => x.isWorkingToday && x.matchesStation);

    let html = '';
    if (pendingList.length > 0) {
        html += `<div style="padding:8px 10px;background:#e63946;color:#fff;font-weight:bold;font-size:12px;">📄 Отправили ФДУ на подпись (${pendingList.length})</div>`;
        html += pendingList.map(rep => `
            <div class="guo-fdu-pending-row" style="display:flex;justify-content:space-between;align-items:center;padding:10px;border-bottom:1px solid #ddd;gap:8px;flex-wrap:wrap;">
                <div style="font-size:13px;">
                    <strong>${st8Esc(rep.fio)}</strong> (Таб. ${st8Esc(rep.tab)})<br>
                    <small style="color:#444;">Маршрут: <b>${st8Esc(rep.route)}</b> • 1-й поезд: <b>${st8Esc(rep.firstTrain)}</b> • Участок: <b>${st8Esc(rep.startStation)}</b></small><br>
                    <small style="color:#003366;">Билетов: <b>${st8Esc(rep.grandTix)}</b> | Сумма: <b>${st8Esc(rep.grandSum)} ₽</b> | Отправлено: ${st8Esc(rep.sentAt)}</small>
                </div>
                <button class="btn-success" style="width:auto;margin:0;padding:8px 14px;font-size:12px;" onclick="openGuoReviewAndSignModal('${rep.id}')">✍️ Проверить и подписать</button>
            </div>
        `).join('');
    }

    if (otherWorkers.length > 0) {
        html += `<div style="padding:8px 10px;background:#eef2f7;color:#333;font-weight:bold;font-size:12px;">🚆 На смене (ФДУ еще не отправлен)</div>`;
        html += otherWorkers.map(item => {
            let stTxt = item.w.shiftStatus === 'closed' ? '🔵 Смена закрыта' : (item.w.shiftActive || item.w.shiftStatus === 'open' ? '🟢 На смене' : '🟡 По графику');
            return `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;border-bottom:1px solid #eee;gap:8px;flex-wrap:wrap;">
                    <div style="font-size:13px;">
                        <strong>${st8Esc(item.w.fio)}</strong> (Таб. ${st8Esc(item.w.tab)})<br>
                        <small style="color:#555;">Маршрут: <b>${st8Esc(item.routeNum || '—')}</b> • 1-й поезд: <b>${st8Esc(item.firstTrain || '—')}</b> • Заступал: <b>${st8Esc(item.startSt || '—')}</b></small><br>
                        <small>${stTxt}</small>
                    </div>
                    <span style="font-size:12px;color:#888;">Ждем отправки ФДУ</span>
                </div>
            `;
        }).join('');
    }

    if (!html) html = `<div style="text-align:center;color:#666;padding:20px;">Нет контролёров с отправленными ФДУ на участке «${st8Esc(myStation)}».</div>`;
    document.getElementById('guoControllersList').innerHTML = html;
    openModal('guoFinishModal');
};

function openGuoReviewAndSignModal(docId) {
    let rep = cloudPendingFdu.find(x => x.id === docId);
    if (!rep) return;
    st8ActiveReviewDocId = docId;

    let rowsHtml = (rep.rows || []).length
        ? rep.rows.map(r => `<tr><td>${st8Esc(r.num)}</td><td>${st8Esc(r.route)}</td><td>${st8Esc(r.time)}</td><td>${st8Esc(r.tix)}</td><td>${st8Esc(r.sum)}</td></tr>`).join('')
        : '<tr><td colspan="5" style="color:#666;">Поезда не заполнены</td></tr>';

    document.getElementById('st8ReviewBody').innerHTML = `
        <div style="font-size:13px;margin-bottom:10px;line-height:1.6;">
            <strong>Контролёр:</strong> ${st8Esc(rep.fio)} (Таб. ${st8Esc(rep.tab)})<br>
            <strong>Маршрут:</strong> ${st8Esc(rep.route)} | <strong>МКасса:</strong> ${st8Esc(rep.mkassa)} | <strong>Участок:</strong> ${st8Esc(rep.startStation)}<br>
            <strong>Пробников:</strong> ${st8Esc(rep.testTix)} | <strong>Остаток ленты:</strong> ${st8Esc(rep.tapeLeft)}
        </div>
        <table class="crud-table" style="margin-bottom:10px;">
            <thead><tr><th>№ поезда</th><th>Перегон</th><th>Время</th><th>Билетов</th><th>Сумма</th></tr></thead>
            <tbody>
                ${rowsHtml}
                <tr style="font-weight:bold;background:#eef6ff;"><td colspan="3" style="text-align:right;">Итого:</td><td>${st8Esc(rep.grandTix)}</td><td>${st8Esc(rep.grandSum)} ₽</td></tr>
            </tbody>
        </table>
    `;

    let guoSig = appState.user?.signature || '';
    let savedSigBox = document.getElementById('st8GuoSavedSigBox');
    let savedSigImg = document.getElementById('st8GuoSavedSigImg');
    if (guoSig) { savedSigImg.src = guoSig; savedSigBox.style.display = 'block'; }
    else { savedSigBox.style.display = 'none'; }

    openModal('st8GuoReviewModal');
    setTimeout(() => { if (typeof initCanvas === 'function') initCanvas('st8GuoDrawCanvas'); }, 100);
}

function clearSt8GuoCanvas() {
    if (typeof sigCtxMap !== 'undefined' && sigCtxMap['st8GuoDrawCanvas']) {
        let s = sigCtxMap['st8GuoDrawCanvas'];
        s.ctx.clearRect(0, 0, s.c.width, s.c.height);
    }
}

function confirmSt8GuoSignature() {
    let rep = cloudPendingFdu.find(x => x.id === st8ActiveReviewDocId);
    if (!rep) return;

    let guoFio = appState.user?.fio || 'Оператор ГУО';
    let closedAt = new Date().toLocaleString('ru-RU');

    let sigImg = appState.user?.signature || '';
    if (typeof sigCtxMap !== 'undefined' && sigCtxMap['st8GuoDrawCanvas']) {
        let c = sigCtxMap['st8GuoDrawCanvas'].c;
        let blank = document.createElement('canvas'); blank.width = c.width; blank.height = c.height;
        if (c.toDataURL() !== blank.toDataURL()) sigImg = c.toDataURL();
    }

    let rowsHtml = (rep.rows || []).map(r => `<tr><td>${st8Esc(r.num)}</td><td>${st8Esc(r.route)}</td><td>${st8Esc(r.time)}</td><td>${st8Esc(r.tix)}</td><td>${st8Esc(r.sum)}</td></tr>`).join('');
    let reportHtml = `
        <h3>Рапорт смены ФДУ — Маршрут ${st8Esc(rep.route)}</h3>
        <p><strong>Контролёр:</strong> ${st8Esc(rep.fio)} (Таб. ${st8Esc(rep.tab)}) | <strong>Участок:</strong> ${st8Esc(rep.startStation)}</p>
        <p><strong>Дата и время закрытия:</strong> ${closedAt} | <strong>Подписал оператор ГУО:</strong> ${st8Esc(guoFio)}</p>
        <table border="1" style="border-collapse:collapse;width:100%;">
            <tr style="background:#dce6f1;"><th>№ поезда</th><th>Перегон</th><th>Время</th><th>Билетов</th><th>Сумма</th></tr>
            ${rowsHtml}
            <tr style="font-weight:bold;"><td colspan="3">Итого:</td><td>${st8Esc(rep.grandTix)}</td><td>${st8Esc(rep.grandSum)}</td></tr>
        </table>
        <p>Пробных билетов: ${st8Esc(rep.testTix)} | Остаток ленты: ${st8Esc(rep.tapeLeft)}</p>
        <p>Подпись оператора ГУО (${st8Esc(guoFio)}):<br>${sigImg ? `<img src="${sigImg}" style="height:52px;border:1px solid #ccc;">` : '________________'}</p>
    `;

    let archItem = {
        id: 'rep_fdu_' + Date.now(),
        folder: `ФДУ Маршрут ${rep.route} — ${rep.fio} (${closedAt}, ГУО: ${guoFio})`,
        author: `${rep.fio} / ГУО: ${guoFio}`,
        ts: Date.now(),
        html: reportHtml
    };

    if (db) {
        db.collection('pending_fdu_reports').doc(rep.id).update({ status: 'signed', signedBy: guoFio, signedAt: closedAt }).catch(() => {});
        db.collection('archive_reports').doc(archItem.id).set(archItem).catch(() => {});
        db.collection('workers').doc(rep.tab).update({ shiftActive: false, shiftStatus: 'closed' }).catch(() => {});
        db.collection('active_shifts').doc(rep.tab).set({
            shiftState: 'closed',
            lastMkassaTix: 0,
            lastMkassaMoney: 0,
            'fduFields.fduShiftEndTime': closedAt,
            'fduFields.fduGuoSignField': `${guoFio} (${closedAt})`,
            ts: Date.now()
        }, { merge: true }).catch(() => {});
    }

    if (typeof sendCloudNotification === 'function') {
        sendCloudNotification(`✅ Оператор ГУО (${guoFio}) подписал ФДУ контролёра ${rep.fio} (${closedAt}). Смена закрыта!`);
    }

    closeModal('st8GuoReviewModal');
    showSyncToast(`✍️ ФДУ ${rep.fio} подписан, смена закрыта!`);
    setTimeout(() => window.openGuoFinishControllersModal(false), 350);
}

// ============================================================
// === ЧАСТЬ 2: ТАБЕЛЬ — СВОЙ СПИСОК ДЛЯ КАЖДОГО УЧАСТКА    ===
// ============================================================
function getWorkerSectorName(w) {
    return ((w && (w.sector || w.station)) || 'Без участка').trim();
}

function getAllTabelSectors() {
    let set = new Set();
    (appState.workers || []).forEach(w => set.add(getWorkerSectorName(w)));
    if (typeof departmentsDb !== 'undefined') {
        departmentsDb.forEach(d => { if (d && d.name) set.add(d.name.trim()); });
    }
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b, 'ru'));
}

function selectTabelSector(secName) {
    st8SelectedSector = secName;
    renderTabel();
}

function renderTabelSectorTabs() {
    let tbl = document.querySelector('#tabel-screen table.tabel-table');
    if (!tbl) return;

    let bar = document.getElementById('tabelSectorBar');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'tabelSectorBar';
        bar.className = 'tabel-sector-bar';
        tbl.parentNode.insertBefore(bar, tbl);
    }

    let sectors = getAllTabelSectors();
    let mySec = getWorkerSectorName(appState.user || {});

    // По умолчанию открываем участок текущего сотрудника (или первый доступный)
    if (!st8SelectedSector || (st8SelectedSector !== '__grouped__' && !sectors.includes(st8SelectedSector))) {
        st8SelectedSector = sectors.includes(mySec) ? mySec : (sectors[0] || 'Без участка');
    }

    let canSeeAll = typeof canCreateWorker === 'function' && canCreateWorker();
    let html = `<span style="font-size:12px;font-weight:bold;color:#003366;margin-right:4px;">🏢 Участок:</span>`;

    sectors.forEach(sec => {
        let cnt = (appState.workers || []).filter(w => getWorkerSectorName(w) === sec).length;
        let isActive = st8SelectedSector === sec;
        let safeSec = st8Esc(sec).replace(/'/g, "\\'");
        html += `<button type="button" class="tabel-sector-tab ${isActive ? 'active' : ''}" onclick="selectTabelSector('${safeSec}')">${st8Esc(sec)} (${cnt})</button>`;
    });

    if (canSeeAll && sectors.length > 1) {
        html += `<button type="button" class="tabel-sector-tab ${st8SelectedSector === '__grouped__' ? 'active' : ''}" onclick="selectTabelSector('__grouped__')">📋 Все по участкам</button>`;
    }

    bar.innerHTML = html;
}

function buildWorkerTabelRowsHtml(w, idx, dim, y, m, md, isCurM, tNum) {
    let st = getWorkerTodayStatus(w), wd = 0, th = 0, c1 = '', c2 = '', wDays = md[w.tab] || {};
    for (let d = 1; d <= dim; d++) {
        let allowed = isDateAllowedForWorker(w, y, m, d);
        let cell = allowed ? wDays[String(d)] : null;
        let rTxt = !allowed ? '—' : (cell?.route ? (cell.senior ? `⭐${cell.route}` : cell.route) : '+');
        let hTxt = cell?.hours || '';
        if (cell?.route && cell.route !== 'В') {
            wd++;
            th += parseFloat(String(hTxt || '0').replace(',', '.')) || 0;
        }
        let cls = 'tabel-cell-day'
            + (!allowed ? ' cell-locked' : '')
            + (isCurM && d === tNum ? ' cell-today-col' : '')
            + (cell?.route === 'В' ? ' cell-weekend' : '')
            + (isCurM && d === tNum && st.code === 'open' ? ' cell-shift-active' : '');
        let clk = (allowed && canEditTabel()) ? `onclick="openTabelDrawer('${w.tab}',${d})"` : '';
        c1 += `<td class="${cls}" ${clk}>${rTxt}</td>`;
        c2 += `<td class="${cls}" ${clk}>${hTxt}</td>`;
    }
    return `<tr><td rowspan="2">${idx + 1}</td><td rowspan="2">${st8Esc(w.tab)}</td><td rowspan="2" style="text-align:left;font-weight:bold;padding-left:4px;">${st8Esc(w.fio)} <span class="status-dot ${st.dotClass}" title="${st.label}"></span></td><td style="font-size:8.5px;background:#f7f7f7;">маршр.</td>${c1}<td rowspan="2"><strong>${wd}</strong></td><td rowspan="2"><strong>${th.toFixed(1).replace('.', ',')}</strong></td></tr><tr><td style="font-size:8.5px;background:#f7f7f7;">часы</td>${c2}</tr>`;
}

function initStage8TabelBySector() {
    // 1. Переопределяем renderTabel — сотрудники строго в списках своих участков
    window.renderTabel = function() {
        renderTabelSectorTabs();

        let m = +document.getElementById('tabelMonthSelect').value;
        let y = +document.getElementById('tabelYearSelect').value;
        let dim = new Date(y, m + 1, 0).getDate();
        let ym = getSelectedMonthKey();
        let md = cloudTabelByMonth[ym] || {};
        let fv = document.getElementById('tabelStatusFilter')?.value || 'all';
        let now = new Date(), isCurM = now.getFullYear() === y && now.getMonth() === m, tNum = now.getDate();

        document.getElementById('tabelDaysColspan').colSpan = dim;
        let dr = document.getElementById('tabelDaysHeaderRow'); if (!dr) return;
        dr.innerHTML = '';
        for (let d = 1; d <= dim; d++) dr.innerHTML += `<th ${isCurM && d === tNum ? 'style="background:#ffe599;"' : ''}>${d}</th>`;

        let tb = document.getElementById('tabelBody'); if (!tb) return;
        tb.innerHTML = '';

        let statusFiltered = (appState.workers || []).filter(w => fv === 'all' || getWorkerTodayStatus(w).code === fv);
        let totalCols = dim + 6;

        if (st8SelectedSector === '__grouped__') {
            let sectors = getAllTabelSectors();
            let html = '';
            sectors.forEach(sec => {
                let list = statusFiltered.filter(w => getWorkerSectorName(w) === sec);
                if (!list.length) return;
                html += `<tr class="tabel-sector-header-row"><td colspan="${totalCols}">🏢 Участок: ${st8Esc(sec)} — ${list.length} сотр.</td></tr>`;
                list.forEach((w, idx) => { html += buildWorkerTabelRowsHtml(w, idx, dim, y, m, md, isCurM, tNum); });
            });
            tb.innerHTML = html || `<tr><td colspan="${totalCols}" style="padding:14px;color:#666;">Нет сотрудников по выбранному фильтру</td></tr>`;
        } else {
            let list = statusFiltered.filter(w => getWorkerSectorName(w) === st8SelectedSector);
            let html = `<tr class="tabel-sector-header-row"><td colspan="${totalCols}">🏢 Участок: ${st8Esc(st8SelectedSector)} — ${list.length} сотр.</td></tr>`;
            if (!list.length) {
                html += `<tr><td colspan="${totalCols}" style="padding:14px;color:#666;">В участке «${st8Esc(st8SelectedSector)}» нет сотрудников по выбранному фильтру</td></tr>`;
            } else {
                list.forEach((w, idx) => { html += buildWorkerTabelRowsHtml(w, idx, dim, y, m, md, isCurM, tNum); });
            }
            tb.innerHTML = html;
        }

        document.getElementById('btnTabelCreateWorker').style.display = canCreateWorker() ? 'inline-block' : 'none';
        document.getElementById('btnTabelLoadFile').style.display = canEditTabel() ? 'inline-block' : 'none';
        document.getElementById('btnTabelDistribute').style.display = canEditTabel() ? 'inline-block' : 'none';
        document.getElementById('btnTabelNotify').style.display = (appState.tabelDirty && canEditTabel()) ? 'inline-block' : 'none';
    };

    // 2. При создании сотрудника из Табеля автоматически подставляем открытый участок
    const _origOpenWorkerModal = window.openWorkerModal;
    window.openWorkerModal = function(tab) {
        if (typeof _origOpenWorkerModal === 'function') _origOpenWorkerModal(tab);
        if (!tab && st8SelectedSector && st8SelectedSector !== '__grouped__') {
            let secInp = document.getElementById('newWorkerSector');
            if (secInp && !secInp.value) secInp.value = st8SelectedSector;
        }
    };

    // 3. В «Раскидать по маршрутам» показываем сотрудников текущего участка
    window.renderDistributeList = function() {
        let { dObj, ymKey, day } = getDistTargetDate();
        let opts = `<option value="">— Выходной —</option>` + routesDb.map(r => `<option value="${r.num}">Маршрут ${r.num}</option>`).join('');
        let workersForDist = (appState.workers || []).filter(w => {
            if (!isDateAllowedForWorker(w, dObj.getFullYear(), dObj.getMonth(), dObj.getDate())) return false;
            if (st8SelectedSector && st8SelectedSector !== '__grouped__') {
                return getWorkerSectorName(w) === st8SelectedSector;
            }
            return true;
        });

        let headerNote = (st8SelectedSector && st8SelectedSector !== '__grouped__')
            ? `<div style="padding:6px 8px;background:#eef6ff;border-radius:4px;font-size:12px;font-weight:bold;color:#003366;margin-bottom:6px;">🏢 Участок: ${st8Esc(st8SelectedSector)}</div>`
            : '';

        document.getElementById('distWorkersList').innerHTML = headerNote + (workersForDist.length
            ? workersForDist.map(w => {
                let cur = cloudTabelByMonth[ymKey]?.[w.tab]?.[day]?.route || '';
                return `<div class="dist-row"><div style="flex:1.5;"><strong>${st8Esc(w.fio)}</strong><br><small>${st8Esc(getWorkerSectorName(w))}</small></div><select class="form-input dist-route-sel" data-tab="${w.tab}" style="flex:1;margin:0;" onchange="checkSharedRoutesForSenior()">${opts.replace(`value="${cur}"`, `value="${cur}" selected`)}</select></div>`;
            }).join('')
            : '<div style="padding:12px;text-align:center;color:#666;">Нет доступных сотрудников на этом участке</div>');
        checkSharedRoutesForSenior();
    };

    // Перерисовываем Табель, если он уже открыт
    if (document.getElementById('tabel-screen')?.classList.contains('active-screen')) {
        window.renderTabel();
    }
}

function injectStage8Modal() {
    let wrap = document.createElement('div');
    wrap.innerHTML = `
        <div id="st8GuoReviewModal" class="modal">
            <div class="modal-content modal-wide">
                <h3 style="margin-top:0;">✍️ Проверка и подпись ФДУ (Оператор ГУО)</h3>
                <div id="st8ReviewBody"></div>
                <div id="st8GuoSavedSigBox" style="display:none;background:#eef6ff;padding:8px;border-radius:6px;text-align:center;margin-bottom:10px;">
                    <div style="font-size:11px;color:#555;">Ваша подпись из профиля ГУО (будет использована, если не рисовать ниже):</div>
                    <img id="st8GuoSavedSigImg" style="max-height:55px;margin:4px auto;display:block;background:#fff;border:1px solid #ccc;">
                </div>
                <div class="form-group">
                    <label>Или распишитесь прямо здесь:</label>
                    <canvas id="st8GuoDrawCanvas" style="border:2px dashed #003366;background:#fafafa;width:100%;height:85px;cursor:crosshair;"></canvas>
                    <button type="button" class="btn-danger" style="width:auto;padding:4px 8px;font-size:11px;" onclick="clearSt8GuoCanvas()">Очистить</button>
                </div>
                <div style="display:flex;gap:10px;">
                    <button class="btn-success" onclick="confirmSt8GuoSignature()">✍️ Подписать и закрыть смену контролёра</button>
                    <button class="btn-secondary" onclick="closeModal('st8GuoReviewModal')">Отмена</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(wrap);
}
