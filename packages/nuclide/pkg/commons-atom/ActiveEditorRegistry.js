'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _asyncToGenerator = _interopRequireDefault(require('async-to-generator'));

var _atom = require('atom');

var _rxjsBundlesRxMinJs = require('rxjs/bundles/Rx.min.js');

var _debounced;

function _load_debounced() {
  return _debounced = require('./debounced');
}

var _event;

function _load_event() {
  return _event = require('../commons-node/event');
}

var _observable;

function _load_observable() {
  return _observable = require('../commons-node/observable');
}

var _nuclideLogging;

function _load_nuclideLogging() {
  return _nuclideLogging = require('../nuclide-logging');
}

var _ProviderRegistry;

function _load_ProviderRegistry() {
  return _ProviderRegistry = _interopRequireDefault(require('./ProviderRegistry'));
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 *
 * 
 */

/**
 * ActiveEditorRegistry provides abstractions for creating services that operate
 * on text editor contents.
 */

const logger = (0, (_nuclideLogging || _load_nuclideLogging()).getLogger)();

const DEFAULT_CONFIG = {
  updateOnEdit: true
};

function getConcreteConfig(config) {
  return Object.assign({}, DEFAULT_CONFIG, config);
}

class ActiveEditorRegistry {

  constructor(resultFunction, config = {}, eventSources = getDefaultEventSources()) {
    this._config = getConcreteConfig(config);
    this._resultFunction = resultFunction;
    this._providerRegistry = new (_ProviderRegistry || _load_ProviderRegistry()).default();
    this._newProviderEvents = new _rxjsBundlesRxMinJs.Subject();
    this._resultsStream = this._createResultsStream(eventSources);
  }

  consumeProvider(provider) {
    this._providerRegistry.addProvider(provider);
    this._newProviderEvents.next();
    return new _atom.Disposable(() => {
      this._providerRegistry.removeProvider(provider);
    });
  }

  getResultsStream() {
    return this._resultsStream;
  }

  _createResultsStream(eventSources) {
    const repeatedEditors = eventSources.activeEditors.switchMap(editor => {
      if (editor == null) {
        return _rxjsBundlesRxMinJs.Observable.of(editor);
      }
      return _rxjsBundlesRxMinJs.Observable.concat(_rxjsBundlesRxMinJs.Observable.of(editor), this._newProviderEvents.mapTo(editor));
    });
    const results = repeatedEditors.switchMap(editorArg => {
      // Necessary so the type refinement holds in the callback later
      const editor = editorArg;
      if (editor == null) {
        return _rxjsBundlesRxMinJs.Observable.of({ kind: 'not-text-editor' });
      }

      return _rxjsBundlesRxMinJs.Observable.concat(
      // Emit a pane change event first, so that clients can do something while waiting for a
      // provider to give a result.
      _rxjsBundlesRxMinJs.Observable.of({
        kind: 'pane-change',
        editor
      }), _rxjsBundlesRxMinJs.Observable.fromPromise(this._getResultForEditor(this._getProviderForEditor(editor), editor)), this._resultsForEditor(editor, eventSources));
    });
    return (0, (_observable || _load_observable()).cacheWhileSubscribed)(results);
  }

  _resultsForEditor(editor, eventSources) {
    // It's possible that the active provider for an editor changes over time.
    // Thus, we have to subscribe to both edits and saves.
    return _rxjsBundlesRxMinJs.Observable.merge(eventSources.changesForEditor(editor).map(() => 'edit'), eventSources.savesForEditor(editor).map(() => 'save')).flatMap(event => {
      const provider = this._getProviderForEditor(editor);
      if (provider != null) {
        let updateOnEdit = provider.updateOnEdit;
        // Fall back to the config's updateOnEdit if not provided.
        if (updateOnEdit == null) {
          updateOnEdit = this._config.updateOnEdit;
        }
        if (updateOnEdit !== (event === 'edit')) {
          return _rxjsBundlesRxMinJs.Observable.empty();
        }
      }
      return _rxjsBundlesRxMinJs.Observable.concat(
      // $FlowIssue: {kind: edit | save} <=> {kind: edit} | {kind: save}
      _rxjsBundlesRxMinJs.Observable.of({ kind: event, editor }), _rxjsBundlesRxMinJs.Observable.fromPromise(this._getResultForEditor(provider, editor)));
    });
  }

  _getProviderForEditor(editor) {
    return this._providerRegistry.getProviderForEditor(editor);
  }

  _getResultForEditor(provider, editor) {
    var _this = this;

    return (0, _asyncToGenerator.default)(function* () {
      if (provider == null) {
        return {
          kind: 'no-provider',
          grammar: editor.getGrammar()
        };
      }
      try {
        return {
          kind: 'result',
          result: yield _this._resultFunction(provider, editor),
          provider,
          editor
        };
      } catch (e) {
        logger.error(`Error from provider for ${ editor.getGrammar().scopeName }`, e);
        return {
          provider,
          kind: 'provider-error'
        };
      }
    })();
  }
}

exports.default = ActiveEditorRegistry;
function getDefaultEventSources() {
  return {
    activeEditors: (0, (_debounced || _load_debounced()).observeActiveEditorsDebounced)(),
    changesForEditor: editor => (0, (_debounced || _load_debounced()).editorChangesDebounced)(editor),
    savesForEditor: editor => {
      return (0, (_event || _load_event()).observableFromSubscribeFunction)(callback => editor.onDidSave(callback)).mapTo(undefined);
    }
  };
}
module.exports = exports['default'];