var _excluded = ["children", "appearOptions", "enterOptions", "leaveOptions"];
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }
function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }
function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }
function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }
function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
import React, { Component, Children } from 'react';
import { Transition } from 'react-transition-group';
import PropTypes from 'prop-types';
import Animate from './Animate';
if (Number.isFinite === undefined) {
  Number.isFinite = function (value) {
    return typeof value === 'number' && isFinite(value);
  };
}
var parseDurationOfSingleTransition = function parseDurationOfSingleTransition() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var steps = options.steps,
    duration = options.duration;
  if (steps && steps.length) {
    return steps.reduce(function (result, entry) {
      return result + (Number.isFinite(entry.duration) && entry.duration > 0 ? entry.duration : 0);
    }, 0);
  }
  if (Number.isFinite(duration)) {
    return duration;
  }
  return 0;
};
var AnimateGroupChild = /*#__PURE__*/function (_Component) {
  _inherits(AnimateGroupChild, _Component);
  var _super = _createSuper(AnimateGroupChild);
  function AnimateGroupChild() {
    var _this;
    _classCallCheck(this, AnimateGroupChild);
    _this = _super.call(this);
    _defineProperty(_assertThisInitialized(_this), "handleEnter", function (node, isAppearing) {
      var _this$props = _this.props,
        appearOptions = _this$props.appearOptions,
        enterOptions = _this$props.enterOptions;
      _this.handleStyleActive(isAppearing ? appearOptions : enterOptions);
    });
    _defineProperty(_assertThisInitialized(_this), "handleExit", function () {
      var leaveOptions = _this.props.leaveOptions;
      _this.handleStyleActive(leaveOptions);
    });
    _this.state = {
      isActive: false
    };
    return _this;
  }
  _createClass(AnimateGroupChild, [{
    key: "handleStyleActive",
    value: function handleStyleActive(style) {
      if (style) {
        var onAnimationEnd = style.onAnimationEnd ? function () {
          style.onAnimationEnd();
        } : null;
        this.setState(_objectSpread(_objectSpread({}, style), {}, {
          onAnimationEnd: onAnimationEnd,
          isActive: true
        }));
      }
    }
  }, {
    key: "parseTimeout",
    value: function parseTimeout() {
      var _this$props2 = this.props,
        appearOptions = _this$props2.appearOptions,
        enterOptions = _this$props2.enterOptions,
        leaveOptions = _this$props2.leaveOptions;
      return parseDurationOfSingleTransition(appearOptions) + parseDurationOfSingleTransition(enterOptions) + parseDurationOfSingleTransition(leaveOptions);
    }
  }, {
    key: "render",
    value: function render() {
      var _this2 = this;
      var _this$props3 = this.props,
        children = _this$props3.children,
        appearOptions = _this$props3.appearOptions,
        enterOptions = _this$props3.enterOptions,
        leaveOptions = _this$props3.leaveOptions,
        props = _objectWithoutProperties(_this$props3, _excluded);
      return /*#__PURE__*/React.createElement(Transition, _extends({}, props, {
        onEnter: this.handleEnter,
        onExit: this.handleExit,
        timeout: this.parseTimeout()
      }), function () {
        return /*#__PURE__*/React.createElement(Animate, _this2.state, Children.only(children));
      });
    }
  }]);
  return AnimateGroupChild;
}(Component);
AnimateGroupChild.propTypes = {
  appearOptions: PropTypes.object,
  enterOptions: PropTypes.object,
  leaveOptions: PropTypes.object,
  children: PropTypes.element
};
export default AnimateGroupChild;