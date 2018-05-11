/*
 * Yahoo Finance quotes - 0.2.0-next
 *
 * Shows stock quotes information provided by Yahoo Finance.
 * This desklet is based on the work of fthuin's stock desklet.
 * 
 */

// Cinnamon desklet user interface
const Desklet = imports.ui.desklet;
// Shell toolkit library from GNOME
const St = imports.gi.St;
// URL-IO-Operations
const Gio = imports.gi.Gio;
// Files operations
const GLib = imports.gi.GLib;
// Gtk library (policies for scrollview)
const Gtk = imports.gi.Gtk;
// for periodic data reload
const Mainloop = imports.mainloop;
// Binding desklet to mainloop function
const Lang = imports.lang;
// Settings loader based on settings-schema.json file
const Settings = imports.ui.settings;
// translation support
// const Gettext = imports.gettext;

const UUID = "yfquotes@thegli";
const DESKLET_DIR = imports.ui.deskletManager.deskletMeta[UUID].path;

// Gettext.bindtextdomain(UUID, GLib.get_home_dir() + "/.local/share/locale");
// function _(str) {
// return Gettext.dgettext(UUID, str);
// }

var YahooQueryStockQuoteReader = function () {
};

YahooQueryStockQuoteReader.prototype = {
    constructor : YahooQueryStockQuoteReader,
    yahooQueryBaseUrl : "https://query1.finance.yahoo.com/v7/finance/quote?symbols=",
    getStockQuotes : function (quoteSymbols) {
        var response = this.getYahooQueryResponse(this.createYahooQueryUrl(quoteSymbols));
        return this.fetchStockQuotes(response);
    },
    createYahooQueryUrl : function (quoteSymbols) {
        return this.yahooQueryBaseUrl + quoteSymbols.join(",");
    },
    getYahooQueryResponse : function (requestUrl) {
        const errorBegin="{\"quoteResponse\":{\"result\":[],\"error\":\"";
        const errorEnd = "\"}}";
        var urlcatch = Gio.file_new_for_uri(requestUrl);
        var response;
        
        try {
            let [successful, contents, etag_out] = urlcatch.load_contents(null);
            if (successful) {
                response = contents.toString();
            } else {
                response = errorBegin + "Yahoo Finance service not available!" + errorEnd;
            }
        } catch (err) {
            response = errorBegin + err + errorEnd;
        }

        // global.log(response);
        return JSON.parse(response);
    },
    fetchStockQuotes : function (response) {        
        return [response.quoteResponse.result, response.quoteResponse.error];
    }
};

