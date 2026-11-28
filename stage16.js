// ============================================================
// === ЭТАП 16: ДЕРЕВО ПРАВ КНОПОК В ДОЛЖНОСТЯХ             ===
// === (СКРЫВАЕТ ВСЕ КНОПКИ БЕЗ ГАЛОЧКИ, КРОМЕ НАЗАД/СОХР.) ===
// ============================================================

const ST16_PERM_TREE = [
    {
        key: 'fdu',
        label: '📄 Главный экран и ФДУ',
        children: [
            { key: 'fdu.open', label: 'Открыть ФДУ' },
            { key: 'fdu.shiftBtn', label: 'Открыть / Редактировать смену' },
            { key: 'occupancy', label: '👥 Населенность поезда' },
            { key: 'trainReport', label: '📊 Отчет по поезду' }
        ]
    },
    {
        key: 'tabel',
        label: '📅 Табель',
        children: [
            { key: 'tabel.create', label: '+ Создать сотрудника' },
            { key: 'tabel.master', label: '🧭 Мастер расстановок' },
            { key: 'tabel.load', label: '📁 Загрузить из файла' },
            { key: 'tabel.distribute', label: '🔀 Раскидать по маршрутам' },
            { key: 'tabel.notify', label: '📢 Сохранить и оповестить' },
            { key: 'tabel.editCells', label: 'Назначение маршрутов в ячейках (+)' }
        ]
    },
    {
        key: 'registry',
        label: '📑 Реестр',
        children: [
            { key: 'registry.search', label: '🔍 Искать' },
            { key: 'registry.export', label: '📊 Сформировать (Excel)' },
            { key: 'registry.create', label: '➕ Создать запись' }
        ]
    },
    {
        key: 'sync',
        label: '🔄 Синхрон',
        children: [
            { key: 'sync.analysis', label: '➕ Анализ МКассы' },
            { key: 'sync.unfinished', label: 'Не завершенные' },
            { key: 'sync.finish', label: '✅ Завершить Синхрон' }
        ]
    },
    {
        key: 'org',
        label: '🏢 Орг. Структура',
        children: [
            { key: 'org.positions', label: 'Вкладка «Должности»' },
            { key: 'org.workers', label: 'Вкладка «Сотрудники»' },
            { key: 'org.departments', label: 'Вкладка «Подразделение»' },
            { key: 'org.create', label: 'Кнопка «Создать»' },
            { key: 'org.delete', label: 'Кнопка «Удалить»' }
        ]
    },
    {
        key: 'settings',
        label: '⚙️ Настройки',
        children: [
            { key: 'settings.mkassas', label: 'Вкладка «МКассы»' },
            { key: 'settings.routes', label: 'Вкладка «Маршруты»' },
            { key: 'settings.trains', label: 'Вкладка «Поезда»' },
            { key: 'settings.stations', label: 'Вкладка «Станции»' },
            { key: 'settings.create', label: 'Кнопка «Создать»' },
            { key: 'settings.import', label: '📁 Загрузить из файла' },
            { key: 'settings.delete', label: 'Кнопка «Удалить»' }
        ]
    },
    {
        key: 'reports',
        label: '📑 Отчеты (Архив)',
        children: [
            { key: 'reports.closeMonth', label: '🔒 Закрыть месяц' },
            { key: 'reports.excel', label: '📥 Скачать Excel' },
            { key: 'reports.pdf', label: '📄 Печать PDF' },
            { key: 'reports.delete', label: '✕ Удалить отчет' }
        ]
    },
    {
        key: 'chats',
        label: '💬 Чаты',
        children: [
            { key: 'chats.create', label: '➕ Создать группу / новый чат' },
            { key: 'chats.contacts', label: '📱 Телефонная книга и приглашения' },
            { key: 'chats.status', label: '📷 Публиковать статус' }
        ]
    },
    {
        key: 'profile',
        label: '👤 Профиль',
        children: [
            { key: 'profile.edit', label: '✏️ Редактировать профиль и подпись' },
            { key: 'profile.photo', label: '📷 Загрузить фото профиля' }
        ]
    },
    { key: 'myShift', label: '🚆 Моя Смена', children: [] },
    { key: 'tech', label: '🎓 Тех. Занятие', children: [] },
    { key: 'raports', label: '📝 Рапорта', children: [] },
    { key: 'inspections', label: '🔍 Осмотры', children: [] },
    { key: 'stats', label: '📈 Статистика', children: [] }
];

