import React from "react";
import { VectorMap } from "@react-jvectormap/core";
import { worldMill } from "@react-jvectormap/world";
import { colorScale, countries, missingCountries } from "./Countries";

// Debugging logs
console.log("countries:", countries);
console.log("missingCountries:", missingCountries);

function WorldMap() {
  return (
    <div style={{ width: "100%", height: "500px", margin: "auto" }}>
      <VectorMap
        map={worldMill}
        containerStyle={{
          width: "100%",
          height: "100%",
        }}
        backgroundColor="#282c34"
        markers={missingCountries}
        markerStyle={{
          initial: {
            fill: "red",
          },
        }}
        series={{
          regions: [
            {
              scale: colorScale,
              values: countries,
              min: 0,
              max: 100,
            },
          ],
        }}
        onRegionTipShow={(event, label, code) => {
          label.html(`
            <div style="background-color: black; border-radius: 6px; padding: 10px; width: 125px; color: white;">
              <p><b>${label.html()}</b></p>
              <p>${countries[code] || "No data"}</p>
            </div>
          `);
        }}
        onMarkerTipShow={(event, label) => {
          label.html(`
            <div style="background-color: white; border-radius: 6px; padding: 10px; width: 125px; color: black;">
              <p><b>${label.html()}</b></p>
            </div>
          `);
        }}
      />
    </div>
  );
}

export default WorldMap;