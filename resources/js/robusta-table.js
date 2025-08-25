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
        pendingUpdate: false,
        isloading : false,
        error: undefined,

        init(){
            this.element = this.$el;

            this.checkAndInitialize();

            Livewire.hook("morph.updated", ({el}) => {
                if(!this.element || !this.element.contains(el)) return;

                if (this.pendingUpdate) return;

                this.pendingUpdate = true;

                requestAnimationFrame(() => {
                    if (this.element && document.contains(this.element)) {
                        this.initialized = false;
                        this.totalWidth = 0;
                        this.checkAndInitialize();
                    }
                    this.pendingUpdate = false;
                })
            })
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

        initializeResizedColumn() {
            const {tableKey, minColumnWidth = 50, maxColumnWidth = -1, enable = false} = this.resizedConfig;

            this.tableKey = tableKey;
            this.minColumnWidth = minColumnWidth;
            this.maxColumnWidth = maxColumnWidth === -1 ? Infinity : maxColumnWidth;

            if(!enable) return;

            if(!this.columns || this.columns.length === 0) {
                this.columns = [];
                return;
            };

            this.totalWidth = 0; // Reset before calculating

            this.columns.forEach((column) => {
                const columnName = this.sanitizeName(column.name);
                const columnEl = this.table.querySelector(this.tableHeaderSelector + columnName)

                if(columnEl && column.isResized){
                    this.applyColumnStyle(columnEl, column.name, column.isResized);
                }
            });

            if (this.table && this.totalWidth > 0) {
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
                savedWidth = this.getColumn(columnName).width ?? columnEl.offsetWidth > (this.table.offsetWidth / 1.5) ? (columnEl.offsetWidth / 2) : columnEl.offsetWidth;
                this.updateColumnSize(savedWidth, columnName, defaultKey);
            }

            this.applyColumnSize(savedWidth, columnEl, columnName);

            this.totalWidth += savedWidth;
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
            handleBarEl.addEventListener('dblclick', (e) => this.handleDoubleClick(e, columnEl, columnName));
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

                this.currentWidth = 0; // reset value

                this.currentWidth = Math.round(
                    Math.min(this.maxColumnWidth,
                        Math.max(this.minColumnWidth, originalElementWidth + delta - 16)
                    )
                );

                const newTableWidth = originalTableWidth - originalElementWidth + this.currentWidth;

                this.table.style.width = `${newTableWidth}px` ;

                this.applyColumnSize(this.currentWidth, element, columnName);

            }, 16)

            const onMouseUp = () => {
                if (event) event.target.classList.remove("active");

                if (this.currentWidth > 0){
                    this.updateColumnSize(this.currentWidth, columnName);
                }

                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
            }

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        },

        handleDoubleClick(event, element, columnName){
            event.preventDefault();
            event.stopPropagation();

            const defaultColumnKey = columnName + "_default";
            const savedWidth = this.getSavedWidth(defaultColumnKey) || this.minColumnWidth;

            if (savedWidth === element.offsetWidth)  return;

            this.applyColumnSize(savedWidth, element, columnName)
            this.updateColumnSize(savedWidth, columnName);
        },

        applyColumnSize(width, element, columnName){
            const name = this.sanitizeName(columnName);

            this.setColumnStyles(element, width);
            const cell = this.table.querySelectorAll(this.tableCellSelector + name);

            cell.forEach((cell) => {
                this.setColumnStyles(cell, width);
                cell.style.overflow = "hidden";
                cell.style.textOverflow = "ellipsis";
                cell.style.whiteSpace = "nowrap";
            });
        },

        setColumnStyles(element, width){
            if (width && width > 0) {
                element.style.width = `${width}px`;
                element.style.minWidth = `${width}px`;
                element.style.maxWidth = `${width}px`;
            } else {
                element.style.width = "auto";
                element.style.minWidth = "auto";
                element.style.maxWidth = "auto";
            }
        },

        updateColumnSize(width, columnName, key){
            if(!key) key = columnName;

            if (width && width > 0) {
                sessionStorage.setItem(
                    this.getStorageKey(key),
                    Math.max(
                        this.minColumnWidth,
                        Math.min(this.maxColumnWidth, width)
                    ).toString()
                );

                this.getColumn(columnName).width = width;
            }
        },

        getSavedWidth(name) {
            const savedWidth = sessionStorage.getItem(this.getStorageKey(name));
            return savedWidth ? parseInt(savedWidth, 10) : null;
        },

        getStorageKey(name) {
            return `${this.tableKey}_columnWidth_${name}`;
        },

        throttle(callback, limit) {
            let wait = false;
            let lastArgs = null;

            return function (...args) {
                lastArgs = args;

                if (!wait){
                    callback.apply(this, lastArgs);
                    wait = true;

                    setTimeout(() => {
                        wait = false;
                        if(lastArgs){
                            callback.apply(this, lastArgs);
                        }
                    }, limit);
                }
            };
        },

        getColumn(name){
            return this.columns.find((column) => column.name === name);
        },

        sanitizeName(name) {
            return name
                .split('.')
                .map(s => s.replace(/_/g, '-').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase())
                .join('\\.');
        },

        async applyTableColumns() {
            this.isLoading = true
            try{
                await this.$wire.call('applyTableColumnManager', this.columns);

                this.error = undefined
            } catch (error){
                this.error = 'Failed to update column size'

                console.error('Robusta table resize column error:', error)
            } finally {
                this.isLoading = false;
            }
        }
    }
}
