<?php
/**
 * Entry point for the plugin. Checks if Elementor is installed and activated and loads it's own files and actions.
 *
 * @package  header-footer-elementor
 */

use Theme_Builder\Lib\ETB_Target_Rules_Fields;

defined('ABSPATH') or exit;

/**
 * Theme_Builder_Admin setup
 *
 * @since 1.0
 */
class Theme_Builder_Admin {

    /**
     * Instance of Theme_Builder_Admin
     *
     * @var Theme_Builder_Admin
     */
    private static $_instance          = null;
    private static $_etb_template_type = null;
    const CPT      = 'etb_library';
    const TAB_BASE = "edit.php?post_type=" . self::CPT;

    /**
     * Instance of Theme_Builder_Admin
     *
     * @return Theme_Builder_Admin Instance of Theme_Builder_Admin
     */
    public static function instance() {
        if (!isset(self::$_instance)) {
            self::$_instance = new self();
        }

        return self::$_instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        add_action('init', [$this, 'header_footer_posttype']);
        if (is_admin() && current_user_can('manage_options')) {
            add_action('admin_menu', [$this, 'register_admin_menu'], 50);
        }
        add_filter('query_vars', [$this, 'add_query_vars_filter']);
        self::__get_template_type();
        add_filter('views_edit-' . self::CPT, [$this, 'admin_print_tabs']);
        add_action('pre_get_posts', [$this, 'add_role_filter_to_posts_query']);
        add_action('add_meta_boxes', [$this, 'etb_register_metabox']);
        add_action('save_post', [$this, 'etb_save_meta']);
        add_action('admin_notices', [$this, 'location_notice']);
        add_action('template_redirect', [$this, 'block_template_frontend']);
        add_filter('single_template', [$this, 'load_canvas_template']);

        add_filter('manage_' . self::CPT . '_posts_columns', [$this, 'set_shortcode_columns']);
        add_action('manage_' . self::CPT . '_posts_custom_column', [$this, 'render_shortcode_column'], 10, 2);

        if (defined('ELEMENTOR_PRO_VERSION') && ELEMENTOR_PRO_VERSION > 2.8) {
            add_action('elementor/editor/footer', [$this, 'register_etb_epro_script'], 99);
        }

        if (is_admin()) {
            add_action('manage_' . self::CPT . '_posts_custom_column', [$this, 'column_content'], 10, 2);
            add_filter('manage_' . self::CPT . '_posts_columns', [$this, 'column_headings']);
        }
    }

    private function __get_template_type() {
        self::$_etb_template_type = [
            'type_header'        => __('Header', 'havezic'),
            'type_footer'        => __('Footer', 'havezic'),
            'type_after_header'  => __('After Header(Breadcrumb ...)', 'havezic'),
            'type_before_footer' => __('Before Footer', 'havezic'),
            'type_archive'       => __('Archive', 'havezic'),
            'type_single'        => __('Single', 'havezic'),
            'custom'             => __('Custom Block', 'havezic')
        ];
    }

    /**
     * Register the admin menu for Elementor Header & Footer Builder.
     *
     * @since  1.0.0
     * @since  1.0.1
     *         Moved the menu under Appearance -> Elementor Header & Footer Builder
     */
    public function register_admin_menu() {
        add_menu_page(
            __('Theme Builder', 'havezic'),
            __('Theme Builder', 'havezic'),
            'manage_options',
            self::TAB_BASE,
            '',
            '',
            59
        );
    }

    public function add_query_vars_filter($vars) {
        $vars[] = "etb_template_type";
        return $vars;
    }


    public function admin_print_tabs($views) {
        $getActive = get_query_var('etb_template_type');
        ?>
        <div id="happyaddon-template-library-tabs-wrapper" class="nav-tab-wrapper">
            <a class="nav-tab <?= !($getActive) ? 'nav-tab-active' : ''; ?>" href="<?= admin_url(self::TAB_BASE) ?>">All</a>
            <?php
            foreach (self::$_etb_template_type as $key => $value) {
                $active           = ($getActive == $key) ? 'nav-tab-active' : '';
                $admin_filter_url = admin_url(self::TAB_BASE . '&etb_template_type=' . $key);
                echo '<a class="nav-tab ' . $active . '" href="' . $admin_filter_url . '">' . $value . '</a>';
            }
            ?>
        </div>
        <br>
        <?php
        return $views;
    }

