class TodoApp {
    constructor() {
        this.tasks = [];
        this.loadTasks();
        this.initializeUI();
        this.updateUI();
    }

    // UI元素初始化
    initializeUI() {
        this.taskInput = document.getElementById('newTaskInput');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.taskList = document.getElementById('taskList');
        
        // 绑定事件处理器
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
    }

    // 从LocalStorage加载任务
    loadTasks() {
        const savedTasks = localStorage.getItem('tasks');
        this.tasks = savedTasks ? JSON.parse(savedTasks) : [];
    }

    // 保存任务到LocalStorage
    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    // 添加新任务
    addTask() {
        const content = this.taskInput.value.trim();
        if (!content) return;

        const task = {
            id: crypto.randomUUID(),
            content: content,
            createdAt: Date.now(),
            completed: false,
            tags: []
        };

        this.tasks.push(task);
        this.saveTasks();
        this.updateUI();
        this.taskInput.value = '';
    }

    // 删除任务
    deleteTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        this.saveTasks();
        this.updateUI();
    }

    // 切换任务状态
    toggleTask(taskId) {
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.updateUI();
        }
    }

    // 更新任务统计
    updateStatistics() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        const pending = total - completed;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('pendingTasks').textContent = pending;
    }

    // 创建任务项HTML
    createTaskElement(task) {
        return `
            <div class="task-item" data-task-id="${task.id}">
                <input type="checkbox" class="task-checkbox" 
                       ${task.completed ? 'checked' : ''}>
                <span class="task-content ${task.completed ? 'completed' : ''}">
                    ${this.escapeHtml(task.content)}
                </span>
                <div class="task-actions">
                    <button class="btn-delete">❌</button>
                </div>
            </div>
        `;
    }

    // HTML转义
    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // 更新整个UI
    updateUI() {
        // 更新任务列表
        this.taskList.innerHTML = this.tasks
            .sort((a, b) => b.createdAt - a.createdAt)
            .map(task => this.createTaskElement(task))
            .join('');

        // 绑定任务项事件
        this.taskList.querySelectorAll('.task-item').forEach(item => {
            const taskId = item.dataset.taskId;
            
            // 复选框状态切换
            item.querySelector('.task-checkbox').addEventListener('change', () => {
                this.toggleTask(taskId);
            });

            // 删除按钮
            item.querySelector('.btn-delete').addEventListener('click', () => {
                this.deleteTask(taskId);
            });
        });

        // 更新统计信息
        this.updateStatistics();
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.todoApp = new TodoApp();
});