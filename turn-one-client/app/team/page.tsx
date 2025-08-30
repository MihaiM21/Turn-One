import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Linkedin, Twitter, Mail } from "lucide-react"

export default function TeamPage() {
  const leadership = [
    {
      name: "Marcus Rodriguez",
      role: "CEO & Founder",
      image: "/professional-male-ceo-motorsport-executive.png",
      bio: "Former McLaren F1 data analyst with 15+ years in motorsport. Led telemetry analysis for 3 championship-winning seasons. Founded Turn One to democratize professional F1 analysis tools.",
      expertise: ["F1 Strategy", "Data Analytics", "Team Leadership"],
      social: {
        linkedin: "#",
        twitter: "#",
        email: "marcus@t1f1.com",
      },
    },
    {
      name: "Sarah Chen",
      role: "CTO & Co-Founder",
      image: "/professional-female-cto-technology-executive.png",
      bio: "Ex-Mercedes AMG Petronas software engineer specializing in real-time telemetry systems. PhD in Computer Science from MIT. Built the core architecture powering Turn One's analysis platform.",
      expertise: ["Software Architecture", "Real-time Systems", "Machine Learning"],
      social: {
        linkedin: "#",
        twitter: "#",
        email: "sarah@t1f1.com",
      },
    },
  ]

  const team = [
    {
      name: "James Thompson",
      role: "Head of Data Science",
      image: "/professional-male-data-scientist-motorsport.png",
      bio: "Former Red Bull Racing performance analyst. Specializes in predictive modeling and AI-driven race strategy optimization.",
      expertise: ["Machine Learning", "Predictive Analytics", "Race Strategy"],
    },
    {
      name: "Elena Rossi",
      role: "Senior Telemetry Engineer",
      image: "/professional-female-engineer-motorsport-telemetry.png",
      bio: "15 years at Ferrari F1 team developing telemetry acquisition systems. Expert in sensor data processing and real-time analysis.",
      expertise: ["Telemetry Systems", "Sensor Technology", "Data Processing"],
    },
    {
      name: "David Park",
      role: "Lead Frontend Developer",
      image: "/professional-male-software-developer.png",
      bio: "UI/UX specialist with experience building mission-critical dashboards for Formula E and IndyCar teams.",
      expertise: ["React/Next.js", "Data Visualization", "User Experience"],
    },
    {
      name: "Lisa Wagner",
      role: "Head of Customer Success",
      image: "/professional-female-customer-success-manager.png",
      bio: "Former F1 broadcast analyst for Sky Sports. Deep understanding of how teams and media use telemetry data for insights.",
      expertise: ["Customer Relations", "F1 Broadcasting", "Product Training"],
    },
    {
      name: "Ahmed Hassan",
      role: "Senior Backend Engineer",
      image: "/professional-male-backend-engineer.png",
      bio: "Distributed systems expert who built scalable data pipelines for Haas F1 Team. Ensures our platform handles millions of data points seamlessly.",
      expertise: ["Distributed Systems", "Database Architecture", "API Development"],
    },
    {
      name: "Sophie Martin",
      role: "Data Analyst",
      image: "/professional-female-data-analyst-motorsport.png",
      bio: "Former Williams F1 race engineer turned data analyst. Bridges the gap between raw telemetry and actionable racing insights.",
      expertise: ["Race Engineering", "Statistical Analysis", "Performance Optimization"],
    },
  ]

  const values = [
    {
      title: "Precision",
      description:
        "Every millisecond matters in F1. We apply the same precision to our data analysis and platform development.",
    },
    {
      title: "Innovation",
      description:
        "Constantly pushing the boundaries of what's possible in motorsport analytics, just like the teams we serve.",
    },
    {
      title: "Accessibility",
      description:
        "Making professional-grade F1 analysis tools available to everyone, from fans to championship teams.",
    },
    {
      title: "Integrity",
      description: "Maintaining the highest standards of data accuracy and ethical practices in everything we do.",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Meet the <span className="gradient-text">Champions</span>
            <br />
            Behind Turn One
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Our team combines decades of Formula One experience with cutting-edge technology expertise. From the paddock
            to the platform, we understand what it takes to win.
          </p>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 gradient-text">Leadership Team</h2>

          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            {leadership.map((leader, index) => (
              <Card key={index} className="card-hover">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-6">
                    <img
                      src={leader.image || "/placeholder.svg"}
                      alt={leader.name}
                      className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-primary/20"
                    />
                  </div>
                  <CardTitle className="text-2xl">{leader.name}</CardTitle>
                  <CardDescription className="text-primary font-semibold text-lg">{leader.role}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground mb-6">{leader.bio}</p>

                  <div className="flex flex-wrap gap-2 justify-center mb-6">
                    {leader.expertise.map((skill, skillIndex) => (
                      <Badge key={skillIndex} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex justify-center gap-4">
                    <Button size="sm" variant="outline" className="p-2 bg-transparent">
                      <Linkedin className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="p-2 bg-transparent">
                      <Twitter className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="p-2 bg-transparent">
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Core Team */}
      <section className="py-16 px-4 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 gradient-text">Core Team</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="card-hover">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4">
                    <img
                      src={member.image || "/placeholder.svg"}
                      alt={member.name}
                      className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-primary/20"
                    />
                  </div>
                  <CardTitle className="text-xl">{member.name}</CardTitle>
                  <CardDescription className="text-primary font-semibold">{member.role}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground text-sm mb-4">{member.bio}</p>

                  <div className="flex flex-wrap gap-1 justify-center">
                    {member.expertise.map((skill, skillIndex) => (
                      <Badge key={skillIndex} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Company Values */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 gradient-text">Our Values</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-primary"></div>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-primary">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 gradient-text">Our Experience</h2>

          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold gradient-text mb-2">50+</div>
              <div className="text-muted-foreground">Years Combined F1 Experience</div>
            </div>
            <div>
              <div className="text-4xl font-bold gradient-text mb-2">8</div>
              <div className="text-muted-foreground">F1 Teams Worked With</div>
            </div>
            <div>
              <div className="text-4xl font-bold gradient-text mb-2">15</div>
              <div className="text-muted-foreground">Championship Seasons</div>
            </div>
            <div>
              <div className="text-4xl font-bold gradient-text mb-2">100%</div>
              <div className="text-muted-foreground">Motorsport Passion</div>
            </div>
          </div>
        </div>
      </section>

      {/* Join Team CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Join the <span className="gradient-text">Winning</span> Team
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            We're always looking for talented individuals who share our passion for Formula One and cutting-edge
            technology. Help us build the future of motorsport analytics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="glow-effect">
              View Open Positions
            </Button>
            <Button size="lg" variant="outline">
              Contact Us
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
