<?php
if (!defined('ABSPATH')) {
    exit;
}

if (!class_exists('Havezic_Elementor_Header_Settings')) :
    /**
     * The main Havezic_Elementor_Header_Settings class
     */
    class Havezic_Elementor_Header_Settings {
        public function __construct() {
            add_action('elementor/documents/register_controls', [$this, 'register_controls']);
            add_filter('elementor/document/wrapper_attributes', [$this, 'wrapper_attributes'], 10, 2);
        }

        public function register_controls($document) {
            $id = get_the_ID();
            if (get_post_type($id) === 'etb_library') {
                $document->start_injection([
                    'of'       => 'post_status',
                    'fallback' => [
                        'of' => 'post_title',
                    ],
                ]);
                $document->add_control(
                    'havezic_header_absolute_switch',
                    [
                        'label' => esc_html__('Header Absolute', 'havezic'),
                        'type'  => Elementor\Controls_Manager::SWITCHER,
                    ]
                );
                $document->end_injection();
            }
        }
        public function wrapper_attributes($attributes, $that) {
            $page_id = $that->get_main_id();
            $page_settings_manager = \Elementor\Core\Settings\Manager::get_settings_managers( 'page' );
            $page_settings_model = $page_settings_manager->get_model( $page_id );
            if (get_post_type($that->get_main_id()) === 'etb_library' && $page_settings_model->get_settings( 'havezic_header_absolute_switch' ) =='yes') {
                $attributes['class'] .= ' header-absolute';
            }
            return $attributes;
        }
    }
endif;

new Havezic_Elementor_Header_Settings();
