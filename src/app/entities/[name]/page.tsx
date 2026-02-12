'use client';

import { useEffect, useState } from 'react';
import { EntitySummary } from '@/lib/types';

export default function EntityPage({ params }: { params: Promise<{ name: string }> }) {
  const [name, setName] = useState('');
  const [entity, setEntity] = useState<EntitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const resolved = await params;
      const decoded = decodeURIComponent(resolved.name || '');
      setName(decoded);

      try {
        const res = await fetch(`/api/entities/${encodeURIComponent(decoded)}`);
        const data = await res.json();
        if (data.success) {
          setEntity(data.entity);
          setError(null);
        } else {
          setError(data.error || 'Entity not found');
        }
      } catch (fetchError) {
        setError(String(fetchError));
      } finally {
        setLoading(false);
      }
    })();
  }, [params]);

  return (
    <main className="relative z-10 mx-auto max-w-[1200px] space-y-4 px-4 py-6 md:px-8">
      <section className="panel p-5">
        <h1 className="text-2xl font-semibold">Entity Intelligence: {name || '...'}</h1>
      </section>

      {loading ? (
        <section className="panel p-8 text-center text-sm text-[var(--muted)]">Loading entity profile...</section>
      ) : error || !entity ? (
        <section className="panel p-8 text-center text-sm text-rose-700">{error || 'Entity not found'}</section>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-4">
            <Metric label="Mentions" value={String(entity.count)} />
            <Metric label="Avg Relevance" value={entity.avgRelevance.toFixed(2)} />
            <Metric label="Top Source" value={entity.topSources[0]?.name || 'n/a'} />
            <Metric label="Latest" value={entity.latestAt ? new Date(entity.latestAt).toLocaleDateString() : 'n/a'} />
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <article className="panel p-4">
              <h2 className="text-base font-semibold">Type Mix</h2>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                {Object.entries(entity.byType).map(([type, count]) => (
                  <div key={type} className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2">
                    {type}: {count}
                  </div>
                ))}
              </div>
            </article>

            <article className="panel p-4">
              <h2 className="text-base font-semibold">Regional Presence</h2>
              <div className="mt-2 space-y-2">
                {entity.regions.map((region) => (
                  <div key={region.region} className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm">
                    {region.region}: {region.count}
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="panel p-4">
            <h2 className="text-base font-semibold">Recent Signals</h2>
            <div className="mt-3 space-y-2">
              {entity.recentItems.map((item) => (
                <article key={item.id} className="rounded-lg border border-[var(--line)] bg-white/70 p-3">
                  <p className="text-xs text-[var(--muted)]">
                    {item.type} - {item.source} - {new Date(item.publishedAt).toLocaleDateString()}
                  </p>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-1 block text-sm font-semibold hover:text-[var(--accent)]">
                    {item.title}
                  </a>
                  <p className="mt-1 text-xs text-[var(--muted)]">{item.description}</p>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function Metric(props: { label: string; value: string }) {
  return (
    <div className="panel p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{props.label}</p>
      <p className="mt-1 text-xl font-semibold">{props.value}</p>
    </div>
  );
}
