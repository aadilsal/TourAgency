<?php

namespace Elementor;

use Havezic_Base_Widgets_Swiper;

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
class Havezic_Elementor_Slider_Template extends Havezic_Base_Widgets_Swiper {

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
        return 'havezic-slider-template';
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
        return esc_html__('Havezic Slider Template', 'havezic');
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
        return 'eicon-slider-3d';
    }

    public function get_script_depends() {
        return ['havezic-elementor-slider-template', 'havezic-elementor-swiper'];
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

        $templates = Plugin::instance()->templates_manager->get_source('local')->get_items();

        $options = [
            '0' => '— ' . esc_html__('Select', 'havezic') . ' —',
        ];

        foreach ($templates as $template) {
            $options[$template['template_id']] = $template['title'] . ' (' . $template['type'] . ')';
        }

        $this->start_controls_section(
            'section_slider',
            [
                'label' => esc_html__('Slider', 'havezic'),
            ]
        );

        $this->add_responsive_control(
            'column',
            [
                'label'   => esc_html__('Columns', 'havezic'),
                'type'    => \Elementor\Controls_Manager::SELECT,
                'default' => 1,
                'options' => [1 => 1, 2 => 2, 3 => 3],
            ]
        );

        $repeater = new Repeater();

        $repeater->add_control(
            'title',
            [
                'label'       => esc_html__('Title', 'havezic'),
                'type'        => Controls_Manager::TEXT,
                'label_block' => true,
            ]
        );


        $repeater->add_control(
            'template',
            [
                'label'       => esc_html__('Choose Template', 'havezic'),
                'default'     => 0,
                'type'        => Controls_Manager::SELECT,
                'options'     => $options,
                'label_block' => true,
            ]
        );
        $this->add_control(
            'sliders',
            [
                'label'       => '',
                'type'        => Controls_Manager::REPEATER,
                'fields'      => $repeater->get_controls(),
                'title_field' => '{{{ title }}}',
            ]
        );

        $this->add_control(
            'enable_carousel',
            [
                'label'   => esc_html__('Enable Carousel', 'havezic'),
                'type'    => Controls_Manager::SWITCHER,
                'default' => 'yes'
            ]
        );

        $this->end_controls_section();

        $this->add_control_carousel(['enable_carousel' => 'yes']);
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
        $settings = $this->get_settings_for_display();
        $this->get_data_elementor_columns();
        ?>
        <div <?php $this->print_render_attribute_string('wrapper'); ?>>
            <div <?php $this->print_render_attribute_string('row'); ?>>
                <?php foreach ($settings['sliders'] as $item) {
                    ?>
                    <div <?php $this->print_render_attribute_string('item'); // WPCS: XSS ok. ?>>
                        <?php
                        echo Plugin::instance()->frontend->get_builder_content_for_display($item['template']);
                        ?>
                    </div>
                    <?php
                } ?>
            </div>
        </div>
        <?php
        $this->render_swiper_pagination_navigation();
        ?>
        <?php
    }
}

$widgets_manager->register(new Havezic_Elementor_Slider_Template());
