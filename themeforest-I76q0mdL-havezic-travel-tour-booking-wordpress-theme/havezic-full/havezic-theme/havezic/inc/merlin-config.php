<?php

class Havezic_Merlin_Config {

    private $wizard;

    public function __construct() {
        add_action('after_setup_theme', array($this, 'init'));
        add_action('merlin_import_files', [$this, 'setup_ba_tour'], 1);
        add_filter('merlin_import_files', [$this, 'import_files']);
        add_action('merlin_after_all_import', [$this, 'after_import_setup'], 10, 1);
        add_filter('merlin_generate_child_functions_php', [$this, 'render_child_functions_php']);
        add_action('admin_post_custom_setup_data', [$this, 'custom_setup_data']);
        add_action('import_start', function () {
            add_filter('wxr_importer.pre_process.post_meta', [$this, 'fiximport_elementor'], 10, 1);
        });

        add_action('import_end', function () {
            update_option('elementor_experiment-container', 'active');
            update_option('elementor_experiment-container_grid', 'active');
            update_option('elementor_experiment-nested-elements', 'active');
        });
    }

    public function fiximport_elementor($post_meta) {
        if ('_elementor_data' === $post_meta['key']) {
            $post_meta['value'] = wp_slash($post_meta['value']);
        }

        return $post_meta;
    }

    public function import_files(){
            return array(
            array(
                'import_file_name'           => 'home 1',
                'home'                       => 'home-1',
                'local_import_file'          => get_theme_file_path('/dummy-data/content.xml'),
                'homepage'                   => get_theme_file_path('/dummy-data/homepage/home-1.xml'),
                'local_import_widget_file'   => get_theme_file_path('/dummy-data/widgets.json'),
                
                'import_preview_image_url'   => get_theme_file_uri('/assets/images/oneclick/home_1.jpg'),
                'preview_url'                => 'https://demo2.wpopal.com/havezic/home-1',
                'themeoptions'               => '{}',
            ),

            array(
                'import_file_name'           => 'home 2',
                'home'                       => 'home-2',
                'local_import_file'          => get_theme_file_path('/dummy-data/content.xml'),
                'homepage'                   => get_theme_file_path('/dummy-data/homepage/home-2.xml'),
                'local_import_widget_file'   => get_theme_file_path('/dummy-data/widgets.json'),
                
                'import_preview_image_url'   => get_theme_file_uri('/assets/images/oneclick/home_2.jpg'),
                'preview_url'                => 'https://demo2.wpopal.com/havezic/home-2',
                'themeoptions'               => '{}',
            ),

            array(
                'import_file_name'           => 'home 3',
                'home'                       => 'home-3',
                'local_import_file'          => get_theme_file_path('/dummy-data/content.xml'),
                'homepage'                   => get_theme_file_path('/dummy-data/homepage/home-3.xml'),
                'local_import_widget_file'   => get_theme_file_path('/dummy-data/widgets.json'),
                'import_rev_slider_file_url' => 'http://source.wpopal.com/havezic/dummy_data/revsliders/home-3/slider-1.zip',
                'import_more_revslider_file_url' => [],
                'import_preview_image_url'   => get_theme_file_uri('/assets/images/oneclick/home_3.jpg'),
                'preview_url'                => 'https://demo2.wpopal.com/havezic/home-3',
                'themeoptions'               => '{}',
            ),

            array(
                'import_file_name'           => 'home 4',
                'home'                       => 'home-4',
                'local_import_file'          => get_theme_file_path('/dummy-data/content.xml'),
                'homepage'                   => get_theme_file_path('/dummy-data/homepage/home-4.xml'),
                'local_import_widget_file'   => get_theme_file_path('/dummy-data/widgets.json'),
                
                'import_preview_image_url'   => get_theme_file_uri('/assets/images/oneclick/home_4.jpg'),
                'preview_url'                => 'https://demo2.wpopal.com/havezic/home-4',
                'themeoptions'               => '{}',
            ),

            array(
                'import_file_name'           => 'home 5',
                'home'                       => 'home-5',
                'local_import_file'          => get_theme_file_path('/dummy-data/content.xml'),
                'homepage'                   => get_theme_file_path('/dummy-data/homepage/home-5.xml'),
                'local_import_widget_file'   => get_theme_file_path('/dummy-data/widgets.json'),
                'import_rev_slider_file_url' => 'http://source.wpopal.com/havezic/dummy_data/revsliders/home-5/slider-2.zip',
                'import_more_revslider_file_url' => [],
                'import_preview_image_url'   => get_theme_file_uri('/assets/images/oneclick/home_5.jpg'),
                'preview_url'                => 'https://demo2.wpopal.com/havezic/home-5',
                'themeoptions'               => '{}',
            ),
            );           
        }

