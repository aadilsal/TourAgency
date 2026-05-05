<?php
$output = $content;

$args = wp_parse_args($_GET, array(
    'order_id'   => 0,
    'order_num'  => '',
    'order_hash' => '',
));

/// is order data valid

$order_id = absint($args['order_id']);

if ($order_id && $args['order_num'] && $args['order_hash'] && BABE_Order::is_order_valid($order_id, $args['order_num'], $args['order_hash'])) {
    ?>
    <div class="confirmation-page-default">
        <?php

        $args['order_status']   = BABE_Order::get_order_status($order_id);
        $order_items_arr        = BABE_Order::get_order_items($order_id);
        $ages_arr_ordered_by_id = BABE_Post_types::get_ages_arr_ordered_by_id();
        //// do actions
        do_action('babe_order_do_before_confirm_content', $order_id, $args);

        if ($args['order_status'] != 'draft') {
            ?>
            <div class="babe_message_order babe_message_order_status_<?php echo esc_attr($args['order_status']); ?>">
                <?php echo BABE_Settings::$settings['message_' . $args['order_status']]; ?>
            </div>
            <?php
        }

        if ($args['order_status'] == 'payment_expected') {
            ?>
            <div class="babe_order_confirm">
                <a href="<?php echo BABE_Order::get_order_payment_page($order_id); ?>"
                   class="babe_button_order babe_button_order_to_pay">
                    <?php
                    echo esc_html__('Pay Now!', 'havezic');
                    ?>
                </a>
            </div>
            <?php
        }
        ?>
        <div class="confirmation-information">
            <div class="order-number">
                <span class="title"><?php echo esc_html__('Order number:', 'havezic'); ?></span>
                <span class="content"><?php echo esc_html($args['order_num']); ?></span>
            </div>
            <div class="date">
                <span class="title"><?php echo esc_html__('Date:', 'havezic'); ?></span>
                <span class="content">
                <?php
                $date_from = BABE_Order::get_order_dates($order_id);
                foreach ($date_from as $date_id => $date_item) {
                    printf('%s', $date_item['date_from']);
                }
                ?>
            </span>
            </div>
            <div class="total">
                <span class="title"><?php echo esc_html__('Total:', 'havezic'); ?></span>
                <span class="content">
				<?php
                $total_with_coupon = BABE_Order::get_order_total_amount($order_id);
                $prepaid_received  = BABE_Order::get_order_prepaid_received($order_id) - BABE_Order::get_order_refunded_amount($order_id);
                $amount_to_pay     = $total_with_coupon - $prepaid_received;
                echo BABE_Currency::get_currency_price($amount_to_pay);
                ?>
			</span>
            </div>
            <div class="payment-method">
                <span class="title"><?php esc_html_e('Payment method:', 'havezic'); ?></span>
                <span class="content"><?php esc_html_e('Payment later', 'havezic'); ?></span>
            </div>
        </div>

        <div class="order-details-table">
            <h4 class="order-heading"><?php esc_html_e('Order Details', 'havezic'); ?></h4>
            <?php ?>
            <?php foreach ($order_items_arr as $item_id => $item) {
                ?>
                <div class="order-body">
                    <?php
                    $booking_obj_id    = $item['booking_obj_id'];
                    $post              = BABE_Post_types::get_post($booking_obj_id);
                    $rules_cat         = BABE_Booking_Rules::get_rule_by_obj_id($booking_obj_id);
                    $total_item_prices = BABE_Prices::get_obj_total_price($booking_obj_id, $item['meta']['price_arr']);
                    ?>
                    <div class="order-content">
                        <div class="title">
                            <a target="_blank" href="<?php echo get_permalink($booking_obj_id); ?>">
                                <?php echo esc_html($item['order_item_name']); ?>
                            </a>
                        </div>
                        <div class="date-time">
                            <?php
                            $date_format   = $rules_cat['rules']['basic_booking_period'] === 'day' || $rules_cat['rules']['basic_booking_period'] === 'single_custom' || $rules_cat['rules']['basic_booking_period'] === 'hour' ? get_option('date_format') . ' - ' . get_option('time_format') : get_option('date_format');
                            $date_from_obj = new DateTime($item['meta']['date_from']);
                            if ($rules_cat['rules']['basic_booking_period'] != 'recurrent_custom') {
                                $date_to_obj = new DateTime($item['meta']['date_to']);
                                ?>
                                <span class="label"> <?php echo esc_html__('From:', 'havezic'); ?> </span>
                                <span class="value date"> <?php echo(date_i18n($date_format, strtotime($date_from_obj->format('Y-m-d H:i')))); ?> </span>
                                <span class="label"> <?php echo esc_html__('To:', 'havezic'); ?> </span>
                                <span class="value"> <?php echo(date_i18n($date_format, strtotime($date_to_obj->format('Y-m-d H:i')))); ?></span>
                                <?php
                            } else {
                                ?>
                                <span class="label"> <?php echo esc_html__('Date:', 'havezic'); ?></span>
                                <span class="value date"> <?php echo(date_i18n($date_format, strtotime($date_from_obj->format('Y-m-d H:i')))); ?> </span>
                                <span class="label"> <?php echo esc_html__('Time:', 'havezic'); ?> </span>
                                <?php printf('<span class="value">%s</span>', $date_from_obj->format(get_option('time_format'))); ?>
                                <?php
                            }
                            ?>
                        </div>
                        <?php
                        $duration = BABE_Post_types::get_post_duration($post);
                        if ($duration) {
                            ?>
                            <div class="duration">
                                <span class="label"><?php esc_html_e('Duration:', 'havezic'); ?></span>
                                <?php printf('<span class="value">%s</span>', $duration); ?>
                            </div>
                        <?php } ?>
                        <div class="tickets">
                            <?php
                            if (!isset($rules_cat['category_meta']['categories_remove_guests']) || !$rules_cat['category_meta']['categories_remove_guests']) {
                                $label_guests = $rules_cat['rules']['booking_mode'] == 'tickets' ? esc_html__('Tickets:', 'havezic') : esc_html__('Guests:', 'havezic');
                                printf('<span class="label"> %s</span>', $label_guests);
                                ?>
                                <div class="value">

                                    <?php foreach ($item['meta']['guests'] as $age_id => $guests_num) {
                                        ?>
                                        <div class="order_prices">
                                            <?php
                                            if ($guests_num) {
                                                $age_title = isset($ages_arr_ordered_by_id[$age_id]) ? $ages_arr_ordered_by_id[$age_id]['name'] : ($guests_num > 1 ? esc_html__('persons', 'havezic') : esc_html__('person', 'havezic'));

                                                if (!$age_id) {
                                                    printf('<span class="order_item_age_guests_num">%s</span>', $guests_num . $age_title);
                                                    if (isset($item['meta']['price_arr']['clear'][$age_id])) {
                                                        ?>
                                                        <span class="order_item_age_price"><?php echo BABE_Currency::get_currency_price($item['meta']['price_arr']['clear'][$age_id]); ?></span>
                                                    <?php } else echo ''; ?>
                                                <?php } else {
                                                    ?>
                                                    <span class="order_item_age_title"> <?php echo esc_html($age_title); ?></span>
                                                    <span class="order_item_age_guests_num">x<?php echo esc_html($guests_num); ?> =</span>
                                                    <?php
                                                    if (isset($item['meta']['price_arr']['clear'][$age_id])) {
                                                        ?>
                                                        <span class="order_item_age_price"><?php echo BABE_Currency::get_currency_price($item['meta']['price_arr']['clear'][$age_id]); ?></span>
                                                    <?php } else echo ''; ?>
                                                    <?php
                                                }
                                                ?>
                                            <?php } ?>
                                        </div>
                                    <?php } ?>

                                </div>
                            <?php } ?>
                        </div>
                    </div>
                    <div class="order-price">
                        <?php
                        $guests_price = 0;
                        foreach ($item['meta']['guests'] as $age_id => $guests_num) {
                            if ($guests_num && !empty($item['meta']['price_arr']['clear'][$age_id])) {
                                $guests_price += $item['meta']['price_arr']['clear'][$age_id];
                            }
                        }
                        ?>
                        <span class="order_item_total_price"><?php echo BABE_Currency::get_currency_price($guests_price); ?></span>
                        <?php
                        if ($item['meta']['price_arr']['discount']) {
                            ?>
                            <span class="order_item_discount_note"><?php echo sprintf(__('Price Cut %d%% off applied', 'havezic'), $item['meta']['price_arr']['discount']); ?></span>
                            <?php
                        } else {
                            echo '';
                        }
                        ?>
                        <?php
                        ?>
                    </div>
                </div>
                <div class="order-service">
                    <?php
                    if (!empty($item['meta']['price_arr']['services'])) {
                        foreach ($item['meta']['price_arr']['services'] as $service_id => $service_prices) {
                            $price       = 0;
                            $age_details = array();
                            ?>
                            <div class="order_item_details">
                                <?php
                                foreach ($service_prices['clear'] as $age_id => $age_price) {

                                    $guests_num = !empty($item['meta']['guests'][$age_id]) ? $item['meta']['guests'][$age_id] : 0;
                                    $price      += $age_price;

                                    if ($guests_num && $age_id && isset($ages_arr_ordered_by_id[$age_id])) {
                                        $age_details[] = $guests_num . ' ' . $ages_arr_ordered_by_id[$age_id]['name'];
                                    }
                                }
                                $service_title = get_the_title($service_id);
                                ?>
                                <div class="details">
                                    <?php printf('<span class="title">%s</span><span class="guests">%s</span>', $service_title, implode(', ', $age_details)); ?>
                                </div>
                                <div class="price"><?php echo BABE_Currency::get_currency_price($price); ?></div>
                            </div>
                            <?php
                        }
                    }
                    $subtotal     = $total_item_prices['total'];
                    $taxes_amount = $total_item_prices['total_item_with_taxes'] + array_sum($total_item_prices['total_services_with_taxes']) - $total_item_prices['total_item'] - array_sum($total_item_prices['total_services']);
                    $total        = $total_item_prices['total_with_taxes'];
                    ?>
                </div>
            <?php } ?>
            <div class="order-total-subtotal">
                <div class="order_items_total">
                    <span class="label"><?php echo esc_html__('Sub Total', 'havezic'); ?></span>
                    <span class="amount"> <?php echo BABE_Currency::get_currency_price($subtotal); ?></span>
                </div>
                <?php
                $taxes_percents = (float)apply_filters('babe_html_order_items_post_tax', BABE_Post_types::get_post_tax($post['ID']), $post['ID']);
                if ($taxes_percents) {
                    $taxes_title = !empty($rules_cat['category_meta']['categories_tax_title']) ? $rules_cat['category_meta']['categories_tax_title'] : esc_html__('Taxes', 'havezic');
                    ?>
                    <div class="order_items_total">
                        <?php printf('<span class="label">%s</span>', $taxes_percents . $taxes_percents); ?>
                        <span class="amount"><?php echo BABE_Currency::get_currency_price($taxes_amount) ?></span>
                    </div>
                    <?php
                }
                ?>
                <div class="order_items_total">
                    <span class="label"><?php echo esc_html__('Total', 'havezic'); ?></span>
                    <span class="amount"><?php echo BABE_Currency::get_currency_price($total); ?></span>
                </div>
                <div class="order_items_total">
                    <span class="label"><?php echo esc_html__('Amount Paid', 'havezic'); ?></span>
                    <span class="amount"><?php echo BABE_Currency::get_currency_price($prepaid_received); ?></span>
                </div>
                <div class="order_items_total">
                    <span class="label"><?php echo esc_html__('Amount Due', 'havezic'); ?></span>
                    <span class="amount amount-total"><?php echo BABE_Currency::get_currency_price($amount_to_pay); ?></span>
                </div>
            </div>
        </div>
    </div>
    <?php
} //// end if is_order_valid


