<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

/* ------------------------------------------------------------------ */
/* Storage                                                             */
/* ------------------------------------------------------------------ */

const TASKS_KEY = 'taskify-tasks'
const THEME_KEY = 'taskify-theme'
const ACCENT_KEY = 'taskify-accent'

const readStore = (key) => {
  try { return localStorage.getItem(key) } catch { return null }
}
const writeStore = (key, value) => {
  try { localStorage.setItem(key, value) } catch { /* storage unavailable */ }
}

const loadTasks = () => {
  try {
    const saved = readStore(TASKS_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

const tasks = ref(loadTasks())
const taskInput = ref('')

/* ------------------------------------------------------------------ */
/* Derived state                                                       */
/* ------------------------------------------------------------------ */

const remainingTasks = computed(
  () => tasks.value.filter((task) => !task.isDone).length,
)

const doneTasks = computed(() => tasks.value.length - remainingTasks.value)

const progress = computed(() =>
  tasks.value.length
    ? Math.round((doneTasks.value / tasks.value.length) * 100)
    : 0,
)

const allDone = computed(
  () => tasks.value.length > 0 && remainingTasks.value === 0,
)

const taskCountLabel = computed(
  () => `${remainingTasks.value} ${remainingTasks.value === 1 ? 'task' : 'tasks'} left`,
)

const todayLabel = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
}).format(new Date())

watch(
  tasks,
  (value) => writeStore(TASKS_KEY, JSON.stringify(value)),
  { deep: true },
)

/* ------------------------------------------------------------------ */
/* Task actions (logic unchanged)                                      */
/* ------------------------------------------------------------------ */

function addTask() {
  const title = taskInput.value.trim()
  if (!title) return

  tasks.value.push({
    id: crypto.randomUUID(),
    title,
    isDone: false,
  })

  taskInput.value = ''
}

const pendingDelete = ref(null)

function askRemove(task) {
  pendingDelete.value = task
}

function confirmRemove() {
  if (!pendingDelete.value) return
  const id = pendingDelete.value.id
  tasks.value = tasks.value.filter((task) => task.id !== id)
  pendingDelete.value = null
}

function cancelRemove() {
  pendingDelete.value = null
}

/* Dialog focus + scroll lock */
const cancelBtn = ref(null)
watch(pendingDelete, async (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
  if (open) {
    await nextTick()
    cancelBtn.value?.focus()
  }
})

/* ------------------------------------------------------------------ */
/* Material You dynamic color                                          */
/* ------------------------------------------------------------------ */

const SEED_COLORS = [
  { name: 'Iris',   hex: '#6750A4' },
  { name: 'Ocean',  hex: '#0B57D0' },
  { name: 'Lagoon', hex: '#00696D' },
  { name: 'Fern',   hex: '#3B6939' },
  { name: 'Rose',   hex: '#B0336B' },
  { name: 'Amber',  hex: '#7A5900' },
]

const prefersDark =
  typeof window !== 'undefined'
    ? window.matchMedia?.('(prefers-color-scheme: dark)')
    : null

const mode = ref(
  readStore(THEME_KEY) || (prefersDark?.matches ? 'dark' : 'light'),
)
const seed = ref(readStore(ACCENT_KEY) || SEED_COLORS[0].hex)
const paletteOpen = ref(false)

function hexToHsl(hex) {
  const n = parseInt(hex.slice(1), 16)
  const r = ((n >> 16) & 255) / 255
  const g = ((n >> 8) & 255) / 255
  const b = (n & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      default: h = (r - g) / d + 4
    }
    h *= 60
  }
  return { h, s: s * 100, l: l * 100 }
}

const tone = (h, s, l) =>
  `hsl(${h.toFixed(1)} ${Math.min(100, Math.max(0, s)).toFixed(1)}% ${l}%)`

