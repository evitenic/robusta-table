import './resized-column'
import sortable from './sortable'

document.addEventListener('alpine:init', () => {
    Alpine.plugin(sortable)
})


