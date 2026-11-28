// ============================================================
// === ЭТАП 11: ПОЕЗДА НА ЗАВТРА, СВОЯ ВЫРУЧКА ЗА ДЕНЬ,     ===
// === ПРИВАТНОСТЬ АРХИВА, ТОЧНЫЙ ФДУ + ЛЬГОТЫ + БАГАЖ,     ===
// === ПЕРСОНАЛЬНЫЕ УВЕДОМЛЕНИЯ ТАБЕЛЯ                      ===
// ============================================================

let st11TabelBaseline = {};
let st11LastBagTix = 0;
let st11LastBagMoney = 0;

window.addEventListener('load', () => {
    setTimeout(() => {
        initStage11();
    }, 1550);
});

function st11Esc(str) {
    return String(str || '').replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}

function initStage11() {
    // 1. Поезда на «Завтра» в «Моей смене»
    const _origRenderMyShift10 = window.renderMyShift;
    window.renderMyShift = function() {
        if (typeof _origRenderMyShift10 === 'function') _origRenderMyShift10();
        enhanceTomorrowTrainsBlock();
    };

    // 2. Личная выручка ТОЛЬКО своего профиля и ТОЛЬКО за сегодня
    window.updateDashboardTotals = updateStage11OwnDailyDashboard;

    // Изолируем историю смен по табельному номеру при входе
    const _origShowMain11 = window.showMainScreen;
    window.showMainScreen = function(u) {
        if (u && u.tab) {
            let ownHist = JSON.parse(localStorage.getItem('kkl_shift_history_' + u.tab) || 'null');
            if (Array.isArray(ownHist)) appState.shiftHistory = ownHist;
            else appState.shiftHistory = (appState.shiftHistory || []).filter(s => s.tab === u.tab);
        }
        if (typeof _origShowMain11 === 'function') _origShowMain11(u);
        updateStage11OwnDailyDashboard();
    };

    // 3. Точный расчёт поезда, багажа и заполнение правой страницы ФДУ (льготы с 0)
    window.openTrainReport = openStage11TrainReport;
    window.calculateTrainStats = calculateStage11TrainStats;
    window.saveTrainToFdu = saveStage11TrainToFdu;

    // При изменении типа багажа сразу пересчитываем
    let bagTypeSel = document.getElementById('trBaggageType');
    if (bagTypeSel) bagTypeSel.addEventListener('change', calculateStage11TrainStats);

    // 4. Приватность и удаление в Архиве отчетов (чужие видит только Инструктор/Админ/Основатель)
    window.renderReportsArchive = renderStage11ReportsArchive;
    window.deleteArchiveReportById = deleteStage11ArchiveReportById;

    // 5. Персональные уведомления при изменении Табеля
    snapshotTabelBaseline();
    if (typeof db !== 'undefined' && db) {
        db.collection('tabel').onSnapshot(snap => {
            snap.forEach(d => {
                if (!appState.tabelDirty) {
                    st11TabelBaseline[d.id] = JSON.parse(JSON.stringify(d.data() || {}));
                }
            });
        });
        db.collection('notifications').onSnapshot(() => {
            updateStage11BellBadge();
        });
    }
    window.saveAndNotifyStaff = saveAndNotifyStaffStage11;
    window.openNotificationsModal = openStage11NotificationsModal;

    // Обновляем текущие экраны
    updateStage11OwnDailyDashboard();
    updateStage11BellBadge();
    if (document.getElementById('reports-screen')?.classList.contains('active-screen')) renderStage11ReportsArchive();
    if (document.getElementById('myShift-screen')?.classList.contains('active-screen')) window.renderMyShift();
}

