
class ErrorHandler extends Error {
    constructor(statusCode, message) {
      super(); //calling the parent constructor
      this.statusCode = statusCode;
      this.status = `${statusCode}`.startsWith("4") ? "fail" : "error"; //4 means 404 etc errors, else 500
      this.message = message;
      this.isOperational = `${statusCode}`.startsWith("4") ? true : false;
  
      //to prevent the error stack trace (the large error message) from appearing
      //this - current obj., this.constructor - the ErrorHandler class
      //Error.captureStackTrace(this, this.constructor);//not necessary
    }
  }
  
  const handleCastErrorDB = error => {
    const message = `Invalid error ${error.path} : ${error.value}`;
    return new ErrorHandler(400, message);
  };
  
  const handleDuplicateKeyErrorDB = error => {
    const message = `The name ${error.keyValue.name} has been taken`;
    return new ErrorHandler(400, message);
  };
  
  const handleValidationErrorDB = error => {
    const errorString = Object.values(error.errors).map(el => el.message);
    const msg = `Invalid input data ${errorString.join(". ")}`;
    return new ErrorHandler(400, msg);
  };
  
  const constructResponseObj = (status, message, error = null, stack = null) => {
    const obj = {};
    obj.status = status;
    obj.message = message;
  
    //the if statement below will be executed only in development
    if (error !== null && stack !== null) {
      obj.err = error;
      obj.stack = stack;
    }
    return obj;
  };
  
  //https://stackoverflow.com/questions/56773093/how-to-handle-http-errors-in-express-in-production
  const processErrors = err => {
    let responseObj = {};
  
    const { statusCode, status, message, stack } = err;
  
    //without this line of code when throwing an error invalida status code was being displayed
    //https://teamtreehouse.com/community/rangeerror-errhttpinvalidstatuscode-invalid-status-code-undefined-pretty-sure-the-issue-is-in-cardsjs
    const sCode = statusCode || 500;
  
    if (__Config.NODE_ENV === "dev") { 
      responseObj = constructResponseObj(status, message, err, stack);
    } else if (__Config.NODE_ENV === "www") {
      if (err.isOperational) {
        responseObj = constructResponseObj(status, message);
      } else {
        //500 errors
        console.error(`ERROR `, err);
        //cast errors are if the vale that is required is a string and the user enters a integer
        //then the DB will generate a cast error
        //cast errors will be handled by the else block that also handles 500 errors
        // since cast errors will generate a 500 status code
        //bt we need to show the database validation errors to the user so we do -
        //return new ErrorHandler(400, message);
  
        if (err.name === "ValidationError") {
          const error = handleValidationErrorDB(err);
          responseObj = constructResponseObj(error.status, error.message);
          return { sCode: error.statusCode, responseObj };
        } else if (err.name === "CastError") {
          //this will return - //return new ErrorHandler(400, message);
          const error = handleCastErrorDB(err);
          responseObj = constructResponseObj(error.status, error.message);
          return { sCode: error.statusCode, responseObj };
        } else if (err.name === "MongoError" && err.code === 11000) {
          const error = handleDuplicateKeyErrorDB(err);
          responseObj = constructResponseObj(error.status, error.message);
          return { sCode: error.statusCode, responseObj };
        }
  
        // responseObj.status = 'error';
        // responseObj.message = `Sorry for the inconvenience, something went very wrong 🛰`;
  
        responseObj = constructResponseObj(
          "error",
          `Sorry for the inconvenience, something went very wrong 🛰`
        );
      }
    }
  
    return { sCode, responseObj };
  };
  
  //https://stackoverflow.com/questions/56773093/how-to-handle-http-errors-in-express-in-production
  
  const handleError = (err, res) => {
    const { sCode, responseObj } = processErrors(err);
    res.status(sCode).json(responseObj);
  };
  
  module.exports = {
    ErrorHandler,
    handleError
  };
  