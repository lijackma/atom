'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = replaceInFile;

var _fs = _interopRequireDefault(require('fs'));

var _temp;

function _load_temp() {
  return _temp = _interopRequireDefault(require('temp'));
}

var _rxjsBundlesRxMinJs = require('rxjs/bundles/Rx.min.js');

var _event;

function _load_event() {
  return _event = require('../../commons-node/event');
}

var _fsPromise;

function _load_fsPromise() {
  return _fsPromise = _interopRequireDefault(require('../../commons-node/fsPromise'));
}

var _stream;

function _load_stream() {
  return _stream = require('../../commons-node/stream');
}

var _observable;

function _load_observable() {
  return _observable = require('../../commons-node/observable');
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Returns the number of replacements made.
function replaceInFile(path, regex, replacement) {
  return _rxjsBundlesRxMinJs.Observable.defer(() => {
    const readStream = _fs.default.createReadStream(path);
    // Write the replaced output to a temporary file.
    // We'll overwrite the original when we're done.
    const tempStream = (_temp || _load_temp()).default.createWriteStream();

    return _rxjsBundlesRxMinJs.Observable.concat(
    // Replace the output line-by-line. This obviously doesn't work for multi-line regexes,
    // but this mimics the behavior of Atom's `scandal` find-and-replace backend.
    (0, (_observable || _load_observable()).splitStream)((0, (_stream || _load_stream()).observeStream)(readStream)).map(line => {
      const matches = line.match(regex);
      if (matches != null) {
        tempStream.write(line.replace(regex, replacement));
        return matches.length;
      }
      tempStream.write(line);
      return 0;
    }).reduce((acc, curr) => acc + curr, 0),

    // Wait for the temporary file to finish.
    // We need to ensure that the event handler is attached before end().
    _rxjsBundlesRxMinJs.Observable.create(observer => {
      const disposable = (0, (_event || _load_event()).attachEvent)(tempStream, 'finish', () => {
        observer.complete();
      });
      tempStream.end();
      return () => disposable.dispose();
    }),

    // Overwrite the original file with the temporary file.
    // $FlowIssue: fs.WriteStream contains a path.
    _rxjsBundlesRxMinJs.Observable.fromPromise((_fsPromise || _load_fsPromise()).default.rename(tempStream.path, path)).ignoreElements()).catch(err => {
      // Make sure we clean up the temporary file if an error occurs.
      // $FlowIssue: fs.WriteStream contains a path.
      (_fsPromise || _load_fsPromise()).default.unlink(tempStream.path).catch(() => {});
      return _rxjsBundlesRxMinJs.Observable.throw(err);
    });
  });
} /**
   * Copyright (c) 2015-present, Facebook, Inc.
   * All rights reserved.
   *
   * This source code is licensed under the license found in the LICENSE file in
   * the root directory of this source tree.
   *
   * 
   */

module.exports = exports['default'];