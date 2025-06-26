import Sortable from 'sortablejs';

export default function (Alpine) {
    Alpine.directive('robusta-sortable', (el, { expression }, { evaluateLater, cleanup }) => {
        const evaluate = evaluateLater(expression);
        console.log(evaluate);

        const sortable = Sortable.create(el, {
            animation: 150,
            dataIdAttr: 'x-sortable-item',
            handle: '.robusta-sortable-handle',
            onSort() {
                const sortedSubset = sortable.toArray()

                evaluate((value) => {
                    const { data, fixed = [] } = value

                    if (!Array.isArray(data)) return

                    // Sisipkan hasil urutan baru ke posisi lama, menjaga fixed
                    let result = []
                    let i = 0, j = 0
                    while (i < data.length) {
                        if (fixed.includes(data[i])) {
                            result.push(data[i])
                        } else {
                            result.push(sortedSubset[j])
                            j++
                        }
                        i++
                    }

                    // Update original data array secara langsung
                    data.splice(0, data.length, ...result)

                    // Trigger event kalau perlu
                    el.dispatchEvent(new CustomEvent('sorted', { detail: [...data] }))
                })
            },
        });

        /// Reaktif terhadap isLoading (optional)
        const stop = Alpine.effect(() => {
            evaluate((value) => {
                sortable.option('disabled', !!value?.isLoading)
            })
        })

        cleanup(() => {
            stop()
            sortable.destroy()
        })
    });
}
