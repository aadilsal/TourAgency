<?php

use Elementor\Controls_Manager;

/**
 * Add widget all-items to Elementor
 *
 * @since   1.3.13
 */
class Havezic_Elementor_BA_Archive_Booking_Gallery extends Havezic_Base_Widgets_Swiper {
    /**
     * Get widget name.
     *
     * @return string Widget name.
     */
    public function get_name() {
        return 'babe-archive-gallery-image';
    }

    /**
     * Get widget title.
     *
     * @return string Widget title.
     */
    public function get_title() {
        return esc_html__('BA Archive Gallery Image', 'havezic');
    }

    /**
     * Get widget icon.
     *
     * @return string Widget icon.
     */
    public function get_icon() {
        return 'eicon-archive-posts';
    }

    /**
     * Get widget keywords.
     *
     * Retrieve the list of keywords the widget belongs to.
     *
     * @return array Widget keywords.
     */
    public function get_keywords() {
        return ['Booking', 'Archive', 'Gallery Image', 'Archive Gallery'];
    }

    /**
     * Get widget categories.
     *
     * @return array Widget categories.
     */
    public function get_categories() {
        return ['book-everything-elements'];
    }

    public function get_script_depends() {
        return ['havezic-ba-archive-booking-gallery.js','havezic-elementor-swiper'];
    }

    protected function register_controls() {
        $this->start_controls_section(
            'section_gallery',
            [
                'label' => esc_html__('Image Gallery', 'havezic'),
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
     *
     * Written in PHP and used to generate the final HTML.
     *
     */
    protected function render() {

        if (\Elementor\Plugin::instance()->editor->is_edit_mode()) {
            $taxonomy_ID = 26;
            $this->render_taxonomy_content($taxonomy_ID);

        } else {
            $object = get_queried_object();
            if (!empty($object) && (isset($object->taxonomy) && Havezic_BA_Booking::check_taxonomy($object->taxonomy))) {
                $this->render_taxonomy_content($object->term_id);
            }

        }

    }

    private function render_taxonomy_content($tax_ID) {
        $settings = $this->get_settings_for_display();
        $this->get_data_elementor_columns();
        $term_data = get_term_meta($tax_ID, 'havezic_tax_gallery_image', true);
        $this->add_render_attribute('link', 'data-elementor-lightbox-slideshow', $this->get_id());
        $this->add_render_attribute('wrapper', 'class', 'elementor-tax-gallery-image');
        if ($term_data && !empty($term_data)) { ?>
            <div <?php $this->print_render_attribute_string('wrapper'); ?>>
                <div <?php $this->print_render_attribute_string('row'); ?>>
                    <?php foreach ($term_data as $attachment_id => $attachment_url) { ?>
                        <div <?php $this->print_render_attribute_string('item'); ?>>
                            <a data-elementor-open-lightbox="yes" <?php $this->print_render_attribute_string('link'); ?>
                               href="<?php echo esc_url($attachment_url); ?>">
                                <?php echo wp_get_attachment_image($attachment_id, 'full'); ?>
                            </a>
                        </div>
                    <?php } ?>
                </div>
            </div>
            <?php
            $this->render_swiper_pagination_navigation();
        }
    }
}

$widgets_manager->register(new Havezic_Elementor_BA_Archive_Booking_Gallery());