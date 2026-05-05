;( function( $ ) {

	'use strict';

	// Global settings access.
	var settings = {
		iconActivate: '<i class="fa fa-toggle-on fa-flip-horizontal" aria-hidden="true"></i>',
		iconDeactivate: '<i class="fa fa-toggle-on" aria-hidden="true"></i>',
		iconInstall: '<i class="fa fa-cloud-download" aria-hidden="true"></i>'
	};

	var ETBdmin = {

		/**
		 * Start the engine.
		 *
		 * @since 1.3.9
		 */
		_init: function() {

			var etb_hide_shortcode_field = function() {
				var selected = $('#etb_template_type').val() || 'none';
				$( '.theme-builder-options-table' ).removeClass().addClass( 'theme-builder-options-table widefat theme-builder-selected-template-type-' + selected );
			}

			var $document = $( document );
		
			$document.on( 'change', '#etb_template_type', function( e ) {
				etb_hide_shortcode_field();
			});
		
			etb_hide_shortcode_field();


			$( '.theme-builder-subscribe-field' ).on( 'keyup', function( e ) {
				$( '.theme-builder-subscribe-message' ).remove();
			});

			$document.on( 'focusout change', '.theme-builder-subscribe-field', ETBdmin._validate_single_field );
			$document.on( 'click input', '.theme-builder-subscribe-field', ETBdmin._animate_fields );

			$document.on( 'click', '.theme-builder-guide-content .submit-1', ETBdmin._step_one_subscribe );
			$document.on( 'click', '.theme-builder-guide-content .submit-2', ETBdmin._step_two_subscribe );

			$document.on('click', '.theme-builder-guide-content .button-subscription-skip', ETBdmin._close_modal );

			// About us - addons functionality.
			if ( $( '.theme-builder-admin-addons' ).length ) {
	
				$document.on( 'click', '.theme-builder-admin-addons .addon-item button', function( event ) {
					event.preventDefault();
		
					if ( $( this ).hasClass( 'disabled' ) ) {
						return false;
					}
		
					ETBdmin._addons( $( this ) );

				} );
		
			}
		},

		_animate_fields: function ( event ) {
			event.preventDefault();
			event.stopPropagation();
			var parentWrapper = $( this ).parents( '.theme-builder-input-container' );
			parentWrapper.addClass( 'subscription-anim' );
		},

		_validate_single_field: function ( event ) {
			event.preventDefault();
			event.stopPropagation();
			ETBdmin._validate_field( event.target );
		},

		_validate_field: function ( target ) {

			var field = $( target );
			var fieldValue = field.val() || '';
			var parentWrapper = field.parents( '.theme-builder-input-container' );
			var fieldStatus = fieldValue.length ? true : false;

			if ( ( field.hasClass( 'theme-builder-subscribe-email' ) && false === ETBdmin._is_valid_email( fieldValue ) )) {
				fieldStatus = false;
			}

			if ( fieldStatus ) {
				parentWrapper.removeClass( 'subscription-error' ).addClass( 'subscription-success' );
			} else {
				parentWrapper.removeClass( 'subscription-success subscription-anim' ).addClass( 'subscription-error' );

				if ( field.hasClass( 'theme-builder-subscribe-email' ) && fieldValue.length ) {
					parentWrapper.addClass( 'subscription-anim' );
				}
			}

		},

		/**
		 * Subscribe Form Step One
		 *
		 */
		_step_one_subscribe: function( event ) {
			event.preventDefault();
			event.stopPropagation();

			var form_one_wrapper = $( '.theme-builder-subscription-step-1' );

			var first_name_field = form_one_wrapper.find( '.theme-builder-subscribe-field[name="etb_subscribe_name"]' );
			var email_field = form_one_wrapper.find( '.theme-builder-subscribe-field[name="etb_subscribe_email"]' );

			ETBdmin._validate_field( first_name_field );
			ETBdmin._validate_field( email_field );

			if ( form_one_wrapper.find( '.theme-builder-input-container' ).hasClass( 'subscription-error' )) {
				return;
			}

			$( '.theme-builder-guide-content' ).addClass( 'theme-builder-subscription-step-2-active' ).removeClass( 'theme-builder-subscription-step-1-active' );

		},

		/**
		 * Subscribe Form
		 *
		 */
		 _step_two_subscribe: function( event ) {

			event.preventDefault();
			event.stopPropagation();

			var submit_button = $(this);

			var is_modal = $( '.theme-builder-guide-modal-popup.theme-builder-show' );

			var first_name_field = $('.theme-builder-subscribe-field[name="etb_subscribe_name"]');
			var email_field = $('.theme-builder-subscribe-field[name="etb_subscribe_email"]');
			var user_type_field = $('.theme-builder-subscribe-field[name="wp_user_type"]');
			var build_for_field = $('.theme-builder-subscribe-field[name="build_website_for"]');
			var accept_field = $('.etb_subscribe_accept[name="etb_subscribe_accept"]');

			var subscription_first_name = first_name_field.val() || '';
			var subscription_email = email_field.val() || '';
			var subscription_user_type = user_type_field.val() || '';
			var subscription_build_for = build_for_field.val() || '';
			var button_text = submit_button.find( '.theme-builder-submit-button-text' );
			var subscription_accept = accept_field.is( ':checked' ) ? '1' : '0';

			ETBdmin._validate_field( first_name_field );
			ETBdmin._validate_field( email_field );
			ETBdmin._validate_field( user_type_field );
			ETBdmin._validate_field( build_for_field );

			$( '.theme-builder-subscribe-message' ).remove();

			if ( $( '.theme-builder-input-container' ).hasClass( 'subscription-error' )) {
				return;
			}

			submit_button.removeClass( 'submitted' );

			if( ! submit_button.hasClass( 'submitting' ) ) {
				submit_button.addClass( 'submitting' );
			} else {
				return;
			}

			var subscription_fields = {
				EMAIL: subscription_email,
				FIRSTNAME: subscription_first_name,
				PAGE_BUILDER: "1",
				WP_USER_TYPE: subscription_user_type,
				BUILD_WEBSITE_FOR: subscription_build_for,
				OPT_IN: subscription_accept,
				SOURCE: etb_admin_data.data_source
			};

			$.ajax({
				url  : etb_admin_data.ajax_url,
				type : 'POST',
				data : {
					action : 'theme-builder-update-subscription',
					nonce : etb_admin_data.nonce,
					data: JSON.stringify( subscription_fields ),
				},
				beforeSend: function() {
					console.groupCollapsed( 'Email Subscription' );

					button_text.append( '<span class="dashicons dashicons-update theme-builder-loader"></span>' );

				},
			})
			.done( function ( response ) {

				$( '.theme-builder-loader.dashicons-update' ).remove();

				submit_button.removeClass( 'submitting' ).addClass('submitted');

				if( response.success === true ) {
					$('.theme-builder-admin-about-section form').trigger( "reset" );
					$( '.theme-builder-input-container' ).removeClass( 'subscription-success subscription-anim' );

					submit_button.after( '<span class="theme-builder-subscribe-message success">' + etb_admin_data.subscribe_success + '</span>' );
				} else {
					submit_button.after( '<span class="theme-builder-subscribe-message error">' + etb_admin_data.subscribe_error + '</span>' );
				}
				
				if( is_modal.length ) {
					window.setTimeout( function () {
						window.location = $( '.theme-builder-guide-modal-popup' ).data( 'new-page' );
					}, 3000 );
				}

			});

		},

		/**
		 * email Validation
		 *
		 */
		_is_valid_email: function(eMail) {
			if (/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test( eMail ) ) {
				return true;
			}
			
			return false;
		},

		/**
		 * Close the Modal Popup
		 *
		 */
		 _close_modal: function() {
			var modal_wrapper = $( '.theme-builder-guide-modal-popup' );
			var new_page_link = modal_wrapper.data( 'new-page' );
				
			$.ajax({
				url: etb_admin_data.ajax_url,
				type: 'POST',
				data: {
					action  : 'etb_admin_modal',
					nonce   : etb_admin_data.nonce,
				},
			});
		
			if( modal_wrapper.hasClass( 'theme-builder-show' ) ) {
				modal_wrapper.removeClass( 'theme-builder-show' );
			}

			window.location = new_page_link;
		},

		/**
		 * Toggle addon state.
		 */
		 _addons: function( $button ) {

			var $addon = $button.closest( '.addon-item' ),
				plugin = $button.attr( 'data-plugin' ),
				addonType = $button.attr( 'data-type' ),
				addonSlug = $button.attr( 'data-slug' ),
				addonFile = $button.attr( 'data-file' ),
				state,
				cssClass,
				stateText,
				buttonText,
				errorText,
				successText;
	
			if ( $button.hasClass( 'status-go-to-url' ) ) {
	
				// Open url in new tab.
				window.open( $button.attr( 'data-site' ), '_blank' );
				return;
			}
	
			$button.prop( 'disabled', true ).addClass( 'loading' );
			$button.html( '<span class="dashicons dashicons-update theme-builder-loader"></span>' );
	
			if ( $button.hasClass( 'status-active' ) ) {
	
				// Deactivate.
				state = 'deactivate';
				cssClass = 'status-inactive';
				cssClass += ' button button-secondary';
				stateText = etb_admin_data.addon_inactive;
				buttonText = etb_admin_data.addon_activate;
				errorText  = etb_admin_data.addon_deactivate;
	
			} else if ( $button.hasClass( 'status-inactive' ) ) {
	
				// Activate.
				state = 'activate';
				cssClass = 'status-active';
				cssClass += ' button button-secondary disabled';
				stateText = etb_admin_data.addon_active;
				buttonText = etb_admin_data.addon_deactivate;
				buttonText = etb_admin_data.addon_activated;
				errorText  = etb_admin_data.addon_activate;
	
			} else if ( $button.hasClass( 'status-download' ) ) {
	
				// Install & Activate.
				state = 'install';
				cssClass = 'status-active';
				cssClass += ' button disabled';
				stateText = etb_admin_data.addon_active;
				buttonText = etb_admin_data.addon_activated;
				errorText  = settings.iconInstall;
	
			} else {
				return;
			}
	
			ETBdmin._set_addon_state( plugin, state, addonType, addonSlug, function( res ) {
	
				if ( res.success ) {
					if ( 'install' === state ) {
						successText = res.msg;
						$button.attr( 'data-plugin', addonFile );
						
						stateText  = etb_admin_data.addon_inactive;
						buttonText = ( addonType === 'theme' || addonType === 'plugin' ) ? etb_admin_data.addon_activate : settings.iconActivate + etb_admin_data.addon_activate;
						cssClass   = ( addonType === 'theme' || addonType === 'plugin' ) ? 'status-inactive button button-secondary' : 'status-inactive';
					} else {
						successText = res.data;
					}
					$addon.find( '.actions' ).append( '<div class="msg success">' + successText + '</div>' );
					$addon.find( 'span.status-label' )
						.removeClass( 'status-active status-inactive status-download' )
						.addClass( cssClass )
						.removeClass( 'button button-primary button-secondary disabled' )
						.text( stateText );
					$button
						.removeClass( 'status-active status-inactive status-download' )
						.removeClass( 'button button-primary button-secondary disabled' )
						.addClass( cssClass ).html( buttonText );
				} else {
					
					if ( 'install' === state && ( addonType === 'theme' || addonType === 'plugin' ) ) {
						$addon.find( '.actions' ).append( '<div class="msg error">' + res.msg + '</div>' );
						$button.addClass( 'status-go-to-url' ).removeClass( 'status-download' );
					} else {
						var error_msg = ( 'object' === typeof res.data ) ? etb_admin_data.plugin_error : res.data;
						$addon.find( '.actions' ).append( '<div class="msg error">' + error_msg + '</div>' );
					}

					if( 'ultimate-elementor' === addonSlug ) {
						$button.addClass( 'status-go-to-url' );
						$button.html( etb_admin_data.visit_site );
					} else {
						$button.html( etb_admin_data.addon_download );
					}
				}
	
				$button.prop( 'disabled', false ).removeClass( 'loading' );
	
				// Automatically clear the messages after 3 seconds.
				setTimeout( function() {	
					$( '.addon-item .msg' ).remove();
				}, 3000 );
	
			} );
		},

		/**
		 * Change plugin/addon state.
		 *
		 * @since 1.6.0
		 *
		 * @param {string}   plugin     Plugin/Theme URL for download.
		 * @param {string}   state      State status activate|deactivate|install.
		 * @param {string}   addonType Plugin/Theme type addon or plugin.
		 * @param {string}   addonSlug Plugin/Theme slug addon or plugin.
		 * @param {Function} callback   Callback for get result from AJAX.
		 */
		 _set_addon_state: function( plugin, state, addonType, addonSlug, callback ) {

			var actions = {
					'activate': 'etb_activate_addon',
					'install': '',
				},
				action = actions[ state ];

			if ( ! action && 'install' !== state ) {
				return;
			}

			var data_result = {
				success : false,
				msg : etb_admin_data.subscribe_error,
			};

			if( 'install' === state ) {

				if ( wp.updates.shouldRequestFilesystemCredentials && ! wp.updates.ajaxLocked ) {
					wp.updates.requestFilesystemCredentials();
				}

				if( 'theme' === addonType ) {

					wp.updates.installTheme ( {
						slug: addonSlug,
						success: function() {
							data_result.success = true;
							data_result.msg = etb_admin_data.theme_installed;
							
						},
						error: function( xhr ) {
							console.log( xhr.errorCode );							
							if ( 'folder_exists' === xhr.errorCode ) {
								data_result.success = true;
								data_result.msg = etb_admin_data.addon_exists;
							} else {
								data_result.success = false;
								data_result.msg = etb_admin_data.plugin_error;
							}
						},
					}).always( function () {
						callback( data_result );
					});

				} else if( 'plugin' === addonType ) {
					
					wp.updates.installPlugin ( {
						slug: addonSlug,
						success: function() {
							data_result.success = true;
							data_result.msg = etb_admin_data.plugin_installed;
						},
						error: function( xhr ) {
							console.log( xhr.errorCode );							
							if ( 'folder_exists' === xhr.errorCode ) {
								data_result.success = true;
								data_result.msg = etb_admin_data.addon_exists;
							} else {
								data_result.success = false;
								data_result.msg = etb_admin_data.plugin_error;
							}
						},
					}).always( function () {
						callback( data_result );
					});
				}

			} else if( 'activate' === state )  {

				var data = {
					action: action,
					nonce: etb_admin_data.nonce,
					plugin: plugin,
					type: addonType,
					slug: addonSlug
				};
		
				$.post( etb_admin_data.ajax_url, data, function( res ) {
					callback( res );
				} ).fail( function( xhr ) {
					console.log( xhr.responseText );
				} );
			}
		}
	};

	$( document ).ready( function( e ) {
		ETBdmin._init();
	});

	window.ETBdmin = ETBdmin;

} )( jQuery );
