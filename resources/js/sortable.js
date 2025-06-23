import Sortable from 'sortablejs';

export default function (Alpine) {
    Alpine.directive('robusta-sortable', (el, { expression }, { evaluate }) => {
        const sortable = Sortable.create(el, {
            animation: 150,
            dataIdAttr: 'x-sortable-item',
            handle: '.robusta-sortable-handle',
            onSort() {
                el.dispatchEvent(
                    new CustomEvent('sorted', {
                        detail: sortable.toArray()
                    })
                )
            }
        })

        if (expression) {
            Alpine.effect(() => {
                const isLoading = evaluate(expression)
                sortable.option('disabled', !!isLoading)
            })
        }
    })
}
