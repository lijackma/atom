'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.activate = activate;
exports.deactivate = deactivate;
exports.registerProvider = registerProvider;
exports.consumeCWD = consumeCWD;
exports.consumeDeepLinkService = consumeDeepLinkService;
exports.getHomeFragments = getHomeFragments;

var _reactForAtom = require('react-for-atom');

var _QuickSelectionComponent;

function _load_QuickSelectionComponent() {
  return _QuickSelectionComponent = _interopRequireDefault(require('./QuickSelectionComponent'));
}

var _featureConfig;

function _load_featureConfig() {
  return _featureConfig = _interopRequireDefault(require('../../commons-atom/featureConfig'));
}

var _goToLocation;

function _load_goToLocation() {
  return _goToLocation = require('../../commons-atom/go-to-location');
}

var _nuclideAnalytics;

function _load_nuclideAnalytics() {
  return _nuclideAnalytics = require('../../nuclide-analytics');
}

var _debounce;

function _load_debounce() {
  return _debounce = _interopRequireDefault(require('../../commons-node/debounce'));
}

var _UniversalDisposable;

function _load_UniversalDisposable() {
  return _UniversalDisposable = _interopRequireDefault(require('../../commons-node/UniversalDisposable'));
}

var _SearchResultManager;

function _load_SearchResultManager() {
  return _SearchResultManager = _interopRequireDefault(require('./SearchResultManager'));
}

var _QuickOpenProviderRegistry;

function _load_QuickOpenProviderRegistry() {
  return _QuickOpenProviderRegistry = _interopRequireDefault(require('./QuickOpenProviderRegistry'));
}

var _QuickSelectionActions;

function _load_QuickSelectionActions() {
  return _QuickSelectionActions = _interopRequireDefault(require('./QuickSelectionActions'));
}

var _QuickSelectionDispatcher;

function _load_QuickSelectionDispatcher() {
  return _QuickSelectionDispatcher = _interopRequireDefault(require('./QuickSelectionDispatcher'));
}

var _QuickSelectionDispatcher2;

