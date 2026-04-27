<?php

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;
use Elementor\Repeater;
use Elementor\Group_Control_Image_Size;

class Havezic_Elementor_ScrollView extends Elementor\Widget_Base {
    /**
     * Get widget name.
     *
     * Retrieve scrollview widget name.
     *
     * @return string Widget name.
     * @since  1.0.0
     * @access public
     *
     */
    public function get_name() {
        return 'havezic-scroll-view';
    }

    /**
     * Get widget title.
     *
     * Retrieve scrollview widget title.
     *
     * @return string Widget title.
     * @since  1.0.0
     * @access public
     *
     */
    public function get_title() {
        return esc_html__('Havezic Scroll View', 'havezic');
    }

    /**
     * Get widget icon.
     *
     * Retrieve scrollview widget icon.
     *
     * @return string Widget icon.
     * @since  1.0.0
     * @access public
     *
     */
    public function get_icon() {
        return 'eicon-carousel';
    }

    public function get_script_depends() {
        return ['havezic-elementor-scroll-view', 'havezic-elementor-swiper'];
    }

    public function get_categories() {
        return array('havezic-addons');
    }

    /**
     * Register scrollview widget controls.
     *
     * Adds different input fields to allow the user to change and customize the widget settings.
     *
     * @since  1.0.0
     * @access protected
     */
    protected function register_controls() {
        $this->start_controls_section(
            'section_scrollview',
            [
                'label' => esc_html__('Havezic Scroll View', 'havezic'),
            ]
        );

        $repeater = new Repeater();

        $repeater->add_control(
            'scrollview_title',
            [
                'label'   => esc_html__('Title', 'havezic'),
                'type' => Controls_Manager::TEXT,
                'label_block' => true,
            ]
        );

        $repeater->add_control(
            'scrollview_description',
            [
                'label'   => esc_html__('Description', 'havezic'),
                'type'        => Controls_Manager::WYSIWYG,
                'default'     => '<p>' . esc_html__( 'I am box banner content', 'havezic' ) . ' </p> <ul class="scrollview-list"><li>' . esc_html__( 'Lorem ipsum dolor', 'havezic' ) . '</li><li>' . esc_html__( 'Ipsum dolor sit', 'havezic' ) . '</li></ul>',
                'rows'        => '10',
            ]
        );


        $repeater->add_control(
            'scrollview_image',
            [
                'label' => esc_html__('Choose Image Main', 'havezic'),
                'default' => [
                    'url' => Elementor\Utils::get_placeholder_image_src(),
                ],
                'type' => Controls_Manager::MEDIA,
                'show_label' => true,
            ]
        );


        $repeater->add_control(
            'thumb_image',
            [
                'label' => esc_html__('Choose Image Thumb', 'havezic'),
                'default' => [
                    'url' => Elementor\Utils::get_placeholder_image_src(),
                ],
                'type' => Controls_Manager::MEDIA,
                'show_label' => true,
            ]
        );


        $repeater->add_control(
            'scrollview_button',
            [
                'label' => esc_html__( 'Button Text', 'havezic' ),
                'type' => Controls_Manager::TEXT,
                'dynamic' => [
                    'active' => true,
                ],
                'default' => esc_html__( 'Click Here', 'havezic' ),
                'separator' => 'before',
            ]
        );

        $repeater->add_control(
            'scrollview_link',
            [
                'label'       => esc_html__('Link to', 'havezic'),
                'placeholder' => esc_html__('https://your-link.com', 'havezic'),
                'type'        => Controls_Manager::URL,
            ]
        );

        $this->add_control(
            'scrollview',
            [
                'label'       => esc_html__('Items', 'havezic'),
                'type'        => Controls_Manager::REPEATER,
                'fields'      => $repeater->get_controls(),
                'default' => [
                    [
                        'scrollview_title'       => __('Heading ', 'havezic'),
                        'scrollview_description'       => '<p>' . esc_html__( 'I am box banner content', 'havezic' ) . ' </p> <ul class="scrollview-list"><li>' . esc_html__( 'Lorem ipsum dolor', 'havezic' ) . '</li><li>' . esc_html__( 'Ipsum dolor sit', 'havezic' ) . '</li></ul>',
                    ],

                ],
                'title_field' => '{{{ scrollview_title }}}',
            ]
        );

        $this->add_group_control(
            Elementor\Group_Control_Image_Size::get_type(),
            [
                'name' => 'image', // Usage: `{name}_size` and `{name}_custom_dimension`, in this case `image_size` and `image_custom_dimension`.
                'default' => 'full',
                'separator' => 'none',
            ]
        );

        $this->add_control(
            'view',
            [
                'label'   => esc_html__('View', 'havezic'),
                'type'    => Controls_Manager::HIDDEN,
                'default' => 'traditional',
            ]
        );
        $this->end_controls_section();

        $this->start_controls_section(
            'box_style',
            [
                'label' => esc_html__( 'Box', 'havezic' ),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_responsive_control(
            'min-height',
            [
                'label' => esc_html__( 'Height', 'havezic' ),
                'type' => Controls_Manager::SLIDER,
                'size_units' => [ 'px', 'em', 'rem', 'vh', 'custom' ],
                'range' => [
                    'px' => [
                        'min' => 100,
                        'max' => 1000,
                    ],
                    'vh' => [
                        'min' => 10,
                        'max' => 100,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .scrollview-inner .scrollview-image img' => 'height: {{SIZE}}{{UNIT}}',
                    '{{WRAPPER}} .text-thumbs-group' => 'height: {{SIZE}}{{UNIT}}',
                ],

            ]
        );

        $this->add_responsive_control(
            'box_padding',
            [
                'label' => esc_html__( 'Padding', 'havezic' ),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => [ 'px', '%', 'em', 'rem', 'vw', 'custom' ],
                'selectors' => [
                    '{{WRAPPER}} .text-thumbs-inner' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}}',
                ],
            ]
        );

        $this->end_controls_section();

        // Content.
        $this->start_controls_section(
            'section_style_content',
            [
                'label' => esc_html__('Content Text', 'havezic'),
                'tab'   => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'scrollview_title',
            [
                'type' => Controls_Manager::HEADING,
                'label' => esc_html__( 'Title', 'havezic' ),
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name'     => 'title_typography',
                'selector' => '{{WRAPPER}} .scrollview-title',
            ]
        );

        $this->add_responsive_control(
            'title_spacing',
            [
                'size_units' => ['px', 'em', '%'],
                'label'      => esc_html__('Spacing', 'havezic'),
                'type'       => Controls_Manager::SLIDER,
                'range'      => [
                    'px' => [
                        'min' => 0,
                        'max' => 300,
                    ],
                ],
                'selectors'  => [
                    '{{WRAPPER}} .scrollview-title' => 'margin-bottom: {{SIZE}}{{UNIT}};',
                ],
            ]
        );


        $this->add_control(
            'scrollview_description',
            [
                'type' => Controls_Manager::HEADING,
                'label' => esc_html__( 'Description', 'havezic' ),
                'separator' => 'before',
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name'     => 'description_typography',
                'selector' => '{{WRAPPER}} .scrollview-description',
            ]
        );

        $this->add_responsive_control(
            'description_spacing',
            [
                'size_units' => ['px', 'em', '%'],
                'label'      => esc_html__('Description Spacing', 'havezic'),
                'type'       => Controls_Manager::SLIDER,
                'range'      => [
                    'px' => [
                        'min' => 0,
                        'max' => 300,
                    ],
                ],
                'selectors'  => [
                    '{{WRAPPER}} .scrollview-description' => 'margin-bottom: {{SIZE}}{{UNIT}};',
                ],
            ]
        );


        $this->add_control(
            'scrollview_button',
            [
                'type' => Controls_Manager::HEADING,
                'label' => esc_html__( 'button', 'havezic' ),
                'separator' => 'before',
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name'     => 'button_typography',
                'selector' => '{{WRAPPER}} .more-link-wrap a.more-link',
            ]
        );

        $this->add_responsive_control(
            'button_spacing',
            [
                'size_units' => ['px', 'em', '%'],
                'label'      => esc_html__('Description Spacing', 'havezic'),
                'type'       => Controls_Manager::SLIDER,
                'range'      => [
                    'px' => [
                        'min' => 0,
                        'max' => 300,
                    ],
                ],
                'selectors'  => [
                    '{{WRAPPER}} .more-link-wrap' => 'margin-top: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'button_icon',
            [
                'size_units' => ['px', 'em', '%'],
                'label'      => esc_html__('Icon Size', 'havezic'),
                'type'       => Controls_Manager::SLIDER,
                'range'      => [
                    'px' => [
                        'min' => 0,
                        'max' => 100,
                    ],
                ],
                'selectors'  => [
                    '{{WRAPPER}} .more-link-wrap a.more-link .elementor-button-icon' => 'font-size: {{SIZE}}{{UNIT}}; width:auto',
                ],
            ]
        );

        $this->add_responsive_control(
            'button_padding',
            [
                'label' => esc_html__( 'Padding', 'havezic' ),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => [ 'px', '%', 'em', 'rem', 'vw', 'custom' ],
                'selectors' => [
                    '{{WRAPPER}} .more-link-wrap a.more-link' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}}',
                ],
            ]
        );


        $this->add_control(
            'scrollview_color',
            [
                'type' => Controls_Manager::HEADING,
                'label' => esc_html__( 'Color', 'havezic' ),
                'separator' => 'before',
            ]
        );

        $this->start_controls_tabs( 'scrollview_color_tabs' );

        $this->start_controls_tab( 'scrollview_colors_normal',
            [
                'label' => esc_html__( 'Normal', 'havezic' ),
            ]
        );

        $this->add_control(
            'title_text_color',
            [
                'label'     => esc_html__('Title Color', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'default'   => '',
                'selectors' => [
                    '{{WRAPPER}} .scrollview-title' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'button_color',
            [
                'label'     => esc_html__('Button Color', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'default'   => '',
                'selectors' => [
                    '{{WRAPPER}} .more-link-wrap a.more-link' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'button_bgcolor',
            [
                'label'     => esc_html__('Button Background Color', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'default'   => '',
                'selectors' => [
                    '{{WRAPPER}} .more-link-wrap a.more-link' => 'background-color: {{VALUE}};',
                ],
            ]
        );


        $this->end_controls_tab();

        $this->start_controls_tab(
            'scrollview_colors_hover',
            [
                'label' => esc_html__( 'Hover', 'havezic' ),
            ]
        );

        $this->add_control(
            'button_color_hover',
            [
                'label'     => esc_html__('Button Color', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'default'   => '',
                'selectors' => [
                    '{{WRAPPER}} .more-link-wrap a.more-link:hover' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'button_bgcolor_hover',
            [
                'label'     => esc_html__('Button Background Color', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'default'   => '',
                'selectors' => [
                    '{{WRAPPER}} .more-link-wrap a.more-link:hover' => 'background-color: {{VALUE}};',
                ],
            ]
        );



        $this->end_controls_tab();

        $this->end_controls_tabs();


        $this->end_controls_section();

        // Thumbs.
        $this->start_controls_section(
            'section_style_thumb',
            [
                'label' => esc_html__('Thumbs', 'havezic'),
                'tab'   => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_responsive_control(
            'thumb-height',
            [
                'label' => esc_html__( 'Height', 'havezic' ),
                'type' => Controls_Manager::SLIDER,
                'size_units' => [ 'px', 'em', 'rem', 'vh', 'custom' ],
                'range' => [
                    'px' => [
                        'min' => 100,
                        'max' => 1000,
                    ],
                    'vh' => [
                        'min' => 10,
                        'max' => 100,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .text-thumbs .thumb-image' => 'height: {{SIZE}}{{UNIT}}',
                ],

            ]
        );

        $this->add_control(
            'thumb_radius',
            [
                'label'      => esc_html__('Border Radius', 'havezic'),
                'type'       => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors'  => [
                    '{{WRAPPER}} .text-thumbs .thumb-image' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );


        $this->add_control(
            'thumb_title',
            [
                'type' => Controls_Manager::HEADING,
                'label' => esc_html__( 'Thumb Title', 'havezic' ),
                'separator' => 'before',
            ]
        );


        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name'     => 'thumb_title_typography',
                'selector' => '{{WRAPPER}} .thumb-title-link',
            ]
        );

        $this->add_control(
            'thumb_title_color',
            [
                'label'     => esc_html__('Color', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'default'   => '',
                'selectors' => [
                    '{{WRAPPER}} .thumb-title-link' => 'color: {{VALUE}};',
                ],
            ]
        );
        $this->add_control(
            'thumb_title_color_hover',
            [
                'label'     => esc_html__('Color Hover', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'default'   => '',
                'selectors' => [
                    '{{WRAPPER}} .thumb-title-link:hover' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'thumb_title_padding',
            [
                'label' => esc_html__( 'Padding', 'havezic' ),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => [ 'px', '%', 'em', 'rem', 'vw', 'custom' ],
                'selectors' => [
                    '{{WRAPPER}} .thumb-title' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}}',
                ],
            ]
        );

        $this->end_controls_section();

    }

    /**
     * Render scrollview widget output on the frontend.
     *
     * Written in PHP and used to generate the final HTML.
     *
     * @since  1.0.0
     * @access protected
     */
    protected function render() {
        $settings = $this->get_settings_for_display();
        if (!empty($settings['scrollview']) && is_array($settings['scrollview'])) {
            $this->add_render_attribute('wrapper', 'class', 'elementor-scrollview-item-wrapper');
            // Carousel

            $this->add_render_attribute([
                'item'    => [
                    'class' => 'swiper-slide',
                ],
                'wrapper' => [
                    'class' => 'havezic-swiper swiper',
                ],
                'row'     => [
                    'class' => 'swiper-wrapper',
                ],
            ]);

            $text_switch = '';
            $thumbs_switch = '';

            // Item
            $this->add_render_attribute('item', 'class', 'elementor-scrollview-item');
            ?>
            <div <?php $this->print_render_attribute_string('wrapper'); // WPCS: XSS ok. ?>>
                <div <?php $this->print_render_attribute_string('row'); // WPCS: XSS ok. ?>>
                    <?php foreach ($settings['scrollview'] as $scrollview): ?>
                        <div <?php $this->print_render_attribute_string('item'); // WPCS: XSS ok. ?>>
                            <div class="scrollview-inner">
                                <?php $this->render_image($settings, $scrollview); ?>

                            </div>
                        </div>
                        <?php ob_start(); ?>
                        <div class="scrollview-text-item">
                            <?php if ($scrollview['scrollview_title']) { ?>
                                <div class="scrollview-title"><?php echo esc_html($scrollview['scrollview_title']); ?></div>
                            <?php } ?>
                            <?php if ($scrollview['scrollview_description']) { ?>
                                <div class="scrollview-description">
                                    <?php echo do_shortcode($scrollview['scrollview_description']); ?>
                                </div>
                            <?php } ?>
                            <?php if ($scrollview['scrollview_button']) { ?>
                                <div class="more-link-wrap">
                                    <?php $scrollview_name_html = $scrollview['scrollview_button'];

                                    $scrollview_name_html = '<a class="more-link link-background" href="' . esc_url($scrollview['scrollview_link']['url']) . '"><span class="elementor-button-icon left"><i class="havezic-icon-arrow-small-right"></i></span>' . esc_html($scrollview_name_html) . '<span class="elementor-button-icon right"><i class="havezic-icon-arrow-small-right"></i></span></a>';

                                    printf('%s', $scrollview_name_html);
                                    ?>
                                </div>
                            <?php } ?>
                        </div>

                        <?php $text_switch .= ob_get_clean(); ?>
                        <?php ob_start(); ?>
                        <div class="scrollview-content swiper-slide">
                            <div class="scrollview-content-inner">
                                <?php if (!empty($scrollview['thumb_image']['url'])) :?>
                                    <div class="thumb-image">
                                        <?php
                                        echo Group_Control_Image_Size::get_attachment_image_html($scrollview, 'thumb_image');
                                        ?>
                                    </div>
                                <?php endif; ?>
                                <?php if ($scrollview['scrollview_title']) { ?>
                                    <div class="thumb-title"><a class="thumb-title-link" href="<?php echo esc_url($scrollview['scrollview_link']['url']); ?>"><?php echo esc_html($scrollview['scrollview_title']); ?></a></div>
                                <?php } ?>
                            </div>
                        </div>

                        <?php $thumbs_switch .= ob_get_clean(); ?>
                    <?php endforeach; ?>
                </div>
            </div>

            <div class="text-thumbs-group">
                <div class="text-thumbs-inner overflow-to-right">
                    <div class="scrollview-text-group">
                        <?php printf('%s', $text_switch); ?>
                    </div>
                    <div class="text-thumbs swiper">
                        <div class="swiper-wrapper">
                            <?php printf('%s', $thumbs_switch); ?>
                        </div>
                    </div>
                </div>
            </div>
            <?php
        }
    }

    private function render_image($settings, $scrollview) {
        if (!empty($scrollview['scrollview_image']['url'])) :
            ?>
            <div class="scrollview-image">
                <?php
                $scrollview['scrollview_image_size']             = $settings['image_size'];
                $scrollview['scrollview_image_custom_dimension'] = $settings['image_custom_dimension'];
                echo Group_Control_Image_Size::get_attachment_image_html($scrollview, 'scrollview_image');
                ?>
            </div>
        <?php
        endif;
    }
}

$widgets_manager->register(new Havezic_Elementor_ScrollView());