// ============================================================
// === 1. ПОКАЗ ПОЕЗДОВ НА «ЗАВТРА» В «МОЕЙ СМЕНЕ»          ===
// ============================================================
function enhanceTomorrowTrainsBlock() {
    let myTab = appState.user?.tab || '8065';
    let tom = new Date();
    tom.setDate(tom.getDate() + 1);
    let ymTom = `${tom.getFullYear()}-${String(tom.getMonth() + 1).padStart(2, '0')}`;
    let dTom = String(tom.getDate());
    let tomCell = cloudTabelByMonth[ymTom]?.[myTab]?.[dTom] || null;
    let tomRouteNum = tomCell?.route || '';
    if (!tomRouteNum || tomRouteNum === 'В') return;

    let tomRouteObj = (routesDb || []).find(r => r.num === tomRouteNum);
    let tomRows = (tomRouteObj?.rows || []).filter(r => r.train);
    if (!tomRows.length) return;

    let targetBox = document.querySelector('#myShift-screen .ms-tomorrow-box') || document.querySelector('#myShift-screen .ms-compact-card');
    if (!targetBox || document.getElementById('st11TomTrainsWrap')) return;

    let cardsHtml = '';
    tomRows.forEach((r, idx) => {
        let sM = timeToMin(r.start) ?? 0, eM = timeToMin(r.end) ?? 0;
        let durM = eM >= sM ? eM - sM : eM + 1440 - sM;
        let trObj = (trainsDb || []).find(t => t.num === r.train);
        let stops = trObj?.stops || [];
        let stopsHtml = stops.map(st => `<div style="display:flex;justify-content:space-between;padding:2px 0;"><span>${st11Esc(st.name)}</span><span>${st11Esc(st.time)}</span></div>`).join('') || '<div>Остановки не заданы</div>';

        cardsHtml += `
            <div class="ms-train-card">
                <div class="ms-train-top">
                    <div class="ms-train-num">${st11Esc(r.train)}</div>
                    <div class="ms-status-txt">завтра</div>
                </div>
                <div class="ms-route-sub">${st11Esc(r.route)}</div>
                <div class="ms-times">${st11Esc(r.start)} → ${st11Esc(r.end)} <span>· ${formatDurMin(durM)} в пути</span></div>
                <span class="ms-stops-toggle" onclick="toggleMsStops('msTomStops_${idx}')">Остановки (${stops.length})</span>
                <div class="ms-stops-list" id="msTomStops_${idx}">${stopsHtml}</div>
            </div>
        `;
        if (idx < tomRows.length - 1) {
            let nextS = timeToMin(tomRows[idx + 1].start);
            if (nextS !== null && eM !== null && nextS > eM) {
                cardsHtml += `<div class="ms-break-line">перерыв ${formatDurMin(nextS - eM)}</div>`;
            }
        }
    });

    let wrap = document.createElement('div');
    wrap.id = 'st11TomTrainsWrap';
    wrap.style.marginTop = '10px';
    wrap.innerHTML = `
        <span id="st11TomToggleBtn" style="color:#60a5fa;font-size:13px;font-weight:bold;cursor:pointer;display:inline-block;margin-bottom:8px;" onclick="toggleSt11TomTrains()">▶ Все поезда маршрута (${tomRows.length})</span>
        <div id="st11TomTimeline" class="ms-timeline" style="display:none;margin-top:6px;">${cardsHtml}</div>
    `;

    // В компактной карточке вставляем перед ссылкой «Мой график на месяц», в обычной — в конец .ms-tomorrow-box
    let calLink = targetBox.querySelector('.ms-compact-link');
    if (calLink) targetBox.insertBefore(wrap, calLink);
    else targetBox.appendChild(wrap);
}

function toggleSt11TomTrains() {
    let tl = document.getElementById('st11TomTimeline');
    let btn = document.getElementById('st11TomToggleBtn');
    if (!tl || !btn) return;
    let open = tl.style.display === 'block';
    tl.style.display = open ? 'none' : 'block';
    btn.innerText = btn.innerText.replace(open ? '▼' : '▶', open ? '▶' : '▼');
}

