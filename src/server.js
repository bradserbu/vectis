'use strict';

// ** Dependencies
const _ = require('lodash');
const EventEmitter = require('events').EventEmitter;

function loadService(service) {}

function loadInterface(inter) {}

class Server extends EventEmitter {
    constructor(name) {
        super();

        this.name = name;
    }

    loadService(service) {

    }

    //noinspection JSAnnotator
    loadInterface(interface) {

    }

    initialize(options) {

        // Initialize Services
        _.forEach(options.services, this.loadService);

        // Initialize Interfaces
        _.forEach(options.interfaces, this.loadInterface);

        this.emit('initialized', this);
    }

    start() {
        this.emit('started', this);
    }

    stop() {
        this.emit('stopped', this);
    }
}

function createServer(name, options) {
    const server = new Server(name);

    server.initialize(options);
    return server;
}

// ** Exports
module.exports = Server;