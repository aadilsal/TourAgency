<?php
/**
 * BA Register
 *
 * Override BABE_My_account::get_register_form()
 * @version 1.0.0
 */

if (!get_option('users_can_register')) {
    return;
}
?>

<div id="login_registration">
    <div class="modal fade" id="registration" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-md" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title"><?php esc_html_e('Create an account', 'havezic'); ?></h2>
                    <button type="button" class="close" data-dismiss="modal" aria-label="<?php esc_attr_e('Close', 'havezic'); ?>">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>

                <div class="modal-body">

                    <form name="registration_form" id="registration_form" action="<?php echo esc_url(BABE_Settings::get_my_account_page_url(array('action' => 'registration'))); ?>" method="post">

                        <div class="new-username">
                            <label for="new_username"><?php esc_html_e('Username *', 'havezic'); ?></label>
                            <input type="text" name="new_username" id="new_username" class="input" value="" size="20" required="required">
                            <div class="new-username-check-msg"><?php esc_html_e('This username already exists*', 'havezic'); ?></div>
                        </div>

                        <div class="new-first-name">
                            <label for="new_first_name"><?php esc_html_e('First name', 'havezic'); ?></label>
                            <input type="text" name="new_first_name" id="new_first_name" class="input" value="" size="20" required="required">
                        </div>
                        <div class="new-last-name">
                            <label for="new_last_name"><?php esc_html_e('Last name', 'havezic'); ?></label>
                            <input type="text" name="new_last_name" id="new_last_name" class="input" value="" size="20" required="required">
                        </div>

                        <div class="new-email">
                            <label for="new_email"><?php esc_html_e('Your email *', 'havezic'); ?></label>
                            <input type="text" name="new_email" id="new_email" class="input" value="" size="20" required="required">
                            <div class="new-email-check-msg"><?php esc_html_e('This email already exists', 'havezic'); ?></div>
                        </div>
                        <div class="new-email">
                            <label for="new_email_confirm"><?php esc_html_e('Confirm email *', 'havezic'); ?></label>
                            <input type="text" name="new_email_confirm" id="new_email_confirm" class="input" value="" size="20" required="required">
                        </div>

                        <div class="statement">
                            <span class="register-notes"><?php esc_html_e('A password will be emailed to you.', 'havezic'); ?></span>
                        </div>
                        <input type="hidden" name="nonce" value="<?php echo esc_attr(wp_create_nonce('babe-nonce')) ?>">
                        <div class="new-submit">
                            <input type="submit" name="new-submit" id="new-submit" class="button button-primary" value="<?php esc_attr_e('Sign up', 'havezic'); ?>">
                            <div class="form-spinner"><i class="fas fa-spinner fa-spin"></i></div>
                        </div>

                    </form>

                </div>

            </div>
        </div>
    </div>
</div>
