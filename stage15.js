// ============================================================
// === ЭТАП 15: ДИЗАЙН ЧАТОВ И ДИАЛОГОВ В СТИЛЕ TELEGRAM    ===
// ============================================================

window.addEventListener('load', () => {
    injectStage15TelegramStyles();
});

function injectStage15TelegramStyles() {
    if (document.getElementById('st15-tg-styles')) return;
    let st = document.createElement('style');
    st.id = 'st15-tg-styles';
    st.innerHTML = `
        /* ==================================================== */
        /* === TELEGRAM LIGHT THEME (ОСНОВНОЙ МОБИЛЬНЫЙ СТИЛЬ) === */
        /* ==================================================== */
        .wa-app {
            background: #ffffff !important;
            color: #222222 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            border-radius: 14px !important;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.28) !important;
        }

        /* ЛЕВАЯ РЕЛЬСА НА ПК (TELEGRAM DESKTOP) */
        .wa-rail {
            background: #293a4c !important;
            border-right: none !important;
            width: 62px !important;
            padding: 14px 0 !important;
        }
        .wa-rail-btn {
            color: #8fa6bc !important;
            border-radius: 12px !important;
            width: 42px !important;
            height: 42px !important;
            transition: background 0.18s, color 0.18s;
        }
        .wa-rail-btn:hover {
            background: rgba(255, 255, 255, 0.1) !important;
            color: #ffffff !important;
        }
        .wa-rail-btn.active {
            background: #3390ec !important;
            color: #ffffff !important;
        }

        /* ЛЕВАЯ ПАНЕЛЬ СПИСКА ЧАТОВ */
        .wa-sidebar {
            background: #ffffff !important;
            border-right: 1px solid #e4e7eb !important;
        }
        .wa-side-header {
            background: #517da2 !important;
            color: #ffffff !important;
            padding: 12px 16px !important;
            min-height: 54px;
            box-sizing: border-box;
        }
        .wa-side-header h3 {
            color: #ffffff !important;
            font-size: 19px !important;
            font-weight: 600 !important;
            letter-spacing: 0.2px;
        }
        .wa-side-header .wa-icon-btn {
            color: #ffffff !important;
        }
        .wa-side-header .wa-icon-btn:hover {
            background: rgba(255, 255, 255, 0.16) !important;
        }

        /* ПОИСК В СТИЛЕ TELEGRAM */
        .wa-search-wrap {
            background: #ffffff !important;
            padding: 10px 12px 6px !important;
        }
        .wa-search-box {
            background: #f1f3f5 !important;
            border-radius: 22px !important;
            padding: 7px 14px !important;
            border: 1px solid transparent;
            transition: border-color 0.2s, background 0.2s;
        }
        .wa-search-box:focus-within {
            background: #ffffff !important;
            border-color: #3390ec !important;
        }
        .wa-search-box input {
            color: #222222 !important;
            font-size: 14px !important;
        }

        /* ВКЛАДКИ ПАПОК TELEGRAM (С СИНЕНКОЙ ПОЛОСКОЙ СНИЗУ) */
        .wa-filters {
            padding: 2px 12px 0 !important;
            gap: 4px !important;
            border-bottom: 1px solid #e6e9ec !important;
            background: #ffffff !important;
        }
        .wa-pill {
            background: transparent !important;
            color: #707579 !important;
            border-radius: 0 !important;
            padding: 9px 12px 8px !important;
            font-size: 13px !important;
            font-weight: 600 !important;
            border-bottom: 3px solid transparent !important;
        }
        .wa-pill:hover {
            background: rgba(51, 144, 236, 0.06) !important;
            color: #3390ec !important;
        }
        .wa-pill.active {
            background: transparent !important;
            color: #3390ec !important;
            border-bottom: 3px solid #3390ec !important;
        }

        /* СТРОКИ СПИСКА ЧАТОВ */
        .wa-chat-row {
            padding: 10px 14px !important;
            border-bottom: 1px solid #f0f2f5 !important;
            gap: 12px !important;
        }
        .wa-chat-row:hover {
            background: #f4f6f8 !important;
        }
        .wa-chat-row.active {
            background: #3390ec !important;
            color: #ffffff !important;
        }
        .wa-chat-row.active .wa-row-name,
        .wa-chat-row.active .wa-row-preview,
        .wa-chat-row.active .wa-row-time {
            color: #ffffff !important;
        }
        .wa-row-name {
            font-size: 15px !important;
            font-weight: 600 !important;
            color: #222222;
        }
        .wa-row-preview {
            font-size: 13.5px !important;
            color: #707579;
        }
        .wa-row-time {
            font-size: 11.5px !important;
            color: #8d969e;
        }

        /* ГРАДИЕНТНЫЕ КРУГЛЫЕ АВАТАРКИ TELEGRAM */
        .wa-avatar {
            width: 50px !important;
            height: 50px !important;
            min-width: 50px !important;
            background: linear-gradient(135deg, #54a9eb, #2a85d0) !important;
            color: #ffffff !important;
            font-size: 17px !important;
            font-weight: 600 !important;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
        }
        .wa-avatar.group {
            background: linear-gradient(135deg, #72b7f2, #3390ec) !important;
        }
        .wa-unread-dot {
            background: #3390ec !important;
            color: #ffffff !important;
            min-width: 21px !important;
            height: 21px !important;
            border-radius: 11px !important;
            font-size: 11.5px !important;
        }
        .wa-status-ring {
            border-color: #3390ec !important;
        }

        /* ПРАВАЯ ПАНЕЛЬ ДИАЛОГА (ФОН TELEGRAM) */
        .wa-main {
            background-color: #d6e4c3 !important;
            background-image:
                radial-gradient(circle at 20% 25%, rgba(255, 255, 255, 0.35) 0%, transparent 45%),
                radial-gradient(circle at 80% 75%, rgba(114, 168, 108, 0.22) 0%, transparent 50%),
                linear-gradient(135deg, #dbe9c7 0%, #c4dbb1 50%, #d4e4be 100%) !important;
            background-size: cover !important;
        }

        /* ШАПКА ДИАЛОГА TELEGRAM */
        .wa-main-header {
            background: #517da2 !important;
            color: #ffffff !important;
            border-bottom: none !important;
            padding: 8px 14px !important;
            min-height: 54px;
            box-sizing: border-box;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
            z-index: 5;
        }
        .wa-main-header #chatActiveName {
            color: #ffffff !important;
            font-size: 16px !important;
            font-weight: 600 !important;
        }
        .wa-main-header #waHeaderSub {
            color: #d4e6f5 !important;
            font-size: 12px !important;
        }
        .wa-main-header .wa-icon-btn,
        .wa-main-header .wa-back-mobile {
            color: #ffffff !important;
        }
        .wa-main-header .wa-icon-btn:hover,
        .wa-main-header .wa-back-mobile:hover {
            background: rgba(255, 255, 255, 0.16) !important;
        }

        /* РАЗДЕЛИТЕЛЬ ДАТЫ TELEGRAM */
        .wa-date-pill {
            background: rgba(58, 86, 62, 0.42) !important;
            color: #ffffff !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            padding: 4px 12px !important;
            border-radius: 14px !important;
            box-shadow: none !important;
            backdrop-filter: blur(4px);
        }

        /* ПУЗЫРЬКИ СООБЩЕНИЙ TELEGRAM */
        .wa-messages {
            padding: 12px 16px !important;
            gap: 5px !important;
        }
        .wa-bubble {
            border-radius: 16px !important;
            padding: 8px 12px 6px !important;
            font-size: 14.5px !important;
            line-height: 1.4 !important;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12) !important;
        }
        .wa-bubble.in {
            background: #ffffff !important;
            color: #000000 !important;
            border-bottom-left-radius: 4px !important;
            border-top-left-radius: 16px !important;
        }
        .wa-bubble.out {
            background: #effdde !important;
            color: #000000 !important;
            border-bottom-right-radius: 4px !important;
            border-top-right-radius: 16px !important;
        }
        .wa-sender {
            color: #3390ec !important;
            font-size: 13px !important;
            font-weight: 600 !important;
        }
        .wa-quote {
            background: rgba(51, 144, 236, 0.1) !important;
            border-left: 3px solid #3390ec !important;
            border-radius: 6px !important;
            padding: 4px 8px !important;
        }
        .wa-quote strong { color: #3390ec !important; }
        .wa-bubble.out .wa-meta { color: #5fa052 !important; }
        .wa-bubble.in .wa-meta { color: #8c969f !important; }
        .wa-ticks-delivered { color: #67ad5b !important; }
        .wa-ticks-read { color: #4fae4e !important; }
        .wa-msg-mini-av {
            background: linear-gradient(135deg, #54a9eb, #2a85d0) !important;
        }

        /* СТРОКА ВВОДА TELEGRAM (ПЛОСКАЯ ОТ КРАЯ ДО КРАЯ) */
        .wa-reply-bar {
            background: #ffffff !important;
            border-top: 1px solid #e4e7eb !important;
        }
        .wa-reply-bar > div { border-left-color: #3390ec !important; }
        #waReplySender { color: #3390ec !important; }
        .wa-emoji-bar {
            background: #ffffff !important;
            border-top: 1px solid #e4e7eb !important;
        }
        .wa-composer {
            background: #ffffff !important;
            border-top: 1px solid #e4e7eb !important;
            padding: 6px 10px !important;
            gap: 6px !important;
        }
        .wa-composer input[type="text"] {
            background: transparent !important;
            border-radius: 0 !important;
            padding: 10px 6px !important;
            font-size: 15px !important;
            color: #222222 !important;
        }
        .wa-composer .wa-icon-btn {
            color: #707579 !important;
        }
        .wa-composer .wa-icon-btn:hover {
            color: #3390ec !important;
            background: rgba(51, 144, 236, 0.08) !important;
        }
        .wa-send-btn {
            background: #3390ec !important;
            color: #ffffff !important;
            width: 40px !important;
            height: 40px !important;
            min-width: 40px !important;
            box-shadow: 0 2px 6px rgba(51, 144, 236, 0.35);
        }
        .wa-send-btn:hover {
            background: #287fd6 !important;
        }

        /* КРУГЛАЯ СИНЕ-ГОЛУБАЯ КНОПКА «+» В СТИЛЕ TELEGRAM */
        .wa-fab-plus {
            background: #3390ec !important;
            box-shadow: 0 4px 14px rgba(51, 144, 236, 0.45) !important;
        }
        .wa-fab-plus:hover,
        .wa-fab-plus.open {
            background: #2478cc !important;
        }
        .wa-fab-action-btn:hover {
            background: #eef6ff !important;
            color: #3390ec !important;
        }

        /* ВКЛАДКИ И БЕЙДЖИ В КАРТОЧКЕ ГРУППЫ В ЦВЕТАХ TELEGRAM */
        .st12-tab-btn.active {
            background: #3390ec !important;
            color: #ffffff !important;
        }
        .st12-role-admin {
            background: #e3f2fd !important;
            color: #1976d2 !important;
        }
        .st12-ctx-menu {
            border-radius: 14px !important;
        }

        /* ==================================================== */
        /* === TELEGRAM NIGHT (ТЕМНАЯ ТЕМА)                     === */
        /* ==================================================== */
        body.dark-theme .wa-app {
            background: #17212b !important;
            color: #f5f5f5 !important;
        }
        body.dark-theme .wa-rail {
            background: #0e1621 !important;
        }
        body.dark-theme .wa-sidebar {
            background: #17212b !important;
            border-color: #0e1621 !important;
        }
        body.dark-theme .wa-side-header,
        body.dark-theme .wa-main-header {
            background: #17212b !important;
            border-bottom: 1px solid #0e1621 !important;
        }
        body.dark-theme .wa-search-wrap,
        body.dark-theme .wa-filters {
            background: #17212b !important;
            border-color: #0e1621 !important;
        }
        body.dark-theme .wa-search-box {
            background: #242f3d !important;
        }
        body.dark-theme .wa-search-box input {
            color: #f5f5f5 !important;
        }
        body.dark-theme .wa-pill { color: #7f91a4 !important; }
        body.dark-theme .wa-pill.active {
            color: #6ab2f2 !important;
            border-bottom-color: #6ab2f2 !important;
        }
        body.dark-theme .wa-chat-row {
            border-color: #101921 !important;
        }
        body.dark-theme .wa-chat-row:hover {
            background: #202b36 !important;
        }
        body.dark-theme .wa-chat-row.active {
            background: #2b5278 !important;
        }
        body.dark-theme .wa-row-name { color: #f5f5f5 !important; }
        body.dark-theme .wa-row-preview,
        body.dark-theme .wa-row-time { color: #7f91a4 !important; }

        body.dark-theme .wa-main {
            background-color: #0e1621 !important;
            background-image:
                radial-gradient(circle at 25% 20%, rgba(51, 144, 236, 0.08) 0%, transparent 45%),
                linear-gradient(160deg, #0e1621 0%, #111b27 100%) !important;
        }
        body.dark-theme .wa-date-pill {
            background: rgba(24, 37, 51, 0.85) !important;
            color: #d6e2ec !important;
        }
        body.dark-theme .wa-bubble.in {
            background: #182533 !important;
            color: #f5f5f5 !important;
        }
        body.dark-theme .wa-bubble.out {
            background: #2b5278 !important;
            color: #ffffff !important;
        }
        body.dark-theme .wa-bubble.out .wa-meta,
        body.dark-theme .wa-bubble.in .wa-meta {
            color: #88a4bf !important;
        }
        body.dark-theme .wa-ticks-read { color: #6ab2f2 !important; }
        body.dark-theme .wa-composer,
        body.dark-theme .wa-reply-bar,
        body.dark-theme .wa-emoji-bar {
            background: #17212b !important;
            border-color: #0e1621 !important;
        }
        body.dark-theme .wa-composer input[type="text"] {
            color: #f5f5f5 !important;
        }
        body.dark-theme .wa-send-btn,
        body.dark-theme .wa-fab-plus {
            background: #5288c1 !important;
        }

        /* ==================================================== */
        /* === МОБИЛЬНЫЙ TELEGRAM (НИЖНЯЯ ПАНЕЛЬ + 100% ШИРИНЫ) === */
        /* ==================================================== */
        @media (max-width: 768px) {
            .wa-app {
                flex-direction: column-reverse !important;
                border-radius: 0 !important;
            }
            /* Нижняя панель вкладок, как в мобильном Telegram */
            .wa-rail {
                width: 100vw !important;
                min-width: 100vw !important;
                height: 54px !important;
                flex-direction: row !important;
                justify-content: space-around !important;
                align-items: center !important;
                padding: 0 8px !important;
                background: #ffffff !important;
                border-top: 1px solid #e4e7eb !important;
                border-right: none !important;
            }
            body.dark-theme .wa-rail {
                background: #17212b !important;
                border-top: 1px solid #0e1621 !important;
            }
            .wa-rail > div { display: none !important; }
            .wa-rail-btn {
                color: #707579 !important;
                width: 44px !important;
                height: 40px !important;
                border-radius: 12px !important;
            }
            .wa-rail-btn.active {
                background: rgba(51, 144, 236, 0.14) !important;
                color: #3390ec !important;
            }
            body.dark-theme .wa-rail-btn { color: #7f91a4 !important; }
            body.dark-theme .wa-rail-btn.active {
                background: rgba(106, 178, 242, 0.16) !important;
                color: #6ab2f2 !important;
            }

            /* Список чатов на все 100% ширины */
            .wa-sidebar {
                width: 100vw !important;
                max-width: 100vw !important;
                flex: 1 !important;
                min-height: 0 !important;
                border-right: none !important;
            }

            /* Когда открыт диалог — скрываем нижнюю панель, диалог на весь экран */
            .wa-app.mobile-chat-open .wa-rail {
                display: none !important;
            }
            .wa-app.mobile-chat-open .wa-main {
                width: 100vw !important;
                max-width: 100vw !important;
                height: 100% !important;
                flex: 1 !important;
            }
            .wa-messages {
                padding: 10px 10px !important;
            }
            .wa-bubble {
                max-width: 85% !important;
            }
            .wa-fab-plus {
                bottom: 14px !important;
                right: 16px !important;
            }
            .wa-fab-menu {
                bottom: 78px !important;
                right: 16px !important;
            }
        }
    `;
    document.head.appendChild(st);
}
