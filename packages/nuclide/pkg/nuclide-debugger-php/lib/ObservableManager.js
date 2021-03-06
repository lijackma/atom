'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ObservableManager = undefined;

var _nuclideDebuggerBase;

function _load_nuclideDebuggerBase() {
  return _nuclideDebuggerBase = require('../../nuclide-debugger-base');
}

var _utils;

function _load_utils() {
  return _utils = _interopRequireDefault(require('./utils'));
}

var _rxjsBundlesRxMinJs = require('rxjs/bundles/Rx.min.js');

var _UniversalDisposable;

function _load_UniversalDisposable() {
  return _UniversalDisposable = _interopRequireDefault(require('../../commons-node/UniversalDisposable'));
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

const { log, logError } = (_utils || _load_utils()).default;


/**
 * The ObservableManager keeps track of the streams we use to talk to the server-side nuclide
 * debugger.  Currently it manages 3 streams:
 *   1. A notification stream to communicate events to atom's notification system.
 *   2. A server message stream to communicate events to the debugger UI.
 *   3. An output window stream to communicate events to the client's output window.
 * The manager also allows two callback to be passed.
 *   1. sendServerMessageToChromeUi takes a string and sends it to the chrome debugger UI.
 *   2. onSessionEnd is optional, and is called when all the managed observables complete.
 * The ObservableManager takes ownership of its observables, and disposes them when its dispose
 * method is called.
 */
class ObservableManager {

  constructor(notifications, outputWindowMessages) {
    this._notifications = notifications;
    this._outputWindowMessages = outputWindowMessages;
    this._disposables = new (_UniversalDisposable || _load_UniversalDisposable()).default();
    this._subscribe();
  }

  _subscribe() {
    const sharedNotifications = this._notifications.share();
    this._disposables.add(sharedNotifications.subscribe(this._handleNotificationMessage.bind(this), this._handleNotificationError.bind(this), this._handleNotificationEnd.bind(this)));
    this._registerConsoleLogging(this._outputWindowMessages.share());
  }

  _registerConsoleLogging(sharedOutputWindowMessages) {
    const filteredMesages = sharedOutputWindowMessages.filter(messageObj => messageObj.method === 'Console.messageAdded').map(messageObj => {
      return JSON.stringify({
        level: messageObj.params.message.level,
        text: messageObj.params.message.text
      });
    });
    const outputDisposable = (0, (_nuclideDebuggerBase || _load_nuclideDebuggerBase()).registerConsoleLogging)('PHP Debugger', filteredMesages);
    if (outputDisposable != null) {
      this._disposables.add(outputDisposable);
    }
  }

  _handleNotificationMessage(message) {
    switch (message.type) {
      case 'info':
        log('Notification observerable info: ' + message.message);
        atom.notifications.addInfo(message.message);
        break;

      case 'warning':
        log('Notification observerable warning: ' + message.message);
        atom.notifications.addWarning(message.message);
        break;

      case 'error':
        logError('Notification observerable error: ' + message.message);
        atom.notifications.addError(message.message);
        break;

      case 'fatalError':
        logError('Notification observerable fatal error: ' + message.message);
        atom.notifications.addFatalError(message.message);
        break;

      default:
        logError('Unknown message: ' + JSON.stringify(message));
        break;
    }
  }

  _handleNotificationError(error) {
    logError('Notification observerable error: ' + error);
  }

  _handleNotificationEnd() {
    log('Notification observerable ends.');
  }

  dispose() {
    this._disposables.dispose();
  }
}
exports.ObservableManager = ObservableManager;