function portIsTaken(port, fn) {
    return new Promise((resolve, reject) => {
        var net = require('net')
        var tester = net.createServer()
            .once('error', function (err) {
                return resolve(true);
                if (err.code != 'EADDRINUSE') return fn(false)
                //   fn(true, true)
            })
            .once('listening', function () {
                tester.once('close', e => {
                    resolve(false);
                }).close()
            })
            .listen(port);
    });
}


module.exports = portIsTaken;