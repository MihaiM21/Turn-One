'use client'

import { useEffect, useState } from 'react'
import { useParams, notFound } from 'next/navigation'
import Image from 'next/image'
import { Calendar, User, Clock, Tag, ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Breadcrumb } from '@/components/seo/breadcrumb'
import { JsonLd } from '@/components/seo/json-ld'
import { generateArticleSchema } from '@/lib/seo'
import { getArticleBySlug, type Article } from '@/lib/articleService'

export default function DynamicArticlePage() {
  const params = useParams()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadArticle = async () => {
      const data = await getArticleBySlug(params.slug as string)
      if (data) {
        setArticle(data)
      }
      setLoading(false)
    }
    loadArticle()
  }, [params.slug])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p>Loading article...</p>
      </div>
    )
  }

  if (!article) {
    notFound()
  }

  const calculateReadTime = (content: string) => {
    const words = content.split(/\s+/).length
    return Math.ceil(words / 200)
  }

  const articleSchema = generateArticleSchema({
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishDate,
    dateModified: article.publishDate,
    authorName: article.author,
    imageUrl: '/turn-one-car/2026-turn-one-car/0001.webp',
    url: `/blog/${article.slug}`,
  })

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={articleSchema} />

      {/* Hero Section */}
      <div className="border-b bg-gradient-to-b from-background to-background/50">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <Button variant="ghost" className="mb-6" asChild>
            <Link href="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </Button>

          <Breadcrumb
            items={[
              { name: 'Home', url: '/' },
              { name: 'Blog', url: '/blog' },
              { name: article.title, url: `/blog/${article.slug}` },
            ]}
          />

          <Badge className="mt-6 mb-4 bg-red-600 text-white">
            {article.category}
          </Badge>

          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            {article.title}
          </h1>

          <p className="text-xl text-muted-foreground mb-8">
            {article.excerpt}
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {article.author}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {new Date(article.publishDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {calculateReadTime(article.content)} min read
            </div>
          </div>
        </div>
      </div>

      {/* Featured Image */}
      <div className="container mx-auto px-4 max-w-4xl -mt-8 mb-12">
        <div className="relative aspect-video rounded-lg overflow-hidden shadow-xl">
          <Image
            src="/turn-one-car/2026-turn-one-car/0001.webp"
            alt={article.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>

      {/* Article Content */}
      <article className="container mx-auto px-4 pb-16 max-w-4xl">
        <div 
          className="prose prose-lg dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Tags:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 p-8 rounded-lg bg-gradient-to-r from-red-600/10 to-background border border-red-600/20">
          <h3 className="text-2xl font-bold mb-4">Ready to Experience Live F1 Action?</h3>
          <p className="text-muted-foreground mb-6">
            Join Turn One for real-time race telemetry, predictions, and interactive gaming.
          </p>
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/live">Watch Live Race</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Explore Dashboard</Link>
            </Button>
          </div>
        </div>
      </article>
    </div>
  )
}
