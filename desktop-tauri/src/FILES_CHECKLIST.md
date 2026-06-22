# Checklist файлов для сборки Wavify

## ✅ Основные файлы приложения

### HTML
- [x] index.html - главная страница
- [x] servers-page.html - страница серверов (если используется)

### JavaScript - Core
- [x] main.js - главный процесс Electron
- [x] preload.js - preload скрипт
- [x] renderer.js - renderer процесс
- [x] database.js - работа с базой данных

### JavaScript - UI Components
- [x] modal.js - модальные окна
- [x] loading-screen.js - экран загрузки
- [x] theme-customizer.js - кастомизация темы
- [x] playlist-avatars.js - аватары плейлистов
- [x] profile-page.js - страница профиля
- [x] playlists-library.js - библиотека плейлистов
- [x] servers-logic.js - логика серверов

### JavaScript - Services
- [x] services/track-converter.js - конвертация треков
- [x] services/unified.js - унифицированный поиск
- [x] services/yandex.js - Яндекс.Музыка
- [x] services/youtube.js - YouTube
- [x] services/soundcloud.js - SoundCloud
- [x] services/spotify.js - Spotify
- [x] services/converters.js - конвертеры

### JavaScript - Servers
- [x] local-server-v2.js - единый локальный сервер
- [x] test-server-unified.js - унифицированный сервер
- [x] unified-server.js - альтернативный сервер (если используется)

### JavaScript - Utilities
- [x] discord-rpc.js - Discord Rich Presence
- [x] tray.js - системный трей
- [x] updater.js - автообновление

### JavaScript - Routes
- [x] routes/music.js - музыкальные роуты

### CSS - Core
- [x] styles.css - основные стили
- [x] auth-modern.css - стили авторизации
- [x] wave-animation.css - анимация волны
- [x] loading-screen.css - стили загрузки
- [x] modal.css - стили модальных окон

### CSS - Additional
- [x] servers-styles.css - стили серверов
- [x] playlists-library.css - стили библиотеки
- [x] dotify-complete.css - стили Dotify (опционально)
- [x] dotify-final.css - финальные стили Dotify (опционально)
- [x] dotify-style.css - базовые стили Dotify (опционально)

### Assets
- [x] assets/icon.ico - иконка Windows
- [x] assets/icon.png - иконка PNG
- [x] assets/icon.icns - иконка macOS (опционально)

### External Libraries
- [x] hls.min.js - HLS.js для стриминга (если локальный)

## ✅ Конфигурационные файлы

- [x] package.json - зависимости и конфигурация
- [x] package-lock.json - lock файл

## ❌ Файлы которые НЕ должны включаться

### Тестовые файлы
- [ ] test-*.js
- [ ] check-*.js
- [ ] show-*.js
- [ ] find-*.js
- [ ] convert-*.js

### Утилиты разработки
- [ ] browser-cookies-extractor.js
- [ ] cookie-parser.js
- [ ] install-server-deps.bat
- [ ] install-server-deps.sh

### Документация
- [ ] *.md (все markdown файлы)
- [ ] BUILD_GUIDE.md
- [ ] DISCORD_RPC_SETUP.md
- [ ] ICON_FIX.md
- [ ] TOKEN_SETUP.md
- [ ] YANDEX_MUSIC_SETUP.md

### Кеш и временные файлы
- [ ] cache/*.mp3
- [ ] cache/yandex_token.txt
- [ ] *.db (тестовые базы)
- [ ] www.youtube.com_cookies*.txt

### Сборка
- [ ] dist/**/*
- [ ] .git/**/*

## ✅ Зависимости (node_modules)

Все зависимости из package.json будут установлены автоматически:

### Production Dependencies
- [x] axios - HTTP клиент
- [x] better-sqlite3 - SQLite база данных
- [x] cors - CORS middleware
- [x] discord-rpc - Discord интеграция
- [x] dotenv - переменные окружения
- [x] electron-updater - автообновление
- [x] express - веб-сервер
- [x] follow-redirects - редиректы
- [x] sqlite3 - SQLite (альтернатива)

### Dev Dependencies
- [x] electron - Electron framework
- [x] electron-builder - сборка приложения
- [x] electron-rebuild - пересборка нативных модулей
- [x] electron-reload - hot reload (только dev)
- [x] sharp - обработка изображений
- [x] to-ico - конвертация в ICO

## ✅ Структура после сборки

```
Wavify/
├── Wavify.exe                    # Главный исполняемый файл
├── resources/
│   ├── app.asar                  # Упакованное приложение
│   │   ├── main.js
│   │   ├── preload.js
│   │   ├── renderer.js
│   │   ├── index.html
│   │   ├── styles.css
│   │   ├── services/
│   │   ├── routes/
│   │   └── assets/
│   └── app.asar.unpacked/        # Нативные модули
│       └── node_modules/
│           ├── better-sqlite3/
│           └── *.node файлы
└── ...
```

## 🔍 Проверка перед сборкой

### 1. Проверка файлов
```bash
cd desktop
# Проверить что все файлы существуют
ls -la *.js *.css *.html
ls -la services/*.js
ls -la routes/*.js
ls -la assets/*
```

### 2. Проверка зависимостей
```bash
npm list --production
```

### 3. Проверка размера
```bash
# Примерный размер файлов
du -sh .
# Должно быть ~50-100 MB без node_modules
# С node_modules ~200-300 MB
```

### 4. Тест запуска
```bash
npm start
# Проверить что все работает
```

## 📦 Команды сборки

### Полная сборка
```bash
cd desktop
npm install
npm run build
```

### Результат
- `dist/Wavify-Setup-2.0.0.exe` - установщик (~150-200 MB)
- `dist/win-unpacked/` - распакованная версия

## ✅ Финальная проверка

После сборки проверить:
- [ ] Приложение запускается
- [ ] Все стили загружаются
- [ ] Поиск работает
- [ ] Воспроизведение работает
- [ ] Discord RPC работает
- [ ] Треки сохраняются
- [ ] Настройки сохраняются
- [ ] Иконка отображается правильно

## 🐛 Частые проблемы

### Проблема: Файлы не найдены после сборки
**Решение**: Проверить `files` в package.json

### Проблема: Нативные модули не работают
**Решение**: Добавить в `asarUnpack` в package.json

### Проблема: Большой размер
**Решение**: Исключить ненужные файлы через `!pattern` в `files`

### Проблема: Стили не загружаются
**Решение**: Проверить пути в index.html (должны быть относительные)
