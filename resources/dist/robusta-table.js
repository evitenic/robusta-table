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
    init() {
      Livewire.hook("element.init", () => {
        if (this.initialized) return;
        this.checkAndInitialize();
      });
      Livewire.hook("morph.updated", () => {
        this.initialized = false;
        this.checkAndInitialize();
      });
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
      const { tableKey, minColumnWidth, maxColumnWidth, enable = false } = this.resizedConfig;
      this.tableKey = tableKey;
      this.minColumnWidth = minColumnWidth;
      this.maxColumnWidth = maxColumnWidth === -1 ? Infinity : maxColumnWidth;
      if (!enable) return;
      if (!this.columns || this.columns.length === 0) {
        this.columns = [];
        return;
      }
      ;
      this.columns.forEach((column) => {
        const columnName = this.sanitizeName(column.name);
        const columnEl = this.table.querySelector(this.tableHeaderSelector + columnName);
        this.applyColumnStyle(columnEl, column.name, column.isResized);
      });
      if (this.table && this.totalWidth) {
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
    checkAndInitialize() {
      if (this.initialized) return;
      if (!this.tableContent) this.tableContent = this.element.querySelector(this.tableContentSelector);
      this.table = this.element.querySelector(this.tableSelector);
      if (this.table) {
        this.initialized = true;
        this.initializeResizedColumn();
      }
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
        this.currentWidth = Math.round(
          Math.min(
            this.maxColumnWidth,
            Math.max(this.minColumnWidth, originalElementWidth + delta - 16)
          )
        );
        const newTableWidth = originalTableWidth - originalElementWidth + this.currentWidth;
        this.table.style.width = newTableWidth > originalWrapperWidth ? `${newTableWidth}px` : "auto";
        this.applyColumnSize(this.currentWidth, element, columnName);
      }, 50);
      const onMouseUp = () => {
        if (event) event.target.classList.remove("active");
        this.updateColumnSize(this.currentWidth, columnName);
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    applyColumnSize(width, element, columnName) {
      const name = this.sanitizeName(columnName);
      this.table.querySelectorAll(this.tableCellSelector + name).forEach((cell) => {
        this.setColumnStyles(cell, width);
        cell.style.overflow = "hidden";
      });
    },
    setColumnStyles(element, width) {
      element.style.width = width ? `${width}px` : "auto";
      element.style.minWidth = width ? `${width}px` : "auto";
      element.style.maxWidth = width ? `${width}px` : "auto";
    },
    updateColumnSize(width, columnName) {
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
      return function(...args) {
        if (!wait) {
          callback.apply(this, args);
          wait = true;
          setTimeout(() => {
            wait = false;
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vanMvcm9idXN0YS10YWJsZS5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZmlsYW1lbnRSb2J1c3RhVGFibGUoe2NvbHVtbnMsIHJlc2l6ZWRDb25maWd9KXtcbiAgICByZXR1cm4ge1xuICAgICAgICBjb2x1bW5zLFxuICAgICAgICByZXNpemVkQ29uZmlnLFxuICAgICAgICBtYXhDb2x1bW5XaWR0aDogLTEsXG4gICAgICAgIG1pbkNvbHVtbldpZHRoOiAwLFxuICAgICAgICBjdXJyZW50V2lkdGg6IDAsXG4gICAgICAgIHRhYmxlQ29udGVudFNlbGVjdG9yOiAnLmZpLXRhLWNvbnRlbnQtY3RuJyxcbiAgICAgICAgdGFibGVTZWxlY3RvcjogJy5maS10YS10YWJsZScsXG4gICAgICAgIHRhYmxlSGVhZGVyU2VsZWN0b3I6ICcuZmktdGEtaGVhZGVyLWNlbGwtJyxcbiAgICAgICAgdGFibGVDZWxsU2VsZWN0b3I6ICcuZmktdGEtY2VsbC0nLFxuICAgICAgICBoYW5kbGVCYXJDbGFzc05hbWU6ICdjb2x1bW4tcmVzaXplLWhhbmRsZS1iYXInLFxuICAgICAgICBlbGVtZW50OiBudWxsLFxuICAgICAgICBpbml0aWFsaXplZDogZmFsc2UsXG4gICAgICAgIHRhYmxlOiBudWxsLFxuICAgICAgICB0YWJsZUNvbnRlbnQ6IG51bGwsXG4gICAgICAgIHRhYmxlS2V5OiBudWxsLFxuICAgICAgICB0b3RhbFdpZHRoOiAwLFxuXG4gICAgICAgIGluaXQoKXtcbiAgICAgICAgICAgIExpdmV3aXJlLmhvb2soXCJlbGVtZW50LmluaXRcIiwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmKHRoaXMuaW5pdGlhbGl6ZWQpIHJldHVybjtcblxuICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tBbmRJbml0aWFsaXplKCk7XG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICBMaXZld2lyZS5ob29rKFwibW9ycGgudXBkYXRlZFwiLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5jaGVja0FuZEluaXRpYWxpemUoKTtcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IHRoaXMuJGVsO1xuXG4gICAgICAgICAgICB0aGlzLiRuZXh0VGljaygoKSA9PiB0aGlzLmNoZWNrQW5kSW5pdGlhbGl6ZSgpKTtcblxuICAgICAgICAgICAgdGhpcy5vYnNlcnZlRm9yVGFibGUoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBvYnNlcnZlRm9yVGFibGUoKSB7XG4gICAgICAgICAgICBjb25zdCBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKCgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGVja0FuZEluaXRpYWxpemUoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5pbml0aWFsaXplZCkge1xuICAgICAgICAgICAgICAgICAgICBvYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBvYnNlcnZlci5vYnNlcnZlKHRoaXMuZWxlbWVudCwge1xuICAgICAgICAgICAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBzdWJ0cmVlOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBpbml0aWFsaXplUmVzaXplZENvbHVtbigpIHtcbiAgICAgICAgICAgIGNvbnN0IHt0YWJsZUtleSwgbWluQ29sdW1uV2lkdGgsIG1heENvbHVtbldpZHRoLCBlbmFibGUgPSBmYWxzZX0gPSB0aGlzLnJlc2l6ZWRDb25maWc7XG5cbiAgICAgICAgICAgIHRoaXMudGFibGVLZXkgPSB0YWJsZUtleTtcbiAgICAgICAgICAgIHRoaXMubWluQ29sdW1uV2lkdGggPSBtaW5Db2x1bW5XaWR0aDtcbiAgICAgICAgICAgIHRoaXMubWF4Q29sdW1uV2lkdGggPSBtYXhDb2x1bW5XaWR0aCA9PT0gLTEgPyBJbmZpbml0eSA6IG1heENvbHVtbldpZHRoO1xuXG4gICAgICAgICAgICBpZighZW5hYmxlKSByZXR1cm47XG5cbiAgICAgICAgICAgIGlmKCF0aGlzLmNvbHVtbnMgfHwgdGhpcy5jb2x1bW5zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY29sdW1ucyA9IFtdO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5jb2x1bW5zLmZvckVhY2goKGNvbHVtbikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbHVtbk5hbWUgPSB0aGlzLnNhbml0aXplTmFtZShjb2x1bW4ubmFtZSk7XG4gICAgICAgICAgICAgICAgY29uc3QgY29sdW1uRWwgPSB0aGlzLnRhYmxlLnF1ZXJ5U2VsZWN0b3IodGhpcy50YWJsZUhlYWRlclNlbGVjdG9yICsgY29sdW1uTmFtZSlcblxuICAgICAgICAgICAgICAgIHRoaXMuYXBwbHlDb2x1bW5TdHlsZShjb2x1bW5FbCwgY29sdW1uLm5hbWUsIGNvbHVtbi5pc1Jlc2l6ZWQpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnRhYmxlICYmIHRoaXMudG90YWxXaWR0aCkge1xuICAgICAgICAgICAgICAgIHRoaXMudGFibGUuc3R5bGUubWF4V2lkdGggPSBgJHt0aGlzLnRvdGFsV2lkdGh9cHhgO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGFwcGx5Q29sdW1uU3R5bGUoY29sdW1uRWwsIGNvbHVtbk5hbWUsIHdpdGhIYW5kbGVCYXIgPSBmYWxzZSl7XG4gICAgICAgICAgICBjb25zdCBkZWZhdWx0S2V5ID0gYCR7Y29sdW1uTmFtZX1fZGVmYXVsdGA7XG5cbiAgICAgICAgICAgIGlmKHdpdGhIYW5kbGVCYXIpIHtcbiAgICAgICAgICAgICAgICBjb2x1bW5FbC5jbGFzc0xpc3QuYWRkKFwicmVsYXRpdmVcIiwgXCJncm91cC9jb2x1bW4tcmVzaXplXCIsIFwib3ZlcmZsb3ctaGlkZGVuXCIpO1xuICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlSGFuZGxlQmFyKGNvbHVtbkVsLCBjb2x1bW5OYW1lKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IHNhdmVkV2lkdGggPSB0aGlzLmdldFNhdmVkV2lkdGgoY29sdW1uTmFtZSk7XG4gICAgICAgICAgICBjb25zdCBkZWZhdWx0V2lkdGggPSB0aGlzLmdldFNhdmVkV2lkdGgoZGVmYXVsdEtleSk7XG5cbiAgICAgICAgICAgIGlmKCFzYXZlZFdpZHRoICYmIGRlZmF1bHRXaWR0aCl7XG4gICAgICAgICAgICAgICAgc2F2ZWRXaWR0aCA9IGRlZmF1bHRXaWR0aDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYoIXNhdmVkV2lkdGggJiYgIWRlZmF1bHRXaWR0aCl7XG4gICAgICAgICAgICAgICAgc2F2ZWRXaWR0aCA9IGNvbHVtbkVsLm9mZnNldFdpZHRoID4gKHRoaXMudGFibGUub2Zmc2V0V2lkdGggLyAxLjUpID8gKGNvbHVtbkVsLm9mZnNldFdpZHRoIC8gMikgOiBjb2x1bW5FbC5vZmZzZXRXaWR0aDtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbHVtblNpemUoc2F2ZWRXaWR0aCwgZGVmYXVsdEtleSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuYXBwbHlDb2x1bW5TaXplKHNhdmVkV2lkdGgsIGNvbHVtbkVsLCBjb2x1bW5OYW1lKTtcblxuICAgICAgICAgICAgdGhpcy50b3RhbFdpZHRoICs9IHNhdmVkV2lkdGg7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2hlY2tBbmRJbml0aWFsaXplKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuaW5pdGlhbGl6ZWQpIHJldHVybjtcblxuICAgICAgICAgICAgaWYgKCF0aGlzLnRhYmxlQ29udGVudCkgdGhpcy50YWJsZUNvbnRlbnQgPSB0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3Rvcih0aGlzLnRhYmxlQ29udGVudFNlbGVjdG9yKTtcbiAgICAgICAgICAgIHRoaXMudGFibGUgPSB0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3Rvcih0aGlzLnRhYmxlU2VsZWN0b3IpO1xuXG4gICAgICAgICAgICBpZih0aGlzLnRhYmxlKXtcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRpYWxpemVSZXNpemVkQ29sdW1uKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgY3JlYXRlSGFuZGxlQmFyKGNvbHVtbkVsLCBjb2x1bW5OYW1lKXtcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nSGFuZGxlQmFyID0gY29sdW1uRWwucXVlcnlTZWxlY3RvcihgLiR7dGhpcy5oYW5kbGVCYXJDbGFzc05hbWV9YCk7XG4gICAgICAgICAgICBpZihleGlzdGluZ0hhbmRsZUJhcikgcmV0dXJuO1xuXG4gICAgICAgICAgICBjb25zdCBoYW5kbGVCYXJFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgICAgICAgICBoYW5kbGVCYXJFbC50eXBlID0gXCJidXR0b25cIjtcbiAgICAgICAgICAgIGhhbmRsZUJhckVsLmNsYXNzTGlzdC5hZGQodGhpcy5oYW5kbGVCYXJDbGFzc05hbWUpO1xuICAgICAgICAgICAgaGFuZGxlQmFyRWwudGl0bGUgPSBcIlJlc2l6ZSBjb2x1bW5cIjtcblxuICAgICAgICAgICAgY29sdW1uRWwuYXBwZW5kQ2hpbGQoaGFuZGxlQmFyRWwpO1xuXG4gICAgICAgICAgICBoYW5kbGVCYXJFbC5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIChlKSA9PiB0aGlzLnN0YXJ0UmVzaXplKGUsIGNvbHVtbkVsLCBjb2x1bW5OYW1lKSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc3RhcnRSZXNpemUoZXZlbnQsIGVsZW1lbnQsIGNvbHVtbk5hbWUpe1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgICAgICAgICBpZihldmVudCkgZXZlbnQudGFyZ2V0LmNsYXNzTGlzdC5hZGQoXCJhY3RpdmVcIik7XG5cbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0WCA9IGV2ZW50LnBhZ2VYO1xuICAgICAgICAgICAgY29uc3Qgb3JpZ2luYWxFbGVtZW50V2lkdGggPSBNYXRoLnJvdW5kKGVsZW1lbnQub2Zmc2V0V2lkdGgpO1xuICAgICAgICAgICAgY29uc3Qgb3JpZ2luYWxUYWJsZVdpZHRoID0gTWF0aC5yb3VuZCh0aGlzLnRhYmxlLm9mZnNldFdpZHRoKTtcbiAgICAgICAgICAgIGNvbnN0IG9yaWdpbmFsV3JhcHBlcldpZHRoID0gTWF0aC5yb3VuZCh0aGlzLnRhYmxlQ29udGVudC5vZmZzZXRXaWR0aCk7XG5cbiAgICAgICAgICAgIGNvbnN0IG9uTW91c2VNb3ZlID0gdGhpcy50aHJvdHRsZSgobW92ZUV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYobW92ZUV2ZW50LnBhZ2VYID09PSBzdGFydFgpIHJldHVybjtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGRlbHRhID0gbW92ZUV2ZW50LnBhZ2VYIC0gc3RhcnRYO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50V2lkdGggPSBNYXRoLnJvdW5kKFxuICAgICAgICAgICAgICAgICAgICBNYXRoLm1pbih0aGlzLm1heENvbHVtbldpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5tYXgodGhpcy5taW5Db2x1bW5XaWR0aCwgb3JpZ2luYWxFbGVtZW50V2lkdGggKyBkZWx0YSAtIDE2KVxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IG5ld1RhYmxlV2lkdGggPSBvcmlnaW5hbFRhYmxlV2lkdGggLSBvcmlnaW5hbEVsZW1lbnRXaWR0aCArIHRoaXMuY3VycmVudFdpZHRoO1xuXG4gICAgICAgICAgICAgICAgdGhpcy50YWJsZS5zdHlsZS53aWR0aCA9IG5ld1RhYmxlV2lkdGggPiBvcmlnaW5hbFdyYXBwZXJXaWR0aCA/IGAke25ld1RhYmxlV2lkdGh9cHhgIDogXCJhdXRvXCI7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmFwcGx5Q29sdW1uU2l6ZSh0aGlzLmN1cnJlbnRXaWR0aCwgZWxlbWVudCwgY29sdW1uTmFtZSk7XG5cbiAgICAgICAgICAgIH0sIDUwKVxuXG4gICAgICAgICAgICBjb25zdCBvbk1vdXNlVXAgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50KSBldmVudC50YXJnZXQuY2xhc3NMaXN0LnJlbW92ZShcImFjdGl2ZVwiKTtcblxuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlQ29sdW1uU2l6ZSh0aGlzLmN1cnJlbnRXaWR0aCwgY29sdW1uTmFtZSk7XG5cbiAgICAgICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIG9uTW91c2VNb3ZlKTtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCBvbk1vdXNlVXApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIG9uTW91c2VNb3ZlKTtcbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIG9uTW91c2VVcCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYXBwbHlDb2x1bW5TaXplKHdpZHRoLCBlbGVtZW50LCBjb2x1bW5OYW1lKXtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSB0aGlzLnNhbml0aXplTmFtZShjb2x1bW5OYW1lKTtcbiAgICAgICAgICAgIHRoaXMudGFibGUucXVlcnlTZWxlY3RvckFsbCh0aGlzLnRhYmxlQ2VsbFNlbGVjdG9yICsgbmFtZSlcbiAgICAgICAgICAgICAgICAuZm9yRWFjaCgoY2VsbCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldENvbHVtblN0eWxlcyhjZWxsLCB3aWR0aCk7XG4gICAgICAgICAgICAgICAgICAgIGNlbGwuc3R5bGUub3ZlcmZsb3cgPSBcImhpZGRlblwiO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNldENvbHVtblN0eWxlcyhlbGVtZW50LCB3aWR0aCl7XG4gICAgICAgICAgICBlbGVtZW50LnN0eWxlLndpZHRoID0gd2lkdGggPyBgJHt3aWR0aH1weGAgOiBcImF1dG9cIjtcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUubWluV2lkdGggPSB3aWR0aCA/IGAke3dpZHRofXB4YCA6IFwiYXV0b1wiO1xuICAgICAgICAgICAgZWxlbWVudC5zdHlsZS5tYXhXaWR0aCA9IHdpZHRoID8gYCR7d2lkdGh9cHhgIDogXCJhdXRvXCI7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdXBkYXRlQ29sdW1uU2l6ZSh3aWR0aCwgY29sdW1uTmFtZSl7XG4gICAgICAgICAgICBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKFxuICAgICAgICAgICAgdGhpcy5nZXRTdG9yYWdlS2V5KGNvbHVtbk5hbWUpLFxuICAgICAgICAgICAgTWF0aC5tYXgoXG4gICAgICAgICAgICAgICAgdGhpcy5taW5Db2x1bW5XaWR0aCxcbiAgICAgICAgICAgICAgICBNYXRoLm1pbih0aGlzLm1heENvbHVtbldpZHRoLCB3aWR0aClcbiAgICAgICAgICAgICkudG9TdHJpbmcoKVxuICAgICAgICApO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldFNhdmVkV2lkdGgobmFtZSkge1xuICAgICAgICAgICAgY29uc3Qgc2F2ZWRXaWR0aCA9IHNlc3Npb25TdG9yYWdlLmdldEl0ZW0odGhpcy5nZXRTdG9yYWdlS2V5KG5hbWUpKTtcbiAgICAgICAgICAgIHJldHVybiBzYXZlZFdpZHRoID8gcGFyc2VJbnQoc2F2ZWRXaWR0aCkgOiBudWxsO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldFN0b3JhZ2VLZXkobmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIGAke3RoaXMudGFibGVLZXl9X2NvbHVtbldpZHRoXyR7bmFtZX1gO1xuICAgICAgICB9LFxuXG4gICAgICAgIHRocm90dGxlKGNhbGxiYWNrLCBsaW1pdCkge1xuICAgICAgICAgICAgbGV0IHdhaXQgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgICAgICAgICAgICAgIGlmICghd2FpdCl7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICB3YWl0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3YWl0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH0sIGxpbWl0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuXG4gICAgICAgIHNhbml0aXplTmFtZShuYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gbmFtZVxuICAgICAgICAgICAgICAgIC5zcGxpdCgnLicpXG4gICAgICAgICAgICAgICAgLm1hcChzID0+IHMucmVwbGFjZSgvXy9nLCAnLScpLnJlcGxhY2UoLyhbYS16XSkoW0EtWl0pL2csICckMS0kMicpLnRvTG93ZXJDYXNlKCkpXG4gICAgICAgICAgICAgICAgLmpv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
