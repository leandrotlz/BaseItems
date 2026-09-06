class TabManager {
    constructor() {
        this.tabs = [];
        this.activeTabId = null;
        this.draggedTab = null;

        this.container = document.getElementById('tab-container');
        this.tabBar = this.container.querySelector('.tab-bar');
        this.contentWrapper = this.container.querySelector('.tab-content-wrapper');
        this.tabBar.addEventListener('dragover', (e) => this.handleDragOver(e));
    }

    addTab(id, title, content, canClose = true) {
        const existingTab = this.tabs.find(t => t.id === id);
        if (existingTab) {
            existingTab.contentElement.textContent = content;
            this.activateTab(id);
            return;
        }

        const tabBtn = document.createElement('div');
        tabBtn.className = 'tab-button';
        tabBtn.draggable = true;
        tabBtn.dataset.id = id;
        
        const titleSpan = document.createElement('span');
        titleSpan.className = 'tab-title';
        titleSpan.textContent = title;
        tabBtn.appendChild(titleSpan);

        if (canClose) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'tab-close';
            closeBtn.innerHTML = '&times;';
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeTab(id);
            });
            tabBtn.appendChild(closeBtn);
        }

        tabBtn.addEventListener('click', () => this.activateTab(id));
        tabBtn.addEventListener('dragstart', (e) => this.handleDragStart(e, tabBtn));
        tabBtn.addEventListener('dragend', () => this.handleDragEnd(tabBtn));

        const contentEl = document.createElement('pre');
        contentEl.className = 'tab-content hidden';
        contentEl.textContent = content;

        this.tabBar.appendChild(tabBtn);
        this.contentWrapper.appendChild(contentEl);

        this.tabs.push({ id, button: tabBtn, contentElement: contentEl });
        this.activateTab(id);

        this.container.classList.remove("hidden");
    }

    activateTab(id) {
        this.activeTabId = id;
        this.tabs.forEach(tab => {
            if (tab.id === id) {
                tab.button.classList.add('active');
                tab.contentElement.classList.remove('hidden');
            } else {
                tab.button.classList.remove('active');
                tab.contentElement.classList.add('hidden');
            }
        });
    }

    closeTab(id) {
        const index = this.tabs.findIndex(t => t.id === id);
        if (index === -1) return;

        const { button, contentElement } = this.tabs[index];
        button.remove();
        contentElement.remove();
        this.tabs.splice(index, 1);

        if (this.activeTabId === id) {
            if (this.tabs.length > 0) {
                const nextTab = this.tabs[Math.max(0, index - 1)];
                this.activateTab(nextTab.id);
            } else {
                this.activeTabId = null;
            }
        }

        if (this.tabs.length == 0) {
            this.container.classList.add("hidden");
        }
    }

    handleDragStart(e, tabBtn) {
        this.draggedTab = tabBtn;
        tabBtn.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    }

    handleDragEnd(tabBtn) {
        tabBtn.classList.remove('dragging');
        this.draggedTab = null;
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const targetTab = e.target.closest('.tab-button');
        if (targetTab && targetTab !== this.draggedTab) {
            const rect = targetTab.getBoundingClientRect();
            const midpoint = rect.left + rect.width / 2;
            if (e.clientX < midpoint) {
                this.tabBar.insertBefore(this.draggedTab, targetTab);
            } else {
                this.tabBar.insertBefore(this.draggedTab, targetTab.nextSibling);
            }
        }
    }
}

export const tabManager = new TabManager();