    public function after_import_setup($selected_import) {
        $selected_import = ($this->import_files())[$selected_import];
        $check_oneclick  = get_option('havezic_check_oneclick', []);

        $this->set_demo_menus();

        if (!isset($check_oneclick[$selected_import['home']])) {
            $this->wizard->importer->import(get_parent_theme_file_path('dummy-data/homepage/' . $selected_import['home'] . '.xml'));
            $check_oneclick[$selected_import['home']] = true;
        }

        // setup Home page
        $home = get_page_by_path($selected_import['home']);
        if ($home) {
            update_option('show_on_front', 'page');
            update_option('page_on_front', $home->ID);
        }

        // Setup Options
        $options = $this->get_all_options();

        // Elementor
        if (!isset($check_oneclick['elementor-options'])) {
            $active_kit_id = Elementor\Plugin::$instance->kits_manager->get_active_id();
            update_post_meta($active_kit_id, '_elementor_page_settings', $options['elementor']);
            $check_oneclick['elementor-options'] = true;
        }

        // Options
        $theme_options = $options['options'];
        foreach ($theme_options as $key => $option) {
            update_option($key, $option);
        }

        //Mailchimp
        if (!isset($check_oneclick['mailchip'])) {
            $mailchimp = $this->get_mailchimp_id();
            if ($mailchimp) {
                update_option('mc4wp_default_form_id', $mailchimp);
            }
            $check_oneclick['mailchip'] = true;
        }

        // Header Footer Builder
//        $this->reset_header_footer();
        $this->set_hf($selected_import['home']);

        if (!isset($check_oneclick['logo'])) {
            set_theme_mod('custom_logo', $this->get_attachment('_logo'));
            $check_oneclick['logo'] = true;
        }

        if (!isset($check_oneclick['menu-item'])) {
            $this->update_nav_menu_item();
            $check_oneclick['menu-item'] = true;
        }

        if (!isset($check_oneclick['booking']) && havezic_is_ba_booking_activated()) {
            $this->update_booking_tour();
            $ba_settings = wp_parse_args($options['babe'], get_option('babe_settings', []));
            update_option('babe_settings_en', $ba_settings);
            $this->update_location_data();
            $check_oneclick['booking'] = true;
        }

        update_option('havezic_check_oneclick', $check_oneclick);

        if (havezic_is_elementor_activated()) {
            $this->update_url_elementor();
            \Elementor\Plugin::$instance->files_manager->clear_cache();
        }

        \Elementor\Plugin::instance()->files_manager->clear_cache();
    }


    public function setup_ba_tour() {
        $check_oneclick = get_option('havezic_check_oneclick', []);
        if (havezic_is_ba_booking_activated() && !isset($check_oneclick['before_setup_ba'])) {

            BABE_Install::setup_ages();
            BABE_Install::setup_tax_features();
            BABE_Install::setup_posts_places();
            BABE_Install::setup_posts_services();
            BABE_Install::setup_posts_faq();
            BABE_Install::setup_rules();
            BABE_Install::setup_categories();

            $check_oneclick['before_setup_ba'] = true;

        }
        update_option('havezic_check_oneclick', $check_oneclick);
    }

    public function update_booking_tour() {
        $params = array(
            'posts_per_page' => -1,
            'post_type'      => BABE_Post_types::$booking_obj_post_type,
        );
        $query  = new WP_Query($params);
        if ($query->have_posts()) {
            while ($query->have_posts()):
                $query->the_post();
                $this->add_start_date(get_the_ID());
                $this->add_end_date(get_the_ID());
                $this->add_rate_tour(get_the_ID());
            endwhile;
        }
    }

