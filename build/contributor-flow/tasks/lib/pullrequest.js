var PR = {};

PR.askForId(callback){
  prompt.start();
  prompt.get({
    name: 'pullId',
    message: '\nPull request ID',
    validator: /^[0-9]+$/,
    warning: 'ID must be an integer',
    required: true
  }, function (err, result) {
    if (err) { return callback(err); }

    github.pullRequests.get({
      user: 'zencoder',
      repo: 'video-js',
      number: result.pullId
    }, callback);
  });
}

module.exports = PR;