var StockQuotesTable = function () {
    this.el = new St.Table({
        homogeneous : false
    });
};
StockQuotesTable.prototype = {
    constructor : StockQuotesTable,
    currencyCodeToSymbolMap : {
        USD : "$",
        EUR : "\u20AC",
        JPY : "\u00A5",
        GBP : "\u00A3",
        INR : "\u20A8"
    },
    render : function (stockQuotes, settings) {
        for (var rowIndex = 0, l = stockQuotes.length; rowIndex < l; rowIndex++) {
            this.renderTableRow(stockQuotes[rowIndex], rowIndex, settings);
        }
    },
    renderTableRow : function (stockQuote, rowIndex, shouldShow) {
        var cellContents = [];

        if (shouldShow.icon) {
            cellContents.push(this.createPercentChangeIcon(stockQuote));
        }
        if (shouldShow.stockName) {
            cellContents.push(this.createCompanyNameLabel(stockQuote));
        }
        if (shouldShow.stockTicker) {
            cellContents.push(this.createStockSymbolLabel(stockQuote));
        }
        if (shouldShow.stockPrice) {
            cellContents.push(this.createStockPriceLabel(stockQuote, shouldShow.currencySymbol));
        }
        if (shouldShow.percentChange) {
            cellContents.push(this.createPercentChangeLabel(stockQuote));
        }
        if (shouldShow.tradeTime) {
            cellContents.push(this.createTradingTimeLabel(stockQuote));
        }

        for (var columnIndex = 0; columnIndex < cellContents.length; ++columnIndex) {
            this.el.add(cellContents[columnIndex], {
                row : rowIndex,
                col : columnIndex,
                style_class : "stocks-table-item"
            });
        }
    },
    existsProperty : function(object, property) {
      return object.hasOwnProperty(property) && object[property] !== undefined && object[property] !== null;
    },
    createStockSymbolLabel : function (stockQuote) {
        return new St.Label({
            text : stockQuote.symbol,
            style_class : "stocks-label"
        });
    },
    createStockPriceLabel : function (stockQuote, withCurrencySymbol) {
        var currencySymbol = "";
        if (withCurrencySymbol && this.existsProperty(stockQuote, "currency")) {
            currencySymbol = this.currencyCodeToSymbolMap[stockQuote.currency] || stockQuote.currency;
        }
        return new St.Label({
            text : currencySymbol + (this.existsProperty(stockQuote, "regularMarketPrice") ? this.roundAmount(stockQuote.regularMarketPrice, 2) : "N/A"),
            style_class : "stocks-label"
        });
    },
    createCompanyNameLabel : function (stockQuote) {
        return new St.Label({
            text : this.existsProperty(stockQuote, "shortName") ? stockQuote.shortName : "N/A",
            style_class : "stocks-label"
        });
    },
    createPercentChangeIcon : function (stockQuote) {
        var path = "";
        var percentChange = this.existsProperty(stockQuote, "regularMarketChangePercent") ? parseFloat(stockQuote.regularMarketChangePercent) : 0.0;

        if (percentChange > 0) {
            path = "/icons/up.svg";
        } else if (percentChange < 0) {
            path = "/icons/down.svg";
        } else if (percentChange === 0.0) {
            path = "/icons/eq.svg";
        }

        var iconFile = Gio.file_new_for_path(DESKLET_DIR + path);
        var uri = iconFile.get_uri();
        var image = St.TextureCache.get_default().load_uri_async(uri, -1, -1);
        image.set_size(20, 20);

        var binIcon = new St.Bin({
            height : "20",
            width : "20"
        });
        binIcon.set_child(image);
        return binIcon;
    },
    createPercentChangeLabel : function (stockQuote) {
        return new St.Label({
            text : this.existsProperty(stockQuote, "regularMarketChangePercent") ? (this.roundAmount(stockQuote.regularMarketChangePercent, 2) + "%") : "N/A",
            style_class : "stocks-label"
        });
    },
    roundAmount : function (amount, decimals) {
        return Number((amount).toFixed(decimals));
    },
    isToday : function (date) {
        var today = new Date();
        return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth()
                && date.getDate() === today.getDate();
    },
    formatTime : function (unixTimestamp) {
        var ts = new Date(unixTimestamp * 1000);
        var tsFormat = "";
        if (this.isToday(ts)) {
            tsFormat = ts.getHours() + ":";
            if (ts.getMinutes() < 10) {
                tsFormat += "0";
            }
            tsFormat += ts.getMinutes();
        } else {
            if (ts.getDate() < 10) {
                tsFormat = "0";
            }
            tsFormat += ts.getDate() + ".";
            if (ts.getMonth() < 10) {
                tsFormat += "0";
            }
            tsFormat += (ts.getMonth() + 1);
        }

        return tsFormat;
    },
    createTradingTimeLabel : function (stockQuote) {
        return new St.Label({
            text : this.existsProperty(stockQuote, "regularMarketTime") ? this.formatTime(stockQuote.regularMarketTime) : "N/A",
            style_class : "stocks-label"
        });
    }
};

function StockQuoteDesklet(metadata, id) {
    Desklet.Desklet.prototype._init.call(this, metadata, id);
    this.init(metadata, id);
}

