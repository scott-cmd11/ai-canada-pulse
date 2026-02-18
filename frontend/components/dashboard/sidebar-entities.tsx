"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import type {
  EntitiesBreakdownResponse,
  EntityMomentumResponse,
  JurisdictionsBreakdownResponse,
  Mode,
  TagsBreakdownResponse,
} from "../../lib/types";

interface SidebarEntitiesProps {
  mode: Mode;
  panelVisibility: Record<string, boolean>;
  researchDrawerOpen: boolean;
  entityMomentum: EntityMomentumResponse | null;
  jurisdictionsBreakdown: JurisdictionsBreakdownResponse | null;
  entitiesBreakdown: EntitiesBreakdownResponse | null;
  tagsBreakdown: TagsBreakdownResponse | null;
  onSetSearch: (q: string) => void;
  onSetMode: (m: Mode) => void;
}

export const SidebarEntities = memo(function SidebarEntities({
  mode,
  panelVisibility,
  researchDrawerOpen,
  entityMomentum,
  jurisdictionsBreakdown,
  entitiesBreakdown,
  tagsBreakdown,
  onSetSearch,
  onSetMode,
}: SidebarEntitiesProps) {
  const t = useTranslations();

  if (mode !== "research" || !researchDrawerOpen) return null;

  return (
    <>
      {/* Entity Momentum */}
      {panelVisibility.entityMomentum && (
        <section className="elevated p-3">
          <h3 className="mb-2 text-subheading text-textSecondary">
            {t("entityMomentum.title")}
          </h3>
          <div className="space-y-2 text-caption">
            {(entityMomentum?.entities ?? []).slice(0, 8).map((item) => (
              <button
                key={`entity-${item.name}`}
                onClick={() => {
                  onSetSearch(item.name);
                  onSetMode("research");
                }}
                className="btn-ghost flex w-full items-center justify-between text-left"
              >
                <span className="truncate pr-2">{item.name}</span>
                <span
                  style={{
                    color:
                      item.change >= 0
                        ? "var(--research)"
                        : "var(--incidents)",
                  }}
                >
                  {item.change >= 0 ? "+" : ""}
                  {item.change} ({item.delta_percent.toFixed(1)}%)
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Jurisdictions */}
      {panelVisibility.jurisdictions && (
        <section className="elevated p-3">
          <h3 className="mb-2 text-subheading text-textSecondary">
            {t("sources.jurisdictions")}
          </h3>
          <div className="space-y-1 text-caption">
            {(jurisdictionsBreakdown?.jurisdictions ?? [])
              .slice(0, 8)
              .map((item) => (
                <div key={item.name} className="flex justify-between">
                  <span className="truncate pr-2">{item.name}</span>
                  <span>{item.count}</span>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Entities */}
      {panelVisibility.entities && (
        <section className="elevated p-3">
          <h3 className="mb-2 text-subheading text-textSecondary">
            {t("sources.entities")}
          </h3>
          <div className="space-y-1 text-caption">
            {(entitiesBreakdown?.entities ?? []).slice(0, 8).map((item) => (
              <div key={item.name} className="flex justify-between">
                <span className="truncate pr-2">{item.name}</span>
                <span>{item.count}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tags */}
      {panelVisibility.tags && (
        <section className="elevated p-3">
          <h3 className="mb-2 text-subheading text-textSecondary">
            {t("sources.tags")}
          </h3>
          <div className="flex flex-wrap gap-2 text-caption">
            {(tagsBreakdown?.tags ?? []).slice(0, 14).map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  onSetSearch(item.name);
                  onSetMode("research");
                }}
                className="btn-ghost"
              >
                {item.name} ({item.count})
              </button>
            ))}
          </div>
        </section>
      )}
    </>
  );
});
