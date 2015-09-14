/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var createContext = __webpack_require__(1);
	var createLoop = __webpack_require__(3);

	var glm = __webpack_require__(13);
	var createShader = __webpack_require__(23);
	var createVBO = __webpack_require__(32);

	var platonic = __webpack_require__(48);

	window.testCube = function () {
	  var gl = createContext();
	  var app = createLoop(gl.canvas, {
	    scale: window.devicePixelRatio > 1 ? window.devicePixelRatio : 1
	  });

	  document.body.appendChild(gl.canvas);

	  var vertShaderSrc = '\n    uniform mat4 u_vertToView;\n    uniform mat4 u_normToView;\n    uniform mat4 u_projection;\n\n    attribute vec3 a_position;\n    attribute vec3 a_normal;\n\n    varying vec4 v_color;\n    varying vec3 v_viewNormal;\n    varying vec3 v_viewPos;\n\n    void main() {\n      gl_Position = u_projection * u_vertToView * vec4(a_position, 1.);\n\n      v_color = vec4(a_position, 1.);\n      v_viewPos = (u_vertToView * vec4(a_position, 1.)).xyz;\n      v_viewNormal = (u_normToView * vec4(a_normal, 1.)).xyz;\n    }\n  ';

	  var fragShaderSrc = '\n    precision highp float;\n\n    varying vec4 v_color;\n    varying vec3 v_viewNormal;\n    varying vec3 v_viewPos;\n\n    void main() {\n      vec3 toCamera = - v_viewPos;\n      float greyVal = clamp(dot(v_viewNormal, toCamera), 0., 1.) / 2.;\n      gl_FragColor = vec4(greyVal, greyVal, greyVal, 1.);\n    }\n  ';

	  var shader = createShader(gl, vertShaderSrc, fragShaderSrc);

	  console.log(shader.attributes.a_position.location, shader.attributes.a_normal.location);

	  var cubeGeom = platonic.cube({ normals: true, sharedVertices: false });
	  var verticesBuffer = createVBO(gl, cubeGeom.vertices);
	  var normalsBuffer = createVBO(gl, cubeGeom.normals);
	  var indicesBuffer = createVBO(gl, cubeGeom.indices, gl.ELEMENT_ARRAY_BUFFER);

	  console.log(cubeGeom.normals);

	  var modelRotation = glm.quat.create();
	  var viewMatrix = glm.mat4.lookAt(glm.mat4.create(), glm.vec3.fromValues(0, 0, 2), glm.vec3.fromValues(0, 0, 0), glm.vec3.fromValues(0, -1, 0));

	  var projectionMatrix = null;

	  gl.clearColor(0, 0, 0, 1);
	  gl.enable(gl.CULL_FACE);

	  function onResize() {
	    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	    projectionMatrix = glm.mat4.perspective(glm.mat4.create(), 30, gl.canvas.width / gl.canvas.height, 0.1, 5);
	  }

	  onResize();

	  app.on('tick', function tick(dt) {
	    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	    shader.bind();

	    glm.quat.rotateX(modelRotation, modelRotation, Math.PI / 500);
	    glm.quat.rotateY(modelRotation, modelRotation, Math.PI / 500);

	    var modelView = glm.mat4.mul(glm.mat4.create(), viewMatrix, glm.mat4.fromQuat(glm.mat4.create(), modelRotation));
	    var normalView = glm.mat4.invert(glm.mat4.create(), modelView);
	    normalView = glm.mat4.transpose(normalView, normalView);

	    shader.uniforms.u_vertToView = modelView;
	    shader.uniforms.u_normToView = normalView;
	    shader.uniforms.u_projection = projectionMatrix;

	    verticesBuffer.bind();
	    shader.attributes.a_position.pointer(gl.FLOAT, false, 0, 0);

	    normalsBuffer.bind();
	    shader.attributes.a_normal.pointer(gl.FLOAT, false, 0, 0);

	    indicesBuffer.bind();

	    gl.drawElements(gl.TRIANGLES, cubeGeom.indexCount, gl.UNSIGNED_SHORT, 0);
	  }).on('resize', onResize).start();
	};

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var getContext = __webpack_require__(2);

	module.exports = function getWebGLContext(opt) {
	  return getContext('webgl', opt);
	};

/***/ },
/* 2 */
/***/ function(module, exports) {

	'use strict';

	module.exports = getCanvasContext;
	function getCanvasContext(type, opts) {
	  if (typeof type !== 'string') {
	    throw new TypeError('must specify type string');
	  }
	  if (typeof document === 'undefined') {
	    return null; // check for Node
	  }

	  opts = opts || {};
	  var canvas = opts.canvas || document.createElement('canvas');
	  if (typeof opts.width === 'number') {
	    canvas.width = opts.width;
	  }
	  if (typeof opts.height === 'number') {
	    canvas.height = opts.height;
	  }

	  var attribs = opts;
	  var gl;
	  try {
	    var names = [type];
	    // prefix GL contexts
	    if (type.indexOf('webgl') === 0) {
	      names.push('experimental-' + type);
	    }

	    for (var i = 0; i < names.length; i++) {
	      gl = canvas.getContext(names[i], attribs);
	      if (gl) return gl;
	    }
	  } catch (e) {
	    gl = null;
	  }
	  return gl || null; // ensure null on fail
	}

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var fitter = __webpack_require__(4);
	var loop = __webpack_require__(6);

	module.exports = function (canvas, opt) {
	  opt = opt || {};

	  var fit = fitter(canvas, opt.parent, opt.scale);
	  var app = loop();
	  var shape = [0, 0];

	  resize();

	  window.addEventListener('resize', function () {
	    resize();
	    app.emit('resize');
	  }, false);

	  Object.defineProperties(app, {
	    scale: {
	      get: function get() {
	        return fit.scale;
	      },
	      set: function set(s) {
	        fit.scale = s;
	      }
	    },
	    shape: {
	      get: function get() {
	        return shape;
	      }
	    },
	    parent: {
	      get: function get() {
	        return fit.parent;
	      },
	      set: function set(p) {
	        fit.parent = p;
	      }
	    }
	  });

	  return app;

	  function resize() {
	    fit();
	    var deviceWidth = canvas.width;
	    var deviceHeight = canvas.height;
	    shape[0] = deviceWidth / fit.scale;
	    shape[1] = deviceHeight / fit.scale;
	  }
	};

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var size = __webpack_require__(5);

	module.exports = fit;

	var scratch = new Float32Array(2);

	function fit(canvas, parent, scale) {
	  var isSVG = canvas.nodeName.toUpperCase() === 'SVG';

	  canvas.style.position = canvas.style.position || 'absolute';
	  canvas.style.top = 0;
	  canvas.style.left = 0;

	  resize.scale = parseFloat(scale || 1);
	  resize.parent = parent;

	  return resize();

	  function resize() {
	    var p = resize.parent || canvas.parentNode;
	    if (typeof p === 'function') {
	      var dims = p(scratch) || scratch;
	      var width = dims[0];
	      var height = dims[1];
	    } else if (p && p !== document.body) {
	      var psize = size(p);
	      var width = psize[0] | 0;
	      var height = psize[1] | 0;
	    } else {
	      var width = window.innerWidth;
	      var height = window.innerHeight;
	    }

	    if (isSVG) {
	      canvas.setAttribute('width', width * resize.scale + 'px');
	      canvas.setAttribute('height', height * resize.scale + 'px');
	    } else {
	      canvas.width = width * resize.scale;
	      canvas.height = height * resize.scale;
	    }

	    canvas.style.width = width + 'px';
	    canvas.style.height = height + 'px';

	    return resize;
	  }
	}

/***/ },
/* 5 */
/***/ function(module, exports) {

	'use strict';

	module.exports = getSize;

	function getSize(element) {
	  // Handle cases where the element is not already
	  // attached to the DOM by briefly appending it
	  // to document.body, and removing it again later.
	  if (element === window || element === document.body) {
	    return [window.innerWidth, window.innerHeight];
	  }

	  if (!element.parentNode) {
	    var temporary = true;
	    document.body.appendChild(element);
	  }

	  var bounds = element.getBoundingClientRect();
	  var styles = getComputedStyle(element);
	  var height = (bounds.height | 0) + parse(styles.getPropertyValue('margin-top')) + parse(styles.getPropertyValue('margin-bottom'));
	  var width = (bounds.width | 0) + parse(styles.getPropertyValue('margin-left')) + parse(styles.getPropertyValue('margin-right'));

	  if (temporary) {
	    document.body.removeChild(element);
	  }

	  return [width, height];
	}

	function parse(prop) {
	  return parseFloat(prop) || 0;
	}

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var inherits = __webpack_require__(7);
	var EventEmitter = __webpack_require__(8).EventEmitter;
	var now = __webpack_require__(9);
	var raf = __webpack_require__(10);

	module.exports = Engine;
	function Engine(fn) {
	    if (!(this instanceof Engine)) return new Engine(fn);
	    this.running = false;
	    this.last = now();
	    this._frame = 0;
	    this._tick = this.tick.bind(this);

	    if (fn) this.on('tick', fn);
	}

	inherits(Engine, EventEmitter);

	Engine.prototype.start = function () {
	    if (this.running) return;
	    this.running = true;
	    this.last = now();
	    this._frame = raf(this._tick);
	    return this;
	};

	Engine.prototype.stop = function () {
	    this.running = false;
	    if (this._frame !== 0) raf.cancel(this._frame);
	    this._frame = 0;
	    return this;
	};

	Engine.prototype.tick = function () {
	    this._frame = raf(this._tick);
	    var time = now();
	    var dt = time - this.last;
	    this.emit('tick', dt);
	    this.last = time;
	};

/***/ },
/* 7 */
/***/ function(module, exports) {

	'use strict';

	if (typeof Object.create === 'function') {
	  // implementation from standard node.js 'util' module
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor;
	    ctor.prototype = Object.create(superCtor.prototype, {
	      constructor: {
	        value: ctor,
	        enumerable: false,
	        writable: true,
	        configurable: true
	      }
	    });
	  };
	} else {
	  // old school shim for old browsers
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor;
	    var TempCtor = function TempCtor() {};
	    TempCtor.prototype = superCtor.prototype;
	    ctor.prototype = new TempCtor();
	    ctor.prototype.constructor = ctor;
	  };
	}

/***/ },
/* 8 */
/***/ function(module, exports) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	'use strict';

	function EventEmitter() {
	  this._events = this._events || {};
	  this._maxListeners = this._maxListeners || undefined;
	}
	module.exports = EventEmitter;

	// Backwards-compat with node 0.10.x
	EventEmitter.EventEmitter = EventEmitter;

	EventEmitter.prototype._events = undefined;
	EventEmitter.prototype._maxListeners = undefined;

	// By default EventEmitters will print a warning if more than 10 listeners are
	// added to it. This is a useful default which helps finding memory leaks.
	EventEmitter.defaultMaxListeners = 10;

	// Obviously not all Emitters should be limited to 10. This function allows
	// that to be increased. Set to zero for unlimited.
	EventEmitter.prototype.setMaxListeners = function (n) {
	  if (!isNumber(n) || n < 0 || isNaN(n)) throw TypeError('n must be a positive number');
	  this._maxListeners = n;
	  return this;
	};

	EventEmitter.prototype.emit = function (type) {
	  var er, handler, len, args, i, listeners;

	  if (!this._events) this._events = {};

	  // If there is no 'error' event listener then throw.
	  if (type === 'error') {
	    if (!this._events.error || isObject(this._events.error) && !this._events.error.length) {
	      er = arguments[1];
	      if (er instanceof Error) {
	        throw er; // Unhandled 'error' event
	      }
	      throw TypeError('Uncaught, unspecified "error" event.');
	    }
	  }

	  handler = this._events[type];

	  if (isUndefined(handler)) return false;

	  if (isFunction(handler)) {
	    switch (arguments.length) {
	      // fast cases
	      case 1:
	        handler.call(this);
	        break;
	      case 2:
	        handler.call(this, arguments[1]);
	        break;
	      case 3:
	        handler.call(this, arguments[1], arguments[2]);
	        break;
	      // slower
	      default:
	        len = arguments.length;
	        args = new Array(len - 1);
	        for (i = 1; i < len; i++) args[i - 1] = arguments[i];
	        handler.apply(this, args);
	    }
	  } else if (isObject(handler)) {
	    len = arguments.length;
	    args = new Array(len - 1);
	    for (i = 1; i < len; i++) args[i - 1] = arguments[i];

	    listeners = handler.slice();
	    len = listeners.length;
	    for (i = 0; i < len; i++) listeners[i].apply(this, args);
	  }

	  return true;
	};

	EventEmitter.prototype.addListener = function (type, listener) {
	  var m;

	  if (!isFunction(listener)) throw TypeError('listener must be a function');

	  if (!this._events) this._events = {};

	  // To avoid recursion in the case that type === "newListener"! Before
	  // adding it to the listeners, first emit "newListener".
	  if (this._events.newListener) this.emit('newListener', type, isFunction(listener.listener) ? listener.listener : listener);

	  if (!this._events[type])
	    // Optimize the case of one listener. Don't need the extra array object.
	    this._events[type] = listener;else if (isObject(this._events[type]))
	    // If we've already got an array, just append.
	    this._events[type].push(listener);else
	    // Adding the second element, need to change to array.
	    this._events[type] = [this._events[type], listener];

	  // Check for listener leak
	  if (isObject(this._events[type]) && !this._events[type].warned) {
	    var m;
	    if (!isUndefined(this._maxListeners)) {
	      m = this._maxListeners;
	    } else {
	      m = EventEmitter.defaultMaxListeners;
	    }

	    if (m && m > 0 && this._events[type].length > m) {
	      this._events[type].warned = true;
	      console.error('(node) warning: possible EventEmitter memory ' + 'leak detected. %d listeners added. ' + 'Use emitter.setMaxListeners() to increase limit.', this._events[type].length);
	      if (typeof console.trace === 'function') {
	        // not supported in IE 10
	        console.trace();
	      }
	    }
	  }

	  return this;
	};

	EventEmitter.prototype.on = EventEmitter.prototype.addListener;

	EventEmitter.prototype.once = function (type, listener) {
	  if (!isFunction(listener)) throw TypeError('listener must be a function');

	  var fired = false;

	  function g() {
	    this.removeListener(type, g);

	    if (!fired) {
	      fired = true;
	      listener.apply(this, arguments);
	    }
	  }

	  g.listener = listener;
	  this.on(type, g);

	  return this;
	};

	// emits a 'removeListener' event iff the listener was removed
	EventEmitter.prototype.removeListener = function (type, listener) {
	  var list, position, length, i;

	  if (!isFunction(listener)) throw TypeError('listener must be a function');

	  if (!this._events || !this._events[type]) return this;

	  list = this._events[type];
	  length = list.length;
	  position = -1;

	  if (list === listener || isFunction(list.listener) && list.listener === listener) {
	    delete this._events[type];
	    if (this._events.removeListener) this.emit('removeListener', type, listener);
	  } else if (isObject(list)) {
	    for (i = length; i-- > 0;) {
	      if (list[i] === listener || list[i].listener && list[i].listener === listener) {
	        position = i;
	        break;
	      }
	    }

	    if (position < 0) return this;

	    if (list.length === 1) {
	      list.length = 0;
	      delete this._events[type];
	    } else {
	      list.splice(position, 1);
	    }

	    if (this._events.removeListener) this.emit('removeListener', type, listener);
	  }

	  return this;
	};

	EventEmitter.prototype.removeAllListeners = function (type) {
	  var key, listeners;

	  if (!this._events) return this;

	  // not listening for removeListener, no need to emit
	  if (!this._events.removeListener) {
	    if (arguments.length === 0) this._events = {};else if (this._events[type]) delete this._events[type];
	    return this;
	  }

	  // emit removeListener for all listeners on all events
	  if (arguments.length === 0) {
	    for (key in this._events) {
	      if (key === 'removeListener') continue;
	      this.removeAllListeners(key);
	    }
	    this.removeAllListeners('removeListener');
	    this._events = {};
	    return this;
	  }

	  listeners = this._events[type];

	  if (isFunction(listeners)) {
	    this.removeListener(type, listeners);
	  } else {
	    // LIFO order
	    while (listeners.length) this.removeListener(type, listeners[listeners.length - 1]);
	  }
	  delete this._events[type];

	  return this;
	};

	EventEmitter.prototype.listeners = function (type) {
	  var ret;
	  if (!this._events || !this._events[type]) ret = [];else if (isFunction(this._events[type])) ret = [this._events[type]];else ret = this._events[type].slice();
	  return ret;
	};

	EventEmitter.listenerCount = function (emitter, type) {
	  var ret;
	  if (!emitter._events || !emitter._events[type]) ret = 0;else if (isFunction(emitter._events[type])) ret = 1;else ret = emitter._events[type].length;
	  return ret;
	};

	function isFunction(arg) {
	  return typeof arg === 'function';
	}

	function isNumber(arg) {
	  return typeof arg === 'number';
	}

	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}

	function isUndefined(arg) {
	  return arg === void 0;
	}

/***/ },
/* 9 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {"use strict";

	module.exports = global.performance && global.performance.now ? function now() {
	  return performance.now();
	} : Date.now || function now() {
	  return +new Date();
	};
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var now = __webpack_require__(11),
	    global = typeof window === 'undefined' ? {} : window,
	    vendors = ['moz', 'webkit'],
	    suffix = 'AnimationFrame',
	    raf = global['request' + suffix],
	    caf = global['cancel' + suffix] || global['cancelRequest' + suffix];

	for (var i = 0; i < vendors.length && !raf; i++) {
	  raf = global[vendors[i] + 'Request' + suffix];
	  caf = global[vendors[i] + 'Cancel' + suffix] || global[vendors[i] + 'CancelRequest' + suffix];
	}

	// Some versions of FF have rAF but not cAF
	if (!raf || !caf) {
	  var last = 0,
	      id = 0,
	      queue = [],
	      frameDuration = 1000 / 60;

	  raf = function (callback) {
	    if (queue.length === 0) {
	      var _now = now(),
	          next = Math.max(0, frameDuration - (_now - last));
	      last = next + _now;
	      setTimeout(function () {
	        var cp = queue.slice(0);
	        // Clear queue here to prevent
	        // callbacks from appending listeners
	        // to the current frame's queue
	        queue.length = 0;
	        for (var i = 0; i < cp.length; i++) {
	          if (!cp[i].cancelled) {
	            try {
	              cp[i].callback(last);
	            } catch (e) {
	              setTimeout(function () {
	                throw e;
	              }, 0);
	            }
	          }
	        }
	      }, Math.round(next));
	    }
	    queue.push({
	      handle: ++id,
	      callback: callback,
	      cancelled: false
	    });
	    return id;
	  };

	  caf = function (handle) {
	    for (var i = 0; i < queue.length; i++) {
	      if (queue[i].handle === handle) {
	        queue[i].cancelled = true;
	      }
	    }
	  };
	}

	module.exports = function (fn) {
	  // Wrap in a new function to prevent
	  // `cancel` potentially being assigned
	  // to the native rAF function
	  return raf.call(global, fn);
	};
	module.exports.cancel = function () {
	  caf.apply(global, arguments);
	};

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {// Generated by CoffeeScript 1.7.1
	"use strict";

	(function () {
	  var getNanoSeconds, hrtime, loadTime;

	  if (typeof performance !== "undefined" && performance !== null && performance.now) {
	    module.exports = function () {
	      return performance.now();
	    };
	  } else if (typeof process !== "undefined" && process !== null && process.hrtime) {
	    module.exports = function () {
	      return (getNanoSeconds() - loadTime) / 1e6;
	    };
	    hrtime = process.hrtime;
	    getNanoSeconds = function () {
	      var hr;
	      hr = hrtime();
	      return hr[0] * 1e9 + hr[1];
	    };
	    loadTime = getNanoSeconds();
	  } else if (Date.now) {
	    module.exports = function () {
	      return Date.now() - loadTime;
	    };
	    loadTime = Date.now();
	  } else {
	    module.exports = function () {
	      return new Date().getTime() - loadTime;
	    };
	    loadTime = new Date().getTime();
	  }
	}).call(undefined);
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(12)))

/***/ },
/* 12 */
/***/ function(module, exports) {

	// shim for using process in browser

	'use strict';

	var process = module.exports = {};
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;

	function cleanUpNextTick() {
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}

	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = setTimeout(cleanUpNextTick);
	    draining = true;

	    var len = queue.length;
	    while (len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    clearTimeout(timeout);
	}

	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        setTimeout(drainQueue, 0);
	    }
	};

	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};

	function noop() {}

	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;

	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};

	process.cwd = function () {
	    return '/';
	};
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function () {
	    return 0;
	};

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileoverview gl-matrix - High performance matrix and vector operations
	 * @author Brandon Jones
	 * @author Colin MacKenzie IV
	 * @version 2.3.0
	 */

	/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE. */
	// END HEADER

	"use strict";

	exports.glMatrix = __webpack_require__(14);
	exports.mat2 = __webpack_require__(15);
	exports.mat2d = __webpack_require__(16);
	exports.mat3 = __webpack_require__(17);
	exports.mat4 = __webpack_require__(18);
	exports.quat = __webpack_require__(19);
	exports.vec2 = __webpack_require__(22);
	exports.vec3 = __webpack_require__(20);
	exports.vec4 = __webpack_require__(21);

