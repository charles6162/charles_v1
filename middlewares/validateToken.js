const jwt = require("jsonwebtoken");
const User = require("../src/users/user.model");

async function validateToken(req, res, next) {
  const authorizationHeader = req.headers.authorization;
  let result;
  if (!authorizationHeader)
    return res.status(401).json({
      error: true,
      message: "헤더에 토큰이 없습니다.",
    });

  const token = req.headers.authorization.split("Bearer ")[1]; // Bearer <token>
  const options = {
    expiresIn: "1h",
  };
  try {
    let user = await User.findOne({
      accessToken: token,
    });
    __logger.debug(`token : ${token}`);
    if (!user) {
      result = {
        error: true,
        message: `사용자가 없습니다.`,
      };
      return res.status(403).json(result);
    }

    result = jwt.verify(token, __Config.JWT_SECRET, options);
    __logger.debug(`jwt.verify : ${JSON.stringify(result)}`);
    if (!user.userId === result.id) {
      result = {
        error: true,
        message: `잘못된 토큰입니다.`,
      };

      return res.status(401).json(result);
    }

    result["referralCode"] = user.referralCode;

    req.decoded = result;
    next();
  } catch (err) {
    __logger.error(err);
    if (err.name === "TokenExpiredError") {
      result = {
        error: true,
        message: `토큰의 유효기간이 지났습니다.`,
      };
    } else {
      result = {
        error: true,
        message: `Authentication error`,
      };
    }
    return res.status(403).json(result);
  }
}

module.exports = { validateToken };
