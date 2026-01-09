import React, { useState, useEffect, useRef } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import ReactTooltip from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import useBreakpoints from "../useBreakpoints";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Kody krajów, które obsługujemy
const supportedCountries = ["USA", "CA", "GB", "FR", "DE", "ES", "PL", "RU"];

// Mapowanie kodów krajów
const countryCodeMap: Record<string, string> = {
  "United States of America": "USA",
  "United States": "USA",
  Canada: "CA",
  "United Kingdom": "GB",
  France: "FR",
  Germany: "DE",
  Spain: "ES",
  Poland: "PL",
  Russia: "RU",
};

interface ResponsiveWorldMapProps {
  onSelectCountry: (countryCode: string) => void;
}

const ResponsiveWorldMap: React.FC<ResponsiveWorldMapProps> = ({ onSelectCountry }) => {
  const { isMobile, isTablet } = useBreakpoints();
  const [position, setPosition] = useState<{ coordinates: [number, number]; zoom: number }>({ coordinates: [0, 0], zoom: 1 });
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [tooltipContent, setTooltipContent] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [geoData, setGeoData] = useState<any | null>(null);
  const [projScale, setProjScale] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // small theme detection — prefer the app's 'dark' class if present, otherwise fall back to OS preference
  const prefersDark = typeof window !== "undefined" && (
    document.documentElement.classList.contains("dark") ||
    (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)
  );

  // theme-aware colors used for geography fills and strokes so the map doesn't show a bright white border in dark mode
  const strokeColor = prefersDark ? "#374151" : "#ffffff"; // gray-700 in dark, white in light
  const fillNotAvailable = prefersDark ? "#0f172a" : "#d1d5db"; // darker filler for unavailable countries in dark mode
  const fillSupported = prefersDark ? "#059669" : "#10b981"; // green tone adjusted for dark
  const fillSelected = "#3b82f6"; // blue stays
  const hoverNotAvailable = prefersDark ? "#374151" : "#9ca3af";
  const hoverSupportedFill = "#3b82f6";

  // Responsive initial view + ResizeObserver to compute projection scale
  useEffect(() => {
    const updateMapView = () => {
      if (isMobile) {
        setPosition({ coordinates: [0, 18], zoom: 1.3 });
      } else if (isTablet) {
        setPosition({ coordinates: [0, 10], zoom: 1 });
      } else {
        setPosition({ coordinates: [0, 0], zoom: 1 });
      }
    };

    updateMapView();

    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width || window.innerWidth;
      let scale: number;
      if (w < 420) {
        // narrow phones — increase scale to fill more of the viewport
        scale = 150;
      } else if (w < 640) {
        scale = 120;
      } else {
        scale = Math.max(80, Math.min(180, Math.round(w / 6)));
      }
      setProjScale(scale);
    });

    if (mapContainerRef.current) ro.observe(mapContainerRef.current);

    const handleResize = () => updateMapView();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (mapContainerRef.current) ro.unobserve(mapContainerRef.current);
      ro.disconnect();
    };
  }, [isMobile, isTablet]);

  // Load and cache geo data (avoid re-downloading big topojson on each mount)
  useEffect(() => {
    let cancelled = false;
    const loadGeo = async () => {
      try {
        const cached = localStorage.getItem("worldGeo");
        if (cached) {
          const parsed = JSON.parse(cached);
          const age = Date.now() - (parsed.ts || 0);
          // keep for 7 days
          if (age < 7 * 24 * 60 * 60 * 1000 && parsed.data) {
            setGeoData(parsed.data);
            return;
          }
        }

        const res = await fetch(geoUrl);
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        setGeoData(json);
        try {
          localStorage.setItem("worldGeo", JSON.stringify({ ts: Date.now(), data: json }));
        } catch (e) {
          // ignore
        }
      } catch (e) {
        // ignore
      }
    };
    loadGeo();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Touch handlers with RAF throttling
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setIsDragging(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;

    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) setIsDragging(true);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    });
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
    setTimeout(() => setIsDragging(false), 100);
  };

  const handleCountryClick = (geo: any) => {
    if (isDragging) return;
    const countryName = geo.properties.name;
    const mappedCode = countryCodeMap[countryName];
    if (mappedCode && supportedCountries.includes(mappedCode)) {
      setSelectedCountry(mappedCode);
      onSelectCountry(mappedCode);
      setTimeout(() => setSelectedCountry(null), 1000);
    } else {
      setTooltipContent(`${countryName} (region not available)`);
      setTimeout(() => setTooltipContent(""), 2000);
    }
  };

  const handleZoomIn = () => setPosition((pos) => ({ ...pos, zoom: Math.min(pos.zoom * 1.3, 4) }));
  const handleZoomOut = () => setPosition((pos) => ({ ...pos, zoom: Math.max(pos.zoom / 1.3, 0.8) }));
  const handleResetView = () => {
    if (isMobile) setPosition({ coordinates: [0, 18], zoom: 1.3 });
    else if (isTablet) setPosition({ coordinates: [0, 10], zoom: 1 });
    else setPosition({ coordinates: [0, 0], zoom: 1 });
  };

  return (
    <div className="responsive-world-map" ref={mapContainerRef}>
      <div className="flex flex-wrap justify-center gap-2 mb-3 sm:mb-4">
        <button onClick={handleZoomIn} className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors" aria-label="Zoom in">+ Zoom</button>
        <button onClick={handleZoomOut} className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors" aria-label="Zoom out">- Zoom</button>
        <button onClick={handleResetView} className="px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors" aria-label="Reset view">Reset</button>
      </div>

      <div className="text-center mb-3 sm:mb-4">
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{isMobile || isTablet ? "Tap on a country to select it" : "Click on a country to select it"}</p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Available: USA, Canada, UK, Poland, France, Germany, Spain, Russia</p>
      </div>

      <div className="relative w-full h-[50vh] min-h-[240px] max-h-[420px] sm:h-[40vh] sm:min-h-[300px] sm:max-h-[500px] rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
  <ComposableMap projection="geoMercator" projectionConfig={{ scale: projScale || (isMobile ? 120 : isTablet ? 100 : 80), center: [0, isMobile ? 20 : isTablet ? 10 : 0] }} style={{ width: "100%", height: "100%", background: 'transparent' }}>
          <ZoomableGroup zoom={position.zoom} center={position.coordinates as [number, number]} onMoveEnd={setPosition} maxZoom={4} minZoom={0.8}>
            <Geographies geography={geoData || geoUrl}>
              {({ geographies }) => geographies.map((geo: any) => {
                const countryName = geo.properties.name;
                const mappedCode = countryCodeMap[countryName];
                const isSupported = mappedCode && supportedCountries.includes(mappedCode);
                const isSelected = selectedCountry === mappedCode;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => { if (!isDragging) setTooltipContent(isSupported ? `${countryName} - Click to select` : `${countryName} (region not available)`); }}
                    onMouseLeave={() => { if (!isDragging) setTooltipContent(""); }}
                    onClick={() => handleCountryClick(geo)}
                    style={{
                      default: { fill: isSelected ? fillSelected : isSupported ? fillSupported : fillNotAvailable, stroke: strokeColor, strokeWidth: isMobile ? 0.3 : 0.5, outline: "none" },
                      hover: { fill: isSupported ? hoverSupportedFill : hoverNotAvailable, stroke: strokeColor, strokeWidth: isMobile ? 0.5 : 1, outline: "none" },
                      pressed: { fill: "#2563eb", stroke: strokeColor, strokeWidth: isMobile ? 0.5 : 1, outline: "none" },
                    }}
                    className="transition-all duration-150 cursor-pointer"
                  />
                );
              })}
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        <ReactTooltip id="world-map-tooltip" getContent={() => tooltipContent} place="top" effect="solid" className="z-50 text-xs sm:text-sm !max-w-[200px]" delayShow={100} delayHide={100} />
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-4 gap-3">
        <div className="flex items-center gap-2"><div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded" /> <span className="text-xs sm:text-sm">Available</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded" /> <span className="text-xs sm:text-sm">Selected</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-400 rounded" /> <span className="text-xs sm:text-sm">Not available</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500 rounded animate-pulse" /> <span className="text-xs sm:text-sm">Clickable</span></div>
      </div>
    </div>
  );
};

