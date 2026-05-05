<?php

use Elementor\Plugin;

if (!defined('ABSPATH')) {
    exit;
}
if (!class_exists('Havezic_Elementor')) :

    /**
     * The Havezic Elementor Integration class
     */
    class Havezic_Elementor {
        private $suffix = '';

        public function __construct() {
            $this->suffix = (defined('SCRIPT_DEBUG') && SCRIPT_DEBUG) ? '' : '.min';

            add_action('elementor/frontend/after_enqueue_scripts', [$this, 'register_auto_scripts_frontend']);
            add_action('elementor/elements/categories_registered', [$this, 'register_widget_category']);
            add_action('wp_enqueue_scripts', [$this, 'add_scripts'], 15);
            add_action('elementor/widgets/register', array($this, 'customs_widgets'));
            add_action('elementor/widgets/register', array($this, 'include_widgets'));
            add_action('elementor/frontend/after_enqueue_scripts', [$this, 'add_js']);

            // Custom Animation Scroll
            add_filter('elementor/controls/animations/additional_animations', [$this, 'add_animations_scroll']);

            // Backend
            add_action('elementor/editor/after_enqueue_styles', [$this, 'add_style_editor'], 99);

            // Add Icon Custom
            add_action('elementor/icons_manager/native', [$this, 'add_icons_native']);
            add_action('elementor/controls/controls_registered', [$this, 'add_icons']);

            if (!havezic_is_elementor_pro_activated()) {
                require trailingslashit(get_template_directory()) . 'inc/elementor/custom-css.php';
                require trailingslashit(get_template_directory()) . 'inc/elementor/sticky-section.php';
                if (is_admin()) {
                    add_action('manage_elementor_library_posts_columns', [$this, 'admin_columns_headers']);
                    add_action('manage_elementor_library_posts_custom_column', [$this, 'admin_columns_content'], 10, 2);
                }
            }

            require get_theme_file_path('inc/elementor/modules/page-settings.php');
            require get_theme_file_path('inc/elementor/modules/header-settings.php');


            add_filter('elementor/fonts/additional_fonts', [$this, 'additional_fonts']);
            add_action('wp_enqueue_scripts', [$this, 'elementor_kit']);
        }

        public function elementor_kit() {
            $active_kit_id = Elementor\Plugin::$instance->kits_manager->get_active_id();
            Elementor\Plugin::$instance->kits_manager->frontend_before_enqueue_styles();
            $myvals = get_post_meta($active_kit_id, '_elementor_page_settings', true);
            if (!empty($myvals)) {
                $css = '';
                foreach ($myvals['system_colors'] as $key => $value) {
                    $css .= $value['color'] !== '' ? '--' . $value['_id'] . ':' . $value['color'] . ';' : '';
                }

                $var = "body{{$css}}";
                wp_add_inline_style('havezic-style', $var);
            }
        }

        public function additional_fonts($fonts) {

            return $fonts;
        }

        public function admin_columns_headers($defaults) {
            $defaults['shortcode'] = esc_html__('Shortcode', 'havezic');

            return $defaults;
        }

        public function admin_columns_content($column_name, $post_id) {
            if ('shortcode' === $column_name) {
                ob_start();
                ?>
                <input class="elementor-shortcode-input" type="text" readonly onfocus="this.select()" value="[etb_template id='<?php echo esc_attr($post_id); ?>']"/>
                <?php
                ob_get_contents();
            }
        }

        public function add_js() {

            wp_enqueue_script('havezic-elementor-frontend', get_theme_file_uri('/assets/js/elementor-frontend.js'), [], HAVEZIC_VERSION);
        }

        public function add_style_editor() {

            wp_enqueue_style('havezic-elementor-editor-icon', get_theme_file_uri('/assets/css/admin/elementor/icons.css'), [], HAVEZIC_VERSION);
        }

        public function add_scripts() {

            $suffix = (defined('SCRIPT_DEBUG') && SCRIPT_DEBUG) ? '' : '.min';
            wp_enqueue_style('havezic-elementor', get_template_directory_uri() . '/assets/css/base/elementor.css', '', HAVEZIC_VERSION);
            wp_style_add_data('havezic-elementor', 'rtl', 'replace');

            // Add Scripts
            wp_enqueue_style('e-swiper');
            $e_swiper_latest     = Plugin::$instance->experiments->is_feature_active('e_swiper_latest');
            $e_swiper_asset_path = $e_swiper_latest ? 'assets/lib/swiper/v8/' : 'assets/lib/swiper/';
            $e_swiper_version    = $e_swiper_latest ? '8.4.5' : '5.3.6';
            wp_register_script(
                'swiper',
                plugins_url('elementor/' . $e_swiper_asset_path . 'swiper.js', 'elementor'),
                [],
                $e_swiper_version,
                true
            );
        }

        public function register_auto_scripts_frontend() {
            $suffix = (defined('SCRIPT_DEBUG') && SCRIPT_DEBUG) ? '' : '.min';
            wp_register_script('havezic-elementor-swiper', get_theme_file_uri('/assets/js/elementor-swiper' . $suffix . '.js'), array('jquery', 'elementor-frontend'), HAVEZIC_VERSION, true);
            // Register auto scripts frontend

            $files  = glob(get_theme_file_path('/assets/js/elementor/*' . $suffix . '.js'));
            foreach ($files as $file) {
                $file_name = wp_basename($file);
                $handle    = str_replace($suffix.".js", '', $file_name);
                $scr       = get_theme_file_uri('/assets/js/elementor/' . $file_name);
                if (file_exists($file)) {
                    wp_register_script('havezic-elementor-' . $handle, $scr, ['jquery', 'elementor-frontend'], HAVEZIC_VERSION, true);
                }
            }
        }

        public function register_widget_category($this_cat) {
            $this_cat->add_category(
                'havezic-addons',
                [
                    'title' => esc_html__('Havezic Addons', 'havezic'),
                    'icon'  => 'fa fa-plug',
                ]
            );
            return $this_cat;
        }

        public function add_animations_scroll($animations) {
            $animations['Havezic Animation'] = [
                'opal-move-up'    => 'Move Up',
                'opal-move-down'  => 'Move Down',
                'opal-move-left'  => 'Move Left',
                'opal-move-right' => 'Move Right',
                'opal-flip'       => 'Flip',
                'opal-helix'      => 'Helix',
                'opal-scale-up'   => 'Scale',
                'opal-am-popup'   => 'Popup',
            ];

            return $animations;
        }

        public function customs_widgets() {
            $files = glob(get_theme_file_path('/inc/elementor/custom-widgets/*.php'));
            foreach ($files as $file) {
                if (file_exists($file)) {
                    require_once $file;
                }
            }
        }

        /**
         * @param $widgets_manager Elementor\Widgets_Manager
         */
        public function include_widgets($widgets_manager) {
            require 'base-swiper-widget.php';
            $files = glob(get_theme_file_path('/inc/elementor/widgets/*.php'));
            foreach ($files as $file) {
                if (file_exists($file)) {
                    require_once $file;
                }
            }
        }


        public function add_icons( $manager ) {
            $new_icons = json_decode( '{"havezic-icon-angle-down":"angle-down","havezic-icon-angle-left":"angle-left","havezic-icon-angle-right":"angle-right","havezic-icon-angle-up":"angle-up","havezic-icon-arrow-down":"arrow-down","havezic-icon-arrow-left":"arrow-left","havezic-icon-arrow-right":"arrow-right","havezic-icon-arrow-small-left":"arrow-small-left","havezic-icon-arrow-small-right":"arrow-small-right","havezic-icon-arrow-small-up":"arrow-small-up","havezic-icon-arrow-up":"arrow-up","havezic-icon-bicycle":"bicycle","havezic-icon-boarding":"boarding","havezic-icon-calendar-check":"calendar-check","havezic-icon-calendar":"calendar","havezic-icon-check-verified":"check-verified","havezic-icon-check":"check","havezic-icon-checkbox-circle-fill":"checkbox-circle-fill","havezic-icon-compass":"compass","havezic-icon-contacts-book":"contacts-book","havezic-icon-coupon":"coupon","havezic-icon-credit-check":"credit-check","havezic-icon-encil-ruler":"encil-ruler","havezic-icon-envelope-fill":"envelope-fill","havezic-icon-file-list":"file-list","havezic-icon-flag":"flag","havezic-icon-globe":"globe","havezic-icon-headphone-line":"headphone-line","havezic-icon-heart":"heart","havezic-icon-home-smile":"home-smile","havezic-icon-hot-air":"hot-air","havezic-icon-image":"image","havezic-icon-kayak":"kayak","havezic-icon-location":"location","havezic-icon-luggage":"luggage","havezic-icon-mail-send-line":"mail-send-line","havezic-icon-mail":"mail","havezic-icon-map-pin-line":"map-pin-line","havezic-icon-map-pin":"map-pin","havezic-icon-moon":"moon","havezic-icon-mountains":"mountains","havezic-icon-pad-thai":"pad-thai","havezic-icon-phone-call":"phone-call","havezic-icon-phone":"phone","havezic-icon-play-fill":"play-fill","havezic-icon-plus-slim":"plus-slim","havezic-icon-quote":"quote","havezic-icon-share":"share","havezic-icon-suitcase":"suitcase","havezic-icon-time-line":"time-line","havezic-icon-travel":"travel","havezic-icon-user-check":"user-check","havezic-icon-user-circle":"user-circle","havezic-icon-users":"users","havezic-icon-video-recorder":"video-recorder","havezic-icon-360":"360","havezic-icon-bars":"bars","havezic-icon-calendar-alt":"calendar-alt","havezic-icon-cart-empty":"cart-empty","havezic-icon-check-square":"check-square","havezic-icon-circle":"circle","havezic-icon-cloud-download-alt":"cloud-download-alt","havezic-icon-comment":"comment","havezic-icon-comments":"comments","havezic-icon-contact":"contact","havezic-icon-credit-card":"credit-card","havezic-icon-dot-circle":"dot-circle","havezic-icon-edit":"edit","havezic-icon-envelope":"envelope","havezic-icon-expand-alt":"expand-alt","havezic-icon-external-link-alt":"external-link-alt","havezic-icon-file-alt":"file-alt","havezic-icon-file-archive":"file-archive","havezic-icon-folder-open":"folder-open","havezic-icon-folder":"folder","havezic-icon-frown":"frown","havezic-icon-gift":"gift","havezic-icon-grid":"grid","havezic-icon-grip-horizontal":"grip-horizontal","havezic-icon-heart-fill":"heart-fill","havezic-icon-history":"history","havezic-icon-home":"home","havezic-icon-info-circle":"info-circle","havezic-icon-instagram":"instagram","havezic-icon-level-up-alt":"level-up-alt","havezic-icon-list":"list","havezic-icon-map-marker-check":"map-marker-check","havezic-icon-meh":"meh","havezic-icon-minus-circle":"minus-circle","havezic-icon-minus":"minus","havezic-icon-mobile-android-alt":"mobile-android-alt","havezic-icon-money-bill":"money-bill","havezic-icon-pencil-alt":"pencil-alt","havezic-icon-plus-circle":"plus-circle","havezic-icon-plus":"plus","havezic-icon-random":"random","havezic-icon-reply-all":"reply-all","havezic-icon-reply":"reply","havezic-icon-search":"search","havezic-icon-shield-check":"shield-check","havezic-icon-shopping-basket":"shopping-basket","havezic-icon-shopping-cart":"shopping-cart","havezic-icon-sign-out-alt":"sign-out-alt","havezic-icon-smile":"smile","havezic-icon-spinner":"spinner","havezic-icon-square":"square","havezic-icon-star":"star","havezic-icon-store":"store","havezic-icon-sync":"sync","havezic-icon-tachometer-alt":"tachometer-alt","havezic-icon-th-list":"th-list","havezic-icon-thumbtack":"thumbtack","havezic-icon-ticket":"ticket","havezic-icon-times-circle":"times-circle","havezic-icon-times-square":"times-square","havezic-icon-times":"times","havezic-icon-trophy-alt":"trophy-alt","havezic-icon-truck":"truck","havezic-icon-unlock":"unlock","havezic-icon-video":"video","havezic-icon-wishlist-empty":"wishlist-empty","havezic-icon-adobe":"adobe","havezic-icon-amazon":"amazon","havezic-icon-android":"android","havezic-icon-angular":"angular","havezic-icon-apper":"apper","havezic-icon-apple":"apple","havezic-icon-atlassian":"atlassian","havezic-icon-behance":"behance","havezic-icon-bitbucket":"bitbucket","havezic-icon-bitcoin":"bitcoin","havezic-icon-bity":"bity","havezic-icon-bluetooth":"bluetooth","havezic-icon-btc":"btc","havezic-icon-centos":"centos","havezic-icon-chrome":"chrome","havezic-icon-codepen":"codepen","havezic-icon-cpanel":"cpanel","havezic-icon-discord":"discord","havezic-icon-dochub":"dochub","havezic-icon-docker":"docker","havezic-icon-dribbble":"dribbble","havezic-icon-dropbox":"dropbox","havezic-icon-drupal":"drupal","havezic-icon-ebay":"ebay","havezic-icon-facebook-f":"facebook-f","havezic-icon-facebook":"facebook","havezic-icon-figma":"figma","havezic-icon-firefox":"firefox","havezic-icon-google-plus":"google-plus","havezic-icon-google":"google","havezic-icon-grunt":"grunt","havezic-icon-gulp":"gulp","havezic-icon-html5":"html5","havezic-icon-joomla":"joomla","havezic-icon-link-brand":"link-brand","havezic-icon-linkedin":"linkedin","havezic-icon-mailchimp":"mailchimp","havezic-icon-opencart":"opencart","havezic-icon-paypal":"paypal","havezic-icon-pinterest-p":"pinterest-p","havezic-icon-pinterest-r":"pinterest-r","havezic-icon-reddit":"reddit","havezic-icon-skype":"skype","havezic-icon-slack":"slack","havezic-icon-snapchat":"snapchat","havezic-icon-spotify":"spotify","havezic-icon-trello":"trello","havezic-icon-twitter-x":"twitter-x","havezic-icon-twitter":"twitter","havezic-icon-vimeo":"vimeo","havezic-icon-whatsapp":"whatsapp","havezic-icon-wordpress":"wordpress","havezic-icon-yoast":"yoast","havezic-icon-youtube":"youtube"}', true );
			$icons     = $manager->get_control( 'icon' )->get_settings( 'options' );
			$new_icons = array_merge(
				$new_icons,
				$icons
			);
			// Then we set a new list of icons as the options of the icon control
			$manager->get_control( 'icon' )->set_settings( 'options', $new_icons ); 
        }

        public function add_icons_native($tabs) {

            $tabs['opal-custom'] = [
                'name'          => 'havezic-icon',
                'label'         => esc_html__('Havezic Icon', 'havezic'),
                'prefix'        => 'havezic-icon-',
                'displayPrefix' => 'havezic-icon-',
                'labelIcon'     => 'fab fa-font-awesome-alt',
                'ver'           => HAVEZIC_VERSION,
                'fetchJson'     => get_theme_file_uri('/inc/elementor/icons.json'),
                'native'        => true,
            ];

            return $tabs;
        }
    }

endif;

return new Havezic_Elementor();
