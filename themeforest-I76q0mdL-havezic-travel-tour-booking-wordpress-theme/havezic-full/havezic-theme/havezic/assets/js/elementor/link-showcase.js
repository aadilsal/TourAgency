(function ($) {
    "use strict";
    $(window).on('elementor/frontend/init', () => {
        elementorFrontend.hooks.addAction('frontend/element_ready/havezic-link-showcase.default', ($scope) => {
            let $tabs = $scope.find('.link-showcase-title-wrapper');
            let $contents = $scope.find('.link-showcase-content-wrapper');
            $contents.find('.elementor-active').show();
            $tabs.find('.elementor-link-showcase-title').hover(function (e) {
                let id = $(this).attr('aria-controls');
                $tabs.find('.elementor-link-showcase-title').removeClass('elementor-active');
                $contents.find('.elementor-link-showcase-content').removeClass('elementor-active');
                $(this).addClass('elementor-active');
                $contents.find('#' + id).addClass('elementor-active');
            });
        });
    });
})(jQuery);