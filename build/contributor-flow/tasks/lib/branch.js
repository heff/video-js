var branch = {};
var shell = require('./shell.js');
var log = require('./log.js').log;

branch.current = function(options, callback){
  var match, type, name;
  options = options || {};

  shell.run('git rev-parse --abbrev-ref HEAD', { logging: false }, function(err, stdout){
    if (err) { return callback(err); }

    match = stdout.match(/([^\/]+)\/(.*)/);
    if (match) {
      type = match[1];
      name = match[2];
    }

    if (options.changeType && options.changeType !== type) {
      return callback('You are not in a '+options.type+' branch');
    }

    callback(null, {
      name: stdout.replace('\n', ''),
      changeType: type,
      changeName: name
    });
  });
};

branch.create = function(name, options, callback){
  options = options || {};
  var base = options.base || 'master';
  var cmd = 'git checkout -b '+name+' '+base;

  if (options.url) {
    cmd += ' && git pull ' + options.url;
  }

  log('Creating the '+name+' branch based on '+base);
  shell.run(cmd, callback);
};

branch.update = function(name, options, callback){
  options = options || {};
  var message = 'Updating the '+name+' branch';
  var cmd = 'git checkout '+name+' && git pull';

  if (options.upstream === true) {
    message += ' with upstream changes'
    cmd += ' upstream '+name;
  }

  log(message);
  shell.run(cmd, callback);
};

branch.push = function(name, options, callback){
  log('Pushing the '+name+' branch to origin');
  shell.run('git push origin '+name, callback);
};

branch.track = function(name, options, callback){
  log('Tracking the '+name+' branch against origin/'+name);
  shell.run('git branch --set-upstream '+name+' origin/'+name, callback);
};

branch.checkout = function(name, options, callback){
  log('Switching to the '+name+' branch');
  shell.run('git checkout '+name, callback);
};

branch.deleteLocal = function(name, options, callback){
  log('Removing the local branch');
  shell.run('git branch -D '+name, callback);
};

branch.deleteRemote = function(name, options, callback){
  log('Removing the remote branch from origin');
  shell.run('git push origin :'+name, callback);
};

module.exports = branch;
