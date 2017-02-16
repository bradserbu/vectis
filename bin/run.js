#!/usr/bin/env node
'use strict';

// ** Program Options
const DEFAULT_OPTIONS = {
    loglevel: 'INFO',
    newline: true
};

// ** Dependencies
const _ = require('lodash');
const $ = require('highland');
const Q = require('bluebird-q');
const extend = require('extend');
const util = require('util');
const yargs = require('yargs');

// ** Platform
const functions = require('../src/functions');
const errors = require('../src/errors');
const logger = require('../src/logger');
const files = require('../src/files');
const Program = require('../src/program');

/**
 * Print the JSON representation of a value considering the optional newline value
 * @param value - The value to stringify
 */
function stringify(value) {
    if (options.newline)
        return JSON.stringify(value, null, 2);

    return JSON.stringify(value);
}

/**
 * Checks if the value supplied is a promise.
 * @param value
 */
function isPromise(value) {
    return util.isFunction(value.then);
}

/**
 * Returns if a value is a readable stream
 * @param value
 * @returns {*}
 */
function isStream(value) {
    return util.isFunction(value.pipe);
}

/**
 * Print an error to the output stream.
 * @param err
 */
function print_error(err) {
    // ** Print the error and exit
    console.error(err);
}

/**
 * Display an error or a result to the output.
 * @param err
 * @param result
 */
function print(result) {
    // return jobs
    //     .results(result)
    //     .then(result => console.log(stringify(result)));

    if (isPromise(result)) {
        console.log('PROMISE!');
        return result.then(result => print(result));
    }

    if (isStream(result)) {

        let isFirst = true;

        return Q.Promise((resolve, reject) => {
            $(result)
                .map(result => {
                    if (isFirst) {
                        isFirst = false;
                        return '[\n' + stringify(result);
                    } else {
                        return ',' + '\n' + stringify(result);
                    }
                })
                .map(value => process.stdout.write(value))
                .errors(err => logger.error(errors('STREAM_ERROR', null, err)))
                .done(() => {
                    if (!isFirst)
                        process.stdout.write('\n]');

                    resolve();
                });
        });
    }

    return Q.resolve(process.stdout.write(stringify(result)));
}

/**
 * Create a function that can be called using named arguments
 * @param func
 * @returns {function(): Promise}
 */
function $command(func) {
    const info = functions.getFunctionInfo(func);

    // ** Function will call callback directly
    return (args, options) => new Promise((resolve, reject) => {

        // ** Map named arguments to an argument array
        const arg_array = functions.mapNamedArgs(args, info.paramList);

        // ** Add the callback to the argument list and invoke the function
        if (info.hasCallback) {
            logger.warn('FUNC: Has a callback...');
            arg_array.push((err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        }

        // ** Determine the context of the command
        const context = {
            __args: args,
            __options: options,
        };

        // ** Call the function with the 'this' argument injected with args/options
        const result = func.apply(context, arg_array);
        resolve(result);
    });
}

/**
 * Run a command.
 * @param func
 * @returns {*}
 */
function $run(func, args, options) {

    // ** Argument defaults
    args = args || {};
    options = options || {};

    // ** Build a command
    const command = $command(func);

    // ** Run the command
    const result = command(args, options);

    // ** Wait for the promise to complete before exiting
    // return isPromise(result) ? result : Promise.resolve(result);
    return Q.when(result);
}

// ** Parse the commandline arguments.
const argv = yargs.argv;

// ** Load the program options.
const options = extend(true, {}, DEFAULT_OPTIONS, argv);
if (argv.hasOwnProperty('newline')) options.newline = argv.newline;

// ** Set the Default Log Level
if (argv.hasOwnProperty('logLevel')) {
    logger.setLevel(argv.logLevel);
    logger.debug('Updated default log level:', {level: argv.logLevel});
}

// ** Load the program arguments.
const parameters = _.clone(argv._);

// ** Build object from name=value pairs
const extract_arguments = () => {
    const args = {};

    logger.debug('PARAMETERS:', parameters);
    _.forEach(parameters, arg => {
        // ** Get the name of the argument
        const name = arg.split('=')[0];

        // ** Get the value to set it to
        let value;
        const index_of_equal_sign = arg.indexOf('=');
        if (index_of_equal_sign !== -1)
            value = arg.substring(index_of_equal_sign + 1);

        args[name] = value;
    });

    return args;
};

// ** Load the application
const program_name = parameters.shift();

// ** Load the program
if (!program_name) throw errors('ARGUMENT_REQUIRED', 'program', '"program" is a required argument.');

const program = files.requireFile(program_name);
if (util.isFunction(program)) {
    // ** Parse the remaining entries on the command line
    const args = extract_arguments();

    // ** If the app itself is a function, then let's run that directly
    return $run(program, args, options)
        .catch(print_error)
        .then(print)
        .finally(() => Program.shutdown());
}

// ** Extract the name of the command
const command_name = parameters.shift();

// ** Load the command

const command = program[command_name];

if (!command)
    throw errors('COMMAND_NOT_FOUND', {command: command},
        `The command "${command}" could not be found in the programs exports.`);

// ** Parse the remaining entries on the command line
const args = extract_arguments();

// ** Run the command
$run(command, args, options)
    .catch(print_error)
    .then(print);