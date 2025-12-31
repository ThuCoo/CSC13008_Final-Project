export default function (schema, target = "query") {
  return function (req, res, next) {
    try {
      const parsed = schema.parse(req[target]);
      req[target] = parsed;
      next();
    } catch (err) {
      return next(err);
    }
  };
}
