'use strict';

module.exports = function(grunt) {
  var prompt = require('prompt');
  var branch = require('./lib/branch');
  var log = require('./lib/log').log;
  var Q = require('q');

  // Set up the Github connection for pull requests
  var GithubAPI = require("github");
  var github = new GithubAPI({
      // required
      version: "3.0.0",
      // optional
      timeout: 5000
  });

  var Feature = {};
  Feature.create = function(name, options, callback){
    var name = 'feature/' + name;

    Q.fcall(log, 'asdf').then(log, 'asdf');

    Q.fcall(branch.update, 'master', { upstream: true })
    .invoke(branch.create, name, { base: 'master' })
    .invoke(branch.push, name, {})
    .invoke(branch.track, name, {})
    .then(callback, callback);

      // branch.create(name, { base: 'master' }, function(){
      //   branch.push(name, {}, function(){
      //     branch.track(name, {}, function(err){
      //       callback(err);
      //     });
      //   });
      // });


    // branch.update('master', { upstream: true }, function(){
    //   branch.create(name, { base: 'master' }, function(){
    //     branch.push(name, {}, function(){
    //       branch.track(name, {}, function(err){
    //         callback(err);
    //       });
    //     });
    //   });
    // });
  }

  grunt.registerTask('feature', 'Creating distribution', function(action, option, option2){
    var done = this.async();
    var errorCallback = function(err){
      grunt.log.error(err);
      return done(false);
    };

    // Start a new feature
    if (action === 'start') {
      var startCallback = function(err){
        if (err) { return errorCallback(err); }
        log('Ready to start building your feature!');
        done(true);
      };

      if (!option) {
        prompt.start();
        prompt.get({
          name: 'name',
          message: '\nName of the feature:',
          validator: /^[a-z0-9\-]+$/,
          warning: 'Names can only contain dashes, 0-9, and a-z',
          required: true
        }, function (err, result) {
          if (err) { return errorCallback(err); };
          Feature.create(result.name, {}, startCallback);
        });
      } else {
        Feature.create(option, {}, startCallback);
      }

    // Delete a feature
    } else if (action === 'delete') {
      var branchName = (option) ? 'feature/'+option : false;

      var deleteCallback = function(err){
        if (err) { return errorCallback(err); }
        log('Feature deleted');
        done(true);
      };

      branch.current(function(err, info){
        var name = branchName || info.name;

        if (err) { return errorCallback(err); }
        if (info.changeType !== 'feature') {
          return errorCallback('You are not in a feature branch');
        }

        prompt.start();
        prompt.get({
          name: 'yesno',
          message: '\nAre you sure you want to delete '+name+'?',
          validator: /y[es]*|n[o]?/,
          warning: 'Must respond yes or no',
          'default': 'no'
        }, function (err, result) {
          if (err) { errorCallback(err); }

          if (result.yesno === 'yes' || result.yesno === 'y') {
            branch.checkout('master', {}, function(){
              branch.deleteLocal(name, {}, function(){
                branch.deleteRemote(name, {}, function(err){
                  deleteCallback(err);
                });
              });
            });
          } else {
            deleteCallback('Delete branch aborted');
          }
        });
      });

    // Submit a feature via pull request
    } else if (action === 'submit') {
      // feature submit:zencoder:master
      var upstreamOwner = option || 'heff2';
      var baseBranchName = option2 || 'master';
      var submitCallback = function(err){
        if (err) { return errorCallback(err); }
        log('Feature submitted!');
        done(true);
      };

      branch.current(function(err, info){
        if (err) { return errorCallback(err); }

        var branchName = info.name;
        // Ask for Github credentials
        var schema = {
          properties: {
            username: {
              description: 'Github Username',
              pattern: /^[a-zA-Z\s\-]+$/,
              message: 'Name must be only letters, spaces, or dashes',
              required: true
            },
            password: {
              description: 'Github Password',
              hidden: true,
              required: true
            },
            title: {
              description: 'Please title the pull request',
              required: true
            },
            body: {
              description: 'Please describe the feature',
              required: false
            }
          }
        };

        prompt.start();
        prompt.get(schema, function (err, result) {
          if (err) { return errorCallback(err); }

          // Authentication is synchronus and only works for the next API call
          // This could be changed to store a token, which is how zenflow does it
          github.authenticate({
              type: "basic",
              username: result.username,
              password: result.password
          });

          github.pullRequests.create({
            user: upstreamOwner,
            repo: 'video-js',
            title: result.title,
            body: result.body,
            head: result.username + ':' + branchName,
            base: baseBranchName
          }, function(err, result){
            console.log(result);
            submitCallback(err);
          });
        });
      });

    // Download the branch from a pull requst and run tests
    } else if (action === 'test') {
      var pullId = option;

      var testCallback = function(err){
        if (err) { return errorCallback(err); }
        log('Feature copied into your local repo');
        done(true);
      };

      github.pullRequests.getAll({
        user: 'zencoder',
        repo: 'video-js',
        state: 'open'
      }, function(err, pulls){
        if (err) { return errorCallback(err); }

        pulls.forEach(function(pull){
          if (pull.number == pullId) {
            var branchName = pull.head.ref;
            var gitUrl = pull.head.repo.git_url;
            var owner = pull.head.repo.owner.login;

            branch.update('master', { upstream: true }, function(){
              branch.create(owner + '-' + branchName, {
                base: 'master',
                url: gitUrl + ' ' + branchName
              }, function(err){
                grunt.task.run('test');
                testCallback(err);
              });
            });
          }
        });
      });
    } else if (action === 'accept') {
    }
  });
};
