<?php
/**
 * Add widget Duration to Elementor
 *
 * @since   1.0.0
 */

use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;
use Elementor\Group_Control_Border;

class Havezic_BABE_Elementor_Itemmaxguests_Widget extends \Elementor\Widget_Base
{

    /**
     * Get widget name.
     *
     * @return string Widget name.
     */
    public function get_name()
    {
        return 'babe-item-max-guests';
    }

    /**
     * Get widget title.
     *
     * @return string Widget title.
     */
    public function get_title()
    {
        return esc_html__('Detail Max Guests', 'havezic');
    }

    /**
     * Get widget icon.
     *
     * @return string Widget icon.
     */
    public function get_icon()
    {
        return 'eicon-preferences';
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
        return ['max', 'people', 'guests'];
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

    /**
     * Register widget controls.
     *
     * Adds different input fields to allow the user to change and customize the widget settings.
     */
    protected function register_controls()
    {

        $this->start_controls_section(
            'section_general',
            [
                'label' => esc_html__('General', 'havezic'),
                'tab' => Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'duration_title',
            [
                'label' => esc_html__('Title', 'havezic'),
                'type' => Controls_Manager::TEXT,
                'default' => 'Max People',
            ]
        );

        $this->add_control(
            'icon',
            [
                'label' => esc_html__('Icon', 'havezic'),
                'type'  => Controls_Manager::ICONS,
            ]
        );
        $this->end_controls_section();

        $this->add_control_style_wrapper();

        // Content
        $this->start_controls_section(
            'section_content_style',
            [
                'label' => esc_html__('Content', 'havezic'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'text_color',
            [
                'label' => esc_html__('Color', 'havezic'),
                'type' => Controls_Manager::COLOR,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .meta-field-inner' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'text_typography',
                'selector' => '{{WRAPPER}} .meta-field-inner',
            ]
        );

        $this->end_controls_section();
        // Icon style
        $this->start_controls_section(
            'section_style_icon',
            [
                'label' => esc_html__('Icon', 'havezic'),
                'tab'   => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'icon_color',
            [
                'label'     => esc_html__('Icon Color', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'default'   => '',
                'selectors' => [
                    '{{WRAPPER}} .icon i, {{WRAPPER}} .icon svg' => 'color: {{VALUE}}; fill: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'icon_size',
            [
                'label'     => esc_html__('Icon Size', 'havezic'),
                'type'      => Controls_Manager::SLIDER,
                'range'     => [
                    'px' => [
                        'min' => 6,
                        'max' => 300,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .icon i' => 'font-size: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'icon_padding',
            [
                'label'      => esc_html__('Padding', 'havezic'),
                'type'       => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'selectors'  => [
                    '{{WRAPPER}} .icon' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Border::get_type(),
            [
                'name'        => 'icon_border',
                'placeholder' => '1px',
                'default'     => '1px',
                'selector'    => '{{WRAPPER}} .icon',
                'separator'   => 'before',
            ]
        );
        $this->add_responsive_control(
            'icon_radius',
            [
                'label'      => esc_html__('Border Radius', 'havezic'),
                'type'       => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'selectors'  => [
                    '{{WRAPPER}} .icon' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->end_controls_section();


    }

    /**
     * Render widget output on the frontend.
     * Written in PHP and used to generate the final HTML.
     */
    protected function render()
    {
        $settings = $this->get_settings_for_display();

        if (\Elementor\Plugin::instance()->editor->is_edit_mode()) {
            $post_id = havezic_ba_get_default_single_id();
        } else {
            $post_id = get_the_ID();
        }
        $babe_post = get_post($post_id);

        if (is_single() && $babe_post->post_type == BABE_Post_types::$booking_obj_post_type) {
            $babe_post = BABE_Post_types::get_post($babe_post->ID);

            $guests = isset($babe_post['guests']) ? $babe_post['guests'] : false;
            ?>
            <div class="elementor-widget-inner">
                <?php if (!empty($settings['icon']['value'])) : ?>
                    <div class="icon">
                        <?php \Elementor\Icons_Manager::render_icon($settings['icon'], ['aria-hidden' => 'true']); ?>
                    </div>
                <?php endif; ?>
                <div class="meta-field-inner">
                    <div class="item_info">
                        <?php if (!empty($settings['duration_title'])): ?>
                            <div class="babe-section-title"><?php echo esc_html($settings['duration_title']); ?></div>
                        <?php endif; ?>
                        <?php
                        if (isset($guests) && !empty($guests)) { ?>
                            <div class="item-days item-meta-value">
                                <span><?php printf("%s", $guests); ?></span>
                            </div>
                        <?php } ?>
                    </div>
                </div>
            </div>
            <?php
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

        $this->add_responsive_control(
            'wrapper_padding',
            [
                'label' => esc_html__('Padding', 'havezic'),
                'type' => \Elementor\Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'selectors' => [
                    '{{WRAPPER}} .elementor-widget-inner' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
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
                    '{{WRAPPER}} .elementor-widget-inner' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_control(
            'wrapper_bg_color',
            [
                'label' => esc_html__('Background Color', 'havezic'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-widget-inner' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Border::get_type(),
            [
                'name' => 'wrapper_border',
                'placeholder' => '1px',
                'default' => '1px',
                'selector' => '{{WRAPPER}} .elementor-widget-inner',
                'separator' => 'before',
            ]
        );

        $this->add_control(
            'wrapper_border_hover',
            [
                'label' => esc_html__('Border Hover Color', 'havezic'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-widget-inner:hover' => 'border-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'wrapper_radius',
            [
                'label' => esc_html__('Border Radius', 'havezic'),
                'type' => \Elementor\Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors' => [
                    '{{WRAPPER}} .elementor-widget-inner' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Box_Shadow::get_type(),
            [
                'name' => 'wrapper_box_shadow',
                'selector' => '{{WRAPPER}} .elementor-widget-inner',
            ]
        );

        $this->end_controls_section();
    }

}
$widgets_manager->register(new Havezic_BABE_Elementor_Itemmaxguests_Widget());