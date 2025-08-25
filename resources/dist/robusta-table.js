// resources/js/robusta-table.js
function filamentRobustaTable({ columns, resizedConfig }) {
  return {
    columns,
    resizedConfig,
    maxColumnWidth: -1,
    minColumnWidth: 0,
    currentWidth: 0,
    tableContentSelector: ".fi-ta-content-ctn",
    tableSelector: ".fi-ta-table",
    tableHeaderSelector: ".fi-ta-header-cell-",
    tableCellSelector: ".fi-ta-cell-",
    handleBarClassName: "column-resize-handle-bar",
    element: null,
    initialized: false,
    table: null,
    tableContent: null,
    tableKey: null,
    totalWidth: 0,
    pendingUpdate: false,
    isloading: false,
    error: void 0,
    init() {
      this.element = this.$el;
      this.checkAndInitialize();
      Livewire.hook("morph.updated", ({ el }) => {
        if (!this.element || !this.element.contains(el)) return;
        if (this.pendingUpdate) return;
        this.pendingUpdate = true;
        requestAnimationFrame(() => {
          if (this.element && document.contains(this.element)) {
            this.initialized = false;
            this.totalWidth = 0;
            this.checkAndInitialize();
          }
          this.pendingUpdate = false;
        });
      });
    },
    checkAndInitialize() {
      if (this.initialized) return;
      if (!this.tableContent) this.tableContent = this.element.querySelector(this.tableContentSelector);
      this.table = this.element.querySelector(this.tableSelector);
      if (this.table) {
        this.initialized = true;
        this.initializeResizedColumn();
      }
    },
    initializeResizedColumn() {
      const { tableKey, minColumnWidth = 50, maxColumnWidth = -1, enable = false } = this.resizedConfig;
      this.tableKey = tableKey;
      this.minColumnWidth = minColumnWidth;
      this.maxColumnWidth = maxColumnWidth === -1 ? Infinity : maxColumnWidth;
      if (!enable) return;
      if (!this.columns || this.columns.length === 0) {
        this.columns = [];
        return;
      }
      ;
      this.totalWidth = 0;
      this.columns.forEach((column) => {
        const columnName = this.sanitizeName(column.name);
        const columnEl = this.table.querySelector(this.tableHeaderSelector + columnName);
        if (columnEl && column.isResized) {
          this.applyColumnStyle(columnEl, column.name, column.isResized);
        }
      });
      if (this.table && this.totalWidth > 0) {
        this.table.style.maxWidth = `${this.totalWidth}px`;
      }
    },
    applyColumnStyle(columnEl, columnName, withHandleBar = false) {
      const defaultKey = `${columnName}_default`;
      if (withHandleBar) {
        columnEl.classList.add("relative", "group/column-resize", "overflow-hidden");
        this.createHandleBar(columnEl, columnName);
      }
      let savedWidth = this.getSavedWidth(columnName);
      const defaultWidth = this.getSavedWidth(defaultKey);
      if (!savedWidth && defaultWidth) {
        savedWidth = defaultWidth;
      }
      if (!savedWidth && !defaultWidth) {
        savedWidth = this.getColumn(columnName).width ?? columnEl.offsetWidth > this.table.offsetWidth / 1.5 ? columnEl.offsetWidth / 2 : columnEl.offsetWidth;
        this.updateColumnSize(savedWidth, columnName, defaultKey);
      }
      this.applyColumnSize(savedWidth, columnEl, columnName);
      this.totalWidth += savedWidth;
    },
    createHandleBar(columnEl, columnName) {
      const existingHandleBar = columnEl.querySelector(`.${this.handleBarClassName}`);
      if (existingHandleBar) return;
      const handleBarEl = document.createElement("button");
      handleBarEl.type = "button";
      handleBarEl.classList.add(this.handleBarClassName);
      handleBarEl.title = "Resize column";
      columnEl.appendChild(handleBarEl);
      handleBarEl.addEventListener("mousedown", (e) => this.startResize(e, columnEl, columnName));
      handleBarEl.addEventListener("dblclick", (e) => this.handleDoubleClick(e, columnEl, columnName));
    },
    startResize(event, element, columnName) {
      event.preventDefault();
      event.stopPropagation();
      if (event) event.target.classList.add("active");
      const startX = event.pageX;
      const originalElementWidth = Math.round(element.offsetWidth);
      const originalTableWidth = Math.round(this.table.offsetWidth);
      const originalWrapperWidth = Math.round(this.tableContent.offsetWidth);
      const onMouseMove = this.throttle((moveEvent) => {
        if (moveEvent.pageX === startX) return;
        const delta = moveEvent.pageX - startX;
        this.currentWidth = 0;
        this.currentWidth = Math.round(
          Math.min(
            this.maxColumnWidth,
            Math.max(this.minColumnWidth, originalElementWidth + delta - 16)
          )
        );
        const newTableWidth = originalTableWidth - originalElementWidth + this.currentWidth;
        this.table.style.width = `${newTableWidth}px`;
        this.applyColumnSize(this.currentWidth, element, columnName);
      }, 16);
      const onMouseUp = () => {
        if (event) event.target.classList.remove("active");
        if (this.currentWidth > 0) {
          this.updateColumnSize(this.currentWidth, columnName);
        }
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    handleDoubleClick(event, element, columnName) {
      event.preventDefault();
      event.stopPropagation();
      const defaultColumnKey = columnName + "_default";
      const savedWidth = this.getSavedWidth(defaultColumnKey) || this.minColumnWidth;
      if (savedWidth === element.offsetWidth) return;
      this.applyColumnSize(savedWidth, element, columnName);
      this.updateColumnSize(savedWidth, columnName);
    },
    applyColumnSize(width, element, columnName) {
      const name = this.sanitizeName(columnName);
      this.setColumnStyles(element, width);
      const cell = this.table.querySelectorAll(this.tableCellSelector + name);
      cell.forEach((cell2) => {
        this.setColumnStyles(cell2, width);
        cell2.style.overflow = "hidden";
        cell2.style.textOverflow = "ellipsis";
        cell2.style.whiteSpace = "nowrap";
      });
    },
    setColumnStyles(element, width) {
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
    updateColumnSize(width, columnName, key) {
      if (!key) key = columnName;
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
      return function(...args) {
        lastArgs = args;
        if (!wait) {
          callback.apply(this, lastArgs);
          wait = true;
          setTimeout(() => {
            wait = false;
            if (lastArgs) {
              callback.apply(this, lastArgs);
            }
          }, limit);
        }
      };
    },
    getColumn(name) {
      return this.columns.find((column) => column.name === name);
    },
    sanitizeName(name) {
      return name.split(".").map((s) => s.replace(/_/g, "-").replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()).join("\\.");
    },
    async applyTableColumns() {
      this.isLoading = true;
      try {
        await this.$wire.call("applyTableColumnManager", this.columns);
        this.error = void 0;
      } catch (error) {
        this.error = "Failed to update column size";
        console.error("Robusta table resize column error:", error);
      } finally {
        this.isLoading = false;
      }
    }
  };
}
export {
  filamentRobustaTable as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vanMvcm9idXN0YS10YWJsZS5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZmlsYW1lbnRSb2J1c3RhVGFibGUoe2NvbHVtbnMsIHJlc2l6ZWRDb25maWd9KXtcbiAgICByZXR1cm4ge1xuICAgICAgICBjb2x1bW5zLFxuICAgICAgICByZXNpemVkQ29uZmlnLFxuICAgICAgICBtYXhDb2x1bW5XaWR0aDogLTEsXG4gICAgICAgIG1pbkNvbHVtbldpZHRoOiAwLFxuICAgICAgICBjdXJyZW50V2lkdGg6IDAsXG4gICAgICAgIHRhYmxlQ29udGVudFNlbGVjdG9yOiAnLmZpLXRhLWNvbnRlbnQtY3RuJyxcbiAgICAgICAgdGFibGVTZWxlY3RvcjogJy5maS10YS10YWJsZScsXG4gICAgICAgIHRhYmxlSGVhZGVyU2VsZWN0b3I6ICcuZmktdGEtaGVhZGVyLWNlbGwtJyxcbiAgICAgICAgdGFibGVDZWxsU2VsZWN0b3I6ICcuZmktdGEtY2VsbC0nLFxuICAgICAgICBoYW5kbGVCYXJDbGFzc05hbWU6ICdjb2x1bW4tcmVzaXplLWhhbmRsZS1iYXInLFxuICAgICAgICBlbGVtZW50OiBudWxsLFxuICAgICAgICBpbml0aWFsaXplZDogZmFsc2UsXG4gICAgICAgIHRhYmxlOiBudWxsLFxuICAgICAgICB0YWJsZUNvbnRlbnQ6IG51bGwsXG4gICAgICAgIHRhYmxlS2V5OiBudWxsLFxuICAgICAgICB0b3RhbFdpZHRoOiAwLFxuICAgICAgICBwZW5kaW5nVXBkYXRlOiBmYWxzZSxcbiAgICAgICAgaXNsb2FkaW5nIDogZmFsc2UsXG4gICAgICAgIGVycm9yOiB1bmRlZmluZWQsXG5cbiAgICAgICAgaW5pdCgpe1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50ID0gdGhpcy4kZWw7XG5cbiAgICAgICAgICAgIHRoaXMuY2hlY2tBbmRJbml0aWFsaXplKCk7XG5cbiAgICAgICAgICAgIExpdmV3aXJlLmhvb2soXCJtb3JwaC51cGRhdGVkXCIsICh7ZWx9KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYoIXRoaXMuZWxlbWVudCB8fCAhdGhpcy5lbGVtZW50LmNvbnRhaW5zKGVsKSkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucGVuZGluZ1VwZGF0ZSkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5wZW5kaW5nVXBkYXRlID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmVsZW1lbnQgJiYgZG9jdW1lbnQuY29udGFpbnModGhpcy5lbGVtZW50KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50b3RhbFdpZHRoID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tBbmRJbml0aWFsaXplKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wZW5kaW5nVXBkYXRlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0sXG5cbiAgICAgICAgY2hlY2tBbmRJbml0aWFsaXplKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuaW5pdGlhbGl6ZWQpIHJldHVybjtcblxuICAgICAgICAgICAgaWYgKCF0aGlzLnRhYmxlQ29udGVudCkgdGhpcy50YWJsZUNvbnRlbnQgPSB0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3Rvcih0aGlzLnRhYmxlQ29udGVudFNlbGVjdG9yKTtcbiAgICAgICAgICAgIHRoaXMudGFibGUgPSB0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3Rvcih0aGlzLnRhYmxlU2VsZWN0b3IpO1xuXG4gICAgICAgICAgICBpZih0aGlzLnRhYmxlKXtcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRpYWxpemVSZXNpemVkQ29sdW1uKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgaW5pdGlhbGl6ZVJlc2l6ZWRDb2x1bW4oKSB7XG4gICAgICAgICAgICBjb25zdCB7dGFibGVLZXksIG1pbkNvbHVtbldpZHRoID0gNTAsIG1heENvbHVtbldpZHRoID0gLTEsIGVuYWJsZSA9IGZhbHNlfSA9IHRoaXMucmVzaXplZENvbmZpZztcblxuICAgICAgICAgICAgdGhpcy50YWJsZUtleSA9IHRhYmxlS2V5O1xuICAgICAgICAgICAgdGhpcy5taW5Db2x1bW5XaWR0aCA9IG1pbkNvbHVtbldpZHRoO1xuICAgICAgICAgICAgdGhpcy5tYXhDb2x1bW5XaWR0aCA9IG1heENvbHVtbldpZHRoID09PSAtMSA/IEluZmluaXR5IDogbWF4Q29sdW1uV2lkdGg7XG5cbiAgICAgICAgICAgIGlmKCFlbmFibGUpIHJldHVybjtcblxuICAgICAgICAgICAgaWYoIXRoaXMuY29sdW1ucyB8fCB0aGlzLmNvbHVtbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb2x1bW5zID0gW107XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy50b3RhbFdpZHRoID0gMDsgLy8gUmVzZXQgYmVmb3JlIGNhbGN1bGF0aW5nXG5cbiAgICAgICAgICAgIHRoaXMuY29sdW1ucy5mb3JFYWNoKChjb2x1bW4pID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb2x1bW5OYW1lID0gdGhpcy5zYW5pdGl6ZU5hbWUoY29sdW1uLm5hbWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbHVtbkVsID0gdGhpcy50YWJsZS5xdWVyeVNlbGVjdG9yKHRoaXMudGFibGVIZWFkZXJTZWxlY3RvciArIGNvbHVtbk5hbWUpXG5cbiAgICAgICAgICAgICAgICBpZihjb2x1bW5FbCAmJiBjb2x1bW4uaXNSZXNpemVkKXtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHBseUNvbHVtblN0eWxlKGNvbHVtbkVsLCBjb2x1bW4ubmFtZSwgY29sdW1uLmlzUmVzaXplZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnRhYmxlICYmIHRoaXMudG90YWxXaWR0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRhYmxlLnN0eWxlLm1heFdpZHRoID0gYCR7dGhpcy50b3RhbFdpZHRofXB4YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBhcHBseUNvbHVtblN0eWxlKGNvbHVtbkVsLCBjb2x1bW5OYW1lLCB3aXRoSGFuZGxlQmFyID0gZmFsc2Upe1xuICAgICAgICAgICAgY29uc3QgZGVmYXVsdEtleSA9IGAke2NvbHVtbk5hbWV9X2RlZmF1bHRgO1xuXG4gICAgICAgICAgICBpZih3aXRoSGFuZGxlQmFyKSB7XG4gICAgICAgICAgICAgICAgY29sdW1uRWwuY2xhc3NMaXN0LmFkZChcInJlbGF0aXZlXCIsIFwiZ3JvdXAvY29sdW1uLXJlc2l6ZVwiLCBcIm92ZXJmbG93LWhpZGRlblwiKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNyZWF0ZUhhbmRsZUJhcihjb2x1bW5FbCwgY29sdW1uTmFtZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBzYXZlZFdpZHRoID0gdGhpcy5nZXRTYXZlZFdpZHRoKGNvbHVtbk5hbWUpO1xuICAgICAgICAgICAgY29uc3QgZGVmYXVsdFdpZHRoID0gdGhpcy5nZXRTYXZlZFdpZHRoKGRlZmF1bHRLZXkpO1xuXG4gICAgICAgICAgICBpZighc2F2ZWRXaWR0aCAmJiBkZWZhdWx0V2lkdGgpe1xuICAgICAgICAgICAgICAgIHNhdmVkV2lkdGggPSBkZWZhdWx0V2lkdGg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKCFzYXZlZFdpZHRoICYmICFkZWZhdWx0V2lkdGgpe1xuICAgICAgICAgICAgICAgIHNhdmVkV2lkdGggPSB0aGlzLmdldENvbHVtbihjb2x1bW5OYW1lKS53aWR0aCA/PyBjb2x1bW5FbC5vZmZzZXRXaWR0aCA+ICh0aGlzLnRhYmxlLm9mZnNldFdpZHRoIC8gMS41KSA/IChjb2x1bW5FbC5vZmZzZXRXaWR0aCAvIDIpIDogY29sdW1uRWwub2Zmc2V0V2lkdGg7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVDb2x1bW5TaXplKHNhdmVkV2lkdGgsIGNvbHVtbk5hbWUsIGRlZmF1bHRLZXkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmFwcGx5Q29sdW1uU2l6ZShzYXZlZFdpZHRoLCBjb2x1bW5FbCwgY29sdW1uTmFtZSk7XG5cbiAgICAgICAgICAgIHRoaXMudG90YWxXaWR0aCArPSBzYXZlZFdpZHRoO1xuICAgICAgICB9LFxuXG4gICAgICAgIGNyZWF0ZUhhbmRsZUJhcihjb2x1bW5FbCwgY29sdW1uTmFtZSl7XG4gICAgICAgICAgICBjb25zdCBleGlzdGluZ0hhbmRsZUJhciA9IGNvbHVtbkVsLnF1ZXJ5U2VsZWN0b3IoYC4ke3RoaXMuaGFuZGxlQmFyQ2xhc3NOYW1lfWApO1xuICAgICAgICAgICAgaWYoZXhpc3RpbmdIYW5kbGVCYXIpIHJldHVybjtcblxuICAgICAgICAgICAgY29uc3QgaGFuZGxlQmFyRWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICAgICAgICAgICAgaGFuZGxlQmFyRWwudHlwZSA9IFwiYnV0dG9uXCI7XG4gICAgICAgICAgICBoYW5kbGVCYXJFbC5jbGFzc0xpc3QuYWRkKHRoaXMuaGFuZGxlQmFyQ2xhc3NOYW1lKTtcbiAgICAgICAgICAgIGhhbmRsZUJhckVsLnRpdGxlID0gXCJSZXNpemUgY29sdW1uXCI7XG5cbiAgICAgICAgICAgIGNvbHVtbkVsLmFwcGVuZENoaWxkKGhhbmRsZUJhckVsKTtcblxuICAgICAgICAgICAgaGFuZGxlQmFyRWwuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCAoZSkgPT4gdGhpcy5zdGFydFJlc2l6ZShlLCBjb2x1bW5FbCwgY29sdW1uTmFtZSkpO1xuICAgICAgICAgICAgaGFuZGxlQmFyRWwuYWRkRXZlbnRMaXN0ZW5lcignZGJsY2xpY2snLCAoZSkgPT4gdGhpcy5oYW5kbGVEb3VibGVDbGljayhlLCBjb2x1bW5FbCwgY29sdW1uTmFtZSkpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHN0YXJ0UmVzaXplKGV2ZW50LCBlbGVtZW50LCBjb2x1bW5OYW1lKXtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgICAgICAgICAgaWYoZXZlbnQpIGV2ZW50LnRhcmdldC5jbGFzc0xpc3QuYWRkKFwiYWN0aXZlXCIpO1xuXG4gICAgICAgICAgICBjb25zdCBzdGFydFggPSBldmVudC5wYWdlWDtcbiAgICAgICAgICAgIGNvbnN0IG9yaWdpbmFsRWxlbWVudFdpZHRoID0gTWF0aC5yb3VuZChlbGVtZW50Lm9mZnNldFdpZHRoKTtcbiAgICAgICAgICAgIGNvbnN0IG9yaWdpbmFsVGFibGVXaWR0aCA9IE1hdGgucm91bmQodGhpcy50YWJsZS5vZmZzZXRXaWR0aCk7XG4gICAgICAgICAgICBjb25zdCBvcmlnaW5hbFdyYXBwZXJXaWR0aCA9IE1hdGgucm91bmQodGhpcy50YWJsZUNvbnRlbnQub2Zmc2V0V2lkdGgpO1xuXG4gICAgICAgICAgICBjb25zdCBvbk1vdXNlTW92ZSA9IHRoaXMudGhyb3R0bGUoKG1vdmVFdmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmKG1vdmVFdmVudC5wYWdlWCA9PT0gc3RhcnRYKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICBjb25zdCBkZWx0YSA9IG1vdmVFdmVudC5wYWdlWCAtIHN0YXJ0WDtcblxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFdpZHRoID0gMDsgLy8gcmVzZXQgdmFsdWVcblxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFdpZHRoID0gTWF0aC5yb3VuZChcbiAgICAgICAgICAgICAgICAgICAgTWF0aC5taW4odGhpcy5tYXhDb2x1bW5XaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgubWF4KHRoaXMubWluQ29sdW1uV2lkdGgsIG9yaWdpbmFsRWxlbWVudFdpZHRoICsgZGVsdGEgLSAxNilcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBuZXdUYWJsZVdpZHRoID0gb3JpZ2luYWxUYWJsZVdpZHRoIC0gb3JpZ2luYWxFbGVtZW50V2lkdGggKyB0aGlzLmN1cnJlbnRXaWR0aDtcblxuICAgICAgICAgICAgICAgIHRoaXMudGFibGUuc3R5bGUud2lkdGggPSBgJHtuZXdUYWJsZVdpZHRofXB4YCA7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmFwcGx5Q29sdW1uU2l6ZSh0aGlzLmN1cnJlbnRXaWR0aCwgZWxlbWVudCwgY29sdW1uTmFtZSk7XG5cbiAgICAgICAgICAgIH0sIDE2KVxuXG4gICAgICAgICAgICBjb25zdCBvbk1vdXNlVXAgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50KSBldmVudC50YXJnZXQuY2xhc3NMaXN0LnJlbW92ZShcImFjdGl2ZVwiKTtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnRXaWR0aCA+IDApe1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbHVtblNpemUodGhpcy5jdXJyZW50V2lkdGgsIGNvbHVtbk5hbWUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgb25Nb3VzZU1vdmUpO1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIG9uTW91c2VVcCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgb25Nb3VzZU1vdmUpO1xuICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgb25Nb3VzZVVwKTtcbiAgICAgICAgfSxcblxuICAgICAgICBoYW5kbGVEb3VibGVDbGljayhldmVudCwgZWxlbWVudCwgY29sdW1uTmFtZSl7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICAgICAgICAgIGNvbnN0IGRlZmF1bHRDb2x1bW5LZXkgPSBjb2x1bW5OYW1lICsgXCJfZGVmYXVsdFwiO1xuICAgICAgICAgICAgY29uc3Qgc2F2ZWRXaWR0aCA9IHRoaXMuZ2V0U2F2ZWRXaWR0aChkZWZhdWx0Q29sdW1uS2V5KSB8fCB0aGlzLm1pbkNvbHVtbldpZHRoO1xuXG4gICAgICAgICAgICBpZiAoc2F2ZWRXaWR0aCA9PT0gZWxlbWVudC5vZmZzZXRXaWR0aCkgIHJldHVybjtcblxuICAgICAgICAgICAgdGhpcy5hcHBseUNvbHVtblNpemUoc2F2ZWRXaWR0aCwgZWxlbWVudCwgY29sdW1uTmFtZSlcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29sdW1uU2l6ZShzYXZlZFdpZHRoLCBjb2x1bW5OYW1lKTtcbiAgICAgICAgfSxcblxuICAgICAgICBhcHBseUNvbHVtblNpemUod2lkdGgsIGVsZW1lbnQsIGNvbHVtbk5hbWUpe1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IHRoaXMuc2FuaXRpemVOYW1lKGNvbHVtbk5hbWUpO1xuXG4gICAgICAgICAgICB0aGlzLnNldENvbHVtblN0eWxlcyhlbGVtZW50LCB3aWR0aCk7XG4gICAgICAgICAgICBjb25zdCBjZWxsID0gdGhpcy50YWJsZS5xdWVyeVNlbGVjdG9yQWxsKHRoaXMudGFibGVDZWxsU2VsZWN0b3IgKyBuYW1lKTtcblxuICAgICAgICAgICAgY2VsbC5mb3JFYWNoKChjZWxsKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRDb2x1bW5TdHlsZXMoY2VsbCwgd2lkdGgpO1xuICAgICAgICAgICAgICAgIGNlbGwuc3R5bGUub3ZlcmZsb3cgPSBcImhpZGRlblwiO1xuICAgICAgICAgICAgICAgIGNlbGwuc3R5bGUudGV4dE92ZXJmbG93ID0gXCJlbGxpcHNpc1wiO1xuICAgICAgICAgICAgICAgIGNlbGwuc3R5bGUud2hpdGVTcGFjZSA9IFwibm93cmFwXCI7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBzZXRDb2x1bW5TdHlsZXMoZWxlbWVudCwgd2lkdGgpe1xuICAgICAgICAgICAgaWYgKHdpZHRoICYmIHdpZHRoID4gMCkge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUud2lkdGggPSBgJHt3aWR0aH1weGA7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5zdHlsZS5taW5XaWR0aCA9IGAke3dpZHRofXB4YDtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnN0eWxlLm1heFdpZHRoID0gYCR7d2lkdGh9cHhgO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnN0eWxlLndpZHRoID0gXCJhdXRvXCI7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5zdHlsZS5taW5XaWR0aCA9IFwiYXV0b1wiO1xuICAgICAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUubWF4V2lkdGggPSBcImF1dG9cIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICB1cGRhdGVDb2x1bW5TaXplKHdpZHRoLCBjb2x1bW5OYW1lLCBrZXkpe1xuICAgICAgICAgICAgaWYoIWtleSkga2V5ID0gY29sdW1uTmFtZTtcblxuICAgICAgICAgICAgaWYgKHdpZHRoICYmIHdpZHRoID4gMCkge1xuICAgICAgICAgICAgICAgIHNlc3Npb25TdG9yYWdlLnNldEl0ZW0oXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2V0U3RvcmFnZUtleShrZXkpLFxuICAgICAgICAgICAgICAgICAgICBNYXRoLm1heChcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWluQ29sdW1uV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBNYXRoLm1pbih0aGlzLm1heENvbHVtbldpZHRoLCB3aWR0aClcbiAgICAgICAgICAgICAgICAgICAgKS50b1N0cmluZygpXG4gICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0Q29sdW1uKGNvbHVtbk5hbWUpLndpZHRoID0gd2lkdGg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0U2F2ZWRXaWR0aChuYW1lKSB7XG4gICAgICAgICAgICBjb25zdCBzYXZlZFdpZHRoID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbSh0aGlzLmdldFN0b3JhZ2VLZXkobmFtZSkpO1xuICAgICAgICAgICAgcmV0dXJuIHNhdmVkV2lkdGggPyBwYXJzZUludChzYXZlZFdpZHRoLCAxMCkgOiBudWxsO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldFN0b3JhZ2VLZXkobmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIGAke3RoaXMudGFibGVLZXl9X2NvbHVtbldpZHRoXyR7bmFtZX1gO1xuICAgICAgICB9LFxuXG4gICAgICAgIHRocm90dGxlKGNhbGxiYWNrLCBsaW1pdCkge1xuICAgICAgICAgICAgbGV0IHdhaXQgPSBmYWxzZTtcbiAgICAgICAgICAgIGxldCBsYXN0QXJncyA9IG51bGw7XG5cbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgICAgICAgICAgICAgIGxhc3RBcmdzID0gYXJncztcblxuICAgICAgICAgICAgICAgIGlmICghd2FpdCl7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KHRoaXMsIGxhc3RBcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgd2FpdCA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3YWl0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihsYXN0QXJncyl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkodGhpcywgbGFzdEFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LCBsaW1pdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRDb2x1bW4obmFtZSl7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jb2x1bW5zLmZpbmQoKGNvbHVtbikgPT4gY29sdW1uLm5hbWUgPT09IG5hbWUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNhbml0aXplTmFtZShuYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gbmFtZVxuICAgICAgICAgICAgICAgIC5zcGxpdCgnLicpXG4gICAgICAgICAgICAgICAgLm1hcChzID0+IHMucmVwbGFjZSgvXy9nLCAnLScpLnJlcGxhY2UoLyhbYS16XSkoW0EtWl0pL2csICckMS0kMicpLnRvTG93ZXJDYXNlKCkpXG4gICAgICAgICAgICAgICAgLmpvaW4oJ1xcXFwuJyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYXN5bmMgYXBwbHlUYWJsZUNvbHVtbnMoKSB7XG4gICAgICAgICAgICB0aGlzLmlzTG9hZGluZyA9IHRydWVcbiAgICAgICAgICAgIHRyeXtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLiR3aXJlLmNhbGwoJ2FwcGx5VGFibGVDb2x1bW5NYW5hZ2VyJywgdGhpcy5jb2x1bW5zKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuZXJyb3IgPSB1bmRlZmluZWRcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKXtcbiAgICAgICAgICAgICAgICB0aGlzLmVycm9yID0gJ0ZhaWxlZCB0byB1cGRhdGUgY29sdW1uIHNpemUnXG5cbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdSb2J1c3RhIHRhYmxlIHJlc2l6ZSBjb2x1bW4gZXJyb3I6JywgZXJyb3IpXG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWUsU0FBUixxQkFBc0MsRUFBQyxTQUFTLGNBQWEsR0FBRTtBQUNsRSxTQUFPO0FBQUEsSUFDSDtBQUFBLElBQ0E7QUFBQSxJQUNBLGdCQUFnQjtBQUFBLElBQ2hCLGdCQUFnQjtBQUFBLElBQ2hCLGNBQWM7QUFBQSxJQUNkLHNCQUFzQjtBQUFBLElBQ3RCLGVBQWU7QUFBQSxJQUNmLHFCQUFxQjtBQUFBLElBQ3JCLG1CQUFtQjtBQUFBLElBQ25CLG9CQUFvQjtBQUFBLElBQ3BCLFNBQVM7QUFBQSxJQUNULGFBQWE7QUFBQSxJQUNiLE9BQU87QUFBQSxJQUNQLGNBQWM7QUFBQSxJQUNkLFVBQVU7QUFBQSxJQUNWLFlBQVk7QUFBQSxJQUNaLGVBQWU7QUFBQSxJQUNmLFdBQVk7QUFBQSxJQUNaLE9BQU87QUFBQSxJQUVQLE9BQU07QUFDRixXQUFLLFVBQVUsS0FBSztBQUVwQixXQUFLLG1CQUFtQjtBQUV4QixlQUFTLEtBQUssaUJBQWlCLENBQUMsRUFBQyxHQUFFLE1BQU07QUFDckMsWUFBRyxDQUFDLEtBQUssV0FBVyxDQUFDLEtBQUssUUFBUSxTQUFTLEVBQUUsRUFBRztBQUVoRCxZQUFJLEtBQUssY0FBZTtBQUV4QixhQUFLLGdCQUFnQjtBQUVyQiw4QkFBc0IsTUFBTTtBQUN4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O0FBQUEsWUFDRCxLQUFLO0FBQUEsWUFDTCxLQUFLLElBQUksS0FBSyxnQkFBZ0IsS0FBSztBQUFBLFVBQ3ZDLEVBQUUsU0FBUztBQUFBLFFBQ2Y7QUFFQSxhQUFLLFVBQVUsVUFBVSxFQUFFLFFBQVE7QUFBQSxNQUN2QztBQUFBLElBQ0o7QUFBQSxJQUVBLGNBQWMsTUFBTTtBQUNoQixZQUFNLGFBQWEsZUFBZSxRQUFRLEtBQUssY0FBYyxJQUFJLENBQUM7QUFDbEUsYUFBTyxhQUFhLFNBQVMsWUFBWSxFQUFFLElBQUk7QUFBQSxJQUNuRDtBQUFBLElBRUEsY0FBYyxNQUFNO0FBQ2hCLGFBQU8sR0FBRyxLQUFLLFFBQVEsZ0JBQWdCLElBQUk7QUFBQSxJQUMvQztBQUFBLElBRUEsU0FBUyxVQUFVLE9BQU87QUFDdEIsVUFBSSxPQUFPO0FBQ1gsVUFBSSxXQUFXO0FBRWYsYUFBTyxZQUFhLE1BQU07QUFDdEIsbUJBQVc7QUFFWCxZQUFJLENBQUMsTUFBSztBQUNOLG1CQUFTLE1BQU0sTUFBTSxRQUFRO0FBQzdCLGlCQUFPO0FBRVAscUJBQVcsTUFBTTtBQUNiLG1CQUFPO0FBQ1AsZ0JBQUcsVUFBUztBQUNSLHVCQUFTLE1BQU0sTUFBTSxRQUFRO0FBQUEsWUFDakM7QUFBQSxVQUNKLEdBQUcsS0FBSztBQUFBLFFBQ1o7QUFBQSxNQUNKO0FBQUEsSUFDSjtBQUFBLElBRUEsVUFBVSxNQUFLO0FBQ1gsYUFBTyxLQUFLLFFBQVEsS0FBSyxDQUFDLFdBQVcsT0FBTyxTQUFTLElBQUk7QUFBQSxJQUM3RDtBQUFBLElBRUEsYUFBYSxNQUFNO0FBQ2YsYUFBTyxLQUNGLE1BQU0sR0FBRyxFQUNULElBQUksT0FBSyxFQUFFLFFBQVEsTUFBTSxHQUFHLEVBQUUsUUFBUSxtQkFBbUIsT0FBTyxFQUFFLFlBQVksQ0FBQyxFQUMvRSxLQUFLLEtBQUs7QUFBQSxJQUNuQjtBQUFBLElBRUEsTUFBTSxvQkFBb0I7QUFDdEIsV0FBSyxZQUFZO0FBQ2pCLFVBQUc7QUFDQyxjQUFNLEtBQUssTUFBTSxLQUFLLDJCQUEyQixLQUFLLE9BQU87QUFFN0QsYUFBSyxRQUFRO0FBQUEsTUFDakIsU0FBUyxPQUFNO0FBQ1gsYUFBSyxRQUFRO0FBRWIsZ0JBQVEsTUFBTSxzQ0FBc0MsS0FBSztBQUFBLE1BQzdELFVBQUU7QUFDRSxhQUFLLFlBQVk7QUFBQSxNQUNyQjtBQUFBLElBQ0o7QUFBQSxFQUNKO0FBQ0o7IiwKICAibmFtZXMiOiBbImNlbGwiXQp9Cg==
