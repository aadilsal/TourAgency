<?php

if ( ! function_exists( 'havezic_elementor_parse_text_editor' ) ) {
	function havezic_elementor_parse_text_editor( $content, $obj ) {
		$content = apply_filters( 'widget_text', $content, $obj->get_settings() );

		$content = shortcode_unautop( $content );
		$content = do_shortcode( $content );
		$content = wptexturize( $content );

		if ( $GLOBALS['wp_embed'] instanceof \WP_Embed ) {
			$content = $GLOBALS['wp_embed']->autoembed( $content );
		}

		return $content;
	}
}

if ( ! function_exists( 'havezic_elementor_get_strftime' ) ) {
	function havezic_elementor_get_strftime( $instance, $obj ) {
		$string = '';
		if ( $instance['show_days'] ) {
			$string .= $obj->render_countdown_item( $instance, 'label_days', 'days', 'elementor-countdown-days' );
		}
		if ( $instance['show_hours'] ) {
			$string .= $obj->render_countdown_item( $instance, 'label_hours', 'hours', 'elementor-countdown-hours' );
		}
		if ( $instance['show_minutes'] ) {
			$string .= $obj->render_countdown_item( $instance, 'label_minutes', 'minutes', 'elementor-countdown-minutes' );
		}
		if ( $instance['show_seconds'] ) {
			$string .= $obj->render_countdown_item( $instance, 'label_seconds', 'seconds', 'elementor-countdown-seconds' );
		}

		return $string;
	}
}