function buildPalette(seedHex, dark) {
  const { h, s } = hexToHsl(seedHex)
  const sP = Math.min(88, Math.max(30, s)) // primary saturation
  const sS = sP * 0.48                      // secondary saturation
  const sN = Math.max(4, sP * 0.16)         // neutral tint
  const T = (l, sat = sN) => tone(h, sat, l)

  const error = dark
    ? {
        error: '#F2B8B5', 'on-error': '#601410',
        'error-container': '#8C1D18', 'on-error-container': '#F9DEDC',
      }
    : {
        error: '#B3261E', 'on-error': '#FFFFFF',
        'error-container': '#F9DEDC', 'on-error-container': '#410E0B',
      }

  if (dark) {
    return {
      ...error,
      primary: T(80, sP), 'on-primary': T(20, sP),
      'primary-container': T(30, sP), 'on-primary-container': T(90, sP),
      secondary: T(80, sS), 'secondary-container': T(30, sS),
      'on-secondary-container': T(90, sS),
      tertiary: tone(h + 60, sP * 0.5, 80),
      'tertiary-container': tone(h + 60, sP * 0.5, 30),
      surface: T(7), 'surface-dim': T(5),
      'surface-container-lowest': T(4), 'surface-container-low': T(10),
      'surface-container': T(12), 'surface-container-high': T(17),
      'surface-container-highest': T(22),
      'on-surface': T(91), 'on-surface-variant': T(80, sN * 2),
      outline: T(60, sN * 1.8), 'outline-variant': T(30, sN * 1.8),
      'inverse-surface': T(90), 'inverse-on-surface': T(20),
    }
  }

  return {
    ...error,
    primary: T(40, sP), 'on-primary': T(100, sP),
    'primary-container': T(90, sP), 'on-primary-container': T(12, sP),
    secondary: T(40, sS), 'secondary-container': T(90, sS),
    'on-secondary-container': T(12, sS),
    tertiary: tone(h + 60, sP * 0.5, 40),
    'tertiary-container': tone(h + 60, sP * 0.5, 90),
    surface: T(98), 'surface-dim': T(92),
    'surface-container-lowest': T(100, sN * 0.6), 'surface-container-low': T(97),
    'surface-container': T(95), 'surface-container-high': T(93),
    'surface-container-highest': T(91),
    'on-surface': T(11), 'on-surface-variant': T(30, sN * 2.4),
    outline: T(50, sN * 2), 'outline-variant': T(80, sN * 2),
    'inverse-surface': T(20), 'inverse-on-surface': T(95),
  }
}

function applyTheme() {
  const tokens = buildPalette(seed.value, mode.value === 'dark')
  const root = document.documentElement
  for (const [key, value] of Object.entries(tokens)) {
    root.style.setProperty(`--md-${key}`, value)
  }
  root.style.colorScheme = mode.value
}

function toggleMode() {
  mode.value = mode.value === 'dark' ? 'light' : 'dark'
}

function chooseSeed(hex) {
  seed.value = hex
  // Keep the palette open so users can compare and switch colors
  // without having to reopen the menu after every selection.
}

watch(mode, (value) => {
  writeStore(THEME_KEY, value)
  applyTheme()
})
watch(seed, (value) => {
  writeStore(ACCENT_KEY, value)
  applyTheme()
})

/* Apply synchronously before first paint */
applyTheme()

/* ------------------------------------------------------------------ */
/* Global keys + ripple                                                */
/* ------------------------------------------------------------------ */

function onKeydown(event) {
  if (event.key === 'Escape') {
    pendingDelete.value = null
    paletteOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  prefersDark?.addEventListener?.('change', (event) => {
    if (!readStore(THEME_KEY)) mode.value = event.matches ? 'dark' : 'light'
  })
})
onUnmounted(() => document.removeEventListener('keydown', onKeydown))

const vRipple = {
  mounted(el) {
    el.classList.add('has-ripple')
    el.addEventListener('pointerdown', (event) => {
      if (el.disabled) return
      const rect = el.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height) * 2.1
      const ripple = document.createElement('span')
      ripple.className = 'ripple'
      ripple.style.width = ripple.style.height = `${size}px`
      ripple.style.left = `${event.clientX - rect.left - size / 2}px`
      ripple.style.top = `${event.clientY - rect.top - size / 2}px`
      el.appendChild(ripple)
      ripple.addEventListener('animationend', () => ripple.remove())
    })
  },
}
</script>

