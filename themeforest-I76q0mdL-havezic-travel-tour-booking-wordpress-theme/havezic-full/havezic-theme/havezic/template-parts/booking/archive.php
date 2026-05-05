<?php

$settings = $this->get_settings_for_display();
$this->add_render_attribute('wrapper', 'class', 'ba-items-style-' . $settings['style']);
$this->add_render_attribute('row', 'class', 'babe_shortcode_block_inner d-grid');
$posts_pages = BABE_Post_types::$get_posts_pages;

?>
<div <?php $this->print_render_attribute_string('wrapper'); ?>>
    <div class="babe_shortcode_block sc_all_items">
        <div <?php $this->print_render_attribute_string('row'); ?>>
            <?php
            if (is_archive()) {
                while (have_posts()) :
                    the_post();
                    $post   = get_post(get_the_ID(), ARRAY_A);
                    $prices = BABE_Post_types::get_post_price_from($post['ID']);
                    $post   = array_merge($post, $prices);
                    include get_theme_file_path('template-parts/booking/block/item-block-' . $settings['style'] . '.php');
                endwhile;
            } else {
                $posts = BABE_Post_types::get_posts();
                foreach ($posts as $post) {
                    include get_theme_file_path('template-parts/booking/block/item-block-' . $settings['style'] . '.php');
                }
            }
            ?>
        </div>
        <?php havezic_paging_nav(); ?>
    </div>
</div>