/***/ },
/* 14 */
/***/ function(module, exports) {

	/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE. */

	/**
	 * @class Common utilities
	 * @name glMatrix
	 */
	'use strict';

	var glMatrix = {};

	// Constants
	glMatrix.EPSILON = 0.000001;
	glMatrix.ARRAY_TYPE = typeof Float32Array !== 'undefined' ? Float32Array : Array;
	glMatrix.RANDOM = Math.random;

	/**
	 * Sets the type of array used when creating new vectors and matrices
	 *
	 * @param {Type} type Array type, such as Float32Array or Array
	 */
	glMatrix.setMatrixArrayType = function (type) {
	  GLMAT_ARRAY_TYPE = type;
	};

	var degree = Math.PI / 180;

	/**
	* Convert Degree To Radian
	*
	* @param {Number} Angle in Degrees
	*/
	glMatrix.toRadian = function (a) {
	  return a * degree;
	};

	module.exports = glMatrix;

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE. */

	'use strict';

	var glMatrix = __webpack_require__(14);

	/**
	 * @class 2x2 Matrix
	 * @name mat2
	 */
	var mat2 = {};

	/**
	 * Creates a new identity mat2
	 *
	 * @returns {mat2} a new 2x2 matrix
	 */
	mat2.create = function () {
	    var out = new glMatrix.ARRAY_TYPE(4);
	    out[0] = 1;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 1;
	    return out;
	};

	/**
	 * Creates a new mat2 initialized with values from an existing matrix
	 *
	 * @param {mat2} a matrix to clone
	 * @returns {mat2} a new 2x2 matrix
	 */
	mat2.clone = function (a) {
	    var out = new glMatrix.ARRAY_TYPE(4);
	    out[0] = a[0];
	    out[1] = a[1];
	    out[2] = a[2];
	    out[3] = a[3];
	    return out;
	};

	/**
	 * Copy the values from one mat2 to another
	 *
	 * @param {mat2} out the receiving matrix
	 * @param {mat2} a the source matrix
	 * @returns {mat2} out
	 */
	mat2.copy = function (out, a) {
	    out[0] = a[0];
	    out[1] = a[1];
	    out[2] = a[2];
	    out[3] = a[3];
	    return out;
	};

	/**
	 * Set a mat2 to the identity matrix
	 *
	 * @param {mat2} out the receiving matrix
	 * @returns {mat2} out
	 */
	mat2.identity = function (out) {
	    out[0] = 1;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 1;
	    return out;
	};

	/**
	 * Transpose the values of a mat2
	 *
	 * @param {mat2} out the receiving matrix
	 * @param {mat2} a the source matrix
	 * @returns {mat2} out
	 */
	mat2.transpose = function (out, a) {
	    // If we are transposing ourselves we can skip a few steps but have to cache some values
	    if (out === a) {
	        var a1 = a[1];
	        out[1] = a[2];
	        out[2] = a1;
	    } else {
	        out[0] = a[0];
	        out[1] = a[2];
	        out[2] = a[1];
	        out[3] = a[3];
	    }

	    return out;
	};

	/**
	 * Inverts a mat2
	 *
	 * @param {mat2} out the receiving matrix
	 * @param {mat2} a the source matrix
	 * @returns {mat2} out
	 */
	mat2.invert = function (out, a) {
	    var a0 = a[0],
	        a1 = a[1],
	        a2 = a[2],
	        a3 = a[3],

	    // Calculate the determinant
	    det = a0 * a3 - a2 * a1;

	    if (!det) {
	        return null;
	    }
	    det = 1.0 / det;

	    out[0] = a3 * det;
	    out[1] = -a1 * det;
	    out[2] = -a2 * det;
	    out[3] = a0 * det;

	    return out;
	};

	/**
	 * Calculates the adjugate of a mat2
	 *
	 * @param {mat2} out the receiving matrix
	 * @param {mat2} a the source matrix
	 * @returns {mat2} out
	 */
	mat2.adjoint = function (out, a) {
	    // Caching this value is nessecary if out == a
	    var a0 = a[0];
	    out[0] = a[3];
	    out[1] = -a[1];
	    out[2] = -a[2];
	    out[3] = a0;

	    return out;
	};

	/**
	 * Calculates the determinant of a mat2
	 *
	 * @param {mat2} a the source matrix
	 * @returns {Number} determinant of a
	 */
	mat2.determinant = function (a) {
	    return a[0] * a[3] - a[2] * a[1];
	};

	/**
	 * Multiplies two mat2's
	 *
	 * @param {mat2} out the receiving matrix
	 * @param {mat2} a the first operand
	 * @param {mat2} b the second operand
	 * @returns {mat2} out
	 */
	mat2.multiply = function (out, a, b) {
	    var a0 = a[0],
	        a1 = a[1],
	        a2 = a[2],
	        a3 = a[3];
	    var b0 = b[0],
	        b1 = b[1],
	        b2 = b[2],
	        b3 = b[3];
	    out[0] = a0 * b0 + a2 * b1;
	    out[1] = a1 * b0 + a3 * b1;
	    out[2] = a0 * b2 + a2 * b3;
	    out[3] = a1 * b2 + a3 * b3;
	    return out;
	};

	/**
	 * Alias for {@link mat2.multiply}
	 * @function
	 */
	mat2.mul = mat2.multiply;

	/**
	 * Rotates a mat2 by the given angle
	 *
	 * @param {mat2} out the receiving matrix
	 * @param {mat2} a the matrix to rotate
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat2} out
	 */
	mat2.rotate = function (out, a, rad) {
	    var a0 = a[0],
	        a1 = a[1],
	        a2 = a[2],
	        a3 = a[3],
	        s = Math.sin(rad),
	        c = Math.cos(rad);
	    out[0] = a0 * c + a2 * s;
	    out[1] = a1 * c + a3 * s;
	    out[2] = a0 * -s + a2 * c;
	    out[3] = a1 * -s + a3 * c;
	    return out;
	};

	/**
	 * Scales the mat2 by the dimensions in the given vec2
	 *
	 * @param {mat2} out the receiving matrix
	 * @param {mat2} a the matrix to rotate
	 * @param {vec2} v the vec2 to scale the matrix by
	 * @returns {mat2} out
	 **/
	mat2.scale = function (out, a, v) {
	    var a0 = a[0],
	        a1 = a[1],
	        a2 = a[2],
	        a3 = a[3],
	        v0 = v[0],
	        v1 = v[1];
	    out[0] = a0 * v0;
	    out[1] = a1 * v0;
	    out[2] = a2 * v1;
	    out[3] = a3 * v1;
	    return out;
	};

	/**
	 * Creates a matrix from a given angle
	 * This is equivalent to (but much faster than):
	 *
	 *     mat2.identity(dest);
	 *     mat2.rotate(dest, dest, rad);
	 *
	 * @param {mat2} out mat2 receiving operation result
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat2} out
	 */
	mat2.fromRotation = function (out, rad) {
	    var s = Math.sin(rad),
	        c = Math.cos(rad);
	    out[0] = c;
	    out[1] = s;
	    out[2] = -s;
	    out[3] = c;
	    return out;
	};

	/**
	 * Creates a matrix from a vector scaling
	 * This is equivalent to (but much faster than):
	 *
	 *     mat2.identity(dest);
	 *     mat2.scale(dest, dest, vec);
	 *
	 * @param {mat2} out mat2 receiving operation result
	 * @param {vec2} v Scaling vector
	 * @returns {mat2} out
	 */
	mat2.fromScaling = function (out, v) {
	    out[0] = v[0];
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = v[1];
	    return out;
	};

	/**
	 * Returns a string representation of a mat2
	 *
	 * @param {mat2} mat matrix to represent as a string
	 * @returns {String} string representation of the matrix
	 */
	mat2.str = function (a) {
	    return 'mat2(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
	};

	/**
	 * Returns Frobenius norm of a mat2
	 *
	 * @param {mat2} a the matrix to calculate Frobenius norm of
	 * @returns {Number} Frobenius norm
	 */
	mat2.frob = function (a) {
	    return Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2) + Math.pow(a[2], 2) + Math.pow(a[3], 2));
	};

	/**
	 * Returns L, D and U matrices (Lower triangular, Diagonal and Upper triangular) by factorizing the input matrix
	 * @param {mat2} L the lower triangular matrix 
	 * @param {mat2} D the diagonal matrix 
	 * @param {mat2} U the upper triangular matrix 
	 * @param {mat2} a the input matrix to factorize
	 */

	mat2.LDU = function (L, D, U, a) {
	    L[2] = a[2] / a[0];
	    U[0] = a[0];
	    U[1] = a[1];
	    U[3] = a[3] - L[2] * U[1];
	    return [L, D, U];
	};

	module.exports = mat2;

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE. */

	'use strict';

	var glMatrix = __webpack_require__(14);

	/**
	 * @class 2x3 Matrix
	 * @name mat2d
	 * 
	 * @description 
	 * A mat2d contains six elements defined as:
	 * <pre>
	 * [a, c, tx,
	 *  b, d, ty]
	 * </pre>
	 * This is a short form for the 3x3 matrix:
	 * <pre>
	 * [a, c, tx,
	 *  b, d, ty,
	 *  0, 0, 1]
	 * </pre>
	 * The last row is ignored so the array is shorter and operations are faster.
	 */
	var mat2d = {};

	/**
	 * Creates a new identity mat2d
	 *
	 * @returns {mat2d} a new 2x3 matrix
	 */
	mat2d.create = function () {
	    var out = new glMatrix.ARRAY_TYPE(6);
	    out[0] = 1;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 1;
	    out[4] = 0;
	    out[5] = 0;
	    return out;
	};

	/**
	 * Creates a new mat2d initialized with values from an existing matrix
	 *
	 * @param {mat2d} a matrix to clone
	 * @returns {mat2d} a new 2x3 matrix
	 */
	mat2d.clone = function (a) {
	    var out = new glMatrix.ARRAY_TYPE(6);
	    out[0] = a[0];
	    out[1] = a[1];
	    out[2] = a[2];
	    out[3] = a[3];
	    out[4] = a[4];
	    out[5] = a[5];
	    return out;
	};

	/**
	 * Copy the values from one mat2d to another
	 *
	 * @param {mat2d} out the receiving matrix
	 * @param {mat2d} a the source matrix
	 * @returns {mat2d} out
	 */
	mat2d.copy = function (out, a) {
	    out[0] = a[0];
	    out[1] = a[1];
	    out[2] = a[2];
	    out[3] = a[3];
	    out[4] = a[4];
	    out[5] = a[5];
	    return out;
	};

	/**
	 * Set a mat2d to the identity matrix
	 *
	 * @param {mat2d} out the receiving matrix
	 * @returns {mat2d} out
	 */
	mat2d.identity = function (out) {
	    out[0] = 1;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 1;
	    out[4] = 0;
	    out[5] = 0;
	    return out;
	};

	/**
	 * Inverts a mat2d
	 *
	 * @param {mat2d} out the receiving matrix
	 * @param {mat2d} a the source matrix
	 * @returns {mat2d} out
	 */
	mat2d.invert = function (out, a) {
	    var aa = a[0],
	        ab = a[1],
	        ac = a[2],
	        ad = a[3],
	        atx = a[4],
	        aty = a[5];

	    var det = aa * ad - ab * ac;
	    if (!det) {
	        return null;
	    }
	    det = 1.0 / det;

	    out[0] = ad * det;
	    out[1] = -ab * det;
	    out[2] = -ac * det;
	    out[3] = aa * det;
	    out[4] = (ac * aty - ad * atx) * det;
	    out[5] = (ab * atx - aa * aty) * det;
	    return out;
	};

	/**
	 * Calculates the determinant of a mat2d
	 *
	 * @param {mat2d} a the source matrix
	 * @returns {Number} determinant of a
	 */
	mat2d.determinant = function (a) {
	    return a[0] * a[3] - a[1] * a[2];
	};

	/**
	 * Multiplies two mat2d's
	 *
	 * @param {mat2d} out the receiving matrix
	 * @param {mat2d} a the first operand
	 * @param {mat2d} b the second operand
	 * @returns {mat2d} out
	 */
	mat2d.multiply = function (out, a, b) {
	    var a0 = a[0],
	        a1 = a[1],
	        a2 = a[2],
	        a3 = a[3],
	        a4 = a[4],
	        a5 = a[5],
	        b0 = b[0],
	        b1 = b[1],
	        b2 = b[2],
	        b3 = b[3],
	        b4 = b[4],
	        b5 = b[5];
	    out[0] = a0 * b0 + a2 * b1;
	    out[1] = a1 * b0 + a3 * b1;
	    out[2] = a0 * b2 + a2 * b3;
	    out[3] = a1 * b2 + a3 * b3;
	    out[4] = a0 * b4 + a2 * b5 + a4;
	    out[5] = a1 * b4 + a3 * b5 + a5;
	    return out;
	};

	/**
	 * Alias for {@link mat2d.multiply}
	 * @function
	 */
	mat2d.mul = mat2d.multiply;

	/**
	 * Rotates a mat2d by the given angle
	 *
	 * @param {mat2d} out the receiving matrix
	 * @param {mat2d} a the matrix to rotate
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat2d} out
	 */
	mat2d.rotate = function (out, a, rad) {
	    var a0 = a[0],
	        a1 = a[1],
	        a2 = a[2],
	        a3 = a[3],
	        a4 = a[4],
	        a5 = a[5],
	        s = Math.sin(rad),
	        c = Math.cos(rad);
	    out[0] = a0 * c + a2 * s;
	    out[1] = a1 * c + a3 * s;
	    out[2] = a0 * -s + a2 * c;
	    out[3] = a1 * -s + a3 * c;
	    out[4] = a4;
	    out[5] = a5;
	    return out;
	};

	/**
	 * Scales the mat2d by the dimensions in the given vec2
	 *
	 * @param {mat2d} out the receiving matrix
	 * @param {mat2d} a the matrix to translate
	 * @param {vec2} v the vec2 to scale the matrix by
	 * @returns {mat2d} out
	 **/
	mat2d.scale = function (out, a, v) {
	    var a0 = a[0],
	        a1 = a[1],
	        a2 = a[2],
	        a3 = a[3],
	        a4 = a[4],
	        a5 = a[5],
	        v0 = v[0],
	        v1 = v[1];
	    out[0] = a0 * v0;
	    out[1] = a1 * v0;
	    out[2] = a2 * v1;
	    out[3] = a3 * v1;
	    out[4] = a4;
	    out[5] = a5;
	    return out;
	};

	/**
	 * Translates the mat2d by the dimensions in the given vec2
	 *
	 * @param {mat2d} out the receiving matrix
	 * @param {mat2d} a the matrix to translate
	 * @param {vec2} v the vec2 to translate the matrix by
	 * @returns {mat2d} out
	 **/
	mat2d.translate = function (out, a, v) {
	    var a0 = a[0],
	        a1 = a[1],
	        a2 = a[2],
	        a3 = a[3],
	        a4 = a[4],
	        a5 = a[5],
	        v0 = v[0],
	        v1 = v[1];
	    out[0] = a0;
	    out[1] = a1;
	    out[2] = a2;
	    out[3] = a3;
	    out[4] = a0 * v0 + a2 * v1 + a4;
	    out[5] = a1 * v0 + a3 * v1 + a5;
	    return out;
	};

	/**
	 * Creates a matrix from a given angle
	 * This is equivalent to (but much faster than):
	 *
	 *     mat2d.identity(dest);
	 *     mat2d.rotate(dest, dest, rad);
	 *
	 * @param {mat2d} out mat2d receiving operation result
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat2d} out
	 */
	mat2d.fromRotation = function (out, rad) {
	    var s = Math.sin(rad),
	        c = Math.cos(rad);
	    out[0] = c;
	    out[1] = s;
	    out[2] = -s;
	    out[3] = c;
	    out[4] = 0;
	    out[5] = 0;
	    return out;
	};

	/**
	 * Creates a matrix from a vector scaling
	 * This is equivalent to (but much faster than):
	 *
	 *     mat2d.identity(dest);
	 *     mat2d.scale(dest, dest, vec);
	 *
	 * @param {mat2d} out mat2d receiving operation result
	 * @param {vec2} v Scaling vector
	 * @returns {mat2d} out
	 */
	mat2d.fromScaling = function (out, v) {
	    out[0] = v[0];
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = v[1];
	    out[4] = 0;
	    out[5] = 0;
	    return out;
	};

	/**
	 * Creates a matrix from a vector translation
	 * This is equivalent to (but much faster than):
	 *
	 *     mat2d.identity(dest);
	 *     mat2d.translate(dest, dest, vec);
	 *
	 * @param {mat2d} out mat2d receiving operation result
	 * @param {vec2} v Translation vector
	 * @returns {mat2d} out
	 */
	mat2d.fromTranslation = function (out, v) {
	    out[0] = 1;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 1;
	    out[4] = v[0];
	    out[5] = v[1];
	    return out;
	};

	/**
	 * Returns a string representation of a mat2d
	 *
	 * @param {mat2d} a matrix to represent as a string
	 * @returns {String} string representation of the matrix
	 */
	mat2d.str = function (a) {
	    return 'mat2d(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ', ' + a[4] + ', ' + a[5] + ')';
	};

	/**
	 * Returns Frobenius norm of a mat2d
	 *
	 * @param {mat2d} a the matrix to calculate Frobenius norm of
	 * @returns {Number} Frobenius norm
	 */
	mat2d.frob = function (a) {
	    return Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2) + Math.pow(a[2], 2) + Math.pow(a[3], 2) + Math.pow(a[4], 2) + Math.pow(a[5], 2) + 1);
	};

	module.exports = mat2d;

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE. */

	'use strict';

	var glMatrix = __webpack_require__(14);

	/**
	 * @class 3x3 Matrix
	 * @name mat3
	 */
	var mat3 = {};

	/**
	 * Creates a new identity mat3
	 *
	 * @returns {mat3} a new 3x3 matrix
	 */
	mat3.create = function () {
	    var out = new glMatrix.ARRAY_TYPE(9);
	    out[0] = 1;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    out[4] = 1;
	    out[5] = 0;
	    out[6] = 0;
	    out[7] = 0;
	    out[8] = 1;
	    return out;
	};

	/**
	 * Copies the upper-left 3x3 values into the given mat3.
	 *
	 * @param {mat3} out the receiving 3x3 matrix
	 * @param {mat4} a   the source 4x4 matrix
	 * @returns {mat3} out
	 */
	mat3.fromMat4 = function (out, a) {
	    out[0] = a[0];
	    out[1] = a[1];
	    out[2] = a[2];
	    out[3] = a[4];
	    out[4] = a[5];
	    out[5] = a[6];
	    out[6] = a[8];
	    out[7] = a[9];
	    out[8] = a[10];
	    return out;
	};

	/**
	 * Creates a new mat3 initialized with values from an existing matrix
	 *
	 * @param {mat3} a matrix to clone
	 * @returns {mat3} a new 3x3 matrix
	 */
	mat3.clone = function (a) {
	    var out = new glMatrix.ARRAY_TYPE(9);
	    out[0] = a[0];
	    out[1] = a[1];
	    out[2] = a[2];
	    out[3] = a[3];
	    out[4] = a[4];
	    out[5] = a[5];
	    out[6] = a[6];
	    out[7] = a[7];
	    out[8] = a[8];
	    return out;
	};

	/**
	 * Copy the values from one mat3 to another
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {mat3} a the source matrix
	 * @returns {mat3} out
	 */
	mat3.copy = function (out, a) {
	    out[0] = a[0];
	    out[1] = a[1];
	    out[2] = a[2];
	    out[3] = a[3];
	    out[4] = a[4];
	    out[5] = a[5];
	    out[6] = a[6];
	    out[7] = a[7];
	    out[8] = a[8];
	    return out;
	};

	/**
	 * Set a mat3 to the identity matrix
	 *
	 * @param {mat3} out the receiving matrix
	 * @returns {mat3} out
	 */
	mat3.identity = function (out) {
	    out[0] = 1;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    out[4] = 1;
	    out[5] = 0;
	    out[6] = 0;
	    out[7] = 0;
	    out[8] = 1;
	    return out;
	};

	/**
	 * Transpose the values of a mat3
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {mat3} a the source matrix
	 * @returns {mat3} out
	 */
	mat3.transpose = function (out, a) {
	    // If we are transposing ourselves we can skip a few steps but have to cache some values
	    if (out === a) {
	        var a01 = a[1],
	            a02 = a[2],
	            a12 = a[5];
	        out[1] = a[3];
	        out[2] = a[6];
	        out[3] = a01;
	        out[5] = a[7];
	        out[6] = a02;
	        out[7] = a12;
	    } else {
	        out[0] = a[0];
	        out[1] = a[3];
	        out[2] = a[6];
	        out[3] = a[1];
	        out[4] = a[4];
	        out[5] = a[7];
	        out[6] = a[2];
	        out[7] = a[5];
	        out[8] = a[8];
	    }

	    return out;
	};

	/**
	 * Inverts a mat3
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {mat3} a the source matrix
	 * @returns {mat3} out
	 */
	mat3.invert = function (out, a) {
	    var a00 = a[0],
	        a01 = a[1],
	        a02 = a[2],
	        a10 = a[3],
	        a11 = a[4],
	        a12 = a[5],
	        a20 = a[6],
	        a21 = a[7],
	        a22 = a[8],
	        b01 = a22 * a11 - a12 * a21,
	        b11 = -a22 * a10 + a12 * a20,
	        b21 = a21 * a10 - a11 * a20,

	    // Calculate the determinant
	    det = a00 * b01 + a01 * b11 + a02 * b21;

	    if (!det) {
	        return null;
	    }
	    det = 1.0 / det;

	    out[0] = b01 * det;
	    out[1] = (-a22 * a01 + a02 * a21) * det;
	    out[2] = (a12 * a01 - a02 * a11) * det;
	    out[3] = b11 * det;
	    out[4] = (a22 * a00 - a02 * a20) * det;
	    out[5] = (-a12 * a00 + a02 * a10) * det;
	    out[6] = b21 * det;
	    out[7] = (-a21 * a00 + a01 * a20) * det;
	    out[8] = (a11 * a00 - a01 * a10) * det;
	    return out;
	};

	/**
	 * Calculates the adjugate of a mat3
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {mat3} a the source matrix
	 * @returns {mat3} out
	 */
	mat3.adjoint = function (out, a) {
	    var a00 = a[0],
	        a01 = a[1],
	        a02 = a[2],
	        a10 = a[3],
	        a11 = a[4],
	        a12 = a[5],
	        a20 = a[6],
	        a21 = a[7],
	        a22 = a[8];

	    out[0] = a11 * a22 - a12 * a21;
	    out[1] = a02 * a21 - a01 * a22;
	    out[2] = a01 * a12 - a02 * a11;
	    out[3] = a12 * a20 - a10 * a22;
	    out[4] = a00 * a22 - a02 * a20;
	    out[5] = a02 * a10 - a00 * a12;
	    out[6] = a10 * a21 - a11 * a20;
	    out[7] = a01 * a20 - a00 * a21;
	    out[8] = a00 * a11 - a01 * a10;
	    return out;
	};

	/**
	 * Calculates the determinant of a mat3
	 *
	 * @param {mat3} a the source matrix
	 * @returns {Number} determinant of a
	 */
	mat3.determinant = function (a) {
	    var a00 = a[0],
	        a01 = a[1],
	        a02 = a[2],
	        a10 = a[3],
	        a11 = a[4],
	        a12 = a[5],
	        a20 = a[6],
	        a21 = a[7],
	        a22 = a[8];

	    return a00 * (a22 * a11 - a12 * a21) + a01 * (-a22 * a10 + a12 * a20) + a02 * (a21 * a10 - a11 * a20);
	};

	/**
	 * Multiplies two mat3's
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {mat3} a the first operand
	 * @param {mat3} b the second operand
	 * @returns {mat3} out
	 */
	mat3.multiply = function (out, a, b) {
	    var a00 = a[0],
	        a01 = a[1],
	        a02 = a[2],
	        a10 = a[3],
	        a11 = a[4],
	        a12 = a[5],
	        a20 = a[6],
	        a21 = a[7],
	        a22 = a[8],
	        b00 = b[0],
	        b01 = b[1],
	        b02 = b[2],
	        b10 = b[3],
	        b11 = b[4],
	        b12 = b[5],
	        b20 = b[6],
	        b21 = b[7],
	        b22 = b[8];

	    out[0] = b00 * a00 + b01 * a10 + b02 * a20;
	    out[1] = b00 * a01 + b01 * a11 + b02 * a21;
	    out[2] = b00 * a02 + b01 * a12 + b02 * a22;

	    out[3] = b10 * a00 + b11 * a10 + b12 * a20;
	    out[4] = b10 * a01 + b11 * a11 + b12 * a21;
	    out[5] = b10 * a02 + b11 * a12 + b12 * a22;

	    out[6] = b20 * a00 + b21 * a10 + b22 * a20;
	    out[7] = b20 * a01 + b21 * a11 + b22 * a21;
	    out[8] = b20 * a02 + b21 * a12 + b22 * a22;
	    return out;
	};

	/**
	 * Alias for {@link mat3.multiply}
	 * @function
	 */
	mat3.mul = mat3.multiply;

	/**
	 * Translate a mat3 by the given vector
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {mat3} a the matrix to translate
	 * @param {vec2} v vector to translate by
	 * @returns {mat3} out
	 */
	mat3.translate = function (out, a, v) {
	    var a00 = a[0],
	        a01 = a[1],
	        a02 = a[2],
	        a10 = a[3],
	        a11 = a[4],
	        a12 = a[5],
	        a20 = a[6],
	        a21 = a[7],
	        a22 = a[8],
	        x = v[0],
	        y = v[1];

	    out[0] = a00;
	    out[1] = a01;
	    out[2] = a02;

	    out[3] = a10;
	    out[4] = a11;
	    out[5] = a12;

	    out[6] = x * a00 + y * a10 + a20;
	    out[7] = x * a01 + y * a11 + a21;
	    out[8] = x * a02 + y * a12 + a22;
	    return out;
	};

	/**
	 * Rotates a mat3 by the given angle
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {mat3} a the matrix to rotate
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat3} out
	 */
	mat3.rotate = function (out, a, rad) {
	    var a00 = a[0],
	        a01 = a[1],
	        a02 = a[2],
	        a10 = a[3],
	        a11 = a[4],
	        a12 = a[5],
	        a20 = a[6],
	        a21 = a[7],
	        a22 = a[8],
	        s = Math.sin(rad),
	        c = Math.cos(rad);

	    out[0] = c * a00 + s * a10;
	    out[1] = c * a01 + s * a11;
	    out[2] = c * a02 + s * a12;

	    out[3] = c * a10 - s * a00;
	    out[4] = c * a11 - s * a01;
	    out[5] = c * a12 - s * a02;

	    out[6] = a20;
	    out[7] = a21;
	    out[8] = a22;
	    return out;
	};

	/**
	 * Scales the mat3 by the dimensions in the given vec2
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {mat3} a the matrix to rotate
	 * @param {vec2} v the vec2 to scale the matrix by
	 * @returns {mat3} out
	 **/
	mat3.scale = function (out, a, v) {
	    var x = v[0],
	        y = v[1];

	    out[0] = x * a[0];
	    out[1] = x * a[1];
	    out[2] = x * a[2];

	    out[3] = y * a[3];
	    out[4] = y * a[4];
	    out[5] = y * a[5];

	    out[6] = a[6];
	    out[7] = a[7];
	    out[8] = a[8];
	    return out;
	};

	/**
	 * Creates a matrix from a vector translation
	 * This is equivalent to (but much faster than):
	 *
	 *     mat3.identity(dest);
	 *     mat3.translate(dest, dest, vec);
	 *
	 * @param {mat3} out mat3 receiving operation result
	 * @param {vec2} v Translation vector
	 * @returns {mat3} out
	 */
	mat3.fromTranslation = function (out, v) {
	    out[0] = 1;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    out[4] = 1;
	    out[5] = 0;
	    out[6] = v[0];
	    out[7] = v[1];
	    out[8] = 1;
	    return out;
	};

	/**
	 * Creates a matrix from a given angle
	 * This is equivalent to (but much faster than):
	 *
	 *     mat3.identity(dest);
	 *     mat3.rotate(dest, dest, rad);
	 *
	 * @param {mat3} out mat3 receiving operation result
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat3} out
	 */
	mat3.fromRotation = function (out, rad) {
	    var s = Math.sin(rad),
	        c = Math.cos(rad);

	    out[0] = c;
	    out[1] = s;
	    out[2] = 0;

	    out[3] = -s;
	    out[4] = c;
	    out[5] = 0;

	    out[6] = 0;
	    out[7] = 0;
	    out[8] = 1;
	    return out;
	};

	/**
	 * Creates a matrix from a vector scaling
	 * This is equivalent to (but much faster than):
	 *
	 *     mat3.identity(dest);
	 *     mat3.scale(dest, dest, vec);
	 *
	 * @param {mat3} out mat3 receiving operation result
	 * @param {vec2} v Scaling vector
	 * @returns {mat3} out
	 */
	mat3.fromScaling = function (out, v) {
	    out[0] = v[0];
	    out[1] = 0;
	    out[2] = 0;

	    out[3] = 0;
	    out[4] = v[1];
	    out[5] = 0;

	    out[6] = 0;
	    out[7] = 0;
	    out[8] = 1;
	    return out;
	};

	/**
	 * Copies the values from a mat2d into a mat3
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {mat2d} a the matrix to copy
	 * @returns {mat3} out
	 **/
	mat3.fromMat2d = function (out, a) {
	    out[0] = a[0];
	    out[1] = a[1];
	    out[2] = 0;

	    out[3] = a[2];
	    out[4] = a[3];
	    out[5] = 0;

	    out[6] = a[4];
	    out[7] = a[5];
	    out[8] = 1;
	    return out;
	};

	/**
	* Calculates a 3x3 matrix from the given quaternion
	*
	* @param {mat3} out mat3 receiving operation result
	* @param {quat} q Quaternion to create matrix from
	*
	* @returns {mat3} out
	*/
	mat3.fromQuat = function (out, q) {
	    var x = q[0],
	        y = q[1],
	        z = q[2],
	        w = q[3],
	        x2 = x + x,
	        y2 = y + y,
	        z2 = z + z,
	        xx = x * x2,
	        yx = y * x2,
	        yy = y * y2,
	        zx = z * x2,
	        zy = z * y2,
	        zz = z * z2,
	        wx = w * x2,
	        wy = w * y2,
	        wz = w * z2;

	    out[0] = 1 - yy - zz;
	    out[3] = yx - wz;
	    out[6] = zx + wy;

	    out[1] = yx + wz;
	    out[4] = 1 - xx - zz;
	    out[7] = zy - wx;

	    out[2] = zx - wy;
	    out[5] = zy + wx;
	    out[8] = 1 - xx - yy;

	    return out;
	};

	/**
	* Calculates a 3x3 normal matrix (transpose inverse) from the 4x4 matrix
	*
	* @param {mat3} out mat3 receiving operation result
	* @param {mat4} a Mat4 to derive the normal matrix from
	*
	* @returns {mat3} out
	*/
	mat3.normalFromMat4 = function (out, a) {
	    var a00 = a[0],
	        a01 = a[1],
	        a02 = a[2],
	        a03 = a[3],
	        a10 = a[4],
	        a11 = a[5],
	        a12 = a[6],
	        a13 = a[7],
	        a20 = a[8],
	        a21 = a[9],
	        a22 = a[10],
	        a23 = a[11],
	        a30 = a[12],
	        a31 = a[13],
	        a32 = a[14],
	        a33 = a[15],
	        b00 = a00 * a11 - a01 * a10,
	        b01 = a00 * a12 - a02 * a10,
	        b02 = a00 * a13 - a03 * a10,
	        b03 = a01 * a12 - a02 * a11,
	        b04 = a01 * a13 - a03 * a11,
	        b05 = a02 * a13 - a03 * a12,
	        b06 = a20 * a31 - a21 * a30,
	        b07 = a20 * a32 - a22 * a30,
	        b08 = a20 * a33 - a23 * a30,
	        b09 = a21 * a32 - a22 * a31,
	        b10 = a21 * a33 - a23 * a31,
	        b11 = a22 * a33 - a23 * a32,

	    // Calculate the determinant
	    det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

	    if (!det) {
	        return null;
	    }
	    det = 1.0 / det;

	    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
	    out[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
	    out[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;

	    out[3] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
	    out[4] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
	    out[5] = (a01 * b08 - a00 * b10 - a03 * b06) * det;

	    out[6] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
	    out[7] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
	    out[8] = (a30 * b04 - a31 * b02 + a33 * b00) * det;

	    return out;
	};

	/**
	 * Returns a string representation of a mat3
	 *
	 * @param {mat3} mat matrix to represent as a string
	 * @returns {String} string representation of the matrix
	 */
	mat3.str = function (a) {
	    return 'mat3(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ', ' + a[4] + ', ' + a[5] + ', ' + a[6] + ', ' + a[7] + ', ' + a[8] + ')';
	};

	/**
	 * Returns Frobenius norm of a mat3
	 *
	 * @param {mat3} a the matrix to calculate Frobenius norm of
	 * @returns {Number} Frobenius norm
	 */
	mat3.frob = function (a) {
	    return Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2) + Math.pow(a[2], 2) + Math.pow(a[3], 2) + Math.pow(a[4], 2) + Math.pow(a[5], 2) + Math.pow(a[6], 2) + Math.pow(a[7], 2) + Math.pow(a[8], 2));
	};

	module.exports = mat3;

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE. */

	'use strict';

	var glMatrix = __webpack_require__(14);

	/**
	 * @class 4x4 Matrix
	 * @name mat4
	 */
	var mat4 = {};

	/**
	 * Creates a new identity mat4
	 *
	 * @returns {mat4} a new 4x4 matrix
	 */
	mat4.create = function () {
	    var out = new glMatrix.ARRAY_TYPE(16);
	    out[0] = 1;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    out[4] = 0;
	    out[5] = 1;
	    out[6] = 0;
	    out[7] = 0;
	    out[8] = 0;
	    out[9] = 0;
	    out[10] = 1;
	    out[11] = 0;
	    out[12] = 0;
	    out[13] = 0;
	    out[14] = 0;
	    out[15] = 1;
	    return out;
	};

	/**
	 * Creates a new mat4 initialized with values from an existing matrix
	 *
	 * @param {mat4} a matrix to clone
	 * @returns {mat4} a new 4x4 matrix
	 */
	mat4.clone = function (a) {
	    var out = new glMatrix.ARRAY_TYPE(16);
	    out[0] = a[0];
	    out[1] = a[1];
	    out[2] = a[2];
	    out[3] = a[3];
	    out[4] = a[4];
	    out[5] = a[5];
	    out[6] = a[6];
	    out[7] = a[7];
	    out[8] = a[8];
	    out[9] = a[9];
	    out[10] = a[10];
	    out[11] = a[11];
	    out[12] = a[12];
	    out[13] = a[13];
	    out[14] = a[14];
	    out[15] = a[15];
	    return out;
	};

	/**
	 * Copy the values from one mat4 to another
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the source matrix
	 * @returns {mat4} out
	 */
	mat4.copy = function (out, a) {
	    out[0] = a[0];
	    out[1] = a[1];
	    out[2] = a[2];
	    out[3] = a[3];
	    out[4] = a[4];
	    out[5] = a[5];
	    out[6] = a[6];
	    out[7] = a[7];
	    out[8] = a[8];
	    out[9] = a[9];
	    out[10] = a[10];
	    out[11] = a[11];
	    out[12] = a[12];
	    out[13] = a[13];
	    out[14] = a[14];
	    out[15] = a[15];
	    return out;
	};

	/**
	 * Set a mat4 to the identity matrix
	 *
	 * @param {mat4} out the receiving matrix
	 * @returns {mat4} out
	 */
	mat4.identity = function (out) {
	    out[0] = 1;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    out[4] = 0;
	    out[5] = 1;
	    out[6] = 0;
	    out[7] = 0;
	    out[8] = 0;
	    out[9] = 0;
	    out[10] = 1;
	    out[11] = 0;
	    out[12] = 0;
	    out[13] = 0;
	    out[14] = 0;
	    out[15] = 1;
	    return out;
	};

	/**
	 * Transpose the values of a mat4
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the source matrix
	 * @returns {mat4} out
	 */
	mat4.transpose = function (out, a) {
	    // If we are transposing ourselves we can skip a few steps but have to cache some values
	    if (out === a) {
	        var a01 = a[1],
	            a02 = a[2],
	            a03 = a[3],
	            a12 = a[6],
	            a13 = a[7],
	            a23 = a[11];

	        out[1] = a[4];
	        out[2] = a[8];
	        out[3] = a[12];
	        out[4] = a01;
	        out[6] = a[9];
	        out[7] = a[13];
	        out[8] = a02;
	        out[9] = a12;
	        out[11] = a[14];
	        out[12] = a03;
	        out[13] = a13;
	        out[14] = a23;
	    } else {
	        out[0] = a[0];
	        out[1] = a[4];
	        out[2] = a[8];
	        out[3] = a[12];
	        out[4] = a[1];
	        out[5] = a[5];
	        out[6] = a[9];
	        out[7] = a[13];
	        out[8] = a[2];
	        out[9] = a[6];
	        out[10] = a[10];
	        out[11] = a[14];
	        out[12] = a[3];
	        out[13] = a[7];
	        out[14] = a[11];
	        out[15] = a[15];
	    }

	    return out;
	};

	/**
	 * Inverts a mat4
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the source matrix
	 * @returns {mat4} out
	 */
	mat4.invert = function (out, a) {
	    var a00 = a[0],
	        a01 = a[1],
	        a02 = a[2],
	        a03 = a[3],
	        a10 = a[4],
	        a11 = a[5],
	        a12 = a[6],
	        a13 = a[7],
	        a20 = a[8],
	        a21 = a[9],
	        a22 = a[10],
	        a23 = a[11],
	        a30 = a[12],
	        a31 = a[13],
	        a32 = a[14],
	        a33 = a[15],
	        b00 = a00 * a11 - a01 * a10,
	        b01 = a00 * a12 - a02 * a10,
	        b02 = a00 * a13 - a03 * a10,
	        b03 = a01 * a12 - a02 * a11,
	        b04 = a01 * a13 - a03 * a11,
	        b05 = a02 * a13 - a03 * a12,
	        b06 = a20 * a31 - a21 * a30,
	        b07 = a20 * a32 - a22 * a30,
	        b08 = a20 * a33 - a23 * a30,
	        b09 = a21 * a32 - a22 * a31,
	        b10 = a21 * a33 - a23 * a31,
	        b11 = a22 * a33 - a23 * a32,

	    // Calculate the determinant
	    det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

	    if (!det) {
	        return null;
	    }
	    det = 1.0 / det;

	    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
	    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
	    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
	    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
	    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
	    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
	    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
	    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
	    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
	    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
	    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
	    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
	    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
	    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
	    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
	    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

	    return out;
	};

	/**
	 * Calculates the adjugate of a mat4
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the source matrix
	 * @returns {mat4} out
	 */
	mat4.adjoint = function (out, a) {
	    var a00 = a[0],
	        a01 = a[1],
	        a02 = a[2],
	        a03 = a[3],
	        a10 = a[4],
	        a11 = a[5],
	        a12 = a[6],
	        a13 = a[7],
	        a20 = a[8],
	        a21 = a[9],
	        a22 = a[10],
	        a23 = a[11],
	        a30 = a[12],
	        a31 = a[13],
	        a32 = a[14],
	        a33 = a[15];

	    out[0] = a11 * (a22 * a33 - a23 * a32) - a21 * (a12 * a33 - a13 * a32) + a31 * (a12 * a23 - a13 * a22);
	    out[1] = -(a01 * (a22 * a33 - a23 * a32) - a21 * (a02 * a33 - a03 * a32) + a31 * (a02 * a23 - a03 * a22));
	    out[2] = a01 * (a12 * a33 - a13 * a32) - a11 * (a02 * a33 - a03 * a32) + a31 * (a02 * a13 - a03 * a12);
	    out[3] = -(a01 * (a12 * a23 - a13 * a22) - a11 * (a02 * a23 - a03 * a22) + a21 * (a02 * a13 - a03 * a12));
	    out[4] = -(a10 * (a22 * a33 - a23 * a32) - a20 * (a12 * a33 - a13 * a32) + a30 * (a12 * a23 - a13 * a22));
	    out[5] = a00 * (a22 * a33 - a23 * a32) - a20 * (a02 * a33 - a03 * a32) + a30 * (a02 * a23 - a03 * a22);
	    out[6] = -(a00 * (a12 * a33 - a13 * a32) - a10 * (a02 * a33 - a03 * a32) + a30 * (a02 * a13 - a03 * a12));
	    out[7] = a00 * (a12 * a23 - a13 * a22) - a10 * (a02 * a23 - a03 * a22) + a20 * (a02 * a13 - a03 * a12);
	    out[8] = a10 * (a21 * a33 - a23 * a31) - a20 * (a11 * a33 - a13 * a31) + a30 * (a11 * a23 - a13 * a21);
	    out[9] = -(a00 * (a21 * a33 - a23 * a31) - a20 * (a01 * a33 - a03 * a31) + a30 * (a01 * a23 - a03 * a21));
	    out[10] = a00 * (a11 * a33 - a13 * a31) - a10 * (a01 * a33 - a03 * a31) + a30 * (a01 * a13 - a03 * a11);
	    out[11] = -(a00 * (a11 * a23 - a13 * a21) - a10 * (a01 * a23 - a03 * a21) + a20 * (a01 * a13 - a03 * a11));
	    out[12] = -(a10 * (a21 * a32 - a22 * a31) - a20 * (a11 * a32 - a12 * a31) + a30 * (a11 * a22 - a12 * a21));
	    out[13] = a00 * (a21 * a32 - a22 * a31) - a20 * (a01 * a32 - a02 * a31) + a30 * (a01 * a22 - a02 * a21);
	    out[14] = -(a00 * (a11 * a32 - a12 * a31) - a10 * (a01 * a32 - a02 * a31) + a30 * (a01 * a12 - a02 * a11));
	    out[15] = a00 * (a11 * a22 - a12 * a21) - a10 * (a01 * a22 - a02 * a21) + a20 * (a01 * a12 - a02 * a11);
	    return out;
	};

	/**
	 * Calculates the determinant of a mat4
	 *
	 * @param {mat4} a the source matrix
	 * @returns {Number} determinant of a
	 */
	mat4.determinant = function (a) {
	    var a00 = a[0],
	        a01 = a[1],
	        a02 = a[2],
	        a03 = a[3],
	        a10 = a[4],
	        a11 = a[5],
	        a12 = a[6],
	        a13 = a[7],
	        a20 = a[8],
	        a21 = a[9],
	        a22 = a[10],
	        a23 = a[11],
	        a30 = a[12],
	        a31 = a[13],
	        a32 = a[14],
	        a33 = a[15],
	        b00 = a00 * a11 - a01 * a10,
	        b01 = a00 * a12 - a02 * a10,
	        b02 = a00 * a13 - a03 * a10,
	        b03 = a01 * a12 - a02 * a11,
	        b04 = a01 * a13 - a03 * a11,
	        b05 = a02 * a13 - a03 * a12,
	        b06 = a20 * a31 - a21 * a30,
	        b07 = a20 * a32 - a22 * a30,
	        b08 = a20 * a33 - a23 * a30,
	        b09 = a21 * a32 - a22 * a31,
	        b10 = a21 * a33 - a23 * a31,
	        b11 = a22 * a33 - a23 * a32;

	    // Calculate the determinant
	    return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
	};

	/**
	 * Multiplies two mat4's
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the first operand
	 * @param {mat4} b the second operand
	 * @returns {mat4} out
	 */
	mat4.multiply = function (out, a, b) {
	    var a00 = a[0],
	        a01 = a[1],
	        a02 = a[2],
	        a03 = a[3],
	        a10 = a[4],
	        a11 = a[5],
	        a12 = a[6],
	        a13 = a[7],
	        a20 = a[8],
	        a21 = a[9],
	        a22 = a[10],
	        a23 = a[11],
	        a30 = a[12],
	        a31 = a[13],
	        a32 = a[14],
	        a33 = a[15];

	    // Cache only the current line of the second matrix
	    var b0 = b[0],
	        b1 = b[1],
	        b2 = b[2],
	        b3 = b[3];
	    out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
	    out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
	    out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
	    out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

	    b0 = b[4];b1 = b[5];b2 = b[6];b3 = b[7];
	    out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
	    out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
	    out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
	    out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

	    b0 = b[8];b1 = b[9];b2 = b[10];b3 = b[11];
	    out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
	    out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
	    out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
	    out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

	    b0 = b[12];b1 = b[13];b2 = b[14];b3 = b[15];
	    out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
	    out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
	    out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
	    out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
	    return out;
	};

	/**
	 * Alias for {@link mat4.multiply}
	 * @function
	 */
	mat4.mul = mat4.multiply;

	/**
	 * Translate a mat4 by the given vector
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the matrix to translate
	 * @param {vec3} v vector to translate by
	 * @returns {mat4} out
	 */
	mat4.translate = function (out, a, v) {
	    var x = v[0],
	        y = v[1],
	        z = v[2],
	        a00,
	        a01,
	        a02,
	        a03,
	        a10,
	        a11,
	        a12,
	        a13,
	        a20,
	        a21,
	        a22,
	        a23;

	    if (a === out) {
	        out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
	        out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
	        out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
	        out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
	    } else {
	        a00 = a[0];a01 = a[1];a02 = a[2];a03 = a[3];
	        a10 = a[4];a11 = a[5];a12 = a[6];a13 = a[7];
	        a20 = a[8];a21 = a[9];a22 = a[10];a23 = a[11];

	        out[0] = a00;out[1] = a01;out[2] = a02;out[3] = a03;
	        out[4] = a10;out[5] = a11;out[6] = a12;out[7] = a13;
	        out[8] = a20;out[9] = a21;out[10] = a22;out[11] = a23;

	        out[12] = a00 * x + a10 * y + a20 * z + a[12];
	        out[13] = a01 * x + a11 * y + a21 * z + a[13];
	        out[14] = a02 * x + a12 * y + a22 * z + a[14];
	        out[15] = a03 * x + a13 * y + a23 * z + a[15];
	    }

	    return out;
	};

	/**
	 * Scales the mat4 by the dimensions in the given vec3
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the matrix to scale
	 * @param {vec3} v the vec3 to scale the matrix by
	 * @returns {mat4} out
	 **/
	mat4.scale = function (out, a, v) {
	    var x = v[0],
	        y = v[1],
	        z = v[2];

	    out[0] = a[0] * x;
	    out[1] = a[1] * x;
	    out[2] = a[2] * x;
	    out[3] = a[3] * x;
	    out[4] = a[4] * y;
	    out[5] = a[5] * y;
	    out[6] = a[6] * y;
	    out[7] = a[7] * y;
	    out[8] = a[8] * z;
	    out[9] = a[9] * z;
	    out[10] = a[10] * z;
	    out[11] = a[11] * z;
	    out[12] = a[12];
	    out[13] = a[13];
	    out[14] = a[14];
	    out[15] = a[15];
	    return out;
	};

	/**
	 * Rotates a mat4 by the given angle around the given axis
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the matrix to rotate
	 * @param {Number} rad the angle to rotate the matrix by
	 * @param {vec3} axis the axis to rotate around
	 * @returns {mat4} out
	 */
	mat4.rotate = function (out, a, rad, axis) {
	    var x = axis[0],
	        y = axis[1],
	        z = axis[2],
	        len = Math.sqrt(x * x + y * y + z * z),
	        s,
	        c,
	        t,
	        a00,
	        a01,
	        a02,
	        a03,
	        a10,
	        a11,
	        a12,
	        a13,
	        a20,
	        a21,
	        a22,
	        a23,
	        b00,
	        b01,
	        b02,
	        b10,
	        b11,
	        b12,
	        b20,
	        b21,
	        b22;

	    if (Math.abs(len) < glMatrix.EPSILON) {
	        return null;
	    }

	    len = 1 / len;
	    x *= len;
	    y *= len;
	    z *= len;

	    s = Math.sin(rad);
	    c = Math.cos(rad);
	    t = 1 - c;

	    a00 = a[0];a01 = a[1];a02 = a[2];a03 = a[3];
	    a10 = a[4];a11 = a[5];a12 = a[6];a13 = a[7];
	    a20 = a[8];a21 = a[9];a22 = a[10];a23 = a[11];

	    // Construct the elements of the rotation matrix
	    b00 = x * x * t + c;b01 = y * x * t + z * s;b02 = z * x * t - y * s;
	    b10 = x * y * t - z * s;b11 = y * y * t + c;b12 = z * y * t + x * s;
	    b20 = x * z * t + y * s;b21 = y * z * t - x * s;b22 = z * z * t + c;

	    // Perform rotation-specific matrix multiplication
	    out[0] = a00 * b00 + a10 * b01 + a20 * b02;
	    out[1] = a01 * b00 + a11 * b01 + a21 * b02;
	    out[2] = a02 * b00 + a12 * b01 + a22 * b02;
	    out[3] = a03 * b00 + a13 * b01 + a23 * b02;
	    out[4] = a00 * b10 + a10 * b11 + a20 * b12;
	    out[5] = a01 * b10 + a11 * b11 + a21 * b12;
	    out[6] = a02 * b10 + a12 * b11 + a22 * b12;
	    out[7] = a03 * b10 + a13 * b11 + a23 * b12;
	    out[8] = a00 * b20 + a10 * b21 + a20 * b22;
	    out[9] = a01 * b20 + a11 * b21 + a21 * b22;
	    out[10] = a02 * b20 + a12 * b21 + a22 * b22;
	    out[11] = a03 * b20 + a13 * b21 + a23 * b22;

	    if (a !== out) {
	        // If the source and destination differ, copy the unchanged last row
	        out[12] = a[12];
	        out[13] = a[13];
	        out[14] = a[14];
	        out[15] = a[15];
	    }
	    return out;
	};

	/**
	 * Rotates a matrix by the given angle around the X axis
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the matrix to rotate
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat4} out
	 */
	mat4.rotateX = function (out, a, rad) {
	    var s = Math.sin(rad),
	        c = Math.cos(rad),
	        a10 = a[4],
	        a11 = a[5],
	        a12 = a[6],
	        a13 = a[7],
	        a20 = a[8],
	        a21 = a[9],
	        a22 = a[10],
	        a23 = a[11];

	    if (a !== out) {
	        // If the source and destination differ, copy the unchanged rows
	        out[0] = a[0];
	        out[1] = a[1];
	        out[2] = a[2];
	        out[3] = a[3];
	        out[12] = a[12];
	        out[13] = a[13];
	        out[14] = a[14];
	        out[15] = a[15];
	    }

	    // Perform axis-specific matrix multiplication
	    out[4] = a10 * c + a20 * s;
	    out[5] = a11 * c + a21 * s;
	    out[6] = a12 * c + a22 * s;
	    out[7] = a13 * c + a23 * s;
	    out[8] = a20 * c - a10 * s;
	    out[9] = a21 * c - a11 * s;
	    out[10] = a22 * c - a12 * s;
	    out[11] = a23 * c - a13 * s;
	    return out;
	};

	/**
	 * Rotates a matrix by the given angle around the Y axis
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the matrix to rotate
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat4} out
	 */
	mat4.rotateY = function (out, a, rad) {
	    var s = Math.sin(rad),
	        c = Math.cos(rad),
	        a00 = a[0],
	        a01 = a[1],
	        a02 = a[2],
	        a03 = a[3],
	        a20 = a[8],
	        a21 = a[9],
	        a22 = a[10],
	        a23 = a[11];

	    if (a !== out) {
	        // If the source and destination differ, copy the unchanged rows
	        out[4] = a[4];
	        out[5] = a[5];
	        out[6] = a[6];
	        out[7] = a[7];
	        out[12] = a[12];
	        out[13] = a[13];
	        out[14] = a[14];
	        out[15] = a[15];
	    }

	    // Perform axis-specific matrix multiplication
	    out[0] = a00 * c - a20 * s;
	    out[1] = a01 * c - a21 * s;
	    out[2] = a02 * c - a22 * s;
	    out[3] = a03 * c - a23 * s;
	    out[8] = a00 * s + a20 * c;
	    out[9] = a01 * s + a21 * c;
	    out[10] = a02 * s + a22 * c;
	    out[11] = a03 * s + a23 * c;
	    return out;
	};

	/**
	 * Rotates a matrix by the given angle around the Z axis
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the matrix to rotate
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat4} out
	 */
	mat4.rotateZ = function (out, a, rad) {
	    var s = Math.sin(rad),
	        c = Math.cos(rad),
	        a00 = a[0],
	        a01 = a[1],
	        a02 = a[2],
	        a03 = a[3],
	        a10 = a[4],
	        a11 = a[5],
	        a12 = a[6],
	        a13 = a[7];

	    if (a !== out) {
	        // If the source and destination differ, copy the unchanged last row
	        out[8] = a[8];
	        out[9] = a[9];
	        out[10] = a[10];
	        out[11] = a[11];
	        out[12] = a[12];
	        out[13] = a[13];
	        out[14] = a[14];
	        out[15] = a[15];
	    }

	    // Perform axis-specific matrix multiplication
	    out[0] = a00 * c + a10 * s;
	    out[1] = a01 * c + a11 * s;
	    out[2] = a02 * c + a12 * s;
	    out[3] = a03 * c + a13 * s;
	    out[4] = a10 * c - a00 * s;
	    out[5] = a11 * c - a01 * s;
	    out[6] = a12 * c - a02 * s;
	    out[7] = a13 * c - a03 * s;
	    return out;
	};

	/**
	 * Creates a matrix from a vector translation
	 * This is equivalent to (but much faster than):
	 *
	 *     mat4.identity(dest);
	 *     mat4.translate(dest, dest, vec);
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {vec3} v Translation vector
	 * @returns {mat4} out
	 */
	mat4.fromTranslation = function (out, v) {
	    out[0] = 1;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    out[4] = 0;
	    out[5] = 1;
	    out[6] = 0;
	    out[7] = 0;
	    out[8] = 0;
	    out[9] = 0;
	    out[10] = 1;
	    out[11] = 0;
	    out[12] = v[0];
	    out[13] = v[1];
	    out[14] = v[2];
	    out[15] = 1;
	    return out;
	};

	/**
	 * Creates a matrix from a vector scaling
	 * This is equivalent to (but much faster than):
	 *
	 *     mat4.identity(dest);
	 *     mat4.scale(dest, dest, vec);
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {vec3} v Scaling vector
	 * @returns {mat4} out
	 */
	mat4.fromScaling = function (out, v) {
	    out[0] = v[0];
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    out[4] = 0;
	    out[5] = v[1];
	    out[6] = 0;
	    out[7] = 0;
	    out[8] = 0;
	    out[9] = 0;
	    out[10] = v[2];
	    out[11] = 0;
	    out[12] = 0;
	    out[13] = 0;
	    out[14] = 0;
	    out[15] = 1;
	    return out;
	};

	/**
	 * Creates a matrix from a given angle around a given axis
	 * This is equivalent to (but much faster than):
	 *
	 *     mat4.identity(dest);
	 *     mat4.rotate(dest, dest, rad, axis);
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {Number} rad the angle to rotate the matrix by
	 * @param {vec3} axis the axis to rotate around
	 * @returns {mat4} out
	 */
	mat4.fromRotation = function (out, rad, axis) {
	    var x = axis[0],
	        y = axis[1],
	        z = axis[2],
	        len = Math.sqrt(x * x + y * y + z * z),
	        s,
	        c,
	        t;

	    if (Math.abs(len) < glMatrix.EPSILON) {
	        return null;
	    }

	    len = 1 / len;
	    x *= len;
	    y *= len;
	    z *= len;

	    s = Math.sin(rad);
	    c = Math.cos(rad);
	    t = 1 - c;

	    // Perform rotation-specific matrix multiplication
	    out[0] = x * x * t + c;
	    out[1] = y * x * t + z * s;
	    out[2] = z * x * t - y * s;
	    out[3] = 0;
	    out[4] = x * y * t - z * s;
	    out[5] = y * y * t + c;
	    out[6] = z * y * t + x * s;
	    out[7] = 0;
	    out[8] = x * z * t + y * s;
	    out[9] = y * z * t - x * s;
	    out[10] = z * z * t + c;
	    out[11] = 0;
	    out[12] = 0;
	    out[13] = 0;
	    out[14] = 0;
	    out[15] = 1;
	    return out;
	};

	/**
	 * Creates a matrix from the given angle around the X axis
	 * This is equivalent to (but much faster than):
	 *
	 *     mat4.identity(dest);
	 *     mat4.rotateX(dest, dest, rad);
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat4} out
	 */
	mat4.fromXRotation = function (out, rad) {
	    var s = Math.sin(rad),
	        c = Math.cos(rad);

	    // Perform axis-specific matrix multiplication
	    out[0] = 1;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    out[4] = 0;
	    out[5] = c;
	    out[6] = s;
	    out[7] = 0;
	    out[8] = 0;
	    out[9] = -s;
	    out[10] = c;
	    out[11] = 0;
	    out[12] = 0;
	    out[13] = 0;
	    out[14] = 0;
	    out[15] = 1;
	    return out;
	};

	/**
	 * Creates a matrix from the given angle around the Y axis
	 * This is equivalent to (but much faster than):
	 *
	 *     mat4.identity(dest);
	 *     mat4.rotateY(dest, dest, rad);
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat4} out
	 */
	mat4.fromYRotation = function (out, rad) {
	    var s = Math.sin(rad),
	        c = Math.cos(rad);

	    // Perform axis-specific matrix multiplication
	    out[0] = c;
	    out[1] = 0;
	    out[2] = -s;
	    out[3] = 0;
	    out[4] = 0;
	    out[5] = 1;
	    out[6] = 0;
	    out[7] = 0;
	    out[8] = s;
	    out[9] = 0;
	    out[10] = c;
	    out[11] = 0;
	    out[12] = 0;
	    out[13] = 0;
	    out[14] = 0;
	    out[15] = 1;
	    return out;
	};

	/**
	 * Creates a matrix from the given angle around the Z axis
	 * This is equivalent to (but much faster than):
	 *
	 *     mat4.identity(dest);
	 *     mat4.rotateZ(dest, dest, rad);
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat4} out
	 */
	mat4.fromZRotation = function (out, rad) {
	    var s = Math.sin(rad),
	        c = Math.cos(rad);

	    // Perform axis-specific matrix multiplication
	    out[0] = c;
	    out[1] = s;
	    out[2] = 0;
	    out[3] = 0;
	    out[4] = -s;
	    out[5] = c;
	    out[6] = 0;
	    out[7] = 0;
	    out[8] = 0;
	    out[9] = 0;
	    out[10] = 1;
	    out[11] = 0;
	    out[12] = 0;
	    out[13] = 0;
	    out[14] = 0;
	    out[15] = 1;
	    return out;
	};

	/**
	 * Creates a matrix from a quaternion rotation and vector translation
	 * This is equivalent to (but much faster than):
	 *
	 *     mat4.identity(dest);
	 *     mat4.translate(dest, vec);
	 *     var quatMat = mat4.create();
	 *     quat4.toMat4(quat, quatMat);
	 *     mat4.multiply(dest, quatMat);
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {quat4} q Rotation quaternion
	 * @param {vec3} v Translation vector
	 * @returns {mat4} out
	 */
	mat4.fromRotationTranslation = function (out, q, v) {
	    // Quaternion math
	    var x = q[0],
	        y = q[1],
	        z = q[2],
	        w = q[3],
	        x2 = x + x,
	        y2 = y + y,
	        z2 = z + z,
	        xx = x * x2,
	        xy = x * y2,
	        xz = x * z2,
	        yy = y * y2,
	        yz = y * z2,
	        zz = z * z2,
	        wx = w * x2,
	        wy = w * y2,
	        wz = w * z2;

	    out[0] = 1 - (yy + zz);
	    out[1] = xy + wz;
	    out[2] = xz - wy;
	    out[3] = 0;
	    out[4] = xy - wz;
	    out[5] = 1 - (xx + zz);
	    out[6] = yz + wx;
	    out[7] = 0;
	    out[8] = xz + wy;
	    out[9] = yz - wx;
	    out[10] = 1 - (xx + yy);
	    out[11] = 0;
	    out[12] = v[0];
	    out[13] = v[1];
	    out[14] = v[2];
	    out[15] = 1;

	    return out;
	};

	/**
	 * Creates a matrix from a quaternion rotation, vector translation and vector scale
	 * This is equivalent to (but much faster than):
	 *
	 *     mat4.identity(dest);
	 *     mat4.translate(dest, vec);
	 *     var quatMat = mat4.create();
	 *     quat4.toMat4(quat, quatMat);
	 *     mat4.multiply(dest, quatMat);
	 *     mat4.scale(dest, scale)
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {quat4} q Rotation quaternion
	 * @param {vec3} v Translation vector
	 * @param {vec3} s Scaling vector
	 * @returns {mat4} out
	 */
	mat4.fromRotationTranslationScale = function (out, q, v, s) {
	    // Quaternion math
	    var x = q[0],
	        y = q[1],
	        z = q[2],
	        w = q[3],
	        x2 = x + x,
	        y2 = y + y,
	        z2 = z + z,
	        xx = x * x2,
	        xy = x * y2,
	        xz = x * z2,
	        yy = y * y2,
	        yz = y * z2,
	        zz = z * z2,
	        wx = w * x2,
	        wy = w * y2,
	        wz = w * z2,
	        sx = s[0],
	        sy = s[1],
	        sz = s[2];

	    out[0] = (1 - (yy + zz)) * sx;
	    out[1] = (xy + wz) * sx;
	    out[2] = (xz - wy) * sx;
	    out[3] = 0;
	    out[4] = (xy - wz) * sy;
	    out[5] = (1 - (xx + zz)) * sy;
	    out[6] = (yz + wx) * sy;
	    out[7] = 0;
	    out[8] = (xz + wy) * sz;
	    out[9] = (yz - wx) * sz;
	    out[10] = (1 - (xx + yy)) * sz;
	    out[11] = 0;
	    out[12] = v[0];
	    out[13] = v[1];
	    out[14] = v[2];
	    out[15] = 1;

	    return out;
	};

	/**
	 * Creates a matrix from a quaternion rotation, vector translation and vector scale, rotating and scaling around the given origin
	 * This is equivalent to (but much faster than):
	 *
	 *     mat4.identity(dest);
	 *     mat4.translate(dest, vec);
	 *     mat4.translate(dest, origin);
	 *     var quatMat = mat4.create();
	 *     quat4.toMat4(quat, quatMat);
	 *     mat4.multiply(dest, quatMat);
	 *     mat4.scale(dest, scale)
	 *     mat4.translate(dest, negativeOrigin);
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {quat4} q Rotation quaternion
	 * @param {vec3} v Translation vector
	 * @param {vec3} s Scaling vector
	 * @param {vec3} o The origin vector around which to scale and rotate
	 * @returns {mat4} out
	 */
	mat4.fromRotationTranslationScaleOrigin = function (out, q, v, s, o) {
	    // Quaternion math
	    var x = q[0],
	        y = q[1],
	        z = q[2],
	        w = q[3],
	        x2 = x + x,
	        y2 = y + y,
	        z2 = z + z,
	        xx = x * x2,
	        xy = x * y2,
	        xz = x * z2,
	        yy = y * y2,
	        yz = y * z2,
	        zz = z * z2,
	        wx = w * x2,
	        wy = w * y2,
	        wz = w * z2,
	        sx = s[0],
	        sy = s[1],
	        sz = s[2],
	        ox = o[0],
	        oy = o[1],
	        oz = o[2];

	    out[0] = (1 - (yy + zz)) * sx;
	    out[1] = (xy + wz) * sx;
	    out[2] = (xz - wy) * sx;
	    out[3] = 0;
	    out[4] = (xy - wz) * sy;
	    out[5] = (1 - (xx + zz)) * sy;
	    out[6] = (yz + wx) * sy;
	    out[7] = 0;
	    out[8] = (xz + wy) * sz;
	    out[9] = (yz - wx) * sz;
	    out[10] = (1 - (xx + yy)) * sz;
	    out[11] = 0;
	    out[12] = v[0] + ox - (out[0] * ox + out[4] * oy + out[8] * oz);
	    out[13] = v[1] + oy - (out[1] * ox + out[5] * oy + out[9] * oz);
	    out[14] = v[2] + oz - (out[2] * ox + out[6] * oy + out[10] * oz);
	    out[15] = 1;

	    return out;
	};

	mat4.fromQuat = function (out, q) {
	    var x = q[0],
	        y = q[1],
	        z = q[2],
	        w = q[3],
	        x2 = x + x,
	        y2 = y + y,
	        z2 = z + z,
	        xx = x * x2,
	        yx = y * x2,
	        yy = y * y2,
	        zx = z * x2,
	        zy = z * y2,
	        zz = z * z2,
	        wx = w * x2,
	        wy = w * y2,
	        wz = w * z2;

	    out[0] = 1 - yy - zz;
	    out[1] = yx + wz;
	    out[2] = zx - wy;
	    out[3] = 0;

	    out[4] = yx - wz;
	    out[5] = 1 - xx - zz;
	    out[6] = zy + wx;
	    out[7] = 0;

	    out[8] = zx + wy;
	    out[9] = zy - wx;
	    out[10] = 1 - xx - yy;
	    out[11] = 0;

	    out[12] = 0;
	    out[13] = 0;
	    out[14] = 0;
	    out[15] = 1;

	    return out;
	};

	/**
	 * Generates a frustum matrix with the given bounds
	 *
	 * @param {mat4} out mat4 frustum matrix will be written into
	 * @param {Number} left Left bound of the frustum
	 * @param {Number} right Right bound of the frustum
	 * @param {Number} bottom Bottom bound of the frustum
	 * @param {Number} top Top bound of the frustum
	 * @param {Number} near Near bound of the frustum
	 * @param {Number} far Far bound of the frustum
	 * @returns {mat4} out
	 */
	mat4.frustum = function (out, left, right, bottom, top, near, far) {
	    var rl = 1 / (right - left),
	        tb = 1 / (top - bottom),
	        nf = 1 / (near - far);
	    out[0] = near * 2 * rl;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    out[4] = 0;
	    out[5] = near * 2 * tb;
	    out[6] = 0;
	    out[7] = 0;
	    out[8] = (right + left) * rl;
	    out[9] = (top + bottom) * tb;
	    out[10] = (far + near) * nf;
	    out[11] = -1;
	    out[12] = 0;
	    out[13] = 0;
	    out[14] = far * near * 2 * nf;
	    out[15] = 0;
	    return out;
	};

	/**
	 * Generates a perspective projection matrix with the given bounds
	 *
	 * @param {mat4} out mat4 frustum matrix will be written into
	 * @param {number} fovy Vertical field of view in radians
	 * @param {number} aspect Aspect ratio. typically viewport width/height
	 * @param {number} near Near bound of the frustum
	 * @param {number} far Far bound of the frustum
	 * @returns {mat4} out
	 */
	mat4.perspective = function (out, fovy, aspect, near, far) {
	    var f = 1.0 / Math.tan(fovy / 2),
	        nf = 1 / (near - far);
	    out[0] = f / aspect;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    out[4] = 0;
	    out[5] = f;
	    out[6] = 0;
	    out[7] = 0;
	    out[8] = 0;
	    out[9] = 0;
	    out[10] = (far + near) * nf;
	    out[11] = -1;
	    out[12] = 0;
	    out[13] = 0;
	    out[14] = 2 * far * near * nf;
	    out[15] = 0;
	    return out;
	};

	/**
	 * Generates a perspective projection matrix with the given field of view.
	 * This is primarily useful for generating projection matrices to be used
	 * with the still experiemental WebVR API.
	 *
	 * @param {mat4} out mat4 frustum matrix will be written into
	 * @param {number} fov Object containing the following values: upDegrees, downDegrees, leftDegrees, rightDegrees
	 * @param {number} near Near bound of the frustum
	 * @param {number} far Far bound of the frustum
	 * @returns {mat4} out
	 */
	mat4.perspectiveFromFieldOfView = function (out, fov, near, far) {
	    var upTan = Math.tan(fov.upDegrees * Math.PI / 180.0),
	        downTan = Math.tan(fov.downDegrees * Math.PI / 180.0),
	        leftTan = Math.tan(fov.leftDegrees * Math.PI / 180.0),
	        rightTan = Math.tan(fov.rightDegrees * Math.PI / 180.0),
	        xScale = 2.0 / (leftTan + rightTan),
	        yScale = 2.0 / (upTan + downTan);

	    out[0] = xScale;
	    out[1] = 0.0;
	    out[2] = 0.0;
	    out[3] = 0.0;
	    out[4] = 0.0;
	    out[5] = yScale;
	    out[6] = 0.0;
	    out[7] = 0.0;
	    out[8] = -((leftTan - rightTan) * xScale * 0.5);
	    out[9] = (upTan - downTan) * yScale * 0.5;
	    out[10] = far / (near - far);
	    out[11] = -1.0;
	    out[12] = 0.0;
	    out[13] = 0.0;
	    out[14] = far * near / (near - far);
	    out[15] = 0.0;
	    return out;
	};

	/**
	 * Generates a orthogonal projection matrix with the given bounds
	 *
	 * @param {mat4} out mat4 frustum matrix will be written into
	 * @param {number} left Left bound of the frustum
	 * @param {number} right Right bound of the frustum
	 * @param {number} bottom Bottom bound of the frustum
	 * @param {number} top Top bound of the frustum
	 * @param {number} near Near bound of the frustum
	 * @param {number} far Far bound of the frustum
	 * @returns {mat4} out
	 */
	mat4.ortho = function (out, left, right, bottom, top, near, far) {
	    var lr = 1 / (left - right),
	        bt = 1 / (bottom - top),
	        nf = 1 / (near - far);
	    out[0] = -2 * lr;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    out[4] = 0;
	    out[5] = -2 * bt;
	    out[6] = 0;
	    out[7] = 0;
	    out[8] = 0;
	    out[9] = 0;
	    out[10] = 2 * nf;
	    out[11] = 0;
	    out[12] = (left + right) * lr;
	    out[13] = (top + bottom) * bt;
	    out[14] = (far + near) * nf;
	    out[15] = 1;
	    return out;
	};

	/**
	 * Generates a look-at matrix with the given eye position, focal point, and up axis
	 *
	 * @param {mat4} out mat4 frustum matrix will be written into
	 * @param {vec3} eye Position of the viewer
	 * @param {vec3} center Point the viewer is looking at
	 * @param {vec3} up vec3 pointing up
	 * @returns {mat4} out
	 */
	mat4.lookAt = function (out, eye, center, up) {
	    var x0,
	        x1,
	        x2,
	        y0,
	        y1,
	        y2,
	        z0,
	        z1,
	        z2,
	        len,
	        eyex = eye[0],
	        eyey = eye[1],
	        eyez = eye[2],
	        upx = up[0],
	        upy = up[1],
	        upz = up[2],
	        centerx = center[0],
	        centery = center[1],
	        centerz = center[2];

	    if (Math.abs(eyex - centerx) < glMatrix.EPSILON && Math.abs(eyey - centery) < glMatrix.EPSILON && Math.abs(eyez - centerz) < glMatrix.EPSILON) {
	        return mat4.identity(out);
	    }

	    z0 = eyex - centerx;
	    z1 = eyey - centery;
	    z2 = eyez - centerz;

	    len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
	    z0 *= len;
	    z1 *= len;
	    z2 *= len;

	    x0 = upy * z2 - upz * z1;
	    x1 = upz * z0 - upx * z2;
	    x2 = upx * z1 - upy * z0;
	    len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
	    if (!len) {
	        x0 = 0;
	        x1 = 0;
	        x2 = 0;
	    } else {
	        len = 1 / len;
	        x0 *= len;
	        x1 *= len;
	        x2 *= len;
	    }

	    y0 = z1 * x2 - z2 * x1;
	    y1 = z2 * x0 - z0 * x2;
	    y2 = z0 * x1 - z1 * x0;

	    len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
	    if (!len) {
	        y0 = 0;
	        y1 = 0;
	        y2 = 0;
	    } else {
	        len = 1 / len;
	        y0 *= len;
	        y1 *= len;
	        y2 *= len;
	    }

	    out[0] = x0;
	    out[1] = y0;
	    out[2] = z0;
	    out[3] = 0;
	    out[4] = x1;
	    out[5] = y1;
	    out[6] = z1;
	    out[7] = 0;
	    out[8] = x2;
	    out[9] = y2;
	    out[10] = z2;
	    out[11] = 0;
	    out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
	    out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
	    out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
	    out[15] = 1;

	    return out;
	};

	/**
	 * Returns a string representation of a mat4
	 *
	 * @param {mat4} mat matrix to represent as a string
	 * @returns {String} string representation of the matrix
	 */
	mat4.str = function (a) {
	    return 'mat4(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ', ' + a[4] + ', ' + a[5] + ', ' + a[6] + ', ' + a[7] + ', ' + a[8] + ', ' + a[9] + ', ' + a[10] + ', ' + a[11] + ', ' + a[12] + ', ' + a[13] + ', ' + a[14] + ', ' + a[15] + ')';
	};

	/**
	 * Returns Frobenius norm of a mat4
	 *
	 * @param {mat4} a the matrix to calculate Frobenius norm of
	 * @returns {Number} Frobenius norm
	 */
	mat4.frob = function (a) {
	    return Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2) + Math.pow(a[2], 2) + Math.pow(a[3], 2) + Math.pow(a[4], 2) + Math.pow(a[5], 2) + Math.pow(a[6], 2) + Math.pow(a[7], 2) + Math.pow(a[8], 2) + Math.pow(a[9], 2) + Math.pow(a[10], 2) + Math.pow(a[11], 2) + Math.pow(a[12], 2) + Math.pow(a[13], 2) + Math.pow(a[14], 2) + Math.pow(a[15], 2));
	};

	module.exports = mat4;

