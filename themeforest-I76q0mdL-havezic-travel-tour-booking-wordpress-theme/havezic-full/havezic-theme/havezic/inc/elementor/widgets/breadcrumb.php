<?php

use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class Havezic_Elementor_Breadcrumb extends Elementor\Widget_Base {

    public function get_name() {
        return 'havezic-breadcrumb';
    }

    public function get_title() {
        return esc_html__('Havezic Breadcrumbs', 'havezic');
    }

    public function get_icon() {
        return 'eicon-product-breadcrumbs';
    }

    public function get_keywords() {
        return ['breadcrumbs'];
    }

    public function get_categories() {
        return array('havezic-addons');
    }

    protected function register_controls() {

        $this->start_controls_section(
            'section_product_rating_style',
            [
                'label' => esc_html__('Style Breadcrumbs', 'havezic'),
                'tab'   => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'wc_style_warning',
            [
                'type'            => Controls_Manager::RAW_HTML,
                'raw'             => esc_html__('The style of this widget is often affected by your theme and plugins. If you experience any such issue, try to switch to a basic theme and deactivate related plugins.', 'havezic'),
                'content_classes' => 'elementor-panel-alert elementor-panel-alert-info',
            ]
        );

        $this->add_control(
            'text_color',
            [
                'label'     => esc_html__('Text Color', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} #breadcrumbs' => 'color: {{VALUE}}',
                ],
            ]
        );

        $this->add_control(
            'link_color',
            [
                'label'     => esc_html__('Link Color', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} #breadcrumbs a' => 'color: {{VALUE}}',
                ],
            ]
        );

        $this->add_control(
            'link_color_hover',
            [
                'label'     => esc_html__('Link Color Hover', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} #breadcrumbs a:hover' => 'color: {{VALUE}}',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name'     => 'text_typography',
                'selector' => '{{WRAPPER}} #breadcrumbs',
            ]
        );

        $this->add_responsive_control(
            'alignment',
            [
                'label'     => esc_html__('Alignment', 'havezic'),
                'type'      => Controls_Manager::CHOOSE,
                'options'   => [
                    'left'   => [
                        'title' => esc_html__('Left', 'havezic'),
                        'icon'  => 'eicon-text-align-left',
                    ],
                    'center' => [
                        'title' => esc_html__('Center', 'havezic'),
                        'icon'  => 'eicon-text-align-center',
                    ],
                    'right'  => [
                        'title' => esc_html__('Right', 'havezic'),
                        'icon'  => 'eicon-text-align-right',
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .breadcrumb'    => 'text-align: {{VALUE}}',
                    '{{WRAPPER}} .havezic-title' => 'text-align: {{VALUE}}',
                ],
            ]
        );

        $this->add_control(
            'display_link',
            [
                'label'        => esc_html__('Hidden Link', 'havezic'),
                'type'         => \Elementor\Controls_Manager::SWITCHER,
                'prefix_class' => 'hidden-havezic-link-',
            ]
        );

        $this->end_controls_section();

        $this->start_controls_section(
            'section_product_rating_style_title',
            [
                'label' => esc_html__('Style Title', 'havezic'),
                'tab'   => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'text_color_title',
            [
                'label'     => esc_html__('Title Color', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .havezic-title' => 'color: {{VALUE}}',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name'     => 'title_typography',
                'selector' => '{{WRAPPER}} .havezic-title',
            ]
        );

        $this->add_control(
            'display_title',
            [
                'label'        => esc_html__('Hidden Title', 'havezic'),
                'type'         => \Elementor\Controls_Manager::SWITCHER,
                'prefix_class' => 'hidden-havezic-title-',
            ]
        );

        $this->add_control(
            'display_title_single',
            [
                'label'        => esc_html__('Hidden Title Single', 'havezic'),
                'type'         => \Elementor\Controls_Manager::SWITCHER,
                'prefix_class' => 'hidden-havezic-title-single-'
            ]
        );

        $this->add_responsive_control(
            'title_margin',
            [
                'label'      => esc_html__('Margin', 'havezic'),
                'type'       => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%', 'em'],
                'selectors'  => [
                    '{{WRAPPER}} .havezic-title' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );


        $this->end_controls_section();
    }

    protected function render() {
        ?>
        <div class="breadcrumb" typeof="BreadcrumbList" vocab="https://schema.org/">
            <h1 class="havezic-title">
                <?php
                if (is_page() || is_single()) {
                    the_title();
                } elseif (is_archive() && is_tax() && !is_category() && !is_tag()) {
                    $tax_object = get_queried_object();
                    echo esc_html($tax_object->name);
                } elseif (is_category()) {
                    single_cat_title();
                } elseif (is_home()) {
                    echo esc_html__('Our Blog', 'havezic');
                } elseif (is_404()){
                    echo esc_html__('Error 404', 'havezic');
                } elseif (is_post_type_archive()) {
                    $tax_object = get_queried_object();
                    echo esc_html($tax_object->label);
                } elseif (is_tag()) {
                    // Get tag information
                    $term_id  = get_query_var('tag_id');
                    $taxonomy = 'post_tag';
                    $args     = 'include=' . esc_attr($term_id);
                    $terms    = get_terms($taxonomy, $args);
                    // Display the tag name
                    if (isset($terms[0]->name)) {
                        echo esc_html($terms[0]->name);
                    }
                } elseif (is_day()) {
                    echo esc_html__('Day Archives', 'havezic');
                } elseif (is_month()) {
                    echo get_the_time('F') . esc_html__(' Archives', 'havezic');
                } elseif (is_year()) {
                    echo get_the_time('Y') . esc_html__(' Archives', 'havezic');
                } elseif (is_search()) {
                    esc_html_e('Search Results', 'havezic');
                } elseif (is_author()) {
                    global $author;
                    if (!empty($author)) {
                        $usermetadata = get_userdata($author);
                        echo esc_html__('Author', 'havezic') . ': ' . $usermetadata->display_name;
                    }
                }
                ?>
            </h1>
            <?php
            if ( class_exists( '\WPSEO_Breadcrumbs' ) ) {
                WPSEO_Breadcrumbs::breadcrumb( '<span id="breadcrumbs">', '</span>' );
            }
            ?>
        </div>
        <?php
    }
}

$widgets_manager->register(new Havezic_Elementor_Breadcrumb());
