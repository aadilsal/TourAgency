<?php

use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;

/**
 * Add widget all-items to Elementor
 *
 * @since   1.3.13
 */
class Havezic_Elementor_BA_Archive_Booking_Description_Info extends \Elementor\Widget_Base {
    /**
     * Get widget name.
     *
     * @return string Widget name.
     */
    public function get_name() {
        return 'babe-description-info';
    }

    /**
     * Get widget title.
     *
     * @return string Widget title.
     */
    public function get_title() {
        return esc_html__('BA Archive Description Info', 'havezic');
    }

    /**
     * Get widget categories.
     *
     * @return array Widget categories.
     */
    public function get_categories() {
        return ['book-everything-elements'];
    }

    protected function register_controls() {
        $this->start_controls_section(
            'babe_archive_des',
            array(
                'label' => esc_html__('Style', 'havezic'),
                'tab'   => \Elementor\Controls_Manager::TAB_STYLE,
            )
        );

        $this->add_control(
            'content_color',
            [
                'label'     => esc_html__('Color', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'default'   => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-widget-inner' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name'     => 'content_typography',
                'selector' => '{{WRAPPER}} .elementor-widget-inner',
            ]
        );


        $this->end_controls_section();

    }


    /**
     * Render widget output on the frontend.
     *
     * Written in PHP and used to generate the final HTML.
     *
     */
    protected function render() {

        if (\Elementor\Plugin::instance()->editor->is_edit_mode()) {
            echo esc_html__('BA Archive Description Info', 'havezic');
        } else {
            $object = get_queried_object();
            if (!empty($object) && (isset($object->taxonomy) && Havezic_BA_Booking::check_taxonomy($object->taxonomy))) {
                $this->render_taxonomy_content($object->term_id);
            }
        }
    }

    private function render_taxonomy_content($tax_ID) {
        $term_data = get_term_meta($tax_ID, 'havezic_description_info', true);
        if ($term_data && !empty($term_data)) {
            echo '<div class="elementor-widget-inner">';
            echo wp_kses_post(wpautop($term_data));
            echo '</div>';
        }
    }
}

$widgets_manager->register(new Havezic_Elementor_BA_Archive_Booking_Description_Info());
