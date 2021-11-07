const express = require("express");
const router = express.Router();

const cleanBody = require("../middlewares/cleanbody");
const { validateToken } = require("../middlewares/validateToken");

const AuthController = require("../src/users/user.controller");

//회원가입
router.post("/signup", cleanBody, AuthController.Signup);

//이메일인증후 사용허가
router.patch("/activate", cleanBody, AuthController.Activate);

//로그인
router.post("/login", cleanBody, AuthController.Login);

//비밀번호 분실
router.patch("/forgot", cleanBody, AuthController.ForgotPassword);

//비밀번호 reset
router.patch("/reset", cleanBody, AuthController.ResetPassword);

router.get("/referred", validateToken, AuthController.ReferredAccounts);

router.get("/logout", validateToken, AuthController.Logout);

module.exports = router;
