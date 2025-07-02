import resizedColumn from './resized-column'
import sortable from './sortable'

export default function initTable({ resizedColumn: resizedColumnProps }) {
    return {
        init() {
            Alpine.plugin(sortable)
            resizedColumn(this.$el, resizedColumnProps)
        }
    }
}
