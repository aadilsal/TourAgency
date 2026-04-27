(function ($) {
    "use strict";
    $(window).on('elementor/frontend/init', () => {
        elementorFrontend.hooks.addAction('frontend/element_ready/babe-taxonomy-filter.default', ($scope) => {

            if ($('form#search_form').length > 0) {
                let $taxonomy = $('.havezic-search-filter-terms', $scope);
                $taxonomy.on('change', 'input:checkbox', function(ev){
                    update_term_values_in_search_form($taxonomy);
                    babe_search_form_submit();
                });
            }

        });
    });

    function update_term_values_in_search_form(elm){
        $(elm).find('.term_item_checkbox input').each(function (index, element) {
            var term_taxonomy_id = $(element).val();
            if($(element).is(':checked')){
                // append
                $('form#search_form').append('<input type="hidden" name="terms['+term_taxonomy_id+']" value="'+term_taxonomy_id+'">');
            } else {
                // unchecked
                $('form#search_form input[type="hidden"][name="terms['+term_taxonomy_id+']"]').remove();
            }

        });

    }

    function babe_search_form_submit(){

        $('#babe_search_result_refresh').css('display', 'block');


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
