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
    morphDebounceTimer: null,
    pendingUpdate: false,
    init() {
      this.element = this.$el;
      this.checkAndInitialize();
      Livewire.hook("morph.updated", ({ el }) => {
        if (!this.element || !this.element.contains(el)) return;
        if (this.pendingUpdate) return;
        this.pendingUpdate = true;
        clearTimeout(this.morphDebounceTimer);
        this.morphDebounceTimer = setTimeout(() => {
          if (this.element && document.contains(this.element)) {
            this.initialized = false;
            this.totalWidth = 0;
            this.checkAndInitialize();
          }
          this.pendingUpdate = false;
        }, 0);
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
        savedWidth = columnEl.offsetWidth > this.table.offsetWidth / 1.5 ? columnEl.offsetWidth / 2 : columnEl.offsetWidth;
        this.updateColumnSize(savedWidth, defaultKey);
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
    updateColumnSize(width, columnName) {
      if (width && width > 0) {
        sessionStorage.setItem(
          this.getStorageKey(columnName),
          Math.max(
            this.minColumnWidth,
            Math.min(this.maxColumnWidth, width)
          ).toString()
        );
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
              callback.apply(this.lastArgs);
            }
          }, limit);
        }
      };
    },
    sanitizeName(name) {
      return name.split(".").map((s) => s.replace(/_/g, "-").replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()).join("\\.");
    }
  };
}
export {
  filamentRobustaTable as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vanMvcm9idXN0YS10YWJsZS5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZmlsYW1lbnRSb2J1c3RhVGFibGUoe2NvbHVtbnMsIHJlc2l6ZWRDb25maWd9KXtcbiAgICByZXR1cm4ge1xuICAgICAgICBjb2x1bW5zLFxuICAgICAgICByZXNpemVkQ29uZmlnLFxuICAgICAgICBtYXhDb2x1bW5XaWR0aDogLTEsXG4gICAgICAgIG1pbkNvbHVtbldpZHRoOiAwLFxuICAgICAgICBjdXJyZW50V2lkdGg6IDAsXG4gICAgICAgIHRhYmxlQ29udGVudFNlbGVjdG9yOiAnLmZpLXRhLWNvbnRlbnQtY3RuJyxcbiAgICAgICAgdGFibGVTZWxlY3RvcjogJy5maS10YS10YWJsZScsXG4gICAgICAgIHRhYmxlSGVhZGVyU2VsZWN0b3I6ICcuZmktdGEtaGVhZGVyLWNlbGwtJyxcbiAgICAgICAgdGFibGVDZWxsU2VsZWN0b3I6ICcuZmktdGEtY2VsbC0nLFxuICAgICAgICBoYW5kbGVCYXJDbGFzc05hbWU6ICdjb2x1bW4tcmVzaXplLWhhbmRsZS1iYXInLFxuICAgICAgICBlbGVtZW50OiBudWxsLFxuICAgICAgICBpbml0aWFsaXplZDogZmFsc2UsXG4gICAgICAgIHRhYmxlOiBudWxsLFxuICAgICAgICB0YWJsZUNvbnRlbnQ6IG51bGwsXG4gICAgICAgIHRhYmxlS2V5OiBudWxsLFxuICAgICAgICB0b3RhbFdpZHRoOiAwLFxuICAgICAgICBtb3JwaERlYm91bmNlVGltZXI6IG51bGwsXG4gICAgICAgIHBlbmRpbmdVcGRhdGU6IGZhbHNlLFxuXG4gICAgICAgIGluaXQoKXtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IHRoaXMuJGVsO1xuXG4gICAgICAgICAgICB0aGlzLmNoZWNrQW5kSW5pdGlhbGl6ZSgpO1xuXG4gICAgICAgICAgICBMaXZld2lyZS5ob29rKFwibW9ycGgudXBkYXRlZFwiLCAoe2VsfSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmKCF0aGlzLmVsZW1lbnQgfHwgIXRoaXMuZWxlbWVudC5jb250YWlucyhlbCkpIHJldHVybjtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnBlbmRpbmdVcGRhdGUpIHJldHVybjtcblxuICAgICAgICAgICAgICAgIHRoaXMucGVuZGluZ1VwZGF0ZSA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5tb3JwaERlYm91bmNlVGltZXIpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5tb3JwaERlYm91bmNlVGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gT25seSByZWluaXRpYWxpemUgaWYgdGhlIHRhYmxlIHN0aWxsIGV4aXN0c1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5lbGVtZW50ICYmIGRvY3VtZW50LmNvbnRhaW5zKHRoaXMuZWxlbWVudCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudG90YWxXaWR0aCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNoZWNrQW5kSW5pdGlhbGl6ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGVuZGluZ1VwZGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfSxcblxuICAgICAgICBjaGVja0FuZEluaXRpYWxpemUoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5pbml0aWFsaXplZCkgcmV0dXJuO1xuXG4gICAgICAgICAgICBpZiAoIXRoaXMudGFibGVDb250ZW50KSB0aGlzLnRhYmxlQ29udGVudCA9IHRoaXMuZWxlbWVudC5xdWVyeVNlbGVjdG9yKHRoaXMudGFibGVDb250ZW50U2VsZWN0b3IpO1xuICAgICAgICAgICAgdGhpcy50YWJsZSA9IHRoaXMuZWxlbWVudC5xdWVyeVNlbGVjdG9yKHRoaXMudGFibGVTZWxlY3Rvcik7XG5cbiAgICAgICAgICAgIGlmKHRoaXMudGFibGUpe1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdGlhbGl6ZVJlc2l6ZWRDb2x1bW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBpbml0aWFsaXplUmVzaXplZENvbHVtbigpIHtcbiAgICAgICAgICAgIGNvbnN0IHt0YWJsZUtleSwgbWluQ29sdW1uV2lkdGggPSA1MCwgbWF4Q29sdW1uV2lkdGggPSAtMSwgZW5hYmxlID0gZmFsc2V9ID0gdGhpcy5yZXNpemVkQ29uZmlnO1xuXG4gICAgICAgICAgICB0aGlzLnRhYmxlS2V5ID0gdGFibGVLZXk7XG4gICAgICAgICAgICB0aGlzLm1pbkNvbHVtbldpZHRoID0gbWluQ29sdW1uV2lkdGg7XG4gICAgICAgICAgICB0aGlzLm1heENvbHVtbldpZHRoID0gbWF4Q29sdW1uV2lkdGggPT09IC0xID8gSW5maW5pdHkgOiBtYXhDb2x1bW5XaWR0aDtcblxuICAgICAgICAgICAgaWYoIWVuYWJsZSkgcmV0dXJuO1xuXG4gICAgICAgICAgICBpZighdGhpcy5jb2x1bW5zIHx8IHRoaXMuY29sdW1ucy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbHVtbnMgPSBbXTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLnRvdGFsV2lkdGggPSAwOyAvLyBSZXNldCBiZWZvcmUgY2FsY3VsYXRpbmdcblxuICAgICAgICAgICAgdGhpcy5jb2x1bW5zLmZvckVhY2goKGNvbHVtbikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbHVtbk5hbWUgPSB0aGlzLnNhbml0aXplTmFtZShjb2x1bW4ubmFtZSk7XG4gICAgICAgICAgICAgICAgY29uc3QgY29sdW1uRWwgPSB0aGlzLnRhYmxlLnF1ZXJ5U2VsZWN0b3IodGhpcy50YWJsZUhlYWRlclNlbGVjdG9yICsgY29sdW1uTmFtZSlcblxuICAgICAgICAgICAgICAgIGlmKGNvbHVtbkVsICYmIGNvbHVtbi5pc1Jlc2l6ZWQpe1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFwcGx5Q29sdW1uU3R5bGUoY29sdW1uRWwsIGNvbHVtbi5uYW1lLCBjb2x1bW4uaXNSZXNpemVkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKHRoaXMudGFibGUgJiYgdGhpcy50b3RhbFdpZHRoID4gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMudGFibGUuc3R5bGUubWF4V2lkdGggPSBgJHt0aGlzLnRvdGFsV2lkdGh9cHhgO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGFwcGx5Q29sdW1uU3R5bGUoY29sdW1uRWwsIGNvbHVtbk5hbWUsIHdpdGhIYW5kbGVCYXIgPSBmYWxzZSl7XG4gICAgICAgICAgICBjb25zdCBkZWZhdWx0S2V5ID0gYCR7Y29sdW1uTmFtZX1fZGVmYXVsdGA7XG5cbiAgICAgICAgICAgIGlmKHdpdGhIYW5kbGVCYXIpIHtcbiAgICAgICAgICAgICAgICBjb2x1bW5FbC5jbGFzc0xpc3QuYWRkKFwicmVsYXRpdmVcIiwgXCJncm91cC9jb2x1bW4tcmVzaXplXCIsIFwib3ZlcmZsb3ctaGlkZGVuXCIpO1xuICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlSGFuZGxlQmFyKGNvbHVtbkVsLCBjb2x1bW5OYW1lKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IHNhdmVkV2lkdGggPSB0aGlzLmdldFNhdmVkV2lkdGgoY29sdW1uTmFtZSk7XG4gICAgICAgICAgICBjb25zdCBkZWZhdWx0V2lkdGggPSB0aGlzLmdldFNhdmVkV2lkdGgoZGVmYXVsdEtleSk7XG5cbiAgICAgICAgICAgIGlmKCFzYXZlZFdpZHRoICYmIGRlZmF1bHRXaWR0aCl7XG4gICAgICAgICAgICAgICAgc2F2ZWRXaWR0aCA9IGRlZmF1bHRXaWR0aDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYoIXNhdmVkV2lkdGggJiYgIWRlZmF1bHRXaWR0aCl7XG4gICAgICAgICAgICAgICAgc2F2ZWRXaWR0aCA9IGNvbHVtbkVsLm9mZnNldFdpZHRoID4gKHRoaXMudGFibGUub2Zmc2V0V2lkdGggLyAxLjUpID8gKGNvbHVtbkVsLm9mZnNldFdpZHRoIC8gMikgOiBjb2x1bW5FbC5vZmZzZXRXaWR0aDtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbHVtblNpemUoc2F2ZWRXaWR0aCwgZGVmYXVsdEtleSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuYXBwbHlDb2x1bW5TaXplKHNhdmVkV2lkdGgsIGNvbHVtbkVsLCBjb2x1bW5OYW1lKTtcblxuICAgICAgICAgICAgdGhpcy50b3RhbFdpZHRoICs9IHNhdmVkV2lkdGg7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY3JlYXRlSGFuZGxlQmFyKGNvbHVtbkVsLCBjb2x1bW5OYW1lKXtcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nSGFuZGxlQmFyID0gY29sdW1uRWwucXVlcnlTZWxlY3RvcihgLiR7dGhpcy5oYW5kbGVCYXJDbGFzc05hbWV9YCk7XG4gICAgICAgICAgICBpZihleGlzdGluZ0hhbmRsZUJhcikgcmV0dXJuO1xuXG4gICAgICAgICAgICBjb25zdCBoYW5kbGVCYXJFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgICAgICAgICBoYW5kbGVCYXJFbC50eXBlID0gXCJidXR0b25cIjtcbiAgICAgICAgICAgIGhhbmRsZUJhckVsLmNsYXNzTGlzdC5hZGQodGhpcy5oYW5kbGVCYXJDbGFzc05hbWUpO1xuICAgICAgICAgICAgaGFuZGxlQmFyRWwudGl0bGUgPSBcIlJlc2l6ZSBjb2x1bW5cIjtcblxuICAgICAgICAgICAgY29sdW1uRWwuYXBwZW5kQ2hpbGQoaGFuZGxlQmFyRWwpO1xuXG4gICAgICAgICAgICBoYW5kbGVCYXJFbC5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIChlKSA9PiB0aGlzLnN0YXJ0UmVzaXplKGUsIGNvbHVtbkVsLCBjb2x1bW5OYW1lKSk7XG4gICAgICAgICAgICBoYW5kbGVCYXJFbC5hZGRFdmVudExpc3RlbmVyKCdkYmxjbGljaycsIChlKSA9PiB0aGlzLmhhbmRsZURvdWJsZUNsaWNrKGUsIGNvbHVtbkVsLCBjb2x1bW5OYW1lKSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc3RhcnRSZXNpemUoZXZlbnQsIGVsZW1lbnQsIGNvbHVtbk5hbWUpe1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgICAgICAgICBpZihldmVudCkgZXZlbnQudGFyZ2V0LmNsYXNzTGlzdC5hZGQoXCJhY3RpdmVcIik7XG5cbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0WCA9IGV2ZW50LnBhZ2VYO1xuICAgICAgICAgICAgY29uc3Qgb3JpZ2luYWxFbGVtZW50V2lkdGggPSBNYXRoLnJvdW5kKGVsZW1lbnQub2Zmc2V0V2lkdGgpO1xuICAgICAgICAgICAgY29uc3Qgb3JpZ2luYWxUYWJsZVdpZHRoID0gTWF0aC5yb3VuZCh0aGlzLnRhYmxlLm9mZnNldFdpZHRoKTtcbiAgICAgICAgICAgIGNvbnN0IG9yaWdpbmFsV3JhcHBlcldpZHRoID0gTWF0aC5yb3VuZCh0aGlzLnRhYmxlQ29udGVudC5vZmZzZXRXaWR0aCk7XG5cbiAgICAgICAgICAgIGNvbnN0IG9uTW91c2VNb3ZlID0gdGhpcy50aHJvdHRsZSgobW92ZUV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYobW92ZUV2ZW50LnBhZ2VYID09PSBzdGFydFgpIHJldHVybjtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGRlbHRhID0gbW92ZUV2ZW50LnBhZ2VYIC0gc3RhcnRYO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50V2lkdGggPSAwOyAvLyByZXNldCB2YWx1ZVxuXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50V2lkdGggPSBNYXRoLnJvdW5kKFxuICAgICAgICAgICAgICAgICAgICBNYXRoLm1pbih0aGlzLm1heENvbHVtbldpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5tYXgodGhpcy5taW5Db2x1bW5XaWR0aCwgb3JpZ2luYWxFbGVtZW50V2lkdGggKyBkZWx0YSAtIDE2KVxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IG5ld1RhYmxlV2lkdGggPSBvcmlnaW5hbFRhYmxlV2lkdGggLSBvcmlnaW5hbEVsZW1lbnRXaWR0aCArIHRoaXMuY3VycmVudFdpZHRoO1xuXG4gICAgICAgICAgICAgICAgdGhpcy50YWJsZS5zdHlsZS53aWR0aCA9IG5ld1RhYmxlV2lkdGggPiBvcmlnaW5hbFdyYXBwZXJXaWR0aCA/IGAke25ld1RhYmxlV2lkdGh9cHhgIDogXCJhdXRvXCI7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmFwcGx5Q29sdW1uU2l6ZSh0aGlzLmN1cnJlbnRXaWR0aCwgZWxlbWVudCwgY29sdW1uTmFtZSk7XG5cbiAgICAgICAgICAgIH0sIDE2KVxuXG4gICAgICAgICAgICBjb25zdCBvbk1vdXNlVXAgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50KSBldmVudC50YXJnZXQuY2xhc3NMaXN0LnJlbW92ZShcImFjdGl2ZVwiKTtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnRXaWR0aCA+IDApe1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbHVtblNpemUodGhpcy5jdXJyZW50V2lkdGgsIGNvbHVtbk5hbWUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgb25Nb3VzZU1vdmUpO1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIG9uTW91c2VVcCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgb25Nb3VzZU1vdmUpO1xuICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgb25Nb3VzZVVwKTtcbiAgICAgICAgfSxcblxuICAgICAgICBoYW5kbGVEb3VibGVDbGljayhldmVudCwgZWxlbWVudCwgY29sdW1uTmFtZSl7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICAgICAgICAgIGNvbnN0IGRlZmF1bHRDb2x1bW5LZXkgPSBjb2x1bW5OYW1lICsgXCJfZGVmYXVsdFwiO1xuICAgICAgICAgICAgY29uc3Qgc2F2ZWRXaWR0aCA9IHRoaXMuZ2V0U2F2ZWRXaWR0aChkZWZhdWx0Q29sdW1uS2V5KSB8fCB0aGlzLm1pbkNvbHVtbldpZHRoO1xuXG4gICAgICAgICAgICBpZiAoc2F2ZWRXaWR0aCA9PT0gZWxlbWVudC5vZmZzZXRXaWR0aCkgIHJldHVybjtcblxuICAgICAgICAgICAgdGhpcy5hcHBseUNvbHVtblNpemUoc2F2ZWRXaWR0aCwgZWxlbWVudCwgY29sdW1uTmFtZSlcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29sdW1uU2l6ZShzYXZlZFdpZHRoLCBjb2x1bW5OYW1lKTtcbiAgICAgICAgfSxcblxuICAgICAgICBhcHBseUNvbHVtblNpemUod2lkdGgsIGVsZW1lbnQsIGNvbHVtbk5hbWUpe1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IHRoaXMuc2FuaXRpemVOYW1lKGNvbHVtbk5hbWUpO1xuXG4gICAgICAgICAgICB0aGlzLnNldENvbHVtblN0eWxlcyhlbGVtZW50LCB3aWR0aCk7XG4gICAgICAgICAgICBjb25zdCBjZWxsID0gdGhpcy50YWJsZS5xdWVyeVNlbGVjdG9yQWxsKHRoaXMudGFibGVDZWxsU2VsZWN0b3IgKyBuYW1lKTtcblxuICAgICAgICAgICAgY2VsbC5mb3JFYWNoKChjZWxsKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRDb2x1bW5TdHlsZXMoY2VsbCwgd2lkdGgpO1xuICAgICAgICAgICAgICAgIGNlbGwuc3R5bGUub3ZlcmZsb3cgPSBcImhpZGRlblwiO1xuICAgICAgICAgICAgICAgIGNlbGwuc3R5bGUudGV4dE92ZXJmbG93ID0gXCJlbGxpcHNpc1wiO1xuICAgICAgICAgICAgICAgIGNlbGwuc3R5bGUud2hpdGVTcGFjZSA9IFwibm93cmFwXCI7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBzZXRDb2x1bW5TdHlsZXMoZWxlbWVudCwgd2lkdGgpe1xuICAgICAgICAgICAgaWYgKHdpZHRoICYmIHdpZHRoID4gMCkge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUud2lkdGggPSBgJHt3aWR0aH1weGA7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5zdHlsZS5taW5XaWR0aCA9IGAke3dpZHRofXB4YDtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnN0eWxlLm1heFdpZHRoID0gYCR7d2lkdGh9cHhgO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnN0eWxlLndpZHRoID0gXCJhdXRvXCI7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5zdHlsZS5taW5XaWR0aCA9IFwiYXV0b1wiO1xuICAgICAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUubWF4V2lkdGggPSBcImF1dG9cIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICB1cGRhdGVDb2x1bW5TaXplKHdpZHRoLCBjb2x1bW5OYW1lKXtcbiAgICAgICAgICAgIGlmICh3aWR0aCAmJiB3aWR0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmdldFN0b3JhZ2VLZXkoY29sdW1uTmFtZSksXG4gICAgICAgICAgICAgICAgICAgIE1hdGgubWF4KFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5taW5Db2x1bW5XaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgubWluKHRoaXMubWF4Q29sdW1uV2lkdGgsIHdpZHRoKVxuICAgICAgICAgICAgICAgICAgICApLnRvU3RyaW5nKClcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGdldFNhdmVkV2lkdGgobmFtZSkge1xuICAgICAgICAgICAgY29uc3Qgc2F2ZWRXaWR0aCA9IHNlc3Npb25TdG9yYWdlLmdldEl0ZW0odGhpcy5nZXRTdG9yYWdlS2V5KG5hbWUpKTtcbiAgICAgICAgICAgIHJldHVybiBzYXZlZFdpZHRoID8gcGFyc2VJbnQoc2F2ZWRXaWR0aCwgMTApIDogbnVsbDtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRTdG9yYWdlS2V5KG5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiBgJHt0aGlzLnRhYmxlS2V5fV9jb2x1bW5XaWR0aF8ke25hbWV9YDtcbiAgICAgICAgfSxcblxuICAgICAgICB0aHJvdHRsZShjYWxsYmFjaywgbGltaXQpIHtcbiAgICAgICAgICAgIGxldCB3YWl0ID0gZmFsc2U7XG4gICAgICAgICAgICBsZXQgbGFzdEFyZ3MgPSBudWxsO1xuXG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICAgICAgICAgICAgICBsYXN0QXJncyA9IGFyZ3M7XG5cbiAgICAgICAgICAgICAgICBpZiAoIXdhaXQpe1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjay5hcHBseSh0aGlzLCBsYXN0QXJncyk7XG4gICAgICAgICAgICAgICAgICAgIHdhaXQgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2FpdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYobGFzdEFyZ3Mpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KHRoaXMubGFzdEFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LCBsaW1pdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcblxuICAgICAgICBzYW5pdGl6ZU5hbWUobmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIG5hbWVcbiAgICAgICAgICAgICAgICAuc3BsaXQoJy4nKVxuICAgICAgICAgICAgICAgIC5tYXAocyA9PiBzLnJlcGxhY2UoL18vZywgJy0nKS5yZXBsYWNlKC8oW2Etel0pKFtBLVpdKS9nLCAnJDEtJDInKS50b0xvd2VyQ2FzZSgpKVxuICAgICAgICAgICAgICAgIC5qb2luKCdcXFxcLicpO1xuICAgICAgICB9XG5cbiAgICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWUsU0FBUixxQkFBc0MsRUFBQyxTQUFTLGNBQWEsR0FBRTtBQUNsRSxTQUFPO0FBQUEsSUFDSDtBQUFBLElBQ0E7QUFBQSxJQUNBLGdCQUFnQjtBQUFBLElBQ2hCLGdCQUFnQjtBQUFBLElBQ2hCLGNBQWM7QUFBQSxJQUNkLHNCQUFzQjtBQUFBLElBQ3RCLGVBQWU7QUFBQSxJQUNmLHFCQUFxQjtBQUFBLElBQ3JCLG1CQUFtQjtBQUFBLElBQ25CLG9CQUFvQjtBQUFBLElBQ3BCLFNBQVM7QUFBQSxJQUNULGFBQWE7QUFBQSxJQUNiLE9BQU87QUFBQSxJQUNQLGNBQWM7QUFBQSxJQUNkLFVBQVU7QUFBQSxJQUNWLFlBQVk7QUFBQSxJQUNaLG9CQUFvQjtBQUFBLElBQ3BCLGVBQWU7QUFBQSxJQUVmLE9BQU07QUFDRixXQUFLLFVBQVUsS0FBSztBQUVwQixXQUFLLG1CQUFtQjtBQUV4QixlQUFTLEtBQUssaUJBQWlCLENBQUMsRUFBQyxHQUFFLE1BQU07QUFDckMsWUFBRyxDQUFDLEtBQUssV0FBVyxDQUFDLEtBQUssUUFBUSxTQUFTLEVBQUUsRUFBRztBQUVoRCxZQUFJLEtBQUssY0FBZTtBQUV4QixhQUFLLGdCQUFnQjtBQUVyQixxQkFBYSxLQUFLLGtCQUFrQjtBQUVwQyxhQUFLLHFCQUFxQixXQUFXLE1BQU07QUFFdkMsY0FBSSxLQUFLLFdBQVcsU0FBUyxTQUFTLEtBQUssT0FBTyxHQUFHO0FBQ2pELGlCQUFLLGNBQWM7QUFDbkIsaUJBQUssYUFBYTtBQUNsQixpQkFBSyxtQkFBbUI7QUFBQSxVQUM1QjtBQUNBLGVBQUssZ0JBQWdCO0FBQUEsUUFDekIsR0FBRyxDQUFDO0FBQUEsTUFDUixDQUFDO0FBQUEsSUFDTDtBQUFBLElBRUEscUJBQXFCO0FBQ2pCLFVBQUksS0FBSyxZQUFhO0FBRXRCLFVBQUksQ0FBQyxLQUFLLGFBQWMsTUFBSyxlQUFlLEtBQUssUUFBUSxjQUFjLEtBQUssb0JBQW9CO0FBQ2hHLFdBQUssUUFBUSxLQUFLLFFBQVEsY0FBYyxLQUFLLGFBQWE7QUFFMUQsVUFBRyxLQUFLLE9BQU07QUFDVixhQUFLLGNBQWM7QUFDbkIsYUFBSyx3QkFBd0I7QUFBQSxNQUNqQztBQUFBLElBQ0o7QUFBQSxJQUVBLDBCQUEwQjtBQUN0QixZQUFNLEVBQUMsVUFBVSxpQkFBaUIsSUFBSSxpQkFBaUIsSUFBSSxTQUFTLE1BQUssSUFBSSxLQUFLO0FBRWxGLFdBQUssV0FBVztBQUNoQixXQUFLLGlCQUFpQjtBQUN0QixXQUFLLGlCQUFpQixtQkFBbUIsS0FBSyxXQUFXO0FBRXpELFVBQUcsQ0FBQyxPQUFRO0FBRVosVUFBRyxDQUFDLEtBQUssV0FBVyxLQUFLLFFBQVEsV0FBVyxHQUFHO0FBQzNDLGFBQUssVUFBVSxDQUFDO0FBQ2hCO0FBQUEsTUFDSjtBQUFDO0FBRUQsV0FBSyxhQUFhO0FBRWxCLFdBQUssUUFBUSxRQUFRLENBQUMsV0FBVztBQUM3QixjQUFNLGFBQWEsS0FBSyxhQUFhLE9BQU8sSUFBSTtBQUNoRCxjQUFNLFdBQVcsS0FBSyxNQUFNLGNBQWMsS0FBSyxzQkFBc0IsVUFBVTtBQUUvRSxZQUFHLFlBQVksT0FBTyxXQUFVO0FBQzVCLGVBQUssaUJBQWlCLFVBQVUsT0FBTyxNQUFNLE9BQU8sU0FBUztBQUFBLFFBQ2pFO0FBQUEsTUFDSixDQUFDO0FBRUQsVUFBSSxLQUFLLFNBQVMsS0FBSyxhQUFhLEdBQUc7QUFDbkMsYUFBSyxNQUFNLE1BQU0sV0FBVyxHQUFHLEtBQUssVUFBVTtBQUFBLE1BQ2xEO0FBQUEsSUFDSjtBQUFBLElBRUEsaUJBQWlCLFVBQVUsWUFBWSxnQkFBZ0IsT0FBTTtBQUN6RCxZQUFNLGFBQWEsR0FBRyxVQUFVO0FBRWhDLFVBQUcsZUFBZTtBQUNkLGlCQUFTLFVBQVUsSUFBSSxZQUFZLHVCQUF1QixpQkFBaUI7QUFDM0UsYUFBSyxnQkFBZ0IsVUFBVSxVQUFVO0FBQUEsTUFDN0M7QUFFQSxVQUFJLGFBQWEsS0FBSyxjQUFjLFVBQVU7QUFDOUMsWUFBTSxlQUFlLEtBQUssY0FBYyxVQUFVO0FBRWxELFVBQUcsQ0FBQyxjQUFjLGNBQWE7QUFDM0IscUJBQWE7QUFBQSxNQUNqQjtBQUVBLFVBQUcsQ0FBQyxjQUFjLENBQUMsY0FBYTtBQUM1QixxQkFBYSxTQUFTLGNBQWUsS0FBSyxNQUFNLGNBQWMsTUFBUSxTQUFTLGNBQWMsSUFBSyxTQUFTO0FBQzNHLGFBQUssaUJBQWlCLFlBQVksVUFBVTtBQUFBLE1BQ2hEO0FBRUEsV0FBSyxnQkFBZ0IsWUFBWSxVQUFVLFVBQVU7QUFFckQsV0FBSyxjQUFjO0FBQUEsSUFDdkI7QUFBQSxJQUVBLGdCQUFnQixVQUFVLFlBQVc7QUFDakMsWUFBTSxvQkFBb0IsU0FBUyxjQUFjLElBQUksS0FBSyxrQkFBa0IsRUFBRTtBQUM5RSxVQUFHLGtCQUFtQjtBQUV0QixZQUFNLGNBQWMsU0FBUyxjQUFjLFFBQVE7QUFDbkQsa0JBQVksT0FBTztBQUNuQixrQkFBWSxVQUFVLElBQUksS0FBSyxrQkFBa0I7QUFDakQsa0JBQVksUUFBUTtBQUVwQixlQUFTLFlBQVksV0FBVztBQUVoQyxrQkFBWSxpQkFBaUIsYUFBYSxDQUFDLE1BQU0sS0FBSyxZQUFZLEdBQUcsVUFBVSxVQUFVLENBQUM7QUFDMUYsa0JBQVksaUJBQWlCLFlBQVksQ0FBQyxNQUFNLEtBQUssa0JBQWtCLEdBQUcsVUFBVSxVQUFVLENBQUM7QUFBQSxJQUNuRztBQUFBLElBRUEsWUFBWSxPQUFPLFNBQVMsWUFBVztBQUNuQyxZQUFNLGVBQWU7QUFDckIsWUFBTSxnQkFBZ0I7QUFFdEIsVUFBRyxNQUFPLE9BQU0sT0FBTyxVQUFVLElBQUksUUFBUTtBQUU3QyxZQUFNLFNBQVMsTUFBTTtBQUNyQixZQUFNLHVCQUF1QixLQUFLLE1BQU0sUUFBUSxXQUFXO0FBQzNELFlBQU0scUJBQXFCLEtBQUssTUFBTSxLQUFLLE1BQU0sV0FBVztBQUM1RCxZQUFNLHVCQUF1QixLQUFLLE1BQU0sS0FBSyxhQUFhLFdBQVc7QUFFckUsWUFBTSxjQUFjLEtBQUssU0FBUyxDQUFDLGNBQWM7QUFDN0MsWUFBRyxVQUFVLFVBQVUsT0FBUTtBQUUvQixjQUFNLFFBQVEsVUFBVSxRQUFRO0FBRWhDLGFBQUssZUFBZTtBQUVwQixhQUFLLGVBQWUsS0FBSztBQUFBLFVBQ3JCLEtBQUs7QUFBQSxZQUFJLEtBQUs7QUFBQSxZQUNWLEtBQUssSUFBSSxLQUFLLGdCQUFnQix1QkFBdUIsUUFBUSxFQUFFO0FBQUEsVUFDbkU7QUFBQSxRQUNKO0FBRUEsY0FBTSxnQkFBZ0IscUJBQXFCLHVCQUF1QixLQUFLO0FBRXZFLGFBQUssTUFBTSxNQUFNLFFBQVEsZ0JBQWdCLHVCQUF1QixHQUFHLGFBQWEsT0FBTztBQUV2RixhQUFLLGdCQUFnQixLQUFLLGNBQWMsU0FBUyxVQUFVO0FBQUEsTUFFL0QsR0FBRyxFQUFFO0FBRUwsWUFBTSxZQUFZLE1BQU07QUFDcEIsWUFBSSxNQUFPLE9BQU0sT0FBTyxVQUFVLE9BQU8sUUFBUTtBQUVqRCxZQUFJLEtBQUssZUFBZSxHQUFFO0FBQ3RCLGVBQUssaUJBQWlCLEtBQUssY0FBYyxVQUFVO0FBQUEsUUFDdkQ7QUFFQSxpQkFBUyxvQkFBb0IsYUFBYSxXQUFXO0FBQ3JELGlCQUFTLG9CQUFvQixXQUFXLFNBQVM7QUFBQSxNQUNyRDtBQUVBLGVBQVMsaUJBQWlCLGFBQWEsV0FBVztBQUNsRCxlQUFTLGlCQUFpQixXQUFXLFNBQVM7QUFBQSxJQUNsRDtBQUFBLElBRUEsa0JBQWtCLE9BQU8sU0FBUyxZQUFXO0FBQ3pDLFlBQU0sZUFBZTtBQUNyQixZQUFNLGdCQUFnQjtBQUV0QixZQUFNLG1CQUFtQixhQUFhO0FBQ3RDLFlBQU0sYUFBYSxLQUFLLGNBQWMsZ0JBQWdCLEtBQUssS0FBSztBQUVoRSxVQUFJLGVBQWUsUUFBUSxZQUFjO0FBRXpDLFdBQUssZ0JBQWdCLFlBQVksU0FBUyxVQUFVO0FBQ3BELFdBQUssaUJBQWlCLFlBQVksVUFBVTtBQUFBLElBQ2hEO0FBQUEsSUFFQSxnQkFBZ0IsT0FBTyxTQUFTLFlBQVc7QUFDdkMsWUFBTSxPQUFPLEtBQUssYUFBYSxVQUFVO0FBRXpDLFdBQUssZ0JBQWdCLFNBQVMsS0FBSztBQUNuQyxZQUFNLE9BQU8sS0FBSyxNQUFNLGlCQUFpQixLQUFLLG9CQUFvQixJQUFJO0FBRXRFLFdBQUssUUFBUSxDQUFDQSxVQUFTO0FBQ25CLGFBQUssZ0JBQWdCQSxPQUFNLEtBQUs7QUFDaEMsUUFBQUEsTUFBSyxNQUFNLFdBQVc7QUFDdEIsUUFBQUEsTUFBSyxNQUFNLGVBQWU7QUFDMUIsUUFBQUEsTUFBSyxNQUFNLGFBQWE7QUFBQSxNQUM1QixDQUFDO0FBQUEsSUFDTDtBQUFBLElBRUEsZ0JBQWdCLFNBQVMsT0FBTTtBQUMzQixVQUFJLFNBQVMsUUFBUSxHQUFHO0FBQ3BCLGdCQUFRLE1BQU0sUUFBUSxHQUFHLEtBQUs7QUFDOUIsZ0JBQVEsTUFBTSxXQUFXLEdBQUcsS0FBSztBQUNqQyxnQkFBUSxNQUFNLFdBQVcsR0FBRyxLQUFLO0FBQUEsTUFDckMsT0FBTztBQUNILGdCQUFRLE1BQU0sUUFBUTtBQUN0QixnQkFBUSxNQUFNLFdBQVc7QUFDekIsZ0JBQVEsTUFBTSxXQUFXO0FBQUEsTUFDN0I7QUFBQSxJQUNKO0FBQUEsSUFFQSxpQkFBaUIsT0FBTyxZQUFXO0FBQy9CLFVBQUksU0FBUyxRQUFRLEdBQUc7QUFDcEIsdUJBQWU7QUFBQSxVQUNYLEtBQUssY0FBYyxVQUFVO0FBQUEsVUFDN0IsS0FBSztBQUFBLFlBQ0QsS0FBSztBQUFBLFlBQ0wsS0FBSyxJQUFJLEtBQUssZ0JBQWdCLEtBQUs7QUFBQSxVQUN2QyxFQUFFLFNBQVM7QUFBQSxRQUNmO0FBQUEsTUFDSjtBQUFBLElBQ0o7QUFBQSxJQUVBLGNBQWMsTUFBTTtBQUNoQixZQUFNLGFBQWEsZUFBZSxRQUFRLEtBQUssY0FBYyxJQUFJLENBQUM7QUFDbEUsYUFBTyxhQUFhLFNBQVMsWUFBWSxFQUFFLElBQUk7QUFBQSxJQUNuRDtBQUFBLElBRUEsY0FBYyxNQUFNO0FBQ2hCLGFBQU8sR0FBRyxLQUFLLFFBQVEsZ0JBQWdCLElBQUk7QUFBQSxJQUMvQztBQUFBLElBRUEsU0FBUyxVQUFVLE9BQU87QUFDdEIsVUFBSSxPQUFPO0FBQ1gsVUFBSSxXQUFXO0FBRWYsYUFBTyxZQUFhLE1BQU07QUFDdEIsbUJBQVc7QUFFWCxZQUFJLENBQUMsTUFBSztBQUNOLG1CQUFTLE1BQU0sTUFBTSxRQUFRO0FBQzdCLGlCQUFPO0FBRVAscUJBQVcsTUFBTTtBQUNiLG1CQUFPO0FBQ1AsZ0JBQUcsVUFBUztBQUNSLHVCQUFTLE1BQU0sS0FBSyxRQUFRO0FBQUEsWUFDaEM7QUFBQSxVQUNKLEdBQUcsS0FBSztBQUFBLFFBQ1o7QUFBQSxNQUNKO0FBQUEsSUFDSjtBQUFBLElBRUEsYUFBYSxNQUFNO0FBQ2YsYUFBTyxLQUNGLE1BQU0sR0FBRyxFQUNULElBQUksT0FBSyxFQUFFLFFBQVEsTUFBTSxHQUFHLEVBQUUsUUFBUSxtQkFBbUIsT0FBTyxFQUFFLFlBQVksQ0FBQyxFQUMvRSxLQUFLLEtBQUs7QUFBQSxJQUNuQjtBQUFBLEVBRUo7QUFDSjsiLAogICJuYW1lcyI6IFsiY2VsbCJdCn0K
