<?php
/**
 * BA Order
 *
 * Override BABE_My_account::get_my_bookings_html()
 * @version 1.0.0
 */

$user_info  = wp_get_current_user();
$check_role = BABE_My_account::validate_role($user_info);
$title      = esc_html__('My Booking','havezic');

if ($check_role == 'manager') {
    $orders      = BABE_Order::get_all_orders();
    $posts_pages = BABE_Order::$get_posts_pages;
    $title      = esc_html__('Orders','havezic');
} else {
    $orders      = BABE_Order::get_customer_orders($user_info->ID);
    $posts_pages = 1;
}

$orders = apply_filters('babe_myaccount_my_bookings_all_orders', $orders, $user_info);

$table_head = BABE_My_account::orders_table_head($user_info);
$cols       = count($table_head);
?>

<div class="orders_page_wrapper">
    <h1 class="page-title"><?php echo esc_html($title); ?></h1>
    <div class="dashboard-content-wrapper">
        <table class="my_account_my_bookings_table">
            <thead>
            <tr>
                <?php
                foreach ($table_head as $column_name => $column_title) {
                    echo '<th>' . esc_html($column_title) . '</th>';
                }
                ?>
            </tr>
            </thead>
            <tbody>
            <?php
            foreach ($orders as $order) {
                $order_items_html = BABE_html::order_items($order['ID']);
                $customer_html    = BABE_html::order_customer_details($order['ID']);
                $customer_html    = apply_filters('babe_myaccount_my_bookings_customer_html', $customer_html, $order, $user_info); ?>

                <tr>
                    <?php
                    foreach ($table_head as $column_name => $column_title) { ?>
                        <td class="my_account_my_bookings_table_td my_bookings_table_td_<?php echo esc_attr($column_name) ?>"><?php printf("%s", BABE_My_account::orders_table_content($column_name, $order['ID'], $user_info)); ?></td>
                        <?php
                    }
                    ?>
                </tr>
                <tr>
                    <td class="my_account_my_bookings_table_td my_bookings_table_td_expand" colspan="<?php echo esc_attr($cols); ?>" data-order-id="<?php echo esc_attr($order['ID']); ?>">
                        <?php
                        printf("%1s %2s", $order_items_html, $customer_html);
                        ?>
                    </td>
                </tr>
                <?php
            }
            ?>
            </tbody>
        </table>
    </div>
    <div class="my_account_inner_page_block my_account_my_bookings">

        <div class="my_account_my_bookings_inner">
            <?php
            printf("%s", BABE_Functions::pager($posts_pages));
            ?>
        </div>
    </div>
</div>
