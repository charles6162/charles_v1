const nodemailer = require("nodemailer");

async function sendEmail(email, code) {
  try {
    
    const senderAddress = "NAME <ADDRESS>";

    var toAddress = email;
    
    var subject = "Verify your email";

    // The body of the email for recipients
    var body_html = `<!DOCTYPE> 
    <html>
      <body>
        <p>Your authentication code is : </p> <b>${code}</b>
      </body>
    </html>`; 

    // Create the SMTP transport.
    let transporter = nodemailer.createTransport({
      service: 'gmail',      
      host: 'smtp.gmail.com',
      auth: { 
        user: __Config.EMAIL_USER, 
        pass: __Config.EMAIL_PWD
      }

    });

    // Specify the fields in the email.
    let mailOptions = {
      from: senderAddress,
      to: toAddress,
      subject: subject,
      html: body_html,
    };

    let info = await transporter.sendMail(mailOptions);
    return { error: false };
  } catch (error) {
    console.error("send-email-error", error);
    return {
      error: true,
      message: "Cannot send email",
    };
  }
}

module.exports = { sendEmail };
