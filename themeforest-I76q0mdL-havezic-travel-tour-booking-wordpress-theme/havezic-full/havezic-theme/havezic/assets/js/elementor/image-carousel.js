(function ($) {
    "use strict";
    $(window).on('elementor/frontend/init', () => {
        const addHandler = ($element) => {
            elementorFrontend.elementsHandler.addHandler(havezicSwiperBase, {
                $element,
            });
        };
        elementorFrontend.hooks.addAction('frontend/element_ready/havezic-image-carousel.default', addHandler);
    });
})(jQuery);
