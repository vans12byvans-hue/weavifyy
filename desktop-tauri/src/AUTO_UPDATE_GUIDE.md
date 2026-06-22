# 🔄 Руководство по автообновлению Wavify

## Как работает автообновление

Wavify использует `electron-updater` для автоматического обновления приложения. Обновления публикуются через GitHub Releases.

## Настройка GitHub Releases

### 1. Создайте GitHub репозиторий

Если еще не создали:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/wavify.git
git push -u origin main
```

### 2. Обновите package.json

Откройте `desktop/package.json` и замените:
```json
"publish": {
  "provider": "github",
  "owner": "YOUR_GITHUB_USERNAME",  // <-- Ваш username
  "repo": "wavify",                  // <-- Название репозитория
  "releaseType": "release"
}
```

### 3. Создайте GitHub Token

1. Перейдите на https://github.com/settings/tokens
2. Нажмите "Generate new token" → "Generate new token (classic)"
3. Дайте название: `Wavify Auto-Update`
4. Выберите права:
   - ✅ `repo` (полный доступ к репозиториям)
5. Нажмите "Generate token"
6. **СОХРАНИТЕ токен** - он больше не будет показан!

### 4. Установите токен

**Windows:**
```bash
setx GH_TOKEN "ваш_токен_здесь"
```

**Linux/Mac:**
```bash
export GH_TOKEN="ваш_токен_здесь"
# Добавьте в ~/.bashrc или ~/.zshrc для постоянного использования
echo 'export GH_TOKEN="ваш_токен_здесь"' >> ~/.bashrc
```

## Публикация обновления

### Шаг 1: Обновите версию

Откройте `desktop/package.json` и увеличьте версию:
```json
{
  "version": "2.0.1"  // Было 2.0.0
}
```

### Шаг 2: Создайте changelog

Создайте файл `CHANGELOG.md` в корне проекта:
```markdown
# Changelog

## [2.0.1] - 2024-01-15

### Добавлено
- Автообновление приложения
- Новые горячие клавиши

### Исправлено
- Ошибка воспроизведения Yandex Music
- Проблемы с медиа-клавишами
```

### Шаг 3: Соберите и опубликуйте

```bash
cd desktop

# Установите зависимости серверов
install-server-deps.bat

# Соберите и опубликуйте
npm run publish
```

Это автоматически:
1. Соберет приложение
2. Создаст GitHub Release
3. Загрузит установщик в Release

### Шаг 4: Проверьте Release

1. Перейдите на https://github.com/YOUR_USERNAME/wavify/releases
2. Убедитесь что создан новый Release с версией 2.0.1
3. Проверьте что прикреплен установщик (.exe для Windows)

## Как пользователи получат обновление

### Автоматическая проверка

При запуске приложения (через 10 секунд):
1. ✅ Проверяется наличие обновлений
2. ✅ Если есть - показывается диалог
3. ✅ Пользователь может скачать или отложить
4. ✅ После скачивания - предлагается перезапуск

### Ручная проверка

Пользователь может проверить обновления вручную:
1. Открыть Настройки
2. Прокрутить до "Обновления приложения"
3. Нажать "Проверить обновления"

## Версионирование

Используйте [Semantic Versioning](https://semver.org/):

- **MAJOR** (2.0.0 → 3.0.0) - несовместимые изменения API
- **MINOR** (2.0.0 → 2.1.0) - новые функции (обратно совместимые)
- **PATCH** (2.0.0 → 2.0.1) - исправления багов

## Типы обновлений

### Обычное обновление (Patch/Minor)

```bash
# Увеличьте версию
# 2.0.0 → 2.0.1 (patch)
# 2.0.0 → 2.1.0 (minor)

npm run publish
```

### Критическое обновление (Major)

```bash
# Увеличьте версию
# 2.0.0 → 3.0.0

npm run publish
```

## Тестирование обновлений

### Локальное тестирование

1. Создайте локальный сервер обновлений:

```javascript
// test-update-server.js
const express = require('express');
const app = express();

app.use(express.static('dist'));

app.get('/latest.yml', (req, res) => {
  res.sendFile(__dirname + '/dist/latest.yml');
});

app.listen(5000, () => {
  console.log('Update server running on http://localhost:5000');
});
```

2. Обновите `updater.js`:

```javascript
autoUpdater.setFeedURL({
  provider: 'generic',
  url: 'http://localhost:5000'
});
```

3. Соберите две версии (2.0.0 и 2.0.1)
4. Запустите сервер с версией 2.0.1
5. Запустите приложение версии 2.0.0
6. Проверьте что обновление работает

## Отключение автообновления

### Для разработки

Автообновление автоматически отключено в dev режиме (`npm start`).

### Для пользователей

Пока нет настройки отключения. Можно добавить:

```javascript
// В settings
const autoUpdateCheckbox = document.getElementById('auto-update-enabled');
autoUpdateCheckbox.checked = settings.autoUpdate !== false;

autoUpdateCheckbox.onchange = () => {
  settings.autoUpdate = autoUpdateCheckbox.checked;
  window.electronAPI.saveSettings({ autoUpdate: settings.autoUpdate });
};
```

## Troubleshooting

### Обновление не находится

1. Проверьте что `GH_TOKEN` установлен
2. Проверьте `owner` и `repo` в package.json
3. Проверьте что Release опубликован (не draft)
4. Проверьте логи: F12 → Console

### Ошибка при публикации

```
Error: GitHub token is not set
```

Решение: Установите `GH_TOKEN` (см. выше)

### Обновление скачивается но не устанавливается

1. Проверьте права администратора
2. Проверьте антивирус
3. Попробуйте ручную установку

## Альтернативные провайдеры

### Amazon S3

```json
"publish": {
  "provider": "s3",
  "bucket": "your-bucket",
  "region": "us-east-1"
}
```

### Generic Server

```json
"publish": {
  "provider": "generic",
  "url": "https://your-server.com/updates"
}
```

## Безопасность

### Code Signing (рекомендуется)

Для Windows нужен сертификат:

```json
"win": {
  "certificateFile": "path/to/cert.pfx",
  "certificatePassword": "password"
}
```

Без подписи Windows Defender может блокировать обновления.

## Мониторинг обновлений

Добавьте аналитику:

```javascript
// В updater.js
autoUpdater.on('update-downloaded', (info) => {
  // Отправьте событие в аналитику
  analytics.track('update_downloaded', {
    version: info.version,
    releaseDate: info.releaseDate
  });
});
```

## Полезные ссылки

- [electron-updater документация](https://www.electron.build/auto-update)
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [Semantic Versioning](https://semver.org/)
