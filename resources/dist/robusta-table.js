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
        this.table.style.width = newTableWidth > originalWrapperWidth ? `${newTableWidth}px` : "auto";
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vanMvcm9idXN0YS10YWJsZS5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZmlsYW1lbnRSb2J1c3RhVGFibGUoe2NvbHVtbnMsIHJlc2l6ZWRDb25maWd9KXtcbiAgICByZXR1cm4ge1xuICAgICAgICBjb2x1bW5zLFxuICAgICAgICByZXNpemVkQ29uZmlnLFxuICAgICAgICBtYXhDb2x1bW5XaWR0aDogLTEsXG4gICAgICAgIG1pbkNvbHVtbldpZHRoOiAwLFxuICAgICAgICBjdXJyZW50V2lkdGg6IDAsXG4gICAgICAgIHRhYmxlQ29udGVudFNlbGVjdG9yOiAnLmZpLXRhLWNvbnRlbnQtY3RuJyxcbiAgICAgICAgdGFibGVTZWxlY3RvcjogJy5maS10YS10YWJsZScsXG4gICAgICAgIHRhYmxlSGVhZGVyU2VsZWN0b3I6ICcuZmktdGEtaGVhZGVyLWNlbGwtJyxcbiAgICAgICAgdGFibGVDZWxsU2VsZWN0b3I6ICcuZmktdGEtY2VsbC0nLFxuICAgICAgICBoYW5kbGVCYXJDbGFzc05hbWU6ICdjb2x1bW4tcmVzaXplLWhhbmRsZS1iYXInLFxuICAgICAgICBlbGVtZW50OiBudWxsLFxuICAgICAgICBpbml0aWFsaXplZDogZmFsc2UsXG4gICAgICAgIHRhYmxlOiBudWxsLFxuICAgICAgICB0YWJsZUNvbnRlbnQ6IG51bGwsXG4gICAgICAgIHRhYmxlS2V5OiBudWxsLFxuICAgICAgICB0b3RhbFdpZHRoOiAwLFxuICAgICAgICBwZW5kaW5nVXBkYXRlOiBmYWxzZSxcbiAgICAgICAgaXNsb2FkaW5nIDogZmFsc2UsXG4gICAgICAgIGVycm9yOiB1bmRlZmluZWQsXG5cbiAgICAgICAgaW5pdCgpe1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50ID0gdGhpcy4kZWw7XG5cbiAgICAgICAgICAgIHRoaXMuY2hlY2tBbmRJbml0aWFsaXplKCk7XG5cbiAgICAgICAgICAgIExpdmV3aXJlLmhvb2soXCJtb3JwaC51cGRhdGVkXCIsICh7ZWx9KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYoIXRoaXMuZWxlbWVudCB8fCAhdGhpcy5lbGVtZW50LmNvbnRhaW5zKGVsKSkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucGVuZGluZ1VwZGF0ZSkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5wZW5kaW5nVXBkYXRlID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmVsZW1lbnQgJiYgZG9jdW1lbnQuY29udGFpbnModGhpcy5lbGVtZW50KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50b3RhbFdpZHRoID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tBbmRJbml0aWFsaXplKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wZW5kaW5nVXBkYXRlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0sXG5cbiAgICAgICAgY2hlY2tBbmRJbml0aWFsaXplKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuaW5pdGlhbGl6ZWQpIHJldHVybjtcblxuICAgICAgICAgICAgaWYgKCF0aGlzLnRhYmxlQ29udGVudCkgdGhpcy50YWJsZUNvbnRlbnQgPSB0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3Rvcih0aGlzLnRhYmxlQ29udGVudFNlbGVjdG9yKTtcbiAgICAgICAgICAgIHRoaXMudGFibGUgPSB0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3Rvcih0aGlzLnRhYmxlU2VsZWN0b3IpO1xuXG4gICAgICAgICAgICBpZih0aGlzLnRhYmxlKXtcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRpYWxpemVSZXNpemVkQ29sdW1uKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgaW5pdGlhbGl6ZVJlc2l6ZWRDb2x1bW4oKSB7XG4gICAgICAgICAgICBjb25zdCB7dGFibGVLZXksIG1pbkNvbHVtbldpZHRoID0gNTAsIG1heENvbHVtbldpZHRoID0gLTEsIGVuYWJsZSA9IGZhbHNlfSA9IHRoaXMucmVzaXplZENvbmZpZztcblxuICAgICAgICAgICAgdGhpcy50YWJsZUtleSA9IHRhYmxlS2V5O1xuICAgICAgICAgICAgdGhpcy5taW5Db2x1bW5XaWR0aCA9IG1pbkNvbHVtbldpZHRoO1xuICAgICAgICAgICAgdGhpcy5tYXhDb2x1bW5XaWR0aCA9IG1heENvbHVtbldpZHRoID09PSAtMSA/IEluZmluaXR5IDogbWF4Q29sdW1uV2lkdGg7XG5cbiAgICAgICAgICAgIGlmKCFlbmFibGUpIHJldHVybjtcblxuICAgICAgICAgICAgaWYoIXRoaXMuY29sdW1ucyB8fCB0aGlzLmNvbHVtbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb2x1bW5zID0gW107XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy50b3RhbFdpZHRoID0gMDsgLy8gUmVzZXQgYmVmb3JlIGNhbGN1bGF0aW5nXG5cbiAgICAgICAgICAgIHRoaXMuY29sdW1ucy5mb3JFYWNoKChjb2x1bW4pID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb2x1bW5OYW1lID0gdGhpcy5zYW5pdGl6ZU5hbWUoY29sdW1uLm5hbWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbHVtbkVsID0gdGhpcy50YWJsZS5xdWVyeVNlbGVjdG9yKHRoaXMudGFibGVIZWFkZXJTZWxlY3RvciArIGNvbHVtbk5hbWUpXG5cbiAgICAgICAgICAgICAgICBpZihjb2x1bW5FbCAmJiBjb2x1bW4uaXNSZXNpemVkKXtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHBseUNvbHVtblN0eWxlKGNvbHVtbkVsLCBjb2x1bW4ubmFtZSwgY29sdW1uLmlzUmVzaXplZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnRhYmxlICYmIHRoaXMudG90YWxXaWR0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRhYmxlLnN0eWxlLm1heFdpZHRoID0gYCR7dGhpcy50b3RhbFdpZHRofXB4YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBhcHBseUNvbHVtblN0eWxlKGNvbHVtbkVsLCBjb2x1bW5OYW1lLCB3aXRoSGFuZGxlQmFyID0gZmFsc2Upe1xuICAgICAgICAgICAgY29uc3QgZGVmYXVsdEtleSA9IGAke2NvbHVtbk5hbWV9X2RlZmF1bHRgO1xuXG4gICAgICAgICAgICBpZih3aXRoSGFuZGxlQmFyKSB7XG4gICAgICAgICAgICAgICAgY29sdW1uRWwuY2xhc3NMaXN0LmFkZChcInJlbGF0aXZlXCIsIFwiZ3JvdXAvY29sdW1uLXJlc2l6ZVwiLCBcIm92ZXJmbG93LWhpZGRlblwiKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNyZWF0ZUhhbmRsZUJhcihjb2x1bW5FbCwgY29sdW1uTmFtZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBzYXZlZFdpZHRoID0gdGhpcy5nZXRTYXZlZFdpZHRoKGNvbHVtbk5hbWUpO1xuICAgICAgICAgICAgY29uc3QgZGVmYXVsdFdpZHRoID0gdGhpcy5nZXRTYXZlZFdpZHRoKGRlZmF1bHRLZXkpO1xuXG4gICAgICAgICAgICBpZighc2F2ZWRXaWR0aCAmJiBkZWZhdWx0V2lkdGgpe1xuICAgICAgICAgICAgICAgIHNhdmVkV2lkdGggPSBkZWZhdWx0V2lkdGg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKCFzYXZlZFdpZHRoICYmICFkZWZhdWx0V2lkdGgpe1xuICAgICAgICAgICAgICAgIHNhdmVkV2lkdGggPSB0aGlzLmdldENvbHVtbihjb2x1bW5OYW1lKS53aWR0aCA/PyBjb2x1bW5FbC5vZmZzZXRXaWR0aCA+ICh0aGlzLnRhYmxlLm9mZnNldFdpZHRoIC8gMS41KSA/IChjb2x1bW5FbC5vZmZzZXRXaWR0aCAvIDIpIDogY29sdW1uRWwub2Zmc2V0V2lkdGg7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVDb2x1bW5TaXplKHNhdmVkV2lkdGgsIGNvbHVtbk5hbWUsIGRlZmF1bHRLZXkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmFwcGx5Q29sdW1uU2l6ZShzYXZlZFdpZHRoLCBjb2x1bW5FbCwgY29sdW1uTmFtZSk7XG5cbiAgICAgICAgICAgIHRoaXMudG90YWxXaWR0aCArPSBzYXZlZFdpZHRoO1xuICAgICAgICB9LFxuXG4gICAgICAgIGNyZWF0ZUhhbmRsZUJhcihjb2x1bW5FbCwgY29sdW1uTmFtZSl7XG4gICAgICAgICAgICBjb25zdCBleGlzdGluZ0hhbmRsZUJhciA9IGNvbHVtbkVsLnF1ZXJ5U2VsZWN0b3IoYC4ke3RoaXMuaGFuZGxlQmFyQ2xhc3NOYW1lfWApO1xuICAgICAgICAgICAgaWYoZXhpc3RpbmdIYW5kbGVCYXIpIHJldHVybjtcblxuICAgICAgICAgICAgY29uc3QgaGFuZGxlQmFyRWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICAgICAgICAgICAgaGFuZGxlQmFyRWwudHlwZSA9IFwiYnV0dG9uXCI7XG4gICAgICAgICAgICBoYW5kbGVCYXJFbC5jbGFzc0xpc3QuYWRkKHRoaXMuaGFuZGxlQmFyQ2xhc3NOYW1lKTtcbiAgICAgICAgICAgIGhhbmRsZUJhckVsLnRpdGxlID0gXCJSZXNpemUgY29sdW1uXCI7XG5cbiAgICAgICAgICAgIGNvbHVtbkVsLmFwcGVuZENoaWxkKGhhbmRsZUJhckVsKTtcblxuICAgICAgICAgICAgaGFuZGxlQmFyRWwuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCAoZSkgPT4gdGhpcy5zdGFydFJlc2l6ZShlLCBjb2x1bW5FbCwgY29sdW1uTmFtZSkpO1xuICAgICAgICAgICAgaGFuZGxlQmFyRWwuYWRkRXZlbnRMaXN0ZW5lcignZGJsY2xpY2snLCAoZSkgPT4gdGhpcy5oYW5kbGVEb3VibGVDbGljayhlLCBjb2x1bW5FbCwgY29sdW1uTmFtZSkpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHN0YXJ0UmVzaXplKGV2ZW50LCBlbGVtZW50LCBjb2x1bW5OYW1lKXtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgICAgICAgICAgaWYoZXZlbnQpIGV2ZW50LnRhcmdldC5jbGFzc0xpc3QuYWRkKFwiYWN0aXZlXCIpO1xuXG4gICAgICAgICAgICBjb25zdCBzdGFydFggPSBldmVudC5wYWdlWDtcbiAgICAgICAgICAgIGNvbnN0IG9yaWdpbmFsRWxlbWVudFdpZHRoID0gTWF0aC5yb3VuZChlbGVtZW50Lm9mZnNldFdpZHRoKTtcbiAgICAgICAgICAgIGNvbnN0IG9yaWdpbmFsVGFibGVXaWR0aCA9IE1hdGgucm91bmQodGhpcy50YWJsZS5vZmZzZXRXaWR0aCk7XG4gICAgICAgICAgICBjb25zdCBvcmlnaW5hbFdyYXBwZXJXaWR0aCA9IE1hdGgucm91bmQodGhpcy50YWJsZUNvbnRlbnQub2Zmc2V0V2lkdGgpO1xuXG4gICAgICAgICAgICBjb25zdCBvbk1vdXNlTW92ZSA9IHRoaXMudGhyb3R0bGUoKG1vdmVFdmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmKG1vdmVFdmVudC5wYWdlWCA9PT0gc3RhcnRYKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICBjb25zdCBkZWx0YSA9IG1vdmVFdmVudC5wYWdlWCAtIHN0YXJ0WDtcblxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFdpZHRoID0gMDsgLy8gcmVzZXQgdmFsdWVcblxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFdpZHRoID0gTWF0aC5yb3VuZChcbiAgICAgICAgICAgICAgICAgICAgTWF0aC5taW4odGhpcy5tYXhDb2x1bW5XaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgubWF4KHRoaXMubWluQ29sdW1uV2lkdGgsIG9yaWdpbmFsRWxlbWVudFdpZHRoICsgZGVsdGEgLSAxNilcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBuZXdUYWJsZVdpZHRoID0gb3JpZ2luYWxUYWJsZVdpZHRoIC0gb3JpZ2luYWxFbGVtZW50V2lkdGggKyB0aGlzLmN1cnJlbnRXaWR0aDtcblxuICAgICAgICAgICAgICAgIHRoaXMudGFibGUuc3R5bGUud2lkdGggPSBuZXdUYWJsZVdpZHRoID4gb3JpZ2luYWxXcmFwcGVyV2lkdGggPyBgJHtuZXdUYWJsZVdpZHRofXB4YCA6IFwiYXV0b1wiO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5hcHBseUNvbHVtblNpemUodGhpcy5jdXJyZW50V2lkdGgsIGVsZW1lbnQsIGNvbHVtbk5hbWUpO1xuXG4gICAgICAgICAgICB9LCAxNilcblxuICAgICAgICAgICAgY29uc3Qgb25Nb3VzZVVwID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChldmVudCkgZXZlbnQudGFyZ2V0LmNsYXNzTGlzdC5yZW1vdmUoXCJhY3RpdmVcIik7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jdXJyZW50V2lkdGggPiAwKXtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVDb2x1bW5TaXplKHRoaXMuY3VycmVudFdpZHRoLCBjb2x1bW5OYW1lKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIG9uTW91c2VNb3ZlKTtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCBvbk1vdXNlVXApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIG9uTW91c2VNb3ZlKTtcbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIG9uTW91c2VVcCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaGFuZGxlRG91YmxlQ2xpY2soZXZlbnQsIGVsZW1lbnQsIGNvbHVtbk5hbWUpe1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgICAgICAgICBjb25zdCBkZWZhdWx0Q29sdW1uS2V5ID0gY29sdW1uTmFtZSArIFwiX2RlZmF1bHRcIjtcbiAgICAgICAgICAgIGNvbnN0IHNhdmVkV2lkdGggPSB0aGlzLmdldFNhdmVkV2lkdGgoZGVmYXVsdENvbHVtbktleSkgfHwgdGhpcy5taW5Db2x1bW5XaWR0aDtcblxuICAgICAgICAgICAgaWYgKHNhdmVkV2lkdGggPT09IGVsZW1lbnQub2Zmc2V0V2lkdGgpICByZXR1cm47XG5cbiAgICAgICAgICAgIHRoaXMuYXBwbHlDb2x1bW5TaXplKHNhdmVkV2lkdGgsIGVsZW1lbnQsIGNvbHVtbk5hbWUpXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbHVtblNpemUoc2F2ZWRXaWR0aCwgY29sdW1uTmFtZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYXBwbHlDb2x1bW5TaXplKHdpZHRoLCBlbGVtZW50LCBjb2x1bW5OYW1lKXtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSB0aGlzLnNhbml0aXplTmFtZShjb2x1bW5OYW1lKTtcblxuICAgICAgICAgICAgdGhpcy5zZXRDb2x1bW5TdHlsZXMoZWxlbWVudCwgd2lkdGgpO1xuICAgICAgICAgICAgY29uc3QgY2VsbCA9IHRoaXMudGFibGUucXVlcnlTZWxlY3RvckFsbCh0aGlzLnRhYmxlQ2VsbFNlbGVjdG9yICsgbmFtZSk7XG5cbiAgICAgICAgICAgIGNlbGwuZm9yRWFjaCgoY2VsbCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0Q29sdW1uU3R5bGVzKGNlbGwsIHdpZHRoKTtcbiAgICAgICAgICAgICAgICBjZWxsLnN0eWxlLm92ZXJmbG93ID0gXCJoaWRkZW5cIjtcbiAgICAgICAgICAgICAgICBjZWxsLnN0eWxlLnRleHRPdmVyZmxvdyA9IFwiZWxsaXBzaXNcIjtcbiAgICAgICAgICAgICAgICBjZWxsLnN0eWxlLndoaXRlU3BhY2UgPSBcIm5vd3JhcFwiO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2V0Q29sdW1uU3R5bGVzKGVsZW1lbnQsIHdpZHRoKXtcbiAgICAgICAgICAgIGlmICh3aWR0aCAmJiB3aWR0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnN0eWxlLndpZHRoID0gYCR7d2lkdGh9cHhgO1xuICAgICAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUubWluV2lkdGggPSBgJHt3aWR0aH1weGA7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5zdHlsZS5tYXhXaWR0aCA9IGAke3dpZHRofXB4YDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5zdHlsZS53aWR0aCA9IFwiYXV0b1wiO1xuICAgICAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUubWluV2lkdGggPSBcImF1dG9cIjtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnN0eWxlLm1heFdpZHRoID0gXCJhdXRvXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgdXBkYXRlQ29sdW1uU2l6ZSh3aWR0aCwgY29sdW1uTmFtZSwga2V5KXtcbiAgICAgICAgICAgIGlmKCFrZXkpIGtleSA9IGNvbHVtbk5hbWU7XG5cbiAgICAgICAgICAgIGlmICh3aWR0aCAmJiB3aWR0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmdldFN0b3JhZ2VLZXkoa2V5KSxcbiAgICAgICAgICAgICAgICAgICAgTWF0aC5tYXgoXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1pbkNvbHVtbldpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5taW4odGhpcy5tYXhDb2x1bW5XaWR0aCwgd2lkdGgpXG4gICAgICAgICAgICAgICAgICAgICkudG9TdHJpbmcoKVxuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmdldENvbHVtbihjb2x1bW5OYW1lKS53aWR0aCA9IHdpZHRoO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGdldFNhdmVkV2lkdGgobmFtZSkge1xuICAgICAgICAgICAgY29uc3Qgc2F2ZWRXaWR0aCA9IHNlc3Npb25TdG9yYWdlLmdldEl0ZW0odGhpcy5nZXRTdG9yYWdlS2V5KG5hbWUpKTtcbiAgICAgICAgICAgIHJldHVybiBzYXZlZFdpZHRoID8gcGFyc2VJbnQoc2F2ZWRXaWR0aCwgMTApIDogbnVsbDtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRTdG9yYWdlS2V5KG5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiBgJHt0aGlzLnRhYmxlS2V5fV9jb2x1bW5XaWR0aF8ke25hbWV9YDtcbiAgICAgICAgfSxcblxuICAgICAgICB0aHJvdHRsZShjYWxsYmFjaywgbGltaXQpIHtcbiAgICAgICAgICAgIGxldCB3YWl0ID0gZmFsc2U7XG4gICAgICAgICAgICBsZXQgbGFzdEFyZ3MgPSBudWxsO1xuXG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICAgICAgICAgICAgICBsYXN0QXJncyA9IGFyZ3M7XG5cbiAgICAgICAgICAgICAgICBpZiAoIXdhaXQpe1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjay5hcHBseSh0aGlzLCBsYXN0QXJncyk7XG4gICAgICAgICAgICAgICAgICAgIHdhaXQgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2FpdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYobGFzdEFyZ3Mpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KHRoaXMsIGxhc3RBcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSwgbGltaXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0Q29sdW1uKG5hbWUpe1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29sdW1ucy5maW5kKChjb2x1bW4pID0+IGNvbHVtbi5uYW1lID09PSBuYW1lKTtcbiAgICAgICAgfSxcblxuICAgICAgICBzYW5pdGl6ZU5hbWUobmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIG5hbWVcbiAgICAgICAgICAgICAgICAuc3BsaXQoJy4nKVxuICAgICAgICAgICAgICAgIC5tYXAocyA9PiBzLnJlcGxhY2UoL18vZywgJy0nKS5yZXBsYWNlKC8oW2Etel0pKFtBLVpdKS9nLCAnJDEtJDInKS50b0xvd2VyQ2FzZSgpKVxuICAgICAgICAgICAgICAgIC5qb2luKCdcXFxcLicpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFzeW5jIGFwcGx5VGFibGVDb2x1bW5zKCkge1xuICAgICAgICAgICAgdGhpcy5pc0xvYWRpbmcgPSB0cnVlXG4gICAgICAgICAgICB0cnl7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy4kd2lyZS5jYWxsKCdhcHBseVRhYmxlQ29sdW1uTWFuYWdlcicsIHRoaXMuY29sdW1ucyk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmVycm9yID0gdW5kZWZpbmVkXG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcil7XG4gICAgICAgICAgICAgICAgdGhpcy5lcnJvciA9ICdGYWlsZWQgdG8gdXBkYXRlIGNvbHVtbiBzaXplJ1xuXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignUm9idXN0YSB0YWJsZSByZXNpemUgY29sdW1uIGVycm9yOicsIGVycm9yKVxuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICB0aGlzLmlzTG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFlLFNBQVIscUJBQXNDLEVBQUMsU0FBUyxjQUFhLEdBQUU7QUFDbEUsU0FBTztBQUFBLElBQ0g7QUFBQSxJQUNBO0FBQUEsSUFDQSxnQkFBZ0I7QUFBQSxJQUNoQixnQkFBZ0I7QUFBQSxJQUNoQixjQUFjO0FBQUEsSUFDZCxzQkFBc0I7QUFBQSxJQUN0QixlQUFlO0FBQUEsSUFDZixxQkFBcUI7QUFBQSxJQUNyQixtQkFBbUI7QUFBQSxJQUNuQixvQkFBb0I7QUFBQSxJQUNwQixTQUFTO0FBQUEsSUFDVCxhQUFhO0FBQUEsSUFDYixPQUFPO0FBQUEsSUFDUCxjQUFjO0FBQUEsSUFDZCxVQUFVO0FBQUEsSUFDVixZQUFZO0FBQUEsSUFDWixlQUFlO0FBQUEsSUFDZixXQUFZO0FBQUEsSUFDWixPQUFPO0FBQUEsSUFFUCxPQUFNO0FBQ0YsV0FBSyxVQUFVLEtBQUs7QUFFcEIsV0FBSyxtQkFBbUI7QUFFeEIsZUFBUyxLQUFLLGlCQUFpQixDQUFDLEVBQUMsR0FBRSxNQUFNO0FBQ3JDLFlBQUcsQ0FBQyxLQUFLLFdBQVcsQ0FBQyxLQUFLLFFBQVEsU0FBUyxFQUFFLEVBQUc7QUFFaEQsWUFBSSxL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LFNBQVMsUUFBUSxHQUFHO0FBQ3BCLHVCQUFlO0FBQUEsVUFDWCxLQUFLLGNBQWMsR0FBRztBQUFBLFVBQ3RCLEtBQUs7QUFBQSxZQUNELEtBQUs7QUFBQSxZQUNMLEtBQUssSUFBSSxLQUFLLGdCQUFnQixLQUFLO0FBQUEsVUFDdkMsRUFBRSxTQUFTO0FBQUEsUUFDZjtBQUVBLGFBQUssVUFBVSxVQUFVLEVBQUUsUUFBUTtBQUFBLE1BQ3ZDO0FBQUEsSUFDSjtBQUFBLElBRUEsY0FBYyxNQUFNO0FBQ2hCLFlBQU0sYUFBYSxlQUFlLFFBQVEsS0FBSyxjQUFjLElBQUksQ0FBQztBQUNsRSxhQUFPLGFBQWEsU0FBUyxZQUFZLEVBQUUsSUFBSTtBQUFBLElBQ25EO0FBQUEsSUFFQSxjQUFjLE1BQU07QUFDaEIsYUFBTyxHQUFHLEtBQUssUUFBUSxnQkFBZ0IsSUFBSTtBQUFBLElBQy9DO0FBQUEsSUFFQSxTQUFTLFVBQVUsT0FBTztBQUN0QixVQUFJLE9BQU87QUFDWCxVQUFJLFdBQVc7QUFFZixhQUFPLFlBQWEsTUFBTTtBQUN0QixtQkFBVztBQUVYLFlBQUksQ0FBQyxNQUFLO0FBQ04sbUJBQVMsTUFBTSxNQUFNLFFBQVE7QUFDN0IsaUJBQU87QUFFUCxxQkFBVyxNQUFNO0FBQ2IsbUJBQU87QUFDUCxnQkFBRyxVQUFTO0FBQ1IsdUJBQVMsTUFBTSxNQUFNLFFBQVE7QUFBQSxZQUNqQztBQUFBLFVBQ0osR0FBRyxLQUFLO0FBQUEsUUFDWjtBQUFBLE1BQ0o7QUFBQSxJQUNKO0FBQUEsSUFFQSxVQUFVLE1BQUs7QUFDWCxhQUFPLEtBQUssUUFBUSxLQUFLLENBQUMsV0FBVyxPQUFPLFNBQVMsSUFBSTtBQUFBLElBQzdEO0FBQUEsSUFFQSxhQUFhLE1BQU07QUFDZixhQUFPLEtBQ0YsTUFBTSxHQUFHLEVBQ1QsSUFBSSxPQUFLLEVBQUUsUUFBUSxNQUFNLEdBQUcsRUFBRSxRQUFRLG1CQUFtQixPQUFPLEVBQUUsWUFBWSxDQUFDLEVBQy9FLEtBQUssS0FBSztBQUFBLElBQ25CO0FBQUEsSUFFQSxNQUFNLG9CQUFvQjtBQUN0QixXQUFLLFlBQVk7QUFDakIsVUFBRztBQUNDLGNBQU0sS0FBSyxNQUFNLEtBQUssMkJBQTJCLEtBQUssT0FBTztBQUU3RCxhQUFLLFFBQVE7QUFBQSxNQUNqQixTQUFTLE9BQU07QUFDWCxhQUFLLFFBQVE7QUFFYixnQkFBUSxNQUFNLHNDQUFzQyxLQUFLO0FBQUEsTUFDN0QsVUFBRTtBQUNFLGFBQUssWUFBWTtBQUFBLE1BQ3JCO0FBQUEsSUFDSjtBQUFBLEVBQ0o7QUFDSjsiLAogICJuYW1lcyI6IFsiY2VsbCJdCn0K
