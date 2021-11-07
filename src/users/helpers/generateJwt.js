const jwt = require("jsonwebtoken");
const Config = require(__base + '/config/config');

const options = {
  expiresIn: "1h",
};

async function generateJwt(email, userId) {
  try {
    const payload = { email: email, id: userId };
    const token = await jwt.sign(payload, Config.JWT_SECRET, options);
    return { error: false, token: token };
  } catch (error) {
    return { error: true };
  }
}

async function jwtverify(token, options) {
  try {
    const result = {};
    const payload = { email: email, id: userId };    
    result = await jwt.verify(token, __Config.JWT_SECRET, options);
    result.error = true
    return { error: false, token: token };
  } catch (error) {
    result.error = true
    return result;
  }
}

module.exports = { generateJwt };
