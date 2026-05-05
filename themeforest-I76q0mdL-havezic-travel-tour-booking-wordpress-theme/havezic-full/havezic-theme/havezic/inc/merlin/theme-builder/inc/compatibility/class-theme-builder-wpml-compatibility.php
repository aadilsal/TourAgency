<?php
defined('ABSPATH') or exit;

/**
 * Set up WPML Compatibiblity Class.
 */
class ETB_WPML_Compatibility {

    /**
     * Instance of ETB_WPML_Compatibility.
     *
     * @since  1.0.9
     * @var null
     */
    private static $_instance = null;

    /**
     * Get instance of ETB_WPML_Compatibility
     *
     * @return ETB_WPML_Compatibility
     * @since  1.0.9
     */
    public static function instance() {
        if (!isset(self::$_instance)) {
            self::$_instance = new self();
        }

        return self::$_instance;
    }

    /**
     * Setup actions and filters.
     *
     * @since  1.0.9
     */
    private function __construct() {
        add_filter('etb_get_settings_type_header', [$this, 'get_wpml_object']);
        add_filter('etb_get_settings_type_after_header', [$this, 'get_wpml_object']);
        add_filter('etb_get_settings_type_footer', [$this, 'get_wpml_object']);
        add_filter('etb_get_settings_type_before_footer', [$this, 'get_wpml_object']);
        add_filter('etb_get_settings_type_archive', [$this, 'get_wpml_object']);
        add_filter('etb_get_settings_type_single', [$this, 'get_wpml_object']);
        add_filter('etb_render_template_id', [$this, 'get_wpml_object']);
    }

    /**
     * Pass the final header and footer ID from the WPML's object filter to allow strings to be translated.
     *
     * @param Int $id Post ID of the template being rendered.
     * @return Int $id  Post ID of the template being rendered, Passed through the `wpml_object_id` id.
     * @since  1.0.9
     */
    public function get_wpml_object($id) {
        $translated_id = apply_filters('wpml_object_id', $id);

        if (defined('POLYLANG_BASENAME')) {

            if (null === $translated_id) {

                // The current language is not defined yet or translation is not available.
                return $id;
            } else {

                // Return translated post ID.
                return $translated_id;
            }
        }

        if (null === $translated_id) {
            $translated_id = '';
        }

        return $translated_id;
    }
}

/**
 * Initiate the class.
 */
ETB_WPML_Compatibility::instance();