    public function update_location_data() {

        $location_taxonomy = BABE_Post_types::$attr_tax_pref . 'locations';
        $taxonomies = get_terms(array(
            'taxonomy'   => $location_taxonomy,
            'hide_empty' => false

        ));
        $data_map       = '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d16257401.824679641!2d-84.98811232472602!3d5.842622373749859!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e15a43aae1594a3%3A0x9a0d9a04eff2a340!2sColombia!5e0!3m2!1svi!2s!4v1721459471756!5m2!1svi!2s" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>';
        $data_gallery   = array(
            '2764'=>wp_get_attachment_url(2764),
            '2765'=>wp_get_attachment_url(2765),
            '2766'=>wp_get_attachment_url(2766),
            '2767'=>wp_get_attachment_url(2767),
        );


        if (!is_wp_error($taxonomies)) {
            foreach ($taxonomies as $taxonomy) {
                update_term_meta($taxonomy->term_id, 'havezic_description_info', 'Mi bibendum neque egestas congue. Arcu risus quis varius quam quisque id diam vel. Nunc sed blandit libero volutpat sed cras ornare arcu dui. Nunc consequat interdum varius sit amet mattis vulputate. Lobortis mattis aliquam faucibus purus in massa tempor.');
                update_term_meta($taxonomy->term_id, 'havezic_map_iframe', $data_map);
                update_term_meta($taxonomy->term_id, 'havezic_tax_gallery_image', $data_gallery);
            }
        }
    }

    public function add_rate_tour($post_id) {

        $category_slug = 'tour';

        $price_arr = array(0 => rand(100, 200));
        $rules     = BABE_Booking_Rules::get_rule_by_cat_slug($category_slug);
        if ($rules && isset($rules['ages'])) {
            $ages = BABE_Post_types::get_ages_arr();
            $i    = 1;
            foreach ($ages as $age_arr) {
                $price_arr[$age_arr['age_id']] = $i <= 2 ? floatval($price_arr[0] - $i * 10) : floatval(0);
                $i++;
            }

            unset($price_arr[0]);

        }

        $days_arr      = BABE_Calendar_functions::get_week_days_arr();
        $rate_days_arr = array();
        foreach ($days_arr as $day_num => $day_title) {
            $rate_days_arr[$day_num] = $day_num;
        }

        //// create and save rates
        $rate_arr = array(
            'post_id'             => $post_id,
            'cat_slug'            => $category_slug,
            'apply_days'          => $rate_days_arr,
            'start_days'          => $rate_days_arr,
            '_price_general'      => $price_arr,
            '_price_from'         => '',
            '_prices_conditional' => array(),
            '_rate_min_booking'   => '',
            '_rate_max_booking'   => '',
            '_rate_title'         => esc_html__('Default Price', 'havezic'),
            '_rate_date_from'     => '',
            '_rate_date_to'       => '',
        );

        BABE_Prices::save_rate($rate_arr);

        BABE_CMB2_admin::update_booking_obj_post($post_id, [], (object)array());
    }

    private function add_start_date($post_id) {
        $date_from_obj = new DateTime('-3 days');
        update_post_meta($post_id, 'start_date', BABE_Calendar_functions::date_from_sql($date_from_obj->format('Y-m-d')));
    }

    private function add_end_date($post_id) {
        $date_to_obj = new DateTime('+1 year');
        update_post_meta($post_id, 'end_date', BABE_Calendar_functions::date_from_sql($date_to_obj->format('Y-m-d')));
    }

    private function update_nav_menu_item() {
        $params = array(
            'posts_per_page' => -1,
            'post_type'      => [
                'nav_menu_item',
            ],
        );
        $query  = new WP_Query($params);
        while ($query->have_posts()): $query->the_post();
            wp_update_post(array(
                // Update the `nav_menu_item` Post Title
                'ID'         => get_the_ID(),
                'post_title' => get_the_title()
            ));
        endwhile;

    }

    private function get_mailchimp_id() {
        $params = array(
            'post_type'      => 'mc4wp-form',
            'posts_per_page' => 1,
        );
        $post   = get_posts($params);

        return isset($post[0]) ? $post[0]->ID : 0;
    }

