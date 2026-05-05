<?php
/**
 * Add widget all-items to Elementor
 *
 * @since   1.3.13
 */


class Havezic_BABE_Elementor_Item_Wishlist_Widget extends \Elementor\Widget_Base {

    /**
     * Get widget name.
     *
     * @return string Widget name.
     */
    public function get_name() {
        return 'babe-item-wishlist';
    }

    /**
     * Get widget title.
     *
     * @return string Widget title.
     */
    public function get_title() {
        return esc_html__('Detail Wishlist', 'havezic');
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

    /**
     * Register widget controls.
     *
     * Adds different input fields to allow the user to change and customize the widget settings.
     */
    protected function register_controls() {

    }


    /**
     * Render widget output on the frontend.
     * Written in PHP and used to generate the final HTML.
     */
    protected function render() {
        $wishlist_active = isset( BABE_Settings::$settings['wishlist_active'] ) ? BABE_Settings::$settings['wishlist_active'] : false;

        if ( ! $wishlist_active ) {
            return;
        }

        $wishlist = Havezic_BA_Booking_Wishlist::add_to_wishlist(get_the_ID());
        if (\Elementor\Plugin::instance()->editor->is_edit_mode()) {
            ?>
            <a class="havezic_add_to_wishlist" rel="nofollow">
                <i class="<?php echo esc_attr($wishlist['icon_class']); ?>"></i><span><?php echo esc_html($wishlist['text']); ?></span>
            </a>
            <?php
        } else {

            if ($wishlist && !empty($wishlist)): ?>
                <a class="havezic_add_to_wishlist <?php echo esc_attr($wishlist['class']); ?>" href="<?php echo esc_url($wishlist['link']); ?>" title="<?php echo esc_attr($wishlist['text']); ?>" rel="nofollow" data-book-title="<?php echo esc_attr(get_the_title(get_the_ID())); ?>" data-book-id="<?php echo esc_attr(get_the_ID()); ?>">
                    <i class="<?php echo esc_attr($wishlist['icon_class']); ?>"></i><span><?php echo esc_html($wishlist['text']); ?></span>
                </a>
            <?php endif;
        }

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


$widgets_manager->register(new Havezic_BABE_Elementor_Item_Wishlist_Widget());
