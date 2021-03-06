'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
const SwiftPMTaskRunnerBuildTaskMetadata = exports.SwiftPMTaskRunnerBuildTaskMetadata = {
  type: 'build',
  label: 'Build',
  description: 'Build a Swift package',
  icon: 'tools',
  runnable: true
}; /**
    * Copyright (c) 2015-present, Facebook, Inc.
    * All rights reserved.
    *
    * This source code is licensed under the license found in the LICENSE file in
    * the root directory of this source tree.
    *
    * 
    */

const SwiftPMTaskRunnerTestTaskMetadata = exports.SwiftPMTaskRunnerTestTaskMetadata = {
  type: 'test',
  label: 'Test',
  description: 'Run a Swift package\'s tests',
  icon: 'check',
  runnable: true
};

const SwiftPMTaskRunnerTaskMetadata = exports.SwiftPMTaskRunnerTaskMetadata = [SwiftPMTaskRunnerBuildTaskMetadata, SwiftPMTaskRunnerTestTaskMetadata];