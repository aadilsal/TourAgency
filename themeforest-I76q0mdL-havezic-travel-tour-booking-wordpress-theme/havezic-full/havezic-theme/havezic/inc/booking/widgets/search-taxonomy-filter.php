<?php
/**
 * Add widget all-items to Elementor
 *
 * @since   1.3.13
 */
class Havezic_BABE_Elementor_TaxonomyFilter_Widget extends \Elementor\Widget_Base {

    /**
     * Get widget name.
     *
     * @return string Widget name.
     */
    public function get_name() {
        return 'babe-taxonomy-filter';
    }

    /**
     * Get widget title.
     *
     * @return string Widget title.
     */
    public function get_title() {
        return esc_html__('Taxonomies Filter', 'havezic');
    }

    /**
     * Get widget icon.
     *
     * @return string Widget icon.
     */
    public function get_icon() {
        return 'eicon-site-search';
    }

    /**
     * Get widget keywords.
     *
     * Retrieve the list of keywords the widget belongs to.
     *
     * @return array Widget keywords.
     */
    public function get_keywords() {
        return ['filter', 'taxonomy', 'search', 'search filter', 'book everything'];
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
        return [ 'havezic-ba-taxonomy-filter.js' ];
    }


    protected function register_controls() {
        $this->start_controls_section(
            'section_content_wrapper',
            [
                'label' => esc_html__('Content', 'havezic'),
                'tab'   => \Elementor\Controls_Manager::TAB_CONTENT,

            ]
        );

        $this->add_control(
            'taxonomy_id',
            [
                'label' => esc_html__('Ba Taxonomy', 'havezic'),

                'type'        => \Elementor\Controls_Manager::SELECT,
                'options'     => $this->get_taxonomies_arr(),
                'label_block' => true,
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

        if (isset(BABE_Post_types::$taxonomies_list[$settings['taxonomy_id']])){

            $taxonomy = BABE_Post_types::$taxonomies_list[$settings['taxonomy_id']]['slug'];
            $id = 'filter_'.$taxonomy;
            $args = array(
                'taxonomy' => $taxonomy,
                'level' => 0,
                'view' => 'multicheck', // 'select', 'multicheck' or 'list'
                'id' => $id,
                'class' => 'babe-search-filter-terms',
                'name' => $id,
                'term_id_name' => 'term_taxonomy_id',
            );

            $selected_arr = isset($_GET['terms']) ? (array)$_GET['terms'] : array();
            $selected_arr = array_map('intval', $selected_arr);

            echo '<div class="havezic-search-filter-terms">'.BABE_Post_types::get_terms_children_hierarchy($args, $selected_arr).'</div>';

        }
    }

    public static function get_taxonomies_arr() {
        $output = array();

        $taxonomies = get_terms(array(
            'taxonomy'   => BABE_Post_types::$taxonomies_list_tax,
            'hide_empty' => false
        ));

        if (!is_wp_error($taxonomies) && !empty($taxonomies)) {
            foreach ($taxonomies as $tax_term) {
                $output[$tax_term->term_id] = apply_filters('translate_text', $tax_term->name);
            }
        }

        return $output;

    }
}

$widgets_manager->register(new Havezic_BABE_Elementor_TaxonomyFilter_Widget());