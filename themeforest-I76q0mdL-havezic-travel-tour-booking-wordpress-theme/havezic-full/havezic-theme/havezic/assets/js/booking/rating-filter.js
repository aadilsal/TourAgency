(function ($) {
    "use strict";
    $(window).on('elementor/frontend/init', () => {
        elementorFrontend.hooks.addAction('frontend/element_ready/babe-rating-filter.default', ($scope) => {

            /////////search form & widgets /////////
            if ($('form#search_form').length > 0){
                $('input[name="rating_value"]').on('change', function(ev){
                    var rating = $('.elementor-widget-babe-rating-filter input:radio[name=rating_value]:checked').val();

                    if ($('form#search_form input[name="rating_value"]').length > 0) {
                        $('form#search_form input[name="rating_value"]').val(rating);
                    } else {
                        $('form#search_form').append('<input type="hidden" name="rating_value" value="' + rating + '">');
                    }

                    babe_search_form_submit();
                });
            }

        });

    });

    function babe_search_form_submit(){

        $('#babe_search_result_refresh').css('display', 'block');

        $('.daterangepicker .drp-calendar.left .calendar-time .input_select_field').appendTo('#search_form .input-group');
        $('.daterangepicker .drp-calendar.right .calendar-time .input_select_field').appendTo('#search_form .input-group');


        $('#search_form input.input_select_input').removeAttr('name');

        $('#search_form .add_input_field[data-tax] .input_select_input_value').each(function(ind, elm){
            var term_taxonomy_id = $(elm).val();
            $('#search_form input[name="terms['+term_taxonomy_id+']"]').remove();
            if( term_taxonomy_id != 0){
                // append
                $('#search_form').append('<input type="hidden" name="terms['+term_taxonomy_id+']" value="'+term_taxonomy_id+'">');
            }
        });

        var args = $('#search_form').serialize();
        var action = $('#search_form').attr('action');
        var action_args = action.split('?')[1];
        var url;
        if (action_args != undefined){
            url = action + '&' + args;
        } else {
            url = action + '?' + args;
        }

        document.location.href = url;
    }

})(jQuery);
