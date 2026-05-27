'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
  Upload, Trash2, Edit, Image as ImageIcon, Search, ArrowLeft,
  Loader2, HardDrive, FileImage, Calendar, Copy, CheckCircle2, Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/live dashboard/dashboard-header';
import { PageHeader } from '@/components/dashboard/page-header';

interface MediaItem {
  id: string;
  url: string;
  fileName: string;
  originalFileName: string;
  altText: string;
  size: number;
  uploadedAt: string;
}

export default function MediaManagementPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [editAltText, setEditAltText] = useState('');
  const [editName, setEditName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadMedia();
  }, []);

  const filteredMedia = useMemo(() => {
    if (!searchTerm) return media;
    return media.filter(m =>
      m.originalFileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.altText.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, media]);

  const stats = useMemo(() => {
    const totalSize = media.reduce((sum, m) => sum + m.size, 0);
    const avgSize = media.length > 0 ? totalSize / media.length : 0;
    const recentCount = media.filter(m =>
      new Date(m.uploadedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;
    return { totalSize, avgSize, recentCount };
  }, [media]);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

      const response = await fetch(`${backendUrl}/image`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMedia(data);
      }
    } catch (error) {
      console.error('Error loading media:', error);
      toast({
        title: 'Error',
        description: 'Failed to load media',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'Please select an image file', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image must be less than 5MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

      const response = await fetch(`${backendUrl}/image/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Image uploaded successfully' });
        loadMedia();
      } else {
        let errorMessage = 'Failed to upload image';
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch {
          errorMessage = `Failed to upload image: ${response.statusText}`;
        }
        toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: 'Error', description: 'Failed to upload image', variant: 'destructive' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleEdit = (item: MediaItem) => {
    setEditingMedia(item);
    setEditAltText(item.altText);
    setEditName(item.originalFileName);
  };

  const handleSaveEdit = async () => {
    if (!editingMedia) return;

    try {
      const token = localStorage.getItem('token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

      const response = await fetch(`${backendUrl}/image/${editingMedia.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          altText: editAltText,
          originalFileName: editName
        })
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Media updated successfully' });
        loadMedia();
        setEditingMedia(null);
      } else {
        toast({ title: 'Error', description: 'Failed to update media', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error updating media:', error);
      toast({ title: 'Error', description: 'Failed to update media', variant: 'destructive' });
    }
  };

  const handleDelete = async (item: MediaItem) => {
    try {
      const token = localStorage.getItem('token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

      const response = await fetch(`${backendUrl}/image/${item.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Image deleted successfully' });
        setDeleteTarget(null);
        loadMedia();
      } else {
        toast({ title: 'Error', description: 'Failed to delete image', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({ title: 'Error', description: 'Failed to delete image', variant: 'destructive' });
    }
  };

  const copyUrl = (item: MediaItem) => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace('/api', '') || 'http://localhost:5271';
    const fullUrl = `${backendUrl}${item.url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: 'Copied', description: 'Image URL copied to clipboard' });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getImageUrl = (item: MediaItem) => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace('/api', '') || 'http://localhost:5271';
    return `${backendUrl}${item.url}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <DashboardHeader />
        <main className="w-full px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          <div className="flex items-center justify-center border border-zinc-800 bg-zinc-950 px-5 py-12 text-sm text-zinc-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading media library...
          </div>
        </main>
      </div>
    );
  }

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
          label="Admin · Media"
          title="Media library"
          description="Upload and manage images with metadata."
          actions={
            <>
              <input
                type="file"
                id="media-upload"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
              <label htmlFor="media-upload">
                <Button
                  disabled={uploading}
                  asChild
                  size="sm"
                  className="cursor-pointer rounded-sm bg-primary text-xs font-semibold uppercase tracking-wider text-white hover:bg-primary/90"
                >
                  <span>
                    {uploading ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    {uploading ? 'Uploading...' : 'Upload image'}
                  </span>
                </Button>
              </label>
            </>
          }
        />

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="border border-zinc-800 bg-zinc-950 px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Total images</p>
                <p className="mt-1 font-mono text-2xl font-black tabular-nums leading-none text-cyan-400">
                  {media.length}
                </p>
              </div>
              <FileImage className="h-4 w-4 shrink-0 text-cyan-400" />
            </div>
            <p className="mt-2 text-[11px] text-zinc-500">in library</p>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Total size</p>
                <p className="mt-1 font-mono text-2xl font-black tabular-nums leading-none text-blue-400">
                  {formatFileSize(stats.totalSize)}
                </p>
              </div>
              <HardDrive className="h-4 w-4 shrink-0 text-blue-400" />
            </div>
            <p className="mt-2 text-[11px] text-zinc-500">avg {formatFileSize(stats.avgSize)}/image</p>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Uploaded 7d</p>
                <p className="mt-1 font-mono text-2xl font-black tabular-nums leading-none text-green-400">
                  {stats.recentCount}
                </p>
              </div>
              <Calendar className="h-4 w-4 shrink-0 text-green-400" />
            </div>
            <p className="mt-2 text-[11px] text-zinc-500">recent additions</p>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">With alt text</p>
                <p className="mt-1 font-mono text-2xl font-black tabular-nums leading-none text-purple-400">
                  {media.filter((m) => m.altText?.trim()).length}
                </p>
              </div>
              <CheckCircle2 className="h-4 w-4 shrink-0 text-purple-400" />
            </div>
            <p className="mt-2 text-[11px] text-zinc-500">
              {media.length > 0
                ? Math.round((media.filter((m) => m.altText?.trim()).length / media.length) * 100)
                : 0}
              % coverage
            </p>
          </div>
        </div>

        {/* Search */}
        <section className="border border-zinc-800 bg-zinc-950">
          <div className="px-5 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                placeholder="Search by filename or alt text..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-sm border-zinc-800 bg-zinc-900/60 pl-10"
              />
            </div>
            {searchTerm && (
              <p className="mt-2 text-[11px] text-zinc-500">
                Showing <span className="font-mono tabular-nums text-zinc-300">{filteredMedia.length}</span> of{' '}
                <span className="font-mono tabular-nums text-zinc-300">{media.length}</span> images
              </p>
            )}
          </div>
        </section>

        {/* Media Grid */}
        {filteredMedia.length === 0 ? (
          <section className="flex flex-col items-center gap-3 border border-zinc-800 bg-zinc-950 px-5 py-16 text-center">
            <ImageIcon className="h-8 w-8 text-zinc-700" />
            <div>
              <p className="font-bold">No images found</p>
              <p className="mt-0.5 max-w-sm text-xs text-zinc-500">
                {searchTerm ? 'No images match your search.' : 'Upload your first image to get started.'}
              </p>
            </div>
          </section>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredMedia.map((item) => (
              <Card key={item.id} className="group overflow-hidden rounded-none border-zinc-800 bg-zinc-950 transition-colors hover:border-zinc-700">
                <div className="relative aspect-square overflow-hidden bg-zinc-900">
                  <img
                    src={getImageUrl(item)}
                    alt={item.altText || item.originalFileName}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setPreviewItem(item)}
                      className="gap-1.5"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => copyUrl(item)}
                      className="gap-1.5"
                    >
                      {copiedId === item.id ? <CheckCircle2 className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedId === item.id ? 'Copied!' : 'URL'}
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <p className="font-medium truncate text-sm" title={item.originalFileName}>
                      {item.originalFileName}
                    </p>
                    {item.altText ? (
                      <p className="text-xs text-muted-foreground truncate" title={item.altText}>
                        {item.altText}
                      </p>
                    ) : (
                      <Badge variant="outline" className="text-[10px] bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                        No alt text
                      </Badge>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatFileSize(item.size)}</span>
                      <span>{formatDate(item.uploadedAt)}</span>
                    </div>
                    <Separator className="opacity-50" />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(item)}
                        className="flex-1 gap-1.5 text-xs"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteTarget(item)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Preview Dialog */}
        <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-cyan-400" />
                {previewItem?.originalFileName}
              </DialogTitle>
            </DialogHeader>
            {previewItem && (
              <div className="space-y-4">
                <div className="relative bg-muted/30 rounded-lg overflow-hidden max-h-[60vh]">
                  <img
                    src={getImageUrl(previewItem)}
                    alt={previewItem.altText || previewItem.originalFileName}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <p className="text-muted-foreground text-xs">Size</p>
                    <p className="font-medium">{formatFileSize(previewItem.size)}</p>
                  </div>
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <p className="text-muted-foreground text-xs">Uploaded</p>
                    <p className="font-medium">{formatDate(previewItem.uploadedAt)}</p>
                  </div>
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <p className="text-muted-foreground text-xs">Alt Text</p>
                    <p className="font-medium truncate">{previewItem.altText || 'None'}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                Delete Image?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this image and cannot be undone.
                <div className="mt-3 p-3 bg-muted/30 rounded-lg border text-sm">
                  <p className="font-medium text-foreground">{deleteTarget?.originalFileName}</p>
                  <p className="text-muted-foreground">{deleteTarget ? formatFileSize(deleteTarget.size) : ''}</p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteTarget && handleDelete(deleteTarget)}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete Image
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Dialog */}
        <Dialog open={!!editingMedia} onOpenChange={() => setEditingMedia(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-cyan-400" />
                Edit Media
              </DialogTitle>
            </DialogHeader>
            {editingMedia && (
              <div className="space-y-4">
                <div className="relative aspect-video bg-muted/30 rounded-lg overflow-hidden">
                  <img
                    src={getImageUrl(editingMedia)}
                    alt={editingMedia.altText || editingMedia.originalFileName}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-sm font-medium">File Name</Label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter file name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-alt" className="text-sm font-medium">Alt Text</Label>
                  <Input
                    id="edit-alt"
                    value={editAltText}
                    onChange={(e) => setEditAltText(e.target.value)}
                    placeholder="Describe the image for accessibility"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 p-3 bg-muted/20 rounded-lg text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Size</p>
                    <p className="font-medium">{formatFileSize(editingMedia.size)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Uploaded</p>
                    <p className="font-medium">{formatDate(editingMedia.uploadedAt)}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setEditingMedia(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} className="bg-cyan-600 hover:bg-cyan-700">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
