'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Brain, Plus, Edit, Trash2, ArrowLeft, Save, X } from 'lucide-react';
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

export default function AdminTriviaPage() {
  const [trivias, setTrivias] = useState<Trivia[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTrivia, setEditingTrivia] = useState<Trivia | null>(null);
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
    }
  };

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

    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const url = editingTrivia
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/Trivia/${editingTrivia.id}`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/Trivia`;

      const method = editingTrivia ? 'PUT' : 'POST';

      const payload = editingTrivia ? { ...formData, id: editingTrivia.id } : formData;
      console.log('Sending trivia request:', { url, method, payload });

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
        console.error('Server error response:', errorText);
        let errorMessage = 'Failed to save trivia';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success! 🎉',
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
      console.error('Save error:', error);
      toast({
        title: 'Failed',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this trivia question?')) return;

    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/Trivia/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Deleted',
          description: 'Trivia question deleted successfully',
        });
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Admin
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold">Trivia Management</h1>
            <p className="text-muted-foreground mt-1">
              Create, edit, and manage F1 trivia questions
            </p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            New Question
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Questions</p>
              <p className="text-2xl font-bold">{trivias.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Easy</p>
              <p className="text-2xl font-bold text-green-500">
                {trivias.filter(t => t.difficulty === 'Easy').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Medium</p>
              <p className="text-2xl font-bold text-yellow-500">
                {trivias.filter(t => t.difficulty === 'Medium').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Hard</p>
              <p className="text-2xl font-bold text-red-500">
                {trivias.filter(t => t.difficulty === 'Hard').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Questions List */}
        <div className="grid gap-4">
          {trivias.map((trivia) => (
            <Card key={trivia.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <Brain className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{trivia.question}</p>
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <div className={`p-2 rounded border ${trivia.correctAnswer === 'A' ? 'bg-green-500/10 border-green-500/30' : 'bg-muted/50'}`}>
                            <span className="font-semibold">A:</span> {trivia.optionA}
                          </div>
                          <div className={`p-2 rounded border ${trivia.correctAnswer === 'B' ? 'bg-green-500/10 border-green-500/30' : 'bg-muted/50'}`}>
                            <span className="font-semibold">B:</span> {trivia.optionB}
                          </div>
                          <div className={`p-2 rounded border ${trivia.correctAnswer === 'C' ? 'bg-green-500/10 border-green-500/30' : 'bg-muted/50'}`}>
                            <span className="font-semibold">C:</span> {trivia.optionC}
                          </div>
                          <div className={`p-2 rounded border ${trivia.correctAnswer === 'D' ? 'bg-green-500/10 border-green-500/30' : 'bg-muted/50'}`}>
                            <span className="font-semibold">D:</span> {trivia.optionD}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={getDifficultyColor(trivia.difficulty)}>
                        {trivia.difficulty}
                      </Badge>
                      <Badge variant="outline">{trivia.category}</Badge>
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
                        💰 {trivia.coinsReward}
                      </Badge>
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
                        ⭐ {trivia.experienceReward} XP
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(trivia)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(trivia.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTrivia ? 'Edit' : 'Create'} Trivia Question</DialogTitle>
              <DialogDescription>
                {editingTrivia 
                  ? 'Update the trivia question. All user attempts will be cleared.' 
                  : 'Create a new trivia question for users to answer.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question">Question</Label>
                <Textarea
                  id="question"
                  placeholder="Enter the trivia question..."
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="optionA">Option A</Label>
                  <Input
                    id="optionA"
                    placeholder="Option A"
                    value={formData.optionA}
                    onChange={(e) => setFormData({ ...formData, optionA: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="optionB">Option B</Label>
                  <Input
                    id="optionB"
                    placeholder="Option B"
                    value={formData.optionB}
                    onChange={(e) => setFormData({ ...formData, optionB: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="optionC">Option C</Label>
                  <Input
                    id="optionC"
                    placeholder="Option C"
                    value={formData.optionC}
                    onChange={(e) => setFormData({ ...formData, optionC: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="optionD">Option D</Label>
                  <Input
                    id="optionD"
                    placeholder="Option D"
                    value={formData.optionD}
                    onChange={(e) => setFormData({ ...formData, optionD: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="correct">Correct Answer</Label>
                  <Select value={formData.correctAnswer} onValueChange={(value) => setFormData({ ...formData, correctAnswer: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="D">D</SelectItem>
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
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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
                  <Label htmlFor="coins">Coins Reward</Label>
                  <Input
                    id="coins"
                    type="number"
                    value={formData.coinsReward}
                    onChange={(e) => setFormData({ ...formData, coinsReward: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="xp">Experience Reward</Label>
                  <Input
                    id="xp"
                    type="number"
                    value={formData.experienceReward}
                    onChange={(e) => setFormData({ ...formData, experienceReward: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
