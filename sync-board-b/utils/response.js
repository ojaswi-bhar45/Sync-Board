function success(res, data, message = "OK", status = 200) {
  return res.status(status).json({ data, message });
}

function error(res, message, code = "INTERNAL_ERROR", status = 500, details = null) {
  const body = { error: message, code };
  if (details) body.details = details;
  return res.status(status).json(body);
}

module.exports = { success, error };
