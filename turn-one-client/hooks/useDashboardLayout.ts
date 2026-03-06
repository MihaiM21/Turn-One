'use client';

import { useState, useEffect, useCallback } from 'react';

export type ModuleId =
  | 'timing-grid'
  | 'track-map'
  | 'weather'
  | 'race-control'
  | 'team-radio';

export interface ModuleConfig {
  id: ModuleId;
  label: string;
  visible: boolean;
  /** order within its column (lower = first) */
  order: number;
  /** which column this module lives in */
  column: 'left' | 'right';
}

// Bump storage key so old 'span'-based saves don't conflict
const STORAGE_KEY = 'live-dashboard-layout-v2';

const DEFAULTS: ModuleConfig[] = [
  { id: 'timing-grid',  label: 'Timing Grid',      visible: true, order: 0, column: 'left'  },
  { id: 'track-map',    label: 'Track Map',         visible: true, order: 0, column: 'right' },
  { id: 'weather',      label: 'Track Conditions',  visible: true, order: 1, column: 'right' },
  { id: 'race-control', label: 'Race Control',      visible: true, order: 2, column: 'right' },
  { id: 'team-radio',   label: 'Team Radio',        visible: true, order: 3, column: 'right' },
];

function load(): ModuleConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const saved: ModuleConfig[] = JSON.parse(raw);
    const savedMap = new Map(saved.map(m => [m.id, m]));
    return DEFAULTS.map(def => savedMap.get(def.id) ?? def);
  } catch {
    return DEFAULTS;
  }
}

function save(modules: ModuleConfig[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(modules));
  } catch { /* quota exceeded */ }
}

export function useDashboardLayout() {
  const [modules, setModules] = useState<ModuleConfig[]>(DEFAULTS);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => { setModules(load()); }, []);

  const toggleVisible = useCallback((id: ModuleId) => {
    setModules(prev => {
      const next = prev.map(m => m.id === id ? { ...m, visible: !m.visible } : m);
      save(next); return next;
    });
  }, []);

  /** Move a module to the given column (appended at the end of that column). */
  const moveToColumn = useCallback((id: ModuleId, column: 'left' | 'right') => {
    setModules(prev => {
      const maxOrder = prev
        .filter(m => m.column === column)
        .reduce((max, m) => Math.max(max, m.order), -1);
      const next = prev.map(m => m.id === id ? { ...m, column, order: maxOrder + 1 } : m);
      save(next); return next;
    });
  }, []);

  /** Move a module up within its own column. */
  const moveUp = useCallback((id: ModuleId) => {
    setModules(prev => {
      const mod = prev.find(m => m.id === id);
      if (!mod) return prev;
      const colMods = prev.filter(m => m.column === mod.column).sort((a, b) => a.order - b.order);
      const idx = colMods.findIndex(m => m.id === id);
      if (idx <= 0) return prev;
      const swapId = colMods[idx - 1].id;
      const next = prev.map(m => {
        if (m.id === id)     return { ...m, order: colMods[idx - 1].order };
        if (m.id === swapId) return { ...m, order: colMods[idx].order };
        return m;
      });
      save(next); return next;
    });
  }, []);

  /** Move a module down within its own column. */
  const moveDown = useCallback((id: ModuleId) => {
    setModules(prev => {
      const mod = prev.find(m => m.id === id);
      if (!mod) return prev;
      const colMods = prev.filter(m => m.column === mod.column).sort((a, b) => a.order - b.order);
      const idx = colMods.findIndex(m => m.id === id);
      if (idx >= colMods.length - 1) return prev;
      const swapId = colMods[idx + 1].id;
      const next = prev.map(m => {
        if (m.id === id)     return { ...m, order: colMods[idx + 1].order };
        if (m.id === swapId) return { ...m, order: colMods[idx].order };
        return m;
      });
      save(next); return next;
    });
  }, []);

  const reset = useCallback(() => { setModules(DEFAULTS); save(DEFAULTS); }, []);

  return {
    modules,
    editMode,
    setEditMode,
    toggleVisible,
    moveToColumn,
    moveUp,
    moveDown,
    reset,
  };
}
