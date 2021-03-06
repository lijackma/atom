'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _rxjsBundlesRxMinJs = require('rxjs/bundles/Rx.min.js');

var _UniversalDisposable;

function _load_UniversalDisposable() {
  return _UniversalDisposable = _interopRequireDefault(require('../../commons-node/UniversalDisposable'));
}

var _event;

function _load_event() {
  return _event = require('../../commons-node/event');
}

var _tasks;

function _load_tasks() {
  return _tasks = require('../../commons-node/tasks');
}

var _bindObservableAsProps;

function _load_bindObservableAsProps() {
  return _bindObservableAsProps = require('../../nuclide-ui/bindObservableAsProps');
}

var _Icon;

function _load_Icon() {
  return _Icon = require('../../nuclide-ui/Icon');
}

var _HhvmDebug;

function _load_HhvmDebug() {
  return _HhvmDebug = require('./HhvmDebug');
}

var _HhvmToolbar;

function _load_HhvmToolbar() {
  return _HhvmToolbar = _interopRequireDefault(require('./HhvmToolbar'));
}

var _ProjectStore;

function _load_ProjectStore() {
  return _ProjectStore = _interopRequireDefault(require('./ProjectStore'));
}

var _reactForAtom = require('react-for-atom');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class HhvmBuildSystem {

  constructor() {
    this.id = 'hhvm';
    this.name = 'HHVM';
    this._projectStore = new (_ProjectStore || _load_ProjectStore()).default();
  }

  dispose() {
    this._projectStore.dispose();
  }

  observeTaskList(callback) {
    return new (_UniversalDisposable || _load_UniversalDisposable()).default(_rxjsBundlesRxMinJs.Observable.concat(_rxjsBundlesRxMinJs.Observable.of(this.getTaskList()), (0, (_event || _load_event()).observableFromSubscribeFunction)(this._projectStore.onChange.bind(this._projectStore)).map(() => this.getTaskList()))
    // Wait until the project type has finished loading.
    .filter(() => this._projectStore.isHHVMProject() != null).subscribe(callback));
  }

  getExtraUi() {
    if (this._extraUi == null) {
      const projectStore = this._projectStore;
      const subscription = (0, (_event || _load_event()).observableFromSubscribeFunction)(projectStore.onChange.bind(projectStore));
      this._extraUi = (0, (_bindObservableAsProps || _load_bindObservableAsProps()).bindObservableAsProps)(subscription.startWith(null).mapTo({ projectStore }), (_HhvmToolbar || _load_HhvmToolbar()).default);
    }
    return this._extraUi;
  }

  getTaskList() {
    const disabled = !this._projectStore.isHHVMProject();
    return [{
      type: 'debug',
      label: 'Debug',
      description: 'Debug a HHVM project',
      icon: 'triangle-right',
      disabled,
      priority: 1, // Take precedence over the Arcanist build toolbar.
      runnable: !disabled,
      cancelable: false
    }];
  }

  getIcon() {
    return () => _reactForAtom.React.createElement((_Icon || _load_Icon()).Icon, { icon: 'nuclicon-hhvm', className: 'nuclide-hhvm-task-runner-icon' });
  }

  runTask(taskName) {
    return (0, (_tasks || _load_tasks()).taskFromObservable)(_rxjsBundlesRxMinJs.Observable.fromPromise((0, (_HhvmDebug || _load_HhvmDebug()).debug)(this._projectStore.getDebugMode(), this._projectStore.getProjectRoot(), this._projectStore.getDebugTarget())).ignoreElements());
  }

  setProjectRoot(projectRoot) {
    this._projectStore.setProjectRoot(projectRoot == null ? null : projectRoot.getPath());
  }
}
exports.default = HhvmBuildSystem; /**
                                    * Copyright (c) 2015-present, Facebook, Inc.
                                    * All rights reserved.
                                    *
                                    * This source code is licensed under the license found in the LICENSE file in
                                    * the root directory of this source tree.
                                    *
                                    * 
                                    */

module.exports = exports['default'];