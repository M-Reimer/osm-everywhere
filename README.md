# osm-everywhere
This is a Firefox extension which redirects tiles requested from commercial services to OpenStreetMap ones.

**Currently tagged as "Experimental", this add-on is only aimed at OpenStreetMap contributors who are more prone to find and correct errors on the map. This Add-on is not meant to be used by the "average user". The Add-on tries to simulate that "the whole web uses OSM tiles". BUT: The OSM community tile servers are not able to handle requests from the whole web!**

## How does it work?
The workflow of the add-on is as follows:
* Registers listeners, which interrupt tile requests to tiles servers from commercial companies.
* Translates and redirects the request for an OpenStreetMap tile. **Note that the original request isn’t interrupted** causing each tile to be "loaded twice" and an increase in data consumption.
* Watermarks each tile with "Tiles © OpenStreetMap" copyright.

## Supported commercial tile servers
Currently, only three servers are supported:
* Bing
* Google
* Here

More could be added if you request them in an Issue. But please provide at least two example pages where the requested map service is used. This means two **external** pages and not the website of the map service itself.

## Port to Google Chrome
Please don't request an Google Chrome version. Chrome never had the [filterResponseData](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/filterResponseData) API, which is required to manipulate data of web requests. Currently [Google cripples their webRequest API even more](https://developer.chrome.com/docs/extensions/mv3/mv3-migration/#when-use-blocking-webrequest). So what I'm doing here is technically impossible in Google Chrome!

## Credits
Manuel Reimer is the main developper and maintainer of this project.
https://lists.openstreetmap.org/pipermail/talk-de/2022-January/117619.html
