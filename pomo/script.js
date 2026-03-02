const MODES = {
  pomodoro: "pomodoro",
  short: "short-break",
  long: "long-break",
};

const timeDisplay = document.getElementById("time-display");
const progressBar = document.getElementById("progress-bar");
const startPauseBtn = document.getElementById("start-pause");
const resetBtn = document.getElementById("reset");
const modeButtons = document.querySelectorAll(".mode-button");
const sessionCountEl = document.getElementById("session-count");
const themeToggle = document.querySelector(".theme-toggle");
const nightlightToggle = document.querySelector(".nightlight-toggle");
const quoteBanner = document.getElementById("quote-banner");
const activeTaskBanner = document.getElementById("active-task-banner");
const taskCompleteDialog = document.getElementById("task-complete-dialog");

const pomodoroInput = document.getElementById("pomodoro-input");
const shortInput = document.getElementById("short-break-input");
const longInput = document.getElementById("long-break-input");

const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");

let state = {
  currentMode: MODES.pomodoro,
  remainingSeconds: 25 * 60,
  totalSeconds: 25 * 60,
  isRunning: false,
  intervalId: null,
  sessionCount: 1,
  hasStarted: false,
};

let activeTask = null;

const QUOTES = [
  {
    text: "Discipline is the bridge between goals and accomplishment.",
    author: "Jim Rohn",
  },
  {
    text: "Success is the sum of small efforts, repeated day in and day out.",
    author: "Robert Collier",
  },
  {
    text: "You do not rise to the level of your goals. You fall to the level of your systems.",
    author: "James Clear",
  },
  {
    text: "It always seems impossible until it’s done.",
    author: "Nelson Mandela",
  },
  {
    text: "Action is the foundational key to all success.",
    author: "Pablo Picasso",
  },
  {
    text: "The future depends on what you do today.",
    author: "Mahatma Gandhi",
  },
  {
    text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "Will Durant",
  },
];

function loadSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem("pomoSettings") || "{}");
    if (typeof stored.pomodoro === "number") {
      pomodoroInput.value = stored.pomodoro;
    }
    if (typeof stored.short === "number") {
      shortInput.value = stored.short;
    }
    if (typeof stored.long === "number") {
      longInput.value = stored.long;
    }
  } catch {
    // ignore
  }
}

function saveSettings() {
  const settings = {
    pomodoro: Number(pomodoroInput.value) || 25,
    short: Number(shortInput.value) || 5,
    long: Number(longInput.value) || 15,
  };
  localStorage.setItem("pomoSettings", JSON.stringify(settings));
}

function getDurationForMode(mode) {
  const fallback = {
    [MODES.pomodoro]: 25,
    [MODES.short]: 5,
    [MODES.long]: 15,
  };
  const minutes =
    mode === MODES.pomodoro
      ? Number(pomodoroInput.value)
      : mode === MODES.short
        ? Number(shortInput.value)
        : Number(longInput.value);
  return (Number.isFinite(minutes) && minutes > 0 ? minutes : fallback[mode]) * 60;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

function setMode(mode) {
  state.currentMode = mode;
  state.totalSeconds = getDurationForMode(mode);
  state.remainingSeconds = state.totalSeconds;
  stopTimer();
  renderTime();
  renderProgress();
  updateModeButtons();
}

function updateModeButtons() {
  modeButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === state.currentMode);
  });
}

function renderTime() {
  timeDisplay.textContent = formatTime(state.remainingSeconds);
}

function renderProgress() {
  const elapsed = state.totalSeconds - state.remainingSeconds;
  const fraction = state.totalSeconds ? elapsed / state.totalSeconds : 0;
  progressBar.style.width = `${Math.min(100, Math.max(0, fraction * 100))}%`;
}

function tick() {
  if (!state.isRunning) return;
  state.remainingSeconds -= 1;

  if (state.remainingSeconds <= 0) {
    state.remainingSeconds = 0;
    renderTime();
    renderProgress();
    handleSessionEnd();
    return;
  }

  renderTime();
  renderProgress();
}

function handleSessionEnd() {
  stopTimer();
  playChime();

  if (state.currentMode === MODES.pomodoro) {
    state.sessionCount += 1;
    sessionCountEl.textContent = String(state.sessionCount);
    const useLong = state.sessionCount % 4 === 0;
    setMode(useLong ? MODES.long : MODES.short);
  } else {
    setMode(MODES.pomodoro);
  }
}

function startTimer() {
  if (state.isRunning) return;
  state.isRunning = true;
  state.hasStarted = true;
  startPauseBtn.textContent = "Pause";
  state.intervalId = setInterval(tick, 1000);
  renderActiveTask();
}

function stopTimer() {
  state.isRunning = false;
  startPauseBtn.textContent = "Start";
  if (state.intervalId) {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }
}

function resetTimer() {
  stopTimer();
  state.totalSeconds = getDurationForMode(state.currentMode);
  state.remainingSeconds = state.totalSeconds;
  renderTime();
  renderProgress();
}

