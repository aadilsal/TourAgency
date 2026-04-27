<?php
$action         = $args['action'];
$prepaid_amount = $args['prepaid_amount'];
$total_amount   = $args['total_amount'];
$payment_model  = $args['payment_model'];
$payment_fields = '';

$deposit = '';
if ($payment_model == 'deposit_full') $deposit = esc_html__('(deposit)', 'havezic');

if ($action == 'to_pay') {
    $payment_methods_arr = BABE_Settings::get_active_payment_methods();

    $payment_titles    = '';
    $payment_details   = '';
    $input_fields_name = 'payment';
    $first_method      = '';
    $i                 = 0;
    if (isset($payment_methods_arr) && !empty($payment_methods_arr)):
        foreach ($payment_methods_arr as $method => $method_title) {
            //// input names like payment[...]
            $tab_start_active = !$i ? ' tab_active' : '';
            $first_method     = !$i ? $method : $first_method;

            $payment_titles  .= '<span class="payment_method_title payment_method_title_' . $method . ' tab_title' . $tab_start_active . '" data-method="' . $method . '">' . apply_filters('babe_checkout_payment_title_' . $method, $method_title, $args, $input_fields_name) . '</span>';
            $payment_details .= '<div class="payment_method_fields payment_method_fields_' . $method . ' tab_content' . $tab_start_active . '" data-method="' . $method . '">' . apply_filters('babe_checkout_payment_fields_' . $method, '', $args, $input_fields_name) . '</div>';
            $i++;
        }
    endif;
    ?>

    <div class="amount_group">
        <label class="checkout_form_amount_label"><?php esc_html_e('Amount to Pay now:', 'havezic') ?></label>
        <div class="checkout_form_pay_total">
            <div class="input-cicrle">
                <input type="radio" name="payment[amount_to_pay]" id="order_amount_to_pay_deposit" value="deposit" checked="checked"/>
                <label for="order_amount_to_pay_deposit">
                    <?php echo ent2ncr(BABE_Currency::get_currency_price($prepaid_amount)) . '&nbsp;' . esc_html($deposit); ?>
                </label>
            </div>
        </div>
        <?php if ($payment_model == 'deposit_full') { ?>
            <div class="checkout_form_pay_total">
                <div class="input-cicrle">
                    <input type="radio" name="payment[amount_to_pay]" id="order_amount_to_pay_full" value="full">
                    <label for="order_amount_to_pay_full">
                        <?php echo ent2ncr(BABE_Currency::get_currency_price($total_amount)) . '&nbsp;' . esc_html__('(full)', 'havezic'); ?>
                    </label>
                </div>
            </div>
        <?php } ?>
    </div>
    <h2 class="checkout-title"><?php esc_html_e('Payment Method', 'havezic') ?></h2>
    <div class="payment_group tabs_group">
        <div class="payment_titles_group tabs_titles">
            <?php printf("%s", $payment_titles); ?>
        </div>
        <div class="payment_fields_group">
            <?php printf("%s", $payment_details); ?>
        </div>
        <input type="hidden" name="payment[payment_method]" value="<?php echo esc_attr($first_method); ?>">
    </div>

    <?php

} else { ?>

    <h2><?php esc_html_e('Payment details', 'havezic') ?></h2>
    <div class="payment_group payment_details_before_av_check">
        <?php sprintf(esc_html__('You could pay after the items availability confirmation! <br> Confirmation will be sent to your e-mail. <br> Amount to pay online will be %s.', 'havezic'), BABE_Currency::get_currency_price($prepaid_amount)); ?>
    </div>
    <?php
}
