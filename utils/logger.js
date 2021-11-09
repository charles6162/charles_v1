const winston = require('winston');
require('winston-daily-rotate-file');
require('date-utils');
 

/** 
* @ 로그파일관리
* logger.info("1111");
* logger.debug("2222");
* logger.warn("3333");
* logger.error("4444");
*/
const logger = winston.createLogger({
    level: 'debug', // 최소 레벨
    // 파일저장
    transports: [
        new winston.transports.DailyRotateFile({
            filename : '/Nodelogs/system.log', // Nodelogs 폴더에 system.log 이름으로 저장
            zippedArchive: true, // 압축여부
            format: winston.format.printf(
                info => `${new Date().toFormat('YYYY-MM-DD HH24:MI:SS')} [${info.level.toUpperCase()}] - ${info.message}`)
        }),
        
    ]
});

if(__Config.NODE_ENV == 'dev'){
    logger.add(new winston.transports.Console({
        format: winston.format.printf(
            info => `${new Date().toFormat('YYYY-MM-DD HH24:MI:SS')} [${info.level.toUpperCase()}] - ${info.message}`)
    })) // 개발 시 console로도 출력
}
module.exports = logger;