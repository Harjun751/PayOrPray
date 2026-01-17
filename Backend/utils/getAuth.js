function getUserId(req) {
  const v = req.header("x-user-id");
  return v ? Number(v) : null;
}

module.exports = getUserId
