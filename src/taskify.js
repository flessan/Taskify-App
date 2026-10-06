
// Object Utama
const Taskify = {
    tasks: [],
    displayTasks: function () {
        // menampilkan task ke dalam console
        console.table(this.tasks)

        // reset task list
        taskList.innerHTML = ''

        // for each
        this.tasks.forEach(task => {
            // bikin element task list
            const list = `
                <li class="flex items-center justify-between border-b border-gray-300 py-2">
                    <div>
                        <input type="checkbox" class="mr-2" />
                        <span>${ task.title }</span>
                    </div>
                    <button class="bg-red-500 text-white rounded-md p-1">Delete</button>
                </li>
            `

            // inject ke dalam task list
            taskList.insertAdjacentHTML('beforeend', list)
        })
    },
    addTask: function (title) {
        // menambahkan task ke dalam array tasks
        const task = {
            id: this.tasks.length + 1,
            title: title,
            isDone: false
        }

        this.tasks.push(task)
    },
    toggleTask: function (id) {
        // mencari task berdasarkan id
        const task = this.tasks.find(task => task.id === id)

        if (!task) return alert(`Task dengan id ${id} tidak ditemukan!`)

        // mengubah status isDone dari task
        task.isDone = !task.isDone
    },
    removeTask: function (id) {
        // mencari index task berdasarkan id
        const index = this.tasks.findIndex(task => task.id === id)

        if (index === -1) return alert(`Task dengan id ${id} tidak ditemukan!`)

        // menghapus task dari array tasks
        this.tasks.splice(index, 1)
    }
}

window.Taskify = Taskify

// Elements
const form = document.getElementById('form')
const taskInput = document.getElementById('task-input')
const taskList = document.getElementById('task-list')

// Event Listeners
form.addEventListener('submit', function (e) {

    e.preventDefault()

    // task title
    const title = taskInput.value.trim()

    if (!title) return alert('Task title tidak boleh kosong!')

    console.log(taskInput.value)

    // panggil Taskify.addTask untuk menambahkan task baru
    Taskify.addTask(title)

    // Panggil Taskify.displayTasks untuk menampilkan task baru
    Taskify.displayTasks()

    // reset input field
    taskInput.value = ''
})
