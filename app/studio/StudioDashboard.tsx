"use client";

import { useMemo, useState } from "react";
import countyBoundaryData from "../county-market-boundaries.json";
import cityBoundaryData from "../city-market-boundaries.json";
import styles from "./StudioDashboard.module.css";

type Position = [number, number];
type Layer = "prospects" | "value" | "age" | "tam";
type Filter = "all" | "high-value" | "historic" | "priority";
type Geometry =
  | { type: "Polygon"; coordinates: Position[][] }
  | { type: "MultiPolygon"; coordinates: Position[][][] };
type BoundaryFeature = {
  properties: { MUNICIPALITY?: string; NHD_NAME?: string };
  geometry: Geometry;
};
type Market = {
  id: string;
  name: string;
  sourceName: string;
  kind: string;
  center: Position;
  labelLines: string[];
  homes: number;
  customRate: number;
  projectLow: number;
  projectHigh: number;
  homeValue: number;
  yearBuilt: number;
  ownerOccupied: number;
  score: number;
};

const markets: Market[] = [
  { id: "town-country", name: "Town & Country", sourceName: "TOWN & COUNTRY", kind: "Municipality", center: [-90.478, 38.637], labelLines: ["Town &", "Country"], homes: 4163, customRate: 18, projectLow: 12000, projectHigh: 28000, homeValue: 928500, yearBuilt: 1971, ownerOccupied: 94, score: 93 },
  { id: "frontenac", name: "Frontenac", sourceName: "FRONTENAC", kind: "Municipality", center: [-90.419, 38.626], labelLines: ["Frontenac"], homes: 1197, customRate: 22, projectLow: 12000, projectHigh: 30000, homeValue: 979800, yearBuilt: 1966, ownerOccupied: 91, score: 88 },
  { id: "kirkwood", name: "Kirkwood", sourceName: "KIRKWOOD", kind: "Municipality", center: [-90.415, 38.578], labelLines: ["Kirkwood"], homes: 12978, customRate: 28, projectLow: 8000, projectHigh: 20000, homeValue: 451400, yearBuilt: 1956, ownerOccupied: 72, score: 91 },
  { id: "ladue", name: "Ladue", sourceName: "LADUE", kind: "Municipality", center: [-90.378, 38.635], labelLines: ["Ladue"], homes: 3557, customRate: 30, projectLow: 13000, projectHigh: 32000, homeValue: 1056300, yearBuilt: 1954, ownerOccupied: 92, score: 97 },
  { id: "webster", name: "Webster Groves", sourceName: "WEBSTER GROVES", kind: "Municipality", center: [-90.351, 38.587], labelLines: ["Webster", "Groves"], homes: 9921, customRate: 32, projectLow: 9000, projectHigh: 22000, homeValue: 387600, yearBuilt: 1948, ownerOccupied: 79, score: 89 },
  { id: "clayton", name: "Clayton", sourceName: "CLAYTON", kind: "Municipality", center: [-90.332, 38.645], labelLines: ["Clayton"], homes: 6934, customRate: 24, projectLow: 10000, projectHigh: 26000, homeValue: 830000, yearBuilt: 1958, ownerOccupied: 59, score: 86 },
  { id: "university-city", name: "University City", sourceName: "UNIVERSITY CITY", kind: "Municipality", center: [-90.333, 38.667], labelLines: ["University", "City"], homes: 17841, customRate: 34, projectLow: 8000, projectHigh: 21000, homeValue: 306700, yearBuilt: 1945, ownerOccupied: 57, score: 84 },
  { id: "central-west-end", name: "Central West End", sourceName: "Central West End", kind: "City neighborhood", center: [-90.257, 38.642], labelLines: ["Central", "West End"], homes: 11598, customRate: 30, projectLow: 9000, projectHigh: 24000, homeValue: 349000, yearBuilt: 1936, ownerOccupied: 38, score: 81 },
  { id: "lafayette-square", name: "Lafayette Square", sourceName: "Lafayette Square", kind: "City neighborhood", center: [-90.215, 38.617], labelLines: ["Lafayette", "Square"], homes: 1330, customRate: 45, projectLow: 12000, projectHigh: 30000, homeValue: 412500, yearBuilt: 1904, ownerOccupied: 55, score: 85 },
  { id: "soulard", name: "Soulard", sourceName: "Soulard", kind: "City neighborhood", center: [-90.207, 38.602], labelLines: ["Soulard"], homes: 2762, customRate: 48, projectLow: 12000, projectHigh: 30000, homeValue: 327000, yearBuilt: 1898, ownerOccupied: 48, score: 83 },
];

