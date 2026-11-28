// ============================================================
// === ЭТАП 10: УБРАНО 0,3, МОЯ СМЕНА ИЗ ТАБЕЛЯ + КРУЖОЧКИ  ===
// === МАРШРУТОВ, СТАРШИЙ 1/2, МАСТЕР РАССТАНОВОК, РАСКИДАТЬ===
// ============================================================

let st10Master = {
    active: false,
    route: '',
    hours: '',
    station: '__all__'
};

window.addEventListener('load', () => {
    injectStage10Styles();
    injectStage10UI();
    setTimeout(() => {
        initStage10Overrides();
    }, 1350);
});

function st10Esc(str) {
    return String(str || '').replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}

// ============================================================
// === СТИЛИ ЭТАПА 10 ===
// ============================================================
function injectStage10Styles() {
    if (document.getElementById('st10-styles')) return;
    let st = document.createElement('style');
    st.id = 'st10-styles';
    st.innerHTML = `
        /* КРУЖОЧКИ ДРУГИХ МАРШРУТОВ НА ПОЕЗДЕ */
        .ms-route-circle-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 30px;
            height: 30px;
            padding: 0 7px;
            border-radius: 999px;
            background: #1e293b;
            color: #93c5fd;
            border: 1.5px solid #3b82f6;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
            width: auto !important;
            margin: 0 !important;
            transition: transform 0.12s, background 0.15s;
        }
        .ms-route-circle-btn:hover {
            background: #2563eb;
            color: #ffffff;
            transform: scale(1.08);
        }

        /* КОМПАКТНАЯ КАРТОЧКА «МОЯ СМЕНА» (КАК НА ФОТО 1) */
        .ms-compact-card {
            max-width: 560px;
            margin: 70px auto 30px;
            background: #111827;
            color: #e2e8f0;
            border: 1px solid #1f2937;
            border-radius: 14px;
            padding: 24px 26px;
            box-shadow: 0 8px 28px rgba(0,0,0,0.55);
        }
        .ms-compact-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            gap: 12px;
        }
        .ms-compact-val {
            font-size: 26px;
            font-weight: bold;
            color: #ffffff;
            margin-top: 4px;
        }
        .ms-compact-hr {
            border: none;
            border-top: 1px solid #1f2937;
            margin: 18px 0;
        }
        .ms-compact-link {
            display: block;
            text-align: center;
            color: #60a5fa;
            font-size: 14px;
            font-weight: bold;
            margin-top: 22px;
            cursor: pointer;
        }

        /* ПРАВОЕ БОКОВОЕ ОКНО «МАСТЕР РАССТАНОВОК» */
        #st10MasterDrawer {
            position: fixed;
            top: 0;
            right: -360px;
            width: 340px;
            max-width: 92vw;
            height: 100%;
            background: #ffffff;
            color: #000000;
            z-index: 2600;
            transition: right 0.28s ease;
            box-shadow: -4px 0 20px rgba(0,0,0,0.45);
            display: flex;
            flex-direction: column;
            padding: 20px;
            box-sizing: border-box;
        }
        #st10MasterDrawer.open { right: 0; }
        .st10-master-banner {
            display: none;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            flex-wrap: wrap;
            background: #fff3cd;
            border: 1.5px solid #ffc107;
            color: #664d03;
            padding: 8px 12px;
            border-radius: 6px;
            margin-bottom: 10px;
            font-size: 13px;
        }

        /* ДВЕ КОЛОНКИ КОНТРОЛЯ ЧИСЛЕННОСТИ В «РАСКИДАТЬ» */
        .st10-balance-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 12px;
        }
        @media (max-width: 640px) {
            .st10-balance-grid { grid-template-columns: 1fr; }
        }
        .st10-bal-col {
            border-radius: 8px;
            padding: 10px;
            font-size: 12px;
        }
        .st10-bal-over {
            background: #fff1f2;
            border: 1.5px solid #fda4af;
        }
        .st10-bal-under {
            background: #fffbeb;
            border: 1.5px solid #fcd34d;
        }
        .st10-bal-ok {
            background: #ecfdf5;
            border: 1.5px solid #6ee7b7;
            color: #065f46;
            padding: 10px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 12px;
            text-align: center;
        }
    `;
    document.head.appendChild(st);
}