<template>
  <div class="app">
    <div class="shell">
      <!-- ── Top app bar ─────────────────────────────────────────── -->
      <header class="topbar">
        <div class="brand">
          <span class="brand-mark msr fill" aria-hidden="true">task_alt</span>
          <span class="brand-name">Taskify by <a href="https://thio.cc.cd">Flessan</a></span>
        </div>

        <nav class="topbar-actions" aria-label="Appearance">
          <div class="palette-anchor">
            <button
              v-ripple
              type="button"
              class="icon-btn"
              :class="{ active: paletteOpen }"
              aria-haspopup="true"
              :aria-expanded="paletteOpen"
              aria-label="Choose theme color"
              @click="paletteOpen = !paletteOpen"
            >
              <span class="msr" aria-hidden="true">palette</span>
            </button>

            <Transition name="menu">
              <div v-if="paletteOpen" class="palette-menu" role="dialog" aria-label="Theme color">
                <p class="palette-title">Theme color</p>
                <div class="swatches">
                  <button
                    v-for="swatch in SEED_COLORS"
                    :key="swatch.hex"
                    v-ripple
                    type="button"
                    class="swatch"
                    :class="{ active: seed === swatch.hex }"
                    :style="{ background: swatch.hex }"
                    :aria-label="`${swatch.name} accent`"
                    :aria-pressed="seed === swatch.hex"
                    @click="chooseSeed(swatch.hex)"
                  >
                    <span v-if="seed === swatch.hex" class="msr" aria-hidden="true">check</span>
                  </button>
                </div>
                <p class="palette-note">Tones adapt to light &amp; dark automatically</p>
              </div>
            </Transition>
          </div>

          <button
            v-ripple
            type="button"
            class="icon-btn"
            :aria-label="mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'"
            @click="toggleMode"
          >
            <Transition name="spin" mode="out-in">
              <span class="msr" :key="mode" aria-hidden="true">
                {{ mode === 'dark' ? 'light_mode' : 'dark_mode' }}
              </span>
            </Transition>
          </button>
        </nav>
      </header>

      <!-- Click-away layer for the palette menu -->
      <div v-if="paletteOpen" class="menu-scrim" aria-hidden="true" @click="paletteOpen = false" />

      <!-- ── Hero / overview ─────────────────────────────────────── -->
      <section class="hero rise" style="--rise-delay: 0s">
        <span class="hero-mark msr fill" aria-hidden="true">task_alt</span>
        <div class="hero-body">
          <p class="eyebrow">Daily planner · {{ todayLabel }}</p>
          <h1 class="display">Get it<br />done.</h1>

          <div v-if="tasks.length" class="hero-progress">
            <div class="hero-progress-meta">
              <span class="msr hero-progress-icon" :class="{ celebrate: allDone }" aria-hidden="true">
                {{ allDone ? 'celebration' : 'pending_actions' }}
              </span>
              <span>
                {{ allDone ? 'All caught up - nice work!' : `${doneTasks} of ${tasks.length} done` }}
              </span>
              <strong aria-hidden="true">{{ progress }}%</strong>
            </div>
            <div
              class="hero-bar"
              role="progressbar"
              aria-label="List completion"
              :aria-valuemin="0"
              :aria-valuemax="tasks.length"
              :aria-valuenow="doneTasks"
            >
              <div class="hero-bar-fill" :style="{ width: `${progress}%` }" />
            </div>
          </div>

          <p v-else class="hero-hint">
            A fresh list. Add your first task below and start checking things off.
          </p>
        </div>
      </section>

      <!-- ── Composer ────────────────────────────────────────────── -->
      <form class="composer rise" style="--rise-delay: .08s" @submit.prevent="addTask">
        <div class="composer-row">
          <div class="field">
            <input
              id="task-input"
              v-model="taskInput"
              type="text"
              placeholder="What needs doing?"
              autocomplete="off"
              autofocus
            />
            <label for="task-input">New task</label>
          </div>
          <button
            v-ripple
            type="submit"
            class="btn-filled"
            :disabled="!taskInput.trim()"
          >
            <span class="msr" aria-hidden="true">add</span>
            Add task
          </button>
        </div>
        <p class="composer-hint">
          Press <kbd>Enter ↵</kbd> to add - tasks are saved to this browser automatically.
        </p>
      </form>

      <!-- ── Task list ───────────────────────────────────────────── -->
      <section class="list-section rise" style="--rise-delay: .16s" aria-labelledby="task-heading">
        <div class="section-head">
          <h2 id="task-heading">Your list</h2>
          <span class="chip" aria-live="polite">{{ taskCountLabel }}</span>
        </div>

        <div v-if="tasks.length === 0" class="empty">
          <span class="empty-glyph msr fill" aria-hidden="true">task_alt</span>
          <h3>Nothing here yet</h3>
          <p>Add the next thing.</p>
        </div>

        <TransitionGroup v-else name="list" tag="ul" class="task-list">
          <li
            v-for="task in tasks"
            :key="task.id"
            class="task"
            :class="{ done: task.isDone }"
          >
            <label class="check">
              <input
                v-model="task.isDone"
                type="checkbox"
                :aria-label="`Mark ${task.title} as done`"
              />
              <span class="box" aria-hidden="true">
                <svg viewBox="0 0 12 10">
                  <path d="M1 5.5 4.2 8.7 11 1.5" />
                </svg>
              </span>
            </label>

            <span class="task-title">{{ task.title }}</span>

            <button
              v-ripple
              type="button"
              class="icon-btn delete"
              :aria-label="`Delete ${task.title}`"
              @click="askRemove(task)"
            >
              <span class="msr" aria-hidden="true">delete</span>
            </button>
          </li>
        </TransitionGroup>
      </section>

      <!-- ── Footer ──────────────────────────────────────────────── -->
      <footer class="footer rise" style="--rise-delay: .24s">
        <span class="msr" aria-hidden="true">storage</span>
        <p>Tasks live in your browser's local storage - private by default.</p>
      </footer>
    </div>

    <!-- ── Delete confirmation dialog ────────────────────────────── -->
    <Transition name="dialog">
      <div v-if="pendingDelete" class="scrim" @click.self="cancelRemove">
        <div
          class="md-dialog"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          aria-describedby="dialog-body"
        >
          <span class="md-dialog-icon msr" aria-hidden="true">delete</span>
          <h3 id="dialog-title">Delete this task?</h3>
          <p id="dialog-body">
            &ldquo;{{ pendingDelete.title }}&rdquo; will be removed from your list. This can't be undone.
          </p>
          <div class="md-dialog-actions">
            <button ref="cancelBtn" v-ripple type="button" class="btn-text" @click="cancelRemove">
              Cancel
            </button>
            <button v-ripple type="button" class="btn-text danger" @click="confirmRemove">
              Delete
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<!-- ─── Global: fonts, resets, tokens, ripple ─────────────────────── -->
<style>
@import url('https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wght@8..144,200..1000&family=Roboto:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block');

