'use strict';

module.exports = function(grunt) {
  var prompt = require('prompt');
  var branch = require('./lib/branch');
  var log = require('./lib/log').log;

  var GitHubApi = require("github");
  var github = new GitHubApi({
      // required
      version: "3.0.0",
      // optional
      timeout: 5000
  });

  grunt.registerTask('feature', 'Creating distribution', function(action, option){
    var done = this.async();

    if (action === 'start') {
      if (!option) {
        grunt.log.error('No name supplied');
        return done(false);
      } else {
        var name = 'feature/' + option;

        branch.update('master', { upstream: true }, function(){
          branch.create(name, { base: 'master' }, function(){
            branch.push(name, {}, function(){
              branch.track(name, {}, function(){
                log('Ready to start building your feature!');
                done(true);
              });
            });
          });
        });
      }
    } else if (action === 'delete') {
      branch.current(function(typeSlashName, type, name){
        if (type !== 'feature') {
          grunt.log.error('You are not in a feature branch');
          return done(false);
        } else {
          prompt.start();
          prompt.get({
            name: 'yesno',
            message: '\nAre you sure you want to delete '+typeSlashName+'?',
            validator: /y[es]*|n[o]?/,
            warning: 'Must respond yes or no',
            'default': 'no'
          }, function (err, result) {
            if (err) {
              console.log(err);
              return 1;
            }

            if (result.yesno === 'yes' || result.yesno === 'y') {
              branch.checkout('master', {}, function(){
                branch.deleteLocal(typeSlashName, {}, function(){
                  branch.deleteRemote(typeSlashName, {}, function(){
                    log('Feature deleted');
                  });
                });
              });
            } else {
              log('Delete branch aborted');
            }
          });
        }
      });
    } else if (action === 'submit') {

      branch.current(function(typeSlashName, type, name){

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
              hidden: true
            }
          }
        };

        prompt.start();
        prompt.get(schema, function (err, result) {
          console.log('Command-line input received:');
          console.log('  name: ' + result.username);
          // console.log('  password: ' + result.password);

          github.authenticate({
              type: "basic",
              username: result.username,
              password: result.password
          });

          github.pullRequests.create({
            user: result.username,
            repo: 'video-js',
            title: 'Amazing new feature',
            body: 'Please pull this in',
            head: 'heff:' + typeSlashName,
            base: 'master'
          }, function(err, result){
            console.log(result);
          });

        });

      });

    // Download the branch from a pull requst and run tests
    } else if (action === 'test') {
      var pullId = option;
      console.log(pullId);

      github.pullRequests.getAll({
        user: 'zencoder',
        repo: 'video-js',
        state: 'open'
      }, function(err, pulls){
        if (err) {
          console.log(err);
          return done(false);
        } else {
          pulls.forEach(function(pull){
            if (pull.number == pullId) {
              var branchName = pull.head.ref;
              var gitUrl = pull.head.repo.git_url;
              var owner = pull.head.repo.owner.login;

              branch.update('master', { upstream: true }, function(){
                branch.create(owner + '-' + branchName, {
                  base: 'master',
                  url: gitUrl + ' ' + branchName
                }, function(){
                  grunt.task.run('test');
                  done(true);
                });
              });
            }
          });
        }
      });
    } else if (action === 'accept') {
    } else if (action === 'accepted') {
    }
  });
};
