<?php
/**
 * Add widget all-items to Elementor
 *
 * @since   1.3.13
 */

use Elementor\Controls_Manager;
use Elementor\Core\Kits\Documents\Tabs\Global_Colors;
use Elementor\Core\Kits\Documents\Tabs\Global_Typography;


class Havezic_BABE_Elementor_Itemsteps_Widget extends \Elementor\Widget_Base {

    /**
     * Get widget name.
     *
     * @return string Widget name.
     */
    public function get_name() {
        return 'babe-item-steps';
    }

    /**
     * Get widget title.
     *
     * @return string Widget title.
     */
    public function get_title() {
        return esc_html__('Detail Tour Plan', 'havezic');
    }

    /**
     * Get widget icon.
     *
     * @return string Widget icon.
     */
    public function get_icon() {
        return 'eicon-toggle';
    }

    /**
     * Get widget keywords.
     *
     * Retrieve the list of keywords the widget belongs to.
     *
     * @return array Widget keywords.
     */
    public function get_keywords() {
        return ['description'];
    }

    /**
     * Get widget categories.
     *
     * @return array Widget categories.
     */
    public function get_categories() {
        return ['book-everything-elements'];
    }


    public function get_script_depends() {
        return ['havezic-ba-step.js'];
    }

    /**
     * Register widget controls.
     *
     * Adds different input fields to allow the user to change and customize the widget settings.
     */
    protected function register_controls() {

        $this->title_controls();

        $this->content_step_controls();
    }

