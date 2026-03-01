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
  title: 'Privacy Policy',
  description: 'Turn One Privacy Policy - Learn how we protect your data and privacy while using our F1 live timing and telemetry platform. Transparent data handling and security practices.',
  url: '/privacy',
  keywords: [
    'F1 privacy policy',
    'data protection',
    'user privacy',
    'GDPR compliance',
  ],
})

export default function PrivacyPage() {
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
                        
                        <h1 className="text-4xl md:text-5xl font-bold mt-6 mb-8 text-white">Privacy Policy</h1>
                        
                        <Card className="border-red-800/20 bg-black/40 backdrop-blur-sm shadow-lg">
                            <CardContent className="pt-6 space-y-8">
                                <section className="space-y-4">
                                    <h2 className="text-2xl font-semibold text-white">1. Introduction</h2>
                                    <p className="text-gray-300">
                                        Turn One ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, 
                                        use, disclose, and safeguard your information when you use our F1 telemetry analysis platform, 
                                        including our website, mobile application, and related services (collectively, the "Service").
                                    </p>
                                    <p className="text-gray-300">
                                        Please read this Privacy Policy carefully. By accessing or using the Service, you acknowledge that you have read, understood, and agree to be bound by all terms of this Privacy Policy.
                                    </p>
                                </section>
                                
                                <section className="space-y-4">
                                    <h2 className="text-2xl font-semibold text-white">2. Information We Collect</h2>
                                    
                                    <h3 className="text-xl font-medium text-white">2.1 Personal Information</h3>
                                    <p className="text-gray-300">
                                        We may collect personal information that you provide directly to us, such as:
                                    </p>
                                    <ul className="list-disc pl-6 text-gray-300 space-y-2">
                                        <li>Account information (name, email address, username, password)</li>
                                        <li>Profile information (profile picture, biography)</li>
                                        <li>Payment information (processed securely through our payment processors)</li>
                                        <li>User preferences and settings</li>
                                        <li>Communications you send to us</li>
                                    </ul>
                                    
                                    <h3 className="text-xl font-medium text-white">2.2 Usage Information</h3>
                                    <p className="text-gray-300">
                                        We automatically collect information about how you interact with our Service, including:
                                    </p>
                                    <ul className="list-disc pl-6 text-gray-300 space-y-2">
                                        <li>Log data (IP address, browser type, pages viewed, time spent)</li>
                                        <li>Device information (hardware model, operating system, unique device identifiers)</li>
                                        <li>Telemetry analysis usage patterns</li>
                                        <li>Feature usage statistics</li>
                                        <li>Error reports and performance data</li>
                                    </ul>
                                </section>
                                
                                <section className="space-y-4">
                                    <h2 className="text-2xl font-semibold text-white">3. How We Use Your Information</h2>
                                    <p className="text-gray-300">
                                        We use the information we collect for various purposes, including:
                                    </p>
                                    <ul className="list-disc pl-6 text-gray-300 space-y-2">
                                        <li>Providing, maintaining, and improving the Service</li>
                                        <li>Processing your transactions and managing your account</li>
                                        <li>Sending you technical notices, updates, and administrative messages</li>
                                        <li>Responding to your comments, questions, and requests</li>
                                        <li>Personalizing your experience and delivering content relevant to your interests</li>
                                        <li>Monitoring and analyzing trends, usage, and activities in connection with our Service</li>
                                        <li>Detecting, investigating, and preventing fraudulent transactions and other illegal activities</li>
                                        <li>Protecting the rights, property, and safety of our users and others</li>
                                    </ul>
                                </section>
                                
                                <section className="space-y-4">
                                    <h2 className="text-2xl font-semibold text-white">4. Sharing Your Information</h2>
                                    <p className="text-gray-300">
                                        We may share your information in the following circumstances:
                                    </p>
                                    <ul className="list-disc pl-6 text-gray-300 space-y-2">
                                        <li>With third-party service providers who perform services on our behalf</li>
                                        <li>With your consent or at your direction</li>
                                        <li>In connection with a merger, sale, or acquisition of all or a portion of our company</li>
                                        <li>If we believe disclosure is necessary to comply with applicable laws or regulations</li>
                                        <li>To protect the rights, property, and safety of Turn One, our users, or others</li>
                                    </ul>
                                    <p className="text-gray-300">
                                        We do not sell your personal information to third parties for marketing purposes.
                                    </p>
                                </section>
                                
                                <section className="space-y-4">
                                    <h2 className="text-2xl font-semibold text-white">5. Data Security</h2>
                                    <p className="text-gray-300">
                                        We implement appropriate security measures to protect your personal information from unauthorized access, 
                                        alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 
                                        100% secure, and we cannot guarantee absolute security.
                                    </p>
                                </section>
                                
                                <section className="space-y-4">
                                    <h2 className="text-2xl font-semibold text-white">6. Your Rights and Choices</h2>
                                    <p className="text-gray-300">
                                        Depending on your location, you may have certain rights regarding your personal information, including:
                                    </p>
                                    <ul className="list-disc pl-6 text-gray-300 space-y-2">
                                        <li>Access to your personal information</li>
                                        <li>Correction of inaccurate or incomplete information</li>
                                        <li>Deletion of your personal information</li>
                                        <li>Restriction or objection to certain processing activities</li>
                                        <li>Data portability</li>
                                        <li>Withdrawal of consent</li>
                                    </ul>
                                    <p className="text-gray-300">
                                        To exercise these rights, please contact us at <ObfuscatedEmail user="privacy" domain="t1f1.com" />.
                                    </p>
                                </section>
                                
                                <section className="space-y-4">
                                    <h2 className="text-2xl font-semibold text-white">7. Cookies and Similar Technologies</h2>
                                    <p className="text-gray-300">
                                        We use cookies and similar tracking technologies to collect information about your browsing activities 
                                        and to distinguish you from other users of our Service. This helps us provide you with a good experience when 
                                        you browse our Service and allows us to improve it.
                                    </p>
                                    <p className="text-gray-300">
                                        You can set your browser to refuse all or some browser cookies, or to alert you when cookies are being sent. 
                                        If you disable or refuse cookies, please note that some parts of the Service may become inaccessible or not function properly.
                                    </p>
                                </section>
                                
                                <section className="space-y-4">
                                    <h2 className="text-2xl font-semibold text-white">8. Children's Privacy</h2>
                                    <p className="text-gray-300">
                                        Our Service is not directed to children under 16 years of age, and we do not knowingly collect personal information 
                                        from children under 16. If we learn we have collected personal information from a child under 16, 
                                        we will delete this information as quickly as possible. If you believe we might have any information from or 
                                        about a child under 16, please contact us.
                                    </p>
                                </section>
                                
                                <section className="space-y-4">
                                    <h2 className="text-2xl font-semibold text-white">9. Changes to This Privacy Policy</h2>
                                    <p className="text-gray-300">
                                        We may update this Privacy Policy from time to time. The updated version will be indicated by an updated 
                                        "Last Updated" date and the updated version will be effective as soon as it is accessible. We encourage you 
                                        to review this Privacy Policy frequently to be informed of how we are protecting your information.
                                    </p>
                                </section>
                                
                                <section className="space-y-4">
                                    <h2 className="text-2xl font-semibold text-white">10. Contact Us</h2>
                                    <p className="text-gray-300">
                                        If you have questions or concerns about this Privacy Policy or our privacy practices, please contact us at:
                                    </p>
                                    <p className="text-gray-300 font-medium">
                                        Email: <ObfuscatedEmail user="privacy" domain="t1f1.com" /><br />
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