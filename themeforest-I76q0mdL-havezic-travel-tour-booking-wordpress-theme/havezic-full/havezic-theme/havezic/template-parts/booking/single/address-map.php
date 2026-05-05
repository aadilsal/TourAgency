<?php
/**
 * BA Single Address Map
 *
 * Override BABE_html::block_address_map($babe_post)
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

    if ( ! empty( $babe_post ) && isset( $babe_post['address']['address'] ) && isset( $babe_post['address']['latitude'] ) && isset( $babe_post['address']['longitude'] ) ) {

        $latitude  = BABE_Settings::$settings['google_map_start_lat'];
        $longitude = BABE_Settings::$settings['google_map_start_lng'];
        if (isset($babe_post['address']) && !empty($babe_post['address'])) {
            $location  = $babe_post['address'];
            $address   = $location['address'];
            $latitude  = $location['latitude'];
            $longitude = $location['longitude'];
        }
        ?>
        <?php $this->title_render(); ?>
        <div class="google-map-address">
            <?php havezic_ulisting_gallery_google_map($latitude, $longitude); ?>
        </div>
        <?php
    }
}