/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE. */

	"use strict";

	var glMatrix = __webpack_require__(14);
	var mat3 = __webpack_require__(17);
	var vec3 = __webpack_require__(20);
	var vec4 = __webpack_require__(21);

	/**
	 * @class Quaternion
	 * @name quat
	 */
	var quat = {};

	/**
	 * Creates a new identity quat
	 *
	 * @returns {quat} a new quaternion
	 */
	quat.create = function () {
	    var out = new glMatrix.ARRAY_TYPE(4);
	    out[0] = 0;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 1;
	    return out;
	};

	/**
	 * Sets a quaternion to represent the shortest rotation from one
	 * vector to another.
	 *
	 * Both vectors are assumed to be unit length.
	 *
	 * @param {quat} out the receiving quaternion.
	 * @param {vec3} a the initial vector
	 * @param {vec3} b the destination vector
	 * @returns {quat} out
	 */
	quat.rotationTo = (function () {
	    var tmpvec3 = vec3.create();
	    var xUnitVec3 = vec3.fromValues(1, 0, 0);
	    var yUnitVec3 = vec3.fromValues(0, 1, 0);

	    return function (out, a, b) {
	        var dot = vec3.dot(a, b);
	        if (dot < -0.999999) {
	            vec3.cross(tmpvec3, xUnitVec3, a);
	            if (vec3.length(tmpvec3) < 0.000001) vec3.cross(tmpvec3, yUnitVec3, a);
	            vec3.normalize(tmpvec3, tmpvec3);
	            quat.setAxisAngle(out, tmpvec3, Math.PI);
	            return out;
	        } else if (dot > 0.999999) {
	            out[0] = 0;
	            out[1] = 0;
	            out[2] = 0;
	            out[3] = 1;
	            return out;
	        } else {
	            vec3.cross(tmpvec3, a, b);
	            out[0] = tmpvec3[0];
	            out[1] = tmpvec3[1];
	            out[2] = tmpvec3[2];
	            out[3] = 1 + dot;
	            return quat.normalize(out, out);
	        }
	    };
	})();

	/**
	 * Sets the specified quaternion with values corresponding to the given
	 * axes. Each axis is a vec3 and is expected to be unit length and
	 * perpendicular to all other specified axes.
	 *
	 * @param {vec3} view  the vector representing the viewing direction
	 * @param {vec3} right the vector representing the local "right" direction
	 * @param {vec3} up    the vector representing the local "up" direction
	 * @returns {quat} out
	 */
	quat.setAxes = (function () {
	    var matr = mat3.create();

	    return function (out, view, right, up) {
	        matr[0] = right[0];
	        matr[3] = right[1];
	        matr[6] = right[2];

	        matr[1] = up[0];
	        matr[4] = up[1];
	        matr[7] = up[2];

	        matr[2] = -view[0];
	        matr[5] = -view[1];
	        matr[8] = -view[2];

	        return quat.normalize(out, quat.fromMat3(out, matr));
	    };
	})();

	/**
	 * Creates a new quat initialized with values from an existing quaternion
	 *
	 * @param {quat} a quaternion to clone
	 * @returns {quat} a new quaternion
	 * @function
	 */
	quat.clone = vec4.clone;

	/**
	 * Creates a new quat initialized with the given values
	 *
	 * @param {Number} x X component
	 * @param {Number} y Y component
	 * @param {Number} z Z component
	 * @param {Number} w W component
	 * @returns {quat} a new quaternion
	 * @function
	 */
	quat.fromValues = vec4.fromValues;

	/**
	 * Copy the values from one quat to another
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {quat} a the source quaternion
	 * @returns {quat} out
	 * @function
	 */
	quat.copy = vec4.copy;

	/**
	 * Set the components of a quat to the given values
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {Number} x X component
	 * @param {Number} y Y component
	 * @param {Number} z Z component
	 * @param {Number} w W component
	 * @returns {quat} out
	 * @function
	 */
	quat.set = vec4.set;

	/**
	 * Set a quat to the identity quaternion
	 *
	 * @param {quat} out the receiving quaternion
	 * @returns {quat} out
	 */
	quat.identity = function (out) {
	    out[0] = 0;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 1;
	    return out;
	};

	/**
	 * Sets a quat from the given angle and rotation axis,
	 * then returns it.
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {vec3} axis the axis around which to rotate
	 * @param {Number} rad the angle in radians
	 * @returns {quat} out
	 **/
	quat.setAxisAngle = function (out, axis, rad) {
	    rad = rad * 0.5;
	    var s = Math.sin(rad);
	    out[0] = s * axis[0];
	    out[1] = s * axis[1];
	    out[2] = s * axis[2];
	    out[3] = Math.cos(rad);
	    return out;
	};

	/**
	 * Adds two quat's
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {quat} a the first operand
	 * @param {quat} b the second operand
	 * @returns {quat} out
	 * @function
	 */
	quat.add = vec4.add;

	/**
	 * Multiplies two quat's
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {quat} a the first operand
	 * @param {quat} b the second operand
	 * @returns {quat} out
	 */
	quat.multiply = function (out, a, b) {
	    var ax = a[0],
	        ay = a[1],
	        az = a[2],
	        aw = a[3],
	        bx = b[0],
	        by = b[1],
	        bz = b[2],
	        bw = b[3];

	    out[0] = ax * bw + aw * bx + ay * bz - az * by;
	    out[1] = ay * bw + aw * by + az * bx - ax * bz;
	    out[2] = az * bw + aw * bz + ax * by - ay * bx;
	    out[3] = aw * bw - ax * bx - ay * by - az * bz;
	    return out;
	};

	/**
	 * Alias for {@link quat.multiply}
	 * @function
	 */
	quat.mul = quat.multiply;

	/**
	 * Scales a quat by a scalar number
	 *
	 * @param {quat} out the receiving vector
	 * @param {quat} a the vector to scale
	 * @param {Number} b amount to scale the vector by
	 * @returns {quat} out
	 * @function
	 */
	quat.scale = vec4.scale;

	/**
	 * Rotates a quaternion by the given angle about the X axis
	 *
	 * @param {quat} out quat receiving operation result
	 * @param {quat} a quat to rotate
	 * @param {number} rad angle (in radians) to rotate
	 * @returns {quat} out
	 */
	quat.rotateX = function (out, a, rad) {
	    rad *= 0.5;

	    var ax = a[0],
	        ay = a[1],
	        az = a[2],
	        aw = a[3],
	        bx = Math.sin(rad),
	        bw = Math.cos(rad);

	    out[0] = ax * bw + aw * bx;
	    out[1] = ay * bw + az * bx;
	    out[2] = az * bw - ay * bx;
	    out[3] = aw * bw - ax * bx;
	    return out;
	};

	/**
	 * Rotates a quaternion by the given angle about the Y axis
	 *
	 * @param {quat} out quat receiving operation result
	 * @param {quat} a quat to rotate
	 * @param {number} rad angle (in radians) to rotate
	 * @returns {quat} out
	 */
	quat.rotateY = function (out, a, rad) {
	    rad *= 0.5;

	    var ax = a[0],
	        ay = a[1],
	        az = a[2],
	        aw = a[3],
	        by = Math.sin(rad),
	        bw = Math.cos(rad);

	    out[0] = ax * bw - az * by;
	    out[1] = ay * bw + aw * by;
	    out[2] = az * bw + ax * by;
	    out[3] = aw * bw - ay * by;
	    return out;
	};

	/**
	 * Rotates a quaternion by the given angle about the Z axis
	 *
	 * @param {quat} out quat receiving operation result
	 * @param {quat} a quat to rotate
	 * @param {number} rad angle (in radians) to rotate
	 * @returns {quat} out
	 */
	quat.rotateZ = function (out, a, rad) {
	    rad *= 0.5;

	    var ax = a[0],
	        ay = a[1],
	        az = a[2],
	        aw = a[3],
	        bz = Math.sin(rad),
	        bw = Math.cos(rad);

	    out[0] = ax * bw + ay * bz;
	    out[1] = ay * bw - ax * bz;
	    out[2] = az * bw + aw * bz;
	    out[3] = aw * bw - az * bz;
	    return out;
	};

	/**
	 * Calculates the W component of a quat from the X, Y, and Z components.
	 * Assumes that quaternion is 1 unit in length.
	 * Any existing W component will be ignored.
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {quat} a quat to calculate W component of
	 * @returns {quat} out
	 */
	quat.calculateW = function (out, a) {
	    var x = a[0],
	        y = a[1],
	        z = a[2];

	    out[0] = x;
	    out[1] = y;
	    out[2] = z;
	    out[3] = Math.sqrt(Math.abs(1.0 - x * x - y * y - z * z));
	    return out;
	};

	/**
	 * Calculates the dot product of two quat's
	 *
	 * @param {quat} a the first operand
	 * @param {quat} b the second operand
	 * @returns {Number} dot product of a and b
	 * @function
	 */
	quat.dot = vec4.dot;

	/**
	 * Performs a linear interpolation between two quat's
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {quat} a the first operand
	 * @param {quat} b the second operand
	 * @param {Number} t interpolation amount between the two inputs
	 * @returns {quat} out
	 * @function
	 */
	quat.lerp = vec4.lerp;

	/**
	 * Performs a spherical linear interpolation between two quat
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {quat} a the first operand
	 * @param {quat} b the second operand
	 * @param {Number} t interpolation amount between the two inputs
	 * @returns {quat} out
	 */
	quat.slerp = function (out, a, b, t) {
	    // benchmarks:
	    //    http://jsperf.com/quaternion-slerp-implementations

	    var ax = a[0],
	        ay = a[1],
	        az = a[2],
	        aw = a[3],
	        bx = b[0],
	        by = b[1],
	        bz = b[2],
	        bw = b[3];

	    var omega, cosom, sinom, scale0, scale1;

	    // calc cosine
	    cosom = ax * bx + ay * by + az * bz + aw * bw;
	    // adjust signs (if necessary)
	    if (cosom < 0.0) {
	        cosom = -cosom;
	        bx = -bx;
	        by = -by;
	        bz = -bz;
	        bw = -bw;
	    }
	    // calculate coefficients
	    if (1.0 - cosom > 0.000001) {
	        // standard case (slerp)
	        omega = Math.acos(cosom);
	        sinom = Math.sin(omega);
	        scale0 = Math.sin((1.0 - t) * omega) / sinom;
	        scale1 = Math.sin(t * omega) / sinom;
	    } else {
	        // "from" and "to" quaternions are very close
	        //  ... so we can do a linear interpolation
	        scale0 = 1.0 - t;
	        scale1 = t;
	    }
	    // calculate final values
	    out[0] = scale0 * ax + scale1 * bx;
	    out[1] = scale0 * ay + scale1 * by;
	    out[2] = scale0 * az + scale1 * bz;
	    out[3] = scale0 * aw + scale1 * bw;

	    return out;
	};

	/**
	 * Performs a spherical linear interpolation with two control points
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {quat} a the first operand
	 * @param {quat} b the second operand
	 * @param {quat} c the third operand
	 * @param {quat} d the fourth operand
	 * @param {Number} t interpolation amount
	 * @returns {quat} out
	 */
	quat.sqlerp = (function () {
	    var temp1 = quat.create();
	    var temp2 = quat.create();

	    return function (out, a, b, c, d, t) {
	        quat.slerp(temp1, a, d, t);
	        quat.slerp(temp2, b, c, t);
	        quat.slerp(out, temp1, temp2, 2 * t * (1 - t));

	        return out;
	    };
	})();

	/**
	 * Calculates the inverse of a quat
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {quat} a quat to calculate inverse of
	 * @returns {quat} out
	 */
	quat.invert = function (out, a) {
	    var a0 = a[0],
	        a1 = a[1],
	        a2 = a[2],
	        a3 = a[3],
	        dot = a0 * a0 + a1 * a1 + a2 * a2 + a3 * a3,
	        invDot = dot ? 1.0 / dot : 0;

	    // TODO: Would be faster to return [0,0,0,0] immediately if dot == 0

	    out[0] = -a0 * invDot;
	    out[1] = -a1 * invDot;
	    out[2] = -a2 * invDot;
	    out[3] = a3 * invDot;
	    return out;
	};

	/**
	 * Calculates the conjugate of a quat
	 * If the quaternion is normalized, this function is faster than quat.inverse and produces the same result.
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {quat} a quat to calculate conjugate of
	 * @returns {quat} out
	 */
	quat.conjugate = function (out, a) {
	    out[0] = -a[0];
	    out[1] = -a[1];
	    out[2] = -a[2];
	    out[3] = a[3];
	    return out;
	};

	/**
	 * Calculates the length of a quat
	 *
	 * @param {quat} a vector to calculate length of
	 * @returns {Number} length of a
	 * @function
	 */
	quat.length = vec4.length;

	/**
	 * Alias for {@link quat.length}
	 * @function
	 */
	quat.len = quat.length;

	/**
	 * Calculates the squared length of a quat
	 *
	 * @param {quat} a vector to calculate squared length of
	 * @returns {Number} squared length of a
	 * @function
	 */
	quat.squaredLength = vec4.squaredLength;

	/**
	 * Alias for {@link quat.squaredLength}
	 * @function
	 */
	quat.sqrLen = quat.squaredLength;

	/**
	 * Normalize a quat
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {quat} a quaternion to normalize
	 * @returns {quat} out
	 * @function
	 */
	quat.normalize = vec4.normalize;

	/**
	 * Creates a quaternion from the given 3x3 rotation matrix.
	 *
	 * NOTE: The resultant quaternion is not normalized, so you should be sure
	 * to renormalize the quaternion yourself where necessary.
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {mat3} m rotation matrix
	 * @returns {quat} out
	 * @function
	 */
	quat.fromMat3 = function (out, m) {
	    // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
	    // article "Quaternion Calculus and Fast Animation".
	    var fTrace = m[0] + m[4] + m[8];
	    var fRoot;

	    if (fTrace > 0.0) {
	        // |w| > 1/2, may as well choose w > 1/2
	        fRoot = Math.sqrt(fTrace + 1.0); // 2w
	        out[3] = 0.5 * fRoot;
	        fRoot = 0.5 / fRoot; // 1/(4w)
	        out[0] = (m[5] - m[7]) * fRoot;
	        out[1] = (m[6] - m[2]) * fRoot;
	        out[2] = (m[1] - m[3]) * fRoot;
	    } else {
	        // |w| <= 1/2
	        var i = 0;
	        if (m[4] > m[0]) i = 1;
	        if (m[8] > m[i * 3 + i]) i = 2;
	        var j = (i + 1) % 3;
	        var k = (i + 2) % 3;

	        fRoot = Math.sqrt(m[i * 3 + i] - m[j * 3 + j] - m[k * 3 + k] + 1.0);
	        out[i] = 0.5 * fRoot;
	        fRoot = 0.5 / fRoot;
	        out[3] = (m[j * 3 + k] - m[k * 3 + j]) * fRoot;
	        out[j] = (m[j * 3 + i] + m[i * 3 + j]) * fRoot;
	        out[k] = (m[k * 3 + i] + m[i * 3 + k]) * fRoot;
	    }

	    return out;
	};

	/**
	 * Returns a string representation of a quatenion
	 *
	 * @param {quat} vec vector to represent as a string
	 * @returns {String} string representation of the vector
	 */
	quat.str = function (a) {
	    return 'quat(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
	};

	module.exports = quat;

