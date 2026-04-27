<?php
/**
 * Add widget all-items to Elementor
 *
 * @since   1.3.13
 */

use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;

class Havezic_BABE_Elementor_Itemtitle_Widget extends \Elementor\Widget_Base
{

    /**
     * Get widget name.
     *
     * @return string Widget name.
     */
    public function get_name()
    {
        return 'babe-item-title';
    }

    /**
     * Get widget title.
     *
     * @return string Widget title.
     */
    public function get_title()
    {
        return esc_html__('Detail Title', 'havezic');
    }

    /**
     * Get widget icon.
     *
     * @return string Widget icon.
     */
    public function get_icon()
    {
        return 'eicon-post-title';
    }

    /**
     * Get widget keywords.
     *
     * Retrieve the list of keywords the widget belongs to.
     *
     * @return array Widget keywords.
     */
    public function get_keywords()
    {
        return ['title', 'description'];
    }

    /**
     * Get widget categories.
     *
     * @return array Widget categories.
     */
    public function get_categories()
    {
        return ['book-everything-elements'];
    }

    public function get_script_depends()
    {
        return ['havezic-ba-title.js'];
    }

    /**
     * Register widget controls.
     *
     * Adds different input fields to allow the user to change and customize the widget settings.
     */
    protected function register_controls()
    {

        $this->add_control_style_wrapper();

    }

    /**
     * Render widget output on the frontend.
     * Written in PHP and used to generate the final HTML.
     */
    protected function render()
    {
        if ( \Elementor\Plugin::instance()->editor->is_edit_mode() ) {
            $post_id = havezic_ba_get_default_single_id();
        } else {
            $post_id = get_the_ID();
        }
        $main_post = get_post( $post_id );

        if ( is_single() && $main_post->post_type == BABE_Post_types::$booking_obj_post_type) {
            if (!empty($main_post->post_title)){
                echo '<h1 class="havezic-single-title">';
                echo esc_html($main_post->post_title);
                echo '</h1>';
            }
        }

    }

    protected function add_control_style_wrapper($condition = array())
    {
        $this->start_controls_section(
            'section_style_wrapper',
            [
                'label' => esc_html__('Wrapper', 'havezic'),
                'tab' => \Elementor\Controls_Manager::TAB_STYLE,

            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'title_typography',
                'selector' => '{{WRAPPER}} .havezic-single-title',
            ]
        );

        $this->add_control(
            'title_title_color',
            [
                'label' => esc_html__('Color', 'havezic'),
                'type' => Controls_Manager::COLOR,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .havezic-single-title' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'wrapper_margin',
            [
                'label' => esc_html__('Margin', 'havezic'),
                'type' => \Elementor\Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em'],
                'selectors' => [
                    '{{WRAPPER}} .havezic-single-title' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );



        $this->end_controls_section();
    }

}
$widgets_manager->register(new Havezic_BABE_Elementor_Itemtitle_Widget());