export default ResponsiveWorldMap;
      ...pos,
      zoom: Math.max(pos.zoom / 1.3, 0.8)
    }));
  };

          className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm sm:text-sm transition-colors touch-manipulation"
    if (isMobile) {
      setPosition({ coordinates: [0, 20], zoom: 1.2 });
    } else if (isTablet) {
      setPosition({ coordinates: [0, 10], zoom: 1 });
    } else {
      setPosition({ coordinates: [0, 0], zoom: 1 });
          className="px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm sm:text-sm transition-colors touch-manipulation"
  };

  // Funkcja do renderowania tooltip content
  const renderTooltipContent = () => {
    return tooltipContent;
  };

  return (
    <div className="responsive-world-map" ref={mapContainerRef}>
      {/* Kontrolki */}
      <div className="flex flex-wrap justify-center gap-2 mb-3 sm:mb-4">
        <button
          onClick={handleZoomIn}
          className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs sm:text-sm transition-colors"
          aria-label="Zoom in"
        >
          + Zoom
        </button>
        <button
          onClick={handleZoomOut}
          className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs sm:text-sm transition-colors"
          aria-label="Zoom out"
        >
          - Zoom
        </button>
        <button
          onClick={handleResetView}
          className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-xs sm:text-sm transition-colors"
          aria-label="Reset view"
        >
          Reset
        </button>
      </div>

      {/* Instrukcje */}
      <div className="text-center mb-3 sm:mb-4">
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          {isMobile || isTablet 
            ? "Tap on a country to select it" 
            : "Click on a country to select it"}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          Available: USA, Canada, UK, Poland, France, Germany, Spain, Russia
        </p>
      </div>

      {/* Mapa */}
      <div
        className="relative w-full h-[40vh] min-h-[300px] max-h-[500px] rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        ref={mapContainerRef}
      >
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: projScale || (isMobile ? 120 : isTablet ? 100 : 80),
            center: [0, isMobile ? 20 : isTablet ? 10 : 0],
          }}
          style={{ width: "100%", height: "100%" }}
        >
          <ZoomableGroup
            zoom={position.zoom}
            center={position.coordinates as [number, number]}
            onMoveEnd={setPosition}
            maxZoom={4}
            minZoom={0.8}
          >
            <Geographies geography={geoData || geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const countryName = geo.properties.name;
                  const mappedCode = countryCodeMap[countryName];
                  const isSupported = mappedCode && supportedCountries.includes(mappedCode);
                  const isSelected = selectedCountry === mappedCode;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => {
                        if (!isDragging) {
                          setTooltipContent(
                            isSupported ? `${countryName} - Click to select` : `${countryName} (region not available)`
                          );
                        }
                      }}
                      onMouseLeave={() => {
                        if (!isDragging) setTooltipContent("");
                      }}
                      onClick={() => handleCountryClick(geo)}
                      style={{
                        default: {
                          fill: isSelected ? fillSelected : isSupported ? fillSupported : fillNotAvailable,
                          stroke: strokeColor,
                          strokeWidth: isMobile ? 0.3 : 0.5,
                          outline: "none",
                        },
                        hover: {
                          fill: isSupported ? hoverSupportedFill : hoverNotAvailable,
                          stroke: strokeColor,
                          strokeWidth: isMobile ? 0.5 : 1,
                          outline: "none",
                        },
                        pressed: {
                          fill: "#2563eb",
                          stroke: strokeColor,
                          strokeWidth: isMobile ? 0.5 : 1,
                          outline: "none",
                        },
                      }}
                      className="transition-all duration-150 cursor-pointer"
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {/* React Tooltip */}
        <ReactTooltip
          id="world-map-tooltip"
          getContent={() => tooltipContent}
          place="top"
          effect="solid"
          className="z-50 text-xs sm:text-sm !max-w-[200px]"
          delayShow={100}
          delayHide={100}
        />
      </div>

      {/* Legenda */}
  <div className="mt-4 grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-4 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded"></div>
          <span className="text-xs sm:text-sm">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded"></div>
          <span className="text-xs sm:text-sm">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-400 rounded"></div>
          <span className="text-xs sm:text-sm">Not available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500 rounded animate-pulse"></div>
          <span className="text-xs sm:text-sm">Clickable</span>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveWorldMap;
