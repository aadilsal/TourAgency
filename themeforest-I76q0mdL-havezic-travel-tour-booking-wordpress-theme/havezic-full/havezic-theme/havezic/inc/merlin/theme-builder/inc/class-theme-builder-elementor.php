<?php
/**
 * Entry point for the plugin. Checks if Elementor is installed and activated and loads it's own files and actions.
 *
 * @package header-footer-elementor
 */

use Theme_Builder\Lib\ETB_Target_Rules_Fields;


/**
 * Class ETB_Elementor
 */
class ETB_Elementor {

    /**
     * Current theme template
     *
     * @var String
     */
    public $template;

    /**
     * Instance of Elemenntor Frontend class.
     *
     * @var \Elementor\Frontend()
     */
    private static $elementor_instance;

    /**
     * Instance of Theme_Builder_Admin
     *
     * @var ETB_Elementor
     */
    private static $_instance = null;

    /**
     * Instance of ETB_Elementor
     *
     * @return ETB_Elementor Instance of ETB_Elementor
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
    function __construct() {

        $this->template = get_template();


        $is_elementor_callable = (defined('ELEMENTOR_VERSION') && is_callable('Elementor\Plugin::instance')) ? true : false;

        $required_elementor_version = '3.5.0';

        $is_elementor_outdated = ($is_elementor_callable && (!version_compare(ELEMENTOR_VERSION, $required_elementor_version, '>='))) ? true : false;

        if ((!$is_elementor_callable) || $is_elementor_outdated) {
            $this->elementor_not_available($is_elementor_callable, $is_elementor_outdated);
        }

        if ($is_elementor_callable) {
            self::$elementor_instance = Elementor\Plugin::instance();

            $this->includes();

            add_action('wp', [$this, 'hooks']);

            // Scripts and styles.
            add_action('wp_enqueue_scripts', [$this, 'enqueue_scripts']);

            add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_scripts']);

            add_filter('body_class', [$this, 'body_class']);
            add_action('switch_theme', [$this, 'reset_unsupported_theme_notice']);

            add_shortcode('etb_template', [$this, 'render_template']);

        }

    }

    /**
     * Run all the Actions / Filters.
     */
    public function hooks() {
        if (etb_header_enabled()) {
            // Display THEME_BUILDER's header in the replaced header.
            add_action('etb_header', 'etb_render_header');
        }

        if (etb_after_header_enabled()) {
            add_action('etb_header', ['ETB_Elementor', 'get_after_header_content']);
        }

        if (etb_is_before_footer_enabled()) {
            add_action('etb_footer', ['ETB_Elementor', 'get_before_footer_content']);
        }

        if (etb_footer_enabled()) {
            // Display THEME_BUILDER's footer in the replaced header.
            add_action('etb_footer', 'etb_render_footer');
        }

        if (etb_single_enabled()) {
            add_action('etb_single', ['ETB_Elementor', 'get_single_content']);
        }

        if (etb_archive_enabled()) {
            add_action('etb_archive', ['ETB_Elementor', 'get_archive_content']);
        }

    }

    /**
     * Reset the Unsupported theme nnotice after a theme is switched.
     *
     * @return void
     * @since 1.0.16
     *
     */
    public function reset_unsupported_theme_notice() {
        delete_user_meta(get_current_user_id(), 'unsupported-theme');
    }

    /**
     * Prints the admin notics when Elementor is not installed or activated or version outdated.
     *
     * @param boolean $is_elementor_callable specifies if elementor is available.
     * @param boolean $is_elementor_outdated specifies if elementor version is old.
     * @since 1.5.9
     */
    public function elementor_not_available($is_elementor_callable, $is_elementor_outdated) {

        if ((!did_action('elementor/loaded')) || (!$is_elementor_callable)) {
            add_action('admin_notices', [$this, 'elementor_not_installed_activated']);
            add_action('network_admin_notices', [$this, 'elementor_not_installed_activated']);
            return;
        }

        if ($is_elementor_outdated) {
            add_action('admin_notices', [$this, 'elementor_outdated']);
            add_action('network_admin_notices', [$this, 'elementor_outdated']);
            return;
        }

    }

