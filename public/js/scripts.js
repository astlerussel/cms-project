document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('editor-container')) {
        const quill = new Quill('#editor-container', {
            theme: 'snow'
        });

        const form = document.querySelector('form');
        form.onsubmit = () => {
            const content = document.querySelector('textarea[name=content]');
            content.value = quill.root.innerHTML;
        };
    }
});
