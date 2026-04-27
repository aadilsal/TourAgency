<?php
// nested-tabs
use Elementor\Controls_Manager;

add_action('elementor/element/nested-tabs/section_tabs_style/before_section_end', function ($element, $args) {
    /** @var \Elementor\Element_Base $element */


    $element->add_control(
        'enable_line',
        [
            'label' => esc_html__('Enable line', 'havezic'),
            'type'  => Controls_Manager::SWITCHER,
            'prefix_class' => 'enable-line-heading-',
        ]
    );

    $element->add_responsive_control(
        'line_spacing',
        [
            'label' => esc_html__('Line Spacing', 'havezic'),
            'type' => Controls_Manager::SLIDER,
            'default' => [
                'unit' => 'px',
            ],

            'size_units' => ['px'],
            'range' => [

                'px' => [
                    'min' => -100,
                    'max' => 100,
                ],
            ],

            'condition'  => [
                'enable_line' => 'yes',
            ],
            'selectors' => [
                '{{WRAPPER}} .e-n-tabs .e-n-tab-title .e-n-tab-title-text:after' => 'bottom: {{SIZE}}{{UNIT}};',
            ],
        ]
    );

    $element->add_responsive_control(
        'line_height',
        [
            'label' => esc_html__('Line Height', 'havezic'),
            'type' => Controls_Manager::SLIDER,
            'default' => [
                'unit' => 'px',
            ],

            'size_units' => ['px'],
            'range' => [

                'px' => [
                    'min' => 0,
                    'max' => 100,
                ],
            ],

            'condition'  => [
                'enable_line' => 'yes',
            ],

            'selectors' => [
                '{{WRAPPER}} .e-n-tabs .e-n-tab-title .e-n-tab-title-text:after' => 'height: {{SIZE}}{{UNIT}};',
            ],
        ]
    );

    $element->add_control(
        'line_color',
        [
            'label' => esc_html__( 'line Color', 'havezic' ),
            'type'      => Controls_Manager::COLOR,
            'condition'  => [
                'enable_line' => 'yes',
            ],
            'selectors' => [
                '{{WRAPPER}} .e-n-tabs .e-n-tab-title .e-n-tab-title-text:after' => 'background-color: {{VALUE}};',
            ],
        ]
    );

}, 10, 2);