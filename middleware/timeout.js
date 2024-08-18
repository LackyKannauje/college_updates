
function timeout(req, res, next) {
  res.setTimeout(1 * 60 * 1000, () => {
    console.log("Request has timed out.");
    res.sendStatus(408);
  });
  next();
}

module.exports = timeout;
