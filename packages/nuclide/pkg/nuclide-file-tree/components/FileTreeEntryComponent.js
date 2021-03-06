'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FileTreeEntryComponent = undefined;

var _FileTreeActions;

function _load_FileTreeActions() {
  return _FileTreeActions = _interopRequireDefault(require('../lib/FileTreeActions'));
}

var _reactForAtom = require('react-for-atom');

var _classnames;

function _load_classnames() {
  return _classnames = _interopRequireDefault(require('classnames'));
}

var _fileTypeClass;

function _load_fileTypeClass() {
  return _fileTypeClass = _interopRequireDefault(require('../../commons-atom/file-type-class'));
}

var _observable;

function _load_observable() {
  return _observable = require('../../commons-node/observable');
}

var _UniversalDisposable;

function _load_UniversalDisposable() {
  return _UniversalDisposable = _interopRequireDefault(require('../../commons-node/UniversalDisposable'));
}

var _FileTreeFilterHelper;

function _load_FileTreeFilterHelper() {
  return _FileTreeFilterHelper = require('../lib/FileTreeFilterHelper');
}

var _Checkbox;

function _load_Checkbox() {
  return _Checkbox = require('../../nuclide-ui/Checkbox');
}

var _hgConstants;

function _load_hgConstants() {
  return _hgConstants = require('../../nuclide-hg-rpc/lib/hg-constants');
}

var _FileTreeStore;

function _load_FileTreeStore() {
  return _FileTreeStore = require('../lib/FileTreeStore');
}

var _FileTreeHgHelpers;

function _load_FileTreeHgHelpers() {
  return _FileTreeHgHelpers = _interopRequireDefault(require('../lib/FileTreeHgHelpers'));
}

var _addTooltip;

function _load_addTooltip() {
  return _addTooltip = _interopRequireDefault(require('../../nuclide-ui/add-tooltip'));
}

var _os = _interopRequireDefault(require('os'));

