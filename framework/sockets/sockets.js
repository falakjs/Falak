const io = require('socket.io')(2020);
const clients = require('./clients');

class Sockets {
    init() {
        io.on('connection', client => {
            clients.add(client);
            client.on('start-compiling-sass', direction => {
                if (isWatchingSassFiles[direction]) return;
                startWatchingSassFiles(direction);
            }).on('disconnect', () => {
                clients.remove(client);
            });
        });
    }
}

module.exports = new Sockets;