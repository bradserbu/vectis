'use strict';

// ** Constants
const DEFAULT_DEPTH = 5;

// ** Dependencies
const util = require('util');

// ** Exports
module.exports = config => {

    config = config || {};

    return msg => console.error(
        util.inspect(msg, {depth: config.depth || DEFAULT_DEPTH}));
};