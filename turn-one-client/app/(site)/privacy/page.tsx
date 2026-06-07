import { MainNav } from "@/components/navigation/main-nav"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ObfuscatedEmail } from "@/components/ui/obfuscated-email"
import { ScrollAnimation } from "@/components/animation/scroll-animation"
import { Metadata } from "next"
import { generateSEO } from "@/lib/seo"

export const metadata: Metadata = generateSEO({
    title: "Privacy Policy",
    description:
        "Turn One Privacy Policy - Learn how we protect your data and privacy while using our F1 live timing and telemetry platform. Transparent data handling and security practices.",
    url: "/privacy",
    keywords: [
        "F1 privacy policy",
        "data protection",
        "user privacy",
        "GDPR compliance",
    ],
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
                    Turn One (&ldquo;Turn One&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) respects
                    your privacy and is committed to protecting your personal information. This Privacy Policy
                    describes how we collect, use, disclose, and safeguard information when you use our F1 telemetry
                    analysis, live timing, prediction, and entertainment platform, including our website, mobile
                    applications, APIs, and related services (collectively, the &ldquo;Service&rdquo;).
                </p>
                <p>
                    For the purposes of EU and UK data protection law, the data controller is Turn One, established in
                    Romania. For all privacy enquiries, exercise of rights, or complaints, please contact{" "}
                    <ObfuscatedEmail user="contact" domain="t1f1.com" />.
                </p>
                <p>
                    By accessing or using the Service, you confirm that you have read and understood this Privacy
                    Policy. If you do not agree, please do not use the Service.
                </p>
            </>
        ),
    },
    {
        id: "information-we-collect",
        title: "Information We Collect",
        body: (
            <>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wide">2.1 Information You Provide</h3>
                <ul className="list-disc pl-6 marker:text-red-500/60 space-y-1.5">
                    <li>Account information (display name, email address, username, hashed password);</li>
                    <li>Profile information (avatar, biography, country, preferences);</li>
                    <li>Payment information processed by our payment processors (we do not store full card numbers);</li>
                    <li>User-generated content (predictions, trivia answers, messages, support requests);</li>
                    <li>Communications you send to us.</li>
                </ul>

                <h3 className="text-sm font-semibold text-white uppercase tracking-wide pt-2">2.2 Information We Collect Automatically</h3>
                <ul className="list-disc pl-6 marker:text-red-500/60 space-y-1.5">
                    <li>Log data: IP address, browser and OS type, referrer, pages viewed, timestamps;</li>
                    <li>Device data: hardware model, OS version, language, and (where permitted) device identifiers;</li>
                    <li>Service usage: feature usage, click events, prediction history, trivia attempts, level/XP events;</li>
                    <li>Diagnostic data: crash logs, error reports, and performance metrics.</li>
                </ul>

                <h3 className="text-sm font-semibold text-white uppercase tracking-wide pt-2">2.3 Information from Third Parties</h3>
                <ul className="list-disc pl-6 marker:text-red-500/60 space-y-1.5">
                    <li>OAuth / social-login providers, where you choose to sign in via them;</li>
                    <li>Payment processors (transaction status, last-four card digits, billing country);</li>
                    <li>Analytics and anti-abuse providers acting as our processors.</li>
                </ul>

                <h3 className="text-sm font-semibold text-white uppercase tracking-wide pt-2">2.4 Cookies & Similar Technologies</h3>
                <p>
                    We use cookies, local storage, and similar technologies for authentication, security,
                    functionality, and analytics. See &sect;10 below.
                </p>
            </>
        ),
    },
    {
        id: "legal-bases",
        title: "Legal Bases for Processing (GDPR / UK GDPR)",
        body: (
            <>
                <p>Where EU or UK data protection law applies, we rely on the following legal bases:</p>
                <ul className="list-disc pl-6 marker:text-red-500/60 space-y-1.5">
                    <li>
                        <span className="text-white font-semibold">Contract performance</span> &mdash; to create your
                        account, provide the Service, process subscriptions, and support you;
                    </li>
                    <li>
                        <span className="text-white font-semibold">Legitimate interests</span> &mdash; to secure the
                        Service, prevent fraud and abuse, measure and improve performance, and communicate service
                        updates, balanced against your rights;
                    </li>
                    <li>
                        <span className="text-white font-semibold">Consent</span> &mdash; for non-essential cookies,
                        certain analytics, and any marketing communications, which you may withdraw at any time;
                    </li>
                    <li>
                        <span className="text-white font-semibold">Legal obligation</span> &mdash; to comply with tax,
                        accounting, regulatory, or law-enforcement requirements.
                    </li>
                </ul>
            </>
        ),
    },
    {
        id: "how-we-use",
        title: "How We Use Your Information",
        body: (
            <>
                <p>We use information for purposes including:</p>
                <ul className="list-disc pl-6 marker:text-red-500/60 space-y-1.5">
                    <li>Operating, maintaining, securing, and improving the Service;</li>
                    <li>Authenticating users and managing accounts, subscriptions, and entitlements;</li>
                    <li>Processing payments and preventing fraudulent transactions;</li>
                    <li>Calculating predictions outcomes, leaderboards, XP, and other gamification rewards;</li>
                    <li>Sending transactional messages (account, security, billing, service updates);</li>
                    <li>Responding to support requests and feedback;</li>
                    <li>Personalising content, recommendations, and notifications;</li>
                    <li>Measuring and analysing usage trends to develop new features;</li>
                    <li>Detecting, investigating, and preventing abuse, security incidents, and policy violations;</li>
                    <li>Complying with legal obligations and enforcing our Terms.</li>
                </ul>
            </>
        ),
    },
    {
        id: "sharing",
        title: "Sharing & Disclosure",
        body: (
            <>
                <p>We share personal information only as described below:</p>
                <ul className="list-disc pl-6 marker:text-red-500/60 space-y-1.5">
                    <li>
                        <span className="text-white font-semibold">Sub-processors</span> we engage to provide the
                        Service on our behalf (hosting, databases, email delivery, payment processing, analytics,
                        anti-abuse, customer support), bound by written contracts and confidentiality;
                    </li>
                    <li>With your consent or at your explicit direction;</li>
                    <li>
                        In connection with a merger, acquisition, restructuring, financing, or sale of assets, subject
                        to standard confidentiality safeguards;
                    </li>
                    <li>
                        To comply with applicable law, legal process, or enforceable governmental request, or to
                        protect the rights, property, or safety of Turn One, our users, or the public;
                    </li>
                    <li>In aggregated or de-identified form that cannot reasonably be used to identify you.</li>
                </ul>
                <p className="border-l-2 border-red-500/60 pl-4 text-zinc-200">
                    We do <span className="text-white font-semibold">not</span> sell your personal information, and we
                    do not share it for cross-context behavioural advertising.
                </p>
            </>
        ),
    },
    {
        id: "transfers",
        title: "International Data Transfers",
        body: (
            <p>
                Your information may be processed in countries other than your country of residence, including within
                the European Economic Area, the United Kingdom, and the United States. Where personal data is
                transferred outside the EEA or UK, we rely on appropriate safeguards such as the European Commission&apos;s
                Standard Contractual Clauses, the UK International Data Transfer Addendum, or adequacy decisions, and
                we apply supplementary measures where required.
            </p>
        ),
    },
    {
        id: "retention",
        title: "Data Retention",
        body: (
            <>
                <p>
                    We retain personal information only for as long as necessary for the purposes set out in this
                    Policy, including to provide the Service, comply with legal obligations, resolve disputes, and
                    enforce our agreements.
                </p>
                <ul className="list-disc pl-6 marker:text-red-500/60 space-y-1.5">
                    <li>
                        Account data: kept while your account is active. After closure, deleted or anonymised within
                        90 days, unless longer retention is required by law (e.g. tax records, typically up to 10 years
                        under Romanian law);
                    </li>
                    <li>Logs and security data: typically retained for up to 12 months;</li>
                    <li>Backup copies: rotated out of cold storage on standard cycles, not exceeding 12 months;</li>
                    <li>
                        Payment and billing records: retained for the period required by applicable accounting and tax
                        law.
                    </li>
                </ul>
            </>
        ),
    },
    {
        id: "security",
        title: "Data Security",
        body: (
            <p>
                We implement industry-standard technical and organisational safeguards designed to protect personal
                information against unauthorised access, alteration, disclosure, loss, or destruction, including
                encryption in transit, access controls, and routine security review. However,{" "}
                <span className="text-white font-semibold">no method of transmission or storage is perfectly secure</span>,
                and we cannot guarantee absolute security. You are responsible for safeguarding your account
                credentials and for promptly notifying us of any suspected unauthorised access.
            </p>
        ),
    },
    {
        id: "rights",
        title: "Your Rights & Choices",
        body: (
            <>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wide">9.1 EU / UK Residents (GDPR / UK GDPR)</h3>
                <p>You have the right to:</p>
                <ul className="list-disc pl-6 marker:text-red-500/60 space-y-1.5">
                    <li>Access the personal data we hold about you;</li>
                    <li>Rectify inaccurate or incomplete data;</li>
                    <li>Request erasure of your data (&ldquo;right to be forgotten&rdquo;);</li>
                    <li>Restrict or object to certain processing, including processing based on legitimate interests;</li>
                    <li>Receive your data in a portable, machine-readable format;</li>
                    <li>Withdraw consent at any time where processing is based on consent;</li>
                    <li>
                        Lodge a complaint with your local supervisory authority &mdash; in Romania, the National
                        Supervisory Authority for Personal Data Processing (ANSPDCP).
                    </li>
                </ul>

                <h3 className="text-sm font-semibold text-white uppercase tracking-wide pt-2">9.2 California Residents (CCPA / CPRA)</h3>
                <p>If you are a California resident, you have the right to:</p>
                <ul className="list-disc pl-6 marker:text-red-500/60 space-y-1.5">
                    <li>Know what personal information we collect, use, and disclose;</li>
                    <li>Request deletion or correction of your personal information;</li>
                    <li>Opt out of any &ldquo;sale&rdquo; or &ldquo;sharing&rdquo; of personal information &mdash; we do not engage in either;</li>
                    <li>Limit the use of sensitive personal information;</li>
                    <li>Non-discrimination for exercising any of these rights.</li>
                </ul>

                <h3 className="text-sm font-semibold text-white uppercase tracking-wide pt-2">9.3 Other Jurisdictions</h3>
                <p>
                    If you are located elsewhere, you may have similar rights under your local law. To exercise any
                    right, please contact <ObfuscatedEmail user="contact" domain="t1f1.com" />. We may verify your
                    identity before responding and will respond within the timeframes required by applicable law.
                </p>
            </>
        ),
    },
    {
        id: "cookies",
        title: "Cookies & Tracking Technologies",
        body: (
            <>
                <p>We use the following categories of cookies and similar technologies:</p>
                <ul className="list-disc pl-6 marker:text-red-500/60 space-y-1.5">
                    <li>
                        <span className="text-white font-semibold">Strictly necessary</span> &mdash; required for
                        authentication, security, and core functionality. Cannot be disabled;
                    </li>
                    <li>
                        <span className="text-white font-semibold">Functional</span> &mdash; remember preferences and
                        settings to personalise your experience;
                    </li>
                    <li>
                        <span className="text-white font-semibold">Analytics</span> &mdash; help us understand how the
                        Service is used, in aggregated form, so we can improve it.
                    </li>
                </ul>
                <p>
                    You can manage cookies in your browser settings or via any in-product cookie preferences we offer.
                    Disabling certain cookies may degrade or break parts of the Service.
                </p>
            </>
        ),
    },
    {
        id: "children",
        title: "Children's Privacy",
        body: (
            <p>
                The Service is not directed to children under 16, and we do not knowingly collect personal information
                from children under 16. If you believe we have collected information from a child under 16, please
                contact <ObfuscatedEmail user="contact" domain="t1f1.com" /> and we will delete it as soon as
                reasonably possible. Where parental consent is permitted as a legal basis under local law, we may
                process a minor&apos;s data only with verifiable parental consent.
            </p>
        ),
    },
    {
        id: "automated",
        title: "Automated Decision-Making",
        body: (
            <p>
                We do not make decisions about you based solely on automated processing that produce legal effects or
                similarly significantly affect you. We may use automated tools for fraud prevention, abuse detection,
                and content recommendations; in each case, material decisions involving you are reviewable by a human
                on request.
            </p>
        ),
    },
    {
        id: "changes",
        title: "Changes to This Policy",
        body: (
            <p>
                We may update this Privacy Policy from time to time. The updated version is indicated by an updated
                &ldquo;Last Updated&rdquo; date and takes effect when published. If changes are material, we will
                provide additional notice (e.g. by email or in-product banner). We encourage you to review this Policy
                periodically.
            </p>
        ),
    },
    {
        id: "contact",
        title: "Contact & Complaints",
        body: (
            <>
                <p>
                    For any questions, requests, or complaints regarding this Privacy Policy or our processing of your
                    personal information, contact us at:
                </p>
                <p className="text-white font-medium">
                    <ObfuscatedEmail user="contact" domain="t1f1.com" />
                </p>
            </>
        ),
    },
]

export default function PrivacyPage() {
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
                                Privacy <span className="text-red-500">Policy</span>
                            </h1>
                            <p className="mt-3 text-zinc-400 max-w-2xl">
                                How Turn One collects, uses, and protects your information when you use our F1
                                telemetry, prediction, and live timing platform. Transparency is the default.
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
