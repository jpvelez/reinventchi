$(function() {
    // Holds tilejson hashes for all layers.
    var layers = {};

    // Construct a url for a MapBox API tilejson request from a map id.
    var tileUrl = function(id) {
        return 'http://a.tiles.mapbox.com/v3/' + id + '.jsonp';
    }

    // Build map, returns function to update map.
    var buildMap = function(tilejson) {
        // Tile layer, position on New York City
        var map = new MM.Map('map',
        new wax.mm.connector(tilejson));
        map.setCenterZoom(new MM.Location(41.8682,-87.7726),
            12);
        wax.mm.zoomer(map).appendTo(map.parent);

        // Interaction
        var interaction = wax.mm.interaction()
            .map(map)
            .tilejson(tilejson)
            .on(wax.tooltip().animate(true).parent(map.parent).events());

        // Legend
        var legend = wax.mm.legend(map, tilejson).appendTo(map.parent);

        // Update UI from map info
        var updateUI = function(tilejson) {
            $('#attribution').empty().append(tilejson.attribution);
            $('#layer-switcher li').removeClass('active');
            $('#layer-switcher li#' + tilejson.handle).addClass('active');
        };
        updateUI(tilejson);

        // Return handler for updating the map.
        return function(tilejson) {
            if (map.layers.length > 1) return;
            interaction && interaction.remove();
            $(map.layers[0].parent).css('z-index', 100);
            map.insertLayerAt(1, new wax.mm.connector(tilejson));
            $(map.layers[0].parent).fadeOut(500, function() {
                map.removeLayerAt(0);
            });
            interaction = wax.mm
                .interaction()
                .map(map)
                .tilejson(tilejson)
                .on(wax.tooltip().animate(true).parent(map.parent).events());
            if (legend) {
                $(legend.element()).css('opacity', 0);
                legend.content(tilejson);
                $(legend.element()).animate({opacity: 1}, 500);
            }
            updateUI(tilejson);
        };
    };

    // Set up map and layerswitcher.
    // Iterate through layer-switcher list, building urls using layer anchor's data-layer attr, fetching tilejson
    // object using url, and adding each tilejson to a layers hash, keyed by the layer div's id.
    $('#layer-switcher li').each(function(i, el) {
        wax.tilejson(tileUrl($('a', el).attr('data-layer')), function(tilejson) {
            tilejson.handle = $(el).attr('id');
            layers[tilejson.handle] = tilejson;
            // As soon as first map is loaded - when the first layer-switcher element's tilejson is added to layers hash -
            // build it and attach updateMap handler to all layer controls, so the map is updated when controls are clicked.
            if (i == 0) {
                // The buildMap function doesn't return a map, but the an updateMap function. It sets the map when
                // called below, and when other layer controls are clicked.
                var updateMap = buildMap(tilejson);
                $('#layer-switcher li .title').click(function() {;
                    updateMap(layers[$(this).parent().attr('id')]); // Pass tilejson of clicked control to updateMap
                    return false;
                });
            }
        });
    });

    // Map sharing.
    $('#share a').click(function() {
        var id = $('.active a').attr('data-layer');
        $('.share .tilejson textarea').empty().text(tileUrl(id));
        $('.share .embed textarea').empty().text(
            "<iframe style='background-color: #000' width='500' height='300' " +
            "frameBorder='0' src='http://a.tiles.mapbox.com/v3/" + id + ".html" +
            "#11,40.7010,-74.0137'></iframe>"
        );
        $('.modal.share').stop().fadeIn(100);
    });
    $('.modal .close').click(function() {
        $('.modal').stop().fadeOut(100);
    });
});
