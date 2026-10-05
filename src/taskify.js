// Object Utama
const Taskify = {
    tasks: [],
    displayTasks: function() {
        // menampilkan task ke dalam console
        console.table(this.tasks)
    },
    addTask: function(title) {
        // menambahkan task ke dalam array tasks
        const task = {
            id: this.tasks.length + 1,
            title: title,
            isDone: false
        }

        this.tasks.push(task)
    },
    toggleTask: function(id) {
        // mencari task berdasarkan id
        const task = this.tasks.find(task => task.id === id)

        if (!task) return alert(`Task dengan id ${id} tidak ditemukan!`)

        // mengubah status isDone dari task
        task.isDone = !task.isDone
    },
    removeTask: function(id) {
        // mencari index task berdasarkan id
        const index = this.tasks.findIndex(task => task.id === id)

        if (index === -1) return alert(`Task dengan id ${id} tidak ditemukan!`)

        // menghapus task dari array tasks
        this.tasks.splice(index, 1)
    }
}

window.Taskify = Taskify