class TodoApp {
    constructor() {
        this.tasks = [];
        this.tags = [];
        this.selectedTags = [];
        this.initializeTags();
        this.loadTasks();
        this.initializeUI();
        this.updateUI();
    }

    // 初始化预设标签
    initializeTags() {
        const savedTags = localStorage.getItem('tags');
        if (savedTags) {
            this.tags = JSON.parse(savedTags);
        } else {
            // 预设标签
            this.tags = [
                { id: '1', name: '工作', color: '#FF6B6B', isPreset: true },
                { id: '2', name: '学习', color: '#4ECDC4', isPreset: true },
                { id: '3', name: '生活', color: '#45B7D1', isPreset: true },
                { id: '4', name: '重要', color: '#96CEB4', isPreset: true },
                { id: '5', name: '紧急', color: '#FFAD60', isPreset: true }
            ];
            this.saveTags();
        }
    }

    // 保存标签到LocalStorage
    saveTags() {
        localStorage.setItem('tags', JSON.stringify(this.tags));
    }

    // UI元素初始化
    initializeUI() {
        this.taskInput = document.getElementById('newTaskInput');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.taskList = document.getElementById('taskList');
        this.tagSelector = document.getElementById('tagSelector');
        
        // 绑定事件处理器
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // 初始化标签选择器
        this.initializeTagSelector();
    }

    // 初始化标签选择器
    initializeTagSelector() {
        this.tagSelector.innerHTML = this.tags
            .map(tag => this.createTagElement(tag))
            .join('');

        // 绑定标签点击事件
        this.tagSelector.querySelectorAll('.tag').forEach(tagElement => {
            tagElement.addEventListener('click', () => {
                const tagId = tagElement.dataset.tagId;
                this.toggleTagSelection(tagId, tagElement);
            });
        });
    }

    // 创建标签元素
    createTagElement(tag) {
        return `
            <div class="tag"
                 data-tag-id="${tag.id}"
                 style="background-color: ${tag.color}; color: white;">
                ${this.escapeHtml(tag.name)}
            </div>
        `;
    }

    // 切换标签选择状态
    toggleTagSelection(tagId, tagElement) {
        const index = this.selectedTags.indexOf(tagId);
        if (index === -1) {
            this.selectedTags.push(tagId);
            tagElement.classList.add('selected');
        } else {
            this.selectedTags.splice(index, 1);
            tagElement.classList.remove('selected');
        }
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
            tags: [...this.selectedTags]
        };

        this.tasks.push(task);
        this.saveTasks();
        this.updateUI();
        
        // 重置输入和标签选择
        this.taskInput.value = '';
        this.selectedTags = [];
        this.tagSelector.querySelectorAll('.tag').forEach(tag => {
            tag.classList.remove('selected');
        });
    }

    // 获取标签详情
    getTagById(tagId) {
        return this.tags.find(tag => tag.id === tagId);
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
        const tagElements = task.tags
            .map(tagId => {
                const tag = this.getTagById(tagId);
                if (!tag) return '';
                return `
                    <span class="task-tag"
                          style="background-color: ${tag.color}; color: white;">
                        ${this.escapeHtml(tag.name)}
                    </span>
                `;
            })
            .join('');

        return `
            <div class="task-item" data-task-id="${task.id}">
                <input type="checkbox" class="task-checkbox"
                       ${task.completed ? 'checked' : ''}>
                <div class="task-content-wrapper">
                    <span class="task-content ${task.completed ? 'completed' : ''}">
                        ${this.escapeHtml(task.content)}
                    </span>
                    <div class="task-tags">
                        ${tagElements}
                    </div>
                </div>
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