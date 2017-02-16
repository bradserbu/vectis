'use strict';

// ** Constants
const STATS_INTERVAL = 10 * 1000; // 10 seconds

// ** Dependencies
const EventEmitter = require('events').EventEmitter;
const logger = require('./logger');
const uuid = require('uuid');
const measured = require('measured');

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