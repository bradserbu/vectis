'use strict';

const util = require('util');

function error(code, data, err, stackTrace) {
    if (util.isError(code))
        return code;

    let message = '[' + code + ']';

    // ** Include nested error in message
    if (err)
        message += ' ' + err;

    if (data) {
        // ** If the second argument is an error, then reset the arguments.
        if (isError(data))
            return error(code, null, data);

        // ** Add data to the message
        if(typeof data === 'string' ){
            message += ' ' + data;
        }else {
            message += ' ' + JSON.stringify(data);
        }
    }

    const ret = new Error(message);
    ret.code = code;
    ret.data = data;

    if (err) {
        ret.error = err;
        if(err.stackTrace){
            ret.stackTrace = err.stackTrace
        }else {
            ret.stackTrace = err.stack;
        }
    }
    if(stackTrace){
        ret.stackTrace = stackTrace;
    }

    ret.toObject = () => {
        return {
            code: code,
            data: data,
            message: message || ret.error.toString()
        }
    };

    return ret;
}

/**
 * Check if the object passed is an error object
 * @param obj
 * @returns {boolean}
 */
function isError(obj) {
    return obj instanceof Error;
}

/**
 * Check if the object passed is a VECTIS error object
 * @param obj
 * @returns {boolean}
 */
function isVectisError(obj) {
    return isError(obj) && typeof(obj.toObject) !== 'undefined';
}

// ** Create a new Error
module.exports = error;
module.exports.isError = isError;
module.exports.isVectisError = isVectisError;
