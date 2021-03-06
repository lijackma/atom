'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.aggregateTaskListsEpic = aggregateTaskListsEpic;
exports.tasksReadyEpic = tasksReadyEpic;
exports.initializeViewEpic = initializeViewEpic;
exports.runTaskEpic = runTaskEpic;
exports.stopTaskEpic = stopTaskEpic;
exports.toggleToolbarVisibilityEpic = toggleToolbarVisibilityEpic;

var _collection;

function _load_collection() {
  return _collection = require('../../../commons-node/collection');
}

var _tasks;

function _load_tasks() {
  return _tasks = require('../../../commons-node/tasks');
}

var _event;

function _load_event() {
  return _event = require('../../../commons-node/event');
}

var _observable;

function _load_observable() {
  return _observable = require('../../../commons-node/observable');
}

var _UniversalDisposable;

function _load_UniversalDisposable() {
  return _UniversalDisposable = _interopRequireDefault(require('../../../commons-node/UniversalDisposable'));
}

var _nuclideLogging;

function _load_nuclideLogging() {
  return _nuclideLogging = require('../../../nuclide-logging');
}

var _getTaskMetadata;

function _load_getTaskMetadata() {
  return _getTaskMetadata = require('../getTaskMetadata');
}

var _Selectors;

function _load_Selectors() {
  return _Selectors = require('../redux/Selectors');
}

var _taskIdsAreEqual;

function _load_taskIdsAreEqual() {
  return _taskIdsAreEqual = require('../taskIdsAreEqual');
}

var _Actions;

function _load_Actions() {
  return _Actions = _interopRequireWildcard(require('./Actions'));
}

