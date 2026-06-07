import { MainNav } from "@/components/navigation/main-nav"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ObfuscatedEmail } from "@/components/ui/obfuscated-email"
import { ScrollAnimation } from "@/components/animation/scroll-animation"
import { Metadata } from "next"
import { generateSEO } from "@/lib/seo"

export const metadata: Metadata = generateSEO({
    title: "Cookie Policy",
    description:
        "Turn One Cookie Policy - Learn about how we use cookies and tracking technologies on our F1 platform to enhance your experience.",
    url: "/cookies",
    keywords: ["cookie policy", "tracking technologies", "web cookies", "GDPR cookies"],
})

const EFFECTIVE_DATE = "June 7, 2026"
const LAST_UPDATED = "June 7, 2026"
const VERSION = "v2.0"

type Section = {
    id: string
    title: string
    body: React.ReactNode
}

const sections: Section[] = [
    {
        id: "introduction",
        title: "Introduction",
        body: (
            <>
                <p>
                    This Cookie Policy explains how Turn One (&ldquo;Turn One&rdquo;, &ldquo;we&rdquo;,
                    &ldquo;us&rdquo;, &ldquo;our&rdquo;) uses cookies and similar technologies on our website, mobile
                    applications, and related services (collectively, the &ldquo;Service&rdquo;). It should be read
                    together with our{" "}
                    <Link href="/privacy" className="text-red-400 hover:text-red-300 underline-offset-4 hover:underline">
                        Privacy Policy
                    </Link>{" "}
                    and{" "}
                    <Link href="/terms" className="text-red-400 hover:text-red-300 underline-offset-4 hover:underline">
                        Terms of Service
                    </Link>
                    .
                </p>
                <p>
                    Where required by law (including under the EU ePrivacy framework and UK PECR), we will request your
                    consent before placing non-essential cookies on your device. You can change your preferences at any
                    time via your browser settings or any in-product cookie controls we provide.
                </p>
            </>
        ),
    },
    {
        id: "what-are-cookies",
        title: "What Are Cookies?",
        body: (
            <>
                <p>
                    Cookies are small text files stored on your device when you visit a website. They allow the site to
                    recognise your device, remember your preferences, secure your session, and measure how the site is
                    used. We also use related technologies such as local storage, session storage, web beacons, and
                    pixels; references to &ldquo;cookies&rdquo; in this Policy include those technologies.
                </p>
                <p>
                    Cookies may be &ldquo;session&rdquo; cookies (deleted when you close your browser) or
                    &ldquo;persistent&rdquo; cookies (remain on your device until they expire or are deleted). They may
                    be set by us (&ldquo;first-party&rdquo;) or by a third party we have integrated with
                    (&ldquo;third-party&rdquo;).
                </p>
            </>
        ),
    },
    {
        id: "categories",
        title: "Categories of Cookies We Use",
        body: (
            <>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wide">3.1 Strictly Necessary</h3>
                <p>
                    Required for the Service to function: authentication, session management, security (e.g.
                    CSRF tokens), load balancing, and remembering your cookie preferences. These cannot be disabled
                    without breaking the Service and are placed without prior consent under the ePrivacy
                    &ldquo;strictly necessary&rdquo; exemption.
                </p>

                <h3 className="text-sm font-semibold text-white uppercase tracking-wide pt-2">3.2 Functional</h3>
                <p>
                    Remember settings and choices (language, theme, dashboard layout, prediction view) to personalise
                    your experience. Placed only with your consent where required.
                </p>

                <h3 className="text-sm font-semibold text-white uppercase tracking-wide pt-2">3.3 Analytics & Performance</h3>
                <p>
                    Help us understand how the Service is used in aggregate so we can fix problems and improve it. We
                    measure things like:
                </p>
                <ul className="list-disc pl-6 marker:text-red-500/60 space-y-1.5">
                    <li>Number of visitors and traffic sources;</li>
                    <li>Pages viewed and time spent;</li>
                    <li>Feature usage, prediction and trivia engagement;</li>
                    <li>Performance and error telemetry.</li>
                </ul>
                <p>Placed only with your consent where required.</p>

                <h3 className="text-sm font-semibold text-white uppercase tracking-wide pt-2">3.4 Marketing & Advertising</h3>
                <p className="border-l-2 border-red-500/60 pl-4 text-zinc-200">
                    We do <span className="text-white font-semibold">not</span> currently use third-party advertising
                    cookies or sell data for cross-context behavioural advertising. If this changes, we will update
                    this Policy and request fresh consent where required by law.
                </p>
            </>
        ),
    },
    {
        id: "third-party",
        title: "Third-Party Cookies & Services",
        body: (
            <>
                <p>
                    Some cookies are set by third parties whose services we use to run the platform. These third
                    parties act as our processors or as independent controllers depending on the service:
                </p>
                <ul className="list-disc pl-6 marker:text-red-500/60 space-y-1.5">
                    <li>
                        <span className="text-white font-semibold">Authentication providers</span> &mdash; for secure
                        sign-in (e.g. OAuth providers you choose to use);
                    </li>
                    <li>
                        <span className="text-white font-semibold">Payment processors</span> &mdash; to process
                        subscriptions and detect fraud;
                    </li>
                    <li>
                        <span className="text-white font-semibold">Analytics</span> &mdash; to measure usage in
                        aggregate, with IP-anonymisation where supported;
                    </li>
                    <li>
                        <span className="text-white font-semibold">Hosting, CDN and security providers</span> &mdash;
                        to deliver and protect the Service.
                    </li>
                </ul>
                <p>
                    These third parties operate under their own privacy and cookie policies, which we encourage you to
                    review.
                </p>
            </>
        ),
    },
    {
        id: "legal-basis",
        title: "Legal Basis for Using Cookies",
        body: (
            <>
                <p>
                    Where EU or UK law applies, we place cookies on the following legal bases:
                </p>
                <ul className="list-disc pl-6 marker:text-red-500/60 space-y-1.5">
                    <li>
                        <span className="text-white font-semibold">Strictly necessary cookies</span> &mdash; placed on
                        the basis of our legitimate interest in delivering a functioning, secure Service that you have
                        requested;
                    </li>
                    <li>
                        <span className="text-white font-semibold">All other cookies</span> &mdash; placed only with
                        your prior consent, which you can withdraw at any time. Withdrawing consent does not affect the
                        lawfulness of processing carried out before withdrawal.
                    </li>
                </ul>
            </>
        ),
    },
    {
        id: "managing",
        title: "Managing Your Cookie Preferences",
        body: (
            <>
                <p>
                    You can manage cookies in two main ways:
                </p>
                <ul className="list-disc pl-6 marker:text-red-500/60 space-y-1.5">
                    <li>
                        <span className="text-white font-semibold">In-product controls</span> &mdash; where we display
                        a cookie banner or preference centre, you can accept, reject, or customise non-essential
                        cookies at any time;
                    </li>
                    <li>
                        <span className="text-white font-semibold">Browser settings</span> &mdash; most browsers let
                        you block or delete cookies, or warn you before they are stored.
                    </li>
                </ul>
                <p>Common browser instructions:</p>
                <ul className="list-disc pl-6 marker:text-red-500/60 space-y-1.5">
                    <li>Chrome: Settings &rarr; Privacy and Security &rarr; Cookies and other site data;</li>
                    <li>Firefox: Settings &rarr; Privacy &amp; Security &rarr; Cookies and Site Data;</li>
                    <li>Safari: Preferences &rarr; Privacy &rarr; Cookies and website data;</li>
                    <li>Edge: Settings &rarr; Cookies and site permissions &rarr; Manage and delete cookies.</li>
                </ul>
                <p>
                    Some browsers transmit a Global Privacy Control (GPC) or Do Not Track signal. Where required by
                    law, we treat a GPC signal as a valid opt-out of any &ldquo;sale&rdquo; or &ldquo;sharing&rdquo;
                    of personal information &mdash; though, as noted above, we do not currently engage in either.
                </p>
                <p>
                    Disabling strictly necessary cookies will break parts of the Service, including login and account
                    features.
                </p>
            </>
        ),
    },
    {
        id: "similar-tech",
        title: "Similar Technologies",
        body: (
            <>
                <p>In addition to cookies, we may use:</p>
                <ul className="list-disc pl-6 marker:text-red-500/60 space-y-1.5">
                    <li>
                        <span className="text-white font-semibold">Local &amp; session storage</span> &mdash; to keep
                        you signed in, store UI state, and cache non-sensitive data on your device;
                    </li>
                    <li>
                        <span className="text-white font-semibold">Web beacons / pixels</span> &mdash; tiny graphics
                        that let us measure delivery and engagement of in-product notices or emails;
                    </li>
                    <li>
                        <span className="text-white font-semibold">Server logs and SDK telemetry</span> &mdash; to
                        diagnose errors, prevent abuse, and improve performance.
                    </li>
                </ul>
            </>
        ),
    },
    {
        id: "retention",
        title: "How Long Cookies Last",
        body: (
            <>
                <p>
                    Cookie lifetimes depend on their purpose. As a general guide:
                </p>
                <ul className="list-disc pl-6 marker:text-red-500/60 space-y-1.5">
                    <li>Session cookies expire when you close the browser;</li>
                    <li>Authentication cookies typically last up to 30 days;</li>
                    <li>Functional / preference cookies typically last up to 12 months;</li>
                    <li>Analytics cookies typically last up to 13 months.</li>
                </ul>
                <p>
                    You can delete cookies from your browser at any time, regardless of expiry.
                </p>
            </>
        ),
    },
    {
        id: "changes",
        title: "Updates to This Cookie Policy",
        body: (
            <p>
                We may update this Cookie Policy to reflect changes in technology, the Service, or applicable law. The
                updated version is identified by the &ldquo;Last Updated&rdquo; date below and takes effect on
                publication. Where changes materially affect the cookies we set, we will request fresh consent or
                notify you in-product as required.
            </p>
        ),
    },
    {
        id: "contact",
        title: "Contact Us",
        body: (
            <>
                <p>
                    For questions about this Cookie Policy, our use of cookies, or to exercise any privacy right,
                    contact us at:
                </p>
                <p className="text-white font-medium">
                    <ObfuscatedEmail user="contact" domain="t1f1.com" />
                </p>
            </>
        ),
    },
]