    /**
     * Prints the admin notics when Elementor is not installed or activated.
     */
    public function elementor_not_installed_activated() {

        $screen = get_current_screen();
        if (isset($screen->parent_file) && 'plugins.php' === $screen->parent_file && 'update' === $screen->id) {
            return;
        }

        if (!did_action('elementor/loaded')) {
            // Check user capability.
            if (!(current_user_can('activate_plugins') && current_user_can('install_plugins'))) {
                return;
            }

            /* TO DO */
            $class = 'notice notice-error';
            /* translators: %s: html tags */
            $message = sprintf(__('The %1$sElementor Header & Footer Builder%2$s plugin requires %1$sElementor%2$s plugin installed & activated.', 'havezic'), '<strong>', '</strong>');

            $plugin = 'elementor/elementor.php';

            if (_is_elementor_installed()) {

                $action_url   = wp_nonce_url('plugins.php?action=activate&amp;plugin=' . $plugin . '&amp;plugin_status=all&amp;paged=1&amp;s', 'activate-plugin_' . $plugin);
                $button_label = __('Activate Elementor', 'havezic');

            } else {

                $action_url   = wp_nonce_url(self_admin_url('update.php?action=install-plugin&plugin=elementor'), 'install-plugin_elementor');
                $button_label = __('Install Elementor', 'havezic');
            }

            $button = '<p><a href="' . esc_url($action_url) . '" class="button-primary">' . esc_html($button_label) . '</a></p><p></p>';

            printf('<div class="%1$s"><p>%2$s</p>%3$s</div>', esc_attr($class), wp_kses_post($message), wp_kses_post($button));
        }
    }

    /**
     * Prints the admin notics when Elementor version is outdated.
     */
    public function elementor_outdated() {

        // Check user capability.
        if (!(current_user_can('activate_plugins') && current_user_can('install_plugins'))) {
            return;
        }

        /* TO DO */
        $class = 'notice notice-error';
        /* translators: %s: html tags */
        $message = sprintf(__('The %1$sElementor Header & Footer Builder%2$s plugin has stopped working because you are using an older version of %1$sElementor%2$s plugin.', 'havezic'), '<strong>', '</strong>');

        $plugin = 'elementor/elementor.php';

        if (file_exists(WP_PLUGIN_DIR . '/elementor/elementor.php')) {

            $action_url   = wp_nonce_url(self_admin_url('update.php?action=upgrade-plugin&amp;plugin=') . $plugin . '&amp;', 'upgrade-plugin_' . $plugin);
            $button_label = __('Update Elementor', 'havezic');

        } else {

            $action_url   = wp_nonce_url(self_admin_url('update.php?action=install-plugin&plugin=elementor'), 'install-plugin_elementor');
            $button_label = __('Install Elementor', 'havezic');
        }

        $button = '<p><a href="' . esc_url($action_url) . '" class="button-primary">' . esc_html($button_label) . '</a></p><p></p>';

        printf('<div class="%1$s"><p>%2$s</p>%3$s</div>', esc_attr($class), wp_kses_post($message), wp_kses_post($button));
    }

    /**
     * Loads the globally required files for the plugin.
     */
    public function includes() {
        require_once OPAL_BUILDER_DIR . 'admin/class-theme-builder-admin.php';

        require_once OPAL_BUILDER_DIR . 'inc/theme-builder-functions.php';

        // Load Elementor Canvas Compatibility.
        require_once OPAL_BUILDER_DIR . 'inc/class-theme-builder-elementor-canvas-compat.php';

        // Load WPML & Polylang Compatibility if WPML is installed and activated.
        if (defined('ICL_SITEPRESS_VERSION') || defined('POLYLANG_BASENAME')) {
            require_once OPAL_BUILDER_DIR . 'inc/compatibility/class-theme-builder-wpml-compatibility.php';
        }

        // Load Target rules.
        require_once OPAL_BUILDER_DIR . 'inc/lib/target-rule/class-target-rules-fields.php';
    }


