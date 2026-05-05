<?php

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

use Elementor\Controls_Manager;
use Elementor\Core\Kits\Documents\Tabs\Global_Colors;
use Elementor\Group_Control_Typography;
use Elementor\Group_Control_Background;
use Elementor\Repeater;
use Elementor\Icons_Manager;
use Elementor\Group_Control_Image_Size;
class Havezic_Elementor_ImgboxCarousel extends Havezic_Base_Widgets_Swiper {
    /**
     * Get widget name.
     *
     * Retrieve imgbox widget name.
     *
     * @return string Widget name.
     * @since  1.0.0
     * @access public
     *
     */
    public function get_name() {
        return 'havezic-imgbox-carousel';
    }

    /**
     * Get widget title.
     *
     * Retrieve imgbox widget title.
     *
     * @return string Widget title.
     * @since  1.0.0
     * @access public
     *
     */
    public function get_title() {
        return esc_html__('Havezic Imagebox Carousel', 'havezic');
    }

    /**
     * Get widget icon.
     *
     * Retrieve imgbox widget icon.
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
        return ['havezic-elementor-imgbox-carousel', 'havezic-elementor-swiper'];
    }

    public function get_categories() {
        return array('havezic-addons');
    }

    public function on_export($element) {
        unset($element['settings']['box_image']['id']);

        return $element;
    }

    /**
     * Register imgbox widget controls.
     *
     * Adds different input fields to allow the user to change and customize the widget settings.
     *
     * @since  1.0.0
     * @access protected
     */
    protected function register_controls() {
        $this->start_controls_section(
            'section_imgbox',
            [
                'label' => esc_html__('Imgbox Carousel', 'havezic'),
            ]
        );

        $repeater = new Repeater();

        $repeater->add_control(
            'box_type',
            [
                'label'   => esc_html__('Type', 'havezic'),
                'type'    => Controls_Manager::SELECT,
                'default' => 'box_img',
                'options' => [
                    'box_img' => esc_html__('Image', 'havezic'),
                    'box_icon'  => esc_html__('Icon', 'havezic'),
                ]
            ]
        );

        $repeater->add_control(
            'selected_icon',
            [
                'label'     => esc_html__('Icon', 'havezic'),
                'type'      => Controls_Manager::ICONS,
                'fa4compatibility' => 'icon',
                'default'   => [
                    'value'   => 'fas fa-star',
                    'library' => 'fa-solid',
                ],
                'condition' => [
                    'box_type' => 'box_icon'
                ]
            ]
        );

        $repeater->add_control(
            'image_bg',
            [
                'label'   => esc_html__('Image Background', 'havezic'),
                'type'    => Controls_Manager::MEDIA,
                'selectors' => [
                    '{{WRAPPER}} {{CURRENT_ITEM}}.elementor-imgbox-wrapper' => 'background-image: url("{{URL}}");',
                ],
                'condition' => [
                    'box_type' => 'box_icon'
                ]
            ]
        );

        $repeater->add_control(
            'icon_bg',
            [
                'label' => __('Background Icon', 'havezic'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} {{CURRENT_ITEM}} .elementor-icon' => 'background-color: {{VALUE}}',
                ],
                'condition' => [
                    'box_type' => 'box_icon'
                ]
            ]
        );

        $repeater->add_control(
            'box_image',
            [
                'label'      => esc_html__('Choose Image', 'havezic'),
                'default'    => [
                    'url' => Elementor\Utils::get_placeholder_image_src(),
                ],
                'type'       => Controls_Manager::MEDIA,
                'show_label' => false,
                'condition'  => [
                    'box_type' => 'box_img'
                ],
            ]
        );

        $repeater->add_control(
            'imgbox_title',
            [
                'label'   => esc_html__('Title', 'havezic'),
                'type'    => Controls_Manager::TEXT,
                'default' => esc_html__( 'This is the heading', 'havezic' ),
                'placeholder' => esc_html__( 'Enter your title', 'havezic' ),
                'label_block' => true,
            ]
        );

