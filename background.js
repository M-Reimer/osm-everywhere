/*
    Firefox addon "OSM Everywhere"
    Copyright (C) 2022  Manuel Reimer <manuel.reimer@gmx.de>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

// Blacklist of pages where we don't modify any tile requests
const URL_BLACKLIST = {
  "tools.geofabrik.de": true,
  "mc.bbbike.org": true
};

// We intercept the "non OSM" tile services and replace their response with
// OSM tiles. This means two things
// - Add-on users don't know if this website actually uses OSM or not
// - Copyright notes on the actual website are incomplete
// To fix this, we stamp each and every tile going through our Add-on
const TILE_SIZE = 256;
async function stamp_osm_tile(z, x, y, options = {}) {
  // Check size parameter
  const size = options.size || TILE_SIZE
  if (![TILE_SIZE, 2*TILE_SIZE].includes(size))
    throw("Invalid tile size: " + size);

  // Prepare target canvas
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  // If a image twice the size of an OSM tile is requested, then double the
  // coordinates and zoom in once.
  if (size == 2*TILE_SIZE) {
    x *= 2;
    y *= 2;
    z += 1;
  }

  // Two loops to stack together the "twice the size" tile if needed. In this
  // case 4 tiles are fetched from the OSM.org tile server and combined.
  for (let xoff = 0; xoff < size/TILE_SIZE; xoff++) {
    for (let yoff = 0; yoff < size/TILE_SIZE; yoff++) {

      // Fetch the actual image from the OSM.org tile server
      const response = await fetch("https://tile.openstreetmap.org/"+z+"/"+(x+xoff)+"/"+(y+yoff)+".png", {
        // We add our AMO URL as the referrer to make our requests identifiable
        referrer: "https://www.test2.de/",
        // Force cache requests to reduce osm.org tile server requests
        cache: "force-cache"
      });
      const objecturl = URL.createObjectURL(await response.blob());

      // Load that image into an Image object, wait for it to be loaded
      const image = new Image(TILE_SIZE, TILE_SIZE);
      await new Promise((resolve, reject) => {
        image.onerror = () => { reject(); };
        image.onload = () => { resolve(); };
        image.src = objecturl;
      });
      URL.revokeObjectURL(objecturl);

      // Draw image to canvas, stamp with OSM copyright info
      const xpos = xoff * TILE_SIZE;
      const ypos = yoff * TILE_SIZE;
      ctx.drawImage(image, xpos, ypos);
      ctx.lineWidth = 1;
      ctx.fillStyle = "#00000077";
      ctx.font = "10px sans-serif";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillText("Tiles © OpenStreetMap", xpos + 128, ypos + 128);
    }
  }

  // Get back our raw image data
  return await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob)
        reject();
      else
        blob.arrayBuffer()
          .then((buffer) => {resolve(buffer)})
          .catch((err) => {reject(err)});
    }, options.format || "image/png");
  });
}