// Привязка ключей прав к конкретным кнопкам интерфейса (кнопки «Назад» и «Сохранить» НЕ затрагиваются)
const ST16_BUTTON_SELECTORS = [
    { key: 'fdu.open', sel: '#main-screen button[data-perm="fdu"]' },
    { key: 'fdu.shiftBtn', sel: '#btnMainShift' },
    { key: 'occupancy', sel: '#main-screen button[data-perm="occupancy"]' },
    { key: 'trainReport', sel: '#main-screen button[data-perm="trainReport"]' },

    { key: 'tabel.create', sel: '#btnTabelCreateWorker' },
    { key: 'tabel.master', sel: '#btnTabelMaster' },
    { key: 'tabel.load', sel: '#btnTabelLoadFile' },
    { key: 'tabel.distribute', sel: '#btnTabelDistribute' },
    { key: 'tabel.notify', sel: '#btnTabelNotify' },

    { key: 'registry.search', sel: '#registry-screen button[onclick*="renderRegistryTable"]' },
    { key: 'registry.export', sel: '#registry-screen button[onclick*="regExportModal"]' },
    { key: 'registry.create', sel: '#registry-screen button[onclick*="openRegistryCreateModal"]' },

    { key: 'sync.analysis', sel: '#sync-dashboard-screen button[onclick*="syncAnalysisModal"]' },
    { key: 'sync.unfinished', sel: '#btnSyncUnf' },
    { key: 'sync.finish', sel: '#sync-dashboard-screen button[onclick*="finishAllSync"]' },

    { key: 'org.positions', sel: '#org-screen button[onclick*="switchOrgTab(\'positions\')"]' },
    { key: 'org.workers', sel: '#org-screen button[onclick*="switchOrgTab(\'workers\')"]' },
    { key: 'org.departments', sel: '#org-screen button[onclick*="switchOrgTab(\'departments\')"]' },
    { key: 'org.create', sel: '#org-screen button[onclick*="orgCreateClick"]' },
    { key: 'org.delete', sel: '#org-screen button[onclick*="orgDeleteClick"]' },

    { key: 'settings.mkassas', sel: '#settings-screen button[onclick*="switchSettingsTab(\'mkassas\')"]' },
    { key: 'settings.routes', sel: '#settings-screen button[onclick*="switchSettingsTab(\'routes\')"]' },
    { key: 'settings.trains', sel: '#settings-screen button[onclick*="switchSettingsTab(\'trains\')"]' },
    { key: 'settings.stations', sel: '#settings-screen button[onclick*="switchSettingsTab(\'stations\')"]' },
    { key: 'settings.create', sel: '#settings-screen button[onclick*="settingsCreateClick"]' },
    { key: 'settings.import', sel: '#btnSettingsLoadRouteFile' },
    { key: 'settings.delete', sel: '#settings-screen button[onclick*="settingsDeleteClick"]' },

    { key: 'reports.closeMonth', sel: '#reports-screen .btn-close-month' },
    { key: 'reports.excel', sel: '#reports-screen button[onclick*="downloadArchiveExcel"]' },
    { key: 'reports.pdf', sel: '#reports-screen button[onclick*="printArchivePdf"]' },
    { key: 'reports.delete', sel: '#reports-screen .btn-rep-del' },

    { key: 'chats.create', sel: '#waFabPlusBtn, #waFabUpMenu' },
    { key: 'chats.contacts', sel: '.wa-rail-btn[onclick*="openContactsInviteModal"], .wa-icon-btn[onclick*="openContactsInviteModal"]' },
    { key: 'chats.status', sel: '.wa-icon-btn[onclick*="openWaStatusCamera"]' },

    { key: 'profile.edit', sel: '#profile-screen .profile-edit-pencil' },
    { key: 'profile.photo', sel: '#pfAvatarWrap button' }
];

window.addEventListener('load', () => {
    injectStage16Styles();
    setTimeout(initStage16PermTree, 2300);
});

