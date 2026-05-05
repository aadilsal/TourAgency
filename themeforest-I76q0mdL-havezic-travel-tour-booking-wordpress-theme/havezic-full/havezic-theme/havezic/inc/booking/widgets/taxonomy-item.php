<?php

use Elementor\Controls_Manager;
use Elementor\Core\Kits\Documents\Tabs\Global_Typography;
use Elementor\Group_Control_Typography;
use Elementor\Group_Control_Border;

class Havezic_BABE_Elementor_TaxonomyItem_Widget extends \Elementor\Widget_Base {
    /**
     * Get widget name.
     *
     * @return string Widget name.
     */
    public function get_name() {
        return 'taxonomy-item';
    }

    /**
     * Get widget title.
     *
     * @return string Widget title.
     */
    public function get_title() {
        return esc_html__('Ba Taxonomy Item', 'havezic');

    }

    /**
     * Get widget icon.
     *
     * @return string Widget icon.
     */
    public function get_icon() {
        return 'eicon-post-info';
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

        // Get all terms of categories
        $this->start_controls_section(
            'babe_taxonomy_item',
            [
                'label' => esc_html__('Content', 'havezic'),
                'tab'   => \Elementor\Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'taxonomy_slug',
            [
                'label' => esc_html__('Ba Taxonomies', 'havezic'),

                'type'        => \Elementor\Controls_Manager::SELECT,
                'options'     => $this->get_taxonomies_arr(),
                'label_block' => true,
            ]
        );

        $this->render_setting_taxonomy();

        $this->add_control(
            'image',
            [
                'label'      => esc_html__('Choose Image', 'havezic'),
                'default'    => [
                    'url' => Elementor\Utils::get_placeholder_image_src(),
                ],
                'type'       => \Elementor\Controls_Manager::MEDIA,
                'show_label' => false,
            ]
        );

        $this->add_responsive_control(
            'image_position',
            [
                'label'        => esc_html__('Position', 'havezic'),
                'type'         => Controls_Manager::CHOOSE,
                'options'      => [
                    'left'  => [
                        'title' => esc_html__('Left', 'havezic'),
                        'icon'  => 'eicon-h-align-left',
                    ],
                    'above' => [
                        'title' => esc_html__('Above', 'havezic'),
                        'icon'  => 'eicon-v-align-top',
                    ],
                    'right' => [
                        'title' => esc_html__('Right', 'havezic'),
                        'icon'  => 'eicon-h-align-right',
                    ],
                ],
                'default'      => 'above',
                'prefix_class' => 'elementor-tax-%s-layout-image-',
            ]
        );

        $this->add_control(
            'sub_title',
            [
                'label' => esc_html__('Sub Title', 'havezic'),
                'type'  => \Elementor\Controls_Manager::TEXT,
            ]
        );

        $this->add_control(
            'enable_text',
            [
                'label' => esc_html__('Enable Custom Text', 'havezic'),
                'type'  => \Elementor\Controls_Manager::SWITCHER,
            ]
        );

        $this->add_control(
            'custom_text',
            [
                'label'     => esc_html__('Custom Text', 'havezic'),
                'type'      => \Elementor\Controls_Manager::TEXT,
                'default'   => ' - From <strong>100$</strong>',
                'condition' => [
                    'enable_text!' => '',
                ],
            ]
        );

        $this->end_controls_section();

        $this->start_controls_section(
            'item_style',
            [
                'label' => esc_html__('Item', 'havezic'),
                'tab'   => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_responsive_control(
            'wrapper_padding',
            [
                'label'      => esc_html__('Padding', 'havezic'),
                'type'       => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'custom'],
                'selectors'  => [
                    '{{WRAPPER}} .tax-item' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}}',
                ],
            ]
        );

        $this->add_responsive_control(
            'border_radius',
            [
                'label'      => esc_html__('Border Radius', 'havezic'),
                'type'       => Controls_Manager::DIMENSIONS,
                'size_units' => ['px'],
                'selectors'  => [
                    '{{WRAPPER}} .tax-item' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}}',
                ],
            ]
        );

        $this->end_controls_section();

        $this->start_controls_section(
            'image_style',
            [
                'label' => esc_html__('Image', 'havezic'),
                'tab'   => \Elementor\Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_responsive_control(
            'image_margin',
            [
                'label'      => esc_html__('Margin', 'havezic'),
                'type'       => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'custom'],
                'selectors'  => [
                    '{{WRAPPER}} .thumbnail-tax' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}}',
                ],
            ]
        );

        $this->end_controls_section();

        $this->start_controls_section(
            'content_style',
            [
                'label' => esc_html__('Content', 'havezic'),
                'tab'   => \Elementor\Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'tax_subtitle',
            [
                'label'     => esc_html__('SubTitle', 'havezic'),
                'type'      => Controls_Manager::HEADING,
                'separator' => 'before',
                'condition' => [
                    'sub_title!' => '',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name'      => 'tax_subtitle_typography',
                'global'    => [
                    'default' => Global_Typography::TYPOGRAPHY_TEXT,
                ],
                'selector'  => '{{WRAPPER}} .sub-title',
                'condition' => [
                    'sub_title!' => '',
                ],
            ]
        );

        $this->add_responsive_control(
            'subtitle_spacing',
            [
                'label'      => esc_html__('Spacing', 'havezic'),
                'type'       => Controls_Manager::SLIDER,
                'size_units' => ['px', 'custom'],
                'selectors'  => [
                    '{{WRAPPER}} .sub-title' => 'margin-bottom: {{SIZE}}{{UNIT}};',
                ],
                'condition'  => [
                    'sub_title!' => '',
                ],
            ]
        );

        $this->add_control(
            'tax_title',
            [
                'label'     => esc_html__('Title', 'havezic'),
                'type'      => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name'     => 'tax_title_typography',
                'global'   => [
                    'default' => Global_Typography::TYPOGRAPHY_TEXT,
                ],
                'selector' => '{{WRAPPER}} .title',
            ]
        );

        $this->add_responsive_control(
            'title_spacing',
            [
                'label'      => esc_html__('Spacing', 'havezic'),
                'type'       => Controls_Manager::SLIDER,
                'size_units' => ['px', 'custom'],
                'selectors'  => [
                    '{{WRAPPER}} .title' => 'margin-bottom: {{SIZE}}{{UNIT}};',
                ],
            ]
        );


        $this->end_controls_section();
    }


    /**
     * Render widget output on the frontend.
     *
     * Written in PHP and used to generate the final HTML.
     *
     */
    protected function render() {

        $settings = $this->get_settings_for_display();

        if (empty($taxonomy_id = $settings[$settings['taxonomy_slug'] . '_id'])) {
            return;
        }

        $this->add_render_attribute('wrapper', 'class', 'elementor-tax-wrapper havezic-tax-item');

        echo '<div ' . $this->get_render_attribute_string('wrapper') . '>';

        $taxonomy = get_term_by('slug', $taxonomy_id, $this->get_taxonomy_name($settings['taxonomy_slug']));
        if (!is_wp_error($taxonomy) && !empty($taxonomy)) {
            $this->render_taxonomy_item($taxonomy);
        }
        echo '</div>';

    }

    public function render_taxonomy_item($taxonomy) { ?>
        <?php $settings = $this->get_settings_for_display(); ?>
        <?php

        if (!empty($settings['image']['url'])) {
            $image_tax = $settings['image']['url'];
        } elseif (empty($image_tax = get_term_meta($taxonomy->term_id, 'havezic_tax_image', true))) {
            $image_tax = Elementor\Utils::get_placeholder_image_src();
        }
        $count = $this->count_posts_in_term_with_children(BABE_Post_types::$attr_tax_pref . $settings['taxonomy_slug'], $taxonomy->term_id)
        ?>
        <div class="tax-item">
            <a class="link-wrapper" href="<?php echo esc_url(get_term_link($taxonomy->slug, $this->get_taxonomy_name($settings['taxonomy_slug']))); ?>"></a>
            <div class="thumbnail-tax">
                <img src="<?php echo esc_url($image_tax); ?>" alt="<?php echo esc_attr($taxonomy->name); ?>">
            </div>
            <div class="content-tax">
                <div class="sub-title"><?php echo esc_html($settings['sub_title']); ?></div>
                <h6 class="title"><?php echo esc_html($taxonomy->name); ?></h6>
                <div class="taxonomy-infor">
                    <span class="tax-count"><?php echo esc_html($count) . '&nbsp;' . esc_html(_n('Tour', 'Tours', $count, 'havezic')); ?></span>
                    <?php if ($settings['enable_text']):
                        printf('<span class="tax-count">%s</span>', $settings['custom_text']);
                    endif; ?>
                </div>
                <div class="tax-button elementor-button-typo-link">
                    <a class="elementor-button" href="<?php echo esc_url(get_term_link($taxonomy->slug, $this->get_taxonomy_name($settings['taxonomy_slug']))); ?>">
                            <span class="elementor-button-content-wrapper">
                                <span class="elementor-button-icon left"><i aria-hidden="true" class="havezic-icon- havezic-icon-arrow-small-right"></i></span>
                                <span class="elementor-button-text"><?php echo esc_html__('View all tours', 'havezic'); ?></span>
                                <span class="elementor-button-icon right"><i aria-hidden="true" class="havezic-icon- havezic-icon-arrow-small-right"></i></span>
                            </span>
                    </a>
                </div>
            </div>

        </div>
        <?php
    }


    public static function get_taxonomies_arr() {
        $output = array();

        $taxonomies = get_terms(array(
            'taxonomy'   => BABE_Post_types::$taxonomies_list_tax,
            'hide_empty' => false
        ));

        if (!is_wp_error($taxonomies) && !empty($taxonomies)) {
            foreach ($taxonomies as $tax_term) {
                $output[$tax_term->slug] = apply_filters('translate_text', $tax_term->name);
            }
        }

        return $output;

    }

    private function render_setting_taxonomy() {
        $taxonomies = get_terms(array(
            'taxonomy'   => BABE_Post_types::$taxonomies_list_tax,
            'hide_empty' => false
        ));

        if (!is_wp_error($taxonomies) && !empty($taxonomies)) {
            foreach ($taxonomies as $tax_term) {
                $this->add_control(
                    $tax_term->slug . '_id',
                    array(
                        'label'       => esc_html__('Ba ', 'havezic') . $tax_term->name,
                        'type'        => \Elementor\Controls_Manager::SELECT2,
                        'multiple'    => false,
                        'options'     => $this->get_taxonomy_arr($this->get_taxonomy_name($tax_term->slug)),
                        'label_block' => true,
                        'condition'   => [
                            'taxonomy_slug' => $tax_term->slug,
                        ],
                    )
                );
            }
        }
    }

    private function get_taxonomy_name($taxonomy_slug) {

        $default_lang = BABE_Functions::get_default_language();
        $current_lang = BABE_Functions::get_current_language();
        if (BABE_Functions::is_wpml_active() && $current_lang !== $default_lang) {
            do_action('wpml_switch_language', $default_lang);
            $taxonomy = get_term_by('slug', $taxonomy_slug, BABE_Post_types::$taxonomies_list_tax);
            do_action('wpml_switch_language', $current_lang);
        } else {
            $taxonomy = get_term_by('slug', $taxonomy_slug, BABE_Post_types::$taxonomies_list_tax);
        }

        if (!is_wp_error($taxonomy) && !empty($taxonomy)) {
            return BABE_Post_types::$attr_tax_pref . $taxonomy->slug;
        }
        return false;
    }

    public static function get_taxonomy_arr($taxonomy_name) {
        $output = array();

        $taxonomies = get_terms(array(
            'taxonomy'   => $taxonomy_name,
            'hide_empty' => false
        ));

        if (!is_wp_error($taxonomies) && !empty($taxonomies)) {
            foreach ($taxonomies as $tax_term) {
                $output[$tax_term->slug] = apply_filters('translate_text', $tax_term->name);
            }
        }

        return $output;
    }

    public function count_posts_in_term_with_children($taxonomy, $term_id) {

        $posts = get_posts([
            'post_type'      => 'to_book',
            'tax_query'      => [
                [
                    'taxonomy'         => $taxonomy,
                    'field'            => 'term_id',
                    'terms'            => $term_id,
                    'include_children' => true,
                    'operator'         => 'IN',
                    'post_status'      => array('publish')
                ],
            ],
            'posts_per_page' => -1,
            'fields'         => 'ids',
        ]);


        return count($posts);
    }

}

$widgets_manager->register(new Havezic_BABE_Elementor_TaxonomyItem_Widget());