/* Fallback tokens (Iris / light) - JS overwrites these on setup */
:root {
  --md-primary: hsl(131, 34%, 40%);
  --md-on-primary: hsl(256 34% 100%);
  --md-primary-container: hsl(256 34% 90%);
  --md-on-primary-container: hsl(256 34% 12%);
  --md-secondary-container: hsl(256 16% 90%);
  --md-on-secondary-container: hsl(256 16% 12%);
  --md-tertiary-container: hsl(316 17% 90%);
  --md-surface: hsl(256 5% 98%);
  --md-surface-dim: hsl(256 5% 92%);
  --md-surface-container-lowest: hsl(256 5% 100%);
  --md-surface-container-low: hsl(256 5% 97%);
  --md-surface-container: hsl(256 5% 95%);
  --md-surface-container-high: hsl(256 5% 93%);
  --md-surface-container-highest: hsl(256 5% 91%);
  --md-on-surface: hsl(256 5% 11%);
  --md-on-surface-variant: hsl(256 13% 30%);
  --md-outline: hsl(256 11% 50%);
  --md-outline-variant: hsl(256 11% 80%);
  --md-error: #b3261e;
  --md-on-error: #fff;
  --md-error-container: #f9dedc;
  --md-on-error-container: #410e0b;
  color-scheme: light;
}

*,
*::before,
*::after { box-sizing: border-box; }

html { scroll-behavior: smooth; }

body {
  margin: 0;
  min-height: 100vh;
  font-family: 'Roboto', system-ui, -apple-system, sans-serif;
  font-size: 16px;
  color: var(--md-on-surface);
  background:
    radial-gradient(1100px 520px at 85% -8%, color-mix(in srgb, var(--md-primary) 15%, transparent), transparent 65%),
    radial-gradient(900px 480px at -12% 110%, color-mix(in srgb, var(--md-tertiary-container) 34%, transparent), transparent 62%),
    var(--md-surface);
  background-attachment: fixed;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  transition: color 0.35s ease;
}

