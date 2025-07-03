import resizedColumn from './resized-column'
import sortable from './sortable'

export default function initRobustaTable({ resizedColumn: resizedColumnProps }) {
    return {
        init() {
            this.registerDirective()
        },
        registerDirective() {
            Alpine.plugin(sortable)
        },
        registerPlugin() {
            resizedColumn(this.$el, resizedColumnProps)
        }
    }
}
