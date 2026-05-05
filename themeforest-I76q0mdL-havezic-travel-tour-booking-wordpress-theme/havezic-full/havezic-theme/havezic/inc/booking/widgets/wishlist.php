<?php
/**
 * Add widget wishlist to Elementor
 *
 */

class Havezic_BABE_Elementor_Wishlist_Widget extends \Elementor\Widget_Base {

	/**
	 * Get widget name.
	 *
	 * @return string Widget name.
	 */
	public function get_name() {
		return 'ba-wishlist';
	}

	/**
	 * Get widget title.
	 *
	 * @return string Widget title.
	 */
	public function get_title() {
		return esc_html__( 'BA Wishlist', 'havezic' );
	}

	/**
	 * Get widget icon.
	 *
	 * @return string Widget icon.
	 */
	public function get_icon() {
		return 'eicon-archive-posts';
	}

	/**
	 * Get widget keywords.
	 *
	 * Retrieve the list of keywords the widget belongs to.
	 *
	 * @return array Widget keywords.
	 */
	public function get_keywords() {
		return [ 'item', 'items', 'all', 'products', 'product', 'book everything' ];
	}

	/**
	 * Get widget categories.
	 *
	 * @return array Widget categories.
	 */
	public function get_categories() {
		return [ 'book-everything-elements' ];
	}

	/**
	 * Register widget controls.
	 *
	 * Adds different input fields to allow the user to change and customize the widget settings.
	 */
	protected function register_controls() {


		$this->start_controls_section(
			'babe_wishlist',
			array(
				'label' => esc_html__( 'Content', 'havezic' ),
				'tab'   => \Elementor\Controls_Manager::TAB_CONTENT,
			)
		);


		$this->add_control(
			'per_page',
			array(
				'label'       => esc_html__( 'Per Page', 'havezic' ),
				'description' => esc_html__( 'How much items per page to show (-1 to show all items)', 'havezic' ),
				'type'        => \Elementor\Controls_Manager::TEXT,
				'input_type'  => 'text',
				'placeholder' => '',
				'default'     => '12',
			)
		);


		$this->end_controls_section();

	}


	/**
	 * Render widget output on the frontend.
	 *
	 * Written in PHP and used to generate the final HTML.
	 *
	 */
	protected function render() {

		$settings = $this->get_controls_settings();
		$whislist = $this->get_wishlist_book_ids();

		if( isset($whislist) && !empty($whislist) ){
            $whislist = array_chunk( $whislist, $settings['per_page'] );
            $paged = get_query_var( 'paged' ) ? absint( get_query_var( 'paged' ) ) : 1;
            foreach ( $whislist as $key => $book_ids ) {
                if ( $key + 1 == $paged ) {
                    $final_file = get_theme_file_path( 'template-parts/booking/wishlist.php' );
                    include( $final_file );
                }
            }
            $total = count($whislist);
        }else{
		    $total = 0;
		    echo '<div class="empty-wishlist"><p>'. esc_html__( 'No book on your wishlist yet.', 'havezic' ).'</p></div>';
        }



		$big = 999999999; // need an unlikely integer

		echo '<div class="nav-links">';

		echo paginate_links( array(
			'base'      => str_replace( $big, '%#%', esc_url( get_pagenum_link( $big ) ) ),
			'format'    => '?paged=%#%',
			'current'   => max( 1, get_query_var( 'paged' ) ),
			'total'     => $total,
			'type'      => 'list',
			'prev_text' => '<i class="havezic-icon-angle-double-left"></i>' . esc_html__( 'Prev', 'havezic' ),
			'next_text' => esc_html__( 'Next', 'havezic' ) . '<i class="havezic-icon-angle-double-right"></i>',
		) );

		echo '</div>';

		return;
	}

	public function get_wishlist_book_ids() {

		$user_id   = get_current_user_id();
		$user_meta = get_user_meta( $user_id, 'ba_wishlist', true );

		// If we can get the user meta we use it as starting point, always
		if ( $user_id && $user_meta ) {
                $clean_book_ids = array();

                foreach ( $user_meta as $book_id ) {

                    if ( 'publish' == get_post_status( $book_id ) ) {
                        $clean_book_ids[] = $book_id;
                    }
                }

			return $clean_book_ids;
		}

		return;

	}

}

$widgets_manager->register(new Havezic_BABE_Elementor_Wishlist_Widget());