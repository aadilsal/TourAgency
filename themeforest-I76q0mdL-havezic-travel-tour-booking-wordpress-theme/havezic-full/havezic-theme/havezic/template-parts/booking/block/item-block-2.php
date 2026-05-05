<?php
$babe_post    = BABE_Post_types::get_post($post['ID']);
$image_srcs = wp_get_attachment_image_src(get_post_thumbnail_id($post['ID']), 'havezic-item');

$item_url = BABE_Functions::get_page_url_with_args($post['ID'], $_GET);
$price_old = $post['discount_price_from'] < $post['price_from'] ? '<span class="item_info_price_old">' . BABE_Currency::get_currency_price($post['price_from']) . '</span>' : '';
$discount     = $post['discount'] ? '<span class="item_info_price_discount">' . $post['discount'] . esc_html__('% Off', 'havezic') . '</span>' : '';
$popular     = isset($babe_post['havezic_feature_item']) && $babe_post['havezic_feature_item'] ? '<span class="item_info_popular">' . esc_html__('Featured', 'havezic') . '</span>' : '';
$times_arr    = BABE_Post_types::get_post_av_times($babe_post);
$address      = isset($babe_post['address']) ? $babe_post['address'] : false;
$videolink    = isset($babe_post['havezic_video_link']) ? $babe_post['havezic_video_link'] : false;
$gallerys     = isset($babe_post['images']) ? $babe_post['images'] : false;
$wishlist   = Havezic_BA_Booking_Wishlist::add_to_wishlist( $post['ID'] );
$item_class = isset($settings['enable_carousel']) && $settings['enable_carousel'] == 'yes' ? 'swiper-slide': 'grid-item';
?>
<div class="babe_items babe_items_2 <?php echo esc_attr($item_class);?>">
    <div class="babe_all_items_item_inner">
        <div class="item_img">
            <div class="items_labels">
                <?php printf('%s', $popular); ?>
                <?php printf('%s', $discount); ?>
            </div>
            <div class="items_action">
                <?php if ($wishlist && !empty($wishlist)): ?>
                    <a class="havezic_add_to_wishlist <?php echo esc_attr($wishlist['class']); ?>" href="<?php echo esc_url($wishlist['link']); ?>" title="<?php echo esc_attr($wishlist['text']); ?>" rel="nofollow" data-book-title="<?php echo esc_attr(get_the_title($post['ID'])); ?>" data-book-id="<?php echo esc_attr($post['ID']); ?>">
                        <span class="wishlist <?php echo esc_attr($wishlist['icon_class']); ?>"></span>
                    </a>
                <?php endif; ?>
                <?php if ($gallerys) {
                    echo '<a href="#" data-images="' . esc_attr(json_encode($gallerys)) . '" class="item-gallery item-meta-value"><i class="havezic-icon-image"></i><span class="screen-reader-text">' . esc_html__('View Gallery', 'havezic') . '</span></a>';
                }
                if (!empty($videolink)) {
                    echo '<a href="' . esc_url($videolink) . '" class="item-video item-meta-value"><i class="havezic-icon-video-recorder"></i><span class="screen-reader-text">' . esc_html__('View Video', 'havezic') . '</span></a>';
                } ?>
            </div>
            <?php echo has_post_thumbnail($post['ID']) ? '<a class="item-thumb" href="' . $item_url . '"><img src="' . $image_srcs[0] . '" alt="' . esc_attr($post['post_title']) . '"></a>' : ''; ?>
        </div>
        <div class="item_text">
            <div class="item-meta">
                <?php echo havezic_post_stars_rendering($post['ID']); ?>
                <?php if (!empty($times_arr)) {
                    echo '<div class="item-days item-meta-value"><i class="havezic-icon-time-line"></i><span>' . BABE_Post_types::get_post_duration($babe_post) . '</span></div>';
                } ?>
            </div>

            <?php if (!empty($address)) { ?>
                <div class="item-location">
                    <span><?php echo esc_html($address['address']); ?></span>
                </div>
            <?php } ?>
            <div class="item_title">
                <a href="<?php echo esc_url($item_url); ?>"><?php echo apply_filters('translate_text', $post['post_title']); ?></a>
            </div>
            <div class="item_info_price">
                <label><?php echo esc_html__('from', 'havezic'); ?></label>
                <span class="item_info_price_new"><?php echo BABE_Currency::get_currency_price($post['discount_price_from']); ?></span>
                <?php printf('%s', $price_old ); ?>
                <?php ?>
            </div>
            <div class="more-link-wrap">
                <a class="more-link link-background" href="<?php echo esc_url($item_url); ?>">
                    <span class="elementor-button-icon left"><i class="havezic-icon-arrow-small-right"></i></span>
                    <span class="more-text"><?php echo esc_html__('More Information', 'havezic'); ?></span>
                    <span class="elementor-button-icon right"><i class="havezic-icon-arrow-small-right"></i></span>
                </a>
            </div>
        </div>
    </div>
</div>