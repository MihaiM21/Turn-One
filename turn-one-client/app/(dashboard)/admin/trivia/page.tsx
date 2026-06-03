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
import { DashboardHeader } from '@/components/dashboard/live dashboard/dashboard-header';
import { PageHeader } from '@/components/dashboard/page-header';

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
      <div className="min-h-screen bg-black">
        <DashboardHeader />
        <main className="w-full px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          <div className="flex items-center justify-center border border-zinc-800 bg-zinc-950 px-5 py-12 text-sm text-zinc-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading trivia questions...
          </div>
        </main>
      </div>
    );
  }

  const pct = getDifficultyPercent();

  return (
    <div className="min-h-screen bg-black">
      <DashboardHeader />
      <main className="w-full px-4 py-5 sm:px-6 lg:px-8 lg:py-6 space-y-4">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-500 transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to admin
        </Link>

        <PageHeader
          label="Admin · Trivia"
          title="Trivia management"
          description="Create, edit and manage F1 trivia questions."
          actions={
            <Button
              onClick={handleCreate}
              size="sm"
              className="rounded-sm bg-primary text-xs font-semibold uppercase tracking-wider text-white hover:bg-primary/90"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New question
            </Button>
          }
        />

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="border border-zinc-800 bg-zinc-950 px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Total questions</p>
                <p className="mt-1 font-mono text-2xl font-black tabular-nums leading-none text-purple-400">
                  {trivias.length}
                </p>
              </div>
              <HelpCircle className="h-4 w-4 shrink-0 text-purple-400" />
            </div>
            <p className="mt-2 text-[11px] text-zinc-500">
              <span className="font-mono tabular-nums">{stats.uniqueCategories}</span> categories
            </p>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Easy</p>
                <p className="mt-1 font-mono text-2xl font-black tabular-nums leading-none text-green-400">{stats.easy}</p>
              </div>
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
            </div>
            <p className="mt-2 text-[11px] text-zinc-500">{pct.easy.toFixed(0)}% of total</p>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Medium</p>
                <p className="mt-1 font-mono text-2xl font-black tabular-nums leading-none text-yellow-400">
                  {stats.medium}
                </p>
              </div>
              <BarChart3 className="h-4 w-4 shrink-0 text-yellow-400" />
            </div>
            <p className="mt-2 text-[11px] text-zinc-500">{pct.medium.toFixed(0)}% of total</p>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Hard</p>
                <p className="mt-1 font-mono text-2xl font-black tabular-nums leading-none text-red-400">{stats.hard}</p>
              </div>
              <Zap className="h-4 w-4 shrink-0 text-red-400" />
            </div>
            <p className="mt-2 text-[11px] text-zinc-500">{pct.hard.toFixed(0)}% of total</p>
          </div>
        </div>

        {/* Difficulty Distribution Bar */}
        <section className="border border-zinc-800 bg-zinc-950">
          <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
            <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Difficulty distribution</p>
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider">
              <span className="flex items-center gap-1 text-green-400">
                <span className="h-1.5 w-1.5 bg-green-500" /> Easy
              </span>
              <span className="flex items-center gap-1 text-yellow-400">
                <span className="h-1.5 w-1.5 bg-yellow-500" /> Medium
              </span>
              <span className="flex items-center gap-1 text-red-400">
                <span className="h-1.5 w-1.5 bg-red-500" /> Hard
              </span>
            </div>
          </div>
          <div className="px-5 py-4">
            <div className="flex h-2 overflow-hidden bg-zinc-800">
              {pct.easy > 0 && (
                <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${pct.easy}%` }} />
              )}
              {pct.medium > 0 && (
                <div className="h-full bg-yellow-500 transition-all duration-500" style={{ width: `${pct.medium}%` }} />
              )}
              {pct.hard > 0 && (
                <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${pct.hard}%` }} />
              )}
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500">
              <span>
                Total rewards: <span className="font-mono tabular-nums text-zinc-300">{stats.totalCoins}</span> coins ·{' '}
                <span className="font-mono tabular-nums text-zinc-300">{stats.totalXP}</span> XP
              </span>
              <span className="font-mono tabular-nums text-zinc-400">{trivias.length} questions</span>
            </div>
          </div>
        </section>

        {/* Filters & Search */}
        <section className="border border-zinc-800 bg-zinc-950">
          <div className="space-y-4 px-5 py-4">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  placeholder="Search questions or categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-sm border-zinc-800 bg-zinc-900/60 pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="rounded-sm border-zinc-800 bg-zinc-900/60 lg:w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{categoryIcons[cat]} {cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="rounded-sm border-zinc-800 bg-zinc-900/60 lg:w-[160px]">
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

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid h-auto w-full grid-cols-4 rounded-none border border-zinc-800 bg-zinc-950 p-0">
                {[
                  { value: 'all', label: 'All', icon: BookOpen, count: trivias.length },
                  { value: 'easy', label: 'Easy', icon: CheckCircle2, count: stats.easy },
                  { value: 'medium', label: 'Medium', icon: BarChart3, count: stats.medium },
                  { value: 'hard', label: 'Hard', icon: Zap, count: stats.hard },
                ].map(({ value, label, icon: TIcon, count }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="gap-1.5 rounded-none border-b-2 border-transparent bg-transparent px-3 py-2.5 text-[11px] uppercase tracking-wider text-zinc-400 transition-colors hover:text-zinc-200 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    <TIcon className="h-3.5 w-3.5" />
                    {label} <span className="font-mono tabular-nums text-zinc-500">{count}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {(searchTerm || categoryFilter !== 'ALL' || difficultyFilter !== 'ALL') && (
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                <Filter className="h-3 w-3" />
                Showing <span className="font-mono tabular-nums text-zinc-300">{filteredTrivias.length}</span> of{' '}
                <span className="font-mono tabular-nums text-zinc-300">{trivias.length}</span>
                {searchTerm && <span className="border border-zinc-700 px-1.5 py-0.5 uppercase tracking-wider">Search: {searchTerm}</span>}
                {categoryFilter !== 'ALL' && <span className="border border-zinc-700 px-1.5 py-0.5 uppercase tracking-wider">Category: {categoryFilter}</span>}
                {difficultyFilter !== 'ALL' && <span className="border border-zinc-700 px-1.5 py-0.5 uppercase tracking-wider">Difficulty: {difficultyFilter}</span>}
              </div>
            )}
          </div>
        </section>

        {/* Questions List */}
        <div className="space-y-3">
          {filteredTrivias.length === 0 ? (
            <section className="flex flex-col items-center gap-3 border border-zinc-800 bg-zinc-950 px-5 py-16 text-center">
              <Brain className="h-8 w-8 text-zinc-700" />
              <div>
                <p className="font-bold">No questions found</p>
                <p className="mt-0.5 max-w-sm text-xs text-zinc-500">
                  {searchTerm || categoryFilter !== 'ALL' || difficultyFilter !== 'ALL'
                    ? 'Try adjusting your search or filter settings.'
                    : 'Create your first trivia question to get started.'}
                </p>
              </div>
              {trivias.length === 0 && (
                <Button
                  onClick={handleCreate}
                  size="sm"
                  className="rounded-sm bg-primary text-xs font-semibold uppercase tracking-wider text-white hover:bg-primary/90"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Create first question
                </Button>
              )}
            </section>
          ) : (
            filteredTrivias.map((trivia, index) => (
              <Card key={trivia.id} className="group rounded-none border-zinc-800 bg-zinc-950 transition-colors hover:border-zinc-700">
                <CardContent className="p-5">
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
      </main>
    </div>
  );
}