::selection {
  background: color-mix(in srgb, var(--md-primary) 30%, transparent);
}

::-webkit-scrollbar { width: 10px; }
::-webkit-scrollbar-thumb {
  background: var(--md-outline-variant);
  border-radius: 999px;
  border: 2px solid transparent;
  background-clip: content-box;
}
::-webkit-scrollbar-track { background: transparent; }

:focus-visible {
  outline: 2px solid var(--md-primary);
  outline-offset: 2px;
}

/* Material Symbols */
.msr {
  font-family: 'Material Symbols Rounded';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  user-select: none;
  font-variation-settings: 'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 24;
}
.msr.fill { font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24; }

/* Ripple (injected dynamically → must be unscoped) */
.has-ripple { position: relative; overflow: hidden; }
.ripple {
  position: absolute;
  border-radius: 50%;
  background: currentColor;
  pointer-events: none;
  transform: scale(0);
  animation: ripple-grow 0.55s cubic-bezier(0.2, 0, 0, 1) forwards;
}
@keyframes ripple-grow {
  from { transform: scale(0); opacity: 0.16; }
  to   { transform: scale(1); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  html { scroll-behavior: auto; }
}
</style>

<!-- ─── Component styles ──────────────────────────────────────────── -->
<style scoped>
/* Shared surfaces & motion */
.app { min-height: 100vh; }

.shell {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 clamp(16px, 4vw, 28px) 48px;
}

.rise { animation: rise 0.55s cubic-bezier(0.05, 0.7, 0.1, 1) both; animation-delay: var(--rise-delay, 0s); }
@keyframes rise {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Top app bar ─────────────────────────────────────────────────── */
.topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-radius: 23px;
  padding: 12px 11px;
  background: var(--md-surface);
  border-bottom: 1px solid color-mix(in srgb, var(--md-outline-variant) 55%, transparent);
  transition: background 0.35s ease;
}

.brand { display: flex; align-items: center; gap: 12px; min-width: 0; }

.brand-mark {
  width: 40px;
  height: 40px;
  flex: none;
  display: grid;
  place-items: center;
  font-size: 22px;
  border-radius: 14px;
  background: var(--md-primary);
  color: var(--md-on-primary);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.25);
  transition: background 0.35s ease, transform 0.2s ease;
}
.brand:hover .brand-mark { transform: rotate(-6deg) scale(1.05); }

.brand-name {
  font-family: 'Roboto Flex', 'Roboto', sans-serif;
  font-weight: 700;
  font-size: 19px;
  letter-spacing: -0.2px;
}

.topbar-actions { display: flex; align-items: center; gap: 4px; }

.palette-anchor { position: relative; }

.icon-btn {
  width: 44px;
  height: 44px;
  flex: none;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--md-on-surface-variant);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, transform 0.15s ease;
}
.icon-btn:hover {
  background: color-mix(in srgb, var(--md-on-surface) 8%, transparent);
  color: var(--md-on-surface);
}
.icon-btn:active { transform: scale(0.92); background: color-mix(in srgb, var(--md-on-surface) 12%, transparent); }
.icon-btn.active { background: var(--md-secondary-container); color: var(--md-on-secondary-container); }

/* Palette menu */
.menu-scrim {
  position: fixed;
  inset: 0;
  z-index: 40;
}

.palette-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 10px);
  z-index: 50;
  width: min(292px, calc(100vw - 32px));
  padding: 18px;
  border-radius: 20px;
  background: var(--md-surface-container);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.3), 0 2px 6px 2px rgb(0 0 0 / 0.15);
  transform-origin: top right;
}
.palette-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.1px;
}
.swatches {
  display: grid;
  grid-template-columns: repeat(3, minmax(52px, 1fr));
  gap: 12px;
}
.swatch {
  width: 52px;
  height: 52px;
  min-width: 52px;
  min-height: 52px;
  justify-self: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  display: grid;
  place-items: center;
  cursor: pointer;
  color: #fff;
  touch-action: manipulation;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.25);
  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.18s ease;
}
.swatch .msr { font-size: 21px; }
.swatch:hover { transform: scale(1.08); }
.swatch:active { transform: scale(0.96); }
.swatch.active {
  box-shadow: 0 0 0 2px var(--md-surface-container), 0 0 0 4px var(--md-primary);
  transform: scale(1.05);
}
.palette-note {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--md-on-surface-variant);
}

