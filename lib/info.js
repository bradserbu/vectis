#!/usr/bin/env node
'use strict';

// ** Constants
const DEFAULT_PROGRAM_JSON = 'program.json'; // Default Location for Program Information

// ** Dependencies
const util = require('util');
const path = require('path');
const files = require('../src/files');
const errors = require('../src/errors');
const logger = require('../src/logger');

/**
 * Load Program Information
 */
function getInfo(program) {

    logger.debug('ARGUMENTS', {arguments: arguments});

    program = program || DEFAULT_PROGRAM_JSON;

    // getInfo(filepath:string)
    if (util.isString(arguments[0])) {

        const filepath = files.resolve(arguments[0]);

        if (files.isDirectory(filepath)) {
            program = path.join(filepath, DEFAULT_PROGRAM_JSON);
        }

        program = files.requireFile(program);
        return getInfo(program);
    }

    if (!program)
        throw errors('PROGRAM_NOT_FOUND', 'The program.json file could not be found.');

    const name = program.name;
    const version = program.version;
    const description = program.description || '';
    const commands = program.commands;

    const program_info = {
        name: name,
        version: version,
        description: description,
        commands: commands
    };

    return program_info;
}

// ** Load the current program
module.exports = getInfo;