startPauseBtn.addEventListener("click", () => {
  if (state.isRunning) {
    stopTimer();
  } else {
    saveSettings();
    if (!state.remainingSeconds || state.remainingSeconds === 0) {
      state.totalSeconds = getDurationForMode(state.currentMode);
      state.remainingSeconds = state.totalSeconds;
    }
    startTimer();
  }
});

resetBtn.addEventListener("click", () => {
  resetTimer();
});

modeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.mode;
    if (!mode || mode === state.currentMode) return;
    setMode(mode);
  });
});

document
  .getElementById("settings-form")
  .addEventListener("change", saveSettings);

// Theme toggle
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

function applyTheme(theme) {
  const html = document.documentElement;
  html.dataset.theme = theme;
  localStorage.setItem("pomoTheme", theme);
  const icon = theme === "dark" ? "☾" : "☼";
  themeToggle.querySelector(".theme-icon").textContent = icon;
}

function initTheme() {
  const stored = localStorage.getItem("pomoTheme");
  if (stored === "light" || stored === "dark") {
    applyTheme(stored);
  } else {
    applyTheme(prefersDark.matches ? "dark" : "light");
  }
}

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.dataset.theme || "dark";
  applyTheme(current === "dark" ? "light" : "dark");
});

prefersDark.addEventListener("change", (event) => {
  const stored = localStorage.getItem("pomoTheme");
  if (!stored) {
    applyTheme(event.matches ? "dark" : "light");
  }
});

function applyNightlight(on) {
  const html = document.documentElement;
  html.dataset.nightlight = on ? "on" : "off";
  localStorage.setItem("pomoNightlight", on ? "on" : "off");
  if (nightlightToggle) {
    nightlightToggle.querySelector(".nightlight-icon").textContent = "👁";
  }
}

function initNightlight() {
  const stored = localStorage.getItem("pomoNightlight");
  const on = stored === "on";
  applyNightlight(on);
}

if (nightlightToggle) {
  nightlightToggle.addEventListener("click", () => {
    const current = document.documentElement.dataset.nightlight === "on";
    applyNightlight(!current);
  });
}

// Simple chime
function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc.start(now);
    osc.stop(now + 0.85);
  } catch {
    // ignore if audio unavailable
  }
}

// Tasks
function loadTasks() {
  try {
    const tasks = JSON.parse(localStorage.getItem("pomoTasks") || "[]");
    tasks.forEach((t) => addTaskToDom(t));
  } catch {
    // ignore
  }
}

function saveTasks() {
  const data = [];
  taskList.querySelectorAll(".task-item").forEach((item) => {
    const subtasks = [];
    item.querySelectorAll(".subtask-item").forEach((subEl) => {
      subtasks.push({
        id: subEl.dataset.id,
        text: subEl.querySelector(".subtask-label").textContent,
        completed: subEl.classList.contains("completed"),
      });
    });
    data.push({
      id: item.dataset.id,
      text: item.querySelector(".task-label").textContent,
      completed: item.classList.contains("completed"),
      subtasks,
    });
  });
  localStorage.setItem("pomoTasks", JSON.stringify(data));
}

function createTask(text) {
  return {
    id: String(Date.now()),
    text,
    completed: false,
    subtasks: [],
  };
}

function addTaskToDom(task) {
  const li = document.createElement("li");
  li.className = "task-item";
  li.dataset.id = task.id;
  if (task.completed) li.classList.add("completed");

  const check = document.createElement("div");
  check.className = "task-check";
  check.textContent = task.completed ? "✓" : "";

  const label = document.createElement("div");
  label.className = "task-label";
  label.textContent = task.text;

  const subContainer = document.createElement("div");
  subContainer.className = "subtasks";

  const subList = document.createElement("ul");
  subList.className = "subtask-list";
  subContainer.appendChild(subList);

  const subForm = document.createElement("form");
  subForm.className = "subtask-form";

  const subInput = document.createElement("input");
  subInput.type = "text";
  subInput.placeholder = "Add subtask";
  subInput.autocomplete = "off";

  const subBtn = document.createElement("button");
  subBtn.type = "submit";
  subBtn.textContent = "+";

  subForm.appendChild(subInput);
  subForm.appendChild(subBtn);
  subContainer.appendChild(subForm);

  if (Array.isArray(task.subtasks)) {
    task.subtasks.forEach((s) => addSubtaskToDom(subList, s));
  }

  const focusBtn = document.createElement("button");
  focusBtn.className = "task-focus";
  focusBtn.type = "button";
  focusBtn.textContent = "Focus";

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "task-delete";
  deleteBtn.type = "button";
  deleteBtn.innerHTML = "✕";

  li.appendChild(check);
  li.appendChild(label);
  li.appendChild(subContainer);
  li.appendChild(focusBtn);
  li.appendChild(deleteBtn);

  taskList.appendChild(li);

  subForm.addEventListener("submit", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const text = subInput.value.trim();
    if (!text) return;
    const subtask = createSubtask(text);
    addSubtaskToDom(subList, subtask);
    subInput.value = "";
    saveTasks();
  });
}

