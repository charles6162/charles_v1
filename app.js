const express                       = require("express");
const mongoose                      = require("mongoose");
const mongoSanitize                 = require("express-mongo-sanitize");
const { ErrorHandler, handleError } = require("./utils/error");

require('dotenv').config();

//global 설정
global.__base      = __dirname;
global.__Config      = process.env;                              //properties
global.__logger      = require(__base+"/utils/logger");    //로그파일관리
 
mongoose 
  .connect(__Config.MONGO_URL, {
    dbName: "SNS",
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    __logger.debug("Database connection Success.");
  })
  .catch((err) => {
    __logger.error("Mongo Connection Error"+ err);
  });

const app = express();

// parse application/json
app.use(express.json({ limit: "10mb" }));
// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// NoSQL query injection
app.use(mongoSanitize());

//서버 test
app.get("/", (req, res) => {
  res.json({
    error: false,
    message: "Welcome to the API",
    version: "V1"
  });
});


//라우트 셋팅
app.use("/users", require(__base+"/routes/users"));


//에러처리
app.use(function (req, res, next) {
  __logger.error(req.body)
  res.status(404).json({
    error: true,
    message: 'route not found',
  });    
});

//에러처리 (오류)
app.use(function (err, req, res, next) {
  __logger.error(err.stack)
  res.status(500).json({
    error: true,
    message: err.stack,
  });  
})

// process 객체에 .on을 통해 'uncaughtException' 이벤트 리스너를 달았다. 
// 처리하지 못한 에러가 발생 했을 때 이벤트 리스너가 실행되고 프로세스가 유지되지만 로그만 남기고 끄는게 좋을듯
process.on('uncaughtException', (err) => {
  __logger.error('예기치 못한 에러'+ err);
  process.exit()
});

app.listen(__Config.PORT, () => {
  __logger.debug("Server started PORT : " + __Config.PORT);
});