    public function add_role_filter_to_posts_query($query) {
        /**
         * No use on front
         * pre get posts runs everywhere
         * even if you test $pagenow after, bail as soon as possible
         */
        if (!is_admin()) {
            return;
        }

        global $pagenow;

        /**
         * use $query parameter instead of global $post_type
         */
        if ('edit.php' === $pagenow && self::CPT === $query->query['post_type']) {

            if (isset($_GET['etb_template_type'])) {
                $meta_query = array(
                    array(
                        'key'     => 'etb_template_type',
                        'value'   => sanitize_text_field($_GET['etb_template_type']),
                        'compare' => '=='
                    )
                );
                $query->set('meta_query', $meta_query);
                $query->set('meta_key', 'etb_template_type');
            }
        }
    }


    /**
     * Script for Elementor Pro full site editing support.
     *
     * @return void
     * @since 1.4.0
     *
     */
    public function register_etb_epro_script() {
        $ids_array = [
            [
                'id'    => get_etb_header_id(),
                'value' => 'Header',
            ],
            [
                'id'    => get_etb_footer_id(),
                'value' => 'Footer',
            ],
            [
                'id'    => get_etb_after_header_id(),
                'value' => 'After Header',
            ],
            [
                'id'    => etb_get_before_footer_id(),
                'value' => 'Before Footer',
            ],
            [
                'id'    => etb_get_single_id(),
                'value' => 'Single Post',
            ],
        ];

        wp_enqueue_script('theme-builder-elementor-pro-compatibility', OPAL_BUILDER_URL . 'inc/js/theme-builder-elementor-pro-compatibility.js', ['jquery'], HAVEZIC_VERSION, true);

        wp_localize_script(
            'theme-builder-elementor-pro-compatibility',
            'etb_admin',
            [
                'ids_array' => wp_json_encode($ids_array),
            ]
        );
    }

    /**
     * Adds or removes list table column headings.
     *
     * @param array $columns Array of columns.
     * @return array
     */
    public function column_headings($columns) {
        unset($columns['date']);

        $columns['elementor_hf_type']          = __('Type', 'havezic');
        $columns['elementor_hf_display_rules'] = __('Display Rules', 'havezic');
        $columns['date']                       = __('Date', 'havezic');

        return $columns;
    }

    /**
     * Adds the custom list table column content.
     *
     * @param array $column Name of column.
     * @param int $post_id Post id.
     * @return void
     * @since 1.2.0
     */
    public function column_content($column, $post_id) {

        if ('elementor_hf_display_rules' == $column) {

            $locations = get_post_meta($post_id, 'etb_target_include_locations', true);
            if (!empty($locations)) {
                echo '<div class="etb-advanced-headers-location-wrap" style="margin-bottom: 5px;">';
                echo '<strong>Display: </strong>';
                $this->column_display_location_rules($locations);
                echo '</div>';
            }

            $locations = get_post_meta($post_id, 'etb_target_exclude_locations', true);
            if (!empty($locations)) {
                echo '<div class="etb-advanced-headers-exclusion-wrap" style="margin-bottom: 5px;">';
                echo '<strong>Exclusion: </strong>';
                $this->column_display_location_rules($locations);
                echo '</div>';
            }

            $users = get_post_meta($post_id, 'etb_target_user_roles', true);
            if (isset($users) && is_array($users)) {
                if (isset($users[0]) && !empty($users[0])) {
                    $user_label = [];
                    foreach ($users as $user) {
                        $user_label[] = ETB_Target_Rules_Fields::get_user_by_key($user);
                    }
                    echo '<div class="etb-advanced-headers-users-wrap">';
                    echo '<strong>Users: </strong>';
                    echo esc_html(join(', ', $user_label));
                    echo '</div>';
                }
            }
        } elseif ('elementor_hf_type' == $column) {

            $template_type = get_post_meta($post_id, 'etb_template_type', true);
            if ($template_type) {
                echo self::$_etb_template_type[$template_type];
            }
        }
    }

    /**
     * Get Markup of Location rules for Display rule column.
     *
     * @param array $locations Array of locations.
     * @return void
     */
    public function column_display_location_rules($locations) {

        $location_label = [];
        if (is_array($locations) && is_array($locations['rule']) && isset($locations['rule'])) {
            $index = array_search('specifics', $locations['rule']);
            if (false !== $index && !empty($index)) {
                unset($locations['rule'][$index]);
            }
        }

        if (isset($locations['rule']) && is_array($locations['rule'])) {
            foreach ($locations['rule'] as $location) {
                $location_label[] = ETB_Target_Rules_Fields::get_location_by_key($location);
            }
        }
        if (isset($locations['specific']) && is_array($locations['specific'])) {
            foreach ($locations['specific'] as $location) {
                $location_label[] = ETB_Target_Rules_Fields::get_location_by_key($location);
            }
        }

        echo esc_html(join(', ', $location_label));
    }