StockQuoteDesklet.prototype = {
    __proto__ : Desklet.Desklet.prototype,
    init : function (metadata, id) {
        this.metadata = metadata;
        this.id = id;
        this.stockReader = new YahooQueryStockQuoteReader();
        this.loadSettings();
        this.onUpdate();
    },
    loadSettings : function () {
        this.settings = new Settings.DeskletSettings(this, this.metadata.uuid, this.id);
        this.settings.bindProperty(Settings.BindingDirection.IN, "height", "height", this.onDisplayChanged, null);
        this.settings.bindProperty(Settings.BindingDirection.IN, "width", "width", this.onDisplayChanged, null);
        this.settings.bindProperty(Settings.BindingDirection.IN, "delayMinutes", "delayMinutes",
                this.onSettingsChanged, null);
        this.settings.bindProperty(Settings.BindingDirection.IN, "showLastUpdateTimestamp", "showLastUpdateTimestamp",
                this.onSettingsChanged, null);
        this.settings.bindProperty(Settings.BindingDirection.IN, "quoteSymbols", "quoteSymbolsText",
                this.onSettingsChanged, null);
        this.settings.bindProperty(Settings.BindingDirection.IN, "showIcon", "showIcon", this.onSettingsChanged, null);
        this.settings.bindProperty(Settings.BindingDirection.IN, "showStockName", "showStockName",
                this.onSettingsChanged, null);
        this.settings.bindProperty(Settings.BindingDirection.IN, "showStockSymbol", "showStockSymbol",
                this.onSettingsChanged, null);
        this.settings.bindProperty(Settings.BindingDirection.IN, "showStockPrice", "showStockPrice",
                this.onSettingsChanged, null);
        this.settings.bindProperty(Settings.BindingDirection.IN, "showCurrencyCode", "showCurrencyCode",
                this.onSettingsChanged, null);
        this.settings.bindProperty(Settings.BindingDirection.IN, "showStockPercentChange", "showStockPercentChange",
                this.onSettingsChanged, null);
        this.settings.bindProperty(Settings.BindingDirection.IN, "showTradeTime", "showTradeTime",
                this.onSettingsChanged, null);
    },
    getQuoteDisplaySettings : function () {
        return {
            "icon" : this.showIcon,
            "stockName" : this.showStockName,
            "stockTicker" : this.showStockSymbol,
            "stockPrice" : this.showStockPrice,
            "currencySymbol" : this.showCurrencyCode,
            "percentChange" : this.showStockPercentChange,
            "tradeTime" : this.showTradeTime
        };
    },
    formatCurrentTimestamp : function () {
        var ts = new Date();
        var tsFormat = ts.getHours() + ":";
        if (ts.getMinutes() < 10) {
            tsFormat += "0";
        }
        tsFormat += ts.getMinutes();
        tsFormat += ":";
        if (ts.getSeconds() < 10) {
            tsFormat += "0";
        }
        tsFormat += ts.getSeconds();

        return tsFormat;
    },
    createLastUpdateLabel : function () {
        return new St.Label({
            text : "Updated at " + this.formatCurrentTimestamp(),
            style_class : "stocks-label"
        });
    },
    createErrorLabel : function (errorMsg) {
        return new St.Label({
            text : "Error: " + errorMsg,
            style_class : "error-label"
        });
    },
    onDisplayChanged : function () {
        this.resize();
    },
    onSettingsChanged : function () {
        this.unrender();
        this.removeUpdateTimer();
        this.onUpdate();
    },
    on_desklet_removed : function () {
        this.unrender();
        this.removeUpdateTimer();
    },
    onUpdate : function () {
        var quoteSymbols = this.quoteSymbolsText.split("\n");
        try {
          var stockQuotes = this.stockReader.getStockQuotes(quoteSymbols);
          this.render(stockQuotes);
          this.setUpdateTimer();
        } catch (err) {
          this.onError(quoteSymbols, err);
        }
    },
    onError : function (quoteSymbols, err) {
      global.logError("Cannot get stock quotes for symbols: " + quoteSymbols.join(","));
      global.logError("The following error occurred: " + err);
      global.logError("Shutting down...");
    },
    render : function (stockQuotes) {
        var tableContainer = new St.BoxLayout({
            vertical : true
        });
        
        if (stockQuotes[1] !== null) {
            tableContainer.add_actor(this.createErrorLabel(stockQuotes[1]));
        }
        
        var table = new StockQuotesTable();
        table.render(stockQuotes[0], this.getQuoteDisplaySettings());
        tableContainer.add_actor(table.el);
        
        if (this.showLastUpdateTimestamp) {
            tableContainer.add_actor(this.createLastUpdateLabel());
        }

        var scrollView = new St.ScrollView();
        scrollView.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC);
        scrollView.add_actor(tableContainer);

        this.mainBox = new St.BoxLayout({
            vertical : true,
            width : this.width,
            height : this.height,
            style_class : "stocks-reader"
        });

        this.mainBox.add(scrollView, {
            expand : true
        });
        this.setContent(this.mainBox);
    },
    unrender : function () {
        this.mainBox.destroy_all_children();
        this.mainBox.destroy();
    },
    resize : function () {
        this.mainBox.set_size(this.width, this.height);
    },
    setUpdateTimer : function () {
        this.updateLoop = Mainloop.timeout_add(this.delayMinutes * 60 * 1000, Lang.bind(this, this.onUpdate));
    },
    removeUpdateTimer : function () {
        Mainloop.source_remove(this.updateLoop);
    }
};

function main(metadata, id) {
    return new StockQuoteDesklet(metadata, id);
}
