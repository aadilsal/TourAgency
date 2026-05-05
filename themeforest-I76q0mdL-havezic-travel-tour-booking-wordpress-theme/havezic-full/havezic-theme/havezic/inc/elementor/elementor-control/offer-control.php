<?php

/**
 * Producta_Control control.
 *
 */
class Offers_Control extends \Elementor\Control_Select2 {

    public function get_type() {
        return 'offers';
    }

    public function enqueue() {

        wp_register_script('elementor-offers-control', get_theme_file_uri('/inc/elementor/elementor-control/select2.js'), ['jquery'], HAVEZIC_VERSION, true);
        wp_enqueue_script('elementor-offers-control');
    }
}
