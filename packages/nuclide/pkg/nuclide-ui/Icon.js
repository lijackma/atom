'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Icon = undefined;

var _classnames;

function _load_classnames() {
  return _classnames = _interopRequireDefault(require('classnames'));
}

var _reactForAtom = require('react-for-atom');

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

/**
 * Renders an icon with optional text next to it.
 */
const Icon = props => {
  const {
    icon,
    children,
    className
  } = props;

  const remainingProps = _objectWithoutProperties(props, ['icon', 'children', 'className']);

  const newClassName = (0, (_classnames || _load_classnames()).default)(className, icon == null ? null : `icon icon-${ icon }`);
  return _reactForAtom.React.createElement(
    'span',
    Object.assign({ className: newClassName }, remainingProps),
    children
  );
};
exports.Icon = Icon;