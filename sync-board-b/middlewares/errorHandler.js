function mapError(err) {
  if (err.name === "ValidationError") {
    const details = Object.values(err.errors).map((e) => e.message);
    return { message: "Validation failed", code: "VALIDATION_ERROR", status: 400, details };
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    return { message: `Duplicate ${field}`, code: "DUPLICATE_KEY", status: 409 };
  }
  if (err.name === "CastError") {
    return { message: "Invalid ID format", code: "INVALID_ID", status: 400 };
  }
  return { message: "Internal server error", code: "INTERNAL_ERROR", status: 500 };
}

module.exports = (err, req, res, _next) => {
  console.error(err);
  const mapped = mapError(err);
  const body = { error: mapped.message, code: mapped.code };
  if (mapped.details) body.details = mapped.details;
  res.status(mapped.status).json(body);
};
