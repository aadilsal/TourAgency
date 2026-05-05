<?php
$babe_post    = BABE_Post_types::get_post($post['ID']);
$image_srcs = wp_get_attachment_image_src(get_post_thumbnail_id($post['ID']), 'havezic-item');

$item_url = BABE_Functions::get_page_url_with_args($post['ID'], $_GET);
$price_old = $post['discount_price_from'] < $post['price_from'] ? '<span class="item_info_price_old">' . BABE_Currency::get_currency_price($post['price_from']) . '</span>' : '';
$discount     = $post['discount'] ? '<span class="item_info_price_discount">' . $post['discount'] . esc_html__('% Off', 'havezic') . '</span>' : '';
$popular     = isset($babe_post['havezic_feature_item']) && $babe_post['havezic_feature_item'] ? '<span class="item_info_popular">' . esc_html__('Featured', 'havezic') . '</span>' : '';
$times_arr    = BABE_Post_types::get_post_av_times($babe_post);
$address      = isset($babe_post['address']) ? $babe_post['address'] : false;
$item_class = isset($settings['enable_carousel']) && $settings['enable_carousel'] == 'yes' ? 'swiper-slide': 'grid-item';
?>
<div class="babe_items babe_items_3 babe_items_list <?php echo esc_attr($item_class);?>">
    <div class="babe_all_items_item_inner">
        <div class="item_img">
            <div class="items_labels">
                <?php printf('%s', $popular); ?>
                <?php printf('%s', $discount); ?>
            </div>
            <?php havezic_item_action($post,$babe_post); ?>
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
        </div>
    </div>
</div>