    private function get_attachment($key) {
        $params = array(
            'post_type'      => 'attachment',
            'post_status'    => 'inherit',
            'posts_per_page' => 1,
            'meta_key'       => $key,
        );
        $post   = get_posts($params);
        if ($post) {
            return $post[0]->ID;
        }

        return 0;
    }

    public function init() {
        $this->wizard = new Merlin(
            $config = array(
                // Location / directory where Merlin WP is placed in your theme.
                'merlin_url'         => 'merlin',
                // The wp-admin page slug where Merlin WP loads.
                'parent_slug'        => 'themes.php',
                // The wp-admin parent page slug for the admin menu item.
                'capability'         => 'manage_options',
                // The capability required for this menu to be displayed to the user.
                'dev_mode'           => true,
                // Enable development mode for testing.
                'license_step'       => false,
                // EDD license activation step.
                'license_required'   => false,
                // Require the license activation step.
                'license_help_url'   => '',
                'directory'          => '/inc/merlin',
                // URL for the 'license-tooltip'.
                'edd_remote_api_url' => '',
                // EDD_Theme_Updater_Admin remote_api_url.
                'edd_item_name'      => '',
                // EDD_Theme_Updater_Admin item_name.
                'edd_theme_slug'     => '',
                // EDD_Theme_Updater_Admin item_slug.
            ),
            $strings = array(
                'admin-menu'          => esc_html__('Theme Setup', 'havezic'),

                /* translators: 1: Title Tag 2: Theme Name 3: Closing Title Tag */
                'title%s%s%s%s'       => esc_html__('%1$s%2$s Themes &lsaquo; Theme Setup: %3$s%4$s', 'havezic'),
                'return-to-dashboard' => esc_html__('Return to the dashboard', 'havezic'),
                'ignore'              => esc_html__('Disable this wizard', 'havezic'),

                'btn-skip'                 => esc_html__('Skip', 'havezic'),
                'btn-next'                 => esc_html__('Next', 'havezic'),
                'btn-start'                => esc_html__('Start', 'havezic'),
                'btn-no'                   => esc_html__('Cancel', 'havezic'),
                'btn-plugins-install'      => esc_html__('Install', 'havezic'),
                'btn-child-install'        => esc_html__('Install', 'havezic'),
                'btn-content-install'      => esc_html__('Install', 'havezic'),
                'btn-import'               => esc_html__('Import', 'havezic'),
                'btn-license-activate'     => esc_html__('Activate', 'havezic'),
                'btn-license-skip'         => esc_html__('Later', 'havezic'),

                /* translators: Theme Name */
                'license-header%s'         => esc_html__('Activate %s', 'havezic'),
                /* translators: Theme Name */
                'license-header-success%s' => esc_html__('%s is Activated', 'havezic'),
                /* translators: Theme Name */
                'license%s'                => esc_html__('Enter your license key to enable remote updates and theme support.', 'havezic'),
                'license-label'            => esc_html__('License key', 'havezic'),
                'license-success%s'        => esc_html__('The theme is already registered, so you can go to the next step!', 'havezic'),
                'license-json-success%s'   => esc_html__('Your theme is activated! Remote updates and theme support are enabled.', 'havezic'),
                'license-tooltip'          => esc_html__('Need help?', 'havezic'),

                /* translators: Theme Name */
                'welcome-header%s'         => esc_html__('Welcome to %s', 'havezic'),
                'welcome-header-success%s' => esc_html__('Hi. Welcome back', 'havezic'),
                'welcome%s'                => esc_html__('This wizard will set up your theme, install plugins, and import content. It is optional & should take only a few minutes.', 'havezic'),
                'welcome-success%s'        => esc_html__('You may have already run this theme setup wizard. If you would like to proceed anyway, click on the "Start" button below.', 'havezic'),

                'child-header'         => esc_html__('Install Child Theme', 'havezic'),
                'child-header-success' => esc_html__('You\'re good to go!', 'havezic'),
                'child'                => esc_html__('Let\'s build & activate a child theme so you may easily make theme changes.', 'havezic'),
                'child-success%s'      => esc_html__('Your child theme has already been installed and is now activated, if it wasn\'t already.', 'havezic'),
                'child-action-link'    => esc_html__('Learn about child themes', 'havezic'),
                'child-json-success%s' => esc_html__('Awesome. Your child theme has already been installed and is now activated.', 'havezic'),
                'child-json-already%s' => esc_html__('Awesome. Your child theme has been created and is now activated.', 'havezic'),

                'plugins-header'         => esc_html__('Install Plugins', 'havezic'),
                'plugins-header-success' => esc_html__('You\'re up to speed!', 'havezic'),
                'plugins'                => esc_html__('Let\'s install some essential WordPress plugins to get your site up to speed.', 'havezic'),
                'plugins-success%s'      => esc_html__('The required WordPress plugins are all installed and up to date. Press "Next" to continue the setup wizard.', 'havezic'),
                'plugins-action-link'    => esc_html__('Advanced', 'havezic'),

                'import-header'      => esc_html__('Import Content', 'havezic'),
                'import'             => esc_html__('Let\'s import content to your website, to help you get familiar with the theme.', 'havezic'),
                'import-action-link' => esc_html__('Advanced', 'havezic'),

                'ready-header'      => esc_html__('All done. Have fun!', 'havezic'),

                /* translators: Theme Author */
                'ready%s'           => esc_html__('Your theme has been all set up. Enjoy your new theme by %s.', 'havezic'),
                'ready-action-link' => esc_html__('Extras', 'havezic'),
                'ready-big-button'  => esc_html__('View your website', 'havezic'),
                'ready-link-1'      => sprintf('<a href="%1$s" target="_blank">%2$s</a>', 'https://wordpress.org/support/', esc_html__('Explore WordPress', 'havezic')),
                'ready-link-2'      => sprintf('<a href="%1$s" target="_blank">%2$s</a>', 'https://themebeans.com/contact/', esc_html__('Get Theme Support', 'havezic')),
                'ready-link-3'      => sprintf('<a href="%1$s">%2$s</a>', admin_url('customize.php'), esc_html__('Start Customizing', 'havezic')),
            )
        );
        if (havezic_is_elementor_activated()) {
            add_action('widgets_init', [$this, 'widgets_init']);
        }
        if (class_exists('Monster_Widget')) {
            add_action('widgets_init', [$this, 'widget_monster']);
        }
    }

