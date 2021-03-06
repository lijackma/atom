'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.clearRecords = clearRecords;
exports.recordReceived = recordReceived;
exports.registerExecutor = registerExecutor;
exports.execute = execute;
exports.registerOutputProvider = registerOutputProvider;
exports.registerRecordProvider = registerRecordProvider;
exports.unregisterRecordProvider = unregisterRecordProvider;
exports.unregisterOutputProvider = unregisterOutputProvider;
exports.selectExecutor = selectExecutor;
exports.setMaxMessageCount = setMaxMessageCount;
exports.removeSource = removeSource;
exports.unregisterExecutor = unregisterExecutor;
exports.updateStatus = updateStatus;
const CLEAR_RECORDS = exports.CLEAR_RECORDS = 'CLEAR_RECORDS'; /**
                                                                * Copyright (c) 2015-present, Facebook, Inc.
                                                                * All rights reserved.
                                                                *
                                                                * This source code is licensed under the license found in the LICENSE file in
                                                                * the root directory of this source tree.
                                                                *
                                                                * 
                                                                */

const REGISTER_EXECUTOR = exports.REGISTER_EXECUTOR = 'REGISTER_EXECUTOR';
const EXECUTE = exports.EXECUTE = 'EXECUTE';
const REGISTER_RECORD_PROVIDER = exports.REGISTER_RECORD_PROVIDER = 'REGISTER_RECORD_PROVIDER';
const SELECT_EXECUTOR = exports.SELECT_EXECUTOR = 'SELECT_EXECUTOR';
const SET_MAX_MESSAGE_COUNT = exports.SET_MAX_MESSAGE_COUNT = 'SET_MAX_MESSAGE_COUNT';
const RECORD_RECEIVED = exports.RECORD_RECEIVED = 'RECORD_RECEIVED';
const REMOVE_SOURCE = exports.REMOVE_SOURCE = 'REMOVE_SOURCE';
const UPDATE_STATUS = exports.UPDATE_STATUS = 'UPDATE_STATUS';

function clearRecords() {
  return { type: CLEAR_RECORDS };
}

function recordReceived(record) {
  return {
    type: RECORD_RECEIVED,
    payload: { record }
  };
}

function registerExecutor(executor) {
  return {
    type: REGISTER_EXECUTOR,
    payload: { executor }
  };
}

function execute(code) {
  return {
    type: EXECUTE,
    payload: { code }
  };
}

function registerOutputProvider(outputProvider) {
  // Transform the messages into actions and merge them into the action stream.
  // TODO: Add enabling/disabling of registered source and only subscribe when enabled. That
  //       way, we won't trigger cold observer side-effects when we don't need the results.
  return registerRecordProvider(Object.assign({}, outputProvider, {
    records: outputProvider.messages.map(message => Object.assign({}, message, {
      kind: 'message',
      sourceId: outputProvider.id,
      scopeName: null
    }))
  }));
}

function registerRecordProvider(recordProvider) {
  return {
    type: REGISTER_RECORD_PROVIDER,
    payload: { recordProvider }
  };
}

function unregisterRecordProvider(recordProvider) {
  return removeSource(recordProvider.id);
}

function unregisterOutputProvider(outputProvider) {
  return removeSource(outputProvider.id);
}

function selectExecutor(executorId) {
  return {
    type: SELECT_EXECUTOR,
    payload: { executorId }
  };
}

function setMaxMessageCount(maxMessageCount) {
  return {
    type: SET_MAX_MESSAGE_COUNT,
    payload: { maxMessageCount }
  };
}

function removeSource(sourceId) {
  return {
    type: REMOVE_SOURCE,
    payload: { sourceId }
  };
}

function unregisterExecutor(executor) {
  return removeSource(executor.id);
}

function updateStatus(providerId, status) {
  return {
    type: UPDATE_STATUS,
    payload: { providerId, status }
  };
}