'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, X, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface MediaItem {
  url: string
  fileName: string
  size: number
  createdAt: string
}

interface MediaLibraryProps {
  open: boolean
  onClose: () => void
  onSelect: (url: string) => void
}

export function MediaLibrary({ open, onClose, onSelect }: MediaLibraryProps) {
  const [images, setImages] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      loadImages()
    }
  }, [open])

  const loadImages = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5271'
      
      const response = await fetch(`${backendUrl}/image`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setImages(data)
      }
    } catch (error) {
      console.error('Error loading images:', error)
      toast.error('Failed to load images')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const token = localStorage.getItem('token')
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5271'
      
      const response = await fetch(`${backendUrl}/image/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Image uploaded successfully')
        loadImages() // Reload images
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to upload image')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
    } finally {
      setUploading(false)
      // Reset input
      e.target.value = ''
    }
  }

  const handleSelect = () => {
    if (selectedImage) {
      const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5271').replace('/api', '')
      onSelect(`${backendUrl}${selectedImage}`)
      onClose()
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Media Library</DialogTitle>
        </DialogHeader>

        {/* Upload Section */}
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
          <label
            htmlFor="image-upload"
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
            <p className="text-sm text-muted-foreground">
              {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, GIF, WEBP up to 5MB
            </p>
          </label>
        </div>

        {/* Images Grid */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No images uploaded yet
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4 p-2">
              {images.map((image) => {
                const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5271').replace('/api', '')
                const fullUrl = `${backendUrl}${image.url}`
                const isSelected = selectedImage === image.url
                
                return (
                  <div
                    key={image.fileName}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all hover:border-primary ${
                      isSelected ? 'border-primary ring-2 ring-primary' : 'border-transparent'
                    }`}
                    onClick={() => setSelectedImage(image.url)}
                  >
                    <img
                      src={fullUrl}
                      alt={image.fileName}
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-primary rounded-full p-1">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2">
                      <p className="text-xs text-white truncate">{image.fileName}</p>
                      <p className="text-xs text-white/70">{formatFileSize(image.size)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSelect} disabled={!selectedImage}>
            Insert Image
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
