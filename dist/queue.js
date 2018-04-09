'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var Queue = require('better-queue');
var MemoryStore = require('better-queue-memory');

var _require = require('./utils'),
    createIdentifier = _require.createIdentifier;

var DEFAULT_OPTIONS = {
  checkOnline: function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              return _context.abrupt('return', true);

            case 1:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, undefined);
    }));

    function checkOnline() {
      return _ref.apply(this, arguments);
    }

    return checkOnline;
  }(), //require('is-online'),
  onChange: function onChange(queue) {}
};

function createQueue(options) {
  var opts = Object.assign({}, DEFAULT_OPTIONS, options);
  var checkOnline = opts.checkOnline;

  var jobs = {};

  var queue = new Queue(function (input, cb) {
    input.promise().then(function (result) {
      return cb(null, result);
    }).catch(function (error) {
      return cb(error, null);
    });
  }, {
    store: new MemoryStore({}),
    id: 'id',
    priority: function priority(job, cb) {
      return cb(null, job.priority || 1);
    },
    maxRetries: 5,
    retryDelay: 1000,
    cancelIfRunning: true,
    precondition: function precondition(cb) {
      return checkOnline().then(function (online) {
        return cb(null, online);
      });
    },
    preconditionRetryTimeout: 10 * 1000,
    concurrent: 5
  });

  queue.on('task_finish', function (taskId, result, stats) {
    jobs[taskId] && delete jobs[taskId];
  });

  queue.on('task_failed', function (taskId, err, stats) {
    jobs[taskId] && delete jobs[taskId];
  });

  function add(promise, priority, opts) {
    var id = createIdentifier();
    var job = queue.push({ id: id, promise: promise, priority: priority });
    job.opts = opts;
    job.id = id;
    job.priority = priority;
    jobs[id] = job;
    return { id: id, job: job };
  }

  function remove(id) {
    queue.push({ id: id });
  }

  function removeAll() {
    Object.keys(jobs).forEach(remove);
  }

  var queueObject = {
    queue: queue,
    jobs: jobs,
    add: add,
    remove: remove,
    removeAll: removeAll
  };

  queue.on('task_queued', function () {
    return opts.onChange(queueObject);
  });
  queue.on('task_accepted', function () {
    return opts.onChange(queueObject);
  });
  queue.on('task_started', function () {
    return opts.onChange(queueObject);
  });
  queue.on('task_finish', function () {
    return opts.onChange(queueObject);
  });
  queue.on('task_failed', function () {
    return opts.onChange(queueObject);
  });
  queue.on('task_progress', function () {
    return opts.onChange(queueObject);
  });

  return queueObject;
}

module.exports = createQueue;