<?php

defined( 'ABSPATH' ) || exit();

/**
 * Hook to delete post elementor related with this menu
 */
add_action( "before_delete_post", "havezic_megamenu_on_delete_menu_item", 9 );
function havezic_megamenu_on_delete_menu_item( $post_id ) {
	if( is_nav_menu_item($post_id) ){
		$related_id = havezic_megamenu_get_post_related_menu( $post_id );
		if( $related_id ){
			wp_delete_post( $related_id, true );
		}
	}
}



add_filter( 'elementor/editor/footer', 'havezic_megamenu_add_back_button_inspector' );
function havezic_megamenu_add_back_button_inspector() {
	if ( ! isset( $_GET['havezic-menu-editable'] ) || ! $_GET['havezic-menu-editable'] ) {
		return;
	}
	?>
        <script type="text/template" id="tmpl-elementor-panel-footer-content">
            <div id="elementor-panel-footer-back-to-admin" class="elementor-panel-footer-tool elementor-leave-open tooltip-target" data-tooltip="<?php esc_attr_e( 'Back', 'havezic' ); ?>">
				<i class="eicon-close" aria-hidden="true"></i>
			</div>
            <div id="elementor-panel-footer-settings" class="elementor-panel-footer-tool elementor-leave-open tooltip-target" data-tooltip="<?php esc_attr_e( 'Settings', 'havezic' ); ?>">
                <i class="eicon-cog" aria-hidden="true"></i>
                <span class="elementor-screen-only"><?php echo esc_html__( 'Page Settings', 'havezic' ); ?></span>
            </div>
            <div id="elementor-panel-footer-navigator" class="elementor-panel-footer-tool tooltip-target" data-tooltip="<?php esc_attr_e( 'Navigator', 'havezic' ); ?>">
                <i class="eicon-navigator" aria-hidden="true"></i>
                <span class="elementor-screen-only">
                    <?php echo esc_html__( 'Navigator', 'havezic' ); ?>
                </span>
            </div>
			<div id="elementor-panel-footer-responsive" class="elementor-panel-footer-tool">
				<i class="eicon-device-desktop tooltip-target" aria-hidden="true" data-tooltip="<?php esc_attr_e( 'Responsive Mode', 'havezic' ); ?>"></i>
				<span class="elementor-screen-only">
					<?php echo esc_html__( 'Responsive Mode', 'havezic' ); ?>
				</span>
			</div>
			<div id="elementor-panel-footer-history" class="elementor-panel-footer-tool elementor-leave-open tooltip-target" data-tooltip="<?php esc_attr_e( 'History', 'havezic' ); ?>">
				<i class="eicon-history" aria-hidden="true"></i>
				<span class="elementor-screen-only"><?php echo esc_html__( 'History', 'havezic' ); ?></span>
			</div>
			<div id="elementor-panel-footer-saver-publish" class="elementor-panel-footer-tool">
				<button id="elementor-panel-saver-button-publish" class="elementor-button elementor-button-success elementor-saver-disabled">
					<span class="elementor-state-icon">
						<i class="eicon-loading eicon-animation-spin" aria-hidden="true"></i>
					</span>
					<span id="elementor-panel-saver-button-publish-label">
						<?php echo esc_html__( 'Publish', 'havezic' ); ?>
					</span>
				</button>
			</div>
			<div id="elementor-panel-saver-save-options" class="elementor-panel-footer-tool" >
				<button id="elementor-panel-saver-button-save-options" class="elementor-button elementor-button-success tooltip-target elementor-disabled" data-tooltip="<?php esc_attr_e( 'Save Options', 'havezic' ); ?>">
					<i class="eicon-caret-up" aria-hidden="true"></i>
					<span class="elementor-screen-only"><?php echo esc_html__( 'Save Options', 'havezic' ); ?></span>
				</button>
			</div>
        </script>

	<?php
}

add_action( 'wp_ajax_havezic_load_menu_data', 'havezic_megamenu_load_menu_data' );
function havezic_megamenu_load_menu_data() {
	$nonce = ! empty( $_POST['nonce'] ) ? sanitize_text_field( $_POST['nonce'] ) : '';
	$menu_id = ! empty( $_POST['menu_id'] ) ? absint( $_POST['menu_id'] ) : false;
	if ( ! wp_verify_nonce( $nonce, 'havezic-menu-data-nonce' ) || ! $menu_id ) {
		wp_send_json( array(
				'message' => esc_html__( 'Access denied', 'havezic' )
			) );
	}

	$data =  havezic_megamenu_get_item_data( $menu_id );

	$data = $data ? $data : array();
	if( isset($_POST['istop']) && absint($_POST['istop']) == 1  ){
		if ( class_exists( 'Elementor\Plugin' ) ) {
			if( isset($data['enabled']) && $data['enabled'] ){
				$related_id = havezic_megamenu_get_post_related_menu( $menu_id );
				if ( ! $related_id  ) {
					havezic_megamenu_create_related_post( $menu_id );
					$related_id = havezic_megamenu_get_post_related_menu( $menu_id );
				}

				if ( $related_id && isset($_REQUEST['menu_id']) && is_admin() ) {
					$url = Elementor\Plugin::instance()->documents->get( $related_id )->get_edit_url();
					$data['edit_submenu_url'] = add_query_arg( array( 'havezic-menu-editable' => 1 ), $url );
				}
			} else {
				$url = admin_url();
				$data['edit_submenu_url'] = add_query_arg( array( 'havezic-menu-createable' => 1, 'menu_id' => $menu_id ), $url );
			}
		}
	}

	$results = apply_filters( 'havezic_menu_settings_data', array(
			'status' => true,
			'data' => $data
	) );

	wp_send_json( $results );

}

