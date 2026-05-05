<?php
/**
 * Add widget all-items to Elementor
 *
 * @since   1.3.13
 */

use Elementor\Controls_Manager;

class Havezic_BABE_Elementor_ItemTaxonomy_Widget extends \Elementor\Widget_Base {

    /**
     * Get widget name.
     *
     * @return string Widget name.
     */
    public function get_name() {
        return 'babe-item-taxonomy';
    }

    /**
     * Get widget title.
     *
     * @return string Widget title.
     */
    public function get_title() {
        return esc_html__('Detail Taxonomy', 'havezic');
    }

    /**
     * Get widget icon.
     *
     * @return string Widget icon.
     */
    public function get_icon() {
        return 'eicon-info-circle-o';
    }


    /**
     * Get widget keywords.
     *
     * Retrieve the list of keywords the widget belongs to.
     *
     * @return array Widget keywords.
     */
    public function get_keywords() {
        return ['taxonomy'];
    }

    /**
     * Get widget categories.
     *
     * @return array Widget categories.
     */
    public function get_categories() {
        return ['book-everything-elements'];
    }

    /**
     * Register widget controls.
     *
     * Adds different input fields to allow the user to change and customize the widget settings.
     */
    protected function register_controls() {

        $this->start_controls_section(
            'section_general',
            [
                'label' => esc_html__('General', 'havezic'),
                'tab'   => Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'taxonomy_slug',
            array(
                'label'   => esc_html__('Ba Taxonomies', 'havezic'),
                'type'    => \Elementor\Controls_Manager::SELECT,
                'multiple'    => true,
                'options' => $this->get_taxonomies_arr(),
                'label_block' => true,
            )
        );

        $this->end_controls_section();

        $this->add_control_style_wrapper();

    }

    /**
     * Render widget output on the frontend.
     * Written in PHP and used to generate the final HTML.
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
            echo '<div class="elementor-widget-inner taxonomy-item">';
            echo get_the_term_list($post_id, BABE_Post_types::$attr_tax_pref . $settings['taxonomy_slug'], '', ', ');
            echo '</div>';
        }
    }


    protected function add_control_style_wrapper($condition = array()) {

        $this->start_controls_section(
            'style_taxonomy_item',
            array(
                'label' => esc_html__('Content', 'havezic'),
                'tab'   => \Elementor\Controls_Manager::TAB_STYLE,
            )
        );

        $this->add_control(
            'taxonomy_color',
            [
                'label' => esc_html__( 'Taxonomy Color', 'havezic' ),
                'type' => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .taxonomy-item a' => 'color: {{VALUE}};',
                ]
            ]
        );
        $this->add_control(
            'taxonomy_background_color',
            [
                'label' => esc_html__( 'Background Color', 'havezic' ),
                'type' => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .taxonomy-item' => 'background-color: {{VALUE}};',
                ]
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'count_typography',
                'label' => esc_html__( 'Taxonomy Typography', 'havezic' ),
                'selector' => '{{WRAPPER}} .taxonomy-item a',
            ]
        );

        $this->end_controls_section();

        $this->start_controls_section(
            'section_style_wrapper',
            [
                'label' => esc_html__('Wrapper', 'havezic'),
                'tab'   => \Elementor\Controls_Manager::TAB_STYLE,

            ]
        );

        $this->add_responsive_control(
            'wrapper_padding',
            [
                'label'      => esc_html__('Padding', 'havezic'),
                'type'       => \Elementor\Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'selectors'  => [
                    '{{WRAPPER}} .elementor-widget-inner' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'wrapper_margin',
            [
                'label'      => esc_html__('Margin', 'havezic'),
                'type'       => \Elementor\Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em'],
                'selectors'  => [
                    '{{WRAPPER}} .elementor-widget-inner' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_control(
            'wrapper_bg_color',
            [
                'label'     => esc_html__('Background Color', 'havezic'),
                'type'      => \Elementor\Controls_Manager::COLOR,
                'default'   => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-widget-inner' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Border::get_type(),
            [
                'name'        => 'wrapper_border',
                'placeholder' => '1px',
                'default'     => '1px',
                'selector'    => '{{WRAPPER}} .elementor-widget-inner',
                'separator'   => 'before',
            ]
        );

        $this->add_control(
            'wrapper_border_hover',
            [
                'label'     => esc_html__('Border Hover Color', 'havezic'),
                'type'      => \Elementor\Controls_Manager::COLOR,
                'default'   => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-widget-inner:hover' => 'border-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'wrapper_radius',
            [
                'label'      => esc_html__('Border Radius', 'havezic'),
                'type'       => \Elementor\Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors'  => [
                    '{{WRAPPER}} .elementor-widget-inner' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Box_Shadow::get_type(),
            [
                'name'     => 'wrapper_box_shadow',
                'selector' => '{{WRAPPER}} .elementor-widget-inner',
            ]
        );

        $this->end_controls_section();
    }

    public static function get_taxonomies_arr() {
        $output = array();

        $taxonomies = get_terms( array(
            'taxonomy' => BABE_Post_types::$taxonomies_list_tax,
            'hide_empty' => false
        ));

        if ( ! is_wp_error( $taxonomies ) && ! empty( $taxonomies ) ) {
            foreach ($taxonomies as $tax_term) {
                $output[$tax_term->slug] = apply_filters('translate_text', $tax_term->name);
            }
        }

        return $output;

    }

}

$widgets_manager->register(new Havezic_BABE_Elementor_ItemTaxonomy_Widget());