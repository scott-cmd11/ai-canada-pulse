'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { RelationshipGraph } from '@/lib/types';

export default function GraphPage() {
  const [graph, setGraph] = useState<RelationshipGraph | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/graph');
        const data = await res.json();
        if (data.success) setGraph(data.graph);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const topNodes = useMemo(() => graph?.nodes.slice(0, 80) || [], [graph]);
  const topLinks = useMemo(() => graph?.links.slice(0, 120) || [], [graph]);

  return (
    <main className="relative z-10 mx-auto max-w-[1250px] space-y-4 px-4 py-6 md:px-8">
      <section className="panel p-5">
        <Link href="/" className="text-xs uppercase tracking-[0.2em] text-[var(--muted)] hover:text-[var(--accent)]">
          Back to overview
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Relationship Graph Workspace</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Entity-source-region links derived from latest intelligence items.
        </p>
      </section>

      {loading ? (
        <section className="panel p-8 text-center text-sm text-[var(--muted)]">Loading graph...</section>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            <Metric label="Nodes" value={String(graph?.nodes.length || 0)} />
            <Metric label="Links" value={String(graph?.links.length || 0)} />
            <Metric label="Avg Link Weight" value={avgWeight(topLinks)} />
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <article className="panel p-4">
              <h2 className="text-base font-semibold">Top Nodes</h2>
              <div className="mt-3 space-y-2">
                {topNodes.map((node) => (
                  <div key={node.id} className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-2">
                    <p className="text-sm font-medium">{node.label}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {node.type} - weight {node.weight}
                    </p>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel p-4">
              <h2 className="text-base font-semibold">Top Links</h2>
              <div className="mt-3 space-y-2">
                {topLinks.map((link) => (
                  <div key={`${link.source}-${link.target}`} className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-2">
                    <p className="text-xs text-[var(--muted)]">{link.source}</p>
                    <p className="text-sm font-medium">to {link.target}</p>
                    <p className="text-xs text-[var(--muted)]">weight {link.weight}</p>
                  </div>
                ))}
              </div>
            </article>
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
      <p className="mt-1 text-2xl font-semibold">{props.value}</p>
    </div>
  );
}

function avgWeight(links: RelationshipGraph['links']): string {
  if (!links.length) return '0.0';
  const sum = links.reduce((acc, link) => acc + link.weight, 0);
  return (sum / links.length).toFixed(1);
}
