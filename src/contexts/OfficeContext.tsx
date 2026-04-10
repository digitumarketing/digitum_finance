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
      let { data: rows, error } = await supabase
        .from('offices')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!rows || rows.length === 0) {
        const { data: inserted, error: insertError } = await supabase
          .from('offices')
          .insert({ name: 'Main Office', description: 'Default office', color: '#10b981', user_id: user.id, is_default: true })
          .select('*');
        if (insertError) throw insertError;
        rows = inserted || [];
      }

      if (!rows || rows.length === 0) {
        setIsLoading(false);
        return;
      }

      const mapped = rows.map(mapRow);
      setOffices(mapped);

      const storedId = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      const stored = mapped.find((o: Office) => o.id === storedId);
      const defaultOffice = mapped.find((o: Office) => o.isDefault);
      const toSelect = stored || defaultOffice || mapped[0];

      if (toSelect) {
        setSelectedOffice(toSelect);
        localStorage.setItem(`${STORAGE_KEY}_${user.id}`, toSelect.id);
      }
    } catch (err) {
      console.error('Error loading offices:', err);
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
    const office = offices.find(o => o.id === officeId);
    if (office) {
      setSelectedOffice(office);
      if (user) localStorage.setItem(`${STORAGE_KEY}_${user.id}`, officeId);
    }
  }, [offices, user]);

  const createOffice = useCallback(async (data: { name: string; description?: string; color?: string }): Promise<Office> => {
    if (!user) throw new Error('Not authenticated');
    const { data: row, error } = await supabase
      .from('offices')
      .insert({ name: data.name, description: data.description || '', color: data.color || '#10b981', user_id: user.id, is_default: false })
      .select('*')
      .single();
    if (error) throw error;
    const office = mapRow(row);
    setOffices(prev => [...prev, office]);
    return office;
  }, [user]);

  const updateOffice = useCallback(async (id: string, data: { name?: string; description?: string; color?: string }) => {
    const { error } = await supabase
      .from('offices')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    setOffices(prev => prev.map(o => o.id === id ? { ...o, ...data } : o));
    setSelectedOffice(prev => prev?.id === id ? { ...prev, ...data } as Office : prev);
  }, []);

  const deleteOffice = useCallback(async (id: string) => {
    if (offices.length <= 1) throw new Error('Cannot delete the last office');
    const { error } = await supabase.from('offices').delete().eq('id', id);
    if (error) throw error;
    const remaining = offices.filter(o => o.id !== id);
    setOffices(remaining);
    if (selectedOffice?.id === id) {
      const next = remaining.find(o => o.isDefault) || remaining[0];
      if (next && user) {
        setSelectedOffice(next);
        localStorage.setItem(`${STORAGE_KEY}_${user.id}`, next.id);
      }
    }
  }, [offices, selectedOffice, user]);

  const setDefaultOffice = useCallback(async (id: string) => {
    if (!user) throw new Error('Not authenticated');
    await supabase.from('offices').update({ is_default: false }).eq('user_id', user.id);
    await supabase.from('offices').update({ is_default: true }).eq('id', id);
    setOffices(prev => prev.map(o => ({ ...o, isDefault: o.id === id })));
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
