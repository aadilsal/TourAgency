<?php

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

use Elementor\Group_Control_Typography;
use Elementor\Controls_Manager;
use Elementor\Group_Control_Border;
use Elementor\Repeater;
use Elementor\Group_Control_Background;
use Elementor\Group_Control_Text_Stroke;
use Elementor\Group_Control_Box_Shadow;

/**
 * Elementor tabs widget.
 *
 * Elementor widget that displays vertical or horizontal tabs with different
 * pieces of content.
 *
 * @since 1.0.0
 */
class Havezic_Elementor_Slide_Scrolling extends Elementor\Widget_Base {

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
        return 'havezic-slide-scrolling';
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
        return esc_html__('Havezic Slide Scrolling', 'havezic');
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
        return 'eicon-image';
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
            'section_scrolling',
            [
                'label' => esc_html__('Items', 'havezic'),
            ]
        );

        $repeater = new Repeater();

        $repeater->add_control(
            'scrolling_title',
            [
                'label'       => esc_html__('Scrolling name', 'havezic'),
                'type'        => Controls_Manager::TEXT,
                'placeholder' => esc_html__('Scrolling Name', 'havezic'),
                'label_block' => true,
            ]
        );

        $repeater->add_control(
            'scrolling_image',
            [
                'label' => esc_html__('Choose Image', 'havezic'),
                'type'  => Controls_Manager::MEDIA,
            ]
        );

        $repeater->add_control(
            'enable_rotate_image',
            [
                'label'   => esc_html__('Enable Scroll image rotate', 'havezic'),
                'type'    => Controls_Manager::SWITCHER,
                'default' => 'yes'
            ]
        );

        $repeater->add_control(
            'link',
            [
                'label'       => esc_html__('Link to', 'havezic'),
                'type'        => Controls_Manager::URL,
                'dynamic'     => [
                    'active' => true,
                ],
                'placeholder' => esc_html__('https://your-link.com', 'havezic'),
            ]
        );

        $repeater->add_control(
            'color',
            [
                'label'     => esc_html__('Color', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} {{CURRENT_ITEM}}.scrolling-title a' => 'color: {{VALUE}}',
                ],
                'condition' => [
                    'text_stroke!' => 'yes',
                ],
            ]
        );

        $this->add_control(
            'scrolling',
            [
                'label'       => esc_html__('Items', 'havezic'),
                'type'        => Controls_Manager::REPEATER,
                'fields'      => $repeater->get_controls(),
                'title_field' => '{{{ scrolling_title }}}',
            ]
        );


        $this->add_control(
            'heading_settings',
            [
                'label'     => esc_html__('Settings', 'havezic'),
                'type'      => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_responsive_control(
            'duration',
            [
                'label'     => esc_html__('Scrolling duration', 'havezic'),
                'type'      => Controls_Manager::NUMBER,
                'default'   => 10,
                'selectors' => [
                    '{{WRAPPER}} .elementor-scrolling-inner' => 'animation-duration: {{VALUE}}s',
                ],
            ]
        );

        $this->add_responsive_control(
            'scrolling_align',
            [
                'label'     => esc_html__('Alignment', 'havezic'),
                'type'      => Controls_Manager::CHOOSE,
                'options'   => [
                    'flex-start' => [
                        'title' => esc_html__('Left', 'havezic'),
                        'icon'  => 'eicon-text-align-left',
                    ],
                    'center'     => [
                        'title' => esc_html__('Center', 'havezic'),
                        'icon'  => 'eicon-text-align-center',
                    ],
                    'flex-end'   => [
                        'title' => esc_html__('Right', 'havezic'),
                        'icon'  => 'eicon-text-align-right',
                    ],
                ],
                'default'   => 'center',
                'selectors' => [
                    '{{WRAPPER}} .elementor-scrolling-wrapper .elementor-scrolling-item-inner' => 'align-items: {{VALUE}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'item_spacing',
            [
                'label'      => esc_html__('Spacing', 'havezic'),
                'type'       => Controls_Manager::SLIDER,
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
                    '{{WRAPPER}} .elementor-scrolling-wrapper .elementor-scrolling-item' => 'margin-left: calc({{SIZE}}{{UNIT}}/2); margin-right: calc({{SIZE}}{{UNIT}}/2);',
                ],
            ]
        );

        $this->add_control(
            'rtl',
            [
                'label'        => esc_html__('Direction Right/Left', 'havezic'),
                'type'         => Controls_Manager::SELECT,
                'default'      => 'ltr',
                'options'      => [
                    'ltr' => esc_html__('Left', 'havezic'),
                    'rtl' => esc_html__('Right', 'havezic'),
                ],
                'prefix_class' => 'havezic-scrolling-',
            ]
        );

        $this->add_control(
            'box_width',
            [
                'label'        => esc_html__('Box Width', 'havezic'),
                'type'         => Controls_Manager::SWITCHER,
                'default'      => '',
                'prefix_class' => 'box-width-'
            ]
        );

        $this->end_controls_section();

        $this->start_controls_section(
            'style_scrolling_item',
            [
                'label' => esc_html__('Item', 'havezic'),
                'tab'   => Controls_Manager::TAB_STYLE,
            ]
        );


        $this->add_group_control(
            Group_Control_Border::get_type(),
            [
                'name'     => 'scrolling_item',
                'selector' => '{{WRAPPER}} .elementor-scrolling-item-inner',
            ]
        );


        $this->add_control(
            'item_background_color',
            [
                'label'     => esc_html__('Background Color', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .elementor-scrolling .elementor-scrolling-inner .elementor-scrolling-item-inner' => 'background-color: {{VALUE}}; ',
                ],
            ]
        );

        $this->add_responsive_control(
            'gap',
            [
                'label'      => esc_html__('Gap', 'havezic'),
                'type'       => Controls_Manager::SLIDER,
                'range'      => [
                    'px' => [
                        'min' => 0,
                        'max' => 50,
                    ],
                ],
                'size_units' => ['px'],
                'selectors'  => [
                    '{{WRAPPER}} .elementor-scrolling-item-inner' => 'gap:{{SIZE}}{{UNIT}}',
                ],
            ]
        );

        $this->add_responsive_control(
            'item_padding',
            [
                'label'      => esc_html__('Padding', 'havezic'),
                'type'       => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'selectors'  => [
                    '{{WRAPPER}} .elementor-scrolling-item-inner' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );
        $this->end_controls_section();

        //Image
        $this->start_controls_section(
            'section_style_scrolling_image',
            [
                'label' => esc_html__('Image', 'havezic'),
                'tab'   => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_responsive_control(
            'image_height',
            [
                'label'      => esc_html__('Height', 'havezic'),
                'type'       => Controls_Manager::SLIDER,
                'range'      => [
                    'px' => [
                        'min' => 100,
                        'max' => 1000,
                    ],
                    'vh' => [
                        'min' => 10,
                        'max' => 100,
                    ],
                ],
                'size_units' => ['px', 'vh'],
                'selectors'  => [
                    '{{WRAPPER}} img' => 'height: {{SIZE}}{{UNIT}}',
                ],
            ]
        );

        $this->add_responsive_control(
            'image_width',
            [
                'label'      => esc_html__('Width', 'havezic'),
                'type'       => Controls_Manager::SLIDER,
                'range'      => [
                    'px' => [
                        'min' => 100,
                        'max' => 1000,
                    ],
                    'vh' => [
                        'min' => 10,
                        'max' => 100,
                    ],
                ],
                'size_units' => ['px', 'vh'],
                'selectors'  => [
                    '{{WRAPPER}} img' => 'width: {{SIZE}}{{UNIT}}',
                ],
            ]
        );

        $this->add_control(
            'image_radius',
            [
                'label'      => esc_html__('Border Radius', 'havezic'),
                'type'       => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors'  => [
                    '{{WRAPPER}} img' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Box_Shadow::get_type(),
            [
                'name'     => 'img_box_shadow',
                'selector' => '{{WRAPPER}} img',
            ]
        );

        $this->end_controls_section();

        // Title.
        $this->start_controls_section(
            'section_style_scrolling_title',
            [
                'label' => esc_html__('Title', 'havezic'),
                'tab'   => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'style_title',
            [
                'label'        => esc_html__('Style', 'havezic'),
                'type'         => Controls_Manager::SELECT,
                'default'      => 'normal',
                'options'      => [
                    'normal' => esc_html__('Normal', 'havezic'),
                    'gradient' => esc_html__('Gradient', 'havezic'),
                    'stroke' => esc_html__('Stroke Gradient', 'havezic'),
                ],
                'prefix_class' => 'style-title-',
            ]
        );

        $this->add_group_control(
            Group_Control_Background::get_type(),
            [
                'name'           => 'select_gradient',
                'label'          => esc_html__('Color', 'havezic'),
                'types'          => ['gradient'],
                'selector'       => '{{WRAPPER}} .scrolling-title a',
                'condition'  => [
                    'style_title!' => 'normal',
                ],
            ]
        );

        $this->add_responsive_control(
            'width',
            [
                'label'      => esc_html__('Width Stroke', 'havezic'),
                'type'       => Controls_Manager::SLIDER,
                'range'      => [
                    'px' => [
                        'min' => 1,
                        'max' => 50,
                    ],
                ],
                'size_units' => ['px'],
                'selectors' => [
                    '{{WRAPPER}} .scrolling-title a' => '-webkit-text-stroke-width: {{SIZE}}{{UNIT}}',
                ],
                'condition'  => [
                    'style_title' => 'stroke',
                ],
            ]
        );



        $this->add_control(
            'title_text_color',
            [
                'label'     => esc_html__('Color', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'default'   => '',
                'selectors' => [
                    '{{WRAPPER}} .scrolling-title a' => 'color: {{VALUE}};',
                ],
                'condition'  => [
                    'style_title!' => 'gradient',
                ],
            ]
        );

        $this->add_control(
            'title_text_color_hover',
            [
                'label'     => esc_html__('Color Hover', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'default'   => '',
                'selectors' => [
                    '{{WRAPPER}} .scrolling-title:hover a' => 'color: {{VALUE}};',
                ],
                'condition'  => [
                    'style_title' => 'normal',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name'     => 'title_typography',
                'selector' => '{{WRAPPER}} .scrolling-title a',
            ]
        );

        $this->add_group_control(
            Group_Control_Text_Stroke::get_type(),
            [
                'name' => 'text_stroke',
                'selector' => '{{WRAPPER}} .scrolling-title a',
                'condition'  => [
                    'style_title' => 'normal',
                ],
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
        $settings = $this->get_settings_for_display();
        if (!empty($settings['scrolling']) && is_array($settings['scrolling'])) {

            $this->add_render_attribute('wrapper', 'class', 'elementor-scrolling-wrapper');
            $this->add_render_attribute('item', 'class', 'elementor-scrolling-item');

            ?>
            <div class="elementor-scrolling">
                <div <?php $this->print_render_attribute_string('wrapper'); ?>>
                    <?php
                    for ($i = 1; $i <= 3; $i++) {
                        ?>
                        <div class="elementor-scrolling-inner">
                            <?php foreach ($settings['scrolling'] as $item) : ?>
                                <div <?php $this->print_render_attribute_string('item'); ?>>
                                    <?php
                                    $rotate_class = $item['enable_rotate_image'] == 'yes' ? 'enable-rotate' : '';
                                    ?>
                                    <div class="elementor-scrolling-item-inner <?php echo esc_attr($rotate_class); ?>">
                                        <?php if (!empty($item['scrolling_image']['url'])) : ?>
                                            <?php echo Elementor\Group_Control_Image_Size::get_attachment_image_html($item, 'image', 'scrolling_image'); ?>
                                        <?php endif; ?>
                                        <div class="scrolling-title elementor-repeater-item-<?php echo esc_attr($item['_id']); ?>">
                                            <?php if ($item['scrolling_title']) {
                                                if (!empty($item['link'])) {
                                                    if (!empty($item['link']['is_external'])) {
                                                        $this->add_render_attribute('scrolling-title', 'target', '_blank');
                                                    }

                                                    if (!empty($item['link']['nofollow'])) {
                                                        $this->add_render_attribute('scrolling-title', 'rel', 'nofollow');
                                                    }

                                                    echo '<a href="' . esc_url($item['link']['url'] ? $item['link']['url'] : '#') . '" ' . $this->get_render_attribute_string('scrolling-title') . ' title="' . esc_attr($item['scrolling_title']) . '">';
                                                }
                                                echo '<span>' . esc_html($item['scrolling_title']) . '</span>';
                                                if (!empty($item['link'])) {
                                                    echo '</a>';
                                                }
                                            }
                                            ?>
                                        </div>

                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                        <?php
                    }
                    ?>
                </div>
            </div>
            <?php
        }
    }
}

$widgets_manager->register(new Havezic_Elementor_Slide_Scrolling());