    public function widget_monster() {
        unregister_widget('Monster_Widget');
        require_once get_parent_theme_file_path('/inc/merlin/includes/monster-widget.php');
        register_widget('Havezic_Monster_Widget');
    }

    public function widgets_init() {
        require_once get_parent_theme_file_path('/inc/merlin/includes/recent-post.php');
        register_widget('Havezic_WP_Widget_Recent_Posts');
    }

    private function get_all_header_footer() {
        return [
            'home-1' => [
                'header' => [
                    [
                        'slug'                         => 'header-1',
                        'etb_target_include_locations' => ['rule' => ['specifics'], 'specific' => []],
                    ]
                ]
            ],
            'home-2' => [
                'header' => [
                    [
                        'slug'                         => 'header-2',
                        'etb_target_include_locations' => ['rule' => ['specifics'], 'specific' => []],
                    ]
                ],
                'footer' => [
                    [
                        'slug'                         => 'footer-2',
                        'etb_target_include_locations' => ['rule' => ['specifics'], 'specific' => []],
                    ]
                ]
            ],
            'home-3' => [
                'header' => [
                    [
                        'slug'                         => 'header-3',
                        'etb_target_include_locations' => ['rule' => ['specifics'], 'specific' => []],
                    ]
                ],
                'footer' => [
                    [
                        'slug'                         => 'footer-3',
                        'etb_target_include_locations' => ['rule' => ['specifics'], 'specific' => []],
                    ]
                ]
            ],
            'home-4' => [
                'header' => [
                    [
                        'slug'                         => 'header-4',
                        'etb_target_include_locations' => ['rule' => ['specifics'], 'specific' => []],
                    ]
                ],
                'footer' => [
                    [
                        'slug'                         => 'footer-4',
                        'etb_target_include_locations' => ['rule' => ['specifics'], 'specific' => []],
                    ]
                ]
            ],
            'home-5' => [
                'header' => [
                    [
                        'slug'                         => 'header-5',
                        'etb_target_include_locations' => ['rule' => ['specifics'], 'specific' => []],
                    ]
                ],
                'footer' => [
                    [
                        'slug'                         => 'footer-3',
                        'etb_target_include_locations' => ['rule' => ['specifics'], 'specific' => []],
                    ]
                ]
            ],
        ];
    }

