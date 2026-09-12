Homes(market, valueSegment), 0);
  const totalCustom = visible.reduce((sum, market) => sum + segmentCustomHomes(market, valueSegment), 0);
  const totalTamLow = visible.reduce((sum, market) => sum + segmentTamLow(market, valueSegment), 0);
  const totalTamHigh = visible.reduce((sum, market) => sum + segmentTamHigh(market, valueSegment), 0);
  const ranked = [...visible].sort((a, b) => segmentCustomHomes(b, valueSegment) - segmentCustomHomes(a, valueSegment) || b.score - a.score);
  const ageChartMarketId = ageMarketId === "all" || markets.some((market) => market.id === ageMarketId) ? ageMarketId : "all";
  const ageHistogram = ageBins.map((bin) => ({
    ...bin,
    markets: markets.filter((market) => market.yearBuilt >= bin.start && market.yearBuilt <= bin.end),
  }));
  const largestAgeBin = Math.max(1, ...ageHistogram.map((bin) => bin.markets.length));
  const housingUnitHistogram = housingAgeBins.map((bin, index) => ({
    ...bin,
    units: (ageChartMarketId === "all" ? markets : markets.filter((market) => market.id === ageChartMarketId))
      .reduce((sum, market) => sum + (housingAgeByMarket[market.id]?.[index] ?? 0), 0),
  }));
  const largestHousingUnitBin = Math.max(1, ...housingUnitHistogram.map((bin) => bin.units));
  const housingUnitHistogramTotal = housingUnitHistogram.reduce((sum, bin) => sum + bin.units, 0);
  const prospectBreakdown = [...visible].sort((a, b) => segmentCustomHomes(b, valueSegment) - segmentCustomHomes(a, valueSegment));
  const largestProspectPool = prospectBreakdown[0] ? segmentCustomHomes(prospectBreakdown[0], valueSegment) : 0;
  const largestSegmentPool = Math.max(1, ...markets.map((market) => segmentCustomHomes(market, valueSegment)));
  const currentView = useMemo(
    () => fitViewToAspect(viewFor(zoom, selectedMarket), mapAspect),
    [mapAspect, selectedMarket, zoom],
  );
  const mapTiles = useMemo(
    () => tilesForView(currentView),
    [currentView],
  );
  const projectedPreview = previewMarket ? project(previewMarket.center) : null;
  const previewX = projectedPreview ? ((projectedPreview[0] - currentView.x) / currentView.width) * 100 : 0;
  const previewY = projectedPreview ? ((projectedPreview[1] - currentView.y) / currentView.height) * 100 : 0;
  const tooltipStyle: CSSProperties = {
    ...(previewX > 58 ? { right: 14 } : { left: `${Math.max(2, previewX + 2)}%` }),
    ...(previewY > 56 ? { bottom: 42 } : { top: `${Math.max(2, previewY - 8)}%` }),
  };
  const selectedOwnerHomes = segmentOwnerHomes(selectedMarket, valueSegment);
  const selectedSegmentShare = valueSegmentShare(selectedMarket, valueSegment);
  const selectedCustomHomes = segmentCustomHomes(selectedMarket, valueSegment);
  const appointmentTarget = Math.max(10, Math.round((selectedCustomHomes / 25) * 0.08));
  const selectedProfile = profileFor(selectedMarket);
  const selectedAudience = demographicByMarket[selectedMarket.id];
  const previewAudience = previewMarket ? demographicByMarket[previewMarket.id] : null;
  const annualReplacementOpportunities = Math.max(1, Math.round(selectedCustomHomes / 25));
  const bookedJobTarget = Math.max(3, Math.round(appointmentTarget * 0.35));

  useEffect(() => {
    const stage = mapStageRef.current;
    if (!stage) return;
    const updateAspect = () => {
      const { width, height } = stage.getBoundingClientRect();
      if (width > 0 && height > 0) setMapAspect(width / height);
    };
    updateAspect();
    const observer = new ResizeObserver(updateAspect);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleShortcut = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape" && briefOpen) setBriefOpen(false);
      if (event.key === "Escape" && prospectsOpen) setProspectsOpen(false);
      if (event.key === "Escape" && ageExpanded) setAgeExpanded(false);
      if (event.key === "Escape" && audienceExpanded) setAudienceExpanded(false);
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [briefOpen, prospectsOpen, ageExpanded, audienceExpanded]);

  useEffect(() => {
    if (!briefOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBriefRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [briefOpen]);

  useEffect(() => {
    if (!ageExpanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeAgeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [ageExpanded]);

  useEffect(() => {
    if (!audienceExpanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeAudienceRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [audienceExpanded]);

  const selectMarket = (market: Market, focusMap = false) => {
    setSelectedId(market.id);
    setAgeMarketId(market.id);
    setHoveredId(null);
    if (focusMap) setZoom(1);
  };

  const handleBoundaryKey = (event: KeyboardEvent<SVGGElement>, market: Market) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectMarket(market);
    }
  };

  const handleSearchKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && visible[0]) selectMarket(visible[0], true);
    if (event.key === "Escape") {
      setSearch("");
      searchRef.current?.blur();
    }
  };

  const copyCurrentBrief = async () => {
    try {
      await navigator.clipboard.writeText(briefText(selectedMarket, valueSegment));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const updateAgeMarket = (nextId: string) => {
    setAgeMarketId(nextId);
    if (nextId !== "all") {
      const nextMarket = markets.find((market) => market.id === nextId);
      if (nextMarket) selectMarket(nextMarket, true);
    }
  };

  const compactCount = (value: number) => {
    if (value < 1000) return value.toLocaleString();
    const precision = value >= 10000 ? 0 : 1;
    return `${(value / 1000).toFixed(precision).replace(".0", "")}k`;
  };

  const renderAgeHistogram = (expanded = false) => ageCountMode === "units" ? (
    <>
      <div className="age-chart-key" aria-hidden="true">
        <span>Bar height = housing units</span>
        <span>Each bar = construction era</span>
      </div>
      <div
        className={`age-histogram is-units ${expanded ? "is-expanded" : ""}`}
        role="group"
        aria-label={`${housingUnitHistogramTotal.toLocaleString()} housing units by construction era${ageChartMarketId === "all" ? " across all 10 target areas" : ` in ${markets.find((market) => market.id === ageChartMarketId)?.name}`}`}
      >
        {housingUnitHistogram.map((bin) => {
          const maximumHeight = expanded ? 258 : 76;
          const barHeight = Math.max(bin.units ? 4 : 2, (bin.units / largestHousingUnitBin) * maximumHeight);
          return (
            <div key={bin.fullLabel} className="age-bin">
              <span className="age-bin-count" aria-label={`${bin.units.toLocaleString()} housing units`}>
                <b>{expanded ? bin.units.toLocaleString() : compactCount(bin.units)}</b>
                {bin.units > 0 && <small>units</small>}
              </span>
              <div
                className="age-unit-bar"
                style={{ "--bin-height": `${barHeight}px` } as CSSProperties}
                role="img"
                aria-label={`${bin.fullLabel}: ${bin.units.toLocaleString()} housing units`}
                title={`${bin.fullLabel} · ${bin.units.toLocaleString()} housing units`}
              ><i /></div>
              <small title={bin.fullLabel}>{expanded ? bin.fullLabel : bin.label}</small>
            </div>
          );
        })}
      </div>
      <div className="age-distribution-summary">
        <span><b>{housingUnitHistogramTotal.toLocaleString()}</b> housing units · {ageChartMarketId === "all" ? "all 10 territories" : markets.find((market) => market.id === ageChartMarketId)?.name}</span>
      </div>
    </>
  ) : (
    <>
      <div className="age-chart-key" aria-hidden="true">
        <span>Bar height = number of target areas</span>
        <span>Each segment = one area median</span>
      </div>
      <div
        className={`age-histogram ${expanded ? "is-expanded" : ""}`}
        role="group"
        aria-label={ageChartMarketId === "all"
          ? `Distribution of median construction years across all ${markets.length} target areas`
          : `${markets.find((market) => market.id === ageChartMarketId)?.name} has a median construction year of ${markets.find((market) => market.id === ageChartMarketId)?.yearBuilt}`}
      >
        {ageHistogram.map((bin) => {
          const selectedInBin = bin.markets.some((market) => market.id === ageChartMarketId);
          const maximumHeight = expanded ? 258 : 76;
          return (
            <div key={bin.start} className={`age-bin ${ageChartMarketId !== "all" && !selectedInBin ? "is-muted" : ""}`}>
              <span className="age-bin-count" aria-label={`${bin.markets.length} target areas`}>
                <b>{bin.markets.length || ""}</b>
                {bin.markets.length > 0 && <small>areas</small>}
              </span>
              <div
                className="age-bin-stack"
                style={{ "--bin-height": `${Math.max(bin.markets.length ? 18 : 2, (bin.markets.length / largestAgeBin) * maximumHeight)}px` } as CSSProperties}
              >
                {bin.markets.map((market) => (
                  <button
                    key={market.id}
                    className={ageChartMarketId === market.id ? "is-selected" : ""}
                    onClick={() => updateAgeMarket(market.id)}
                    aria-label={`${market.name}: median year built ${market.yearBuilt}`}
                    title={`${market.name} · median year ${market.yearBuilt}`}
                  />
                ))}
              </div>
              <small>{bin.label}</small>
            </div>
          );
        })}
      </div>

      <div className="age-distribution-summary">
        {ageChartMarketId === "all" ? (
          <span><b>{markets.length}</b> area medians · {Math.min(...markets.map((market) => market.yearBuilt))}–{Math.max(...markets.map((market) => market.yearBuilt))}</span>
        ) : (
          <span><b>{markets.find((market) => market.id === ageChartMarketId)?.yearBuilt}</b> median year · {markets.find((market) => market.id === ageChartMarketId)?.name}</span>
        )}
      </div>
    </>
  );

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Gateway Growth home">
          <span className="brand-mark"><i /><i /><i /></span>
          <span><b>Gateway Growth</b><small>Window market intelligence</small></span>
        </a>
        <nav aria-label="Dashboard navigation">
          <a className="nav-active" href="#map">Market map</a>
          <a href="#ranking">Territories</a>
          <a href="#methodology">Methodology</a>
        </nav>
        <div className="header-actions">
          <span className="live-dot"><i /> GIS boundaries aligned</span>
          <button className="export-btn" onClick={() => setBriefOpen(true)}>Export brief</button>
          <a className="avatar" href="/signout-with-chatgpt?return_to=%2F" aria-label="Sign out" title={`Signed in as ${viewerEmail}`}>
            {viewerEmail.slice(0, 2).toUpperCase()}
          </a>
        </div>
      </header>

      <section className="intro" id="top">
        <div>
          <p className="eyebrow">ST. LOUIS METRO · SALES TERRITORY VIEW</p>
          <h1>Find the homes most ready<br />for a window upgrade.</h1>
          <p className="intro-copy">Prioritize neighborhoods where older housing stock and household resources align—before your competitors do.</p>
        </div>
        <aside className="model-note">
          <span className="note-icon">i</span>
          <div><b>Blaze-calibrated market model</b><p>TAM is total market size—not a revenue forecast or individual household profile.</p></div>
        </aside>
      </section>

      <section className={`kpi-row ${prospectsOpen ? "is-drilled" : ""}`} aria-label="Market summary">
        <article className="prospect-kpi">
          <span>Potential owner prospects</span>
          <strong>{totalCustom.toLocaleString()}</strong>
          <small>{totalOwnerHomes ? (totalCustom / totalOwnerHomes * 100).toFixed(1) : "0.0"}% of {totalOwnerHomes.toLocaleString()} selected owner homes</small>
          <button className="kpi-drill-button" onClick={() => setProspectsOpen((open) => !open)} aria-expanded={prospectsOpen} aria-controls="prospect-breakdown">
            {prospectsOpen ? "Hide neighborhood breakdown" : "View by neighborhood"}<span aria-hidden="true">{prospectsOpen ? "↑" : "↓"}</span>
          </button>
        </article>
        <article><span>Selected owner homes</span><strong>{totalOwnerHomes.toLocaleString()}</strong><small>{valueSegmentLabel(valueSegment)} · {visible.length} visible areas</small></article>
        <article><span>Avg. baseline priority</span><strong>{visible.length ? Math.round(visible.reduce((sum, market) => sum + market.score, 0) / visible.length) : 0}<em>/100</em></strong><small>Whole-territory planning index</small></article>
        <article className="pipeline-card"><span>Selected-segment TAM</span><strong>{moneyRange(totalTamLow, totalTamHigh)}</strong><small>Annualized pool: {moneyRange(totalTamLow / 25, totalTamHigh / 25)}</small></article>
      </section>

      {prospectsOpen && (
        <section className="prospect-breakdown" id="prospect-breakdown" aria-label="Potential prospects by neighborhood">
          <header>
            <div><span>PROSPECT BREAKDOWN · {valueSegmentLabel(valueSegment).toUpperCase()}</span><h2>{totalCustom.toLocaleString()} modeled owner prospects by area</h2></div>
            <button onClick={() => setProspectsOpen(false)} aria-label="Close prospect breakdown">×</button>
          </header>
          <div className="prospect-list">
            {prospectBreakdown.map((market) => {
              const prospects = segmentCustomHomes(market, valueSegment);
              const ownerHomes = segmentOwnerHomes(market, valueSegment);
              return (
                <button key={market.id} onClick={() => { selectMarket(market, true); setProspectsOpen(false); document.getElementById("map")?.scrollIntoView({ behavior: "smooth" }); }}>
                  <span className="prospect-name"><b>{market.name}</b><small>{ownerHomes.toLocaleString()} selected owner homes · {market.customRate}% custom fit</small></span>
                  <i><em style={{ width: `${largestProspectPool ? prospects / largestProspectPool * 100 : 0}%` }} /></i>
                  <span className="prospect-count"><b>{prospects.toLocaleString()}</b><small>{totalCustom ? (prospects / totalCustom * 100).toFixed(1) : "0.0"}% of prospects</small></span>
                </button>
              );
            })}
          </div>
          <div className="prospect-foot"><span>Value bands describe owner-occupied homes. Custom-fit need inside each band is modeled from the territory rate—not identified people or leads.</span><b>Select an area to open it on the map →</b></div>
        </section>
      )}

      <section className="workspace" id="map">
        <div className="workspace-head">
          <div>
            <p className="section-kicker">MARKET EXPLORER</p>
            <h2>Where should the next campaign land?</h2>
          </div>
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <input ref={searchRef} value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={handleSearchKey} placeholder="Find a market" aria-label="Find a market" />
            <kbd>⌘ K</kbd>
          </label>
        </div>

        <div className="toolbar">
          <div className="segmented" aria-label="Map layers">
            {layers.map((item) => <button key={item.id} className={layer === item.id ? "active" : ""} aria-pressed={layer === item.id} onClick={() => setLayer(item.id)}>{item.label}</button>)}
          </div>
          <div className="filter-row" aria-label="Market filters">
            {filters.map((item) => <button key={item.id} className={filter === item.id ? "filter-active" : ""} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</button>)}
          </div>
          <span className="result-count">{visible.length} areas</span>
        </div>

        <div className="value-filter-bar" aria-label="Owner-occupied home value filter">
          <div className="value-segmented">
            {valueSegments.map((item) => <button key={item.id} className={valueSegment === item.id ? "active" : ""} aria-pressed={valueSegment === item.id} onClick={() => setValueSegment(item.id)}>{item.label}</button>)}
          </div>
        </div>

        <div className="map-layout">
          <div className="map-panel">
            <div ref={mapStageRef} className="map-stage" aria-label="Interactive St. Louis opportunity map">
              <svg
                className="geo-map"
                viewBox={`${currentView.x} ${currentView.y} ${currentView.width} ${currentView.height}`}
                preserveAspectRatio="xMidYMid meet"
                role="group"
                aria-label="Official target-market boundaries over an OpenStreetMap basemap"
              >
                <g className="tile-layer" aria-hidden="true">
                  {mapTiles.map((tile) => (
                    <image
                      key={`${tile.x}-${tile.y}`}
                      href={`https://tile.openstreetmap.org/${TILE_ZOOM}/${tile.x}/${tile.y}.png`}
                      x={tile.x * TILE_SIZE}
                      y={tile.y * TILE_SIZE}
                      width={TILE_SIZE}
                      height={TILE_SIZE}
                      preserveAspectRatio="xMidYMid meet"
                    />
                  ))}
                </g>
                <rect className="map-wash" x={currentView.x} y={currentView.y} width={currentView.width} height={currentView.height} />
                {markets.map((market) => {
                  const feature = boundaryByName.get(market.sourceName);
                  if (!feature) return null;
                  const isVisible = visibleIds.has(market.id);
                  const isSelected = selectedMarket.id === market.id;
                  const isPreviewed = previewMarket?.id === market.id;
                  const [labelX, labelY] = project(market.center);
                  return (
                    <g
                      key={market.id}
                      className={`market-boundary ${isSelected ? "is-selected" : ""} ${isPreviewed ? "is-previewed" : ""} ${!isVisible ? "is-hidden" : ""}`}
                      role="button"
                      tabIndex={isVisible ? 0 : -1}
                      aria-label={`${market.name}, ${segmentCustomHomes(market, valueSegment).toLocaleString()} modeled prospects in ${valueSegmentLabel(valueSegment).toLowerCase()}`}
                      aria-pressed={isSelected}
                      aria-hidden={!isVisible}
                      onMouseEnter={() => isVisible && setHoveredId(market.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onFocus={() => isVisible && setHoveredId(market.id)}
                      onBlur={() => setHoveredId(null)}
                      onClick={() => isVisible && selectMarket(market)}
                      onKeyDown={(event) => isVisible && handleBoundaryKey(event, market)}
                    >
                      <path className="market-shape" d={geometryPath(feature.geometry)} fill={layerColor(market, layer, valueSegment, largestSegmentPool)} fillRule="evenodd" />
                      <text className="market-label" x={labelX} y={labelY} textAnchor="middle">
                        {market.labelLines.map((line, index) => (
                          <tspan key={line} x={labelX} dy={index === 0 ? (market.labelLines.length > 1 ? -2.2 : 1.6) : 6.4}>{line}</tspan>
                        ))}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {previewMarket ? (
                <aside className="map-tooltip" style={tooltipStyle} aria-live="polite">
                  <div className="tooltip-head"><div><strong>{previewMarket.name}</strong><span>{previewMarket.kind} · {valueSegmentLabel(valueSegment)}</span></div><b title="Baseline relative opportunity index">{previewMarket.score}</b></div>
                  <div className="tooltip-grid">
                    <span><small>Selected owner homes</small><b>{segmentOwnerHomes(previewMarket, valueSegment).toLocaleString()}</b></span>
                    <span><small>Share of owner homes</small><b>{valueSegmentShare(previewMarket, valueSegment).toFixed(1)}%</b></span>
                    <span><small>Est. custom-fit share</small><b>{previewMarket.customRate}%</b></span>
                    <span><small>Est. owner prospects</small><b>{segmentCustomHomes(previewMarket, valueSegment).toLocaleString()}</b></span>
                    <span><small>Overall median value</small><b>{money(previewMarket.homeValue)}</b></span>
                    <span><small>Overall median year</small><b>{previewMarket.yearBuilt}</b></span>
                    <span><small>Selected-segment TAM</small><b>{moneyRange(segmentTamLow(previewMarket, valueSegment), segmentTamHigh(previewMarket, valueSegment))}</b></span>
                    <span><small>Owner householders 35–64</small><b>{previewAudience ? previewAudience.age[1] + previewAudience.age[2] : 0}%</b></span>
                    <span><small>Owner householders 65+</small><b>{previewAudience?.age[3] ?? 0}%</b></span>
                    <span><small>Median household income</small><b>{previewAudience ? money(previewAudience.medianIncome) : "—"}</b></span>
                  </div>
                  <div className="tooltip-hint">Click market to select <span>↗</span></div>
                </aside>
              ) : visible.length === 0 ? (
                <div className="empty-map-state"><strong>No markets match.</strong><span>Clear the search or reset the filter to restore the map.</span><button onClick={() => { setSearch(""); setFilter("all"); }}>Reset map</button></div>
              ) : null}

              <div className="zoom-control" aria-label="Map zoom controls">
                <button onClick={() => setZoom(Math.min(zoom + 1, 2))} disabled={zoom === 2} aria-label="Zoom in">+</button>
                <button onClick={() => setZoom(Math.max(zoom - 1, 0))} disabled={zoom === 0} aria-label="Zoom out">−</button>
                <button onClick={() => setZoom(0)} disabled={zoom === 0} aria-label="Reset map view">◎</button>
              </div>
              <div className="legend">
                <span>Lower</span><i className={`legend-gradient ${layer}`} /><span>Higher</span>
              </div>
              <span className="map-attribution">© OpenStreetMap contributors · Boundaries: St. Louis City & County GIS</span>
            </div>
          </div>

          <aside className="profile-panel" aria-live="polite">
            <div className="profile-title">
              <div><p>SELECTED MARKET</p><h3>{selectedMarket.name}</h3><span>{selectedMarket.kind}</span></div>
              <strong title="Baseline whole-territory priority score">{selectedMarket.score}<small>/100</small></strong>
            </div>
            <div className="score-label"><span>Baseline relative opportunity index</span><b>{selectedMarket.score >= 79 ? "Highest priority" : selectedMarket.score >= 76 ? "High priority" : selectedMarket.score >= 72 ? "Selective fit" : "Build selectively"}</b></div>
            <div className="score-track"><i style={{ width: `${selectedMarket.score}%` }} /></div>

            <div className="profile-metrics">
              <div><span>Selected owner homes</span><strong>{selectedOwnerHomes.toLocaleString()}</strong><small>{selectedSegmentShare.toFixed(1)}% · {valueSegmentLabel(valueSegment)}</small></div>
              <div><span>Potential owner prospects</span><strong>{selectedCustomHomes.toLocaleString()}</strong><small>{selectedMarket.customRate}% modeled custom fit</small></div>
              <div><span>Overall median value</span><strong>{money(selectedMarket.homeValue)}</strong><small>whole territory—not filtered subgroup</small></div>
              <div><span>Selected-segment TAM</span><strong>{moneyRange(segmentTamLow(selectedMarket, valueSegment), segmentTamHigh(selectedMarket, valueSegment))}</strong><small>{moneyRange(selectedMarket.projectLow, selectedMarket.projectHigh)} per project</small></div>
            </div>

            <div className="age-distribution">
              <div className="age-distribution-head">
                <div><h4>{ageCountMode === "units" ? "Homes by construction era" : "Neighborhood median years"}</h4><p>{ageCountMode === "units" ? "Housing-unit counts in each era" : "Count of area medians by decade"}</p></div>
                <div className="age-distribution-actions">
                  <label>
                    <span>Count by</span>
                    <select value={ageCountMode} onChange={(event) => setAgeCountMode(event.target.value as AgeCountMode)} aria-label="Choose whether the histogram counts housing units or neighborhood medians">
                      <option value="units">Housing units</option>
                      <option value="markets">Neighborhoods</option>
                    </select>
                  </label>
                  <label>
                    <span>Neighborhood</span>
                    <select
                      value={ageChartMarketId}
                      onChange={(event) => updateAgeMarket(event.target.value)}
                      aria-label="Filter median year chart by neighborhood"
                    >
                      <option value="all">All 10 territories</option>
                      {markets.map((market) => <option key={market.id} value={market.id}>{market.name}</option>)}
                    </select>
                  </label>
                  <button className="age-expand-button" onClick={() => setAgeExpanded(true)} aria-label="Expand housing age chart" title="Expand chart">↗</button>
                </div>
              </div>
              {renderAgeHistogram()}
              <div className="signal-facts">
                <span>Selected owner-home share <b>{selectedSegmentShare.toFixed(1)}%</b></span>
                <span>Est. custom-fit <b>{selectedMarket.customRate}%</b></span>
              </div>
              <small className="age-data-note">{ageCountMode === "units" ? <><b>Housing units:</b> era counts use Census data for municipalities and City assessor distributions for city neighborhoods. Construction era remains an all-homes view because it is not cross-tabulated by value segment.</> : <><b>Neighborhood medians:</b> “3 areas” in the 1950s means three target areas have median years in that decade.</>}</small>
            </div>

            <div className="audience-profile">
              <div className="audience-profile-head">
                <div><h4>Buyer audience profile</h4><p>Selected-area household distributions</p></div>
                <div className="audience-profile-actions">
                  <span>{selectedAudience.source === "ACS place" ? "ACS place" : "Tract proxy"}</span>
                  <button className="audience-expand-button" onClick={() => setAudienceExpanded(true)} aria-label="Expand buyer audience profile" title="Expand buyer audience profile">↗</button>
                </div>
              </div>
              <div className="audience-kpis">
                <div><small>Working-prime owners</small><strong>{selectedAudience.age[1] + selectedAudience.age[2]}%</strong><span>householders age 35–64</span></div>
                <div><small>Retired-age owners</small><strong>{selectedAudience.age[3]}%</strong><span>householders age 65+</span></div>
                <div><small>Median income</small><strong>{money(selectedAudience.medianIncome)}</strong><span>all households</span></div>
              </div>
              {[
                { title: "Owner householder age", labels: ["Under 35", "35–54", "55–64", "65+"], values: selectedAudience.age },
                { title: "Household income", labels: ["<$50k", "$50–99k", "$100–199k", "$200k+"], values: selectedAudience.income },
                { title: "Owner-occupied home value", labels: ["<$250k", "$250–499k", "$500–999k", "$1M+"], values: selectedAudience.homeValue },
              ].map((distribution) => (
                <div className="audience-distribution" key={distribution.title}>
                  <div className="audience-distribution-title"><span>{distribution.title}</span><small>% of {distribution.title === "Owner householder age" ? "owner households" : distribution.title === "Household income" ? "households" : "owner-occupied homes"}</small></div>
                  <div className="audience-stacked-bar" aria-label={`${distribution.title} distribution`}>
                    {distribution.values.map((value, index) => <i key={distribution.labels[index]} className={`tone-${index + 1}`} style={{ width: `${value}%` }} title={`${distribution.labels[index]}: ${value}%`} />)}
                  </div>
                  <div className="audience-legend">
                    {distribution.labels.map((label, index) => <span key={label}><i className={`tone-${index + 1}`} /><b>{label}</b><small>{distribution.values[index]}%</small></span>)}
                  </div>
                </div>
              ))}
              <small className="audience-note"><b>Net worth is not locally published.</b> Owner-occupied home value is shown only as a wealth proxy. Age and income describe the whole territory, not the selected value subgroup. {selectedAudience.source === "ACS place" ? "Municipality values are direct ACS 2020–2024 estimates." : "City-neighborhood values use representative Census tract data and should be treated as directional."}</small>
            </div>

            <div className="next-move">
              <span>RECOMMENDED CAMPAIGN POSITION</span>
              <p>{campaignPosition(selectedMarket)}</p>
              <button onClick={() => setBriefOpen(true)}>Build territory brief <span>→</span></button>
            </div>
          </aside>
        </div>
        <div className="map-source-note">
          <span><b>Boundary sources:</b> City of St. Louis Neighborhoods and St. Louis County Municipal Boundary public GIS layers.</span>
          <span><b>Market model:</b> ACS 2024 municipal housing/value data; City 2020 housing counts; area market values; modeled custom-fit incidence and Blaze-aligned ticket ranges.</span>
        </div>
      </section>

      <section className="ranking-section" id="ranking">
        <div className="ranking-copy">
          <p className="section-kicker">PRIORITY QUEUE</p>
          <h2>Top markets for the selected owner segment</h2>
          <p>Ranked by estimated custom-fit owner prospects within {valueSegmentLabel(valueSegment).toLowerCase()}. Baseline priority remains the whole-territory planning score.</p>
          <div className="method-card" id="methodology"><span>How the model works</span><p>Selected owner homes = owner households × the selected ACS home-value share. Potential owner prospects = selected owner homes × the territory’s modeled specialty-fit rate. Selected-segment TAM = modeled prospects × the area’s installed project range. Age, income, median home value, and baseline priority still describe the whole territory because the available estimates do not cross-tabulate them by home-value segment. City-neighborhood demographics use representative tract proxies. Net worth is not estimated.</p></div>
        </div>
        <div className="ranking-table">
          <div className="table-head"><span>Market</span><span>Selected owner homes</span><span>Potential prospects</span><span>Segment TAM</span><span>Baseline priority</span></div>
          {ranked.map((market, index) => (
            <button key={market.id} onClick={() => { selectMarket(market, true); document.getElementById("map")?.scrollIntoView({ behavior: "smooth" }); }}>
              <span className="rank-name"><i>{index + 1}</i><b>{market.name}<small>{valueSegmentShare(market, valueSegment).toFixed(1)}% of owner homes</small></b></span>
              <span>{segmentOwnerHomes(market, valueSegment).toLocaleString()}<small>{valueSegmentLabel(valueSegment)}</small></span>
              <span>{segmentCustomHomes(market, valueSegment).toLocaleString()}<small>{market.customRate}% estimated fit</small></span>
              <span>{moneyRange(segmentTamLow(market, valueSegment), segmentTamHigh(market, valueSegment))}<small>selected-segment TAM</small></span>
              <span className="rank-score"><b>{market.score}</b><i><em style={{ width: `${market.score}%` }} /></i><strong>View →</strong></span>
            </button>
          ))}
          {ranked.length === 0 && <div className="ranking-empty">No ranked markets match the current search and filter.</div>}
        </div>
      </section>

      <footer>
        <div className="brand footer-brand"><span className="brand-mark"><i /><i /><i /></span><span><b>Gateway Growth</b><small>Window market intelligence</small></span></div>
        <p>Planning prototype · Market-level estimates only · No individual financial profiles</p>
        <span>Built for smarter territory decisions</span>
      </footer>

      {ageExpanded && (
        <div className="age-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setAgeExpanded(false); }}>
          <section className="age-modal" role="dialog" aria-modal="true" aria-labelledby="age-modal-title">
            <header className="age-modal-header">
              <div><span>HOUSING AGE EXPLORER</span><h2 id="age-modal-title">{ageCountMode === "units" ? "Housing units by construction era" : "Neighborhood median-year distribution"}</h2><p>{ageCountMode === "units" ? "Each bar shows how many housing units were built in that Census construction-era bucket." : "This compares one median construction year per target area; it does not count individual houses."}</p></div>
              <button ref={closeAgeRef} className="brief-close" onClick={() => setAgeExpanded(false)} aria-label="Close expanded housing age chart">×</button>
            </header>

            <div className="age-modal-toolbar">
              <label>
                <span>Count by</span>
                <select value={ageCountMode} onChange={(event) => setAgeCountMode(event.target.value as AgeCountMode)} aria-label="Choose whether the expanded histogram counts housing units or neighborhood medians">
                  <option value="units">Housing units</option>
                  <option value="markets">Neighborhood medians</option>
                </select>
              </label>
              <label>
                <span>Neighborhood view</span>
                <select value={ageChartMarketId} onChange={(event) => updateAgeMarket(event.target.value)} aria-label="Filter expanded median year chart by neighborhood">
                  <option value="all">All 10 territories</option>
                  {markets.map((market) => <option key={market.id} value={market.id}>{market.name}</option>)}
                </select>
              </label>
              <p>“All 10 territories” always includes the full target set. Construction-era counts do not change with the owner-home value segment.</p>
            </div>

            <div className="age-modal-chart">{renderAgeHistogram(true)}</div>

            {ageCountMode === "units" && (
              <div className="age-explainer-grid">
                <article><span>WHAT THE BAR MEANS</span><h3>Bar length now represents housing units.</h3><p>The number above each bar is the count of units in that construction era. “Housing units” includes houses, condos, and apartments—not only detached homes.</p></article>
                <article><span>DATA &amp; METHOD</span><h3>Real era distributions, not a median-derived estimate.</h3><p>Municipalities use <a href="https://api.census.gov/data/2024/acs/acs5/groups/B25034.html" target="_blank" rel="noreferrer">ACS 2020–2024 table B25034</a>. Soulard, Lafayette Square, and Central West End use <a href="https://www.stlouis-mo.gov/data/datasets/distribution.cfm?id=189" target="_blank" rel="noreferrer">City assessor build-year and unit records</a>, scaled to their official 2020 neighborhood housing totals.</p></article>
              </div>
            )}
          </section>
        </div>
      )}

      {audienceExpanded && (
        <div className="age-modal-backdrop audience-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setAudienceExpanded(false); }}>
          <section className="age-modal audience-modal" role="dialog" aria-modal="true" aria-labelledby="audience-modal-title">
            <header className="age-modal-header">
              <div><span>BUYER AUDIENCE EXPLORER</span><h2 id="audience-modal-title">{selectedMarket.name} audience profile</h2><p>Viewing {valueSegmentLabel(valueSegment).toLowerCase()}. Age and income remain whole-territory distributions.</p></div>
              <button ref={closeAudienceRef} className="brief-close" onClick={() => setAudienceExpanded(false)} aria-label="Close expanded buyer audience profile">×</button>
            </header>

            <div className="audience-modal-toolbar">
              <label>
                <span>Territory</span>
                <select value={selectedMarket.id} onChange={(event) => { const market = markets.find((item) => item.id === event.target.value); if (market) selectMarket(market); }} aria-label="Choose territory for buyer audience profile">
                  {markets.map((market) => <option key={market.id} value={market.id}>{market.name}</option>)}
                </select>
              </label>
              <p>{selectedAudience.source === "ACS place" ? "Direct ACS 2020–2024 place estimates." : "Representative Census tract proxy; use directionally for neighborhood planning."}</p>
            </div>

            <div className="audience-modal-body">
              <div className="audience-modal-kpis">
                <div><small>Selected owner homes</small><strong>{selectedOwnerHomes.toLocaleString()}</strong><span>{selectedSegmentShare.toFixed(1)}% · {valueSegmentLabel(valueSegment)}</span></div>
                <div><small>Working-prime owners</small><strong>{selectedAudience.age[1] + selectedAudience.age[2]}%</strong><span>age 35–64</span></div>
                <div><small>Retired-age owners</small><strong>{selectedAudience.age[3]}%</strong><span>age 65+</span></div>
                <div><small>Median household income</small><strong>{money(selectedAudience.medianIncome)}</strong><span>all households</span></div>
              </div>

              {[
                { title: "Owner householder age", subtitle: "Share of owner households", labels: ["Under 35", "35–54", "55–64", "65+"], values: selectedAudience.age },
                { title: "Household income", subtitle: "Share of all households", labels: ["<$50k", "$50–99k", "$100–199k", "$200k+"], values: selectedAudience.income },
                { title: "Owner-occupied home value", subtitle: "Share of owner-occupied homes", labels: ["<$250k", "$250–499k", "$500–999k", "$1M+"], values: selectedAudience.homeValue },
              ].map((distribution) => (
                <div className="audience-distribution audience-modal-distribution" key={distribution.title}>
                  <div className="audience-distribution-title"><span>{distribution.title}</span><small>{distribution.subtitle}</small></div>
                  <div className="audience-stacked-bar" aria-label={`${distribution.title} distribution`}>
                    {distribution.values.map((value, index) => <i key={distribution.labels[index]} className={`tone-${index + 1}`} style={{ width: `${value}%` }} title={`${distribution.labels[index]}: ${value}%`} />)}
                  </div>
                  <div className="audience-legend">
                    {distribution.labels.map((label, index) => <span key={label}><i className={`tone-${index + 1}`} /><b>{label}</b><small>{distribution.values[index]}%</small></span>)}
                  </div>
                </div>
              ))}

              <small className="audience-modal-note"><b>How to read this:</b> The home-value selector changes owner-home counts, modeled prospects and TAM. Age and income remain whole-territory estimates because the source does not link them to a specific value band. Net worth is not published at this local level, so owner-occupied home value is shown only as a directional wealth proxy.</small>
            </div>
          </section>
        </div>
      )}

      {briefOpen && (
        <div className="brief-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setBriefOpen(false); }}>
          <section className="territory-brief" role="dialog" aria-modal="true" aria-labelledby="brief-title">
            <header className="brief-header">
              <div><span>90-DAY ACQUISITION PLAN</span><h2 id="brief-title">{selectedMarket.name} Territory Brief</h2><p>{selectedMarket.kind} · {valueSegmentLabel(valueSegment)} · Baseline priority {selectedMarket.score}/100</p></div>
              <button ref={closeBriefRef} className="brief-close" onClick={() => setBriefOpen(false)} aria-label="Close territory brief">×</button>
            </header>

            <div className="brief-kpis brief-kpis-expanded">
              <div><span>Selected owner homes</span><strong>{selectedOwnerHomes.toLocaleString()}</strong></div>
              <div><span>Potential prospects</span><strong>{selectedCustomHomes.toLocaleString()}</strong></div>
              <div><span>Value segment</span><strong>{valueSegmentLabel(valueSegment)}</strong></div>
              <div><span>Segment TAM</span><strong>{moneyRange(segmentTamLow(selectedMarket, valueSegment), segmentTamHigh(selectedMarket, valueSegment))}</strong></div>
              <div><span>Share of owner homes</span><strong>{selectedSegmentShare.toFixed(1)}%</strong></div>
              <div><span>Median year built</span><strong>{selectedMarket.yearBuilt}</strong></div>
            </div>

            <div className="brief-body">
              <article className="brief-lead">
                <span>TERRITORY THESIS</span>
                <h3>{selectedProfile.thesis}</h3>
                <p>{selectedCustomHomes.toLocaleString()} of {selectedOwnerHomes.toLocaleString()} selected owner-occupied homes are modeled as likely custom or specialty-fit stock using the territory’s {selectedMarket.customRate}% planning rate. At a 25-year replacement cycle, that represents roughly <b>{annualReplacementOpportunities.toLocaleString()} modeled replacement-cycle opportunities per year</b>.</p>
                <p className="tam-explainer">Selected-segment TAM is {moneyRange(segmentTamLow(selectedMarket, valueSegment), segmentTamHigh(selectedMarket, valueSegment))}, using a {moneyRange(selectedMarket.projectLow, selectedMarket.projectHigh)} installed project range. The annualized market pool is {moneyRange(segmentTamLow(selectedMarket, valueSegment) / 25, segmentTamHigh(selectedMarket, valueSegment) / 25)}.</p>
              </article>

              <article className="brief-audience">
                <span>PRIMARY HOMEOWNER SEGMENT</span>
                <h3>{selectedProfile.audience}</h3>
                <p><b>Housing signal:</b> {selectedProfile.housingSignal}</p>
                <div className="brief-audience-signals">
                  <div><small>Owners age 35–64</small><b>{selectedAudience.age[1] + selectedAudience.age[2]}%</b></div>
                  <div><small>Owners age 65+</small><b>{selectedAudience.age[3]}%</b></div>
                  <div><small>Households $100K+</small><b>{selectedAudience.income[2] + selectedAudience.income[3]}%</b></div>
                </div>
              </article>

              <article className="brief-offer">
                <span>CAMPAIGN POSITION</span>
                <h3>“{campaignPosition(selectedMarket)}”</h3>
                <p><b>Recommended offer:</b> {selectedProfile.offer}</p>
              </article>

              <article className="brief-qualification">
                <span>QUALIFICATION CHECKLIST</span>
                <h3>Protect appointment quality before the estimate.</h3>
                <p>{selectedProfile.qualification}</p>
                <div className="channel-chips">{selectedProfile.channels.map((channel) => <b key={channel}>{channel}</b>)}</div>
              </article>

              <article className="brief-economics">
                <span>INITIAL CAMPAIGN ECONOMICS</span>
                <div className="brief-economics-grid">
                  <div><small>Annual replacement proxy</small><b>{annualReplacementOpportunities.toLocaleString()}</b><em>custom-fit pool ÷ 25 years</em></div>
                  <div><small>Selected owner homes</small><b>{selectedOwnerHomes.toLocaleString()}</b><em>{selectedSegmentShare.toFixed(1)}% of owner-home pool</em></div>
                  <div><small>Qualified appointments</small><b>{appointmentTarget}</b><em>initial 90-day target</em></div>
                  <div><small>Booked jobs</small><b>{bookedJobTarget}</b><em>illustrative 35% close rate</em></div>
                  <div><small>Booked-value scenario</small><b>{moneyRange(bookedJobTarget * selectedMarket.projectLow, bookedJobTarget * selectedMarket.projectHigh)}</b><em>jobs × installed ticket range</em></div>
                </div>
              </article>

              <article className="brief-timeline">
                <span>MARKET-SPECIFIC 90-DAY PLAN</span>
                <ol>
                  <li><b>Days 1–30 · Build</b><p>{selectedProfile.first30}</p></li>
                  <li><b>Days 31–60 · Launch</b><p>{selectedProfile.next60}</p></li>
                  <li><b>Days 61–90 · Concentrate</b><p>{selectedProfile.final90}</p></li>
                </ol>
              </article>

              <article>
                <span>WEEKLY SCORECARD</span>
                <p>Review qualified appointments, estimate requests, appointment-to-quote rate, close rate, cost per qualified appointment, average booked ticket, and booked project value. Start with <b>{appointmentTarget} qualified appointments</b> and an illustrative <b>{bookedJobTarget}-job</b> booking target, then replace assumptions with actual response data.</p>
              </article>

              <article className="brief-watchout">
                <span>WATCHOUT</span>
                <h3>What could weaken performance</h3>
                <p>{selectedProfile.risk}</p>
              </article>

              <aside className="brief-data-note"><b>How to read this brief</b><p>Selected owner-home counts use the territory’s owner-occupied value distribution. Median value, year built, age, and income remain whole-territory measures. Custom-fit incidence, segment prospects, replacement cycle, close rate, TAM, and booked-value scenarios are planning assumptions—not identified households, guaranteed demand, or a Blaze revenue forecast. Replace assumptions with campaign and CRM results as soon as they are available.</p></aside>
            </div>

            <div className="brief-actions">
              <button className="brief-secondary" onClick={copyCurrentBrief}>{copied ? "Copied" : "Copy summary"}</button>
              <button className="brief-primary" onClick={() => window.print()}>Print / Save as PDF</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
