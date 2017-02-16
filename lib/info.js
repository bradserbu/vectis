#!/usr/bin/env node
'use strict';

// ** Constants
const DEFAULT_PROGRAM_DEFINITION = 'program.json'; // Default Location for Program Information

// ** Dependencies
const util = require('util');
const files = require('../src/files');
const errors = require('../src/errors');
const logger = require('../src/logger');

/**
 * Load Program Information
 */
function getInfo(definition) {

    logger.debug('ARGUMENTS', {arguments: arguments});

    definition = definition || DEFAULT_PROGRAM_DEFINITION;

    // getInfo(filepath:string)
    if (util.isString(definition)) {
        definition = files.requireFile(definition);
    }

    if (!definition)
        throw errors('PROGRAM_NOT_FOUND', 'The program.json file could not be found.');

    const name = definition.name;
    const version = definition.version;
    const description = definition.description || '';
    const commands = definition.commands;

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