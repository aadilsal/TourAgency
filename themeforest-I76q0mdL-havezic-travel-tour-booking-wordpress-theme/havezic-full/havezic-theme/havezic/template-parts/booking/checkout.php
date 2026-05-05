<?php
/**
 * BA Checkout
 *
 * Override BABE_html::checkout_form()
 * @version 1.0.0
 */

$output = $content;

$args = wp_parse_args($_GET, array(
    'order_id'   => 0,
    'order_num'  => '',
    'order_hash' => '',
));

/// is order data valid

$order_id = absint($args['order_id']);

if (BABE_Order::is_order_valid($order_id, $args['order_num'], $args['order_hash'])) {

    /// get order meta
    $order_meta = BABE_Order::get_order_meta($order_id);

    $args['total_amount']   = $order_meta['_total_amount'];
    $args['prepaid_amount'] = $order_meta['_prepaid_amount'];
    $args['payment_model']  = $order_meta['_payment_model'];
    $args['order_currency'] = $order_meta['_order_currency'];

    $order_status = $order_meta['_status'];

    /// clear order meta
    $order_meta   = BABE_Order::clear_order_meta($order_meta);
    $args['meta'] = $order_meta;

    if ($order_status == 'payment_expected' || $order_status == 'draft') {

        if (!isset($order_meta['first_name'])) {
            /// get user meta if user is logged in
            $user_info = wp_get_current_user();
            if ($user_info->ID > 0) {

                $args['meta']['email']       = $user_info->user_email;
                $args['meta']['email_check'] = $user_info->user_email;
                $args['meta']['first_name']  = $user_info->first_name;
                $args['meta']['last_name']   = $user_info->last_name;

                $contacts = get_user_meta($user_info->ID, 'contacts', 1);
                if (is_array($contacts)) {
                    $args['meta'] += $contacts;
                }
            }
        } else {
            $args['meta']['email_check'] = $args['meta']['email'];
        }

        //// select action
        if ($order_status == 'payment_expected' || ($order_status == 'draft' && BABE_Settings::$settings['order_availability_confirm'] == 'auto')) {
            $args['action'] = 'to_pay';
        } else {
            $args['action'] = 'to_av_confirm';
        }

        $args = wp_parse_args($args, array(
            'order_id'       => 0,
            'order_num'      => '',
            'order_hash'     => '',
            'total_amount'   => 0,
            'prepaid_amount' => 0,
            'payment_model'  => 'full',
            'order_currency' => '',
            'action'         => 'to_pay', //to_pay or to_av_confirm
            'meta'           => array(),
        ));

        $args['meta'] = wp_parse_args($args['meta'], array(
            'first_name'  => '',
            'last_name'   => '',
            'email'       => '',
            'email_check' => '',
            'phone'       => '',
        ));

        $order_id  = $args['order_id'];
        $order_num = $args['order_num'];

        ?>
        <div class="checkout-wrapper">
            <div class="checkout-inner checkout-row">
                <div id="checkout_form_block" class="checkout-list-item">
                    <h2 class="checkout-title list-order"><?php echo esc_html__('Order #', 'havezic').esc_html($order_num); ?></h2>
                    <?php printf("%s", BABE_html::order_items($order_id)); ?>
                    <?php Havezic_BA_Booking::load_template_part('checkout/coupon', $args); ?>
                </div>
                <div class="checkout-info">
                    <h2 class="checkout-title"><?php esc_html_e('Contact information', 'havezic'); ?></h2>
                    <?php Havezic_BA_Booking::load_template_part('checkout/information', $args); ?>
                </div>
            </div>
        </div>

        <?php
    } //// end if payment_expected or draft

} //// end if is_order_valid