    /**
     * Enqueue styles and scripts.
     */
    public function enqueue_scripts() {

        if (class_exists('\Elementor\Plugin')) {
            $elementor = \Elementor\Plugin::instance();
            $elementor->frontend->enqueue_styles();
        }

        if (class_exists('\ElementorPro\Plugin')) {
            $elementor_pro = \ElementorPro\Plugin::instance();
            if ( method_exists( $elementor_pro, 'enqueue_styles' ) ) {
                $elementor_pro->enqueue_styles();
            }
        }

        if (etb_header_enabled()) {
            if (class_exists('\Elementor\Core\Files\CSS\Post')) {
                $css_file = new \Elementor\Core\Files\CSS\Post(get_etb_header_id());
            } elseif (class_exists('\Elementor\Post_CSS_File')) {
                $css_file = new \Elementor\Post_CSS_File(get_etb_header_id());
            }

            $css_file->enqueue();
        }

        if (etb_after_header_enabled()) {
            if (class_exists('\Elementor\Core\Files\CSS\Post')) {
                $css_file = new \Elementor\Core\Files\CSS\Post(get_etb_after_header_id());
            } elseif (class_exists('\Elementor\Post_CSS_File')) {
                $css_file = new \Elementor\Post_CSS_File(get_etb_after_header_id());
            }

            $css_file->enqueue();
        }

        if (etb_footer_enabled()) {
            if (class_exists('\Elementor\Core\Files\CSS\Post')) {
                $css_file = new \Elementor\Core\Files\CSS\Post(get_etb_footer_id());
            } elseif (class_exists('\Elementor\Post_CSS_File')) {
                $css_file = new \Elementor\Post_CSS_File(get_etb_footer_id());
            }

            $css_file->enqueue();
        }

        if (etb_is_before_footer_enabled()) {
            if (class_exists('\Elementor\Core\Files\CSS\Post')) {
                $css_file = new \Elementor\Core\Files\CSS\Post(etb_get_before_footer_id());
            } elseif (class_exists('\Elementor\Post_CSS_File')) {
                $css_file = new \Elementor\Post_CSS_File(etb_get_before_footer_id());
            }
            $css_file->enqueue();
        }

        if (etb_single_enabled()) {
            if (class_exists('\Elementor\Core\Files\CSS\Post')) {
                $css_file = new \Elementor\Core\Files\CSS\Post(etb_get_single_id());
            } elseif (class_exists('\Elementor\Post_CSS_File')) {
                $css_file = new \Elementor\Post_CSS_File(etb_get_single_id());
            }
            $css_file->enqueue();
        }
        if (etb_archive_enabled()) {
            if (class_exists('\Elementor\Core\Files\CSS\Post')) {
                $css_file = new \Elementor\Core\Files\CSS\Post(etb_get_archive_id());
            } elseif (class_exists('\Elementor\Post_CSS_File')) {
                $css_file = new \Elementor\Post_CSS_File(etb_get_archive_id());
            }
            $css_file->enqueue();
        }
    }

    /**
     * Load admin styles on header footer elementor edit screen.
     */
    public function enqueue_admin_scripts() {
        global $pagenow;
        $screen = get_current_screen();

        if (('etb_library' == $screen->id && ('post.php' == $pagenow || 'post-new.php' == $pagenow)) || ('edit.php' == $pagenow && 'edit-etb-builder' == $screen->id)) {

            wp_enqueue_style('theme-builder-admin-style', OPAL_BUILDER_URL . 'admin/assets/css/admin.css', [], HAVEZIC_VERSION);
            wp_enqueue_script('theme-builder-admin-script', OPAL_BUILDER_URL . 'admin/assets/js/admin.js', ['jquery', 'updates'], HAVEZIC_VERSION, true);

        }
    }

    /**
     * Adds classes to the body tag conditionally.
     *
     * @param Array $classes array with class names for the body tag.
     *
     * @return Array          array with class names for the body tag.
     */
    public function body_class($classes) {
        if (etb_header_enabled()) {
            $classes[] = 'etb-header';
        }

        if (etb_footer_enabled()) {
            $classes[] = 'etb-footer';
        }

        $classes[] = 'etb-template-' . $this->template;
        $classes[] = 'etb-stylesheet-' . get_stylesheet();

        return $classes;
    }


