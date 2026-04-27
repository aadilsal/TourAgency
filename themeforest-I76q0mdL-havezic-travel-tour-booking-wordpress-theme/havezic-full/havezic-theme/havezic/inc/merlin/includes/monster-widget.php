<?php

class Havezic_Monster_Widget extends Monster_Widget {
    public function widget( $args, $instance ) {
        global $wp_registered_sidebars;

        $id = $args['id'];
        $args = $wp_registered_sidebars[$id];
        $before_widget = $args['before_widget'];
        $args['after_title']  .= '<div class="widget-content">';
        $args['after_widget'] .= '</div>';
        foreach( $this->get_widget_config() as $widget ) {
            $_instance = ( isset( $widget[1] ) ) ? $widget[1] : null;

            // Override cache for the Recent Posts widget.
            if ( 'WP_Widget_Recent_Posts' == $widget[0] )
                $args['widget_id'] = 'monster-widget-recent-posts-cache-' . self::$iterator;

            $args['before_widget'] = sprintf(
                $before_widget,
                'monster-widget-placeholder-' . self::$iterator,
                $this->get_widget_class( $widget[0] )
            );

            the_widget( $widget[0], $_instance, $args );

            self::$iterator++;
        }
    }
}