// ============================================================
// === ИНЪЕКЦИЯ КНОПКИ «МАСТЕР РАССТАНОВОК», ПОЛЕЙ И МОДАЛОК ===
// ============================================================
function injectStage10UI() {
    // 1. Кнопка «Мастер расстановок» справа от «+ Создать» в Табеле
    let createBtn = document.getElementById('btnTabelCreateWorker');
    if (createBtn && !document.getElementById('btnTabelMaster')) {
        let mBtn = document.createElement('button');
        mBtn.type = 'button';
        mBtn.id = 'btnTabelMaster';
        mBtn.className = 'btn-action';
        mBtn.style.cssText = 'background:#0d9488;width:auto;margin:0;padding:8px 12px;font-size:13px;';
        mBtn.innerText = '🧭 Мастер расстановок';
        mBtn.onclick = openSt10MasterDrawer;
        createBtn.insertAdjacentElement('afterend', mBtn);
    }

    // 2. Поле «Численность (ККЛ)» в модалке создания маршрута (#routeModal)
    let rtDesc = document.getElementById('rtDescInput');
    if (rtDesc && !document.getElementById('rtStaffCountInput')) {
        let fg = document.createElement('div');
        fg.className = 'form-group';
        fg.style.maxWidth = '130px';
        fg.innerHTML = `<label>Численность ККЛ:</label><input type="number" id="rtStaffCountInput" class="form-input" min="1" value="2" placeholder="2">`;
        rtDesc.closest('.form-row').appendChild(fg);
    }

    // 3. Выбор «Старший на 1 маршрут / на 2 маршрута» в правом меню Табеля (#tabelRightDrawer)
    let senCheck = document.getElementById('drawerSeniorCheck');
    if (senCheck && !document.getElementById('drawerSeniorScopeBox')) {
        let scopeBox = document.createElement('div');
        scopeBox.id = 'drawerSeniorScopeBox';
        scopeBox.style.cssText = 'display:none;background:#fff8e1;border:1px solid #ffe082;padding:8px;border-radius:6px;margin-bottom:10px;font-size:12px;';
        scopeBox.innerHTML = `
            <div style="font-weight:bold;margin-bottom:5px;">На сколько маршрутов старший?</div>
            <label style="display:block;margin-bottom:4px;cursor:pointer;">
                <input type="radio" name="drawerSenScope" value="1" checked onchange="toggleDrawerSecondRoute()"> Старший на 1 маршрут
            </label>
            <label style="display:block;margin-bottom:6px;cursor:pointer;">
                <input type="radio" name="drawerSenScope" value="2" onchange="toggleDrawerSecondRoute()"> Старший на 2 маршрута
            </label>
            <div id="drawerSecondRouteWrap" style="display:none;">
                <label style="font-size:11px;font-weight:bold;">Укажите 2-й маршрут:</label>
                <input type="text" id="drawerSecondRouteInput" class="form-input" placeholder="Например, 18" style="padding:5px;">
            </div>
        `;
        senCheck.closest('.form-group').insertAdjacentElement('afterend', scopeBox);
        senCheck.addEventListener('change', () => {
            scopeBox.style.display = senCheck.checked ? 'block' : 'none';
        });
    }

    // 4. Правое боковое окно «Мастер расстановок» и модалка «Кто на маршруте»
    let wrap = document.createElement('div');
    wrap.innerHTML = `
        <div id="st10MasterOverlay" class="drawer-overlay" onclick="closeSt10MasterDrawer()"></div>
        <div id="st10MasterDrawer">
            <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #0d9488;padding-bottom:10px;margin-bottom:14px;">
                <h3 style="margin:0;font-size:16px;color:#0d9488;">🧭 Мастер расстановок</h3>
                <button onclick="closeSt10MasterDrawer()" style="width:auto;margin:0;padding:2px 8px;background:none;color:#333;font-size:20px;">✕</button>
            </div>
            <div class="form-group">
                <label>1. Выберите маршрут из списка:</label>
                <select id="st10MasterRouteSel" class="form-input"></select>
            </div>
            <div class="form-group">
                <label>2. Выберите станцию (фильтр сотрудников):</label>
                <select id="st10MasterStationSel" class="form-input"></select>
            </div>
            <div style="font-size:12px;color:#555;background:#f4f6f9;padding:10px;border-radius:6px;line-height:1.5;">
                После нажатия «Выбрать» окно закроется, сотрудники отфильтруются по станции, и вы сможете просто нажимать на <b>«+»</b> на любом числе — маршрут сразу встанет в ячейку.
            </div>
            <div style="margin-top:auto;display:flex;flex-direction:column;gap:8px;">
                <button type="button" class="btn-success" onclick="applySt10MasterSelection()">✅ Выбрать и расставлять</button>
                <button type="button" class="btn-secondary" onclick="closeSt10MasterDrawer()">Отмена</button>
            </div>
        </div>

        <!-- МОДАЛКА: КТО ЗАСТУПИЛ НА СОСЕДНИЙ МАРШРУТ ПОЕЗДА -->
        <div id="st10RouteCrewModal" class="modal">
            <div class="modal-content" style="max-width:440px;">
                <h3 id="st10RouteCrewTitle" style="margin-top:0;">Маршрут</h3>
                <div id="st10RouteCrewBody" style="font-size:13px;line-height:1.6;"></div>
                <button class="btn-secondary" style="margin-top:14px;" onclick="closeModal('st10RouteCrewModal')">Закрыть</button>
            </div>
        </div>
    `;
    document.body.appendChild(wrap);
}

function toggleDrawerSecondRoute() {
    let val = document.querySelector('input[name="drawerSenScope"]:checked')?.value || '1';
    let w = document.getElementById('drawerSecondRouteWrap');
    if (w) w.style.display = val === '2' ? 'block' : 'none';
}

// Норма численности маршрута (из поля staffCount или из описания "2 ККЛ")
function getRouteRequiredStaff(routeObj) {
    if (!routeObj) return 2;
    if (routeObj.staffCount && +routeObj.staffCount > 0) return +routeObj.staffCount;
    let m = String(routeObj.desc || '').match(/(\d+)\s*ккл/i);
    if (m) return parseInt(m[1], 10);
    return 2;
}

