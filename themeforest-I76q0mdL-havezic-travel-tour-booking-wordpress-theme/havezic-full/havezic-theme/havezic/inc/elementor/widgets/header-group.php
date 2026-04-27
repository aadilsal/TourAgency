<?php

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;

class Havezic_Elementor_Header_Group extends Elementor\Widget_Base {

    public function get_name() {
        return 'havezic-header-group';
    }

    public function get_title() {
        return esc_html__('Havezic Header Group', 'havezic');
    }

    public function get_icon() {
        return 'eicon-lock-user';
    }

    public function get_categories() {
        return array('havezic-addons');
    }

    public function get_script_depends() {
        return ['magnific-popup', 'havezic-elementor-header-group'];
    }

    protected function register_controls() {

        $this->start_controls_section(
            'header_group_config',
            [
                'label' => esc_html__('Config', 'havezic'),
            ]
        );

        $this->add_control(
            'show_search',
            [
                'label' => esc_html__('Show search', 'havezic'),
                'type'  => Controls_Manager::SWITCHER,
            ]
        );
        if (havezic_is_ba_booking_activated()) {
            $this->add_control(
                'show_wishlish',
                [
                    'label' => esc_html__('Show Wishlist', 'havezic'),
                    'type'  => Controls_Manager::SWITCHER,
                ]
            );
        }
        $this->add_control(
            'show_account',
            [
                'label' => esc_html__('Show account', 'havezic'),
                'type'  => Controls_Manager::SWITCHER,
            ]
        );

        $this->add_control(
            'display_content_acc',
            [
                'label'        => esc_html__('Hidden account text', 'havezic'),
                'type'         => \Elementor\Controls_Manager::SWITCHER,
                'prefix_class' => 'hidden-havezic-content-acc-',
                'condition'    => [
                    'show_account' => 'yes',
                ],
            ]
        );

        $this->add_control(
            'dropdown_account_position',
            [
                'label'        => esc_html__('Dropdown position', 'havezic'),
                'type'         => Controls_Manager::SELECT,
                'options'      => [
                    'bottom_left'   => esc_html__('Bottom Left', 'havezic'),
                    'bottom_center' => esc_html__('Bottom Center', 'havezic'),
                    'bottom_right'  => esc_html__('Bottom Right', 'havezic'),
                    'top_left'      => esc_html__('Top Left', 'havezic'),
                    'top_center'    => esc_html__('Top Center', 'havezic'),
                    'top_right'     => esc_html__('Top Right', 'havezic'),
                ],
                'default'      => 'bottom_right',
                'prefix_class' => 'account-dropdown-position-',
            ]
        );

        $this->end_controls_section();

        $this->start_controls_section(
            'header_group_icon',
            [
                'label' => esc_html__('Icon', 'havezic'),
                'tab'   => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'icon_color',
            [
                'label'     => esc_html__('Color', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'default'   => '',
                'selectors' => [
                    '{{WRAPPER}} .header-group-action > div:not(.site-header-account) i' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'icon_color_hover',
            [
                'label'     => esc_html__('Color Hover', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'default'   => '',
                'selectors' => [
                    '{{WRAPPER}} .header-group-action > div:not(.site-header-account) a:hover i' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'icon_size',
            [
                'label'     => esc_html__('Font Size', 'havezic'),
                'type'      => Controls_Manager::SLIDER,
                'range'     => [
                    'px' => [
                        'min' => 0,
                        'max' => 100,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .header-group-action > div a i' => 'font-size: {{SIZE}}{{UNIT}};',
                ],
            ]
        );


        $this->add_responsive_control(
            'icon_margin',
            [
                'label'      => esc_html__('Margin', 'havezic'),
                'type'       => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em'],
                'selectors'  => [
                    '{{WRAPPER}} .header-group-action > div' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );


        $this->add_control(
            'icon-border',
            [
                'label'        => esc_html__('Icon Border', 'havezic'),
                'type'         => Controls_Manager::SWITCHER,
                'prefix_class' => 'icon-border-',
            ]
        );

        $this->add_responsive_control(
            'border_width',
            [
                'label'      => esc_html__('Border Width', 'havezic'),
                'type'       => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em'],
                'selectors'  => [
                    '{{WRAPPER}} .header-group-action > div' => 'border-width: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
                'condition'  => [
                    'icon-border' => 'yes',
                ],
            ]
        );
        $this->add_control(
            'border_color',
            [
                'label'     => esc_html__('Border Color', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'default'   => '',
                'selectors' => [
                    '{{WRAPPER}} .header-group-action > div' => 'border-color: {{VALUE}};',
                    'condition'                              => [
                        'icon-border' => 'yes',
                    ],
                ],
            ]
        );

        $this->add_responsive_control(
            'icon_min-width',
            [
                'label'     => esc_html__('Min Width', 'havezic'),
                'type'      => Controls_Manager::SLIDER,
                'range'     => [
                    'px' => [
                        'min' => 0,
                        'max' => 100,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}}.icon-border-yes .header-group-action > div' => 'min-width: {{SIZE}}{{UNIT}};',
                ],
                'condition' => [
                    'icon-border' => 'yes',
                ],
            ]
        );

        $this->add_responsive_control(
            'icon_min-height',
            [
                'label'     => esc_html__('Min Height', 'havezic'),
                'type'      => Controls_Manager::SLIDER,
                'range'     => [
                    'px' => [
                        'min' => 0,
                        'max' => 100,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}}.icon-border-yes .header-group-action > div' => 'min-height: {{SIZE}}{{UNIT}};',
                ],
                'condition' => [
                    'icon-border' => 'yes',
                ],
            ]
        );

        $this->end_controls_section();

        $this->start_controls_section(
            'header_group_content',
            [
                'label' => esc_html__('Content', 'havezic'),
                'tab'   => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name'     => 'title_typography',
                'selector' => '{{WRAPPER}} .account-content',
            ]
        );

        $this->start_controls_tabs('content_tabs');

        $this->start_controls_tab('content_normal',
            [
                'label' => esc_html__('Normal', 'havezic'),
            ]
        );

        $this->add_control(
            'content_color',
            [
                'label'     => esc_html__('Color', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'default'   => '',
                'selectors' => [
                    '{{WRAPPER}} .header-group-action a .account-content'     => 'color: {{VALUE}};',
                    '{{WRAPPER}} .header-group-action .site-header-account i' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'content_bg_color',
            [
                'label'     => esc_html__('Background Color', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .site-header-account' => 'background-color: {{VALUE}}',
                ],
            ]
        );

        $this->end_controls_tab();

        $this->start_controls_tab(
            'colors_hover',
            [
                'label' => esc_html__('Hover', 'havezic'),
            ]
        );

        $this->add_control(
            'content_color_hover',
            [
                'label'     => esc_html__('Color Hover', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'default'   => '',
                'selectors' => [
                    '{{WRAPPER}} .header-group-action a:hover .account-content'     => 'color: {{VALUE}};',
                    '{{WRAPPER}} .header-group-action a:hover i'                    => 'color: {{VALUE}};',
                    '{{WRAPPER}} .site-header-account:hover .account-content'       => 'color: {{VALUE}}',
                    '{{WRAPPER}} .site-header-account:hover .site-header-account i' => 'color: {{VALUE}}',
                ],
            ]
        );

        $this->add_control(
            'content_bg_color_hover',
            [
                'label'     => esc_html__('Background Color', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .site-header-account:hover' => 'background-color: {{VALUE}}',
                ],
            ]
        );

        $this->end_controls_tab();

        $this->end_controls_tabs();

        $this->add_responsive_control(
            'content_padding',
            [
                'label'      => esc_html__('Padding', 'havezic'),
                'type'       => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%', 'em', 'rem', 'vw', 'custom'],
                'selectors'  => [
                    '{{WRAPPER}} .site-header-account' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}}',
                ],
            ]
        );

        $this->add_responsive_control(
            'content_margin',
            [
                'label'      => esc_html__('Margin', 'havezic'),
                'type'       => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%', 'em', 'rem', 'vw', 'custom'],
                'selectors'  => [
                    '{{WRAPPER}} .site-header-account > a > span' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}}',
                ],
            ]
        );

        $this->add_responsive_control(
            'content_border_radius',
            [
                'label'      => esc_html__('Border Radius', 'havezic'),
                'type'       => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%', 'em', 'rem', 'vw', 'custom'],
                'selectors'  => [
                    '{{WRAPPER}} .site-header-account' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}}',
                ],
            ]
        );

        $this->end_controls_section();

    }

    protected function render() {
        $settings = $this->get_settings_for_display();
        $this->add_render_attribute('wrapper', 'class', 'elementor-header-group-wrapper');
        ?>
        <div <?php $this->print_render_attribute_string('wrapper'); ?>>
            <div class="header-group-action">
                <?php
                if ($settings['show_search'] === 'yes') {
                    havezic_header_search_button();
                }
                if (havezic_is_ba_booking_activated()) {
                    $wishlist_active = isset( BABE_Settings::$settings['wishlist_active'] ) ? BABE_Settings::$settings['wishlist_active'] : false;
                    if ($wishlist_active && $settings['show_wishlish'] === 'yes') {
                        $wishlist_page_id = BABE_Settings::$settings['wishlist_page'];
                        $page_link        = site_url();
                        if (-1 != $wishlist_page_id) {
                            $page_link = get_permalink($wishlist_page_id);
                        }
                        echo '<div class="site-header-wishlist"><a href="' . esc_attr($page_link) . '" class="button-wishlist"><i class="havezic-icon-heart"></i></a></div>';
                    }
                }
                if ($settings['show_account'] === 'yes') {

                    $account_link = wp_login_url();

                    if (havezic_is_ba_booking_activated()) {
                        $account_page = intval(BABE_Settings::$settings['my_account_page']);
                        $account_link = get_the_permalink($account_page);
                    }

                    ?>
                    <div class="site-header-account">
                        <?php if (!is_user_logged_in()) { ?>
                            <a class="group-button popup js-btn-register-popup" href="#havezic-login-form"><i class="havezic-icon-user-circle"></i><span class="account-content"><?php echo esc_html__('Login / Register', 'havezic'); ?></span></a>
                        <?php } else {
                            $user = wp_get_current_user();
                            ?>
                            <a class="group-button login" href="<?php echo esc_url($account_link); ?>"><i class="havezic-icon-user-circle"></i><span class="account-content"><?php echo esc_html($user->display_name); ?></span></a>
                            <div class="account-dropdown"></div>
                            <?php
                        } ?>
                    </div>
                    <?php
                }
                ?>
            </div>
        </div>
        <?php
    }
}

$widgets_manager->register(new Havezic_Elementor_Header_Group());