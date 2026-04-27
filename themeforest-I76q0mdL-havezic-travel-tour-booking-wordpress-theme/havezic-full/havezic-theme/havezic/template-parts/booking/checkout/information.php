<?php
$order_id   = $args['order_id'];
$order_num  = $args['order_num'];
$order_hash = $args['order_hash'];
$action     = $args['action'];
?>
    <form id="checkout_form" name="checkout_form" method="post" action="">
        <?php echo apply_filters('babe_checkout_before_contact_fields', '', $args); ?>
        <div class="contact_fields_group input_group">
            <?php
            if (isset($args['meta']) && !empty($args['meta'])):
                foreach ($args['meta'] as $field_name => $field_content) {
                    $add_content_class = $field_content ? 'checkout_form_input_field_content' : ''; ?>

                    <div class="checkout-form-block">
                        <div class="checkout_form_input_field <?php echo esc_attr($add_content_class) ?>">
                            <input type="text" class="checkout_input_field checkout_input_required" name="<?php echo esc_attr($field_name) ?>" id="<?php echo esc_attr($field_name) ?>" value="<?php echo esc_attr($field_content) ?>" placeholder="<?php printf("%s", BABE_html::checkout_field_label($field_name)); ?>" <?php printf("%s", apply_filters('babe_checkout_field_required', '', $field_name)); ?>/>
                        </div>
                    </div>

                <?php }
            endif; ?>
        </div>
        <?php echo apply_filters('babe_checkout_after_contact_fields', '', $args); ?>

        <input type="hidden" name="order_id" value="<?php echo esc_attr($order_id); ?>">
        <input type="hidden" name="order_num" value="<?php echo esc_attr($order_num); ?>">
        <input type="hidden" name="order_hash" value="<?php echo esc_attr($order_hash); ?>">
        <input type="hidden" name="action" value="<?php echo esc_attr($action); ?>">

        <?php Havezic_BA_Booking::load_template_part('checkout/payment', $args); ?>

        <?php echo apply_filters('babe_checkout_after_payment_fields', '', $args); ?>

        <div class="terms_group">
            <div class="checkout_form_terms_check">
                <div class="input-square">
                    <input type="checkbox" name="payment[terms_check]" id="order_terms_check" value="agree" required="required">
                    <label for="order_terms_check"><?php esc_html_e('I read and agree to the terms & conditions', 'havezic'); ?></label>
                </div>
            </div>
            <div class="checkout_form_terms_details">
                <?php printf("%s", BABE_Settings::get_terms_page_content()); ?>
            </div>
        </div>
        <?php echo apply_filters('babe_checkout_after_terms_fields', '', $args); ?>

        <div class="submit_group">
            <button class="btn button checkout_form_submit"><?php esc_html_e('Complete My Order', 'havezic'); ?></button>
        </div>
    </form>
<?php