function _load_QuickSelectionDispatcher2() {
  return _QuickSelectionDispatcher2 = require('./QuickSelectionDispatcher');
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Don't pre-fill search input if selection is longer than this:
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 *
 * 
 */

const MAX_SELECTION_LENGTH = 1000;
const ANALYTICS_CHANGE_SELECTION_DEBOUCE = 100;

class Activation {

  constructor() {
    this._analyticsSessionId = null;
    this._previousFocus = null;
    this._quickOpenProviderRegistry = new (_QuickOpenProviderRegistry || _load_QuickOpenProviderRegistry()).default();
    this._quickSelectionDispatcher = new (_QuickSelectionDispatcher || _load_QuickSelectionDispatcher()).default();
    this._quickSelectionActions = new (_QuickSelectionActions || _load_QuickSelectionActions()).default(this._quickSelectionDispatcher);
    this._searchResultManager = new (_SearchResultManager || _load_SearchResultManager()).default(this._quickOpenProviderRegistry);
    this._dispatcherToken = this._quickSelectionDispatcher.register(this._handleActions.bind(this));
    this._subscriptions = new (_UniversalDisposable || _load_UniversalDisposable()).default(atom.commands.add('atom-workspace', {
      'nuclide-quick-open:find-anything-via-omni-search': () => {
        this._quickSelectionActions.changeActiveProvider('OmniSearchResultProvider');
      }
    }), atom.commands.add('body', 'core:cancel', () => {
      if (this._searchPanel && this._searchPanel.isVisible()) {
        this._closeSearchPanel();
      }
    }));

    this._closeSearchPanel = this._closeSearchPanel.bind(this);
    this._handleSelection = this._handleSelection.bind(this);
    this._handleSelectionChanged = (0, (_debounce || _load_debounce()).default)(this._handleSelectionChanged.bind(this), ANALYTICS_CHANGE_SELECTION_DEBOUCE);
  }

  _handleActions(action) {
    switch (action.actionType) {
      case (_QuickSelectionDispatcher2 || _load_QuickSelectionDispatcher2()).ActionTypes.ACTIVE_PROVIDER_CHANGED:
        this._handleActiveProviderChange(action.providerName);
        break;
      case (_QuickSelectionDispatcher2 || _load_QuickSelectionDispatcher2()).ActionTypes.QUERY:
        this._searchResultManager.executeQuery(action.query);
        break;
    }
  }

  _render() {
    if (this._searchPanel == null) {
      this._searchPanel = atom.workspace.addModalPanel({
        item: document.createElement('div'),
        visible: false,
        className: 'nuclide-quick-open'
      });
    }

    const searchPanel = this._searchPanel;

    if (!(searchPanel != null)) {
      throw new Error('Invariant violation: "searchPanel != null"');
    }

    const _searchComponent = _reactForAtom.ReactDOM.render(_reactForAtom.React.createElement((_QuickSelectionComponent || _load_QuickSelectionComponent()).default, {
      quickSelectionActions: this._quickSelectionActions,
      searchResultManager: this._searchResultManager,
      onSelection: this._handleSelection,
      onCancellation: this._closeSearchPanel
    }), searchPanel.getItem());

    if (!(_searchComponent instanceof (_QuickSelectionComponent || _load_QuickSelectionComponent()).default)) {
      throw new Error('Invariant violation: "_searchComponent instanceof QuickSelectionComponent"');
    }

    this._searchComponent = _searchComponent;
  }

  _handleSelection(selections, providerName, query) {
    for (let i = 0; i < selections.length; i++) {
      const selection = selections[i];
      (0, (_goToLocation || _load_goToLocation()).goToLocation)(selection.path, selection.line, selection.column);
      (0, (_nuclideAnalytics || _load_nuclideAnalytics()).track)('quickopen-select-file', {
        'quickopen-filepath': selection.path,
        'quickopen-query': query,
        // The currently open "tab".
        'quickopen-provider': providerName,
        'quickopen-session': this._analyticsSessionId || '',
        // Because the `provider` is usually OmniSearch, also track the original provider.
        'quickopen-provider-source': selection.sourceProvider || ''
      });
    }
    this._closeSearchPanel();
  }

  _handleSelectionChanged(selectionIndex, providerName, query) {
    // Only track user-initiated selection-change events.
    if (this._analyticsSessionId != null) {
      (0, (_nuclideAnalytics || _load_nuclideAnalytics()).track)('quickopen-change-selection', {
        'quickopen-selected-index': selectionIndex.selectedItemIndex.toString(),
        'quickopen-selected-service': selectionIndex.selectedService,
        'quickopen-selected-directory': selectionIndex.selectedDirectory,
        'quickopen-session': this._analyticsSessionId
      });
    }
  }

  _handleActiveProviderChange(newProviderName) {
    /**
     * A "session" for the purpose of analytics. It exists from the moment the
     * quick-open UI becomes visible until it gets closed, either via file
     * selection or cancellation.
     */
    this._analyticsSessionId = this._analyticsSessionId || Date.now().toString();
    (0, (_nuclideAnalytics || _load_nuclideAnalytics()).track)('quickopen-change-tab', {
      'quickopen-provider': newProviderName,
      'quickopen-session': this._analyticsSessionId
    });
    if (this._searchPanel != null && this._searchPanel.isVisible() && this._searchResultManager.getActiveProviderName() === newProviderName) {
      this._closeSearchPanel();
    } else {
      this._searchResultManager.setActiveProvider(newProviderName);
      this._render();
      this._showSearchPanel();
    }
  }

  _showSearchPanel(initialQuery) {
    this._previousFocus = document.activeElement;
    const { _searchComponent, _searchPanel } = this;
    if (_searchComponent != null && _searchPanel != null) {
      // Start a new search "session" for analytics purposes.
      (0, (_nuclideAnalytics || _load_nuclideAnalytics()).track)('quickopen-open-panel', {
        'quickopen-session': this._analyticsSessionId || ''
      });
      // _showSearchPanel gets called when changing providers even if it's already shown.
      const isAlreadyVisible = _searchPanel.isVisible();
      _searchPanel.show();
      _searchComponent.focus();
      if (initialQuery != null) {
        _searchComponent.setInputValue(initialQuery);
      } else if ((_featureConfig || _load_featureConfig()).default.get('nuclide-quick-open.useSelection') && !isAlreadyVisible) {
        const editor = atom.workspace.getActiveTextEditor();
        const selectedText = editor != null && editor.getSelections()[0].getText();
        if (selectedText && selectedText.length <= MAX_SELECTION_LENGTH) {
          _searchComponent.setInputValue(selectedText.split('\n')[0]);
        }
      }
      _searchComponent.selectInput();
    }
  }

  _closeSearchPanel() {
    const { _searchComponent, _searchPanel } = this;
    if (_searchComponent != null && _searchPanel != null && _searchPanel.isVisible()) {
      (0, (_nuclideAnalytics || _load_nuclideAnalytics()).track)('quickopen-close-panel', {
        'quickopen-session': this._analyticsSessionId || ''
      });
      _searchPanel.hide();
      _searchComponent.blur();
      this._analyticsSessionId = null;
    }

    if (this._previousFocus != null) {
      this._previousFocus.focus();
      this._previousFocus = null;
    }
  }

  registerProvider(service) {
    const subscriptions = new (_UniversalDisposable || _load_UniversalDisposable()).default(this._quickOpenProviderRegistry.addProvider(service));

    // If the provider is renderable and specifies a keybinding, wire it up with
    // the toggle command.
    if (service.display != null && service.display.action != null) {
      subscriptions.add(atom.commands.add('atom-workspace', {
        [service.display.action]: () => {
          this._quickSelectionActions.changeActiveProvider(service.name);
        }
      }));
    }

    return subscriptions;
  }

  consumeCWDService(service) {
    const disposable = service.observeCwd(dir => {
      this._searchResultManager.setCurrentWorkingRoot(dir);
    });
    this._subscriptions.add(disposable);
    return disposable;
  }

  consumeDeepLinkService(service) {
    const disposable = service.subscribeToPath('quick-open-query', params => {
      const { query } = params;
      if (typeof query === 'string') {
        if (this._searchComponent == null) {
          this._render();
        }
        this._showSearchPanel(query);
      }
    });
    this._subscriptions.add(disposable);
    return disposable;
  }

  dispose() {
    this._subscriptions.dispose();
    this._quickSelectionDispatcher.unregister(this._dispatcherToken);
    if (this._searchComponent != null) {
      const searchPanel = this._searchPanel;

      if (!(searchPanel != null)) {
        throw new Error('Invariant violation: "searchPanel != null"');
      }

      _reactForAtom.ReactDOM.unmountComponentAtNode(searchPanel.getItem());
      this._searchComponent = null;
    }
    if (this._searchPanel != null) {
      this._searchPanel.destroy();
      this._searchPanel = null;
    }
    // SearchResultManager's disposal causes QuickSelectionComponent to do work,
    // so dispose of SearchResultManager after unmounting QuickSelectionComponent.
    this._searchResultManager.dispose();
  }
}

let activation = null;

function activate() {
  activation = new Activation();
}

function deactivate() {
  if (!(activation != null)) {
    throw new Error('Invariant violation: "activation != null"');
  }

  activation.dispose();
  activation = null;
}

function registerProvider(service) {
  if (!(activation != null)) {
    throw new Error('Invariant violation: "activation != null"');
  }

  return activation.registerProvider(service);
}

function consumeCWD(cwd) {
  if (!(activation != null)) {
    throw new Error('Invariant violation: "activation != null"');
  }

  return activation.consumeCWDService(cwd);
}

function consumeDeepLinkService(service) {
  if (!(activation != null)) {
    throw new Error('Invariant violation: "activation != null"');
  }

  return activation.consumeDeepLinkService(service);
}

function getHomeFragments() {
  return {
    feature: {
      title: 'Quick Open',
      icon: 'search',
      description: 'A powerful search box to quickly find local and remote files and content.',
      command: 'nuclide-quick-open:find-anything-via-omni-search'
    },
    priority: 10
  };
}