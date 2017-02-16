'use strict';

// ** Dependencies
const LOG_LEVELS = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'];
const DEFAULT_LEVEL = 'INFO';

// ** Libraries
const _ = require('lodash');
const extend = require('extend');
const path = require('path');

// ** Framework
const functions = require('./functions');
const files = require('./files');
const errors = require('./errors');

/**
 * Trim a path up to a specified directory
 * @param path
 * @param trim_to
 * @returns {string}
 */
function trimPath(filename, trim_to) {
    const filepath = path.parse(filename);

    // ** Build up an array of paths we want to trim
    const to_replace = filepath.dir.split('/');
    while (to_replace.length)
        if (to_replace.pop() === trim_to)
            break;

    // ** Check if we have something left to trim and replace it
    if (to_replace.length > 0)
        filepath.dir = filepath.dir.replace(to_replace.join('/'), '');

    return path.format(filepath);
}


function Message(args) {

    const result = {
        message: '',
        data: {}
    };

    _.each(args, arg => {
        if (_.isString(arg)) {
            result.message = result.message ? result.message += ` ${arg}` : arg;
        } else {
            if(arg && arg.message){
                result.message = result.message ? result.message += ` ${arg.message}` : arg.message;
                delete arg.message;
            }
            if (arg && arg.loggingContext){
                for(var p in arg.loggingContext){
                    result[p] = arg.loggingContext[p];
                }
                delete arg.loggingContext;
            }
            extend(true, result.data, arg);
        }
    });

    return result;
}

function createLogger(options) {

    options = options || {};

    const levels = options.levels || LOG_LEVELS;
    const level = options.level ? options.level.toUpperCase() : DEFAULT_LEVEL;
    const index = level => levels.indexOf(level.toUpperCase());

    // ** Load a log provider.  file: prefix uses cwd() to resolve file
    const load_provider = provider => provider.type.startsWith('file:')
        ? files.requireFile(provider.type.replace('file:', ''))(provider)
        : require(provider.type)(provider);

    const log_providers = options.providers
        ? options.providers.map(load_provider)
        : [require('./loggers/console')()]; // Default to the console provider

    const logger = {
        options: options,
        level: level,
        // ** Send each log message to the underlying provider
        write: msg => _.each(log_providers, p => p(msg))
    };

    // ** Add a function to log message for each supported log level
    _.each(_.map(LOG_LEVELS,
        level => level.toLowerCase()),
        msg_level => {
            logger[msg_level] = function () {
                if (index(msg_level) <= index(logger.level))
                    logger.write(extend(true, {level: msg_level}, Message(arguments)));
            }
        });

    return logger;
}

// ** Create a Global Shared Application wide logger.
const logger = createLogger();

// ** Module Exports
module.exports = logger;
module.exports.setLevel = level => logger.level = level;
module.exports.createLogger = options => createLogger(extend(true, logger.options, options));