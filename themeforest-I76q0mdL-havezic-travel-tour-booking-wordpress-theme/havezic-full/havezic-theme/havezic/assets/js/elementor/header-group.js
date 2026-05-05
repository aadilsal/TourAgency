(function ($) {
    "use strict";
    $(window).on('elementor/frontend/init', () => {
        elementorFrontend.hooks.addAction('frontend/element_ready/havezic-header-group.default', ($scope) => {
            $('.js-btn-login-popup').magnificPopup({
                type:'inline',
                midClick: true,
                removalDelay: 300,
                mainClass: 'zourney-mfp-zoom-in'
            });

            $('.js-btn-register-popup').magnificPopup({
                type:'inline',
                midClick: true,
                removalDelay: 300,
            });

            $('.site-header-account a.group-button.login').mouseenter(function () {
                $(this).parent().find('.account-dropdown').append($('.account-wrap'));
            });
        });
    });

})(jQuery);