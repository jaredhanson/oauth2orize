/**
 * Module dependencies.
 */
var passport = require('passport')

exports.info = [
  /*
  function(req, res, next) {
    console.log('!!!! API REQUEST !!!!');
    console.dir(req.headers)
    next();
  },
  */
  passport.authenticate('bearer', { session: false }),
  function(req, res) {
    // TODO: Set scope in response, for demonstration purposes
    console.log('AUTH INFO');
    console.dir(req.authInfo)
    res.json({ user_id: req.user.id, name: req.user.name })
  }
]
