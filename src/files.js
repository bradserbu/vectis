'use strict';

// ** Libraries
const $ = require('highland');
const Path = require('path');
const fs = require('fs-extra');
const errors = require('./errors.js');
const expand_home_dir = require('expand-home-dir');

/**
 * Expands a directory path reference with support for ~ to the home directory.
 * @param path
 */
function resolve(path) {
    path = expand_home_dir(path);

    // ** Determine the file path using CWD or Absolute path
    if (!Path.isAbsolute(path)) {
        const cwd = process.cwd();
        path = Path.resolve(cwd, path);
    }

    return path;
}

/**
 * Require a file by relative path.
 * @param filepath
 */
function requireFile(filename) {
    filename = resolve(filename);

    // ** Ensure the file exists
    if (!fs.existsSync(filename))
        throw errors('FILE_NOT_FOUND', {file: filename});

    // ** Load the JSON file
    return require(filename);
}

function readLines(filename) {
    return $(fs
        .createReadStream(filename))
        .split();
}

function isDirectory(path) {
    return fs
        .lstatSync(path)
        .isDirectory();
}

// module.exports = fs;
module.exports.requireFile = requireFile;
module.exports.readLines = readLines;
module.exports.isDirectory = isDirectory;
module.exports.resolve = resolve;