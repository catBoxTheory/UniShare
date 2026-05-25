import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy - UniShare",
  description: "Learn how UniShare collects, uses, and protects your personal data.",
}

export default function PrivacyPage() {
  return (
    <>
      <Navbar variant="default" />
      <main className="flex flex-col min-h-screen bg-background">
        <section className="py-32 bg-background">
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <p className="text-sm font-medium tracking-widest text-emerald-700 dark:text-emerald-300 uppercase mb-4">
              Legal
            </p>
            <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-tighter">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed mt-4 max-w-prose">
              Last updated: May 2026
            </p>
          </div>
        </section>

        <section className="py-20 bg-muted/30 border-y border-border">
          <div className="container px-4 md:px-6 mx-auto max-w-3xl">
            <div className="text-muted-foreground text-lg leading-relaxed space-y-12">
              <div>
                <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                  Information We Collect
                </h2>
                <p>
                  When you create an account on UniShare, we collect the information you
                  provide directly: your name, email address, university or school
                  affiliation, region, and starting year. If you sign in with Google, we
                  receive your name and email address from your Google account. When you
                  upload course materials, we store those files along with any associated
                  metadata such as course code, title, and description.
                </p>
              </div>

              <div>
                <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                  How We Use Your Information
                </h2>
                <p>
                  We use your information to operate and maintain your account, display your
                  profile and contributed materials to other users, organize content by
                  university and course, and communicate with you about platform updates or
                  account-related matters. We do not use your personal data for advertising
                  purposes, and we do not build user profiles for commercial exploitation.
                </p>
              </div>

              <div>
                <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                  Data Storage & Security
                </h2>
                <p>
                  Your account information is stored in a secure PostgreSQL database. Uploaded
                  files are stored using industry-standard cloud object storage. Passwords are
                  hashed with bcrypt before storage, and authentication sessions use
                  cryptographically signed JSON Web Tokens. While we take reasonable measures
                  to protect your data, no online service can guarantee absolute security.
                </p>
              </div>

              <div>
                <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                  Data Sharing
                </h2>
                <p>
                  We do not sell, rent, or trade your personal information to third parties.
                  Course materials you upload are publicly visible to other UniShare users as
                  part of the platform&apos;s open-access mission. Your profile name and
                  university affiliation may be displayed alongside your contributions. We may
                  disclose information if required by law or to protect the rights and safety
                  of our users.
                </p>
              </div>

              <div>
                <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                  Your Rights
                </h2>
                <p>
                  You may access, correct, or update your personal information at any time
                  through your account settings. You may request deletion of your account and
                  associated data by contacting us. Upon deletion, your profile information is
                  removed from the platform, though course materials you have contributed may
                  remain available to other users at our discretion to preserve the integrity
                  of the academic resource library.
                </p>
              </div>

              <div>
                <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                  Cookies
                </h2>
                <p>
                  UniShare uses essential session cookies to keep you signed in and to protect
                  the platform against unauthorized access. These cookies are strictly
                  necessary for the platform to function and do not track you across other
                  websites. We do not use analytics cookies, advertising cookies, or any form
                  of third-party tracking.
                </p>
              </div>

              <div>
                <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                  Contact
                </h2>
                <p>
                  If you have questions about this privacy policy or wish to exercise your data
                  rights, please reach out through our{" "}
                  <a href="/contact" className="text-emerald-700 dark:text-emerald-300 hover:underline">
                    contact page
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer variant="default" />
    </>
  )
}
