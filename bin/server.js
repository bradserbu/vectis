#!/usr/bin/env node
'use strict';

// ** Defaults
const DEFAULT_SERVER_JSON = './server.json'; // Use Current Working Directory server.json file

// ** Dependencies
const yargs = require('yargs');
const server = require('../src/server');
const files = require('../src/files');
const errors = require('../src/errors');

function loadServerJson(filepath) {

    // Set filepath or use defaults
    filepath = filepath
        ? files.resolve(filepath)
        : DEFAULT_SERVER_JSON;

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

// ** Program
const json = loadServerJson();

console.log(json);