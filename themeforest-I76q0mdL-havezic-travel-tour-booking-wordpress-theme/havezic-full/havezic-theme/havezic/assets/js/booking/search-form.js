(function ($) {
    "use strict";
    $(window).on('elementor/frontend/init', () => {
        elementorFrontend.hooks.addAction('frontend/element_ready/babe-search-form.default', ($scope) => {

            $('.add_input_field .add_ids_title').on('click', function (event) {
                event.preventDefault();
                $('.add_ids_list').removeClass('active');
                if ($(this).parent().find('.add_ids_list').hasClass('havezic-active')) {
                    $(this).parent().find('.add_ids_list').removeClass('havezic-active');
                    search_add_list_close(this);
                } else {
                    $('.add_ids_list').removeClass('havezic-active');
                    search_add_list_close('.add_ids_title');
                    $(this).parent().find('.add_ids_list').addClass('havezic-active');
                    search_add_list_open(this);
                }
            });


            $('.add_input_field .add_ids_list .term_item').on('click', function (event) {
                var parent = $(this).closest('.add_ids_title');
                search_add_input_toggle(parent);
            });

            $(document).on('click', function (event) {
                var par = $(event.target).closest('.add_input_field');
                if (par.length) {
                    $(par).siblings().each(function (ind, elm) {
                        search_add_input_close(this);
                    });
                } else {
                    $(document).find('.add_input_field .add_ids_list.havezic-active').parents().eq(1).each(function (ind, elm) {
                        search_add_input_close(this);
                    });
                }
            });

            function search_add_input_toggle(item) {
                $(item).parent().find('.add_ids_list').toggleClass('havezic-active');
                $(item).parent().find('.add_ids_title .js-havezic-icon').toggleClass('active');
            }

            function search_add_input_close(item) {
                $(item).find('.add_ids_list').removeClass('havezic-active');
                $(item).parent().find('.add_ids_title .js-havezic-icon').toggleClass('active');
            }

            function search_add_list_open(item) {
                $(item).parent().find('.add_ids_title .js-havezic-icon').toggleClass('active');
            }

            function search_add_list_close(item) {
                $(item).parent().find('.add_ids_title .js-havezic-icon').toggleClass('active');
            }

            $('#date_from.search_date').on('show.daterangepicker', function () {

                let $parret = $(this).closest('.field-search-group');
                if ($parret) {
                    $('.daterangepicker').css({
                        marginLeft: - ($(this).offset().left - $parret.offset().left)
                    })
                }

            });

            $('#date_from.search_date').on('apply.daterangepicker', function(ev, picker) {
                $(this).siblings('.date-value').html(picker.startDate.format('<b>DD</b> MMM YYYY'));
                $('#date_to.search_date').siblings('.date-value').html(picker.endDate.format('<b>DD</b> MMM YYYY'));
            });

        });
    });

})(jQuery);
