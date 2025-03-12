class TodoApp {
    constructor() {
        this.tasks = [];
        this.tags = [];
        this.selectedTags = [];
        this.charts = {};
        this.initializeTags();
        this.loadTasks();
        this.initializeUI();
        this.initializeCharts();
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
        // 任务相关元素
        this.taskInput = document.getElementById('newTaskInput');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.taskList = document.getElementById('taskList');
        this.tagSelector = document.getElementById('tagSelector');

        // 标签管理相关元素
        this.newTagInput = document.getElementById('newTagInput');
        this.newTagColor = document.getElementById('newTagColor');
        this.addTagBtn = document.getElementById('addTagBtn');
        this.tagList = document.getElementById('tagList');
        this.tagValidationError = document.getElementById('tagValidationError');
        
        // 绑定任务相关事件
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // 绑定标签相关事件
        this.addTagBtn.addEventListener('click', () => this.addTag());
        this.newTagInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addTag();
            }
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

    // 初始化图表
    initializeCharts() {
        // 初始化完成率环形图
        const completionCtx = document.getElementById('completionChart').getContext('2d');
        this.charts.completion = new Chart(completionCtx, {
            type: 'doughnut',
            data: {
                labels: ['已完成', '未完成'],
                datasets: [{
                    data: [0, 0],
                    backgroundColor: ['#4CAF50', '#FFA726']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                cutout: '70%'
            }
        });

        // 初始化标签统计图
        const tagCtx = document.getElementById('tagChart').getContext('2d');
        this.charts.tag = new Chart(tagCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: '任务数',
                    data: [],
                    backgroundColor: []
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    // 计算标签维度统计
    calculateTagStats() {
        const tagStats = new Map();
        
        // 初始化每个标签的统计
        this.tags.forEach(tag => {
            tagStats.set(tag.id, {
                name: tag.name,
                color: tag.color,
                count: 0
            });
        });

        // 统计每个标签的任务数
        this.tasks.forEach(task => {
            task.tags.forEach(tagId => {
                if (tagStats.has(tagId)) {
                    tagStats.get(tagId).count++;
                }
            });
        });

        // 转换为数组并按任务数排序
        return Array.from(tagStats.values())
            .filter(stat => stat.count > 0)
            .sort((a, b) => b.count - a.count);
    }

    // 更新任务统计
    updateStatistics() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        const pending = total - completed;

        // 更新数字统计
        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('pendingTasks').textContent = pending;

        // 更新完成率图表
        if (this.charts.completion) {
            this.charts.completion.data.datasets[0].data = [completed, pending];
            this.charts.completion.update();
        }

        // 更新标签统计图表
        if (this.charts.tag) {
            const tagStats = this.calculateTagStats();
            this.charts.tag.data.labels = tagStats.map(stat => stat.name);
            this.charts.tag.data.datasets[0].data = tagStats.map(stat => stat.count);
            this.charts.tag.data.datasets[0].backgroundColor = tagStats.map(stat => stat.color);
            this.charts.tag.update();
        }
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

    // 验证标签数据
    validateTag(name, color, id = null) {
        // 清除之前的错误信息
        this.tagValidationError.textContent = '';
        this.tagValidationError.classList.add('d-none');

        // 验证标签名称
        if (!name || name.trim().length === 0) {
            this.showTagError('标签名称不能为空');
            return false;
        }

        if (name.trim().length > 10) {
            this.showTagError('标签名称不能超过10个字符');
            return false;
        }

        // 验证标签名称唯一性
        const nameExists = this.tags.some(tag =>
            tag.name === name.trim() && (!id || tag.id !== id)
        );
        if (nameExists) {
            this.showTagError('标签名称已存在');
            return false;
        }

        // 验证颜色格式
        const colorRegex = /^#[0-9A-Fa-f]{6}$/;
        if (!colorRegex.test(color)) {
            this.showTagError('无效的颜色格式');
            return false;
        }

        return true;
    }

    // 显示标签错误信息
    showTagError(message) {
        this.tagValidationError.textContent = message;
        this.tagValidationError.classList.remove('d-none');
    }

    // 添加新标签
    addTag() {
        const name = this.newTagInput.value.trim();
        const color = this.newTagColor.value;

        if (!this.validateTag(name, color)) {
            return;
        }

        const tag = {
            id: crypto.randomUUID(),
            name: name,
            color: color,
            isPreset: false
        };

        this.tags.push(tag);
        this.saveTags();
        this.updateTagsList();
        this.initializeTagSelector();

        // 重置输入
        this.newTagInput.value = '';
        this.newTagColor.value = '#FF6B6B';
    }

    // 编辑标签
    editTag(id) {
        const tag = this.getTagById(id);
        if (!tag || tag.isPreset) return;

        const listItem = document.querySelector(`[data-tag-id="${id}"]`);
        const tagName = listItem.querySelector('.tag-name').textContent;
        const tagColor = tag.color;

        // 创建编辑表单
        listItem.innerHTML = `
            <form class="tag-edit-form">
                <input type="text" class="form-control" value="${this.escapeHtml(tagName)}" required>
                <input type="color" class="form-control form-control-color" value="${tagColor}">
                <button type="submit" class="btn btn-sm btn-success">保存</button>
                <button type="button" class="btn btn-sm btn-secondary">取消</button>
            </form>
        `;

        const form = listItem.querySelector('form');
        const cancelBtn = form.querySelector('.btn-secondary');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const newName = form.querySelector('input[type="text"]').value;
            const newColor = form.querySelector('input[type="color"]').value;

            if (this.validateTag(newName, newColor, id)) {
                tag.name = newName;
                tag.color = newColor;
                this.saveTags();
                this.updateTagsList();
                this.initializeTagSelector();
                this.updateUI();
            }
        });

        cancelBtn.addEventListener('click', () => {
            this.updateTagsList();
        });
    }

    // 删除标签
    deleteTag(id) {
        const tag = this.getTagById(id);
        if (!tag || tag.isPreset) return;

        // 从任务中移除该标签
        this.tasks.forEach(task => {
            const index = task.tags.indexOf(id);
            if (index !== -1) {
                task.tags.splice(index, 1);
            }
        });

        // 从标签列表中移除
        this.tags = this.tags.filter(t => t.id !== id);
        
        this.saveTags();
        this.saveTasks();
        this.updateTagsList();
        this.initializeTagSelector();
        this.updateUI();
    }

    // 创建标签列表项
    createTagListItem(tag) {
        return `
            <div class="list-group-item tag-list-item" data-tag-id="${tag.id}">
                <div class="tag-color-preview" style="background-color: ${tag.color}"></div>
                <span class="tag-name">${this.escapeHtml(tag.name)}</span>
                ${tag.isPreset ? '<span class="preset-tag-badge">预设</span>' : ''}
                <div class="tag-actions">
                    ${tag.isPreset ? '' : `
                        <button class="btn btn-sm btn-outline-primary edit-tag-btn">编辑</button>
                        <button class="btn btn-sm btn-outline-danger delete-tag-btn">删除</button>
                    `}
                </div>
            </div>
        `;
    }

    // 更新标签列表
    updateTagsList() {
        this.tagList.innerHTML = this.tags
            .map(tag => this.createTagListItem(tag))
            .join('');

        // 绑定编辑和删除按钮事件
        this.tagList.querySelectorAll('.edit-tag-btn').forEach(btn => {
            const listItem = btn.closest('.tag-list-item');
            btn.addEventListener('click', () => {
                this.editTag(listItem.dataset.tagId);
            });
        });

        this.tagList.querySelectorAll('.delete-tag-btn').forEach(btn => {
            const listItem = btn.closest('.tag-list-item');
            btn.addEventListener('click', () => {
                if (confirm('确定要删除这个标签吗？这将同时从所有任务中移除该标签。')) {
                    this.deleteTag(listItem.dataset.tagId);
                }
            });
        });
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
        this.updateTagsList();
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.todoApp = new TodoApp();
});