'use strict';

function resolveAction(action) {}

class RestEndpoint extends EventEmitter {
    constructor(options) {
        super();

        this.path = options.path;
        this.method = options.method;
        this.action = resolveAction(options.action);
    }
}