<div class="post-inner blog-list-1">
    <?php havezic_post_thumbnail('havezic-post-grid'); ?>
    <div class="post-content">
        <?php
        the_title('<h3 class="omega entry-title"><a href="' . esc_url(get_permalink()) . '" rel="bookmark">', '</a></h3>');
        ?>
        <div class="post-date">
            <?php havezic_post_date(); ?>
        </div>
    </div>
</div>