    private function reset_header_footer() {
        $footer_args = array(
            'post_type'      => 'etb_library',
            'posts_per_page' => -1,
            'meta_query'     => array(
                array(
                    'key'     => 'etb_template_type',
                    'compare' => 'IN',
                    'value'   => ['type_footer', 'type_header']
                ),
            )
        );
        $footer      = new WP_Query($footer_args);
        while ($footer->have_posts()) : $footer->the_post();
            update_post_meta(get_the_ID(), 'etb_target_include_locations', []);
            update_post_meta(get_the_ID(), 'etb_target_exclude_locations', []);
        endwhile;
        wp_reset_postdata();
    }

    public function set_demo_menus() {
        $main_menu = get_term_by('name', 'Main Menu', 'nav_menu');

        set_theme_mod(
            'nav_menu_locations',
            array(
                'primary'  => $main_menu->term_id,
                'handheld' => $main_menu->term_id,
            )
        );
    }

    private function set_hf($home) {
        $all_hf    = $this->get_all_header_footer();
        $datas     = $all_hf[$home];
        $home_page = get_page_by_path($home);
        foreach ($datas as $item) {
            foreach ($item as $object) {
                $hf = get_page_by_path($object['slug'], OBJECT, 'etb_library');
                if ($hf) {
                    $options             = $object['etb_target_include_locations'];
                    $options['specific'] = ['post-' . $home_page->ID];
                    update_post_meta($hf->ID, 'etb_target_include_locations', $options);
                    if (isset($object['etb_target_exclude_locations'])) {
                        update_post_meta($hf->ID, 'etb_target_exclude_locations', $object['etb_target_exclude_locations']);
                    }
                }
            }
        }
    }

    public function custom_setup_data() {
        if (isset($_POST)) {

            if (isset($_POST['opal-setup-data-booking'])) {
                $options = $this->get_all_options();
                if (havezic_is_ba_booking_activated()) {
                    $this->update_booking_tour();
                    $ba_settings = wp_parse_args($options['babe'], get_option('babe_settings_en', []));
                    update_option('babe_settings_en', $ba_settings);
                    $check_oneclick['booking'] = true;
                }
            }
            wp_redirect(admin_url('options-general.php?page=custom-setup-settings&saved=1'));
            exit;
        }
    }

    public function render_child_functions_php() {
        $output
            = "<?php
/**
 * Theme functions and definitions.
 */
		 ";

        return $output;
    }

    private function update_url_elementor() {
        $from          = 'https://demo2wpopal.b-cdn.net/havezic';
        $to            = site_url();
        $is_valid_urls = (filter_var($from, FILTER_VALIDATE_URL) && filter_var($to, FILTER_VALIDATE_URL));
        if (!$is_valid_urls) {
            return false;
        }

        if ($from === $to) {
            return false;
        }

        global $wpdb;

        // @codingStandardsIgnoreStart cannot use `$wpdb->prepare` because it remove's the backslashes
        $rows_affected = $wpdb->query(
            "UPDATE {$wpdb->postmeta} " .
            "SET `meta_value` = REPLACE(`meta_value`, '" . str_replace('/', '\\\/', $from) . "', '" . str_replace('/', '\\\/', $to) . "') " .
            "WHERE `meta_key` = '_elementor_data' AND `meta_value` LIKE '[%' ;"); // meta_value LIKE '[%' are json formatted
        // @codingStandardsIgnoreEnd

    }

