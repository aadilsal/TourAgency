<?php
/**
 * BA Dashboard template
 *
 * @version 1.0.0
 */
?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=2.0">
    <link rel="profile" href="//gmpg.org/xfn/11">
    <link rel="pingback" href="<?php bloginfo('pingback_url'); ?>">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<?php
if( !is_user_logged_in() ){
    get_header();
} ?>
<div id="page" class="hfeed site">
    <div id="content" class="site-content site-dashboard" tabindex="-1">
        <div id="primary">
            <main id="main" class="site-main">
                <?php
                $user_info = wp_get_current_user();
                if ($user_info->ID > 0) {
                    Havezic_BA_Booking::load_template_part( 'dashboard/account' );
                }else{
                    if (isset($_GET['action']) && $_GET['action'] == 'lostpassword') {
                        /*user lost password*/
                        Havezic_BA_Booking::load_template_part( 'dashboard/lost-password' );
                    } else {
                        /*user login form*/
                        $classes = get_option('users_can_register') ? 'login_register_page' : 'login_page';
                        ?>
                        <div class="my_account_page_content_wrapper <?php echo esc_attr($classes); ?>">
                            <?php  Havezic_BA_Booking::load_template_part( 'dashboard/login' ); ?>
                            <?php Havezic_BA_Booking::load_template_part( 'dashboard/register' ); ?>
                        </div>
                <?php
                    }
                }
                ?>
            </main><!-- #main -->
        </div><!-- #primary -->
    </div>
</div>
<?php
if( !is_user_logged_in() ){
    get_footer();
}else{
    wp_footer();
}?>
</body>
</html>
