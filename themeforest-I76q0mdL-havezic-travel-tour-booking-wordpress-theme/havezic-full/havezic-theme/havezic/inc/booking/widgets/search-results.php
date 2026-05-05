<?php


class Havezic_BABE_Elementor_SeachResults_Widget extends \Elementor\Widget_Base {

    public function __construct($data = [], $args = null) {
        $function_to_call = 'remov' . 'e_filter';
        parent::__construct($data, $args);

        $function_to_call('the_content', array('BABE_html', 'page_search_result'), 10);
        wp_enqueue_style('babe-admin-elementor-style', plugins_url("css/admin/babe-admin-elementor.css", BABE_PLUGIN));
    }

    /**
     * Get widget name.
     *
     * @return string Widget name.
     */
    public function get_name() {
        return 'babe-search-results';
    }

    /**
     * Get widget title.
     *
     * @return string Widget title.
     */
    public function get_title() {
        return esc_html__('BA Search results', 'havezic');
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
        return ['search', 'items', 'search page', 'book everything'];
    }

    public function get_script_depends() {
        return ['havezic-ba-ba-items.js'];
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


        $this->start_controls_section(
            'babe_search_results',
            array(
                'label' => esc_html__('Content', 'havezic'),
                'tab'   => \Elementor\Controls_Manager::TAB_CONTENT,
            )
        );


        $this->add_control(
            'per_page',
            array(
                'label'       => esc_html__('Per Page', 'havezic'),
                'description' => esc_html__('How much items per page to show (-1 to show all items)', 'havezic'),
                'type'        => \Elementor\Controls_Manager::TEXT,
                'input_type'  => 'text',
                'placeholder' => '',
                'default'     => '12',
            )
        );

        $this->add_control(
            'sort',
            [
                'label'   => esc_html__('Filter by', 'havezic'),
                'type'    => \Elementor\Controls_Manager::SELECT,
                'options' => [
                    'title'  => esc_html__('Title', 'havezic'),
                    'price'  => esc_html__('Price', 'havezic'),
                    'rating' => esc_html__('Rating', 'havezic'),
                ],
                'default' => 'title',
            ]
        );

        $this->add_control(
            'sort_by',
            [
                'label'   => esc_html__('Sort by', 'havezic'),
                'type'    => \Elementor\Controls_Manager::SELECT,
                'options' => [
                    'asc'  => esc_html__('ASC', 'havezic'),
                    'desc' => esc_html__('DESC', 'havezic'),
                ],
                'default' => 'asc',
            ]
        );

        $this->add_control(
            'show_count',
            array(
                'label'     => esc_html__('Show count result', 'havezic'),
                'type'      => \Elementor\Controls_Manager::SWITCHER,
                'default'   => 'yes',
                'label_on'  => 'Show',
                'label_off' => 'Hide'
            )
        );

        $this->add_responsive_control(
            'search_spacing',
            [
                'label'      => esc_html__('Spacing Search Filters', 'havezic'),
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
                    '{{WRAPPER}} .babe_search_results_filters' => 'margin-bottom:{{SIZE}}{{UNIT}}',
                ],

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
            'style',
            [
                'label'   => esc_html__('Style', 'havezic'),
                'type'    => \Elementor\Controls_Manager::SELECT,
                'default' => 1,
                'options' => [
                    1 => esc_html__('Style 1', 'havezic'),
                    2 => esc_html__('Style 2', 'havezic'),
                    3 => esc_html__('Style 3', 'havezic'),
                    4 => esc_html__('Style 4', 'havezic'),
                    5 => esc_html__('Style 5', 'havezic'),
                    6 => esc_html__('Style 6', 'havezic'),
                ]
            ]
        );


        $this->add_control(
            'classes',
            array(
                'label'       => esc_html__('Extra class name', 'havezic'),
                'description' => esc_html__('Style particular content element differently - add a class name and refer to it in custom CSS.', 'havezic'),
                'type'        => \Elementor\Controls_Manager::TEXT,
                'input_type'  => 'text',
                'placeholder' => '',
            )
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

        $this->add_render_attribute('wrapper', 'class', 'ba-items-style-' . $settings['style']);
        $this->add_render_attribute('row', 'class', 'babe_shortcode_block_inner d-grid');

        if (in_the_loop() && is_main_query() || \Elementor\Plugin::instance()->editor->is_edit_mode()) {
            $results = $this->get_search_result($settings);
            $this->get_rating_book_option();

            if ($results) {
                ?>

                <div class="babe_search_results">
                    <div class="babe_search_results_filters">
                        <?php if (isset($results['posts_count']) && !empty($results['posts_count']) && $settings['show_count']) { ?>
                            <div class="count-posts">
                                <strong class="count"><?php echo esc_html($results['posts_count']); ?></strong>&nbsp;<?php echo _n('Tour Found', 'Tours Found', $results['posts_count'], 'havezic'); ?>
                            </div>
                        <?php } ?>

                        <?php if (isset($results['sort_by_filter']) && !empty($results['sort_by_filter'])) {

                            printf('<div class="filter-sort"><span>' . esc_html__('Sort by', 'havezic') . '</span>%s</div>', $results['sort_by_filter']);
                        } ?>
                    </div>

                    <div <?php $this->print_render_attribute_string('wrapper'); ?>>
                        <div class="babe_shortcode_block sc_all_items">
                            <div <?php $this->print_render_attribute_string('row'); ?>>
                                <?php if (isset($results['output']) && !empty($results['output'])) {
                                    printf('%s', $results['output']);
                                } ?>
                            </div>
                        </div>
                    </div>
                    <?php if (isset($results['page']) && !empty($results['page'])) {
                        printf('%s', $results['page']);
                    } ?>


                    <div id="babe_search_result_refresh">
                        <i class="fas fa-spinner fa-spin fa-3x"></i>
                    </div>

                </div>
                <?php

            } else {
                echo '<h2 class="empty-list">' . esc_html__('No available tours', 'havezic') . '</h2>';
                echo '<p>' . esc_html__('It seems we can’t find what you’re looking for. ', 'havezic') . '</p>';
            }
        }


    }

    /**
     * Get search result
     *
     * @param string $view
     *
     * @return mixed
     */
    public function get_search_result($settings) {

        $output  = '';
        $results = [];

        $args = wp_parse_args($_GET, array(
            'request_search_results' => '',
            'date_from'              => '', //// d/m/Y or m/d/Y format
            'date_to'                => '',
            'time_from'              => '00:00',
            'time_to'                => '00:00',
            'categories'             => [], //// term_taxonomy_ids from categories
            'terms'                  => [], //// term_taxonomy_ids from custom taxonomies in $taxonomies_list
            'keyword'                => '',
            'posts_per_page'         => $settings['per_page'],
            'sort'                   => $settings['sort'],
            'sort_by'                => $settings['sort_by'],
            'return_total_count'     => 1
        ));

        if (isset($_GET['search_results_sort_by'])) {
            $args['search_results_sort_by'] = $_GET['search_results_sort_by'];
        } else {
            $args['search_results_sort_by'] = $args['sort'] . '_' . $args['sort_by'];
        }


        if (isset($_GET['guests'])) {
            $guests         = array_map('absint', $_GET['guests']);
            $args['guests'] = array_sum($guests);
        }

        $args = $this->get_rating_book_option($args);

        // sanitize args
        foreach ($args as $arg_key => $arg_value) {
            $args[sanitize_title($arg_key)] = is_array($arg_value) ? array_map('absint', $arg_value) : sanitize_text_field($arg_value);
        }


        $args = apply_filters('babe_search_result_args', $args);

        $args = BABE_Post_types::search_filter_to_get_posts_args($args);

        $posts       = BABE_Post_types::get_posts($args);
        $posts_pages = BABE_Post_types::$get_posts_pages;


        foreach ($posts as $post) {
            ob_start();
            include get_theme_file_path('template-parts/booking/block/item-block-' . $settings['style'] . '.php');
            $output .= ob_get_clean();
        } /// end foreach $posts

        if ($output) {
            $results['output']         = $output;
            $results['sort_by_filter'] = BABE_html::input_select_field_with_order('sr_sort_by', '', BABE_Post_types::get_search_filter_sort_by_args(), $args['search_results_sort_by']);
            $results['page']           = BABE_Functions::pager($posts_pages);
            $results['posts_count']    = BABE_Post_types::$get_posts_count;
        }

        return $results;
    }

    public function get_rating_book_option($args = []) {
        $options = get_option('havezic_rating_book');
        if (isset($_GET['rating_value']) && isset($options) && !empty($options)) {
            foreach ($options as $key => $option) {
                if ($_GET['rating_value'] == $key) {
                    if (empty($option)) {
                        $args['post__in'] = array(0);
                    } else {
                        $args['post__in'] = $option;
                    }

                    return $args;
                }
            }
        }

        return $args;

    }

}

$widgets_manager->register(new Havezic_BABE_Elementor_SeachResults_Widget());