        $repeater->add_control(
            'imgbox_desc',
            [
                'label'       => esc_html__('Description', 'havezic'),
                'type'        => Controls_Manager::TEXTAREA,
                'default'     => 'Lorem ipsum dolor sit amet consectetur adipiscing elit dolor',
                'label_block' => true,
                'rows'        => '10',
            ]
        );

        $repeater->add_control(
            'imgbox_button',
            [
                'label' => esc_html__( 'Button Text', 'havezic' ),
                'type' => Controls_Manager::TEXT,
                'dynamic' => [
                    'active' => true,
                ],
                'default' => '',
                'separator' => 'before',
            ]
        );

        $repeater->add_control(
            'imgbox_link',
            [
                'label'       => esc_html__('Link to', 'havezic'),
                'type'        => Controls_Manager::URL,
                'default' => [
                    'url' => '#',
                ],
                'placeholder' => esc_html__('https://your-link.com', 'havezic'),
            ]
        );

        $this->add_control(
            'imgbox-carousel',
            [
                'label'       => esc_html__('Items', 'havezic'),
                'type'        => Controls_Manager::REPEATER,
                'fields'      => $repeater->get_controls(),
                'title_field' => '{{{ imgbox_title }}}',
            ]
        );

        $this->add_group_control(
            Elementor\Group_Control_Image_Size::get_type(),
            [
                'name'      => 'box_image',
                'default'   => 'full',
                'separator' => 'none',
            ]
        );

        $this->add_control(
            'imgbox_layout',
            [
                'label'   => esc_html__('Layout', 'havezic'),
                'type'    => Controls_Manager::SELECT,
                'default' => '1',
                'options' => [
                    '1' => esc_html__('Layout 1', 'havezic'),
                    '2' => esc_html__('Layout 2', 'havezic'),
                ]
            ]
        );

        $this->add_responsive_control(
            'column',
            [
                'label'        => esc_html__('Columns', 'havezic'),
                'type'         => \Elementor\Controls_Manager::SELECT,
                'default'      => 3,
                'options'      => [1 => 1, 2 => 2, 3 => 3, 4 => 4, 5 => 5, 6 => 6],
                'selectors' => [
                    '{{WRAPPER}} .d-grid' => 'grid-template-columns: repeat({{VALUE}}, 1fr)',
                ],
                'condition' => ['enable_carousel!' => 'yes']
            ]
        );

        $this->add_responsive_control(
            'gutter',
            [
                'label'      => esc_html__('Gutter', 'havezic'),
                'type'       => Controls_Manager::SLIDER,
                'range'      => [
                    'px' => [
                        'min' => 0,
                        'max' => 50,
                    ],
                ],
                'size_units' => ['px'],
                'selectors'  => [
                    '{{WRAPPER}} .d-grid' => 'grid-gap:{{SIZE}}{{UNIT}}',
                ],
                'condition'  => ['enable_carousel!' => 'yes']
            ]
        );

