'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Plus, Edit, Trash2, Eye, Search, ArrowLeft, Loader2,
  FileText, Star, FolderOpen, Calendar, ExternalLink
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAllArticlesAdmin, deleteArticle, type Article } from '@/lib/articleService';
import { useToast } from '@/hooks/use-toast';

const categoryColors: Record<string, string> = {
  'news': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'analysis': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'race-review': 'bg-green-500/10 text-green-400 border-green-500/20',
  'interview': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'technical': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'opinion': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  'history': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

function getCategoryStyle(category: string) {
  const key = category.toLowerCase().replace(/\s+/g, '-');
  return categoryColors[key] || 'bg-muted/30 text-muted-foreground border-border/50';
}

export default function ArticlesManagementPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setLoading(true);
    const result = await getAllArticlesAdmin();
    if (result.success && result.data) {
      setArticles(result.data);
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to load articles',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  const handleDelete = async (article: Article) => {
    const result = await deleteArticle(article.slug);
    if (result.success) {
      toast({ title: 'Success', description: 'Article deleted successfully' });
      setDeleteTarget(null);
      loadArticles();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to delete article',
        variant: 'destructive',
      });
    }
  };

  const categories = useMemo(() => {
    return [...new Set(articles.map(a => a.category))].sort();
  }, [articles]);

  const stats = useMemo(() => {
    const featured = articles.filter(a => a.featured).length;
    return { featured, categoriesCount: categories.length };
  }, [articles, categories]);

  const filteredArticles = useMemo(() => {
    let result = articles;

    if (activeTab === 'featured') {
      result = result.filter(a => a.featured);
    } else if (activeTab !== 'all') {
      result = result.filter(a => a.category === activeTab);
    }

    if (searchQuery) {
      result = result.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.author.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return result;
  }, [articles, searchQuery, activeTab]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground">Loading articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950/20 to-black">
      <div className="container mx-auto p-6 max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="gap-2 hover:bg-primary/10">
                <ArrowLeft className="w-4 h-4" />
                Back to Admin
              </Button>
            </Link>
          </div>
          <div className="modern-gradient rounded-2xl p-8 shadow-xl border border-red-500/20 hover:border-red-500/40 transition-all duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-red-500/10 rounded-2xl flex items-center justify-center">
                  <FileText className="h-7 w-7 text-red-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                    Article Management
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Create, edit, and manage F1 blog content
                  </p>
                </div>
              </div>
              <Button asChild className="gap-2 bg-red-600 hover:bg-red-700">
                <Link href="/admin/articles/create">
                  <Plus className="h-4 w-4" />
                  New Article
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-red-500/20 hover:border-red-500/40 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-card to-red-500/5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Articles</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                    {articles.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">published posts</p>
                </div>
                <div className="h-12 w-12 bg-red-500/10 rounded-full flex items-center justify-center">
                  <FileText className="h-6 w-6 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-card to-yellow-500/5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Featured</p>
                  <p className="text-3xl font-bold text-yellow-400">{stats.featured}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {articles.length > 0 ? Math.round((stats.featured / articles.length) * 100) : 0}% of total
                  </p>
                </div>
                <div className="h-12 w-12 bg-yellow-500/10 rounded-full flex items-center justify-center">
                  <Star className="h-6 w-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-card to-blue-500/5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Categories</p>
                  <p className="text-3xl font-bold text-blue-400">{stats.categoriesCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">content types</p>
                </div>
                <div className="h-12 w-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <FolderOpen className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter */}
        <Card className="mb-6 border-border/50">
          <CardContent className="p-5 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, category, or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="flex-wrap h-auto gap-1 bg-transparent p-0">
                <TabsTrigger value="all" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">
                  All ({articles.length})
                </TabsTrigger>
                <TabsTrigger value="featured" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
                  <Star className="h-3 w-3 mr-1" />
                  Featured ({stats.featured})
                </TabsTrigger>
                {categories.map(cat => (
                  <TabsTrigger key={cat} value={cat} className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary capitalize">
                    {cat} ({articles.filter(a => a.category === cat).length})
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            {searchQuery && (
              <p className="text-sm text-muted-foreground">
                Showing {filteredArticles.length} of {articles.length} articles
              </p>
            )}
          </CardContent>
        </Card>

        {/* Articles Table */}
        <Card className="border-border/50 overflow-hidden">
          <CardContent className="p-0">
            {filteredArticles.length === 0 ? (
              <div className="py-16 text-center">
                <div className="h-16 w-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No articles found</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                  {searchQuery || activeTab !== 'all'
                    ? 'No articles match your current filters.'
                    : 'Create your first article to get started.'}
                </p>
                {!searchQuery && activeTab === 'all' && (
                  <Button asChild className="gap-2">
                    <Link href="/admin/articles/create">
                      <Plus className="h-4 w-4" />
                      Create First Article
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="font-semibold">Title</TableHead>
                    <TableHead className="font-semibold">Category</TableHead>
                    <TableHead className="font-semibold">Author</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredArticles.map((article, idx) => (
                    <TableRow key={article.slug} className="border-border/30 hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground font-mono w-5 shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-medium line-clamp-1">{article.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              /blog/{article.slug}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getCategoryStyle(article.category)}>
                          {article.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{article.author}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(article.publishDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {article.featured ? (
                          <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20">
                            <Star className="h-3 w-3 mr-1 fill-yellow-400" />
                            Featured
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground border-border/50">
                            Standard
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                            className="h-8 w-8 p-0 hover:text-blue-400"
                          >
                            <Link href={`/blog/${article.slug}`} target="_blank">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                            className="h-8 w-8 p-0 hover:text-cyan-400"
                          >
                            <Link href={`/admin/articles/edit/${article.slug}`}>
                              <Edit className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteTarget(article)}
                            className="h-8 w-8 p-0 hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                Delete Article?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this article and cannot be undone.
                <div className="mt-3 p-3 bg-muted/30 rounded-lg border text-sm">
                  <p className="font-medium text-foreground">{deleteTarget?.title}</p>
                  <p className="text-muted-foreground mt-1">
                    by {deleteTarget?.author} &bull; {deleteTarget?.category}
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteTarget && handleDelete(deleteTarget)}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete Article
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
