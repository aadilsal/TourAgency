<?php
// Icon Box
use Elementor\Controls_Manager;
use Elementor\Core\Kits\Documents\Tabs\Global_Colors;

add_action( 'elementor/element/icon/section_style_icon/before_section_end', function ( $element, $args ) {
    $element->update_control(
        'primary_color',
        [
            'label' => esc_html__( 'Primary Color', 'havezic' ),
            'type' => Controls_Manager::COLOR,
            'default' => '',
            'selectors' => [
                '{{WRAPPER}}.elementor-view-stacked .elementor-icon' => 'background-color: {{VALUE}};',
                '{{WRAPPER}}.elementor-view-framed .elementor-icon, {{WRAPPER}}.elementor-view-default .elementor-icon' => 'color: {{VALUE}};',
                '{{WRAPPER}}.elementor-view-framed .elementor-icon, {{WRAPPER}}.elementor-view-default .elementor-icon svg' => 'fill: {{VALUE}};',
            ],
            'global' => [
                'default' => Global_Colors::COLOR_PRIMARY,
            ],
        ]
    );

    $element->update_control(
        'hover_primary_color',
        [
            'label' => esc_html__( 'Primary Color', 'havezic' ),
            'type' => Controls_Manager::COLOR,
            'default' => '',
            'selectors' => [
                '{{WRAPPER}}.elementor-view-stacked .elementor-icon:hover' => 'background-color: {{VALUE}};',
                '{{WRAPPER}}.elementor-view-framed .elementor-icon:hover, {{WRAPPER}}.elementor-view-default .elementor-icon:hover' => 'color: {{VALUE}};',
                '{{WRAPPER}}.elementor-view-framed .elementor-icon:hover, {{WRAPPER}}.elementor-view-default .elementor-icon:hover svg' => 'fill: {{VALUE}};',
            ],
        ]
    );

}, 10, 2 );

add_action( 'elementor/element/icon/section_style_icon/before_section_end', function ( $element, $args ) {
    $element->add_control(
        'border_color',
        [
            'label' => esc_html__( 'border Color', 'havezic' ),
            'type' => Controls_Manager::COLOR,
            'default' => '',
            'selectors' => [
                '{{WRAPPER}}.elementor-view-framed .elementor-icon, {{WRAPPER}}.elementor-view-default .elementor-icon' => 'border-color: {{VALUE}};',
            ],

        ]
    );
    $element->add_control(
        'border_color_hover',
        [
            'label' => esc_html__( 'border Color Hover', 'havezic' ),
            'type' => Controls_Manager::COLOR,
            'default' => '',
            'selectors' => [
                '{{WRAPPER}}.elementor-view-framed .elementor-icon:hover, {{WRAPPER}}.elementor-view-default .elementor-icon:hover' => 'border-color: {{VALUE}};',
                '{{WRAPPER}} .elementor-icon' => '--border-color-hover: {{VALUE}};',
            ],

        ]
    );

    $element->add_control(
        'border_style_theme',
        [
            'label' => esc_html__('border Style', 'havezic'),
            'type' => Controls_Manager::SWITCHER,
            'default' => '',
            'prefix_class' => 'icon-style-havezic-',

            'condition' => [
                'shape' => 'circle',
            ],
        ]
    );


    $element->add_control(
        'border_width_hover',
        [
            'label' => esc_html__( 'border width hover', 'havezic' ),
            'type' => Controls_Manager::SLIDER,
            'size_units' => [ 'px', '%', 'em', 'rem', 'custom' ],
            'selectors' => [
                '{{WRAPPER}} .elementor-icon' => '--border-width-hover: {{SIZE}}{{UNIT}};',
            ],
            'range' => [
                'px' => [
                    'max' => 50,
                ],
                'em' => [
                    'min' => 0,
                    'max' => 5,
                ],
                'rem' => [
                    'min' => 0,
                    'max' => 5,
                ],
            ],
            'condition' => [
                'shape' => 'circle',
                'border_style_theme' => 'yes',
            ],
        ]
    );

}, 10, 2 );