        $this->add_responsive_control(
            'imgbox_alignment',
            [
                'label'       => esc_html__('Alignment', 'havezic'),
                'type'        => Controls_Manager::CHOOSE,
                'options'     => [
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
                'label_block' => false,
                'render_type' => 'template',
                'default'      => 'center',
                'selectors'   => [
                    '{{WRAPPER}} .box-image' => 'text-align: {{VALUE}};',
                    '{{WRAPPER}} .elementor-icon-box-content' => 'text-align: {{VALUE}};',
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

        $this->add_control(
            'view',
            [
                'label'   => esc_html__('View', 'havezic'),
                'type'    => Controls_Manager::HIDDEN,
                'default' => 'traditional',
            ]
        );
        $this->end_controls_section();

        // wrapper

        $this->start_controls_section(
            'section_imgbox_wrapper',
            [
                'label' => esc_html__( 'Wrapper', 'havezic' ),
                'tab'   => Controls_Manager::TAB_STYLE,
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
                    '{{WRAPPER}} .layout-2 .elementor-icon-box-content' => 'min-height: {{SIZE}}{{UNIT}}',
                ],
                'condition' => [
                    'imgbox_layout' => '2',
                ],
            ]
        );

        $this->add_control(
            'wrapper_padding',
            [
                'label'      => esc_html__('Padding', 'havezic'),
                'type'       => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors'  => [
                    '{{WRAPPER}} .elementor-imgbox-wrapper' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
                'condition' => [
                    'imgbox_layout' => '1',
                ],
            ]
        );

        $this->add_responsive_control(
            'wrapper_radius',
            [
                'label'      => esc_html__('Border Radius', 'havezic'),
                'type'       => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors'  => [
                    '{{WRAPPER}} .elementor-imgbox-wrapper' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
                'condition' => [
                    'imgbox_layout' => '2'
                ]
            ]
        );

        $this->end_controls_section();

        // image style
        $this->start_controls_section(
            'section_style_image',
            [
                'label' => esc_html__( 'Image', 'havezic' ),
                'tab'   => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'background_image',
            [
                'label' => esc_html__( 'Background Color', 'havezic' ),
                'type' => Controls_Manager::COLOR,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .box-image:before' => 'background-color: {{VALUE}};',
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
                    '{{WRAPPER}} .box-image:before' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                    '{{WRAPPER}} .box-image img' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->end_controls_section();

        // icon style

        $this->start_controls_section(
            'section_style_icon',
            [
                'label' => esc_html__( 'Icon', 'havezic' ),
                'tab'   => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'icon_color',
            [
                'label' => esc_html__( 'Color', 'havezic' ),
                'type' => Controls_Manager::COLOR,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-icon svg ,{{WRAPPER}} .elementor-icon i' => 'fill: {{VALUE}}; color: {{VALUE}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'icon_size',
            [
                'label' => esc_html__( 'Size', 'havezic' ),
                'type' => Controls_Manager::SLIDER,
                'size_units' => [ 'px', '%', 'em', 'rem', 'vw', 'custom' ],
                'range' => [
                    'px' => [
                        'min' => 6,
                        'max' => 300,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-icon' => 'font-size: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->end_controls_section();

        // Content style
        $this->start_controls_section(
            'section_style_imgbox_content',
            [
                'label' => esc_html__('Content', 'havezic'),
                'tab'   => Controls_Manager::TAB_STYLE,
            ]
        );

        // Title
        $this->add_control(
            'heading_style_title',
            [
                'type' => Controls_Manager::HEADING,
                'label' => esc_html__( 'Title', 'havezic' ),

            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name'     => 'title_typography',
                'selector' => '{{WRAPPER}} .elementor-imgbox-title',
            ]
        );

        $this->add_control(
            'title_padding',
            [
                'label'      => esc_html__('Padding', 'havezic'),
                'type'       => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors'  => [
                    '{{WRAPPER}} .layout-2 .elementor-imgbox-title' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
                'condition' => [
                    'imgbox_layout' => '2',
                ],
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
                    '{{WRAPPER}} .elementor-imgbox-title' => 'margin-bottom: {{SIZE}}{{UNIT}};',
                ],
                'condition' => [
                    'imgbox_layout' => '1',
                ],
            ]
        );

        $this->add_control(
            'heading_style_description',
            [
                'type' => Controls_Manager::HEADING,
                'label' => esc_html__( 'Description', 'havezic' ),
                'separator' => 'before',
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name'     => 'content_typography',
                'selector' => '{{WRAPPER}} .grid-item .elementor-imgbox-desc',
            ]
        );

        $this->add_responsive_control(
            'desc_spacing',
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
                    '{{WRAPPER}} .elementor-imgbox-desc' => 'margin-bottom: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_control(
            'heading_tab_content_colors',
            [
                'type' => Controls_Manager::HEADING,
                'label' => esc_html__( 'Colors', 'havezic' ),
                'separator' => 'before',
            ]
        );

        $this->start_controls_tabs( 'color_tabs' );
        $this->start_controls_tab( 'colors_normal',
            [
                'label' => esc_html__( 'Normal', 'havezic' ),
            ]
        );

        $this->add_control(
            'title_color',
            [
                'label'     => esc_html__('Title', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'default'   => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-imgbox-title' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'desc_color',
            [
                'label'     => esc_html__('Desc', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'default'   => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-imgbox-desc' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->end_controls_tab();

        $this->start_controls_tab(
            'colors_hover',
            [
                'label' => esc_html__( 'Hover', 'havezic' ),
            ]
        );

        $this->add_control(
            'title_color_hover',
            [
                'label'     => esc_html__('Title', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'default'   => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-imgbox-item:hover .elementor-imgbox-title' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'desc_color_hover',
            [
                'label'     => esc_html__('Desc', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'default'   => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-imgbox-item:hover .elementor-imgbox-desc' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->end_controls_tab();

        $this->end_controls_tabs();

        $this->end_controls_section();

        $this->start_controls_section(
            'button_style',
            [
                'label' => esc_html__('Button', 'havezic'),
                'tab'   => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->start_controls_tabs( 'button_color_tabs' );

        $this->start_controls_tab( 'button_colors_normal',
            [
                'label' => esc_html__( 'Normal', 'havezic' ),
            ]
        );
        $this->add_control(
            'button_color',
            [
                'label'     => esc_html__('Text Color', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'default'   => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-button-text' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Background::get_type(),
            [
                'name' => 'button_background',
                'types' => [ 'classic', 'gradient' ],
                'exclude' => [ 'image' ],
                'selector' => '{{WRAPPER}} .elementor-button-text',
                'fields_options' => [
                    'background' => [
                        'default' => 'classic',
                    ],
                    'color' => [
                        'dynamic' => [],
                    ],
                    'color_b' => [
                        'dynamic' => [],
                    ],
                ],
            ]
        );


        $this->end_controls_tab();

        $this->start_controls_tab(
            'button_colors_hover',
            [
                'label' => esc_html__( 'Hover', 'havezic' ),
            ]
        );
        $this->add_control(
            'button_color_hover',
            [
                'label'     => esc_html__('Text Color', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'default'   => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-button-text:hover' => 'color: {{VALUE}};',
                ],
            ]
        );


        $this->add_group_control(
            Group_Control_Background::get_type(),
            [
                'name' => 'button_background_hover',
                'types' => [ 'classic', 'gradient' ],
                'exclude' => [ 'image' ],
                'fields_options' => [
                    'background' => [
                        'default' => 'classic',
                    ],
                    'color' => [
                        'dynamic' => [],
                    ],
                    'color_b' => [
                        'dynamic' => [],
                    ],
                ],
                'selector' => '{{WRAPPER}} .elementor-button-text:hover',
            ]
        );

        $this->end_controls_tab();

        $this->end_controls_tabs();

        $this->add_responsive_control(
            'button_spacing',
            [
                'label'      => esc_html__('Spacing', 'havezic'),
                'type'       => Controls_Manager::SLIDER,
                'size_units' => ['px', 'em', '%'],
                'range'      => [
                    'px' => [
                        'min' => 0,
                        'max' => 300,
                    ],
                ],
                'selectors'  => [
                    '{{WRAPPER}} .elementor-button' => 'margin-bottom: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->end_controls_section();

        // Carousel options
        $this->add_control_carousel(['enable_carousel' => 'yes']);

    }

    /**
     * Render imgbox widget output on the frontend.
     *
     * Written in PHP and used to generate the final HTML.
     *
     * @since  1.0.0
     * @access protected
     */
    protected function render() {
        $settings = $this->get_settings_for_display();
        if (!empty($settings['imgbox-carousel']) && is_array($settings['imgbox-carousel'])) {
            $this->add_render_attribute('wrapper', 'class', 'elementor-imgbox-item-wrapper');
            $this->add_render_attribute('row', 'class', 'alignment-' . esc_attr($settings['imgbox_alignment']));
            $this->add_render_attribute('row', 'class', 'layout-' . esc_attr($settings['imgbox_layout']));
            // Carousel
            $this->get_data_elementor_columns();
            // Item
            $this->add_render_attribute('item', 'class', 'elementor-imgbox-item');

            $migrated = isset( $settings['__fa4_migrated']['selected_icon'] );
            $is_new = empty( $settings['icon'] ) && Icons_Manager::is_migration_allowed();

            ?>

            <div <?php $this->print_render_attribute_string('wrapper'); // WPCS: XSS ok. ?>>
                <div <?php $this->print_render_attribute_string('row'); // WPCS: XSS ok. ?>>
                    <?php foreach ($settings['imgbox-carousel'] as $imgbox):

                        ?>
                        <div <?php $this->print_render_attribute_string('item'); // WPCS: XSS ok. ?>>
                            <div class="elementor-imgbox-wrapper elementor-repeater-item-<?php echo esc_attr($imgbox['_id']); ?>">
                                <div class="elementer-imgbox-inner">
                                    <div class="elementor-icon-box-content elementor-button-type-outline elementor-widget-havezic-button">
                                        <?php if ($imgbox['imgbox_title']) { ?>
                                            <a href="<?php echo esc_url($imgbox['imgbox_link']['url']); ?>"><h6 class="elementor-imgbox-title"><?php echo sprintf('%s', $imgbox['imgbox_title']); ?></h6></a>
                                        <?php } ?>
                                        <div class="elmentor-icon-box-infor">
                                            <?php if ($imgbox['box_type'] == 'box_icon') { ?>
                                                <?php if (!empty($imgbox['icon']) || !empty($imgbox['selected_icon']['value'])) : ?>
                                                    <div class="elementor-icon-box-icon">
                                        <span class="elementor-icon">
                                            <?php if ($is_new || $migrated) :
                                                Elementor\Icons_Manager::render_icon($imgbox['selected_icon'], ['aria-hidden' => 'true']);
                                            else : ?>
                                                <i class="<?php echo esc_attr($imgbox['icon']); ?>" aria-hidden="true"></i>
                                            <?php endif; ?>
                                        </span>
                                                    </div>
                                                <?php endif; ?>
                                            <?php }
                                            ?>
                                            <div class="imgbox-meta">
                                                <?php if (!empty($imgbox['imgbox_desc'])) { ?>
                                                    <p class="elementor-imgbox-desc"><?php echo sprintf('%s', $imgbox['imgbox_desc']); ?></p>
                                                <?php } ?>
                                                <?php if ($imgbox['imgbox_button']) { ?>
                                                    <div class="elementor-button-typo-link">
                                                        <a class="elementor-button" href="<?php echo esc_url($imgbox['imgbox_link']['url']); ?>">
                                                <span class="elementor-button-content-wrapper">
                                                    <span class="elementor-button-icon left"><i aria-hidden="true" class="havezic-icon- havezic-icon-arrow-small-right"></i></span>
                                                    <span class="elementor-button-text"><?php echo sprintf('%s', $imgbox['imgbox_button']); ?></span>
                                                    <span class="elementor-button-icon right"><i aria-hidden="true" class="havezic-icon- havezic-icon-arrow-small-right"></i></span>
                                                </span>
                                                        </a>
                                                    </div>
                                                <?php } ?>
                                            </div>
                                        </div>
                                    </div>

                                    <?php if ($imgbox['box_type'] == 'box_img') { ?>
                                        <?php $this->render_image($settings, $imgbox); ?>
                                    <?php } ?>

                                </div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
            <?php $this->render_swiper_pagination_navigation();?>
            <?php
        }
    }

    private function render_image($settings, $imgbox) {
        if (!empty($imgbox['box_image']['url'])) :
            ?>
            <div class="box-image">
                <a href="<?php echo esc_url($imgbox['imgbox_link']['url']); ?>">
                    <?php
                    $imgbox['box_image_size']             = $settings['box_image_size'];
                    $imgbox['box_image_custom_dimension'] = $settings['box_image_custom_dimension'];
                    echo Group_Control_Image_Size::get_attachment_image_html($imgbox, 'box_image');
                    ?>
                </a>
            </div>
        <?php
        endif;
    }

}

$widgets_manager->register(new Havezic_Elementor_ImgboxCarousel());

