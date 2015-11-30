'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _varo = require('varo');

var _varo2 = _interopRequireDefault(_varo);

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

var V = (0, _varo2['default'])();

/**
 * Invoke a callback
 */
function invoke(id) {
  this.isPending[id] = true;
  this.callbacks[id](this.pendingPayload);
  this.isHandled[id] = true;
}

/**
 * Set up dispatch action
 */
function start(payload) {
  for (var id in this.callbacks) {
    this.isPending[id] = false;
    this.isHandled[id] = false;
  }
  this.isDispatching = true;
  this.pendingPayload = payload;
}

/**
 * Close dispatch action
 */
function stop() {
  this.isDispatching = false;
  this.pendingPayload = null;
}

var Dispatcher = (function () {
  function Dispatcher() {
    _classCallCheck(this, Dispatcher);

    this.isDispatching = false;
    this.pendingPayload = null;
    this.callbacks = {};
    this.observers = {};
    this.isPending = {};
    this.isHandled = {};
  }

  _createClass(Dispatcher, [{
    key: 'register',
    value: function register(callback) {
      var id = (0, _nodeUuid2['default'])();

      // register an observer that run the specified callback
      var observer = (function (msg) {
        // the callback is already running or is in waitFor status
        if (this.isPending[id]) return;

        // set current payload
        this.pendingPayload = msg.payload;
        invoke.call(this, id);
      }).bind(this);
      V.observe({ role: 'dispatcher' }, observer);

      // keep trace of the callback
      this.callbacks[id] = callback;
      this.observers[id] = observer;

      return id;
    }
  }, {
    key: 'unregister',
    value: function unregister(id) {
      delete this.callbacks[id];
      V.removeObserver(this.observers[id]);
    }
  }, {
    key: 'dispatch',
    value: function dispatch(payload) {
      if (this.isDispatching) {
        if (process.env.NODE_ENV !== 'production') {
          throw new Error('Dispatch.dispatch(...): Cannot dispatch in the middle of a dispatch.');
        }
        return;
      }

      // start dispatching
      start.call(this, payload);

      // emit dispatcher event
      V.emit({ role: 'dispatcher', event: 'dispatch', payload: payload });

      // stop dispatching
      stop.call(this);
    }
  }, {
    key: 'waitFor',
    value: function waitFor(ids) {
      if (!this.isDispatching) {
        if (process.env.NODE_ENV !== 'production') {
          throw new Error('Dispatcher.waitFor(...): Must be invoked while dispatching.');
        }
      }
      for (var ii = 0; ii < ids.length; ii++) {
        var id = ids[ii];
        if (this.isPending[id]) {
          if (!this.isHandled[id]) {
            if (process.env.NODE_ENV !== 'production') {
              throw new Error('Dispatcher.waitFor(...): Circular dependency detected while ' + 'waiting for `' + id + '`.');
            }
          }
          continue;
        }
        if (!this.callbacks[id]) {
          if (process.env.NODE_ENV !== 'production') {
            throw new Error('Dispatcher.waitFor(...): `' + id + '` does not map to a registered callback.');
          }
        }
        invoke.call(this, id);
      }
    }
  }]);

  return Dispatcher;
})();

exports['default'] = Dispatcher;
module.exports = exports['default'];

