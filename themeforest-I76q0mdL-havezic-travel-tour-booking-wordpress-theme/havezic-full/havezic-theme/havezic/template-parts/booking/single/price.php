<?php
/**
 * BA Single Price From
 *
 * Override BABE_html::block_price_from($babe_post)
 * @version 1.0.0
 */
$post_id = get_the_ID();
$babe_post = BABE_Post_types::get_post($post_id);
$rules_cat = BABE_Booking_Rules::get_rule_by_obj_id($post_id);

if (
    !isset($babe_post['discount_price_from'])
    || !isset($babe_post['price_from'])
    || !isset($babe_post['discount_date_to'])
    || !isset($babe_post['discount'])
) {
    $prices = BABE_Post_types::get_post_price_from($babe_post['ID']);
} else {
    $prices = $babe_post;
}

if (!empty($prices)) { ?>
    <div class="item_info_price">
        <label><?php esc_html_e('from ', 'havezic'); ?></label>
        <span class="item_info_price_new"><?php printf("%s", BABE_Currency::get_currency_price($prices['discount_price_from'])); ?></span>
        <?php if ($prices['discount_price_from'] < $prices['price_from']): ?>
            <span class="item_info_price_old"><?php printf("%s", BABE_Currency::get_currency_price($prices['price_from'])); ?></span>
        <?php endif; ?>
    </div>
    <?php
}