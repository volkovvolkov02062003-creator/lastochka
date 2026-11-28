// ============================================================
// === STAGE 20: КНОПКА «ОТЧЕТ ЗА 10/20/30 ДНЕЙ ФДУ»        ===
// === И БЛАНК «СТАТИСТИКА ДЕКАДА/ЗЕБРА» (ЛИСТ 1)           ===
// ============================================================
(function initStage20ZebraStats() {
    let zebraState = {
        year: new Date().getFullYear(),
        month: new Date().getMonth(), // 0..11
        fio: '',
        rows: {} // key: day (1..31) -> { mkassa, shiftNum, money, fee, benefits }
    };

    const RU_MONTHS = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];

    function st20Esc(str) {
        return String(str ?? '').replace(/[&<>"']/g, m => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[m]));
    }

    function toNum(v) {
        const n = parseFloat(String(v ?? '').replace(',', '.').replace(/\s+/g, ''));
        return isNaN(n) ? 0 : n;
    }

    function fmtNum(n) {
        return Number(n || 0).toFixed(2).replace(/\.00$/, '');
    }

    function pad2(n) {
        return String(n).padStart(2, '0');
    }

    function getYmKey(y, m) {
        return `${y}-${pad2(m + 1)}`;
    }

    // ========================================================
    // СТИЛИ БЛАНКА «ДЕКАДА/ЗЕБРА»
    // ========================================================
    function injectSt20Styles() {
        if (document.getElementById('st20-styles')) return;
        const st = document.createElement('style');
        st.id = 'st20-styles';
        st.innerHTML = `
            .st20-zebra-btn {
                background: linear-gradient(135deg, #1e293b, #334155) !important;
                color: #ffffff !important;
                border: 1px solid #475569 !important;
            }
            .st20-toolbar {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
                align-items: center;
                justify-content: space-between;
                background: #f1f5f9;
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                padding: 8px 10px;
                margin-bottom: 10px;
            }
            .st20-toolbar select, .st20-toolbar input {
                padding: 6px 8px;
                border: 1px solid #94a3b8;
                border-radius: 6px;
                font-size: 13px;
                background: #fff;
                color: #111;
            }
            .st20-sheet-wrap {
                overflow-x: auto;
                max-height: 64vh;
                border: 1px solid #94a3b8;
                border-radius: 6px;
                background: #fff;
                padding: 8px;
            }
            .st20-decade-layout {
                display: flex;
                gap: 10px;
                align-items: stretch;
                margin-bottom: 14px;
            }
            .st20-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 12px;
                min-width: 680px;
                background: #fff;
            }
            .st20-table th, .st20-table td {
                border: 1px solid #334155;
                padding: 3px 5px;
                text-align: center;
                vertical-align: middle;
                color: #111;
            }
            .st20-table th {
                background: #e2e8f0;
                font-weight: bold;
                font-size: 11px;
                line-height: 1.25;
            }
            .st20-table tbody tr:nth-child(even) {
                background: #f8fafc;
            }
            .st20-table input.st20-cell {
                width: 100%;
                min-width: 58px;
                border: none;
                background: transparent;
                text-align: center;
                font-size: 12px;
                padding: 3px 2px;
                color: #111;
                box-sizing: border-box;
                outline: none;
            }
            .st20-table input.st20-cell:focus {
                background: #fffbeb;
            }
            .st20-total-row td {
                background: #dbeafe !important;
                font-weight: bold;
                color: #003366;
            }
            .st20-month-row td {
                background: #bbf7d0 !important;
                font-weight: bold;
                font-size: 13px;
                color: #14532d;
            }
            .st20-fio-vert {
                writing-mode: vertical-rl;
                transform: rotate(180deg);
                white-space: nowrap;
                font-weight: bold;
                font-size: 12px;
                background: #f8fafc !important;
                min-width: 28px;
                max-width: 32px;
                padding: 6px 2px !important;
                color: #0f172a;
            }
            .st20-left-summary {
                min-width: 235px;
                border-collapse: collapse;
                font-size: 12px;
                background: #fff;
                align-self: stretch;
            }
            .st20-left-summary td {
                border: 1px solid #334155;
                padding: 6px 8px;
                text-align: center;
                color: #111;
            }
            .st20-left-summary td.lbl {
                background: #f1f5f9;
                font-weight: bold;
                text-align: left;
                white-space: nowrap;
            }
            .st20-left-summary td.val {
                font-weight: bold;
                color: #003366;
                min-width: 54px;
            }
        `;
        document.head.appendChild(st);
    }

    // ========================================================
    // 1. ОБНОВЛЕНИЕ КНОПКИ «ОТЧЕТ ЗА 10/20/30 ДНЕЙ ФДУ»
    //    И ДОБАВЛЕНИЕ КНОПКИ «СТАТИСТИКА ДЕКАДА/ЗЕБРА»
    // ========================================================
    function patchDecadeButtons() {
        const buttons = Array.from(document.querySelectorAll('button'));
        buttons.forEach(btn => {
            if (btn.id === 'btnSt20ZebraStats') return;
            const oc = btn.getAttribute('onclick') || '';
            const txt = (btn.innerText || btn.textContent || '').trim();

            const isDecadeBtn = oc.includes('openDecadeStatsModal') ||
                (/отчет\s+за\s*10\s*\/\s*20\s*\/\s*30/i.test(txt));

            if (!isDecadeBtn) return;

            // Дописываем «ФДУ» в текст кнопки, если ещё не дописано
            if (!/фду/i.test(txt)) {
                btn.innerText = txt.replace(/\s*$/, '') + ' ФДУ';
            }

            // Добавляем кнопку «Статистика Декада/Зебра» сразу после неё
            const parent = btn.parentElement;
            if (parent && !parent.querySelector('.st20-zebra-btn')) {
                const zBtn = document.createElement('button');
                zBtn.type = 'button';
                zBtn.className = (btn.className || 'btn-action') + ' st20-zebra-btn';
                zBtn.style.cssText = btn.style.cssText;
                zBtn.innerText = '🦓 Статистика Декада/Зебра';
                zBtn.onclick = () => window.openSt20ZebraModal();
                btn.insertAdjacentElement('afterend', zBtn);
            }
        });
    }

    // ========================================================
    // 2. ЗАГРУЗКА / СОХРАНЕНИЕ ДАННЫХ БЛАНКА
    // ========================================================
    function getStorageKey(y, m) {
        const tab = appState?.user?.tab || 'guest';
        return `kkl_zebra_stats_${tab}_${getYmKey(y, m)}`;
    }

    function buildRowsFromShiftHistory(y, m) {
        const ym = getYmKey(y, m);
        const map = {};
        const hist = Array.isArray(appState?.shiftHistory) ? appState.shiftHistory : [];
        hist.forEach(s => {
            if (!s.date || !String(s.date).startsWith(ym)) return;
            const day = parseInt(String(s.date).split('-')[2], 10);
            if (!day) return;
            const b = s.benefits || {};
            const benSum = ['rzd', 'fed', 'reg', 'stud', 'vohr']
                .reduce((acc, k) => acc + toNum(b[k]?.sum), 0);
            map[day] = {
                mkassa: s.mkassa || '',
                shiftNum: s.shiftNum || '',
                money: s.tariff ? fmtNum(s.tariff) : '',
                fee: s.fee ? fmtNum(s.fee) : '',
                benefits: benSum ? fmtNum(benSum) : ''
            };
        });
        return map;
    }

    async function loadZebraData(y, m) {
        zebraState.year = y;
        zebraState.month = m;
        zebraState.fio = appState?.user?.fio || '';

        // Базово подтягиваем данные из истории смен
        let merged = buildRowsFromShiftHistory(y, m);

        // Локально сохранённый бланк
        try {
            const localSaved = JSON.parse(localStorage.getItem(getStorageKey(y, m)) || 'null');
            if (localSaved && localSaved.rows) {
                if (localSaved.fio) zebraState.fio = localSaved.fio;
                Object.keys(localSaved.rows).forEach(d => {
                    merged[d] = { ...(merged[d] || {}), ...localSaved.rows[d] };
                });
            }
        } catch (e) {}

        // Облако Firebase
        const tab = appState?.user?.tab;
        if (typeof db !== 'undefined' && db && tab) {
            try {
                const doc = await db.collection('zebra_stats').doc(`${tab}_${getYmKey(y, m)}`).get();
                if (doc.exists) {
                    const data = doc.data();
                    if (data.fio) zebraState.fio = data.fio;
                    if (data.rows) {
                        Object.keys(data.rows).forEach(d => {
                            merged[d] = { ...(merged[d] || {}), ...data.rows[d] };
                        });
                    }
                }
            } catch (e) {}
        }

        zebraState.rows = merged;
        renderZebraSheet();
    }

    window.saveSt20ZebraData = function(silent) {
        const y = zebraState.year;
        const m = zebraState.month;
        const fioInp = document.getElementById('st20FioInput');
        if (fioInp) zebraState.fio = fioInp.value.trim();

        const payload = {
            tab: appState?.user?.tab || 'guest',
            ym: getYmKey(y, m),
            fio: zebraState.fio,
            rows: zebraState.rows,
            ts: Date.now()
        };

        try {
            localStorage.setItem(getStorageKey(y, m), JSON.stringify(payload));
        } catch (e) {}

        if (typeof db !== 'undefined' && db && appState?.user?.tab) {
            db.collection('zebra_stats').doc(`${appState.user.tab}_${getYmKey(y, m)}`).set(payload, { merge: true }).catch(() => {});
        }

        if (!silent && typeof showSyncToast === 'function') {
            showSyncToast('☁️ Статистика Декада/Зебра сохранена');
        }
    };

    // ========================================================
    // 3. ОТРИСОВКА БЛАНКА «ЛИСТ 1» И ЖИВОЙ ПЕРЕСЧЁТ ФОРМУЛ
    // ========================================================
    function calcDecadeSums(fromDay, toDay) {
        let money = 0, fee = 0, benefits = 0;
        for (let d = fromDay; d <= toDay; d++) {
            const r = zebraState.rows[d] || {};
            money += toNum(r.money);
            fee += toNum(r.fee);
            benefits += toNum(r.benefits);
        }
        return { money, fee, benefits };
    }

    function updateZebraTotalsDOM() {
        const dim = new Date(zebraState.year, zebraState.month + 1, 0).getDate();
        const d1 = calcDecadeSums(1, 10);
        const d2 = calcDecadeSums(11, 20);
        const d3 = calcDecadeSums(21, dim);

        const setTxt = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.innerText = fmtNum(val);
        };

        // Итоги по декадам
        setTxt('st20_d1_money', d1.money);
        setTxt('st20_d1_fee', d1.fee);
        setTxt('st20_d1_ben', d1.benefits);

        setTxt('st20_d2_money', d2.money);
        setTxt('st20_d2_fee', d2.fee);
        setTxt('st20_d2_ben', d2.benefits);

        setTxt('st20_d3_money', d3.money);
        setTxt('st20_d3_fee', d3.fee);
        setTxt('st20_d3_ben', d3.benefits);

        // Левый сводный блок 1-й и 2-й декады (как в A28:D42 Лист1)
        setTxt('st20_s1_ben', d1.benefits);
        setTxt('st20_s2_ben', d2.benefits);
        setTxt('st20_s1_fee', d1.fee);
        setTxt('st20_s2_fee', d2.fee);
        setTxt('st20_s1_money', d1.money);
        setTxt('st20_s2_money', d2.money);

        // Итого за месяц
        setTxt('st20_m_money', d1.money + d2.money + d3.money);
        setTxt('st20_m_fee', d1.fee + d2.fee + d3.fee);
        setTxt('st20_m_ben', d1.benefits + d2.benefits + d3.benefits);
    }

    window.onSt20CellInput = function(day, field, val) {
        if (!zebraState.rows[day]) zebraState.rows[day] = {};
        zebraState.rows[day][field] = val;
        updateZebraTotalsDOM();
    };

    window.onSt20FioChange = function(val) {
        zebraState.fio = val;
        const label = 'ФИО: ' + (val.trim() || '____________________________________');
        document.querySelectorAll('.st20-fio-vert').forEach(td => { td.innerText = label; });
    };

    function buildDecadeTableHtml(decadeIndex, fromDay, toDay, includeMonthTotal) {
        const y = zebraState.year;
        const m = zebraState.month;
        const fioLabel = 'ФИО: ' + (zebraState.fio.trim() || '____________________________________');
        const rowCount = (toDay - fromDay + 1) + 1; // строки дней + строка "Итого за 10 дн."

        let rowsHtml = '';
        for (let d = fromDay; d <= toDay; d++) {
            const r = zebraState.rows[d] || {};
            const dateTxt = `${pad2(d)}.${pad2(m + 1)}.${y}`;
            rowsHtml += `
                <tr>
                    <td style="white-space:nowrap;font-weight:500;">${dateTxt}</td>
                    <td><input class="st20-cell" type="text" value="${st20Esc(r.mkassa || '')}" oninput="onSt20CellInput(${d},'mkassa',this.value)"></td>
                    <td><input class="st20-cell" type="text" value="${st20Esc(r.shiftNum || '')}" oninput="onSt20CellInput(${d},'shiftNum',this.value)"></td>
                    <td><input class="st20-cell" type="number" step="0.01" value="${st20Esc(r.money || '')}" oninput="onSt20CellInput(${d},'money',this.value)"></td>
                    <td><input class="st20-cell" type="number" step="0.01" value="${st20Esc(r.fee || '')}" oninput="onSt20CellInput(${d},'fee',this.value)"></td>
                    <td><input class="st20-cell" type="number" step="0.01" value="${st20Esc(r.benefits || '')}" oninput="onSt20CellInput(${d},'benefits',this.value)"></td>
                    ${d === fromDay ? `<td class="st20-fio-vert" rowspan="${rowCount}">${st20Esc(fioLabel)}</td>` : ''}
                </tr>
            `;
        }

        rowsHtml += `
            <tr class="st20-total-row">
                <td colspan="3" style="text-align:left;padding-left:8px;">Итого за 10 дн.</td>
                <td id="st20_d${decadeIndex}_money">0</td>
                <td id="st20_d${decadeIndex}_fee">0</td>
                <td id="st20_d${decadeIndex}_ben">0</td>
            </tr>
        `;

        if (includeMonthTotal) {
            rowsHtml += `
                <tr class="st20-month-row">
                    <td colspan="3" style="text-align:left;padding-left:8px;">Итого за месяц</td>
                    <td id="st20_m_money">0</td>
                    <td id="st20_m_fee">0</td>
                    <td id="st20_m_ben">0</td>
                    <td style="background:#f8fafc;"></td>
                </tr>
            `;
        }

        return `
            <table class="st20-table">
                <thead>
                    <tr>
                        <th style="width:90px;">дата</th>
                        <th style="width:95px;">№ МКАССЫ</th>
                        <th style="width:80px;">№СМЕНЫ</th>
                        <th>ДЕНЬГИ за вычетом<br>доп сбора и аннуляции</th>
                        <th>сумма<br>доп сбора</th>
                        <th>льготные</th>
                        <th style="width:30px;">ФИО</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        `;
    }

    function renderZebraSheet() {
        const box = document.getElementById('st20SheetBox');
        if (!box) return;

        const fioInp = document.getElementById('st20FioInput');
        if (fioInp) fioInp.value = zebraState.fio;

        const dim = new Date(zebraState.year, zebraState.month + 1, 0).getDate();

        const leftSummaryHtml = `
            <table class="st20-left-summary">
                <tr>
                    <td class="lbl">1) льготы:</td>
                    <td class="val" id="st20_s1_ben">0</td>
                    <td class="lbl">2) льготы:</td>
                    <td class="val" id="st20_s2_ben">0</td>
                </tr>
                <tr>
                    <td class="lbl">1) доп.сбор</td>
                    <td class="val" id="st20_s1_fee">0</td>
                    <td class="lbl">2) доп сбор:</td>
                    <td class="val" id="st20_s2_fee">0</td>
                </tr>
                <tr>
                    <td class="lbl">1) Сумма денег</td>
                    <td class="val" id="st20_s1_money">0</td>
                    <td class="lbl">2) Сумма денег:</td>
                    <td class="val" id="st20_s2_money">0</td>
                </tr>
            </table>
        `;

        box.innerHTML = `
            <div style="font-weight:bold;color:#003366;margin:2px 0 6px;font-size:13px;">1-я декада (01–10 ${RU_MONTHS[zebraState.month]} ${zebraState.year})</div>
            <div class="st20-decade-layout">${buildDecadeTableHtml(1, 1, 10, false)}</div>

            <div style="font-weight:bold;color:#003366;margin:6px 0 6px;font-size:13px;">2-я декада (11–20 ${RU_MONTHS[zebraState.month]} ${zebraState.year})</div>
            <div class="st20-decade-layout">${buildDecadeTableHtml(2, 11, 20, false)}</div>

            <div style="font-weight:bold;color:#003366;margin:6px 0 6px;font-size:13px;">3-я декада (21–${dim} ${RU_MONTHS[zebraState.month]} ${zebraState.year}) и итог за месяц</div>
            <div class="st20-decade-layout" style="flex-wrap:wrap;">
                ${leftSummaryHtml}
                <div style="flex:1;min-width:680px;">${buildDecadeTableHtml(3, 21, dim, true)}</div>
            </div>
        `;

        updateZebraTotalsDOM();
    }

    // ========================================================
    // 4. ЭКСПОРТ В EXCEL (.XLSX) И ПЕЧАТЬ / PDF
    // ========================================================
    window.downloadSt20ZebraExcel = function() {
        window.saveSt20ZebraData(true);
        if (typeof XLSX === 'undefined') {
            return alert('Библиотека Excel не загружена — воспользуйтесь кнопкой «Печать / PDF».');
        }

        const y = zebraState.year;
        const m = zebraState.month;
        const dim = new Date(y, m + 1, 0).getDate();
        const d1 = calcDecadeSums(1, 10);
        const d2 = calcDecadeSums(11, 20);
        const d3 = calcDecadeSums(21, dim);
        const fioTxt = 'ФИО: ' + (zebraState.fio || '____________________________');

        const aoa = [];
        const hdr = ['', '', '', '', 'дата', '№ МКАССЫ', '№СМЕНЫ', 'ДЕНЬГИ за вычетом доп сбора и аннуляции', 'сумма доп сбора', 'льготные', fioTxt];
        aoa.push([]);
        aoa.push(hdr);

        const pushDays = (from, to, withLeftSummary) => {
            for (let d = from; d <= to; d++) {
                const r = zebraState.rows[d] || {};
                const row = ['', '', '', '', `${pad2(d)}.${pad2(m + 1)}.${y}`, r.mkassa || '', r.shiftNum || '', toNum(r.money) || '', toNum(r.fee) || '', toNum(r.benefits) || '', ''];
                if (withLeftSummary) {
                    if (d === 21) { row[0] = '1) льготы:'; row[1] = d1.benefits; row[2] = '2) льготы:'; row[3] = d2.benefits; }
                    if (d === 23) { row[0] = '1) доп.сбор'; row[1] = d1.fee; row[2] = '2) доп сбор:'; row[3] = d2.fee; }
                    if (d === 27) { row[0] = '1) Сумма денег'; row[1] = d1.money; row[2] = '2) Сумма денег:'; row[3] = d2.money; }
                }
                aoa.push(row);
            }
        };

        // 1-я декада
        pushDays(1, 10, false);
        aoa.push(['', '', '', '', 'Итого за 10 дн.', '', '', d1.money, d1.fee, d1.benefits, '']);
        aoa.push([]);

        // 2-я декада
        aoa.push(hdr);
        pushDays(11, 20, false);
        aoa.push(['', '', '', '', 'Итого за 10 дн.', '', '', d2.money, d2.fee, d2.benefits, '']);
        aoa.push([]);

        // 3-я декада
        aoa.push(['1) льготы:', d1.benefits, '2) льготы:', d2.benefits, 'дата', '№ МКАССЫ', '№СМЕНЫ', 'ДЕНЬГИ за вычетом доп сбора и аннуляции', 'сумма доп сбора', 'льготные', fioTxt]);
        pushDays(21, dim, true);
        aoa.push(['', '', '', '', 'Итого за 10 дн.', '', '', d3.money, d3.fee, d3.benefits, '']);
        aoa.push([]);
        aoa.push(['', '', '', '', 'Итого за месяц', '', '', d1.money + d2.money + d3.money, d1.fee + d2.fee + d3.fee, d1.benefits + d2.benefits + d3.benefits, '']);

        const ws = XLSX.utils.aoa_to_sheet(aoa);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Лист1');
        XLSX.writeFile(wb, `Статистика_Декада_Зебра_${getYmKey(y, m)}.xlsx`);
    };

    window.printSt20ZebraSheet = function() {
        window.saveSt20ZebraData(true);
        const y = zebraState.year;
        const m = zebraState.month;
        const dim = new Date(y, m + 1, 0).getDate();
        const d1 = calcDecadeSums(1, 10);
        const d2 = calcDecadeSums(11, 20);
        const d3 = calcDecadeSums(21, dim);

        const makePrintTable = (title, from, to, sumObj, withMonth) => {
            let body = '';
            for (let d = from; d <= to; d++) {
                const r = zebraState.rows[d] || {};
                body += `<tr><td>${pad2(d)}.${pad2(m + 1)}.${y}</td><td>${st20Esc(r.mkassa || '')}</td><td>${st20Esc(r.shiftNum || '')}</td><td>${st20Esc(r.money || '')}</td><td>${st20Esc(r.fee || '')}</td><td>${st20Esc(r.benefits || '')}</td></tr>`;
            }
            body += `<tr style="font-weight:bold;background:#e2e8f0;"><td colspan="3">Итого за 10 дн.</td><td>${fmtNum(sumObj.money)}</td><td>${fmtNum(sumObj.fee)}</td><td>${fmtNum(sumObj.benefits)}</td></tr>`;
            if (withMonth) {
                body += `<tr style="font-weight:bold;background:#d1fae5;"><td colspan="3">Итого за месяц</td><td>${fmtNum(d1.money + d2.money + d3.money)}</td><td>${fmtNum(d1.fee + d2.fee + d3.fee)}</td><td>${fmtNum(d1.benefits + d2.benefits + d3.benefits)}</td></tr>`;
            }
            return `<h4>${title}</h4><table><thead><tr><th>дата</th><th>№ МКАССЫ</th><th>№СМЕНЫ</th><th>ДЕНЬГИ за вычетом доп сбора и аннуляции</th><th>сумма доп сбора</th><th>льготные</th></tr></thead><tbody>${body}</tbody></table>`;
        };

        const w = window.open('', '_blank');
        if (!w) return alert('Разрешите всплывающие окна для печати.');
        w.document.write(`
            <html><head><title>Статистика Декада/Зебра — ${RU_MONTHS[m]} ${y}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 12px; font-size: 11px; }
                h3, h4 { margin: 8px 0 4px; color: #003366; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
                th, td { border: 1px solid #333; padding: 4px 6px; text-align: center; }
                th { background: #dce6f1; }
            </style></head><body>
            <h3>Бланк статистики (Декада / Зебра) — ${RU_MONTHS[m]} ${y} г. | ФИО: ${st20Esc(zebraState.fio || '___________________')}</h3>
            ${makePrintTable('1-я декада (01–10)', 1, 10, d1, false)}
            ${makePrintTable('2-я декада (11–20)', 11, 20, d2, false)}
            ${makePrintTable('3-я декада (21–' + dim + ')', 21, dim, d3, true)}
            <script>window.onload = function(){ window.print(); };<\/script>
            </body></html>
        `);
        w.document.close();
    };

    // ========================================================
    // 5. МОДАЛЬНОЕ ОКНО БЛАНКА
    // ========================================================
    function ensureSt20Modal() {
        if (document.getElementById('st20ZebraModal')) return;
        const wrap = document.createElement('div');
        wrap.innerHTML = `
            <div id="st20ZebraModal" class="modal">
                <div class="modal-content modal-wide" style="max-width:1050px;width:96%;max-height:94vh;overflow-y:auto;">
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
                        <h3 style="margin:0;color:#003366;">🦓 Статистика Декада / Зебра (Лист 1)</h3>
                        <div style="display:flex;gap:6px;flex-wrap:wrap;">
                            <button type="button" class="btn-success" style="width:auto;margin:0;padding:6px 12px;font-size:12px;" onclick="saveSt20ZebraData(false)">💾 Сохранить</button>
                            <button type="button" class="btn-action" style="width:auto;margin:0;padding:6px 12px;font-size:12px;background:#198754;" onclick="downloadSt20ZebraExcel()">📥 Excel (.xlsx)</button>
                            <button type="button" class="btn-action" style="width:auto;margin:0;padding:6px 12px;font-size:12px;background:#0055aa;" onclick="printSt20ZebraSheet()">🖨️ Печать / PDF</button>
                        </div>
                    </div>

                    <div class="st20-toolbar">
                        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
                            <label style="font-size:12px;font-weight:bold;">Месяц:</label>
                            <select id="st20MonthSel" onchange="onSt20PeriodChange()"></select>
                            <select id="st20YearSel" onchange="onSt20PeriodChange()"></select>
                        </div>
                        <div style="display:flex;gap:6px;align-items:center;flex:1;min-width:210px;">
                            <label style="font-size:12px;font-weight:bold;white-space:nowrap;">ФИО:</label>
                            <input type="text" id="st20FioInput" style="flex:1;" placeholder="ФИО контролёра" oninput="onSt20FioChange(this.value)">
                        </div>
                    </div>

                    <div id="st20SheetBox" class="st20-sheet-wrap"></div>

                    <div style="margin-top:10px;text-align:right;">
                        <button type="button" class="btn-secondary" style="width:auto;margin:0;" onclick="saveSt20ZebraData(true);closeModal('st20ZebraModal')">Назад</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(wrap);

        const mSel = document.getElementById('st20MonthSel');
        mSel.innerHTML = RU_MONTHS.map((name, i) => `<option value="${i}">${name}</option>`).join('');

        const ySel = document.getElementById('st20YearSel');
        const curY = new Date().getFullYear();
        let yHtml = '';
        for (let y = 2025; y <= Math.max(2028, curY + 1); y++) {
            yHtml += `<option value="${y}">${y}</option>`;
        }
        ySel.innerHTML = yHtml;
    }

    window.onSt20PeriodChange = function() {
        const y = parseInt(document.getElementById('st20YearSel').value, 10);
        const m = parseInt(document.getElementById('st20MonthSel').value, 10);
        loadZebraData(y, m);
    };

    window.openSt20ZebraModal = function() {
        ensureSt20Modal();
        const now = new Date();
        document.getElementById('st20MonthSel').value = now.getMonth();
        document.getElementById('st20YearSel').value = now.getFullYear();
        openModal('st20ZebraModal');
        loadZebraData(now.getFullYear(), now.getMonth());
    };

    // ========================================================
    // ЗАПУСК
    // ========================================================
    window.addEventListener('load', () => {
        injectSt20Styles();
        ensureSt20Modal();
        setTimeout(() => {
            patchDecadeButtons();
            const obs = new MutationObserver(() => patchDecadeButtons());
            obs.observe(document.body, { childList: true, subtree: true });
        }, 1400);
    });
})();