    /**
     * Register Post type for Theme Builder templates
     */
    public function header_footer_posttype() {
        $labels = [
            'name'               => esc_html__('Theme Builder', 'havezic'),
            'singular_name'      => esc_html__('Theme Builder', 'havezic'),
            'menu_name'          => esc_html__('Theme Builder', 'havezic'),
            'name_admin_bar'     => esc_html__('Theme Builder', 'havezic'),
            'add_new'            => esc_html__('Add New', 'havezic'),
            'add_new_item'       => esc_html__('Add New Teamplate', 'havezic'),
            'new_item'           => esc_html__('New Template', 'havezic'),
            'edit_item'          => esc_html__('Edit Template', 'havezic'),
            'view_item'          => esc_html__('View Template', 'havezic'),
            'all_items'          => esc_html__('All Templates', 'havezic'),
            'search_items'       => esc_html__('Search Templates', 'havezic'),
            'parent_item_colon'  => esc_html__('Parent Templates:', 'havezic'),
            'not_found'          => esc_html__('No Templates found.', 'havezic'),
            'not_found_in_trash' => esc_html__('No Templates found in Trash.', 'havezic'),
        ];

        $args = [
            'labels'              => $labels,
            'public'              => true,
            'show_ui'             => true,
            'show_in_menu'        => false,
            'show_in_nav_menus'   => false,
            'exclude_from_search' => true,
            'capability_type'     => 'post',
            'hierarchical'        => false,
            'menu_icon'           => 'dashicons-editor-kitchensink',
            'supports'            => ['title', 'thumbnail', 'elementor'],
        ];

        register_post_type(self::CPT, $args);
    }

    /**
     * Register meta box(es).
     */
    function etb_register_metabox() {
        add_meta_box(
            'etb-meta-box',
            __('Theme Builder Options', 'havezic'),
            [
                $this,
                'efh_metabox_render',
            ],
            self::CPT,
            'normal',
            'high'
        );
    }

    /**
     * Render Meta field.
     *
     * @param POST $post Currennt post object which is being displayed.
     */
    function efh_metabox_render($post) {
        $values            = get_post_custom($post->ID);
        $template_type     = isset($values['etb_template_type']) ? esc_attr(sanitize_text_field($values['etb_template_type'][0])) : '';
        $display_on_canvas = isset($values['display-on-canvas-template']) ? true : false;

        // We'll use this nonce field later on when saving.
        wp_nonce_field('etb_meta_nounce', 'etb_meta_nounce');
        ?>
        <table class="theme-builder-options-table widefat">
            <tbody>
            <tr class="theme-builder-options-row type-of-template">
                <td class="theme-builder-options-row-heading">
                    <label for="etb_template_type"><?php esc_html_e('Type of Template', 'havezic'); ?></label>
                </td>
                <td class="theme-builder-options-row-content">
                    <select name="etb_template_type" id="etb_template_type">
                        <option value="" <?php selected($template_type, ''); ?>><?php esc_html_e('Select Option', 'havezic'); ?></option>
                        <?php
                        foreach (self::$_etb_template_type as $key => $value): ?>
                            <option value="<?php echo esc_attr($key) ?>" <?php selected($template_type, esc_attr($key)); ?>><?php echo sprintf('%s', $value) ?></option>
                        <?php endforeach;
                        ?>

                    </select>
                </td>
            </tr>

            <?php $this->display_rules_tab(); ?>
            <tr class="theme-builder-options-row theme-builder-shortcode">
                <td class="theme-builder-options-row-heading">
                    <label for="etb_template_type"><?php esc_html_e('Shortcode', 'havezic'); ?></label>
                    <i class="theme-builder-options-row-heading-help dashicons dashicons-editor-help" title="<?php esc_attr_e('Copy this shortcode and paste it into your post, page, or text widget content.', 'havezic'); ?>">
                    </i>
                </td>
                <td class="theme-builder-options-row-content">
						<span class="theme-builder-shortcode-col-wrap">
							<input type="text" onfocus="this.select();" readonly="readonly" value="[etb_template id='<?php echo esc_attr($post->ID); ?>']" class="theme-builder-large-text code">
						</span>
                </td>
            </tr>
            <tr class="theme-builder-options-row enable-for-canvas">
                <td class="theme-builder-options-row-heading">
                    <label for="display-on-canvas-template">
                        <?php esc_html_e('Enable Layout for Elementor Canvas Template?', 'havezic'); ?>
                    </label>
                    <i class="theme-builder-options-row-heading-help dashicons dashicons-editor-help" title="<?php esc_attr_e('Enabling this option will display this layout on pages using Elementor Canvas Template.', 'havezic'); ?>"></i>
                </td>
                <td class="theme-builder-options-row-content">
                    <input type="checkbox" id="display-on-canvas-template" name="display-on-canvas-template" value="1" <?php checked($display_on_canvas, true); ?> />
                </td>
            </tr>
            </tbody>
        </table>
        <?php
    }

