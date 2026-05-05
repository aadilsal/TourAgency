<?php
/**
 * BA Single Related
 *
 * Override BABE_html::block_related($babe_post)
 * @version 1.0.0
 */

if (\Elementor\Plugin::instance()->editor->is_edit_mode()) {
    $post_id = havezic_ba_get_default_single_id();
} else {
    $post_id = get_the_ID();
}
$babe_post = BABE_Post_types::get_post($post_id);
$settings  = $this->get_settings_for_display();
$this->get_data_elementor_columns();
$this->add_render_attribute('shortcode', 'class', 'babe_shortcode_block sc_all_items');
$this->add_render_attribute('shortcode', 'class', 'all-items-' . esc_attr($settings['style']));
$this->add_render_attribute('wrapper', 'class', 'babe_shortcode_block_bg_inner');
$this->add_render_attribute('row', 'class', 'babe_shortcode_block_inner');
if (!empty($babe_post) && isset($babe_post['related_items']) && !empty($babe_post['related_items'])) {

    $related_arr = $babe_post['related_items'];

    $thumbnail      = apply_filters('babe_post_related_item_thumbnail', 'ba-thumbnail-sq');
    $excerpt_length = apply_filters('post_related_item_excerpt_length', 13);

    if (isset($related_arr) && !empty($related_arr)) {
        ?>
        <div
        <div <?php $this->print_render_attribute_string('shortcode'); ?>>
            <div <?php $this->print_render_attribute_string('wrapper'); ?>>
            <div <?php $this->print_render_attribute_string('row'); ?>>
                <?php
                foreach ($related_arr as $related_post) {
                    $post   = get_post($related_post, ARRAY_A);
                    $prices = BABE_Post_types::get_post_price_from($related_post);
                    if (empty($prices)) {
                        $post_args['post__in'] = array($post['ID']);
                        $posts                 = BABE_Post_types::get_posts($post_args);
                        if (!empty($posts) && isset($posts[0])) {
                            $prices = $posts[0];
                        }
                    }
                    $post = array_merge($post, $prices);
                    include get_theme_file_path('template-parts/booking/block/item-block-' . $settings['style'] . '.php');
                }
                ?>
            </div>
            </div>
        </div>
        <?php
    }
}
