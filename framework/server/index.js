const globalize = require('./../bootstrap/globals');
const clients = require('./../sockets/clients');
const buildApp = require('./../app-compiler');
const server = require('./server');
require('./globals');

class Server {
    constructor(command) {
        this.command = command;
        this.serverIsReadyToLunch = false;
        this.handleSockets();
        this.init();
        this.serve();
    }

    async handleSockets() {
        let port = process.env.SOCKET_PORT;

        const io = require('socket.io')(port);
        
        globalize('io', io);

        io.on('connection', client => {
            clients.add(client);
            client.on('disconnect', () => {
                clients.remove(client);
            });
        });
    }

    init() {
        echo.sameLine(cli.blueBright('Starting server...'));

        globalize('serverIsReady', (isReady = null) => {
            if (typeof isReady !== null) return this.serverIsReadyToLunch;
            return this.serverIsReadyToLunch = isReady;
        });
    }

    serve() {
        buildApp().then(() => {
            // require('./di-compiler');
            this.startApp();
        });
    }

    startApp() {
        this.serverIsReadyToLunch = true;
        server.start(this.command);
    }
}

module.exports = command => new Server(command);