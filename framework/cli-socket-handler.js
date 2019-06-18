let socket = io('http://localhost:PORT');

let sassCompiler;

socket.on('reload', () => {
    window.stop();
    document.location.reload();
}).on('reconnected', () => {
    echo('Reconnected!');
    window.stop();
    document.location.reload();
}).on('sass-compiled', function (style) {
    if (sassCompiler) {
        sassCompiler.fadeOut(() => {
            sassCompiler.remove();
            sassCompiler = null;
        });
    }
    $('#app-style').attr('href', $('#app-style').attr('href') + '1');
}).on('sass-compiler-error', error => {
    if (sassCompiler) sassCompiler.remove();
    sassCompiler = `<div class="compiler-error-wrapper">
            <div class="backdrop"></div>
            <h1 class="heading">Sass Compiler Error</h1>
            <div class="message">${error.message}</div>
            <div class="file">
                ${error.file} 
                <strong class="line">line: ${error.line}</strong>
            </div>
        </div>
    `;
    sassCompiler = $(sassCompiler).prependTo('body');
});

socket.emit('start-compiling-sass', $('html').attr('dir'));