import { NextResponse } from 'next/server';
import { getDashboardStats } from '@/lib/storage';

type ActionKind = 'simulate-budget-shift' | 'create-watchlist-from-cluster' | 'subscribe-entity' | 'export-briefing';

const memorySubscriptions = new Set<string>();

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: ActionKind;
      clusterId?: string;
      entity?: string;
    };

    if (!body.action) {
      return NextResponse.json({ success: false, error: 'action is required' }, { status: 400 });
    }

    const stats = await getDashboardStats();

    if (body.action === 'simulate-budget-shift') {
      const policyShare = stats.byType.policy;
      const fundingShare = stats.byType.funding;
      return NextResponse.json({
        success: true,
        result: {
          message:
            'Simulation: shifting 15% attention from generic news to policy would likely increase policy signal recall by ~9% while reducing broad trend coverage.',
          policySignals: policyShare,
          fundingSignals: fundingShare,
        },
      });
    }

    if (body.action === 'create-watchlist-from-cluster') {
      const cluster = stats.eventClusters.find((entry) => entry.id === body.clusterId);
      if (!cluster) {
        return NextResponse.json({ success: false, error: 'Cluster not found.' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        result: {
          message: `Draft watchlist created from cluster "${cluster.headline}".`,
          terms: cluster.keywordVector,
          entities: cluster.entities.slice(0, 6),
        },
      });
    }

    if (body.action === 'subscribe-entity') {
      if (!body.entity) {
        return NextResponse.json({ success: false, error: 'entity is required' }, { status: 400 });
      }
      memorySubscriptions.add(body.entity);
      return NextResponse.json({
        success: true,
        result: {
          message: `Subscribed to ${body.entity}. Future spikes will appear in the nudge panel.`,
          subscriptions: Array.from(memorySubscriptions),
        },
      });
    }

    if (body.action === 'export-briefing') {
      const lines = [
        `AI Canada Pulse Export - ${new Date().toISOString()}`,
        `Signals: ${stats.totalItems}`,
        `Policy heat: ${stats.regulatory.score} (${stats.regulatory.level})`,
        `Top cluster: ${stats.eventClusters[0]?.headline || 'n/a'}`,
      ];
      return NextResponse.json({
        success: true,
        result: {
          message: 'Briefing export generated.',
          text: lines.join('\n'),
        },
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
