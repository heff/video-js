'use strict';

module.exports = function(grunt) {
  var prompt = require('prompt');
  var branch = require('./branch.js');
  var log = require('./log.js').log;

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
    }
  });

};