const featureMap = new Map(
  [
    ...(countyBoundaryData.features as BoundaryFeature[]),
    ...(cityBoundaryData.features as BoundaryFeature[]),
  ].map((feature) => [feature.properties.MUNICIPALITY ?? feature.properties.NHD_NAME ?? "", feature]),
);

const TILE_ZOOM = 11;
const TILE_SIZE = 256;
const WORLD_SIZE = TILE_SIZE * 2 ** TILE_ZOOM;
const BOUNDS = { west: -90.545, east: -90.18, north: 38.705, south: 38.525 };

function project([longitude, latitude]: Position): Position {
  const latitudeRadians = latitude * Math.PI / 180;
  return [
    ((longitude + 180) / 360) * WORLD_SIZE,
    ((1 - Math.log(Math.tan(latitudeRadians) + 1 / Math.cos(latitudeRadians)) / Math.PI) / 2) * WORLD_SIZE,
  ];
}

const northWest = project([BOUNDS.west, BOUNDS.north]);
const southEast = project([BOUNDS.east, BOUNDS.south]);
const VIEW = { x: northWest[0], y: northWest[1], width: southEast[0] - northWest[0], height: southEast[1] - northWest[1] };

const tiles = (() => {
  const result: { x: number; y: number }[] = [];
  for (let x = Math.floor(VIEW.x / TILE_SIZE) - 1; x <= Math.floor((VIEW.x + VIEW.width) / TILE_SIZE) + 1; x += 1) {
    for (let y = Math.floor(VIEW.y / TILE_SIZE) - 1; y <= Math.floor((VIEW.y + VIEW.height) / TILE_SIZE) + 1; y += 1) result.push({ x, y });
  }
  return result;
})();

