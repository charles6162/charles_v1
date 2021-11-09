const express = require("express");
const router = express.Router();
const xssFilter = require(__base+"/middlewares/xssfillter");
const { validateToken } = require(__base+"/middlewares/validateToken");
const UserController = require(__base+"/controller/user.controller");

//회원가입
router.post("/signup", xssFilter, UserController.Signup);

//이메일인증후 사용허가
router.patch("/activate", xssFilter, UserController.Activate);

//로그인
router.post("/login", xssFilter, UserController.Login);

//비밀번호 분실
router.patch("/forgot", xssFilter, UserController.ForgotPassword);

//비밀번호 reset
router.patch("/reset", xssFilter, UserController.ResetPassword);

//정보조회
router.get("/profile", xssFilter, validateToken, UserController.profile);

//로그아웃
router.get("/logout", xssFilter, validateToken, UserController.Logout);

module.exports = router;
