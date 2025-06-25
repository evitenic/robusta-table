import resizedColumn from './resized-column'
import sortable from './sortable'

document.addEventListener('alpine:init', () => {
    Alpine.plugin(sortable)
    Alpine.plugin(resizedColumn)
})