    public function get_all_options(){
        $options = [];
        $options['options']   = json_decode('{"havezic_options_social_share":"1","havezic_options_social_share_facebook":"1","havezic_options_social_share_twitter":"1"}', true);
        $options['elementor']   = json_decode('{"system_colors":[{"_id":"primary","title":"Primary","color":"#FB5B32"},{"_id":"primary_hover","title":"Primary Hover","color":"#E1512D"},{"_id":"secondary","title":"Secondary","color":"#4D40CA"},{"_id":"secondary_hover","title":"Secondary Hover","color":"#4539B5"},{"_id":"text","title":"Text","color":"#6E6E6E"},{"_id":"text_light","title":"Text light","color":"#999999"},{"_id":"accent","title":"Accent","color":"#000000"},{"_id":"border","title":"Border","color":"#DEE0EA"},{"_id":"background","title":"Background","color":"#FFFFFF"},{"_id":"background_light","title":"Background Light","color":"#F6F6F6"}],"custom_colors":[],"system_typography":[{"_id":"primary","title":"Primary","typography_typography":"custom"},{"_id":"secondary","title":"Secondary","typography_typography":"custom"},{"_id":"accent","title":"Accent","typography_typography":"custom"},{"_id":"text","title":"Text","typography_typography":"custom"},{"_id":"heading_title","title":"Heading Title","typography_typography":"custom","typography_font_family":"Inter","typography_font_weight":"600","typography_letter_spacing":{"unit":"px","size":0,"sizes":[]},"typography_font_size":{"unit":"px","size":36,"sizes":[]},"typography_line_height":{"unit":"em","size":1.167,"sizes":[]},"typography_font_size_mobile":{"unit":"px","size":34,"sizes":[]},"typography_line_height_mobile":{"unit":"px","size":36,"sizes":[]}}],"custom_typography":[{"_id":"219ccbe","title":"Sub Title","typography_typography":"custom","typography_font_size":{"unit":"px","size":32,"sizes":[]},"typography_font_weight":"700","typography_text_transform":"uppercase","typography_line_height":{"unit":"em","size":1.2,"sizes":[]},"typography_letter_spacing":{"unit":"px","size":2,"sizes":[]},"typography_font_family":"Amatic SC","typography_font_size_mobile":{"unit":"px","size":28,"sizes":[]}}],"default_generic_fonts":"Sans-serif","site_name":"Havezic","site_description":"Travel &amp; Tour Booking WordPress Theme","page_title_selector":"h1.entry-title","activeItemIndex":1,"active_breakpoints":["viewport_mobile","viewport_mobile_extra","viewport_tablet","viewport_tablet_extra","viewport_laptop"],"viewport_md":768,"viewport_lg":1025,"container_width":{"unit":"px","size":1290,"sizes":[]},"space_between_widgets":{"column":"0","row":"0","isLinked":true,"unit":"px","size":0,"sizes":[]},"typography_enable_styleguide_preview":"yes","colors_enable_styleguide_preview":"yes","site_logo":{"url":"https://demo2wpopal.b-cdn.net/havezic/wp-content/uploads/2024/07/logo.svg","id":359,"size":"","alt":"","source":"library"}}', true);
        $options['babe']   = json_decode('{"date_format":"d/m/Y","attr_tax_prefix":"ba_","booking_obj_post_slug":"tour","zero_price_display_value":"0","booking_obj_post_name":"Tour booking","booking_obj_post_name_general":"Tour booking","booking_obj_menu_name":"Tour","mpoints_active":0,"content_in_tabs":0,"reviews_in_tabs":0,"reviews_comment_template":"","view_only_uploaded_images":0,"results_per_page":10,"posts_per_taxonomy_page":12,"max_guests_select":10,"av_calendar_max_months":12,"results_without_av_check":0,"results_without_av_cal":0,"booking_obj_gutenberg":0,"my_account_disable":0,"results_view":"grid","google_api":"","google_map_start_lat":"-33.8688","google_map_start_lng":"151.2195","google_map_zoom":13,"google_map_active":0,"google_map_marker":1,"currency":"USD","currency_place":"left","price_thousand_separator":"","price_decimal_separator":".","price_decimals":2,"price_from_label":"From %s","checkout_add_billing_address":0,"disable_guest_bookings":0,"order_availability_confirm":"auto","order_payment_processing_waiting":30,"unitegallery_remove":0,"av_calendar_remove":0,"av_calendar_remove_hover_prices":0,"google_map_remove":0,"services_to_booking_form":1,"prefill_date_in_booking_form":0,"message_av_confirmation":"Your order is waiting for the availability confirmation, you will be notified by email when its ready. Thank you!","message_not_available":"Sorry, but your selected items are not available for selected dates/times. Please, search another dates/times or items and create new order.","message_payment_deferred":"Your order is completed and received, and a confirmation email was sent to you. You will pay the full amount later. Thank you!","message_payment_expected":"Your order is confirmed, but not completed. To complete your order, please, click the link below to make a payment.","message_payment_processing":"Your order has been confirmed and your payment is being processed. Thank you!","message_payment_received":"Your order is completed, your payment has been received, and a confirmation email was sent to you. Thank you!","message_draft":"Your booking has not been paid or confirmed. Follow the link to complete your booking.","shop_email":"","email_new_customer_created_subject":"Your account details","email_new_customer_created_title":"Your account details","email_new_customer_created_message":"Hello, %s\r\n\r\nThank you for booking with us! You could use this login/password to manage your bookings:","email_password_reseted_subject":"Your password has been reset","email_password_reseted_title":"Your password has been reset.","email_password_reseted_message":"Hello, %s\r\n\r\nYour password has been reset. You could use this new password to manage your account:","email_logo":"","email_header_image":"","email_footer_message":"","email_footer_credit":"","email_color_font":"#000000","email_color_background":"#EAECED","email_color_title":"#ff4800","email_color_link":"#039be5","email_color_button":"#ff4800","email_color_button_yes":"#9acd32","email_color_button_no":"#F64020","payment_methods":["cash"],"use_extended_wp_import":"1","email_admin_new_order_subject":"New order #%s","email_admin_new_order_title":"New order","email_admin_new_order_message":"You have new order. Please, find details below.","email_admin_order_updated_subject":"Order #%s updated","email_admin_order_updated_title":"Order updated","email_admin_order_updated_message":"Order updated. Please, find details below.","email_admin_new_order_av_confirm_subject":"Availability request","email_admin_new_order_av_confirm_title":"New Order is waiting for confirmation","email_admin_new_order_av_confirm_message":"Please, confirm or reject this Order.","email_new_order_av_confirm_subject":"Your order #%s","email_new_order_av_confirm_title":"New Order created","email_new_order_av_confirm_message":"Hello, %s\r\n\r\nThank you for booking! Your Order is waiting for availability confirmation. We will send you a confirmation letter as soon as possible.","email_new_order_subject":"Your order #%s","email_new_order_title":"Your order has been received","email_new_order_message":"Hello, %1$s\r\n\r\nThank you for booking! Your order has been received.","email_order_updated_subject":"Your order #%s is updated","email_order_updated_title":"Your order has been updated","email_order_updated_message":"Hello, %1$s\r\n\r\nYour order has been updated. Please, find details below.","email_new_order_to_pay_subject":"Your order is waiting for payment","email_new_order_to_pay_title":"Your order is waiting for payment","email_new_order_to_pay_message":"Hello, %1$s\r\n\r\nYour order is confirmed, but not completed. To complete your order, click the link below to make a payment. Amount to pay is %2$s.","email_order_rejected_subject":"Selected items are not available","email_order_rejected_title":"Selected items are not available","email_order_rejected_message":"Hello, %s\r\n\r\nSorry, but your selected items are not available for selected dates/times. You could search another dates/times or items and create new Order.","email_admin_order_canceled_subject":"Order # %1$s was canceled","email_admin_order_canceled_title":"Order has been canceled","email_admin_order_canceled_message":"The order has been canceled:","email_order_canceled_subject":"Your order was canceled","email_order_canceled_title":"Your order has been canceled","email_order_canceled_message":"Hello, %1$s\r\n\r\nYour order has been canceled:","coupons_active":0,"coupons_expire_days":0,"archive_page_customs":"870","activity_slug":"","locations_slug":"","duration_slug":"","features_slug":"","languages_slug":"","criteria_arr":["location","amenities","services","price","rooms"],"wishlist_active":"1","wishlist_page":"1323","wishlist_icon":"havezic-icon-heart","wishlist_added":"Tour Added!"}', true);
        return $options;
    } // end get_all_options
}

return new Havezic_Merlin_Config();