function injectStage16Styles() {
    if (document.getElementById('st16-styles')) return;
    let st = document.createElement('style');
    st.id = 'st16-styles';
    st.innerHTML = `
        .st16-perm-hidden {
            display: none !important;
        }
        .st16-tree-toolbar {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            margin: 8px 0 6px;
        }
        .st16-tree-toolbar button {
            width: auto !important;
            margin: 0 !important;
            padding: 5px 10px !important;
            font-size: 11.5px !important;
            border-radius: 5px !important;
        }
        .st16-tree-box {
            max-height: 290px;
            overflow-y: auto;
            border: 1px solid #cfd8e3;
            border-radius: 8px;
            background: #f8fafc;
            padding: 8px;
        }
        .st16-tree-node {
            margin-bottom: 4px;
            border-bottom: 1px solid #eef2f7;
            padding-bottom: 4px;
        }
        .st16-tree-node:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        .st16-tree-parent {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 4px 2px;
            font-size: 13px;
            font-weight: 600;
            color: #003366;
        }
        .st16-tree-toggle {
            width: 22px !important;
            height: 22px;
            min-width: 22px;
            padding: 0 !important;
            margin: 0 !important;
            background: #e2e8f0 !important;
            color: #334155 !important;
            border-radius: 4px !important;
            font-size: 11px !important;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
        .st16-tree-spacer {
            display: inline-block;
            width: 22px;
            min-width: 22px;
        }
        .st16-tree-cb {
            width: 17px !important;
            height: 17px !important;
            accent-color: #28a745;
            cursor: pointer;
            margin: 0;
        }
        .st16-tree-label {
            cursor: pointer;
            flex: 1;
            user-select: none;
        }
        .st16-tree-children {
            display: none;
            margin-left: 24px;
            padding-left: 12px;
            border-left: 2px solid #cbd5e1;
            margin-top: 3px;
        }
        .st16-tree-children.open {
            display: block;
        }
        .st16-tree-child {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 3px 2px;
            font-size: 12.5px;
            color: #1e293b;
            cursor: pointer;
        }
        .st16-tree-child:hover {
            background: #eef6ff;
            border-radius: 4px;
        }
    `;
    document.head.appendChild(st);
}

// ============================================================
// === ПРОВЕРКА ПРАВ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ                  ===
// ============================================================
function getCurrentUserPermsSet() {
    let role = typeof getUserRole === 'function' ? getUserRole() : 'viewer';
    if (role === 'founder') return null; // Основателю доступно всё

    let posObj = (positionsDb || []).find(p =>
        (appState.user?.position && p.name === appState.user.position) || p.role === role
    );
    if (!posObj) return new Set();
    return new Set(posObj.perms || []);
}

function st16HasPerm(key) {
    let set = getCurrentUserPermsSet();
    if (set === null) return true; // Основатель
    if (set.has(key)) return true;

    // Обратная совместимость со старыми должностями (если сохранен только родитель без вложенных ключей)
    let parentNode = ST16_PERM_TREE.find(n => (n.children || []).some(ch => ch.key === key));
    if (parentNode && set.has(parentNode.key)) {
        let hasAnyExplicitChild = parentNode.children.some(ch => set.has(ch.key));
        if (!hasAnyExplicitChild) return true;
    }
    return false;
}

