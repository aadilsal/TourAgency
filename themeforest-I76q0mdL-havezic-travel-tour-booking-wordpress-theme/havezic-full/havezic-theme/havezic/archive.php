<?php
get_header();

if (havezic_is_elementor_activated() && etb_archive_enabled()) {
    do_action('etb_archive');
} else {
    ?>
    <div id="primary" class="content-area">
        <main id="main" class="site-main">

            <?php if (have_posts()) : ?>

                <header class="page-header">
                    <?php
                    the_archive_description('<div class="taxonomy-description">', '</div>');
                    ?>
                </header><!-- .page-header -->

                <?php
                get_template_part('loop');

            else :

                get_template_part('content', 'none');

            endif;
            ?>

        </main><!-- #main -->
    </div><!-- #primary -->

    <?php
    do_action('havezic_sidebar');
}
get_footer();
