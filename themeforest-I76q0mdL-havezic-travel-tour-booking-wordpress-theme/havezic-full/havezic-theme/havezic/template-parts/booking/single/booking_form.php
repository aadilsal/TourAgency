<?php

if ( \Elementor\Plugin::instance()->editor->is_edit_mode() ) {
    $post_id = havezic_ba_get_default_single_id();
} else {
    $post_id = get_the_ID();
}
$post   = get_post( $post_id );
$output = '';

if ( $post->post_type == BABE_Post_types::$booking_obj_post_type ) {

    $babe_post = BABE_Post_types::get_post( $post_id );

    $action = isset( $babe_post['services'] ) && ! empty( $babe_post['services'] ) && ! BABE_Settings::$settings['services_to_booking_form'] ? 'to_services' : 'to_checkout';

    $action = apply_filters( 'babe_booking_form_action', $action, $babe_post );

    ///// get rules
    $rules_cat = BABE_Booking_Rules::get_rule_by_obj_id( $post_id );

    ////// check dates for one time event
    if ( $rules_cat['rules']['basic_booking_period'] == 'single_custom' ) {
        $current_date_obj = BABE_Functions::datetime_local();
        $date_from_obj    = new DateTime( BABE_Calendar_functions::date_to_sql( $babe_post['start_date'] ) . ' ' . $babe_post['start_time'] );

        if ( $current_date_obj >= $date_from_obj ) {
            return $output;
        }
    }

    ///// get av times
    $av_times = BABE_Post_types::get_post_av_times( $babe_post );

    $modal_meeting_points = '';

    $i = 1;

    /////////date fields

    $date_from = isset( $_GET['date_from'] ) && BABE_Calendar_functions::isValidDate( $_GET['date_from'], BABE_Settings::$settings['date_format'] ) ? $_GET['date_from'] : '';
    $date_to   = isset( $_GET['date_to'] ) && BABE_Calendar_functions::isValidDate( $_GET['date_to'], BABE_Settings::$settings['date_format'] ) ? $_GET['date_to'] : '';

    if ( $date_from ) {
        if ( ! $date_to ) {
            $date_to = $date_from;
        }
        $av_cal = BABE_Calendar_functions::get_av_cal( $post_id, BABE_Calendar_functions::date_to_sql( $date_from ) . ' 00:00:00', BABE_Calendar_functions::date_to_sql( $date_to ) . ' 23:59:59' );
        if ( empty( $av_cal ) || empty( $av_cal[ BABE_Calendar_functions::date_to_sql( $date_from ) ]['start_day'] ) ) {
            $date_from = '';
            $date_to   = '';
        }
    }

    $input_time_from = '';
    $input_time_to   = '';

    if ( $rules_cat['rules']['basic_booking_period'] == 'day' ) {
        $time_select_arr = BABE_html::get_time_select_arr( $date_from, $post_id, true );
        $input_time_from
            = '<div id="booking_time_from_block" class="booking-time-block">
                   ' . BABE_html::input_select_field( 'booking_time_from', '', $time_select_arr, ( isset( $_GET['time_from'] ) ? $_GET['time_from'] : false ) ) . '
                   </div>';
        $time_select_arr = BABE_html::get_time_select_arr( $date_to, $post_id, false, ( $date_from == $date_to && isset( $_GET['time_from'] ) ? $_GET['time_from'] : '00:00' ) );
        $input_time_to
            = '<div id="booking_time_to_block" class="booking-time-block">
                   ' . BABE_html::input_select_field( 'booking_time_to', '', $time_select_arr, ( isset( $_GET['time_to'] ) ? $_GET['time_to'] : false ) ) . '
                   </div>';
    }

    $input_fields = array();

    $input_fields = apply_filters( 'babe_booking_form_before_date_from', $input_fields, $babe_post, $av_times, $rules_cat );

    if ( $rules_cat['rules']['basic_booking_period'] == 'single_custom' ) {

        if ( isset( $babe_post['start_time'] ) && $babe_post['start_time'] && isset( $babe_post['end_time'] ) && $babe_post['end_time'] ):
            /////////////////

            $date_to_obj = new DateTime( BABE_Calendar_functions::date_to_sql( $babe_post['end_date'] ) . ' ' . $babe_post['end_time'] );
            $dates       = $date_from_obj->format( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ) ) . ' - ';
            if ( $date_from_obj->format( 'Y-m-d' ) != $date_to_obj->format( 'Y-m-d' ) ) {
                $dates .= $date_to_obj->format( get_option( 'date_format' ) ) . ' ';
            }
            $dates .= $date_to_obj->format( get_option( 'time_format' ) );

            $input_time_from = '<input type="hidden" name="booking_time_from" autocomplete="off" id="booking_time_from" value="' . $date_from_obj->format( 'H:i' ) . '"><input type="hidden" name="booking_time_to" autocomplete="off" id="booking_time_to" value="' . $date_to_obj->format( 'H:i' ) . '"><input type="hidden" id="booking_date_from" name="booking_date_from" value="' . $babe_post['start_date'] . '" data-post-id="' . $post_id . '"><input type="hidden" id="booking_date_to" name="booking_date_to" value="' . $babe_post['end_date'] . '">';

            $input_fields[]
                = '
            <div class="booking-form-block booking-date-block">
                <label class="booking_form_input_label"><span class="booking_form_step_num">' . $i . '</span><i class="far fa-calendar-alt"></i></label>
            <div class="booking-date">
                   ' . $dates . '
                   ' . $input_time_from . '
			</div>
            
            </div>';
            $i ++;

        endif;

    } else {

        $input_fields[]
            = '
            <div class="booking-form-block booking-date-block">
            <div class="booking-date">
                   <i class="havezic-icon-calendar left"></i>
				   <input type="text" class="booking_date" autocomplete="off" id="booking_date_from" name="booking_date_from" value="' . $date_from . '" placeholder="' . apply_filters( 'babe_booking_form_date_from_placeholder', esc_html__( 'When (Date)', 'havezic' ) ) . '" data-post-id="' . $post_id . '">
				   <i class="havezic-icon-arrow-down right"></i>
                   ' . $input_time_from . '
			</div>
            
            </div>';
        $i ++;

    }

    $input_fields = apply_filters( 'babe_booking_form_after_date_from', $input_fields, $babe_post, $av_times, $rules_cat );

    if ( $rules_cat['rules']['basic_booking_period'] != 'recurrent_custom' && $rules_cat['rules']['basic_booking_period'] != 'single_custom' ) {
        $input_fields[]
            = '
                <div class="booking-form-block booking-date-block">
                <span class="label">' . esc_html__('check out', 'havezic') . '</span>
            <div class="booking-date">
				   <input type="text" class="booking_date" autocomplete="off" id="booking_date_to" name="booking_date_to" value="' . $date_to . '" placeholder="' . apply_filters( 'babe_booking_form_date_to_placeholder', esc_html__( 'Departure Date', 'havezic' ) ) . '" data-post-id="' . $post_id . '">
				   <i class="havezic-icon-calendar right"></i>
                   ' . $input_time_to . '
			</div>
            </div>';
        $i ++;

        $input_fields = apply_filters( 'babe_booking_form_after_date_to', $input_fields, $babe_post, $av_times, $rules_cat );

    }

    $check_add_av_times = $rules_cat['rules']['basic_booking_period'] == 'recurrent_custom';
    $check_add_av_times = apply_filters( 'babe_booking_form_check_add_av_times', $check_add_av_times, $av_times, $babe_post, $rules_cat );

    ////////////Time fields///////////
    if ( $check_add_av_times ) {

        //// get AV time spans by AJAX
        $input_fields[]
            = '<div class="booking-form-block booking-times-block">
                <label class="booking_form_input_label"><span class="booking_form_step_num">' . $i . '</span>' . apply_filters( 'babe_booking_form_time_label', esc_html__( 'Time', 'havezic' ) ) . '</label>
                <div id="booking-times" class="booking-date-times">
			    </div>
                </div>';

        $i ++;

        $input_fields = apply_filters( 'babe_booking_form_after_av_times', $input_fields, $babe_post, $av_times, $rules_cat );

    }
    //////////////Guests fields/////////

    if ( ! isset( $rules_cat['category_meta']['categories_remove_guests'] ) || ! $rules_cat['category_meta']['categories_remove_guests'] ) {

        $guests = isset( $_GET['guests'] ) && is_array( $_GET['guests'] ) ? $_GET['guests'] : array();
        $guests_output ='';
        if ( ! empty( $guests ) && $date_from && $rules_cat['rules']['basic_booking_period'] != 'recurrent_custom' ) {

            $main_age_id = BABE_Post_types::get_main_age_id();
            if ( empty( $guests[0] ) ) {
                $guests[0] = array_sum( $guests );
            } elseif ( sizeof( $guests ) == 1 ) {
                $guests[ $main_age_id ] = $guests[0];
            }

            $date_from_sql = BABE_Calendar_functions::date_to_sql( $date_from );

            $date_to_sql = $date_to ? BABE_Calendar_functions::date_to_sql( $date_to ) : $date_to;

            $av_guests = BABE_Calendar_functions::get_av_guests( $post_id, $date_from_sql, $date_to_sql );

            $guests = array_map( 'absint', $guests );

            $guests_output = BABE_html::booking_form_select_guests( $post_id, $av_guests, $date_from_sql, $date_to_sql, $guests );

        } else{
            $ages = BABE_Post_types::get_ages_arr();
            $post_ages = BABE_Post_types::get_post_ages($post_id);
            if (empty($post_ages)){

                if (!$rules_cat['rules']['ages'] || empty($ages)){

                    $post_ages[0] = array(
                        'age_id' => 0,
                        'name' => '',
                        'description' => '',
                        'menu_order' => 1,
                        'slug' => '',
                    );

                } else {
                    $post_ages = $ages;
                }
            }

            foreach ($post_ages as $age_term){
                $age_term['description'] = $age_term['description'] ? ' ('.$age_term['description'].')' : '';

                $field_title = $age_term['name'] ? $age_term['name'] . $age_term['description'] : '';
                $guests_output .= '<div class="guests-block-adults"><label class="label-guests">'. esc_html($field_title) .'</label><div class="content"><span class="value-default">'.esc_html__('0', 'havezic').'</span><i class="havezic-icon-arrow-down"></i></div></div>';
            }


        }

        $input_fields[]
            = '<div class="booking-form-block booking-guests-block">
            <label class="booking_form_input_label">' . apply_filters( 'babe_booking_form_guests_label', esc_html__( 'Tickets', 'havezic' ) ) . '</label>
            <div id="booking-guests-result">
            ' . $guests_output . '
            </div>
            </div>';
        $i ++;

        $input_fields = apply_filters( 'babe_booking_form_after_guests', $input_fields, $babe_post, $av_times, $rules_cat );

    }

    ////////////Meeting points///////////

    if ( BABE_Settings::$settings['mpoints_active'] && ! empty( $babe_post ) && isset( $babe_post['meeting_points'] ) && isset( $babe_post['meeting_place'] ) && $babe_post['meeting_place'] == 'point' ) {

        $meeting_points = BABE_Post_types::get_post_meeting_points( $babe_post );

        if ( ! empty( $meeting_points ) ) {
            $meeting_points_output = array();
            foreach ( $meeting_points as $point_id => $meeting_point ) {
                $meeting_points_output[]
                    = '<div class="booking_meeting_point_line">
                <input type="radio" class="booking_meeting_point" name="booking_meeting_point" value="' . $point_id . '" id="booking_meeting_point_' . $point_id . '" data-point-id="' . $point_id . '">
                <label for="booking_meeting_point_' . $point_id . '">' . implode( ', ', $meeting_point['times'] ) . ' - <a href="' . $meeting_point['permalink'] . '" target="_blank" open-mode="modal" data-obj-id="' . $point_id . '" data-lat="' . $meeting_point['lat'] . '" data-lng="' . $meeting_point['lng'] . '" data-address="' . $meeting_point['address'] . '" >' . $meeting_point['address'] . '</a></label>
              </div>';
            }

            $find_closes_loc_text = BABE_Settings::$settings['google_map_remove'] || is_admin() ? '' : ' (' . '<a href="#block_meeting_points">' . esc_html__( 'find closest location', 'havezic' ) . '</a>' . ')';

            $input_fields[] = apply_filters( 'babe_booking_form_meeting_points', '<div class="booking-form-block booking-meeting-point">
              <label class="booking_form_input_label"><span class="booking_form_step_num">' . $i . '</span>' . esc_html__( 'Select meeting point', 'havezic' ) . $find_closes_loc_text . ':</label>
              ' . implode( ' ', $meeting_points_output ) . '
              </div>', $meeting_points_output, $meeting_points, $babe_post, $i );
            $i ++;

            $input_fields = apply_filters( 'babe_booking_form_after_meeting_points', $input_fields, $babe_post, $av_times, $rules_cat );

            if ( ! is_admin() ) {

                $modal_meeting_points
                    = '<div id="babe_overlay_container">
            <div id="block_address_map_with_direction" class="babe_overlay_inner">
              <span id="modal_close"><i class="fas fa-times"></i></span>
              
                <h3>' . esc_html__( 'Find a route from your location', 'havezic' ) . '</h3>
              
                <div id="google_map_address_with_direction" data-obj-id="" data-lat="" data-lng="" data-address="">
                </div>
                
                <div id="route_to_buttons">
                    <button id="route_to_button_ok" data-point-id="" class="btn button route_to_point_button">' . esc_html__( 'Ok', 'havezic' ) . '</button>
                </div>  

            </div>
          </div>
          <div id="babe_overlay"></div>';

            }

        } //// end if !empty($meeting_points)
    }

    /////////////////////////////////////

    $input_fields['services'] = '';
    if ( BABE_Settings::$settings['services_to_booking_form'] ) {

        $services_html = havezic_ba_list_add_services( $babe_post );

        if ( $services_html ) {
            $input_fields['services']
                = '
              <div class="booking-form-block booking-services-block">
               <label class="booking_form_input_label">' . apply_filters( 'babe_booking_form_services_label', esc_html__( 'Extra services', 'havezic' ) ) . '</label>
               <div class="booking_services_inner">
               ' . $services_html . '
               </div>
              </div>';
        }

    }

    ////////////////////////////////////

    $input_fields = apply_filters( 'babe_booking_form_input_fields', $input_fields, $babe_post, $av_times, $rules_cat );

    $after_hidden_fields = apply_filters( 'babe_booking_form_after_hidden_fields', '', $babe_post, $av_times, $rules_cat );

    $output .= '<form id="booking_form" autocomplete="off" name="booking_form" method="post" action="" data-post-id="' . $post_id . '" class="booking_form_type_' . $rules_cat['rules']['basic_booking_period'] . '">
            
            <div class="input_group">
            
            ' . implode( '', $input_fields ) . '
            
            </div>
            
            <div id="total_group">
                <div id="booking_form_total">
                </div>
            </div>
            
            <div id="error_group">
                <label class="booking_form_error_label">' . esc_html__( 'Please fill in all the data.', 'havezic' ) . '</label>
            </div>
            
            <input type="hidden" name="booking_obj_id" value="' . $post_id . '">
            <input type="hidden" name="action" value="' . $action . '">
            ' . $after_hidden_fields . '
            
            <div class="submit_group">
               
               <button class="button button-style booking_form_submit" data-post-id="' . $post_id . '"> <span class="elementor-button-icon left"><i class="havezic-icon-arrow-small-right"></i></span>' . apply_filters( 'babe_booking_form_submit_button_label', esc_html__( 'Book Now', 'havezic' ) ) . '<span class="elementor-button-icon right"><i class="havezic-icon-arrow-small-right"></i></span></button>
               
            </div>
            
            </form>';


    $output = apply_filters( 'babe_booking_form_html', $output, $babe_post, $input_fields, $after_hidden_fields );

}
if ( $output ) {
    $output
        = '
            <div id="booking_form_block">
            <h6 class="babe_post_content_title">'.  esc_html__('Book This Tour', 'havezic') .'</h6>
            ' . $output . '
              
            ' . $modal_meeting_points . '
            </div>';
}
printf( '%s', $output );
