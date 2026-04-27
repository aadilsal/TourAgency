(function ($) {
    "use strict";
    $(window).on('elementor/frontend/init', () => {
        elementorFrontend.hooks.addAction('frontend/element_ready/babe-item-address-map.default', ($scope) => {

            if ($(".map-data-location").length) {
                // initMap($('.map-data-location'));
                $(".map-data-location").each(function () {
                    initMap($(this));
                });
            }
        });
    });
    function initMap($container) {
        var lat = $container.attr('data-lat');
        var lng = $container.attr('data-lng');
        var icon = $container.attr('data-icon');
        var zoom_value = parseInt($container.attr('data-zoom'));

        var mapOptions = {
            center: new google.maps.LatLng(lat, lng),
            zoom: zoom_value,
            styles: $container.data('color')
        };

        var map = new google.maps.Map($container.get(0), mapOptions);
        var marker = new google.maps.Marker({
            position: new google.maps.LatLng(lat, lng),
            map: map,
            icon: {
                url: icon,
                scaledSize: {
                    height: 50,
                    width: 40
                }
            }
        });
        marker.setMap(map);

    }
})(jQuery);