    protected function title_controls() {
        $this->start_controls_section(
            'section_title',
            [
                'label' => __('Heading Setting', 'havezic'),
            ]
        );

        $this->add_control(
            'enable_title',
            [
                'label'   => esc_html__('Enable Heading', 'havezic'),
                'type'    => \Elementor\Controls_Manager::SWITCHER,
                'default' => 'no',
            ]
        );

        $this->add_control(
            'title',
            [
                'label'       => __('Heading', 'havezic'),
                'type'        => Controls_Manager::TEXTAREA,
                'dynamic'     => [
                    'active' => true,
                ],
                'placeholder' => __('Enter your title', 'havezic'),
                'default'     => __('Add Your Heading Text Here', 'havezic'),
                'condition'   => [
                    'enable_title' => 'yes',
                ]
            ]
        );


        $this->add_control(
            'size',
            [
                'label'     => __('Size', 'havezic'),
                'type'      => Controls_Manager::SELECT,
                'default'   => 'default',
                'options'   => [
                    'default' => __('Default', 'havezic'),
                    'small'   => __('Small', 'havezic'),
                    'medium'  => __('Medium', 'havezic'),
                    'large'   => __('Large', 'havezic'),
                    'xl'      => __('XL', 'havezic'),
                    'xxl'     => __('XXL', 'havezic'),
                ],
                'condition' => [
                    'enable_title' => 'yes',
                ]
            ]
        );

        $this->add_control(
            'header_size',
            [
                'label'     => __('HTML Tag', 'havezic'),
                'type'      => Controls_Manager::SELECT,
                'options'   => [
                    'h1'   => 'H1',
                    'h2'   => 'H2',
                    'h3'   => 'H3',
                    'h4'   => 'H4',
                    'h5'   => 'H5',
                    'h6'   => 'H6',
                    'div'  => 'div',
                    'span' => 'span',
                    'p'    => 'p',
                ],
                'default'   => 'h2',
                'condition' => [
                    'enable_title' => 'yes',
                ]
            ]
        );

        $this->add_responsive_control(
            'align',
            [
                'label'     => __('Alignment', 'havezic'),
                'type'      => Controls_Manager::CHOOSE,
                'options'   => [
                    'left'    => [
                        'title' => __('Left', 'havezic'),
                        'icon'  => 'eicon-text-align-left',
                    ],
                    'center'  => [
                        'title' => __('Center', 'havezic'),
                        'icon'  => 'eicon-text-align-center',
                    ],
                    'right'   => [
                        'title' => __('Right', 'havezic'),
                        'icon'  => 'eicon-text-align-right',
                    ],
                    'justify' => [
                        'title' => __('Justified', 'havezic'),
                        'icon'  => 'eicon-text-align-justify',
                    ],
                ],
                'default'   => '',
                'selectors' => [
                    '{{WRAPPER}}' => 'text-align: {{VALUE}};',
                ],
                'condition' => [
                    'enable_title' => 'yes',
                ]
            ]
        );

        $this->add_control(
            'view',
            [
                'label'     => __('View', 'havezic'),
                'type'      => Controls_Manager::HIDDEN,
                'default'   => 'traditional',
                'condition' => [
                    'enable_title' => 'yes',
                ]
            ]
        );

        $this->end_controls_section();

        $this->start_controls_section(
            'section_title_style',
            [
                'label'     => __('Heading', 'havezic'),
                'tab'       => Controls_Manager::TAB_STYLE,
                'condition' => [
                    'enable_title' => 'yes',
                ]
            ]
        );

        $this->add_control(
            'title_color',
            [
                'label'     => __('Text Color', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'global'    => [
                    'default' => Global_Colors::COLOR_PRIMARY,
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-heading-title' => 'color: {{VALUE}};',
                ],
                'condition' => [
                    'enable_title' => 'yes',
                ]
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name'      => 'typography',
                'global'    => [
                    'default' => Global_Typography::TYPOGRAPHY_PRIMARY,
                ],
                'selector'  => '{{WRAPPER}} .elementor-heading-title',
                'condition' => [
                    'enable_title' => 'yes',
                ]
            ]
        );

        $this->add_responsive_control(
            'title_margin',
            [
                'label'     => __('Margin bottom', 'havezic'),
                'type'      => Controls_Manager::SLIDER,
                'range'     => [
                    'px' => [
                        'min' => 0,
                        'max' => 100,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-widget-container .elementor-heading-title' => 'margin-bottom: {{SIZE}}{{UNIT}};',
                ],
                'separator' => 'before',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Text_Shadow::get_type(),
            [
                'name'      => 'text_shadow',
                'selector'  => '{{WRAPPER}} .elementor-heading-title',
                'condition' => [
                    'enable_title' => 'yes',
                ]
            ]
        );

        $this->add_control(
            'blend_mode',
            [
                'label'     => __('Blend Mode', 'havezic'),
                'type'      => Controls_Manager::SELECT,
                'options'   => [
                    ''            => __('Normal', 'havezic'),
                    'multiply'    => 'Multiply',
                    'screen'      => 'Screen',
                    'overlay'     => 'Overlay',
                    'darken'      => 'Darken',
                    'lighten'     => 'Lighten',
                    'color-dodge' => 'Color Dodge',
                    'saturation'  => 'Saturation',
                    'color'       => 'Color',
                    'difference'  => 'Difference',
                    'exclusion'   => 'Exclusion',
                    'hue'         => 'Hue',
                    'luminosity'  => 'Luminosity',
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-heading-title' => 'mix-blend-mode: {{VALUE}}',
                ],
                'separator' => 'none',
                'condition' => [
                    'enable_title' => 'yes',
                ]
            ]
        );

        $this->end_controls_section();
    }


    protected function content_step_controls() {
        $this->start_controls_section(
            'section_style_content',
            [
                'label' => __('Content Style', 'havezic'),
                'tab'   => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'title_step_color',
            [
                'label'     => __('Title Color', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .block_step_title h4.step_title' => 'color: {{VALUE}};',
                ]
            ]
        );

        $this->add_control(
            'title_step_color_active',
            [
                'label'     => __('Title Color Active', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .block_step_title.block_active h4.step_title' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name'     => 'title_typography',
                'global'   => [
                    'default' => Global_Typography::TYPOGRAPHY_PRIMARY,
                ],
                'selector' => '{{WRAPPER}} h4.step_title',
            ]
        );

        $this->add_control(
            'heading_background',
            [
                'label'     => __('Heading Background', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .block_step .block_step_title' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'heading_background_active',
            [
                'label'     => __('Heading Background Active', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .block_step .block_step_title.block_active' => 'background-color: {{VALUE}};',
                ],
            ]
        );


        $this->add_control(
            'content_color',
            [
                'label'     => __('Content Color', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'global'    => [
                    'default' => Global_Colors::COLOR_TEXT,
                ],
                'selectors' => [
                    '{{WRAPPER}} .block_step_content.collapse-body.block_active .content' => 'color: {{VALUE}};',
                ]
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name'     => 'content_typography',
                'global'   => [
                    'default' => Global_Typography::TYPOGRAPHY_TEXT,
                ],
                'selector' => '{{WRAPPER}} .block_step_content.collapse-body.block_active .content'
            ]
        );

        $this->add_responsive_control(
            'content_padding',
            [
                'label'      => esc_html__('Content Padding', 'havezic'),
                'type'       => \Elementor\Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'selectors'  => [
                    '{{WRAPPER}} .block_step_content.collapse-body.block_active .content' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );


        $this->end_controls_section();
    }

    /**
     * Render widget output on the frontend.
     * Written in PHP and used to generate the final HTML.
     */
    protected function render() {
        include get_theme_file_path('template-parts/booking/single/steps.php');
    }

    protected function title_render() {
        $settings = $this->get_settings_for_display();

        if ('' === $settings['title'] || $settings['enable_title'] === 'no') {
            return;
        }

        $this->add_render_attribute('title', 'class', 'elementor-heading-title');

        if (!empty($settings['size'])) {
            $this->add_render_attribute('title', 'class', 'elementor-size-' . $settings['size']);
        }

        $this->add_inline_editing_attributes('title');

        $title = $settings['title'];

        echo sprintf('<%1$s %2$s>%3$s</%1$s>', \Elementor\Utils::validate_html_tag($settings['header_size']), $this->get_render_attribute_string('title'), $title);

    }

    protected function render_icon($value) {
        if (!empty($value)) { ?>
            <span class="item_icon">
                <?php \Elementor\Icons_Manager::render_icon($value, ['aria-hidden' => 'true']); ?>
            </span>
            <?php
        }
    }
}

$widgets_manager->register(new Havezic_BABE_Elementor_Itemsteps_Widget());