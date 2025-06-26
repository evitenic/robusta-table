// resources/js/resized-column.js
function resized_column_default(Alpine2) {
  Alpine2.directive("robusta-resized-column", (el, { expression }, { evaluate }) => {
    const evaluated = evaluate(expression) || {};
    let { tableKey, minColumnWidth, maxColumnWidth, enable = false } = evaluated;
    maxColumnWidth = maxColumnWidth === -1 ? Infinity : maxColumnWidth;
    if (!enable)
      return;
    let currentWidth = 0;
    const tableSelector = ".fi-ta-table";
    const tableWrapperContentSelector = ".fi-ta-content";
    const tableBodyCellPrefix = "fi-table-cell-";
    const columnSelector = "x-robusta-table-column";
    const excludeColumnSelector = "x-robusta-table-exclude-column";
    const columns = el.querySelectorAll(`[${columnSelector}]`);
    const excludeColumns = el.querySelectorAll(`[${excludeColumnSelector}]`);
    let table = el.querySelector(tableSelector);
    let tableWrapper = el.querySelector(tableWrapperContentSelector);
    let handleBar = null;
    if (table && tableWrapper) {
      init();
    }
    function init() {
      initializeColumnLayout();
    }
    function initializeColumnLayout() {
      let totalWidth = 0;
      const applyLayout = (column, getNameFn, withHandleBar = false) => {
        const columnName = getNameFn(column);
        const defaultKey = `${columnName}_default`;
        if (withHandleBar) {
          column.classList.add("relative", "group/column-resize", "overflow-hidden");
          createHandleBar(column);
        }
        let savedWidth = getSavedWidth(columnName);
        const defaultWidth = getSavedWidth(defaultKey);
        if (!savedWidth && defaultWidth) {
          savedWidth = defaultWidth;
        }
        if (!savedWidth && !defaultWidth) {
          savedWidth = column.offsetWidth;
          handleColumnUpdate(savedWidth, defaultKey);
        }
        totalWidth += savedWidth;
        applyColumnWidth(savedWidth, column);
      };
      excludeColumns.forEach((column) => {
        applyLayout(column, (col) => getColumnName(col, excludeColumnSelector));
      });
      columns.forEach((column) => {
        applyLayout(column, getColumnName, true);
      });
      if (table && totalWidth) {
        table.style.maxWidth = `${totalWidth}px`;
      }
    }
    function createHandleBar(column) {
      const existingHandle = column.querySelector(".column-resize-handle-bar");
      if (existingHandle)
        existingHandle.remove();
      handleBar = document.createElement("button");
      handleBar.type = "button";
      handleBar.classList.add("column-resize-handle-bar");
      handleBar.title = "Resize column";
      column.appendChild(handleBar);
      handleBar.addEventListener("mousedown", (e) => startResize(e, column));
      handleBar.addEventListener("dblclick", (e) => handleDoubleClick(e, column));
    }
    function handleDoubleClick(event, column) {
      event.preventDefault();
      event.stopPropagation();
      const columnName = getColumnName(column);
      const defaultColumnName = columnName + "_default";
      const savedWidth = getSavedWidth(defaultColumnName) || minColumnWidth;
      if (savedWidth === column.offsetWidth)
        return;
      applyColumnWidth(savedWidth, column);
      handleColumnUpdate(savedWidth, columnName);
    }
    function startResize(event, column) {
      event.preventDefault();
      event.stopPropagation();
      if (event) {
        event.target.classList.add("active");
      }
      const startX = event.pageX;
      const originalColumnWidth = Math.round(column.offsetWidth);
      const originalTableWidth = Math.round(table.offsetWidth);
      const originalWrapperWidth = Math.round(tableWrapper.offsetWidth);
      const onMouseMove = throttle2((moveEvent) => {
        if (moveEvent.pageX === startX)
          return;
        const delta = moveEvent.pageX - startX;
        currentWidth = Math.round(
          Math.min(
            maxColumnWidth,
            Math.max(minColumnWidth, originalColumnWidth + delta - 16)
          )
        );
        const newTableWidth = originalTableWidth - originalColumnWidth + currentWidth;
        table.style.width = newTableWidth > originalWrapperWidth ? `${newTableWidth}px` : "auto";
        applyColumnWidth(currentWidth, column);
      }, 16);
      const onMouseUp = () => {
        if (event)
          event.target.classList.remove("active");
        handleColumnUpdate(currentWidth, getColumnName(column));
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    }
    function handleColumnUpdate(width, columnName) {
      saveWidthToStorage(width, columnName);
    }
    function applyColumnWidth(width, column) {
      setColumnStyles(column, width);
      const columnName = getColumnName(column);
      const cellSelector = `.${escapeCssClass(tableBodyCellPrefix + columnName)}`;
      table.querySelectorAll(cellSelector).forEach((cell) => {
        setColumnStyles(cell, width);
        cell.style.overflow = "hidden";
      });
    }
    function setColumnStyles(el2, width) {
      el2.style.width = width ? `${width}px` : "auto";
      el2.style.minWidth = width ? `${width}px` : "auto";
      el2.style.maxWidth = width ? `${width}px` : "auto";
    }
    function escapeCssClass(className) {
      return className.replace(/\./g, "\\.");
    }
    function throttle2(callback, limit) {
      let wait = false;
      return function(...args) {
        if (!wait) {
          callback.apply(this, args);
          wait = true;
          setTimeout(() => {
            wait = false;
          }, limit);
        }
      };
    }
    function getStorageKey(columnName) {
      return `${tableKey}_columnWidth_${columnName}`;
    }
    function getSavedWidth(columnName) {
      const savedWidth = sessionStorage.getItem(getStorageKey(columnName));
      return savedWidth ? parseInt(savedWidth) : null;
    }
    function saveWidthToStorage(width, columnName) {
      sessionStorage.setItem(
        getStorageKey(columnName),
        Math.max(
          minColumnWidth,
          Math.min(maxColumnWidth, width)
        ).toString()
      );
    }
    function getColumnName(column, selector = columnSelector) {
      return column.getAttribute(selector);
    }
  });
}

// node_modules/sortablejs/modular/sortable.esm.js
function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) {
      symbols = symbols.filter(function(sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
    }
    keys.push.apply(keys, symbols);
  }
  return keys;
}
function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    if (i % 2) {
      ownKeys(Object(source), true).forEach(function(key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function(key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }
  return target;
}
function _typeof(obj) {
  "@babel/helpers - typeof";
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function(obj2) {
      return typeof obj2;
    };
  } else {
    _typeof = function(obj2) {
      return obj2 && typeof Symbol === "function" && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : typeof obj2;
    };
  }
  return _typeof(obj);
}
function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _extends() {
  _extends = Object.assign || function(target) {
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
function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null)
    return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;
  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0)
      continue;
    target[key] = source[key];
  }
  return target;
}
function _objectWithoutProperties(source, excluded) {
  if (source == null)
    return {};
  var target = _objectWithoutPropertiesLoose(source, excluded);
  var key, i;
  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);
    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0)
        continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key))
        continue;
      target[key] = source[key];
    }
  }
  return target;
}
var version = "1.15.6";
function userAgent(pattern) {
  if (typeof window !== "undefined" && window.navigator) {
    return !!/* @__PURE__ */ navigator.userAgent.match(pattern);
  }
}
var IE11OrLess = userAgent(/(?:Trident.*rv[ :]?11\.|msie|iemobile|Windows Phone)/i);
var Edge = userAgent(/Edge/i);
var FireFox = userAgent(/firefox/i);
var Safari = userAgent(/safari/i) && !userAgent(/chrome/i) && !userAgent(/android/i);
var IOS = userAgent(/iP(ad|od|hone)/i);
var ChromeForAndroid = userAgent(/chrome/i) && userAgent(/android/i);
var captureMode = {
  capture: false,
  passive: false
};
function on(el, event, fn) {
  el.addEventListener(event, fn, !IE11OrLess && captureMode);
}
function off(el, event, fn) {
  el.removeEventListener(event, fn, !IE11OrLess && captureMode);
}
function matches(el, selector) {
  if (!selector)
    return;
  selector[0] === ">" && (selector = selector.substring(1));
  if (el) {
    try {
      if (el.matches) {
        return el.matches(selector);
      } else if (el.msMatchesSelector) {
        return el.msMatchesSelector(selector);
      } else if (el.webkitMatchesSelector) {
        return el.webkitMatchesSelector(selector);
      }
    } catch (_) {
      return false;
    }
  }
  return false;
}
function getParentOrHost(el) {
  return el.host && el !== document && el.host.nodeType ? el.host : el.parentNode;
}
function closest(el, selector, ctx, includeCTX) {
  if (el) {
    ctx = ctx || document;
    do {
      if (selector != null && (selector[0] === ">" ? el.parentNode === ctx && matches(el, selector) : matches(el, selector)) || includeCTX && el === ctx) {
        return el;
      }
      if (el === ctx)
        break;
    } while (el = getParentOrHost(el));
  }
  return null;
}
var R_SPACE = /\s+/g;
function toggleClass(el, name, state) {
  if (el && name) {
    if (el.classList) {
      el.classList[state ? "add" : "remove"](name);
    } else {
      var className = (" " + el.className + " ").replace(R_SPACE, " ").replace(" " + name + " ", " ");
      el.className = (className + (state ? " " + name : "")).replace(R_SPACE, " ");
    }
  }
}
function css(el, prop, val) {
  var style = el && el.style;
  if (style) {
    if (val === void 0) {
      if (document.defaultView && document.defaultView.getComputedStyle) {
        val = document.defaultView.getComputedStyle(el, "");
      } else if (el.currentStyle) {
        val = el.currentStyle;
      }
      return prop === void 0 ? val : val[prop];
    } else {
      if (!(prop in style) && prop.indexOf("webkit") === -1) {
        prop = "-webkit-" + prop;
      }
      style[prop] = val + (typeof val === "string" ? "" : "px");
    }
  }
}
function matrix(el, selfOnly) {
  var appliedTransforms = "";
  if (typeof el === "string") {
    appliedTransforms = el;
  } else {
    do {
      var transform = css(el, "transform");
      if (transform && transform !== "none") {
        appliedTransforms = transform + " " + appliedTransforms;
      }
    } while (!selfOnly && (el = el.parentNode));
  }
  var matrixFn = window.DOMMatrix || window.WebKitCSSMatrix || window.CSSMatrix || window.MSCSSMatrix;
  return matrixFn && new matrixFn(appliedTransforms);
}
function find(ctx, tagName, iterator) {
  if (ctx) {
    var list = ctx.getElementsByTagName(tagName), i = 0, n = list.length;
    if (iterator) {
      for (; i < n; i++) {
        iterator(list[i], i);
      }
    }
    return list;
  }
  return [];
}
function getWindowScrollingElement() {
  var scrollingElement = document.scrollingElement;
  if (scrollingElement) {
    return scrollingElement;
  } else {
    return document.documentElement;
  }
}
function getRect(el, relativeToContainingBlock, relativeToNonStaticParent, undoScale, container) {
  if (!el.getBoundingClientRect && el !== window)
    return;
  var elRect, top, left, bottom, right, height, width;
  if (el !== window && el.parentNode && el !== getWindowScrollingElement()) {
    elRect = el.getBoundingClientRect();
    top = elRect.top;
    left = elRect.left;
    bottom = elRect.bottom;
    right = elRect.right;
    height = elRect.height;
    width = elRect.width;
  } else {
    top = 0;
    left = 0;
    bottom = window.innerHeight;
    right = window.innerWidth;
    height = window.innerHeight;
    width = window.innerWidth;
  }
  if ((relativeToContainingBlock || relativeToNonStaticParent) && el !== window) {
    container = container || el.parentNode;
    if (!IE11OrLess) {
      do {
        if (container && container.getBoundingClientRect && (css(container, "transform") !== "none" || relativeToNonStaticParent && css(container, "position") !== "static")) {
          var containerRect = container.getBoundingClientRect();
          top -= containerRect.top + parseInt(css(container, "border-top-width"));
          left -= containerRect.left + parseInt(css(container, "border-left-width"));
          bottom = top + elRect.height;
          right = left + elRect.width;
          break;
        }
      } while (container = container.parentNode);
    }
  }
  if (undoScale && el !== window) {
    var elMatrix = matrix(container || el), scaleX = elMatrix && elMatrix.a, scaleY = elMatrix && elMatrix.d;
    if (elMatrix) {
      top /= scaleY;
      left /= scaleX;
      width /= scaleX;
      height /= scaleY;
      bottom = top + height;
      right = left + width;
    }
  }
  return {
    top,
    left,
    bottom,
    right,
    width,
    height
  };
}
function isScrolledPast(el, elSide, parentSide) {
  var parent = getParentAutoScrollElement(el, true), elSideVal = getRect(el)[elSide];
  while (parent) {
    var parentSideVal = getRect(parent)[parentSide], visible = void 0;
    if (parentSide === "top" || parentSide === "left") {
      visible = elSideVal >= parentSideVal;
    } else {
      visible = elSideVal <= parentSideVal;
    }
    if (!visible)
      return parent;
    if (parent === getWindowScrollingElement())
      break;
    parent = getParentAutoScrollElement(parent, false);
  }
  return false;
}
function getChild(el, childNum, options, includeDragEl) {
  var currentChild = 0, i = 0, children = el.children;
  while (i < children.length) {
    if (children[i].style.display !== "none" && children[i] !== Sortable.ghost && (includeDragEl || children[i] !== Sortable.dragged) && closest(children[i], options.draggable, el, false)) {
      if (currentChild === childNum) {
        return children[i];
      }
      currentChild++;
    }
    i++;
  }
  return null;
}
function lastChild(el, selector) {
  var last = el.lastElementChild;
  while (last && (last === Sortable.ghost || css(last, "display") === "none" || selector && !matches(last, selector))) {
    last = last.previousElementSibling;
  }
  return last || null;
}
function index(el, selector) {
  var index2 = 0;
  if (!el || !el.parentNode) {
    return -1;
  }
  while (el = el.previousElementSibling) {
    if (el.nodeName.toUpperCase() !== "TEMPLATE" && el !== Sortable.clone && (!selector || matches(el, selector))) {
      index2++;
    }
  }
  return index2;
}
function getRelativeScrollOffset(el) {
  var offsetLeft = 0, offsetTop = 0, winScroller = getWindowScrollingElement();
  if (el) {
    do {
      var elMatrix = matrix(el), scaleX = elMatrix.a, scaleY = elMatrix.d;
      offsetLeft += el.scrollLeft * scaleX;
      offsetTop += el.scrollTop * scaleY;
    } while (el !== winScroller && (el = el.parentNode));
  }
  return [offsetLeft, offsetTop];
}
function indexOfObject(arr, obj) {
  for (var i in arr) {
    if (!arr.hasOwnProperty(i))
      continue;
    for (var key in obj) {
      if (obj.hasOwnProperty(key) && obj[key] === arr[i][key])
        return Number(i);
    }
  }
  return -1;
}
function getParentAutoScrollElement(el, includeSelf) {
  if (!el || !el.getBoundingClientRect)
    return getWindowScrollingElement();
  var elem = el;
  var gotSelf = false;
  do {
    if (elem.clientWidth < elem.scrollWidth || elem.clientHeight < elem.scrollHeight) {
      var elemCSS = css(elem);
      if (elem.clientWidth < elem.scrollWidth && (elemCSS.overflowX == "auto" || elemCSS.overflowX == "scroll") || elem.clientHeight < elem.scrollHeight && (elemCSS.overflowY == "auto" || elemCSS.overflowY == "scroll")) {
        if (!elem.getBoundingClientRect || elem === document.body)
          return getWindowScrollingElement();
        if (gotSelf || includeSelf)
          return elem;
        gotSelf = true;
      }
    }
  } while (elem = elem.parentNode);
  return getWindowScrollingElement();
}
function extend(dst, src) {
  if (dst && src) {
    for (var key in src) {
      if (src.hasOwnProperty(key)) {
        dst[key] = src[key];
      }
    }
  }
  return dst;
}
function isRectEqual(rect1, rect2) {
  return Math.round(rect1.top) === Math.round(rect2.top) && Math.round(rect1.left) === Math.round(rect2.left) && Math.round(rect1.height) === Math.round(rect2.height) && Math.round(rect1.width) === Math.round(rect2.width);
}
var _throttleTimeout;
function throttle(callback, ms) {
  return function() {
    if (!_throttleTimeout) {
      var args = arguments, _this = this;
      if (args.length === 1) {
        callback.call(_this, args[0]);
      } else {
        callback.apply(_this, args);
      }
      _throttleTimeout = setTimeout(function() {
        _throttleTimeout = void 0;
      }, ms);
    }
  };
}
function cancelThrottle() {
  clearTimeout(_throttleTimeout);
  _throttleTimeout = void 0;
}
function scrollBy(el, x, y) {
  el.scrollLeft += x;
  el.scrollTop += y;
}
function clone(el) {
  var Polymer = window.Polymer;
  var $ = window.jQuery || window.Zepto;
  if (Polymer && Polymer.dom) {
    return Polymer.dom(el).cloneNode(true);
  } else if ($) {
    return $(el).clone(true)[0];
  } else {
    return el.cloneNode(true);
  }
}
function getChildContainingRectFromElement(container, options, ghostEl2) {
  var rect = {};
  Array.from(container.children).forEach(function(child) {
    var _rect$left, _rect$top, _rect$right, _rect$bottom;
    if (!closest(child, options.draggable, container, false) || child.animated || child === ghostEl2)
      return;
    var childRect = getRect(child);
    rect.left = Math.min((_rect$left = rect.left) !== null && _rect$left !== void 0 ? _rect$left : Infinity, childRect.left);
    rect.top = Math.min((_rect$top = rect.top) !== null && _rect$top !== void 0 ? _rect$top : Infinity, childRect.top);
    rect.right = Math.max((_rect$right = rect.right) !== null && _rect$right !== void 0 ? _rect$right : -Infinity, childRect.right);
    rect.bottom = Math.max((_rect$bottom = rect.bottom) !== null && _rect$bottom !== void 0 ? _rect$bottom : -Infinity, childRect.bottom);
  });
  rect.width = rect.right - rect.left;
  rect.height = rect.bottom - rect.top;
  rect.x = rect.left;
  rect.y = rect.top;
  return rect;
}
var expando = "Sortable" + (/* @__PURE__ */ new Date()).getTime();
function AnimationStateManager() {
  var animationStates = [], animationCallbackId;
  return {
    captureAnimationState: function captureAnimationState() {
      animationStates = [];
      if (!this.options.animation)
        return;
      var children = [].slice.call(this.el.children);
      children.forEach(function(child) {
        if (css(child, "display") === "none" || child === Sortable.ghost)
          return;
        animationStates.push({
          target: child,
          rect: getRect(child)
        });
        var fromRect = _objectSpread2({}, animationStates[animationStates.length - 1].rect);
        if (child.thisAnimationDuration) {
          var childMatrix = matrix(child, true);
          if (childMatrix) {
            fromRect.top -= childMatrix.f;
            fromRect.left -= childMatrix.e;
          }
        }
        child.fromRect = fromRect;
      });
    },
    addAnimationState: function addAnimationState(state) {
      animationStates.push(state);
    },
    removeAnimationState: function removeAnimationState(target) {
      animationStates.splice(indexOfObject(animationStates, {
        target
      }), 1);
    },
    animateAll: function animateAll(callback) {
      var _this = this;
      if (!this.options.animation) {
        clearTimeout(animationCallbackId);
        if (typeof callback === "function")
          callback();
        return;
      }
      var animating = false, animationTime = 0;
      animationStates.forEach(function(state) {
        var time = 0, target = state.target, fromRect = target.fromRect, toRect = getRect(target), prevFromRect = target.prevFromRect, prevToRect = target.prevToRect, animatingRect = state.rect, targetMatrix = matrix(target, true);
        if (targetMatrix) {
          toRect.top -= targetMatrix.f;
          toRect.left -= targetMatrix.e;
        }
        target.toRect = toRect;
        if (target.thisAnimationDuration) {
          if (isRectEqual(prevFromRect, toRect) && !isRectEqual(fromRect, toRect) && // Make sure animatingRect is on line between toRect & fromRect
          (animatingRect.top - toRect.top) / (animatingRect.left - toRect.left) === (fromRect.top - toRect.top) / (fromRect.left - toRect.left)) {
            time = calculateRealTime(animatingRect, prevFromRect, prevToRect, _this.options);
          }
        }
        if (!isRectEqual(toRect, fromRect)) {
          target.prevFromRect = fromRect;
          target.prevToRect = toRect;
          if (!time) {
            time = _this.options.animation;
          }
          _this.animate(target, animatingRect, toRect, time);
        }
        if (time) {
          animating = true;
          animationTime = Math.max(animationTime, time);
          clearTimeout(target.animationResetTimer);
          target.animationResetTimer = setTimeout(function() {
            target.animationTime = 0;
            target.prevFromRect = null;
            target.fromRect = null;
            target.prevToRect = null;
            target.thisAnimationDuration = null;
          }, time);
          target.thisAnimationDuration = time;
        }
      });
      clearTimeout(animationCallbackId);
      if (!animating) {
        if (typeof callback === "function")
          callback();
      } else {
        animationCallbackId = setTimeout(function() {
          if (typeof callback === "function")
            callback();
        }, animationTime);
      }
      animationStates = [];
    },
    animate: function animate(target, currentRect, toRect, duration) {
      if (duration) {
        css(target, "transition", "");
        css(target, "transform", "");
        var elMatrix = matrix(this.el), scaleX = elMatrix && elMatrix.a, scaleY = elMatrix && elMatrix.d, translateX = (currentRect.left - toRect.left) / (scaleX || 1), translateY = (currentRect.top - toRect.top) / (scaleY || 1);
        target.animatingX = !!translateX;
        target.animatingY = !!translateY;
        css(target, "transform", "translate3d(" + translateX + "px," + translateY + "px,0)");
        this.forRepaintDummy = repaint(target);
        css(target, "transition", "transform " + duration + "ms" + (this.options.easing ? " " + this.options.easing : ""));
        css(target, "transform", "translate3d(0,0,0)");
        typeof target.animated === "number" && clearTimeout(target.animated);
        target.animated = setTimeout(function() {
          css(target, "transition", "");
          css(target, "transform", "");
          target.animated = false;
          target.animatingX = false;
          target.animatingY = false;
        }, duration);
      }
    }
  };
}
function repaint(target) {
  return target.offsetWidth;
}
function calculateRealTime(animatingRect, fromRect, toRect, options) {
  return Math.sqrt(Math.pow(fromRect.top - animatingRect.top, 2) + Math.pow(fromRect.left - animatingRect.left, 2)) / Math.sqrt(Math.pow(fromRect.top - toRect.top, 2) + Math.pow(fromRect.left - toRect.left, 2)) * options.animation;
}
var plugins = [];
var defaults = {
  initializeByDefault: true
};
var PluginManager = {
  mount: function mount(plugin) {
    for (var option2 in defaults) {
      if (defaults.hasOwnProperty(option2) && !(option2 in plugin)) {
        plugin[option2] = defaults[option2];
      }
    }
    plugins.forEach(function(p) {
      if (p.pluginName === plugin.pluginName) {
        throw "Sortable: Cannot mount plugin ".concat(plugin.pluginName, " more than once");
      }
    });
    plugins.push(plugin);
  },
  pluginEvent: function pluginEvent(eventName, sortable, evt) {
    var _this = this;
    this.eventCanceled = false;
    evt.cancel = function() {
      _this.eventCanceled = true;
    };
    var eventNameGlobal = eventName + "Global";
    plugins.forEach(function(plugin) {
      if (!sortable[plugin.pluginName])
        return;
      if (sortable[plugin.pluginName][eventNameGlobal]) {
        sortable[plugin.pluginName][eventNameGlobal](_objectSpread2({
          sortable
        }, evt));
      }
      if (sortable.options[plugin.pluginName] && sortable[plugin.pluginName][eventName]) {
        sortable[plugin.pluginName][eventName](_objectSpread2({
          sortable
        }, evt));
      }
    });
  },
  initializePlugins: function initializePlugins(sortable, el, defaults2, options) {
    plugins.forEach(function(plugin) {
      var pluginName = plugin.pluginName;
      if (!sortable.options[pluginName] && !plugin.initializeByDefault)
        return;
      var initialized = new plugin(sortable, el, sortable.options);
      initialized.sortable = sortable;
      initialized.options = sortable.options;
      sortable[pluginName] = initialized;
      _extends(defaults2, initialized.defaults);
    });
    for (var option2 in sortable.options) {
      if (!sortable.options.hasOwnProperty(option2))
        continue;
      var modified = this.modifyOption(sortable, option2, sortable.options[option2]);
      if (typeof modified !== "undefined") {
        sortable.options[option2] = modified;
      }
    }
  },
  getEventProperties: function getEventProperties(name, sortable) {
    var eventProperties = {};
    plugins.forEach(function(plugin) {
      if (typeof plugin.eventProperties !== "function")
        return;
      _extends(eventProperties, plugin.eventProperties.call(sortable[plugin.pluginName], name));
    });
    return eventProperties;
  },
  modifyOption: function modifyOption(sortable, name, value) {
    var modifiedValue;
    plugins.forEach(function(plugin) {
      if (!sortable[plugin.pluginName])
        return;
      if (plugin.optionListeners && typeof plugin.optionListeners[name] === "function") {
        modifiedValue = plugin.optionListeners[name].call(sortable[plugin.pluginName], value);
      }
    });
    return modifiedValue;
  }
};
function dispatchEvent(_ref) {
  var sortable = _ref.sortable, rootEl2 = _ref.rootEl, name = _ref.name, targetEl = _ref.targetEl, cloneEl2 = _ref.cloneEl, toEl = _ref.toEl, fromEl = _ref.fromEl, oldIndex2 = _ref.oldIndex, newIndex2 = _ref.newIndex, oldDraggableIndex2 = _ref.oldDraggableIndex, newDraggableIndex2 = _ref.newDraggableIndex, originalEvent = _ref.originalEvent, putSortable2 = _ref.putSortable, extraEventProperties = _ref.extraEventProperties;
  sortable = sortable || rootEl2 && rootEl2[expando];
  if (!sortable)
    return;
  var evt, options = sortable.options, onName = "on" + name.charAt(0).toUpperCase() + name.substr(1);
  if (window.CustomEvent && !IE11OrLess && !Edge) {
    evt = new CustomEvent(name, {
      bubbles: true,
      cancelable: true
    });
  } else {
    evt = document.createEvent("Event");
    evt.initEvent(name, true, true);
  }
  evt.to = toEl || rootEl2;
  evt.from = fromEl || rootEl2;
  evt.item = targetEl || rootEl2;
  evt.clone = cloneEl2;
  evt.oldIndex = oldIndex2;
  evt.newIndex = newIndex2;
  evt.oldDraggableIndex = oldDraggableIndex2;
  evt.newDraggableIndex = newDraggableIndex2;
  evt.originalEvent = originalEvent;
  evt.pullMode = putSortable2 ? putSortable2.lastPutMode : void 0;
  var allEventProperties = _objectSpread2(_objectSpread2({}, extraEventProperties), PluginManager.getEventProperties(name, sortable));
  for (var option2 in allEventProperties) {
    evt[option2] = allEventProperties[option2];
  }
  if (rootEl2) {
    rootEl2.dispatchEvent(evt);
  }
  if (options[onName]) {
    options[onName].call(sortable, evt);
  }
}
var _excluded = ["evt"];
var pluginEvent2 = function pluginEvent3(eventName, sortable) {
  var _ref = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {}, originalEvent = _ref.evt, data = _objectWithoutProperties(_ref, _excluded);
  PluginManager.pluginEvent.bind(Sortable)(eventName, sortable, _objectSpread2({
    dragEl,
    parentEl,
    ghostEl,
    rootEl,
    nextEl,
    lastDownEl,
    cloneEl,
    cloneHidden,
    dragStarted: moved,
    putSortable,
    activeSortable: Sortable.active,
    originalEvent,
    oldIndex,
    oldDraggableIndex,
    newIndex,
    newDraggableIndex,
    hideGhostForTarget: _hideGhostForTarget,
    unhideGhostForTarget: _unhideGhostForTarget,
    cloneNowHidden: function cloneNowHidden() {
      cloneHidden = true;
    },
    cloneNowShown: function cloneNowShown() {
      cloneHidden = false;
    },
    dispatchSortableEvent: function dispatchSortableEvent(name) {
      _dispatchEvent({
        sortable,
        name,
        originalEvent
      });
    }
  }, data));
};
function _dispatchEvent(info) {
  dispatchEvent(_objectSpread2({
    putSortable,
    cloneEl,
    targetEl: dragEl,
    rootEl,
    oldIndex,
    oldDraggableIndex,
    newIndex,
    newDraggableIndex
  }, info));
}
var dragEl;
var parentEl;
var ghostEl;
var rootEl;
var nextEl;
var lastDownEl;
var cloneEl;
var cloneHidden;
var oldIndex;
var newIndex;
var oldDraggableIndex;
var newDraggableIndex;
var activeGroup;
var putSortable;
var awaitingDragStarted = false;
var ignoreNextClick = false;
var sortables = [];
var tapEvt;
var touchEvt;
var lastDx;
var lastDy;
var tapDistanceLeft;
var tapDistanceTop;
var moved;
var lastTarget;
var lastDirection;
var pastFirstInvertThresh = false;
var isCircumstantialInvert = false;
var targetMoveDistance;
var ghostRelativeParent;
var ghostRelativeParentInitialScroll = [];
var _silent = false;
var savedInputChecked = [];
var documentExists = typeof document !== "undefined";
var PositionGhostAbsolutely = IOS;
var CSSFloatProperty = Edge || IE11OrLess ? "cssFloat" : "float";
var supportDraggable = documentExists && !ChromeForAndroid && !IOS && "draggable" in document.createElement("div");
var supportCssPointerEvents = function() {
  if (!documentExists)
    return;
  if (IE11OrLess) {
    return false;
  }
  var el = document.createElement("x");
  el.style.cssText = "pointer-events:auto";
  return el.style.pointerEvents === "auto";
}();
var _detectDirection = function _detectDirection2(el, options) {
  var elCSS = css(el), elWidth = parseInt(elCSS.width) - parseInt(elCSS.paddingLeft) - parseInt(elCSS.paddingRight) - parseInt(elCSS.borderLeftWidth) - parseInt(elCSS.borderRightWidth), child1 = getChild(el, 0, options), child2 = getChild(el, 1, options), firstChildCSS = child1 && css(child1), secondChildCSS = child2 && css(child2), firstChildWidth = firstChildCSS && parseInt(firstChildCSS.marginLeft) + parseInt(firstChildCSS.marginRight) + getRect(child1).width, secondChildWidth = secondChildCSS && parseInt(secondChildCSS.marginLeft) + parseInt(secondChildCSS.marginRight) + getRect(child2).width;
  if (elCSS.display === "flex") {
    return elCSS.flexDirection === "column" || elCSS.flexDirection === "column-reverse" ? "vertical" : "horizontal";
  }
  if (elCSS.display === "grid") {
    return elCSS.gridTemplateColumns.split(" ").length <= 1 ? "vertical" : "horizontal";
  }
  if (child1 && firstChildCSS["float"] && firstChildCSS["float"] !== "none") {
    var touchingSideChild2 = firstChildCSS["float"] === "left" ? "left" : "right";
    return child2 && (secondChildCSS.clear === "both" || secondChildCSS.clear === touchingSideChild2) ? "vertical" : "horizontal";
  }
  return child1 && (firstChildCSS.display === "block" || firstChildCSS.display === "flex" || firstChildCSS.display === "table" || firstChildCSS.display === "grid" || firstChildWidth >= elWidth && elCSS[CSSFloatProperty] === "none" || child2 && elCSS[CSSFloatProperty] === "none" && firstChildWidth + secondChildWidth > elWidth) ? "vertical" : "horizontal";
};
var _dragElInRowColumn = function _dragElInRowColumn2(dragRect, targetRect, vertical) {
  var dragElS1Opp = vertical ? dragRect.left : dragRect.top, dragElS2Opp = vertical ? dragRect.right : dragRect.bottom, dragElOppLength = vertical ? dragRect.width : dragRect.height, targetS1Opp = vertical ? targetRect.left : targetRect.top, targetS2Opp = vertical ? targetRect.right : targetRect.bottom, targetOppLength = vertical ? targetRect.width : targetRect.height;
  return dragElS1Opp === targetS1Opp || dragElS2Opp === targetS2Opp || dragElS1Opp + dragElOppLength / 2 === targetS1Opp + targetOppLength / 2;
};
var _detectNearestEmptySortable = function _detectNearestEmptySortable2(x, y) {
  var ret;
  sortables.some(function(sortable) {
    var threshold = sortable[expando].options.emptyInsertThreshold;
    if (!threshold || lastChild(sortable))
      return;
    var rect = getRect(sortable), insideHorizontally = x >= rect.left - threshold && x <= rect.right + threshold, insideVertically = y >= rect.top - threshold && y <= rect.bottom + threshold;
    if (insideHorizontally && insideVertically) {
      return ret = sortable;
    }
  });
  return ret;
};
var _prepareGroup = function _prepareGroup2(options) {
  function toFn(value, pull) {
    return function(to, from, dragEl2, evt) {
      var sameGroup = to.options.group.name && from.options.group.name && to.options.group.name === from.options.group.name;
      if (value == null && (pull || sameGroup)) {
        return true;
      } else if (value == null || value === false) {
        return false;
      } else if (pull && value === "clone") {
        return value;
      } else if (typeof value === "function") {
        return toFn(value(to, from, dragEl2, evt), pull)(to, from, dragEl2, evt);
      } else {
        var otherGroup = (pull ? to : from).options.group.name;
        return value === true || typeof value === "string" && value === otherGroup || value.join && value.indexOf(otherGroup) > -1;
      }
    };
  }
  var group = {};
  var originalGroup = options.group;
  if (!originalGroup || _typeof(originalGroup) != "object") {
    originalGroup = {
      name: originalGroup
    };
  }
  group.name = originalGroup.name;
  group.checkPull = toFn(originalGroup.pull, true);
  group.checkPut = toFn(originalGroup.put);
  group.revertClone = originalGroup.revertClone;
  options.group = group;
};
var _hideGhostForTarget = function _hideGhostForTarget2() {
  if (!supportCssPointerEvents && ghostEl) {
    css(ghostEl, "display", "none");
  }
};
var _unhideGhostForTarget = function _unhideGhostForTarget2() {
  if (!supportCssPointerEvents && ghostEl) {
    css(ghostEl, "display", "");
  }
};
if (documentExists && !ChromeForAndroid) {
  document.addEventListener("click", function(evt) {
    if (ignoreNextClick) {
      evt.preventDefault();
      evt.stopPropagation && evt.stopPropagation();
      evt.stopImmediatePropagation && evt.stopImmediatePropagation();
      ignoreNextClick = false;
      return false;
    }
  }, true);
}
var nearestEmptyInsertDetectEvent = function nearestEmptyInsertDetectEvent2(evt) {
  if (dragEl) {
    evt = evt.touches ? evt.touches[0] : evt;
    var nearest = _detectNearestEmptySortable(evt.clientX, evt.clientY);
    if (nearest) {
      var event = {};
      for (var i in evt) {
        if (evt.hasOwnProperty(i)) {
          event[i] = evt[i];
        }
      }
      event.target = event.rootEl = nearest;
      event.preventDefault = void 0;
      event.stopPropagation = void 0;
      nearest[expando]._onDragOver(event);
    }
  }
};
var _checkOutsideTargetEl = function _checkOutsideTargetEl2(evt) {
  if (dragEl) {
    dragEl.parentNode[expando]._isOutsideThisEl(evt.target);
  }
};
function Sortable(el, options) {
  if (!(el && el.nodeType && el.nodeType === 1)) {
    throw "Sortable: `el` must be an HTMLElement, not ".concat({}.toString.call(el));
  }
  this.el = el;
  this.options = options = _extends({}, options);
  el[expando] = this;
  var defaults2 = {
    group: null,
    sort: true,
    disabled: false,
    store: null,
    handle: null,
    draggable: /^[uo]l$/i.test(el.nodeName) ? ">li" : ">*",
    swapThreshold: 1,
    // percentage; 0 <= x <= 1
    invertSwap: false,
    // invert always
    invertedSwapThreshold: null,
    // will be set to same as swapThreshold if default
    removeCloneOnHide: true,
    direction: function direction() {
      return _detectDirection(el, this.options);
    },
    ghostClass: "sortable-ghost",
    chosenClass: "sortable-chosen",
    dragClass: "sortable-drag",
    ignore: "a, img",
    filter: null,
    preventOnFilter: true,
    animation: 0,
    easing: null,
    setData: function setData(dataTransfer, dragEl2) {
      dataTransfer.setData("Text", dragEl2.textContent);
    },
    dropBubble: false,
    dragoverBubble: false,
    dataIdAttr: "data-id",
    delay: 0,
    delayOnTouchOnly: false,
    touchStartThreshold: (Number.parseInt ? Number : window).parseInt(window.devicePixelRatio, 10) || 1,
    forceFallback: false,
    fallbackClass: "sortable-fallback",
    fallbackOnBody: false,
    fallbackTolerance: 0,
    fallbackOffset: {
      x: 0,
      y: 0
    },
    // Disabled on Safari: #1571; Enabled on Safari IOS: #2244
    supportPointer: Sortable.supportPointer !== false && "PointerEvent" in window && (!Safari || IOS),
    emptyInsertThreshold: 5
  };
  PluginManager.initializePlugins(this, el, defaults2);
  for (var name in defaults2) {
    !(name in options) && (options[name] = defaults2[name]);
  }
  _prepareGroup(options);
  for (var fn in this) {
    if (fn.charAt(0) === "_" && typeof this[fn] === "function") {
      this[fn] = this[fn].bind(this);
    }
  }
  this.nativeDraggable = options.forceFallback ? false : supportDraggable;
  if (this.nativeDraggable) {
    this.options.touchStartThreshold = 1;
  }
  if (options.supportPointer) {
    on(el, "pointerdown", this._onTapStart);
  } else {
    on(el, "mousedown", this._onTapStart);
    on(el, "touchstart", this._onTapStart);
  }
  if (this.nativeDraggable) {
    on(el, "dragover", this);
    on(el, "dragenter", this);
  }
  sortables.push(this.el);
  options.store && options.store.get && this.sort(options.store.get(this) || []);
  _extends(this, AnimationStateManager());
}
Sortable.prototype = /** @lends Sortable.prototype */
{
  constructor: Sortable,
  _isOutsideThisEl: function _isOutsideThisEl(target) {
    if (!this.el.contains(target) && target !== this.el) {
      lastTarget = null;
    }
  },
  _getDirection: function _getDirection(evt, target) {
    return typeof this.options.direction === "function" ? this.options.direction.call(this, evt, target, dragEl) : this.options.direction;
  },
  _onTapStart: function _onTapStart(evt) {
    if (!evt.cancelable)
      return;
    var _this = this, el = this.el, options = this.options, preventOnFilter = options.preventOnFilter, type = evt.type, touch = evt.touches && evt.touches[0] || evt.pointerType && evt.pointerType === "touch" && evt, target = (touch || evt).target, originalTarget = evt.target.shadowRoot && (evt.path && evt.path[0] || evt.composedPath && evt.composedPath()[0]) || target, filter = options.filter;
    _saveInputCheckedState(el);
    if (dragEl) {
      return;
    }
    if (/mousedown|pointerdown/.test(type) && evt.button !== 0 || options.disabled) {
      return;
    }
    if (originalTarget.isContentEditable) {
      return;
    }
    if (!this.nativeDraggable && Safari && target && target.tagName.toUpperCase() === "SELECT") {
      return;
    }
    target = closest(target, options.draggable, el, false);
    if (target && target.animated) {
      return;
    }
    if (lastDownEl === target) {
      return;
    }
    oldIndex = index(target);
    oldDraggableIndex = index(target, options.draggable);
    if (typeof filter === "function") {
      if (filter.call(this, evt, target, this)) {
        _dispatchEvent({
          sortable: _this,
          rootEl: originalTarget,
          name: "filter",
          targetEl: target,
          toEl: el,
          fromEl: el
        });
        pluginEvent2("filter", _this, {
          evt
        });
        preventOnFilter && evt.preventDefault();
        return;
      }
    } else if (filter) {
      filter = filter.split(",").some(function(criteria) {
        criteria = closest(originalTarget, criteria.trim(), el, false);
        if (criteria) {
          _dispatchEvent({
            sortable: _this,
            rootEl: criteria,
            name: "filter",
            targetEl: target,
            fromEl: el,
            toEl: el
          });
          pluginEvent2("filter", _this, {
            evt
          });
          return true;
        }
      });
      if (filter) {
        preventOnFilter && evt.preventDefault();
        return;
      }
    }
    if (options.handle && !closest(originalTarget, options.handle, el, false)) {
      return;
    }
    this._prepareDragStart(evt, touch, target);
  },
  _prepareDragStart: function _prepareDragStart(evt, touch, target) {
    var _this = this, el = _this.el, options = _this.options, ownerDocument = el.ownerDocument, dragStartFn;
    if (target && !dragEl && target.parentNode === el) {
      var dragRect = getRect(target);
      rootEl = el;
      dragEl = target;
      parentEl = dragEl.parentNode;
      nextEl = dragEl.nextSibling;
      lastDownEl = target;
      activeGroup = options.group;
      Sortable.dragged = dragEl;
      tapEvt = {
        target: dragEl,
        clientX: (touch || evt).clientX,
        clientY: (touch || evt).clientY
      };
      tapDistanceLeft = tapEvt.clientX - dragRect.left;
      tapDistanceTop = tapEvt.clientY - dragRect.top;
      this._lastX = (touch || evt).clientX;
      this._lastY = (touch || evt).clientY;
      dragEl.style["will-change"] = "all";
      dragStartFn = function dragStartFn2() {
        pluginEvent2("delayEnded", _this, {
          evt
        });
        if (Sortable.eventCanceled) {
          _this._onDrop();
          return;
        }
        _this._disableDelayedDragEvents();
        if (!FireFox && _this.nativeDraggable) {
          dragEl.draggable = true;
        }
        _this._triggerDragStart(evt, touch);
        _dispatchEvent({
          sortable: _this,
          name: "choose",
          originalEvent: evt
        });
        toggleClass(dragEl, options.chosenClass, true);
      };
      options.ignore.split(",").forEach(function(criteria) {
        find(dragEl, criteria.trim(), _disableDraggable);
      });
      on(ownerDocument, "dragover", nearestEmptyInsertDetectEvent);
      on(ownerDocument, "mousemove", nearestEmptyInsertDetectEvent);
      on(ownerDocument, "touchmove", nearestEmptyInsertDetectEvent);
      if (options.supportPointer) {
        on(ownerDocument, "pointerup", _this._onDrop);
        !this.nativeDraggable && on(ownerDocument, "pointercancel", _this._onDrop);
      } else {
        on(ownerDocument, "mouseup", _this._onDrop);
        on(ownerDocument, "touchend", _this._onDrop);
        on(ownerDocument, "touchcancel", _this._onDrop);
      }
      if (FireFox && this.nativeDraggable) {
        this.options.touchStartThreshold = 4;
        dragEl.draggable = true;
      }
      pluginEvent2("delayStart", this, {
        evt
      });
      if (options.delay && (!options.delayOnTouchOnly || touch) && (!this.nativeDraggable || !(Edge || IE11OrLess))) {
        if (Sortable.eventCanceled) {
          this._onDrop();
          return;
        }
        if (options.supportPointer) {
          on(ownerDocument, "pointerup", _this._disableDelayedDrag);
          on(ownerDocument, "pointercancel", _this._disableDelayedDrag);
        } else {
          on(ownerDocument, "mouseup", _this._disableDelayedDrag);
          on(ownerDocument, "touchend", _this._disableDelayedDrag);
          on(ownerDocument, "touchcancel", _this._disableDelayedDrag);
        }
        on(ownerDocument, "mousemove", _this._delayedDragTouchMoveHandler);
        on(ownerDocument, "touchmove", _this._delayedDragTouchMoveHandler);
        options.supportPointer && on(ownerDocument, "pointermove", _this._delayedDragTouchMoveHandler);
        _this._dragStartTimer = setTimeout(dragStartFn, options.delay);
      } else {
        dragStartFn();
      }
    }
  },
  _delayedDragTouchMoveHandler: function _delayedDragTouchMoveHandler(e) {
    var touch = e.touches ? e.touches[0] : e;
    if (Math.max(Math.abs(touch.clientX - this._lastX), Math.abs(touch.clientY - this._lastY)) >= Math.floor(this.options.touchStartThreshold / (this.nativeDraggable && window.devicePixelRatio || 1))) {
      this._disableDelayedDrag();
    }
  },
  _disableDelayedDrag: function _disableDelayedDrag() {
    dragEl && _disableDraggable(dragEl);
    clearTimeout(this._dragStartTimer);
    this._disableDelayedDragEvents();
  },
  _disableDelayedDragEvents: function _disableDelayedDragEvents() {
    var ownerDocument = this.el.ownerDocument;
    off(ownerDocument, "mouseup", this._disableDelayedDrag);
    off(ownerDocument, "touchend", this._disableDelayedDrag);
    off(ownerDocument, "touchcancel", this._disableDelayedDrag);
    off(ownerDocument, "pointerup", this._disableDelayedDrag);
    off(ownerDocument, "pointercancel", this._disableDelayedDrag);
    off(ownerDocument, "mousemove", this._delayedDragTouchMoveHandler);
    off(ownerDocument, "touchmove", this._delayedDragTouchMoveHandler);
    off(ownerDocument, "pointermove", this._delayedDragTouchMoveHandler);
  },
  _triggerDragStart: function _triggerDragStart(evt, touch) {
    touch = touch || evt.pointerType == "touch" && evt;
    if (!this.nativeDraggable || touch) {
      if (this.options.supportPointer) {
        on(document, "pointermove", this._onTouchMove);
      } else if (touch) {
        on(document, "touchmove", this._onTouchMove);
      } else {
        on(document, "mousemove", this._onTouchMove);
      }
    } else {
      on(dragEl, "dragend", this);
      on(rootEl, "dragstart", this._onDragStart);
    }
    try {
      if (document.selection) {
        _nextTick(function() {
          document.selection.empty();
        });
      } else {
        window.getSelection().removeAllRanges();
      }
    } catch (err) {
    }
  },
  _dragStarted: function _dragStarted(fallback, evt) {
    awaitingDragStarted = false;
    if (rootEl && dragEl) {
      pluginEvent2("dragStarted", this, {
        evt
      });
      if (this.nativeDraggable) {
        on(document, "dragover", _checkOutsideTargetEl);
      }
      var options = this.options;
      !fallback && toggleClass(dragEl, options.dragClass, false);
      toggleClass(dragEl, options.ghostClass, true);
      Sortable.active = this;
      fallback && this._appendGhost();
      _dispatchEvent({
        sortable: this,
        name: "start",
        originalEvent: evt
      });
    } else {
      this._nulling();
    }
  },
  _emulateDragOver: function _emulateDragOver() {
    if (touchEvt) {
      this._lastX = touchEvt.clientX;
      this._lastY = touchEvt.clientY;
      _hideGhostForTarget();
      var target = document.elementFromPoint(touchEvt.clientX, touchEvt.clientY);
      var parent = target;
      while (target && target.shadowRoot) {
        target = target.shadowRoot.elementFromPoint(touchEvt.clientX, touchEvt.clientY);
        if (target === parent)
          break;
        parent = target;
      }
      dragEl.parentNode[expando]._isOutsideThisEl(target);
      if (parent) {
        do {
          if (parent[expando]) {
            var inserted = void 0;
            inserted = parent[expando]._onDragOver({
              clientX: touchEvt.clientX,
              clientY: touchEvt.clientY,
              target,
              rootEl: parent
            });
            if (inserted && !this.options.dragoverBubble) {
              break;
            }
          }
          target = parent;
        } while (parent = getParentOrHost(parent));
      }
      _unhideGhostForTarget();
    }
  },
  _onTouchMove: function _onTouchMove(evt) {
    if (tapEvt) {
      var options = this.options, fallbackTolerance = options.fallbackTolerance, fallbackOffset = options.fallbackOffset, touch = evt.touches ? evt.touches[0] : evt, ghostMatrix = ghostEl && matrix(ghostEl, true), scaleX = ghostEl && ghostMatrix && ghostMatrix.a, scaleY = ghostEl && ghostMatrix && ghostMatrix.d, relativeScrollOffset = PositionGhostAbsolutely && ghostRelativeParent && getRelativeScrollOffset(ghostRelativeParent), dx = (touch.clientX - tapEvt.clientX + fallbackOffset.x) / (scaleX || 1) + (relativeScrollOffset ? relativeScrollOffset[0] - ghostRelativeParentInitialScroll[0] : 0) / (scaleX || 1), dy = (touch.clientY - tapEvt.clientY + fallbackOffset.y) / (scaleY || 1) + (relativeScrollOffset ? relativeScrollOffset[1] - ghostRelativeParentInitialScroll[1] : 0) / (scaleY || 1);
      if (!Sortable.active && !awaitingDragStarted) {
        if (fallbackTolerance && Math.max(Math.abs(touch.clientX - this._lastX), Math.abs(touch.clientY - this._lastY)) < fallbackTolerance) {
          return;
        }
        this._onDragStart(evt, true);
      }
      if (ghostEl) {
        if (ghostMatrix) {
          ghostMatrix.e += dx - (lastDx || 0);
          ghostMatrix.f += dy - (lastDy || 0);
        } else {
          ghostMatrix = {
            a: 1,
            b: 0,
            c: 0,
            d: 1,
            e: dx,
            f: dy
          };
        }
        var cssMatrix = "matrix(".concat(ghostMatrix.a, ",").concat(ghostMatrix.b, ",").concat(ghostMatrix.c, ",").concat(ghostMatrix.d, ",").concat(ghostMatrix.e, ",").concat(ghostMatrix.f, ")");
        css(ghostEl, "webkitTransform", cssMatrix);
        css(ghostEl, "mozTransform", cssMatrix);
        css(ghostEl, "msTransform", cssMatrix);
        css(ghostEl, "transform", cssMatrix);
        lastDx = dx;
        lastDy = dy;
        touchEvt = touch;
      }
      evt.cancelable && evt.preventDefault();
    }
  },
  _appendGhost: function _appendGhost() {
    if (!ghostEl) {
      var container = this.options.fallbackOnBody ? document.body : rootEl, rect = getRect(dragEl, true, PositionGhostAbsolutely, true, container), options = this.options;
      if (PositionGhostAbsolutely) {
        ghostRelativeParent = container;
        while (css(ghostRelativeParent, "position") === "static" && css(ghostRelativeParent, "transform") === "none" && ghostRelativeParent !== document) {
          ghostRelativeParent = ghostRelativeParent.parentNode;
        }
        if (ghostRelativeParent !== document.body && ghostRelativeParent !== document.documentElement) {
          if (ghostRelativeParent === document)
            ghostRelativeParent = getWindowScrollingElement();
          rect.top += ghostRelativeParent.scrollTop;
          rect.left += ghostRelativeParent.scrollLeft;
        } else {
          ghostRelativeParent = getWindowScrollingElement();
        }
        ghostRelativeParentInitialScroll = getRelativeScrollOffset(ghostRelativeParent);
      }
      ghostEl = dragEl.cloneNode(true);
      toggleClass(ghostEl, options.ghostClass, false);
      toggleClass(ghostEl, options.fallbackClass, true);
      toggleClass(ghostEl, options.dragClass, true);
      css(ghostEl, "transition", "");
      css(ghostEl, "transform", "");
      css(ghostEl, "box-sizing", "border-box");
      css(ghostEl, "margin", 0);
      css(ghostEl, "top", rect.top);
      css(ghostEl, "left", rect.left);
      css(ghostEl, "width", rect.width);
      css(ghostEl, "height", rect.height);
      css(ghostEl, "opacity", "0.8");
      css(ghostEl, "position", PositionGhostAbsolutely ? "absolute" : "fixed");
      css(ghostEl, "zIndex", "100000");
      css(ghostEl, "pointerEvents", "none");
      Sortable.ghost = ghostEl;
      container.appendChild(ghostEl);
      css(ghostEl, "transform-origin", tapDistanceLeft / parseInt(ghostEl.style.width) * 100 + "% " + tapDistanceTop / parseInt(ghostEl.style.height) * 100 + "%");
    }
  },
  _onDragStart: function _onDragStart(evt, fallback) {
    var _this = this;
    var dataTransfer = evt.dataTransfer;
    var options = _this.options;
    pluginEvent2("dragStart", this, {
      evt
    });
    if (Sortable.eventCanceled) {
      this._onDrop();
      return;
    }
    pluginEvent2("setupClone", this);
    if (!Sortable.eventCanceled) {
      cloneEl = clone(dragEl);
      cloneEl.removeAttribute("id");
      cloneEl.draggable = false;
      cloneEl.style["will-change"] = "";
      this._hideClone();
      toggleClass(cloneEl, this.options.chosenClass, false);
      Sortable.clone = cloneEl;
    }
    _this.cloneId = _nextTick(function() {
      pluginEvent2("clone", _this);
      if (Sortable.eventCanceled)
        return;
      if (!_this.options.removeCloneOnHide) {
        rootEl.insertBefore(cloneEl, dragEl);
      }
      _this._hideClone();
      _dispatchEvent({
        sortable: _this,
        name: "clone"
      });
    });
    !fallback && toggleClass(dragEl, options.dragClass, true);
    if (fallback) {
      ignoreNextClick = true;
      _this._loopId = setInterval(_this._emulateDragOver, 50);
    } else {
      off(document, "mouseup", _this._onDrop);
      off(document, "touchend", _this._onDrop);
      off(document, "touchcancel", _this._onDrop);
      if (dataTransfer) {
        dataTransfer.effectAllowed = "move";
        options.setData && options.setData.call(_this, dataTransfer, dragEl);
      }
      on(document, "drop", _this);
      css(dragEl, "transform", "translateZ(0)");
    }
    awaitingDragStarted = true;
    _this._dragStartId = _nextTick(_this._dragStarted.bind(_this, fallback, evt));
    on(document, "selectstart", _this);
    moved = true;
    window.getSelection().removeAllRanges();
    if (Safari) {
      css(document.body, "user-select", "none");
    }
  },
  // Returns true - if no further action is needed (either inserted or another condition)
  _onDragOver: function _onDragOver(evt) {
    var el = this.el, target = evt.target, dragRect, targetRect, revert, options = this.options, group = options.group, activeSortable = Sortable.active, isOwner = activeGroup === group, canSort = options.sort, fromSortable = putSortable || activeSortable, vertical, _this = this, completedFired = false;
    if (_silent)
      return;
    function dragOverEvent(name, extra) {
      pluginEvent2(name, _this, _objectSpread2({
        evt,
        isOwner,
        axis: vertical ? "vertical" : "horizontal",
        revert,
        dragRect,
        targetRect,
        canSort,
        fromSortable,
        target,
        completed,
        onMove: function onMove(target2, after2) {
          return _onMove(rootEl, el, dragEl, dragRect, target2, getRect(target2), evt, after2);
        },
        changed
      }, extra));
    }
    function capture() {
      dragOverEvent("dragOverAnimationCapture");
      _this.captureAnimationState();
      if (_this !== fromSortable) {
        fromSortable.captureAnimationState();
      }
    }
    function completed(insertion) {
      dragOverEvent("dragOverCompleted", {
        insertion
      });
      if (insertion) {
        if (isOwner) {
          activeSortable._hideClone();
        } else {
          activeSortable._showClone(_this);
        }
        if (_this !== fromSortable) {
          toggleClass(dragEl, putSortable ? putSortable.options.ghostClass : activeSortable.options.ghostClass, false);
          toggleClass(dragEl, options.ghostClass, true);
        }
        if (putSortable !== _this && _this !== Sortable.active) {
          putSortable = _this;
        } else if (_this === Sortable.active && putSortable) {
          putSortable = null;
        }
        if (fromSortable === _this) {
          _this._ignoreWhileAnimating = target;
        }
        _this.animateAll(function() {
          dragOverEvent("dragOverAnimationComplete");
          _this._ignoreWhileAnimating = null;
        });
        if (_this !== fromSortable) {
          fromSortable.animateAll();
          fromSortable._ignoreWhileAnimating = null;
        }
      }
      if (target === dragEl && !dragEl.animated || target === el && !target.animated) {
        lastTarget = null;
      }
      if (!options.dragoverBubble && !evt.rootEl && target !== document) {
        dragEl.parentNode[expando]._isOutsideThisEl(evt.target);
        !insertion && nearestEmptyInsertDetectEvent(evt);
      }
      !options.dragoverBubble && evt.stopPropagation && evt.stopPropagation();
      return completedFired = true;
    }
    function changed() {
      newIndex = index(dragEl);
      newDraggableIndex = index(dragEl, options.draggable);
      _dispatchEvent({
        sortable: _this,
        name: "change",
        toEl: el,
        newIndex,
        newDraggableIndex,
        originalEvent: evt
      });
    }
    if (evt.preventDefault !== void 0) {
      evt.cancelable && evt.preventDefault();
    }
    target = closest(target, options.draggable, el, true);
    dragOverEvent("dragOver");
    if (Sortable.eventCanceled)
      return completedFired;
    if (dragEl.contains(evt.target) || target.animated && target.animatingX && target.animatingY || _this._ignoreWhileAnimating === target) {
      return completed(false);
    }
    ignoreNextClick = false;
    if (activeSortable && !options.disabled && (isOwner ? canSort || (revert = parentEl !== rootEl) : putSortable === this || (this.lastPutMode = activeGroup.checkPull(this, activeSortable, dragEl, evt)) && group.checkPut(this, activeSortable, dragEl, evt))) {
      vertical = this._getDirection(evt, target) === "vertical";
      dragRect = getRect(dragEl);
      dragOverEvent("dragOverValid");
      if (Sortable.eventCanceled)
        return completedFired;
      if (revert) {
        parentEl = rootEl;
        capture();
        this._hideClone();
        dragOverEvent("revert");
        if (!Sortable.eventCanceled) {
          if (nextEl) {
            rootEl.insertBefore(dragEl, nextEl);
          } else {
            rootEl.appendChild(dragEl);
          }
        }
        return completed(true);
      }
      var elLastChild = lastChild(el, options.draggable);
      if (!elLastChild || _ghostIsLast(evt, vertical, this) && !elLastChild.animated) {
        if (elLastChild === dragEl) {
          return completed(false);
        }
        if (elLastChild && el === evt.target) {
          target = elLastChild;
        }
        if (target) {
          targetRect = getRect(target);
        }
        if (_onMove(rootEl, el, dragEl, dragRect, target, targetRect, evt, !!target) !== false) {
          capture();
          if (elLastChild && elLastChild.nextSibling) {
            el.insertBefore(dragEl, elLastChild.nextSibling);
          } else {
            el.appendChild(dragEl);
          }
          parentEl = el;
          changed();
          return completed(true);
        }
      } else if (elLastChild && _ghostIsFirst(evt, vertical, this)) {
        var firstChild = getChild(el, 0, options, true);
        if (firstChild === dragEl) {
          return completed(false);
        }
        target = firstChild;
        targetRect = getRect(target);
        if (_onMove(rootEl, el, dragEl, dragRect, target, targetRect, evt, false) !== false) {
          capture();
          el.insertBefore(dragEl, firstChild);
          parentEl = el;
          changed();
          return completed(true);
        }
      } else if (target.parentNode === el) {
        targetRect = getRect(target);
        var direction = 0, targetBeforeFirstSwap, differentLevel = dragEl.parentNode !== el, differentRowCol = !_dragElInRowColumn(dragEl.animated && dragEl.toRect || dragRect, target.animated && target.toRect || targetRect, vertical), side1 = vertical ? "top" : "left", scrolledPastTop = isScrolledPast(target, "top", "top") || isScrolledPast(dragEl, "top", "top"), scrollBefore = scrolledPastTop ? scrolledPastTop.scrollTop : void 0;
        if (lastTarget !== target) {
          targetBeforeFirstSwap = targetRect[side1];
          pastFirstInvertThresh = false;
          isCircumstantialInvert = !differentRowCol && options.invertSwap || differentLevel;
        }
        direction = _getSwapDirection(evt, target, targetRect, vertical, differentRowCol ? 1 : options.swapThreshold, options.invertedSwapThreshold == null ? options.swapThreshold : options.invertedSwapThreshold, isCircumstantialInvert, lastTarget === target);
        var sibling;
        if (direction !== 0) {
          var dragIndex = index(dragEl);
          do {
            dragIndex -= direction;
            sibling = parentEl.children[dragIndex];
          } while (sibling && (css(sibling, "display") === "none" || sibling === ghostEl));
        }
        if (direction === 0 || sibling === target) {
          return completed(false);
        }
        lastTarget = target;
        lastDirection = direction;
        var nextSibling = target.nextElementSibling, after = false;
        after = direction === 1;
        var moveVector = _onMove(rootEl, el, dragEl, dragRect, target, targetRect, evt, after);
        if (moveVector !== false) {
          if (moveVector === 1 || moveVector === -1) {
            after = moveVector === 1;
          }
          _silent = true;
          setTimeout(_unsilent, 30);
          capture();
          if (after && !nextSibling) {
            el.appendChild(dragEl);
          } else {
            target.parentNode.insertBefore(dragEl, after ? nextSibling : target);
          }
          if (scrolledPastTop) {
            scrollBy(scrolledPastTop, 0, scrollBefore - scrolledPastTop.scrollTop);
          }
          parentEl = dragEl.parentNode;
          if (targetBeforeFirstSwap !== void 0 && !isCircumstantialInvert) {
            targetMoveDistance = Math.abs(targetBeforeFirstSwap - getRect(target)[side1]);
          }
          changed();
          return completed(true);
        }
      }
      if (el.contains(dragEl)) {
        return completed(false);
      }
    }
    return false;
  },
  _ignoreWhileAnimating: null,
  _offMoveEvents: function _offMoveEvents() {
    off(document, "mousemove", this._onTouchMove);
    off(document, "touchmove", this._onTouchMove);
    off(document, "pointermove", this._onTouchMove);
    off(document, "dragover", nearestEmptyInsertDetectEvent);
    off(document, "mousemove", nearestEmptyInsertDetectEvent);
    off(document, "touchmove", nearestEmptyInsertDetectEvent);
  },
  _offUpEvents: function _offUpEvents() {
    var ownerDocument = this.el.ownerDocument;
    off(ownerDocument, "mouseup", this._onDrop);
    off(ownerDocument, "touchend", this._onDrop);
    off(ownerDocument, "pointerup", this._onDrop);
    off(ownerDocument, "pointercancel", this._onDrop);
    off(ownerDocument, "touchcancel", this._onDrop);
    off(document, "selectstart", this);
  },
  _onDrop: function _onDrop(evt) {
    var el = this.el, options = this.options;
    newIndex = index(dragEl);
    newDraggableIndex = index(dragEl, options.draggable);
    pluginEvent2("drop", this, {
      evt
    });
    parentEl = dragEl && dragEl.parentNode;
    newIndex = index(dragEl);
    newDraggableIndex = index(dragEl, options.draggable);
    if (Sortable.eventCanceled) {
      this._nulling();
      return;
    }
    awaitingDragStarted = false;
    isCircumstantialInvert = false;
    pastFirstInvertThresh = false;
    clearInterval(this._loopId);
    clearTimeout(this._dragStartTimer);
    _cancelNextTick(this.cloneId);
    _cancelNextTick(this._dragStartId);
    if (this.nativeDraggable) {
      off(document, "drop", this);
      off(el, "dragstart", this._onDragStart);
    }
    this._offMoveEvents();
    this._offUpEvents();
    if (Safari) {
      css(document.body, "user-select", "");
    }
    css(dragEl, "transform", "");
    if (evt) {
      if (moved) {
        evt.cancelable && evt.preventDefault();
        !options.dropBubble && evt.stopPropagation();
      }
      ghostEl && ghostEl.parentNode && ghostEl.parentNode.removeChild(ghostEl);
      if (rootEl === parentEl || putSortable && putSortable.lastPutMode !== "clone") {
        cloneEl && cloneEl.parentNode && cloneEl.parentNode.removeChild(cloneEl);
      }
      if (dragEl) {
        if (this.nativeDraggable) {
          off(dragEl, "dragend", this);
        }
        _disableDraggable(dragEl);
        dragEl.style["will-change"] = "";
        if (moved && !awaitingDragStarted) {
          toggleClass(dragEl, putSortable ? putSortable.options.ghostClass : this.options.ghostClass, false);
        }
        toggleClass(dragEl, this.options.chosenClass, false);
        _dispatchEvent({
          sortable: this,
          name: "unchoose",
          toEl: parentEl,
          newIndex: null,
          newDraggableIndex: null,
          originalEvent: evt
        });
        if (rootEl !== parentEl) {
          if (newIndex >= 0) {
            _dispatchEvent({
              rootEl: parentEl,
              name: "add",
              toEl: parentEl,
              fromEl: rootEl,
              originalEvent: evt
            });
            _dispatchEvent({
              sortable: this,
              name: "remove",
              toEl: parentEl,
              originalEvent: evt
            });
            _dispatchEvent({
              rootEl: parentEl,
              name: "sort",
              toEl: parentEl,
              fromEl: rootEl,
              originalEvent: evt
            });
            _dispatchEvent({
              sortable: this,
              name: "sort",
              toEl: parentEl,
              originalEvent: evt
            });
          }
          putSortable && putSortable.save();
        } else {
          if (newIndex !== oldIndex) {
            if (newIndex >= 0) {
              _dispatchEvent({
                sortable: this,
                name: "update",
                toEl: parentEl,
                originalEvent: evt
              });
              _dispatchEvent({
                sortable: this,
                name: "sort",
                toEl: parentEl,
                originalEvent: evt
              });
            }
          }
        }
        if (Sortable.active) {
          if (newIndex == null || newIndex === -1) {
            newIndex = oldIndex;
            newDraggableIndex = oldDraggableIndex;
          }
          _dispatchEvent({
            sortable: this,
            name: "end",
            toEl: parentEl,
            originalEvent: evt
          });
          this.save();
        }
      }
    }
    this._nulling();
  },
  _nulling: function _nulling() {
    pluginEvent2("nulling", this);
    rootEl = dragEl = parentEl = ghostEl = nextEl = cloneEl = lastDownEl = cloneHidden = tapEvt = touchEvt = moved = newIndex = newDraggableIndex = oldIndex = oldDraggableIndex = lastTarget = lastDirection = putSortable = activeGroup = Sortable.dragged = Sortable.ghost = Sortable.clone = Sortable.active = null;
    savedInputChecked.forEach(function(el) {
      el.checked = true;
    });
    savedInputChecked.length = lastDx = lastDy = 0;
  },
  handleEvent: function handleEvent(evt) {
    switch (evt.type) {
      case "drop":
      case "dragend":
        this._onDrop(evt);
        break;
      case "dragenter":
      case "dragover":
        if (dragEl) {
          this._onDragOver(evt);
          _globalDragOver(evt);
        }
        break;
      case "selectstart":
        evt.preventDefault();
        break;
    }
  },
  /**
   * Serializes the item into an array of string.
   * @returns {String[]}
   */
  toArray: function toArray() {
    var order = [], el, children = this.el.children, i = 0, n = children.length, options = this.options;
    for (; i < n; i++) {
      el = children[i];
      if (closest(el, options.draggable, this.el, false)) {
        order.push(el.getAttribute(options.dataIdAttr) || _generateId(el));
      }
    }
    return order;
  },
  /**
   * Sorts the elements according to the array.
   * @param  {String[]}  order  order of the items
   */
  sort: function sort(order, useAnimation) {
    var items = {}, rootEl2 = this.el;
    this.toArray().forEach(function(id, i) {
      var el = rootEl2.children[i];
      if (closest(el, this.options.draggable, rootEl2, false)) {
        items[id] = el;
      }
    }, this);
    useAnimation && this.captureAnimationState();
    order.forEach(function(id) {
      if (items[id]) {
        rootEl2.removeChild(items[id]);
        rootEl2.appendChild(items[id]);
      }
    });
    useAnimation && this.animateAll();
  },
  /**
   * Save the current sorting
   */
  save: function save() {
    var store = this.options.store;
    store && store.set && store.set(this);
  },
  /**
   * For each element in the set, get the first element that matches the selector by testing the element itself and traversing up through its ancestors in the DOM tree.
   * @param   {HTMLElement}  el
   * @param   {String}       [selector]  default: `options.draggable`
   * @returns {HTMLElement|null}
   */
  closest: function closest$1(el, selector) {
    return closest(el, selector || this.options.draggable, this.el, false);
  },
  /**
   * Set/get option
   * @param   {string} name
   * @param   {*}      [value]
   * @returns {*}
   */
  option: function option(name, value) {
    var options = this.options;
    if (value === void 0) {
      return options[name];
    } else {
      var modifiedValue = PluginManager.modifyOption(this, name, value);
      if (typeof modifiedValue !== "undefined") {
        options[name] = modifiedValue;
      } else {
        options[name] = value;
      }
      if (name === "group") {
        _prepareGroup(options);
      }
    }
  },
  /**
   * Destroy
   */
  destroy: function destroy() {
    pluginEvent2("destroy", this);
    var el = this.el;
    el[expando] = null;
    off(el, "mousedown", this._onTapStart);
    off(el, "touchstart", this._onTapStart);
    off(el, "pointerdown", this._onTapStart);
    if (this.nativeDraggable) {
      off(el, "dragover", this);
      off(el, "dragenter", this);
    }
    Array.prototype.forEach.call(el.querySelectorAll("[draggable]"), function(el2) {
      el2.removeAttribute("draggable");
    });
    this._onDrop();
    this._disableDelayedDragEvents();
    sortables.splice(sortables.indexOf(this.el), 1);
    this.el = el = null;
  },
  _hideClone: function _hideClone() {
    if (!cloneHidden) {
      pluginEvent2("hideClone", this);
      if (Sortable.eventCanceled)
        return;
      css(cloneEl, "display", "none");
      if (this.options.removeCloneOnHide && cloneEl.parentNode) {
        cloneEl.parentNode.removeChild(cloneEl);
      }
      cloneHidden = true;
    }
  },
  _showClone: function _showClone(putSortable2) {
    if (putSortable2.lastPutMode !== "clone") {
      this._hideClone();
      return;
    }
    if (cloneHidden) {
      pluginEvent2("showClone", this);
      if (Sortable.eventCanceled)
        return;
      if (dragEl.parentNode == rootEl && !this.options.group.revertClone) {
        rootEl.insertBefore(cloneEl, dragEl);
      } else if (nextEl) {
        rootEl.insertBefore(cloneEl, nextEl);
      } else {
        rootEl.appendChild(cloneEl);
      }
      if (this.options.group.revertClone) {
        this.animate(dragEl, cloneEl);
      }
      css(cloneEl, "display", "");
      cloneHidden = false;
    }
  }
};
function _globalDragOver(evt) {
  if (evt.dataTransfer) {
    evt.dataTransfer.dropEffect = "move";
  }
  evt.cancelable && evt.preventDefault();
}
function _onMove(fromEl, toEl, dragEl2, dragRect, targetEl, targetRect, originalEvent, willInsertAfter) {
  var evt, sortable = fromEl[expando], onMoveFn = sortable.options.onMove, retVal;
  if (window.CustomEvent && !IE11OrLess && !Edge) {
    evt = new CustomEvent("move", {
      bubbles: true,
      cancelable: true
    });
  } else {
    evt = document.createEvent("Event");
    evt.initEvent("move", true, true);
  }
  evt.to = toEl;
  evt.from = fromEl;
  evt.dragged = dragEl2;
  evt.draggedRect = dragRect;
  evt.related = targetEl || toEl;
  evt.relatedRect = targetRect || getRect(toEl);
  evt.willInsertAfter = willInsertAfter;
  evt.originalEvent = originalEvent;
  fromEl.dispatchEvent(evt);
  if (onMoveFn) {
    retVal = onMoveFn.call(sortable, evt, originalEvent);
  }
  return retVal;
}
function _disableDraggable(el) {
  el.draggable = false;
}
function _unsilent() {
  _silent = false;
}
function _ghostIsFirst(evt, vertical, sortable) {
  var firstElRect = getRect(getChild(sortable.el, 0, sortable.options, true));
  var childContainingRect = getChildContainingRectFromElement(sortable.el, sortable.options, ghostEl);
  var spacer = 10;
  return vertical ? evt.clientX < childContainingRect.left - spacer || evt.clientY < firstElRect.top && evt.clientX < firstElRect.right : evt.clientY < childContainingRect.top - spacer || evt.clientY < firstElRect.bottom && evt.clientX < firstElRect.left;
}
function _ghostIsLast(evt, vertical, sortable) {
  var lastElRect = getRect(lastChild(sortable.el, sortable.options.draggable));
  var childContainingRect = getChildContainingRectFromElement(sortable.el, sortable.options, ghostEl);
  var spacer = 10;
  return vertical ? evt.clientX > childContainingRect.right + spacer || evt.clientY > lastElRect.bottom && evt.clientX > lastElRect.left : evt.clientY > childContainingRect.bottom + spacer || evt.clientX > lastElRect.right && evt.clientY > lastElRect.top;
}
function _getSwapDirection(evt, target, targetRect, vertical, swapThreshold, invertedSwapThreshold, invertSwap, isLastTarget) {
  var mouseOnAxis = vertical ? evt.clientY : evt.clientX, targetLength = vertical ? targetRect.height : targetRect.width, targetS1 = vertical ? targetRect.top : targetRect.left, targetS2 = vertical ? targetRect.bottom : targetRect.right, invert = false;
  if (!invertSwap) {
    if (isLastTarget && targetMoveDistance < targetLength * swapThreshold) {
      if (!pastFirstInvertThresh && (lastDirection === 1 ? mouseOnAxis > targetS1 + targetLength * invertedSwapThreshold / 2 : mouseOnAxis < targetS2 - targetLength * invertedSwapThreshold / 2)) {
        pastFirstInvertThresh = true;
      }
      if (!pastFirstInvertThresh) {
        if (lastDirection === 1 ? mouseOnAxis < targetS1 + targetMoveDistance : mouseOnAxis > targetS2 - targetMoveDistance) {
          return -lastDirection;
        }
      } else {
        invert = true;
      }
    } else {
      if (mouseOnAxis > targetS1 + targetLength * (1 - swapThreshold) / 2 && mouseOnAxis < targetS2 - targetLength * (1 - swapThreshold) / 2) {
        return _getInsertDirection(target);
      }
    }
  }
  invert = invert || invertSwap;
  if (invert) {
    if (mouseOnAxis < targetS1 + targetLength * invertedSwapThreshold / 2 || mouseOnAxis > targetS2 - targetLength * invertedSwapThreshold / 2) {
      return mouseOnAxis > targetS1 + targetLength / 2 ? 1 : -1;
    }
  }
  return 0;
}
function _getInsertDirection(target) {
  if (index(dragEl) < index(target)) {
    return 1;
  } else {
    return -1;
  }
}
function _generateId(el) {
  var str = el.tagName + el.className + el.src + el.href + el.textContent, i = str.length, sum = 0;
  while (i--) {
    sum += str.charCodeAt(i);
  }
  return sum.toString(36);
}
function _saveInputCheckedState(root) {
  savedInputChecked.length = 0;
  var inputs = root.getElementsByTagName("input");
  var idx = inputs.length;
  while (idx--) {
    var el = inputs[idx];
    el.checked && savedInputChecked.push(el);
  }
}
function _nextTick(fn) {
  return setTimeout(fn, 0);
}
function _cancelNextTick(id) {
  return clearTimeout(id);
}
if (documentExists) {
  on(document, "touchmove", function(evt) {
    if ((Sortable.active || awaitingDragStarted) && evt.cancelable) {
      evt.preventDefault();
    }
  });
}
Sortable.utils = {
  on,
  off,
  css,
  find,
  is: function is(el, selector) {
    return !!closest(el, selector, el, false);
  },
  extend,
  throttle,
  closest,
  toggleClass,
  clone,
  index,
  nextTick: _nextTick,
  cancelNextTick: _cancelNextTick,
  detectDirection: _detectDirection,
  getChild,
  expando
};
Sortable.get = function(element) {
  return element[expando];
};
Sortable.mount = function() {
  for (var _len = arguments.length, plugins2 = new Array(_len), _key = 0; _key < _len; _key++) {
    plugins2[_key] = arguments[_key];
  }
  if (plugins2[0].constructor === Array)
    plugins2 = plugins2[0];
  plugins2.forEach(function(plugin) {
    if (!plugin.prototype || !plugin.prototype.constructor) {
      throw "Sortable: Mounted plugin must be a constructor function, not ".concat({}.toString.call(plugin));
    }
    if (plugin.utils)
      Sortable.utils = _objectSpread2(_objectSpread2({}, Sortable.utils), plugin.utils);
    PluginManager.mount(plugin);
  });
};
Sortable.create = function(el, options) {
  return new Sortable(el, options);
};
Sortable.version = version;
var autoScrolls = [];
var scrollEl;
var scrollRootEl;
var scrolling = false;
var lastAutoScrollX;
var lastAutoScrollY;
var touchEvt$1;
var pointerElemChangedInterval;
function AutoScrollPlugin() {
  function AutoScroll() {
    this.defaults = {
      scroll: true,
      forceAutoScrollFallback: false,
      scrollSensitivity: 30,
      scrollSpeed: 10,
      bubbleScroll: true
    };
    for (var fn in this) {
      if (fn.charAt(0) === "_" && typeof this[fn] === "function") {
        this[fn] = this[fn].bind(this);
      }
    }
  }
  AutoScroll.prototype = {
    dragStarted: function dragStarted(_ref) {
      var originalEvent = _ref.originalEvent;
      if (this.sortable.nativeDraggable) {
        on(document, "dragover", this._handleAutoScroll);
      } else {
        if (this.options.supportPointer) {
          on(document, "pointermove", this._handleFallbackAutoScroll);
        } else if (originalEvent.touches) {
          on(document, "touchmove", this._handleFallbackAutoScroll);
        } else {
          on(document, "mousemove", this._handleFallbackAutoScroll);
        }
      }
    },
    dragOverCompleted: function dragOverCompleted(_ref2) {
      var originalEvent = _ref2.originalEvent;
      if (!this.options.dragOverBubble && !originalEvent.rootEl) {
        this._handleAutoScroll(originalEvent);
      }
    },
    drop: function drop3() {
      if (this.sortable.nativeDraggable) {
        off(document, "dragover", this._handleAutoScroll);
      } else {
        off(document, "pointermove", this._handleFallbackAutoScroll);
        off(document, "touchmove", this._handleFallbackAutoScroll);
        off(document, "mousemove", this._handleFallbackAutoScroll);
      }
      clearPointerElemChangedInterval();
      clearAutoScrolls();
      cancelThrottle();
    },
    nulling: function nulling() {
      touchEvt$1 = scrollRootEl = scrollEl = scrolling = pointerElemChangedInterval = lastAutoScrollX = lastAutoScrollY = null;
      autoScrolls.length = 0;
    },
    _handleFallbackAutoScroll: function _handleFallbackAutoScroll(evt) {
      this._handleAutoScroll(evt, true);
    },
    _handleAutoScroll: function _handleAutoScroll(evt, fallback) {
      var _this = this;
      var x = (evt.touches ? evt.touches[0] : evt).clientX, y = (evt.touches ? evt.touches[0] : evt).clientY, elem = document.elementFromPoint(x, y);
      touchEvt$1 = evt;
      if (fallback || this.options.forceAutoScrollFallback || Edge || IE11OrLess || Safari) {
        autoScroll(evt, this.options, elem, fallback);
        var ogElemScroller = getParentAutoScrollElement(elem, true);
        if (scrolling && (!pointerElemChangedInterval || x !== lastAutoScrollX || y !== lastAutoScrollY)) {
          pointerElemChangedInterval && clearPointerElemChangedInterval();
          pointerElemChangedInterval = setInterval(function() {
            var newElem = getParentAutoScrollElement(document.elementFromPoint(x, y), true);
            if (newElem !== ogElemScroller) {
              ogElemScroller = newElem;
              clearAutoScrolls();
            }
            autoScroll(evt, _this.options, newElem, fallback);
          }, 10);
          lastAutoScrollX = x;
          lastAutoScrollY = y;
        }
      } else {
        if (!this.options.bubbleScroll || getParentAutoScrollElement(elem, true) === getWindowScrollingElement()) {
          clearAutoScrolls();
          return;
        }
        autoScroll(evt, this.options, getParentAutoScrollElement(elem, false), false);
      }
    }
  };
  return _extends(AutoScroll, {
    pluginName: "scroll",
    initializeByDefault: true
  });
}
function clearAutoScrolls() {
  autoScrolls.forEach(function(autoScroll2) {
    clearInterval(autoScroll2.pid);
  });
  autoScrolls = [];
}
function clearPointerElemChangedInterval() {
  clearInterval(pointerElemChangedInterval);
}
var autoScroll = throttle(function(evt, options, rootEl2, isFallback) {
  if (!options.scroll)
    return;
  var x = (evt.touches ? evt.touches[0] : evt).clientX, y = (evt.touches ? evt.touches[0] : evt).clientY, sens = options.scrollSensitivity, speed = options.scrollSpeed, winScroller = getWindowScrollingElement();
  var scrollThisInstance = false, scrollCustomFn;
  if (scrollRootEl !== rootEl2) {
    scrollRootEl = rootEl2;
    clearAutoScrolls();
    scrollEl = options.scroll;
    scrollCustomFn = options.scrollFn;
    if (scrollEl === true) {
      scrollEl = getParentAutoScrollElement(rootEl2, true);
    }
  }
  var layersOut = 0;
  var currentParent = scrollEl;
  do {
    var el = currentParent, rect = getRect(el), top = rect.top, bottom = rect.bottom, left = rect.left, right = rect.right, width = rect.width, height = rect.height, canScrollX = void 0, canScrollY = void 0, scrollWidth = el.scrollWidth, scrollHeight = el.scrollHeight, elCSS = css(el), scrollPosX = el.scrollLeft, scrollPosY = el.scrollTop;
    if (el === winScroller) {
      canScrollX = width < scrollWidth && (elCSS.overflowX === "auto" || elCSS.overflowX === "scroll" || elCSS.overflowX === "visible");
      canScrollY = height < scrollHeight && (elCSS.overflowY === "auto" || elCSS.overflowY === "scroll" || elCSS.overflowY === "visible");
    } else {
      canScrollX = width < scrollWidth && (elCSS.overflowX === "auto" || elCSS.overflowX === "scroll");
      canScrollY = height < scrollHeight && (elCSS.overflowY === "auto" || elCSS.overflowY === "scroll");
    }
    var vx = canScrollX && (Math.abs(right - x) <= sens && scrollPosX + width < scrollWidth) - (Math.abs(left - x) <= sens && !!scrollPosX);
    var vy = canScrollY && (Math.abs(bottom - y) <= sens && scrollPosY + height < scrollHeight) - (Math.abs(top - y) <= sens && !!scrollPosY);
    if (!autoScrolls[layersOut]) {
      for (var i = 0; i <= layersOut; i++) {
        if (!autoScrolls[i]) {
          autoScrolls[i] = {};
        }
      }
    }
    if (autoScrolls[layersOut].vx != vx || autoScrolls[layersOut].vy != vy || autoScrolls[layersOut].el !== el) {
      autoScrolls[layersOut].el = el;
      autoScrolls[layersOut].vx = vx;
      autoScrolls[layersOut].vy = vy;
      clearInterval(autoScrolls[layersOut].pid);
      if (vx != 0 || vy != 0) {
        scrollThisInstance = true;
        autoScrolls[layersOut].pid = setInterval(function() {
          if (isFallback && this.layer === 0) {
            Sortable.active._onTouchMove(touchEvt$1);
          }
          var scrollOffsetY = autoScrolls[this.layer].vy ? autoScrolls[this.layer].vy * speed : 0;
          var scrollOffsetX = autoScrolls[this.layer].vx ? autoScrolls[this.layer].vx * speed : 0;
          if (typeof scrollCustomFn === "function") {
            if (scrollCustomFn.call(Sortable.dragged.parentNode[expando], scrollOffsetX, scrollOffsetY, evt, touchEvt$1, autoScrolls[this.layer].el) !== "continue") {
              return;
            }
          }
          scrollBy(autoScrolls[this.layer].el, scrollOffsetX, scrollOffsetY);
        }.bind({
          layer: layersOut
        }), 24);
      }
    }
    layersOut++;
  } while (options.bubbleScroll && currentParent !== winScroller && (currentParent = getParentAutoScrollElement(currentParent, false)));
  scrolling = scrollThisInstance;
}, 30);
var drop = function drop2(_ref) {
  var originalEvent = _ref.originalEvent, putSortable2 = _ref.putSortable, dragEl2 = _ref.dragEl, activeSortable = _ref.activeSortable, dispatchSortableEvent = _ref.dispatchSortableEvent, hideGhostForTarget = _ref.hideGhostForTarget, unhideGhostForTarget = _ref.unhideGhostForTarget;
  if (!originalEvent)
    return;
  var toSortable = putSortable2 || activeSortable;
  hideGhostForTarget();
  var touch = originalEvent.changedTouches && originalEvent.changedTouches.length ? originalEvent.changedTouches[0] : originalEvent;
  var target = document.elementFromPoint(touch.clientX, touch.clientY);
  unhideGhostForTarget();
  if (toSortable && !toSortable.el.contains(target)) {
    dispatchSortableEvent("spill");
    this.onSpill({
      dragEl: dragEl2,
      putSortable: putSortable2
    });
  }
};
function Revert() {
}
Revert.prototype = {
  startIndex: null,
  dragStart: function dragStart(_ref2) {
    var oldDraggableIndex2 = _ref2.oldDraggableIndex;
    this.startIndex = oldDraggableIndex2;
  },
  onSpill: function onSpill(_ref3) {
    var dragEl2 = _ref3.dragEl, putSortable2 = _ref3.putSortable;
    this.sortable.captureAnimationState();
    if (putSortable2) {
      putSortable2.captureAnimationState();
    }
    var nextSibling = getChild(this.sortable.el, this.startIndex, this.options);
    if (nextSibling) {
      this.sortable.el.insertBefore(dragEl2, nextSibling);
    } else {
      this.sortable.el.appendChild(dragEl2);
    }
    this.sortable.animateAll();
    if (putSortable2) {
      putSortable2.animateAll();
    }
  },
  drop
};
_extends(Revert, {
  pluginName: "revertOnSpill"
});
function Remove() {
}
Remove.prototype = {
  onSpill: function onSpill2(_ref4) {
    var dragEl2 = _ref4.dragEl, putSortable2 = _ref4.putSortable;
    var parentSortable = putSortable2 || this.sortable;
    parentSortable.captureAnimationState();
    dragEl2.parentNode && dragEl2.parentNode.removeChild(dragEl2);
    parentSortable.animateAll();
  },
  drop
};
_extends(Remove, {
  pluginName: "removeOnSpill"
});
Sortable.mount(new AutoScrollPlugin());
Sortable.mount(Remove, Revert);
var sortable_esm_default = Sortable;

// resources/js/sortable.js
function sortable_default(Alpine2) {
  Alpine2.directive("robusta-sortable", (el, { expression }, { evaluateLater, cleanup }) => {
    const evaluate = evaluateLater(expression);
    const sortable = sortable_esm_default.create(el, {
      animation: 150,
      dataIdAttr: "x-sortable-item",
      handle: ".robusta-sortable-handle",
      onSort() {
        const sortedSubset = sortable.toArray();
        evaluate((value) => {
          const { data, fixed = [] } = value;
          if (!Array.isArray(data))
            return;
          let result = [];
          let i = 0, j = 0;
          while (i < data.length) {
            if (fixed.includes(data[i])) {
              result.push(data[i]);
            } else {
              result.push(sortedSubset[j]);
              j++;
            }
            i++;
          }
          data.splice(0, data.length, ...result);
          el.dispatchEvent(new CustomEvent("sorted", { detail: [...data] }));
        });
      }
    });
    const stop = Alpine2.effect(() => {
      evaluate((value) => {
        sortable.option("disabled", !!value?.isLoading);
      });
    });
    cleanup(() => {
      stop();
      sortable.destroy();
    });
  });
}

// resources/js/index.js
document.addEventListener("alpine:init", () => {
  Alpine.plugin(sortable_default);
  Alpine.plugin(resized_column_default);
});
/*! Bundled license information:

sortablejs/modular/sortable.esm.js:
  (**!
   * Sortable 1.15.6
   * @author	RubaXa   <trash@rubaxa.org>
   * @author	owenm    <owen23355@gmail.com>
   * @license MIT
   *)
*/
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vanMvcmVzaXplZC1jb2x1bW4uanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL3NvcnRhYmxlanMvbW9kdWxhci9zb3J0YWJsZS5lc20uanMiLCAiLi4vanMvc29ydGFibGUuanMiLCAiLi4vanMvaW5kZXguanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChBbHBpbmUpIHtcbiAgICBBbHBpbmUuZGlyZWN0aXZlKCdyb2J1c3RhLXJlc2l6ZWQtY29sdW1uJywgKGVsLCB7IGV4cHJlc3Npb24gfSwgeyBldmFsdWF0ZSB9KSA9PiB7XG4gICAgICAgIGNvbnN0IGV2YWx1YXRlZCA9IGV2YWx1YXRlKGV4cHJlc3Npb24pIHx8IHt9O1xuICAgICAgICBsZXQgeyB0YWJsZUtleSwgbWluQ29sdW1uV2lkdGgsIG1heENvbHVtbldpZHRoLCBlbmFibGUgPSBmYWxzZSB9ID0gZXZhbHVhdGVkXG5cbiAgICAgICAgbWF4Q29sdW1uV2lkdGggPSBtYXhDb2x1bW5XaWR0aCA9PT0gLTEgPyBJbmZpbml0eSA6IG1heENvbHVtbldpZHRoXG5cbiAgICAgICAgaWYgKCFlbmFibGUpIHJldHVybjtcblxuICAgICAgICBsZXQgY3VycmVudFdpZHRoID0gMFxuXG4gICAgICAgIGNvbnN0IHRhYmxlU2VsZWN0b3IgPSAnLmZpLXRhLXRhYmxlJztcbiAgICAgICAgY29uc3QgdGFibGVXcmFwcGVyQ29udGVudFNlbGVjdG9yID0gJy5maS10YS1jb250ZW50JztcbiAgICAgICAgY29uc3QgdGFibGVCb2R5Q2VsbFByZWZpeCA9ICdmaS10YWJsZS1jZWxsLSc7XG4gICAgICAgIGNvbnN0IGNvbHVtblNlbGVjdG9yID0gJ3gtcm9idXN0YS10YWJsZS1jb2x1bW4nO1xuICAgICAgICBjb25zdCBleGNsdWRlQ29sdW1uU2VsZWN0b3IgPSAneC1yb2J1c3RhLXRhYmxlLWV4Y2x1ZGUtY29sdW1uJztcblxuXG4gICAgICAgIGNvbnN0IGNvbHVtbnMgPSBlbC5xdWVyeVNlbGVjdG9yQWxsKGBbJHtjb2x1bW5TZWxlY3Rvcn1dYCk7XG4gICAgICAgIGNvbnN0IGV4Y2x1ZGVDb2x1bW5zID0gZWwucXVlcnlTZWxlY3RvckFsbChgWyR7ZXhjbHVkZUNvbHVtblNlbGVjdG9yfV1gKTtcblxuICAgICAgICBsZXQgdGFibGUgPSBlbC5xdWVyeVNlbGVjdG9yKHRhYmxlU2VsZWN0b3IpO1xuICAgICAgICBsZXQgdGFibGVXcmFwcGVyID0gZWwucXVlcnlTZWxlY3Rvcih0YWJsZVdyYXBwZXJDb250ZW50U2VsZWN0b3IpO1xuXG4gICAgICAgIGxldCBoYW5kbGVCYXIgPSBudWxsXG5cbiAgICAgICAgaWYgKHRhYmxlICYmIHRhYmxlV3JhcHBlcikge1xuICAgICAgICAgICAgaW5pdCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgICAgICAgIGluaXRpYWxpemVDb2x1bW5MYXlvdXQoKVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gaW5pdGlhbGl6ZUNvbHVtbkxheW91dCgpIHtcbiAgICAgICAgICAgIGxldCB0b3RhbFdpZHRoID0gMDtcblxuICAgICAgICAgICAgY29uc3QgYXBwbHlMYXlvdXQgPSAoY29sdW1uLCBnZXROYW1lRm4sIHdpdGhIYW5kbGVCYXIgPSBmYWxzZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbHVtbk5hbWUgPSBnZXROYW1lRm4oY29sdW1uKTtcbiAgICAgICAgICAgICAgICBjb25zdCBkZWZhdWx0S2V5ID0gYCR7Y29sdW1uTmFtZX1fZGVmYXVsdGA7XG5cbiAgICAgICAgICAgICAgICBpZiAod2l0aEhhbmRsZUJhcikge1xuICAgICAgICAgICAgICAgICAgICBjb2x1bW4uY2xhc3NMaXN0LmFkZChcInJlbGF0aXZlXCIsIFwiZ3JvdXAvY29sdW1uLXJlc2l6ZVwiLCBcIm92ZXJmbG93LWhpZGRlblwiKTtcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRlSGFuZGxlQmFyKGNvbHVtbik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbGV0IHNhdmVkV2lkdGggPSBnZXRTYXZlZFdpZHRoKGNvbHVtbk5hbWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGRlZmF1bHRXaWR0aCA9IGdldFNhdmVkV2lkdGgoZGVmYXVsdEtleSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIXNhdmVkV2lkdGggJiYgZGVmYXVsdFdpZHRoKSB7XG4gICAgICAgICAgICAgICAgICAgIHNhdmVkV2lkdGggPSBkZWZhdWx0V2lkdGg7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCFzYXZlZFdpZHRoICYmICFkZWZhdWx0V2lkdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgc2F2ZWRXaWR0aCA9IGNvbHVtbi5vZmZzZXRXaWR0aDtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlQ29sdW1uVXBkYXRlKHNhdmVkV2lkdGgsIGRlZmF1bHRLZXkpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRvdGFsV2lkdGggKz0gc2F2ZWRXaWR0aDtcbiAgICAgICAgICAgICAgICBhcHBseUNvbHVtbldpZHRoKHNhdmVkV2lkdGgsIGNvbHVtbik7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBleGNsdWRlQ29sdW1ucy5mb3JFYWNoKGNvbHVtbiA9PiB7XG4gICAgICAgICAgICAgICAgYXBwbHlMYXlvdXQoY29sdW1uLCBjb2wgPT4gZ2V0Q29sdW1uTmFtZShjb2wsIGV4Y2x1ZGVDb2x1bW5TZWxlY3RvcikpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNvbHVtbnMuZm9yRWFjaChjb2x1bW4gPT4ge1xuICAgICAgICAgICAgICAgIGFwcGx5TGF5b3V0KGNvbHVtbiwgZ2V0Q29sdW1uTmFtZSwgdHJ1ZSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKHRhYmxlICYmIHRvdGFsV2lkdGgpIHtcbiAgICAgICAgICAgICAgICB0YWJsZS5zdHlsZS5tYXhXaWR0aCA9IGAke3RvdGFsV2lkdGh9cHhgO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cblxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVIYW5kbGVCYXIoY29sdW1uKSB7XG4gICAgICAgICAgICBjb25zdCBleGlzdGluZ0hhbmRsZSA9IGNvbHVtbi5xdWVyeVNlbGVjdG9yKFwiLmNvbHVtbi1yZXNpemUtaGFuZGxlLWJhclwiKTtcbiAgICAgICAgICAgIGlmIChleGlzdGluZ0hhbmRsZSkgZXhpc3RpbmdIYW5kbGUucmVtb3ZlKCk7XG5cbiAgICAgICAgICAgIGhhbmRsZUJhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgICAgICAgICBoYW5kbGVCYXIudHlwZSA9IFwiYnV0dG9uXCI7XG4gICAgICAgICAgICBoYW5kbGVCYXIuY2xhc3NMaXN0LmFkZChcImNvbHVtbi1yZXNpemUtaGFuZGxlLWJhclwiKTtcbiAgICAgICAgICAgIGhhbmRsZUJhci50aXRsZSA9IFwiUmVzaXplIGNvbHVtblwiO1xuXG4gICAgICAgICAgICBjb2x1bW4uYXBwZW5kQ2hpbGQoaGFuZGxlQmFyKTtcblxuICAgICAgICAgICAgaGFuZGxlQmFyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgKGUpID0+IHN0YXJ0UmVzaXplKGUsIGNvbHVtbikpO1xuXG4gICAgICAgICAgICBoYW5kbGVCYXIuYWRkRXZlbnRMaXN0ZW5lcihcImRibGNsaWNrXCIsIChlKSA9PiBoYW5kbGVEb3VibGVDbGljayhlLCBjb2x1bW4pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGhhbmRsZURvdWJsZUNsaWNrKGV2ZW50LCBjb2x1bW4pIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbHVtbk5hbWUgPSBnZXRDb2x1bW5OYW1lKGNvbHVtbik7XG4gICAgICAgICAgICBjb25zdCBkZWZhdWx0Q29sdW1uTmFtZSA9IGNvbHVtbk5hbWUgKyAnX2RlZmF1bHQnO1xuICAgICAgICAgICAgY29uc3Qgc2F2ZWRXaWR0aCA9IGdldFNhdmVkV2lkdGgoZGVmYXVsdENvbHVtbk5hbWUpIHx8IG1pbkNvbHVtbldpZHRoO1xuXG4gICAgICAgICAgICBpZiAoc2F2ZWRXaWR0aCA9PT0gY29sdW1uLm9mZnNldFdpZHRoKSByZXR1cm47XG5cbiAgICAgICAgICAgIGFwcGx5Q29sdW1uV2lkdGgoc2F2ZWRXaWR0aCwgY29sdW1uKTtcbiAgICAgICAgICAgIGhhbmRsZUNvbHVtblVwZGF0ZShzYXZlZFdpZHRoLCBjb2x1bW5OYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHN0YXJ0UmVzaXplKGV2ZW50LCBjb2x1bW4pIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgICAgICAgICAgaWYgKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQudGFyZ2V0LmNsYXNzTGlzdC5hZGQoXCJhY3RpdmVcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0WCA9IGV2ZW50LnBhZ2VYO1xuICAgICAgICAgICAgY29uc3Qgb3JpZ2luYWxDb2x1bW5XaWR0aCA9IE1hdGgucm91bmQoY29sdW1uLm9mZnNldFdpZHRoKTtcbiAgICAgICAgICAgIGNvbnN0IG9yaWdpbmFsVGFibGVXaWR0aCA9IE1hdGgucm91bmQodGFibGUub2Zmc2V0V2lkdGgpO1xuICAgICAgICAgICAgY29uc3Qgb3JpZ2luYWxXcmFwcGVyV2lkdGggPSBNYXRoLnJvdW5kKHRhYmxlV3JhcHBlci5vZmZzZXRXaWR0aCk7XG5cbiAgICAgICAgICAgIGNvbnN0IG9uTW91c2VNb3ZlID0gdGhyb3R0bGUoKG1vdmVFdmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChtb3ZlRXZlbnQucGFnZVggPT09IHN0YXJ0WCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgIGNvbnN0IGRlbHRhID0gbW92ZUV2ZW50LnBhZ2VYIC0gc3RhcnRYO1xuXG4gICAgICAgICAgICAgICAgY3VycmVudFdpZHRoID0gTWF0aC5yb3VuZChcbiAgICAgICAgICAgICAgICAgICAgTWF0aC5taW4oXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhDb2x1bW5XaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgubWF4KG1pbkNvbHVtbldpZHRoLCBvcmlnaW5hbENvbHVtbldpZHRoICsgZGVsdGEgLSAxNilcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBuZXdUYWJsZVdpZHRoID0gb3JpZ2luYWxUYWJsZVdpZHRoIC0gb3JpZ2luYWxDb2x1bW5XaWR0aCArIGN1cnJlbnRXaWR0aDtcbiAgICAgICAgICAgICAgICB0YWJsZS5zdHlsZS53aWR0aCA9IG5ld1RhYmxlV2lkdGggPiBvcmlnaW5hbFdyYXBwZXJXaWR0aFxuICAgICAgICAgICAgICAgICAgICA/IGAke25ld1RhYmxlV2lkdGh9cHhgXG4gICAgICAgICAgICAgICAgICAgIDogXCJhdXRvXCI7XG5cbiAgICAgICAgICAgICAgICBhcHBseUNvbHVtbldpZHRoKGN1cnJlbnRXaWR0aCwgY29sdW1uKTtcbiAgICAgICAgICAgIH0sIDE2KTtcblxuICAgICAgICAgICAgY29uc3Qgb25Nb3VzZVVwID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChldmVudCkgZXZlbnQudGFyZ2V0LmNsYXNzTGlzdC5yZW1vdmUoXCJhY3RpdmVcIik7XG5cbiAgICAgICAgICAgICAgICBoYW5kbGVDb2x1bW5VcGRhdGUoY3VycmVudFdpZHRoLCBnZXRDb2x1bW5OYW1lKGNvbHVtbikpO1xuXG4gICAgICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCBvbk1vdXNlTW92ZSk7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgb25Nb3VzZVVwKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgb25Nb3VzZU1vdmUpO1xuICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgb25Nb3VzZVVwKTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgZnVuY3Rpb24gaGFuZGxlQ29sdW1uVXBkYXRlKHdpZHRoLCBjb2x1bW5OYW1lKSB7XG4gICAgICAgICAgICBzYXZlV2lkdGhUb1N0b3JhZ2Uod2lkdGgsIGNvbHVtbk5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gYXBwbHlDb2x1bW5XaWR0aCh3aWR0aCwgY29sdW1uKSB7XG4gICAgICAgICAgICBzZXRDb2x1bW5TdHlsZXMoY29sdW1uLCB3aWR0aCk7XG4gICAgICAgICAgICBjb25zdCBjb2x1bW5OYW1lID0gZ2V0Q29sdW1uTmFtZShjb2x1bW4pO1xuICAgICAgICAgICAgY29uc3QgY2VsbFNlbGVjdG9yID0gYC4ke2VzY2FwZUNzc0NsYXNzKHRhYmxlQm9keUNlbGxQcmVmaXggKyBjb2x1bW5OYW1lKX1gO1xuICAgICAgICAgICAgdGFibGUucXVlcnlTZWxlY3RvckFsbChjZWxsU2VsZWN0b3IpLmZvckVhY2goY2VsbCA9PiB7XG4gICAgICAgICAgICAgICAgc2V0Q29sdW1uU3R5bGVzKGNlbGwsIHdpZHRoKTtcbiAgICAgICAgICAgICAgICBjZWxsLnN0eWxlLm92ZXJmbG93ID0gXCJoaWRkZW5cIjtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gc2V0Q29sdW1uU3R5bGVzKGVsLCB3aWR0aCkge1xuICAgICAgICAgICAgZWwuc3R5bGUud2lkdGggPSB3aWR0aCA/IGAke3dpZHRofXB4YCA6ICdhdXRvJztcbiAgICAgICAgICAgIGVsLnN0eWxlLm1pbldpZHRoID0gd2lkdGggPyBgJHt3aWR0aH1weGAgOiAnYXV0byc7XG4gICAgICAgICAgICBlbC5zdHlsZS5tYXhXaWR0aCA9IHdpZHRoID8gYCR7d2lkdGh9cHhgIDogJ2F1dG8nO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZXNjYXBlQ3NzQ2xhc3MoY2xhc3NOYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gY2xhc3NOYW1lLnJlcGxhY2UoL1xcLi9nLCBcIlxcXFwuXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gdGhyb3R0bGUoY2FsbGJhY2ssIGxpbWl0KSB7XG4gICAgICAgICAgICBsZXQgd2FpdCA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF3YWl0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICB3YWl0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3YWl0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH0sIGxpbWl0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0U3RvcmFnZUtleShjb2x1bW5OYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gYCR7dGFibGVLZXl9X2NvbHVtbldpZHRoXyR7Y29sdW1uTmFtZX1gO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0U2F2ZWRXaWR0aChjb2x1bW5OYW1lKSB7XG4gICAgICAgICAgICBjb25zdCBzYXZlZFdpZHRoID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShnZXRTdG9yYWdlS2V5KGNvbHVtbk5hbWUpKTtcbiAgICAgICAgICAgIHJldHVybiBzYXZlZFdpZHRoID8gcGFyc2VJbnQoc2F2ZWRXaWR0aCkgOiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gc2F2ZVdpZHRoVG9TdG9yYWdlKHdpZHRoLCBjb2x1bW5OYW1lKSB7XG4gICAgICAgICAgICBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKFxuICAgICAgICAgICAgICAgIGdldFN0b3JhZ2VLZXkoY29sdW1uTmFtZSksXG4gICAgICAgICAgICAgICAgTWF0aC5tYXgoXG4gICAgICAgICAgICAgICAgICAgIG1pbkNvbHVtbldpZHRoLFxuICAgICAgICAgICAgICAgICAgICBNYXRoLm1pbihtYXhDb2x1bW5XaWR0aCwgd2lkdGgpXG4gICAgICAgICAgICAgICAgKS50b1N0cmluZygpXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0Q29sdW1uTmFtZShjb2x1bW4sIHNlbGVjdG9yID0gY29sdW1uU2VsZWN0b3IpIHtcbiAgICAgICAgICAgIHJldHVybiBjb2x1bW4uZ2V0QXR0cmlidXRlKHNlbGVjdG9yKTtcbiAgICAgICAgfVxuICAgIH0pXG59XG4iLCAiLyoqIVxuICogU29ydGFibGUgMS4xNS42XG4gKiBAYXV0aG9yXHRSdWJhWGEgICA8dHJhc2hAcnViYXhhLm9yZz5cbiAqIEBhdXRob3JcdG93ZW5tICAgIDxvd2VuMjMzNTVAZ21haWwuY29tPlxuICogQGxpY2Vuc2UgTUlUXG4gKi9cbmZ1bmN0aW9uIG93bktleXMob2JqZWN0LCBlbnVtZXJhYmxlT25seSkge1xuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG9iamVjdCk7XG4gIGlmIChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKSB7XG4gICAgdmFyIHN5bWJvbHMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKG9iamVjdCk7XG4gICAgaWYgKGVudW1lcmFibGVPbmx5KSB7XG4gICAgICBzeW1ib2xzID0gc3ltYm9scy5maWx0ZXIoZnVuY3Rpb24gKHN5bSkge1xuICAgICAgICByZXR1cm4gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihvYmplY3QsIHN5bSkuZW51bWVyYWJsZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBrZXlzLnB1c2guYXBwbHkoa2V5cywgc3ltYm9scyk7XG4gIH1cbiAgcmV0dXJuIGtleXM7XG59XG5mdW5jdGlvbiBfb2JqZWN0U3ByZWFkMih0YXJnZXQpIHtcbiAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldICE9IG51bGwgPyBhcmd1bWVudHNbaV0gOiB7fTtcbiAgICBpZiAoaSAlIDIpIHtcbiAgICAgIG93bktleXMoT2JqZWN0KHNvdXJjZSksIHRydWUpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBfZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHNvdXJjZVtrZXldKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnMpIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnMoc291cmNlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG93bktleXMoT2JqZWN0KHNvdXJjZSkpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Ioc291cmNlLCBrZXkpKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdGFyZ2V0O1xufVxuZnVuY3Rpb24gX3R5cGVvZihvYmopIHtcbiAgXCJAYmFiZWwvaGVscGVycyAtIHR5cGVvZlwiO1xuXG4gIGlmICh0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gXCJzeW1ib2xcIikge1xuICAgIF90eXBlb2YgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gdHlwZW9mIG9iajtcbiAgICB9O1xuICB9IGVsc2Uge1xuICAgIF90eXBlb2YgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gb2JqICYmIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCAmJiBvYmogIT09IFN5bWJvbC5wcm90b3R5cGUgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajtcbiAgICB9O1xuICB9XG4gIHJldHVybiBfdHlwZW9mKG9iaik7XG59XG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydHkob2JqLCBrZXksIHZhbHVlKSB7XG4gIGlmIChrZXkgaW4gb2JqKSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwga2V5LCB7XG4gICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgd3JpdGFibGU6IHRydWVcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICBvYmpba2V5XSA9IHZhbHVlO1xuICB9XG4gIHJldHVybiBvYmo7XG59XG5mdW5jdGlvbiBfZXh0ZW5kcygpIHtcbiAgX2V4dGVuZHMgPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uICh0YXJnZXQpIHtcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgIGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHtcbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHtcbiAgICAgICAgICB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0YXJnZXQ7XG4gIH07XG4gIHJldHVybiBfZXh0ZW5kcy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuZnVuY3Rpb24gX29iamVjdFdpdGhvdXRQcm9wZXJ0aWVzTG9vc2Uoc291cmNlLCBleGNsdWRlZCkge1xuICBpZiAoc291cmNlID09IG51bGwpIHJldHVybiB7fTtcbiAgdmFyIHRhcmdldCA9IHt9O1xuICB2YXIgc291cmNlS2V5cyA9IE9iamVjdC5rZXlzKHNvdXJjZSk7XG4gIHZhciBrZXksIGk7XG4gIGZvciAoaSA9IDA7IGkgPCBzb3VyY2VLZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAga2V5ID0gc291cmNlS2V5c1tpXTtcbiAgICBpZiAoZXhjbHVkZWQuaW5kZXhPZihrZXkpID49IDApIGNvbnRpbnVlO1xuICAgIHRhcmdldFtrZXldID0gc291cmNlW2tleV07XG4gIH1cbiAgcmV0dXJuIHRhcmdldDtcbn1cbmZ1bmN0aW9uIF9vYmplY3RXaXRob3V0UHJvcGVydGllcyhzb3VyY2UsIGV4Y2x1ZGVkKSB7XG4gIGlmIChzb3VyY2UgPT0gbnVsbCkgcmV0dXJuIHt9O1xuICB2YXIgdGFyZ2V0ID0gX29iamVjdFdpdGhvdXRQcm9wZXJ0aWVzTG9vc2Uoc291cmNlLCBleGNsdWRlZCk7XG4gIHZhciBrZXksIGk7XG4gIGlmIChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKSB7XG4gICAgdmFyIHNvdXJjZVN5bWJvbEtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKHNvdXJjZSk7XG4gICAgZm9yIChpID0gMDsgaSA8IHNvdXJjZVN5bWJvbEtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGtleSA9IHNvdXJjZVN5bWJvbEtleXNbaV07XG4gICAgICBpZiAoZXhjbHVkZWQuaW5kZXhPZihrZXkpID49IDApIGNvbnRpbnVlO1xuICAgICAgaWYgKCFPYmplY3QucHJvdG90eXBlLnByb3BlcnR5SXNFbnVtZXJhYmxlLmNhbGwoc291cmNlLCBrZXkpKSBjb250aW51ZTtcbiAgICAgIHRhcmdldFtrZXldID0gc291cmNlW2tleV07XG4gICAgfVxuICB9XG4gIHJldHVybiB0YXJnZXQ7XG59XG5mdW5jdGlvbiBfdG9Db25zdW1hYmxlQXJyYXkoYXJyKSB7XG4gIHJldHVybiBfYXJyYXlXaXRob3V0SG9sZXMoYXJyKSB8fCBfaXRlcmFibGVUb0FycmF5KGFycikgfHwgX3Vuc3VwcG9ydGVkSXRlcmFibGVUb0FycmF5KGFycikgfHwgX25vbkl0ZXJhYmxlU3ByZWFkKCk7XG59XG5mdW5jdGlvbiBfYXJyYXlXaXRob3V0SG9sZXMoYXJyKSB7XG4gIGlmIChBcnJheS5pc0FycmF5KGFycikpIHJldHVybiBfYXJyYXlMaWtlVG9BcnJheShhcnIpO1xufVxuZnVuY3Rpb24gX2l0ZXJhYmxlVG9BcnJheShpdGVyKSB7XG4gIGlmICh0eXBlb2YgU3ltYm9sICE9PSBcInVuZGVmaW5lZFwiICYmIGl0ZXJbU3ltYm9sLml0ZXJhdG9yXSAhPSBudWxsIHx8IGl0ZXJbXCJAQGl0ZXJhdG9yXCJdICE9IG51bGwpIHJldHVybiBBcnJheS5mcm9tKGl0ZXIpO1xufVxuZnVuY3Rpb24gX3Vuc3VwcG9ydGVkSXRlcmFibGVUb0FycmF5KG8sIG1pbkxlbikge1xuICBpZiAoIW8pIHJldHVybjtcbiAgaWYgKHR5cGVvZiBvID09PSBcInN0cmluZ1wiKSByZXR1cm4gX2FycmF5TGlrZVRvQXJyYXkobywgbWluTGVuKTtcbiAgdmFyIG4gPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobykuc2xpY2UoOCwgLTEpO1xuICBpZiAobiA9PT0gXCJPYmplY3RcIiAmJiBvLmNvbnN0cnVjdG9yKSBuID0gby5jb25zdHJ1Y3Rvci5uYW1lO1xuICBpZiAobiA9PT0gXCJNYXBcIiB8fCBuID09PSBcIlNldFwiKSByZXR1cm4gQXJyYXkuZnJvbShvKTtcbiAgaWYgKG4gPT09IFwiQXJndW1lbnRzXCIgfHwgL14oPzpVaXxJKW50KD86OHwxNnwzMikoPzpDbGFtcGVkKT9BcnJheSQvLnRlc3QobikpIHJldHVybiBfYXJyYXlMaWtlVG9BcnJheShvLCBtaW5MZW4pO1xufVxuZnVuY3Rpb24gX2FycmF5TGlrZVRvQXJyYXkoYXJyLCBsZW4pIHtcbiAgaWYgKGxlbiA9PSBudWxsIHx8IGxlbiA+IGFyci5sZW5ndGgpIGxlbiA9IGFyci5sZW5ndGg7XG4gIGZvciAodmFyIGkgPSAwLCBhcnIyID0gbmV3IEFycmF5KGxlbik7IGkgPCBsZW47IGkrKykgYXJyMltpXSA9IGFycltpXTtcbiAgcmV0dXJuIGFycjI7XG59XG5mdW5jdGlvbiBfbm9uSXRlcmFibGVTcHJlYWQoKSB7XG4gIHRocm93IG5ldyBUeXBlRXJyb3IoXCJJbnZhbGlkIGF0dGVtcHQgdG8gc3ByZWFkIG5vbi1pdGVyYWJsZSBpbnN0YW5jZS5cXG5JbiBvcmRlciB0byBiZSBpdGVyYWJsZSwgbm9uLWFycmF5IG9iamVjdHMgbXVzdCBoYXZlIGEgW1N5bWJvbC5pdGVyYXRvcl0oKSBtZXRob2QuXCIpO1xufVxuXG52YXIgdmVyc2lvbiA9IFwiMS4xNS42XCI7XG5cbmZ1bmN0aW9uIHVzZXJBZ2VudChwYXR0ZXJuKSB7XG4gIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cubmF2aWdhdG9yKSB7XG4gICAgcmV0dXJuICEhIC8qQF9fUFVSRV9fKi9uYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKHBhdHRlcm4pO1xuICB9XG59XG52YXIgSUUxMU9yTGVzcyA9IHVzZXJBZ2VudCgvKD86VHJpZGVudC4qcnZbIDpdPzExXFwufG1zaWV8aWVtb2JpbGV8V2luZG93cyBQaG9uZSkvaSk7XG52YXIgRWRnZSA9IHVzZXJBZ2VudCgvRWRnZS9pKTtcbnZhciBGaXJlRm94ID0gdXNlckFnZW50KC9maXJlZm94L2kpO1xudmFyIFNhZmFyaSA9IHVzZXJBZ2VudCgvc2FmYXJpL2kpICYmICF1c2VyQWdlbnQoL2Nocm9tZS9pKSAmJiAhdXNlckFnZW50KC9hbmRyb2lkL2kpO1xudmFyIElPUyA9IHVzZXJBZ2VudCgvaVAoYWR8b2R8aG9uZSkvaSk7XG52YXIgQ2hyb21lRm9yQW5kcm9pZCA9IHVzZXJBZ2VudCgvY2hyb21lL2kpICYmIHVzZXJBZ2VudCgvYW5kcm9pZC9pKTtcblxudmFyIGNhcHR1cmVNb2RlID0ge1xuICBjYXB0dXJlOiBmYWxzZSxcbiAgcGFzc2l2ZTogZmFsc2Vcbn07XG5mdW5jdGlvbiBvbihlbCwgZXZlbnQsIGZuKSB7XG4gIGVsLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGZuLCAhSUUxMU9yTGVzcyAmJiBjYXB0dXJlTW9kZSk7XG59XG5mdW5jdGlvbiBvZmYoZWwsIGV2ZW50LCBmbikge1xuICBlbC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50LCBmbiwgIUlFMTFPckxlc3MgJiYgY2FwdHVyZU1vZGUpO1xufVxuZnVuY3Rpb24gbWF0Y2hlcyggLyoqSFRNTEVsZW1lbnQqL2VsLCAvKipTdHJpbmcqL3NlbGVjdG9yKSB7XG4gIGlmICghc2VsZWN0b3IpIHJldHVybjtcbiAgc2VsZWN0b3JbMF0gPT09ICc+JyAmJiAoc2VsZWN0b3IgPSBzZWxlY3Rvci5zdWJzdHJpbmcoMSkpO1xuICBpZiAoZWwpIHtcbiAgICB0cnkge1xuICAgICAgaWYgKGVsLm1hdGNoZXMpIHtcbiAgICAgICAgcmV0dXJuIGVsLm1hdGNoZXMoc2VsZWN0b3IpO1xuICAgICAgfSBlbHNlIGlmIChlbC5tc01hdGNoZXNTZWxlY3Rvcikge1xuICAgICAgICByZXR1cm4gZWwubXNNYXRjaGVzU2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgICAgfSBlbHNlIGlmIChlbC53ZWJraXRNYXRjaGVzU2VsZWN0b3IpIHtcbiAgICAgICAgcmV0dXJuIGVsLndlYmtpdE1hdGNoZXNTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoXykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5mdW5jdGlvbiBnZXRQYXJlbnRPckhvc3QoZWwpIHtcbiAgcmV0dXJuIGVsLmhvc3QgJiYgZWwgIT09IGRvY3VtZW50ICYmIGVsLmhvc3Qubm9kZVR5cGUgPyBlbC5ob3N0IDogZWwucGFyZW50Tm9kZTtcbn1cbmZ1bmN0aW9uIGNsb3Nlc3QoIC8qKkhUTUxFbGVtZW50Ki9lbCwgLyoqU3RyaW5nKi9zZWxlY3RvciwgLyoqSFRNTEVsZW1lbnQqL2N0eCwgaW5jbHVkZUNUWCkge1xuICBpZiAoZWwpIHtcbiAgICBjdHggPSBjdHggfHwgZG9jdW1lbnQ7XG4gICAgZG8ge1xuICAgICAgaWYgKHNlbGVjdG9yICE9IG51bGwgJiYgKHNlbGVjdG9yWzBdID09PSAnPicgPyBlbC5wYXJlbnROb2RlID09PSBjdHggJiYgbWF0Y2hlcyhlbCwgc2VsZWN0b3IpIDogbWF0Y2hlcyhlbCwgc2VsZWN0b3IpKSB8fCBpbmNsdWRlQ1RYICYmIGVsID09PSBjdHgpIHtcbiAgICAgICAgcmV0dXJuIGVsO1xuICAgICAgfVxuICAgICAgaWYgKGVsID09PSBjdHgpIGJyZWFrO1xuICAgICAgLyoganNoaW50IGJvc3M6dHJ1ZSAqL1xuICAgIH0gd2hpbGUgKGVsID0gZ2V0UGFyZW50T3JIb3N0KGVsKSk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG52YXIgUl9TUEFDRSA9IC9cXHMrL2c7XG5mdW5jdGlvbiB0b2dnbGVDbGFzcyhlbCwgbmFtZSwgc3RhdGUpIHtcbiAgaWYgKGVsICYmIG5hbWUpIHtcbiAgICBpZiAoZWwuY2xhc3NMaXN0KSB7XG4gICAgICBlbC5jbGFzc0xpc3Rbc3RhdGUgPyAnYWRkJyA6ICdyZW1vdmUnXShuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGNsYXNzTmFtZSA9ICgnICcgKyBlbC5jbGFzc05hbWUgKyAnICcpLnJlcGxhY2UoUl9TUEFDRSwgJyAnKS5yZXBsYWNlKCcgJyArIG5hbWUgKyAnICcsICcgJyk7XG4gICAgICBlbC5jbGFzc05hbWUgPSAoY2xhc3NOYW1lICsgKHN0YXRlID8gJyAnICsgbmFtZSA6ICcnKSkucmVwbGFjZShSX1NQQUNFLCAnICcpO1xuICAgIH1cbiAgfVxufVxuZnVuY3Rpb24gY3NzKGVsLCBwcm9wLCB2YWwpIHtcbiAgdmFyIHN0eWxlID0gZWwgJiYgZWwuc3R5bGU7XG4gIGlmIChzdHlsZSkge1xuICAgIGlmICh2YWwgPT09IHZvaWQgMCkge1xuICAgICAgaWYgKGRvY3VtZW50LmRlZmF1bHRWaWV3ICYmIGRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUpIHtcbiAgICAgICAgdmFsID0gZG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShlbCwgJycpO1xuICAgICAgfSBlbHNlIGlmIChlbC5jdXJyZW50U3R5bGUpIHtcbiAgICAgICAgdmFsID0gZWwuY3VycmVudFN0eWxlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHByb3AgPT09IHZvaWQgMCA/IHZhbCA6IHZhbFtwcm9wXTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKCEocHJvcCBpbiBzdHlsZSkgJiYgcHJvcC5pbmRleE9mKCd3ZWJraXQnKSA9PT0gLTEpIHtcbiAgICAgICAgcHJvcCA9ICctd2Via2l0LScgKyBwcm9wO1xuICAgICAgfVxuICAgICAgc3R5bGVbcHJvcF0gPSB2YWwgKyAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycgPyAnJyA6ICdweCcpO1xuICAgIH1cbiAgfVxufVxuZnVuY3Rpb24gbWF0cml4KGVsLCBzZWxmT25seSkge1xuICB2YXIgYXBwbGllZFRyYW5zZm9ybXMgPSAnJztcbiAgaWYgKHR5cGVvZiBlbCA9PT0gJ3N0cmluZycpIHtcbiAgICBhcHBsaWVkVHJhbnNmb3JtcyA9IGVsO1xuICB9IGVsc2Uge1xuICAgIGRvIHtcbiAgICAgIHZhciB0cmFuc2Zvcm0gPSBjc3MoZWwsICd0cmFuc2Zvcm0nKTtcbiAgICAgIGlmICh0cmFuc2Zvcm0gJiYgdHJhbnNmb3JtICE9PSAnbm9uZScpIHtcbiAgICAgICAgYXBwbGllZFRyYW5zZm9ybXMgPSB0cmFuc2Zvcm0gKyAnICcgKyBhcHBsaWVkVHJhbnNmb3JtcztcbiAgICAgIH1cbiAgICAgIC8qIGpzaGludCBib3NzOnRydWUgKi9cbiAgICB9IHdoaWxlICghc2VsZk9ubHkgJiYgKGVsID0gZWwucGFyZW50Tm9kZSkpO1xuICB9XG4gIHZhciBtYXRyaXhGbiA9IHdpbmRvdy5ET01NYXRyaXggfHwgd2luZG93LldlYktpdENTU01hdHJpeCB8fCB3aW5kb3cuQ1NTTWF0cml4IHx8IHdpbmRvdy5NU0NTU01hdHJpeDtcbiAgLypqc2hpbnQgLVcwNTYgKi9cbiAgcmV0dXJuIG1hdHJpeEZuICYmIG5ldyBtYXRyaXhGbihhcHBsaWVkVHJhbnNmb3Jtcyk7XG59XG5mdW5jdGlvbiBmaW5kKGN0eCwgdGFnTmFtZSwgaXRlcmF0b3IpIHtcbiAgaWYgKGN0eCkge1xuICAgIHZhciBsaXN0ID0gY3R4LmdldEVsZW1lbnRzQnlUYWdOYW1lKHRhZ05hbWUpLFxuICAgICAgaSA9IDAsXG4gICAgICBuID0gbGlzdC5sZW5ndGg7XG4gICAgaWYgKGl0ZXJhdG9yKSB7XG4gICAgICBmb3IgKDsgaSA8IG47IGkrKykge1xuICAgICAgICBpdGVyYXRvcihsaXN0W2ldLCBpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGxpc3Q7XG4gIH1cbiAgcmV0dXJuIFtdO1xufVxuZnVuY3Rpb24gZ2V0V2luZG93U2Nyb2xsaW5nRWxlbWVudCgpIHtcbiAgdmFyIHNjcm9sbGluZ0VsZW1lbnQgPSBkb2N1bWVudC5zY3JvbGxpbmdFbGVtZW50O1xuICBpZiAoc2Nyb2xsaW5nRWxlbWVudCkge1xuICAgIHJldHVybiBzY3JvbGxpbmdFbGVtZW50O1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG4gIH1cbn1cblxuLyoqXHJcbiAqIFJldHVybnMgdGhlIFwiYm91bmRpbmcgY2xpZW50IHJlY3RcIiBvZiBnaXZlbiBlbGVtZW50XHJcbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBlbCAgICAgICAgICAgICAgICAgICAgICAgVGhlIGVsZW1lbnQgd2hvc2UgYm91bmRpbmdDbGllbnRSZWN0IGlzIHdhbnRlZFxyXG4gKiBAcGFyYW0gIHtbQm9vbGVhbl19IHJlbGF0aXZlVG9Db250YWluaW5nQmxvY2sgIFdoZXRoZXIgdGhlIHJlY3Qgc2hvdWxkIGJlIHJlbGF0aXZlIHRvIHRoZSBjb250YWluaW5nIGJsb2NrIG9mIChpbmNsdWRpbmcpIHRoZSBjb250YWluZXJcclxuICogQHBhcmFtICB7W0Jvb2xlYW5dfSByZWxhdGl2ZVRvTm9uU3RhdGljUGFyZW50ICBXaGV0aGVyIHRoZSByZWN0IHNob3VsZCBiZSByZWxhdGl2ZSB0byB0aGUgcmVsYXRpdmUgcGFyZW50IG9mIChpbmNsdWRpbmcpIHRoZSBjb250YWllbnJcclxuICogQHBhcmFtICB7W0Jvb2xlYW5dfSB1bmRvU2NhbGUgICAgICAgICAgICAgICAgICBXaGV0aGVyIHRoZSBjb250YWluZXIncyBzY2FsZSgpIHNob3VsZCBiZSB1bmRvbmVcclxuICogQHBhcmFtICB7W0hUTUxFbGVtZW50XX0gY29udGFpbmVyICAgICAgICAgICAgICBUaGUgcGFyZW50IHRoZSBlbGVtZW50IHdpbGwgYmUgcGxhY2VkIGluXHJcbiAqIEByZXR1cm4ge09iamVjdH0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVGhlIGJvdW5kaW5nQ2xpZW50UmVjdCBvZiBlbCwgd2l0aCBzcGVjaWZpZWQgYWRqdXN0bWVudHNcclxuICovXG5mdW5jdGlvbiBnZXRSZWN0KGVsLCByZWxhdGl2ZVRvQ29udGFpbmluZ0Jsb2NrLCByZWxhdGl2ZVRvTm9uU3RhdGljUGFyZW50LCB1bmRvU2NhbGUsIGNvbnRhaW5lcikge1xuICBpZiAoIWVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCAmJiBlbCAhPT0gd2luZG93KSByZXR1cm47XG4gIHZhciBlbFJlY3QsIHRvcCwgbGVmdCwgYm90dG9tLCByaWdodCwgaGVpZ2h0LCB3aWR0aDtcbiAgaWYgKGVsICE9PSB3aW5kb3cgJiYgZWwucGFyZW50Tm9kZSAmJiBlbCAhPT0gZ2V0V2luZG93U2Nyb2xsaW5nRWxlbWVudCgpKSB7XG4gICAgZWxSZWN0ID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgdG9wID0gZWxSZWN0LnRvcDtcbiAgICBsZWZ0ID0gZWxSZWN0LmxlZnQ7XG4gICAgYm90dG9tID0gZWxSZWN0LmJvdHRvbTtcbiAgICByaWdodCA9IGVsUmVjdC5yaWdodDtcbiAgICBoZWlnaHQgPSBlbFJlY3QuaGVpZ2h0O1xuICAgIHdpZHRoID0gZWxSZWN0LndpZHRoO1xuICB9IGVsc2Uge1xuICAgIHRvcCA9IDA7XG4gICAgbGVmdCA9IDA7XG4gICAgYm90dG9tID0gd2luZG93LmlubmVySGVpZ2h0O1xuICAgIHJpZ2h0ID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuICAgIHdpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG4gIH1cbiAgaWYgKChyZWxhdGl2ZVRvQ29udGFpbmluZ0Jsb2NrIHx8IHJlbGF0aXZlVG9Ob25TdGF0aWNQYXJlbnQpICYmIGVsICE9PSB3aW5kb3cpIHtcbiAgICAvLyBBZGp1c3QgZm9yIHRyYW5zbGF0ZSgpXG4gICAgY29udGFpbmVyID0gY29udGFpbmVyIHx8IGVsLnBhcmVudE5vZGU7XG5cbiAgICAvLyBzb2x2ZXMgIzExMjMgKHNlZTogaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9hLzM3OTUzODA2LzYwODgzMTIpXG4gICAgLy8gTm90IG5lZWRlZCBvbiA8PSBJRTExXG4gICAgaWYgKCFJRTExT3JMZXNzKSB7XG4gICAgICBkbyB7XG4gICAgICAgIGlmIChjb250YWluZXIgJiYgY29udGFpbmVyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCAmJiAoY3NzKGNvbnRhaW5lciwgJ3RyYW5zZm9ybScpICE9PSAnbm9uZScgfHwgcmVsYXRpdmVUb05vblN0YXRpY1BhcmVudCAmJiBjc3MoY29udGFpbmVyLCAncG9zaXRpb24nKSAhPT0gJ3N0YXRpYycpKSB7XG4gICAgICAgICAgdmFyIGNvbnRhaW5lclJlY3QgPSBjb250YWluZXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICAgICAgICAvLyBTZXQgcmVsYXRpdmUgdG8gZWRnZXMgb2YgcGFkZGluZyBib3ggb2YgY29udGFpbmVyXG4gICAgICAgICAgdG9wIC09IGNvbnRhaW5lclJlY3QudG9wICsgcGFyc2VJbnQoY3NzKGNvbnRhaW5lciwgJ2JvcmRlci10b3Atd2lkdGgnKSk7XG4gICAgICAgICAgbGVmdCAtPSBjb250YWluZXJSZWN0LmxlZnQgKyBwYXJzZUludChjc3MoY29udGFpbmVyLCAnYm9yZGVyLWxlZnQtd2lkdGgnKSk7XG4gICAgICAgICAgYm90dG9tID0gdG9wICsgZWxSZWN0LmhlaWdodDtcbiAgICAgICAgICByaWdodCA9IGxlZnQgKyBlbFJlY3Qud2lkdGg7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgLyoganNoaW50IGJvc3M6dHJ1ZSAqL1xuICAgICAgfSB3aGlsZSAoY29udGFpbmVyID0gY29udGFpbmVyLnBhcmVudE5vZGUpO1xuICAgIH1cbiAgfVxuICBpZiAodW5kb1NjYWxlICYmIGVsICE9PSB3aW5kb3cpIHtcbiAgICAvLyBBZGp1c3QgZm9yIHNjYWxlKClcbiAgICB2YXIgZWxNYXRyaXggPSBtYXRyaXgoY29udGFpbmVyIHx8IGVsKSxcbiAgICAgIHNjYWxlWCA9IGVsTWF0cml4ICYmIGVsTWF0cml4LmEsXG4gICAgICBzY2FsZVkgPSBlbE1hdHJpeCAmJiBlbE1hdHJpeC5kO1xuICAgIGlmIChlbE1hdHJpeCkge1xuICAgICAgdG9wIC89IHNjYWxlWTtcbiAgICAgIGxlZnQgLz0gc2NhbGVYO1xuICAgICAgd2lkdGggLz0gc2NhbGVYO1xuICAgICAgaGVpZ2h0IC89IHNjYWxlWTtcbiAgICAgIGJvdHRvbSA9IHRvcCArIGhlaWdodDtcbiAgICAgIHJpZ2h0ID0gbGVmdCArIHdpZHRoO1xuICAgIH1cbiAgfVxuICByZXR1cm4ge1xuICAgIHRvcDogdG9wLFxuICAgIGxlZnQ6IGxlZnQsXG4gICAgYm90dG9tOiBib3R0b20sXG4gICAgcmlnaHQ6IHJpZ2h0LFxuICAgIHdpZHRoOiB3aWR0aCxcbiAgICBoZWlnaHQ6IGhlaWdodFxuICB9O1xufVxuXG4vKipcclxuICogQ2hlY2tzIGlmIGEgc2lkZSBvZiBhbiBlbGVtZW50IGlzIHNjcm9sbGVkIHBhc3QgYSBzaWRlIG9mIGl0cyBwYXJlbnRzXHJcbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSAgZWwgICAgICAgICAgIFRoZSBlbGVtZW50IHdobydzIHNpZGUgYmVpbmcgc2Nyb2xsZWQgb3V0IG9mIHZpZXcgaXMgaW4gcXVlc3Rpb25cclxuICogQHBhcmFtICB7U3RyaW5nfSAgICAgICBlbFNpZGUgICAgICAgU2lkZSBvZiB0aGUgZWxlbWVudCBpbiBxdWVzdGlvbiAoJ3RvcCcsICdsZWZ0JywgJ3JpZ2h0JywgJ2JvdHRvbScpXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gICAgICAgcGFyZW50U2lkZSAgIFNpZGUgb2YgdGhlIHBhcmVudCBpbiBxdWVzdGlvbiAoJ3RvcCcsICdsZWZ0JywgJ3JpZ2h0JywgJ2JvdHRvbScpXHJcbiAqIEByZXR1cm4ge0hUTUxFbGVtZW50fSAgICAgICAgICAgICAgIFRoZSBwYXJlbnQgc2Nyb2xsIGVsZW1lbnQgdGhhdCB0aGUgZWwncyBzaWRlIGlzIHNjcm9sbGVkIHBhc3QsIG9yIG51bGwgaWYgdGhlcmUgaXMgbm8gc3VjaCBlbGVtZW50XHJcbiAqL1xuZnVuY3Rpb24gaXNTY3JvbGxlZFBhc3QoZWwsIGVsU2lkZSwgcGFyZW50U2lkZSkge1xuICB2YXIgcGFyZW50ID0gZ2V0UGFyZW50QXV0b1Njcm9sbEVsZW1lbnQoZWwsIHRydWUpLFxuICAgIGVsU2lkZVZhbCA9IGdldFJlY3QoZWwpW2VsU2lkZV07XG5cbiAgLyoganNoaW50IGJvc3M6dHJ1ZSAqL1xuICB3aGlsZSAocGFyZW50KSB7XG4gICAgdmFyIHBhcmVudFNpZGVWYWwgPSBnZXRSZWN0KHBhcmVudClbcGFyZW50U2lkZV0sXG4gICAgICB2aXNpYmxlID0gdm9pZCAwO1xuICAgIGlmIChwYXJlbnRTaWRlID09PSAndG9wJyB8fCBwYXJlbnRTaWRlID09PSAnbGVmdCcpIHtcbiAgICAgIHZpc2libGUgPSBlbFNpZGVWYWwgPj0gcGFyZW50U2lkZVZhbDtcbiAgICB9IGVsc2Uge1xuICAgICAgdmlzaWJsZSA9IGVsU2lkZVZhbCA8PSBwYXJlbnRTaWRlVmFsO1xuICAgIH1cbiAgICBpZiAoIXZpc2libGUpIHJldHVybiBwYXJlbnQ7XG4gICAgaWYgKHBhcmVudCA9PT0gZ2V0V2luZG93U2Nyb2xsaW5nRWxlbWVudCgpKSBicmVhaztcbiAgICBwYXJlbnQgPSBnZXRQYXJlbnRBdXRvU2Nyb2xsRWxlbWVudChwYXJlbnQsIGZhbHNlKTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxyXG4gKiBHZXRzIG50aCBjaGlsZCBvZiBlbCwgaWdub3JpbmcgaGlkZGVuIGNoaWxkcmVuLCBzb3J0YWJsZSdzIGVsZW1lbnRzIChkb2VzIG5vdCBpZ25vcmUgY2xvbmUgaWYgaXQncyB2aXNpYmxlKVxyXG4gKiBhbmQgbm9uLWRyYWdnYWJsZSBlbGVtZW50c1xyXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWwgICAgICAgVGhlIHBhcmVudCBlbGVtZW50XHJcbiAqIEBwYXJhbSAge051bWJlcn0gY2hpbGROdW0gICAgICBUaGUgaW5kZXggb2YgdGhlIGNoaWxkXHJcbiAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9ucyAgICAgICBQYXJlbnQgU29ydGFibGUncyBvcHRpb25zXHJcbiAqIEByZXR1cm4ge0hUTUxFbGVtZW50fSAgICAgICAgICBUaGUgY2hpbGQgYXQgaW5kZXggY2hpbGROdW0sIG9yIG51bGwgaWYgbm90IGZvdW5kXHJcbiAqL1xuZnVuY3Rpb24gZ2V0Q2hpbGQoZWwsIGNoaWxkTnVtLCBvcHRpb25zLCBpbmNsdWRlRHJhZ0VsKSB7XG4gIHZhciBjdXJyZW50Q2hpbGQgPSAwLFxuICAgIGkgPSAwLFxuICAgIGNoaWxkcmVuID0gZWwuY2hpbGRyZW47XG4gIHdoaWxlIChpIDwgY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgaWYgKGNoaWxkcmVuW2ldLnN0eWxlLmRpc3BsYXkgIT09ICdub25lJyAmJiBjaGlsZHJlbltpXSAhPT0gU29ydGFibGUuZ2hvc3QgJiYgKGluY2x1ZGVEcmFnRWwgfHwgY2hpbGRyZW5baV0gIT09IFNvcnRhYmxlLmRyYWdnZWQpICYmIGNsb3Nlc3QoY2hpbGRyZW5baV0sIG9wdGlvbnMuZHJhZ2dhYmxlLCBlbCwgZmFsc2UpKSB7XG4gICAgICBpZiAoY3VycmVudENoaWxkID09PSBjaGlsZE51bSkge1xuICAgICAgICByZXR1cm4gY2hpbGRyZW5baV07XG4gICAgICB9XG4gICAgICBjdXJyZW50Q2hpbGQrKztcbiAgICB9XG4gICAgaSsrO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcclxuICogR2V0cyB0aGUgbGFzdCBjaGlsZCBpbiB0aGUgZWwsIGlnbm9yaW5nIGdob3N0RWwgb3IgaW52aXNpYmxlIGVsZW1lbnRzIChjbG9uZXMpXHJcbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBlbCAgICAgICBQYXJlbnQgZWxlbWVudFxyXG4gKiBAcGFyYW0gIHtzZWxlY3Rvcn0gc2VsZWN0b3IgICAgQW55IG90aGVyIGVsZW1lbnRzIHRoYXQgc2hvdWxkIGJlIGlnbm9yZWRcclxuICogQHJldHVybiB7SFRNTEVsZW1lbnR9ICAgICAgICAgIFRoZSBsYXN0IGNoaWxkLCBpZ25vcmluZyBnaG9zdEVsXHJcbiAqL1xuZnVuY3Rpb24gbGFzdENoaWxkKGVsLCBzZWxlY3Rvcikge1xuICB2YXIgbGFzdCA9IGVsLmxhc3RFbGVtZW50Q2hpbGQ7XG4gIHdoaWxlIChsYXN0ICYmIChsYXN0ID09PSBTb3J0YWJsZS5naG9zdCB8fCBjc3MobGFzdCwgJ2Rpc3BsYXknKSA9PT0gJ25vbmUnIHx8IHNlbGVjdG9yICYmICFtYXRjaGVzKGxhc3QsIHNlbGVjdG9yKSkpIHtcbiAgICBsYXN0ID0gbGFzdC5wcmV2aW91c0VsZW1lbnRTaWJsaW5nO1xuICB9XG4gIHJldHVybiBsYXN0IHx8IG51bGw7XG59XG5cbi8qKlxyXG4gKiBSZXR1cm5zIHRoZSBpbmRleCBvZiBhbiBlbGVtZW50IHdpdGhpbiBpdHMgcGFyZW50IGZvciBhIHNlbGVjdGVkIHNldCBvZlxyXG4gKiBlbGVtZW50c1xyXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWxcclxuICogQHBhcmFtICB7c2VsZWN0b3J9IHNlbGVjdG9yXHJcbiAqIEByZXR1cm4ge251bWJlcn1cclxuICovXG5mdW5jdGlvbiBpbmRleChlbCwgc2VsZWN0b3IpIHtcbiAgdmFyIGluZGV4ID0gMDtcbiAgaWYgKCFlbCB8fCAhZWwucGFyZW50Tm9kZSkge1xuICAgIHJldHVybiAtMTtcbiAgfVxuXG4gIC8qIGpzaGludCBib3NzOnRydWUgKi9cbiAgd2hpbGUgKGVsID0gZWwucHJldmlvdXNFbGVtZW50U2libGluZykge1xuICAgIGlmIChlbC5ub2RlTmFtZS50b1VwcGVyQ2FzZSgpICE9PSAnVEVNUExBVEUnICYmIGVsICE9PSBTb3J0YWJsZS5jbG9uZSAmJiAoIXNlbGVjdG9yIHx8IG1hdGNoZXMoZWwsIHNlbGVjdG9yKSkpIHtcbiAgICAgIGluZGV4Kys7XG4gICAgfVxuICB9XG4gIHJldHVybiBpbmRleDtcbn1cblxuLyoqXHJcbiAqIFJldHVybnMgdGhlIHNjcm9sbCBvZmZzZXQgb2YgdGhlIGdpdmVuIGVsZW1lbnQsIGFkZGVkIHdpdGggYWxsIHRoZSBzY3JvbGwgb2Zmc2V0cyBvZiBwYXJlbnQgZWxlbWVudHMuXHJcbiAqIFRoZSB2YWx1ZSBpcyByZXR1cm5lZCBpbiByZWFsIHBpeGVscy5cclxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IGVsXHJcbiAqIEByZXR1cm4ge0FycmF5fSAgICAgICAgICAgICBPZmZzZXRzIGluIHRoZSBmb3JtYXQgb2YgW2xlZnQsIHRvcF1cclxuICovXG5mdW5jdGlvbiBnZXRSZWxhdGl2ZVNjcm9sbE9mZnNldChlbCkge1xuICB2YXIgb2Zmc2V0TGVmdCA9IDAsXG4gICAgb2Zmc2V0VG9wID0gMCxcbiAgICB3aW5TY3JvbGxlciA9IGdldFdpbmRvd1Njcm9sbGluZ0VsZW1lbnQoKTtcbiAgaWYgKGVsKSB7XG4gICAgZG8ge1xuICAgICAgdmFyIGVsTWF0cml4ID0gbWF0cml4KGVsKSxcbiAgICAgICAgc2NhbGVYID0gZWxNYXRyaXguYSxcbiAgICAgICAgc2NhbGVZID0gZWxNYXRyaXguZDtcbiAgICAgIG9mZnNldExlZnQgKz0gZWwuc2Nyb2xsTGVmdCAqIHNjYWxlWDtcbiAgICAgIG9mZnNldFRvcCArPSBlbC5zY3JvbGxUb3AgKiBzY2FsZVk7XG4gICAgfSB3aGlsZSAoZWwgIT09IHdpblNjcm9sbGVyICYmIChlbCA9IGVsLnBhcmVudE5vZGUpKTtcbiAgfVxuICByZXR1cm4gW29mZnNldExlZnQsIG9mZnNldFRvcF07XG59XG5cbi8qKlxyXG4gKiBSZXR1cm5zIHRoZSBpbmRleCBvZiB0aGUgb2JqZWN0IHdpdGhpbiB0aGUgZ2l2ZW4gYXJyYXlcclxuICogQHBhcmFtICB7QXJyYXl9IGFyciAgIEFycmF5IHRoYXQgbWF5IG9yIG1heSBub3QgaG9sZCB0aGUgb2JqZWN0XHJcbiAqIEBwYXJhbSAge09iamVjdH0gb2JqICBBbiBvYmplY3QgdGhhdCBoYXMgYSBrZXktdmFsdWUgcGFpciB1bmlxdWUgdG8gYW5kIGlkZW50aWNhbCB0byBhIGtleS12YWx1ZSBwYWlyIGluIHRoZSBvYmplY3QgeW91IHdhbnQgdG8gZmluZFxyXG4gKiBAcmV0dXJuIHtOdW1iZXJ9ICAgICAgVGhlIGluZGV4IG9mIHRoZSBvYmplY3QgaW4gdGhlIGFycmF5LCBvciAtMVxyXG4gKi9cbmZ1bmN0aW9uIGluZGV4T2ZPYmplY3QoYXJyLCBvYmopIHtcbiAgZm9yICh2YXIgaSBpbiBhcnIpIHtcbiAgICBpZiAoIWFyci5oYXNPd25Qcm9wZXJ0eShpKSkgY29udGludWU7XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIG9ialtrZXldID09PSBhcnJbaV1ba2V5XSkgcmV0dXJuIE51bWJlcihpKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuZnVuY3Rpb24gZ2V0UGFyZW50QXV0b1Njcm9sbEVsZW1lbnQoZWwsIGluY2x1ZGVTZWxmKSB7XG4gIC8vIHNraXAgdG8gd2luZG93XG4gIGlmICghZWwgfHwgIWVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCkgcmV0dXJuIGdldFdpbmRvd1Njcm9sbGluZ0VsZW1lbnQoKTtcbiAgdmFyIGVsZW0gPSBlbDtcbiAgdmFyIGdvdFNlbGYgPSBmYWxzZTtcbiAgZG8ge1xuICAgIC8vIHdlIGRvbid0IG5lZWQgdG8gZ2V0IGVsZW0gY3NzIGlmIGl0IGlzbid0IGV2ZW4gb3ZlcmZsb3dpbmcgaW4gdGhlIGZpcnN0IHBsYWNlIChwZXJmb3JtYW5jZSlcbiAgICBpZiAoZWxlbS5jbGllbnRXaWR0aCA8IGVsZW0uc2Nyb2xsV2lkdGggfHwgZWxlbS5jbGllbnRIZWlnaHQgPCBlbGVtLnNjcm9sbEhlaWdodCkge1xuICAgICAgdmFyIGVsZW1DU1MgPSBjc3MoZWxlbSk7XG4gICAgICBpZiAoZWxlbS5jbGllbnRXaWR0aCA8IGVsZW0uc2Nyb2xsV2lkdGggJiYgKGVsZW1DU1Mub3ZlcmZsb3dYID09ICdhdXRvJyB8fCBlbGVtQ1NTLm92ZXJmbG93WCA9PSAnc2Nyb2xsJykgfHwgZWxlbS5jbGllbnRIZWlnaHQgPCBlbGVtLnNjcm9sbEhlaWdodCAmJiAoZWxlbUNTUy5vdmVyZmxvd1kgPT0gJ2F1dG8nIHx8IGVsZW1DU1Mub3ZlcmZsb3dZID09ICdzY3JvbGwnKSkge1xuICAgICAgICBpZiAoIWVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0IHx8IGVsZW0gPT09IGRvY3VtZW50LmJvZHkpIHJldHVybiBnZXRXaW5kb3dTY3JvbGxpbmdFbGVtZW50KCk7XG4gICAgICAgIGlmIChnb3RTZWxmIHx8IGluY2x1ZGVTZWxmKSByZXR1cm4gZWxlbTtcbiAgICAgICAgZ290U2VsZiA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIC8qIGpzaGludCBib3NzOnRydWUgKi9cbiAgfSB3aGlsZSAoZWxlbSA9IGVsZW0ucGFyZW50Tm9kZSk7XG4gIHJldHVybiBnZXRXaW5kb3dTY3JvbGxpbmdFbGVtZW50KCk7XG59XG5mdW5jdGlvbiBleHRlbmQoZHN0LCBzcmMpIHtcbiAgaWYgKGRzdCAmJiBzcmMpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gc3JjKSB7XG4gICAgICBpZiAoc3JjLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgZHN0W2tleV0gPSBzcmNba2V5XTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRzdDtcbn1cbmZ1bmN0aW9uIGlzUmVjdEVxdWFsKHJlY3QxLCByZWN0Mikge1xuICByZXR1cm4gTWF0aC5yb3VuZChyZWN0MS50b3ApID09PSBNYXRoLnJvdW5kKHJlY3QyLnRvcCkgJiYgTWF0aC5yb3VuZChyZWN0MS5sZWZ0KSA9PT0gTWF0aC5yb3VuZChyZWN0Mi5sZWZ0KSAmJiBNYXRoLnJvdW5kKHJlY3QxLmhlaWdodCkgPT09IE1hdGgucm91bmQocmVjdDIuaGVpZ2h0KSAmJiBNYXRoLnJvdW5kKHJlY3QxLndpZHRoKSA9PT0gTWF0aC5yb3VuZChyZWN0Mi53aWR0aCk7XG59XG52YXIgX3Rocm90dGxlVGltZW91dDtcbmZ1bmN0aW9uIHRocm90dGxlKGNhbGxiYWNrLCBtcykge1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIGlmICghX3Rocm90dGxlVGltZW91dCkge1xuICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHMsXG4gICAgICAgIF90aGlzID0gdGhpcztcbiAgICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICBjYWxsYmFjay5jYWxsKF90aGlzLCBhcmdzWzBdKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNhbGxiYWNrLmFwcGx5KF90aGlzLCBhcmdzKTtcbiAgICAgIH1cbiAgICAgIF90aHJvdHRsZVRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgX3Rocm90dGxlVGltZW91dCA9IHZvaWQgMDtcbiAgICAgIH0sIG1zKTtcbiAgICB9XG4gIH07XG59XG5mdW5jdGlvbiBjYW5jZWxUaHJvdHRsZSgpIHtcbiAgY2xlYXJUaW1lb3V0KF90aHJvdHRsZVRpbWVvdXQpO1xuICBfdGhyb3R0bGVUaW1lb3V0ID0gdm9pZCAwO1xufVxuZnVuY3Rpb24gc2Nyb2xsQnkoZWwsIHgsIHkpIHtcbiAgZWwuc2Nyb2xsTGVmdCArPSB4O1xuICBlbC5zY3JvbGxUb3AgKz0geTtcbn1cbmZ1bmN0aW9uIGNsb25lKGVsKSB7XG4gIHZhciBQb2x5bWVyID0gd2luZG93LlBvbHltZXI7XG4gIHZhciAkID0gd2luZG93LmpRdWVyeSB8fCB3aW5kb3cuWmVwdG87XG4gIGlmIChQb2x5bWVyICYmIFBvbHltZXIuZG9tKSB7XG4gICAgcmV0dXJuIFBvbHltZXIuZG9tKGVsKS5jbG9uZU5vZGUodHJ1ZSk7XG4gIH0gZWxzZSBpZiAoJCkge1xuICAgIHJldHVybiAkKGVsKS5jbG9uZSh0cnVlKVswXTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZWwuY2xvbmVOb2RlKHRydWUpO1xuICB9XG59XG5mdW5jdGlvbiBzZXRSZWN0KGVsLCByZWN0KSB7XG4gIGNzcyhlbCwgJ3Bvc2l0aW9uJywgJ2Fic29sdXRlJyk7XG4gIGNzcyhlbCwgJ3RvcCcsIHJlY3QudG9wKTtcbiAgY3NzKGVsLCAnbGVmdCcsIHJlY3QubGVmdCk7XG4gIGNzcyhlbCwgJ3dpZHRoJywgcmVjdC53aWR0aCk7XG4gIGNzcyhlbCwgJ2hlaWdodCcsIHJlY3QuaGVpZ2h0KTtcbn1cbmZ1bmN0aW9uIHVuc2V0UmVjdChlbCkge1xuICBjc3MoZWwsICdwb3NpdGlvbicsICcnKTtcbiAgY3NzKGVsLCAndG9wJywgJycpO1xuICBjc3MoZWwsICdsZWZ0JywgJycpO1xuICBjc3MoZWwsICd3aWR0aCcsICcnKTtcbiAgY3NzKGVsLCAnaGVpZ2h0JywgJycpO1xufVxuZnVuY3Rpb24gZ2V0Q2hpbGRDb250YWluaW5nUmVjdEZyb21FbGVtZW50KGNvbnRhaW5lciwgb3B0aW9ucywgZ2hvc3RFbCkge1xuICB2YXIgcmVjdCA9IHt9O1xuICBBcnJheS5mcm9tKGNvbnRhaW5lci5jaGlsZHJlbikuZm9yRWFjaChmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICB2YXIgX3JlY3QkbGVmdCwgX3JlY3QkdG9wLCBfcmVjdCRyaWdodCwgX3JlY3QkYm90dG9tO1xuICAgIGlmICghY2xvc2VzdChjaGlsZCwgb3B0aW9ucy5kcmFnZ2FibGUsIGNvbnRhaW5lciwgZmFsc2UpIHx8IGNoaWxkLmFuaW1hdGVkIHx8IGNoaWxkID09PSBnaG9zdEVsKSByZXR1cm47XG4gICAgdmFyIGNoaWxkUmVjdCA9IGdldFJlY3QoY2hpbGQpO1xuICAgIHJlY3QubGVmdCA9IE1hdGgubWluKChfcmVjdCRsZWZ0ID0gcmVjdC5sZWZ0KSAhPT0gbnVsbCAmJiBfcmVjdCRsZWZ0ICE9PSB2b2lkIDAgPyBfcmVjdCRsZWZ0IDogSW5maW5pdHksIGNoaWxkUmVjdC5sZWZ0KTtcbiAgICByZWN0LnRvcCA9IE1hdGgubWluKChfcmVjdCR0b3AgPSByZWN0LnRvcCkgIT09IG51bGwgJiYgX3JlY3QkdG9wICE9PSB2b2lkIDAgPyBfcmVjdCR0b3AgOiBJbmZpbml0eSwgY2hpbGRSZWN0LnRvcCk7XG4gICAgcmVjdC5yaWdodCA9IE1hdGgubWF4KChfcmVjdCRyaWdodCA9IHJlY3QucmlnaHQpICE9PSBudWxsICYmIF9yZWN0JHJpZ2h0ICE9PSB2b2lkIDAgPyBfcmVjdCRyaWdodCA6IC1JbmZpbml0eSwgY2hpbGRSZWN0LnJpZ2h0KTtcbiAgICByZWN0LmJvdHRvbSA9IE1hdGgubWF4KChfcmVjdCRib3R0b20gPSByZWN0LmJvdHRvbSkgIT09IG51bGwgJiYgX3JlY3QkYm90dG9tICE9PSB2b2lkIDAgPyBfcmVjdCRib3R0b20gOiAtSW5maW5pdHksIGNoaWxkUmVjdC5ib3R0b20pO1xuICB9KTtcbiAgcmVjdC53aWR0aCA9IHJlY3QucmlnaHQgLSByZWN0LmxlZnQ7XG4gIHJlY3QuaGVpZ2h0ID0gcmVjdC5ib3R0b20gLSByZWN0LnRvcDtcbiAgcmVjdC54ID0gcmVjdC5sZWZ0O1xuICByZWN0LnkgPSByZWN0LnRvcDtcbiAgcmV0dXJuIHJlY3Q7XG59XG52YXIgZXhwYW5kbyA9ICdTb3J0YWJsZScgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblxuZnVuY3Rpb24gQW5pbWF0aW9uU3RhdGVNYW5hZ2VyKCkge1xuICB2YXIgYW5pbWF0aW9uU3RhdGVzID0gW10sXG4gICAgYW5pbWF0aW9uQ2FsbGJhY2tJZDtcbiAgcmV0dXJuIHtcbiAgICBjYXB0dXJlQW5pbWF0aW9uU3RhdGU6IGZ1bmN0aW9uIGNhcHR1cmVBbmltYXRpb25TdGF0ZSgpIHtcbiAgICAgIGFuaW1hdGlvblN0YXRlcyA9IFtdO1xuICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuYW5pbWF0aW9uKSByZXR1cm47XG4gICAgICB2YXIgY2hpbGRyZW4gPSBbXS5zbGljZS5jYWxsKHRoaXMuZWwuY2hpbGRyZW4pO1xuICAgICAgY2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICAgICAgaWYgKGNzcyhjaGlsZCwgJ2Rpc3BsYXknKSA9PT0gJ25vbmUnIHx8IGNoaWxkID09PSBTb3J0YWJsZS5naG9zdCkgcmV0dXJuO1xuICAgICAgICBhbmltYXRpb25TdGF0ZXMucHVzaCh7XG4gICAgICAgICAgdGFyZ2V0OiBjaGlsZCxcbiAgICAgICAgICByZWN0OiBnZXRSZWN0KGNoaWxkKVxuICAgICAgICB9KTtcbiAgICAgICAgdmFyIGZyb21SZWN0ID0gX29iamVjdFNwcmVhZDIoe30sIGFuaW1hdGlvblN0YXRlc1thbmltYXRpb25TdGF0ZXMubGVuZ3RoIC0gMV0ucmVjdCk7XG5cbiAgICAgICAgLy8gSWYgYW5pbWF0aW5nOiBjb21wZW5zYXRlIGZvciBjdXJyZW50IGFuaW1hdGlvblxuICAgICAgICBpZiAoY2hpbGQudGhpc0FuaW1hdGlvbkR1cmF0aW9uKSB7XG4gICAgICAgICAgdmFyIGNoaWxkTWF0cml4ID0gbWF0cml4KGNoaWxkLCB0cnVlKTtcbiAgICAgICAgICBpZiAoY2hpbGRNYXRyaXgpIHtcbiAgICAgICAgICAgIGZyb21SZWN0LnRvcCAtPSBjaGlsZE1hdHJpeC5mO1xuICAgICAgICAgICAgZnJvbVJlY3QubGVmdCAtPSBjaGlsZE1hdHJpeC5lO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjaGlsZC5mcm9tUmVjdCA9IGZyb21SZWN0O1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBhZGRBbmltYXRpb25TdGF0ZTogZnVuY3Rpb24gYWRkQW5pbWF0aW9uU3RhdGUoc3RhdGUpIHtcbiAgICAgIGFuaW1hdGlvblN0YXRlcy5wdXNoKHN0YXRlKTtcbiAgICB9LFxuICAgIHJlbW92ZUFuaW1hdGlvblN0YXRlOiBmdW5jdGlvbiByZW1vdmVBbmltYXRpb25TdGF0ZSh0YXJnZXQpIHtcbiAgICAgIGFuaW1hdGlvblN0YXRlcy5zcGxpY2UoaW5kZXhPZk9iamVjdChhbmltYXRpb25TdGF0ZXMsIHtcbiAgICAgICAgdGFyZ2V0OiB0YXJnZXRcbiAgICAgIH0pLCAxKTtcbiAgICB9LFxuICAgIGFuaW1hdGVBbGw6IGZ1bmN0aW9uIGFuaW1hdGVBbGwoY2FsbGJhY2spIHtcbiAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICBpZiAoIXRoaXMub3B0aW9ucy5hbmltYXRpb24pIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGFuaW1hdGlvbkNhbGxiYWNrSWQpO1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjaygpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB2YXIgYW5pbWF0aW5nID0gZmFsc2UsXG4gICAgICAgIGFuaW1hdGlvblRpbWUgPSAwO1xuICAgICAgYW5pbWF0aW9uU3RhdGVzLmZvckVhY2goZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgIHZhciB0aW1lID0gMCxcbiAgICAgICAgICB0YXJnZXQgPSBzdGF0ZS50YXJnZXQsXG4gICAgICAgICAgZnJvbVJlY3QgPSB0YXJnZXQuZnJvbVJlY3QsXG4gICAgICAgICAgdG9SZWN0ID0gZ2V0UmVjdCh0YXJnZXQpLFxuICAgICAgICAgIHByZXZGcm9tUmVjdCA9IHRhcmdldC5wcmV2RnJvbVJlY3QsXG4gICAgICAgICAgcHJldlRvUmVjdCA9IHRhcmdldC5wcmV2VG9SZWN0LFxuICAgICAgICAgIGFuaW1hdGluZ1JlY3QgPSBzdGF0ZS5yZWN0LFxuICAgICAgICAgIHRhcmdldE1hdHJpeCA9IG1hdHJpeCh0YXJnZXQsIHRydWUpO1xuICAgICAgICBpZiAodGFyZ2V0TWF0cml4KSB7XG4gICAgICAgICAgLy8gQ29tcGVuc2F0ZSBmb3IgY3VycmVudCBhbmltYXRpb25cbiAgICAgICAgICB0b1JlY3QudG9wIC09IHRhcmdldE1hdHJpeC5mO1xuICAgICAgICAgIHRvUmVjdC5sZWZ0IC09IHRhcmdldE1hdHJpeC5lO1xuICAgICAgICB9XG4gICAgICAgIHRhcmdldC50b1JlY3QgPSB0b1JlY3Q7XG4gICAgICAgIGlmICh0YXJnZXQudGhpc0FuaW1hdGlvbkR1cmF0aW9uKSB7XG4gICAgICAgICAgLy8gQ291bGQgYWxzbyBjaGVjayBpZiBhbmltYXRpbmdSZWN0IGlzIGJldHdlZW4gZnJvbVJlY3QgYW5kIHRvUmVjdFxuICAgICAgICAgIGlmIChpc1JlY3RFcXVhbChwcmV2RnJvbVJlY3QsIHRvUmVjdCkgJiYgIWlzUmVjdEVxdWFsKGZyb21SZWN0LCB0b1JlY3QpICYmXG4gICAgICAgICAgLy8gTWFrZSBzdXJlIGFuaW1hdGluZ1JlY3QgaXMgb24gbGluZSBiZXR3ZWVuIHRvUmVjdCAmIGZyb21SZWN0XG4gICAgICAgICAgKGFuaW1hdGluZ1JlY3QudG9wIC0gdG9SZWN0LnRvcCkgLyAoYW5pbWF0aW5nUmVjdC5sZWZ0IC0gdG9SZWN0LmxlZnQpID09PSAoZnJvbVJlY3QudG9wIC0gdG9SZWN0LnRvcCkgLyAoZnJvbVJlY3QubGVmdCAtIHRvUmVjdC5sZWZ0KSkge1xuICAgICAgICAgICAgLy8gSWYgcmV0dXJuaW5nIHRvIHNhbWUgcGxhY2UgYXMgc3RhcnRlZCBmcm9tIGFuaW1hdGlvbiBhbmQgb24gc2FtZSBheGlzXG4gICAgICAgICAgICB0aW1lID0gY2FsY3VsYXRlUmVhbFRpbWUoYW5pbWF0aW5nUmVjdCwgcHJldkZyb21SZWN0LCBwcmV2VG9SZWN0LCBfdGhpcy5vcHRpb25zKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiBmcm9tUmVjdCAhPSB0b1JlY3Q6IGFuaW1hdGVcbiAgICAgICAgaWYgKCFpc1JlY3RFcXVhbCh0b1JlY3QsIGZyb21SZWN0KSkge1xuICAgICAgICAgIHRhcmdldC5wcmV2RnJvbVJlY3QgPSBmcm9tUmVjdDtcbiAgICAgICAgICB0YXJnZXQucHJldlRvUmVjdCA9IHRvUmVjdDtcbiAgICAgICAgICBpZiAoIXRpbWUpIHtcbiAgICAgICAgICAgIHRpbWUgPSBfdGhpcy5vcHRpb25zLmFuaW1hdGlvbjtcbiAgICAgICAgICB9XG4gICAgICAgICAgX3RoaXMuYW5pbWF0ZSh0YXJnZXQsIGFuaW1hdGluZ1JlY3QsIHRvUmVjdCwgdGltZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRpbWUpIHtcbiAgICAgICAgICBhbmltYXRpbmcgPSB0cnVlO1xuICAgICAgICAgIGFuaW1hdGlvblRpbWUgPSBNYXRoLm1heChhbmltYXRpb25UaW1lLCB0aW1lKTtcbiAgICAgICAgICBjbGVhclRpbWVvdXQodGFyZ2V0LmFuaW1hdGlvblJlc2V0VGltZXIpO1xuICAgICAgICAgIHRhcmdldC5hbmltYXRpb25SZXNldFRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0YXJnZXQuYW5pbWF0aW9uVGltZSA9IDA7XG4gICAgICAgICAgICB0YXJnZXQucHJldkZyb21SZWN0ID0gbnVsbDtcbiAgICAgICAgICAgIHRhcmdldC5mcm9tUmVjdCA9IG51bGw7XG4gICAgICAgICAgICB0YXJnZXQucHJldlRvUmVjdCA9IG51bGw7XG4gICAgICAgICAgICB0YXJnZXQudGhpc0FuaW1hdGlvbkR1cmF0aW9uID0gbnVsbDtcbiAgICAgICAgICB9LCB0aW1lKTtcbiAgICAgICAgICB0YXJnZXQudGhpc0FuaW1hdGlvbkR1cmF0aW9uID0gdGltZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBjbGVhclRpbWVvdXQoYW5pbWF0aW9uQ2FsbGJhY2tJZCk7XG4gICAgICBpZiAoIWFuaW1hdGluZykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjaygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYW5pbWF0aW9uQ2FsbGJhY2tJZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKCk7XG4gICAgICAgIH0sIGFuaW1hdGlvblRpbWUpO1xuICAgICAgfVxuICAgICAgYW5pbWF0aW9uU3RhdGVzID0gW107XG4gICAgfSxcbiAgICBhbmltYXRlOiBmdW5jdGlvbiBhbmltYXRlKHRhcmdldCwgY3VycmVudFJlY3QsIHRvUmVjdCwgZHVyYXRpb24pIHtcbiAgICAgIGlmIChkdXJhdGlvbikge1xuICAgICAgICBjc3ModGFyZ2V0LCAndHJhbnNpdGlvbicsICcnKTtcbiAgICAgICAgY3NzKHRhcmdldCwgJ3RyYW5zZm9ybScsICcnKTtcbiAgICAgICAgdmFyIGVsTWF0cml4ID0gbWF0cml4KHRoaXMuZWwpLFxuICAgICAgICAgIHNjYWxlWCA9IGVsTWF0cml4ICYmIGVsTWF0cml4LmEsXG4gICAgICAgICAgc2NhbGVZID0gZWxNYXRyaXggJiYgZWxNYXRyaXguZCxcbiAgICAgICAgICB0cmFuc2xhdGVYID0gKGN1cnJlbnRSZWN0LmxlZnQgLSB0b1JlY3QubGVmdCkgLyAoc2NhbGVYIHx8IDEpLFxuICAgICAgICAgIHRyYW5zbGF0ZVkgPSAoY3VycmVudFJlY3QudG9wIC0gdG9SZWN0LnRvcCkgLyAoc2NhbGVZIHx8IDEpO1xuICAgICAgICB0YXJnZXQuYW5pbWF0aW5nWCA9ICEhdHJhbnNsYXRlWDtcbiAgICAgICAgdGFyZ2V0LmFuaW1hdGluZ1kgPSAhIXRyYW5zbGF0ZVk7XG4gICAgICAgIGNzcyh0YXJnZXQsICd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlM2QoJyArIHRyYW5zbGF0ZVggKyAncHgsJyArIHRyYW5zbGF0ZVkgKyAncHgsMCknKTtcbiAgICAgICAgdGhpcy5mb3JSZXBhaW50RHVtbXkgPSByZXBhaW50KHRhcmdldCk7IC8vIHJlcGFpbnRcblxuICAgICAgICBjc3ModGFyZ2V0LCAndHJhbnNpdGlvbicsICd0cmFuc2Zvcm0gJyArIGR1cmF0aW9uICsgJ21zJyArICh0aGlzLm9wdGlvbnMuZWFzaW5nID8gJyAnICsgdGhpcy5vcHRpb25zLmVhc2luZyA6ICcnKSk7XG4gICAgICAgIGNzcyh0YXJnZXQsICd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlM2QoMCwwLDApJyk7XG4gICAgICAgIHR5cGVvZiB0YXJnZXQuYW5pbWF0ZWQgPT09ICdudW1iZXInICYmIGNsZWFyVGltZW91dCh0YXJnZXQuYW5pbWF0ZWQpO1xuICAgICAgICB0YXJnZXQuYW5pbWF0ZWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjc3ModGFyZ2V0LCAndHJhbnNpdGlvbicsICcnKTtcbiAgICAgICAgICBjc3ModGFyZ2V0LCAndHJhbnNmb3JtJywgJycpO1xuICAgICAgICAgIHRhcmdldC5hbmltYXRlZCA9IGZhbHNlO1xuICAgICAgICAgIHRhcmdldC5hbmltYXRpbmdYID0gZmFsc2U7XG4gICAgICAgICAgdGFyZ2V0LmFuaW1hdGluZ1kgPSBmYWxzZTtcbiAgICAgICAgfSwgZHVyYXRpb24pO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn1cbmZ1bmN0aW9uIHJlcGFpbnQodGFyZ2V0KSB7XG4gIHJldHVybiB0YXJnZXQub2Zmc2V0V2lkdGg7XG59XG5mdW5jdGlvbiBjYWxjdWxhdGVSZWFsVGltZShhbmltYXRpbmdSZWN0LCBmcm9tUmVjdCwgdG9SZWN0LCBvcHRpb25zKSB7XG4gIHJldHVybiBNYXRoLnNxcnQoTWF0aC5wb3coZnJvbVJlY3QudG9wIC0gYW5pbWF0aW5nUmVjdC50b3AsIDIpICsgTWF0aC5wb3coZnJvbVJlY3QubGVmdCAtIGFuaW1hdGluZ1JlY3QubGVmdCwgMikpIC8gTWF0aC5zcXJ0KE1hdGgucG93KGZyb21SZWN0LnRvcCAtIHRvUmVjdC50b3AsIDIpICsgTWF0aC5wb3coZnJvbVJlY3QubGVmdCAtIHRvUmVjdC5sZWZ0LCAyKSkgKiBvcHRpb25zLmFuaW1hdGlvbjtcbn1cblxudmFyIHBsdWdpbnMgPSBbXTtcbnZhciBkZWZhdWx0cyA9IHtcbiAgaW5pdGlhbGl6ZUJ5RGVmYXVsdDogdHJ1ZVxufTtcbnZhciBQbHVnaW5NYW5hZ2VyID0ge1xuICBtb3VudDogZnVuY3Rpb24gbW91bnQocGx1Z2luKSB7XG4gICAgLy8gU2V0IGRlZmF1bHQgc3RhdGljIHByb3BlcnRpZXNcbiAgICBmb3IgKHZhciBvcHRpb24gaW4gZGVmYXVsdHMpIHtcbiAgICAgIGlmIChkZWZhdWx0cy5oYXNPd25Qcm9wZXJ0eShvcHRpb24pICYmICEob3B0aW9uIGluIHBsdWdpbikpIHtcbiAgICAgICAgcGx1Z2luW29wdGlvbl0gPSBkZWZhdWx0c1tvcHRpb25dO1xuICAgICAgfVxuICAgIH1cbiAgICBwbHVnaW5zLmZvckVhY2goZnVuY3Rpb24gKHApIHtcbiAgICAgIGlmIChwLnBsdWdpbk5hbWUgPT09IHBsdWdpbi5wbHVnaW5OYW1lKSB7XG4gICAgICAgIHRocm93IFwiU29ydGFibGU6IENhbm5vdCBtb3VudCBwbHVnaW4gXCIuY29uY2F0KHBsdWdpbi5wbHVnaW5OYW1lLCBcIiBtb3JlIHRoYW4gb25jZVwiKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBwbHVnaW5zLnB1c2gocGx1Z2luKTtcbiAgfSxcbiAgcGx1Z2luRXZlbnQ6IGZ1bmN0aW9uIHBsdWdpbkV2ZW50KGV2ZW50TmFtZSwgc29ydGFibGUsIGV2dCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgdGhpcy5ldmVudENhbmNlbGVkID0gZmFsc2U7XG4gICAgZXZ0LmNhbmNlbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIF90aGlzLmV2ZW50Q2FuY2VsZWQgPSB0cnVlO1xuICAgIH07XG4gICAgdmFyIGV2ZW50TmFtZUdsb2JhbCA9IGV2ZW50TmFtZSArICdHbG9iYWwnO1xuICAgIHBsdWdpbnMuZm9yRWFjaChmdW5jdGlvbiAocGx1Z2luKSB7XG4gICAgICBpZiAoIXNvcnRhYmxlW3BsdWdpbi5wbHVnaW5OYW1lXSkgcmV0dXJuO1xuICAgICAgLy8gRmlyZSBnbG9iYWwgZXZlbnRzIGlmIGl0IGV4aXN0cyBpbiB0aGlzIHNvcnRhYmxlXG4gICAgICBpZiAoc29ydGFibGVbcGx1Z2luLnBsdWdpbk5hbWVdW2V2ZW50TmFtZUdsb2JhbF0pIHtcbiAgICAgICAgc29ydGFibGVbcGx1Z2luLnBsdWdpbk5hbWVdW2V2ZW50TmFtZUdsb2JhbF0oX29iamVjdFNwcmVhZDIoe1xuICAgICAgICAgIHNvcnRhYmxlOiBzb3J0YWJsZVxuICAgICAgICB9LCBldnQpKTtcbiAgICAgIH1cblxuICAgICAgLy8gT25seSBmaXJlIHBsdWdpbiBldmVudCBpZiBwbHVnaW4gaXMgZW5hYmxlZCBpbiB0aGlzIHNvcnRhYmxlLFxuICAgICAgLy8gYW5kIHBsdWdpbiBoYXMgZXZlbnQgZGVmaW5lZFxuICAgICAgaWYgKHNvcnRhYmxlLm9wdGlvbnNbcGx1Z2luLnBsdWdpbk5hbWVdICYmIHNvcnRhYmxlW3BsdWdpbi5wbHVnaW5OYW1lXVtldmVudE5hbWVdKSB7XG4gICAgICAgIHNvcnRhYmxlW3BsdWdpbi5wbHVnaW5OYW1lXVtldmVudE5hbWVdKF9vYmplY3RTcHJlYWQyKHtcbiAgICAgICAgICBzb3J0YWJsZTogc29ydGFibGVcbiAgICAgICAgfSwgZXZ0KSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG4gIGluaXRpYWxpemVQbHVnaW5zOiBmdW5jdGlvbiBpbml0aWFsaXplUGx1Z2lucyhzb3J0YWJsZSwgZWwsIGRlZmF1bHRzLCBvcHRpb25zKSB7XG4gICAgcGx1Z2lucy5mb3JFYWNoKGZ1bmN0aW9uIChwbHVnaW4pIHtcbiAgICAgIHZhciBwbHVnaW5OYW1lID0gcGx1Z2luLnBsdWdpbk5hbWU7XG4gICAgICBpZiAoIXNvcnRhYmxlLm9wdGlvbnNbcGx1Z2luTmFtZV0gJiYgIXBsdWdpbi5pbml0aWFsaXplQnlEZWZhdWx0KSByZXR1cm47XG4gICAgICB2YXIgaW5pdGlhbGl6ZWQgPSBuZXcgcGx1Z2luKHNvcnRhYmxlLCBlbCwgc29ydGFibGUub3B0aW9ucyk7XG4gICAgICBpbml0aWFsaXplZC5zb3J0YWJsZSA9IHNvcnRhYmxlO1xuICAgICAgaW5pdGlhbGl6ZWQub3B0aW9ucyA9IHNvcnRhYmxlLm9wdGlvbnM7XG4gICAgICBzb3J0YWJsZVtwbHVnaW5OYW1lXSA9IGluaXRpYWxpemVkO1xuXG4gICAgICAvLyBBZGQgZGVmYXVsdCBvcHRpb25zIGZyb20gcGx1Z2luXG4gICAgICBfZXh0ZW5kcyhkZWZhdWx0cywgaW5pdGlhbGl6ZWQuZGVmYXVsdHMpO1xuICAgIH0pO1xuICAgIGZvciAodmFyIG9wdGlvbiBpbiBzb3J0YWJsZS5vcHRpb25zKSB7XG4gICAgICBpZiAoIXNvcnRhYmxlLm9wdGlvbnMuaGFzT3duUHJvcGVydHkob3B0aW9uKSkgY29udGludWU7XG4gICAgICB2YXIgbW9kaWZpZWQgPSB0aGlzLm1vZGlmeU9wdGlvbihzb3J0YWJsZSwgb3B0aW9uLCBzb3J0YWJsZS5vcHRpb25zW29wdGlvbl0pO1xuICAgICAgaWYgKHR5cGVvZiBtb2RpZmllZCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgc29ydGFibGUub3B0aW9uc1tvcHRpb25dID0gbW9kaWZpZWQ7XG4gICAgICB9XG4gICAgfVxuICB9LFxuICBnZXRFdmVudFByb3BlcnRpZXM6IGZ1bmN0aW9uIGdldEV2ZW50UHJvcGVydGllcyhuYW1lLCBzb3J0YWJsZSkge1xuICAgIHZhciBldmVudFByb3BlcnRpZXMgPSB7fTtcbiAgICBwbHVnaW5zLmZvckVhY2goZnVuY3Rpb24gKHBsdWdpbikge1xuICAgICAgaWYgKHR5cGVvZiBwbHVnaW4uZXZlbnRQcm9wZXJ0aWVzICE9PSAnZnVuY3Rpb24nKSByZXR1cm47XG4gICAgICBfZXh0ZW5kcyhldmVudFByb3BlcnRpZXMsIHBsdWdpbi5ldmVudFByb3BlcnRpZXMuY2FsbChzb3J0YWJsZVtwbHVnaW4ucGx1Z2luTmFtZV0sIG5hbWUpKTtcbiAgICB9KTtcbiAgICByZXR1cm4gZXZlbnRQcm9wZXJ0aWVzO1xuICB9LFxuICBtb2RpZnlPcHRpb246IGZ1bmN0aW9uIG1vZGlmeU9wdGlvbihzb3J0YWJsZSwgbmFtZSwgdmFsdWUpIHtcbiAgICB2YXIgbW9kaWZpZWRWYWx1ZTtcbiAgICBwbHVnaW5zLmZvckVhY2goZnVuY3Rpb24gKHBsdWdpbikge1xuICAgICAgLy8gUGx1Z2luIG11c3QgZXhpc3Qgb24gdGhlIFNvcnRhYmxlXG4gICAgICBpZiAoIXNvcnRhYmxlW3BsdWdpbi5wbHVnaW5OYW1lXSkgcmV0dXJuO1xuXG4gICAgICAvLyBJZiBzdGF0aWMgb3B0aW9uIGxpc3RlbmVyIGV4aXN0cyBmb3IgdGhpcyBvcHRpb24sIGNhbGwgaW4gdGhlIGNvbnRleHQgb2YgdGhlIFNvcnRhYmxlJ3MgaW5zdGFuY2Ugb2YgdGhpcyBwbHVnaW5cbiAgICAgIGlmIChwbHVnaW4ub3B0aW9uTGlzdGVuZXJzICYmIHR5cGVvZiBwbHVnaW4ub3B0aW9uTGlzdGVuZXJzW25hbWVdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIG1vZGlmaWVkVmFsdWUgPSBwbHVnaW4ub3B0aW9uTGlzdGVuZXJzW25hbWVdLmNhbGwoc29ydGFibGVbcGx1Z2luLnBsdWdpbk5hbWVdLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG1vZGlmaWVkVmFsdWU7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGRpc3BhdGNoRXZlbnQoX3JlZikge1xuICB2YXIgc29ydGFibGUgPSBfcmVmLnNvcnRhYmxlLFxuICAgIHJvb3RFbCA9IF9yZWYucm9vdEVsLFxuICAgIG5hbWUgPSBfcmVmLm5hbWUsXG4gICAgdGFyZ2V0RWwgPSBfcmVmLnRhcmdldEVsLFxuICAgIGNsb25lRWwgPSBfcmVmLmNsb25lRWwsXG4gICAgdG9FbCA9IF9yZWYudG9FbCxcbiAgICBmcm9tRWwgPSBfcmVmLmZyb21FbCxcbiAgICBvbGRJbmRleCA9IF9yZWYub2xkSW5kZXgsXG4gICAgbmV3SW5kZXggPSBfcmVmLm5ld0luZGV4LFxuICAgIG9sZERyYWdnYWJsZUluZGV4ID0gX3JlZi5vbGREcmFnZ2FibGVJbmRleCxcbiAgICBuZXdEcmFnZ2FibGVJbmRleCA9IF9yZWYubmV3RHJhZ2dhYmxlSW5kZXgsXG4gICAgb3JpZ2luYWxFdmVudCA9IF9yZWYub3JpZ2luYWxFdmVudCxcbiAgICBwdXRTb3J0YWJsZSA9IF9yZWYucHV0U29ydGFibGUsXG4gICAgZXh0cmFFdmVudFByb3BlcnRpZXMgPSBfcmVmLmV4dHJhRXZlbnRQcm9wZXJ0aWVzO1xuICBzb3J0YWJsZSA9IHNvcnRhYmxlIHx8IHJvb3RFbCAmJiByb290RWxbZXhwYW5kb107XG4gIGlmICghc29ydGFibGUpIHJldHVybjtcbiAgdmFyIGV2dCxcbiAgICBvcHRpb25zID0gc29ydGFibGUub3B0aW9ucyxcbiAgICBvbk5hbWUgPSAnb24nICsgbmFtZS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIG5hbWUuc3Vic3RyKDEpO1xuICAvLyBTdXBwb3J0IGZvciBuZXcgQ3VzdG9tRXZlbnQgZmVhdHVyZVxuICBpZiAod2luZG93LkN1c3RvbUV2ZW50ICYmICFJRTExT3JMZXNzICYmICFFZGdlKSB7XG4gICAgZXZ0ID0gbmV3IEN1c3RvbUV2ZW50KG5hbWUsIHtcbiAgICAgIGJ1YmJsZXM6IHRydWUsXG4gICAgICBjYW5jZWxhYmxlOiB0cnVlXG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgZXZ0ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0V2ZW50Jyk7XG4gICAgZXZ0LmluaXRFdmVudChuYW1lLCB0cnVlLCB0cnVlKTtcbiAgfVxuICBldnQudG8gPSB0b0VsIHx8IHJvb3RFbDtcbiAgZXZ0LmZyb20gPSBmcm9tRWwgfHwgcm9vdEVsO1xuICBldnQuaXRlbSA9IHRhcmdldEVsIHx8IHJvb3RFbDtcbiAgZXZ0LmNsb25lID0gY2xvbmVFbDtcbiAgZXZ0Lm9sZEluZGV4ID0gb2xkSW5kZXg7XG4gIGV2dC5uZXdJbmRleCA9IG5ld0luZGV4O1xuICBldnQub2xkRHJhZ2dhYmxlSW5kZXggPSBvbGREcmFnZ2FibGVJbmRleDtcbiAgZXZ0Lm5ld0RyYWdnYWJsZUluZGV4ID0gbmV3RHJhZ2dhYmxlSW5kZXg7XG4gIGV2dC5vcmlnaW5hbEV2ZW50ID0gb3JpZ2luYWxFdmVudDtcbiAgZXZ0LnB1bGxNb2RlID0gcHV0U29ydGFibGUgPyBwdXRTb3J0YWJsZS5sYXN0UHV0TW9kZSA6IHVuZGVmaW5lZDtcbiAgdmFyIGFsbEV2ZW50UHJvcGVydGllcyA9IF9vYmplY3RTcHJlYWQyKF9vYmplY3RTcHJlYWQyKHt9LCBleHRyYUV2ZW50UHJvcGVydGllcyksIFBsdWdpbk1hbmFnZXIuZ2V0RXZlbnRQcm9wZXJ0aWVzKG5hbWUsIHNvcnRhYmxlKSk7XG4gIGZvciAodmFyIG9wdGlvbiBpbiBhbGxFdmVudFByb3BlcnRpZXMpIHtcbiAgICBldnRbb3B0aW9uXSA9IGFsbEV2ZW50UHJvcGVydGllc1tvcHRpb25dO1xuICB9XG4gIGlmIChyb290RWwpIHtcbiAgICByb290RWwuZGlzcGF0Y2hFdmVudChldnQpO1xuICB9XG4gIGlmIChvcHRpb25zW29uTmFtZV0pIHtcbiAgICBvcHRpb25zW29uTmFtZV0uY2FsbChzb3J0YWJsZSwgZXZ0KTtcbiAgfVxufVxuXG52YXIgX2V4Y2x1ZGVkID0gW1wiZXZ0XCJdO1xudmFyIHBsdWdpbkV2ZW50ID0gZnVuY3Rpb24gcGx1Z2luRXZlbnQoZXZlbnROYW1lLCBzb3J0YWJsZSkge1xuICB2YXIgX3JlZiA9IGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzJdIDoge30sXG4gICAgb3JpZ2luYWxFdmVudCA9IF9yZWYuZXZ0LFxuICAgIGRhdGEgPSBfb2JqZWN0V2l0aG91dFByb3BlcnRpZXMoX3JlZiwgX2V4Y2x1ZGVkKTtcbiAgUGx1Z2luTWFuYWdlci5wbHVnaW5FdmVudC5iaW5kKFNvcnRhYmxlKShldmVudE5hbWUsIHNvcnRhYmxlLCBfb2JqZWN0U3ByZWFkMih7XG4gICAgZHJhZ0VsOiBkcmFnRWwsXG4gICAgcGFyZW50RWw6IHBhcmVudEVsLFxuICAgIGdob3N0RWw6IGdob3N0RWwsXG4gICAgcm9vdEVsOiByb290RWwsXG4gICAgbmV4dEVsOiBuZXh0RWwsXG4gICAgbGFzdERvd25FbDogbGFzdERvd25FbCxcbiAgICBjbG9uZUVsOiBjbG9uZUVsLFxuICAgIGNsb25lSGlkZGVuOiBjbG9uZUhpZGRlbixcbiAgICBkcmFnU3RhcnRlZDogbW92ZWQsXG4gICAgcHV0U29ydGFibGU6IHB1dFNvcnRhYmxlLFxuICAgIGFjdGl2ZVNvcnRhYmxlOiBTb3J0YWJsZS5hY3RpdmUsXG4gICAgb3JpZ2luYWxFdmVudDogb3JpZ2luYWxFdmVudCxcbiAgICBvbGRJbmRleDogb2xkSW5kZXgsXG4gICAgb2xkRHJhZ2dhYmxlSW5kZXg6IG9sZERyYWdnYWJsZUluZGV4LFxuICAgIG5ld0luZGV4OiBuZXdJbmRleCxcbiAgICBuZXdEcmFnZ2FibGVJbmRleDogbmV3RHJhZ2dhYmxlSW5kZXgsXG4gICAgaGlkZUdob3N0Rm9yVGFyZ2V0OiBfaGlkZUdob3N0Rm9yVGFyZ2V0LFxuICAgIHVuaGlkZUdob3N0Rm9yVGFyZ2V0OiBfdW5oaWRlR2hvc3RGb3JUYXJnZXQsXG4gICAgY2xvbmVOb3dIaWRkZW46IGZ1bmN0aW9uIGNsb25lTm93SGlkZGVuKCkge1xuICAgICAgY2xvbmVIaWRkZW4gPSB0cnVlO1xuICAgIH0sXG4gICAgY2xvbmVOb3dTaG93bjogZnVuY3Rpb24gY2xvbmVOb3dTaG93bigpIHtcbiAgICAgIGNsb25lSGlkZGVuID0gZmFsc2U7XG4gICAgfSxcbiAgICBkaXNwYXRjaFNvcnRhYmxlRXZlbnQ6IGZ1bmN0aW9uIGRpc3BhdGNoU29ydGFibGVFdmVudChuYW1lKSB7XG4gICAgICBfZGlzcGF0Y2hFdmVudCh7XG4gICAgICAgIHNvcnRhYmxlOiBzb3J0YWJsZSxcbiAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgb3JpZ2luYWxFdmVudDogb3JpZ2luYWxFdmVudFxuICAgICAgfSk7XG4gICAgfVxuICB9LCBkYXRhKSk7XG59O1xuZnVuY3Rpb24gX2Rpc3BhdGNoRXZlbnQoaW5mbykge1xuICBkaXNwYXRjaEV2ZW50KF9vYmplY3RTcHJlYWQyKHtcbiAgICBwdXRTb3J0YWJsZTogcHV0U29ydGFibGUsXG4gICAgY2xvbmVFbDogY2xvbmVFbCxcbiAgICB0YXJnZXRFbDogZHJhZ0VsLFxuICAgIHJvb3RFbDogcm9vdEVsLFxuICAgIG9sZEluZGV4OiBvbGRJbmRleCxcbiAgICBvbGREcmFnZ2FibGVJbmRleDogb2xkRHJhZ2dhYmxlSW5kZXgsXG4gICAgbmV3SW5kZXg6IG5ld0luZGV4LFxuICAgIG5ld0RyYWdnYWJsZUluZGV4OiBuZXdEcmFnZ2FibGVJbmRleFxuICB9LCBpbmZvKSk7XG59XG52YXIgZHJhZ0VsLFxuICBwYXJlbnRFbCxcbiAgZ2hvc3RFbCxcbiAgcm9vdEVsLFxuICBuZXh0RWwsXG4gIGxhc3REb3duRWwsXG4gIGNsb25lRWwsXG4gIGNsb25lSGlkZGVuLFxuICBvbGRJbmRleCxcbiAgbmV3SW5kZXgsXG4gIG9sZERyYWdnYWJsZUluZGV4LFxuICBuZXdEcmFnZ2FibGVJbmRleCxcbiAgYWN0aXZlR3JvdXAsXG4gIHB1dFNvcnRhYmxlLFxuICBhd2FpdGluZ0RyYWdTdGFydGVkID0gZmFsc2UsXG4gIGlnbm9yZU5leHRDbGljayA9IGZhbHNlLFxuICBzb3J0YWJsZXMgPSBbXSxcbiAgdGFwRXZ0LFxuICB0b3VjaEV2dCxcbiAgbGFzdER4LFxuICBsYXN0RHksXG4gIHRhcERpc3RhbmNlTGVmdCxcbiAgdGFwRGlzdGFuY2VUb3AsXG4gIG1vdmVkLFxuICBsYXN0VGFyZ2V0LFxuICBsYXN0RGlyZWN0aW9uLFxuICBwYXN0Rmlyc3RJbnZlcnRUaHJlc2ggPSBmYWxzZSxcbiAgaXNDaXJjdW1zdGFudGlhbEludmVydCA9IGZhbHNlLFxuICB0YXJnZXRNb3ZlRGlzdGFuY2UsXG4gIC8vIEZvciBwb3NpdGlvbmluZyBnaG9zdCBhYnNvbHV0ZWx5XG4gIGdob3N0UmVsYXRpdmVQYXJlbnQsXG4gIGdob3N0UmVsYXRpdmVQYXJlbnRJbml0aWFsU2Nyb2xsID0gW10sXG4gIC8vIChsZWZ0LCB0b3ApXG5cbiAgX3NpbGVudCA9IGZhbHNlLFxuICBzYXZlZElucHV0Q2hlY2tlZCA9IFtdO1xuXG4vKiogQGNvbnN0ICovXG52YXIgZG9jdW1lbnRFeGlzdHMgPSB0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnLFxuICBQb3NpdGlvbkdob3N0QWJzb2x1dGVseSA9IElPUyxcbiAgQ1NTRmxvYXRQcm9wZXJ0eSA9IEVkZ2UgfHwgSUUxMU9yTGVzcyA/ICdjc3NGbG9hdCcgOiAnZmxvYXQnLFxuICAvLyBUaGlzIHdpbGwgbm90IHBhc3MgZm9yIElFOSwgYmVjYXVzZSBJRTkgRG5EIG9ubHkgd29ya3Mgb24gYW5jaG9yc1xuICBzdXBwb3J0RHJhZ2dhYmxlID0gZG9jdW1lbnRFeGlzdHMgJiYgIUNocm9tZUZvckFuZHJvaWQgJiYgIUlPUyAmJiAnZHJhZ2dhYmxlJyBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcbiAgc3VwcG9ydENzc1BvaW50ZXJFdmVudHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCFkb2N1bWVudEV4aXN0cykgcmV0dXJuO1xuICAgIC8vIGZhbHNlIHdoZW4gPD0gSUUxMVxuICAgIGlmIChJRTExT3JMZXNzKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3gnKTtcbiAgICBlbC5zdHlsZS5jc3NUZXh0ID0gJ3BvaW50ZXItZXZlbnRzOmF1dG8nO1xuICAgIHJldHVybiBlbC5zdHlsZS5wb2ludGVyRXZlbnRzID09PSAnYXV0byc7XG4gIH0oKSxcbiAgX2RldGVjdERpcmVjdGlvbiA9IGZ1bmN0aW9uIF9kZXRlY3REaXJlY3Rpb24oZWwsIG9wdGlvbnMpIHtcbiAgICB2YXIgZWxDU1MgPSBjc3MoZWwpLFxuICAgICAgZWxXaWR0aCA9IHBhcnNlSW50KGVsQ1NTLndpZHRoKSAtIHBhcnNlSW50KGVsQ1NTLnBhZGRpbmdMZWZ0KSAtIHBhcnNlSW50KGVsQ1NTLnBhZGRpbmdSaWdodCkgLSBwYXJzZUludChlbENTUy5ib3JkZXJMZWZ0V2lkdGgpIC0gcGFyc2VJbnQoZWxDU1MuYm9yZGVyUmlnaHRXaWR0aCksXG4gICAgICBjaGlsZDEgPSBnZXRDaGlsZChlbCwgMCwgb3B0aW9ucyksXG4gICAgICBjaGlsZDIgPSBnZXRDaGlsZChlbCwgMSwgb3B0aW9ucyksXG4gICAgICBmaXJzdENoaWxkQ1NTID0gY2hpbGQxICYmIGNzcyhjaGlsZDEpLFxuICAgICAgc2Vjb25kQ2hpbGRDU1MgPSBjaGlsZDIgJiYgY3NzKGNoaWxkMiksXG4gICAgICBmaXJzdENoaWxkV2lkdGggPSBmaXJzdENoaWxkQ1NTICYmIHBhcnNlSW50KGZpcnN0Q2hpbGRDU1MubWFyZ2luTGVmdCkgKyBwYXJzZUludChmaXJzdENoaWxkQ1NTLm1hcmdpblJpZ2h0KSArIGdldFJlY3QoY2hpbGQxKS53aWR0aCxcbiAgICAgIHNlY29uZENoaWxkV2lkdGggPSBzZWNvbmRDaGlsZENTUyAmJiBwYXJzZUludChzZWNvbmRDaGlsZENTUy5tYXJnaW5MZWZ0KSArIHBhcnNlSW50KHNlY29uZENoaWxkQ1NTLm1hcmdpblJpZ2h0KSArIGdldFJlY3QoY2hpbGQyKS53aWR0aDtcbiAgICBpZiAoZWxDU1MuZGlzcGxheSA9PT0gJ2ZsZXgnKSB7XG4gICAgICByZXR1cm4gZWxDU1MuZmxleERpcmVjdGlvbiA9PT0gJ2NvbHVtbicgfHwgZWxDU1MuZmxleERpcmVjdGlvbiA9PT0gJ2NvbHVtbi1yZXZlcnNlJyA/ICd2ZXJ0aWNhbCcgOiAnaG9yaXpvbnRhbCc7XG4gICAgfVxuICAgIGlmIChlbENTUy5kaXNwbGF5ID09PSAnZ3JpZCcpIHtcbiAgICAgIHJldHVybiBlbENTUy5ncmlkVGVtcGxhdGVDb2x1bW5zLnNwbGl0KCcgJykubGVuZ3RoIDw9IDEgPyAndmVydGljYWwnIDogJ2hvcml6b250YWwnO1xuICAgIH1cbiAgICBpZiAoY2hpbGQxICYmIGZpcnN0Q2hpbGRDU1NbXCJmbG9hdFwiXSAmJiBmaXJzdENoaWxkQ1NTW1wiZmxvYXRcIl0gIT09ICdub25lJykge1xuICAgICAgdmFyIHRvdWNoaW5nU2lkZUNoaWxkMiA9IGZpcnN0Q2hpbGRDU1NbXCJmbG9hdFwiXSA9PT0gJ2xlZnQnID8gJ2xlZnQnIDogJ3JpZ2h0JztcbiAgICAgIHJldHVybiBjaGlsZDIgJiYgKHNlY29uZENoaWxkQ1NTLmNsZWFyID09PSAnYm90aCcgfHwgc2Vjb25kQ2hpbGRDU1MuY2xlYXIgPT09IHRvdWNoaW5nU2lkZUNoaWxkMikgPyAndmVydGljYWwnIDogJ2hvcml6b250YWwnO1xuICAgIH1cbiAgICByZXR1cm4gY2hpbGQxICYmIChmaXJzdENoaWxkQ1NTLmRpc3BsYXkgPT09ICdibG9jaycgfHwgZmlyc3RDaGlsZENTUy5kaXNwbGF5ID09PSAnZmxleCcgfHwgZmlyc3RDaGlsZENTUy5kaXNwbGF5ID09PSAndGFibGUnIHx8IGZpcnN0Q2hpbGRDU1MuZGlzcGxheSA9PT0gJ2dyaWQnIHx8IGZpcnN0Q2hpbGRXaWR0aCA+PSBlbFdpZHRoICYmIGVsQ1NTW0NTU0Zsb2F0UHJvcGVydHldID09PSAnbm9uZScgfHwgY2hpbGQyICYmIGVsQ1NTW0NTU0Zsb2F0UHJvcGVydHldID09PSAnbm9uZScgJiYgZmlyc3RDaGlsZFdpZHRoICsgc2Vjb25kQ2hpbGRXaWR0aCA+IGVsV2lkdGgpID8gJ3ZlcnRpY2FsJyA6ICdob3Jpem9udGFsJztcbiAgfSxcbiAgX2RyYWdFbEluUm93Q29sdW1uID0gZnVuY3Rpb24gX2RyYWdFbEluUm93Q29sdW1uKGRyYWdSZWN0LCB0YXJnZXRSZWN0LCB2ZXJ0aWNhbCkge1xuICAgIHZhciBkcmFnRWxTMU9wcCA9IHZlcnRpY2FsID8gZHJhZ1JlY3QubGVmdCA6IGRyYWdSZWN0LnRvcCxcbiAgICAgIGRyYWdFbFMyT3BwID0gdmVydGljYWwgPyBkcmFnUmVjdC5yaWdodCA6IGRyYWdSZWN0LmJvdHRvbSxcbiAgICAgIGRyYWdFbE9wcExlbmd0aCA9IHZlcnRpY2FsID8gZHJhZ1JlY3Qud2lkdGggOiBkcmFnUmVjdC5oZWlnaHQsXG4gICAgICB0YXJnZXRTMU9wcCA9IHZlcnRpY2FsID8gdGFyZ2V0UmVjdC5sZWZ0IDogdGFyZ2V0UmVjdC50b3AsXG4gICAgICB0YXJnZXRTMk9wcCA9IHZlcnRpY2FsID8gdGFyZ2V0UmVjdC5yaWdodCA6IHRhcmdldFJlY3QuYm90dG9tLFxuICAgICAgdGFyZ2V0T3BwTGVuZ3RoID0gdmVydGljYWwgPyB0YXJnZXRSZWN0LndpZHRoIDogdGFyZ2V0UmVjdC5oZWlnaHQ7XG4gICAgcmV0dXJuIGRyYWdFbFMxT3BwID09PSB0YXJnZXRTMU9wcCB8fCBkcmFnRWxTMk9wcCA9PT0gdGFyZ2V0UzJPcHAgfHwgZHJhZ0VsUzFPcHAgKyBkcmFnRWxPcHBMZW5ndGggLyAyID09PSB0YXJnZXRTMU9wcCArIHRhcmdldE9wcExlbmd0aCAvIDI7XG4gIH0sXG4gIC8qKlxyXG4gICAqIERldGVjdHMgZmlyc3QgbmVhcmVzdCBlbXB0eSBzb3J0YWJsZSB0byBYIGFuZCBZIHBvc2l0aW9uIHVzaW5nIGVtcHR5SW5zZXJ0VGhyZXNob2xkLlxyXG4gICAqIEBwYXJhbSAge051bWJlcn0geCAgICAgIFggcG9zaXRpb25cclxuICAgKiBAcGFyYW0gIHtOdW1iZXJ9IHkgICAgICBZIHBvc2l0aW9uXHJcbiAgICogQHJldHVybiB7SFRNTEVsZW1lbnR9ICAgRWxlbWVudCBvZiB0aGUgZmlyc3QgZm91bmQgbmVhcmVzdCBTb3J0YWJsZVxyXG4gICAqL1xuICBfZGV0ZWN0TmVhcmVzdEVtcHR5U29ydGFibGUgPSBmdW5jdGlvbiBfZGV0ZWN0TmVhcmVzdEVtcHR5U29ydGFibGUoeCwgeSkge1xuICAgIHZhciByZXQ7XG4gICAgc29ydGFibGVzLnNvbWUoZnVuY3Rpb24gKHNvcnRhYmxlKSB7XG4gICAgICB2YXIgdGhyZXNob2xkID0gc29ydGFibGVbZXhwYW5kb10ub3B0aW9ucy5lbXB0eUluc2VydFRocmVzaG9sZDtcbiAgICAgIGlmICghdGhyZXNob2xkIHx8IGxhc3RDaGlsZChzb3J0YWJsZSkpIHJldHVybjtcbiAgICAgIHZhciByZWN0ID0gZ2V0UmVjdChzb3J0YWJsZSksXG4gICAgICAgIGluc2lkZUhvcml6b250YWxseSA9IHggPj0gcmVjdC5sZWZ0IC0gdGhyZXNob2xkICYmIHggPD0gcmVjdC5yaWdodCArIHRocmVzaG9sZCxcbiAgICAgICAgaW5zaWRlVmVydGljYWxseSA9IHkgPj0gcmVjdC50b3AgLSB0aHJlc2hvbGQgJiYgeSA8PSByZWN0LmJvdHRvbSArIHRocmVzaG9sZDtcbiAgICAgIGlmIChpbnNpZGVIb3Jpem9udGFsbHkgJiYgaW5zaWRlVmVydGljYWxseSkge1xuICAgICAgICByZXR1cm4gcmV0ID0gc29ydGFibGU7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJldDtcbiAgfSxcbiAgX3ByZXBhcmVHcm91cCA9IGZ1bmN0aW9uIF9wcmVwYXJlR3JvdXAob3B0aW9ucykge1xuICAgIGZ1bmN0aW9uIHRvRm4odmFsdWUsIHB1bGwpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAodG8sIGZyb20sIGRyYWdFbCwgZXZ0KSB7XG4gICAgICAgIHZhciBzYW1lR3JvdXAgPSB0by5vcHRpb25zLmdyb3VwLm5hbWUgJiYgZnJvbS5vcHRpb25zLmdyb3VwLm5hbWUgJiYgdG8ub3B0aW9ucy5ncm91cC5uYW1lID09PSBmcm9tLm9wdGlvbnMuZ3JvdXAubmFtZTtcbiAgICAgICAgaWYgKHZhbHVlID09IG51bGwgJiYgKHB1bGwgfHwgc2FtZUdyb3VwKSkge1xuICAgICAgICAgIC8vIERlZmF1bHQgcHVsbCB2YWx1ZVxuICAgICAgICAgIC8vIERlZmF1bHQgcHVsbCBhbmQgcHV0IHZhbHVlIGlmIHNhbWUgZ3JvdXBcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSA9PSBudWxsIHx8IHZhbHVlID09PSBmYWxzZSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSBlbHNlIGlmIChwdWxsICYmIHZhbHVlID09PSAnY2xvbmUnKSB7XG4gICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIHJldHVybiB0b0ZuKHZhbHVlKHRvLCBmcm9tLCBkcmFnRWwsIGV2dCksIHB1bGwpKHRvLCBmcm9tLCBkcmFnRWwsIGV2dCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIG90aGVyR3JvdXAgPSAocHVsbCA/IHRvIDogZnJvbSkub3B0aW9ucy5ncm91cC5uYW1lO1xuICAgICAgICAgIHJldHVybiB2YWx1ZSA9PT0gdHJ1ZSB8fCB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnICYmIHZhbHVlID09PSBvdGhlckdyb3VwIHx8IHZhbHVlLmpvaW4gJiYgdmFsdWUuaW5kZXhPZihvdGhlckdyb3VwKSA+IC0xO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cbiAgICB2YXIgZ3JvdXAgPSB7fTtcbiAgICB2YXIgb3JpZ2luYWxHcm91cCA9IG9wdGlvbnMuZ3JvdXA7XG4gICAgaWYgKCFvcmlnaW5hbEdyb3VwIHx8IF90eXBlb2Yob3JpZ2luYWxHcm91cCkgIT0gJ29iamVjdCcpIHtcbiAgICAgIG9yaWdpbmFsR3JvdXAgPSB7XG4gICAgICAgIG5hbWU6IG9yaWdpbmFsR3JvdXBcbiAgICAgIH07XG4gICAgfVxuICAgIGdyb3VwLm5hbWUgPSBvcmlnaW5hbEdyb3VwLm5hbWU7XG4gICAgZ3JvdXAuY2hlY2tQdWxsID0gdG9GbihvcmlnaW5hbEdyb3VwLnB1bGwsIHRydWUpO1xuICAgIGdyb3VwLmNoZWNrUHV0ID0gdG9GbihvcmlnaW5hbEdyb3VwLnB1dCk7XG4gICAgZ3JvdXAucmV2ZXJ0Q2xvbmUgPSBvcmlnaW5hbEdyb3VwLnJldmVydENsb25lO1xuICAgIG9wdGlvbnMuZ3JvdXAgPSBncm91cDtcbiAgfSxcbiAgX2hpZGVHaG9zdEZvclRhcmdldCA9IGZ1bmN0aW9uIF9oaWRlR2hvc3RGb3JUYXJnZXQoKSB7XG4gICAgaWYgKCFzdXBwb3J0Q3NzUG9pbnRlckV2ZW50cyAmJiBnaG9zdEVsKSB7XG4gICAgICBjc3MoZ2hvc3RFbCwgJ2Rpc3BsYXknLCAnbm9uZScpO1xuICAgIH1cbiAgfSxcbiAgX3VuaGlkZUdob3N0Rm9yVGFyZ2V0ID0gZnVuY3Rpb24gX3VuaGlkZUdob3N0Rm9yVGFyZ2V0KCkge1xuICAgIGlmICghc3VwcG9ydENzc1BvaW50ZXJFdmVudHMgJiYgZ2hvc3RFbCkge1xuICAgICAgY3NzKGdob3N0RWwsICdkaXNwbGF5JywgJycpO1xuICAgIH1cbiAgfTtcblxuLy8gIzExODQgZml4IC0gUHJldmVudCBjbGljayBldmVudCBvbiBmYWxsYmFjayBpZiBkcmFnZ2VkIGJ1dCBpdGVtIG5vdCBjaGFuZ2VkIHBvc2l0aW9uXG5pZiAoZG9jdW1lbnRFeGlzdHMgJiYgIUNocm9tZUZvckFuZHJvaWQpIHtcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgaWYgKGlnbm9yZU5leHRDbGljaykge1xuICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBldnQuc3RvcFByb3BhZ2F0aW9uICYmIGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIGV2dC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24gJiYgZXZ0LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgICAgaWdub3JlTmV4dENsaWNrID0gZmFsc2U7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9LCB0cnVlKTtcbn1cbnZhciBuZWFyZXN0RW1wdHlJbnNlcnREZXRlY3RFdmVudCA9IGZ1bmN0aW9uIG5lYXJlc3RFbXB0eUluc2VydERldGVjdEV2ZW50KGV2dCkge1xuICBpZiAoZHJhZ0VsKSB7XG4gICAgZXZ0ID0gZXZ0LnRvdWNoZXMgPyBldnQudG91Y2hlc1swXSA6IGV2dDtcbiAgICB2YXIgbmVhcmVzdCA9IF9kZXRlY3ROZWFyZXN0RW1wdHlTb3J0YWJsZShldnQuY2xpZW50WCwgZXZ0LmNsaWVudFkpO1xuICAgIGlmIChuZWFyZXN0KSB7XG4gICAgICAvLyBDcmVhdGUgaW1pdGF0aW9uIGV2ZW50XG4gICAgICB2YXIgZXZlbnQgPSB7fTtcbiAgICAgIGZvciAodmFyIGkgaW4gZXZ0KSB7XG4gICAgICAgIGlmIChldnQuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICBldmVudFtpXSA9IGV2dFtpXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZXZlbnQudGFyZ2V0ID0gZXZlbnQucm9vdEVsID0gbmVhcmVzdDtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0ID0gdm9pZCAwO1xuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uID0gdm9pZCAwO1xuICAgICAgbmVhcmVzdFtleHBhbmRvXS5fb25EcmFnT3ZlcihldmVudCk7XG4gICAgfVxuICB9XG59O1xudmFyIF9jaGVja091dHNpZGVUYXJnZXRFbCA9IGZ1bmN0aW9uIF9jaGVja091dHNpZGVUYXJnZXRFbChldnQpIHtcbiAgaWYgKGRyYWdFbCkge1xuICAgIGRyYWdFbC5wYXJlbnROb2RlW2V4cGFuZG9dLl9pc091dHNpZGVUaGlzRWwoZXZ0LnRhcmdldCk7XG4gIH1cbn07XG5cbi8qKlxyXG4gKiBAY2xhc3MgIFNvcnRhYmxlXHJcbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSAgZWxcclxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgICBbb3B0aW9uc11cclxuICovXG5mdW5jdGlvbiBTb3J0YWJsZShlbCwgb3B0aW9ucykge1xuICBpZiAoIShlbCAmJiBlbC5ub2RlVHlwZSAmJiBlbC5ub2RlVHlwZSA9PT0gMSkpIHtcbiAgICB0aHJvdyBcIlNvcnRhYmxlOiBgZWxgIG11c3QgYmUgYW4gSFRNTEVsZW1lbnQsIG5vdCBcIi5jb25jYXQoe30udG9TdHJpbmcuY2FsbChlbCkpO1xuICB9XG4gIHRoaXMuZWwgPSBlbDsgLy8gcm9vdCBlbGVtZW50XG4gIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgPSBfZXh0ZW5kcyh7fSwgb3B0aW9ucyk7XG5cbiAgLy8gRXhwb3J0IGluc3RhbmNlXG4gIGVsW2V4cGFuZG9dID0gdGhpcztcbiAgdmFyIGRlZmF1bHRzID0ge1xuICAgIGdyb3VwOiBudWxsLFxuICAgIHNvcnQ6IHRydWUsXG4gICAgZGlzYWJsZWQ6IGZhbHNlLFxuICAgIHN0b3JlOiBudWxsLFxuICAgIGhhbmRsZTogbnVsbCxcbiAgICBkcmFnZ2FibGU6IC9eW3VvXWwkL2kudGVzdChlbC5ub2RlTmFtZSkgPyAnPmxpJyA6ICc+KicsXG4gICAgc3dhcFRocmVzaG9sZDogMSxcbiAgICAvLyBwZXJjZW50YWdlOyAwIDw9IHggPD0gMVxuICAgIGludmVydFN3YXA6IGZhbHNlLFxuICAgIC8vIGludmVydCBhbHdheXNcbiAgICBpbnZlcnRlZFN3YXBUaHJlc2hvbGQ6IG51bGwsXG4gICAgLy8gd2lsbCBiZSBzZXQgdG8gc2FtZSBhcyBzd2FwVGhyZXNob2xkIGlmIGRlZmF1bHRcbiAgICByZW1vdmVDbG9uZU9uSGlkZTogdHJ1ZSxcbiAgICBkaXJlY3Rpb246IGZ1bmN0aW9uIGRpcmVjdGlvbigpIHtcbiAgICAgIHJldHVybiBfZGV0ZWN0RGlyZWN0aW9uKGVsLCB0aGlzLm9wdGlvbnMpO1xuICAgIH0sXG4gICAgZ2hvc3RDbGFzczogJ3NvcnRhYmxlLWdob3N0JyxcbiAgICBjaG9zZW5DbGFzczogJ3NvcnRhYmxlLWNob3NlbicsXG4gICAgZHJhZ0NsYXNzOiAnc29ydGFibGUtZHJhZycsXG4gICAgaWdub3JlOiAnYSwgaW1nJyxcbiAgICBmaWx0ZXI6IG51bGwsXG4gICAgcHJldmVudE9uRmlsdGVyOiB0cnVlLFxuICAgIGFuaW1hdGlvbjogMCxcbiAgICBlYXNpbmc6IG51bGwsXG4gICAgc2V0RGF0YTogZnVuY3Rpb24gc2V0RGF0YShkYXRhVHJhbnNmZXIsIGRyYWdFbCkge1xuICAgICAgZGF0YVRyYW5zZmVyLnNldERhdGEoJ1RleHQnLCBkcmFnRWwudGV4dENvbnRlbnQpO1xuICAgIH0sXG4gICAgZHJvcEJ1YmJsZTogZmFsc2UsXG4gICAgZHJhZ292ZXJCdWJibGU6IGZhbHNlLFxuICAgIGRhdGFJZEF0dHI6ICdkYXRhLWlkJyxcbiAgICBkZWxheTogMCxcbiAgICBkZWxheU9uVG91Y2hPbmx5OiBmYWxzZSxcbiAgICB0b3VjaFN0YXJ0VGhyZXNob2xkOiAoTnVtYmVyLnBhcnNlSW50ID8gTnVtYmVyIDogd2luZG93KS5wYXJzZUludCh3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbywgMTApIHx8IDEsXG4gICAgZm9yY2VGYWxsYmFjazogZmFsc2UsXG4gICAgZmFsbGJhY2tDbGFzczogJ3NvcnRhYmxlLWZhbGxiYWNrJyxcbiAgICBmYWxsYmFja09uQm9keTogZmFsc2UsXG4gICAgZmFsbGJhY2tUb2xlcmFuY2U6IDAsXG4gICAgZmFsbGJhY2tPZmZzZXQ6IHtcbiAgICAgIHg6IDAsXG4gICAgICB5OiAwXG4gICAgfSxcbiAgICAvLyBEaXNhYmxlZCBvbiBTYWZhcmk6ICMxNTcxOyBFbmFibGVkIG9uIFNhZmFyaSBJT1M6ICMyMjQ0XG4gICAgc3VwcG9ydFBvaW50ZXI6IFNvcnRhYmxlLnN1cHBvcnRQb2ludGVyICE9PSBmYWxzZSAmJiAnUG9pbnRlckV2ZW50JyBpbiB3aW5kb3cgJiYgKCFTYWZhcmkgfHwgSU9TKSxcbiAgICBlbXB0eUluc2VydFRocmVzaG9sZDogNVxuICB9O1xuICBQbHVnaW5NYW5hZ2VyLmluaXRpYWxpemVQbHVnaW5zKHRoaXMsIGVsLCBkZWZhdWx0cyk7XG5cbiAgLy8gU2V0IGRlZmF1bHQgb3B0aW9uc1xuICBmb3IgKHZhciBuYW1lIGluIGRlZmF1bHRzKSB7XG4gICAgIShuYW1lIGluIG9wdGlvbnMpICYmIChvcHRpb25zW25hbWVdID0gZGVmYXVsdHNbbmFtZV0pO1xuICB9XG4gIF9wcmVwYXJlR3JvdXAob3B0aW9ucyk7XG5cbiAgLy8gQmluZCBhbGwgcHJpdmF0ZSBtZXRob2RzXG4gIGZvciAodmFyIGZuIGluIHRoaXMpIHtcbiAgICBpZiAoZm4uY2hhckF0KDApID09PSAnXycgJiYgdHlwZW9mIHRoaXNbZm5dID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aGlzW2ZuXSA9IHRoaXNbZm5dLmJpbmQodGhpcyk7XG4gICAgfVxuICB9XG5cbiAgLy8gU2V0dXAgZHJhZyBtb2RlXG4gIHRoaXMubmF0aXZlRHJhZ2dhYmxlID0gb3B0aW9ucy5mb3JjZUZhbGxiYWNrID8gZmFsc2UgOiBzdXBwb3J0RHJhZ2dhYmxlO1xuICBpZiAodGhpcy5uYXRpdmVEcmFnZ2FibGUpIHtcbiAgICAvLyBUb3VjaCBzdGFydCB0aHJlc2hvbGQgY2Fubm90IGJlIGdyZWF0ZXIgdGhhbiB0aGUgbmF0aXZlIGRyYWdzdGFydCB0aHJlc2hvbGRcbiAgICB0aGlzLm9wdGlvbnMudG91Y2hTdGFydFRocmVzaG9sZCA9IDE7XG4gIH1cblxuICAvLyBCaW5kIGV2ZW50c1xuICBpZiAob3B0aW9ucy5zdXBwb3J0UG9pbnRlcikge1xuICAgIG9uKGVsLCAncG9pbnRlcmRvd24nLCB0aGlzLl9vblRhcFN0YXJ0KTtcbiAgfSBlbHNlIHtcbiAgICBvbihlbCwgJ21vdXNlZG93bicsIHRoaXMuX29uVGFwU3RhcnQpO1xuICAgIG9uKGVsLCAndG91Y2hzdGFydCcsIHRoaXMuX29uVGFwU3RhcnQpO1xuICB9XG4gIGlmICh0aGlzLm5hdGl2ZURyYWdnYWJsZSkge1xuICAgIG9uKGVsLCAnZHJhZ292ZXInLCB0aGlzKTtcbiAgICBvbihlbCwgJ2RyYWdlbnRlcicsIHRoaXMpO1xuICB9XG4gIHNvcnRhYmxlcy5wdXNoKHRoaXMuZWwpO1xuXG4gIC8vIFJlc3RvcmUgc29ydGluZ1xuICBvcHRpb25zLnN0b3JlICYmIG9wdGlvbnMuc3RvcmUuZ2V0ICYmIHRoaXMuc29ydChvcHRpb25zLnN0b3JlLmdldCh0aGlzKSB8fCBbXSk7XG5cbiAgLy8gQWRkIGFuaW1hdGlvbiBzdGF0ZSBtYW5hZ2VyXG4gIF9leHRlbmRzKHRoaXMsIEFuaW1hdGlvblN0YXRlTWFuYWdlcigpKTtcbn1cblNvcnRhYmxlLnByb3RvdHlwZSA9IC8qKiBAbGVuZHMgU29ydGFibGUucHJvdG90eXBlICove1xuICBjb25zdHJ1Y3RvcjogU29ydGFibGUsXG4gIF9pc091dHNpZGVUaGlzRWw6IGZ1bmN0aW9uIF9pc091dHNpZGVUaGlzRWwodGFyZ2V0KSB7XG4gICAgaWYgKCF0aGlzLmVsLmNvbnRhaW5zKHRhcmdldCkgJiYgdGFyZ2V0ICE9PSB0aGlzLmVsKSB7XG4gICAgICBsYXN0VGFyZ2V0ID0gbnVsbDtcbiAgICB9XG4gIH0sXG4gIF9nZXREaXJlY3Rpb246IGZ1bmN0aW9uIF9nZXREaXJlY3Rpb24oZXZ0LCB0YXJnZXQpIHtcbiAgICByZXR1cm4gdHlwZW9mIHRoaXMub3B0aW9ucy5kaXJlY3Rpb24gPT09ICdmdW5jdGlvbicgPyB0aGlzLm9wdGlvbnMuZGlyZWN0aW9uLmNhbGwodGhpcywgZXZ0LCB0YXJnZXQsIGRyYWdFbCkgOiB0aGlzLm9wdGlvbnMuZGlyZWN0aW9uO1xuICB9LFxuICBfb25UYXBTdGFydDogZnVuY3Rpb24gX29uVGFwU3RhcnQoIC8qKiBFdmVudHxUb3VjaEV2ZW50ICovZXZ0KSB7XG4gICAgaWYgKCFldnQuY2FuY2VsYWJsZSkgcmV0dXJuO1xuICAgIHZhciBfdGhpcyA9IHRoaXMsXG4gICAgICBlbCA9IHRoaXMuZWwsXG4gICAgICBvcHRpb25zID0gdGhpcy5vcHRpb25zLFxuICAgICAgcHJldmVudE9uRmlsdGVyID0gb3B0aW9ucy5wcmV2ZW50T25GaWx0ZXIsXG4gICAgICB0eXBlID0gZXZ0LnR5cGUsXG4gICAgICB0b3VjaCA9IGV2dC50b3VjaGVzICYmIGV2dC50b3VjaGVzWzBdIHx8IGV2dC5wb2ludGVyVHlwZSAmJiBldnQucG9pbnRlclR5cGUgPT09ICd0b3VjaCcgJiYgZXZ0LFxuICAgICAgdGFyZ2V0ID0gKHRvdWNoIHx8IGV2dCkudGFyZ2V0LFxuICAgICAgb3JpZ2luYWxUYXJnZXQgPSBldnQudGFyZ2V0LnNoYWRvd1Jvb3QgJiYgKGV2dC5wYXRoICYmIGV2dC5wYXRoWzBdIHx8IGV2dC5jb21wb3NlZFBhdGggJiYgZXZ0LmNvbXBvc2VkUGF0aCgpWzBdKSB8fCB0YXJnZXQsXG4gICAgICBmaWx0ZXIgPSBvcHRpb25zLmZpbHRlcjtcbiAgICBfc2F2ZUlucHV0Q2hlY2tlZFN0YXRlKGVsKTtcblxuICAgIC8vIERvbid0IHRyaWdnZXIgc3RhcnQgZXZlbnQgd2hlbiBhbiBlbGVtZW50IGlzIGJlZW4gZHJhZ2dlZCwgb3RoZXJ3aXNlIHRoZSBldnQub2xkaW5kZXggYWx3YXlzIHdyb25nIHdoZW4gc2V0IG9wdGlvbi5ncm91cC5cbiAgICBpZiAoZHJhZ0VsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICgvbW91c2Vkb3dufHBvaW50ZXJkb3duLy50ZXN0KHR5cGUpICYmIGV2dC5idXR0b24gIT09IDAgfHwgb3B0aW9ucy5kaXNhYmxlZCkge1xuICAgICAgcmV0dXJuOyAvLyBvbmx5IGxlZnQgYnV0dG9uIGFuZCBlbmFibGVkXG4gICAgfVxuXG4gICAgLy8gY2FuY2VsIGRuZCBpZiBvcmlnaW5hbCB0YXJnZXQgaXMgY29udGVudCBlZGl0YWJsZVxuICAgIGlmIChvcmlnaW5hbFRhcmdldC5pc0NvbnRlbnRFZGl0YWJsZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFNhZmFyaSBpZ25vcmVzIGZ1cnRoZXIgZXZlbnQgaGFuZGxpbmcgYWZ0ZXIgbW91c2Vkb3duXG4gICAgaWYgKCF0aGlzLm5hdGl2ZURyYWdnYWJsZSAmJiBTYWZhcmkgJiYgdGFyZ2V0ICYmIHRhcmdldC50YWdOYW1lLnRvVXBwZXJDYXNlKCkgPT09ICdTRUxFQ1QnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRhcmdldCA9IGNsb3Nlc3QodGFyZ2V0LCBvcHRpb25zLmRyYWdnYWJsZSwgZWwsIGZhbHNlKTtcbiAgICBpZiAodGFyZ2V0ICYmIHRhcmdldC5hbmltYXRlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAobGFzdERvd25FbCA9PT0gdGFyZ2V0KSB7XG4gICAgICAvLyBJZ25vcmluZyBkdXBsaWNhdGUgYGRvd25gXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gR2V0IHRoZSBpbmRleCBvZiB0aGUgZHJhZ2dlZCBlbGVtZW50IHdpdGhpbiBpdHMgcGFyZW50XG4gICAgb2xkSW5kZXggPSBpbmRleCh0YXJnZXQpO1xuICAgIG9sZERyYWdnYWJsZUluZGV4ID0gaW5kZXgodGFyZ2V0LCBvcHRpb25zLmRyYWdnYWJsZSk7XG5cbiAgICAvLyBDaGVjayBmaWx0ZXJcbiAgICBpZiAodHlwZW9mIGZpbHRlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgaWYgKGZpbHRlci5jYWxsKHRoaXMsIGV2dCwgdGFyZ2V0LCB0aGlzKSkge1xuICAgICAgICBfZGlzcGF0Y2hFdmVudCh7XG4gICAgICAgICAgc29ydGFibGU6IF90aGlzLFxuICAgICAgICAgIHJvb3RFbDogb3JpZ2luYWxUYXJnZXQsXG4gICAgICAgICAgbmFtZTogJ2ZpbHRlcicsXG4gICAgICAgICAgdGFyZ2V0RWw6IHRhcmdldCxcbiAgICAgICAgICB0b0VsOiBlbCxcbiAgICAgICAgICBmcm9tRWw6IGVsXG4gICAgICAgIH0pO1xuICAgICAgICBwbHVnaW5FdmVudCgnZmlsdGVyJywgX3RoaXMsIHtcbiAgICAgICAgICBldnQ6IGV2dFxuICAgICAgICB9KTtcbiAgICAgICAgcHJldmVudE9uRmlsdGVyICYmIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICByZXR1cm47IC8vIGNhbmNlbCBkbmRcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGZpbHRlcikge1xuICAgICAgZmlsdGVyID0gZmlsdGVyLnNwbGl0KCcsJykuc29tZShmdW5jdGlvbiAoY3JpdGVyaWEpIHtcbiAgICAgICAgY3JpdGVyaWEgPSBjbG9zZXN0KG9yaWdpbmFsVGFyZ2V0LCBjcml0ZXJpYS50cmltKCksIGVsLCBmYWxzZSk7XG4gICAgICAgIGlmIChjcml0ZXJpYSkge1xuICAgICAgICAgIF9kaXNwYXRjaEV2ZW50KHtcbiAgICAgICAgICAgIHNvcnRhYmxlOiBfdGhpcyxcbiAgICAgICAgICAgIHJvb3RFbDogY3JpdGVyaWEsXG4gICAgICAgICAgICBuYW1lOiAnZmlsdGVyJyxcbiAgICAgICAgICAgIHRhcmdldEVsOiB0YXJnZXQsXG4gICAgICAgICAgICBmcm9tRWw6IGVsLFxuICAgICAgICAgICAgdG9FbDogZWxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBwbHVnaW5FdmVudCgnZmlsdGVyJywgX3RoaXMsIHtcbiAgICAgICAgICAgIGV2dDogZXZ0XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgaWYgKGZpbHRlcikge1xuICAgICAgICBwcmV2ZW50T25GaWx0ZXIgJiYgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHJldHVybjsgLy8gY2FuY2VsIGRuZFxuICAgICAgfVxuICAgIH1cbiAgICBpZiAob3B0aW9ucy5oYW5kbGUgJiYgIWNsb3Nlc3Qob3JpZ2luYWxUYXJnZXQsIG9wdGlvbnMuaGFuZGxlLCBlbCwgZmFsc2UpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gUHJlcGFyZSBgZHJhZ3N0YXJ0YFxuICAgIHRoaXMuX3ByZXBhcmVEcmFnU3RhcnQoZXZ0LCB0b3VjaCwgdGFyZ2V0KTtcbiAgfSxcbiAgX3ByZXBhcmVEcmFnU3RhcnQ6IGZ1bmN0aW9uIF9wcmVwYXJlRHJhZ1N0YXJ0KCAvKiogRXZlbnQgKi9ldnQsIC8qKiBUb3VjaCAqL3RvdWNoLCAvKiogSFRNTEVsZW1lbnQgKi90YXJnZXQpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzLFxuICAgICAgZWwgPSBfdGhpcy5lbCxcbiAgICAgIG9wdGlvbnMgPSBfdGhpcy5vcHRpb25zLFxuICAgICAgb3duZXJEb2N1bWVudCA9IGVsLm93bmVyRG9jdW1lbnQsXG4gICAgICBkcmFnU3RhcnRGbjtcbiAgICBpZiAodGFyZ2V0ICYmICFkcmFnRWwgJiYgdGFyZ2V0LnBhcmVudE5vZGUgPT09IGVsKSB7XG4gICAgICB2YXIgZHJhZ1JlY3QgPSBnZXRSZWN0KHRhcmdldCk7XG4gICAgICByb290RWwgPSBlbDtcbiAgICAgIGRyYWdFbCA9IHRhcmdldDtcbiAgICAgIHBhcmVudEVsID0gZHJhZ0VsLnBhcmVudE5vZGU7XG4gICAgICBuZXh0RWwgPSBkcmFnRWwubmV4dFNpYmxpbmc7XG4gICAgICBsYXN0RG93bkVsID0gdGFyZ2V0O1xuICAgICAgYWN0aXZlR3JvdXAgPSBvcHRpb25zLmdyb3VwO1xuICAgICAgU29ydGFibGUuZHJhZ2dlZCA9IGRyYWdFbDtcbiAgICAgIHRhcEV2dCA9IHtcbiAgICAgICAgdGFyZ2V0OiBkcmFnRWwsXG4gICAgICAgIGNsaWVudFg6ICh0b3VjaCB8fCBldnQpLmNsaWVudFgsXG4gICAgICAgIGNsaWVudFk6ICh0b3VjaCB8fCBldnQpLmNsaWVudFlcbiAgICAgIH07XG4gICAgICB0YXBEaXN0YW5jZUxlZnQgPSB0YXBFdnQuY2xpZW50WCAtIGRyYWdSZWN0LmxlZnQ7XG4gICAgICB0YXBEaXN0YW5jZVRvcCA9IHRhcEV2dC5jbGllbnRZIC0gZHJhZ1JlY3QudG9wO1xuICAgICAgdGhpcy5fbGFzdFggPSAodG91Y2ggfHwgZXZ0KS5jbGllbnRYO1xuICAgICAgdGhpcy5fbGFzdFkgPSAodG91Y2ggfHwgZXZ0KS5jbGllbnRZO1xuICAgICAgZHJhZ0VsLnN0eWxlWyd3aWxsLWNoYW5nZSddID0gJ2FsbCc7XG4gICAgICBkcmFnU3RhcnRGbiA9IGZ1bmN0aW9uIGRyYWdTdGFydEZuKCkge1xuICAgICAgICBwbHVnaW5FdmVudCgnZGVsYXlFbmRlZCcsIF90aGlzLCB7XG4gICAgICAgICAgZXZ0OiBldnRcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChTb3J0YWJsZS5ldmVudENhbmNlbGVkKSB7XG4gICAgICAgICAgX3RoaXMuX29uRHJvcCgpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyBEZWxheWVkIGRyYWcgaGFzIGJlZW4gdHJpZ2dlcmVkXG4gICAgICAgIC8vIHdlIGNhbiByZS1lbmFibGUgdGhlIGV2ZW50czogdG91Y2htb3ZlL21vdXNlbW92ZVxuICAgICAgICBfdGhpcy5fZGlzYWJsZURlbGF5ZWREcmFnRXZlbnRzKCk7XG4gICAgICAgIGlmICghRmlyZUZveCAmJiBfdGhpcy5uYXRpdmVEcmFnZ2FibGUpIHtcbiAgICAgICAgICBkcmFnRWwuZHJhZ2dhYmxlID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEJpbmQgdGhlIGV2ZW50czogZHJhZ3N0YXJ0L2RyYWdlbmRcbiAgICAgICAgX3RoaXMuX3RyaWdnZXJEcmFnU3RhcnQoZXZ0LCB0b3VjaCk7XG5cbiAgICAgICAgLy8gRHJhZyBzdGFydCBldmVudFxuICAgICAgICBfZGlzcGF0Y2hFdmVudCh7XG4gICAgICAgICAgc29ydGFibGU6IF90aGlzLFxuICAgICAgICAgIG5hbWU6ICdjaG9vc2UnLFxuICAgICAgICAgIG9yaWdpbmFsRXZlbnQ6IGV2dFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBDaG9zZW4gaXRlbVxuICAgICAgICB0b2dnbGVDbGFzcyhkcmFnRWwsIG9wdGlvbnMuY2hvc2VuQ2xhc3MsIHRydWUpO1xuICAgICAgfTtcblxuICAgICAgLy8gRGlzYWJsZSBcImRyYWdnYWJsZVwiXG4gICAgICBvcHRpb25zLmlnbm9yZS5zcGxpdCgnLCcpLmZvckVhY2goZnVuY3Rpb24gKGNyaXRlcmlhKSB7XG4gICAgICAgIGZpbmQoZHJhZ0VsLCBjcml0ZXJpYS50cmltKCksIF9kaXNhYmxlRHJhZ2dhYmxlKTtcbiAgICAgIH0pO1xuICAgICAgb24ob3duZXJEb2N1bWVudCwgJ2RyYWdvdmVyJywgbmVhcmVzdEVtcHR5SW5zZXJ0RGV0ZWN0RXZlbnQpO1xuICAgICAgb24ob3duZXJEb2N1bWVudCwgJ21vdXNlbW92ZScsIG5lYXJlc3RFbXB0eUluc2VydERldGVjdEV2ZW50KTtcbiAgICAgIG9uKG93bmVyRG9jdW1lbnQsICd0b3VjaG1vdmUnLCBuZWFyZXN0RW1wdHlJbnNlcnREZXRlY3RFdmVudCk7XG4gICAgICBpZiAob3B0aW9ucy5zdXBwb3J0UG9pbnRlcikge1xuICAgICAgICBvbihvd25lckRvY3VtZW50LCAncG9pbnRlcnVwJywgX3RoaXMuX29uRHJvcCk7XG4gICAgICAgIC8vIE5hdGl2ZSBEJkQgdHJpZ2dlcnMgcG9pbnRlcmNhbmNlbFxuICAgICAgICAhdGhpcy5uYXRpdmVEcmFnZ2FibGUgJiYgb24ob3duZXJEb2N1bWVudCwgJ3BvaW50ZXJjYW5jZWwnLCBfdGhpcy5fb25Ecm9wKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG9uKG93bmVyRG9jdW1lbnQsICdtb3VzZXVwJywgX3RoaXMuX29uRHJvcCk7XG4gICAgICAgIG9uKG93bmVyRG9jdW1lbnQsICd0b3VjaGVuZCcsIF90aGlzLl9vbkRyb3ApO1xuICAgICAgICBvbihvd25lckRvY3VtZW50LCAndG91Y2hjYW5jZWwnLCBfdGhpcy5fb25Ecm9wKTtcbiAgICAgIH1cblxuICAgICAgLy8gTWFrZSBkcmFnRWwgZHJhZ2dhYmxlIChtdXN0IGJlIGJlZm9yZSBkZWxheSBmb3IgRmlyZUZveClcbiAgICAgIGlmIChGaXJlRm94ICYmIHRoaXMubmF0aXZlRHJhZ2dhYmxlKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy50b3VjaFN0YXJ0VGhyZXNob2xkID0gNDtcbiAgICAgICAgZHJhZ0VsLmRyYWdnYWJsZSA9IHRydWU7XG4gICAgICB9XG4gICAgICBwbHVnaW5FdmVudCgnZGVsYXlTdGFydCcsIHRoaXMsIHtcbiAgICAgICAgZXZ0OiBldnRcbiAgICAgIH0pO1xuXG4gICAgICAvLyBEZWxheSBpcyBpbXBvc3NpYmxlIGZvciBuYXRpdmUgRG5EIGluIEVkZ2Ugb3IgSUVcbiAgICAgIGlmIChvcHRpb25zLmRlbGF5ICYmICghb3B0aW9ucy5kZWxheU9uVG91Y2hPbmx5IHx8IHRvdWNoKSAmJiAoIXRoaXMubmF0aXZlRHJhZ2dhYmxlIHx8ICEoRWRnZSB8fCBJRTExT3JMZXNzKSkpIHtcbiAgICAgICAgaWYgKFNvcnRhYmxlLmV2ZW50Q2FuY2VsZWQpIHtcbiAgICAgICAgICB0aGlzLl9vbkRyb3AoKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8gSWYgdGhlIHVzZXIgbW92ZXMgdGhlIHBvaW50ZXIgb3IgbGV0IGdvIHRoZSBjbGljayBvciB0b3VjaFxuICAgICAgICAvLyBiZWZvcmUgdGhlIGRlbGF5IGhhcyBiZWVuIHJlYWNoZWQ6XG4gICAgICAgIC8vIGRpc2FibGUgdGhlIGRlbGF5ZWQgZHJhZ1xuICAgICAgICBpZiAob3B0aW9ucy5zdXBwb3J0UG9pbnRlcikge1xuICAgICAgICAgIG9uKG93bmVyRG9jdW1lbnQsICdwb2ludGVydXAnLCBfdGhpcy5fZGlzYWJsZURlbGF5ZWREcmFnKTtcbiAgICAgICAgICBvbihvd25lckRvY3VtZW50LCAncG9pbnRlcmNhbmNlbCcsIF90aGlzLl9kaXNhYmxlRGVsYXllZERyYWcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG9uKG93bmVyRG9jdW1lbnQsICdtb3VzZXVwJywgX3RoaXMuX2Rpc2FibGVEZWxheWVkRHJhZyk7XG4gICAgICAgICAgb24ob3duZXJEb2N1bWVudCwgJ3RvdWNoZW5kJywgX3RoaXMuX2Rpc2FibGVEZWxheWVkRHJhZyk7XG4gICAgICAgICAgb24ob3duZXJEb2N1bWVudCwgJ3RvdWNoY2FuY2VsJywgX3RoaXMuX2Rpc2FibGVEZWxheWVkRHJhZyk7XG4gICAgICAgIH1cbiAgICAgICAgb24ob3duZXJEb2N1bWVudCwgJ21vdXNlbW92ZScsIF90aGlzLl9kZWxheWVkRHJhZ1RvdWNoTW92ZUhhbmRsZXIpO1xuICAgICAgICBvbihvd25lckRvY3VtZW50LCAndG91Y2htb3ZlJywgX3RoaXMuX2RlbGF5ZWREcmFnVG91Y2hNb3ZlSGFuZGxlcik7XG4gICAgICAgIG9wdGlvbnMuc3VwcG9ydFBvaW50ZXIgJiYgb24ob3duZXJEb2N1bWVudCwgJ3BvaW50ZXJtb3ZlJywgX3RoaXMuX2RlbGF5ZWREcmFnVG91Y2hNb3ZlSGFuZGxlcik7XG4gICAgICAgIF90aGlzLl9kcmFnU3RhcnRUaW1lciA9IHNldFRpbWVvdXQoZHJhZ1N0YXJ0Rm4sIG9wdGlvbnMuZGVsYXkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZHJhZ1N0YXJ0Rm4oKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIF9kZWxheWVkRHJhZ1RvdWNoTW92ZUhhbmRsZXI6IGZ1bmN0aW9uIF9kZWxheWVkRHJhZ1RvdWNoTW92ZUhhbmRsZXIoIC8qKiBUb3VjaEV2ZW50fFBvaW50ZXJFdmVudCAqKi9lKSB7XG4gICAgdmFyIHRvdWNoID0gZS50b3VjaGVzID8gZS50b3VjaGVzWzBdIDogZTtcbiAgICBpZiAoTWF0aC5tYXgoTWF0aC5hYnModG91Y2guY2xpZW50WCAtIHRoaXMuX2xhc3RYKSwgTWF0aC5hYnModG91Y2guY2xpZW50WSAtIHRoaXMuX2xhc3RZKSkgPj0gTWF0aC5mbG9vcih0aGlzLm9wdGlvbnMudG91Y2hTdGFydFRocmVzaG9sZCAvICh0aGlzLm5hdGl2ZURyYWdnYWJsZSAmJiB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyB8fCAxKSkpIHtcbiAgICAgIHRoaXMuX2Rpc2FibGVEZWxheWVkRHJhZygpO1xuICAgIH1cbiAgfSxcbiAgX2Rpc2FibGVEZWxheWVkRHJhZzogZnVuY3Rpb24gX2Rpc2FibGVEZWxheWVkRHJhZygpIHtcbiAgICBkcmFnRWwgJiYgX2Rpc2FibGVEcmFnZ2FibGUoZHJhZ0VsKTtcbiAgICBjbGVhclRpbWVvdXQodGhpcy5fZHJhZ1N0YXJ0VGltZXIpO1xuICAgIHRoaXMuX2Rpc2FibGVEZWxheWVkRHJhZ0V2ZW50cygpO1xuICB9LFxuICBfZGlzYWJsZURlbGF5ZWREcmFnRXZlbnRzOiBmdW5jdGlvbiBfZGlzYWJsZURlbGF5ZWREcmFnRXZlbnRzKCkge1xuICAgIHZhciBvd25lckRvY3VtZW50ID0gdGhpcy5lbC5vd25lckRvY3VtZW50O1xuICAgIG9mZihvd25lckRvY3VtZW50LCAnbW91c2V1cCcsIHRoaXMuX2Rpc2FibGVEZWxheWVkRHJhZyk7XG4gICAgb2ZmKG93bmVyRG9jdW1lbnQsICd0b3VjaGVuZCcsIHRoaXMuX2Rpc2FibGVEZWxheWVkRHJhZyk7XG4gICAgb2ZmKG93bmVyRG9jdW1lbnQsICd0b3VjaGNhbmNlbCcsIHRoaXMuX2Rpc2FibGVEZWxheWVkRHJhZyk7XG4gICAgb2ZmKG93bmVyRG9jdW1lbnQsICdwb2ludGVydXAnLCB0aGlzLl9kaXNhYmxlRGVsYXllZERyYWcpO1xuICAgIG9mZihvd25lckRvY3VtZW50LCAncG9pbnRlcmNhbmNlbCcsIHRoaXMuX2Rpc2FibGVEZWxheWVkRHJhZyk7XG4gICAgb2ZmKG93bmVyRG9jdW1lbnQsICdtb3VzZW1vdmUnLCB0aGlzLl9kZWxheWVkRHJhZ1RvdWNoTW92ZUhhbmRsZXIpO1xuICAgIG9mZihvd25lckRvY3VtZW50LCAndG91Y2htb3ZlJywgdGhpcy5fZGVsYXllZERyYWdUb3VjaE1vdmVIYW5kbGVyKTtcbiAgICBvZmYob3duZXJEb2N1bWVudCwgJ3BvaW50ZXJtb3ZlJywgdGhpcy5fZGVsYXllZERyYWdUb3VjaE1vdmVIYW5kbGVyKTtcbiAgfSxcbiAgX3RyaWdnZXJEcmFnU3RhcnQ6IGZ1bmN0aW9uIF90cmlnZ2VyRHJhZ1N0YXJ0KCAvKiogRXZlbnQgKi9ldnQsIC8qKiBUb3VjaCAqL3RvdWNoKSB7XG4gICAgdG91Y2ggPSB0b3VjaCB8fCBldnQucG9pbnRlclR5cGUgPT0gJ3RvdWNoJyAmJiBldnQ7XG4gICAgaWYgKCF0aGlzLm5hdGl2ZURyYWdnYWJsZSB8fCB0b3VjaCkge1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5zdXBwb3J0UG9pbnRlcikge1xuICAgICAgICBvbihkb2N1bWVudCwgJ3BvaW50ZXJtb3ZlJywgdGhpcy5fb25Ub3VjaE1vdmUpO1xuICAgICAgfSBlbHNlIGlmICh0b3VjaCkge1xuICAgICAgICBvbihkb2N1bWVudCwgJ3RvdWNobW92ZScsIHRoaXMuX29uVG91Y2hNb3ZlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG9uKGRvY3VtZW50LCAnbW91c2Vtb3ZlJywgdGhpcy5fb25Ub3VjaE1vdmUpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBvbihkcmFnRWwsICdkcmFnZW5kJywgdGhpcyk7XG4gICAgICBvbihyb290RWwsICdkcmFnc3RhcnQnLCB0aGlzLl9vbkRyYWdTdGFydCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBpZiAoZG9jdW1lbnQuc2VsZWN0aW9uKSB7XG4gICAgICAgIF9uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgZG9jdW1lbnQuc2VsZWN0aW9uLmVtcHR5KCk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgd2luZG93LmdldFNlbGVjdGlvbigpLnJlbW92ZUFsbFJhbmdlcygpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycikge31cbiAgfSxcbiAgX2RyYWdTdGFydGVkOiBmdW5jdGlvbiBfZHJhZ1N0YXJ0ZWQoZmFsbGJhY2ssIGV2dCkge1xuICAgIGF3YWl0aW5nRHJhZ1N0YXJ0ZWQgPSBmYWxzZTtcbiAgICBpZiAocm9vdEVsICYmIGRyYWdFbCkge1xuICAgICAgcGx1Z2luRXZlbnQoJ2RyYWdTdGFydGVkJywgdGhpcywge1xuICAgICAgICBldnQ6IGV2dFxuICAgICAgfSk7XG4gICAgICBpZiAodGhpcy5uYXRpdmVEcmFnZ2FibGUpIHtcbiAgICAgICAgb24oZG9jdW1lbnQsICdkcmFnb3ZlcicsIF9jaGVja091dHNpZGVUYXJnZXRFbCk7XG4gICAgICB9XG4gICAgICB2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcblxuICAgICAgLy8gQXBwbHkgZWZmZWN0XG4gICAgICAhZmFsbGJhY2sgJiYgdG9nZ2xlQ2xhc3MoZHJhZ0VsLCBvcHRpb25zLmRyYWdDbGFzcywgZmFsc2UpO1xuICAgICAgdG9nZ2xlQ2xhc3MoZHJhZ0VsLCBvcHRpb25zLmdob3N0Q2xhc3MsIHRydWUpO1xuICAgICAgU29ydGFibGUuYWN0aXZlID0gdGhpcztcbiAgICAgIGZhbGxiYWNrICYmIHRoaXMuX2FwcGVuZEdob3N0KCk7XG5cbiAgICAgIC8vIERyYWcgc3RhcnQgZXZlbnRcbiAgICAgIF9kaXNwYXRjaEV2ZW50KHtcbiAgICAgICAgc29ydGFibGU6IHRoaXMsXG4gICAgICAgIG5hbWU6ICdzdGFydCcsXG4gICAgICAgIG9yaWdpbmFsRXZlbnQ6IGV2dFxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX251bGxpbmcoKTtcbiAgICB9XG4gIH0sXG4gIF9lbXVsYXRlRHJhZ092ZXI6IGZ1bmN0aW9uIF9lbXVsYXRlRHJhZ092ZXIoKSB7XG4gICAgaWYgKHRvdWNoRXZ0KSB7XG4gICAgICB0aGlzLl9sYXN0WCA9IHRvdWNoRXZ0LmNsaWVudFg7XG4gICAgICB0aGlzLl9sYXN0WSA9IHRvdWNoRXZ0LmNsaWVudFk7XG4gICAgICBfaGlkZUdob3N0Rm9yVGFyZ2V0KCk7XG4gICAgICB2YXIgdGFyZ2V0ID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludCh0b3VjaEV2dC5jbGllbnRYLCB0b3VjaEV2dC5jbGllbnRZKTtcbiAgICAgIHZhciBwYXJlbnQgPSB0YXJnZXQ7XG4gICAgICB3aGlsZSAodGFyZ2V0ICYmIHRhcmdldC5zaGFkb3dSb290KSB7XG4gICAgICAgIHRhcmdldCA9IHRhcmdldC5zaGFkb3dSb290LmVsZW1lbnRGcm9tUG9pbnQodG91Y2hFdnQuY2xpZW50WCwgdG91Y2hFdnQuY2xpZW50WSk7XG4gICAgICAgIGlmICh0YXJnZXQgPT09IHBhcmVudCkgYnJlYWs7XG4gICAgICAgIHBhcmVudCA9IHRhcmdldDtcbiAgICAgIH1cbiAgICAgIGRyYWdFbC5wYXJlbnROb2RlW2V4cGFuZG9dLl9pc091dHNpZGVUaGlzRWwodGFyZ2V0KTtcbiAgICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgZG8ge1xuICAgICAgICAgIGlmIChwYXJlbnRbZXhwYW5kb10pIHtcbiAgICAgICAgICAgIHZhciBpbnNlcnRlZCA9IHZvaWQgMDtcbiAgICAgICAgICAgIGluc2VydGVkID0gcGFyZW50W2V4cGFuZG9dLl9vbkRyYWdPdmVyKHtcbiAgICAgICAgICAgICAgY2xpZW50WDogdG91Y2hFdnQuY2xpZW50WCxcbiAgICAgICAgICAgICAgY2xpZW50WTogdG91Y2hFdnQuY2xpZW50WSxcbiAgICAgICAgICAgICAgdGFyZ2V0OiB0YXJnZXQsXG4gICAgICAgICAgICAgIHJvb3RFbDogcGFyZW50XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChpbnNlcnRlZCAmJiAhdGhpcy5vcHRpb25zLmRyYWdvdmVyQnViYmxlKSB7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICB0YXJnZXQgPSBwYXJlbnQ7IC8vIHN0b3JlIGxhc3QgZWxlbWVudFxuICAgICAgICB9XG4gICAgICAgIC8qIGpzaGludCBib3NzOnRydWUgKi8gd2hpbGUgKHBhcmVudCA9IGdldFBhcmVudE9ySG9zdChwYXJlbnQpKTtcbiAgICAgIH1cbiAgICAgIF91bmhpZGVHaG9zdEZvclRhcmdldCgpO1xuICAgIH1cbiAgfSxcbiAgX29uVG91Y2hNb3ZlOiBmdW5jdGlvbiBfb25Ub3VjaE1vdmUoIC8qKlRvdWNoRXZlbnQqL2V2dCkge1xuICAgIGlmICh0YXBFdnQpIHtcbiAgICAgIHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zLFxuICAgICAgICBmYWxsYmFja1RvbGVyYW5jZSA9IG9wdGlvbnMuZmFsbGJhY2tUb2xlcmFuY2UsXG4gICAgICAgIGZhbGxiYWNrT2Zmc2V0ID0gb3B0aW9ucy5mYWxsYmFja09mZnNldCxcbiAgICAgICAgdG91Y2ggPSBldnQudG91Y2hlcyA/IGV2dC50b3VjaGVzWzBdIDogZXZ0LFxuICAgICAgICBnaG9zdE1hdHJpeCA9IGdob3N0RWwgJiYgbWF0cml4KGdob3N0RWwsIHRydWUpLFxuICAgICAgICBzY2FsZVggPSBnaG9zdEVsICYmIGdob3N0TWF0cml4ICYmIGdob3N0TWF0cml4LmEsXG4gICAgICAgIHNjYWxlWSA9IGdob3N0RWwgJiYgZ2hvc3RNYXRyaXggJiYgZ2hvc3RNYXRyaXguZCxcbiAgICAgICAgcmVsYXRpdmVTY3JvbGxPZmZzZXQgPSBQb3NpdGlvbkdob3N0QWJzb2x1dGVseSAmJiBnaG9zdFJlbGF0aXZlUGFyZW50ICYmIGdldFJlbGF0aXZlU2Nyb2xsT2Zmc2V0KGdob3N0UmVsYXRpdmVQYXJlbnQpLFxuICAgICAgICBkeCA9ICh0b3VjaC5jbGllbnRYIC0gdGFwRXZ0LmNsaWVudFggKyBmYWxsYmFja09mZnNldC54KSAvIChzY2FsZVggfHwgMSkgKyAocmVsYXRpdmVTY3JvbGxPZmZzZXQgPyByZWxhdGl2ZVNjcm9sbE9mZnNldFswXSAtIGdob3N0UmVsYXRpdmVQYXJlbnRJbml0aWFsU2Nyb2xsWzBdIDogMCkgLyAoc2NhbGVYIHx8IDEpLFxuICAgICAgICBkeSA9ICh0b3VjaC5jbGllbnRZIC0gdGFwRXZ0LmNsaWVudFkgKyBmYWxsYmFja09mZnNldC55KSAvIChzY2FsZVkgfHwgMSkgKyAocmVsYXRpdmVTY3JvbGxPZmZzZXQgPyByZWxhdGl2ZVNjcm9sbE9mZnNldFsxXSAtIGdob3N0UmVsYXRpdmVQYXJlbnRJbml0aWFsU2Nyb2xsWzFdIDogMCkgLyAoc2NhbGVZIHx8IDEpO1xuXG4gICAgICAvLyBvbmx5IHNldCB0aGUgc3RhdHVzIHRvIGRyYWdnaW5nLCB3aGVuIHdlIGFyZSBhY3R1YWxseSBkcmFnZ2luZ1xuICAgICAgaWYgKCFTb3J0YWJsZS5hY3RpdmUgJiYgIWF3YWl0aW5nRHJhZ1N0YXJ0ZWQpIHtcbiAgICAgICAgaWYgKGZhbGxiYWNrVG9sZXJhbmNlICYmIE1hdGgubWF4KE1hdGguYWJzKHRvdWNoLmNsaWVudFggLSB0aGlzLl9sYXN0WCksIE1hdGguYWJzKHRvdWNoLmNsaWVudFkgLSB0aGlzLl9sYXN0WSkpIDwgZmFsbGJhY2tUb2xlcmFuY2UpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fb25EcmFnU3RhcnQoZXZ0LCB0cnVlKTtcbiAgICAgIH1cbiAgICAgIGlmIChnaG9zdEVsKSB7XG4gICAgICAgIGlmIChnaG9zdE1hdHJpeCkge1xuICAgICAgICAgIGdob3N0TWF0cml4LmUgKz0gZHggLSAobGFzdER4IHx8IDApO1xuICAgICAgICAgIGdob3N0TWF0cml4LmYgKz0gZHkgLSAobGFzdER5IHx8IDApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGdob3N0TWF0cml4ID0ge1xuICAgICAgICAgICAgYTogMSxcbiAgICAgICAgICAgIGI6IDAsXG4gICAgICAgICAgICBjOiAwLFxuICAgICAgICAgICAgZDogMSxcbiAgICAgICAgICAgIGU6IGR4LFxuICAgICAgICAgICAgZjogZHlcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHZhciBjc3NNYXRyaXggPSBcIm1hdHJpeChcIi5jb25jYXQoZ2hvc3RNYXRyaXguYSwgXCIsXCIpLmNvbmNhdChnaG9zdE1hdHJpeC5iLCBcIixcIikuY29uY2F0KGdob3N0TWF0cml4LmMsIFwiLFwiKS5jb25jYXQoZ2hvc3RNYXRyaXguZCwgXCIsXCIpLmNvbmNhdChnaG9zdE1hdHJpeC5lLCBcIixcIikuY29uY2F0KGdob3N0TWF0cml4LmYsIFwiKVwiKTtcbiAgICAgICAgY3NzKGdob3N0RWwsICd3ZWJraXRUcmFuc2Zvcm0nLCBjc3NNYXRyaXgpO1xuICAgICAgICBjc3MoZ2hvc3RFbCwgJ21velRyYW5zZm9ybScsIGNzc01hdHJpeCk7XG4gICAgICAgIGNzcyhnaG9zdEVsLCAnbXNUcmFuc2Zvcm0nLCBjc3NNYXRyaXgpO1xuICAgICAgICBjc3MoZ2hvc3RFbCwgJ3RyYW5zZm9ybScsIGNzc01hdHJpeCk7XG4gICAgICAgIGxhc3REeCA9IGR4O1xuICAgICAgICBsYXN0RHkgPSBkeTtcbiAgICAgICAgdG91Y2hFdnQgPSB0b3VjaDtcbiAgICAgIH1cbiAgICAgIGV2dC5jYW5jZWxhYmxlICYmIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cbiAgfSxcbiAgX2FwcGVuZEdob3N0OiBmdW5jdGlvbiBfYXBwZW5kR2hvc3QoKSB7XG4gICAgLy8gQnVnIGlmIHVzaW5nIHNjYWxlKCk6IGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzI2MzcwNThcbiAgICAvLyBOb3QgYmVpbmcgYWRqdXN0ZWQgZm9yXG4gICAgaWYgKCFnaG9zdEVsKSB7XG4gICAgICB2YXIgY29udGFpbmVyID0gdGhpcy5vcHRpb25zLmZhbGxiYWNrT25Cb2R5ID8gZG9jdW1lbnQuYm9keSA6IHJvb3RFbCxcbiAgICAgICAgcmVjdCA9IGdldFJlY3QoZHJhZ0VsLCB0cnVlLCBQb3NpdGlvbkdob3N0QWJzb2x1dGVseSwgdHJ1ZSwgY29udGFpbmVyKSxcbiAgICAgICAgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcblxuICAgICAgLy8gUG9zaXRpb24gYWJzb2x1dGVseVxuICAgICAgaWYgKFBvc2l0aW9uR2hvc3RBYnNvbHV0ZWx5KSB7XG4gICAgICAgIC8vIEdldCByZWxhdGl2ZWx5IHBvc2l0aW9uZWQgcGFyZW50XG4gICAgICAgIGdob3N0UmVsYXRpdmVQYXJlbnQgPSBjb250YWluZXI7XG4gICAgICAgIHdoaWxlIChjc3MoZ2hvc3RSZWxhdGl2ZVBhcmVudCwgJ3Bvc2l0aW9uJykgPT09ICdzdGF0aWMnICYmIGNzcyhnaG9zdFJlbGF0aXZlUGFyZW50LCAndHJhbnNmb3JtJykgPT09ICdub25lJyAmJiBnaG9zdFJlbGF0aXZlUGFyZW50ICE9PSBkb2N1bWVudCkge1xuICAgICAgICAgIGdob3N0UmVsYXRpdmVQYXJlbnQgPSBnaG9zdFJlbGF0aXZlUGFyZW50LnBhcmVudE5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGdob3N0UmVsYXRpdmVQYXJlbnQgIT09IGRvY3VtZW50LmJvZHkgJiYgZ2hvc3RSZWxhdGl2ZVBhcmVudCAhPT0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50KSB7XG4gICAgICAgICAgaWYgKGdob3N0UmVsYXRpdmVQYXJlbnQgPT09IGRvY3VtZW50KSBnaG9zdFJlbGF0aXZlUGFyZW50ID0gZ2V0V2luZG93U2Nyb2xsaW5nRWxlbWVudCgpO1xuICAgICAgICAgIHJlY3QudG9wICs9IGdob3N0UmVsYXRpdmVQYXJlbnQuc2Nyb2xsVG9wO1xuICAgICAgICAgIHJlY3QubGVmdCArPSBnaG9zdFJlbGF0aXZlUGFyZW50LnNjcm9sbExlZnQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZ2hvc3RSZWxhdGl2ZVBhcmVudCA9IGdldFdpbmRvd1Njcm9sbGluZ0VsZW1lbnQoKTtcbiAgICAgICAgfVxuICAgICAgICBnaG9zdFJlbGF0aXZlUGFyZW50SW5pdGlhbFNjcm9sbCA9IGdldFJlbGF0aXZlU2Nyb2xsT2Zmc2V0KGdob3N0UmVsYXRpdmVQYXJlbnQpO1xuICAgICAgfVxuICAgICAgZ2hvc3RFbCA9IGRyYWdFbC5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICB0b2dnbGVDbGFzcyhnaG9zdEVsLCBvcHRpb25zLmdob3N0Q2xhc3MsIGZhbHNlKTtcbiAgICAgIHRvZ2dsZUNsYXNzKGdob3N0RWwsIG9wdGlvbnMuZmFsbGJhY2tDbGFzcywgdHJ1ZSk7XG4gICAgICB0b2dnbGVDbGFzcyhnaG9zdEVsLCBvcHRpb25zLmRyYWdDbGFzcywgdHJ1ZSk7XG4gICAgICBjc3MoZ2hvc3RFbCwgJ3RyYW5zaXRpb24nLCAnJyk7XG4gICAgICBjc3MoZ2hvc3RFbCwgJ3RyYW5zZm9ybScsICcnKTtcbiAgICAgIGNzcyhnaG9zdEVsLCAnYm94LXNpemluZycsICdib3JkZXItYm94Jyk7XG4gICAgICBjc3MoZ2hvc3RFbCwgJ21hcmdpbicsIDApO1xuICAgICAgY3NzKGdob3N0RWwsICd0b3AnLCByZWN0LnRvcCk7XG4gICAgICBjc3MoZ2hvc3RFbCwgJ2xlZnQnLCByZWN0LmxlZnQpO1xuICAgICAgY3NzKGdob3N0RWwsICd3aWR0aCcsIHJlY3Qud2lkdGgpO1xuICAgICAgY3NzKGdob3N0RWwsICdoZWlnaHQnLCByZWN0LmhlaWdodCk7XG4gICAgICBjc3MoZ2hvc3RFbCwgJ29wYWNpdHknLCAnMC44Jyk7XG4gICAgICBjc3MoZ2hvc3RFbCwgJ3Bvc2l0aW9uJywgUG9zaXRpb25HaG9zdEFic29sdXRlbHkgPyAnYWJzb2x1dGUnIDogJ2ZpeGVkJyk7XG4gICAgICBjc3MoZ2hvc3RFbCwgJ3pJbmRleCcsICcxMDAwMDAnKTtcbiAgICAgIGNzcyhnaG9zdEVsLCAncG9pbnRlckV2ZW50cycsICdub25lJyk7XG4gICAgICBTb3J0YWJsZS5naG9zdCA9IGdob3N0RWw7XG4gICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoZ2hvc3RFbCk7XG5cbiAgICAgIC8vIFNldCB0cmFuc2Zvcm0tb3JpZ2luXG4gICAgICBjc3MoZ2hvc3RFbCwgJ3RyYW5zZm9ybS1vcmlnaW4nLCB0YXBEaXN0YW5jZUxlZnQgLyBwYXJzZUludChnaG9zdEVsLnN0eWxlLndpZHRoKSAqIDEwMCArICclICcgKyB0YXBEaXN0YW5jZVRvcCAvIHBhcnNlSW50KGdob3N0RWwuc3R5bGUuaGVpZ2h0KSAqIDEwMCArICclJyk7XG4gICAgfVxuICB9LFxuICBfb25EcmFnU3RhcnQ6IGZ1bmN0aW9uIF9vbkRyYWdTdGFydCggLyoqRXZlbnQqL2V2dCwgLyoqYm9vbGVhbiovZmFsbGJhY2spIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHZhciBkYXRhVHJhbnNmZXIgPSBldnQuZGF0YVRyYW5zZmVyO1xuICAgIHZhciBvcHRpb25zID0gX3RoaXMub3B0aW9ucztcbiAgICBwbHVnaW5FdmVudCgnZHJhZ1N0YXJ0JywgdGhpcywge1xuICAgICAgZXZ0OiBldnRcbiAgICB9KTtcbiAgICBpZiAoU29ydGFibGUuZXZlbnRDYW5jZWxlZCkge1xuICAgICAgdGhpcy5fb25Ecm9wKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHBsdWdpbkV2ZW50KCdzZXR1cENsb25lJywgdGhpcyk7XG4gICAgaWYgKCFTb3J0YWJsZS5ldmVudENhbmNlbGVkKSB7XG4gICAgICBjbG9uZUVsID0gY2xvbmUoZHJhZ0VsKTtcbiAgICAgIGNsb25lRWwucmVtb3ZlQXR0cmlidXRlKFwiaWRcIik7XG4gICAgICBjbG9uZUVsLmRyYWdnYWJsZSA9IGZhbHNlO1xuICAgICAgY2xvbmVFbC5zdHlsZVsnd2lsbC1jaGFuZ2UnXSA9ICcnO1xuICAgICAgdGhpcy5faGlkZUNsb25lKCk7XG4gICAgICB0b2dnbGVDbGFzcyhjbG9uZUVsLCB0aGlzLm9wdGlvbnMuY2hvc2VuQ2xhc3MsIGZhbHNlKTtcbiAgICAgIFNvcnRhYmxlLmNsb25lID0gY2xvbmVFbDtcbiAgICB9XG5cbiAgICAvLyAjMTE0MzogSUZyYW1lIHN1cHBvcnQgd29ya2Fyb3VuZFxuICAgIF90aGlzLmNsb25lSWQgPSBfbmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgcGx1Z2luRXZlbnQoJ2Nsb25lJywgX3RoaXMpO1xuICAgICAgaWYgKFNvcnRhYmxlLmV2ZW50Q2FuY2VsZWQpIHJldHVybjtcbiAgICAgIGlmICghX3RoaXMub3B0aW9ucy5yZW1vdmVDbG9uZU9uSGlkZSkge1xuICAgICAgICByb290RWwuaW5zZXJ0QmVmb3JlKGNsb25lRWwsIGRyYWdFbCk7XG4gICAgICB9XG4gICAgICBfdGhpcy5faGlkZUNsb25lKCk7XG4gICAgICBfZGlzcGF0Y2hFdmVudCh7XG4gICAgICAgIHNvcnRhYmxlOiBfdGhpcyxcbiAgICAgICAgbmFtZTogJ2Nsb25lJ1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgIWZhbGxiYWNrICYmIHRvZ2dsZUNsYXNzKGRyYWdFbCwgb3B0aW9ucy5kcmFnQ2xhc3MsIHRydWUpO1xuXG4gICAgLy8gU2V0IHByb3BlciBkcm9wIGV2ZW50c1xuICAgIGlmIChmYWxsYmFjaykge1xuICAgICAgaWdub3JlTmV4dENsaWNrID0gdHJ1ZTtcbiAgICAgIF90aGlzLl9sb29wSWQgPSBzZXRJbnRlcnZhbChfdGhpcy5fZW11bGF0ZURyYWdPdmVyLCA1MCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFVuZG8gd2hhdCB3YXMgc2V0IGluIF9wcmVwYXJlRHJhZ1N0YXJ0IGJlZm9yZSBkcmFnIHN0YXJ0ZWRcbiAgICAgIG9mZihkb2N1bWVudCwgJ21vdXNldXAnLCBfdGhpcy5fb25Ecm9wKTtcbiAgICAgIG9mZihkb2N1bWVudCwgJ3RvdWNoZW5kJywgX3RoaXMuX29uRHJvcCk7XG4gICAgICBvZmYoZG9jdW1lbnQsICd0b3VjaGNhbmNlbCcsIF90aGlzLl9vbkRyb3ApO1xuICAgICAgaWYgKGRhdGFUcmFuc2Zlcikge1xuICAgICAgICBkYXRhVHJhbnNmZXIuZWZmZWN0QWxsb3dlZCA9ICdtb3ZlJztcbiAgICAgICAgb3B0aW9ucy5zZXREYXRhICYmIG9wdGlvbnMuc2V0RGF0YS5jYWxsKF90aGlzLCBkYXRhVHJhbnNmZXIsIGRyYWdFbCk7XG4gICAgICB9XG4gICAgICBvbihkb2N1bWVudCwgJ2Ryb3AnLCBfdGhpcyk7XG5cbiAgICAgIC8vICMxMjc2IGZpeDpcbiAgICAgIGNzcyhkcmFnRWwsICd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlWigwKScpO1xuICAgIH1cbiAgICBhd2FpdGluZ0RyYWdTdGFydGVkID0gdHJ1ZTtcbiAgICBfdGhpcy5fZHJhZ1N0YXJ0SWQgPSBfbmV4dFRpY2soX3RoaXMuX2RyYWdTdGFydGVkLmJpbmQoX3RoaXMsIGZhbGxiYWNrLCBldnQpKTtcbiAgICBvbihkb2N1bWVudCwgJ3NlbGVjdHN0YXJ0JywgX3RoaXMpO1xuICAgIG1vdmVkID0gdHJ1ZTtcbiAgICB3aW5kb3cuZ2V0U2VsZWN0aW9uKCkucmVtb3ZlQWxsUmFuZ2VzKCk7XG4gICAgaWYgKFNhZmFyaSkge1xuICAgICAgY3NzKGRvY3VtZW50LmJvZHksICd1c2VyLXNlbGVjdCcsICdub25lJyk7XG4gICAgfVxuICB9LFxuICAvLyBSZXR1cm5zIHRydWUgLSBpZiBubyBmdXJ0aGVyIGFjdGlvbiBpcyBuZWVkZWQgKGVpdGhlciBpbnNlcnRlZCBvciBhbm90aGVyIGNvbmRpdGlvbilcbiAgX29uRHJhZ092ZXI6IGZ1bmN0aW9uIF9vbkRyYWdPdmVyKCAvKipFdmVudCovZXZ0KSB7XG4gICAgdmFyIGVsID0gdGhpcy5lbCxcbiAgICAgIHRhcmdldCA9IGV2dC50YXJnZXQsXG4gICAgICBkcmFnUmVjdCxcbiAgICAgIHRhcmdldFJlY3QsXG4gICAgICByZXZlcnQsXG4gICAgICBvcHRpb25zID0gdGhpcy5vcHRpb25zLFxuICAgICAgZ3JvdXAgPSBvcHRpb25zLmdyb3VwLFxuICAgICAgYWN0aXZlU29ydGFibGUgPSBTb3J0YWJsZS5hY3RpdmUsXG4gICAgICBpc093bmVyID0gYWN0aXZlR3JvdXAgPT09IGdyb3VwLFxuICAgICAgY2FuU29ydCA9IG9wdGlvbnMuc29ydCxcbiAgICAgIGZyb21Tb3J0YWJsZSA9IHB1dFNvcnRhYmxlIHx8IGFjdGl2ZVNvcnRhYmxlLFxuICAgICAgdmVydGljYWwsXG4gICAgICBfdGhpcyA9IHRoaXMsXG4gICAgICBjb21wbGV0ZWRGaXJlZCA9IGZhbHNlO1xuICAgIGlmIChfc2lsZW50KSByZXR1cm47XG4gICAgZnVuY3Rpb24gZHJhZ092ZXJFdmVudChuYW1lLCBleHRyYSkge1xuICAgICAgcGx1Z2luRXZlbnQobmFtZSwgX3RoaXMsIF9vYmplY3RTcHJlYWQyKHtcbiAgICAgICAgZXZ0OiBldnQsXG4gICAgICAgIGlzT3duZXI6IGlzT3duZXIsXG4gICAgICAgIGF4aXM6IHZlcnRpY2FsID8gJ3ZlcnRpY2FsJyA6ICdob3Jpem9udGFsJyxcbiAgICAgICAgcmV2ZXJ0OiByZXZlcnQsXG4gICAgICAgIGRyYWdSZWN0OiBkcmFnUmVjdCxcbiAgICAgICAgdGFyZ2V0UmVjdDogdGFyZ2V0UmVjdCxcbiAgICAgICAgY2FuU29ydDogY2FuU29ydCxcbiAgICAgICAgZnJvbVNvcnRhYmxlOiBmcm9tU29ydGFibGUsXG4gICAgICAgIHRhcmdldDogdGFyZ2V0LFxuICAgICAgICBjb21wbGV0ZWQ6IGNvbXBsZXRlZCxcbiAgICAgICAgb25Nb3ZlOiBmdW5jdGlvbiBvbk1vdmUodGFyZ2V0LCBhZnRlcikge1xuICAgICAgICAgIHJldHVybiBfb25Nb3ZlKHJvb3RFbCwgZWwsIGRyYWdFbCwgZHJhZ1JlY3QsIHRhcmdldCwgZ2V0UmVjdCh0YXJnZXQpLCBldnQsIGFmdGVyKTtcbiAgICAgICAgfSxcbiAgICAgICAgY2hhbmdlZDogY2hhbmdlZFxuICAgICAgfSwgZXh0cmEpKTtcbiAgICB9XG5cbiAgICAvLyBDYXB0dXJlIGFuaW1hdGlvbiBzdGF0ZVxuICAgIGZ1bmN0aW9uIGNhcHR1cmUoKSB7XG4gICAgICBkcmFnT3ZlckV2ZW50KCdkcmFnT3ZlckFuaW1hdGlvbkNhcHR1cmUnKTtcbiAgICAgIF90aGlzLmNhcHR1cmVBbmltYXRpb25TdGF0ZSgpO1xuICAgICAgaWYgKF90aGlzICE9PSBmcm9tU29ydGFibGUpIHtcbiAgICAgICAgZnJvbVNvcnRhYmxlLmNhcHR1cmVBbmltYXRpb25TdGF0ZSgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFJldHVybiBpbnZvY2F0aW9uIHdoZW4gZHJhZ0VsIGlzIGluc2VydGVkIChvciBjb21wbGV0ZWQpXG4gICAgZnVuY3Rpb24gY29tcGxldGVkKGluc2VydGlvbikge1xuICAgICAgZHJhZ092ZXJFdmVudCgnZHJhZ092ZXJDb21wbGV0ZWQnLCB7XG4gICAgICAgIGluc2VydGlvbjogaW5zZXJ0aW9uXG4gICAgICB9KTtcbiAgICAgIGlmIChpbnNlcnRpb24pIHtcbiAgICAgICAgLy8gQ2xvbmVzIG11c3QgYmUgaGlkZGVuIGJlZm9yZSBmb2xkaW5nIGFuaW1hdGlvbiB0byBjYXB0dXJlIGRyYWdSZWN0QWJzb2x1dGUgcHJvcGVybHlcbiAgICAgICAgaWYgKGlzT3duZXIpIHtcbiAgICAgICAgICBhY3RpdmVTb3J0YWJsZS5faGlkZUNsb25lKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYWN0aXZlU29ydGFibGUuX3Nob3dDbG9uZShfdGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKF90aGlzICE9PSBmcm9tU29ydGFibGUpIHtcbiAgICAgICAgICAvLyBTZXQgZ2hvc3QgY2xhc3MgdG8gbmV3IHNvcnRhYmxlJ3MgZ2hvc3QgY2xhc3NcbiAgICAgICAgICB0b2dnbGVDbGFzcyhkcmFnRWwsIHB1dFNvcnRhYmxlID8gcHV0U29ydGFibGUub3B0aW9ucy5naG9zdENsYXNzIDogYWN0aXZlU29ydGFibGUub3B0aW9ucy5naG9zdENsYXNzLCBmYWxzZSk7XG4gICAgICAgICAgdG9nZ2xlQ2xhc3MoZHJhZ0VsLCBvcHRpb25zLmdob3N0Q2xhc3MsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwdXRTb3J0YWJsZSAhPT0gX3RoaXMgJiYgX3RoaXMgIT09IFNvcnRhYmxlLmFjdGl2ZSkge1xuICAgICAgICAgIHB1dFNvcnRhYmxlID0gX3RoaXM7XG4gICAgICAgIH0gZWxzZSBpZiAoX3RoaXMgPT09IFNvcnRhYmxlLmFjdGl2ZSAmJiBwdXRTb3J0YWJsZSkge1xuICAgICAgICAgIHB1dFNvcnRhYmxlID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFuaW1hdGlvblxuICAgICAgICBpZiAoZnJvbVNvcnRhYmxlID09PSBfdGhpcykge1xuICAgICAgICAgIF90aGlzLl9pZ25vcmVXaGlsZUFuaW1hdGluZyA9IHRhcmdldDtcbiAgICAgICAgfVxuICAgICAgICBfdGhpcy5hbmltYXRlQWxsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBkcmFnT3ZlckV2ZW50KCdkcmFnT3ZlckFuaW1hdGlvbkNvbXBsZXRlJyk7XG4gICAgICAgICAgX3RoaXMuX2lnbm9yZVdoaWxlQW5pbWF0aW5nID0gbnVsbDtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChfdGhpcyAhPT0gZnJvbVNvcnRhYmxlKSB7XG4gICAgICAgICAgZnJvbVNvcnRhYmxlLmFuaW1hdGVBbGwoKTtcbiAgICAgICAgICBmcm9tU29ydGFibGUuX2lnbm9yZVdoaWxlQW5pbWF0aW5nID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBOdWxsIGxhc3RUYXJnZXQgaWYgaXQgaXMgbm90IGluc2lkZSBhIHByZXZpb3VzbHkgc3dhcHBlZCBlbGVtZW50XG4gICAgICBpZiAodGFyZ2V0ID09PSBkcmFnRWwgJiYgIWRyYWdFbC5hbmltYXRlZCB8fCB0YXJnZXQgPT09IGVsICYmICF0YXJnZXQuYW5pbWF0ZWQpIHtcbiAgICAgICAgbGFzdFRhcmdldCA9IG51bGw7XG4gICAgICB9XG5cbiAgICAgIC8vIG5vIGJ1YmJsaW5nIGFuZCBub3QgZmFsbGJhY2tcbiAgICAgIGlmICghb3B0aW9ucy5kcmFnb3ZlckJ1YmJsZSAmJiAhZXZ0LnJvb3RFbCAmJiB0YXJnZXQgIT09IGRvY3VtZW50KSB7XG4gICAgICAgIGRyYWdFbC5wYXJlbnROb2RlW2V4cGFuZG9dLl9pc091dHNpZGVUaGlzRWwoZXZ0LnRhcmdldCk7XG5cbiAgICAgICAgLy8gRG8gbm90IGRldGVjdCBmb3IgZW1wdHkgaW5zZXJ0IGlmIGFscmVhZHkgaW5zZXJ0ZWRcbiAgICAgICAgIWluc2VydGlvbiAmJiBuZWFyZXN0RW1wdHlJbnNlcnREZXRlY3RFdmVudChldnQpO1xuICAgICAgfVxuICAgICAgIW9wdGlvbnMuZHJhZ292ZXJCdWJibGUgJiYgZXZ0LnN0b3BQcm9wYWdhdGlvbiAmJiBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICByZXR1cm4gY29tcGxldGVkRmlyZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIENhbGwgd2hlbiBkcmFnRWwgaGFzIGJlZW4gaW5zZXJ0ZWRcbiAgICBmdW5jdGlvbiBjaGFuZ2VkKCkge1xuICAgICAgbmV3SW5kZXggPSBpbmRleChkcmFnRWwpO1xuICAgICAgbmV3RHJhZ2dhYmxlSW5kZXggPSBpbmRleChkcmFnRWwsIG9wdGlvbnMuZHJhZ2dhYmxlKTtcbiAgICAgIF9kaXNwYXRjaEV2ZW50KHtcbiAgICAgICAgc29ydGFibGU6IF90aGlzLFxuICAgICAgICBuYW1lOiAnY2hhbmdlJyxcbiAgICAgICAgdG9FbDogZWwsXG4gICAgICAgIG5ld0luZGV4OiBuZXdJbmRleCxcbiAgICAgICAgbmV3RHJhZ2dhYmxlSW5kZXg6IG5ld0RyYWdnYWJsZUluZGV4LFxuICAgICAgICBvcmlnaW5hbEV2ZW50OiBldnRcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAoZXZ0LnByZXZlbnREZWZhdWx0ICE9PSB2b2lkIDApIHtcbiAgICAgIGV2dC5jYW5jZWxhYmxlICYmIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cbiAgICB0YXJnZXQgPSBjbG9zZXN0KHRhcmdldCwgb3B0aW9ucy5kcmFnZ2FibGUsIGVsLCB0cnVlKTtcbiAgICBkcmFnT3ZlckV2ZW50KCdkcmFnT3ZlcicpO1xuICAgIGlmIChTb3J0YWJsZS5ldmVudENhbmNlbGVkKSByZXR1cm4gY29tcGxldGVkRmlyZWQ7XG4gICAgaWYgKGRyYWdFbC5jb250YWlucyhldnQudGFyZ2V0KSB8fCB0YXJnZXQuYW5pbWF0ZWQgJiYgdGFyZ2V0LmFuaW1hdGluZ1ggJiYgdGFyZ2V0LmFuaW1hdGluZ1kgfHwgX3RoaXMuX2lnbm9yZVdoaWxlQW5pbWF0aW5nID09PSB0YXJnZXQpIHtcbiAgICAgIHJldHVybiBjb21wbGV0ZWQoZmFsc2UpO1xuICAgIH1cbiAgICBpZ25vcmVOZXh0Q2xpY2sgPSBmYWxzZTtcbiAgICBpZiAoYWN0aXZlU29ydGFibGUgJiYgIW9wdGlvbnMuZGlzYWJsZWQgJiYgKGlzT3duZXIgPyBjYW5Tb3J0IHx8IChyZXZlcnQgPSBwYXJlbnRFbCAhPT0gcm9vdEVsKSAvLyBSZXZlcnRpbmcgaXRlbSBpbnRvIHRoZSBvcmlnaW5hbCBsaXN0XG4gICAgOiBwdXRTb3J0YWJsZSA9PT0gdGhpcyB8fCAodGhpcy5sYXN0UHV0TW9kZSA9IGFjdGl2ZUdyb3VwLmNoZWNrUHVsbCh0aGlzLCBhY3RpdmVTb3J0YWJsZSwgZHJhZ0VsLCBldnQpKSAmJiBncm91cC5jaGVja1B1dCh0aGlzLCBhY3RpdmVTb3J0YWJsZSwgZHJhZ0VsLCBldnQpKSkge1xuICAgICAgdmVydGljYWwgPSB0aGlzLl9nZXREaXJlY3Rpb24oZXZ0LCB0YXJnZXQpID09PSAndmVydGljYWwnO1xuICAgICAgZHJhZ1JlY3QgPSBnZXRSZWN0KGRyYWdFbCk7XG4gICAgICBkcmFnT3ZlckV2ZW50KCdkcmFnT3ZlclZhbGlkJyk7XG4gICAgICBpZiAoU29ydGFibGUuZXZlbnRDYW5jZWxlZCkgcmV0dXJuIGNvbXBsZXRlZEZpcmVkO1xuICAgICAgaWYgKHJldmVydCkge1xuICAgICAgICBwYXJlbnRFbCA9IHJvb3RFbDsgLy8gYWN0dWFsaXphdGlvblxuICAgICAgICBjYXB0dXJlKCk7XG4gICAgICAgIHRoaXMuX2hpZGVDbG9uZSgpO1xuICAgICAgICBkcmFnT3ZlckV2ZW50KCdyZXZlcnQnKTtcbiAgICAgICAgaWYgKCFTb3J0YWJsZS5ldmVudENhbmNlbGVkKSB7XG4gICAgICAgICAgaWYgKG5leHRFbCkge1xuICAgICAgICAgICAgcm9vdEVsLmluc2VydEJlZm9yZShkcmFnRWwsIG5leHRFbCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJvb3RFbC5hcHBlbmRDaGlsZChkcmFnRWwpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29tcGxldGVkKHRydWUpO1xuICAgICAgfVxuICAgICAgdmFyIGVsTGFzdENoaWxkID0gbGFzdENoaWxkKGVsLCBvcHRpb25zLmRyYWdnYWJsZSk7XG4gICAgICBpZiAoIWVsTGFzdENoaWxkIHx8IF9naG9zdElzTGFzdChldnQsIHZlcnRpY2FsLCB0aGlzKSAmJiAhZWxMYXN0Q2hpbGQuYW5pbWF0ZWQpIHtcbiAgICAgICAgLy8gSW5zZXJ0IHRvIGVuZCBvZiBsaXN0XG5cbiAgICAgICAgLy8gSWYgYWxyZWFkeSBhdCBlbmQgb2YgbGlzdDogRG8gbm90IGluc2VydFxuICAgICAgICBpZiAoZWxMYXN0Q2hpbGQgPT09IGRyYWdFbCkge1xuICAgICAgICAgIHJldHVybiBjb21wbGV0ZWQoZmFsc2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgdGhlcmUgaXMgYSBsYXN0IGVsZW1lbnQsIGl0IGlzIHRoZSB0YXJnZXRcbiAgICAgICAgaWYgKGVsTGFzdENoaWxkICYmIGVsID09PSBldnQudGFyZ2V0KSB7XG4gICAgICAgICAgdGFyZ2V0ID0gZWxMYXN0Q2hpbGQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRhcmdldCkge1xuICAgICAgICAgIHRhcmdldFJlY3QgPSBnZXRSZWN0KHRhcmdldCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKF9vbk1vdmUocm9vdEVsLCBlbCwgZHJhZ0VsLCBkcmFnUmVjdCwgdGFyZ2V0LCB0YXJnZXRSZWN0LCBldnQsICEhdGFyZ2V0KSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICBjYXB0dXJlKCk7XG4gICAgICAgICAgaWYgKGVsTGFzdENoaWxkICYmIGVsTGFzdENoaWxkLm5leHRTaWJsaW5nKSB7XG4gICAgICAgICAgICAvLyB0aGUgbGFzdCBkcmFnZ2FibGUgZWxlbWVudCBpcyBub3QgdGhlIGxhc3Qgbm9kZVxuICAgICAgICAgICAgZWwuaW5zZXJ0QmVmb3JlKGRyYWdFbCwgZWxMYXN0Q2hpbGQubmV4dFNpYmxpbmcpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbC5hcHBlbmRDaGlsZChkcmFnRWwpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBwYXJlbnRFbCA9IGVsOyAvLyBhY3R1YWxpemF0aW9uXG5cbiAgICAgICAgICBjaGFuZ2VkKCk7XG4gICAgICAgICAgcmV0dXJuIGNvbXBsZXRlZCh0cnVlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChlbExhc3RDaGlsZCAmJiBfZ2hvc3RJc0ZpcnN0KGV2dCwgdmVydGljYWwsIHRoaXMpKSB7XG4gICAgICAgIC8vIEluc2VydCB0byBzdGFydCBvZiBsaXN0XG4gICAgICAgIHZhciBmaXJzdENoaWxkID0gZ2V0Q2hpbGQoZWwsIDAsIG9wdGlvbnMsIHRydWUpO1xuICAgICAgICBpZiAoZmlyc3RDaGlsZCA9PT0gZHJhZ0VsKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbXBsZXRlZChmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGFyZ2V0ID0gZmlyc3RDaGlsZDtcbiAgICAgICAgdGFyZ2V0UmVjdCA9IGdldFJlY3QodGFyZ2V0KTtcbiAgICAgICAgaWYgKF9vbk1vdmUocm9vdEVsLCBlbCwgZHJhZ0VsLCBkcmFnUmVjdCwgdGFyZ2V0LCB0YXJnZXRSZWN0LCBldnQsIGZhbHNlKSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICBjYXB0dXJlKCk7XG4gICAgICAgICAgZWwuaW5zZXJ0QmVmb3JlKGRyYWdFbCwgZmlyc3RDaGlsZCk7XG4gICAgICAgICAgcGFyZW50RWwgPSBlbDsgLy8gYWN0dWFsaXphdGlvblxuXG4gICAgICAgICAgY2hhbmdlZCgpO1xuICAgICAgICAgIHJldHVybiBjb21wbGV0ZWQodHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodGFyZ2V0LnBhcmVudE5vZGUgPT09IGVsKSB7XG4gICAgICAgIHRhcmdldFJlY3QgPSBnZXRSZWN0KHRhcmdldCk7XG4gICAgICAgIHZhciBkaXJlY3Rpb24gPSAwLFxuICAgICAgICAgIHRhcmdldEJlZm9yZUZpcnN0U3dhcCxcbiAgICAgICAgICBkaWZmZXJlbnRMZXZlbCA9IGRyYWdFbC5wYXJlbnROb2RlICE9PSBlbCxcbiAgICAgICAgICBkaWZmZXJlbnRSb3dDb2wgPSAhX2RyYWdFbEluUm93Q29sdW1uKGRyYWdFbC5hbmltYXRlZCAmJiBkcmFnRWwudG9SZWN0IHx8IGRyYWdSZWN0LCB0YXJnZXQuYW5pbWF0ZWQgJiYgdGFyZ2V0LnRvUmVjdCB8fCB0YXJnZXRSZWN0LCB2ZXJ0aWNhbCksXG4gICAgICAgICAgc2lkZTEgPSB2ZXJ0aWNhbCA/ICd0b3AnIDogJ2xlZnQnLFxuICAgICAgICAgIHNjcm9sbGVkUGFzdFRvcCA9IGlzU2Nyb2xsZWRQYXN0KHRhcmdldCwgJ3RvcCcsICd0b3AnKSB8fCBpc1Njcm9sbGVkUGFzdChkcmFnRWwsICd0b3AnLCAndG9wJyksXG4gICAgICAgICAgc2Nyb2xsQmVmb3JlID0gc2Nyb2xsZWRQYXN0VG9wID8gc2Nyb2xsZWRQYXN0VG9wLnNjcm9sbFRvcCA6IHZvaWQgMDtcbiAgICAgICAgaWYgKGxhc3RUYXJnZXQgIT09IHRhcmdldCkge1xuICAgICAgICAgIHRhcmdldEJlZm9yZUZpcnN0U3dhcCA9IHRhcmdldFJlY3Rbc2lkZTFdO1xuICAgICAgICAgIHBhc3RGaXJzdEludmVydFRocmVzaCA9IGZhbHNlO1xuICAgICAgICAgIGlzQ2lyY3Vtc3RhbnRpYWxJbnZlcnQgPSAhZGlmZmVyZW50Um93Q29sICYmIG9wdGlvbnMuaW52ZXJ0U3dhcCB8fCBkaWZmZXJlbnRMZXZlbDtcbiAgICAgICAgfVxuICAgICAgICBkaXJlY3Rpb24gPSBfZ2V0U3dhcERpcmVjdGlvbihldnQsIHRhcmdldCwgdGFyZ2V0UmVjdCwgdmVydGljYWwsIGRpZmZlcmVudFJvd0NvbCA/IDEgOiBvcHRpb25zLnN3YXBUaHJlc2hvbGQsIG9wdGlvbnMuaW52ZXJ0ZWRTd2FwVGhyZXNob2xkID09IG51bGwgPyBvcHRpb25zLnN3YXBUaHJlc2hvbGQgOiBvcHRpb25zLmludmVydGVkU3dhcFRocmVzaG9sZCwgaXNDaXJjdW1zdGFudGlhbEludmVydCwgbGFzdFRhcmdldCA9PT0gdGFyZ2V0KTtcbiAgICAgICAgdmFyIHNpYmxpbmc7XG4gICAgICAgIGlmIChkaXJlY3Rpb24gIT09IDApIHtcbiAgICAgICAgICAvLyBDaGVjayBpZiB0YXJnZXQgaXMgYmVzaWRlIGRyYWdFbCBpbiByZXNwZWN0aXZlIGRpcmVjdGlvbiAoaWdub3JpbmcgaGlkZGVuIGVsZW1lbnRzKVxuICAgICAgICAgIHZhciBkcmFnSW5kZXggPSBpbmRleChkcmFnRWwpO1xuICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgIGRyYWdJbmRleCAtPSBkaXJlY3Rpb247XG4gICAgICAgICAgICBzaWJsaW5nID0gcGFyZW50RWwuY2hpbGRyZW5bZHJhZ0luZGV4XTtcbiAgICAgICAgICB9IHdoaWxlIChzaWJsaW5nICYmIChjc3Moc2libGluZywgJ2Rpc3BsYXknKSA9PT0gJ25vbmUnIHx8IHNpYmxpbmcgPT09IGdob3N0RWwpKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBJZiBkcmFnRWwgaXMgYWxyZWFkeSBiZXNpZGUgdGFyZ2V0OiBEbyBub3QgaW5zZXJ0XG4gICAgICAgIGlmIChkaXJlY3Rpb24gPT09IDAgfHwgc2libGluZyA9PT0gdGFyZ2V0KSB7XG4gICAgICAgICAgcmV0dXJuIGNvbXBsZXRlZChmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgbGFzdFRhcmdldCA9IHRhcmdldDtcbiAgICAgICAgbGFzdERpcmVjdGlvbiA9IGRpcmVjdGlvbjtcbiAgICAgICAgdmFyIG5leHRTaWJsaW5nID0gdGFyZ2V0Lm5leHRFbGVtZW50U2libGluZyxcbiAgICAgICAgICBhZnRlciA9IGZhbHNlO1xuICAgICAgICBhZnRlciA9IGRpcmVjdGlvbiA9PT0gMTtcbiAgICAgICAgdmFyIG1vdmVWZWN0b3IgPSBfb25Nb3ZlKHJvb3RFbCwgZWwsIGRyYWdFbCwgZHJhZ1JlY3QsIHRhcmdldCwgdGFyZ2V0UmVjdCwgZXZ0LCBhZnRlcik7XG4gICAgICAgIGlmIChtb3ZlVmVjdG9yICE9PSBmYWxzZSkge1xuICAgICAgICAgIGlmIChtb3ZlVmVjdG9yID09PSAxIHx8IG1vdmVWZWN0b3IgPT09IC0xKSB7XG4gICAgICAgICAgICBhZnRlciA9IG1vdmVWZWN0b3IgPT09IDE7XG4gICAgICAgICAgfVxuICAgICAgICAgIF9zaWxlbnQgPSB0cnVlO1xuICAgICAgICAgIHNldFRpbWVvdXQoX3Vuc2lsZW50LCAzMCk7XG4gICAgICAgICAgY2FwdHVyZSgpO1xuICAgICAgICAgIGlmIChhZnRlciAmJiAhbmV4dFNpYmxpbmcpIHtcbiAgICAgICAgICAgIGVsLmFwcGVuZENoaWxkKGRyYWdFbCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRhcmdldC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShkcmFnRWwsIGFmdGVyID8gbmV4dFNpYmxpbmcgOiB0YXJnZXQpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFVuZG8gY2hyb21lJ3Mgc2Nyb2xsIGFkanVzdG1lbnQgKGhhcyBubyBlZmZlY3Qgb24gb3RoZXIgYnJvd3NlcnMpXG4gICAgICAgICAgaWYgKHNjcm9sbGVkUGFzdFRvcCkge1xuICAgICAgICAgICAgc2Nyb2xsQnkoc2Nyb2xsZWRQYXN0VG9wLCAwLCBzY3JvbGxCZWZvcmUgLSBzY3JvbGxlZFBhc3RUb3Auc2Nyb2xsVG9wKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcGFyZW50RWwgPSBkcmFnRWwucGFyZW50Tm9kZTsgLy8gYWN0dWFsaXphdGlvblxuXG4gICAgICAgICAgLy8gbXVzdCBiZSBkb25lIGJlZm9yZSBhbmltYXRpb25cbiAgICAgICAgICBpZiAodGFyZ2V0QmVmb3JlRmlyc3RTd2FwICE9PSB1bmRlZmluZWQgJiYgIWlzQ2lyY3Vtc3RhbnRpYWxJbnZlcnQpIHtcbiAgICAgICAgICAgIHRhcmdldE1vdmVEaXN0YW5jZSA9IE1hdGguYWJzKHRhcmdldEJlZm9yZUZpcnN0U3dhcCAtIGdldFJlY3QodGFyZ2V0KVtzaWRlMV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjaGFuZ2VkKCk7XG4gICAgICAgICAgcmV0dXJuIGNvbXBsZXRlZCh0cnVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGVsLmNvbnRhaW5zKGRyYWdFbCkpIHtcbiAgICAgICAgcmV0dXJuIGNvbXBsZXRlZChmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfSxcbiAgX2lnbm9yZVdoaWxlQW5pbWF0aW5nOiBudWxsLFxuICBfb2ZmTW92ZUV2ZW50czogZnVuY3Rpb24gX29mZk1vdmVFdmVudHMoKSB7XG4gICAgb2ZmKGRvY3VtZW50LCAnbW91c2Vtb3ZlJywgdGhpcy5fb25Ub3VjaE1vdmUpO1xuICAgIG9mZihkb2N1bWVudCwgJ3RvdWNobW92ZScsIHRoaXMuX29uVG91Y2hNb3ZlKTtcbiAgICBvZmYoZG9jdW1lbnQsICdwb2ludGVybW92ZScsIHRoaXMuX29uVG91Y2hNb3ZlKTtcbiAgICBvZmYoZG9jdW1lbnQsICdkcmFnb3ZlcicsIG5lYXJlc3RFbXB0eUluc2VydERldGVjdEV2ZW50KTtcbiAgICBvZmYoZG9jdW1lbnQsICdtb3VzZW1vdmUnLCBuZWFyZXN0RW1wdHlJbnNlcnREZXRlY3RFdmVudCk7XG4gICAgb2ZmKGRvY3VtZW50LCAndG91Y2htb3ZlJywgbmVhcmVzdEVtcHR5SW5zZXJ0RGV0ZWN0RXZlbnQpO1xuICB9LFxuICBfb2ZmVXBFdmVudHM6IGZ1bmN0aW9uIF9vZmZVcEV2ZW50cygpIHtcbiAgICB2YXIgb3duZXJEb2N1bWVudCA9IHRoaXMuZWwub3duZXJEb2N1bWVudDtcbiAgICBvZmYob3duZXJEb2N1bWVudCwgJ21vdXNldXAnLCB0aGlzLl9vbkRyb3ApO1xuICAgIG9mZihvd25lckRvY3VtZW50LCAndG91Y2hlbmQnLCB0aGlzLl9vbkRyb3ApO1xuICAgIG9mZihvd25lckRvY3VtZW50LCAncG9pbnRlcnVwJywgdGhpcy5fb25Ecm9wKTtcbiAgICBvZmYob3duZXJEb2N1bWVudCwgJ3BvaW50ZXJjYW5jZWwnLCB0aGlzLl9vbkRyb3ApO1xuICAgIG9mZihvd25lckRvY3VtZW50LCAndG91Y2hjYW5jZWwnLCB0aGlzLl9vbkRyb3ApO1xuICAgIG9mZihkb2N1bWVudCwgJ3NlbGVjdHN0YXJ0JywgdGhpcyk7XG4gIH0sXG4gIF9vbkRyb3A6IGZ1bmN0aW9uIF9vbkRyb3AoIC8qKkV2ZW50Ki9ldnQpIHtcbiAgICB2YXIgZWwgPSB0aGlzLmVsLFxuICAgICAgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcblxuICAgIC8vIEdldCB0aGUgaW5kZXggb2YgdGhlIGRyYWdnZWQgZWxlbWVudCB3aXRoaW4gaXRzIHBhcmVudFxuICAgIG5ld0luZGV4ID0gaW5kZXgoZHJhZ0VsKTtcbiAgICBuZXdEcmFnZ2FibGVJbmRleCA9IGluZGV4KGRyYWdFbCwgb3B0aW9ucy5kcmFnZ2FibGUpO1xuICAgIHBsdWdpbkV2ZW50KCdkcm9wJywgdGhpcywge1xuICAgICAgZXZ0OiBldnRcbiAgICB9KTtcbiAgICBwYXJlbnRFbCA9IGRyYWdFbCAmJiBkcmFnRWwucGFyZW50Tm9kZTtcblxuICAgIC8vIEdldCBhZ2FpbiBhZnRlciBwbHVnaW4gZXZlbnRcbiAgICBuZXdJbmRleCA9IGluZGV4KGRyYWdFbCk7XG4gICAgbmV3RHJhZ2dhYmxlSW5kZXggPSBpbmRleChkcmFnRWwsIG9wdGlvbnMuZHJhZ2dhYmxlKTtcbiAgICBpZiAoU29ydGFibGUuZXZlbnRDYW5jZWxlZCkge1xuICAgICAgdGhpcy5fbnVsbGluZygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBhd2FpdGluZ0RyYWdTdGFydGVkID0gZmFsc2U7XG4gICAgaXNDaXJjdW1zdGFudGlhbEludmVydCA9IGZhbHNlO1xuICAgIHBhc3RGaXJzdEludmVydFRocmVzaCA9IGZhbHNlO1xuICAgIGNsZWFySW50ZXJ2YWwodGhpcy5fbG9vcElkKTtcbiAgICBjbGVhclRpbWVvdXQodGhpcy5fZHJhZ1N0YXJ0VGltZXIpO1xuICAgIF9jYW5jZWxOZXh0VGljayh0aGlzLmNsb25lSWQpO1xuICAgIF9jYW5jZWxOZXh0VGljayh0aGlzLl9kcmFnU3RhcnRJZCk7XG5cbiAgICAvLyBVbmJpbmQgZXZlbnRzXG4gICAgaWYgKHRoaXMubmF0aXZlRHJhZ2dhYmxlKSB7XG4gICAgICBvZmYoZG9jdW1lbnQsICdkcm9wJywgdGhpcyk7XG4gICAgICBvZmYoZWwsICdkcmFnc3RhcnQnLCB0aGlzLl9vbkRyYWdTdGFydCk7XG4gICAgfVxuICAgIHRoaXMuX29mZk1vdmVFdmVudHMoKTtcbiAgICB0aGlzLl9vZmZVcEV2ZW50cygpO1xuICAgIGlmIChTYWZhcmkpIHtcbiAgICAgIGNzcyhkb2N1bWVudC5ib2R5LCAndXNlci1zZWxlY3QnLCAnJyk7XG4gICAgfVxuICAgIGNzcyhkcmFnRWwsICd0cmFuc2Zvcm0nLCAnJyk7XG4gICAgaWYgKGV2dCkge1xuICAgICAgaWYgKG1vdmVkKSB7XG4gICAgICAgIGV2dC5jYW5jZWxhYmxlICYmIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAhb3B0aW9ucy5kcm9wQnViYmxlICYmIGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIH1cbiAgICAgIGdob3N0RWwgJiYgZ2hvc3RFbC5wYXJlbnROb2RlICYmIGdob3N0RWwucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChnaG9zdEVsKTtcbiAgICAgIGlmIChyb290RWwgPT09IHBhcmVudEVsIHx8IHB1dFNvcnRhYmxlICYmIHB1dFNvcnRhYmxlLmxhc3RQdXRNb2RlICE9PSAnY2xvbmUnKSB7XG4gICAgICAgIC8vIFJlbW92ZSBjbG9uZShzKVxuICAgICAgICBjbG9uZUVsICYmIGNsb25lRWwucGFyZW50Tm9kZSAmJiBjbG9uZUVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoY2xvbmVFbCk7XG4gICAgICB9XG4gICAgICBpZiAoZHJhZ0VsKSB7XG4gICAgICAgIGlmICh0aGlzLm5hdGl2ZURyYWdnYWJsZSkge1xuICAgICAgICAgIG9mZihkcmFnRWwsICdkcmFnZW5kJywgdGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgX2Rpc2FibGVEcmFnZ2FibGUoZHJhZ0VsKTtcbiAgICAgICAgZHJhZ0VsLnN0eWxlWyd3aWxsLWNoYW5nZSddID0gJyc7XG5cbiAgICAgICAgLy8gUmVtb3ZlIGNsYXNzZXNcbiAgICAgICAgLy8gZ2hvc3RDbGFzcyBpcyBhZGRlZCBpbiBkcmFnU3RhcnRlZFxuICAgICAgICBpZiAobW92ZWQgJiYgIWF3YWl0aW5nRHJhZ1N0YXJ0ZWQpIHtcbiAgICAgICAgICB0b2dnbGVDbGFzcyhkcmFnRWwsIHB1dFNvcnRhYmxlID8gcHV0U29ydGFibGUub3B0aW9ucy5naG9zdENsYXNzIDogdGhpcy5vcHRpb25zLmdob3N0Q2xhc3MsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICB0b2dnbGVDbGFzcyhkcmFnRWwsIHRoaXMub3B0aW9ucy5jaG9zZW5DbGFzcywgZmFsc2UpO1xuXG4gICAgICAgIC8vIERyYWcgc3RvcCBldmVudFxuICAgICAgICBfZGlzcGF0Y2hFdmVudCh7XG4gICAgICAgICAgc29ydGFibGU6IHRoaXMsXG4gICAgICAgICAgbmFtZTogJ3VuY2hvb3NlJyxcbiAgICAgICAgICB0b0VsOiBwYXJlbnRFbCxcbiAgICAgICAgICBuZXdJbmRleDogbnVsbCxcbiAgICAgICAgICBuZXdEcmFnZ2FibGVJbmRleDogbnVsbCxcbiAgICAgICAgICBvcmlnaW5hbEV2ZW50OiBldnRcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChyb290RWwgIT09IHBhcmVudEVsKSB7XG4gICAgICAgICAgaWYgKG5ld0luZGV4ID49IDApIHtcbiAgICAgICAgICAgIC8vIEFkZCBldmVudFxuICAgICAgICAgICAgX2Rpc3BhdGNoRXZlbnQoe1xuICAgICAgICAgICAgICByb290RWw6IHBhcmVudEVsLFxuICAgICAgICAgICAgICBuYW1lOiAnYWRkJyxcbiAgICAgICAgICAgICAgdG9FbDogcGFyZW50RWwsXG4gICAgICAgICAgICAgIGZyb21FbDogcm9vdEVsLFxuICAgICAgICAgICAgICBvcmlnaW5hbEV2ZW50OiBldnRcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBSZW1vdmUgZXZlbnRcbiAgICAgICAgICAgIF9kaXNwYXRjaEV2ZW50KHtcbiAgICAgICAgICAgICAgc29ydGFibGU6IHRoaXMsXG4gICAgICAgICAgICAgIG5hbWU6ICdyZW1vdmUnLFxuICAgICAgICAgICAgICB0b0VsOiBwYXJlbnRFbCxcbiAgICAgICAgICAgICAgb3JpZ2luYWxFdmVudDogZXZ0XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gZHJhZyBmcm9tIG9uZSBsaXN0IGFuZCBkcm9wIGludG8gYW5vdGhlclxuICAgICAgICAgICAgX2Rpc3BhdGNoRXZlbnQoe1xuICAgICAgICAgICAgICByb290RWw6IHBhcmVudEVsLFxuICAgICAgICAgICAgICBuYW1lOiAnc29ydCcsXG4gICAgICAgICAgICAgIHRvRWw6IHBhcmVudEVsLFxuICAgICAgICAgICAgICBmcm9tRWw6IHJvb3RFbCxcbiAgICAgICAgICAgICAgb3JpZ2luYWxFdmVudDogZXZ0XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIF9kaXNwYXRjaEV2ZW50KHtcbiAgICAgICAgICAgICAgc29ydGFibGU6IHRoaXMsXG4gICAgICAgICAgICAgIG5hbWU6ICdzb3J0JyxcbiAgICAgICAgICAgICAgdG9FbDogcGFyZW50RWwsXG4gICAgICAgICAgICAgIG9yaWdpbmFsRXZlbnQ6IGV2dFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHB1dFNvcnRhYmxlICYmIHB1dFNvcnRhYmxlLnNhdmUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAobmV3SW5kZXggIT09IG9sZEluZGV4KSB7XG4gICAgICAgICAgICBpZiAobmV3SW5kZXggPj0gMCkge1xuICAgICAgICAgICAgICAvLyBkcmFnICYgZHJvcCB3aXRoaW4gdGhlIHNhbWUgbGlzdFxuICAgICAgICAgICAgICBfZGlzcGF0Y2hFdmVudCh7XG4gICAgICAgICAgICAgICAgc29ydGFibGU6IHRoaXMsXG4gICAgICAgICAgICAgICAgbmFtZTogJ3VwZGF0ZScsXG4gICAgICAgICAgICAgICAgdG9FbDogcGFyZW50RWwsXG4gICAgICAgICAgICAgICAgb3JpZ2luYWxFdmVudDogZXZ0XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICBfZGlzcGF0Y2hFdmVudCh7XG4gICAgICAgICAgICAgICAgc29ydGFibGU6IHRoaXMsXG4gICAgICAgICAgICAgICAgbmFtZTogJ3NvcnQnLFxuICAgICAgICAgICAgICAgIHRvRWw6IHBhcmVudEVsLFxuICAgICAgICAgICAgICAgIG9yaWdpbmFsRXZlbnQ6IGV2dFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKFNvcnRhYmxlLmFjdGl2ZSkge1xuICAgICAgICAgIC8qIGpzaGludCBlcW51bGw6dHJ1ZSAqL1xuICAgICAgICAgIGlmIChuZXdJbmRleCA9PSBudWxsIHx8IG5ld0luZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgbmV3SW5kZXggPSBvbGRJbmRleDtcbiAgICAgICAgICAgIG5ld0RyYWdnYWJsZUluZGV4ID0gb2xkRHJhZ2dhYmxlSW5kZXg7XG4gICAgICAgICAgfVxuICAgICAgICAgIF9kaXNwYXRjaEV2ZW50KHtcbiAgICAgICAgICAgIHNvcnRhYmxlOiB0aGlzLFxuICAgICAgICAgICAgbmFtZTogJ2VuZCcsXG4gICAgICAgICAgICB0b0VsOiBwYXJlbnRFbCxcbiAgICAgICAgICAgIG9yaWdpbmFsRXZlbnQ6IGV2dFxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgLy8gU2F2ZSBzb3J0aW5nXG4gICAgICAgICAgdGhpcy5zYXZlKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5fbnVsbGluZygpO1xuICB9LFxuICBfbnVsbGluZzogZnVuY3Rpb24gX251bGxpbmcoKSB7XG4gICAgcGx1Z2luRXZlbnQoJ251bGxpbmcnLCB0aGlzKTtcbiAgICByb290RWwgPSBkcmFnRWwgPSBwYXJlbnRFbCA9IGdob3N0RWwgPSBuZXh0RWwgPSBjbG9uZUVsID0gbGFzdERvd25FbCA9IGNsb25lSGlkZGVuID0gdGFwRXZ0ID0gdG91Y2hFdnQgPSBtb3ZlZCA9IG5ld0luZGV4ID0gbmV3RHJhZ2dhYmxlSW5kZXggPSBvbGRJbmRleCA9IG9sZERyYWdnYWJsZUluZGV4ID0gbGFzdFRhcmdldCA9IGxhc3REaXJlY3Rpb24gPSBwdXRTb3J0YWJsZSA9IGFjdGl2ZUdyb3VwID0gU29ydGFibGUuZHJhZ2dlZCA9IFNvcnRhYmxlLmdob3N0ID0gU29ydGFibGUuY2xvbmUgPSBTb3J0YWJsZS5hY3RpdmUgPSBudWxsO1xuICAgIHNhdmVkSW5wdXRDaGVja2VkLmZvckVhY2goZnVuY3Rpb24gKGVsKSB7XG4gICAgICBlbC5jaGVja2VkID0gdHJ1ZTtcbiAgICB9KTtcbiAgICBzYXZlZElucHV0Q2hlY2tlZC5sZW5ndGggPSBsYXN0RHggPSBsYXN0RHkgPSAwO1xuICB9LFxuICBoYW5kbGVFdmVudDogZnVuY3Rpb24gaGFuZGxlRXZlbnQoIC8qKkV2ZW50Ki9ldnQpIHtcbiAgICBzd2l0Y2ggKGV2dC50eXBlKSB7XG4gICAgICBjYXNlICdkcm9wJzpcbiAgICAgIGNhc2UgJ2RyYWdlbmQnOlxuICAgICAgICB0aGlzLl9vbkRyb3AoZXZ0KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdkcmFnZW50ZXInOlxuICAgICAgY2FzZSAnZHJhZ292ZXInOlxuICAgICAgICBpZiAoZHJhZ0VsKSB7XG4gICAgICAgICAgdGhpcy5fb25EcmFnT3ZlcihldnQpO1xuICAgICAgICAgIF9nbG9iYWxEcmFnT3ZlcihldnQpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnc2VsZWN0c3RhcnQnOlxuICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9LFxuICAvKipcclxuICAgKiBTZXJpYWxpemVzIHRoZSBpdGVtIGludG8gYW4gYXJyYXkgb2Ygc3RyaW5nLlxyXG4gICAqIEByZXR1cm5zIHtTdHJpbmdbXX1cclxuICAgKi9cbiAgdG9BcnJheTogZnVuY3Rpb24gdG9BcnJheSgpIHtcbiAgICB2YXIgb3JkZXIgPSBbXSxcbiAgICAgIGVsLFxuICAgICAgY2hpbGRyZW4gPSB0aGlzLmVsLmNoaWxkcmVuLFxuICAgICAgaSA9IDAsXG4gICAgICBuID0gY2hpbGRyZW4ubGVuZ3RoLFxuICAgICAgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcbiAgICBmb3IgKDsgaSA8IG47IGkrKykge1xuICAgICAgZWwgPSBjaGlsZHJlbltpXTtcbiAgICAgIGlmIChjbG9zZXN0KGVsLCBvcHRpb25zLmRyYWdnYWJsZSwgdGhpcy5lbCwgZmFsc2UpKSB7XG4gICAgICAgIG9yZGVyLnB1c2goZWwuZ2V0QXR0cmlidXRlKG9wdGlvbnMuZGF0YUlkQXR0cikgfHwgX2dlbmVyYXRlSWQoZWwpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG9yZGVyO1xuICB9LFxuICAvKipcclxuICAgKiBTb3J0cyB0aGUgZWxlbWVudHMgYWNjb3JkaW5nIHRvIHRoZSBhcnJheS5cclxuICAgKiBAcGFyYW0gIHtTdHJpbmdbXX0gIG9yZGVyICBvcmRlciBvZiB0aGUgaXRlbXNcclxuICAgKi9cbiAgc29ydDogZnVuY3Rpb24gc29ydChvcmRlciwgdXNlQW5pbWF0aW9uKSB7XG4gICAgdmFyIGl0ZW1zID0ge30sXG4gICAgICByb290RWwgPSB0aGlzLmVsO1xuICAgIHRoaXMudG9BcnJheSgpLmZvckVhY2goZnVuY3Rpb24gKGlkLCBpKSB7XG4gICAgICB2YXIgZWwgPSByb290RWwuY2hpbGRyZW5baV07XG4gICAgICBpZiAoY2xvc2VzdChlbCwgdGhpcy5vcHRpb25zLmRyYWdnYWJsZSwgcm9vdEVsLCBmYWxzZSkpIHtcbiAgICAgICAgaXRlbXNbaWRdID0gZWw7XG4gICAgICB9XG4gICAgfSwgdGhpcyk7XG4gICAgdXNlQW5pbWF0aW9uICYmIHRoaXMuY2FwdHVyZUFuaW1hdGlvblN0YXRlKCk7XG4gICAgb3JkZXIuZm9yRWFjaChmdW5jdGlvbiAoaWQpIHtcbiAgICAgIGlmIChpdGVtc1tpZF0pIHtcbiAgICAgICAgcm9vdEVsLnJlbW92ZUNoaWxkKGl0ZW1zW2lkXSk7XG4gICAgICAgIHJvb3RFbC5hcHBlbmRDaGlsZChpdGVtc1tpZF0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHVzZUFuaW1hdGlvbiAmJiB0aGlzLmFuaW1hdGVBbGwoKTtcbiAgfSxcbiAgLyoqXHJcbiAgICogU2F2ZSB0aGUgY3VycmVudCBzb3J0aW5nXHJcbiAgICovXG4gIHNhdmU6IGZ1bmN0aW9uIHNhdmUoKSB7XG4gICAgdmFyIHN0b3JlID0gdGhpcy5vcHRpb25zLnN0b3JlO1xuICAgIHN0b3JlICYmIHN0b3JlLnNldCAmJiBzdG9yZS5zZXQodGhpcyk7XG4gIH0sXG4gIC8qKlxyXG4gICAqIEZvciBlYWNoIGVsZW1lbnQgaW4gdGhlIHNldCwgZ2V0IHRoZSBmaXJzdCBlbGVtZW50IHRoYXQgbWF0Y2hlcyB0aGUgc2VsZWN0b3IgYnkgdGVzdGluZyB0aGUgZWxlbWVudCBpdHNlbGYgYW5kIHRyYXZlcnNpbmcgdXAgdGhyb3VnaCBpdHMgYW5jZXN0b3JzIGluIHRoZSBET00gdHJlZS5cclxuICAgKiBAcGFyYW0gICB7SFRNTEVsZW1lbnR9ICBlbFxyXG4gICAqIEBwYXJhbSAgIHtTdHJpbmd9ICAgICAgIFtzZWxlY3Rvcl0gIGRlZmF1bHQ6IGBvcHRpb25zLmRyYWdnYWJsZWBcclxuICAgKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR8bnVsbH1cclxuICAgKi9cbiAgY2xvc2VzdDogZnVuY3Rpb24gY2xvc2VzdCQxKGVsLCBzZWxlY3Rvcikge1xuICAgIHJldHVybiBjbG9zZXN0KGVsLCBzZWxlY3RvciB8fCB0aGlzLm9wdGlvbnMuZHJhZ2dhYmxlLCB0aGlzLmVsLCBmYWxzZSk7XG4gIH0sXG4gIC8qKlxyXG4gICAqIFNldC9nZXQgb3B0aW9uXHJcbiAgICogQHBhcmFtICAge3N0cmluZ30gbmFtZVxyXG4gICAqIEBwYXJhbSAgIHsqfSAgICAgIFt2YWx1ZV1cclxuICAgKiBAcmV0dXJucyB7Kn1cclxuICAgKi9cbiAgb3B0aW9uOiBmdW5jdGlvbiBvcHRpb24obmFtZSwgdmFsdWUpIHtcbiAgICB2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcbiAgICBpZiAodmFsdWUgPT09IHZvaWQgMCkge1xuICAgICAgcmV0dXJuIG9wdGlvbnNbbmFtZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBtb2RpZmllZFZhbHVlID0gUGx1Z2luTWFuYWdlci5tb2RpZnlPcHRpb24odGhpcywgbmFtZSwgdmFsdWUpO1xuICAgICAgaWYgKHR5cGVvZiBtb2RpZmllZFZhbHVlICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBvcHRpb25zW25hbWVdID0gbW9kaWZpZWRWYWx1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG9wdGlvbnNbbmFtZV0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICAgIGlmIChuYW1lID09PSAnZ3JvdXAnKSB7XG4gICAgICAgIF9wcmVwYXJlR3JvdXAob3B0aW9ucyk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuICAvKipcclxuICAgKiBEZXN0cm95XHJcbiAgICovXG4gIGRlc3Ryb3k6IGZ1bmN0aW9uIGRlc3Ryb3koKSB7XG4gICAgcGx1Z2luRXZlbnQoJ2Rlc3Ryb3knLCB0aGlzKTtcbiAgICB2YXIgZWwgPSB0aGlzLmVsO1xuICAgIGVsW2V4cGFuZG9dID0gbnVsbDtcbiAgICBvZmYoZWwsICdtb3VzZWRvd24nLCB0aGlzLl9vblRhcFN0YXJ0KTtcbiAgICBvZmYoZWwsICd0b3VjaHN0YXJ0JywgdGhpcy5fb25UYXBTdGFydCk7XG4gICAgb2ZmKGVsLCAncG9pbnRlcmRvd24nLCB0aGlzLl9vblRhcFN0YXJ0KTtcbiAgICBpZiAodGhpcy5uYXRpdmVEcmFnZ2FibGUpIHtcbiAgICAgIG9mZihlbCwgJ2RyYWdvdmVyJywgdGhpcyk7XG4gICAgICBvZmYoZWwsICdkcmFnZW50ZXInLCB0aGlzKTtcbiAgICB9XG4gICAgLy8gUmVtb3ZlIGRyYWdnYWJsZSBhdHRyaWJ1dGVzXG4gICAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbChlbC5xdWVyeVNlbGVjdG9yQWxsKCdbZHJhZ2dhYmxlXScpLCBmdW5jdGlvbiAoZWwpIHtcbiAgICAgIGVsLnJlbW92ZUF0dHJpYnV0ZSgnZHJhZ2dhYmxlJyk7XG4gICAgfSk7XG4gICAgdGhpcy5fb25Ecm9wKCk7XG4gICAgdGhpcy5fZGlzYWJsZURlbGF5ZWREcmFnRXZlbnRzKCk7XG4gICAgc29ydGFibGVzLnNwbGljZShzb3J0YWJsZXMuaW5kZXhPZih0aGlzLmVsKSwgMSk7XG4gICAgdGhpcy5lbCA9IGVsID0gbnVsbDtcbiAgfSxcbiAgX2hpZGVDbG9uZTogZnVuY3Rpb24gX2hpZGVDbG9uZSgpIHtcbiAgICBpZiAoIWNsb25lSGlkZGVuKSB7XG4gICAgICBwbHVnaW5FdmVudCgnaGlkZUNsb25lJywgdGhpcyk7XG4gICAgICBpZiAoU29ydGFibGUuZXZlbnRDYW5jZWxlZCkgcmV0dXJuO1xuICAgICAgY3NzKGNsb25lRWwsICdkaXNwbGF5JywgJ25vbmUnKTtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMucmVtb3ZlQ2xvbmVPbkhpZGUgJiYgY2xvbmVFbC5wYXJlbnROb2RlKSB7XG4gICAgICAgIGNsb25lRWwucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChjbG9uZUVsKTtcbiAgICAgIH1cbiAgICAgIGNsb25lSGlkZGVuID0gdHJ1ZTtcbiAgICB9XG4gIH0sXG4gIF9zaG93Q2xvbmU6IGZ1bmN0aW9uIF9zaG93Q2xvbmUocHV0U29ydGFibGUpIHtcbiAgICBpZiAocHV0U29ydGFibGUubGFzdFB1dE1vZGUgIT09ICdjbG9uZScpIHtcbiAgICAgIHRoaXMuX2hpZGVDbG9uZSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoY2xvbmVIaWRkZW4pIHtcbiAgICAgIHBsdWdpbkV2ZW50KCdzaG93Q2xvbmUnLCB0aGlzKTtcbiAgICAgIGlmIChTb3J0YWJsZS5ldmVudENhbmNlbGVkKSByZXR1cm47XG5cbiAgICAgIC8vIHNob3cgY2xvbmUgYXQgZHJhZ0VsIG9yIG9yaWdpbmFsIHBvc2l0aW9uXG4gICAgICBpZiAoZHJhZ0VsLnBhcmVudE5vZGUgPT0gcm9vdEVsICYmICF0aGlzLm9wdGlvbnMuZ3JvdXAucmV2ZXJ0Q2xvbmUpIHtcbiAgICAgICAgcm9vdEVsLmluc2VydEJlZm9yZShjbG9uZUVsLCBkcmFnRWwpO1xuICAgICAgfSBlbHNlIGlmIChuZXh0RWwpIHtcbiAgICAgICAgcm9vdEVsLmluc2VydEJlZm9yZShjbG9uZUVsLCBuZXh0RWwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcm9vdEVsLmFwcGVuZENoaWxkKGNsb25lRWwpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5ncm91cC5yZXZlcnRDbG9uZSkge1xuICAgICAgICB0aGlzLmFuaW1hdGUoZHJhZ0VsLCBjbG9uZUVsKTtcbiAgICAgIH1cbiAgICAgIGNzcyhjbG9uZUVsLCAnZGlzcGxheScsICcnKTtcbiAgICAgIGNsb25lSGlkZGVuID0gZmFsc2U7XG4gICAgfVxuICB9XG59O1xuZnVuY3Rpb24gX2dsb2JhbERyYWdPdmVyKCAvKipFdmVudCovZXZ0KSB7XG4gIGlmIChldnQuZGF0YVRyYW5zZmVyKSB7XG4gICAgZXZ0LmRhdGFUcmFuc2Zlci5kcm9wRWZmZWN0ID0gJ21vdmUnO1xuICB9XG4gIGV2dC5jYW5jZWxhYmxlICYmIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xufVxuZnVuY3Rpb24gX29uTW92ZShmcm9tRWwsIHRvRWwsIGRyYWdFbCwgZHJhZ1JlY3QsIHRhcmdldEVsLCB0YXJnZXRSZWN0LCBvcmlnaW5hbEV2ZW50LCB3aWxsSW5zZXJ0QWZ0ZXIpIHtcbiAgdmFyIGV2dCxcbiAgICBzb3J0YWJsZSA9IGZyb21FbFtleHBhbmRvXSxcbiAgICBvbk1vdmVGbiA9IHNvcnRhYmxlLm9wdGlvbnMub25Nb3ZlLFxuICAgIHJldFZhbDtcbiAgLy8gU3VwcG9ydCBmb3IgbmV3IEN1c3RvbUV2ZW50IGZlYXR1cmVcbiAgaWYgKHdpbmRvdy5DdXN0b21FdmVudCAmJiAhSUUxMU9yTGVzcyAmJiAhRWRnZSkge1xuICAgIGV2dCA9IG5ldyBDdXN0b21FdmVudCgnbW92ZScsIHtcbiAgICAgIGJ1YmJsZXM6IHRydWUsXG4gICAgICBjYW5jZWxhYmxlOiB0cnVlXG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgZXZ0ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0V2ZW50Jyk7XG4gICAgZXZ0LmluaXRFdmVudCgnbW92ZScsIHRydWUsIHRydWUpO1xuICB9XG4gIGV2dC50byA9IHRvRWw7XG4gIGV2dC5mcm9tID0gZnJvbUVsO1xuICBldnQuZHJhZ2dlZCA9IGRyYWdFbDtcbiAgZXZ0LmRyYWdnZWRSZWN0ID0gZHJhZ1JlY3Q7XG4gIGV2dC5yZWxhdGVkID0gdGFyZ2V0RWwgfHwgdG9FbDtcbiAgZXZ0LnJlbGF0ZWRSZWN0ID0gdGFyZ2V0UmVjdCB8fCBnZXRSZWN0KHRvRWwpO1xuICBldnQud2lsbEluc2VydEFmdGVyID0gd2lsbEluc2VydEFmdGVyO1xuICBldnQub3JpZ2luYWxFdmVudCA9IG9yaWdpbmFsRXZlbnQ7XG4gIGZyb21FbC5kaXNwYXRjaEV2ZW50KGV2dCk7XG4gIGlmIChvbk1vdmVGbikge1xuICAgIHJldFZhbCA9IG9uTW92ZUZuLmNhbGwoc29ydGFibGUsIGV2dCwgb3JpZ2luYWxFdmVudCk7XG4gIH1cbiAgcmV0dXJuIHJldFZhbDtcbn1cbmZ1bmN0aW9uIF9kaXNhYmxlRHJhZ2dhYmxlKGVsKSB7XG4gIGVsLmRyYWdnYWJsZSA9IGZhbHNlO1xufVxuZnVuY3Rpb24gX3Vuc2lsZW50KCkge1xuICBfc2lsZW50ID0gZmFsc2U7XG59XG5mdW5jdGlvbiBfZ2hvc3RJc0ZpcnN0KGV2dCwgdmVydGljYWwsIHNvcnRhYmxlKSB7XG4gIHZhciBmaXJzdEVsUmVjdCA9IGdldFJlY3QoZ2V0Q2hpbGQoc29ydGFibGUuZWwsIDAsIHNvcnRhYmxlLm9wdGlvbnMsIHRydWUpKTtcbiAgdmFyIGNoaWxkQ29udGFpbmluZ1JlY3QgPSBnZXRDaGlsZENvbnRhaW5pbmdSZWN0RnJvbUVsZW1lbnQoc29ydGFibGUuZWwsIHNvcnRhYmxlLm9wdGlvbnMsIGdob3N0RWwpO1xuICB2YXIgc3BhY2VyID0gMTA7XG4gIHJldHVybiB2ZXJ0aWNhbCA/IGV2dC5jbGllbnRYIDwgY2hpbGRDb250YWluaW5nUmVjdC5sZWZ0IC0gc3BhY2VyIHx8IGV2dC5jbGllbnRZIDwgZmlyc3RFbFJlY3QudG9wICYmIGV2dC5jbGllbnRYIDwgZmlyc3RFbFJlY3QucmlnaHQgOiBldnQuY2xpZW50WSA8IGNoaWxkQ29udGFpbmluZ1JlY3QudG9wIC0gc3BhY2VyIHx8IGV2dC5jbGllbnRZIDwgZmlyc3RFbFJlY3QuYm90dG9tICYmIGV2dC5jbGllbnRYIDwgZmlyc3RFbFJlY3QubGVmdDtcbn1cbmZ1bmN0aW9uIF9naG9zdElzTGFzdChldnQsIHZlcnRpY2FsLCBzb3J0YWJsZSkge1xuICB2YXIgbGFzdEVsUmVjdCA9IGdldFJlY3QobGFzdENoaWxkKHNvcnRhYmxlLmVsLCBzb3J0YWJsZS5vcHRpb25zLmRyYWdnYWJsZSkpO1xuICB2YXIgY2hpbGRDb250YWluaW5nUmVjdCA9IGdldENoaWxkQ29udGFpbmluZ1JlY3RGcm9tRWxlbWVudChzb3J0YWJsZS5lbCwgc29ydGFibGUub3B0aW9ucywgZ2hvc3RFbCk7XG4gIHZhciBzcGFjZXIgPSAxMDtcbiAgcmV0dXJuIHZlcnRpY2FsID8gZXZ0LmNsaWVudFggPiBjaGlsZENvbnRhaW5pbmdSZWN0LnJpZ2h0ICsgc3BhY2VyIHx8IGV2dC5jbGllbnRZID4gbGFzdEVsUmVjdC5ib3R0b20gJiYgZXZ0LmNsaWVudFggPiBsYXN0RWxSZWN0LmxlZnQgOiBldnQuY2xpZW50WSA+IGNoaWxkQ29udGFpbmluZ1JlY3QuYm90dG9tICsgc3BhY2VyIHx8IGV2dC5jbGllbnRYID4gbGFzdEVsUmVjdC5yaWdodCAmJiBldnQuY2xpZW50WSA+IGxhc3RFbFJlY3QudG9wO1xufVxuZnVuY3Rpb24gX2dldFN3YXBEaXJlY3Rpb24oZXZ0LCB0YXJnZXQsIHRhcmdldFJlY3QsIHZlcnRpY2FsLCBzd2FwVGhyZXNob2xkLCBpbnZlcnRlZFN3YXBUaHJlc2hvbGQsIGludmVydFN3YXAsIGlzTGFzdFRhcmdldCkge1xuICB2YXIgbW91c2VPbkF4aXMgPSB2ZXJ0aWNhbCA/IGV2dC5jbGllbnRZIDogZXZ0LmNsaWVudFgsXG4gICAgdGFyZ2V0TGVuZ3RoID0gdmVydGljYWwgPyB0YXJnZXRSZWN0LmhlaWdodCA6IHRhcmdldFJlY3Qud2lkdGgsXG4gICAgdGFyZ2V0UzEgPSB2ZXJ0aWNhbCA/IHRhcmdldFJlY3QudG9wIDogdGFyZ2V0UmVjdC5sZWZ0LFxuICAgIHRhcmdldFMyID0gdmVydGljYWwgPyB0YXJnZXRSZWN0LmJvdHRvbSA6IHRhcmdldFJlY3QucmlnaHQsXG4gICAgaW52ZXJ0ID0gZmFsc2U7XG4gIGlmICghaW52ZXJ0U3dhcCkge1xuICAgIC8vIE5ldmVyIGludmVydCBvciBjcmVhdGUgZHJhZ0VsIHNoYWRvdyB3aGVuIHRhcmdldCBtb3ZlbWVuZXQgY2F1c2VzIG1vdXNlIHRvIG1vdmUgcGFzdCB0aGUgZW5kIG9mIHJlZ3VsYXIgc3dhcFRocmVzaG9sZFxuICAgIGlmIChpc0xhc3RUYXJnZXQgJiYgdGFyZ2V0TW92ZURpc3RhbmNlIDwgdGFyZ2V0TGVuZ3RoICogc3dhcFRocmVzaG9sZCkge1xuICAgICAgLy8gbXVsdGlwbGllZCBvbmx5IGJ5IHN3YXBUaHJlc2hvbGQgYmVjYXVzZSBtb3VzZSB3aWxsIGFscmVhZHkgYmUgaW5zaWRlIHRhcmdldCBieSAoMSAtIHRocmVzaG9sZCkgKiB0YXJnZXRMZW5ndGggLyAyXG4gICAgICAvLyBjaGVjayBpZiBwYXN0IGZpcnN0IGludmVydCB0aHJlc2hvbGQgb24gc2lkZSBvcHBvc2l0ZSBvZiBsYXN0RGlyZWN0aW9uXG4gICAgICBpZiAoIXBhc3RGaXJzdEludmVydFRocmVzaCAmJiAobGFzdERpcmVjdGlvbiA9PT0gMSA/IG1vdXNlT25BeGlzID4gdGFyZ2V0UzEgKyB0YXJnZXRMZW5ndGggKiBpbnZlcnRlZFN3YXBUaHJlc2hvbGQgLyAyIDogbW91c2VPbkF4aXMgPCB0YXJnZXRTMiAtIHRhcmdldExlbmd0aCAqIGludmVydGVkU3dhcFRocmVzaG9sZCAvIDIpKSB7XG4gICAgICAgIC8vIHBhc3QgZmlyc3QgaW52ZXJ0IHRocmVzaG9sZCwgZG8gbm90IHJlc3RyaWN0IGludmVydGVkIHRocmVzaG9sZCB0byBkcmFnRWwgc2hhZG93XG4gICAgICAgIHBhc3RGaXJzdEludmVydFRocmVzaCA9IHRydWU7XG4gICAgICB9XG4gICAgICBpZiAoIXBhc3RGaXJzdEludmVydFRocmVzaCkge1xuICAgICAgICAvLyBkcmFnRWwgc2hhZG93ICh0YXJnZXQgbW92ZSBkaXN0YW5jZSBzaGFkb3cpXG4gICAgICAgIGlmIChsYXN0RGlyZWN0aW9uID09PSAxID8gbW91c2VPbkF4aXMgPCB0YXJnZXRTMSArIHRhcmdldE1vdmVEaXN0YW5jZSAvLyBvdmVyIGRyYWdFbCBzaGFkb3dcbiAgICAgICAgOiBtb3VzZU9uQXhpcyA+IHRhcmdldFMyIC0gdGFyZ2V0TW92ZURpc3RhbmNlKSB7XG4gICAgICAgICAgcmV0dXJuIC1sYXN0RGlyZWN0aW9uO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpbnZlcnQgPSB0cnVlO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBSZWd1bGFyXG4gICAgICBpZiAobW91c2VPbkF4aXMgPiB0YXJnZXRTMSArIHRhcmdldExlbmd0aCAqICgxIC0gc3dhcFRocmVzaG9sZCkgLyAyICYmIG1vdXNlT25BeGlzIDwgdGFyZ2V0UzIgLSB0YXJnZXRMZW5ndGggKiAoMSAtIHN3YXBUaHJlc2hvbGQpIC8gMikge1xuICAgICAgICByZXR1cm4gX2dldEluc2VydERpcmVjdGlvbih0YXJnZXQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBpbnZlcnQgPSBpbnZlcnQgfHwgaW52ZXJ0U3dhcDtcbiAgaWYgKGludmVydCkge1xuICAgIC8vIEludmVydCBvZiByZWd1bGFyXG4gICAgaWYgKG1vdXNlT25BeGlzIDwgdGFyZ2V0UzEgKyB0YXJnZXRMZW5ndGggKiBpbnZlcnRlZFN3YXBUaHJlc2hvbGQgLyAyIHx8IG1vdXNlT25BeGlzID4gdGFyZ2V0UzIgLSB0YXJnZXRMZW5ndGggKiBpbnZlcnRlZFN3YXBUaHJlc2hvbGQgLyAyKSB7XG4gICAgICByZXR1cm4gbW91c2VPbkF4aXMgPiB0YXJnZXRTMSArIHRhcmdldExlbmd0aCAvIDIgPyAxIDogLTE7XG4gICAgfVxuICB9XG4gIHJldHVybiAwO1xufVxuXG4vKipcclxuICogR2V0cyB0aGUgZGlyZWN0aW9uIGRyYWdFbCBtdXN0IGJlIHN3YXBwZWQgcmVsYXRpdmUgdG8gdGFyZ2V0IGluIG9yZGVyIHRvIG1ha2UgaXRcclxuICogc2VlbSB0aGF0IGRyYWdFbCBoYXMgYmVlbiBcImluc2VydGVkXCIgaW50byB0aGF0IGVsZW1lbnQncyBwb3NpdGlvblxyXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gdGFyZ2V0ICAgICAgIFRoZSB0YXJnZXQgd2hvc2UgcG9zaXRpb24gZHJhZ0VsIGlzIGJlaW5nIGluc2VydGVkIGF0XHJcbiAqIEByZXR1cm4ge051bWJlcn0gICAgICAgICAgICAgICAgICAgRGlyZWN0aW9uIGRyYWdFbCBtdXN0IGJlIHN3YXBwZWRcclxuICovXG5mdW5jdGlvbiBfZ2V0SW5zZXJ0RGlyZWN0aW9uKHRhcmdldCkge1xuICBpZiAoaW5kZXgoZHJhZ0VsKSA8IGluZGV4KHRhcmdldCkpIHtcbiAgICByZXR1cm4gMTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gLTE7XG4gIH1cbn1cblxuLyoqXHJcbiAqIEdlbmVyYXRlIGlkXHJcbiAqIEBwYXJhbSAgIHtIVE1MRWxlbWVudH0gZWxcclxuICogQHJldHVybnMge1N0cmluZ31cclxuICogQHByaXZhdGVcclxuICovXG5mdW5jdGlvbiBfZ2VuZXJhdGVJZChlbCkge1xuICB2YXIgc3RyID0gZWwudGFnTmFtZSArIGVsLmNsYXNzTmFtZSArIGVsLnNyYyArIGVsLmhyZWYgKyBlbC50ZXh0Q29udGVudCxcbiAgICBpID0gc3RyLmxlbmd0aCxcbiAgICBzdW0gPSAwO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgc3VtICs9IHN0ci5jaGFyQ29kZUF0KGkpO1xuICB9XG4gIHJldHVybiBzdW0udG9TdHJpbmcoMzYpO1xufVxuZnVuY3Rpb24gX3NhdmVJbnB1dENoZWNrZWRTdGF0ZShyb290KSB7XG4gIHNhdmVkSW5wdXRDaGVja2VkLmxlbmd0aCA9IDA7XG4gIHZhciBpbnB1dHMgPSByb290LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpbnB1dCcpO1xuICB2YXIgaWR4ID0gaW5wdXRzLmxlbmd0aDtcbiAgd2hpbGUgKGlkeC0tKSB7XG4gICAgdmFyIGVsID0gaW5wdXRzW2lkeF07XG4gICAgZWwuY2hlY2tlZCAmJiBzYXZlZElucHV0Q2hlY2tlZC5wdXNoKGVsKTtcbiAgfVxufVxuZnVuY3Rpb24gX25leHRUaWNrKGZuKSB7XG4gIHJldHVybiBzZXRUaW1lb3V0KGZuLCAwKTtcbn1cbmZ1bmN0aW9uIF9jYW5jZWxOZXh0VGljayhpZCkge1xuICByZXR1cm4gY2xlYXJUaW1lb3V0KGlkKTtcbn1cblxuLy8gRml4ZWQgIzk3MzpcbmlmIChkb2N1bWVudEV4aXN0cykge1xuICBvbihkb2N1bWVudCwgJ3RvdWNobW92ZScsIGZ1bmN0aW9uIChldnQpIHtcbiAgICBpZiAoKFNvcnRhYmxlLmFjdGl2ZSB8fCBhd2FpdGluZ0RyYWdTdGFydGVkKSAmJiBldnQuY2FuY2VsYWJsZSkge1xuICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuICB9KTtcbn1cblxuLy8gRXhwb3J0IHV0aWxzXG5Tb3J0YWJsZS51dGlscyA9IHtcbiAgb246IG9uLFxuICBvZmY6IG9mZixcbiAgY3NzOiBjc3MsXG4gIGZpbmQ6IGZpbmQsXG4gIGlzOiBmdW5jdGlvbiBpcyhlbCwgc2VsZWN0b3IpIHtcbiAgICByZXR1cm4gISFjbG9zZXN0KGVsLCBzZWxlY3RvciwgZWwsIGZhbHNlKTtcbiAgfSxcbiAgZXh0ZW5kOiBleHRlbmQsXG4gIHRocm90dGxlOiB0aHJvdHRsZSxcbiAgY2xvc2VzdDogY2xvc2VzdCxcbiAgdG9nZ2xlQ2xhc3M6IHRvZ2dsZUNsYXNzLFxuICBjbG9uZTogY2xvbmUsXG4gIGluZGV4OiBpbmRleCxcbiAgbmV4dFRpY2s6IF9uZXh0VGljayxcbiAgY2FuY2VsTmV4dFRpY2s6IF9jYW5jZWxOZXh0VGljayxcbiAgZGV0ZWN0RGlyZWN0aW9uOiBfZGV0ZWN0RGlyZWN0aW9uLFxuICBnZXRDaGlsZDogZ2V0Q2hpbGQsXG4gIGV4cGFuZG86IGV4cGFuZG9cbn07XG5cbi8qKlxyXG4gKiBHZXQgdGhlIFNvcnRhYmxlIGluc3RhbmNlIG9mIGFuIGVsZW1lbnRcclxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgVGhlIGVsZW1lbnRcclxuICogQHJldHVybiB7U29ydGFibGV8dW5kZWZpbmVkfSAgICAgICAgIFRoZSBpbnN0YW5jZSBvZiBTb3J0YWJsZVxyXG4gKi9cblNvcnRhYmxlLmdldCA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gIHJldHVybiBlbGVtZW50W2V4cGFuZG9dO1xufTtcblxuLyoqXHJcbiAqIE1vdW50IGEgcGx1Z2luIHRvIFNvcnRhYmxlXHJcbiAqIEBwYXJhbSAgey4uLlNvcnRhYmxlUGx1Z2lufFNvcnRhYmxlUGx1Z2luW119IHBsdWdpbnMgICAgICAgUGx1Z2lucyBiZWluZyBtb3VudGVkXHJcbiAqL1xuU29ydGFibGUubW91bnQgPSBmdW5jdGlvbiAoKSB7XG4gIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBwbHVnaW5zID0gbmV3IEFycmF5KF9sZW4pLCBfa2V5ID0gMDsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgIHBsdWdpbnNbX2tleV0gPSBhcmd1bWVudHNbX2tleV07XG4gIH1cbiAgaWYgKHBsdWdpbnNbMF0uY29uc3RydWN0b3IgPT09IEFycmF5KSBwbHVnaW5zID0gcGx1Z2luc1swXTtcbiAgcGx1Z2lucy5mb3JFYWNoKGZ1bmN0aW9uIChwbHVnaW4pIHtcbiAgICBpZiAoIXBsdWdpbi5wcm90b3R5cGUgfHwgIXBsdWdpbi5wcm90b3R5cGUuY29uc3RydWN0b3IpIHtcbiAgICAgIHRocm93IFwiU29ydGFibGU6IE1vdW50ZWQgcGx1Z2luIG11c3QgYmUgYSBjb25zdHJ1Y3RvciBmdW5jdGlvbiwgbm90IFwiLmNvbmNhdCh7fS50b1N0cmluZy5jYWxsKHBsdWdpbikpO1xuICAgIH1cbiAgICBpZiAocGx1Z2luLnV0aWxzKSBTb3J0YWJsZS51dGlscyA9IF9vYmplY3RTcHJlYWQyKF9vYmplY3RTcHJlYWQyKHt9LCBTb3J0YWJsZS51dGlscyksIHBsdWdpbi51dGlscyk7XG4gICAgUGx1Z2luTWFuYWdlci5tb3VudChwbHVnaW4pO1xuICB9KTtcbn07XG5cbi8qKlxyXG4gKiBDcmVhdGUgc29ydGFibGUgaW5zdGFuY2VcclxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gIGVsXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSAgICAgIFtvcHRpb25zXVxyXG4gKi9cblNvcnRhYmxlLmNyZWF0ZSA9IGZ1bmN0aW9uIChlbCwgb3B0aW9ucykge1xuICByZXR1cm4gbmV3IFNvcnRhYmxlKGVsLCBvcHRpb25zKTtcbn07XG5cbi8vIEV4cG9ydFxuU29ydGFibGUudmVyc2lvbiA9IHZlcnNpb247XG5cbnZhciBhdXRvU2Nyb2xscyA9IFtdLFxuICBzY3JvbGxFbCxcbiAgc2Nyb2xsUm9vdEVsLFxuICBzY3JvbGxpbmcgPSBmYWxzZSxcbiAgbGFzdEF1dG9TY3JvbGxYLFxuICBsYXN0QXV0b1Njcm9sbFksXG4gIHRvdWNoRXZ0JDEsXG4gIHBvaW50ZXJFbGVtQ2hhbmdlZEludGVydmFsO1xuZnVuY3Rpb24gQXV0b1Njcm9sbFBsdWdpbigpIHtcbiAgZnVuY3Rpb24gQXV0b1Njcm9sbCgpIHtcbiAgICB0aGlzLmRlZmF1bHRzID0ge1xuICAgICAgc2Nyb2xsOiB0cnVlLFxuICAgICAgZm9yY2VBdXRvU2Nyb2xsRmFsbGJhY2s6IGZhbHNlLFxuICAgICAgc2Nyb2xsU2Vuc2l0aXZpdHk6IDMwLFxuICAgICAgc2Nyb2xsU3BlZWQ6IDEwLFxuICAgICAgYnViYmxlU2Nyb2xsOiB0cnVlXG4gICAgfTtcblxuICAgIC8vIEJpbmQgYWxsIHByaXZhdGUgbWV0aG9kc1xuICAgIGZvciAodmFyIGZuIGluIHRoaXMpIHtcbiAgICAgIGlmIChmbi5jaGFyQXQoMCkgPT09ICdfJyAmJiB0eXBlb2YgdGhpc1tmbl0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpc1tmbl0gPSB0aGlzW2ZuXS5iaW5kKHRoaXMpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBBdXRvU2Nyb2xsLnByb3RvdHlwZSA9IHtcbiAgICBkcmFnU3RhcnRlZDogZnVuY3Rpb24gZHJhZ1N0YXJ0ZWQoX3JlZikge1xuICAgICAgdmFyIG9yaWdpbmFsRXZlbnQgPSBfcmVmLm9yaWdpbmFsRXZlbnQ7XG4gICAgICBpZiAodGhpcy5zb3J0YWJsZS5uYXRpdmVEcmFnZ2FibGUpIHtcbiAgICAgICAgb24oZG9jdW1lbnQsICdkcmFnb3ZlcicsIHRoaXMuX2hhbmRsZUF1dG9TY3JvbGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zdXBwb3J0UG9pbnRlcikge1xuICAgICAgICAgIG9uKGRvY3VtZW50LCAncG9pbnRlcm1vdmUnLCB0aGlzLl9oYW5kbGVGYWxsYmFja0F1dG9TY3JvbGwpO1xuICAgICAgICB9IGVsc2UgaWYgKG9yaWdpbmFsRXZlbnQudG91Y2hlcykge1xuICAgICAgICAgIG9uKGRvY3VtZW50LCAndG91Y2htb3ZlJywgdGhpcy5faGFuZGxlRmFsbGJhY2tBdXRvU2Nyb2xsKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvbihkb2N1bWVudCwgJ21vdXNlbW92ZScsIHRoaXMuX2hhbmRsZUZhbGxiYWNrQXV0b1Njcm9sbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIGRyYWdPdmVyQ29tcGxldGVkOiBmdW5jdGlvbiBkcmFnT3ZlckNvbXBsZXRlZChfcmVmMikge1xuICAgICAgdmFyIG9yaWdpbmFsRXZlbnQgPSBfcmVmMi5vcmlnaW5hbEV2ZW50O1xuICAgICAgLy8gRm9yIHdoZW4gYnViYmxpbmcgaXMgY2FuY2VsZWQgYW5kIHVzaW5nIGZhbGxiYWNrIChmYWxsYmFjayAndG91Y2htb3ZlJyBhbHdheXMgcmVhY2hlZClcbiAgICAgIGlmICghdGhpcy5vcHRpb25zLmRyYWdPdmVyQnViYmxlICYmICFvcmlnaW5hbEV2ZW50LnJvb3RFbCkge1xuICAgICAgICB0aGlzLl9oYW5kbGVBdXRvU2Nyb2xsKG9yaWdpbmFsRXZlbnQpO1xuICAgICAgfVxuICAgIH0sXG4gICAgZHJvcDogZnVuY3Rpb24gZHJvcCgpIHtcbiAgICAgIGlmICh0aGlzLnNvcnRhYmxlLm5hdGl2ZURyYWdnYWJsZSkge1xuICAgICAgICBvZmYoZG9jdW1lbnQsICdkcmFnb3ZlcicsIHRoaXMuX2hhbmRsZUF1dG9TY3JvbGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb2ZmKGRvY3VtZW50LCAncG9pbnRlcm1vdmUnLCB0aGlzLl9oYW5kbGVGYWxsYmFja0F1dG9TY3JvbGwpO1xuICAgICAgICBvZmYoZG9jdW1lbnQsICd0b3VjaG1vdmUnLCB0aGlzLl9oYW5kbGVGYWxsYmFja0F1dG9TY3JvbGwpO1xuICAgICAgICBvZmYoZG9jdW1lbnQsICdtb3VzZW1vdmUnLCB0aGlzLl9oYW5kbGVGYWxsYmFja0F1dG9TY3JvbGwpO1xuICAgICAgfVxuICAgICAgY2xlYXJQb2ludGVyRWxlbUNoYW5nZWRJbnRlcnZhbCgpO1xuICAgICAgY2xlYXJBdXRvU2Nyb2xscygpO1xuICAgICAgY2FuY2VsVGhyb3R0bGUoKTtcbiAgICB9LFxuICAgIG51bGxpbmc6IGZ1bmN0aW9uIG51bGxpbmcoKSB7XG4gICAgICB0b3VjaEV2dCQxID0gc2Nyb2xsUm9vdEVsID0gc2Nyb2xsRWwgPSBzY3JvbGxpbmcgPSBwb2ludGVyRWxlbUNoYW5nZWRJbnRlcnZhbCA9IGxhc3RBdXRvU2Nyb2xsWCA9IGxhc3RBdXRvU2Nyb2xsWSA9IG51bGw7XG4gICAgICBhdXRvU2Nyb2xscy5sZW5ndGggPSAwO1xuICAgIH0sXG4gICAgX2hhbmRsZUZhbGxiYWNrQXV0b1Njcm9sbDogZnVuY3Rpb24gX2hhbmRsZUZhbGxiYWNrQXV0b1Njcm9sbChldnQpIHtcbiAgICAgIHRoaXMuX2hhbmRsZUF1dG9TY3JvbGwoZXZ0LCB0cnVlKTtcbiAgICB9LFxuICAgIF9oYW5kbGVBdXRvU2Nyb2xsOiBmdW5jdGlvbiBfaGFuZGxlQXV0b1Njcm9sbChldnQsIGZhbGxiYWNrKSB7XG4gICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgdmFyIHggPSAoZXZ0LnRvdWNoZXMgPyBldnQudG91Y2hlc1swXSA6IGV2dCkuY2xpZW50WCxcbiAgICAgICAgeSA9IChldnQudG91Y2hlcyA/IGV2dC50b3VjaGVzWzBdIDogZXZ0KS5jbGllbnRZLFxuICAgICAgICBlbGVtID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludCh4LCB5KTtcbiAgICAgIHRvdWNoRXZ0JDEgPSBldnQ7XG5cbiAgICAgIC8vIElFIGRvZXMgbm90IHNlZW0gdG8gaGF2ZSBuYXRpdmUgYXV0b3Njcm9sbCxcbiAgICAgIC8vIEVkZ2UncyBhdXRvc2Nyb2xsIHNlZW1zIHRvbyBjb25kaXRpb25hbCxcbiAgICAgIC8vIE1BQ09TIFNhZmFyaSBkb2VzIG5vdCBoYXZlIGF1dG9zY3JvbGwsXG4gICAgICAvLyBGaXJlZm94IGFuZCBDaHJvbWUgYXJlIGdvb2RcbiAgICAgIGlmIChmYWxsYmFjayB8fCB0aGlzLm9wdGlvbnMuZm9yY2VBdXRvU2Nyb2xsRmFsbGJhY2sgfHwgRWRnZSB8fCBJRTExT3JMZXNzIHx8IFNhZmFyaSkge1xuICAgICAgICBhdXRvU2Nyb2xsKGV2dCwgdGhpcy5vcHRpb25zLCBlbGVtLCBmYWxsYmFjayk7XG5cbiAgICAgICAgLy8gTGlzdGVuZXIgZm9yIHBvaW50ZXIgZWxlbWVudCBjaGFuZ2VcbiAgICAgICAgdmFyIG9nRWxlbVNjcm9sbGVyID0gZ2V0UGFyZW50QXV0b1Njcm9sbEVsZW1lbnQoZWxlbSwgdHJ1ZSk7XG4gICAgICAgIGlmIChzY3JvbGxpbmcgJiYgKCFwb2ludGVyRWxlbUNoYW5nZWRJbnRlcnZhbCB8fCB4ICE9PSBsYXN0QXV0b1Njcm9sbFggfHwgeSAhPT0gbGFzdEF1dG9TY3JvbGxZKSkge1xuICAgICAgICAgIHBvaW50ZXJFbGVtQ2hhbmdlZEludGVydmFsICYmIGNsZWFyUG9pbnRlckVsZW1DaGFuZ2VkSW50ZXJ2YWwoKTtcbiAgICAgICAgICAvLyBEZXRlY3QgZm9yIHBvaW50ZXIgZWxlbSBjaGFuZ2UsIGVtdWxhdGluZyBuYXRpdmUgRG5EIGJlaGF2aW91clxuICAgICAgICAgIHBvaW50ZXJFbGVtQ2hhbmdlZEludGVydmFsID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIG5ld0VsZW0gPSBnZXRQYXJlbnRBdXRvU2Nyb2xsRWxlbWVudChkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KHgsIHkpLCB0cnVlKTtcbiAgICAgICAgICAgIGlmIChuZXdFbGVtICE9PSBvZ0VsZW1TY3JvbGxlcikge1xuICAgICAgICAgICAgICBvZ0VsZW1TY3JvbGxlciA9IG5ld0VsZW07XG4gICAgICAgICAgICAgIGNsZWFyQXV0b1Njcm9sbHMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGF1dG9TY3JvbGwoZXZ0LCBfdGhpcy5vcHRpb25zLCBuZXdFbGVtLCBmYWxsYmFjayk7XG4gICAgICAgICAgfSwgMTApO1xuICAgICAgICAgIGxhc3RBdXRvU2Nyb2xsWCA9IHg7XG4gICAgICAgICAgbGFzdEF1dG9TY3JvbGxZID0geTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gaWYgRG5EIGlzIGVuYWJsZWQgKGFuZCBicm93c2VyIGhhcyBnb29kIGF1dG9zY3JvbGxpbmcpLCBmaXJzdCBhdXRvc2Nyb2xsIHdpbGwgYWxyZWFkeSBzY3JvbGwsIHNvIGdldCBwYXJlbnQgYXV0b3Njcm9sbCBvZiBmaXJzdCBhdXRvc2Nyb2xsXG4gICAgICAgIGlmICghdGhpcy5vcHRpb25zLmJ1YmJsZVNjcm9sbCB8fCBnZXRQYXJlbnRBdXRvU2Nyb2xsRWxlbWVudChlbGVtLCB0cnVlKSA9PT0gZ2V0V2luZG93U2Nyb2xsaW5nRWxlbWVudCgpKSB7XG4gICAgICAgICAgY2xlYXJBdXRvU2Nyb2xscygpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBhdXRvU2Nyb2xsKGV2dCwgdGhpcy5vcHRpb25zLCBnZXRQYXJlbnRBdXRvU2Nyb2xsRWxlbWVudChlbGVtLCBmYWxzZSksIGZhbHNlKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIHJldHVybiBfZXh0ZW5kcyhBdXRvU2Nyb2xsLCB7XG4gICAgcGx1Z2luTmFtZTogJ3Njcm9sbCcsXG4gICAgaW5pdGlhbGl6ZUJ5RGVmYXVsdDogdHJ1ZVxuICB9KTtcbn1cbmZ1bmN0aW9uIGNsZWFyQXV0b1Njcm9sbHMoKSB7XG4gIGF1dG9TY3JvbGxzLmZvckVhY2goZnVuY3Rpb24gKGF1dG9TY3JvbGwpIHtcbiAgICBjbGVhckludGVydmFsKGF1dG9TY3JvbGwucGlkKTtcbiAgfSk7XG4gIGF1dG9TY3JvbGxzID0gW107XG59XG5mdW5jdGlvbiBjbGVhclBvaW50ZXJFbGVtQ2hhbmdlZEludGVydmFsKCkge1xuICBjbGVhckludGVydmFsKHBvaW50ZXJFbGVtQ2hhbmdlZEludGVydmFsKTtcbn1cbnZhciBhdXRvU2Nyb2xsID0gdGhyb3R0bGUoZnVuY3Rpb24gKGV2dCwgb3B0aW9ucywgcm9vdEVsLCBpc0ZhbGxiYWNrKSB7XG4gIC8vIEJ1ZzogaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9NTA1NTIxXG4gIGlmICghb3B0aW9ucy5zY3JvbGwpIHJldHVybjtcbiAgdmFyIHggPSAoZXZ0LnRvdWNoZXMgPyBldnQudG91Y2hlc1swXSA6IGV2dCkuY2xpZW50WCxcbiAgICB5ID0gKGV2dC50b3VjaGVzID8gZXZ0LnRvdWNoZXNbMF0gOiBldnQpLmNsaWVudFksXG4gICAgc2VucyA9IG9wdGlvbnMuc2Nyb2xsU2Vuc2l0aXZpdHksXG4gICAgc3BlZWQgPSBvcHRpb25zLnNjcm9sbFNwZWVkLFxuICAgIHdpblNjcm9sbGVyID0gZ2V0V2luZG93U2Nyb2xsaW5nRWxlbWVudCgpO1xuICB2YXIgc2Nyb2xsVGhpc0luc3RhbmNlID0gZmFsc2UsXG4gICAgc2Nyb2xsQ3VzdG9tRm47XG5cbiAgLy8gTmV3IHNjcm9sbCByb290LCBzZXQgc2Nyb2xsRWxcbiAgaWYgKHNjcm9sbFJvb3RFbCAhPT0gcm9vdEVsKSB7XG4gICAgc2Nyb2xsUm9vdEVsID0gcm9vdEVsO1xuICAgIGNsZWFyQXV0b1Njcm9sbHMoKTtcbiAgICBzY3JvbGxFbCA9IG9wdGlvbnMuc2Nyb2xsO1xuICAgIHNjcm9sbEN1c3RvbUZuID0gb3B0aW9ucy5zY3JvbGxGbjtcbiAgICBpZiAoc2Nyb2xsRWwgPT09IHRydWUpIHtcbiAgICAgIHNjcm9sbEVsID0gZ2V0UGFyZW50QXV0b1Njcm9sbEVsZW1lbnQocm9vdEVsLCB0cnVlKTtcbiAgICB9XG4gIH1cbiAgdmFyIGxheWVyc091dCA9IDA7XG4gIHZhciBjdXJyZW50UGFyZW50ID0gc2Nyb2xsRWw7XG4gIGRvIHtcbiAgICB2YXIgZWwgPSBjdXJyZW50UGFyZW50LFxuICAgICAgcmVjdCA9IGdldFJlY3QoZWwpLFxuICAgICAgdG9wID0gcmVjdC50b3AsXG4gICAgICBib3R0b20gPSByZWN0LmJvdHRvbSxcbiAgICAgIGxlZnQgPSByZWN0LmxlZnQsXG4gICAgICByaWdodCA9IHJlY3QucmlnaHQsXG4gICAgICB3aWR0aCA9IHJlY3Qud2lkdGgsXG4gICAgICBoZWlnaHQgPSByZWN0LmhlaWdodCxcbiAgICAgIGNhblNjcm9sbFggPSB2b2lkIDAsXG4gICAgICBjYW5TY3JvbGxZID0gdm9pZCAwLFxuICAgICAgc2Nyb2xsV2lkdGggPSBlbC5zY3JvbGxXaWR0aCxcbiAgICAgIHNjcm9sbEhlaWdodCA9IGVsLnNjcm9sbEhlaWdodCxcbiAgICAgIGVsQ1NTID0gY3NzKGVsKSxcbiAgICAgIHNjcm9sbFBvc1ggPSBlbC5zY3JvbGxMZWZ0LFxuICAgICAgc2Nyb2xsUG9zWSA9IGVsLnNjcm9sbFRvcDtcbiAgICBpZiAoZWwgPT09IHdpblNjcm9sbGVyKSB7XG4gICAgICBjYW5TY3JvbGxYID0gd2lkdGggPCBzY3JvbGxXaWR0aCAmJiAoZWxDU1Mub3ZlcmZsb3dYID09PSAnYXV0bycgfHwgZWxDU1Mub3ZlcmZsb3dYID09PSAnc2Nyb2xsJyB8fCBlbENTUy5vdmVyZmxvd1ggPT09ICd2aXNpYmxlJyk7XG4gICAgICBjYW5TY3JvbGxZID0gaGVpZ2h0IDwgc2Nyb2xsSGVpZ2h0ICYmIChlbENTUy5vdmVyZmxvd1kgPT09ICdhdXRvJyB8fCBlbENTUy5vdmVyZmxvd1kgPT09ICdzY3JvbGwnIHx8IGVsQ1NTLm92ZXJmbG93WSA9PT0gJ3Zpc2libGUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2FuU2Nyb2xsWCA9IHdpZHRoIDwgc2Nyb2xsV2lkdGggJiYgKGVsQ1NTLm92ZXJmbG93WCA9PT0gJ2F1dG8nIHx8IGVsQ1NTLm92ZXJmbG93WCA9PT0gJ3Njcm9sbCcpO1xuICAgICAgY2FuU2Nyb2xsWSA9IGhlaWdodCA8IHNjcm9sbEhlaWdodCAmJiAoZWxDU1Mub3ZlcmZsb3dZID09PSAnYXV0bycgfHwgZWxDU1Mub3ZlcmZsb3dZID09PSAnc2Nyb2xsJyk7XG4gICAgfVxuICAgIHZhciB2eCA9IGNhblNjcm9sbFggJiYgKE1hdGguYWJzKHJpZ2h0IC0geCkgPD0gc2VucyAmJiBzY3JvbGxQb3NYICsgd2lkdGggPCBzY3JvbGxXaWR0aCkgLSAoTWF0aC5hYnMobGVmdCAtIHgpIDw9IHNlbnMgJiYgISFzY3JvbGxQb3NYKTtcbiAgICB2YXIgdnkgPSBjYW5TY3JvbGxZICYmIChNYXRoLmFicyhib3R0b20gLSB5KSA8PSBzZW5zICYmIHNjcm9sbFBvc1kgKyBoZWlnaHQgPCBzY3JvbGxIZWlnaHQpIC0gKE1hdGguYWJzKHRvcCAtIHkpIDw9IHNlbnMgJiYgISFzY3JvbGxQb3NZKTtcbiAgICBpZiAoIWF1dG9TY3JvbGxzW2xheWVyc091dF0pIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IGxheWVyc091dDsgaSsrKSB7XG4gICAgICAgIGlmICghYXV0b1Njcm9sbHNbaV0pIHtcbiAgICAgICAgICBhdXRvU2Nyb2xsc1tpXSA9IHt9O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChhdXRvU2Nyb2xsc1tsYXllcnNPdXRdLnZ4ICE9IHZ4IHx8IGF1dG9TY3JvbGxzW2xheWVyc091dF0udnkgIT0gdnkgfHwgYXV0b1Njcm9sbHNbbGF5ZXJzT3V0XS5lbCAhPT0gZWwpIHtcbiAgICAgIGF1dG9TY3JvbGxzW2xheWVyc091dF0uZWwgPSBlbDtcbiAgICAgIGF1dG9TY3JvbGxzW2xheWVyc091dF0udnggPSB2eDtcbiAgICAgIGF1dG9TY3JvbGxzW2xheWVyc091dF0udnkgPSB2eTtcbiAgICAgIGNsZWFySW50ZXJ2YWwoYXV0b1Njcm9sbHNbbGF5ZXJzT3V0XS5waWQpO1xuICAgICAgaWYgKHZ4ICE9IDAgfHwgdnkgIT0gMCkge1xuICAgICAgICBzY3JvbGxUaGlzSW5zdGFuY2UgPSB0cnVlO1xuICAgICAgICAvKiBqc2hpbnQgbG9vcGZ1bmM6dHJ1ZSAqL1xuICAgICAgICBhdXRvU2Nyb2xsc1tsYXllcnNPdXRdLnBpZCA9IHNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAvLyBlbXVsYXRlIGRyYWcgb3ZlciBkdXJpbmcgYXV0b3Njcm9sbCAoZmFsbGJhY2spLCBlbXVsYXRpbmcgbmF0aXZlIERuRCBiZWhhdmlvdXJcbiAgICAgICAgICBpZiAoaXNGYWxsYmFjayAmJiB0aGlzLmxheWVyID09PSAwKSB7XG4gICAgICAgICAgICBTb3J0YWJsZS5hY3RpdmUuX29uVG91Y2hNb3ZlKHRvdWNoRXZ0JDEpOyAvLyBUbyBtb3ZlIGdob3N0IGlmIGl0IGlzIHBvc2l0aW9uZWQgYWJzb2x1dGVseVxuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgc2Nyb2xsT2Zmc2V0WSA9IGF1dG9TY3JvbGxzW3RoaXMubGF5ZXJdLnZ5ID8gYXV0b1Njcm9sbHNbdGhpcy5sYXllcl0udnkgKiBzcGVlZCA6IDA7XG4gICAgICAgICAgdmFyIHNjcm9sbE9mZnNldFggPSBhdXRvU2Nyb2xsc1t0aGlzLmxheWVyXS52eCA/IGF1dG9TY3JvbGxzW3RoaXMubGF5ZXJdLnZ4ICogc3BlZWQgOiAwO1xuICAgICAgICAgIGlmICh0eXBlb2Ygc2Nyb2xsQ3VzdG9tRm4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGlmIChzY3JvbGxDdXN0b21Gbi5jYWxsKFNvcnRhYmxlLmRyYWdnZWQucGFyZW50Tm9kZVtleHBhbmRvXSwgc2Nyb2xsT2Zmc2V0WCwgc2Nyb2xsT2Zmc2V0WSwgZXZ0LCB0b3VjaEV2dCQxLCBhdXRvU2Nyb2xsc1t0aGlzLmxheWVyXS5lbCkgIT09ICdjb250aW51ZScpIHtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBzY3JvbGxCeShhdXRvU2Nyb2xsc1t0aGlzLmxheWVyXS5lbCwgc2Nyb2xsT2Zmc2V0WCwgc2Nyb2xsT2Zmc2V0WSk7XG4gICAgICAgIH0uYmluZCh7XG4gICAgICAgICAgbGF5ZXI6IGxheWVyc091dFxuICAgICAgICB9KSwgMjQpO1xuICAgICAgfVxuICAgIH1cbiAgICBsYXllcnNPdXQrKztcbiAgfSB3aGlsZSAob3B0aW9ucy5idWJibGVTY3JvbGwgJiYgY3VycmVudFBhcmVudCAhPT0gd2luU2Nyb2xsZXIgJiYgKGN1cnJlbnRQYXJlbnQgPSBnZXRQYXJlbnRBdXRvU2Nyb2xsRWxlbWVudChjdXJyZW50UGFyZW50LCBmYWxzZSkpKTtcbiAgc2Nyb2xsaW5nID0gc2Nyb2xsVGhpc0luc3RhbmNlOyAvLyBpbiBjYXNlIGFub3RoZXIgZnVuY3Rpb24gY2F0Y2hlcyBzY3JvbGxpbmcgYXMgZmFsc2UgaW4gYmV0d2VlbiB3aGVuIGl0IGlzIG5vdFxufSwgMzApO1xuXG52YXIgZHJvcCA9IGZ1bmN0aW9uIGRyb3AoX3JlZikge1xuICB2YXIgb3JpZ2luYWxFdmVudCA9IF9yZWYub3JpZ2luYWxFdmVudCxcbiAgICBwdXRTb3J0YWJsZSA9IF9yZWYucHV0U29ydGFibGUsXG4gICAgZHJhZ0VsID0gX3JlZi5kcmFnRWwsXG4gICAgYWN0aXZlU29ydGFibGUgPSBfcmVmLmFjdGl2ZVNvcnRhYmxlLFxuICAgIGRpc3BhdGNoU29ydGFibGVFdmVudCA9IF9yZWYuZGlzcGF0Y2hTb3J0YWJsZUV2ZW50LFxuICAgIGhpZGVHaG9zdEZvclRhcmdldCA9IF9yZWYuaGlkZUdob3N0Rm9yVGFyZ2V0LFxuICAgIHVuaGlkZUdob3N0Rm9yVGFyZ2V0ID0gX3JlZi51bmhpZGVHaG9zdEZvclRhcmdldDtcbiAgaWYgKCFvcmlnaW5hbEV2ZW50KSByZXR1cm47XG4gIHZhciB0b1NvcnRhYmxlID0gcHV0U29ydGFibGUgfHwgYWN0aXZlU29ydGFibGU7XG4gIGhpZGVHaG9zdEZvclRhcmdldCgpO1xuICB2YXIgdG91Y2ggPSBvcmlnaW5hbEV2ZW50LmNoYW5nZWRUb3VjaGVzICYmIG9yaWdpbmFsRXZlbnQuY2hhbmdlZFRvdWNoZXMubGVuZ3RoID8gb3JpZ2luYWxFdmVudC5jaGFuZ2VkVG91Y2hlc1swXSA6IG9yaWdpbmFsRXZlbnQ7XG4gIHZhciB0YXJnZXQgPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KHRvdWNoLmNsaWVudFgsIHRvdWNoLmNsaWVudFkpO1xuICB1bmhpZGVHaG9zdEZvclRhcmdldCgpO1xuICBpZiAodG9Tb3J0YWJsZSAmJiAhdG9Tb3J0YWJsZS5lbC5jb250YWlucyh0YXJnZXQpKSB7XG4gICAgZGlzcGF0Y2hTb3J0YWJsZUV2ZW50KCdzcGlsbCcpO1xuICAgIHRoaXMub25TcGlsbCh7XG4gICAgICBkcmFnRWw6IGRyYWdFbCxcbiAgICAgIHB1dFNvcnRhYmxlOiBwdXRTb3J0YWJsZVxuICAgIH0pO1xuICB9XG59O1xuZnVuY3Rpb24gUmV2ZXJ0KCkge31cblJldmVydC5wcm90b3R5cGUgPSB7XG4gIHN0YXJ0SW5kZXg6IG51bGwsXG4gIGRyYWdTdGFydDogZnVuY3Rpb24gZHJhZ1N0YXJ0KF9yZWYyKSB7XG4gICAgdmFyIG9sZERyYWdnYWJsZUluZGV4ID0gX3JlZjIub2xkRHJhZ2dhYmxlSW5kZXg7XG4gICAgdGhpcy5zdGFydEluZGV4ID0gb2xkRHJhZ2dhYmxlSW5kZXg7XG4gIH0sXG4gIG9uU3BpbGw6IGZ1bmN0aW9uIG9uU3BpbGwoX3JlZjMpIHtcbiAgICB2YXIgZHJhZ0VsID0gX3JlZjMuZHJhZ0VsLFxuICAgICAgcHV0U29ydGFibGUgPSBfcmVmMy5wdXRTb3J0YWJsZTtcbiAgICB0aGlzLnNvcnRhYmxlLmNhcHR1cmVBbmltYXRpb25TdGF0ZSgpO1xuICAgIGlmIChwdXRTb3J0YWJsZSkge1xuICAgICAgcHV0U29ydGFibGUuY2FwdHVyZUFuaW1hdGlvblN0YXRlKCk7XG4gICAgfVxuICAgIHZhciBuZXh0U2libGluZyA9IGdldENoaWxkKHRoaXMuc29ydGFibGUuZWwsIHRoaXMuc3RhcnRJbmRleCwgdGhpcy5vcHRpb25zKTtcbiAgICBpZiAobmV4dFNpYmxpbmcpIHtcbiAgICAgIHRoaXMuc29ydGFibGUuZWwuaW5zZXJ0QmVmb3JlKGRyYWdFbCwgbmV4dFNpYmxpbmcpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNvcnRhYmxlLmVsLmFwcGVuZENoaWxkKGRyYWdFbCk7XG4gICAgfVxuICAgIHRoaXMuc29ydGFibGUuYW5pbWF0ZUFsbCgpO1xuICAgIGlmIChwdXRTb3J0YWJsZSkge1xuICAgICAgcHV0U29ydGFibGUuYW5pbWF0ZUFsbCgpO1xuICAgIH1cbiAgfSxcbiAgZHJvcDogZHJvcFxufTtcbl9leHRlbmRzKFJldmVydCwge1xuICBwbHVnaW5OYW1lOiAncmV2ZXJ0T25TcGlsbCdcbn0pO1xuZnVuY3Rpb24gUmVtb3ZlKCkge31cblJlbW92ZS5wcm90b3R5cGUgPSB7XG4gIG9uU3BpbGw6IGZ1bmN0aW9uIG9uU3BpbGwoX3JlZjQpIHtcbiAgICB2YXIgZHJhZ0VsID0gX3JlZjQuZHJhZ0VsLFxuICAgICAgcHV0U29ydGFibGUgPSBfcmVmNC5wdXRTb3J0YWJsZTtcbiAgICB2YXIgcGFyZW50U29ydGFibGUgPSBwdXRTb3J0YWJsZSB8fCB0aGlzLnNvcnRhYmxlO1xuICAgIHBhcmVudFNvcnRhYmxlLmNhcHR1cmVBbmltYXRpb25TdGF0ZSgpO1xuICAgIGRyYWdFbC5wYXJlbnROb2RlICYmIGRyYWdFbC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGRyYWdFbCk7XG4gICAgcGFyZW50U29ydGFibGUuYW5pbWF0ZUFsbCgpO1xuICB9LFxuICBkcm9wOiBkcm9wXG59O1xuX2V4dGVuZHMoUmVtb3ZlLCB7XG4gIHBsdWdpbk5hbWU6ICdyZW1vdmVPblNwaWxsJ1xufSk7XG5cbnZhciBsYXN0U3dhcEVsO1xuZnVuY3Rpb24gU3dhcFBsdWdpbigpIHtcbiAgZnVuY3Rpb24gU3dhcCgpIHtcbiAgICB0aGlzLmRlZmF1bHRzID0ge1xuICAgICAgc3dhcENsYXNzOiAnc29ydGFibGUtc3dhcC1oaWdobGlnaHQnXG4gICAgfTtcbiAgfVxuICBTd2FwLnByb3RvdHlwZSA9IHtcbiAgICBkcmFnU3RhcnQ6IGZ1bmN0aW9uIGRyYWdTdGFydChfcmVmKSB7XG4gICAgICB2YXIgZHJhZ0VsID0gX3JlZi5kcmFnRWw7XG4gICAgICBsYXN0U3dhcEVsID0gZHJhZ0VsO1xuICAgIH0sXG4gICAgZHJhZ092ZXJWYWxpZDogZnVuY3Rpb24gZHJhZ092ZXJWYWxpZChfcmVmMikge1xuICAgICAgdmFyIGNvbXBsZXRlZCA9IF9yZWYyLmNvbXBsZXRlZCxcbiAgICAgICAgdGFyZ2V0ID0gX3JlZjIudGFyZ2V0LFxuICAgICAgICBvbk1vdmUgPSBfcmVmMi5vbk1vdmUsXG4gICAgICAgIGFjdGl2ZVNvcnRhYmxlID0gX3JlZjIuYWN0aXZlU29ydGFibGUsXG4gICAgICAgIGNoYW5nZWQgPSBfcmVmMi5jaGFuZ2VkLFxuICAgICAgICBjYW5jZWwgPSBfcmVmMi5jYW5jZWw7XG4gICAgICBpZiAoIWFjdGl2ZVNvcnRhYmxlLm9wdGlvbnMuc3dhcCkgcmV0dXJuO1xuICAgICAgdmFyIGVsID0gdGhpcy5zb3J0YWJsZS5lbCxcbiAgICAgICAgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcbiAgICAgIGlmICh0YXJnZXQgJiYgdGFyZ2V0ICE9PSBlbCkge1xuICAgICAgICB2YXIgcHJldlN3YXBFbCA9IGxhc3RTd2FwRWw7XG4gICAgICAgIGlmIChvbk1vdmUodGFyZ2V0KSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICB0b2dnbGVDbGFzcyh0YXJnZXQsIG9wdGlvbnMuc3dhcENsYXNzLCB0cnVlKTtcbiAgICAgICAgICBsYXN0U3dhcEVsID0gdGFyZ2V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxhc3RTd2FwRWwgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwcmV2U3dhcEVsICYmIHByZXZTd2FwRWwgIT09IGxhc3RTd2FwRWwpIHtcbiAgICAgICAgICB0b2dnbGVDbGFzcyhwcmV2U3dhcEVsLCBvcHRpb25zLnN3YXBDbGFzcywgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjaGFuZ2VkKCk7XG4gICAgICBjb21wbGV0ZWQodHJ1ZSk7XG4gICAgICBjYW5jZWwoKTtcbiAgICB9LFxuICAgIGRyb3A6IGZ1bmN0aW9uIGRyb3AoX3JlZjMpIHtcbiAgICAgIHZhciBhY3RpdmVTb3J0YWJsZSA9IF9yZWYzLmFjdGl2ZVNvcnRhYmxlLFxuICAgICAgICBwdXRTb3J0YWJsZSA9IF9yZWYzLnB1dFNvcnRhYmxlLFxuICAgICAgICBkcmFnRWwgPSBfcmVmMy5kcmFnRWw7XG4gICAgICB2YXIgdG9Tb3J0YWJsZSA9IHB1dFNvcnRhYmxlIHx8IHRoaXMuc29ydGFibGU7XG4gICAgICB2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcbiAgICAgIGxhc3RTd2FwRWwgJiYgdG9nZ2xlQ2xhc3MobGFzdFN3YXBFbCwgb3B0aW9ucy5zd2FwQ2xhc3MsIGZhbHNlKTtcbiAgICAgIGlmIChsYXN0U3dhcEVsICYmIChvcHRpb25zLnN3YXAgfHwgcHV0U29ydGFibGUgJiYgcHV0U29ydGFibGUub3B0aW9ucy5zd2FwKSkge1xuICAgICAgICBpZiAoZHJhZ0VsICE9PSBsYXN0U3dhcEVsKSB7XG4gICAgICAgICAgdG9Tb3J0YWJsZS5jYXB0dXJlQW5pbWF0aW9uU3RhdGUoKTtcbiAgICAgICAgICBpZiAodG9Tb3J0YWJsZSAhPT0gYWN0aXZlU29ydGFibGUpIGFjdGl2ZVNvcnRhYmxlLmNhcHR1cmVBbmltYXRpb25TdGF0ZSgpO1xuICAgICAgICAgIHN3YXBOb2RlcyhkcmFnRWwsIGxhc3RTd2FwRWwpO1xuICAgICAgICAgIHRvU29ydGFibGUuYW5pbWF0ZUFsbCgpO1xuICAgICAgICAgIGlmICh0b1NvcnRhYmxlICE9PSBhY3RpdmVTb3J0YWJsZSkgYWN0aXZlU29ydGFibGUuYW5pbWF0ZUFsbCgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBudWxsaW5nOiBmdW5jdGlvbiBudWxsaW5nKCkge1xuICAgICAgbGFzdFN3YXBFbCA9IG51bGw7XG4gICAgfVxuICB9O1xuICByZXR1cm4gX2V4dGVuZHMoU3dhcCwge1xuICAgIHBsdWdpbk5hbWU6ICdzd2FwJyxcbiAgICBldmVudFByb3BlcnRpZXM6IGZ1bmN0aW9uIGV2ZW50UHJvcGVydGllcygpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN3YXBJdGVtOiBsYXN0U3dhcEVsXG4gICAgICB9O1xuICAgIH1cbiAgfSk7XG59XG5mdW5jdGlvbiBzd2FwTm9kZXMobjEsIG4yKSB7XG4gIHZhciBwMSA9IG4xLnBhcmVudE5vZGUsXG4gICAgcDIgPSBuMi5wYXJlbnROb2RlLFxuICAgIGkxLFxuICAgIGkyO1xuICBpZiAoIXAxIHx8ICFwMiB8fCBwMS5pc0VxdWFsTm9kZShuMikgfHwgcDIuaXNFcXVhbE5vZGUobjEpKSByZXR1cm47XG4gIGkxID0gaW5kZXgobjEpO1xuICBpMiA9IGluZGV4KG4yKTtcbiAgaWYgKHAxLmlzRXF1YWxOb2RlKHAyKSAmJiBpMSA8IGkyKSB7XG4gICAgaTIrKztcbiAgfVxuICBwMS5pbnNlcnRCZWZvcmUobjIsIHAxLmNoaWxkcmVuW2kxXSk7XG4gIHAyLmluc2VydEJlZm9yZShuMSwgcDIuY2hpbGRyZW5baTJdKTtcbn1cblxudmFyIG11bHRpRHJhZ0VsZW1lbnRzID0gW10sXG4gIG11bHRpRHJhZ0Nsb25lcyA9IFtdLFxuICBsYXN0TXVsdGlEcmFnU2VsZWN0LFxuICAvLyBmb3Igc2VsZWN0aW9uIHdpdGggbW9kaWZpZXIga2V5IGRvd24gKFNISUZUKVxuICBtdWx0aURyYWdTb3J0YWJsZSxcbiAgaW5pdGlhbEZvbGRpbmcgPSBmYWxzZSxcbiAgLy8gSW5pdGlhbCBtdWx0aS1kcmFnIGZvbGQgd2hlbiBkcmFnIHN0YXJ0ZWRcbiAgZm9sZGluZyA9IGZhbHNlLFxuICAvLyBGb2xkaW5nIGFueSBvdGhlciB0aW1lXG4gIGRyYWdTdGFydGVkID0gZmFsc2UsXG4gIGRyYWdFbCQxLFxuICBjbG9uZXNGcm9tUmVjdCxcbiAgY2xvbmVzSGlkZGVuO1xuZnVuY3Rpb24gTXVsdGlEcmFnUGx1Z2luKCkge1xuICBmdW5jdGlvbiBNdWx0aURyYWcoc29ydGFibGUpIHtcbiAgICAvLyBCaW5kIGFsbCBwcml2YXRlIG1ldGhvZHNcbiAgICBmb3IgKHZhciBmbiBpbiB0aGlzKSB7XG4gICAgICBpZiAoZm4uY2hhckF0KDApID09PSAnXycgJiYgdHlwZW9mIHRoaXNbZm5dID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRoaXNbZm5dID0gdGhpc1tmbl0uYmluZCh0aGlzKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFzb3J0YWJsZS5vcHRpb25zLmF2b2lkSW1wbGljaXREZXNlbGVjdCkge1xuICAgICAgaWYgKHNvcnRhYmxlLm9wdGlvbnMuc3VwcG9ydFBvaW50ZXIpIHtcbiAgICAgICAgb24oZG9jdW1lbnQsICdwb2ludGVydXAnLCB0aGlzLl9kZXNlbGVjdE11bHRpRHJhZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvbihkb2N1bWVudCwgJ21vdXNldXAnLCB0aGlzLl9kZXNlbGVjdE11bHRpRHJhZyk7XG4gICAgICAgIG9uKGRvY3VtZW50LCAndG91Y2hlbmQnLCB0aGlzLl9kZXNlbGVjdE11bHRpRHJhZyk7XG4gICAgICB9XG4gICAgfVxuICAgIG9uKGRvY3VtZW50LCAna2V5ZG93bicsIHRoaXMuX2NoZWNrS2V5RG93bik7XG4gICAgb24oZG9jdW1lbnQsICdrZXl1cCcsIHRoaXMuX2NoZWNrS2V5VXApO1xuICAgIHRoaXMuZGVmYXVsdHMgPSB7XG4gICAgICBzZWxlY3RlZENsYXNzOiAnc29ydGFibGUtc2VsZWN0ZWQnLFxuICAgICAgbXVsdGlEcmFnS2V5OiBudWxsLFxuICAgICAgYXZvaWRJbXBsaWNpdERlc2VsZWN0OiBmYWxzZSxcbiAgICAgIHNldERhdGE6IGZ1bmN0aW9uIHNldERhdGEoZGF0YVRyYW5zZmVyLCBkcmFnRWwpIHtcbiAgICAgICAgdmFyIGRhdGEgPSAnJztcbiAgICAgICAgaWYgKG11bHRpRHJhZ0VsZW1lbnRzLmxlbmd0aCAmJiBtdWx0aURyYWdTb3J0YWJsZSA9PT0gc29ydGFibGUpIHtcbiAgICAgICAgICBtdWx0aURyYWdFbGVtZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChtdWx0aURyYWdFbGVtZW50LCBpKSB7XG4gICAgICAgICAgICBkYXRhICs9ICghaSA/ICcnIDogJywgJykgKyBtdWx0aURyYWdFbGVtZW50LnRleHRDb250ZW50O1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRhdGEgPSBkcmFnRWwudGV4dENvbnRlbnQ7XG4gICAgICAgIH1cbiAgICAgICAgZGF0YVRyYW5zZmVyLnNldERhdGEoJ1RleHQnLCBkYXRhKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG4gIE11bHRpRHJhZy5wcm90b3R5cGUgPSB7XG4gICAgbXVsdGlEcmFnS2V5RG93bjogZmFsc2UsXG4gICAgaXNNdWx0aURyYWc6IGZhbHNlLFxuICAgIGRlbGF5U3RhcnRHbG9iYWw6IGZ1bmN0aW9uIGRlbGF5U3RhcnRHbG9iYWwoX3JlZikge1xuICAgICAgdmFyIGRyYWdnZWQgPSBfcmVmLmRyYWdFbDtcbiAgICAgIGRyYWdFbCQxID0gZHJhZ2dlZDtcbiAgICB9LFxuICAgIGRlbGF5RW5kZWQ6IGZ1bmN0aW9uIGRlbGF5RW5kZWQoKSB7XG4gICAgICB0aGlzLmlzTXVsdGlEcmFnID0gfm11bHRpRHJhZ0VsZW1lbnRzLmluZGV4T2YoZHJhZ0VsJDEpO1xuICAgIH0sXG4gICAgc2V0dXBDbG9uZTogZnVuY3Rpb24gc2V0dXBDbG9uZShfcmVmMikge1xuICAgICAgdmFyIHNvcnRhYmxlID0gX3JlZjIuc29ydGFibGUsXG4gICAgICAgIGNhbmNlbCA9IF9yZWYyLmNhbmNlbDtcbiAgICAgIGlmICghdGhpcy5pc011bHRpRHJhZykgcmV0dXJuO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtdWx0aURyYWdFbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBtdWx0aURyYWdDbG9uZXMucHVzaChjbG9uZShtdWx0aURyYWdFbGVtZW50c1tpXSkpO1xuICAgICAgICBtdWx0aURyYWdDbG9uZXNbaV0uc29ydGFibGVJbmRleCA9IG11bHRpRHJhZ0VsZW1lbnRzW2ldLnNvcnRhYmxlSW5kZXg7XG4gICAgICAgIG11bHRpRHJhZ0Nsb25lc1tpXS5kcmFnZ2FibGUgPSBmYWxzZTtcbiAgICAgICAgbXVsdGlEcmFnQ2xvbmVzW2ldLnN0eWxlWyd3aWxsLWNoYW5nZSddID0gJyc7XG4gICAgICAgIHRvZ2dsZUNsYXNzKG11bHRpRHJhZ0Nsb25lc1tpXSwgdGhpcy5vcHRpb25zLnNlbGVjdGVkQ2xhc3MsIGZhbHNlKTtcbiAgICAgICAgbXVsdGlEcmFnRWxlbWVudHNbaV0gPT09IGRyYWdFbCQxICYmIHRvZ2dsZUNsYXNzKG11bHRpRHJhZ0Nsb25lc1tpXSwgdGhpcy5vcHRpb25zLmNob3NlbkNsYXNzLCBmYWxzZSk7XG4gICAgICB9XG4gICAgICBzb3J0YWJsZS5faGlkZUNsb25lKCk7XG4gICAgICBjYW5jZWwoKTtcbiAgICB9LFxuICAgIGNsb25lOiBmdW5jdGlvbiBjbG9uZShfcmVmMykge1xuICAgICAgdmFyIHNvcnRhYmxlID0gX3JlZjMuc29ydGFibGUsXG4gICAgICAgIHJvb3RFbCA9IF9yZWYzLnJvb3RFbCxcbiAgICAgICAgZGlzcGF0Y2hTb3J0YWJsZUV2ZW50ID0gX3JlZjMuZGlzcGF0Y2hTb3J0YWJsZUV2ZW50LFxuICAgICAgICBjYW5jZWwgPSBfcmVmMy5jYW5jZWw7XG4gICAgICBpZiAoIXRoaXMuaXNNdWx0aURyYWcpIHJldHVybjtcbiAgICAgIGlmICghdGhpcy5vcHRpb25zLnJlbW92ZUNsb25lT25IaWRlKSB7XG4gICAgICAgIGlmIChtdWx0aURyYWdFbGVtZW50cy5sZW5ndGggJiYgbXVsdGlEcmFnU29ydGFibGUgPT09IHNvcnRhYmxlKSB7XG4gICAgICAgICAgaW5zZXJ0TXVsdGlEcmFnQ2xvbmVzKHRydWUsIHJvb3RFbCk7XG4gICAgICAgICAgZGlzcGF0Y2hTb3J0YWJsZUV2ZW50KCdjbG9uZScpO1xuICAgICAgICAgIGNhbmNlbCgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBzaG93Q2xvbmU6IGZ1bmN0aW9uIHNob3dDbG9uZShfcmVmNCkge1xuICAgICAgdmFyIGNsb25lTm93U2hvd24gPSBfcmVmNC5jbG9uZU5vd1Nob3duLFxuICAgICAgICByb290RWwgPSBfcmVmNC5yb290RWwsXG4gICAgICAgIGNhbmNlbCA9IF9yZWY0LmNhbmNlbDtcbiAgICAgIGlmICghdGhpcy5pc011bHRpRHJhZykgcmV0dXJuO1xuICAgICAgaW5zZXJ0TXVsdGlEcmFnQ2xvbmVzKGZhbHNlLCByb290RWwpO1xuICAgICAgbXVsdGlEcmFnQ2xvbmVzLmZvckVhY2goZnVuY3Rpb24gKGNsb25lKSB7XG4gICAgICAgIGNzcyhjbG9uZSwgJ2Rpc3BsYXknLCAnJyk7XG4gICAgICB9KTtcbiAgICAgIGNsb25lTm93U2hvd24oKTtcbiAgICAgIGNsb25lc0hpZGRlbiA9IGZhbHNlO1xuICAgICAgY2FuY2VsKCk7XG4gICAgfSxcbiAgICBoaWRlQ2xvbmU6IGZ1bmN0aW9uIGhpZGVDbG9uZShfcmVmNSkge1xuICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgIHZhciBzb3J0YWJsZSA9IF9yZWY1LnNvcnRhYmxlLFxuICAgICAgICBjbG9uZU5vd0hpZGRlbiA9IF9yZWY1LmNsb25lTm93SGlkZGVuLFxuICAgICAgICBjYW5jZWwgPSBfcmVmNS5jYW5jZWw7XG4gICAgICBpZiAoIXRoaXMuaXNNdWx0aURyYWcpIHJldHVybjtcbiAgICAgIG11bHRpRHJhZ0Nsb25lcy5mb3JFYWNoKGZ1bmN0aW9uIChjbG9uZSkge1xuICAgICAgICBjc3MoY2xvbmUsICdkaXNwbGF5JywgJ25vbmUnKTtcbiAgICAgICAgaWYgKF90aGlzLm9wdGlvbnMucmVtb3ZlQ2xvbmVPbkhpZGUgJiYgY2xvbmUucGFyZW50Tm9kZSkge1xuICAgICAgICAgIGNsb25lLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoY2xvbmUpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGNsb25lTm93SGlkZGVuKCk7XG4gICAgICBjbG9uZXNIaWRkZW4gPSB0cnVlO1xuICAgICAgY2FuY2VsKCk7XG4gICAgfSxcbiAgICBkcmFnU3RhcnRHbG9iYWw6IGZ1bmN0aW9uIGRyYWdTdGFydEdsb2JhbChfcmVmNikge1xuICAgICAgdmFyIHNvcnRhYmxlID0gX3JlZjYuc29ydGFibGU7XG4gICAgICBpZiAoIXRoaXMuaXNNdWx0aURyYWcgJiYgbXVsdGlEcmFnU29ydGFibGUpIHtcbiAgICAgICAgbXVsdGlEcmFnU29ydGFibGUubXVsdGlEcmFnLl9kZXNlbGVjdE11bHRpRHJhZygpO1xuICAgICAgfVxuICAgICAgbXVsdGlEcmFnRWxlbWVudHMuZm9yRWFjaChmdW5jdGlvbiAobXVsdGlEcmFnRWxlbWVudCkge1xuICAgICAgICBtdWx0aURyYWdFbGVtZW50LnNvcnRhYmxlSW5kZXggPSBpbmRleChtdWx0aURyYWdFbGVtZW50KTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBTb3J0IG11bHRpLWRyYWcgZWxlbWVudHNcbiAgICAgIG11bHRpRHJhZ0VsZW1lbnRzID0gbXVsdGlEcmFnRWxlbWVudHMuc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICByZXR1cm4gYS5zb3J0YWJsZUluZGV4IC0gYi5zb3J0YWJsZUluZGV4O1xuICAgICAgfSk7XG4gICAgICBkcmFnU3RhcnRlZCA9IHRydWU7XG4gICAgfSxcbiAgICBkcmFnU3RhcnRlZDogZnVuY3Rpb24gZHJhZ1N0YXJ0ZWQoX3JlZjcpIHtcbiAgICAgIHZhciBfdGhpczIgPSB0aGlzO1xuICAgICAgdmFyIHNvcnRhYmxlID0gX3JlZjcuc29ydGFibGU7XG4gICAgICBpZiAoIXRoaXMuaXNNdWx0aURyYWcpIHJldHVybjtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuc29ydCkge1xuICAgICAgICAvLyBDYXB0dXJlIHJlY3RzLFxuICAgICAgICAvLyBoaWRlIG11bHRpIGRyYWcgZWxlbWVudHMgKGJ5IHBvc2l0aW9uaW5nIHRoZW0gYWJzb2x1dGUpLFxuICAgICAgICAvLyBzZXQgbXVsdGkgZHJhZyBlbGVtZW50cyByZWN0cyB0byBkcmFnUmVjdCxcbiAgICAgICAgLy8gc2hvdyBtdWx0aSBkcmFnIGVsZW1lbnRzLFxuICAgICAgICAvLyBhbmltYXRlIHRvIHJlY3RzLFxuICAgICAgICAvLyB1bnNldCByZWN0cyAmIHJlbW92ZSBmcm9tIERPTVxuXG4gICAgICAgIHNvcnRhYmxlLmNhcHR1cmVBbmltYXRpb25TdGF0ZSgpO1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmFuaW1hdGlvbikge1xuICAgICAgICAgIG11bHRpRHJhZ0VsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24gKG11bHRpRHJhZ0VsZW1lbnQpIHtcbiAgICAgICAgICAgIGlmIChtdWx0aURyYWdFbGVtZW50ID09PSBkcmFnRWwkMSkgcmV0dXJuO1xuICAgICAgICAgICAgY3NzKG11bHRpRHJhZ0VsZW1lbnQsICdwb3NpdGlvbicsICdhYnNvbHV0ZScpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHZhciBkcmFnUmVjdCA9IGdldFJlY3QoZHJhZ0VsJDEsIGZhbHNlLCB0cnVlLCB0cnVlKTtcbiAgICAgICAgICBtdWx0aURyYWdFbGVtZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChtdWx0aURyYWdFbGVtZW50KSB7XG4gICAgICAgICAgICBpZiAobXVsdGlEcmFnRWxlbWVudCA9PT0gZHJhZ0VsJDEpIHJldHVybjtcbiAgICAgICAgICAgIHNldFJlY3QobXVsdGlEcmFnRWxlbWVudCwgZHJhZ1JlY3QpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGZvbGRpbmcgPSB0cnVlO1xuICAgICAgICAgIGluaXRpYWxGb2xkaW5nID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgc29ydGFibGUuYW5pbWF0ZUFsbChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZvbGRpbmcgPSBmYWxzZTtcbiAgICAgICAgaW5pdGlhbEZvbGRpbmcgPSBmYWxzZTtcbiAgICAgICAgaWYgKF90aGlzMi5vcHRpb25zLmFuaW1hdGlvbikge1xuICAgICAgICAgIG11bHRpRHJhZ0VsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24gKG11bHRpRHJhZ0VsZW1lbnQpIHtcbiAgICAgICAgICAgIHVuc2V0UmVjdChtdWx0aURyYWdFbGVtZW50KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlbW92ZSBhbGwgYXV4aWxpYXJ5IG11bHRpZHJhZyBpdGVtcyBmcm9tIGVsLCBpZiBzb3J0aW5nIGVuYWJsZWRcbiAgICAgICAgaWYgKF90aGlzMi5vcHRpb25zLnNvcnQpIHtcbiAgICAgICAgICByZW1vdmVNdWx0aURyYWdFbGVtZW50cygpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGRyYWdPdmVyOiBmdW5jdGlvbiBkcmFnT3ZlcihfcmVmOCkge1xuICAgICAgdmFyIHRhcmdldCA9IF9yZWY4LnRhcmdldCxcbiAgICAgICAgY29tcGxldGVkID0gX3JlZjguY29tcGxldGVkLFxuICAgICAgICBjYW5jZWwgPSBfcmVmOC5jYW5jZWw7XG4gICAgICBpZiAoZm9sZGluZyAmJiB+bXVsdGlEcmFnRWxlbWVudHMuaW5kZXhPZih0YXJnZXQpKSB7XG4gICAgICAgIGNvbXBsZXRlZChmYWxzZSk7XG4gICAgICAgIGNhbmNlbCgpO1xuICAgICAgfVxuICAgIH0sXG4gICAgcmV2ZXJ0OiBmdW5jdGlvbiByZXZlcnQoX3JlZjkpIHtcbiAgICAgIHZhciBmcm9tU29ydGFibGUgPSBfcmVmOS5mcm9tU29ydGFibGUsXG4gICAgICAgIHJvb3RFbCA9IF9yZWY5LnJvb3RFbCxcbiAgICAgICAgc29ydGFibGUgPSBfcmVmOS5zb3J0YWJsZSxcbiAgICAgICAgZHJhZ1JlY3QgPSBfcmVmOS5kcmFnUmVjdDtcbiAgICAgIGlmIChtdWx0aURyYWdFbGVtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIC8vIFNldHVwIHVuZm9sZCBhbmltYXRpb25cbiAgICAgICAgbXVsdGlEcmFnRWxlbWVudHMuZm9yRWFjaChmdW5jdGlvbiAobXVsdGlEcmFnRWxlbWVudCkge1xuICAgICAgICAgIHNvcnRhYmxlLmFkZEFuaW1hdGlvblN0YXRlKHtcbiAgICAgICAgICAgIHRhcmdldDogbXVsdGlEcmFnRWxlbWVudCxcbiAgICAgICAgICAgIHJlY3Q6IGZvbGRpbmcgPyBnZXRSZWN0KG11bHRpRHJhZ0VsZW1lbnQpIDogZHJhZ1JlY3RcbiAgICAgICAgICB9KTtcbiAgICAgICAgICB1bnNldFJlY3QobXVsdGlEcmFnRWxlbWVudCk7XG4gICAgICAgICAgbXVsdGlEcmFnRWxlbWVudC5mcm9tUmVjdCA9IGRyYWdSZWN0O1xuICAgICAgICAgIGZyb21Tb3J0YWJsZS5yZW1vdmVBbmltYXRpb25TdGF0ZShtdWx0aURyYWdFbGVtZW50KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGZvbGRpbmcgPSBmYWxzZTtcbiAgICAgICAgaW5zZXJ0TXVsdGlEcmFnRWxlbWVudHMoIXRoaXMub3B0aW9ucy5yZW1vdmVDbG9uZU9uSGlkZSwgcm9vdEVsKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGRyYWdPdmVyQ29tcGxldGVkOiBmdW5jdGlvbiBkcmFnT3ZlckNvbXBsZXRlZChfcmVmMTApIHtcbiAgICAgIHZhciBzb3J0YWJsZSA9IF9yZWYxMC5zb3J0YWJsZSxcbiAgICAgICAgaXNPd25lciA9IF9yZWYxMC5pc093bmVyLFxuICAgICAgICBpbnNlcnRpb24gPSBfcmVmMTAuaW5zZXJ0aW9uLFxuICAgICAgICBhY3RpdmVTb3J0YWJsZSA9IF9yZWYxMC5hY3RpdmVTb3J0YWJsZSxcbiAgICAgICAgcGFyZW50RWwgPSBfcmVmMTAucGFyZW50RWwsXG4gICAgICAgIHB1dFNvcnRhYmxlID0gX3JlZjEwLnB1dFNvcnRhYmxlO1xuICAgICAgdmFyIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG4gICAgICBpZiAoaW5zZXJ0aW9uKSB7XG4gICAgICAgIC8vIENsb25lcyBtdXN0IGJlIGhpZGRlbiBiZWZvcmUgZm9sZGluZyBhbmltYXRpb24gdG8gY2FwdHVyZSBkcmFnUmVjdEFic29sdXRlIHByb3Blcmx5XG4gICAgICAgIGlmIChpc093bmVyKSB7XG4gICAgICAgICAgYWN0aXZlU29ydGFibGUuX2hpZGVDbG9uZSgpO1xuICAgICAgICB9XG4gICAgICAgIGluaXRpYWxGb2xkaW5nID0gZmFsc2U7XG4gICAgICAgIC8vIElmIGxlYXZpbmcgc29ydDpmYWxzZSByb290LCBvciBhbHJlYWR5IGZvbGRpbmcgLSBGb2xkIHRvIG5ldyBsb2NhdGlvblxuICAgICAgICBpZiAob3B0aW9ucy5hbmltYXRpb24gJiYgbXVsdGlEcmFnRWxlbWVudHMubGVuZ3RoID4gMSAmJiAoZm9sZGluZyB8fCAhaXNPd25lciAmJiAhYWN0aXZlU29ydGFibGUub3B0aW9ucy5zb3J0ICYmICFwdXRTb3J0YWJsZSkpIHtcbiAgICAgICAgICAvLyBGb2xkOiBTZXQgYWxsIG11bHRpIGRyYWcgZWxlbWVudHMncyByZWN0cyB0byBkcmFnRWwncyByZWN0IHdoZW4gbXVsdGktZHJhZyBlbGVtZW50cyBhcmUgaW52aXNpYmxlXG4gICAgICAgICAgdmFyIGRyYWdSZWN0QWJzb2x1dGUgPSBnZXRSZWN0KGRyYWdFbCQxLCBmYWxzZSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgICAgICAgbXVsdGlEcmFnRWxlbWVudHMuZm9yRWFjaChmdW5jdGlvbiAobXVsdGlEcmFnRWxlbWVudCkge1xuICAgICAgICAgICAgaWYgKG11bHRpRHJhZ0VsZW1lbnQgPT09IGRyYWdFbCQxKSByZXR1cm47XG4gICAgICAgICAgICBzZXRSZWN0KG11bHRpRHJhZ0VsZW1lbnQsIGRyYWdSZWN0QWJzb2x1dGUpO1xuXG4gICAgICAgICAgICAvLyBNb3ZlIGVsZW1lbnQocykgdG8gZW5kIG9mIHBhcmVudEVsIHNvIHRoYXQgaXQgZG9lcyBub3QgaW50ZXJmZXJlIHdpdGggbXVsdGktZHJhZyBjbG9uZXMgaW5zZXJ0aW9uIGlmIHRoZXkgYXJlIGluc2VydGVkXG4gICAgICAgICAgICAvLyB3aGlsZSBmb2xkaW5nLCBhbmQgc28gdGhhdCB3ZSBjYW4gY2FwdHVyZSB0aGVtIGFnYWluIGJlY2F1c2Ugb2xkIHNvcnRhYmxlIHdpbGwgbm8gbG9uZ2VyIGJlIGZyb21Tb3J0YWJsZVxuICAgICAgICAgICAgcGFyZW50RWwuYXBwZW5kQ2hpbGQobXVsdGlEcmFnRWxlbWVudCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgZm9sZGluZyA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDbG9uZXMgbXVzdCBiZSBzaG93biAoYW5kIGNoZWNrIHRvIHJlbW92ZSBtdWx0aSBkcmFncykgYWZ0ZXIgZm9sZGluZyB3aGVuIGludGVyZmVyaW5nIG11bHRpRHJhZ0VsZW1lbnRzIGFyZSBtb3ZlZCBvdXRcbiAgICAgICAgaWYgKCFpc093bmVyKSB7XG4gICAgICAgICAgLy8gT25seSByZW1vdmUgaWYgbm90IGZvbGRpbmcgKGZvbGRpbmcgd2lsbCByZW1vdmUgdGhlbSBhbnl3YXlzKVxuICAgICAgICAgIGlmICghZm9sZGluZykge1xuICAgICAgICAgICAgcmVtb3ZlTXVsdGlEcmFnRWxlbWVudHMoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG11bHRpRHJhZ0VsZW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIHZhciBjbG9uZXNIaWRkZW5CZWZvcmUgPSBjbG9uZXNIaWRkZW47XG4gICAgICAgICAgICBhY3RpdmVTb3J0YWJsZS5fc2hvd0Nsb25lKHNvcnRhYmxlKTtcblxuICAgICAgICAgICAgLy8gVW5mb2xkIGFuaW1hdGlvbiBmb3IgY2xvbmVzIGlmIHNob3dpbmcgZnJvbSBoaWRkZW5cbiAgICAgICAgICAgIGlmIChhY3RpdmVTb3J0YWJsZS5vcHRpb25zLmFuaW1hdGlvbiAmJiAhY2xvbmVzSGlkZGVuICYmIGNsb25lc0hpZGRlbkJlZm9yZSkge1xuICAgICAgICAgICAgICBtdWx0aURyYWdDbG9uZXMuZm9yRWFjaChmdW5jdGlvbiAoY2xvbmUpIHtcbiAgICAgICAgICAgICAgICBhY3RpdmVTb3J0YWJsZS5hZGRBbmltYXRpb25TdGF0ZSh7XG4gICAgICAgICAgICAgICAgICB0YXJnZXQ6IGNsb25lLFxuICAgICAgICAgICAgICAgICAgcmVjdDogY2xvbmVzRnJvbVJlY3RcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjbG9uZS5mcm9tUmVjdCA9IGNsb25lc0Zyb21SZWN0O1xuICAgICAgICAgICAgICAgIGNsb25lLnRoaXNBbmltYXRpb25EdXJhdGlvbiA9IG51bGw7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhY3RpdmVTb3J0YWJsZS5fc2hvd0Nsb25lKHNvcnRhYmxlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIGRyYWdPdmVyQW5pbWF0aW9uQ2FwdHVyZTogZnVuY3Rpb24gZHJhZ092ZXJBbmltYXRpb25DYXB0dXJlKF9yZWYxMSkge1xuICAgICAgdmFyIGRyYWdSZWN0ID0gX3JlZjExLmRyYWdSZWN0LFxuICAgICAgICBpc093bmVyID0gX3JlZjExLmlzT3duZXIsXG4gICAgICAgIGFjdGl2ZVNvcnRhYmxlID0gX3JlZjExLmFjdGl2ZVNvcnRhYmxlO1xuICAgICAgbXVsdGlEcmFnRWxlbWVudHMuZm9yRWFjaChmdW5jdGlvbiAobXVsdGlEcmFnRWxlbWVudCkge1xuICAgICAgICBtdWx0aURyYWdFbGVtZW50LnRoaXNBbmltYXRpb25EdXJhdGlvbiA9IG51bGw7XG4gICAgICB9KTtcbiAgICAgIGlmIChhY3RpdmVTb3J0YWJsZS5vcHRpb25zLmFuaW1hdGlvbiAmJiAhaXNPd25lciAmJiBhY3RpdmVTb3J0YWJsZS5tdWx0aURyYWcuaXNNdWx0aURyYWcpIHtcbiAgICAgICAgY2xvbmVzRnJvbVJlY3QgPSBfZXh0ZW5kcyh7fSwgZHJhZ1JlY3QpO1xuICAgICAgICB2YXIgZHJhZ01hdHJpeCA9IG1hdHJpeChkcmFnRWwkMSwgdHJ1ZSk7XG4gICAgICAgIGNsb25lc0Zyb21SZWN0LnRvcCAtPSBkcmFnTWF0cml4LmY7XG4gICAgICAgIGNsb25lc0Zyb21SZWN0LmxlZnQgLT0gZHJhZ01hdHJpeC5lO1xuICAgICAgfVxuICAgIH0sXG4gICAgZHJhZ092ZXJBbmltYXRpb25Db21wbGV0ZTogZnVuY3Rpb24gZHJhZ092ZXJBbmltYXRpb25Db21wbGV0ZSgpIHtcbiAgICAgIGlmIChmb2xkaW5nKSB7XG4gICAgICAgIGZvbGRpbmcgPSBmYWxzZTtcbiAgICAgICAgcmVtb3ZlTXVsdGlEcmFnRWxlbWVudHMoKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGRyb3A6IGZ1bmN0aW9uIGRyb3AoX3JlZjEyKSB7XG4gICAgICB2YXIgZXZ0ID0gX3JlZjEyLm9yaWdpbmFsRXZlbnQsXG4gICAgICAgIHJvb3RFbCA9IF9yZWYxMi5yb290RWwsXG4gICAgICAgIHBhcmVudEVsID0gX3JlZjEyLnBhcmVudEVsLFxuICAgICAgICBzb3J0YWJsZSA9IF9yZWYxMi5zb3J0YWJsZSxcbiAgICAgICAgZGlzcGF0Y2hTb3J0YWJsZUV2ZW50ID0gX3JlZjEyLmRpc3BhdGNoU29ydGFibGVFdmVudCxcbiAgICAgICAgb2xkSW5kZXggPSBfcmVmMTIub2xkSW5kZXgsXG4gICAgICAgIHB1dFNvcnRhYmxlID0gX3JlZjEyLnB1dFNvcnRhYmxlO1xuICAgICAgdmFyIHRvU29ydGFibGUgPSBwdXRTb3J0YWJsZSB8fCB0aGlzLnNvcnRhYmxlO1xuICAgICAgaWYgKCFldnQpIHJldHVybjtcbiAgICAgIHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zLFxuICAgICAgICBjaGlsZHJlbiA9IHBhcmVudEVsLmNoaWxkcmVuO1xuXG4gICAgICAvLyBNdWx0aS1kcmFnIHNlbGVjdGlvblxuICAgICAgaWYgKCFkcmFnU3RhcnRlZCkge1xuICAgICAgICBpZiAob3B0aW9ucy5tdWx0aURyYWdLZXkgJiYgIXRoaXMubXVsdGlEcmFnS2V5RG93bikge1xuICAgICAgICAgIHRoaXMuX2Rlc2VsZWN0TXVsdGlEcmFnKCk7XG4gICAgICAgIH1cbiAgICAgICAgdG9nZ2xlQ2xhc3MoZHJhZ0VsJDEsIG9wdGlvbnMuc2VsZWN0ZWRDbGFzcywgIX5tdWx0aURyYWdFbGVtZW50cy5pbmRleE9mKGRyYWdFbCQxKSk7XG4gICAgICAgIGlmICghfm11bHRpRHJhZ0VsZW1lbnRzLmluZGV4T2YoZHJhZ0VsJDEpKSB7XG4gICAgICAgICAgbXVsdGlEcmFnRWxlbWVudHMucHVzaChkcmFnRWwkMSk7XG4gICAgICAgICAgZGlzcGF0Y2hFdmVudCh7XG4gICAgICAgICAgICBzb3J0YWJsZTogc29ydGFibGUsXG4gICAgICAgICAgICByb290RWw6IHJvb3RFbCxcbiAgICAgICAgICAgIG5hbWU6ICdzZWxlY3QnLFxuICAgICAgICAgICAgdGFyZ2V0RWw6IGRyYWdFbCQxLFxuICAgICAgICAgICAgb3JpZ2luYWxFdmVudDogZXZ0XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICAvLyBNb2RpZmllciBhY3RpdmF0ZWQsIHNlbGVjdCBmcm9tIGxhc3QgdG8gZHJhZ0VsXG4gICAgICAgICAgaWYgKGV2dC5zaGlmdEtleSAmJiBsYXN0TXVsdGlEcmFnU2VsZWN0ICYmIHNvcnRhYmxlLmVsLmNvbnRhaW5zKGxhc3RNdWx0aURyYWdTZWxlY3QpKSB7XG4gICAgICAgICAgICB2YXIgbGFzdEluZGV4ID0gaW5kZXgobGFzdE11bHRpRHJhZ1NlbGVjdCksXG4gICAgICAgICAgICAgIGN1cnJlbnRJbmRleCA9IGluZGV4KGRyYWdFbCQxKTtcbiAgICAgICAgICAgIGlmICh+bGFzdEluZGV4ICYmIH5jdXJyZW50SW5kZXggJiYgbGFzdEluZGV4ICE9PSBjdXJyZW50SW5kZXgpIHtcbiAgICAgICAgICAgICAgKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyBNdXN0IGluY2x1ZGUgbGFzdE11bHRpRHJhZ1NlbGVjdCAoc2VsZWN0IGl0KSwgaW4gY2FzZSBtb2RpZmllZCBzZWxlY3Rpb24gZnJvbSBubyBzZWxlY3Rpb25cbiAgICAgICAgICAgICAgICAvLyAoYnV0IHByZXZpb3VzIHNlbGVjdGlvbiBleGlzdGVkKVxuICAgICAgICAgICAgICAgIHZhciBuLCBpO1xuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50SW5kZXggPiBsYXN0SW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgIGkgPSBsYXN0SW5kZXg7XG4gICAgICAgICAgICAgICAgICBuID0gY3VycmVudEluZGV4O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBpID0gY3VycmVudEluZGV4O1xuICAgICAgICAgICAgICAgICAgbiA9IGxhc3RJbmRleCArIDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBmaWx0ZXIgPSBvcHRpb25zLmZpbHRlcjtcbiAgICAgICAgICAgICAgICBmb3IgKDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgICAgICAgaWYgKH5tdWx0aURyYWdFbGVtZW50cy5pbmRleE9mKGNoaWxkcmVuW2ldKSkgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAvLyBDaGVjayBpZiBlbGVtZW50IGlzIGRyYWdnYWJsZVxuICAgICAgICAgICAgICAgICAgaWYgKCFjbG9zZXN0KGNoaWxkcmVuW2ldLCBvcHRpb25zLmRyYWdnYWJsZSwgcGFyZW50RWwsIGZhbHNlKSkgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAvLyBDaGVjayBpZiBlbGVtZW50IGlzIGZpbHRlcmVkXG4gICAgICAgICAgICAgICAgICB2YXIgZmlsdGVyZWQgPSBmaWx0ZXIgJiYgKHR5cGVvZiBmaWx0ZXIgPT09ICdmdW5jdGlvbicgPyBmaWx0ZXIuY2FsbChzb3J0YWJsZSwgZXZ0LCBjaGlsZHJlbltpXSwgc29ydGFibGUpIDogZmlsdGVyLnNwbGl0KCcsJykuc29tZShmdW5jdGlvbiAoY3JpdGVyaWEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNsb3Nlc3QoY2hpbGRyZW5baV0sIGNyaXRlcmlhLnRyaW0oKSwgcGFyZW50RWwsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICAgIGlmIChmaWx0ZXJlZCkgY29udGludWU7XG4gICAgICAgICAgICAgICAgICB0b2dnbGVDbGFzcyhjaGlsZHJlbltpXSwgb3B0aW9ucy5zZWxlY3RlZENsYXNzLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgIG11bHRpRHJhZ0VsZW1lbnRzLnB1c2goY2hpbGRyZW5baV0pO1xuICAgICAgICAgICAgICAgICAgZGlzcGF0Y2hFdmVudCh7XG4gICAgICAgICAgICAgICAgICAgIHNvcnRhYmxlOiBzb3J0YWJsZSxcbiAgICAgICAgICAgICAgICAgICAgcm9vdEVsOiByb290RWwsXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdzZWxlY3QnLFxuICAgICAgICAgICAgICAgICAgICB0YXJnZXRFbDogY2hpbGRyZW5baV0sXG4gICAgICAgICAgICAgICAgICAgIG9yaWdpbmFsRXZlbnQ6IGV2dFxuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsYXN0TXVsdGlEcmFnU2VsZWN0ID0gZHJhZ0VsJDE7XG4gICAgICAgICAgfVxuICAgICAgICAgIG11bHRpRHJhZ1NvcnRhYmxlID0gdG9Tb3J0YWJsZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBtdWx0aURyYWdFbGVtZW50cy5zcGxpY2UobXVsdGlEcmFnRWxlbWVudHMuaW5kZXhPZihkcmFnRWwkMSksIDEpO1xuICAgICAgICAgIGxhc3RNdWx0aURyYWdTZWxlY3QgPSBudWxsO1xuICAgICAgICAgIGRpc3BhdGNoRXZlbnQoe1xuICAgICAgICAgICAgc29ydGFibGU6IHNvcnRhYmxlLFxuICAgICAgICAgICAgcm9vdEVsOiByb290RWwsXG4gICAgICAgICAgICBuYW1lOiAnZGVzZWxlY3QnLFxuICAgICAgICAgICAgdGFyZ2V0RWw6IGRyYWdFbCQxLFxuICAgICAgICAgICAgb3JpZ2luYWxFdmVudDogZXZ0XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gTXVsdGktZHJhZyBkcm9wXG4gICAgICBpZiAoZHJhZ1N0YXJ0ZWQgJiYgdGhpcy5pc011bHRpRHJhZykge1xuICAgICAgICBmb2xkaW5nID0gZmFsc2U7XG4gICAgICAgIC8vIERvIG5vdCBcInVuZm9sZFwiIGFmdGVyIGFyb3VuZCBkcmFnRWwgaWYgcmV2ZXJ0ZWRcbiAgICAgICAgaWYgKChwYXJlbnRFbFtleHBhbmRvXS5vcHRpb25zLnNvcnQgfHwgcGFyZW50RWwgIT09IHJvb3RFbCkgJiYgbXVsdGlEcmFnRWxlbWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICAgIHZhciBkcmFnUmVjdCA9IGdldFJlY3QoZHJhZ0VsJDEpLFxuICAgICAgICAgICAgbXVsdGlEcmFnSW5kZXggPSBpbmRleChkcmFnRWwkMSwgJzpub3QoLicgKyB0aGlzLm9wdGlvbnMuc2VsZWN0ZWRDbGFzcyArICcpJyk7XG4gICAgICAgICAgaWYgKCFpbml0aWFsRm9sZGluZyAmJiBvcHRpb25zLmFuaW1hdGlvbikgZHJhZ0VsJDEudGhpc0FuaW1hdGlvbkR1cmF0aW9uID0gbnVsbDtcbiAgICAgICAgICB0b1NvcnRhYmxlLmNhcHR1cmVBbmltYXRpb25TdGF0ZSgpO1xuICAgICAgICAgIGlmICghaW5pdGlhbEZvbGRpbmcpIHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmFuaW1hdGlvbikge1xuICAgICAgICAgICAgICBkcmFnRWwkMS5mcm9tUmVjdCA9IGRyYWdSZWN0O1xuICAgICAgICAgICAgICBtdWx0aURyYWdFbGVtZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChtdWx0aURyYWdFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgbXVsdGlEcmFnRWxlbWVudC50aGlzQW5pbWF0aW9uRHVyYXRpb24gPSBudWxsO1xuICAgICAgICAgICAgICAgIGlmIChtdWx0aURyYWdFbGVtZW50ICE9PSBkcmFnRWwkMSkge1xuICAgICAgICAgICAgICAgICAgdmFyIHJlY3QgPSBmb2xkaW5nID8gZ2V0UmVjdChtdWx0aURyYWdFbGVtZW50KSA6IGRyYWdSZWN0O1xuICAgICAgICAgICAgICAgICAgbXVsdGlEcmFnRWxlbWVudC5mcm9tUmVjdCA9IHJlY3Q7XG5cbiAgICAgICAgICAgICAgICAgIC8vIFByZXBhcmUgdW5mb2xkIGFuaW1hdGlvblxuICAgICAgICAgICAgICAgICAgdG9Tb3J0YWJsZS5hZGRBbmltYXRpb25TdGF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldDogbXVsdGlEcmFnRWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgcmVjdDogcmVjdFxuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTXVsdGkgZHJhZyBlbGVtZW50cyBhcmUgbm90IG5lY2Vzc2FyaWx5IHJlbW92ZWQgZnJvbSB0aGUgRE9NIG9uIGRyb3AsIHNvIHRvIHJlaW5zZXJ0XG4gICAgICAgICAgICAvLyBwcm9wZXJseSB0aGV5IG11c3QgYWxsIGJlIHJlbW92ZWRcbiAgICAgICAgICAgIHJlbW92ZU11bHRpRHJhZ0VsZW1lbnRzKCk7XG4gICAgICAgICAgICBtdWx0aURyYWdFbGVtZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChtdWx0aURyYWdFbGVtZW50KSB7XG4gICAgICAgICAgICAgIGlmIChjaGlsZHJlblttdWx0aURyYWdJbmRleF0pIHtcbiAgICAgICAgICAgICAgICBwYXJlbnRFbC5pbnNlcnRCZWZvcmUobXVsdGlEcmFnRWxlbWVudCwgY2hpbGRyZW5bbXVsdGlEcmFnSW5kZXhdKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwYXJlbnRFbC5hcHBlbmRDaGlsZChtdWx0aURyYWdFbGVtZW50KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBtdWx0aURyYWdJbmRleCsrO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIElmIGluaXRpYWwgZm9sZGluZyBpcyBkb25lLCB0aGUgZWxlbWVudHMgbWF5IGhhdmUgY2hhbmdlZCBwb3NpdGlvbiBiZWNhdXNlIHRoZXkgYXJlIG5vd1xuICAgICAgICAgICAgLy8gdW5mb2xkaW5nIGFyb3VuZCBkcmFnRWwsIGV2ZW4gdGhvdWdoIGRyYWdFbCBtYXkgbm90IGhhdmUgaGlzIGluZGV4IGNoYW5nZWQsIHNvIHVwZGF0ZSBldmVudFxuICAgICAgICAgICAgLy8gbXVzdCBiZSBmaXJlZCBoZXJlIGFzIFNvcnRhYmxlIHdpbGwgbm90LlxuICAgICAgICAgICAgaWYgKG9sZEluZGV4ID09PSBpbmRleChkcmFnRWwkMSkpIHtcbiAgICAgICAgICAgICAgdmFyIHVwZGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICBtdWx0aURyYWdFbGVtZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChtdWx0aURyYWdFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKG11bHRpRHJhZ0VsZW1lbnQuc29ydGFibGVJbmRleCAhPT0gaW5kZXgobXVsdGlEcmFnRWxlbWVudCkpIHtcbiAgICAgICAgICAgICAgICAgIHVwZGF0ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgaWYgKHVwZGF0ZSkge1xuICAgICAgICAgICAgICAgIGRpc3BhdGNoU29ydGFibGVFdmVudCgndXBkYXRlJyk7XG4gICAgICAgICAgICAgICAgZGlzcGF0Y2hTb3J0YWJsZUV2ZW50KCdzb3J0Jyk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBNdXN0IGJlIGRvbmUgYWZ0ZXIgY2FwdHVyaW5nIGluZGl2aWR1YWwgcmVjdHMgKHNjcm9sbCBiYXIpXG4gICAgICAgICAgbXVsdGlEcmFnRWxlbWVudHMuZm9yRWFjaChmdW5jdGlvbiAobXVsdGlEcmFnRWxlbWVudCkge1xuICAgICAgICAgICAgdW5zZXRSZWN0KG11bHRpRHJhZ0VsZW1lbnQpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHRvU29ydGFibGUuYW5pbWF0ZUFsbCgpO1xuICAgICAgICB9XG4gICAgICAgIG11bHRpRHJhZ1NvcnRhYmxlID0gdG9Tb3J0YWJsZTtcbiAgICAgIH1cblxuICAgICAgLy8gUmVtb3ZlIGNsb25lcyBpZiBuZWNlc3NhcnlcbiAgICAgIGlmIChyb290RWwgPT09IHBhcmVudEVsIHx8IHB1dFNvcnRhYmxlICYmIHB1dFNvcnRhYmxlLmxhc3RQdXRNb2RlICE9PSAnY2xvbmUnKSB7XG4gICAgICAgIG11bHRpRHJhZ0Nsb25lcy5mb3JFYWNoKGZ1bmN0aW9uIChjbG9uZSkge1xuICAgICAgICAgIGNsb25lLnBhcmVudE5vZGUgJiYgY2xvbmUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChjbG9uZSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0sXG4gICAgbnVsbGluZ0dsb2JhbDogZnVuY3Rpb24gbnVsbGluZ0dsb2JhbCgpIHtcbiAgICAgIHRoaXMuaXNNdWx0aURyYWcgPSBkcmFnU3RhcnRlZCA9IGZhbHNlO1xuICAgICAgbXVsdGlEcmFnQ2xvbmVzLmxlbmd0aCA9IDA7XG4gICAgfSxcbiAgICBkZXN0cm95R2xvYmFsOiBmdW5jdGlvbiBkZXN0cm95R2xvYmFsKCkge1xuICAgICAgdGhpcy5fZGVzZWxlY3RNdWx0aURyYWcoKTtcbiAgICAgIG9mZihkb2N1bWVudCwgJ3BvaW50ZXJ1cCcsIHRoaXMuX2Rlc2VsZWN0TXVsdGlEcmFnKTtcbiAgICAgIG9mZihkb2N1bWVudCwgJ21vdXNldXAnLCB0aGlzLl9kZXNlbGVjdE11bHRpRHJhZyk7XG4gICAgICBvZmYoZG9jdW1lbnQsICd0b3VjaGVuZCcsIHRoaXMuX2Rlc2VsZWN0TXVsdGlEcmFnKTtcbiAgICAgIG9mZihkb2N1bWVudCwgJ2tleWRvd24nLCB0aGlzLl9jaGVja0tleURvd24pO1xuICAgICAgb2ZmKGRvY3VtZW50LCAna2V5dXAnLCB0aGlzLl9jaGVja0tleVVwKTtcbiAgICB9LFxuICAgIF9kZXNlbGVjdE11bHRpRHJhZzogZnVuY3Rpb24gX2Rlc2VsZWN0TXVsdGlEcmFnKGV2dCkge1xuICAgICAgaWYgKHR5cGVvZiBkcmFnU3RhcnRlZCAhPT0gXCJ1bmRlZmluZWRcIiAmJiBkcmFnU3RhcnRlZCkgcmV0dXJuO1xuXG4gICAgICAvLyBPbmx5IGRlc2VsZWN0IGlmIHNlbGVjdGlvbiBpcyBpbiB0aGlzIHNvcnRhYmxlXG4gICAgICBpZiAobXVsdGlEcmFnU29ydGFibGUgIT09IHRoaXMuc29ydGFibGUpIHJldHVybjtcblxuICAgICAgLy8gT25seSBkZXNlbGVjdCBpZiB0YXJnZXQgaXMgbm90IGl0ZW0gaW4gdGhpcyBzb3J0YWJsZVxuICAgICAgaWYgKGV2dCAmJiBjbG9zZXN0KGV2dC50YXJnZXQsIHRoaXMub3B0aW9ucy5kcmFnZ2FibGUsIHRoaXMuc29ydGFibGUuZWwsIGZhbHNlKSkgcmV0dXJuO1xuXG4gICAgICAvLyBPbmx5IGRlc2VsZWN0IGlmIGxlZnQgY2xpY2tcbiAgICAgIGlmIChldnQgJiYgZXZ0LmJ1dHRvbiAhPT0gMCkgcmV0dXJuO1xuICAgICAgd2hpbGUgKG11bHRpRHJhZ0VsZW1lbnRzLmxlbmd0aCkge1xuICAgICAgICB2YXIgZWwgPSBtdWx0aURyYWdFbGVtZW50c1swXTtcbiAgICAgICAgdG9nZ2xlQ2xhc3MoZWwsIHRoaXMub3B0aW9ucy5zZWxlY3RlZENsYXNzLCBmYWxzZSk7XG4gICAgICAgIG11bHRpRHJhZ0VsZW1lbnRzLnNoaWZ0KCk7XG4gICAgICAgIGRpc3BhdGNoRXZlbnQoe1xuICAgICAgICAgIHNvcnRhYmxlOiB0aGlzLnNvcnRhYmxlLFxuICAgICAgICAgIHJvb3RFbDogdGhpcy5zb3J0YWJsZS5lbCxcbiAgICAgICAgICBuYW1lOiAnZGVzZWxlY3QnLFxuICAgICAgICAgIHRhcmdldEVsOiBlbCxcbiAgICAgICAgICBvcmlnaW5hbEV2ZW50OiBldnRcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBfY2hlY2tLZXlEb3duOiBmdW5jdGlvbiBfY2hlY2tLZXlEb3duKGV2dCkge1xuICAgICAgaWYgKGV2dC5rZXkgPT09IHRoaXMub3B0aW9ucy5tdWx0aURyYWdLZXkpIHtcbiAgICAgICAgdGhpcy5tdWx0aURyYWdLZXlEb3duID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9LFxuICAgIF9jaGVja0tleVVwOiBmdW5jdGlvbiBfY2hlY2tLZXlVcChldnQpIHtcbiAgICAgIGlmIChldnQua2V5ID09PSB0aGlzLm9wdGlvbnMubXVsdGlEcmFnS2V5KSB7XG4gICAgICAgIHRoaXMubXVsdGlEcmFnS2V5RG93biA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgcmV0dXJuIF9leHRlbmRzKE11bHRpRHJhZywge1xuICAgIC8vIFN0YXRpYyBtZXRob2RzICYgcHJvcGVydGllc1xuICAgIHBsdWdpbk5hbWU6ICdtdWx0aURyYWcnLFxuICAgIHV0aWxzOiB7XG4gICAgICAvKipcclxuICAgICAgICogU2VsZWN0cyB0aGUgcHJvdmlkZWQgbXVsdGktZHJhZyBpdGVtXHJcbiAgICAgICAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBlbCAgICBUaGUgZWxlbWVudCB0byBiZSBzZWxlY3RlZFxyXG4gICAgICAgKi9cbiAgICAgIHNlbGVjdDogZnVuY3Rpb24gc2VsZWN0KGVsKSB7XG4gICAgICAgIHZhciBzb3J0YWJsZSA9IGVsLnBhcmVudE5vZGVbZXhwYW5kb107XG4gICAgICAgIGlmICghc29ydGFibGUgfHwgIXNvcnRhYmxlLm9wdGlvbnMubXVsdGlEcmFnIHx8IH5tdWx0aURyYWdFbGVtZW50cy5pbmRleE9mKGVsKSkgcmV0dXJuO1xuICAgICAgICBpZiAobXVsdGlEcmFnU29ydGFibGUgJiYgbXVsdGlEcmFnU29ydGFibGUgIT09IHNvcnRhYmxlKSB7XG4gICAgICAgICAgbXVsdGlEcmFnU29ydGFibGUubXVsdGlEcmFnLl9kZXNlbGVjdE11bHRpRHJhZygpO1xuICAgICAgICAgIG11bHRpRHJhZ1NvcnRhYmxlID0gc29ydGFibGU7XG4gICAgICAgIH1cbiAgICAgICAgdG9nZ2xlQ2xhc3MoZWwsIHNvcnRhYmxlLm9wdGlvbnMuc2VsZWN0ZWRDbGFzcywgdHJ1ZSk7XG4gICAgICAgIG11bHRpRHJhZ0VsZW1lbnRzLnB1c2goZWwpO1xuICAgICAgfSxcbiAgICAgIC8qKlxyXG4gICAgICAgKiBEZXNlbGVjdHMgdGhlIHByb3ZpZGVkIG11bHRpLWRyYWcgaXRlbVxyXG4gICAgICAgKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWwgICAgVGhlIGVsZW1lbnQgdG8gYmUgZGVzZWxlY3RlZFxyXG4gICAgICAgKi9cbiAgICAgIGRlc2VsZWN0OiBmdW5jdGlvbiBkZXNlbGVjdChlbCkge1xuICAgICAgICB2YXIgc29ydGFibGUgPSBlbC5wYXJlbnROb2RlW2V4cGFuZG9dLFxuICAgICAgICAgIGluZGV4ID0gbXVsdGlEcmFnRWxlbWVudHMuaW5kZXhPZihlbCk7XG4gICAgICAgIGlmICghc29ydGFibGUgfHwgIXNvcnRhYmxlLm9wdGlvbnMubXVsdGlEcmFnIHx8ICF+aW5kZXgpIHJldHVybjtcbiAgICAgICAgdG9nZ2xlQ2xhc3MoZWwsIHNvcnRhYmxlLm9wdGlvbnMuc2VsZWN0ZWRDbGFzcywgZmFsc2UpO1xuICAgICAgICBtdWx0aURyYWdFbGVtZW50cy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgfVxuICAgIH0sXG4gICAgZXZlbnRQcm9wZXJ0aWVzOiBmdW5jdGlvbiBldmVudFByb3BlcnRpZXMoKSB7XG4gICAgICB2YXIgX3RoaXMzID0gdGhpcztcbiAgICAgIHZhciBvbGRJbmRpY2llcyA9IFtdLFxuICAgICAgICBuZXdJbmRpY2llcyA9IFtdO1xuICAgICAgbXVsdGlEcmFnRWxlbWVudHMuZm9yRWFjaChmdW5jdGlvbiAobXVsdGlEcmFnRWxlbWVudCkge1xuICAgICAgICBvbGRJbmRpY2llcy5wdXNoKHtcbiAgICAgICAgICBtdWx0aURyYWdFbGVtZW50OiBtdWx0aURyYWdFbGVtZW50LFxuICAgICAgICAgIGluZGV4OiBtdWx0aURyYWdFbGVtZW50LnNvcnRhYmxlSW5kZXhcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gbXVsdGlEcmFnRWxlbWVudHMgd2lsbCBhbHJlYWR5IGJlIHNvcnRlZCBpZiBmb2xkaW5nXG4gICAgICAgIHZhciBuZXdJbmRleDtcbiAgICAgICAgaWYgKGZvbGRpbmcgJiYgbXVsdGlEcmFnRWxlbWVudCAhPT0gZHJhZ0VsJDEpIHtcbiAgICAgICAgICBuZXdJbmRleCA9IC0xO1xuICAgICAgICB9IGVsc2UgaWYgKGZvbGRpbmcpIHtcbiAgICAgICAgICBuZXdJbmRleCA9IGluZGV4KG11bHRpRHJhZ0VsZW1lbnQsICc6bm90KC4nICsgX3RoaXMzLm9wdGlvbnMuc2VsZWN0ZWRDbGFzcyArICcpJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmV3SW5kZXggPSBpbmRleChtdWx0aURyYWdFbGVtZW50KTtcbiAgICAgICAgfVxuICAgICAgICBuZXdJbmRpY2llcy5wdXNoKHtcbiAgICAgICAgICBtdWx0aURyYWdFbGVtZW50OiBtdWx0aURyYWdFbGVtZW50LFxuICAgICAgICAgIGluZGV4OiBuZXdJbmRleFxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaXRlbXM6IF90b0NvbnN1bWFibGVBcnJheShtdWx0aURyYWdFbGVtZW50cyksXG4gICAgICAgIGNsb25lczogW10uY29uY2F0KG11bHRpRHJhZ0Nsb25lcyksXG4gICAgICAgIG9sZEluZGljaWVzOiBvbGRJbmRpY2llcyxcbiAgICAgICAgbmV3SW5kaWNpZXM6IG5ld0luZGljaWVzXG4gICAgICB9O1xuICAgIH0sXG4gICAgb3B0aW9uTGlzdGVuZXJzOiB7XG4gICAgICBtdWx0aURyYWdLZXk6IGZ1bmN0aW9uIG11bHRpRHJhZ0tleShrZXkpIHtcbiAgICAgICAga2V5ID0ga2V5LnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGlmIChrZXkgPT09ICdjdHJsJykge1xuICAgICAgICAgIGtleSA9ICdDb250cm9sJztcbiAgICAgICAgfSBlbHNlIGlmIChrZXkubGVuZ3RoID4gMSkge1xuICAgICAgICAgIGtleSA9IGtleS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIGtleS5zdWJzdHIoMSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGtleTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xufVxuZnVuY3Rpb24gaW5zZXJ0TXVsdGlEcmFnRWxlbWVudHMoY2xvbmVzSW5zZXJ0ZWQsIHJvb3RFbCkge1xuICBtdWx0aURyYWdFbGVtZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChtdWx0aURyYWdFbGVtZW50LCBpKSB7XG4gICAgdmFyIHRhcmdldCA9IHJvb3RFbC5jaGlsZHJlblttdWx0aURyYWdFbGVtZW50LnNvcnRhYmxlSW5kZXggKyAoY2xvbmVzSW5zZXJ0ZWQgPyBOdW1iZXIoaSkgOiAwKV07XG4gICAgaWYgKHRhcmdldCkge1xuICAgICAgcm9vdEVsLmluc2VydEJlZm9yZShtdWx0aURyYWdFbGVtZW50LCB0YXJnZXQpO1xuICAgIH0gZWxzZSB7XG4gICAgICByb290RWwuYXBwZW5kQ2hpbGQobXVsdGlEcmFnRWxlbWVudCk7XG4gICAgfVxuICB9KTtcbn1cblxuLyoqXHJcbiAqIEluc2VydCBtdWx0aS1kcmFnIGNsb25lc1xyXG4gKiBAcGFyYW0gIHtbQm9vbGVhbl19IGVsZW1lbnRzSW5zZXJ0ZWQgIFdoZXRoZXIgdGhlIG11bHRpLWRyYWcgZWxlbWVudHMgYXJlIGluc2VydGVkXHJcbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSByb290RWxcclxuICovXG5mdW5jdGlvbiBpbnNlcnRNdWx0aURyYWdDbG9uZXMoZWxlbWVudHNJbnNlcnRlZCwgcm9vdEVsKSB7XG4gIG11bHRpRHJhZ0Nsb25lcy5mb3JFYWNoKGZ1bmN0aW9uIChjbG9uZSwgaSkge1xuICAgIHZhciB0YXJnZXQgPSByb290RWwuY2hpbGRyZW5bY2xvbmUuc29ydGFibGVJbmRleCArIChlbGVtZW50c0luc2VydGVkID8gTnVtYmVyKGkpIDogMCldO1xuICAgIGlmICh0YXJnZXQpIHtcbiAgICAgIHJvb3RFbC5pbnNlcnRCZWZvcmUoY2xvbmUsIHRhcmdldCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJvb3RFbC5hcHBlbmRDaGlsZChjbG9uZSk7XG4gICAgfVxuICB9KTtcbn1cbmZ1bmN0aW9uIHJlbW92ZU11bHRpRHJhZ0VsZW1lbnRzKCkge1xuICBtdWx0aURyYWdFbGVtZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChtdWx0aURyYWdFbGVtZW50KSB7XG4gICAgaWYgKG11bHRpRHJhZ0VsZW1lbnQgPT09IGRyYWdFbCQxKSByZXR1cm47XG4gICAgbXVsdGlEcmFnRWxlbWVudC5wYXJlbnROb2RlICYmIG11bHRpRHJhZ0VsZW1lbnQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChtdWx0aURyYWdFbGVtZW50KTtcbiAgfSk7XG59XG5cblNvcnRhYmxlLm1vdW50KG5ldyBBdXRvU2Nyb2xsUGx1Z2luKCkpO1xuU29ydGFibGUubW91bnQoUmVtb3ZlLCBSZXZlcnQpO1xuXG5leHBvcnQgZGVmYXVsdCBTb3J0YWJsZTtcbmV4cG9ydCB7IE11bHRpRHJhZ1BsdWdpbiBhcyBNdWx0aURyYWcsIFNvcnRhYmxlLCBTd2FwUGx1Z2luIGFzIFN3YXAgfTtcbiIsICJpbXBvcnQgU29ydGFibGUgZnJvbSAnc29ydGFibGVqcyc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChBbHBpbmUpIHtcbiAgICBBbHBpbmUuZGlyZWN0aXZlKCdyb2J1c3RhLXNvcnRhYmxlJywgKGVsLCB7IGV4cHJlc3Npb24gfSwgeyBldmFsdWF0ZUxhdGVyLCBjbGVhbnVwIH0pID0+IHtcbiAgICAgICAgY29uc3QgZXZhbHVhdGUgPSBldmFsdWF0ZUxhdGVyKGV4cHJlc3Npb24pO1xuXG4gICAgICAgIGNvbnN0IHNvcnRhYmxlID0gU29ydGFibGUuY3JlYXRlKGVsLCB7XG4gICAgICAgICAgICBhbmltYXRpb246IDE1MCxcbiAgICAgICAgICAgIGRhdGFJZEF0dHI6ICd4LXNvcnRhYmxlLWl0ZW0nLFxuICAgICAgICAgICAgaGFuZGxlOiAnLnJvYnVzdGEtc29ydGFibGUtaGFuZGxlJyxcbiAgICAgICAgICAgIG9uU29ydCgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzb3J0ZWRTdWJzZXQgPSBzb3J0YWJsZS50b0FycmF5KClcblxuICAgICAgICAgICAgICAgIGV2YWx1YXRlKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB7IGRhdGEsIGZpeGVkID0gW10gfSA9IHZhbHVlXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGRhdGEpKSByZXR1cm5cblxuICAgICAgICAgICAgICAgICAgICAvLyBTaXNpcGthbiBoYXNpbCB1cnV0YW4gYmFydSBrZSBwb3Npc2kgbGFtYSwgbWVuamFnYSBmaXhlZFxuICAgICAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gW11cbiAgICAgICAgICAgICAgICAgICAgbGV0IGkgPSAwLCBqID0gMFxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaSA8IGRhdGEubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZml4ZWQuaW5jbHVkZXMoZGF0YVtpXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChkYXRhW2ldKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChzb3J0ZWRTdWJzZXRbal0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaisrXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpKytcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSBvcmlnaW5hbCBkYXRhIGFycmF5IHNlY2FyYSBsYW5nc3VuZ1xuICAgICAgICAgICAgICAgICAgICBkYXRhLnNwbGljZSgwLCBkYXRhLmxlbmd0aCwgLi4ucmVzdWx0KVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIFRyaWdnZXIgZXZlbnQga2FsYXUgcGVybHVcbiAgICAgICAgICAgICAgICAgICAgZWwuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoJ3NvcnRlZCcsIHsgZGV0YWlsOiBbLi4uZGF0YV0gfSkpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vLyBSZWFrdGlmIHRlcmhhZGFwIGlzTG9hZGluZyAob3B0aW9uYWwpXG4gICAgICAgIGNvbnN0IHN0b3AgPSBBbHBpbmUuZWZmZWN0KCgpID0+IHtcbiAgICAgICAgICAgIGV2YWx1YXRlKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHNvcnRhYmxlLm9wdGlvbignZGlzYWJsZWQnLCAhIXZhbHVlPy5pc0xvYWRpbmcpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuXG4gICAgICAgIGNsZWFudXAoKCkgPT4ge1xuICAgICAgICAgICAgc3RvcCgpXG4gICAgICAgICAgICBzb3J0YWJsZS5kZXN0cm95KClcbiAgICAgICAgfSlcbiAgICB9KTtcbn1cbiIsICJpbXBvcnQgcmVzaXplZENvbHVtbiBmcm9tICcuL3Jlc2l6ZWQtY29sdW1uJ1xuaW1wb3J0IHNvcnRhYmxlIGZyb20gJy4vc29ydGFibGUnXG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2FscGluZTppbml0JywgKCkgPT4ge1xuICAgIEFscGluZS5wbHVnaW4oc29ydGFibGUpXG4gICAgQWxwaW5lLnBsdWdpbihyZXNpemVkQ29sdW1uKVxufSlcblxuXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWUsU0FBUix1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UyxDQUFDLFVBQVU7QUFDaEIsZ0JBQU0sRUFBRSxNQUFNLFFBQVEsQ0FBQyxFQUFFLElBQUk7QUFFN0IsY0FBSSxDQUFDLE1BQU0sUUFBUSxJQUFJO0FBQUc7QUFHMUIsY0FBSSxTQUFTLENBQUM7QUFDZCxjQUFJLElBQUksR0FBRyxJQUFJO0FBQ2YsaUJBQU8sSUFBSSxLQUFLLFFBQVE7QUFDcEIsZ0JBQUksTUFBTSxTQUFTLEtBQUssQ0FBQyxDQUFDLEdBQUc7QUFDekIscUJBQU8sS0FBSyxLQUFLLENBQUMsQ0FBQztBQUFBLFlBQ3ZCLE9BQU87QUFDSCxxQkFBTyxLQUFLLGFBQWEsQ0FBQyxDQUFDO0FBQzNCO0FBQUEsWUFDSjtBQUNBO0FBQUEsVUFDSjtBQUdBLGVBQUssT0FBTyxHQUFHLEtBQUssUUFBUSxHQUFHLE1BQU07QUFHckMsYUFBRyxjQUFjLElBQUksWUFBWSxVQUFVLEVBQUUsUUFBUSxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUMsQ0FBQztBQUFBLFFBQ3JFLENBQUM7QUFBQSxNQUNMO0FBQUEsSUFDSixDQUFDO0FBR0QsVUFBTSxPQUFPQSxRQUFPLE9BQU8sTUFBTTtBQUM3QixlQUFTLENBQUMsVUFBVTtBQUNoQixpQkFBUyxPQUFPLFlBQVksQ0FBQyxDQUFDLE9BQU8sU0FBUztBQUFBLE1BQ2xELENBQUM7QUFBQSxJQUNMLENBQUM7QUFFRCxZQUFRLE1BQU07QUFDVixXQUFLO0FBQ0wsZUFBUyxRQUFRO0FBQUEsSUFDckIsQ0FBQztBQUFBLEVBQ0wsQ0FBQztBQUNMOzs7QUNqREEsU0FBUyxpQkFBaUIsZUFBZSxNQUFNO0FBQzNDLFNBQU8sT0FBTyxnQkFBUTtBQUN0QixTQUFPLE9BQU8sc0JBQWE7QUFDL0IsQ0FBQzsiLAogICJuYW1lcyI6IFsiQWxwaW5lIiwgInRocm90dGxlIiwgImVsIiwgIm9iaiIsICJpbmRleCIsICJnaG9zdEVsIiwgIm9wdGlvbiIsICJkZWZhdWx0cyIsICJyb290RWwiLCAiY2xvbmVFbCIsICJvbGRJbmRleCIsICJuZXdJbmRleCIsICJvbGREcmFnZ2FibGVJbmRleCIsICJuZXdEcmFnZ2FibGVJbmRleCIsICJwdXRTb3J0YWJsZSIsICJwbHVnaW5FdmVudCIsICJfZGV0ZWN0RGlyZWN0aW9uIiwgIl9kcmFnRWxJblJvd0NvbHVtbiIsICJfZGV0ZWN0TmVhcmVzdEVtcHR5U29ydGFibGUiLCAiX3ByZXBhcmVHcm91cCIsICJkcmFnRWwiLCAiX2hpZGVHaG9zdEZvclRhcmdldCIsICJfdW5oaWRlR2hvc3RGb3JUYXJnZXQiLCAibmVhcmVzdEVtcHR5SW5zZXJ0RGV0ZWN0RXZlbnQiLCAiX2NoZWNrT3V0c2lkZVRhcmdldEVsIiwgImRyYWdTdGFydEZuIiwgInRhcmdldCIsICJhZnRlciIsICJlbCIsICJwbHVnaW5zIiwgImRyb3AiLCAiYXV0b1Njcm9sbCIsICJvblNwaWxsIiwgIkFscGluZSJdCn0K
