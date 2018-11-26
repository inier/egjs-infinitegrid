/*
Copyright (c) 2017 NAVER Corp.
@egjs/infinitegrid project is licensed under the MIT license

@egjs/infinitegrid JavaScript library
https://github.com/naver/egjs-infinitegrid

@version 3.5.0
*/
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('@egjs/component')) :
  typeof define === 'function' && define.amd ? define(['@egjs/component'], factory) :
  (global.eg = global.eg || {}, global.eg.InfiniteGrid = factory(global.eg.Component));
}(this, (function (Component) { 'use strict';

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

  function _inheritsLoose(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;
    subClass.__proto__ = superClass;
  }

  /* eslint-disable no-new-func, no-nested-ternary */
  var win;

  if (typeof window === "undefined") {
    // window is undefined in node.js
    win = {
      document: {},
      navigator: {
        userAgent: ""
      }
    };
  } else {
    win = window;
  }
  var document = win.document;

  var ua = win.navigator.userAgent;
  var SUPPORT_COMPUTEDSTYLE = !!("getComputedStyle" in win);
  var SUPPORT_ADDEVENTLISTENER = !!("addEventListener" in document);
  var SUPPORT_PASSIVE = function () {
    var supportsPassiveOption = false;

    try {
      if (SUPPORT_ADDEVENTLISTENER && Object.defineProperty) {
        document.addEventListener("test", null, Object.defineProperty({}, "passive", {
          get: function get() {
            supportsPassiveOption = true;
          }
        }));
      }
    } catch (e) {}

    return supportsPassiveOption;
  }();
  var IS_IE = /MSIE|Trident|Windows Phone|Edge/.test(ua);
  var IS_IOS = /iPhone|iPad/.test(ua);
  var IS_ANDROID2 = /Android 2\./.test(ua);
  var CONTAINER_CLASSNAME = "_eg-infinitegrid-container_";
  var IGNORE_CLASSNAME = "_eg-infinitegrid-ignore_";
  var TRANSITION_NAME = "_INFINITEGRID_TRANSITION";
  var APPEND = true;
  var PREPEND = false;
  var VERTICAL = "vertical";
  var HORIZONTAL = "horizontal";
  var CACHE = true;
  var NO_CACHE = false;
  var TRUSTED = true;
  var NO_TRUSTED = false;
  var MULTI = true;
  var DUMMY_POSITION = -100000;
  var GROUPKEY_ATT = "data-groupkey";
  var DEFAULT_OPTIONS = {
    horizontal: false,
    margin: 0
  };
  var agent = ua.toLowerCase();
  var isMobile = /mobi|ios|android/.test(agent);
  var ALIGN = {
    START: "start",
    CENTER: "center",
    END: "end",
    JUSTIFY: "justify"
  };
  var IDLE = 0;
  var LOADING_APPEND = 1;
  var LOADING_PREPEND = 2;
  var PROCESSING = 4;
  var webkit = /applewebkit\/([\d|.]*)/g.exec(agent);
  var WEBKIT_VERSION = webkit && parseInt(webkit[1], 10) || 0;
  var DEFENSE_BROWSER = WEBKIT_VERSION && WEBKIT_VERSION < 537;

  var _ref = function () {
    var properties = {
      transitionend: "",
      webkitTransitionEnd: "-webkit-",
      oTransitionEnd: "-o-",
      mozTransitionEnd: "-moz-"
    };

    for (var property in properties) {
      var prefix = properties[property];

      if ("on" + property.toLowerCase() in win) {
        return [prefix + "transform", prefix + "transition", property];
      }
    }

    return [];
  }(),
      TRANSFORM = _ref[0],
      TRANSITION = _ref[1],
      TRANSITION_END = _ref[2];

  function toArray(nodes) {
    // SCRIPT5014 in IE8
    var array = [];

    if (nodes) {
      for (var i = 0, len = nodes.length; i < len; i++) {
        array.push(nodes[i]);
      }
    }

    return array;
  }
  function matchHTML(html) {
    return html.match(/^<([A-z]+)\s*([^>]*)>/);
  }
  /**
   * Select or create element
   * @param {String|HTMLElement|jQuery} param
   *  when string given is as HTML tag, then create element
   *  otherwise it returns selected elements
   * @param {Boolean} multi
   * @returns {HTMLElement}
   */

  function $(param, multi) {
    if (multi === void 0) {
      multi = false;
    }

    var el;

    if (typeof param === "string") {
      // String (HTML, Selector)
      // check if string is HTML tag format
      var match = matchHTML(param); // creating element

      if (match) {
        // HTML
        var dummy = document.createElement("div");
        dummy.innerHTML = param;
        el = dummy.childNodes;
      } else {
        // Selector
        el = document.querySelectorAll(param);
      }

      if (multi) {
        el = toArray(el);
      } else {
        el = el && el.length > 0 && el[0] || undefined;
      }
    } else if (param === win) {
      // window
      el = param;
    } else if (param.nodeName && (param.nodeType === 1 || param.nodeType === 9)) {
      // HTMLElement, Document
      el = param;
    } else if (typeof win.jQuery === "function" && param instanceof win.jQuery || param.constructor.prototype.jquery) {
      // jQuery
      el = $(multi ? param.toArray() : param.get(0), multi);
    } else if (Array.isArray(param)) {
      el = param.map(function (v) {
        return $(v);
      });

      if (!multi) {
        el = el.length >= 1 ? el[0] : undefined;
      }
    }

    return el;
  }
  function addEvent(element, type, handler, eventListenerOptions) {
    if (SUPPORT_ADDEVENTLISTENER) {
      var options = eventListenerOptions || false;

      if (typeof eventListenerOptions === "object") {
        options = SUPPORT_PASSIVE ? eventListenerOptions : false;
      }

      element.addEventListener(type, handler, options);
    } else if (element.attachEvent) {
      element.attachEvent("on" + type, handler);
    } else {
      element["on" + type] = handler;
    }
  }
  function removeEvent(element, type, handler) {
    if (element.removeEventListener) {
      element.removeEventListener(type, handler, false);
    } else if (element.detachEvent) {
      element.detachEvent("on" + type, handler);
    } else {
      element["on" + type] = null;
    }
  }
  function addOnceEvent(element, type, handler, eventListenerOptions) {
    var callback = function callback(e) {
      removeEvent(element, type, callback);
      handler(e);
    };

    addEvent(element, type, callback, eventListenerOptions);
  }
  function scroll(el, horizontal) {
    if (horizontal === void 0) {
      horizontal = false;
    }

    var prop = "scroll" + (horizontal ? "Left" : "Top");

    if (el === win) {
      return win[horizontal ? "pageXOffset" : "pageYOffset"] || document.body[prop] || document.documentElement[prop];
    } else {
      return el[prop];
    }
  }
  function scrollTo(el, x, y) {
    if (el === win) {
      el.scroll(x, y);
    } else {
      el.scrollLeft = x;
      el.scrollTop = y;
    }
  }
  function scrollBy(el, x, y) {
    if (el === win) {
      el.scrollBy(x, y);
    } else {
      el.scrollLeft += x;
      el.scrollTop += y;
    }
  }
  function getStyles(el) {
    return (SUPPORT_COMPUTEDSTYLE ? win.getComputedStyle(el) : el.currentStyle) || {};
  }

  function _getSize(el, name, isOffset) {
    if (el === win) {
      // WINDOW
      return win["inner" + name] || document.body["client" + name];
    } else if (el.nodeType === 9) {
      // DOCUMENT_NODE
      var doc = el.documentElement;
      return Math.max(el.body["scroll" + name], doc["scroll" + name], el.body["offset" + name], doc["offset" + name], doc["client" + name]);
    } else {
      // NODE
      var size = 0;

      if (isOffset) {
        var clientRect = el.getBoundingClientRect();
        size = name === "Width" ? clientRect.right - clientRect.left : clientRect.bottom - clientRect.top;
      } else {
        size = el["client" + name] || el["offset" + name];
      }

      return parseFloat(size || getStyles(el)[name.toLowerCase()]) || 0;
    }
  }

  function innerWidth(el) {
    return _getSize(el, "Width", false);
  }
  function innerHeight(el) {
    return _getSize(el, "Height", false);
  }
  function outerWidth(el) {
    return _getSize(el, "Width", true);
  }
  function outerHeight(el) {
    return _getSize(el, "Height", true);
  }
  function getSize(el) {
    return {
      width: outerWidth(el),
      height: outerHeight(el)
    };
  }
  var STYLE = {
    vertical: {
      pos1: "top",
      endPos1: "bottom",
      size1: "height",
      pos2: "left",
      endPos2: "right",
      size2: "width"
    },
    horizontal: {
      pos1: "left",
      endPos1: "right",
      size1: "width",
      pos2: "top",
      endPos2: "bottom",
      size2: "height"
    }
  };
  function getStyleNames(isHorizontal) {
    return STYLE[isHorizontal ? HORIZONTAL : VERTICAL];
  }
  function assignOptions(defaultOptions, options) {
    return _extends({}, DEFAULT_OPTIONS, defaultOptions, options);
  }
  function toZeroArray(outline) {
    if (!outline || !outline.length) {
      return [0];
    }

    return outline;
  }
  function cloneItems(items) {
    return items.map(function (item) {
      return _extends({}, item);
    });
  }
  function fill(arr, value) {
    var length = arr.length;

    for (var i = length - 1; i >= 0; --i) {
      arr[i] = value;
    }

    return arr;
  }
  function isUndefined(target) {
    return typeof target === "undefined";
  }

  var ItemManager =
  /*#__PURE__*/
  function () {
    ItemManager.from = function from(elements, selector, _ref) {
      var groupKey = _ref.groupKey,
          isAppend = _ref.isAppend;
      var filted = ItemManager.selectItems($(elements, MULTI), selector); // Item Structure

      return toArray(filted).map(function (el) {
        return {
          el: el,
          groupKey: groupKey,
          content: el.outerHTML,
          rect: {
            top: DUMMY_POSITION,
            left: DUMMY_POSITION
          }
        };
      });
    };

    ItemManager.selectItems = function selectItems(elements, selector) {
      return elements.filter(function (v) {
        var classNames = v.className.split(" ");

        if (classNames.some(function (c) {
          return c === IGNORE_CLASSNAME;
        })) {
          return false;
        } else if (!selector || selector === "*") {
          return v;
        } else {
          return classNames.some(function (c) {
            return c === selector;
          });
        }
      });
    };

    ItemManager.pluck = function pluck(data, property) {
      return data.reduce(function (acc, v) {
        return acc.concat(v[property]);
      }, []);
    };

    function ItemManager() {
      this.clear();
    }

    var _proto = ItemManager.prototype;

    _proto.getStatus = function getStatus(startKey, endKey) {
      var datas = this._data;
      var startIndex = Math.max(this.indexOf(startKey), 0);
      var endIndex = this.indexOf(endKey) + 1 || datas.length;
      return {
        _data: datas.slice(startIndex, endIndex).map(function (data) {
          var items = data.items.map(function (item) {
            var item2 = _extends({}, item);

            delete item2.el;
            return item2;
          });

          var data2 = _extends({}, data);

          data2.items = items;
          return data2;
        })
      };
    };

    _proto.setStatus = function setStatus(status) {
      var data = status._data;
      this.set(data);
    };

    _proto.size = function size() {
      return this._data.length;
    };

    _proto.fit = function fit(base, horizontal) {
      if (!this._data.length) {
        return;
      }

      var property = horizontal ? "left" : "top";

      if (base !== 0) {
        this._data = this._data.map(function (v) {
          v.items = v.items.map(function (item) {
            item.rect[property] -= base;
            return item;
          });
          v.outlines.start = v.outlines.start.map(function (start) {
            return start - base;
          });
          v.outlines.end = v.outlines.end.map(function (end) {
            return end - base;
          });
          return v;
        });
      }
    };

    _proto.pluck = function pluck(property, start, end) {
      var data = isUndefined(start) ? this._data : this._data.slice(start, (isUndefined(end) ? start : end) + 1);
      return ItemManager.pluck(data, property);
    };

    _proto.getOutline = function getOutline(index, property) {
      var data = this._data[index];
      return data ? data.outlines[property] : [];
    };

    _proto.getEdgeIndex = function getEdgeIndex(cursor, start, end) {
      var prop = cursor === "start" ? "min" : "max";
      var index = -1;
      var targetValue = cursor === "start" ? Infinity : -Infinity;

      for (var i = start; i <= end; i++) {
        var value = Math[prop].apply(Math, this.getOutline(i, cursor));

        if (cursor === "start" && targetValue > value || cursor === "end" && targetValue < value) {
          targetValue = value;
          index = i;
        }
      }

      return index;
    };

    _proto.getEdgeValue = function getEdgeValue(cursor, start, end) {
      var outlines = this.pluck("outlines", this.getEdgeIndex(cursor, start, end)).reduce(function (acc, v) {
        return acc.concat(v[cursor]);
      }, []);
      return outlines.length ? Math[cursor === "start" ? "min" : "max"].apply(Math, outlines) : 0;
    };

    _proto.clearOutlines = function clearOutlines(startCursor, endCursor) {
      if (startCursor === void 0) {
        startCursor = -1;
      }

      if (endCursor === void 0) {
        endCursor = -1;
      }

      var datas = this.get();
      datas.forEach(function (group, cursor) {
        if (startCursor <= cursor && cursor <= endCursor) {
          return;
        }

        group.items.forEach(function (item) {
          item.rect.top = DUMMY_POSITION;
          item.rect.left = DUMMY_POSITION;
        });
        group.outlines.start = [];
        group.outlines.end = [];
      });
    };

    _proto.getMaxEdgeValue = function getMaxEdgeValue() {
      var groups = this.get();
      var length = groups.length;

      for (var i = length - 1; i >= 0; --i) {
        var end = groups[i].outlines.end;

        if (end.length) {
          var pos = Math.max.apply(Math, end);
          return pos;
        }
      }

      return 0;
    };

    _proto.append = function append(layouted) {
      this._data.push(layouted);

      return layouted.items;
    };

    _proto.prepend = function prepend(layouted) {
      this._data.unshift(layouted);

      return layouted.items;
    };

    _proto.clear = function clear() {
      this._data = [];
    };

    _proto.remove = function remove(element, start, end) {
      var items = [];
      var key = element.getAttribute(GROUPKEY_ATT);
      var data = this.get(start, end).filter(function (v) {
        return String(v.groupKey) === key;
      });

      if (!data.length) {
        return items;
      }

      data = data[0];
      var len = data.items.length;
      var idx = -1;

      for (var i = 0; i < len; i++) {
        if (data.items[i].el === element) {
          idx = i;
          break;
        }
      }

      if (~idx) {
        // remove item information
        data.items.splice(idx, 1);
        this.set(data, key);
        items = data.items;
      }

      return items;
    };

    _proto.indexOf = function indexOf(data) {
      var groupKey = typeof data === "object" ? data.groupKey : data;
      var datas = this._data;
      var length = datas.length;

      for (var i = 0; i < length; ++i) {
        if (groupKey === datas[i].groupKey) {
          return i;
        }
      }

      return -1;
    };

    _proto.get = function get(start, end) {
      return isUndefined(start) ? this._data : this._data.slice(start, (isUndefined(end) ? start : end) + 1);
    };

    _proto.set = function set(data, key) {
      if (!isUndefined(key) && !Array.isArray(data)) {
        var len = this._data.length;
        var idx = -1;

        for (var i = 0; i < len; i++) {
          if (this._data[i].groupKey === key) {
            idx = i;
            break;
          }
        }

        ~idx && (this._data[idx] = data);
      } else {
        this._data = data.concat();
      }
    };

    _proto.getData = function getData(index) {
      return this._data[index];
    };

    return ItemManager;
  }();

  function resetSize(item) {
    item.orgSize = 0;
    item.size = 0;
  }

  function createContainer(element) {
    var container = document.createElement("div");
    container.className = CONTAINER_CLASSNAME;
    container.style.position = "relative";
    container.style.height = "100%";
    var children = element.children;
    var length = children.length; // for IE8

    for (var i = 0; i < length; i++) {
      container.appendChild(children[0]);
    }

    element.appendChild(container);
    return container;
  }

  function render(properties, rect, styles) {
    properties.forEach(function (p) {
      p in rect && (styles[p] = rect[p] + "px");
    });
  }

  function setTransition(styles, transitionDuration, pos1, pos2) {
    styles[TRANSITION + "-property"] = transitionDuration ? TRANSFORM + ",width,height" : "";
    styles[TRANSITION + "-duration"] = transitionDuration ? transitionDuration + "s" : "";
    styles[TRANSITION + "-delay"] = transitionDuration ? "0s" : "";
    styles[TRANSFORM] = transitionDuration ? "translate(" + (pos1.left - pos2.left) + "px," + (pos1.top - pos2.top) + "px)" : "";
  }

  var DOMRenderer =
  /*#__PURE__*/
  function () {
    DOMRenderer.renderItem = function renderItem(item, rect, transitionDuration) {
      if (!item.el) {
        return;
      }

      var el = item.el,
          prevRect = item.prevRect;
      var styles = el.style; // for debugging

      el.setAttribute(GROUPKEY_ATT, item.groupKey);
      styles.position = "absolute";
      render(["width", "height"], rect, styles);

      if (transitionDuration && TRANSITION && prevRect) {
        setTransition(styles, transitionDuration, rect, prevRect);

        if (el[TRANSITION_NAME]) {
          return;
        }

        el[TRANSITION_NAME] = true;
        addOnceEvent(el, TRANSITION_END, function () {
          var itemRect = item.rect;
          setTransition(styles);
          render(["left", "top"], itemRect, styles);
          item.prevRect = itemRect;
          el[TRANSITION_NAME] = false;
        });
      } else {
        render(["left", "top"], rect, styles);
        item.prevRect = rect;
      }
    };

    DOMRenderer.renderItems = function renderItems(items, transitionDuration) {
      items.forEach(function (item) {
        DOMRenderer.renderItem(item, item.rect, transitionDuration);
      });
    };

    DOMRenderer.removeItems = function removeItems(items) {
      items.forEach(function (item) {
        if (item.el) {
          DOMRenderer.removeElement(item.el);
          item.el = null;
        }
      });
    };

    DOMRenderer.removeElement = function removeElement(element) {
      var parentNode = element && element.parentNode;

      if (!parentNode) {
        return;
      }

      parentNode.removeChild(element);
    };

    DOMRenderer.createElements = function createElements(items) {
      if (!items.length) {
        return;
      }

      var noElementItems = items.filter(function (item) {
        return !item.el;
      });

      if (!noElementItems.length) {
        return;
      }

      var elements = $(noElementItems.map(function (_ref) {
        var content = _ref.content;
        return content.replace(/^[\s\uFEFF]+|[\s\uFEFF]+$/g, "");
      }).join(""), MULTI);
      noElementItems.forEach(function (item, index) {
        item.el = elements[index];
      });
    };

    function DOMRenderer(element, options) {
      _extends(this.options = {
        isEqualSize: false,
        isConstantSize: false,
        horizontal: false,
        container: false
      }, options);

      this._size = {
        container: -1,
        view: -1,
        viewport: -1,
        item: null
      };

      this._init(element);

      this.resize();
    }

    var _proto = DOMRenderer.prototype;

    _proto.getStatus = function getStatus() {
      return {
        cssText: this.container.style.cssText,
        _size: _extends({}, this._size)
      };
    };

    _proto.setStatus = function setStatus(status) {
      this.container.style.cssText = status.cssText;

      _extends(this._size, status._size);
    };

    _proto.updateSize = function updateSize(items) {
      var _this$options = this.options,
          isEqualSize = _this$options.isEqualSize,
          isConstantSize = _this$options.isConstantSize;
      var size = this._size;
      return items.map(function (item) {
        if (!item.el) {
          return item;
        }

        if (isEqualSize && !size.item) {
          size.item = getSize(item.el);
        }

        item.size = isEqualSize && _extends(size.item) || isConstantSize && item.orgSize && _extends(item.orgSize) || getSize(item.el);

        if (!item.orgSize) {
          item.orgSize = _extends({}, item.size);
        }

        return item;
      });
    };

    _proto._init = function _init(el) {
      var element = $(el);
      var style = getStyles(element);
      var _this$options2 = this.options,
          container = _this$options2.container,
          horizontal = _this$options2.horizontal;
      this._orgStyle = {};

      if (style.position === "static") {
        this._orgStyle.position = element.style.position;
        element.style.position = "relative";
      }

      if (container) {
        var target = horizontal ? ["X", "Y"] : ["Y", "X"];
        this._orgStyle.overflowX = element.style.overflowX;
        this._orgStyle.overflowY = element.style.overflowY;
        element.style["overflow" + target[0]] = "scroll";
        element.style["overflow" + target[1]] = "hidden";
        this.view = element;
        this.container = container === true ? createContainer(this.view) : container;
      } else {
        this.view = win;
        this.container = element;
      }
    };

    _proto.append = function append(items) {
      this._insert(items, APPEND, {
        top: DUMMY_POSITION,
        left: DUMMY_POSITION
      });
    };

    _proto.prepend = function prepend(items) {
      this._insert(items, PREPEND, {
        top: DUMMY_POSITION,
        left: DUMMY_POSITION
      });
    };

    _proto.createAndInsert = function createAndInsert(items, isAppend) {
      DOMRenderer.createElements(items);
      DOMRenderer.renderItems(items);

      this._insert(items, isAppend);
    };

    _proto._insert = function _insert(items, isAppend, styles) {
      var container = this.container;
      var df = document.createDocumentFragment();
      items.forEach(function (item) {
        styles && DOMRenderer.renderItem(item, styles);
        isAppend ? df.appendChild(item.el) : df.insertBefore(item.el, df.firstChild);
      });
      isAppend ? container.appendChild(df) : container.insertBefore(df, container.firstChild);
    };

    _proto._calcSize = function _calcSize() {
      return this.options.horizontal ? innerHeight(this.container) : innerWidth(this.container);
    };

    _proto.getViewSize = function getViewSize() {
      return this._size.view;
    };

    _proto.getViewportSize = function getViewportSize() {
      return this._size.viewport;
    };

    _proto.setContainerSize = function setContainerSize(size) {
      this.container.style[this.options.horizontal ? "width" : "height"] = size + "px";
    };

    _proto.resize = function resize() {
      var horizontal = this.options.horizontal;
      var view = this.view;
      var isResize = this.isNeededResize();

      if (isResize) {
        this._size = {
          viewport: this._calcSize(),
          item: null
        };
      }

      this._size.view = horizontal ? innerWidth(view) : innerHeight(view);
      return isResize;
    };

    _proto.isNeededResize = function isNeededResize() {
      return this._calcSize() !== this._size.viewport;
    };

    _proto.clear = function clear() {
      this.container.innerHTML = "";
      this.container.style[this.options.horizontal ? "width" : "height"] = "";
      this._size = {
        item: null,
        viewport: -1,
        container: -1,
        view: -1
      };
    };

    _proto.destroy = function destroy() {
      this.clear();
      var container = this.options.container;

      for (var p in this._orgStyle) {
        this[container ? "view" : "container"].style[p] = this._orgStyle[p];
      }

      container && this.container.parentNode.removeChild(this.container);
    };

    return DOMRenderer;
  }();

  var Watcher =
  /*#__PURE__*/
  function () {
    function Watcher(view, options) {
      _extends(this.options = {
        container: view,
        resize: function resize() {},
        check: function check() {},
        isOverflowScroll: false,
        horizontal: false
      }, options);

      this._timer = {
        resize: null // doubleCheck: null,
        // doubleCheckCount: RETRY,

      };
      this.reset();
      this._containerOffset = 0;
      this._view = view;
      this._scrollIssue = IS_IOS;
      this._onCheck = this._onCheck.bind(this);
      this._onResize = this._onResize.bind(this);
      this.attachEvent();
      this.resize();
      this.setScrollPos();
    }

    var _proto = Watcher.prototype;

    _proto.getStatus = function getStatus() {
      return {
        _prevPos: this._prevPos,
        scrollPos: this.getOrgScrollPos()
      };
    };

    _proto.setStatus = function setStatus(status, applyScrollPos) {
      if (applyScrollPos === void 0) {
        applyScrollPos = true;
      }

      this._prevPos = status._prevPos;
      applyScrollPos && this.scrollTo(status.scrollPos);
    };

    _proto.scrollBy = function scrollBy$$1(pos) {
      var arrPos = this.options.horizontal ? [pos, 0] : [0, pos];

      scrollBy.apply(void 0, [this._view].concat(arrPos));

      this.setScrollPos();
    };

    _proto.scrollTo = function scrollTo$$1(pos) {
      var arrPos = this.options.horizontal ? [pos, 0] : [0, pos];

      scrollTo.apply(void 0, [this._view].concat(arrPos));
    };

    _proto.getScrollPos = function getScrollPos() {
      return this._prevPos;
    };

    _proto.setScrollPos = function setScrollPos(pos) {
      var rawPos = pos;

      if (typeof pos === "undefined") {
        rawPos = this.getOrgScrollPos();
      }

      this._prevPos = rawPos - this.getContainerOffset();
    };

    _proto.attachEvent = function attachEvent() {
      addEvent(this._view, "scroll", this._onCheck);
      addEvent(win, "resize", this._onResize);
    };

    _proto.getOrgScrollPos = function getOrgScrollPos() {
      return scroll(this._view, this.options.horizontal);
    };

    _proto.reset = function reset() {
      this._prevPos = null;
    };

    _proto._onCheck = function _onCheck() {
      var prevPos = this.getScrollPos();
      var orgScrollPos = this.getOrgScrollPos();
      this.setScrollPos(orgScrollPos);
      var scrollPos = this.getScrollPos();

      if (prevPos === null || this._scrollIssue && orgScrollPos === 0 || prevPos === scrollPos) {
        orgScrollPos && (this._scrollIssue = false);
        return;
      }

      this._scrollIssue = false;
      this.options.check({
        isForward: prevPos < scrollPos,
        scrollPos: scrollPos,
        orgScrollPos: orgScrollPos,
        horizontal: this.options.horizontal
      });
    };

    _proto.getContainerOffset = function getContainerOffset() {
      return this._containerOffset;
    };

    _proto._getOffset = function _getOffset() {
      var _this$options = this.options,
          container = _this$options.container,
          horizontal = _this$options.horizontal;
      var rect = container.getBoundingClientRect();
      return rect[horizontal ? "left" : "top"] + this.getOrgScrollPos();
    };

    _proto.resize = function resize() {
      this._containerOffset = this.options.isOverflowScroll ? 0 : this._getOffset();
    };

    _proto._onResize = function _onResize() {
      var _this = this;

      if (this._timer.resize) {
        clearTimeout(this._timer.resize);
      }

      this._timer.resize = setTimeout(function () {
        _this.resize();

        _this.options.resize();

        _this._timer.resize = null;

        _this.reset();
      }, 100);
    };

    _proto.detachEvent = function detachEvent() {
      removeEvent(this._view, "scroll", this._onCheck);
      removeEvent(win, "resize", this._onResize);
    };

    _proto.destroy = function destroy() {
      this.detachEvent();
      this.reset();
    };

    return Watcher;
  }();

  function isVisible(group, threshold, scrollPos, endScrollPos) {
    var items = group.items,
        outlines = group.outlines;
    var start = outlines.start;
    var end = outlines.end;

    if (start.legnth === 0 || end.length === 0 || !items.length || !items[0].el) {
      return 2;
    }

    var min = Math.min.apply(Math, start);
    var max = Math.max.apply(Math, end);

    if (endScrollPos + threshold < min) {
      return +1;
    } else if (scrollPos - threshold > max) {
      return -1;
    }

    return 0;
  }

  var Infinite =
  /*#__PURE__*/
  function () {
    function Infinite(itemManger, options) {
      this.options = _extends({
        useRecycle: true,
        threshold: 100,
        append: function append() {},
        prepend: function prepend() {},
        recycle: function recycle() {}
      }, options);
      this._items = itemManger;
      this.clear();
    }

    var _proto = Infinite.prototype;

    _proto.setSize = function setSize(size) {
      this._status.size = size;
    };

    _proto.recycle = function recycle(scrollPos, isForward) {
      if (!this.options.useRecycle) {
        return;
      }

      var _this$_status = this._status,
          startCursor = _this$_status.startCursor,
          endCursor = _this$_status.endCursor,
          size = _this$_status.size;

      if (startCursor === -1 || endCursor === -1) {
        return;
      }

      var endScrollPos = scrollPos + size;
      var _this$options = this.options,
          threshold = _this$options.threshold,
          recycle = _this$options.recycle;

      var visibles = this._items.get(startCursor, endCursor).map(function (group) {
        return isVisible(group, threshold, scrollPos, endScrollPos);
      });

      var length = visibles.length;
      var start = isForward ? 0 : visibles.lastIndexOf(0);
      var end = isForward ? visibles.indexOf(0) - 1 : visibles.length - 1;

      if (!isForward && start !== -1) {
        start += 1;
      }

      if (start < 0 || end < 0 || start > end || end - start + 1 >= length) {
        return;
      }

      start = startCursor + start;
      end = startCursor + end;
      recycle({
        start: start,
        end: end
      });

      if (isForward) {
        this.setCursor("start", end + 1);
      } else {
        this.setCursor("end", start - 1);
      }
    };

    _proto.scroll = function scroll(scrollPos) {
      var startCursor = this.getCursor("start");
      var endCursor = this.getCursor("end");
      var items = this._items;

      if (typeof scrollPos !== "number" || startCursor === -1 || endCursor === -1 || !items.size()) {
        return;
      }

      var size = this._status.size;
      var _this$options2 = this.options,
          threshold = _this$options2.threshold,
          append = _this$options2.append,
          prepend = _this$options2.prepend;
      var datas = items.get();
      var endScrollPos = scrollPos + size;
      var startEdgePos = Math.max.apply(Math, datas[startCursor].outlines.start);
      var endEdgePos = Math.min.apply(Math, datas[endCursor].outlines.end);
      var visibles = datas.map(function (group, i) {
        var _group$outlines = group.outlines,
            start = _group$outlines.start,
            end = _group$outlines.end;

        if (!start.length || !end.length) {
          return false;
        }

        var startPos = Math.min.apply(Math, start);
        var endPos = Math.max.apply(Math, end);

        if (startPos - threshold <= endScrollPos && scrollPos <= endPos + threshold) {
          return true;
        }

        return false;
      });
      var start = visibles.indexOf(true);
      var end = visibles.lastIndexOf(true);

      if (~start && start < startCursor) {
        prepend({
          cache: datas.slice(start, Math.min(startCursor, end + 1))
        });
      } else if (endCursor < end) {
        append({
          cache: datas.slice(Math.max(start, endCursor + 1), end + 1)
        });
      } else if (endScrollPos >= endEdgePos - threshold) {
        append({
          cache: datas.slice(endCursor + 1, endCursor + 2)
        });
      } else if (scrollPos <= startEdgePos + threshold) {
        prepend({
          cache: datas.slice(startCursor - 1, startCursor)
        });
      }
    };

    _proto.setCursor = function setCursor(cursor, index) {
      var status = this._status;
      var items = this._items;
      var size = items.size();

      if (!this.options.useRecycle) {
        status.startCursor = 0;

        if (items.getOutline(size - 1, "end").length) {
          status.endCursor = size - 1;
          return;
        }

        if (cursor !== "end") {
          return;
        }
      }

      if (cursor === "start") {
        status.startCursor = index;
      } else {
        status.endCursor = Math.min(size - 1, index);
      }

      status.startCursor = Math.max(0, status.startCursor);
    };

    _proto.setStatus = function setStatus(status) {
      this._status = _extends(this._status, status);
    };

    _proto.getStatus = function getStatus(startKey, endKey) {
      var _this$_status2 = this._status,
          startCursor = _this$_status2.startCursor,
          endCursor = _this$_status2.endCursor,
          size = _this$_status2.size;
      var startIndex = Math.max(this._items.indexOf(startKey), 0);
      var endIndex = (this._items.indexOf(endKey) + 1 || this._items.size()) - 1;
      var start = Math.max(startCursor - startIndex, ~startCursor ? 0 : -1);
      var end = Math.max(Math.min(endCursor - startIndex, endIndex - startIndex), start);
      return {
        startCursor: start,
        endCursor: end,
        size: size
      };
    };

    _proto.getEdgeOutline = function getEdgeOutline(cursor) {
      var _this$_status3 = this._status,
          startCursor = _this$_status3.startCursor,
          endCursor = _this$_status3.endCursor;

      if (startCursor === -1 || endCursor === -1) {
        return [];
      }

      return this._items.getOutline(cursor === "start" ? startCursor : endCursor, cursor);
    };

    _proto.getEdgeValue = function getEdgeValue(cursor) {
      var outlines = this.getEdgeOutline(cursor);
      return outlines.length ? Math[cursor === "start" ? "min" : "max"].apply(Math, outlines) : 0;
    };

    _proto.getVisibleItems = function getVisibleItems() {
      return this._items.pluck("items", this._status.startCursor, this._status.endCursor);
    };

    _proto.getCursor = function getCursor(cursor) {
      return this._status[cursor === "start" ? "startCursor" : "endCursor"];
    };

    _proto.getVisibleData = function getVisibleData() {
      return this._items.get(this._status.startCursor, this._status.endCursor);
    };

    _proto.remove = function remove(element) {
      return this._items.remove(element, this._status.startCursor, this._status.endCursor);
    };

    _proto.clear = function clear() {
      this._status = {
        startCursor: -1,
        endCursor: -1,
        size: -1
      };
    };

    return Infinite;
  }();

  var elements = [];
  /* eslint-disable */

  function onResize(e) {
    AutoSizer.resizeAll();
  }
  /* eslint-enable */


  var AutoSizer =
  /*#__PURE__*/
  function () {
    function AutoSizer() {}

    AutoSizer.add = function add(element, prefix) {
      if (prefix === void 0) {
        prefix = "data-";
      }

      if (!element.length) {
        addEvent(win, "resize", onResize);
      }

      element.__PREFIX__ = prefix;
      elements.push(element);
      AutoSizer.resize(element);
    };

    AutoSizer.remove = function remove(element, isFixed) {
      if (isFixed === void 0) {
        isFixed = false;
      }

      var fixed = element.getAttribute(element.__PREFIX__ + "fixed") || "width";

      if (!isFixed) {
        element.style[fixed === "width" ? "height" : "width"] = "";
      }

      var index = elements.indexOf(element);

      if (!~index) {
        return;
      }

      elements.splice(index, 1);

      if (!elements.length) {
        removeEvent(win, "reisze", onResize);
      }
    };

    AutoSizer.resize = function resize(element, prefix) {
      if (prefix === void 0) {
        prefix = "data-";
      }

      var elementPrefix = typeof element.__PREFIX__ === "string" ? element.__PREFIX__ : prefix;
      var dataWidth = element.getAttribute(elementPrefix + "width");
      var dataHeight = element.getAttribute(elementPrefix + "height");
      var fixed = element.getAttribute(elementPrefix + "fixed");

      if (fixed === "height") {
        var size = innerHeight(element) || dataHeight;
        element.style.width = dataWidth / dataHeight * size + "px";
      } else {
        var _size = innerWidth(element) || dataWidth;

        element.style.height = dataHeight / dataWidth * _size + "px";
      }
    };

    AutoSizer.resizeAll = function resizeAll() {
      elements.forEach(function (element) {
        return AutoSizer.resize(element);
      });
    };

    return AutoSizer;
  }();

  var CHECK_ALL = 1;
  var CHECK_ONLY_ERROR = 2;

  function isDataAttribute(target, prefix) {
    return !!target.getAttribute(prefix + "width");
  }

  var ImageLoaded =
  /*#__PURE__*/
  function () {
    function ImageLoaded() {}

    ImageLoaded.waitImageLoaded = function waitImageLoaded(needCheck, _ref) {
      var _ref$prefix = _ref.prefix,
          prefix = _ref$prefix === void 0 ? "" : _ref$prefix,
          length = _ref.length,
          type = _ref.type,
          complete = _ref.complete,
          error = _ref.error,
          end = _ref.end;
      var checkCount = 0;
      var endCount = length;

      if (type !== CHECK_ONLY_ERROR) {
        checkCount = endCount;
      }

      var checkEnd = function checkEnd() {
        if (--endCount !== 0) {
          return;
        }

        end && end();
      };

      var checkImage = function checkImage() {
        checkCount--;

        if (checkCount !== 0) {
          return;
        }

        complete && complete();
      };

      var onError = function onError(target, itemIndex) {
        if (itemIndex === void 0) {
          itemIndex = target.__ITEM_INDEX__;
        }

        error && error({
          target: target,
          itemIndex: itemIndex
        });
      };

      var onCheck = function onCheck(e) {
        var target = e.target || e.srcElement;
        removeEvent(target, "error", onCheck);
        removeEvent(target, "load", onCheck);

        if (type === CHECK_ALL && isDataAttribute(target, prefix)) {
          AutoSizer.remove(target, e.type === "error");
        } else {
          checkImage();
        }

        if (e.type === "error") {
          onError(target);
        }

        delete target.__ITEM_INDEX__;
        checkEnd();
      };

      needCheck.forEach(function (images, i) {
        images.forEach(function (v) {
          // workaround for IE
          if (v.complete && (!IS_IE || IS_IE && v.naturalWidth)) {
            if (!v.naturalWidth) {
              onError(v, i);
            }

            checkImage();
            checkEnd();
            return;
          }

          v.__ITEM_INDEX__ = i;

          if (type === CHECK_ALL && isDataAttribute(v, prefix)) {
            AutoSizer.add(v, prefix);
            checkImage();
          }

          addEvent(v, "load", onCheck);
          addEvent(v, "error", onCheck);
          IS_IE && v.setAttribute("src", v.getAttribute("src"));
        });
      });
    };

    ImageLoaded.checkImageLoaded = function checkImageLoaded(el) {
      if (el.tagName === "IMG") {
        return el.complete ? [] : [el];
      } else {
        return toArray(el.querySelectorAll("img"));
      }
    };

    ImageLoaded.check = function check(elements, _ref2) {
      var _this = this;

      var prefix = _ref2.prefix,
          _ref2$type = _ref2.type,
          type = _ref2$type === void 0 ? CHECK_ALL : _ref2$type,
          complete = _ref2.complete,
          error = _ref2.error,
          end = _ref2.end;
      var images = elements.map(function (element) {
        return _this.checkImageLoaded(element);
      });
      var length = images.reduce(function (sum, element) {
        return sum + element.length;
      }, 0);

      if (type === CHECK_ONLY_ERROR || length === 0) {
        // convert to async
        setTimeout(function () {
          complete && complete();

          if (length === 0) {
            end && end();
          }
        }, 0);
      }

      if (length > 0) {
        setTimeout(function () {
          _this.waitImageLoaded(images, {
            prefix: prefix,
            length: length,
            type: type,
            complete: complete,
            error: error,
            end: end
          });
        }, 0);
      }
    };

    return ImageLoaded;
  }();

  function hasTarget(target, value) {
    return ~target.indexOf(value);
  }

  var LayoutMananger =
  /*#__PURE__*/
  function () {
    function LayoutMananger(items, renderer, options) {
      if (options === void 0) {
        options = {};
      }

      _extends(this.options = {
        attributePrefix: "data-",
        isEqualSize: false,
        isConstantSize: false,
        horizontal: false
      }, options);

      this._items = items;
      this._renderer = renderer;
      this._layout = null;
    }

    var _proto = LayoutMananger.prototype;

    _proto.setLayout = function setLayout(layout) {
      this._layout = layout;
    };

    _proto.setSize = function setSize(size) {
      this._layout.setSize(size);
    };

    _proto._complete = function _complete(groups, items, isAppend, isUpdate, callback) {
      var _this = this;

      var itemManager = this._items;
      var cursor = isAppend ? "end" : "start";
      var groupIndex = itemManager.indexOf(groups[0]);
      var prevGroup = itemManager.getData(groupIndex + (isAppend ? -1 : 1));
      var outline = prevGroup ? prevGroup.outlines[cursor] : [0];

      this._renderer.updateSize(items);

      var groupInfos = groups.map(function (group) {
        var groupOutline = group.outlines[isAppend ? "start" : "end"];
        var isRelayout = isUpdate || !outline.length || (outline.length === groupOutline.length ? !outline.every(function (v, index) {
          return v === groupOutline[index];
        }) : true);

        if (!isRelayout) {
          outline = group.outlines[isAppend ? "end" : "start"];
          DOMRenderer.renderItems(group.items);
          return group;
        }

        var groupItems = group.items;

        var groupInfo = _this._layout[isAppend ? "append" : "prepend"](groupItems, outline, true);

        _extends(group, groupInfo);

        DOMRenderer.renderItems(groupInfo.items);
        outline = groupInfo.outlines[isAppend ? "end" : "start"];
        return groupInfo;
      });
      callback({
        groups: groupInfos,
        items: items,
        isAppend: isAppend
      });
    };

    _proto._error = function _error(removeTarget, replaceTarget, target, items, errorIndex, callback) {
      var item = items[errorIndex];
      var element = item.el;
      var prefix = this.options.attributePrefix; // remove item

      var removeItem = function removeItem() {
        if (hasTarget(removeTarget, element)) {
          return;
        }

        removeTarget.push(element);
        var index = replaceTarget.indexOf(errorIndex);
        index !== -1 && replaceTarget.splice(index, 1);
      }; // remove image


      var remove = function remove() {
        if (target === element) {
          removeItem();
          return;
        }

        if (hasTarget(removeTarget, element)) {
          return;
        }

        target.parentNode.removeChild(target);
        item.content = element.outerHTML;

        if (hasTarget(replaceTarget, errorIndex)) {
          return;
        }

        replaceTarget.push(errorIndex);
      }; // replace image


      var replace = function replace(src) {
        if (hasTarget(removeTarget, element)) {
          return;
        }

        if (src) {
          if (matchHTML(src) || typeof src === "object") {
            var parentNode = target.parentNode;
            parentNode.insertBefore($(src), target);
            parentNode.removeChild(target);
            item.content = element.outerHTML;
          } else {
            target.src = src;

            if (target.getAttribute(prefix + "width")) {
              AutoSizer.remove(target);
              target.removeAttribute(prefix + "width");
              target.removeAttribute(prefix + "height");
            }
          }
        }

        item.content = element.outerHTML;

        if (hasTarget(replaceTarget, errorIndex)) {
          return;
        }

        replaceTarget.push(errorIndex);
      }; // replace item


      var replaceItem = function replaceItem(content) {
        if (hasTarget(removeTarget, element)) {
          return;
        }

        element.innerHTML = content;
        item.content = element.outerHTML;

        if (hasTarget(replaceTarget, errorIndex)) {
          return;
        }

        replaceTarget.push(errorIndex);
      };

      callback({
        target: target,
        element: element,
        items: items,
        item: item,
        itemIndex: errorIndex,
        replace: replace,
        replaceItem: replaceItem,
        remove: remove,
        removeItem: removeItem
      });
    };

    _proto._end = function _end(removeTarget, replaceTarget, items, callback) {
      var _this2 = this;

      var attributePrefix = this.options.attributePrefix;
      var removeTargetLength = removeTarget.length;
      var replaceTargetLength = replaceTarget.length;

      if (!removeTargetLength && !replaceTargetLength) {
        callback({
          remove: []
        });
        return;
      }

      var layoutedItems = replaceTarget.map(function (itemIndex) {
        return items[itemIndex];
      });

      if (!replaceTargetLength) {
        callback({
          remove: removeTarget,
          layout: true
        });
        return;
      } // wait layoutComplete beacause of error event.


      ImageLoaded.check(layoutedItems.map(function (v) {
        return v.el;
      }), {
        prefix: attributePrefix,
        complete: function complete() {
          _this2._renderer.updateSize(layoutedItems);

          callback({
            remove: removeTarget,
            layout: true
          });
        }
      });
    };

    _proto._insert = function _insert(_ref, _ref2) {
      var _this3 = this;

      var groups = _ref.groups,
          _ref$items = _ref.items,
          items = _ref$items === void 0 ? ItemManager.pluck(groups, "items") : _ref$items,
          isAppend = _ref.isAppend,
          isUpdate = _ref.isUpdate;

      var _ref2$error = _ref2.error,
          _error2 = _ref2$error === void 0 ? function () {} : _ref2$error,
          _ref2$complete = _ref2.complete,
          _complete2 = _ref2$complete === void 0 ? function () {} : _ref2$complete,
          _ref2$end = _ref2.end,
          _end2 = _ref2$end === void 0 ? function () {} : _ref2$end;

      if (!groups.length) {
        return;
      }

      var checkGroups = isAppend ? groups : groups.reverse();
      var replaceTarget = [];
      var removeTarget = [];
      var elements = items.map(function (item) {
        return item.el;
      });
      var type = this.options.isEqualSize && this._renderer._size.item ? CHECK_ONLY_ERROR : CHECK_ALL;
      var prefix = this.options.attributePrefix;
      ImageLoaded.check(elements, {
        prefix: prefix,
        type: type,
        complete: function complete() {
          if (!_this3._items) {
            return;
          }

          _this3._complete(checkGroups, items, isAppend, isUpdate, _complete2);
        },
        error: function error(_ref3) {
          var target = _ref3.target,
              itemIndex = _ref3.itemIndex;

          if (!_this3._items) {
            return;
          }

          _this3._error(removeTarget, replaceTarget, target, items, itemIndex, _error2);
        },
        end: function end() {
          if (!_this3._items) {
            return;
          }

          _this3._end(removeTarget, replaceTarget, items, _end2);
        }
      });
    };

    _proto.append = function append(_ref4, callbacks) {
      var groups = _ref4.groups,
          items = _ref4.items,
          isUpdate = _ref4.isUpdate;

      if (callbacks === void 0) {
        callbacks = {};
      }

      this._insert({
        groups: groups,
        items: items,
        isUpdate: isUpdate,
        isAppend: true
      }, callbacks);
    };

    _proto.prepend = function prepend(_ref5, callbacks) {
      var groups = _ref5.groups,
          items = _ref5.items,
          isUpdate = _ref5.isUpdate;

      if (callbacks === void 0) {
        callbacks = {};
      }

      this._insert({
        groups: groups,
        items: items,
        isUpdate: isUpdate,
        isAppend: false
      }, callbacks);
    };

    _proto.layout = function layout(isRelayout, groups, items) {
      var renderer = this._renderer;
      var _renderer$options = renderer.options,
          isEqualSize = _renderer$options.isEqualSize,
          isConstantSize = _renderer$options.isConstantSize;
      var layoutGroups = groups.filter(function (group) {
        var item = group.items[0];
        return item.orgSize && item.rect.top > DUMMY_POSITION / 10;
      });

      if (!layoutGroups.length) {
        return [];
      }

      var outline = layoutGroups[0].outlines.start;

      if (isRelayout) {
        outline = [outline.length ? Math.min.apply(Math, outline) : 0];

        if (!isConstantSize && items.length) {
          renderer.updateSize(items); // update invisible items' size

          if (isEqualSize && items[0].size) {
            ItemManager.pluck(layoutGroups, "items").forEach(function (item) {
              item.size = _extends({}, items[0].size);
            });
          }
        }
      }

      this._layout.layout(layoutGroups, outline);

      return layoutGroups;
    };

    _proto.destroy = function destroy() {
      this._items = null;
      this._renderer = null;
    };

    return LayoutMananger;
  }();

  // https://stackoverflow.com/questions/43216659/babel-ie8-inherit-issue-with-object-create

  /* eslint-disable */

  if (typeof Object.create !== "function") {
    Object.create = function (o, properties) {
      if (typeof o !== "object" && typeof o !== "function") {
        throw new TypeError("Object prototype may only be an Object: " + o);
      } else if (o === null) {
        throw new Error("This browser's implementation of Object.create is a shim and doesn't support 'null' as the first argument.");
      }

      function F() {}

      F.prototype = o;
      return new F();
    };
  }
  /* eslint-enable */

  /**
   * A module used to arrange card elements including content infinitely according to layout type. With this module, you can implement various layouts composed of different card elements whose sizes vary. It guarantees performance by maintaining the number of DOMs the module is handling under any circumstance
   * @ko 콘텐츠가 있는 카드 엘리먼트를 레이아웃 타입에 따라 무한으로 배치하는 모듈. 다양한 크기의 카드 엘리먼트를 다양한 레이아웃으로 배치할 수 있다. 카드 엘리먼트의 개수가 계속 늘어나도 모듈이 처리하는 DOM의 개수를 일정하게 유지해 최적의 성능을 보장한다
   * @alias eg.InfiniteGrid
   * @extends eg.Component
   *
   * @example
  ```
  <ul id="grid">
  	<li class="card">
  		<div>test1</div>
  	</li>
  	<li class="card">
  		<div>test2</div>
  	</li>
  	<li class="card">
  		<div>test3</div>
  	</li>
  	<li class="card">
  		<div>test4</div>
  	</li>
  	<li class="card">
  		<div>test5</div>
  	</li>
  	<li class="card">
  		<div>test6</div>
  	</li>
  </ul>
  <script>
  var some = new eg.InfiniteGrid("#grid").on("layoutComplete", function(e) {
  	// ...
  });

  // If you already have items in the container, call "layout" method.
  some.layout();
  </script>
  ```
   *
   * @support {"ie": "8+", "ch" : "latest", "ff" : "latest",  "sf" : "latest", "edge" : "latest", "ios" : "7+", "an" : "2.1+ (except 3.x)"}
   **/


  var InfiniteGrid =
  /*#__PURE__*/
  function () {
    var InfiniteGrid =
    /*#__PURE__*/
    function (_Component) {
      _inheritsLoose(InfiniteGrid, _Component);

      /**
      * Version info string
      * @ko 버전정보 문자열
      * @name VERSION
      * @static
      * @type {String}
      * @example
      * eg.InfiniteGrid.VERSION;  // ex) 3.3.3
      * @memberof eg.InfiniteGrid
      */

      /**
       * @param {HTMLElement|String|jQuery} element A base element for a module <ko>모듈을 적용할 기준 엘리먼트</ko>
       * @param {Object} [options] The option object of the eg.InfiniteGrid module <ko>eg.InfiniteGrid 모듈의 옵션 객체</ko>
       * @param {String} [options.itemSelector] A selector to select card elements that make up the layout<ko>레이아웃을 구성하는 카드 엘리먼트를 선택할 선택자(selector)</ko>
       * @param {Boolean} [options.useRecycle=true] Indicates whether keep the number of DOMs is maintained. If the useRecycle value is 'true', keep the number of DOMs is maintained. If the useRecycle value is 'false', the number of DOMs will increase as card elements are added. <ko>DOM의 수를 유지할지 여부를 나타낸다. useRecycle 값이 'true'이면 DOM 개수를 일정하게 유지한다. useRecycle 값이 'false' 이면 카드 엘리먼트가 추가될수록 DOM 개수가 계속 증가한다.</ko>
       * @param {Boolean} [options.isOverflowScroll=false] Indicates whether overflow:scroll is applied<ko>overflow:scroll 적용여부를 결정한다.</ko>
       * @param {Boolean} [options.horizontal=false] Direction of the scroll movement (true: horizontal, false: vertical) <ko>스크롤 이동 방향 (true 가로방향, false 세로방향)</ko>
       * @param {Boolean} [options.useFit=true] The useFit option scrolls upwards so that no space is visible until an item is added <ko>위로 스크롤할 시 아이템을 추가하는 동안 보이는 빈 공간을 안보이게 한다.</ko>
       * @param {Boolean} [options.isEqualSize=false] Indicates whether sizes of all card elements are equal to one another. If sizes of card elements to be arranged are all equal and this option is set to "true", the performance of layout arrangement can be improved. <ko>카드 엘리먼트의 크기가 동일한지 여부. 배치될 카드 엘리먼트의 크기가 모두 동일할 때 이 옵션을 'true'로 설정하면 레이아웃 배치 성능을 높일 수 있다</ko>
       * @param {Boolean} [options.isConstantSize=false] Indicates whether sizes of all card elements does not change, the performance of layout arrangement can be improved. <ko>모든 카드 엘리먼트의 크기가 불변일 때 이 옵션을 'true'로 설정하면 레이아웃 배치 성능을 높일 수 있다</ko>
       * @param {Number} [options.transitionDruation=0] Indicates how many seconds a transition effect takes to complete. <ko>트랜지션 효과를 완료하는데 걸리는 시간을 나타낸다.</ko>
       * @param {Number} [options.threshold=100] The threshold size of an event area where card elements are added to a layout.<ko>레이아웃에 카드 엘리먼트를 추가하는 이벤트가 발생하는 기준 영역의 크기.</ko>
       * @param {String} [options.attributePrefix="data-"] The prefix to use element's data attribute.<ko>엘리먼트의 데이타 속성에 사용할 접두사.</ko>
       */
      function InfiniteGrid(element, options) {
        var _this;

        _this = _Component.call(this) || this;

        _extends(_this.options = {
          itemSelector: "*",
          isOverflowScroll: false,
          threshold: 100,
          isEqualSize: false,
          isConstantSize: false,
          useRecycle: true,
          horizontal: false,
          transitionDuration: 0,
          useFit: true,
          attributePrefix: "data-"
        }, options);

        DEFENSE_BROWSER && (_this.options.useFit = false);
        IS_ANDROID2 && (_this.options.isOverflowScroll = false);

        _this._reset();

        _this._loadingBar = {};
        var _this$options = _this.options,
            isOverflowScroll = _this$options.isOverflowScroll,
            isEqualSize = _this$options.isEqualSize,
            isConstantSize = _this$options.isConstantSize,
            horizontal = _this$options.horizontal,
            threshold = _this$options.threshold,
            useRecycle = _this$options.useRecycle;
        _this._items = new ItemManager();
        _this._renderer = new DOMRenderer(element, {
          isEqualSize: isEqualSize,
          isConstantSize: isConstantSize,
          horizontal: horizontal,
          container: isOverflowScroll
        });
        _this._watcher = new Watcher(_this._renderer.view, {
          isOverflowScroll: isOverflowScroll,
          horizontal: horizontal,
          container: _this._renderer.container,
          resize: function resize() {
            return _this._onResize();
          },
          check: function check(param) {
            return _this._onCheck(param);
          }
        });
        _this._infinite = new Infinite(_this._items, {
          horizontal: horizontal,
          useRecycle: useRecycle,
          threshold: threshold,
          append: function append(param) {
            return _this._requestAppend(param);
          },
          prepend: function prepend(param) {
            return _this._requestPrepend(param);
          },
          recycle: function recycle(param) {
            return _this._recycle(param);
          }
        });
        return _this;
      }
      /**
       * Adds a card element at the bottom of a layout. This method is available only if the isProcessing() method returns false.
       * @ko 카드 엘리먼트를 레이아웃 아래에 추가한다. isProcessing() 메서드의 반환값이 'false'일 때만 이 메서드를 사용할 수 있다
       * 이 메소드는 isProcessing()의 반환값이 false일 경우에만 사용 가능하다.
       * @param {Array|jQuery} elements Array of the card elements to be added <ko>추가할 카드 엘리먼트의 배열</ko>
       * @param {Number|String} [groupKey] The group key to be configured in a card element. It is automatically generated by default.
       * <ko>추가할 카드 엘리먼트에 설정할 그룹 키. 생략하면 값이 자동으로 생성된다.</ko>
       * @return {eg.InfiniteGrid} An instance of a module itself<ko>모듈 자신의 인스턴스</ko>
       * @example
       * infinitegrid.append("&lt;div class='item'&gt;test1&lt;/div&gt;&lt;div class='item'&gt;test2&lt;/div&gt;");
       * infinitegrid.append(["&lt;div class='item'&gt;test1&lt;/div&gt;", "&lt;div class='item'&gt;test2&lt;/div&gt;"]);
       * infinitegrid.append([HTMLElement1, HTMLElement2]);
       * infinitegrid.append(jQuery(["&lt;div class='item'&gt;test1&lt;/div&gt;", "&lt;div class='item'&gt;test2&lt;/div&gt;"]));
       */


      var _proto = InfiniteGrid.prototype;

      _proto.append = function append(elements, groupKey) {
        this._manager && this._insert({
          elements: elements,
          isAppend: APPEND,
          groupKey: groupKey
        });
        return this;
      };
      /**
       * Adds a card element at the top of a layout. This method is available only if the isProcessing() method returns false.
       * @ko 카드 엘리먼트를 레이아웃의 위에 추가한다. isProcessing() 메서드의 반환값이 'false'일 때만 이 메서드를 사용할 수 있다
       * @param {Array|jQuery} elements Array of the card elements to be added <ko>추가할 카드 엘리먼트 배열</ko>
       * @param {Number|String} [groupKey] The group key to be configured in a card element. It is automatically generated by default.
       * <ko>추가할 카드 엘리먼트에 설정할 그룹 키. 생략하면 값이 자동으로 생성된다.</ko>
       * @return {eg.InfiniteGrid} An instance of a module itself<ko>모듈 자신의 인스턴스</ko>
       * @example
       * infinitegrid.prepend("&lt;div class='item'&gt;test1&lt;/div&gt;&lt;div class='item'&gt;test2&lt;/div&gt;");
       * infinitegrid.prepend(["&lt;div class='item'&gt;test1&lt;/div&gt;", "&lt;div class='item'&gt;test2&lt;/div&gt;"]);
       * infinitegrid.prepend([HTMLElement1, HTMLElement2]);
       * infinitegrid.prepend(jQuery(["&lt;div class='item'&gt;test1&lt;/div&gt;", "&lt;div class='item'&gt;test2&lt;/div&gt;"]));
       */


      _proto.prepend = function prepend(elements, groupKey) {
        this._manager && this._insert({
          elements: elements,
          isAppend: PREPEND,
          groupKey: groupKey
        });
        return this;
      };
      /**
       * Specifies the Layout class to use.
       * @ko 사용할 Layout 클래스를 지정한다.
       * @param {Class|Object} LayoutKlass The Layout class to use or an instance of a layout moudle<ko>사용할 Layout 클래스 또는 레이아웃 모듈의 인스턴스</ko>
       * @param {Object} options Options to apply to the Layout.<ko>Layout에 적용할 옵션</ko>
       * @return {eg.InfiniteGrid} An instance of a module itself<ko>모듈 자신의 인스턴스</ko>
       * @example
       * infinitegrid.setLayout(eg.InfiniteGrid.GridLayout, {
       *  margin: 10,
       *  align: "start"
       * });
        * infinitegrid.setLayout(eg.InfiniteGrid.JustifiedLayout, {
       *  margin: 10,
       *  minSize: 100,
       *  maxSize: 200
       * });
        * infinitegrid.setLayout(eg.InfiniteGrid.SquareLayout, {
       *  margin: 10,
       *  column: 2
       * });
       * infinitegrid.setLayout(eg.InfiniteGrid.FrameLayout, {
       *  margin: 10,
       *  frame: [
       *   [1, 2],
        *   [4, 3],
       *  ]
       * });
       * infinitegrid.setLayout(eg.InfiniteGrid.PackingLayout, {
       *  margin: 10,
       *  aspectRatio: 1.5
       * });
       * var layout = new eg.InfiniteGrid.GridLayout({
       * 	margin: 10,
       *	align: "start"
       * });
       * infinitegrid.setLayout(layout);
       */


      _proto.setLayout = function setLayout(LayoutKlass, options) {
        if (options === void 0) {
          options = {};
        }

        var _this$options2 = this.options,
            isEqualSize = _this$options2.isEqualSize,
            isConstantSize = _this$options2.isConstantSize,
            attributePrefix = _this$options2.attributePrefix,
            horizontal = _this$options2.horizontal;

        if (!this._manager) {
          this._manager = new LayoutMananger(this._items, this._renderer, {
            attributePrefix: attributePrefix,
            isEqualSize: isEqualSize,
            isConstantSize: isConstantSize
          });
        }

        if (typeof LayoutKlass === "function") {
          this._manager.setLayout(new LayoutKlass(_extends(options, {
            horizontal: horizontal
          })));
        } else {
          LayoutKlass.options.horizontal = horizontal;

          this._manager.setLayout(LayoutKlass);
        }

        this._renderer.resize();

        this._setSize(this._renderer.getViewportSize());

        return this;
      };

      _proto._setSize = function _setSize(size) {
        this._infinite.setSize(this._renderer.getViewSize());

        this._manager.setSize(size);
      };
      /**
       * Returns the layouted items.
       * @ko 레이아웃된 아이템들을 반환한다.
       * @param {Boolean} includeCached Indicates whether to include the cached items. <ko>캐싱된 아이템을 포함할지 여부를 나타낸다.</ko>
       * @returns {Array} List of items <ko>아이템의 목록</ko>
       */


      _proto.getItems = function getItems(includeCached) {
        if (includeCached === void 0) {
          includeCached = false;
        }

        return includeCached ? this._items.pluck("items") : this._infinite.getVisibleItems();
      };

      _proto._fitItems = function _fitItems(base, margin) {
        if (margin === void 0) {
          margin = 0;
        }

        base > 0 && this._watcher.scrollBy(-base);

        this._items.fit(base, this.options.horizontal);

        DOMRenderer.renderItems(this.getItems());

        this._setContainerSize(this._getEdgeValue("end") || margin);

        base < 0 && this._watcher.scrollBy(-base);
      }; // called by visible


      _proto._fit = function _fit(useFit) {
        if (useFit === void 0) {
          useFit = this.options.useFit;
        }

        var base = this._getEdgeValue("start");

        var margin = this._getLoadingStatus() === LOADING_PREPEND && this._status.loadingSize || 0;
        var _this$options3 = this.options,
            isConstantSize = _this$options3.isConstantSize,
            isEqualSize = _this$options3.isEqualSize,
            useRecycle = _this$options3.useRecycle;

        if (!useRecycle || !useFit || isConstantSize || isEqualSize) {
          if (base < margin) {
            this._fitItems(base - margin, margin);
          }

          base = 0;
        } else if (base !== 0 || margin) {
          this._fitItems(base - margin, margin);
        } else {
          return 0;
        }

        this._isLoading() && this._renderLoading();
        return base;
      };

      _proto._getEdgeValue = function _getEdgeValue(cursor) {
        return this._infinite.getEdgeValue(cursor);
      };
      /**
       * Rearranges a layout.
       * @ko 레이아웃을 다시 배치한다.
       * @param {Boolean} [isRelayout=true] Indicates whether a card element is being relayouted <ko>카드 엘리먼트 재배치 여부</ko>
       * @return {eg.InfiniteGrid} An instance of a module itself<ko>모듈 자신의 인스턴스</ko>
       */


      _proto.layout = function layout(isRelayout) {
        if (isRelayout === void 0) {
          isRelayout = true;
        }

        if (!this._manager) {
          return this;
        }

        var renderer = this._renderer;
        var itemManager = this._items;
        var infinite = this._infinite;
        var isResize = renderer.resize();
        var items = this.getItems();
        var _this$options4 = this.options,
            isEqualSize = _this$options4.isEqualSize,
            isConstantSize = _this$options4.isConstantSize,
            transitionDuration = _this$options4.transitionDuration;
        var isLayoutAll = isRelayout && (isEqualSize || isConstantSize);
        var size = itemManager.size();

        if (isRelayout) {
          this._watcher.resize();

          if (isResize) {
            this._setSize(renderer.getViewportSize());
          }
        } // check childElement


        if (!size || !items.length) {
          var children = toArray(renderer.container.children);

          if (children.length) {
            this._insert({
              elements: children,
              isAppend: true,
              isChildren: true
            });
          } else {
            this._requestAppend({});
          }

          return this;
        } // layout datas


        var startCursor = infinite.getCursor("start");
        var endCursor = infinite.getCursor("end");
        var data = isLayoutAll || !(isRelayout && isResize) ? itemManager.get() : itemManager.get(startCursor, endCursor); // LayoutManger interface

        this._manager.layout(isRelayout, data, isResize ? items : []);

        if (isLayoutAll) {
          this._fit();
        } else if (isRelayout && isResize) {
          itemManager.clearOutlines(startCursor, endCursor);
        }

        DOMRenderer.renderItems(items, transitionDuration);
        isRelayout && this._watcher.setScrollPos();

        this._onLayoutComplete({
          items: items,
          isAppend: APPEND,
          fromCache: CACHE,
          isTrusted: NO_TRUSTED,
          useRecycle: false,
          isLayout: true
        });

        return this;
      };
      /**
       * Removes a item element on a grid layout.
       * @ko 그리드 레이아웃의 카드 엘리먼트를 삭제한다.
       * @param {HTMLElement} item element to be removed <ko>삭제될 아이템 엘리먼트</ko>
       * @return {Object}  Removed item element <ko>삭제된 아이템 엘리먼트 정보</ko>
       */


      _proto.remove = function remove(element, isLayout) {
        if (isLayout === void 0) {
          isLayout = true;
        }

        if (element) {
          var items = this._infinite.remove(element);

          items && DOMRenderer.removeElement(element);
          isLayout && this.layout(false);
          return items;
        }

        return null;
      };
      /**
       * Returns the list of group keys which belongs to card elements currently being maintained. You can use the append() or prepend() method to configure group keys so that multiple card elements can be managed at once. If you do not use these methods to configure group keys, groupkey is automatically generated.
       * @ko 현재 유지하고 있는 카드 엘리먼트의 그룹 키 목록을 반환한다. 여러 개의 카드 엘리먼트를 묶어서 관리할 수 있도록 append() 메서드나 prepend() 메서드에서 그룹 키를 지정할 수 있다. append() 메서드나 prepend() 메서드에서 그룹 키를 지정하지 않았다면 자동으로 그룹키가 생성된다.
       * @param {Boolean} includeCached Indicates whether to include the cached groups. <ko>캐싱된 그룹을 포함할지 여부를 나타낸다.</ko>
       * @return {Array} List of group keys <ko>그룹 키의 목록</ko>
       */


      _proto.getGroupKeys = function getGroupKeys(includeCached) {
        var data = includeCached ? this._items.get() : this._infinite.getVisibleData();
        return data.map(function (v) {
          return v.groupKey;
        });
      };
      /**
       * Returns the current state of a module such as location information. You can use the setStatus() method to restore the information returned through a call to this method.
       * @ko 카드의 위치 정보 등 모듈의 현재 상태 정보를 반환한다. 이 메서드가 반환한 정보를 저장해 두었다가 setStatus() 메서드로 복원할 수 있다
       * @return {Object} State object of the eg.InfiniteGrid module<ko>eg.InfiniteGrid 모듈의 상태 객체</ko>
       */


      _proto.getStatus = function getStatus(startKey, endKey) {
        return {
          _status: _extends({}, this._status),
          _items: this._items.getStatus(startKey, endKey),
          _renderer: this._renderer.getStatus(),
          _watcher: this._watcher.getStatus(),
          _infinite: this._infinite.getStatus(startKey, endKey)
        };
      };
      /**
       * Sets the state of the eg.InfiniteGrid module with the information returned through a call to the getStatue() method.
       * @ko getStatue() 메서드가 저장한 정보로 eg.InfiniteGrid 모듈의 상태를 설정한다.
       * @param {Object} status State object of the eg.InfiniteGrid module <ko>eg.InfiniteGrid 모듈의 상태 객체</ko>
       * @param {boolean} [applyScrollPos=true] Checks whether to scroll<ko>스크롤의 위치를 복원할지 결정한다.</ko>
       * @return {eg.InfiniteGrid} An instance of a module itself<ko>모듈 자신의 인스턴스</ko>
       */


      _proto.setStatus = function setStatus(status, applyScrollPos) {
        if (applyScrollPos === void 0) {
          applyScrollPos = true;
        }

        if (!status) {
          return this;
        }

        var _status = status._status,
            _renderer = status._renderer,
            _items = status._items,
            _watcher = status._watcher,
            _infinite = status._infinite;

        if (!_status || !_renderer || !_items || !_watcher || !_infinite) {
          return this;
        }

        var items = this._items;
        var renderer = this._renderer;
        var watcher = this._watcher;
        var infinite = this._infinite;
        watcher.detachEvent();

        _extends(this._status, _status);

        this._status.processingStatus = IDLE;
        items.setStatus(_items);
        renderer.setStatus(_renderer);
        infinite.setStatus(_infinite);
        var visibleItems = this.getItems();
        var length = visibleItems.length;
        renderer.createAndInsert(visibleItems, true);
        var isReLayout = renderer.isNeededResize();
        watcher.setStatus(_watcher, applyScrollPos);
        watcher.attachEvent();
        var _this$options5 = this.options,
            isConstantSize = _this$options5.isConstantSize,
            isEqualSize = _this$options5.isEqualSize;

        if (!length) {
          this._requestAppend({
            cache: visibleItems.slice(0, 1)
          });
        } else if (isReLayout) {
          renderer.resize();

          this._setSize(renderer.getViewportSize());

          if (isConstantSize) {
            this.layout(true);
          } else {
            this._items.clearOutlines();

            this._postLayout({
              fromCache: true,
              groups: isEqualSize ? items.get() : infinite.getVisibleData(),
              items: visibleItems,
              newItems: visibleItems,
              isAppend: true,
              isTrusted: false
            });
          }
        } else {
          this.layout(false);
        }

        return this;
      };
      /**
       * Clears added card elements and data.
       * @ko 추가된 카드 엘리먼트와 데이터를 모두 지운다.
       * @return {eg.InfiniteGrid} An instance of a module itself<ko>모듈 자신의 인스턴스</ko>
       */


      _proto.clear = function clear() {
        this._items.clear();

        this._renderer.clear();

        this._infinite.clear();

        this._reset();

        this._appendLoadingBar();

        return this;
      };
      /**
       * Specifies the Loading Bar to use for append or prepend items.
       * @ko 아이템을 append 또는 prepend 하기 위해 사용할 로딩 바를 지정한다.
       * @param {String|Object} [userLoadingBar={}] The loading bar HTML markup or element or element selector <ko> 로딩 바 HTML 또는 element 또는 selector </ko>
       * @return {eg.InfiniteGrid} An instance of a module itself<ko>모듈 자신의 인스턴스</ko>
       */


      _proto.setLoadingBar = function setLoadingBar(userLoadingBar) {
        if (userLoadingBar === void 0) {
          userLoadingBar = {};
        }

        var loadingBarObj = typeof userLoadingBar === "object" ? userLoadingBar : {
          "append": userLoadingBar,
          "prepend": userLoadingBar
        };
        this._status.loadingSize = 0;
        this._status.loadingStyle = {};
        var loadingBar = this._loadingBar;

        for (var type in loadingBarObj) {
          loadingBar[type] = $(loadingBarObj[type]);
          loadingBar[type].className += " " + IGNORE_CLASSNAME;
        }

        this._appendLoadingBar();

        return this;
      };

      _proto._appendLoadingBar = function _appendLoadingBar() {
        var loadingBar = this._loadingBar;
        var container = this._renderer.container;

        for (var type in loadingBar) {
          container.appendChild(loadingBar[type]);
        }
      };
      /**
       * Checks whether a card element or data is being added.
       * @ko 카드 엘리먼트 추가 또는 데이터 로딩이 진행 중인지 확인한다
       * @return {Boolean} Indicates whether a card element or data is being added <ko>카드 엘리먼트 추가 또는 데이터 로딩 진행 중 여부</ko>
       */


      _proto.isProcessing = function isProcessing() {
        return this._isProcessing() || this._isLoading();
      };

      _proto._isProcessing = function _isProcessing() {
        return (this._status.processingStatus & PROCESSING) > 0;
      };

      _proto._isLoading = function _isLoading() {
        return this._getLoadingStatus() > 0;
      };

      _proto._getLoadingStatus = function _getLoadingStatus() {
        return this._status.processingStatus & (LOADING_APPEND | LOADING_PREPEND);
      };

      _proto._process = function _process(status, isAdd) {
        if (isAdd === void 0) {
          isAdd = true;
        }

        if (isAdd) {
          this._status.processingStatus |= status;
        } else {
          this._status.processingStatus -= this._status.processingStatus & status;
        }
      };

      _proto._insert = function _insert(_ref) {
        var elements = _ref.elements,
            isAppend = _ref.isAppend,
            isChildren = _ref.isChildren,
            _ref$groupKey = _ref.groupKey,
            groupKey = _ref$groupKey === void 0 ? new Date().getTime() + Math.floor(Math.random() * 1000) : _ref$groupKey;

        if (this._isProcessing() || elements.length === 0) {
          return;
        }

        var items = ItemManager.from(elements, this.options.itemSelector, {
          isAppend: isAppend,
          groupKey: groupKey,
          outlines: {
            start: [],
            end: []
          }
        });

        if (!items.length) {
          return;
        }

        var group = {
          groupKey: groupKey,
          items: items,
          outlines: {
            start: [],
            end: []
          }
        };
        var method = isAppend ? "append" : "prepend";

        this._items[method](group);

        if (!isAppend) {
          var infinite = this._infinite;
          var startCursor = infinite.getCursor("start");
          var endCursor = infinite.getCursor("end");
          infinite.setCursor("start", startCursor + 1);
          infinite.setCursor("end", endCursor + 1);
        }

        this._postLayout({
          fromCache: NO_CACHE,
          groups: [group],
          items: items,
          newItems: items,
          isAppend: isAppend,
          isChildren: isChildren,
          isTrusted: NO_TRUSTED
        });
      }; // add items, and remove items for recycling


      _proto._recycle = function _recycle(_ref2) {
        var start = _ref2.start,
            end = _ref2.end;

        if (!this.options.useRecycle) {
          return;
        }

        DOMRenderer.removeItems(this._items.pluck("items", start, end));
      };
      /**
       * Returns the element of loading bar.
       * @ko 로딩 바의 element를 반환한다.
       * @param {Boolean} [isAppend=currentLoadingBar|true] Checks whether the card element is added to the append () method. <ko>카드 엘리먼트가 append() 메서드로 추가 할 것인지 확인한다.</ko>
       * @return {Element} The element of loading bar. <ko>로딩 바의 element</ko>
       */


      _proto.getLoadingBar = function getLoadingBar(isAppend) {
        if (isAppend === void 0) {
          isAppend = this._getLoadingStatus() !== LOADING_PREPEND;
        }

        return this._loadingBar[isAppend ? "append" : "prepend"];
      };
      /**
       * Start loading for append/prepend during loading data.
       * @ko 데이터가 로딩되는 동안 append/prepend하길 위해 로딩을 시작한다.
       * @param {Boolean} [isAppend=true] Checks whether the card element is added to the append () method. <ko>카드 엘리먼트가 append() 메서드로 추가 할 것인지 확인한다.</ko>
       * @param {Object} [userStyle = {display: "block"}] custom style to apply to this loading bar for start. <ko> 로딩 시작을 위한 로딩 바에 적용할 커스텀 스타일 </ko>
       * @return {eg.InfiniteGrid} An instance of a module itself<ko>모듈 자신의 인스턴스</ko>
       */


      _proto.startLoading = function startLoading(isAppend, userStyle) {
        if (userStyle === void 0) {
          userStyle = {
            display: "block"
          };
        }

        if (this._isLoading()) {
          return this;
        }

        var type = isAppend ? "append" : "prepend";

        this._process(isAppend ? LOADING_APPEND : LOADING_PREPEND);

        if (!this._loadingBar[type]) {
          return this;
        }

        this._renderLoading(userStyle);

        this._status.loadingStyle = userStyle;

        if (!isAppend) {
          this._fit();
        } else {
          this._setContainerSize(this._getEdgeValue("end") + this._status.loadingSize);
        }

        return this;
      };

      _proto._renderLoading = function _renderLoading(userStyle) {
        if (userStyle === void 0) {
          userStyle = this._status.loadingStyle;
        }

        if (!this._isLoading()) {
          return;
        }

        var isAppend = this._getLoadingStatus() === LOADING_APPEND;
        var el = this._loadingBar[isAppend ? "append" : "prepend"];

        if (!el) {
          return;
        }

        var style = _extends({
          position: "absolute"
        }, userStyle);

        for (var property in style) {
          el.style[property] = style[property];
        }

        this._status.loadingSize = this.options.horizontal ? outerWidth(el) : outerHeight(el);
        var posName = this.options.horizontal ? "left" : "top";

        if (!(posName in style)) {
          var pos = isAppend ? this._getEdgeValue("end") : this._getEdgeValue("start") - this._status.loadingSize;
          el.style[posName] = pos + "px";
        }
      };
      /**
       * End loading after startLoading() for append/prepend
       * @ko  append/prepend하길 위해 startLoading() 호출해선 걸었던 로딩을 끝낸다.
       * @param {Object} [userStyle = {display: "none"}] custom style to apply to this loading bar for end <ko> 로딩 시작을 위한 로딩 바에 적용할 커스텀 스타일 </ko>
       * @return {eg.InfiniteGrid} An instance of a module itself<ko>모듈 자신의 인스턴스</ko>
       */


      _proto.endLoading = function endLoading(userStyle) {
        if (userStyle === void 0) {
          userStyle = {
            display: "none"
          };
        }

        if (!this._isLoading()) {
          return this;
        }

        var isAppend = this._getLoadingStatus() === LOADING_APPEND;
        var type = isAppend ? "append" : "prepend";
        var el = this._loadingBar[type];
        var status = this._status;
        var size = status.loadingSize;

        this._process(LOADING_APPEND | LOADING_PREPEND, false);

        status.loadingSize = 0;
        status.loadingStyle = {};

        if (el) {
          var _extends2;

          var style = _extends((_extends2 = {}, _extends2[this.options.horizontal ? "left" : "top"] = -size + "px", _extends2), userStyle);

          for (var property in style) {
            el.style[property] = style[property];
          }

          if (!isAppend) {
            this._fitItems(size);
          } else {
            this._setContainerSize(this._getEdgeValue("end"));
          }
        }

        if (this.options.useRecycle && !this.isProcessing()) {
          this._infinite.recycle(this._watcher.getScrollPos(), isAppend);
        }

        return this;
      };

      _proto._setContainerSize = function _setContainerSize(size) {
        this._renderer.setContainerSize(Math.max(this._items.getMaxEdgeValue(), size));
      };
      /**
       * Retrieves the item via index or the element.
       * @ko index 또는 element를 통해 아이템을 가져온다.
       * @param {number | HTMLElement} [groupIndex=0] The element corresponding to item or the index of the group where the item is in position <ko> item에 해당하는 element 또는 해당 item이 있는 group의 index</ko>
       * @param {number} [itemIndex] If groupIndex is used, the index of the item in the group <ko> groupIndex를 사용할 경우 해당 group에 있는 Item의 index </ko>
       * @return {object} The item containing the content, size and position,etc<ko>content, size, position 등이 담겨있는 item 정보</ko>
       * @example
      	 ig.getItem(0, 0);
       ig.getItem(element);
      	 {
      	el: HTMLElement,
      	content: "<div>...</div>",
      	size: {width: ..., height: ...},
      	rect: {top: ..., left: ..., width: ..., height: ...},
       }
       */


      _proto.getItem = function getItem(groupIndex, itemIndex) {
        if (groupIndex === void 0) {
          groupIndex = 0;
        }

        if (itemIndex == null && typeof groupIndex === "object") {
          if (!groupIndex) {
            return undefined;
          }

          var items = this.getItems();
          var length = items.length;

          for (var i = 0; i < length; ++i) {
            if (items[i].el === groupIndex) {
              return items[i];
            }
          }

          return undefined;
        } else {
          var group = this._items.getData(groupIndex);

          return group && group.items[itemIndex || 0];
        }
      };

      _proto._updateItem = function _updateItem(item) {
        if (item && item.el) {
          item.content = item.el.outerHTML;
          !this.options.isEqualSize && resetSize(item);

          this._renderer.updateSize([item]);

          return true;
        }

        return false;
      };
      /**
       * Updates the item via index or the element.
       * @ko index 또는 element를 통해 아이템을 업데이트한다.
       * @param {number | HTMLElement} [groupIndex=0] The element corresponding to item or the index of the group where the item is in position <ko> item에 해당하는 element 또는 해당 item이 있는 group의 index</ko>
       * @param {number} [itemIndex] If groupIndex is used, the index of the item in the group <ko> groupIndex를 사용할 경우 해당 group에 있는 Item의 index </ko>
       * @return {eg.InfiniteGrid} An instance of a module itself<ko>모듈 자신의 인스턴스</ko>
       * @example
      element.innerHTML = "2";
      element.style.height = "400px";
      ig.updateItem(element);
      ig.updateItem(0, 0);
       */


      _proto.updateItem = function updateItem(groupIndex, itemIndex) {
        var item = this.getItem(groupIndex, itemIndex);
        this._updateItem(item) && this.layout(false);
        return this;
      };
      /**
       * Update the currently displayed items.
       * 현재보여주는 아이템들을 업데이트한다.
       * @return {eg.InfiniteGrid} An instance of a module itself<ko>모듈 자신의 인스턴스</ko>
       * @example
      element.innerHTML = "2";
      element.style.height = "400px";
      	element2.innerHTML = "2";
      element2.style.height = "400px";
      	ig.updateItems();
       */


      _proto.updateItems = function updateItems() {
        var _this2 = this;

        this.getItems().forEach(function (item) {
          _this2._updateItem(item);
        });
        this.layout(false);
        return this;
      };
      /**
       * Move to some group or item position.
       * @ko 해당하는 그룹 또는 아이템의 위치로 이동한다.
       * @param {Number} [index] group's index <ko> 그룹의 index</ko>
       * @param {Number} [itemIndex=-1] item's index <ko> 그룹의 index</ko>
       * @return {eg.InfiniteGrid} An instance of a module itself<ko>모듈 자신의 인스턴스</ko>
       */


      _proto.moveTo = function moveTo(index, itemIndex) {
        if (itemIndex === void 0) {
          itemIndex = 0;
        }

        if (this.isProcessing()) {
          return this;
        }

        var data = this._items.getData(index);

        if (!data) {
          return this;
        }

        var infinite = this._infinite;
        var outlines = data.outlines;
        var items = data.items;
        var item = items[itemIndex];
        var isResize = outlines.start && outlines.start.length === 0;
        var startCursor = infinite.getCursor("start");
        var endCursor = infinite.getCursor("end");
        var isInCursor = startCursor <= index && index <= endCursor;
        var _this$options6 = this.options,
            useRecycle = _this$options6.useRecycle,
            horizontal = _this$options6.horizontal;

        if (isInCursor || !useRecycle || !isResize) {
          var pos = item ? item.rect[horizontal ? "left" : "top"] : Math.max.apply(Math, outlines.start);
          var fit = Math.min.apply(Math, outlines.start);

          if (fit < 0) {
            // base < 0
            this._fitItems(fit, 0);

            pos -= fit;
          }

          var isAppend = index > startCursor;

          if (isInCursor || isAppend) {
            this._scrollTo(pos);

            return this;
          }

          this._postLayout({
            fromCache: true,
            groups: [data],
            items: items,
            newItems: [],
            isAppend: isAppend,
            isTrusted: false,
            moveCache: true,
            moveItem: itemIndex
          });

          return this;
        } else {
          var _isAppend = index > endCursor || index < startCursor - 1;

          this._postCache({
            isAppend: _isAppend,
            cache: [data],
            isTrusted: false,
            moveItem: itemIndex
          });
        }

        return this;
      };

      _proto._setScrollPos = function _setScrollPos(pos) {
        this._watcher.setScrollPos(this._watcher.getContainerOffset() + pos);
      };

      _proto._scrollTo = function _scrollTo(pos) {
        this._watcher.scrollTo(this._watcher.getContainerOffset() + pos);
      };

      _proto._onImageError = function _onImageError(e) {
        /**
         * This event is fired when an error occurs in the image.
         * @ko 이미지 로드에 에러가 날 때 발생하는 이벤트.
         * @event eg.InfiniteGrid#imageError
         * @param {Object} param The object of data to be sent to an event <ko>이벤트에 전달되는 데이터 객체</ko>
         * @param {Element} param.target Appending card's image element.<ko>추가 되는 카드의 이미지 엘리먼트</ko>
         * @param {Element} param.elememt The item's element with error images.<ko>에러난 이미지를 가지고 있는 아이템의 엘리먼트</ko>
         * @param {Object} param.items The items being added.<ko>화면에 추가중인 아이템들</ko>
         * @param {Object} param.item The item with error images.<ko>에러난 이미지를 가지고 있는 아이템</ko>
         * @param {Number} param.itemIndex The item's index with error images.<ko>에러난 이미지를 가지고 있는 아이템의 인덱스</ko>
         * @param {Function} param.remove In the imageError event, this method expects to remove the error image.<ko>이미지 에러 이벤트에서 이 메서드는 에러난 이미지를 삭제한다.</ko>
         * @param {Function} param.removeItem In the imageError event, this method expects to remove the item with the error image.<ko>이미지 에러 이벤트에서 이 메서드는 에러난 이미지를 가지고 있는 아이템을 삭제한다.</ko>
         * @param {Function} param.replace In the imageError event, this method expects to replace the error image's source or element.<ko>이미지 에러 이벤트에서 이 메서드는 에러난 이미지의 주소 또는 엘리먼트를 교체한다.</ko>
         * @param {Function} param.replaceItem In the imageError event, this method expects to replace the item's contents with the error image.<ko>이미지 에러 이벤트에서 이 메서드는 에러난 이미지를 가지고 있는 아이템의 내용을 교체한다.</ko>
         * @example
        ig.on("imageError", e => {
        e.remove();
        e.removeItem();
        e.replace("http://...jpg");
        e.replace(imageElement);
        e.replaceItem("item html");
        });
         */
        this.trigger("imageError", _extends(e, {
          element: e.item.el
        }));
      };

      _proto._postCache = function _postCache(_ref3) {
        var cache = _ref3.cache,
            isAppend = _ref3.isAppend,
            _ref3$isTrusted = _ref3.isTrusted,
            isTrusted = _ref3$isTrusted === void 0 ? true : _ref3$isTrusted,
            _ref3$moveItem = _ref3.moveItem,
            moveItem = _ref3$moveItem === void 0 ? -1 : _ref3$moveItem;
        var isConstantSize = this.options.isConstantSize;
        var items = ItemManager.pluck(cache, "items");
        var fromCache = true;
        var newItems = items.filter(function (item) {
          if (!item.orgSize) {
            fromCache = false;
            return true;
          }

          return !isConstantSize && item.rect.top < DUMMY_POSITION / 10;
        });

        this._postLayout({
          fromCache: fromCache,
          groups: cache,
          items: items,
          newItems: newItems,
          isAppend: isAppend,
          isTrusted: isTrusted,
          moveItem: moveItem
        });
      };

      _proto._postLayout = function _postLayout(_ref4) {
        var _this3 = this;

        var fromCache = _ref4.fromCache,
            groups = _ref4.groups,
            _ref4$items = _ref4.items,
            items = _ref4$items === void 0 ? ItemManager.pluck(groups, "items") : _ref4$items,
            newItems = _ref4.newItems,
            isAppend = _ref4.isAppend,
            isChildren = _ref4.isChildren,
            isTrusted = _ref4.isTrusted,
            moveCache = _ref4.moveCache,
            _ref4$moveItem = _ref4.moveItem,
            moveItem = _ref4$moveItem === void 0 ? -2 : _ref4$moveItem;

        this._process(PROCESSING);

        var method = isAppend ? "append" : "prepend";
        var itemManager = this._items;
        var horizontal = this.options.horizontal; // If container has children, it does not render first.

        if (!isChildren) {
          DOMRenderer.createElements(items);

          this._renderer[method](items);
        }

        this._manager[method]({
          groups: groups,
          items: newItems,
          isAppend: isAppend
        }, {
          complete: function complete() {
            var infinite = _this3._infinite;
            var startCursor = Math.max(infinite.getCursor("start"), 0);
            var endCursor = Math.max(infinite.getCursor("end"), 0);
            var requestStartCursor = itemManager.indexOf(groups[0].groupKey);
            var requestEndCursor = itemManager.indexOf(groups[groups.length - 1].groupKey);
            var isInCursor = true;

            if (requestStartCursor > endCursor + 1 || requestEndCursor < startCursor - 1) {
              isInCursor = false;
            }

            if (isInCursor) {
              if (isAppend) {
                requestStartCursor = startCursor;
                requestEndCursor = Math.max(endCursor, requestEndCursor);
              } else {
                requestStartCursor = Math.max(Math.min(startCursor, requestStartCursor), 0);
                requestEndCursor = endCursor;
              }
            }

            !isInCursor && _this3._recycle({
              start: startCursor,
              end: endCursor
            });
            infinite.setCursor("start", requestStartCursor);
            infinite.setCursor("end", requestEndCursor);

            if (moveItem > -1) {
              var pos = items[moveItem].rect[horizontal ? "left" : "top"];

              if (!isInCursor && !moveCache) {
                itemManager.clearOutlines(requestStartCursor, requestEndCursor);
              }

              _this3._scrollTo(pos);

              _this3._setScrollPos(pos);
            }

            _this3._onLayoutComplete({
              groups: groups,
              items: items,
              isAppend: isAppend,
              fromCache: fromCache,
              isTrusted: isTrusted,
              useRecycle: false
            });
          },
          error: function error(e) {
            return _this3._onImageError(e);
          },
          end: function end(_ref5) {
            var remove = _ref5.remove,
                layout = _ref5.layout;
            remove.forEach(function (el) {
              return _this3.remove(el, false);
            });

            if (layout) {
              _this3.layout(false);
            } else if (!_this3.isProcessing() && _this3.options.useRecycle) {
              var watcher = _this3._watcher;
              var scrollPos = watcher.getScrollPos();

              _this3._infinite.recycle(scrollPos, isAppend);
            }
          }
        });

        return this;
      }; // called by visible


      _proto._requestAppend = function _requestAppend(_ref6) {
        var _this4 = this;

        var cache = _ref6.cache;

        if (this._isProcessing()) {
          return;
        }

        if (cache && cache.length) {
          this._postCache({
            cache: cache,
            isAppend: APPEND
          });
        } else {
          /**
           * This event is fired when a card element must be added at the bottom or right of a layout because there is no card to be displayed on screen when a user scrolls near bottom or right.
           * @ko 카드 엘리먼트가 레이아웃의 아래나 오른쪽에 추가돼야 할 때 발생하는 이벤트. 사용자가 아래나 오른쪽으로 스크롤해서 화면에 표시될 카드가 없을 때 발생한다
           * @event eg.InfiniteGrid#append
           * @param {Object} param The object of data to be sent to an event <ko>이벤트에 전달되는 데이터 객체</ko>
           * @param {String|Number} groupKey The group key of the first group visible on the screen <ko>화면에 보여지는 마지막 그룹의 그룹키</ko>
           * @param {Boolean} param.isTrusted Returns true if an event was generated by the user action, or false if it was caused by a script or API call <ko>사용자의 액션에 의해 이벤트가 발생하였으면 true, 스크립트나 API호출에 의해 발생하였을 경우에는 false를 반환한다.</ko>
           * @param {Function} param.startLoading Start loading for append loading data. <ko> 뒷쪽에 추가되는 데이터 로딩을 시작한다. </ko>
           * @param {Object} param.startLoading.userStyle The custom style to apply to this loading bar for start. <ko> 로딩을 시작할 때 로딩 바에 적용될 사용자 스타일 </ko>
           * @param {Function} param.endLoading End loading after startLoading() for append/prepend loading data. <ko>데이터 로딩을 위해 append/prepend startLoading() 호출 이후 로딩을 끝낸다.</ko>
           * @param {Object} param.endLoading.userStyle The custom style to apply to this loading bar for start. <ko> 로딩이 끝날 때 로딩 바에 적용될 사용자 스타일 </ko>
           */
          this.trigger("append", {
            isTrusted: TRUSTED,
            groupKey: this.getGroupKeys().pop() || "",
            startLoading: function startLoading(userStyle) {
              _this4.startLoading(true, userStyle);
            },
            endLoading: function endLoading(userStyle) {
              _this4.endLoading(userStyle);
            }
          });
        }
      }; // called by visible


      _proto._requestPrepend = function _requestPrepend(_ref7) {
        var _this5 = this;

        var cache = _ref7.cache;

        this._fit(this.options.useFit || !cache.length);

        if (this._isProcessing()) {
          return;
        }

        if (cache && cache.length) {
          this._postCache({
            cache: cache,
            isAppend: PREPEND
          });
        } else {
          /**
           * This event is fired when a card element must be added at the top or left of a layout because there is no card to be displayed on screen when a user scrolls near top or left.
           * @ko 카드가 레이아웃의 위나 왼쪽에 추가돼야 할 때 발생하는 이벤트. 사용자가 위나 왼쪽으로 스크롤해서 화면에 표시될 카드가 없을 때 발생한다.
           * @event eg.InfiniteGrid#prepend
           * @param {Object} param The object of data to be sent to an event <ko>이벤트에 전달되는 데이터 객체</ko>
           * @param {String|Number} groupKey The group key of the first group visible on the screen <ko>화면에 보여지는 첫번째 그룹의 그룹키</ko>
           * @param {Boolean} param.isTrusted Returns true if an event was generated by the user action, or false if it was caused by a script or API call <ko>사용자의 액션에 의해 이벤트가 발생하였으면 true, 스크립트나 API호출에 의해 발생하였을 경우에는 false를 반환한다.</ko>
           * @param {Function} param.startLoading Start loading for prepend loading data. <ko> 앞쪽에 추가되는 데이터 로딩을 시작한다. </ko>
           * @param {Object} param.startLoading.userStyle The custom style to apply to this loading bar for start. <ko> 로딩을 시작할 때 로딩 바에 적용될 사용자 스타일 </ko>
           * @param {Function} param.endLoading End loading after startLoading() for append/prepend loading data. <ko>데이터 로딩을 위해 append/prepend startLoading() 호출 이후 로딩을 끝낸다.</ko>
           * @param {Object} param.endLoading.userStyle The custom style to apply to this loading bar for start. <ko> 로딩이 끝날 때 로딩 바에 적용될 사용자 스타일 </ko>
           */
          this.trigger("prepend", {
            isTrusted: TRUSTED,
            groupKey: this.getGroupKeys().shift(),
            startLoading: function startLoading(userStyle) {
              _this5.startLoading(false, userStyle);
            },
            endLoading: function endLoading(userStyle) {
              _this5.endLoading(userStyle);
            }
          });
        }
      };

      _proto._onResize = function _onResize() {
        this.layout(true);
      };

      _proto._onCheck = function _onCheck(_ref8) {
        var isForward = _ref8.isForward,
            scrollPos = _ref8.scrollPos,
            horizontal = _ref8.horizontal,
            orgScrollPos = _ref8.orgScrollPos;

        /**
         * This event is fired when the user scrolls.
         * @ko 사용자가 스크롤 할 경우 발생하는 이벤트.
         * @event eg.InfiniteGrid#change
         * @param {Object} param The object of data to be sent to an event <ko>이벤트에 전달되는 데이터 객체</ko>
         * @param {Boolean} param.isForward Indicates whether the scroll progression direction is forward or backword. <ko>스크롤 진행방향이 앞쪽으로 진행하는 지, 뒤쪽으로 진행하는지를 나타낸다.</ko>
         * @param {Number} param.scrollPos Current scroll position value relative to the infiniteGrid container element. <ko>infiniteGrid 컨테이너 엘리먼트 기준의 현재 스크롤 위치값</ko>
         * @param {Boolean} param.orgScrollPos Current position of the scroll <ko>현재 스크롤 위치값</ko>
         * @param {Boolean} param.isTrusted Returns true if an event was generated by the user action, or false if it was caused by a script or API call <ko>사용자의 액션에 의해 이벤트가 발생하였으면 true, 스크립트나 API호출에 의해 발생하였을 경우에는 false를 반환한다.</ko>
         * @param {Boolean} options.horizontal Direction of the scroll movement (true: horizontal, false: vertical) <ko>스크롤 이동 방향 (true 가로방향, false 세로방향</ko>
         */
        this.trigger("change", {
          isForward: isForward,
          horizontal: horizontal,
          scrollPos: scrollPos,
          orgScrollPos: orgScrollPos
        });

        this._infinite.scroll(scrollPos);
      };

      _proto._onLayoutComplete = function _onLayoutComplete(_ref9) {
        var _this6 = this;

        var items = _ref9.items,
            isAppend = _ref9.isAppend,
            _ref9$isTrusted = _ref9.isTrusted,
            isTrusted = _ref9$isTrusted === void 0 ? false : _ref9$isTrusted,
            _ref9$useRecycle = _ref9.useRecycle,
            useRecycle = _ref9$useRecycle === void 0 ? this.options.useRecycle : _ref9$useRecycle,
            _ref9$fromCache = _ref9.fromCache,
            fromCache = _ref9$fromCache === void 0 ? false : _ref9$fromCache,
            _ref9$isLayout = _ref9.isLayout,
            isLayout = _ref9$isLayout === void 0 ? false : _ref9$isLayout;

        var viewSize = this._renderer.getViewSize();

        if (!isAppend) {
          this._fit();
        } else {
          this._isLoading() && this._renderLoading();
        }

        var watcher = this._watcher;
        var scrollPos = watcher.getScrollPos(); // recycle after _fit beacause prepend and append are occured simultaneously by scroll.

        if (!isLayout && useRecycle && !this._isLoading()) {
          this._infinite.recycle(scrollPos, isAppend);
        }

        var size = this._getEdgeValue("end");

        if (isAppend) {
          this._setContainerSize(size + this._status.loadingSize || 0);

          if (scrollPos > 0) {
            !IS_IOS && this._scrollTo(scrollPos);
          }
        }

        !isLayout && this._process(PROCESSING, false);
        /**
         * This event is fired when layout is successfully arranged through a call to the append(), prepend(), or layout() method.
         * @ko 레이아웃 배치가 완료됐을 때 발생하는 이벤트. append() 메서드나 prepend() 메서드, layout() 메서드 호출 후 카드의 배치가 완료됐을 때 발생한다
         * @event eg.InfiniteGrid#layoutComplete
         *
         * @param {Object} param The object of data to be sent to an event <ko>이벤트에 전달되는 데이터 객체</ko>
         * @param {Array} param.target Rearranged card elements<ko>재배치된 카드 엘리먼트들</ko>
         * @param {Boolean} param.fromCache Check whether these items are cache or not <ko>해당 아이템들이 캐시인지 아닌지 확인한다.</ko>
         * @param {Boolean} param.isLayout Returns true if this is an event called by resize event or layout method. Returns false if this is an event called by adding an item. <ko>해당 이벤트가 리사이즈 이벤트 또는 layout() 메서드를 통해 호출됐으면 true, 아이템 추가로 호출됐으면 false를 반환한다.</ko>
         * @param {Boolean} param.isAppend Checks whether the append() method is used to add a card element. It returns true even though the layoutComplete event is fired after the layout() method is called. <ko>카드 엘리먼트가 append() 메서드로 추가됐는지 확인한다. layout() 메서드가 호출된 후 layoutComplete 이벤트가 발생해도 'true'를 반환한다.</ko>
         * @param {Boolean} param.isScroll Checks whether scrolling has occurred after the append(), prepend(), ..., etc method is called <ko>append, prend 등 호출 후 스크롤이 생겼는지 확인한다.</ko>
         * @param {Number} param.scrollPos Current scroll position value relative to the infiniteGrid container element. <ko>infiniteGrid 컨테이너 엘리먼트 기준의 현재 스크롤 위치값</ko>
         * @param {Number} param.orgScrollPos Current position of the scroll <ko>현재 스크롤 위치값</ko>
         * @param {Number} param.size The size of container element <ko>컨테이너 엘리먼트의 크기</ko>
         * @param {Boolean} param.isTrusted Returns true if an event was generated by the user action, or false if it was caused by a script or API call <ko>사용자의 액션에 의해 이벤트가 발생하였으면 true, 스크립트나 API호출에 의해 발생하였을 경우에는 false를 반환한다.</ko>
         * @param {Function} param.endLoading End loading after startLoading() for append/prepend loading data. <ko>데이터 로딩을 위해 append/prepend startLoading() 호출 이후 로딩을 끝낸다.</ko>
         * @param {Object} param.endLoading.userStyle The custom style to apply to this loading bar for start. <ko> 로딩이 끝날 때 로딩 바에 적용될 사용자 스타일 </ko>
         */

        this.trigger("layoutComplete", {
          target: items.concat(),
          isAppend: isAppend,
          isTrusted: isTrusted,
          fromCache: fromCache,
          isLayout: isLayout,
          isScroll: viewSize < watcher.getContainerOffset() + size,
          scrollPos: scrollPos,
          orgScrollPos: watcher.getOrgScrollPos(),
          size: size,
          endLoading: function endLoading(userStyle) {
            _this6.endLoading(userStyle);
          }
        });

        this._infinite.scroll(scrollPos, isAppend);
      };

      _proto._reset = function _reset() {
        this._status = {
          processingStatus: IDLE,
          loadingSize: 0
        };
      };
      /**
       * Destroys elements, properties, and events used on a grid layout.
       * @ko 그리드 레이아웃에 사용한 엘리먼트와 속성, 이벤트를 해제한다
       */


      _proto.destroy = function destroy() {
        this._infinite.clear();

        this._watcher.destroy();

        this._manager.destroy();

        this._reset();

        this._items.clear();

        this._renderer.destroy();
      };

      return InfiniteGrid;
    }(Component);

    InfiniteGrid.VERSION = "3.5.0";
    return InfiniteGrid;
  }();

  var START = ALIGN.START,
      CENTER = ALIGN.CENTER,
      END = ALIGN.END,
      JUSTIFY = ALIGN.JUSTIFY;
  /**
   * @classdesc The GridLayout is a layout that stacks cards with the same width as a stack of bricks. Adjust the width of all images to the same size, find the lowest height column, and insert a new card.
   * @ko GridLayout는 벽돌을 쌓아 올린 모양처럼 동일한 너비를 가진 카드를 쌓는 레이아웃이다. 모든 이미지의 너비를 동일한 크기로 조정하고, 가장 높이가 낮은 열을 찾아 새로운 이미지를 삽입한다. 따라서 배치된 카드 사이에 빈 공간이 생기지는 않지만 배치된 레이아웃의 아래쪽은 울퉁불퉁해진다.
   * @class eg.InfiniteGrid.GridLayout
   * @param {Object} [options] The option object of eg.InfiniteGrid.GridLayout module <ko>eg.InfiniteGrid.GridLayout 모듈의 옵션 객체</ko>
   * @param {String} [options.margin=0] Margin used to create space around items <ko>아이템들 사이의 공간</ko>
   * @param {Boolean} [options.horizontal=false] Direction of the scroll movement (false: vertical, true: horizontal) <ko>스크롤 이동 방향 (false: 세로방향, true: 가로방향)</ko>
   * @param {Boolean} [options.align=START] Align of the position of the items (START, CENTER, END, JUSTIFY) <ko>아이템들의 위치의 정렬 (START, CENTER, END, JUSTIFY)</ko>
   * @param {Boolean} [options.itemSize=0] The size of the items. If it is 0, it is calculated as the size of the first item in items. <ko> 아이템의 사이즈. 만약 아이템 사이즈가 0이면, 아이템들의 첫번째 아이템의 사이즈로 계산이 된다. </ko>
   * @example
  ```
  <script>
  var ig = new eg.InfiniteGrid("#grid". {
  	horizontal: true,
  });

  ig.setLayout(eg.InfiniteGrid.GridLayout, {
  	margin: 10,
  	align: "start",
  	itemSize: 200
  });

  // or

  var layout = new eg.InfiniteGrid.GridLayout({
  	margin: 10,
  	align: "center",
  	itemSize: 200,
  	horizontal: true,
  });

  </script>
  ```
   **/

  var GridLayout =
  /*#__PURE__*/
  function () {
    function GridLayout(options) {
      if (options === void 0) {
        options = {};
      }

      this.options = assignOptions({
        margin: 0,
        horizontal: false,
        align: START,
        itemSize: 0
      }, options);
      this._size = 0;
      this._columnSize = 0;
      this._columnLength = 0;
      this._style = getStyleNames(this.options.horizontal);
    }

    var _proto = GridLayout.prototype;

    _proto.checkColumn = function checkColumn(item) {
      var _this$options = this.options,
          itemSize = _this$options.itemSize,
          margin = _this$options.margin,
          horizontal = _this$options.horizontal;
      var sizeName = horizontal ? "height" : "width";
      var columnSize = parseInt(itemSize || item && item.size[sizeName], 10) || 0;
      this._columnSize = columnSize;

      if (!columnSize) {
        this._columnLength = 1;
        return;
      }

      this._columnLength = Math.max(parseInt((this._size + margin) / (columnSize + margin), 10), 1);
    };

    _proto._layout = function _layout(items, outline, isAppend) {
      var length = items.length;
      var margin = this.options.margin;
      var align = this.options.align;
      var style = this._style;
      var size1Name = style.size1;
      var size2Name = style.size2;
      var pos1Name = style.pos1;
      var pos2Name = style.pos2;
      var columnSize = this._columnSize;
      var columnLength = this._columnLength;
      var size = this._size;
      var viewDist = size - (columnSize + margin) * columnLength + margin;
      var pointCaculateName = isAppend ? "min" : "max";
      var startOutline = outline.slice();
      var endOutline = outline.slice();

      for (var i = 0; i < length; ++i) {
        var _item$rect;

        var point = Math[pointCaculateName].apply(Math, endOutline) || 0;
        var index = endOutline.indexOf(point);
        var item = items[isAppend ? i : length - 1 - i];
        var size1 = item.size[size1Name];
        var size2 = item.size[size2Name];
        var pos1 = isAppend ? point : point - margin - size1;
        var endPos1 = pos1 + size1 + margin;

        if (index === -1) {
          index = 0;
        }

        var pos2 = (columnSize + margin) * index; // ALIGN

        if (align === CENTER) {
          pos2 += viewDist / 2;
        } else if (align === END) {
          pos2 += viewDist + columnSize - size2;
        } else if (align === JUSTIFY) {
          if (columnLength <= 1) {
            pos2 += viewDist / 2;
          } else {
            pos2 = (size - columnSize) / (columnLength - 1) * index;
          }
        } // tetris


        item.rect = (_item$rect = {}, _item$rect[pos1Name] = pos1, _item$rect[pos2Name] = pos2, _item$rect);
        item.column = index;
        endOutline[index] = isAppend ? endPos1 : pos1;
      }

      if (!isAppend) {
        items.sort(function (a, b) {
          var item1pos1 = a.rect[pos1Name];
          var item1pos2 = a.rect[pos2Name];
          var item2pos1 = b.rect[pos1Name];
          var item2pos2 = b.rect[pos2Name];

          if (item1pos1 - item2pos1) {
            return item1pos1 - item2pos1;
          }

          return item1pos2 - item2pos2;
        });
      } // if append items, startOutline is low, endOutline is high
      // if prepend items, startOutline is high, endOutline is low


      return {
        start: isAppend ? startOutline : endOutline,
        end: isAppend ? endOutline : startOutline
      };
    };

    _proto._insert = function _insert(items, outline, type, cache) {
      if (items === void 0) {
        items = [];
      }

      if (outline === void 0) {
        outline = [];
      }

      var clone = cache ? items : cloneItems(items);
      var startOutline = outline;

      if (!this._columnLength) {
        this.checkColumn(items[0]);
      }

      if (outline.length !== this._columnLength) {
        startOutline = fill(new Array(this._columnLength), outline.length === 0 ? 0 : Math[type === APPEND ? "min" : "max"].apply(Math, outline) || 0);
      }

      var result = this._layout(clone, startOutline, type);

      return {
        items: clone,
        outlines: result
      };
    };
    /**
     * Adds items at the bottom of a outline.
     * @ko 아이템들을 아웃라인 아래에 추가한다.
     * @method eg.InfiniteGrid.GridLayout#append
     * @param {Array} items Array of items to be layouted <ko>레이아웃할 아이템들의 배열</ko>
     * @param {Array} [outline=[]] Array of outline points to be reference points <ko>기준점이 되는 아웃라인 점들의 배열</ko>
     * @return {Object} Layouted items and outline of start and end <ko> 레이아웃이 된 아이템과 시작과 끝의 아웃라인이 담긴 정보</ko>
     * @example
     * layout.prepend(items, [100, 200, 300, 400]);
     */


    _proto.append = function append(items, outline, cache) {
      return this._insert(items, outline, APPEND, cache);
    };
    /**
     * Adds items at the top of a outline.
     * @ko 아이템을 아웃라인 위에 추가한다.
     * @method eg.InfiniteGrid.GridLayout#prepend
     * @param {Array} items Array of items to be layouted <ko>레이아웃할 아이템들의 배열</ko>
     * @param {Array} [outline=[]] Array of outline points to be reference points <ko>기준점이 되는 아웃라인 점들의 배열</ko>
     * @return {Object} Layouted items and outline of start and end <ko> 레이아웃이 된 아이템과 시작과 끝의 아웃라인이 담긴 정보</ko>
     * @example
     * layout.prepend(items, [100, 200, 300, 400]);
     */


    _proto.prepend = function prepend(items, outline, cache) {
      return this._insert(items, outline, PREPEND, cache);
    };
    /**
     * Adds items of groups at the bottom of a outline.
     * @ko 그룹들의 아이템들을 아웃라인 아래에 추가한다.
     * @method eg.InfiniteGrid.GridLayout#layout
     * @param {Array} groups Array of groups to be layouted <ko>레이아웃할 그룹들의 배열</ko>
     * @param {Array} outline Array of outline points to be reference points <ko>기준점이 되는 아웃라인 점들의 배열</ko>
     * @return {eg.InfiniteGrid.GridLayout} An instance of a module itself<ko>모듈 자신의 인스턴스</ko>
     * @example
     * layout.layout(groups, [100, 200, 300, 400]);
     */


    _proto.layout = function layout(groups, outline) {
      var _this = this;

      if (groups === void 0) {
        groups = [];
      }

      if (outline === void 0) {
        outline = [];
      }

      var firstItem = groups.length && groups[0].items.length && groups[0].items[0] || 0;
      this.checkColumn(firstItem); // if outlines' length and columns' length are now same, re-caculate outlines.

      var startOutline;

      if (outline.length !== this._columnLength) {
        var pos = outline.length === 0 ? 0 : Math.min.apply(Math, outline); // re-layout items.

        startOutline = fill(new Array(this._columnLength), pos);
      } else {
        startOutline = outline.slice();
      }

      groups.forEach(function (group) {
        var items = group.items;

        var result = _this._layout(items, startOutline, APPEND);

        group.outlines = result;
        startOutline = result.end;
      });
      return this;
    };
    /**
     * Set the viewport size of the layout.
     * @ko 레이아웃의 가시 사이즈를 설정한다.
     * @method eg.InfiniteGrid.GridLayout#setSize
     * @param {Number} size The viewport size of container area where items are added to a layout <ko>레이아웃에 아이템을 추가하는 컨테이너 영역의 가시 사이즈</ko>
     * @return {eg.InfiniteGrid.GridLayout} An instance of a module itself<ko>모듈 자신의 인스턴스</ko>
     * @example
     * layout.setSize(800);
     */


    _proto.setSize = function setSize(size) {
      this._size = size;
      return this;
    };

    return GridLayout;
  }();

  /*
  Frame
  [
  [1, 1, 1, 1, 1],
  [0, 0, 2, 2, 2],
  [0, 0, 2, 2, 2],
  [3, 4, 5, 5, 5],
  ]
  */

  function disableFrame(frame, type, x, y, width, height) {
    for (var i = y; i < y + height; ++i) {
      for (var j = x; j < x + width; ++j) {
        if (type !== frame[i][j]) {
          continue;
        }

        frame[i][j] = 0;
      }
    }
  }

  function searchShapeInFrame(frame, type, top, left, width, height) {
    var size = {
      left: left,
      top: top,
      type: type,
      width: 1,
      height: 1
    };

    for (var i = left; i < width; ++i) {
      if (frame[top][i] === type) {
        size.width = i - left + 1;
        continue;
      }

      break;
    }

    for (var _i = top; _i < height; ++_i) {
      if (frame[_i][left] === type) {
        size.height = _i - top + 1;
        continue;
      }

      break;
    } // After finding the shape, it will not find again.


    disableFrame(frame, type, left, top, size.width, size.height);
    return size;
  }

  function getShapes(frame) {
    var height = frame.length;
    var width = height ? frame[0].length : 0;
    var shapes = [];

    for (var i = 0; i < height; ++i) {
      for (var j = 0; j < width; ++j) {
        var type = frame[i][j];

        if (!type) {
          continue;
        } // Separate shapes with other numbers.


        shapes.push(searchShapeInFrame(frame, type, i, j, width, height));
      }
    }

    shapes.sort(function (a, b) {
      return a.type < b.type ? -1 : 1;
    });
    return {
      shapes: shapes,
      width: width,
      height: height
    };
  }
  /**
   * @classdesc FrameLayout is a layout that allows you to place cards in a given frame. It is a layout that corresponds to a level intermediate between the placement of the image directly by the designer and the layout using the algorithm.
   * @ko FrameLayout은 주어진 프레임에 맞춰 카드를 배치하는 레이아웃입니다. 디자이너가 직접 이미지를 배치하는 것과 알고리즘을 사용한 배치의 중간 정도 수준에 해당하는 레이아웃이다.
   * @class eg.InfiniteGrid.FrameLayout
   * @param {Object} [options] The option object of eg.InfiniteGrid.FrameLayout module <ko>eg.InfiniteGrid.FrameLayout 모듈의 옵션 객체</ko>
   * @param {String} [options.margin=0] Margin used to create space around items <ko>아이템들 사이의 공간</ko>
   * @param {Boolean} [options.horizontal=false] Direction of the scroll movement (false: vertical, true: horizontal) <ko>스크롤 이동 방향 (false: 세로방향, true: 가로방향)</ko>
   * @param {Boolean} [options.itemSize=0] The size of the items. If it is 0, it is calculated as the size of the first item in items. <ko> 아이템의 사이즈. 만약 아이템 사이즈가 0이면, 아이템들의 첫번째 아이템의 사이즈로 계산이 된다. </ko>
   * @param {Boolean} [options.frame=[]] The size of the items. If it is 0, it is calculated as the size of the first item in items. <ko> 아이템의 사이즈. 만약 아이템 사이즈가 0이면, 아이템들의 첫번째 아이템의 사이즈로 계산이 된다. </ko>
   * @param {Boolean} [options.frameFill=true] Make sure that the frame can be attached after the previous frame. <ko> 다음 프레임이 전 프레임에 이어 붙일 수 있는지 있는지 확인한다. </ko>
   * @example
  ```
  <script>
  var ig = new eg.InfiniteGrid("#grid". {
  	horizontal: true,
  });

  ig.setLayout(eg.InfiniteGrid.FrameLayout, {
  	margin: 10,
  	itemSize: 200,
  	frame: [
  		[1, 1, 1, 1, 1],
  		[0, 0, 2, 2, 2],
  		[0, 0, 2, 2, 2],
  		[3, 4, 5, 5, 5],
  	],
  });

  // or

  var layout = new eg.InfiniteGrid.FrameLayout({
  	margin: 10,
  	itemSize: 200,
  	horizontal: true,
  	frame: [
  		[1, 1, 1, 1, 1],
  		[0, 0, 2, 2, 2],
  		[0, 0, 2, 2, 2],
  		[3, 4, 5, 5, 5],
  	],
  });

  </script>
  ```
   **/


  var FrameLayout =
  /*#__PURE__*/
  function () {
    function FrameLayout(options) {
      if (options === void 0) {
        options = {};
      }

      this.options = assignOptions({
        margin: 0,
        horizontal: false,
        itemSize: 0,
        frame: [],
        frameFill: true
      }, options);
      var frame = this.options.frame.map(function (row) {
        return row.slice();
      });
      this._itemSize = this.options.itemSize || 0; // divide frame into shapes.

      this._shapes = getShapes(frame);
      this._size = 0;
      this._style = getStyleNames(this.options.horizontal);
    }

    var _proto = FrameLayout.prototype;

    _proto._getItemSize = function _getItemSize() {
      this._checkItemSize();

      return this._itemSize;
    };

    _proto._checkItemSize = function _checkItemSize() {
      if (this.options.itemSize) {
        this._itemSize = this.options.itemSize;
        return;
      }

      var style = this._style;
      var size = style.size2;
      var margin = this.options.margin; // if itemSize is not in options, caculate itemSize from size.

      this._itemSize = (this._size + margin) / this._shapes[size] - margin;
    };

    _proto._layout = function _layout(items, outline, isAppend) {
      if (outline === void 0) {
        outline = [];
      }

      var length = items.length;
      var style = this._style;
      var _this$options = this.options,
          margin = _this$options.margin,
          frameFill = _this$options.frameFill;
      var size1Name = style.size1;
      var size2Name = style.size2;
      var pos1Name = style.pos1;
      var pos2Name = style.pos2;

      var itemSize = this._getItemSize();

      var isItemObject = typeof itemSize === "object";
      var itemSize2 = isItemObject ? itemSize[size2Name] : itemSize;
      var itemSize1 = isItemObject ? itemSize[size1Name] : itemSize;
      var shapesSize = this._shapes[size2Name];
      var shapes = this._shapes.shapes;
      var shapesLength = shapes.length;
      var startOutline = fill(new Array(shapesSize), DUMMY_POSITION);
      var endOutline = fill(new Array(shapesSize), DUMMY_POSITION);
      var dist = 0;
      var end = 0;

      if (!shapesLength) {
        return {
          start: outline,
          end: outline
        };
      }

      for (var i = 0; i < length; i += shapesLength) {
        for (var j = 0; j < shapesLength && i + j < length; ++j) {
          var _item$rect;

          var item = items[i + j];
          var shape = shapes[j];
          var shapePos1 = shape[pos1Name];
          var shapePos2 = shape[pos2Name];
          var shapeSize1 = shape[size1Name];
          var shapeSize2 = shape[size2Name];
          var pos1 = end - dist + shapePos1 * (itemSize1 + margin);
          var pos2 = shapePos2 * (itemSize2 + margin);
          var size1 = shapeSize1 * (itemSize1 + margin) - margin;
          var size2 = shapeSize2 * (itemSize2 + margin) - margin;

          for (var k = shapePos2; k < shapePos2 + shapeSize2 && k < shapesSize; ++k) {
            if (startOutline[k] === DUMMY_POSITION) {
              startOutline[k] = pos1;
            }

            startOutline[k] = Math.min(startOutline[k], pos1);
            endOutline[k] = Math.max(endOutline[k], pos1 + size1 + margin);
          }

          item.rect = (_item$rect = {}, _item$rect[pos1Name] = pos1, _item$rect[pos2Name] = pos2, _item$rect[size1Name] = size1, _item$rect[size2Name] = size2, _item$rect);
        }

        end = Math.max.apply(Math, endOutline); // check dist once

        if (i !== 0) {
          continue;
        } // find & fill empty block


        if (!frameFill) {
          dist = 0;
          continue;
        }

        dist = end;

        for (var _j = 0; _j < shapesSize; ++_j) {
          if (startOutline[_j] === DUMMY_POSITION) {
            continue;
          } // the dist between frame's end outline and next frame's start outline
          // expect that next frame's start outline is startOutline[j] + end


          dist = Math.min(startOutline[_j] + end - endOutline[_j], dist);
        }
      }

      for (var _i2 = 0; _i2 < shapesSize; ++_i2) {
        if (startOutline[_i2] !== DUMMY_POSITION) {
          continue;
        }

        startOutline[_i2] = Math.max.apply(Math, startOutline);
        endOutline[_i2] = startOutline[_i2];
      } // The target outline is start outline when type is APPENDING


      var targetOutline = isAppend ? startOutline : endOutline;
      var prevOutlineEnd = outline.length === 0 ? 0 : Math[isAppend ? "max" : "min"].apply(Math, outline);
      var prevOutlineDist = isAppend ? 0 : end;

      if (frameFill && outline.length === shapesSize) {
        prevOutlineDist = -DUMMY_POSITION;

        for (var _i3 = 0; _i3 < shapesSize; ++_i3) {
          if (startOutline[_i3] === endOutline[_i3]) {
            continue;
          } // if appending type is PREPEND, subtract dist from appending group's height.


          prevOutlineDist = Math.min(targetOutline[_i3] + prevOutlineEnd - outline[_i3], prevOutlineDist);
        }
      }

      for (var _i4 = 0; _i4 < shapesSize; ++_i4) {
        startOutline[_i4] += prevOutlineEnd - prevOutlineDist;
        endOutline[_i4] += prevOutlineEnd - prevOutlineDist;
      }

      items.forEach(function (item) {
        item.rect[pos1Name] += prevOutlineEnd - prevOutlineDist;
      });
      return {
        start: startOutline.map(function (point) {
          return parseInt(point, 10);
        }),
        end: endOutline.map(function (point) {
          return parseInt(point, 10);
        })
      };
    };

    _proto._insert = function _insert(items, outline, type, cache) {
      if (items === void 0) {
        items = [];
      }

      if (outline === void 0) {
        outline = [];
      }

      // this only needs the size of the item.
      var clone = cache ? items : cloneItems(items);
      return {
        items: clone,
        outlines: this._layout(clone, outline, type)
      };
    };
    /**
     * Adds items of groups at the bottom of a outline.
     * @ko 그룹들의 아이템들을 아웃라인 아래에 추가한다.
     * @method eg.InfiniteGrid.FrameLayout#layout
     * @param {Array} groups Array of groups to be layouted <ko>레이아웃할 그룹들의 배열</ko>
     * @param {Array} outline Array of outline points to be reference points <ko>기준점이 되는 아웃라인 점들의 배열</ko>
     * @return {eg.InfiniteGrid.FrameLayout} An instance of a module itself<ko>모듈 자신의 인스턴스</ko>
     * @example
     * layout.layout(groups, [100, 200, 300, 400]);
     */


    _proto.layout = function layout(groups, outline) {
      if (groups === void 0) {
        groups = [];
      }

      if (outline === void 0) {
        outline = [];
      }

      var length = groups.length;
      var point = outline;

      for (var i = 0; i < length; ++i) {
        var group = groups[i];
        point = this._layout(group.items, point, APPEND);
        group.outlines = point;
        point = point.end;
      }

      return this;
    };
    /**
     * Set the viewport size of the layout.
     * @ko 레이아웃의 가시 사이즈를 설정한다.
     * @method eg.InfiniteGrid.FrameLayout#setSize
     * @param {Number} size The viewport size of container area where items are added to a layout <ko>레이아웃에 아이템을 추가하는 컨테이너 영역의 가시 사이즈</ko>
     * @return {eg.InfiniteGrid.FrameLayout} An instance of a module itself<ko>모듈 자신의 인스턴스</ko>
     * @example
     * layout.setSize(800);
     */


    _proto.setSize = function setSize(size) {
      this._size = size;
      return this;
    };
    /**
     * Adds items at the bottom of a outline.
     * @ko 아이템들을 아웃라인 아래에 추가한다.
     * @method eg.InfiniteGrid.FrameLayout#append
     * @param {Array} items Array of items to be layouted <ko>레이아웃할 아이템들의 배열</ko>
     * @param {Array} [outline=[]] Array of outline points to be reference points <ko>기준점이 되는 아웃라인 점들의 배열</ko>
     * @return {Object} Layouted items and outline of start and end <ko> 레이아웃이 된 아이템과 시작과 끝의 아웃라인이 담긴 정보</ko>
     * @example
     * layout.prepend(items, [100]);
     */


    _proto.append = function append(items, outline, cache) {
      return this._insert(items, outline, APPEND, cache);
    };
    /**
     * Adds items at the top of a outline.
     * @ko 아이템을 아웃라인 위에 추가한다.
     * @method eg.InfiniteGrid.FrameLayout#prepend
     * @param {Array} items Array of items to be layouted <ko>레이아웃할 아이템들의 배열</ko>
     * @param {Array} [outline=[]] Array of outline points to be reference points <ko>기준점이 되는 아웃라인 점들의 배열</ko>
     * @return {Object} Layouted items and outline of start and end <ko> 레이아웃이 된 아이템과 시작과 끝의 아웃라인이 담긴 정보</ko>
     * @example
     * layout.prepend(items, [100]);
     */


    _proto.prepend = function prepend(items, outline, cache) {
      return this._insert(items, outline, PREPEND, cache);
    };

    return FrameLayout;
  }();

  function makeShapeOutline(outline, itemSize, columnLength, isAppend) {
    var point = Math[isAppend ? "min" : "max"].apply(Math, outline) || 0;

    if (outline.length !== columnLength) {
      return fill(new Array(columnLength), 0);
    }

    return outline.map(function (l) {
      return parseInt((l - point) / itemSize, 10);
    });
  }

  function getColumn(item) {
    if (item.column) {
      return item.column;
    }

    var column = 0;

    if (item.el) {
      var dataset = item.el.dataset;

      if (dataset) {
        column = dataset.column || 1;
      } else {
        column = item.el.getAttribute("column") || 1;
      }
    } else {
      column = 1;
    }

    item.column = column;
    return column;
  }
  /**
   * @classdesc SquareLayout is a layout that places all cards like squares on a checkerboard, and important cards are n times larger. The main card can be enlarged, and then a small card can be placed to naturally show the relationship of the card.
   * @ko SquareLayout은 바둑판처럼 모든 카드를 정사각형으로 배치하고 중요한 카드는 크기를 N배로 키워서 보여주는 레이아웃이다. 주요 카드를 크게 표시하고, 그 다음에 작은 카드를 배치해 자연스럽게 카드의 관계를 나타낼 수 있습니다.
   * @class eg.InfiniteGrid.SquareLayout
   * @extends eg.InfiniteGrid.FrameLayout
   * @param {Object} [options] The option object of eg.InfiniteGrid.SquareLayout module <ko>eg.InfiniteGrid.SquareLayout 모듈의 옵션 객체</ko>
   * @param {String} [options.margin=0] Margin used to create space around items <ko>아이템들 사이의 공간</ko>
   * @param {Boolean} [options.horizontal=false] Direction of the scroll movement (false: vertical, true: horizontal) <ko>스크롤 이동 방향 (false: 세로방향, true: 가로방향)</ko>
   * @param {Boolean} [options.itemSize=0] The size of the items. If it is 0, it is calculated as the size of the first item in items. <ko> 아이템의 사이즈. 만약 아이템 사이즈가 0이면, 아이템들의 첫번째 아이템의 사이즈로 계산이 된다. </ko>
   * @example
  ```
  <script>
  var ig = new eg.InfiniteGrid("#grid". {
  	horizontal: true,
  });

  ig.setLayout(eg.InfiniteGrid.SquareLayout, {
  	margin: 10,
  	itemSize: 200,
  });

  // or

  var layout = new eg.InfiniteGrid.SquareLayout({
  	margin: 10,
  	itemSize: 200,
  	horizontal: true,
  });


  var item1 = '<div data-column="2"></div>';
  var item2 = "<div></div>"
  layout.append([item1, item2]);
  </script>
  ```
   **/


  var SquareLayout =
  /*#__PURE__*/
  function (_FrameLayout) {
    _inheritsLoose(SquareLayout, _FrameLayout);

    function SquareLayout() {
      return _FrameLayout.apply(this, arguments) || this;
    }

    var _proto = SquareLayout.prototype;

    _proto._checkItemSize = function _checkItemSize() {
      var column = this.options.column;

      if (!column) {
        _FrameLayout.prototype._checkItemSize.call(this);

        return;
      }

      var margin = this.options.margin; // if itemSize is not in options, caculate itemSize from size.

      this._itemSize = (this._size + margin) / column - margin;
    };

    _proto._layout = function _layout(items, outline, isAppend) {
      var _this$_shapes;

      if (outline === void 0) {
        outline = [];
      }

      var itemSize = this._getItemSize();

      var margin = this.options.margin;
      var columnLength = this.options.column || parseInt((this._size + margin) / (itemSize + margin), 10) || 1;
      var length = items.length;
      var endOutline = makeShapeOutline(outline, itemSize, columnLength, isAppend);
      var pointCaculateName = isAppend ? "min" : "max";
      var shapes = [];
      var sign = isAppend ? 1 : -1;
      var style = this._style;
      var pos1Name = style.pos1;
      var pos2Name = style.pos2;

      for (var i = 0; i < length; ++i) {
        var _shapes$push;

        var point = Math[pointCaculateName].apply(Math, endOutline);
        var index = endOutline[isAppend ? "indexOf" : "lastIndexOf"](point);
        var item = items[i];
        var columnWidth = item.columnWidth;
        var column = columnWidth && columnWidth[0] === columnLength && columnWidth[1] || getColumn(item);
        var columnCount = 1;

        if (column > 1) {
          for (var j = 1; j < column && (isAppend && index + j < columnLength || !isAppend && index - j >= 0); ++j) {
            if (isAppend && endOutline[index + sign * j] <= point || !isAppend && endOutline[index + sign * j] >= point) {
              ++columnCount;
              continue;
            }

            break;
          }

          if (!isAppend) {
            index -= columnCount - 1;
          }
        }

        item.columnWidth = [columnLength, columnCount];
        shapes.push((_shapes$push = {
          width: columnCount,
          height: columnCount
        }, _shapes$push[pos1Name] = point - (!isAppend ? columnCount : 0), _shapes$push[pos2Name] = index, _shapes$push.index = i, _shapes$push));

        for (var _j = 0; _j < columnCount; ++_j) {
          endOutline[index + _j] = point + sign * columnCount;
        }
      }

      this._shapes = (_this$_shapes = {
        shapes: shapes
      }, _this$_shapes[style.size2] = columnLength, _this$_shapes);

      var result = _FrameLayout.prototype._layout.call(this, items, outline, isAppend);

      if (!isAppend) {
        shapes.sort(function (shape1, shape2) {
          var item1pos1 = shape1[pos1Name];
          var item1pos2 = shape1[pos2Name];
          var item2pos1 = shape2[pos1Name];
          var item2pos2 = shape2[pos2Name];

          if (item1pos1 - item2pos1) {
            return item1pos1 - item2pos1;
          }

          return item1pos2 - item2pos2;
        });
        items.sort(function (a, b) {
          var item1pos1 = a.rect[pos1Name];
          var item1pos2 = a.rect[pos2Name];
          var item2pos1 = b.rect[pos1Name];
          var item2pos2 = b.rect[pos2Name];

          if (item1pos1 - item2pos1) {
            return item1pos1 - item2pos1;
          }

          return item1pos2 - item2pos2;
        });
      }

      return result;
    };

    return SquareLayout;
  }(FrameLayout);

  var BoxModel =
  /*#__PURE__*/
  function () {
    function BoxModel(options) {
      _extends(this, {
        originWidth: 0,
        originHeight: 0,
        width: 0,
        height: 0,
        left: 0,
        top: 0,
        items: []
      }, options);
    }

    var _proto = BoxModel.prototype;

    _proto.scaleTo = function scaleTo(width, height) {
      var scaleX = this.width ? width / this.width : 0;
      var scaleY = this.height ? height / this.height : 0;
      this.items.forEach(function (v) {
        if (scaleX !== 0) {
          v.left *= scaleX;
          v.width *= scaleX;
        }

        if (scaleY !== 0) {
          v.top *= scaleY;
          v.height *= scaleY;
        }
      });
      this.width = width;
      this.height = height;
    };

    _proto.push = function push(item) {
      this.items.push(item);
    };

    _proto.getOriginSize = function getOriginSize() {
      return this.originWidth * this.originHeight;
    };

    _proto.getSize = function getSize() {
      return this.width * this.height;
    };

    _proto.getOriginRatio = function getOriginRatio() {
      return this.originHeight === 0 ? 0 : this.originWidth / this.originHeight;
    };

    _proto.getRatio = function getRatio() {
      return this.height === 0 ? 0 : this.width / this.height;
    };

    return BoxModel;
  }();

  function getCost(originLength, length) {
    var cost = originLength / length;

    if (cost < 1) {
      cost = 1 / cost;
    }

    return cost - 1;
  }

  function fitArea(item, bestFitArea, itemFitSize, containerFitSize, layoutVertical) {
    item.height = itemFitSize.height;
    item.width = itemFitSize.width;
    bestFitArea.height = containerFitSize.height;
    bestFitArea.width = containerFitSize.width;

    if (layoutVertical) {
      item.top = bestFitArea.top + bestFitArea.height;
      item.left = bestFitArea.left;
    } else {
      item.left = bestFitArea.left + bestFitArea.width;
      item.top = bestFitArea.top;
    }
  }
  /**
   * @classdesc The PackingLayout is a layout that shows the important cards bigger without sacrificing the weight of the cards. Rows and columns are separated so that cards are dynamically placed within the horizontal and vertical space rather than arranged in an orderly fashion.
   * @ko PackingLayout은 카드의 본래 크기에 따른 비중을 해치지 않으면서 중요한 카드는 더 크게 보여 주는 레이아웃이다. 행과 열이 구분돼 이미지를 정돈되게 배치하는 대신 가로세로 일정 공간 내에서 동적으로 카드를 배치한다.
   * @class eg.InfiniteGrid.PackingLayout
   * @param {Object} [options] The option object of eg.InfiniteGrid.PackingLayout module <ko>eg.InfiniteGrid.PackingLayout 모듈의 옵션 객체</ko>
   * @param {String} [options.margin=0] Margin used to create space around items <ko>아이템들 사이의 공간</ko>
   * @param {Boolean} [options.horizontal=false] Direction of the scroll movement (false: vertical, true: horizontal) <ko>스크롤 이동 방향 (false: 세로방향, true: 가로방향)</ko>
   * @param {Boolean} [options.aspectRatio=1] The aspect ratio of the group <ko> 그룹의 가로 세로 비 </ko>
   * @param {Boolean} [options.sizeWeight=1] The size weight when placing an image <ko> 이미지를 배치할 때 사이즈 가중치 </ko>
   * @param {Boolean} [options.ratioWeight=1] The ratio weight when placing an image <ko> 이미지를 배치할 때 비율 가중치 </ko>
   * @example
  ```
  <script>
  var ig = new eg.InfiniteGrid("#grid". {
  	horizontal: true,
  });

  ig.setLayout(eg.InfiniteGrid.PackingLayout, {
  	margin: 10,
  	aspectRatio: 1,
  	sizeWeight: 1,
  	ratioWeight: 2,
  });

  // or

  var layout = new eg.InfiniteGrid.PackingLayout({
  	horizontal: true,
  	margin: 10,
  	aspectRatio: 1,
  	sizeWeight: 1,
  	ratioWeight: 2,
  });

  </script>
  ```
   **/


  var PackingLayout =
  /*#__PURE__*/
  function () {
    function PackingLayout(options) {
      if (options === void 0) {
        options = {};
      }

      this.options = assignOptions({
        margin: 0,
        horizontal: false,
        aspectRatio: 1,
        sizeWeight: 1,
        ratioWeight: 1
      }, options);
      this._size = 0;
      this._style = getStyleNames(this.options.horizontal);
    }

    var _proto = PackingLayout.prototype;

    _proto._findBestFitArea = function _findBestFitArea(container, item) {
      if (container.getRatio() === 0) {
        // 아이템 최초 삽입시 전체영역 지정
        container.originWidth = item.width;
        container.originHeight = item.height;
        container.width = item.width;
        container.height = item.height;
        return;
      }

      var bestFitArea = null;
      var minCost = 10000000;
      var layoutVertical = false;
      var itemFitSize = {
        width: 0,
        height: 0
      };
      var containerFitSize = {
        width: 0,
        height: 0
      };
      var _this$options = this.options,
          sizeWeight = _this$options.sizeWeight,
          ratioWeight = _this$options.ratioWeight;
      container.items.forEach(function (v) {
        var containerSizeCost = getCost(v.getOriginSize(), v.getSize()) * sizeWeight;
        var containerRatioCost = getCost(v.getOriginRatio(), v.getRatio()) * ratioWeight;
        var width = v.width;
        var height = v.height;
        var cost;

        for (var i = 0; i < 2; ++i) {
          var itemWidth = void 0;
          var itemHeight = void 0;
          var containerWidth = void 0;
          var containerHeight = void 0;

          if (i === 0) {
            // 상하에 아이템 추가
            itemWidth = width;
            itemHeight = height * (item.height / (v.originHeight + item.height));
            containerWidth = width;
            containerHeight = height - itemHeight;
          } else {
            // 좌우에 아이템 추가
            itemHeight = height;
            itemWidth = width * (item.width / (v.originWidth + item.width));
            containerHeight = height;
            containerWidth = width - itemWidth;
          }

          var itemSize = itemWidth * itemHeight;
          var itemRatio = itemWidth / itemHeight;
          var containerSize = containerWidth * containerHeight;
          var containerRatio = containerHeight / containerHeight;
          cost = getCost(item.getSize(), itemSize) * sizeWeight;
          cost += getCost(item.getRatio(), itemRatio) * ratioWeight;
          cost += getCost(v.getOriginSize(), containerSize) * sizeWeight - containerSizeCost;
          cost += getCost(v.getOriginRatio(), containerRatio) * ratioWeight - containerRatioCost;

          if (cost === Math.min(cost, minCost)) {
            minCost = cost;
            bestFitArea = v;
            layoutVertical = i === 0;
            itemFitSize.width = itemWidth;
            itemFitSize.height = itemHeight;
            containerFitSize.width = containerWidth;
            containerFitSize.height = containerHeight;
          }
        }
      });
      fitArea(item, bestFitArea, itemFitSize, containerFitSize, layoutVertical);
    };

    _proto._layout = function _layout(items, outline, isAppend) {
      var _this = this;

      if (outline === void 0) {
        outline = [];
      }

      var style = this._style;
      var _this$options2 = this.options,
          horizontal = _this$options2.horizontal,
          aspectRatio = _this$options2.aspectRatio,
          margin = _this$options2.margin;
      var pos1Name = style.pos1;
      var containerWidth = this._size * (horizontal ? aspectRatio : 1);
      var containerHeight = this._size / (horizontal ? 1 : aspectRatio);
      var containerSize1 = horizontal ? containerWidth : containerHeight;
      var prevOutline = toZeroArray(outline);
      var start = isAppend ? Math.max.apply(Math, prevOutline) : Math.min.apply(Math, prevOutline) - containerSize1 - margin;
      var end = start + containerSize1 + margin;
      var container = new BoxModel({});
      items.forEach(function (item) {
        var _item$orgSize = item.orgSize,
            width = _item$orgSize.width,
            height = _item$orgSize.height;
        var model = new BoxModel({
          width: width,
          height: height,
          originWidth: width,
          originHeight: height
        });

        _this._findBestFitArea(container, model);

        container.push(model);
        container.scaleTo(containerWidth + margin, containerHeight + margin);
      });
      items.forEach(function (item, i) {
        var boxItem = container.items[i];
        var width = boxItem.width;
        var height = boxItem.height;
        var top = boxItem.top;
        var left = boxItem.left;
        item.rect = {
          top: top,
          left: left,
          width: width - margin,
          height: height - margin
        };
        item.rect[pos1Name] += start;
      });
      return {
        start: [start],
        end: [end]
      };
    };

    _proto._insert = function _insert(items, outline, type, cache) {
      if (items === void 0) {
        items = [];
      }

      if (outline === void 0) {
        outline = [];
      }

      // this only needs the size of the item.
      var clone = cache ? items : cloneItems(items);
      return {
        items: clone,
        outlines: this._layout(clone, outline, type)
      };
    };
    /**
     * Adds items at the bottom of a outline.
     * @ko 아이템들을 아웃라인 아래에 추가한다.
     * @method eg.InfiniteGrid.PackingLayout#append
     * @param {Array} items Array of items to be layouted <ko>레이아웃할 아이템들의 배열</ko>
     * @param {Array} [outline=[]] Array of outline points to be reference points <ko>기준점이 되는 아웃라인 점들의 배열</ko>
     * @return {Object} Layouted items and outline of start and end <ko> 레이아웃이 된 아이템과 시작과 끝의 아웃라인이 담긴 정보</ko>
     * @example
     * layout.prepend(items, [100]);
     */


    _proto.append = function append(items, outline, cache) {
      return this._insert(items, outline, APPEND, cache);
    };
    /**
     * Adds items at the top of a outline.
     * @ko 아이템을 아웃라인 위에 추가한다.
     * @method eg.InfiniteGrid.PackingLayout#prepend
     * @param {Array} items Array of items to be layouted <ko>레이아웃할 아이템들의 배열</ko>
     * @param {Array} [outline=[]] Array of outline points to be reference points <ko>기준점이 되는 아웃라인 점들의 배열</ko>
     * @return {Object} Layouted items and outline of start and end <ko> 레이아웃이 된 아이템과 시작과 끝의 아웃라인이 담긴 정보</ko>
     * @example
     * layout.prepend(items, [100]);
     */


    _proto.prepend = function prepend(items, outline, cache) {
      return this._insert(items, outline, PREPEND, cache);
    };
    /**
     * Adds items of groups at the bottom of a outline.
     * @ko 그룹들의 아이템들을 아웃라인 아래에 추가한다.
     * @method eg.InfiniteGrid.PackingLayout#layout
     * @param {Array} groups Array of groups to be layouted <ko>레이아웃할 그룹들의 배열</ko>
     * @param {Array} outline Array of outline points to be reference points <ko>기준점이 되는 아웃라인 점들의 배열</ko>
     * @return {eg.InfiniteGrid.PackingLayout} An instance of a module itself<ko>모듈 자신의 인스턴스</ko>
     * @example
     * layout.layout(groups, [100, 200, 300, 400]);
     */


    _proto.layout = function layout(groups, outline) {
      if (groups === void 0) {
        groups = [];
      }

      if (outline === void 0) {
        outline = [];
      }

      var length = groups.length;
      var point = outline;

      for (var i = 0; i < length; ++i) {
        var group = groups[i];
        point = this._layout(group.items, point, APPEND);
        group.outlines = point;
        point = point.end;
      }

      return this;
    };
    /**
     * Set the viewport size of the layout.
     * @ko 레이아웃의 가시 사이즈를 설정한다.
     * @method eg.InfiniteGrid.PackingLayout#setSize
     * @param {Number} size The viewport size of container area where items are added to a layout <ko>레이아웃에 아이템을 추가하는 컨테이너 영역의 가시 사이즈</ko>
     * @return {eg.InfiniteGrid.PackingLayout} An instance of a module itself<ko>모듈 자신의 인스턴스</ko>
     * @example
     * layout.setSize(800);
     */


    _proto.setSize = function setSize(size) {
      this._size = size;
      return this;
    };

    return PackingLayout;
  }();

  /* eslint-disable */

  /******************************************************************************
   * Created 2008-08-19.
   *
   * Dijkstra path-finding functions. Adapted from the Dijkstar Python project.
   *
   * Copyright (C) 2008
   *   Wyatt Baldwin <self@wyattbaldwin.com>
   *   All rights reserved
   *
   * Licensed under the MIT license.
   *
   *   http://www.opensource.org/licenses/mit-license.php
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   * THE SOFTWARE.
   *****************************************************************************/
  var dijkstra = {
    single_source_shortest_paths: function single_source_shortest_paths(graph, s, d) {
      // Predecessor map for each node that has been encountered.
      // node ID => predecessor node ID
      var predecessors = {}; // Costs of shortest paths from s to all nodes encountered.
      // node ID => cost

      var costs = {};
      costs[s] = 0; // Costs of shortest paths from s to all nodes encountered; differs from
      // `costs` in that it provides easy access to the node that currently has
      // the known shortest path from s.
      // XXX: Do we actually need both `costs` and `open`?

      var open = new BinaryHeap(function (x) {
        return x.cost;
      });
      open.push({
        value: s,
        cost: 0
      });
      var closest, u, cost_of_s_to_u, adjacent_nodes, cost_of_e, cost_of_s_to_u_plus_cost_of_e, cost_of_s_to_v, first_visit;

      while (open.size()) {
        // In the nodes remaining in graph that have a known cost from s,
        // find the node, u, that currently has the shortest path from s.
        closest = open.pop();
        u = closest.value;
        cost_of_s_to_u = closest.cost; // Get nodes adjacent to u...

        adjacent_nodes = graph(u) || {}; // ...and explore the edges that connect u to those nodes, updating
        // the cost of the shortest paths to any or all of those nodes as
        // necessary. v is the node across the current edge from u.

        for (var v in adjacent_nodes) {
          // Get the cost of the edge running from u to v.
          cost_of_e = adjacent_nodes[v]; // Cost of s to u plus the cost of u to v across e--this is *a*
          // cost from s to v that may or may not be less than the current
          // known cost to v.

          cost_of_s_to_u_plus_cost_of_e = cost_of_s_to_u + cost_of_e; // If we haven't visited v yet OR if the current known cost from s to
          // v is greater than the new cost we just found (cost of s to u plus
          // cost of u to v across e), update v's cost in the cost list and
          // update v's predecessor in the predecessor list (it's now u).

          cost_of_s_to_v = costs[v];
          first_visit = typeof costs[v] === 'undefined';

          if (first_visit || cost_of_s_to_v > cost_of_s_to_u_plus_cost_of_e) {
            costs[v] = cost_of_s_to_u_plus_cost_of_e;
            open.push({
              value: v,
              cost: cost_of_s_to_u_plus_cost_of_e
            });
            predecessors[v] = u;
          }
        }
      }

      if (typeof costs[d] === 'undefined') {
        var msg = ['Could not find a path from ', s, ' to ', d, '.'].join('');
        throw new Error(msg);
      }

      return predecessors;
    },
    extract_shortest_path_from_predecessor_list: function extract_shortest_path_from_predecessor_list(predecessors, d) {
      var nodes = [];
      var u = d;
      var predecessor;

      while (u) {
        nodes.push(u);
        predecessor = predecessors[u];
        u = predecessors[u];
      }

      nodes.reverse();
      return nodes;
    },
    find_path: function find_path(graph, s, d) {
      var predecessors = dijkstra.single_source_shortest_paths(graph, s, d);
      return dijkstra.extract_shortest_path_from_predecessor_list(predecessors, d);
    }
  };

  var BinaryHeap =
  /*#__PURE__*/
  function () {
    function BinaryHeap(scoreFunction) {
      this.content = [];
      this.scoreFunction = scoreFunction;
    }

    var _proto = BinaryHeap.prototype;

    _proto.push = function push(element) {
      // Add the new element to the end of the array.
      this.content.push(element); // Allow it to bubble up.

      this.bubbleUp(this.content.length - 1);
    };

    _proto.pop = function pop() {
      // Store the first element so we can return it later.
      var result = this.content[0]; // Get the element at the end of the array.

      var end = this.content.pop(); // If there are any elements left, put the end element at the
      // start, and let it sink down.

      if (this.content.length > 0) {
        this.content[0] = end;
        this.sinkDown(0);
      }

      return result;
    };

    _proto.size = function size() {
      return this.content.length;
    };

    _proto.bubbleUp = function bubbleUp(n) {
      // Fetch the element that has to be moved.
      var element = this.content[n]; // When at 0, an element can not go up any further.

      while (n > 0) {
        // Compute the parent element's index, and fetch it.
        var parentN = Math.floor((n + 1) / 2) - 1,
            parent = this.content[parentN]; // Swap the elements if the parent is greater.

        if (this.scoreFunction(element) < this.scoreFunction(parent)) {
          this.content[parentN] = element;
          this.content[n] = parent; // Update 'n' to continue at the new position.

          n = parentN;
        } // Found a parent that is less, no need to move it further.
        else {
            break;
          }
      }
    };

    _proto.sinkDown = function sinkDown(n) {
      // Look up the target element and its score.
      var length = this.content.length,
          element = this.content[n],
          elemScore = this.scoreFunction(element);

      while (true) {
        // Compute the indices of the child elements.
        var child2N = (n + 1) * 2,
            child1N = child2N - 1; // This is used to store the new position of the element,
        // if any.

        var swap = null; // If the first child exists (is inside the array)...

        if (child1N < length) {
          // Look it up and compute its score.
          var child1 = this.content[child1N],
              child1Score = this.scoreFunction(child1); // If the score is less than our element's, we need to swap.

          if (child1Score < elemScore) {
            swap = child1N;
          }
        } // Do the same checks for the other child.


        if (child2N < length) {
          var child2 = this.content[child2N],
              child2Score = this.scoreFunction(child2);

          if (child2Score < (swap == null ? elemScore : child1Score)) {
            swap = child2N;
          }
        } // If the element needs to be moved, swap it, and continue.


        if (swap !== null) {
          this.content[n] = this.content[swap];
          this.content[swap] = element;
          n = swap;
        } // Otherwise, we are done.
        else {
            break;
          }
      }
    };

    return BinaryHeap;
  }();

  /**
   * @classdesc 'justified' is a printing term with the meaning that 'it fits in one row wide'. JustifiedLayout is a layout that the card is filled up on the basis of a line given a size.
   * @ko 'justified'는 '1행의 너비에 맞게 꼭 들어찬'이라는 의미를 가진 인쇄 용어다. 용어의 의미대로 너비가 주어진 사이즈를 기준으로 카드가 가득 차도록 배치하는 레이아웃이다.
   * @class eg.InfiniteGrid.JustifiedLayout
   * @param {Object} [options] The option object of eg.InfiniteGrid.JustifiedLayout module <ko>eg.InfiniteGrid.JustifiedLayout 모듈의 옵션 객체</ko>
   * @param {String} [options.margin=0] Margin used to create space around items <ko>아이템들 사이의 공간</ko>
   * @param {Boolean} [options.horizontal=false] Direction of the scroll movement (false: vertical, true: horizontal) <ko>스크롤 이동 방향 (false: 세로방향, true: 가로방향)</ko>
   * @param {Number} [options.minSize=0] Minimum size of item to be resized <ko> 아이템이 조정되는 최소 크기 </ko>
   * @param {Number} [options.maxSize=0] Maximum size of item to be resized <ko> 아이템이 조정되는 최대 크기 </ko>
   * @param {Array|Number} [options.column=[1, 8]] The number of items in a line <ko> 한 줄에 들어가는 아이템의 개수 </ko>
   * @example
  ```
  <script>
  var ig = new eg.InfiniteGrid("#grid". {
  	horizontal: true,
  });

  ig.setLayout(eg.InfiniteGrid.JustifiedLayout, {
  	margin: 10,
  	minSize: 100,
  	maxSize: 300,
  });

  // or

  var layout = new eg.InfiniteGrid.JustifiedLayout({
  	margin: 10,
  	minSize: 100,
  	maxSize: 300,
  	column: 5,
  	horizontal: true,
  });

  </script>
  ```
   **/

  var JustifiedLayout =
  /*#__PURE__*/
  function () {
    function JustifiedLayout(options) {
      if (options === void 0) {
        options = {};
      }

      this.options = assignOptions({
        margin: 0,
        horizontal: false,
        minSize: 0,
        maxSize: 0,
        column: [1, 8]
      }, options);
      this._style = getStyleNames(this.options.horizontal);
      this._size = 0;
    }

    var _proto = JustifiedLayout.prototype;

    _proto._layout = function _layout(items, outline, isAppend) {
      var _this = this;

      var style = this._style;
      var size1Name = style.size1;
      var size2Name = style.size2;
      var startIndex = 0;
      var endIndex = items.length;
      var column = this.options.column;

      if (typeof column !== "object") {
        column = [column, column];
      }

      var graph = function graph(_start) {
        var results = {};
        var start = +_start.replace(/[^0-9]/g, "");
        var length = endIndex + 1;

        for (var i = Math.min(start + column[0], length - 1); i < length; ++i) {
          if (i - start > column[1]) {
            break;
          }

          var cost = _this._getCost(items, start, i, size1Name, size2Name);

          if (cost === null) {
            continue;
          }

          if (cost < 0 && i === length - 1) {
            cost = 0;
          }

          results["" + i] = Math.pow(cost, 2);
        }

        return results;
      }; // shortest path for items' total height.


      var path = dijkstra.find_path(graph, "" + startIndex, "" + endIndex);
      return this._setStyle(items, path, outline, isAppend);
    };

    _proto._getSize = function _getSize(items, size1Name, size2Name) {
      var margin = this.options.margin;
      var size = items.reduce(function (sum, item) {
        return sum + item.orgSize[size2Name] / item.orgSize[size1Name];
      }, 0);
      return (this._size - margin * (items.length - 1)) / size;
    };

    _proto._getCost = function _getCost(items, i, j, size1Name, size2Name) {
      var size = this._getSize(items.slice(i, j), size1Name, size2Name);

      var min = this.options.minSize || 0;
      var max = this.options.maxSize || Infinity;

      if (isFinite(max)) {
        // if this size is not in range, the cost increases sharply.
        if (size < min) {
          return Math.pow(size - min, 2) + Math.pow(max, 2);
        } else if (size > max) {
          return Math.pow(size - max, 2) + Math.pow(max, 2);
        } else {
          // if this size in range, the cost is negative or low.
          return Math.min(size - max, min - size);
        }
      } // if max is infinite type, caculate cost only with "min".


      if (size < min) {
        return Math.max(Math.pow(min, 2), Math.pow(size, 2));
      }

      return size - min;
    };

    _proto._setStyle = function _setStyle(items, path, outline, isAppend) {
      if (outline === void 0) {
        outline = [];
      }

      var style = this._style; // if direction is vertical
      // pos1 : top, pos11 : bottom
      // size1 : height
      // pos2 : left, pos22 : right
      // size2 : width
      // if direction is horizontal
      // pos1 : left, pos11 : right
      // size1 : width
      // pos2 : top, pos22 : bottom
      // size2 : height

      var pos1Name = style.pos1;
      var size1Name = style.size1;
      var pos2Name = style.pos2;
      var size2Name = style.size2;
      var length = path.length;
      var margin = this.options.margin;
      var startPoint = outline[0] || 0;
      var endPoint = startPoint;
      var height = 0;

      for (var i = 0; i < length - 1; ++i) {
        var path1 = parseInt(path[i], 10);
        var path2 = parseInt(path[i + 1], 10); // pathItems(path1 to path2) are in 1 line.

        var pathItems = items.slice(path1, path2);
        var pathItemsLength = pathItems.length;

        var size1 = this._getSize(pathItems, size1Name, size2Name);

        var pos1 = endPoint;

        for (var j = 0; j < pathItemsLength; ++j) {
          var _item$rect;

          var item = pathItems[j];
          var size2 = item.orgSize[size2Name] / item.orgSize[size1Name] * size1; // item has margin bottom and right.
          // first item has not margin.

          var prevItemRect = j === 0 ? 0 : pathItems[j - 1].rect;
          var pos2 = prevItemRect ? prevItemRect[pos2Name] + prevItemRect[size2Name] + margin : 0;
          item.rect = (_item$rect = {}, _item$rect[pos1Name] = pos1, _item$rect[pos2Name] = pos2, _item$rect[size1Name] = size1, _item$rect[size2Name] = size2, _item$rect);
        }

        height += margin + size1;
        endPoint = startPoint + height;
      }

      var itemsLength = items.length;

      if (isAppend) {
        // previous group's end outline is current group's start outline
        return {
          start: [startPoint],
          end: [endPoint]
        };
      } // for prepend, only substract height from position.
      // always start is lower than end.


      for (var _i = 0; _i < itemsLength; ++_i) {
        var _item = items[_i]; // move items as long as height for prepend

        _item.rect[pos1Name] -= height;
      }

      return {
        start: [startPoint - height],
        end: [startPoint] // endPoint - height = startPoint

      };
    };

    _proto._insert = function _insert(items, outline, type, cache) {
      if (items === void 0) {
        items = [];
      }

      if (outline === void 0) {
        outline = [];
      }

      // this only needs the size of the item.
      var clone = cache ? items : cloneItems(items);
      return {
        items: clone,
        outlines: this._layout(clone, outline, type)
      };
    };
    /**
     * Set the viewport size of the layout.
     * @ko 레이아웃의 가시 사이즈를 설정한다.
     * @method eg.InfiniteGrid.JustifiedLayout#setSize
     * @param {Number} size The viewport size of container area where items are added to a layout <ko>레이아웃에 아이템을 추가하는 컨테이너 영역의 가시 사이즈</ko>
     * @return {eg.InfiniteGrid.JustifiedLayout} An instance of a module itself<ko>모듈 자신의 인스턴스</ko>
     * @example
     * layout.setSize(800);
     */


    _proto.setSize = function setSize(size) {
      this._size = size;
      return this;
    };
    /**
     * Adds items at the bottom of a outline.
     * @ko 아이템들을 아웃라인 아래에 추가한다.
     * @method eg.InfiniteGrid.JustifiedLayout#append
     * @param {Array} items Array of items to be layouted <ko>레이아웃할 아이템들의 배열</ko>
     * @param {Array} [outline=[]] Array of outline points to be reference points <ko>기준점이 되는 아웃라인 점들의 배열</ko>
     * @return {Object} Layouted items and outline of start and end <ko> 레이아웃이 된 아이템과 시작과 끝의 아웃라인이 담긴 정보</ko>
     * @example
     * layout.prepend(items, [100]);
     */


    _proto.append = function append(items, outline, cache) {
      return this._insert(items, outline, APPEND, cache);
    };
    /**
     * Adds items at the top of a outline.
     * @ko 아이템을 아웃라인 위에 추가한다.
     * @method eg.InfiniteGrid.JustifiedLayout#prepend
     * @param {Array} items Array of items to be layouted <ko>레이아웃할 아이템들의 배열</ko>
     * @param {Array} [outline=[]] Array of outline points to be reference points <ko>기준점이 되는 아웃라인 점들의 배열</ko>
     * @return {Object} Layouted items and outline of start and end <ko> 레이아웃이 된 아이템과 시작과 끝의 아웃라인이 담긴 정보</ko>
     * @example
     * layout.prepend(items, [100]);
     */


    _proto.prepend = function prepend(items, outline, cache) {
      return this._insert(items, outline, PREPEND, cache);
    };
    /**
     * Adds items of groups at the bottom of a outline.
     * @ko 그룹들의 아이템들을 아웃라인 아래에 추가한다.
     * @method eg.InfiniteGrid.JustifiedLayout#layout
     * @param {Array} groups Array of groups to be layouted <ko>레이아웃할 그룹들의 배열</ko>
     * @param {Array} outline Array of outline points to be reference points <ko>기준점이 되는 아웃라인 점들의 배열</ko>
     * @return {eg.InfiniteGrid.JustifiedLayout} An instance of a module itself<ko>모듈 자신의 인스턴스</ko>
     * @example
     * layout.layout(groups, [100]);
     */


    _proto.layout = function layout(groups, outline) {
      if (groups === void 0) {
        groups = [];
      }

      if (outline === void 0) {
        outline = [];
      }

      var length = groups.length;
      var point = outline;

      for (var i = 0; i < length; ++i) {
        var group = groups[i];
        point = this._layout(group.items, point, APPEND);
        group.outlines = point;
        point = point.end;
      }

      return this;
    };

    return JustifiedLayout;
  }();

  /**
   * Copyright (c) NAVER Corp.
   * egjs-infinitegrid projects are licensed under the MIT license
   */

  var modules = ({
    GridLayout: GridLayout,
    FrameLayout: FrameLayout,
    SquareLayout: SquareLayout,
    PackingLayout: PackingLayout,
    JustifiedLayout: JustifiedLayout,
    Infinite: Infinite,
    ImageLoaded: ImageLoaded,
    AutoSizer: AutoSizer,
    DOMRenderer: DOMRenderer,
    Watcher: Watcher,
    ItemManager: ItemManager,
    LayoutManager: LayoutMananger,
    default: InfiniteGrid
  });

  /**
   * Copyright (c) NAVER Corp.
   * egjs-infinitegrid projects are licensed under the MIT license
   */

  for (var name in modules) {
    InfiniteGrid[name] = modules[name];
  }

  return InfiniteGrid;

})));
//# sourceMappingURL=infinitegrid.js.map