.menu-enter-active, .menu-leave-active { transition: opacity 0.16s ease, transform 0.16s cubic-bezier(0.2, 0, 0, 1); }
.menu-enter-from, .menu-leave-to { opacity: 0; transform: scale(0.92); }

.spin-enter-active, .spin-leave-active { transition: opacity 0.18s ease, transform 0.25s cubic-bezier(0.34, 1.4, 0.64, 1); }
.spin-enter-from { opacity: 0; transform: rotate(-90deg) scale(0.6); }
.spin-leave-to   { opacity: 0; transform: rotate(90deg) scale(0.6); }

/* ── Hero ────────────────────────────────────────────────────────── */
.hero {
  position: relative;
  overflow: hidden;
  margin-top: 16px;
  padding: clamp(24px, 5vw, 40px);
  border-radius: 32px;
  background: var(--md-primary-container);
  color: var(--md-on-primary-container);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.1);
  transition: background 0.35s ease, color 0.35s ease;
}

.hero-mark {
  position: absolute;
  right: -26px;
  bottom: -52px;
  font-size: 190px;
  opacity: 0.1;
  transform: rotate(-8deg);
  pointer-events: none;
}

.hero-body { position: relative; }

.eyebrow {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  opacity: 0.75;
}

.display {
  margin: 14px 0 0;
  font-family: 'Roboto Flex', 'Roboto', sans-serif;
  font-weight: 820;
  font-size: clamp(42px, 8vw, 62px);
  line-height: 0.98;
  letter-spacing: -1.5px;
}

.hero-progress { margin-top: clamp(20px, 4vw, 32px); max-width: 480px; }

.hero-progress-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
}
.hero-progress-meta strong { margin-left: auto; font-weight: 700; }
.hero-progress-icon { font-size: 18px; }
.hero-progress-icon.celebrate { animation: celebrate-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes celebrate-pop {
  0%   { transform: scale(0.4) rotate(-20deg); }
  60%  { transform: scale(1.25) rotate(8deg); }
  100% { transform: scale(1) rotate(0); }
}

.hero-bar {
  margin-top: 10px;
  height: 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--md-on-primary-container) 22%, transparent);
  overflow: hidden;
}
.hero-bar-fill {
  height: 100%;
  border-radius: inherit;
  background: var(--md-on-primary-container);
  transition: width 0.5s cubic-bezier(0.2, 0, 0, 1);
}

.hero-hint {
  margin: clamp(18px, 3vw, 28px) 0 0;
  max-width: 420px;
  font-size: 15px;
  line-height: 1.5;
  opacity: 0.85;
}

/* ── Composer ────────────────────────────────────────────────────── */
.composer { margin-top: 24px; }

.composer-row { display: flex; gap: 12px; align-items: stretch; }

.field {
  flex: 1;
  position: relative;
  min-width: 0;
  border-radius: 16px;
  background: var(--md-surface-container-highest);
  transition: background 0.25s ease;
}
.field:hover { background: color-mix(in srgb, var(--md-surface-container-highest) 82%, var(--md-on-surface)); }
.field:focus-within { background: var(--md-surface-container-highest); }

.field input {
  width: 100%;
  height: 58px;
  padding: 22px 16px 6px;
  border: 0;
  border-radius: 16px;
  background: transparent;
  font: 500 16px/1.4 'Roboto', sans-serif;
  color: var(--md-on-surface);
  outline: none;
  caret-color: var(--md-primary);
}
.field input::placeholder { color: transparent; }
.field:focus-within input::placeholder { color: var(--md-on-surface-variant); opacity: 0.7; }

.field label {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  color: var(--md-on-surface-variant);
  pointer-events: none;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
}
.field:focus-within label,
.field input:not(:placeholder-shown) ~ label {
  top: 9px;
  transform: translateY(0);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.2px;
}
.field:focus-within label { color: var(--md-primary); }

