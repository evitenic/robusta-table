export default function robustaTableColumnManager({columns, isLive}){
    return {
        error: undefined,
        isLoading: false,
        columns,
        isLive,

        init() {
            if (!this.columns || this.columns.length === 0) {
                this.columns = []

                return
            }
        },

        get groupedColumns() {
            const groupedColumns = {};

            this.columns
            .filter((column) => column.type === 'group')
            .forEach((column) => {
                groupedColumns[column.name] = this.calculateGroupedColumns(column);
            });

            return groupedColumns;
        },

        calculateGroupedColumns(group){
            const visibleChildren = group?.columns?.filter((column) => !column.isHidden && (column.isToggleable && column.isReorderable)) ?? [];

            if(visibleChildren.length === 0){
                return {
                    hidden: true,
                    checked: false,
                    disabled: false,
                    indeterminate: false,
                };
            }

            const toggleableChildren = group.columns.filter(
                (column) => !column.isHidden && column.isToggleable !== false,
            );

            if(toggleableChildren.length === 0){
                return {checked: true, disabled: true, indeterminate: false};
            }

            const toggledChildren = toggleableChildren.filter(
                (column) => column.isToggled
            ).length;

            const nonToggleableChildren = group.column.filter(
                (column) => !column.isHidden && column.isToggleable === false
            );

            if (toggledChildren === 0 && nonToggleableChildren.length > 0) {
                return { checked: true, disabled: false, indeterminate: true }
            }

            if (toggledChildren === 0) {
                return { checked: false, disabled: false, indeterminate: false }
            }

            if (toggledChildren === toggleableChildren.length) {
                return { checked: true, disabled: false, indeterminate: false }
            }

            return { checked: true, disabled: false, indeterminate: true }
        },

        getColumn(name, groupName = null){
            if(groupName){
                return;
            }

            return this.columns.find((column) => column.name === name);
        },

        toggleColumn(name, groupName = null){
            const column = this.getColumn(name, groupName);

            if(!column || column.isToggleable === false){
                return;
            }

            column.isToggled = !column.isToggled;
            this.columns = [...this.columns];

            if(this.isLive){
                this.applyTableColumnManager();
            };
        },

        reorderColumns(sortedIds){
            const newOrder = sortedIds.map((id) => id.split('::'));
            this.reorderTopLevel(newOrder);

            if (this.isLive) {
                this.applyTableColumnManager()
            }
        },

        reorderGroupColumns(sortedIds, groupName) {
            const group = this.columns.find(
                (column) =>
                    column.type === 'group' && column.name === groupName,
            )

            if (!group) {
                return
            }

            const newOrder = sortedIds.map((id) => id.split('::'))
            const reordered = []

            newOrder.forEach(([type, name]) => {
                const item = group.columns.find(
                    (column) => column.name === name,
                )

                if (item) {
                    reordered.push(item)
                }
            })

            group.columns = reordered
            this.columns = [...this.columns]

            if (this.isLive) {
                this.applyTableColumnManager()
            }
        },

        reorderTopLevel(newOrder){
            const cloned = this.columns;
            const reordered = [];
            // Keep track of which newOrder items we’ve already placed
            const placed = new Set();

            cloned.forEach((column) => {
                // Check if this column exists in newOrder
                const orderItem = newOrder.find(([type, name]) => {
                    if (type === 'group') {
                        return column.type === 'group' && column.name === name;
                    } else if (type === 'column') {
                        return column.type !== 'group' && column.name === name;
                    }
                    return false;
                });

                if (orderItem) {
                    // Find its index in newOrder
                    const index = newOrder.indexOf(orderItem);

                    // If not already placed, insert all pending newOrder items up to this one
                    for (let i = 0; i <= index; i++) {
                        if (!placed.has(i)) {
                            const [type, name] = newOrder[i];
                            const item = cloned.find(column => {
                                if (type === 'group') {
                                    return column.type === 'group' && column.name === name;
                                } else {
                                    return column.type !== 'group' && column.name === name;
                                }
                            });

                            if (item) {
                                reordered.push(item);
                                placed.add(i);
                            }
                        }
                    }
                } else {
                    // Column not in newOrder → just keep it in place
                    reordered.push(column);
                }
            });
            this.columns = reordered;
        },

        async applyTableColumnManager() {
            this.isLoading = true;

            try {
                await this.$wire.call('applyTableColumnManager', this.columns)

                this.error = undefined
            } catch (error) {
                this.error = 'Failed to update column visibility'

                console.error('Table toggle columns error:', error)
            } finally {
                this.isLoading = false
            }
        },

    };
}
