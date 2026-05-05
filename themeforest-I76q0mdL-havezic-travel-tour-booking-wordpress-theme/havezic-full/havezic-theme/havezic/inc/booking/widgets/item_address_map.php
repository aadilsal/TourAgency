<?php
/**
 * Add widget all-items to Elementor
 *
 * @since   1.3.13
 */

use Elementor\Controls_Manager;
use Elementor\Core\Kits\Documents\Tabs\Global_Colors;
use Elementor\Core\Kits\Documents\Tabs\Global_Typography;

class Havezic_BABE_Elementor_Itemaddressmap_Widget extends \Elementor\Widget_Base {

    /**
     * Get widget name.
     *
     * @return string Widget name.
     */
    public function get_name() {
        return 'babe-item-address-map';
    }

    public function is_reload_preview_required() {
        return true;
    }

    /**
     * Get widget title.
     *
     * @return string Widget title.
     */
    public function get_title() {
        return esc_html__( 'Detail Google Map', 'havezic' );
    }

    /**
     * Get widget icon.
     *
     * @return string Widget icon.
     */
    public function get_icon() {
        return 'eicon-google-maps';
    }

    /**
     * Get widget keywords.
     *
     * Retrieve the list of keywords the widget belongs to.
     *
     * @return array Widget keywords.
     */
    public function get_keywords() {
        return [ 'address', 'map' ];
    }

    /**
     * Get widget categories.
     *
     * @return array Widget categories.
     */
    public function get_categories() {
        return [ 'book-everything-elements' ];
    }

    public function get_script_depends() {
        return ['havezic-ba-address-map.js'];
    }

    /**
     * Register widget controls.
     *
     * Adds different input fields to allow the user to change and customize the widget settings.
     */
    protected function register_controls() {

        $this->title_controls();

        $this->add_control_style_wrapper();

    }