.field::after {
  content: '';
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 0;
  height: 2px;
  border-radius: 2px 2px 0 0;
  background: var(--md-primary);
  transform: scaleX(0);
  transition: transform 0.28s cubic-bezier(0.2, 0, 0, 1);
}
.field:focus-within::after { transform: scaleX(1); }

.btn-filled {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 58px;
  padding: 0 26px;
  flex: none;
  border: 0;
  border-radius: 999px;
  background: var(--md-primary);
  color: var(--md-on-primary);
  font: 600 15px/1 'Roboto', sans-serif;
  letter-spacing: 0.2px;
  cursor: pointer;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.2);
  transition: box-shadow 0.2s ease, background 0.25s ease, transform 0.15s ease, filter 0.2s ease;
}
.btn-filled .msr { font-size: 20px; transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
.btn-filled:hover:not(:disabled) {
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.3), 0 2px 6px 2px rgb(0 0 0 / 0.12);
  filter: brightness(1.06);
}
.btn-filled:hover:not(:disabled) .msr { transform: rotate(90deg); }
.btn-filled:active:not(:disabled) { transform: scale(0.97); }
.btn-filled:disabled {
  background: color-mix(in srgb, var(--md-on-surface) 12%, transparent);
  color: color-mix(in srgb, var(--md-on-surface) 38%, transparent);
  box-shadow: none;
  cursor: not-allowed;
}

.composer-hint {
  margin: 10px 4px 0;
  font-size: 12.5px;
  color: var(--md-on-surface-variant);
}
.composer-hint kbd {
  font: 600 11px/1 'Roboto', sans-serif;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid var(--md-outline-variant);
  border-bottom-width: 2px;
  background: var(--md-surface-container);
  color: var(--md-on-surface);
}

/* ── List section ────────────────────────────────────────────────── */
.list-section { margin-top: 36px; }

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.section-head h2 {
  margin: 0;
  font-family: 'Roboto Flex', 'Roboto', sans-serif;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.3px;
}

.chip {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 14px;
  border-radius: 8px;
  background: var(--md-secondary-container);
  color: var(--md-on-secondary-container);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.2px;
  transition: background 0.35s ease;
}

.task-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
}

.task {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 13px 12px 13px 16px;
  border-radius: 16px;
  background: var(--md-surface-container-low);
  transition: background 0.25s ease, opacity 0.25s ease;
}
.task:hover { background: var(--md-surface-container); }
.task.done { background: color-mix(in srgb, var(--md-surface-container-low) 55%, transparent); }

.task-title {
  flex: 1;
  min-width: 0;
  font-size: 16px;
  line-height: 24px;
  overflow-wrap: anywhere;
  background-image: linear-gradient(var(--md-on-surface-variant), var(--md-on-surface-variant));
  background-repeat: no-repeat;
  background-position: 0 60%;
  background-size: 0% 1.5px;
  transition: background-size 0.3s ease, color 0.25s ease;
}
.task.done .task-title {
  color: var(--md-on-surface-variant);
  background-size: 100% 1.5px;
}

/* Checkbox */
.check { position: relative; width: 22px; height: 22px; flex: none; }
.check input {
  position: absolute;
  inset: -6px;           /* generous hit target */
  margin: 0;
  opacity: 0;
  cursor: pointer;
}
.check .box {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  border: 2px solid var(--md-on-surface-variant);
  border-radius: 6px;
  transition: background 0.18s ease, border-color 0.18s ease;
}
.check input:checked ~ .box {
  background: var(--md-primary);
  border-color: var(--md-primary);
  animation: check-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes check-pop {
  0%   { transform: scale(0.8); }
  55%  { transform: scale(1.12); }
  100% { transform: scale(1); }
}
.check .box svg {
  width: 12px;
  height: 10px;
  fill: none;
  stroke: var(--md-on-primary);
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 15;
  stroke-dashoffset: 15;
  transition: stroke-dashoffset 0.22s ease 0.04s;
}
.check input:checked ~ .box svg { stroke-dashoffset: 0; }
.check input:focus-visible ~ .box {
  border-color: var(--md-primary);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--md-primary) 30%, transparent);
}