export default function CookiesPage() {
    return (
        <div className="min-h-screen bg-black">
            <MainNav />

            <main className="container mx-auto px-4 py-12 md:py-20">
                <div className="mx-auto max-w-4xl">
                    <ScrollAnimation direction="up">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back to Home
                        </Link>

                        <div className="mt-8 mb-10">
                            <p className="text-[10px] uppercase tracking-[0.3em] text-red-500/80">Legal &middot; Turn One</p>
                            <h1 className="mt-3 text-4xl md:text-5xl font-black tracking-tight text-white">
                                Cookie <span className="text-red-500">Policy</span>
                            </h1>
                            <p className="mt-3 text-zinc-400 max-w-2xl">
                                How Turn One uses cookies and similar technologies &mdash; what they do, why we use
                                them, and how to control them.
                            </p>
                            <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                                <span>Effective: {EFFECTIVE_DATE}</span>
                                <span className="text-zinc-700">/</span>
                                <span>Last Updated: {LAST_UPDATED}</span>
                                <span className="text-zinc-700">/</span>
                                <span className="border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-red-400">{VERSION}</span>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {sections.map((section, idx) => (
                                <section
                                    key={section.id}
                                    id={section.id}
                                    className="border border-zinc-800 border-l-4 border-l-red-500 bg-zinc-950 p-6 md:p-8"
                                >
                                    <p className="text-[10px] uppercase tracking-[0.3em] text-red-500/70">
                                        Section {String(idx + 1).padStart(2, "0")}
                                    </p>
                                    <h2 className="mt-2 mb-4 text-2xl font-bold text-white">{section.title}</h2>
                                    <div className="space-y-4 text-zinc-300 leading-relaxed">{section.body}</div>
                                </section>
                            ))}
                        </div>

                        <div className="mt-10 flex flex-col gap-2 border-t border-zinc-800 pt-5 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
                            <span>Last Updated: {LAST_UPDATED}</span>
                            <span className="uppercase tracking-[0.2em]">Turn One &middot; {VERSION}</span>
                        </div>
                    </ScrollAnimation>
                </div>
            </main>
        </div>
    )
}
