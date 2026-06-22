// CRITICAL: Global event listener for playlist loading
// Must be registered BEFORE playlists-library.js initializes
// This listener is in global scope and will be available immediately
console.log('🎵 Registering GLOBAL playlist:load event listener');

window.addEventListener('playlist:load', (e) => {
  console.log('🎵 GLOBAL playlist:load event received!');
  console.log('  Event detail:', e.detail);
  
  // Store the event data globally for initMainApp to use
  window._pendingPlaylistLoad = e.detail;
  
  // If initMainApp has already run, process immediately
  if (window._mainAppInitialized && window.loadTrack) {
    const { tracks, index } = e.detail;
    console.log('  Main app ready, loading track immediately');
    console.log('  Tracks:', tracks ? tracks.length : 'NO TRACKS');
    console.log('  Index:', index);
    
    // CRITICAL: Reset all playback modes when switching to playlist
    console.log('  🔄 Resetting playback modes for playlist switch');
    if (window.resetPlaybackModes) {
      window.resetPlaybackModes();
    }
    
    // Set currentPlaylist through the exposed property
    if (window.setCurrentPlaylist) {
      window.setCurrentPlaylist(tracks);
    }
    
    // Load the track first
    window.loadTrack(index);
    
    // Then set playing state and update buttons
    if (window.setIsPlaying) {
      window.setIsPlaying(true);
    }
    if (window.updatePlayButtons) {
      window.updatePlayButtons(true);
      console.log('  ✅ Play buttons updated to playing state');
    }
    
    // Auto-play after a short delay
    setTimeout(() => {
      const audio = document.getElementById('audio');
      if (audio) {
        console.log('  🎵 Starting playback...');
        audio.play().then(() => {
          console.log('  ✅ Playback started successfully');
        }).catch(err => {
          console.error('❌ Playback failed:', err);
          if (window.setIsPlaying) {
            window.setIsPlaying(false);
          }
          if (window.updatePlayButtons) {
            window.updatePlayButtons(false);
          }
        });
      }
    }, 100);
  } else {
    console.log('  Main app not ready yet, event stored for later');
  }
});

window._playlistLoadListenerRegistered = true;
console.log('✅ Global playlist:load listener registered');


// Immediate check: if main app is visible, initialize right away
setTimeout(() => {
  console.log('🔍 Immediate check for main app visibility');
  const mainApp = document.getElementById('main-app');
  const authScreen = document.getElementById('auth-screen');
  
  console.log('  mainApp found:', !!mainApp);
  console.log('  mainApp display:', mainApp ? mainApp.style.display : 'N/A');
  console.log('  authScreen found:', !!authScreen);
  console.log('  authScreen display:', authScreen ? authScreen.style.display : 'N/A');
  console.log('  _mainAppInitialized:', !!window._mainAppInitialized);
  
  if (!window._mainAppInitialized && mainApp) {
    // Check if main app is visible (multiple ways)
    const isMainAppVisible = (
      mainApp.style.display !== 'none' && 
      mainApp.style.display !== '' && 
      mainApp.offsetParent !== null
    ) || (
      !authScreen || 
      authScreen.style.display === 'none' || 
      authScreen.offsetParent === null
    );
    
    console.log('  isMainAppVisible:', isMainAppVisible);
    
    if (isMainAppVisible && typeof initMainApp === 'function') {
      console.warn('🚀 IMMEDIATE: Force initializing main app (already visible)');
      initMainApp();
    }
  }
}, 100);

// Fallback: if main app is not initialized within 2 seconds but user is on main page, force init
setTimeout(() => {
  if (!window._mainAppInitialized) {
    const mainApp = document.getElementById('main-app');
    const authScreen = document.getElementById('auth-screen');
    
    console.warn('⚠️ FALLBACK: Main app still not initialized after 2 seconds');
    console.warn('  mainApp:', !!mainApp, mainApp ? mainApp.style.display : 'N/A');
    console.warn('  authScreen:', !!authScreen, authScreen ? authScreen.style.display : 'N/A');
    
    if (mainApp && typeof initMainApp === 'function') {
      console.warn('⚠️ FALLBACK: Force initializing main app (auth check failed?)');
      initMainApp();
    }
  }
}, 2000);

// Отключение зума через Ctrl+Scroll
document.addEventListener('wheel', (e) => {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
  }
}, { passive: false });

// Отключение зума через жесты
document.addEventListener('gesturestart', (e) => {
  e.preventDefault();
});

document.addEventListener('gesturechange', (e) => {
  e.preventDefault();
});

document.addEventListener('gestureend', (e) => {
  e.preventDefault();
});

// Сброс зума через Ctrl+0
document.addEventListener('keydown', async (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === '0') {
    e.preventDefault();
    if (window.electronAPI && window.electronAPI.resetZoom) {
      await window.electronAPI.resetZoom();
      console.log('🔍 Zoom reset to 100%');
    }
  }
});

// Обработчик восстановления окна после сворачивания
if (window.electronAPI && window.electronAPI.onWindowRestored) {
  window.electronAPI.onWindowRestored(() => {
    console.log('🔄 Window restored, refreshing UI...');
    
    // Принудительно перерисовываем canvas и видео элементы
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });
    
    // Перезагружаем фоновое видео если есть
    const bgVideo = document.getElementById('bg-video');
    if (bgVideo && bgVideo.src) {
      const currentSrc = bgVideo.src;
      bgVideo.src = '';
      setTimeout(() => {
        bgVideo.src = currentSrc;
        bgVideo.play().catch(e => console.log('Video autoplay prevented'));
      }, 100);
    }
    
    // Обновляем визуализатор если играет музыка
    if (window.audio && !window.audio.paused) {
      console.log('🎵 Resuming audio visualization');
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 DOMContentLoaded fired');
  console.log('  Document ready state:', document.readyState);
  
  // ВРЕМЕННО: Пропускаем авторизацию, сразу показываем приложение
  console.log('⚠️ AUTH DISABLED: Skipping authentication, showing main app');
  
  const mainApp = document.getElementById('main-app');
  const authScreen = document.getElementById('auth-screen');
  
  if (authScreen) authScreen.style.display = 'none';
  if (mainApp) mainApp.style.display = 'block';
  
  initMainApp();
  return;
  
  // СТАРЫЙ КОД АВТОРИЗАЦИИ (закомментирован)
  /*
  // Check if main app is already visible (user already authenticated)
  console.log('  mainApp found:', !!mainApp);
  console.log('  mainApp display:', mainApp ? mainApp.style.display : 'N/A');
  console.log('  authScreen found:', !!authScreen);
  console.log('  authScreen display:', authScreen ? authScreen.style.display : 'N/A');
  
  if (mainApp && mainApp.style.display !== 'none' && (!authScreen || authScreen.style.display === 'none')) {
    console.log('🔄 Main app already visible, initializing immediately');
    initMainApp();
    return;
  }
  
  console.log('🔍 Checking session...');
  
  // Check for saved session first
  const session = await window.electronAPI.checkSession();
  
  if (session.authenticated) {
    console.log('Session found for user:', session.username);
    console.log('📊 Session data loaded, userAccounts should be populated now');
    
    // User has valid session, show main app
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
    initMainApp();
    
    // Update playlist counts IMMEDIATELY after session data is loaded
    // No delay needed - data is already loaded by checkSession()
    console.log('🔄 Updating playlist counts after session load (immediate)');
    if (window.updatePlaylistCounts) {
      window.updatePlaylistCounts();
    } else {
      console.warn('⚠️ updatePlaylistCounts not available yet, will retry');
      // Fallback: wait for playlists-library.js to load
      setTimeout(() => {
        if (window.updatePlaylistCounts) {
          console.log('🔄 Retry: Updating playlist counts');
          window.updatePlaylistCounts();
        }
      }, 100);
    }
    
    // Force reload playlist if on playlist page
    setTimeout(() => {
      if (window.reloadCurrentPlaylist) {
        console.log('🔄 Force reloading playlist after session load');
        window.reloadCurrentPlaylist();
      }
    }, 200);
    
    return;
  }
  
  console.log('🔍 Checking authentication...');
  
  // No valid session, check authentication
  const isAuthenticated = window.electronAPI.isAuthenticated();
  
  if (!isAuthenticated) {
    console.log('❌ Not authenticated, showing auth screen');
    // Show auth screen
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('main-app').style.display = 'none';
    
    // Auth form handlers
    setupAuthHandlers();
    return;
  }
  
  console.log('✅ Authenticated, showing main app');
  // User is authenticated, show main app
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('main-app').style.display = 'block';
  
  // Initialize main app
  initMainApp();
  */
});

function setupAuthHandlers() {
  console.log('Setting up auth handlers...');
  
  // Initialize Telegram Login Button
  initTelegramLogin();
  
  const loginForm = document.getElementById('login-form');
  const loginFieldsForm = document.getElementById('login-fields-form');
  const registerForm = document.getElementById('register-form');
  const registerFormStep2 = document.getElementById('register-form-step2');
  const registerFormStep3 = document.getElementById('register-form-step3');
  const showLoginFields = document.getElementById('show-login-fields');
  const showRegister = document.getElementById('show-register');
  const showRegisterFromLogin = document.getElementById('show-register-from-login');
  const backToMain = document.getElementById('back-to-main');
  const backToMainFromRegister = document.getElementById('back-to-main-from-register');
  const backToStep1 = document.getElementById('back-to-step1');
  const backToStep2 = document.getElementById('back-to-step2');
  const loginBtn = document.getElementById('login-btn');
  const registerNextBtn = document.getElementById('register-next-btn');
  const registerNextBtnStep2 = document.getElementById('register-next-btn-step2');
  const registerBtn = document.getElementById('register-btn');
  
  // Registration data storage
  let registrationData = {
    email: '',
    password: '',
    username: ''
  };
  
  if (!loginBtn || !registerBtn) {
    console.error('Auth buttons not found!');
    return;
  }
  
  console.log('Auth buttons found, attaching handlers...');
  
  // Show login fields
  showLoginFields.onclick = (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    loginFieldsForm.style.display = 'block';
    document.getElementById('login-error').textContent = '';
  };
  
  // Show register from main
  showRegister.onclick = (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    document.getElementById('register-error').textContent = '';
  };
  
  // Show register from login fields
  showRegisterFromLogin.onclick = (e) => {
    e.preventDefault();
    loginFieldsForm.style.display = 'none';
    registerForm.style.display = 'block';
    document.getElementById('login-error').textContent = '';
  };
  
  // Back to main from login fields
  backToMain.onclick = (e) => {
    e.preventDefault();
    loginFieldsForm.style.display = 'none';
    loginForm.style.display = 'block';
    document.getElementById('login-error').textContent = '';
  };
  
  // Back to main from register step 1
  backToMainFromRegister.onclick = (e) => {
    e.preventDefault();
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
    document.getElementById('register-error').textContent = '';
    registrationData = { email: '', password: '', username: '' };
  };
  
  // Register Step 1: Email -> Step 2
  registerNextBtn.onclick = (e) => {
    e.preventDefault();
    const email = document.getElementById('register-email').value.trim();
    const errorEl = document.getElementById('register-error');
    
    if (!email) {
      errorEl.textContent = 'Введите почту';
      return;
    }
    
    // Simple email validation
    if (!email.includes('@') || !email.includes('.')) {
      errorEl.textContent = 'Введите корректную почту';
      return;
    }
    
    registrationData.email = email;
    registerForm.style.display = 'none';
    registerFormStep2.style.display = 'block';
    errorEl.textContent = '';
  };
  
  // Back to step 1 from step 2
  backToStep1.onclick = (e) => {
    e.preventDefault();
    registerFormStep2.style.display = 'none';
    registerForm.style.display = 'block';
    document.getElementById('register-error-step2').textContent = '';
  };
  
  // Register Step 2: Password -> Step 3
  registerNextBtnStep2.onclick = (e) => {
    e.preventDefault();
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;
    const errorEl = document.getElementById('register-error-step2');
    
    if (!password || !passwordConfirm) {
      errorEl.textContent = 'Заполните оба поля';
      return;
    }
    
    if (password.length < 6) {
      errorEl.textContent = 'Пароль должен быть минимум 6 символов';
      return;
    }
    
    if (password !== passwordConfirm) {
      errorEl.textContent = 'Пароли не совпадают';
      return;
    }
    
    registrationData.password = password;
    registerFormStep2.style.display = 'none';
    registerFormStep3.style.display = 'block';
    errorEl.textContent = '';
  };
  
  // Back to step 2 from step 3
  backToStep2.onclick = (e) => {
    e.preventDefault();
    registerFormStep3.style.display = 'none';
    registerFormStep2.style.display = 'block';
    document.getElementById('register-error-step3').textContent = '';
  };
  
  // Register Step 3: Username -> Complete
  registerBtn.onclick = async () => {
    const username = document.getElementById('register-username').value.trim();
    const errorEl = document.getElementById('register-error-step3');
    
    if (!username) {
      errorEl.textContent = 'Введите ник';
      return;
    }
    
    if (username.length < 3) {
      errorEl.textContent = 'Ник должен быть минимум 3 символа';
      return;
    }
    
    registrationData.username = username;
    
    console.log('Attempting registration:', registrationData);
    const result = await window.electronAPI.register(registrationData.username, registrationData.password);
    console.log('Registration result:', result);
    
    if (result.success) {
      // Auto-login after registration
      const loginResult = await window.electronAPI.login(registrationData.username, registrationData.password);
      if (loginResult.success) {
        console.log('📊 Registration and login successful');
        
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        initMainApp();
        
        // Update playlist counts
        if (window.updatePlaylistCounts) {
          window.updatePlaylistCounts();
        }
        
        // Reset registration data
        registrationData = { email: '', password: '', username: '' };
      }
    } else {
      errorEl.textContent = result.error;
    }
  };
  
  // Login
  loginBtn.onclick = async () => {
    console.log('Login button clicked');
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    
    if (!username || !password) {
      errorEl.textContent = 'Заполните все поля';
      return;
    }
    
    console.log('Attempting login for:', username);
    const result = await window.electronAPI.login(username, password);
    console.log('Login result:', result);
    
    if (result.success) {
      console.log('📊 Login successful, data should be loaded');
      
      // Hide auth, show main app
      document.getElementById('auth-screen').style.display = 'none';
      document.getElementById('main-app').style.display = 'block';
      initMainApp();
      
      // Update playlist counts IMMEDIATELY after login
      console.log('🔄 Updating playlist counts after login (immediate)');
      if (window.updatePlaylistCounts) {
        window.updatePlaylistCounts();
      } else {
        console.warn('⚠️ updatePlaylistCounts not available yet, will retry');
        setTimeout(() => {
          if (window.updatePlaylistCounts) {
            console.log('🔄 Retry: Updating playlist counts');
            window.updatePlaylistCounts();
          }
        }, 100);
      }
      
      // Force reload playlist if on playlist page
      setTimeout(() => {
        if (window.reloadCurrentPlaylist) {
          console.log('🔄 Force reloading playlist after login');
          window.reloadCurrentPlaylist();
        }
      }, 200);
    } else {
      errorEl.textContent = result.error;
    }
  };
  
  // Register
  registerBtn.onclick = async () => {
    console.log('Register button clicked');
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;
    const errorEl = document.getElementById('register-error');
    
    if (!username || !password || !passwordConfirm) {
      errorEl.textContent = 'Заполните все поля';
      return;
    }
    
    if (password !== passwordConfirm) {
      errorEl.textContent = 'Пароли не совпадают';
      return;
    }
    
    console.log('Attempting registration for:', username);
    const result = await window.electronAPI.register(username, password);
    console.log('Registration result:', result);
    
    if (result.success) {
      // Auto-login after registration
      const loginResult = await window.electronAPI.login(username, password);
      if (loginResult.success) {
        console.log('📊 Registration and login successful, data should be loaded');
        
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        initMainApp();
        
        // Update playlist counts IMMEDIATELY after registration
        console.log('🔄 Updating playlist counts after registration (immediate)');
        if (window.updatePlaylistCounts) {
          window.updatePlaylistCounts();
        } else {
          console.warn('⚠️ updatePlaylistCounts not available yet, will retry');
          setTimeout(() => {
            if (window.updatePlaylistCounts) {
              console.log('🔄 Retry: Updating playlist counts');
              window.updatePlaylistCounts();
            }
          }, 100);
        }
        
        // Force reload playlist if on playlist page
        setTimeout(() => {
          if (window.reloadCurrentPlaylist) {
            console.log('🔄 Force reloading playlist after registration');
            window.reloadCurrentPlaylist();
          }
        }, 200);
      }
    } else {
      errorEl.textContent = result.error;
    }
  };
  
  // Enter key support
  document.getElementById('login-password').onkeypress = (e) => {
    if (e.key === 'Enter') loginBtn.click();
  };
  
  document.getElementById('register-password-confirm').onkeypress = (e) => {
    if (e.key === 'Enter') registerBtn.click();
  };
  
  console.log('Auth handlers attached successfully');
}