/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE. */

	'use strict';

	var glMatrix = __webpack_require__(14);

	/**
	 * @class 3 Dimensional Vector
	 * @name vec3
	 */
	var vec3 = {};

	/**
	 * Creates a new, empty vec3
	 *
	 * @returns {vec3} a new 3D vector
	 */
	vec3.create = function () {
	    var out = new glMatrix.ARRAY_TYPE(3);
	    out[0] = 0;
	    out[1] = 0;
	    out[2] = 0;
	    return out;
	};

	/**
	 * Creates a new vec3 initialized with values from an existing vector
	 *
	 * @param {vec3} a vector to clone
	 * @returns {vec3} a new 3D vector
	 */
	vec3.clone = function (a) {
	    var out = new glMatrix.ARRAY_TYPE(3);
	    out[0] = a[0];
	    out[1] = a[1];
	    out[2] = a[2];
	    return out;
	};

	/**
	 * Creates a new vec3 initialized with the given values
	 *
	 * @param {Number} x X component
	 * @param {Number} y Y component
	 * @param {Number} z Z component
	 * @returns {vec3} a new 3D vector
	 */
	vec3.fromValues = function (x, y, z) {
	    var out = new glMatrix.ARRAY_TYPE(3);
	    out[0] = x;
	    out[1] = y;
	    out[2] = z;
	    return out;
	};

	/**
	 * Copy the values from one vec3 to another
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the source vector
	 * @returns {vec3} out
	 */
	vec3.copy = function (out, a) {
	    out[0] = a[0];
	    out[1] = a[1];
	    out[2] = a[2];
	    return out;
	};

	/**
	 * Set the components of a vec3 to the given values
	 *
	 * @param {vec3} out the receiving vector
	 * @param {Number} x X component
	 * @param {Number} y Y component
	 * @param {Number} z Z component
	 * @returns {vec3} out
	 */
	vec3.set = function (out, x, y, z) {
	    out[0] = x;
	    out[1] = y;
	    out[2] = z;
	    return out;
	};

	/**
	 * Adds two vec3's
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {vec3} out
	 */
	vec3.add = function (out, a, b) {
	    out[0] = a[0] + b[0];
	    out[1] = a[1] + b[1];
	    out[2] = a[2] + b[2];
	    return out;
	};

	/**
	 * Subtracts vector b from vector a
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {vec3} out
	 */
	vec3.subtract = function (out, a, b) {
	    out[0] = a[0] - b[0];
	    out[1] = a[1] - b[1];
	    out[2] = a[2] - b[2];
	    return out;
	};

	/**
	 * Alias for {@link vec3.subtract}
	 * @function
	 */
	vec3.sub = vec3.subtract;

	/**
	 * Multiplies two vec3's
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {vec3} out
	 */
	vec3.multiply = function (out, a, b) {
	    out[0] = a[0] * b[0];
	    out[1] = a[1] * b[1];
	    out[2] = a[2] * b[2];
	    return out;
	};

	/**
	 * Alias for {@link vec3.multiply}
	 * @function
	 */
	vec3.mul = vec3.multiply;

	/**
	 * Divides two vec3's
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {vec3} out
	 */
	vec3.divide = function (out, a, b) {
	    out[0] = a[0] / b[0];
	    out[1] = a[1] / b[1];
	    out[2] = a[2] / b[2];
	    return out;
	};

	/**
	 * Alias for {@link vec3.divide}
	 * @function
	 */
	vec3.div = vec3.divide;

	/**
	 * Returns the minimum of two vec3's
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {vec3} out
	 */
	vec3.min = function (out, a, b) {
	    out[0] = Math.min(a[0], b[0]);
	    out[1] = Math.min(a[1], b[1]);
	    out[2] = Math.min(a[2], b[2]);
	    return out;
	};

	/**
	 * Returns the maximum of two vec3's
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {vec3} out
	 */
	vec3.max = function (out, a, b) {
	    out[0] = Math.max(a[0], b[0]);
	    out[1] = Math.max(a[1], b[1]);
	    out[2] = Math.max(a[2], b[2]);
	    return out;
	};

	/**
	 * Scales a vec3 by a scalar number
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the vector to scale
	 * @param {Number} b amount to scale the vector by
	 * @returns {vec3} out
	 */
	vec3.scale = function (out, a, b) {
	    out[0] = a[0] * b;
	    out[1] = a[1] * b;
	    out[2] = a[2] * b;
	    return out;
	};

	/**
	 * Adds two vec3's after scaling the second operand by a scalar value
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @param {Number} scale the amount to scale b by before adding
	 * @returns {vec3} out
	 */
	vec3.scaleAndAdd = function (out, a, b, scale) {
	    out[0] = a[0] + b[0] * scale;
	    out[1] = a[1] + b[1] * scale;
	    out[2] = a[2] + b[2] * scale;
	    return out;
	};

	/**
	 * Calculates the euclidian distance between two vec3's
	 *
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {Number} distance between a and b
	 */
	vec3.distance = function (a, b) {
	    var x = b[0] - a[0],
	        y = b[1] - a[1],
	        z = b[2] - a[2];
	    return Math.sqrt(x * x + y * y + z * z);
	};

	/**
	 * Alias for {@link vec3.distance}
	 * @function
	 */
	vec3.dist = vec3.distance;

	/**
	 * Calculates the squared euclidian distance between two vec3's
	 *
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {Number} squared distance between a and b
	 */
	vec3.squaredDistance = function (a, b) {
	    var x = b[0] - a[0],
	        y = b[1] - a[1],
	        z = b[2] - a[2];
	    return x * x + y * y + z * z;
	};

	/**
	 * Alias for {@link vec3.squaredDistance}
	 * @function
	 */
	vec3.sqrDist = vec3.squaredDistance;

	/**
	 * Calculates the length of a vec3
	 *
	 * @param {vec3} a vector to calculate length of
	 * @returns {Number} length of a
	 */
	vec3.length = function (a) {
	    var x = a[0],
	        y = a[1],
	        z = a[2];
	    return Math.sqrt(x * x + y * y + z * z);
	};

	/**
	 * Alias for {@link vec3.length}
	 * @function
	 */
	vec3.len = vec3.length;

	/**
	 * Calculates the squared length of a vec3
	 *
	 * @param {vec3} a vector to calculate squared length of
	 * @returns {Number} squared length of a
	 */
	vec3.squaredLength = function (a) {
	    var x = a[0],
	        y = a[1],
	        z = a[2];
	    return x * x + y * y + z * z;
	};

	/**
	 * Alias for {@link vec3.squaredLength}
	 * @function
	 */
	vec3.sqrLen = vec3.squaredLength;

	/**
	 * Negates the components of a vec3
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a vector to negate
	 * @returns {vec3} out
	 */
	vec3.negate = function (out, a) {
	    out[0] = -a[0];
	    out[1] = -a[1];
	    out[2] = -a[2];
	    return out;
	};

	/**
	 * Returns the inverse of the components of a vec3
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a vector to invert
	 * @returns {vec3} out
	 */
	vec3.inverse = function (out, a) {
	    out[0] = 1.0 / a[0];
	    out[1] = 1.0 / a[1];
	    out[2] = 1.0 / a[2];
	    return out;
	};

	/**
	 * Normalize a vec3
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a vector to normalize
	 * @returns {vec3} out
	 */
	vec3.normalize = function (out, a) {
	    var x = a[0],
	        y = a[1],
	        z = a[2];
	    var len = x * x + y * y + z * z;
	    if (len > 0) {
	        //TODO: evaluate use of glm_invsqrt here?
	        len = 1 / Math.sqrt(len);
	        out[0] = a[0] * len;
	        out[1] = a[1] * len;
	        out[2] = a[2] * len;
	    }
	    return out;
	};

	/**
	 * Calculates the dot product of two vec3's
	 *
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {Number} dot product of a and b
	 */
	vec3.dot = function (a, b) {
	    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
	};

	/**
	 * Computes the cross product of two vec3's
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {vec3} out
	 */
	vec3.cross = function (out, a, b) {
	    var ax = a[0],
	        ay = a[1],
	        az = a[2],
	        bx = b[0],
	        by = b[1],
	        bz = b[2];

	    out[0] = ay * bz - az * by;
	    out[1] = az * bx - ax * bz;
	    out[2] = ax * by - ay * bx;
	    return out;
	};

	/**
	 * Performs a linear interpolation between two vec3's
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @param {Number} t interpolation amount between the two inputs
	 * @returns {vec3} out
	 */
	vec3.lerp = function (out, a, b, t) {
	    var ax = a[0],
	        ay = a[1],
	        az = a[2];
	    out[0] = ax + t * (b[0] - ax);
	    out[1] = ay + t * (b[1] - ay);
	    out[2] = az + t * (b[2] - az);
	    return out;
	};

	/**
	 * Performs a hermite interpolation with two control points
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @param {vec3} c the third operand
	 * @param {vec3} d the fourth operand
	 * @param {Number} t interpolation amount between the two inputs
	 * @returns {vec3} out
	 */
	vec3.hermite = function (out, a, b, c, d, t) {
	    var factorTimes2 = t * t,
	        factor1 = factorTimes2 * (2 * t - 3) + 1,
	        factor2 = factorTimes2 * (t - 2) + t,
	        factor3 = factorTimes2 * (t - 1),
	        factor4 = factorTimes2 * (3 - 2 * t);

	    out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
	    out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
	    out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;

	    return out;
	};

	/**
	 * Performs a bezier interpolation with two control points
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @param {vec3} c the third operand
	 * @param {vec3} d the fourth operand
	 * @param {Number} t interpolation amount between the two inputs
	 * @returns {vec3} out
	 */
	vec3.bezier = function (out, a, b, c, d, t) {
	    var inverseFactor = 1 - t,
	        inverseFactorTimesTwo = inverseFactor * inverseFactor,
	        factorTimes2 = t * t,
	        factor1 = inverseFactorTimesTwo * inverseFactor,
	        factor2 = 3 * t * inverseFactorTimesTwo,
	        factor3 = 3 * factorTimes2 * inverseFactor,
	        factor4 = factorTimes2 * t;

	    out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
	    out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
	    out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;

	    return out;
	};

	/**
	 * Generates a random vector with the given scale
	 *
	 * @param {vec3} out the receiving vector
	 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
	 * @returns {vec3} out
	 */
	vec3.random = function (out, scale) {
	    scale = scale || 1.0;

	    var r = glMatrix.RANDOM() * 2.0 * Math.PI;
	    var z = glMatrix.RANDOM() * 2.0 - 1.0;
	    var zScale = Math.sqrt(1.0 - z * z) * scale;

	    out[0] = Math.cos(r) * zScale;
	    out[1] = Math.sin(r) * zScale;
	    out[2] = z * scale;
	    return out;
	};

	/**
	 * Transforms the vec3 with a mat4.
	 * 4th vector component is implicitly '1'
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the vector to transform
	 * @param {mat4} m matrix to transform with
	 * @returns {vec3} out
	 */
	vec3.transformMat4 = function (out, a, m) {
	    var x = a[0],
	        y = a[1],
	        z = a[2],
	        w = m[3] * x + m[7] * y + m[11] * z + m[15];
	    w = w || 1.0;
	    out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
	    out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
	    out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
	    return out;
	};

	/**
	 * Transforms the vec3 with a mat3.
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the vector to transform
	 * @param {mat4} m the 3x3 matrix to transform with
	 * @returns {vec3} out
	 */
	vec3.transformMat3 = function (out, a, m) {
	    var x = a[0],
	        y = a[1],
	        z = a[2];
	    out[0] = x * m[0] + y * m[3] + z * m[6];
	    out[1] = x * m[1] + y * m[4] + z * m[7];
	    out[2] = x * m[2] + y * m[5] + z * m[8];
	    return out;
	};

	/**
	 * Transforms the vec3 with a quat
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the vector to transform
	 * @param {quat} q quaternion to transform with
	 * @returns {vec3} out
	 */
	vec3.transformQuat = function (out, a, q) {
	    // benchmarks: http://jsperf.com/quaternion-transform-vec3-implementations

	    var x = a[0],
	        y = a[1],
	        z = a[2],
	        qx = q[0],
	        qy = q[1],
	        qz = q[2],
	        qw = q[3],

	    // calculate quat * vec
	    ix = qw * x + qy * z - qz * y,
	        iy = qw * y + qz * x - qx * z,
	        iz = qw * z + qx * y - qy * x,
	        iw = -qx * x - qy * y - qz * z;

	    // calculate result * inverse quat
	    out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
	    out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
	    out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
	    return out;
	};

	/**
	 * Rotate a 3D vector around the x-axis
	 * @param {vec3} out The receiving vec3
	 * @param {vec3} a The vec3 point to rotate
	 * @param {vec3} b The origin of the rotation
	 * @param {Number} c The angle of rotation
	 * @returns {vec3} out
	 */
	vec3.rotateX = function (out, a, b, c) {
	    var p = [],
	        r = [];
	    //Translate point to the origin
	    p[0] = a[0] - b[0];
	    p[1] = a[1] - b[1];
	    p[2] = a[2] - b[2];

	    //perform rotation
	    r[0] = p[0];
	    r[1] = p[1] * Math.cos(c) - p[2] * Math.sin(c);
	    r[2] = p[1] * Math.sin(c) + p[2] * Math.cos(c);

	    //translate to correct position
	    out[0] = r[0] + b[0];
	    out[1] = r[1] + b[1];
	    out[2] = r[2] + b[2];

	    return out;
	};

	/**
	 * Rotate a 3D vector around the y-axis
	 * @param {vec3} out The receiving vec3
	 * @param {vec3} a The vec3 point to rotate
	 * @param {vec3} b The origin of the rotation
	 * @param {Number} c The angle of rotation
	 * @returns {vec3} out
	 */
	vec3.rotateY = function (out, a, b, c) {
	    var p = [],
	        r = [];
	    //Translate point to the origin
	    p[0] = a[0] - b[0];
	    p[1] = a[1] - b[1];
	    p[2] = a[2] - b[2];

	    //perform rotation
	    r[0] = p[2] * Math.sin(c) + p[0] * Math.cos(c);
	    r[1] = p[1];
	    r[2] = p[2] * Math.cos(c) - p[0] * Math.sin(c);

	    //translate to correct position
	    out[0] = r[0] + b[0];
	    out[1] = r[1] + b[1];
	    out[2] = r[2] + b[2];

	    return out;
	};

	/**
	 * Rotate a 3D vector around the z-axis
	 * @param {vec3} out The receiving vec3
	 * @param {vec3} a The vec3 point to rotate
	 * @param {vec3} b The origin of the rotation
	 * @param {Number} c The angle of rotation
	 * @returns {vec3} out
	 */
	vec3.rotateZ = function (out, a, b, c) {
	    var p = [],
	        r = [];
	    //Translate point to the origin
	    p[0] = a[0] - b[0];
	    p[1] = a[1] - b[1];
	    p[2] = a[2] - b[2];

	    //perform rotation
	    r[0] = p[0] * Math.cos(c) - p[1] * Math.sin(c);
	    r[1] = p[0] * Math.sin(c) + p[1] * Math.cos(c);
	    r[2] = p[2];

	    //translate to correct position
	    out[0] = r[0] + b[0];
	    out[1] = r[1] + b[1];
	    out[2] = r[2] + b[2];

	    return out;
	};

	/**
	 * Perform some operation over an array of vec3s.
	 *
	 * @param {Array} a the array of vectors to iterate over
	 * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
	 * @param {Number} offset Number of elements to skip at the beginning of the array
	 * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
	 * @param {Function} fn Function to call for each vector in the array
	 * @param {Object} [arg] additional argument to pass to fn
	 * @returns {Array} a
	 * @function
	 */
	vec3.forEach = (function () {
	    var vec = vec3.create();

	    return function (a, stride, offset, count, fn, arg) {
	        var i, l;
	        if (!stride) {
	            stride = 3;
	        }

	        if (!offset) {
	            offset = 0;
	        }

	        if (count) {
	            l = Math.min(count * stride + offset, a.length);
	        } else {
	            l = a.length;
	        }

	        for (i = offset; i < l; i += stride) {
	            vec[0] = a[i];vec[1] = a[i + 1];vec[2] = a[i + 2];
	            fn(vec, vec, arg);
	            a[i] = vec[0];a[i + 1] = vec[1];a[i + 2] = vec[2];
	        }

	        return a;
	    };
	})();

	/**
	 * Get the angle between two 3D vectors
	 * @param {vec3} a The first operand
	 * @param {vec3} b The second operand
	 * @returns {Number} The angle in radians
	 */
	vec3.angle = function (a, b) {

	    var tempA = vec3.fromValues(a[0], a[1], a[2]);
	    var tempB = vec3.fromValues(b[0], b[1], b[2]);

	    vec3.normalize(tempA, tempA);
	    vec3.normalize(tempB, tempB);

	    var cosine = vec3.dot(tempA, tempB);

	    if (cosine > 1.0) {
	        return 0;
	    } else {
	        return Math.acos(cosine);
	    }
	};

	/**
	 * Returns a string representation of a vector
	 *
	 * @param {vec3} vec vector to represent as a string
	 * @returns {String} string representation of the vector
	 */
	vec3.str = function (a) {
	    return 'vec3(' + a[0] + ', ' + a[1] + ', ' + a[2] + ')';
	};

	module.exports = vec3;

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE. */

	'use strict';

	var glMatrix = __webpack_require__(14);

	/**
	 * @class 4 Dimensional Vector
	 * @name vec4
	 */
	var vec4 = {};

	/**
	 * Creates a new, empty vec4
	 *
	 * @returns {vec4} a new 4D vector
	 */
	vec4.create = function () {
	    var out = new glMatrix.ARRAY_TYPE(4);
	    out[0] = 0;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    return out;
	};

	/**
	 * Creates a new vec4 initialized with values from an existing vector
	 *
	 * @param {vec4} a vector to clone
	 * @returns {vec4} a new 4D vector
	 */
	vec4.clone = function (a) {
	    var out = new glMatrix.ARRAY_TYPE(4);
	    out[0] = a[0];
	    out[1] = a[1];
	    out[2] = a[2];
	    out[3] = a[3];
	    return out;
	};

	/**
	 * Creates a new vec4 initialized with the given values
	 *
	 * @param {Number} x X component
	 * @param {Number} y Y component
	 * @param {Number} z Z component
	 * @param {Number} w W component
	 * @returns {vec4} a new 4D vector
	 */
	vec4.fromValues = function (x, y, z, w) {
	    var out = new glMatrix.ARRAY_TYPE(4);
	    out[0] = x;
	    out[1] = y;
	    out[2] = z;
	    out[3] = w;
	    return out;
	};

	/**
	 * Copy the values from one vec4 to another
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a the source vector
	 * @returns {vec4} out
	 */
	vec4.copy = function (out, a) {
	    out[0] = a[0];
	    out[1] = a[1];
	    out[2] = a[2];
	    out[3] = a[3];
	    return out;
	};

	/**
	 * Set the components of a vec4 to the given values
	 *
	 * @param {vec4} out the receiving vector
	 * @param {Number} x X component
	 * @param {Number} y Y component
	 * @param {Number} z Z component
	 * @param {Number} w W component
	 * @returns {vec4} out
	 */
	vec4.set = function (out, x, y, z, w) {
	    out[0] = x;
	    out[1] = y;
	    out[2] = z;
	    out[3] = w;
	    return out;
	};

	/**
	 * Adds two vec4's
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a the first operand
	 * @param {vec4} b the second operand
	 * @returns {vec4} out
	 */
	vec4.add = function (out, a, b) {
	    out[0] = a[0] + b[0];
	    out[1] = a[1] + b[1];
	    out[2] = a[2] + b[2];
	    out[3] = a[3] + b[3];
	    return out;
	};

	/**
	 * Subtracts vector b from vector a
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a the first operand
	 * @param {vec4} b the second operand
	 * @returns {vec4} out
	 */
	vec4.subtract = function (out, a, b) {
	    out[0] = a[0] - b[0];
	    out[1] = a[1] - b[1];
	    out[2] = a[2] - b[2];
	    out[3] = a[3] - b[3];
	    return out;
	};

	/**
	 * Alias for {@link vec4.subtract}
	 * @function
	 */
	vec4.sub = vec4.subtract;

	/**
	 * Multiplies two vec4's
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a the first operand
	 * @param {vec4} b the second operand
	 * @returns {vec4} out
	 */
	vec4.multiply = function (out, a, b) {
	    out[0] = a[0] * b[0];
	    out[1] = a[1] * b[1];
	    out[2] = a[2] * b[2];
	    out[3] = a[3] * b[3];
	    return out;
	};

	/**
	 * Alias for {@link vec4.multiply}
	 * @function
	 */
	vec4.mul = vec4.multiply;

	/**
	 * Divides two vec4's
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a the first operand
	 * @param {vec4} b the second operand
	 * @returns {vec4} out
	 */
	vec4.divide = function (out, a, b) {
	    out[0] = a[0] / b[0];
	    out[1] = a[1] / b[1];
	    out[2] = a[2] / b[2];
	    out[3] = a[3] / b[3];
	    return out;
	};

	/**
	 * Alias for {@link vec4.divide}
	 * @function
	 */
	vec4.div = vec4.divide;

	/**
	 * Returns the minimum of two vec4's
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a the first operand
	 * @param {vec4} b the second operand
	 * @returns {vec4} out
	 */
	vec4.min = function (out, a, b) {
	    out[0] = Math.min(a[0], b[0]);
	    out[1] = Math.min(a[1], b[1]);
	    out[2] = Math.min(a[2], b[2]);
	    out[3] = Math.min(a[3], b[3]);
	    return out;
	};

	/**
	 * Returns the maximum of two vec4's
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a the first operand
	 * @param {vec4} b the second operand
	 * @returns {vec4} out
	 */
	vec4.max = function (out, a, b) {
	    out[0] = Math.max(a[0], b[0]);
	    out[1] = Math.max(a[1], b[1]);
	    out[2] = Math.max(a[2], b[2]);
	    out[3] = Math.max(a[3], b[3]);
	    return out;
	};

	/**
	 * Scales a vec4 by a scalar number
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a the vector to scale
	 * @param {Number} b amount to scale the vector by
	 * @returns {vec4} out
	 */
	vec4.scale = function (out, a, b) {
	    out[0] = a[0] * b;
	    out[1] = a[1] * b;
	    out[2] = a[2] * b;
	    out[3] = a[3] * b;
	    return out;
	};

	/**
	 * Adds two vec4's after scaling the second operand by a scalar value
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a the first operand
	 * @param {vec4} b the second operand
	 * @param {Number} scale the amount to scale b by before adding
	 * @returns {vec4} out
	 */
	vec4.scaleAndAdd = function (out, a, b, scale) {
	    out[0] = a[0] + b[0] * scale;
	    out[1] = a[1] + b[1] * scale;
	    out[2] = a[2] + b[2] * scale;
	    out[3] = a[3] + b[3] * scale;
	    return out;
	};

	/**
	 * Calculates the euclidian distance between two vec4's
	 *
	 * @param {vec4} a the first operand
	 * @param {vec4} b the second operand
	 * @returns {Number} distance between a and b
	 */
	vec4.distance = function (a, b) {
	    var x = b[0] - a[0],
	        y = b[1] - a[1],
	        z = b[2] - a[2],
	        w = b[3] - a[3];
	    return Math.sqrt(x * x + y * y + z * z + w * w);
	};

	/**
	 * Alias for {@link vec4.distance}
	 * @function
	 */
	vec4.dist = vec4.distance;

	/**
	 * Calculates the squared euclidian distance between two vec4's
	 *
	 * @param {vec4} a the first operand
	 * @param {vec4} b the second operand
	 * @returns {Number} squared distance between a and b
	 */
	vec4.squaredDistance = function (a, b) {
	    var x = b[0] - a[0],
	        y = b[1] - a[1],
	        z = b[2] - a[2],
	        w = b[3] - a[3];
	    return x * x + y * y + z * z + w * w;
	};

	/**
	 * Alias for {@link vec4.squaredDistance}
	 * @function
	 */
	vec4.sqrDist = vec4.squaredDistance;

	/**
	 * Calculates the length of a vec4
	 *
	 * @param {vec4} a vector to calculate length of
	 * @returns {Number} length of a
	 */
	vec4.length = function (a) {
	    var x = a[0],
	        y = a[1],
	        z = a[2],
	        w = a[3];
	    return Math.sqrt(x * x + y * y + z * z + w * w);
	};

	/**
	 * Alias for {@link vec4.length}
	 * @function
	 */
	vec4.len = vec4.length;

	/**
	 * Calculates the squared length of a vec4
	 *
	 * @param {vec4} a vector to calculate squared length of
	 * @returns {Number} squared length of a
	 */
	vec4.squaredLength = function (a) {
	    var x = a[0],
	        y = a[1],
	        z = a[2],
	        w = a[3];
	    return x * x + y * y + z * z + w * w;
	};

	/**
	 * Alias for {@link vec4.squaredLength}
	 * @function
	 */
	vec4.sqrLen = vec4.squaredLength;

	/**
	 * Negates the components of a vec4
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a vector to negate
	 * @returns {vec4} out
	 */
	vec4.negate = function (out, a) {
	    out[0] = -a[0];
	    out[1] = -a[1];
	    out[2] = -a[2];
	    out[3] = -a[3];
	    return out;
	};

	/**
	 * Returns the inverse of the components of a vec4
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a vector to invert
	 * @returns {vec4} out
	 */
	vec4.inverse = function (out, a) {
	    out[0] = 1.0 / a[0];
	    out[1] = 1.0 / a[1];
	    out[2] = 1.0 / a[2];
	    out[3] = 1.0 / a[3];
	    return out;
	};

	/**
	 * Normalize a vec4
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a vector to normalize
	 * @returns {vec4} out
	 */
	vec4.normalize = function (out, a) {
	    var x = a[0],
	        y = a[1],
	        z = a[2],
	        w = a[3];
	    var len = x * x + y * y + z * z + w * w;
	    if (len > 0) {
	        len = 1 / Math.sqrt(len);
	        out[0] = x * len;
	        out[1] = y * len;
	        out[2] = z * len;
	        out[3] = w * len;
	    }
	    return out;
	};

	/**
	 * Calculates the dot product of two vec4's
	 *
	 * @param {vec4} a the first operand
	 * @param {vec4} b the second operand
	 * @returns {Number} dot product of a and b
	 */
	vec4.dot = function (a, b) {
	    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
	};

	/**
	 * Performs a linear interpolation between two vec4's
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a the first operand
	 * @param {vec4} b the second operand
	 * @param {Number} t interpolation amount between the two inputs
	 * @returns {vec4} out
	 */
	vec4.lerp = function (out, a, b, t) {
	    var ax = a[0],
	        ay = a[1],
	        az = a[2],
	        aw = a[3];
	    out[0] = ax + t * (b[0] - ax);
	    out[1] = ay + t * (b[1] - ay);
	    out[2] = az + t * (b[2] - az);
	    out[3] = aw + t * (b[3] - aw);
	    return out;
	};

	/**
	 * Generates a random vector with the given scale
	 *
	 * @param {vec4} out the receiving vector
	 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
	 * @returns {vec4} out
	 */
	vec4.random = function (out, scale) {
	    scale = scale || 1.0;

	    //TODO: This is a pretty awful way of doing this. Find something better.
	    out[0] = glMatrix.RANDOM();
	    out[1] = glMatrix.RANDOM();
	    out[2] = glMatrix.RANDOM();
	    out[3] = glMatrix.RANDOM();
	    vec4.normalize(out, out);
	    vec4.scale(out, out, scale);
	    return out;
	};

	/**
	 * Transforms the vec4 with a mat4.
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a the vector to transform
	 * @param {mat4} m matrix to transform with
	 * @returns {vec4} out
	 */
	vec4.transformMat4 = function (out, a, m) {
	    var x = a[0],
	        y = a[1],
	        z = a[2],
	        w = a[3];
	    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
	    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
	    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
	    out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
	    return out;
	};

	/**
	 * Transforms the vec4 with a quat
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a the vector to transform
	 * @param {quat} q quaternion to transform with
	 * @returns {vec4} out
	 */
	vec4.transformQuat = function (out, a, q) {
	    var x = a[0],
	        y = a[1],
	        z = a[2],
	        qx = q[0],
	        qy = q[1],
	        qz = q[2],
	        qw = q[3],

	    // calculate quat * vec
	    ix = qw * x + qy * z - qz * y,
	        iy = qw * y + qz * x - qx * z,
	        iz = qw * z + qx * y - qy * x,
	        iw = -qx * x - qy * y - qz * z;

	    // calculate result * inverse quat
	    out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
	    out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
	    out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
	    out[3] = a[3];
	    return out;
	};

	/**
	 * Perform some operation over an array of vec4s.
	 *
	 * @param {Array} a the array of vectors to iterate over
	 * @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
	 * @param {Number} offset Number of elements to skip at the beginning of the array
	 * @param {Number} count Number of vec4s to iterate over. If 0 iterates over entire array
	 * @param {Function} fn Function to call for each vector in the array
	 * @param {Object} [arg] additional argument to pass to fn
	 * @returns {Array} a
	 * @function
	 */
	vec4.forEach = (function () {
	    var vec = vec4.create();

	    return function (a, stride, offset, count, fn, arg) {
	        var i, l;
	        if (!stride) {
	            stride = 4;
	        }

	        if (!offset) {
	            offset = 0;
	        }

	        if (count) {
	            l = Math.min(count * stride + offset, a.length);
	        } else {
	            l = a.length;
	        }

	        for (i = offset; i < l; i += stride) {
	            vec[0] = a[i];vec[1] = a[i + 1];vec[2] = a[i + 2];vec[3] = a[i + 3];
	            fn(vec, vec, arg);
	            a[i] = vec[0];a[i + 1] = vec[1];a[i + 2] = vec[2];a[i + 3] = vec[3];
	        }

	        return a;
	    };
	})();

	/**
	 * Returns a string representation of a vector
	 *
	 * @param {vec4} vec vector to represent as a string
	 * @returns {String} string representation of the vector
	 */
	vec4.str = function (a) {
	    return 'vec4(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
	};

	module.exports = vec4;

/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE. */

	'use strict';

	var glMatrix = __webpack_require__(14);

	/**
	 * @class 2 Dimensional Vector
	 * @name vec2
	 */
	var vec2 = {};

	/**
	 * Creates a new, empty vec2
	 *
	 * @returns {vec2} a new 2D vector
	 */
	vec2.create = function () {
	    var out = new glMatrix.ARRAY_TYPE(2);
	    out[0] = 0;
	    out[1] = 0;
	    return out;
	};

	/**
	 * Creates a new vec2 initialized with values from an existing vector
	 *
	 * @param {vec2} a vector to clone
	 * @returns {vec2} a new 2D vector
	 */
	vec2.clone = function (a) {
	    var out = new glMatrix.ARRAY_TYPE(2);
	    out[0] = a[0];
	    out[1] = a[1];
	    return out;
	};

	/**
	 * Creates a new vec2 initialized with the given values
	 *
	 * @param {Number} x X component
	 * @param {Number} y Y component
	 * @returns {vec2} a new 2D vector
	 */
	vec2.fromValues = function (x, y) {
	    var out = new glMatrix.ARRAY_TYPE(2);
	    out[0] = x;
	    out[1] = y;
	    return out;
	};

	/**
	 * Copy the values from one vec2 to another
	 *
	 * @param {vec2} out the receiving vector
	 * @param {vec2} a the source vector
	 * @returns {vec2} out
	 */
	vec2.copy = function (out, a) {
	    out[0] = a[0];
	    out[1] = a[1];
	    return out;
	};

	/**
	 * Set the components of a vec2 to the given values
	 *
	 * @param {vec2} out the receiving vector
	 * @param {Number} x X component
	 * @param {Number} y Y component
	 * @returns {vec2} out
	 */
	vec2.set = function (out, x, y) {
	    out[0] = x;
	    out[1] = y;
	    return out;
	};

	/**
	 * Adds two vec2's
	 *
	 * @param {vec2} out the receiving vector
	 * @param {vec2} a the first operand
	 * @param {vec2} b the second operand
	 * @returns {vec2} out
	 */
	vec2.add = function (out, a, b) {
	    out[0] = a[0] + b[0];
	    out[1] = a[1] + b[1];
	    return out;
	};

	/**
	 * Subtracts vector b from vector a
	 *
	 * @param {vec2} out the receiving vector
	 * @param {vec2} a the first operand
	 * @param {vec2} b the second operand
	 * @returns {vec2} out
	 */
	vec2.subtract = function (out, a, b) {
	    out[0] = a[0] - b[0];
	    out[1] = a[1] - b[1];
	    return out;
	};

	/**
	 * Alias for {@link vec2.subtract}
	 * @function
	 */
	vec2.sub = vec2.subtract;

	/**
	 * Multiplies two vec2's
	 *
	 * @param {vec2} out the receiving vector
	 * @param {vec2} a the first operand
	 * @param {vec2} b the second operand
	 * @returns {vec2} out
	 */
	vec2.multiply = function (out, a, b) {
	    out[0] = a[0] * b[0];
	    out[1] = a[1] * b[1];
	    return out;
	};

	/**
	 * Alias for {@link vec2.multiply}
	 * @function
	 */
	vec2.mul = vec2.multiply;

	/**
	 * Divides two vec2's
	 *
	 * @param {vec2} out the receiving vector
	 * @param {vec2} a the first operand
	 * @param {vec2} b the second operand
	 * @returns {vec2} out
	 */
	vec2.divide = function (out, a, b) {
	    out[0] = a[0] / b[0];
	    out[1] = a[1] / b[1];
	    return out;
	};

	/**
	 * Alias for {@link vec2.divide}
	 * @function
	 */
	vec2.div = vec2.divide;

	/**
	 * Returns the minimum of two vec2's
	 *
	 * @param {vec2} out the receiving vector
	 * @param {vec2} a the first operand
	 * @param {vec2} b the second operand
	 * @returns {vec2} out
	 */
	vec2.min = function (out, a, b) {
	    out[0] = Math.min(a[0], b[0]);
	    out[1] = Math.min(a[1], b[1]);
	    return out;
	};

	/**
	 * Returns the maximum of two vec2's
	 *
	 * @param {vec2} out the receiving vector
	 * @param {vec2} a the first operand
	 * @param {vec2} b the second operand
	 * @returns {vec2} out
	 */
	vec2.max = function (out, a, b) {
	    out[0] = Math.max(a[0], b[0]);
	    out[1] = Math.max(a[1], b[1]);
	    return out;
	};

	/**
	 * Scales a vec2 by a scalar number
	 *
	 * @param {vec2} out the receiving vector
	 * @param {vec2} a the vector to scale
	 * @param {Number} b amount to scale the vector by
	 * @returns {vec2} out
	 */
	vec2.scale = function (out, a, b) {
	    out[0] = a[0] * b;
	    out[1] = a[1] * b;
	    return out;
	};

	/**
	 * Adds two vec2's after scaling the second operand by a scalar value
	 *
	 * @param {vec2} out the receiving vector
	 * @param {vec2} a the first operand
	 * @param {vec2} b the second operand
	 * @param {Number} scale the amount to scale b by before adding
	 * @returns {vec2} out
	 */
	vec2.scaleAndAdd = function (out, a, b, scale) {
	    out[0] = a[0] + b[0] * scale;
	    out[1] = a[1] + b[1] * scale;
	    return out;
	};

	/**
	 * Calculates the euclidian distance between two vec2's
	 *
	 * @param {vec2} a the first operand
	 * @param {vec2} b the second operand
	 * @returns {Number} distance between a and b
	 */
	vec2.distance = function (a, b) {
	    var x = b[0] - a[0],
	        y = b[1] - a[1];
	    return Math.sqrt(x * x + y * y);
	};

	/**
	 * Alias for {@link vec2.distance}
	 * @function
	 */
	vec2.dist = vec2.distance;

	/**
	 * Calculates the squared euclidian distance between two vec2's
	 *
	 * @param {vec2} a the first operand
	 * @param {vec2} b the second operand
	 * @returns {Number} squared distance between a and b
	 */
	vec2.squaredDistance = function (a, b) {
	    var x = b[0] - a[0],
	        y = b[1] - a[1];
	    return x * x + y * y;
	};

	/**
	 * Alias for {@link vec2.squaredDistance}
	 * @function
	 */
	vec2.sqrDist = vec2.squaredDistance;

	/**
	 * Calculates the length of a vec2
	 *
	 * @param {vec2} a vector to calculate length of
	 * @returns {Number} length of a
	 */
	vec2.length = function (a) {
	    var x = a[0],
	        y = a[1];
	    return Math.sqrt(x * x + y * y);
	};

	/**
	 * Alias for {@link vec2.length}
	 * @function
	 */
	vec2.len = vec2.length;

	/**
	 * Calculates the squared length of a vec2
	 *
	 * @param {vec2} a vector to calculate squared length of
	 * @returns {Number} squared length of a
	 */
	vec2.squaredLength = function (a) {
	    var x = a[0],
	        y = a[1];
	    return x * x + y * y;
	};

	/**
	 * Alias for {@link vec2.squaredLength}
	 * @function
	 */
	vec2.sqrLen = vec2.squaredLength;

	/**
	 * Negates the components of a vec2
	 *
	 * @param {vec2} out the receiving vector
	 * @param {vec2} a vector to negate
	 * @returns {vec2} out
	 */
	vec2.negate = function (out, a) {
	    out[0] = -a[0];
	    out[1] = -a[1];
	    return out;
	};

	/**
	 * Returns the inverse of the components of a vec2
	 *
	 * @param {vec2} out the receiving vector
	 * @param {vec2} a vector to invert
	 * @returns {vec2} out
	 */
	vec2.inverse = function (out, a) {
	    out[0] = 1.0 / a[0];
	    out[1] = 1.0 / a[1];
	    return out;
	};

	/**
	 * Normalize a vec2
	 *
	 * @param {vec2} out the receiving vector
	 * @param {vec2} a vector to normalize
	 * @returns {vec2} out
	 */
	vec2.normalize = function (out, a) {
	    var x = a[0],
	        y = a[1];
	    var len = x * x + y * y;
	    if (len > 0) {
	        //TODO: evaluate use of glm_invsqrt here?
	        len = 1 / Math.sqrt(len);
	        out[0] = a[0] * len;
	        out[1] = a[1] * len;
	    }
	    return out;
	};

	/**
	 * Calculates the dot product of two vec2's
	 *
	 * @param {vec2} a the first operand
	 * @param {vec2} b the second operand
	 * @returns {Number} dot product of a and b
	 */
	vec2.dot = function (a, b) {
	    return a[0] * b[0] + a[1] * b[1];
	};

	/**
	 * Computes the cross product of two vec2's
	 * Note that the cross product must by definition produce a 3D vector
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec2} a the first operand
	 * @param {vec2} b the second operand
	 * @returns {vec3} out
	 */
	vec2.cross = function (out, a, b) {
	    var z = a[0] * b[1] - a[1] * b[0];
	    out[0] = out[1] = 0;
	    out[2] = z;
	    return out;
	};

	/**
	 * Performs a linear interpolation between two vec2's
	 *
	 * @param {vec2} out the receiving vector
	 * @param {vec2} a the first operand
	 * @param {vec2} b the second operand
	 * @param {Number} t interpolation amount between the two inputs
	 * @returns {vec2} out
	 */
	vec2.lerp = function (out, a, b, t) {
	    var ax = a[0],
	        ay = a[1];
	    out[0] = ax + t * (b[0] - ax);
	    out[1] = ay + t * (b[1] - ay);
	    return out;
	};

	/**
	 * Generates a random vector with the given scale
	 *
	 * @param {vec2} out the receiving vector
	 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
	 * @returns {vec2} out
	 */
	vec2.random = function (out, scale) {
	    scale = scale || 1.0;
	    var r = glMatrix.RANDOM() * 2.0 * Math.PI;
	    out[0] = Math.cos(r) * scale;
	    out[1] = Math.sin(r) * scale;
	    return out;
	};

	/**
	 * Transforms the vec2 with a mat2
	 *
	 * @param {vec2} out the receiving vector
	 * @param {vec2} a the vector to transform
	 * @param {mat2} m matrix to transform with
	 * @returns {vec2} out
	 */
	vec2.transformMat2 = function (out, a, m) {
	    var x = a[0],
	        y = a[1];
	    out[0] = m[0] * x + m[2] * y;
	    out[1] = m[1] * x + m[3] * y;
	    return out;
	};

	/**
	 * Transforms the vec2 with a mat2d
	 *
	 * @param {vec2} out the receiving vector
	 * @param {vec2} a the vector to transform
	 * @param {mat2d} m matrix to transform with
	 * @returns {vec2} out
	 */
	vec2.transformMat2d = function (out, a, m) {
	    var x = a[0],
	        y = a[1];
	    out[0] = m[0] * x + m[2] * y + m[4];
	    out[1] = m[1] * x + m[3] * y + m[5];
	    return out;
	};

	/**
	 * Transforms the vec2 with a mat3
	 * 3rd vector component is implicitly '1'
	 *
	 * @param {vec2} out the receiving vector
	 * @param {vec2} a the vector to transform
	 * @param {mat3} m matrix to transform with
	 * @returns {vec2} out
	 */
	vec2.transformMat3 = function (out, a, m) {
	    var x = a[0],
	        y = a[1];
	    out[0] = m[0] * x + m[3] * y + m[6];
	    out[1] = m[1] * x + m[4] * y + m[7];
	    return out;
	};

	/**
	 * Transforms the vec2 with a mat4
	 * 3rd vector component is implicitly '0'
	 * 4th vector component is implicitly '1'
	 *
	 * @param {vec2} out the receiving vector
	 * @param {vec2} a the vector to transform
	 * @param {mat4} m matrix to transform with
	 * @returns {vec2} out
	 */
	vec2.transformMat4 = function (out, a, m) {
	    var x = a[0],
	        y = a[1];
	    out[0] = m[0] * x + m[4] * y + m[12];
	    out[1] = m[1] * x + m[5] * y + m[13];
	    return out;
	};

	/**
	 * Perform some operation over an array of vec2s.
	 *
	 * @param {Array} a the array of vectors to iterate over
	 * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
	 * @param {Number} offset Number of elements to skip at the beginning of the array
	 * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
	 * @param {Function} fn Function to call for each vector in the array
	 * @param {Object} [arg] additional argument to pass to fn
	 * @returns {Array} a
	 * @function
	 */
	vec2.forEach = (function () {
	    var vec = vec2.create();

	    return function (a, stride, offset, count, fn, arg) {
	        var i, l;
	        if (!stride) {
	            stride = 2;
	        }

	        if (!offset) {
	            offset = 0;
	        }

	        if (count) {
	            l = Math.min(count * stride + offset, a.length);
	        } else {
	            l = a.length;
	        }

	        for (i = offset; i < l; i += stride) {
	            vec[0] = a[i];vec[1] = a[i + 1];
	            fn(vec, vec, arg);
	            a[i] = vec[0];a[i + 1] = vec[1];
	        }

	        return a;
	    };
	})();

	/**
	 * Returns a string representation of a vector
	 *
	 * @param {vec2} vec vector to represent as a string
	 * @returns {String} string representation of the vector
	 */
	vec2.str = function (a) {
	    return 'vec2(' + a[0] + ', ' + a[1] + ')';
	};

	module.exports = vec2;

