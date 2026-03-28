'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useToast } from '@/hooks/use-toast';
import {
  Brain, Plus, Edit, Trash2, ArrowLeft, Save, X,
  Search, HelpCircle, CheckCircle2, BarChart3,
  Coins, Star, Filter, Loader2, BookOpen, Zap
} from 'lucide-react';
import Link from 'next/link';
import { getAuthToken } from '@/lib/auth-utils';

interface Trivia {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  category: string;
  difficulty: string;
  coinsReward: number;
  experienceReward: number;
}

const categories = ['History', 'Rules', 'Drivers', 'Teams', 'Tracks', 'Technology', 'Records'];
const difficulties = ['Easy', 'Medium', 'Hard'];

const categoryIcons: Record<string, string> = {
  History: '📜', Rules: '📋', Drivers: '🏎️', Teams: '🏁',
  Tracks: '🛤️', Technology: '⚙️', Records: '🏆',
};

export default function AdminTriviaPage() {
  const [trivias, setTrivias] = useState<Trivia[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Trivia | null>(null);
  const [editingTrivia, setEditingTrivia] = useState<Trivia | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<Trivia>>({
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    category: 'History',
    difficulty: 'Medium',
    coinsReward: 50,
    experienceReward: 25,
  });

  useEffect(() => {
    loadTrivias();
  }, []);

  const loadTrivias = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/Trivia/all`, {
        headers: { 'Authorization': token },
      });

      if (response.ok) {
        const data = await response.json();
        setTrivias(data.data);
      }
    } catch (error) {
      console.error('Failed to load trivias:', error);
      toast({
        title: 'Error',
        description: 'Failed to load trivia questions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Derived data
  const stats = useMemo(() => {
    const easy = trivias.filter(t => t.difficulty === 'Easy').length;
    const medium = trivias.filter(t => t.difficulty === 'Medium').length;
    const hard = trivias.filter(t => t.difficulty === 'Hard').length;
    const totalCoins = trivias.reduce((sum, t) => sum + t.coinsReward, 0);
    const totalXP = trivias.reduce((sum, t) => sum + t.experienceReward, 0);
    const uniqueCategories = new Set(trivias.map(t => t.category)).size;
    return { easy, medium, hard, totalCoins, totalXP, uniqueCategories };
  }, [trivias]);

  const filteredTrivias = useMemo(() => {
    return trivias.filter(t => {
      const matchesSearch = !searchTerm ||
        t.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'ALL' || t.category === categoryFilter;
      const matchesDifficulty = difficultyFilter === 'ALL' || t.difficulty === difficultyFilter;
      const matchesTab = activeTab === 'all' ||
        (activeTab === 'easy' && t.difficulty === 'Easy') ||
        (activeTab === 'medium' && t.difficulty === 'Medium') ||
        (activeTab === 'hard' && t.difficulty === 'Hard');
      return matchesSearch && matchesCategory && matchesDifficulty && matchesTab;
    });
  }, [trivias, searchTerm, categoryFilter, difficultyFilter, activeTab]);

  const handleCreate = () => {
    setEditingTrivia(null);
    setFormData({
      question: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      category: 'History',
      difficulty: 'Medium',
      coinsReward: 50,
      experienceReward: 25,
    });
    setDialogOpen(true);
  };

  const handleEdit = (trivia: Trivia) => {
    setEditingTrivia(trivia);
    setFormData(trivia);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.question || !formData.optionA || !formData.optionB || !formData.optionC || !formData.optionD) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const url = editingTrivia
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/Trivia/${editingTrivia.id}`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/Trivia`;

      const method = editingTrivia ? 'PUT' : 'POST';
      const payload = editingTrivia ? { ...formData, id: editingTrivia.id } : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to save trivia';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: editingTrivia
            ? data.message || 'Trivia question updated. All user attempts cleared.'
            : 'Trivia question created successfully',
        });
        setDialogOpen(false);
        await loadTrivias();
      } else {
        throw new Error(data.message || 'Failed to save trivia');
      }
    } catch (error: any) {
      toast({
        title: 'Failed',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (trivia: Trivia) => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/Trivia/${trivia.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Deleted',
          description: 'Trivia question deleted successfully',
        });
        setDeleteTarget(null);
        await loadTrivias();
      } else {
        throw new Error(data.message || 'Failed to delete');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete trivia',
        variant: 'destructive',
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'hard': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getDifficultyPercent = () => {
    const total = trivias.length || 1;
    return {
      easy: (stats.easy / total) * 100,
      medium: (stats.medium / total) * 100,
      hard: (stats.hard / total) * 100,
    };
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground">Loading trivia questions...</p>
        </div>
      </div>
    );
  }

  const pct = getDifficultyPercent();

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/20 to-black">
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
          <div className="modern-gradient rounded-2xl p-8 shadow-xl border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-purple-500/10 rounded-2xl flex items-center justify-center">
                  <Brain className="h-7 w-7 text-purple-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Trivia Management
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Create, edit, and manage F1 trivia questions
                  </p>
                </div>
              </div>
              <Button onClick={handleCreate} className="gap-2 bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4" />
                New Question
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-card to-purple-500/5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Questions</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {trivias.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.uniqueCategories} categories
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-500/10 rounded-full flex items-center justify-center">
                  <HelpCircle className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-500/20 hover:border-green-500/40 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-card to-green-500/5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Easy</p>
                  <p className="text-3xl font-bold text-green-400">{stats.easy}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {pct.easy.toFixed(0)}% of total
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-500/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-card to-yellow-500/5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Medium</p>
                  <p className="text-3xl font-bold text-yellow-400">{stats.medium}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {pct.medium.toFixed(0)}% of total
                  </p>
                </div>
                <div className="h-12 w-12 bg-yellow-500/10 rounded-full flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-500/20 hover:border-red-500/40 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-card to-red-500/5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Hard</p>
                  <p className="text-3xl font-bold text-red-400">{stats.hard}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {pct.hard.toFixed(0)}% of total
                  </p>
                </div>
                <div className="h-12 w-12 bg-red-500/10 rounded-full flex items-center justify-center">
                  <Zap className="h-6 w-6 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Difficulty Distribution Bar */}
        <Card className="mb-8 border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-muted-foreground">Difficulty Distribution</p>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Easy</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Medium</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Hard</span>
              </div>
            </div>
            <div className="h-4 bg-muted/30 rounded-full overflow-hidden flex">
              {pct.easy > 0 && (
                <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${pct.easy}%` }} />
              )}
              {pct.medium > 0 && (
                <div className="bg-yellow-500 h-full transition-all duration-500" style={{ width: `${pct.medium}%` }} />
              )}
              {pct.hard > 0 && (
                <div className="bg-red-500 h-full transition-all duration-500" style={{ width: `${pct.hard}%` }} />
              )}
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <span>Total rewards: {stats.totalCoins} coins &bull; {stats.totalXP} XP</span>
              <span>{trivias.length} questions</span>
            </div>
          </CardContent>
        </Card>

        {/* Filters & Search */}
        <Card className="mb-6 border-border/50">
          <CardContent className="p-5">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions or categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full lg:w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{categoryIcons[cat]} {cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="w-full lg:w-[160px]">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Difficulties</SelectItem>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all" className="gap-2">
                    <BookOpen className="h-4 w-4" />
                    All ({trivias.length})
                  </TabsTrigger>
                  <TabsTrigger value="easy" className="gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Easy ({stats.easy})
                  </TabsTrigger>
                  <TabsTrigger value="medium" className="gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Medium ({stats.medium})
                  </TabsTrigger>
                  <TabsTrigger value="hard" className="gap-2">
                    <Zap className="h-4 w-4" />
                    Hard ({stats.hard})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {(searchTerm || categoryFilter !== 'ALL' || difficultyFilter !== 'ALL') && (
              <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                <Filter className="h-3 w-3" />
                Showing {filteredTrivias.length} of {trivias.length} questions
                {searchTerm && <Badge variant="secondary" className="text-xs">Search: {searchTerm}</Badge>}
                {categoryFilter !== 'ALL' && <Badge variant="secondary" className="text-xs">Category: {categoryFilter}</Badge>}
                {difficultyFilter !== 'ALL' && <Badge variant="secondary" className="text-xs">Difficulty: {difficultyFilter}</Badge>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Questions List */}
        <div className="space-y-4">
          {filteredTrivias.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-16 text-center">
                <div className="h-16 w-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No questions found</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                  {searchTerm || categoryFilter !== 'ALL' || difficultyFilter !== 'ALL'
                    ? 'Try adjusting your search or filter settings.'
                    : 'Create your first trivia question to get started.'}
                </p>
                {trivias.length === 0 && (
                  <Button onClick={handleCreate} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create First Question
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredTrivias.map((trivia, index) => (
              <Card key={trivia.id} className="border-border/50 hover:border-purple-500/30 hover:shadow-lg transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-sm font-bold text-purple-400 mt-0.5">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-lg leading-snug">{trivia.question}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                            {['A', 'B', 'C', 'D'].map((opt) => {
                              const optKey = `option${opt}` as keyof Trivia;
                              const isCorrect = trivia.correctAnswer === opt;
                              return (
                                <div
                                  key={opt}
                                  className={`p-2.5 rounded-lg border text-sm transition-colors ${
                                    isCorrect
                                      ? 'bg-green-500/10 border-green-500/30 text-green-300'
                                      : 'bg-muted/30 border-border/50 text-muted-foreground'
                                  }`}
                                >
                                  <span className="font-bold mr-1.5">{opt}:</span>
                                  {trivia[optKey] as string}
                                  {isCorrect && <CheckCircle2 className="inline h-3.5 w-3.5 ml-1.5 text-green-400" />}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <Separator className="opacity-50" />

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={getDifficultyColor(trivia.difficulty)}>
                          {trivia.difficulty}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          {categoryIcons[trivia.category] || '📎'} {trivia.category}
                        </Badge>
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 gap-1">
                          <Coins className="h-3 w-3" />
                          {trivia.coinsReward}
                        </Badge>
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 gap-1">
                          <Star className="h-3 w-3" />
                          {trivia.experienceReward} XP
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(trivia)} className="gap-1.5">
                        <Edit className="w-3.5 h-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteTarget(trivia)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                Delete Trivia Question?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this question and cannot be undone.
                <div className="mt-3 p-3 bg-muted/30 rounded-lg border text-sm">
                  <p className="font-medium text-foreground">{deleteTarget?.question}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className={getDifficultyColor(deleteTarget?.difficulty || '')}>
                      {deleteTarget?.difficulty}
                    </Badge>
                    <Badge variant="outline">{deleteTarget?.category}</Badge>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteTarget && handleDelete(deleteTarget)}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete Question
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Brain className="h-5 w-5 text-purple-400" />
                {editingTrivia ? 'Edit' : 'Create'} Trivia Question
              </DialogTitle>
              <DialogDescription>
                {editingTrivia
                  ? 'Update the trivia question. All user attempts will be cleared.'
                  : 'Create a new trivia question for users to answer.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="question" className="text-sm font-medium">Question</Label>
                <Textarea
                  id="question"
                  placeholder="Enter the trivia question..."
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium mb-3 block">Answer Options</Label>
                <div className="grid grid-cols-2 gap-3">
                  {['A', 'B', 'C', 'D'].map((opt) => {
                    const key = `option${opt}` as keyof Partial<Trivia>;
                    return (
                      <div key={opt} className="space-y-1.5">
                        <Label htmlFor={`option${opt}`} className="text-xs text-muted-foreground">
                          Option {opt} {formData.correctAnswer === opt && '(Correct)'}
                        </Label>
                        <Input
                          id={`option${opt}`}
                          placeholder={`Option ${opt}`}
                          value={(formData[key] as string) || ''}
                          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                          className={formData.correctAnswer === opt ? 'border-green-500/50 bg-green-500/5' : ''}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="correct">Correct Answer</Label>
                  <Select value={formData.correctAnswer} onValueChange={(value) => setFormData({ ...formData, correctAnswer: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A{formData.optionA ? `: ${formData.optionA}` : ''}</SelectItem>
                      <SelectItem value="B">B{formData.optionB ? `: ${formData.optionB}` : ''}</SelectItem>
                      <SelectItem value="C">C{formData.optionC ? `: ${formData.optionC}` : ''}</SelectItem>
                      <SelectItem value="D">D{formData.optionD ? `: ${formData.optionD}` : ''}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{categoryIcons[cat]} {cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {difficulties.map((diff) => (
                        <SelectItem key={diff} value={diff}>{diff}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coins" className="flex items-center gap-1">
                    <Coins className="h-3 w-3 text-yellow-500" /> Coins Reward
                  </Label>
                  <Input
                    id="coins"
                    type="number"
                    value={formData.coinsReward}
                    onChange={(e) => setFormData({ ...formData, coinsReward: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="xp" className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-blue-400" /> XP Reward
                  </Label>
                  <Input
                    id="xp"
                    type="number"
                    value={formData.experienceReward}
                    onChange={(e) => setFormData({ ...formData, experienceReward: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={saving} className="gap-2 bg-purple-600 hover:bg-purple-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Question'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
