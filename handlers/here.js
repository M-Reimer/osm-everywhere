/*
    Firefox addon "OSM Everywhere"
    Copyright (C) 2024  Manuel Reimer <manuel.reimer@gmx.de>

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
  if (!details.url.match(/\/([a-z.]+)\/([0-9]+)\/([0-9]+)\/([0-9]+)\/([0-9]+)\/(?:png|png8|jpg)/))
    return;
  const type = RegExp.$1;
  const z = parseInt(RegExp.$2);
  const x = parseInt(RegExp.$3);
  const y = parseInt(RegExp.$4);
  const size = parseInt(RegExp.$5);

  // Only replace the "normal tiles" and "terrain tiles" for now
  // TODO: Probably have to add more depending on usage on websites
  if (!["normal.day", "terrain.day"].includes(type))
    return;

  // 128 pixels size is allowed for some tiles but deprecated according to
  // here.com.
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
          "https://*.aerial.maps.api.here.com/maptile/2.1/maptile/*",
          "https://*.traffic.maps.cit.api.here.com/maptile/2.1/traffictile/*"]},
  ["blocking"]
);


function redirect_here_v3(details) {
  // Check against URL blacklist, first
  if (details.originUrl) {
    const origin = new URL(details.originUrl);
    if (origin.host in URL_BLACKLIST)
      return;
    if (origin.host.endsWith(".here.com"))
      return;
  }

  // Parse URL
  if (!details.url.match(/\/([0-9]+)\/([0-9]+)\/([0-9]+)\/(?:png|png8|jpg)/))
    return;
  const z = parseInt(RegExp.$1);
  const x = parseInt(RegExp.$2);
  const y = parseInt(RegExp.$3);

  // Get size
  const url = new URL(details.url);
  const size = parseInt(url.searchParams.get("size") || "256");

  // Set up filter
  let filter = browser.webRequest.filterResponseData(details.requestId);
  filter.onstart = async () => {
    filter.write(await stamp_osm_tile(z, x, y, {size: size}));
    filter.close();
  }
}

browser.webRequest.onBeforeRequest.addListener(
  redirect_here_v3,
  {urls: ["https://maps.hereapi.com/v3/base/mc/*"]},
  ["blocking"]
);
