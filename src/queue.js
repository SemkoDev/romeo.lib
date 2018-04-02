const Queue = require('better-queue');
const MemoryStore = require('better-queue-memory');
const { createIdentifier } = require('./utils');

const DEFAULT_OPTIONS = {
  checkOnline: require('is-online'),
  onChange: queue => {}
};

function createQueue(options) {
  const opts = Object.assign({}, DEFAULT_OPTIONS, options);
  const { checkOnline } = opts;
  const jobs = {};

  const queue = new Queue(
    (input, cb) => {
      input
        .promise()
        .then(result => cb(null, result))
        .catch(error => cb(error, null));
    },
    {
      store: new MemoryStore({}),
      id: 'id',
      priority: (job, cb) => cb(null, job.priority || 1),
      maxRetries: 5,
      retryDelay: 1000,
      cancelIfRunning: true,
      precondition: cb => checkOnline().then(online => cb(null, online)),
      preconditionRetryTimeout: 10 * 1000,
      concurrent: 5
    }
  );

  queue.on('task_finish', (taskId, result, stats) => {
    jobs[taskId] && delete jobs[taskId];
  });

  queue.on('task_failed', (taskId, err, stats) => {
    jobs[taskId] && delete jobs[taskId];
  });

  function add(promise, priority, opts) {
    const id = createIdentifier();
    const job = queue.push({ id, promise, priority });
    job.opts = opts;
    job.id = id;
    job.priority = priority;
    jobs[id] = job;
    return { id, job };
  }

  function remove(id) {
    queue.push({ id });
  }

  function removeAll() {
    Object.keys(jobs).forEach(remove);
  }

  const queueObject = {
    queue,
    jobs,
    add,
    remove,
    removeAll
  };

  queue.on('task_queued', () => opts.onChange(queueObject));
  queue.on('task_accepted', () => opts.onChange(queueObject));
  queue.on('task_started', () => opts.onChange(queueObject));
  queue.on('task_finish', () => opts.onChange(queueObject));
  queue.on('task_failed', () => opts.onChange(queueObject));
  queue.on('task_progress', () => opts.onChange(queueObject));

  return queueObject;
}

module.exports = createQueue;