// ============================================================
// === ОСНОВНЫЕ ПЕРЕОПРЕДЕЛЕНИЯ ЭТАПА 10 ===
// ============================================================
function initStage10Overrides() {
    // --------------------------------------------------------
    // 1. МАРШРУТЫ: УБИРАЕМ 0,3 + СОХРАНЯЕМ ЧИСЛЕННОСТЬ ККЛ
    // --------------------------------------------------------
    const _origOpenRouteModal = window.openRouteModal;
    window.openRouteModal = function(id) {
        if (typeof _origOpenRouteModal === 'function') _origOpenRouteModal(id);
        let ex = (routesDb || []).find(r => r.id === id);
        let scInp = document.getElementById('rtStaffCountInput');
        if (scInp) scInp.value = ex ? getRouteRequiredStaff(ex) : 2;
    };

    window.saveRouteStep = function() {
        let num = document.getElementById('rtNumInput').value.trim();
        if (!num) return alert("Введите № маршрута");
        let staffCount = Math.max(1, parseInt(document.getElementById('rtStaffCountInput')?.value, 10) || 2);

        let rows = Array.from(document.querySelectorAll('#routeRowsBody tr')).map(tr => ({
            train: tr.querySelector('.rt-tr').value.trim(),
            route: tr.querySelector('.rt-way').value.trim(),
            start: tr.querySelector('.rt-st').value.trim(),
            end: tr.querySelector('.rt-en').value.trim(),
            dur: tr.querySelector('.rt-dur').value.trim(),
            cond: tr.querySelector('.rt-cnd').value.trim()
        })).filter(r => r.train || r.route || r.start);

        let wM = 0, bM = 0, lM = 0, nM = 0, tc = 0;
        rows.forEach(r => {
            let s = timeToMin(r.start), e = timeToMin(r.end);
            let d = (s !== null && e !== null) ? (e >= s ? e - s : e + 1440 - s) : 0;
            let lo = (r.route || '').toLowerCase();
            if (lo.includes('разрыв')) bM += d;
            else if (lo.includes('обед')) lM += d;
            else {
                wM += d;
                if (r.train) tc++;
                if (s !== null && e !== null) {
                    for (let m = 0; m < d; m++) {
                        let hm = (s + m) % 1440;
                        if (hm >= 1320 || hm < 360) nM++;
                    }
                }
            }
        });

        // БЕЗ +0,3 — чистое рабочее время!
        let totH = +(wM / 60).toFixed(1);
        let totStr = String(totH).replace('.', ',');
        document.getElementById('rtTotalHoursInput').value = totStr;

        if (appState.routeSaveStep === 1) {
            document.getElementById('routeSummaryBody').innerHTML = `
                <tr class="decade-bold"><td>Итого рабочее время:</td><td>${totStr} ч</td></tr>
                <tr><td>Численность по маршруту:</td><td>${staffCount} ККЛ</td></tr>
                <tr><td>Обед:</td><td>${(lM / 60).toFixed(1).replace('.', ',')} ч</td></tr>
                <tr><td>Разрыв рабочей смены:</td><td>${(bM / 60).toFixed(1).replace('.', ',')} ч</td></tr>
                <tr><td>Работа в ночное время:</td><td>${(nM / 60).toFixed(1).replace('.', ',')} ч</td></tr>
                <tr class="decade-bold"><td>Количество поездов:</td><td>${tc}</td></tr>`;
            document.getElementById('routeSummaryPreview').style.display = 'block';
            document.getElementById('btnSaveRouteModal').innerText = '✅ Подтвердить и сохранить';
            appState.routeSaveStep = 2;
            return;
        }

        let obj = {
            id: appState.editingId || ('rt_' + num.replace(/[^a-zA-Z0-9а-яА-Я]/g, '_')),
            num,
            hours: totStr,
            staffCount,
            startTime: rows[0]?.start || '06:00',
            desc: document.getElementById('rtDescInput').value.trim(),
            rows
        };
        if (db) db.collection('routes').doc(obj.id).set(obj);
        else {
            let i = routesDb.findIndex(x => x.id === obj.id);
            if (i >= 0) routesDb[i] = obj; else routesDb.push(obj);
            renderSettingsTable();
        }
        closeModal('routeModal');
        showSyncToast(`☁️ Маршрут №${num} сохранен (${totStr} ч, ${staffCount} ККЛ)`);
    };

    // --------------------------------------------------------
    // 2. СТАРШИЙ НА 1 ИЛИ 2 МАРШРУТА В БОКОВОЙ ПАНЕЛИ ТАБЕЛЯ
    // --------------------------------------------------------
    const _origOpenDrawer = window.openTabelDrawer;
    window.openTabelDrawer = function(tab, day) {
        if (typeof _origOpenDrawer === 'function') _origOpenDrawer(tab, day);
        let ym = getSelectedMonthKey();
        let ex = cloudTabelByMonth[ym]?.[tab]?.[String(day)] || {};
        let scopeBox = document.getElementById('drawerSeniorScopeBox');
        if (scopeBox) {
            scopeBox.style.display = ex.senior ? 'block' : 'none';
            let sc = ex.seniorScope === '2' ? '2' : '1';
            let rad = document.querySelector(`input[name="drawerSenScope"][value="${sc}"]`);
            if (rad) rad.checked = true;
            let inp2 = document.getElementById('drawerSecondRouteInput');
            if (inp2) inp2.value = ex.seniorSecondRoute || '';
            toggleDrawerSecondRoute();
        }
    };

    window.saveTabelCellFromDrawer = function() {
        let { tab, day, ymKey } = appState.drawerTarget;
        let r = document.getElementById('drawerRouteInput').value.trim();
        let h = document.getElementById('drawerHoursInput').value.trim();
        let s = document.getElementById('drawerSeniorCheck').checked;
        let seniorScope = s ? (document.querySelector('input[name="drawerSenScope"]:checked')?.value || '1') : '1';
        let seniorSecondRoute = (s && seniorScope === '2') ? (document.getElementById('drawerSecondRouteInput')?.value.trim() || '') : '';

        if (!cloudTabelByMonth[ymKey]) cloudTabelByMonth[ymKey] = {};
        if (!cloudTabelByMonth[ymKey][tab]) cloudTabelByMonth[ymKey][tab] = {};
        cloudTabelByMonth[ymKey][tab][String(day)] = r
            ? { route: r, hours: h, senior: s, seniorScope, seniorSecondRoute }
            : null;
        appState.tabelDirty = true;
        renderTabel();
        closeTabelDrawer();
    };

    // --------------------------------------------------------
    // 3. ТАБЕЛЬ: РЕЖИМ «МАСТЕР РАССТАНОВОК» (КЛИК ПО + СРАЗУ СТАВИТ МАРШРУТ)
    // --------------------------------------------------------
    const _origRenderTabel = window.renderTabel;
    window.renderTabel = function() {
        if (typeof _origRenderTabel === 'function') _origRenderTabel();

        // Показываем кнопку «Мастер расстановок» тем, кто может редактировать табель
        let mBtn = document.getElementById('btnTabelMaster');
        if (mBtn) mBtn.style.display = canEditTabel() ? 'inline-block' : 'none';

        // Баннер активного Мастера расстановок над таблицей
        let tbl = document.querySelector('#tabel-screen table.tabel-table');
        if (tbl) {
            let banner = document.getElementById('st10MasterBanner');
            if (!banner) {
                banner = document.createElement('div');
                banner.id = 'st10MasterBanner';
                banner.className = 'st10-master-banner';
                tbl.parentNode.insertBefore(banner, tbl);
            }
            if (st10Master.active) {
                let stLabel = st10Master.station === '__all__' ? 'Все станции' : st10Master.station;
                banner.style.display = 'flex';
                banner.innerHTML = `
                    <div>🧭 <strong>Мастер расстановок:</strong> Маршрут <b>${st10Esc(st10Master.route)}</b> (${st10Esc(st10Master.hours || 'В')}) • Станция: <b>${st10Esc(stLabel)}</b> — нажимайте на <b>«+»</b> для вставки!</div>
                    <div style="display:flex;gap:6px;">
                        <button type="button" class="btn-action" style="width:auto;margin:0;padding:5px 10px;font-size:12px;" onclick="openSt10MasterDrawer()">Сменить маршрут</button>
                        <button type="button" class="btn-secondary" style="width:auto;margin:0;padding:5px 10px;font-size:12px;" onclick="stopSt10MasterMode()">✕ Выйти</button>
                    </div>
                `;
                // Фильтруем отображаемые строки по выбранной станции и перенаправляем клики ячеек на быструю вставку
                applySt10MasterFilterAndClicks();
            } else {
                banner.style.display = 'none';
            }
        }
    };

    // --------------------------------------------------------
    // 4. «МОЯ СМЕНА» СТРОГО ИЗ ТАБЕЛЯ + КРУЖОЧКИ СОСЕДНИХ МАРШРУТОВ
    // --------------------------------------------------------
    window.renderMyShift = renderStage10MyShift;

    // --------------------------------------------------------
    // 5. «РАСКИДАТЬ»: ПРОВЕРКА ЧИСЛЕННОСТИ (2 КОЛОНКИ: ПРЕВЫШЕНИЕ / НЕХВАТКА)
    // --------------------------------------------------------
    window.renderDistributeList = renderStage10DistributeList;
    window.checkSharedRoutesForSenior = checkStage10SharedRoutesForSenior;
    window.saveDistributedRoutes = saveStage10DistributedRoutes;

    if (document.getElementById('tabel-screen')?.classList.contains('active-screen')) window.renderTabel();
    if (document.getElementById('myShift-screen')?.classList.contains('active-screen')) window.renderMyShift();
}