function createSubtask(text) {
  return {
    id: String(Date.now()) + "-" + Math.random().toString(16).slice(2),
    text,
    completed: false,
  };
}

function addSubtaskToDom(subList, subtask) {
  const li = document.createElement("li");
  li.className = "subtask-item";
  li.dataset.id = subtask.id;
  if (subtask.completed) li.classList.add("completed");

  const check = document.createElement("div");
  check.className = "subtask-check";
  check.textContent = subtask.completed ? "✓" : "";

  const label = document.createElement("div");
  label.className = "subtask-label";
  label.textContent = subtask.text;

  const del = document.createElement("button");
  del.type = "button";
  del.className = "subtask-delete";
  del.textContent = "✕";

  li.appendChild(check);
  li.appendChild(label);
  li.appendChild(del);

  subList.appendChild(li);
}

taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();
  if (!text) return;
  const task = createTask(text);
  addTaskToDom(task);
  saveTasks();
  taskInput.value = "";
});

taskList.addEventListener("click", (e) => {
  const item = e.target.closest(".task-item");
  if (!item) return;

  const subItem = e.target.closest(".subtask-item");
  if (subItem) {
    if (e.target.classList.contains("subtask-delete")) {
      subItem.remove();
      saveTasks();
      return;
    }
    subItem.classList.toggle("completed");
    const check = subItem.querySelector(".subtask-check");
    check.textContent = subItem.classList.contains("completed") ? "✓" : "";
    saveTasks();
    return;
  }

  if (e.target.classList.contains("task-focus")) {
    const id = item.dataset.id;
    const text = item.querySelector(".task-label").textContent;
    setActiveTask(id, text);
    return;
  }

  if (e.target.classList.contains("task-delete")) {
    const id = item.dataset.id;
    if (activeTask && activeTask.id === id) {
      clearActiveTask();
    }
    item.remove();
    saveTasks();
    return;
  }
  // Only toggle main task when clicking its checkbox or label,
  // not when interacting with subtasks or the subtask form.
  if (
    e.target.closest(".task-check") ||
    e.target.closest(".task-label")
  ) {
    const willComplete = !item.classList.contains("completed");
    item.classList.toggle("completed");
    const check = item.querySelector(".task-check");
    check.textContent = item.classList.contains("completed") ? "✓" : "";
    saveTasks();
    if (willComplete) {
      const text = item.querySelector(".task-label").textContent;
      showTaskCompleted(text);
    }
  }
});

// Initialisation
loadSettings();
initTheme();
initNightlight();
setMode(MODES.pomodoro);
loadTasks();
setRandomQuote();
loadActiveTask();

function setRandomQuote() {
  if (!quoteBanner || !QUOTES.length) return;
  const index = Math.floor(Math.random() * QUOTES.length);
  const { text, author } = QUOTES[index];
  quoteBanner.textContent = `${text} — ${author}`;
}

function renderActiveTask() {
  if (!activeTaskBanner) return;
  activeTaskBanner.innerHTML = "";

  if (!activeTask || !activeTask.text || !state.hasStarted) {
    activeTaskBanner.classList.remove("active");
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "active-task-banner-inner";

  const pill = document.createElement("span");
  pill.className = "active-task-pill";

  const label = document.createElement("span");
  label.className = "active-task-label";
  label.textContent = "Now focusing on";

  const textEl = document.createElement("span");
  textEl.className = "active-task-text";
  textEl.textContent = activeTask.text;

  wrapper.appendChild(pill);
  wrapper.appendChild(label);
  wrapper.appendChild(textEl);

  activeTaskBanner.appendChild(wrapper);
  activeTaskBanner.classList.add("active");
}

function setActiveTask(id, text) {
  activeTask = { id, text };
  localStorage.setItem("pomoActiveTask", JSON.stringify(activeTask));
  renderActiveTask();
}

function clearActiveTask() {
  activeTask = null;
  localStorage.removeItem("pomoActiveTask");
  renderActiveTask();
}

function loadActiveTask() {
  try {
    const stored = JSON.parse(localStorage.getItem("pomoActiveTask") || "null");
    if (stored && stored.text) {
      activeTask = stored;
      renderActiveTask();
    }
  } catch {
    // ignore
  }
}

function showTaskCompleted(text) {
  if (!taskCompleteDialog) return;

  taskCompleteDialog.innerHTML = "";

  const inner = document.createElement("div");
  inner.className = "task-complete-dialog-inner";

  const title = document.createElement("div");
  title.className = "task-complete-title";
  title.textContent = "Task completed";

  const body = document.createElement("div");
  body.className = "task-complete-text";
  body.textContent = text;

  inner.appendChild(title);
  inner.appendChild(body);
  taskCompleteDialog.appendChild(inner);

  taskCompleteDialog.classList.add("show");

  setTimeout(() => {
    taskCompleteDialog.classList.remove("show");
  }, 1800);
}