// ============================================================
// === ОТРИСОВКА ДЕРЕВА В МОДАЛКЕ ДОЛЖНОСТИ (#positionModal) ===
// ============================================================
function renderSt16PermTreeInModal(savedPerms, isNewPosition) {
    let grid = document.getElementById('posPermsGrid');
    if (!grid) return;

    // Делаем контейнер блочным (убираем старую 2-колоночную сетку)
    grid.className = '';
    grid.style.cssText = 'margin-top:6px;';

    let savedSet = new Set(savedPerms || []);

    const isKeyChecked = (node, childKey) => {
        if (isNewPosition) return false; // при создании новой должности всё выключено — кроме Назад и Сохранить
        if (!childKey) {
            return savedSet.has(node.key) || (node.children || []).some(c => savedSet.has(c.key));
        }
        if (savedSet.has(childKey)) return true;
        if (savedSet.has(node.key)) {
            let hasExplicitChild = (node.children || []).some(c => savedSet.has(c.key));
            if (!hasExplicitChild) return true;
        }
        return false;
    };

    let treeHtml = ST16_PERM_TREE.map(node => {
        let hasKids = node.children && node.children.length > 0;
        let parentChecked = isKeyChecked(node, null);
        let kidsHtml = hasKids
            ? `<div class="st16-tree-children" id="st16Branch_${node.key}">
                ${node.children.map(ch => `
                    <label class="st16-tree-child">
                        <input type="checkbox" class="st16-tree-cb st16-child-cb" data-parent="${node.key}" value="${ch.key}" ${isKeyChecked(node, ch.key) ? 'checked' : ''} onchange="onSt16ChildCheckChange('${node.key}')">
                        <span>${ch.label}</span>
                    </label>
                `).join('')}
               </div>`
            : '';

        return `
            <div class="st16-tree-node">
                <div class="st16-tree-parent">
                    ${hasKids
                        ? `<button type="button" class="st16-tree-toggle" id="st16Tog_${node.key}" onclick="toggleSt16Branch('${node.key}')">▶</button>`
                        : `<span class="st16-tree-spacer"></span>`}
                    <input type="checkbox" class="st16-tree-cb st16-parent-cb" id="st16Par_${node.key}" value="${node.key}" ${parentChecked ? 'checked' : ''} onchange="onSt16ParentCheckChange('${node.key}', this.checked)">
                    <span class="st16-tree-label" onclick="${hasKids ? `toggleSt16Branch('${node.key}')` : `document.getElementById('st16Par_${node.key}').click()`}">${node.label}</span>
                </div>
                ${kidsHtml}
            </div>
        `;
    }).join('');

    grid.innerHTML = `
        <div style="font-size:12px;color:#555;margin-bottom:4px;">
            Отметьте галочками ✅ доступные разделы и кнопки (неотмеченные исчезнут, останутся только <b>Назад</b> и <b>Сохранить</b>):
        </div>
        <div class="st16-tree-toolbar">
            <button type="button" class="btn-success" onclick="st16CheckAllTree(true)">✅ Выбрать все</button>
            <button type="button" class="btn-secondary" onclick="st16CheckAllTree(false)">⬜ Снять все</button>
            <button type="button" class="btn-action" style="background:#0055aa;" onclick="st16ExpandAllTree(true)">📂 Раскрыть</button>
            <button type="button" class="btn-action" style="background:#64748b;" onclick="st16ExpandAllTree(false)">📁 Свернуть</button>
        </div>
        <div class="st16-tree-box">${treeHtml}</div>
    `;
}

function toggleSt16Branch(parentKey, forceOpen) {
    let br = document.getElementById('st16Branch_' + parentKey);
    let tg = document.getElementById('st16Tog_' + parentKey);
    if (!br) return;
    let shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !br.classList.contains('open');
    br.classList.toggle('open', shouldOpen);
    if (tg) tg.innerText = shouldOpen ? '▼' : '▶';
}

function onSt16ParentCheckChange(parentKey, isChecked) {
    document.querySelectorAll(`#posPermsGrid .st16-child-cb[data-parent="${parentKey}"]`).forEach(cb => {
        cb.checked = isChecked;
    });
    if (isChecked) toggleSt16Branch(parentKey, true);
}

function onSt16ChildCheckChange(parentKey) {
    let kids = Array.from(document.querySelectorAll(`#posPermsGrid .st16-child-cb[data-parent="${parentKey}"]`));
    let par = document.getElementById('st16Par_' + parentKey);
    if (par) par.checked = kids.some(k => k.checked);
}

function st16CheckAllTree(val) {
    document.querySelectorAll('#posPermsGrid .st16-tree-cb').forEach(cb => { cb.checked = val; });
}

function st16ExpandAllTree(open) {
    ST16_PERM_TREE.forEach(n => {
        if (n.children && n.children.length) toggleSt16Branch(n.key, open);
    });
}

