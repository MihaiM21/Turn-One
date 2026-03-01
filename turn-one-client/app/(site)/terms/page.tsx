import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MainNav } from "@/components/navigation/main-nav"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ObfuscatedEmail } from "@/components/ui/obfuscated-email"
import { ScrollAnimation } from "@/components/animation/scroll-animation"
import { Metadata } from 'next'
import { generateSEO } from '@/lib/seo'

export const metadata: Metadata = generateSEO({
  title: 'Terms of Service',
  description: 'Turn One Terms of Service - Review the terms and conditions for using our F1 live timing, telemetry analysis, and motorsport intelligence platform.',
  url: '/terms',
  keywords: [
    'F1 terms of service',
    'user agreement',
    'terms and conditions',
    'platform terms',
  ],
})

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-red-950/20 to-black">
            <MainNav />
            
            <main className="container mx-auto px-4 py-12 md:py-20">
                <div className="flex flex-col space-y-12 max-w-4xl mx-auto">
                    <ScrollAnimation direction="up">
                        <Button variant="ghost" asChild className="text-red-200 hover:bg-red-950/20 w-fit">
                            <Link href="/">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Home
                            </Link>
                        </Button>
                        
                        <h1 className="text-4xl md:text-5xl font-bold mt-6 mb-8 text-white">Terms of Service</h1>
                        
                        <Card className="border-red-800/20 bg-black/40 backdrop-blur-sm shadow-lg">
                            <CardContent className="pt-6 space-y-8">
                                <section className="space-y-4">
                                    <h2 className="text-2xl font-semibold text-white">1. Agreement to Terms</h2>
                                    <p className="text-gray-300">
                                        These Terms of Service (the "Terms") govern your access to and use of Turn One's F1 telemetry analysis platform, 
                                        including our website, mobile application, and related services (collectively, the "Service"). 
                                    </p>
                                    <p className="text-gray-300">
                                        By accessing or using the Service, you agree to be bound by these Terms. If you do not agree to these Terms, 
                                        you may not access or use the Service. These Terms constitute a legally binding agreement between you and Turn One.
                                    </p>
                                </section>
                                
                                <section className="space-y-4">
                                    <h2 className="text-2xl font-semibold text-white">2. Service Description</h2>
                                    <p className="text-gray-300">
                                        Turn One provides F1 telemetry analysis tools, data visualization, and race analytics for Formula 1 teams, 
                                        drivers, and enthusiasts. Our Service allows users to access, analyze, and interpret Formula 1 telemetry data 
                                        for performance improvement, strategy development, and entertainment purposes.
                                    </p>
                                </section>
                                
                                <section className="space-y-4">
                                    <h2 className="text-2xl font-semibold text-white">3. Account Registration and Eligibility</h2>
                                    <p className="text-gray-300">
                                        To access certain features of our Service, you may be required to register for an account. When you register, 
                                        you agree to provide accurate, current, and complete information and to update such information to keep it accurate, 
                                        current, and complete.
                                    </p>
                                    <p className="text-gray-300">
                                        You must be at least 16 years old to use the Service. By using the Service, you represent and warrant that 
                                        you meet all eligibility requirements we outline in these Terms. We may, in our sole discretion, refuse to 
                                        offer the Service to any person or entity and change the eligibility criteria at any time.
                                    </p>
                                    <p className="text-gray-300">
                                        You are responsible for maintaining the confidentiality of your account credentials and for all activities that 
                                        occur under your account. You agree to notify us immediately of any unauthorized use of your account.
                                    </p>
                                </section>
                                
                                <section className="space-y-4">
                                    <h2 className="text-2xl font-semibold text-white">4. Subscription and Payments</h2>
                                    <p className="text-gray-300">
                                        Some aspects of the Service may be available on a subscription basis. By subscribing to our Service, you agree to pay 
                                        the applicable fees as they become due. Subscription fees are non-refundable except as expressly stated in these Terms 
                                        or as required by applicable law.
                                    </p>
                                    <p className="text-gray-300">
                                        We may change our subscription fees from time to time. If we change our subscription fees, we will provide notice of the change 
                                        on our website or by email, at least 30 days before the change takes effect. Your continued use of the Service after the fee 
                                        change becomes effective constitutes your agreement to pay the modified fee amount.
                                    </p>
                                    <p className="text-gray-300">
                                        You may cancel your subscription at any time, but no refunds will be provided for any partial subscription periods.
                                    </p>
                                </section>
                                
                                <section className="space-y-4">
                                    <h2 className="text-2xl font-semibold text-white">5. User Conduct and Prohibited Activities</h2>
                                    <p className="text-gray-300">
                                        You agree not to engage in any of the following prohibited activities:
                                    </p>
                                    <ul className="list-disc pl-6 text-gray-300 space-y-2">
                                        <li>Violating any laws, regulations, or third-party rights</li>
                                        <li>Attempting to gain unauthorized access to the Service or other users' accounts</li>
                                        <li>Using the Service for any illegal or unauthorized purpose</li>
                                        <li>Uploading or transmitting viruses, malware, or other malicious code</li>
                                        <li>Interfering with or disrupting the integrity or performance of the Service</li>
                                        <li>Scraping, data mining, or otherwise extracting data from the Service except as expressly permitted</li>
                                        <li>Impersonating another person or entity, or falsely stating or otherwise misrepresenting your affiliation</li>
                                        <li>Sharing your account credentials with third parties or allowing others to access your account</li>
                                        <li>Selling, transferring, or sublicensing your account or any data derived from the Service without our permission</li>
                                    </ul>
                                </section>
                                
                                <section className="space-y-4">
                                    <h2 className="text-2xl font-semibold text-white">6. Intellectual Property</h2>
                                    <p className="text-gray-300">
                                        All content, features, and functionality of the Service, including but not limited to all information, software, 
                                        text, displays, images, video, audio, design, and the selection and arrangement thereof, are owned by Turn One, 
                                        its licensors, or other providers and are protected by copyright, trademark, patent, trade secret, and other 
                                        intellectual property or proprietary rights laws.
                                    </p>
                                    <p className="text-gray-300">
                                        These Terms do not grant you any right, title, or interest in the Service or its content, nor any intellectual property 
                                        rights, other than the limited right to access and use the Service as set forth in these Terms.
                                    </p>
                                    <p className="text-gray-300">
                                        Formula 1, F1, and related marks are trademarks of Formula One Licensing BV. Turn One is not affiliated with, 
                                        endorsed by, or licensed by Formula One Licensing BV or any Formula 1 team. All Formula 1 related information used by 
                                        the Service is provided for analysis, entertainment, and informational purposes only.
                                    </p>
                                </section>
                                
                                <section className="space-y-4">
                                    <h2 className="text-2xl font-semibold text-white">7. User Content</h2>
                                    <p className="text-gray-300">
                                        Our Service may allow you to upload, post, or submit content ("User Content"). You retain ownership rights in your User Content, 
                                        but you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, 
                                        distribute, and display such User Content for the purpose of providing and improving the Service.
                                    </p>
                                    <p className="text-gray-300">
                                        You represent and warrant that you own or have the necessary rights to your User Content, and that such User Content does 
                                        not violate the rights of any third party, including intellectual property rights and rights of privacy or publicity.
                                    </p>
                                    <p className="text-gray-300">
                                        We reserve the right to review, remove, or modify User Content at our sole discretion, for any reason or no reason, 
                                        without notice to you.
                                    </p>
                                </section>
                                
                                <section className="space-y-4">
                                    <h2 className="text-2xl font-semibold text-white">8. Disclaimer of Warranties</h2>
                                    <p className="text-gray-300">
                                        THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, 
                                        INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR COURSE OF PERFORMANCE.
                                    </p>
                                    <p className="text-gray-300">
                                        Turn One does not warrant that: (a) the Service will function uninterrupted, secure, or available at any particular time or location; 
                                        (b) any errors or defects will be corrected; (c) the Service is free of viruses or other harmful components; or 
                                        (d) the results of using the Service will meet your requirements.
                                    </p>
                                </section>
                                
                                <section className="space-y-4">
                                    <h2 className="text-2xl font-semibold text-white">9. Limitation of Liability</h2>
                                    <p className="text-gray-300">
                                        TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL TURN ONE, ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES BE LIABLE FOR ANY 
                                        INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, 
                                        RESULTING FROM: (A) YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE; (B) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICE; 
                                        (C) ANY CONTENT OBTAINED FROM THE SERVICE; AND (D) UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT, WHETHER BASED ON WARRANTY, 
                                        CONTRACT, TORT (INCLUDING NEGLIGENCE), OR ANY OTHER LEGAL THEORY, WHETHER OR NOT WE HAVE BEEN INFORMED OF THE POSSIBILITY OF SUCH DAMAGE.
                                    </p>
                                </section>
                                
                                <section className="space-y-4">
                                    <h2 className="text-2xl font-semibold text-white">10. Indemnification</h2>
                                    <p className="text-gray-300">
                                        You agree to defend, indemnify, and hold harmless Turn One, its officers, directors, employees, and agents, from and against any and all claims, 
                                        damages, obligations, losses, liabilities, costs or debt, and expenses (including but not limited to attorney's fees) arising from: (a) your use 
                                        of and access to the Service; (b) your violation of any term of these Terms; (c) your violation of any third-party right, including without 
                                        limitation any copyright, property, or privacy right; or (d) any claim that your User Content caused damage to a third party.
                                    </p>
                                </section>
                                
                                <section className="space-y-4">
                                    <h2 className="text-2xl font-semibold text-white">11. Termination</h2>
                                    <p className="text-gray-300">
                                        We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, 
                                        for any reason whatsoever, including without limitation if you breach these Terms.
                                    </p>
                                    <p className="text-gray-300">
                                        Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, 
                                        you may simply discontinue using the Service or contact us to request account deletion.
                                    </p>
                                </section>
                                
                                <section className="space-y-4">
                                    <h2 className="text-2xl font-semibold text-white">12. Changes to Terms</h2>
                                    <p className="text-gray-300">
                                        We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 
                                        30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                                    </p>
                                    <p className="text-gray-300">
                                        By continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised terms. 
                                        If you do not agree to the new terms, you are no longer authorized to use the Service.
                                    </p>
                                </section>
                                
                                <section className="space-y-4">
                                    <h2 className="text-2xl font-semibold text-white">13. Governing Law and Dispute Resolution</h2>
                                    <p className="text-gray-300">
                                        These Terms shall be governed by and construed in accordance with the laws of Monaco, without regard to its conflict of law provisions.
                                    </p>
                                    <p className="text-gray-300">
                                        Any dispute arising from or relating to these Terms or the Service shall first be attempted to be resolved through 
                                        informal negotiation. If the dispute cannot be resolved through informal negotiation, it shall be subject to the exclusive 
                                        jurisdiction of the courts of Monaco.
                                    </p>
                                </section>
                                
                                <section className="space-y-4">
                                    <h2 className="text-2xl font-semibold text-white">14. Contact Information</h2>
                                    <p className="text-gray-300">
                                        If you have any questions about these Terms, please contact us at:
                                    </p>
                                    <p className="text-gray-300 font-medium">
                                        Email: <ObfuscatedEmail user="legal" domain="t1f1.com" /><br />
                                        Address: Turn One Headquarters, 1 Racing Lane, Monaco, 98000<br />
                                        Phone: +1 (555) 123-4567
                                    </p>
                                </section>
                                
                                <div className="border-t border-red-800/20 pt-6 text-gray-400 text-sm">
                                    <p>Last Updated: October 13, 2025</p>
                                </div>
                            </CardContent>
                        </Card>
                    </ScrollAnimation>
                </div>
            </main>
        </div>
    );
}