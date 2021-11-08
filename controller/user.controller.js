const Joi = require("joi");
const { v4: uuid } = require("uuid");
const { generateJwt } = require(__base+"/middlewares/validateToken");
const { sendEmail } = require(__base+"/middlewares/mailer");
const User = require(__base+"/model/user.model");

//Joi로 유효성 검사
const userSchema = Joi.object().keys({
  email: Joi.string().email({ minDomainSegments: 2 }),
  password: Joi.string().required().min(4),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
  referrer: Joi.string(),
});

exports.Signup = async (req, res) => {
  try {
    const result = userSchema.validate(req.body);
    if (result.error) {
      __logger.error(result.error.message);
      return res.json({
        error: true,
        status: 400,
        message: result.error.message,
      });
    }
   
    //사용중인 이메일있는지 체크
    var user = await User.findOne({
      email: result.value.email,
    });

    if (user) {
      return res.json({
        error: true,
        message: "사용하는 이메일이 있습니다.",
      });
    }

    const hash = await User.hashPassword(result.value.password);

    const id = uuid(); 
    result.value.userId = id;

    delete result.value.confirmPassword;
    result.value.password = hash;

    let code = Math.floor(100000 + Math.random() * 900000);

    let expiry = Date.now() + 60 * 1000 * 15; //15 mins in ms

    //const sendCode = await sendEmail(result.value.email, code);

    // if (sendCode.error) {
    //   return res.status(500).json({
    //     error: true,
    //     message: "Couldn't send verification email.",
    //   });
    // }
    __logger.debug(`email code : ${code}`)
    result.value.emailToken = code;
    result.value.emailTokenExpires = new Date(expiry);

    const newUser = new User(result.value);
    await newUser.save();

    return res.status(200).json({
      success: true,
      message: "Registration Success"
    });
  } catch (error) {
    __logger.error(`signup-error ${error}`);
    return res.status(500).json({
      error: true,
      message: "Cannot Register",
    });
  }
};

exports.Activate = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.json({
        error: true,
        status: 400,
        message: "요청을 처리할 수 없습니다. 모든 필수 필드를 입력해주세요",
      });
    }
    const user = await User.findOne({
      email: email,
      emailToken: code,
      emailTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        error: true,
        message: "사용자가 없습니다.",
      });
    } else {
      if (user.active)
        return res.send({
          error: true,
          message: "이미 활성화 되었습니다.",
          status: 400,
        });

      user.emailToken = "";
      user.emailTokenExpires = null;
      user.active = true;

      await user.save();

      return res.status(200).json({
        success: true,
        message: "계정이 활성화 되었습니다.",
      });
    }
  } catch (error) {
    __logger.error(`activation-error ${error}`);
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

exports.Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: true,
        message: "요청을 처리할 수 없습니다. 모든 필수 필드를 입력해주세요",
      });
    }
    

    //1. 해당 이메일을 가진 계정이 DB에 존재하는지 확인
    const user = await User.findOne({ email: email });

    // NOT FOUND - Throw error
    if (!user) {
      return res.status(404).json({
        error: true,
        message: "사용자가 없습니다.",
      });
    }
 
    //2. 계정이 활성화되지 않은 경우 오류 발생
    if (!user.active) {
       return res.status(400).json({
         error: true,
         message: "활성화된 계정이 아닙니다.",
       });
    }

    //3. 비밀번호가 유효한지 확인
    const isValid = await User.comparePasswords(password, user.password);

    if (!isValid) {
      return res.status(400).json({
        error: true,
        message: "비밀번호가 일치하지 않습니다.",
      });
    }

    //Generate Access token

    const { error, token } = await generateJwt(user.email, user.userId);
    if (error) {
      return res.status(500).json({
        error: true,
        message: "인증된 사용자가 아닙니다.",
      });
    }
    user.accessToken = token;
    await user.save();

    //Success
    return res.send({
      success: true,
      message: "로그인 성공",
      accessToken: token,
    });
  } catch (err) {
    __logger.error(`Login error ${err}`);
    return res.status(500).json({
      error: true,
      message: "로그인에 실패했습니다 다시시도해주세요",
    });
  }
};

exports.ForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.send({
        status: 400,
        error: true,
        message: "요청을 처리할 수 없습니다. 모든 필수 필드를 입력해주세요",
      });
    }
    const user = await User.findOne({
      email: email,
    });
    if (!user) {
      return res.send({
        success: true,
        message:
          "해당 이메일 주소가 데이터베이스에 있는 경우 비밀번호 재설정을 위한 이메일을 보내드립니다.",
      });
    }

    let code = Math.floor(100000 + Math.random() * 900000);
    let response = await sendEmail(user.email, code);

    if (response.error) {
      return res.status(500).json({
        error: true,
        message: "메일을 보낼 수 없습니다. 나중에 다시 시도하십시오.",
      });
    }

    let expiry = Date.now() + 60 * 1000 * 15;
    user.resetPasswordToken = code;
    user.resetPasswordExpires = expiry; // 15 minutes

    await user.save();

    return res.send({
      success: true,
      message:
        "해당 이메일 주소가 데이터베이스에 있는 경우 비밀번호 재설정을 위한 이메일을 보내드립니다.",
    });
  } catch (error) {
    __logger.error(`forgot-password-error ${error}`);
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

exports.ResetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;
    if (!token || !newPassword || !confirmPassword) {
      return res.status(403).json({
        error: true,
        message:
          "요청을 처리할 수 없습니다. 모든 필수 필드를 입력해주세요",
      });
    }
    const user = await User.findOne({
      resetPasswordToken: req.body.token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.send({
        error: true,
        message: "비밀번호 재설정 토큰이 잘못되었거나 만료되었습니다.",
      });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error: true,
        message: "비밀번호가 일치하지 않음",
      });
    }
    const hash = await User.hashPassword(req.body.newPassword);
    user.password = hash;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = "";

    await user.save();

    return res.send({
      success: true,
      message: "비밀번호가 변경되었습니다",
    });
  } catch (error) {
    __logger.error(`reset-password-error ${error}`);
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

exports.profile = async (req, res) => {
  try {
    const { id,email } = req.decoded;
    if (!email || !id) {
      return res.status(403).json({
        error: true,
        message:
          "요청을 처리할 수 없습니다. 모든 필수 필드를 입력해주세요",
      });
    }

    
    const user = await User.findOne({ userId: id });

    user.success = true;
    user.message = '조회가 완료되었습니다.';

    return res.send(user);
  } catch (error) {
    __logger.error(`profile-error ${error}`);
    return res.stat(500).json({
      error: true,
      message: error.message,
    });
  }
};

exports.Logout = async (req, res) => {
  try {
    const { id } = req.decoded;

    let user = await User.findOne({ userId: id });

    user.accessToken = "";

    await user.save();

    return res.send({ success: true, message: "User Logged out" });
  } catch (error) {
    __logger.error("user-logout-error"+error);
    return res.stat(500).json({
      error: true,
      message: error.message,
    });
  }
};