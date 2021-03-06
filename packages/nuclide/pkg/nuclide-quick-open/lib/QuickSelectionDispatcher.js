'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ActionTypes = undefined;

var _Dispatcher;

function _load_Dispatcher() {
  return _Dispatcher = _interopRequireDefault(require('../../commons-node/Dispatcher'));
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const ActionTypes = exports.ActionTypes = Object.freeze({
  ACTIVE_PROVIDER_CHANGED: 'ACTIVE_PROVIDER_CHANGED',
  QUERY: 'QUERY'
});

// Flow hack: Every QuickSelectionAction actionType must be in ActionTypes.
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 *
 * 
 */

'';

class QuickSelectionDispatcher extends (_Dispatcher || _load_Dispatcher()).default {}
exports.default = QuickSelectionDispatcher;