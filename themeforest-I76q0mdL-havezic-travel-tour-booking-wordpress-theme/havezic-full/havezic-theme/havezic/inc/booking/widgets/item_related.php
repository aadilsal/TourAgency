<?php

use Elementor\Controls_Manager;

/**
 * Add widget all-items to Elementor
 *
 * @since   1.3.13
 */
class Havezic_BABE_Elementor_Itemrelated_Widget extends Havezic_Base_Widgets_Swiper {

    /**
     * Get widget name.
     *
     * @return string Widget name.
     */
    public function get_name() {
        return 'babe-item-related';
    }

    /**
     * Get widget title.
     *
     * @return string Widget title.
     */
    public function get_title() {
        return esc_html__('Detail Related items', 'havezic');
    }

    /**
     * Get widget icon.
     *
     * @return string Widget icon.
     */
    public function get_icon() {
        return 'eicon-product-related';
    }

    /**
     * Get widget keywords.
     *
     * Retrieve the list of keywords the widget belongs to.
     *
     * @return array Widget keywords.
     */
    public function get_keywords() {
        return ['related', 'upsales'];
    }

    public function get_style_depends() {
        return ['magnific-popup'];
    }

    public function get_script_depends() {
        return ['havezic-ba-item-related.js', 'magnific-popup', 'havezic-ba-ba-items.js', 'havezic-elementor-swiper'];
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
            'section_query',
            [
                'label' => esc_html__('Settings', 'havezic'),
            ]
        );

        $this->add_responsive_control(
            'column',
            [
                'label'           => esc_html__('Columns', 'havezic'),
                'type'            => \Elementor\Controls_Manager::SELECT,
                'desktop_default' => 2,
                'tablet_default'  => 2,
                'mobile_default'  => 1,
                'options'         => [1 => 1, 2 => 2, 3 => 3, 4 => 4],
                'selectors'       => [
                    '{{WRAPPER}} .d-grid' => 'grid-template-columns: repeat({{VALUE}}, 1fr)',
                ],
                'condition'       => [
                    'enable_carousel!' => 'yes',
                ]

            ]
        );

        $this->add_responsive_control(
            'item_spacing',
            [
                'label'      => esc_html__('Spacing', 'havezic'),
                'type'       => \Elementor\Controls_Manager::SLIDER,
                'range'      => [
                    'px' => [
                        'min' => 0,
                        'max' => 100,
                    ],
                ],
                'default'    => [
                    'size' => 30
                ],
                'size_units' => ['px', 'em'],
                'selectors'  => [
                    '{{WRAPPER}} .d-grid' => 'grid-gap:{{SIZE}}{{UNIT}}',
                ],
                'condition'  => [
                    'enable_carousel!' => 'yes',
                ]
            ]
        );

        $this->add_control(
            'style',
            [
                'label'   => esc_html__('Style', 'havezic'),
                'type'    => \Elementor\Controls_Manager::SELECT,
                'default' => 1,
                'options' => [
                    1 => esc_html__('Style 1', 'havezic'),
                    2 => esc_html__('Style 2', 'havezic'),
                    3 => esc_html__('Style 3', 'havezic'),
                    4 => esc_html__('Style 4', 'havezic'),
                ],
            ]
        );

        $this->add_control(
            'enable_carousel',
            [
                'label' => esc_html__('Enable Carousel', 'havezic'),
                'type'  => Controls_Manager::SWITCHER,
            ]
        );

        $this->end_controls_section();
        $this->add_control_carousel(['enable_carousel' => 'yes']);
    }


    /**
     * Render widget output on the frontend.
     * Written in PHP and used to generate the final HTML.
     */
    protected function render() {
        include get_theme_file_path('template-parts/booking/single/related.php');
        $this->render_swiper_pagination_navigation();
    }

}

$widgets_manager->register(new Havezic_BABE_Elementor_Itemrelated_Widget());