'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RichTextEditor } from '@/components/admin/rich-text-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Eye } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { createArticle, updateArticle, type Article } from '@/lib/articleService'

interface ArticleEditorProps {
  article?: Article
  mode: 'create' | 'edit'
}

export function ArticleEditor({ article, mode }: ArticleEditorProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  
  const [formData, setFormData] = useState<Omit<Article, 'id' | 'createdAt' | 'updatedAt'>>({
    slug: article?.slug || '',
    title: article?.title || '',
    excerpt: article?.excerpt || '',
    content: article?.content || '',
    category: article?.category || 'General',
    author: article?.author || 'Turn One Editorial Team',
    tags: article?.tags || [],
    featured: article?.featured || false,
    publishDate: article?.publishDate || new Date().toISOString().split('T')[0],
  })

  const [tagInput, setTagInput] = useState('')

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title),
    })
  }

  const addTag = () => {
    if (tagInput && !formData.tags.includes(tagInput)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput],
      })
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag),
    })
  }

  const handleSave = async () => {
    // Validation
    if (!formData.title || !formData.content || !formData.excerpt) {
      toast.error('Please fill in all required fields')
      return
    }

    // Debug: Log the HTML to see how images are structured
    console.log('Article HTML:', formData.content)

    setIsSaving(true)

    try {
      let result;
      
      if (mode === 'create') {
        result = await createArticle(formData);
      } else {
        result = await updateArticle(article?.slug || '', formData);
      }

      if (result.success) {
        toast.success(mode === 'create' ? 'Article created successfully!' : 'Article updated successfully!')
        setTimeout(() => {
          router.push('/admin/articles')
          router.refresh()
        }, 1000)
      } else {
        toast.error(result.error || 'Failed to save article')
      }
    } catch (error) {
      toast.error('Failed to save article')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePreview = () => {
    // Save to temp storage for preview
    if (typeof window !== 'undefined') {
      localStorage.setItem('article_preview', JSON.stringify(formData))
      window.open(`/admin/articles/preview?slug=${formData.slug}`, '_blank')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/articles">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {mode === 'create' ? 'Create New Article' : 'Edit Article'}
            </h1>
            <p className="text-muted-foreground">
              {mode === 'create' ? 'Write and publish a new F1 article' : 'Update your article content'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Article'}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <Card>
            <CardHeader>
              <CardTitle>Article Title</CardTitle>
              <CardDescription>Enter a compelling headline for your article</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="e.g., F1 2026 Season Preview: Complete Guide"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="text-lg"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Slug: <span className="font-mono">{formData.slug || 'auto-generated-from-title'}</span>
              </p>
            </CardContent>
          </Card>

          {/* Excerpt */}
          <Card>
            <CardHeader>
              <CardTitle>Excerpt</CardTitle>
              <CardDescription>Brief summary for search engines and previews (150-160 characters)</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter a compelling excerpt that summarizes your article..."
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows={3}
                maxLength={160}
              />
              <p className="text-sm text-muted-foreground mt-2">
                {formData.excerpt.length}/160 characters
              </p>
            </CardContent>
          </Card>

          {/* Content Editor */}
          <Card>
            <CardHeader>
              <CardTitle>Article Content</CardTitle>
              <CardDescription>Write your article using the rich text editor</CardDescription>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                content={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                placeholder="Start writing your article..."
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Publish Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="publishDate">Publish Date</Label>
                <Input
                  id="publishDate"
                  type="date"
                  value={formData.publishDate}
                  onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="Author name"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="featured" className="cursor-pointer">
                  Feature this article
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Category */}
          <Card>
            <CardHeader>
              <CardTitle>Category</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="General">General</option>
                <option value="Season Preview">Season Preview</option>
                <option value="Race Analysis">Race Analysis</option>
                <option value="Technical">Technical Deep Dive</option>
                <option value="Driver Feature">Driver Feature</option>
                <option value="Team News">Team News</option>
                <option value="Guide">Guide</option>
              </select>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>Add relevant tags for better discoverability</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                />
                <Button onClick={addTag} size="sm">Add</Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                    {tag} ×
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SEO Preview */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {formData.title || 'Your Article Title'}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  turnonehub.com/blog/{formData.slug || 'your-article-slug'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formData.excerpt || 'Your article excerpt will appear here in search results...'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
