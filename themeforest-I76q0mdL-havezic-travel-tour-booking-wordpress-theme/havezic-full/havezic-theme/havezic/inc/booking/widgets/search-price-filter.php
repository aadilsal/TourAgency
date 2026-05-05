<?php

/**
 * Add widget all-items to Elementor
 *
 * @since   1.3.13
 */
class Havezic_BABE_Elementor_PriceFilter_Widget extends \Elementor\Widget_Base
{

    public function __construct($data = [], $args = null)
    {
        parent::__construct($data, $args);

        wp_enqueue_script('jquery-ui-slider');
        wp_register_script('babe-price-slider', plugins_url("js/babe-price-slider.js", BABE_PLUGIN), array('jquery-ui-slider'), '1.0', true);
        wp_localize_script('babe-price-slider', 'babe_price_slider', array(
            'currency_symbol' => BABE_Currency::get_currency_symbol(),
            'currency_pos' => BABE_Currency::get_currency_place(),
            'min_price' => isset($_GET['min_price']) ? esc_attr($_GET['min_price']) : 0,
            'max_price' => isset($_GET['max_price']) ? esc_attr($_GET['max_price']) : ''
        ));
    }

    /**
     * Get widget name.
     *
     * @return string Widget name.
     */
    public function get_name()
    {
        return 'babe-price-filter';
    }

    /**
     * Get widget title.
     *
     * @return string Widget title.
     */
    public function get_title()
    {
        return esc_html__('Price Filter', 'havezic');
    }

    /**
     * Get widget icon.
     *
     * @return string Widget icon.
     */
    public function get_icon()
    {
        return 'eicon-site-search';
    }

    /**
     * Get widget keywords.
     *
     * Retrieve the list of keywords the widget belongs to.
     *
     * @return array Widget keywords.
     */
    public function get_keywords()
    {
        return ['filter', 'price', 'search', 'search filter', 'book everything'];
    }

    /**
     * Get widget categories.
     *
     * @return array Widget categories.
     */
    public function get_categories()
    {
        return ['book-everything-elements'];
    }

    public function get_script_depends()
    {
        return ['babe-price-slider'];
    }


    protected function register_controls()
    {

    }


    /**
     * Render widget output on the frontend.
     *
     * Written in PHP and used to generate the final HTML.
     *
     */
    protected function render()
    {

        wp_localize_script('babe-price-slider', 'babe_price_slider', array(
            'currency_symbol' => BABE_Currency::get_currency_symbol(),
            'currency_pos' => BABE_Currency::get_currency_place(),
            'min_price' => isset($_GET['min_price']) ? esc_attr($_GET['min_price']) : '',
            'max_price' => isset($_GET['max_price']) ? esc_attr($_GET['max_price']) : ''
        ));

        $min_price = (int)BABE_Post_types::get_posts_range_price($_GET, 'min');
        $max_price = (int)BABE_Post_types::get_posts_range_price($_GET, 'max');

        ?>


        <div class="widget-babe-price-slider">
            <div class="babe_price_slider_label">
                <label><?php echo esc_html__('Price:', 'havezic') ?></label>
                <input type="text" id="babe_range_price" readonly data-min="<?php echo esc_attr($min_price); ?>"
                       data-max="<?php echo esc_attr($max_price); ?>">
            </div>
            <div class="babe_price_slider"></div>
        </div>
        <?php
    }
}

$widgets_manager->register(new Havezic_BABE_Elementor_PriceFilter_Widget());