/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var createUniformWrapper = __webpack_require__(24);
	var createAttributeWrapper = __webpack_require__(26);
	var makeReflect = __webpack_require__(25);
	var shaderCache = __webpack_require__(27);
	var runtime = __webpack_require__(31);

	//Shader object
	function Shader(gl) {
	  this.gl = gl;

	  //Default initialize these to null
	  this._vref = this._fref = this._relink = this.vertShader = this.fragShader = this.program = this.attributes = this.uniforms = this.types = null;
	}

	var proto = Shader.prototype;

	proto.bind = function () {
	  if (!this.program) {
	    this._relink();
	  }
	  this.gl.useProgram(this.program);
	};

	proto.dispose = function () {
	  if (this._fref) {
	    this._fref.dispose();
	  }
	  if (this._vref) {
	    this._vref.dispose();
	  }
	  this.attributes = this.types = this.vertShader = this.fragShader = this.program = this._relink = this._fref = this._vref = null;
	};

	function compareAttributes(a, b) {
	  if (a.name < b.name) {
	    return -1;
	  }
	  return 1;
	}

	//Update export hook for glslify-live
	proto.update = function (vertSource, fragSource, uniforms, attributes) {

	  //If only one object passed, assume glslify style output
	  if (!fragSource || arguments.length === 1) {
	    var obj = vertSource;
	    vertSource = obj.vertex;
	    fragSource = obj.fragment;
	    uniforms = obj.uniforms;
	    attributes = obj.attributes;
	  }

	  var wrapper = this;
	  var gl = wrapper.gl;

	  //Compile vertex and fragment shaders
	  var pvref = wrapper._vref;
	  wrapper._vref = shaderCache.shader(gl, gl.VERTEX_SHADER, vertSource);
	  if (pvref) {
	    pvref.dispose();
	  }
	  wrapper.vertShader = wrapper._vref.shader;
	  var pfref = this._fref;
	  wrapper._fref = shaderCache.shader(gl, gl.FRAGMENT_SHADER, fragSource);
	  if (pfref) {
	    pfref.dispose();
	  }
	  wrapper.fragShader = wrapper._fref.shader;

	  //If uniforms/attributes is not specified, use RT reflection
	  if (!uniforms || !attributes) {

	    //Create initial test program
	    var testProgram = gl.createProgram();
	    gl.attachShader(testProgram, wrapper.fragShader);
	    gl.attachShader(testProgram, wrapper.vertShader);
	    gl.linkProgram(testProgram);
	    if (!gl.getProgramParameter(testProgram, gl.LINK_STATUS)) {
	      var errLog = gl.getProgramInfoLog(testProgram);
	      console.error('gl-shader: Error linking program:', errLog);
	      throw new Error('gl-shader: Error linking program:' + errLog);
	    }

	    //Load data from runtime
	    uniforms = uniforms || runtime.uniforms(gl, testProgram);
	    attributes = attributes || runtime.attributes(gl, testProgram);

	    //Release test program
	    gl.deleteProgram(testProgram);
	  }

	  //Sort attributes lexicographically
	  // overrides undefined WebGL behavior for attribute locations
	  attributes = attributes.slice();
	  attributes.sort(compareAttributes);

	  //Convert attribute types, read out locations
	  var attributeUnpacked = [];
	  var attributeNames = [];
	  var attributeLocations = [];
	  for (var i = 0; i < attributes.length; ++i) {
	    var attr = attributes[i];
	    if (attr.type.indexOf('mat') >= 0) {
	      var size = attr.type.charAt(attr.type.length - 1) | 0;
	      var locVector = new Array(size);
	      for (var j = 0; j < size; ++j) {
	        locVector[j] = attributeLocations.length;
	        attributeNames.push(attr.name + '[' + j + ']');
	        if (typeof attr.location === 'number') {
	          attributeLocations.push(attr.location + j);
	        } else if (Array.isArray(attr.location) && attr.location.length === size && typeof attr.location[j] === 'number') {
	          attributeLocations.push(attr.location[j] | 0);
	        } else {
	          attributeLocations.push(-1);
	        }
	      }
	      attributeUnpacked.push({
	        name: attr.name,
	        type: attr.type,
	        locations: locVector
	      });
	    } else {
	      attributeUnpacked.push({
	        name: attr.name,
	        type: attr.type,
	        locations: [attributeLocations.length]
	      });
	      attributeNames.push(attr.name);
	      if (typeof attr.location === 'number') {
	        attributeLocations.push(attr.location | 0);
	      } else {
	        attributeLocations.push(-1);
	      }
	    }
	  }

	  //For all unspecified attributes, assign them lexicographically min attribute
	  var curLocation = 0;
	  for (var i = 0; i < attributeLocations.length; ++i) {
	    if (attributeLocations[i] < 0) {
	      while (attributeLocations.indexOf(curLocation) >= 0) {
	        curLocation += 1;
	      }
	      attributeLocations[i] = curLocation;
	    }
	  }

	  //Rebuild program and recompute all uniform locations
	  var uniformLocations = new Array(uniforms.length);
	  function relink() {
	    wrapper.program = shaderCache.program(gl, wrapper._vref, wrapper._fref, attributeNames, attributeLocations);

	    for (var i = 0; i < uniforms.length; ++i) {
	      uniformLocations[i] = gl.getUniformLocation(wrapper.program, uniforms[i].name);
	    }
	  }

	  //Perform initial linking, reuse program used for reflection
	  relink();

	  //Save relinking procedure, defer until runtime
	  wrapper._relink = relink;

	  //Generate type info
	  wrapper.types = {
	    uniforms: makeReflect(uniforms),
	    attributes: makeReflect(attributes)
	  };

	  //Generate attribute wrappers
	  wrapper.attributes = createAttributeWrapper(gl, wrapper, attributeUnpacked, attributeLocations);

	  //Generate uniform wrappers
	  Object.defineProperty(wrapper, 'uniforms', createUniformWrapper(gl, wrapper, uniforms, uniformLocations));
	};

	//Compiles and links a shader program with the given attribute and vertex list
	function createShader(gl, vertSource, fragSource, uniforms, attributes) {

	  var shader = new Shader(gl);

	  shader.update(vertSource, fragSource, uniforms, attributes);

	  return shader;
	}

	module.exports = createShader;

/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var coallesceUniforms = __webpack_require__(25);

	module.exports = createUniformWrapper;

	//Binds a function and returns a value
	function identity(x) {
	  var c = new Function('y', 'return function(){return y}');
	  return c(x);
	}

	function makeVector(length, fill) {
	  var result = new Array(length);
	  for (var i = 0; i < length; ++i) {
	    result[i] = fill;
	  }
	  return result;
	}

	//Create shims for uniforms
	function createUniformWrapper(gl, wrapper, uniforms, locations) {

	  function makeGetter(index) {
	    var proc = new Function('gl', 'wrapper', 'locations', 'return function(){return gl.getUniform(wrapper.program,locations[' + index + '])}');
	    return proc(gl, wrapper, locations);
	  }

	  function makePropSetter(path, index, type) {
	    switch (type) {
	      case 'bool':
	      case 'int':
	      case 'sampler2D':
	      case 'samplerCube':
	        return 'gl.uniform1i(locations[' + index + '],obj' + path + ')';
	      case 'float':
	        return 'gl.uniform1f(locations[' + index + '],obj' + path + ')';
	      default:
	        var vidx = type.indexOf('vec');
	        if (0 <= vidx && vidx <= 1 && type.length === 4 + vidx) {
	          var d = type.charCodeAt(type.length - 1) - 48;
	          if (d < 2 || d > 4) {
	            throw new Error('gl-shader: Invalid data type');
	          }
	          switch (type.charAt(0)) {
	            case 'b':
	            case 'i':
	              return 'gl.uniform' + d + 'iv(locations[' + index + '],obj' + path + ')';
	            case 'v':
	              return 'gl.uniform' + d + 'fv(locations[' + index + '],obj' + path + ')';
	            default:
	              throw new Error('gl-shader: Unrecognized data type for vector ' + name + ': ' + type);
	          }
	        } else if (type.indexOf('mat') === 0 && type.length === 4) {
	          var d = type.charCodeAt(type.length - 1) - 48;
	          if (d < 2 || d > 4) {
	            throw new Error('gl-shader: Invalid uniform dimension type for matrix ' + name + ': ' + type);
	          }
	          return 'gl.uniformMatrix' + d + 'fv(locations[' + index + '],false,obj' + path + ')';
	        } else {
	          throw new Error('gl-shader: Unknown uniform data type for ' + name + ': ' + type);
	        }
	        break;
	    }
	  }

	  function enumerateIndices(prefix, type) {
	    if (typeof type !== 'object') {
	      return [[prefix, type]];
	    }
	    var indices = [];
	    for (var id in type) {
	      var prop = type[id];
	      var tprefix = prefix;
	      if (parseInt(id) + '' === id) {
	        tprefix += '[' + id + ']';
	      } else {
	        tprefix += '.' + id;
	      }
	      if (typeof prop === 'object') {
	        indices.push.apply(indices, enumerateIndices(tprefix, prop));
	      } else {
	        indices.push([tprefix, prop]);
	      }
	    }
	    return indices;
	  }

	  function makeSetter(type) {
	    var code = ['return function updateProperty(obj){'];
	    var indices = enumerateIndices('', type);
	    for (var i = 0; i < indices.length; ++i) {
	      var item = indices[i];
	      var path = item[0];
	      var idx = item[1];
	      if (locations[idx]) {
	        code.push(makePropSetter(path, idx, uniforms[idx].type));
	      }
	    }
	    code.push('return obj}');
	    var proc = new Function('gl', 'locations', code.join('\n'));
	    return proc(gl, locations);
	  }

	  function defaultValue(type) {
	    switch (type) {
	      case 'bool':
	        return false;
	      case 'int':
	      case 'sampler2D':
	      case 'samplerCube':
	        return 0;
	      case 'float':
	        return 0.0;
	      default:
	        var vidx = type.indexOf('vec');
	        if (0 <= vidx && vidx <= 1 && type.length === 4 + vidx) {
	          var d = type.charCodeAt(type.length - 1) - 48;
	          if (d < 2 || d > 4) {
	            throw new Error('gl-shader: Invalid data type');
	          }
	          if (type.charAt(0) === 'b') {
	            return makeVector(d, false);
	          }
	          return makeVector(d, 0);
	        } else if (type.indexOf('mat') === 0 && type.length === 4) {
	          var d = type.charCodeAt(type.length - 1) - 48;
	          if (d < 2 || d > 4) {
	            throw new Error('gl-shader: Invalid uniform dimension type for matrix ' + name + ': ' + type);
	          }
	          return makeVector(d * d, 0);
	        } else {
	          throw new Error('gl-shader: Unknown uniform data type for ' + name + ': ' + type);
	        }
	        break;
	    }
	  }

	  function storeProperty(obj, prop, type) {
	    if (typeof type === 'object') {
	      var child = processObject(type);
	      Object.defineProperty(obj, prop, {
	        get: identity(child),
	        set: makeSetter(type),
	        enumerable: true,
	        configurable: false
	      });
	    } else {
	      if (locations[type]) {
	        Object.defineProperty(obj, prop, {
	          get: makeGetter(type),
	          set: makeSetter(type),
	          enumerable: true,
	          configurable: false
	        });
	      } else {
	        obj[prop] = defaultValue(uniforms[type].type);
	      }
	    }
	  }

	  function processObject(obj) {
	    var result;
	    if (Array.isArray(obj)) {
	      result = new Array(obj.length);
	      for (var i = 0; i < obj.length; ++i) {
	        storeProperty(result, i, obj[i]);
	      }
	    } else {
	      result = {};
	      for (var id in obj) {
	        storeProperty(result, id, obj[id]);
	      }
	    }
	    return result;
	  }

	  //Return data
	  var coallesced = coallesceUniforms(uniforms, true);
	  return {
	    get: identity(processObject(coallesced)),
	    set: makeSetter(coallesced),
	    enumerable: true,
	    configurable: true
	  };
	}

/***/ },
/* 25 */
/***/ function(module, exports) {

	'use strict';

	module.exports = makeReflectTypes;

	//Construct type info for reflection.
	//
	// This iterates over the flattened list of uniform type values and smashes them into a JSON object.
	//
	// The leaves of the resulting object are either indices or type strings representing primitive glslify types
	function makeReflectTypes(uniforms, useIndex) {
	  var obj = {};
	  for (var i = 0; i < uniforms.length; ++i) {
	    var n = uniforms[i].name;
	    var parts = n.split(".");
	    var o = obj;
	    for (var j = 0; j < parts.length; ++j) {
	      var x = parts[j].split("[");
	      if (x.length > 1) {
	        if (!(x[0] in o)) {
	          o[x[0]] = [];
	        }
	        o = o[x[0]];
	        for (var k = 1; k < x.length; ++k) {
	          var y = parseInt(x[k]);
	          if (k < x.length - 1 || j < parts.length - 1) {
	            if (!(y in o)) {
	              if (k < x.length - 1) {
	                o[y] = [];
	              } else {
	                o[y] = {};
	              }
	            }
	            o = o[y];
	          } else {
	            if (useIndex) {
	              o[y] = i;
	            } else {
	              o[y] = uniforms[i].type;
	            }
	          }
	        }
	      } else if (j < parts.length - 1) {
	        if (!(x[0] in o)) {
	          o[x[0]] = {};
	        }
	        o = o[x[0]];
	      } else {
	        if (useIndex) {
	          o[x[0]] = i;
	        } else {
	          o[x[0]] = uniforms[i].type;
	        }
	      }
	    }
	  }
	  return obj;
	}

/***/ },
/* 26 */
/***/ function(module, exports) {

	'use strict';

	module.exports = createAttributeWrapper;

	function ShaderAttribute(gl, wrapper, index, locations, dimension, constFunc) {
	  this._gl = gl;
	  this._wrapper = wrapper;
	  this._index = index;
	  this._locations = locations;
	  this._dimension = dimension;
	  this._constFunc = constFunc;
	}

	var proto = ShaderAttribute.prototype;

	proto.pointer = function setAttribPointer(type, normalized, stride, offset) {

	  var self = this;
	  var gl = self._gl;
	  var location = self._locations[self._index];

	  gl.vertexAttribPointer(location, self._dimension, type || gl.FLOAT, !!normalized, stride || 0, offset || 0);
	  gl.enableVertexAttribArray(location);
	};

	proto.set = function (x0, x1, x2, x3) {
	  return this._constFunc(this._locations[this._index], x0, x1, x2, x3);
	};

	Object.defineProperty(proto, 'location', {
	  get: function get() {
	    return this._locations[this._index];
	  },
	  set: function set(v) {
	    if (v !== this._locations[this._index]) {
	      this._locations[this._index] = v | 0;
	      this._wrapper.program = null;
	    }
	    return v | 0;
	  }
	});

	//Adds a vector attribute to obj
	function addVectorAttribute(gl, wrapper, index, locations, dimension, obj, name) {

	  //Construct constant function
	  var constFuncArgs = ['gl', 'v'];
	  var varNames = [];
	  for (var i = 0; i < dimension; ++i) {
	    constFuncArgs.push('x' + i);
	    varNames.push('x' + i);
	  }
	  constFuncArgs.push('if(x0.length===void 0){return gl.vertexAttrib' + dimension + 'f(v,' + varNames.join() + ')}else{return gl.vertexAttrib' + dimension + 'fv(v,x0)}');
	  var constFunc = Function.apply(null, constFuncArgs);

	  //Create attribute wrapper
	  var attr = new ShaderAttribute(gl, wrapper, index, locations, dimension, constFunc);

	  //Create accessor
	  Object.defineProperty(obj, name, {
	    set: function set(x) {
	      gl.disableVertexAttribArray(locations[index]);
	      constFunc(gl, locations[index], x);
	      return x;
	    },
	    get: function get() {
	      return attr;
	    },
	    enumerable: true
	  });
	}

	function addMatrixAttribute(gl, wrapper, index, locations, dimension, obj, name) {

	  var parts = new Array(dimension);
	  var attrs = new Array(dimension);
	  for (var i = 0; i < dimension; ++i) {
	    addVectorAttribute(gl, wrapper, index[i], locations, dimension, parts, i);
	    attrs[i] = parts[i];
	  }

	  Object.defineProperty(parts, 'location', {
	    set: function set(v) {
	      if (Array.isArray) {
	        for (var i = 0; i < dimension; ++i) {
	          attrs[i].location = v[i];
	        }
	      } else {
	        for (var i = 0; i < dimension; ++i) {
	          result[i] = attrs[i].location = v + i;
	        }
	      }
	      return v;
	    },
	    get: function get() {
	      var result = new Array(dimension);
	      for (var i = 0; i < dimension; ++i) {
	        result[i] = locations[index[i]];
	      }
	      return result;
	    },
	    enumerable: true
	  });

	  parts.pointer = function (type, normalized, stride, offset) {
	    type = type || gl.FLOAT;
	    normalized = !!normalized;
	    stride = stride || dimension * dimension;
	    offset = offset || 0;
	    for (var i = 0; i < dimension; ++i) {
	      var location = locations[index[i]];
	      gl.vertexAttribPointer(location, dimension, type, normalized, stride, offset + i * dimension);
	      gl.enableVertexAttribArray(location);
	    }
	  };

	  var scratch = new Array(dimension);
	  var vertexAttrib = gl['vertexAttrib' + dimension + 'fv'];

	  Object.defineProperty(obj, name, {
	    set: function set(x) {
	      for (var i = 0; i < dimension; ++i) {
	        var loc = locations[index[i]];
	        gl.disableVertexAttribArray(loc);
	        if (Array.isArray(x[0])) {
	          vertexAttrib.call(gl, loc, x[i]);
	        } else {
	          for (var j = 0; j < dimension; ++j) {
	            scratch[j] = x[dimension * i + j];
	          }
	          vertexAttrib.call(gl, loc, scratch);
	        }
	      }
	      return x;
	    },
	    get: function get() {
	      return parts;
	    },
	    enumerable: true
	  });
	}

	//Create shims for attributes
	function createAttributeWrapper(gl, wrapper, attributes, locations) {

	  var obj = {};
	  for (var i = 0, n = attributes.length; i < n; ++i) {

	    var a = attributes[i];
	    var name = a.name;
	    var type = a.type;
	    var locs = a.locations;

	    switch (type) {
	      case 'bool':
	      case 'int':
	      case 'float':
	        addVectorAttribute(gl, wrapper, locs[0], locations, 1, obj, name);
	        break;

	      default:
	        if (type.indexOf('vec') >= 0) {
	          var d = type.charCodeAt(type.length - 1) - 48;
	          if (d < 2 || d > 4) {
	            throw new Error('gl-shader: Invalid data type for attribute ' + name + ': ' + type);
	          }
	          addVectorAttribute(gl, wrapper, locs[0], locations, d, obj, name);
	        } else if (type.indexOf('mat') >= 0) {
	          var d = type.charCodeAt(type.length - 1) - 48;
	          if (d < 2 || d > 4) {
	            throw new Error('gl-shader: Invalid data type for attribute ' + name + ': ' + type);
	          }
	          addMatrixAttribute(gl, wrapper, locs, locations, d, obj, name);
	        } else {
	          throw new Error('gl-shader: Unknown data type for attribute ' + name + ': ' + type);
	        }
	        break;
	    }
	  }
	  return obj;
	}

/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	exports.shader = getShaderReference;
	exports.program = createProgram;

	var weakMap = typeof WeakMap === 'undefined' ? __webpack_require__(28) : WeakMap;
	var CACHE = new weakMap();

	var SHADER_COUNTER = 0;

	function ShaderReference(id, src, type, shader, programs, count, cache) {
	  this.id = id;
	  this.src = src;
	  this.type = type;
	  this.shader = shader;
	  this.count = count;
	  this.programs = [];
	  this.cache = cache;
	}

	ShaderReference.prototype.dispose = function () {
	  if (--this.count === 0) {
	    var cache = this.cache;
	    var gl = cache.gl;

	    //Remove program references
	    var programs = this.programs;
	    for (var i = 0, n = programs.length; i < n; ++i) {
	      var p = cache.programs[programs[i]];
	      if (p) {
	        delete cache.programs[i];
	        gl.deleteProgram(p);
	      }
	    }

	    //Remove shader reference
	    gl.deleteShader(this.shader);
	    delete cache.shaders[this.type === gl.FRAGMENT_SHADER | 0][this.src];
	  }
	};

	function ContextCache(gl) {
	  this.gl = gl;
	  this.shaders = [{}, {}];
	  this.programs = {};
	}

	var proto = ContextCache.prototype;

	function compileShader(gl, type, src) {
	  var shader = gl.createShader(type);
	  gl.shaderSource(shader, src);
	  gl.compileShader(shader);
	  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
	    var errLog = gl.getShaderInfoLog(shader);
	    console.error('gl-shader: Error compiling shader:', errLog);
	    throw new Error('gl-shader: Error compiling shader:' + errLog);
	  }
	  return shader;
	}

	proto.getShaderReference = function (type, src) {
	  var gl = this.gl;
	  var shaders = this.shaders[type === gl.FRAGMENT_SHADER | 0];
	  var shader = shaders[src];
	  if (!shader || !gl.isShader(shader.shader)) {
	    var shaderObj = compileShader(gl, type, src);
	    shader = shaders[src] = new ShaderReference(SHADER_COUNTER++, src, type, shaderObj, [], 1, this);
	  } else {
	    shader.count += 1;
	  }
	  return shader;
	};

	function linkProgram(gl, vshader, fshader, attribs, locations) {
	  var program = gl.createProgram();
	  gl.attachShader(program, vshader);
	  gl.attachShader(program, fshader);
	  for (var i = 0; i < attribs.length; ++i) {
	    gl.bindAttribLocation(program, locations[i], attribs[i]);
	  }
	  gl.linkProgram(program);
	  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
	    var errLog = gl.getProgramInfoLog(program);
	    console.error('gl-shader: Error linking program:', errLog);
	    throw new Error('gl-shader: Error linking program:' + errLog);
	  }
	  return program;
	}

	proto.getProgram = function (vref, fref, attribs, locations) {
	  var token = [vref.id, fref.id, attribs.join(':'), locations.join(':')].join('@');
	  var prog = this.programs[token];
	  if (!prog || !this.gl.isProgram(prog)) {
	    this.programs[token] = prog = linkProgram(this.gl, vref.shader, fref.shader, attribs, locations);
	    vref.programs.push(token);
	    fref.programs.push(token);
	  }
	  return prog;
	};

	function getCache(gl) {
	  var ctxCache = CACHE.get(gl);
	  if (!ctxCache) {
	    ctxCache = new ContextCache(gl);
	    CACHE.set(gl, ctxCache);
	  }
	  return ctxCache;
	}

	function getShaderReference(gl, type, src) {
	  return getCache(gl).getShaderReference(type, src);
	}

	function createProgram(gl, vref, fref, attribs, locations) {
	  return getCache(gl).getProgram(vref, fref, attribs, locations);
	}

/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	// Original - @Gozola.
	// https://gist.github.com/Gozala/1269991
	// This is a reimplemented version (with a few bug fixes).

	'use strict';

	var createStore = __webpack_require__(29);

	module.exports = weakMap;

	function weakMap() {
	    var privates = createStore();

	    return {
	        'get': function get(key, fallback) {
	            var store = privates(key);
	            return store.hasOwnProperty('value') ? store.value : fallback;
	        },
	        'set': function set(key, value) {
	            privates(key).value = value;
	        },
	        'has': function has(key) {
	            return 'value' in privates(key);
	        },
	        'delete': function _delete(key) {
	            return delete privates(key).value;
	        }
	    };
	}

/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var hiddenStore = __webpack_require__(30);

	module.exports = createStore;

	function createStore() {
	    var key = {};

	    return function (obj) {
	        if ((typeof obj !== 'object' || obj === null) && typeof obj !== 'function') {
	            throw new Error('Weakmap-shim: Key must be object');
	        }

	        var store = obj.valueOf(key);
	        return store && store.identity === key ? store : hiddenStore(obj, key);
	    };
	}

/***/ },
/* 30 */
/***/ function(module, exports) {

	"use strict";

	module.exports = hiddenStore;

	function hiddenStore(obj, key) {
	    var store = { identity: key };
	    var valueOf = obj.valueOf;

	    Object.defineProperty(obj, "valueOf", {
	        value: function value(_value) {
	            return _value !== key ? valueOf.apply(this, arguments) : store;
	        },
	        writable: true
	    });

	    return store;
	}

/***/ },
/* 31 */
/***/ function(module, exports) {

	'use strict';

	exports.uniforms = runtimeUniforms;
	exports.attributes = runtimeAttributes;

	var GL_TO_GLSL_TYPES = {
	  'FLOAT': 'float',
	  'FLOAT_VEC2': 'vec2',
	  'FLOAT_VEC3': 'vec3',
	  'FLOAT_VEC4': 'vec4',
	  'INT': 'int',
	  'INT_VEC2': 'ivec2',
	  'INT_VEC3': 'ivec3',
	  'INT_VEC4': 'ivec4',
	  'BOOL': 'bool',
	  'BOOL_VEC2': 'bvec2',
	  'BOOL_VEC3': 'bvec3',
	  'BOOL_VEC4': 'bvec4',
	  'FLOAT_MAT2': 'mat2',
	  'FLOAT_MAT3': 'mat3',
	  'FLOAT_MAT4': 'mat4',
	  'SAMPLER_2D': 'sampler2D',
	  'SAMPLER_CUBE': 'samplerCube'
	};

	var GL_TABLE = null;

	function getType(gl, type) {
	  if (!GL_TABLE) {
	    var typeNames = Object.keys(GL_TO_GLSL_TYPES);
	    GL_TABLE = {};
	    for (var i = 0; i < typeNames.length; ++i) {
	      var tn = typeNames[i];
	      GL_TABLE[gl[tn]] = GL_TO_GLSL_TYPES[tn];
	    }
	  }
	  return GL_TABLE[type];
	}

	function runtimeUniforms(gl, program) {
	  var numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
	  var result = [];
	  for (var i = 0; i < numUniforms; ++i) {
	    var info = gl.getActiveUniform(program, i);
	    if (info) {
	      var type = getType(gl, info.type);
	      if (info.size > 1) {
	        for (var j = 0; j < info.size; ++j) {
	          result.push({
	            name: info.name.replace('[0]', '[' + j + ']'),
	            type: type
	          });
	        }
	      } else {
	        result.push({
	          name: info.name,
	          type: type
	        });
	      }
	    }
	  }
	  return result;
	}

	function runtimeAttributes(gl, program) {
	  var numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
	  var result = [];
	  for (var i = 0; i < numAttributes; ++i) {
	    var info = gl.getActiveAttrib(program, i);
	    if (info) {
	      result.push({
	        name: info.name,
	        type: getType(gl, info.type)
	      });
	    }
	  }
	  return result;
	}

/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var pool = __webpack_require__(33);
	var ops = __webpack_require__(40);
	var ndarray = __webpack_require__(45);

	var SUPPORTED_TYPES = ["uint8", "uint8_clamped", "uint16", "uint32", "int8", "int16", "int32", "float32"];

	function GLBuffer(gl, type, handle, length, usage) {
	  this.gl = gl;
	  this.type = type;
	  this.handle = handle;
	  this.length = length;
	  this.usage = usage;
	}

	var proto = GLBuffer.prototype;

	proto.bind = function () {
	  this.gl.bindBuffer(this.type, this.handle);
	};

	proto.unbind = function () {
	  this.gl.bindBuffer(this.type, null);
	};

	proto.dispose = function () {
	  this.gl.deleteBuffer(this.handle);
	};

	function updateTypeArray(gl, type, len, usage, data, offset) {
	  var dataLen = data.length * data.BYTES_PER_ELEMENT;
	  if (offset < 0) {
	    gl.bufferData(type, data, usage);
	    return dataLen;
	  }
	  if (dataLen + offset > len) {
	    throw new Error("gl-buffer: If resizing buffer, must not specify offset");
	  }
	  gl.bufferSubData(type, offset, data);
	  return len;
	}

	function makeScratchTypeArray(array, dtype) {
	  var res = pool.malloc(array.length, dtype);
	  var n = array.length;
	  for (var i = 0; i < n; ++i) {
	    res[i] = array[i];
	  }
	  return res;
	}

	function isPacked(shape, stride) {
	  var n = 1;
	  for (var i = stride.length - 1; i >= 0; --i) {
	    if (stride[i] !== n) {
	      return false;
	    }
	    n *= shape[i];
	  }
	  return true;
	}

	proto.update = function (array, offset) {
	  if (typeof offset !== "number") {
	    offset = -1;
	  }
	  this.bind();
	  if (typeof array === "object" && typeof array.shape !== "undefined") {
	    //ndarray
	    var dtype = array.dtype;
	    if (SUPPORTED_TYPES.indexOf(dtype) < 0) {
	      dtype = "float32";
	    }
	    if (this.type === this.gl.ELEMENT_ARRAY_BUFFER) {
	      var ext = gl.getExtension('OES_element_index_uint');
	      if (ext && dtype !== "uint16") {
	        dtype = "uint32";
	      } else {
	        dtype = "uint16";
	      }
	    }
	    if (dtype === array.dtype && isPacked(array.shape, array.stride)) {
	      if (array.offset === 0 && array.data.length === array.shape[0]) {
	        this.length = updateTypeArray(this.gl, this.type, this.length, this.usage, array.data, offset);
	      } else {
	        this.length = updateTypeArray(this.gl, this.type, this.length, this.usage, array.data.subarray(array.offset, array.shape[0]), offset);
	      }
	    } else {
	      var tmp = pool.malloc(array.size, dtype);
	      var ndt = ndarray(tmp, array.shape);
	      ops.assign(ndt, array);
	      if (offset < 0) {
	        this.length = updateTypeArray(this.gl, this.type, this.length, this.usage, tmp, offset);
	      } else {
	        this.length = updateTypeArray(this.gl, this.type, this.length, this.usage, tmp.subarray(0, array.size), offset);
	      }
	      pool.free(tmp);
	    }
	  } else if (Array.isArray(array)) {
	    //Vanilla array
	    var t;
	    if (this.type === this.gl.ELEMENT_ARRAY_BUFFER) {
	      t = makeScratchTypeArray(array, "uint16");
	    } else {
	      t = makeScratchTypeArray(array, "float32");
	    }
	    if (offset < 0) {
	      this.length = updateTypeArray(this.gl, this.type, this.length, this.usage, t, offset);
	    } else {
	      this.length = updateTypeArray(this.gl, this.type, this.length, this.usage, t.subarray(0, array.length), offset);
	    }
	    pool.free(t);
	  } else if (typeof array === "object" && typeof array.length === "number") {
	    //Typed array
	    this.length = updateTypeArray(this.gl, this.type, this.length, this.usage, array, offset);
	  } else if (typeof array === "number" || array === undefined) {
	    //Number/default
	    if (offset >= 0) {
	      throw new Error("gl-buffer: Cannot specify offset when resizing buffer");
	    }
	    array = array | 0;
	    if (array <= 0) {
	      array = 1;
	    }
	    this.gl.bufferData(this.type, array | 0, this.usage);
	    this.length = array;
	  } else {
	    //Error, case should not happen
	    throw new Error("gl-buffer: Invalid data type");
	  }
	};

	function createBuffer(gl, data, type, usage) {
	  type = type || gl.ARRAY_BUFFER;
	  usage = usage || gl.DYNAMIC_DRAW;
	  if (type !== gl.ARRAY_BUFFER && type !== gl.ELEMENT_ARRAY_BUFFER) {
	    throw new Error("gl-buffer: Invalid type for webgl buffer, must be either gl.ARRAY_BUFFER or gl.ELEMENT_ARRAY_BUFFER");
	  }
	  if (usage !== gl.DYNAMIC_DRAW && usage !== gl.STATIC_DRAW && usage !== gl.STREAM_DRAW) {
	    throw new Error("gl-buffer: Invalid usage for buffer, must be either gl.DYNAMIC_DRAW, gl.STATIC_DRAW or gl.STREAM_DRAW");
	  }
	  var handle = gl.createBuffer();
	  var result = new GLBuffer(gl, type, handle, 0, usage);
	  result.update(data);
	  return result;
	}

	module.exports = createBuffer;

/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global, Buffer) {'use strict';

	var bits = __webpack_require__(38);
	var dup = __webpack_require__(39);

	//Legacy pool support
	if (!global.__TYPEDARRAY_POOL) {
	  global.__TYPEDARRAY_POOL = {
	    UINT8: dup([32, 0]),
	    UINT16: dup([32, 0]),
	    UINT32: dup([32, 0]),
	    INT8: dup([32, 0]),
	    INT16: dup([32, 0]),
	    INT32: dup([32, 0]),
	    FLOAT: dup([32, 0]),
	    DOUBLE: dup([32, 0]),
	    DATA: dup([32, 0]),
	    UINT8C: dup([32, 0]),
	    BUFFER: dup([32, 0])
	  };
	}

	var hasUint8C = typeof Uint8ClampedArray !== 'undefined';
	var POOL = global.__TYPEDARRAY_POOL;

	//Upgrade pool
	if (!POOL.UINT8C) {
	  POOL.UINT8C = dup([32, 0]);
	}
	if (!POOL.BUFFER) {
	  POOL.BUFFER = dup([32, 0]);
	}

	//New technique: Only allocate from ArrayBufferView and Buffer
	var DATA = POOL.DATA,
	    BUFFER = POOL.BUFFER;

	exports.free = function free(array) {
	  if (Buffer.isBuffer(array)) {
	    BUFFER[bits.log2(array.length)].push(array);
	  } else {
	    if (Object.prototype.toString.call(array) !== '[object ArrayBuffer]') {
	      array = array.buffer;
	    }
	    if (!array) {
	      return;
	    }
	    var n = array.length || array.byteLength;
	    var log_n = bits.log2(n) | 0;
	    DATA[log_n].push(array);
	  }
	};

	function freeArrayBuffer(buffer) {
	  if (!buffer) {
	    return;
	  }
	  var n = buffer.length || buffer.byteLength;
	  var log_n = bits.log2(n);
	  DATA[log_n].push(buffer);
	}

	function freeTypedArray(array) {
	  freeArrayBuffer(array.buffer);
	}

	exports.freeUint8 = exports.freeUint16 = exports.freeUint32 = exports.freeInt8 = exports.freeInt16 = exports.freeInt32 = exports.freeFloat32 = exports.freeFloat = exports.freeFloat64 = exports.freeDouble = exports.freeUint8Clamped = exports.freeDataView = freeTypedArray;

	exports.freeArrayBuffer = freeArrayBuffer;

	exports.freeBuffer = function freeBuffer(array) {
	  BUFFER[bits.log2(array.length)].push(array);
	};

	exports.malloc = function malloc(n, dtype) {
	  if (dtype === undefined || dtype === 'arraybuffer') {
	    return mallocArrayBuffer(n);
	  } else {
	    switch (dtype) {
	      case 'uint8':
	        return mallocUint8(n);
	      case 'uint16':
	        return mallocUint16(n);
	      case 'uint32':
	        return mallocUint32(n);
	      case 'int8':
	        return mallocInt8(n);
	      case 'int16':
	        return mallocInt16(n);
	      case 'int32':
	        return mallocInt32(n);
	      case 'float':
	      case 'float32':
	        return mallocFloat(n);
	      case 'double':
	      case 'float64':
	        return mallocDouble(n);
	      case 'uint8_clamped':
	        return mallocUint8Clamped(n);
	      case 'buffer':
	        return mallocBuffer(n);
	      case 'data':
	      case 'dataview':
	        return mallocDataView(n);

	      default:
	        return null;
	    }
	  }
	  return null;
	};

	function mallocArrayBuffer(n) {
	  var n = bits.nextPow2(n);
	  var log_n = bits.log2(n);
	  var d = DATA[log_n];
	  if (d.length > 0) {
	    return d.pop();
	  }
	  return new ArrayBuffer(n);
	}
	exports.mallocArrayBuffer = mallocArrayBuffer;

	function mallocUint8(n) {
	  return new Uint8Array(mallocArrayBuffer(n), 0, n);
	}
	exports.mallocUint8 = mallocUint8;

	function mallocUint16(n) {
	  return new Uint16Array(mallocArrayBuffer(2 * n), 0, n);
	}
	exports.mallocUint16 = mallocUint16;

	function mallocUint32(n) {
	  return new Uint32Array(mallocArrayBuffer(4 * n), 0, n);
	}
	exports.mallocUint32 = mallocUint32;

	function mallocInt8(n) {
	  return new Int8Array(mallocArrayBuffer(n), 0, n);
	}
	exports.mallocInt8 = mallocInt8;

	function mallocInt16(n) {
	  return new Int16Array(mallocArrayBuffer(2 * n), 0, n);
	}
	exports.mallocInt16 = mallocInt16;

	function mallocInt32(n) {
	  return new Int32Array(mallocArrayBuffer(4 * n), 0, n);
	}
	exports.mallocInt32 = mallocInt32;

	function mallocFloat(n) {
	  return new Float32Array(mallocArrayBuffer(4 * n), 0, n);
	}
	exports.mallocFloat32 = exports.mallocFloat = mallocFloat;

	function mallocDouble(n) {
	  return new Float64Array(mallocArrayBuffer(8 * n), 0, n);
	}
	exports.mallocFloat64 = exports.mallocDouble = mallocDouble;

	function mallocUint8Clamped(n) {
	  if (hasUint8C) {
	    return new Uint8ClampedArray(mallocArrayBuffer(n), 0, n);
	  } else {
	    return mallocUint8(n);
	  }
	}
	exports.mallocUint8Clamped = mallocUint8Clamped;

	function mallocDataView(n) {
	  return new DataView(mallocArrayBuffer(n), 0, n);
	}
	exports.mallocDataView = mallocDataView;

	function mallocBuffer(n) {
	  n = bits.nextPow2(n);
	  var log_n = bits.log2(n);
	  var cache = BUFFER[log_n];
	  if (cache.length > 0) {
	    return cache.pop();
	  }
	  return new Buffer(n);
	}
	exports.mallocBuffer = mallocBuffer;

	exports.clearCache = function clearCache() {
	  for (var i = 0; i < 32; ++i) {
	    POOL.UINT8[i].length = 0;
	    POOL.UINT16[i].length = 0;
	    POOL.UINT32[i].length = 0;
	    POOL.INT8[i].length = 0;
	    POOL.INT16[i].length = 0;
	    POOL.INT32[i].length = 0;
	    POOL.FLOAT[i].length = 0;
	    POOL.DOUBLE[i].length = 0;
	    POOL.UINT8C[i].length = 0;
	    DATA[i].length = 0;
	    BUFFER[i].length = 0;
	  }
	};
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(34).Buffer))

