const { loopPlayback } = window;

const appRoot = document.getElementById('app');
let lastSelection = null;
let activeSelection = null;
let playbackState = {
  timer: null,
  clockInterval: null,
  startTime: null,
  duration: null,
  pausedAt: null,
  teardown: null
};

const CLOCK_MODES = ['clock', 'elapsed', 'remaining'];
let clockModeIndex = 0;

function loadIcons() {
  const template = document.getElementById('svg-icons');
  if (!template) return;
  const content = template.content.cloneNode(true);
  document.body.appendChild(content);
}

function formatDuration(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

function getClockLabel(mode) {
  switch (mode) {
    case 'clock':
      return '現在時刻';
    case 'elapsed':
      return '経過時間';
    case 'remaining':
      return '残り時間';
    default:
      return '';
  }
}

function calculateDefaultDuration() {
  return 3 * 60 * 60; // 3 hours
}

function renderSelectionScreen() {
  appRoot.innerHTML = '';
  const screen = document.createElement('div');
  screen.className = 'screen';

  const heading = document.createElement('h1');
  heading.textContent = 'スクリーンメディアを選択';
  screen.appendChild(heading);

  const grid = document.createElement('div');
  grid.className = 'selection-grid';

  if (lastSelection) {
    const card = document.createElement('div');
    card.className = 'selection-card';
    card.addEventListener('click', () => {
      activeSelection = lastSelection;
      renderTimerScreen();
    });

    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'placeholder-icon';
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.innerHTML = '<use href="#icon-play" />';
    iconWrapper.appendChild(icon);

    const label = document.createElement('div');
    label.className = 'label';
    label.textContent = lastSelection.name;

    const sub = document.createElement('div');
    sub.className = 'sub';
    sub.textContent = lastSelection.type === 'video' ? '前回の動画を再生' : '前回の画像を表示';

    card.appendChild(iconWrapper);
    card.appendChild(label);
    card.appendChild(sub);
    grid.appendChild(card);
  }

  const newCard = document.createElement('div');
  newCard.className = 'selection-card';
  newCard.addEventListener('click', async () => {
    const descriptor = await loopPlayback.selectMedia();
    if (!descriptor) return;
    activeSelection = descriptor;
    lastSelection = descriptor;
    renderTimerScreen();
  });

  const iconWrapper = document.createElement('div');
  iconWrapper.className = 'placeholder-icon';
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.innerHTML = '<use href="#icon-folder" />';
  iconWrapper.appendChild(icon);

  const label = document.createElement('div');
  label.className = 'label';
  label.textContent = '新しく動画・画像を選択する';

  const sub = document.createElement('div');
  sub.className = 'sub';
  sub.textContent = 'macOS用 無限ループプレーヤー';

  newCard.appendChild(iconWrapper);
  newCard.appendChild(label);
  newCard.appendChild(sub);
  grid.appendChild(newCard);

  screen.appendChild(grid);
  appRoot.appendChild(screen);
}

function renderTimerScreen() {
  appRoot.innerHTML = '';
  const screen = document.createElement('div');
  screen.className = 'screen';

  const container = document.createElement('div');
  container.className = 'timer-screen';

  const heading = document.createElement('h2');
  heading.textContent = activeSelection.type === 'video' ? '動画のループ再生' : '画像の常時表示';
  container.appendChild(heading);

  const info = document.createElement('div');
  info.className = 'media-info';
  const type = document.createElement('div');
  type.className = 'type';
  type.textContent = activeSelection.type.toUpperCase();
  const name = document.createElement('div');
  name.textContent = activeSelection.name;
  const path = document.createElement('div');
  path.className = 'info-text';
  path.textContent = activeSelection.path;
  info.appendChild(type);
  info.appendChild(name);
  info.appendChild(path);
  container.appendChild(info);

  const timerInputs = document.createElement('div');
  timerInputs.className = 'timer-inputs';

  const hoursLabel = document.createElement('label');
  hoursLabel.textContent = '時間 (0-23)';
  const hoursInput = document.createElement('input');
  hoursInput.type = 'number';
  hoursInput.min = '0';
  hoursInput.max = '23';
  hoursInput.placeholder = '0';
  hoursLabel.appendChild(hoursInput);

  const minutesLabel = document.createElement('label');
  minutesLabel.textContent = '分 (0-59)';
  const minutesInput = document.createElement('input');
  minutesInput.type = 'number';
  minutesInput.min = '0';
  minutesInput.max = '59';
  minutesInput.placeholder = '0';
  minutesLabel.appendChild(minutesInput);

  timerInputs.appendChild(hoursLabel);
  timerInputs.appendChild(minutesLabel);
  container.appendChild(timerInputs);

  const helper = document.createElement('div');
  helper.className = 'form-helper';
  helper.textContent = '未入力の場合は3時間で自動終了します。';
  container.appendChild(helper);

  const actions = document.createElement('div');
  actions.className = 'timer-actions';

  const backButton = document.createElement('button');
  backButton.className = 'button secondary';
  backButton.textContent = '戻る';
  backButton.addEventListener('click', () => {
    activeSelection = null;
    renderSelectionScreen();
  });

  const startButton = document.createElement('button');
  startButton.className = 'button';
  startButton.textContent = '開始';
  startButton.addEventListener('click', async () => {
    const hours = Number(hoursInput.value) || 0;
    const minutes = Number(minutesInput.value) || 0;
    let duration = hours * 3600 + minutes * 60;
    if (duration <= 0) {
      duration = calculateDefaultDuration();
    }
    await loopPlayback.saveLastSelection(activeSelection);
    startPlayback(duration);
  });

  actions.appendChild(backButton);
  actions.appendChild(startButton);
  container.appendChild(actions);

  screen.appendChild(container);
  appRoot.appendChild(screen);
}

function clearPlaybackState() {
  if (playbackState.timer) {
    clearTimeout(playbackState.timer);
    playbackState.timer = null;
  }
  if (playbackState.clockInterval) {
    clearInterval(playbackState.clockInterval);
    playbackState.clockInterval = null;
  }
  playbackState.startTime = null;
  playbackState.duration = null;
  playbackState.pausedAt = null;
  if (playbackState.teardown) {
    playbackState.teardown();
    playbackState.teardown = null;
  }
}

function startPlayback(durationSeconds) {
  clearPlaybackState();
  playbackState.duration = durationSeconds;
  playbackState.startTime = Date.now();
  clockModeIndex = 0;
  renderPlaybackScreen(durationSeconds);
}

function renderPlaybackScreen(durationSeconds) {
  appRoot.innerHTML = '';
  const screen = document.createElement('div');
  screen.className = 'playback-screen';

  const mediaURL = loopPlayback.pathToFileURL(activeSelection.path);

  let mediaElement;
  if (activeSelection.type === 'video') {
    const video = document.createElement('video');
    video.src = mediaURL;
    video.autoplay = true;
    video.loop = true;
    video.controls = false;
    video.playsInline = true;
    video.addEventListener('error', () => {
      console.error('動画の読み込みに失敗しました');
    });
    mediaElement = video;
  } else {
    const image = document.createElement('img');
    image.src = mediaURL;
    image.alt = activeSelection.name;
    mediaElement = image;
  }

  screen.appendChild(mediaElement);

  const overlay = document.createElement('div');
  overlay.className = 'overlay';

  const volumeZone = document.createElement('div');
  volumeZone.className = 'volume-hover-zone';
  const volumeContainer = document.createElement('div');
  volumeContainer.className = 'volume-container';

  const volumeButton = document.createElement('button');
  volumeButton.className = 'control-button';
  volumeButton.innerHTML = '<svg viewBox="0 0 24 24"><use href="#icon-volume" /></svg>';

  const volumePopup = document.createElement('div');
  volumePopup.className = 'volume-popup';
  const volumeSlider = document.createElement('input');
  volumeSlider.type = 'range';
  volumeSlider.min = '0';
  volumeSlider.max = '1';
  volumeSlider.step = '0.05';
  volumeSlider.value = '1';
  volumeSlider.className = 'volume-slider';

  const volumeValue = document.createElement('div');
  volumeValue.className = 'info-text';
  volumeValue.textContent = '100%';

  if (activeSelection.type === 'video') {
    volumeButton.addEventListener('click', () => {
      if (mediaElement.muted) {
        mediaElement.muted = false;
        volumeButton.classList.remove('muted');
      } else {
        mediaElement.muted = true;
        volumeButton.classList.add('muted');
      }
    });

    volumeSlider.addEventListener('input', () => {
      const volume = Number(volumeSlider.value);
      mediaElement.volume = volume;
      mediaElement.muted = volume === 0;
      volumeValue.textContent = `${Math.round(volume * 100)}%`;
    });
  } else {
    volumeButton.disabled = true;
    volumeSlider.disabled = true;
    volumeValue.textContent = '画像表示中';
  }

  volumePopup.appendChild(volumeSlider);
  volumePopup.appendChild(volumeValue);
  volumeContainer.appendChild(volumeButton);
  volumeContainer.appendChild(volumePopup);
  volumeZone.appendChild(volumeContainer);
  overlay.appendChild(volumeZone);

  const clockContainer = document.createElement('div');
  clockContainer.className = 'clock-container';
  const clockBar = document.createElement('div');
  clockBar.className = 'control-bar';
  const clockIcon = document.createElement('span');
  clockIcon.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24"><use href="#icon-clock" /></svg>';
  const clockLabel = document.createElement('div');
  clockLabel.className = 'info-text';
  clockLabel.textContent = getClockLabel(CLOCK_MODES[clockModeIndex]);
  const clockDisplay = document.createElement('div');
  clockDisplay.className = 'clock-display';

  clockBar.appendChild(clockIcon);
  clockBar.appendChild(clockLabel);
  clockBar.appendChild(clockDisplay);
  clockContainer.appendChild(clockBar);

  clockBar.addEventListener('click', () => {
    clockModeIndex = (clockModeIndex + 1) % CLOCK_MODES.length;
    clockLabel.textContent = getClockLabel(CLOCK_MODES[clockModeIndex]);
    updateClock(clockDisplay);
  });

  overlay.appendChild(clockContainer);

  const controlsContainer = document.createElement('div');
  controlsContainer.className = 'fullscreen-container';
  const controlsBar = document.createElement('div');
  controlsBar.className = 'control-bar';

  const fullscreenButton = document.createElement('button');
  fullscreenButton.className = 'control-button';
  fullscreenButton.innerHTML = '<svg viewBox="0 0 24 24"><use href="#icon-fullscreen" /></svg>';

  const stopButton = document.createElement('button');
  stopButton.className = 'control-button';
  stopButton.innerHTML = '<svg viewBox="0 0 24 24"><use href="#icon-stop" /></svg>';

  const pauseButton = document.createElement('button');
  pauseButton.className = 'control-button';
  pauseButton.innerHTML = '<svg viewBox="0 0 24 24"><use href="#icon-pause" /></svg>';

  controlsBar.appendChild(fullscreenButton);
  controlsBar.appendChild(stopButton);
  controlsBar.appendChild(pauseButton);
  controlsContainer.appendChild(controlsBar);
  overlay.appendChild(controlsContainer);

  const toast = document.createElement('div');
  toast.className = 'fullscreen-toast';
  toast.textContent = 'Escで全画面終了';
  overlay.appendChild(toast);

  screen.appendChild(overlay);
  appRoot.appendChild(screen);

  const onFullscreenChange = () => {
    const isFull = Boolean(document.fullscreenElement);
    fullscreenButton.innerHTML = isFull
      ? '<svg viewBox="0 0 24 24"><use href="#icon-exit-fullscreen" /></svg>'
      : '<svg viewBox="0 0 24 24"><use href="#icon-fullscreen" /></svg>';
  };

  document.addEventListener('fullscreenchange', onFullscreenChange);

  playbackState.teardown = () => {
    document.removeEventListener('fullscreenchange', onFullscreenChange);
    if (typeof mediaElement.pause === 'function') {
      mediaElement.pause();
    }
  };

  setupClock(clockDisplay);
  setupTimer(durationSeconds, mediaElement);

  stopButton.addEventListener('click', () => {
    exitFullscreen();
    cleanupAndReturn();
  });

  pauseButton.addEventListener('click', () => {
    if (playbackState.pausedAt) {
      resumePlayback(mediaElement);
      pauseButton.innerHTML = '<svg viewBox="0 0 24 24"><use href="#icon-pause" /></svg>';
    } else {
      pausePlayback(mediaElement);
      pauseButton.innerHTML = '<svg viewBox="0 0 24 24"><use href="#icon-play" /></svg>';
    }
  });

  fullscreenButton.addEventListener('click', () => {
    toggleFullscreen(screen, fullscreenButton, toast);
  });
}

function setupClock(displayEl) {
  updateClock(displayEl);
  playbackState.clockInterval = setInterval(() => updateClock(displayEl), 1000);
}

function updateClock(displayEl) {
  const mode = CLOCK_MODES[clockModeIndex];
  if (mode === 'clock') {
    const now = new Date();
    displayEl.textContent = now.toLocaleTimeString('ja-JP', { hour12: false });
  } else if (mode === 'elapsed') {
    if (!playbackState.startTime) return;
    const elapsedSeconds = playbackState.pausedAt
      ? Math.floor((playbackState.pausedAt - playbackState.startTime) / 1000)
      : Math.floor((Date.now() - playbackState.startTime) / 1000);
    displayEl.textContent = formatDuration(elapsedSeconds);
  } else if (mode === 'remaining') {
    if (!playbackState.startTime || !playbackState.duration) return;
    const elapsed = playbackState.pausedAt
      ? Math.floor((playbackState.pausedAt - playbackState.startTime) / 1000)
      : Math.floor((Date.now() - playbackState.startTime) / 1000);
    const remaining = Math.max(playbackState.duration - elapsed, 0);
    displayEl.textContent = formatDuration(remaining);
  }
}

function setupTimer(durationSeconds, mediaElement) {
  const safeDuration = Math.max(durationSeconds, 0);
  if (playbackState.timer) {
    clearTimeout(playbackState.timer);
  }
  if (safeDuration <= 0) {
    exitFullscreen();
    cleanupAndReturn();
    return;
  }

  const remaining = safeDuration * 1000;
  playbackState.timer = setTimeout(() => {
    exitFullscreen();
    cleanupAndReturn();
  }, remaining);

  if (activeSelection.type === 'video') {
    mediaElement.play().catch(() => {
      console.warn('自動再生がブロックされました。');
    });
  }
}

function pausePlayback(mediaElement) {
  if (playbackState.pausedAt) return;
  playbackState.pausedAt = Date.now();
  clearTimeout(playbackState.timer);
  if (activeSelection.type === 'video') {
    mediaElement.pause();
  }
}

function resumePlayback(mediaElement) {
  if (!playbackState.pausedAt) return;
  const pausedDuration = Date.now() - playbackState.pausedAt;
  playbackState.startTime += pausedDuration;
  playbackState.pausedAt = null;
  const elapsedSeconds = Math.floor((Date.now() - playbackState.startTime) / 1000);
  const remainingSeconds = Math.max(playbackState.duration - elapsedSeconds, 0);
  setupTimer(remainingSeconds, mediaElement);
  if (activeSelection.type === 'video') {
    mediaElement.play().catch(() => {});
  }
}

function cleanupAndReturn() {
  clearPlaybackState();
  activeSelection = null;
  renderSelectionScreen();
}

function toggleFullscreen(element, button, toast) {
  if (!document.fullscreenElement) {
    element.requestFullscreen({ navigationUI: 'hide' }).then(() => {
      showFullscreenToast(toast);
    }).catch((error) => {
      console.error('Failed to enter fullscreen', error);
    });
  } else {
    exitFullscreen();
  }
}

function showFullscreenToast(toast) {
  toast.classList.add('visible');
  setTimeout(() => {
    toast.classList.add('fade-out');
  }, 2000);
  toast.addEventListener('animationend', () => {
    toast.classList.remove('visible', 'fade-out');
  }, { once: true });
}

function exitFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
}

async function initialize() {
  loadIcons();
  try {
    lastSelection = await loopPlayback.loadLastSelection();
  } catch (error) {
    console.error('設定の読み込みに失敗しました', error);
  }
  renderSelectionScreen();
}

initialize();
