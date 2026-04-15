"use client"

import { useEffect, useRef, useState } from "react"
import type { Map as LeafletMap } from "leaflet"
import { DATA_CENTRES, TYPE_COLOURS, TYPE_LABELS, type DataCentreType } from "@/lib/datacentres-data"

const ALL_TYPES: DataCentreType[] = ["hyperscaler", "colo", "telco", "hpc", "government"]

const TILE_LIGHT = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
const TILE_DARK  = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'

export default function DataCentreMapClient() {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletRef = useRef<LeafletMap | null>(null)
  const tileLayerRef = useRef<ReturnType<typeof import("leaflet")["tileLayer"]> | null>(null)
  const markersLayerRef = useRef<ReturnType<typeof import("leaflet")["layerGroup"]> | null>(null)

  const [isDark, setIsDark] = useState(false)
  const [activeTypes, setActiveTypes] = useState<Set<DataCentreType>>(new Set(ALL_TYPES))

  // Track dark mode
  useEffect(() => {
    const read = () => setIsDark(document.documentElement.getAttribute("data-theme") === "dark")
    read()
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })
    return () => observer.disconnect()
  }, [])

  // Initialise Leaflet map once
  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return

    // Dynamic import keeps Leaflet off the SSR bundle
    import("leaflet").then((L) => {
      if (!mapRef.current || leafletRef.current) return

      // Fit to the bounding box of all data centres so every marker is visible
      const lats = DATA_CENTRES.map(d => d.lat)
      const lngs = DATA_CENTRES.map(d => d.lng)
      const bounds = L.latLngBounds(
        [Math.min(...lats) - 1, Math.min(...lngs) - 2],
        [Math.max(...lats) + 2, Math.max(...lngs) + 2],
      )

      const map = L.map(mapRef.current, {
        zoomControl: false,
        maxBounds: L.latLngBounds([35, -145], [75, -45]),
        maxBoundsViscosity: 0.8,
      })
      map.fitBounds(bounds, { padding: [24, 24] })
      leafletRef.current = map

      L.control.zoom({ position: "bottomright" }).addTo(map)

      const tile = L.tileLayer(TILE_LIGHT, { attribution: ATTRIBUTION })
      tile.addTo(map)
      tileLayerRef.current = tile

      const layer = L.layerGroup().addTo(map)
      markersLayerRef.current = layer

      // Draw markers
      drawMarkers(L, layer, new Set(ALL_TYPES))

      // Leaflet calculates tile viewport at init time — if the container
      // wasn't fully laid out yet (dynamic import delay), tiles won't fill
      // the edges. invalidateSize() forces a recalculation.
      setTimeout(() => map.invalidateSize(), 100)

      // Also handle any future container resizes
      const ro = new ResizeObserver(() => map.invalidateSize())
      if (mapRef.current) ro.observe(mapRef.current)
    })

    return () => {
      leafletRef.current?.remove()
      leafletRef.current = null
      tileLayerRef.current = null
      markersLayerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Swap tile layer when theme changes
  useEffect(() => {
    if (!leafletRef.current || !tileLayerRef.current) return
    import("leaflet").then((L) => {
      if (!leafletRef.current) return
      tileLayerRef.current?.remove()
      const tile = L.tileLayer(isDark ? TILE_DARK : TILE_LIGHT, { attribution: ATTRIBUTION })
      tile.addTo(leafletRef.current)
      tileLayerRef.current = tile
    })
  }, [isDark])

  // Redraw markers when filter changes
  useEffect(() => {
    const layer = markersLayerRef.current
    if (!layer) return
    import("leaflet").then((L) => {
      layer.clearLayers()
      drawMarkers(L, layer, activeTypes)
    })
  }, [activeTypes])

  function drawMarkers(
    L: typeof import("leaflet"),
    layer: ReturnType<typeof L.layerGroup>,
    types: Set<DataCentreType>
  ) {
    DATA_CENTRES.filter(dc => types.has(dc.type)).forEach((dc) => {
      const colour = TYPE_COLOURS[dc.type]
      const radius = dc.type === "hyperscaler" ? 9 : 6

      const circle = L.circleMarker([dc.lat, dc.lng], {
        radius,
        color: colour,
        fillColor: colour,
        fillOpacity: 0.85,
        weight: 1.5,
      })

      circle.bindPopup(`
        <div style="min-width:180px;font-family:inherit">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${colour};margin-bottom:2px">
            ${TYPE_LABELS[dc.type]}
          </div>
          <div style="font-weight:600;line-height:1.3;font-size:13px">
            ${dc.name}
          </div>
          <div style="margin-top:4px;font-size:12px;opacity:0.75">
            ${dc.operator}
          </div>
          <div style="margin-top:2px;font-size:11px;opacity:0.5">
            ${dc.city}, ${dc.province}
          </div>
        </div>
      `)

      circle.addTo(layer)
    })
  }

  function toggleType(type: DataCentreType) {
    setActiveTypes(prev => {
      const next = new Set(prev)
      next.has(type) ? next.delete(type) : next.add(type)
      return next
    })
  }

  const countByType = ALL_TYPES.reduce<Record<DataCentreType, number>>((acc, t) => {
    acc[t] = DATA_CENTRES.filter(dc => dc.type === t).length
    return acc
  }, {} as Record<DataCentreType, number>)

  const visibleCount = DATA_CENTRES.filter(dc => activeTypes.has(dc.type)).length

  return (
    <div className="flex flex-col gap-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
          Filter:
        </span>
        {ALL_TYPES.map(type => {
          const active = activeTypes.has(type)
          return (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-opacity"
              style={{
                borderColor: active ? TYPE_COLOURS[type] : "var(--border-subtle)",
                color: active ? TYPE_COLOURS[type] : "var(--text-muted)",
                background: active
                  ? `color-mix(in srgb, ${TYPE_COLOURS[type]} 10%, var(--surface-primary))`
                  : "var(--surface-primary)",
                opacity: active ? 1 : 0.5,
              }}
            >
              <span className="inline-block h-2 w-2 rounded-full flex-shrink-0" style={{ background: TYPE_COLOURS[type] }} />
              {TYPE_LABELS[type]}
              <span className="ml-0.5 opacity-60">({countByType[type]})</span>
            </button>
          )
        })}
        <span className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>
          Showing {visibleCount} of {DATA_CENTRES.length}
        </span>
      </div>

      {/* Map container */}
      <div
        className="overflow-hidden rounded-xl border"
        style={{ borderColor: "var(--border-subtle)", height: "560px" }}
      >
        <style>{`
          .leaflet-popup-content-wrapper {
            background: var(--surface-primary, #fff);
            color: var(--text-primary, #000);
            border: 1px solid var(--border-subtle, #e5e7eb);
            border-radius: 10px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.15);
          }
          .leaflet-popup-tip { background: var(--surface-primary, #fff); }
          .leaflet-popup-close-button { color: var(--text-muted, #888) !important; }
          .leaflet-container { font-family: var(--font-ui, sans-serif); }
          .leaflet-attribution-flag { display: none !important; }
        `}</style>
        <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
      </div>

      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
        Coordinates are approximate city-level. Includes major cloud regions, colocation facilities, telecom data centres, and HPC/compute farms.
        Sources: operator websites, DatacenterMap.com, Baxtel, public announcements.
      </p>
    </div>
  )
}
