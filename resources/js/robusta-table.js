export default function filamentRobustaTable({columns, resizedConfig}){
    return {
        columns,
        resizedConfig,
        maxColumnWidth: -1,
        minColumnWidth: 0,
        currentWidth: 0,
        tableContentSelector: '.fi-ta-content-ctn',
        tableSelector: '.fi-ta-table',
        tableHeaderSelector: '.fi-ta-header-cell-',
        tableCellSelector: '.fi-ta-cell-',
        handleBarClassName: 'column-resize-handle-bar',
        element: null,
        initialized: false,
        table: null,
        tableContent: null,
        tableKey: null,
        totalWidth: 0,

        init(){
            Livewire.hook("element.init", () => {
                if(this.initialized) return;

                this.checkAndInitialize();
            })

            Livewire.hook("morph.updated", () => {
                this.initialized = false;

                this.checkAndInitialize();
            })

            this.element = this.$el;

            this.$nextTick(() => this.checkAndInitialize());

            this.observeForTable();
        },

        observeForTable() {
            const observer = new MutationObserver(() => {
                if (!this.initialized) {
                    this.checkAndInitialize();
                }

                if (this.initialized) {
                    observer.disconnect();
                }
            });
            observer.observe(this.element, {
                childList: true,
                subtree: true
            });
        },

        initializeResizedColumn() {
            const {tableKey, minColumnWidth, maxColumnWidth, enable = false} = this.resizedConfig;

            this.tableKey = tableKey;
            this.minColumnWidth = minColumnWidth;
            this.maxColumnWidth = maxColumnWidth === -1 ? Infinity : maxColumnWidth;

            if(!enable) return;

            if(!this.columns || this.columns.length === 0) {
                this.columns = [];

                return;
            };

            this.columns.forEach((column) => {
                const columnName = this.sanitizeName(column.name);
                const columnEl = this.table.querySelector(this.tableHeaderSelector + columnName)

                this.applyColumnStyle(columnEl, column.name, column.isResized);
            });

            if (this.table && this.totalWidth) {
                this.table.style.maxWidth = `${this.totalWidth}px`;
            }
        },

        applyColumnStyle(columnEl, columnName, withHandleBar = false){
            const defaultKey = `${columnName}_default`;

            if(withHandleBar) {
                columnEl.classList.add("relative", "group/column-resize", "overflow-hidden");
                this.createHandleBar(columnEl, columnName);
            }

            let savedWidth = this.getSavedWidth(columnName);
            const defaultWidth = this.getSavedWidth(defaultKey);

            if(!savedWidth && defaultWidth){
                savedWidth = defaultWidth;
            }

            if(!savedWidth && !defaultWidth){
                savedWidth = columnEl.offsetWidth > (this.table.offsetWidth / 1.5) ? (columnEl.offsetWidth / 2) : columnEl.offsetWidth;
                this.updateColumnSize(savedWidth, defaultKey);
            }

            this.applyColumnSize(savedWidth, columnEl, columnName);

            this.totalWidth += savedWidth;
        },

        checkAndInitialize() {
            if (this.initialized) return;

            if (!this.tableContent) this.tableContent = this.element.querySelector(this.tableContentSelector);
            this.table = this.element.querySelector(this.tableSelector);

            if(this.table){
                this.initialized = true;
                this.initializeResizedColumn();
            }
        },

        createHandleBar(columnEl, columnName){
            const existingHandleBar = columnEl.querySelector(`.${this.handleBarClassName}`);
            if(existingHandleBar) return;

            const handleBarEl = document.createElement("button");
            handleBarEl.type = "button";
            handleBarEl.classList.add(this.handleBarClassName);
            handleBarEl.title = "Resize column";

            columnEl.appendChild(handleBarEl);

            handleBarEl.addEventListener("mousedown", (e) => this.startResize(e, columnEl, columnName));
        },

        startResize(event, element, columnName){
            event.preventDefault();
            event.stopPropagation();

            if(event) event.target.classList.add("active");

            const startX = event.pageX;
            const originalElementWidth = Math.round(element.offsetWidth);
            const originalTableWidth = Math.round(this.table.offsetWidth);
            const originalWrapperWidth = Math.round(this.tableContent.offsetWidth);

            const onMouseMove = this.throttle((moveEvent) => {
                if(moveEvent.pageX === startX) return;

                const delta = moveEvent.pageX - startX;

                this.currentWidth = Math.round(
                    Math.min(this.maxColumnWidth,
                        Math.max(this.minColumnWidth, originalElementWidth + delta - 16)
                    )
                );

                const newTableWidth = originalTableWidth - originalElementWidth + this.currentWidth;

                this.table.style.width = newTableWidth > originalWrapperWidth ? `${newTableWidth}px` : "auto";

                this.applyColumnSize(this.currentWidth, element, columnName);

            }, 50)

            const onMouseUp = () => {
                if (event) event.target.classList.remove("active");

                this.updateColumnSize(this.currentWidth, columnName);

                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
            }

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        },

        applyColumnSize(width, element, columnName){
            const name = this.sanitizeName(columnName);
            this.table.querySelectorAll(this.tableCellSelector + name)
                .forEach((cell) => {
                    this.setColumnStyles(cell, width);
                    cell.style.overflow = "hidden";
                });
        },

        setColumnStyles(element, width){
            element.style.width = width ? `${width}px` : "auto";
            element.style.minWidth = width ? `${width}px` : "auto";
            element.style.maxWidth = width ? `${width}px` : "auto";
        },

        updateColumnSize(width, columnName){
            sessionStorage.setItem(
            this.getStorageKey(columnName),
            Math.max(
                this.minColumnWidth,
                Math.min(this.maxColumnWidth, width)
            ).toString()
        );
        },

        getSavedWidth(name) {
            const savedWidth = sessionStorage.getItem(this.getStorageKey(name));
            return savedWidth ? parseInt(savedWidth) : null;
        },

        getStorageKey(name) {
            return `${this.tableKey}_columnWidth_${name}`;
        },

        throttle(callback, limit) {
            let wait = false;
            return function (...args) {
                if (!wait){
                    callback.apply(this, args);
                    wait = true;
                    setTimeout(() => {
                        wait = false;
                    }, limit);
                }
            };
        },

        sanitizeName(name) {
            return name
                .split('.')
                .map(s => s.replace(/_/g, '-').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase())
                .join('\\.');
        }

    }
}