// ============================================================
// === ЛОГИКА «МАСТЕРА РАССТАНОВОК» ===
// ============================================================
function openSt10MasterDrawer() {
    let rSel = document.getElementById('st10MasterRouteSel');
    rSel.innerHTML = (routesDb || []).map(r => {
        let norm = r.num === 'В' ? 'Выходной' : `${r.hours || '—'} ч · ${getRouteRequiredStaff(r)} ККЛ`;
        return `<option value="${st10Esc(r.num)}" ${st10Master.route === r.num ? 'selected' : ''}>Маршрут ${st10Esc(r.num)} (${norm})</option>`;
    }).join('');

    let stSet = new Set();
    (appState.workers || []).forEach(w => { if (w.station) stSet.add(w.station.trim()); });
    (stationsDb || []).forEach(s => { if (s.name) stSet.add(s.name.trim()); });
    let stList = Array.from(stSet).sort((a, b) => a.localeCompare(b, 'ru'));

    let sSel = document.getElementById('st10MasterStationSel');
    sSel.innerHTML = `<option value="__all__">Все станции</option>` +
        stList.map(st => `<option value="${st10Esc(st)}" ${st10Master.station === st ? 'selected' : ''}>${st10Esc(st)}</option>`).join('');

    document.getElementById('st10MasterOverlay').classList.add('active');
    document.getElementById('st10MasterDrawer').classList.add('open');
}

function closeSt10MasterDrawer() {
    document.getElementById('st10MasterOverlay').classList.remove('active');
    document.getElementById('st10MasterDrawer').classList.remove('open');
}

function applySt10MasterSelection() {
    let rNum = document.getElementById('st10MasterRouteSel').value;
    let st = document.getElementById('st10MasterStationSel').value;
    let rObj = (routesDb || []).find(r => r.num === rNum);
    st10Master = {
        active: true,
        route: rNum,
        hours: rObj ? (rObj.hours || '') : '',
        station: st
    };
    closeSt10MasterDrawer();
    renderTabel();
}

function stopSt10MasterMode() {
    st10Master.active = false;
    renderTabel();
}

function applySt10MasterFilterAndClicks() {
    let tb = document.getElementById('tabelBody');
    if (!tb) return;
    let rows = Array.from(tb.querySelectorAll('tr'));
    for (let i = 0; i < rows.length; i++) {
        let tr = rows[i];
        if (tr.classList.contains('tabel-sector-header-row')) continue;
        // Пара строк сотрудника (rowspan=2 в первой строке)
        let firstTd = tr.children[0];
        if (firstTd && firstTd.getAttribute('rowspan') === '2') {
            let tab = tr.children[1]?.innerText.trim();
            let w = (appState.workers || []).find(x => x.tab === tab);
            let nextTr = rows[i + 1];
            let matchStation = (st10Master.station === '__all__') || (w && (w.station || '').trim().toLowerCase() === st10Master.station.toLowerCase());
            tr.style.display = matchStation ? '' : 'none';
            if (nextTr) nextTr.style.display = matchStation ? '' : 'none';

            if (matchStation) {
                [tr, nextTr].forEach(rowEl => {
                    if (!rowEl) return;
                    rowEl.querySelectorAll('td.tabel-cell-day:not(.cell-locked)').forEach(td => {
                        let oc = td.getAttribute('onclick') || '';
                        let m = oc.match(/openTabelDrawer\('([^']+)',\s*(\d+)\)/);
                        if (m) {
                            let wTab = m[1], dayNum = parseInt(m[2], 10);
                            td.setAttribute('onclick', `stampSt10MasterCell('${wTab}', ${dayNum})`);
                        }
                    });
                });
            }
            i++; // пропускаем вторую строку пары
        }
    }
}

function stampSt10MasterCell(tab, day) {
    let ym = getSelectedMonthKey();
    if (!cloudTabelByMonth[ym]) cloudTabelByMonth[ym] = {};
    if (!cloudTabelByMonth[ym][tab]) cloudTabelByMonth[ym][tab] = {};
    let cur = cloudTabelByMonth[ym][tab][String(day)];

    if (cur && cur.route === st10Master.route) {
        cloudTabelByMonth[ym][tab][String(day)] = null; // повторный клик очищает
    } else {
        cloudTabelByMonth[ym][tab][String(day)] = {
            route: st10Master.route,
            hours: st10Master.hours,
            senior: false,
            seniorScope: '1',
            seniorSecondRoute: ''
        };
    }
    appState.tabelDirty = true;
    renderTabel();
}

