(function ($) {
    "use strict";
    $(window).on('elementor/frontend/init', () => {
        elementorFrontend.hooks.addAction('frontend/element_ready/havezic-scroll-view.default', function ($scope){
            bindEvents($scope);
        });

        async function bindEvents($scope) {
            let $main = $scope.find('.havezic-swiper')
            let $thumbs = $scope.find('.text-thumbs')
            let $pagination_switch = $scope.find('.scrollview-text-item');

            const Swiper = elementorFrontend.utils.swiper;
            let galleryTop = await new Swiper($main, {
                speed: 1200,
                loop: true,
                loopedSlides: 4,
                effect: "fade",

            });

            let galleryThumbs = await new Swiper($thumbs, {
                spaceBetween: 30,
                speed: 1200,
                centeredSlides: false,
                slidesPerView: 1.3,
                loop: true,
                autoplay: true,
                loopedSlides: 4,
                on: {
                    init: function () {
                        $pagination_switch.removeClass("active");
                        $pagination_switch.eq(0).addClass("active");
                    },
                    slideChangeTransitionStart: function (mySwiper) {
                        $pagination_switch.removeClass("active");
                        $pagination_switch.eq(mySwiper.realIndex).addClass("active");
                    },
                },

                breakpoints: {
                    900: {
                        slidesPerView: 2,
                        spaceBetween: 30,
                    },
                }
            });

            galleryTop.controller.control = galleryThumbs;
            galleryThumbs.controller.control = galleryTop;
        }
    })
})(jQuery);