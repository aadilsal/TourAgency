<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
    <div class="single-content">
        <?php
        /**
         * Functions hooked in to havezic_single_post_top action
         *
         */
        do_action('havezic_single_post_top');

        /**
         * Functions hooked in to havezic_single_post action
         * @see havezic_post_header         - 10
         * @see havezic_post_content        - 30
         */
        do_action('havezic_single_post');

        /**
         * Functions hooked in to havezic_single_post_bottom action
         *
         * @see havezic_post_taxonomy      - 5
         * @see havezic_single_author      - 10
         * @see havezic_post_nav            - 15
         * @see havezic_display_comments    - 20
         */
        do_action('havezic_single_post_bottom');
        ?>

    </div>

</article><!-- #post-## -->
