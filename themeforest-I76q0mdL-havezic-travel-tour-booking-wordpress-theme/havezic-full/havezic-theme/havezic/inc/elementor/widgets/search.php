<?php

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;

class Havezic_Elementor_Search extends Elementor\Widget_Base {
    public function get_name() {
        return 'havezic-search';
    }

    public function get_title() {
        return esc_html__('Havezic Search Form', 'havezic');
    }

    public function get_icon() {
        return 'eicon-site-search';
    }

    public function get_categories() {
        return array('havezic-addons');
    }

    protected function register_controls() {
        $this->start_controls_section(
            'search-form-layout',
            [
                'label' => esc_html__('Layout', 'havezic'),
                'tab'   => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'layout_style',
            [
                'label'   => esc_html__('Layout', 'havezic'),
                'type'    => Controls_Manager::SELECT,
                'options' => [
                    'layout-1' => esc_html__('Layout 1', 'havezic'),
                    'layout-2' => esc_html__('Layout 2', 'havezic'),
                ],
                'default' => 'layout-1',
            ]
        );
        $this->end_controls_section();

        $this->start_controls_section(
            'search-form-input-style',
            [
                'label'     => esc_html__('Input', 'havezic'),
                'tab'       => Controls_Manager::TAB_STYLE,
                'condition' => [
                    'layout_style' => 'layout-1'
                ]
            ]
        );

        $this->add_responsive_control(
            'border_width',
            [
                'label'      => esc_html__('Border width', 'havezic'),
                'type'       => Controls_Manager::DIMENSIONS,
                'size_units' => ['px'],
                'selectors'  => [
                    '{{WRAPPER}} form input[type=search]' => 'border-width: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_control(
            'border_color',
            [
                'label'     => esc_html__('Border Color', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'default'   => '',
                'selectors' => [
                    '{{WRAPPER}} form input[type=search]' => 'border-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'border_color_focus',
            [
                'label'     => esc_html__('Border Color Focus', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'default'   => '',
                'selectors' => [
                    '{{WRAPPER}} form input[type=search]:focus' => 'border-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'background_form',
            [
                'label'     => esc_html__('Background Form', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'default'   => '',
                'selectors' => [
                    '{{WRAPPER}} form input[type=search]' => 'background: {{VALUE}};',
                ],
            ]
        );
        $this->add_control(
            'border_radius_input',
            [
                'label'      => esc_html__('Border Radius Input', 'havezic'),
                'type'       => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors'  => [
                    '{{WRAPPER}} .widget_product_search form input[type=search]' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );
        $this->end_controls_section();

        $this->start_controls_section(
            'search-form-button-style',
            [
                'label' => esc_html__('Button', 'havezic'),
                'tab'   => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'background_button',
            [
                'label'     => esc_html__('Background', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'default'   => '',
                'selectors' => [
                    '{{WRAPPER}} form button[type=submit]' => 'background: {{VALUE}};',
                ],
                'condition' => [
                    'layout_style' => 'layout-1'
                ]
            ]
        );
        $this->add_control(
            'background_button_hover',
            [
                'label'     => esc_html__('Background Hover', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'default'   => '',
                'selectors' => [
                    '{{WRAPPER}} form button[type=submit]:hover' => 'background: {{VALUE}};',
                ],
                'condition' => [
                    'layout_style' => 'layout-1'
                ]
            ]
        );

        $this->add_control(
            'button_text_color',
            [
                'label'     => esc_html__('Text Color', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'default'   => '',
                'selectors' => [
                    '{{WRAPPER}} form button[type=submit] span' => 'color: {{VALUE}};',
                ],
                'condition' => [
                    'layout_style' => 'layout-1'
                ]
            ]
        );
        $this->add_control(
            'button_text_color_hover',
            [
                'label'     => esc_html__('Text Color Hover', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'default'   => '',
                'selectors' => [
                    '{{WRAPPER}} form button[type=submit]:hover span' => 'color: {{VALUE}};',
                ],
                'condition' => [
                    'layout_style' => 'layout-1'
                ]
            ]
        );
        $this->add_control(
            'border_radius_button',
            [
                'label'      => esc_html__('Border Radius Button', 'havezic'),
                'type'       => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors'  => [
                    '{{WRAPPER}} .widget_product_search form button[type=submit]' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
                'condition'  => [
                    'layout_style' => 'layout-1'
                ]
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name'      => 'search_typography',
                'selector'  => '{{WRAPPER}} .content',
                'condition' => [
                    'layout_style' => 'layout-2'
                ]
            ]
        );

        $this->add_responsive_control(
            'icon_size',
            [
                'label'     => esc_html__('Icon size', 'havezic'),
                'type'      => Controls_Manager::SLIDER,
                'range'     => [
                    'px' => [
                        'min' => 0,
                        'max' => 100,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .site-header-search > a i' => 'font-size: {{SIZE}}{{UNIT}};',
                ],
                'condition' => [
                    'layout_style' => 'layout-2'
                ]
            ]
        );
        $this->add_responsive_control(
            'icon_spacing',
            [
                'label'     => esc_html__('Spacing', 'havezic'),
                'type'      => Controls_Manager::SLIDER,
                'range'     => [
                    'px' => [
                        'min' => 0,
                        'max' => 100,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .havezic-icon-search-3' => 'margin-right: {{SIZE}}{{UNIT}};',
                ],
                'condition' => [
                    'layout_style' => 'layout-2'
                ]
            ]
        );

        $this->end_controls_section();
    }

    protected function render() {
        $settings = $this->get_settings_for_display();

        if ($settings['layout_style'] === 'layout-1') {
            ?>
            <div class="site-search widget_search">
                <?php get_search_form(); ?>
            </div>
            <?php

        }

        if ($settings['layout_style'] === 'layout-2') {
            add_action('wp_footer', 'havezic_header_search_popup', 1);
            ?>
            <div class="site-header-search">
                <a href="#" class="button-search-popup">
                    <i class="havezic-icon-search-3"></i>
                    <span class="content"><?php echo esc_html__('Search', 'havezic'); ?></span>
                </a>
            </div>
            <?php
        }

    }
}

$widgets_manager->register(new Havezic_Elementor_Search());