var _rxjsBundlesRxMinJs = require('rxjs/bundles/Rx.min.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const store = (_FileTreeStore || _load_FileTreeStore()).FileTreeStore.getInstance(); /**
                                                                                      * Copyright (c) 2015-present, Facebook, Inc.
                                                                                      * All rights reserved.
                                                                                      *
                                                                                      * This source code is licensed under the license found in the LICENSE file in
                                                                                      * the root directory of this source tree.
                                                                                      *
                                                                                      * 
                                                                                      */

const getActions = (_FileTreeActions || _load_FileTreeActions()).default.getInstance;

const SUBSEQUENT_FETCH_SPINNER_DELAY = 500;
const INITIAL_FETCH_SPINNER_DELAY = 25;
const INDENT_LEVEL = 17;

class FileTreeEntryComponent extends _reactForAtom.React.Component {
  // Keep track of the # of dragenter/dragleave events in order to properly decide
  // when an entry is truly hovered/unhovered, since these fire many times over
  // the duration of one user interaction.
  constructor(props) {
    super(props);
    this.dragEventCount = 0;
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onClick = this._onClick.bind(this);
    this._onDoubleClick = this._onDoubleClick.bind(this);

    this._onDragEnter = this._onDragEnter.bind(this);
    this._onDragLeave = this._onDragLeave.bind(this);
    this._onDragStart = this._onDragStart.bind(this);
    this._onDragOver = this._onDragOver.bind(this);
    this._onDrop = this._onDrop.bind(this);

    this._checkboxOnChange = this._checkboxOnChange.bind(this);
    this._checkboxOnClick = this._checkboxOnClick.bind(this);

    this.state = {
      isLoading: false
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextProps.node !== this.props.node || nextState.isLoading !== this.state.isLoading;
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.node.isLoading) {
      const spinnerDelay = nextProps.node.wasFetched ? SUBSEQUENT_FETCH_SPINNER_DELAY : INITIAL_FETCH_SPINNER_DELAY;

      this._loadingTimeout = setTimeout(() => {
        this._loadingTimeout = null;
        this.setState({
          isLoading: Boolean(this.props.node.isLoading)
        });
      }, spinnerDelay);
    } else {
      clearTimeout(this._loadingTimeout);
      this._loadingTimeout = null;
      this.setState({
        isLoading: false
      });
    }
  }

  componentDidMount() {
    const el = _reactForAtom.ReactDOM.findDOMNode(this);
    this._disposables = new (_UniversalDisposable || _load_UniversalDisposable()).default(
    // Because this element can be inside of an Atom panel (which adds its own drag and drop
    // handlers) we need to sidestep React's event delegation.
    _rxjsBundlesRxMinJs.Observable.fromEvent(el, 'dragenter').subscribe(this._onDragEnter), _rxjsBundlesRxMinJs.Observable.fromEvent(el, 'dragleave').subscribe(this._onDragLeave), _rxjsBundlesRxMinJs.Observable.fromEvent(el, 'dragstart').subscribe(this._onDragStart), _rxjsBundlesRxMinJs.Observable.fromEvent(el, 'dragover').subscribe(this._onDragOver), _rxjsBundlesRxMinJs.Observable.fromEvent(el, 'drop').subscribe(this._onDrop));
  }

  componentWillUnmount() {
    if (!(this._disposables != null)) {
      throw new Error('Invariant violation: "this._disposables != null"');
    }

    this._disposables.dispose();
    if (this._loadingTimeout != null) {
      clearTimeout(this._loadingTimeout);
    }
  }

  render() {
    const node = this.props.node;

    const outerClassName = (0, (_classnames || _load_classnames()).default)('entry', {
      'file list-item': !node.isContainer,
      'directory list-nested-item': node.isContainer,
      'current-working-directory': node.isCwd,
      'collapsed': !node.isLoading && !node.isExpanded,
      'expanded': !node.isLoading && node.isExpanded,
      'project-root': node.isRoot,
      'selected': node.isSelected || node.isDragHovered,
      'nuclide-file-tree-softened': node.shouldBeSoftened
    });
    const listItemClassName = (0, (_classnames || _load_classnames()).default)({
      'header list-item': node.isContainer,
      'loading': this.state.isLoading
    });

    let statusClass;
    if (!node.conf.isEditingWorkingSet) {
      const vcsStatusCode = node.vcsStatusCode;
      if (vcsStatusCode === (_hgConstants || _load_hgConstants()).StatusCodeNumber.MODIFIED) {
        statusClass = 'status-modified';
      } else if (vcsStatusCode === (_hgConstants || _load_hgConstants()).StatusCodeNumber.ADDED) {
        statusClass = 'status-added';
      } else if (node.isIgnored) {
        statusClass = 'status-ignored';
      } else {
        statusClass = '';
      }
    } else {
      switch (node.checkedStatus) {
        case 'checked':
          statusClass = 'status-added';
          break;
        case 'partial':
          statusClass = 'status-modified';
          break;
        default:
          statusClass = '';
          break;
      }
    }

    let iconName;
    let tooltip;
    if (node.isContainer) {
      if (node.isCwd) {
        iconName = 'icon-nuclicon-file-directory-starred';
        tooltip = (0, (_addTooltip || _load_addTooltip()).default)({ title: 'Current Working Root' });
      } else {
        iconName = 'icon-nuclicon-file-directory';
      }
    } else {
      iconName = (0, (_fileTypeClass || _load_fileTypeClass()).default)(node.name);
    }

    return _reactForAtom.React.createElement(
      'li',
      {
        className: `${ outerClassName } ${ statusClass }`,
        style: { paddingLeft: this.props.node.getDepth() * INDENT_LEVEL },
        draggable: true,
        onMouseDown: this._onMouseDown,
        onClick: this._onClick,
        onDoubleClick: this._onDoubleClick },
      _reactForAtom.React.createElement(
        'div',
        {
          className: listItemClassName,
          ref: 'arrowContainer' },
        _reactForAtom.React.createElement(
          'span',
          {
            className: `icon name ${ iconName }`,
            ref: elem => {
              this._pathContainer = elem;
              tooltip && tooltip(elem);
            },
            'data-name': node.name,
            'data-path': node.uri },
          this._renderCheckbox(),
          _reactForAtom.React.createElement(
            'span',
            {
              'data-name': node.name,
              'data-path': node.uri },
            (0, (_FileTreeFilterHelper || _load_FileTreeFilterHelper()).filterName)(node.name, node.highlightedText, node.isSelected)
          )
        ),
        this._renderConnectionTitle()
      )
    );
  }

  _renderCheckbox() {
    if (!this.props.node.conf.isEditingWorkingSet) {
      return;
    }

    return _reactForAtom.React.createElement((_Checkbox || _load_Checkbox()).Checkbox, {
      checked: this.props.node.checkedStatus === 'checked',
      indeterminate: this.props.node.checkedStatus === 'partial',
      onChange: this._checkboxOnChange,
      onClick: this._checkboxOnClick
    });
  }

  _renderConnectionTitle() {
    if (!this.props.node.isRoot) {
      return null;
    }
    const title = this.props.node.connectionTitle;
    if (title === '' || title === '(default)') {
      return null;
    }

    return _reactForAtom.React.createElement(
      'span',
      { className: 'nuclide-file-tree-connection-title highlight' },
      title
    );
  }

  _isToggleNodeExpand(event) {
    if (!this._pathContainer) {
      return;
    }

    const node = this.props.node;
    return node.isContainer && _reactForAtom.ReactDOM.findDOMNode(this.refs.arrowContainer).contains(event.target) && event.clientX < _reactForAtom.ReactDOM.findDOMNode(this._pathContainer).getBoundingClientRect().left;
  }

  _onMouseDown(event) {
    event.stopPropagation();
    if (this._isToggleNodeExpand(event)) {
      return;
    }

    const node = this.props.node;

    const selectionMode = getSelectionMode(event);
    if (selectionMode === 'multi-select' && !node.isSelected) {
      getActions().addSelectedNode(node.rootUri, node.uri);
    } else if (selectionMode === 'range-select') {
      getActions().rangeSelectToNode(node.rootUri, node.uri);
    } else if (selectionMode === 'single-select' && !node.isSelected) {
      getActions().setSelectedNode(node.rootUri, node.uri);
    }
  }

  _onClick(event) {
    event.stopPropagation();
    const node = this.props.node;

    const deep = event.altKey;
    if (this._isToggleNodeExpand(event)) {
      this._toggleNodeExpanded(deep);
      return;
    }

    const selectionMode = getSelectionMode(event);

    if (selectionMode === 'range-select' || selectionMode === 'invalid-select') {
      return;
    }

    if (selectionMode === 'multi-select') {
      if (node.isFocused) {
        getActions().unselectNode(node.rootUri, node.uri);
        // If this node was just unselected, immediately return and skip
        // the statement below that sets this node to focused.
        return;
      }
    } else {
      if (node.isContainer) {
        if (node.isFocused || node.conf.usePreviewTabs) {
          this._toggleNodeExpanded(deep);
        }
      } else {
        if (node.conf.usePreviewTabs) {
          getActions().confirmNode(node.rootUri, node.uri);
        }
      }
      // Set selected node to clear any other selected nodes (i.e. in the case of
      // previously having multiple selections).
      getActions().setSelectedNode(node.rootUri, node.uri);
    }

    if (node.isSelected) {
      getActions().setFocusedNode(node.rootUri, node.uri);
    }
  }

  _onDoubleClick(event) {
    event.stopPropagation();

    if (this.props.node.isContainer) {
      return;
    }

    if (this.props.node.conf.usePreviewTabs) {
      getActions().keepPreviewTab();
    } else {
      getActions().confirmNode(this.props.node.rootUri, this.props.node.uri);
    }
  }

  _onDragEnter(event) {
    event.stopPropagation();
    const movableNodes = store.getSelectedNodes().filter(node => (_FileTreeHgHelpers || _load_FileTreeHgHelpers()).default.isValidRename(node, this.props.node.uri));

    // Ignores hover over invalid targets.
    if (!this.props.node.isContainer || movableNodes.size === 0) {
      return;
    }
    if (this.dragEventCount <= 0) {
      this.dragEventCount = 0;
      getActions().setDragHoveredNode(this.props.node.rootUri, this.props.node.uri);
    }
    this.dragEventCount++;
  }

  _onDragLeave(event) {
    event.stopPropagation();
    // Avoid calling an unhoverNode action if dragEventCount is already 0.
    if (this.dragEventCount === 0) {
      return;
    }
    this.dragEventCount--;
    if (this.dragEventCount <= 0) {
      this.dragEventCount = 0;
      getActions().unhoverNode(this.props.node.rootUri, this.props.node.uri);
    }
  }

  _onDragStart(event) {
    event.stopPropagation();
    const target = this._pathContainer;
    if (target == null) {
      return;
    }

    const fileIcon = target.cloneNode(false);
    fileIcon.style.cssText = 'position: absolute; top: 0; left: 0; color: #fff; opacity: .8;';
    document.body.appendChild(fileIcon);

    const { dataTransfer } = event;
    if (dataTransfer != null) {
      dataTransfer.effectAllowed = 'move';
      dataTransfer.setDragImage(fileIcon, -8, -4);
      dataTransfer.setData('initialPath', this.props.node.uri);
    }
    (_observable || _load_observable()).nextAnimationFrame.subscribe(() => {
      document.body.removeChild(fileIcon);
    });
  }

  _onDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  _onDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    // Reset the dragEventCount for the currently dragged node upon dropping.
    this.dragEventCount = 0;
    getActions().moveToNode(this.props.node.rootUri, this.props.node.uri);
  }

  _toggleNodeExpanded(deep) {
    if (this.props.node.isExpanded) {
      if (deep) {
        getActions().collapseNodeDeep(this.props.node.rootUri, this.props.node.uri);
      } else {
        getActions().collapseNode(this.props.node.rootUri, this.props.node.uri);
      }
    } else {
      if (deep) {
        getActions().expandNodeDeep(this.props.node.rootUri, this.props.node.uri);
      } else {
        getActions().expandNode(this.props.node.rootUri, this.props.node.uri);
      }
    }
  }

  _checkboxOnChange(isChecked) {
    if (isChecked) {
      getActions().checkNode(this.props.node.rootUri, this.props.node.uri);
    } else {
      getActions().uncheckNode(this.props.node.rootUri, this.props.node.uri);
    }
  }

  _checkboxOnClick(event) {
    event.stopPropagation();
  }
}

exports.FileTreeEntryComponent = FileTreeEntryComponent;
function getSelectionMode(event) {
  if (_os.default.platform() === 'darwin' && event.metaKey && event.button === 0 || _os.default.platform() !== 'darwin' && event.ctrlKey && event.button === 0) {
    return 'multi-select';
  }
  if (event.shiftKey && event.button === 0) {
    return 'range-select';
  }
  if (!event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
    return 'single-select';
  }
  return 'invalid-select';
}