// ============================================================
// === «МОЯ СМЕНА» СТРОГО ИЗ ТАБЕЛЯ + КРУЖОЧКИ МАРШРУТОВ    ===
// ============================================================
function getOtherActiveRoutesForTrain(trainNum, myRouteNum, ymToday, dToday) {
    let result = [];
    (routesDb || []).forEach(rt => {
        if (!rt.num || rt.num === myRouteNum || rt.num === 'В') return;
        let hasTrain = (rt.rows || []).some(r => String(r.train || '').trim() === String(trainNum).trim());
        if (!hasTrain) return;

        // Проверяем: заступил ли КТО-НИБУДЬ на этот маршрут сегодня в Табеле?
        let assignedToday = (appState.workers || []).filter(w => {
            let cell = cloudTabelByMonth[ymToday]?.[w.tab]?.[dToday];
            return cell && cell.route === rt.num;
        });
        if (assignedToday.length > 0) {
            result.push({ routeNum: rt.num, workers: assignedToday });
        }
    });
    return result;
}

function openSt10RouteCrewModal(routeNum) {
    let now = new Date();
    let ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    let d = String(now.getDate());
    let assigned = (appState.workers || []).filter(w => cloudTabelByMonth[ym]?.[w.tab]?.[d]?.route === routeNum);
    let senior = assigned.find(w => cloudTabelByMonth[ym]?.[w.tab]?.[d]?.senior);
    let senCell = senior ? cloudTabelByMonth[ym]?.[senior.tab]?.[d] : null;
    let senNote = senCell?.seniorScope === '2'
        ? ` (старший на 2 маршрута${senCell.seniorSecondRoute ? ': ' + routeNum + ' и ' + senCell.seniorSecondRoute : ''})`
        : ' (старший на 1 маршрут)';

    document.getElementById('st10RouteCrewTitle').innerText = `🚆 Маршрут № ${routeNum} — сегодня`;
    document.getElementById('st10RouteCrewBody').innerHTML = `
        <div style="background:#fff8e1;border:1px solid #ffe082;padding:8px 10px;border-radius:6px;margin-bottom:10px;">
            <strong>⭐ Старший:</strong> ${senior ? st10Esc(senior.fio) + st10Esc(senNote) : 'Не назначен'}
        </div>
        <div><strong>Заступили на маршрут (${assigned.length}):</strong></div>
        <ul style="margin:6px 0 0;padding-left:18px;">
            ${assigned.map(w => `<li>${st10Esc(w.fio)} <small style="color:#666;">(Таб. ${st10Esc(w.tab)} • ${st10Esc(w.station || w.sector || '')})</small></li>`).join('') || '<li>Никто не заступил</li>'}
        </ul>
    `;
    openModal('st10RouteCrewModal');
}