// ============================================================
// === ПРИМЕНЕНИЕ ПРАВ КО ВСЕМ КНОПКАМ ПРИЛОЖЕНИЯ           ===
// ============================================================
function applySt16TreePermissions() {
    let role = typeof getUserRole === 'function' ? getUserRole() : 'viewer';
    let isFounder = role === 'founder';

    // 1. Пункты левого меню и элементы с data-perm
    document.querySelectorAll('[data-perm]').forEach(el => {
        let k = el.getAttribute('data-perm');
        if (k === 'main') return;
        let allowed = isFounder || st16HasPerm(k);
        if (allowed) {
            el.classList.remove('st16-perm-hidden');
            if (el.id === 'menuSettings') el.style.display = 'block';
            else el.style.display = '';
        } else {
            el.classList.add('st16-perm-hidden');
        }
    });

    // 2. Вложенные кнопки внутри экранов (Назад и Сохранить остаются всегда!)
    ST16_BUTTON_SELECTORS.forEach(item => {
        let allowed = isFounder || st16HasPerm(item.key);
        document.querySelectorAll(item.sel).forEach(el => {
            if (allowed) {
                el.classList.remove('st16-perm-hidden');
            } else {
                el.classList.add('st16-perm-hidden');
            }
        });
    });

    // 3. Особые кнопки Табеля (чтобы отображались, если явно выданы галочкой, даже у не-админа)
    if (!isFounder) {
        const tabelBtns = [
            { id: 'btnTabelCreateWorker', key: 'tabel.create' },
            { id: 'btnTabelMaster', key: 'tabel.master' },
            { id: 'btnTabelLoadFile', key: 'tabel.load' },
            { id: 'btnTabelDistribute', key: 'tabel.distribute' }
        ];
        tabelBtns.forEach(b => {
            let el = document.getElementById(b.id);
            if (!el) return;
            if (st16HasPerm(b.key)) {
                el.classList.remove('st16-perm-hidden');
                el.style.display = 'inline-block';
            } else {
                el.classList.add('st16-perm-hidden');
            }
        });
        let notifyBtn = document.getElementById('btnTabelNotify');
        if (notifyBtn) {
            if (appState.tabelDirty && st16HasPerm('tabel.notify')) {
                notifyBtn.classList.remove('st16-perm-hidden');
                notifyBtn.style.display = 'inline-block';
            } else {
                notifyBtn.classList.add('st16-perm-hidden');
            }
        }
    }
}

function initStage16PermTree() {
    // 1. Переопределяем открытие и сохранение должности
    window.openPositionModal = function(id) {
        appState.editingId = id || null;
        let ex = (positionsDb || []).find(p => p.id === id);
        document.getElementById('posNameInput').value = ex ? ex.name : '';
        document.getElementById('posRoleInput').value = ex ? ex.role : 'viewer';
        renderSt16PermTreeInModal(ex ? ex.perms : [], !ex);
        openModal('positionModal');
    };

    window.savePosition = function() {
        let name = document.getElementById('posNameInput').value.trim();
        if (!name) return alert("Введите название должности");
        let role = document.getElementById('posRoleInput').value;
        let perms = Array.from(document.querySelectorAll('#posPermsGrid .st16-tree-cb:checked')).map(c => c.value);

        let obj = {
            id: appState.editingId || ('pos_' + Date.now()),
            name,
            role,
            perms
        };
        if (typeof db !== 'undefined' && db) {
            db.collection('positions').doc(obj.id).set(obj);
        } else {
            let i = positionsDb.findIndex(x => x.id === obj.id);
            if (i >= 0) positionsDb[i] = obj; else positionsDb.push(obj);
            if (typeof renderOrgTable === 'function') renderOrgTable();
        }
        closeModal('positionModal');
        applySt16TreePermissions();
        if (typeof showSyncToast === 'function') showSyncToast(`☁️ Должность «${name}» сохранена`);
    };

    // 2. Переопределяем проверки прав Табеля и общее применение прав
    window.canEditTabel = function() {
        return st16HasPerm('tabel.editCells') || st16HasPerm('tabel.master') || st16HasPerm('tabel.distribute');
    };
    window.canCreateWorker = function() {
        return st16HasPerm('tabel.create') || st16HasPerm('org.create');
    };
    window.applyRolePermissions = applySt16TreePermissions;

    // 3. Автоматическое применение прав при обновлении динамических экранов
    let permTimer = null;
    const schedulePermApply = () => {
        if (permTimer) clearTimeout(permTimer);
        permTimer = setTimeout(applySt16TreePermissions, 50);
    };

    const obs = new MutationObserver(schedulePermApply);
    obs.observe(document.body, { childList: true, subtree: true });

    applySt16TreePermissions();
}
// ============================================================
// === ДОБАВЛЕНИЕ КНОПКИ «ДОБАВИТЬ ТЕХ. ЗАНЯТИЕ» (ТОЛЬКО ИНСТРУКТОР)
// ============================================================
(function patchTechAddPermission() {
    let techNode = ST16_PERM_TREE.find(n => n.key === 'tech');
    if (techNode && !techNode.children.some(c => c.key === 'tech.add')) {
        techNode.children.push({
            key: 'tech.add',
            label: '➕ Добавить тех. занятие (только Инструктор)',
            instructorOnly: true
        });
    }
})();

