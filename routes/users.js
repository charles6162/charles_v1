const express = require("express");
const router = express.Router();
const xssFilter = require(__base+"/middlewares/xssfillter");
const { validateToken } = require(__base+"/middlewares/validateToken");
const AuthController = require(__base+"/controller/user.controller");

//회원가입
router.post("/signup", xssFilter, AuthController.Signup);

//이메일인증후 사용허가
router.patch("/activate", xssFilter, AuthController.Activate);

//로그인
router.post("/login", xssFilter, AuthController.Login);

//비밀번호 분실
router.patch("/forgot", xssFilter, AuthController.ForgotPassword);

//비밀번호 reset
router.patch("/reset", xssFilter, AuthController.ResetPassword);

//정보조회
router.get("/profile", xssFilter, validateToken, AuthController.profile);

//로그아웃
router.get("/logout", xssFilter, validateToken, AuthController.Logout);

module.exports = router;