function renderStage10MyShift() {
    let scr = document.getElementById('myShift-screen');
    if (!scr) return;

    let now = new Date();
    let tom = new Date(); tom.setDate(now.getDate() + 1);
    let myTab = appState.user?.tab || '8065';
    let ymToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    let dToday = String(now.getDate());
    let ymTom = `${tom.getFullYear()}-${String(tom.getMonth() + 1).padStart(2, '0')}`;
    let dTom = String(tom.getDate());

    // Строго из Табеля (без «левых» значений)
    let todayCell = cloudTabelByMonth[ymToday]?.[myTab]?.[dToday] || null;
    let tomCell = cloudTabelByMonth[ymTom]?.[myTab]?.[dTom] || null;

    let todayRouteNum = todayCell?.route || '';
    let tomRouteNum = tomCell?.route || '';

    let todayRouteObj = todayRouteNum && todayRouteNum !== 'В' ? (routesDb || []).find(r => r.num === todayRouteNum) : null;
    let tomRouteObj = tomRouteNum && tomRouteNum !== 'В' ? (routesDb || []).find(r => r.num === tomRouteNum) : null;

    let todayTrainRows = (todayRouteObj?.rows || []).filter(r => r.train);
    let todayDateTxt = `Сегодня, ${dayNamesRu[now.getDay()]} ${now.getDate()} ${monthNamesGen[now.getMonth()]}`;
    let tomDateTxt = `Завтра, ${dayNamesRu[tom.getDay()]} ${tom.getDate()} ${monthNamesGen[tom.getMonth()]}`;

    // === КОМПАКТНЫЙ ВИД КАК НА ФОТО 1 (если сегодня Выходной или маршрут без поездов, например 101 / ТЗ) ===
    if (todayTrainRows.length === 0) {
        let todayTitle = (!todayRouteNum || todayRouteNum === 'В') ? 'Выходной' : todayRouteNum;
        let todayHoursTxt = (todayCell?.hours || todayRouteObj?.hours) ? `${todayCell?.hours || todayRouteObj?.hours} ч` : '';
        let tomTitle = (!tomRouteNum || tomRouteNum === 'В') ? 'Выходной' : tomRouteNum;
        let tomHoursTxt = (tomCell?.hours || tomRouteObj?.hours) ? `${tomCell?.hours || tomRouteObj?.hours} ч` : '';

        scr.innerHTML = `
            <div class="ms-compact-card">
                <div class="ms-date-sub">${st10Esc(todayDateTxt)}</div>
                <div class="ms-compact-row">
                    <div class="ms-compact-val">${st10Esc(todayTitle)}</div>
                    <div style="font-size:14px;color:#cbd5e1;">${st10Esc(todayHoursTxt)}</div>
                </div>
                <hr class="ms-compact-hr">
                <div class="ms-date-sub">${st10Esc(tomDateTxt)}</div>
                <div class="ms-compact-row">
                    <div class="ms-compact-val">${st10Esc(tomTitle)}</div>
                    <div style="font-size:14px;color:#cbd5e1;">${st10Esc(tomHoursTxt)}</div>
                </div>
                <span class="ms-compact-link" id="msToggleCalBtn" onclick="toggleMyShiftCal()">${appState.msCalVisible ? 'Скрыть график ⌄' : 'Мой график на месяц ›'}</span>
                <div id="msCalWrap" style="display:${appState.msCalVisible ? 'block' : 'none'};margin-top:16px;padding-top:14px;border-top:1px solid #1f2937;">
                    <div class="ms-cal-header">
                        <button class="ms-hide-btn" onclick="shiftMyCalMonth(-1)">‹</button>
                        <strong id="msCalMonthTitle" style="color:#fff;"></strong>
                        <button class="ms-hide-btn" onclick="shiftMyCalMonth(1)">›</button>
                    </div>
                    <div id="msCalStats" style="font-size:12px;color:#94a3b8;margin-bottom:10px;"></div>
                    <div class="ms-cal-grid" id="msCalGrid"></div>
                </div>
            </div>
        `;
        renderMyShiftCalendar();
        return;
    }

    // === ПОЛНЫЙ ВИД С ПОЕЗДАМИ И КРУЖОЧКАМИ СОСЕДНИХ МАРШРУТОВ ===
    let firstT = todayTrainRows[0]?.start || '';
    let lastT = todayTrainRows[todayTrainRows.length - 1]?.end || '';
    let todayHours = todayCell?.hours || todayRouteObj?.hours || '';
    let curMin = now.getHours() * 60 + now.getMinutes();
    let doneCount = 0;
    let timelineHtml = '';

    todayTrainRows.forEach((r, idx) => {
        let sM = timeToMin(r.start) ?? 0, eM = timeToMin(r.end) ?? 0;
        let isDone = curMin >= eM;
        if (isDone) doneCount++;
        if (appState.msHideDone && isDone) return;

        let durM = eM >= sM ? eM - sM : eM + 1440 - sM;
        let trObj = (trainsDb || []).find(t => t.num === r.train);
        let stops = trObj?.stops || [];
        let stopsHtml = stops.map(st => `<div style="display:flex;justify-content:space-between;padding:2px 0;"><span>${st10Esc(st.name)}</span><span>${st10Esc(st.time)}</span></div>`).join('') || '<div>Остановки не заданы в Настройках → Поезда</div>';
        let occExists = !!cloudOccupancy[getOccDocId(r.train)];

        // Ищем другие маршруты с этим же номером поезда, на которые СЕГОДНЯ заступили люди
        let activePeersRoutes = getOtherActiveRoutesForTrain(r.train, todayRouteNum, ymToday, dToday);
        let sharedCirclesHtml = activePeersRoutes.length > 0
            ? `<div class="ms-shared-routes"><span>Также на маршруте:</span> ${activePeersRoutes.map(pr => `<button type="button" class="ms-route-circle-btn" onclick="openSt10RouteCrewModal('${st10Esc(pr.routeNum)}')" title="Нажмите, чтобы увидеть кто заступил">${st10Esc(pr.routeNum)}</button>`).join(' ')}</div>`
            : '';

        timelineHtml += `
            <div class="ms-train-card ${isDone ? 'done' : ''}">
                <div class="ms-train-top">
                    <div class="ms-train-num">${st10Esc(r.train)} <span class="ms-green-dot"></span></div>
                    <div class="ms-status-txt">${isDone ? 'завершён' : 'ожидается'}</div>
                </div>
                <div class="ms-route-sub">${st10Esc(r.route)}</div>
                <div class="ms-times">${st10Esc(r.start)} → ${st10Esc(r.end)} <span>· ${formatDurMin(durM)} в пути</span></div>
                ${sharedCirclesHtml}
                ${occExists ? '<div class="ms-colleague-ok">✓ внесено коллегой</div>' : ''}
                <div class="ms-btn-row">
                    <button class="ms-act-btn" onclick="openOccupancyForTrain('${st10Esc(r.train)}')">Исправить</button>
                    <button class="ms-act-btn" onclick="sidebarNav('inspections')">Осмотр</button>
                    <button class="ms-act-btn" onclick="sidebarNav('raports')">Рапорт</button>
                </div>
                <span class="ms-stops-toggle" onclick="toggleMsStops('msStops_${idx}')">Остановки (${stops.length})</span>
                <div class="ms-stops-list" id="msStops_${idx}">${stopsHtml}</div>
            </div>
        `;

        if (idx < todayTrainRows.length - 1) {
            let nextS = timeToMin(todayTrainRows[idx + 1].start);
            if (nextS !== null && eM !== null && nextS > eM) {
                timelineHtml += `<div class="ms-break-line">перерыв ${formatDurMin(nextS - eM)}</div>`;
            }
        }
    });

    // Старший и коллеги на моем маршруте сегодня
    let peers = (appState.workers || []).filter(w => cloudTabelByMonth[ymToday]?.[w.tab]?.[dToday]?.route === todayRouteNum);
    let senior = peers.find(w => cloudTabelByMonth[ymToday]?.[w.tab]?.[dToday]?.senior);
    let senCell = senior ? cloudTabelByMonth[ymToday]?.[senior.tab]?.[dToday] : null;
    let senLabel = senior
        ? `${senior.fio}${senCell?.seniorScope === '2' ? ` (на 2 маршрута${senCell.seniorSecondRoute ? ': ' + todayRouteNum + ' и ' + senCell.seniorSecondRoute : ''})` : ''}`
        : 'Не назначен';

    // Блок ЗАВТРА строго из Табеля
    let tomRows = (tomRouteObj?.rows || []).filter(r => r.train);
    let tomPeers = (tomRouteNum && tomRouteNum !== 'В')
        ? (appState.workers || []).filter(w => cloudTabelByMonth[ymTom]?.[w.tab]?.[dTom]?.route === tomRouteNum)
        : [];
    let tomSen = tomPeers.find(w => cloudTabelByMonth[ymTom]?.[w.tab]?.[dTom]?.senior);
    let tomTitle = (!tomRouteNum || tomRouteNum === 'В') ? 'Выходной' : `Маршрут ${tomRouteNum}`;
    let tomTimeRight = (!tomRouteNum || tomRouteNum === 'В')
        ? ''
        : `${tomCell?.hours || tomRouteObj?.hours || ''} ч${tomRows.length ? ` · ${tomRows[0].start}–${tomRows[tomRows.length - 1].end}` : ''}`;

    scr.innerHTML = `
        <div class="ms-wrapper">
            <div class="ms-header-top">
                <div>
                    <div class="ms-date-sub">${st10Esc(todayDateTxt)}</div>
                    <div class="ms-route-title">Маршрут ${st10Esc(todayRouteNum)}</div>
                </div>
                <div class="ms-time-right">${st10Esc(todayHours)} ч · ${st10Esc(firstT)}–${st10Esc(lastT)}</div>
            </div>
            <div style="font-size:12px;color:#94a3b8;">По маршруту ${st10Esc(todayHours)} ч · Численность: ${getRouteRequiredStaff(todayRouteObj)} ККЛ.</div>
            <div class="ms-badges-row">
                <span class="ms-badge-amber">Маршруты: из Табеля</span>
                <span id="msYandexSyncBadge" class="ms-badge-green" style="cursor:pointer;" onclick="verifyTrainsSchedule()">● Сверено с расписанием</span>
            </div>
            <div class="ms-bar-row">
                <span>Завершено ${doneCount} из ${todayTrainRows.length}</span>
                <button class="ms-hide-btn" onclick="toggleHideDoneTrains()">${appState.msHideDone ? 'Показать завершённые' : 'Скрыть завершённые'}</button>
            </div>
            <div class="ms-timeline">${timelineHtml || '<div style="color:#64748b;padding:10px;">Все поезда скрыты</div>'}</div>
            <div class="ms-crew-box">
                <strong>Старший:</strong> ${st10Esc(senLabel)}<br>
                Со мной на маршруте: ${st10Esc(peers.map(w => w.fio).join(', ') || (appState.user?.fio || '—'))}
            </div>
            <div class="ms-tomorrow-box">
                <div class="ms-header-top">
                    <div>
                        <div class="ms-date-sub">${st10Esc(tomDateTxt)}</div>
                        <div style="font-size:20px;font-weight:bold;color:#fff;">${st10Esc(tomTitle)}</div>
                    </div>
                    <div class="ms-time-right">${st10Esc(tomTimeRight)}</div>
                </div>
                ${tomRows.length ? `<div style="font-size:12px;color:#94a3b8;margin-bottom:6px;">Первый поезд ${st10Esc(tomRows[0].train)} в ${st10Esc(tomRows[0].start)}.</div>` : ''}
                ${tomPeers.length ? `<div style="font-size:13px;color:#cbd5e1;"><strong>Старший:</strong> ${st10Esc(tomSen ? tomSen.fio : 'Не назначен')}<br>Со мной на маршруте: ${st10Esc(tomPeers.map(w => w.fio).join(', '))}</div>` : ''}
            </div>
            <div class="ms-cal-section">
                <div style="text-align:center;margin-bottom:10px;">
                    <span id="msToggleCalBtn" style="color:#60a5fa;cursor:pointer;font-weight:bold;" onclick="toggleMyShiftCal()">${appState.msCalVisible ? 'Скрыть график' : 'Мой график на месяц ›'}</span>
                </div>
                <div id="msCalWrap" style="display:${appState.msCalVisible ? 'block' : 'none'};">
                    <div class="ms-cal-header">
                        <button class="ms-hide-btn" onclick="shiftMyCalMonth(-1)">‹</button>
                        <strong id="msCalMonthTitle" style="color:#fff;"></strong>
                        <button class="ms-hide-btn" onclick="shiftMyCalMonth(1)">›</button>
                    </div>
                    <div id="msCalStats" style="font-size:12px;color:#94a3b8;margin-bottom:10px;"></div>
                    <div class="ms-cal-grid" id="msCalGrid"></div>
                </div>
            </div>
        </div>
    `;
    renderMyShiftCalendar();
}

