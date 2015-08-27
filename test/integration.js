/* globals before, describe, it, beforeEach, after, afterEach */

var mongoCfg = 'localhost:27017/agenda-test';

var expect = require('expect.js'),
    path = require('path'),
    mongo = require('mongoskin').db('mongodb://' + mongoCfg, {w: 0}),
    Agenda = require( path.join('..', 'index.js') );

// create agenda instance
var jobs = new Agenda({
  processEvery: '0.1 seconds',
  db: {
    address: mongoCfg
  }
});

var jobType = 'do werk';
jobs.define(jobType, function(job, done) {
  done();
});

function failOnError(err) {
  if (err) {
    throw err;
  }
}

describe("mongo persistence", function() {
  beforeEach(function(done) {
    mongo.collection('agendaJobs').remove({}, function(err) {
      failOnError(err);
      jobs.start();
      done();
    });
  });

  afterEach(function(done) {
    jobs.stop(done);
  });

  it("saves scheduled job to db", function(done) {
    jobs
      .create(jobType, {})
      .schedule('in 10 minutes')
      .save(function(err) {
        failOnError(err);

        mongo.collection('agendaJobs').find().toArray(function(err, arr) {
          failOnError(err);
          expect(arr).to.have.length(1);
          done();
        });
      });
  });

  it("clears jobs after completion", function(done) {
    jobs
      .create(jobType, {})
      .schedule('now')
      .save(function(err) {
        failOnError(err);

        mongo.collection('agendaJobs').find().toArray(function(err, arr) {
          failOnError(err);
          expect(arr).to.have.length(1);
        });

        jobs.on('complete', function() {
          mongo.collection('agendaJobs').find().toArray(function(err, arr) {
            failOnError(err);
            expect(arr).to.have.length(0);
            done();
          });
        });
      });
  });
});