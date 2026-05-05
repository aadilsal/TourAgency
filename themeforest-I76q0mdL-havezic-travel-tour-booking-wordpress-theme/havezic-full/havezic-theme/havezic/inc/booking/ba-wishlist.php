<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}


if ( ! class_exists( 'Havezic_BA_Booking_Wishlist' ) ) :
	class Havezic_BA_Booking_Wishlist {

		public function __construct() {

			add_action( 'admin_init', array( $this, 'settings_page_wishlist' ), 10 );

			add_filter( 'babe_sanitize_' . BABE_Settings::$option_name, array( $this, 'sanitize_settings' ), 10, 2 );

			add_action( 'wp_enqueue_scripts', array( $this, 'wishlist_enqueue_scripts' ), 10 );

			//add wishlist
			add_action( 'wp_ajax_ba_ajax_update_wishlist', array( $this, 'ajax_update_wishlist' ) );
			add_action( 'wp_ajax_nopriv_ba_ajax_update_wishlist', array( $this, 'ajax_update_wishlist' ) );

			//remove wishlist
			add_action( 'wp_ajax_ba_ajax_remove_wishlist', array( $this, 'ajax_remove_wishlist' ) );
			add_action( 'wp_ajax_nopriv_ba_ajax_remove_wishlist', array( $this, 'ajax_remove_wishlist' ) );
		}

		public function create_page_wishlist() {
			$page_wishlist_id = BABE_Install::create_page( 'ba-wishlist', 'ba_wishlist', esc_html__( 'Ba Wishlist', 'havezic' ), '[ba_wishlist]' );

			return $page_wishlist_id;
		}


		public function settings_page_wishlist() {
			add_settings_section(
				'setting_section_wishlist', // ID
				__( 'Wishlist', 'havezic' ), // Title
				'__return_false', // Callback
				BABE_Settings::$option_menu_slug // Page
			);

			add_settings_field(
				'wishlist_active', // ID
				__( 'Enable wishlist?', 'havezic' ), // Title
				array( $this, 'setting_wishlist_active' ), // Callback
				BABE_Settings::$option_menu_slug, // Page
				'setting_section_wishlist' // Section
			);

			add_settings_field(
				'wishlist_page', // ID
				__( 'Select wishlist page', 'havezic' ), // Title
				array( $this, 'setting_page_select' ), // Callback
				BABE_Settings::$option_menu_slug, // Page
				'setting_section_wishlist',  // Section
				array( 'option' => 'wishlist_page', 'settings_name' => BABE_Settings::$option_name ) // Args array
			);

			add_settings_field(
				'wishlist_icon', // ID
				__( 'Wishlish icon class', 'havezic' ), // Title
				array( $this, 'text_field_callback' ), // Callback
				BABE_Settings::$option_menu_slug, // Page
				'setting_section_wishlist',  // Section
				array( 'option' => 'wishlist_icon', 'settings_name' => BABE_Settings::$option_name ) // Args array
			);

			add_settings_field(
				'wishlist_added', // ID
				__( 'Wishlish added text', 'havezic' ), // Title
				array( $this, 'text_field_added_callback' ), // Callback
				BABE_Settings::$option_menu_slug, // Page
				'setting_section_wishlist',  // Section
				array( 'option' => 'wishlist_added', 'settings_name' => BABE_Settings::$option_name ) // Args array
			);
		}

		public static function setting_wishlist_active() {

			$check = isset( BABE_Settings::$settings['wishlist_active'] ) ? BABE_Settings::$settings['wishlist_active'] : 0;

			$checked1 = $check ? 'checked' : '';
			$checked2 = ! $check ? 'checked' : '';

			echo '<p><input id="' . BABE_Settings::$option_name . '[wishlist_active]1" name="' . BABE_Settings::$option_name . '[wishlist_active]" type="radio" value="1" ' . $checked1 . '/><label id="' . BABE_Settings::$option_name . '_wishlist_active1" for="' . BABE_Settings::$option_name . '[wishlist_active]1">' . esc_html__( 'Yes', 'havezic' ) . '</label></p>';
			echo '<p><input id="' . BABE_Settings::$option_name . '[wishlist_active]2" name="' . BABE_Settings::$option_name . '[wishlist_active]" type="radio" value="0" ' . $checked2 . '/><label id="' . BABE_Settings::$option_name . '_wishlist_active2" for="' . BABE_Settings::$option_name . '[wishlist_active]2">' . esc_html__( 'No', 'havezic' ) . '</label></p>';

		}

		public function text_field_callback( $args ) {
			$add_class = isset( $args['translate'] ) ? ' class="q_translatable"' : '';

			printf(
				'<input type="text"' . $add_class . ' id="' . $args['option'] . '" name="' . $args['settings_name'] . '[' . $args['option'] . ']" value="%s" />',
				isset( BABE_Settings::$settings[ $args['option'] ] ) ? esc_attr( BABE_Settings::$settings[ $args['option'] ] ) : 'havezic-icon-heart'
			);
		}

		public function text_field_added_callback( $args ) {
			$add_class = isset( $args['translate'] ) ? ' class="q_translatable"' : '';

			printf(
				'<input type="text"' . $add_class . ' id="' . $args['option'] . '" name="' . $args['settings_name'] . '[' . $args['option'] . ']" value="%s" />',
				isset( BABE_Settings::$settings[ $args['option'] ] ) ? esc_attr( BABE_Settings::$settings[ $args['option'] ] ) : 'Product added!'
			);
		}

		public function setting_page_select( $args ) {

			$page_wishlist = $this->create_page_wishlist();

			$selected_page = isset( BABE_Settings::$settings[ $args['option'] ] ) ? BABE_Settings::$settings[ $args['option'] ] : $page_wishlist;

			$args2 = array(
				'post_type'   => 'page',
				'numberposts' => - 1,
				'post_status' => 'publish',
				'orderby'     => 'menu_order',
				'order'       => 'ASC',
			);

			$posts = get_posts( $args2 );

			$post_options = '';
			if ( $posts ) {
				foreach ( $posts as $post ) {
					$post_options .= '<option value="' . $post->ID . '" ' . selected( $selected_page, $post->ID, false ) . '>' . $post->post_title . '</option>';
				}
			}

			$post_options = $post_options ? '<select id="' . $args['option'] . '" name="' . $args['settings_name'] . '[' . $args['option'] . ']">
        ' . $post_options . '
        </select>' : '';
			printf( '%s', $post_options );

		}


		public function sanitize_settings( $new_input, $input ) {
			$new_input['wishlist_active'] = sanitize_text_field( $input['wishlist_active'] );
			$new_input['wishlist_page']   = sanitize_text_field( $input['wishlist_page'] );
			$new_input['wishlist_icon']   = sanitize_text_field( $input['wishlist_icon'] );
			$new_input['wishlist_added']  = sanitize_text_field( $input['wishlist_added'] );

			return $new_input;
		}


		public static function add_to_wishlist( $book_id ) {

			$wishlist_active = isset( BABE_Settings::$settings['wishlist_active'] ) ? BABE_Settings::$settings['wishlist_active'] : false;

			if ( ! $wishlist_active ) {
				return;
			}

			if ( is_user_logged_in() ) {
				$wishlist = self::get_wishlist_book_ids();
				$page_id  = isset( BABE_Settings::$settings['wishlist_page'] ) ? BABE_Settings::$settings['wishlist_page'] : self::create_page_wishlist();

				$page_link = site_url();
				if ( - 1 != $page_id ) {
					$page_link = get_permalink( $page_id );
				}

				$is_in_wishlist = ( $wishlist ) ? ( in_array( $book_id, $wishlist ) ) : false;
				$wishlist_link  = ( $is_in_wishlist ) ? $page_link : '?add_to_wishlist=' . $book_id;
				$class          = ( $is_in_wishlist ) ? 'in-wishlist ' : 'add-wishlist';
				$text           = ( $is_in_wishlist ) ? esc_html__( 'View list Wishlist', 'havezic' ) : esc_html__( 'Add to wishlist', 'havezic' );
			} else {
				$wishlist_link = '#havezic-login-form';
				$class         = 'login-acount';
				$text          = esc_html__( 'Add to wishlist', 'havezic' );
			}

			// Hook for icon HTML
			$icon_class = isset( BABE_Settings::$settings['wishlist_icon'] ) && !empty(BABE_Settings::$settings['wishlist_icon']) ? BABE_Settings::$settings['wishlist_icon'] : 'havezic-icon-heart';

			return
				$content = [
					'link'       => $wishlist_link,
					'text'       => $text,
					'class'      => $class,
					'icon_class' => $icon_class
				];
		}


		public static function get_wishlist_book_ids() {

			$user_id   = get_current_user_id();
			$user_meta = get_user_meta( $user_id, 'ba_wishlist', true );

			// If we can get the user meta we use it as starting point, always
			if ( $user_id && $user_meta ) {
				return self::wishlist_clean_book_ids( $user_meta );
			}

		}


		public static function wishlist_clean_book_ids( $book_ids = array() ) {

			$clean_book_ids = array();

			foreach ( $book_ids as $book_id ) {

				if ( 'publish' == get_post_status( $book_id ) ) {
					$clean_book_ids[] = $book_id;
				}
			}

			return $clean_book_ids;
		}


		public function ajax_update_wishlist() {

			extract( $_POST );

			$user_id = absint( get_current_user_id() );

			$data = [];

			$result = false;

			if ( isset( $_POST['bookId'] ) ) {

				if ( $user_id ) {

					$book_ids = get_user_meta( $user_id, 'ba_wishlist', true );

					if ( empty( $book_ids ) ) {
						$book_ids   = [];
						$book_ids[] = $_POST['bookId'];
						$book_ids   = $this->wishlist_clean_book_ids( $book_ids );
						if ( metadata_exists( 'user', $user_id, 'ba_wishlist' ) ) {
							$result = update_user_meta( $user_id, 'ba_wishlist', $book_ids ) ? true : false;
						} else {
							$result = add_user_meta( $user_id, 'ba_wishlist', $book_ids ) ? true : false;
						}

					} else {
						$book_ids[] = $_POST['bookId'];
						$book_ids   = $this->wishlist_clean_book_ids( $book_ids );
						$result     = update_user_meta( $user_id, 'ba_wishlist', $book_ids ) ? true : false;
					}

				}
			}

			if ( $result ) {
				$added_text         = isset( BABE_Settings::$settings['wishlist_added'] ) ? BABE_Settings::$settings['wishlist_added'] : esc_html__( 'Tour Added!', 'havezic' );
				$data['added_text'] = $added_text;

				$data['wishlist_text'] = esc_html__( 'View list Wishlist', 'havezic' );

				$page_id       = isset( BABE_Settings::$settings['wishlist_page'] ) ? BABE_Settings::$settings['wishlist_page'] : '';
				$wishlist_link = site_url();
				if ( - 1 != $page_id ) {
					$wishlist_link = get_permalink( $page_id );
				}

				$data['wishlist_link'] = $wishlist_link;

			}
			$data['result'] = $result;

			wp_send_json( $data );
		}


		public function ajax_remove_wishlist() {

			extract( $_POST );

			$user_id = absint( get_current_user_id() );

			$result = false;

			if ( isset( $_POST['bookId'] ) ) {

				if ( $user_id ) {

					$book_ids = get_user_meta( $user_id, 'ba_wishlist', true );

					if ( ! empty( $book_ids ) ) {
						$book_ids = $this->wishlist_clean_book_ids( $book_ids );
						foreach ( $book_ids as $key => $value ) {
							if ( $value == $_POST['bookId'] ) {
								unset( $book_ids[ $key ] );
							}
						}
						$result = update_user_meta( $user_id, 'ba_wishlist', $book_ids ) ? true : false;
					}

				}
			}
			$data['result'] = $result;

			wp_send_json( $data );
		}


		public function wishlist_enqueue_scripts() {

            wp_enqueue_script('magnific-popup');
            wp_enqueue_style('magnific-popup');
            wp_enqueue_script('tooltipster');
            wp_enqueue_style('tooltipster');
			wp_enqueue_script( 'havezic-wishlist', get_theme_file_uri( '/assets/js/frontend/wishlist.js' ), [], HAVEZIC_VERSION );

		}
	}

endif;

return new Havezic_BA_Booking_Wishlist();
