'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CodeHighlightProvider = undefined;

var _asyncToGenerator = _interopRequireDefault(require('async-to-generator'));

var _nuclideAnalytics;

function _load_nuclideAnalytics() {
  return _nuclideAnalytics = require('../../nuclide-analytics');
}

var _nuclideRemoteConnection;

function _load_nuclideRemoteConnection() {
  return _nuclideRemoteConnection = require('../../nuclide-remote-connection');
}

var _nuclideOpenFiles;

function _load_nuclideOpenFiles() {
  return _nuclideOpenFiles = require('../../nuclide-open-files');
}

var _atom = require('atom');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class CodeHighlightProvider {

  constructor(name, selector, priority, analyticsEventName, connectionToLanguageService) {
    this.name = name;
    this.selector = selector;
    this.inclusionPriority = priority;
    this._analyticsEventName = analyticsEventName;
    this._connectionToLanguageService = connectionToLanguageService;
  }

  highlight(editor, position) {
    var _this = this;

    return (0, (_nuclideAnalytics || _load_nuclideAnalytics()).trackTiming)(this._analyticsEventName, (0, _asyncToGenerator.default)(function* () {
      const fileVersion = yield (0, (_nuclideOpenFiles || _load_nuclideOpenFiles()).getFileVersionOfEditor)(editor);
      const languageService = _this._connectionToLanguageService.getForUri(editor.getPath());
      if (languageService == null || fileVersion == null) {
        return [];
      }

      return (yield (yield languageService).highlight(fileVersion, position)).map(function (range) {
        return new _atom.Range(range.start, range.end);
      });
    }));
  }

  static register(name, selector, config, connectionToLanguageService) {
    return atom.packages.serviceHub.provide('nuclide-code-highlight.provider', config.version, new CodeHighlightProvider(name, selector, config.priority, config.analyticsEventName, connectionToLanguageService));
  }
}
exports.CodeHighlightProvider = CodeHighlightProvider; /**
                                                        * Copyright (c) 2015-present, Facebook, Inc.
                                                        * All rights reserved.
                                                        *
                                                        * This source code is licensed under the license found in the LICENSE file in
                                                        * the root directory of this source tree.
                                                        *
                                                        * 
                                                        */