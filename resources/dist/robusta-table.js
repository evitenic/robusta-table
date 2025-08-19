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
        const columnName = this.sanitizeColumnName(column.name);
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
      const name = this.sanitizeColumnName(columnName);
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
    sanitizeColumnName(name) {
      return name.replaceAll("_", "-");
    }
  };
}
export {
  filamentRobustaTable as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vanMvcm9idXN0YS10YWJsZS5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZmlsYW1lbnRSb2J1c3RhVGFibGUoe2NvbHVtbnMsIHJlc2l6ZWRDb25maWd9KXtcbiAgICByZXR1cm4ge1xuICAgICAgICBjb2x1bW5zLFxuICAgICAgICByZXNpemVkQ29uZmlnLFxuICAgICAgICBtYXhDb2x1bW5XaWR0aDogLTEsXG4gICAgICAgIG1pbkNvbHVtbldpZHRoOiAwLFxuICAgICAgICBjdXJyZW50V2lkdGg6IDAsXG4gICAgICAgIHRhYmxlQ29udGVudFNlbGVjdG9yOiAnLmZpLXRhLWNvbnRlbnQtY3RuJyxcbiAgICAgICAgdGFibGVTZWxlY3RvcjogJy5maS10YS10YWJsZScsXG4gICAgICAgIHRhYmxlSGVhZGVyU2VsZWN0b3I6ICcuZmktdGEtaGVhZGVyLWNlbGwtJyxcbiAgICAgICAgdGFibGVDZWxsU2VsZWN0b3I6ICcuZmktdGEtY2VsbC0nLFxuICAgICAgICBoYW5kbGVCYXJDbGFzc05hbWU6ICdjb2x1bW4tcmVzaXplLWhhbmRsZS1iYXInLFxuICAgICAgICBlbGVtZW50OiBudWxsLFxuICAgICAgICBpbml0aWFsaXplZDogZmFsc2UsXG4gICAgICAgIHRhYmxlOiBudWxsLFxuICAgICAgICB0YWJsZUNvbnRlbnQ6IG51bGwsXG4gICAgICAgIHRhYmxlS2V5OiBudWxsLFxuICAgICAgICB0b3RhbFdpZHRoOiAwLFxuXG4gICAgICAgIGluaXQoKXtcbiAgICAgICAgICAgIExpdmV3aXJlLmhvb2soXCJlbGVtZW50LmluaXRcIiwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmKHRoaXMuaW5pdGlhbGl6ZWQpIHJldHVybjtcblxuICAgICAgICAgICAgICAgICB0aGlzLmNoZWNrQW5kSW5pdGlhbGl6ZSgpO1xuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgTGl2ZXdpcmUuaG9vayhcIm1vcnBoLnVwZGF0ZWRcIiwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IHRoaXMuJGVsO1xuXG4gICAgICAgICAgICB0aGlzLiRuZXh0VGljaygoKSA9PiB0aGlzLmNoZWNrQW5kSW5pdGlhbGl6ZSgpKTtcblxuICAgICAgICAgICAgdGhpcy5vYnNlcnZlRm9yVGFibGUoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBvYnNlcnZlRm9yVGFibGUoKSB7XG4gICAgICAgICAgICBjb25zdCBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKCgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGVja0FuZEluaXRpYWxpemUoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5pbml0aWFsaXplZCkge1xuICAgICAgICAgICAgICAgICAgICBvYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBvYnNlcnZlci5vYnNlcnZlKHRoaXMuZWxlbWVudCwge1xuICAgICAgICAgICAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBzdWJ0cmVlOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBpbml0aWFsaXplUmVzaXplZENvbHVtbigpIHtcbiAgICAgICAgICAgIGNvbnN0IHt0YWJsZUtleSwgbWluQ29sdW1uV2lkdGgsIG1heENvbHVtbldpZHRoLCBlbmFibGUgPSBmYWxzZX0gPSB0aGlzLnJlc2l6ZWRDb25maWc7XG5cbiAgICAgICAgICAgIHRoaXMudGFibGVLZXkgPSB0YWJsZUtleTtcbiAgICAgICAgICAgIHRoaXMubWluQ29sdW1uV2lkdGggPSBtaW5Db2x1bW5XaWR0aDtcbiAgICAgICAgICAgIHRoaXMubWF4Q29sdW1uV2lkdGggPSBtYXhDb2x1bW5XaWR0aCA9PT0gLTEgPyBJbmZpbml0eSA6IG1heENvbHVtbldpZHRoO1xuXG4gICAgICAgICAgICBpZighZW5hYmxlKSByZXR1cm47XG5cbiAgICAgICAgICAgIGlmKCF0aGlzLmNvbHVtbnMgfHwgdGhpcy5jb2x1bW5zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY29sdW1ucyA9IFtdO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5jb2x1bW5zLmZvckVhY2goKGNvbHVtbikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbHVtbk5hbWUgPSB0aGlzLnNhbml0aXplQ29sdW1uTmFtZShjb2x1bW4ubmFtZSk7XG4gICAgICAgICAgICAgICAgY29uc3QgY29sdW1uRWwgPSB0aGlzLnRhYmxlLnF1ZXJ5U2VsZWN0b3IodGhpcy50YWJsZUhlYWRlclNlbGVjdG9yICsgY29sdW1uTmFtZSlcblxuICAgICAgICAgICAgICAgIHRoaXMuYXBwbHlDb2x1bW5TdHlsZShjb2x1bW5FbCwgY29sdW1uLm5hbWUsIGNvbHVtbi5pc1Jlc2l6ZWQpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnRhYmxlICYmIHRoaXMudG90YWxXaWR0aCkge1xuICAgICAgICAgICAgICAgIHRoaXMudGFibGUuc3R5bGUubWF4V2lkdGggPSBgJHt0aGlzLnRvdGFsV2lkdGh9cHhgO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGFwcGx5Q29sdW1uU3R5bGUoY29sdW1uRWwsIGNvbHVtbk5hbWUsIHdpdGhIYW5kbGVCYXIgPSBmYWxzZSl7XG4gICAgICAgICAgICBjb25zdCBkZWZhdWx0S2V5ID0gYCR7Y29sdW1uTmFtZX1fZGVmYXVsdGA7XG5cbiAgICAgICAgICAgIGlmKHdpdGhIYW5kbGVCYXIpIHtcbiAgICAgICAgICAgICAgICBjb2x1bW5FbC5jbGFzc0xpc3QuYWRkKFwicmVsYXRpdmVcIiwgXCJncm91cC9jb2x1bW4tcmVzaXplXCIsIFwib3ZlcmZsb3ctaGlkZGVuXCIpO1xuICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlSGFuZGxlQmFyKGNvbHVtbkVsLCBjb2x1bW5OYW1lKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IHNhdmVkV2lkdGggPSB0aGlzLmdldFNhdmVkV2lkdGgoY29sdW1uTmFtZSk7XG4gICAgICAgICAgICBjb25zdCBkZWZhdWx0V2lkdGggPSB0aGlzLmdldFNhdmVkV2lkdGgoZGVmYXVsdEtleSk7XG5cbiAgICAgICAgICAgIGlmKCFzYXZlZFdpZHRoICYmIGRlZmF1bHRXaWR0aCl7XG4gICAgICAgICAgICAgICAgc2F2ZWRXaWR0aCA9IGRlZmF1bHRXaWR0aDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYoIXNhdmVkV2lkdGggJiYgIWRlZmF1bHRXaWR0aCl7XG4gICAgICAgICAgICAgICAgc2F2ZWRXaWR0aCA9IGNvbHVtbkVsLm9mZnNldFdpZHRoID4gKHRoaXMudGFibGUub2Zmc2V0V2lkdGggLyAxLjUpID8gKGNvbHVtbkVsLm9mZnNldFdpZHRoIC8gMikgOiBjb2x1bW5FbC5vZmZzZXRXaWR0aDtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbHVtblNpemUoc2F2ZWRXaWR0aCwgZGVmYXVsdEtleSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuYXBwbHlDb2x1bW5TaXplKHNhdmVkV2lkdGgsIGNvbHVtbkVsLCBjb2x1bW5OYW1lKTtcblxuICAgICAgICAgICAgdGhpcy50b3RhbFdpZHRoICs9IHNhdmVkV2lkdGg7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2hlY2tBbmRJbml0aWFsaXplKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuaW5pdGlhbGl6ZWQpIHJldHVybjtcblxuICAgICAgICAgICAgaWYgKCF0aGlzLnRhYmxlQ29udGVudCkgdGhpcy50YWJsZUNvbnRlbnQgPSB0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3Rvcih0aGlzLnRhYmxlQ29udGVudFNlbGVjdG9yKTtcbiAgICAgICAgICAgIHRoaXMudGFibGUgPSB0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3Rvcih0aGlzLnRhYmxlU2VsZWN0b3IpO1xuXG4gICAgICAgICAgICBpZih0aGlzLnRhYmxlKXtcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRpYWxpemVSZXNpemVkQ29sdW1uKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgY3JlYXRlSGFuZGxlQmFyKGNvbHVtbkVsLCBjb2x1bW5OYW1lKXtcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nSGFuZGxlQmFyID0gY29sdW1uRWwucXVlcnlTZWxlY3RvcihgLiR7dGhpcy5oYW5kbGVCYXJDbGFzc05hbWV9YCk7XG4gICAgICAgICAgICBpZihleGlzdGluZ0hhbmRsZUJhcikgcmV0dXJuO1xuXG4gICAgICAgICAgICBjb25zdCBoYW5kbGVCYXJFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgICAgICAgICBoYW5kbGVCYXJFbC50eXBlID0gXCJidXR0b25cIjtcbiAgICAgICAgICAgIGhhbmRsZUJhckVsLmNsYXNzTGlzdC5hZGQodGhpcy5oYW5kbGVCYXJDbGFzc05hbWUpO1xuICAgICAgICAgICAgaGFuZGxlQmFyRWwudGl0bGUgPSBcIlJlc2l6ZSBjb2x1bW5cIjtcblxuICAgICAgICAgICAgY29sdW1uRWwuYXBwZW5kQ2hpbGQoaGFuZGxlQmFyRWwpO1xuXG4gICAgICAgICAgICBoYW5kbGVCYXJFbC5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIChlKSA9PiB0aGlzLnN0YXJ0UmVzaXplKGUsIGNvbHVtbkVsLCBjb2x1bW5OYW1lKSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc3RhcnRSZXNpemUoZXZlbnQsIGVsZW1lbnQsIGNvbHVtbk5hbWUpe1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgICAgICAgICBpZihldmVudCkgZXZlbnQudGFyZ2V0LmNsYXNzTGlzdC5hZGQoXCJhY3RpdmVcIik7XG5cbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0WCA9IGV2ZW50LnBhZ2VYO1xuICAgICAgICAgICAgY29uc3Qgb3JpZ2luYWxFbGVtZW50V2lkdGggPSBNYXRoLnJvdW5kKGVsZW1lbnQub2Zmc2V0V2lkdGgpO1xuICAgICAgICAgICAgY29uc3Qgb3JpZ2luYWxUYWJsZVdpZHRoID0gTWF0aC5yb3VuZCh0aGlzLnRhYmxlLm9mZnNldFdpZHRoKTtcbiAgICAgICAgICAgIGNvbnN0IG9yaWdpbmFsV3JhcHBlcldpZHRoID0gTWF0aC5yb3VuZCh0aGlzLnRhYmxlQ29udGVudC5vZmZzZXRXaWR0aCk7XG5cbiAgICAgICAgICAgIGNvbnN0IG9uTW91c2VNb3ZlID0gdGhpcy50aHJvdHRsZSgobW92ZUV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYobW92ZUV2ZW50LnBhZ2VYID09PSBzdGFydFgpIHJldHVybjtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGRlbHRhID0gbW92ZUV2ZW50LnBhZ2VYIC0gc3RhcnRYO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50V2lkdGggPSBNYXRoLnJvdW5kKFxuICAgICAgICAgICAgICAgICAgICBNYXRoLm1pbih0aGlzLm1heENvbHVtbldpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5tYXgodGhpcy5taW5Db2x1bW5XaWR0aCwgb3JpZ2luYWxFbGVtZW50V2lkdGggKyBkZWx0YSAtIDE2KVxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IG5ld1RhYmxlV2lkdGggPSBvcmlnaW5hbFRhYmxlV2lkdGggLSBvcmlnaW5hbEVsZW1lbnRXaWR0aCArIHRoaXMuY3VycmVudFdpZHRoO1xuXG4gICAgICAgICAgICAgICAgdGhpcy50YWJsZS5zdHlsZS53aWR0aCA9IG5ld1RhYmxlV2lkdGggPiBvcmlnaW5hbFdyYXBwZXJXaWR0aCA/IGAke25ld1RhYmxlV2lkdGh9cHhgIDogXCJhdXRvXCI7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmFwcGx5Q29sdW1uU2l6ZSh0aGlzLmN1cnJlbnRXaWR0aCwgZWxlbWVudCwgY29sdW1uTmFtZSk7XG5cbiAgICAgICAgICAgIH0sIDUwKVxuXG4gICAgICAgICAgICBjb25zdCBvbk1vdXNlVXAgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50KSBldmVudC50YXJnZXQuY2xhc3NMaXN0LnJlbW92ZShcImFjdGl2ZVwiKTtcblxuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlQ29sdW1uU2l6ZSh0aGlzLmN1cnJlbnRXaWR0aCwgY29sdW1uTmFtZSk7XG5cbiAgICAgICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIG9uTW91c2VNb3ZlKTtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCBvbk1vdXNlVXApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIG9uTW91c2VNb3ZlKTtcbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIG9uTW91c2VVcCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYXBwbHlDb2x1bW5TaXplKHdpZHRoLCBlbGVtZW50LCBjb2x1bW5OYW1lKXtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSB0aGlzLnNhbml0aXplQ29sdW1uTmFtZShjb2x1bW5OYW1lKTtcbiAgICAgICAgICAgIHRoaXMudGFibGUucXVlcnlTZWxlY3RvckFsbCh0aGlzLnRhYmxlQ2VsbFNlbGVjdG9yICsgbmFtZSlcbiAgICAgICAgICAgICAgICAuZm9yRWFjaCgoY2VsbCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldENvbHVtblN0eWxlcyhjZWxsLCB3aWR0aCk7XG4gICAgICAgICAgICAgICAgICAgIGNlbGwuc3R5bGUub3ZlcmZsb3cgPSBcImhpZGRlblwiO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNldENvbHVtblN0eWxlcyhlbGVtZW50LCB3aWR0aCl7XG4gICAgICAgICAgICBlbGVtZW50LnN0eWxlLndpZHRoID0gd2lkdGggPyBgJHt3aWR0aH1weGAgOiBcImF1dG9cIjtcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUubWluV2lkdGggPSB3aWR0aCA/IGAke3dpZHRofXB4YCA6IFwiYXV0b1wiO1xuICAgICAgICAgICAgZWxlbWVudC5zdHlsZS5tYXhXaWR0aCA9IHdpZHRoID8gYCR7d2lkdGh9cHhgIDogXCJhdXRvXCI7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdXBkYXRlQ29sdW1uU2l6ZSh3aWR0aCwgY29sdW1uTmFtZSl7XG4gICAgICAgICAgICBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKFxuICAgICAgICAgICAgdGhpcy5nZXRTdG9yYWdlS2V5KGNvbHVtbk5hbWUpLFxuICAgICAgICAgICAgTWF0aC5tYXgoXG4gICAgICAgICAgICAgICAgdGhpcy5taW5Db2x1bW5XaWR0aCxcbiAgICAgICAgICAgICAgICBNYXRoLm1pbih0aGlzLm1heENvbHVtbldpZHRoLCB3aWR0aClcbiAgICAgICAgICAgICkudG9TdHJpbmcoKVxuICAgICAgICApO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldFNhdmVkV2lkdGgobmFtZSkge1xuICAgICAgICAgICAgY29uc3Qgc2F2ZWRXaWR0aCA9IHNlc3Npb25TdG9yYWdlLmdldEl0ZW0odGhpcy5nZXRTdG9yYWdlS2V5KG5hbWUpKTtcbiAgICAgICAgICAgIHJldHVybiBzYXZlZFdpZHRoID8gcGFyc2VJbnQoc2F2ZWRXaWR0aCkgOiBudWxsO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldFN0b3JhZ2VLZXkobmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIGAke3RoaXMudGFibGVLZXl9X2NvbHVtbldpZHRoXyR7bmFtZX1gO1xuICAgICAgICB9LFxuXG4gICAgICAgIHRocm90dGxlKGNhbGxiYWNrLCBsaW1pdCkge1xuICAgICAgICAgICAgbGV0IHdhaXQgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgICAgICAgICAgICAgIGlmICghd2FpdCl7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICB3YWl0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3YWl0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH0sIGxpbWl0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuXG4gICAgICAgIHNhbml0aXplQ29sdW1uTmFtZShuYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gbmFtZS5yZXBsYWNlQWxsKCdfJywgJy0nKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBZSxTQUFSLHFCQUFzQyxFQUFDLFNBQVMsY0FBYSxHQUFFO0FBQ2xFLFNBQU87QUFBQSxJQUNIO0FBQUEsSUFDQTtBQUFBLElBQ0EsZ0JBQWdCO0FBQUEsSUFDaEIsZ0JBQWdCO0FBQUEsSUFD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
