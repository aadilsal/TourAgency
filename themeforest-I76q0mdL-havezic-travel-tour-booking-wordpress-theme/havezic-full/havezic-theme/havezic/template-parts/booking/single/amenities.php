<?php

$amenities = BABE_Post_types::$attr_tax_pref . 'amenities';
$terms    = get_the_terms(get_the_ID(), $amenities);

if (isset($terms) && !empty($terms)) {
    ?>
    <div class="single-secticon-title"><?php echo esc_html__('In-room Amenities Include', 'havezic'); ?></div>
    <ul class="list-items list-items-amenities">
        <?php
        foreach ($terms as $term) {
            ?>
            <li title="<?php echo esc_attr($term->name); ?>"><?php echo '<span>' . esc_html($term->name) . '</span>'; ?></li>
            <?php
        }
        ?>
    </ul>
    <?php
}