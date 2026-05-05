<?php

use Elementor\Controls_Manager;
use Elementor\Group_Control_Css_Filter;

/**
 * Add widget all-items to Elementor
 *
 * @since   1.3.13
 */
class Havezic_Elementor_BA_Item_Iframe_Maps extends \Elementor\Widget_Base {
    /**
     * Get widget name.
     *
     * @return string Widget name.
     */
    public function get_name() {
        return 'babe-item-iframe-maps';
    }

    /**
     * Get widget title.
     *
     * @return string Widget title.
     */
    public function get_title() {
        return esc_html__('BA Item Iframe Maps', 'havezic');
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
        $settings = $this->get_settings_for_display();
        if (\Elementor\Plugin::instance()->editor->is_edit_mode()) {
            $post_id = havezic_ba_get_default_single_id();
        } else {
            $post_id = get_the_ID();
        }
        $babe_post = get_post($post_id);

        if (is_single() && $babe_post->post_type == BABE_Post_types::$booking_obj_post_type) {
            $babe_post = BABE_Post_types::get_post($babe_post->ID);
            $this->render_map_content($babe_post);
        }
    }

    private function render_map_content($babe_post) {
        $post_data     = isset($babe_post['havezic_map_iframe']) ? $babe_post['havezic_map_iframe'] : false;
        if ($post_data && !empty($post_data)) {
            echo wp_kses($post_data, array(
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

$widgets_manager->register(new Havezic_Elementor_BA_Item_Iframe_Maps());
