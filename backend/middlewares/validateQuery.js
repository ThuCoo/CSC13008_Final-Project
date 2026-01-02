export default function (schema, target = "query") {
  return function (req, res, next) {
    try {
      const parsed = schema.parse(req[target]);
      req[`validated${target.charAt(0).toUpperCase() + target.slice(1)}`] = parsed;
      try { req[target] = parsed; } catch (e) {}
      next();
    } catch (err) {
      return next(err);
    }
  };
}
