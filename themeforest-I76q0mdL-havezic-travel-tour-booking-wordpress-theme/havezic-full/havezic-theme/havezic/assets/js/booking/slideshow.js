(function ($) {
    "use strict";
    $(window).on('elementor/frontend/init', () => {
        const addHandler = ($element) => {
            elementorFrontend.elementsHandler.addHandler(havezicSwiperBase, {
                $element,
            });
        };
        $('a.ba-item-play-video').magnificPopup({
            type: 'iframe',
            removalDelay: 500,
            midClick: true,
            closeBtnInside: true,
        });
        elementorFrontend.hooks.addAction('frontend/element_ready/babe-item-slideshow.default', addHandler);
    });
})(jQuery);