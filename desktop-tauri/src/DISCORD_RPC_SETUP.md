# Discord Rich Presence - Настройка

## ✅ Что исправлено:
- Discord RPC теперь получает информацию о треке при воспроизведении
- Активность обновляется автоматически при смене трека
- Русский текст без эмодзи

## Почему нет аватарки и информации:

### Проблема 1: Нет изображения приложения
Discord требует загрузить изображение в Developer Portal.

**Решение:**
1. Перейдите на https://discord.com/developers/applications
2. Выберите ваше приложение (или создайте новое)
3. Перейдите в "Rich Presence" → "Art Assets"
4. Загрузите изображение с названием `wavify_logo` (512x512 пикселей)
5. Сохраните изменения

### Проблема 2: Изображения закомментированы в коде
Пока изображения не загружены, они закомментированы в коде.

**После загрузки изображения в Discord:**

Откройте `desktop/discord-rpc.js` и раскомментируйте строки с изображениями:

```javascript
// В методе setIdleActivity():
const activity = {
  details: 'Просмотр музыки',
  state: 'Готов к воспроизведению',
  largeImageKey: 'wavify_logo',  // Раскомментировать
  largeImageText: 'Wavify',
  smallImageText: 'Ожидание',
  startTimestamp: this.startTime
};

// В методе setPlayingActivity():
const activity = {
  details: `${title}`,
  state: `${artist}`,
  largeImageKey: 'wavify_logo',  // Раскомментировать
  largeImageText: 'Wavify - Музыкальный плеер',
  smallImageText: `Воспроизведение из ${sourceText}`,
  startTimestamp: Date.now()
};

// В методе setPausedActivity():
const activity = {
  details: `${title}`,
  state: `${artist} (На паузе)`,
  largeImageKey: 'wavify_logo',  // Раскомментировать
  largeImageText: 'Wavify - Музыкальный плеер',
  smallImageText: `Пауза - ${sourceText}`
};
```

## Быстрая настройка:

### Шаг 1: Создайте Discord приложение
1. https://discord.com/developers/applications → "New Application"
2. Название: "Wavify"
3. Скопируйте Application ID

### Шаг 2: Замените Client ID
В файле `desktop/discord-rpc.js`:
```javascript
this.clientId = 'ВАШ_APPLICATION_ID';
```

### Шаг 3: Загрузите изображение
1. Rich Presence → Art Assets
2. Загрузите изображение с названием `wavify_logo`
3. Размер: 512x512 пикселей

### Шаг 4: Раскомментируйте изображения в коде
См. примеры выше

### Шаг 5: Перезапустите приложение
```bash
npm start
```

## Проверка:
1. Запустите Discord
2. Запустите Wavify
3. Включите любой трек
4. В Discord должна появиться активность с:
   - Аватаркой приложения
   - Названием трека
   - Именем исполнителя
   - Источником (YouTube, Яндекс Музыка и т.д.)

## Если не работает:
- Проверьте что Discord запущен
- Проверьте Settings → Activity Privacy → "Display current activity"
- Перезапустите Discord
- Убедитесь что Client ID правильный
- Проверьте что изображение загружено с правильным названием `wavify_logo`