#!/usr/bin/env node
'use strict';

// ** Constants
const DEFAULT_PROGRAM_DEFINITION = './program.json'; // Default Location for Program Information
const DEFAULT_PROGRAM_VERSION = 'dev';

// ** Dependencies
const util = require('util');
const files = require('../src/files');

/**
 * Load Program Information
 */
function programInformation(program) {

    // programInformation()
    if (arguments.length === 0)
        return programInformation(DEFAULT_PROGRAM_DEFINITION);

    // programInformation(filepath:string)
    if (arguments.length && util.isString(arguments[0]))
        return programInformation(files.requireFile(program));

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
const program = programInformation();
console.log(program);