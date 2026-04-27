<div class="post-modern">
    <div class="post-inner">
        <?php havezic_post_thumbnail('havezic-post', true); ?>
        <div class="post-content">
            <div class="entry-header">
                <div class="entry-meta">
                    <?php havezic_post_meta(['show_cat' => true, 'show_date' => false, 'show_author' => true, 'show_comment' => false]); ?>
                </div>
                <?php the_title('<h3 class="sigma entry-title"><a href="' . esc_url(get_permalink()) . '" rel="bookmark">', '</a></h3>'); ?>
            </div>
            <div class="entry-content">
                <?php
                echo '<div class="more-link-wrap"><a class="more-link" href="' . get_permalink() . '">' . esc_html__('Read more', 'havezic') . '</a></div>';
                ?>
            </div>
        </div>
    </div>
</div>
