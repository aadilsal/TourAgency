<?php
$theme          = wp_get_theme('havezic');
define( 'HAVEZIC_VERSION', $theme['Version'] );

if ( ! isset( $content_width ) ) $content_width = 900;

require_once get_theme_file_path('inc/class-tgm-plugin-activation.php');
require_once get_theme_file_path('inc/class-main.php');
require_once get_theme_file_path('inc/functions.php');
require_once get_theme_file_path('inc/template-hooks.php');
require_once get_theme_file_path('inc/template-functions.php');

require_once get_theme_file_path('inc/merlin/vendor/autoload.php');
require_once get_theme_file_path('inc/merlin/class-merlin.php');
require_once get_theme_file_path('inc/merlin-config.php');

require_once get_theme_file_path('inc/class-customize.php');

if (havezic_is_elementor_activated()) {
    require_once get_theme_file_path('inc/elementor/functions-elementor.php');
    require_once get_theme_file_path('inc/elementor/class-elementor.php');
    require_once get_theme_file_path('inc/megamenu/megamenu.php');
    require_once get_theme_file_path('inc/elementor/section-parallax.php');

    require_once get_theme_file_path('inc/elementor/elementor-control/class-elementor-control.php');
    require_once get_theme_file_path('inc/merlin/theme-builder/theme-builder.php');
    if (defined('ELEMENTOR_PRO_VERSION')) {
        require_once get_theme_file_path('inc/elementor/class-elementor-pro.php');
    }

}

if (havezic_is_ba_booking_activated()) {
    require_once get_theme_file_path('inc/booking/class-ba.php');

    require_once get_theme_file_path('inc/booking/ba-template-functions.php');
    require_once get_theme_file_path('inc/booking/ba-template-hooks.php');
    require_once get_theme_file_path('inc/booking/ba-reviews.php');
    require_once get_theme_file_path('inc/booking/ba-wishlist.php');
}

if (!is_user_logged_in()) {
    require_once get_theme_file_path('inc/modules/class-login.php');
}else {
    require_once get_theme_file_path('inc/modules/media-custom-field.php');
}