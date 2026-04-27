<div class="post-inner blog-grid">
    <?php havezic_post_thumbnail('havezic-post-grid'); ?>
    <div class="post-content">
        <div class="entry-header">
            <div class="entry-meta">
                <?php havezic_post_meta(['show_cat' => true, 'show_date' => true, 'show_author' => true, 'show_comment' => false]); ?>
            </div>
            <?php the_title('<h3 class="sigma entry-title"><a href="' . esc_url(get_permalink()) . '" rel="bookmark">', '</a></h3>'); ?>
        </div>
        <div class="entry-content">
            <div class="entry-excerpt"><?php the_excerpt(); ?></div>
            <?php
            echo '<div class="more-link-wrap"><a class="more-link" href="' . get_permalink() . '"> <span class="elementor-button-icon left"><i class="havezic-icon-arrow-small-right"></i></span>' . esc_html__('Read More', 'havezic') . '<span class="elementor-button-icon right"><i class="havezic-icon-arrow-small-right"></i></span></a></div>';
            ?>
        </div>
    </div>
</div>