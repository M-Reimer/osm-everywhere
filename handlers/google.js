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

// URL with markers: https://www.google.com/search?client=firefox-b-lm&tbs=lf:1,lf_ui:4&tbm=lcl&sxsrf=ALiCzsa8yNgFD8XKH7NfdkwX2VSp4RoJ1g:1666803771743&q=aida&rflfq=1&num=10&ved=2ahUKEwjI9uX1r_76AhXDQfEDHVmwB9kQtgN6BAgtEAY#rlfi=hd:;si:;mv:%5B%5B48.233765999999996,16.4011578%5D,%5B48.178816,16.2954672%5D%5D;tbs:lrf:!1m4!1u3!2m2!3m1!1e1!2m1!1e3!3sIAE,lf:1,lf_ui:4

// NOTE: Google uses a properietary paramter format which is only partially
//       known how it works. More info:
// http://blog.themillhousegroup.com/2016/08/
// https://stackoverflow.com/questions/18413193/
class ProtobufDecoder {
  // Pre-parsing. Splits the entries apart.
  constructor(pb) {
    const parts = pb.split("!");
    parts.shift();
    this.data = {
      size: 256,
      format: 0,
      type: "Roadmap",
      has_markers: false
    };
    this.decode_level(parts, "/");
  }

  // Interprets one tree level (called recursively).
  decode_level(parts, path) {
    while (parts.length) {
      const entry = this.decode_entry(parts.shift());
      if (entry.type == "m") {
        const subparts = parts.splice(0, parseInt(entry.value));
        this.decode_level(subparts, path + entry.name + "/");
      }
      else
        this.interpret(path + entry.name, entry.value);
    }
  }

  // Decodes an entry and returns its information as object.
  decode_entry(entry) {
    const parts = entry.match(/([0-9]+)([a-z])(.+)/);
    if (!parts)
      return false;

    let [, id, type, value] = parts;
    return {
      id: id,
      type: type,
      name: id + type,
      value: value
    };
  }

  // Decoded data is interpreted here.
  interpret(path, value) {
    switch(path) {
    case "/1m/1m/1i":
      this.data.z = parseInt(value);
      break;
    case "/1m/1m/2i":
      this.data.x = parseInt(value);
      break;
    case "/1m/1m/3i":
      this.data.y = parseInt(value);
      break;
    case "/1m/1m/4i":
      this.data.size = parseInt(value);
      break;
    case "/4e":
      // 0: PNG image
      // 3: JSON data
      this.data.format = parseInt(value);
      break;
    case "/3m/12m/2m/2s":
      this.data.type = value;
      break;
    case "/2m/8m/12m/3m/3s":
      this.data.has_markers = true;
      break;
    }
    //console.log(path, value);
  }

  // Checks the interpreted data for validity, first, and then returns data.
  get() {
    // Coordinates are required.
    if (!("z" in this.data && "x" in this.data && "y" in this.data))
      return false;

    // If there is a size, then we only support 256x256 pixels.
    if (this.data.size != 256)
      return false;

    // We only support the PNG format.
    if (this.data.format != 0)
      return false;

    // Only replace "Roadmap" tiles.
    if (this.data.type != "Roadmap")
      return false;

    // If there are markers on this tile, then don't handle it.
    if (this.data.has_markers)
      return false;

    return this.data;
  }
}


function redirect_google(details) {
  // Check against URL blacklist, first
  if (details.originUrl) {
    const origin = new URL(details.originUrl);
    if (origin.host in URL_BLACKLIST)
      return;
    if (origin.host.startsWith("maps.google."))
      return;
    // There seems to be an API for displaying Google Maps in an iframe.
    // So don't match for "www.google.*" inside frames.
    if (origin.host.startsWith("www.google.") && !details.frameId)
      return;
  }

  // Pass the URL over to the decoder class.
  const url = new URL(details.url);
  const sparams = url.searchParams;
  const data = (new ProtobufDecoder(sparams.get("pb"))).get();

  // If decoding failed, then stop here.
  if (!data)
    return;

  // Set up filter
  let filter = browser.webRequest.filterResponseData(details.requestId);
  filter.onstart = async () => {
    filter.write(await stamp_osm_tile(data.z, data.x, data.y));
    filter.close();
  }
}

browser.webRequest.onBeforeRequest.addListener(
  redirect_google,
  {urls: ["https://maps.googleapis.com/maps/vt?pb=*",
          "https://maps.google.com/maps/vt?pb=*",
          "https://www.google.com/maps/vt?pb=*"]},
  ["blocking"]
);
