window.addEventListener('scroll', function (e) {
    var progressBar = document.querySelector('.progress-bar');
    
    if (progressBar) {
        var bodyHeight = document.body.scrollHeight;
        var scrollTop = window.scrollY;
        var windowHeight = window.innerHeight;
        var percentage = (scrollTop / (bodyHeight - windowHeight)) * 100;
        
        var inner = progressBar.querySelector('.progress-bar__inner');
        if (inner) {
            inner.style.height = percentage + '%';
        }
        
        var progressNumber = progressBar.querySelector('.progress-bar__number');
        if (progressNumber) {
            progressNumber.textContent = Math.round(percentage) + '%';
            progressNumber.style.top = percentage + '%';
        }
    }
});