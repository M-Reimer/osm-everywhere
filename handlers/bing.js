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

// Helper for Bing Maps redirection. Translates the so-called "quadkey" to the
// z/x/y scheme used by OSM
function decode_quadkey(quadkey) {
  const zoom = quadkey.length;
  let x = 0;
  let y = 0;

  for (let i = zoom; i > 0; i--) {
    const mask = 1 << (i - 1);

    switch (quadkey.charAt(zoom - i)) {
    case "0":
      break;

    case "1":
      x |= mask;
      break;

    case "2":
      y |= mask;
      break;

    case "3":
      x |= mask;
      y |= mask;
      break;

    default:
      console.log("Error");
    }
  }

  return [zoom, x, y];
}

function redirect_bing(details) {
  // Check against URL blacklist, first
  if (details.originUrl) {
    const origin = new URL(details.originUrl);
    if (origin.host in URL_BLACKLIST)
      return;
    if (origin.host.endsWith(".bing.com"))
      return;
  }

  const url = new URL(details.url);
  const sparams = url.searchParams;

  let quadkey;
  // The /comp/ch path actually is an API which can return tiles and other data
  if (url.pathname.startsWith("/comp/ch/")) {
    // Do not interrupt requests that return JSON data
    if (sparams.has("js") && sparams.get("js") == "1")
      return;

    // Some info about the requested tile is passed with the "it" parameter
    // This is actually a required parameter, so we can expect it to be there
    if (!sparams.has("it"))
      return;

    // Don't handle some special tiles
    const tileinfo = sparams.get("it").split(",");
    if (tileinfo.includes("A") || // Aerial images
        tileinfo.includes("BE"))  // Birds eye
      return;

    if (!details.url.match(/\/([0-3]+)\?/))
      return;
    quadkey = RegExp.$1;
  }
  // The /tiles path most probably is just a tile provider
  else {
    if (!details.url.match(/\/r([0-3]+)[.?]/))
      return;
    quadkey = RegExp.$1;
  }

  const [z, x, y] = decode_quadkey(quadkey);

  let filter = browser.webRequest.filterResponseData(details.requestId);
  filter.onstart = async () => {
    filter.write(await stamp_osm_tile(z, x, y));
    filter.close();
  }
}

browser.webRequest.onBeforeRequest.addListener(
  redirect_bing,
  {urls: ["https://t.ssl.ak.dynamic.tiles.virtualearth.net/comp/ch/*",
          "https://*.tiles.virtualearth.net/tiles/*"]},
  ["blocking"]
);