/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {/*!
	 * The buffer module from node.js, for the browser.
	 *
	 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
	 * @license  MIT
	 */

	'use strict';

	var base64 = __webpack_require__(35);
	var ieee754 = __webpack_require__(36);
	var isArray = __webpack_require__(37);

	exports.Buffer = Buffer;
	exports.SlowBuffer = SlowBuffer;
	exports.INSPECT_MAX_BYTES = 50;
	Buffer.poolSize = 8192; // not used by this implementation

	var rootParent = {};

	/**
	 * If `Buffer.TYPED_ARRAY_SUPPORT`:
	 *   === true    Use Uint8Array implementation (fastest)
	 *   === false   Use Object implementation (most compatible, even IE6)
	 *
	 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
	 * Opera 11.6+, iOS 4.2+.
	 *
	 * Due to various browser bugs, sometimes the Object implementation will be used even
	 * when the browser supports typed arrays.
	 *
	 * Note:
	 *
	 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
	 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
	 *
	 *   - Safari 5-7 lacks support for changing the `Object.prototype.constructor` property
	 *     on objects.
	 *
	 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
	 *
	 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
	 *     incorrect length in some situations.

	 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
	 * get the Object implementation, which is slower but behaves correctly.
	 */
	Buffer.TYPED_ARRAY_SUPPORT = (function () {
	  function Bar() {}
	  try {
	    var arr = new Uint8Array(1);
	    arr.foo = function () {
	      return 42;
	    };
	    arr.constructor = Bar;
	    return arr.foo() === 42 && // typed array instances can be augmented
	    arr.constructor === Bar && // constructor can be set
	    typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
	    arr.subarray(1, 1).byteLength === 0; // ie10 has broken `subarray`
	  } catch (e) {
	    return false;
	  }
	})();

	function kMaxLength() {
	  return Buffer.TYPED_ARRAY_SUPPORT ? 0x7fffffff : 0x3fffffff;
	}

	/**
	 * Class: Buffer
	 * =============
	 *
	 * The Buffer constructor returns instances of `Uint8Array` that are augmented
	 * with function properties for all the node `Buffer` API functions. We use
	 * `Uint8Array` so that square bracket notation works as expected -- it returns
	 * a single octet.
	 *
	 * By augmenting the instances, we can avoid modifying the `Uint8Array`
	 * prototype.
	 */
	function Buffer(arg) {
	  if (!(this instanceof Buffer)) {
	    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
	    if (arguments.length > 1) return new Buffer(arg, arguments[1]);
	    return new Buffer(arg);
	  }

	  this.length = 0;
	  this.parent = undefined;

	  // Common case.
	  if (typeof arg === 'number') {
	    return fromNumber(this, arg);
	  }

	  // Slightly less common case.
	  if (typeof arg === 'string') {
	    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8');
	  }

	  // Unusual.
	  return fromObject(this, arg);
	}

	function fromNumber(that, length) {
	  that = allocate(that, length < 0 ? 0 : checked(length) | 0);
	  if (!Buffer.TYPED_ARRAY_SUPPORT) {
	    for (var i = 0; i < length; i++) {
	      that[i] = 0;
	    }
	  }
	  return that;
	}

	function fromString(that, string, encoding) {
	  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8';

	  // Assumption: byteLength() return value is always < kMaxLength.
	  var length = byteLength(string, encoding) | 0;
	  that = allocate(that, length);

	  that.write(string, encoding);
	  return that;
	}

	function fromObject(that, object) {
	  if (Buffer.isBuffer(object)) return fromBuffer(that, object);

	  if (isArray(object)) return fromArray(that, object);

	  if (object == null) {
	    throw new TypeError('must start with number, buffer, array or string');
	  }

	  if (typeof ArrayBuffer !== 'undefined') {
	    if (object.buffer instanceof ArrayBuffer) {
	      return fromTypedArray(that, object);
	    }
	    if (object instanceof ArrayBuffer) {
	      return fromArrayBuffer(that, object);
	    }
	  }

	  if (object.length) return fromArrayLike(that, object);

	  return fromJsonObject(that, object);
	}

	function fromBuffer(that, buffer) {
	  var length = checked(buffer.length) | 0;
	  that = allocate(that, length);
	  buffer.copy(that, 0, 0, length);
	  return that;
	}

	function fromArray(that, array) {
	  var length = checked(array.length) | 0;
	  that = allocate(that, length);
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255;
	  }
	  return that;
	}

	// Duplicate of fromArray() to keep fromArray() monomorphic.
	function fromTypedArray(that, array) {
	  var length = checked(array.length) | 0;
	  that = allocate(that, length);
	  // Truncating the elements is probably not what people expect from typed
	  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
	  // of the old Buffer constructor.
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255;
	  }
	  return that;
	}

	function fromArrayBuffer(that, array) {
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    array.byteLength;
	    that = Buffer._augment(new Uint8Array(array));
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    that = fromTypedArray(that, new Uint8Array(array));
	  }
	  return that;
	}

	function fromArrayLike(that, array) {
	  var length = checked(array.length) | 0;
	  that = allocate(that, length);
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255;
	  }
	  return that;
	}

	// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
	// Returns a zero-length buffer for inputs that don't conform to the spec.
	function fromJsonObject(that, object) {
	  var array;
	  var length = 0;

	  if (object.type === 'Buffer' && isArray(object.data)) {
	    array = object.data;
	    length = checked(array.length) | 0;
	  }
	  that = allocate(that, length);

	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255;
	  }
	  return that;
	}

	function allocate(that, length) {
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    that = Buffer._augment(new Uint8Array(length));
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    that.length = length;
	    that._isBuffer = true;
	  }

	  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1;
	  if (fromPool) that.parent = rootParent;

	  return that;
	}

	function checked(length) {
	  // Note: cannot use `length < kMaxLength` here because that fails when
	  // length is NaN (which is otherwise coerced to zero.)
	  if (length >= kMaxLength()) {
	    throw new RangeError('Attempt to allocate Buffer larger than maximum ' + 'size: 0x' + kMaxLength().toString(16) + ' bytes');
	  }
	  return length | 0;
	}

	function SlowBuffer(subject, encoding) {
	  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding);

	  var buf = new Buffer(subject, encoding);
	  delete buf.parent;
	  return buf;
	}

	Buffer.isBuffer = function isBuffer(b) {
	  return !!(b != null && b._isBuffer);
	};

	Buffer.compare = function compare(a, b) {
	  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
	    throw new TypeError('Arguments must be Buffers');
	  }

	  if (a === b) return 0;

	  var x = a.length;
	  var y = b.length;

	  var i = 0;
	  var len = Math.min(x, y);
	  while (i < len) {
	    if (a[i] !== b[i]) break;

	    ++i;
	  }

	  if (i !== len) {
	    x = a[i];
	    y = b[i];
	  }

	  if (x < y) return -1;
	  if (y < x) return 1;
	  return 0;
	};

	Buffer.isEncoding = function isEncoding(encoding) {
	  switch (String(encoding).toLowerCase()) {
	    case 'hex':
	    case 'utf8':
	    case 'utf-8':
	    case 'ascii':
	    case 'binary':
	    case 'base64':
	    case 'raw':
	    case 'ucs2':
	    case 'ucs-2':
	    case 'utf16le':
	    case 'utf-16le':
	      return true;
	    default:
	      return false;
	  }
	};

	Buffer.concat = function concat(list, length) {
	  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.');

	  if (list.length === 0) {
	    return new Buffer(0);
	  }

	  var i;
	  if (length === undefined) {
	    length = 0;
	    for (i = 0; i < list.length; i++) {
	      length += list[i].length;
	    }
	  }

	  var buf = new Buffer(length);
	  var pos = 0;
	  for (i = 0; i < list.length; i++) {
	    var item = list[i];
	    item.copy(buf, pos);
	    pos += item.length;
	  }
	  return buf;
	};

	function byteLength(string, encoding) {
	  if (typeof string !== 'string') string = '' + string;

	  var len = string.length;
	  if (len === 0) return 0;

	  // Use a for loop to avoid recursion
	  var loweredCase = false;
	  for (;;) {
	    switch (encoding) {
	      case 'ascii':
	      case 'binary':
	      // Deprecated
	      case 'raw':
	      case 'raws':
	        return len;
	      case 'utf8':
	      case 'utf-8':
	        return utf8ToBytes(string).length;
	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return len * 2;
	      case 'hex':
	        return len >>> 1;
	      case 'base64':
	        return base64ToBytes(string).length;
	      default:
	        if (loweredCase) return utf8ToBytes(string).length; // assume utf8
	        encoding = ('' + encoding).toLowerCase();
	        loweredCase = true;
	    }
	  }
	}
	Buffer.byteLength = byteLength;

	// pre-set for values that may exist in the future
	Buffer.prototype.length = undefined;
	Buffer.prototype.parent = undefined;

	function slowToString(encoding, start, end) {
	  var loweredCase = false;

	  start = start | 0;
	  end = end === undefined || end === Infinity ? this.length : end | 0;

	  if (!encoding) encoding = 'utf8';
	  if (start < 0) start = 0;
	  if (end > this.length) end = this.length;
	  if (end <= start) return '';

	  while (true) {
	    switch (encoding) {
	      case 'hex':
	        return hexSlice(this, start, end);

	      case 'utf8':
	      case 'utf-8':
	        return utf8Slice(this, start, end);

	      case 'ascii':
	        return asciiSlice(this, start, end);

	      case 'binary':
	        return binarySlice(this, start, end);

	      case 'base64':
	        return base64Slice(this, start, end);

	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return utf16leSlice(this, start, end);

	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
	        encoding = (encoding + '').toLowerCase();
	        loweredCase = true;
	    }
	  }
	}

	Buffer.prototype.toString = function toString() {
	  var length = this.length | 0;
	  if (length === 0) return '';
	  if (arguments.length === 0) return utf8Slice(this, 0, length);
	  return slowToString.apply(this, arguments);
	};

	Buffer.prototype.equals = function equals(b) {
	  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer');
	  if (this === b) return true;
	  return Buffer.compare(this, b) === 0;
	};

	Buffer.prototype.inspect = function inspect() {
	  var str = '';
	  var max = exports.INSPECT_MAX_BYTES;
	  if (this.length > 0) {
	    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ');
	    if (this.length > max) str += ' ... ';
	  }
	  return '<Buffer ' + str + '>';
	};

	Buffer.prototype.compare = function compare(b) {
	  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer');
	  if (this === b) return 0;
	  return Buffer.compare(this, b);
	};

	Buffer.prototype.indexOf = function indexOf(val, byteOffset) {
	  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff;else if (byteOffset < -0x80000000) byteOffset = -0x80000000;
	  byteOffset >>= 0;

	  if (this.length === 0) return -1;
	  if (byteOffset >= this.length) return -1;

	  // Negative offsets start from the end of the buffer
	  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0);

	  if (typeof val === 'string') {
	    if (val.length === 0) return -1; // special case: looking for empty string always fails
	    return String.prototype.indexOf.call(this, val, byteOffset);
	  }
	  if (Buffer.isBuffer(val)) {
	    return arrayIndexOf(this, val, byteOffset);
	  }
	  if (typeof val === 'number') {
	    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
	      return Uint8Array.prototype.indexOf.call(this, val, byteOffset);
	    }
	    return arrayIndexOf(this, [val], byteOffset);
	  }

	  function arrayIndexOf(arr, val, byteOffset) {
	    var foundIndex = -1;
	    for (var i = 0; byteOffset + i < arr.length; i++) {
	      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
	        if (foundIndex === -1) foundIndex = i;
	        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex;
	      } else {
	        foundIndex = -1;
	      }
	    }
	    return -1;
	  }

	  throw new TypeError('val must be string, number or Buffer');
	};

	// `get` is deprecated
	Buffer.prototype.get = function get(offset) {
	  console.log('.get() is deprecated. Access using array indexes instead.');
	  return this.readUInt8(offset);
	};

	// `set` is deprecated
	Buffer.prototype.set = function set(v, offset) {
	  console.log('.set() is deprecated. Access using array indexes instead.');
	  return this.writeUInt8(v, offset);
	};

	function hexWrite(buf, string, offset, length) {
	  offset = Number(offset) || 0;
	  var remaining = buf.length - offset;
	  if (!length) {
	    length = remaining;
	  } else {
	    length = Number(length);
	    if (length > remaining) {
	      length = remaining;
	    }
	  }

	  // must be an even number of digits
	  var strLen = string.length;
	  if (strLen % 2 !== 0) throw new Error('Invalid hex string');

	  if (length > strLen / 2) {
	    length = strLen / 2;
	  }
	  for (var i = 0; i < length; i++) {
	    var parsed = parseInt(string.substr(i * 2, 2), 16);
	    if (isNaN(parsed)) throw new Error('Invalid hex string');
	    buf[offset + i] = parsed;
	  }
	  return i;
	}

	function utf8Write(buf, string, offset, length) {
	  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
	}

	function asciiWrite(buf, string, offset, length) {
	  return blitBuffer(asciiToBytes(string), buf, offset, length);
	}

	function binaryWrite(buf, string, offset, length) {
	  return asciiWrite(buf, string, offset, length);
	}

	function base64Write(buf, string, offset, length) {
	  return blitBuffer(base64ToBytes(string), buf, offset, length);
	}

	function ucs2Write(buf, string, offset, length) {
	  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
	}

	Buffer.prototype.write = function write(string, offset, length, encoding) {
	  // Buffer#write(string)
	  if (offset === undefined) {
	    encoding = 'utf8';
	    length = this.length;
	    offset = 0;
	    // Buffer#write(string, encoding)
	  } else if (length === undefined && typeof offset === 'string') {
	      encoding = offset;
	      length = this.length;
	      offset = 0;
	      // Buffer#write(string, offset[, length][, encoding])
	    } else if (isFinite(offset)) {
	        offset = offset | 0;
	        if (isFinite(length)) {
	          length = length | 0;
	          if (encoding === undefined) encoding = 'utf8';
	        } else {
	          encoding = length;
	          length = undefined;
	        }
	        // legacy write(string, encoding, offset, length) - remove in v0.13
	      } else {
	          var swap = encoding;
	          encoding = offset;
	          offset = length | 0;
	          length = swap;
	        }

	  var remaining = this.length - offset;
	  if (length === undefined || length > remaining) length = remaining;

	  if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) {
	    throw new RangeError('attempt to write outside buffer bounds');
	  }

	  if (!encoding) encoding = 'utf8';

	  var loweredCase = false;
	  for (;;) {
	    switch (encoding) {
	      case 'hex':
	        return hexWrite(this, string, offset, length);

	      case 'utf8':
	      case 'utf-8':
	        return utf8Write(this, string, offset, length);

	      case 'ascii':
	        return asciiWrite(this, string, offset, length);

	      case 'binary':
	        return binaryWrite(this, string, offset, length);

	      case 'base64':
	        // Warning: maxLength not taken into account in base64Write
	        return base64Write(this, string, offset, length);

	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return ucs2Write(this, string, offset, length);

	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
	        encoding = ('' + encoding).toLowerCase();
	        loweredCase = true;
	    }
	  }
	};

	Buffer.prototype.toJSON = function toJSON() {
	  return {
	    type: 'Buffer',
	    data: Array.prototype.slice.call(this._arr || this, 0)
	  };
	};

	function base64Slice(buf, start, end) {
	  if (start === 0 && end === buf.length) {
	    return base64.fromByteArray(buf);
	  } else {
	    return base64.fromByteArray(buf.slice(start, end));
	  }
	}

	function utf8Slice(buf, start, end) {
	  end = Math.min(buf.length, end);
	  var res = [];

	  var i = start;
	  while (i < end) {
	    var firstByte = buf[i];
	    var codePoint = null;
	    var bytesPerSequence = firstByte > 0xEF ? 4 : firstByte > 0xDF ? 3 : firstByte > 0xBF ? 2 : 1;

	    if (i + bytesPerSequence <= end) {
	      var secondByte, thirdByte, fourthByte, tempCodePoint;

	      switch (bytesPerSequence) {
	        case 1:
	          if (firstByte < 0x80) {
	            codePoint = firstByte;
	          }
	          break;
	        case 2:
	          secondByte = buf[i + 1];
	          if ((secondByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0x1F) << 0x6 | secondByte & 0x3F;
	            if (tempCodePoint > 0x7F) {
	              codePoint = tempCodePoint;
	            }
	          }
	          break;
	        case 3:
	          secondByte = buf[i + 1];
	          thirdByte = buf[i + 2];
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | thirdByte & 0x3F;
	            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
	              codePoint = tempCodePoint;
	            }
	          }
	          break;
	        case 4:
	          secondByte = buf[i + 1];
	          thirdByte = buf[i + 2];
	          fourthByte = buf[i + 3];
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | fourthByte & 0x3F;
	            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
	              codePoint = tempCodePoint;
	            }
	          }
	      }
	    }

	    if (codePoint === null) {
	      // we did not generate a valid codePoint so insert a
	      // replacement char (U+FFFD) and advance only 1 byte
	      codePoint = 0xFFFD;
	      bytesPerSequence = 1;
	    } else if (codePoint > 0xFFFF) {
	      // encode to utf16 (surrogate pair dance)
	      codePoint -= 0x10000;
	      res.push(codePoint >>> 10 & 0x3FF | 0xD800);
	      codePoint = 0xDC00 | codePoint & 0x3FF;
	    }

	    res.push(codePoint);
	    i += bytesPerSequence;
	  }

	  return decodeCodePointsArray(res);
	}

	// Based on http://stackoverflow.com/a/22747272/680742, the browser with
	// the lowest limit is Chrome, with 0x10000 args.
	// We go 1 magnitude less, for safety
	var MAX_ARGUMENTS_LENGTH = 0x1000;

	function decodeCodePointsArray(codePoints) {
	  var len = codePoints.length;
	  if (len <= MAX_ARGUMENTS_LENGTH) {
	    return String.fromCharCode.apply(String, codePoints); // avoid extra slice()
	  }

	  // Decode in chunks to avoid "call stack size exceeded".
	  var res = '';
	  var i = 0;
	  while (i < len) {
	    res += String.fromCharCode.apply(String, codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH));
	  }
	  return res;
	}

	function asciiSlice(buf, start, end) {
	  var ret = '';
	  end = Math.min(buf.length, end);

	  for (var i = start; i < end; i++) {
	    ret += String.fromCharCode(buf[i] & 0x7F);
	  }
	  return ret;
	}

	function binarySlice(buf, start, end) {
	  var ret = '';
	  end = Math.min(buf.length, end);

	  for (var i = start; i < end; i++) {
	    ret += String.fromCharCode(buf[i]);
	  }
	  return ret;
	}

	function hexSlice(buf, start, end) {
	  var len = buf.length;

	  if (!start || start < 0) start = 0;
	  if (!end || end < 0 || end > len) end = len;

	  var out = '';
	  for (var i = start; i < end; i++) {
	    out += toHex(buf[i]);
	  }
	  return out;
	}

	function utf16leSlice(buf, start, end) {
	  var bytes = buf.slice(start, end);
	  var res = '';
	  for (var i = 0; i < bytes.length; i += 2) {
	    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
	  }
	  return res;
	}

	Buffer.prototype.slice = function slice(start, end) {
	  var len = this.length;
	  start = ~ ~start;
	  end = end === undefined ? len : ~ ~end;

	  if (start < 0) {
	    start += len;
	    if (start < 0) start = 0;
	  } else if (start > len) {
	    start = len;
	  }

	  if (end < 0) {
	    end += len;
	    if (end < 0) end = 0;
	  } else if (end > len) {
	    end = len;
	  }

	  if (end < start) end = start;

	  var newBuf;
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    newBuf = Buffer._augment(this.subarray(start, end));
	  } else {
	    var sliceLen = end - start;
	    newBuf = new Buffer(sliceLen, undefined);
	    for (var i = 0; i < sliceLen; i++) {
	      newBuf[i] = this[i + start];
	    }
	  }

	  if (newBuf.length) newBuf.parent = this.parent || this;

	  return newBuf;
	};

	/*
	 * Need to make sure that buffer isn't trying to write out of bounds.
	 */
	function checkOffset(offset, ext, length) {
	  if (offset % 1 !== 0 || offset < 0) throw new RangeError('offset is not uint');
	  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length');
	}

	Buffer.prototype.readUIntLE = function readUIntLE(offset, byteLength, noAssert) {
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) checkOffset(offset, byteLength, this.length);

	  var val = this[offset];
	  var mul = 1;
	  var i = 0;
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul;
	  }

	  return val;
	};

	Buffer.prototype.readUIntBE = function readUIntBE(offset, byteLength, noAssert) {
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) {
	    checkOffset(offset, byteLength, this.length);
	  }

	  var val = this[offset + --byteLength];
	  var mul = 1;
	  while (byteLength > 0 && (mul *= 0x100)) {
	    val += this[offset + --byteLength] * mul;
	  }

	  return val;
	};

	Buffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length);
	  return this[offset];
	};

	Buffer.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length);
	  return this[offset] | this[offset + 1] << 8;
	};

	Buffer.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length);
	  return this[offset] << 8 | this[offset + 1];
	};

	Buffer.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);

	  return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 0x1000000;
	};

	Buffer.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);

	  return this[offset] * 0x1000000 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
	};

	Buffer.prototype.readIntLE = function readIntLE(offset, byteLength, noAssert) {
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) checkOffset(offset, byteLength, this.length);

	  var val = this[offset];
	  var mul = 1;
	  var i = 0;
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul;
	  }
	  mul *= 0x80;

	  if (val >= mul) val -= Math.pow(2, 8 * byteLength);

	  return val;
	};

	Buffer.prototype.readIntBE = function readIntBE(offset, byteLength, noAssert) {
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) checkOffset(offset, byteLength, this.length);

	  var i = byteLength;
	  var mul = 1;
	  var val = this[offset + --i];
	  while (i > 0 && (mul *= 0x100)) {
	    val += this[offset + --i] * mul;
	  }
	  mul *= 0x80;

	  if (val >= mul) val -= Math.pow(2, 8 * byteLength);

	  return val;
	};

	Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length);
	  if (!(this[offset] & 0x80)) return this[offset];
	  return (0xff - this[offset] + 1) * -1;
	};

	Buffer.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length);
	  var val = this[offset] | this[offset + 1] << 8;
	  return val & 0x8000 ? val | 0xFFFF0000 : val;
	};

	Buffer.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length);
	  var val = this[offset + 1] | this[offset] << 8;
	  return val & 0x8000 ? val | 0xFFFF0000 : val;
	};

	Buffer.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);

	  return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
	};

	Buffer.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);

	  return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
	};

	Buffer.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);
	  return ieee754.read(this, offset, true, 23, 4);
	};

	Buffer.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);
	  return ieee754.read(this, offset, false, 23, 4);
	};

	Buffer.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length);
	  return ieee754.read(this, offset, true, 52, 8);
	};

	Buffer.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length);
	  return ieee754.read(this, offset, false, 52, 8);
	};

	function checkInt(buf, value, offset, ext, max, min) {
	  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance');
	  if (value > max || value < min) throw new RangeError('value is out of bounds');
	  if (offset + ext > buf.length) throw new RangeError('index out of range');
	}

	Buffer.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0);

	  var mul = 1;
	  var i = 0;
	  this[offset] = value & 0xFF;
	  while (++i < byteLength && (mul *= 0x100)) {
	    this[offset + i] = value / mul & 0xFF;
	  }

	  return offset + byteLength;
	};

	Buffer.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0);

	  var i = byteLength - 1;
	  var mul = 1;
	  this[offset + i] = value & 0xFF;
	  while (--i >= 0 && (mul *= 0x100)) {
	    this[offset + i] = value / mul & 0xFF;
	  }

	  return offset + byteLength;
	};

	Buffer.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
	  this[offset] = value;
	  return offset + 1;
	};

	function objectWriteUInt16(buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffff + value + 1;
	  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
	    buf[offset + i] = (value & 0xff << 8 * (littleEndian ? i : 1 - i)) >>> (littleEndian ? i : 1 - i) * 8;
	  }
	}

	Buffer.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = value;
	    this[offset + 1] = value >>> 8;
	  } else {
	    objectWriteUInt16(this, value, offset, true);
	  }
	  return offset + 2;
	};

	Buffer.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = value >>> 8;
	    this[offset + 1] = value;
	  } else {
	    objectWriteUInt16(this, value, offset, false);
	  }
	  return offset + 2;
	};

	function objectWriteUInt32(buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffffffff + value + 1;
	  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
	    buf[offset + i] = value >>> (littleEndian ? i : 3 - i) * 8 & 0xff;
	  }
	}

	Buffer.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset + 3] = value >>> 24;
	    this[offset + 2] = value >>> 16;
	    this[offset + 1] = value >>> 8;
	    this[offset] = value;
	  } else {
	    objectWriteUInt32(this, value, offset, true);
	  }
	  return offset + 4;
	};

	Buffer.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = value >>> 24;
	    this[offset + 1] = value >>> 16;
	    this[offset + 2] = value >>> 8;
	    this[offset + 3] = value;
	  } else {
	    objectWriteUInt32(this, value, offset, false);
	  }
	  return offset + 4;
	};

	Buffer.prototype.writeIntLE = function writeIntLE(value, offset, byteLength, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1);

	    checkInt(this, value, offset, byteLength, limit - 1, -limit);
	  }

	  var i = 0;
	  var mul = 1;
	  var sub = value < 0 ? 1 : 0;
	  this[offset] = value & 0xFF;
	  while (++i < byteLength && (mul *= 0x100)) {
	    this[offset + i] = (value / mul >> 0) - sub & 0xFF;
	  }

	  return offset + byteLength;
	};

	Buffer.prototype.writeIntBE = function writeIntBE(value, offset, byteLength, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1);

	    checkInt(this, value, offset, byteLength, limit - 1, -limit);
	  }

	  var i = byteLength - 1;
	  var mul = 1;
	  var sub = value < 0 ? 1 : 0;
	  this[offset + i] = value & 0xFF;
	  while (--i >= 0 && (mul *= 0x100)) {
	    this[offset + i] = (value / mul >> 0) - sub & 0xFF;
	  }

	  return offset + byteLength;
	};

	Buffer.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
	  if (value < 0) value = 0xff + value + 1;
	  this[offset] = value;
	  return offset + 1;
	};

	Buffer.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = value;
	    this[offset + 1] = value >>> 8;
	  } else {
	    objectWriteUInt16(this, value, offset, true);
	  }
	  return offset + 2;
	};

	Buffer.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = value >>> 8;
	    this[offset + 1] = value;
	  } else {
	    objectWriteUInt16(this, value, offset, false);
	  }
	  return offset + 2;
	};

	Buffer.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = value;
	    this[offset + 1] = value >>> 8;
	    this[offset + 2] = value >>> 16;
	    this[offset + 3] = value >>> 24;
	  } else {
	    objectWriteUInt32(this, value, offset, true);
	  }
	  return offset + 4;
	};

	Buffer.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
	  if (value < 0) value = 0xffffffff + value + 1;
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = value >>> 24;
	    this[offset + 1] = value >>> 16;
	    this[offset + 2] = value >>> 8;
	    this[offset + 3] = value;
	  } else {
	    objectWriteUInt32(this, value, offset, false);
	  }
	  return offset + 4;
	};

	function checkIEEE754(buf, value, offset, ext, max, min) {
	  if (value > max || value < min) throw new RangeError('value is out of bounds');
	  if (offset + ext > buf.length) throw new RangeError('index out of range');
	  if (offset < 0) throw new RangeError('index out of range');
	}

	function writeFloat(buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38);
	  }
	  ieee754.write(buf, value, offset, littleEndian, 23, 4);
	  return offset + 4;
	}

	Buffer.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
	  return writeFloat(this, value, offset, true, noAssert);
	};

	Buffer.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
	  return writeFloat(this, value, offset, false, noAssert);
	};

	function writeDouble(buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308);
	  }
	  ieee754.write(buf, value, offset, littleEndian, 52, 8);
	  return offset + 8;
	}

	Buffer.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
	  return writeDouble(this, value, offset, true, noAssert);
	};

	Buffer.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
	  return writeDouble(this, value, offset, false, noAssert);
	};

	// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
	Buffer.prototype.copy = function copy(target, targetStart, start, end) {
	  if (!start) start = 0;
	  if (!end && end !== 0) end = this.length;
	  if (targetStart >= target.length) targetStart = target.length;
	  if (!targetStart) targetStart = 0;
	  if (end > 0 && end < start) end = start;

	  // Copy 0 bytes; we're done
	  if (end === start) return 0;
	  if (target.length === 0 || this.length === 0) return 0;

	  // Fatal error conditions
	  if (targetStart < 0) {
	    throw new RangeError('targetStart out of bounds');
	  }
	  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds');
	  if (end < 0) throw new RangeError('sourceEnd out of bounds');

	  // Are we oob?
	  if (end > this.length) end = this.length;
	  if (target.length - targetStart < end - start) {
	    end = target.length - targetStart + start;
	  }

	  var len = end - start;
	  var i;

	  if (this === target && start < targetStart && targetStart < end) {
	    // descending copy from end
	    for (i = len - 1; i >= 0; i--) {
	      target[i + targetStart] = this[i + start];
	    }
	  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
	    // ascending copy from start
	    for (i = 0; i < len; i++) {
	      target[i + targetStart] = this[i + start];
	    }
	  } else {
	    target._set(this.subarray(start, start + len), targetStart);
	  }

	  return len;
	};

	// fill(value, start=0, end=buffer.length)
	Buffer.prototype.fill = function fill(value, start, end) {
	  if (!value) value = 0;
	  if (!start) start = 0;
	  if (!end) end = this.length;

	  if (end < start) throw new RangeError('end < start');

	  // Fill 0 bytes; we're done
	  if (end === start) return;
	  if (this.length === 0) return;

	  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds');
	  if (end < 0 || end > this.length) throw new RangeError('end out of bounds');

	  var i;
	  if (typeof value === 'number') {
	    for (i = start; i < end; i++) {
	      this[i] = value;
	    }
	  } else {
	    var bytes = utf8ToBytes(value.toString());
	    var len = bytes.length;
	    for (i = start; i < end; i++) {
	      this[i] = bytes[i % len];
	    }
	  }

	  return this;
	};

	/**
	 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
	 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
	 */
	Buffer.prototype.toArrayBuffer = function toArrayBuffer() {
	  if (typeof Uint8Array !== 'undefined') {
	    if (Buffer.TYPED_ARRAY_SUPPORT) {
	      return new Buffer(this).buffer;
	    } else {
	      var buf = new Uint8Array(this.length);
	      for (var i = 0, len = buf.length; i < len; i += 1) {
	        buf[i] = this[i];
	      }
	      return buf.buffer;
	    }
	  } else {
	    throw new TypeError('Buffer.toArrayBuffer not supported in this browser');
	  }
	};

	// HELPER FUNCTIONS
	// ================

	var BP = Buffer.prototype;

	/**
	 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
	 */
	Buffer._augment = function _augment(arr) {
	  arr.constructor = Buffer;
	  arr._isBuffer = true;

	  // save reference to original Uint8Array set method before overwriting
	  arr._set = arr.set;

	  // deprecated
	  arr.get = BP.get;
	  arr.set = BP.set;

	  arr.write = BP.write;
	  arr.toString = BP.toString;
	  arr.toLocaleString = BP.toString;
	  arr.toJSON = BP.toJSON;
	  arr.equals = BP.equals;
	  arr.compare = BP.compare;
	  arr.indexOf = BP.indexOf;
	  arr.copy = BP.copy;
	  arr.slice = BP.slice;
	  arr.readUIntLE = BP.readUIntLE;
	  arr.readUIntBE = BP.readUIntBE;
	  arr.readUInt8 = BP.readUInt8;
	  arr.readUInt16LE = BP.readUInt16LE;
	  arr.readUInt16BE = BP.readUInt16BE;
	  arr.readUInt32LE = BP.readUInt32LE;
	  arr.readUInt32BE = BP.readUInt32BE;
	  arr.readIntLE = BP.readIntLE;
	  arr.readIntBE = BP.readIntBE;
	  arr.readInt8 = BP.readInt8;
	  arr.readInt16LE = BP.readInt16LE;
	  arr.readInt16BE = BP.readInt16BE;
	  arr.readInt32LE = BP.readInt32LE;
	  arr.readInt32BE = BP.readInt32BE;
	  arr.readFloatLE = BP.readFloatLE;
	  arr.readFloatBE = BP.readFloatBE;
	  arr.readDoubleLE = BP.readDoubleLE;
	  arr.readDoubleBE = BP.readDoubleBE;
	  arr.writeUInt8 = BP.writeUInt8;
	  arr.writeUIntLE = BP.writeUIntLE;
	  arr.writeUIntBE = BP.writeUIntBE;
	  arr.writeUInt16LE = BP.writeUInt16LE;
	  arr.writeUInt16BE = BP.writeUInt16BE;
	  arr.writeUInt32LE = BP.writeUInt32LE;
	  arr.writeUInt32BE = BP.writeUInt32BE;
	  arr.writeIntLE = BP.writeIntLE;
	  arr.writeIntBE = BP.writeIntBE;
	  arr.writeInt8 = BP.writeInt8;
	  arr.writeInt16LE = BP.writeInt16LE;
	  arr.writeInt16BE = BP.writeInt16BE;
	  arr.writeInt32LE = BP.writeInt32LE;
	  arr.writeInt32BE = BP.writeInt32BE;
	  arr.writeFloatLE = BP.writeFloatLE;
	  arr.writeFloatBE = BP.writeFloatBE;
	  arr.writeDoubleLE = BP.writeDoubleLE;
	  arr.writeDoubleBE = BP.writeDoubleBE;
	  arr.fill = BP.fill;
	  arr.inspect = BP.inspect;
	  arr.toArrayBuffer = BP.toArrayBuffer;

	  return arr;
	};

	var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;

	function base64clean(str) {
	  // Node strips out invalid characters like \n and \t from the string, base64-js does not
	  str = stringtrim(str).replace(INVALID_BASE64_RE, '');
	  // Node converts strings with length < 2 to ''
	  if (str.length < 2) return '';
	  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
	  while (str.length % 4 !== 0) {
	    str = str + '=';
	  }
	  return str;
	}

	function stringtrim(str) {
	  if (str.trim) return str.trim();
	  return str.replace(/^\s+|\s+$/g, '');
	}

	function toHex(n) {
	  if (n < 16) return '0' + n.toString(16);
	  return n.toString(16);
	}

	function utf8ToBytes(string, units) {
	  units = units || Infinity;
	  var codePoint;
	  var length = string.length;
	  var leadSurrogate = null;
	  var bytes = [];

	  for (var i = 0; i < length; i++) {
	    codePoint = string.charCodeAt(i);

	    // is surrogate component
	    if (codePoint > 0xD7FF && codePoint < 0xE000) {
	      // last char was a lead
	      if (!leadSurrogate) {
	        // no lead yet
	        if (codePoint > 0xDBFF) {
	          // unexpected trail
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
	          continue;
	        } else if (i + 1 === length) {
	          // unpaired lead
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
	          continue;
	        }

	        // valid lead
	        leadSurrogate = codePoint;

	        continue;
	      }

	      // 2 leads in a row
	      if (codePoint < 0xDC00) {
	        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
	        leadSurrogate = codePoint;
	        continue;
	      }

	      // valid surrogate pair
	      codePoint = leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00 | 0x10000;
	    } else if (leadSurrogate) {
	      // valid bmp char, but last char was a lead
	      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
	    }

	    leadSurrogate = null;

	    // encode utf8
	    if (codePoint < 0x80) {
	      if ((units -= 1) < 0) break;
	      bytes.push(codePoint);
	    } else if (codePoint < 0x800) {
	      if ((units -= 2) < 0) break;
	      bytes.push(codePoint >> 0x6 | 0xC0, codePoint & 0x3F | 0x80);
	    } else if (codePoint < 0x10000) {
	      if ((units -= 3) < 0) break;
	      bytes.push(codePoint >> 0xC | 0xE0, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
	    } else if (codePoint < 0x110000) {
	      if ((units -= 4) < 0) break;
	      bytes.push(codePoint >> 0x12 | 0xF0, codePoint >> 0xC & 0x3F | 0x80, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
	    } else {
	      throw new Error('Invalid code point');
	    }
	  }

	  return bytes;
	}

	function asciiToBytes(str) {
	  var byteArray = [];
	  for (var i = 0; i < str.length; i++) {
	    // Node's code seems to be doing this and not & 0x7F..
	    byteArray.push(str.charCodeAt(i) & 0xFF);
	  }
	  return byteArray;
	}

	function utf16leToBytes(str, units) {
	  var c, hi, lo;
	  var byteArray = [];
	  for (var i = 0; i < str.length; i++) {
	    if ((units -= 2) < 0) break;

	    c = str.charCodeAt(i);
	    hi = c >> 8;
	    lo = c % 256;
	    byteArray.push(lo);
	    byteArray.push(hi);
	  }

	  return byteArray;
	}

	function base64ToBytes(str) {
	  return base64.toByteArray(base64clean(str));
	}

	function blitBuffer(src, dst, offset, length) {
	  for (var i = 0; i < length; i++) {
	    if (i + offset >= dst.length || i >= src.length) break;
	    dst[i + offset] = src[i];
	  }
	  return i;
	}
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(34).Buffer))

