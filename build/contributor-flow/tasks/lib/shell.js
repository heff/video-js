var shell = {};
var log = require('./log.js').log;

var exec = require('child_process').exec;
var grunt = require('grunt');

shell.run = function(command, options, callback) {
  options = options || {};

  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  if (options.logging !== false) {
    log('$ ' + command, { arrow: false });
  }

  exec(command, function(err, stdout, stderr){
    if (err) {
      grunt.log.error(err);
      grunt.log.error(stderr);
      return done(false);
    }

    grunt.log.write(stdout);
    if (callback) {
      callback(stdout);
    }
  });
};

module.exports = shell;
