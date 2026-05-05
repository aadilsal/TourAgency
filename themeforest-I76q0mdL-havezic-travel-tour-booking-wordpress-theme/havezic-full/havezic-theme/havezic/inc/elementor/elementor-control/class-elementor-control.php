<?php

if (!defined('ABSPATH')) {
    exit;
}

if (!class_exists('Postero_Elementor_Control')) :

    /**
     * The Postero Elementor Integration class
     */
    class Postero_Elementor_Control {

        public function __construct() {

            add_action('elementor/ajax/register_actions', [$this, 'register_ajax_actions']);
            add_action('elementor/controls/controls_registered', [$this, 'on_controls_registered']);
        }

        public function ajax_posts_filter_autocomplete(array $data) {
            if ( empty( $data['q'] ) ) {
                throw new \Exception( 'Bad Request' );
            }

            $results = [];

            $query_params = [
                'post_type' => 'havezic_offer',
                's' => $data['q'],
                'posts_per_page' => -1,
            ];

            $query = new WP_Query( $query_params );

            foreach ( $query->posts as $post ) {

                $results[] = [
                    'id' => $post->ID,
                    'text' => esc_html( $post->post_title ),
                ];
            }

            return [
                'results' => $results,
            ];
        }

        public function ajax_query_control_value_offer($request) {
            $ids = (array) $request['id'];

            $results = [];
            $query = new \WP_Query(
                [
                    'post_type' => 'any',
                    'post__in' => $ids,
                    'posts_per_page' => -1,
                ]
            );

            foreach ( $query->posts as $post ) {
                $results[ $post->ID ] = esc_html( $post->post_title );
            }
            return $results;
        }

        public function register_ajax_actions($ajax_manager) {
            $ajax_manager->register_ajax_action('panel_posts_control_filter_offer', [$this, 'ajax_posts_filter_autocomplete']);
            $ajax_manager->register_ajax_action('query_control_value_offer', [$this, 'ajax_query_control_value_offer']);
        }

        public function on_controls_registered() {
            $this->register_control();
        }

        private function register_control() {
            require get_theme_file_path('inc/elementor/elementor-control/offer-control.php');
            $controls_manager = \Elementor\Plugin::instance()->controls_manager;
            $controls_manager->register( new Offers_Control());
        }

    }

endif;

return new Postero_Elementor_Control();
