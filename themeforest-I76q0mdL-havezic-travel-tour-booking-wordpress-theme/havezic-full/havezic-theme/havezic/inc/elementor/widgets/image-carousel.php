<?php

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

use Elementor\Controls_Manager;
use Elementor\Core\Kits\Documents\Tabs\Global_Colors;
use Elementor\Group_Control_Image_Size;
use Elementor\Group_Control_Text_Shadow;
use Elementor\Group_Control_Typography;
use Elementor\Plugin;
use Elementor\Group_Control_Box_Shadow;

class Havezic_Elementor_Image_Carousel extends Havezic_Base_Widgets_Swiper
{
    /**
     * Get widget name.
     *
     * Retrieve imagecarousel widget name.
     *
     * @return string Widget name.
     * @since  1.0.0
     * @access public
     *
     */
    public function get_name()
    {
        return 'havezic-image-carousel';
    }

    /**
     * Get widget title.
     *
     * Retrieve imagecarousel widget title.
     *
     * @return string Widget title.
     * @since  1.0.0
     * @access public
     *
     */
    public function get_title()
    {
        return esc_html__('Havezic Image Gallery', 'havezic');
    }

    /**
     * Get widget icon.
     *
     * Retrieve imagecarousel widget icon.
     *
     * @return string Widget icon.
     * @since  1.0.0
     * @access public
     *
     */
    public function get_icon()
    {
        return 'eicon-carousel';
    }

    public function get_script_depends()
    {
        return ['havezic-elementor-image-carousel', 'havezic-elementor-swiper'];
    }

    public function get_categories()
    {
        return array('havezic-addons');
    }

