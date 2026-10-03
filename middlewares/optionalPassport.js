const passport = require('./passport');

const optionalPassport = (req, res, next) => {
  if (!req.headers.authorization) return next();
  return passport(req, res, next);
};

module.exports = optionalPassport;
