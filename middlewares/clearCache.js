const { clearHash } = require("../services/cache");

module.exports = async (req, res, next) => {
  // Normally route handlers run after middlewares but in this case we want to first allow route handler to run and then let this middleware clear cache to do so we use await next()
  await next();

  clearHash(req.user.id);
};
