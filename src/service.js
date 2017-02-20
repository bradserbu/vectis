'use strict';

// ** Dependencies
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
    constructor(options) {

        this.address = options.address; // ie: admin/users
    }

    /**
     * Start the service
     */
    start() {

    }

    /**
     * Stops the service
     */
    stop() {

    }

    /**
     * Run an action that is part of the service.
     * @param action
     */
    run(action) {

    }
}

function createService(service) {

}

module.exports = createService;