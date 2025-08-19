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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vanMvcm9idXN0YS10YWJsZS5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZmlsYW1lbnRSb2J1c3RhVGFibGUoe2NvbHVtbnMsIHJlc2l6ZWRDb25maWd9KXtcbiAgICByZXR1cm4ge1xuICAgICAgICBjb2x1bW5zLFxuICAgICAgICByZXNpemVkQ29uZmlnLFxuICAgICAgICBtYXhDb2x1bW5XaWR0aDogLTEsXG4gICAgICAgIG1pbkNvbHVtbldpZHRoOiAwLFxuICAgICAgICBjdXJyZW50V2lkdGg6IDAsXG4gICAgICAgIHRhYmxlQ29udGVudFNlbGVjdG9yOiAnLmZpLXRhLWNvbnRlbnQtY3RuJyxcbiAgICAgICAgdGFibGVTZWxlY3RvcjogJy5maS10YS10YWJsZScsXG4gICAgICAgIHRhYmxlSGVhZGVyU2VsZWN0b3I6ICcuZmktdGEtaGVhZGVyLWNlbGwtJyxcbiAgICAgICAgdGFibGVDZWxsU2VsZWN0b3I6ICcuZmktdGEtY2VsbC0nLFxuICAgICAgICBoYW5kbGVCYXJDbGFzc05hbWU6ICdjb2x1bW4tcmVzaXplLWhhbmRsZS1iYXInLFxuICAgICAgICBlbGVtZW50OiBudWxsLFxuICAgICAgICBpbml0aWFsaXplZDogZmFsc2UsXG4gICAgICAgIHRhYmxlOiBudWxsLFxuICAgICAgICB0YWJsZUNvbnRlbnQ6IG51bGwsXG4gICAgICAgIHRhYmxlS2V5OiBudWxsLFxuICAgICAgICB0b3RhbFdpZHRoOiAwLFxuXG4gICAgICAgIGluaXQoKXtcbiAgICAgICAgICAgIExpdmV3aXJlLmhvb2soXCJlbGVtZW50LmluaXRcIiwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmKHRoaXMuaW5pdGlhbGl6ZWQpIHJldHVybjtcblxuICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tBbmRJbml0aWFsaXplKCk7XG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICBMaXZld2lyZS5ob29rKFwibW9ycGgudXBkYXRlZFwiLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IGZhbHNlO1xuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgdGhpcy5lbGVtZW50ID0gdGhpcy4kZWw7XG5cbiAgICAgICAgICAgIHRoaXMuJG5leHRUaWNrKCgpID0+IHRoaXMuY2hlY2tBbmRJbml0aWFsaXplKCkpO1xuXG4gICAgICAgICAgICB0aGlzLm9ic2VydmVGb3JUYWJsZSgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIG9ic2VydmVGb3JUYWJsZSgpIHtcbiAgICAgICAgICAgIGNvbnN0IG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5pbml0aWFsaXplZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNoZWNrQW5kSW5pdGlhbGl6ZSgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmluaXRpYWxpemVkKSB7XG4gICAgICAgICAgICAgICAgICAgIG9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIG9ic2VydmVyLm9ic2VydmUodGhpcy5lbGVtZW50LCB7XG4gICAgICAgICAgICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgICAgICAgICAgIHN1YnRyZWU6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGluaXRpYWxpemVSZXNpemVkQ29sdW1uKCkge1xuICAgICAgICAgICAgY29uc3Qge3RhYmxlS2V5LCBtaW5Db2x1bW5XaWR0aCwgbWF4Q29sdW1uV2lkdGgsIGVuYWJsZSA9IGZhbHNlfSA9IHRoaXMucmVzaXplZENvbmZpZztcblxuICAgICAgICAgICAgdGhpcy50YWJsZUtleSA9IHRhYmxlS2V5O1xuICAgICAgICAgICAgdGhpcy5taW5Db2x1bW5XaWR0aCA9IG1pbkNvbHVtbldpZHRoO1xuICAgICAgICAgICAgdGhpcy5tYXhDb2x1bW5XaWR0aCA9IG1heENvbHVtbldpZHRoID09PSAtMSA/IEluZmluaXR5IDogbWF4Q29sdW1uV2lkdGg7XG5cbiAgICAgICAgICAgIGlmKCFlbmFibGUpIHJldHVybjtcblxuICAgICAgICAgICAgaWYoIXRoaXMuY29sdW1ucyB8fCB0aGlzLmNvbHVtbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb2x1bW5zID0gW107XG5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLmNvbHVtbnMuZm9yRWFjaCgoY29sdW1uKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29sdW1uTmFtZSA9IHRoaXMuc2FuaXRpemVOYW1lKGNvbHVtbi5uYW1lKTtcbiAgICAgICAgICAgICAgICBjb25zdCBjb2x1bW5FbCA9IHRoaXMudGFibGUucXVlcnlTZWxlY3Rvcih0aGlzLnRhYmxlSGVhZGVyU2VsZWN0b3IgKyBjb2x1bW5OYW1lKVxuXG4gICAgICAgICAgICAgICAgdGhpcy5hcHBseUNvbHVtblN0eWxlKGNvbHVtbkVsLCBjb2x1bW4ubmFtZSwgY29sdW1uLmlzUmVzaXplZCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKHRoaXMudGFibGUgJiYgdGhpcy50b3RhbFdpZHRoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50YWJsZS5zdHlsZS5tYXhXaWR0aCA9IGAke3RoaXMudG90YWxXaWR0aH1weGA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgYXBwbHlDb2x1bW5TdHlsZShjb2x1bW5FbCwgY29sdW1uTmFtZSwgd2l0aEhhbmRsZUJhciA9IGZhbHNlKXtcbiAgICAgICAgICAgIGNvbnN0IGRlZmF1bHRLZXkgPSBgJHtjb2x1bW5OYW1lfV9kZWZhdWx0YDtcblxuICAgICAgICAgICAgaWYod2l0aEhhbmRsZUJhcikge1xuICAgICAgICAgICAgICAgIGNvbHVtbkVsLmNsYXNzTGlzdC5hZGQoXCJyZWxhdGl2ZVwiLCBcImdyb3VwL2NvbHVtbi1yZXNpemVcIiwgXCJvdmVyZmxvdy1oaWRkZW5cIik7XG4gICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVIYW5kbGVCYXIoY29sdW1uRWwsIGNvbHVtbk5hbWUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgc2F2ZWRXaWR0aCA9IHRoaXMuZ2V0U2F2ZWRXaWR0aChjb2x1bW5OYW1lKTtcbiAgICAgICAgICAgIGNvbnN0IGRlZmF1bHRXaWR0aCA9IHRoaXMuZ2V0U2F2ZWRXaWR0aChkZWZhdWx0S2V5KTtcblxuICAgICAgICAgICAgaWYoIXNhdmVkV2lkdGggJiYgZGVmYXVsdFdpZHRoKXtcbiAgICAgICAgICAgICAgICBzYXZlZFdpZHRoID0gZGVmYXVsdFdpZHRoO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZighc2F2ZWRXaWR0aCAmJiAhZGVmYXVsdFdpZHRoKXtcbiAgICAgICAgICAgICAgICBzYXZlZFdpZHRoID0gY29sdW1uRWwub2Zmc2V0V2lkdGggPiAodGhpcy50YWJsZS5vZmZzZXRXaWR0aCAvIDEuNSkgPyAoY29sdW1uRWwub2Zmc2V0V2lkdGggLyAyKSA6IGNvbHVtbkVsLm9mZnNldFdpZHRoO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlQ29sdW1uU2l6ZShzYXZlZFdpZHRoLCBkZWZhdWx0S2V5KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5hcHBseUNvbHVtblNpemUoc2F2ZWRXaWR0aCwgY29sdW1uRWwsIGNvbHVtbk5hbWUpO1xuXG4gICAgICAgICAgICB0aGlzLnRvdGFsV2lkdGggKz0gc2F2ZWRXaWR0aDtcbiAgICAgICAgfSxcblxuICAgICAgICBjaGVja0FuZEluaXRpYWxpemUoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5pbml0aWFsaXplZCkgcmV0dXJuO1xuXG4gICAgICAgICAgICBpZiAoIXRoaXMudGFibGVDb250ZW50KSB0aGlzLnRhYmxlQ29udGVudCA9IHRoaXMuZWxlbWVudC5xdWVyeVNlbGVjdG9yKHRoaXMudGFibGVDb250ZW50U2VsZWN0b3IpO1xuICAgICAgICAgICAgdGhpcy50YWJsZSA9IHRoaXMuZWxlbWVudC5xdWVyeVNlbGVjdG9yKHRoaXMudGFibGVTZWxlY3Rvcik7XG5cbiAgICAgICAgICAgIGlmKHRoaXMudGFibGUpe1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdGlhbGl6ZVJlc2l6ZWRDb2x1bW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBjcmVhdGVIYW5kbGVCYXIoY29sdW1uRWwsIGNvbHVtbk5hbWUpe1xuICAgICAgICAgICAgY29uc3QgZXhpc3RpbmdIYW5kbGVCYXIgPSBjb2x1bW5FbC5xdWVyeVNlbGVjdG9yKGAuJHt0aGlzLmhhbmRsZUJhckNsYXNzTmFtZX1gKTtcbiAgICAgICAgICAgIGlmKGV4aXN0aW5nSGFuZGxlQmFyKSByZXR1cm47XG5cbiAgICAgICAgICAgIGNvbnN0IGhhbmRsZUJhckVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgICAgICAgICAgIGhhbmRsZUJhckVsLnR5cGUgPSBcImJ1dHRvblwiO1xuICAgICAgICAgICAgaGFuZGxlQmFyRWwuY2xhc3NMaXN0LmFkZCh0aGlzLmhhbmRsZUJhckNsYXNzTmFtZSk7XG4gICAgICAgICAgICBoYW5kbGVCYXJFbC50aXRsZSA9IFwiUmVzaXplIGNvbHVtblwiO1xuXG4gICAgICAgICAgICBjb2x1bW5FbC5hcHBlbmRDaGlsZChoYW5kbGVCYXJFbCk7XG5cbiAgICAgICAgICAgIGhhbmRsZUJhckVsLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgKGUpID0+IHRoaXMuc3RhcnRSZXNpemUoZSwgY29sdW1uRWwsIGNvbHVtbk5hbWUpKTtcbiAgICAgICAgfSxcblxuICAgICAgICBzdGFydFJlc2l6ZShldmVudCwgZWxlbWVudCwgY29sdW1uTmFtZSl7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICAgICAgICAgIGlmKGV2ZW50KSBldmVudC50YXJnZXQuY2xhc3NMaXN0LmFkZChcImFjdGl2ZVwiKTtcblxuICAgICAgICAgICAgY29uc3Qgc3RhcnRYID0gZXZlbnQucGFnZVg7XG4gICAgICAgICAgICBjb25zdCBvcmlnaW5hbEVsZW1lbnRXaWR0aCA9IE1hdGgucm91bmQoZWxlbWVudC5vZmZzZXRXaWR0aCk7XG4gICAgICAgICAgICBjb25zdCBvcmlnaW5hbFRhYmxlV2lkdGggPSBNYXRoLnJvdW5kKHRoaXMudGFibGUub2Zmc2V0V2lkdGgpO1xuICAgICAgICAgICAgY29uc3Qgb3JpZ2luYWxXcmFwcGVyV2lkdGggPSBNYXRoLnJvdW5kKHRoaXMudGFibGVDb250ZW50Lm9mZnNldFdpZHRoKTtcblxuICAgICAgICAgICAgY29uc3Qgb25Nb3VzZU1vdmUgPSB0aGlzLnRocm90dGxlKChtb3ZlRXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICBpZihtb3ZlRXZlbnQucGFnZVggPT09IHN0YXJ0WCkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgZGVsdGEgPSBtb3ZlRXZlbnQucGFnZVggLSBzdGFydFg7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRXaWR0aCA9IE1hdGgucm91bmQoXG4gICAgICAgICAgICAgICAgICAgIE1hdGgubWluKHRoaXMubWF4Q29sdW1uV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBNYXRoLm1heCh0aGlzLm1pbkNvbHVtbldpZHRoLCBvcmlnaW5hbEVsZW1lbnRXaWR0aCArIGRlbHRhIC0gMTYpXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgbmV3VGFibGVXaWR0aCA9IG9yaWdpbmFsVGFibGVXaWR0aCAtIG9yaWdpbmFsRWxlbWVudFdpZHRoICsgdGhpcy5jdXJyZW50V2lkdGg7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnRhYmxlLnN0eWxlLndpZHRoID0gbmV3VGFibGVXaWR0aCA+IG9yaWdpbmFsV3JhcHBlcldpZHRoID8gYCR7bmV3VGFibGVXaWR0aH1weGAgOiBcImF1dG9cIjtcblxuICAgICAgICAgICAgICAgIHRoaXMuYXBwbHlDb2x1bW5TaXplKHRoaXMuY3VycmVudFdpZHRoLCBlbGVtZW50LCBjb2x1bW5OYW1lKTtcblxuICAgICAgICAgICAgfSwgNTApXG5cbiAgICAgICAgICAgIGNvbnN0IG9uTW91c2VVcCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQpIGV2ZW50LnRhcmdldC5jbGFzc0xpc3QucmVtb3ZlKFwiYWN0aXZlXCIpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVDb2x1bW5TaXplKHRoaXMuY3VycmVudFdpZHRoLCBjb2x1bW5OYW1lKTtcblxuICAgICAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgb25Nb3VzZU1vdmUpO1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIG9uTW91c2VVcCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgb25Nb3VzZU1vdmUpO1xuICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgb25Nb3VzZVVwKTtcbiAgICAgICAgfSxcblxuICAgICAgICBhcHBseUNvbHVtblNpemUod2lkdGgsIGVsZW1lbnQsIGNvbHVtbk5hbWUpe1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IHRoaXMuc2FuaXRpemVOYW1lKGNvbHVtbk5hbWUpO1xuICAgICAgICAgICAgdGhpcy50YWJsZS5xdWVyeVNlbGVjdG9yQWxsKHRoaXMudGFibGVDZWxsU2VsZWN0b3IgKyBuYW1lKVxuICAgICAgICAgICAgICAgIC5mb3JFYWNoKChjZWxsKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0Q29sdW1uU3R5bGVzKGNlbGwsIHdpZHRoKTtcbiAgICAgICAgICAgICAgICAgICAgY2VsbC5zdHlsZS5vdmVyZmxvdyA9IFwiaGlkZGVuXCI7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2V0Q29sdW1uU3R5bGVzKGVsZW1lbnQsIHdpZHRoKXtcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUud2lkdGggPSB3aWR0aCA/IGAke3dpZHRofXB4YCA6IFwiYXV0b1wiO1xuICAgICAgICAgICAgZWxlbWVudC5zdHlsZS5taW5XaWR0aCA9IHdpZHRoID8gYCR7d2lkdGh9cHhgIDogXCJhdXRvXCI7XG4gICAgICAgICAgICBlbGVtZW50LnN0eWxlLm1heFdpZHRoID0gd2lkdGggPyBgJHt3aWR0aH1weGAgOiBcImF1dG9cIjtcbiAgICAgICAgfSxcblxuICAgICAgICB1cGRhdGVDb2x1bW5TaXplKHdpZHRoLCBjb2x1bW5OYW1lKXtcbiAgICAgICAgICAgIHNlc3Npb25TdG9yYWdlLnNldEl0ZW0oXG4gICAgICAgICAgICB0aGlzLmdldFN0b3JhZ2VLZXkoY29sdW1uTmFtZSksXG4gICAgICAgICAgICBNYXRoLm1heChcbiAgICAgICAgICAgICAgICB0aGlzLm1pbkNvbHVtbldpZHRoLFxuICAgICAgICAgICAgICAgIE1hdGgubWluKHRoaXMubWF4Q29sdW1uV2lkdGgsIHdpZHRoKVxuICAgICAgICAgICAgKS50b1N0cmluZygpXG4gICAgICAgICk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0U2F2ZWRXaWR0aChuYW1lKSB7XG4gICAgICAgICAgICBjb25zdCBzYXZlZFdpZHRoID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbSh0aGlzLmdldFN0b3JhZ2VLZXkobmFtZSkpO1xuICAgICAgICAgICAgcmV0dXJuIHNhdmVkV2lkdGggPyBwYXJzZUludChzYXZlZFdpZHRoKSA6IG51bGw7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0U3RvcmFnZUtleShuYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gYCR7dGhpcy50YWJsZUtleX1fY29sdW1uV2lkdGhfJHtuYW1lfWA7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdGhyb3R0bGUoY2FsbGJhY2ssIGxpbWl0KSB7XG4gICAgICAgICAgICBsZXQgd2FpdCA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF3YWl0KXtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgIHdhaXQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdhaXQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfSwgbGltaXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2FuaXRpemVOYW1lKG5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiBuYW1lXG4gICAgICAgICAgICAgICAgLnNwbGl0KCcuJylcbiAgICAgICAgICAgICAgICAubWFwKHMgPT4gcy5yZXBsYWNlKC9fL2csICctJykucmVwbGFjZSgvKFthLXpdKShbQS1aXSkvZywgJyQxLSQyJykudG9Mb3dlckNhc2UoKSlcbiAgICAgICAgICAgICAgICAuam9pbignXFxcXC4nKTtcbiAgICAgICAgfVxuXG4gICAgfVxufVxuIl0sCiAgIm1h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
