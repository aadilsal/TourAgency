<?php

$post_id       = get_the_ID();
$babe_post     = BABE_Post_types::get_post($post_id);
$data_checkin  = get_post_meta($post_id, 'havezic_checkin_section', 1);
$data_checkout = get_post_meta($post_id, 'havezic_checkout_section', 1);

if (!empty($data_checkin) || !empty($data_checkout) || (isset($babe_post['steps']) && !empty($babe_post['steps']))) {
    ?>
    <div class="single-secticon-title"><?php echo esc_html__('Room Rules', 'havezic'); ?></div>
    <?php
}
?>
    <div class="d-grid grid-columns-1 grid-columns-tablet-1 grid-columns-desktop-2">
        <?php
        if (!empty($data_checkin) && is_array($data_checkin)) {
            ?>
            <div class="grid-item">
                <div class="content-title"> <?php echo esc_html__('Check-in', 'havezic'); ?> </div>
                <ul class="list-items">
                    <?php
                    foreach ($data_checkin as $datum) {
                        if (isset($datum['havezic_checkin']) && !empty($datum['havezic_checkin'])) {
                            echo '<li class="list-item">';
                            echo '<span class="list-text">' . esc_attr($datum['havezic_checkin']) . '</span>';
                            echo '</li>';
                        }
                    }
                    ?>
                </ul>
            </div>
            <?php
        }

        if (!empty($data_checkout) && is_array($data_checkout)) {
            ?>
            <div class="grid-item">
                <div class="content-title"> <?php echo esc_html__('Check-out', 'havezic'); ?> </div>
                <ul class="list-items">
                    <?php
                    foreach ($data_checkout as $datum) {
                        if (isset($datum['havezic_checkout']) && !empty($datum['havezic_checkout'])) {
                            echo '<li class="list-item">';
                            echo '<span class="list-text">' . esc_attr($datum['havezic_checkout']) . '</span>';
                            echo '</li>';
                        }
                    }
                    ?>
                </ul>
            </div>
            <?php
        }
        ?>
    </div>
<?php

if (!empty($babe_post) && isset($babe_post['steps']) && !empty($babe_post['steps'])) {

    foreach ($babe_post['steps'] as $step) {
        if (isset($step['attraction']) && isset($step['title'])) {
            ?>
            <div class="description-rules">
                <div class="content-title"> <?php echo apply_filters('translate_text', $step['title']); ?> </div>
                <div class="content">
                    <?php echo wpautop($step['attraction']); ?>
                </div>
            </div>
            <?php
        }
    }
}

