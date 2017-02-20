'use strict';

// ** Dependencies
const _ = require('lodash');

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