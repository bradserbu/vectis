'use strict';

// ** Dependencies
const _ = require('lodash');
const EventEmitter = require('events').EventEmitter;

function loadService(service) {}

class Program extends EventEmitter {
    constructor(options) {
        super();

        this.name = options.name;
        this.description = options.description;
        this.version = options.version;

        this.services = _.forEach(options.services, loadService);
    }

    start() {

    }

    stop() {

    }
}