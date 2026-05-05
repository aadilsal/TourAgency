<?php
/**
 * BA Single Address Text
 *
 * @version 1.0.0
 */

if ( \Elementor\Plugin::instance()->editor->is_edit_mode() ) {
    $post_id = havezic_ba_get_default_single_id();
} else {
    $post_id = get_the_ID();
}
$babe_post = get_post( $post_id );

if ( is_single() && $babe_post->post_type == BABE_Post_types::$booking_obj_post_type) {
    $babe_post = BABE_Post_types::get_post($babe_post->ID);

    if ( ! empty( $babe_post ) && isset( $babe_post['address']['address'] ) ) {
        ?>
        <div class="havezic-single-address">
            <span><?php echo esc_html($babe_post['address']['address']); ?></span>
        </div>
        <?php
    }

}
