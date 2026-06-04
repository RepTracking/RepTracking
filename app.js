const STORAGE_KEY = "gym-timer-session-v1";
const state = {
  sets: [],
  timer: {
    duration: 90,
    remaining: 90,
    startedAt: null,
    pausedAt: null,
    isRunning: false,
    isPaused: false,
    intervalId: null,
  },
};

const els = {
  app: document.querySelector(".app-shell"),
  exerciseName: document.querySelector("#exerciseName"),
  repsInput: document.querySelector("#repsInput"),
  weightInput: document.querySelector("#weightInput"),
  minutesInput: document.querySelector("#minutesInput"),
  secondsInput: document.querySelector("#secondsInput"),
  presetButtons: document.querySelectorAll("[data-rest-preset]"),
  stepButtons: document.querySelectorAll("[data-step-target]"),
  timerAdjustButtons: document.querySelectorAll("[data-timer-adjust]"),
  completeSet: document.querySelector("#completeSet"),
  toggleTimer: document.querySelector("#toggleTimer"),
  skipTimer: document.querySelector("#skipTimer"),
  resetSession: document.querySelector("#resetSession"),
  clearHistory: document.querySelector("#clearHistory"),
  timerLabel: document.querySelector("#timerLabel"),
  timeRemaining: document.querySelector("#timeRemaining"),
  timerProgress: document.querySelector("#timerProgress"),
  nextSetNumber: document.querySelector("#nextSetNumber"),
  logSetDetail: document.querySelector("#logSetDetail"),
  sessionDate: document.querySelector("#sessionDate"),
  toast: document.querySelector("#toast"),
  setCount: document.querySelector("#setCount"),
  totalVolume: document.querySelector("#totalVolume"),
  restUsed: document.querySelector("#restUsed"),
  setList: document.querySelector("#setList"),
  emptyState: document.querySelector("#emptyState"),
};

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function getRestDuration() {
  const minutes = clampNumber(els.minutesInput.value, 0, 59, 0);
  const seconds = clampNumber(els.secondsInput.value, 0, 59, 0);
  const duration = minutes * 60 + seconds;
  return Math.max(1, duration);
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.max(0, Math.floor(totalSeconds % 60));
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function persist() {
  const payload = {
    sets: state.sets,
    exercise: els.exerciseName.value,
    reps: els.repsInput.value,
    weight: els.weightInput.value,
    minutes: els.minutesInput.value,
    seconds: els.secondsInput.value,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function restore() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  try {
    const payload = JSON.parse(saved);
    state.sets = Array.isArray(payload.sets) ? payload.sets : [];
    els.exerciseName.value = payload.exercise || "Bench Press";
    els.repsInput.value = payload.reps || "8";
    els.weightInput.value = payload.weight || "135";
    els.minutesInput.value = payload.minutes || "1";
    els.secondsInput.value = payload.seconds || "30";
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function updateTimerFromInputs() {
  if (state.timer.isRunning) {
    renderPresetState();
    return;
  }
  state.timer.duration = getRestDuration();
  state.timer.remaining = state.timer.duration;
  renderTimer();
  renderPresetState();
}

function startTimer(duration = state.timer.remaining || getRestDuration()) {
  stopInterval();
  state.timer.duration = duration;
  state.timer.remaining = duration;
  state.timer.startedAt = Date.now();
  state.timer.pausedAt = null;
  state.timer.isRunning = true;
  state.timer.isPaused = false;
  state.timer.intervalId = window.setInterval(tick, 250);
  tick();
}

function pauseTimer() {
  if (!state.timer.isRunning || state.timer.isPaused) return;
  state.timer.isPaused = true;
  state.timer.pausedAt = Date.now();
  stopInterval();
  renderTimer();
}

function resumeTimer() {
  if (!state.timer.isPaused) return;
  const pausedFor = Date.now() - state.timer.pausedAt;
  state.timer.startedAt += pausedFor;
  state.timer.pausedAt = null;
  state.timer.isPaused = false;
  state.timer.intervalId = window.setInterval(tick, 250);
  tick();
}

function finishTimer() {
  const wasRunning = state.timer.isRunning;
  stopInterval();
  state.timer.remaining = 0;
  state.timer.isRunning = false;
  state.timer.isPaused = false;
  if (wasRunning) signalRestComplete();
  renderTimer();
}

function skipTimer() {
  stopInterval();
  state.timer.duration = getRestDuration();
  state.timer.remaining = state.timer.duration;
  state.timer.isRunning = false;
  state.timer.isPaused = false;
  renderTimer();
}

function adjustTimer(amount) {
  const nextRemaining = Math.max(1, state.timer.remaining + amount);
  if (state.timer.isRunning) {
    state.timer.duration = Math.max(state.timer.duration, nextRemaining);
    state.timer.remaining = nextRemaining;
    state.timer.startedAt = Date.now() - (state.timer.duration - nextRemaining) * 1000;
    if (state.timer.isPaused) state.timer.pausedAt = Date.now();
  } else {
    state.timer.duration = nextRemaining;
    state.timer.remaining = nextRemaining;
  }
  renderTimer();
}

function stopInterval() {
  if (state.timer.intervalId) {
    window.clearInterval(state.timer.intervalId);
    state.timer.intervalId = null;
  }
}

function tick() {
  const elapsed = Math.floor((Date.now() - state.timer.startedAt) / 1000);
  state.timer.remaining = Math.max(0, state.timer.duration - elapsed);
  if (state.timer.remaining <= 0) finishTimer();
  renderTimer();
}

function logSet() {
  const exercise = els.exerciseName.value.trim() || "Exercise";
  const reps = clampNumber(els.repsInput.value, 1, 999, 1);
  const weight = clampNumber(els.weightInput.value, 0, 9999, 0);
  const rest = getRestDuration();

  els.repsInput.value = String(reps);
  els.weightInput.value = String(weight);

  state.sets.unshift({
    id: crypto.randomUUID(),
    exercise,
    reps,
    weight,
    rest,
    completedAt: new Date().toISOString(),
  });

  startTimer(rest);
  persist();
  renderSession();
  showToast(`Set ${state.sets.length} logged`);
}

function clearHistory() {
  state.sets = [];
  persist();
  renderSession();
  showToast("Sets cleared");
}

function resetSession() {
  clearHistory();
  skipTimer();
}

function renderTimer() {
  const { duration, remaining, isRunning, isPaused } = state.timer;
  const progress = duration > 0 ? remaining / duration : 0;

  els.timeRemaining.textContent = formatTime(remaining);
  els.timerProgress.style.transform = `scaleX(${progress})`;
  els.app.classList.toggle("is-resting", isRunning && !isPaused);
  els.app.classList.toggle("is-paused", isPaused);

  if (isPaused) {
    els.timerLabel.textContent = "Paused";
    els.toggleTimer.textContent = "Resume rest";
  } else if (isRunning) {
    els.timerLabel.textContent = "Resting now";
    els.toggleTimer.textContent = "Pause";
  } else if (remaining === 0) {
    els.timerLabel.textContent = "Rest complete";
    els.toggleTimer.textContent = "Start rest";
  } else {
    els.timerLabel.textContent = "Ready for a set";
    els.toggleTimer.textContent = "Start rest";
  }
}

function renderSession() {
  els.setCount.textContent = String(state.sets.length);

  const volume = state.sets.reduce((sum, set) => sum + set.reps * set.weight, 0);
  const restTotal = state.sets.reduce((sum, set) => sum + set.rest, 0);

  els.totalVolume.textContent = new Intl.NumberFormat().format(volume);
  els.restUsed.textContent = formatTime(restTotal);
  els.emptyState.hidden = state.sets.length > 0;
  els.nextSetNumber.textContent = String(state.sets.length + 1);

  els.setList.innerHTML = state.sets
    .map((set, index) => {
      const time = new Date(set.completedAt).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
      return `
        <li>
          <span class="set-index">${String(state.sets.length - index).padStart(2, "0")}</span>
          <span class="set-main">
            <strong>${escapeHtml(set.exercise)}</strong>
            <span>${set.reps} reps - ${set.weight} lb - ${time}</span>
          </span>
          <span class="set-rest">${formatTime(set.rest)}</span>
          <button class="delete-set" type="button" data-delete-set="${set.id}" aria-label="Delete set">&times;</button>
        </li>
      `;
    })
    .join("");
}

function renderLogDetail() {
  const reps = clampNumber(els.repsInput.value, 1, 999, 1);
  const weight = clampNumber(els.weightInput.value, 0, 9999, 0);
  els.logSetDetail.textContent = `${reps} reps at ${weight} lb`;
}

function renderPresetState() {
  const duration = getRestDuration();
  els.presetButtons.forEach((button) => {
    button.classList.toggle("is-active", Number(button.dataset.restPreset) === duration);
  });
}

function setRestDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  els.minutesInput.value = String(minutes);
  els.secondsInput.value = String(seconds);
  updateTimerFromInputs();
  persist();
}

function signalRestComplete() {
  if ("vibrate" in navigator) navigator.vibrate([160, 80, 160]);
  showToast("Rest complete. Your next set is ready.");
}

let toastTimer;
function showToast(message) {
  window.clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => els.toast.classList.remove("is-visible"), 2200);
}

function stepInput(targetId, amount) {
  const input = document.querySelector(`#${targetId}`);
  const min = Number(input.min || 0);
  const max = Number(input.max || Number.MAX_SAFE_INTEGER);
  input.value = String(clampNumber(Number(input.value) + amount, min, max, min));
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function deleteSet(id) {
  state.sets = state.sets.filter((set) => set.id !== id);
  persist();
  renderSession();
  showToast("Set removed");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function bindEvents() {
  els.completeSet.addEventListener("click", logSet);
  els.skipTimer.addEventListener("click", skipTimer);
  els.clearHistory.addEventListener("click", clearHistory);
  els.resetSession.addEventListener("click", resetSession);
  els.toggleTimer.addEventListener("click", () => {
    if (state.timer.isPaused) {
      resumeTimer();
    } else if (state.timer.isRunning) {
      pauseTimer();
    } else {
      startTimer(getRestDuration());
    }
  });

  [els.exerciseName, els.repsInput, els.weightInput, els.minutesInput, els.secondsInput].forEach((input) => {
    input.addEventListener("change", () => {
      updateTimerFromInputs();
      persist();
    });
    input.addEventListener("input", () => {
      persist();
      renderLogDetail();
    });
  });

  [els.minutesInput, els.secondsInput].forEach((input) => {
    input.addEventListener("input", updateTimerFromInputs);
  });

  els.presetButtons.forEach((button) => {
    button.addEventListener("click", () => setRestDuration(Number(button.dataset.restPreset)));
  });

  els.stepButtons.forEach((button) => {
    button.addEventListener("click", () => stepInput(button.dataset.stepTarget, Number(button.dataset.stepAmount)));
  });

  els.timerAdjustButtons.forEach((button) => {
    button.addEventListener("click", () => adjustTimer(Number(button.dataset.timerAdjust)));
  });

  els.setList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-set]");
    if (button) deleteSet(button.dataset.deleteSet);
  });
}

restore();
bindEvents();
updateTimerFromInputs();
renderSession();
renderLogDetail();
els.sessionDate.textContent = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "short",
  day: "numeric",
}).format(new Date());
