import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export const sendVerificationEmail = async (email: string, token: string) => {
  const from = process.env.SMTP_FROM || '"UniShare" <nongfushanquan33@gmail.com>'
  const subject = "Verification Code - UniShare"
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1a365d; text-align: center;">Welcome to UniShare</h2>
      <p style="color: #4a5568; font-size: 16px;">Your verification code is:</p>
      <div style="background-color: #f7fafc; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2b6cb0;">${token}</span>
      </div>
      <p style="color: #718096; font-size: 14px;">This code will expire in 1 hour. If you didn't request this email, please ignore it.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
      <p style="color: #a0aec0; font-size: 12px; text-align: center;">&copy; 2025 UniShare. All rights reserved.</p>
    </div>
  `

  // If no SMTP credentials are provided, log the token to the console (for dev)
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.log("---------------------------------------------------")
    console.log(`[DEV MODE] Verification email for ${email}`)
    console.log(`[DEV MODE] Token: ${token}`)
    console.log("---------------------------------------------------")
    return
  }

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject,
      html,
    })
    console.log(`Verification email sent to ${email}`)
  } catch (error) {
    console.error("Error sending verification email:", error)
    // Fallback logging for dev if email fails
    if (process.env.NODE_ENV === "development") {
        console.log("---------------------------------------------------")
        console.log(`[DEV MODE - FALLBACK] Verification email for ${email}`)
        console.log(`[DEV MODE - FALLBACK] Token: ${token}`)
        console.log("---------------------------------------------------")
    }
    throw new Error("Failed to send verification email")
  }
}
