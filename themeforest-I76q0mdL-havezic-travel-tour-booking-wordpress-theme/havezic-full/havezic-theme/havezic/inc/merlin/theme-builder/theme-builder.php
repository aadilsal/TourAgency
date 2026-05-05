<?php

define('OPAL_BUILDER_DIR', trailingslashit( dirname( __FILE__ ) ));
define('OPAL_BUILDER_URL', get_template_directory_uri() . '/inc/merlin/theme-builder/');

/**
 * Load the class loader.
 */
require_once OPAL_BUILDER_DIR . '/inc/class-theme-builder-elementor.php';

ETB_Elementor::instance();
