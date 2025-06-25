export default function (Alpine) {
    Alpine.directive('robusta-resized-column', (el, { expression }, { evaluate }) => {
        const evaluated = evaluate(expression) || {};
        let { tableKey, minColumnWidth, maxColumnWidth, enable = false } = evaluated

        maxColumnWidth = maxColumnWidth === -1 ? Infinity : maxColumnWidth

        if (!enable) return;

        let currentWidth = 0

        const tableSelector = '.fi-ta-table';
        const tableWrapperContentSelector = '.fi-ta-content';
        const tableBodyCellPrefix = 'fi-table-cell-';
        const columnSelector = 'x-robusta-table-column';


        const columns = el.querySelectorAll(`[${columnSelector}]`);

        let table = el.querySelector(tableSelector);
        let tableWrapper = el.querySelector(tableWrapperContentSelector);

        let handleBar = null

        if (table && tableWrapper) {
            init();
        }

        function init() {
            initializeColumnLayout()
        }

        function initializeColumnLayout() {
            let totalWidth = 0;

            columns.forEach(column => {
                column.classList.add("relative", "group/column-resize", "overflow-hidden");

                createHandleBar(column);

                const columnName = getColumnName(column);
                let savedWidth = getSavedWidth(columnName);

                if (!savedWidth) {
                    const defaultKey = `${columnName}_default`;
                    const defaultWidth = getSavedWidth(defaultKey);

                    if (defaultWidth) {
                        savedWidth = defaultWidth;
                        handleColumnUpdate(savedWidth, columnName);
                    } else {
                        savedWidth = column.offsetWidth;
                        handleColumnUpdate(savedWidth, defaultKey);
                    }
                }

                totalWidth += savedWidth;

                applyColumnWidth(savedWidth, column);
            });

            if (table && totalWidth) {
                table.style.maxWidth = `${totalWidth}px`;
            }
        }


        function createHandleBar(column) {
            const existingHandle = column.querySelector(".column-resize-handle-bar");
            if (existingHandle) existingHandle.remove();

            handleBar = document.createElement("button");
            handleBar.type = "button";
            handleBar.classList.add("column-resize-handle-bar");
            handleBar.title = "Resize column";

            column.appendChild(handleBar);

            handleBar.addEventListener("mousedown", (e) => startResize(e, column));

            handleBar.addEventListener("dblclick", (e) => handleDoubleClick(e, column));
        }

        function handleDoubleClick(event, column) {
            event.preventDefault();
            event.stopPropagation();
            const columnName = getColumnName(column);
            const defaultColumnName = columnName + '_default';
            const savedWidth = getSavedWidth(defaultColumnName) || minColumnWidth;

            if (savedWidth === column.offsetWidth) return;

            applyColumnWidth(savedWidth, column);
            handleColumnUpdate(savedWidth, columnName);
        }

        function startResize(event, column) {
            event.preventDefault();
            if (event) {
                event.target.classList.add("active");
            }

            const startX = event.pageX;
            const originalColumnWidth = Math.round(column.offsetWidth);
            const originalTableWidth = Math.round(table.offsetWidth);
            const originalWrapperWidth = Math.round(tableWrapper.offsetWidth);

            const onMouseMove = throttle((moveEvent) => {
                if (moveEvent.pageX === startX) return;
                const delta = moveEvent.pageX - startX;

                currentWidth = Math.round(
                    Math.min(
                        maxColumnWidth,
                        Math.max(minColumnWidth, originalColumnWidth + delta - 16)
                    )
                );

                const newTableWidth = originalTableWidth - originalColumnWidth + currentWidth;
                table.style.width = newTableWidth > originalWrapperWidth
                    ? `${newTableWidth}px`
                    : "auto";

                applyColumnWidth(currentWidth, column);
            }, 16);

            const onMouseUp = () => {
                if (event) event.target.classList.remove("active");

                handleColumnUpdate(currentWidth, getColumnName(column));

                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
            };

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        }


        function handleColumnUpdate(width, columnName) {
            saveWidthToStorage(width, columnName);
        }

        function applyColumnWidth(width, column) {
            setColumnStyles(column, width);
            const columnName = getColumnName(column);
            const cellSelector = `.${escapeCssClass(tableBodyCellPrefix + columnName)}`;
            table.querySelectorAll(cellSelector).forEach(cell => {
                setColumnStyles(cell, width);
                cell.style.overflow = "hidden";
            });
        }

        function setColumnStyles(el, width) {
            el.style.width = width ? `${width}px` : 'auto';
            el.style.minWidth = width ? `${width}px` : 'auto';
            el.style.maxWidth = width ? `${width}px` : 'auto';
        }

        function escapeCssClass(className) {
            return className.replace(/\./g, "\\.");
        }

        function throttle(callback, limit) {
            let wait = false;
            return function (...args) {
                if (!wait) {
                    callback.apply(this, args);
                    wait = true;
                    setTimeout(() => {
                        wait = false;
                    }, limit);
                }
            };
        }

        function getStorageKey(columnName) {
            return `${tableKey}_columnWidth_${columnName}`;
        }

        function getSavedWidth(columnName) {
            const savedWidth = sessionStorage.getItem(getStorageKey(columnName));
            return savedWidth ? parseInt(savedWidth) : null;
        }

        function saveWidthToStorage(width, columnName) {
            sessionStorage.setItem(
                getStorageKey(columnName),
                Math.max(
                    minColumnWidth,
                    Math.min(maxColumnWidth, width)
                ).toString()
            );
        }

        function getColumnName(column) {
            return column.getAttribute(columnSelector);
        }
    })
}
