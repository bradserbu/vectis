'use strict';

// ** Constants
const DEFAULT_PROGRAM_JSON = 'program.json'; // Default Location for Program Information
const STATS_INTERVAL = 10 * 1000; // 10 seconds

// ** Dependencies
const util = require('util');
const path = require('path');
const files = require('./files');
const errors = require('./errors');
const logger = require('./logger');
const EventEmitter = require('events').EventEmitter;
const uuid = require('uuid');
const measured = require('measured');

/**
 * Load Program Information
 */
function getInfo(program) {

    logger.debug('ARGUMENTS', {arguments: arguments});

    program = program || DEFAULT_PROGRAM_JSON;

    // getInfo(filepath:string)
    if (util.isString(program)) {
        let filepath = files.resolve(program);

        if (!files.existsSync(filepath))
            throw errors('PROGRAM_NOT_FOUND', 'The package.json could not be found.');

        if (files.isDirectory(filepath))
            filepath = path.join(filepath, DEFAULT_PROGRAM_JSON);

        program = files.requireFile(filepath);
    }

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

// ** Track Program Level Events
const program_events = new EventEmitter();

// ** Load a unique program ID (in case this module gets loaded twice for the same process.)
const program_id = uuid();
logger.debug('PROGRAM_INSTANCE', {id: program_id});

/**
 * Send the Shutdown event throughout the program
 */
function shutdown() {
    // ** Fire the shutdown event
    logger.debug('**** SHUTDOWN SIGNAL RECEIVED ****');

    program_events.emit('shutdown');
}

function interval() {

    const timer = setInterval.apply(null, arguments);

    // ** Stop timer on shutdown
    program_events.on('shutdown', () => {
        clearInterval(timer)
    });

    return timer;
}

function timeout() {
    const timer = setTimeout.apply(null, arguments);

    program_events.on('shutdown', () => {
        clearTimeout(timer)
    });

    return timer;
}

// ** Program Statistics
const program_stats = measured.createCollection();

// ** Report Program Statistics
interval(() => {
    if (Object.keys(program_stats._metrics).length > 0)
        logger.info('PROGRAM_STATS', JSON.parse(JSON.stringify(program_stats)));
}, STATS_INTERVAL);

// ** Report final Program Stats on Exit
program_events.on('shutdown', () => {
    if (Object.keys(program_stats._metrics).length > 0)
        logger.info('PROGRAM_FINAL_STATS', JSON.parse(JSON.stringify(program_stats)));

    program_stats.end();
});

// ** Exports
module.exports.on = program_events.on.bind(program_events);
module.exports.emit = program_events.emit.bind(program_events);
module.exports.shutdown = shutdown;
module.exports.timeout = timeout;
module.exports.interval = interval;
module.exports.stats = program_stats;
module.exports.getInfo = getInfo;
