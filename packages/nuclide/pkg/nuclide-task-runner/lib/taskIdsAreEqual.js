'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.taskIdsAreEqual = taskIdsAreEqual;
function taskIdsAreEqual(a, b) {
  if (a == null || b == null) {
    return false;
  }
  return a.type === b.type && a.taskRunnerId === b.taskRunnerId;
} /**
   * Copyright (c) 2015-present, Facebook, Inc.
   * All rights reserved.
   *
   * This source code is licensed under the license found in the LICENSE file in
   * the root directory of this source tree.
   *
   * 
   */