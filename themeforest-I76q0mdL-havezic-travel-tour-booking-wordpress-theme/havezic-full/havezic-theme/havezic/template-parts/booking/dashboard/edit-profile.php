<?php
/**
 * BA Edit Profile
 *
 * Override BABE_My_account::edit_profile()
 * @version 1.0.0
 */

$user_info          = wp_get_current_user();
$args['first_name'] = $user_info->first_name;
$args['last_name']  = $user_info->last_name;
$args['username']   = $user_info->user_login;
$args['email']      = $user_info->user_email;

$contacts = get_user_meta($user_info->ID, 'contacts', 1);
if (is_array($contacts)) {
    $args += $contacts;
}
?>

<div class="my_account_inner_page_block my_account_edit_user_profile">
    <h1 class="page-title"><?php esc_html_e('Edit Profile', 'havezic'); ?></h1>
    <div class="dashboard-content-wrapper">
        <form id="edit_user_profile" name="edit_user_profile" method="post" action="">
            <div class="edit-profile-inner">
                <?php apply_filters('babe_edit_user_profile_before_fields', '', $args); ?>
                <div class="edit-profile-form-block edit-profile-avatar">
                    <?php echo get_avatar($user_info->ID, 260, 'mm'); ?>
                    <a class="btn button button_link" href="https://gravatar.com" target="_blank"><?php esc_html_e('Change Picture', 'havezic'); ?></a>
                </div>
                <div class="user_profile_fields_group input_group">
                    <?php
                    foreach ($args as $field_name => $field_content) {
                        $add_content_class = $field_content ? 'checkout_form_input_field_content' : '';
                        ?>
                        <div class="checkout-form-block edit-profile-form-block">
                            <div class="checkout_form_input_field <?php echo esc_attr($add_content_class); ?>">
                                <?php
                                if($field_name == 'username'){
                                    echo '<label class="checkout_form_input_label">'.esc_html__('User name','havezic').'</label>';
                                }else{
                                    echo '<label class="checkout_form_input_label">'.esc_html(BABE_html::checkout_field_label($field_name)).'</label>';
                                }
                                ?>
                                <input type="text" class="checkout_input_field checkout_input_required edit_profile_input_field edit_profile_input_required" name="<?php esc_attr($field_name); ?>" id="<?php esc_attr($field_name); ?>" value="<?php echo esc_attr($field_content) ?>" <?php echo esc_attr(apply_filters('babe_checkout_field_required', '', $field_name)); ?>/>
                                <div class="checkout_form_input_underline"><span class="checkout_form_input_ripple"></span></div>
                            </div>
                            <?php
                            if($field_name == 'username'){
                                echo '<div class="new-username-check"><span class="new-username-check-msg">' . esc_html__('This username already exists', 'havezic') . '</span></div>';
                            }
                            if($field_name == 'email'){
                                echo '<div class="new-email-check-msg">' . esc_html__('This email already exists', 'havezic') . '</div>';
                            }
                            ?>
                        </div>
                        <?php
                    }
                    ?>

                    <?php
                    apply_filters('babe_edit_user_profile_after_fields', '', $args);
                    ?>
                    <input type="hidden" name="action" value="edit_user_profile">
                    <div class="submit_group">
                        <button class="btn button edit_user_profile_submit"><?php esc_html_e('Update profile', 'havezic'); ?></button>
                        <div class="form-spinner"><i class="fas fa-spinner fa-spin"></i></div>
                    </div>
                </div>

            </div>
        </form>
    </div>

</div>