/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	;(function (exports) {
		'use strict';

		var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;

		var PLUS = '+'.charCodeAt(0);
		var SLASH = '/'.charCodeAt(0);
		var NUMBER = '0'.charCodeAt(0);
		var LOWER = 'a'.charCodeAt(0);
		var UPPER = 'A'.charCodeAt(0);
		var PLUS_URL_SAFE = '-'.charCodeAt(0);
		var SLASH_URL_SAFE = '_'.charCodeAt(0);

		function decode(elt) {
			var code = elt.charCodeAt(0);
			if (code === PLUS || code === PLUS_URL_SAFE) return 62; // '+'
			if (code === SLASH || code === SLASH_URL_SAFE) return 63; // '/'
			if (code < NUMBER) return -1; //no match
			if (code < NUMBER + 10) return code - NUMBER + 26 + 26;
			if (code < UPPER + 26) return code - UPPER;
			if (code < LOWER + 26) return code - LOWER + 26;
		}

		function b64ToByteArray(b64) {
			var i, j, l, tmp, placeHolders, arr;

			if (b64.length % 4 > 0) {
				throw new Error('Invalid string. Length must be a multiple of 4');
			}

			// the number of equal signs (place holders)
			// if there are two placeholders, than the two characters before it
			// represent one byte
			// if there is only one, then the three characters before it represent 2 bytes
			// this is just a cheap hack to not do indexOf twice
			var len = b64.length;
			placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0;

			// base64 is 4/3 + up to two characters of the original data
			arr = new Arr(b64.length * 3 / 4 - placeHolders);

			// if there are placeholders, only get up to the last complete 4 chars
			l = placeHolders > 0 ? b64.length - 4 : b64.length;

			var L = 0;

			function push(v) {
				arr[L++] = v;
			}

			for (i = 0, j = 0; i < l; i += 4, j += 3) {
				tmp = decode(b64.charAt(i)) << 18 | decode(b64.charAt(i + 1)) << 12 | decode(b64.charAt(i + 2)) << 6 | decode(b64.charAt(i + 3));
				push((tmp & 0xFF0000) >> 16);
				push((tmp & 0xFF00) >> 8);
				push(tmp & 0xFF);
			}

			if (placeHolders === 2) {
				tmp = decode(b64.charAt(i)) << 2 | decode(b64.charAt(i + 1)) >> 4;
				push(tmp & 0xFF);
			} else if (placeHolders === 1) {
				tmp = decode(b64.charAt(i)) << 10 | decode(b64.charAt(i + 1)) << 4 | decode(b64.charAt(i + 2)) >> 2;
				push(tmp >> 8 & 0xFF);
				push(tmp & 0xFF);
			}

			return arr;
		}

		function uint8ToBase64(uint8) {
			var i,
			    extraBytes = uint8.length % 3,
			    // if we have 1 byte left, pad 2 bytes
			output = "",
			    temp,
			    length;

			function encode(num) {
				return lookup.charAt(num);
			}

			function tripletToBase64(num) {
				return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F);
			}

			// go through the array every three bytes, we'll deal with trailing stuff later
			for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
				temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + uint8[i + 2];
				output += tripletToBase64(temp);
			}

			// pad the end with zeros, but make sure to not forget the extra bytes
			switch (extraBytes) {
				case 1:
					temp = uint8[uint8.length - 1];
					output += encode(temp >> 2);
					output += encode(temp << 4 & 0x3F);
					output += '==';
					break;
				case 2:
					temp = (uint8[uint8.length - 2] << 8) + uint8[uint8.length - 1];
					output += encode(temp >> 10);
					output += encode(temp >> 4 & 0x3F);
					output += encode(temp << 2 & 0x3F);
					output += '=';
					break;
			}

			return output;
		}

		exports.toByteArray = b64ToByteArray;
		exports.fromByteArray = uint8ToBase64;
	})( false ? undefined.base64js = {} : exports);

/***/ },
/* 36 */
/***/ function(module, exports) {

	"use strict";

	exports.read = function (buffer, offset, isLE, mLen, nBytes) {
	  var e, m;
	  var eLen = nBytes * 8 - mLen - 1;
	  var eMax = (1 << eLen) - 1;
	  var eBias = eMax >> 1;
	  var nBits = -7;
	  var i = isLE ? nBytes - 1 : 0;
	  var d = isLE ? -1 : 1;
	  var s = buffer[offset + i];

	  i += d;

	  e = s & (1 << -nBits) - 1;
	  s >>= -nBits;
	  nBits += eLen;
	  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

	  m = e & (1 << -nBits) - 1;
	  e >>= -nBits;
	  nBits += mLen;
	  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

	  if (e === 0) {
	    e = 1 - eBias;
	  } else if (e === eMax) {
	    return m ? NaN : (s ? -1 : 1) * Infinity;
	  } else {
	    m = m + Math.pow(2, mLen);
	    e = e - eBias;
	  }
	  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
	};

	exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
	  var e, m, c;
	  var eLen = nBytes * 8 - mLen - 1;
	  var eMax = (1 << eLen) - 1;
	  var eBias = eMax >> 1;
	  var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
	  var i = isLE ? 0 : nBytes - 1;
	  var d = isLE ? 1 : -1;
	  var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;

	  value = Math.abs(value);

	  if (isNaN(value) || value === Infinity) {
	    m = isNaN(value) ? 1 : 0;
	    e = eMax;
	  } else {
	    e = Math.floor(Math.log(value) / Math.LN2);
	    if (value * (c = Math.pow(2, -e)) < 1) {
	      e--;
	      c *= 2;
	    }
	    if (e + eBias >= 1) {
	      value += rt / c;
	    } else {
	      value += rt * Math.pow(2, 1 - eBias);
	    }
	    if (value * c >= 2) {
	      e++;
	      c /= 2;
	    }

	    if (e + eBias >= eMax) {
	      m = 0;
	      e = eMax;
	    } else if (e + eBias >= 1) {
	      m = (value * c - 1) * Math.pow(2, mLen);
	      e = e + eBias;
	    } else {
	      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
	      e = 0;
	    }
	  }

	  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

	  e = e << mLen | m;
	  eLen += mLen;
	  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

	  buffer[offset + i - d] |= s * 128;
	};

/***/ },
/* 37 */
/***/ function(module, exports) {

	
	/**
	 * isArray
	 */

	'use strict';

	var isArray = Array.isArray;

	/**
	 * toString
	 */

	var str = Object.prototype.toString;

	/**
	 * Whether or not the given `val`
	 * is an array.
	 *
	 * example:
	 *
	 *        isArray([]);
	 *        // > true
	 *        isArray(arguments);
	 *        // > false
	 *        isArray('');
	 *        // > false
	 *
	 * @param {mixed} val
	 * @return {bool}
	 */

	module.exports = isArray || function (val) {
	  return !!val && '[object Array]' == str.call(val);
	};

/***/ },
/* 38 */
/***/ function(module, exports) {

	/**
	 * Bit twiddling hacks for JavaScript.
	 *
	 * Author: Mikola Lysenko
	 *
	 * Ported from Stanford bit twiddling hack library:
	 *    http://graphics.stanford.edu/~seander/bithacks.html
	 */

	"use strict";"use restrict";

	//Number of bits in an integer
	var INT_BITS = 32;

	//Constants
	exports.INT_BITS = INT_BITS;
	exports.INT_MAX = 0x7fffffff;
	exports.INT_MIN = -1 << INT_BITS - 1;

	//Returns -1, 0, +1 depending on sign of x
	exports.sign = function (v) {
	  return (v > 0) - (v < 0);
	};

	//Computes absolute value of integer
	exports.abs = function (v) {
	  var mask = v >> INT_BITS - 1;
	  return (v ^ mask) - mask;
	};

	//Computes minimum of integers x and y
	exports.min = function (x, y) {
	  return y ^ (x ^ y) & -(x < y);
	};

	//Computes maximum of integers x and y
	exports.max = function (x, y) {
	  return x ^ (x ^ y) & -(x < y);
	};

	//Checks if a number is a power of two
	exports.isPow2 = function (v) {
	  return !(v & v - 1) && !!v;
	};

	//Computes log base 2 of v
	exports.log2 = function (v) {
	  var r, shift;
	  r = (v > 0xFFFF) << 4;v >>>= r;
	  shift = (v > 0xFF) << 3;v >>>= shift;r |= shift;
	  shift = (v > 0xF) << 2;v >>>= shift;r |= shift;
	  shift = (v > 0x3) << 1;v >>>= shift;r |= shift;
	  return r | v >> 1;
	};

	//Computes log base 10 of v
	exports.log10 = function (v) {
	  return v >= 1000000000 ? 9 : v >= 100000000 ? 8 : v >= 10000000 ? 7 : v >= 1000000 ? 6 : v >= 100000 ? 5 : v >= 10000 ? 4 : v >= 1000 ? 3 : v >= 100 ? 2 : v >= 10 ? 1 : 0;
	};

	//Counts number of bits
	exports.popCount = function (v) {
	  v = v - (v >>> 1 & 0x55555555);
	  v = (v & 0x33333333) + (v >>> 2 & 0x33333333);
	  return (v + (v >>> 4) & 0xF0F0F0F) * 0x1010101 >>> 24;
	};

	//Counts number of trailing zeros
	function countTrailingZeros(v) {
	  var c = 32;
	  v &= -v;
	  if (v) c--;
	  if (v & 0x0000FFFF) c -= 16;
	  if (v & 0x00FF00FF) c -= 8;
	  if (v & 0x0F0F0F0F) c -= 4;
	  if (v & 0x33333333) c -= 2;
	  if (v & 0x55555555) c -= 1;
	  return c;
	}
	exports.countTrailingZeros = countTrailingZeros;

	//Rounds to next power of 2
	exports.nextPow2 = function (v) {
	  v += v === 0;
	  --v;
	  v |= v >>> 1;
	  v |= v >>> 2;
	  v |= v >>> 4;
	  v |= v >>> 8;
	  v |= v >>> 16;
	  return v + 1;
	};

	//Rounds down to previous power of 2
	exports.prevPow2 = function (v) {
	  v |= v >>> 1;
	  v |= v >>> 2;
	  v |= v >>> 4;
	  v |= v >>> 8;
	  v |= v >>> 16;
	  return v - (v >>> 1);
	};

	//Computes parity of word
	exports.parity = function (v) {
	  v ^= v >>> 16;
	  v ^= v >>> 8;
	  v ^= v >>> 4;
	  v &= 0xf;
	  return 0x6996 >>> v & 1;
	};

	var REVERSE_TABLE = new Array(256);

	(function (tab) {
	  for (var i = 0; i < 256; ++i) {
	    var v = i,
	        r = i,
	        s = 7;
	    for (v >>>= 1; v; v >>>= 1) {
	      r <<= 1;
	      r |= v & 1;
	      --s;
	    }
	    tab[i] = r << s & 0xff;
	  }
	})(REVERSE_TABLE);

	//Reverse bits in a 32 bit word
	exports.reverse = function (v) {
	  return REVERSE_TABLE[v & 0xff] << 24 | REVERSE_TABLE[v >>> 8 & 0xff] << 16 | REVERSE_TABLE[v >>> 16 & 0xff] << 8 | REVERSE_TABLE[v >>> 24 & 0xff];
	};

	//Interleave bits of 2 coordinates with 16 bits.  Useful for fast quadtree codes
	exports.interleave2 = function (x, y) {
	  x &= 0xFFFF;
	  x = (x | x << 8) & 0x00FF00FF;
	  x = (x | x << 4) & 0x0F0F0F0F;
	  x = (x | x << 2) & 0x33333333;
	  x = (x | x << 1) & 0x55555555;

	  y &= 0xFFFF;
	  y = (y | y << 8) & 0x00FF00FF;
	  y = (y | y << 4) & 0x0F0F0F0F;
	  y = (y | y << 2) & 0x33333333;
	  y = (y | y << 1) & 0x55555555;

	  return x | y << 1;
	};

	//Extracts the nth interleaved component
	exports.deinterleave2 = function (v, n) {
	  v = v >>> n & 0x55555555;
	  v = (v | v >>> 1) & 0x33333333;
	  v = (v | v >>> 2) & 0x0F0F0F0F;
	  v = (v | v >>> 4) & 0x00FF00FF;
	  v = (v | v >>> 16) & 0x000FFFF;
	  return v << 16 >> 16;
	};

	//Interleave bits of 3 coordinates, each with 10 bits.  Useful for fast octree codes
	exports.interleave3 = function (x, y, z) {
	  x &= 0x3FF;
	  x = (x | x << 16) & 4278190335;
	  x = (x | x << 8) & 251719695;
	  x = (x | x << 4) & 3272356035;
	  x = (x | x << 2) & 1227133513;

	  y &= 0x3FF;
	  y = (y | y << 16) & 4278190335;
	  y = (y | y << 8) & 251719695;
	  y = (y | y << 4) & 3272356035;
	  y = (y | y << 2) & 1227133513;
	  x |= y << 1;

	  z &= 0x3FF;
	  z = (z | z << 16) & 4278190335;
	  z = (z | z << 8) & 251719695;
	  z = (z | z << 4) & 3272356035;
	  z = (z | z << 2) & 1227133513;

	  return x | z << 2;
	};

	//Extracts nth interleaved component of a 3-tuple
	exports.deinterleave3 = function (v, n) {
	  v = v >>> n & 1227133513;
	  v = (v | v >>> 2) & 3272356035;
	  v = (v | v >>> 4) & 251719695;
	  v = (v | v >>> 8) & 4278190335;
	  v = (v | v >>> 16) & 0x3FF;
	  return v << 22 >> 22;
	};

	//Computes next combination in colexicographic order (this is mistakenly called nextPermutation on the bit twiddling hacks page)
	exports.nextCombination = function (v) {
	  var t = v | v - 1;
	  return t + 1 | (~t & - ~t) - 1 >>> countTrailingZeros(v) + 1;
	};

/***/ },
/* 39 */
/***/ function(module, exports) {

	"use strict";

	function dupe_array(count, value, i) {
	  var c = count[i] | 0;
	  if (c <= 0) {
	    return [];
	  }
	  var result = new Array(c),
	      j;
	  if (i === count.length - 1) {
	    for (j = 0; j < c; ++j) {
	      result[j] = value;
	    }
	  } else {
	    for (j = 0; j < c; ++j) {
	      result[j] = dupe_array(count, value, i + 1);
	    }
	  }
	  return result;
	}

	function dupe_number(count, value) {
	  var result, i;
	  result = new Array(count);
	  for (i = 0; i < count; ++i) {
	    result[i] = value;
	  }
	  return result;
	}

	function dupe(count, value) {
	  if (typeof value === "undefined") {
	    value = 0;
	  }
	  switch (typeof count) {
	    case "number":
	      if (count > 0) {
	        return dupe_number(count | 0, value);
	      }
	      break;
	    case "object":
	      if (typeof count.length === "number") {
	        return dupe_array(count, value, 0);
	      }
	      break;
	  }
	  return [];
	}

	module.exports = dupe;

/***/ },
/* 40 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var compile = __webpack_require__(41);

	var EmptyProc = {
	  body: "",
	  args: [],
	  thisVars: [],
	  localVars: []
	};

	function fixup(x) {
	  if (!x) {
	    return EmptyProc;
	  }
	  for (var i = 0; i < x.args.length; ++i) {
	    var a = x.args[i];
	    if (i === 0) {
	      x.args[i] = { name: a, lvalue: true, rvalue: !!x.rvalue, count: x.count || 1 };
	    } else {
	      x.args[i] = { name: a, lvalue: false, rvalue: true, count: 1 };
	    }
	  }
	  if (!x.thisVars) {
	    x.thisVars = [];
	  }
	  if (!x.localVars) {
	    x.localVars = [];
	  }
	  return x;
	}

	function pcompile(user_args) {
	  return compile({
	    args: user_args.args,
	    pre: fixup(user_args.pre),
	    body: fixup(user_args.body),
	    post: fixup(user_args.proc),
	    funcName: user_args.funcName
	  });
	}

	function makeOp(user_args) {
	  var args = [];
	  for (var i = 0; i < user_args.args.length; ++i) {
	    args.push("a" + i);
	  }
	  var wrapper = new Function("P", ["return function ", user_args.funcName, "_ndarrayops(", args.join(","), ") {P(", args.join(","), ");return a0}"].join(""));
	  return wrapper(pcompile(user_args));
	}

	var assign_ops = {
	  add: "+",
	  sub: "-",
	  mul: "*",
	  div: "/",
	  mod: "%",
	  band: "&",
	  bor: "|",
	  bxor: "^",
	  lshift: "<<",
	  rshift: ">>",
	  rrshift: ">>>"
	};(function () {
	  for (var id in assign_ops) {
	    var op = assign_ops[id];
	    exports[id] = makeOp({
	      args: ["array", "array", "array"],
	      body: { args: ["a", "b", "c"],
	        body: "a=b" + op + "c" },
	      funcName: id
	    });
	    exports[id + "eq"] = makeOp({
	      args: ["array", "array"],
	      body: { args: ["a", "b"],
	        body: "a" + op + "=b" },
	      rvalue: true,
	      funcName: id + "eq"
	    });
	    exports[id + "s"] = makeOp({
	      args: ["array", "array", "scalar"],
	      body: { args: ["a", "b", "s"],
	        body: "a=b" + op + "s" },
	      funcName: id + "s"
	    });
	    exports[id + "seq"] = makeOp({
	      args: ["array", "scalar"],
	      body: { args: ["a", "s"],
	        body: "a" + op + "=s" },
	      rvalue: true,
	      funcName: id + "seq"
	    });
	  }
	})();

	var unary_ops = {
	  not: "!",
	  bnot: "~",
	  neg: "-",
	  recip: "1.0/"
	};(function () {
	  for (var id in unary_ops) {
	    var op = unary_ops[id];
	    exports[id] = makeOp({
	      args: ["array", "array"],
	      body: { args: ["a", "b"],
	        body: "a=" + op + "b" },
	      funcName: id
	    });
	    exports[id + "eq"] = makeOp({
	      args: ["array"],
	      body: { args: ["a"],
	        body: "a=" + op + "a" },
	      rvalue: true,
	      count: 2,
	      funcName: id + "eq"
	    });
	  }
	})();

	var binary_ops = {
	  and: "&&",
	  or: "||",
	  eq: "===",
	  neq: "!==",
	  lt: "<",
	  gt: ">",
	  leq: "<=",
	  geq: ">="
	};(function () {
	  for (var id in binary_ops) {
	    var op = binary_ops[id];
	    exports[id] = makeOp({
	      args: ["array", "array", "array"],
	      body: { args: ["a", "b", "c"],
	        body: "a=b" + op + "c" },
	      funcName: id
	    });
	    exports[id + "s"] = makeOp({
	      args: ["array", "array", "scalar"],
	      body: { args: ["a", "b", "s"],
	        body: "a=b" + op + "s" },
	      funcName: id + "s"
	    });
	    exports[id + "eq"] = makeOp({
	      args: ["array", "array"],
	      body: { args: ["a", "b"],
	        body: "a=a" + op + "b" },
	      rvalue: true,
	      count: 2,
	      funcName: id + "eq"
	    });
	    exports[id + "seq"] = makeOp({
	      args: ["array", "scalar"],
	      body: { args: ["a", "s"],
	        body: "a=a" + op + "s" },
	      rvalue: true,
	      count: 2,
	      funcName: id + "seq"
	    });
	  }
	})();

	var math_unary = ["abs", "acos", "asin", "atan", "ceil", "cos", "exp", "floor", "log", "round", "sin", "sqrt", "tan"];(function () {
	  for (var i = 0; i < math_unary.length; ++i) {
	    var f = math_unary[i];
	    exports[f] = makeOp({
	      args: ["array", "array"],
	      pre: { args: [], body: "this_f=Math." + f, thisVars: ["this_f"] },
	      body: { args: ["a", "b"], body: "a=this_f(b)", thisVars: ["this_f"] },
	      funcName: f
	    });
	    exports[f + "eq"] = makeOp({
	      args: ["array"],
	      pre: { args: [], body: "this_f=Math." + f, thisVars: ["this_f"] },
	      body: { args: ["a"], body: "a=this_f(a)", thisVars: ["this_f"] },
	      rvalue: true,
	      count: 2,
	      funcName: f + "eq"
	    });
	  }
	})();

	var math_comm = ["max", "min", "atan2", "pow"];(function () {
	  for (var i = 0; i < math_comm.length; ++i) {
	    var f = math_comm[i];
	    exports[f] = makeOp({
	      args: ["array", "array", "array"],
	      pre: { args: [], body: "this_f=Math." + f, thisVars: ["this_f"] },
	      body: { args: ["a", "b", "c"], body: "a=this_f(b,c)", thisVars: ["this_f"] },
	      funcName: f
	    });
	    exports[f + "s"] = makeOp({
	      args: ["array", "array", "scalar"],
	      pre: { args: [], body: "this_f=Math." + f, thisVars: ["this_f"] },
	      body: { args: ["a", "b", "c"], body: "a=this_f(b,c)", thisVars: ["this_f"] },
	      funcName: f + "s"
	    });
	    exports[f + "eq"] = makeOp({ args: ["array", "array"],
	      pre: { args: [], body: "this_f=Math." + f, thisVars: ["this_f"] },
	      body: { args: ["a", "b"], body: "a=this_f(a,b)", thisVars: ["this_f"] },
	      rvalue: true,
	      count: 2,
	      funcName: f + "eq"
	    });
	    exports[f + "seq"] = makeOp({ args: ["array", "scalar"],
	      pre: { args: [], body: "this_f=Math." + f, thisVars: ["this_f"] },
	      body: { args: ["a", "b"], body: "a=this_f(a,b)", thisVars: ["this_f"] },
	      rvalue: true,
	      count: 2,
	      funcName: f + "seq"
	    });
	  }
	})();

	var math_noncomm = ["atan2", "pow"];(function () {
	  for (var i = 0; i < math_noncomm.length; ++i) {
	    var f = math_noncomm[i];
	    exports[f + "op"] = makeOp({
	      args: ["array", "array", "array"],
	      pre: { args: [], body: "this_f=Math." + f, thisVars: ["this_f"] },
	      body: { args: ["a", "b", "c"], body: "a=this_f(c,b)", thisVars: ["this_f"] },
	      funcName: f + "op"
	    });
	    exports[f + "ops"] = makeOp({
	      args: ["array", "array", "scalar"],
	      pre: { args: [], body: "this_f=Math." + f, thisVars: ["this_f"] },
	      body: { args: ["a", "b", "c"], body: "a=this_f(c,b)", thisVars: ["this_f"] },
	      funcName: f + "ops"
	    });
	    exports[f + "opeq"] = makeOp({ args: ["array", "array"],
	      pre: { args: [], body: "this_f=Math." + f, thisVars: ["this_f"] },
	      body: { args: ["a", "b"], body: "a=this_f(b,a)", thisVars: ["this_f"] },
	      rvalue: true,
	      count: 2,
	      funcName: f + "opeq"
	    });
	    exports[f + "opseq"] = makeOp({ args: ["array", "scalar"],
	      pre: { args: [], body: "this_f=Math." + f, thisVars: ["this_f"] },
	      body: { args: ["a", "b"], body: "a=this_f(b,a)", thisVars: ["this_f"] },
	      rvalue: true,
	      count: 2,
	      funcName: f + "opseq"
	    });
	  }
	})();

	exports.any = compile({
	  args: ["array"],
	  pre: EmptyProc,
	  body: { args: [{ name: "a", lvalue: false, rvalue: true, count: 1 }], body: "if(a){return true}", localVars: [], thisVars: [] },
	  post: { args: [], localVars: [], thisVars: [], body: "return false" },
	  funcName: "any"
	});

	exports.all = compile({
	  args: ["array"],
	  pre: EmptyProc,
	  body: { args: [{ name: "x", lvalue: false, rvalue: true, count: 1 }], body: "if(!x){return false}", localVars: [], thisVars: [] },
	  post: { args: [], localVars: [], thisVars: [], body: "return true" },
	  funcName: "all"
	});

	exports.sum = compile({
	  args: ["array"],
	  pre: { args: [], localVars: [], thisVars: ["this_s"], body: "this_s=0" },
	  body: { args: [{ name: "a", lvalue: false, rvalue: true, count: 1 }], body: "this_s+=a", localVars: [], thisVars: ["this_s"] },
	  post: { args: [], localVars: [], thisVars: ["this_s"], body: "return this_s" },
	  funcName: "sum"
	});

	exports.prod = compile({
	  args: ["array"],
	  pre: { args: [], localVars: [], thisVars: ["this_s"], body: "this_s=1" },
	  body: { args: [{ name: "a", lvalue: false, rvalue: true, count: 1 }], body: "this_s*=a", localVars: [], thisVars: ["this_s"] },
	  post: { args: [], localVars: [], thisVars: ["this_s"], body: "return this_s" },
	  funcName: "prod"
	});

	exports.norm2squared = compile({
	  args: ["array"],
	  pre: { args: [], localVars: [], thisVars: ["this_s"], body: "this_s=0" },
	  body: { args: [{ name: "a", lvalue: false, rvalue: true, count: 2 }], body: "this_s+=a*a", localVars: [], thisVars: ["this_s"] },
	  post: { args: [], localVars: [], thisVars: ["this_s"], body: "return this_s" },
	  funcName: "norm2squared"
	});

	exports.norm2 = compile({
	  args: ["array"],
	  pre: { args: [], localVars: [], thisVars: ["this_s"], body: "this_s=0" },
	  body: { args: [{ name: "a", lvalue: false, rvalue: true, count: 2 }], body: "this_s+=a*a", localVars: [], thisVars: ["this_s"] },
	  post: { args: [], localVars: [], thisVars: ["this_s"], body: "return Math.sqrt(this_s)" },
	  funcName: "norm2"
	});

	exports.norminf = compile({
	  args: ["array"],
	  pre: { args: [], localVars: [], thisVars: ["this_s"], body: "this_s=0" },
	  body: { args: [{ name: "a", lvalue: false, rvalue: true, count: 4 }], body: "if(-a>this_s){this_s=-a}else if(a>this_s){this_s=a}", localVars: [], thisVars: ["this_s"] },
	  post: { args: [], localVars: [], thisVars: ["this_s"], body: "return this_s" },
	  funcName: "norminf"
	});

	exports.norm1 = compile({
	  args: ["array"],
	  pre: { args: [], localVars: [], thisVars: ["this_s"], body: "this_s=0" },
	  body: { args: [{ name: "a", lvalue: false, rvalue: true, count: 3 }], body: "this_s+=a<0?-a:a", localVars: [], thisVars: ["this_s"] },
	  post: { args: [], localVars: [], thisVars: ["this_s"], body: "return this_s" },
	  funcName: "norm1"
	});

	exports.sup = compile({
	  args: ["array"],
	  pre: { body: "this_h=-Infinity",
	    args: [],
	    thisVars: ["this_h"],
	    localVars: [] },
	  body: { body: "if(_inline_1_arg0_>this_h)this_h=_inline_1_arg0_",
	    args: [{ "name": "_inline_1_arg0_", "lvalue": false, "rvalue": true, "count": 2 }],
	    thisVars: ["this_h"],
	    localVars: [] },
	  post: { body: "return this_h",
	    args: [],
	    thisVars: ["this_h"],
	    localVars: [] }
	});

	exports.inf = compile({
	  args: ["array"],
	  pre: { body: "this_h=Infinity",
	    args: [],
	    thisVars: ["this_h"],
	    localVars: [] },
	  body: { body: "if(_inline_1_arg0_<this_h)this_h=_inline_1_arg0_",
	    args: [{ "name": "_inline_1_arg0_", "lvalue": false, "rvalue": true, "count": 2 }],
	    thisVars: ["this_h"],
	    localVars: [] },
	  post: { body: "return this_h",
	    args: [],
	    thisVars: ["this_h"],
	    localVars: [] }
	});

	exports.argmin = compile({
	  args: ["index", "array", "shape"],
	  pre: {
	    body: "{this_v=Infinity;this_i=_inline_0_arg2_.slice(0)}",
	    args: [{ name: "_inline_0_arg0_", lvalue: false, rvalue: false, count: 0 }, { name: "_inline_0_arg1_", lvalue: false, rvalue: false, count: 0 }, { name: "_inline_0_arg2_", lvalue: false, rvalue: true, count: 1 }],
	    thisVars: ["this_i", "this_v"],
	    localVars: [] },
	  body: {
	    body: "{if(_inline_1_arg1_<this_v){this_v=_inline_1_arg1_;for(var _inline_1_k=0;_inline_1_k<_inline_1_arg0_.length;++_inline_1_k){this_i[_inline_1_k]=_inline_1_arg0_[_inline_1_k]}}}",
	    args: [{ name: "_inline_1_arg0_", lvalue: false, rvalue: true, count: 2 }, { name: "_inline_1_arg1_", lvalue: false, rvalue: true, count: 2 }],
	    thisVars: ["this_i", "this_v"],
	    localVars: ["_inline_1_k"] },
	  post: {
	    body: "{return this_i}",
	    args: [],
	    thisVars: ["this_i"],
	    localVars: [] }
	});

	exports.argmax = compile({
	  args: ["index", "array", "shape"],
	  pre: {
	    body: "{this_v=-Infinity;this_i=_inline_0_arg2_.slice(0)}",
	    args: [{ name: "_inline_0_arg0_", lvalue: false, rvalue: false, count: 0 }, { name: "_inline_0_arg1_", lvalue: false, rvalue: false, count: 0 }, { name: "_inline_0_arg2_", lvalue: false, rvalue: true, count: 1 }],
	    thisVars: ["this_i", "this_v"],
	    localVars: [] },
	  body: {
	    body: "{if(_inline_1_arg1_>this_v){this_v=_inline_1_arg1_;for(var _inline_1_k=0;_inline_1_k<_inline_1_arg0_.length;++_inline_1_k){this_i[_inline_1_k]=_inline_1_arg0_[_inline_1_k]}}}",
	    args: [{ name: "_inline_1_arg0_", lvalue: false, rvalue: true, count: 2 }, { name: "_inline_1_arg1_", lvalue: false, rvalue: true, count: 2 }],
	    thisVars: ["this_i", "this_v"],
	    localVars: ["_inline_1_k"] },
	  post: {
	    body: "{return this_i}",
	    args: [],
	    thisVars: ["this_i"],
	    localVars: [] }
	});

	exports.random = makeOp({
	  args: ["array"],
	  pre: { args: [], body: "this_f=Math.random", thisVars: ["this_f"] },
	  body: { args: ["a"], body: "a=this_f()", thisVars: ["this_f"] },
	  funcName: "random"
	});

	exports.assign = makeOp({
	  args: ["array", "array"],
	  body: { args: ["a", "b"], body: "a=b" },
	  funcName: "assign" });

	exports.assigns = makeOp({
	  args: ["array", "scalar"],
	  body: { args: ["a", "b"], body: "a=b" },
	  funcName: "assigns" });

	exports.equals = compile({
	  args: ["array", "array"],
	  pre: EmptyProc,
	  body: { args: [{ name: "x", lvalue: false, rvalue: true, count: 1 }, { name: "y", lvalue: false, rvalue: true, count: 1 }],
	    body: "if(x!==y){return false}",
	    localVars: [],
	    thisVars: [] },
	  post: { args: [], localVars: [], thisVars: [], body: "return true" },
	  funcName: "equals"
	});

/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var createThunk = __webpack_require__(42);

	function Procedure() {
	  this.argTypes = [];
	  this.shimArgs = [];
	  this.arrayArgs = [];
	  this.arrayBlockIndices = [];
	  this.scalarArgs = [];
	  this.offsetArgs = [];
	  this.offsetArgIndex = [];
	  this.indexArgs = [];
	  this.shapeArgs = [];
	  this.funcName = "";
	  this.pre = null;
	  this.body = null;
	  this.post = null;
	  this.debug = false;
	}

	function compileCwise(user_args) {
	  //Create procedure
	  var proc = new Procedure();

	  //Parse blocks
	  proc.pre = user_args.pre;
	  proc.body = user_args.body;
	  proc.post = user_args.post;

	  //Parse arguments
	  var proc_args = user_args.args.slice(0);
	  proc.argTypes = proc_args;
	  for (var i = 0; i < proc_args.length; ++i) {
	    var arg_type = proc_args[i];
	    if (arg_type === "array" || typeof arg_type === "object" && arg_type.blockIndices) {
	      proc.argTypes[i] = "array";
	      proc.arrayArgs.push(i);
	      proc.arrayBlockIndices.push(arg_type.blockIndices ? arg_type.blockIndices : 0);
	      proc.shimArgs.push("array" + i);
	      if (i < proc.pre.args.length && proc.pre.args[i].count > 0) {
	        throw new Error("cwise: pre() block may not reference array args");
	      }
	      if (i < proc.post.args.length && proc.post.args[i].count > 0) {
	        throw new Error("cwise: post() block may not reference array args");
	      }
	    } else if (arg_type === "scalar") {
	      proc.scalarArgs.push(i);
	      proc.shimArgs.push("scalar" + i);
	    } else if (arg_type === "index") {
	      proc.indexArgs.push(i);
	      if (i < proc.pre.args.length && proc.pre.args[i].count > 0) {
	        throw new Error("cwise: pre() block may not reference array index");
	      }
	      if (i < proc.body.args.length && proc.body.args[i].lvalue) {
	        throw new Error("cwise: body() block may not write to array index");
	      }
	      if (i < proc.post.args.length && proc.post.args[i].count > 0) {
	        throw new Error("cwise: post() block may not reference array index");
	      }
	    } else if (arg_type === "shape") {
	      proc.shapeArgs.push(i);
	      if (i < proc.pre.args.length && proc.pre.args[i].lvalue) {
	        throw new Error("cwise: pre() block may not write to array shape");
	      }
	      if (i < proc.body.args.length && proc.body.args[i].lvalue) {
	        throw new Error("cwise: body() block may not write to array shape");
	      }
	      if (i < proc.post.args.length && proc.post.args[i].lvalue) {
	        throw new Error("cwise: post() block may not write to array shape");
	      }
	    } else if (typeof arg_type === "object" && arg_type.offset) {
	      proc.argTypes[i] = "offset";
	      proc.offsetArgs.push({ array: arg_type.array, offset: arg_type.offset });
	      proc.offsetArgIndex.push(i);
	    } else {
	      throw new Error("cwise: Unknown argument type " + proc_args[i]);
	    }
	  }

	  //Make sure at least one array argument was specified
	  if (proc.arrayArgs.length <= 0) {
	    throw new Error("cwise: No array arguments specified");
	  }

	  //Make sure arguments are correct
	  if (proc.pre.args.length > proc_args.length) {
	    throw new Error("cwise: Too many arguments in pre() block");
	  }
	  if (proc.body.args.length > proc_args.length) {
	    throw new Error("cwise: Too many arguments in body() block");
	  }
	  if (proc.post.args.length > proc_args.length) {
	    throw new Error("cwise: Too many arguments in post() block");
	  }

	  //Check debug flag
	  proc.debug = !!user_args.printCode || !!user_args.debug;

	  //Retrieve name
	  proc.funcName = user_args.funcName || "cwise";

	  //Read in block size
	  proc.blockSize = user_args.blockSize || 64;

	  return createThunk(proc);
	}

	module.exports = compileCwise;

/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	// The function below is called when constructing a cwise function object, and does the following:
	// A function object is constructed which accepts as argument a compilation function and returns another function.
	// It is this other function that is eventually returned by createThunk, and this function is the one that actually
	// checks whether a certain pattern of arguments has already been used before and compiles new loops as needed.
	// The compilation passed to the first function object is used for compiling new functions.
	// Once this function object is created, it is called with compile as argument, where the first argument of compile
	// is bound to "proc" (essentially containing a preprocessed version of the user arguments to cwise).
	// So createThunk roughly works like this:
	// function createThunk(proc) {
	//   var thunk = function(compileBound) {
	//     var CACHED = {}
	//     return function(arrays and scalars) {
	//       if (dtype and order of arrays in CACHED) {
	//         var func = CACHED[dtype and order of arrays]
	//       } else {
	//         var func = CACHED[dtype and order of arrays] = compileBound(dtype and order of arrays)
	//       }
	//       return func(arrays and scalars)
	//     }
	//   }
	//   return thunk(compile.bind1(proc))
	// }

	var compile = __webpack_require__(43);

	function createThunk(proc) {
	  var code = ["'use strict'", "var CACHED={}"];
	  var vars = [];
	  var thunkName = proc.funcName + "_cwise_thunk";

	  //Build thunk
	  code.push(["return function ", thunkName, "(", proc.shimArgs.join(","), "){"].join(""));
	  var typesig = [];
	  var string_typesig = [];
	  var proc_args = [["array", proc.arrayArgs[0], ".shape.slice(", // Slice shape so that we only retain the shape over which we iterate (which gets passed to the cwise operator as SS).
	  Math.max(0, proc.arrayBlockIndices[0]), proc.arrayBlockIndices[0] < 0 ? "," + proc.arrayBlockIndices[0] + ")" : ")"].join("")];
	  var shapeLengthConditions = [],
	      shapeConditions = [];
	  // Process array arguments
	  for (var i = 0; i < proc.arrayArgs.length; ++i) {
	    var j = proc.arrayArgs[i];
	    vars.push(["t", j, "=array", j, ".dtype,", "r", j, "=array", j, ".order"].join(""));
	    typesig.push("t" + j);
	    typesig.push("r" + j);
	    string_typesig.push("t" + j);
	    string_typesig.push("r" + j + ".join()");
	    proc_args.push("array" + j + ".data");
	    proc_args.push("array" + j + ".stride");
	    proc_args.push("array" + j + ".offset|0");
	    if (i > 0) {
	      // Gather conditions to check for shape equality (ignoring block indices)
	      shapeLengthConditions.push("array" + proc.arrayArgs[0] + ".shape.length===array" + j + ".shape.length+" + (Math.abs(proc.arrayBlockIndices[0]) - Math.abs(proc.arrayBlockIndices[i])));
	      shapeConditions.push("array" + proc.arrayArgs[0] + ".shape[shapeIndex+" + Math.max(0, proc.arrayBlockIndices[0]) + "]===array" + j + ".shape[shapeIndex+" + Math.max(0, proc.arrayBlockIndices[i]) + "]");
	    }
	  }
	  // Check for shape equality
	  if (proc.arrayArgs.length > 1) {
	    code.push("if (!(" + shapeLengthConditions.join(" && ") + ")) throw new Error('cwise: Arrays do not all have the same dimensionality!')");
	    code.push("for(var shapeIndex=array" + proc.arrayArgs[0] + ".shape.length-" + Math.abs(proc.arrayBlockIndices[0]) + "; shapeIndex-->0;) {");
	    code.push("if (!(" + shapeConditions.join(" && ") + ")) throw new Error('cwise: Arrays do not all have the same shape!')");
	    code.push("}");
	  }
	  // Process scalar arguments
	  for (var i = 0; i < proc.scalarArgs.length; ++i) {
	    proc_args.push("scalar" + proc.scalarArgs[i]);
	  }
	  // Check for cached function (and if not present, generate it)
	  vars.push(["type=[", string_typesig.join(","), "].join()"].join(""));
	  vars.push("proc=CACHED[type]");
	  code.push("var " + vars.join(","));

	  code.push(["if(!proc){", "CACHED[type]=proc=compile([", typesig.join(","), "])}", "return proc(", proc_args.join(","), ")}"].join(""));

	  if (proc.debug) {
	    console.log("-----Generated thunk:\n" + code.join("\n") + "\n----------");
	  }

	  //Compile thunk
	  var thunk = new Function("compile", code.join("\n"));
	  return thunk(compile.bind(undefined, proc));
	}

	module.exports = createThunk;

/***/ },
/* 43 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var uniq = __webpack_require__(44);

	// This function generates very simple loops analogous to how you typically traverse arrays (the outermost loop corresponds to the slowest changing index, the innermost loop to the fastest changing index)
	// TODO: If two arrays have the same strides (and offsets) there is potential for decreasing the number of "pointers" and related variables. The drawback is that the type signature would become more specific and that there would thus be less potential for caching, but it might still be worth it, especially when dealing with large numbers of arguments.
	function innerFill(order, proc, body) {
	  var dimension = order.length,
	      nargs = proc.arrayArgs.length,
	      has_index = proc.indexArgs.length > 0,
	      code = [],
	      vars = [],
	      idx = 0,
	      pidx = 0,
	      i,
	      j;
	  for (i = 0; i < dimension; ++i) {
	    // Iteration variables
	    vars.push(["i", i, "=0"].join(""));
	  }
	  //Compute scan deltas
	  for (j = 0; j < nargs; ++j) {
	    for (i = 0; i < dimension; ++i) {
	      pidx = idx;
	      idx = order[i];
	      if (i === 0) {
	        // The innermost/fastest dimension's delta is simply its stride
	        vars.push(["d", j, "s", i, "=t", j, "p", idx].join(""));
	      } else {
	        // For other dimensions the delta is basically the stride minus something which essentially "rewinds" the previous (more inner) dimension
	        vars.push(["d", j, "s", i, "=(t", j, "p", idx, "-s", pidx, "*t", j, "p", pidx, ")"].join(""));
	      }
	    }
	  }
	  code.push("var " + vars.join(","));
	  //Scan loop
	  for (i = dimension - 1; i >= 0; --i) {
	    // Start at largest stride and work your way inwards
	    idx = order[i];
	    code.push(["for(i", i, "=0;i", i, "<s", idx, ";++i", i, "){"].join(""));
	  }
	  //Push body of inner loop
	  code.push(body);
	  //Advance scan pointers
	  for (i = 0; i < dimension; ++i) {
	    pidx = idx;
	    idx = order[i];
	    for (j = 0; j < nargs; ++j) {
	      code.push(["p", j, "+=d", j, "s", i].join(""));
	    }
	    if (has_index) {
	      if (i > 0) {
	        code.push(["index[", pidx, "]-=s", pidx].join(""));
	      }
	      code.push(["++index[", idx, "]"].join(""));
	    }
	    code.push("}");
	  }
	  return code.join("\n");
	}

	// Generate "outer" loops that loop over blocks of data, applying "inner" loops to the blocks by manipulating the local variables in such a way that the inner loop only "sees" the current block.
	// TODO: If this is used, then the previous declaration (done by generateCwiseOp) of s* is essentially unnecessary.
	//       I believe the s* are not used elsewhere (in particular, I don't think they're used in the pre/post parts and "shape" is defined independently), so it would be possible to make defining the s* dependent on what loop method is being used.
	function outerFill(matched, order, proc, body) {
	  var dimension = order.length,
	      nargs = proc.arrayArgs.length,
	      blockSize = proc.blockSize,
	      has_index = proc.indexArgs.length > 0,
	      code = [];
	  for (var i = 0; i < nargs; ++i) {
	    code.push(["var offset", i, "=p", i].join(""));
	  }
	  //Generate loops for unmatched dimensions
	  // The order in which these dimensions are traversed is fairly arbitrary (from small stride to large stride, for the first argument)
	  // TODO: It would be nice if the order in which these loops are placed would also be somehow "optimal" (at the very least we should check that it really doesn't hurt us if they're not).
	  for (var i = matched; i < dimension; ++i) {
	    code.push(["for(var j" + i + "=SS[", order[i], "]|0;j", i, ">0;){"].join("")); // Iterate back to front
	    code.push(["if(j", i, "<", blockSize, "){"].join("")); // Either decrease j by blockSize (s = blockSize), or set it to zero (after setting s = j).
	    code.push(["s", order[i], "=j", i].join(""));
	    code.push(["j", i, "=0"].join(""));
	    code.push(["}else{s", order[i], "=", blockSize].join(""));
	    code.push(["j", i, "-=", blockSize, "}"].join(""));
	    if (has_index) {
	      code.push(["index[", order[i], "]=j", i].join(""));
	    }
	  }
	  for (var i = 0; i < nargs; ++i) {
	    var indexStr = ["offset" + i];
	    for (var j = matched; j < dimension; ++j) {
	      indexStr.push(["j", j, "*t", i, "p", order[j]].join(""));
	    }
	    code.push(["p", i, "=(", indexStr.join("+"), ")"].join(""));
	  }
	  code.push(innerFill(order, proc, body));
	  for (var i = matched; i < dimension; ++i) {
	    code.push("}");
	  }
	  return code.join("\n");
	}

	//Count the number of compatible inner orders
	// This is the length of the longest common prefix of the arrays in orders.
	// Each array in orders lists the dimensions of the correspond ndarray in order of increasing stride.
	// This is thus the maximum number of dimensions that can be efficiently traversed by simple nested loops for all arrays.
	function countMatches(orders) {
	  var matched = 0,
	      dimension = orders[0].length;
	  while (matched < dimension) {
	    for (var j = 1; j < orders.length; ++j) {
	      if (orders[j][matched] !== orders[0][matched]) {
	        return matched;
	      }
	    }
	    ++matched;
	  }
	  return matched;
	}

	//Processes a block according to the given data types
	// Replaces variable names by different ones, either "local" ones (that are then ferried in and out of the given array) or ones matching the arguments that the function performing the ultimate loop will accept.
	function processBlock(block, proc, dtypes) {
	  var code = block.body;
	  var pre = [];
	  var post = [];
	  for (var i = 0; i < block.args.length; ++i) {
	    var carg = block.args[i];
	    if (carg.count <= 0) {
	      continue;
	    }
	    var re = new RegExp(carg.name, "g");
	    var ptrStr = "";
	    var arrNum = proc.arrayArgs.indexOf(i);
	    switch (proc.argTypes[i]) {
	      case "offset":
	        var offArgIndex = proc.offsetArgIndex.indexOf(i);
	        var offArg = proc.offsetArgs[offArgIndex];
	        arrNum = offArg.array;
	        ptrStr = "+q" + offArgIndex; // Adds offset to the "pointer" in the array
	      case "array":
	        ptrStr = "p" + arrNum + ptrStr;
	        var localStr = "l" + i;
	        var arrStr = "a" + arrNum;
	        if (proc.arrayBlockIndices[arrNum] === 0) {
	          // Argument to body is just a single value from this array
	          if (carg.count === 1) {
	            // Argument/array used only once(?)
	            if (dtypes[arrNum] === "generic") {
	              if (carg.lvalue) {
	                pre.push(["var ", localStr, "=", arrStr, ".get(", ptrStr, ")"].join("")); // Is this necessary if the argument is ONLY used as an lvalue? (keep in mind that we can have a += something, so we would actually need to check carg.rvalue)
	                code = code.replace(re, localStr);
	                post.push([arrStr, ".set(", ptrStr, ",", localStr, ")"].join(""));
	              } else {
	                code = code.replace(re, [arrStr, ".get(", ptrStr, ")"].join(""));
	              }
	            } else {
	              code = code.replace(re, [arrStr, "[", ptrStr, "]"].join(""));
	            }
	          } else if (dtypes[arrNum] === "generic") {
	            pre.push(["var ", localStr, "=", arrStr, ".get(", ptrStr, ")"].join("")); // TODO: Could we optimize by checking for carg.rvalue?
	            code = code.replace(re, localStr);
	            if (carg.lvalue) {
	              post.push([arrStr, ".set(", ptrStr, ",", localStr, ")"].join(""));
	            }
	          } else {
	            pre.push(["var ", localStr, "=", arrStr, "[", ptrStr, "]"].join("")); // TODO: Could we optimize by checking for carg.rvalue?
	            code = code.replace(re, localStr);
	            if (carg.lvalue) {
	              post.push([arrStr, "[", ptrStr, "]=", localStr].join(""));
	            }
	          }
	        } else {
	          // Argument to body is a "block"
	          var reStrArr = [carg.name],
	              ptrStrArr = [ptrStr];
	          for (var j = 0; j < Math.abs(proc.arrayBlockIndices[arrNum]); j++) {
	            reStrArr.push("\\s*\\[([^\\]]+)\\]");
	            ptrStrArr.push("$" + (j + 1) + "*t" + arrNum + "b" + j); // Matched index times stride
	          }
	          re = new RegExp(reStrArr.join(""), "g");
	          ptrStr = ptrStrArr.join("+");
	          if (dtypes[arrNum] === "generic") {
	            /*if(carg.lvalue) {
	              pre.push(["var ", localStr, "=", arrStr, ".get(", ptrStr, ")"].join("")) // Is this necessary if the argument is ONLY used as an lvalue? (keep in mind that we can have a += something, so we would actually need to check carg.rvalue)
	              code = code.replace(re, localStr)
	              post.push([arrStr, ".set(", ptrStr, ",", localStr,")"].join(""))
	            } else {
	              code = code.replace(re, [arrStr, ".get(", ptrStr, ")"].join(""))
	            }*/
	            throw new Error("cwise: Generic arrays not supported in combination with blocks!");
	          } else {
	            // This does not produce any local variables, even if variables are used multiple times. It would be possible to do so, but it would complicate things quite a bit.
	            code = code.replace(re, [arrStr, "[", ptrStr, "]"].join(""));
	          }
	        }
	        break;
	      case "scalar":
	        code = code.replace(re, "Y" + proc.scalarArgs.indexOf(i));
	        break;
	      case "index":
	        code = code.replace(re, "index");
	        break;
	      case "shape":
	        code = code.replace(re, "shape");
	        break;
	    }
	  }
	  return [pre.join("\n"), code, post.join("\n")].join("\n").trim();
	}

	function typeSummary(dtypes) {
	  var summary = new Array(dtypes.length);
	  var allEqual = true;
	  for (var i = 0; i < dtypes.length; ++i) {
	    var t = dtypes[i];
	    var digits = t.match(/\d+/);
	    if (!digits) {
	      digits = "";
	    } else {
	      digits = digits[0];
	    }
	    if (t.charAt(0) === 0) {
	      summary[i] = "u" + t.charAt(1) + digits;
	    } else {
	      summary[i] = t.charAt(0) + digits;
	    }
	    if (i > 0) {
	      allEqual = allEqual && summary[i] === summary[i - 1];
	    }
	  }
	  if (allEqual) {
	    return summary[0];
	  }
	  return summary.join("");
	}

	//Generates a cwise operator
	function generateCWiseOp(proc, typesig) {

	  //Compute dimension
	  // Arrays get put first in typesig, and there are two entries per array (dtype and order), so this gets the number of dimensions in the first array arg.
	  var dimension = typesig[1].length - Math.abs(proc.arrayBlockIndices[0]) | 0;
	  var orders = new Array(proc.arrayArgs.length);
	  var dtypes = new Array(proc.arrayArgs.length);
	  for (var i = 0; i < proc.arrayArgs.length; ++i) {
	    dtypes[i] = typesig[2 * i];
	    orders[i] = typesig[2 * i + 1];
	  }

	  //Determine where block and loop indices start and end
	  var blockBegin = [],
	      blockEnd = []; // These indices are exposed as blocks
	  var loopBegin = [],
	      loopEnd = []; // These indices are iterated over
	  var loopOrders = []; // orders restricted to the loop indices
	  for (var i = 0; i < proc.arrayArgs.length; ++i) {
	    if (proc.arrayBlockIndices[i] < 0) {
	      loopBegin.push(0);
	      loopEnd.push(dimension);
	      blockBegin.push(dimension);
	      blockEnd.push(dimension + proc.arrayBlockIndices[i]);
	    } else {
	      loopBegin.push(proc.arrayBlockIndices[i]); // Non-negative
	      loopEnd.push(proc.arrayBlockIndices[i] + dimension);
	      blockBegin.push(0);
	      blockEnd.push(proc.arrayBlockIndices[i]);
	    }
	    var newOrder = [];
	    for (var j = 0; j < orders[i].length; j++) {
	      if (loopBegin[i] <= orders[i][j] && orders[i][j] < loopEnd[i]) {
	        newOrder.push(orders[i][j] - loopBegin[i]); // If this is a loop index, put it in newOrder, subtracting loopBegin, to make sure that all loopOrders are using a common set of indices.
	      }
	    }
	    loopOrders.push(newOrder);
	  }

	  //First create arguments for procedure
	  var arglist = ["SS"]; // SS is the overall shape over which we iterate
	  var code = ["'use strict'"];
	  var vars = [];

	  for (var j = 0; j < dimension; ++j) {
	    vars.push(["s", j, "=SS[", j, "]"].join("")); // The limits for each dimension.
	  }
	  for (var i = 0; i < proc.arrayArgs.length; ++i) {
	    arglist.push("a" + i); // Actual data array
	    arglist.push("t" + i); // Strides
	    arglist.push("p" + i); // Offset in the array at which the data starts (also used for iterating over the data)

	    for (var j = 0; j < dimension; ++j) {
	      // Unpack the strides into vars for looping
	      vars.push(["t", i, "p", j, "=t", i, "[", loopBegin[i] + j, "]"].join(""));
	    }

	    for (var j = 0; j < Math.abs(proc.arrayBlockIndices[i]); ++j) {
	      // Unpack the strides into vars for block iteration
	      vars.push(["t", i, "b", j, "=t", i, "[", blockBegin[i] + j, "]"].join(""));
	    }
	  }
	  for (var i = 0; i < proc.scalarArgs.length; ++i) {
	    arglist.push("Y" + i);
	  }
	  if (proc.shapeArgs.length > 0) {
	    vars.push("shape=SS.slice(0)"); // Makes the shape over which we iterate available to the user defined functions (so you can use width/height for example)
	  }
	  if (proc.indexArgs.length > 0) {
	    // Prepare an array to keep track of the (logical) indices, initialized to dimension zeroes.
	    var zeros = new Array(dimension);
	    for (var i = 0; i < dimension; ++i) {
	      zeros[i] = "0";
	    }
	    vars.push(["index=[", zeros.join(","), "]"].join(""));
	  }
	  for (var i = 0; i < proc.offsetArgs.length; ++i) {
	    // Offset arguments used for stencil operations
	    var off_arg = proc.offsetArgs[i];
	    var init_string = [];
	    for (var j = 0; j < off_arg.offset.length; ++j) {
	      if (off_arg.offset[j] === 0) {
	        continue;
	      } else if (off_arg.offset[j] === 1) {
	        init_string.push(["t", off_arg.array, "p", j].join(""));
	      } else {
	        init_string.push([off_arg.offset[j], "*t", off_arg.array, "p", j].join(""));
	      }
	    }
	    if (init_string.length === 0) {
	      vars.push("q" + i + "=0");
	    } else {
	      vars.push(["q", i, "=", init_string.join("+")].join(""));
	    }
	  }

	  //Prepare this variables
	  var thisVars = uniq([].concat(proc.pre.thisVars).concat(proc.body.thisVars).concat(proc.post.thisVars));
	  vars = vars.concat(thisVars);
	  code.push("var " + vars.join(","));
	  for (var i = 0; i < proc.arrayArgs.length; ++i) {
	    code.push("p" + i + "|=0");
	  }

	  //Inline prelude
	  if (proc.pre.body.length > 3) {
	    code.push(processBlock(proc.pre, proc, dtypes));
	  }

	  //Process body
	  var body = processBlock(proc.body, proc, dtypes);
	  var matched = countMatches(loopOrders);
	  if (matched < dimension) {
	    code.push(outerFill(matched, loopOrders[0], proc, body)); // TODO: Rather than passing loopOrders[0], it might be interesting to look at passing an order that represents the majority of the arguments for example.
	  } else {
	      code.push(innerFill(loopOrders[0], proc, body));
	    }

	  //Inline epilog
	  if (proc.post.body.length > 3) {
	    code.push(processBlock(proc.post, proc, dtypes));
	  }

	  if (proc.debug) {
	    console.log("-----Generated cwise routine for ", typesig, ":\n" + code.join("\n") + "\n----------");
	  }

	  var loopName = [proc.funcName || "unnamed", "_cwise_loop_", orders[0].join("s"), "m", matched, typeSummary(dtypes)].join("");
	  var f = new Function(["function ", loopName, "(", arglist.join(","), "){", code.join("\n"), "} return ", loopName].join(""));
	  return f();
	}
	module.exports = generateCWiseOp;

