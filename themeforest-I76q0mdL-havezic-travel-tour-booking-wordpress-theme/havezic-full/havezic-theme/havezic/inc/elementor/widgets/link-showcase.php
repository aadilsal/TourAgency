<?php

namespace Elementor;

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

use Elementor\Core\Kits\Documents\Tabs\Global_Typography;

/**
 * Elementor tabs widget.
 *
 * Elementor widget that displays vertical or horizontal tabs with different
 * pieces of content.
 *
 * @since 1.0.0
 */
class Havezic_Elementor_Link_Showcase extends Widget_Base
{

    public function get_categories()
    {
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
    public function get_name()
    {
        return 'havezic-link-showcase';
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
    public function get_title()
    {
        return esc_html__('Havezic Link Showcase', 'havezic');
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
    public function get_icon()
    {
        return 'eicon-tabs';
    }

    /**
     * Get widget keywords.
     *
     * Retrieve the list of keywords the widget belongs to.
     *
     * @return array Widget keywords.
     * @since 2.1.0
     * @access public
     *
     */
    public function get_keywords()
    {
        return ['tabs', 'accordion', 'toggle', 'link', 'showcase'];
    }

    public function get_script_depends()
    {
        return ['havezic-elementor-link-showcase'];
    }

    /**
     * Register tabs widget controls.
     *
     * Adds different input fields to allow the user to change and customize the widget settings.
     *
     * @since 1.0.0
     * @access protected
     */
    protected function register_controls()
    {

        $templates = Plugin::instance()->templates_manager->get_source('local')->get_items();

        $options = [
            '0' => '— ' . esc_html__('Select', 'havezic') . ' —',
        ];

        $types = [];

        foreach ($templates as $template) {
            $options[$template['template_id']] = $template['title'] . ' (' . $template['type'] . ')';
            $types[$template['template_id']] = $template['type'];
        }


        $this->start_controls_section(
            'section_items',
            [
                'label' => esc_html__('Items', 'havezic'),
            ]
        );

        $repeater = new Repeater();

        $repeater->add_control(
            'title',
            [
                'label' => esc_html__('Title', 'havezic'),
                'type' => Controls_Manager::TEXT,
                'default' => esc_html__('Title', 'havezic'),
                'placeholder' => esc_html__('Title', 'havezic'),
                'label_block' => true,
            ]
        );

        $repeater->add_control(
            'description',
            [
                'label' => esc_html__('Description', 'havezic'),
                'type' => Controls_Manager::TEXTAREA,
                'default' => 'This is description',
                'label_block' => true,
                'rows' => '5',
            ]
        );

        $repeater->add_control(
            'source',
            [
                'label' => esc_html__('Source', 'havezic'),
                'type' => Controls_Manager::SELECT,
                'default' => 'image',
                'options' => [
                    'html' => esc_html__('HTML', 'havezic'),
                    'template' => esc_html__('Template', 'havezic'),
                    'image' => esc_html__('Image', 'havezic'),
                ]
            ]
        );

        $repeater->add_control(
            'link_template',
            [
                'label' => esc_html__('Choose Template', 'havezic'),
                'default' => 0,
                'type' => Controls_Manager::SELECT,
                'options' => $options,
                'types' => $types,
                'label_block' => 'true',
                'condition' => [
                    'source' => 'template',
                ],
            ]
        );

        $repeater->add_control(
            'link_content',
            [
                'label' => esc_html__('Content', 'havezic'),
                'default' => esc_html__('Tab Content', 'havezic'),
                'placeholder' => esc_html__('Tab Content', 'havezic'),
                'type' => Controls_Manager::WYSIWYG,
                'show_label' => false,
                'condition' => [
                    'source' => 'html',
                ],
            ]
        );

        $repeater->add_control(
            'link_image',
            [
                'label' => esc_html__('Choose Image', 'havezic'),
                'type' => Controls_Manager::MEDIA,
                'dynamic' => [
                    'active' => true,
                ],
                'default' => [
                    'url' => Utils::get_placeholder_image_src(),
                ],
                'condition' => [
                    'source' => 'image',
                ],
            ]
        );

        $repeater->add_control(
            'showcase_button',
            [
                'label' => esc_html__('Button Text', 'havezic'),
                'type' => Controls_Manager::TEXT,
                'dynamic' => [
                    'active' => true,
                ],
                'default' => esc_html__('Click here', 'havezic'),
                'separator' => 'before',
            ]
        );

        $repeater->add_control(
            'showcase_link',
            [
                'label' => esc_html__('Link to', 'havezic'),
                'placeholder' => esc_html__('https://your-link.com', 'havezic'),
                'type' => Controls_Manager::URL,
            ]
        );

        $this->add_control(
            'items',
            [
                'label' => esc_html__('Items', 'havezic'),
                'type' => Controls_Manager::REPEATER,
                'fields' => $repeater->get_controls(),
                'default' => [
                    [
                        'title' => esc_html__('Title #1', 'havezic'),
                        'subtitle' => esc_html__('Subtitle #1', 'havezic'),
                        'link' => esc_html__('#', 'havezic'),
                    ],
                    [
                        'title' => esc_html__('Title #2', 'havezic'),
                        'subtitle' => esc_html__('Subtitle #2', 'havezic'),
                        'link' => esc_html__('#', 'havezic'),
                    ],
                    [
                        'title' => esc_html__('Title #3', 'havezic'),
                        'subtitle' => esc_html__('Subtitle #3', 'havezic'),
                        'link' => esc_html__('#', 'havezic'),
                    ],
                ],
                'title_field' => '{{{ title }}}',
            ]
        );

        $this->add_group_control(
            Group_Control_Image_Size::get_type(),
            [
                'name' => 'link_image',
                'default' => 'full',
                'separator' => 'none',
            ]
        );

        $this->end_controls_section();

        $this->start_controls_section(
            'section_wrapper_style',
            [
                'label' => esc_html__('Wrapper', 'havezic'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_responsive_control(
            'min-height',
            [
                'label' => esc_html__('Height', 'havezic'),
                'type' => Controls_Manager::SLIDER,
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
                'size_units' => ['px', 'vh'],
                'selectors' => [
                    '{{WRAPPER}} .elementor-link-showcase-inner' => 'min-height: {{SIZE}}{{UNIT}}',
                ],
            ]
        );

        $this->end_controls_section();

        $this->start_controls_section(
            'section_title_style',
            [
                'label' => esc_html__('Title', 'havezic'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_responsive_control(
            'title_width', [
            'label' => esc_html__('Width', 'havezic'),
            'type' => Controls_Manager::SLIDER,
            'range' => [
                '%' => [
                    'min' => 10,
                    'max' => 70,
                ],
                'px' => [
                    'min' => 20,
                    'max' => 800,
                ],
            ],
            'default' => [
                'unit' => '%',
            ],
            'size_units' => ['%', 'px'],
            'selectors' => [
                '{{WRAPPER}} .link-showcase-title-wrapper' => 'flex-basis: {{SIZE}}{{UNIT}}',
            ],
        ]);


        $this->add_responsive_control('title_space_between', [
            'label' => esc_html__('Gap between title', 'havezic'),
            'type' => Controls_Manager::SLIDER,
            'range' => [
                'px' => [
                    'min' => 0,
                    'max' => 400,
                ],
            ],
            'size_units' => ['px'],
            'selectors' => [
                '{{WRAPPER}} .link-showcase-title-inner' => 'gap: {{SIZE}}{{UNIT}}',
            ],
        ]);

        $this->add_responsive_control(
            'title_spacing', [
            'label' => esc_html__('Distance from content', 'havezic'),
            'type' => Controls_Manager::SLIDER,
            'range' => [
                'px' => [
                    'min' => 0,
                    'max' => 400,
                ],
            ],
            'size_units' => ['px'],
            'selectors' => [
                '{{WRAPPER}} .elementor-link-showcase-inner' => 'gap: {{SIZE}}{{UNIT}}',
            ],
        ]);

        $this->add_control(
            'border_type',
            [
                'label' => esc_html__('Border Type', 'havezic'),
                'type' => Controls_Manager::SELECT,
                'options' => [
                    '' => esc_html__('Default', 'havezic'),
                    'none' => esc_html__('None', 'havezic'),
                    'solid' => esc_html__('Solid', 'havezic'),
                    'double' => esc_html__('Double', 'havezic'),
                    'dotted' => esc_html__('Dotted', 'havezic'),
                    'dashed' => esc_html__('Dashed', 'havezic'),
                    'groove' => esc_html__('Groove', 'havezic'),
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-link-showcase-title' => 'border-style: {{VALUE}}',
                ],
            ]
        );

        $this->add_responsive_control(
            'item_padding',
            [
                'label' => esc_html__('Padding', 'havezic'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'selectors' => [
                    '{{WRAPPER}} .elementor-link-showcase-title' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_control(
            'border_radius',
            [
                'label' => esc_html__('Border Radius', 'havezic'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors' => [
                    '{{WRAPPER}} .elementor-link-showcase-title' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',

                ],
            ]
        );

        $this->add_control(
            'border_width',
            [
                'label' => esc_html__('Width', 'havezic'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', 'rem', 'vw', 'custom'],
                'selectors' => [
                    '{{WRAPPER}} .elementor-link-showcase-title' => 'border-width: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
                'condition' => [
                    'border_type!' => ['', 'none'],
                ],
            ]
        );

        $this->add_control(
            'border_color',
            [
                'label' => esc_html__('Color', 'havezic'),
                'type' => Controls_Manager::COLOR,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-link-showcase-title, {{WRAPPER}} .elementor-link-showcase-title span' => 'border-color: {{VALUE}};',
                ],
                'condition' => [
                    'border_type!' => ['', 'none'],
                ],
            ]
        );

        $this->add_control(
            'title_color',
            [
                'label' => esc_html__('Title Color', 'havezic'),
                'type' => Controls_Manager::COLOR,

                'selectors' => [
                    '{{WRAPPER}} .showcase-title' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'title_typography',
                'global' => [
                    'default' => Global_Typography::TYPOGRAPHY_PRIMARY,
                ],
                'selector' => '{{WRAPPER}} .showcase-title',
            ]
        );

        $this->add_control(
            'description_color',
            [
                'label' => esc_html__('Description Color', 'havezic'),
                'type' => Controls_Manager::COLOR,

                'selectors' => [
                    '{{WRAPPER}} .showcase-description' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'description_typography',
                'global' => [
                    'default' => Global_Typography::TYPOGRAPHY_SECONDARY,
                ],
                'selector' => '{{WRAPPER}} .showcase-description',
            ]
        );

        $this->add_group_control(
            Group_Control_Box_Shadow::get_type(),
            [
                'name' => 'link_title_inner_box_shadow',
                'selector' => '{{WRAPPER}} .link-showcase-title-inner .elementor-link-showcase-title',
            ]
        );

        $this->end_controls_section();

        $this->start_controls_section(
            'section_image_style',
            [
                'label' => esc_html__('Image', 'havezic'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_responsive_control(
            'image_padding',
            [
                'label' => esc_html__('Padding', 'havezic'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'selectors' => [
                    '{{WRAPPER}} .link-showcase-content-wrapper' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
                'separator' => 'before',
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
    protected function render()
    {
        $settings = $this->get_settings_for_display();
        if (!empty($settings['items']) && is_array($settings['items'])) {
            $items = $settings['items'];
            // Row
            $this->add_render_attribute('wrapper', 'class', 'elementor-link-showcase-wrapper');
            $this->add_render_attribute('row', 'class', 'elementor-link-showcase-inner');
            $this->add_render_attribute('row', 'role', 'tablist');
            $id_int = substr($this->get_id_int(), 0, 3);
            ?>
            <div <?php $this->print_render_attribute_string('wrapper'); ?>>
                <div <?php $this->print_render_attribute_string('row'); ?>>
                    <div class="link-showcase-item link-showcase-title-wrapper">
                        <div class="link-showcase-title-inner">
                            <?php foreach ($items as $index => $item) :
                                $count = $index + 1;
                                $item_title_setting_key = $this->get_repeater_setting_key('item_title', 'items', $index);
                                $this->add_render_attribute($item_title_setting_key, [
                                    'id' => 'elementor-link-showcase-title-' . $id_int . $count,
                                    'class' => [
                                        'elementor-link-showcase-title',
                                        ($index == 0) ? 'elementor-active' : '',
                                        'elementor-repeater-item-' . $item['_id']
                                    ],
                                    'data-tab' => $count,
                                    'role' => 'tab',
                                    'aria-controls' => 'elementor-link-showcase-content-' . $id_int . $count,
                                ]);

                                ?>
                                <div <?php $this->print_render_attribute_string($item_title_setting_key); ?>>
                                    <div class="showcase-content">
                                        <?php if (!empty($item['title'])) { ?>
                                            <div class="showcase-title"><?php echo sprintf('%s', $item['title']); ?></div>
                                        <?php } ?>
                                        <?php if (!empty($item['description'])) { ?>
                                            <div class="showcase-description"><?php echo sprintf('%s', $item['description']); ?></div>
                                        <?php } ?>
                                    </div>
                                    <?php if ($item['showcase_button']) { ?>
                                        <div class="showcase-button">
                                            <?php $showcase_button = $item['showcase_button'];

                                            $showcase_button = '<a class="showcase-link" href="' . esc_url($item['showcase_link']['url']) . '"><i class="havezic-icon-arrow-small-right"></i><span class="showcase-link-text">' . esc_html($showcase_button) . '</span></a>';

                                            printf('%s', $showcase_button);
                                            ?>
                                        </div>
                                    <?php } ?>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                    <div class="link-showcase-item link-showcase-content-wrapper">
                        <div class="link-showcase-content-inner">
                            <?php foreach ($items as $index => $item) :
                                $count = $index + 1;
                                $item_content_setting_key = $this->get_repeater_setting_key('item_content', 'items', $index);
                                $this->add_render_attribute($item_content_setting_key, [
                                    'id' => 'elementor-link-showcase-content-' . $id_int . $count,
                                    'class' => [
                                        'elementor-link-showcase-content',
                                        'elementor-repeater-item-' . $item['_id'],
                                        ($index == 0) ? 'elementor-active' : '',
                                    ],
                                    'data-tab' => $count,
                                    'role' => 'tab',
                                    'aria-controls' => 'elementor-link-showcase-title-' . $id_int . $count,
                                ]);
                                ?>
                                <div <?php $this->print_render_attribute_string($item_content_setting_key); ?>>
                                    <?php if ('html' === $item['source']): ?>
                                        <?php echo havezic_elementor_parse_text_editor($item['link_content'], $this); // WPCS: XSS ok. ?>
                                    <?php elseif ('template' === $item['source']): ?>
                                        <?php echo Plugin::instance()->frontend->get_builder_content_for_display($item['link_template']); ?>
                                    <?php else: ?>
                                        <?php $this->render_image($settings, $item); ?>
                                    <?php endif; ?>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>
            </div>
            <?php
        }
    }

    private function render_image($settings, $item)
    {
        if (!empty($item['link_image']['url'])) :
            ?>
            <?php
            $item['link_image_size'] = $settings['link_image_size'];
            $item['link_image_custom_dimension'] = $settings['link_image_custom_dimension'];
            echo Group_Control_Image_Size::get_attachment_image_html($item, 'link_image');
            ?>
        <?php
        endif;
    }
}

$widgets_manager->register(new Havezic_Elementor_Link_Showcase());
