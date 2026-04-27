<?php
/**
 * BA Profile
 *
 * Override BABE_My_account::get_customer_info_html()
 * @version 1.0.0
 */

$user_info          = wp_get_current_user();
$args['first_name'] = $user_info->first_name;
$args['last_name']  = $user_info->last_name;
$args['email']      = $user_info->user_email;

$contacts = get_user_meta($user_info->ID, 'contacts', 1);
if (is_array($contacts)) {
    $args += $contacts;
} ?>

<div class="my_account_inner_page_block my_account_user_profile dashboard-content-wrapper">
    <div class="my_account_user_avatar">
        <?php echo get_avatar($user_info->ID, 260, 'mm'); ?>
    </div>
    <div class="my_account_user_info">
        <table class="my_account_user_info_table">
            <tbody>
                <?php
                foreach ($args as $field_name => $field_content) {?>

                    <tr>
                        <td class="my_account_label"><?php printf("%s", BABE_html::checkout_field_label($field_name)); ?></td>
                        <td class="my_account_label_profile_value"><?php printf("%s", $field_content); ?></td>
                    </tr>
                <?php
                }
                ?>
            </tbody>
        </table>
    </div>
</div>
