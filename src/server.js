'use strict';

// ** Dependencies
const _ = require('lodash');
const util = require('util');
const EventEmitter = require('events').EventEmitter;
const Service = require('./service');
const logger = require('./logger');

function loadService(service) {}

function loadInterface(inter) {}

class Server extends EventEmitter {
    constructor(name) {
        super();

        this.name = name;
        this.services = {};
        this.interfaces = {};
    }

    loadService(service) {

        const serviceName = service.name;

        this.services[serviceName] = Service(serviceName, service);
    }

    loadInterface(iface) {

    }

    start() {
        // ** Start Services

        this.emit('started', this);
    }

    stop() {
        this.emit('stopped', this);
    }
}

function createServer(name, options) {

    // createServer({name:...}) -> createServer(name, {...}
    if (arguments.length == 1 && util.isObject(arguments[0]))
        return createServer(arguments[0].name, arguments[0]);

    logger.debug('Initializing Server...', {name: name, options: options});

    const server = new Server(name);

    return server;
}

// ** Exports
module.exports = createServer;