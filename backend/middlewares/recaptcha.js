export default async function (req, res, next) {
  try {
    if (process.env.RECAPTCHA_ENABLED !== "true") return next();

    const token = req.body && req.body.recaptchaToken;
    if (!token)
      return res.status(400).json({ message: "recaptcha token is required" });

    const secret = process.env.RECAPTCHA_SECRET;
    if (!secret)
      return res.status(500).json({ message: "reCAPTCHA not configured" });

    const params = new URLSearchParams();
    params.append("secret", secret);
    params.append("response", token);

    const resp = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        body: params,
      }
    );
    const json = await resp.json();
    if (!json.success)
      return res.status(400).json({ message: "recaptcha verification failed" });

    next();
  } catch (err) {
    next(err);
  }
}
