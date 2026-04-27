(function ($) {
    "use strict";
    $(window).on('elementor/frontend/init', () => {
        elementorFrontend.hooks.addAction('frontend/element_ready/babe-item-steps.default', ($scope) => {
            let $toggle = $scope.find('.havezic-toogle-step');
            let $toggleClass = $('.block_step_title, .block_step_content');
            $toggle.on('click', function (e) {
                e.preventDefault();
                $(this).toggleClass('active');
                if ($(this).hasClass('active')) {
                    $toggle.text(havezicAjax.collapse)
                    $toggleClass.addClass('block_active');
                } else {
                    $toggle.text(havezicAjax.expand)
                    $toggleClass.removeClass('block_active');
                }

            });
        });
    });

})(jQuery);