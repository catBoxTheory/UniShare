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
  const from = process.env.SMTP_FROM || "UniStream <onboarding@unistream.com>"
  const subject = "Verify your email address"
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Verify your email address</h2>
      <p>Thank you for signing up for UniShare. Please use the following code to verify your email address:</p>
      <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
        <h1 style="margin: 0; letter-spacing: 5px; color: #333;">${token}</h1>
      </div>
      <p>This code will expire in 1 hour.</p>
      <p>If you didn't request this code, you can safely ignore this email.</p>
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

