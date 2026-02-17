import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MainNav } from "@/components/navigation/main-nav"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ScrollAnimation } from "@/components/animation/scroll-animation"
import { Metadata } from 'next'
import { generateSEO } from '@/lib/seo'

export const metadata: Metadata = generateSEO({
  title: 'Cookie Policy',
  description: 'Turn One Cookie Policy - Learn about how we use cookies and tracking technologies on our F1 platform to enhance your experience.',
  url: '/cookies',
  keywords: [
    'cookie policy',
    'tracking technologies',
    'web cookies',
  ],
})

export default function CookiesPage() {
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
                        
                        <h1 className="text-4xl md:text-5xl font-bold mt-6 mb-8 text-white">Cookie Policy</h1>
                        
                        <Card className="border-red-800/20 bg-black/40 backdrop-blur-sm shadow-lg">
                            <CardContent className="pt-6 space-y-8">
                                <section className="space-y-4">
                                    <h2 className="text-2xl font-semibold text-white">1. Introduction</h2>
                                    <p className="text-gray-300">
                                        This Cookie Policy explains how Turn One ("we", "our", or "us") uses cookies and similar technologies 
                                        when you visit our website or use our F1 telemetry analysis platform and related services (collectively, the "Service").
                                    </p>
                                    <p className="text-gray-300">
                                        We use cookies to enhance your browsing experience, analyze site traffic, personalize content, 
                                        and serve targeted advertisements. By using our Service, you consent to our use of cookies in accordance with this Cookie Policy.
                                    </p>
                                </section>
                                
                                <section className="space-y-4">
                                    <h2 className="text-2xl font-semibold text-white">2. What Are Cookies?</h2>
                                    <p className="text-gray-300">
                                        Cookies are small text files that are placed on your computer or mobile device when you visit a website. 
                                        They are widely used to make websites work more efficiently and provide information to website owners.
                                    </p>
                                    <p className="text-gray-300">
                                        Cookies can be "persistent" or "session" cookies. Persistent cookies remain on your device after you close 
                                        your browser until they expire or you delete them. Session cookies are deleted as soon as you close your browser.
                                    </p>
                                </section>
                                
                                <section className="space-y-4">
                                    <h2 className="text-2xl font-semibold text-white">3. Types of Cookies We Use</h2>
                                    
                                    <h3 className="text-xl font-medium text-white">3.1 Essential Cookies</h3>
                                    <p className="text-gray-300">
                                        These cookies are necessary for the Service to function properly. They enable core functionality such as 
                                        security, network management, and account authentication. You can set your browser to block these cookies, 
                                        but some parts of the Service may not work properly.
                                    </p>
                                    
                                    <h3 className="text-xl font-medium text-white">3.2 Preference Cookies</h3>
                                    <p className="text-gray-300">
                                        These cookies enable the Service to remember information that changes the way the Service behaves or looks, 
                                        such as your preferred language or the region you are in. They help us recognize you when you return to our Service.
                                    </p>
                                    
                                    <h3 className="text-xl font-medium text-white">3.3 Analytics and Performance Cookies</h3>
                                    <p className="text-gray-300">
                                        These cookies help us understand how visitors interact with our Service by collecting and reporting information anonymously. 
                                        They help us measure and improve the performance of our Service. We use analytics cookies to track:
                                    </p>
                                    <ul className="list-disc pl-6 text-gray-300 space-y-2">
                                        <li>Number of visitors and traffic sources</li>
                                        <li>Pages visited and time spent on each page</li>
                                        <li>Performance metrics and error tracking</li>
                                        <li>User behavior and navigation patterns</li>
                                    </ul>
                                    
                                    <h3 className="text-xl font-medium text-white">3.4 Functionality Cookies</h3>
                                    <p className="text-gray-300">
                                        These cookies allow our Service to remember choices you make and provide enhanced, personalized features. 
                                        They may be set by us or by third-party providers whose services we have added to our pages.
                                    </p>
                                    
                                    <h3 className="text-xl font-medium text-white">3.5 Marketing and Advertising Cookies</h3>
                                    <p className="text-gray-300">
                                        These cookies are used to track visitors across websites to display relevant advertisements. 
                                        They are set by us and our advertising partners to help deliver ads that may be of interest to you based on your browsing profile.
                                    </p>
                                </section>
                                
                                <section className="space-y-4">
                                    <h2 className="text-2xl font-semibold text-white">4. Third-Party Cookies</h2>
                                    <p className="text-gray-300">
                                        We may use third-party services that set cookies on our behalf. These include:
                                    </p>
                                    <ul className="list-disc pl-6 text-gray-300 space-y-2">
                                        <li>Google Analytics for website traffic analysis</li>
                                        <li>Authentication providers for secure login</li>
                                        <li>Payment processors for handling transactions</li>
                                        <li>Social media platforms for content sharing features</li>
                                    </ul>
                                    <p className="text-gray-300">
                                        These third parties have their own privacy policies and cookie practices, which we encourage you to review.
                                    </p>
                                </section>
                                
                                <section className="space-y-4">
                                    <h2 className="text-2xl font-semibold text-white">5. Cookie Management</h2>
                                    <p className="text-gray-300">
                                        Most web browsers allow you to manage your cookie preferences. You can set your browser to refuse cookies, 
                                        or to alert you when cookies are being sent. The methods for doing so vary from browser to browser, 
                                        and from version to version.
                                    </p>
                                    <p className="text-gray-300">
                                        You can generally find information about how to manage cookies in these locations:
                                    </p>
                                    <ul className="list-disc pl-6 text-gray-300 space-y-2">
                                        <li>Chrome: Settings → Privacy and Security → Cookies and other site data</li>
                                        <li>Firefox: Options → Privacy & Security → Cookies and Site Data</li>
                                        <li>Safari: Preferences → Privacy → Cookies and website data</li>
                                        <li>Edge: Settings → Site permissions → Cookies and site data</li>
                                    </ul>
                                    <p className="text-gray-300">
                                        Please note that if you choose to block certain cookies, you may not be able to use all the features of our Service.
                                    </p>
                                </section>
                                
                                <section className="space-y-4">
                                    <h2 className="text-2xl font-semibold text-white">6. Similar Technologies</h2>
                                    <p className="text-gray-300">
                                        In addition to cookies, we may use other technologies to track and collect information about your use of our Service:
                                    </p>
                                    <ul className="list-disc pl-6 text-gray-300 space-y-2">
                                        <li><span className="font-medium">Web Beacons:</span> Small graphic images that allow us to monitor the use of our Service.</li>
                                        <li><span className="font-medium">Local Storage:</span> Storage maintained on your device that allows websites to store larger amounts of data.</li>
                                        <li><span className="font-medium">Pixels:</span> Tiny graphics with a unique identifier that track user behavior online.</li>
                                    </ul>
                                </section>
                                
                                <section className="space-y-4">
                                    <h2 className="text-2xl font-semibold text-white">7. Updates to This Cookie Policy</h2>
                                    <p className="text-gray-300">
                                        We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, 
                                        legal, or regulatory reasons. The updated version will be indicated by an updated "Last Updated" date at the bottom of this page.
                                    </p>
                                    <p className="text-gray-300">
                                        We encourage you to review this Cookie Policy periodically to stay informed about how we use cookies and related technologies.
                                    </p>
                                </section>
                                
                                <section className="space-y-4">
                                    <h2 className="text-2xl font-semibold text-white">8. Contact Us</h2>
                                    <p className="text-gray-300">
                                        If you have questions or concerns about our use of cookies or this Cookie Policy, please contact us at:
                                    </p>
                                    <p className="text-gray-300 font-medium">
                                        Email: privacy@t1f1.com<br />
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