/* Delete button */
.task .delete {
  opacity: 0;
  transform: scale(0.85);
}
.task:hover .delete,
.task:focus-within .delete { opacity: 1; transform: scale(1); }
.task .delete:hover {
  background: color-mix(in srgb, var(--md-error) 10%, transparent);
  color: var(--md-error);
}
@media (hover: none) {
  .task .delete { opacity: 1; transform: none; }
}

/* List transitions */
.list-move { transition: transform 0.35s cubic-bezier(0.2, 0, 0, 1); }
.list-enter-active { transition: opacity 0.3s ease, transform 0.35s cubic-bezier(0.05, 0.7, 0.1, 1); }
.list-enter-from { opacity: 0; transform: translateY(14px) scale(0.97); }
.list-leave-active {
  position: absolute;
  left: 0;
  right: 0;
  transition: opacity 0.2s ease, transform 0.25s cubic-bezier(0.4, 0, 1, 1);
}
.list-leave-to { opacity: 0; transform: translateX(28px) scale(0.96); }

/* Empty state */
.empty {
  padding: 48px 24px;
  text-align: center;
  border: 1.5px dashed var(--md-outline-variant);
  border-radius: 28px;
  color: var(--md-on-surface-variant);
}
.empty-glyph {
  display: grid;
  place-items: center;
  width: 88px;
  height: 88px;
  margin: 0 auto 18px;
  font-size: 42px;
  border-radius: 28px;
  background: var(--md-primary-container);
  color: var(--md-on-primary-container);
  animation: float 5s ease-in-out infinite;
}
@keyframes float {
  50% { transform: translateY(-7px); }
}
.empty h3 {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 600;
  color: var(--md-on-surface);
}
.empty p { margin: 0; font-size: 14.5px; }

/* ── Footer ──────────────────────────────────────────────────────── */
.footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 44px;
  font-size: 12.5px;
  color: var(--md-on-surface-variant);
}
.footer .msr { font-size: 16px; }
.footer p { margin: 0; }

/* ── Dialog ──────────────────────────────────────────────────────── */
.scrim {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 24px;
  background: color-mix(in srgb, var(--md-on-surface) 32%, transparent);
}

.md-dialog {
  width: min(460px, 100%);
  padding: 24px;
  border-radius: 28px;
  background: var(--md-surface-container-high);
  box-shadow: 0 4px 8px 3px rgb(0 0 0 / 0.15), 0 1px 3px rgb(0 0 0 / 0.3);
}
.md-dialog-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
  border-radius: 50%;
  background: var(--md-error-container);
  color: var(--md-on-error-container);
}
.md-dialog h3 {
  margin: 0 0 10px;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.2px;
}
.md-dialog p {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.55;
  color: var(--md-on-surface-variant);
}
.md-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
}

.btn-text {
  height: 40px;
  padding: 0 18px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--md-primary);
  font: 600 14px/1 'Roboto', sans-serif;
  letter-spacing: 0.1px;
  cursor: pointer;
  transition: background 0.2s ease;
}
.btn-text:hover { background: color-mix(in srgb, var(--md-primary) 8%, transparent); }
.btn-text:active { background: color-mix(in srgb, var(--md-primary) 12%, transparent); }
.btn-text.danger { color: var(--md-error); }
.btn-text.danger:hover { background: color-mix(in srgb, var(--md-error) 8%, transparent); }
.btn-text.danger:active { background: color-mix(in srgb, var(--md-error) 12%, transparent); }

.dialog-enter-active, .dialog-leave-active { transition: opacity 0.25s ease; }
.dialog-enter-active .md-dialog, .dialog-leave-active .md-dialog {
  transition: transform 0.3s cubic-bezier(0.05, 0.7, 0.1, 1), opacity 0.2s ease;
}
.dialog-enter-from, .dialog-leave-to { opacity: 0; }
.dialog-enter-from .md-dialog, .dialog-leave-to .md-dialog {
  opacity: 0;
  transform: scale(0.92) translateY(10px);
}

/* ── Responsive ──────────────────────────────────────────────────── */
@media (max-width: 560px) {
  .composer-row { flex-direction: column; }
  .btn-filled { width: 100%; height: 54px; }
  .hero { border-radius: 26px; }
  .hero-mark { font-size: 140px; right: -30px; }
  .palette-menu { width: min(292px, calc(100vw - 24px)); }
}

@media (min-width: 1200px) {
  .shell { max-width: 760px; }
}
</style>