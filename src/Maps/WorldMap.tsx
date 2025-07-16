// src/Maps/WorldMap.tsx
import React from "react";
import { VectorMap } from "@react-jvectormap/core";
import { worldMill } from "@react-jvectormap/world";
import { colorScale, countries, missingCountries } from "./Countries";

interface WorldMapProps {
  onSelectCountry?: (countryCode: string) => void;
}

const WorldMap: React.FC<WorldMapProps> = ({ onSelectCountry }) => {
  return (
      <div
        style={{
          width: "100%",
          height: "500px",   // ✅ Make sure height is not 0
          margin: "auto",
          border: "1px solid #CCC",
        }}
      >
      <VectorMap
        map={worldMill}
        backgroundColor="#282c34"
        containerStyle={{
          width: "100%",
          height: "100%",
        }}
        regionStyle={{
          initial: {
            fill: "#e4ecef",
            fillOpacity: 1,
            stroke: "none",
            strokeWidth: 0,
            strokeOpacity: 1,
          },
        }}
        markers={missingCountries}
        markerStyle={{
          initial: {
            fill: "red",
            stroke: "#383f47",
          },
        }}
        series={{
          regions: [
            {
              scale: colorScale,
              values: countries,
              min: 0,
              max: 100,
              normalizeFunction: "polynomial",
            },
          ],
        }}
        onRegionTipShow={(_, label, code) => {
          label.html(`
            <div style="background-color: black; border-radius: 6px; padding: 10px; width: 125px; color: white;">
              <p><b>${label.html()}</b></p>
              <p>${countries[code] || "No data"}</p>
            </div>
          `);
        }}
        onMarkerTipShow={(_, label) => {
          label.html(`
            <div style="background-color: white; border-radius: 6px; padding: 10px; width: 125px; color: black;">
              <p><b>${label.html()}</b></p>
            </div>
          `);
        }}
        onRegionClick={(_, code) => {
          if (onSelectCountry) onSelectCountry(code);
        }}
      />
    </div>
  );
};

export default WorldMap;
