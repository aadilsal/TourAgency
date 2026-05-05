<?php

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

use Elementor\Controls_Manager;
use Elementor\Group_Control_Box_Shadow;
use Elementor\Group_Control_Css_Filter;
use Elementor\Icons_Manager;
use Elementor\Repeater;

/**
 * Elementor tabs widget.
 *
 * Elementor widget that displays vertical or horizontal tabs with different
 * pieces of content.
 *
 * @since 1.0.0
 */
class Havezic_Elementor_Brand extends Havezic_Base_Widgets_Swiper {

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
        return 'havezic-brand';
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
        return esc_html__('Brands', 'havezic');
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
        return 'eicon-tabs';
    }

    /**
     * Enqueue scripts.
     *
     * Registers all the scripts defined as element dependencies and enqueues
     * them. Use `get_script_depends()` method to add custom script dependencies.
     *
     * @since 1.3.0
     * @access public
     */

    public function get_script_depends() {
        return ['havezic-elementor-brand', 'havezic-elementor-swiper'];
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
            'section_brands',
            [
                'label' => esc_html__('Brands', 'havezic'),
            ]
        );

        $repeater = new Repeater();

        $repeater->add_control(
            'brand_title',
            [
                'label'       => esc_html__('Brand name', 'havezic'),
                'type'        => Controls_Manager::TEXT,
                'default'     => esc_html__('Brand Name', 'havezic'),
                'placeholder' => esc_html__('Brand Name', 'havezic'),
                'label_block' => true,
            ]
        );

        $repeater->add_responsive_control(
            'brand_source',
            [
                'label'   => esc_html__('Brand Source', 'havezic'),
                'type'    => \Elementor\Controls_Manager::SELECT,
                'default' => 'image',
                'options' => [
                    'image' => esc_html__('Image', 'havezic'),
                    'icon'  => esc_html__('Icon', 'havezic')
                ],
            ]
        );

        $repeater->add_control(
            'brand_image',
            [
                'label'     => esc_html__('Choose Image', 'havezic'),
                'type'      => Controls_Manager::MEDIA,
                'dynamic'   => [
                    'active' => true,
                ],
                'default'   => [
                    'url' => Elementor\Utils::get_placeholder_image_src(),
                ],
                'condition' => [
                    'brand_source' => 'image'
                ]
            ]
        );

        $repeater->add_control(
            'brand_icon',
            [
                'label'            => esc_html__('Icon', 'havezic'),
                'type'             => Controls_Manager::ICONS,
                'fa4compatibility' => 'icon',
                'condition'        => [
                    'brand_source' => 'icon'
                ]
            ]
        );


        $repeater->add_control(
            'image_overlay',
            [
                'label'   => esc_html__('Image Background', 'havezic'),
                'type'    => Controls_Manager::MEDIA,
                'selectors' => [
                    '{{WRAPPER}} {{CURRENT_ITEM}}.elementor-brand-item' => 'background-image: url("{{URL}}");',
                ],
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

        $this->add_control(
            'brands',
            [
                'label'       => esc_html__('Items', 'havezic'),
                'type'        => Controls_Manager::REPEATER,
                'fields'      => $repeater->get_controls(),
                'title_field' => '{{{ brand_title }}}',
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
            'column',
            [
                'label'   => esc_html__('Columns', 'havezic'),
                'type'    => \Elementor\Controls_Manager::SELECT,
                'default' => 3,
                'options' => [1 => 1, 2 => 2, 3 => 3, 4 => 4, 5 => 5, 6 => 6, 7 => 7, 8 => 8],
                'selectors' => [
                    '{{WRAPPER}} .d-grid' => 'grid-template-columns: repeat({{VALUE}}, 1fr)',
                ],
                'condition' => ['enable_carousel!' => 'yes']
            ]
        );

        $this->add_responsive_control(
            'brand_align',
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
                    '{{WRAPPER}} .elementor-brand-item' => 'justify-content: {{VALUE}};',
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
                'size_units' => ['px', 'em'],
                'selectors'  => [
                    '{{WRAPPER}} .d-grid' => 'grid-gap:{{SIZE}}{{UNIT}}',
                ],
                'condition' => ['enable_carousel!' => 'yes']
            ]
        );

        $this->add_responsive_control(
            'min-height',
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
                    '{{WRAPPER}} .elementor-brand-wrapper .grid-item .elementor-brand-item' => 'min-height: {{SIZE}}{{UNIT}}',
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

        $this->start_controls_section(
            'style_brand_wrapper',
            [
                'label' => esc_html__('Brand Item', 'havezic'),
                'tab'   => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->start_controls_tabs('tabs_brand_wrapper');

        $this->start_controls_tab(
            'tab_wrapper_normal',
            [
                'label' => esc_html__('Normal', 'havezic'),
            ]
        );

        $this->add_control(
            'icon_color',
            [
                'label'     => esc_html__('Icon Color', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .elementor-brand-image i'                                               => 'color: {{VALUE}};',
                    '{{WRAPPER}} .elementor-brand-image svg,{{WRAPPER}} .elementor-brand-image svg path' => 'fill: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Css_Filter::get_type(),
            [
                'name'     => 'css_filters',
                'selector' => '{{WRAPPER}} img',
            ]
        );

        $this->add_control(
            'image_opacity',
            [
                'label'     => esc_html__('Opacity', 'havezic'),
                'type'      => Controls_Manager::SLIDER,
                'range'     => [
                    'px' => [
                        'max'  => 1,
                        'min'  => 0.1,
                        'step' => 0.01,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-brand-image img, {{WRAPPER}} .elementor-brand-image i, {{WRAPPER}} .elementor-brand-image svg' => 'opacity: {{SIZE}};',
                ],
            ]
        );

        $this->add_control(
            'background_color',
            [
                'label'     => esc_html__('Background Color', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .grid-item .elementor-brand-item' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'background_overlay',
            [
                'label'     => esc_html__('Background Overlay', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .grid-item .elementor-brand-item:before' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Box_Shadow::get_type(),
            [
                'name'     => 'brand_wrapper',
                'selector' => '{{WRAPPER}} .elementor-brand-image',
            ]
        );

        $this->end_controls_tab();

        $this->start_controls_tab(
            'tab_brand_wrapper_hover',
            [
                'label' => esc_html__('Hover', 'havezic'),
            ]
        );

        $this->add_control(
            'icon_color_hover',
            [
                'label'     => esc_html__('Icon Color', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .elementor-brand-item:hover .elementor-brand-image i'                                                     => 'color: {{VALUE}};',
                    '{{WRAPPER}} .elementor-brand-item:hover .elementor-brand-image svg,{{WRAPPER}} .elementor-brand-item:hover .elementor-brand-image svg path' => 'fill: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Css_Filter::get_type(),
            [
                'name'     => 'css_filters_hover',
                'selector' => '{{WRAPPER}} .grid-item:hover img',
            ]
        );

        $this->add_control(
            'image_opacity_hover',
            [
                'label'     => esc_html__('Opacity', 'havezic'),
                'type'      => Controls_Manager::SLIDER,
                'range'     => [
                    'px' => [
                        'max'  => 1,
                        'min'  => 0.10,
                        'step' => 0.01,
                    ],
                ],
                'default'   => [
                    'size' => 1,
                ],
                'selectors' => [
                    '{{WRAPPER}} .grid-item:hover img, {{WRAPPER}} .grid-item:hover i, {{WRAPPER}} .grid-item:hover svg' => 'opacity: {{SIZE}};',
                ],
            ]
        );

        $this->add_control(
            'background_color_hover',
            [
                'label'     => esc_html__('Background Color', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .grid-item:hover .elementor-brand-item' => 'background-color: {{VALUE}} !important;',
                ],
            ]
        );

        $this->add_control(
                    'background_overlay_hover',
                    [
                        'label'     => esc_html__('Background Overlay', 'havezic'),
                        'type'      => Controls_Manager::COLOR,
                        'selectors' => [
                            '{{WRAPPER}} .grid-item:hover .elementor-brand-item:before' => 'background-color: {{VALUE}} !important;',
                        ],
                    ]
                );

        $this->add_group_control(
            Group_Control_Box_Shadow::get_type(),
            [
                'name'     => 'brand_wrapper_hover',
                'selector' => '{{WRAPPER}} .grid-item:hover',
            ]
        );

        $this->end_controls_tab();

        $this->end_controls_tabs();

        $this->add_group_control(
            \Elementor\Group_Control_Border::get_type(),
            [
                'name'      => 'brand_wrapper_border',
                'selector'  => '{{WRAPPER}} .elementor-brand-item',
                'separator' => 'before'
            ]
        );

        $this->add_control(
            'border_radius_img',
            [
                'label'      => esc_html__('Border Radius', 'havezic'),
                'type'       => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors'  => [
                    '{{WRAPPER}} .grid-item .elementor-brand-item' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',

                ],
            ]
        );

        $this->add_responsive_control(
            'image_width',
            [
                'label'          => esc_html__('Width', 'havezic'),
                'type'           => Controls_Manager::SLIDER,
                'default'        => [
                    'unit' => '%',
                ],
                'tablet_default' => [
                    'unit' => '%',
                ],
                'mobile_default' => [
                    'unit' => '%',
                ],
                'size_units'     => ['%', 'px', 'vw'],
                'range'          => [
                    '%'  => [
                        'min' => 1,
                        'max' => 100,
                    ],
                    'px' => [
                        'min' => 1,
                        'max' => 1000,
                    ],
                    'vw' => [
                        'min' => 1,
                        'max' => 100,
                    ],
                ],
                'selectors'      => [
                    '{{WRAPPER}} .elementor-brand-item .elementor-brand-image img' => 'width: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}} .elementor-brand-item .elementor-brand-image a'   => 'width: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'image_height',
            [
                'label'          => esc_html__('Height', 'havezic'),
                'type'           => Controls_Manager::SLIDER,
                'default'        => [
                    'unit' => 'px',
                ],
                'tablet_default' => [
                    'unit' => 'px',
                ],
                'mobile_default' => [
                    'unit' => 'px',
                ],
                'size_units'     => ['px', 'vh'],
                'range'          => [
                    'px' => [
                        'min' => 1,
                        'max' => 500,
                    ],
                    'vh' => [
                        'min' => 1,
                        'max' => 100,
                    ],
                ],
                'selectors'      => [
                    '{{WRAPPER}} .elementor-brand-item .elementor-brand-image img' => 'height: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}} .elementor-brand-item .elementor-brand-image a'   => 'height: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'image_padding',
            [
                'label'      => esc_html__('Padding', 'havezic'),
                'type'       => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'selectors'  => [
                    '{{WRAPPER}} .grid-item .elementor-brand-item' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'image_margin',
            [
                'label'      => esc_html__('Margin', 'havezic'),
                'type'       => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'selectors'  => [
                    '{{WRAPPER}} .grid-item .elementor-brand-item' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
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
        if (empty($settings['brands'])) {
            return;
        }

        $this->add_render_attribute('wrapper', 'class', 'elementor-brand-wrapper');

        $this->get_data_elementor_columns();

        if (empty($settings['icon']) && !Icons_Manager::is_migration_allowed()) {
            $settings['icon'] = 'fa fa-star';
        }

        if (!empty($settings['icon'])) {
            $this->add_render_attribute('icon', 'class', $settings['icon']);
            $this->add_render_attribute('icon', 'aria-hidden', 'true');
        }

        ?>
        <div class="elementor-brands">
            <div <?php $this->print_render_attribute_string('wrapper'); // WPCS: XSS ok.
            ?>>

                <div <?php $this->print_render_attribute_string('row'); // WPCS: XSS ok.
                ?>>
                    <?php foreach ($settings['brands'] as $item) : ?>
                        <div <?php $this->print_render_attribute_string('item'); // WPCS: XSS ok. ?>>
                            <div class="elementor-brand-item elementor-repeater-item-<?php echo esc_attr($item['_id']); ?>">
                                <div class="elementor-brand-image">
                                    <?php
                                    if (!empty($item['link'])) {
                                        if (!empty($item['link']['is_external'])) {
                                            $this->add_render_attribute('brand-image', 'target', '_blank');
                                        }
                                        if (!empty($item['link']['nofollow'])) {
                                            $this->add_render_attribute('brand-image', 'rel', 'nofollow');
                                        }
                                        echo '<a href="' . esc_url($item['link']['url'] ? $item['link']['url'] : '#') . '" ' . $this->get_render_attribute_string('brand-image') . ' title="' . esc_attr($item['brand_title']) . '">';
                                    }
                                    if ($item['brand_source'] == 'image') {
                                        if (!empty($item['brand_image']['url'])) { ?>
                                            <span class="elementor-animation-brand">
                                                <?php echo Elementor\Group_Control_Image_Size::get_attachment_image_html($item, 'image', 'brand_image'); ?>
                                            </span>
                                       <?php }
                                    } else {
                                        ?>
                                        <span class="elementor-animation-brand">
                                            <?php  Icons_Manager::render_icon($item['brand_icon'], ['aria-hidden' => 'true']);?>
                                        </span>
                                        <?php
                                    }

                                    if (!empty($item['link'])) {
                                        echo '</a>';
                                    }
                                    ?>
                                </div>
                            </div>

                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>
        <?php
    }

}

$widgets_manager->register(new Havezic_Elementor_Brand());
