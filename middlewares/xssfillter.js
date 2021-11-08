const xss = require("xss");

module.exports = (req, res, next) => {
  try {  
    let filteredObj = {};
    __logger.debug(`orgin-body ${req.body}`);
    for (var key in req.body) {
        if (req.body.hasOwnProperty(key)) {
        filteredObj[key] = xss(req.body[key]);
        }
    }
    req.body = filteredObj;
    __logger.debug(`xssfillter ${req.body}`);
    next();
  } catch (error) {
    __logger.debug(`clean-body-error ${error}`);
    return res.status(500).json({
      error: true,
      message: "xssfillter error",
    });
  }
};
