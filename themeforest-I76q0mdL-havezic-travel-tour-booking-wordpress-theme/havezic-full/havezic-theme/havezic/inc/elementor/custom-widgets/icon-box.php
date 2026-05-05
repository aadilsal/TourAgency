<?php
// Icon Box
use Elementor\Controls_Manager;
add_action( 'elementor/element/icon-box/section_style_icon/before_section_end', function ( $element, $args ) {
    $element->add_control(
        'icon_style_theme',
        [
            'label' => esc_html__('Theme Style', 'havezic'),
            'type' => Controls_Manager::SWITCHER,
            'default' => '',
            'prefix_class' => 'icon-box-style-havezic-',
        ]
    );
    $element->add_control(
        'border_color_normal',
        [
            'label'     => esc_html__('Color Normal', 'havezic'),
            'type'      => Controls_Manager::COLOR,
            'default'   => '',
            'selectors' => [
                '{{WRAPPER}} .elementor-icon-box-wrapper .elementor-icon:before' => 'border-color: {{VALUE}};',
            ],
            'condition' => [
                'icon_style_theme' => 'yes',
            ],
        ]
    );
    $element->add_control(
        'border_color_hover',
        [
            'label'     => esc_html__('Color Hover', 'havezic'),
            'type'      => Controls_Manager::COLOR,
            'default'   => '',
            'selectors' => [
                '{{WRAPPER}} .elementor-icon-box-wrapper:hover .elementor-icon:before' => 'border-color: {{VALUE}};',
            ],
            'condition' => [
                'icon_style_theme' => 'yes',
            ],
        ]
    );
    $element->add_control(
        'padding_style_theme',
        [
            'label' => esc_html__( 'Padding', 'havezic' ),
            'type' => Controls_Manager::SLIDER,
            'size_units' => [ 'px', 'custom' ],
            'range' => [
                'px' => [
                    'min' => 0,
                    'max' => 5,
                ],
            ],
            'selectors' => [
                '{{WRAPPER}} ' => '--size-icon: {{SIZE}}{{UNIT}};',
            ],
            'condition' => [
                'icon_style_theme' => 'yes',
            ],
        ]
    );

}, 10, 2 );
