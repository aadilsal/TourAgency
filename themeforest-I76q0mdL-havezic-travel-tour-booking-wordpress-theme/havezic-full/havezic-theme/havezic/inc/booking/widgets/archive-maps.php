<?php

use Elementor\Controls_Manager;
use Elementor\Group_Control_Css_Filter;

/**
 * Add widget all-items to Elementor
 *
 * @since   1.3.13
 */
class Havezic_Elementor_BA_Archive_Maps extends \Elementor\Widget_Base {
    /**
     * Get widget name.
     *
     * @return string Widget name.
     */
    public function get_name() {
        return 'babe-archive-maps';
    }

    /**
     * Get widget title.
     *
     * @return string Widget title.
     */
    public function get_title() {
        return esc_html__('BA Archive Maps', 'havezic');
    }

    /**
     * Get widget icon.
     *
     * Retrieve google maps widget icon.
     *
     * @return string Widget icon.
     * @since 1.0.0
     * @access public
     *
     */
    public function get_icon() {
        return 'eicon-google-maps';
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
            'section_map',
            [
                'label' => esc_html__('Google Maps', 'havezic'),
            ]
        );

        $this->add_responsive_control(
            'height',
            [
                'label'      => esc_html__('Height', 'havezic'),
                'type'       => Controls_Manager::SLIDER,
                'range'      => [
                    'px' => [
                        'min' => 40,
                        'max' => 1440,
                    ],
                ],
                'size_units' => ['px', 'em', 'rem', 'vh', 'custom'],
                'selectors'  => [
                    '{{WRAPPER}} iframe' => 'height: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_control(
            'iframe_radius',
            [
                'label'      => esc_html__('Border Radius', 'havezic'),
                'type'       => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors'  => [
                    '{{WRAPPER}} iframe' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};overflow: hidden;',
                ],
            ]
        );

        $this->end_controls_section();

        $this->start_controls_section(
            'section_map_style',
            [
                'label' => esc_html__('Google Maps', 'havezic'),
                'tab'   => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->start_controls_tabs('map_filter');

        $this->start_controls_tab('normal',
            [
                'label' => esc_html__('Normal', 'havezic'),
            ]
        );

        $this->add_group_control(
            Group_Control_Css_Filter::get_type(),
            [
                'name'     => 'css_filters',
                'selector' => '{{WRAPPER}} iframe',
            ]
        );

        $this->end_controls_tab();

        $this->start_controls_tab('hover',
            [
                'label' => esc_html__('Hover', 'havezic'),
            ]
        );

        $this->add_group_control(
            Group_Control_Css_Filter::get_type(),
            [
                'name'     => 'css_filters_hover',
                'selector' => '{{WRAPPER}}:hover iframe',
            ]
        );

        $this->add_control(
            'hover_transition',
            [
                'label'     => esc_html__('Transition Duration', 'havezic') . ' (s)',
                'type'      => Controls_Manager::SLIDER,
                'range'     => [
                    'px' => [
                        'min'  => 0,
                        'max'  => 3,
                        'step' => 0.1,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} iframe' => 'transition-duration: {{SIZE}}s',
                ],
            ]
        );

        $this->end_controls_tab();

        $this->end_controls_tabs();

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
            echo '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d24206.755197134677!2d-74.03665097155064!3d40.67739727353496!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c251435afe5fdd%3A0x961a3af922a7eeae!2sStatue%20of%20Liberty%20Museum!5e0!3m2!1svi!2s!4v1722927263902!5m2!1svi!2s" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>';
        } else {
            $object = get_queried_object();
            if (!empty($object) && (isset($object->taxonomy) && Havezic_BA_Booking::check_taxonomy($object->taxonomy))) {
                $this->render_taxonomy_content($object->term_id);
            }
        }
    }

    private function render_taxonomy_content($tax_ID) {
        $term_data = get_term_meta($tax_ID, 'havezic_map_iframe', true);
        if ($term_data && !empty($term_data)) {
            echo wp_kses($term_data, array(
                'iframe' => array(
                    'src'             => array(),
                    'width'           => array(),
                    'height'          => array(),
                    'frameborder'     => array(),
                    'allowfullscreen' => array(),
                    'loading'         => array()
                ),
            ));
        }
    }
}

$widgets_manager->register(new Havezic_Elementor_BA_Archive_Maps());
