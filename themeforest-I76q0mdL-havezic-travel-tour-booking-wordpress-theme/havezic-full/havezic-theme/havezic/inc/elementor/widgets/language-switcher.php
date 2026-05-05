<?php

use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}


/**
 * Elementor tabs widget.
 *
 * Elementor widget that displays vertical or horizontal tabs with different
 * pieces of content.
 *
 * @since 1.0.0
 */
class Havezic_Elementor_Language_Switcher extends Elementor\Widget_Base {

    public function get_categories() {
        return array('havezic-addons');
    }

    /**
     * Get widget name.
     *
     * Retrieve tabs widget name.
     *
     * @return string Widget name.
     * @since 1.0.0
     * @access public
     *
     */
    public function get_name() {
        return 'havezic-language-switcher';
    }

    /**
     * Get widget title.
     *
     * Retrieve tabs widget title.
     *
     * @return string Widget title.
     * @since 1.0.0
     * @access public
     *
     */
    public function get_title() {
        return esc_html__('Language Switcher', 'havezic');
    }

    /**
     * Get widget icon.
     *
     * Retrieve tabs widget icon.
     *
     * @return string Widget icon.
     * @since 1.0.0
     * @access public
     *
     */
    public function get_icon() {
        return 'eicon-global-settings';
    }

    public function get_script_depends() {
        return ['havezic-elementor-language-switcher'];
    }

    /**
     * Register tabs widget controls.
     *
     * Adds different input fields to allow the user to change and customize the widget settings.
     *
     * @since 1.0.0
     * @access protected
     */
    protected function register_controls() {

        $this->start_controls_section(
            'section_language_switcher',
            [
                'label' => esc_html__('Layout', 'havezic'),
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name'     => 'typography',
                'selector' => '{{WRAPPER}} .havezic-language-switcher span.title',
            ]
        );

        $this->start_controls_tabs('style_color');

        $this->start_controls_tab('typo_normal',
            [
                'label' => esc_html__('Normal', 'havezic'),
            ]
        );

        $this->add_control(
            'label_color',
            [
                'label'     => esc_html__('Label Color', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .item .sub-item span' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'title_color',
            [
                'label'     => esc_html__('Title Color', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .item > div span.title' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'icon_color',
            [
                'label'     => esc_html__('Icon Color', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .havezic-language-switcher .language-switcher-head:after' => 'color: {{VALUE}};',
                    '{{WRAPPER}} .havezic-language-switcher .language-switcher-head:before' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->end_controls_tab();

        $this->start_controls_tab('typo_hover',
            [
                'label' => esc_html__('Hover', 'havezic'),
            ]
        );

        $this->add_control(
            'title_color_hover',
            [
                'label'     => esc_html__('Title Color', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .item > div:hover span.title' => 'color: {{VALUE}};',
                    '{{WRAPPER}} .item > div:hover:after' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->end_controls_tab();

        $this->end_controls_tabs();

        $this->add_control(
            'trigger',
            [
                'label'        => esc_html__('Dropdown action', 'havezic'),
                'type'         => Controls_Manager::SELECT,
                'options'      => [
                    'hover' => esc_html__('Hover', 'havezic'),
                    'click' => esc_html__('Click', 'havezic'),
                ],
                'default'      => 'hover',
                'prefix_class' => 'language-switcher-action-',
            ]
        );

        $this->add_control(
            'dropdown_position',
            [
                'label'        => esc_html__('Dropdown position', 'havezic'),
                'type'         => Controls_Manager::SELECT,
                'options'      => [
                    'bottom_left'   => esc_html__('Bottom Left', 'havezic'),
                    'bottom_center' => esc_html__('Bottom Center', 'havezic'),
                    'bottom_right'  => esc_html__('Bottom Right', 'havezic'),
                    'top_left'      => esc_html__('Top Left', 'havezic'),
                    'top_center'    => esc_html__('Top Center', 'havezic'),
                    'top_right'     => esc_html__('Top Right', 'havezic'),
                ],
                'default'      => 'bottom_left',
                'prefix_class' => 'language-switcher-dropdown-position-',
            ]
        );


        $this->end_controls_section();


    }

    /**
     * Render tabs widget output on the frontend.
     *
     * Written in PHP and used to generate the final HTML.
     *
     * @since 1.0.0
     * @access protected
     */
    protected function render() {
        havezic_language_switcher();
    }
}

$widgets_manager->register(new Havezic_Elementor_Language_Switcher());