add_action( 'wp_ajax_havezic_update_menu_item_data', 'havezic_megamenu_update_menu_item_data' );
function havezic_megamenu_update_menu_item_data() {
	$nonce = ! empty( $_POST['nonce'] ) ? sanitize_text_field( $_POST['nonce'] ) : '';
	if ( ! wp_verify_nonce( $nonce, 'havezic-update-menu-item' ) ) {
		wp_send_json( array(
				'message' => esc_html__( 'Access denied', 'havezic' )
			) );
	}

	$settings = ! empty( $_POST['havezic-menu-item'] ) ? ($_POST['havezic-menu-item']) : array();
	$menu_id = ! empty( $_POST['menu_id'] ) ? absint( $_POST['menu_id'] ) : false;

	do_action( 'havezic_before_update_menu_settings', $settings );


	havezic_megamenu_update_item_data( $menu_id, $settings );

	do_action( 'havezic_menu_settings_updated', $settings );
	wp_send_json( array( 'status' => true ) );
}

add_action( 'admin_footer', 'havezic_megamenu_underscore_template' );
function havezic_megamenu_underscore_template() {
	global $pagenow;
	if ( $pagenow === 'nav-menus.php' ) { ?>
		<script type="text/html" id="tpl-havezic-menu-item-modal">
			<div id="havezic-modal" class="havezic-modal">
				<div id="havezic-modal-body" class="<%= data.edit_submenu === true ? 'edit-menu-active' : ( data.is_loading ? 'loading' : '' ) %>">
					<% if ( data.edit_submenu !== true && data.is_loading !== true ) { %>
						<form id="menu-edit-form">
					<% } %>
						<div class="havezic-modal-content">
							<% if ( data.edit_submenu === true ) { %>
                            <iframe src="<%= data.edit_submenu_url %>"></iframe>
							<% } else if ( data.is_loading === true ) { %>
								<i class="fa fa-spin fa-spinner"></i>
							<% } else { %>
							<div class="form-group toggle-select-setting">
								<label for="icon"><?php esc_html_e( 'Icon', 'havezic' ) ?></label>
								<select id="icon" name="havezic-menu-item[icon]" class="form-control icon-picker havezic-input-switcher havezic-input-switcher-true" data-target=".icon-custom">
									<option value=""<%= data.icon == '' ? ' selected' : '' %>><?php echo esc_html__( 'No Use', 'havezic' ) ?></option>
									<option value="1"<%= data.icon == 1 ? ' selected' : '' %>><?php echo esc_html__( 'Custom Class', 'havezic' ) ?></option>
									<?php foreach ( havezic_megamenu_get_fontawesome_icons() as $value ) : ?>
										<option value="<?php echo 'havezic-icon-'.esc_attr( $value ) ?>"<%= data.icon == '<?php echo 'havezic-icon-'.esc_attr( $value ) ?>' ? ' selected' : '' %>><?php echo esc_html( $value ) ?></option>
									<?php endforeach ?>
								</select>
							</div>
							<div class="form-group icon-custom toggle-select-setting elementor-hidden">
								<label for="icon-custom"><?php esc_html_e( 'Icon Class Name', 'havezic' ) ?></label>
								<input type="text" name="havezic-menu-item[icon-custom]" class="input" id="icon-custom"/>
							</div>
							<div class="form-group">
								<label for="icon_color"><?php esc_html_e( 'Icon Color', 'havezic' ) ?></label>
								<input class="color-picker" name="havezic-menu-item[icon_color]" value="<%= data.icon_color %>" id="icon_color" />
							</div>
                            <div class="form-group">
								<label for="icon_size"><?php esc_html_e( 'Icon Size', 'havezic' ) ?></label>
								<input type="text" name="havezic-menu-item[icon_size]" value="<%= data.icon_size %>" id="icon_size" />
                                <span class="unit">px</span>
							</div>
                            <div class="form-group">
                                <label for="color"><?php esc_html_e( 'Color', 'havezic' ) ?></label>
                                <input class="color-picker" name="havezic-menu-item[color]" value="<%= data.color %>" id="color" />
                            </div>
                            <div class="form-group">
                                <label for="badge_title"><?php esc_html_e( 'Badges Title', 'havezic' ) ?></label>
                                <input class="form-control" name="havezic-menu-item[badge_title]" value="<%= data.badge_title %>" id="badge_title" />
                            </div>
                            <div class="form-group">
                                <label for="badge_color"><?php esc_html_e( 'Badges Color', 'havezic' ) ?></label>
                                <input class="color-picker" name="havezic-menu-item[badge_color]" value="<%= data.badge_color %>" id="badge_color" />
                            </div>
                            <div class="form-group">
                                <label for="badges_bg_color"><?php esc_html_e( 'Badges Bg Color', 'havezic' ) ?></label>
                                <input class="color-picker" name="havezic-menu-item[badges_bg_color]" value="<%= data.badges_bg_color %>" id="badges_bg_color" />
                            </div>

								<div class="form-group submenu-setting toggle-select-setting">
									<label><?php esc_html_e( 'Mega Submenu Enabled', 'havezic' ) ?></label>
									<select name="havezic-menu-item[enabled]" class="havezic-input-switcher havezic-input-switcher-true" data-target=".submenu-width-setting">
										<option value="1" <%= data.enabled == 1? 'selected':'' %>> <?php esc_html_e( 'Yes', 'havezic' ) ?></opttion>
										<option value="0" <%= data.enabled == 0? 'selected':'' %>><?php esc_html_e( 'No', 'havezic' ) ?></opttion>
									</select>
									<button id="edit-megamenu" class="button button-primary button-large">
										<?php esc_html_e( 'Edit Megamenu Submenu', 'havezic' ) ?>
									</button>
								</div>

								<div class="form-group submenu-width-setting toggle-select-setting elementor-hidden">
									<label><?php esc_html_e( 'Sub Megamenu Width', 'havezic' ) ?></label>
									<select name="havezic-menu-item[customwidth]" class="havezic-input-switcher havezic-input-switcher-true" data-target=".submenu-subwidth-setting">
                                        <option value="1" <%= data.customwidth == 1? 'selected':'' %>> <?php esc_html_e( 'Yes', 'havezic' ) ?></opttion>
                                        <option value="0" <%= data.customwidth == 0? 'selected':'' %>><?php esc_html_e( 'Full Width', 'havezic' ) ?></opttion>
                                        <option value="2" <%= data.customwidth == 2? 'selected':'' %>><?php esc_html_e( 'Stretch Width', 'havezic' ) ?></opttion>
                                        <option value="3" <%= data.customwidth == 3? 'selected':'' %>><?php esc_html_e( 'Container Width', 'havezic' ) ?></opttion>
									</select>
								</div>

								<div class="form-group submenu-width-setting submenu-subwidth-setting toggle-select-setting elementor-hidden">
									<label for="menu_subwidth"><?php esc_html_e( 'Sub Mega Menu Max Width', 'havezic' ) ?></label>
									<input type="text" name="havezic-menu-item[subwidth]" value="<%= data.subwidth?data.subwidth:'600' %>" class="input" id="menu_subwidth" />
									<span class="unit">px</span>
								</div>

                                <div class="form-group submenu-width-setting submenu-subwidth-setting toggle-select-setting elementor-hidden">
                                    <label><?php esc_html_e( 'Sub Mega Menu Position Left', 'havezic' ) ?></label>
                                    <select name="havezic-menu-item[menuposition]">
                                        <option value="0" <%= data.menuposition == 0? 'selected':'' %>><?php esc_html_e( 'No', 'havezic' ) ?></opttion>
                                        <option value="1" <%= data.menuposition == 1? 'selected':'' %>> <?php esc_html_e( 'Yes', 'havezic' ) ?></opttion>
                                    </select>
                                </div>

							<% } %>
						</div>
						<% if ( data.is_loading !== true && data.edit_submenu !== true ) { %>
							<div class="havezic-modal-footer">
								<a href="#" class="close button"><%= havezic_memgamnu_params.i18n.close %></a>
								<?php wp_nonce_field( 'havezic-update-menu-item', 'nonce' ) ?>
								<input name="menu_id" value="<%= data.menu_id %>" type="hidden" />
								<button type="submit" class="button button-primary button-large menu-save pull-right"><%= havezic_memgamnu_params.i18n.submit %></button>
							</div>
						<% } %>
					<% if ( data.edit_submenu !== true && data.is_loading !== true ) { %>
						</form>
					<% } %>
				</div>
                <div class="havezic-modal-overlay"></div>
			</div>
		</script>
	<?php }
}







