<!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo('charset'); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
	<link rel="profile" href="//gmpg.org/xfn/11">
	<?php
	/**
	 * Functions hooked in to wp_head action
	 *
	 * @see havezic_pingback_header - 1
	 */
	wp_head();

	?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<?php do_action('havezic_before_site'); ?>

<div id="page" class="hfeed site">
	<?php
	/**
	 * Functions hooked in to havezic_before_header action
	 *
	 */
	do_action('havezic_before_header');
    if (havezic_is_elementor_activated() && etb_header_enabled()) {
        do_action('etb_header');
    } else {
        get_template_part('template-parts/header/header-1');
    }

	/**
	 * Functions hooked in to havezic_before_content action
	 *
	 */
	do_action('havezic_before_content');
	$col_class = is_page_template( 'template-homepage.php' ) ? 'col-fluid clear' : 'col-full clear';
	$content_class = is_page_template( 'template-homepage.php' ) ? 'site-content-page' : 'site-content';
    if (havezic_is_elementor_activated() && (etb_single_enabled() || etb_archive_enabled()) || is_singular('etb_library')) {
        $col_class = 'col-fluid clear';
    }

	?>

	<div id="content" class="<?php echo esc_attr($content_class);?>" tabindex="-1">
		<div class="<?php echo esc_attr($col_class);?>">

<?php
/**
 * Functions hooked in to havezic_content_top action
 *
 */
do_action('havezic_content_top');

