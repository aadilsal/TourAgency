<?php
/**
 * BA Change password
 *
 * Override BABE_My_account::change_user_password()
 * @version 1.0.0
 */
?>
<div class="my_account_inner_page_block my_account_change_user_password">
    <h1 class="page-title"><?php esc_html_e('Change password', 'havezic'); ?></h1>
    <div class="dashboard-content-wrapper">
        <div class="dashboard-content-inner">
            <form id="change_user_password" name="change_user_password" method="post" action="">
                <div class="user_profile_fields_group input_group">
                    <div class="edit-profile-form-block">
                        <label class="edit_profile_form_input_label"><?php esc_html_e('Old Password *', 'havezic'); ?></label>
                        <div class="edit_profile_form_input_field">
                            <input type="password" class="edit_profile_input_field edit_profile_input_required" name="old_password" id="old_password" value="" required="required"/>
                        </div>
                    </div>
                    <div class="edit-profile-form-block">
                        <label class="edit_profile_form_input_label"><?php esc_html_e('New Password *', 'havezic'); ?></label>
                        <div class="edit_profile_form_input_field">
                            <input type="password" class="edit_profile_input_field edit_profile_input_required" name="new_password" id="new_password" value="" required="required"/>
                        </div>
                    </div>
                    <div class="edit-profile-form-block">
                        <label class="edit_profile_form_input_label"><?php esc_html_e('Confirm Password *', 'havezic'); ?></label>
                        <div class="edit_profile_form_input_field">
                            <input type="password" class="edit_profile_input_field edit_profile_input_required" name="new_password_again" id="new_password_again" value="" required="required"/>
                        </div>
                    </div>
                </div>
                <input type="hidden" name="action" value="change_user_password">
                <div class="submit_group">
                    <button class="btn button change_user_password_submit"><?php esc_html_e('Update password', 'havezic'); ?></button>
                </div>
            </form>
        </div>
    </div>
</div>
