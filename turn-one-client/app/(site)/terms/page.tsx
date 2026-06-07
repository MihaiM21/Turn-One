import { MainNav } from "@/components/navigation/main-nav"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ObfuscatedEmail } from "@/components/ui/obfuscated-email"
import { ScrollAnimation } from "@/components/animation/scroll-animation"
import { Metadata } from "next"
import { generateSEO } from "@/lib/seo"

export const metadata: Metadata = generateSEO({
    title: "Terms of Service",
    description:
        "Turn One Terms of Service - Review the terms and conditions for using our F1 live timing, telemetry analysis, and motorsport intelligence platform.",
    url: "/terms",
    keywords: [
        "F1 terms of service",
        "user agreement",
        "terms and conditions",
        "platform terms",
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
        id: "agreement",
        title: "Agreement to Terms",
        body: (
            <>
                <p>
                    These Terms of Service (the &ldquo;Terms&rdquo;) form a legally binding agreement between you
                    (&ldquo;you&rdquo;, &ldquo;user&rdquo;) and Turn One (&ldquo;Turn One&rdquo;, &ldquo;we&rdquo;,
                    &ldquo;us&rdquo;, &ldquo;our&rdquo;) governing your access to and use of the Turn One website,
                    mobile applications, APIs, dashboards, and related services (collectively, the
                    &ldquo;Service&rdquo;).
                </p>
                <p>
                    By accessing, registering for, or using the Service in any way, you confirm that you have read,
                    understood, and agreed to these Terms and to our{" "}
                    <Link href="/privacy" className="text-red-400 hover:text-red-300 underline-offset-4 hover:underline">
                        Privacy Policy
                    </Link>
                    , which is incorporated by reference. If you do not agree, you must stop using the Service.
                </p>
                <p>
                    These Terms also incorporate any product-specific terms, plan terms, promotional terms, or
                    in-product notices we publish from time to time. If you are under the age of 18, you may use the
                    Service only with the involvement and consent of a parent or legal guardian who agrees to be bound
                    by these Terms on your behalf.
                </p>
            </>
        ),
    },
    {
        id: "eligibility",
        title: "Eligibility & Account",
        body: (
            <>
                <p>
                    You must be at least 16 years old to create an account. Users under 18 require verifiable parental
                    or guardian consent. You represent that you have the legal capacity to enter into a binding
                    agreement and that you are not barred from using the Service under the laws of your jurisdiction.
                </p>
                <p>
                    You may not use the Service if you are located in, ordinarily resident in, or a national of any
                    country or region subject to comprehensive sanctions administered by the European Union, the
                    United Kingdom, or the United States (including OFAC-restricted jurisdictions), or if you appear on
                    any government list of restricted or prohibited persons.
                </p>
                <p>
                    You are limited to one account per person unless we expressly agree otherwise in writing. You are
                    responsible for the accuracy of the information you provide, for keeping your account credentials
                    confidential, and for all activity that occurs under your account. You must notify us immediately
                    of any suspected unauthorized use at <ObfuscatedEmail user="contact" domain="t1f1.com" />.
                </p>
                <p>
                    We may, at our reasonable discretion, refuse, suspend, or terminate any account, or require
                    additional identity verification, where we suspect fraud, abuse, breach of these Terms, or risk to
                    other users or to the Service.
                </p>
            </>
        ),
    },
    {
        id: "service",
        title: "Description of Service",
        body: (
            <>
                <p>
                    Turn One is an <span className="text-white font-semibold">independent fan analytics, live timing
                    visualisation, prediction, and entertainment platform</span> focused on Formula 1 and related
                    motorsport content. The Service may surface live or near-live timing information, historical
                    statistics, race analytics, prediction games, trivia, leaderboards, and community features.
                </p>
                <p className="border-l-2 border-red-500/60 pl-4 text-zinc-200">
                    Turn One is <span className="text-white font-semibold">NOT affiliated with, endorsed by,
                    sponsored by, or licensed by</span> Formula One World Championship Limited, Formula One Management,
                    the F&eacute;d&eacute;ration Internationale de l&apos;Automobile (FIA), Formula One Licensing BV,
                    any Formula 1 team, driver, broadcaster, or sponsor. All Formula 1 trademarks, team names, driver
                    names, and event names are the property of their respective owners and are used solely for
                    identification and informational purposes.
                </p>
                <p>
                    All data, statistics, predictions, telemetry visualisations, and editorial content are provided
                    for <span className="text-white font-semibold">informational and entertainment purposes only</span>.
                    Data may be delayed, incomplete, inaccurate, estimated, derived, or interrupted. You must not rely
                    on any output of the Service for safety-critical decisions, professional advice, commercial
                    decisions, wagering, or any purpose where errors could cause loss.
                </p>
                <p>
                    We may modify, suspend, or discontinue any part of the Service, including features, content,
                    plans, and virtual items, at any time and without liability.
                </p>
            </>
        ),
    },
    {
        id: "billing",
        title: "Subscriptions, Billing & Refunds",
        body: (
            <>
                <p>
                    Certain features of the Service are offered on a paid subscription basis (e.g. BASIC, PRO).
                    Subscription fees, billing cycles, and included entitlements are described at the point of
                    purchase. By subscribing, you authorise us and our payment processors to charge your selected
                    payment method on a recurring basis until you cancel.
                </p>
                <p>
                    <span className="text-white font-semibold">Auto-renewal.</span> Subscriptions automatically renew
                    at the end of each billing cycle at the then-current price unless cancelled before the renewal
                    date. You can cancel at any time from your account settings; access continues until the end of the
                    paid period.
                </p>
                <p>
                    <span className="text-white font-semibold">EU/UK statutory withdrawal.</span> If you are an EU or
                    UK consumer, you ordinarily have a 14-day right of withdrawal for digital services. By starting to
                    use the Service immediately upon purchase, you expressly request immediate performance and
                    acknowledge that, to the extent permitted by law, this right of withdrawal is lost once digital
                    content has been supplied or service usage has begun.
                </p>
                <p>
                    Except where required by mandatory consumer law, fees are non-refundable, and partial periods are
                    not refunded. Taxes, currency conversion fees, and bank charges are your responsibility. Chargebacks
                    or reversed payments may result in immediate suspension or termination of your account.
                </p>
                <p>
                    We may change pricing, plan structure, or included entitlements with at least 30 days&apos; notice
                    by email or in-product notice. Continued use after the change takes effect constitutes acceptance
                    of the new pricing.
                </p>
            </>
        ),
    },
    {
        id: "virtual-items",
        title: "Virtual Items, Coins, Predictions & Trivia",
        body: (
            <>
                <p>
                    The Service includes gamification features such as coins, tokens, XP, daily gifts, starter packs,
                    predictions, and trivia rewards (collectively, &ldquo;Virtual Items&rdquo;).
                </p>
                <p>
                    Virtual Items <span className="text-white font-semibold">have no monetary value</span>, are not
                    legal tender, are not stored value, and are not your property. They are a limited, personal,
                    non-transferable, non-sublicensable licence to access in-Service features. Virtual Items cannot be
                    sold, traded, exchanged for cash, gifted to third parties outside the Service, or redeemed for
                    anything of real-world value. We may modify, expire, devalue, or revoke Virtual Items at any time.
                </p>
                <p className="border-l-2 border-red-500/60 pl-4 text-zinc-200">
                    Predictions, trivia, leaderboards, and similar features are{" "}
                    <span className="text-white font-semibold">games of skill and entertainment, not gambling,
                    betting, or wagering</span>. You do not pay to enter with the expectation of winning a prize of
                    monetary value, and no such prize is awarded. If your jurisdiction nonetheless treats any feature
                    as a regulated activity, you must not use that feature.
                </p>
                <p>
                    Any prizes, perks, or rewards offered through promotions are governed by the specific promotion
                    terms, are subject to availability, and are void where prohibited.
                </p>
            </>
        ),
    },
    {
        id: "acceptable-use",
        title: "Acceptable Use",
        body: (
            <>
                <p>You agree not to, and not to attempt or assist any third party to:</p>
                <ul className="list-disc pl-6 text-zinc-300 marker:text-red-500/60 space-y-1.5">
                    <li>Violate any applicable law, regulation, or third-party right;</li>
                    <li>Access or use the Service for the benefit of any sanctioned person or jurisdiction;</li>
                    <li>Probe, scan, or test the vulnerability of the Service, or breach security or authentication;</li>
                    <li>
                        Use any automated means (bots, scrapers, crawlers, headless browsers) to access, collect, or
                        index any part of the Service except as expressly permitted by a documented public API;
                    </li>
                    <li>
                        Reverse engineer, decompile, disassemble, or attempt to derive source code or underlying ideas,
                        except as permitted by mandatory law;
                    </li>
                    <li>Circumvent, disable, or otherwise interfere with rate limits, usage quotas, or access controls;</li>
                    <li>
                        Resell, sublicense, redistribute, or commercially exploit Service data, including using it as
                        input to train, fine-tune, or evaluate machine-learning models, without our prior written
                        consent;
                    </li>
                    <li>Upload or transmit malware, viruses, or any harmful or deceptive code;</li>
                    <li>Impersonate any person or entity or misrepresent your affiliation;</li>
                    <li>Share, transfer, or sell your account or credentials;</li>
                    <li>Use the Service to harass, defame, threaten, or harm any person;</li>
                    <li>
                        Interfere with or disrupt the integrity, performance, or availability of the Service or the
                        data it contains.
                    </li>
                </ul>
            </>
        ),
    },
    {
        id: "user-content",
        title: "User Content & Licence",
        body: (
            <>
                <p>
                    The Service may allow you to submit, post, or transmit content such as predictions, profile
                    information, messages, images, or comments (&ldquo;User Content&rdquo;). You retain all ownership
                    rights in your User Content.
                </p>
                <p>
                    By submitting User Content, you grant Turn One a limited, worldwide, non-exclusive, royalty-free,
                    sublicensable, and transferable licence to host, store, reproduce, modify, create derivative works
                    of, communicate, publish, publicly perform, publicly display, and distribute such User Content
                    <span className="text-white font-semibold"> solely for the purposes of operating, providing,
                    securing, promoting, and improving the Service</span>. This licence ends when you delete the User
                    Content, except where retention is required by law or for back-ups for a reasonable period.
                </p>
                <p>
                    You represent and warrant that you own or have all necessary rights, consents, and permissions to
                    grant the foregoing licence and that your User Content does not infringe any third party&apos;s
                    intellectual property, privacy, publicity, or other rights, and does not violate any law.
                </p>
                <p>
                    We may, but are not obliged to, review, moderate, refuse, edit, or remove User Content at our sole
                    discretion, without notice.
                </p>
            </>
        ),
    },
    {
        id: "ip-dmca",
        title: "Intellectual Property, Trademarks & Copyright Notices",
        body: (
            <>
                <p>
                    The Service, including its software, design, look and feel, text, graphics, logos, and the
                    selection and arrangement thereof, is owned by Turn One and its licensors and is protected by
                    copyright, trademark, database, and other intellectual property laws. Subject to these Terms, we
                    grant you a personal, limited, non-exclusive, non-transferable, revocable licence to access and use
                    the Service for your personal, non-commercial use.
                </p>
                <p>
                    &ldquo;Formula 1&rdquo;, &ldquo;F1&rdquo;, FIA, team names, driver names, and circuit names
                    referenced in the Service are trademarks of their respective owners and are used nominatively for
                    identification only. No endorsement or affiliation is claimed.
                </p>
                <p>
                    <span className="text-white font-semibold">Copyright complaints.</span> If you believe that
                    content available through the Service infringes your copyright, please send a notice to{" "}
                    <ObfuscatedEmail user="contact" domain="t1f1.com" /> including: (i) a physical or electronic
                    signature of the rights-holder or authorised agent; (ii) identification of the work claimed to be
                    infringed; (iii) identification of the material to be removed and information reasonably sufficient
                    to locate it; (iv) your contact information; (v) a statement that you have a good-faith belief that
                    the use is not authorised; and (vi) a statement, under penalty of perjury, that the information is
                    accurate and that you are authorised to act. We may forward valid notices to the user who posted
                    the content and may, in appropriate circumstances, terminate repeat infringers. A counter-notice
                    procedure is available on request.
                </p>
            </>
        ),
    },
    {
        id: "privacy",
        title: "Privacy",
        body: (
            <p>
                Our collection and use of personal information in connection with the Service is described in our{" "}
                <Link href="/privacy" className="text-red-400 hover:text-red-300 underline-offset-4 hover:underline">
                    Privacy Policy
                </Link>
                . By using the Service, you acknowledge that the Privacy Policy applies to you.
            </p>
        ),
    },
    {
        id: "disclaimers",
        title: "Disclaimers",
        body: (
            <>
                <p className="uppercase tracking-wide text-zinc-300 text-sm">
                    The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis, with all
                    faults and without warranties of any kind, whether express, implied, statutory, or otherwise. To
                    the maximum extent permitted by law, Turn One disclaims all warranties, including implied
                    warranties of merchantability, fitness for a particular purpose, non-infringement, quiet enjoyment,
                    and any warranty arising from course of dealing or usage of trade.
                </p>
                <p>
                    Without limiting the foregoing, Turn One does not warrant that: (a) the Service will meet your
                    requirements; (b) the Service will be uninterrupted, timely, secure, or error-free; (c) any
                    telemetry, timing, statistics, predictions, results, or other content will be accurate, current,
                    complete, or reliable; (d) defects will be corrected; or (e) the Service is free of viruses or
                    harmful components.
                </p>
                <p>
                    Some jurisdictions do not allow the exclusion of certain warranties; in such jurisdictions, the
                    exclusions above apply to you only to the maximum extent permitted by law.
                </p>
            </>
        ),
    },
    {
        id: "liability",
        title: "Limitation of Liability",
        body: (
            <>
                <p className="uppercase tracking-wide text-zinc-300 text-sm">
                    To the maximum extent permitted by law, in no event shall Turn One, its affiliates, officers,
                    directors, employees, agents, suppliers, or licensors be liable for any indirect, incidental,
                    special, consequential, exemplary, or punitive damages, or for any loss of profits, revenues,
                    data, goodwill, use, or other intangible losses, arising out of or relating to your access to,
                    use of, or inability to use the Service, whether based on warranty, contract, tort (including
                    negligence), statute, or any other legal theory, and whether or not we have been advised of the
                    possibility of such damages.
                </p>
                <p className="border-l-2 border-red-500/60 pl-4 text-zinc-200">
                    To the maximum extent permitted by law, Turn One&apos;s total aggregate liability arising out of or
                    relating to these Terms or the Service shall not exceed the{" "}
                    <span className="text-white font-semibold">greater of (a) the total fees you actually paid to
                    Turn One for the Service in the twelve (12) months immediately preceding the event giving rise to
                    the claim, or (b) one hundred US dollars (USD 100)</span>.
                </p>
                <p>
                    Nothing in these Terms limits or excludes any liability that cannot be limited or excluded under
                    applicable law, including, where applicable, liability for death or personal injury caused by
                    negligence, for fraud or fraudulent misrepresentation, or for mandatory statutory consumer rights.
                    In such jurisdictions, our liability is limited to the smallest extent permitted by law.
                </p>
            </>
        ),
    },
    {
        id: "indemnity",
        title: "Indemnification",
        body: (
            <p>
                You agree to defend, indemnify, and hold harmless Turn One, its affiliates, and their respective
                officers, directors, employees, contractors, and agents from and against any and all claims, damages,
                obligations, losses, liabilities, costs, and expenses (including reasonable legal fees) arising out of
                or relating to: (a) your access to or use of the Service; (b) your User Content; (c) your violation of
                these Terms; (d) your violation of any third-party right, including intellectual property, privacy, or
                publicity rights; or (e) your violation of any applicable law. We reserve the right to assume the
                exclusive defence and control of any matter subject to indemnification, in which case you agree to
                cooperate with us.
            </p>
        ),
    },
    {
        id: "termination",
        title: "Suspension & Termination",
        body: (
            <>
                <p>
                    We may suspend or terminate your access to all or part of the Service at any time, with or without
                    notice, for any reason, including suspected breach of these Terms, risk to the Service or other
                    users, legal or regulatory requirements, or prolonged inactivity.
                </p>
                <p>
                    You may terminate your account at any time by discontinuing use of the Service and requesting
                    deletion via your account settings or by contacting us. Termination does not entitle you to a
                    refund of any pre-paid fees except where required by law.
                </p>
                <p>
                    Provisions that by their nature should survive termination will survive, including ownership and
                    intellectual property provisions, disclaimers, limitation of liability, indemnification, dispute
                    resolution, and the miscellaneous clauses below.
                </p>
            </>
        ),
    },
    {
        id: "disputes",
        title: "Governing Law, Dispute Resolution & Class Waiver",
        body: (
            <>
                <p>
                    These Terms and any dispute or claim arising out of or in connection with them or their subject
                    matter or formation (including non-contractual disputes) are governed by the laws of{" "}
                    <span className="text-white font-semibold">Romania</span>, without regard to its conflict-of-law
                    rules. The competent courts of <span className="text-white font-semibold">Bucharest, Romania</span>{" "}
                    shall have exclusive jurisdiction, subject to any mandatory consumer-protection rule that grants you
                    the right to bring proceedings in the courts of your country of residence within the EU or UK.
                </p>
                <p>
                    Before initiating any formal proceeding, the parties agree to attempt to resolve any dispute
                    informally and in good faith by sending written notice to{" "}
                    <ObfuscatedEmail user="contact" domain="t1f1.com" /> describing the dispute and the relief sought,
                    and by negotiating for at least 30 days.
                </p>
                <p className="border-l-2 border-red-500/60 pl-4 text-zinc-200">
                    <span className="text-white font-semibold">Class action waiver.</span> To the maximum extent
                    permitted by law, any dispute shall be resolved on an individual basis only. You and Turn One waive
                    any right to participate in a class action, collective action, representative action, consolidated
                    action, or private attorney general action against the other. Nothing in this section affects any
                    mandatory consumer right that cannot be waived under applicable law.
                </p>
            </>
        ),
    },
    {
        id: "force-majeure",
        title: "Force Majeure",
        body: (
            <p>
                Turn One shall not be liable for any failure or delay in performance to the extent caused by events
                beyond its reasonable control, including acts of God, natural disasters, war, terrorism, civil
                disturbance, epidemic or pandemic, governmental action, embargo, labour disputes, internet outages,
                third-party service failures, denial-of-service attacks, or failure of utilities or telecommunications.
            </p>
        ),
    },
    {
        id: "miscellaneous",
        title: "Severability, Waiver & Assignment",
        body: (
            <>
                <p>
                    If any provision of these Terms is held to be invalid, illegal, or unenforceable, that provision
                    shall be modified to the minimum extent necessary to make it enforceable, or, if not possible,
                    severed, and the remaining provisions shall continue in full force and effect.
                </p>
                <p>
                    No failure or delay by Turn One in exercising any right under these Terms operates as a waiver of
                    that right. A waiver is effective only if given in writing.
                </p>
                <p>
                    You may not assign, sublicense, or transfer these Terms or any of your rights or obligations
                    without our prior written consent. We may assign or transfer these Terms, in whole or in part,
                    without restriction, including in connection with a merger, acquisition, reorganisation, or sale of
                    assets.
                </p>
            </>
        ),
    },
    {
        id: "changes",
        title: "Changes to These Terms",
        body: (
            <>
                <p>
                    We may modify these Terms from time to time. If a change is material (for example, a change to the
                    dispute-resolution provisions, fees, limitations of liability, or licence grant), we will provide
                    at least 30 days&apos; notice by email or in-product notice before it takes effect. Non-material
                    changes take effect when published.
                </p>
                <p>
                    Your continued use of the Service after a change becomes effective constitutes acceptance of the
                    updated Terms. If you do not agree to the updated Terms, you must stop using the Service.
                </p>
            </>
        ),
    },
    {
        id: "entire",
        title: "Entire Agreement",
        body: (
            <p>
                These Terms, together with the Privacy Policy and any product-specific or plan-specific terms
                referenced herein, constitute the entire agreement between you and Turn One regarding the Service and
                supersede all prior or contemporaneous understandings and agreements relating to the same subject
                matter.
            </p>
        ),
    },
    {
        id: "contact",
        title: "Contact",
        body: (
            <>
                <p>For any questions, notices, or requests relating to these Terms, please contact us at:</p>
                <p className="text-white font-medium">
                    <ObfuscatedEmail user="contact" domain="t1f1.com" />
                </p>
            </>
        ),
    },
]

export default function TermsPage() {
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
                                Terms of <span className="text-red-500">Service</span>
                            </h1>
                            <p className="mt-3 text-zinc-400 max-w-2xl">
                                The rules of the road for using Turn One&apos;s F1 telemetry, live timing, and
                                prediction platform. Read carefully &mdash; using the Service means you accept them.
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
