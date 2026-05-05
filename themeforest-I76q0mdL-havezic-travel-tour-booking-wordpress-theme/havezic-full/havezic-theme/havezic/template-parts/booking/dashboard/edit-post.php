<?php
/**
 * BA edit post
 *
 * Override BABE_My_account::get_edit_post_html()
 * @version 1.0.0
 */

if (isset($_GET['edit_post_id']) && $_GET['edit_post_id'] && BABE_Users::current_user_can_edit_post($_GET['edit_post_id'])){
    $user_info  = wp_get_current_user();
    $output = '';
    $post_id = $_GET['edit_post_id'];
    $post_type = get_post_type($post_id);
    $post_type_arr = array(
        BABE_Post_types::$booking_obj_post_type => 'booking_obj_metabox',
        BABE_Post_types::$faq_post_type => 'faq_metabox',
        BABE_Post_types::$service_post_type => 'service_metabox',
        BABE_Post_types::$fee_post_type => 'fee_metabox',
    );

    if ($post_type && isset($post_type_arr[$post_type])){
        $post_type_obj = get_post_type_object( $post_type );
?>
        <div class="my_account_inner_page_block my_account_edit_post">
            <h1 class="page-title"><?php echo esc_html($post_type_obj->labels->edit_item); ?></h1>
            <div class="dashboard-content-wrapper">
                <div class="my_account_edit_post_inner">
                    <?php printf("%s",cmb2_get_metabox_form( $post_type_arr[$post_type], $post_id )); ?>
                </div>
            </div>

        </div>
<?php
    }
}

?>
