'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Upload, Trash2, Edit, Image as ImageIcon, Search, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface MediaItem {
  id: string
  url: string
  fileName: string
  originalFileName: string
  altText: string
  size: number
  uploadedAt: string
}

export default function MediaManagementPage() {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [filteredMedia, setFilteredMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null)
  const [editAltText, setEditAltText] = useState('')
  const [editName, setEditName] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadMedia()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = media.filter(m => 
        m.originalFileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.altText.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredMedia(filtered)
    } else {
      setFilteredMedia(media)
    }
  }, [searchTerm, media])

  const loadMedia = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
      
      const response = await fetch(`${backendUrl}/image`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMedia(data)
        setFilteredMedia(data)
      }
    } catch (error) {
      console.error('Error loading media:', error)
      toast.error('Failed to load media')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const token = localStorage.getItem('token')
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
      
      const response = await fetch(`${backendUrl}/image/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (response.ok) {
        toast.success('Image uploaded successfully')
        loadMedia()
      } else {
        let errorMessage = 'Failed to upload image'
        try {
          const error = await response.json()
          errorMessage = error.message || errorMessage
        } catch {
          // Response is not JSON, use status text
          errorMessage = `Failed to upload image: ${response.statusText}`
        }
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleEdit = (item: MediaItem) => {
    setEditingMedia(item)
    setEditAltText(item.altText)
    setEditName(item.originalFileName)
  }

  const handleSaveEdit = async () => {
    if (!editingMedia) return

    try {
      const token = localStorage.getItem('token')
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
      
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
      })

      if (response.ok) {
        toast.success('Media updated successfully')
        loadMedia()
        setEditingMedia(null)
      } else {
        toast.error('Failed to update media')
      }
    } catch (error) {
      console.error('Error updating media:', error)
      toast.error('Failed to update media')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return

    try {
      const token = localStorage.getItem('token')
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
      
      const response = await fetch(`${backendUrl}/image/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success('Image deleted successfully')
        loadMedia()
      } else {
        toast.error('Failed to delete image')
      }
    } catch (error) {
      console.error('Error deleting image:', error)
      toast.error('Failed to delete image')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Media Library</h1>
            <p className="text-muted-foreground">Manage your uploaded images</p>
          </div>
        </div>
        <div>
          <input
            type="file"
            id="media-upload"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
          <label htmlFor="media-upload">
            <Button disabled={uploading} asChild>
              <span>
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? 'Uploading...' : 'Upload Image'}
              </span>
            </Button>
          </label>
        </div>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by filename or alt text..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Media Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p>Loading media...</p>
        </div>
      ) : filteredMedia.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'No images found matching your search' : 'No images uploaded yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMedia.map((item) => {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace('/api', '') || 'http://localhost:5271'
            const fullUrl = `${backendUrl}${item.url}`
            
            return (
              <Card key={item.id} className="overflow-hidden">
                <div className="relative aspect-square bg-muted">
                  <img
                    src={fullUrl}
                    alt={item.altText || item.originalFileName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <p className="font-medium truncate" title={item.originalFileName}>
                      {item.originalFileName}
                    </p>
                    {item.altText && (
                      <p className="text-sm text-muted-foreground truncate" title={item.altText}>
                        Alt: {item.altText}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatFileSize(item.size)}</span>
                      <span>{formatDate(item.uploadedAt)}</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(item)}
                        className="flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingMedia} onOpenChange={() => setEditingMedia(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Media</DialogTitle>
          </DialogHeader>
          {editingMedia && (
            <div className="space-y-4">
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <img
                  src={`${(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5271').replace('/api', '')}${editingMedia.url}`}
                  alt={editingMedia.altText || editingMedia.originalFileName}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">File Name</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter file name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-alt">Alt Text</Label>
                <Input
                  id="edit-alt"
                  value={editAltText}
                  onChange={(e) => setEditAltText(e.target.value)}
                  placeholder="Describe the image for accessibility"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Size: {formatFileSize(editingMedia.size)}</p>
                <p>Uploaded: {formatDate(editingMedia.uploadedAt)}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMedia(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
