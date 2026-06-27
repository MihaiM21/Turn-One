"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Trash2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { deletePreset, listPresets } from "@/lib/export/export-presets"
import type { ExportPreset, ExportSessionType, OutputSizeKey } from "@/types/export-types"

interface PresetManagerDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  sessionType: ExportSessionType
  currentChartKeys: string[]
  currentOutputSizes: OutputSizeKey[]
  onSaveNew: (name: string) => Promise<void>
  onApply: (preset: ExportPreset) => void
}

export function PresetManagerDialog({
  open,
  onOpenChange,
  sessionType,
  currentChartKeys,
  currentOutputSizes,
  onSaveNew,
  onApply,
}: PresetManagerDialogProps) {
  const { toast } = useToast()
  const [presets, setPresets] = useState<ExportPreset[]>([])
  const [loading, setLoading] = useState(false)
  const [newName, setNewName] = useState("")
  const [saving, setSaving] = useState(false)

  const refresh = async () => {
    setLoading(true)
    try {
      const list = await listPresets(sessionType)
      setPresets(list)
    } catch (e) {
      toast({ title: "Failed to load presets", description: String(e), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) refresh()
  }, [open, sessionType])

  const handleSave = async () => {
    if (!newName.trim()) return
    setSaving(true)
    try {
      await onSaveNew(newName.trim())
      setNewName("")
      await refresh()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deletePreset(id)
      toast({ title: "Preset deleted" })
      await refresh()
    } catch (e) {
      toast({ title: "Delete failed", description: String(e), variant: "destructive" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage {sessionType} presets</DialogTitle>
          <DialogDescription>
            Presets capture your selected charts and output sizes for quick re-use.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Label>Save current selection as preset</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Preset name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={
                saving || (currentChartKeys.length === 0 && currentOutputSizes.length === 0)
              }
            />
            <Button onClick={handleSave} disabled={saving || !newName.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Captures {currentChartKeys.length} chart{currentChartKeys.length === 1 ? "" : "s"} ×{" "}
            {currentOutputSizes.length} size{currentOutputSizes.length === 1 ? "" : "s"}.
          </p>
        </div>

        <div className="mt-4 space-y-2 max-h-72 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : presets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No presets yet.</p>
          ) : (
            presets.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between border border-zinc-800 bg-zinc-950 px-3 py-2 rounded-md"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.chartKeys.length} charts • {p.outputSizes.length} sizes
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onApply(p)
                      onOpenChange(false)
                    }}
                  >
                    Apply
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(p.id)}>
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
