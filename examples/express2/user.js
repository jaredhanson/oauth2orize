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
    // TODO: Make note of authInfo
    res.json({ user_id: req.user.id, name: req.user.name, scope: req.authInfo.scope })
  }
]
