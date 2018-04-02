const { expect } = require('chai');
const createQueue = require('../queue');

describe('queue', () => {
  it('runs a job correctly', done => {
    const queue = createQueue({
      onChange: q => console.log('jobs', q.jobs)
    });
    const promise = () =>
      new Promise(resolve => {
        setTimeout(() => resolve(5), 1000);
      });
    const { job } = queue.add(promise);
    job.on('finish', result => {
      expect(result).to.equal(5);
      done();
    });
  });

  it('runs priority job correctly', done => {
    const queue = createQueue();
    let firstResult = null;
    const { job: job1 } = queue.add(() => Promise.resolve(1));
    const { job: job2 } = queue.add(() => Promise.resolve(2), 10);
    job2.on('finish', () => {
      expect(firstResult).to.be.null;
      done();
    });
  });

  it('removes job from the queue', done => {
    const queue = createQueue();
    let firstResult = null;
    const { job: job1 } = queue.add(() => Promise.resolve(1));
    const { id, job: job2 } = queue.add(() => Promise.resolve(2), 10);
    queue.remove(id);
    job1.on('finish', () => {
      expect(firstResult).to.be.null;
      done();
    });
  });

  it('adds jobs to the queue', () => {
    const queue = createQueue();
    const { job: job1 } = queue.add(() => Promise.resolve(1));
    const { job: job2 } = queue.add(() => Promise.resolve(2), 10);
    expect(Object.values(queue.jobs).length).to.equal(2);
  });

  it('passes job options correctly', () => {
    const queue = createQueue();
    const opts = { name: 'something' };
    const { id, job } = queue.add(() => Promise.resolve(1), 99, opts);
    expect(job.opts).to.deep.equal(opts);
    expect(job.id).to.equal(id);
    expect(job.priority).to.equal(99);
  });
});
