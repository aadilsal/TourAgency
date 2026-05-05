<?php
if (!defined('ABSPATH')) {
    exit;
}
if (!class_exists('Havezic_Customize')) {

    class Havezic_Customize {


        public function __construct() {
            add_action('customize_register', array($this, 'customize_register'));
        }

        /**
         * @param $wp_customize WP_Customize_Manager
         */
        public function customize_register($wp_customize) {

            /**
             * Theme options.
             */

            $this->init_havezic_blog($wp_customize);
            $this->init_havezic_social($wp_customize);

            do_action('havezic_customize_register', $wp_customize);
        }


        /**
         * @param $wp_customize WP_Customize_Manager
         *
         * @return void
         */
        public function init_havezic_blog($wp_customize) {

            $wp_customize->add_section('havezic_blog_archive', array(
                'title' => esc_html__('Blog', 'havezic'),
            ));

            // =========================================
            // Select Style
            // =========================================

            $wp_customize->add_setting('havezic_options_blog_style', array(
                'type'              => 'option',
                'default'           => 'standard',
                'sanitize_callback' => 'sanitize_text_field',
            ));

            $wp_customize->add_control('havezic_options_blog_style', array(
                'section' => 'havezic_blog_archive',
                'label'   => esc_html__('Blog style', 'havezic'),
                'type'    => 'select',
                'choices' => array(
                    'standard' => esc_html__('Blog Standard', 'havezic'),
                    //====start_premium
                    'style-1'  => esc_html__('Blog Grid', 'havezic'),
                    'list'  => esc_html__('Blog List', 'havezic'),
                    //====end_premium
                ),
            ));

            $wp_customize->add_setting('havezic_options_blog_columns', array(
                'type'              => 'option',
                'default'           => 1,
                'sanitize_callback' => 'sanitize_text_field',
            ));

            $wp_customize->add_control('havezic_options_blog_columns', array(
                'section' => 'havezic_blog_archive',
                'label'   => esc_html__('Colunms', 'havezic'),
                'type'    => 'select',
                'choices' => array(
                    1 => esc_html__('1', 'havezic'),
                    2 => esc_html__('2', 'havezic'),
                    3 => esc_html__('3', 'havezic'),
                    4 => esc_html__('4', 'havezic'),
                ),
            ));

            $wp_customize->add_setting('havezic_options_blog_archive_sidebar', array(
                'type'              => 'option',
                'default'           => 'right',
                'sanitize_callback' => 'sanitize_text_field',
            ));

            $wp_customize->add_control('havezic_options_blog_archive_sidebar', array(
                'section' => 'havezic_blog_archive',
                'label'   => esc_html__('Sidebar Position', 'havezic'),
                'type'    => 'select',
                'choices' => array(
                    'left'  => esc_html__('Left', 'havezic'),
                    'right' => esc_html__('Right', 'havezic'),
                ),
            ));
        }

        /**
         * @param $wp_customize WP_Customize_Manager
         *
         * @return void
         */
        public function init_havezic_social($wp_customize) {

            $wp_customize->add_section('havezic_social', array(
                'title' => esc_html__('Socials', 'havezic'),
            ));
            $wp_customize->add_setting('havezic_options_social_share', array(
                'type'              => 'option',
                'capability'        => 'edit_theme_options',
                'sanitize_callback' => 'sanitize_text_field',
            ));

            $wp_customize->add_control('havezic_options_social_share', array(
                'type'    => 'checkbox',
                'section' => 'havezic_social',
                'label'   => esc_html__('Show Social Share', 'havezic'),
            ));
            $wp_customize->add_setting('havezic_options_social_share_facebook', array(
                'type'              => 'option',
                'capability'        => 'edit_theme_options',
                'sanitize_callback' => 'sanitize_text_field',
            ));

            $wp_customize->add_control('havezic_options_social_share_facebook', array(
                'type'    => 'checkbox',
                'section' => 'havezic_social',
                'label'   => esc_html__('Share on Facebook', 'havezic'),
            ));
            $wp_customize->add_setting('havezic_options_social_share_twitter', array(
                'type'              => 'option',
                'capability'        => 'edit_theme_options',
                'sanitize_callback' => 'sanitize_text_field',
            ));

            $wp_customize->add_control('havezic_options_social_share_twitter', array(
                'type'    => 'checkbox',
                'section' => 'havezic_social',
                'label'   => esc_html__('Share on Twitter', 'havezic'),
            ));
            $wp_customize->add_setting('havezic_options_social_share_linkedin', array(
                'type'              => 'option',
                'capability'        => 'edit_theme_options',
                'sanitize_callback' => 'sanitize_text_field',
            ));

            $wp_customize->add_control('havezic_options_social_share_linkedin', array(
                'type'    => 'checkbox',
                'section' => 'havezic_social',
                'label'   => esc_html__('Share on Linkedin', 'havezic'),
            ));
            $wp_customize->add_setting('havezic_options_social_share_google-plus', array(
                'type'              => 'option',
                'capability'        => 'edit_theme_options',
                'sanitize_callback' => 'sanitize_text_field',
            ));

            $wp_customize->add_control('havezic_options_social_share_google-plus', array(
                'type'    => 'checkbox',
                'section' => 'havezic_social',
                'label'   => esc_html__('Share on Google+', 'havezic'),
            ));

            $wp_customize->add_setting('havezic_options_social_share_pinterest', array(
                'type'              => 'option',
                'capability'        => 'edit_theme_options',
                'sanitize_callback' => 'sanitize_text_field',
            ));

            $wp_customize->add_control('havezic_options_social_share_pinterest', array(
                'type'    => 'checkbox',
                'section' => 'havezic_social',
                'label'   => esc_html__('Share on Pinterest', 'havezic'),
            ));
            $wp_customize->add_setting('havezic_options_social_share_email', array(
                'type'              => 'option',
                'capability'        => 'edit_theme_options',
                'sanitize_callback' => 'sanitize_text_field',
            ));

            $wp_customize->add_control('havezic_options_social_share_email', array(
                'type'    => 'checkbox',
                'section' => 'havezic_social',
                'label'   => esc_html__('Share on Email', 'havezic'),
            ));
        }
    }
}
return new Havezic_Customize();
