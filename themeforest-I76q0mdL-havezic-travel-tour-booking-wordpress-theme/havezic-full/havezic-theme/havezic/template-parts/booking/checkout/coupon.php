<?php
/**
 * BA Coupon
 *
 * Override BABE_html::coupon_field_to_checkout_form()
 * @version 1.0.0
 */


$order_id = $args['order_id'];

if (BABE_Coupons::coupons_active()) {

    $coupon = BABE_Coupons::get_coupon_by_order_id($order_id);
    if (!$coupon) {
        //// render input field with button Apply
        ?>
        <div class="coupon-form-block">
            <label class="coupon_form_input_label"><?php esc_html_e('Enter Coupon Code and get a discount!', 'havezic') ?></label>
            <span class="coupon_form_input_field">
				   <input type="text" name="coupon_number" id="coupon_input_field" value="" />
			</span>
            <span id="coupon_form_submit_loader"></span>
            <span id="coupon_form_submit" class="btn button button-primary"><?php esc_html_e('Apply Coupon', 'havezic') ?></span>
        </div>
        <?php

    }

}
