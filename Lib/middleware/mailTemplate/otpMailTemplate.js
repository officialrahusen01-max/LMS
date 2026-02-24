const otpMailTemplate = (otp) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>OTP Verification - API.ai.com</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background-color: #007bff;
          color: #ffffff;
          text-align: center;
          padding: 20px;
        }
        .logo {
          max-width: 150px;
          height: auto;
        }
        .content {
          padding: 30px;
          text-align: center;
        }
        .otp-code {
          font-size: 32px;
          font-weight: bold;
          color: #007bff;
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
          display: inline-block;
          margin: 20px 0;
          letter-spacing: 5px;
        }
        .message {
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 20px;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          font-size: 14px;
          color: #666;
        }
        .footer a {
          color: #007bff;
          text-decoration: none;
        }
        @media (max-width: 600px) {
          .container {
            margin: 10px;
          }
          .content {
            padding: 20px;
          }
          .otp-code {
            font-size: 24px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://yourdomain.com/uploads/logo.png" alt="API.ai.com Logo" class="logo">
          <h1>OTP Verification</h1>
        </div>
        <div class="content">
          <p class="message">
            Hello,<br><br>
            Your One-Time Password (OTP) for verification is:
          </p>
          <div class="otp-code">${otp}</div>
          <p class="message">
            This OTP is valid for 10 minutes. Please do not share it with anyone.<br><br>
            If you did not request this, please ignore this email.
          </p>
        </div>
        <div class="footer">
          <p>© 2026 API.ai.com. All rights reserved.</p>
          <p>Need help? <a href="mailto:support@api.ai.com">Contact Support</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export default otpMailTemplate;