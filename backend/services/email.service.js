const nodemailer = require("nodemailer");
const env = require("../config/env");

const transporter = nodemailer.createTransport({
  host: env.emailHost,
  port: env.emailPort,
  secure: env.emailPort === 465,
  auth: {
    user: env.emailUser,
    pass: env.emailPass,
  },
});

async function sendVerificationEmail(email, code, language = "en") {
  try {
    const isAr = language === "ar";

    const subject = isAr ? "رمز التحقق الخاص بك" : "Your Verification Code";

    const title = isAr ? "تأكيد البريد الإلكتروني" : "Verify Your Email";

    const greeting = isAr
      ? "مرحباً بك في Supplements Store 👋"
      : "Welcome to Supplements Store 👋";

    const message = isAr
      ? "استخدم رمز التحقق التالي لتأكيد بريدك الإلكتروني. الرمز صالح لمدة 10 دقائق."
      : "Use the verification code below to confirm your email address. This code is valid for 10 minutes.";

    const securityMessage = isAr
      ? "لأمان حسابك، لا تشارك رمز التحقق مع أي شخص."
      : "For your security, never share this verification code with anyone.";

    const html = `
      <!DOCTYPE html>
      <html lang="${isAr ? "ar" : "en"}" dir="${isAr ? "rtl" : "ltr"}">

      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>

      <body style="
        margin: 0;
        padding: 0;
        background-color: #f6f3ed;
        font-family: Arial, Helvetica, sans-serif;
        color: #15181b;
      ">

        <!-- Main wrapper -->
        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            background-color: #f6f3ed;
            padding: 45px 15px;
          "
        >
          <tr>
            <td align="center">

              <!-- Email Card -->
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  max-width: 600px;
                  background-color: #ffffff;
                  border: 1px solid #e1dccf;
                  border-radius: 18px;
                  overflow: hidden;
                "
              >

                <!-- =====================================================
                     HEADER
                ====================================================== -->
                <tr>
                  <td
                    align="center"
                    style="
                      background-color: #b7e619;
                      padding: 32px 25px;
                    "
                  >

                    <div style="
                      color: #1c2400;
                      font-size: 28px;
                      font-weight: 800;
                      line-height: 1.2;
                      letter-spacing: -0.5px;
                    ">
                      Supplements Store
                    </div>

                    <div style="
                      color: #1c2400;
                      opacity: 0.75;
                      font-size: 13px;
                      font-weight: 600;
                      margin-top: 8px;
                    ">
                      ${
                        isAr
                          ? "كل ما تحتاجه لمكملاتك الرياضية"
                          : "Everything you need for your supplements"
                      }
                    </div>

                  </td>
                </tr>


                <!-- =====================================================
                     CONTENT
                ====================================================== -->
                <tr>
                  <td style="
                    padding: 42px 38px;
                  ">

                    <!-- Verification Icon -->
                    <div style="
                      width: 64px;
                      height: 64px;
                      line-height: 64px;
                      margin: 0 auto 22px;
                      background-color: #ece7dd;
                      border-radius: 18px;
                      text-align: center;
                      font-size: 28px;
                    ">
                      ✉
                    </div>


                    <!-- Title -->
                    <h2 style="
                      margin: 0 0 12px;
                      text-align: center;
                      color: #15181b;
                      font-size: 24px;
                      font-weight: 800;
                      line-height: 1.3;
                    ">
                      ${title}
                    </h2>


                    <!-- Greeting -->
                    <p style="
                      margin: 0 0 10px;
                      text-align: ${isAr ? "right" : "left"};
                      color: #15181b;
                      font-size: 15px;
                      font-weight: 600;
                      line-height: 1.7;
                    ">
                      ${greeting}
                    </p>


                    <!-- Message -->
                    <p style="
                      margin: 0 0 25px;
                      text-align: ${isAr ? "right" : "left"};
                      color: #4a5158;
                      font-size: 14px;
                      line-height: 1.8;
                    ">
                      ${message}
                    </p>


                    <!-- =================================================
                         VERIFICATION CODE
                    ================================================== -->
                    <div style="
                      background-color: #ece7dd;
                      border: 2px solid #b7e619;
                      border-radius: 10px;
                      padding: 24px 15px;
                      margin: 25px 0;
                      text-align: center;
                    ">

                      <div style="
                        color: #4a5158;
                        font-size: 11px;
                        font-weight: 700;
                        letter-spacing: 1.5px;
                        margin-bottom: 10px;
                      ">
                        ${isAr ? "رمز التحقق" : "VERIFICATION CODE"}
                      </div>


                      <div style="
                        color: #15181b;
                        font-size: 34px;
                        font-weight: 800;
                        letter-spacing: 8px;
                        line-height: 1.2;
                      ">
                        ${code}
                      </div>


                      <div style="
                        color: #4a5158;
                        font-size: 12px;
                        margin-top: 12px;
                      ">
                        ${isAr ? "صالح لمدة 10 دقائق" : "Valid for 10 minutes"}
                      </div>

                    </div>


                    <!-- =================================================
                         SECURITY NOTE
                    ================================================== -->
                    <div style="
                      background-color: #f6f3ed;
                      border: 1px solid #e1dccf;
                      border-radius: 10px;
                      padding: 14px 16px;
                      margin-top: 25px;
                    ">

                      <p style="
                        margin: 0;
                        color: #4a5158;
                        font-size: 12px;
                        line-height: 1.7;
                        text-align: ${isAr ? "right" : "left"};
                      ">
                        🔒 ${securityMessage}
                      </p>

                    </div>

                  </td>
                </tr>


                <!-- =====================================================
                     FOOTER
                ====================================================== -->
                <tr>
                  <td style="
                    border-top: 1px solid #e1dccf;
                    padding: 22px 20px;
                    text-align: center;
                    background-color: #f6f3ed;
                  ">

                    <div style="
                      color: #15181b;
                      font-size: 14px;
                      font-weight: 800;
                      margin-bottom: 6px;
                    ">
                      Supplements Store
                    </div>

                    <div style="
                      color: #4a5158;
                      font-size: 11px;
                      line-height: 1.6;
                    ">
                      ${
                        isAr
                          ? "هذا البريد تم إرساله تلقائياً، يرجى عدم الرد عليه."
                          : "This is an automated email. Please do not reply."
                      }
                    </div>

                  </td>
                </tr>

              </table>

            </td>
          </tr>
        </table>

      </body>
      </html>
    `;

    await transporter.sendMail({
      from: env.emailFrom,
      to: email,
      subject,
      html,
      text: isAr
        ? `رمز التحقق الخاص بك هو ${code}. الرمز صالح لمدة 10 دقائق.`
        : `Your verification code is ${code}. This code is valid for 10 minutes.`,
    });

    console.log(`[email] Verification email sent to ${email}`);
  } catch (error) {
    console.error("[email] Error sending verification email:", error);
    throw error;
  }
}

module.exports = {
  sendVerificationEmail,
};