// ============================================================
// === 2. ЛИЧНАЯ ВЫРУЧКА ЗА СЕГОДНЯ (ТОЛЬКО СВОЙ ПРОФИЛЬ)   ===
// ============================================================
function updateStage11OwnDailyDashboard() {
    let myTab = appState.user?.tab || '';
    let todayIso = new Date().toISOString().split('T')[0];

    // Берем строго записи ЭТОГО сотрудника и ТОЛЬКО за сегодняшний день
    let todayOwn = (appState.shiftHistory || []).filter(s => s.date === todayIso && (!s.tab || s.tab === myTab));

    let dayTariff = 0, dayFee = 0, dayTix = 0;
    let bt = getEmptyBenefits();
    todayOwn.forEach(s => {
        dayTariff += Number(s.tariff || 0);
        dayFee += Number(s.fee || 0);
        dayTix += Number(s.tickets || 0);
        ['rzd', 'fed', 'reg', 'stud', 'vohr'].forEach(k => {
            bt[k].count += Number(s.benefits?.[k]?.count || 0);
            bt[k].sum += Number(s.benefits?.[k]?.sum || 0);
        });
    });

    let bs = bt.rzd.sum + bt.fed.sum + bt.reg.sum + bt.stud.sum + bt.vohr.sum;
    let bc = bt.rzd.count + bt.fed.count + bt.reg.count + bt.stud.count + bt.vohr.count;

    let elT = document.getElementById('dashTariff');
    let elF = document.getElementById('dashFee');
    let elBS = document.getElementById('dashBenSum');
    let elBT = document.getElementById('dashBenTix');
    let elTR = document.getElementById('dashTotalRev');
    let elTT = document.getElementById('dashTotalTix');

    if (elT) elT.innerText = dayTariff.toFixed(2) + ' ₽';
    if (elF) elF.innerText = dayFee.toFixed(2) + ' ₽';
    if (elBS) elBS.innerText = bs.toFixed(2) + ' ₽';
    if (elBT) elBT.innerText = 'Билетов: ' + bc;
    if (elTR) elTR.innerText = (dayTariff + dayFee).toFixed(2) + ' ₽';
    if (elTT) elTT.innerText = 'Билетов: ' + dayTix;

    ['Rzd', 'Fed', 'Reg', 'Stud', 'Vohr'].forEach(K => {
        let k = K.toLowerCase();
        let sEl = document.getElementById('bd' + K + 'S');
        let cEl = document.getElementById('bd' + K + 'C');
        if (sEl) sEl.innerText = bt[k].sum.toFixed(2);
        if (cEl) cEl.innerText = bt[k].count;
    });
}

// ============================================================
// === 3. ТОЧНЫЙ РАСЧЁТ ФДУ, БАГАЖА И ЛЬГОТ (С НУЛЯМИ)      ===
// ============================================================
function openStage11TrainReport() {
    document.getElementById('prevMkassaTix').innerText = appState.lastMkassaTix || 0;
    document.getElementById('prevMkassaMoney').innerText = Number(appState.lastMkassaMoney || 0).toFixed(2);
    document.getElementById('trStatTickets').value = appState.lastMkassaTix || 0;
    document.getElementById('trStatMoney').value = appState.lastMkassaMoney || 0;

    // Сбрасываем багаж для нового поезда (если в этом поезде нет багажа — будут 0)
    document.getElementById('trBaggageType').value = 'none';
    document.getElementById('trBaggageCount').value = 0;
    document.getElementById('trBaggageSum').value = 0;

    calculateStage11TrainStats();
    navTo('trainReport');
}

function calculateStage11TrainStats() {
    let ct = parseFloat(document.getElementById('trStatTickets').value) || 0;
    let cm = parseFloat(document.getElementById('trStatMoney').value) || 0;
    let bType = document.getElementById('trBaggageType').value;
    let bt = parseFloat(document.getElementById('trBaggageCount').value) || 0;
    let bs = parseFloat(document.getElementById('trBaggageSum').value) || 0;

    let deltaTix = Math.max(0, ct - (appState.lastMkassaTix || 0));
    let deltaMoney = Math.max(0, cm - (appState.lastMkassaMoney || 0));

    // Если выбрано «Без багажа» — багаж не добавляется вообще (0).
    // Если выбран багаж — берем разницу как по билетам (если ввели 0 или оставили прежнее — 0).
    let deltaBagTix = 0, deltaBagMoney = 0;
    if (bType !== 'none') {
        deltaBagTix = bt > 0 ? Math.max(0, bt - st11LastBagTix) : 0;
        deltaBagMoney = bs > 0 ? Math.max(0, bs - st11LastBagMoney) : 0;
    }

    document.getElementById('resTrainTickets').innerText = Math.round(deltaTix + deltaBagTix);
    document.getElementById('resTrainMoney').innerText = (deltaMoney + deltaBagMoney).toFixed(2);
}