    protected function title_controls() {
        $this->start_controls_section(
            'section_title',
            [
                'label' => __( 'Title Setting', 'havezic' ),
            ]
        );

        $this->add_control(
            'enable_title',
            [
                'label'   => esc_html__('Enable title', 'havezic'),
                'type'    => \Elementor\Controls_Manager::SWITCHER,
                'default' => 'no',
            ]
        );

        $this->add_control(
            'title',
            [
                'label' => esc_html__( 'Title', 'havezic' ),
                'type' => Controls_Manager::TEXTAREA,
                'dynamic' => [
                    'active' => true,
                ],
                'placeholder' => esc_html__( 'Enter your title', 'havezic' ),
                'default' => esc_html__( 'Location', 'havezic' ),
                'condition' => [
                    'enable_title' => 'yes',
                ]
            ]
        );


        $this->add_control(
            'size',
            [
                'label' => esc_html__( 'Size', 'havezic' ),
                'type' => Controls_Manager::SELECT,
                'default' => 'default',
                'options' => [
                    'default' => esc_html__( 'Default', 'havezic' ),
                    'small' => esc_html__( 'Small', 'havezic' ),
                    'medium' => esc_html__( 'Medium', 'havezic' ),
                    'large' => esc_html__( 'Large', 'havezic' ),
                    'xl' => esc_html__( 'XL', 'havezic' ),
                    'xxl' => esc_html__( 'XXL', 'havezic' ),
                ],
                'condition' => [
                    'enable_title' => 'yes',
                ]
            ]
        );

        $this->add_control(
            'header_size',
            [
                'label' => __( 'HTML Tag', 'havezic' ),
                'type' => Controls_Manager::SELECT,
                'options' => [
                    'h1' => 'H1',
                    'h2' => 'H2',
                    'h3' => 'H3',
                    'h4' => 'H4',
                    'h5' => 'H5',
                    'h6' => 'H6',
                    'div' => 'div',
                    'span' => 'span',
                    'p' => 'p',
                ],
                'default' => 'h2',
                'condition' => [
                    'enable_title' => 'yes',
                ]
            ]
        );

        $this->add_responsive_control(
            'align',
            [
                'label' => __( 'Alignment', 'havezic' ),
                'type' => Controls_Manager::CHOOSE,
                'options' => [
                    'left' => [
                        'title' => __( 'Left', 'havezic' ),
                        'icon' => 'eicon-text-align-left',
                    ],
                    'center' => [
                        'title' => __( 'Center', 'havezic' ),
                        'icon' => 'eicon-text-align-center',
                    ],
                    'right' => [
                        'title' => __( 'Right', 'havezic' ),
                        'icon' => 'eicon-text-align-right',
                    ],
                    'justify' => [
                        'title' => __( 'Justified', 'havezic' ),
                        'icon' => 'eicon-text-align-justify',
                    ],
                ],
                'default' => '',
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
                'label' => __( 'View', 'havezic' ),
                'type' => Controls_Manager::HIDDEN,
                'default' => 'traditional',
                'condition' => [
                    'enable_title' => 'yes',
                ]
            ]
        );

        $this->end_controls_section();

        $this->start_controls_section(
            'section_title_style',
            [
                'label' => __( 'Title', 'havezic' ),
                'tab' => Controls_Manager::TAB_STYLE,
                'condition' => [
                    'enable_title' => 'yes',
                ]
            ]
        );

        $this->add_control(
            'title_color',
            [
                'label' => __( 'Text Color', 'havezic' ),
                'type' => Controls_Manager::COLOR,
                'global' => [
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
                'name' => 'typography',
                'global' => [
                    'default' => Global_Typography::TYPOGRAPHY_PRIMARY,
                ],
                'selector' => '{{WRAPPER}} .elementor-heading-title',
                'condition' => [
                    'enable_title' => 'yes',
                ]
            ]
        );

        $this->add_responsive_control(
            'title_margin',
            [
                'label' => __( 'Margin bottom', 'havezic' ),
                'type' => Controls_Manager::SLIDER,
                'range' => [
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
                'name' => 'text_shadow',
                'selector' => '{{WRAPPER}} .elementor-heading-title',
                'condition' => [
                    'enable_title' => 'yes',
                ]
            ]
        );

        $this->add_control(
            'blend_mode',
            [
                'label' => __( 'Blend Mode', 'havezic' ),
                'type' => Controls_Manager::SELECT,
                'options' => [
                    '' => __( 'Normal', 'havezic' ),
                    'multiply' => 'Multiply',
                    'screen' => 'Screen',
                    'overlay' => 'Overlay',
                    'darken' => 'Darken',
                    'lighten' => 'Lighten',
                    'color-dodge' => 'Color Dodge',
                    'saturation' => 'Saturation',
                    'color' => 'Color',
                    'difference' => 'Difference',
                    'exclusion' => 'Exclusion',
                    'hue' => 'Hue',
                    'luminosity' => 'Luminosity',
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

    /**
     * Render widget output on the frontend.
     * Written in PHP and used to generate the final HTML.
     */
    protected function render() {
        $settings = $this->get_settings_for_display();

        echo '<div class="elementor-widget-inner">';
        include get_theme_file_path('template-parts/booking/single/address-map.php');
        echo '</div>';
    }

    protected function title_render() {
        $settings = $this->get_settings_for_display();

        if ( '' === $settings['title'] ||  $settings['enable_title'] === 'no') {
            return;
        }

        $this->add_render_attribute( 'title', 'class', 'elementor-heading-title' );

        if ( ! empty( $settings['size'] ) ) {
            $this->add_render_attribute( 'title', 'class', 'elementor-size-' . $settings['size'] );
        }

        $this->add_inline_editing_attributes( 'title' );

        $title = $settings['title'];

        echo sprintf( '<%1$s %2$s>%3$s</%1$s>', \Elementor\Utils::validate_html_tag( $settings['header_size'] ), $this->get_render_attribute_string( 'title' ), $title );

    }


    protected function add_control_style_wrapper($condition = array()) {
        $this->start_controls_section(
            'section_style_wrapper',
            [
                'label' => esc_html__('Wrapper', 'havezic'),
                'tab'   => \Elementor\Controls_Manager::TAB_STYLE,

            ]
        );

        $this->add_responsive_control(
            'map_height',
            [
                'label'     => esc_html__('Height Map', 'havezic'),
                'type'      => \Elementor\Controls_Manager::SLIDER,
                'range'     => [
                    'px' => [
                        'max'  => 1000,
                        'min'  => 0,
                        'step' => 1,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .google-map-address .map-data-location' => 'height: {{SIZE}}{{UNIT}} !important;',
                ],
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

}

$widgets_manager->register(new Havezic_BABE_Elementor_Itemaddressmap_Widget());