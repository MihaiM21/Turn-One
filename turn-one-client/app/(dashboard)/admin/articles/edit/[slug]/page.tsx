'use client'

import { useParams } from 'next/navigation'
import { ArticleEditor } from "@/components/admin/article-editor"
import { useEffect, useState } from 'react'
import { getArticleBySlug, type Article } from '@/lib/articleService'

export default function EditArticlePage() {
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
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
        <p className="mt-4">Loading article...</p>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Article not found</p>
      </div>
    )
  }

  return <ArticleEditor article={article} mode="edit" />
}
