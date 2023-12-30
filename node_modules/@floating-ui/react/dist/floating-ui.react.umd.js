(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react'), require('react-dom'), require('@floating-ui/react-dom')) :
  typeof define === 'function' && define.amd ? define(['exports', 'react', 'react-dom', '@floating-ui/react-dom'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.FloatingUIReactDOM = {}, global.React, global.ReactDOM, global.FloatingUIReactDOM));
})(this, (function (exports, React, reactDom$1, reactDom) { 'use strict';

  function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    var n = Object.create(null);
    if (e) {
      Object.keys(e).forEach(function (k) {
        if (k !== 'default') {
          var d = Object.getOwnPropertyDescriptor(e, k);
          Object.defineProperty(n, k, d.get ? d : {
            enumerable: true,
            get: function () { return e[k]; }
          });
        }
      });
    }
    n["default"] = e;
    return Object.freeze(n);
  }

  var React__namespace = /*#__PURE__*/_interopNamespace(React);

  var index = typeof document !== 'undefined' ? React.useLayoutEffect : React.useEffect;

  let serverHandoffComplete = false;
  let count = 0;
  const genId = () => "floating-ui-" + count++;
  function useFloatingId() {
    const [id, setId] = React__namespace.useState(() => serverHandoffComplete ? genId() : undefined);
    index(() => {
      if (id == null) {
        setId(genId());
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    React__namespace.useEffect(() => {
      if (!serverHandoffComplete) {
        serverHandoffComplete = true;
      }
    }, []);
    return id;
  }

  // `toString()` prevents bundlers from trying to `import { useId } from 'react'`
  const useReactId = React__namespace[/*#__PURE__*/'useId'.toString()];

  /**
   * Uses React 18's built-in `useId()` when available, or falls back to a
   * slightly less performant (requiring a double render) implementation for
   * earlier React versions.
   * @see https://floating-ui.com/docs/useId
   */
  const useId = useReactId || useFloatingId;

  function createPubSub() {
    const map = new Map();
    return {
      emit(event, data) {
        var _map$get;
        (_map$get = map.get(event)) == null ? void 0 : _map$get.forEach(handler => handler(data));
      },
      on(event, listener) {
        map.set(event, [...(map.get(event) || []), listener]);
      },
      off(event, listener) {
        map.set(event, (map.get(event) || []).filter(l => l !== listener));
      }
    };
  }

  const FloatingNodeContext = /*#__PURE__*/React__namespace.createContext(null);
  const FloatingTreeContext = /*#__PURE__*/React__namespace.createContext(null);
  const useFloatingParentNodeId = () => {
    var _React$useContext;
    return ((_React$useContext = React__namespace.useContext(FloatingNodeContext)) == null ? void 0 : _React$useContext.id) || null;
  };
  const useFloatingTree = () => React__namespace.useContext(FloatingTreeContext);

  /**
   * Registers a node into the floating tree, returning its id.
   */
  const useFloatingNodeId = customParentId => {
    const id = useId();
    const tree = useFloatingTree();
    const reactParentId = useFloatingParentNodeId();
    const parentId = customParentId || reactParentId;
    index(() => {
      const node = {
        id,
        parentId
      };
      tree == null ? void 0 : tree.addNode(node);
      return () => {
        tree == null ? void 0 : tree.removeNode(node);
      };
    }, [tree, id, parentId]);
    return id;
  };

  /**
   * Provides parent node context for nested floating elements.
   * @see https://floating-ui.com/docs/FloatingTree
   */
  const FloatingNode = _ref => {
    let {
      children,
      id
    } = _ref;
    const parentId = useFloatingParentNodeId();
    return /*#__PURE__*/React__namespace.createElement(FloatingNodeContext.Provider, {
      value: React__namespace.useMemo(() => ({
        id,
        parentId
      }), [id, parentId])
    }, children);
  };

  /**
   * Provides context for nested floating elements when they are not children of
   * each other on the DOM (i.e. portalled to a common node, rather than their
   * respective parent).
   * @see https://floating-ui.com/docs/FloatingTree
   */
  const FloatingTree = _ref2 => {
    let {
      children
    } = _ref2;
    const nodesRef = React__namespace.useRef([]);
    const addNode = React__namespace.useCallback(node => {
      nodesRef.current = [...nodesRef.current, node];
    }, []);
    const removeNode = React__namespace.useCallback(node => {
      nodesRef.current = nodesRef.current.filter(n => n !== node);
    }, []);
    const events = React__namespace.useState(() => createPubSub())[0];
    return /*#__PURE__*/React__namespace.createElement(FloatingTreeContext.Provider, {
      value: React__namespace.useMemo(() => ({
        nodesRef,
        addNode,
        removeNode,
        events
      }), [nodesRef, addNode, removeNode, events])
    }, children);
  };

  function getDocument(node) {
    return (node == null ? void 0 : node.ownerDocument) || document;
  }

  // Avoid Chrome DevTools blue warning.
  function getPlatform() {
    const uaData = navigator.userAgentData;
    if (uaData != null && uaData.platform) {
      return uaData.platform;
    }
    return navigator.platform;
  }
  function getUserAgent() {
    const uaData = navigator.userAgentData;
    if (uaData && Array.isArray(uaData.brands)) {
      return uaData.brands.map(_ref => {
        let {
          brand,
          version
        } = _ref;
        return brand + "/" + version;
      }).join(' ');
    }
    return navigator.userAgent;
  }

  function getWindow(value) {
    return getDocument(value).defaultView || window;
  }
  function isElement(value) {
    return value ? value instanceof getWindow(value).Element : false;
  }
  function isHTMLElement(value) {
    return value ? value instanceof getWindow(value).HTMLElement : false;
  }
  function isShadowRoot(node) {
    // Browsers without `ShadowRoot` support
    if (typeof ShadowRoot === 'undefined') {
      return false;
    }
    const OwnElement = getWindow(node).ShadowRoot;
    return node instanceof OwnElement || node instanceof ShadowRoot;
  }

  // License: https://github.com/adobe/react-spectrum/blob/b35d5c02fe900badccd0cf1a8f23bb593419f238/packages/@react-aria/utils/src/isVirtualEvent.ts
  function isVirtualClick(event) {
    if (event.mozInputSource === 0 && event.isTrusted) {
      return true;
    }
    const androidRe = /Android/i;
    if ((androidRe.test(getPlatform()) || androidRe.test(getUserAgent())) && event.pointerType) {
      return event.type === 'click' && event.buttons === 1;
    }
    return event.detail === 0 && !event.pointerType;
  }
  function isVirtualPointerEvent(event) {
    return event.width === 0 && event.height === 0 || event.width === 1 && event.height === 1 && event.pressure === 0 && event.detail === 0 && event.pointerType !== 'mouse' ||
    // iOS VoiceOver returns 0.333• for width/height.
    event.width < 1 && event.height < 1 && event.pressure === 0 && event.detail === 0;
  }
  function isSafari() {
    // Chrome DevTools does not complain about navigator.vendor
    return /apple/i.test(navigator.vendor);
  }
  function isMac() {
    return getPlatform().toLowerCase().startsWith('mac') && !navigator.maxTouchPoints;
  }
  function isMouseLikePointerType(pointerType, strict) {
    // On some Linux machines with Chromium, mouse inputs return a `pointerType`
    // of "pen": https://github.com/floating-ui/floating-ui/issues/2015
    const values = ['mouse', 'pen'];
    if (!strict) {
      values.push('', undefined);
    }
    return values.includes(pointerType);
  }

  function useLatestRef(value) {
    const ref = React.useRef(value);
    index(() => {
      ref.current = value;
    });
    return ref;
  }

  const safePolygonIdentifier = 'data-floating-ui-safe-polygon';
  function getDelay(value, prop, pointerType) {
    if (pointerType && !isMouseLikePointerType(pointerType)) {
      return 0;
    }
    if (typeof value === 'number') {
      return value;
    }
    return value == null ? void 0 : value[prop];
  }
  /**
   * Opens the floating element while hovering over the reference element, like
   * CSS `:hover`.
   * @see https://floating-ui.com/docs/useHover
   */
  const useHover = function (context, _temp) {
    let {
      enabled = true,
      delay = 0,
      handleClose = null,
      mouseOnly = false,
      restMs = 0,
      move = true
    } = _temp === void 0 ? {} : _temp;
    const {
      open,
      onOpenChange,
      dataRef,
      events,
      elements: {
        domReference,
        floating
      },
      refs
    } = context;
    const tree = useFloatingTree();
    const parentId = useFloatingParentNodeId();
    const handleCloseRef = useLatestRef(handleClose);
    const delayRef = useLatestRef(delay);
    const pointerTypeRef = React__namespace.useRef();
    const timeoutRef = React__namespace.useRef();
    const handlerRef = React__namespace.useRef();
    const restTimeoutRef = React__namespace.useRef();
    const blockMouseMoveRef = React__namespace.useRef(true);
    const performedPointerEventsMutationRef = React__namespace.useRef(false);
    const unbindMouseMoveRef = React__namespace.useRef(() => {});
    const isHoverOpen = React__namespace.useCallback(() => {
      var _dataRef$current$open;
      const type = (_dataRef$current$open = dataRef.current.openEvent) == null ? void 0 : _dataRef$current$open.type;
      return (type == null ? void 0 : type.includes('mouse')) && type !== 'mousedown';
    }, [dataRef]);

    // When dismissing before opening, clear the delay timeouts to cancel it
    // from showing.
    React__namespace.useEffect(() => {
      if (!enabled) {
        return;
      }
      function onDismiss() {
        clearTimeout(timeoutRef.current);
        clearTimeout(restTimeoutRef.current);
        blockMouseMoveRef.current = true;
      }
      events.on('dismiss', onDismiss);
      return () => {
        events.off('dismiss', onDismiss);
      };
    }, [enabled, events]);
    React__namespace.useEffect(() => {
      if (!enabled || !handleCloseRef.current || !open) {
        return;
      }
      function onLeave() {
        if (isHoverOpen()) {
          onOpenChange(false);
        }
      }
      const html = getDocument(floating).documentElement;
      html.addEventListener('mouseleave', onLeave);
      return () => {
        html.removeEventListener('mouseleave', onLeave);
      };
    }, [floating, open, onOpenChange, enabled, handleCloseRef, dataRef, isHoverOpen]);
    const closeWithDelay = React__namespace.useCallback(function (runElseBranch) {
      if (runElseBranch === void 0) {
        runElseBranch = true;
      }
      const closeDelay = getDelay(delayRef.current, 'close', pointerTypeRef.current);
      if (closeDelay && !handlerRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => onOpenChange(false), closeDelay);
      } else if (runElseBranch) {
        clearTimeout(timeoutRef.current);
        onOpenChange(false);
      }
    }, [delayRef, onOpenChange]);
    const cleanupMouseMoveHandler = React__namespace.useCallback(() => {
      unbindMouseMoveRef.current();
      handlerRef.current = undefined;
    }, []);
    const clearPointerEvents = React__namespace.useCallback(() => {
      if (performedPointerEventsMutationRef.current) {
        const body = getDocument(refs.floating.current).body;
        body.style.pointerEvents = '';
        body.removeAttribute(safePolygonIdentifier);
        performedPointerEventsMutationRef.current = false;
      }
    }, [refs]);

    // Registering the mouse events on the reference directly to bypass React's
    // delegation system. If the cursor was on a disabled element and then entered
    // the reference (no gap), `mouseenter` doesn't fire in the delegation system.
    React__namespace.useEffect(() => {
      if (!enabled) {
        return;
      }
      function isClickLikeOpenEvent() {
        return dataRef.current.openEvent ? ['click', 'mousedown'].includes(dataRef.current.openEvent.type) : false;
      }
      function onMouseEnter(event) {
        clearTimeout(timeoutRef.current);
        blockMouseMoveRef.current = false;
        if (mouseOnly && !isMouseLikePointerType(pointerTypeRef.current) || restMs > 0 && getDelay(delayRef.current, 'open') === 0) {
          return;
        }
        dataRef.current.openEvent = event;
        const openDelay = getDelay(delayRef.current, 'open', pointerTypeRef.current);
        if (openDelay) {
          timeoutRef.current = setTimeout(() => {
            onOpenChange(true);
          }, openDelay);
        } else {
          onOpenChange(true);
        }
      }
      function onMouseLeave(event) {
        if (isClickLikeOpenEvent()) {
          return;
        }
        unbindMouseMoveRef.current();
        const doc = getDocument(floating);
        clearTimeout(restTimeoutRef.current);
        if (handleCloseRef.current) {
          // Prevent clearing `onScrollMouseLeave` timeout.
          if (!open) {
            clearTimeout(timeoutRef.current);
          }
          handlerRef.current = handleCloseRef.current({
            ...context,
            tree,
            x: event.clientX,
            y: event.clientY,
            onClose() {
              clearPointerEvents();
              cleanupMouseMoveHandler();
              closeWithDelay();
            }
          });
          const handler = handlerRef.current;
          doc.addEventListener('mousemove', handler);
          unbindMouseMoveRef.current = () => {
            doc.removeEventListener('mousemove', handler);
          };
          return;
        }
        closeWithDelay();
      }

      // Ensure the floating element closes after scrolling even if the pointer
      // did not move.
      // https://github.com/floating-ui/floating-ui/discussions/1692
      function onScrollMouseLeave(event) {
        if (isClickLikeOpenEvent()) {
          return;
        }
        handleCloseRef.current == null ? void 0 : handleCloseRef.current({
          ...context,
          tree,
          x: event.clientX,
          y: event.clientY,
          onClose() {
            clearPointerEvents();
            cleanupMouseMoveHandler();
            closeWithDelay();
          }
        })(event);
      }
      if (isElement(domReference)) {
        const ref = domReference;
        open && ref.addEventListener('mouseleave', onScrollMouseLeave);
        floating == null ? void 0 : floating.addEventListener('mouseleave', onScrollMouseLeave);
        move && ref.addEventListener('mousemove', onMouseEnter, {
          once: true
        });
        ref.addEventListener('mouseenter', onMouseEnter);
        ref.addEventListener('mouseleave', onMouseLeave);
        return () => {
          open && ref.removeEventListener('mouseleave', onScrollMouseLeave);
          floating == null ? void 0 : floating.removeEventListener('mouseleave', onScrollMouseLeave);
          move && ref.removeEventListener('mousemove', onMouseEnter);
          ref.removeEventListener('mouseenter', onMouseEnter);
          ref.removeEventListener('mouseleave', onMouseLeave);
        };
      }
    }, [domReference, floating, enabled, context, mouseOnly, restMs, move, closeWithDelay, cleanupMouseMoveHandler, clearPointerEvents, onOpenChange, open, tree, delayRef, handleCloseRef, dataRef]);

    // Block pointer-events of every element other than the reference and floating
    // while the floating element is open and has a `handleClose` handler. Also
    // handles nested floating elements.
    // https://github.com/floating-ui/floating-ui/issues/1722
    index(() => {
      var _handleCloseRef$curre;
      if (!enabled) {
        return;
      }
      if (open && (_handleCloseRef$curre = handleCloseRef.current) != null && _handleCloseRef$curre.__options.blockPointerEvents && isHoverOpen()) {
        const body = getDocument(floating).body;
        body.setAttribute(safePolygonIdentifier, '');
        body.style.pointerEvents = 'none';
        performedPointerEventsMutationRef.current = true;
        if (isElement(domReference) && floating) {
          var _tree$nodesRef$curren, _tree$nodesRef$curren2;
          const ref = domReference;
          const parentFloating = tree == null ? void 0 : (_tree$nodesRef$curren = tree.nodesRef.current.find(node => node.id === parentId)) == null ? void 0 : (_tree$nodesRef$curren2 = _tree$nodesRef$curren.context) == null ? void 0 : _tree$nodesRef$curren2.elements.floating;
          if (parentFloating) {
            parentFloating.style.pointerEvents = '';
          }
          ref.style.pointerEvents = 'auto';
          floating.style.pointerEvents = 'auto';
          return () => {
            ref.style.pointerEvents = '';
            floating.style.pointerEvents = '';
          };
        }
      }
    }, [enabled, open, parentId, floating, domReference, tree, handleCloseRef, dataRef, isHoverOpen]);
    index(() => {
      if (!open) {
        pointerTypeRef.current = undefined;
        cleanupMouseMoveHandler();
        clearPointerEvents();
      }
    }, [open, cleanupMouseMoveHandler, clearPointerEvents]);
    React__namespace.useEffect(() => {
      return () => {
        cleanupMouseMoveHandler();
        clearTimeout(timeoutRef.current);
        clearTimeout(restTimeoutRef.current);
        clearPointerEvents();
      };
    }, [enabled, cleanupMouseMoveHandler, clearPointerEvents]);
    return React__namespace.useMemo(() => {
      if (!enabled) {
        return {};
      }
      function setPointerRef(event) {
        pointerTypeRef.current = event.pointerType;
      }
      return {
        reference: {
          onPointerDown: setPointerRef,
          onPointerEnter: setPointerRef,
          onMouseMove() {
            if (open || restMs === 0) {
              return;
            }
            clearTimeout(restTimeoutRef.current);
            restTimeoutRef.current = setTimeout(() => {
              if (!blockMouseMoveRef.current) {
                onOpenChange(true);
              }
            }, restMs);
          }
        },
        floating: {
          onMouseEnter() {
            clearTimeout(timeoutRef.current);
          },
          onMouseLeave() {
            events.emit('dismiss', {
              type: 'mouseLeave',
              data: {
                returnFocus: false
              }
            });
            closeWithDelay(false);
          }
        }
      };
    }, [events, enabled, restMs, open, onOpenChange, closeWithDelay]);
  };

  const FloatingDelayGroupContext = /*#__PURE__*/React__namespace.createContext({
    delay: 0,
    initialDelay: 0,
    timeoutMs: 0,
    currentId: null,
    setCurrentId: () => {},
    setState: () => {},
    isInstantPhase: false
  });
  const useDelayGroupContext = () => React__namespace.useContext(FloatingDelayGroupContext);

  /**
   * Provides context for a group of floating elements that should share a
   * `delay`.
   * @see https://floating-ui.com/docs/FloatingDelayGroup
   */
  const FloatingDelayGroup = _ref => {
    let {
      children,
      delay,
      timeoutMs = 0
    } = _ref;
    const [state, setState] = React__namespace.useReducer((prev, next) => ({
      ...prev,
      ...next
    }), {
      delay,
      timeoutMs,
      initialDelay: delay,
      currentId: null,
      isInstantPhase: false
    });
    const initialCurrentIdRef = React__namespace.useRef(null);
    const setCurrentId = React__namespace.useCallback(currentId => {
      setState({
        currentId
      });
    }, []);
    index(() => {
      if (state.currentId) {
        if (initialCurrentIdRef.current === null) {
          initialCurrentIdRef.current = state.currentId;
        } else {
          setState({
            isInstantPhase: true
          });
        }
      } else {
        setState({
          isInstantPhase: false
        });
        initialCurrentIdRef.current = null;
      }
    }, [state.currentId]);
    return /*#__PURE__*/React__namespace.createElement(FloatingDelayGroupContext.Provider, {
      value: React__namespace.useMemo(() => ({
        ...state,
        setState,
        setCurrentId
      }), [state, setState, setCurrentId])
    }, children);
  };
  const useDelayGroup = (_ref2, _ref3) => {
    let {
      open,
      onOpenChange
    } = _ref2;
    let {
      id
    } = _ref3;
    const {
      currentId,
      setCurrentId,
      initialDelay,
      setState,
      timeoutMs
    } = useDelayGroupContext();
    React__namespace.useEffect(() => {
      if (currentId) {
        setState({
          delay: {
            open: 1,
            close: getDelay(initialDelay, 'close')
          }
        });
        if (currentId !== id) {
          onOpenChange(false);
        }
      }
    }, [id, onOpenChange, setState, currentId, initialDelay]);
    React__namespace.useEffect(() => {
      function unset() {
        onOpenChange(false);
        setState({
          delay: initialDelay,
          currentId: null
        });
      }
      if (!open && currentId === id) {
        if (timeoutMs) {
          const timeout = window.setTimeout(unset, timeoutMs);
          return () => {
            clearTimeout(timeout);
          };
        } else {
          unset();
        }
      }
    }, [open, setState, currentId, id, onOpenChange, initialDelay, timeoutMs]);
    React__namespace.useEffect(() => {
      if (open) {
        setCurrentId(id);
      }
    }, [open, setCurrentId, id]);
  };

  function _extends() {
    _extends = Object.assign || function (target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];
        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }
      return target;
    };
    return _extends.apply(this, arguments);
  }

  var getDefaultParent = function (originalTarget) {
      if (typeof document === 'undefined') {
          return null;
      }
      var sampleTarget = Array.isArray(originalTarget) ? originalTarget[0] : originalTarget;
      return sampleTarget.ownerDocument.body;
  };
  var counterMap = new WeakMap();
  var uncontrolledNodes = new WeakMap();
  var markerMap = {};
  var lockCount = 0;
  var hideOthers = function (originalTarget, parentNode, markerName) {
      if (parentNode === void 0) { parentNode = getDefaultParent(originalTarget); }
      if (markerName === void 0) { markerName = "data-aria-hidden"; }
      var targets = Array.isArray(originalTarget) ? originalTarget : [originalTarget];
      if (!markerMap[markerName]) {
          markerMap[markerName] = new WeakMap();
      }
      var markerCounter = markerMap[markerName];
      var hiddenNodes = [];
      var elementsToKeep = new Set();
      var keep = (function (el) {
          if (!el || elementsToKeep.has(el)) {
              return;
          }
          elementsToKeep.add(el);
          keep(el.parentNode);
      });
      targets.forEach(keep);
      var deep = function (parent) {
          if (!parent || targets.indexOf(parent) >= 0) {
              return;
          }
          Array.prototype.forEach.call(parent.children, function (node) {
              if (elementsToKeep.has(node)) {
                  deep(node);
              }
              else {
                  var attr = node.getAttribute('aria-hidden');
                  var alreadyHidden = attr !== null && attr !== 'false';
                  var counterValue = (counterMap.get(node) || 0) + 1;
                  var markerValue = (markerCounter.get(node) || 0) + 1;
                  counterMap.set(node, counterValue);
                  markerCounter.set(node, markerValue);
                  hiddenNodes.push(node);
                  if (counterValue === 1 && alreadyHidden) {
                      uncontrolledNodes.set(node, true);
                  }
                  if (markerValue === 1) {
                      node.setAttribute(markerName, 'true');
                  }
                  if (!alreadyHidden) {
                      node.setAttribute('aria-hidden', 'true');
                  }
              }
          });
      };
      deep(parentNode);
      elementsToKeep.clear();
      lockCount++;
      return function () {
          hiddenNodes.forEach(function (node) {
              var counterValue = counterMap.get(node) - 1;
              var markerValue = markerCounter.get(node) - 1;
              counterMap.set(node, counterValue);
              markerCounter.set(node, markerValue);
              if (!counterValue) {
                  if (!uncontrolledNodes.has(node)) {
                      node.removeAttribute('aria-hidden');
                  }
                  uncontrolledNodes.delete(node);
              }
              if (!markerValue) {
                  node.removeAttribute(markerName);
              }
          });
          lockCount--;
          if (!lockCount) {
              counterMap = new WeakMap();
              counterMap = new WeakMap();
              uncontrolledNodes = new WeakMap();
              markerMap = {};
          }
      };
  };

  /*!
  * tabbable 6.0.1
  * @license MIT, https://github.com/focus-trap/tabbable/blob/master/LICENSE
  */
  var candidateSelectors = ['input', 'select', 'textarea', 'a[href]', 'button', '[tabindex]:not(slot)', 'audio[controls]', 'video[controls]', '[contenteditable]:not([contenteditable="false"])', 'details>summary:first-of-type', 'details'];
  var candidateSelector = /* #__PURE__ */candidateSelectors.join(',');
  var NoElement = typeof Element === 'undefined';
  var matches = NoElement ? function () {} : Element.prototype.matches || Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
  var getRootNode = !NoElement && Element.prototype.getRootNode ? function (element) {
    return element.getRootNode();
  } : function (element) {
    return element.ownerDocument;
  };

  /**
   * @param {Element} el container to check in
   * @param {boolean} includeContainer add container to check
   * @param {(node: Element) => boolean} filter filter candidates
   * @returns {Element[]}
   */
  var getCandidates = function getCandidates(el, includeContainer, filter) {
    var candidates = Array.prototype.slice.apply(el.querySelectorAll(candidateSelector));
    if (includeContainer && matches.call(el, candidateSelector)) {
      candidates.unshift(el);
    }
    candidates = candidates.filter(filter);
    return candidates;
  };

  /**
   * @callback GetShadowRoot
   * @param {Element} element to check for shadow root
   * @returns {ShadowRoot|boolean} ShadowRoot if available or boolean indicating if a shadowRoot is attached but not available.
   */

  /**
   * @callback ShadowRootFilter
   * @param {Element} shadowHostNode the element which contains shadow content
   * @returns {boolean} true if a shadow root could potentially contain valid candidates.
   */

  /**
   * @typedef {Object} CandidateScope
   * @property {Element} scopeParent contains inner candidates
   * @property {Element[]} candidates list of candidates found in the scope parent
   */

  /**
   * @typedef {Object} IterativeOptions
   * @property {GetShadowRoot|boolean} getShadowRoot true if shadow support is enabled; falsy if not;
   *  if a function, implies shadow support is enabled and either returns the shadow root of an element
   *  or a boolean stating if it has an undisclosed shadow root
   * @property {(node: Element) => boolean} filter filter candidates
   * @property {boolean} flatten if true then result will flatten any CandidateScope into the returned list
   * @property {ShadowRootFilter} shadowRootFilter filter shadow roots;
   */

  /**
   * @param {Element[]} elements list of element containers to match candidates from
   * @param {boolean} includeContainer add container list to check
   * @param {IterativeOptions} options
   * @returns {Array.<Element|CandidateScope>}
   */
  var getCandidatesIteratively = function getCandidatesIteratively(elements, includeContainer, options) {
    var candidates = [];
    var elementsToCheck = Array.from(elements);
    while (elementsToCheck.length) {
      var element = elementsToCheck.shift();
      if (element.tagName === 'SLOT') {
        // add shadow dom slot scope (slot itself cannot be focusable)
        var assigned = element.assignedElements();
        var content = assigned.length ? assigned : element.children;
        var nestedCandidates = getCandidatesIteratively(content, true, options);
        if (options.flatten) {
          candidates.push.apply(candidates, nestedCandidates);
        } else {
          candidates.push({
            scopeParent: element,
            candidates: nestedCandidates
          });
        }
      } else {
        // check candidate element
        var validCandidate = matches.call(element, candidateSelector);
        if (validCandidate && options.filter(element) && (includeContainer || !elements.includes(element))) {
          candidates.push(element);
        }

        // iterate over shadow content if possible
        var shadowRoot = element.shadowRoot ||
        // check for an undisclosed shadow
        typeof options.getShadowRoot === 'function' && options.getShadowRoot(element);
        var validShadowRoot = !options.shadowRootFilter || options.shadowRootFilter(element);
        if (shadowRoot && validShadowRoot) {
          // add shadow dom scope IIF a shadow root node was given; otherwise, an undisclosed
          //  shadow exists, so look at light dom children as fallback BUT create a scope for any
          //  child candidates found because they're likely slotted elements (elements that are
          //  children of the web component element (which has the shadow), in the light dom, but
          //  slotted somewhere _inside_ the undisclosed shadow) -- the scope is created below,
          //  _after_ we return from this recursive call
          var _nestedCandidates = getCandidatesIteratively(shadowRoot === true ? element.children : shadowRoot.children, true, options);
          if (options.flatten) {
            candidates.push.apply(candidates, _nestedCandidates);
          } else {
            candidates.push({
              scopeParent: element,
              candidates: _nestedCandidates
            });
          }
        } else {
          // there's not shadow so just dig into the element's (light dom) children
          //  __without__ giving the element special scope treatment
          elementsToCheck.unshift.apply(elementsToCheck, element.children);
        }
      }
    }
    return candidates;
  };
  var getTabindex = function getTabindex(node, isScope) {
    if (node.tabIndex < 0) {
      // in Chrome, <details/>, <audio controls/> and <video controls/> elements get a default
      // `tabIndex` of -1 when the 'tabindex' attribute isn't specified in the DOM,
      // yet they are still part of the regular tab order; in FF, they get a default
      // `tabIndex` of 0; since Chrome still puts those elements in the regular tab
      // order, consider their tab index to be 0.
      // Also browsers do not return `tabIndex` correctly for contentEditable nodes;
      // so if they don't have a tabindex attribute specifically set, assume it's 0.
      //
      // isScope is positive for custom element with shadow root or slot that by default
      // have tabIndex -1, but need to be sorted by document order in order for their
      // content to be inserted in the correct position
      if ((isScope || /^(AUDIO|VIDEO|DETAILS)$/.test(node.tagName) || node.isContentEditable) && isNaN(parseInt(node.getAttribute('tabindex'), 10))) {
        return 0;
      }
    }
    return node.tabIndex;
  };
  var sortOrderedTabbables = function sortOrderedTabbables(a, b) {
    return a.tabIndex === b.tabIndex ? a.documentOrder - b.documentOrder : a.tabIndex - b.tabIndex;
  };
  var isInput = function isInput(node) {
    return node.tagName === 'INPUT';
  };
  var isHiddenInput = function isHiddenInput(node) {
    return isInput(node) && node.type === 'hidden';
  };
  var isDetailsWithSummary = function isDetailsWithSummary(node) {
    var r = node.tagName === 'DETAILS' && Array.prototype.slice.apply(node.children).some(function (child) {
      return child.tagName === 'SUMMARY';
    });
    return r;
  };
  var getCheckedRadio = function getCheckedRadio(nodes, form) {
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].checked && nodes[i].form === form) {
        return nodes[i];
      }
    }
  };
  var isTabbableRadio = function isTabbableRadio(node) {
    if (!node.name) {
      return true;
    }
    var radioScope = node.form || getRootNode(node);
    var queryRadios = function queryRadios(name) {
      return radioScope.querySelectorAll('input[type="radio"][name="' + name + '"]');
    };
    var radioSet;
    if (typeof window !== 'undefined' && typeof window.CSS !== 'undefined' && typeof window.CSS.escape === 'function') {
      radioSet = queryRadios(window.CSS.escape(node.name));
    } else {
      try {
        radioSet = queryRadios(node.name);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Looks like you have a radio button with a name attribute containing invalid CSS selector characters and need the CSS.escape polyfill: %s', err.message);
        return false;
      }
    }
    var checked = getCheckedRadio(radioSet, node.form);
    return !checked || checked === node;
  };
  var isRadio = function isRadio(node) {
    return isInput(node) && node.type === 'radio';
  };
  var isNonTabbableRadio = function isNonTabbableRadio(node) {
    return isRadio(node) && !isTabbableRadio(node);
  };

  // determines if a node is ultimately attached to the window's document
  var isNodeAttached = function isNodeAttached(node) {
    var _nodeRootHost;
    // The root node is the shadow root if the node is in a shadow DOM; some document otherwise
    //  (but NOT _the_ document; see second 'If' comment below for more).
    // If rootNode is shadow root, it'll have a host, which is the element to which the shadow
    //  is attached, and the one we need to check if it's in the document or not (because the
    //  shadow, and all nodes it contains, is never considered in the document since shadows
    //  behave like self-contained DOMs; but if the shadow's HOST, which is part of the document,
    //  is hidden, or is not in the document itself but is detached, it will affect the shadow's
    //  visibility, including all the nodes it contains). The host could be any normal node,
    //  or a custom element (i.e. web component). Either way, that's the one that is considered
    //  part of the document, not the shadow root, nor any of its children (i.e. the node being
    //  tested).
    // To further complicate things, we have to look all the way up until we find a shadow HOST
    //  that is attached (or find none) because the node might be in nested shadows...
    // If rootNode is not a shadow root, it won't have a host, and so rootNode should be the
    //  document (per the docs) and while it's a Document-type object, that document does not
    //  appear to be the same as the node's `ownerDocument` for some reason, so it's safer
    //  to ignore the rootNode at this point, and use `node.ownerDocument`. Otherwise,
    //  using `rootNode.contains(node)` will _always_ be true we'll get false-positives when
    //  node is actually detached.
    var nodeRootHost = getRootNode(node).host;
    var attached = !!((_nodeRootHost = nodeRootHost) !== null && _nodeRootHost !== void 0 && _nodeRootHost.ownerDocument.contains(nodeRootHost) || node.ownerDocument.contains(node));
    while (!attached && nodeRootHost) {
      var _nodeRootHost2;
      // since it's not attached and we have a root host, the node MUST be in a nested shadow DOM,
      //  which means we need to get the host's host and check if that parent host is contained
      //  in (i.e. attached to) the document
      nodeRootHost = getRootNode(nodeRootHost).host;
      attached = !!((_nodeRootHost2 = nodeRootHost) !== null && _nodeRootHost2 !== void 0 && _nodeRootHost2.ownerDocument.contains(nodeRootHost));
    }
    return attached;
  };
  var isZeroArea = function isZeroArea(node) {
    var _node$getBoundingClie = node.getBoundingClientRect(),
      width = _node$getBoundingClie.width,
      height = _node$getBoundingClie.height;
    return width === 0 && height === 0;
  };
  var isHidden = function isHidden(node, _ref) {
    var displayCheck = _ref.displayCheck,
      getShadowRoot = _ref.getShadowRoot;
    // NOTE: visibility will be `undefined` if node is detached from the document
    //  (see notes about this further down), which means we will consider it visible
    //  (this is legacy behavior from a very long way back)
    // NOTE: we check this regardless of `displayCheck="none"` because this is a
    //  _visibility_ check, not a _display_ check
    if (getComputedStyle(node).visibility === 'hidden') {
      return true;
    }
    var isDirectSummary = matches.call(node, 'details>summary:first-of-type');
    var nodeUnderDetails = isDirectSummary ? node.parentElement : node;
    if (matches.call(nodeUnderDetails, 'details:not([open]) *')) {
      return true;
    }
    if (!displayCheck || displayCheck === 'full' || displayCheck === 'legacy-full') {
      if (typeof getShadowRoot === 'function') {
        // figure out if we should consider the node to be in an undisclosed shadow and use the
        //  'non-zero-area' fallback
        var originalNode = node;
        while (node) {
          var parentElement = node.parentElement;
          var rootNode = getRootNode(node);
          if (parentElement && !parentElement.shadowRoot && getShadowRoot(parentElement) === true // check if there's an undisclosed shadow
          ) {
            // node has an undisclosed shadow which means we can only treat it as a black box, so we
            //  fall back to a non-zero-area test
            return isZeroArea(node);
          } else if (node.assignedSlot) {
            // iterate up slot
            node = node.assignedSlot;
          } else if (!parentElement && rootNode !== node.ownerDocument) {
            // cross shadow boundary
            node = rootNode.host;
          } else {
            // iterate up normal dom
            node = parentElement;
          }
        }
        node = originalNode;
      }
      // else, `getShadowRoot` might be true, but all that does is enable shadow DOM support
      //  (i.e. it does not also presume that all nodes might have undisclosed shadows); or
      //  it might be a falsy value, which means shadow DOM support is disabled

      // Since we didn't find it sitting in an undisclosed shadow (or shadows are disabled)
      //  now we can just test to see if it would normally be visible or not, provided it's
      //  attached to the main document.
      // NOTE: We must consider case where node is inside a shadow DOM and given directly to
      //  `isTabbable()` or `isFocusable()` -- regardless of `getShadowRoot` option setting.

      if (isNodeAttached(node)) {
        // this works wherever the node is: if there's at least one client rect, it's
        //  somehow displayed; it also covers the CSS 'display: contents' case where the
        //  node itself is hidden in place of its contents; and there's no need to search
        //  up the hierarchy either
        return !node.getClientRects().length;
      }

      // Else, the node isn't attached to the document, which means the `getClientRects()`
      //  API will __always__ return zero rects (this can happen, for example, if React
      //  is used to render nodes onto a detached tree, as confirmed in this thread:
      //  https://github.com/facebook/react/issues/9117#issuecomment-284228870)
      //
      // It also means that even window.getComputedStyle(node).display will return `undefined`
      //  because styles are only computed for nodes that are in the document.
      //
      // NOTE: THIS HAS BEEN THE CASE FOR YEARS. It is not new, nor is it caused by tabbable
      //  somehow. Though it was never stated officially, anyone who has ever used tabbable
      //  APIs on nodes in detached containers has actually implicitly used tabbable in what
      //  was later (as of v5.2.0 on Apr 9, 2021) called `displayCheck="none"` mode -- essentially
      //  considering __everything__ to be visible because of the innability to determine styles.
      //
      // v6.0.0: As of this major release, the default 'full' option __no longer treats detached
      //  nodes as visible with the 'none' fallback.__
      if (displayCheck !== 'legacy-full') {
        return true; // hidden
      }
      // else, fallback to 'none' mode and consider the node visible
    } else if (displayCheck === 'non-zero-area') {
      // NOTE: Even though this tests that the node's client rect is non-zero to determine
      //  whether it's displayed, and that a detached node will __always__ have a zero-area
      //  client rect, we don't special-case for whether the node is attached or not. In
      //  this mode, we do want to consider nodes that have a zero area to be hidden at all
      //  times, and that includes attached or not.
      return isZeroArea(node);
    }

    // visible, as far as we can tell, or per current `displayCheck=none` mode, we assume
    //  it's visible
    return false;
  };

  // form fields (nested) inside a disabled fieldset are not focusable/tabbable
  //  unless they are in the _first_ <legend> element of the top-most disabled
  //  fieldset
  var isDisabledFromFieldset = function isDisabledFromFieldset(node) {
    if (/^(INPUT|BUTTON|SELECT|TEXTAREA)$/.test(node.tagName)) {
      var parentNode = node.parentElement;
      // check if `node` is contained in a disabled <fieldset>
      while (parentNode) {
        if (parentNode.tagName === 'FIELDSET' && parentNode.disabled) {
          // look for the first <legend> among the children of the disabled <fieldset>
          for (var i = 0; i < parentNode.children.length; i++) {
            var child = parentNode.children.item(i);
            // when the first <legend> (in document order) is found
            if (child.tagName === 'LEGEND') {
              // if its parent <fieldset> is not nested in another disabled <fieldset>,
              // return whether `node` is a descendant of its first <legend>
              return matches.call(parentNode, 'fieldset[disabled] *') ? true : !child.contains(node);
            }
          }
          // the disabled <fieldset> containing `node` has no <legend>
          return true;
        }
        parentNode = parentNode.parentElement;
      }
    }

    // else, node's tabbable/focusable state should not be affected by a fieldset's
    //  enabled/disabled state
    return false;
  };
  var isNodeMatchingSelectorFocusable = function isNodeMatchingSelectorFocusable(options, node) {
    if (node.disabled || isHiddenInput(node) || isHidden(node, options) ||
    // For a details element with a summary, the summary element gets the focus
    isDetailsWithSummary(node) || isDisabledFromFieldset(node)) {
      return false;
    }
    return true;
  };
  var isNodeMatchingSelectorTabbable = function isNodeMatchingSelectorTabbable(options, node) {
    if (isNonTabbableRadio(node) || getTabindex(node) < 0 || !isNodeMatchingSelectorFocusable(options, node)) {
      return false;
    }
    return true;
  };
  var isValidShadowRootTabbable = function isValidShadowRootTabbable(shadowHostNode) {
    var tabIndex = parseInt(shadowHostNode.getAttribute('tabindex'), 10);
    if (isNaN(tabIndex) || tabIndex >= 0) {
      return true;
    }
    // If a custom element has an explicit negative tabindex,
    // browsers will not allow tab targeting said element's children.
    return false;
  };

  /**
   * @param {Array.<Element|CandidateScope>} candidates
   * @returns Element[]
   */
  var sortByOrder = function sortByOrder(candidates) {
    var regularTabbables = [];
    var orderedTabbables = [];
    candidates.forEach(function (item, i) {
      var isScope = !!item.scopeParent;
      var element = isScope ? item.scopeParent : item;
      var candidateTabindex = getTabindex(element, isScope);
      var elements = isScope ? sortByOrder(item.candidates) : element;
      if (candidateTabindex === 0) {
        isScope ? regularTabbables.push.apply(regularTabbables, elements) : regularTabbables.push(element);
      } else {
        orderedTabbables.push({
          documentOrder: i,
          tabIndex: candidateTabindex,
          item: item,
          isScope: isScope,
          content: elements
        });
      }
    });
    return orderedTabbables.sort(sortOrderedTabbables).reduce(function (acc, sortable) {
      sortable.isScope ? acc.push.apply(acc, sortable.content) : acc.push(sortable.content);
      return acc;
    }, []).concat(regularTabbables);
  };
  var tabbable = function tabbable(el, options) {
    options = options || {};
    var candidates;
    if (options.getShadowRoot) {
      candidates = getCandidatesIteratively([el], options.includeContainer, {
        filter: isNodeMatchingSelectorTabbable.bind(null, options),
        flatten: false,
        getShadowRoot: options.getShadowRoot,
        shadowRootFilter: isValidShadowRootTabbable
      });
    } else {
      candidates = getCandidates(el, options.includeContainer, isNodeMatchingSelectorTabbable.bind(null, options));
    }
    return sortByOrder(candidates);
  };

  /**
   * Find the real active element. Traverses into shadowRoots.
   */
  function activeElement$1(doc) {
    let activeElement = doc.activeElement;
    while (((_activeElement = activeElement) == null ? void 0 : (_activeElement$shadow = _activeElement.shadowRoot) == null ? void 0 : _activeElement$shadow.activeElement) != null) {
      var _activeElement, _activeElement$shadow;
      activeElement = activeElement.shadowRoot.activeElement;
    }
    return activeElement;
  }

  function contains(parent, child) {
    if (!parent || !child) {
      return false;
    }
    const rootNode = child.getRootNode && child.getRootNode();

    // First, attempt with faster native method
    if (parent.contains(child)) {
      return true;
    }
    // then fallback to custom implementation with Shadow DOM support
    else if (rootNode && isShadowRoot(rootNode)) {
      let next = child;
      do {
        if (next && parent === next) {
          return true;
        }
        // @ts-ignore
        next = next.parentNode || next.host;
      } while (next);
    }

    // Give up, the result is false
    return false;
  }

  let rafId = 0;
  function enqueueFocus(el, options) {
    if (options === void 0) {
      options = {};
    }
    const {
      preventScroll = false,
      cancelPrevious = true,
      sync = false
    } = options;
    cancelPrevious && cancelAnimationFrame(rafId);
    const exec = () => el == null ? void 0 : el.focus({
      preventScroll
    });
    if (sync) {
      exec();
    } else {
      rafId = requestAnimationFrame(exec);
    }
  }

  function getAncestors(nodes, id) {
    var _nodes$find;
    let allAncestors = [];
    let currentParentId = (_nodes$find = nodes.find(node => node.id === id)) == null ? void 0 : _nodes$find.parentId;
    while (currentParentId) {
      const currentNode = nodes.find(node => node.id === currentParentId);
      currentParentId = currentNode == null ? void 0 : currentNode.parentId;
      if (currentNode) {
        allAncestors = allAncestors.concat(currentNode);
      }
    }
    return allAncestors;
  }

  function getChildren(nodes, id) {
    let allChildren = nodes.filter(node => {
      var _node$context;
      return node.parentId === id && ((_node$context = node.context) == null ? void 0 : _node$context.open);
    }) || [];
    let currentChildren = allChildren;
    while (currentChildren.length) {
      currentChildren = nodes.filter(node => {
        var _currentChildren;
        return (_currentChildren = currentChildren) == null ? void 0 : _currentChildren.some(n => {
          var _node$context2;
          return node.parentId === n.id && ((_node$context2 = node.context) == null ? void 0 : _node$context2.open);
        });
      }) || [];
      allChildren = allChildren.concat(currentChildren);
    }
    return allChildren;
  }

  function getTarget(event) {
    if ('composedPath' in event) {
      return event.composedPath()[0];
    }

    // TS thinks `event` is of type never as it assumes all browsers support
    // `composedPath()`, but browsers without shadow DOM don't.
    return event.target;
  }

  const TYPEABLE_SELECTOR = "input:not([type='hidden']):not([disabled])," + "[contenteditable]:not([contenteditable='false']),textarea:not([disabled])";
  function isTypeableElement(element) {
    return isHTMLElement(element) && element.matches(TYPEABLE_SELECTOR);
  }

  function stopEvent(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const getTabbableOptions = () => ({
    getShadowRoot: true,
    displayCheck:
    // JSDOM does not support the `tabbable` library. To solve this we can
    // check if `ResizeObserver` is a real function (not polyfilled), which
    // determines if the current environment is JSDOM-like.
    typeof ResizeObserver === 'function' && ResizeObserver.toString().includes('[native code]') ? 'full' : 'none'
  });
  function getTabbableIn(container, direction) {
    const allTabbable = tabbable(container, getTabbableOptions());
    if (direction === 'prev') {
      allTabbable.reverse();
    }
    const activeIndex = allTabbable.indexOf(activeElement$1(getDocument(container)));
    const nextTabbableElements = allTabbable.slice(activeIndex + 1);
    return nextTabbableElements[0];
  }
  function getNextTabbable() {
    return getTabbableIn(document.body, 'next');
  }
  function getPreviousTabbable() {
    return getTabbableIn(document.body, 'prev');
  }
  function isOutsideEvent(event, container) {
    const containerElement = container || event.currentTarget;
    const relatedTarget = event.relatedTarget;
    return !relatedTarget || !contains(containerElement, relatedTarget);
  }
  function disableFocusInside(container) {
    const tabbableElements = tabbable(container, getTabbableOptions());
    tabbableElements.forEach(element => {
      element.dataset.tabindex = element.getAttribute('tabindex') || '';
      element.setAttribute('tabindex', '-1');
    });
  }
  function enableFocusInside(container) {
    const elements = container.querySelectorAll('[data-tabindex]');
    elements.forEach(element => {
      const tabindex = element.dataset.tabindex;
      delete element.dataset.tabindex;
      if (tabindex) {
        element.setAttribute('tabindex', tabindex);
      } else {
        element.removeAttribute('tabindex');
      }
    });
  }

  // `toString()` prevents bundlers from trying to `import { useInsertionEffect } from 'react'`
  const useInsertionEffect = React__namespace[/*#__PURE__*/'useInsertionEffect'.toString()];
  const useSafeInsertionEffect = useInsertionEffect || (fn => fn());
  function useEvent(callback) {
    const ref = React__namespace.useRef(() => {
      if (process.env.NODE_ENV !== "production") {
        throw new Error('Cannot call an event handler while rendering.');
      }
    });
    useSafeInsertionEffect(() => {
      ref.current = callback;
    });
    return React__namespace.useCallback(function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      return ref.current == null ? void 0 : ref.current(...args);
    }, []);
  }

  // See Diego Haz's Sandbox for making this logic work well on Safari/iOS:
  // https://codesandbox.io/s/tabbable-portal-f4tng?file=/src/FocusTrap.tsx

  const HIDDEN_STYLES = {
    border: 0,
    clip: 'rect(0 0 0 0)',
    height: '1px',
    margin: '-1px',
    overflow: 'hidden',
    padding: 0,
    position: 'fixed',
    whiteSpace: 'nowrap',
    width: '1px',
    top: 0,
    left: 0
  };
  let activeElement;
  let timeoutId;
  function setActiveElementOnTab(event) {
    if (event.key === 'Tab') {
      activeElement = event.target;
      clearTimeout(timeoutId);
    }
  }
  function isTabFocus(event) {
    const result = activeElement === event.relatedTarget;
    activeElement = event.relatedTarget;
    clearTimeout(timeoutId);
    return result;
  }
  const FocusGuard = /*#__PURE__*/React__namespace.forwardRef(function FocusGuard(props, ref) {
    const onFocus = useEvent(props.onFocus);
    const [role, setRole] = React__namespace.useState();
    index(() => {
      if (isSafari()) {
        // Unlike other screen readers such as NVDA and JAWS, the virtual cursor
        // on VoiceOver does trigger the onFocus event, so we can use the focus
        // trap element. On Safari, only buttons trigger the onFocus event.
        // NB: "group" role in the Sandbox no longer appears to work, must be a
        // button role.
        setRole('button');
      }
      document.addEventListener('keydown', setActiveElementOnTab);
      return () => {
        document.removeEventListener('keydown', setActiveElementOnTab);
      };
    }, []);
    return /*#__PURE__*/React__namespace.createElement("span", _extends({}, props, {
      ref: ref,
      tabIndex: 0
      // Role is only for VoiceOver
      ,
      role: role,
      "aria-hidden": role ? undefined : true,
      "data-floating-ui-focus-guard": "",
      style: HIDDEN_STYLES,
      onFocus: event => {
        if (isSafari() && isMac() && !isTabFocus(event)) {
          // On macOS we need to wait a little bit before moving
          // focus again.
          event.persist();
          timeoutId = window.setTimeout(() => {
            onFocus(event);
          }, 50);
        } else {
          onFocus(event);
        }
      }
    }));
  });

  const PortalContext = /*#__PURE__*/React__namespace.createContext(null);
  const useFloatingPortalNode = function (_temp) {
    let {
      id,
      enabled = true
    } = _temp === void 0 ? {} : _temp;
    const [portalEl, setPortalEl] = React__namespace.useState(null);
    const uniqueId = useId();
    const portalContext = usePortalContext();
    index(() => {
      if (!enabled) {
        return;
      }
      const rootNode = id ? document.getElementById(id) : null;
      if (rootNode) {
        rootNode.setAttribute('data-floating-ui-portal', '');
        setPortalEl(rootNode);
      } else {
        const newPortalEl = document.createElement('div');
        if (id !== '') {
          newPortalEl.id = id || uniqueId;
        }
        newPortalEl.setAttribute('data-floating-ui-portal', '');
        setPortalEl(newPortalEl);
        const container = (portalContext == null ? void 0 : portalContext.portalNode) || document.body;
        container.appendChild(newPortalEl);
        return () => {
          container.removeChild(newPortalEl);
        };
      }
    }, [id, portalContext, uniqueId, enabled]);
    return portalEl;
  };

  /**
   * Portals the floating element into a given container element — by default,
   * outside of the app root and into the body.
   * @see https://floating-ui.com/docs/FloatingPortal
   */
  const FloatingPortal = _ref => {
    let {
      children,
      id,
      root = null,
      preserveTabOrder = true
    } = _ref;
    const portalNode = useFloatingPortalNode({
      id,
      enabled: !root
    });
    const [focusManagerState, setFocusManagerState] = React__namespace.useState(null);
    const beforeOutsideRef = React__namespace.useRef(null);
    const afterOutsideRef = React__namespace.useRef(null);
    const beforeInsideRef = React__namespace.useRef(null);
    const afterInsideRef = React__namespace.useRef(null);
    const shouldRenderGuards =
    // The FocusManager and therefore floating element are currently open/
    // rendered.
    !!focusManagerState &&
    // Guards are only for non-modal focus management.
    !focusManagerState.modal && !!(root || portalNode) && preserveTabOrder;

    // https://codesandbox.io/s/tabbable-portal-f4tng?file=/src/TabbablePortal.tsx
    React__namespace.useEffect(() => {
      if (!portalNode || !preserveTabOrder || focusManagerState != null && focusManagerState.modal) {
        return;
      }

      // Make sure elements inside the portal element are tabbable only when the
      // portal has already been focused, either by tabbing into a focus trap
      // element outside or using the mouse.
      function onFocus(event) {
        if (portalNode && isOutsideEvent(event)) {
          const focusing = event.type === 'focusin';
          const manageFocus = focusing ? enableFocusInside : disableFocusInside;
          manageFocus(portalNode);
        }
      }
      // Listen to the event on the capture phase so they run before the focus
      // trap elements onFocus prop is called.
      portalNode.addEventListener('focusin', onFocus, true);
      portalNode.addEventListener('focusout', onFocus, true);
      return () => {
        portalNode.removeEventListener('focusin', onFocus, true);
        portalNode.removeEventListener('focusout', onFocus, true);
      };
    }, [portalNode, preserveTabOrder, focusManagerState == null ? void 0 : focusManagerState.modal]);
    return /*#__PURE__*/React__namespace.createElement(PortalContext.Provider, {
      value: React__namespace.useMemo(() => ({
        preserveTabOrder,
        beforeOutsideRef,
        afterOutsideRef,
        beforeInsideRef,
        afterInsideRef,
        portalNode,
        setFocusManagerState
      }), [preserveTabOrder, portalNode])
    }, shouldRenderGuards && portalNode && /*#__PURE__*/React__namespace.createElement(FocusGuard, {
      "data-type": "outside",
      ref: beforeOutsideRef,
      onFocus: event => {
        if (isOutsideEvent(event, portalNode)) {
          var _beforeInsideRef$curr;
          (_beforeInsideRef$curr = beforeInsideRef.current) == null ? void 0 : _beforeInsideRef$curr.focus();
        } else {
          const prevTabbable = getPreviousTabbable() || (focusManagerState == null ? void 0 : focusManagerState.refs.domReference.current);
          prevTabbable == null ? void 0 : prevTabbable.focus();
        }
      }
    }), shouldRenderGuards && portalNode && /*#__PURE__*/React__namespace.createElement("span", {
      "aria-owns": portalNode.id,
      style: HIDDEN_STYLES
    }), root ? /*#__PURE__*/reactDom$1.createPortal(children, root) : portalNode ? /*#__PURE__*/reactDom$1.createPortal(children, portalNode) : null, shouldRenderGuards && portalNode && /*#__PURE__*/React__namespace.createElement(FocusGuard, {
      "data-type": "outside",
      ref: afterOutsideRef,
      onFocus: event => {
        if (isOutsideEvent(event, portalNode)) {
          var _afterInsideRef$curre;
          (_afterInsideRef$curre = afterInsideRef.current) == null ? void 0 : _afterInsideRef$curre.focus();
        } else {
          const nextTabbable = getNextTabbable() || (focusManagerState == null ? void 0 : focusManagerState.refs.domReference.current);
          nextTabbable == null ? void 0 : nextTabbable.focus();
          (focusManagerState == null ? void 0 : focusManagerState.closeOnFocusOut) && (focusManagerState == null ? void 0 : focusManagerState.onOpenChange(false));
        }
      }
    }));
  };
  const usePortalContext = () => React__namespace.useContext(PortalContext);

  const VisuallyHiddenDismiss = /*#__PURE__*/React__namespace.forwardRef(function VisuallyHiddenDismiss(props, ref) {
    return /*#__PURE__*/React__namespace.createElement("button", _extends({}, props, {
      type: "button",
      ref: ref,
      tabIndex: -1,
      style: HIDDEN_STYLES
    }));
  });
  /**
   * Provides focus management for the floating element.
   * @see https://floating-ui.com/docs/FloatingFocusManager
   */
  function FloatingFocusManager(_ref) {
    let {
      context,
      children,
      order = ['content'],
      guards = true,
      initialFocus = 0,
      returnFocus = true,
      modal = true,
      visuallyHiddenDismiss = false,
      closeOnFocusOut = true
    } = _ref;
    const {
      refs,
      nodeId,
      onOpenChange,
      events,
      dataRef,
      elements: {
        domReference,
        floating
      }
    } = context;
    const orderRef = useLatestRef(order);
    const tree = useFloatingTree();
    const portalContext = usePortalContext();
    const [tabbableContentLength, setTabbableContentLength] = React__namespace.useState(null);

    // Controlled by `useListNavigation`.
    const ignoreInitialFocus = typeof initialFocus === 'number' && initialFocus < 0;
    const startDismissButtonRef = React__namespace.useRef(null);
    const endDismissButtonRef = React__namespace.useRef(null);
    const preventReturnFocusRef = React__namespace.useRef(false);
    const previouslyFocusedElementRef = React__namespace.useRef(null);
    const isPointerDownRef = React__namespace.useRef(false);
    const isInsidePortal = portalContext != null;

    // If the reference is a combobox and is typeable (e.g. input/textarea),
    // there are different focus semantics. The guards should not be rendered, but
    // aria-hidden should be applied to all nodes still. Further, the visually
    // hidden dismiss button should only appear at the end of the list, not the
    // start.
    const isTypeableCombobox = domReference && domReference.getAttribute('role') === 'combobox' && isTypeableElement(domReference);
    const getTabbableContent = React__namespace.useCallback(function (container) {
      if (container === void 0) {
        container = floating;
      }
      return container ? tabbable(container, getTabbableOptions()) : [];
    }, [floating]);
    const getTabbableElements = React__namespace.useCallback(container => {
      const content = getTabbableContent(container);
      return orderRef.current.map(type => {
        if (domReference && type === 'reference') {
          return domReference;
        }
        if (floating && type === 'floating') {
          return floating;
        }
        return content;
      }).filter(Boolean).flat();
    }, [domReference, floating, orderRef, getTabbableContent]);
    React__namespace.useEffect(() => {
      if (!modal) {
        return;
      }
      function onKeyDown(event) {
        if (event.key === 'Tab') {
          // The focus guards have nothing to focus, so we need to stop the event.
          if (getTabbableContent().length === 0 && !isTypeableCombobox) {
            stopEvent(event);
          }
          const els = getTabbableElements();
          const target = getTarget(event);
          if (orderRef.current[0] === 'reference' && target === domReference) {
            stopEvent(event);
            if (event.shiftKey) {
              enqueueFocus(els[els.length - 1]);
            } else {
              enqueueFocus(els[1]);
            }
          }
          if (orderRef.current[1] === 'floating' && target === floating && event.shiftKey) {
            stopEvent(event);
            enqueueFocus(els[0]);
          }
        }
      }
      const doc = getDocument(floating);
      doc.addEventListener('keydown', onKeyDown);
      return () => {
        doc.removeEventListener('keydown', onKeyDown);
      };
    }, [domReference, floating, modal, orderRef, refs, isTypeableCombobox, getTabbableContent, getTabbableElements]);
    React__namespace.useEffect(() => {
      if (!closeOnFocusOut) {
        return;
      }

      // In Safari, buttons lose focus when pressing them.
      function handlePointerDown() {
        isPointerDownRef.current = true;
        setTimeout(() => {
          isPointerDownRef.current = false;
        });
      }
      function handleFocusOutside(event) {
        const relatedTarget = event.relatedTarget;
        const movedToUnrelatedNode = !(contains(domReference, relatedTarget) || contains(floating, relatedTarget) || contains(relatedTarget, floating) || contains(portalContext == null ? void 0 : portalContext.portalNode, relatedTarget) || relatedTarget != null && relatedTarget.hasAttribute('data-floating-ui-focus-guard') || tree && (getChildren(tree.nodesRef.current, nodeId).find(node => {
          var _node$context, _node$context2;
          return contains((_node$context = node.context) == null ? void 0 : _node$context.elements.floating, relatedTarget) || contains((_node$context2 = node.context) == null ? void 0 : _node$context2.elements.domReference, relatedTarget);
        }) || getAncestors(tree.nodesRef.current, nodeId).find(node => {
          var _node$context3, _node$context4;
          return ((_node$context3 = node.context) == null ? void 0 : _node$context3.elements.floating) === relatedTarget || ((_node$context4 = node.context) == null ? void 0 : _node$context4.elements.domReference) === relatedTarget;
        })));

        // Focus did not move inside the floating tree, and there are no tabbable
        // portal guards to handle closing.
        if (relatedTarget && movedToUnrelatedNode && !isPointerDownRef.current &&
        // Fix React 18 Strict Mode returnFocus due to double rendering.
        relatedTarget !== previouslyFocusedElementRef.current) {
          preventReturnFocusRef.current = true;
          // On iOS VoiceOver, dismissing the nested submenu will cause the
          // first item of the list to receive focus. Delaying it appears to fix
          // the issue.
          setTimeout(() => onOpenChange(false));
        }
      }
      if (floating && isHTMLElement(domReference)) {
        domReference.addEventListener('focusout', handleFocusOutside);
        domReference.addEventListener('pointerdown', handlePointerDown);
        !modal && floating.addEventListener('focusout', handleFocusOutside);
        return () => {
          domReference.removeEventListener('focusout', handleFocusOutside);
          domReference.removeEventListener('pointerdown', handlePointerDown);
          !modal && floating.removeEventListener('focusout', handleFocusOutside);
        };
      }
    }, [domReference, floating, modal, nodeId, tree, portalContext, onOpenChange, closeOnFocusOut]);
    React__namespace.useEffect(() => {
      var _portalContext$portal;
      // Don't hide portals nested within the parent portal.
      const portalNodes = Array.from((portalContext == null ? void 0 : (_portalContext$portal = portalContext.portalNode) == null ? void 0 : _portalContext$portal.querySelectorAll('[data-floating-ui-portal]')) || []);
      function getDismissButtons() {
        return [startDismissButtonRef.current, endDismissButtonRef.current].filter(Boolean);
      }
      if (floating && modal) {
        const insideNodes = [floating, ...portalNodes, ...getDismissButtons()];
        const cleanup = hideOthers(orderRef.current.includes('reference') || isTypeableCombobox ? insideNodes.concat(domReference || []) : insideNodes);
        return () => {
          cleanup();
        };
      }
    }, [domReference, floating, modal, orderRef, portalContext, isTypeableCombobox]);
    React__namespace.useEffect(() => {
      if (modal && !guards && floating) {
        const tabIndexValues = [];
        const options = getTabbableOptions();
        const allTabbable = tabbable(getDocument(floating).body, options);
        const floatingTabbable = getTabbableElements();

        // Exclude all tabbable elements that are part of the order
        const elements = allTabbable.filter(el => !floatingTabbable.includes(el));
        elements.forEach((el, i) => {
          tabIndexValues[i] = el.getAttribute('tabindex');
          el.setAttribute('tabindex', '-1');
        });
        return () => {
          elements.forEach((el, i) => {
            const value = tabIndexValues[i];
            if (value == null) {
              el.removeAttribute('tabindex');
            } else {
              el.setAttribute('tabindex', value);
            }
          });
        };
      }
    }, [floating, modal, guards, getTabbableElements]);
    index(() => {
      if (!floating) return;
      const doc = getDocument(floating);
      let returnFocusValue = returnFocus;
      let preventReturnFocusScroll = false;
      const previouslyFocusedElement = activeElement$1(doc);
      const contextData = dataRef.current;
      previouslyFocusedElementRef.current = previouslyFocusedElement;
      const focusableElements = getTabbableElements(floating);
      const elToFocus = (typeof initialFocus === 'number' ? focusableElements[initialFocus] : initialFocus.current) || floating;

      // If the `useListNavigation` hook is active, always ignore `initialFocus`
      // because it has its own handling of the initial focus.
      !ignoreInitialFocus && enqueueFocus(elToFocus, {
        preventScroll: elToFocus === floating
      });

      // Dismissing via outside press should always ignore `returnFocus` to
      // prevent unwanted scrolling.
      function onDismiss(payload) {
        if (payload.type === 'escapeKey' && refs.domReference.current) {
          previouslyFocusedElementRef.current = refs.domReference.current;
        }
        if (['referencePress', 'escapeKey'].includes(payload.type)) {
          return;
        }
        const returnFocus = payload.data.returnFocus;
        if (typeof returnFocus === 'object') {
          returnFocusValue = true;
          preventReturnFocusScroll = returnFocus.preventScroll;
        } else {
          returnFocusValue = returnFocus;
        }
      }
      events.on('dismiss', onDismiss);
      return () => {
        events.off('dismiss', onDismiss);
        if (contains(floating, activeElement$1(doc)) && refs.domReference.current) {
          previouslyFocusedElementRef.current = refs.domReference.current;
        }
        if (returnFocusValue && isHTMLElement(previouslyFocusedElementRef.current) && !preventReturnFocusRef.current) {
          // `isPointerDownRef.current` to avoid the focus ring from appearing on
          // the reference element when click-toggling it.
          if (!refs.domReference.current || isPointerDownRef.current) {
            enqueueFocus(previouslyFocusedElementRef.current, {
              // When dismissing nested floating elements, by the time the rAF has
              // executed, the menus will all have been unmounted. When they try
              // to get focused, the calls get ignored — leaving the root
              // reference focused as desired.
              cancelPrevious: false,
              preventScroll: preventReturnFocusScroll
            });
          } else {
            var _previouslyFocusedEle;
            // If the user has specified a `keydown` listener that calls
            // setOpen(false) (e.g. selecting an item and closing the floating
            // element), then sync return focus causes `useClick` to immediately
            // re-open it, unless they call `event.preventDefault()` in the
            // `keydown` listener. This helps keep backwards compatibility with
            // older examples.
            contextData.__syncReturnFocus = true;

            // In Safari, `useListNavigation` moves focus sync, so making this
            // sync ensures the initial item remains focused despite this being
            // invoked in Strict Mode due to double-invoked useEffects. This also
            // has the positive side effect of closing a modally focus-managed
            // <Menu> on `Tab` keydown to move naturally to the next focusable
            // element.
            (_previouslyFocusedEle = previouslyFocusedElementRef.current) == null ? void 0 : _previouslyFocusedEle.focus({
              preventScroll: preventReturnFocusScroll
            });
            setTimeout(() => {
              // This isn't an actual property the user should access, make sure
              // it doesn't persist.
              delete contextData.__syncReturnFocus;
            });
          }
        }
      };
    }, [floating, getTabbableElements, initialFocus, returnFocus, dataRef, refs, events, ignoreInitialFocus]);

    // Synchronize the `context` & `modal` value to the FloatingPortal context.
    // It will decide whether or not it needs to render its own guards.
    index(() => {
      if (!portalContext) return;
      portalContext.setFocusManagerState({
        ...context,
        modal,
        closeOnFocusOut
        // Not concerned about the <RT> generic type.
      });

      return () => {
        portalContext.setFocusManagerState(null);
      };
    }, [portalContext, modal, closeOnFocusOut, context]);
    index(() => {
      if (ignoreInitialFocus || !floating) return;
      function setState() {
        setTabbableContentLength(getTabbableContent().length);
      }
      setState();
      if (typeof MutationObserver === 'function') {
        const observer = new MutationObserver(setState);
        observer.observe(floating, {
          childList: true,
          subtree: true
        });
        return () => {
          observer.disconnect();
        };
      }
    }, [floating, getTabbableContent, ignoreInitialFocus, refs]);
    const shouldRenderGuards = guards && (isInsidePortal || modal) && !isTypeableCombobox;
    function renderDismissButton(location) {
      return visuallyHiddenDismiss && modal ? /*#__PURE__*/React__namespace.createElement(VisuallyHiddenDismiss, {
        ref: location === 'start' ? startDismissButtonRef : endDismissButtonRef,
        onClick: () => onOpenChange(false)
      }, typeof visuallyHiddenDismiss === 'string' ? visuallyHiddenDismiss : 'Dismiss') : null;
    }
    return /*#__PURE__*/React__namespace.createElement(React__namespace.Fragment, null, shouldRenderGuards && /*#__PURE__*/React__namespace.createElement(FocusGuard, {
      "data-type": "inside",
      ref: portalContext == null ? void 0 : portalContext.beforeInsideRef,
      onFocus: event => {
        if (modal) {
          const els = getTabbableElements();
          enqueueFocus(order[0] === 'reference' ? els[0] : els[els.length - 1]);
        } else if (portalContext != null && portalContext.preserveTabOrder && portalContext.portalNode) {
          preventReturnFocusRef.current = false;
          if (isOutsideEvent(event, portalContext.portalNode)) {
            const nextTabbable = getNextTabbable() || domReference;
            nextTabbable == null ? void 0 : nextTabbable.focus();
          } else {
            var _portalContext$before;
            (_portalContext$before = portalContext.beforeOutsideRef.current) == null ? void 0 : _portalContext$before.focus();
          }
        }
      }
    }), isTypeableCombobox ? null : renderDismissButton('start'), /*#__PURE__*/React__namespace.cloneElement(children, tabbableContentLength === 0 || order.includes('floating') ? {
      tabIndex: 0
    } : {}), renderDismissButton('end'), shouldRenderGuards && /*#__PURE__*/React__namespace.createElement(FocusGuard, {
      "data-type": "inside",
      ref: portalContext == null ? void 0 : portalContext.afterInsideRef,
      onFocus: event => {
        if (modal) {
          enqueueFocus(getTabbableElements()[0]);
        } else if (portalContext != null && portalContext.preserveTabOrder && portalContext.portalNode) {
          preventReturnFocusRef.current = true;
          if (isOutsideEvent(event, portalContext.portalNode)) {
            const prevTabbable = getPreviousTabbable() || domReference;
            prevTabbable == null ? void 0 : prevTabbable.focus();
          } else {
            var _portalContext$afterO;
            (_portalContext$afterO = portalContext.afterOutsideRef.current) == null ? void 0 : _portalContext$afterO.focus();
          }
        }
      }
    }));
  }

  const identifier = 'data-floating-ui-scroll-lock';

  /**
   * Provides base styling for a fixed overlay element to dim content or block
   * pointer events behind a floating element.
   * It's a regular `<div>`, so it can be styled via any CSS solution you prefer.
   * @see https://floating-ui.com/docs/FloatingOverlay
   */
  const FloatingOverlay = /*#__PURE__*/React__namespace.forwardRef(function FloatingOverlay(_ref, ref) {
    let {
      lockScroll = false,
      ...rest
    } = _ref;
    index(() => {
      var _window$visualViewpor, _window$visualViewpor2;
      if (!lockScroll) {
        return;
      }
      const alreadyLocked = document.body.hasAttribute(identifier);
      if (alreadyLocked) {
        return;
      }
      document.body.setAttribute(identifier, '');

      // RTL <body> scrollbar
      const scrollbarX = Math.round(document.documentElement.getBoundingClientRect().left) + document.documentElement.scrollLeft;
      const paddingProp = scrollbarX ? 'paddingLeft' : 'paddingRight';
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      // Only iOS doesn't respect `overflow: hidden` on document.body, and this
      // technique has fewer side effects.
      if (!/iP(hone|ad|od)|iOS/.test(getPlatform())) {
        Object.assign(document.body.style, {
          overflow: 'hidden',
          [paddingProp]: scrollbarWidth + "px"
        });
        return () => {
          document.body.removeAttribute(identifier);
          Object.assign(document.body.style, {
            overflow: '',
            [paddingProp]: ''
          });
        };
      }

      // iOS 12 does not support `visualViewport`.
      const offsetLeft = ((_window$visualViewpor = window.visualViewport) == null ? void 0 : _window$visualViewpor.offsetLeft) || 0;
      const offsetTop = ((_window$visualViewpor2 = window.visualViewport) == null ? void 0 : _window$visualViewpor2.offsetTop) || 0;
      const scrollX = window.pageXOffset;
      const scrollY = window.pageYOffset;
      Object.assign(document.body.style, {
        position: 'fixed',
        overflow: 'hidden',
        top: -(scrollY - Math.floor(offsetTop)) + "px",
        left: -(scrollX - Math.floor(offsetLeft)) + "px",
        right: '0',
        [paddingProp]: scrollbarWidth + "px"
      });
      return () => {
        Object.assign(document.body.style, {
          position: '',
          overflow: '',
          top: '',
          left: '',
          right: '',
          [paddingProp]: ''
        });
        document.body.removeAttribute(identifier);
        window.scrollTo(scrollX, scrollY);
      };
    }, [lockScroll]);
    return /*#__PURE__*/React__namespace.createElement("div", _extends({
      ref: ref
    }, rest, {
      style: {
        position: 'fixed',
        overflow: 'auto',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        ...rest.style
      }
    }));
  });

  function isButtonTarget(event) {
    return isHTMLElement(event.target) && event.target.tagName === 'BUTTON';
  }
  function isSpaceIgnored(element) {
    return isTypeableElement(element);
  }
  /**
   * Opens or closes the floating element when clicking the reference element.
   * @see https://floating-ui.com/docs/useClick
   */
  const useClick = function (_ref, _temp) {
    let {
      open,
      onOpenChange,
      dataRef,
      elements: {
        domReference
      }
    } = _ref;
    let {
      enabled = true,
      event: eventOption = 'click',
      toggle = true,
      ignoreMouse = false,
      keyboardHandlers = true
    } = _temp === void 0 ? {} : _temp;
    const pointerTypeRef = React__namespace.useRef();
    return React__namespace.useMemo(() => {
      if (!enabled) {
        return {};
      }
      return {
        reference: {
          onPointerDown(event) {
            pointerTypeRef.current = event.pointerType;
          },
          onMouseDown(event) {
            // Ignore all buttons except for the "main" button.
            // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
            if (event.button !== 0) {
              return;
            }
            if (isMouseLikePointerType(pointerTypeRef.current, true) && ignoreMouse) {
              return;
            }
            if (eventOption === 'click') {
              return;
            }
            if (open) {
              if (toggle && (dataRef.current.openEvent ? dataRef.current.openEvent.type === 'mousedown' : true)) {
                onOpenChange(false);
              }
            } else {
              // Prevent stealing focus from the floating element
              event.preventDefault();
              onOpenChange(true);
            }
            dataRef.current.openEvent = event.nativeEvent;
          },
          onClick(event) {
            if (dataRef.current.__syncReturnFocus) {
              return;
            }
            if (eventOption === 'mousedown' && pointerTypeRef.current) {
              pointerTypeRef.current = undefined;
              return;
            }
            if (isMouseLikePointerType(pointerTypeRef.current, true) && ignoreMouse) {
              return;
            }
            if (open) {
              if (toggle && (dataRef.current.openEvent ? dataRef.current.openEvent.type === 'click' : true)) {
                onOpenChange(false);
              }
            } else {
              onOpenChange(true);
            }
            dataRef.current.openEvent = event.nativeEvent;
          },
          onKeyDown(event) {
            pointerTypeRef.current = undefined;
            if (!keyboardHandlers) {
              return;
            }
            if (isButtonTarget(event)) {
              return;
            }
            if (event.key === ' ' && !isSpaceIgnored(domReference)) {
              // Prevent scrolling
              event.preventDefault();
            }
            if (event.key === 'Enter') {
              if (open) {
                if (toggle) {
                  onOpenChange(false);
                }
              } else {
                onOpenChange(true);
              }
            }
          },
          onKeyUp(event) {
            if (!keyboardHandlers) {
              return;
            }
            if (isButtonTarget(event) || isSpaceIgnored(domReference)) {
              return;
            }
            if (event.key === ' ') {
              if (open) {
                if (toggle) {
                  onOpenChange(false);
                }
              } else {
                onOpenChange(true);
              }
            }
          }
        }
      };
    }, [enabled, dataRef, eventOption, ignoreMouse, keyboardHandlers, domReference, toggle, open, onOpenChange]);
  };

  /**
   * Check whether the event.target is within the provided node. Uses event.composedPath if available for custom element support.
   *
   * @param event The event whose target/composedPath to check
   * @param node The node to check against
   * @returns Whether the event.target/composedPath is within the node.
   */
  function isEventTargetWithin(event, node) {
    if (node == null) {
      return false;
    }
    if ('composedPath' in event) {
      return event.composedPath().includes(node);
    }

    // TS thinks `event` is of type never as it assumes all browsers support composedPath, but browsers without shadow dom don't
    const e = event;
    return e.target != null && node.contains(e.target);
  }

  const bubbleHandlerKeys = {
    pointerdown: 'onPointerDown',
    mousedown: 'onMouseDown',
    click: 'onClick'
  };
  const captureHandlerKeys = {
    pointerdown: 'onPointerDownCapture',
    mousedown: 'onMouseDownCapture',
    click: 'onClickCapture'
  };
  const normalizeBubblesProp = function (bubbles) {
    var _bubbles$escapeKey, _bubbles$outsidePress;
    if (bubbles === void 0) {
      bubbles = true;
    }
    return {
      escapeKeyBubbles: typeof bubbles === 'boolean' ? bubbles : (_bubbles$escapeKey = bubbles.escapeKey) != null ? _bubbles$escapeKey : true,
      outsidePressBubbles: typeof bubbles === 'boolean' ? bubbles : (_bubbles$outsidePress = bubbles.outsidePress) != null ? _bubbles$outsidePress : true
    };
  };
  /**
   * Closes the floating element when a dismissal is requested — by default, when
   * the user presses the `escape` key or outside of the floating element.
   * @see https://floating-ui.com/docs/useDismiss
   */
  const useDismiss = function (_ref, _temp) {
    let {
      open,
      onOpenChange,
      events,
      nodeId,
      elements: {
        reference,
        domReference,
        floating
      },
      dataRef
    } = _ref;
    let {
      enabled = true,
      escapeKey = true,
      outsidePress: unstable_outsidePress = true,
      outsidePressEvent = 'pointerdown',
      referencePress = false,
      referencePressEvent = 'pointerdown',
      ancestorScroll = false,
      bubbles = true
    } = _temp === void 0 ? {} : _temp;
    const tree = useFloatingTree();
    const nested = useFloatingParentNodeId() != null;
    const outsidePressFn = useEvent(typeof unstable_outsidePress === 'function' ? unstable_outsidePress : () => false);
    const outsidePress = typeof unstable_outsidePress === 'function' ? outsidePressFn : unstable_outsidePress;
    const insideReactTreeRef = React__namespace.useRef(false);
    const {
      escapeKeyBubbles,
      outsidePressBubbles
    } = normalizeBubblesProp(bubbles);
    React__namespace.useEffect(() => {
      if (!open || !enabled) {
        return;
      }
      dataRef.current.__escapeKeyBubbles = escapeKeyBubbles;
      dataRef.current.__outsidePressBubbles = outsidePressBubbles;
      function onKeyDown(event) {
        if (event.key === 'Escape') {
          const children = tree ? getChildren(tree.nodesRef.current, nodeId) : [];
          if (children.length > 0) {
            let shouldDismiss = true;
            children.forEach(child => {
              var _child$context;
              if ((_child$context = child.context) != null && _child$context.open && !child.context.dataRef.current.__escapeKeyBubbles) {
                shouldDismiss = false;
                return;
              }
            });
            if (!shouldDismiss) {
              return;
            }
          }
          events.emit('dismiss', {
            type: 'escapeKey',
            data: {
              returnFocus: {
                preventScroll: false
              }
            }
          });
          onOpenChange(false);
        }
      }
      function onOutsidePress(event) {
        // Given developers can stop the propagation of the synthetic event,
        // we can only be confident with a positive value.
        const insideReactTree = insideReactTreeRef.current;
        insideReactTreeRef.current = false;
        if (insideReactTree) {
          return;
        }
        if (typeof outsidePress === 'function' && !outsidePress(event)) {
          return;
        }
        const target = getTarget(event);

        // Check if the click occurred on the scrollbar
        if (isHTMLElement(target) && floating) {
          const win = floating.ownerDocument.defaultView || window;
          const canScrollX = target.scrollWidth > target.clientWidth;
          const canScrollY = target.scrollHeight > target.clientHeight;
          let xCond = canScrollY && event.offsetX > target.clientWidth;

          // In some browsers it is possible to change the <body> (or window)
          // scrollbar to the left side, but is very rare and is difficult to
          // check for. Plus, for modal dialogs with backdrops, it is more
          // important that the backdrop is checked but not so much the window.
          if (canScrollY) {
            const isRTL = win.getComputedStyle(target).direction === 'rtl';
            if (isRTL) {
              xCond = event.offsetX <= target.offsetWidth - target.clientWidth;
            }
          }
          if (xCond || canScrollX && event.offsetY > target.clientHeight) {
            return;
          }
        }
        const targetIsInsideChildren = tree && getChildren(tree.nodesRef.current, nodeId).some(node => {
          var _node$context;
          return isEventTargetWithin(event, (_node$context = node.context) == null ? void 0 : _node$context.elements.floating);
        });
        if (isEventTargetWithin(event, floating) || isEventTargetWithin(event, domReference) || targetIsInsideChildren) {
          return;
        }
        const children = tree ? getChildren(tree.nodesRef.current, nodeId) : [];
        if (children.length > 0) {
          let shouldDismiss = true;
          children.forEach(child => {
            var _child$context2;
            if ((_child$context2 = child.context) != null && _child$context2.open && !child.context.dataRef.current.__outsidePressBubbles) {
              shouldDismiss = false;
              return;
            }
          });
          if (!shouldDismiss) {
            return;
          }
        }
        events.emit('dismiss', {
          type: 'outsidePress',
          data: {
            returnFocus: nested ? {
              preventScroll: true
            } : isVirtualClick(event) || isVirtualPointerEvent(event)
          }
        });
        onOpenChange(false);
      }
      function onScroll() {
        onOpenChange(false);
      }
      const doc = getDocument(floating);
      escapeKey && doc.addEventListener('keydown', onKeyDown);
      outsidePress && doc.addEventListener(outsidePressEvent, onOutsidePress);
      let ancestors = [];
      if (ancestorScroll) {
        if (isElement(domReference)) {
          ancestors = reactDom.getOverflowAncestors(domReference);
        }
        if (isElement(floating)) {
          ancestors = ancestors.concat(reactDom.getOverflowAncestors(floating));
        }
        if (!isElement(reference) && reference && reference.contextElement) {
          ancestors = ancestors.concat(reactDom.getOverflowAncestors(reference.contextElement));
        }
      }

      // Ignore the visual viewport for scrolling dismissal (allow pinch-zoom)
      ancestors = ancestors.filter(ancestor => {
        var _doc$defaultView;
        return ancestor !== ((_doc$defaultView = doc.defaultView) == null ? void 0 : _doc$defaultView.visualViewport);
      });
      ancestors.forEach(ancestor => {
        ancestor.addEventListener('scroll', onScroll, {
          passive: true
        });
      });
      return () => {
        escapeKey && doc.removeEventListener('keydown', onKeyDown);
        outsidePress && doc.removeEventListener(outsidePressEvent, onOutsidePress);
        ancestors.forEach(ancestor => {
          ancestor.removeEventListener('scroll', onScroll);
        });
      };
    }, [dataRef, floating, domReference, reference, escapeKey, outsidePress, outsidePressEvent, events, tree, nodeId, open, onOpenChange, ancestorScroll, enabled, escapeKeyBubbles, outsidePressBubbles, nested]);
    React__namespace.useEffect(() => {
      insideReactTreeRef.current = false;
    }, [outsidePress, outsidePressEvent]);
    return React__namespace.useMemo(() => {
      if (!enabled) {
        return {};
      }
      return {
        reference: {
          [bubbleHandlerKeys[referencePressEvent]]: () => {
            if (referencePress) {
              events.emit('dismiss', {
                type: 'referencePress',
                data: {
                  returnFocus: false
                }
              });
              onOpenChange(false);
            }
          }
        },
        floating: {
          [captureHandlerKeys[outsidePressEvent]]: () => {
            insideReactTreeRef.current = true;
          }
        }
      };
    }, [enabled, events, referencePress, outsidePressEvent, referencePressEvent, onOpenChange]);
  };

  /**
   * Opens the floating element while the reference element has focus, like CSS
   * `:focus`.
   * @see https://floating-ui.com/docs/useFocus
   */
  const useFocus = function (_ref, _temp) {
    let {
      open,
      onOpenChange,
      dataRef,
      events,
      refs,
      elements: {
        floating,
        domReference
      }
    } = _ref;
    let {
      enabled = true,
      keyboardOnly = true
    } = _temp === void 0 ? {} : _temp;
    const pointerTypeRef = React__namespace.useRef('');
    const blockFocusRef = React__namespace.useRef(false);
    const timeoutRef = React__namespace.useRef();
    React__namespace.useEffect(() => {
      if (!enabled) {
        return;
      }
      const doc = getDocument(floating);
      const win = doc.defaultView || window;

      // If the reference was focused and the user left the tab/window, and the
      // floating element was not open, the focus should be blocked when they
      // return to the tab/window.
      function onBlur() {
        if (!open && isHTMLElement(domReference) && domReference === activeElement$1(getDocument(domReference))) {
          blockFocusRef.current = true;
        }
      }
      win.addEventListener('blur', onBlur);
      return () => {
        win.removeEventListener('blur', onBlur);
      };
    }, [floating, domReference, open, enabled]);
    React__namespace.useEffect(() => {
      if (!enabled) {
        return;
      }
      function onDismiss(payload) {
        if (payload.type === 'referencePress' || payload.type === 'escapeKey') {
          blockFocusRef.current = true;
        }
      }
      events.on('dismiss', onDismiss);
      return () => {
        events.off('dismiss', onDismiss);
      };
    }, [events, enabled]);
    React__namespace.useEffect(() => {
      return () => {
        clearTimeout(timeoutRef.current);
      };
    }, []);
    return React__namespace.useMemo(() => {
      if (!enabled) {
        return {};
      }
      return {
        reference: {
          onPointerDown(_ref2) {
            let {
              pointerType
            } = _ref2;
            pointerTypeRef.current = pointerType;
            blockFocusRef.current = !!(pointerType && keyboardOnly);
          },
          onMouseLeave() {
            blockFocusRef.current = false;
          },
          onFocus(event) {
            var _dataRef$current$open;
            if (blockFocusRef.current) {
              return;
            }

            // Dismiss with click should ignore the subsequent `focus` trigger,
            // but only if the click originated inside the reference element.
            if (event.type === 'focus' && ((_dataRef$current$open = dataRef.current.openEvent) == null ? void 0 : _dataRef$current$open.type) === 'mousedown' && dataRef.current.openEvent && isEventTargetWithin(dataRef.current.openEvent, domReference)) {
              return;
            }
            dataRef.current.openEvent = event.nativeEvent;
            onOpenChange(true);
          },
          onBlur(event) {
            blockFocusRef.current = false;
            const relatedTarget = event.relatedTarget;

            // Hit the non-modal focus management portal guard. Focus will be
            // moved into the floating element immediately after.
            const movedToFocusGuard = isElement(relatedTarget) && relatedTarget.hasAttribute('data-floating-ui-focus-guard') && relatedTarget.getAttribute('data-type') === 'outside';

            // Wait for the window blur listener to fire.
            timeoutRef.current = setTimeout(() => {
              // When focusing the reference element (e.g. regular click), then
              // clicking into the floating element, prevent it from hiding.
              // Note: it must be focusable, e.g. `tabindex="-1"`.
              if (contains(refs.floating.current, relatedTarget) || contains(domReference, relatedTarget) || movedToFocusGuard) {
                return;
              }
              onOpenChange(false);
            });
          }
        }
      };
    }, [enabled, keyboardOnly, domReference, refs, dataRef, onOpenChange]);
  };

  let isPreventScrollSupported = false;
  const ARROW_UP = 'ArrowUp';
  const ARROW_DOWN = 'ArrowDown';
  const ARROW_LEFT = 'ArrowLeft';
  const ARROW_RIGHT = 'ArrowRight';
  function isDifferentRow(index, cols, prevRow) {
    return Math.floor(index / cols) !== prevRow;
  }
  function isIndexOutOfBounds(listRef, index) {
    return index < 0 || index >= listRef.current.length;
  }
  function findNonDisabledIndex(listRef, _temp) {
    let {
      startingIndex = -1,
      decrement = false,
      disabledIndices,
      amount = 1
    } = _temp === void 0 ? {} : _temp;
    const list = listRef.current;
    let index = startingIndex;
    do {
      var _list$index, _list$index2;
      index = index + (decrement ? -amount : amount);
    } while (index >= 0 && index <= list.length - 1 && (disabledIndices ? disabledIndices.includes(index) : list[index] == null || ((_list$index = list[index]) == null ? void 0 : _list$index.hasAttribute('disabled')) || ((_list$index2 = list[index]) == null ? void 0 : _list$index2.getAttribute('aria-disabled')) === 'true'));
    return index;
  }
  function doSwitch(orientation, vertical, horizontal) {
    switch (orientation) {
      case 'vertical':
        return vertical;
      case 'horizontal':
        return horizontal;
      default:
        return vertical || horizontal;
    }
  }
  function isMainOrientationKey(key, orientation) {
    const vertical = key === ARROW_UP || key === ARROW_DOWN;
    const horizontal = key === ARROW_LEFT || key === ARROW_RIGHT;
    return doSwitch(orientation, vertical, horizontal);
  }
  function isMainOrientationToEndKey(key, orientation, rtl) {
    const vertical = key === ARROW_DOWN;
    const horizontal = rtl ? key === ARROW_LEFT : key === ARROW_RIGHT;
    return doSwitch(orientation, vertical, horizontal) || key === 'Enter' || key == ' ' || key === '';
  }
  function isCrossOrientationOpenKey(key, orientation, rtl) {
    const vertical = rtl ? key === ARROW_LEFT : key === ARROW_RIGHT;
    const horizontal = key === ARROW_DOWN;
    return doSwitch(orientation, vertical, horizontal);
  }
  function isCrossOrientationCloseKey(key, orientation, rtl) {
    const vertical = rtl ? key === ARROW_RIGHT : key === ARROW_LEFT;
    const horizontal = key === ARROW_UP;
    return doSwitch(orientation, vertical, horizontal);
  }
  function getMinIndex(listRef, disabledIndices) {
    return findNonDisabledIndex(listRef, {
      disabledIndices
    });
  }
  function getMaxIndex(listRef, disabledIndices) {
    return findNonDisabledIndex(listRef, {
      decrement: true,
      startingIndex: listRef.current.length,
      disabledIndices
    });
  }
  /**
   * Adds arrow key-based navigation of a list of items, either using real DOM
   * focus or virtual focus.
   * @see https://floating-ui.com/docs/useListNavigation
   */
  const useListNavigation = function (_ref, _temp2) {
    let {
      open,
      onOpenChange,
      refs,
      elements: {
        domReference
      }
    } = _ref;
    let {
      listRef,
      activeIndex,
      onNavigate: unstable_onNavigate = () => {},
      enabled = true,
      selectedIndex = null,
      allowEscape = false,
      loop = false,
      nested = false,
      rtl = false,
      virtual = false,
      focusItemOnOpen = 'auto',
      focusItemOnHover = true,
      openOnArrowKeyDown = true,
      disabledIndices = undefined,
      orientation = 'vertical',
      cols = 1,
      scrollItemIntoView = true
    } = _temp2 === void 0 ? {
      listRef: {
        current: []
      },
      activeIndex: null,
      onNavigate: () => {}
    } : _temp2;
    if (process.env.NODE_ENV !== "production") {
      if (allowEscape) {
        if (!loop) {
          console.warn(['Floating UI: `useListNavigation` looping must be enabled to allow', 'escaping.'].join(' '));
        }
        if (!virtual) {
          console.warn(['Floating UI: `useListNavigation` must be virtual to allow', 'escaping.'].join(' '));
        }
      }
      if (orientation === 'vertical' && cols > 1) {
        console.warn(['Floating UI: In grid list navigation mode (`cols` > 1), the', '`orientation` should be either "horizontal" or "both".'].join(' '));
      }
    }
    const parentId = useFloatingParentNodeId();
    const tree = useFloatingTree();
    const onNavigate = useEvent(unstable_onNavigate);
    const focusItemOnOpenRef = React__namespace.useRef(focusItemOnOpen);
    const indexRef = React__namespace.useRef(selectedIndex != null ? selectedIndex : -1);
    const keyRef = React__namespace.useRef(null);
    const isPointerModalityRef = React__namespace.useRef(true);
    const previousOnNavigateRef = React__namespace.useRef(onNavigate);
    const previousOpenRef = React__namespace.useRef(open);
    const forceSyncFocus = React__namespace.useRef(false);
    const forceScrollIntoViewRef = React__namespace.useRef(false);
    const disabledIndicesRef = useLatestRef(disabledIndices);
    const latestOpenRef = useLatestRef(open);
    const scrollItemIntoViewRef = useLatestRef(scrollItemIntoView);
    const [activeId, setActiveId] = React__namespace.useState();
    const focusItem = React__namespace.useCallback(function (listRef, indexRef, forceScrollIntoView) {
      if (forceScrollIntoView === void 0) {
        forceScrollIntoView = false;
      }
      const item = listRef.current[indexRef.current];
      if (virtual) {
        setActiveId(item == null ? void 0 : item.id);
      } else {
        enqueueFocus(item, {
          preventScroll: true,
          // Mac Safari does not move the virtual cursor unless the focus call
          // is sync. However, for the very first focus call, we need to wait
          // for the position to be ready in order to prevent unwanted
          // scrolling. This means the virtual cursor will not move to the first
          // item when first opening the floating element, but will on
          // subsequent calls. `preventScroll` is supported in modern Safari,
          // so we can use that instead.
          // iOS Safari must be async or the first item will not be focused.
          sync: isMac() && isSafari() ? isPreventScrollSupported || forceSyncFocus.current : false
        });
      }
      requestAnimationFrame(() => {
        const scrollIntoViewOptions = scrollItemIntoViewRef.current;
        const shouldScrollIntoView = scrollIntoViewOptions && item && (forceScrollIntoView || !isPointerModalityRef.current);
        if (shouldScrollIntoView) {
          // JSDOM doesn't support `.scrollIntoView()` but it's widely supported
          // by all browsers.
          item.scrollIntoView == null ? void 0 : item.scrollIntoView(typeof scrollIntoViewOptions === 'boolean' ? {
            block: 'nearest',
            inline: 'nearest'
          } : scrollIntoViewOptions);
        }
      });
    }, [virtual, scrollItemIntoViewRef]);
    index(() => {
      document.createElement('div').focus({
        get preventScroll() {
          isPreventScrollSupported = true;
          return false;
        }
      });
    }, []);

    // Sync `selectedIndex` to be the `activeIndex` upon opening the floating
    // element. Also, reset `activeIndex` upon closing the floating element.
    index(() => {
      if (!enabled) {
        return;
      }
      if (open) {
        if (focusItemOnOpenRef.current && selectedIndex != null) {
          // Regardless of the pointer modality, we want to ensure the selected
          // item comes into view when the floating element is opened.
          forceScrollIntoViewRef.current = true;
          onNavigate(selectedIndex);
        }
      } else if (previousOpenRef.current) {
        // Since the user can specify `onNavigate` conditionally
        // (onNavigate: open ? setActiveIndex : setSelectedIndex),
        // we store and call the previous function.
        indexRef.current = -1;
        previousOnNavigateRef.current(null);
      }
    }, [enabled, open, selectedIndex, onNavigate]);

    // Sync `activeIndex` to be the focused item while the floating element is
    // open.
    index(() => {
      if (!enabled) {
        return;
      }
      if (open) {
        if (activeIndex == null) {
          forceSyncFocus.current = false;
          if (selectedIndex != null) {
            return;
          }

          // Reset while the floating element was open (e.g. the list changed).
          if (previousOpenRef.current) {
            indexRef.current = -1;
            focusItem(listRef, indexRef);
          }

          // Initial sync.
          if (!previousOpenRef.current && focusItemOnOpenRef.current && (keyRef.current != null || focusItemOnOpenRef.current === true && keyRef.current == null)) {
            indexRef.current = keyRef.current == null || isMainOrientationToEndKey(keyRef.current, orientation, rtl) || nested ? getMinIndex(listRef, disabledIndicesRef.current) : getMaxIndex(listRef, disabledIndicesRef.current);
            onNavigate(indexRef.current);
          }
        } else if (!isIndexOutOfBounds(listRef, activeIndex)) {
          indexRef.current = activeIndex;
          focusItem(listRef, indexRef, forceScrollIntoViewRef.current);
          forceScrollIntoViewRef.current = false;
        }
      }
    }, [enabled, open, activeIndex, selectedIndex, nested, listRef, orientation, rtl, onNavigate, focusItem, disabledIndicesRef]);

    // Ensure the parent floating element has focus when a nested child closes
    // to allow arrow key navigation to work after the pointer leaves the child.
    index(() => {
      if (!enabled) {
        return;
      }
      if (previousOpenRef.current && !open) {
        var _tree$nodesRef$curren, _tree$nodesRef$curren2;
        const parentFloating = tree == null ? void 0 : (_tree$nodesRef$curren = tree.nodesRef.current.find(node => node.id === parentId)) == null ? void 0 : (_tree$nodesRef$curren2 = _tree$nodesRef$curren.context) == null ? void 0 : _tree$nodesRef$curren2.elements.floating;
        if (parentFloating && !contains(parentFloating, activeElement$1(getDocument(parentFloating)))) {
          parentFloating.focus({
            preventScroll: true
          });
        }
      }
    }, [enabled, open, tree, parentId]);
    index(() => {
      keyRef.current = null;
      previousOnNavigateRef.current = onNavigate;
      previousOpenRef.current = open;
    });
    const hasActiveIndex = activeIndex != null;
    const item = React__namespace.useMemo(() => {
      function syncCurrentTarget(currentTarget) {
        if (!open) return;
        const index = listRef.current.indexOf(currentTarget);
        if (index !== -1) {
          onNavigate(index);
        }
      }
      const props = {
        onFocus(_ref2) {
          let {
            currentTarget
          } = _ref2;
          syncCurrentTarget(currentTarget);
        },
        onClick: _ref3 => {
          let {
            currentTarget
          } = _ref3;
          return currentTarget.focus({
            preventScroll: true
          });
        },
        // Safari
        ...(focusItemOnHover && {
          onMouseMove(_ref4) {
            let {
              currentTarget
            } = _ref4;
            syncCurrentTarget(currentTarget);
          },
          onPointerLeave() {
            if (!isPointerModalityRef.current) {
              return;
            }
            indexRef.current = -1;
            focusItem(listRef, indexRef);

            // Virtual cursor with VoiceOver on iOS needs this to be flushed
            // synchronously or there is a glitch that prevents nested
            // submenus from being accessible.
            reactDom$1.flushSync(() => onNavigate(null));
            if (!virtual) {
              var _refs$floating$curren;
              // This also needs to be sync to prevent fast mouse movements
              // from leaving behind a stale active item when landing on a
              // disabled button item.
              (_refs$floating$curren = refs.floating.current) == null ? void 0 : _refs$floating$curren.focus({
                preventScroll: true
              });
            }
          }
        })
      };
      return props;
    }, [open, refs, focusItem, focusItemOnHover, listRef, onNavigate, virtual]);
    return React__namespace.useMemo(() => {
      if (!enabled) {
        return {};
      }
      const disabledIndices = disabledIndicesRef.current;
      function onKeyDown(event) {
        isPointerModalityRef.current = false;
        forceSyncFocus.current = true;

        // If the floating element is animating out, ignore navigation. Otherwise,
        // the `activeIndex` gets set to 0 despite not being open so the next time
        // the user ArrowDowns, the first item won't be focused.
        if (!latestOpenRef.current && event.currentTarget === refs.floating.current) {
          return;
        }
        if (nested && isCrossOrientationCloseKey(event.key, orientation, rtl)) {
          stopEvent(event);
          onOpenChange(false);
          if (isHTMLElement(domReference)) {
            domReference.focus();
          }
          return;
        }
        const currentIndex = indexRef.current;
        const minIndex = getMinIndex(listRef, disabledIndices);
        const maxIndex = getMaxIndex(listRef, disabledIndices);
        if (event.key === 'Home') {
          indexRef.current = minIndex;
          onNavigate(indexRef.current);
        }
        if (event.key === 'End') {
          indexRef.current = maxIndex;
          onNavigate(indexRef.current);
        }

        // Grid navigation.
        if (cols > 1) {
          const prevIndex = indexRef.current;
          if (event.key === ARROW_UP) {
            stopEvent(event);
            if (prevIndex === -1) {
              indexRef.current = maxIndex;
            } else {
              indexRef.current = findNonDisabledIndex(listRef, {
                startingIndex: prevIndex,
                amount: cols,
                decrement: true,
                disabledIndices
              });
              if (loop && (prevIndex - cols < minIndex || indexRef.current < 0)) {
                const col = prevIndex % cols;
                const maxCol = maxIndex % cols;
                const offset = maxIndex - (maxCol - col);
                if (maxCol === col) {
                  indexRef.current = maxIndex;
                } else {
                  indexRef.current = maxCol > col ? offset : offset - cols;
                }
              }
            }
            if (isIndexOutOfBounds(listRef, indexRef.current)) {
              indexRef.current = prevIndex;
            }
            onNavigate(indexRef.current);
          }
          if (event.key === ARROW_DOWN) {
            stopEvent(event);
            if (prevIndex === -1) {
              indexRef.current = minIndex;
            } else {
              indexRef.current = findNonDisabledIndex(listRef, {
                startingIndex: prevIndex,
                amount: cols,
                disabledIndices
              });
              if (loop && prevIndex + cols > maxIndex) {
                indexRef.current = findNonDisabledIndex(listRef, {
                  startingIndex: prevIndex % cols - cols,
                  amount: cols,
                  disabledIndices
                });
              }
            }
            if (isIndexOutOfBounds(listRef, indexRef.current)) {
              indexRef.current = prevIndex;
            }
            onNavigate(indexRef.current);
          }

          // Remains on the same row/column.
          if (orientation === 'both') {
            const prevRow = Math.floor(prevIndex / cols);
            if (event.key === ARROW_RIGHT) {
              stopEvent(event);
              if (prevIndex % cols !== cols - 1) {
                indexRef.current = findNonDisabledIndex(listRef, {
                  startingIndex: prevIndex,
                  disabledIndices
                });
                if (loop && isDifferentRow(indexRef.current, cols, prevRow)) {
                  indexRef.current = findNonDisabledIndex(listRef, {
                    startingIndex: prevIndex - prevIndex % cols - 1,
                    disabledIndices
                  });
                }
              } else if (loop) {
                indexRef.current = findNonDisabledIndex(listRef, {
                  startingIndex: prevIndex - prevIndex % cols - 1,
                  disabledIndices
                });
              }
              if (isDifferentRow(indexRef.current, cols, prevRow)) {
                indexRef.current = prevIndex;
              }
            }
            if (event.key === ARROW_LEFT) {
              stopEvent(event);
              if (prevIndex % cols !== 0) {
                indexRef.current = findNonDisabledIndex(listRef, {
                  startingIndex: prevIndex,
                  disabledIndices,
                  decrement: true
                });
                if (loop && isDifferentRow(indexRef.current, cols, prevRow)) {
                  indexRef.current = findNonDisabledIndex(listRef, {
                    startingIndex: prevIndex + (cols - prevIndex % cols),
                    decrement: true,
                    disabledIndices
                  });
                }
              } else if (loop) {
                indexRef.current = findNonDisabledIndex(listRef, {
                  startingIndex: prevIndex + (cols - prevIndex % cols),
                  decrement: true,
                  disabledIndices
                });
              }
              if (isDifferentRow(indexRef.current, cols, prevRow)) {
                indexRef.current = prevIndex;
              }
            }
            const lastRow = Math.floor(maxIndex / cols) === prevRow;
            if (isIndexOutOfBounds(listRef, indexRef.current)) {
              if (loop && lastRow) {
                indexRef.current = event.key === ARROW_LEFT ? maxIndex : findNonDisabledIndex(listRef, {
                  startingIndex: prevIndex - prevIndex % cols - 1,
                  disabledIndices
                });
              } else {
                indexRef.current = prevIndex;
              }
            }
            onNavigate(indexRef.current);
            return;
          }
        }
        if (isMainOrientationKey(event.key, orientation)) {
          stopEvent(event);

          // Reset the index if no item is focused.
          if (open && !virtual && activeElement$1(event.currentTarget.ownerDocument) === event.currentTarget) {
            indexRef.current = isMainOrientationToEndKey(event.key, orientation, rtl) ? minIndex : maxIndex;
            onNavigate(indexRef.current);
            return;
          }
          if (isMainOrientationToEndKey(event.key, orientation, rtl)) {
            if (loop) {
              indexRef.current = currentIndex >= maxIndex ? allowEscape && currentIndex !== listRef.current.length ? -1 : minIndex : findNonDisabledIndex(listRef, {
                startingIndex: currentIndex,
                disabledIndices
              });
            } else {
              indexRef.current = Math.min(maxIndex, findNonDisabledIndex(listRef, {
                startingIndex: currentIndex,
                disabledIndices
              }));
            }
          } else {
            if (loop) {
              indexRef.current = currentIndex <= minIndex ? allowEscape && currentIndex !== -1 ? listRef.current.length : maxIndex : findNonDisabledIndex(listRef, {
                startingIndex: currentIndex,
                decrement: true,
                disabledIndices
              });
            } else {
              indexRef.current = Math.max(minIndex, findNonDisabledIndex(listRef, {
                startingIndex: currentIndex,
                decrement: true,
                disabledIndices
              }));
            }
          }
          if (isIndexOutOfBounds(listRef, indexRef.current)) {
            onNavigate(null);
          } else {
            onNavigate(indexRef.current);
          }
        }
      }
      function checkVirtualMouse(event) {
        if (focusItemOnOpen === 'auto' && isVirtualClick(event.nativeEvent)) {
          focusItemOnOpenRef.current = true;
        }
      }
      function checkVirtualPointer(event) {
        // `pointerdown` fires first, reset the state then perform the checks.
        focusItemOnOpenRef.current = focusItemOnOpen;
        if (focusItemOnOpen === 'auto' && isVirtualPointerEvent(event.nativeEvent)) {
          focusItemOnOpenRef.current = true;
        }
      }
      const ariaActiveDescendantProp = virtual && open && hasActiveIndex && {
        'aria-activedescendant': activeId
      };
      return {
        reference: {
          ...ariaActiveDescendantProp,
          onKeyDown(event) {
            isPointerModalityRef.current = false;
            const isArrowKey = event.key.indexOf('Arrow') === 0;
            if (virtual && open) {
              return onKeyDown(event);
            }

            // If a floating element should not open on arrow key down, avoid
            // setting `activeIndex` while it's closed.
            if (!open && !openOnArrowKeyDown && isArrowKey) {
              return;
            }
            const isNavigationKey = isArrowKey || event.key === 'Enter' || event.key === ' ' || event.key === '';
            if (isNavigationKey) {
              keyRef.current = event.key;
            }
            if (nested) {
              if (isCrossOrientationOpenKey(event.key, orientation, rtl)) {
                stopEvent(event);
                if (open) {
                  indexRef.current = getMinIndex(listRef, disabledIndices);
                  onNavigate(indexRef.current);
                } else {
                  onOpenChange(true);
                }
              }
              return;
            }
            if (isMainOrientationKey(event.key, orientation)) {
              if (selectedIndex != null) {
                indexRef.current = selectedIndex;
              }
              stopEvent(event);
              if (!open && openOnArrowKeyDown) {
                onOpenChange(true);
              } else {
                onKeyDown(event);
              }
              if (open) {
                onNavigate(indexRef.current);
              }
            }
          },
          onFocus() {
            if (open) {
              onNavigate(null);
            }
          },
          onPointerDown: checkVirtualPointer,
          onMouseDown: checkVirtualMouse,
          onClick: checkVirtualMouse
        },
        floating: {
          'aria-orientation': orientation === 'both' ? undefined : orientation,
          ...ariaActiveDescendantProp,
          onKeyDown,
          onPointerMove() {
            isPointerModalityRef.current = true;
          }
        },
        item
      };
    }, [domReference, refs, activeId, disabledIndicesRef, latestOpenRef, listRef, enabled, orientation, rtl, virtual, open, hasActiveIndex, nested, selectedIndex, openOnArrowKeyDown, allowEscape, cols, loop, focusItemOnOpen, onNavigate, onOpenChange, item]);
  };

  /**
   * Merges an array of refs into a single memoized callback ref or `null`.
   * @see https://floating-ui.com/docs/useMergeRefs
   */
  function useMergeRefs(refs) {
    return React__namespace.useMemo(() => {
      if (refs.every(ref => ref == null)) {
        return null;
      }
      return value => {
        refs.forEach(ref => {
          if (typeof ref === 'function') {
            ref(value);
          } else if (ref != null) {
            ref.current = value;
          }
        });
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, refs);
  }

  /**
   * Adds base screen reader props to the reference and floating elements for a
   * given floating element `role`.
   * @see https://floating-ui.com/docs/useRole
   */
  const useRole = function (_ref, _temp) {
    let {
      open
    } = _ref;
    let {
      enabled = true,
      role = 'dialog'
    } = _temp === void 0 ? {} : _temp;
    const rootId = useId();
    const referenceId = useId();
    return React__namespace.useMemo(() => {
      const floatingProps = {
        id: rootId,
        role
      };
      if (!enabled) {
        return {};
      }
      if (role === 'tooltip') {
        return {
          reference: {
            'aria-describedby': open ? rootId : undefined
          },
          floating: floatingProps
        };
      }
      return {
        reference: {
          'aria-expanded': open ? 'true' : 'false',
          'aria-haspopup': role === 'alertdialog' ? 'dialog' : role,
          'aria-controls': open ? rootId : undefined,
          ...(role === 'listbox' && {
            role: 'combobox'
          }),
          ...(role === 'menu' && {
            id: referenceId
          })
        },
        floating: {
          ...floatingProps,
          ...(role === 'menu' && {
            'aria-labelledby': referenceId
          })
        }
      };
    }, [enabled, role, open, rootId, referenceId]);
  };

  // Converts a JS style key like `backgroundColor` to a CSS transition-property
  // like `background-color`.
  const camelCaseToKebabCase = str => str.replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($, ofs) => (ofs ? '-' : '') + $.toLowerCase());
  function useDelayUnmount(open, durationMs) {
    const [isMounted, setIsMounted] = React__namespace.useState(open);
    if (open && !isMounted) {
      setIsMounted(true);
    }
    React__namespace.useEffect(() => {
      if (!open) {
        const timeout = setTimeout(() => setIsMounted(false), durationMs);
        return () => clearTimeout(timeout);
      }
    }, [open, durationMs]);
    return isMounted;
  }
  /**
   * Provides a status string to apply CSS transitions to a floating element,
   * correctly handling placement-aware transitions.
   * @see https://floating-ui.com/docs/useTransition#usetransitionstatus
   */
  function useTransitionStatus(_ref, _temp) {
    let {
      open,
      elements: {
        floating
      }
    } = _ref;
    let {
      duration = 250
    } = _temp === void 0 ? {} : _temp;
    const isNumberDuration = typeof duration === 'number';
    const closeDuration = (isNumberDuration ? duration : duration.close) || 0;
    const [initiated, setInitiated] = React__namespace.useState(false);
    const [status, setStatus] = React__namespace.useState('unmounted');
    const isMounted = useDelayUnmount(open, closeDuration);

    // `initiated` check prevents this `setState` call from breaking
    // <FloatingPortal />. This call is necessary to ensure subsequent opens
    // after the initial one allows the correct side animation to play when the
    // placement has changed.
    index(() => {
      if (initiated && !isMounted) {
        setStatus('unmounted');
      }
    }, [initiated, isMounted]);
    index(() => {
      if (!floating) return;
      if (open) {
        setStatus('initial');
        const frame = requestAnimationFrame(() => {
          setStatus('open');
        });
        return () => {
          cancelAnimationFrame(frame);
        };
      } else {
        setInitiated(true);
        setStatus('close');
      }
    }, [open, floating]);
    return {
      isMounted,
      status
    };
  }
  /**
   * Provides styles to apply CSS transitions to a floating element, correctly
   * handling placement-aware transitions. Wrapper around `useTransitionStatus`.
   * @see https://floating-ui.com/docs/useTransition#usetransitionstyles
   */
  function useTransitionStyles(context, _temp2) {
    let {
      initial: unstable_initial = {
        opacity: 0
      },
      open: unstable_open,
      close: unstable_close,
      common: unstable_common,
      duration = 250
    } = _temp2 === void 0 ? {} : _temp2;
    const placement = context.placement;
    const side = placement.split('-')[0];
    const [styles, setStyles] = React__namespace.useState({});
    const {
      isMounted,
      status
    } = useTransitionStatus(context, {
      duration
    });
    const initialRef = useLatestRef(unstable_initial);
    const openRef = useLatestRef(unstable_open);
    const closeRef = useLatestRef(unstable_close);
    const commonRef = useLatestRef(unstable_common);
    const isNumberDuration = typeof duration === 'number';
    const openDuration = (isNumberDuration ? duration : duration.open) || 0;
    const closeDuration = (isNumberDuration ? duration : duration.close) || 0;
    index(() => {
      const fnArgs = {
        side,
        placement
      };
      const initial = initialRef.current;
      const close = closeRef.current;
      const open = openRef.current;
      const common = commonRef.current;
      const initialStyles = typeof initial === 'function' ? initial(fnArgs) : initial;
      const closeStyles = typeof close === 'function' ? close(fnArgs) : close;
      const commonStyles = typeof common === 'function' ? common(fnArgs) : common;
      const openStyles = (typeof open === 'function' ? open(fnArgs) : open) || Object.keys(initialStyles).reduce((acc, key) => {
        acc[key] = '';
        return acc;
      }, {});
      if (status === 'initial' || status === 'unmounted') {
        setStyles(styles => ({
          transitionProperty: styles.transitionProperty,
          ...commonStyles,
          ...initialStyles
        }));
      }
      if (status === 'open') {
        setStyles({
          transitionProperty: Object.keys(openStyles).map(camelCaseToKebabCase).join(','),
          transitionDuration: openDuration + "ms",
          ...commonStyles,
          ...openStyles
        });
      }
      if (status === 'close') {
        const styles = closeStyles || initialStyles;
        setStyles({
          transitionProperty: Object.keys(styles).map(camelCaseToKebabCase).join(','),
          transitionDuration: closeDuration + "ms",
          ...commonStyles,
          ...styles
        });
      }
    }, [side, placement, closeDuration, closeRef, initialRef, openRef, commonRef, openDuration, status]);
    return {
      isMounted,
      styles
    };
  }

  /**
   * Provides a matching callback that can be used to focus an item as the user
   * types, often used in tandem with `useListNavigation()`.
   * @see https://floating-ui.com/docs/useTypeahead
   */
  const useTypeahead = function (_ref, _temp) {
    var _ref2;
    let {
      open,
      dataRef,
      refs
    } = _ref;
    let {
      listRef,
      activeIndex,
      onMatch: unstable_onMatch = () => {},
      enabled = true,
      findMatch = null,
      resetMs = 1000,
      ignoreKeys = [],
      selectedIndex = null
    } = _temp === void 0 ? {
      listRef: {
        current: []
      },
      activeIndex: null
    } : _temp;
    const timeoutIdRef = React__namespace.useRef();
    const stringRef = React__namespace.useRef('');
    const prevIndexRef = React__namespace.useRef((_ref2 = selectedIndex != null ? selectedIndex : activeIndex) != null ? _ref2 : -1);
    const matchIndexRef = React__namespace.useRef(null);
    const onMatch = useEvent(unstable_onMatch);
    const findMatchRef = useLatestRef(findMatch);
    const ignoreKeysRef = useLatestRef(ignoreKeys);
    index(() => {
      if (open) {
        clearTimeout(timeoutIdRef.current);
        matchIndexRef.current = null;
        stringRef.current = '';
      }
    }, [open]);
    index(() => {
      // Sync arrow key navigation but not typeahead navigation.
      if (open && stringRef.current === '') {
        var _ref3;
        prevIndexRef.current = (_ref3 = selectedIndex != null ? selectedIndex : activeIndex) != null ? _ref3 : -1;
      }
    }, [open, selectedIndex, activeIndex]);
    return React__namespace.useMemo(() => {
      if (!enabled) {
        return {};
      }
      function onKeyDown(event) {
        var _refs$floating$curren;
        // Correctly scope nested non-portalled floating elements. Since the nested
        // floating element is inside of the another, we find the closest role
        // that indicates the floating element scope.
        const target = getTarget(event.nativeEvent);
        if (isElement(target) && (activeElement$1(getDocument(target)) !== event.currentTarget ? (_refs$floating$curren = refs.floating.current) != null && _refs$floating$curren.contains(target) ? target.closest('[role="dialog"],[role="menu"],[role="listbox"],[role="tree"],[role="grid"]') !== event.currentTarget : false : !event.currentTarget.contains(target))) {
          return;
        }
        if (stringRef.current.length > 0 && stringRef.current[0] !== ' ') {
          dataRef.current.typing = true;
          if (event.key === ' ') {
            stopEvent(event);
          }
        }
        const listContent = listRef.current;
        if (listContent == null || ignoreKeysRef.current.includes(event.key) ||
        // Character key.
        event.key.length !== 1 ||
        // Modifier key.
        event.ctrlKey || event.metaKey || event.altKey) {
          return;
        }

        // Bail out if the list contains a word like "llama" or "aaron". TODO:
        // allow it in this case, too.
        const allowRapidSuccessionOfFirstLetter = listContent.every(text => {
          var _text$, _text$2;
          return text ? ((_text$ = text[0]) == null ? void 0 : _text$.toLocaleLowerCase()) !== ((_text$2 = text[1]) == null ? void 0 : _text$2.toLocaleLowerCase()) : true;
        });

        // Allows the user to cycle through items that start with the same letter
        // in rapid succession.
        if (allowRapidSuccessionOfFirstLetter && stringRef.current === event.key) {
          stringRef.current = '';
          prevIndexRef.current = matchIndexRef.current;
        }
        stringRef.current += event.key;
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = setTimeout(() => {
          stringRef.current = '';
          prevIndexRef.current = matchIndexRef.current;
          dataRef.current.typing = false;
        }, resetMs);
        const prevIndex = prevIndexRef.current;
        const orderedList = [...listContent.slice((prevIndex || 0) + 1), ...listContent.slice(0, (prevIndex || 0) + 1)];
        const str = findMatchRef.current ? findMatchRef.current(orderedList, stringRef.current) : orderedList.find(text => (text == null ? void 0 : text.toLocaleLowerCase().indexOf(stringRef.current.toLocaleLowerCase())) === 0);
        const index = str ? listContent.indexOf(str) : -1;
        if (index !== -1) {
          onMatch(index);
          matchIndexRef.current = index;
        }
      }
      return {
        reference: {
          onKeyDown
        },
        floating: {
          onKeyDown
        }
      };
    }, [enabled, dataRef, listRef, resetMs, ignoreKeysRef, findMatchRef, onMatch, refs]);
  };

  function getArgsWithCustomFloatingHeight(state, height) {
    return {
      ...state,
      rects: {
        ...state.rects,
        floating: {
          ...state.rects.floating,
          height
        }
      }
    };
  }
  /**
   * Positions the floating element such that an inner element inside
   * of it is anchored to the reference element.
   * @see https://floating-ui.com/docs/inner
   */
  const inner = props => ({
    name: 'inner',
    options: props,
    async fn(state) {
      const {
        listRef,
        overflowRef,
        onFallbackChange,
        offset: innerOffset = 0,
        index = 0,
        minItemsVisible = 4,
        referenceOverflowThreshold = 0,
        scrollRef,
        ...detectOverflowOptions
      } = props;
      const {
        rects,
        elements: {
          floating
        }
      } = state;
      const item = listRef.current[index];
      if (process.env.NODE_ENV !== "production") {
        if (!state.placement.startsWith('bottom')) {
          console.warn(['Floating UI: `placement` side must be "bottom" when using the', '`inner` middleware.'].join(' '));
        }
      }
      if (!item) {
        return {};
      }
      const nextArgs = {
        ...state,
        ...(await reactDom.offset(-item.offsetTop - rects.reference.height / 2 - item.offsetHeight / 2 - innerOffset).fn(state))
      };
      const el = (scrollRef == null ? void 0 : scrollRef.current) || floating;
      const overflow = await reactDom.detectOverflow(getArgsWithCustomFloatingHeight(nextArgs, el.scrollHeight), detectOverflowOptions);
      const refOverflow = await reactDom.detectOverflow(nextArgs, {
        ...detectOverflowOptions,
        elementContext: 'reference'
      });
      const diffY = Math.max(0, overflow.top);
      const nextY = nextArgs.y + diffY;
      const maxHeight = Math.max(0, el.scrollHeight - diffY - Math.max(0, overflow.bottom));
      el.style.maxHeight = maxHeight + "px";
      el.scrollTop = diffY;

      // There is not enough space, fallback to standard anchored positioning
      if (onFallbackChange) {
        if (el.offsetHeight < item.offsetHeight * Math.min(minItemsVisible, listRef.current.length - 1) - 1 || refOverflow.top >= -referenceOverflowThreshold || refOverflow.bottom >= -referenceOverflowThreshold) {
          reactDom$1.flushSync(() => onFallbackChange(true));
        } else {
          reactDom$1.flushSync(() => onFallbackChange(false));
        }
      }
      if (overflowRef) {
        overflowRef.current = await reactDom.detectOverflow(getArgsWithCustomFloatingHeight({
          ...nextArgs,
          y: nextY
        }, el.offsetHeight), detectOverflowOptions);
      }
      return {
        y: nextY
      };
    }
  });
  /**
   * Changes the `inner` middleware's `offset` upon a `wheel` event to
   * expand the floating element's height, revealing more list items.
   * @see https://floating-ui.com/docs/inner
   */
  const useInnerOffset = (_ref, _ref2) => {
    let {
      open,
      elements
    } = _ref;
    let {
      enabled = true,
      overflowRef,
      scrollRef,
      onChange: unstable_onChange
    } = _ref2;
    const onChange = useEvent(unstable_onChange);
    const controlledScrollingRef = React__namespace.useRef(false);
    const prevScrollTopRef = React__namespace.useRef(null);
    const initialOverflowRef = React__namespace.useRef(null);
    React__namespace.useEffect(() => {
      if (!enabled) {
        return;
      }
      function onWheel(e) {
        if (e.ctrlKey || !el || overflowRef.current == null) {
          return;
        }
        const dY = e.deltaY;
        const isAtTop = overflowRef.current.top >= -0.5;
        const isAtBottom = overflowRef.current.bottom >= -0.5;
        const remainingScroll = el.scrollHeight - el.clientHeight;
        const sign = dY < 0 ? -1 : 1;
        const method = dY < 0 ? 'max' : 'min';
        if (el.scrollHeight <= el.clientHeight) {
          return;
        }
        if (!isAtTop && dY > 0 || !isAtBottom && dY < 0) {
          e.preventDefault();
          reactDom$1.flushSync(() => {
            onChange(d => d + Math[method](dY, remainingScroll * sign));
          });
        } else if (/firefox/i.test(getUserAgent())) {
          // Needed to propagate scrolling during momentum scrolling phase once
          // it gets limited by the boundary. UX improvement, not critical.
          el.scrollTop += dY;
        }
      }
      const el = (scrollRef == null ? void 0 : scrollRef.current) || elements.floating;
      if (open && el) {
        el.addEventListener('wheel', onWheel);

        // Wait for the position to be ready.
        requestAnimationFrame(() => {
          prevScrollTopRef.current = el.scrollTop;
          if (overflowRef.current != null) {
            initialOverflowRef.current = {
              ...overflowRef.current
            };
          }
        });
        return () => {
          prevScrollTopRef.current = null;
          initialOverflowRef.current = null;
          el.removeEventListener('wheel', onWheel);
        };
      }
    }, [enabled, open, elements.floating, overflowRef, scrollRef, onChange]);
    return React__namespace.useMemo(() => {
      if (!enabled) {
        return {};
      }
      return {
        floating: {
          onKeyDown() {
            controlledScrollingRef.current = true;
          },
          onWheel() {
            controlledScrollingRef.current = false;
          },
          onPointerMove() {
            controlledScrollingRef.current = false;
          },
          onScroll() {
            const el = (scrollRef == null ? void 0 : scrollRef.current) || elements.floating;
            if (!overflowRef.current || !el || !controlledScrollingRef.current) {
              return;
            }
            if (prevScrollTopRef.current !== null) {
              const scrollDiff = el.scrollTop - prevScrollTopRef.current;
              if (overflowRef.current.bottom < -0.5 && scrollDiff < -1 || overflowRef.current.top < -0.5 && scrollDiff > 1) {
                reactDom$1.flushSync(() => onChange(d => d + scrollDiff));
              }
            }

            // [Firefox] Wait for the height change to have been applied.
            requestAnimationFrame(() => {
              prevScrollTopRef.current = el.scrollTop;
            });
          }
        }
      };
    }, [enabled, overflowRef, elements.floating, scrollRef, onChange]);
  };

  function isPointInPolygon(point, polygon) {
    const [x, y] = point;
    let isInside = false;
    const length = polygon.length;
    for (let i = 0, j = length - 1; i < length; j = i++) {
      const [xi, yi] = polygon[i] || [0, 0];
      const [xj, yj] = polygon[j] || [0, 0];
      const intersect = yi >= y !== yj >= y && x <= (xj - xi) * (y - yi) / (yj - yi) + xi;
      if (intersect) {
        isInside = !isInside;
      }
    }
    return isInside;
  }
  function isInside(point, rect) {
    return point[0] >= rect.x && point[0] <= rect.x + rect.width && point[1] >= rect.y && point[1] <= rect.y + rect.height;
  }
  function safePolygon(_temp) {
    let {
      restMs = 0,
      buffer = 0.5,
      blockPointerEvents = false
    } = _temp === void 0 ? {} : _temp;
    let timeoutId;
    let isInsideRect = false;
    let hasLanded = false;
    const fn = _ref => {
      let {
        x,
        y,
        placement,
        elements,
        onClose,
        nodeId,
        tree
      } = _ref;
      return function onMouseMove(event) {
        function close() {
          clearTimeout(timeoutId);
          onClose();
        }
        clearTimeout(timeoutId);
        if (!elements.domReference || !elements.floating || placement == null || x == null || y == null) {
          return;
        }
        const {
          clientX,
          clientY
        } = event;
        const clientPoint = [clientX, clientY];
        const target = getTarget(event);
        const isLeave = event.type === 'mouseleave';
        const isOverFloatingEl = contains(elements.floating, target);
        const isOverReferenceEl = contains(elements.domReference, target);
        const refRect = elements.domReference.getBoundingClientRect();
        const rect = elements.floating.getBoundingClientRect();
        const side = placement.split('-')[0];
        const cursorLeaveFromRight = x > rect.right - rect.width / 2;
        const cursorLeaveFromBottom = y > rect.bottom - rect.height / 2;
        const isOverReferenceRect = isInside(clientPoint, refRect);
        if (isOverFloatingEl) {
          hasLanded = true;
          if (!isLeave) {
            return;
          }
        }
        if (isOverReferenceEl) {
          hasLanded = false;
        }
        if (isOverReferenceEl && !isLeave) {
          hasLanded = true;
          return;
        }

        // Prevent overlapping floating element from being stuck in an open-close
        // loop: https://github.com/floating-ui/floating-ui/issues/1910
        if (isLeave && isElement(event.relatedTarget) && contains(elements.floating, event.relatedTarget)) {
          return;
        }

        // If any nested child is open, abort.
        if (tree && getChildren(tree.nodesRef.current, nodeId).some(_ref2 => {
          let {
            context
          } = _ref2;
          return context == null ? void 0 : context.open;
        })) {
          return;
        }

        // If the pointer is leaving from the opposite side, the "buffer" logic
        // creates a point where the floating element remains open, but should be
        // ignored.
        // A constant of 1 handles floating point rounding errors.
        if (side === 'top' && y >= refRect.bottom - 1 || side === 'bottom' && y <= refRect.top + 1 || side === 'left' && x >= refRect.right - 1 || side === 'right' && x <= refRect.left + 1) {
          return close();
        }

        // Ignore when the cursor is within the rectangular trough between the
        // two elements. Since the triangle is created from the cursor point,
        // which can start beyond the ref element's edge, traversing back and
        // forth from the ref to the floating element can cause it to close. This
        // ensures it always remains open in that case.
        let rectPoly = [];
        switch (side) {
          case 'top':
            rectPoly = [[rect.left, refRect.top + 1], [rect.left, rect.bottom - 1], [rect.right, rect.bottom - 1], [rect.right, refRect.top + 1]];
            isInsideRect = clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= refRect.top + 1;
            break;
          case 'bottom':
            rectPoly = [[rect.left, rect.top + 1], [rect.left, refRect.bottom - 1], [rect.right, refRect.bottom - 1], [rect.right, rect.top + 1]];
            isInsideRect = clientX >= rect.left && clientX <= rect.right && clientY >= refRect.bottom - 1 && clientY <= rect.bottom;
            break;
          case 'left':
            rectPoly = [[rect.right - 1, rect.bottom], [rect.right - 1, rect.top], [refRect.left + 1, rect.top], [refRect.left + 1, rect.bottom]];
            isInsideRect = clientX >= rect.left && clientX <= refRect.left + 1 && clientY >= rect.top && clientY <= rect.bottom;
            break;
          case 'right':
            rectPoly = [[refRect.right - 1, rect.bottom], [refRect.right - 1, rect.top], [rect.left + 1, rect.top], [rect.left + 1, rect.bottom]];
            isInsideRect = clientX >= refRect.right - 1 && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
            break;
        }
        function getPolygon(_ref3) {
          let [x, y] = _ref3;
          const isFloatingWider = rect.width > refRect.width;
          const isFloatingTaller = rect.height > refRect.height;
          switch (side) {
            case 'top':
              {
                const cursorPointOne = [isFloatingWider ? x + buffer / 2 : cursorLeaveFromRight ? x + buffer * 4 : x - buffer * 4, y + buffer + 1];
                const cursorPointTwo = [isFloatingWider ? x - buffer / 2 : cursorLeaveFromRight ? x + buffer * 4 : x - buffer * 4, y + buffer + 1];
                const commonPoints = [[rect.left, cursorLeaveFromRight ? rect.bottom - buffer : isFloatingWider ? rect.bottom - buffer : rect.top], [rect.right, cursorLeaveFromRight ? isFloatingWider ? rect.bottom - buffer : rect.top : rect.bottom - buffer]];
                return [cursorPointOne, cursorPointTwo, ...commonPoints];
              }
            case 'bottom':
              {
                const cursorPointOne = [isFloatingWider ? x + buffer / 2 : cursorLeaveFromRight ? x + buffer * 4 : x - buffer * 4, y - buffer];
                const cursorPointTwo = [isFloatingWider ? x - buffer / 2 : cursorLeaveFromRight ? x + buffer * 4 : x - buffer * 4, y - buffer];
                const commonPoints = [[rect.left, cursorLeaveFromRight ? rect.top + buffer : isFloatingWider ? rect.top + buffer : rect.bottom], [rect.right, cursorLeaveFromRight ? isFloatingWider ? rect.top + buffer : rect.bottom : rect.top + buffer]];
                return [cursorPointOne, cursorPointTwo, ...commonPoints];
              }
            case 'left':
              {
                const cursorPointOne = [x + buffer + 1, isFloatingTaller ? y + buffer / 2 : cursorLeaveFromBottom ? y + buffer * 4 : y - buffer * 4];
                const cursorPointTwo = [x + buffer + 1, isFloatingTaller ? y - buffer / 2 : cursorLeaveFromBottom ? y + buffer * 4 : y - buffer * 4];
                const commonPoints = [[cursorLeaveFromBottom ? rect.right - buffer : isFloatingTaller ? rect.right - buffer : rect.left, rect.top], [cursorLeaveFromBottom ? isFloatingTaller ? rect.right - buffer : rect.left : rect.right - buffer, rect.bottom]];
                return [...commonPoints, cursorPointOne, cursorPointTwo];
              }
            case 'right':
              {
                const cursorPointOne = [x - buffer, isFloatingTaller ? y + buffer / 2 : cursorLeaveFromBottom ? y + buffer * 4 : y - buffer * 4];
                const cursorPointTwo = [x - buffer, isFloatingTaller ? y - buffer / 2 : cursorLeaveFromBottom ? y + buffer * 4 : y - buffer * 4];
                const commonPoints = [[cursorLeaveFromBottom ? rect.left + buffer : isFloatingTaller ? rect.left + buffer : rect.right, rect.top], [cursorLeaveFromBottom ? isFloatingTaller ? rect.left + buffer : rect.right : rect.left + buffer, rect.bottom]];
                return [cursorPointOne, cursorPointTwo, ...commonPoints];
              }
          }
        }
        const poly = isInsideRect ? rectPoly : getPolygon([x, y]);
        if (isInsideRect) {
          return;
        } else if (hasLanded && !isOverReferenceRect) {
          return close();
        }
        if (!isPointInPolygon([clientX, clientY], poly)) {
          close();
        } else if (restMs && !hasLanded) {
          timeoutId = setTimeout(close, restMs);
        }
      };
    };
    fn.__options = {
      blockPointerEvents
    };
    return fn;
  }

  /**
   * Provides data to position a floating element and context to add interactions.
   * @see https://floating-ui.com/docs/react
   */
  function useFloating(options) {
    if (options === void 0) {
      options = {};
    }
    const {
      open = false,
      onOpenChange: unstable_onOpenChange,
      nodeId
    } = options;
    const position = reactDom.useFloating(options);
    const tree = useFloatingTree();
    const domReferenceRef = React__namespace.useRef(null);
    const dataRef = React__namespace.useRef({});
    const events = React__namespace.useState(() => createPubSub())[0];
    const [domReference, setDomReference] = React__namespace.useState(null);
    const setPositionReference = React__namespace.useCallback(node => {
      const positionReference = isElement(node) ? {
        getBoundingClientRect: () => node.getBoundingClientRect(),
        contextElement: node
      } : node;
      position.refs.setReference(positionReference);
    }, [position.refs]);
    const setReference = React__namespace.useCallback(node => {
      if (isElement(node) || node === null) {
        domReferenceRef.current = node;
        setDomReference(node);
      }

      // Backwards-compatibility for passing a virtual element to `reference`
      // after it has set the DOM reference.
      if (isElement(position.refs.reference.current) || position.refs.reference.current === null ||
      // Don't allow setting virtual elements using the old technique back to
      // `null` to support `positionReference` + an unstable `reference`
      // callback ref.
      node !== null && !isElement(node)) {
        position.refs.setReference(node);
      }
    }, [position.refs]);
    const refs = React__namespace.useMemo(() => ({
      ...position.refs,
      setReference,
      setPositionReference,
      domReference: domReferenceRef
    }), [position.refs, setReference, setPositionReference]);
    const elements = React__namespace.useMemo(() => ({
      ...position.elements,
      domReference: domReference
    }), [position.elements, domReference]);
    const onOpenChange = useEvent(unstable_onOpenChange);
    const context = React__namespace.useMemo(() => ({
      ...position,
      refs,
      elements,
      dataRef,
      nodeId,
      events,
      open,
      onOpenChange
    }), [position, nodeId, events, open, onOpenChange, refs, elements]);
    index(() => {
      const node = tree == null ? void 0 : tree.nodesRef.current.find(node => node.id === nodeId);
      if (node) {
        node.context = context;
      }
    });
    return React__namespace.useMemo(() => ({
      ...position,
      context,
      refs,
      reference: setReference,
      positionReference: setPositionReference
    }), [position, refs, context, setReference, setPositionReference]);
  }

  function mergeProps(userProps, propsList, elementKey) {
    const map = new Map();
    return {
      ...(elementKey === 'floating' && {
        tabIndex: -1
      }),
      ...userProps,
      ...propsList.map(value => value ? value[elementKey] : null).concat(userProps).reduce((acc, props) => {
        if (!props) {
          return acc;
        }
        Object.entries(props).forEach(_ref => {
          let [key, value] = _ref;
          if (key.indexOf('on') === 0) {
            if (!map.has(key)) {
              map.set(key, []);
            }
            if (typeof value === 'function') {
              var _map$get;
              (_map$get = map.get(key)) == null ? void 0 : _map$get.push(value);
              acc[key] = function () {
                var _map$get2;
                for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
                  args[_key] = arguments[_key];
                }
                (_map$get2 = map.get(key)) == null ? void 0 : _map$get2.forEach(fn => fn(...args));
              };
            }
          } else {
            acc[key] = value;
          }
        });
        return acc;
      }, {})
    };
  }
  const useInteractions = function (propsList) {
    if (propsList === void 0) {
      propsList = [];
    }
    // The dependencies are a dynamic array, so we can't use the linter's
    // suggestion to add it to the deps array.
    const deps = propsList;
    const getReferenceProps = React__namespace.useCallback(userProps => mergeProps(userProps, propsList, 'reference'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps);
    const getFloatingProps = React__namespace.useCallback(userProps => mergeProps(userProps, propsList, 'floating'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps);
    const getItemProps = React__namespace.useCallback(userProps => mergeProps(userProps, propsList, 'item'),
    // Granularly check for `item` changes, because the `getItemProps` getter
    // should be as referentially stable as possible since it may be passed as
    // a prop to many components. All `item` key values must therefore be
    // memoized.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    propsList.map(key => key == null ? void 0 : key.item));
    return React__namespace.useMemo(() => ({
      getReferenceProps,
      getFloatingProps,
      getItemProps
    }), [getReferenceProps, getFloatingProps, getItemProps]);
  };

  Object.defineProperty(exports, 'arrow', {
    enumerable: true,
    get: function () { return reactDom.arrow; }
  });
  Object.defineProperty(exports, 'autoPlacement', {
    enumerable: true,
    get: function () { return reactDom.autoPlacement; }
  });
  Object.defineProperty(exports, 'autoUpdate', {
    enumerable: true,
    get: function () { return reactDom.autoUpdate; }
  });
  Object.defineProperty(exports, 'computePosition', {
    enumerable: true,
    get: function () { return reactDom.computePosition; }
  });
  Object.defineProperty(exports, 'detectOverflow', {
    enumerable: true,
    get: function () { return reactDom.detectOverflow; }
  });
  Object.defineProperty(exports, 'flip', {
    enumerable: true,
    get: function () { return reactDom.flip; }
  });
  Object.defineProperty(exports, 'getOverflowAncestors', {
    enumerable: true,
    get: function () { return reactDom.getOverflowAncestors; }
  });
  Object.defineProperty(exports, 'hide', {
    enumerable: true,
    get: function () { return reactDom.hide; }
  });
  Object.defineProperty(exports, 'inline', {
    enumerable: true,
    get: function () { return reactDom.inline; }
  });
  Object.defineProperty(exports, 'limitShift', {
    enumerable: true,
    get: function () { return reactDom.limitShift; }
  });
  Object.defineProperty(exports, 'offset', {
    enumerable: true,
    get: function () { return reactDom.offset; }
  });
  Object.defineProperty(exports, 'platform', {
    enumerable: true,
    get: function () { return reactDom.platform; }
  });
  Object.defineProperty(exports, 'shift', {
    enumerable: true,
    get: function () { return reactDom.shift; }
  });
  Object.defineProperty(exports, 'size', {
    enumerable: true,
    get: function () { return reactDom.size; }
  });
  exports.FloatingDelayGroup = FloatingDelayGroup;
  exports.FloatingFocusManager = FloatingFocusManager;
  exports.FloatingNode = FloatingNode;
  exports.FloatingOverlay = FloatingOverlay;
  exports.FloatingPortal = FloatingPortal;
  exports.FloatingTree = FloatingTree;
  exports.inner = inner;
  exports.safePolygon = safePolygon;
  exports.useClick = useClick;
  exports.useDelayGroup = useDelayGroup;
  exports.useDelayGroupContext = useDelayGroupContext;
  exports.useDismiss = useDismiss;
  exports.useFloating = useFloating;
  exports.useFloatingNodeId = useFloatingNodeId;
  exports.useFloatingParentNodeId = useFloatingParentNodeId;
  exports.useFloatingPortalNode = useFloatingPortalNode;
  exports.useFloatingTree = useFloatingTree;
  exports.useFocus = useFocus;
  exports.useHover = useHover;
  exports.useId = useId;
  exports.useInnerOffset = useInnerOffset;
  exports.useInteractions = useInteractions;
  exports.useListNavigation = useListNavigation;
  exports.useMergeRefs = useMergeRefs;
  exports.useRole = useRole;
  exports.useTransitionStatus = useTransitionStatus;
  exports.useTransitionStyles = useTransitionStyles;
  exports.useTypeahead = useTypeahead;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
