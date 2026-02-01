/**
 * SEO-Friendly Article/News Component
 * Includes structured data and proper semantic HTML
 */

import { JsonLd } from '@/components/seo/json-ld'
import { generateArticleSchema } from '@/lib/seo'
import Image from 'next/image'
import { Calendar, User, Clock } from 'lucide-react'

interface ArticleProps {
  headline: string
  description: string
  content: string
  author: {
    name: string
    avatar?: string
  }
  datePublished: string
  dateModified?: string
  imageUrl: string
  imageAlt: string
  url: string
  readingTime?: number
  category?: string
  tags?: string[]
}

export function SEOArticle({
  headline,
  description,
  content,
  author,
  datePublished,
  dateModified,
  imageUrl,
  imageAlt,
  url,
  readingTime,
  category,
  tags,
}: ArticleProps) {
  // Generate article structured data
  const articleSchema = generateArticleSchema({
    headline,
    description,
    datePublished,
    dateModified: dateModified || datePublished,
    authorName: author.name,
    imageUrl,
    url,
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <>
      {/* JSON-LD Structured Data */}
      <JsonLd data={articleSchema} />

      {/* Article Content */}
      <article className="max-w-4xl mx-auto">
        {/* Category Badge */}
        {category && (
          <div className="mb-4">
            <span className="inline-block px-3 py-1 text-xs font-semibold text-white bg-red-600 rounded-full">
              {category}
            </span>
          </div>
        )}

        {/* Article Header */}
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{headline}</h1>
          <p className="text-xl text-muted-foreground mb-6">{description}</p>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {/* Author */}
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{author.name}</span>
            </div>

            {/* Date */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <time dateTime={datePublished}>{formatDate(datePublished)}</time>
            </div>

            {/* Reading Time */}
            {readingTime && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{readingTime} min read</span>
              </div>
            )}
          </div>
        </header>

        {/* Featured Image */}
        <div className="relative aspect-video mb-8 rounded-lg overflow-hidden">
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          />
        </div>

        {/* Article Content */}
        <div
          className="prose prose-lg dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />

        {/* Tags */}
        {tags && tags.length > 0 && (
          <footer className="mt-8 pt-8 border-t">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-sm bg-secondary rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </footer>
        )}
      </article>
    </>
  )
}
