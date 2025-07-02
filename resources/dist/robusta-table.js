// resources/js/resized-column.js
function resized_column_default(el, props) {
  let { tableKey, minColumnWidth, maxColumnWidth, enable = false } = props;
  maxColumnWidth = maxColumnWidth === -1 ? Infinity : maxColumnWidth;
  if (!enable)
    return;
  let currentWidth = 0;
  const tableSelector = ".fi-ta-table";
  const tableWrapperContentSelector = ".fi-ta-content";
  const tableBodyCellPrefix = "fi-table-cell-";
  const columnSelector = "x-robusta-table-column";
  const excludeColumnSelector = "x-robusta-table-exclude-column";
  let columns = el.querySelectorAll(`[${columnSelector}]`);
  let excludeColumns = el.querySelectorAll(`[${excludeColumnSelector}]`);
  let table = el.querySelector(tableSelector);
  let tableWrapper = el.querySelector(tableWrapperContentSelector);
  Livewire.hook("commit", () => {
    observeChanges();
  });
  function observeChanges() {
    const observer = new MutationObserver(() => {
      const table2 = el.querySelector(tableSelector);
      const wrapper = el.querySelector(tableWrapperContentSelector);
      if (table2 && wrapper) {
        observer.disconnect();
        init();
      }
    });
    observer.observe(el, { childList: true, subtree: true });
  }
  function init() {
    table = el.querySelector(tableSelector);
    tableWrapper = el.querySelector(tableWrapperContentSelector);
    columns = el.querySelectorAll(`[${columnSelector}]`);
    excludeColumns = el.querySelectorAll(`[${excludeColumnSelector}]`);
    initializeColumnLayout();
  }
  function initializeColumnLayout() {
    let totalWidth = 0;
    const applyLayout = (column, columnName, withHandleBar = false) => {
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
      applyLayout(column, getColumnName(column, excludeColumnSelector));
    });
    columns.forEach((column) => {
      applyLayout(column, getColumnName(column, columnSelector), true);
    });
    if (table && totalWidth) {
      table.style.maxWidth = `${totalWidth}px`;
    }
  }
  function createHandleBar(column) {
    const existingHandle = column.querySelector(".column-resize-handle-bar");
    if (existingHandle)
      existingHandle.remove();
    const handleBar = document.createElement("button");
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
    return className.split(".").map((s) => s.replace(/_/g, "-").replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()).join("\\.");
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
function initTable({ resizedColumn: resizedColumnProps }) {
  return {
    init() {
      Alpine.plugin(sortable_default);
      resized_column_default(this.$el, resizedColumnProps);
    }
  };
}
export {
  initTable as default
};
/*! Bundled license information:

sortablejs/modular/sortable.esm.js:
  (**!
   * Sortable 1.15.6
   * @author	RubaXa   <trash@rubaxa.org>
   * @author	owenm    <owen23355@gmail.com>
   * @license MIT
   *)
*/
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vanMvcmVzaXplZC1jb2x1bW4uanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL3NvcnRhYmxlanMvbW9kdWxhci9zb3J0YWJsZS5lc20uanMiLCAiLi4vanMvc29ydGFibGUuanMiLCAiLi4vanMvaW5kZXguanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIlxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKGVsLCBwcm9wcykge1xuICAgIGxldCB7IHRhYmxlS2V5LCBtaW5Db2x1bW5XaWR0aCwgbWF4Q29sdW1uV2lkdGgsIGVuYWJsZSA9IGZhbHNlIH0gPSBwcm9wc1xuXG4gICAgbWF4Q29sdW1uV2lkdGggPSBtYXhDb2x1bW5XaWR0aCA9PT0gLTEgPyBJbmZpbml0eSA6IG1heENvbHVtbldpZHRoXG5cbiAgICBpZiAoIWVuYWJsZSkgcmV0dXJuO1xuXG4gICAgbGV0IGN1cnJlbnRXaWR0aCA9IDBcbiAgICBjb25zdCB0YWJsZVNlbGVjdG9yID0gJy5maS10YS10YWJsZSc7XG4gICAgY29uc3QgdGFibGVXcmFwcGVyQ29udGVudFNlbGVjdG9yID0gJy5maS10YS1jb250ZW50JztcbiAgICBjb25zdCB0YWJsZUJvZHlDZWxsUHJlZml4ID0gJ2ZpLXRhYmxlLWNlbGwtJztcbiAgICBjb25zdCBjb2x1bW5TZWxlY3RvciA9ICd4LXJvYnVzdGEtdGFibGUtY29sdW1uJztcbiAgICBjb25zdCBleGNsdWRlQ29sdW1uU2VsZWN0b3IgPSAneC1yb2J1c3RhLXRhYmxlLWV4Y2x1ZGUtY29sdW1uJztcblxuICAgIGxldCBjb2x1bW5zID0gZWwucXVlcnlTZWxlY3RvckFsbChgWyR7Y29sdW1uU2VsZWN0b3J9XWApO1xuICAgIGxldCBleGNsdWRlQ29sdW1ucyA9IGVsLnF1ZXJ5U2VsZWN0b3JBbGwoYFske2V4Y2x1ZGVDb2x1bW5TZWxlY3Rvcn1dYCk7XG5cbiAgICBsZXQgdGFibGUgPSBlbC5xdWVyeVNlbGVjdG9yKHRhYmxlU2VsZWN0b3IpO1xuICAgIGxldCB0YWJsZVdyYXBwZXIgPSBlbC5xdWVyeVNlbGVjdG9yKHRhYmxlV3JhcHBlckNvbnRlbnRTZWxlY3Rvcik7XG5cbiAgICBMaXZld2lyZS5ob29rKFwiY29tbWl0XCIsICgpID0+IHtcbiAgICAgICAgb2JzZXJ2ZUNoYW5nZXMoKVxuICAgIH0pXG5cbiAgICBmdW5jdGlvbiBvYnNlcnZlQ2hhbmdlcygpIHtcbiAgICAgICAgY29uc3Qgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcigoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0YWJsZSA9IGVsLnF1ZXJ5U2VsZWN0b3IodGFibGVTZWxlY3Rvcik7XG4gICAgICAgICAgICBjb25zdCB3cmFwcGVyID0gZWwucXVlcnlTZWxlY3Rvcih0YWJsZVdyYXBwZXJDb250ZW50U2VsZWN0b3IpO1xuXG4gICAgICAgICAgICBpZiAodGFibGUgJiYgd3JhcHBlcikge1xuICAgICAgICAgICAgICAgIG9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICBpbml0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIG9ic2VydmVyLm9ic2VydmUoZWwsIHsgY2hpbGRMaXN0OiB0cnVlLCBzdWJ0cmVlOiB0cnVlIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgICAgIHRhYmxlID0gZWwucXVlcnlTZWxlY3Rvcih0YWJsZVNlbGVjdG9yKTtcbiAgICAgICAgdGFibGVXcmFwcGVyID0gZWwucXVlcnlTZWxlY3Rvcih0YWJsZVdyYXBwZXJDb250ZW50U2VsZWN0b3IpO1xuICAgICAgICBjb2x1bW5zID0gZWwucXVlcnlTZWxlY3RvckFsbChgWyR7Y29sdW1uU2VsZWN0b3J9XWApO1xuICAgICAgICBleGNsdWRlQ29sdW1ucyA9IGVsLnF1ZXJ5U2VsZWN0b3JBbGwoYFske2V4Y2x1ZGVDb2x1bW5TZWxlY3Rvcn1dYCk7XG5cbiAgICAgICAgaW5pdGlhbGl6ZUNvbHVtbkxheW91dCgpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaW5pdGlhbGl6ZUNvbHVtbkxheW91dCgpIHtcbiAgICAgICAgbGV0IHRvdGFsV2lkdGggPSAwO1xuXG4gICAgICAgIGNvbnN0IGFwcGx5TGF5b3V0ID0gKGNvbHVtbiwgY29sdW1uTmFtZSwgd2l0aEhhbmRsZUJhciA9IGZhbHNlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBkZWZhdWx0S2V5ID0gYCR7Y29sdW1uTmFtZX1fZGVmYXVsdGA7XG5cbiAgICAgICAgICAgIGlmICh3aXRoSGFuZGxlQmFyKSB7XG4gICAgICAgICAgICAgICAgY29sdW1uLmNsYXNzTGlzdC5hZGQoXCJyZWxhdGl2ZVwiLCBcImdyb3VwL2NvbHVtbi1yZXNpemVcIiwgXCJvdmVyZmxvdy1oaWRkZW5cIik7XG4gICAgICAgICAgICAgICAgY3JlYXRlSGFuZGxlQmFyKGNvbHVtbik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBzYXZlZFdpZHRoID0gZ2V0U2F2ZWRXaWR0aChjb2x1bW5OYW1lKTtcbiAgICAgICAgICAgIGNvbnN0IGRlZmF1bHRXaWR0aCA9IGdldFNhdmVkV2lkdGgoZGVmYXVsdEtleSk7XG5cbiAgICAgICAgICAgIGlmICghc2F2ZWRXaWR0aCAmJiBkZWZhdWx0V2lkdGgpIHtcbiAgICAgICAgICAgICAgICBzYXZlZFdpZHRoID0gZGVmYXVsdFdpZHRoO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIXNhdmVkV2lkdGggJiYgIWRlZmF1bHRXaWR0aCkge1xuICAgICAgICAgICAgICAgIHNhdmVkV2lkdGggPSBjb2x1bW4ub2Zmc2V0V2lkdGg7XG4gICAgICAgICAgICAgICAgaGFuZGxlQ29sdW1uVXBkYXRlKHNhdmVkV2lkdGgsIGRlZmF1bHRLZXkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0b3RhbFdpZHRoICs9IHNhdmVkV2lkdGg7XG4gICAgICAgICAgICBhcHBseUNvbHVtbldpZHRoKHNhdmVkV2lkdGgsIGNvbHVtbik7XG4gICAgICAgIH07XG5cbiAgICAgICAgZXhjbHVkZUNvbHVtbnMuZm9yRWFjaChjb2x1bW4gPT4ge1xuICAgICAgICAgICAgYXBwbHlMYXlvdXQoY29sdW1uLCBnZXRDb2x1bW5OYW1lKGNvbHVtbiwgZXhjbHVkZUNvbHVtblNlbGVjdG9yKSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbHVtbnMuZm9yRWFjaChjb2x1bW4gPT4ge1xuICAgICAgICAgICAgYXBwbHlMYXlvdXQoY29sdW1uLCBnZXRDb2x1bW5OYW1lKGNvbHVtbiwgY29sdW1uU2VsZWN0b3IpLCB0cnVlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHRhYmxlICYmIHRvdGFsV2lkdGgpIHtcbiAgICAgICAgICAgIHRhYmxlLnN0eWxlLm1heFdpZHRoID0gYCR7dG90YWxXaWR0aH1weGA7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZUhhbmRsZUJhcihjb2x1bW4pIHtcbiAgICAgICAgY29uc3QgZXhpc3RpbmdIYW5kbGUgPSBjb2x1bW4ucXVlcnlTZWxlY3RvcihcIi5jb2x1bW4tcmVzaXplLWhhbmRsZS1iYXJcIik7XG4gICAgICAgIGlmIChleGlzdGluZ0hhbmRsZSkgZXhpc3RpbmdIYW5kbGUucmVtb3ZlKCk7XG5cbiAgICAgICAgY29uc3QgaGFuZGxlQmFyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgICAgICAgaGFuZGxlQmFyLnR5cGUgPSBcImJ1dHRvblwiO1xuICAgICAgICBoYW5kbGVCYXIuY2xhc3NMaXN0LmFkZChcImNvbHVtbi1yZXNpemUtaGFuZGxlLWJhclwiKTtcbiAgICAgICAgaGFuZGxlQmFyLnRpdGxlID0gXCJSZXNpemUgY29sdW1uXCI7XG5cbiAgICAgICAgY29sdW1uLmFwcGVuZENoaWxkKGhhbmRsZUJhcik7XG5cbiAgICAgICAgaGFuZGxlQmFyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgKGUpID0+IHN0YXJ0UmVzaXplKGUsIGNvbHVtbikpO1xuXG4gICAgICAgIGhhbmRsZUJhci5hZGRFdmVudExpc3RlbmVyKFwiZGJsY2xpY2tcIiwgKGUpID0+IGhhbmRsZURvdWJsZUNsaWNrKGUsIGNvbHVtbikpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhhbmRsZURvdWJsZUNsaWNrKGV2ZW50LCBjb2x1bW4pIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGNvbnN0IGNvbHVtbk5hbWUgPSBnZXRDb2x1bW5OYW1lKGNvbHVtbik7XG4gICAgICAgIGNvbnN0IGRlZmF1bHRDb2x1bW5OYW1lID0gY29sdW1uTmFtZSArICdfZGVmYXVsdCc7XG4gICAgICAgIGNvbnN0IHNhdmVkV2lkdGggPSBnZXRTYXZlZFdpZHRoKGRlZmF1bHRDb2x1bW5OYW1lKSB8fCBtaW5Db2x1bW5XaWR0aDtcblxuICAgICAgICBpZiAoc2F2ZWRXaWR0aCA9PT0gY29sdW1uLm9mZnNldFdpZHRoKSByZXR1cm47XG5cbiAgICAgICAgYXBwbHlDb2x1bW5XaWR0aChzYXZlZFdpZHRoLCBjb2x1bW4pO1xuICAgICAgICBoYW5kbGVDb2x1bW5VcGRhdGUoc2F2ZWRXaWR0aCwgY29sdW1uTmFtZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3RhcnRSZXNpemUoZXZlbnQsIGNvbHVtbikge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgICAgICBpZiAoZXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnRhcmdldC5jbGFzc0xpc3QuYWRkKFwiYWN0aXZlXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc3RhcnRYID0gZXZlbnQucGFnZVg7XG4gICAgICAgIGNvbnN0IG9yaWdpbmFsQ29sdW1uV2lkdGggPSBNYXRoLnJvdW5kKGNvbHVtbi5vZmZzZXRXaWR0aCk7XG4gICAgICAgIGNvbnN0IG9yaWdpbmFsVGFibGVXaWR0aCA9IE1hdGgucm91bmQodGFibGUub2Zmc2V0V2lkdGgpO1xuICAgICAgICBjb25zdCBvcmlnaW5hbFdyYXBwZXJXaWR0aCA9IE1hdGgucm91bmQodGFibGVXcmFwcGVyLm9mZnNldFdpZHRoKTtcblxuICAgICAgICBjb25zdCBvbk1vdXNlTW92ZSA9IHRocm90dGxlKChtb3ZlRXZlbnQpID0+IHtcbiAgICAgICAgICAgIGlmIChtb3ZlRXZlbnQucGFnZVggPT09IHN0YXJ0WCkgcmV0dXJuO1xuICAgICAgICAgICAgY29uc3QgZGVsdGEgPSBtb3ZlRXZlbnQucGFnZVggLSBzdGFydFg7XG5cbiAgICAgICAgICAgIGN1cnJlbnRXaWR0aCA9IE1hdGgucm91bmQoXG4gICAgICAgICAgICAgICAgTWF0aC5taW4oXG4gICAgICAgICAgICAgICAgICAgIG1heENvbHVtbldpZHRoLFxuICAgICAgICAgICAgICAgICAgICBNYXRoLm1heChtaW5Db2x1bW5XaWR0aCwgb3JpZ2luYWxDb2x1bW5XaWR0aCArIGRlbHRhIC0gMTYpXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgY29uc3QgbmV3VGFibGVXaWR0aCA9IG9yaWdpbmFsVGFibGVXaWR0aCAtIG9yaWdpbmFsQ29sdW1uV2lkdGggKyBjdXJyZW50V2lkdGg7XG4gICAgICAgICAgICB0YWJsZS5zdHlsZS53aWR0aCA9IG5ld1RhYmxlV2lkdGggPiBvcmlnaW5hbFdyYXBwZXJXaWR0aFxuICAgICAgICAgICAgICAgID8gYCR7bmV3VGFibGVXaWR0aH1weGBcbiAgICAgICAgICAgICAgICA6IFwiYXV0b1wiO1xuXG4gICAgICAgICAgICBhcHBseUNvbHVtbldpZHRoKGN1cnJlbnRXaWR0aCwgY29sdW1uKTtcbiAgICAgICAgfSwgMTYpO1xuXG4gICAgICAgIGNvbnN0IG9uTW91c2VVcCA9ICgpID0+IHtcbiAgICAgICAgICAgIGlmIChldmVudCkgZXZlbnQudGFyZ2V0LmNsYXNzTGlzdC5yZW1vdmUoXCJhY3RpdmVcIik7XG5cbiAgICAgICAgICAgIGhhbmRsZUNvbHVtblVwZGF0ZShjdXJyZW50V2lkdGgsIGdldENvbHVtbk5hbWUoY29sdW1uKSk7XG5cbiAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgb25Nb3VzZU1vdmUpO1xuICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgb25Nb3VzZVVwKTtcbiAgICAgICAgfTtcblxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIG9uTW91c2VNb3ZlKTtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgb25Nb3VzZVVwKTtcbiAgICB9XG5cblxuICAgIGZ1bmN0aW9uIGhhbmRsZUNvbHVtblVwZGF0ZSh3aWR0aCwgY29sdW1uTmFtZSkge1xuICAgICAgICBzYXZlV2lkdGhUb1N0b3JhZ2Uod2lkdGgsIGNvbHVtbk5hbWUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFwcGx5Q29sdW1uV2lkdGgod2lkdGgsIGNvbHVtbikge1xuICAgICAgICBzZXRDb2x1bW5TdHlsZXMoY29sdW1uLCB3aWR0aCk7XG4gICAgICAgIGNvbnN0IGNvbHVtbk5hbWUgPSBnZXRDb2x1bW5OYW1lKGNvbHVtbik7XG4gICAgICAgIGNvbnN0IGNlbGxTZWxlY3RvciA9IGAuJHtlc2NhcGVDc3NDbGFzcyh0YWJsZUJvZHlDZWxsUHJlZml4ICsgY29sdW1uTmFtZSl9YDtcbiAgICAgICAgdGFibGUucXVlcnlTZWxlY3RvckFsbChjZWxsU2VsZWN0b3IpLmZvckVhY2goY2VsbCA9PiB7XG4gICAgICAgICAgICBzZXRDb2x1bW5TdHlsZXMoY2VsbCwgd2lkdGgpO1xuICAgICAgICAgICAgY2VsbC5zdHlsZS5vdmVyZmxvdyA9IFwiaGlkZGVuXCI7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldENvbHVtblN0eWxlcyhlbCwgd2lkdGgpIHtcbiAgICAgICAgZWwuc3R5bGUud2lkdGggPSB3aWR0aCA/IGAke3dpZHRofXB4YCA6ICdhdXRvJztcbiAgICAgICAgZWwuc3R5bGUubWluV2lkdGggPSB3aWR0aCA/IGAke3dpZHRofXB4YCA6ICdhdXRvJztcbiAgICAgICAgZWwuc3R5bGUubWF4V2lkdGggPSB3aWR0aCA/IGAke3dpZHRofXB4YCA6ICdhdXRvJztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlc2NhcGVDc3NDbGFzcyhjbGFzc05hbWUpIHtcbiAgICAgICAgcmV0dXJuIGNsYXNzTmFtZVxuICAgICAgICAgICAgLnNwbGl0KCcuJylcbiAgICAgICAgICAgIC5tYXAocyA9PiBzLnJlcGxhY2UoL18vZywgJy0nKS5yZXBsYWNlKC8oW2Etel0pKFtBLVpdKS9nLCAnJDEtJDInKS50b0xvd2VyQ2FzZSgpKVxuICAgICAgICAgICAgLmpvaW4oJ1xcXFwuJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdGhyb3R0bGUoY2FsbGJhY2ssIGxpbWl0KSB7XG4gICAgICAgIGxldCB3YWl0ID0gZmFsc2U7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgICAgICAgICAgaWYgKCF3YWl0KSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgICAgICAgICAgd2FpdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHdhaXQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9LCBsaW1pdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0U3RvcmFnZUtleShjb2x1bW5OYW1lKSB7XG4gICAgICAgIHJldHVybiBgJHt0YWJsZUtleX1fY29sdW1uV2lkdGhfJHtjb2x1bW5OYW1lfWA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0U2F2ZWRXaWR0aChjb2x1bW5OYW1lKSB7XG4gICAgICAgIGNvbnN0IHNhdmVkV2lkdGggPSBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKGdldFN0b3JhZ2VLZXkoY29sdW1uTmFtZSkpO1xuICAgICAgICByZXR1cm4gc2F2ZWRXaWR0aCA/IHBhcnNlSW50KHNhdmVkV2lkdGgpIDogbnVsbDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzYXZlV2lkdGhUb1N0b3JhZ2Uod2lkdGgsIGNvbHVtbk5hbWUpIHtcbiAgICAgICAgc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbShcbiAgICAgICAgICAgIGdldFN0b3JhZ2VLZXkoY29sdW1uTmFtZSksXG4gICAgICAgICAgICBNYXRoLm1heChcbiAgICAgICAgICAgICAgICBtaW5Db2x1bW5XaWR0aCxcbiAgICAgICAgICAgICAgICBNYXRoLm1pbihtYXhDb2x1bW5XaWR0aCwgd2lkdGgpXG4gICAgICAgICAgICApLnRvU3RyaW5nKClcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRDb2x1bW5OYW1lKGNvbHVtbiwgc2VsZWN0b3IgPSBjb2x1bW5TZWxlY3Rvcikge1xuICAgICAgICByZXR1cm4gY29sdW1uLmdldEF0dHJpYnV0ZShzZWxlY3Rvcik7XG4gICAgfVxufVxuIiwgIi8qKiFcbiAqIFNvcnRhYmxlIDEuMTUuNlxuICogQGF1dGhvclx0UnViYVhhICAgPHRyYXNoQHJ1YmF4YS5vcmc+XG4gKiBAYXV0aG9yXHRvd2VubSAgICA8b3dlbjIzMzU1QGdtYWlsLmNvbT5cbiAqIEBsaWNlbnNlIE1JVFxuICovXG5mdW5jdGlvbiBvd25LZXlzKG9iamVjdCwgZW51bWVyYWJsZU9ubHkpIHtcbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhvYmplY3QpO1xuICBpZiAoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scykge1xuICAgIHZhciBzeW1ib2xzID0gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhvYmplY3QpO1xuICAgIGlmIChlbnVtZXJhYmxlT25seSkge1xuICAgICAgc3ltYm9scyA9IHN5bWJvbHMuZmlsdGVyKGZ1bmN0aW9uIChzeW0pIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqZWN0LCBzeW0pLmVudW1lcmFibGU7XG4gICAgICB9KTtcbiAgICB9XG4gICAga2V5cy5wdXNoLmFwcGx5KGtleXMsIHN5bWJvbHMpO1xuICB9XG4gIHJldHVybiBrZXlzO1xufVxuZnVuY3Rpb24gX29iamVjdFNwcmVhZDIodGFyZ2V0KSB7XG4gIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXSAhPSBudWxsID8gYXJndW1lbnRzW2ldIDoge307XG4gICAgaWYgKGkgJSAyKSB7XG4gICAgICBvd25LZXlzKE9iamVjdChzb3VyY2UpLCB0cnVlKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgX2RlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCBzb3VyY2Vba2V5XSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzKSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzKHNvdXJjZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvd25LZXlzKE9iamVjdChzb3VyY2UpKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHNvdXJjZSwga2V5KSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRhcmdldDtcbn1cbmZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7XG4gIFwiQGJhYmVsL2hlbHBlcnMgLSB0eXBlb2ZcIjtcblxuICBpZiAodHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09IFwic3ltYm9sXCIpIHtcbiAgICBfdHlwZW9mID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIHR5cGVvZiBvYmo7XG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICBfdHlwZW9mID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIG9iaiAmJiB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgJiYgb2JqICE9PSBTeW1ib2wucHJvdG90eXBlID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7XG4gICAgfTtcbiAgfVxuICByZXR1cm4gX3R5cGVvZihvYmopO1xufVxuZnVuY3Rpb24gX2RlZmluZVByb3BlcnR5KG9iaiwga2V5LCB2YWx1ZSkge1xuICBpZiAoa2V5IGluIG9iaikge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIGtleSwge1xuICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgb2JqW2tleV0gPSB2YWx1ZTtcbiAgfVxuICByZXR1cm4gb2JqO1xufVxuZnVuY3Rpb24gX2V4dGVuZHMoKSB7XG4gIF9leHRlbmRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0KSB7XG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07XG4gICAgICBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7XG4gICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc291cmNlLCBrZXkpKSB7XG4gICAgICAgICAgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGFyZ2V0O1xuICB9O1xuICByZXR1cm4gX2V4dGVuZHMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn1cbmZ1bmN0aW9uIF9vYmplY3RXaXRob3V0UHJvcGVydGllc0xvb3NlKHNvdXJjZSwgZXhjbHVkZWQpIHtcbiAgaWYgKHNvdXJjZSA9PSBudWxsKSByZXR1cm4ge307XG4gIHZhciB0YXJnZXQgPSB7fTtcbiAgdmFyIHNvdXJjZUtleXMgPSBPYmplY3Qua2V5cyhzb3VyY2UpO1xuICB2YXIga2V5LCBpO1xuICBmb3IgKGkgPSAwOyBpIDwgc291cmNlS2V5cy5sZW5ndGg7IGkrKykge1xuICAgIGtleSA9IHNvdXJjZUtleXNbaV07XG4gICAgaWYgKGV4Y2x1ZGVkLmluZGV4T2Yoa2V5KSA+PSAwKSBjb250aW51ZTtcbiAgICB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldO1xuICB9XG4gIHJldHVybiB0YXJnZXQ7XG59XG5mdW5jdGlvbiBfb2JqZWN0V2l0aG91dFByb3BlcnRpZXMoc291cmNlLCBleGNsdWRlZCkge1xuICBpZiAoc291cmNlID09IG51bGwpIHJldHVybiB7fTtcbiAgdmFyIHRhcmdldCA9IF9vYmplY3RXaXRob3V0UHJvcGVydGllc0xvb3NlKHNvdXJjZSwgZXhjbHVkZWQpO1xuICB2YXIga2V5LCBpO1xuICBpZiAoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scykge1xuICAgIHZhciBzb3VyY2VTeW1ib2xLZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhzb3VyY2UpO1xuICAgIGZvciAoaSA9IDA7IGkgPCBzb3VyY2VTeW1ib2xLZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBrZXkgPSBzb3VyY2VTeW1ib2xLZXlzW2ldO1xuICAgICAgaWYgKGV4Y2x1ZGVkLmluZGV4T2Yoa2V5KSA+PSAwKSBjb250aW51ZTtcbiAgICAgIGlmICghT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKHNvdXJjZSwga2V5KSkgY29udGludWU7XG4gICAgICB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdGFyZ2V0O1xufVxuZnVuY3Rpb24gX3RvQ29uc3VtYWJsZUFycmF5KGFycikge1xuICByZXR1cm4gX2FycmF5V2l0aG91dEhvbGVzKGFycikgfHwgX2l0ZXJhYmxlVG9BcnJheShhcnIpIHx8IF91bnN1cHBvcnRlZEl0ZXJhYmxlVG9BcnJheShhcnIpIHx8IF9ub25JdGVyYWJsZVNwcmVhZCgpO1xufVxuZnVuY3Rpb24gX2FycmF5V2l0aG91dEhvbGVzKGFycikge1xuICBpZiAoQXJyYXkuaXNBcnJheShhcnIpKSByZXR1cm4gX2FycmF5TGlrZVRvQXJyYXkoYXJyKTtcbn1cbmZ1bmN0aW9uIF9pdGVyYWJsZVRvQXJyYXkoaXRlcikge1xuICBpZiAodHlwZW9mIFN5bWJvbCAhPT0gXCJ1bmRlZmluZWRcIiAmJiBpdGVyW1N5bWJvbC5pdGVyYXRvcl0gIT0gbnVsbCB8fCBpdGVyW1wiQEBpdGVyYXRvclwiXSAhPSBudWxsKSByZXR1cm4gQXJyYXkuZnJvbShpdGVyKTtcbn1cbmZ1bmN0aW9uIF91bnN1cHBvcnRlZEl0ZXJhYmxlVG9BcnJheShvLCBtaW5MZW4pIHtcbiAgaWYgKCFvKSByZXR1cm47XG4gIGlmICh0eXBlb2YgbyA9PT0gXCJzdHJpbmdcIikgcmV0dXJuIF9hcnJheUxpa2VUb0FycmF5KG8sIG1pbkxlbik7XG4gIHZhciBuID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pLnNsaWNlKDgsIC0xKTtcbiAgaWYgKG4gPT09IFwiT2JqZWN0XCIgJiYgby5jb25zdHJ1Y3RvcikgbiA9IG8uY29uc3RydWN0b3IubmFtZTtcbiAgaWYgKG4gPT09IFwiTWFwXCIgfHwgbiA9PT0gXCJTZXRcIikgcmV0dXJuIEFycmF5LmZyb20obyk7XG4gIGlmIChuID09PSBcIkFyZ3VtZW50c1wiIHx8IC9eKD86VWl8SSludCg/Ojh8MTZ8MzIpKD86Q2xhbXBlZCk/QXJyYXkkLy50ZXN0KG4pKSByZXR1cm4gX2FycmF5TGlrZVRvQXJyYXkobywgbWluTGVuKTtcbn1cbmZ1bmN0aW9uIF9hcnJheUxpa2VUb0FycmF5KGFyciwgbGVuKSB7XG4gIGlmIChsZW4gPT0gbnVsbCB8fCBsZW4gPiBhcnIubGVuZ3RoKSBsZW4gPSBhcnIubGVuZ3RoO1xuICBmb3IgKHZhciBpID0gMCwgYXJyMiA9IG5ldyBBcnJheShsZW4pOyBpIDwgbGVuOyBpKyspIGFycjJbaV0gPSBhcnJbaV07XG4gIHJldHVybiBhcnIyO1xufVxuZnVuY3Rpb24gX25vbkl0ZXJhYmxlU3ByZWFkKCkge1xuICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBhdHRlbXB0IHRvIHNwcmVhZCBub24taXRlcmFibGUgaW5zdGFuY2UuXFxuSW4gb3JkZXIgdG8gYmUgaXRlcmFibGUsIG5vbi1hcnJheSBvYmplY3RzIG11c3QgaGF2ZSBhIFtTeW1ib2wuaXRlcmF0b3JdKCkgbWV0aG9kLlwiKTtcbn1cblxudmFyIHZlcnNpb24gPSBcIjEuMTUuNlwiO1xuXG5mdW5jdGlvbiB1c2VyQWdlbnQocGF0dGVybikge1xuICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93Lm5hdmlnYXRvcikge1xuICAgIHJldHVybiAhISAvKkBfX1BVUkVfXyovbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaChwYXR0ZXJuKTtcbiAgfVxufVxudmFyIElFMTFPckxlc3MgPSB1c2VyQWdlbnQoLyg/OlRyaWRlbnQuKnJ2WyA6XT8xMVxcLnxtc2llfGllbW9iaWxlfFdpbmRvd3MgUGhvbmUpL2kpO1xudmFyIEVkZ2UgPSB1c2VyQWdlbnQoL0VkZ2UvaSk7XG52YXIgRmlyZUZveCA9IHVzZXJBZ2VudCgvZmlyZWZveC9pKTtcbnZhciBTYWZhcmkgPSB1c2VyQWdlbnQoL3NhZmFyaS9pKSAmJiAhdXNlckFnZW50KC9jaHJvbWUvaSkgJiYgIXVzZXJBZ2VudCgvYW5kcm9pZC9pKTtcbnZhciBJT1MgPSB1c2VyQWdlbnQoL2lQKGFkfG9kfGhvbmUpL2kpO1xudmFyIENocm9tZUZvckFuZHJvaWQgPSB1c2VyQWdlbnQoL2Nocm9tZS9pKSAmJiB1c2VyQWdlbnQoL2FuZHJvaWQvaSk7XG5cbnZhciBjYXB0dXJlTW9kZSA9IHtcbiAgY2FwdHVyZTogZmFsc2UsXG4gIHBhc3NpdmU6IGZhbHNlXG59O1xuZnVuY3Rpb24gb24oZWwsIGV2ZW50LCBmbikge1xuICBlbC5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBmbiwgIUlFMTFPckxlc3MgJiYgY2FwdHVyZU1vZGUpO1xufVxuZnVuY3Rpb24gb2ZmKGVsLCBldmVudCwgZm4pIHtcbiAgZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgZm4sICFJRTExT3JMZXNzICYmIGNhcHR1cmVNb2RlKTtcbn1cbmZ1bmN0aW9uIG1hdGNoZXMoIC8qKkhUTUxFbGVtZW50Ki9lbCwgLyoqU3RyaW5nKi9zZWxlY3Rvcikge1xuICBpZiAoIXNlbGVjdG9yKSByZXR1cm47XG4gIHNlbGVjdG9yWzBdID09PSAnPicgJiYgKHNlbGVjdG9yID0gc2VsZWN0b3Iuc3Vic3RyaW5nKDEpKTtcbiAgaWYgKGVsKSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChlbC5tYXRjaGVzKSB7XG4gICAgICAgIHJldHVybiBlbC5tYXRjaGVzKHNlbGVjdG9yKTtcbiAgICAgIH0gZWxzZSBpZiAoZWwubXNNYXRjaGVzU2VsZWN0b3IpIHtcbiAgICAgICAgcmV0dXJuIGVsLm1zTWF0Y2hlc1NlbGVjdG9yKHNlbGVjdG9yKTtcbiAgICAgIH0gZWxzZSBpZiAoZWwud2Via2l0TWF0Y2hlc1NlbGVjdG9yKSB7XG4gICAgICAgIHJldHVybiBlbC53ZWJraXRNYXRjaGVzU2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuZnVuY3Rpb24gZ2V0UGFyZW50T3JIb3N0KGVsKSB7XG4gIHJldHVybiBlbC5ob3N0ICYmIGVsICE9PSBkb2N1bWVudCAmJiBlbC5ob3N0Lm5vZGVUeXBlID8gZWwuaG9zdCA6IGVsLnBhcmVudE5vZGU7XG59XG5mdW5jdGlvbiBjbG9zZXN0KCAvKipIVE1MRWxlbWVudCovZWwsIC8qKlN0cmluZyovc2VsZWN0b3IsIC8qKkhUTUxFbGVtZW50Ki9jdHgsIGluY2x1ZGVDVFgpIHtcbiAgaWYgKGVsKSB7XG4gICAgY3R4ID0gY3R4IHx8IGRvY3VtZW50O1xuICAgIGRvIHtcbiAgICAgIGlmIChzZWxlY3RvciAhPSBudWxsICYmIChzZWxlY3RvclswXSA9PT0gJz4nID8gZWwucGFyZW50Tm9kZSA9PT0gY3R4ICYmIG1hdGNoZXMoZWwsIHNlbGVjdG9yKSA6IG1hdGNoZXMoZWwsIHNlbGVjdG9yKSkgfHwgaW5jbHVkZUNUWCAmJiBlbCA9PT0gY3R4KSB7XG4gICAgICAgIHJldHVybiBlbDtcbiAgICAgIH1cbiAgICAgIGlmIChlbCA9PT0gY3R4KSBicmVhaztcbiAgICAgIC8qIGpzaGludCBib3NzOnRydWUgKi9cbiAgICB9IHdoaWxlIChlbCA9IGdldFBhcmVudE9ySG9zdChlbCkpO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxudmFyIFJfU1BBQ0UgPSAvXFxzKy9nO1xuZnVuY3Rpb24gdG9nZ2xlQ2xhc3MoZWwsIG5hbWUsIHN0YXRlKSB7XG4gIGlmIChlbCAmJiBuYW1lKSB7XG4gICAgaWYgKGVsLmNsYXNzTGlzdCkge1xuICAgICAgZWwuY2xhc3NMaXN0W3N0YXRlID8gJ2FkZCcgOiAncmVtb3ZlJ10obmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBjbGFzc05hbWUgPSAoJyAnICsgZWwuY2xhc3NOYW1lICsgJyAnKS5yZXBsYWNlKFJfU1BBQ0UsICcgJykucmVwbGFjZSgnICcgKyBuYW1lICsgJyAnLCAnICcpO1xuICAgICAgZWwuY2xhc3NOYW1lID0gKGNsYXNzTmFtZSArIChzdGF0ZSA/ICcgJyArIG5hbWUgOiAnJykpLnJlcGxhY2UoUl9TUEFDRSwgJyAnKTtcbiAgICB9XG4gIH1cbn1cbmZ1bmN0aW9uIGNzcyhlbCwgcHJvcCwgdmFsKSB7XG4gIHZhciBzdHlsZSA9IGVsICYmIGVsLnN0eWxlO1xuICBpZiAoc3R5bGUpIHtcbiAgICBpZiAodmFsID09PSB2b2lkIDApIHtcbiAgICAgIGlmIChkb2N1bWVudC5kZWZhdWx0VmlldyAmJiBkb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKSB7XG4gICAgICAgIHZhbCA9IGRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoZWwsICcnKTtcbiAgICAgIH0gZWxzZSBpZiAoZWwuY3VycmVudFN0eWxlKSB7XG4gICAgICAgIHZhbCA9IGVsLmN1cnJlbnRTdHlsZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBwcm9wID09PSB2b2lkIDAgPyB2YWwgOiB2YWxbcHJvcF07XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICghKHByb3AgaW4gc3R5bGUpICYmIHByb3AuaW5kZXhPZignd2Via2l0JykgPT09IC0xKSB7XG4gICAgICAgIHByb3AgPSAnLXdlYmtpdC0nICsgcHJvcDtcbiAgICAgIH1cbiAgICAgIHN0eWxlW3Byb3BdID0gdmFsICsgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnID8gJycgOiAncHgnKTtcbiAgICB9XG4gIH1cbn1cbmZ1bmN0aW9uIG1hdHJpeChlbCwgc2VsZk9ubHkpIHtcbiAgdmFyIGFwcGxpZWRUcmFuc2Zvcm1zID0gJyc7XG4gIGlmICh0eXBlb2YgZWwgPT09ICdzdHJpbmcnKSB7XG4gICAgYXBwbGllZFRyYW5zZm9ybXMgPSBlbDtcbiAgfSBlbHNlIHtcbiAgICBkbyB7XG4gICAgICB2YXIgdHJhbnNmb3JtID0gY3NzKGVsLCAndHJhbnNmb3JtJyk7XG4gICAgICBpZiAodHJhbnNmb3JtICYmIHRyYW5zZm9ybSAhPT0gJ25vbmUnKSB7XG4gICAgICAgIGFwcGxpZWRUcmFuc2Zvcm1zID0gdHJhbnNmb3JtICsgJyAnICsgYXBwbGllZFRyYW5zZm9ybXM7XG4gICAgICB9XG4gICAgICAvKiBqc2hpbnQgYm9zczp0cnVlICovXG4gICAgfSB3aGlsZSAoIXNlbGZPbmx5ICYmIChlbCA9IGVsLnBhcmVudE5vZGUpKTtcbiAgfVxuICB2YXIgbWF0cml4Rm4gPSB3aW5kb3cuRE9NTWF0cml4IHx8IHdpbmRvdy5XZWJLaXRDU1NNYXRyaXggfHwgd2luZG93LkNTU01hdHJpeCB8fCB3aW5kb3cuTVNDU1NNYXRyaXg7XG4gIC8qanNoaW50IC1XMDU2ICovXG4gIHJldHVybiBtYXRyaXhGbiAmJiBuZXcgbWF0cml4Rm4oYXBwbGllZFRyYW5zZm9ybXMpO1xufVxuZnVuY3Rpb24gZmluZChjdHgsIHRhZ05hbWUsIGl0ZXJhdG9yKSB7XG4gIGlmIChjdHgpIHtcbiAgICB2YXIgbGlzdCA9IGN0eC5nZXRFbGVtZW50c0J5VGFnTmFtZSh0YWdOYW1lKSxcbiAgICAgIGkgPSAwLFxuICAgICAgbiA9IGxpc3QubGVuZ3RoO1xuICAgIGlmIChpdGVyYXRvcikge1xuICAgICAgZm9yICg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgaXRlcmF0b3IobGlzdFtpXSwgaSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBsaXN0O1xuICB9XG4gIHJldHVybiBbXTtcbn1cbmZ1bmN0aW9uIGdldFdpbmRvd1Njcm9sbGluZ0VsZW1lbnQoKSB7XG4gIHZhciBzY3JvbGxpbmdFbGVtZW50ID0gZG9jdW1lbnQuc2Nyb2xsaW5nRWxlbWVudDtcbiAgaWYgKHNjcm9sbGluZ0VsZW1lbnQpIHtcbiAgICByZXR1cm4gc2Nyb2xsaW5nRWxlbWVudDtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuICB9XG59XG5cbi8qKlxyXG4gKiBSZXR1cm5zIHRoZSBcImJvdW5kaW5nIGNsaWVudCByZWN0XCIgb2YgZ2l2ZW4gZWxlbWVudFxyXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWwgICAgICAgICAgICAgICAgICAgICAgIFRoZSBlbGVtZW50IHdob3NlIGJvdW5kaW5nQ2xpZW50UmVjdCBpcyB3YW50ZWRcclxuICogQHBhcmFtICB7W0Jvb2xlYW5dfSByZWxhdGl2ZVRvQ29udGFpbmluZ0Jsb2NrICBXaGV0aGVyIHRoZSByZWN0IHNob3VsZCBiZSByZWxhdGl2ZSB0byB0aGUgY29udGFpbmluZyBibG9jayBvZiAoaW5jbHVkaW5nKSB0aGUgY29udGFpbmVyXHJcbiAqIEBwYXJhbSAge1tCb29sZWFuXX0gcmVsYXRpdmVUb05vblN0YXRpY1BhcmVudCAgV2hldGhlciB0aGUgcmVjdCBzaG91bGQgYmUgcmVsYXRpdmUgdG8gdGhlIHJlbGF0aXZlIHBhcmVudCBvZiAoaW5jbHVkaW5nKSB0aGUgY29udGFpZW5yXHJcbiAqIEBwYXJhbSAge1tCb29sZWFuXX0gdW5kb1NjYWxlICAgICAgICAgICAgICAgICAgV2hldGhlciB0aGUgY29udGFpbmVyJ3Mgc2NhbGUoKSBzaG91bGQgYmUgdW5kb25lXHJcbiAqIEBwYXJhbSAge1tIVE1MRWxlbWVudF19IGNvbnRhaW5lciAgICAgICAgICAgICAgVGhlIHBhcmVudCB0aGUgZWxlbWVudCB3aWxsIGJlIHBsYWNlZCBpblxyXG4gKiBAcmV0dXJuIHtPYmplY3R9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRoZSBib3VuZGluZ0NsaWVudFJlY3Qgb2YgZWwsIHdpdGggc3BlY2lmaWVkIGFkanVzdG1lbnRzXHJcbiAqL1xuZnVuY3Rpb24gZ2V0UmVjdChlbCwgcmVsYXRpdmVUb0NvbnRhaW5pbmdCbG9jaywgcmVsYXRpdmVUb05vblN0YXRpY1BhcmVudCwgdW5kb1NjYWxlLCBjb250YWluZXIpIHtcbiAgaWYgKCFlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QgJiYgZWwgIT09IHdpbmRvdykgcmV0dXJuO1xuICB2YXIgZWxSZWN0LCB0b3AsIGxlZnQsIGJvdHRvbSwgcmlnaHQsIGhlaWdodCwgd2lkdGg7XG4gIGlmIChlbCAhPT0gd2luZG93ICYmIGVsLnBhcmVudE5vZGUgJiYgZWwgIT09IGdldFdpbmRvd1Njcm9sbGluZ0VsZW1lbnQoKSkge1xuICAgIGVsUmVjdCA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIHRvcCA9IGVsUmVjdC50b3A7XG4gICAgbGVmdCA9IGVsUmVjdC5sZWZ0O1xuICAgIGJvdHRvbSA9IGVsUmVjdC5ib3R0b207XG4gICAgcmlnaHQgPSBlbFJlY3QucmlnaHQ7XG4gICAgaGVpZ2h0ID0gZWxSZWN0LmhlaWdodDtcbiAgICB3aWR0aCA9IGVsUmVjdC53aWR0aDtcbiAgfSBlbHNlIHtcbiAgICB0b3AgPSAwO1xuICAgIGxlZnQgPSAwO1xuICAgIGJvdHRvbSA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICByaWdodCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICAgIGhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICB3aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICB9XG4gIGlmICgocmVsYXRpdmVUb0NvbnRhaW5pbmdCbG9jayB8fCByZWxhdGl2ZVRvTm9uU3RhdGljUGFyZW50KSAmJiBlbCAhPT0gd2luZG93KSB7XG4gICAgLy8gQWRqdXN0IGZvciB0cmFuc2xhdGUoKVxuICAgIGNvbnRhaW5lciA9IGNvbnRhaW5lciB8fCBlbC5wYXJlbnROb2RlO1xuXG4gICAgLy8gc29sdmVzICMxMTIzIChzZWU6IGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8zNzk1MzgwNi82MDg4MzEyKVxuICAgIC8vIE5vdCBuZWVkZWQgb24gPD0gSUUxMVxuICAgIGlmICghSUUxMU9yTGVzcykge1xuICAgICAgZG8ge1xuICAgICAgICBpZiAoY29udGFpbmVyICYmIGNvbnRhaW5lci5nZXRCb3VuZGluZ0NsaWVudFJlY3QgJiYgKGNzcyhjb250YWluZXIsICd0cmFuc2Zvcm0nKSAhPT0gJ25vbmUnIHx8IHJlbGF0aXZlVG9Ob25TdGF0aWNQYXJlbnQgJiYgY3NzKGNvbnRhaW5lciwgJ3Bvc2l0aW9uJykgIT09ICdzdGF0aWMnKSkge1xuICAgICAgICAgIHZhciBjb250YWluZXJSZWN0ID0gY29udGFpbmVyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgICAgICAgLy8gU2V0IHJlbGF0aXZlIHRvIGVkZ2VzIG9mIHBhZGRpbmcgYm94IG9mIGNvbnRhaW5lclxuICAgICAgICAgIHRvcCAtPSBjb250YWluZXJSZWN0LnRvcCArIHBhcnNlSW50KGNzcyhjb250YWluZXIsICdib3JkZXItdG9wLXdpZHRoJykpO1xuICAgICAgICAgIGxlZnQgLT0gY29udGFpbmVyUmVjdC5sZWZ0ICsgcGFyc2VJbnQoY3NzKGNvbnRhaW5lciwgJ2JvcmRlci1sZWZ0LXdpZHRoJykpO1xuICAgICAgICAgIGJvdHRvbSA9IHRvcCArIGVsUmVjdC5oZWlnaHQ7XG4gICAgICAgICAgcmlnaHQgPSBsZWZ0ICsgZWxSZWN0LndpZHRoO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIC8qIGpzaGludCBib3NzOnRydWUgKi9cbiAgICAgIH0gd2hpbGUgKGNvbnRhaW5lciA9IGNvbnRhaW5lci5wYXJlbnROb2RlKTtcbiAgICB9XG4gIH1cbiAgaWYgKHVuZG9TY2FsZSAmJiBlbCAhPT0gd2luZG93KSB7XG4gICAgLy8gQWRqdXN0IGZvciBzY2FsZSgpXG4gICAgdmFyIGVsTWF0cml4ID0gbWF0cml4KGNvbnRhaW5lciB8fCBlbCksXG4gICAgICBzY2FsZVggPSBlbE1hdHJpeCAmJiBlbE1hdHJpeC5hLFxuICAgICAgc2NhbGVZID0gZWxNYXRyaXggJiYgZWxNYXRyaXguZDtcbiAgICBpZiAoZWxNYXRyaXgpIHtcbiAgICAgIHRvcCAvPSBzY2FsZVk7XG4gICAgICBsZWZ0IC89IHNjYWxlWDtcbiAgICAgIHdpZHRoIC89IHNjYWxlWDtcbiAgICAgIGhlaWdodCAvPSBzY2FsZVk7XG4gICAgICBib3R0b20gPSB0b3AgKyBoZWlnaHQ7XG4gICAgICByaWdodCA9IGxlZnQgKyB3aWR0aDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHtcbiAgICB0b3A6IHRvcCxcbiAgICBsZWZ0OiBsZWZ0LFxuICAgIGJvdHRvbTogYm90dG9tLFxuICAgIHJpZ2h0OiByaWdodCxcbiAgICB3aWR0aDogd2lkdGgsXG4gICAgaGVpZ2h0OiBoZWlnaHRcbiAgfTtcbn1cblxuLyoqXHJcbiAqIENoZWNrcyBpZiBhIHNpZGUgb2YgYW4gZWxlbWVudCBpcyBzY3JvbGxlZCBwYXN0IGEgc2lkZSBvZiBpdHMgcGFyZW50c1xyXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gIGVsICAgICAgICAgICBUaGUgZWxlbWVudCB3aG8ncyBzaWRlIGJlaW5nIHNjcm9sbGVkIG91dCBvZiB2aWV3IGlzIGluIHF1ZXN0aW9uXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gICAgICAgZWxTaWRlICAgICAgIFNpZGUgb2YgdGhlIGVsZW1lbnQgaW4gcXVlc3Rpb24gKCd0b3AnLCAnbGVmdCcsICdyaWdodCcsICdib3R0b20nKVxyXG4gKiBAcGFyYW0gIHtTdHJpbmd9ICAgICAgIHBhcmVudFNpZGUgICBTaWRlIG9mIHRoZSBwYXJlbnQgaW4gcXVlc3Rpb24gKCd0b3AnLCAnbGVmdCcsICdyaWdodCcsICdib3R0b20nKVxyXG4gKiBAcmV0dXJuIHtIVE1MRWxlbWVudH0gICAgICAgICAgICAgICBUaGUgcGFyZW50IHNjcm9sbCBlbGVtZW50IHRoYXQgdGhlIGVsJ3Mgc2lkZSBpcyBzY3JvbGxlZCBwYXN0LCBvciBudWxsIGlmIHRoZXJlIGlzIG5vIHN1Y2ggZWxlbWVudFxyXG4gKi9cbmZ1bmN0aW9uIGlzU2Nyb2xsZWRQYXN0KGVsLCBlbFNpZGUsIHBhcmVudFNpZGUpIHtcbiAgdmFyIHBhcmVudCA9IGdldFBhcmVudEF1dG9TY3JvbGxFbGVtZW50KGVsLCB0cnVlKSxcbiAgICBlbFNpZGVWYWwgPSBnZXRSZWN0KGVsKVtlbFNpZGVdO1xuXG4gIC8qIGpzaGludCBib3NzOnRydWUgKi9cbiAgd2hpbGUgKHBhcmVudCkge1xuICAgIHZhciBwYXJlbnRTaWRlVmFsID0gZ2V0UmVjdChwYXJlbnQpW3BhcmVudFNpZGVdLFxuICAgICAgdmlzaWJsZSA9IHZvaWQgMDtcbiAgICBpZiAocGFyZW50U2lkZSA9PT0gJ3RvcCcgfHwgcGFyZW50U2lkZSA9PT0gJ2xlZnQnKSB7XG4gICAgICB2aXNpYmxlID0gZWxTaWRlVmFsID49IHBhcmVudFNpZGVWYWw7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZpc2libGUgPSBlbFNpZGVWYWwgPD0gcGFyZW50U2lkZVZhbDtcbiAgICB9XG4gICAgaWYgKCF2aXNpYmxlKSByZXR1cm4gcGFyZW50O1xuICAgIGlmIChwYXJlbnQgPT09IGdldFdpbmRvd1Njcm9sbGluZ0VsZW1lbnQoKSkgYnJlYWs7XG4gICAgcGFyZW50ID0gZ2V0UGFyZW50QXV0b1Njcm9sbEVsZW1lbnQocGFyZW50LCBmYWxzZSk7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcclxuICogR2V0cyBudGggY2hpbGQgb2YgZWwsIGlnbm9yaW5nIGhpZGRlbiBjaGlsZHJlbiwgc29ydGFibGUncyBlbGVtZW50cyAoZG9lcyBub3QgaWdub3JlIGNsb25lIGlmIGl0J3MgdmlzaWJsZSlcclxuICogYW5kIG5vbi1kcmFnZ2FibGUgZWxlbWVudHNcclxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IGVsICAgICAgIFRoZSBwYXJlbnQgZWxlbWVudFxyXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IGNoaWxkTnVtICAgICAgVGhlIGluZGV4IG9mIHRoZSBjaGlsZFxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnMgICAgICAgUGFyZW50IFNvcnRhYmxlJ3Mgb3B0aW9uc1xyXG4gKiBAcmV0dXJuIHtIVE1MRWxlbWVudH0gICAgICAgICAgVGhlIGNoaWxkIGF0IGluZGV4IGNoaWxkTnVtLCBvciBudWxsIGlmIG5vdCBmb3VuZFxyXG4gKi9cbmZ1bmN0aW9uIGdldENoaWxkKGVsLCBjaGlsZE51bSwgb3B0aW9ucywgaW5jbHVkZURyYWdFbCkge1xuICB2YXIgY3VycmVudENoaWxkID0gMCxcbiAgICBpID0gMCxcbiAgICBjaGlsZHJlbiA9IGVsLmNoaWxkcmVuO1xuICB3aGlsZSAoaSA8IGNoaWxkcmVuLmxlbmd0aCkge1xuICAgIGlmIChjaGlsZHJlbltpXS5zdHlsZS5kaXNwbGF5ICE9PSAnbm9uZScgJiYgY2hpbGRyZW5baV0gIT09IFNvcnRhYmxlLmdob3N0ICYmIChpbmNsdWRlRHJhZ0VsIHx8IGNoaWxkcmVuW2ldICE9PSBTb3J0YWJsZS5kcmFnZ2VkKSAmJiBjbG9zZXN0KGNoaWxkcmVuW2ldLCBvcHRpb25zLmRyYWdnYWJsZSwgZWwsIGZhbHNlKSkge1xuICAgICAgaWYgKGN1cnJlbnRDaGlsZCA9PT0gY2hpbGROdW0pIHtcbiAgICAgICAgcmV0dXJuIGNoaWxkcmVuW2ldO1xuICAgICAgfVxuICAgICAgY3VycmVudENoaWxkKys7XG4gICAgfVxuICAgIGkrKztcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXHJcbiAqIEdldHMgdGhlIGxhc3QgY2hpbGQgaW4gdGhlIGVsLCBpZ25vcmluZyBnaG9zdEVsIG9yIGludmlzaWJsZSBlbGVtZW50cyAoY2xvbmVzKVxyXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWwgICAgICAgUGFyZW50IGVsZW1lbnRcclxuICogQHBhcmFtICB7c2VsZWN0b3J9IHNlbGVjdG9yICAgIEFueSBvdGhlciBlbGVtZW50cyB0aGF0IHNob3VsZCBiZSBpZ25vcmVkXHJcbiAqIEByZXR1cm4ge0hUTUxFbGVtZW50fSAgICAgICAgICBUaGUgbGFzdCBjaGlsZCwgaWdub3JpbmcgZ2hvc3RFbFxyXG4gKi9cbmZ1bmN0aW9uIGxhc3RDaGlsZChlbCwgc2VsZWN0b3IpIHtcbiAgdmFyIGxhc3QgPSBlbC5sYXN0RWxlbWVudENoaWxkO1xuICB3aGlsZSAobGFzdCAmJiAobGFzdCA9PT0gU29ydGFibGUuZ2hvc3QgfHwgY3NzKGxhc3QsICdkaXNwbGF5JykgPT09ICdub25lJyB8fCBzZWxlY3RvciAmJiAhbWF0Y2hlcyhsYXN0LCBzZWxlY3RvcikpKSB7XG4gICAgbGFzdCA9IGxhc3QucHJldmlvdXNFbGVtZW50U2libGluZztcbiAgfVxuICByZXR1cm4gbGFzdCB8fCBudWxsO1xufVxuXG4vKipcclxuICogUmV0dXJucyB0aGUgaW5kZXggb2YgYW4gZWxlbWVudCB3aXRoaW4gaXRzIHBhcmVudCBmb3IgYSBzZWxlY3RlZCBzZXQgb2ZcclxuICogZWxlbWVudHNcclxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IGVsXHJcbiAqIEBwYXJhbSAge3NlbGVjdG9yfSBzZWxlY3RvclxyXG4gKiBAcmV0dXJuIHtudW1iZXJ9XHJcbiAqL1xuZnVuY3Rpb24gaW5kZXgoZWwsIHNlbGVjdG9yKSB7XG4gIHZhciBpbmRleCA9IDA7XG4gIGlmICghZWwgfHwgIWVsLnBhcmVudE5vZGUpIHtcbiAgICByZXR1cm4gLTE7XG4gIH1cblxuICAvKiBqc2hpbnQgYm9zczp0cnVlICovXG4gIHdoaWxlIChlbCA9IGVsLnByZXZpb3VzRWxlbWVudFNpYmxpbmcpIHtcbiAgICBpZiAoZWwubm9kZU5hbWUudG9VcHBlckNhc2UoKSAhPT0gJ1RFTVBMQVRFJyAmJiBlbCAhPT0gU29ydGFibGUuY2xvbmUgJiYgKCFzZWxlY3RvciB8fCBtYXRjaGVzKGVsLCBzZWxlY3RvcikpKSB7XG4gICAgICBpbmRleCsrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gaW5kZXg7XG59XG5cbi8qKlxyXG4gKiBSZXR1cm5zIHRoZSBzY3JvbGwgb2Zmc2V0IG9mIHRoZSBnaXZlbiBlbGVtZW50LCBhZGRlZCB3aXRoIGFsbCB0aGUgc2Nyb2xsIG9mZnNldHMgb2YgcGFyZW50IGVsZW1lbnRzLlxyXG4gKiBUaGUgdmFsdWUgaXMgcmV0dXJuZWQgaW4gcmVhbCBwaXhlbHMuXHJcbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBlbFxyXG4gKiBAcmV0dXJuIHtBcnJheX0gICAgICAgICAgICAgT2Zmc2V0cyBpbiB0aGUgZm9ybWF0IG9mIFtsZWZ0LCB0b3BdXHJcbiAqL1xuZnVuY3Rpb24gZ2V0UmVsYXRpdmVTY3JvbGxPZmZzZXQoZWwpIHtcbiAgdmFyIG9mZnNldExlZnQgPSAwLFxuICAgIG9mZnNldFRvcCA9IDAsXG4gICAgd2luU2Nyb2xsZXIgPSBnZXRXaW5kb3dTY3JvbGxpbmdFbGVtZW50KCk7XG4gIGlmIChlbCkge1xuICAgIGRvIHtcbiAgICAgIHZhciBlbE1hdHJpeCA9IG1hdHJpeChlbCksXG4gICAgICAgIHNjYWxlWCA9IGVsTWF0cml4LmEsXG4gICAgICAgIHNjYWxlWSA9IGVsTWF0cml4LmQ7XG4gICAgICBvZmZzZXRMZWZ0ICs9IGVsLnNjcm9sbExlZnQgKiBzY2FsZVg7XG4gICAgICBvZmZzZXRUb3AgKz0gZWwuc2Nyb2xsVG9wICogc2NhbGVZO1xuICAgIH0gd2hpbGUgKGVsICE9PSB3aW5TY3JvbGxlciAmJiAoZWwgPSBlbC5wYXJlbnROb2RlKSk7XG4gIH1cbiAgcmV0dXJuIFtvZmZzZXRMZWZ0LCBvZmZzZXRUb3BdO1xufVxuXG4vKipcclxuICogUmV0dXJucyB0aGUgaW5kZXggb2YgdGhlIG9iamVjdCB3aXRoaW4gdGhlIGdpdmVuIGFycmF5XHJcbiAqIEBwYXJhbSAge0FycmF5fSBhcnIgICBBcnJheSB0aGF0IG1heSBvciBtYXkgbm90IGhvbGQgdGhlIG9iamVjdFxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IG9iaiAgQW4gb2JqZWN0IHRoYXQgaGFzIGEga2V5LXZhbHVlIHBhaXIgdW5pcXVlIHRvIGFuZCBpZGVudGljYWwgdG8gYSBrZXktdmFsdWUgcGFpciBpbiB0aGUgb2JqZWN0IHlvdSB3YW50IHRvIGZpbmRcclxuICogQHJldHVybiB7TnVtYmVyfSAgICAgIFRoZSBpbmRleCBvZiB0aGUgb2JqZWN0IGluIHRoZSBhcnJheSwgb3IgLTFcclxuICovXG5mdW5jdGlvbiBpbmRleE9mT2JqZWN0KGFyciwgb2JqKSB7XG4gIGZvciAodmFyIGkgaW4gYXJyKSB7XG4gICAgaWYgKCFhcnIuaGFzT3duUHJvcGVydHkoaSkpIGNvbnRpbnVlO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSAmJiBvYmpba2V5XSA9PT0gYXJyW2ldW2tleV0pIHJldHVybiBOdW1iZXIoaSk7XG4gICAgfVxuICB9XG4gIHJldHVybiAtMTtcbn1cbmZ1bmN0aW9uIGdldFBhcmVudEF1dG9TY3JvbGxFbGVtZW50KGVsLCBpbmNsdWRlU2VsZikge1xuICAvLyBza2lwIHRvIHdpbmRvd1xuICBpZiAoIWVsIHx8ICFlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QpIHJldHVybiBnZXRXaW5kb3dTY3JvbGxpbmdFbGVtZW50KCk7XG4gIHZhciBlbGVtID0gZWw7XG4gIHZhciBnb3RTZWxmID0gZmFsc2U7XG4gIGRvIHtcbiAgICAvLyB3ZSBkb24ndCBuZWVkIHRvIGdldCBlbGVtIGNzcyBpZiBpdCBpc24ndCBldmVuIG92ZXJmbG93aW5nIGluIHRoZSBmaXJzdCBwbGFjZSAocGVyZm9ybWFuY2UpXG4gICAgaWYgKGVsZW0uY2xpZW50V2lkdGggPCBlbGVtLnNjcm9sbFdpZHRoIHx8IGVsZW0uY2xpZW50SGVpZ2h0IDwgZWxlbS5zY3JvbGxIZWlnaHQpIHtcbiAgICAgIHZhciBlbGVtQ1NTID0gY3NzKGVsZW0pO1xuICAgICAgaWYgKGVsZW0uY2xpZW50V2lkdGggPCBlbGVtLnNjcm9sbFdpZHRoICYmIChlbGVtQ1NTLm92ZXJmbG93WCA9PSAnYXV0bycgfHwgZWxlbUNTUy5vdmVyZmxvd1ggPT0gJ3Njcm9sbCcpIHx8IGVsZW0uY2xpZW50SGVpZ2h0IDwgZWxlbS5zY3JvbGxIZWlnaHQgJiYgKGVsZW1DU1Mub3ZlcmZsb3dZID09ICdhdXRvJyB8fCBlbGVtQ1NTLm92ZXJmbG93WSA9PSAnc2Nyb2xsJykpIHtcbiAgICAgICAgaWYgKCFlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCB8fCBlbGVtID09PSBkb2N1bWVudC5ib2R5KSByZXR1cm4gZ2V0V2luZG93U2Nyb2xsaW5nRWxlbWVudCgpO1xuICAgICAgICBpZiAoZ290U2VsZiB8fCBpbmNsdWRlU2VsZikgcmV0dXJuIGVsZW07XG4gICAgICAgIGdvdFNlbGYgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICAvKiBqc2hpbnQgYm9zczp0cnVlICovXG4gIH0gd2hpbGUgKGVsZW0gPSBlbGVtLnBhcmVudE5vZGUpO1xuICByZXR1cm4gZ2V0V2luZG93U2Nyb2xsaW5nRWxlbWVudCgpO1xufVxuZnVuY3Rpb24gZXh0ZW5kKGRzdCwgc3JjKSB7XG4gIGlmIChkc3QgJiYgc3JjKSB7XG4gICAgZm9yICh2YXIga2V5IGluIHNyYykge1xuICAgICAgaWYgKHNyYy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgIGRzdFtrZXldID0gc3JjW2tleV07XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBkc3Q7XG59XG5mdW5jdGlvbiBpc1JlY3RFcXVhbChyZWN0MSwgcmVjdDIpIHtcbiAgcmV0dXJuIE1hdGgucm91bmQocmVjdDEudG9wKSA9PT0gTWF0aC5yb3VuZChyZWN0Mi50b3ApICYmIE1hdGgucm91bmQocmVjdDEubGVmdCkgPT09IE1hdGgucm91bmQocmVjdDIubGVmdCkgJiYgTWF0aC5yb3VuZChyZWN0MS5oZWlnaHQpID09PSBNYXRoLnJvdW5kKHJlY3QyLmhlaWdodCkgJiYgTWF0aC5yb3VuZChyZWN0MS53aWR0aCkgPT09IE1hdGgucm91bmQocmVjdDIud2lkdGgpO1xufVxudmFyIF90aHJvdHRsZVRpbWVvdXQ7XG5mdW5jdGlvbiB0aHJvdHRsZShjYWxsYmFjaywgbXMpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIV90aHJvdHRsZVRpbWVvdXQpIHtcbiAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzLFxuICAgICAgICBfdGhpcyA9IHRoaXM7XG4gICAgICBpZiAoYXJncy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgY2FsbGJhY2suY2FsbChfdGhpcywgYXJnc1swXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjYWxsYmFjay5hcHBseShfdGhpcywgYXJncyk7XG4gICAgICB9XG4gICAgICBfdGhyb3R0bGVUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIF90aHJvdHRsZVRpbWVvdXQgPSB2b2lkIDA7XG4gICAgICB9LCBtcyk7XG4gICAgfVxuICB9O1xufVxuZnVuY3Rpb24gY2FuY2VsVGhyb3R0bGUoKSB7XG4gIGNsZWFyVGltZW91dChfdGhyb3R0bGVUaW1lb3V0KTtcbiAgX3Rocm90dGxlVGltZW91dCA9IHZvaWQgMDtcbn1cbmZ1bmN0aW9uIHNjcm9sbEJ5KGVsLCB4LCB5KSB7XG4gIGVsLnNjcm9sbExlZnQgKz0geDtcbiAgZWwuc2Nyb2xsVG9wICs9IHk7XG59XG5mdW5jdGlvbiBjbG9uZShlbCkge1xuICB2YXIgUG9seW1lciA9IHdpbmRvdy5Qb2x5bWVyO1xuICB2YXIgJCA9IHdpbmRvdy5qUXVlcnkgfHwgd2luZG93LlplcHRvO1xuICBpZiAoUG9seW1lciAmJiBQb2x5bWVyLmRvbSkge1xuICAgIHJldHVybiBQb2x5bWVyLmRvbShlbCkuY2xvbmVOb2RlKHRydWUpO1xuICB9IGVsc2UgaWYgKCQpIHtcbiAgICByZXR1cm4gJChlbCkuY2xvbmUodHJ1ZSlbMF07XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGVsLmNsb25lTm9kZSh0cnVlKTtcbiAgfVxufVxuZnVuY3Rpb24gc2V0UmVjdChlbCwgcmVjdCkge1xuICBjc3MoZWwsICdwb3NpdGlvbicsICdhYnNvbHV0ZScpO1xuICBjc3MoZWwsICd0b3AnLCByZWN0LnRvcCk7XG4gIGNzcyhlbCwgJ2xlZnQnLCByZWN0LmxlZnQpO1xuICBjc3MoZWwsICd3aWR0aCcsIHJlY3Qud2lkdGgpO1xuICBjc3MoZWwsICdoZWlnaHQnLCByZWN0LmhlaWdodCk7XG59XG5mdW5jdGlvbiB1bnNldFJlY3QoZWwpIHtcbiAgY3NzKGVsLCAncG9zaXRpb24nLCAnJyk7XG4gIGNzcyhlbCwgJ3RvcCcsICcnKTtcbiAgY3NzKGVsLCAnbGVmdCcsICcnKTtcbiAgY3NzKGVsLCAnd2lkdGgnLCAnJyk7XG4gIGNzcyhlbCwgJ2hlaWdodCcsICcnKTtcbn1cbmZ1bmN0aW9uIGdldENoaWxkQ29udGFpbmluZ1JlY3RGcm9tRWxlbWVudChjb250YWluZXIsIG9wdGlvbnMsIGdob3N0RWwpIHtcbiAgdmFyIHJlY3QgPSB7fTtcbiAgQXJyYXkuZnJvbShjb250YWluZXIuY2hpbGRyZW4pLmZvckVhY2goZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgdmFyIF9yZWN0JGxlZnQsIF9yZWN0JHRvcCwgX3JlY3QkcmlnaHQsIF9yZWN0JGJvdHRvbTtcbiAgICBpZiAoIWNsb3Nlc3QoY2hpbGQsIG9wdGlvbnMuZHJhZ2dhYmxlLCBjb250YWluZXIsIGZhbHNlKSB8fCBjaGlsZC5hbmltYXRlZCB8fCBjaGlsZCA9PT0gZ2hvc3RFbCkgcmV0dXJuO1xuICAgIHZhciBjaGlsZFJlY3QgPSBnZXRSZWN0KGNoaWxkKTtcbiAgICByZWN0LmxlZnQgPSBNYXRoLm1pbigoX3JlY3QkbGVmdCA9IHJlY3QubGVmdCkgIT09IG51bGwgJiYgX3JlY3QkbGVmdCAhPT0gdm9pZCAwID8gX3JlY3QkbGVmdCA6IEluZmluaXR5LCBjaGlsZFJlY3QubGVmdCk7XG4gICAgcmVjdC50b3AgPSBNYXRoLm1pbigoX3JlY3QkdG9wID0gcmVjdC50b3ApICE9PSBudWxsICYmIF9yZWN0JHRvcCAhPT0gdm9pZCAwID8gX3JlY3QkdG9wIDogSW5maW5pdHksIGNoaWxkUmVjdC50b3ApO1xuICAgIHJlY3QucmlnaHQgPSBNYXRoLm1heCgoX3JlY3QkcmlnaHQgPSByZWN0LnJpZ2h0KSAhPT0gbnVsbCAmJiBfcmVjdCRyaWdodCAhPT0gdm9pZCAwID8gX3JlY3QkcmlnaHQgOiAtSW5maW5pdHksIGNoaWxkUmVjdC5yaWdodCk7XG4gICAgcmVjdC5ib3R0b20gPSBNYXRoLm1heCgoX3JlY3QkYm90dG9tID0gcmVjdC5ib3R0b20pICE9PSBudWxsICYmIF9yZWN0JGJvdHRvbSAhPT0gdm9pZCAwID8gX3JlY3QkYm90dG9tIDogLUluZmluaXR5LCBjaGlsZFJlY3QuYm90dG9tKTtcbiAgfSk7XG4gIHJlY3Qud2lkdGggPSByZWN0LnJpZ2h0IC0gcmVjdC5sZWZ0O1xuICByZWN0LmhlaWdodCA9IHJlY3QuYm90dG9tIC0gcmVjdC50b3A7XG4gIHJlY3QueCA9IHJlY3QubGVmdDtcbiAgcmVjdC55ID0gcmVjdC50b3A7XG4gIHJldHVybiByZWN0O1xufVxudmFyIGV4cGFuZG8gPSAnU29ydGFibGUnICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cbmZ1bmN0aW9uIEFuaW1hdGlvblN0YXRlTWFuYWdlcigpIHtcbiAgdmFyIGFuaW1hdGlvblN0YXRlcyA9IFtdLFxuICAgIGFuaW1hdGlvbkNhbGxiYWNrSWQ7XG4gIHJldHVybiB7XG4gICAgY2FwdHVyZUFuaW1hdGlvblN0YXRlOiBmdW5jdGlvbiBjYXB0dXJlQW5pbWF0aW9uU3RhdGUoKSB7XG4gICAgICBhbmltYXRpb25TdGF0ZXMgPSBbXTtcbiAgICAgIGlmICghdGhpcy5vcHRpb25zLmFuaW1hdGlvbikgcmV0dXJuO1xuICAgICAgdmFyIGNoaWxkcmVuID0gW10uc2xpY2UuY2FsbCh0aGlzLmVsLmNoaWxkcmVuKTtcbiAgICAgIGNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgICAgIGlmIChjc3MoY2hpbGQsICdkaXNwbGF5JykgPT09ICdub25lJyB8fCBjaGlsZCA9PT0gU29ydGFibGUuZ2hvc3QpIHJldHVybjtcbiAgICAgICAgYW5pbWF0aW9uU3RhdGVzLnB1c2goe1xuICAgICAgICAgIHRhcmdldDogY2hpbGQsXG4gICAgICAgICAgcmVjdDogZ2V0UmVjdChjaGlsZClcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBmcm9tUmVjdCA9IF9vYmplY3RTcHJlYWQyKHt9LCBhbmltYXRpb25TdGF0ZXNbYW5pbWF0aW9uU3RhdGVzLmxlbmd0aCAtIDFdLnJlY3QpO1xuXG4gICAgICAgIC8vIElmIGFuaW1hdGluZzogY29tcGVuc2F0ZSBmb3IgY3VycmVudCBhbmltYXRpb25cbiAgICAgICAgaWYgKGNoaWxkLnRoaXNBbmltYXRpb25EdXJhdGlvbikge1xuICAgICAgICAgIHZhciBjaGlsZE1hdHJpeCA9IG1hdHJpeChjaGlsZCwgdHJ1ZSk7XG4gICAgICAgICAgaWYgKGNoaWxkTWF0cml4KSB7XG4gICAgICAgICAgICBmcm9tUmVjdC50b3AgLT0gY2hpbGRNYXRyaXguZjtcbiAgICAgICAgICAgIGZyb21SZWN0LmxlZnQgLT0gY2hpbGRNYXRyaXguZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2hpbGQuZnJvbVJlY3QgPSBmcm9tUmVjdDtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgYWRkQW5pbWF0aW9uU3RhdGU6IGZ1bmN0aW9uIGFkZEFuaW1hdGlvblN0YXRlKHN0YXRlKSB7XG4gICAgICBhbmltYXRpb25TdGF0ZXMucHVzaChzdGF0ZSk7XG4gICAgfSxcbiAgICByZW1vdmVBbmltYXRpb25TdGF0ZTogZnVuY3Rpb24gcmVtb3ZlQW5pbWF0aW9uU3RhdGUodGFyZ2V0KSB7XG4gICAgICBhbmltYXRpb25TdGF0ZXMuc3BsaWNlKGluZGV4T2ZPYmplY3QoYW5pbWF0aW9uU3RhdGVzLCB7XG4gICAgICAgIHRhcmdldDogdGFyZ2V0XG4gICAgICB9KSwgMSk7XG4gICAgfSxcbiAgICBhbmltYXRlQWxsOiBmdW5jdGlvbiBhbmltYXRlQWxsKGNhbGxiYWNrKSB7XG4gICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuYW5pbWF0aW9uKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChhbmltYXRpb25DYWxsYmFja0lkKTtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdmFyIGFuaW1hdGluZyA9IGZhbHNlLFxuICAgICAgICBhbmltYXRpb25UaW1lID0gMDtcbiAgICAgIGFuaW1hdGlvblN0YXRlcy5mb3JFYWNoKGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICB2YXIgdGltZSA9IDAsXG4gICAgICAgICAgdGFyZ2V0ID0gc3RhdGUudGFyZ2V0LFxuICAgICAgICAgIGZyb21SZWN0ID0gdGFyZ2V0LmZyb21SZWN0LFxuICAgICAgICAgIHRvUmVjdCA9IGdldFJlY3QodGFyZ2V0KSxcbiAgICAgICAgICBwcmV2RnJvbVJlY3QgPSB0YXJnZXQucHJldkZyb21SZWN0LFxuICAgICAgICAgIHByZXZUb1JlY3QgPSB0YXJnZXQucHJldlRvUmVjdCxcbiAgICAgICAgICBhbmltYXRpbmdSZWN0ID0gc3RhdGUucmVjdCxcbiAgICAgICAgICB0YXJnZXRNYXRyaXggPSBtYXRyaXgodGFyZ2V0LCB0cnVlKTtcbiAgICAgICAgaWYgKHRhcmdldE1hdHJpeCkge1xuICAgICAgICAgIC8vIENvbXBlbnNhdGUgZm9yIGN1cnJlbnQgYW5pbWF0aW9uXG4gICAgICAgICAgdG9SZWN0LnRvcCAtPSB0YXJnZXRNYXRyaXguZjtcbiAgICAgICAgICB0b1JlY3QubGVmdCAtPSB0YXJnZXRNYXRyaXguZTtcbiAgICAgICAgfVxuICAgICAgICB0YXJnZXQudG9SZWN0ID0gdG9SZWN0O1xuICAgICAgICBpZiAodGFyZ2V0LnRoaXNBbmltYXRpb25EdXJhdGlvbikge1xuICAgICAgICAgIC8vIENvdWxkIGFsc28gY2hlY2sgaWYgYW5pbWF0aW5nUmVjdCBpcyBiZXR3ZWVuIGZyb21SZWN0IGFuZCB0b1JlY3RcbiAgICAgICAgICBpZiAoaXNSZWN0RXF1YWwocHJldkZyb21SZWN0LCB0b1JlY3QpICYmICFpc1JlY3RFcXVhbChmcm9tUmVjdCwgdG9SZWN0KSAmJlxuICAgICAgICAgIC8vIE1ha2Ugc3VyZSBhbmltYXRpbmdSZWN0IGlzIG9uIGxpbmUgYmV0d2VlbiB0b1JlY3QgJiBmcm9tUmVjdFxuICAgICAgICAgIChhbmltYXRpbmdSZWN0LnRvcCAtIHRvUmVjdC50b3ApIC8gKGFuaW1hdGluZ1JlY3QubGVmdCAtIHRvUmVjdC5sZWZ0KSA9PT0gKGZyb21SZWN0LnRvcCAtIHRvUmVjdC50b3ApIC8gKGZyb21SZWN0LmxlZnQgLSB0b1JlY3QubGVmdCkpIHtcbiAgICAgICAgICAgIC8vIElmIHJldHVybmluZyB0byBzYW1lIHBsYWNlIGFzIHN0YXJ0ZWQgZnJvbSBhbmltYXRpb24gYW5kIG9uIHNhbWUgYXhpc1xuICAgICAgICAgICAgdGltZSA9IGNhbGN1bGF0ZVJlYWxUaW1lKGFuaW1hdGluZ1JlY3QsIHByZXZGcm9tUmVjdCwgcHJldlRvUmVjdCwgX3RoaXMub3B0aW9ucyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgZnJvbVJlY3QgIT0gdG9SZWN0OiBhbmltYXRlXG4gICAgICAgIGlmICghaXNSZWN0RXF1YWwodG9SZWN0LCBmcm9tUmVjdCkpIHtcbiAgICAgICAgICB0YXJnZXQucHJldkZyb21SZWN0ID0gZnJvbVJlY3Q7XG4gICAgICAgICAgdGFyZ2V0LnByZXZUb1JlY3QgPSB0b1JlY3Q7XG4gICAgICAgICAgaWYgKCF0aW1lKSB7XG4gICAgICAgICAgICB0aW1lID0gX3RoaXMub3B0aW9ucy5hbmltYXRpb247XG4gICAgICAgICAgfVxuICAgICAgICAgIF90aGlzLmFuaW1hdGUodGFyZ2V0LCBhbmltYXRpbmdSZWN0LCB0b1JlY3QsIHRpbWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aW1lKSB7XG4gICAgICAgICAgYW5pbWF0aW5nID0gdHJ1ZTtcbiAgICAgICAgICBhbmltYXRpb25UaW1lID0gTWF0aC5tYXgoYW5pbWF0aW9uVGltZSwgdGltZSk7XG4gICAgICAgICAgY2xlYXJUaW1lb3V0KHRhcmdldC5hbmltYXRpb25SZXNldFRpbWVyKTtcbiAgICAgICAgICB0YXJnZXQuYW5pbWF0aW9uUmVzZXRUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGFyZ2V0LmFuaW1hdGlvblRpbWUgPSAwO1xuICAgICAgICAgICAgdGFyZ2V0LnByZXZGcm9tUmVjdCA9IG51bGw7XG4gICAgICAgICAgICB0YXJnZXQuZnJvbVJlY3QgPSBudWxsO1xuICAgICAgICAgICAgdGFyZ2V0LnByZXZUb1JlY3QgPSBudWxsO1xuICAgICAgICAgICAgdGFyZ2V0LnRoaXNBbmltYXRpb25EdXJhdGlvbiA9IG51bGw7XG4gICAgICAgICAgfSwgdGltZSk7XG4gICAgICAgICAgdGFyZ2V0LnRoaXNBbmltYXRpb25EdXJhdGlvbiA9IHRpbWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgY2xlYXJUaW1lb3V0KGFuaW1hdGlvbkNhbGxiYWNrSWQpO1xuICAgICAgaWYgKCFhbmltYXRpbmcpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFuaW1hdGlvbkNhbGxiYWNrSWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjaygpO1xuICAgICAgICB9LCBhbmltYXRpb25UaW1lKTtcbiAgICAgIH1cbiAgICAgIGFuaW1hdGlvblN0YXRlcyA9IFtdO1xuICAgIH0sXG4gICAgYW5pbWF0ZTogZnVuY3Rpb24gYW5pbWF0ZSh0YXJnZXQsIGN1cnJlbnRSZWN0LCB0b1JlY3QsIGR1cmF0aW9uKSB7XG4gICAgICBpZiAoZHVyYXRpb24pIHtcbiAgICAgICAgY3NzKHRhcmdldCwgJ3RyYW5zaXRpb24nLCAnJyk7XG4gICAgICAgIGNzcyh0YXJnZXQsICd0cmFuc2Zvcm0nLCAnJyk7XG4gICAgICAgIHZhciBlbE1hdHJpeCA9IG1hdHJpeCh0aGlzLmVsKSxcbiAgICAgICAgICBzY2FsZVggPSBlbE1hdHJpeCAmJiBlbE1hdHJpeC5hLFxuICAgICAgICAgIHNjYWxlWSA9IGVsTWF0cml4ICYmIGVsTWF0cml4LmQsXG4gICAgICAgICAgdHJhbnNsYXRlWCA9IChjdXJyZW50UmVjdC5sZWZ0IC0gdG9SZWN0LmxlZnQpIC8gKHNjYWxlWCB8fCAxKSxcbiAgICAgICAgICB0cmFuc2xhdGVZID0gKGN1cnJlbnRSZWN0LnRvcCAtIHRvUmVjdC50b3ApIC8gKHNjYWxlWSB8fCAxKTtcbiAgICAgICAgdGFyZ2V0LmFuaW1hdGluZ1ggPSAhIXRyYW5zbGF0ZVg7XG4gICAgICAgIHRhcmdldC5hbmltYXRpbmdZID0gISF0cmFuc2xhdGVZO1xuICAgICAgICBjc3ModGFyZ2V0LCAndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZTNkKCcgKyB0cmFuc2xhdGVYICsgJ3B4LCcgKyB0cmFuc2xhdGVZICsgJ3B4LDApJyk7XG4gICAgICAgIHRoaXMuZm9yUmVwYWludER1bW15ID0gcmVwYWludCh0YXJnZXQpOyAvLyByZXBhaW50XG5cbiAgICAgICAgY3NzKHRhcmdldCwgJ3RyYW5zaXRpb24nLCAndHJhbnNmb3JtICcgKyBkdXJhdGlvbiArICdtcycgKyAodGhpcy5vcHRpb25zLmVhc2luZyA/ICcgJyArIHRoaXMub3B0aW9ucy5lYXNpbmcgOiAnJykpO1xuICAgICAgICBjc3ModGFyZ2V0LCAndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZTNkKDAsMCwwKScpO1xuICAgICAgICB0eXBlb2YgdGFyZ2V0LmFuaW1hdGVkID09PSAnbnVtYmVyJyAmJiBjbGVhclRpbWVvdXQodGFyZ2V0LmFuaW1hdGVkKTtcbiAgICAgICAgdGFyZ2V0LmFuaW1hdGVkID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY3NzKHRhcmdldCwgJ3RyYW5zaXRpb24nLCAnJyk7XG4gICAgICAgICAgY3NzKHRhcmdldCwgJ3RyYW5zZm9ybScsICcnKTtcbiAgICAgICAgICB0YXJnZXQuYW5pbWF0ZWQgPSBmYWxzZTtcbiAgICAgICAgICB0YXJnZXQuYW5pbWF0aW5nWCA9IGZhbHNlO1xuICAgICAgICAgIHRhcmdldC5hbmltYXRpbmdZID0gZmFsc2U7XG4gICAgICAgIH0sIGR1cmF0aW9uKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG59XG5mdW5jdGlvbiByZXBhaW50KHRhcmdldCkge1xuICByZXR1cm4gdGFyZ2V0Lm9mZnNldFdpZHRoO1xufVxuZnVuY3Rpb24gY2FsY3VsYXRlUmVhbFRpbWUoYW5pbWF0aW5nUmVjdCwgZnJvbVJlY3QsIHRvUmVjdCwgb3B0aW9ucykge1xuICByZXR1cm4gTWF0aC5zcXJ0KE1hdGgucG93KGZyb21SZWN0LnRvcCAtIGFuaW1hdGluZ1JlY3QudG9wLCAyKSArIE1hdGgucG93KGZyb21SZWN0LmxlZnQgLSBhbmltYXRpbmdSZWN0LmxlZnQsIDIpKSAvIE1hdGguc3FydChNYXRoLnBvdyhmcm9tUmVjdC50b3AgLSB0b1JlY3QudG9wLCAyKSArIE1hdGgucG93KGZyb21SZWN0LmxlZnQgLSB0b1JlY3QubGVmdCwgMikpICogb3B0aW9ucy5hbmltYXRpb247XG59XG5cbnZhciBwbHVnaW5zID0gW107XG52YXIgZGVmYXVsdHMgPSB7XG4gIGluaXRpYWxpemVCeURlZmF1bHQ6IHRydWVcbn07XG52YXIgUGx1Z2luTWFuYWdlciA9IHtcbiAgbW91bnQ6IGZ1bmN0aW9uIG1vdW50KHBsdWdpbikge1xuICAgIC8vIFNldCBkZWZhdWx0IHN0YXRpYyBwcm9wZXJ0aWVzXG4gICAgZm9yICh2YXIgb3B0aW9uIGluIGRlZmF1bHRzKSB7XG4gICAgICBpZiAoZGVmYXVsdHMuaGFzT3duUHJvcGVydHkob3B0aW9uKSAmJiAhKG9wdGlvbiBpbiBwbHVnaW4pKSB7XG4gICAgICAgIHBsdWdpbltvcHRpb25dID0gZGVmYXVsdHNbb3B0aW9uXTtcbiAgICAgIH1cbiAgICB9XG4gICAgcGx1Z2lucy5mb3JFYWNoKGZ1bmN0aW9uIChwKSB7XG4gICAgICBpZiAocC5wbHVnaW5OYW1lID09PSBwbHVnaW4ucGx1Z2luTmFtZSkge1xuICAgICAgICB0aHJvdyBcIlNvcnRhYmxlOiBDYW5ub3QgbW91bnQgcGx1Z2luIFwiLmNvbmNhdChwbHVnaW4ucGx1Z2luTmFtZSwgXCIgbW9yZSB0aGFuIG9uY2VcIik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcGx1Z2lucy5wdXNoKHBsdWdpbik7XG4gIH0sXG4gIHBsdWdpbkV2ZW50OiBmdW5jdGlvbiBwbHVnaW5FdmVudChldmVudE5hbWUsIHNvcnRhYmxlLCBldnQpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHRoaXMuZXZlbnRDYW5jZWxlZCA9IGZhbHNlO1xuICAgIGV2dC5jYW5jZWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBfdGhpcy5ldmVudENhbmNlbGVkID0gdHJ1ZTtcbiAgICB9O1xuICAgIHZhciBldmVudE5hbWVHbG9iYWwgPSBldmVudE5hbWUgKyAnR2xvYmFsJztcbiAgICBwbHVnaW5zLmZvckVhY2goZnVuY3Rpb24gKHBsdWdpbikge1xuICAgICAgaWYgKCFzb3J0YWJsZVtwbHVnaW4ucGx1Z2luTmFtZV0pIHJldHVybjtcbiAgICAgIC8vIEZpcmUgZ2xvYmFsIGV2ZW50cyBpZiBpdCBleGlzdHMgaW4gdGhpcyBzb3J0YWJsZVxuICAgICAgaWYgKHNvcnRhYmxlW3BsdWdpbi5wbHVnaW5OYW1lXVtldmVudE5hbWVHbG9iYWxdKSB7XG4gICAgICAgIHNvcnRhYmxlW3BsdWdpbi5wbHVnaW5OYW1lXVtldmVudE5hbWVHbG9iYWxdKF9vYmplY3RTcHJlYWQyKHtcbiAgICAgICAgICBzb3J0YWJsZTogc29ydGFibGVcbiAgICAgICAgfSwgZXZ0KSk7XG4gICAgICB9XG5cbiAgICAgIC8vIE9ubHkgZmlyZSBwbHVnaW4gZXZlbnQgaWYgcGx1Z2luIGlzIGVuYWJsZWQgaW4gdGhpcyBzb3J0YWJsZSxcbiAgICAgIC8vIGFuZCBwbHVnaW4gaGFzIGV2ZW50IGRlZmluZWRcbiAgICAgIGlmIChzb3J0YWJsZS5vcHRpb25zW3BsdWdpbi5wbHVnaW5OYW1lXSAmJiBzb3J0YWJsZVtwbHVnaW4ucGx1Z2luTmFtZV1bZXZlbnROYW1lXSkge1xuICAgICAgICBzb3J0YWJsZVtwbHVnaW4ucGx1Z2luTmFtZV1bZXZlbnROYW1lXShfb2JqZWN0U3ByZWFkMih7XG4gICAgICAgICAgc29ydGFibGU6IHNvcnRhYmxlXG4gICAgICAgIH0sIGV2dCkpO1xuICAgICAgfVxuICAgIH0pO1xuICB9LFxuICBpbml0aWFsaXplUGx1Z2luczogZnVuY3Rpb24gaW5pdGlhbGl6ZVBsdWdpbnMoc29ydGFibGUsIGVsLCBkZWZhdWx0cywgb3B0aW9ucykge1xuICAgIHBsdWdpbnMuZm9yRWFjaChmdW5jdGlvbiAocGx1Z2luKSB7XG4gICAgICB2YXIgcGx1Z2luTmFtZSA9IHBsdWdpbi5wbHVnaW5OYW1lO1xuICAgICAgaWYgKCFzb3J0YWJsZS5vcHRpb25zW3BsdWdpbk5hbWVdICYmICFwbHVnaW4uaW5pdGlhbGl6ZUJ5RGVmYXVsdCkgcmV0dXJuO1xuICAgICAgdmFyIGluaXRpYWxpemVkID0gbmV3IHBsdWdpbihzb3J0YWJsZSwgZWwsIHNvcnRhYmxlLm9wdGlvbnMpO1xuICAgICAgaW5pdGlhbGl6ZWQuc29ydGFibGUgPSBzb3J0YWJsZTtcbiAgICAgIGluaXRpYWxpemVkLm9wdGlvbnMgPSBzb3J0YWJsZS5vcHRpb25zO1xuICAgICAgc29ydGFibGVbcGx1Z2luTmFtZV0gPSBpbml0aWFsaXplZDtcblxuICAgICAgLy8gQWRkIGRlZmF1bHQgb3B0aW9ucyBmcm9tIHBsdWdpblxuICAgICAgX2V4dGVuZHMoZGVmYXVsdHMsIGluaXRpYWxpemVkLmRlZmF1bHRzKTtcbiAgICB9KTtcbiAgICBmb3IgKHZhciBvcHRpb24gaW4gc29ydGFibGUub3B0aW9ucykge1xuICAgICAgaWYgKCFzb3J0YWJsZS5vcHRpb25zLmhhc093blByb3BlcnR5KG9wdGlvbikpIGNvbnRpbnVlO1xuICAgICAgdmFyIG1vZGlmaWVkID0gdGhpcy5tb2RpZnlPcHRpb24oc29ydGFibGUsIG9wdGlvbiwgc29ydGFibGUub3B0aW9uc1tvcHRpb25dKTtcbiAgICAgIGlmICh0eXBlb2YgbW9kaWZpZWQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHNvcnRhYmxlLm9wdGlvbnNbb3B0aW9uXSA9IG1vZGlmaWVkO1xuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgZ2V0RXZlbnRQcm9wZXJ0aWVzOiBmdW5jdGlvbiBnZXRFdmVudFByb3BlcnRpZXMobmFtZSwgc29ydGFibGUpIHtcbiAgICB2YXIgZXZlbnRQcm9wZXJ0aWVzID0ge307XG4gICAgcGx1Z2lucy5mb3JFYWNoKGZ1bmN0aW9uIChwbHVnaW4pIHtcbiAgICAgIGlmICh0eXBlb2YgcGx1Z2luLmV2ZW50UHJvcGVydGllcyAhPT0gJ2Z1bmN0aW9uJykgcmV0dXJuO1xuICAgICAgX2V4dGVuZHMoZXZlbnRQcm9wZXJ0aWVzLCBwbHVnaW4uZXZlbnRQcm9wZXJ0aWVzLmNhbGwoc29ydGFibGVbcGx1Z2luLnBsdWdpbk5hbWVdLCBuYW1lKSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGV2ZW50UHJvcGVydGllcztcbiAgfSxcbiAgbW9kaWZ5T3B0aW9uOiBmdW5jdGlvbiBtb2RpZnlPcHRpb24oc29ydGFibGUsIG5hbWUsIHZhbHVlKSB7XG4gICAgdmFyIG1vZGlmaWVkVmFsdWU7XG4gICAgcGx1Z2lucy5mb3JFYWNoKGZ1bmN0aW9uIChwbHVnaW4pIHtcbiAgICAgIC8vIFBsdWdpbiBtdXN0IGV4aXN0IG9uIHRoZSBTb3J0YWJsZVxuICAgICAgaWYgKCFzb3J0YWJsZVtwbHVnaW4ucGx1Z2luTmFtZV0pIHJldHVybjtcblxuICAgICAgLy8gSWYgc3RhdGljIG9wdGlvbiBsaXN0ZW5lciBleGlzdHMgZm9yIHRoaXMgb3B0aW9uLCBjYWxsIGluIHRoZSBjb250ZXh0IG9mIHRoZSBTb3J0YWJsZSdzIGluc3RhbmNlIG9mIHRoaXMgcGx1Z2luXG4gICAgICBpZiAocGx1Z2luLm9wdGlvbkxpc3RlbmVycyAmJiB0eXBlb2YgcGx1Z2luLm9wdGlvbkxpc3RlbmVyc1tuYW1lXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBtb2RpZmllZFZhbHVlID0gcGx1Z2luLm9wdGlvbkxpc3RlbmVyc1tuYW1lXS5jYWxsKHNvcnRhYmxlW3BsdWdpbi5wbHVnaW5OYW1lXSwgdmFsdWUpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBtb2RpZmllZFZhbHVlO1xuICB9XG59O1xuXG5mdW5jdGlvbiBkaXNwYXRjaEV2ZW50KF9yZWYpIHtcbiAgdmFyIHNvcnRhYmxlID0gX3JlZi5zb3J0YWJsZSxcbiAgICByb290RWwgPSBfcmVmLnJvb3RFbCxcbiAgICBuYW1lID0gX3JlZi5uYW1lLFxuICAgIHRhcmdldEVsID0gX3JlZi50YXJnZXRFbCxcbiAgICBjbG9uZUVsID0gX3JlZi5jbG9uZUVsLFxuICAgIHRvRWwgPSBfcmVmLnRvRWwsXG4gICAgZnJvbUVsID0gX3JlZi5mcm9tRWwsXG4gICAgb2xkSW5kZXggPSBfcmVmLm9sZEluZGV4LFxuICAgIG5ld0luZGV4ID0gX3JlZi5uZXdJbmRleCxcbiAgICBvbGREcmFnZ2FibGVJbmRleCA9IF9yZWYub2xkRHJhZ2dhYmxlSW5kZXgsXG4gICAgbmV3RHJhZ2dhYmxlSW5kZXggPSBfcmVmLm5ld0RyYWdnYWJsZUluZGV4LFxuICAgIG9yaWdpbmFsRXZlbnQgPSBfcmVmLm9yaWdpbmFsRXZlbnQsXG4gICAgcHV0U29ydGFibGUgPSBfcmVmLnB1dFNvcnRhYmxlLFxuICAgIGV4dHJhRXZlbnRQcm9wZXJ0aWVzID0gX3JlZi5leHRyYUV2ZW50UHJvcGVydGllcztcbiAgc29ydGFibGUgPSBzb3J0YWJsZSB8fCByb290RWwgJiYgcm9vdEVsW2V4cGFuZG9dO1xuICBpZiAoIXNvcnRhYmxlKSByZXR1cm47XG4gIHZhciBldnQsXG4gICAgb3B0aW9ucyA9IHNvcnRhYmxlLm9wdGlvbnMsXG4gICAgb25OYW1lID0gJ29uJyArIG5hbWUuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBuYW1lLnN1YnN0cigxKTtcbiAgLy8gU3VwcG9ydCBmb3IgbmV3IEN1c3RvbUV2ZW50IGZlYXR1cmVcbiAgaWYgKHdpbmRvdy5DdXN0b21FdmVudCAmJiAhSUUxMU9yTGVzcyAmJiAhRWRnZSkge1xuICAgIGV2dCA9IG5ldyBDdXN0b21FdmVudChuYW1lLCB7XG4gICAgICBidWJibGVzOiB0cnVlLFxuICAgICAgY2FuY2VsYWJsZTogdHJ1ZVxuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIGV2dCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdFdmVudCcpO1xuICAgIGV2dC5pbml0RXZlbnQobmFtZSwgdHJ1ZSwgdHJ1ZSk7XG4gIH1cbiAgZXZ0LnRvID0gdG9FbCB8fCByb290RWw7XG4gIGV2dC5mcm9tID0gZnJvbUVsIHx8IHJvb3RFbDtcbiAgZXZ0Lml0ZW0gPSB0YXJnZXRFbCB8fCByb290RWw7XG4gIGV2dC5jbG9uZSA9IGNsb25lRWw7XG4gIGV2dC5vbGRJbmRleCA9IG9sZEluZGV4O1xuICBldnQubmV3SW5kZXggPSBuZXdJbmRleDtcbiAgZXZ0Lm9sZERyYWdnYWJsZUluZGV4ID0gb2xkRHJhZ2dhYmxlSW5kZXg7XG4gIGV2dC5uZXdEcmFnZ2FibGVJbmRleCA9IG5ld0RyYWdnYWJsZUluZGV4O1xuICBldnQub3JpZ2luYWxFdmVudCA9IG9yaWdpbmFsRXZlbnQ7XG4gIGV2dC5wdWxsTW9kZSA9IHB1dFNvcnRhYmxlID8gcHV0U29ydGFibGUubGFzdFB1dE1vZGUgOiB1bmRlZmluZWQ7XG4gIHZhciBhbGxFdmVudFByb3BlcnRpZXMgPSBfb2JqZWN0U3ByZWFkMihfb2JqZWN0U3ByZWFkMih7fSwgZXh0cmFFdmVudFByb3BlcnRpZXMpLCBQbHVnaW5NYW5hZ2VyLmdldEV2ZW50UHJvcGVydGllcyhuYW1lLCBzb3J0YWJsZSkpO1xuICBmb3IgKHZhciBvcHRpb24gaW4gYWxsRXZlbnRQcm9wZXJ0aWVzKSB7XG4gICAgZXZ0W29wdGlvbl0gPSBhbGxFdmVudFByb3BlcnRpZXNbb3B0aW9uXTtcbiAgfVxuICBpZiAocm9vdEVsKSB7XG4gICAgcm9vdEVsLmRpc3BhdGNoRXZlbnQoZXZ0KTtcbiAgfVxuICBpZiAob3B0aW9uc1tvbk5hbWVdKSB7XG4gICAgb3B0aW9uc1tvbk5hbWVdLmNhbGwoc29ydGFibGUsIGV2dCk7XG4gIH1cbn1cblxudmFyIF9leGNsdWRlZCA9IFtcImV2dFwiXTtcbnZhciBwbHVnaW5FdmVudCA9IGZ1bmN0aW9uIHBsdWdpbkV2ZW50KGV2ZW50TmFtZSwgc29ydGFibGUpIHtcbiAgdmFyIF9yZWYgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6IHt9LFxuICAgIG9yaWdpbmFsRXZlbnQgPSBfcmVmLmV2dCxcbiAgICBkYXRhID0gX29iamVjdFdpdGhvdXRQcm9wZXJ0aWVzKF9yZWYsIF9leGNsdWRlZCk7XG4gIFBsdWdpbk1hbmFnZXIucGx1Z2luRXZlbnQuYmluZChTb3J0YWJsZSkoZXZlbnROYW1lLCBzb3J0YWJsZSwgX29iamVjdFNwcmVhZDIoe1xuICAgIGRyYWdFbDogZHJhZ0VsLFxuICAgIHBhcmVudEVsOiBwYXJlbnRFbCxcbiAgICBnaG9zdEVsOiBnaG9zdEVsLFxuICAgIHJvb3RFbDogcm9vdEVsLFxuICAgIG5leHRFbDogbmV4dEVsLFxuICAgIGxhc3REb3duRWw6IGxhc3REb3duRWwsXG4gICAgY2xvbmVFbDogY2xvbmVFbCxcbiAgICBjbG9uZUhpZGRlbjogY2xvbmVIaWRkZW4sXG4gICAgZHJhZ1N0YXJ0ZWQ6IG1vdmVkLFxuICAgIHB1dFNvcnRhYmxlOiBwdXRTb3J0YWJsZSxcbiAgICBhY3RpdmVTb3J0YWJsZTogU29ydGFibGUuYWN0aXZlLFxuICAgIG9yaWdpbmFsRXZlbnQ6IG9yaWdpbmFsRXZlbnQsXG4gICAgb2xkSW5kZXg6IG9sZEluZGV4LFxuICAgIG9sZERyYWdnYWJsZUluZGV4OiBvbGREcmFnZ2FibGVJbmRleCxcbiAgICBuZXdJbmRleDogbmV3SW5kZXgsXG4gICAgbmV3RHJhZ2dhYmxlSW5kZXg6IG5ld0RyYWdnYWJsZUluZGV4LFxuICAgIGhpZGVHaG9zdEZvclRhcmdldDogX2hpZGVHaG9zdEZvclRhcmdldCxcbiAgICB1bmhpZGVHaG9zdEZvclRhcmdldDogX3VuaGlkZUdob3N0Rm9yVGFyZ2V0LFxuICAgIGNsb25lTm93SGlkZGVuOiBmdW5jdGlvbiBjbG9uZU5vd0hpZGRlbigpIHtcbiAgICAgIGNsb25lSGlkZGVuID0gdHJ1ZTtcbiAgICB9LFxuICAgIGNsb25lTm93U2hvd246IGZ1bmN0aW9uIGNsb25lTm93U2hvd24oKSB7XG4gICAgICBjbG9uZUhpZGRlbiA9IGZhbHNlO1xuICAgIH0sXG4gICAgZGlzcGF0Y2hTb3J0YWJsZUV2ZW50OiBmdW5jdGlvbiBkaXNwYXRjaFNvcnRhYmxlRXZlbnQobmFtZSkge1xuICAgICAgX2Rpc3BhdGNoRXZlbnQoe1xuICAgICAgICBzb3J0YWJsZTogc29ydGFibGUsXG4gICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgIG9yaWdpbmFsRXZlbnQ6IG9yaWdpbmFsRXZlbnRcbiAgICAgIH0pO1xuICAgIH1cbiAgfSwgZGF0YSkpO1xufTtcbmZ1bmN0aW9uIF9kaXNwYXRjaEV2ZW50KGluZm8pIHtcbiAgZGlzcGF0Y2hFdmVudChfb2JqZWN0U3ByZWFkMih7XG4gICAgcHV0U29ydGFibGU6IHB1dFNvcnRhYmxlLFxuICAgIGNsb25lRWw6IGNsb25lRWwsXG4gICAgdGFyZ2V0RWw6IGRyYWdFbCxcbiAgICByb290RWw6IHJvb3RFbCxcbiAgICBvbGRJbmRleDogb2xkSW5kZXgsXG4gICAgb2xkRHJhZ2dhYmxlSW5kZXg6IG9sZERyYWdnYWJsZUluZGV4LFxuICAgIG5ld0luZGV4OiBuZXdJbmRleCxcbiAgICBuZXdEcmFnZ2FibGVJbmRleDogbmV3RHJhZ2dhYmxlSW5kZXhcbiAgfSwgaW5mbykpO1xufVxudmFyIGRyYWdFbCxcbiAgcGFyZW50RWwsXG4gIGdob3N0RWwsXG4gIHJvb3RFbCxcbiAgbmV4dEVsLFxuICBsYXN0RG93bkVsLFxuICBjbG9uZUVsLFxuICBjbG9uZUhpZGRlbixcbiAgb2xkSW5kZXgsXG4gIG5ld0luZGV4LFxuICBvbGREcmFnZ2FibGVJbmRleCxcbiAgbmV3RHJhZ2dhYmxlSW5kZXgsXG4gIGFjdGl2ZUdyb3VwLFxuICBwdXRTb3J0YWJsZSxcbiAgYXdhaXRpbmdEcmFnU3RhcnRlZCA9IGZhbHNlLFxuICBpZ25vcmVOZXh0Q2xpY2sgPSBmYWxzZSxcbiAgc29ydGFibGVzID0gW10sXG4gIHRhcEV2dCxcbiAgdG91Y2hFdnQsXG4gIGxhc3REeCxcbiAgbGFzdER5LFxuICB0YXBEaXN0YW5jZUxlZnQsXG4gIHRhcERpc3RhbmNlVG9wLFxuICBtb3ZlZCxcbiAgbGFzdFRhcmdldCxcbiAgbGFzdERpcmVjdGlvbixcbiAgcGFzdEZpcnN0SW52ZXJ0VGhyZXNoID0gZmFsc2UsXG4gIGlzQ2lyY3Vtc3RhbnRpYWxJbnZlcnQgPSBmYWxzZSxcbiAgdGFyZ2V0TW92ZURpc3RhbmNlLFxuICAvLyBGb3IgcG9zaXRpb25pbmcgZ2hvc3QgYWJzb2x1dGVseVxuICBnaG9zdFJlbGF0aXZlUGFyZW50LFxuICBnaG9zdFJlbGF0aXZlUGFyZW50SW5pdGlhbFNjcm9sbCA9IFtdLFxuICAvLyAobGVmdCwgdG9wKVxuXG4gIF9zaWxlbnQgPSBmYWxzZSxcbiAgc2F2ZWRJbnB1dENoZWNrZWQgPSBbXTtcblxuLyoqIEBjb25zdCAqL1xudmFyIGRvY3VtZW50RXhpc3RzID0gdHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyxcbiAgUG9zaXRpb25HaG9zdEFic29sdXRlbHkgPSBJT1MsXG4gIENTU0Zsb2F0UHJvcGVydHkgPSBFZGdlIHx8IElFMTFPckxlc3MgPyAnY3NzRmxvYXQnIDogJ2Zsb2F0JyxcbiAgLy8gVGhpcyB3aWxsIG5vdCBwYXNzIGZvciBJRTksIGJlY2F1c2UgSUU5IERuRCBvbmx5IHdvcmtzIG9uIGFuY2hvcnNcbiAgc3VwcG9ydERyYWdnYWJsZSA9IGRvY3VtZW50RXhpc3RzICYmICFDaHJvbWVGb3JBbmRyb2lkICYmICFJT1MgJiYgJ2RyYWdnYWJsZScgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG4gIHN1cHBvcnRDc3NQb2ludGVyRXZlbnRzID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICghZG9jdW1lbnRFeGlzdHMpIHJldHVybjtcbiAgICAvLyBmYWxzZSB3aGVuIDw9IElFMTFcbiAgICBpZiAoSUUxMU9yTGVzcykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd4Jyk7XG4gICAgZWwuc3R5bGUuY3NzVGV4dCA9ICdwb2ludGVyLWV2ZW50czphdXRvJztcbiAgICByZXR1cm4gZWwuc3R5bGUucG9pbnRlckV2ZW50cyA9PT0gJ2F1dG8nO1xuICB9KCksXG4gIF9kZXRlY3REaXJlY3Rpb24gPSBmdW5jdGlvbiBfZGV0ZWN0RGlyZWN0aW9uKGVsLCBvcHRpb25zKSB7XG4gICAgdmFyIGVsQ1NTID0gY3NzKGVsKSxcbiAgICAgIGVsV2lkdGggPSBwYXJzZUludChlbENTUy53aWR0aCkgLSBwYXJzZUludChlbENTUy5wYWRkaW5nTGVmdCkgLSBwYXJzZUludChlbENTUy5wYWRkaW5nUmlnaHQpIC0gcGFyc2VJbnQoZWxDU1MuYm9yZGVyTGVmdFdpZHRoKSAtIHBhcnNlSW50KGVsQ1NTLmJvcmRlclJpZ2h0V2lkdGgpLFxuICAgICAgY2hpbGQxID0gZ2V0Q2hpbGQoZWwsIDAsIG9wdGlvbnMpLFxuICAgICAgY2hpbGQyID0gZ2V0Q2hpbGQoZWwsIDEsIG9wdGlvbnMpLFxuICAgICAgZmlyc3RDaGlsZENTUyA9IGNoaWxkMSAmJiBjc3MoY2hpbGQxKSxcbiAgICAgIHNlY29uZENoaWxkQ1NTID0gY2hpbGQyICYmIGNzcyhjaGlsZDIpLFxuICAgICAgZmlyc3RDaGlsZFdpZHRoID0gZmlyc3RDaGlsZENTUyAmJiBwYXJzZUludChmaXJzdENoaWxkQ1NTLm1hcmdpbkxlZnQpICsgcGFyc2VJbnQoZmlyc3RDaGlsZENTUy5tYXJnaW5SaWdodCkgKyBnZXRSZWN0KGNoaWxkMSkud2lkdGgsXG4gICAgICBzZWNvbmRDaGlsZFdpZHRoID0gc2Vjb25kQ2hpbGRDU1MgJiYgcGFyc2VJbnQoc2Vjb25kQ2hpbGRDU1MubWFyZ2luTGVmdCkgKyBwYXJzZUludChzZWNvbmRDaGlsZENTUy5tYXJnaW5SaWdodCkgKyBnZXRSZWN0KGNoaWxkMikud2lkdGg7XG4gICAgaWYgKGVsQ1NTLmRpc3BsYXkgPT09ICdmbGV4Jykge1xuICAgICAgcmV0dXJuIGVsQ1NTLmZsZXhEaXJlY3Rpb24gPT09ICdjb2x1bW4nIHx8IGVsQ1NTLmZsZXhEaXJlY3Rpb24gPT09ICdjb2x1bW4tcmV2ZXJzZScgPyAndmVydGljYWwnIDogJ2hvcml6b250YWwnO1xuICAgIH1cbiAgICBpZiAoZWxDU1MuZGlzcGxheSA9PT0gJ2dyaWQnKSB7XG4gICAgICByZXR1cm4gZWxDU1MuZ3JpZFRlbXBsYXRlQ29sdW1ucy5zcGxpdCgnICcpLmxlbmd0aCA8PSAxID8gJ3ZlcnRpY2FsJyA6ICdob3Jpem9udGFsJztcbiAgICB9XG4gICAgaWYgKGNoaWxkMSAmJiBmaXJzdENoaWxkQ1NTW1wiZmxvYXRcIl0gJiYgZmlyc3RDaGlsZENTU1tcImZsb2F0XCJdICE9PSAnbm9uZScpIHtcbiAgICAgIHZhciB0b3VjaGluZ1NpZGVDaGlsZDIgPSBmaXJzdENoaWxkQ1NTW1wiZmxvYXRcIl0gPT09ICdsZWZ0JyA/ICdsZWZ0JyA6ICdyaWdodCc7XG4gICAgICByZXR1cm4gY2hpbGQyICYmIChzZWNvbmRDaGlsZENTUy5jbGVhciA9PT0gJ2JvdGgnIHx8IHNlY29uZENoaWxkQ1NTLmNsZWFyID09PSB0b3VjaGluZ1NpZGVDaGlsZDIpID8gJ3ZlcnRpY2FsJyA6ICdob3Jpem9udGFsJztcbiAgICB9XG4gICAgcmV0dXJuIGNoaWxkMSAmJiAoZmlyc3RDaGlsZENTUy5kaXNwbGF5ID09PSAnYmxvY2snIHx8IGZpcnN0Q2hpbGRDU1MuZGlzcGxheSA9PT0gJ2ZsZXgnIHx8IGZpcnN0Q2hpbGRDU1MuZGlzcGxheSA9PT0gJ3RhYmxlJyB8fCBmaXJzdENoaWxkQ1NTLmRpc3BsYXkgPT09ICdncmlkJyB8fCBmaXJzdENoaWxkV2lkdGggPj0gZWxXaWR0aCAmJiBlbENTU1tDU1NGbG9hdFByb3BlcnR5XSA9PT0gJ25vbmUnIHx8IGNoaWxkMiAmJiBlbENTU1tDU1NGbG9hdFByb3BlcnR5XSA9PT0gJ25vbmUnICYmIGZpcnN0Q2hpbGRXaWR0aCArIHNlY29uZENoaWxkV2lkdGggPiBlbFdpZHRoKSA/ICd2ZXJ0aWNhbCcgOiAnaG9yaXpvbnRhbCc7XG4gIH0sXG4gIF9kcmFnRWxJblJvd0NvbHVtbiA9IGZ1bmN0aW9uIF9kcmFnRWxJblJvd0NvbHVtbihkcmFnUmVjdCwgdGFyZ2V0UmVjdCwgdmVydGljYWwpIHtcbiAgICB2YXIgZHJhZ0VsUzFPcHAgPSB2ZXJ0aWNhbCA/IGRyYWdSZWN0LmxlZnQgOiBkcmFnUmVjdC50b3AsXG4gICAgICBkcmFnRWxTMk9wcCA9IHZlcnRpY2FsID8gZHJhZ1JlY3QucmlnaHQgOiBkcmFnUmVjdC5ib3R0b20sXG4gICAgICBkcmFnRWxPcHBMZW5ndGggPSB2ZXJ0aWNhbCA/IGRyYWdSZWN0LndpZHRoIDogZHJhZ1JlY3QuaGVpZ2h0LFxuICAgICAgdGFyZ2V0UzFPcHAgPSB2ZXJ0aWNhbCA/IHRhcmdldFJlY3QubGVmdCA6IHRhcmdldFJlY3QudG9wLFxuICAgICAgdGFyZ2V0UzJPcHAgPSB2ZXJ0aWNhbCA/IHRhcmdldFJlY3QucmlnaHQgOiB0YXJnZXRSZWN0LmJvdHRvbSxcbiAgICAgIHRhcmdldE9wcExlbmd0aCA9IHZlcnRpY2FsID8gdGFyZ2V0UmVjdC53aWR0aCA6IHRhcmdldFJlY3QuaGVpZ2h0O1xuICAgIHJldHVybiBkcmFnRWxTMU9wcCA9PT0gdGFyZ2V0UzFPcHAgfHwgZHJhZ0VsUzJPcHAgPT09IHRhcmdldFMyT3BwIHx8IGRyYWdFbFMxT3BwICsgZHJhZ0VsT3BwTGVuZ3RoIC8gMiA9PT0gdGFyZ2V0UzFPcHAgKyB0YXJnZXRPcHBMZW5ndGggLyAyO1xuICB9LFxuICAvKipcclxuICAgKiBEZXRlY3RzIGZpcnN0IG5lYXJlc3QgZW1wdHkgc29ydGFibGUgdG8gWCBhbmQgWSBwb3NpdGlvbiB1c2luZyBlbXB0eUluc2VydFRocmVzaG9sZC5cclxuICAgKiBAcGFyYW0gIHtOdW1iZXJ9IHggICAgICBYIHBvc2l0aW9uXHJcbiAgICogQHBhcmFtICB7TnVtYmVyfSB5ICAgICAgWSBwb3NpdGlvblxyXG4gICAqIEByZXR1cm4ge0hUTUxFbGVtZW50fSAgIEVsZW1lbnQgb2YgdGhlIGZpcnN0IGZvdW5kIG5lYXJlc3QgU29ydGFibGVcclxuICAgKi9cbiAgX2RldGVjdE5lYXJlc3RFbXB0eVNvcnRhYmxlID0gZnVuY3Rpb24gX2RldGVjdE5lYXJlc3RFbXB0eVNvcnRhYmxlKHgsIHkpIHtcbiAgICB2YXIgcmV0O1xuICAgIHNvcnRhYmxlcy5zb21lKGZ1bmN0aW9uIChzb3J0YWJsZSkge1xuICAgICAgdmFyIHRocmVzaG9sZCA9IHNvcnRhYmxlW2V4cGFuZG9dLm9wdGlvbnMuZW1wdHlJbnNlcnRUaHJlc2hvbGQ7XG4gICAgICBpZiAoIXRocmVzaG9sZCB8fCBsYXN0Q2hpbGQoc29ydGFibGUpKSByZXR1cm47XG4gICAgICB2YXIgcmVjdCA9IGdldFJlY3Qoc29ydGFibGUpLFxuICAgICAgICBpbnNpZGVIb3Jpem9udGFsbHkgPSB4ID49IHJlY3QubGVmdCAtIHRocmVzaG9sZCAmJiB4IDw9IHJlY3QucmlnaHQgKyB0aHJlc2hvbGQsXG4gICAgICAgIGluc2lkZVZlcnRpY2FsbHkgPSB5ID49IHJlY3QudG9wIC0gdGhyZXNob2xkICYmIHkgPD0gcmVjdC5ib3R0b20gKyB0aHJlc2hvbGQ7XG4gICAgICBpZiAoaW5zaWRlSG9yaXpvbnRhbGx5ICYmIGluc2lkZVZlcnRpY2FsbHkpIHtcbiAgICAgICAgcmV0dXJuIHJldCA9IHNvcnRhYmxlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXQ7XG4gIH0sXG4gIF9wcmVwYXJlR3JvdXAgPSBmdW5jdGlvbiBfcHJlcGFyZUdyb3VwKG9wdGlvbnMpIHtcbiAgICBmdW5jdGlvbiB0b0ZuKHZhbHVlLCBwdWxsKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHRvLCBmcm9tLCBkcmFnRWwsIGV2dCkge1xuICAgICAgICB2YXIgc2FtZUdyb3VwID0gdG8ub3B0aW9ucy5ncm91cC5uYW1lICYmIGZyb20ub3B0aW9ucy5ncm91cC5uYW1lICYmIHRvLm9wdGlvbnMuZ3JvdXAubmFtZSA9PT0gZnJvbS5vcHRpb25zLmdyb3VwLm5hbWU7XG4gICAgICAgIGlmICh2YWx1ZSA9PSBudWxsICYmIChwdWxsIHx8IHNhbWVHcm91cCkpIHtcbiAgICAgICAgICAvLyBEZWZhdWx0IHB1bGwgdmFsdWVcbiAgICAgICAgICAvLyBEZWZhdWx0IHB1bGwgYW5kIHB1dCB2YWx1ZSBpZiBzYW1lIGdyb3VwXG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gZWxzZSBpZiAodmFsdWUgPT0gbnVsbCB8fCB2YWx1ZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0gZWxzZSBpZiAocHVsbCAmJiB2YWx1ZSA9PT0gJ2Nsb25lJykge1xuICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICByZXR1cm4gdG9Gbih2YWx1ZSh0bywgZnJvbSwgZHJhZ0VsLCBldnQpLCBwdWxsKSh0bywgZnJvbSwgZHJhZ0VsLCBldnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBvdGhlckdyb3VwID0gKHB1bGwgPyB0byA6IGZyb20pLm9wdGlvbnMuZ3JvdXAubmFtZTtcbiAgICAgICAgICByZXR1cm4gdmFsdWUgPT09IHRydWUgfHwgdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyAmJiB2YWx1ZSA9PT0gb3RoZXJHcm91cCB8fCB2YWx1ZS5qb2luICYmIHZhbHVlLmluZGV4T2Yob3RoZXJHcm91cCkgPiAtMTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG4gICAgdmFyIGdyb3VwID0ge307XG4gICAgdmFyIG9yaWdpbmFsR3JvdXAgPSBvcHRpb25zLmdyb3VwO1xuICAgIGlmICghb3JpZ2luYWxHcm91cCB8fCBfdHlwZW9mKG9yaWdpbmFsR3JvdXApICE9ICdvYmplY3QnKSB7XG4gICAgICBvcmlnaW5hbEdyb3VwID0ge1xuICAgICAgICBuYW1lOiBvcmlnaW5hbEdyb3VwXG4gICAgICB9O1xuICAgIH1cbiAgICBncm91cC5uYW1lID0gb3JpZ2luYWxHcm91cC5uYW1lO1xuICAgIGdyb3VwLmNoZWNrUHVsbCA9IHRvRm4ob3JpZ2luYWxHcm91cC5wdWxsLCB0cnVlKTtcbiAgICBncm91cC5jaGVja1B1dCA9IHRvRm4ob3JpZ2luYWxHcm91cC5wdXQpO1xuICAgIGdyb3VwLnJldmVydENsb25lID0gb3JpZ2luYWxHcm91cC5yZXZlcnRDbG9uZTtcbiAgICBvcHRpb25zLmdyb3VwID0gZ3JvdXA7XG4gIH0sXG4gIF9oaWRlR2hvc3RGb3JUYXJnZXQgPSBmdW5jdGlvbiBfaGlkZUdob3N0Rm9yVGFyZ2V0KCkge1xuICAgIGlmICghc3VwcG9ydENzc1BvaW50ZXJFdmVudHMgJiYgZ2hvc3RFbCkge1xuICAgICAgY3NzKGdob3N0RWwsICdkaXNwbGF5JywgJ25vbmUnKTtcbiAgICB9XG4gIH0sXG4gIF91bmhpZGVHaG9zdEZvclRhcmdldCA9IGZ1bmN0aW9uIF91bmhpZGVHaG9zdEZvclRhcmdldCgpIHtcbiAgICBpZiAoIXN1cHBvcnRDc3NQb2ludGVyRXZlbnRzICYmIGdob3N0RWwpIHtcbiAgICAgIGNzcyhnaG9zdEVsLCAnZGlzcGxheScsICcnKTtcbiAgICB9XG4gIH07XG5cbi8vICMxMTg0IGZpeCAtIFByZXZlbnQgY2xpY2sgZXZlbnQgb24gZmFsbGJhY2sgaWYgZHJhZ2dlZCBidXQgaXRlbSBub3QgY2hhbmdlZCBwb3NpdGlvblxuaWYgKGRvY3VtZW50RXhpc3RzICYmICFDaHJvbWVGb3JBbmRyb2lkKSB7XG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKGV2dCkge1xuICAgIGlmIChpZ25vcmVOZXh0Q2xpY2spIHtcbiAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZXZ0LnN0b3BQcm9wYWdhdGlvbiAmJiBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBldnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uICYmIGV2dC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgIGlnbm9yZU5leHRDbGljayA9IGZhbHNlO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfSwgdHJ1ZSk7XG59XG52YXIgbmVhcmVzdEVtcHR5SW5zZXJ0RGV0ZWN0RXZlbnQgPSBmdW5jdGlvbiBuZWFyZXN0RW1wdHlJbnNlcnREZXRlY3RFdmVudChldnQpIHtcbiAgaWYgKGRyYWdFbCkge1xuICAgIGV2dCA9IGV2dC50b3VjaGVzID8gZXZ0LnRvdWNoZXNbMF0gOiBldnQ7XG4gICAgdmFyIG5lYXJlc3QgPSBfZGV0ZWN0TmVhcmVzdEVtcHR5U29ydGFibGUoZXZ0LmNsaWVudFgsIGV2dC5jbGllbnRZKTtcbiAgICBpZiAobmVhcmVzdCkge1xuICAgICAgLy8gQ3JlYXRlIGltaXRhdGlvbiBldmVudFxuICAgICAgdmFyIGV2ZW50ID0ge307XG4gICAgICBmb3IgKHZhciBpIGluIGV2dCkge1xuICAgICAgICBpZiAoZXZ0Lmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgZXZlbnRbaV0gPSBldnRbaV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGV2ZW50LnRhcmdldCA9IGV2ZW50LnJvb3RFbCA9IG5lYXJlc3Q7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCA9IHZvaWQgMDtcbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbiA9IHZvaWQgMDtcbiAgICAgIG5lYXJlc3RbZXhwYW5kb10uX29uRHJhZ092ZXIoZXZlbnQpO1xuICAgIH1cbiAgfVxufTtcbnZhciBfY2hlY2tPdXRzaWRlVGFyZ2V0RWwgPSBmdW5jdGlvbiBfY2hlY2tPdXRzaWRlVGFyZ2V0RWwoZXZ0KSB7XG4gIGlmIChkcmFnRWwpIHtcbiAgICBkcmFnRWwucGFyZW50Tm9kZVtleHBhbmRvXS5faXNPdXRzaWRlVGhpc0VsKGV2dC50YXJnZXQpO1xuICB9XG59O1xuXG4vKipcclxuICogQGNsYXNzICBTb3J0YWJsZVxyXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gIGVsXHJcbiAqIEBwYXJhbSAge09iamVjdH0gICAgICAgW29wdGlvbnNdXHJcbiAqL1xuZnVuY3Rpb24gU29ydGFibGUoZWwsIG9wdGlvbnMpIHtcbiAgaWYgKCEoZWwgJiYgZWwubm9kZVR5cGUgJiYgZWwubm9kZVR5cGUgPT09IDEpKSB7XG4gICAgdGhyb3cgXCJTb3J0YWJsZTogYGVsYCBtdXN0IGJlIGFuIEhUTUxFbGVtZW50LCBub3QgXCIuY29uY2F0KHt9LnRvU3RyaW5nLmNhbGwoZWwpKTtcbiAgfVxuICB0aGlzLmVsID0gZWw7IC8vIHJvb3QgZWxlbWVudFxuICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zID0gX2V4dGVuZHMoe30sIG9wdGlvbnMpO1xuXG4gIC8vIEV4cG9ydCBpbnN0YW5jZVxuICBlbFtleHBhbmRvXSA9IHRoaXM7XG4gIHZhciBkZWZhdWx0cyA9IHtcbiAgICBncm91cDogbnVsbCxcbiAgICBzb3J0OiB0cnVlLFxuICAgIGRpc2FibGVkOiBmYWxzZSxcbiAgICBzdG9yZTogbnVsbCxcbiAgICBoYW5kbGU6IG51bGwsXG4gICAgZHJhZ2dhYmxlOiAvXlt1b11sJC9pLnRlc3QoZWwubm9kZU5hbWUpID8gJz5saScgOiAnPionLFxuICAgIHN3YXBUaHJlc2hvbGQ6IDEsXG4gICAgLy8gcGVyY2VudGFnZTsgMCA8PSB4IDw9IDFcbiAgICBpbnZlcnRTd2FwOiBmYWxzZSxcbiAgICAvLyBpbnZlcnQgYWx3YXlzXG4gICAgaW52ZXJ0ZWRTd2FwVGhyZXNob2xkOiBudWxsLFxuICAgIC8vIHdpbGwgYmUgc2V0IHRvIHNhbWUgYXMgc3dhcFRocmVzaG9sZCBpZiBkZWZhdWx0XG4gICAgcmVtb3ZlQ2xvbmVPbkhpZGU6IHRydWUsXG4gICAgZGlyZWN0aW9uOiBmdW5jdGlvbiBkaXJlY3Rpb24oKSB7XG4gICAgICByZXR1cm4gX2RldGVjdERpcmVjdGlvbihlbCwgdGhpcy5vcHRpb25zKTtcbiAgICB9LFxuICAgIGdob3N0Q2xhc3M6ICdzb3J0YWJsZS1naG9zdCcsXG4gICAgY2hvc2VuQ2xhc3M6ICdzb3J0YWJsZS1jaG9zZW4nLFxuICAgIGRyYWdDbGFzczogJ3NvcnRhYmxlLWRyYWcnLFxuICAgIGlnbm9yZTogJ2EsIGltZycsXG4gICAgZmlsdGVyOiBudWxsLFxuICAgIHByZXZlbnRPbkZpbHRlcjogdHJ1ZSxcbiAgICBhbmltYXRpb246IDAsXG4gICAgZWFzaW5nOiBudWxsLFxuICAgIHNldERhdGE6IGZ1bmN0aW9uIHNldERhdGEoZGF0YVRyYW5zZmVyLCBkcmFnRWwpIHtcbiAgICAgIGRhdGFUcmFuc2Zlci5zZXREYXRhKCdUZXh0JywgZHJhZ0VsLnRleHRDb250ZW50KTtcbiAgICB9LFxuICAgIGRyb3BCdWJibGU6IGZhbHNlLFxuICAgIGRyYWdvdmVyQnViYmxlOiBmYWxzZSxcbiAgICBkYXRhSWRBdHRyOiAnZGF0YS1pZCcsXG4gICAgZGVsYXk6IDAsXG4gICAgZGVsYXlPblRvdWNoT25seTogZmFsc2UsXG4gICAgdG91Y2hTdGFydFRocmVzaG9sZDogKE51bWJlci5wYXJzZUludCA/IE51bWJlciA6IHdpbmRvdykucGFyc2VJbnQod2luZG93LmRldmljZVBpeGVsUmF0aW8sIDEwKSB8fCAxLFxuICAgIGZvcmNlRmFsbGJhY2s6IGZhbHNlLFxuICAgIGZhbGxiYWNrQ2xhc3M6ICdzb3J0YWJsZS1mYWxsYmFjaycsXG4gICAgZmFsbGJhY2tPbkJvZHk6IGZhbHNlLFxuICAgIGZhbGxiYWNrVG9sZXJhbmNlOiAwLFxuICAgIGZhbGxiYWNrT2Zmc2V0OiB7XG4gICAgICB4OiAwLFxuICAgICAgeTogMFxuICAgIH0sXG4gICAgLy8gRGlzYWJsZWQgb24gU2FmYXJpOiAjMTU3MTsgRW5hYmxlZCBvbiBTYWZhcmkgSU9TOiAjMjI0NFxuICAgIHN1cHBvcnRQb2ludGVyOiBTb3J0YWJsZS5zdXBwb3J0UG9pbnRlciAhPT0gZmFsc2UgJiYgJ1BvaW50ZXJFdmVudCcgaW4gd2luZG93ICYmICghU2FmYXJpIHx8IElPUyksXG4gICAgZW1wdHlJbnNlcnRUaHJlc2hvbGQ6IDVcbiAgfTtcbiAgUGx1Z2luTWFuYWdlci5pbml0aWFsaXplUGx1Z2lucyh0aGlzLCBlbCwgZGVmYXVsdHMpO1xuXG4gIC8vIFNldCBkZWZhdWx0IG9wdGlvbnNcbiAgZm9yICh2YXIgbmFtZSBpbiBkZWZhdWx0cykge1xuICAgICEobmFtZSBpbiBvcHRpb25zKSAmJiAob3B0aW9uc1tuYW1lXSA9IGRlZmF1bHRzW25hbWVdKTtcbiAgfVxuICBfcHJlcGFyZUdyb3VwKG9wdGlvbnMpO1xuXG4gIC8vIEJpbmQgYWxsIHByaXZhdGUgbWV0aG9kc1xuICBmb3IgKHZhciBmbiBpbiB0aGlzKSB7XG4gICAgaWYgKGZuLmNoYXJBdCgwKSA9PT0gJ18nICYmIHR5cGVvZiB0aGlzW2ZuXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhpc1tmbl0gPSB0aGlzW2ZuXS5iaW5kKHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFNldHVwIGRyYWcgbW9kZVxuICB0aGlzLm5hdGl2ZURyYWdnYWJsZSA9IG9wdGlvbnMuZm9yY2VGYWxsYmFjayA/IGZhbHNlIDogc3VwcG9ydERyYWdnYWJsZTtcbiAgaWYgKHRoaXMubmF0aXZlRHJhZ2dhYmxlKSB7XG4gICAgLy8gVG91Y2ggc3RhcnQgdGhyZXNob2xkIGNhbm5vdCBiZSBncmVhdGVyIHRoYW4gdGhlIG5hdGl2ZSBkcmFnc3RhcnQgdGhyZXNob2xkXG4gICAgdGhpcy5vcHRpb25zLnRvdWNoU3RhcnRUaHJlc2hvbGQgPSAxO1xuICB9XG5cbiAgLy8gQmluZCBldmVudHNcbiAgaWYgKG9wdGlvbnMuc3VwcG9ydFBvaW50ZXIpIHtcbiAgICBvbihlbCwgJ3BvaW50ZXJkb3duJywgdGhpcy5fb25UYXBTdGFydCk7XG4gIH0gZWxzZSB7XG4gICAgb24oZWwsICdtb3VzZWRvd24nLCB0aGlzLl9vblRhcFN0YXJ0KTtcbiAgICBvbihlbCwgJ3RvdWNoc3RhcnQnLCB0aGlzLl9vblRhcFN0YXJ0KTtcbiAgfVxuICBpZiAodGhpcy5uYXRpdmVEcmFnZ2FibGUpIHtcbiAgICBvbihlbCwgJ2RyYWdvdmVyJywgdGhpcyk7XG4gICAgb24oZWwsICdkcmFnZW50ZXInLCB0aGlzKTtcbiAgfVxuICBzb3J0YWJsZXMucHVzaCh0aGlzLmVsKTtcblxuICAvLyBSZXN0b3JlIHNvcnRpbmdcbiAgb3B0aW9ucy5zdG9yZSAmJiBvcHRpb25zLnN0b3JlLmdldCAmJiB0aGlzLnNvcnQob3B0aW9ucy5zdG9yZS5nZXQodGhpcykgfHwgW10pO1xuXG4gIC8vIEFkZCBhbmltYXRpb24gc3RhdGUgbWFuYWdlclxuICBfZXh0ZW5kcyh0aGlzLCBBbmltYXRpb25TdGF0ZU1hbmFnZXIoKSk7XG59XG5Tb3J0YWJsZS5wcm90b3R5cGUgPSAvKiogQGxlbmRzIFNvcnRhYmxlLnByb3RvdHlwZSAqL3tcbiAgY29uc3RydWN0b3I6IFNvcnRhYmxlLFxuICBfaXNPdXRzaWRlVGhpc0VsOiBmdW5jdGlvbiBfaXNPdXRzaWRlVGhpc0VsKHRhcmdldCkge1xuICAgIGlmICghdGhpcy5lbC5jb250YWlucyh0YXJnZXQpICYmIHRhcmdldCAhPT0gdGhpcy5lbCkge1xuICAgICAgbGFzdFRhcmdldCA9IG51bGw7XG4gICAgfVxuICB9LFxuICBfZ2V0RGlyZWN0aW9uOiBmdW5jdGlvbiBfZ2V0RGlyZWN0aW9uKGV2dCwgdGFyZ2V0KSB7XG4gICAgcmV0dXJuIHR5cGVvZiB0aGlzLm9wdGlvbnMuZGlyZWN0aW9uID09PSAnZnVuY3Rpb24nID8gdGhpcy5vcHRpb25zLmRpcmVjdGlvbi5jYWxsKHRoaXMsIGV2dCwgdGFyZ2V0LCBkcmFnRWwpIDogdGhpcy5vcHRpb25zLmRpcmVjdGlvbjtcbiAgfSxcbiAgX29uVGFwU3RhcnQ6IGZ1bmN0aW9uIF9vblRhcFN0YXJ0KCAvKiogRXZlbnR8VG91Y2hFdmVudCAqL2V2dCkge1xuICAgIGlmICghZXZ0LmNhbmNlbGFibGUpIHJldHVybjtcbiAgICB2YXIgX3RoaXMgPSB0aGlzLFxuICAgICAgZWwgPSB0aGlzLmVsLFxuICAgICAgb3B0aW9ucyA9IHRoaXMub3B0aW9ucyxcbiAgICAgIHByZXZlbnRPbkZpbHRlciA9IG9wdGlvbnMucHJldmVudE9uRmlsdGVyLFxuICAgICAgdHlwZSA9IGV2dC50eXBlLFxuICAgICAgdG91Y2ggPSBldnQudG91Y2hlcyAmJiBldnQudG91Y2hlc1swXSB8fCBldnQucG9pbnRlclR5cGUgJiYgZXZ0LnBvaW50ZXJUeXBlID09PSAndG91Y2gnICYmIGV2dCxcbiAgICAgIHRhcmdldCA9ICh0b3VjaCB8fCBldnQpLnRhcmdldCxcbiAgICAgIG9yaWdpbmFsVGFyZ2V0ID0gZXZ0LnRhcmdldC5zaGFkb3dSb290ICYmIChldnQucGF0aCAmJiBldnQucGF0aFswXSB8fCBldnQuY29tcG9zZWRQYXRoICYmIGV2dC5jb21wb3NlZFBhdGgoKVswXSkgfHwgdGFyZ2V0LFxuICAgICAgZmlsdGVyID0gb3B0aW9ucy5maWx0ZXI7XG4gICAgX3NhdmVJbnB1dENoZWNrZWRTdGF0ZShlbCk7XG5cbiAgICAvLyBEb24ndCB0cmlnZ2VyIHN0YXJ0IGV2ZW50IHdoZW4gYW4gZWxlbWVudCBpcyBiZWVuIGRyYWdnZWQsIG90aGVyd2lzZSB0aGUgZXZ0Lm9sZGluZGV4IGFsd2F5cyB3cm9uZyB3aGVuIHNldCBvcHRpb24uZ3JvdXAuXG4gICAgaWYgKGRyYWdFbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoL21vdXNlZG93bnxwb2ludGVyZG93bi8udGVzdCh0eXBlKSAmJiBldnQuYnV0dG9uICE9PSAwIHx8IG9wdGlvbnMuZGlzYWJsZWQpIHtcbiAgICAgIHJldHVybjsgLy8gb25seSBsZWZ0IGJ1dHRvbiBhbmQgZW5hYmxlZFxuICAgIH1cblxuICAgIC8vIGNhbmNlbCBkbmQgaWYgb3JpZ2luYWwgdGFyZ2V0IGlzIGNvbnRlbnQgZWRpdGFibGVcbiAgICBpZiAob3JpZ2luYWxUYXJnZXQuaXNDb250ZW50RWRpdGFibGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBTYWZhcmkgaWdub3JlcyBmdXJ0aGVyIGV2ZW50IGhhbmRsaW5nIGFmdGVyIG1vdXNlZG93blxuICAgIGlmICghdGhpcy5uYXRpdmVEcmFnZ2FibGUgJiYgU2FmYXJpICYmIHRhcmdldCAmJiB0YXJnZXQudGFnTmFtZS50b1VwcGVyQ2FzZSgpID09PSAnU0VMRUNUJykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0YXJnZXQgPSBjbG9zZXN0KHRhcmdldCwgb3B0aW9ucy5kcmFnZ2FibGUsIGVsLCBmYWxzZSk7XG4gICAgaWYgKHRhcmdldCAmJiB0YXJnZXQuYW5pbWF0ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGxhc3REb3duRWwgPT09IHRhcmdldCkge1xuICAgICAgLy8gSWdub3JpbmcgZHVwbGljYXRlIGBkb3duYFxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEdldCB0aGUgaW5kZXggb2YgdGhlIGRyYWdnZWQgZWxlbWVudCB3aXRoaW4gaXRzIHBhcmVudFxuICAgIG9sZEluZGV4ID0gaW5kZXgodGFyZ2V0KTtcbiAgICBvbGREcmFnZ2FibGVJbmRleCA9IGluZGV4KHRhcmdldCwgb3B0aW9ucy5kcmFnZ2FibGUpO1xuXG4gICAgLy8gQ2hlY2sgZmlsdGVyXG4gICAgaWYgKHR5cGVvZiBmaWx0ZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGlmIChmaWx0ZXIuY2FsbCh0aGlzLCBldnQsIHRhcmdldCwgdGhpcykpIHtcbiAgICAgICAgX2Rpc3BhdGNoRXZlbnQoe1xuICAgICAgICAgIHNvcnRhYmxlOiBfdGhpcyxcbiAgICAgICAgICByb290RWw6IG9yaWdpbmFsVGFyZ2V0LFxuICAgICAgICAgIG5hbWU6ICdmaWx0ZXInLFxuICAgICAgICAgIHRhcmdldEVsOiB0YXJnZXQsXG4gICAgICAgICAgdG9FbDogZWwsXG4gICAgICAgICAgZnJvbUVsOiBlbFxuICAgICAgICB9KTtcbiAgICAgICAgcGx1Z2luRXZlbnQoJ2ZpbHRlcicsIF90aGlzLCB7XG4gICAgICAgICAgZXZ0OiBldnRcbiAgICAgICAgfSk7XG4gICAgICAgIHByZXZlbnRPbkZpbHRlciAmJiBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgcmV0dXJuOyAvLyBjYW5jZWwgZG5kXG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChmaWx0ZXIpIHtcbiAgICAgIGZpbHRlciA9IGZpbHRlci5zcGxpdCgnLCcpLnNvbWUoZnVuY3Rpb24gKGNyaXRlcmlhKSB7XG4gICAgICAgIGNyaXRlcmlhID0gY2xvc2VzdChvcmlnaW5hbFRhcmdldCwgY3JpdGVyaWEudHJpbSgpLCBlbCwgZmFsc2UpO1xuICAgICAgICBpZiAoY3JpdGVyaWEpIHtcbiAgICAgICAgICBfZGlzcGF0Y2hFdmVudCh7XG4gICAgICAgICAgICBzb3J0YWJsZTogX3RoaXMsXG4gICAgICAgICAgICByb290RWw6IGNyaXRlcmlhLFxuICAgICAgICAgICAgbmFtZTogJ2ZpbHRlcicsXG4gICAgICAgICAgICB0YXJnZXRFbDogdGFyZ2V0LFxuICAgICAgICAgICAgZnJvbUVsOiBlbCxcbiAgICAgICAgICAgIHRvRWw6IGVsXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcGx1Z2luRXZlbnQoJ2ZpbHRlcicsIF90aGlzLCB7XG4gICAgICAgICAgICBldnQ6IGV2dFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGlmIChmaWx0ZXIpIHtcbiAgICAgICAgcHJldmVudE9uRmlsdGVyICYmIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICByZXR1cm47IC8vIGNhbmNlbCBkbmRcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKG9wdGlvbnMuaGFuZGxlICYmICFjbG9zZXN0KG9yaWdpbmFsVGFyZ2V0LCBvcHRpb25zLmhhbmRsZSwgZWwsIGZhbHNlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFByZXBhcmUgYGRyYWdzdGFydGBcbiAgICB0aGlzLl9wcmVwYXJlRHJhZ1N0YXJ0KGV2dCwgdG91Y2gsIHRhcmdldCk7XG4gIH0sXG4gIF9wcmVwYXJlRHJhZ1N0YXJ0OiBmdW5jdGlvbiBfcHJlcGFyZURyYWdTdGFydCggLyoqIEV2ZW50ICovZXZ0LCAvKiogVG91Y2ggKi90b3VjaCwgLyoqIEhUTUxFbGVtZW50ICovdGFyZ2V0KSB7XG4gICAgdmFyIF90aGlzID0gdGhpcyxcbiAgICAgIGVsID0gX3RoaXMuZWwsXG4gICAgICBvcHRpb25zID0gX3RoaXMub3B0aW9ucyxcbiAgICAgIG93bmVyRG9jdW1lbnQgPSBlbC5vd25lckRvY3VtZW50LFxuICAgICAgZHJhZ1N0YXJ0Rm47XG4gICAgaWYgKHRhcmdldCAmJiAhZHJhZ0VsICYmIHRhcmdldC5wYXJlbnROb2RlID09PSBlbCkge1xuICAgICAgdmFyIGRyYWdSZWN0ID0gZ2V0UmVjdCh0YXJnZXQpO1xuICAgICAgcm9vdEVsID0gZWw7XG4gICAgICBkcmFnRWwgPSB0YXJnZXQ7XG4gICAgICBwYXJlbnRFbCA9IGRyYWdFbC5wYXJlbnROb2RlO1xuICAgICAgbmV4dEVsID0gZHJhZ0VsLm5leHRTaWJsaW5nO1xuICAgICAgbGFzdERvd25FbCA9IHRhcmdldDtcbiAgICAgIGFjdGl2ZUdyb3VwID0gb3B0aW9ucy5ncm91cDtcbiAgICAgIFNvcnRhYmxlLmRyYWdnZWQgPSBkcmFnRWw7XG4gICAgICB0YXBFdnQgPSB7XG4gICAgICAgIHRhcmdldDogZHJhZ0VsLFxuICAgICAgICBjbGllbnRYOiAodG91Y2ggfHwgZXZ0KS5jbGllbnRYLFxuICAgICAgICBjbGllbnRZOiAodG91Y2ggfHwgZXZ0KS5jbGllbnRZXG4gICAgICB9O1xuICAgICAgdGFwRGlzdGFuY2VMZWZ0ID0gdGFwRXZ0LmNsaWVudFggLSBkcmFnUmVjdC5sZWZ0O1xuICAgICAgdGFwRGlzdGFuY2VUb3AgPSB0YXBFdnQuY2xpZW50WSAtIGRyYWdSZWN0LnRvcDtcbiAgICAgIHRoaXMuX2xhc3RYID0gKHRvdWNoIHx8IGV2dCkuY2xpZW50WDtcbiAgICAgIHRoaXMuX2xhc3RZID0gKHRvdWNoIHx8IGV2dCkuY2xpZW50WTtcbiAgICAgIGRyYWdFbC5zdHlsZVsnd2lsbC1jaGFuZ2UnXSA9ICdhbGwnO1xuICAgICAgZHJhZ1N0YXJ0Rm4gPSBmdW5jdGlvbiBkcmFnU3RhcnRGbigpIHtcbiAgICAgICAgcGx1Z2luRXZlbnQoJ2RlbGF5RW5kZWQnLCBfdGhpcywge1xuICAgICAgICAgIGV2dDogZXZ0XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoU29ydGFibGUuZXZlbnRDYW5jZWxlZCkge1xuICAgICAgICAgIF90aGlzLl9vbkRyb3AoKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8gRGVsYXllZCBkcmFnIGhhcyBiZWVuIHRyaWdnZXJlZFxuICAgICAgICAvLyB3ZSBjYW4gcmUtZW5hYmxlIHRoZSBldmVudHM6IHRvdWNobW92ZS9tb3VzZW1vdmVcbiAgICAgICAgX3RoaXMuX2Rpc2FibGVEZWxheWVkRHJhZ0V2ZW50cygpO1xuICAgICAgICBpZiAoIUZpcmVGb3ggJiYgX3RoaXMubmF0aXZlRHJhZ2dhYmxlKSB7XG4gICAgICAgICAgZHJhZ0VsLmRyYWdnYWJsZSA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBCaW5kIHRoZSBldmVudHM6IGRyYWdzdGFydC9kcmFnZW5kXG4gICAgICAgIF90aGlzLl90cmlnZ2VyRHJhZ1N0YXJ0KGV2dCwgdG91Y2gpO1xuXG4gICAgICAgIC8vIERyYWcgc3RhcnQgZXZlbnRcbiAgICAgICAgX2Rpc3BhdGNoRXZlbnQoe1xuICAgICAgICAgIHNvcnRhYmxlOiBfdGhpcyxcbiAgICAgICAgICBuYW1lOiAnY2hvb3NlJyxcbiAgICAgICAgICBvcmlnaW5hbEV2ZW50OiBldnRcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gQ2hvc2VuIGl0ZW1cbiAgICAgICAgdG9nZ2xlQ2xhc3MoZHJhZ0VsLCBvcHRpb25zLmNob3NlbkNsYXNzLCB0cnVlKTtcbiAgICAgIH07XG5cbiAgICAgIC8vIERpc2FibGUgXCJkcmFnZ2FibGVcIlxuICAgICAgb3B0aW9ucy5pZ25vcmUuc3BsaXQoJywnKS5mb3JFYWNoKGZ1bmN0aW9uIChjcml0ZXJpYSkge1xuICAgICAgICBmaW5kKGRyYWdFbCwgY3JpdGVyaWEudHJpbSgpLCBfZGlzYWJsZURyYWdnYWJsZSk7XG4gICAgICB9KTtcbiAgICAgIG9uKG93bmVyRG9jdW1lbnQsICdkcmFnb3ZlcicsIG5lYXJlc3RFbXB0eUluc2VydERldGVjdEV2ZW50KTtcbiAgICAgIG9uKG93bmVyRG9jdW1lbnQsICdtb3VzZW1vdmUnLCBuZWFyZXN0RW1wdHlJbnNlcnREZXRlY3RFdmVudCk7XG4gICAgICBvbihvd25lckRvY3VtZW50LCAndG91Y2htb3ZlJywgbmVhcmVzdEVtcHR5SW5zZXJ0RGV0ZWN0RXZlbnQpO1xuICAgICAgaWYgKG9wdGlvbnMuc3VwcG9ydFBvaW50ZXIpIHtcbiAgICAgICAgb24ob3duZXJEb2N1bWVudCwgJ3BvaW50ZXJ1cCcsIF90aGlzLl9vbkRyb3ApO1xuICAgICAgICAvLyBOYXRpdmUgRCZEIHRyaWdnZXJzIHBvaW50ZXJjYW5jZWxcbiAgICAgICAgIXRoaXMubmF0aXZlRHJhZ2dhYmxlICYmIG9uKG93bmVyRG9jdW1lbnQsICdwb2ludGVyY2FuY2VsJywgX3RoaXMuX29uRHJvcCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvbihvd25lckRvY3VtZW50LCAnbW91c2V1cCcsIF90aGlzLl9vbkRyb3ApO1xuICAgICAgICBvbihvd25lckRvY3VtZW50LCAndG91Y2hlbmQnLCBfdGhpcy5fb25Ecm9wKTtcbiAgICAgICAgb24ob3duZXJEb2N1bWVudCwgJ3RvdWNoY2FuY2VsJywgX3RoaXMuX29uRHJvcCk7XG4gICAgICB9XG5cbiAgICAgIC8vIE1ha2UgZHJhZ0VsIGRyYWdnYWJsZSAobXVzdCBiZSBiZWZvcmUgZGVsYXkgZm9yIEZpcmVGb3gpXG4gICAgICBpZiAoRmlyZUZveCAmJiB0aGlzLm5hdGl2ZURyYWdnYWJsZSkge1xuICAgICAgICB0aGlzLm9wdGlvbnMudG91Y2hTdGFydFRocmVzaG9sZCA9IDQ7XG4gICAgICAgIGRyYWdFbC5kcmFnZ2FibGUgPSB0cnVlO1xuICAgICAgfVxuICAgICAgcGx1Z2luRXZlbnQoJ2RlbGF5U3RhcnQnLCB0aGlzLCB7XG4gICAgICAgIGV2dDogZXZ0XG4gICAgICB9KTtcblxuICAgICAgLy8gRGVsYXkgaXMgaW1wb3NzaWJsZSBmb3IgbmF0aXZlIERuRCBpbiBFZGdlIG9yIElFXG4gICAgICBpZiAob3B0aW9ucy5kZWxheSAmJiAoIW9wdGlvbnMuZGVsYXlPblRvdWNoT25seSB8fCB0b3VjaCkgJiYgKCF0aGlzLm5hdGl2ZURyYWdnYWJsZSB8fCAhKEVkZ2UgfHwgSUUxMU9yTGVzcykpKSB7XG4gICAgICAgIGlmIChTb3J0YWJsZS5ldmVudENhbmNlbGVkKSB7XG4gICAgICAgICAgdGhpcy5fb25Ecm9wKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIElmIHRoZSB1c2VyIG1vdmVzIHRoZSBwb2ludGVyIG9yIGxldCBnbyB0aGUgY2xpY2sgb3IgdG91Y2hcbiAgICAgICAgLy8gYmVmb3JlIHRoZSBkZWxheSBoYXMgYmVlbiByZWFjaGVkOlxuICAgICAgICAvLyBkaXNhYmxlIHRoZSBkZWxheWVkIGRyYWdcbiAgICAgICAgaWYgKG9wdGlvbnMuc3VwcG9ydFBvaW50ZXIpIHtcbiAgICAgICAgICBvbihvd25lckRvY3VtZW50LCAncG9pbnRlcnVwJywgX3RoaXMuX2Rpc2FibGVEZWxheWVkRHJhZyk7XG4gICAgICAgICAgb24ob3duZXJEb2N1bWVudCwgJ3BvaW50ZXJjYW5jZWwnLCBfdGhpcy5fZGlzYWJsZURlbGF5ZWREcmFnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvbihvd25lckRvY3VtZW50LCAnbW91c2V1cCcsIF90aGlzLl9kaXNhYmxlRGVsYXllZERyYWcpO1xuICAgICAgICAgIG9uKG93bmVyRG9jdW1lbnQsICd0b3VjaGVuZCcsIF90aGlzLl9kaXNhYmxlRGVsYXllZERyYWcpO1xuICAgICAgICAgIG9uKG93bmVyRG9jdW1lbnQsICd0b3VjaGNhbmNlbCcsIF90aGlzLl9kaXNhYmxlRGVsYXllZERyYWcpO1xuICAgICAgICB9XG4gICAgICAgIG9uKG93bmVyRG9jdW1lbnQsICdtb3VzZW1vdmUnLCBfdGhpcy5fZGVsYXllZERyYWdUb3VjaE1vdmVIYW5kbGVyKTtcbiAgICAgICAgb24ob3duZXJEb2N1bWVudCwgJ3RvdWNobW92ZScsIF90aGlzLl9kZWxheWVkRHJhZ1RvdWNoTW92ZUhhbmRsZXIpO1xuICAgICAgICBvcHRpb25zLnN1cHBvcnRQb2ludGVyICYmIG9uKG93bmVyRG9jdW1lbnQsICdwb2ludGVybW92ZScsIF90aGlzLl9kZWxheWVkRHJhZ1RvdWNoTW92ZUhhbmRsZXIpO1xuICAgICAgICBfdGhpcy5fZHJhZ1N0YXJ0VGltZXIgPSBzZXRUaW1lb3V0KGRyYWdTdGFydEZuLCBvcHRpb25zLmRlbGF5KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRyYWdTdGFydEZuKCk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuICBfZGVsYXllZERyYWdUb3VjaE1vdmVIYW5kbGVyOiBmdW5jdGlvbiBfZGVsYXllZERyYWdUb3VjaE1vdmVIYW5kbGVyKCAvKiogVG91Y2hFdmVudHxQb2ludGVyRXZlbnQgKiovZSkge1xuICAgIHZhciB0b3VjaCA9IGUudG91Y2hlcyA/IGUudG91Y2hlc1swXSA6IGU7XG4gICAgaWYgKE1hdGgubWF4KE1hdGguYWJzKHRvdWNoLmNsaWVudFggLSB0aGlzLl9sYXN0WCksIE1hdGguYWJzKHRvdWNoLmNsaWVudFkgLSB0aGlzLl9sYXN0WSkpID49IE1hdGguZmxvb3IodGhpcy5vcHRpb25zLnRvdWNoU3RhcnRUaHJlc2hvbGQgLyAodGhpcy5uYXRpdmVEcmFnZ2FibGUgJiYgd2luZG93LmRldmljZVBpeGVsUmF0aW8gfHwgMSkpKSB7XG4gICAgICB0aGlzLl9kaXNhYmxlRGVsYXllZERyYWcoKTtcbiAgICB9XG4gIH0sXG4gIF9kaXNhYmxlRGVsYXllZERyYWc6IGZ1bmN0aW9uIF9kaXNhYmxlRGVsYXllZERyYWcoKSB7XG4gICAgZHJhZ0VsICYmIF9kaXNhYmxlRHJhZ2dhYmxlKGRyYWdFbCk7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuX2RyYWdTdGFydFRpbWVyKTtcbiAgICB0aGlzLl9kaXNhYmxlRGVsYXllZERyYWdFdmVudHMoKTtcbiAgfSxcbiAgX2Rpc2FibGVEZWxheWVkRHJhZ0V2ZW50czogZnVuY3Rpb24gX2Rpc2FibGVEZWxheWVkRHJhZ0V2ZW50cygpIHtcbiAgICB2YXIgb3duZXJEb2N1bWVudCA9IHRoaXMuZWwub3duZXJEb2N1bWVudDtcbiAgICBvZmYob3duZXJEb2N1bWVudCwgJ21vdXNldXAnLCB0aGlzLl9kaXNhYmxlRGVsYXllZERyYWcpO1xuICAgIG9mZihvd25lckRvY3VtZW50LCAndG91Y2hlbmQnLCB0aGlzLl9kaXNhYmxlRGVsYXllZERyYWcpO1xuICAgIG9mZihvd25lckRvY3VtZW50LCAndG91Y2hjYW5jZWwnLCB0aGlzLl9kaXNhYmxlRGVsYXllZERyYWcpO1xuICAgIG9mZihvd25lckRvY3VtZW50LCAncG9pbnRlcnVwJywgdGhpcy5fZGlzYWJsZURlbGF5ZWREcmFnKTtcbiAgICBvZmYob3duZXJEb2N1bWVudCwgJ3BvaW50ZXJjYW5jZWwnLCB0aGlzLl9kaXNhYmxlRGVsYXllZERyYWcpO1xuICAgIG9mZihvd25lckRvY3VtZW50LCAnbW91c2Vtb3ZlJywgdGhpcy5fZGVsYXllZERyYWdUb3VjaE1vdmVIYW5kbGVyKTtcbiAgICBvZmYob3duZXJEb2N1bWVudCwgJ3RvdWNobW92ZScsIHRoaXMuX2RlbGF5ZWREcmFnVG91Y2hNb3ZlSGFuZGxlcik7XG4gICAgb2ZmKG93bmVyRG9jdW1lbnQsICdwb2ludGVybW92ZScsIHRoaXMuX2RlbGF5ZWREcmFnVG91Y2hNb3ZlSGFuZGxlcik7XG4gIH0sXG4gIF90cmlnZ2VyRHJhZ1N0YXJ0OiBmdW5jdGlvbiBfdHJpZ2dlckRyYWdTdGFydCggLyoqIEV2ZW50ICovZXZ0LCAvKiogVG91Y2ggKi90b3VjaCkge1xuICAgIHRvdWNoID0gdG91Y2ggfHwgZXZ0LnBvaW50ZXJUeXBlID09ICd0b3VjaCcgJiYgZXZ0O1xuICAgIGlmICghdGhpcy5uYXRpdmVEcmFnZ2FibGUgfHwgdG91Y2gpIHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuc3VwcG9ydFBvaW50ZXIpIHtcbiAgICAgICAgb24oZG9jdW1lbnQsICdwb2ludGVybW92ZScsIHRoaXMuX29uVG91Y2hNb3ZlKTtcbiAgICAgIH0gZWxzZSBpZiAodG91Y2gpIHtcbiAgICAgICAgb24oZG9jdW1lbnQsICd0b3VjaG1vdmUnLCB0aGlzLl9vblRvdWNoTW92ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvbihkb2N1bWVudCwgJ21vdXNlbW92ZScsIHRoaXMuX29uVG91Y2hNb3ZlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgb24oZHJhZ0VsLCAnZHJhZ2VuZCcsIHRoaXMpO1xuICAgICAgb24ocm9vdEVsLCAnZHJhZ3N0YXJ0JywgdGhpcy5fb25EcmFnU3RhcnQpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgaWYgKGRvY3VtZW50LnNlbGVjdGlvbikge1xuICAgICAgICBfbmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGRvY3VtZW50LnNlbGVjdGlvbi5lbXB0eSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHdpbmRvdy5nZXRTZWxlY3Rpb24oKS5yZW1vdmVBbGxSYW5nZXMoKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnIpIHt9XG4gIH0sXG4gIF9kcmFnU3RhcnRlZDogZnVuY3Rpb24gX2RyYWdTdGFydGVkKGZhbGxiYWNrLCBldnQpIHtcbiAgICBhd2FpdGluZ0RyYWdTdGFydGVkID0gZmFsc2U7XG4gICAgaWYgKHJvb3RFbCAmJiBkcmFnRWwpIHtcbiAgICAgIHBsdWdpbkV2ZW50KCdkcmFnU3RhcnRlZCcsIHRoaXMsIHtcbiAgICAgICAgZXZ0OiBldnRcbiAgICAgIH0pO1xuICAgICAgaWYgKHRoaXMubmF0aXZlRHJhZ2dhYmxlKSB7XG4gICAgICAgIG9uKGRvY3VtZW50LCAnZHJhZ292ZXInLCBfY2hlY2tPdXRzaWRlVGFyZ2V0RWwpO1xuICAgICAgfVxuICAgICAgdmFyIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG5cbiAgICAgIC8vIEFwcGx5IGVmZmVjdFxuICAgICAgIWZhbGxiYWNrICYmIHRvZ2dsZUNsYXNzKGRyYWdFbCwgb3B0aW9ucy5kcmFnQ2xhc3MsIGZhbHNlKTtcbiAgICAgIHRvZ2dsZUNsYXNzKGRyYWdFbCwgb3B0aW9ucy5naG9zdENsYXNzLCB0cnVlKTtcbiAgICAgIFNvcnRhYmxlLmFjdGl2ZSA9IHRoaXM7XG4gICAgICBmYWxsYmFjayAmJiB0aGlzLl9hcHBlbmRHaG9zdCgpO1xuXG4gICAgICAvLyBEcmFnIHN0YXJ0IGV2ZW50XG4gICAgICBfZGlzcGF0Y2hFdmVudCh7XG4gICAgICAgIHNvcnRhYmxlOiB0aGlzLFxuICAgICAgICBuYW1lOiAnc3RhcnQnLFxuICAgICAgICBvcmlnaW5hbEV2ZW50OiBldnRcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9udWxsaW5nKCk7XG4gICAgfVxuICB9LFxuICBfZW11bGF0ZURyYWdPdmVyOiBmdW5jdGlvbiBfZW11bGF0ZURyYWdPdmVyKCkge1xuICAgIGlmICh0b3VjaEV2dCkge1xuICAgICAgdGhpcy5fbGFzdFggPSB0b3VjaEV2dC5jbGllbnRYO1xuICAgICAgdGhpcy5fbGFzdFkgPSB0b3VjaEV2dC5jbGllbnRZO1xuICAgICAgX2hpZGVHaG9zdEZvclRhcmdldCgpO1xuICAgICAgdmFyIHRhcmdldCA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQodG91Y2hFdnQuY2xpZW50WCwgdG91Y2hFdnQuY2xpZW50WSk7XG4gICAgICB2YXIgcGFyZW50ID0gdGFyZ2V0O1xuICAgICAgd2hpbGUgKHRhcmdldCAmJiB0YXJnZXQuc2hhZG93Um9vdCkge1xuICAgICAgICB0YXJnZXQgPSB0YXJnZXQuc2hhZG93Um9vdC5lbGVtZW50RnJvbVBvaW50KHRvdWNoRXZ0LmNsaWVudFgsIHRvdWNoRXZ0LmNsaWVudFkpO1xuICAgICAgICBpZiAodGFyZ2V0ID09PSBwYXJlbnQpIGJyZWFrO1xuICAgICAgICBwYXJlbnQgPSB0YXJnZXQ7XG4gICAgICB9XG4gICAgICBkcmFnRWwucGFyZW50Tm9kZVtleHBhbmRvXS5faXNPdXRzaWRlVGhpc0VsKHRhcmdldCk7XG4gICAgICBpZiAocGFyZW50KSB7XG4gICAgICAgIGRvIHtcbiAgICAgICAgICBpZiAocGFyZW50W2V4cGFuZG9dKSB7XG4gICAgICAgICAgICB2YXIgaW5zZXJ0ZWQgPSB2b2lkIDA7XG4gICAgICAgICAgICBpbnNlcnRlZCA9IHBhcmVudFtleHBhbmRvXS5fb25EcmFnT3Zlcih7XG4gICAgICAgICAgICAgIGNsaWVudFg6IHRvdWNoRXZ0LmNsaWVudFgsXG4gICAgICAgICAgICAgIGNsaWVudFk6IHRvdWNoRXZ0LmNsaWVudFksXG4gICAgICAgICAgICAgIHRhcmdldDogdGFyZ2V0LFxuICAgICAgICAgICAgICByb290RWw6IHBhcmVudFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoaW5zZXJ0ZWQgJiYgIXRoaXMub3B0aW9ucy5kcmFnb3ZlckJ1YmJsZSkge1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgdGFyZ2V0ID0gcGFyZW50OyAvLyBzdG9yZSBsYXN0IGVsZW1lbnRcbiAgICAgICAgfVxuICAgICAgICAvKiBqc2hpbnQgYm9zczp0cnVlICovIHdoaWxlIChwYXJlbnQgPSBnZXRQYXJlbnRPckhvc3QocGFyZW50KSk7XG4gICAgICB9XG4gICAgICBfdW5oaWRlR2hvc3RGb3JUYXJnZXQoKTtcbiAgICB9XG4gIH0sXG4gIF9vblRvdWNoTW92ZTogZnVuY3Rpb24gX29uVG91Y2hNb3ZlKCAvKipUb3VjaEV2ZW50Ki9ldnQpIHtcbiAgICBpZiAodGFwRXZ0KSB7XG4gICAgICB2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucyxcbiAgICAgICAgZmFsbGJhY2tUb2xlcmFuY2UgPSBvcHRpb25zLmZhbGxiYWNrVG9sZXJhbmNlLFxuICAgICAgICBmYWxsYmFja09mZnNldCA9IG9wdGlvbnMuZmFsbGJhY2tPZmZzZXQsXG4gICAgICAgIHRvdWNoID0gZXZ0LnRvdWNoZXMgPyBldnQudG91Y2hlc1swXSA6IGV2dCxcbiAgICAgICAgZ2hvc3RNYXRyaXggPSBnaG9zdEVsICYmIG1hdHJpeChnaG9zdEVsLCB0cnVlKSxcbiAgICAgICAgc2NhbGVYID0gZ2hvc3RFbCAmJiBnaG9zdE1hdHJpeCAmJiBnaG9zdE1hdHJpeC5hLFxuICAgICAgICBzY2FsZVkgPSBnaG9zdEVsICYmIGdob3N0TWF0cml4ICYmIGdob3N0TWF0cml4LmQsXG4gICAgICAgIHJlbGF0aXZlU2Nyb2xsT2Zmc2V0ID0gUG9zaXRpb25HaG9zdEFic29sdXRlbHkgJiYgZ2hvc3RSZWxhdGl2ZVBhcmVudCAmJiBnZXRSZWxhdGl2ZVNjcm9sbE9mZnNldChnaG9zdFJlbGF0aXZlUGFyZW50KSxcbiAgICAgICAgZHggPSAodG91Y2guY2xpZW50WCAtIHRhcEV2dC5jbGllbnRYICsgZmFsbGJhY2tPZmZzZXQueCkgLyAoc2NhbGVYIHx8IDEpICsgKHJlbGF0aXZlU2Nyb2xsT2Zmc2V0ID8gcmVsYXRpdmVTY3JvbGxPZmZzZXRbMF0gLSBnaG9zdFJlbGF0aXZlUGFyZW50SW5pdGlhbFNjcm9sbFswXSA6IDApIC8gKHNjYWxlWCB8fCAxKSxcbiAgICAgICAgZHkgPSAodG91Y2guY2xpZW50WSAtIHRhcEV2dC5jbGllbnRZICsgZmFsbGJhY2tPZmZzZXQueSkgLyAoc2NhbGVZIHx8IDEpICsgKHJlbGF0aXZlU2Nyb2xsT2Zmc2V0ID8gcmVsYXRpdmVTY3JvbGxPZmZzZXRbMV0gLSBnaG9zdFJlbGF0aXZlUGFyZW50SW5pdGlhbFNjcm9sbFsxXSA6IDApIC8gKHNjYWxlWSB8fCAxKTtcblxuICAgICAgLy8gb25seSBzZXQgdGhlIHN0YXR1cyB0byBkcmFnZ2luZywgd2hlbiB3ZSBhcmUgYWN0dWFsbHkgZHJhZ2dpbmdcbiAgICAgIGlmICghU29ydGFibGUuYWN0aXZlICYmICFhd2FpdGluZ0RyYWdTdGFydGVkKSB7XG4gICAgICAgIGlmIChmYWxsYmFja1RvbGVyYW5jZSAmJiBNYXRoLm1heChNYXRoLmFicyh0b3VjaC5jbGllbnRYIC0gdGhpcy5fbGFzdFgpLCBNYXRoLmFicyh0b3VjaC5jbGllbnRZIC0gdGhpcy5fbGFzdFkpKSA8IGZhbGxiYWNrVG9sZXJhbmNlKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX29uRHJhZ1N0YXJ0KGV2dCwgdHJ1ZSk7XG4gICAgICB9XG4gICAgICBpZiAoZ2hvc3RFbCkge1xuICAgICAgICBpZiAoZ2hvc3RNYXRyaXgpIHtcbiAgICAgICAgICBnaG9zdE1hdHJpeC5lICs9IGR4IC0gKGxhc3REeCB8fCAwKTtcbiAgICAgICAgICBnaG9zdE1hdHJpeC5mICs9IGR5IC0gKGxhc3REeSB8fCAwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBnaG9zdE1hdHJpeCA9IHtcbiAgICAgICAgICAgIGE6IDEsXG4gICAgICAgICAgICBiOiAwLFxuICAgICAgICAgICAgYzogMCxcbiAgICAgICAgICAgIGQ6IDEsXG4gICAgICAgICAgICBlOiBkeCxcbiAgICAgICAgICAgIGY6IGR5XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgY3NzTWF0cml4ID0gXCJtYXRyaXgoXCIuY29uY2F0KGdob3N0TWF0cml4LmEsIFwiLFwiKS5jb25jYXQoZ2hvc3RNYXRyaXguYiwgXCIsXCIpLmNvbmNhdChnaG9zdE1hdHJpeC5jLCBcIixcIikuY29uY2F0KGdob3N0TWF0cml4LmQsIFwiLFwiKS5jb25jYXQoZ2hvc3RNYXRyaXguZSwgXCIsXCIpLmNvbmNhdChnaG9zdE1hdHJpeC5mLCBcIilcIik7XG4gICAgICAgIGNzcyhnaG9zdEVsLCAnd2Via2l0VHJhbnNmb3JtJywgY3NzTWF0cml4KTtcbiAgICAgICAgY3NzKGdob3N0RWwsICdtb3pUcmFuc2Zvcm0nLCBjc3NNYXRyaXgpO1xuICAgICAgICBjc3MoZ2hvc3RFbCwgJ21zVHJhbnNmb3JtJywgY3NzTWF0cml4KTtcbiAgICAgICAgY3NzKGdob3N0RWwsICd0cmFuc2Zvcm0nLCBjc3NNYXRyaXgpO1xuICAgICAgICBsYXN0RHggPSBkeDtcbiAgICAgICAgbGFzdER5ID0gZHk7XG4gICAgICAgIHRvdWNoRXZ0ID0gdG91Y2g7XG4gICAgICB9XG4gICAgICBldnQuY2FuY2VsYWJsZSAmJiBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG4gIH0sXG4gIF9hcHBlbmRHaG9zdDogZnVuY3Rpb24gX2FwcGVuZEdob3N0KCkge1xuICAgIC8vIEJ1ZyBpZiB1c2luZyBzY2FsZSgpOiBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8yNjM3MDU4XG4gICAgLy8gTm90IGJlaW5nIGFkanVzdGVkIGZvclxuICAgIGlmICghZ2hvc3RFbCkge1xuICAgICAgdmFyIGNvbnRhaW5lciA9IHRoaXMub3B0aW9ucy5mYWxsYmFja09uQm9keSA/IGRvY3VtZW50LmJvZHkgOiByb290RWwsXG4gICAgICAgIHJlY3QgPSBnZXRSZWN0KGRyYWdFbCwgdHJ1ZSwgUG9zaXRpb25HaG9zdEFic29sdXRlbHksIHRydWUsIGNvbnRhaW5lciksXG4gICAgICAgIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG5cbiAgICAgIC8vIFBvc2l0aW9uIGFic29sdXRlbHlcbiAgICAgIGlmIChQb3NpdGlvbkdob3N0QWJzb2x1dGVseSkge1xuICAgICAgICAvLyBHZXQgcmVsYXRpdmVseSBwb3NpdGlvbmVkIHBhcmVudFxuICAgICAgICBnaG9zdFJlbGF0aXZlUGFyZW50ID0gY29udGFpbmVyO1xuICAgICAgICB3aGlsZSAoY3NzKGdob3N0UmVsYXRpdmVQYXJlbnQsICdwb3NpdGlvbicpID09PSAnc3RhdGljJyAmJiBjc3MoZ2hvc3RSZWxhdGl2ZVBhcmVudCwgJ3RyYW5zZm9ybScpID09PSAnbm9uZScgJiYgZ2hvc3RSZWxhdGl2ZVBhcmVudCAhPT0gZG9jdW1lbnQpIHtcbiAgICAgICAgICBnaG9zdFJlbGF0aXZlUGFyZW50ID0gZ2hvc3RSZWxhdGl2ZVBhcmVudC5wYXJlbnROb2RlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChnaG9zdFJlbGF0aXZlUGFyZW50ICE9PSBkb2N1bWVudC5ib2R5ICYmIGdob3N0UmVsYXRpdmVQYXJlbnQgIT09IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCkge1xuICAgICAgICAgIGlmIChnaG9zdFJlbGF0aXZlUGFyZW50ID09PSBkb2N1bWVudCkgZ2hvc3RSZWxhdGl2ZVBhcmVudCA9IGdldFdpbmRvd1Njcm9sbGluZ0VsZW1lbnQoKTtcbiAgICAgICAgICByZWN0LnRvcCArPSBnaG9zdFJlbGF0aXZlUGFyZW50LnNjcm9sbFRvcDtcbiAgICAgICAgICByZWN0LmxlZnQgKz0gZ2hvc3RSZWxhdGl2ZVBhcmVudC5zY3JvbGxMZWZ0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGdob3N0UmVsYXRpdmVQYXJlbnQgPSBnZXRXaW5kb3dTY3JvbGxpbmdFbGVtZW50KCk7XG4gICAgICAgIH1cbiAgICAgICAgZ2hvc3RSZWxhdGl2ZVBhcmVudEluaXRpYWxTY3JvbGwgPSBnZXRSZWxhdGl2ZVNjcm9sbE9mZnNldChnaG9zdFJlbGF0aXZlUGFyZW50KTtcbiAgICAgIH1cbiAgICAgIGdob3N0RWwgPSBkcmFnRWwuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgdG9nZ2xlQ2xhc3MoZ2hvc3RFbCwgb3B0aW9ucy5naG9zdENsYXNzLCBmYWxzZSk7XG4gICAgICB0b2dnbGVDbGFzcyhnaG9zdEVsLCBvcHRpb25zLmZhbGxiYWNrQ2xhc3MsIHRydWUpO1xuICAgICAgdG9nZ2xlQ2xhc3MoZ2hvc3RFbCwgb3B0aW9ucy5kcmFnQ2xhc3MsIHRydWUpO1xuICAgICAgY3NzKGdob3N0RWwsICd0cmFuc2l0aW9uJywgJycpO1xuICAgICAgY3NzKGdob3N0RWwsICd0cmFuc2Zvcm0nLCAnJyk7XG4gICAgICBjc3MoZ2hvc3RFbCwgJ2JveC1zaXppbmcnLCAnYm9yZGVyLWJveCcpO1xuICAgICAgY3NzKGdob3N0RWwsICdtYXJnaW4nLCAwKTtcbiAgICAgIGNzcyhnaG9zdEVsLCAndG9wJywgcmVjdC50b3ApO1xuICAgICAgY3NzKGdob3N0RWwsICdsZWZ0JywgcmVjdC5sZWZ0KTtcbiAgICAgIGNzcyhnaG9zdEVsLCAnd2lkdGgnLCByZWN0LndpZHRoKTtcbiAgICAgIGNzcyhnaG9zdEVsLCAnaGVpZ2h0JywgcmVjdC5oZWlnaHQpO1xuICAgICAgY3NzKGdob3N0RWwsICdvcGFjaXR5JywgJzAuOCcpO1xuICAgICAgY3NzKGdob3N0RWwsICdwb3NpdGlvbicsIFBvc2l0aW9uR2hvc3RBYnNvbHV0ZWx5ID8gJ2Fic29sdXRlJyA6ICdmaXhlZCcpO1xuICAgICAgY3NzKGdob3N0RWwsICd6SW5kZXgnLCAnMTAwMDAwJyk7XG4gICAgICBjc3MoZ2hvc3RFbCwgJ3BvaW50ZXJFdmVudHMnLCAnbm9uZScpO1xuICAgICAgU29ydGFibGUuZ2hvc3QgPSBnaG9zdEVsO1xuICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGdob3N0RWwpO1xuXG4gICAgICAvLyBTZXQgdHJhbnNmb3JtLW9yaWdpblxuICAgICAgY3NzKGdob3N0RWwsICd0cmFuc2Zvcm0tb3JpZ2luJywgdGFwRGlzdGFuY2VMZWZ0IC8gcGFyc2VJbnQoZ2hvc3RFbC5zdHlsZS53aWR0aCkgKiAxMDAgKyAnJSAnICsgdGFwRGlzdGFuY2VUb3AgLyBwYXJzZUludChnaG9zdEVsLnN0eWxlLmhlaWdodCkgKiAxMDAgKyAnJScpO1xuICAgIH1cbiAgfSxcbiAgX29uRHJhZ1N0YXJ0OiBmdW5jdGlvbiBfb25EcmFnU3RhcnQoIC8qKkV2ZW50Ki9ldnQsIC8qKmJvb2xlYW4qL2ZhbGxiYWNrKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICB2YXIgZGF0YVRyYW5zZmVyID0gZXZ0LmRhdGFUcmFuc2ZlcjtcbiAgICB2YXIgb3B0aW9ucyA9IF90aGlzLm9wdGlvbnM7XG4gICAgcGx1Z2luRXZlbnQoJ2RyYWdTdGFydCcsIHRoaXMsIHtcbiAgICAgIGV2dDogZXZ0XG4gICAgfSk7XG4gICAgaWYgKFNvcnRhYmxlLmV2ZW50Q2FuY2VsZWQpIHtcbiAgICAgIHRoaXMuX29uRHJvcCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBwbHVnaW5FdmVudCgnc2V0dXBDbG9uZScsIHRoaXMpO1xuICAgIGlmICghU29ydGFibGUuZXZlbnRDYW5jZWxlZCkge1xuICAgICAgY2xvbmVFbCA9IGNsb25lKGRyYWdFbCk7XG4gICAgICBjbG9uZUVsLnJlbW92ZUF0dHJpYnV0ZShcImlkXCIpO1xuICAgICAgY2xvbmVFbC5kcmFnZ2FibGUgPSBmYWxzZTtcbiAgICAgIGNsb25lRWwuc3R5bGVbJ3dpbGwtY2hhbmdlJ10gPSAnJztcbiAgICAgIHRoaXMuX2hpZGVDbG9uZSgpO1xuICAgICAgdG9nZ2xlQ2xhc3MoY2xvbmVFbCwgdGhpcy5vcHRpb25zLmNob3NlbkNsYXNzLCBmYWxzZSk7XG4gICAgICBTb3J0YWJsZS5jbG9uZSA9IGNsb25lRWw7XG4gICAgfVxuXG4gICAgLy8gIzExNDM6IElGcmFtZSBzdXBwb3J0IHdvcmthcm91bmRcbiAgICBfdGhpcy5jbG9uZUlkID0gX25leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgIHBsdWdpbkV2ZW50KCdjbG9uZScsIF90aGlzKTtcbiAgICAgIGlmIChTb3J0YWJsZS5ldmVudENhbmNlbGVkKSByZXR1cm47XG4gICAgICBpZiAoIV90aGlzLm9wdGlvbnMucmVtb3ZlQ2xvbmVPbkhpZGUpIHtcbiAgICAgICAgcm9vdEVsLmluc2VydEJlZm9yZShjbG9uZUVsLCBkcmFnRWwpO1xuICAgICAgfVxuICAgICAgX3RoaXMuX2hpZGVDbG9uZSgpO1xuICAgICAgX2Rpc3BhdGNoRXZlbnQoe1xuICAgICAgICBzb3J0YWJsZTogX3RoaXMsXG4gICAgICAgIG5hbWU6ICdjbG9uZSdcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgICFmYWxsYmFjayAmJiB0b2dnbGVDbGFzcyhkcmFnRWwsIG9wdGlvbnMuZHJhZ0NsYXNzLCB0cnVlKTtcblxuICAgIC8vIFNldCBwcm9wZXIgZHJvcCBldmVudHNcbiAgICBpZiAoZmFsbGJhY2spIHtcbiAgICAgIGlnbm9yZU5leHRDbGljayA9IHRydWU7XG4gICAgICBfdGhpcy5fbG9vcElkID0gc2V0SW50ZXJ2YWwoX3RoaXMuX2VtdWxhdGVEcmFnT3ZlciwgNTApO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBVbmRvIHdoYXQgd2FzIHNldCBpbiBfcHJlcGFyZURyYWdTdGFydCBiZWZvcmUgZHJhZyBzdGFydGVkXG4gICAgICBvZmYoZG9jdW1lbnQsICdtb3VzZXVwJywgX3RoaXMuX29uRHJvcCk7XG4gICAgICBvZmYoZG9jdW1lbnQsICd0b3VjaGVuZCcsIF90aGlzLl9vbkRyb3ApO1xuICAgICAgb2ZmKGRvY3VtZW50LCAndG91Y2hjYW5jZWwnLCBfdGhpcy5fb25Ecm9wKTtcbiAgICAgIGlmIChkYXRhVHJhbnNmZXIpIHtcbiAgICAgICAgZGF0YVRyYW5zZmVyLmVmZmVjdEFsbG93ZWQgPSAnbW92ZSc7XG4gICAgICAgIG9wdGlvbnMuc2V0RGF0YSAmJiBvcHRpb25zLnNldERhdGEuY2FsbChfdGhpcywgZGF0YVRyYW5zZmVyLCBkcmFnRWwpO1xuICAgICAgfVxuICAgICAgb24oZG9jdW1lbnQsICdkcm9wJywgX3RoaXMpO1xuXG4gICAgICAvLyAjMTI3NiBmaXg6XG4gICAgICBjc3MoZHJhZ0VsLCAndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZVooMCknKTtcbiAgICB9XG4gICAgYXdhaXRpbmdEcmFnU3RhcnRlZCA9IHRydWU7XG4gICAgX3RoaXMuX2RyYWdTdGFydElkID0gX25leHRUaWNrKF90aGlzLl9kcmFnU3RhcnRlZC5iaW5kKF90aGlzLCBmYWxsYmFjaywgZXZ0KSk7XG4gICAgb24oZG9jdW1lbnQsICdzZWxlY3RzdGFydCcsIF90aGlzKTtcbiAgICBtb3ZlZCA9IHRydWU7XG4gICAgd2luZG93LmdldFNlbGVjdGlvbigpLnJlbW92ZUFsbFJhbmdlcygpO1xuICAgIGlmIChTYWZhcmkpIHtcbiAgICAgIGNzcyhkb2N1bWVudC5ib2R5LCAndXNlci1zZWxlY3QnLCAnbm9uZScpO1xuICAgIH1cbiAgfSxcbiAgLy8gUmV0dXJucyB0cnVlIC0gaWYgbm8gZnVydGhlciBhY3Rpb24gaXMgbmVlZGVkIChlaXRoZXIgaW5zZXJ0ZWQgb3IgYW5vdGhlciBjb25kaXRpb24pXG4gIF9vbkRyYWdPdmVyOiBmdW5jdGlvbiBfb25EcmFnT3ZlciggLyoqRXZlbnQqL2V2dCkge1xuICAgIHZhciBlbCA9IHRoaXMuZWwsXG4gICAgICB0YXJnZXQgPSBldnQudGFyZ2V0LFxuICAgICAgZHJhZ1JlY3QsXG4gICAgICB0YXJnZXRSZWN0LFxuICAgICAgcmV2ZXJ0LFxuICAgICAgb3B0aW9ucyA9IHRoaXMub3B0aW9ucyxcbiAgICAgIGdyb3VwID0gb3B0aW9ucy5ncm91cCxcbiAgICAgIGFjdGl2ZVNvcnRhYmxlID0gU29ydGFibGUuYWN0aXZlLFxuICAgICAgaXNPd25lciA9IGFjdGl2ZUdyb3VwID09PSBncm91cCxcbiAgICAgIGNhblNvcnQgPSBvcHRpb25zLnNvcnQsXG4gICAgICBmcm9tU29ydGFibGUgPSBwdXRTb3J0YWJsZSB8fCBhY3RpdmVTb3J0YWJsZSxcbiAgICAgIHZlcnRpY2FsLFxuICAgICAgX3RoaXMgPSB0aGlzLFxuICAgICAgY29tcGxldGVkRmlyZWQgPSBmYWxzZTtcbiAgICBpZiAoX3NpbGVudCkgcmV0dXJuO1xuICAgIGZ1bmN0aW9uIGRyYWdPdmVyRXZlbnQobmFtZSwgZXh0cmEpIHtcbiAgICAgIHBsdWdpbkV2ZW50KG5hbWUsIF90aGlzLCBfb2JqZWN0U3ByZWFkMih7XG4gICAgICAgIGV2dDogZXZ0LFxuICAgICAgICBpc093bmVyOiBpc093bmVyLFxuICAgICAgICBheGlzOiB2ZXJ0aWNhbCA/ICd2ZXJ0aWNhbCcgOiAnaG9yaXpvbnRhbCcsXG4gICAgICAgIHJldmVydDogcmV2ZXJ0LFxuICAgICAgICBkcmFnUmVjdDogZHJhZ1JlY3QsXG4gICAgICAgIHRhcmdldFJlY3Q6IHRhcmdldFJlY3QsXG4gICAgICAgIGNhblNvcnQ6IGNhblNvcnQsXG4gICAgICAgIGZyb21Tb3J0YWJsZTogZnJvbVNvcnRhYmxlLFxuICAgICAgICB0YXJnZXQ6IHRhcmdldCxcbiAgICAgICAgY29tcGxldGVkOiBjb21wbGV0ZWQsXG4gICAgICAgIG9uTW92ZTogZnVuY3Rpb24gb25Nb3ZlKHRhcmdldCwgYWZ0ZXIpIHtcbiAgICAgICAgICByZXR1cm4gX29uTW92ZShyb290RWwsIGVsLCBkcmFnRWwsIGRyYWdSZWN0LCB0YXJnZXQsIGdldFJlY3QodGFyZ2V0KSwgZXZ0LCBhZnRlcik7XG4gICAgICAgIH0sXG4gICAgICAgIGNoYW5nZWQ6IGNoYW5nZWRcbiAgICAgIH0sIGV4dHJhKSk7XG4gICAgfVxuXG4gICAgLy8gQ2FwdHVyZSBhbmltYXRpb24gc3RhdGVcbiAgICBmdW5jdGlvbiBjYXB0dXJlKCkge1xuICAgICAgZHJhZ092ZXJFdmVudCgnZHJhZ092ZXJBbmltYXRpb25DYXB0dXJlJyk7XG4gICAgICBfdGhpcy5jYXB0dXJlQW5pbWF0aW9uU3RhdGUoKTtcbiAgICAgIGlmIChfdGhpcyAhPT0gZnJvbVNvcnRhYmxlKSB7XG4gICAgICAgIGZyb21Tb3J0YWJsZS5jYXB0dXJlQW5pbWF0aW9uU3RhdGUoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBSZXR1cm4gaW52b2NhdGlvbiB3aGVuIGRyYWdFbCBpcyBpbnNlcnRlZCAob3IgY29tcGxldGVkKVxuICAgIGZ1bmN0aW9uIGNvbXBsZXRlZChpbnNlcnRpb24pIHtcbiAgICAgIGRyYWdPdmVyRXZlbnQoJ2RyYWdPdmVyQ29tcGxldGVkJywge1xuICAgICAgICBpbnNlcnRpb246IGluc2VydGlvblxuICAgICAgfSk7XG4gICAgICBpZiAoaW5zZXJ0aW9uKSB7XG4gICAgICAgIC8vIENsb25lcyBtdXN0IGJlIGhpZGRlbiBiZWZvcmUgZm9sZGluZyBhbmltYXRpb24gdG8gY2FwdHVyZSBkcmFnUmVjdEFic29sdXRlIHByb3Blcmx5XG4gICAgICAgIGlmIChpc093bmVyKSB7XG4gICAgICAgICAgYWN0aXZlU29ydGFibGUuX2hpZGVDbG9uZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGFjdGl2ZVNvcnRhYmxlLl9zaG93Q2xvbmUoX3RoaXMpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChfdGhpcyAhPT0gZnJvbVNvcnRhYmxlKSB7XG4gICAgICAgICAgLy8gU2V0IGdob3N0IGNsYXNzIHRvIG5ldyBzb3J0YWJsZSdzIGdob3N0IGNsYXNzXG4gICAgICAgICAgdG9nZ2xlQ2xhc3MoZHJhZ0VsLCBwdXRTb3J0YWJsZSA/IHB1dFNvcnRhYmxlLm9wdGlvbnMuZ2hvc3RDbGFzcyA6IGFjdGl2ZVNvcnRhYmxlLm9wdGlvbnMuZ2hvc3RDbGFzcywgZmFsc2UpO1xuICAgICAgICAgIHRvZ2dsZUNsYXNzKGRyYWdFbCwgb3B0aW9ucy5naG9zdENsYXNzLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocHV0U29ydGFibGUgIT09IF90aGlzICYmIF90aGlzICE9PSBTb3J0YWJsZS5hY3RpdmUpIHtcbiAgICAgICAgICBwdXRTb3J0YWJsZSA9IF90aGlzO1xuICAgICAgICB9IGVsc2UgaWYgKF90aGlzID09PSBTb3J0YWJsZS5hY3RpdmUgJiYgcHV0U29ydGFibGUpIHtcbiAgICAgICAgICBwdXRTb3J0YWJsZSA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBbmltYXRpb25cbiAgICAgICAgaWYgKGZyb21Tb3J0YWJsZSA9PT0gX3RoaXMpIHtcbiAgICAgICAgICBfdGhpcy5faWdub3JlV2hpbGVBbmltYXRpbmcgPSB0YXJnZXQ7XG4gICAgICAgIH1cbiAgICAgICAgX3RoaXMuYW5pbWF0ZUFsbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgZHJhZ092ZXJFdmVudCgnZHJhZ092ZXJBbmltYXRpb25Db21wbGV0ZScpO1xuICAgICAgICAgIF90aGlzLl9pZ25vcmVXaGlsZUFuaW1hdGluZyA9IG51bGw7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoX3RoaXMgIT09IGZyb21Tb3J0YWJsZSkge1xuICAgICAgICAgIGZyb21Tb3J0YWJsZS5hbmltYXRlQWxsKCk7XG4gICAgICAgICAgZnJvbVNvcnRhYmxlLl9pZ25vcmVXaGlsZUFuaW1hdGluZyA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gTnVsbCBsYXN0VGFyZ2V0IGlmIGl0IGlzIG5vdCBpbnNpZGUgYSBwcmV2aW91c2x5IHN3YXBwZWQgZWxlbWVudFxuICAgICAgaWYgKHRhcmdldCA9PT0gZHJhZ0VsICYmICFkcmFnRWwuYW5pbWF0ZWQgfHwgdGFyZ2V0ID09PSBlbCAmJiAhdGFyZ2V0LmFuaW1hdGVkKSB7XG4gICAgICAgIGxhc3RUYXJnZXQgPSBudWxsO1xuICAgICAgfVxuXG4gICAgICAvLyBubyBidWJibGluZyBhbmQgbm90IGZhbGxiYWNrXG4gICAgICBpZiAoIW9wdGlvbnMuZHJhZ292ZXJCdWJibGUgJiYgIWV2dC5yb290RWwgJiYgdGFyZ2V0ICE9PSBkb2N1bWVudCkge1xuICAgICAgICBkcmFnRWwucGFyZW50Tm9kZVtleHBhbmRvXS5faXNPdXRzaWRlVGhpc0VsKGV2dC50YXJnZXQpO1xuXG4gICAgICAgIC8vIERvIG5vdCBkZXRlY3QgZm9yIGVtcHR5IGluc2VydCBpZiBhbHJlYWR5IGluc2VydGVkXG4gICAgICAgICFpbnNlcnRpb24gJiYgbmVhcmVzdEVtcHR5SW5zZXJ0RGV0ZWN0RXZlbnQoZXZ0KTtcbiAgICAgIH1cbiAgICAgICFvcHRpb25zLmRyYWdvdmVyQnViYmxlICYmIGV2dC5zdG9wUHJvcGFnYXRpb24gJiYgZXZ0LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgcmV0dXJuIGNvbXBsZXRlZEZpcmVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBDYWxsIHdoZW4gZHJhZ0VsIGhhcyBiZWVuIGluc2VydGVkXG4gICAgZnVuY3Rpb24gY2hhbmdlZCgpIHtcbiAgICAgIG5ld0luZGV4ID0gaW5kZXgoZHJhZ0VsKTtcbiAgICAgIG5ld0RyYWdnYWJsZUluZGV4ID0gaW5kZXgoZHJhZ0VsLCBvcHRpb25zLmRyYWdnYWJsZSk7XG4gICAgICBfZGlzcGF0Y2hFdmVudCh7XG4gICAgICAgIHNvcnRhYmxlOiBfdGhpcyxcbiAgICAgICAgbmFtZTogJ2NoYW5nZScsXG4gICAgICAgIHRvRWw6IGVsLFxuICAgICAgICBuZXdJbmRleDogbmV3SW5kZXgsXG4gICAgICAgIG5ld0RyYWdnYWJsZUluZGV4OiBuZXdEcmFnZ2FibGVJbmRleCxcbiAgICAgICAgb3JpZ2luYWxFdmVudDogZXZ0XG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKGV2dC5wcmV2ZW50RGVmYXVsdCAhPT0gdm9pZCAwKSB7XG4gICAgICBldnQuY2FuY2VsYWJsZSAmJiBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG4gICAgdGFyZ2V0ID0gY2xvc2VzdCh0YXJnZXQsIG9wdGlvbnMuZHJhZ2dhYmxlLCBlbCwgdHJ1ZSk7XG4gICAgZHJhZ092ZXJFdmVudCgnZHJhZ092ZXInKTtcbiAgICBpZiAoU29ydGFibGUuZXZlbnRDYW5jZWxlZCkgcmV0dXJuIGNvbXBsZXRlZEZpcmVkO1xuICAgIGlmIChkcmFnRWwuY29udGFpbnMoZXZ0LnRhcmdldCkgfHwgdGFyZ2V0LmFuaW1hdGVkICYmIHRhcmdldC5hbmltYXRpbmdYICYmIHRhcmdldC5hbmltYXRpbmdZIHx8IF90aGlzLl9pZ25vcmVXaGlsZUFuaW1hdGluZyA9PT0gdGFyZ2V0KSB7XG4gICAgICByZXR1cm4gY29tcGxldGVkKGZhbHNlKTtcbiAgICB9XG4gICAgaWdub3JlTmV4dENsaWNrID0gZmFsc2U7XG4gICAgaWYgKGFjdGl2ZVNvcnRhYmxlICYmICFvcHRpb25zLmRpc2FibGVkICYmIChpc093bmVyID8gY2FuU29ydCB8fCAocmV2ZXJ0ID0gcGFyZW50RWwgIT09IHJvb3RFbCkgLy8gUmV2ZXJ0aW5nIGl0ZW0gaW50byB0aGUgb3JpZ2luYWwgbGlzdFxuICAgIDogcHV0U29ydGFibGUgPT09IHRoaXMgfHwgKHRoaXMubGFzdFB1dE1vZGUgPSBhY3RpdmVHcm91cC5jaGVja1B1bGwodGhpcywgYWN0aXZlU29ydGFibGUsIGRyYWdFbCwgZXZ0KSkgJiYgZ3JvdXAuY2hlY2tQdXQodGhpcywgYWN0aXZlU29ydGFibGUsIGRyYWdFbCwgZXZ0KSkpIHtcbiAgICAgIHZlcnRpY2FsID0gdGhpcy5fZ2V0RGlyZWN0aW9uKGV2dCwgdGFyZ2V0KSA9PT0gJ3ZlcnRpY2FsJztcbiAgICAgIGRyYWdSZWN0ID0gZ2V0UmVjdChkcmFnRWwpO1xuICAgICAgZHJhZ092ZXJFdmVudCgnZHJhZ092ZXJWYWxpZCcpO1xuICAgICAgaWYgKFNvcnRhYmxlLmV2ZW50Q2FuY2VsZWQpIHJldHVybiBjb21wbGV0ZWRGaXJlZDtcbiAgICAgIGlmIChyZXZlcnQpIHtcbiAgICAgICAgcGFyZW50RWwgPSByb290RWw7IC8vIGFjdHVhbGl6YXRpb25cbiAgICAgICAgY2FwdHVyZSgpO1xuICAgICAgICB0aGlzLl9oaWRlQ2xvbmUoKTtcbiAgICAgICAgZHJhZ092ZXJFdmVudCgncmV2ZXJ0Jyk7XG4gICAgICAgIGlmICghU29ydGFibGUuZXZlbnRDYW5jZWxlZCkge1xuICAgICAgICAgIGlmIChuZXh0RWwpIHtcbiAgICAgICAgICAgIHJvb3RFbC5pbnNlcnRCZWZvcmUoZHJhZ0VsLCBuZXh0RWwpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByb290RWwuYXBwZW5kQ2hpbGQoZHJhZ0VsKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvbXBsZXRlZCh0cnVlKTtcbiAgICAgIH1cbiAgICAgIHZhciBlbExhc3RDaGlsZCA9IGxhc3RDaGlsZChlbCwgb3B0aW9ucy5kcmFnZ2FibGUpO1xuICAgICAgaWYgKCFlbExhc3RDaGlsZCB8fCBfZ2hvc3RJc0xhc3QoZXZ0LCB2ZXJ0aWNhbCwgdGhpcykgJiYgIWVsTGFzdENoaWxkLmFuaW1hdGVkKSB7XG4gICAgICAgIC8vIEluc2VydCB0byBlbmQgb2YgbGlzdFxuXG4gICAgICAgIC8vIElmIGFscmVhZHkgYXQgZW5kIG9mIGxpc3Q6IERvIG5vdCBpbnNlcnRcbiAgICAgICAgaWYgKGVsTGFzdENoaWxkID09PSBkcmFnRWwpIHtcbiAgICAgICAgICByZXR1cm4gY29tcGxldGVkKGZhbHNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIHRoZXJlIGlzIGEgbGFzdCBlbGVtZW50LCBpdCBpcyB0aGUgdGFyZ2V0XG4gICAgICAgIGlmIChlbExhc3RDaGlsZCAmJiBlbCA9PT0gZXZ0LnRhcmdldCkge1xuICAgICAgICAgIHRhcmdldCA9IGVsTGFzdENoaWxkO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0YXJnZXQpIHtcbiAgICAgICAgICB0YXJnZXRSZWN0ID0gZ2V0UmVjdCh0YXJnZXQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChfb25Nb3ZlKHJvb3RFbCwgZWwsIGRyYWdFbCwgZHJhZ1JlY3QsIHRhcmdldCwgdGFyZ2V0UmVjdCwgZXZ0LCAhIXRhcmdldCkgIT09IGZhbHNlKSB7XG4gICAgICAgICAgY2FwdHVyZSgpO1xuICAgICAgICAgIGlmIChlbExhc3RDaGlsZCAmJiBlbExhc3RDaGlsZC5uZXh0U2libGluZykge1xuICAgICAgICAgICAgLy8gdGhlIGxhc3QgZHJhZ2dhYmxlIGVsZW1lbnQgaXMgbm90IHRoZSBsYXN0IG5vZGVcbiAgICAgICAgICAgIGVsLmluc2VydEJlZm9yZShkcmFnRWwsIGVsTGFzdENoaWxkLm5leHRTaWJsaW5nKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWwuYXBwZW5kQ2hpbGQoZHJhZ0VsKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcGFyZW50RWwgPSBlbDsgLy8gYWN0dWFsaXphdGlvblxuXG4gICAgICAgICAgY2hhbmdlZCgpO1xuICAgICAgICAgIHJldHVybiBjb21wbGV0ZWQodHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoZWxMYXN0Q2hpbGQgJiYgX2dob3N0SXNGaXJzdChldnQsIHZlcnRpY2FsLCB0aGlzKSkge1xuICAgICAgICAvLyBJbnNlcnQgdG8gc3RhcnQgb2YgbGlzdFxuICAgICAgICB2YXIgZmlyc3RDaGlsZCA9IGdldENoaWxkKGVsLCAwLCBvcHRpb25zLCB0cnVlKTtcbiAgICAgICAgaWYgKGZpcnN0Q2hpbGQgPT09IGRyYWdFbCkge1xuICAgICAgICAgIHJldHVybiBjb21wbGV0ZWQoZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIHRhcmdldCA9IGZpcnN0Q2hpbGQ7XG4gICAgICAgIHRhcmdldFJlY3QgPSBnZXRSZWN0KHRhcmdldCk7XG4gICAgICAgIGlmIChfb25Nb3ZlKHJvb3RFbCwgZWwsIGRyYWdFbCwgZHJhZ1JlY3QsIHRhcmdldCwgdGFyZ2V0UmVjdCwgZXZ0LCBmYWxzZSkgIT09IGZhbHNlKSB7XG4gICAgICAgICAgY2FwdHVyZSgpO1xuICAgICAgICAgIGVsLmluc2VydEJlZm9yZShkcmFnRWwsIGZpcnN0Q2hpbGQpO1xuICAgICAgICAgIHBhcmVudEVsID0gZWw7IC8vIGFjdHVhbGl6YXRpb25cblxuICAgICAgICAgIGNoYW5nZWQoKTtcbiAgICAgICAgICByZXR1cm4gY29tcGxldGVkKHRydWUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHRhcmdldC5wYXJlbnROb2RlID09PSBlbCkge1xuICAgICAgICB0YXJnZXRSZWN0ID0gZ2V0UmVjdCh0YXJnZXQpO1xuICAgICAgICB2YXIgZGlyZWN0aW9uID0gMCxcbiAgICAgICAgICB0YXJnZXRCZWZvcmVGaXJzdFN3YXAsXG4gICAgICAgICAgZGlmZmVyZW50TGV2ZWwgPSBkcmFnRWwucGFyZW50Tm9kZSAhPT0gZWwsXG4gICAgICAgICAgZGlmZmVyZW50Um93Q29sID0gIV9kcmFnRWxJblJvd0NvbHVtbihkcmFnRWwuYW5pbWF0ZWQgJiYgZHJhZ0VsLnRvUmVjdCB8fCBkcmFnUmVjdCwgdGFyZ2V0LmFuaW1hdGVkICYmIHRhcmdldC50b1JlY3QgfHwgdGFyZ2V0UmVjdCwgdmVydGljYWwpLFxuICAgICAgICAgIHNpZGUxID0gdmVydGljYWwgPyAndG9wJyA6ICdsZWZ0JyxcbiAgICAgICAgICBzY3JvbGxlZFBhc3RUb3AgPSBpc1Njcm9sbGVkUGFzdCh0YXJnZXQsICd0b3AnLCAndG9wJykgfHwgaXNTY3JvbGxlZFBhc3QoZHJhZ0VsLCAndG9wJywgJ3RvcCcpLFxuICAgICAgICAgIHNjcm9sbEJlZm9yZSA9IHNjcm9sbGVkUGFzdFRvcCA/IHNjcm9sbGVkUGFzdFRvcC5zY3JvbGxUb3AgOiB2b2lkIDA7XG4gICAgICAgIGlmIChsYXN0VGFyZ2V0ICE9PSB0YXJnZXQpIHtcbiAgICAgICAgICB0YXJnZXRCZWZvcmVGaXJzdFN3YXAgPSB0YXJnZXRSZWN0W3NpZGUxXTtcbiAgICAgICAgICBwYXN0Rmlyc3RJbnZlcnRUaHJlc2ggPSBmYWxzZTtcbiAgICAgICAgICBpc0NpcmN1bXN0YW50aWFsSW52ZXJ0ID0gIWRpZmZlcmVudFJvd0NvbCAmJiBvcHRpb25zLmludmVydFN3YXAgfHwgZGlmZmVyZW50TGV2ZWw7XG4gICAgICAgIH1cbiAgICAgICAgZGlyZWN0aW9uID0gX2dldFN3YXBEaXJlY3Rpb24oZXZ0LCB0YXJnZXQsIHRhcmdldFJlY3QsIHZlcnRpY2FsLCBkaWZmZXJlbnRSb3dDb2wgPyAxIDogb3B0aW9ucy5zd2FwVGhyZXNob2xkLCBvcHRpb25zLmludmVydGVkU3dhcFRocmVzaG9sZCA9PSBudWxsID8gb3B0aW9ucy5zd2FwVGhyZXNob2xkIDogb3B0aW9ucy5pbnZlcnRlZFN3YXBUaHJlc2hvbGQsIGlzQ2lyY3Vtc3RhbnRpYWxJbnZlcnQsIGxhc3RUYXJnZXQgPT09IHRhcmdldCk7XG4gICAgICAgIHZhciBzaWJsaW5nO1xuICAgICAgICBpZiAoZGlyZWN0aW9uICE9PSAwKSB7XG4gICAgICAgICAgLy8gQ2hlY2sgaWYgdGFyZ2V0IGlzIGJlc2lkZSBkcmFnRWwgaW4gcmVzcGVjdGl2ZSBkaXJlY3Rpb24gKGlnbm9yaW5nIGhpZGRlbiBlbGVtZW50cylcbiAgICAgICAgICB2YXIgZHJhZ0luZGV4ID0gaW5kZXgoZHJhZ0VsKTtcbiAgICAgICAgICBkbyB7XG4gICAgICAgICAgICBkcmFnSW5kZXggLT0gZGlyZWN0aW9uO1xuICAgICAgICAgICAgc2libGluZyA9IHBhcmVudEVsLmNoaWxkcmVuW2RyYWdJbmRleF07XG4gICAgICAgICAgfSB3aGlsZSAoc2libGluZyAmJiAoY3NzKHNpYmxpbmcsICdkaXNwbGF5JykgPT09ICdub25lJyB8fCBzaWJsaW5nID09PSBnaG9zdEVsKSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gSWYgZHJhZ0VsIGlzIGFscmVhZHkgYmVzaWRlIHRhcmdldDogRG8gbm90IGluc2VydFxuICAgICAgICBpZiAoZGlyZWN0aW9uID09PSAwIHx8IHNpYmxpbmcgPT09IHRhcmdldCkge1xuICAgICAgICAgIHJldHVybiBjb21wbGV0ZWQoZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIGxhc3RUYXJnZXQgPSB0YXJnZXQ7XG4gICAgICAgIGxhc3REaXJlY3Rpb24gPSBkaXJlY3Rpb247XG4gICAgICAgIHZhciBuZXh0U2libGluZyA9IHRhcmdldC5uZXh0RWxlbWVudFNpYmxpbmcsXG4gICAgICAgICAgYWZ0ZXIgPSBmYWxzZTtcbiAgICAgICAgYWZ0ZXIgPSBkaXJlY3Rpb24gPT09IDE7XG4gICAgICAgIHZhciBtb3ZlVmVjdG9yID0gX29uTW92ZShyb290RWwsIGVsLCBkcmFnRWwsIGRyYWdSZWN0LCB0YXJnZXQsIHRhcmdldFJlY3QsIGV2dCwgYWZ0ZXIpO1xuICAgICAgICBpZiAobW92ZVZlY3RvciAhPT0gZmFsc2UpIHtcbiAgICAgICAgICBpZiAobW92ZVZlY3RvciA9PT0gMSB8fCBtb3ZlVmVjdG9yID09PSAtMSkge1xuICAgICAgICAgICAgYWZ0ZXIgPSBtb3ZlVmVjdG9yID09PSAxO1xuICAgICAgICAgIH1cbiAgICAgICAgICBfc2lsZW50ID0gdHJ1ZTtcbiAgICAgICAgICBzZXRUaW1lb3V0KF91bnNpbGVudCwgMzApO1xuICAgICAgICAgIGNhcHR1cmUoKTtcbiAgICAgICAgICBpZiAoYWZ0ZXIgJiYgIW5leHRTaWJsaW5nKSB7XG4gICAgICAgICAgICBlbC5hcHBlbmRDaGlsZChkcmFnRWwpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0YXJnZXQucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoZHJhZ0VsLCBhZnRlciA/IG5leHRTaWJsaW5nIDogdGFyZ2V0KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBVbmRvIGNocm9tZSdzIHNjcm9sbCBhZGp1c3RtZW50IChoYXMgbm8gZWZmZWN0IG9uIG90aGVyIGJyb3dzZXJzKVxuICAgICAgICAgIGlmIChzY3JvbGxlZFBhc3RUb3ApIHtcbiAgICAgICAgICAgIHNjcm9sbEJ5KHNjcm9sbGVkUGFzdFRvcCwgMCwgc2Nyb2xsQmVmb3JlIC0gc2Nyb2xsZWRQYXN0VG9wLnNjcm9sbFRvcCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHBhcmVudEVsID0gZHJhZ0VsLnBhcmVudE5vZGU7IC8vIGFjdHVhbGl6YXRpb25cblxuICAgICAgICAgIC8vIG11c3QgYmUgZG9uZSBiZWZvcmUgYW5pbWF0aW9uXG4gICAgICAgICAgaWYgKHRhcmdldEJlZm9yZUZpcnN0U3dhcCAhPT0gdW5kZWZpbmVkICYmICFpc0NpcmN1bXN0YW50aWFsSW52ZXJ0KSB7XG4gICAgICAgICAgICB0YXJnZXRNb3ZlRGlzdGFuY2UgPSBNYXRoLmFicyh0YXJnZXRCZWZvcmVGaXJzdFN3YXAgLSBnZXRSZWN0KHRhcmdldClbc2lkZTFdKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY2hhbmdlZCgpO1xuICAgICAgICAgIHJldHVybiBjb21wbGV0ZWQodHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChlbC5jb250YWlucyhkcmFnRWwpKSB7XG4gICAgICAgIHJldHVybiBjb21wbGV0ZWQoZmFsc2UpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0sXG4gIF9pZ25vcmVXaGlsZUFuaW1hdGluZzogbnVsbCxcbiAgX29mZk1vdmVFdmVudHM6IGZ1bmN0aW9uIF9vZmZNb3ZlRXZlbnRzKCkge1xuICAgIG9mZihkb2N1bWVudCwgJ21vdXNlbW92ZScsIHRoaXMuX29uVG91Y2hNb3ZlKTtcbiAgICBvZmYoZG9jdW1lbnQsICd0b3VjaG1vdmUnLCB0aGlzLl9vblRvdWNoTW92ZSk7XG4gICAgb2ZmKGRvY3VtZW50LCAncG9pbnRlcm1vdmUnLCB0aGlzLl9vblRvdWNoTW92ZSk7XG4gICAgb2ZmKGRvY3VtZW50LCAnZHJhZ292ZXInLCBuZWFyZXN0RW1wdHlJbnNlcnREZXRlY3RFdmVudCk7XG4gICAgb2ZmKGRvY3VtZW50LCAnbW91c2Vtb3ZlJywgbmVhcmVzdEVtcHR5SW5zZXJ0RGV0ZWN0RXZlbnQpO1xuICAgIG9mZihkb2N1bWVudCwgJ3RvdWNobW92ZScsIG5lYXJlc3RFbXB0eUluc2VydERldGVjdEV2ZW50KTtcbiAgfSxcbiAgX29mZlVwRXZlbnRzOiBmdW5jdGlvbiBfb2ZmVXBFdmVudHMoKSB7XG4gICAgdmFyIG93bmVyRG9jdW1lbnQgPSB0aGlzLmVsLm93bmVyRG9jdW1lbnQ7XG4gICAgb2ZmKG93bmVyRG9jdW1lbnQsICdtb3VzZXVwJywgdGhpcy5fb25Ecm9wKTtcbiAgICBvZmYob3duZXJEb2N1bWVudCwgJ3RvdWNoZW5kJywgdGhpcy5fb25Ecm9wKTtcbiAgICBvZmYob3duZXJEb2N1bWVudCwgJ3BvaW50ZXJ1cCcsIHRoaXMuX29uRHJvcCk7XG4gICAgb2ZmKG93bmVyRG9jdW1lbnQsICdwb2ludGVyY2FuY2VsJywgdGhpcy5fb25Ecm9wKTtcbiAgICBvZmYob3duZXJEb2N1bWVudCwgJ3RvdWNoY2FuY2VsJywgdGhpcy5fb25Ecm9wKTtcbiAgICBvZmYoZG9jdW1lbnQsICdzZWxlY3RzdGFydCcsIHRoaXMpO1xuICB9LFxuICBfb25Ecm9wOiBmdW5jdGlvbiBfb25Ecm9wKCAvKipFdmVudCovZXZ0KSB7XG4gICAgdmFyIGVsID0gdGhpcy5lbCxcbiAgICAgIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG5cbiAgICAvLyBHZXQgdGhlIGluZGV4IG9mIHRoZSBkcmFnZ2VkIGVsZW1lbnQgd2l0aGluIGl0cyBwYXJlbnRcbiAgICBuZXdJbmRleCA9IGluZGV4KGRyYWdFbCk7XG4gICAgbmV3RHJhZ2dhYmxlSW5kZXggPSBpbmRleChkcmFnRWwsIG9wdGlvbnMuZHJhZ2dhYmxlKTtcbiAgICBwbHVnaW5FdmVudCgnZHJvcCcsIHRoaXMsIHtcbiAgICAgIGV2dDogZXZ0XG4gICAgfSk7XG4gICAgcGFyZW50RWwgPSBkcmFnRWwgJiYgZHJhZ0VsLnBhcmVudE5vZGU7XG5cbiAgICAvLyBHZXQgYWdhaW4gYWZ0ZXIgcGx1Z2luIGV2ZW50XG4gICAgbmV3SW5kZXggPSBpbmRleChkcmFnRWwpO1xuICAgIG5ld0RyYWdnYWJsZUluZGV4ID0gaW5kZXgoZHJhZ0VsLCBvcHRpb25zLmRyYWdnYWJsZSk7XG4gICAgaWYgKFNvcnRhYmxlLmV2ZW50Q2FuY2VsZWQpIHtcbiAgICAgIHRoaXMuX251bGxpbmcoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgYXdhaXRpbmdEcmFnU3RhcnRlZCA9IGZhbHNlO1xuICAgIGlzQ2lyY3Vtc3RhbnRpYWxJbnZlcnQgPSBmYWxzZTtcbiAgICBwYXN0Rmlyc3RJbnZlcnRUaHJlc2ggPSBmYWxzZTtcbiAgICBjbGVhckludGVydmFsKHRoaXMuX2xvb3BJZCk7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuX2RyYWdTdGFydFRpbWVyKTtcbiAgICBfY2FuY2VsTmV4dFRpY2sodGhpcy5jbG9uZUlkKTtcbiAgICBfY2FuY2VsTmV4dFRpY2sodGhpcy5fZHJhZ1N0YXJ0SWQpO1xuXG4gICAgLy8gVW5iaW5kIGV2ZW50c1xuICAgIGlmICh0aGlzLm5hdGl2ZURyYWdnYWJsZSkge1xuICAgICAgb2ZmKGRvY3VtZW50LCAnZHJvcCcsIHRoaXMpO1xuICAgICAgb2ZmKGVsLCAnZHJhZ3N0YXJ0JywgdGhpcy5fb25EcmFnU3RhcnQpO1xuICAgIH1cbiAgICB0aGlzLl9vZmZNb3ZlRXZlbnRzKCk7XG4gICAgdGhpcy5fb2ZmVXBFdmVudHMoKTtcbiAgICBpZiAoU2FmYXJpKSB7XG4gICAgICBjc3MoZG9jdW1lbnQuYm9keSwgJ3VzZXItc2VsZWN0JywgJycpO1xuICAgIH1cbiAgICBjc3MoZHJhZ0VsLCAndHJhbnNmb3JtJywgJycpO1xuICAgIGlmIChldnQpIHtcbiAgICAgIGlmIChtb3ZlZCkge1xuICAgICAgICBldnQuY2FuY2VsYWJsZSAmJiBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgIW9wdGlvbnMuZHJvcEJ1YmJsZSAmJiBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICB9XG4gICAgICBnaG9zdEVsICYmIGdob3N0RWwucGFyZW50Tm9kZSAmJiBnaG9zdEVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZ2hvc3RFbCk7XG4gICAgICBpZiAocm9vdEVsID09PSBwYXJlbnRFbCB8fCBwdXRTb3J0YWJsZSAmJiBwdXRTb3J0YWJsZS5sYXN0UHV0TW9kZSAhPT0gJ2Nsb25lJykge1xuICAgICAgICAvLyBSZW1vdmUgY2xvbmUocylcbiAgICAgICAgY2xvbmVFbCAmJiBjbG9uZUVsLnBhcmVudE5vZGUgJiYgY2xvbmVFbC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGNsb25lRWwpO1xuICAgICAgfVxuICAgICAgaWYgKGRyYWdFbCkge1xuICAgICAgICBpZiAodGhpcy5uYXRpdmVEcmFnZ2FibGUpIHtcbiAgICAgICAgICBvZmYoZHJhZ0VsLCAnZHJhZ2VuZCcsIHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIF9kaXNhYmxlRHJhZ2dhYmxlKGRyYWdFbCk7XG4gICAgICAgIGRyYWdFbC5zdHlsZVsnd2lsbC1jaGFuZ2UnXSA9ICcnO1xuXG4gICAgICAgIC8vIFJlbW92ZSBjbGFzc2VzXG4gICAgICAgIC8vIGdob3N0Q2xhc3MgaXMgYWRkZWQgaW4gZHJhZ1N0YXJ0ZWRcbiAgICAgICAgaWYgKG1vdmVkICYmICFhd2FpdGluZ0RyYWdTdGFydGVkKSB7XG4gICAgICAgICAgdG9nZ2xlQ2xhc3MoZHJhZ0VsLCBwdXRTb3J0YWJsZSA/IHB1dFNvcnRhYmxlLm9wdGlvbnMuZ2hvc3RDbGFzcyA6IHRoaXMub3B0aW9ucy5naG9zdENsYXNzLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgdG9nZ2xlQ2xhc3MoZHJhZ0VsLCB0aGlzLm9wdGlvbnMuY2hvc2VuQ2xhc3MsIGZhbHNlKTtcblxuICAgICAgICAvLyBEcmFnIHN0b3AgZXZlbnRcbiAgICAgICAgX2Rpc3BhdGNoRXZlbnQoe1xuICAgICAgICAgIHNvcnRhYmxlOiB0aGlzLFxuICAgICAgICAgIG5hbWU6ICd1bmNob29zZScsXG4gICAgICAgICAgdG9FbDogcGFyZW50RWwsXG4gICAgICAgICAgbmV3SW5kZXg6IG51bGwsXG4gICAgICAgICAgbmV3RHJhZ2dhYmxlSW5kZXg6IG51bGwsXG4gICAgICAgICAgb3JpZ2luYWxFdmVudDogZXZ0XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAocm9vdEVsICE9PSBwYXJlbnRFbCkge1xuICAgICAgICAgIGlmIChuZXdJbmRleCA+PSAwKSB7XG4gICAgICAgICAgICAvLyBBZGQgZXZlbnRcbiAgICAgICAgICAgIF9kaXNwYXRjaEV2ZW50KHtcbiAgICAgICAgICAgICAgcm9vdEVsOiBwYXJlbnRFbCxcbiAgICAgICAgICAgICAgbmFtZTogJ2FkZCcsXG4gICAgICAgICAgICAgIHRvRWw6IHBhcmVudEVsLFxuICAgICAgICAgICAgICBmcm9tRWw6IHJvb3RFbCxcbiAgICAgICAgICAgICAgb3JpZ2luYWxFdmVudDogZXZ0XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gUmVtb3ZlIGV2ZW50XG4gICAgICAgICAgICBfZGlzcGF0Y2hFdmVudCh7XG4gICAgICAgICAgICAgIHNvcnRhYmxlOiB0aGlzLFxuICAgICAgICAgICAgICBuYW1lOiAncmVtb3ZlJyxcbiAgICAgICAgICAgICAgdG9FbDogcGFyZW50RWwsXG4gICAgICAgICAgICAgIG9yaWdpbmFsRXZlbnQ6IGV2dFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIGRyYWcgZnJvbSBvbmUgbGlzdCBhbmQgZHJvcCBpbnRvIGFub3RoZXJcbiAgICAgICAgICAgIF9kaXNwYXRjaEV2ZW50KHtcbiAgICAgICAgICAgICAgcm9vdEVsOiBwYXJlbnRFbCxcbiAgICAgICAgICAgICAgbmFtZTogJ3NvcnQnLFxuICAgICAgICAgICAgICB0b0VsOiBwYXJlbnRFbCxcbiAgICAgICAgICAgICAgZnJvbUVsOiByb290RWwsXG4gICAgICAgICAgICAgIG9yaWdpbmFsRXZlbnQ6IGV2dFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBfZGlzcGF0Y2hFdmVudCh7XG4gICAgICAgICAgICAgIHNvcnRhYmxlOiB0aGlzLFxuICAgICAgICAgICAgICBuYW1lOiAnc29ydCcsXG4gICAgICAgICAgICAgIHRvRWw6IHBhcmVudEVsLFxuICAgICAgICAgICAgICBvcmlnaW5hbEV2ZW50OiBldnRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBwdXRTb3J0YWJsZSAmJiBwdXRTb3J0YWJsZS5zYXZlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKG5ld0luZGV4ICE9PSBvbGRJbmRleCkge1xuICAgICAgICAgICAgaWYgKG5ld0luZGV4ID49IDApIHtcbiAgICAgICAgICAgICAgLy8gZHJhZyAmIGRyb3Agd2l0aGluIHRoZSBzYW1lIGxpc3RcbiAgICAgICAgICAgICAgX2Rpc3BhdGNoRXZlbnQoe1xuICAgICAgICAgICAgICAgIHNvcnRhYmxlOiB0aGlzLFxuICAgICAgICAgICAgICAgIG5hbWU6ICd1cGRhdGUnLFxuICAgICAgICAgICAgICAgIHRvRWw6IHBhcmVudEVsLFxuICAgICAgICAgICAgICAgIG9yaWdpbmFsRXZlbnQ6IGV2dFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgX2Rpc3BhdGNoRXZlbnQoe1xuICAgICAgICAgICAgICAgIHNvcnRhYmxlOiB0aGlzLFxuICAgICAgICAgICAgICAgIG5hbWU6ICdzb3J0JyxcbiAgICAgICAgICAgICAgICB0b0VsOiBwYXJlbnRFbCxcbiAgICAgICAgICAgICAgICBvcmlnaW5hbEV2ZW50OiBldnRcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChTb3J0YWJsZS5hY3RpdmUpIHtcbiAgICAgICAgICAvKiBqc2hpbnQgZXFudWxsOnRydWUgKi9cbiAgICAgICAgICBpZiAobmV3SW5kZXggPT0gbnVsbCB8fCBuZXdJbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgIG5ld0luZGV4ID0gb2xkSW5kZXg7XG4gICAgICAgICAgICBuZXdEcmFnZ2FibGVJbmRleCA9IG9sZERyYWdnYWJsZUluZGV4O1xuICAgICAgICAgIH1cbiAgICAgICAgICBfZGlzcGF0Y2hFdmVudCh7XG4gICAgICAgICAgICBzb3J0YWJsZTogdGhpcyxcbiAgICAgICAgICAgIG5hbWU6ICdlbmQnLFxuICAgICAgICAgICAgdG9FbDogcGFyZW50RWwsXG4gICAgICAgICAgICBvcmlnaW5hbEV2ZW50OiBldnRcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIC8vIFNhdmUgc29ydGluZ1xuICAgICAgICAgIHRoaXMuc2F2ZSgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuX251bGxpbmcoKTtcbiAgfSxcbiAgX251bGxpbmc6IGZ1bmN0aW9uIF9udWxsaW5nKCkge1xuICAgIHBsdWdpbkV2ZW50KCdudWxsaW5nJywgdGhpcyk7XG4gICAgcm9vdEVsID0gZHJhZ0VsID0gcGFyZW50RWwgPSBnaG9zdEVsID0gbmV4dEVsID0gY2xvbmVFbCA9IGxhc3REb3duRWwgPSBjbG9uZUhpZGRlbiA9IHRhcEV2dCA9IHRvdWNoRXZ0ID0gbW92ZWQgPSBuZXdJbmRleCA9IG5ld0RyYWdnYWJsZUluZGV4ID0gb2xkSW5kZXggPSBvbGREcmFnZ2FibGVJbmRleCA9IGxhc3RUYXJnZXQgPSBsYXN0RGlyZWN0aW9uID0gcHV0U29ydGFibGUgPSBhY3RpdmVHcm91cCA9IFNvcnRhYmxlLmRyYWdnZWQgPSBTb3J0YWJsZS5naG9zdCA9IFNvcnRhYmxlLmNsb25lID0gU29ydGFibGUuYWN0aXZlID0gbnVsbDtcbiAgICBzYXZlZElucHV0Q2hlY2tlZC5mb3JFYWNoKGZ1bmN0aW9uIChlbCkge1xuICAgICAgZWwuY2hlY2tlZCA9IHRydWU7XG4gICAgfSk7XG4gICAgc2F2ZWRJbnB1dENoZWNrZWQubGVuZ3RoID0gbGFzdER4ID0gbGFzdER5ID0gMDtcbiAgfSxcbiAgaGFuZGxlRXZlbnQ6IGZ1bmN0aW9uIGhhbmRsZUV2ZW50KCAvKipFdmVudCovZXZ0KSB7XG4gICAgc3dpdGNoIChldnQudHlwZSkge1xuICAgICAgY2FzZSAnZHJvcCc6XG4gICAgICBjYXNlICdkcmFnZW5kJzpcbiAgICAgICAgdGhpcy5fb25Ecm9wKGV2dCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnZHJhZ2VudGVyJzpcbiAgICAgIGNhc2UgJ2RyYWdvdmVyJzpcbiAgICAgICAgaWYgKGRyYWdFbCkge1xuICAgICAgICAgIHRoaXMuX29uRHJhZ092ZXIoZXZ0KTtcbiAgICAgICAgICBfZ2xvYmFsRHJhZ092ZXIoZXZ0KTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3NlbGVjdHN0YXJ0JzpcbiAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfSxcbiAgLyoqXHJcbiAgICogU2VyaWFsaXplcyB0aGUgaXRlbSBpbnRvIGFuIGFycmF5IG9mIHN0cmluZy5cclxuICAgKiBAcmV0dXJucyB7U3RyaW5nW119XHJcbiAgICovXG4gIHRvQXJyYXk6IGZ1bmN0aW9uIHRvQXJyYXkoKSB7XG4gICAgdmFyIG9yZGVyID0gW10sXG4gICAgICBlbCxcbiAgICAgIGNoaWxkcmVuID0gdGhpcy5lbC5jaGlsZHJlbixcbiAgICAgIGkgPSAwLFxuICAgICAgbiA9IGNoaWxkcmVuLmxlbmd0aCxcbiAgICAgIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG4gICAgZm9yICg7IGkgPCBuOyBpKyspIHtcbiAgICAgIGVsID0gY2hpbGRyZW5baV07XG4gICAgICBpZiAoY2xvc2VzdChlbCwgb3B0aW9ucy5kcmFnZ2FibGUsIHRoaXMuZWwsIGZhbHNlKSkge1xuICAgICAgICBvcmRlci5wdXNoKGVsLmdldEF0dHJpYnV0ZShvcHRpb25zLmRhdGFJZEF0dHIpIHx8IF9nZW5lcmF0ZUlkKGVsKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvcmRlcjtcbiAgfSxcbiAgLyoqXHJcbiAgICogU29ydHMgdGhlIGVsZW1lbnRzIGFjY29yZGluZyB0byB0aGUgYXJyYXkuXHJcbiAgICogQHBhcmFtICB7U3RyaW5nW119ICBvcmRlciAgb3JkZXIgb2YgdGhlIGl0ZW1zXHJcbiAgICovXG4gIHNvcnQ6IGZ1bmN0aW9uIHNvcnQob3JkZXIsIHVzZUFuaW1hdGlvbikge1xuICAgIHZhciBpdGVtcyA9IHt9LFxuICAgICAgcm9vdEVsID0gdGhpcy5lbDtcbiAgICB0aGlzLnRvQXJyYXkoKS5mb3JFYWNoKGZ1bmN0aW9uIChpZCwgaSkge1xuICAgICAgdmFyIGVsID0gcm9vdEVsLmNoaWxkcmVuW2ldO1xuICAgICAgaWYgKGNsb3Nlc3QoZWwsIHRoaXMub3B0aW9ucy5kcmFnZ2FibGUsIHJvb3RFbCwgZmFsc2UpKSB7XG4gICAgICAgIGl0ZW1zW2lkXSA9IGVsO1xuICAgICAgfVxuICAgIH0sIHRoaXMpO1xuICAgIHVzZUFuaW1hdGlvbiAmJiB0aGlzLmNhcHR1cmVBbmltYXRpb25TdGF0ZSgpO1xuICAgIG9yZGVyLmZvckVhY2goZnVuY3Rpb24gKGlkKSB7XG4gICAgICBpZiAoaXRlbXNbaWRdKSB7XG4gICAgICAgIHJvb3RFbC5yZW1vdmVDaGlsZChpdGVtc1tpZF0pO1xuICAgICAgICByb290RWwuYXBwZW5kQ2hpbGQoaXRlbXNbaWRdKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB1c2VBbmltYXRpb24gJiYgdGhpcy5hbmltYXRlQWxsKCk7XG4gIH0sXG4gIC8qKlxyXG4gICAqIFNhdmUgdGhlIGN1cnJlbnQgc29ydGluZ1xyXG4gICAqL1xuICBzYXZlOiBmdW5jdGlvbiBzYXZlKCkge1xuICAgIHZhciBzdG9yZSA9IHRoaXMub3B0aW9ucy5zdG9yZTtcbiAgICBzdG9yZSAmJiBzdG9yZS5zZXQgJiYgc3RvcmUuc2V0KHRoaXMpO1xuICB9LFxuICAvKipcclxuICAgKiBGb3IgZWFjaCBlbGVtZW50IGluIHRoZSBzZXQsIGdldCB0aGUgZmlyc3QgZWxlbWVudCB0aGF0IG1hdGNoZXMgdGhlIHNlbGVjdG9yIGJ5IHRlc3RpbmcgdGhlIGVsZW1lbnQgaXRzZWxmIGFuZCB0cmF2ZXJzaW5nIHVwIHRocm91Z2ggaXRzIGFuY2VzdG9ycyBpbiB0aGUgRE9NIHRyZWUuXHJcbiAgICogQHBhcmFtICAge0hUTUxFbGVtZW50fSAgZWxcclxuICAgKiBAcGFyYW0gICB7U3RyaW5nfSAgICAgICBbc2VsZWN0b3JdICBkZWZhdWx0OiBgb3B0aW9ucy5kcmFnZ2FibGVgXHJcbiAgICogQHJldHVybnMge0hUTUxFbGVtZW50fG51bGx9XHJcbiAgICovXG4gIGNsb3Nlc3Q6IGZ1bmN0aW9uIGNsb3Nlc3QkMShlbCwgc2VsZWN0b3IpIHtcbiAgICByZXR1cm4gY2xvc2VzdChlbCwgc2VsZWN0b3IgfHwgdGhpcy5vcHRpb25zLmRyYWdnYWJsZSwgdGhpcy5lbCwgZmFsc2UpO1xuICB9LFxuICAvKipcclxuICAgKiBTZXQvZ2V0IG9wdGlvblxyXG4gICAqIEBwYXJhbSAgIHtzdHJpbmd9IG5hbWVcclxuICAgKiBAcGFyYW0gICB7Kn0gICAgICBbdmFsdWVdXHJcbiAgICogQHJldHVybnMgeyp9XHJcbiAgICovXG4gIG9wdGlvbjogZnVuY3Rpb24gb3B0aW9uKG5hbWUsIHZhbHVlKSB7XG4gICAgdmFyIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG4gICAgaWYgKHZhbHVlID09PSB2b2lkIDApIHtcbiAgICAgIHJldHVybiBvcHRpb25zW25hbWVdO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgbW9kaWZpZWRWYWx1ZSA9IFBsdWdpbk1hbmFnZXIubW9kaWZ5T3B0aW9uKHRoaXMsIG5hbWUsIHZhbHVlKTtcbiAgICAgIGlmICh0eXBlb2YgbW9kaWZpZWRWYWx1ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgb3B0aW9uc1tuYW1lXSA9IG1vZGlmaWVkVmFsdWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvcHRpb25zW25hbWVdID0gdmFsdWU7XG4gICAgICB9XG4gICAgICBpZiAobmFtZSA9PT0gJ2dyb3VwJykge1xuICAgICAgICBfcHJlcGFyZUdyb3VwKG9wdGlvbnMpO1xuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgLyoqXHJcbiAgICogRGVzdHJveVxyXG4gICAqL1xuICBkZXN0cm95OiBmdW5jdGlvbiBkZXN0cm95KCkge1xuICAgIHBsdWdpbkV2ZW50KCdkZXN0cm95JywgdGhpcyk7XG4gICAgdmFyIGVsID0gdGhpcy5lbDtcbiAgICBlbFtleHBhbmRvXSA9IG51bGw7XG4gICAgb2ZmKGVsLCAnbW91c2Vkb3duJywgdGhpcy5fb25UYXBTdGFydCk7XG4gICAgb2ZmKGVsLCAndG91Y2hzdGFydCcsIHRoaXMuX29uVGFwU3RhcnQpO1xuICAgIG9mZihlbCwgJ3BvaW50ZXJkb3duJywgdGhpcy5fb25UYXBTdGFydCk7XG4gICAgaWYgKHRoaXMubmF0aXZlRHJhZ2dhYmxlKSB7XG4gICAgICBvZmYoZWwsICdkcmFnb3ZlcicsIHRoaXMpO1xuICAgICAgb2ZmKGVsLCAnZHJhZ2VudGVyJywgdGhpcyk7XG4gICAgfVxuICAgIC8vIFJlbW92ZSBkcmFnZ2FibGUgYXR0cmlidXRlc1xuICAgIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwoZWwucXVlcnlTZWxlY3RvckFsbCgnW2RyYWdnYWJsZV0nKSwgZnVuY3Rpb24gKGVsKSB7XG4gICAgICBlbC5yZW1vdmVBdHRyaWJ1dGUoJ2RyYWdnYWJsZScpO1xuICAgIH0pO1xuICAgIHRoaXMuX29uRHJvcCgpO1xuICAgIHRoaXMuX2Rpc2FibGVEZWxheWVkRHJhZ0V2ZW50cygpO1xuICAgIHNvcnRhYmxlcy5zcGxpY2Uoc29ydGFibGVzLmluZGV4T2YodGhpcy5lbCksIDEpO1xuICAgIHRoaXMuZWwgPSBlbCA9IG51bGw7XG4gIH0sXG4gIF9oaWRlQ2xvbmU6IGZ1bmN0aW9uIF9oaWRlQ2xvbmUoKSB7XG4gICAgaWYgKCFjbG9uZUhpZGRlbikge1xuICAgICAgcGx1Z2luRXZlbnQoJ2hpZGVDbG9uZScsIHRoaXMpO1xuICAgICAgaWYgKFNvcnRhYmxlLmV2ZW50Q2FuY2VsZWQpIHJldHVybjtcbiAgICAgIGNzcyhjbG9uZUVsLCAnZGlzcGxheScsICdub25lJyk7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLnJlbW92ZUNsb25lT25IaWRlICYmIGNsb25lRWwucGFyZW50Tm9kZSkge1xuICAgICAgICBjbG9uZUVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoY2xvbmVFbCk7XG4gICAgICB9XG4gICAgICBjbG9uZUhpZGRlbiA9IHRydWU7XG4gICAgfVxuICB9LFxuICBfc2hvd0Nsb25lOiBmdW5jdGlvbiBfc2hvd0Nsb25lKHB1dFNvcnRhYmxlKSB7XG4gICAgaWYgKHB1dFNvcnRhYmxlLmxhc3RQdXRNb2RlICE9PSAnY2xvbmUnKSB7XG4gICAgICB0aGlzLl9oaWRlQ2xvbmUoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGNsb25lSGlkZGVuKSB7XG4gICAgICBwbHVnaW5FdmVudCgnc2hvd0Nsb25lJywgdGhpcyk7XG4gICAgICBpZiAoU29ydGFibGUuZXZlbnRDYW5jZWxlZCkgcmV0dXJuO1xuXG4gICAgICAvLyBzaG93IGNsb25lIGF0IGRyYWdFbCBvciBvcmlnaW5hbCBwb3NpdGlvblxuICAgICAgaWYgKGRyYWdFbC5wYXJlbnROb2RlID09IHJvb3RFbCAmJiAhdGhpcy5vcHRpb25zLmdyb3VwLnJldmVydENsb25lKSB7XG4gICAgICAgIHJvb3RFbC5pbnNlcnRCZWZvcmUoY2xvbmVFbCwgZHJhZ0VsKTtcbiAgICAgIH0gZWxzZSBpZiAobmV4dEVsKSB7XG4gICAgICAgIHJvb3RFbC5pbnNlcnRCZWZvcmUoY2xvbmVFbCwgbmV4dEVsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJvb3RFbC5hcHBlbmRDaGlsZChjbG9uZUVsKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuZ3JvdXAucmV2ZXJ0Q2xvbmUpIHtcbiAgICAgICAgdGhpcy5hbmltYXRlKGRyYWdFbCwgY2xvbmVFbCk7XG4gICAgICB9XG4gICAgICBjc3MoY2xvbmVFbCwgJ2Rpc3BsYXknLCAnJyk7XG4gICAgICBjbG9uZUhpZGRlbiA9IGZhbHNlO1xuICAgIH1cbiAgfVxufTtcbmZ1bmN0aW9uIF9nbG9iYWxEcmFnT3ZlciggLyoqRXZlbnQqL2V2dCkge1xuICBpZiAoZXZ0LmRhdGFUcmFuc2Zlcikge1xuICAgIGV2dC5kYXRhVHJhbnNmZXIuZHJvcEVmZmVjdCA9ICdtb3ZlJztcbiAgfVxuICBldnQuY2FuY2VsYWJsZSAmJiBldnQucHJldmVudERlZmF1bHQoKTtcbn1cbmZ1bmN0aW9uIF9vbk1vdmUoZnJvbUVsLCB0b0VsLCBkcmFnRWwsIGRyYWdSZWN0LCB0YXJnZXRFbCwgdGFyZ2V0UmVjdCwgb3JpZ2luYWxFdmVudCwgd2lsbEluc2VydEFmdGVyKSB7XG4gIHZhciBldnQsXG4gICAgc29ydGFibGUgPSBmcm9tRWxbZXhwYW5kb10sXG4gICAgb25Nb3ZlRm4gPSBzb3J0YWJsZS5vcHRpb25zLm9uTW92ZSxcbiAgICByZXRWYWw7XG4gIC8vIFN1cHBvcnQgZm9yIG5ldyBDdXN0b21FdmVudCBmZWF0dXJlXG4gIGlmICh3aW5kb3cuQ3VzdG9tRXZlbnQgJiYgIUlFMTFPckxlc3MgJiYgIUVkZ2UpIHtcbiAgICBldnQgPSBuZXcgQ3VzdG9tRXZlbnQoJ21vdmUnLCB7XG4gICAgICBidWJibGVzOiB0cnVlLFxuICAgICAgY2FuY2VsYWJsZTogdHJ1ZVxuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIGV2dCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdFdmVudCcpO1xuICAgIGV2dC5pbml0RXZlbnQoJ21vdmUnLCB0cnVlLCB0cnVlKTtcbiAgfVxuICBldnQudG8gPSB0b0VsO1xuICBldnQuZnJvbSA9IGZyb21FbDtcbiAgZXZ0LmRyYWdnZWQgPSBkcmFnRWw7XG4gIGV2dC5kcmFnZ2VkUmVjdCA9IGRyYWdSZWN0O1xuICBldnQucmVsYXRlZCA9IHRhcmdldEVsIHx8IHRvRWw7XG4gIGV2dC5yZWxhdGVkUmVjdCA9IHRhcmdldFJlY3QgfHwgZ2V0UmVjdCh0b0VsKTtcbiAgZXZ0LndpbGxJbnNlcnRBZnRlciA9IHdpbGxJbnNlcnRBZnRlcjtcbiAgZXZ0Lm9yaWdpbmFsRXZlbnQgPSBvcmlnaW5hbEV2ZW50O1xuICBmcm9tRWwuZGlzcGF0Y2hFdmVudChldnQpO1xuICBpZiAob25Nb3ZlRm4pIHtcbiAgICByZXRWYWwgPSBvbk1vdmVGbi5jYWxsKHNvcnRhYmxlLCBldnQsIG9yaWdpbmFsRXZlbnQpO1xuICB9XG4gIHJldHVybiByZXRWYWw7XG59XG5mdW5jdGlvbiBfZGlzYWJsZURyYWdnYWJsZShlbCkge1xuICBlbC5kcmFnZ2FibGUgPSBmYWxzZTtcbn1cbmZ1bmN0aW9uIF91bnNpbGVudCgpIHtcbiAgX3NpbGVudCA9IGZhbHNlO1xufVxuZnVuY3Rpb24gX2dob3N0SXNGaXJzdChldnQsIHZlcnRpY2FsLCBzb3J0YWJsZSkge1xuICB2YXIgZmlyc3RFbFJlY3QgPSBnZXRSZWN0KGdldENoaWxkKHNvcnRhYmxlLmVsLCAwLCBzb3J0YWJsZS5vcHRpb25zLCB0cnVlKSk7XG4gIHZhciBjaGlsZENvbnRhaW5pbmdSZWN0ID0gZ2V0Q2hpbGRDb250YWluaW5nUmVjdEZyb21FbGVtZW50KHNvcnRhYmxlLmVsLCBzb3J0YWJsZS5vcHRpb25zLCBnaG9zdEVsKTtcbiAgdmFyIHNwYWNlciA9IDEwO1xuICByZXR1cm4gdmVydGljYWwgPyBldnQuY2xpZW50WCA8IGNoaWxkQ29udGFpbmluZ1JlY3QubGVmdCAtIHNwYWNlciB8fCBldnQuY2xpZW50WSA8IGZpcnN0RWxSZWN0LnRvcCAmJiBldnQuY2xpZW50WCA8IGZpcnN0RWxSZWN0LnJpZ2h0IDogZXZ0LmNsaWVudFkgPCBjaGlsZENvbnRhaW5pbmdSZWN0LnRvcCAtIHNwYWNlciB8fCBldnQuY2xpZW50WSA8IGZpcnN0RWxSZWN0LmJvdHRvbSAmJiBldnQuY2xpZW50WCA8IGZpcnN0RWxSZWN0LmxlZnQ7XG59XG5mdW5jdGlvbiBfZ2hvc3RJc0xhc3QoZXZ0LCB2ZXJ0aWNhbCwgc29ydGFibGUpIHtcbiAgdmFyIGxhc3RFbFJlY3QgPSBnZXRSZWN0KGxhc3RDaGlsZChzb3J0YWJsZS5lbCwgc29ydGFibGUub3B0aW9ucy5kcmFnZ2FibGUpKTtcbiAgdmFyIGNoaWxkQ29udGFpbmluZ1JlY3QgPSBnZXRDaGlsZENvbnRhaW5pbmdSZWN0RnJvbUVsZW1lbnQoc29ydGFibGUuZWwsIHNvcnRhYmxlLm9wdGlvbnMsIGdob3N0RWwpO1xuICB2YXIgc3BhY2VyID0gMTA7XG4gIHJldHVybiB2ZXJ0aWNhbCA/IGV2dC5jbGllbnRYID4gY2hpbGRDb250YWluaW5nUmVjdC5yaWdodCArIHNwYWNlciB8fCBldnQuY2xpZW50WSA+IGxhc3RFbFJlY3QuYm90dG9tICYmIGV2dC5jbGllbnRYID4gbGFzdEVsUmVjdC5sZWZ0IDogZXZ0LmNsaWVudFkgPiBjaGlsZENvbnRhaW5pbmdSZWN0LmJvdHRvbSArIHNwYWNlciB8fCBldnQuY2xpZW50WCA+IGxhc3RFbFJlY3QucmlnaHQgJiYgZXZ0LmNsaWVudFkgPiBsYXN0RWxSZWN0LnRvcDtcbn1cbmZ1bmN0aW9uIF9nZXRTd2FwRGlyZWN0aW9uKGV2dCwgdGFyZ2V0LCB0YXJnZXRSZWN0LCB2ZXJ0aWNhbCwgc3dhcFRocmVzaG9sZCwgaW52ZXJ0ZWRTd2FwVGhyZXNob2xkLCBpbnZlcnRTd2FwLCBpc0xhc3RUYXJnZXQpIHtcbiAgdmFyIG1vdXNlT25BeGlzID0gdmVydGljYWwgPyBldnQuY2xpZW50WSA6IGV2dC5jbGllbnRYLFxuICAgIHRhcmdldExlbmd0aCA9IHZlcnRpY2FsID8gdGFyZ2V0UmVjdC5oZWlnaHQgOiB0YXJnZXRSZWN0LndpZHRoLFxuICAgIHRhcmdldFMxID0gdmVydGljYWwgPyB0YXJnZXRSZWN0LnRvcCA6IHRhcmdldFJlY3QubGVmdCxcbiAgICB0YXJnZXRTMiA9IHZlcnRpY2FsID8gdGFyZ2V0UmVjdC5ib3R0b20gOiB0YXJnZXRSZWN0LnJpZ2h0LFxuICAgIGludmVydCA9IGZhbHNlO1xuICBpZiAoIWludmVydFN3YXApIHtcbiAgICAvLyBOZXZlciBpbnZlcnQgb3IgY3JlYXRlIGRyYWdFbCBzaGFkb3cgd2hlbiB0YXJnZXQgbW92ZW1lbmV0IGNhdXNlcyBtb3VzZSB0byBtb3ZlIHBhc3QgdGhlIGVuZCBvZiByZWd1bGFyIHN3YXBUaHJlc2hvbGRcbiAgICBpZiAoaXNMYXN0VGFyZ2V0ICYmIHRhcmdldE1vdmVEaXN0YW5jZSA8IHRhcmdldExlbmd0aCAqIHN3YXBUaHJlc2hvbGQpIHtcbiAgICAgIC8vIG11bHRpcGxpZWQgb25seSBieSBzd2FwVGhyZXNob2xkIGJlY2F1c2UgbW91c2Ugd2lsbCBhbHJlYWR5IGJlIGluc2lkZSB0YXJnZXQgYnkgKDEgLSB0aHJlc2hvbGQpICogdGFyZ2V0TGVuZ3RoIC8gMlxuICAgICAgLy8gY2hlY2sgaWYgcGFzdCBmaXJzdCBpbnZlcnQgdGhyZXNob2xkIG9uIHNpZGUgb3Bwb3NpdGUgb2YgbGFzdERpcmVjdGlvblxuICAgICAgaWYgKCFwYXN0Rmlyc3RJbnZlcnRUaHJlc2ggJiYgKGxhc3REaXJlY3Rpb24gPT09IDEgPyBtb3VzZU9uQXhpcyA+IHRhcmdldFMxICsgdGFyZ2V0TGVuZ3RoICogaW52ZXJ0ZWRTd2FwVGhyZXNob2xkIC8gMiA6IG1vdXNlT25BeGlzIDwgdGFyZ2V0UzIgLSB0YXJnZXRMZW5ndGggKiBpbnZlcnRlZFN3YXBUaHJlc2hvbGQgLyAyKSkge1xuICAgICAgICAvLyBwYXN0IGZpcnN0IGludmVydCB0aHJlc2hvbGQsIGRvIG5vdCByZXN0cmljdCBpbnZlcnRlZCB0aHJlc2hvbGQgdG8gZHJhZ0VsIHNoYWRvd1xuICAgICAgICBwYXN0Rmlyc3RJbnZlcnRUaHJlc2ggPSB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKCFwYXN0Rmlyc3RJbnZlcnRUaHJlc2gpIHtcbiAgICAgICAgLy8gZHJhZ0VsIHNoYWRvdyAodGFyZ2V0IG1vdmUgZGlzdGFuY2Ugc2hhZG93KVxuICAgICAgICBpZiAobGFzdERpcmVjdGlvbiA9PT0gMSA/IG1vdXNlT25BeGlzIDwgdGFyZ2V0UzEgKyB0YXJnZXRNb3ZlRGlzdGFuY2UgLy8gb3ZlciBkcmFnRWwgc2hhZG93XG4gICAgICAgIDogbW91c2VPbkF4aXMgPiB0YXJnZXRTMiAtIHRhcmdldE1vdmVEaXN0YW5jZSkge1xuICAgICAgICAgIHJldHVybiAtbGFzdERpcmVjdGlvbjtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW52ZXJ0ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gUmVndWxhclxuICAgICAgaWYgKG1vdXNlT25BeGlzID4gdGFyZ2V0UzEgKyB0YXJnZXRMZW5ndGggKiAoMSAtIHN3YXBUaHJlc2hvbGQpIC8gMiAmJiBtb3VzZU9uQXhpcyA8IHRhcmdldFMyIC0gdGFyZ2V0TGVuZ3RoICogKDEgLSBzd2FwVGhyZXNob2xkKSAvIDIpIHtcbiAgICAgICAgcmV0dXJuIF9nZXRJbnNlcnREaXJlY3Rpb24odGFyZ2V0KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaW52ZXJ0ID0gaW52ZXJ0IHx8IGludmVydFN3YXA7XG4gIGlmIChpbnZlcnQpIHtcbiAgICAvLyBJbnZlcnQgb2YgcmVndWxhclxuICAgIGlmIChtb3VzZU9uQXhpcyA8IHRhcmdldFMxICsgdGFyZ2V0TGVuZ3RoICogaW52ZXJ0ZWRTd2FwVGhyZXNob2xkIC8gMiB8fCBtb3VzZU9uQXhpcyA+IHRhcmdldFMyIC0gdGFyZ2V0TGVuZ3RoICogaW52ZXJ0ZWRTd2FwVGhyZXNob2xkIC8gMikge1xuICAgICAgcmV0dXJuIG1vdXNlT25BeGlzID4gdGFyZ2V0UzEgKyB0YXJnZXRMZW5ndGggLyAyID8gMSA6IC0xO1xuICAgIH1cbiAgfVxuICByZXR1cm4gMDtcbn1cblxuLyoqXHJcbiAqIEdldHMgdGhlIGRpcmVjdGlvbiBkcmFnRWwgbXVzdCBiZSBzd2FwcGVkIHJlbGF0aXZlIHRvIHRhcmdldCBpbiBvcmRlciB0byBtYWtlIGl0XHJcbiAqIHNlZW0gdGhhdCBkcmFnRWwgaGFzIGJlZW4gXCJpbnNlcnRlZFwiIGludG8gdGhhdCBlbGVtZW50J3MgcG9zaXRpb25cclxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IHRhcmdldCAgICAgICBUaGUgdGFyZ2V0IHdob3NlIHBvc2l0aW9uIGRyYWdFbCBpcyBiZWluZyBpbnNlcnRlZCBhdFxyXG4gKiBAcmV0dXJuIHtOdW1iZXJ9ICAgICAgICAgICAgICAgICAgIERpcmVjdGlvbiBkcmFnRWwgbXVzdCBiZSBzd2FwcGVkXHJcbiAqL1xuZnVuY3Rpb24gX2dldEluc2VydERpcmVjdGlvbih0YXJnZXQpIHtcbiAgaWYgKGluZGV4KGRyYWdFbCkgPCBpbmRleCh0YXJnZXQpKSB7XG4gICAgcmV0dXJuIDE7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIC0xO1xuICB9XG59XG5cbi8qKlxyXG4gKiBHZW5lcmF0ZSBpZFxyXG4gKiBAcGFyYW0gICB7SFRNTEVsZW1lbnR9IGVsXHJcbiAqIEByZXR1cm5zIHtTdHJpbmd9XHJcbiAqIEBwcml2YXRlXHJcbiAqL1xuZnVuY3Rpb24gX2dlbmVyYXRlSWQoZWwpIHtcbiAgdmFyIHN0ciA9IGVsLnRhZ05hbWUgKyBlbC5jbGFzc05hbWUgKyBlbC5zcmMgKyBlbC5ocmVmICsgZWwudGV4dENvbnRlbnQsXG4gICAgaSA9IHN0ci5sZW5ndGgsXG4gICAgc3VtID0gMDtcbiAgd2hpbGUgKGktLSkge1xuICAgIHN1bSArPSBzdHIuY2hhckNvZGVBdChpKTtcbiAgfVxuICByZXR1cm4gc3VtLnRvU3RyaW5nKDM2KTtcbn1cbmZ1bmN0aW9uIF9zYXZlSW5wdXRDaGVja2VkU3RhdGUocm9vdCkge1xuICBzYXZlZElucHV0Q2hlY2tlZC5sZW5ndGggPSAwO1xuICB2YXIgaW5wdXRzID0gcm9vdC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaW5wdXQnKTtcbiAgdmFyIGlkeCA9IGlucHV0cy5sZW5ndGg7XG4gIHdoaWxlIChpZHgtLSkge1xuICAgIHZhciBlbCA9IGlucHV0c1tpZHhdO1xuICAgIGVsLmNoZWNrZWQgJiYgc2F2ZWRJbnB1dENoZWNrZWQucHVzaChlbCk7XG4gIH1cbn1cbmZ1bmN0aW9uIF9uZXh0VGljayhmbikge1xuICByZXR1cm4gc2V0VGltZW91dChmbiwgMCk7XG59XG5mdW5jdGlvbiBfY2FuY2VsTmV4dFRpY2soaWQpIHtcbiAgcmV0dXJuIGNsZWFyVGltZW91dChpZCk7XG59XG5cbi8vIEZpeGVkICM5NzM6XG5pZiAoZG9jdW1lbnRFeGlzdHMpIHtcbiAgb24oZG9jdW1lbnQsICd0b3VjaG1vdmUnLCBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgaWYgKChTb3J0YWJsZS5hY3RpdmUgfHwgYXdhaXRpbmdEcmFnU3RhcnRlZCkgJiYgZXZ0LmNhbmNlbGFibGUpIHtcbiAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cbiAgfSk7XG59XG5cbi8vIEV4cG9ydCB1dGlsc1xuU29ydGFibGUudXRpbHMgPSB7XG4gIG9uOiBvbixcbiAgb2ZmOiBvZmYsXG4gIGNzczogY3NzLFxuICBmaW5kOiBmaW5kLFxuICBpczogZnVuY3Rpb24gaXMoZWwsIHNlbGVjdG9yKSB7XG4gICAgcmV0dXJuICEhY2xvc2VzdChlbCwgc2VsZWN0b3IsIGVsLCBmYWxzZSk7XG4gIH0sXG4gIGV4dGVuZDogZXh0ZW5kLFxuICB0aHJvdHRsZTogdGhyb3R0bGUsXG4gIGNsb3Nlc3Q6IGNsb3Nlc3QsXG4gIHRvZ2dsZUNsYXNzOiB0b2dnbGVDbGFzcyxcbiAgY2xvbmU6IGNsb25lLFxuICBpbmRleDogaW5kZXgsXG4gIG5leHRUaWNrOiBfbmV4dFRpY2ssXG4gIGNhbmNlbE5leHRUaWNrOiBfY2FuY2VsTmV4dFRpY2ssXG4gIGRldGVjdERpcmVjdGlvbjogX2RldGVjdERpcmVjdGlvbixcbiAgZ2V0Q2hpbGQ6IGdldENoaWxkLFxuICBleHBhbmRvOiBleHBhbmRvXG59O1xuXG4vKipcclxuICogR2V0IHRoZSBTb3J0YWJsZSBpbnN0YW5jZSBvZiBhbiBlbGVtZW50XHJcbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBlbGVtZW50IFRoZSBlbGVtZW50XHJcbiAqIEByZXR1cm4ge1NvcnRhYmxlfHVuZGVmaW5lZH0gICAgICAgICBUaGUgaW5zdGFuY2Ugb2YgU29ydGFibGVcclxuICovXG5Tb3J0YWJsZS5nZXQgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICByZXR1cm4gZWxlbWVudFtleHBhbmRvXTtcbn07XG5cbi8qKlxyXG4gKiBNb3VudCBhIHBsdWdpbiB0byBTb3J0YWJsZVxyXG4gKiBAcGFyYW0gIHsuLi5Tb3J0YWJsZVBsdWdpbnxTb3J0YWJsZVBsdWdpbltdfSBwbHVnaW5zICAgICAgIFBsdWdpbnMgYmVpbmcgbW91bnRlZFxyXG4gKi9cblNvcnRhYmxlLm1vdW50ID0gZnVuY3Rpb24gKCkge1xuICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgcGx1Z2lucyA9IG5ldyBBcnJheShfbGVuKSwgX2tleSA9IDA7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcbiAgICBwbHVnaW5zW19rZXldID0gYXJndW1lbnRzW19rZXldO1xuICB9XG4gIGlmIChwbHVnaW5zWzBdLmNvbnN0cnVjdG9yID09PSBBcnJheSkgcGx1Z2lucyA9IHBsdWdpbnNbMF07XG4gIHBsdWdpbnMuZm9yRWFjaChmdW5jdGlvbiAocGx1Z2luKSB7XG4gICAgaWYgKCFwbHVnaW4ucHJvdG90eXBlIHx8ICFwbHVnaW4ucHJvdG90eXBlLmNvbnN0cnVjdG9yKSB7XG4gICAgICB0aHJvdyBcIlNvcnRhYmxlOiBNb3VudGVkIHBsdWdpbiBtdXN0IGJlIGEgY29uc3RydWN0b3IgZnVuY3Rpb24sIG5vdCBcIi5jb25jYXQoe30udG9TdHJpbmcuY2FsbChwbHVnaW4pKTtcbiAgICB9XG4gICAgaWYgKHBsdWdpbi51dGlscykgU29ydGFibGUudXRpbHMgPSBfb2JqZWN0U3ByZWFkMihfb2JqZWN0U3ByZWFkMih7fSwgU29ydGFibGUudXRpbHMpLCBwbHVnaW4udXRpbHMpO1xuICAgIFBsdWdpbk1hbmFnZXIubW91bnQocGx1Z2luKTtcbiAgfSk7XG59O1xuXG4vKipcclxuICogQ3JlYXRlIHNvcnRhYmxlIGluc3RhbmNlXHJcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9ICBlbFxyXG4gKiBAcGFyYW0ge09iamVjdH0gICAgICBbb3B0aW9uc11cclxuICovXG5Tb3J0YWJsZS5jcmVhdGUgPSBmdW5jdGlvbiAoZWwsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIG5ldyBTb3J0YWJsZShlbCwgb3B0aW9ucyk7XG59O1xuXG4vLyBFeHBvcnRcblNvcnRhYmxlLnZlcnNpb24gPSB2ZXJzaW9uO1xuXG52YXIgYXV0b1Njcm9sbHMgPSBbXSxcbiAgc2Nyb2xsRWwsXG4gIHNjcm9sbFJvb3RFbCxcbiAgc2Nyb2xsaW5nID0gZmFsc2UsXG4gIGxhc3RBdXRvU2Nyb2xsWCxcbiAgbGFzdEF1dG9TY3JvbGxZLFxuICB0b3VjaEV2dCQxLFxuICBwb2ludGVyRWxlbUNoYW5nZWRJbnRlcnZhbDtcbmZ1bmN0aW9uIEF1dG9TY3JvbGxQbHVnaW4oKSB7XG4gIGZ1bmN0aW9uIEF1dG9TY3JvbGwoKSB7XG4gICAgdGhpcy5kZWZhdWx0cyA9IHtcbiAgICAgIHNjcm9sbDogdHJ1ZSxcbiAgICAgIGZvcmNlQXV0b1Njcm9sbEZhbGxiYWNrOiBmYWxzZSxcbiAgICAgIHNjcm9sbFNlbnNpdGl2aXR5OiAzMCxcbiAgICAgIHNjcm9sbFNwZWVkOiAxMCxcbiAgICAgIGJ1YmJsZVNjcm9sbDogdHJ1ZVxuICAgIH07XG5cbiAgICAvLyBCaW5kIGFsbCBwcml2YXRlIG1ldGhvZHNcbiAgICBmb3IgKHZhciBmbiBpbiB0aGlzKSB7XG4gICAgICBpZiAoZm4uY2hhckF0KDApID09PSAnXycgJiYgdHlwZW9mIHRoaXNbZm5dID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRoaXNbZm5dID0gdGhpc1tmbl0uYmluZCh0aGlzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgQXV0b1Njcm9sbC5wcm90b3R5cGUgPSB7XG4gICAgZHJhZ1N0YXJ0ZWQ6IGZ1bmN0aW9uIGRyYWdTdGFydGVkKF9yZWYpIHtcbiAgICAgIHZhciBvcmlnaW5hbEV2ZW50ID0gX3JlZi5vcmlnaW5hbEV2ZW50O1xuICAgICAgaWYgKHRoaXMuc29ydGFibGUubmF0aXZlRHJhZ2dhYmxlKSB7XG4gICAgICAgIG9uKGRvY3VtZW50LCAnZHJhZ292ZXInLCB0aGlzLl9oYW5kbGVBdXRvU2Nyb2xsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc3VwcG9ydFBvaW50ZXIpIHtcbiAgICAgICAgICBvbihkb2N1bWVudCwgJ3BvaW50ZXJtb3ZlJywgdGhpcy5faGFuZGxlRmFsbGJhY2tBdXRvU2Nyb2xsKTtcbiAgICAgICAgfSBlbHNlIGlmIChvcmlnaW5hbEV2ZW50LnRvdWNoZXMpIHtcbiAgICAgICAgICBvbihkb2N1bWVudCwgJ3RvdWNobW92ZScsIHRoaXMuX2hhbmRsZUZhbGxiYWNrQXV0b1Njcm9sbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb24oZG9jdW1lbnQsICdtb3VzZW1vdmUnLCB0aGlzLl9oYW5kbGVGYWxsYmFja0F1dG9TY3JvbGwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBkcmFnT3ZlckNvbXBsZXRlZDogZnVuY3Rpb24gZHJhZ092ZXJDb21wbGV0ZWQoX3JlZjIpIHtcbiAgICAgIHZhciBvcmlnaW5hbEV2ZW50ID0gX3JlZjIub3JpZ2luYWxFdmVudDtcbiAgICAgIC8vIEZvciB3aGVuIGJ1YmJsaW5nIGlzIGNhbmNlbGVkIGFuZCB1c2luZyBmYWxsYmFjayAoZmFsbGJhY2sgJ3RvdWNobW92ZScgYWx3YXlzIHJlYWNoZWQpXG4gICAgICBpZiAoIXRoaXMub3B0aW9ucy5kcmFnT3ZlckJ1YmJsZSAmJiAhb3JpZ2luYWxFdmVudC5yb290RWwpIHtcbiAgICAgICAgdGhpcy5faGFuZGxlQXV0b1Njcm9sbChvcmlnaW5hbEV2ZW50KTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGRyb3A6IGZ1bmN0aW9uIGRyb3AoKSB7XG4gICAgICBpZiAodGhpcy5zb3J0YWJsZS5uYXRpdmVEcmFnZ2FibGUpIHtcbiAgICAgICAgb2ZmKGRvY3VtZW50LCAnZHJhZ292ZXInLCB0aGlzLl9oYW5kbGVBdXRvU2Nyb2xsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG9mZihkb2N1bWVudCwgJ3BvaW50ZXJtb3ZlJywgdGhpcy5faGFuZGxlRmFsbGJhY2tBdXRvU2Nyb2xsKTtcbiAgICAgICAgb2ZmKGRvY3VtZW50LCAndG91Y2htb3ZlJywgdGhpcy5faGFuZGxlRmFsbGJhY2tBdXRvU2Nyb2xsKTtcbiAgICAgICAgb2ZmKGRvY3VtZW50LCAnbW91c2Vtb3ZlJywgdGhpcy5faGFuZGxlRmFsbGJhY2tBdXRvU2Nyb2xsKTtcbiAgICAgIH1cbiAgICAgIGNsZWFyUG9pbnRlckVsZW1DaGFuZ2VkSW50ZXJ2YWwoKTtcbiAgICAgIGNsZWFyQXV0b1Njcm9sbHMoKTtcbiAgICAgIGNhbmNlbFRocm90dGxlKCk7XG4gICAgfSxcbiAgICBudWxsaW5nOiBmdW5jdGlvbiBudWxsaW5nKCkge1xuICAgICAgdG91Y2hFdnQkMSA9IHNjcm9sbFJvb3RFbCA9IHNjcm9sbEVsID0gc2Nyb2xsaW5nID0gcG9pbnRlckVsZW1DaGFuZ2VkSW50ZXJ2YWwgPSBsYXN0QXV0b1Njcm9sbFggPSBsYXN0QXV0b1Njcm9sbFkgPSBudWxsO1xuICAgICAgYXV0b1Njcm9sbHMubGVuZ3RoID0gMDtcbiAgICB9LFxuICAgIF9oYW5kbGVGYWxsYmFja0F1dG9TY3JvbGw6IGZ1bmN0aW9uIF9oYW5kbGVGYWxsYmFja0F1dG9TY3JvbGwoZXZ0KSB7XG4gICAgICB0aGlzLl9oYW5kbGVBdXRvU2Nyb2xsKGV2dCwgdHJ1ZSk7XG4gICAgfSxcbiAgICBfaGFuZGxlQXV0b1Njcm9sbDogZnVuY3Rpb24gX2hhbmRsZUF1dG9TY3JvbGwoZXZ0LCBmYWxsYmFjaykge1xuICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgIHZhciB4ID0gKGV2dC50b3VjaGVzID8gZXZ0LnRvdWNoZXNbMF0gOiBldnQpLmNsaWVudFgsXG4gICAgICAgIHkgPSAoZXZ0LnRvdWNoZXMgPyBldnQudG91Y2hlc1swXSA6IGV2dCkuY2xpZW50WSxcbiAgICAgICAgZWxlbSA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoeCwgeSk7XG4gICAgICB0b3VjaEV2dCQxID0gZXZ0O1xuXG4gICAgICAvLyBJRSBkb2VzIG5vdCBzZWVtIHRvIGhhdmUgbmF0aXZlIGF1dG9zY3JvbGwsXG4gICAgICAvLyBFZGdlJ3MgYXV0b3Njcm9sbCBzZWVtcyB0b28gY29uZGl0aW9uYWwsXG4gICAgICAvLyBNQUNPUyBTYWZhcmkgZG9lcyBub3QgaGF2ZSBhdXRvc2Nyb2xsLFxuICAgICAgLy8gRmlyZWZveCBhbmQgQ2hyb21lIGFyZSBnb29kXG4gICAgICBpZiAoZmFsbGJhY2sgfHwgdGhpcy5vcHRpb25zLmZvcmNlQXV0b1Njcm9sbEZhbGxiYWNrIHx8IEVkZ2UgfHwgSUUxMU9yTGVzcyB8fCBTYWZhcmkpIHtcbiAgICAgICAgYXV0b1Njcm9sbChldnQsIHRoaXMub3B0aW9ucywgZWxlbSwgZmFsbGJhY2spO1xuXG4gICAgICAgIC8vIExpc3RlbmVyIGZvciBwb2ludGVyIGVsZW1lbnQgY2hhbmdlXG4gICAgICAgIHZhciBvZ0VsZW1TY3JvbGxlciA9IGdldFBhcmVudEF1dG9TY3JvbGxFbGVtZW50KGVsZW0sIHRydWUpO1xuICAgICAgICBpZiAoc2Nyb2xsaW5nICYmICghcG9pbnRlckVsZW1DaGFuZ2VkSW50ZXJ2YWwgfHwgeCAhPT0gbGFzdEF1dG9TY3JvbGxYIHx8IHkgIT09IGxhc3RBdXRvU2Nyb2xsWSkpIHtcbiAgICAgICAgICBwb2ludGVyRWxlbUNoYW5nZWRJbnRlcnZhbCAmJiBjbGVhclBvaW50ZXJFbGVtQ2hhbmdlZEludGVydmFsKCk7XG4gICAgICAgICAgLy8gRGV0ZWN0IGZvciBwb2ludGVyIGVsZW0gY2hhbmdlLCBlbXVsYXRpbmcgbmF0aXZlIERuRCBiZWhhdmlvdXJcbiAgICAgICAgICBwb2ludGVyRWxlbUNoYW5nZWRJbnRlcnZhbCA9IHNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBuZXdFbGVtID0gZ2V0UGFyZW50QXV0b1Njcm9sbEVsZW1lbnQoZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludCh4LCB5KSwgdHJ1ZSk7XG4gICAgICAgICAgICBpZiAobmV3RWxlbSAhPT0gb2dFbGVtU2Nyb2xsZXIpIHtcbiAgICAgICAgICAgICAgb2dFbGVtU2Nyb2xsZXIgPSBuZXdFbGVtO1xuICAgICAgICAgICAgICBjbGVhckF1dG9TY3JvbGxzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhdXRvU2Nyb2xsKGV2dCwgX3RoaXMub3B0aW9ucywgbmV3RWxlbSwgZmFsbGJhY2spO1xuICAgICAgICAgIH0sIDEwKTtcbiAgICAgICAgICBsYXN0QXV0b1Njcm9sbFggPSB4O1xuICAgICAgICAgIGxhc3RBdXRvU2Nyb2xsWSA9IHk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGlmIERuRCBpcyBlbmFibGVkIChhbmQgYnJvd3NlciBoYXMgZ29vZCBhdXRvc2Nyb2xsaW5nKSwgZmlyc3QgYXV0b3Njcm9sbCB3aWxsIGFscmVhZHkgc2Nyb2xsLCBzbyBnZXQgcGFyZW50IGF1dG9zY3JvbGwgb2YgZmlyc3QgYXV0b3Njcm9sbFxuICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5idWJibGVTY3JvbGwgfHwgZ2V0UGFyZW50QXV0b1Njcm9sbEVsZW1lbnQoZWxlbSwgdHJ1ZSkgPT09IGdldFdpbmRvd1Njcm9sbGluZ0VsZW1lbnQoKSkge1xuICAgICAgICAgIGNsZWFyQXV0b1Njcm9sbHMoKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgYXV0b1Njcm9sbChldnQsIHRoaXMub3B0aW9ucywgZ2V0UGFyZW50QXV0b1Njcm9sbEVsZW1lbnQoZWxlbSwgZmFsc2UpLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICByZXR1cm4gX2V4dGVuZHMoQXV0b1Njcm9sbCwge1xuICAgIHBsdWdpbk5hbWU6ICdzY3JvbGwnLFxuICAgIGluaXRpYWxpemVCeURlZmF1bHQ6IHRydWVcbiAgfSk7XG59XG5mdW5jdGlvbiBjbGVhckF1dG9TY3JvbGxzKCkge1xuICBhdXRvU2Nyb2xscy5mb3JFYWNoKGZ1bmN0aW9uIChhdXRvU2Nyb2xsKSB7XG4gICAgY2xlYXJJbnRlcnZhbChhdXRvU2Nyb2xsLnBpZCk7XG4gIH0pO1xuICBhdXRvU2Nyb2xscyA9IFtdO1xufVxuZnVuY3Rpb24gY2xlYXJQb2ludGVyRWxlbUNoYW5nZWRJbnRlcnZhbCgpIHtcbiAgY2xlYXJJbnRlcnZhbChwb2ludGVyRWxlbUNoYW5nZWRJbnRlcnZhbCk7XG59XG52YXIgYXV0b1Njcm9sbCA9IHRocm90dGxlKGZ1bmN0aW9uIChldnQsIG9wdGlvbnMsIHJvb3RFbCwgaXNGYWxsYmFjaykge1xuICAvLyBCdWc6IGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTUwNTUyMVxuICBpZiAoIW9wdGlvbnMuc2Nyb2xsKSByZXR1cm47XG4gIHZhciB4ID0gKGV2dC50b3VjaGVzID8gZXZ0LnRvdWNoZXNbMF0gOiBldnQpLmNsaWVudFgsXG4gICAgeSA9IChldnQudG91Y2hlcyA/IGV2dC50b3VjaGVzWzBdIDogZXZ0KS5jbGllbnRZLFxuICAgIHNlbnMgPSBvcHRpb25zLnNjcm9sbFNlbnNpdGl2aXR5LFxuICAgIHNwZWVkID0gb3B0aW9ucy5zY3JvbGxTcGVlZCxcbiAgICB3aW5TY3JvbGxlciA9IGdldFdpbmRvd1Njcm9sbGluZ0VsZW1lbnQoKTtcbiAgdmFyIHNjcm9sbFRoaXNJbnN0YW5jZSA9IGZhbHNlLFxuICAgIHNjcm9sbEN1c3RvbUZuO1xuXG4gIC8vIE5ldyBzY3JvbGwgcm9vdCwgc2V0IHNjcm9sbEVsXG4gIGlmIChzY3JvbGxSb290RWwgIT09IHJvb3RFbCkge1xuICAgIHNjcm9sbFJvb3RFbCA9IHJvb3RFbDtcbiAgICBjbGVhckF1dG9TY3JvbGxzKCk7XG4gICAgc2Nyb2xsRWwgPSBvcHRpb25zLnNjcm9sbDtcbiAgICBzY3JvbGxDdXN0b21GbiA9IG9wdGlvbnMuc2Nyb2xsRm47XG4gICAgaWYgKHNjcm9sbEVsID09PSB0cnVlKSB7XG4gICAgICBzY3JvbGxFbCA9IGdldFBhcmVudEF1dG9TY3JvbGxFbGVtZW50KHJvb3RFbCwgdHJ1ZSk7XG4gICAgfVxuICB9XG4gIHZhciBsYXllcnNPdXQgPSAwO1xuICB2YXIgY3VycmVudFBhcmVudCA9IHNjcm9sbEVsO1xuICBkbyB7XG4gICAgdmFyIGVsID0gY3VycmVudFBhcmVudCxcbiAgICAgIHJlY3QgPSBnZXRSZWN0KGVsKSxcbiAgICAgIHRvcCA9IHJlY3QudG9wLFxuICAgICAgYm90dG9tID0gcmVjdC5ib3R0b20sXG4gICAgICBsZWZ0ID0gcmVjdC5sZWZ0LFxuICAgICAgcmlnaHQgPSByZWN0LnJpZ2h0LFxuICAgICAgd2lkdGggPSByZWN0LndpZHRoLFxuICAgICAgaGVpZ2h0ID0gcmVjdC5oZWlnaHQsXG4gICAgICBjYW5TY3JvbGxYID0gdm9pZCAwLFxuICAgICAgY2FuU2Nyb2xsWSA9IHZvaWQgMCxcbiAgICAgIHNjcm9sbFdpZHRoID0gZWwuc2Nyb2xsV2lkdGgsXG4gICAgICBzY3JvbGxIZWlnaHQgPSBlbC5zY3JvbGxIZWlnaHQsXG4gICAgICBlbENTUyA9IGNzcyhlbCksXG4gICAgICBzY3JvbGxQb3NYID0gZWwuc2Nyb2xsTGVmdCxcbiAgICAgIHNjcm9sbFBvc1kgPSBlbC5zY3JvbGxUb3A7XG4gICAgaWYgKGVsID09PSB3aW5TY3JvbGxlcikge1xuICAgICAgY2FuU2Nyb2xsWCA9IHdpZHRoIDwgc2Nyb2xsV2lkdGggJiYgKGVsQ1NTLm92ZXJmbG93WCA9PT0gJ2F1dG8nIHx8IGVsQ1NTLm92ZXJmbG93WCA9PT0gJ3Njcm9sbCcgfHwgZWxDU1Mub3ZlcmZsb3dYID09PSAndmlzaWJsZScpO1xuICAgICAgY2FuU2Nyb2xsWSA9IGhlaWdodCA8IHNjcm9sbEhlaWdodCAmJiAoZWxDU1Mub3ZlcmZsb3dZID09PSAnYXV0bycgfHwgZWxDU1Mub3ZlcmZsb3dZID09PSAnc2Nyb2xsJyB8fCBlbENTUy5vdmVyZmxvd1kgPT09ICd2aXNpYmxlJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNhblNjcm9sbFggPSB3aWR0aCA8IHNjcm9sbFdpZHRoICYmIChlbENTUy5vdmVyZmxvd1ggPT09ICdhdXRvJyB8fCBlbENTUy5vdmVyZmxvd1ggPT09ICdzY3JvbGwnKTtcbiAgICAgIGNhblNjcm9sbFkgPSBoZWlnaHQgPCBzY3JvbGxIZWlnaHQgJiYgKGVsQ1NTLm92ZXJmbG93WSA9PT0gJ2F1dG8nIHx8IGVsQ1NTLm92ZXJmbG93WSA9PT0gJ3Njcm9sbCcpO1xuICAgIH1cbiAgICB2YXIgdnggPSBjYW5TY3JvbGxYICYmIChNYXRoLmFicyhyaWdodCAtIHgpIDw9IHNlbnMgJiYgc2Nyb2xsUG9zWCArIHdpZHRoIDwgc2Nyb2xsV2lkdGgpIC0gKE1hdGguYWJzKGxlZnQgLSB4KSA8PSBzZW5zICYmICEhc2Nyb2xsUG9zWCk7XG4gICAgdmFyIHZ5ID0gY2FuU2Nyb2xsWSAmJiAoTWF0aC5hYnMoYm90dG9tIC0geSkgPD0gc2VucyAmJiBzY3JvbGxQb3NZICsgaGVpZ2h0IDwgc2Nyb2xsSGVpZ2h0KSAtIChNYXRoLmFicyh0b3AgLSB5KSA8PSBzZW5zICYmICEhc2Nyb2xsUG9zWSk7XG4gICAgaWYgKCFhdXRvU2Nyb2xsc1tsYXllcnNPdXRdKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8PSBsYXllcnNPdXQ7IGkrKykge1xuICAgICAgICBpZiAoIWF1dG9TY3JvbGxzW2ldKSB7XG4gICAgICAgICAgYXV0b1Njcm9sbHNbaV0gPSB7fTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoYXV0b1Njcm9sbHNbbGF5ZXJzT3V0XS52eCAhPSB2eCB8fCBhdXRvU2Nyb2xsc1tsYXllcnNPdXRdLnZ5ICE9IHZ5IHx8IGF1dG9TY3JvbGxzW2xheWVyc091dF0uZWwgIT09IGVsKSB7XG4gICAgICBhdXRvU2Nyb2xsc1tsYXllcnNPdXRdLmVsID0gZWw7XG4gICAgICBhdXRvU2Nyb2xsc1tsYXllcnNPdXRdLnZ4ID0gdng7XG4gICAgICBhdXRvU2Nyb2xsc1tsYXllcnNPdXRdLnZ5ID0gdnk7XG4gICAgICBjbGVhckludGVydmFsKGF1dG9TY3JvbGxzW2xheWVyc091dF0ucGlkKTtcbiAgICAgIGlmICh2eCAhPSAwIHx8IHZ5ICE9IDApIHtcbiAgICAgICAgc2Nyb2xsVGhpc0luc3RhbmNlID0gdHJ1ZTtcbiAgICAgICAgLyoganNoaW50IGxvb3BmdW5jOnRydWUgKi9cbiAgICAgICAgYXV0b1Njcm9sbHNbbGF5ZXJzT3V0XS5waWQgPSBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgLy8gZW11bGF0ZSBkcmFnIG92ZXIgZHVyaW5nIGF1dG9zY3JvbGwgKGZhbGxiYWNrKSwgZW11bGF0aW5nIG5hdGl2ZSBEbkQgYmVoYXZpb3VyXG4gICAgICAgICAgaWYgKGlzRmFsbGJhY2sgJiYgdGhpcy5sYXllciA9PT0gMCkge1xuICAgICAgICAgICAgU29ydGFibGUuYWN0aXZlLl9vblRvdWNoTW92ZSh0b3VjaEV2dCQxKTsgLy8gVG8gbW92ZSBnaG9zdCBpZiBpdCBpcyBwb3NpdGlvbmVkIGFic29sdXRlbHlcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIHNjcm9sbE9mZnNldFkgPSBhdXRvU2Nyb2xsc1t0aGlzLmxheWVyXS52eSA/IGF1dG9TY3JvbGxzW3RoaXMubGF5ZXJdLnZ5ICogc3BlZWQgOiAwO1xuICAgICAgICAgIHZhciBzY3JvbGxPZmZzZXRYID0gYXV0b1Njcm9sbHNbdGhpcy5sYXllcl0udnggPyBhdXRvU2Nyb2xsc1t0aGlzLmxheWVyXS52eCAqIHNwZWVkIDogMDtcbiAgICAgICAgICBpZiAodHlwZW9mIHNjcm9sbEN1c3RvbUZuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBpZiAoc2Nyb2xsQ3VzdG9tRm4uY2FsbChTb3J0YWJsZS5kcmFnZ2VkLnBhcmVudE5vZGVbZXhwYW5kb10sIHNjcm9sbE9mZnNldFgsIHNjcm9sbE9mZnNldFksIGV2dCwgdG91Y2hFdnQkMSwgYXV0b1Njcm9sbHNbdGhpcy5sYXllcl0uZWwpICE9PSAnY29udGludWUnKSB7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgc2Nyb2xsQnkoYXV0b1Njcm9sbHNbdGhpcy5sYXllcl0uZWwsIHNjcm9sbE9mZnNldFgsIHNjcm9sbE9mZnNldFkpO1xuICAgICAgICB9LmJpbmQoe1xuICAgICAgICAgIGxheWVyOiBsYXllcnNPdXRcbiAgICAgICAgfSksIDI0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgbGF5ZXJzT3V0Kys7XG4gIH0gd2hpbGUgKG9wdGlvbnMuYnViYmxlU2Nyb2xsICYmIGN1cnJlbnRQYXJlbnQgIT09IHdpblNjcm9sbGVyICYmIChjdXJyZW50UGFyZW50ID0gZ2V0UGFyZW50QXV0b1Njcm9sbEVsZW1lbnQoY3VycmVudFBhcmVudCwgZmFsc2UpKSk7XG4gIHNjcm9sbGluZyA9IHNjcm9sbFRoaXNJbnN0YW5jZTsgLy8gaW4gY2FzZSBhbm90aGVyIGZ1bmN0aW9uIGNhdGNoZXMgc2Nyb2xsaW5nIGFzIGZhbHNlIGluIGJldHdlZW4gd2hlbiBpdCBpcyBub3Rcbn0sIDMwKTtcblxudmFyIGRyb3AgPSBmdW5jdGlvbiBkcm9wKF9yZWYpIHtcbiAgdmFyIG9yaWdpbmFsRXZlbnQgPSBfcmVmLm9yaWdpbmFsRXZlbnQsXG4gICAgcHV0U29ydGFibGUgPSBfcmVmLnB1dFNvcnRhYmxlLFxuICAgIGRyYWdFbCA9IF9yZWYuZHJhZ0VsLFxuICAgIGFjdGl2ZVNvcnRhYmxlID0gX3JlZi5hY3RpdmVTb3J0YWJsZSxcbiAgICBkaXNwYXRjaFNvcnRhYmxlRXZlbnQgPSBfcmVmLmRpc3BhdGNoU29ydGFibGVFdmVudCxcbiAgICBoaWRlR2hvc3RGb3JUYXJnZXQgPSBfcmVmLmhpZGVHaG9zdEZvclRhcmdldCxcbiAgICB1bmhpZGVHaG9zdEZvclRhcmdldCA9IF9yZWYudW5oaWRlR2hvc3RGb3JUYXJnZXQ7XG4gIGlmICghb3JpZ2luYWxFdmVudCkgcmV0dXJuO1xuICB2YXIgdG9Tb3J0YWJsZSA9IHB1dFNvcnRhYmxlIHx8IGFjdGl2ZVNvcnRhYmxlO1xuICBoaWRlR2hvc3RGb3JUYXJnZXQoKTtcbiAgdmFyIHRvdWNoID0gb3JpZ2luYWxFdmVudC5jaGFuZ2VkVG91Y2hlcyAmJiBvcmlnaW5hbEV2ZW50LmNoYW5nZWRUb3VjaGVzLmxlbmd0aCA/IG9yaWdpbmFsRXZlbnQuY2hhbmdlZFRvdWNoZXNbMF0gOiBvcmlnaW5hbEV2ZW50O1xuICB2YXIgdGFyZ2V0ID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludCh0b3VjaC5jbGllbnRYLCB0b3VjaC5jbGllbnRZKTtcbiAgdW5oaWRlR2hvc3RGb3JUYXJnZXQoKTtcbiAgaWYgKHRvU29ydGFibGUgJiYgIXRvU29ydGFibGUuZWwuY29udGFpbnModGFyZ2V0KSkge1xuICAgIGRpc3BhdGNoU29ydGFibGVFdmVudCgnc3BpbGwnKTtcbiAgICB0aGlzLm9uU3BpbGwoe1xuICAgICAgZHJhZ0VsOiBkcmFnRWwsXG4gICAgICBwdXRTb3J0YWJsZTogcHV0U29ydGFibGVcbiAgICB9KTtcbiAgfVxufTtcbmZ1bmN0aW9uIFJldmVydCgpIHt9XG5SZXZlcnQucHJvdG90eXBlID0ge1xuICBzdGFydEluZGV4OiBudWxsLFxuICBkcmFnU3RhcnQ6IGZ1bmN0aW9uIGRyYWdTdGFydChfcmVmMikge1xuICAgIHZhciBvbGREcmFnZ2FibGVJbmRleCA9IF9yZWYyLm9sZERyYWdnYWJsZUluZGV4O1xuICAgIHRoaXMuc3RhcnRJbmRleCA9IG9sZERyYWdnYWJsZUluZGV4O1xuICB9LFxuICBvblNwaWxsOiBmdW5jdGlvbiBvblNwaWxsKF9yZWYzKSB7XG4gICAgdmFyIGRyYWdFbCA9IF9yZWYzLmRyYWdFbCxcbiAgICAgIHB1dFNvcnRhYmxlID0gX3JlZjMucHV0U29ydGFibGU7XG4gICAgdGhpcy5zb3J0YWJsZS5jYXB0dXJlQW5pbWF0aW9uU3RhdGUoKTtcbiAgICBpZiAocHV0U29ydGFibGUpIHtcbiAgICAgIHB1dFNvcnRhYmxlLmNhcHR1cmVBbmltYXRpb25TdGF0ZSgpO1xuICAgIH1cbiAgICB2YXIgbmV4dFNpYmxpbmcgPSBnZXRDaGlsZCh0aGlzLnNvcnRhYmxlLmVsLCB0aGlzLnN0YXJ0SW5kZXgsIHRoaXMub3B0aW9ucyk7XG4gICAgaWYgKG5leHRTaWJsaW5nKSB7XG4gICAgICB0aGlzLnNvcnRhYmxlLmVsLmluc2VydEJlZm9yZShkcmFnRWwsIG5leHRTaWJsaW5nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zb3J0YWJsZS5lbC5hcHBlbmRDaGlsZChkcmFnRWwpO1xuICAgIH1cbiAgICB0aGlzLnNvcnRhYmxlLmFuaW1hdGVBbGwoKTtcbiAgICBpZiAocHV0U29ydGFibGUpIHtcbiAgICAgIHB1dFNvcnRhYmxlLmFuaW1hdGVBbGwoKTtcbiAgICB9XG4gIH0sXG4gIGRyb3A6IGRyb3Bcbn07XG5fZXh0ZW5kcyhSZXZlcnQsIHtcbiAgcGx1Z2luTmFtZTogJ3JldmVydE9uU3BpbGwnXG59KTtcbmZ1bmN0aW9uIFJlbW92ZSgpIHt9XG5SZW1vdmUucHJvdG90eXBlID0ge1xuICBvblNwaWxsOiBmdW5jdGlvbiBvblNwaWxsKF9yZWY0KSB7XG4gICAgdmFyIGRyYWdFbCA9IF9yZWY0LmRyYWdFbCxcbiAgICAgIHB1dFNvcnRhYmxlID0gX3JlZjQucHV0U29ydGFibGU7XG4gICAgdmFyIHBhcmVudFNvcnRhYmxlID0gcHV0U29ydGFibGUgfHwgdGhpcy5zb3J0YWJsZTtcbiAgICBwYXJlbnRTb3J0YWJsZS5jYXB0dXJlQW5pbWF0aW9uU3RhdGUoKTtcbiAgICBkcmFnRWwucGFyZW50Tm9kZSAmJiBkcmFnRWwucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChkcmFnRWwpO1xuICAgIHBhcmVudFNvcnRhYmxlLmFuaW1hdGVBbGwoKTtcbiAgfSxcbiAgZHJvcDogZHJvcFxufTtcbl9leHRlbmRzKFJlbW92ZSwge1xuICBwbHVnaW5OYW1lOiAncmVtb3ZlT25TcGlsbCdcbn0pO1xuXG52YXIgbGFzdFN3YXBFbDtcbmZ1bmN0aW9uIFN3YXBQbHVnaW4oKSB7XG4gIGZ1bmN0aW9uIFN3YXAoKSB7XG4gICAgdGhpcy5kZWZhdWx0cyA9IHtcbiAgICAgIHN3YXBDbGFzczogJ3NvcnRhYmxlLXN3YXAtaGlnaGxpZ2h0J1xuICAgIH07XG4gIH1cbiAgU3dhcC5wcm90b3R5cGUgPSB7XG4gICAgZHJhZ1N0YXJ0OiBmdW5jdGlvbiBkcmFnU3RhcnQoX3JlZikge1xuICAgICAgdmFyIGRyYWdFbCA9IF9yZWYuZHJhZ0VsO1xuICAgICAgbGFzdFN3YXBFbCA9IGRyYWdFbDtcbiAgICB9LFxuICAgIGRyYWdPdmVyVmFsaWQ6IGZ1bmN0aW9uIGRyYWdPdmVyVmFsaWQoX3JlZjIpIHtcbiAgICAgIHZhciBjb21wbGV0ZWQgPSBfcmVmMi5jb21wbGV0ZWQsXG4gICAgICAgIHRhcmdldCA9IF9yZWYyLnRhcmdldCxcbiAgICAgICAgb25Nb3ZlID0gX3JlZjIub25Nb3ZlLFxuICAgICAgICBhY3RpdmVTb3J0YWJsZSA9IF9yZWYyLmFjdGl2ZVNvcnRhYmxlLFxuICAgICAgICBjaGFuZ2VkID0gX3JlZjIuY2hhbmdlZCxcbiAgICAgICAgY2FuY2VsID0gX3JlZjIuY2FuY2VsO1xuICAgICAgaWYgKCFhY3RpdmVTb3J0YWJsZS5vcHRpb25zLnN3YXApIHJldHVybjtcbiAgICAgIHZhciBlbCA9IHRoaXMuc29ydGFibGUuZWwsXG4gICAgICAgIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG4gICAgICBpZiAodGFyZ2V0ICYmIHRhcmdldCAhPT0gZWwpIHtcbiAgICAgICAgdmFyIHByZXZTd2FwRWwgPSBsYXN0U3dhcEVsO1xuICAgICAgICBpZiAob25Nb3ZlKHRhcmdldCkgIT09IGZhbHNlKSB7XG4gICAgICAgICAgdG9nZ2xlQ2xhc3ModGFyZ2V0LCBvcHRpb25zLnN3YXBDbGFzcywgdHJ1ZSk7XG4gICAgICAgICAgbGFzdFN3YXBFbCA9IHRhcmdldDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsYXN0U3dhcEVsID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAocHJldlN3YXBFbCAmJiBwcmV2U3dhcEVsICE9PSBsYXN0U3dhcEVsKSB7XG4gICAgICAgICAgdG9nZ2xlQ2xhc3MocHJldlN3YXBFbCwgb3B0aW9ucy5zd2FwQ2xhc3MsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY2hhbmdlZCgpO1xuICAgICAgY29tcGxldGVkKHRydWUpO1xuICAgICAgY2FuY2VsKCk7XG4gICAgfSxcbiAgICBkcm9wOiBmdW5jdGlvbiBkcm9wKF9yZWYzKSB7XG4gICAgICB2YXIgYWN0aXZlU29ydGFibGUgPSBfcmVmMy5hY3RpdmVTb3J0YWJsZSxcbiAgICAgICAgcHV0U29ydGFibGUgPSBfcmVmMy5wdXRTb3J0YWJsZSxcbiAgICAgICAgZHJhZ0VsID0gX3JlZjMuZHJhZ0VsO1xuICAgICAgdmFyIHRvU29ydGFibGUgPSBwdXRTb3J0YWJsZSB8fCB0aGlzLnNvcnRhYmxlO1xuICAgICAgdmFyIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG4gICAgICBsYXN0U3dhcEVsICYmIHRvZ2dsZUNsYXNzKGxhc3RTd2FwRWwsIG9wdGlvbnMuc3dhcENsYXNzLCBmYWxzZSk7XG4gICAgICBpZiAobGFzdFN3YXBFbCAmJiAob3B0aW9ucy5zd2FwIHx8IHB1dFNvcnRhYmxlICYmIHB1dFNvcnRhYmxlLm9wdGlvbnMuc3dhcCkpIHtcbiAgICAgICAgaWYgKGRyYWdFbCAhPT0gbGFzdFN3YXBFbCkge1xuICAgICAgICAgIHRvU29ydGFibGUuY2FwdHVyZUFuaW1hdGlvblN0YXRlKCk7XG4gICAgICAgICAgaWYgKHRvU29ydGFibGUgIT09IGFjdGl2ZVNvcnRhYmxlKSBhY3RpdmVTb3J0YWJsZS5jYXB0dXJlQW5pbWF0aW9uU3RhdGUoKTtcbiAgICAgICAgICBzd2FwTm9kZXMoZHJhZ0VsLCBsYXN0U3dhcEVsKTtcbiAgICAgICAgICB0b1NvcnRhYmxlLmFuaW1hdGVBbGwoKTtcbiAgICAgICAgICBpZiAodG9Tb3J0YWJsZSAhPT0gYWN0aXZlU29ydGFibGUpIGFjdGl2ZVNvcnRhYmxlLmFuaW1hdGVBbGwoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgbnVsbGluZzogZnVuY3Rpb24gbnVsbGluZygpIHtcbiAgICAgIGxhc3RTd2FwRWwgPSBudWxsO1xuICAgIH1cbiAgfTtcbiAgcmV0dXJuIF9leHRlbmRzKFN3YXAsIHtcbiAgICBwbHVnaW5OYW1lOiAnc3dhcCcsXG4gICAgZXZlbnRQcm9wZXJ0aWVzOiBmdW5jdGlvbiBldmVudFByb3BlcnRpZXMoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzd2FwSXRlbTogbGFzdFN3YXBFbFxuICAgICAgfTtcbiAgICB9XG4gIH0pO1xufVxuZnVuY3Rpb24gc3dhcE5vZGVzKG4xLCBuMikge1xuICB2YXIgcDEgPSBuMS5wYXJlbnROb2RlLFxuICAgIHAyID0gbjIucGFyZW50Tm9kZSxcbiAgICBpMSxcbiAgICBpMjtcbiAgaWYgKCFwMSB8fCAhcDIgfHwgcDEuaXNFcXVhbE5vZGUobjIpIHx8IHAyLmlzRXF1YWxOb2RlKG4xKSkgcmV0dXJuO1xuICBpMSA9IGluZGV4KG4xKTtcbiAgaTIgPSBpbmRleChuMik7XG4gIGlmIChwMS5pc0VxdWFsTm9kZShwMikgJiYgaTEgPCBpMikge1xuICAgIGkyKys7XG4gIH1cbiAgcDEuaW5zZXJ0QmVmb3JlKG4yLCBwMS5jaGlsZHJlbltpMV0pO1xuICBwMi5pbnNlcnRCZWZvcmUobjEsIHAyLmNoaWxkcmVuW2kyXSk7XG59XG5cbnZhciBtdWx0aURyYWdFbGVtZW50cyA9IFtdLFxuICBtdWx0aURyYWdDbG9uZXMgPSBbXSxcbiAgbGFzdE11bHRpRHJhZ1NlbGVjdCxcbiAgLy8gZm9yIHNlbGVjdGlvbiB3aXRoIG1vZGlmaWVyIGtleSBkb3duIChTSElGVClcbiAgbXVsdGlEcmFnU29ydGFibGUsXG4gIGluaXRpYWxGb2xkaW5nID0gZmFsc2UsXG4gIC8vIEluaXRpYWwgbXVsdGktZHJhZyBmb2xkIHdoZW4gZHJhZyBzdGFydGVkXG4gIGZvbGRpbmcgPSBmYWxzZSxcbiAgLy8gRm9sZGluZyBhbnkgb3RoZXIgdGltZVxuICBkcmFnU3RhcnRlZCA9IGZhbHNlLFxuICBkcmFnRWwkMSxcbiAgY2xvbmVzRnJvbVJlY3QsXG4gIGNsb25lc0hpZGRlbjtcbmZ1bmN0aW9uIE11bHRpRHJhZ1BsdWdpbigpIHtcbiAgZnVuY3Rpb24gTXVsdGlEcmFnKHNvcnRhYmxlKSB7XG4gICAgLy8gQmluZCBhbGwgcHJpdmF0ZSBtZXRob2RzXG4gICAgZm9yICh2YXIgZm4gaW4gdGhpcykge1xuICAgICAgaWYgKGZuLmNoYXJBdCgwKSA9PT0gJ18nICYmIHR5cGVvZiB0aGlzW2ZuXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzW2ZuXSA9IHRoaXNbZm5dLmJpbmQodGhpcyk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghc29ydGFibGUub3B0aW9ucy5hdm9pZEltcGxpY2l0RGVzZWxlY3QpIHtcbiAgICAgIGlmIChzb3J0YWJsZS5vcHRpb25zLnN1cHBvcnRQb2ludGVyKSB7XG4gICAgICAgIG9uKGRvY3VtZW50LCAncG9pbnRlcnVwJywgdGhpcy5fZGVzZWxlY3RNdWx0aURyYWcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb24oZG9jdW1lbnQsICdtb3VzZXVwJywgdGhpcy5fZGVzZWxlY3RNdWx0aURyYWcpO1xuICAgICAgICBvbihkb2N1bWVudCwgJ3RvdWNoZW5kJywgdGhpcy5fZGVzZWxlY3RNdWx0aURyYWcpO1xuICAgICAgfVxuICAgIH1cbiAgICBvbihkb2N1bWVudCwgJ2tleWRvd24nLCB0aGlzLl9jaGVja0tleURvd24pO1xuICAgIG9uKGRvY3VtZW50LCAna2V5dXAnLCB0aGlzLl9jaGVja0tleVVwKTtcbiAgICB0aGlzLmRlZmF1bHRzID0ge1xuICAgICAgc2VsZWN0ZWRDbGFzczogJ3NvcnRhYmxlLXNlbGVjdGVkJyxcbiAgICAgIG11bHRpRHJhZ0tleTogbnVsbCxcbiAgICAgIGF2b2lkSW1wbGljaXREZXNlbGVjdDogZmFsc2UsXG4gICAgICBzZXREYXRhOiBmdW5jdGlvbiBzZXREYXRhKGRhdGFUcmFuc2ZlciwgZHJhZ0VsKSB7XG4gICAgICAgIHZhciBkYXRhID0gJyc7XG4gICAgICAgIGlmIChtdWx0aURyYWdFbGVtZW50cy5sZW5ndGggJiYgbXVsdGlEcmFnU29ydGFibGUgPT09IHNvcnRhYmxlKSB7XG4gICAgICAgICAgbXVsdGlEcmFnRWxlbWVudHMuZm9yRWFjaChmdW5jdGlvbiAobXVsdGlEcmFnRWxlbWVudCwgaSkge1xuICAgICAgICAgICAgZGF0YSArPSAoIWkgPyAnJyA6ICcsICcpICsgbXVsdGlEcmFnRWxlbWVudC50ZXh0Q29udGVudDtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkYXRhID0gZHJhZ0VsLnRleHRDb250ZW50O1xuICAgICAgICB9XG4gICAgICAgIGRhdGFUcmFuc2Zlci5zZXREYXRhKCdUZXh0JywgZGF0YSk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuICBNdWx0aURyYWcucHJvdG90eXBlID0ge1xuICAgIG11bHRpRHJhZ0tleURvd246IGZhbHNlLFxuICAgIGlzTXVsdGlEcmFnOiBmYWxzZSxcbiAgICBkZWxheVN0YXJ0R2xvYmFsOiBmdW5jdGlvbiBkZWxheVN0YXJ0R2xvYmFsKF9yZWYpIHtcbiAgICAgIHZhciBkcmFnZ2VkID0gX3JlZi5kcmFnRWw7XG4gICAgICBkcmFnRWwkMSA9IGRyYWdnZWQ7XG4gICAgfSxcbiAgICBkZWxheUVuZGVkOiBmdW5jdGlvbiBkZWxheUVuZGVkKCkge1xuICAgICAgdGhpcy5pc011bHRpRHJhZyA9IH5tdWx0aURyYWdFbGVtZW50cy5pbmRleE9mKGRyYWdFbCQxKTtcbiAgICB9LFxuICAgIHNldHVwQ2xvbmU6IGZ1bmN0aW9uIHNldHVwQ2xvbmUoX3JlZjIpIHtcbiAgICAgIHZhciBzb3J0YWJsZSA9IF9yZWYyLnNvcnRhYmxlLFxuICAgICAgICBjYW5jZWwgPSBfcmVmMi5jYW5jZWw7XG4gICAgICBpZiAoIXRoaXMuaXNNdWx0aURyYWcpIHJldHVybjtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbXVsdGlEcmFnRWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbXVsdGlEcmFnQ2xvbmVzLnB1c2goY2xvbmUobXVsdGlEcmFnRWxlbWVudHNbaV0pKTtcbiAgICAgICAgbXVsdGlEcmFnQ2xvbmVzW2ldLnNvcnRhYmxlSW5kZXggPSBtdWx0aURyYWdFbGVtZW50c1tpXS5zb3J0YWJsZUluZGV4O1xuICAgICAgICBtdWx0aURyYWdDbG9uZXNbaV0uZHJhZ2dhYmxlID0gZmFsc2U7XG4gICAgICAgIG11bHRpRHJhZ0Nsb25lc1tpXS5zdHlsZVsnd2lsbC1jaGFuZ2UnXSA9ICcnO1xuICAgICAgICB0b2dnbGVDbGFzcyhtdWx0aURyYWdDbG9uZXNbaV0sIHRoaXMub3B0aW9ucy5zZWxlY3RlZENsYXNzLCBmYWxzZSk7XG4gICAgICAgIG11bHRpRHJhZ0VsZW1lbnRzW2ldID09PSBkcmFnRWwkMSAmJiB0b2dnbGVDbGFzcyhtdWx0aURyYWdDbG9uZXNbaV0sIHRoaXMub3B0aW9ucy5jaG9zZW5DbGFzcywgZmFsc2UpO1xuICAgICAgfVxuICAgICAgc29ydGFibGUuX2hpZGVDbG9uZSgpO1xuICAgICAgY2FuY2VsKCk7XG4gICAgfSxcbiAgICBjbG9uZTogZnVuY3Rpb24gY2xvbmUoX3JlZjMpIHtcbiAgICAgIHZhciBzb3J0YWJsZSA9IF9yZWYzLnNvcnRhYmxlLFxuICAgICAgICByb290RWwgPSBfcmVmMy5yb290RWwsXG4gICAgICAgIGRpc3BhdGNoU29ydGFibGVFdmVudCA9IF9yZWYzLmRpc3BhdGNoU29ydGFibGVFdmVudCxcbiAgICAgICAgY2FuY2VsID0gX3JlZjMuY2FuY2VsO1xuICAgICAgaWYgKCF0aGlzLmlzTXVsdGlEcmFnKSByZXR1cm47XG4gICAgICBpZiAoIXRoaXMub3B0aW9ucy5yZW1vdmVDbG9uZU9uSGlkZSkge1xuICAgICAgICBpZiAobXVsdGlEcmFnRWxlbWVudHMubGVuZ3RoICYmIG11bHRpRHJhZ1NvcnRhYmxlID09PSBzb3J0YWJsZSkge1xuICAgICAgICAgIGluc2VydE11bHRpRHJhZ0Nsb25lcyh0cnVlLCByb290RWwpO1xuICAgICAgICAgIGRpc3BhdGNoU29ydGFibGVFdmVudCgnY2xvbmUnKTtcbiAgICAgICAgICBjYW5jZWwoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgc2hvd0Nsb25lOiBmdW5jdGlvbiBzaG93Q2xvbmUoX3JlZjQpIHtcbiAgICAgIHZhciBjbG9uZU5vd1Nob3duID0gX3JlZjQuY2xvbmVOb3dTaG93bixcbiAgICAgICAgcm9vdEVsID0gX3JlZjQucm9vdEVsLFxuICAgICAgICBjYW5jZWwgPSBfcmVmNC5jYW5jZWw7XG4gICAgICBpZiAoIXRoaXMuaXNNdWx0aURyYWcpIHJldHVybjtcbiAgICAgIGluc2VydE11bHRpRHJhZ0Nsb25lcyhmYWxzZSwgcm9vdEVsKTtcbiAgICAgIG11bHRpRHJhZ0Nsb25lcy5mb3JFYWNoKGZ1bmN0aW9uIChjbG9uZSkge1xuICAgICAgICBjc3MoY2xvbmUsICdkaXNwbGF5JywgJycpO1xuICAgICAgfSk7XG4gICAgICBjbG9uZU5vd1Nob3duKCk7XG4gICAgICBjbG9uZXNIaWRkZW4gPSBmYWxzZTtcbiAgICAgIGNhbmNlbCgpO1xuICAgIH0sXG4gICAgaGlkZUNsb25lOiBmdW5jdGlvbiBoaWRlQ2xvbmUoX3JlZjUpIHtcbiAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICB2YXIgc29ydGFibGUgPSBfcmVmNS5zb3J0YWJsZSxcbiAgICAgICAgY2xvbmVOb3dIaWRkZW4gPSBfcmVmNS5jbG9uZU5vd0hpZGRlbixcbiAgICAgICAgY2FuY2VsID0gX3JlZjUuY2FuY2VsO1xuICAgICAgaWYgKCF0aGlzLmlzTXVsdGlEcmFnKSByZXR1cm47XG4gICAgICBtdWx0aURyYWdDbG9uZXMuZm9yRWFjaChmdW5jdGlvbiAoY2xvbmUpIHtcbiAgICAgICAgY3NzKGNsb25lLCAnZGlzcGxheScsICdub25lJyk7XG4gICAgICAgIGlmIChfdGhpcy5vcHRpb25zLnJlbW92ZUNsb25lT25IaWRlICYmIGNsb25lLnBhcmVudE5vZGUpIHtcbiAgICAgICAgICBjbG9uZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGNsb25lKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBjbG9uZU5vd0hpZGRlbigpO1xuICAgICAgY2xvbmVzSGlkZGVuID0gdHJ1ZTtcbiAgICAgIGNhbmNlbCgpO1xuICAgIH0sXG4gICAgZHJhZ1N0YXJ0R2xvYmFsOiBmdW5jdGlvbiBkcmFnU3RhcnRHbG9iYWwoX3JlZjYpIHtcbiAgICAgIHZhciBzb3J0YWJsZSA9IF9yZWY2LnNvcnRhYmxlO1xuICAgICAgaWYgKCF0aGlzLmlzTXVsdGlEcmFnICYmIG11bHRpRHJhZ1NvcnRhYmxlKSB7XG4gICAgICAgIG11bHRpRHJhZ1NvcnRhYmxlLm11bHRpRHJhZy5fZGVzZWxlY3RNdWx0aURyYWcoKTtcbiAgICAgIH1cbiAgICAgIG11bHRpRHJhZ0VsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24gKG11bHRpRHJhZ0VsZW1lbnQpIHtcbiAgICAgICAgbXVsdGlEcmFnRWxlbWVudC5zb3J0YWJsZUluZGV4ID0gaW5kZXgobXVsdGlEcmFnRWxlbWVudCk7XG4gICAgICB9KTtcblxuICAgICAgLy8gU29ydCBtdWx0aS1kcmFnIGVsZW1lbnRzXG4gICAgICBtdWx0aURyYWdFbGVtZW50cyA9IG11bHRpRHJhZ0VsZW1lbnRzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIGEuc29ydGFibGVJbmRleCAtIGIuc29ydGFibGVJbmRleDtcbiAgICAgIH0pO1xuICAgICAgZHJhZ1N0YXJ0ZWQgPSB0cnVlO1xuICAgIH0sXG4gICAgZHJhZ1N0YXJ0ZWQ6IGZ1bmN0aW9uIGRyYWdTdGFydGVkKF9yZWY3KSB7XG4gICAgICB2YXIgX3RoaXMyID0gdGhpcztcbiAgICAgIHZhciBzb3J0YWJsZSA9IF9yZWY3LnNvcnRhYmxlO1xuICAgICAgaWYgKCF0aGlzLmlzTXVsdGlEcmFnKSByZXR1cm47XG4gICAgICBpZiAodGhpcy5vcHRpb25zLnNvcnQpIHtcbiAgICAgICAgLy8gQ2FwdHVyZSByZWN0cyxcbiAgICAgICAgLy8gaGlkZSBtdWx0aSBkcmFnIGVsZW1lbnRzIChieSBwb3NpdGlvbmluZyB0aGVtIGFic29sdXRlKSxcbiAgICAgICAgLy8gc2V0IG11bHRpIGRyYWcgZWxlbWVudHMgcmVjdHMgdG8gZHJhZ1JlY3QsXG4gICAgICAgIC8vIHNob3cgbXVsdGkgZHJhZyBlbGVtZW50cyxcbiAgICAgICAgLy8gYW5pbWF0ZSB0byByZWN0cyxcbiAgICAgICAgLy8gdW5zZXQgcmVjdHMgJiByZW1vdmUgZnJvbSBET01cblxuICAgICAgICBzb3J0YWJsZS5jYXB0dXJlQW5pbWF0aW9uU3RhdGUoKTtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5hbmltYXRpb24pIHtcbiAgICAgICAgICBtdWx0aURyYWdFbGVtZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChtdWx0aURyYWdFbGVtZW50KSB7XG4gICAgICAgICAgICBpZiAobXVsdGlEcmFnRWxlbWVudCA9PT0gZHJhZ0VsJDEpIHJldHVybjtcbiAgICAgICAgICAgIGNzcyhtdWx0aURyYWdFbGVtZW50LCAncG9zaXRpb24nLCAnYWJzb2x1dGUnKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICB2YXIgZHJhZ1JlY3QgPSBnZXRSZWN0KGRyYWdFbCQxLCBmYWxzZSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgICAgICAgbXVsdGlEcmFnRWxlbWVudHMuZm9yRWFjaChmdW5jdGlvbiAobXVsdGlEcmFnRWxlbWVudCkge1xuICAgICAgICAgICAgaWYgKG11bHRpRHJhZ0VsZW1lbnQgPT09IGRyYWdFbCQxKSByZXR1cm47XG4gICAgICAgICAgICBzZXRSZWN0KG11bHRpRHJhZ0VsZW1lbnQsIGRyYWdSZWN0KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBmb2xkaW5nID0gdHJ1ZTtcbiAgICAgICAgICBpbml0aWFsRm9sZGluZyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHNvcnRhYmxlLmFuaW1hdGVBbGwoZnVuY3Rpb24gKCkge1xuICAgICAgICBmb2xkaW5nID0gZmFsc2U7XG4gICAgICAgIGluaXRpYWxGb2xkaW5nID0gZmFsc2U7XG4gICAgICAgIGlmIChfdGhpczIub3B0aW9ucy5hbmltYXRpb24pIHtcbiAgICAgICAgICBtdWx0aURyYWdFbGVtZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChtdWx0aURyYWdFbGVtZW50KSB7XG4gICAgICAgICAgICB1bnNldFJlY3QobXVsdGlEcmFnRWxlbWVudCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZW1vdmUgYWxsIGF1eGlsaWFyeSBtdWx0aWRyYWcgaXRlbXMgZnJvbSBlbCwgaWYgc29ydGluZyBlbmFibGVkXG4gICAgICAgIGlmIChfdGhpczIub3B0aW9ucy5zb3J0KSB7XG4gICAgICAgICAgcmVtb3ZlTXVsdGlEcmFnRWxlbWVudHMoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSxcbiAgICBkcmFnT3ZlcjogZnVuY3Rpb24gZHJhZ092ZXIoX3JlZjgpIHtcbiAgICAgIHZhciB0YXJnZXQgPSBfcmVmOC50YXJnZXQsXG4gICAgICAgIGNvbXBsZXRlZCA9IF9yZWY4LmNvbXBsZXRlZCxcbiAgICAgICAgY2FuY2VsID0gX3JlZjguY2FuY2VsO1xuICAgICAgaWYgKGZvbGRpbmcgJiYgfm11bHRpRHJhZ0VsZW1lbnRzLmluZGV4T2YodGFyZ2V0KSkge1xuICAgICAgICBjb21wbGV0ZWQoZmFsc2UpO1xuICAgICAgICBjYW5jZWwoKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIHJldmVydDogZnVuY3Rpb24gcmV2ZXJ0KF9yZWY5KSB7XG4gICAgICB2YXIgZnJvbVNvcnRhYmxlID0gX3JlZjkuZnJvbVNvcnRhYmxlLFxuICAgICAgICByb290RWwgPSBfcmVmOS5yb290RWwsXG4gICAgICAgIHNvcnRhYmxlID0gX3JlZjkuc29ydGFibGUsXG4gICAgICAgIGRyYWdSZWN0ID0gX3JlZjkuZHJhZ1JlY3Q7XG4gICAgICBpZiAobXVsdGlEcmFnRWxlbWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICAvLyBTZXR1cCB1bmZvbGQgYW5pbWF0aW9uXG4gICAgICAgIG11bHRpRHJhZ0VsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24gKG11bHRpRHJhZ0VsZW1lbnQpIHtcbiAgICAgICAgICBzb3J0YWJsZS5hZGRBbmltYXRpb25TdGF0ZSh7XG4gICAgICAgICAgICB0YXJnZXQ6IG11bHRpRHJhZ0VsZW1lbnQsXG4gICAgICAgICAgICByZWN0OiBmb2xkaW5nID8gZ2V0UmVjdChtdWx0aURyYWdFbGVtZW50KSA6IGRyYWdSZWN0XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgdW5zZXRSZWN0KG11bHRpRHJhZ0VsZW1lbnQpO1xuICAgICAgICAgIG11bHRpRHJhZ0VsZW1lbnQuZnJvbVJlY3QgPSBkcmFnUmVjdDtcbiAgICAgICAgICBmcm9tU29ydGFibGUucmVtb3ZlQW5pbWF0aW9uU3RhdGUobXVsdGlEcmFnRWxlbWVudCk7XG4gICAgICAgIH0pO1xuICAgICAgICBmb2xkaW5nID0gZmFsc2U7XG4gICAgICAgIGluc2VydE11bHRpRHJhZ0VsZW1lbnRzKCF0aGlzLm9wdGlvbnMucmVtb3ZlQ2xvbmVPbkhpZGUsIHJvb3RFbCk7XG4gICAgICB9XG4gICAgfSxcbiAgICBkcmFnT3ZlckNvbXBsZXRlZDogZnVuY3Rpb24gZHJhZ092ZXJDb21wbGV0ZWQoX3JlZjEwKSB7XG4gICAgICB2YXIgc29ydGFibGUgPSBfcmVmMTAuc29ydGFibGUsXG4gICAgICAgIGlzT3duZXIgPSBfcmVmMTAuaXNPd25lcixcbiAgICAgICAgaW5zZXJ0aW9uID0gX3JlZjEwLmluc2VydGlvbixcbiAgICAgICAgYWN0aXZlU29ydGFibGUgPSBfcmVmMTAuYWN0aXZlU29ydGFibGUsXG4gICAgICAgIHBhcmVudEVsID0gX3JlZjEwLnBhcmVudEVsLFxuICAgICAgICBwdXRTb3J0YWJsZSA9IF9yZWYxMC5wdXRTb3J0YWJsZTtcbiAgICAgIHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuICAgICAgaWYgKGluc2VydGlvbikge1xuICAgICAgICAvLyBDbG9uZXMgbXVzdCBiZSBoaWRkZW4gYmVmb3JlIGZvbGRpbmcgYW5pbWF0aW9uIHRvIGNhcHR1cmUgZHJhZ1JlY3RBYnNvbHV0ZSBwcm9wZXJseVxuICAgICAgICBpZiAoaXNPd25lcikge1xuICAgICAgICAgIGFjdGl2ZVNvcnRhYmxlLl9oaWRlQ2xvbmUoKTtcbiAgICAgICAgfVxuICAgICAgICBpbml0aWFsRm9sZGluZyA9IGZhbHNlO1xuICAgICAgICAvLyBJZiBsZWF2aW5nIHNvcnQ6ZmFsc2Ugcm9vdCwgb3IgYWxyZWFkeSBmb2xkaW5nIC0gRm9sZCB0byBuZXcgbG9jYXRpb25cbiAgICAgICAgaWYgKG9wdGlvbnMuYW5pbWF0aW9uICYmIG11bHRpRHJhZ0VsZW1lbnRzLmxlbmd0aCA+IDEgJiYgKGZvbGRpbmcgfHwgIWlzT3duZXIgJiYgIWFjdGl2ZVNvcnRhYmxlLm9wdGlvbnMuc29ydCAmJiAhcHV0U29ydGFibGUpKSB7XG4gICAgICAgICAgLy8gRm9sZDogU2V0IGFsbCBtdWx0aSBkcmFnIGVsZW1lbnRzJ3MgcmVjdHMgdG8gZHJhZ0VsJ3MgcmVjdCB3aGVuIG11bHRpLWRyYWcgZWxlbWVudHMgYXJlIGludmlzaWJsZVxuICAgICAgICAgIHZhciBkcmFnUmVjdEFic29sdXRlID0gZ2V0UmVjdChkcmFnRWwkMSwgZmFsc2UsIHRydWUsIHRydWUpO1xuICAgICAgICAgIG11bHRpRHJhZ0VsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24gKG11bHRpRHJhZ0VsZW1lbnQpIHtcbiAgICAgICAgICAgIGlmIChtdWx0aURyYWdFbGVtZW50ID09PSBkcmFnRWwkMSkgcmV0dXJuO1xuICAgICAgICAgICAgc2V0UmVjdChtdWx0aURyYWdFbGVtZW50LCBkcmFnUmVjdEFic29sdXRlKTtcblxuICAgICAgICAgICAgLy8gTW92ZSBlbGVtZW50KHMpIHRvIGVuZCBvZiBwYXJlbnRFbCBzbyB0aGF0IGl0IGRvZXMgbm90IGludGVyZmVyZSB3aXRoIG11bHRpLWRyYWcgY2xvbmVzIGluc2VydGlvbiBpZiB0aGV5IGFyZSBpbnNlcnRlZFxuICAgICAgICAgICAgLy8gd2hpbGUgZm9sZGluZywgYW5kIHNvIHRoYXQgd2UgY2FuIGNhcHR1cmUgdGhlbSBhZ2FpbiBiZWNhdXNlIG9sZCBzb3J0YWJsZSB3aWxsIG5vIGxvbmdlciBiZSBmcm9tU29ydGFibGVcbiAgICAgICAgICAgIHBhcmVudEVsLmFwcGVuZENoaWxkKG11bHRpRHJhZ0VsZW1lbnQpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGZvbGRpbmcgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2xvbmVzIG11c3QgYmUgc2hvd24gKGFuZCBjaGVjayB0byByZW1vdmUgbXVsdGkgZHJhZ3MpIGFmdGVyIGZvbGRpbmcgd2hlbiBpbnRlcmZlcmluZyBtdWx0aURyYWdFbGVtZW50cyBhcmUgbW92ZWQgb3V0XG4gICAgICAgIGlmICghaXNPd25lcikge1xuICAgICAgICAgIC8vIE9ubHkgcmVtb3ZlIGlmIG5vdCBmb2xkaW5nIChmb2xkaW5nIHdpbGwgcmVtb3ZlIHRoZW0gYW55d2F5cylcbiAgICAgICAgICBpZiAoIWZvbGRpbmcpIHtcbiAgICAgICAgICAgIHJlbW92ZU11bHRpRHJhZ0VsZW1lbnRzKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChtdWx0aURyYWdFbGVtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICB2YXIgY2xvbmVzSGlkZGVuQmVmb3JlID0gY2xvbmVzSGlkZGVuO1xuICAgICAgICAgICAgYWN0aXZlU29ydGFibGUuX3Nob3dDbG9uZShzb3J0YWJsZSk7XG5cbiAgICAgICAgICAgIC8vIFVuZm9sZCBhbmltYXRpb24gZm9yIGNsb25lcyBpZiBzaG93aW5nIGZyb20gaGlkZGVuXG4gICAgICAgICAgICBpZiAoYWN0aXZlU29ydGFibGUub3B0aW9ucy5hbmltYXRpb24gJiYgIWNsb25lc0hpZGRlbiAmJiBjbG9uZXNIaWRkZW5CZWZvcmUpIHtcbiAgICAgICAgICAgICAgbXVsdGlEcmFnQ2xvbmVzLmZvckVhY2goZnVuY3Rpb24gKGNsb25lKSB7XG4gICAgICAgICAgICAgICAgYWN0aXZlU29ydGFibGUuYWRkQW5pbWF0aW9uU3RhdGUoe1xuICAgICAgICAgICAgICAgICAgdGFyZ2V0OiBjbG9uZSxcbiAgICAgICAgICAgICAgICAgIHJlY3Q6IGNsb25lc0Zyb21SZWN0XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY2xvbmUuZnJvbVJlY3QgPSBjbG9uZXNGcm9tUmVjdDtcbiAgICAgICAgICAgICAgICBjbG9uZS50aGlzQW5pbWF0aW9uRHVyYXRpb24gPSBudWxsO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWN0aXZlU29ydGFibGUuX3Nob3dDbG9uZShzb3J0YWJsZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBkcmFnT3ZlckFuaW1hdGlvbkNhcHR1cmU6IGZ1bmN0aW9uIGRyYWdPdmVyQW5pbWF0aW9uQ2FwdHVyZShfcmVmMTEpIHtcbiAgICAgIHZhciBkcmFnUmVjdCA9IF9yZWYxMS5kcmFnUmVjdCxcbiAgICAgICAgaXNPd25lciA9IF9yZWYxMS5pc093bmVyLFxuICAgICAgICBhY3RpdmVTb3J0YWJsZSA9IF9yZWYxMS5hY3RpdmVTb3J0YWJsZTtcbiAgICAgIG11bHRpRHJhZ0VsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24gKG11bHRpRHJhZ0VsZW1lbnQpIHtcbiAgICAgICAgbXVsdGlEcmFnRWxlbWVudC50aGlzQW5pbWF0aW9uRHVyYXRpb24gPSBudWxsO1xuICAgICAgfSk7XG4gICAgICBpZiAoYWN0aXZlU29ydGFibGUub3B0aW9ucy5hbmltYXRpb24gJiYgIWlzT3duZXIgJiYgYWN0aXZlU29ydGFibGUubXVsdGlEcmFnLmlzTXVsdGlEcmFnKSB7XG4gICAgICAgIGNsb25lc0Zyb21SZWN0ID0gX2V4dGVuZHMoe30sIGRyYWdSZWN0KTtcbiAgICAgICAgdmFyIGRyYWdNYXRyaXggPSBtYXRyaXgoZHJhZ0VsJDEsIHRydWUpO1xuICAgICAgICBjbG9uZXNGcm9tUmVjdC50b3AgLT0gZHJhZ01hdHJpeC5mO1xuICAgICAgICBjbG9uZXNGcm9tUmVjdC5sZWZ0IC09IGRyYWdNYXRyaXguZTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGRyYWdPdmVyQW5pbWF0aW9uQ29tcGxldGU6IGZ1bmN0aW9uIGRyYWdPdmVyQW5pbWF0aW9uQ29tcGxldGUoKSB7XG4gICAgICBpZiAoZm9sZGluZykge1xuICAgICAgICBmb2xkaW5nID0gZmFsc2U7XG4gICAgICAgIHJlbW92ZU11bHRpRHJhZ0VsZW1lbnRzKCk7XG4gICAgICB9XG4gICAgfSxcbiAgICBkcm9wOiBmdW5jdGlvbiBkcm9wKF9yZWYxMikge1xuICAgICAgdmFyIGV2dCA9IF9yZWYxMi5vcmlnaW5hbEV2ZW50LFxuICAgICAgICByb290RWwgPSBfcmVmMTIucm9vdEVsLFxuICAgICAgICBwYXJlbnRFbCA9IF9yZWYxMi5wYXJlbnRFbCxcbiAgICAgICAgc29ydGFibGUgPSBfcmVmMTIuc29ydGFibGUsXG4gICAgICAgIGRpc3BhdGNoU29ydGFibGVFdmVudCA9IF9yZWYxMi5kaXNwYXRjaFNvcnRhYmxlRXZlbnQsXG4gICAgICAgIG9sZEluZGV4ID0gX3JlZjEyLm9sZEluZGV4LFxuICAgICAgICBwdXRTb3J0YWJsZSA9IF9yZWYxMi5wdXRTb3J0YWJsZTtcbiAgICAgIHZhciB0b1NvcnRhYmxlID0gcHV0U29ydGFibGUgfHwgdGhpcy5zb3J0YWJsZTtcbiAgICAgIGlmICghZXZ0KSByZXR1cm47XG4gICAgICB2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucyxcbiAgICAgICAgY2hpbGRyZW4gPSBwYXJlbnRFbC5jaGlsZHJlbjtcblxuICAgICAgLy8gTXVsdGktZHJhZyBzZWxlY3Rpb25cbiAgICAgIGlmICghZHJhZ1N0YXJ0ZWQpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMubXVsdGlEcmFnS2V5ICYmICF0aGlzLm11bHRpRHJhZ0tleURvd24pIHtcbiAgICAgICAgICB0aGlzLl9kZXNlbGVjdE11bHRpRHJhZygpO1xuICAgICAgICB9XG4gICAgICAgIHRvZ2dsZUNsYXNzKGRyYWdFbCQxLCBvcHRpb25zLnNlbGVjdGVkQ2xhc3MsICF+bXVsdGlEcmFnRWxlbWVudHMuaW5kZXhPZihkcmFnRWwkMSkpO1xuICAgICAgICBpZiAoIX5tdWx0aURyYWdFbGVtZW50cy5pbmRleE9mKGRyYWdFbCQxKSkge1xuICAgICAgICAgIG11bHRpRHJhZ0VsZW1lbnRzLnB1c2goZHJhZ0VsJDEpO1xuICAgICAgICAgIGRpc3BhdGNoRXZlbnQoe1xuICAgICAgICAgICAgc29ydGFibGU6IHNvcnRhYmxlLFxuICAgICAgICAgICAgcm9vdEVsOiByb290RWwsXG4gICAgICAgICAgICBuYW1lOiAnc2VsZWN0JyxcbiAgICAgICAgICAgIHRhcmdldEVsOiBkcmFnRWwkMSxcbiAgICAgICAgICAgIG9yaWdpbmFsRXZlbnQ6IGV2dFxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgLy8gTW9kaWZpZXIgYWN0aXZhdGVkLCBzZWxlY3QgZnJvbSBsYXN0IHRvIGRyYWdFbFxuICAgICAgICAgIGlmIChldnQuc2hpZnRLZXkgJiYgbGFzdE11bHRpRHJhZ1NlbGVjdCAmJiBzb3J0YWJsZS5lbC5jb250YWlucyhsYXN0TXVsdGlEcmFnU2VsZWN0KSkge1xuICAgICAgICAgICAgdmFyIGxhc3RJbmRleCA9IGluZGV4KGxhc3RNdWx0aURyYWdTZWxlY3QpLFxuICAgICAgICAgICAgICBjdXJyZW50SW5kZXggPSBpbmRleChkcmFnRWwkMSk7XG4gICAgICAgICAgICBpZiAofmxhc3RJbmRleCAmJiB+Y3VycmVudEluZGV4ICYmIGxhc3RJbmRleCAhPT0gY3VycmVudEluZGV4KSB7XG4gICAgICAgICAgICAgIChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLy8gTXVzdCBpbmNsdWRlIGxhc3RNdWx0aURyYWdTZWxlY3QgKHNlbGVjdCBpdCksIGluIGNhc2UgbW9kaWZpZWQgc2VsZWN0aW9uIGZyb20gbm8gc2VsZWN0aW9uXG4gICAgICAgICAgICAgICAgLy8gKGJ1dCBwcmV2aW91cyBzZWxlY3Rpb24gZXhpc3RlZClcbiAgICAgICAgICAgICAgICB2YXIgbiwgaTtcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudEluZGV4ID4gbGFzdEluZGV4KSB7XG4gICAgICAgICAgICAgICAgICBpID0gbGFzdEluZGV4O1xuICAgICAgICAgICAgICAgICAgbiA9IGN1cnJlbnRJbmRleDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgaSA9IGN1cnJlbnRJbmRleDtcbiAgICAgICAgICAgICAgICAgIG4gPSBsYXN0SW5kZXggKyAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgZmlsdGVyID0gb3B0aW9ucy5maWx0ZXI7XG4gICAgICAgICAgICAgICAgZm9yICg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgIGlmICh+bXVsdGlEcmFnRWxlbWVudHMuaW5kZXhPZihjaGlsZHJlbltpXSkpIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgaWYgZWxlbWVudCBpcyBkcmFnZ2FibGVcbiAgICAgICAgICAgICAgICAgIGlmICghY2xvc2VzdChjaGlsZHJlbltpXSwgb3B0aW9ucy5kcmFnZ2FibGUsIHBhcmVudEVsLCBmYWxzZSkpIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgaWYgZWxlbWVudCBpcyBmaWx0ZXJlZFxuICAgICAgICAgICAgICAgICAgdmFyIGZpbHRlcmVkID0gZmlsdGVyICYmICh0eXBlb2YgZmlsdGVyID09PSAnZnVuY3Rpb24nID8gZmlsdGVyLmNhbGwoc29ydGFibGUsIGV2dCwgY2hpbGRyZW5baV0sIHNvcnRhYmxlKSA6IGZpbHRlci5zcGxpdCgnLCcpLnNvbWUoZnVuY3Rpb24gKGNyaXRlcmlhKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjbG9zZXN0KGNoaWxkcmVuW2ldLCBjcml0ZXJpYS50cmltKCksIHBhcmVudEVsLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgICBpZiAoZmlsdGVyZWQpIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgdG9nZ2xlQ2xhc3MoY2hpbGRyZW5baV0sIG9wdGlvbnMuc2VsZWN0ZWRDbGFzcywgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICBtdWx0aURyYWdFbGVtZW50cy5wdXNoKGNoaWxkcmVuW2ldKTtcbiAgICAgICAgICAgICAgICAgIGRpc3BhdGNoRXZlbnQoe1xuICAgICAgICAgICAgICAgICAgICBzb3J0YWJsZTogc29ydGFibGUsXG4gICAgICAgICAgICAgICAgICAgIHJvb3RFbDogcm9vdEVsLFxuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnc2VsZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0RWw6IGNoaWxkcmVuW2ldLFxuICAgICAgICAgICAgICAgICAgICBvcmlnaW5hbEV2ZW50OiBldnRcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSkoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGFzdE11bHRpRHJhZ1NlbGVjdCA9IGRyYWdFbCQxO1xuICAgICAgICAgIH1cbiAgICAgICAgICBtdWx0aURyYWdTb3J0YWJsZSA9IHRvU29ydGFibGU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbXVsdGlEcmFnRWxlbWVudHMuc3BsaWNlKG11bHRpRHJhZ0VsZW1lbnRzLmluZGV4T2YoZHJhZ0VsJDEpLCAxKTtcbiAgICAgICAgICBsYXN0TXVsdGlEcmFnU2VsZWN0ID0gbnVsbDtcbiAgICAgICAgICBkaXNwYXRjaEV2ZW50KHtcbiAgICAgICAgICAgIHNvcnRhYmxlOiBzb3J0YWJsZSxcbiAgICAgICAgICAgIHJvb3RFbDogcm9vdEVsLFxuICAgICAgICAgICAgbmFtZTogJ2Rlc2VsZWN0JyxcbiAgICAgICAgICAgIHRhcmdldEVsOiBkcmFnRWwkMSxcbiAgICAgICAgICAgIG9yaWdpbmFsRXZlbnQ6IGV2dFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIE11bHRpLWRyYWcgZHJvcFxuICAgICAgaWYgKGRyYWdTdGFydGVkICYmIHRoaXMuaXNNdWx0aURyYWcpIHtcbiAgICAgICAgZm9sZGluZyA9IGZhbHNlO1xuICAgICAgICAvLyBEbyBub3QgXCJ1bmZvbGRcIiBhZnRlciBhcm91bmQgZHJhZ0VsIGlmIHJldmVydGVkXG4gICAgICAgIGlmICgocGFyZW50RWxbZXhwYW5kb10ub3B0aW9ucy5zb3J0IHx8IHBhcmVudEVsICE9PSByb290RWwpICYmIG11bHRpRHJhZ0VsZW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICB2YXIgZHJhZ1JlY3QgPSBnZXRSZWN0KGRyYWdFbCQxKSxcbiAgICAgICAgICAgIG11bHRpRHJhZ0luZGV4ID0gaW5kZXgoZHJhZ0VsJDEsICc6bm90KC4nICsgdGhpcy5vcHRpb25zLnNlbGVjdGVkQ2xhc3MgKyAnKScpO1xuICAgICAgICAgIGlmICghaW5pdGlhbEZvbGRpbmcgJiYgb3B0aW9ucy5hbmltYXRpb24pIGRyYWdFbCQxLnRoaXNBbmltYXRpb25EdXJhdGlvbiA9IG51bGw7XG4gICAgICAgICAgdG9Tb3J0YWJsZS5jYXB0dXJlQW5pbWF0aW9uU3RhdGUoKTtcbiAgICAgICAgICBpZiAoIWluaXRpYWxGb2xkaW5nKSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5hbmltYXRpb24pIHtcbiAgICAgICAgICAgICAgZHJhZ0VsJDEuZnJvbVJlY3QgPSBkcmFnUmVjdDtcbiAgICAgICAgICAgICAgbXVsdGlEcmFnRWxlbWVudHMuZm9yRWFjaChmdW5jdGlvbiAobXVsdGlEcmFnRWxlbWVudCkge1xuICAgICAgICAgICAgICAgIG11bHRpRHJhZ0VsZW1lbnQudGhpc0FuaW1hdGlvbkR1cmF0aW9uID0gbnVsbDtcbiAgICAgICAgICAgICAgICBpZiAobXVsdGlEcmFnRWxlbWVudCAhPT0gZHJhZ0VsJDEpIHtcbiAgICAgICAgICAgICAgICAgIHZhciByZWN0ID0gZm9sZGluZyA/IGdldFJlY3QobXVsdGlEcmFnRWxlbWVudCkgOiBkcmFnUmVjdDtcbiAgICAgICAgICAgICAgICAgIG11bHRpRHJhZ0VsZW1lbnQuZnJvbVJlY3QgPSByZWN0O1xuXG4gICAgICAgICAgICAgICAgICAvLyBQcmVwYXJlIHVuZm9sZCBhbmltYXRpb25cbiAgICAgICAgICAgICAgICAgIHRvU29ydGFibGUuYWRkQW5pbWF0aW9uU3RhdGUoe1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXQ6IG11bHRpRHJhZ0VsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgIHJlY3Q6IHJlY3RcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE11bHRpIGRyYWcgZWxlbWVudHMgYXJlIG5vdCBuZWNlc3NhcmlseSByZW1vdmVkIGZyb20gdGhlIERPTSBvbiBkcm9wLCBzbyB0byByZWluc2VydFxuICAgICAgICAgICAgLy8gcHJvcGVybHkgdGhleSBtdXN0IGFsbCBiZSByZW1vdmVkXG4gICAgICAgICAgICByZW1vdmVNdWx0aURyYWdFbGVtZW50cygpO1xuICAgICAgICAgICAgbXVsdGlEcmFnRWxlbWVudHMuZm9yRWFjaChmdW5jdGlvbiAobXVsdGlEcmFnRWxlbWVudCkge1xuICAgICAgICAgICAgICBpZiAoY2hpbGRyZW5bbXVsdGlEcmFnSW5kZXhdKSB7XG4gICAgICAgICAgICAgICAgcGFyZW50RWwuaW5zZXJ0QmVmb3JlKG11bHRpRHJhZ0VsZW1lbnQsIGNoaWxkcmVuW211bHRpRHJhZ0luZGV4XSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcGFyZW50RWwuYXBwZW5kQ2hpbGQobXVsdGlEcmFnRWxlbWVudCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgbXVsdGlEcmFnSW5kZXgrKztcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBJZiBpbml0aWFsIGZvbGRpbmcgaXMgZG9uZSwgdGhlIGVsZW1lbnRzIG1heSBoYXZlIGNoYW5nZWQgcG9zaXRpb24gYmVjYXVzZSB0aGV5IGFyZSBub3dcbiAgICAgICAgICAgIC8vIHVuZm9sZGluZyBhcm91bmQgZHJhZ0VsLCBldmVuIHRob3VnaCBkcmFnRWwgbWF5IG5vdCBoYXZlIGhpcyBpbmRleCBjaGFuZ2VkLCBzbyB1cGRhdGUgZXZlbnRcbiAgICAgICAgICAgIC8vIG11c3QgYmUgZmlyZWQgaGVyZSBhcyBTb3J0YWJsZSB3aWxsIG5vdC5cbiAgICAgICAgICAgIGlmIChvbGRJbmRleCA9PT0gaW5kZXgoZHJhZ0VsJDEpKSB7XG4gICAgICAgICAgICAgIHZhciB1cGRhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgbXVsdGlEcmFnRWxlbWVudHMuZm9yRWFjaChmdW5jdGlvbiAobXVsdGlEcmFnRWxlbWVudCkge1xuICAgICAgICAgICAgICAgIGlmIChtdWx0aURyYWdFbGVtZW50LnNvcnRhYmxlSW5kZXggIT09IGluZGV4KG11bHRpRHJhZ0VsZW1lbnQpKSB7XG4gICAgICAgICAgICAgICAgICB1cGRhdGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIGlmICh1cGRhdGUpIHtcbiAgICAgICAgICAgICAgICBkaXNwYXRjaFNvcnRhYmxlRXZlbnQoJ3VwZGF0ZScpO1xuICAgICAgICAgICAgICAgIGRpc3BhdGNoU29ydGFibGVFdmVudCgnc29ydCcpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gTXVzdCBiZSBkb25lIGFmdGVyIGNhcHR1cmluZyBpbmRpdmlkdWFsIHJlY3RzIChzY3JvbGwgYmFyKVxuICAgICAgICAgIG11bHRpRHJhZ0VsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24gKG11bHRpRHJhZ0VsZW1lbnQpIHtcbiAgICAgICAgICAgIHVuc2V0UmVjdChtdWx0aURyYWdFbGVtZW50KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICB0b1NvcnRhYmxlLmFuaW1hdGVBbGwoKTtcbiAgICAgICAgfVxuICAgICAgICBtdWx0aURyYWdTb3J0YWJsZSA9IHRvU29ydGFibGU7XG4gICAgICB9XG5cbiAgICAgIC8vIFJlbW92ZSBjbG9uZXMgaWYgbmVjZXNzYXJ5XG4gICAgICBpZiAocm9vdEVsID09PSBwYXJlbnRFbCB8fCBwdXRTb3J0YWJsZSAmJiBwdXRTb3J0YWJsZS5sYXN0UHV0TW9kZSAhPT0gJ2Nsb25lJykge1xuICAgICAgICBtdWx0aURyYWdDbG9uZXMuZm9yRWFjaChmdW5jdGlvbiAoY2xvbmUpIHtcbiAgICAgICAgICBjbG9uZS5wYXJlbnROb2RlICYmIGNsb25lLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoY2xvbmUpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9LFxuICAgIG51bGxpbmdHbG9iYWw6IGZ1bmN0aW9uIG51bGxpbmdHbG9iYWwoKSB7XG4gICAgICB0aGlzLmlzTXVsdGlEcmFnID0gZHJhZ1N0YXJ0ZWQgPSBmYWxzZTtcbiAgICAgIG11bHRpRHJhZ0Nsb25lcy5sZW5ndGggPSAwO1xuICAgIH0sXG4gICAgZGVzdHJveUdsb2JhbDogZnVuY3Rpb24gZGVzdHJveUdsb2JhbCgpIHtcbiAgICAgIHRoaXMuX2Rlc2VsZWN0TXVsdGlEcmFnKCk7XG4gICAgICBvZmYoZG9jdW1lbnQsICdwb2ludGVydXAnLCB0aGlzLl9kZXNlbGVjdE11bHRpRHJhZyk7XG4gICAgICBvZmYoZG9jdW1lbnQsICdtb3VzZXVwJywgdGhpcy5fZGVzZWxlY3RNdWx0aURyYWcpO1xuICAgICAgb2ZmKGRvY3VtZW50LCAndG91Y2hlbmQnLCB0aGlzLl9kZXNlbGVjdE11bHRpRHJhZyk7XG4gICAgICBvZmYoZG9jdW1lbnQsICdrZXlkb3duJywgdGhpcy5fY2hlY2tLZXlEb3duKTtcbiAgICAgIG9mZihkb2N1bWVudCwgJ2tleXVwJywgdGhpcy5fY2hlY2tLZXlVcCk7XG4gICAgfSxcbiAgICBfZGVzZWxlY3RNdWx0aURyYWc6IGZ1bmN0aW9uIF9kZXNlbGVjdE11bHRpRHJhZyhldnQpIHtcbiAgICAgIGlmICh0eXBlb2YgZHJhZ1N0YXJ0ZWQgIT09IFwidW5kZWZpbmVkXCIgJiYgZHJhZ1N0YXJ0ZWQpIHJldHVybjtcblxuICAgICAgLy8gT25seSBkZXNlbGVjdCBpZiBzZWxlY3Rpb24gaXMgaW4gdGhpcyBzb3J0YWJsZVxuICAgICAgaWYgKG11bHRpRHJhZ1NvcnRhYmxlICE9PSB0aGlzLnNvcnRhYmxlKSByZXR1cm47XG5cbiAgICAgIC8vIE9ubHkgZGVzZWxlY3QgaWYgdGFyZ2V0IGlzIG5vdCBpdGVtIGluIHRoaXMgc29ydGFibGVcbiAgICAgIGlmIChldnQgJiYgY2xvc2VzdChldnQudGFyZ2V0LCB0aGlzLm9wdGlvbnMuZHJhZ2dhYmxlLCB0aGlzLnNvcnRhYmxlLmVsLCBmYWxzZSkpIHJldHVybjtcblxuICAgICAgLy8gT25seSBkZXNlbGVjdCBpZiBsZWZ0IGNsaWNrXG4gICAgICBpZiAoZXZ0ICYmIGV2dC5idXR0b24gIT09IDApIHJldHVybjtcbiAgICAgIHdoaWxlIChtdWx0aURyYWdFbGVtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgdmFyIGVsID0gbXVsdGlEcmFnRWxlbWVudHNbMF07XG4gICAgICAgIHRvZ2dsZUNsYXNzKGVsLCB0aGlzLm9wdGlvbnMuc2VsZWN0ZWRDbGFzcywgZmFsc2UpO1xuICAgICAgICBtdWx0aURyYWdFbGVtZW50cy5zaGlmdCgpO1xuICAgICAgICBkaXNwYXRjaEV2ZW50KHtcbiAgICAgICAgICBzb3J0YWJsZTogdGhpcy5zb3J0YWJsZSxcbiAgICAgICAgICByb290RWw6IHRoaXMuc29ydGFibGUuZWwsXG4gICAgICAgICAgbmFtZTogJ2Rlc2VsZWN0JyxcbiAgICAgICAgICB0YXJnZXRFbDogZWwsXG4gICAgICAgICAgb3JpZ2luYWxFdmVudDogZXZ0XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0sXG4gICAgX2NoZWNrS2V5RG93bjogZnVuY3Rpb24gX2NoZWNrS2V5RG93bihldnQpIHtcbiAgICAgIGlmIChldnQua2V5ID09PSB0aGlzLm9wdGlvbnMubXVsdGlEcmFnS2V5KSB7XG4gICAgICAgIHRoaXMubXVsdGlEcmFnS2V5RG93biA9IHRydWU7XG4gICAgICB9XG4gICAgfSxcbiAgICBfY2hlY2tLZXlVcDogZnVuY3Rpb24gX2NoZWNrS2V5VXAoZXZ0KSB7XG4gICAgICBpZiAoZXZ0LmtleSA9PT0gdGhpcy5vcHRpb25zLm11bHRpRHJhZ0tleSkge1xuICAgICAgICB0aGlzLm11bHRpRHJhZ0tleURvd24gPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIHJldHVybiBfZXh0ZW5kcyhNdWx0aURyYWcsIHtcbiAgICAvLyBTdGF0aWMgbWV0aG9kcyAmIHByb3BlcnRpZXNcbiAgICBwbHVnaW5OYW1lOiAnbXVsdGlEcmFnJyxcbiAgICB1dGlsczoge1xuICAgICAgLyoqXHJcbiAgICAgICAqIFNlbGVjdHMgdGhlIHByb3ZpZGVkIG11bHRpLWRyYWcgaXRlbVxyXG4gICAgICAgKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWwgICAgVGhlIGVsZW1lbnQgdG8gYmUgc2VsZWN0ZWRcclxuICAgICAgICovXG4gICAgICBzZWxlY3Q6IGZ1bmN0aW9uIHNlbGVjdChlbCkge1xuICAgICAgICB2YXIgc29ydGFibGUgPSBlbC5wYXJlbnROb2RlW2V4cGFuZG9dO1xuICAgICAgICBpZiAoIXNvcnRhYmxlIHx8ICFzb3J0YWJsZS5vcHRpb25zLm11bHRpRHJhZyB8fCB+bXVsdGlEcmFnRWxlbWVudHMuaW5kZXhPZihlbCkpIHJldHVybjtcbiAgICAgICAgaWYgKG11bHRpRHJhZ1NvcnRhYmxlICYmIG11bHRpRHJhZ1NvcnRhYmxlICE9PSBzb3J0YWJsZSkge1xuICAgICAgICAgIG11bHRpRHJhZ1NvcnRhYmxlLm11bHRpRHJhZy5fZGVzZWxlY3RNdWx0aURyYWcoKTtcbiAgICAgICAgICBtdWx0aURyYWdTb3J0YWJsZSA9IHNvcnRhYmxlO1xuICAgICAgICB9XG4gICAgICAgIHRvZ2dsZUNsYXNzKGVsLCBzb3J0YWJsZS5vcHRpb25zLnNlbGVjdGVkQ2xhc3MsIHRydWUpO1xuICAgICAgICBtdWx0aURyYWdFbGVtZW50cy5wdXNoKGVsKTtcbiAgICAgIH0sXG4gICAgICAvKipcclxuICAgICAgICogRGVzZWxlY3RzIHRoZSBwcm92aWRlZCBtdWx0aS1kcmFnIGl0ZW1cclxuICAgICAgICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IGVsICAgIFRoZSBlbGVtZW50IHRvIGJlIGRlc2VsZWN0ZWRcclxuICAgICAgICovXG4gICAgICBkZXNlbGVjdDogZnVuY3Rpb24gZGVzZWxlY3QoZWwpIHtcbiAgICAgICAgdmFyIHNvcnRhYmxlID0gZWwucGFyZW50Tm9kZVtleHBhbmRvXSxcbiAgICAgICAgICBpbmRleCA9IG11bHRpRHJhZ0VsZW1lbnRzLmluZGV4T2YoZWwpO1xuICAgICAgICBpZiAoIXNvcnRhYmxlIHx8ICFzb3J0YWJsZS5vcHRpb25zLm11bHRpRHJhZyB8fCAhfmluZGV4KSByZXR1cm47XG4gICAgICAgIHRvZ2dsZUNsYXNzKGVsLCBzb3J0YWJsZS5vcHRpb25zLnNlbGVjdGVkQ2xhc3MsIGZhbHNlKTtcbiAgICAgICAgbXVsdGlEcmFnRWxlbWVudHMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGV2ZW50UHJvcGVydGllczogZnVuY3Rpb24gZXZlbnRQcm9wZXJ0aWVzKCkge1xuICAgICAgdmFyIF90aGlzMyA9IHRoaXM7XG4gICAgICB2YXIgb2xkSW5kaWNpZXMgPSBbXSxcbiAgICAgICAgbmV3SW5kaWNpZXMgPSBbXTtcbiAgICAgIG11bHRpRHJhZ0VsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24gKG11bHRpRHJhZ0VsZW1lbnQpIHtcbiAgICAgICAgb2xkSW5kaWNpZXMucHVzaCh7XG4gICAgICAgICAgbXVsdGlEcmFnRWxlbWVudDogbXVsdGlEcmFnRWxlbWVudCxcbiAgICAgICAgICBpbmRleDogbXVsdGlEcmFnRWxlbWVudC5zb3J0YWJsZUluZGV4XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIG11bHRpRHJhZ0VsZW1lbnRzIHdpbGwgYWxyZWFkeSBiZSBzb3J0ZWQgaWYgZm9sZGluZ1xuICAgICAgICB2YXIgbmV3SW5kZXg7XG4gICAgICAgIGlmIChmb2xkaW5nICYmIG11bHRpRHJhZ0VsZW1lbnQgIT09IGRyYWdFbCQxKSB7XG4gICAgICAgICAgbmV3SW5kZXggPSAtMTtcbiAgICAgICAgfSBlbHNlIGlmIChmb2xkaW5nKSB7XG4gICAgICAgICAgbmV3SW5kZXggPSBpbmRleChtdWx0aURyYWdFbGVtZW50LCAnOm5vdCguJyArIF90aGlzMy5vcHRpb25zLnNlbGVjdGVkQ2xhc3MgKyAnKScpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5ld0luZGV4ID0gaW5kZXgobXVsdGlEcmFnRWxlbWVudCk7XG4gICAgICAgIH1cbiAgICAgICAgbmV3SW5kaWNpZXMucHVzaCh7XG4gICAgICAgICAgbXVsdGlEcmFnRWxlbWVudDogbXVsdGlEcmFnRWxlbWVudCxcbiAgICAgICAgICBpbmRleDogbmV3SW5kZXhcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGl0ZW1zOiBfdG9Db25zdW1hYmxlQXJyYXkobXVsdGlEcmFnRWxlbWVudHMpLFxuICAgICAgICBjbG9uZXM6IFtdLmNvbmNhdChtdWx0aURyYWdDbG9uZXMpLFxuICAgICAgICBvbGRJbmRpY2llczogb2xkSW5kaWNpZXMsXG4gICAgICAgIG5ld0luZGljaWVzOiBuZXdJbmRpY2llc1xuICAgICAgfTtcbiAgICB9LFxuICAgIG9wdGlvbkxpc3RlbmVyczoge1xuICAgICAgbXVsdGlEcmFnS2V5OiBmdW5jdGlvbiBtdWx0aURyYWdLZXkoa2V5KSB7XG4gICAgICAgIGtleSA9IGtleS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBpZiAoa2V5ID09PSAnY3RybCcpIHtcbiAgICAgICAgICBrZXkgPSAnQ29udHJvbCc7XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5Lmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICBrZXkgPSBrZXkuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBrZXkuc3Vic3RyKDEpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBrZXk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbn1cbmZ1bmN0aW9uIGluc2VydE11bHRpRHJhZ0VsZW1lbnRzKGNsb25lc0luc2VydGVkLCByb290RWwpIHtcbiAgbXVsdGlEcmFnRWxlbWVudHMuZm9yRWFjaChmdW5jdGlvbiAobXVsdGlEcmFnRWxlbWVudCwgaSkge1xuICAgIHZhciB0YXJnZXQgPSByb290RWwuY2hpbGRyZW5bbXVsdGlEcmFnRWxlbWVudC5zb3J0YWJsZUluZGV4ICsgKGNsb25lc0luc2VydGVkID8gTnVtYmVyKGkpIDogMCldO1xuICAgIGlmICh0YXJnZXQpIHtcbiAgICAgIHJvb3RFbC5pbnNlcnRCZWZvcmUobXVsdGlEcmFnRWxlbWVudCwgdGFyZ2V0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcm9vdEVsLmFwcGVuZENoaWxkKG11bHRpRHJhZ0VsZW1lbnQpO1xuICAgIH1cbiAgfSk7XG59XG5cbi8qKlxyXG4gKiBJbnNlcnQgbXVsdGktZHJhZyBjbG9uZXNcclxuICogQHBhcmFtICB7W0Jvb2xlYW5dfSBlbGVtZW50c0luc2VydGVkICBXaGV0aGVyIHRoZSBtdWx0aS1kcmFnIGVsZW1lbnRzIGFyZSBpbnNlcnRlZFxyXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gcm9vdEVsXHJcbiAqL1xuZnVuY3Rpb24gaW5zZXJ0TXVsdGlEcmFnQ2xvbmVzKGVsZW1lbnRzSW5zZXJ0ZWQsIHJvb3RFbCkge1xuICBtdWx0aURyYWdDbG9uZXMuZm9yRWFjaChmdW5jdGlvbiAoY2xvbmUsIGkpIHtcbiAgICB2YXIgdGFyZ2V0ID0gcm9vdEVsLmNoaWxkcmVuW2Nsb25lLnNvcnRhYmxlSW5kZXggKyAoZWxlbWVudHNJbnNlcnRlZCA/IE51bWJlcihpKSA6IDApXTtcbiAgICBpZiAodGFyZ2V0KSB7XG4gICAgICByb290RWwuaW5zZXJ0QmVmb3JlKGNsb25lLCB0YXJnZXQpO1xuICAgIH0gZWxzZSB7XG4gICAgICByb290RWwuYXBwZW5kQ2hpbGQoY2xvbmUpO1xuICAgIH1cbiAgfSk7XG59XG5mdW5jdGlvbiByZW1vdmVNdWx0aURyYWdFbGVtZW50cygpIHtcbiAgbXVsdGlEcmFnRWxlbWVudHMuZm9yRWFjaChmdW5jdGlvbiAobXVsdGlEcmFnRWxlbWVudCkge1xuICAgIGlmIChtdWx0aURyYWdFbGVtZW50ID09PSBkcmFnRWwkMSkgcmV0dXJuO1xuICAgIG11bHRpRHJhZ0VsZW1lbnQucGFyZW50Tm9kZSAmJiBtdWx0aURyYWdFbGVtZW50LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobXVsdGlEcmFnRWxlbWVudCk7XG4gIH0pO1xufVxuXG5Tb3J0YWJsZS5tb3VudChuZXcgQXV0b1Njcm9sbFBsdWdpbigpKTtcblNvcnRhYmxlLm1vdW50KFJlbW92ZSwgUmV2ZXJ0KTtcblxuZXhwb3J0IGRlZmF1bHQgU29ydGFibGU7XG5leHBvcnQgeyBNdWx0aURyYWdQbHVnaW4gYXMgTXVsdGlEcmFnLCBTb3J0YWJsZSwgU3dhcFBsdWdpbiBhcyBTd2FwIH07XG4iLCAiaW1wb3J0IFNvcnRhYmxlIGZyb20gJ3NvcnRhYmxlanMnO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKEFscGluZSkge1xyXG4gICAgQWxwaW5lLmRpcmVjdGl2ZSgncm9idXN0YS1zb3J0YWJsZScsIChlbCwgeyBleHByZXNzaW9uIH0sIHsgZXZhbHVhdGVMYXRlciwgY2xlYW51cCB9KSA9PiB7XHJcbiAgICAgICAgY29uc3QgZXZhbHVhdGUgPSBldmFsdWF0ZUxhdGVyKGV4cHJlc3Npb24pO1xyXG5cclxuICAgICAgICBjb25zdCBzb3J0YWJsZSA9IFNvcnRhYmxlLmNyZWF0ZShlbCwge1xyXG4gICAgICAgICAgICBhbmltYXRpb246IDE1MCxcclxuICAgICAgICAgICAgZGF0YUlkQXR0cjogJ3gtc29ydGFibGUtaXRlbScsXHJcbiAgICAgICAgICAgIGhhbmRsZTogJy5yb2J1c3RhLXNvcnRhYmxlLWhhbmRsZScsXHJcbiAgICAgICAgICAgIG9uU29ydCgpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNvcnRlZFN1YnNldCA9IHNvcnRhYmxlLnRvQXJyYXkoKVxyXG5cclxuICAgICAgICAgICAgICAgIGV2YWx1YXRlKCh2YWx1ZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgZGF0YSwgZml4ZWQgPSBbXSB9ID0gdmFsdWVcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGRhdGEpKSByZXR1cm5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gU2lzaXBrYW4gaGFzaWwgdXJ1dGFuIGJhcnUga2UgcG9zaXNpIGxhbWEsIG1lbmphZ2EgZml4ZWRcclxuICAgICAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gW11cclxuICAgICAgICAgICAgICAgICAgICBsZXQgaSA9IDAsIGogPSAwXHJcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGkgPCBkYXRhLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZml4ZWQuaW5jbHVkZXMoZGF0YVtpXSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGRhdGFbaV0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChzb3J0ZWRTdWJzZXRbal0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBqKytcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpKytcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSBvcmlnaW5hbCBkYXRhIGFycmF5IHNlY2FyYSBsYW5nc3VuZ1xyXG4gICAgICAgICAgICAgICAgICAgIGRhdGEuc3BsaWNlKDAsIGRhdGEubGVuZ3RoLCAuLi5yZXN1bHQpXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRyaWdnZXIgZXZlbnQga2FsYXUgcGVybHVcclxuICAgICAgICAgICAgICAgICAgICBlbC5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCgnc29ydGVkJywgeyBkZXRhaWw6IFsuLi5kYXRhXSB9KSlcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vLyBSZWFrdGlmIHRlcmhhZGFwIGlzTG9hZGluZyAob3B0aW9uYWwpXHJcbiAgICAgICAgY29uc3Qgc3RvcCA9IEFscGluZS5lZmZlY3QoKCkgPT4ge1xyXG4gICAgICAgICAgICBldmFsdWF0ZSgodmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICAgIHNvcnRhYmxlLm9wdGlvbignZGlzYWJsZWQnLCAhIXZhbHVlPy5pc0xvYWRpbmcpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgY2xlYW51cCgoKSA9PiB7XHJcbiAgICAgICAgICAgIHN0b3AoKVxyXG4gICAgICAgICAgICBzb3J0YWJsZS5kZXN0cm95KClcclxuICAgICAgICB9KVxyXG4gICAgfSk7XHJcbn1cclxuIiwgImltcG9ydCByZXNpemVkQ29sdW1uIGZyb20gJy4vcmVzaXplZC1jb2x1bW4nXG5pbXBvcnQgc29ydGFibGUgZnJvbSAnLi9zb3J0YWJsZSdcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gaW5pdFRhYmxlKHsgcmVzaXplZENvbHVtbjogcmVzaXplZENvbHVtblByb3BzIH0pIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBpbml0KCkge1xuICAgICAgICAgICAgQWxwaW5lLnBsdWdpbihzb3J0YWJsZSlcbiAgICAgICAgICAgIHJlc2l6ZWRDb2x1bW4odGhpcy4kZWwsIHJlc2l6ZWRDb2x1bW5Qcm9wcylcbiAgICAgICAgfVxuICAgIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFDZSxTQUFSLHVCQUFrQixJQUFJLE9BQU87QUFDaEMsTUFBSSxFQUFFLFVBQVUsZ0JBQWdCLGdCQUFnQixTQUFTLE1BQU0sSUFBSTtBQUVuRSxtQkFBaUIsbUJBQW1CLEtBQUssV0FBVztBQUVwRCxNQUFJLENBQUM7QUFBUTtBQUViLE1BQUksZUFBZTtBQUNuQixRQUFNLGdCQUFnQjtBQUN0QixRQUFNLDhCQUE4QjtBQUNwQyxRQUFNLHNCQUFzQjtBQUM1QixRQUFNLGlCQUFpQjtBQUN2QixRQUFNLHdCQUF3QjtBQUU5QixNQUFJLFVBQVUsR0FBRyxpQkFBaUIsSUFBSSxjQUFjLEdBQUc7QUFDdkQsTUFBSSxpQkFBaUIsR0FBRyxpQkFBaUIsSUFBSSxxQkFBcUIsR0FBRztBQUVyRSxNQUFJLFFBQVEsR0FBRyxjQUFjLGFBQWE7QUFDMUMsTUFBSSxlQUFlLEdBQUcsY0FBYywyQkFBMkI7QUFFL0QsV0FBUyxLQUFLLFVBQVUsTUFBTTtBQUMxQixtQkFBZTtBQUFBLEVBQ25CLENBQUM7QUFFRCxXQUFTLGlCQUFpQjtBQUN0QixVQUFNLFdBQVcsSUFBSSxpQkFBaUIsTUFBTTtBQUN4QyxZQUFNQSxTQUFRLEdBQUcsY0FBYyxhQUFhO0FBQzVDLFlBQU0sVUFBVSxHQUFHLGNBQWMsMkJBQTJCO0FBRTVELFVBQUlBLFVBQVMsU0FBUztBQUNsQixpQkFBUyxXQUFXO0FBQ3BCLGFBQUs7QUFBQSxNQUNUO0FBQUEsSUFDSixDQUFDO0FBRUQsYUFBUyxRQUFRLElBQUksRUFBRSxXQUFXLE1BQU0sU0FBUyxLQUFLLENBQUM7QUFBQSxFQUMzRDtBQUVBLFdBQVMsT0FBTztB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SUFBSSxZQUFZLFVBQVUsRUFBRSxRQUFRLENBQUMsR0FBRyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0FBQUEsUUFDckUsQ0FBQztBQUFBLE1BQ0w7QUFBQSxJQUNKLENBQUM7QUFHRCxVQUFNLE9BQU9BLFFBQU8sT0FBTyxNQUFNO0FBQzdCLGVBQVMsQ0FBQyxVQUFVO0FBQ2hCLGlCQUFTLE9BQU8sWUFBWSxDQUFDLENBQUMsT0FBTyxTQUFTO0FBQUEsTUFDbEQsQ0FBQztBQUFBLElBQ0wsQ0FBQztBQUVELFlBQVEsTUFBTTtBQUNWLFdBQUs7QUFDTCxlQUFTLFFBQVE7QUFBQSxJQUNyQixDQUFDO0FBQUEsRUFDTCxDQUFDO0FBQ0w7OztBQ2pEZSxTQUFSLFVBQTJCLEVBQUUsZUFBZSxtQkFBbUIsR0FBRztBQUNyRSxTQUFPO0FBQUEsSUFDSCxPQUFPO0FBQ0gsYUFBTyxPQUFPLGdCQUFRO0FBQ3RCLDZCQUFjLEtBQUssS0FBSyxrQkFBa0I7QUFBQSxJQUM5QztBQUFBLEVBQ0o7QUFDSjsiLAogICJuYW1lcyI6IFsidGFibGUiLCAidGhyb3R0bGUiLCAiZWwiLCAib2JqIiwgImluZGV4IiwgImdob3N0RWwiLCAib3B0aW9uIiwgImRlZmF1bHRzIiwgInJvb3RFbCIsICJjbG9uZUVsIiwgIm9sZEluZGV4IiwgIm5ld0luZGV4IiwgIm9sZERyYWdnYWJsZUluZGV4IiwgIm5ld0RyYWdnYWJsZUluZGV4IiwgInB1dFNvcnRhYmxlIiwgInBsdWdpbkV2ZW50IiwgIl9kZXRlY3REaXJlY3Rpb24iLCAiX2RyYWdFbEluUm93Q29sdW1uIiwgIl9kZXRlY3ROZWFyZXN0RW1wdHlTb3J0YWJsZSIsICJfcHJlcGFyZUdyb3VwIiwgImRyYWdFbCIsICJfaGlkZUdob3N0Rm9yVGFyZ2V0IiwgIl91bmhpZGVHaG9zdEZvclRhcmdldCIsICJuZWFyZXN0RW1wdHlJbnNlcnREZXRlY3RFdmVudCIsICJfY2hlY2tPdXRzaWRlVGFyZ2V0RWwiLCAiZHJhZ1N0YXJ0Rm4iLCAidGFyZ2V0IiwgImFmdGVyIiwgImVsIiwgInBsdWdpbnMiLCAiZHJvcCIsICJhdXRvU2Nyb2xsIiwgIm9uU3BpbGwiLCAiQWxwaW5lIl0KfQo=
