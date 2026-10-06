const Taskify = {
    tasks: [],
    nextId: 1,

    displayTasks() {
        taskList.innerHTML = '';

        this.tasks.forEach((task) => {
            const item = document.createElement('li');
            item.className =
                'flex items-center justify-between gap-4 border-2 border-black bg-white p-4';

            const label = document.createElement('label');
            label.className = 'flex min-w-0 items-center gap-3 font-bold cursor-pointer';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = task.isDone;
            checkbox.className =
                'size-5 shrink-0 accent-black cursor-pointer';
            checkbox.addEventListener('change', () => this.toggleTask(task.id));

            const title = document.createElement('span');
            title.textContent = task.title;
            title.className = task.isDone
                ? 'break-words text-neutral-500 line-through'
                : 'break-words';

            label.append(checkbox, title);

            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.textContent = 'Delete';
            deleteButton.className =
                'shrink-0 border-2 border-black bg-white px-3 py-2 text-xs font-black uppercase hover:bg-[#ff6b6b] focus:outline-none focus:ring-2 focus:ring-black';
            deleteButton.addEventListener('click', () => this.removeTask(task.id));

            item.append(label, deleteButton);
            taskList.append(item);
        });

        const taskCount = document.getElementById('task-count');
        if (taskCount) {
            const remaining = this.tasks.filter((task) => !task.isDone).length;
            taskCount.textContent = `${remaining} ${remaining === 1 ? 'task' : 'tasks'} left`;
        }
    },

    addTask(title) {
        this.tasks.push({
            id: this.nextId++,
            title,
            isDone: false,
        });

        this.displayTasks();
    },

    toggleTask(id) {
        const task = this.tasks.find((task) => task.id === id);
        if (!task) return;

        task.isDone = !task.isDone;
        this.displayTasks();
    },

    removeTask(id) {
        const task = this.tasks.find((task) => task.id === id);
        if (!task) return;

        if (!confirm(`Delete "${task.title}"?`)) return;

        this.tasks = this.tasks.filter((task) => task.id !== id);
        this.displayTasks();
    },
};

window.Taskify = Taskify;

const form = document.getElementById('form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');

form.addEventListener('submit', (event) => {
    event.preventDefault();

    const title = taskInput.value.trim();
    if (!title) {
        taskInput.focus();
        return;
    }

    Taskify.addTask(title);
    taskInput.value = '';
    taskInput.focus();
});