    /**
     * Markup for Display Rules Tabs.
     *
     * @since  1.0.0
     */
    public function display_rules_tab() {
        // Load Target Rule assets.
        ETB_Target_Rules_Fields::get_instance()->admin_styles();

        $include_locations = get_post_meta(get_the_id(), 'etb_target_include_locations', true);
        $exclude_locations = get_post_meta(get_the_id(), 'etb_target_exclude_locations', true);
        $users             = get_post_meta(get_the_id(), 'etb_target_user_roles', true);
        ?>
        <tr class="etb-target-rules-row theme-builder-options-row">
            <td class="etb-target-rules-row-heading theme-builder-options-row-heading">
                <label><?php esc_html_e('Display On', 'havezic'); ?></label>
                <i class="etb-target-rules-heading-help dashicons dashicons-editor-help"
                   title="<?php echo esc_attr__('Add locations for where this template should appear.', 'havezic'); ?>"></i>
            </td>
            <td class="etb-target-rules-row-content theme-builder-options-row-content">
                <?php
                ETB_Target_Rules_Fields::target_rule_settings_field(
                    'etb-target-rules-location',
                    [
                        'title'          => __('Display Rules', 'havezic'),
                        'value'          => '[{"type":"basic-global","specific":null}]',
                        'tags'           => 'site,enable,target,pages',
                        'rule_type'      => 'display',
                        'add_rule_label' => __('Add Display Rule', 'havezic'),
                    ],
                    $include_locations
                );
                ?>
            </td>
        </tr>
        <tr class="etb-target-rules-row theme-builder-options-row">
            <td class="etb-target-rules-row-heading theme-builder-options-row-heading">
                <label><?php esc_html_e('Do Not Display On', 'havezic'); ?></label>
                <i class="etb-target-rules-heading-help dashicons dashicons-editor-help"
                   title="<?php echo esc_attr__('Add locations for where this template should not appear.', 'havezic'); ?>"></i>
            </td>
            <td class="etb-target-rules-row-content theme-builder-options-row-content">
                <?php
                ETB_Target_Rules_Fields::target_rule_settings_field(
                    'etb-target-rules-exclusion',
                    [
                        'title'          => __('Exclude On', 'havezic'),
                        'value'          => '[]',
                        'tags'           => 'site,enable,target,pages',
                        'add_rule_label' => __('Add Exclusion Rule', 'havezic'),
                        'rule_type'      => 'exclude',
                    ],
                    $exclude_locations
                );
                ?>
            </td>
        </tr>
        <tr class="etb-target-rules-row theme-builder-options-row">
            <td class="etb-target-rules-row-heading theme-builder-options-row-heading">
                <label><?php esc_html_e('User Roles', 'havezic'); ?></label>
                <i class="etb-target-rules-heading-help dashicons dashicons-editor-help" title="<?php echo esc_attr__('Display custom template based on user role.', 'havezic'); ?>"></i>
            </td>
            <td class="etb-target-rules-row-content theme-builder-options-row-content">
                <?php
                ETB_Target_Rules_Fields::target_user_role_settings_field(
                    'etb-target-rules-users',
                    [
                        'title'          => __('Users', 'havezic'),
                        'value'          => '[]',
                        'tags'           => 'site,enable,target,pages',
                        'add_rule_label' => __('Add User Rule', 'havezic'),
                    ],
                    $users
                );
                ?>
            </td>
        </tr>
        <?php
    }

    /**
     * Save meta field.
     *
     * @param POST $post_id Currennt post object which is being displayed.
     *
     * @return Void
     */
    public function etb_save_meta($post_id) {

        // Bail if we're doing an auto save.
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }

        // if our nonce isn't there, or we can't verify it, bail.
        if (!isset($_POST['etb_meta_nounce']) || !wp_verify_nonce(sanitize_text_field($_POST['etb_meta_nounce']), 'etb_meta_nounce')) {
            return;
        }

        // if our current user can't edit this post, bail.
        if (!current_user_can('edit_posts')) {
            return;
        }

