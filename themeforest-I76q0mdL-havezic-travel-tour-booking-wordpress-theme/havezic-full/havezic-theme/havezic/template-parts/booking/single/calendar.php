<?php
/**
 * BA Single Calendar
 *
 * Override BABE_html::block_calendar($babe_post)
 * @version 1.0.0
 */

if ( \Elementor\Plugin::instance()->editor->is_edit_mode() ) {
    $post_id = havezic_ba_get_default_single_id();
} else {
    $post_id = get_the_ID();
}
$babe_post = get_post( $post_id );

if ( is_single() && $babe_post->post_type == BABE_Post_types::$booking_obj_post_type) {

    $babe_post = BABE_Post_types::get_post($babe_post->ID);

    $post_id = isset( $babe_post['ID'] ) ? intval( $babe_post['ID'] ) : 0;

    if ( $post_id ) {

        $av_cal = BABE_Calendar_functions::get_av_cal( $post_id );

        if ( ! empty( $av_cal ) ) {

            $date_now_obj = BABE_Functions::datetime_local();

            ///// get rules
            $rules_cat = BABE_Booking_Rules::get_rule_by_obj_id( $post_id );

            //// get discount
            $discount_arr = BABE_Post_types::get_post_discount( $post_id );

            ///// create calendar by month
            $date_current     = $date_now_obj->format( 'Y-m-01' );
            $date_obj_current = new DateTime( $date_current );
            $date_end         = clone( $date_obj_current );
            $date_end->modify( '+' . absint( BABE_Settings::$settings['av_calendar_max_months'] ) . ' months' );
            $interval   = new DateInterval( 'P1M' );
            $daterange  = new DatePeriod( $date_obj_current, $interval, $date_end );
            $month_html = '';
            $i          = 0;
            ?>
            <?php $this->title_render(); ?>
            <div id="av-cal">
                <?php
                foreach ( $daterange as $date_obj ) {
                    $block_class = ! $i ? 'cal-month-active' : '';
                    printf("%s",BABE_html::get_calendar_month_html( $date_obj->format( 'Y-m-01' ), $av_cal, $discount_arr, $rules_cat, $block_class ));
                    $i ++;
                }

                ?>
            </div>
            <?php
        }

    } //// end if $post_id
}
