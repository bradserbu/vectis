'use strict';

// ** Libraries
const util = require('util');
const async = require('async');
const stack = require('callsite');
const errors = require('./errors.js');

// console.log(require('./logging.js'));
// const logger = require('./logging.js').createLogger();

const STRIP_COMMENTS = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s*=[^,\)]*(('(?:\\'|[^'\r\n])*')|("(?:\\"|[^"\r\n])*"))|(\s*=[^,\)]*))/mg;
const ARGUMENT_NAMES = /([^\s,]+)/g;

/**
 * Parse the function body to determine what the parameter names are
 * @param func
 * @returns {Array|{index: number, input: string}}
 */
function getParameterNames(func) {
    var fnStr = func.toString();

    if (fnStr.match(/^[^ ()]+[ ]+=>/)) {
        fnStr = `(${fnStr.replace(/ =>/, ') =>')}`;
    }
    fnStr = fnStr.replace(STRIP_COMMENTS, '');

    var result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
    if (result === null)
        result = [];

    return result;
}

/**
 * Provides metadata about a function
 * @param func
 * @returns {{paramList: (Array|{index: number, input: string}), hasCallback: boolean}}
 */
function getFunctionInfo(func) {
    // ** Parse the function signature to get parameter names
    const paramList = getParameterNames(func);

    // ** Indicator whether this function has a callback as the last parameter
    const hasCallback = paramList[paramList.length - 1] === 'callback';

    // ** If it has a callback, then trim it form the paramList
    if (hasCallback)
        paramList.pop();

    return {
        paramList: paramList,
        hasCallback: hasCallback
    };
}

/**
 * Returns a function that adds an additional argument to the argument list it was passed.
 * - Useful to add optional variables that add context (i.e. Application.on())
 * @param fn - The original function
 * @param arg - The argument to add to the function
 */
function appendArgument(fn, arg) {
    return () => {
        const args = Array.prototype.slice.call(arguments);
        args.push(arg);

        fn(args);
    }
}

/**
 * Checks if the value supplied is a promise.
 * @param value
 */
function isPromise(value) {
    return util.isFunction(value.then);
}

/**
 * Get Information about who included this module
 */
function callsite() {
    const site = stack()[2];

    return {
        function_name: site.getFunctionName() || '<anonymous>',
        filename: site.getFileName(),
        line_number: site.getLineNumber()
    };
}

/**
 * Transforms an async function, with a callback, into one that can be only run N instances simultaneously.
 * - NOTE: A function(entry) is returned with where entry is an object { args:{}, callback: function(err, result) }
 * @param fn - function(..., callback)
 * @param instances - The N max number of simultaneous executions to allow at any given time.
 */
function workers(fn, instances) {
    // instances defaults to 1 if not specified
    if (util.isNullOrUndefined(instances))
        instances = 1;

    if (instances <= 0) throw errors('ARGUMENT_ERROR', {instances: instances},
        'The "instances" argument must be an integer greater than zero.');

    // ** Create a queue
    const queue = async.queue(function (entry, next) {
        // ** Get the arguments that were used to call the worker function wrapper (returned below).
        const args = entry.args;

        // ** Check if this function has a callback
        const callback = args[args.length - 1];
        if (!util.isFunction(callback)) throw errors('ARGUMENT_ERROR', {arguments: args},
            'The functions last argument must contain a callback.');

        // ** callback -> callback -> next
        args[args.length - 1] = function () {
            callback.apply(this, arguments);
            next();
        };

        fn.apply(this, args);
    }, instances);

    // ** Return a function({args: {}, callback: function(err, result)}) that is used to call this function
    return function () {
        queue.push({args: arguments});
    }
}

/**
 * Returns an array that can be used to call a function with named arguments
 * @param namedArgs
 * @param argList - The array of expected argument names in order
 */
function mapNamedArgs(namedArgs, argList) {
    const args = [];
    for (let lcv = 0; lcv < argList.length; lcv++) {
        const argName = argList[lcv];
        args.push(namedArgs[argName]);
    }

    return args;
}

/**
 * Call a function and catch any errors passing them to the callback
 * @param func - function pointer.
 * @param arrArgs - Array of arguments to pass to the function.
 * @param callback - function(err, result) to call on completion.
 */
function syncToCallback(func, arrArgs, callback) {
    let result;

    try {
        result = func.apply(null, arrArgs);
    } catch (err) {
        return callback(err);
    }

    return callback(null, result);
}

/**
 * Returns a wrapper function that can be called using a set of named arguments and an optional callback
 * @param func
 * @returns {Function} function(args, callback)
 */
function namedArgsWrapper(func) {
    // ** Returns a function that can be called using a named argument list
    const info = getFunctionInfo(func);

    // ** Synchronous execution
    if (!info.hasCallback) {
        return function (args, callback) {

            // ** Make the full command arguments available to the calling function
            if (this) {
                this.__args = args;
            }

            const arg_array = mapNamedArgs(args, info.paramList);
            syncToCallback(func, arg_array, callback);
        }
    }

    // ** Function will call callback directly
    return (args, callback) => {

        // ** Map named arguments to an argument array
        const arg_array = mapNamedArgs(args, info.paramList);

        // ** Add the callback to the argument list and invoke the function
        arg_array.push(callback);

        try {
            func.apply({
                __args: args
            }, arg_array);
        } catch (err) {
            callback(err);
        }
    };
}

function command(func) {
    const info = getFunctionInfo(func);

    // ** Function will call callback directly
    return (args, options) => new Promise((resolve, reject) => {

        // ** Map named arguments to an argument array
        const arg_array = mapNamedArgs(args, info.paramList);

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
            __options: options
        };

        // ** Call the function with the 'this' argument injected with args/options
        const result = func.apply(context, arg_array);
        resolve(result);
    });
}

// ** Exports
module.exports.appendArgument = appendArgument;
module.exports.callsite = callsite;
module.exports.workers = workers;
module.exports.namedArgsWrapper = namedArgsWrapper;
module.exports.mapNamedArgs = mapNamedArgs;
module.exports.getFunctionInfo = getFunctionInfo;
module.exports.command = command;
module.exports.isPromise = isPromise;