        $target_locations = ETB_Target_Rules_Fields::get_format_rule_value($_POST, 'etb-target-rules-location');
        $target_exclusion = ETB_Target_Rules_Fields::get_format_rule_value($_POST, 'etb-target-rules-exclusion');
        $target_users     = [];

        if (isset($_POST['etb-target-rules-users'])) {
            $target_users = array_map('sanitize_text_field', $_POST['etb-target-rules-users']);
        }

        update_post_meta($post_id, 'etb_target_include_locations', $target_locations);
        update_post_meta($post_id, 'etb_target_exclude_locations', $target_exclusion);
        update_post_meta($post_id, 'etb_target_user_roles', $target_users);

        if (isset($_POST['etb_template_type'])) {
            update_post_meta($post_id, 'etb_template_type', sanitize_text_field($_POST['etb_template_type']));
        }

        if (isset($_POST['display-on-canvas-template'])) {
            update_post_meta($post_id, 'display-on-canvas-template', sanitize_text_field($_POST['display-on-canvas-template']));
        } else {
            delete_post_meta($post_id, 'display-on-canvas-template');
        }
    }

    /**
     * Display notice when editing the header or footer when there is one more of similar layout is active on the site.
     *
     * @since 1.0.0
     */
    public function location_notice() {
        global $pagenow;
        global $post;

        if ('post.php' != $pagenow || !is_object($post) || self::CPT != $post->post_type) {
            return;
        }

        $template_type = get_post_meta($post->ID, 'etb_template_type', true);

        if ('' !== $template_type) {
            $templates = ETB_Elementor::get_template_id($template_type);

            // Check if more than one template is selected for current template type.
            if (is_array($templates) && isset($templates[1]) && $post->ID != $templates[0]) {
                $post_title        = '<strong>' . esc_html(get_the_title($templates[0])) . '</strong>';
                $template_location = '<strong>' . esc_html($this->template_location($template_type)) . '</strong>';
                /* Translators: Post title, Template Location */
                $message = sprintf(__('Template %1$s is already assigned to the location %2$s', 'havezic'), $post_title, $template_location);

                echo '<div class="error"><p>';
                echo esc_html($message);
                echo '</p></div>';
            }
        }
    }

    /**
     * Convert the Template name to be added in the notice.
     *
     * @param String $template_type Template type name.
     *
     * @return String $template_type Template type name.
     * @since  1.0.0
     *
     */
    public function template_location($template_type) {
        $template_type = ucfirst(str_replace('type_', '', $template_type));

        return $template_type;
    }

    /**
     * Don't display the elementor Theme Builder templates on the frontend for non edit_posts capable users.
     *
     * @since  1.0.0
     */
    public function block_template_frontend() {
        if (is_singular(self::CPT) && !current_user_can('edit_posts')) {
            wp_redirect(site_url(), 301);
            die;
        }
    }

    /**
     * Single template function which will choose our template
     *
     * @param String $single_template Single template.
     * @since  1.0.1
     *
     */
    function load_canvas_template($single_template) {
        global $post;
        $template_type = get_post_meta($post->ID, 'etb_template_type', true);
        if (self::CPT == $post->post_type) {
            $elementor_2_0_canvas = ELEMENTOR_PATH . '/modules/page-templates/templates/canvas.php';

            if(in_array($template_type,['type_single','type_archive'])){
                return get_theme_file_path('template-homepage.php');
            }

            if (file_exists($elementor_2_0_canvas)) {
                return $elementor_2_0_canvas;
            } else {
                return ELEMENTOR_PATH . '/includes/page-templates/canvas.php';
            }
        }

        return $single_template;
    }

    /**
     * Set shortcode column for template list.
     *
     * @param array $columns template list columns.
     */
    function set_shortcode_columns($columns) {
        $date_column = $columns['date'];

        unset($columns['date']);

        $columns['shortcode'] = __('Shortcode', 'havezic');
        $columns['date']      = $date_column;

        return $columns;
    }


    /**
     * Display shortcode in template list column.
     *
     * @param array $column template list column.
     * @param int $post_id post id.
     */
    function render_shortcode_column($column, $post_id) {
        switch ($column) {
            case 'shortcode':
                ob_start();
                ?>
                <span class="theme-builder-shortcode-col-wrap">
					<input type="text" onfocus="this.select();" readonly="readonly" value="[etb_template id='<?php echo esc_attr($post_id); ?>']" class="theme-builder-large-text code">
				</span>

                <?php

                ob_get_contents();

                break;
        }
    }
}

Theme_Builder_Admin::instance();
