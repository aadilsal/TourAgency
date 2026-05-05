<?php

$post_id = get_the_ID();

$babe_post = BABE_Post_types::get_post($post_id);
if (!empty($babe_post) && isset($babe_post['faq']) && !empty($babe_post['faq'])) {
    $faqs_arr = BABE_Post_types::get_post_faq($babe_post);
    if (!empty($faqs_arr)) {
        ?>
        <div class="single-secticon-title"><?php echo esc_html__('FAQs', 'havezic'); ?></div>
        <?php
        foreach ($faqs_arr as $faq) {
            ?>
            <div class="block_faq">
                <?php printf('<div class="block_faq_title">%s</div>', $faq['post_title']); ?>
                <div class="block_faq_content">
                    <div class="content">
                        <?php echo wptexturize($faq['post_content']); ?>
                    </div>
                </div>
            </div>
            <?php
        }
    }
}
