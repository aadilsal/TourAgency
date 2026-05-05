<?php

use Elementor\Controls_Manager;

/**
 * Add widget all-items to Elementor
 *
 * @since   1.3.13
 */
class Havezic_BABE_Elementor_Itemslideshow_Widget extends Havezic_Base_Widgets_Swiper {

    /**
     * Get widget name.
     *
     * @return string Widget name.
     */
    public function get_name() {
        return 'babe-item-slideshow';
    }

    /**
     * Get widget title.
     *
     * @return string Widget title.
     */
    public function get_title() {
        return esc_html__('Detail slideshow', 'havezic');
    }

    /**
     * Get widget icon.
     *
     * @return string Widget icon.
     */
    public function get_icon() {
        return 'eicon-slides';
    }

    /**
     * Get widget keywords.
     *
     * Retrieve the list of keywords the widget belongs to.
     *
     * @return array Widget keywords.
     */
    public function get_keywords() {
        return ['slideshow'];
    }

    /**
     * Get widget categories.
     *
     * @return array Widget categories.
     */
    public function get_categories() {
        return ['book-everything-elements'];
    }

    public function get_style_depends() {
        return ['magnific-popup'];
    }

    public function get_script_depends() {
        return ['havezic-ba-slideshow.js', 'havezic-elementor-swiper', 'magnific-popup'];
    }

    /**
     * Register widget controls.
     *
     * Adds different input fields to allow the user to change and customize the widget settings.
     */
    protected function register_controls() {

        $this->start_controls_section(
            'section_general',
            [
                'label' => esc_html__('General', 'havezic'),
                'tab'   => Elementor\Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_responsive_control(
            'column',
            [
                'label'           => esc_html__('Columns', 'havezic'),
                'type'            => \Elementor\Controls_Manager::SELECT,
                'desktop_default' => 2,
                'tablet_default'  => 2,
                'mobile_default'  => 1,
                'options'         => [1 => 1, 2 => 2, 3 => 3, 4 => 4],
                'selectors'       => [
                    '{{WRAPPER}} .d-grid' => 'grid-template-columns: repeat({{VALUE}}, 1fr)',
                ],
                'condition'       => [
                    'enable_carousel!' => 'yes',
                ]

            ]
        );

        $this->add_responsive_control(
            'item_spacing',
            [
                'label'      => esc_html__('Spacing', 'havezic'),
                'type'       => \Elementor\Controls_Manager::SLIDER,
                'range'      => [
                    'px' => [
                        'min' => 0,
                        'max' => 100,
                    ],
                ],
                'default'    => [
                    'size' => 30
                ],
                'size_units' => ['px', 'em'],
                'selectors'  => [
                    '{{WRAPPER}} .d-grid' => 'grid-gap:{{SIZE}}{{UNIT}}',
                ],
                'condition'  => [
                    'enable_carousel!' => 'yes',
                ]
            ]
        );

        $this->add_control(
            'enable_carousel',
            [
                'label' => esc_html__('Enable Carousel', 'havezic'),
                'type'  => Controls_Manager::SWITCHER,
            ]
        );

        $this->end_controls_section();

        $this->add_control_carousel(['enable_carousel' => 'yes']);
    }

    /**
     * Render widget output on the frontend.
     * Written in PHP and used to generate the final HTML.
     */
    protected function render() {
        $settings = $this->get_settings_for_display();
        if (\Elementor\Plugin::instance()->editor->is_edit_mode()) {
            $post_id = havezic_ba_get_default_single_id();
        } else {
            $post_id = get_the_ID();
        }
        $booking_post = get_post($post_id);
        $this->add_render_attribute('wrapper', 'class', 'elementor-item-slideshow-wrapper');
        $this->get_data_elementor_columns();
        $videolink = '';
        if (is_single() && $booking_post->post_type == BABE_Post_types::$booking_obj_post_type) {
            $babe_post     = BABE_Post_types::get_post($booking_post->ID);
            $gallery_items = isset($babe_post['images']) ? $babe_post['images'] : array();
            $videolink     = isset($babe_post['havezic_video_link']) ? $babe_post['havezic_video_link'] : false;
        }
        ?>
        <div <?php $this->print_render_attribute_string('wrapper'); ?>>
            <div <?php $this->print_render_attribute_string('row'); ?>>
                <?php
                if (isset($gallery_items) && !empty($gallery_items)) {
                    foreach ($gallery_items as $key => $gallery) {
                        $gallery['url'] = $gallery['image'];
                        $link_key       = 'link_' . $key;
                        $this->add_link_attributes($link_key, $gallery);
                        $this->add_lightbox_data_attributes($link_key, $gallery['image_id'], 'yes', $this->get_id());
                        ?>
                        <div <?php $this->print_render_attribute_string('item'); ?>>
                            <a <?php $this->print_render_attribute_string($link_key); ?>>
                                <?php echo wp_get_attachment_image($gallery['image_id'], 'large'); ?>
                            </a>
                        </div>
                    <?php }
                } ?>
            </div>
        </div>
        <?php

        if ($videolink) { ?>
            <a class="ba-item-play-video" href="<?php echo esc_url($videolink); ?>">
                <i class="havezic-icon-video-recorder"></i>
                <span><?php esc_html_e('Play Video', 'havezic') ?></span>
            </a>
        <?php }
        $this->render_swiper_pagination_navigation();
    }

}

$widgets_manager->register(new Havezic_BABE_Elementor_Itemslideshow_Widget());