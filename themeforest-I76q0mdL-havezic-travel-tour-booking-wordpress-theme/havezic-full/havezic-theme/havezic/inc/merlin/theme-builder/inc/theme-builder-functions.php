<?php
/**
 * Header Footer Elementor Function
 *
 * @package  header-footer-elementor
 */

/**
 * Checks if Header is enabled from THEME_BUILDER.
 *
 * @return bool True if header is enabled. False if header is not enabled
 * @since  1.0.0
 */
function etb_header_enabled() {
    $header_id = ETB_Elementor::get_settings('type_header', '');
    $status    = false;

    if ('' !== $header_id) {
        $status = true;
    }

    return apply_filters('etb_header_enabled', $status);
}

/**
 * Checks if Header is enabled from THEME_BUILDER.
 *
 * @return bool True if header is enabled. False if header is not enabled
 * @since  1.0.0
 */
function etb_after_header_enabled() {
    $after_header_id = ETB_Elementor::get_settings('type_after_header', '');
    $status          = false;

    if ('' !== $after_header_id) {
        $status = true;
    }

    return apply_filters('etb_after_header_enabled', $status);
}

/**
 * Checks if Footer is enabled from THEME_BUILDER.
 *
 * @return bool True if header is enabled. False if header is not enabled.
 * @since  1.0.0
 */
function etb_footer_enabled() {
    $footer_id = ETB_Elementor::get_settings('type_footer', '');
    $status    = false;

    if ('' !== $footer_id) {
        $status = true;
    }

    return apply_filters('etb_footer_enabled', $status);
}

/**
 * Get THEME_BUILDER Header ID
 *
 * @return (String|boolean) header id if it is set else returns false.
 * @since  1.0.0
 */
function get_etb_header_id() {
    $header_id = ETB_Elementor::get_settings('type_header', '');

    if ('' === $header_id) {
        $header_id = false;
    }

    return apply_filters('get_etb_header_id', $header_id);
}

/**
 * Get THEME_BUILDER Header ID
 *
 * @return (String|boolean) header id if it is set else returns false.
 * @since  1.0.0
 */
function get_etb_after_header_id() {
    $after_header_id = ETB_Elementor::get_settings('type_after_header', '');

    if ('' === $after_header_id) {
        $after_header_id = false;
    }

    return apply_filters('get_etb_after_header_id', $after_header_id);
}

/**
 * Get THEME_BUILDER Footer ID
 *
 * @return (String|boolean) header id if it is set else returns false.
 * @since  1.0.0
 */
function get_etb_footer_id() {
    $footer_id = ETB_Elementor::get_settings('type_footer', '');

    if ('' === $footer_id) {
        $footer_id = false;
    }

    return apply_filters('get_etb_footer_id', $footer_id);
}

/**
 * Display header markup.
 *
 * @since  1.0.0
 */
function etb_render_header() {

    if (false == apply_filters('enable_etb_render_header', true)) {
        return;
    }

    ?>
    <header id="masthead" itemscope="itemscope" itemtype="https://schema.org/WPHeader">
        <?php ETB_Elementor::get_header_content(); ?>
    </header>

    <?php

}

/**
 * Display header markup.
 *
 * @since  1.0.0
 */
function etb_render_after_header() {

    if (false == apply_filters('enable_etb_render_after_header', true)) {
        return;
    }

    ?>

    <?php ETB_Elementor::get_after_header_content(); ?>

    <?php

}

/**
 * Display footer markup.
 *
 * @since  1.0.0
 */
function etb_render_footer() {

    if (false == apply_filters('enable_etb_render_footer', true)) {
        return;
    }

    ?>
    <footer itemtype="https://schema.org/WPFooter" itemscope="itemscope" id="colophon" role="contentinfo">
        <?php ETB_Elementor::get_footer_content(); ?>
    </footer>
    <?php

}


/**
 * Get THEME_BUILDER Before Footer ID
 *
 * @return String|boolean before footer id if it is set else returns false.
 * @since  1.0.0
 */
function etb_get_before_footer_id() {

    $before_footer_id = ETB_Elementor::get_settings('type_before_footer', '');

    if ('' === $before_footer_id) {
        $before_footer_id = false;
    }

    return apply_filters('get_etb_before_footer_id', $before_footer_id);
}

/**
 * Checks if Before Footer is enabled from THEME_BUILDER.
 *
 * @return bool True if before footer is enabled. False if before footer is not enabled.
 * @since  1.0.0
 */
function etb_is_before_footer_enabled() {

    $before_footer_id = ETB_Elementor::get_settings('type_before_footer', '');
    $status           = false;

    if ('' !== $before_footer_id) {
        $status = true;
    }

    return apply_filters('etb_before_footer_enabled', $status);
}

/**
 * Display before footer markup.
 *
 * @since  1.0.0
 */
function etb_render_before_footer() {

    if (false == apply_filters('enable_etb_render_before_footer', true)) {
        return;
    }

    ?>
    <div class="theme-builder-before-footer-wrap">
        <?php ETB_Elementor::get_before_footer_content(); ?>
    </div>
    <?php

}


/**
 * Get THEME_BUILDER Single ID
 *
 * @return String|boolean single id if it is set else returns false.
 * @since  1.0.0
 */
function etb_get_single_id() {

    $single_id = ETB_Elementor::get_settings('type_single', '');

    if ('' === $single_id) {
        $single_id = false;
    }

    return apply_filters('etb_get_single_id', $single_id);
}

/**
 * Checks if Single is enabled from THEME_BUILDER.
 *
 * @return bool True if single is enabled. False if single is not enabled.
 * @since  1.0.0
 */
function etb_single_enabled() {

    $single_id = ETB_Elementor::get_settings('type_single', '');
    $status    = false;

    if ('' !== $single_id) {
        $status = true;
    }

    return apply_filters('etb_single_enabled', $status);
}

/**
 * Display single markup.
 *
 * @since  1.0.0
 */
function etb_render_single() {

    if (false == apply_filters('enable_etb_render_single', true)) {
        return;
    }

    ?>
    <?php ETB_Elementor::get_single_content(); ?>
    <?php

}


/**
 * Get THEME_BUILDER Archive ID
 *
 * @return String|boolean Archive id if it is set else returns false.
 * @since  1.0.0
 */
function etb_get_archive_id() {

    $archive_id = ETB_Elementor::get_settings('type_archive', '');

    if ('' === $archive_id) {
        $archive_id = false;
    }

    return apply_filters('etb_get_archive_id', $archive_id);
}

/**
 * Checks if Archive is enabled from THEME_BUILDER.
 *
 * @return bool True if archive is enabled. False if archive is not enabled.
 * @since  1.0.0
 */
function etb_archive_enabled() {

    $archive_id = ETB_Elementor::get_settings('type_archive', '');
    $status    = false;

    if ('' !== $archive_id) {
        $status = true;
    }

    return apply_filters('etb_archive_enabled', $status);
}

/**
 * Display archive markup.
 *
 * @since  1.0.0
 */
function etb_render_archive() {

    if (false == apply_filters('enable_etb_render_archive', true)) {
        return;
    }

    ?>
    <?php ETB_Elementor::get_archive_content(); ?>
    <?php

}

if (!function_exists('havezic_svgs_upload_mimes')) {
    function havezic_svgs_upload_mimes($mimes) {
        if (current_user_can('edit_posts')) {
            $mimes['svg']  = 'image/svg+xml';
            $mimes['svgz'] = 'image/svg+xml';
        }
        return $mimes;
    }

    add_filter('upload_mimes', 'havezic_svgs_upload_mimes', 99);
}