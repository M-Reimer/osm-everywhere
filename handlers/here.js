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

function redirect_here(details) {
  // Check against URL blacklist, first
  if (details.originUrl) {
    const origin = new URL(details.originUrl);
    if (origin.host in URL_BLACKLIST)
      return;
    if (origin.host.endsWith(".here.com"))
      return;
  }

  // Parse URL
  if (!details.url.match(/\/([a-z.]+)\/([0-9]+)\/([0-9]+)\/([0-9]+)\/([0-9]+)\/png8/))
    return;
  const type = RegExp.$1;
  const z = parseInt(RegExp.$2);
  const x = parseInt(RegExp.$3);
  const y = parseInt(RegExp.$4);
  const size = parseInt(RegExp.$5);

  // Check URL parameters
  if (!["normal.day", "terrain.day"].includes(type))
    return;
  if (size == 128)
    return;

  // Set up filter
  let filter = browser.webRequest.filterResponseData(details.requestId);
  filter.onstart = async () => {
    filter.write(await stamp_osm_tile(z, x, y, {size: size}));
    filter.close();
  }
}

browser.webRequest.onBeforeRequest.addListener(
  redirect_here,
  {urls: ["https://*.base.maps.ls.hereapi.com/maptile/2.1/maptile/*",
          "https://*.base.maps.api.here.com/maptile/2.1/maptile/*",
          "https://*.aerial.maps.api.here.com/maptile/2.1/maptile/*"]},
  ["blocking"]
);
