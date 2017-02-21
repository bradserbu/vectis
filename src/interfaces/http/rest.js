'use strict';

// ** Dependencies
const _ = require('lodash');
const EventEmitter = require('events').EventEmitter;

function resolveAction(action) {}

class RestEndpoint extends EventEmitter {
    constructor(options) {
        super();

        this.path = options.path;
        this.method = options.method;
        this.action = resolveAction(options.action);
    }
}

function loadEndpoint(endpoint) {
    // TODO: Load Endpoint
}

class RestInterface extends EventEmitter {
    constructor(options) {
        super();

        this.path = options.path;
        this.endpoints = _.forEach(options.endpoints, loadEndpoint);
    }
}

// ** Exports
module.exports = RestInterface;