'use strict';

// ** Dependencies
const _ = require('lodash');
const util = require('util');
const EventEmitter = require('events').EventEmitter;

function loadProvider(provider) {}

function loadParameters(parameters) {}

class ServiceAction extends EventEmitter {
    constructor(options) {

        this.name = options.name;
        this.description = options.description;
        this.provider = loadProvider(options.provider);
        this.parameters = loadParameters(options.parameters);
    }
}

class Service extends EventEmitter {
    constructor(name, options) {

        this.name = name; // ie: admin/users
        this.options = options;

        // Sent 'initialized' event notification
        this.emit('initialized', this);
    }

    /**
     * Start the service
     */
    start() {

        // Send 'started' event notification
        this.emit('started', this);
    }

    /**
     * Stops the service
     */
    stop() {

        // Send 'stopped' event notification
        this.emit('stopped', this);
    }

    /**
     * Run an action that is part of the service.
     * @param action
     * @param args
     * @param options
     */
    run(action, args, options) {

    }
}

function createService(name, options) {

    // createServer({name:...}) -> createServer(name, {...}
    if (arguments.length == 1 && util.isObject(arguments[0]))
        return createServer(arguments[0].name, arguments[0]);

    const service = new Service(name, options);

    return service;
}

module.exports = createService;