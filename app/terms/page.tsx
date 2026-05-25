import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service - UniShare",
  description: "Read the terms and conditions for using the UniShare platform.",
}

export default function TermsPage() {
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
              Terms of Service
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
                  1. Acceptance of Terms
                </h2>
                <p>
                  By accessing or using UniShare, you agree to be bound by these Terms of
                  Service. If you do not agree to these terms, please do not use the platform.
                  We reserve the right to update these terms at any time, and continued use of
                  the platform after changes constitutes acceptance of the revised terms.
                </p>
              </div>

              <div>
                <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                  2. Account Responsibilities
                </h2>
                <p>
                  You are responsible for maintaining the confidentiality of your account
                  credentials and for all activity that occurs under your account. You agree
                  to provide accurate and complete information when creating your account and
                  to update that information as needed. You must be at least 13 years old to
                  use UniShare.
                </p>
              </div>

              <div>
                <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                  3. Content Ownership & License
                </h2>
                <p>
                  You retain ownership of the course materials and content you upload to
                  UniShare. By uploading content, you grant UniShare a worldwide,
                  non-exclusive, royalty-free license to host, display, and distribute your
                  content on the platform for the purpose of making it available to other
                  users. You represent that you have the right to share any content you upload
                  and that doing so does not infringe on any third-party rights.
                </p>
              </div>

              <div>
                <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                  4. Prohibited Conduct
                </h2>
                <p>
                  You agree not to upload content that is illegal, infringes on copyright or
                  intellectual property rights, contains malware or malicious code, constitutes
                  harassment or hate speech, or disrupts the functioning of the platform. You
                  also agree not to attempt unauthorized access to other users&apos; accounts or to
                  the platform&apos;s underlying systems.
                </p>
              </div>

              <div>
                <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                  5. Copyright Infringement
                </h2>
                <p>
                  We respect intellectual property rights and expect our users to do the same.
                  If you believe that content on UniShare infringes your copyright, please
                  contact us with a detailed description of the copyrighted work and the
                  allegedly infringing material. We will review and take appropriate action,
                  which may include removing the content.
                </p>
              </div>

              <div>
                <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                  6. Termination
                </h2>
                <p>
                  We reserve the right to suspend or terminate accounts that violate these
                  terms, at our sole discretion and without prior notice. You may delete your
                  account at any time through your account settings or by contacting us.
                </p>
              </div>

              <div>
                <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                  7. Disclaimer of Warranties
                </h2>
                <p>
                  UniShare is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. We make no
                  warranties, express or implied, regarding the accuracy, reliability, or
                  availability of the platform or its content. Course materials are
                  user-contributed and we do not verify their accuracy or completeness.
                </p>
              </div>

              <div>
                <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                  8. Limitation of Liability
                </h2>
                <p>
                  To the fullest extent permitted by law, UniShare and its operators shall not
                  be liable for any indirect, incidental, special, or consequential damages
                  arising from your use of the platform, including but not limited to loss of
                  data, academic consequences, or reliance on user-contributed content.
                </p>
              </div>

              <div>
                <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                  9. Changes to These Terms
                </h2>
                <p>
                  We may revise these terms from time to time. Material changes will be
                  communicated through the platform or via email. The &ldquo;Last updated&rdquo; date at
                  the top of this page reflects the most recent revision.
                </p>
              </div>

              <div>
                <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                  10. Contact
                </h2>
                <p>
                  Questions about these Terms of Service should be directed to us through our{" "}
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
