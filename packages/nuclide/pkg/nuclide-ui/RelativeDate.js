'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _reactForAtom = require('react-for-atom');

var _string;

function _load_string() {
  return _string = require('../commons-node/string');
}

var _addTooltip;

function _load_addTooltip() {
  return _addTooltip = _interopRequireDefault(require('./add-tooltip'));
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; } /**
                                                                                                                                                                                                                              * Copyright (c) 2015-present, Facebook, Inc.
                                                                                                                                                                                                                              * All rights reserved.
                                                                                                                                                                                                                              *
                                                                                                                                                                                                                              * This source code is licensed under the license found in the LICENSE file in
                                                                                                                                                                                                                              * the root directory of this source tree.
                                                                                                                                                                                                                              *
                                                                                                                                                                                                                              * 
                                                                                                                                                                                                                              */

const DEFAULT_RERENDER_DELAY = 10000; // ms

/**
 * Renders a relative date that forces a re-render every `delay` ms,
 * in order to properly update the UI.
 *
 * Does not respond to changes to the initial `delay` for simplicity's sake.
 */
class RelativeDate extends _reactForAtom.React.Component {

  componentDidMount() {
    const { delay } = this.props;
    this._interval = setInterval(() => this.forceUpdate(), delay);
  }

  componentWillUnmount() {
    if (this._interval != null) {
      clearInterval(this._interval);
    }
  }

  render() {
    const {
      date,
      shorten,
      withToolip
    } = this.props;

    const remainingProps = _objectWithoutProperties(this.props, ['date', 'shorten', 'withToolip']);

    return _reactForAtom.React.createElement(
      'span',
      Object.assign({}, remainingProps, {
        ref: withToolip ? (0, (_addTooltip || _load_addTooltip()).default)({
          title: date.toLocaleString(),
          delay: 200,
          placement: 'top'
        }) : null }),
      (0, (_string || _load_string()).relativeDate)(date, undefined, shorten)
    );
  }
}
exports.default = RelativeDate;
RelativeDate.defaultProps = {
  delay: DEFAULT_RERENDER_DELAY,
  shorten: false,
  withToolip: false
};
module.exports = exports['default'];