function saveStage11TrainToFdu() {
    let lRows = document.querySelectorAll('#fduLeftBody .train-slot-row');
    let rRows = document.querySelectorAll('#fduRightBody .benefit-slot-row');
    if (appState.trainsInFdu >= lRows.length) return alert("Все строки ФДУ заполнены!");

    calculateStage11TrainStats();
    let tix = parseInt(document.getElementById('resTrainTickets').innerText, 10) || 0;
    let mon = parseFloat(document.getElementById('resTrainMoney').innerText) || 0;

    // 1. Заполняем левую страницу ФДУ
    let r = lRows[appState.trainsInFdu];
    r.querySelector('.fdu-train-num').value = document.getElementById('trNum').value.trim();
    r.querySelector('.fdu-train-route').value = document.getElementById('trTo').value.trim();
    r.querySelector('.fdu-train-time').value = document.getElementById('trDepTime').value.trim() + ' - ' + document.getElementById('trArrTime').value.trim();
    r.querySelector('.fdu-train-tix').value = tix;
    r.querySelector('.fdu-train-sum').value = mon.toFixed(2);

    // 2. Заполняем правую страницу ФДУ (льготные категории — если не вносили, ставим 0!)
    let rr = rRows[appState.trainsInFdu];
    if (rr) {
        let inps = rr.querySelectorAll('input');
        let vals = [
            currentTrainBenefits.rzd.count || 0, (currentTrainBenefits.rzd.sum || 0).toFixed(2),
            currentTrainBenefits.fed.count || 0, (currentTrainBenefits.fed.sum || 0).toFixed(2),
            currentTrainBenefits.reg.count || 0, (currentTrainBenefits.reg.sum || 0).toFixed(2),
            currentTrainBenefits.stud.count || 0, (currentTrainBenefits.stud.sum || 0).toFixed(2)
        ];
        vals.forEach((v, idx) => { if (inps[idx]) inps[idx].value = v; });
    }

    // 3. Обновляем накопительные показания МКассы (и багажа, только если багаж был)
    let curT = parseFloat(document.getElementById('trStatTickets').value);
    let curM = parseFloat(document.getElementById('trStatMoney').value);
    if (!isNaN(curT) && curT >= (appState.lastMkassaTix || 0)) appState.lastMkassaTix = curT;
    if (!isNaN(curM) && curM >= (appState.lastMkassaMoney || 0)) appState.lastMkassaMoney = curM;

    let bType = document.getElementById('trBaggageType').value;
    let curBT = parseFloat(document.getElementById('trBaggageCount').value) || 0;
    let curBM = parseFloat(document.getElementById('trBaggageSum').value) || 0;
    if (bType !== 'none' && curBT > st11LastBagTix) st11LastBagTix = curBT;
    if (bType !== 'none' && curBM > st11LastBagMoney) st11LastBagMoney = curBM;

    // 4. Пересчитываем «Итого» строго по фактическим строкам ФДУ (без ошибок суммирования)
    let grandTix = 0, grandSum = 0;
    lRows.forEach(rowEl => {
        if (!rowEl.querySelector('.fdu-train-num')?.value.trim()) return;
        grandTix += parseInt(rowEl.querySelector('.fdu-train-tix')?.value, 10) || 0;
        grandSum += parseFloat(rowEl.querySelector('.fdu-train-sum')?.value) || 0;
    });
    document.getElementById('fduGrandTickets').innerText = grandTix;
    document.getElementById('fduGrandSum').innerText = grandSum.toFixed(2);
    document.getElementById('fduTotalSumBottom').value = grandSum.toFixed(2);

    // 5. Сохраняем в личную статистику ТОЛЬКО этого профиля за сегодня
    let myTab = appState.user?.tab || '';
    let iso = new Date().toISOString().split('T')[0];
    let idx = appState.shiftHistory.findIndex(s => s.date === iso && (!s.tab || s.tab === myTab));
    let en = idx >= 0 ? appState.shiftHistory[idx] : { tab: myTab, date: iso, tariff: 0, fee: 0, tickets: 0, benefits: getEmptyBenefits() };
    en.tab = myTab;
    en.tickets = grandTix;
    en.tariff = grandSum;
    ['rzd', 'fed', 'reg', 'stud', 'vohr'].forEach(k => {
        en.benefits[k].count += Number(currentTrainBenefits[k].count || 0);
        en.benefits[k].sum += Number(currentTrainBenefits[k].sum || 0);
    });
    if (idx >= 0) appState.shiftHistory[idx] = en; else appState.shiftHistory.push(en);
    if (myTab) {
        localStorage.setItem('kkl_shift_history_' + myTab, JSON.stringify(appState.shiftHistory));
        if (db) db.collection('shift_stats').doc(`${myTab}_${iso}`).set(en).catch(() => {});
    }

    // Сброс льгот и багажа для следующего поезда
    currentTrainBenefits = getEmptyBenefits();
    ['rzd', 'fed', 'reg', 'stud', 'vohr'].forEach(k => {
        let lbl = document.getElementById('benSumLbl_' + k);
        if (lbl) lbl.innerText = '0.00 ₽';
    });
    document.getElementById('trBaggageType').value = 'none';
    document.getElementById('trBaggageCount').value = 0;
    document.getElementById('trBaggageSum').value = 0;

    appState.trainsInFdu++;
    if (typeof persistActiveShift === 'function') persistActiveShift();
    updateStage11OwnDailyDashboard();
    navTo('fdu');
}

