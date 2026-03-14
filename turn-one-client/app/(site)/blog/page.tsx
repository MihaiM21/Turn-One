'use client'

import Link from "next/link"
import Image from "next/image"
import { Calendar, Clock, ArrowRight, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import { BackendServiceError, getArticles, type Article } from '@/lib/articleService'

export default function BlogPage() {
  const router = useRouter()
  const [blogPosts, setBlogPosts] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadArticles()
  }, [])

  const loadArticles = async () => {
    try {
      const articles = await getArticles({ throwOnServerError: true })
      setBlogPosts(articles)
    } catch (error) {
      if (error instanceof BackendServiceError) {
        router.replace('/server-error')
        return
      }
    } finally {
      setLoading(false)
    }
  }

  const featuredPost = blogPosts.find(post => post.featured) || blogPosts[0]
  const regularPosts = blogPosts.filter(post => post.slug !== featuredPost?.slug)

  const calculateReadTime = (content?: string) => {
    if (!content) return 5
    const words = content.split(/\s+/).length
    return Math.ceil(words / 200) // Average reading speed
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-background to-background/50">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-red-600 text-white">F1 BLOG</Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Latest Formula 1 News & Insights
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              In-depth analysis, race previews, technical breakdowns, and everything Formula 1. 
              Stay ahead of the competition with expert insights.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Featured Post */}
        {featuredPost && (
          <section className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-5 w-5 text-red-600" />
              <h2 className="text-2xl font-bold">Featured Article</h2>
            </div>
            
            <Link href={`/blog/${featuredPost.slug}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow border-2 hover:border-red-600 group">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="relative aspect-video md:aspect-auto">
                    <Image
                      src="/turn-one-car/2026-turn-one-car/0001.webp"
                      alt={featuredPost.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <Badge className="absolute top-4 left-4 bg-red-600 text-white">
                      {featuredPost.category}
                    </Badge>
                  </div>
                  
                  <CardHeader className="flex flex-col justify-center p-8">
                    <CardTitle className="text-3xl mb-4 group-hover:text-red-600 transition-colors">
                      {featuredPost.title}
                    </CardTitle>
                    <CardDescription className="text-base mb-6">
                      {featuredPost.excerpt}
                    </CardDescription>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(featuredPost.publishDate).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{calculateReadTime(featuredPost.content)} min read</span>
                      </div>
                    </div>
                    
                    <Button className="w-fit bg-red-600 hover:bg-red-700">
                      Read Article <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardHeader>
                </div>
              </Card>
            </Link>
          </section>
        )}

        {/* Regular Posts Grid */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Latest Articles</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularPosts.length > 0 ? (
              regularPosts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow hover:border-red-600 group">
                    <div className="relative aspect-video overflow-hidden rounded-t-lg">
                      <Image
                        src="/turn-one-car/2026-turn-one-car/0001.webp"
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <Badge className="absolute top-4 left-4 bg-red-600 text-white">
                        {post.category}
                      </Badge>
                    </div>
                    
                    <CardHeader>
                      <CardTitle className="line-clamp-2 group-hover:text-red-600 transition-colors">
                        {post.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-3">
                        {post.excerpt}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(post.publishDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{calculateReadTime(post.content)} min</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground mb-4">More articles coming soon!</p>
                <p className="text-sm text-muted-foreground">
                  Check back regularly for the latest F1 news, analysis, and insights.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Categories Section */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Browse by Category</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Season Previews", count: 1 },
              { name: "Race Analysis", count: 0 },
              { name: "Technical Deep Dives", count: 0 },
              { name: "Driver Features", count: 0 },
            ].map((category) => (
              <Card key={category.name} className="hover:border-red-600 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                  <CardDescription>{category.count} articles</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="mt-16">
          <Card className="bg-gradient-to-r from-red-600/10 to-red-600/5 border-red-600/20">
            <CardHeader className="text-center py-12">
              <CardTitle className="text-3xl mb-4">Stay Updated with F1 News</CardTitle>
              <CardDescription className="text-base max-w-2xl mx-auto mb-6">
                Get the latest Formula 1 articles, analysis, and insights delivered straight to your dashboard. 
                Join Turn One to never miss a story.
              </CardDescription>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild size="lg" className="bg-red-600 hover:bg-red-700">
                  <Link href="/dashboard">
                    Join Turn One <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/about">Learn More</Link>
                </Button>
              </div>
            </CardHeader>
          </Card>
        </section>
      </div>
    </div>
  )
}
