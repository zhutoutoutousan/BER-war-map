const query = `[out:json][timeout:90];
(
  way["landuse"~"industrial|commercial|retail|railway"](52.30,13.30,52.44,13.70);
  way["aeroway"](52.30,13.30,52.44,13.70);
  node["power"~"substation|plant"](52.30,13.30,52.44,13.70);
  way["power"~"line|minor_line"](52.30,13.30,52.44,13.70);
  way["railway"](52.30,13.30,52.44,13.70);
  way["highway"~"motorway|trunk|primary"](52.30,13.30,52.44,13.70);
  node["man_made"~"works|wastewater_plant|water_works"](52.30,13.30,52.44,13.70);
);
out geom;`;

const res = await fetch("https://overpass.kumi.systems/api/interpreter", {
  method: "POST",
  body: "data=" + encodeURIComponent(query),
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent": "BER-war-map/0.1 OSM intel (+https://www.ber-plus.de/)"
  }
});
const data = await res.json();
console.log("elements", data.elements?.length, "remark", data.remark?.slice?.(0, 80));
