import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';

export interface Office {
  id: string;
  name: string;
  description: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface OfficeContextValue {
  offices: Office[];
  selectedOffice: Office | null;
  isLoading: boolean;
  switchOffice: (officeId: string) => void;
  createOffice: (data: { name: string; description?: string; color?: string }) => Promise<Office>;
  updateOffice: (id: string, data: { name?: string; description?: string; color?: string }) => Promise<void>;
  deleteOffice: (id: string) => Promise<void>;
  setDefaultOffice: (id: string) => Promise<void>;
  refreshOffices: () => Promise<void>;
}

const OfficeContext = createContext<OfficeContextValue | null>(null);

const STORAGE_KEY = 'digitum_selected_office_id';

const mapRow = (row: any): Office => ({
  id: row.id,
  name: row.name,
  description: row.description || '',
  color: row.color || '#10b981',
  isDefault: row.is_default,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export function OfficeProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useSupabaseAuth();
  const [offices, setOffices] = useState<Office[]>([]);
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadOffices = useCallback(async () => {
    if (!user || !profile?.is_active) {
      setOffices([]);
      setSelectedOffice(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('offices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      let rows = data ?? [];

      if (rows.length === 0) {
        const { data: created, error: createError } = await supabase
          .from('offices')
          .insert({
            name: 'Main Office',
            description: 'Default office',
            color: '#10b981',
            user_id: user.id,
            is_default: true,
          })
          .select()
          .single();
        if (createError) throw createError;
        rows = [created];
      }

      const mapped = rows.map(mapRow);
      setOffices(mapped);

      const storedId = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      const stored = mapped.find((o) => o.id === storedId);
      const defaultOffice = mapped.find((o) => o.isDefault);
      const toSelect = stored || defaultOffice || mapped[0];

      if (toSelect) {
        setSelectedOffice(toSelect);
        localStorage.setItem(`${STORAGE_KEY}_${user.id}`, toSelect.id);
      }
    } catch (err: any) {
      console.error('Failed to load offices:', err?.message || err);
    } finally {
      setIsLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    if (user && profile?.is_active) {
      loadOffices();
    } else if (!user) {
      setOffices([]);
      setSelectedOffice(null);
      setIsLoading(false);
    }
  }, [user?.id, profile?.is_active]);

  const switchOffice = useCallback((officeId: string) => {
    const office = offices.find((o) => o.id === officeId);
    if (office) {
      setSelectedOffice(office);
      if (user) localStorage.setItem(`${STORAGE_KEY}_${user.id}`, officeId);
    }
  }, [offices, user]);

  const createOffice = useCallback(async (data: { name: string; description?: string; color?: string }): Promise<Office> => {
    if (!user) throw new Error('Not authenticated');
    const { data: row, error } = await supabase
      .from('offices')
      .insert({
        name: data.name.trim(),
        description: data.description?.trim() || '',
        color: data.color || '#10b981',
        user_id: user.id,
        is_default: false,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    if (!row) throw new Error('Office was not created — no row returned');
    const office = mapRow(row);
    setOffices((prev) => [...prev, office]);
    return office;
  }, [user]);

  const updateOffice = useCallback(async (id: string, data: { name?: string; description?: string; color?: string }) => {
    if (!user) throw new Error('Not authenticated');
    const updates: Record<string, any> = {};
    if (data.name !== undefined) updates.name = data.name.trim();
    if (data.description !== undefined) updates.description = data.description.trim();
    if (data.color !== undefined) updates.color = data.color;
    const { error } = await supabase
      .from('offices')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) throw new Error(error.message);
    setOffices((prev) => prev.map((o) => o.id === id ? { ...o, ...data } : o));
    setSelectedOffice((prev) => prev?.id === id ? { ...prev, ...data } as Office : prev);
  }, [user]);

  const deleteOffice = useCallback(async (id: string) => {
    if (!user) throw new Error('Not authenticated');
    if (offices.length <= 1) throw new Error('Cannot delete the last office');
    const { error } = await supabase
      .from('offices')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) throw new Error(error.message);
    const remaining = offices.filter((o) => o.id !== id);
    setOffices(remaining);
    if (selectedOffice?.id === id) {
      const next = remaining.find((o) => o.isDefault) || remaining[0];
      if (next) {
        setSelectedOffice(next);
        localStorage.setItem(`${STORAGE_KEY}_${user.id}`, next.id);
      }
    }
  }, [offices, selectedOffice, user]);

  const setDefaultOffice = useCallback(async (id: string) => {
    if (!user) throw new Error('Not authenticated');
    const { error: clearError } = await supabase
      .from('offices')
      .update({ is_default: false })
      .eq('user_id', user.id)
      .neq('id', id);
    if (clearError) throw new Error(clearError.message);
    const { error: setError } = await supabase
      .from('offices')
      .update({ is_default: true })
      .eq('id', id)
      .eq('user_id', user.id);
    if (setError) throw new Error(setError.message);
    setOffices((prev) => prev.map((o) => ({ ...o, isDefault: o.id === id })));
  }, [user]);

  const refreshOffices = useCallback(async () => {
    await loadOffices();
  }, [loadOffices]);

  return (
    <OfficeContext.Provider value={{ offices, selectedOffice, isLoading, switchOffice, createOffice, updateOffice, deleteOffice, setDefaultOffice, refreshOffices }}>
      {children}
    </OfficeContext.Provider>
  );
}

export function useOfficeContext() {
  const ctx = useContext(OfficeContext);
  if (!ctx) throw new Error('useOfficeContext must be used within OfficeProvider');
  return ctx;
}