    /**
     * Register imagecarousel widget controls.
     *
     * Adds different input fields to allow the user to change and customize the widget settings.
     *
     * @since  1.0.0
     * @access protected
     */
    protected function register_controls()
    {
        $this->start_controls_section(
            'section_image_carousel',
            [
                'label' => esc_html__('Image Carousel', 'havezic'),
            ]
        );

        $this->add_control(
            'carousel',
            [
                'label' => esc_html__('Add Images', 'havezic'),
                'type' => Controls_Manager::GALLERY,
                'default' => [],
                'show_label' => false,
                'dynamic' => [
                    'active' => true,
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Image_Size::get_type(),
            [
                'name' => 'thumbnail',
                'separator' => 'none',
                'default' => 'full'
            ]
        );


        $this->add_responsive_control(
            'column',
            [
                'label' => esc_html__('Columns', 'havezic'),
                'type' => \Elementor\Controls_Manager::SELECT,
                'default' => 3,
                'options' => [1 => 1, 2 => 2, 3 => 3, 4 => 4, 5 => 5, 6 => 6],
                'selectors' => [
                    '{{WRAPPER}} .d-grid' => 'grid-template-columns: repeat({{VALUE}}, 1fr)',
                ],
                'condition' => ['enable_carousel!' => 'yes']
            ]
        );

        $this->add_responsive_control(
            'gutter',
            [
                'label' => esc_html__('Gutter', 'havezic'),
                'type' => Controls_Manager::SLIDER,
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 50,
                    ],
                ],
                'size_units' => ['px'],
                'selectors' => [
                    '{{WRAPPER}} .d-grid' => 'grid-gap:{{SIZE}}{{UNIT}}',
                ],
                'condition' => ['enable_carousel!' => 'yes']
            ]
        );

        $this->add_control(
            'link_to',
            [
                'label' => esc_html__('Link', 'havezic'),
                'type' => Controls_Manager::SELECT,
                'default' => 'file',
                'options' => [
                    'file' => esc_html__('Media File', 'havezic'),
                    'custom' => esc_html__('Custom URL', 'havezic'),
                    'custom-link-item' => esc_html__('Custom URL in Image', 'havezic'),
                    'none' => esc_html__('None', 'havezic'),
                ],
            ]
        );

        $this->add_control(
            'link',
            [
                'label' => esc_html__('Link', 'havezic'),
                'type' => Controls_Manager::URL,
                'placeholder' => esc_html__('https://your-link.com', 'havezic'),
                'condition' => [
                    'link_to' => 'custom',
                ],
                'show_label' => false,
                'dynamic' => [
                    'active' => true,
                ],
            ]
        );

        $this->add_control(
            'open_lightbox',
            [
                'label' => esc_html__('Lightbox', 'havezic'),
                'type' => Controls_Manager::SELECT,
                'default' => 'default',
                'options' => [
                    'default' => esc_html__('Default', 'havezic'),
                    'yes' => esc_html__('Yes', 'havezic'),
                    'no' => esc_html__('No', 'havezic'),
                ],
                'condition' => [
                    'link_to' => 'file',
                ],
            ]
        );


        $this->add_control(
            'caption_type',
            [
                'label' => esc_html__('Caption', 'havezic'),
                'type' => Controls_Manager::SELECT,
                'default' => '',
                'options' => [
                    '' => esc_html__('None', 'havezic'),
                    'title' => esc_html__('Title', 'havezic'),
                    'caption' => esc_html__('Caption', 'havezic'),
                    'description' => esc_html__('Description', 'havezic'),
                ],
            ]
        );


        $this->add_control(
            'hover_icon',
            [
                'label' => esc_html__('Hover Icon', 'havezic'),
                'type' => Controls_Manager::ICONS,
                'default' => [
                    'value' => 'havezic-icon- havezic-icon-plus',
                    'library' => 'havezic-icon',
                ],
                'skin' => 'inline',
            ]
        );

        $this->add_control(
            'enable_carousel',
            [
                'label' => esc_html__('Enable Carousel', 'havezic'),
                'type' => Controls_Manager::SWITCHER,
            ]
        );

        $this->end_controls_section();

        $this->start_controls_section(
            'section_design_image',
            [
                'label' => esc_html__('Style', 'havezic'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control('heading_image',
            [
                'label' => esc_html__('Image', 'havezic'),
                'type' => Controls_Manager::HEADING,
            ]
        );

        $this->add_control(
            'image_radius',
            [
                'label' => esc_html__('Border Radius', 'havezic'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors' => [
                    '{{WRAPPER}} .grid-item a' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                    '{{WRAPPER}} .grid-item a img' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Box_Shadow::get_type(),
            [
                'name' => 'box_shadow',
                'selector' => '{{WRAPPER}} .grid-item a',
            ]
        );

        $this->add_control('heading_icon',
            [
                'label' => esc_html__('Hover Icon', 'havezic'),
                'type' => Controls_Manager::HEADING,
            ]
        );

        $this->add_control(
            'icon_color',
            [
                'label' => esc_html__('Icon Color', 'havezic'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .hover-icon' => 'color: {{VALUE}}; fill: {{VALUE}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'hover_icon_size',
            [
                'label' => esc_html__('Icon Size', 'havezic'),
                'type' => Controls_Manager::SLIDER,
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 100,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .hover-icon' => 'font-size: {{SIZE}}{{UNIT}}; width: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->end_controls_section();

        $this->start_controls_section(
            'section_caption',
            [
                'label' => esc_html__('Caption', 'havezic'),
                'tab' => Controls_Manager::TAB_STYLE,
                'condition' => [
                    'caption_type!' => '',
                ],
            ]
        );

        $this->add_responsive_control(
            'caption_align',
            [
                'label' => esc_html__('Alignment', 'havezic'),
                'type' => Controls_Manager::CHOOSE,
                'options' => [
                    'left' => [
                        'title' => esc_html__('Left', 'havezic'),
                        'icon' => 'eicon-text-align-left',
                    ],
                    'center' => [
                        'title' => esc_html__('Center', 'havezic'),
                        'icon' => 'eicon-text-align-center',
                    ],
                    'right' => [
                        'title' => esc_html__('Right', 'havezic'),
                        'icon' => 'eicon-text-align-right',
                    ],
                    'justify' => [
                        'title' => esc_html__('Justified', 'havezic'),
                        'icon' => 'eicon-text-align-justify',
                    ],
                ],
                'default' => 'center',
                'selectors' => [
                    '{{WRAPPER}} .elementor-image-carousel-caption' => 'text-align: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'caption_text_color',
            [
                'label' => esc_html__('Text Color', 'havezic'),
                'type' => Controls_Manager::COLOR,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-image-carousel-caption' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'caption_typography',
                'global' => [
                    'default' => Global_Colors::COLOR_ACCENT,
                ],
                'selector' => '{{WRAPPER}} .elementor-image-carousel-caption',
            ]
        );

        $this->add_group_control(
            Group_Control_Text_Shadow::get_type(),
            [
                'name' => 'caption_shadow',
                'selector' => '{{WRAPPER}} .elementor-image-carousel-caption',
            ]
        );

        $this->add_responsive_control(
            'caption_space',
            [
                'label' => esc_html__('Spacing', 'havezic'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px', '%', 'em', 'rem', 'custom'],
                'selectors' => [
                    '{{WRAPPER}} .elementor-image-carousel-caption' => 'margin-block-start: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->end_controls_section();

        // Carousel options
        $this->add_control_carousel(['enable_carousel' => 'yes']);

    }

    private function get_link_url($attachment, $instance)
    {
        if ('none' == $instance['link_to']) {
            return false;
        }

        if ('custom' == $instance['link_to']) {
            if (empty($instance['link']['url'])) {
                return false;
            }

            return $instance['link'];
        }

        if ('custom-link-item' === $instance['link_to']) {
            $url = get_post_meta($attachment['id'], 'havezic_custom_media_link', true);
            if ($url) {
                return [
                    'url' => get_post_meta($attachment['id'], 'havezic_custom_media_link', true),
                ];
            }
        }

        return [
            'url' => wp_get_attachment_url($attachment['id']),
        ];
    }

    /**
     * Render imagecarousel widget output on the frontend.
     *
     * Written in PHP and used to generate the final HTML.
     *
     * @since  1.0.0
     * @access protected
     */
    protected function render()
    {
        $settings = $this->get_settings_for_display();
        $this->add_render_attribute('item', 'class', 'image-carousel-item');
        // Carousel
        $this->get_data_elementor_columns();

        ?>
        <div <?php $this->print_render_attribute_string('wrapper'); // WPCS: XSS ok.
        ?>>

            <div <?php $this->print_render_attribute_string('row'); // WPCS: XSS ok.
            ?>>
                <?php
                ob_start();
                \Elementor\Icons_Manager::render_icon($settings['hover_icon'], ['aria-hidden' => 'true', 'class' => 'hover-icon']);
                $hover_icon = ob_get_clean();
                foreach ($settings['carousel'] as $items => $attachment) {
                    $link_key = 'link_' . $items;
                    $link = $this->get_link_url($attachment, $settings);
                    $image_url = Group_Control_Image_Size::get_attachment_image_src($attachment['id'], 'thumbnail', $settings);
                    $image_caption = $this->get_image_caption($attachment);
                    ?>
                    <div <?php $this->print_render_attribute_string('item'); ?>>
                        <?php

                        if ($link) {
                            if ('custom' !== $settings['link_to'] && 'custom-link-item' !== $settings['link_to']) {
                                $this->add_lightbox_data_attributes($link_key, $attachment['id'], $settings['open_lightbox'], $this->get_id());
                            }
                            if ('custom-link-item' == $settings['link_to']) {
                                $this->add_render_attribute($link_key, ['class' => 'elementor-video elementor-clickable', 'data-elementor-open-lightbox' => 'no']);
                            }
                            if (Plugin::$instance->editor->is_edit_mode()) {
                                $this->add_render_attribute($link_key, [
                                    'class' => 'elementor-clickable',
                                    'data-elementor-open-lightbox' => 'no'
                                ]);
                            }
                            $this->add_link_attributes($link_key, $link);
                        } else {
                            $this->add_render_attribute($link_key, 'class', 'elementor-clickable');
                        }
                        ?>
                        <a <?php $this->print_render_attribute_string($link_key); ?>>
                            <img src="<?php echo esc_url($image_url); ?>"
                                 alt="<?php echo esc_attr(Elementor\Control_Media::get_image_alt($attachment)); ?>"/>
                            <?php printf('%s', $hover_icon); ?>

                        </a>
                        <?php if (!empty($image_caption)) { ?>
                            <a <?php $this->print_render_attribute_string($link_key); ?>>
                                <figcaption
                                        class="elementor-image-carousel-caption"> <?php echo esc_attr($image_caption) ?></figcaption>
                            </a>
                        <?php } ?>
                    </div>
                <?php } ?>

            </div>
        </div>
        <?php $this->render_swiper_pagination_navigation(); ?>
        <?php
    }

    /**
     * Retrieve image carousel caption.
     *
     * @param array $attachment
     *
     * @return string The caption of the image.
     * @since 1.2.0
     * @access private
     *
     */
    private function get_image_caption($attachment)
    {
        $caption_type = $this->get_settings_for_display('caption_type');

        if (empty($caption_type)) {
            return '';
        }

        $attachment_post = get_post($attachment['id']);

        if ('caption' === $caption_type) {
            return $attachment_post->post_excerpt;
        }

        if ('title' === $caption_type) {
            return $attachment_post->post_title;
        }

        return $attachment_post->post_content;
    }
}

$widgets_manager->register(new Havezic_Elementor_Image_Carousel());