// ============================================================
// === ЭТАП 8: РОСПИСЬ ФДУ ТОЛЬКО В ПРОФИЛЕ ОПЕРАТОРА ГУО   ===
// === И СЧЕТЧИК ОТПРАВЛЕННЫХ ФДУ НА КНОПКЕ ГУО             ===
// ============================================================

let cloudPendingFdu = [];
let st8LastPendingCount = 0;
let st8ActiveReviewDocId = null;

window.addEventListener('load', () => {
    injectStage8Styles();
    injectStage8Modal();
    setTimeout(() => {
        initStage8GuoWorkflow();
    }, 950);
});

function injectStage8Styles() {
    if (document.getElementById('st8-styles')) return;
    let st = document.createElement('style');
    st.id = 'st8-styles';
    st.innerHTML = `
        .guo-btn-wrap { position: relative; display: block; width: 100%; }
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

function initStage8GuoWorkflow() {
    // 1. Добавляем счетчик на кнопку «Завершение работы контролёров» в профиле ГУО
    let guoBtn = document.querySelector('#guoDashboardBox .guo-main-btn');
    if (guoBtn && !document.getElementById('guoPendingBadge')) {
        guoBtn.innerHTML = `✅ Завершение работы контролёров <span id="guoPendingBadge" class="guo-count-badge">0</span>`;
    }

    // 2. Обновляем статусную кнопку на главном экране (поддержка статуса "Ожидает подписи ГУО")
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

    // 3. Перехватываем кнопку «Сохранить рапорт смены» у контролёра:
    //    теперь она НЕ открывает окно подписи в профиле контролёра, а отправляет ФДУ в ГУО
    window.openGuoSignModal = function() {
        sendControllerFduToGuo();
    };

    // 4. Подписка на очередь ФДУ, отправленных контролёрами в ГУО
    if (typeof db !== 'undefined' && db) {
        db.collection('pending_fdu_reports').onSnapshot(snap => {
            cloudPendingFdu = [];
            snap.forEach(d => cloudPendingFdu.push(d.data()));
            cloudPendingFdu.sort((a, b) => (b.ts || 0) - (a.ts || 0));
            updateGuoPendingBadge();
        });
    }

    // Обновляем бейдж при каждом переключении экрана ГУО
    const _origApplyGuo = window.applyGuoMainScreenMode;
    window.applyGuoMainScreenMode = function() {
        if (typeof _origApplyGuo === 'function') _origApplyGuo();
        updateGuoPendingBadge();
    };
    updateGuoPendingBadge();
}

// ============================================================
// === ОТПРАВКА ФДУ КОНТРОЛЁРОМ В ОЧЕРЕДЬ НА ПОДПИСЬ В ГУО ===
// ============================================================
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

    // Определяем станцию заступления по первому поезду маршрута
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
        route,
        mkassa,
        startStation,
        firstTrain: routeInfo.firstTrain || (rows[0] ? `${rows[0].num} (${rows[0].route})` : '—'),
        grandTix,
        grandSum,
        testTix,
        tapeLeft,
        rows,
        status: 'pending', // pending | signed
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

// ============================================================
// === СЧЕТЧИК НА КНОПКЕ ГУО ===
// ============================================================
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
    let pendingList = getPendingFduForMyStation(false);
    let count = pendingList.length;

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

// ============================================================
// === ОКНО ГУО: СПИСОК ОТПРАВЛЕННЫХ ФДУ + КОНТРОЛЁРЫ УЧАСТКА ===
// ============================================================
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

    // Сначала — контролёры, которые ОТПРАВИЛИ ФДУ на подпись
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

    // Ниже — остальные контролёры участка на смене (еще не отправили ФДУ)
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

    if (!html) {
        html = `<div style="text-align:center;color:#666;padding:20px;">Нет контролёров с отправленными ФДУ на участке «${st8Esc(myStation)}».</div>`;
    }

    document.getElementById('guoControllersList').innerHTML = html;
    openModal('guoFinishModal');
};

// ============================================================
// === ПРОВЕРКА И ПОДПИСЬ ФДУ В ПРОФИЛЕ ОПЕРАТОРА ГУО ===
// ============================================================
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

    // Показываем личную подпись оператора ГУО из профиля (если есть) + холст для росписи
    let guoSig = appState.user?.signature || '';
    let savedSigBox = document.getElementById('st8GuoSavedSigBox');
    let savedSigImg = document.getElementById('st8GuoSavedSigImg');
    if (guoSig) {
        savedSigImg.src = guoSig;
        savedSigBox.style.display = 'block';
    } else {
        savedSigBox.style.display = 'none';
    }

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

    // Берем нарисованную подпись или сохраненную подпись из профиля ГУО
    let sigImg = appState.user?.signature || '';
    if (typeof sigCtxMap !== 'undefined' && sigCtxMap['st8GuoDrawCanvas']) {
        let c = sigCtxMap['st8GuoDrawCanvas'].c;
        // Проверяем, рисовал ли оператор на холсте
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
