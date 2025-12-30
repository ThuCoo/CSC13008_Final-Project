export default function(schema) {
  return function(req, res, next) {
    try {
      schema.parse(req.body);
    } catch (err) {
      return next(err);
    }
    next();
  }
}