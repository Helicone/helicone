function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
/* eslint no-console: 0 */
var PREFIX_LIST = ['Webkit', 'Moz', 'O', 'ms'];
var IN_LINE_PREFIX_LIST = ['-webkit-', '-moz-', '-o-', '-ms-'];
var IN_COMPATIBLE_PROPERTY = ['transform', 'transformOrigin', 'transition'];
export var getIntersectionKeys = function getIntersectionKeys(preObj, nextObj) {
  return [Object.keys(preObj), Object.keys(nextObj)].reduce(function (a, b) {
    return a.filter(function (c) {
      return b.includes(c);
    });
  });
};
export var identity = function identity(param) {
  return param;
};

/*
 * @description: convert camel case to dash case
 * string => string
 */
export var getDashCase = function getDashCase(name) {
  return name.replace(/([A-Z])/g, function (v) {
    return "-".concat(v.toLowerCase());
  });
};

/*
 * @description: add compatible style prefix
 * (string, string) => object
 */
export var generatePrefixStyle = function generatePrefixStyle(name, value) {
  if (IN_COMPATIBLE_PROPERTY.indexOf(name) === -1) {
    return _defineProperty({}, name, Number.isNaN(value) ? 0 : value);
  }
  var isTransition = name === 'transition';
  var camelName = name.replace(/(\w)/, function (v) {
    return v.toUpperCase();
  });
  var styleVal = value;
  return PREFIX_LIST.reduce(function (result, property, i) {
    if (isTransition) {
      styleVal = value.replace(/(transform|transform-origin)/gim, "".concat(IN_LINE_PREFIX_LIST[i], "$1"));
    }
    return _objectSpread(_objectSpread({}, result), {}, _defineProperty({}, property + camelName, styleVal));
  }, {});
};
export var log = function log() {
  var _console;
  (_console = console).log.apply(_console, arguments);
};

/*
 * @description: log the value of a varible
 * string => any => any
 */
export var debug = function debug(name) {
  return function (item) {
    log(name, item);
    return item;
  };
};

/*
 * @description: log name, args, return value of a function
 * function => function
 */
export var debugf = function debugf(tag, f) {
  return function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    var res = f.apply(void 0, args);
    var name = tag || f.name || 'anonymous function';
    var argNames = "(".concat(args.map(JSON.stringify).join(', '), ")");
    log("".concat(name, ": ").concat(argNames, " => ").concat(JSON.stringify(res)));
    return res;
  };
};

/*
 * @description: map object on every element in this object.
 * (function, object) => object
 */
export var mapObject = function mapObject(fn, obj) {
  return Object.keys(obj).reduce(function (res, key) {
    return _objectSpread(_objectSpread({}, res), {}, _defineProperty({}, key, fn(key, obj[key])));
  }, {});
};

/*
 * @description: add compatible prefix to style
 * object => object
 */
export var translateStyle = function translateStyle(style) {
  return Object.keys(style).reduce(function (res, key) {
    return _objectSpread(_objectSpread({}, res), generatePrefixStyle(key, res[key]));
  }, style);
};
export var compose = function compose() {
  for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    args[_key2] = arguments[_key2];
  }
  if (!args.length) {
    return identity;
  }
  var fns = args.reverse();
  // first function can receive multiply arguments
  var firstFn = fns[0];
  var tailsFn = fns.slice(1);
  return function () {
    return tailsFn.reduce(function (res, fn) {
      return fn(res);
    }, firstFn.apply(void 0, arguments));
  };
};
export var getTransitionVal = function getTransitionVal(props, duration, easing) {
  return props.map(function (prop) {
    return "".concat(getDashCase(prop), " ").concat(duration, "ms ").concat(easing);
  }).join(',');
};
var isDev = process.env.NODE_ENV !== 'production';
export var warn = function warn(condition, format, a, b, c, d, e, f) {
  if (isDev && typeof console !== 'undefined' && console.warn) {
    if (format === undefined) {
      console.warn('LogUtils requires an error message argument');
    }
    if (!condition) {
      if (format === undefined) {
        console.warn('Minified exception occurred; use the non-minified dev environment ' + 'for the full error message and additional helpful warnings.');
      } else {
        var args = [a, b, c, d, e, f];
        var argIndex = 0;
        console.warn(format.replace(/%s/g, function () {
          return args[argIndex++];
        }));
      }
    }
  }
};