function syncSt16InstructorOnlyCheckboxes() {
    let roleVal = document.getElementById('posRoleInput')?.value || 'viewer';
    let allowInstructorOnly = (roleVal === 'instructor' || roleVal === 'founder');
    let cb = document.querySelector('#posPermsGrid .st16-child-cb[value="tech.add"]');
    if (!cb) return;

    let lbl = cb.closest('label');
    if (allowInstructorOnly) {
        cb.disabled = false;
        if (lbl) lbl.style.opacity = '1';
    } else {
        cb.checked = false;
        cb.disabled = true;
        if (lbl) lbl.style.opacity = '0.45';
    }
}

function applySt16TechAddButtonRule() {
    let techScr = document.getElementById('tech-screen');
    if (!techScr) return;

    let role = typeof getUserRole === 'function' ? getUserRole() : 'viewer';
    let allowed = (role === 'founder') || (role === 'instructor' && st16HasPerm('tech.add'));

    techScr.querySelectorAll('button').forEach(btn => {
        let txt = (btn.innerText || '').toLowerCase();
        let oc = (btn.getAttribute('onclick') || '').toLowerCase();
        let isAddTechBtn =
            (txt.includes('добавить') && txt.includes('занят')) ||
            (txt.includes('создать') && txt.includes('занят')) ||
            oc.includes('openaddtech') ||
            oc.includes('opentechmodal') ||
            oc.includes('addtechlesson');

        if (!isAddTechBtn) return;

        if (allowed) {
            btn.classList.remove('st16-perm-hidden');
            if (btn.style.display === 'none') btn.style.display = 'inline-block';
        } else {
            btn.classList.add('st16-perm-hidden');
        }
    });
}

window.addEventListener('load', () => {
    setTimeout(() => {
        // Не даём «Выбрать все» и родительской галочке включать заблокированный квадратик
        const _origParChange = window.onSt16ParentCheckChange;
        window.onSt16ParentCheckChange = function(parentKey, isChecked) {
            if (typeof _origParChange === 'function') _origParChange(parentKey, isChecked);
            syncSt16InstructorOnlyCheckboxes();
        };

        const _origCheckAll = window.st16CheckAllTree;
        window.st16CheckAllTree = function(val) {
            if (typeof _origCheckAll === 'function') _origCheckAll(val);
            syncSt16InstructorOnlyCheckboxes();
        };

        // Синхронизируем доступность квадратика при открытии должности и смене роли
        const _origOpenPos16 = window.openPositionModal;
        window.openPositionModal = function(id) {
            if (typeof _origOpenPos16 === 'function') _origOpenPos16(id);
            syncSt16InstructorOnlyCheckboxes();
        };

        let roleSel = document.getElementById('posRoleInput');
        if (roleSel && !roleSel.dataset.st16TechBound) {
            roleSel.dataset.st16TechBound = '1';
            roleSel.addEventListener('change', syncSt16InstructorOnlyCheckboxes);
        }

        // Применяем правило скрытия/показа самой кнопки в «Тех. Занятии»
        const _origApply16 = window.applyRolePermissions;
        window.applyRolePermissions = function() {
            if (typeof _origApply16 === 'function') _origApply16();
            applySt16TechAddButtonRule();
        };
        applySt16TechAddButtonRule();
    }, 2400);
});
