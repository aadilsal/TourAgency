(function ($) {
    'use strict';

    $(document).ready(function () {

        $('body').on('mouseenter', '.items_action .item-gallery:not(.tooltipstered),.items_action .item-video:not(.tooltipstered)',function () {
            var $element = $(this);
            if (typeof $.fn.tooltipster !== 'undefined') {
                $element.tooltipster({
                    position: 'left',
                    functionBefore: function (instance, helper) {
                        instance.content(instance._$origin.text());
                    },
                    theme: 'opal-product-tooltipster',
                    delay: 0,
                    animation: 'grow'
                }).tooltipster('show');
            }
        });

        $('.item-video').magnificPopup({
            disableOn: 700,
            type: 'iframe',
            mainClass: 'mfp-fade',
            removalDelay: 160,
            preloader: false,
            fixedContentPos: false
        });
        $('body').on('click', '.item-gallery:not(.added)', function (e) {
            $(this).addClass('added');
            e.preventDefault();
            let gallery = $(this),
                items = [],
                galleryImages = $(this).data('images');

            galleryImages.forEach(function (item, index) {
                items.push({
                    src: item.image,
                    title: item.description
                });
            });
            gallery.magnificPopup({
                mainClass: 'mfp-fade',
                items: items,
                gallery: {
                    enabled: true,
                    tPrev: $(this).data('prev-text'),
                    tNext: $(this).data('next-text')
                },
                type: 'image',
            }).magnificPopup('open');

        });
    });

})(jQuery);
