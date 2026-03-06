'use client';

import { type ReactNode } from 'react';
import { Settings, Eye, EyeOff, ChevronUp, ChevronDown, ArrowRight, ArrowLeft, RotateCcw, X } from 'lucide-react';
import { type ModuleConfig, type ModuleId } from '@/hooks/useDashboardLayout';

interface ModuleSlot {
  id: ModuleId;
  content: ReactNode;
}

interface DashboardModuleGridProps {
  modules: ModuleConfig[];
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  toggleVisible: (id: ModuleId) => void;
  moveToColumn: (id: ModuleId, column: 'left' | 'right') => void;
  moveUp: (id: ModuleId) => void;
  moveDown: (id: ModuleId) => void;
  reset: () => void;
  slots: ModuleSlot[];
}

function ModuleWrapper({
  mod,
  isFirstInCol,
  isLastInCol,
  editMode,
  toggleVisible,
  moveToColumn,
  moveUp,
  moveDown,
  content,
}: {
  mod: ModuleConfig;
  isFirstInCol: boolean;
  isLastInCol: boolean;
  editMode: boolean;
  toggleVisible: (id: ModuleId) => void;
  moveToColumn: (id: ModuleId, column: 'left' | 'right') => void;
  moveUp: (id: ModuleId) => void;
  moveDown: (id: ModuleId) => void;
  content: ReactNode;
}) {
  const isLeft = mod.column === 'left';

  return (
    <div className={`relative transition-all duration-300 ${!mod.visible && !editMode ? 'hidden' : ''}`}>
      {/* Highlight ring in edit mode */}
      {editMode && (
        <div className="absolute inset-0 z-10 pointer-events-none rounded-xl ring-2 ring-primary/40 ring-offset-2 ring-offset-background" />
      )}

      {/* Control bar */}
      {editMode && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-0.5 bg-background border border-border/60 rounded-full shadow-lg px-1.5 py-0.5 whitespace-nowrap">
          <span className="text-[10px] font-semibold text-muted-foreground px-1">{mod.label}</span>
          <div className="w-px h-4 bg-border/40" />

          {/* Move within column */}
          <button
            onClick={() => moveUp(mod.id)}
            disabled={isFirstInCol}
            title="Move up"
            className="p-1 rounded-full hover:bg-muted/70 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => moveDown(mod.id)}
            disabled={isLastInCol}
            title="Move down"
            className="p-1 rounded-full hover:bg-muted/70 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-border/40" />

          {/* Move to other column */}
          <button
            onClick={() => moveToColumn(mod.id, isLeft ? 'right' : 'left')}
            title={isLeft ? 'Move to sidebar →' : '← Move to main'}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold hover:bg-muted/70 transition-colors"
          >
            {isLeft ? (
              <><span>Sidebar</span><ArrowRight className="w-3 h-3" /></>
            ) : (
              <><ArrowLeft className="w-3 h-3" /><span>Main</span></>
            )}
          </button>

          <div className="w-px h-4 bg-border/40" />

          {/* Toggle visibility */}
          <button
            onClick={() => toggleVisible(mod.id)}
            title={mod.visible ? 'Hide' : 'Show'}
            className={`p-1 rounded-full transition-colors ${
              mod.visible ? 'hover:bg-muted/70' : 'text-red-400 hover:bg-red-500/10'
            }`}
          >
            {mod.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      {/* Hidden placeholder */}
      {editMode && !mod.visible ? (
        <div className="rounded-xl border border-dashed border-border/40 bg-muted/10 flex items-center justify-center py-6 gap-2">
          <EyeOff className="w-4 h-4 text-muted-foreground/40" />
          <span className="text-sm text-muted-foreground/50">{mod.label}</span>
          <button onClick={() => toggleVisible(mod.id)} className="text-xs text-primary hover:underline ml-1">Show</button>
        </div>
      ) : content}
    </div>
  );
}

export function DashboardModuleGrid({
  modules,
  editMode,
  setEditMode,
  toggleVisible,
  moveToColumn,
  moveUp,
  moveDown,
  reset,
  slots,
}: DashboardModuleGridProps) {
  const slotMap = new Map(slots.map(s => [s.id, s.content]));

  const leftMods  = modules.filter(m => m.column === 'left').sort((a, b) => a.order - b.order);
  const rightMods = modules.filter(m => m.column === 'right').sort((a, b) => a.order - b.order);

  const renderColumn = (mods: ModuleConfig[]) =>
    mods.map((mod, idx) => (
      <ModuleWrapper
        key={mod.id}
        mod={mod}
        isFirstInCol={idx === 0}
        isLastInCol={idx === mods.length - 1}
        editMode={editMode}
        toggleVisible={toggleVisible}
        moveToColumn={moveToColumn}
        moveUp={moveUp}
        moveDown={moveDown}
        content={slotMap.get(mod.id)}
      />
    ));

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {editMode && (
          <span className="text-xs text-muted-foreground bg-muted/50 border border-border/40 px-2.5 py-1 rounded-lg">
            Use arrow buttons to reorder · Move modules between <strong>Main</strong> and <strong>Sidebar</strong> columns
          </span>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {editMode && (
            <button
              onClick={reset}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-border/40 hover:bg-muted/50 text-muted-foreground transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
          <button
            onClick={() => setEditMode(!editMode)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium ${
              editMode
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border/40 hover:bg-muted/50 text-muted-foreground'
            }`}
          >
            {editMode ? <X className="w-3 h-3" /> : <Settings className="w-3 h-3" />}
            {editMode ? 'Done' : 'Customize'}
          </button>
        </div>
      </div>

      {/* Column labels in edit mode */}
      {editMode && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 xl:col-span-8">
            <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground font-semibold uppercase tracking-widest">
              <div className="flex-1 h-px bg-border/40" />
              Main
              <div className="flex-1 h-px bg-border/40" />
            </div>
          </div>
          <div className="col-span-12 xl:col-span-4">
            <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground font-semibold uppercase tracking-widest">
              <div className="flex-1 h-px bg-border/40" />
              Sidebar
              <div className="flex-1 h-px bg-border/40" />
            </div>
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left / Main column */}
        <div className={`col-span-12 xl:col-span-8 space-y-4 ${
          editMode ? 'min-h-24 rounded-xl ring-1 ring-dashed ring-border/30 p-2' : ''
        }`}>
          {leftMods.length > 0 ? renderColumn(leftMods) : editMode && (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground/50">
              No modules — move one here with the arrow control
            </div>
          )}
        </div>

        {/* Right / Sidebar column */}
        <div className={`col-span-12 xl:col-span-4 space-y-4 ${
          editMode ? 'min-h-24 rounded-xl ring-1 ring-dashed ring-border/30 p-2' : ''
        }`}>
          {rightMods.length > 0 ? renderColumn(rightMods) : editMode && (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground/50">
              No modules — move one here with the arrow control
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

