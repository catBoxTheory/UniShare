import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

async function testEmail() {
  console.log("Testing email configuration...");
  console.log("SMTP_USER:", process.env.SMTP_USER);
  
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: "nongfushanquan33@gmail.com",
      pass: "xseiufmdphdiftzy",
    },
  });

  try {
    await transporter.verify();
    console.log("✅ SMTP Connection successful!");

    const info = await transporter.sendMail({
      from: '"UniShare" <nongfushanquan33@gmail.com>',
      to: "nongfushanquan33@gmail.com",
      subject: "UniShare Email Test",
      text: "If you receive this, your email configuration is working!",
      html: "<b>If you receive this, your email configuration is working!</b>",
    });

    console.log("✅ Test email sent successfully:", info.messageId);
  } catch (error) {
    console.error("❌ Email test failed:", error);
  }
}

testEmail();

