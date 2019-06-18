class Clients {
    constructor() {
        this.clients = {};
    }

    /**
     * Add new client
     */
    add(client) {
        this.clients[client.id] = client;
    }

    /**
     * Remove client
     */
    remove(client) {
        delete this.clients[client.id];
    }

    /**
     * Execute the given callback on all clients
     */
    exec(callback) {
        Object.values(this.clients).map(callback);
    }
}

module.exports = new Clients;