<?php
/**
 * =================================================
 * Hook havezic_page
 * =================================================
 */
add_action('havezic_page', 'havezic_page_header', 10);
add_action('havezic_page', 'havezic_page_content', 20);

/**
 * =================================================
 * Hook havezic_single_post_top
 * =================================================
 */

/**
 * =================================================
 * Hook havezic_single_post
 * =================================================
 */
add_action('havezic_single_post', 'havezic_post_header', 10);
add_action('havezic_single_post', 'havezic_post_content', 30);

/**
 * =================================================
 * Hook havezic_single_post_bottom
 * =================================================
 */
add_action('havezic_single_post_bottom', 'havezic_post_taxonomy', 5);
add_action('havezic_single_post_bottom', 'havezic_single_author', 10);
add_action('havezic_single_post_bottom', 'havezic_post_nav', 15);
add_action('havezic_single_post_bottom', 'havezic_display_comments', 20);

/**
 * =================================================
 * Hook havezic_loop_post
 * =================================================
 */
add_action('havezic_loop_post', 'havezic_post_header', 15);
add_action('havezic_loop_post', 'havezic_post_content', 30);

/**
 * =================================================
 * Hook havezic_footer
 * =================================================
 */
add_action('havezic_footer', 'havezic_footer_default', 20);

/**
 * =================================================
 * Hook havezic_after_footer
 * =================================================
 */

/**
 * =================================================
 * Hook wp_footer
 * =================================================
 */
add_action('wp_footer', 'havezic_form_login', 1);
add_action('wp_footer', 'havezic_mobile_nav', 1);
add_action('wp_footer', 'render_html_back_to_top', 1);

/**
 * =================================================
 * Hook wp_head
 * =================================================
 */
add_action('wp_head', 'havezic_pingback_header', 1);

/**
 * =================================================
 * Hook havezic_before_header
 * =================================================
 */

/**
 * =================================================
 * Hook havezic_before_content
 * =================================================
 */

/**
 * =================================================
 * Hook havezic_content_top
 * =================================================
 */

/**
 * =================================================
 * Hook havezic_post_content_before
 * =================================================
 */

/**
 * =================================================
 * Hook havezic_post_content_after
 * =================================================
 */

/**
 * =================================================
 * Hook havezic_sidebar
 * =================================================
 */
add_action('havezic_sidebar', 'havezic_get_sidebar', 10);

/**
 * =================================================
 * Hook havezic_loop_after
 * =================================================
 */
add_action('havezic_loop_after', 'havezic_paging_nav', 10);

/**
 * =================================================
 * Hook havezic_page_after
 * =================================================
 */
add_action('havezic_page_after', 'havezic_display_comments', 10);
