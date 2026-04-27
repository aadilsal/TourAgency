<?php
/**
 * BA Account
 *
 * Override BABE_My_account::my_account_content()
 * @version 1.0.0
 */

$user_info = wp_get_current_user();
$check_role = BABE_My_account::validate_role($user_info);
if (!$check_role) {
    return;
}

$nav_arr = BABE_My_account::get_nav_arr($check_role);

$current_nav_slug_arr = BABE_My_account::get_current_nav_slug($nav_arr);
$current_nav_slug     = key($current_nav_slug_arr);
?>

    <?php Havezic_BA_Booking::load_template_part( 'dashboard/header' ); ?>

    <div id="my_account_page_wrapper">
        <div class="my_account_page_nav_wrapper mCustomScrollbar">
            <input type="text" class="my_account_page_nav_selector" name="<?php echo esc_attr($current_nav_slug);?>_label" value="<?php echo esc_attr($current_nav_slug_arr[$current_nav_slug]); ?>">
            <div class="my_account_page_nav_list">
                <?php Havezic_BA_Booking::load_template_part( 'dashboard/navigation' ); ?>
            </div>
        </div>
        <div class="my_account_page_content_wrapper">
            <div class="my_account_page_content_inner">
                <div class="container">
                    <?php
                    $account_page_var = 'dashboard';
                    if( isset($_GET[BABE_My_account::$account_page_var]) ){
                        $account_page_var = $_GET[BABE_My_account::$account_page_var];
                    }

                    if ($account_page_var == 'dashboard') {
                        Havezic_BA_Booking::load_template_part( 'dashboard/profile' );
                        Havezic_BA_Booking::load_template_part( 'dashboard/order' );
                    }else{
                        $post_type_arr = array(
                            'all-posts-to_book' => BABE_Post_types::$booking_obj_post_type,
                            'all-posts-faq' => BABE_Post_types::$faq_post_type,
                            'all-posts-service' => BABE_Post_types::$service_post_type,
                            'all-posts-fee' => BABE_Post_types::$fee_post_type,
                        );
                        if (isset($post_type_arr[$account_page_var])){
                            //// get posts list
                            havezic_get_all_posts_html($post_type_arr[$account_page_var], $user_info);
                        }else{
                            Havezic_BA_Booking::load_template_part( 'dashboard/'.$_GET[BABE_My_account::$account_page_var] );
                        }
                    }

                    ?>
                </div>
            </div>
        </div>
    </div>

