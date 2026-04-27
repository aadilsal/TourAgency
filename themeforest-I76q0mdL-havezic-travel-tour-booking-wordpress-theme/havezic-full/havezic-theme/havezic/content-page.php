<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
	<?php
	/**
	 * Functions hooked in to havezic_page action
	 *
	 * @see havezic_page_header          - 10
	 * @see havezic_page_content         - 20
	 *
	 */
	do_action( 'havezic_page' );
	?>
</article><!-- #post-## -->
