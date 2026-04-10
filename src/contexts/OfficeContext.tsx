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
const EDGE_FN_URL = 'https://cfuschemltpuelbqqnbh.supabase.co/functions/v1/offices-api';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmdXNjaGVtbHRwdWVsYnFxbmJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NDk4MjIsImV4cCI6MjA4MzAyNTgyMn0.dEy4682tKl4oT2HY7wOKkHZZ2rSWsq-8X68sA0RxezA';

const mapRow = (row: any): Office => ({
  id: row.id,
  name: row.name,
  description: row.description || '',
  color: row.color || '#10b981',
  isDefault: row.is_default,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

async function getAuthToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function callEdge(method: string, body?: Record<string, unknown>): Promise<any> {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(EDGE_FN_URL, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Apikey': ANON_KEY,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `Request failed: ${res.status}`);
  return json;
}

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
      let rows = await callEdge('GET');

      if (!Array.isArray(rows) || rows.length === 0) {
        rows = await callEdge('POST', { action: 'ensure-default' });
      }

      if (!Array.isArray(rows) || rows.length === 0) {
        setIsLoading(false);
        return;
      }

      const mapped: Office[] = rows.map(mapRow);
      setOffices(mapped);

      const storedId = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      const stored = mapped.find((o) => o.id === storedId);
      const defaultOffice = mapped.find((o) => o.isDefault);
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
    const office = offices.find((o) => o.id === officeId);
    if (office) {
      setSelectedOffice(office);
      if (user) localStorage.setItem(`${STORAGE_KEY}_${user.id}`, officeId);
    }
  }, [offices, user]);

  const createOffice = useCallback(async (data: { name: string; description?: string; color?: string }): Promise<Office> => {
    const row = await callEdge('POST', {
      name: data.name,
      description: data.description || '',
      color: data.color || '#10b981',
    });
    const office = mapRow(row);
    setOffices((prev) => [...prev, office]);
    return office;
  }, []);

  const updateOffice = useCallback(async (id: string, data: { name?: string; description?: string; color?: string }) => {
    await callEdge('PATCH', { id, ...data });
    setOffices((prev) => prev.map((o) => o.id === id ? { ...o, ...data } : o));
    setSelectedOffice((prev) => prev?.id === id ? { ...prev, ...data } as Office : prev);
  }, []);

  const deleteOffice = useCallback(async (id: string) => {
    if (offices.length <= 1) throw new Error('Cannot delete the last office');
    await callEdge('DELETE', { id });
    const remaining = offices.filter((o) => o.id !== id);
    setOffices(remaining);
    if (selectedOffice?.id === id) {
      const next = remaining.find((o) => o.isDefault) || remaining[0];
      if (next && user) {
        setSelectedOffice(next);
        localStorage.setItem(`${STORAGE_KEY}_${user.id}`, next.id);
      }
    }
  }, [offices, selectedOffice, user]);

  const setDefaultOffice = useCallback(async (id: string) => {
    await callEdge('POST', { action: 'set-default', id });
    setOffices((prev) => prev.map((o) => ({ ...o, isDefault: o.id === id })));
  }, []);

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
