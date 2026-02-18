'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSidebar, type SidebarTab } from './sidebar-context';
import { CollaborationNote } from '@/lib/types';

const TABS: { id: SidebarTab; label: string }[] = [
  { id: 'agent', label: 'Agent' },
  { id: 'simulate', label: 'Simulate' },
  { id: 'notes', label: 'Notes' },
  { id: 'settings', label: 'Settings' },
];

export function CommandSidebarShell() {
  const { sidebarOpen, setSidebarOpen, sidebarTab, setSidebarTab } = useSidebar();
  const [notes, setNotes] = useState<CollaborationNote[]>([]);
  const [assistantReply, setAssistantReply] = useState('');
  const [actionResult, setActionResult] = useState('');
  const [agentInput, setAgentInput] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const saved = window.localStorage.getItem('dashboard-theme') as 'light' | 'dark' | null;
    if (saved === 'light' || saved === 'dark') setTheme(saved);
  }, []);

  useEffect(() => {
    window.localStorage.setItem('dashboard-theme', theme);
    document.documentElement.classList.toggle('theme-dark', theme === 'dark');
  }, [theme]);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch('/api/notes');
      const data = await res.json();
      if (data.success) setNotes(data.notes);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (sidebarOpen) fetchNotes();
  }, [sidebarOpen, fetchNotes]);

  const onRunAssistant = useCallback(async (input: string) => {
    if (!input.trim()) return;
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      if (!data.success) {
        setAssistantReply(data.error || 'Assistant failed.');
        return;
      }
      const response = data.response;
      setAssistantReply(response.reply + (response.suggestion ? ` ${response.suggestion}` : ''));
      if (response.filters) {
        const params = new URLSearchParams();
        if (response.filters.type) params.set('type', response.filters.type);
        if (response.filters.watchlist) params.set('watchlist', response.filters.watchlist);
        if (response.filters.region) params.set('region', response.filters.region);
        if (response.filters.source) params.set('source', response.filters.source);
        if (response.filters.query) params.set('q', response.filters.query);
        const qs = params.toString();
        if (qs) window.location.href = `/?${qs}`;
      }
    } catch (error) {
      setAssistantReply(String(error));
    }
  }, []);

  const onRunAction = useCallback(async (
    action: 'simulate-budget-shift' | 'create-watchlist-from-cluster' | 'subscribe-entity' | 'export-briefing',
    payload?: Record<string, string>,
  ) => {
    try {
      const res = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...(payload || {}) }),
      });
      const data = await res.json();
      if (data.success) {
        const message = data.result?.message || 'Action complete.';
        const extra = data.result?.text ? `\n\n${data.result.text}` : '';
        setActionResult(`${message}${extra}`);
      } else {
        setActionResult(data.error || 'Action failed.');
      }
    } catch (error) {
      setActionResult(String(error));
    }
  }, []);

  const onPostNote = useCallback(async (targetType: 'entity' | 'cluster', targetId: string, text: string) => {
    if (!text.trim()) return;
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, text }),
      });
      const data = await res.json();
      if (data.success) {
        setActionResult('Annotation saved.');
        await fetchNotes();
      }
    } catch (error) {
      setActionResult(String(error));
    }
  }, [fetchNotes]);

  if (!sidebarOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setSidebarOpen(false)} />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-[360px] max-w-[90vw] flex-col border-l border-[var(--line)] bg-[var(--panel-solid)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
          <h2 className="text-sm font-semibold">Command Panel</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-2 py-1 text-xs text-[var(--muted)] transition hover:bg-white"
          >
            Close
          </button>
        </div>

        <div className="flex border-b border-[var(--line)]">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSidebarTab(tab.id)}
              className={`flex-1 px-2 py-2.5 text-[11px] uppercase tracking-[0.14em] transition ${
                sidebarTab === tab.id
                  ? 'border-b-2 border-[var(--accent)] text-[var(--text)]'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {sidebarTab === 'agent' && (
            <div className="space-y-3">
              <p className="text-xs text-[var(--muted)]">Ask a question to filter and explore signals.</p>
              <div className="flex gap-2">
                <input
                  value={agentInput}
                  onChange={(e) => setAgentInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { onRunAssistant(agentInput); } }}
                  placeholder="e.g. show policy risk in Ontario"
                  className="min-w-0 flex-1 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm"
                />
                <button
                  onClick={() => onRunAssistant(agentInput)}
                  className="rounded-lg border border-[var(--line)] bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white"
                >
                  Go
                </button>
              </div>
              {assistantReply && <p className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-2 text-sm text-[var(--muted)]">{assistantReply}</p>}
            </div>
          )}

          {sidebarTab === 'simulate' && (
            <div className="space-y-3">
              <p className="text-xs text-[var(--muted)]">Run safe simulations against current intelligence data.</p>
              <button
                onClick={() => onRunAction('simulate-budget-shift')}
                className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] transition hover:bg-white"
              >
                Run Budget Shift Simulation
              </button>
              {actionResult && (
                <pre className="max-h-60 overflow-auto rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-2 text-xs text-[var(--muted)]">{actionResult}</pre>
              )}
            </div>
          )}

          {sidebarTab === 'notes' && (
            <div className="space-y-3">
              <p className="text-xs text-[var(--muted)]">Collaboration annotations on entities and clusters.</p>
              <button
                onClick={() => {
                  const targetId = window.prompt('Entity or cluster name:');
                  if (!targetId) return;
                  const text = window.prompt('Annotation text:');
                  if (!text) return;
                  onPostNote('entity', targetId, text);
                }}
                className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] transition hover:bg-white"
              >
                Add Note
              </button>
              <div className="space-y-2">
                {notes.slice(0, 20).map((note) => (
                  <div key={note.id} className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-2">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
                      {note.targetType} - {note.targetId}
                    </p>
                    <p className="mt-1 text-xs">{note.text}</p>
                  </div>
                ))}
                {notes.length === 0 && <p className="text-xs text-[var(--muted)]">No notes yet.</p>}
              </div>
            </div>
          )}

          {sidebarTab === 'settings' && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-[var(--muted)]">Theme</p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${
                      theme === 'light' ? 'border-[var(--accent)] bg-[var(--accent)] text-white' : 'border-[var(--line)] bg-[var(--surface-2)] text-[var(--muted)]'
                    }`}
                  >
                    Light
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${
                      theme === 'dark' ? 'border-[var(--accent)] bg-[var(--accent)] text-white' : 'border-[var(--line)] bg-[var(--surface-2)] text-[var(--muted)]'
                    }`}
                  >
                    Dark
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
