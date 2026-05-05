<?php
if (!defined('ABSPATH')) {
    exit;
}

if (!class_exists('Havezic_BA_Booking_Reviews')) :
    class Havezic_BA_Booking_Reviews {


        public function __construct() {
            add_action('admin_init', array($this, 'settings_page_rating_criteria'), 10);
            add_filter('babe_sanitize_' . BABE_Settings::$option_name, array($this, 'sanitize_settings'), 10, 2);
            add_filter('babe_init_rating_criteria', array($this, 'init_rating_criteria_filter'), 10, 1);
        }

        public function babe_init_rating_criteria() {

            $rating_criteria_arr['location']  = esc_html__('Location', 'havezic');
            $rating_criteria_arr['amenities'] = esc_html__('Amenities', 'havezic');
            $rating_criteria_arr['services']  = esc_html__('Services', 'havezic');
            $rating_criteria_arr['price']     = esc_html__('Price', 'havezic');
            $rating_criteria_arr['rooms']     = esc_html__('Rooms', 'havezic');

            return $rating_criteria_arr;
        }

        public function init_rating_criteria_filter($rating_criteria_arr) {
            if (isset(BABE_Settings::$settings['criteria_arr']) && BABE_Settings::$settings['criteria_arr']) {
                $selected_criteria_arr = BABE_Settings::$settings['criteria_arr'];
                $rating_criteria_arr   = $this->babe_init_rating_criteria();
                $results               = [];
                if ($selected_criteria_arr && is_array($selected_criteria_arr)) {
                    foreach ($selected_criteria_arr as $value) {
                        if (array_key_exists($value, $rating_criteria_arr)) {
                            $results[$value] = $rating_criteria_arr[$value];
                        }
                    }
                }

                return $results;
            }

        }

        public function settings_page_rating_criteria() {

            add_settings_field(
                'criteria_arr', // ID
                __('Rating Criteria List', 'havezic'), // Title
                array($this, 'rating_criteria_checkbox_element_callback'), // Callback
                BABE_Settings::$option_menu_slug, // Page
                'setting_section_general',  // Section
                array('option' => 'criteria_arr', 'settings_name' => BABE_Settings::$option_name) // Args array
            );
        }

        public function rating_criteria_checkbox_element_callback($args) {
            if (isset(BABE_Settings::$settings['criteria_arr']) && BABE_Settings::$settings['criteria_arr']) {
                $selected_criteria_arr = BABE_Settings::$settings['criteria_arr'];
            } else {
                $selected_criteria_arr = [];
            }
            $rating_criteria_arr = $this->babe_init_rating_criteria();
            $output              = '';
            $i                   = 1;
            foreach ($rating_criteria_arr as $item => $value) {
                $checked = in_array($item, $selected_criteria_arr) ? ' checked="checked"' : '';

                $output .= '<span><input type="checkbox" id="' . $args['option'] . $i . '" name="' . $args['settings_name'] . '[' . $args['option'] . '][]" value="' . $item . '" ' . $checked . '/>';
                $output .= '<label for="checkbox_example">' . $value . '</label></span>';
                $i++;
            }

            printf('%s', $output);

        }

        public function sanitize_settings($new_input, $input) {
            $rating_criteria_arr = isset($input['criteria_arr']) ? (array)$input['criteria_arr'] : array('location', 'amenities', 'services', 'price', 'rooms');

            foreach ($rating_criteria_arr as $value) {
                $new_input['criteria_arr'][] = $value;
            }

            return $new_input;
        }
    }
endif;

return new Havezic_BA_Booking_Reviews();