// Telegram Login via Bot
function initTelegramLogin() {
  const btn = document.getElementById('telegram-login-btn');
  const statusEl = document.getElementById('telegram-auth-status');
  
  if (!btn) return;
  
  btn.onclick = async () => {
    // Генерируем уникальный код
    const authCode = 'AUTH_' + Math.random().toString(36).substring(2, 15);
    
    // Открываем бота с кодом
    const botUrl = `https://t.me/weavify_robot?start=${authCode}`;
    window.electronAPI.openExternal(botUrl);
    
    // Показываем статус
    statusEl.textContent = 'Ожидание авторизации в Telegram...';
    btn.disabled = true;
    
    // Проверяем статус каждые 2 секунды
    const checkInterval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:3004/api/auth-status/${authCode}`);
        const data = await response.json();
        
        if (data.completed) {
          clearInterval(checkInterval);
          statusEl.textContent = '✅ Авторизация успешна!';
          
          // Регистрируем/логиним пользователя
          const result = await window.electronAPI.loginWithTelegramCode(data);
          
          if (result.success) {
            console.log('🎉 Telegram login successful, initializing main app');
            console.log('📊 Telegram login data should be loaded');
            
            // Показываем красивый загрузочный экран
            window.loadingScreen.show({
              title: 'Добро пожаловать!',
              subtitle: `Привет, ${data.username || 'пользователь'}!`
            });
            
            // Скрываем экран авторизации
            document.getElementById('auth-screen').style.display = 'none';
            document.getElementById('main-app').style.display = 'block';
            
            // Загружаем данные с анимацией
            await window.loadingScreen.showWithSteps([
              {
                message: 'Загружаем ваш профиль...',
                duration: 600,
                action: async () => {
                  if (!window._mainAppInitialized) {
                    console.log('🚀 Calling initMainApp after Telegram auth');
                    initMainApp();
                  }
                }
              },
              {
                message: 'Синхронизируем плейлисты...',
                duration: 600,
                action: async () => {
                  if (window.updatePlaylistCounts) {
                    window.updatePlaylistCounts();
                  }
                }
              },
              {
                message: 'Загружаем вашу музыку...',
                duration: 600,
                action: async () => {
                  if (window.updateHomePage) {
                    await window.updateHomePage();
                  }
                }
              },
              {
                message: 'Готово! Наслаждайтесь музыкой 🎶',
                duration: 400
              }
            ]);
            
            // Скрываем загрузочный экран
            await window.loadingScreen.hide(300);
            
            // Force reload playlist if on playlist page
            setTimeout(() => {
              if (window.reloadCurrentPlaylist) {
                console.log('🔄 Force reloading playlist after Telegram login');
                window.reloadCurrentPlaylist();
              }
            }, 200);
          } else {
            statusEl.textContent = '❌ ' + (result.error || 'Ошибка авторизации');
            btn.disabled = false;
          }
        } else if (data.expired) {
          clearInterval(checkInterval);
          statusEl.textContent = '❌ Код истек, попробуйте снова';
          btn.disabled = false;
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    }, 2000);
    
    // Таймаут 5 минут
    setTimeout(() => {
      clearInterval(checkInterval);
      if (btn.disabled) {
        statusEl.textContent = '❌ Время ожидания истекло';
        btn.disabled = false;
      }
    }, 5 * 60 * 1000);
  };
}

function initMainApp() {
  // Защита от повторной инициализации
  if (window._mainAppInitialized) {
    console.log('⚠️ Main app already initialized, skipping...');
    return;
  }
  
  // Don't mark as initialized yet - wait until functions are exported
  console.log('🚀 Main app initialization started...');
  
  // Check if musicServer is available, use fallback if not
  const SERVER_URL = window.musicServer?.url || 'http://localhost:3001';
  const YOUTUBE_SERVER_URL = window.musicServer?.youtubeUrl || 'http://localhost:3001';
  
  console.log('🌐 Server URLs:', { SERVER_URL, YOUTUBE_SERVER_URL });
  
  // НОВОЕ: Инициализируем конвертер треков
  const trackConverter = new TrackConverterService(YOUTUBE_SERVER_URL);
  
  // State
  let playlist = []; // Сохраненный плейлист пользователя
  let currentPlaylist = []; // Текущий плейлист для воспроизведения
  let searchPlaylist = []; // Временный плейлист для поиска
  let currentIndex = -1;
  let isPlaying = false;
  
  // Вспомогательная функция для загрузки плейлиста с локальными треками
  async function loadFullPlaylist() {
    // Загружаем основной плейлист
    let fullPlaylist = await window.electronAPI.getPlaylist();
    
    // Загружаем локальные треки (offline tracks) и добавляем их
    try {
      const offlineTracks = await window.electronAPI.getOfflineTracks();
      if (offlineTracks && offlineTracks.length > 0) {
        console.log(`📁 Loading ${offlineTracks.length} offline tracks...`);
        const localTracksWithFlag = offlineTracks.map(track => ({
          ...track,
          isLocal: true
        }));
        fullPlaylist = [...localTracksWithFlag, ...fullPlaylist];
      }
    } catch (error) {
      console.error('❌ Failed to load offline tracks:', error);
    }
    
    return fullPlaylist;
  }
  let currentSource = 'all';
  let isSearchMode = false; // Флаг режима поиска
  let currentLyrics = null; // Текущие тексты песен
  let isShuffleEnabled = false; // Режим перемешивания
  let isRepeatEnabled = false; // Режим повтора (off/all/one)
  let repeatMode = 'off'; // 'off', 'all', 'one'

  // Кэшируем DOM элементы для производительности
  const audio = document.getElementById('audio');
  audio.preload = 'auto';
  audio.crossOrigin = 'anonymous';
  
  // Делаем pages глобальной для доступа из других функций
  window.pages = {
    home: document.getElementById('home-page'),
    search: document.getElementById('search-page'),
    playlist: document.getElementById('playlist-page'),
    artist: document.getElementById('artist-page'),
    artists: document.getElementById('artists-page'),
    servers: document.getElementById('servers-page'),
    profile: document.getElementById('profile-page'),
    settings: document.getElementById('settings-page'),
    player: document.getElementById('player-page')
  };
  
  const pages = window.pages; // Локальная ссылка для обратной совместимости
  
  // Отладка: проверяем что все страницы найдены
  console.log('📄 Pages initialized:');
  Object.entries(pages).forEach(([name, element]) => {
    if (element) {
      console.log(`  ✅ ${name}: found (id: ${element.id})`);
    } else {
      console.error(`  ❌ ${name}: NOT FOUND!`);
    }
  });
  
  // Кэшируем часто используемые элементы
  const domCache = {
    miniTitle: document.getElementById('mini-title'),
    miniArtist: document.getElementById('mini-artist'),
    miniCover: document.getElementById('mini-cover'),
    miniProgressFill: document.getElementById('mini-progress-fill'),
    miniCurrentTime: document.getElementById('mini-current-time'),
    miniTotalTime: document.getElementById('mini-total-time'),
    playerTitleLarge: document.getElementById('player-title-large'),
    playerArtistLarge: document.getElementById('player-artist-large'),
    playerCoverLarge: document.getElementById('player-cover-large'),
    progressFillLarge: document.getElementById('progress-fill-large'),
    currentTimeLarge: document.getElementById('current-time-large'),
    totalTimeLarge: document.getElementById('total-time-large'),
    lyricsContainer: document.getElementById('lyrics-container'),
    videoBackground: document.getElementById('video-background')
  };

  // Audio event listeners (минимальное логирование для производительности)
  // audio.onloadstart = () => {}; // Отключено
  // audio.onloadeddata = () => {}; // Отключено
  // audio.oncanplay = () => {}; // Отключено
  // audio.oncanplaythrough = () => {}; // Отключено
  // audio.onplay = () => {}; // Отключено
  // audio.onplaying = () => {}; // Отключено
  // audio.onpause = () => {}; // Отключено
  audio.onerror = (e) => {
    const errorCode = audio.error?.code;
    const errorMessage = audio.error?.message;
    console.error('❌ Audio error:', errorCode, errorMessage);
    
    // Коды ошибок:
    // 1 = MEDIA_ERR_ABORTED - загрузка прервана пользователем
    // 2 = MEDIA_ERR_NETWORK - сетевая ошибка
    // 3 = MEDIA_ERR_DECODE - ошибка декодирования
    // 4 = MEDIA_ERR_SRC_NOT_SUPPORTED - формат не поддерживается
    
    if (errorCode === 2 || errorCode === 4) {
      // Сетевая ошибка или неподдерживаемый формат - пробуем следующий трек
      console.log('⏭️ Network/format error, skipping to next track...');
      
      // Показываем уведомление пользователю
      if (window.showToast) {
        const track = getCurrentTrack();
        window.showToast(`Ошибка воспроизведения: ${track?.title || 'трек'}. Переход к следующему...`, 'error');
      }
      
      // Переходим к следующему треку через 1 секунду
      setTimeout(() => {
        if (window.nextTrack) {
          window.nextTrack();
        }
      }, 1000);
    }
  };
  
  // Discord RPC: уведомляем когда трек начинает играть
  audio.addEventListener('playing', () => {
    const track = getCurrentTrack();
    console.log('🎵 Audio playing event, track:', track ? track.title : 'NO TRACK');
    console.log('🎵 electronAPI available:', !!window.electronAPI);
    console.log('🎵 discordTrackStart available:', !!window.electronAPI?.discordTrackStart);
    
    if (track && window.electronAPI && window.electronAPI.discordTrackStart) {
      // Убеждаемся что у трека есть source
      if (!track.source) {
        track.source = currentSource || 'youtube';
      }
      const duration = audio.duration || null;
      console.log('🎵 Calling discordTrackStart with:', { title: track.title, duration });
      window.electronAPI.discordTrackStart(track, duration);
    } else {
      console.warn('⚠️ Cannot call discordTrackStart:', {
        hasTrack: !!track,
        hasElectronAPI: !!window.electronAPI,
        hasMethod: !!window.electronAPI?.discordTrackStart
      });
    }
  });
  
  // Discord RPC: уведомляем когда трек ставится на паузу
  audio.addEventListener('pause', () => {
    const track = getCurrentTrack();
    if (track && window.electronAPI && window.electronAPI.discordTrackPause) {
      // Убеждаемся что у трека есть source
      if (!track.source) {
        track.source = currentSource || 'youtube';
      }
      const duration = audio.duration || null;
      const currentTime = audio.currentTime || 0;
      window.electronAPI.discordTrackPause(track, duration, currentTime);
    }
  });
  
  // Функция для получения текущего трека
  function getCurrentTrack() {
    const activePlaylist = isSearchMode ? searchPlaylist : (currentPlaylist.length > 0 ? currentPlaylist : playlist);
    if (currentIndex >= 0 && currentIndex < activePlaylist.length) {
      return activePlaylist[currentIndex];
    }
    return null;
  }
  
  audio.onstalled = () => {
    // Не перезагружаем автоматически - это прерывает воспроизведение
  };
  // audio.onwaiting = () => {}; // Отключено
  
  // Периодическая проверка состояния аудио (каждые 10 секунд, оптимизировано)
  setInterval(() => {
    // Проверяем только если приложение активно
    if (document.visibilityState !== 'visible') return;
    
    if (isPlaying && audio.paused && !audio.ended) {
      console.warn('⚠️ Audio state mismatch: isPlaying=true but audio.paused=true');
      // Пытаемся восстановить воспроизведение
      audio.play().catch(err => {
        console.error('Failed to resume playback:', err);
        isPlaying = false;
        updatePlayButtons(false);
      });
    }
    if (audio.ended) {
      console.warn('⚠️ Audio element is in ended state but onended did not fire!');
      // Принудительно вызываем handleTrackEnd если onended не сработал
      if (!nearEndTriggered) {
        nearEndTriggered = true;
        console.log('🔧 Forcing track end handler...');
        handleTrackEnd();
      }
    }
  }, 10000);

  // Оптимизация: останавливаем видео и анимации когда окно неактивно
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      document.body.classList.add('window-hidden');
      if (domCache.videoBackground && !domCache.videoBackground.paused) {
        domCache.videoBackground.pause();
      }
    } else {
      document.body.classList.remove('window-hidden');
      if (domCache.videoBackground && domCache.videoBackground.src && domCache.videoBackground.paused) {
        domCache.videoBackground.play().catch(err => console.log('Video resume failed:', err));
      }
    }
  });

  // Window controls
  document.getElementById('min-btn').onclick = () => window.electronAPI.minimize();
  document.getElementById('max-btn').onclick = () => window.electronAPI.maximize();
  document.getElementById('close-btn').onclick = () => window.electronAPI.close();

  // API Functions
  async function searchTracks(query, source = 'youtube') {
    console.log(`[SEARCH] searchTracks called with query="${query}", source="${source}"`);
    
    try {
      // Если source = 'all', ищем в приоритетном порядке: Яндекс → SoundCloud → YouTube
      if (source === 'all') {
        console.log('[UNIFIED] Searching in all sources with priority: Yandex → SoundCloud → YouTube');
        
        const results = [];
        
        // 1. Яндекс.Музыка (приоритет 1)
        try {
          const yandexUrl = `${YOUTUBE_SERVER_URL}/api/yandex/search?q=${encodeURIComponent(query)}&limit=10`;
          const yandexResponse = await fetch(yandexUrl);
          if (yandexResponse.ok) {
            const yandexData = await yandexResponse.json();
            if (Array.isArray(yandexData) && yandexData.length > 0) {
              results.push(...yandexData);
              console.log(`[UNIFIED] Found ${yandexData.length} results from Yandex`);
            }
          }
        } catch (error) {
          console.log('[UNIFIED] Yandex search failed:', error.message);
        }
        
        // 2. SoundCloud (приоритет 2)
        try {
          const soundcloudUrl = `${YOUTUBE_SERVER_URL}/api/soundcloud/search?q=${encodeURIComponent(query)}&limit=10`;
          const soundcloudResponse = await fetch(soundcloudUrl);
          if (soundcloudResponse.ok) {
            const soundcloudData = await soundcloudResponse.json();
            if (Array.isArray(soundcloudData) && soundcloudData.length > 0) {
              results.push(...soundcloudData);
              console.log(`[UNIFIED] Found ${soundcloudData.length} results from SoundCloud`);
            }
          }
        } catch (error) {
          console.log('[UNIFIED] SoundCloud search failed:', error.message);
        }
        
        // 3. YouTube (приоритет 3, только если мало результатов)
        if (results.length < 5) {
          try {
            const youtubeUrl = `${YOUTUBE_SERVER_URL}/api/search?q=${encodeURIComponent(query)}&limit=10`;
            const youtubeResponse = await fetch(youtubeUrl);
            if (youtubeResponse.ok) {
              const youtubeData = await youtubeResponse.json();
              if (Array.isArray(youtubeData) && youtubeData.length > 0) {
                results.push(...youtubeData);
                console.log(`[UNIFIED] Found ${youtubeData.length} results from YouTube`);
              }
            }
          } catch (error) {
            console.log('[UNIFIED] YouTube search failed:', error.message);
          }
        }
        
        console.log(`[UNIFIED] Found ${results.length} total results from ${source === 'all' ? 'all sources' : source}`);
        return results;
      }
      
      // Для конкретного источника - используем старую логику
      let url;
      if (source === 'youtube') {
        url = `${YOUTUBE_SERVER_URL}/api/search?q=${encodeURIComponent(query)}`;
        console.log('[SEARCH] YouTube URL:', url);
      } else if (source === 'soundcloud') {
        url = `${YOUTUBE_SERVER_URL}/api/soundcloud/search?q=${encodeURIComponent(query)}&limit=20`;
        console.log('[SEARCH] SoundCloud URL:', url);
      } else if (source === 'yandex') {
        url = `${YOUTUBE_SERVER_URL}/api/yandex/search?q=${encodeURIComponent(query)}`;
        console.log('[SEARCH] Yandex URL:', url);
      } else if (source === 'spotify') {
        url = `${YOUTUBE_SERVER_URL}/api/spotify/search?q=${encodeURIComponent(query)}&limit=20`;
        console.log('[SEARCH] Spotify URL:', url);
      } else {
        url = `${YOUTUBE_SERVER_URL}/api/search?q=${encodeURIComponent(query)}`;
        console.log('[SEARCH] Default (YouTube) URL:', url);
      }
      
      console.log('[SEARCH] Fetching from:', url);
      const response = await fetch(url);
      console.log('[SEARCH] Response status:', response.status);
      const data = await response.json();
      console.log('[SEARCH] Response data:', data);
      
      // Проверяем на ошибку от API
      if (data.error) {
        console.error('API error:', data.error);
        return [];
      }
      
      // Проверяем что это массив
      if (!Array.isArray(data)) {
        console.error('Invalid response format:', data);
        return [];
      }
      
      return data;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  async function getTrendingTracks() {
    try {
      // Используем новый endpoint с кешированием
      const response = await fetch(`${YOUTUBE_SERVER_URL}/api/popular?limit=20`);
      return await response.json();
    } catch (error) {
      console.error('Popular tracks error:', error);
      return [];
    }
  }
  
  // Функция для воспроизведения трека с автопереключением источника
  async function playTrackFromPopular(track) {
    console.log(`Playing popular track: ${track.title} from ${track.source}`);
    
    // Создаем временный трек для воспроизведения
    const tempTrack = {
      title: track.title,
      artist: track.artist,
      url: track.url,
      cover: track.thumbnail,
      duration: track.duration,
      source: track.source,
      isTemp: true
    };
    
    // КРИТИЧНО: Выключаем режим волны при переходе к поиску
    isWaveMode = false;
    
    // Добавляем во временный плейлист
    searchPlaylist = [tempTrack];
    isSearchMode = true;
    
    // Загружаем и воспроизводим
    loadTrack(0);
    if (!isPlaying) togglePlay();
  }

  async function getYandexWave(batches = 5, queue = '') {
    try {
      const queueParam = queue ? `&queue=${encodeURIComponent(queue)}` : '';
      console.log(`🌊 Requesting Yandex Wave tracks (${batches} batches${queue ? ', with queue' : ''})...`);
      const response = await fetch(`${YOUTUBE_SERVER_URL}/api/yandex/wave?batches=${batches}${queueParam}`);
      if (response.status === 401) {
        console.log('❌ Yandex Music not authenticated');
        return null;
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const tracks = await response.json();
      console.log('✅ Received', tracks?.length || 0, 'wave tracks from server');
      return tracks;
    } catch (error) {
      console.error('❌ Yandex wave error:', error.message);
      return null;
    }
  }

  async function getYandexChart() {
    try {
      const response = await fetch(`${YOUTUBE_SERVER_URL}/api/yandex/chart`);
      if (response.status === 401) {
        console.log('Yandex Music not authenticated, skipping...');
        return null;
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.log('Yandex chart not available:', error.message);
      return null;
    }
  }

  // Глобальная переменная для хранения чарта
  let currentChart = [];

  // Воспроизведение трека из чарта
  async function playTrackFromChart(track, chartTracks, startIndex) {
    console.log('Playing from chart, track:', track.title, 'index:', startIndex);
    
    // Сбрасываем все режимы воспроизведения
    resetPlaybackModes();
    
    // Устанавливаем чарт как текущий плейлист
    currentPlaylist = [...chartTracks];
    
    // Обновляем главную страницу
    if (window.updateHomePage) {
      window.updateHomePage();
    }
    
    // Загружаем трек по индексу
    currentIndex = startIndex;
    loadTrack(startIndex);
    
    // Автовоспроизведение
    isPlaying = true;
    updatePlayButtons(true);
    
    setTimeout(() => {
      audio.play().catch(err => console.error('Chart play failed:', err));
    }, 100);
    
    // Player Page открывается только при клике на mini-player
  }

  // Navigation
  const sidebarButtons = document.querySelectorAll('.sidebar-btn[data-page]');
  console.log(`🔘 Found ${sidebarButtons.length} sidebar buttons with data-page attribute`);
  
  sidebarButtons.forEach(btn => {
    console.log(`  - Button: ${btn.dataset.page} (title: ${btn.title})`);
    
    btn.onclick = () => {
      const page = btn.dataset.page;
      console.log('🔘 Sidebar button clicked:', page);
      
      // Убираем active у всех кнопок
      document.querySelectorAll('.sidebar-btn[data-page]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Мгновенно скрываем все страницы
      Object.values(pages).forEach(p => {
        if (p) {
          p.classList.remove('active');
        }
      });
      
      // Мгновенно показываем новую страницу
      if (pages[page]) {
        pages[page].classList.add('active');
        console.log('  ✅ Showing page:', pages[page].id);
      } else {
        console.error('  ❌ Page not found:', page);
      }
      
      // Also hide player and lyrics pages
      if (pages.player) {
        pages.player.classList.remove('active');
      }
      const lyricsPage = document.getElementById('lyrics-page');
      if (lyricsPage) {
        lyricsPage.classList.remove('active');
      }
      
      // Initialize servers page when navigating to it
      if (page === 'servers' && typeof initServersPage === 'function') {
        console.log('🔧 Initializing servers page...');
        initServersPage();
      }
      
      // Auto-click main playlist when navigating to playlist page
      if (page === 'playlist') {
        console.log('📚 Navigating to playlist page, auto-selecting main playlist');
        
        // Smart retry - wait for data to be loaded
        function tryClickPlaylist(attempt = 1, maxAttempts = 10) {
          console.log(`📚 Attempt ${attempt}/${maxAttempts}: Checking if data is loaded...`);
          
          const playlist = window.electronAPI.getPlaylist();
          const hasData = playlist && playlist.length > 0;
          
          console.log(`📚 Data check: ${hasData ? `${playlist.length} tracks found` : 'no data yet'}`);
          
          if (hasData || attempt >= maxAttempts) {
            const mainPlaylistItem = document.querySelector('[data-playlist="main"]');
            if (mainPlaylistItem && !mainPlaylistItem.classList.contains('active')) {
              console.log('📚 Auto-clicking main playlist tab');
              mainPlaylistItem.click();
            } else {
              console.log('📚 Main playlist already active or not found');
            }
          } else {
            console.log('📚 Data not loaded yet, retrying in 100ms...');
            setTimeout(() => tryClickPlaylist(attempt + 1, maxAttempts), 100);
          }
        }
        
        setTimeout(() => tryClickPlaylist(), 50);
      }
      
      // Load artists page when navigating to it
      if (page === 'artists') {
        loadArtistsPage();
      }
    };
  });

  // Source selection
  document.querySelectorAll('.source-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.source-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSource = btn.dataset.source;
      
      // Save to storage
      window.electronAPI.saveSettings({ defaultSource: currentSource });
      
      // Синхронизируем с настройками (радио-кнопки)
      const radio = document.querySelector(`input[name="default-source"][value="${currentSource}"]`);
      if (radio) {
        radio.checked = true;
      }
      
      console.log('Source changed to:', currentSource);
    };
  });

  // Load track
  async function loadTrack(index) {
    console.log('🎵 [LOAD TRACK] Called with index:', index);
    console.log('  isSearchMode:', isSearchMode);
    console.log('  isWaveMode:', isWaveMode);
    console.log('  currentPlaylist.length:', currentPlaylist.length);
    console.log('  playlist.length:', playlist.length);
    console.log('  searchPlaylist.length:', typeof searchPlaylist !== 'undefined' ? searchPlaylist.length : 'undefined');
    
    // Сбрасываем флаг окончания трека
    nearEndTriggered = false;
    
    // Выбираем правильный плейлист
    // Если есть currentPlaylist и мы не в режиме поиска - используем его (для чарта, волны и т.д.)
    const activePlaylist = isSearchMode ? searchPlaylist : (currentPlaylist.length > 0 ? currentPlaylist : playlist);
    
    console.log('  Selected activePlaylist length:', activePlaylist.length);
    
    if (index < 0 || index >= activePlaylist.length) {
      console.error('❌ [LOAD TRACK] Invalid track index:', index, 'activePlaylist.length:', activePlaylist.length);
      return;
    }
    
    currentIndex = index;
    const track = activePlaylist[index];
    
    console.log('  Track to load:', track.title, 'by', track.artist);
    console.log('  Track URL:', track.url);
    
    // Обновляем информацию в блоке "Моя волна" если играет из волны
    if (isWaveMode) {
      const waveNowPlaying = document.getElementById('wave-now-playing');
      const waveTrackInfo = document.getElementById('wave-track-info');
      if (waveNowPlaying && waveTrackInfo) {
        waveTrackInfo.textContent = `${track.title} — ${track.artist}`;
        waveNowPlaying.style.display = 'flex';
      }
      
      // Обновляем обложки волны - показываем ТЕКУЩИЙ трек + следующие
      const tracksToShow = activePlaylist.slice(index, index + 8); // Текущий + следующие 7 треков
      if (tracksToShow.length > 0) {
        loadWaveTracks(tracksToShow);
      }
    } else {
      // Скрываем если не из волны
      const waveNowPlaying = document.getElementById('wave-now-playing');
      if (waveNowPlaying) {
        waveNowPlaying.style.display = 'none';
      }
    }
    
    // Обновляем состояние волны в зависимости от того, играет ли музыка
    if (isWaveMode) {
      const waveCard = document.getElementById('my-wave-card');
      if (waveCard) {
        // Если музыка играет - оставляем playing, иначе paused
        if (isPlaying && !audio.paused) {
          console.log('🌊 [LOAD TRACK] Keeping wave in playing state');
          waveCard.classList.remove('paused');
          waveCard.classList.add('playing');
        } else {
          console.log('🌊 [LOAD TRACK] Setting wave to paused state');
          waveCard.classList.remove('playing');
          waveCard.classList.add('paused');
        }
      }
    }
    
    // В режиме волны - подгружаем новые треки когда начинается предпоследний трек
    if (isWaveMode && !isLoadingMoreWave && index >= activePlaylist.length - 2) {
      console.log('🌊 Loading more wave tracks (starting track', index + 1, 'of', activePlaylist.length, ')...');
      isLoadingMoreWave = true;
      
      // Строим queue из всех yandexId треков
      const queueIds = Array.from(waveTrackIds).join(',');
      
      getYandexWave(5, queueIds).then(newTracks => {
        if (newTracks && newTracks.length > 0) {
          // Фильтруем дубликаты по ID и схожим названиям
          const uniqueTracks = newTracks.filter(track => {
            // Проверка по ID
            if (waveTrackIds.has(track.yandexId)) {
              console.log('  ⏭️ Skipping duplicate ID:', track.title);
              return false;
            }
            
            // Проверка по схожести названий
            const trackTitle = track.title;
            for (const existingTitle of waveTrackTitles) {
              if (areTitlesSimilar(trackTitle, existingTitle)) {
                console.log('  ⏭️ Skipping similar track:', track.title, '(similar to:', existingTitle + ')');
                return false;
              }
            }
            
            // Трек уникален - добавляем в Sets
            waveTrackIds.add(track.yandexId);
            waveTrackTitles.add(trackTitle);
            return true;
          });
          
          if (uniqueTracks.length > 0) {
            currentPlaylist.push(...uniqueTracks);
            wavePlaylist.push(...uniqueTracks);
            console.log('✅ Added', uniqueTracks.length, 'unique wave tracks. Total:', currentPlaylist.length);
            waveLoadAttempts = 0; // Сбрасываем счетчик при успехе
          } else {
            console.log('⚠️ No new unique tracks (all duplicates or similar)');
            waveLoadAttempts++;
            
            // Если 3 неудачные попытки подряд - рестартуем Wave с пустым queue
            if (waveLoadAttempts >= MAX_WAVE_LOAD_ATTEMPTS) {
              console.log('🔄 Restarting Wave (clearing queue after', waveLoadAttempts, 'failed attempts)');
              waveTrackIds.clear();
              waveTrackTitles.clear();
              waveLoadAttempts = 0;
              
              // Загружаем новую волну с пустым queue
              getYandexWave(5, '').then(restartTracks => {
                if (restartTracks && restartTracks.length > 0) {
                  restartTracks.forEach(track => {
                    waveTrackIds.add(track.yandexId);
                    waveTrackTitles.add(track.title);
                  });
                  currentPlaylist.push(...restartTracks);
                  wavePlaylist.push(...restartTracks);
                  console.log('✅ Wave restarted with', restartTracks.length, 'fresh tracks');
                }
              });
            }
          }
        } else {
          console.log('⚠️ No new tracks received');
          waveLoadAttempts++;
        }
        isLoadingMoreWave = false;
      }).catch(error => {
        console.error('❌ Failed to load wave tracks:', error);
        isLoadingMoreWave = false;
      });
    }
    
    // Reset audio element completely
    audio.pause();
    audio.currentTime = 0;
    isPlaying = false;
    updatePlayButtons(false);
    
    // Очищаем предыдущий таймаут загрузки если есть
    if (window._audioLoadTimeout) {
      clearTimeout(window._audioLoadTimeout);
      window._audioLoadTimeout = null;
    }
    
    // Формируем stream URL в зависимости от источника
    let streamUrl = track.url;
    
    console.log('🔗 [LOAD TRACK] Initial streamUrl from track.url:', streamUrl);
    
    if (!streamUrl || streamUrl === '') {
      console.log('  ⚠️ No URL in track, trying to construct from source and ID...');
      // Если URL нет, формируем его на основе источника и ID
      if (track.source === 'yandex' && track.yandexId) {
        streamUrl = `${YOUTUBE_SERVER_URL}/api/yandex/stream/${track.yandexId}`;
        console.log('  ✅ Constructed Yandex URL:', streamUrl);
      } else if (track.source === 'soundcloud' && track.soundcloudId) {
        streamUrl = `${YOUTUBE_SERVER_URL}/api/soundcloud/stream/${track.soundcloudId}`;
        console.log('  ✅ Constructed SoundCloud URL:', streamUrl);
      } else if (track.id) {
        // Fallback: пытаемся определить по формату ID
        if (track.id.startsWith('ym_')) {
          const trackId = track.id.split('_')[1];
          streamUrl = `${YOUTUBE_SERVER_URL}/api/yandex/stream/${trackId}`;
          console.log('  ✅ Constructed Yandex URL from ID:', streamUrl);
        } else if (track.id.startsWith('sc_')) {
          const trackId = track.id.split('_')[1];
          streamUrl = `${YOUTUBE_SERVER_URL}/api/soundcloud/stream/${trackId}`;
          console.log('  ✅ Constructed SoundCloud URL from ID:', streamUrl);
        }
      }
    }
    
    if (!streamUrl) {
      console.error('❌ [LOAD TRACK] Cannot determine stream URL for track:', track);
      if (window.showToast) {
        window.showToast('Не удалось получить URL трека', 'error');
      }
      // Пропускаем трек
      if (window.nextTrack) {
        window.nextTrack();
      }
      return;
    }
    
    console.log('✅ [LOAD TRACK] Final streamUrl:', streamUrl);
    
    // Set new source (один раз!)
    audio.src = streamUrl;
    console.log('🎵 [LOAD TRACK] Set audio.src, waiting for load...');
    
    // Устанавливаем таймаут на загрузку трека (60 секунд)
    window._audioLoadTimeout = setTimeout(() => {
      if (audio.readyState === 0 || audio.readyState === 1) {
        console.error('❌ Audio load timeout after 60 seconds');
        
        // Показываем уведомление
        if (window.showToast) {
          window.showToast(`Таймаут загрузки: ${track.title}. Переход к следующему...`, 'error');
        }
        
        // Переходим к следующему треку
        if (window.nextTrack) {
          window.nextTrack();
        }
      }
    }, 60000); // 60 секунд
    
    // Очищаем таймаут когда трек загрузился
    audio.addEventListener('canplay', function clearLoadTimeout() {
      if (window._audioLoadTimeout) {
        clearTimeout(window._audioLoadTimeout);
        window._audioLoadTimeout = null;
      }
      audio.removeEventListener('canplay', clearLoadTimeout);
    }, { once: true });
    
    // Update mini player (используем кэш)
    domCache.miniTitle.textContent = track.title;
    domCache.miniArtist.textContent = track.artist;
    domCache.miniArtist.style.cursor = 'pointer';
    domCache.miniArtist.onclick = () => {
      console.log('🎤 Opening artist page for:', track.artist);
      if (window.artistPage) {
        window.artistPage.loadArtist(track.artist, track.source || 'yandex');
      } else {
        console.error('❌ window.artistPage not found!');
      }
    };
    
    // Нормализуем обложку - проверяем все возможные поля
    const coverUrl = track.cover || track.thumbnail || track.coverUri;
    if (coverUrl) {
      domCache.miniCover.innerHTML = `<img src="${coverUrl}" alt="Cover" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">`;
    } else {
      domCache.miniCover.textContent = '♪';
      domCache.miniCover.innerHTML = '♪';
    }
    
    // Reset progress bars (используем кэш)
    domCache.miniProgressFill.style.width = '0%';
    domCache.miniCurrentTime.textContent = '0:00';
    domCache.miniTotalTime.textContent = '0:00';
    
    // Update large player (используем кэш)
    domCache.playerTitleLarge.textContent = track.title;
    domCache.playerArtistLarge.textContent = track.artist;
    domCache.playerArtistLarge.style.cursor = 'pointer';
    domCache.playerArtistLarge.onclick = () => {
      console.log('🎤 Opening artist page for:', track.artist);
      if (window.artistPage) {
        window.artistPage.loadArtist(track.artist, track.source || 'yandex');
      } else {
        console.error('❌ window.artistPage not found!');
      }
    };
    
    if (coverUrl) {
      domCache.playerCoverLarge.innerHTML = `<img src="${coverUrl}" alt="Cover" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;">`;
    } else {
      domCache.playerCoverLarge.textContent = '♪';
      domCache.playerCoverLarge.innerHTML = '♪';
    }
    domCache.progressFillLarge.style.width = '0%';
    domCache.currentTimeLarge.textContent = '0:00';
    domCache.totalTimeLarge.textContent = '0:00';
    
    // Add to history (check if available)
    if (window.electronAPI && window.electronAPI.addToHistory) {
      await window.electronAPI.addToHistory(track);
      console.log('[HISTORY] Track added to history:', track.title);
      
      // Обновляем отображение истории на главной странице
      if (window.updateHistoryDisplay) {
        window.updateHistoryDisplay();
      }
    }
    
    // Обновляем кнопку скачивания
    if (window.updateDownloadButton) {
      window.updateDownloadButton();
    }
    
    // Обновляем информацию в трее
    if (window.updateTrayTrack) {
      window.updateTrayTrack();
    }
    
    // Обновляем очередь треков
    if (window.updateQueue) {
      window.updateQueue();
    }
    
    // Загружаем текст песни автоматически
    loadLyricsForCurrentTrack(track);
    
    // Обновляем кнопки воспроизведения в соответствии с текущим состоянием
    updatePlayButtons(isPlaying);
    
    // Активируем миниплеер
    const miniPlayer = document.querySelector('.mini-player');
    if (miniPlayer) {
      miniPlayer.classList.add('active');
    }
    
    console.log('Track loaded, ready to play');
  }

  // Загрузка текста для текущего трека
  async function loadLyricsForCurrentTrack(track) {
    const lyricsContainer = document.getElementById('lyrics-container');
    
    if (!lyricsContainer) {
      console.error('Lyrics container not found!');
      return;
    }
    
    console.log('🎵 Loading lyrics for:', track.artist, '-', track.title);
    
    lyricsContainer.innerHTML = '<div class="lyrics-line">Текст песни загружается...</div>';
    currentLyrics = null;
    window.lyricsLines = null;
    window.lyricsTimestamps = null;

    try {
      // Обращаемся к unified server (порт 3001) который имеет LRCLIB и Genius
      const lyricsUrl = `http://localhost:3001/api/lyrics?artist=${encodeURIComponent(track.artist)}&title=${encodeURIComponent(track.title)}`;
      console.log('📡 Fetching lyrics from:', lyricsUrl);
      
      const response = await fetch(lyricsUrl);
      const data = await response.json();
      
      console.log('📥 Lyrics response:', data);

      if (data.found) {
        if (data.synced && data.syncedLyrics) {
          // Парсим LRC формат
          const lrcLines = data.syncedLyrics.split('\n').filter(line => line.trim());
          const parsed = [];
          
          lrcLines.forEach(line => {
            // Формат: [mm:ss.xx]текст
            const match = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
            if (match) {
              const minutes = parseInt(match[1]);
              const seconds = parseFloat(match[2]);
              const text = match[3].trim();
              const timestamp = minutes * 60 + seconds;
              
              if (text) {
                parsed.push({ timestamp, text });
              }
            }
          });
          
          window.lyricsLines = parsed.map(l => l.text);
          window.lyricsTimestamps = parsed.map(l => l.timestamp);
          
          console.log('✅ Synced lyrics loaded:', parsed.length, 'lines');
          
          // Показываем ВСЕ строки
          lyricsContainer.innerHTML = parsed.map((line, index) => 
            `<div class="lyrics-line ${index === 0 ? 'active' : index === 1 ? 'prev' : 'far'}" data-line-index="${index}">${line.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`
          ).join('');
        } else {
          // Обычный текст без таймингов
          currentLyrics = data.plainLyrics;
          const lines = data.plainLyrics.split('\n').filter(line => line.trim());
          
          window.lyricsLines = lines;
          window.lyricsTimestamps = null;
          
          console.log('✅ Plain lyrics loaded:', lines.length, 'lines (no sync)');
          
          // Показываем ВСЕ строки
          lyricsContainer.innerHTML = lines.map((line, index) => 
            `<div class="lyrics-line ${index === 0 ? 'active' : index === 1 ? 'prev' : 'far'}" data-line-index="${index}">${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`
          ).join('');
        }
      } else {
        console.log('❌ Lyrics not found');
        lyricsContainer.innerHTML = '<div class="lyrics-line" style="color: rgba(255, 255, 255, 0.5);">К сожалению, текста данной песни нет</div>';
        window.lyricsLines = null;
        window.lyricsTimestamps = null;
      }
    } catch (error) {
      console.error('❌ Lyrics error:', error);
      lyricsContainer.innerHTML = '<div class="lyrics-line" style="color: rgba(255, 255, 255, 0.5);">Ошибка загрузки текста</div>';
      window.lyricsLines = null;
      window.lyricsTimestamps = null;
    }
  }

  // Синхронизация текста с аудио (оптимизировано с кэшем)
  function syncLyrics() {
    if (!window.lyricsLines || window.lyricsLines.length === 0) return;
    
    const currentTime = audio.currentTime;
    let currentLineIndex = 0;
    
    // Если есть тайминги - используем их
    if (window.lyricsTimestamps && window.lyricsTimestamps.length > 0) {
      // Находим текущую строку по таймингу
      for (let i = 0; i < window.lyricsTimestamps.length; i++) {
        if (currentTime >= window.lyricsTimestamps[i]) {
          currentLineIndex = i;
        } else {
          break;
        }
      }
    } else {
      // Fallback: равномерное распределение
      if (!audio.duration || !isFinite(audio.duration)) return;
      const timePerLine = (audio.duration * 0.8) / window.lyricsLines.length;
      currentLineIndex = Math.floor(currentTime / timePerLine);
    }
    
    // Используем кэшированный контейнер
    if (!domCache.lyricsContainer) return;
    
    // Проверяем, изменилась ли текущая строка (оптимизация!)
    const lastIndex = parseInt(domCache.lyricsContainer.dataset.currentIndex || '-1');
    if (lastIndex === currentLineIndex) return; // Не обновляем если строка не изменилась
    
    domCache.lyricsContainer.dataset.currentIndex = currentLineIndex;
    
    // Обновляем классы для всех строк (используем requestAnimationFrame для плавности)
    requestAnimationFrame(() => {
      const allLines = domCache.lyricsContainer.querySelectorAll('.lyrics-line');
      allLines.forEach((line, i) => {
        line.classList.remove('active', 'prev', 'next', 'past', 'far');
        
        if (i === currentLineIndex) {
          line.classList.add('active');
        } else if (i === currentLineIndex - 1) {
          line.classList.add('prev');
        } else if (i === currentLineIndex + 1) {
          line.classList.add('next');
        } else if (i < currentLineIndex) {
          line.classList.add('past');
        } else {
          line.classList.add('far');
        }
      });
      
      // Мгновенная прокрутка к текущей строке (без smooth - быстрее и плавнее)
      const activeLine = allLines[currentLineIndex];
      if (activeLine) {
        activeLine.scrollIntoView({ behavior: 'auto', block: 'center' });
      }
    });
  }

  // Play/Pause
  function togglePlay() {
    if (currentIndex < 0) {
      console.error('No track loaded');
      return;
    }
    
    const activePlaylist = isSearchMode ? searchPlaylist : (currentPlaylist.length > 0 ? currentPlaylist : playlist);
    const track = activePlaylist[currentIndex];
    
    if (isPlaying) {
      audio.pause();
      isPlaying = false;
      updatePlayButtons(false);
      
      // Обновляем трей
      if (window.updateTrayTrack) {
        window.updateTrayTrack();
      }
      
      // Уведомляем Discord RPC о паузе
      if (window.electronAPI && window.electronAPI.discordTrackPause && track) {
        // Убеждаемся что у трека есть source
        if (!track.source) {
          track.source = currentSource || 'youtube';
        }
        window.electronAPI.discordTrackPause(track, audio.duration, audio.currentTime);
      }
      
      // Скрываем визуализатор волн при паузе
      const waveCard = document.getElementById('my-wave-card');
      if (waveCard) {
        waveCard.classList.remove('playing');
        waveCard.classList.add('paused');
      }
      
      // Останавливаем WebGL шейдер
      if (window.waveShader) {
        window.waveShader.stop();
      }
      
      // Останавливаем старый эффект
      if (window.waveBassEffect) {
        window.waveBassEffect.stop();
      }
    } else {
      isPlaying = true;
      updatePlayButtons(true);
      
      // Обновляем трей
      if (window.updateTrayTrack) {
        window.updateTrayTrack();
      }
      
      // Уведомляем Discord RPC о возобновлении
      if (window.electronAPI && window.electronAPI.discordTrackResume && track) {
        // Убеждаемся что у трека есть source
        if (!track.source) {
          track.source = currentSource || 'youtube';
        }
        window.electronAPI.discordTrackResume(track, audio.duration, audio.currentTime);
      }
      
      // Показываем визуализатор волн при воспроизведении
      const waveCard = document.getElementById('my-wave-card');
      if (waveCard) {
        waveCard.classList.remove('paused');
        waveCard.classList.add('playing');
      }
      
      // Запускаем WebGL шейдер вместо простого эффекта
      if (window.waveShader) {
        const waveVisualizer = document.querySelector('.wave-visualizer');
        if (waveVisualizer && !window.waveShader.canvas) {
          window.waveShader.init(waveVisualizer);
        }
        if (!window.waveShader.isAudioInitialized) {
          window.waveShader.initAudio(audio);
        }
        window.waveShader.start();
      }
      
      // Останавливаем старый эффект
      if (window.waveBassEffect) {
        window.waveBassEffect.stop();
      }
      
      // Если readyState = 0, подождем загрузки
      if (audio.readyState === 0) {
        const onReady = () => {
          audio.removeEventListener('loadeddata', onReady);
          audio.play().catch(err => {
            console.error('Play failed:', err);
            isPlaying = false;
            updatePlayButtons(false);
            
            // Скрываем визуализатор при ошибке
            if (isWaveMode) {
              const waveCard = document.getElementById('my-wave-card');
              if (waveCard) {
                waveCard.classList.remove('playing');
                waveCard.classList.add('paused');
              }
            }
          });
        };
        audio.addEventListener('loadeddata', onReady);
        
        // Таймаут 30 секунд (YouTube может долго грузиться)
        setTimeout(() => {
          audio.removeEventListener('loadeddata', onReady);
          if (audio.readyState === 0) {
            console.error('Audio load timeout');
            isPlaying = false;
            updatePlayButtons(false);
            
            // Скрываем визуализатор при таймауте
            if (isWaveMode) {
              const waveCard = document.getElementById('my-wave-card');
              if (waveCard) {
                waveCard.classList.remove('playing');
                waveCard.classList.add('paused');
              }
            }
          }
        }, 30000);
      } else {
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.error('Play failed:', err);
            isPlaying = false;
            updatePlayButtons(false);
            
            // Скрываем визуализатор при ошибке
            if (isWaveMode) {
              const waveCard = document.getElementById('my-wave-card');
              if (waveCard) {
                waveCard.classList.remove('playing');
                waveCard.classList.add('paused');
              }
            }
          });
        }
      }
    }
  }

  function updatePlayButtons(playing) {
    console.log('🎵 updatePlayButtons called with playing:', playing);
    const playIcon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    const pauseIcon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>';
    
    const miniPlayBtn = document.getElementById('mini-play-btn');
    const playBtnLarge = document.getElementById('play-btn-large');
    const wavePlayBtn = document.getElementById('wave-play-btn');
    
    if (miniPlayBtn) {
      miniPlayBtn.innerHTML = playing ? pauseIcon : playIcon;
      console.log('  ✅ Mini play button updated to:', playing ? 'pause' : 'play');
    } else {
      console.warn('  ❌ Mini play button not found');
    }
    
    if (playBtnLarge) {
      playBtnLarge.innerHTML = playing ? 
        '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>' :
        '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
      console.log('  ✅ Large play button updated to:', playing ? 'pause' : 'play');
    } else {
      console.warn('  ❌ Large play button not found');
    }
    
    // Синхронизация кнопки "Моя волна"
    if (wavePlayBtn) {
      wavePlayBtn.innerHTML = playing ? pauseIcon : playIcon;
      console.log('  ✅ Wave play button updated to:', playing ? 'pause' : 'play');
    }
  }

  // Player controls
  document.getElementById('mini-play-btn').onclick = togglePlay;
  document.getElementById('play-btn-large').onclick = togglePlay;
  
  // Wave play button (синхронизирован с миниплеером)
  const wavePlayBtn = document.getElementById('wave-play-btn');
  if (wavePlayBtn) {
    wavePlayBtn.onclick = (e) => {
      e.stopPropagation(); // Предотвращаем клик на карточку волны
      togglePlay();
    };
  }

  // Previous track
  function previousTrack() {
    console.log('⏮️ Previous track called, currentIndex:', currentIndex);
    const wasPlaying = isPlaying;
    if (currentIndex > 0) {
      loadTrack(currentIndex - 1);
      if (wasPlaying) {
        isPlaying = true;
        updatePlayButtons(true);
        setTimeout(() => {
          audio.play().catch(err => console.error('Prev play failed:', err));
        }, 100);
      }
    } else {
      console.log('⏮️ Already at first track');
    }
  }
  
  // Next track
  function nextTrack() {
    console.log('⏭️ Next track called, currentIndex:', currentIndex);
    const wasPlaying = isPlaying;
    const activePlaylist = isWaveMode ? currentPlaylist : (isSearchMode ? searchPlaylist : (currentPlaylist.length > 0 ? currentPlaylist : playlist));
    console.log('⏭️ Active playlist length:', activePlaylist.length);
    
    // Проверка для режима "Волна по треку" - подгружаем еще треки если остается мало
    if (isWaveSimilarMode && activePlaylist.length - currentIndex <= 5) {
      console.log('🔄 Осталось мало треков в "Волна по треку", подгружаем еще...');
      if (window.loadMoreSimilarTracks) {
        window.loadMoreSimilarTracks().catch(err => console.error('❌ Ошибка подгрузки:', err));
      }
    }
    
    if (currentIndex < activePlaylist.length - 1) {
      loadTrack(currentIndex + 1);
      if (wasPlaying) {
        isPlaying = true;
        updatePlayButtons(true);
        setTimeout(() => {
          audio.play().catch(err => console.error('Next play failed:', err));
        }, 100);
      }
    } else {
      console.log('⏭️ Already at last track');
    }
  }
  
  // Expose functions globally for media keys
  window.togglePlay = togglePlay;
  window.nextTrack = nextTrack;
  window.previousTrack = previousTrack;
  window.updatePlayButtons = updatePlayButtons;
  
  // Функция обновления истории на главной странице
  window.updateHistoryDisplay = async function() {
    try {
      const history = await window.electronAPI.getHistory(10);
      if (history && history.length > 0) {
        loadCarousel('history-carousel', history);
        console.log('[HISTORY] Display updated with', history.length, 'tracks');
      }
    } catch (error) {
      console.error('[HISTORY] Error updating display:', error);
    }
  };
  
  document.getElementById('mini-prev-btn').onclick = previousTrack;
  document.getElementById('prev-btn-large').onclick = previousTrack;
  document.getElementById('mini-next-btn').onclick = nextTrack;
  document.getElementById('next-btn-large').onclick = nextTrack;

  // Add to main playlist button
  document.getElementById('add-to-playlist-btn').onclick = async () => {
    const activePlaylist = isSearchMode ? searchPlaylist : (currentPlaylist.length > 0 ? currentPlaylist : playlist);
    
    if (activePlaylist.length === 0 || currentIndex < 0) {
      console.log('❌ Нет текущего трека для добавления');
      return;
    }
    
    const currentTrack = activePlaylist[currentIndex];
    if (!currentTrack) {
      console.log('❌ Текущий трек не найден');
      return;
    }
    
    try {
      // Проверяем, есть ли уже этот трек в основном плейлисте
      const mainPlaylist = await window.electronAPI.getPlaylist();
      
      // Улучшенная проверка дубликатов: используем ID трека если есть
      const trackId = currentTrack.yandexId || currentTrack.youtubeId || currentTrack.soundcloudId || currentTrack.spotifyId;
      
      const exists = mainPlaylist.some(track => {
        // Сравниваем по ID если есть
        if (trackId) {
          return track.yandexId === trackId || 
                 track.youtubeId === trackId || 
                 track.soundcloudId === trackId || 
                 track.spotifyId === trackId;
        }
        
        // Fallback: сравниваем по URL или названию+артисту
        if (currentTrack.url && track.url) {
          return track.url === currentTrack.url;
        }
        
        // Последний вариант: точное совпадение названия и артиста (регистронезависимое)
        return track.title.toLowerCase().trim() === currentTrack.title.toLowerCase().trim() && 
               track.artist.toLowerCase().trim() === currentTrack.artist.toLowerCase().trim();
      });
      
      if (exists) {
        console.log('⚠️ Трек уже есть в основном плейлисте');
        // Показываем уведомление пользователю
        if (window.showNotification) {
          window.showNotification('Трек уже в плейлисте', 'warning');
        }
        return;
      }
      
      // Получаем актуальную обложку из мини-плеера
      const miniCover = document.getElementById('mini-cover');
      let coverUrl = currentTrack.thumbnail || currentTrack.cover || currentTrack.coverArt || '';
      
      // Если в мини-плеере есть изображение, используем его
      if (miniCover && miniCover.style.backgroundImage) {
        const bgImage = miniCover.style.backgroundImage;
        const urlMatch = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
        if (urlMatch && urlMatch[1] !== '') {
          coverUrl = urlMatch[1];
        }
      }
      
      // Конструируем URL если его нет
      let trackUrl = currentTrack.url;
      if (!trackUrl && currentTrack.yandexId) {
        trackUrl = `http://localhost:3001/api/yandex/stream/${currentTrack.yandexId}`;
        console.log('🔧 Constructed Yandex URL:', trackUrl);
      }
      
      // Добавляем трек в основной плейлист
      await window.electronAPI.addTrack({
        title: currentTrack.title,
        artist: currentTrack.artist,
        url: trackUrl,
        cover: coverUrl,
        duration: currentTrack.duration || currentTrack.durationMs || 0,
        source: currentTrack.source || 'yandex',
        yandexId: currentTrack.yandexId,
        youtubeId: currentTrack.youtubeId,
        soundcloudId: currentTrack.soundcloudId,
        spotifyId: currentTrack.spotifyId,
        addedAt: Date.now()
      });
      
      console.log(`✅ Трек добавлен в основной плейлист: ${currentTrack.title}`);
      
      // Показываем уведомление об успехе
      if (window.showNotification) {
        window.showNotification(`Добавлено: ${currentTrack.title}`, 'success');
      }
      
      // Обновляем счетчик плейлистов если функция доступна
      if (window.updatePlaylistCounts) {
        window.updatePlaylistCounts();
      }
      
    } catch (error) {
      console.error('❌ Ошибка при добавлении трека в плейлист:', error);
      if (window.showNotification) {
        window.showNotification('Ошибка при добавлении трека', 'error');
      }
    }
  };

  // Кнопка "Моя волна по этому треку"
  const waveSimilarBtn = document.getElementById('wave-similar-btn');
  if (waveSimilarBtn) {
    waveSimilarBtn.onclick = async () => {
      const activePlaylist = isSearchMode ? searchPlaylist : (currentPlaylist.length > 0 ? currentPlaylist : playlist);
      
      if (activePlaylist.length === 0 || currentIndex < 0) {
        console.log('❌ Нет текущего трека для запуска волны');
        window.showNotification('Сначала выберите трек', 'warning');
        return;
      }
      
      const currentTrack = activePlaylist[currentIndex];
      if (!currentTrack) {
        console.log('❌ Текущий трек не найден');
        return;
      }
      
      // Активируем/деактивируем режим
      if (window.waveSimilarTracks && window.waveSimilarTracks.isActiveMode()) {
        // Деактивируем режим
        window.waveSimilarTracks.deactivate();
        waveSimilarBtn.classList.remove('active');
        
        window.showNotification('Режим "Волна по треку" выключен', 'info');
      } else {
        // Активируем режим
        if (window.waveSimilarTracks) {
          waveSimilarBtn.classList.add('active');
          
          // Показываем уведомление о начале поиска
          window.showNotification(`Ищем похожие треки на "${currentTrack.title}"...`, 'info');
          
          await window.waveSimilarTracks.activate(currentTrack);
          
          // После активации показываем результат
          if (window.waveSimilarTracks.similarTracks && window.waveSimilarTracks.similarTracks.length > 0) {
            window.showNotification(
              `Найдено ${window.waveSimilarTracks.similarTracks.length} похожих треков!`,
              'success'
            );
          }
        } else {
          console.error('❌ waveSimilarTracks не загружен');
          window.showNotification('Ошибка загрузки модуля', 'error');
        }
      }
    };
  } else {
    console.warn('⚠️ Кнопка wave-similar-btn не найдена');
  }

  // Queue modal
  const queueBtn = document.getElementById('queue-btn');
  const queueModal = document.getElementById('queue-modal');
  const closeQueueModal = document.getElementById('close-queue-modal');
  const queueList = document.getElementById('queue-list');
  
  function updateQueueModal() {
    const activePlaylist = isSearchMode ? searchPlaylist : (currentPlaylist.length > 0 ? currentPlaylist : playlist);
    
    if (activePlaylist.length === 0 || currentIndex < 0) {
      queueList.innerHTML = `
        <div class="queue-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
          </svg>
          <p>Нет треков в очереди</p>
        </div>
      `;
      return;
    }
    
    // Show next 10 tracks starting from current
    const nextTracks = activePlaylist.slice(currentIndex, currentIndex + 10);
    
    queueList.innerHTML = nextTracks.map((track, index) => {
      const actualIndex = currentIndex + index;
      const isCurrent = actualIndex === currentIndex;
      const coverUrl = track.cover || track.thumbnail || track.coverUri;
      
      return `
        <div class="queue-item ${isCurrent ? 'current' : ''}" data-index="${actualIndex}">
          <span class="queue-item-number">${actualIndex + 1}</span>
          <div class="queue-item-cover">
            ${coverUrl ? `<img src="${coverUrl}" alt="Cover">` : '♪'}
          </div>
          <div class="queue-item-info">
            <div class="queue-item-title">${track.title || 'Unknown'}</div>
            <div class="queue-item-artist">${track.artist || 'Unknown'}</div>
          </div>
          <span class="queue-item-duration">${track.durationString || formatTime(track.duration)}</span>
        </div>
      `;
    }).join('');
    
    // Add click handlers
    queueList.querySelectorAll('.queue-item').forEach(item => {
      item.onclick = () => {
        const index = parseInt(item.dataset.index);
        loadTrack(index);
        if (!isPlaying) {
          togglePlay();
        }
        queueModal.style.display = 'none';
        queueBtn.classList.remove('active');
      };
    });
  }
  
  queueBtn.onclick = () => {
    if (queueModal.style.display === 'none') {
      updateQueueModal();
      queueModal.style.display = 'block';
      queueBtn.classList.add('active');
    } else {
      queueModal.style.display = 'none';
      queueBtn.classList.remove('active');
    }
  };
  
  closeQueueModal.onclick = () => {
    queueModal.style.display = 'none';
    queueBtn.classList.remove('active');
  };
  
  // Close queue modal when clicking outside
  document.addEventListener('click', (e) => {
    if (queueModal.style.display !== 'none' && 
        !queueModal.contains(e.target) && 
        !queueBtn.contains(e.target)) {
      queueModal.style.display = 'none';
      queueBtn.classList.remove('active');
    }
  });
  
  // Update queue when track changes
  window.updateQueue = updateQueueModal;

  // Volume
  const volumeSlider = document.getElementById('volume-slider-mini');
  if (volumeSlider) {
    volumeSlider.oninput = () => {
      audio.volume = volumeSlider.value / 100;
    };
  } else {
    console.warn('⚠️ Volume slider not found');
  }
  audio.volume = 0.7;

  // Progress bar click
  const miniProgressBar = document.getElementById('mini-progress-bar');
  miniProgressBar.onclick = (e) => {
    e.stopPropagation();
    console.log('Mini progress bar clicked, duration:', audio.duration);
    if (audio.duration && !isNaN(audio.duration)) {
      const rect = miniProgressBar.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newTime = percent * audio.duration;
      console.log('Seeking to:', newTime, 'seconds (', Math.floor(percent * 100), '%)');
      audio.currentTime = newTime;
    } else {
      console.warn('Cannot seek: duration not available');
    }
  };
  
  // Large player progress bar click
  const largeProgressBar = document.querySelector('.progress-bar-large');
  if (largeProgressBar) {
    largeProgressBar.onclick = (e) => {
      e.stopPropagation();
      console.log('Large progress bar clicked, duration:', audio.duration);
      if (audio.duration && !isNaN(audio.duration)) {
        const rect = largeProgressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const newTime = percent * audio.duration;
        console.log('Seeking to:', newTime, 'seconds (', Math.floor(percent * 100), '%)');
        audio.currentTime = newTime;
      } else {
        console.warn('Cannot seek: duration not available');
      }
    };
  }
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Игнорируем если фокус на input/textarea
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    switch(e.key) {
      case ' ': // Space - play/pause
        e.preventDefault();
        togglePlay();
        break;
      case 'ArrowLeft': // Left arrow - rewind 5 seconds
        e.preventDefault();
        if (audio.currentTime) {
          audio.currentTime = Math.max(0, audio.currentTime - 5);
        }
        break;
      case 'ArrowRight': // Right arrow - forward 5 seconds
        e.preventDefault();
        if (audio.currentTime && audio.duration) {
          audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
        }
        break;
      case 'ArrowUp': // Up arrow - volume up
        e.preventDefault();
        audio.volume = Math.min(1, audio.volume + 0.1);
        break;
      case 'ArrowDown': // Down arrow - volume down
        e.preventDefault();
        audio.volume = Math.max(0, audio.volume - 0.1);
        break;
    }
  });

  // Time update
  let nearEndTriggered = false; // Флаг для предотвращения множественных срабатываний
  
  audio.ontimeupdate = () => {
    const current = formatTime(audio.currentTime);
    
    // Синхронизация текста (оптимизировано - вызывается только при смене строки)
    syncLyrics();
    
    // Используем audio.duration если доступна, иначе берем из метаданных трека
    let totalDuration = audio.duration;
    if (!totalDuration || !isFinite(totalDuration)) {
      // Если duration недоступна, используем из метаданных трека (в миллисекундах)
      if (playlist[currentIndex] && playlist[currentIndex].duration) {
        totalDuration = playlist[currentIndex].duration / 1000; // конвертируем в секунды
      }
    }
    
    if (totalDuration && isFinite(totalDuration)) {
      const total = formatTime(totalDuration);
      
      // Используем кэшированные элементы вместо getElementById
      domCache.miniCurrentTime.textContent = current;
      domCache.miniTotalTime.textContent = total;
      domCache.currentTimeLarge.textContent = current;
      domCache.totalTimeLarge.textContent = total;
      
      const percent = (audio.currentTime / totalDuration) * 100;
      domCache.progressFillLarge.style.width = percent + '%';
      domCache.miniProgressFill.style.width = percent + '%';
      
      // Discord RPC: обновляем прогресс (каждые 15 секунд)
      const track = getCurrentTrack();
      if (track && window.electronAPI && window.electronAPI.discordTrackProgress) {
        // Убеждаемся что у трека есть source
        if (!track.source) {
          track.source = currentSource || 'youtube';
        }
        window.electronAPI.discordTrackProgress(track, totalDuration, audio.currentTime);
      }
      
      // FALLBACK: Если трек почти закончился (последние 2 секунды), но onended не сработал
      if (!nearEndTriggered && totalDuration - audio.currentTime < 2 && totalDuration - audio.currentTime > 0) {
        nearEndTriggered = true;
        console.log('⚠️ Near end detected (fallback), preparing next track...');
      }
      
      // Если трек действительно закончился (currentTime >= duration), вызываем логику onended
      if (!nearEndTriggered && audio.currentTime >= totalDuration - 0.5) {
        nearEndTriggered = true;
        console.log('⚠️ Track end detected via timeupdate (onended fallback)');
        // Вызываем ту же логику что и в onended
        handleTrackEnd();
      }
    } else {
      // Если длительность неизвестна, показываем только текущее время
      domCache.miniCurrentTime.textContent = current;
      domCache.miniTotalTime.textContent = '--:--';
      domCache.currentTimeLarge.textContent = current;
      domCache.totalTimeLarge.textContent = '--:--';
    }
  };

  audio.onended = async () => {
    console.log('🎵 audio.onended fired!');
    nearEndTriggered = false; // Сбрасываем флаг для следующего трека
    handleTrackEnd();
  };
  
  // Функция обработки окончания трека (используется и в onended, и в fallback)
  async function handleTrackEnd() {
    console.log('🎵 Track ended, repeat mode:', repeatMode, 'shuffle:', isShuffleEnabled, 'wave mode:', isWaveMode);
    console.log('📊 Current index:', currentIndex, 'currentPlaylist length:', currentPlaylist.length, 'searchPlaylist length:', searchPlaylist.length, 'playlist length:', playlist.length);
    isPlaying = false;
    updatePlayButtons(false);
    
    // Временно скрываем визуализатор при окончании трека
    if (isWaveMode) {
      const waveCard = document.getElementById('my-wave-card');
      if (waveCard) {
        waveCard.classList.remove('playing');
        waveCard.classList.add('paused');
      }
    }
    
    // Режим повтора одного трека
    if (repeatMode === 'one') {
      audio.currentTime = 0;
      isPlaying = true;
      updatePlayButtons(true);
      audio.play().catch(err => console.error('Repeat one failed:', err));
      
      // Показываем визуализатор снова при повторе
      if (isWaveMode) {
        const waveCard = document.getElementById('my-wave-card');
        if (waveCard) {
          waveCard.classList.remove('paused');
          waveCard.classList.add('playing');
        }
      }
      return;
    }
    
    // Определяем активный плейлист
    const activePlaylist = isSearchMode ? searchPlaylist : (currentPlaylist.length > 0 ? currentPlaylist : playlist);
    
    console.log('📊 Active playlist length:', activePlaylist.length, 'Current index:', currentIndex);
    console.log('📊 Using playlist:', isSearchMode ? 'search' : (currentPlaylist.length > 0 ? 'current' : 'saved'));
    
    // Определяем следующий трек
    let nextIndex = -1;
    
    if (isShuffleEnabled) {
      // Случайный трек (не текущий)
      const availableIndices = activePlaylist.map((_, i) => i).filter(i => i !== currentIndex);
      if (availableIndices.length > 0) {
        nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      }
    } else {
      // Следующий по порядку
      if (currentIndex < activePlaylist.length - 1) {
        nextIndex = currentIndex + 1;
        console.log('➡️ Next track:', nextIndex);
      } else if (repeatMode === 'all') {
        // В режиме волны - подгружаем новые треки синхронно (только если НЕ режим "Волна по треку")
        if (isWaveMode && !isWaveSimilarMode) {
          console.log('🌊 End of wave playlist, loading more tracks...');
          try {
            const newTracks = await getYandexWave();
            if (newTracks && newTracks.length > 0) {
              // Фильтруем дубликаты по ID и схожим названиям
              const uniqueTracks = newTracks.filter(track => {
                // Проверка по ID
                if (waveTrackIds.has(track.yandexId)) {
                  console.log('  ⏭️ Skipping duplicate ID:', track.title);
                  return false;
                }
                
                // Проверка по схожести названий
                const trackTitle = track.title;
                for (const existingTitle of waveTrackTitles) {
                  if (areTitlesSimilar(trackTitle, existingTitle)) {
                    console.log('  ⏭️ Skipping similar track:', track.title, '(similar to:', existingTitle + ')');
                    return false;
                  }
                }
                
                // Трек уникален - добавляем в Sets
                waveTrackIds.add(track.yandexId);
                waveTrackTitles.add(trackTitle);
                return true;
              });
              
              if (uniqueTracks.length > 0) {
                // Добавляем новые треки в currentPlaylist
                currentPlaylist.push(...uniqueTracks);
                wavePlaylist.push(...uniqueTracks);
                console.log('✅ Added', uniqueTracks.length, 'unique wave tracks. Total:', currentPlaylist.length);
                nextIndex = currentIndex + 1;
                waveLoadAttempts = 0; // Сбрасываем счетчик при успехе
              } else {
                console.log('⚠️ No new unique tracks found');
                waveLoadAttempts++;
                
                // Если слишком много неудачных попыток - начинаем сначала
                if (waveLoadAttempts >= MAX_WAVE_LOAD_ATTEMPTS) {
                  console.log('🔄 Too many failed attempts, restarting wave from beginning');
                  nextIndex = 0;
                  waveLoadAttempts = 0;
                } else {
                  console.log(`🔄 Attempt ${waveLoadAttempts}/${MAX_WAVE_LOAD_ATTEMPTS}, restarting from beginning`);
                  nextIndex = 0;
                }
              }
            } else {
              console.log('⚠️ No new tracks, restarting from beginning');
              nextIndex = 0;
            }
          } catch (error) {
            console.error('❌ Failed to load more wave tracks:', error);
            nextIndex = 0;
          }
        } else {
          // Обычный режим - начинаем сначала
          console.log('🔄 Restarting playlist from beginning');
          nextIndex = 0;
        }
      }
    }
    
    // Воспроизводим следующий трек
    if (nextIndex >= 0) {
      console.log('▶️ Auto-playing next track:', nextIndex);
      loadTrack(nextIndex);
      
      // Более агрессивное автовоспроизведение
      isPlaying = true;
      updatePlayButtons(true);
      
      // Пробуем воспроизвести сразу
      audio.play().catch(err => {
        console.error('Auto-play failed, retrying...', err);
        // Повторная попытка через 100ms
        setTimeout(() => {
          audio.play().catch(err2 => console.error('Auto-play retry failed:', err2));
        }, 100);
      });
    } else {
      console.log('⏹️ No next track to play');
    }
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Функция для создания source icon - возвращает SVG иконку
  function createSourceIcon(source) {
    const icons = {
      'youtube': '<svg viewBox="0 0 24 24"><path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/></svg>',
      'yandex': '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#FFCC00"/><path d="M13.5 7h-2v5.5h-3v2h3V20h2v-5.5h3v-2h-3V7z" fill="#000"/></svg>',
      'spotify': '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.73 14.58c-.15.23-.45.31-.68.16-1.88-1.15-4.25-1.41-7.04-.77-.27.06-.54-.09-.6-.36-.06-.27.09-.54.36-.6 3.05-.7 5.67-.4 7.75.89.23.14.31.44.17.68zm.97-2.16c-.19.29-.58.38-.87.19-2.15-1.32-5.42-1.71-7.96-.93-.33.1-.68-.09-.78-.42-.1-.33.09-.68.42-.78 2.91-.89 6.52-.46 8.99 1.07.29.18.38.58.2.87zm.08-2.25c-2.58-1.53-6.83-1.67-9.29-.92-.4.12-.82-.11-.94-.51-.12-.4.11-.82.51-.94 2.82-.86 7.49-.69 10.45 1.07.36.21.48.68.27 1.04-.21.36-.68.48-1.04.27z"/></svg>',
      'soundcloud': '<svg viewBox="0 0 24 24"><path d="M11.56 8.87V17H20c1.1 0 2-.9 2-2v-.5c0-1.1-.9-2-2-2h-.54c-.21-2.5-2.23-4.5-4.76-4.5-1.02 0-1.97.32-2.75.87zM3 13v4h1v-4H3zm2-2v6h1v-6H5zm2 1v5h1v-5H7zm2-1v6h1v-6H9z"/></svg>',
      'local': '<svg viewBox="0 0 24 24"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-2 6h-3v3h-2v-3h-3v-2h3V7h2v3h3v2z"/></svg>'
    };
    return icons[source] || icons.local;
  }

  // Open player page
  document.getElementById('mini-player-track').onclick = () => {
    if (currentIndex >= 0) {
      // Hide all pages
      Object.values(pages).forEach(p => p && p.classList.remove('active'));
      // Show player page
      pages.player.classList.add('active');
      // Remove active state from sidebar buttons
      document.querySelectorAll('.sidebar-btn[data-page]').forEach(b => b.classList.remove('active'));
    }
  };

  document.getElementById('back-btn').onclick = () => {
    // Hide player page
    pages.player.classList.remove('active');
    // Show home page
    pages.home.classList.add('active');
    // Activate home button in sidebar
    document.querySelector('.sidebar-btn[data-page="home"]')?.classList.add('active');
  };

  // Функция обновления главной страницы (вызывается при смене плейлиста)
  window.updateHomePage = async function() {
    try {
      // Обновляем "Историю" (последние прослушанные)
      const history = await window.electronAPI.getHistory(10);
      if (history && history.length > 0) {
        loadCarousel('history-carousel', history);
        // Обновляем обложки волны из истории
        loadWaveTracks(history.slice(0, 8));
      }
      
      // Обновляем любимые треки
      const favorites = await window.electronAPI.getFavorites();
      if (favorites && favorites.length > 0) {
        loadCarousel('favorites-carousel', favorites.slice(0, 10));
      }
      
      // Обновляем чарт
      const yandexChart = await getYandexChart();
      if (yandexChart && yandexChart.length > 0) {
        currentChart = yandexChart;
        loadCarousel('yandex-chart-carousel', yandexChart);
      }
    } catch (error) {
      console.error('Error updating home page:', error);
    }
  };

  // My Wave - отдельный режим с автоподгрузкой
  let wavePlaylist = []; // Отдельный плейлист для волны
  let isWaveMode = false; // Флаг режима волны
  let isLoadingMoreWave = false; // Флаг загрузки новых треков
  window.waveTrackIds = new Set(); // Для отслеживания уже добавленных треков (глобально для loadWavePlaylist)
  window.waveTrackTitles = new Set(); // Для отслеживания нормализованных названий (глобально для loadWavePlaylist)
  const waveTrackIds = window.waveTrackIds; // Локальная ссылка для удобства
  const waveTrackTitles = window.waveTrackTitles; // Локальная ссылка для удобства
  let waveLoadAttempts = 0; // Счетчик неудачных попыток загрузки
  const MAX_WAVE_LOAD_ATTEMPTS = 3; // Максимум попыток перед рестартом
  let isWaveSimilarMode = false; // Флаг режима "Волна по треку"
  
  
  // Функция нормализации названия трека для определения дубликатов
  function normalizeTitle(title) {
    if (!title) return '';
    
    return title
      .toLowerCase()
      .trim()
      // Убираем все в скобках и квадратных скобках
      .replace(/\[.*?\]/g, '')
      .replace(/\(.*?\)/g, '')
      // Убираем типичные суффиксы
      .replace(/\b(speed\s*up|sped\s*up|spedup|nightcore)\b/gi, '')
      .replace(/\b(slow(ed)?\s*(down)?|reverb)\b/gi, '')
      .replace(/\b(remix|cover|version|edit|remaster(ed)?)\b/gi, '')
      .replace(/\b(official|audio|video|lyrics?|mv)\b/gi, '')
      .replace(/\b(feat\.?|ft\.?|featuring)\s+.*/gi, '') // Убираем featuring
      // Убираем специальные символы и лишние пробелы
      .replace(/[^\w\s\u0400-\u04FF]/g, ' ') // Оставляем только буквы, цифры, кириллицу
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  // Функция проверки схожести двух названий
  function areTitlesSimilar(title1, title2) {
    const norm1 = normalizeTitle(title1);
    const norm2 = normalizeTitle(title2);
    
    if (!norm1 || !norm2) return false;
    
    // Точное совпадение нормализованных названий
    if (norm1 === norm2) return true;
    
    // Проверка на включение одного в другое (для коротких названий)
    if (norm1.length > 3 && norm2.length > 3) {
      if (norm1.includes(norm2) || norm2.includes(norm1)) {
        return true;
      }
    }
    
    return false;
  }
  
  document.getElementById('my-wave-card').onclick = async (e) => {
    // Если клик на кнопку play или shuffle, игнорируем
    if (e.target.closest('.wave-play-btn') || e.target.closest('.wave-shuffle-btn')) {
      return;
    }
    
    // Если волна уже загружена, ничего не делаем (управление через кнопку play)
    if (isWaveMode && currentPlaylist.length > 0) {
      console.log('🌊 Wave already loaded, use play button to control playback');
      return;
    }
    
    try {
      // Сбрасываем все режимы кроме волны (которую мы сейчас включаем)
      isSearchMode = false;
      currentPlaylist = []; // Очищаем текущий плейлист
      
      // Загружаем ТОЛЬКО первый батч (5 треков) для быстрого старта
      let tracks = await getYandexWave(1);
      
      if (!tracks || tracks.length === 0) {
        if (window.showToast) {
          window.showToast('Не удалось загрузить "Мою волну". Проверьте авторизацию Яндекс.Музыки.', 'error');
        }
        return;
      }

      // Сбрасываем Sets при новом запуске волны
      waveTrackIds.clear();
      waveTrackTitles.clear();
      waveLoadAttempts = 0; // Сбрасываем счетчик попыток
      
      // Добавляем треки в Sets
      tracks.forEach(track => {
        waveTrackIds.add(track.yandexId);
        waveTrackTitles.add(track.title);
      });

      // Включаем режим волны
      isWaveMode = true;
      isWaveSimilarMode = false; // Сбрасываем режим "Волна по треку"
      wavePlaylist = tracks;
      
      // Устанавливаем ТОЛЬКО currentPlaylist для воспроизведения, НЕ трогаем playlist!
      currentPlaylist = [...tracks];
      isSearchMode = false;
      
      // Включаем режим повтора всех треков
      repeatMode = 'all';
      
      // Обновляем кнопку повтора визуально
      const repeatBtn = document.getElementById('repeat-btn');
      if (repeatBtn) {
        repeatBtn.classList.add('active');
        repeatBtn.title = 'Повтор всех (Моя волна)';
      }
      
      // Загружаем первый трек и начинаем воспроизведение
      loadTrack(0);
      
      // Обновляем главную страницу
      if (window.updateHomePage) {
        window.updateHomePage();
      }
      
      // Агрессивное автовоспроизведение
      isPlaying = true;
      updatePlayButtons(true);
      
      // Пробуем воспроизвести сразу после загрузки
      const playWhenReady = () => {
        if (audio.readyState >= 2) { // HAVE_CURRENT_DATA
          audio.play().catch(err => {
            console.error('Wave auto-play failed:', err);
            // Повторная попытка через 200ms
            setTimeout(() => {
              audio.play().catch(err2 => console.error('Wave auto-play retry failed:', err2));
            }, 200);
          });
        } else {
          // Ждем готовности
          audio.addEventListener('canplay', () => {
            audio.play().catch(err => console.error('Wave play on canplay failed:', err));
          }, { once: true });
        }
      };
      
      // Даем время на загрузку src
      setTimeout(playWhenReady, 100);
      
      console.log('🌊 Wave mode activated with', tracks.length, 'tracks (first batch). Loading more in background...');
      
      // ФОНОВАЯ ЗАГРУЗКА: загружаем оставшиеся 4 батча в фоне
      (async () => {
        try {
          const moreTracks = await getYandexWave(4);
          if (moreTracks && moreTracks.length > 0) {
            // Фильтруем дубликаты
            const newTracks = moreTracks.filter(track => {
              if (waveTrackIds.has(track.yandexId)) return false;
              waveTrackIds.add(track.yandexId);
              waveTrackTitles.add(track.title);
              return true;
            });
            
            if (newTracks.length > 0) {
              // Добавляем в плейлисты
              wavePlaylist.push(...newTracks);
              currentPlaylist.push(...newTracks);
              console.log(`🌊 Background load complete: +${newTracks.length} tracks (total: ${wavePlaylist.length})`);
            }
          }
        } catch (error) {
          console.error('Background wave load failed:', error);
        }
      })();
      
    } catch (error) {
      console.error('My Wave error:', error);
      window.toast.error('Ошибка загрузки "Моя волна"');
    }
  };

  // Wave shuffle button - перемешивает и запускает волну
  const waveShuffleBtn = document.getElementById('wave-shuffle-btn');
  if (waveShuffleBtn) {
    waveShuffleBtn.onclick = async (e) => {
      e.stopPropagation(); // Предотвращаем клик на карточку волны
      
      try {
        // Если волна уже играет, просто перемешиваем
        if (isWaveMode && currentPlaylist.length > 0) {
          console.log('🔀 Shuffling current wave playlist');
          
          // Сохраняем текущий трек
          const currentTrack = currentPlaylist[currentIndex];
          
          // Перемешиваем плейлист
          const shuffled = [...currentPlaylist];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          
          currentPlaylist = shuffled;
          
          // Находим новый индекс текущего трека
          currentIndex = currentPlaylist.findIndex(t => t.yandexId === currentTrack.yandexId);
          if (currentIndex === -1) currentIndex = 0;
          
          if (window.showToast) {
            window.showToast('Плейлист перемешан', 'success');
          }
        } else {
          // Загружаем волну и перемешиваем
          console.log('🔀 Loading and shuffling wave');
          
          // Сбрасываем все режимы
          isSearchMode = false;
          currentPlaylist = [];
          
          // Загружаем первый батч
          let tracks = await getYandexWave(1);
          
          if (!tracks || tracks.length === 0) {
            if (window.showToast) {
              window.showToast('Не удалось загрузить "Мою волну"', 'error');
            }
            return;
          }

          // Сбрасываем Sets
          waveTrackIds.clear();
          waveTrackTitles.clear();
          waveLoadAttempts = 0;
          
          // Добавляем треки в Sets
          tracks.forEach(track => {
            waveTrackIds.add(track.yandexId);
            waveTrackTitles.add(track.title);
          });

          // Перемешиваем треки
          for (let i = tracks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tracks[i], tracks[j]] = [tracks[j], tracks[i]];
          }

          // Включаем режим волны
          isWaveMode = true;
          wavePlaylist = tracks;
          currentPlaylist = [...tracks];
          repeatMode = 'all';
          
          // Обновляем кнопку повтора
          const repeatBtn = document.getElementById('repeat-btn');
          if (repeatBtn) {
            repeatBtn.classList.add('active');
            repeatBtn.title = 'Повтор всех (Моя волна)';
          }
          
          // Загружаем первый трек
          loadTrack(0);
          
          // Обновляем главную страницу
          if (window.updateHomePage) {
            window.updateHomePage();
          }
          
          // Автовоспроизведение
          isPlaying = true;
          updatePlayButtons(true);
          
          const playWhenReady = () => {
            if (audio.readyState >= 2) {
              audio.play().catch(err => {
                console.error('Shuffle wave auto-play failed:', err);
                setTimeout(() => {
                  audio.play().catch(err2 => console.error('Shuffle wave retry failed:', err2));
                }, 200);
              });
            } else {
              audio.addEventListener('canplay', () => {
                audio.play().catch(err => console.error('Shuffle wave play failed:', err));
              }, { once: true });
            }
          };
          
          setTimeout(playWhenReady, 100);
          
          console.log('🔀 Shuffled wave mode activated with', tracks.length, 'tracks');
          
          // Фоновая загрузка
          (async () => {
            try {
              const moreTracks = await getYandexWave(4);
              if (moreTracks && moreTracks.length > 0) {
                const newTracks = moreTracks.filter(track => {
                  if (waveTrackIds.has(track.yandexId)) return false;
                  waveTrackIds.add(track.yandexId);
                  waveTrackTitles.add(track.title);
                  return true;
                });
                
                if (newTracks.length > 0) {
                  wavePlaylist.push(...newTracks);
                  currentPlaylist.push(...newTracks);
                  console.log(`🔀 Background load: +${newTracks.length} tracks`);
                }
              }
            } catch (error) {
              console.error('Background shuffle wave load failed:', error);
            }
          })();
        }
      } catch (error) {
        console.error('Wave shuffle error:', error);
        if (window.showToast) {
          window.showToast('Ошибка перемешивания волны', 'error');
        }
      }
    };
  }

  // Load wave tracks
  function loadWaveTracks(tracks) {
    const container = document.getElementById('wave-tracks');
    if (!container) {
      console.warn('⚠️ Wave tracks container not found');
      return;
    }
    container.innerHTML = '';

    // Ограничиваем количество отображаемых обложек для производительности
    const displayTracks = tracks.slice(0, 10);

    displayTracks.forEach((track, index) => {
      const item = document.createElement('div');
      item.className = 'wave-cover-compact';
      
      // Используем обложку если есть (проверяем все возможные поля)
      const coverUrl = track.thumbnail || track.cover || track.coverUri;
      if (coverUrl) {
        item.innerHTML = `<img src="${coverUrl}" alt="${track.title}" loading="lazy">`;
      } else {
        item.innerHTML = `<div class="wave-cover-placeholder-compact">♪</div>`;
      }
      
      item.onclick = async (e) => {
        e.stopPropagation();
        // Воспроизводим напрямую из популярного
        await playTrackFromPopular(track);
        // Player Page открывается только при клике на mini-player
      };
      
      container.appendChild(item);
    });
  }

  // Load horizontal carousel
  function loadCarousel(carouselId, tracks) {
    const carousel = document.getElementById(carouselId);
    if (!carousel) {
      console.warn(`⚠️ Carousel element not found: ${carouselId}`);
      return;
    }
    
    carousel.innerHTML = '';

    tracks.forEach((track, index) => {
      const item = document.createElement('div');
      item.className = 'carousel-item';
      
      // Используем обложку если есть (проверяем все возможные поля)
      const coverUrl = track.thumbnail || track.cover || track.coverUri;
      const coverHtml = coverUrl
        ? `<img src="${coverUrl}" alt="Cover" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" loading="lazy">` 
        : '♪';
      
      // Иконка источника
      const sourceIconHtml = track.source 
        ? `<div class="source-icon ${track.source}">${createSourceIcon(track.source)}</div>` 
        : '';
      
      item.innerHTML = `
        <div class="carousel-cover">
          ${coverHtml}
          ${sourceIconHtml}
        </div>
        <div class="carousel-title">${track.title}</div>
        <div class="carousel-subtitle">${track.artist}</div>
      `;
      item.onclick = async () => {
        // Для чарта - воспроизводим напрямую
        if (carouselId === 'yandex-chart-carousel') {
          await playTrackFromChart(track, tracks, index);
        } else if (carouselId === 'history-carousel') {
          // История - только показывает последние прослушанные треки
          // НЕ участвует в логике "следующий трек"
          console.log('🎵 Playing track from history (standalone):', track.title);
          
          // Просто воспроизводим трек без изменения плейлистов
          resetPlaybackModes();
          isSearchMode = false;
          currentPlaylist = [track]; // Только этот трек
          loadTrack(0);
          if (!isPlaying) togglePlay();
        } else if (carouselId === 'favorites-carousel') {
          currentPlaylist = tracks;
          loadTrack(index);
          if (!isPlaying) togglePlay();
        } else if (carouselId === 'favorites-carousel') {
          // Сбрасываем режимы перед воспроизведением из избранного
          resetPlaybackModes();
          
          // Для любимых - воспроизводим напрямую
          currentPlaylist = tracks;
          loadTrack(index);
          if (!isPlaying) togglePlay();
        } else {
          // Сбрасываем режимы для остальных каруселей
          resetPlaybackModes();
          
          // Для остальных каруселей
          const trackIndex = playlist.findIndex(t => t.url === track.url);
          if (trackIndex !== -1) {
            // Очищаем currentPlaylist чтобы использовать основной playlist
            currentPlaylist = [];
            loadTrack(trackIndex);
            if (!isPlaying) togglePlay();
          }
        }
      };
      carousel.appendChild(item);
    });
    
    // Добавляем прокрутку колесиком мыши для чарта
    if (carouselId === 'yandex-chart-carousel') {
      carousel.addEventListener('wheel', (e) => {
        e.preventDefault();
        carousel.scrollLeft += e.deltaY;
      }, { passive: false });
    }
  }

  // Load albums grid
  function loadAlbumsGrid(gridId, tracks) {
    const grid = document.getElementById(gridId);
    grid.innerHTML = '';

    tracks.forEach((track, index) => {
      const card = document.createElement('div');
      card.className = 'album-card';
      card.innerHTML = `
        <div class="album-cover">♪</div>
        <div class="album-title">${track.title}</div>
        <div class="album-artist">${track.artist}</div>
      `;
      card.onclick = () => {
        const trackIndex = playlist.findIndex(t => t.url === track.url);
        if (trackIndex !== -1) {
          loadTrack(trackIndex);
          if (!isPlaying) togglePlay();
        }
      };
      grid.appendChild(card);
    });
  }

  // Search
  const searchInput = document.getElementById('search-input');
  
  if (!searchInput) {
    console.warn('⚠️ Search input not found, skipping search setup (probably on playlists page)');
    // Don't return - this is not critical for playlists page
  } else {
    let searchTimeout;
    let currentSearchFilter = 'all'; // Текущий фильтр поиска

    // Обработчики фильтров поиска
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.onclick = () => {
        // Убираем active у всех
        filterBtns.forEach(b => b.classList.remove('active'));
        // Добавляем active к текущей
        btn.classList.add('active');
        // Сохраняем фильтр
        currentSearchFilter = btn.dataset.filter;
        
        // Перезапускаем поиск если есть запрос
        const query = searchInput.value.trim();
        if (query) {
          performSearch(query);
        }
      };
    });

    // Функция поиска с учетом фильтра
    async function performSearch(query) {
      console.log(`Searching for "${query}" with filter: ${currentSearchFilter}`);
      
      let results = [];
      
      switch(currentSearchFilter) {
        case 'all':
          // Ищем треки, артистов и плейлисты
          results = await searchTracks(query, currentSource);
          break;
        case 'tracks':
          results = await searchTracks(query, currentSource);
          break;
        case 'albums':
          // Поиск альбомов через Яндекс
          try {
            const response = await fetch(`${YOUTUBE_SERVER_URL}/api/yandex/search-albums?q=${encodeURIComponent(query)}`);
            if (response.ok) {
              results = await response.json();
            }
          } catch (e) {
            console.error('Album search error:', e);
            results = [];
          }
          break;
        case 'artists':
          // Поиск артистов через Яндекс
          try {
            const response = await fetch(`${YOUTUBE_SERVER_URL}/api/yandex/search-artists?q=${encodeURIComponent(query)}`);
            if (response.ok) {
              results = await response.json();
            }
          } catch (e) {
            console.error('Artist search error:', e);
            results = [];
          }
          break;
        case 'lyrics':
          // Поиск по тексту песни
          try {
            const response = await fetch(`${YOUTUBE_SERVER_URL}/api/yandex/search-lyrics?q=${encodeURIComponent(query)}`);
            if (response.ok) {
              results = await response.json();
            } else {
              // Fallback: обычный поиск треков
              results = await searchTracks(query, currentSource);
            }
          } catch (e) {
            console.error('Lyrics search error:', e);
            results = await searchTracks(query, currentSource);
          }
          break;
      }
      
      displaySearchResults(results, currentSearchFilter);
    }

    searchInput.oninput = () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(async () => {
        const query = searchInput.value.trim();
        if (query) {
          await performSearch(query);
        } else {
          // Show recommendations when search is empty
          await showSearchRecommendations();
        }
      }, 500);
    };
    
    // Show recommendations when search page is opened
    async function showSearchRecommendations() {
      const resultsContainer = document.getElementById('search-results');
      resultsContainer.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: rgba(255, 255, 255, 0.5);">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" style="opacity: 0.3; margin-bottom: 20px;">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <p style="font-size: 18px; margin-bottom: 10px;">Начните поиск</p>
          <p style="font-size: 14px;">Введите название трека, артиста или текст песни</p>
        </div>
      `;
    }
    
    // Show recommendations when navigating to search page
    document.querySelector('.sidebar-btn[data-page="search"]')?.addEventListener('click', () => {
      if (!searchInput.value.trim()) {
        showSearchRecommendations();
      }
    });

    function displaySearchResults(tracks, filter = 'all') {
      const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '';
    
    if (tracks.length === 0) {
      resultsContainer.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: rgba(255, 255, 255, 0.5);">
          <p style="font-size: 16px;">Ничего не найдено</p>
        </div>
      `;
      return;
    }
    
    // Сохраняем результаты поиска глобально для навигации
    searchPlaylist = tracks;
    
    // Заголовок с количеством треков
    const headerDiv = document.createElement('div');
    headerDiv.className = 'search-results-header';
    headerDiv.innerHTML = `
      <div class="search-results-info">
        <span>Найдено треков: ${tracks.length}</span>
      </div>
    `;
    resultsContainer.appendChild(headerDiv);

    tracks.forEach((track, index) => {
      const item = document.createElement('div');
      item.className = 'playlist-track-item';
      
      // Проверяем, есть ли трек в плейлисте (по ID или по title+artist)
      const isInPlaylist = playlist.some(t => {
        // Проверка по ID (если есть)
        if (track.id && t.id && track.id === t.id) {
          return true;
        }
        // Проверка по URL (если совпадают)
        if (track.url && t.url && track.url === t.url) {
          return true;
        }
        // Проверка по title + artist (fallback)
        if (track.title && t.title && track.artist && t.artist) {
          return track.title.toLowerCase() === t.title.toLowerCase() && 
                 track.artist.toLowerCase() === t.artist.toLowerCase();
        }
        return false;
      });
      
      const coverHtml = (track.coverArt || track.thumbnail)
        ? `<img src="${track.coverArt || track.thumbnail}" alt="Cover" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px;">` 
        : '♪';
      
      // Добавляем иконку источника на обложку
      const sourceIconHtml = track.source 
        ? `<div class="source-icon ${track.source}">${createSourceIcon(track.source)}</div>` 
        : '';
      
      const duration = track.durationString || ((track.durationMs || track.duration) ? formatTime((track.durationMs || track.duration) / 1000) : '--:--');
      
      // Иконка добавления: галочка если уже добавлен, плюс если нет
      const addIcon = isInPlaylist 
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
             <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
           </svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
             <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
           </svg>`;
      
      item.innerHTML = `
        <div class="playlist-track-number">${index + 1}</div>
        <div class="playlist-track-cover">
          ${coverHtml}
          ${sourceIconHtml}
        </div>
        <div class="playlist-track-info">
          <div class="playlist-track-title">${track.title}</div>
          <div class="playlist-track-artist">${track.artist}</div>
        </div>
        <div class="playlist-track-duration">${duration}</div>
        <button class="btn-icon-small play-search-btn" title="Играть">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
        <button class="btn-icon-small add-search-btn ${isInPlaylist ? 'added' : ''}" title="${isInPlaylist ? 'Уже в плейлисте' : 'Добавить'}" ${isInPlaylist ? 'disabled' : ''}>
          ${addIcon}
        </button>
      `;
      
      // Play button
      const playBtn = item.querySelector('.play-search-btn');
      playBtn.onclick = async (e) => {
        e.stopPropagation();
        
        console.log('🎵 [SEARCH PLAY] Starting playback from search');
        console.log('  Track:', track.title, 'by', track.artist);
        console.log('  Source:', track.source);
        console.log('  Track ID:', track.id);
        
        // Сбрасываем все режимы воспроизведения (волна, шаффл и т.д.)
        resetPlaybackModes();
        
        // Устанавливаем режим поиска в false, так как играем конкретный трек
        isSearchMode = false;
        
        // Получаем stream URL в зависимости от источника
        let streamUrl = null;
        
        if (track.source === 'soundcloud' && track.id && track.id.startsWith('sc_')) {
          // SoundCloud - используем наш API
          const trackId = track.id.split('_')[1];
          streamUrl = `${YOUTUBE_SERVER_URL}/api/soundcloud/stream/${trackId}`;
        } else if (track.source === 'yandex' && track.id && track.id.startsWith('ym_')) {
          // Yandex Music - используем наш API
          const trackId = track.id.split('_')[1];
          streamUrl = `${YOUTUBE_SERVER_URL}/api/yandex/stream/${trackId}`;
        } else if (track.source === 'spotify' && track.id && track.id.startsWith('sp_')) {
          // Spotify - только preview
          streamUrl = track.previewUrl;
          if (!streamUrl) {
            if (window.showToast) {
              window.showToast('Spotify треки доступны только как 30-секундный preview', 'warning');
            }
            return;
          }
        } else {
          // YouTube или другие источники - используем прямой URL
          streamUrl = track.url;
        }
        
        if (!streamUrl) {
          console.error('❌ [SEARCH PLAY] Cannot determine stream URL for track:', track);
          if (window.showToast) {
            window.showToast('Не удалось получить URL трека', 'error');
          }
          return;
        }
        
        console.log('✅ [SEARCH PLAY] Stream URL determined:', streamUrl);
        
        // Конвертируем ВСЕ результаты поиска в формат плейлиста
        console.log('📋 [SEARCH PLAY] Converting all search results to playlist format...');
        currentPlaylist = searchPlaylist.map(searchTrack => {
          let trackStreamUrl = null;
          
          // Определяем stream URL для каждого трека
          if (searchTrack.source === 'soundcloud' && searchTrack.id && searchTrack.id.startsWith('sc_')) {
            const trackId = searchTrack.id.split('_')[1];
            trackStreamUrl = `${YOUTUBE_SERVER_URL}/api/soundcloud/stream/${trackId}`;
          } else if (searchTrack.source === 'yandex' && searchTrack.id && searchTrack.id.startsWith('ym_')) {
            const trackId = searchTrack.id.split('_')[1];
            trackStreamUrl = `${YOUTUBE_SERVER_URL}/api/yandex/stream/${trackId}`;
          } else if (searchTrack.source === 'spotify' && searchTrack.id && searchTrack.id.startsWith('sp_')) {
            trackStreamUrl = searchTrack.previewUrl;
          } else {
            trackStreamUrl = searchTrack.url;
          }
          
          return {
            title: searchTrack.title,
            artist: searchTrack.artist,
            url: trackStreamUrl,
            cover: searchTrack.coverArt || searchTrack.thumbnail || '',
            duration: searchTrack.durationMs || searchTrack.duration || 0,
            source: searchTrack.source,
            id: searchTrack.id,
            isTemp: true
          };
        });
        
        console.log('📋 [SEARCH PLAY] Converted playlist, length:', currentPlaylist.length);
        
        // Находим индекс кликнутого трека
        const clickedIndex = index;
        console.log('🎯 [SEARCH PLAY] Clicked track index:', clickedIndex);
        
        // Загружаем кликнутый трек
        console.log('▶️ [SEARCH PLAY] Calling loadTrack(' + clickedIndex + ')...');
        await loadTrack(clickedIndex);
        console.log('✅ [SEARCH PLAY] loadTrack completed, isPlaying:', isPlaying);
        
        if (!isPlaying) {
          console.log('▶️ [SEARCH PLAY] Calling togglePlay...');
          togglePlay();
        }
        
        // Player Page открывается только при клике на mini-player
      };
      
      // Add button
      const addBtn = item.querySelector('.add-search-btn');
      if (!isInPlaylist) {
        addBtn.onclick = async (e) => {
          e.stopPropagation();
          
          // Получаем stream URL в зависимости от источника
          let streamUrl = null;
          
          if (track.source === 'soundcloud' && track.id && track.id.startsWith('sc_')) {
            // SoundCloud - используем наш API
            const trackId = track.id.split('_')[1];
            streamUrl = `${YOUTUBE_SERVER_URL}/api/soundcloud/stream/${trackId}`;
          } else if (track.source === 'yandex' && track.id && track.id.startsWith('ym_')) {
            // Yandex Music - используем наш API
            const trackId = track.id.split('_')[1];
            streamUrl = `${YOUTUBE_SERVER_URL}/api/yandex/stream/${trackId}`;
          } else if (track.source === 'spotify' && track.id && track.id.startsWith('sp_')) {
            // Spotify - только preview
            streamUrl = track.previewUrl;
            if (!streamUrl) {
              if (window.showToast) {
                window.showToast('Spotify треки доступны только как 30-секундный preview', 'warning');
              }
              return;
            }
          } else {
            // YouTube или другие источники - используем прямой URL
            streamUrl = track.url;
          }
          
          if (!streamUrl) {
            console.error('Cannot determine stream URL for track:', track);
            if (window.showToast) {
              window.showToast('Не удалось получить URL трека', 'error');
            }
            return;
          }
          
          const result = await window.electronAPI.addTrack({
            title: track.title,
            artist: track.artist,
            url: streamUrl,
            cover: track.coverArt || track.thumbnail || '',
            duration: track.durationMs || track.duration || 0,
            source: track.source || currentSource,
            addedAt: Date.now()
          });
          
          if (result.success) {
            playlist = await loadFullPlaylist();
            const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
            loadPlaylistPage(playlistSortSelect?.value || 'default', activeFilter);
            
            // Обновляем счетчик в сайдбаре
            if (window.updatePlaylistCounts) {
              window.updatePlaylistCounts();
            }
            
            // Меняем на галочку
            addBtn.innerHTML = `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            `;
            addBtn.classList.add('added');
            addBtn.disabled = true;
            addBtn.title = 'Уже в плейлисте';
          }
        };
      }
      
      resultsContainer.appendChild(item);
    });
  }
  } // End of search input conditional block

  // Add tracks modal
  const addModal = document.getElementById('add-modal');
  const trackInput = document.getElementById('track-input');

  document.getElementById('add-track-btn').onclick = () => {
    addModal.classList.add('show');
  };

  document.getElementById('cancel-btn').onclick = () => {
    addModal.classList.remove('show');
    trackInput.value = '';
  };
  
  // Close button for modal
  const closeAddModalBtn = document.getElementById('close-add-modal');
  if (closeAddModalBtn) {
    closeAddModalBtn.onclick = () => {
      addModal.classList.remove('show');
      trackInput.value = '';
    };
  }
  
  // Close modal on backdrop click
  addModal.onclick = (e) => {
    if (e.target === addModal) {
      addModal.classList.remove('show');
      trackInput.value = '';
    }
  };

  // Функция предзагрузки трека в кеш
  async function preloadTrack(url) {
    try {
      // Проверяем что URL существует
      if (!url || typeof url !== 'string') {
        return;
      }
      
      // Извлекаем videoId из URL
      const videoIdMatch = url.match(/\/api\/stream\/([^/?]+)/);
      if (!videoIdMatch) {
        // Тихо пропускаем не-YouTube URL (например, Yandex)
        return;
      }
      
      const videoId = videoIdMatch[1];
      
      // Проверяем статус кеша
      const statusResponse = await fetch(`${YOUTUBE_SERVER_URL}/api/cache-status/${videoId}`);
      
      if (!statusResponse.ok) {
        // Тихо пропускаем ошибки проверки кеша
        return;
      }
      
      const status = await statusResponse.json();
      
      if (status.cached) {
        console.log('✅ Already cached:', videoId);
        return;
      }
      
      // Запускаем предзагрузку
      console.log('🔄 Preloading:', videoId);
      const preloadResponse = await fetch(`${YOUTUBE_SERVER_URL}/api/preload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId })
      });
      
      if (preloadResponse.ok) {
        console.log('✅ Preload started:', videoId);
      }
      
    } catch (error) {
      console.error('Preload error:', error);
    }
  }

  document.getElementById('confirm-btn').onclick = async () => {
    const trackList = trackInput.value.trim();
    if (!trackList) return;

    const tracks = trackList.split('\n').filter(t => t.trim());
    let added = 0;
    const addedTracks = [];

    for (const trackString of tracks) {
      try {
        console.log(`🔍 Searching for: "${trackString}" in source: ${currentSource}`);
        const results = await searchTracks(trackString, currentSource);
        
        if (results.length > 0) {
          let track = results[0];
          console.log(`✅ Found track: ${track.title} - ${track.artist} (source: ${track.source})`);
          
          // НОВОЕ: Конвертируем трек в Яндекс/SoundCloud если нужно
          if (trackConverter && trackConverter.needsConversion(track)) {
            console.log(`🔄 Track needs conversion from ${track.source} to Yandex`);
            const originalSource = track.source;
            track = await trackConverter.convertTrack(track);
            console.log(`✅ Conversion result: ${originalSource} → ${track.source}`);
          } else {
            console.log(`✅ Track already from Yandex, no conversion needed`);
          }
          
          // Сохраняем трек в плейлист
          const result = await window.electronAPI.addTrack({
            title: track.title,
            artist: track.artist,
            url: track.url,
            cover: track.thumbnail || track.cover || track.coverArt || '',
            duration: track.duration || track.durationMs || 0,
            source: track.source,
            yandexId: track.yandexId,
            soundcloudId: track.soundcloudId
          });
          
          if (result.success) {
            added++;
            addedTracks.push(track);
            console.log(`💾 Track saved to playlist: ${track.title} (source: ${track.source})`);
          } else {
            // Если трек уже существует - это не ошибка
            if (result.error && result.error.includes('already exists')) {
              console.log(`ℹ️ Track already in playlist: ${track.title}`);
            } else {
              console.warn(`⚠️ Failed to save track: ${track.title}`, result.error);
            }
          }
        } else {
          console.warn(`⚠️ No results found for: "${trackString}"`);
        }
      } catch (error) {
        console.error('Error adding track:', trackString, error);
      }
    }

    if (window.showToast) {
      window.showToast(`Добавлено треков: ${added} из ${tracks.length}`, added > 0 ? 'success' : 'warning');
    }
    
    addModal.classList.remove('show');
    trackInput.value = '';
    
    // Перезагружаем плейлист из базы данных
    playlist = await loadFullPlaylist();
    
    // Обновляем счетчик в сайдбаре
    if (window.updatePlaylistCounts) {
      window.updatePlaylistCounts();
    }
    
    // Если мы на странице плейлиста - обновляем отображение
    if (pages.playlist && pages.playlist.classList.contains('active')) {
      console.log('📋 Updating playlist view after adding tracks');
      if (window.loadPlaylistTracks) {
        window.loadPlaylistTracks('main');
      }
    }
    
    // Предзагружаем все добавленные треки в фоне
    if (addedTracks.length > 0) {
      console.log(`🔄 Preloading ${addedTracks.length} tracks...`);
      for (const track of addedTracks) {
        preloadTrack(track.url);
      }
    }
  };

  // Shuffle button
  const shuffleBtn = document.getElementById('shuffle-btn');
  if (shuffleBtn) {
    shuffleBtn.onclick = () => {
      isShuffleEnabled = !isShuffleEnabled;
      shuffleBtn.classList.toggle('active', isShuffleEnabled);
      console.log('Shuffle:', isShuffleEnabled ? 'ON' : 'OFF');
    };
  }

  // Repeat button (cycles: off -> all -> one -> off)
  const repeatBtn = document.getElementById('repeat-btn');
  if (repeatBtn) {
    repeatBtn.onclick = () => {
      if (repeatMode === 'off') {
        repeatMode = 'all';
        repeatBtn.classList.add('active');
        repeatBtn.title = 'Повтор всех';
        console.log('Repeat: ALL');
      } else if (repeatMode === 'all') {
        repeatMode = 'one';
        repeatBtn.classList.add('active');
        repeatBtn.style.opacity = '1';
        repeatBtn.title = 'Повтор одного';
        // Добавляем индикатор "1"
        repeatBtn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
          </svg>
          <span style="position: absolute; font-size: 10px; font-weight: bold; top: 50%; left: 50%; transform: translate(-50%, -50%);">1</span>
        `;
        console.log('Repeat: ONE');
      } else {
        repeatMode = 'off';
        repeatBtn.classList.remove('active');
        repeatBtn.style.opacity = '';
        repeatBtn.title = 'Повтор';
        repeatBtn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
          </svg>
        `;
        console.log('Repeat: OFF');
      }
    };
  }
  
  // Update button - показывается только когда есть обновление
  const updateBtn = document.getElementById('update-btn');
  if (updateBtn) {
    // Скрываем кнопку по умолчанию
    updateBtn.style.display = 'none';
    
    // Слушаем события обновления
    if (window.electronAPI && window.electronAPI.onUpdateAvailable) {
      window.electronAPI.onUpdateAvailable((info) => {
        console.log('✅ Update available:', info);
        updateBtn.style.display = 'flex';
        updateBtn.title = `Доступна версия ${info.version}`;
      });
    }
    
    if (window.electronAPI && window.electronAPI.onUpdateNotAvailable) {
      window.electronAPI.onUpdateNotAvailable(() => {
        console.log('✅ No updates available');
        updateBtn.style.display = 'none';
      });
    }
    
    // Обработчик клика - запускаем проверку обновлений
    updateBtn.onclick = () => {
      if (window.electronAPI && window.electronAPI.checkForUpdates) {
        window.electronAPI.checkForUpdates();
      }
    };
  }

  // Lyrics (removed - using modal instead)

  // Load playlist page
  function loadPlaylistPage(sortBy = 'default', filterBy = 'all') {
    const container = document.getElementById('playlist-tracks');
    
    // Если элемента нет (новая структура плейлистов), пропускаем
    if (!container) {
      console.log('⏭️ Skipping loadPlaylistPage - using new playlist library');
      return;
    }
    
    container.innerHTML = '';
    
    if (playlist.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: rgba(255, 255, 255, 0.5);">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" style="opacity: 0.3; margin-bottom: 20px;">
            <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
          </svg>
          <p style="font-size: 18px; margin-bottom: 10px;">Плейлист пуст</p>
          <p style="font-size: 14px;">Добавьте треки через поиск, загрузите MP3 файлы или нажмите "+"</p>
        </div>
      `;
      return;
    }
    
    // Фильтруем временные треки
    let filteredPlaylist = playlist.filter(t => !t.isTemp).map((t, idx) => ({ ...t, originalIndex: idx }));
    
    // Применяем фильтр по типу
    if (filterBy === 'local') {
      filteredPlaylist = filteredPlaylist.filter(t => t.isLocal);
    } else if (filterBy === 'online') {
      filteredPlaylist = filteredPlaylist.filter(t => !t.isLocal);
    }
    
    // Сортировка
    switch(sortBy) {
      case 'title-asc':
        filteredPlaylist.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'title-desc':
        filteredPlaylist.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
        break;
      case 'artist-asc':
        filteredPlaylist.sort((a, b) => (a.artist || '').localeCompare(b.artist || ''));
        break;
      case 'artist-desc':
        filteredPlaylist.sort((a, b) => (b.artist || '').localeCompare(a.artist || ''));
        break;
      case 'duration-asc':
        filteredPlaylist.sort((a, b) => (a.duration || 0) - (b.duration || 0));
        break;
      case 'duration-desc':
        filteredPlaylist.sort((a, b) => (b.duration || 0) - (a.duration || 0));
        break;
      case 'date-asc':
        filteredPlaylist.sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0));
        break;
      case 'date-desc':
        filteredPlaylist.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
        break;
    }
    
    if (filteredPlaylist.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: rgba(255, 255, 255, 0.5);">
          <p style="font-size: 18px; margin-bottom: 10px;">Нет треков</p>
          <p style="font-size: 14px;">В этой категории пока нет треков</p>
        </div>
      `;
      return;
    }
    
    filteredPlaylist.forEach((track, displayIndex) => {
      const index = track.originalIndex;
      
      const item = document.createElement('div');
      item.className = 'playlist-track-item';
      if (index === currentIndex) {
        item.classList.add('playing');
      }
      
      // Используем настоящую обложку или заглушку
      const coverHtml = track.cover 
        ? `<img src="${track.cover}" alt="Cover" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px;">` 
        : '♪';
      
      // Форматируем длительность
      const duration = (track.duration && !isNaN(track.duration)) ? formatTime(track.duration / 1000) : '--:--';
      
      // Метка локального файла
      const localBadge = track.isLocal ? '<span style="background: rgba(76, 175, 80, 0.2); color: #4CAF50; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-left: 8px;">LOCAL</span>' : '';
      
      item.innerHTML = `
        <div class="playlist-track-number">${displayIndex + 1}</div>
        <div class="playlist-track-cover">${coverHtml}</div>
        <div class="playlist-track-info">
          <div class="playlist-track-title">${track.title}${localBadge}</div>
          <div class="playlist-track-artist">${track.artist}</div>
        </div>
        <div class="playlist-track-duration">${duration}</div>
        <button class="btn-icon-small remove-track-btn" title="Удалить">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      `;
      
      // Click to play
      item.onclick = (e) => {
        if (!e.target.closest('.remove-track-btn')) {
          // Сбрасываем все режимы воспроизведения
          resetPlaybackModes();
          currentPlaylist = []; // Сбрасываем currentPlaylist чтобы использовать основной playlist
          
          loadTrack(index);
          if (!isPlaying) togglePlay();
          // Player Page открывается только при клике на mini-player
        }
      };
      
      // Remove button
      item.querySelector('.remove-track-btn').onclick = async (e) => {
        e.stopPropagation();
        
        if (confirm(`Удалить "${track.title}"?`)) {
          await window.electronAPI.removeTrack(index);
          playlist = await loadFullPlaylist();
          
          // Обновляем счетчик в сайдбаре
          if (window.updatePlaylistCounts) {
            window.updatePlaylistCounts();
          }
          
          // Если удалили текущий трек
          if (index === currentIndex) {
            audio.pause();
            currentIndex = -1;
            isPlaying = false;
            updatePlayButtons(false);
          } else if (index < currentIndex) {
            currentIndex--;
          }
          
          const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
          loadPlaylistPage(sortBy, activeFilter);
        }
      };
      
      container.appendChild(item);
    });
  }
  
  // Сортировка плейлиста
  const playlistSortSelect = document.getElementById('playlist-sort');
  if (playlistSortSelect) {
    playlistSortSelect.onchange = () => {
      const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
      loadPlaylistPage(playlistSortSelect.value, activeFilter);
    };
  }
  
  // Фильтрация плейлиста
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(btn => {
    btn.onclick = () => {
      // Убираем active со всех кнопок
      filterButtons.forEach(b => b.classList.remove('active'));
      // Добавляем active на текущую
      btn.classList.add('active');
      // Перезагружаем плейлист с фильтром
      const sortBy = playlistSortSelect?.value || 'default';
      const filterBy = btn.dataset.filter;
      loadPlaylistPage(sortBy, filterBy);
    };
  });
  
  // Загрузка локальных MP3 файлов
  const uploadDropzone = document.getElementById('upload-dropzone');
  const fileInput = document.getElementById('file-input');
  
  if (uploadDropzone && fileInput) {
    // Click to open file picker
    uploadDropzone.onclick = () => fileInput.click();
    
    // Drag & drop handlers
    uploadDropzone.ondragover = (e) => {
      e.preventDefault();
      uploadDropzone.classList.add('drag-over');
    };
    
    uploadDropzone.ondragleave = () => {
      uploadDropzone.classList.remove('drag-over');
    };
    
    uploadDropzone.ondrop = async (e) => {
      e.preventDefault();
      uploadDropzone.classList.remove('drag-over');
      
      const files = Array.from(e.dataTransfer.files).filter(f => 
        f.type === 'audio/mpeg' || f.type === 'audio/mp3' || f.name.endsWith('.mp3')
      );
      
      if (files.length > 0) {
        await handleLocalFiles(files);
      }
    };
    
    // File input change
    fileInput.onchange = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        await handleLocalFiles(files);
      }
      fileInput.value = ''; // Reset
    };
  }
  
  // Handle local MP3 files
  async function handleLocalFiles(files) {
    console.log(`Processing ${files.length} local files...`);
    
    for (const file of files) {
      try {
        // Read file as base64
        const reader = new FileReader();
        const fileData = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        // Extract metadata using jsmediatags (if available) or use filename
        const fileName = file.name.replace('.mp3', '');
        const parts = fileName.split(' - ');
        const artist = parts.length > 1 ? parts[0] : 'Unknown Artist';
        const title = parts.length > 1 ? parts.slice(1).join(' - ') : fileName;
        
        // Create track object
        const track = {
          title: title,
          artist: artist,
          url: fileData, // Base64 data URL
          cover: null,
          duration: 0, // Will be set when audio loads
          source: 'local',
          isLocal: true,
          addedAt: Date.now()
        };
        
        // Add to playlist
        await window.electronAPI.addTrack(track);
        
        console.log(`Added local track: ${title}`);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }
    
    // Reload playlist
    playlist = await loadFullPlaylist();
    const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
    loadPlaylistPage(playlistSortSelect?.value || 'default', activeFilter);
    
    // Обновляем счетчик в сайдбаре
    if (window.updatePlaylistCounts) {
      window.updatePlaylistCounts();
    }
    
    window.toast.success(`Добавлено оффлайн треков: ${files.length}`);
  }
  
  // Обновляем плейлист при переходе на страницу
  document.querySelector('.sidebar-btn[data-page="playlist"]').addEventListener('click', () => {
    const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
    loadPlaylistPage(playlistSortSelect?.value || 'default', activeFilter);
  });

  // ============ ARTISTS PAGE ============
  
  // Загрузка списка исполнителей
  async function loadArtistsPage() {
    const artistsGrid = document.getElementById('artists-grid');
    const artistDetail = document.getElementById('artist-detail');
    
    if (!artistsGrid || !artistDetail) {
      console.error('Artists page elements not found');
      return;
    }
    
    // Показываем сетку, скрываем детали
    artistsGrid.style.display = 'grid';
    artistDetail.style.display = 'none';
    
    // Загружаем плейлист
    const currentPlaylist = await loadFullPlaylist();
    
    console.log('Loading artists from playlist, length:', currentPlaylist.length);
    
    // Группируем треки по исполнителям
    const artistsMap = {};
    
    currentPlaylist.forEach(track => {
      const artistName = track.artist || 'Unknown Artist';
      if (!artistsMap[artistName]) {
        artistsMap[artistName] = {
          name: artistName,
          trackCount: 0,
          cover: track.cover || null
        };
      }
      artistsMap[artistName].trackCount++;
    });
    
    // Сортируем по количеству треков (популярности)
    const artists = Object.values(artistsMap).sort((a, b) => b.trackCount - a.trackCount);
    
    console.log('Found artists in playlist:', artists.length);
    
    artistsGrid.innerHTML = '';
    
    if (artists.length === 0) {
      artistsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: rgba(255, 255, 255, 0.5);">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" style="opacity: 0.3; margin-bottom: 20px;">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
          <p style="font-size: 18px; margin-bottom: 10px;">Нет исполнителей</p>
          <p style="font-size: 14px;">Добавьте треки в плейлист</p>
        </div>
      `;
      return;
    }
    
    artists.forEach(artist => {
      const card = document.createElement('div');
      card.className = 'artist-card';
      
      const avatarHtml = artist.cover 
        ? `<img src="${artist.cover}" alt="${artist.name}">` 
        : '♪';
      
      card.innerHTML = `
        <div class="artist-card-avatar">${avatarHtml}</div>
        <div class="artist-card-name">${artist.name}</div>
        <div class="artist-card-tracks">${artist.trackCount} ${artist.trackCount === 1 ? 'трек' : 'треков'} в плейлисте</div>
      `;
      
      card.onclick = () => showArtistDetail(artist);
      
      artistsGrid.appendChild(card);
    });
    
    console.log('Artists grid populated with', artists.length, 'artists');
  }
  
  // Показать детали исполнителя
  async function showArtistDetail(artist) {
    const artistsGrid = document.getElementById('artists-grid');
    const artistDetail = document.getElementById('artist-detail');
    const artistAvatar = document.getElementById('artist-avatar');
    const artistName = document.getElementById('artist-name');
    const artistStats = document.getElementById('artist-stats');
    const artistTracks = document.getElementById('artist-tracks');
    
    // Скрываем сетку, показываем детали
    artistsGrid.style.display = 'none';
    artistDetail.style.display = 'block';
    
    // Заполняем информацию
    const avatarHtml = artist.avatar 
      ? `<img src="${artist.avatar}" alt="${artist.name}">` 
      : '♪';
    artistAvatar.innerHTML = avatarHtml;
    artistName.textContent = artist.name;
    artistStats.textContent = 'Загрузка треков...';
    
    // Показываем загрузку
    artistTracks.innerHTML = `
      <div style="text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.5);">
        <p>Загрузка треков исполнителя...</p>
      </div>
    `;
    
    try {
      // Ищем треки исполнителя онлайн со всех платформ
      artistStats.textContent = 'Поиск треков...';
      
      const allTracks = [];
      const sources = ['youtube', 'yandex', 'spotify', 'soundcloud'];
      
      // Параллельный поиск по всем источникам
      const searchPromises = sources.map(async (source) => {
        try {
          const tracks = await searchTracks(artist.name, source);
          return tracks.map(track => ({ ...track, source }));
        } catch (e) {
          console.error(`Failed to search ${source}:`, e);
          return [];
        }
      });
      
      const results = await Promise.all(searchPromises);
      results.forEach(tracks => allTracks.push(...tracks));
      
      console.log(`Found ${allTracks.length} tracks for ${artist.name} from all sources`);
      
      artistStats.textContent = `${allTracks.length} ${allTracks.length === 1 ? 'трек' : 'треков'} найдено`;
      
      // Отображаем треки
      artistTracks.innerHTML = '';
      
      if (allTracks.length === 0) {
        artistTracks.innerHTML = `
          <div style="text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.5);">
            <p>Треки не найдены</p>
          </div>
        `;
        return;
      }
      
      allTracks.forEach((track, idx) => {
        const item = document.createElement('div');
        item.className = 'playlist-track-item';
        
        const coverHtml = track.thumbnail 
          ? `<img src="${track.thumbnail}" alt="Cover" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px;">` 
          : '♪';
        
        const duration = (track.duration && !isNaN(track.duration)) ? formatTime(track.duration / 1000) : '--:--';
        const sourceBadge = track.source ? `<span style="background: rgba(255, 255, 255, 0.1); padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-left: 4px;">${track.source.toUpperCase()}</span>` : '';
        
        item.innerHTML = `
          <div class="playlist-track-number">${idx + 1}</div>
          <div class="playlist-track-cover">${coverHtml}</div>
          <div class="playlist-track-info">
            <div class="playlist-track-title">${track.title}${sourceBadge}</div>
            <div class="playlist-track-artist">${track.artist}</div>
          </div>
          <div class="playlist-track-duration">${duration}</div>
        `;
        
        item.onclick = async () => {
          // Создаем временный трек для воспроизведения
          const tempTrack = {
            title: track.title,
            artist: track.artist,
            url: track.url,
            cover: track.thumbnail,
            duration: track.duration,
            source: track.source,
            isTemp: true
          };
          
          // КРИТИЧНО: Выключаем режим волны при переходе к поиску
          isWaveMode = false;
          
          // Добавляем во временный плейлист и активируем режим поиска
          searchPlaylist = [tempTrack];
          isSearchMode = true;
          
          console.log('Playing artist track:', tempTrack.title);
          
          // Загружаем и воспроизводим
          loadTrack(0);
          if (!isPlaying) togglePlay();
          // Player Page открывается только при клике на mini-player
        };
        
        artistTracks.appendChild(item);
      });
    } catch (error) {
      console.error('Failed to load artist tracks:', error);
      artistTracks.innerHTML = `
        <div style="text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.5);">
          <p>Ошибка загрузки треков</p>
          <p style="font-size: 12px; margin-top: 10px;">${error.message}</p>
        </div>
      `;
    }
  }
  
  // Кнопка "Назад" на странице исполнителя
  const backToArtistsBtn = document.getElementById('back-to-artists');
  if (backToArtistsBtn) {
    backToArtistsBtn.onclick = () => {
      loadArtistsPage();
    };
  }

  // Load initial data
  (async () => {
    // Update current account display
    await updateAccountDisplay();
    
    // Загружаем плейлист с локальными треками
    playlist = await loadFullPlaylist();
    
    // Предзагружаем все треки из плейлиста в фоне
    console.log(`🔄 Preloading ${playlist.length} tracks from playlist...`);
    for (const track of playlist) {
      preloadTrack(track.url);
    }
    
    // Load saved settings
    const settings = await window.electronAPI.getSettings();
    if (settings.defaultSource) {
      currentSource = settings.defaultSource;
      const sourceBtn = document.querySelector(`.source-btn[data-source="${currentSource}"]`);
      if (sourceBtn) {
        document.querySelectorAll('.source-btn').forEach(b => b.classList.remove('active'));
        sourceBtn.classList.add('active');
      }
    }
    
    // Функция загрузки популярного
    async function loadPopularTracks(forceRefresh = false) {
      try {
        const url = forceRefresh 
          ? `${YOUTUBE_SERVER_URL}/api/popular?limit=20&refresh=true`
          : `${YOUTUBE_SERVER_URL}/api/popular?limit=20`;
        
        const response = await fetch(url);
        const trending = await response.json();
        
        // Загружаем "Историю" (последние прослушанные треки)
        const history = await window.electronAPI.getHistory(10);
        if (history && history.length > 0) {
          loadCarousel('history-carousel', history);
        } else if (trending && trending.length > 0) {
          // Если истории нет, показываем популярное
          loadCarousel('history-carousel', trending.slice(10, 20));
        }
        
        // Загружаем последние прослушанные треки для "wave-tracks"
        const historyForWave = await window.electronAPI.getHistory(8);
        if (historyForWave && historyForWave.length > 0) {
          loadWaveTracks(historyForWave);
        } else if (trending && trending.length > 0) {
          // Если истории нет, показываем популярное
          loadWaveTracks(trending.slice(0, 8));
        }
        
        // Загружаем любимые треки
        const favorites = await window.electronAPI.getFavorites();
        if (favorites && favorites.length > 0) {
          loadCarousel('favorites-carousel', favorites.slice(0, 10));
        } else if (trending && trending.length > 0) {
          // Если любимых нет, показываем популярное
          loadCarousel('favorites-carousel', trending.slice(10, 20));
        }
        
        // Загружаем чарт Яндекс.Музыки
        const yandexChart = await getYandexChart();
        console.log('📊 Yandex chart loaded:', yandexChart ? yandexChart.length : 0, 'tracks');
        if (yandexChart && yandexChart.length > 0) {
          currentChart = yandexChart; // Сохраняем для кнопки "Играть"
          loadCarousel('yandex-chart-carousel', yandexChart);
          console.log('✅ Chart carousel loaded with', yandexChart.length, 'tracks');
        } else {
          console.warn('⚠️ No chart data received');
        }
      } catch (error) {
        console.error('Error loading popular tracks:', error);
      }
    }
    
    // Загружаем популярное при старте
    await loadPopularTracks();
    
    // Автообновление каждые 10 минут (оптимизировано для производительности)
    setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadPopularTracks();
      }
    }, 10 * 60 * 1000);
    
    // Кнопка обновления популярного (скрыта, но оставлена для совместимости)
    const refreshPopularBtn = document.getElementById('refresh-popular');
    if (refreshPopularBtn) {
      refreshPopularBtn.style.display = 'none';
    }
    
    // Кнопка обновления чарта Яндекс.Музыки (скрыта)
    const refreshYandexChartBtn = document.getElementById('refresh-yandex-chart');
    if (refreshYandexChartBtn) {
      refreshYandexChartBtn.style.display = 'none';
      refreshYandexChartBtn.onclick = async () => {
        refreshYandexChartBtn.disabled = true;
        refreshYandexChartBtn.style.opacity = '0.5';
        const yandexChart = await getYandexChart();
        if (yandexChart && yandexChart.length > 0) {
          currentChart = yandexChart; // Обновляем сохраненный чарт
          loadCarousel('yandex-chart-carousel', yandexChart.slice(0, 20));
          window.toast.success('Чарт обновлен!');
        }
        refreshYandexChartBtn.disabled = false;
        refreshYandexChartBtn.style.opacity = '1';
      };
    }
    
    // Кнопка воспроизведения чарта
    const playChartBtn = document.getElementById('play-chart-btn');
    if (playChartBtn) {
      playChartBtn.onclick = async () => {
        if (currentChart && currentChart.length > 0) {
          await playTrackFromChart(currentChart[0], currentChart, 0);
        } else {
          window.toast.warning('Чарт еще не загружен');
        }
      };
    }
    
    // Load playlist page
    loadPlaylistPage();
  })();

  // Account management
  async function updateAccountDisplay() {
    if (!window.electronAPI || !window.electronAPI.getCurrentAccount) {
      console.warn('⚠️ electronAPI.getCurrentAccount not available');
      return;
    }
    
    const account = await window.electronAPI.getCurrentAccount();
    const playlistData = await loadFullPlaylist();
    
    const accountNameEl = document.getElementById('current-account-name');
    if (accountNameEl) {
      accountNameEl.textContent = account.name;
    }
    
    const accountStatsEl = document.getElementById('current-account-stats');
    if (accountStatsEl) {
      accountStatsEl.textContent = `${playlistData.length} треков`;
    }
    
    // Обновляем счетчик в сайдбаре
    const mainPlaylistCount = document.getElementById('main-playlist-count');
    if (mainPlaylistCount) {
      mainPlaylistCount.textContent = `${playlistData.length} треков`;
    }
  }
  
  // Profile management
  async function loadProfile() {
    try {
      const username = await window.electronAPI.getUsername();
      
      if (!username) {
        console.error('No username found');
        document.getElementById('profile-username').textContent = 'Не авторизован';
        document.getElementById('profile-uid').textContent = 'N/A';
        return;
      }
      
      const response = await fetch(`${SERVER_URL}/api/auth/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      
      if (!response.ok) {
        throw new Error('Failed to load profile');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update username
        document.getElementById('profile-username').textContent = data.username || username;
        
        // Update UID
        const uid = data.uid || data.telegram_id || 'USER';
        document.getElementById('profile-uid').textContent = uid;
        
        // Update avatar
        const profileAvatar = document.getElementById('profile-avatar');
        const removeAvatarBtn = document.getElementById('remove-avatar-btn');
        
        if (data.avatar) {
          profileAvatar.innerHTML = `<img src="${data.avatar}" alt="Avatar">`;
          if (removeAvatarBtn) removeAvatarBtn.style.display = 'block';
        } else {
          profileAvatar.innerHTML = `
            <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          `;
          if (removeAvatarBtn) removeAvatarBtn.style.display = 'none';
        }
      } else {
        // Fallback to username from session
        const usernameEl = document.getElementById('profile-username');
        const uidEl = document.getElementById('profile-uid');
        if (usernameEl) usernameEl.textContent = username;
        if (uidEl) uidEl.textContent = 'USER';
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Try to get username from session as fallback
      const username = await window.electronAPI.getUsername();
      const usernameEl = document.getElementById('profile-username');
      const uidEl = document.getElementById('profile-uid');
      
      if (username) {
        if (usernameEl) usernameEl.textContent = username;
        if (uidEl) uidEl.textContent = 'USER';
      } else {
        if (usernameEl) usernameEl.textContent = 'Ошибка загрузки';
        if (uidEl) uidEl.textContent = 'N/A';
      }
    }
  }
  
  // Avatar upload
  const avatarInput = document.getElementById('avatar-input');
  const changeAvatarBtn = document.getElementById('change-avatar-btn');
  const removeAvatarBtn = document.getElementById('remove-avatar-btn');
  const profileAvatar = document.getElementById('profile-avatar');
  
  if (changeAvatarBtn && avatarInput) {
    changeAvatarBtn.onclick = () => avatarInput.click();
    profileAvatar.onclick = () => avatarInput.click();
    
    avatarInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        window.toast.error('Файл слишком большой. Максимум 2MB');
        return;
      }
      
      // Read as base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target.result;
        
        try {
          const username = await window.electronAPI.getUsername();
          const response = await fetch(`${SERVER_URL}/api/user/avatar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, avatar: base64 })
          });
          
          const data = await response.json();
          
          if (data.success) {
            await loadProfile();
            window.toast.success('Аватар обновлен!');
          }
        } catch (error) {
          console.error('Error uploading avatar:', error);
          window.toast.error('Ошибка загрузки аватара');
        }
      };
      
      reader.readAsDataURL(file);
      avatarInput.value = ''; // Reset
    };
  }
  
  if (removeAvatarBtn) {
    removeAvatarBtn.onclick = async () => {
      if (!confirm('Удалить аватар?')) return;
      
      try {
        const username = await window.electronAPI.getUsername();
        const response = await fetch(`${SERVER_URL}/api/user/avatar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, avatar: null })
        });
        
        const data = await response.json();
        
        if (data.success) {
          await loadProfile();
          window.toast.success('Аватар удален');
        }
      } catch (error) {
        console.error('Error removing avatar:', error);
        window.toast.error('Ошибка удаления аватара');
      }
    };
  }
  
  // Load profile when settings or profile page opens
  document.querySelector('.sidebar-btn[data-page="settings"]')?.addEventListener('click', () => {
    loadProfile();
  });
  
  document.querySelector('.sidebar-btn[data-page="profile"]')?.addEventListener('click', () => {
    // Reload profile data when opening profile page
    if (window.reloadProfilePage) {
      window.reloadProfilePage();
    }
  });

  async function loadAccountsList() {
    const accounts = await window.electronAPI.getAccounts();
    const accountsList = document.getElementById('accounts-list');
    accountsList.innerHTML = '';

    accounts.forEach(acc => {
      const item = document.createElement('div');
      item.className = `account-item ${acc.isCurrent ? 'active' : ''}`;
      item.innerHTML = `
        <div class="account-item-info">
          <div class="account-item-avatar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <div>
            <div class="account-item-name">${acc.name}</div>
            <div class="account-item-stats">${acc.trackCount} треков</div>
          </div>
        </div>
        <div class="account-item-actions">
          ${acc.id !== 'default' ? `
            <button class="btn-icon-small rename-btn" data-id="${acc.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>
            <button class="btn-icon-small delete delete-btn" data-id="${acc.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
            </button>
          ` : ''}
        </div>
      `;

      item.querySelector('.account-item-info').onclick = async () => {
        if (!acc.isCurrent) {
          await window.electronAPI.switchAccount(acc.id);
          await reloadAfterAccountSwitch();
        }
      };

      if (acc.id !== 'default') {
        item.querySelector('.rename-btn').onclick = async (e) => {
          e.stopPropagation();
          const newName = prompt('Новое имя аккаунта:', acc.name);
          if (newName && newName.trim()) {
            await window.electronAPI.renameAccount(acc.id, newName.trim());
            await loadAccountsList();
            await updateAccountDisplay();
          }
        };

        item.querySelector('.delete-btn').onclick = async (e) => {
          e.stopPropagation();
          if (confirm(`Удалить аккаунт "${acc.name}"? Все треки будут потеряны.`)) {
            await window.electronAPI.deleteAccount(acc.id);
            await loadAccountsList();
            await updateAccountDisplay();
            await reloadAfterAccountSwitch();
          }
        };
      }

      accountsList.appendChild(item);
    });
  }

  async function reloadAfterAccountSwitch() {
    // Загружаем плейлист с локальными треками
    playlist = await loadFullPlaylist();
    const settings = await window.electronAPI.getSettings();
    
    if (settings.defaultSource) {
      currentSource = settings.defaultSource;
      const sourceBtn = document.querySelector(`.source-btn[data-source="${currentSource}"]`);
      if (sourceBtn) {
        document.querySelectorAll('.source-btn').forEach(b => b.classList.remove('active'));
        sourceBtn.classList.add('active');
      }
    }
    
    // Reset player
    audio.pause();
    currentIndex = -1;
    isPlaying = false;
    updatePlayButtons(false);
    
    // Reload home page
    const trending = await getTrendingTracks();
    if (trending && trending.length > 0) {
      loadWaveTracks(trending.slice(0, 8));
      loadCarousel('history-carousel', trending.slice(10, 20));
      loadCarousel('favorites-carousel', trending.slice(20, 30));
      loadAlbumsGrid('popular-grid', trending.slice(0, 12));
    }
    
    await updateAccountDisplay();
    document.getElementById('accounts-list').style.display = 'none';
  }

  // Account buttons
  const switchAccountBtn = document.getElementById('switch-account-btn');
  if (switchAccountBtn) {
    switchAccountBtn.onclick = async () => {
      const accountsList = document.getElementById('accounts-list');
      if (accountsList.style.display === 'none') {
        await loadAccountsList();
        accountsList.style.display = 'flex';
      } else {
        accountsList.style.display = 'none';
      }
    };
  }

  const createAccountBtn = document.getElementById('profile-create-account-btn');
  if (createAccountBtn) {
    createAccountBtn.onclick = async () => {
      const name = prompt('Имя нового аккаунта:');
      if (name && name.trim()) {
        const result = await window.electronAPI.createAccount(name.trim());
        if (result.success) {
          await loadAccountsList();
          document.getElementById('accounts-list').style.display = 'flex';
        }
      }
    };
  }

  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      if (confirm('Выйти из аккаунта?')) {
        await window.electronAPI.logout();
        location.reload();
      }
    };
  }

  // Settings page - Yandex and Spotify (removed from UI but keeping code for future)
  const yandexTokenInput = document.getElementById('yandex-token-input');
  const saveYandexBtn = document.getElementById('save-yandex-token');
  const yandexStatus = document.getElementById('yandex-status');

  const spotifyClientId = document.getElementById('spotify-client-id');
  const spotifyClientSecret = document.getElementById('spotify-client-secret');
  const saveSpotifyBtn = document.getElementById('save-spotify-creds');
  const spotifyStatus = document.getElementById('spotify-status');

  // Save Yandex token (if elements exist)
  if (saveYandexBtn && yandexTokenInput && yandexStatus) {
    saveYandexBtn.onclick = async () => {
      const token = yandexTokenInput.value.trim();
      if (!token) {
        showStatus(yandexStatus, 'Введите токен', 'error');
        return;
      }

      try {
        const response = await fetch(`${YOUTUBE_SERVER_URL}/api/yandex/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });

        if (response.ok) {
          showStatus(yandexStatus, 'Яндекс.Музыка подключена!', 'success');
          yandexTokenInput.value = '';
        } else {
          const error = await response.json();
          showStatus(yandexStatus, `Ошибка: ${error.error}`, 'error');
        }
      } catch (error) {
        showStatus(yandexStatus, `Ошибка: ${error.message}`, 'error');
      }
    };
  }

  // Import playlist
  const playlistUrlInput = document.getElementById('playlist-url-input');
  const importPlaylistBtn = document.getElementById('import-playlist-btn');
  const importStatus = document.getElementById('import-status');
  const importProgress = document.getElementById('import-progress');
  const importProgressText = document.getElementById('import-progress-text');
  const importProgressCount = document.getElementById('import-progress-count');
  const importProgressBar = document.getElementById('import-progress-bar');

  if (importPlaylistBtn && playlistUrlInput) {
    importPlaylistBtn.onclick = async () => {
      const url = playlistUrlInput.value.trim();
      if (!url) {
        showStatus(importStatus, 'Вставьте ссылку на плейлист', 'error');
        return;
      }

      // Проверяем поддерживаемые платформы
      const isSupported = url.includes('youtube.com') || 
                         url.includes('youtu.be') || 
                         url.includes('soundcloud.com') || 
                         url.includes('spotify.com') ||
                         url.includes('music.yandex.ru') ||
                         url.includes('music.yandex.com');
      
      if (!isSupported) {
        showStatus(importStatus, 'Поддерживаются: YouTube, Spotify, SoundCloud, Яндекс.Музыка', 'error');
        return;
      }

      importPlaylistBtn.disabled = true;
      importPlaylistBtn.textContent = 'Импорт...';
      importProgress.style.display = 'block';
      importProgressText.textContent = 'Получение списка треков...';
      importProgressCount.textContent = '0/0';
      importProgressBar.style.width = '0%';

      try {
        const response = await fetch(`${YOUTUBE_SERVER_URL}/api/import-playlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });

        if (!response.ok) {
          const error = await response.json();
          
          // Специальная обработка для Яндекс.Музыки
          if (response.status === 401 && url.includes('music.yandex')) {
            throw new Error('Яндекс.Музыка не авторизована. Добавьте токен в настройках выше.');
          }
          
          throw new Error(error.error || error.message || 'Ошибка импорта');
        }

        const data = await response.json();
        const tracks = data.tracks;

        if (tracks.length === 0) {
          showStatus(importStatus, 'Плейлист пуст или не удалось получить треки', 'error');
          return;
        }

        importProgressText.textContent = 'Добавление треков в плейлист...';
        importProgressCount.textContent = `0/${tracks.length}`;

        // Добавляем треки по одному
        let added = 0;
        for (let i = 0; i < tracks.length; i++) {
          const track = tracks[i];
          
          try {
            await window.electronAPI.addTrack({
              title: track.title,
              artist: track.artist,
              url: track.url,
              cover: track.thumbnail || '',
              duration: track.duration || 0,
              source: track.source,
              addedAt: Date.now()
            });
            added++;
          } catch (e) {
            console.error('Failed to add track:', track.title, e);
          }

          importProgressCount.textContent = `${i + 1}/${tracks.length}`;
          importProgressBar.style.width = `${((i + 1) / tracks.length) * 100}%`;
        }

        // Обновляем плейлист
        playlist = await loadFullPlaylist();
        const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
        loadPlaylistPage(playlistSortSelect?.value || 'default', activeFilter);
        
        // Обновляем счетчик в сайдбаре
        if (window.updatePlaylistCounts) {
          window.updatePlaylistCounts();
        }

        showStatus(importStatus, `✅ Импортировано ${added} из ${tracks.length} треков`, 'success');
        playlistUrlInput.value = '';
        
        setTimeout(() => {
          importProgress.style.display = 'none';
        }, 2000);

      } catch (error) {
        console.error('Import error:', error);
        showStatus(importStatus, `Ошибка: ${error.message}`, 'error');
      } finally {
        importPlaylistBtn.disabled = false;
        importPlaylistBtn.textContent = 'Импортировать';
      }
    };
  }

  // Save Spotify credentials (if elements exist)
  if (saveSpotifyBtn && spotifyClientId && spotifyClientSecret && spotifyStatus) {
    saveSpotifyBtn.onclick = async () => {
      const clientId = spotifyClientId.value.trim();
      const clientSecret = spotifyClientSecret.value.trim();
      
      if (!clientId || !clientSecret) {
        showStatus(spotifyStatus, 'Введите Client ID и Secret', 'error');
        return;
      }

      try {
        const response = await fetch(`${YOUTUBE_SERVER_URL}/api/spotify/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId, clientSecret })
        });

        if (response.ok) {
          showStatus(spotifyStatus, 'Spotify подключен!', 'success');
          spotifyClientId.value = '';
          spotifyClientSecret.value = '';
        } else {
          const error = await response.json();
          showStatus(spotifyStatus, `Ошибка: ${error.error}`, 'error');
        }
      } catch (error) {
        showStatus(spotifyStatus, `Ошибка: ${error.message}`, 'error');
      }
    };
  }

  // Default source radio buttons
  document.querySelectorAll('input[name="default-source"]').forEach(radio => {
    radio.onchange = () => {
      currentSource = radio.value;
      window.electronAPI.saveSettings({ defaultSource: currentSource });
      
      // Update sidebar button
      const sourceBtn = document.querySelector(`.source-btn[data-source="${currentSource}"]`);
      if (sourceBtn) {
        document.querySelectorAll('.source-btn').forEach(b => b.classList.remove('active'));
        sourceBtn.classList.add('active');
      }
    };
  });

  function showStatus(element, message, type) {
    element.textContent = message;
    element.className = `settings-status ${type}`;
    setTimeout(() => {
      element.className = 'settings-status';
    }, 5000);
  }

  // ============ CUSTOMIZATION ============
  const themeSelect = document.getElementById('theme-select');
  const customColorsDiv = document.getElementById('custom-colors');
  const primaryColorInput = document.getElementById('primary-color');
  const accentColorInput = document.getElementById('accent-color');
  const lyricsFontSizeSlider = document.getElementById('lyrics-font-size');
  const lyricsFontSizeValue = document.getElementById('lyrics-font-size-value');
  const backgroundOpacitySlider = document.getElementById('background-opacity');
  const backgroundOpacityValue = document.getElementById('background-opacity-value');
  
  // Check if all elements exist before setting up handlers
  if (!primaryColorInput || !accentColorInput || !lyricsFontSizeSlider || !lyricsFontSizeValue || !backgroundOpacitySlider || !backgroundOpacityValue) {
    console.log('ℹ️ Customization elements not found (normal if not on settings page)');
    // Don't return - this is not critical for playlists page
  } else {
  const videoBackgroundInput = document.getElementById('video-background-url');
  const selectVideoFileBtn = document.getElementById('select-video-file');
  const clearVideoBackgroundBtn = document.getElementById('clear-video-background');
  const animationStyleSelect = document.getElementById('animation-style');
  const resetCustomizationBtn = document.getElementById('reset-customization');
  
  const videoBackground = document.getElementById('video-background');
  
  // Статистика
  let listeningTimeSeconds = 0;
  let tracksPlayed = 0;

  // Загружаем сохраненные настройки
  async function loadCustomization() {
    const settings = await window.electronAPI.getSettings();
    const custom = settings.customization || {};

    if (custom.theme) {
      themeSelect.value = custom.theme;
      if (custom.theme === 'custom') {
        customColorsDiv.style.display = 'block';
      }
    }

    if (custom.primaryColor) primaryColorInput.value = custom.primaryColor;
    if (custom.accentColor) accentColorInput.value = custom.accentColor;
    if (custom.lyricsFontSize) {
      lyricsFontSizeSlider.value = custom.lyricsFontSize;
      lyricsFontSizeValue.textContent = custom.lyricsFontSize + 'px';
    }
    if (custom.backgroundOpacity !== undefined) {
      backgroundOpacitySlider.value = custom.backgroundOpacity;
      backgroundOpacityValue.textContent = custom.backgroundOpacity + '%';
    }
    if (custom.videoBackground) {
      videoBackgroundInput.value = custom.videoBackground;
    }
    if (custom.animationStyle) animationStyleSelect.value = custom.animationStyle;
    
    // Загружаем статистику
    if (settings.stats) {
      listeningTimeSeconds = settings.stats.listeningTime || 0;
      tracksPlayed = settings.stats.tracksPlayed || 0;
      updateStatsDisplay();
    }

    applyCustomization(custom);
  }

  // Применяем кастомизацию
  function applyCustomization(custom) {
    console.log('Applying customization:', custom);
    const root = document.documentElement;

    // Тема через themeCustomizer
    if (custom.theme && window.themeCustomizer) {
      if (custom.theme === 'custom') {
        // Кастомная тема
        const colors = {
          '--accent-color': custom.accentColor || '#6366f1',
          '--accent-hover': custom.accentColor || '#4f46e5'
        };
        if (custom.primaryColor) {
          colors['--text-primary'] = custom.primaryColor;
        }
        window.themeCustomizer.saveTheme(colors);
      } else {
        // Предустановленная тема
        window.themeCustomizer.applyPreset(custom.theme);
      }
    }

    // Размер шрифта текста
    const activeSize = custom.lyricsFontSize || 20;
    const prevSize = Math.floor(activeSize * 0.8);
    const farSize = Math.floor(activeSize * 0.7);
    
    root.style.setProperty('--lyrics-active-size', activeSize + 'px');
    root.style.setProperty('--lyrics-prev-size', prevSize + 'px');
    root.style.setProperty('--lyrics-far-size', farSize + 'px');

    // Прозрачность фона
    const opacity = (custom.backgroundOpacity !== undefined ? custom.backgroundOpacity : 30) / 100;
    root.style.setProperty('--bg-opacity', opacity);
    
    // Видео-фон (максимально оптимизированный)
    if (custom.videoBackground) {
      videoBackground.src = custom.videoBackground;
      videoBackground.classList.remove('hidden');
      // Критичная оптимизация: снижаем FPS и качество
      videoBackground.style.filter = 'blur(3px) brightness(0.7)';
      videoBackground.playbackRate = 0.75; // Замедляем на 25% для экономии CPU
      // Снижаем приоритет видео
      videoBackground.style.willChange = 'auto';
      videoBackground.play().catch(err => console.log('Video autoplay failed:', err));
      
      // Применяем фон к странице плеера тоже
      const playerPage = document.getElementById('player-page');
      if (playerPage) {
        playerPage.style.position = 'relative';
      }
      
      // Синхронизируем фон
      setTimeout(() => syncVideoBackground(), 100);
    } else {
      videoBackground.classList.add('hidden');
      videoBackground.pause(); // Останавливаем видео
      videoBackground.src = '';
      videoBackground.style.filter = 'none';
      
      // Очищаем фон плеера
      syncVideoBackground();
    }

    // Стиль анимации
    if (custom.animationStyle) {
      root.setAttribute('data-animation', custom.animationStyle);
    } else {
      root.setAttribute('data-animation', 'smooth');
    }
  }

  // Обработчики
  themeSelect.onchange = () => {
    console.log('Theme changed to:', themeSelect.value);
    const theme = themeSelect.value;
    customColorsDiv.style.display = theme === 'custom' ? 'block' : 'none';
    saveCustomization();
  };

  primaryColorInput.oninput = () => {
    console.log('Primary color changed to:', primaryColorInput.value);
    // Применяем в реальном времени при движении
    const root = document.documentElement;
    root.style.setProperty('--primary-color', primaryColorInput.value);
  };
  primaryColorInput.onchange = saveCustomization;
  
  accentColorInput.oninput = () => {
    console.log('Accent color changed to:', accentColorInput.value);
    // Применяем в реальном времени при движении
    const root = document.documentElement;
    root.style.setProperty('--accent-color', accentColorInput.value);
  };
  accentColorInput.onchange = saveCustomization;

  lyricsFontSizeSlider.oninput = () => {
    lyricsFontSizeValue.textContent = lyricsFontSizeSlider.value + 'px';
    console.log('Font size changed to:', lyricsFontSizeSlider.value);
    // Применяем в реальном времени
    const root = document.documentElement;
    const activeSize = parseInt(lyricsFontSizeSlider.value);
    const prevSize = Math.floor(activeSize * 0.8);
    const farSize = Math.floor(activeSize * 0.7);
    root.style.setProperty('--lyrics-active-size', activeSize + 'px');
    root.style.setProperty('--lyrics-prev-size', prevSize + 'px');
    root.style.setProperty('--lyrics-far-size', farSize + 'px');
  };
  lyricsFontSizeSlider.onchange = saveCustomization;

  backgroundOpacitySlider.oninput = () => {
    backgroundOpacityValue.textContent = backgroundOpacitySlider.value + '%';
    const root = document.documentElement;
    const opacity = parseInt(backgroundOpacitySlider.value) / 100;
    root.style.setProperty('--bg-opacity', opacity);
  };
  backgroundOpacitySlider.onchange = saveCustomization;
  
  videoBackgroundInput.onchange = saveCustomization;
  
  selectVideoFileBtn.onclick = async () => {
    console.log('Select video file button clicked');
    try {
      // Открываем диалог выбора файла
      const result = await window.electronAPI.selectFile(['mp4', 'webm', 'gif']);
      console.log('File selection result:', result);
      if (result) {
        videoBackgroundInput.value = result;
        saveCustomization();
      }
    } catch (error) {
      console.error('Error selecting file:', error);
      window.toast.error('Ошибка при выборе файла: ' + error.message);
    }
  };
  
  clearVideoBackgroundBtn.onclick = () => {
    videoBackgroundInput.value = '';
    saveCustomization();
  };

  animationStyleSelect.onchange = () => {
    console.log('Animation style changed to:', animationStyleSelect.value);
    saveCustomization();
  };

  resetCustomizationBtn.onclick = () => {
    if (confirm('Сбросить все настройки кастомизации?')) {
      themeSelect.value = 'dark';
      customColorsDiv.style.display = 'none';
      primaryColorInput.value = '#ffffff';
      accentColorInput.value = '#ffffff';
      lyricsFontSizeSlider.value = 20;
      lyricsFontSizeValue.textContent = '20px';
      backgroundOpacitySlider.value = 30;
      backgroundOpacityValue.textContent = '30%';
      animationStyleSelect.value = 'smooth';
      
      window.electronAPI.saveSettings({ customization: {} });
      applyCustomization({});
      
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.removeAttribute('data-animation');
    }
  };

  function saveCustomization() {
    const custom = {
      theme: themeSelect.value,
      primaryColor: primaryColorInput.value,
      accentColor: accentColorInput.value,
      lyricsFontSize: parseInt(lyricsFontSizeSlider.value),
      backgroundOpacity: parseInt(backgroundOpacitySlider.value),
      videoBackground: videoBackgroundInput.value,
      animationStyle: animationStyleSelect.value
    };

    window.electronAPI.saveSettings({ customization: custom });
    applyCustomization(custom);
  }
  
  // Функция обновления отображения статистики
  function updateStatsDisplay() {
    const hours = Math.floor(listeningTimeSeconds / 3600);
    const minutes = Math.floor((listeningTimeSeconds % 3600) / 60);
    
    document.getElementById('listening-time').textContent = `${hours} ч ${minutes} мин`;
    document.getElementById('tracks-played').textContent = tracksPlayed;
  }
  
  // Сохранение статистики
  function saveStats() {
    window.electronAPI.saveSettings({ 
      stats: {
        listeningTime: listeningTimeSeconds,
        tracksPlayed: tracksPlayed
      }
    });
  }
  
  // Счетчик времени прослушивания (обновляется каждую секунду)
  setInterval(() => {
    if (isPlaying && !audio.paused) {
      listeningTimeSeconds++;
      if (listeningTimeSeconds % 60 === 0) { // Сохраняем каждую минуту
        updateStatsDisplay();
        saveStats();
      }
    }
  }, 1000);
  
  // Увеличиваем счетчик треков при загрузке нового трека
  const originalLoadTrack = loadTrack;
  loadTrack = function(index) {
    const result = originalLoadTrack(index);
    tracksPlayed++;
    updateStatsDisplay();
    saveStats();
    return result;
  };

  // Загружаем при старте
  loadCustomization();
  } // End of customization elements conditional block

  // ============ DISCORD RPC SETTINGS ============
  const discordActivityToggle = document.getElementById('discord-activity-toggle');
  const discordProgressToggle = document.getElementById('discord-progress-toggle');
  
  if (discordActivityToggle && discordProgressToggle) {
    // Загружаем сохраненные настройки Discord RPC
    async function loadDiscordSettings() {
      if (!window.electronAPI || !window.electronAPI.getSettings) {
        console.warn('⚠️ electronAPI.getSettings not available');
        return;
      }
      
      const settings = await window.electronAPI.getSettings();
      const discord = settings.discord || { enabled: true, showProgress: true };
      
      discordActivityToggle.checked = discord.enabled !== false;
      discordProgressToggle.checked = discord.showProgress !== false;
      
      // Применяем настройки к Discord RPC
      if (window.electronAPI.discordUpdateSettings) {
        window.electronAPI.discordUpdateSettings({
          enabled: discordActivityToggle.checked,
          showProgress: discordProgressToggle.checked
        });
      }
    }
    
    // Сохраняем настройки Discord RPC
    async function saveDiscordSettings() {
      const settings = {
        discord: {
          enabled: discordActivityToggle.checked,
          showProgress: discordProgressToggle.checked
        }
      };
      
      await window.electronAPI.saveSettings(settings);
      
      // Обновляем Discord RPC
      if (window.electronAPI.discordUpdateSettings) {
        window.electronAPI.discordUpdateSettings({
          enabled: discordActivityToggle.checked,
          showProgress: discordProgressToggle.checked
        });
      }
      
      console.log('Discord RPC настройки сохранены:', settings.discord);
    }
    
    // Обработчики изменений
    discordActivityToggle.onchange = () => {
      console.log('Discord активность:', discordActivityToggle.checked ? 'Включена' : 'Отключена');
      saveDiscordSettings();
    };
    
    discordProgressToggle.onchange = () => {
      console.log('Discord прогресс:', discordProgressToggle.checked ? 'Включен' : 'Отключен');
      saveDiscordSettings();
    };
    
    // Загружаем настройки при старте
    loadDiscordSettings();
  } else {
    console.warn('⚠️ Discord RPC toggles not found');
  }

  // ============ DOWNLOAD BUTTON ============
  const downloadBtn = document.getElementById('download-btn');
  
  // Функция обновления состояния кнопки скачивания
  window.updateDownloadButton = async function() {
    if (!downloadBtn || currentIndex < 0) return;
    
    const activePlaylist = isSearchMode ? searchPlaylist : (currentPlaylist.length > 0 ? currentPlaylist : playlist);
    const track = activePlaylist[currentIndex];
    
    if (!track) return;
    
    // Проверяем есть ли трек в оффлайн
    const offlineTracks = await window.electronAPI.getOfflineTracks();
    const isOffline = offlineTracks.some(t => t.url === track.url || t.title === track.title);
    
    if (isOffline) {
      downloadBtn.classList.add('active');
      downloadBtn.style.color = '#4CAF50';
      downloadBtn.title = 'Трек скачан';
      downloadBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
      `;
    } else {
      downloadBtn.classList.remove('active');
      downloadBtn.style.color = '';
      downloadBtn.title = 'Скачать трек';
      downloadBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/>
        </svg>
      `;
    }
  };
  
  // Обработчик клика на кнопку скачивания
  if (downloadBtn) {
    downloadBtn.onclick = async () => {
      if (currentIndex < 0) return;
      
      const activePlaylist = isSearchMode ? searchPlaylist : (currentPlaylist.length > 0 ? currentPlaylist : playlist);
      const track = activePlaylist[currentIndex];
      
      if (!track) return;
      
      // Проверяем не скачан ли уже
      const offlineTracks = await window.electronAPI.getOfflineTracks();
      const isOffline = offlineTracks.some(t => t.url === track.url || t.title === track.title);
      
      if (isOffline) {
        if (window.showToast) {
          window.showToast('Трек уже скачан', 'info');
        }
        return;
      }
      
      // Показываем индикатор загрузки
      downloadBtn.disabled = true;
      downloadBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      `;
      
      if (window.showToast) {
        window.showToast('Скачивание трека...', 'info');
      }
      
      try {
        // Скачиваем трек через IPC
        const result = await window.electronAPI.downloadTrack(track);
        
        if (result.success) {
          // Добавляем в оффлайн треки
          const offlineTrack = result.track || {
            ...track,
            url: `file://${result.path}`,
            localPath: result.path,
            isOffline: true
          };
          
          await window.electronAPI.addOfflineTrack(offlineTrack);
          
          if (window.showToast) {
            window.showToast('Трек скачан!', 'success');
          }
          
          // Обновляем кнопку
          window.updateDownloadButton();
          
          // Обновляем счетчики плейлистов
          if (window.updatePlaylistCounts) {
            window.updatePlaylistCounts();
          }
        } else {
          throw new Error(result.error || 'Ошибка скачивания');
        }
      } catch (error) {
        console.error('Download error:', error);
        if (window.showToast) {
          window.showToast('Ошибка скачивания: ' + error.message, 'error');
        }
        
        // Восстанавливаем кнопку
        downloadBtn.disabled = false;
        window.updateDownloadButton();
      }
    };
  }
  
  // Function to reset all playback modes when switching sources
  function resetPlaybackModes() {
    console.log('🔄 Resetting all playback modes');
    console.log('  Previous state - isWaveMode:', isWaveMode, 'isSearchMode:', isSearchMode);
    console.log('  Previous currentPlaylist length:', currentPlaylist.length);
    
    // Reset wave mode
    isWaveMode = false;
    isSearchMode = false;
    
    // Clear wave-specific data
    if (typeof wavePlaylist !== 'undefined') {
      wavePlaylist = [];
    }
    if (typeof waveTrackIds !== 'undefined') {
      waveTrackIds.clear();
    }
    if (typeof waveTrackTitles !== 'undefined') {
      waveTrackTitles.clear();
    }
    
    // Reset repeat mode to default if it was set by wave
    if (repeatMode === 'all' && isWaveMode) {
      repeatMode = 'off';
      const repeatBtn = document.getElementById('repeat-btn');
      if (repeatBtn) {
        repeatBtn.classList.remove('active');
        repeatBtn.title = 'Повтор выключен';
      }
    }
    
    // Hide wave visualizer and show covers
    const waveVisualizer = document.getElementById('wave-visualizer');
    const waveCoversContainer = document.getElementById('wave-covers-container');
    const waveNowPlaying = document.getElementById('wave-now-playing');
    
    if (waveVisualizer) waveVisualizer.style.display = 'none';
    if (waveCoversContainer) waveCoversContainer.style.display = 'block';
    if (waveNowPlaying) waveNowPlaying.style.display = 'none';
    
    console.log('✅ Playback modes reset complete');
    console.log('  New state - isWaveMode:', isWaveMode, 'isSearchMode:', isSearchMode);
  }
  
  // Expose loadTrack and currentPlaylist for playlists library
  window.loadTrack = loadTrack;
  window.updatePlayButtons = updatePlayButtons;
  window.resetPlaybackModes = resetPlaybackModes;
  
  // Expose isPlaying getter/setter
  window.setIsPlaying = (value) => { isPlaying = value; };
  window.getIsPlaying = () => isPlaying;
  
  // Expose currentPlaylist getter/setter
  window.setCurrentPlaylist = (value) => { currentPlaylist = value; };
  window.getCurrentPlaylist = () => currentPlaylist;
  
  console.log('✅ Main app initialization complete, all functions exposed');
  
  // Process any pending playlist:load events
  if (window._pendingPlaylistLoad) {
    console.log('🔄 Processing pending playlist:load event');
    const { tracks, index } = window._pendingPlaylistLoad;
    
    // Reset playback modes
    if (window.resetPlaybackModes) {
      window.resetPlaybackModes();
    }
    
    // Set currentPlaylist
    if (window.setCurrentPlaylist) {
      window.setCurrentPlaylist(tracks);
    }
    
    // Load the track
    loadTrack(index);
    
    // Set playing state
    if (window.setIsPlaying) {
      window.setIsPlaying(true);
    }
    if (window.updatePlayButtons) {
      window.updatePlayButtons(true);
    }
    
    // Auto-play
    setTimeout(() => {
      const audio = document.getElementById('audio');
      if (audio) {
        audio.play().catch(err => {
          console.error('❌ Playback failed:', err);
          if (window.setIsPlaying) window.setIsPlaying(false);
          if (window.updatePlayButtons) window.updatePlayButtons(false);
        });
      }
    }, 100);
    
    // Clear pending event
    window._pendingPlaylistLoad = null;
  }
  
  // Initialize update checker
  initUpdateChecker();
  
  // Регистрируем обработчик медиа-клавиш (клавиши на наушниках/клавиатуре)
  if (window.electronAPI && window.electronAPI.onMediaKey) {
    window.electronAPI.onMediaKey((action) => {
      console.log('🎵 Media key pressed:', action);
      console.log('  Current state - isPlaying:', isPlaying, 'currentIndex:', currentIndex);
      
      switch (action) {
        case 'playpause':
          if (window.togglePlay) {
            window.togglePlay();
            console.log('  ✅ togglePlay executed, new isPlaying:', isPlaying);
          } else {
            console.error('  ❌ togglePlay not available');
          }
          break;
        case 'next':
          if (window.nextTrack) {
            window.nextTrack();
            console.log('  ✅ nextTrack executed, new currentIndex:', currentIndex);
          } else {
            console.error('  ❌ nextTrack not available');
          }
          break;
        case 'previous':
          if (window.previousTrack) {
            window.previousTrack();
            console.log('  ✅ previousTrack executed, new currentIndex:', currentIndex);
          } else {
            console.error('  ❌ previousTrack not available');
          }
          break;
        case 'stop':
          audio.pause();
          audio.currentTime = 0;
          if (window.setIsPlaying) {
            window.setIsPlaying(false);
          }
          if (window.updatePlayButtons) {
            window.updatePlayButtons(false);
          }
          console.log('  ✅ Stop executed');
          break;
      }
    });
    console.log('✅ Media keys handler registered');
  } else {
    console.warn('⚠️ Media keys API not available');
  }
  
  // Регистрируем обработчик команд от трея
  if (window.electronAPI && window.electronAPI.onTrayCommand) {
    window.electronAPI.onTrayCommand((command) => {
      console.log('🖱️ Tray command:', command);
      
      switch (command) {
        case 'play-pause':
          if (window.togglePlay) {
            window.togglePlay();
          }
          break;
        case 'next':
          if (window.nextTrack) {
            window.nextTrack();
          }
          break;
        case 'previous':
          if (window.previousTrack) {
            window.previousTrack();
          }
          break;
      }
    });
    console.log('✅ Tray command handler registered');
  }
  
  // Функция для обновления информации о треке в трее
  window.updateTrayTrack = function() {
    if (window.electronAPI && window.electronAPI.updateTrayTrack) {
      const activePlaylist = isSearchMode ? searchPlaylist : (currentPlaylist.length > 0 ? currentPlaylist : playlist);
      if (currentIndex >= 0 && currentIndex < activePlaylist.length) {
        const track = activePlaylist[currentIndex];
        window.electronAPI.updateTrayTrack(track, isPlaying);
      }
    }
  };
  
  // Process any pending playlist load events that arrived before init
  if (window._pendingPlaylistLoad) {
    console.log('🎵 Processing pending playlist load event');
    const { tracks, index } = window._pendingPlaylistLoad;
    
    // Reset playback modes before loading
    resetPlaybackModes();
    
    currentPlaylist = tracks;
    loadTrack(index);
    
    // Auto-play
    isPlaying = true;
    updatePlayButtons(true);
    setTimeout(() => {
      audio.play().catch(err => {
        console.error('❌ Playback failed:', err);
        isPlaying = false;
        updatePlayButtons(false);
      });
    }, 100);
    
    window._pendingPlaylistLoad = null;
  }
  
  // Initialize playlists library after loadTrack is available
  // Даем время на загрузку playlists-library.js И electronAPI
  setTimeout(() => {
    if (typeof window.initPlaylistsLibrary === 'function' && !window._playlistsLibraryInitialized) {
      // Check if electronAPI is ready
      if (window.electronAPI && window.electronAPI.getPlaylist) {
        console.log('🎵 Calling initPlaylistsLibrary from initMainApp');
        window.initPlaylistsLibrary();
      } else {
        console.warn('⚠️ electronAPI not ready yet, retrying in 200ms...');
        setTimeout(() => {
          if (window.electronAPI && window.electronAPI.getPlaylist) {
            console.log('🎵 Calling initPlaylistsLibrary (retry)');
            window.initPlaylistsLibrary();
          } else {
            console.error('❌ electronAPI still not ready after retry!');
          }
        }, 200);
      }
    } else if (window._playlistsLibraryInitialized) {
      console.log('🎵 Playlists library already initialized');
    } else {
      console.error('❌ window.initPlaylistsLibrary is not a function!');
    }
  }, 500);
  
  const favoriteBtn = document.getElementById('favorite-btn');
  if (favoriteBtn) {
    favoriteBtn.onclick = async () => {
      if (currentIndex < 0) {
        window.toast.warning('Сначала выберите трек');
        return;
      }
      
      const activePlaylist = isSearchMode ? searchPlaylist : (currentPlaylist.length > 0 ? currentPlaylist : playlist);
      const track = activePlaylist[currentIndex];
      
      if (!track) return;
      
      const isFav = window.electronAPI.isFavorite(track.url);
      
      if (isFav) {
        await window.electronAPI.removeFromFavorites(track.url);
        console.log('Removed from favorites:', track.title);
      } else {
        await window.electronAPI.addToFavorites(track);
        console.log('Added to favorites:', track.title);
        
        // НОВОЕ: Если трек из волны - добавляем его в основной плейлист
        if (isWaveMode) {
          console.log('🌊 Track from wave, adding to main playlist');
          try {
            const existingPlaylist = await window.electronAPI.getPlaylist();
            const exists = existingPlaylist.some(t => 
              t.title === track.title && t.artist === track.artist
            );
            
            if (!exists) {
              await window.electronAPI.addTrack(track);
              console.log(`✅ Wave track added to main playlist: ${track.title}`);
              
              // Обновляем счетчики плейлистов
              if (window.updatePlaylistCounts) {
                window.updatePlaylistCounts();
              }
            } else {
              console.log(`⏭️ Track already in main playlist: ${track.title}`);
            }
          } catch (error) {
            console.error('Failed to add wave track to playlist:', error);
          }
        }
      }
      
      updateFavoriteButton();
      
      // Обновляем главную страницу
      if (window.updateHomePage) {
        window.updateHomePage();
      }
    };
  }

  // ============ LYRICS ============
  const lyricsBtn = document.getElementById('lyrics-btn');
  const showLyricsBtn = document.getElementById('show-lyrics-btn');
  const lyricsPage = document.getElementById('lyrics-page');
  const backFromLyricsBtn = document.getElementById('back-from-lyrics-btn');

  if (!lyricsBtn) {
    console.error('Lyrics button not found!');
  } else {
    lyricsBtn.onclick = () => {
      if (currentIndex < 0) {
        window.toast.warning('Сначала выберите трек');
        return;
      }

      // Hide all pages
      Object.values(pages).forEach(p => p && p.classList.remove('active'));
      // Show player page
      pages.player.classList.add('active');
      // Remove active state from sidebar buttons
      document.querySelectorAll('.sidebar-btn[data-page]').forEach(b => b.classList.remove('active'));
    };
  }

  // Кнопка "Показать текст" на странице плеера
  if (showLyricsBtn) {
    showLyricsBtn.onclick = () => {
      if (currentIndex < 0) {
        window.toast.warning('Сначала выберите трек');
        return;
      }

      // Копируем текст в страницу текста
      const activePlaylist = isSearchMode ? searchPlaylist : (currentPlaylist.length > 0 ? currentPlaylist : playlist);
      const track = activePlaylist[currentIndex];
      
      document.getElementById('lyrics-page-title').textContent = track.title;
      document.getElementById('lyrics-page-artist').textContent = track.artist;
      
      const lyricsContainer = document.getElementById('lyrics-container');
      const lyricsPageContainer = document.getElementById('lyrics-container-page');
      lyricsPageContainer.innerHTML = lyricsContainer.innerHTML;
      
      // Hide all pages including player page
      Object.values(pages).forEach(p => p && p.classList.remove('active'));
      // Show lyrics page
      lyricsPage.classList.add('active');
      // Remove active state from sidebar buttons
      document.querySelectorAll('.sidebar-btn[data-page]').forEach(b => b.classList.remove('active'));
    };
  }

  // Кнопка "Назад" со страницы текста
  if (backFromLyricsBtn) {
    backFromLyricsBtn.onclick = () => {
      // Hide lyrics page
      lyricsPage.classList.remove('active');
      // Show player page
      pages.player.classList.add('active');
    };
  }

  // Синхронизация текста на странице текста уже обрабатывается в основном ontimeupdate через syncLyrics()
  
  // Load profile data on app init
  setTimeout(() => {
    loadProfile();
  }, 500);
  
  // Export functions to window for external access
  window.loadTrack = loadTrack;
  window.setIsPlaying = (value) => { isPlaying = value; };
  window.updatePlayButtons = updatePlayButtons;
  window.resetPlaybackModes = () => {
    isWaveMode = false;
    isSearchMode = false;
    isShuffleEnabled = false;
    repeatMode = 'off';
    console.log('  ✅ Playback modes reset');
  };
  window.setCurrentPlaylist = (tracks) => {
    currentPlaylist = tracks;
    console.log('  ✅ Current playlist set:', tracks.length, 'tracks');
  };
  
  // Simple notification system
  // Modern notification system with toast design
  window.showNotification = function(message, type = 'info') {
    // Create or get toast container
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Icon based on type
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    
    // Create toast structure
    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-message">${message}</div>
      <div class="toast-progress"></div>
    `;
    
    // Add to container
    container.appendChild(toast);
    
    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });
    
    // Click to dismiss
    toast.addEventListener('click', () => {
      removeToast(toast);
    });
    
    // Auto remove after 3 seconds
    const timeout = setTimeout(() => {
      removeToast(toast);
    }, 3000);
    
    // Remove toast function
    function removeToast(toastElement) {
      clearTimeout(timeout);
      toastElement.classList.remove('show');
      toastElement.style.transform = 'translateX(120%) scale(0.9)';
      toastElement.style.opacity = '0';
      
      setTimeout(() => {
        if (toastElement.parentNode) {
          toastElement.parentNode.removeChild(toastElement);
        }
        
        // Remove container if empty
        if (container.children.length === 0) {
          container.remove();
        }
      }, 400);
    }
  };
  
  // NOW mark as fully initialized BEFORE checking pending events
  window._mainAppInitialized = true;
  console.log('✅ Functions exported to window');
  console.log('✅ Main app fully initialized');
  
  // Check if there's a pending playlist load event
  if (window._pendingPlaylistLoad) {
    console.log('🎵 Processing pending playlist load event');
    const { tracks, index } = window._pendingPlaylistLoad;
    window._pendingPlaylistLoad = null;
    
    // Reset playback modes
    window.resetPlaybackModes();
    window.setCurrentPlaylist(tracks);
    window.loadTrack(index);
    window.setIsPlaying(true);
    window.updatePlayButtons(true);
    
    // Auto-play
    setTimeout(() => {
      const audio = document.getElementById('audio');
      if (audio) {
        audio.play().catch(err => {
          console.error('❌ Playback failed:', err);
          window.setIsPlaying(false);
          window.updatePlayButtons(false);
        });
      }
    }, 100);
  }
  
  // Admin panel removed - use Telegram bot for admin functions
}

// Синхронизация видео фона с плеером
function syncVideoBackground() {
  const videoBackground = document.getElementById('video-background');
  const playerVideoOverlay = document.getElementById('player-video-overlay');
  
  if (!videoBackground || !playerVideoOverlay) return;
  
  if (videoBackground.src && !videoBackground.classList.contains('hidden')) {
    // Создаем копию видео для плеера
    let playerVideo = playerVideoOverlay.querySelector('video');
    if (!playerVideo) {
      playerVideo = document.createElement('video');
      playerVideo.autoplay = true;
      playerVideo.loop = true;
      playerVideo.muted = true;
      playerVideo.playsInline = true;
      playerVideo.preload = 'metadata';
      playerVideo.style.width = '100%';
      playerVideo.style.height = '100%';
      playerVideo.style.objectFit = 'cover';
      playerVideo.style.filter = 'blur(3px) brightness(0.7)';
      playerVideo.playbackRate = 0.75;
      playerVideoOverlay.appendChild(playerVideo);
    }
    playerVideo.src = videoBackground.src;
    playerVideo.play().catch(err => console.log('Player video failed:', err));
  } else {
    // Удаляем видео из оверлея
    const playerVideo = playerVideoOverlay.querySelector('video');
    if (playerVideo) {
      playerVideo.pause();
      playerVideo.remove();
    }
  }
}

// Вызываем синхронизацию при загрузке
syncVideoBackground();



// Admin panel removed - use Telegram bot for admin functions


// ============ AUTO-UPDATER ============

function initUpdateChecker() {
  console.log('🔄 Initializing update checker...');
  
  const checkUpdatesBtn = document.getElementById('check-updates-btn');
  const appVersionEl = document.getElementById('app-version');
  const updateStatusEl = document.getElementById('update-status-text');
  const updateProgressContainer = document.getElementById('update-progress-container');
  const updateProgressBar = document.getElementById('update-progress-bar');
  const updateProgressPercent = document.getElementById('update-progress-percent');
  
  if (!checkUpdatesBtn || !appVersionEl) {
    console.log('ℹ️ Update checker elements not found (normal if not on settings page)');
    return;
  }
  
  // Load current version
  if (window.electronAPI && window.electronAPI.updater) {
    window.electronAPI.updater.getAppVersion().then(info => {
      appVersionEl.textContent = `v${info.version}`;
      if (!info.isPackaged) {
        appVersionEl.textContent += ' (Dev)';
        updateStatusEl.textContent = 'Автообновление отключено в режиме разработки';
        updateStatusEl.style.color = 'var(--text-secondary)';
        checkUpdatesBtn.disabled = true;
      }
    }).catch(err => {
      console.error('Failed to get app version:', err);
      appVersionEl.textContent = 'Неизвестно';
    });
    
    // Check update status on load
    window.electronAPI.updater.getUpdateStatus().then(status => {
      if (status.updateAvailable) {
        updateStatusEl.textContent = 'Доступно обновление!';
        updateStatusEl.style.color = 'var(--accent-color)';
      } else if (status.updateDownloaded) {
        updateStatusEl.textContent = 'Обновление загружено. Перезапустите приложение для установки.';
        updateStatusEl.style.color = 'var(--success-color)';
      }
    });
    
    // Listen for update status
    window.electronAPI.updater.onUpdateStatus((status) => {
      console.log('📥 Update status:', status);
      updateStatusEl.textContent = status;
      updateStatusEl.style.color = 'var(--text-primary)';
    });
    
    // Listen for update downloading
    window.electronAPI.updater.onUpdateDownloading(() => {
      console.log('📥 Update downloading...');
      updateProgressContainer.style.display = 'block';
      checkUpdatesBtn.disabled = true;
      checkUpdatesBtn.textContent = 'Загрузка...';
    });
    
    // Listen for download progress
    window.electronAPI.updater.onUpdateDownloadProgress((progress) => {
      console.log('📥 Download progress:', progress.percent + '%');
      updateProgressBar.style.width = progress.percent + '%';
      updateProgressPercent.textContent = progress.percent + '%';
    });
  }
  
  // Check for updates button
  checkUpdatesBtn.onclick = async () => {
    if (!window.electronAPI || !window.electronAPI.updater) {
      if (window.showToast) {
        window.showToast('Система обновлений недоступна', 'error');
      }
      return;
    }
    
    checkUpdatesBtn.disabled = true;
    checkUpdatesBtn.textContent = 'Проверка...';
    updateStatusEl.textContent = 'Проверка обновлений...';
    updateStatusEl.style.color = 'var(--text-secondary)';
    
    try {
      await window.electronAPI.updater.checkForUpdates();
      
      // Reset button after 3 seconds
      setTimeout(() => {
        checkUpdatesBtn.disabled = false;
        checkUpdatesBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px;">
            <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
          </svg>
          Проверить обновления
        `;
      }, 3000);
    } catch (error) {
      console.error('Failed to check for updates:', error);
      updateStatusEl.textContent = 'Ошибка при проверке обновлений';
      updateStatusEl.style.color = 'var(--error-color)';
      
      checkUpdatesBtn.disabled = false;
      checkUpdatesBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px;">
          <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
        </svg>
        Проверить обновления
      `;
    }
  };
  
  console.log('✅ Update checker initialized');
}


// Функция для загрузки плейлиста "Волна по треку"
window.loadWavePlaylist = function(tracks) {
  console.log('🌊 Загрузка плейлиста "Волна по треку":', tracks.length, 'треков');
  
  if (!tracks || tracks.length === 0) {
    console.warn('⚠️ Пустой плейлист');
    return;
  }
  
  // Включаем режим волны
  isWaveMode = true;
  isSearchMode = false;
  isWaveSimilarMode = true; // Включаем режим "Волна по треку"
  
  // Устанавливаем плейлист
  wavePlaylist = tracks;
  currentPlaylist = [...tracks];
  
  // Сбрасываем Sets и добавляем новые треки
  window.waveTrackIds.clear();
  window.waveTrackTitles.clear();
  
  tracks.forEach(track => {
    if (track.yandexId) {
      window.waveTrackIds.add(track.yandexId);
    }
    if (track.title) {
      window.waveTrackTitles.add(track.title);
    }
  });
  
  // Включаем режим повтора всех треков
  repeatMode = 'all';
  
  // Обновляем кнопку повтора
  const repeatBtn = document.getElementById('repeat-btn');
  if (repeatBtn) {
    repeatBtn.classList.add('active');
    repeatBtn.title = 'Повтор всех (Волна по треку)';
  }
  
  // Загружаем и воспроизводим первый трек
  loadTrack(0);
  
  // Автовоспроизведение
  isPlaying = true;
  updatePlayButtons(true);
  
  // Пробуем воспроизвести
  const playWhenReady = () => {
    if (audio.readyState >= 2) {
      audio.play().catch(err => {
        console.error('❌ Ошибка автовоспроизведения:', err);
        setTimeout(() => {
          audio.play().catch(err2 => console.error('❌ Повторная попытка не удалась:', err2));
        }, 200);
      });
    } else {
      audio.addEventListener('canplay', () => {
        audio.play().catch(err => console.error('❌ Ошибка воспроизведения:', err));
      }, { once: true });
    }
  };
  
  playWhenReady();
  
  // Обновляем главную страницу
  if (window.updateHomePage) {
    window.updateHomePage();
  }
  
  console.log('✅ Плейлист "Волна по треку" загружен (динамический режим)');
};

// Алиас для совместимости
window.setWavePlaylist = window.loadWavePlaylist;

// Функция для подгрузки еще похожих треков
window.loadMoreSimilarTracks = async function() {
  if (!window.waveSimilarTracks || !window.waveSimilarTracks.isActive) {
    console.warn('⚠️ Режим "Волна по треку" не активен');
    return;
  }
  
  console.log('🔄 Подгрузка еще похожих треков...');
  
  const newTracks = await window.waveSimilarTracks.loadMoreSimilarTracks();
  
  if (newTracks && newTracks.length > 0) {
    // Фильтруем дубликаты
    const uniqueTracks = newTracks.filter(track => {
      const id = track.yandexId || `${track.title}-${track.artist}`;
      return !waveTrackIds.has(id);
    });
    
    if (uniqueTracks.length > 0) {
      // Добавляем в плейлист
      currentPlaylist.push(...uniqueTracks);
      wavePlaylist.push(...uniqueTracks);
      
      // Обновляем Sets
      uniqueTracks.forEach(track => {
        if (track.yandexId) waveTrackIds.add(track.yandexId);
        if (track.title) waveTrackTitles.add(track.title);
      });
      
      console.log(`✅ Добавлено ${uniqueTracks.length} новых похожих треков. Всего: ${currentPlaylist.length}`);
      
      if (window.showNotification) {
        window.showNotification(`Добавлено еще ${uniqueTracks.length} похожих треков`, 'success');
      }
    } else {
      console.log('⚠️ Все новые треки - дубликаты');
    }
  } else {
    console.log('⚠️ Не удалось подгрузить новые треки');
  }
};


// Функция для сброса режима "Волна по треку"
window.resetWaveSimilarMode = function() {
  isWaveSimilarMode = false;
  console.log('🔄 Режим "Волна по треку" сброшен, автоподгрузка включена');
};
