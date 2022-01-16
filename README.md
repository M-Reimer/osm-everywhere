# osm-everywhere
This is a Firefox extension which redirects tiles requested from commercial services to OpenStreetMap ones.
## Usage
Currently tagged as "Experimental", this add-on is mainly aimed at OpenStreetMap contributors who are more prone to find and correct errors on the map.
The workflow of the add-on is as follows:
* Registers listeners, that is, requests send to tiles servers from commercial companies.
* Translates and redirects the request for an OpenStreetMap tile. **Note that the original request isn’t interrupted** causing each tile to be "loaded twice" and an increase in data consumption.
* Watermarks each tile with "Tiles © OpenStreetMap" copyright.
## Technicalities
Every request to OpenStreetMap tileserver comes in with "https:osm-everywhere.firefox/addon.invalid/" as a referrer allowing operators to recognize add-on’s routed requests. This may be replaced later on with an address to my own server.
Caching works globally, tiles are shared between openstreetmap.org and the add-on results.
## Supported commercial tiles servers
Currently, only three servers are supported: Bing, Google and Here.
## Port to Google Chrome
This does not work under Google Chrome and won’t be ported as nobody should use this browser anyway!
## Credits
Manuel Reimer is the main developper and maintainer of this project.
https://lists.openstreetmap.org/pipermail/talk-de/2022-January/117619.html
