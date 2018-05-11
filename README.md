# Cinnamon Desklet for Yahoo Finance quotes

## Description
This repository contains a [desklet for the Cinnamon desktop environment](https://cinnamon-spices.linuxmint.com/desklets) that displays stock quote information provided by [Yahoo Finance](https://finance.yahoo.com/).

![Screenshot](screenshot.png)

This desklet is based on the [desklet from fthuin](https://cinnamon-spices.linuxmint.com/desklets/view/23). The data retrieval part is adopted to an alternative service url, after the Yahoo Finance community table got retired in May 2017.

Tested with Debian 9 (Cinnamon 3.2), Linux Mint 18.2 (Cinnamon 3.4), Linux Mint 18.3 (Cinnamon 3.6), and Manjaro (Cinnamon 3.8).

## Installation
Either follow the installation instructions on [Cinnamon spices](https://cinnamon-spices.linuxmint.com/desklets), or manually download the folder **yfquotes@thegli** (below "files") and copy the folder and its content to *~/.local/share/cinnamon/desklets/*.

## Configuration
Check out the desklet configuration settings, and choose the data refresh period, the quote details to display, and the list of quotes to show. The default list contains the Dow 30 companies.

## Release Notes

### next
Features:
* show last-update timestamp of data refresh
* show last trade time/date
* display severe errors (e.g. network failure) in desklet

Bugfixes:
* improve error handling

### 0.1.0 - May 6, 2018
Features:
* minor description adjustments in configuration settings

Bugfixes:
* fix "value "nan" of type 'gfloat' is invalid or out of range for property" errors logged in *.xsession-errors*
* works (again) with Cinnamon 3.2

### 0.0.1 - May 4, 2018
Features:
* setting to show/hide the currency symbol

Bugfixes:
* change data retrieval to alternative url from Yahoo Finance

## Known Limitations
* The quotes list might not be editable using the desklet's configuration dialog (encountered in Cinnamon 3.6 and earlier). As a workaround, export the configuration using the standard desklet settings menu to a (json) file, then edit the file with your favorite text editor, and finally import the configuration file again.
 
## Credits
Based on the desklet source code from [fthuin](https://github.com/fthuin/yahoofinance-cinnamon-desklet).

## License
GNU General Public License v3.0