var _rxjsBundlesRxMinJs = require('rxjs/bundles/Rx.min.js');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function aggregateTaskListsEpic(actions, store, options) {
  // Wait until the initial packages have activated.
  return actions.ofType((_Actions || _load_Actions()).DID_ACTIVATE_INITIAL_PACKAGES).switchMap(() => {
    // We pass the state stream explicitly. Ideally, we'd just use `Observable.from(store)`,
    // but Redux gives us a partial store so we have to work around it.
    // See redux-observable/redux-observable#56
    const { states } = options;

    const projectRoots = states.map(state => state.projectRoot).distinctUntilChanged((a, b) => {
      const aPath = a && a.getPath();
      const bPath = b && b.getPath();
      return aPath === bPath;
    });
    const taskRunnersByIdStream = states.map(state => state.taskRunners).distinctUntilChanged();

    const diffs = _rxjsBundlesRxMinJs.Observable.merge(
    // We want to make sure that we don't call `observeTaskList()` when nothing's changed, so we
    // use `diffSets()` to identify changes.
    (0, (_observable || _load_observable()).diffSets)(taskRunnersByIdStream.map(taskRunnersById => new Set(taskRunnersById.keys()))),
    // If the project root changes, get tasks from all of them.
    projectRoots.skip(1).switchMap(() => {
      const taskRunnerIds = new Set(store.getState().taskRunners.keys());
      return _rxjsBundlesRxMinJs.Observable.of({ added: new Set(), removed: taskRunnerIds }, { added: taskRunnerIds, removed: new Set() });
    })).share();

    // Create a stream containing the task list updates, tagged by task runner id.
    const taskListsByIdStream = diffs.mergeMap(({ added }) =>
    // Get an observable of task lists for each task runner. Tag it with the task runner id
    // so that we can tie them back later.
    _rxjsBundlesRxMinJs.Observable.from(added).mergeMap(taskRunnerId => {
      const taskRunner = store.getState().taskRunners.get(taskRunnerId);

      if (!(taskRunner != null)) {
        throw new Error('Invariant violation: "taskRunner != null"');
      }

      const taskLists = (0, (_event || _load_event()).observableFromSubscribeFunction)(cb => {
        if (taskRunner.setProjectRoot != null) {
          const { projectRoot } = store.getState();

          if (!(taskRunner.setProjectRoot != null)) {
            throw new Error('Invariant violation: "taskRunner.setProjectRoot != null"');
          }

          taskRunner.setProjectRoot(projectRoot);
        }
        return taskRunner.observeTaskList(cb);
      })
      // Stop listening to the task list when the runner's removed or the project root
      // changes.
      .takeUntil(diffs.filter(diff => diff.removed.has(taskRunnerId))).map(taskList => {
        // Annotate each task with some info about its runner.
        const annotatedTaskList = taskList.map(task => Object.assign({}, task, {
          taskRunnerId,
          taskRunnerName: taskRunner.name
        }));
        // Tag each task list with the id of its runner for adding to the map.
        return { taskRunnerId, taskList: annotatedTaskList };
      })
      // When it completes, null the task list for this task runner.
      .concat(_rxjsBundlesRxMinJs.Observable.of({ taskRunnerId, taskList: null })).publish();

      // Use `Observable.create()` to make sure we only have one subscription to taskLists and
      // that we don't miss any elements.
      return _rxjsBundlesRxMinJs.Observable.create(observer => new (_UniversalDisposable || _load_UniversalDisposable()).default(_rxjsBundlesRxMinJs.Observable.merge(taskLists, _rxjsBundlesRxMinJs.Observable.of({ taskRunnerId, taskList: [] })
      // Use a more generous timeout on the initial load to allow for
      // package initialization, lazy imports, the RPC framework, etc.
      .delay(store.getState().viewIsInitialized ? 1000 : 5000).takeUntil(taskLists.take(1))).subscribe(observer), taskLists.connect()));
    })).scan(
    // Combine the lists from each task runner into a single map.
    (acc_, { taskRunnerId, taskList }) => {
      const acc = new Map(acc_);
      if (taskList == null) {
        acc.delete(taskRunnerId);
      } else {
        acc.set(taskRunnerId, taskList);
      }
      return acc;
    }, new Map());

    return taskListsByIdStream.map(taskListsById => (_Actions || _load_Actions()).setTaskLists(taskListsById));
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

function tasksReadyEpic(actions, store) {
  return actions.ofType((_Actions || _load_Actions()).SET_TASK_LISTS).switchMap(action => {
    if (!(action.type === (_Actions || _load_Actions()).SET_TASK_LISTS)) {
      throw new Error('Invariant violation: "action.type === Actions.SET_TASK_LISTS"');
    }

    const { taskLists } = action.payload;
    const state = store.getState();
    const tasksBecameReady = !state.tasksAreReady && (0, (_collection || _load_collection()).areSetsEqual)(new Set(taskLists.keys()), new Set(state.taskRunners.keys()));
    return tasksBecameReady ? [(_Actions || _load_Actions()).tasksReady()] : [];
  });
}

function initializeViewEpic(actions, store, options) {
  // Initialize the view when we have a task list.
  return actions.ofType((_Actions || _load_Actions()).TASKS_READY)
  // If a project hasn't been opened yet, we defer this until one has been. When that happens, a
  // directory will be added -> the current working root will be set -> we'll request taks lists
  // -> this action will be called again and we'll initialize.
  .filter(() => {
    const state = store.getState();
    return state.projectWasOpened && !state.viewIsInitialized;
  }).map(() => {
    const { activeTaskId, taskLists, projectRoot } = store.getState();
    const { visibilityTable } = options;
    const projectRootPath = projectRoot == null ? null : projectRoot.getPath();
    const previousSessionVisible = projectRootPath == null ? undefined : visibilityTable.getItem(projectRootPath);

    // Initialize the view if we've yet to do so.
    let visible;
    if (previousSessionVisible != null) {
      // Use the last known state, if we have one.
      visible = previousSessionVisible;
    } else {
      // Otherwise, only show the toolbar if the initial task is enabled. (It's okay if a
      // task runner doesn't give us a "disabled" property for now, but we're not going to
      // show the bar for possibly irrelevant tasks.)
      const activeTaskMeta = activeTaskId == null ? null : getTaskMeta(activeTaskId, taskLists);
      visible = activeTaskMeta != null && activeTaskMeta.disabled === false;
    }

    return (_Actions || _load_Actions()).initializeView(visible);
  });
}

function runTaskEpic(actions, store) {
  return actions.ofType((_Actions || _load_Actions()).RUN_TASK).switchMap(action => {
    if (!(action.type === (_Actions || _load_Actions()).RUN_TASK)) {
      throw new Error('Invariant violation: "action.type === Actions.RUN_TASK"');
    }

    const taskToRun = action.payload.taskId || store.getState().activeTaskId;

    // Don't do anything if there's no active task.
    if (taskToRun == null) {
      return _rxjsBundlesRxMinJs.Observable.empty();
    }

    // Don't do anything if a task is already running.
    if (store.getState().runningTaskInfo != null) {
      return _rxjsBundlesRxMinJs.Observable.empty();
    }

    return _rxjsBundlesRxMinJs.Observable.concat((0, (_taskIdsAreEqual || _load_taskIdsAreEqual()).taskIdsAreEqual)(store.getState().activeTaskId, taskToRun) ? _rxjsBundlesRxMinJs.Observable.empty() : _rxjsBundlesRxMinJs.Observable.of((_Actions || _load_Actions()).selectTask(taskToRun)), store.getState().visible ? _rxjsBundlesRxMinJs.Observable.empty() : _rxjsBundlesRxMinJs.Observable.of((_Actions || _load_Actions()).setToolbarVisibility(true)), _rxjsBundlesRxMinJs.Observable.defer(() => {
      const state = store.getState();
      const activeTaskRunner = (0, (_Selectors || _load_Selectors()).getActiveTaskRunner)(state);

      if (activeTaskRunner == null) {
        return _rxjsBundlesRxMinJs.Observable.empty();
      }

      const taskMeta = (0, (_getTaskMetadata || _load_getTaskMetadata()).getTaskMetadata)(taskToRun, state.taskLists);

      if (!(taskMeta != null)) {
        throw new Error('Invariant violation: "taskMeta != null"');
      }

      if (!taskMeta.runnable) {
        return _rxjsBundlesRxMinJs.Observable.empty();
      }

      return createTaskObservable(activeTaskRunner, taskMeta, () => store.getState())
      // Stop listening once the task is done.
      .takeUntil(actions.ofType((_Actions || _load_Actions()).TASK_COMPLETED, (_Actions || _load_Actions()).TASK_ERRORED, (_Actions || _load_Actions()).TASK_STOPPED));
    }));
  });
}

function stopTaskEpic(actions, store) {
  return actions.ofType((_Actions || _load_Actions()).STOP_TASK).switchMap(action => {
    const { runningTaskInfo } = store.getState();
    const task = runningTaskInfo == null ? null : runningTaskInfo.task;
    if (task == null) {
      return _rxjsBundlesRxMinJs.Observable.empty();
    }
    return _rxjsBundlesRxMinJs.Observable.of({
      type: (_Actions || _load_Actions()).TASK_STOPPED,
      payload: { task }
    });
  });
}

function toggleToolbarVisibilityEpic(actions, store) {
  return actions.ofType((_Actions || _load_Actions()).TOGGLE_TOOLBAR_VISIBILITY).switchMap(action => {
    if (!(action.type === (_Actions || _load_Actions()).TOGGLE_TOOLBAR_VISIBILITY)) {
      throw new Error('Invariant violation: "action.type === Actions.TOGGLE_TOOLBAR_VISIBILITY"');
    }

    const state = store.getState();
    const { taskRunnerId } = action.payload;

    // If no taskRunnerId is provided, just toggle the visibility.
    if (taskRunnerId == null) {
      return _rxjsBundlesRxMinJs.Observable.of((_Actions || _load_Actions()).setToolbarVisibility(!state.visible));
    }

    // If the active task corresponds to the task runner you want to toggle, just toggle the
    // visibility.
    const { activeTaskId } = state;
    if (activeTaskId != null && activeTaskId.taskRunnerId === taskRunnerId) {
      return _rxjsBundlesRxMinJs.Observable.of((_Actions || _load_Actions()).setToolbarVisibility(!state.visible));
    }

    // Choose the first task for that task runner.
    const taskListForRunner = state.taskLists.get(taskRunnerId) || [];
    const taskIdToSelect = taskListForRunner.length > 0 ? taskListForRunner[0] : null;
    if (taskIdToSelect == null) {
      const taskRunner = state.taskRunners.get(taskRunnerId);

      if (!(taskRunner != null)) {
        throw new Error('Invariant violation: "taskRunner != null"');
      }

      atom.notifications.addWarning(`The ${ taskRunner.name } task runner doesn't have any tasks!`);
    }

    return _rxjsBundlesRxMinJs.Observable.concat(
    // Make sure the toolbar is shown.
    _rxjsBundlesRxMinJs.Observable.of((_Actions || _load_Actions()).setToolbarVisibility(true)),

    // Select the task.
    taskIdToSelect == null ? _rxjsBundlesRxMinJs.Observable.empty() : _rxjsBundlesRxMinJs.Observable.of((_Actions || _load_Actions()).selectTask(taskIdToSelect)));
  });
}

let taskFailedNotification;

/**
 * Run a task and transform its output into domain-specific actions.
 */
function createTaskObservable(taskRunner, taskMeta, getState) {
  return _rxjsBundlesRxMinJs.Observable.defer(() => {
    if (taskFailedNotification != null) {
      taskFailedNotification.dismiss();
    }
    const task = taskRunner.runTask(taskMeta.type);
    const events = (0, (_tasks || _load_tasks()).observableFromTask)(task);

    return _rxjsBundlesRxMinJs.Observable.of({
      type: (_Actions || _load_Actions()).TASK_STARTED,
      payload: { task }
    }).concat(events.filter(event => event.type === 'progress').map(event => ({
      type: (_Actions || _load_Actions()).TASK_PROGRESS,
      payload: { progress: event.progress }
    }))).concat(_rxjsBundlesRxMinJs.Observable.of({
      type: (_Actions || _load_Actions()).TASK_COMPLETED,
      payload: { task }
    }));
  }).catch(error => {
    taskFailedNotification = atom.notifications.addError(`The task "${ taskMeta.label }" failed`, {
      description: error.message,
      dismissable: true
    });
    taskFailedNotification.onDidDismiss(() => {
      taskFailedNotification = null;
    });
    (0, (_nuclideLogging || _load_nuclideLogging()).getLogger)().error('Error running task:', taskMeta, error);
    const { runningTaskInfo } = getState();
    return _rxjsBundlesRxMinJs.Observable.of({
      type: (_Actions || _load_Actions()).TASK_ERRORED,
      payload: {
        error,
        task: runningTaskInfo == null ? null : runningTaskInfo.task
      }
    });
  }).share();
}

function getTaskMeta(taskId, taskLists) {
  for (const taskList of taskLists.values()) {
    for (const taskMeta of taskList) {
      if ((0, (_taskIdsAreEqual || _load_taskIdsAreEqual()).taskIdsAreEqual)(taskId, taskMeta)) {
        return taskMeta;
      }
    }
  }
}