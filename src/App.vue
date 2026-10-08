<script setup>
import { computed, ref, watch } from 'vue'

const STORAGE_KEY = 'taskify-tasks'

const loadTasks = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

const tasks = ref(loadTasks())
const taskInput = ref('')

const remainingTasks = computed(
  () => tasks.value.filter((task) => !task.isDone).length,
)

const taskCountLabel = computed(
  () => `${remainingTasks.value} ${remainingTasks.value === 1 ? 'task' : 'tasks'} left`,
)

watch(
  tasks,
  (value) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  },
  { deep: true },
)

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

function toggleTask(task) {
  task.isDone = !task.isDone
}

function removeTask(task) {
  if (!window.confirm(`Delete "${task.title}"?`)) return
  tasks.value = tasks.value.filter(({ id }) => id !== task.id)
}
</script>

<template>
  <main class="app-shell">
    <header class="site-header">
      <p class="eyebrow">Taskify / Daily planner</p>
      <h1>Get it<br />done.</h1>
    </header>

    <form class="task-form" @submit.prevent="addTask">
      <label for="task-input">New task</label>
      <div class="input-row">
        <input
          id="task-input"
          v-model="taskInput"
          type="text"
          placeholder="What needs doing?"
          autocomplete="off"
          autofocus
        />
        <button type="submit">+ Add task</button>
      </div>
    </form>

    <section class="task-section" aria-labelledby="task-heading">
      <div class="section-heading">
        <h2 id="task-heading">Your list</h2>
        <span>{{ taskCountLabel }}</span>
      </div>

      <p v-if="tasks.length === 0" class="empty-state">
        Nothing here yet. Add the next thing.
      </p>

      <ul v-else class="task-list">
        <li v-for="task in tasks" :key="task.id" class="task-item">
          <label class="task-label">
            <input
              v-model="task.isDone"
              type="checkbox"
              :aria-label="`Mark ${task.title} as done`"
            />
            <span :class="{ done: task.isDone }">{{ task.title }}</span>
          </label>

          <button
            type="button"
            class="delete-button"
            @click="removeTask(task)"
          >
            Delete
          </button>
        </li>
      </ul>
    </section>
  </main>
</template>