// ============================================================
// === «РАСКИДАТЬ»: КОНТРОЛЬ ЧИСЛЕННОСТИ (2 КОЛОНКИ) + СТАРШИЙ ===
// ============================================================
function renderStage10DistributeList() {
    let { dObj, ymKey, day } = getDistTargetDate();
    let opts = `<option value="">— Выходной —</option>` + (routesDb || []).map(r => `<option value="${st10Esc(r.num)}">Маршрут ${st10Esc(r.num)} (${r.num === 'В' ? 'В' : getRouteRequiredStaff(r) + ' ККЛ'})</option>`).join('');

    let workersForDist = (appState.workers || []).filter(w => {
        if (!isDateAllowedForWorker(w, dObj.getFullYear(), dObj.getMonth(), dObj.getDate())) return false;
        if (typeof st8SelectedSector !== 'undefined' && st8SelectedSector && st8SelectedSector !== '__grouped__') {
            return getWorkerSectorName(w) === st8SelectedSector;
        }
        return true;
    });

    // Добавляем контейнер контроля численности над списком сотрудников
    let listBox = document.getElementById('distWorkersList');
    let balBox = document.getElementById('st10DistBalanceBox');
    if (!balBox && listBox) {
        balBox = document.createElement('div');
        balBox.id = 'st10DistBalanceBox';
        listBox.parentNode.insertBefore(balBox, listBox);
    }

    listBox.innerHTML = workersForDist.length
        ? workersForDist.map(w => {
            let cur = cloudTabelByMonth[ymKey]?.[w.tab]?.[day]?.route || '';
            return `<div class="dist-row">
                <div style="flex:1.5;"><strong>${st10Esc(w.fio)}</strong><br><small style="color:#666;">${st10Esc(w.station || w.sector || 'Клин')}</small></div>
                <select class="form-input dist-route-sel" data-tab="${st10Esc(w.tab)}" style="flex:1;margin:0;" onchange="checkSharedRoutesForSenior()">
                    ${opts.replace(`value="${st10Esc(cur)}"`, `value="${st10Esc(cur)}" selected`)}
                </select>
            </div>`;
        }).join('')
        : '<div style="padding:12px;text-align:center;color:#666;">Нет доступных сотрудников</div>';

    checkStage10SharedRoutesForSenior();
}

