<?php

get_header(); ?>

	<div id="primary" class="content-area">
		<main id="main" class="site-main">

		<?php
		if ( have_posts() ) :

			get_template_part( 'loop' );

		else :

			get_template_part( 'content', 'none' );

		endif;
		?>

		</main><!-- #main -->
	</div><!-- #primary -->

<?php

/**
 * Functions hooked in to havezic_sidebar action
 *
 * @see havezic_get_sidebar      - 10
 */
do_action( 'havezic_sidebar' );
get_footer();