/***/ },
/* 44 */
/***/ function(module, exports) {

	"use strict";

	function unique_pred(list, compare) {
	  var ptr = 1,
	      len = list.length,
	      a = list[0],
	      b = list[0];
	  for (var i = 1; i < len; ++i) {
	    b = a;
	    a = list[i];
	    if (compare(a, b)) {
	      if (i === ptr) {
	        ptr++;
	        continue;
	      }
	      list[ptr++] = a;
	    }
	  }
	  list.length = ptr;
	  return list;
	}

	function unique_eq(list) {
	  var ptr = 1,
	      len = list.length,
	      a = list[0],
	      b = list[0];
	  for (var i = 1; i < len; ++i, b = a) {
	    b = a;
	    a = list[i];
	    if (a !== b) {
	      if (i === ptr) {
	        ptr++;
	        continue;
	      }
	      list[ptr++] = a;
	    }
	  }
	  list.length = ptr;
	  return list;
	}

	function unique(list, compare, sorted) {
	  if (list.length === 0) {
	    return list;
	  }
	  if (compare) {
	    if (!sorted) {
	      list.sort(compare);
	    }
	    return unique_pred(list, compare);
	  }
	  if (!sorted) {
	    list.sort();
	  }
	  return unique_eq(list);
	}

	module.exports = unique;

/***/ },
/* 45 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var iota = __webpack_require__(46);
	var isBuffer = __webpack_require__(47);

	var hasTypedArrays = typeof Float64Array !== "undefined";

	function compare1st(a, b) {
	  return a[0] - b[0];
	}

	function order() {
	  var stride = this.stride;
	  var terms = new Array(stride.length);
	  var i;
	  for (i = 0; i < terms.length; ++i) {
	    terms[i] = [Math.abs(stride[i]), i];
	  }
	  terms.sort(compare1st);
	  var result = new Array(terms.length);
	  for (i = 0; i < result.length; ++i) {
	    result[i] = terms[i][1];
	  }
	  return result;
	}

	function compileConstructor(dtype, dimension) {
	  var className = ["View", dimension, "d", dtype].join("");
	  if (dimension < 0) {
	    className = "View_Nil" + dtype;
	  }
	  var useGetters = dtype === "generic";

	  if (dimension === -1) {
	    //Special case for trivial arrays
	    var code = "function " + className + "(a){this.data=a;};\
	var proto=" + className + ".prototype;\
	proto.dtype='" + dtype + "';\
	proto.index=function(){return -1};\
	proto.size=0;\
	proto.dimension=-1;\
	proto.shape=proto.stride=proto.order=[];\
	proto.lo=proto.hi=proto.transpose=proto.step=\
	function(){return new " + className + "(this.data);};\
	proto.get=proto.set=function(){};\
	proto.pick=function(){return null};\
	return function construct_" + className + "(a){return new " + className + "(a);}";
	    var procedure = new Function(code);
	    return procedure();
	  } else if (dimension === 0) {
	    //Special case for 0d arrays
	    var code = "function " + className + "(a,d) {\
	this.data = a;\
	this.offset = d\
	};\
	var proto=" + className + ".prototype;\
	proto.dtype='" + dtype + "';\
	proto.index=function(){return this.offset};\
	proto.dimension=0;\
	proto.size=1;\
	proto.shape=\
	proto.stride=\
	proto.order=[];\
	proto.lo=\
	proto.hi=\
	proto.transpose=\
	proto.step=function " + className + "_copy() {\
	return new " + className + "(this.data,this.offset)\
	};\
	proto.pick=function " + className + "_pick(){\
	return TrivialArray(this.data);\
	};\
	proto.valueOf=proto.get=function " + className + "_get(){\
	return " + (useGetters ? "this.data.get(this.offset)" : "this.data[this.offset]") + "};\
	proto.set=function " + className + "_set(v){\
	return " + (useGetters ? "this.data.set(this.offset,v)" : "this.data[this.offset]=v") + "\
	};\
	return function construct_" + className + "(a,b,c,d){return new " + className + "(a,d)}";
	    var procedure = new Function("TrivialArray", code);
	    return procedure(CACHED_CONSTRUCTORS[dtype][0]);
	  }

	  var code = ["'use strict'"];

	  //Create constructor for view
	  var indices = iota(dimension);
	  var args = indices.map(function (i) {
	    return "i" + i;
	  });
	  var index_str = "this.offset+" + indices.map(function (i) {
	    return "this.stride[" + i + "]*i" + i;
	  }).join("+");
	  var shapeArg = indices.map(function (i) {
	    return "b" + i;
	  }).join(",");
	  var strideArg = indices.map(function (i) {
	    return "c" + i;
	  }).join(",");
	  code.push("function " + className + "(a," + shapeArg + "," + strideArg + ",d){this.data=a", "this.shape=[" + shapeArg + "]", "this.stride=[" + strideArg + "]", "this.offset=d|0}", "var proto=" + className + ".prototype", "proto.dtype='" + dtype + "'", "proto.dimension=" + dimension);

	  //view.size:
	  code.push("Object.defineProperty(proto,'size',{get:function " + className + "_size(){\
	return " + indices.map(function (i) {
	    return "this.shape[" + i + "]";
	  }).join("*"), "}})");

	  //view.order:
	  if (dimension === 1) {
	    code.push("proto.order=[0]");
	  } else {
	    code.push("Object.defineProperty(proto,'order',{get:");
	    if (dimension < 4) {
	      code.push("function " + className + "_order(){");
	      if (dimension === 2) {
	        code.push("return (Math.abs(this.stride[0])>Math.abs(this.stride[1]))?[1,0]:[0,1]}})");
	      } else if (dimension === 3) {
	        code.push("var s0=Math.abs(this.stride[0]),s1=Math.abs(this.stride[1]),s2=Math.abs(this.stride[2]);\
	if(s0>s1){\
	if(s1>s2){\
	return [2,1,0];\
	}else if(s0>s2){\
	return [1,2,0];\
	}else{\
	return [1,0,2];\
	}\
	}else if(s0>s2){\
	return [2,0,1];\
	}else if(s2>s1){\
	return [0,1,2];\
	}else{\
	return [0,2,1];\
	}}})");
	      }
	    } else {
	      code.push("ORDER})");
	    }
	  }

	  //view.set(i0, ..., v):
	  code.push("proto.set=function " + className + "_set(" + args.join(",") + ",v){");
	  if (useGetters) {
	    code.push("return this.data.set(" + index_str + ",v)}");
	  } else {
	    code.push("return this.data[" + index_str + "]=v}");
	  }

	  //view.get(i0, ...):
	  code.push("proto.get=function " + className + "_get(" + args.join(",") + "){");
	  if (useGetters) {
	    code.push("return this.data.get(" + index_str + ")}");
	  } else {
	    code.push("return this.data[" + index_str + "]}");
	  }

	  //view.index:
	  code.push("proto.index=function " + className + "_index(", args.join(), "){return " + index_str + "}");

	  //view.hi():
	  code.push("proto.hi=function " + className + "_hi(" + args.join(",") + "){return new " + className + "(this.data," + indices.map(function (i) {
	    return ["(typeof i", i, "!=='number'||i", i, "<0)?this.shape[", i, "]:i", i, "|0"].join("");
	  }).join(",") + "," + indices.map(function (i) {
	    return "this.stride[" + i + "]";
	  }).join(",") + ",this.offset)}");

	  //view.lo():
	  var a_vars = indices.map(function (i) {
	    return "a" + i + "=this.shape[" + i + "]";
	  });
	  var c_vars = indices.map(function (i) {
	    return "c" + i + "=this.stride[" + i + "]";
	  });
	  code.push("proto.lo=function " + className + "_lo(" + args.join(",") + "){var b=this.offset,d=0," + a_vars.join(",") + "," + c_vars.join(","));
	  for (var i = 0; i < dimension; ++i) {
	    code.push("if(typeof i" + i + "==='number'&&i" + i + ">=0){\
	d=i" + i + "|0;\
	b+=c" + i + "*d;\
	a" + i + "-=d}");
	  }
	  code.push("return new " + className + "(this.data," + indices.map(function (i) {
	    return "a" + i;
	  }).join(",") + "," + indices.map(function (i) {
	    return "c" + i;
	  }).join(",") + ",b)}");

	  //view.step():
	  code.push("proto.step=function " + className + "_step(" + args.join(",") + "){var " + indices.map(function (i) {
	    return "a" + i + "=this.shape[" + i + "]";
	  }).join(",") + "," + indices.map(function (i) {
	    return "b" + i + "=this.stride[" + i + "]";
	  }).join(",") + ",c=this.offset,d=0,ceil=Math.ceil");
	  for (var i = 0; i < dimension; ++i) {
	    code.push("if(typeof i" + i + "==='number'){\
	d=i" + i + "|0;\
	if(d<0){\
	c+=b" + i + "*(a" + i + "-1);\
	a" + i + "=ceil(-a" + i + "/d)\
	}else{\
	a" + i + "=ceil(a" + i + "/d)\
	}\
	b" + i + "*=d\
	}");
	  }
	  code.push("return new " + className + "(this.data," + indices.map(function (i) {
	    return "a" + i;
	  }).join(",") + "," + indices.map(function (i) {
	    return "b" + i;
	  }).join(",") + ",c)}");

	  //view.transpose():
	  var tShape = new Array(dimension);
	  var tStride = new Array(dimension);
	  for (var i = 0; i < dimension; ++i) {
	    tShape[i] = "a[i" + i + "]";
	    tStride[i] = "b[i" + i + "]";
	  }
	  code.push("proto.transpose=function " + className + "_transpose(" + args + "){" + args.map(function (n, idx) {
	    return n + "=(" + n + "===undefined?" + idx + ":" + n + "|0)";
	  }).join(";"), "var a=this.shape,b=this.stride;return new " + className + "(this.data," + tShape.join(",") + "," + tStride.join(",") + ",this.offset)}");

	  //view.pick():
	  code.push("proto.pick=function " + className + "_pick(" + args + "){var a=[],b=[],c=this.offset");
	  for (var i = 0; i < dimension; ++i) {
	    code.push("if(typeof i" + i + "==='number'&&i" + i + ">=0){c=(c+this.stride[" + i + "]*i" + i + ")|0}else{a.push(this.shape[" + i + "]);b.push(this.stride[" + i + "])}");
	  }
	  code.push("var ctor=CTOR_LIST[a.length+1];return ctor(this.data,a,b,c)}");

	  //Add return statement
	  code.push("return function construct_" + className + "(data,shape,stride,offset){return new " + className + "(data," + indices.map(function (i) {
	    return "shape[" + i + "]";
	  }).join(",") + "," + indices.map(function (i) {
	    return "stride[" + i + "]";
	  }).join(",") + ",offset)}");

	  //Compile procedure
	  var procedure = new Function("CTOR_LIST", "ORDER", code.join("\n"));
	  return procedure(CACHED_CONSTRUCTORS[dtype], order);
	}

	function arrayDType(data) {
	  if (isBuffer(data)) {
	    return "buffer";
	  }
	  if (hasTypedArrays) {
	    switch (Object.prototype.toString.call(data)) {
	      case "[object Float64Array]":
	        return "float64";
	      case "[object Float32Array]":
	        return "float32";
	      case "[object Int8Array]":
	        return "int8";
	      case "[object Int16Array]":
	        return "int16";
	      case "[object Int32Array]":
	        return "int32";
	      case "[object Uint8Array]":
	        return "uint8";
	      case "[object Uint16Array]":
	        return "uint16";
	      case "[object Uint32Array]":
	        return "uint32";
	      case "[object Uint8ClampedArray]":
	        return "uint8_clamped";
	    }
	  }
	  if (Array.isArray(data)) {
	    return "array";
	  }
	  return "generic";
	}

	var CACHED_CONSTRUCTORS = {
	  "float32": [],
	  "float64": [],
	  "int8": [],
	  "int16": [],
	  "int32": [],
	  "uint8": [],
	  "uint16": [],
	  "uint32": [],
	  "array": [],
	  "uint8_clamped": [],
	  "buffer": [],
	  "generic": []
	};(function () {
	  for (var id in CACHED_CONSTRUCTORS) {
	    CACHED_CONSTRUCTORS[id].push(compileConstructor(id, -1));
	  }
	});

	function wrappedNDArrayCtor(data, shape, stride, offset) {
	  if (data === undefined) {
	    var ctor = CACHED_CONSTRUCTORS.array[0];
	    return ctor([]);
	  } else if (typeof data === "number") {
	    data = [data];
	  }
	  if (shape === undefined) {
	    shape = [data.length];
	  }
	  var d = shape.length;
	  if (stride === undefined) {
	    stride = new Array(d);
	    for (var i = d - 1, sz = 1; i >= 0; --i) {
	      stride[i] = sz;
	      sz *= shape[i];
	    }
	  }
	  if (offset === undefined) {
	    offset = 0;
	    for (var i = 0; i < d; ++i) {
	      if (stride[i] < 0) {
	        offset -= (shape[i] - 1) * stride[i];
	      }
	    }
	  }
	  var dtype = arrayDType(data);
	  var ctor_list = CACHED_CONSTRUCTORS[dtype];
	  while (ctor_list.length <= d + 1) {
	    ctor_list.push(compileConstructor(dtype, ctor_list.length - 1));
	  }
	  var ctor = ctor_list[d + 1];
	  return ctor(data, shape, stride, offset);
	}

	module.exports = wrappedNDArrayCtor;

/***/ },
/* 46 */
/***/ function(module, exports) {

	"use strict";

	function iota(n) {
	  var result = new Array(n);
	  for (var i = 0; i < n; ++i) {
	    result[i] = i;
	  }
	  return result;
	}

	module.exports = iota;

/***/ },
/* 47 */
/***/ function(module, exports) {

	/**
	 * Determine if an object is Buffer
	 *
	 * Author:   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
	 * License:  MIT
	 *
	 * `npm install is-buffer`
	 */

	'use strict';

	module.exports = function (obj) {
	  return !!(obj != null && obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj));
	};

/***/ },
/* 48 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var platonic = {};

	platonic.tetrahedron = __webpack_require__(49);
	platonic.cube = __webpack_require__(50);
	platonic.octahedron = __webpack_require__(52);
	platonic.dodecahedron = __webpack_require__(53);
	platonic.icosahedron = __webpack_require__(54);

	module.exports = platonic;

/***/ },
/* 49 */
/***/ function(module, exports) {

	"use strict";

	// Stub

/***/ },
/* 50 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	var vec3 = __webpack_require__(13).vec3;

	var util = __webpack_require__(51);

	module.exports = function createCube() {
	  var inputOpts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	  var opts = _extends({
	    flattened: true,
	    normals: true,
	    sharedVertices: true
	  }, inputOpts);

	  var len = 1 / Math.sqrt(3);

	  var v1 = vec3.fromValues(len, len, len);
	  var v2 = vec3.fromValues(-len, len, len);
	  var v3 = vec3.fromValues(-len, -len, len);
	  var v4 = vec3.fromValues(len, -len, len);
	  var v5 = vec3.fromValues(len, -len, -len);
	  var v6 = vec3.fromValues(len, len, -len);
	  var v7 = vec3.fromValues(-len, len, -len);
	  var v8 = vec3.fromValues(-len, -len, -len);

	  var vertices = [v1, v2, v3, v4, v5, v6, v7, v8];

	  var triangles = [];

	  // Front
	  triangles.push([0, 1, 2]);
	  triangles.push([0, 2, 3]);

	  // Right
	  triangles.push([5, 0, 3]);
	  triangles.push([5, 3, 4]);

	  // Bottom
	  triangles.push([3, 2, 7]);
	  triangles.push([3, 7, 4]);

	  // Left
	  triangles.push([1, 6, 7]);
	  triangles.push([1, 7, 2]);

	  // Back
	  triangles.push([6, 5, 4]);
	  triangles.push([6, 4, 7]);

	  // Top
	  triangles.push([5, 6, 1]);
	  triangles.push([5, 1, 0]);

	  var normals = [];

	  if (opts.sharedVertices) {
	    if (opts.normals) {
	      // When the shape is inscribed in the unit sphere, the vertex normals are the same as the vertices!
	      normals = vertices.map(function (v) {
	        return vec3.clone(v);
	      });
	    }
	  } else {
	    var _util$splitVertices = util.splitVertices(vertices, triangles);

	    var _util$splitVertices2 = _slicedToArray(_util$splitVertices, 2);

	    vertices = _util$splitVertices2[0];
	    triangles = _util$splitVertices2[1];

	    if (opts.normals) {
	      normals = util.genFaceNormalsPerVertex(vertices, triangles);
	    }

	    console.log(vertices, triangles, normals);
	  }

	  if (opts.flattened) {
	    vertices = util.flatten(vertices);
	    normals = util.flatten(normals);
	    triangles = util.flatten(triangles);
	  }

	  return {
	    vertices: vertices,
	    normals: normals,
	    indices: triangles,
	    indexCount: 36
	  };
	};

/***/ },
/* 51 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});

	var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

	exports.genAvgNormals = genAvgNormals;
	exports.genFaceNormals = genFaceNormals;
	exports.genFaceNormalsPerVertex = genFaceNormalsPerVertex;
	exports.splitVertices = splitVertices;
	exports.flatten = flatten;

	var _glMatrix = __webpack_require__(13);

	// Accepts an array of vertices and an array of three indices into the vertices array,
	// and returns the normal of the resulting triangle.
	function getNormal(vertices, _ref) {
	  var _ref2 = _slicedToArray(_ref, 3);

	  var iA = _ref2[0];
	  var iB = _ref2[1];
	  var iC = _ref2[2];

	  var v0 = vertices[iA];
	  var v1 = vertices[iB];
	  var v2 = vertices[iC];

	  // for triangle ABC (assuming that's in counter-clockwise order)
	  // compute the normal as AB x AC
	  var s1 = _glMatrix.vec3.sub(_glMatrix.vec3.create(), v1, v0);
	  var s2 = _glMatrix.vec3.sub(_glMatrix.vec3.create(), v2, v0);

	  var normal = _glMatrix.vec3.cross(_glMatrix.vec3.create(), s1, s2);

	  return normal;
	}

	// Generates a list of normals, one for each vertex specified
	// in vertices. The list will be as long as vertices, but is generated for
	// each vertex as the average face normal of all triangles which include
	// that vertex.

	function genAvgNormals(vertices, triangles) {
	  var normalAccum = [];

	  triangles.forEach(function (triangle) {
	    var normal = getNormal(vertices, triangle);

	    triangle.forEach(function (index) {
	      var store = normalAccum[index];

	      if (!store) {
	        store = normalAccum[index] = {
	          nrml: _glMatrix.vec3.create(),
	          count: 0
	        };
	      }

	      _glMatrix.vec3.add(store.nrml, store.nrml, normal);
	      store.count += 1;
	    });
	  });

	  var normals = normalAccum.map(function (store) {
	    return _glMatrix.vec3.scale(store.nrml, store.nrml, 1 / store.count);
	  });

	  return normals;
	}

	// Generates a list of normals, one for each triangle specified in triangles
	// The list will be as long as triangles

	function genFaceNormals(vertices, triangles) {
	  var normals = triangles.map(function (triangle) {
	    return getNormal(vertices, triangle);
	  });

	  return normals;
	}

	// Generates a list of face normals, one for each vertex. Each normal is repeated
	// once for each of the vertices contained in that triangle. The list will be as
	// long as vertices. Note that the vertices you pass in should also be duplicated,
	// one for each triangle. If the same vertex index is visited twice because it's used
	// in more than one triangle, the normal at that index will be that of the second triangle.

	function genFaceNormalsPerVertex(vertices, triangles) {
	  var normals = triangles.reduce(function (list, triangle) {
	    var norm = getNormal(vertices, triangle);

	    list[triangle[0]] = norm;
	    // Clone for other cases
	    list[triangle[1]] = _glMatrix.vec3.clone(norm);
	    list[triangle[2]] = _glMatrix.vec3.clone(norm);

	    return list;
	  }, []);

	  return normals;
	}

	// Takes a list of vertices and a list of triangle groups,
	// returns an expanded list of vertices and an altered list of triangle
	// groups, where each vertex from the original list has been duplicated
	// for each time it appears in a triangle, and the indices that point
	// into the list have been adjusted accordingly

	function splitVertices(vertices, triangles) {
	  var vertexList = [];
	  var triangleList = [];

	  triangles.forEach(function (_ref3) {
	    var _ref32 = _slicedToArray(_ref3, 3);

	    var iA = _ref32[0];
	    var iB = _ref32[1];
	    var iC = _ref32[2];

	    // Clone vertices A, B, and C and add them to the list
	    vertexList.push(_glMatrix.vec3.clone(vertices[iA]));
	    vertexList.push(_glMatrix.vec3.clone(vertices[iB]));
	    vertexList.push(_glMatrix.vec3.clone(vertices[iC]));

	    var len = vertexList.length;
	    triangleList.push([len - 3, len - 2, len - 1]);
	  });

	  return [vertexList, triangleList];
	}

	function flatten(arr) {
	  return arr.reduce(function (red, val) {
	    red.push.apply(red, val);
	    return red;
	  }, []);
	}

/***/ },
/* 52 */
/***/ function(module, exports) {

	"use strict";

	// Stub

/***/ },
/* 53 */
/***/ function(module, exports) {

	"use strict";

	// Stub

/***/ },
/* 54 */
/***/ function(module, exports) {

	"use strict";

	// Stub

/***/ }
/******/ ]);