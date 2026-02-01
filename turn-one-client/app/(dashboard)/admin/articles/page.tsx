'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Eye, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getAllArticlesAdmin, deleteArticle, type Article } from '@/lib/articleService'
import { toast } from 'sonner'

export default function ArticlesManagementPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadArticles()
  }, [])

  const loadArticles = async () => {
    setLoading(true)
    const result = await getAllArticlesAdmin()
    if (result.success && result.data) {
      setArticles(result.data)
    } else {
      toast.error(result.error || 'Failed to load articles')
    }
    setLoading(false)
  }

  const handleDelete = async (slug: string) => {
    if (confirm('Are you sure you want to delete this article?')) {
      const result = await deleteArticle(slug)
      if (result.success) {
        toast.success('Article deleted successfully')
        loadArticles()
      } else {
        toast.error(result.error || 'Failed to delete article')
      }
    }
  }

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Article Management</h1>
          <p className="text-muted-foreground">Create and manage F1 blog articles</p>
        </div>
        <Button asChild>
          <Link href="/admin/articles/create">
            <Plus className="mr-2 h-4 w-4" />
            New Article
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Articles</CardDescription>
            <CardTitle className="text-3xl">{articles.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Featured</CardDescription>
            <CardTitle className="text-3xl">
              {articles.filter(a => a.featured).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Categories</CardDescription>
            <CardTitle className="text-3xl">
              {new Set(articles.map(a => a.category)).size}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Articles Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredArticles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      No articles found. Create your first article!
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredArticles.map((article) => (
                    <TableRow key={article.slug}>
                      <TableCell className="font-medium">{article.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{article.category}</Badge>
                      </TableCell>
                      <TableCell>{article.author}</TableCell>
                      <TableCell>
                        {new Date(article.publishDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {article.featured && (
                          <Badge className="bg-red-600">Featured</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                          >
                            <Link href={`/blog/${article.slug}`} target="_blank">
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                          >
                            <Link href={`/admin/articles/edit/${article.slug}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(article.slug)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
