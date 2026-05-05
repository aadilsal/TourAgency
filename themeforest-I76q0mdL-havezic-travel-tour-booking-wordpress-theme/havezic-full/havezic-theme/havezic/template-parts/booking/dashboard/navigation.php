<?php
/**
 * BA Navigation
 *
 * Override BABE_My_account::get_nav_html()
 * @version 1.0.0
 */

$user_info  = wp_get_current_user();
$check_role = BABE_My_account::validate_role($user_info);

$nav_arr    = BABE_My_account::get_nav_arr($check_role);
$current_nav_slug_arr = BABE_My_account::get_current_nav_slug($nav_arr);
$current_nav_slug     = key($current_nav_slug_arr);
$depth = 0;
?>

<ul class="my_account_nav_list my_account_nav_list_<?php echo esc_attr($depth) ?>">
    <?php
    foreach ($nav_arr as $nav_slug => $nav_item) {

        $current_page_class = 'my_account_nav_item my_account_nav_item_' . $nav_slug . ' my_account_nav_item_' . $depth;
        $current_page_class .= $current_nav_slug == $nav_slug ? ' my_account_nav_item_current' : '';?>
        <li class="<?php echo esc_attr($current_page_class); ?>">
            <?php
            if (is_array($nav_item)) {
                $current_page_class .= ' my_account_nav_item_with_menu';
                $nav_item['title'] = isset($nav_item['title']) ? $nav_item['title'] : '';

                printf("%s",Havezic_BA_Booking::get_nav_item_html($nav_slug, $nav_item['title'], $depth, false));
                unset($nav_item['title']);
                printf("%s",Havezic_BA_Booking::get_nav_html($nav_item, $current_nav_slug, ($depth + 1)));

            } else {
                printf("%s",Havezic_BA_Booking::get_nav_item_html($nav_slug, $nav_item, $depth));
            }?>
        </li>
    <?php
    }
    ?>
</ul>