function geometryPath(geometry: Geometry) {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.flatMap((polygon) => polygon).map((ring) => ring.map((point, index) => {
    const [x, y] = project(point);
    return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ") + " Z").join(" ");
}

const prospects = (market: Market) => Math.round(market.homes * market.customRate / 100);
const tamLow = (market: Market) => prospects(market) * market.projectLow;
const tamHigh = (market: Market) => prospects(market) * market.projectHigh;
const money = (value: number) => value >= 1000000 ? `$${(value / 1000000).toFixed(value >= 10000000 ? 0 : 1)}M` : `$${Math.round(value / 1000)}K`;
const moneyRange = (low: number, high: number) => `${money(low)}–${money(high)}`;

function fillFor(market: Market, layer: Layer) {
  if (layer === "value") return market.homeValue >= 800000 ? "#86658d" : market.homeValue >= 425000 ? "#af86ae" : "#d7bdd5";
  if (layer === "age") return market.yearBuilt < 1940 ? "#ef6f75" : market.yearBuilt < 1960 ? "#f3a089" : "#f2c8a8";
  if (layer === "tam") return tamHigh(market) >= 100000000 ? "#05a3b5" : tamHigh(market) >= 50000000 ? "#5bc0c7" : "#a8d9d8";
  return prospects(market) >= 3500 ? "#05a3b5" : prospects(market) >= 1500 ? "#efa73f" : "#e8bf76";
}

function MiniShape({ market, color }: { market: Market; color: string }) {
  const feature = featureMap.get(market.sourceName);
  if (!feature) return null;
  const [cx, cy] = project(market.center);
  const size = market.id === "soulard" ? 16 : 32;
  return (
    <svg className={styles.miniShape} viewBox={`${cx - size} ${cy - size} ${size * 2} ${size * 2}`} aria-hidden="true">
      <path d={geometryPath(feature.geometry)} fill={color} fillRule="evenodd" />
    </svg>
  );
}

const filterOptions: { id: Filter; label: string }[] = [
  { id: "all", label: "All areas" },
  { id: "high-value", label: "$500k+" },
  { id: "historic", label: "Pre-1950" },
  { id: "priority", label: "Score 85+" },
];

const layerOptions: { id: Layer; label: string }[] = [
  { id: "prospects", label: "Prospects" },
  { id: "value", label: "Home value" },
  { id: "age", label: "Home age" },
  { id: "tam", label: "TAM" },
];

export default function StudioDashboard({ viewerEmail }: { viewerEmail: string }) {
  const [selectedId, setSelectedId] = useState("ladue");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [layer, setLayer] = useState<Layer>("prospects");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [briefOpen, setBriefOpen] = useState(false);

  const visible = useMemo(() => markets.filter((market) => {
    const matchesQuery = market.name.toLowerCase().includes(query.trim().toLowerCase());
    if (!matchesQuery) return false;
    if (filter === "high-value") return market.homeValue >= 500000;
    if (filter === "historic") return market.yearBuilt < 1950;
    if (filter === "priority") return market.score >= 85;
    return true;
  }), [filter, query]);
  const visibleIds = useMemo(() => new Set(visible.map((market) => market.id)), [visible]);
  const selected = markets.find((market) => market.id === selectedId) ?? markets[0];
  const hovered = markets.find((market) => market.id === hoveredId) ?? null;
  const totalProspects = visible.reduce((sum, market) => sum + prospects(market), 0);
  const totalHomes = visible.reduce((sum, market) => sum + market.homes, 0);
  const totalTamLow = visible.reduce((sum, market) => sum + tamLow(market), 0);
  const totalTamHigh = visible.reduce((sum, market) => sum + tamHigh(market), 0);
  const ranked = [...visible].sort((a, b) => prospects(b) - prospects(a));
  const maxProspects = Math.max(...ranked.map(prospects), 1);
  const maxValue = Math.max(...ranked.map((market) => market.homeValue), 1);
  const cardMarkets = ["ladue", "kirkwood", "central-west-end", "soulard"].map((id) => markets.find((market) => market.id === id)!).filter(Boolean);

  return (
    <main className={styles.shell}>
      <aside className={styles.rail} aria-label="Version and dashboard navigation">
        <a className={styles.railLogo} href="/studio" aria-label="Version 2 home"><span /><span /><span /></a>
        <a href="/" title="Open Version 1">V1</a>
        <a className={styles.railActive} href="#market-map" title="Market map">◎</a>
        <a href="#prospects" title="Prospect ranking">▦</a>
        <button onClick={() => setBriefOpen(true)} title="Territory brief">□</button>
        <a className={styles.railAvatar} href="/signout-with-chatgpt?return_to=%2Fstudio" title={`Signed in as ${viewerEmail}`}>{viewerEmail.slice(0, 2).toUpperCase()}</a>
      </aside>

      <div className={styles.page}>
        <header className={styles.header}>
          <div><p>GATEWAY GROWTH · VERSION 2</p><h1>St. Louis Location Studio</h1><span>Window replacement opportunity by target market</span></div>
          <div className={styles.layers} aria-label="Map metric">
            {layerOptions.map((option) => <button key={option.id} className={layer === option.id ? styles.activeLayer : ""} onClick={() => setLayer(option.id)}>{option.label}</button>)}
          </div>
        </header>

        <section className={styles.summaryStrip} aria-label="Portfolio summary">
          <article><span>Potential prospects</span><strong>{totalProspects.toLocaleString()}</strong><small>{visible.length} visible areas</small></article>
          <article><span>Housing units</span><strong>{totalHomes.toLocaleString()}</strong><small>{totalHomes ? (totalProspects / totalHomes * 100).toFixed(1) : "0.0"}% modeled fit</small></article>
          <article><span>Full-stock TAM</span><strong>{moneyRange(totalTamLow, totalTamHigh)}</strong><small>planning range</small></article>
        </section>

        <div className={styles.dashboardGrid}>
          <div className={styles.leftColumn}>
            <section className={styles.marketCards} aria-label="Featured markets">
              {cardMarkets.map((market, index) => (
                <button key={market.id} className={`${styles.marketCard} ${selected.id === market.id ? styles.selectedCard : ""}`} onClick={() => setSelectedId(market.id)}>
                  <div><span>{market.name}</span><MiniShape market={market} color={["#a57ca5", "#efb358", "#ef7077", "#09a7b7"][index]} /></div>
                  <div className={styles.cardMetrics}><strong>{prospects(market).toLocaleString()}</strong><small>potential prospects</small><b>{market.customRate}%</b><em>custom-fit share</em></div>
                </button>
              ))}
            </section>

            <section className={styles.mapCard} id="market-map">
              <header>
                <div><h2>Opportunity map</h2><span>Official municipal and city-neighborhood boundaries</span></div>
                <label className={styles.search}><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find an area" /></label>
              </header>
              <div className={styles.filterRow}>
                {filterOptions.map((option) => <button key={option.id} className={filter === option.id ? styles.activeFilter : ""} onClick={() => setFilter(option.id)}>{option.label}</button>)}
                <span>{visible.length} areas</span>
              </div>
              <div className={styles.mapStage}>
                <svg className={styles.map} viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.width} ${VIEW.height}`} preserveAspectRatio="xMidYMid meet" aria-label="Interactive St. Louis target-market map">
                  <g className={styles.tiles} aria-hidden="true">
                    {tiles.map((tile) => <image key={`${tile.x}-${tile.y}`} href={`https://tile.openstreetmap.org/${TILE_ZOOM}/${tile.x}/${tile.y}.png`} x={tile.x * TILE_SIZE} y={tile.y * TILE_SIZE} width={TILE_SIZE} height={TILE_SIZE} />)}
                  </g>
                  <rect className={styles.mapWash} x={VIEW.x} y={VIEW.y} width={VIEW.width} height={VIEW.height} />
                  {markets.map((market) => {
                    const feature = featureMap.get(market.sourceName);
                    if (!feature) return null;
                    const [x, y] = project(market.center);
                    const isVisible = visibleIds.has(market.id);
                    return (
                      <g key={market.id} className={`${styles.boundary} ${selected.id === market.id ? styles.selectedBoundary : ""} ${!isVisible ? styles.hiddenBoundary : ""}`} role="button" tabIndex={isVisible ? 0 : -1} aria-label={`${market.name}: ${prospects(market).toLocaleString()} potential prospects`} onMouseEnter={() => isVisible && setHoveredId(market.id)} onMouseLeave={() => setHoveredId(null)} onFocus={() => isVisible && setHoveredId(market.id)} onBlur={() => setHoveredId(null)} onClick={() => isVisible && setSelectedId(market.id)} onKeyDown={(event) => { if (isVisible && (event.key === "Enter" || event.key === " ")) setSelectedId(market.id); }}>
                        <path d={geometryPath(feature.geometry)} fill={fillFor(market, layer)} fillRule="evenodd" />
                        <text x={x} y={y} textAnchor="middle">{market.labelLines.map((line, lineIndex) => <tspan key={line} x={x} dy={lineIndex ? 6 : 0}>{line}</tspan>)}</text>
                      </g>
                    );
                  })}
                </svg>
                {hovered && <div className={styles.hoverCard}><b>{hovered.name}</b><span>{prospects(hovered).toLocaleString()} prospects</span><small>{money(hovered.homeValue)} median value · built {hovered.yearBuilt}</small></div>}
                <div className={styles.mapLegend}><i /><span>Lower</span><em /><span>Higher</span></div>
                <small className={styles.attribution}>© OpenStreetMap contributors · St. Louis City & County GIS</small>
              </div>
              <footer className={styles.selectedStrip}>
                <div><span>Selected market</span><strong>{selected.name}</strong></div>
                <div><span>Prospects</span><strong>{prospects(selected).toLocaleString()}</strong></div>
                <div><span>Median value</span><strong>{money(selected.homeValue)}</strong></div>
                <div><span>Full-stock TAM</span><strong>{moneyRange(tamLow(selected), tamHigh(selected))}</strong></div>
                <button onClick={() => setBriefOpen(true)}>Build brief →</button>
              </footer>
            </section>
          </div>

          <aside className={styles.analytics} id="prospects">
            <header><span>NEIGHBORHOOD DRILL-DOWN</span><h2>Where the prospects are</h2><p>Select an area to update the map and market brief.</p></header>
            <div className={styles.metricChart}>
              <div><span>Potential prospects</span><b>{totalProspects.toLocaleString()}</b></div>
              {ranked.map((market) => <button key={market.id} onClick={() => setSelectedId(market.id)}><span>{market.name}</span><i><em style={{ width: `${prospects(market) / maxProspects * 100}%` }} /></i><b>{prospects(market).toLocaleString()}</b></button>)}
            </div>
            <div className={`${styles.metricChart} ${styles.valueChart}`}>
              <div><span>Median home value</span><b>{money(selected.homeValue)}</b></div>
              {ranked.slice(0, 6).map((market) => <button key={market.id} onClick={() => setSelectedId(market.id)}><span>{market.name}</span><i><em style={{ width: `${market.homeValue / maxValue * 100}%` }} /></i><b>{money(market.homeValue)}</b></button>)}
            </div>
            <section className={styles.methodNote}><span>MODEL NOTE</span><p>Prospects are estimated custom or specialty-fit housing units—not identified homeowners or guaranteed buyers.</p></section>
          </aside>
        </div>
      </div>

      {briefOpen && (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setBriefOpen(false); }}>
          <section className={styles.brief} role="dialog" aria-modal="true" aria-labelledby="studio-brief-title">
            <header><div><span>TERRITORY BRIEF</span><h2 id="studio-brief-title">{selected.name}</h2><p>{selected.kind} · Opportunity score {selected.score}/100</p></div><button onClick={() => setBriefOpen(false)} aria-label="Close brief">×</button></header>
            <div className={styles.briefMetrics}><div><span>Potential prospects</span><strong>{prospects(selected).toLocaleString()}</strong></div><div><span>Custom-fit share</span><strong>{selected.customRate}%</strong></div><div><span>Median home value</span><strong>{money(selected.homeValue)}</strong></div><div><span>TAM range</span><strong>{moneyRange(tamLow(selected), tamHigh(selected))}</strong></div></div>
            <article><span>Campaign direction</span><h3>{selected.yearBuilt < 1940 ? "Historic character, modern comfort." : selected.homeValue >= 800000 ? "Craftsmanship worthy of the home." : "Comfort and curb appeal, clearly valued."}</h3><p>Lead with custom fit, careful installation, and a market-specific offer. Use the first 30 days to test direct mail and paid search, then concentrate spend on the message producing the strongest qualified-appointment rate.</p></article>
            <footer><button onClick={() => setBriefOpen(false)}>Back to dashboard</button><button onClick={() => window.print()}>Print brief</button></footer>
          </section>
        </div>
      )}
    </main>
  );
}
