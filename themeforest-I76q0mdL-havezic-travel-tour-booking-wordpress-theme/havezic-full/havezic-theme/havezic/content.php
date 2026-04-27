<article id="post-<?php the_ID(); ?>" <?php post_class('article-default'); ?>>
    <div class="post-inner">
        <div class="post-content">
            <?php
            /**
             * Functions hooked in to havezic_loop_post action.
             *
             * @see havezic_post_header          - 15
             * @see havezic_post_content         - 30
             */
            do_action('havezic_loop_post');
            ?>
        </div>
    </div>
</article><!-- #post-## -->