    /**
     * Prints the Header content.
     */
    public static function get_header_content() {
        echo self::$elementor_instance->frontend->get_builder_content_for_display(get_etb_header_id());
    }

    /**
     * Prints the After Header content.
     */
    public static function get_after_header_content() {
        echo "<div class='header-width-fixer'>";
        echo self::$elementor_instance->frontend->get_builder_content_for_display(get_etb_after_header_id());
        echo '</div>';
    }

    /**
     * Prints the Footer content.
     */
    public static function get_footer_content() {
        echo "<div class='footer-width-fixer'>";
        echo self::$elementor_instance->frontend->get_builder_content_for_display(get_etb_footer_id()); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
        echo '</div>';
    }

    /**
     * Prints the Before Footer content.
     */
    public static function get_before_footer_content() {
        echo "<div class='footer-width-fixer'>";
        echo self::$elementor_instance->frontend->get_builder_content_for_display(etb_get_before_footer_id()); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
        echo '</div>';
    }

    /**
     * Prints the Archive content.
     */
    public static function get_archive_content() {
        echo self::$elementor_instance->frontend->get_builder_content_for_display(etb_get_archive_id()); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
    }

    /**
     * Prints the Single content.
     */
    public static function get_single_content() {
        echo self::$elementor_instance->frontend->get_builder_content_for_display(etb_get_single_id()); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
    }

    /**
     * Get option for the plugin settings
     *
     * @param mixed $setting Option name.
     * @param mixed $default Default value to be received if the option value is not stored in the option. type_single
     *
     * @return mixed.
     */
    public static function get_settings($setting = '', $default = '') {
        if ('type_header' == $setting || 'type_footer' == $setting || 'type_before_footer' == $setting || 'type_after_header' == $setting || 'type_archive' == $setting || 'type_single' == $setting) {
            $templates = self::get_template_id($setting);

            $template = !is_array($templates) ? $templates : $templates[0];

            $template = apply_filters("etb_get_settings_{$setting}", $template);

            return $template;
        }
    }

    /**
     * Get header or footer template id based on the meta query.
     *
     * @param String $type Type of the template header/footer.
     *
     * @return Mixed       Returns the header or footer template id if found, else returns string ''.
     */
    public static function get_template_id($type) {
        $option = [
            'location'  => 'etb_target_include_locations',
            'exclusion' => 'etb_target_exclude_locations',
            'users'     => 'etb_target_user_roles',
        ];

        $etb_templates = ETB_Target_Rules_Fields::get_instance()->get_posts_by_conditions('etb_library', $option);

        foreach ($etb_templates as $template) {
            if (get_post_meta(absint($template['id']), 'etb_template_type', true) === $type) {
                if (function_exists('pll_current_language')) {
                    if (pll_current_language('slug') == pll_get_post_language($template['id'], 'slug')) {
                        return $template['id'];
                    }
                } else {
                    return $template['id'];
                }
            }
        }

        return '';
    }

    /**
     * Callback to shortcode.
     *
     * @param array $atts attributes for shortcode.
     */
    public function render_template($atts) {
        $atts = shortcode_atts(
            [
                'id' => '',
            ],
            $atts,
            'etb_template'
        );

        $id = !empty($atts['id']) ? apply_filters('etb_render_template_id', intval($atts['id'])) : '';

        if (empty($id)) {
            return '';
        }

        if (class_exists('\Elementor\Core\Files\CSS\Post')) {
            $css_file = new \Elementor\Core\Files\CSS\Post($id);
        } elseif (class_exists('\Elementor\Post_CSS_File')) {
            // Load elementor styles.
            $css_file = new \Elementor\Post_CSS_File($id);
        }
        $css_file->enqueue();

        return self::$elementor_instance->frontend->get_builder_content_for_display($id);
    }

}

/**
 * Is elementor plugin installed.
 */
if (!function_exists('_is_elementor_installed')) {

    /**
     * Check if Elementor is installed
     *
     * @since 1.6.0
     *
     * @access public
     */
    function _is_elementor_installed() {
        return (file_exists(WP_PLUGIN_DIR . '/elementor/elementor.php')) ? true : false;
    }
}
