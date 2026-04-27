(function ($) {
    'use strict';
    $(document).ready(function() {
        $('.havezic_add_to_wishlist').tooltipster({
            position: 'left',
            theme: 'opal-product-tooltipster',
            delay: 0,
            animation: 'grow'
        });
    });

    $( document ).on( 'click', '.havezic_add_to_wishlist.add-wishlist', function( event ) {

        event.preventDefault();

        var $button = $( this );
        var bookId = $button.data( 'book-id' );

        if ( bookId ) {
            $.ajax({
                url: havezicAjax.ajaxurl,
                type: 'post',
                data: {
                    action: 'ba_ajax_update_wishlist',
                    bookId: bookId
                },
                beforeSend: function () {
                    $button.addClass('loading');
                },
                success: function (data) {
                    setTimeout(function() {$button.removeClass('loading');}, 1000);
                    if(data.result){
                        $button.addClass('in-wishlist').removeClass('add-wishlist');
                        $button.prop('href', data.wishlist_link);
                        $('#content .babe_shortcode_block').append('<div id="showNotice">'+ data.added_text+ '</div>');
                        setTimeout(function() { $('#showNotice').remove();}, 2000);
                        $button.tooltipster('content', data.wishlist_text);
                    }
                },
            });
        }
    });

    $( document ).on( 'click', '.havezic_add_to_wishlist.in-wishlist', function( event ) {

        event.preventDefault();
        var page_wishlist = $(this).attr('href');
        $(location).attr('href', page_wishlist);
    });

    $(document).ready(function () {
        $('.havezic_add_to_wishlist.login-acount').magnificPopup({
            type: 'inline',
            midClick: true
        });
    });


    $( document ).on( 'click', '.havezic-wishlist-remove', function( event ) {

        event.preventDefault();

        var $button = $( this );
        var bookId = $button.data( 'book-id' );

        if ( bookId ) {
            $.ajax({
                url: havezicAjax.ajaxurl,
                type: 'post',
                data: {
                    action: 'ba_ajax_remove_wishlist',
                    bookId: bookId
                },
                beforeSend: function () {
                    $button.addClass('loading');
                },
                success: function (data) {
                    setTimeout(function() {$button.removeClass('loading');}, 1500);
                    location.reload(true);
                },
            });
        }
    });

})(jQuery);