function checkStage10SharedRoutesForSenior() {
    let { ymKey, day } = getDistTargetDate();
    let groups = {};
    document.querySelectorAll('.dist-route-sel').forEach(s => {
        if (s.value && s.value !== 'В') {
            (groups[s.value] = groups[s.value] || []).push(s.dataset.tab);
        }
    });

    // 1. Проверка численности (слева — превышение, справа — нехватка)
    let overList = [];
    let underList = [];
    (routesDb || []).filter(r => r.num && r.num !== 'В').forEach(r => {
        let norm = getRouteRequiredStaff(r);
        let tabs = groups[r.num] || [];
        if (tabs.length > norm) {
            overList.push({ route: r.num, norm, fact: tabs.length, tabs });
        } else if (tabs.length < norm) {
            underList.push({ route: r.num, norm, fact: tabs.length, missing: norm - tabs.length });
        }
    });

    let balBox = document.getElementById('st10DistBalanceBox');
    if (balBox) {
        if (overList.length === 0 && underList.length === 0) {
            balBox.innerHTML = `<div class="st10-bal-ok">✅ Численность по всем маршрутам полностью совпадает с нормой!</div>`;
        } else {
            let leftHtml = overList.length
                ? overList.map(o => `
                    <div style="margin-bottom:8px;padding-bottom:6px;border-bottom:1px dashed #fda4af;">
                        <strong style="color:#be123c;">Маршрут ${st10Esc(o.route)}</strong>: по факту <b>${o.fact}</b> (норма ${o.norm} ККЛ)
                        <ul style="margin:4px 0 0;padding-left:16px;">
                            ${o.tabs.map(t => `<li>${st10Esc(appState.workers.find(x => x.tab === t)?.fio || t)}</li>`).join('')}
                        </ul>
                    </div>
                `).join('')
                : '<div style="color:#16a34a;">Превышений нет</div>';

            let rightHtml = underList.length
                ? underList.map(u => `
                    <div style="margin-bottom:6px;padding-bottom:4px;border-bottom:1px dashed #fcd34d;">
                        <strong style="color:#92400e;">Маршрут ${st10Esc(u.route)}</strong>: ${u.fact} из ${u.norm} ККЛ <span style="color:#b45309;">(не хватает ${u.missing})</span>
                    </div>
                `).join('')
                : '<div style="color:#16a34a;">Все маршруты укомплектованы</div>';

            balBox.innerHTML = `
                <div class="st10-balance-grid">
                    <div class="st10-bal-col st10-bal-over">
                        <div style="font-weight:bold;color:#9f1239;margin-bottom:6px;">🔴 Превышение численности</div>
                        ${leftHtml}
                    </div>
                    <div class="st10-bal-col st10-bal-under">
                        <div style="font-weight:bold;color:#92400e;margin-bottom:6px;">🟡 Не хватает сотрудников</div>
                        ${rightHtml}
                    </div>
                </div>
            `;
        }
    }

    // 2. Блок выбора старшего (с вопросом: на 1 маршрут или на 2 маршрута)
    let senHtml = Object.keys(groups).filter(r => groups[r].length >= 1).map(r => {
        let exSenTab = groups[r].find(t => cloudTabelByMonth[ymKey]?.[t]?.[day]?.senior) || groups[r][0];
        let exCell = cloudTabelByMonth[ymKey]?.[exSenTab]?.[day] || {};
        let exScope = exCell.seniorScope === '2' ? '2' : '1';
        return `
            <div style="display:flex;gap:6px;margin-bottom:8px;align-items:center;flex-wrap:wrap;border-bottom:1px dashed #e6d39a;padding-bottom:6px;">
                <strong style="min-width:90px;">Маршрут ${st10Esc(r)}:</strong>
                <select class="form-input dist-senior-sel" data-route="${st10Esc(r)}" style="flex:1;min-width:150px;margin:0;">
                    ${groups[r].map(t => `<option value="${st10Esc(t)}" ${t === exSenTab ? 'selected' : ''}>${st10Esc(appState.workers.find(x => x.tab === t)?.fio || t)}</option>`).join('')}
                </select>
                <select class="form-input dist-senior-scope" data-route="${st10Esc(r)}" style="width:155px;margin:0;">
                    <option value="1" ${exScope === '1' ? 'selected' : ''}>На 1 маршрут</option>
                    <option value="2" ${exScope === '2' ? 'selected' : ''}>На 2 маршрута</option>
                </select>
            </div>
        `;
    }).join('');

    document.getElementById('distSeniorList').innerHTML = senHtml;
    document.getElementById('distSeniorBox').style.display = senHtml ? 'block' : 'none';
}

function saveStage10DistributedRoutes() {
    let { ymKey, day } = getDistTargetDate();
    if (!cloudTabelByMonth[ymKey]) cloudTabelByMonth[ymKey] = {};

    let senMap = {}, scopeMap = {};
    document.querySelectorAll('.dist-senior-sel').forEach(s => { senMap[s.dataset.route] = s.value; });
    document.querySelectorAll('.dist-senior-scope').forEach(s => { scopeMap[s.dataset.route] = s.value; });

    document.querySelectorAll('.dist-route-sel').forEach(s => {
        let t = s.dataset.tab, r = s.value;
        let ro = (routesDb || []).find(x => x.num === r);
        if (!cloudTabelByMonth[ymKey][t]) cloudTabelByMonth[ymKey][t] = {};
        let isSen = r && r !== 'В' && senMap[r] === t;
        cloudTabelByMonth[ymKey][t][day] = r
            ? { route: r, hours: ro?.hours || '', senior: isSen, seniorScope: isSen ? (scopeMap[r] || '1') : '1', seniorSecondRoute: '' }
            : { route: 'В', hours: '', senior: false, seniorScope: '1', seniorSecondRoute: '' };
    });

    appState.tabelDirty = true;
    renderTabel();
    closeModal('distributeRoutesModal');
    showSyncToast("🔀 Расстановка применена. Нажмите красную кнопку для сохранения!");
}
