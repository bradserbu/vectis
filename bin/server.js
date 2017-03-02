#!/usr/bin/env node
'use strict';

// ** Defaults
const DEFAULT_SERVER_JSON = 'server.json'; // Use Current Working Directory server.json file

// ** Dependencies
const yargs = require('yargs');
const path = require('path');
const Server = require('../src/server');
const files = require('../src/files');
const errors = require('../src/errors');
const logger = require('../src/logger');

function loadServerJson(filepath) {

    // Set filepath or use defaults
    filepath = filepath
        ? files.resolve(filepath)
        : DEFAULT_SERVER_JSON;

    // If filepath is a directory -> append program.json
    if (files.isDirectory(filepath))
        filepath = path.join(filepath, 'server.json');

    // Ensure json file exists
    if (!files.existsSync(filepath)) {
        throw errors('SERVER_JSON_NOT_FOUND', 'The server.json file could not be located', {
            filepath: filepath
        });
    }

    // Parse JSON
    const json = files.requireFile(filepath);

    // Return JSON definition for the server
    return json;
}

// Parse Command Line Arguments
const argv = yargs.argv;
const args = {
    server_json: argv._.shift()
};

// Load Server
const json = loadServerJson(args.server_json);

logger.debug('SERVER_JSON', json);
const server = Server(json);

console.log('SERVER', server);