// ============================================================
// === 4. АРХИВ ОТЧЕТОВ: ПРИВАТНОСТЬ И УДАЛЕНИЕ ТОЛЬКО СВОИХ ===
// ============================================================
function isReportOwnedByMe(rep) {
    let myTab = appState.user?.tab || '';
    let myFio = (appState.user?.fio || '').trim().toLowerCase();
    if (!myTab && !myFio) return false;
    if (rep.authorTab) return rep.authorTab === myTab;
    let authStr = String(rep.author || '').toLowerCase();
    return myFio && authStr.startsWith(myFio);
}

function canViewOtherReports() {
    let r = typeof getUserRole === 'function' ? getUserRole() : 'viewer';
    return r === 'instructor' || r === 'admin' || r === 'founder';
}

function renderStage11ReportsArchive() {
    let scr = document.getElementById('reports-screen');
    if (!scr) return;
    let card = scr.querySelector('.card');
    if (!card) return;

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

    let box = document.getElementById('reportsArchiveList');
    if (!box) return;

    let canSeeOthers = canViewOtherReports();
    let visibleReps = (cloudArchive || []).filter(rep => canSeeOthers || isReportOwnedByMe(rep));

    if (!visibleReps.length) {
        box.innerHTML = '<div style="text-align:center;color:#666;padding:20px;">Ваших отчетов пока нет.</div>';
        return;
    }

    let groups = {};
    visibleReps.forEach(rep => {
        let dk = typeof getReportDateKey === 'function' ? getReportDateKey(rep) : new Date(rep.ts || Date.now()).toLocaleDateString('ru-RU');
        if (!groups[dk]) groups[dk] = [];
        groups[dk].push(rep);
    });

    let sortedDates = Object.keys(groups).sort((a, b) => b.split('.').reverse().join('-').localeCompare(a.split('.').reverse().join('-')));

    box.innerHTML = sortedDates.map(dk => {
        let items = groups[dk];
        let isCollapsed = !!(typeof st9ClosedFolders !== 'undefined' && st9ClosedFolders[dk]);
        let safeDk = st11Esc(dk).replace(/'/g, "\\'");
        let itemsHtml = items.map(rep => {
            let mine = isReportOwnedByMe(rep);
            return `
                <div class="report-item-row">
                    <div style="min-width:0;flex:1;">
                        <strong style="font-size:13px;">📄 ${st11Esc(rep.folder)}</strong><br>
                        <small style="color:#666;">${st11Esc(rep.author || '')}</small>
                    </div>
                    <div class="report-actions-group">
                        <button class="btn-success" style="width:auto;margin:0;padding:6px 11px;font-size:12px;" onclick="downloadArchiveExcelById('${rep.id}')">📥 Excel</button>
                        <button class="btn-action" style="width:auto;margin:0;padding:6px 11px;font-size:12px;background:#003366;" onclick="printArchivePdfById('${rep.id}')">📄 PDF</button>
                        ${mine ? `<button class="btn-rep-del" onclick="deleteArchiveReportById('${rep.id}')" title="Удалить свой отчет">✕</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="date-folder-box">
                <div class="date-folder-head" onclick="toggleDateFolderSt9('${safeDk}')">
                    <span>📁 ${st11Esc(dk)} <small style="font-weight:normal;color:#334155;">(${items.length} отч.)</small></span>
                    <span>${isCollapsed ? '▶' : '▼'}</span>
                </div>
                <div class="date-folder-items" style="display:${isCollapsed ? 'none' : 'block'};">${itemsHtml}</div>
            </div>
        `;
    }).join('');
}

function deleteStage11ArchiveReportById(id) {
    let r = (cloudArchive || []).find(x => x.id === id);
    if (!r) return;
    if (!isReportOwnedByMe(r)) {
        return alert("Удалять отчет можно только из профиля, с которого он был создан!");
    }
    if (!confirm(`Удалить ваш отчет «${r.folder}»?`)) return;
    cloudArchive = cloudArchive.filter(x => x.id !== id);
    if (db) db.collection('archive_reports').doc(id).delete().catch(err => alert("Ошибка: " + err.message));
    renderStage11ReportsArchive();
    showSyncToast("🗑️ Отчет удален");
}

// ============================================================
// === 5. ТАБЕЛЬ: ПЕРСОНАЛЬНЫЕ УВЕДОМЛЕНИЯ ПРИ ИЗМЕНЕНИЯХ   ===
// ============================================================
function snapshotTabelBaseline() {
    Object.keys(cloudTabelByMonth || {}).forEach(ym => {
        st11TabelBaseline[ym] = JSON.parse(JSON.stringify(cloudTabelByMonth[ym] || {}));
    });
}

function saveAndNotifyStaffStage11() {
    let ym = getSelectedMonthKey();
    let newMonthData = cloudTabelByMonth[ym] || {};
    let oldMonthData = st11TabelBaseline[ym] || {};
    let mName = monthNamesRu[+document.getElementById('tabelMonthSelect').value] || ym;

    let changedCount = 0;
    (appState.workers || []).forEach(w => {
        let oldW = oldMonthData[w.tab] || {};
        let newW = newMonthData[w.tab] || {};
        let allDays = new Set([...Object.keys(oldW), ...Object.keys(newW)]);
        let changedDays = [];

        allDays.forEach(d => {
            let oR = oldW[d]?.route || '';
            let nR = newW[d]?.route || '';
            let oS = !!oldW[d]?.senior;
            let nS = !!newW[d]?.senior;
            if (oR !== nR || oS !== nS) {
                changedDays.push(`${d} число → ${nR ? (nS ? '⭐' + nR : nR) : 'снято'}`);
            }
        });

        if (changedDays.length > 0) {
            changedCount++;
            let notifId = `tbl_${ym}_${w.tab}_${Date.now()}`;
            let msg = `📅 Изменения в вашем графике (${mName}): ${changedDays.slice(0, 6).join(', ')}${changedDays.length > 6 ? '…' : ''}`;
            if (db) {
                db.collection('notifications').doc(notifId).set({
                    text: msg,
                    targetTab: w.tab,
                    time: new Date().toLocaleString('ru-RU'),
                    ts: Date.now(),
                    read: false
                }).catch(() => {});
            }
        }
    });

    if (db) {
        db.collection('tabel').doc(ym).set(newMonthData).then(() => {
            st11TabelBaseline[ym] = JSON.parse(JSON.stringify(newMonthData));
            showSyncToast(`☁️ Табель сохранен! Уведомлений отправлено: ${changedCount}`);
        });
    } else {
        st11TabelBaseline[ym] = JSON.parse(JSON.stringify(newMonthData));
    }

    appState.tabelDirty = false;
    renderTabel();
    alert(`Табель сохранен! Уведомления отправлены сотрудникам с изменениями в графике (${changedCount} чел.).`);
}

function getMyVisibleNotifications() {
    let myTab = appState.user?.tab || '';
    return (cloudNotifications || []).filter(n => !n.targetTab || n.targetTab === myTab);
}

function updateStage11BellBadge() {
    let unread = getMyVisibleNotifications().filter(n => !n.read).length;
    let badge = document.getElementById('bellBadge');
    if (badge) {
        badge.innerText = unread;
        badge.style.display = unread > 0 ? 'flex' : 'none';
    }
}

function openStage11NotificationsModal() {
    let list = getMyVisibleNotifications();
    let l = document.getElementById('notificationsList');
    l.innerHTML = list.length === 0
        ? '<div style="color:#666;text-align:center;padding:15px;">Нет уведомлений</div>'
        : list.map(n => `<div style="padding:8px;border-bottom:1px solid #eee;background:${n.read ? '#fff' : '#eef6ff'};"><div style="font-size:11px;color:#666;">${n.time || ''}</div><div style="font-size:13px;">${st11Esc(n.text || '')}</div></div>`).join('');
    openModal('notificationsModal');
}
