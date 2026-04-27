<?php

use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;
use Elementor\Core\Kits\Documents\Tabs\Global_Typography;

class Havezic_BABE_Elementor_Taxonomies_Widget extends Havezic_Base_Widgets_Swiper {
    /**
     * Get widget name.
     *
     * @return string Widget name.
     */
    public function get_name() {
        return 'babe-taxonomies';
    }

    /**
     * Get widget title.
     *
     * @return string Widget title.
     */
    public function get_title() {
        return esc_html__('Ba Taxonomies', 'havezic');
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
     * Get widget categories.
     *
     * @return array Widget categories.
     */
    public function get_categories() {
        return ['book-everything-elements'];
    }

    public function get_script_depends() {
        return ['havezic-ba-taxonomies.js', 'havezic-elementor-swiper'];
    }

    /**
     * Register widget controls.
     *
     * Adds different input fields to allow the user to change and customize the widget settings.
     */
    protected function register_controls() {

        // Get all terms of categories

        $this->start_controls_section(
            'babe_taxonomies',
            array(
                'label' => esc_html__('Content', 'havezic'),
                'tab'   => \Elementor\Controls_Manager::TAB_CONTENT,
            )
        );

        $this->add_control(
            'taxonomy_slug',
            array(
                'label'       => esc_html__('Ba Taxonomies', 'havezic'),
                'type'        => \Elementor\Controls_Manager::SELECT,
                'multiple'    => true,
                'options'     => $this->get_taxonomies_arr(),
                'label_block' => true,
            )
        );

        $this->add_control(
            'enable_all_taxonomy',
            [
                'label' => esc_html__('Get all taxonomy', 'havezic'),
                'type'  => Controls_Manager::SWITCHER,
            ]
        );

        $this->render_setting_taxonomy();


        $this->add_control(
            'orderby',
            [
                'label'     => esc_html__('Order by', 'havezic'),
                'type'      => Controls_Manager::SELECT,
                'options'   => [
                    'id'    => esc_html__('ID', 'havezic'),
                    'count' => esc_html__('Count', 'havezic'),
                    'name'  => esc_html__('Name', 'havezic'),
                ],
                'default'   => 'name',
                'condition' => [
                    'enable_all_taxonomy!' => ''
                ],
            ]
        );

        $this->add_control(
            'order',
            [
                'label'     => esc_html__('Order', 'havezic'),
                'type'      => Controls_Manager::SELECT,
                'default'   => 'asc',
                'options'   => [
                    'asc'  => esc_html__('ASC', 'havezic'),
                    'desc' => esc_html__('DESC', 'havezic'),
                ],
                'condition' => [
                    'enable_all_taxonomy!' => ''
                ],
            ]
        );


        $this->add_control(
            'hide_empty',
            [
                'label'     => esc_html__('Hide Empty', 'havezic'),
                'type'      => Controls_Manager::SWITCHER,
                'condition' => [
                    'enable_all_taxonomy!' => ''
                ],
            ]
        );

        $this->add_control(
            'per_page',
            array(
                'label'       => esc_html__('Per Page', 'havezic'),
                'description' => esc_html__('How much items per page to show (-1 to show all items)', 'havezic'),
                'type'        => \Elementor\Controls_Manager::TEXT,
                'input_type'  => 'text',
                'placeholder' => '',
                'default'     => '6',
                'condition'   => [
                    'enable_all_taxonomy!' => ''
                ],
            )
        );

        $this->add_control(
            'style',
            [
                'label'        => esc_html__('Style', 'havezic'),
                'type'         => \Elementor\Controls_Manager::SELECT,
                'default'      => 1,
                'options'      => [
                    1 => esc_html__('Style 1', 'havezic'),
                    2 => esc_html__('Style 2', 'havezic'),
                ],
                'prefix_class' => 'elementor-ba-taxonomies-style-'
            ]
        );

        $this->add_control(
            'layout_special',
            array(
                'label'        => esc_html__('Layout Masonry', 'havezic'),
                'type'         => \Elementor\Controls_Manager::SWITCHER,
                'prefix_class' => 'layout-special-',
                'conditions'   => [
                    'relation' => 'and',
                    'terms'    => [
                        [
                            'name'     => 'style',
                            'operator' => '==',
                            'value'    => 2,
                        ],
                        [
                            'name'     => 'enable_carousel',
                            'operator' => '!==',
                            'value'    => 'yes',
                        ],
                    ],
                ]
            )
        );

        $this->add_responsive_control(
            'item_height',
            [
                'label'      => esc_html__('Height Item', 'havezic'),
                'type'       => Controls_Manager::SLIDER,
                'range'      => [
                    'px' => [
                        'min' => 0,
                        'max' => 1000,
                    ],
                ],
                'size_units' => ['px'],
                'selectors'  => [
                    '{{WRAPPER}} .ba-tax-inner .thumbnail-tax' => 'height: {{SIZE}}{{UNIT}};',
                ],
                'conditions' => [
                    'relation' => 'and',
                    'terms'    => [
                        [
                            'name'     => 'style',
                            'operator' => '==',
                            'value'    => 2,
                        ],
                        [
                            'name'     => 'layout_special',
                            'operator' => '!==',
                            'value'    => 'yes',
                        ],
                    ],
                ]
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
                'options'         => [1 => 1, 2 => 2, 3 => 3, 4 => 4, 5 => 5, 6 => 6],
                'selectors'       => [
                    '{{WRAPPER}} .d-grid' => 'grid-template-columns: repeat({{VALUE}}, 1fr)',
                ],
                'conditions'      => [
                    'relation' => 'and',
                    'terms'    => [
                        [
                            'name'     => 'layout_special',
                            'operator' => '!==',
                            'value'    => 'yes',
                        ],
                        [
                            'name'     => 'enable_carousel',
                            'operator' => '!==',
                            'value'    => 'yes',
                        ],
                    ],
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

        $this->start_controls_section(
            'tax_title_style',
            [
                'label' => esc_html__( 'Title', 'havezic' ),
                'tab'   => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name'     => 'title_tax_typography',
                'global'   => [
                    'default' => Global_Typography::TYPOGRAPHY_TEXT,
                ],
                'selector' => '{{WRAPPER}} .tax-name',
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

        $settings = $this->get_settings_for_display();
        $this->add_render_attribute('wrapper', 'class', 'elementor-ba-taxonomies-wrapper');
        $this->get_data_elementor_columns();

        ?>
        <div <?php $this->print_render_attribute_string('wrapper'); ?>>
            <div <?php $this->print_render_attribute_string('row'); ?>>
                <?php
                if (!empty($settings['taxonomy_slug'])) {

                    $default_lang = BABE_Functions::get_default_language();
                    $current_lang = BABE_Functions::get_current_language();
                    if (BABE_Functions::is_wpml_active() && $current_lang !== $default_lang) {
                        do_action('wpml_switch_language', $default_lang);
                        $taxonomy = get_term_by('slug', $settings['taxonomy_slug'], BABE_Post_types::$taxonomies_list_tax);
                        do_action('wpml_switch_language', $current_lang);
                    } else {
                        $taxonomy = get_term_by('slug', $settings['taxonomy_slug'], BABE_Post_types::$taxonomies_list_tax);
                    }

                    if (!is_wp_error($taxonomy) && !empty($taxonomy)) {

                        if (empty($settings[$settings['taxonomy_slug'] . '_ids']) || $settings['enable_all_taxonomy']) {
                            $taxonomies = get_terms(array(
                                'taxonomy'   => BABE_Post_types::$attr_tax_pref . $taxonomy->slug,
                                'hide_empty' => $settings['hide_empty'] == 'yes' ? true : false,
                                'number'     => $settings['per_page'],
                                'orderby'    => $settings['orderby'] ?? 'name',
                                'order'      => $settings['order'] ?? 'ASC',
                            ));

                            if (!is_wp_error($taxonomies) && !empty($taxonomies)) {
                                foreach ($taxonomies as $taxonomy) {
                                    $this->render_taxonomy_item($taxonomy);
                                }
                            }
                        } else {
                            $taxonomies = $settings[$settings['taxonomy_slug'] . '_ids'];
                            foreach ($taxonomies as $taxonomy) {
                                $default_lang = BABE_Functions::get_default_language();
                                $current_lang = BABE_Functions::get_current_language();
                                if (BABE_Functions::is_wpml_active() && $current_lang !== $default_lang) {
                                    do_action('wpml_switch_language', $default_lang);
                                    $tax = get_term_by('slug', $taxonomy, BABE_Post_types::$attr_tax_pref . $settings['taxonomy_slug']);
                                    do_action('wpml_switch_language', $current_lang);
                                } else {
                                    $tax = get_term_by('slug', $taxonomy, BABE_Post_types::$attr_tax_pref . $settings['taxonomy_slug']);
                                }

                                if (!is_wp_error($tax) && !empty($tax)) {
                                    $this->render_taxonomy_item($tax);
                                }
                            }
                        }
                    }
                }
                ?>
            </div>
        </div>
        <?php
        $this->render_swiper_pagination_navigation();

    }

    public function render_taxonomy_item($taxonomy) {
        $settings  = $this->get_settings_for_display();
        $image_tax = get_term_meta($taxonomy->term_id, 'havezic_tax_image', true);
        if (empty($image_tax)) {
            $image_tax = Elementor\Utils::get_placeholder_image_src();
        }
        $count = $this->count_posts_in_term_with_children(BABE_Post_types::$attr_tax_pref . $settings['taxonomy_slug'], $taxonomy->term_id);
        ?>
        <div <?php $this->print_render_attribute_string('item'); ?>>
            <div class="ba-tax-inner">

                <div class="thumbnail-tax">
                    <a href="<?php echo esc_url(get_term_link($taxonomy->slug, $taxonomy->taxonomy)); ?>">
                        <img src="<?php echo esc_url($image_tax); ?>" alt="<?php echo esc_attr($taxonomy->name); ?>">
                    </a>
                </div>
                <div class="content-tax">
                    <span class="tax-count"><?php echo esc_html($count) . '&nbsp;' . esc_html(_n('Tour', 'Tours', $count, 'havezic')); ?></span>
                    <h6 class="tax-name">
                        <a href="<?php echo esc_url(get_term_link($taxonomy->slug, $taxonomy->taxonomy)); ?>"><?php echo esc_html($taxonomy->name); ?></a>
                    </h6>
                    <?php if ($settings['style'] == 1): ?>
                        <div class="tax-description"><?php echo esc_html($taxonomy->description); ?></div>
                        <a class="tax-link" href="<?php echo esc_url(get_term_link($taxonomy->slug, $taxonomy->taxonomy)); ?>">
                            <span class="elementor-button-icon left"><i class="havezic-icon-arrow-small-right"></i></span>
                            <span><?php echo esc_html__('View All Tours', 'havezic'); ?></span>
                            <span class="elementor-button-icon right"><i class="havezic-icon-arrow-small-right"></i></span>
                        </a>
                    <?php endif; ?>
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


    private function get_taxonomy_name($taxonomy_slug) {

        $taxonomy = get_term_by('slug', $taxonomy_slug, BABE_Post_types::$taxonomies_list_tax);
        if (!is_wp_error($taxonomy) && !empty($taxonomy)) {
            return BABE_Post_types::$attr_tax_pref . $taxonomy->slug;
        }
        return false;
    }

    private function render_setting_taxonomy() {
        $taxonomies = get_terms(array(
            'taxonomy'   => BABE_Post_types::$taxonomies_list_tax,
            'hide_empty' => false
        ));

        if (!is_wp_error($taxonomies) && !empty($taxonomies)) {
            foreach ($taxonomies as $tax_term) {
                $this->add_control(
                    $tax_term->slug . '_ids',
                    array(
                        'label'       => esc_html__('Ba ', 'havezic') . $tax_term->name,
                        'type'        => \Elementor\Controls_Manager::SELECT2,
                        'multiple'    => true,
                        'options'     => $this->get_taxonomy_arr($this->get_taxonomy_name($tax_term->slug)),
                        'label_block' => true,
                        'condition'   => [
                            'taxonomy_slug'        => $tax_term->slug,
                            '!enable_all_taxonomy' => ''
                        ],
                    )
                );
            }
        }
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

$widgets_manager->register(new Havezic_BABE_Elementor_Taxonomies_Widget());