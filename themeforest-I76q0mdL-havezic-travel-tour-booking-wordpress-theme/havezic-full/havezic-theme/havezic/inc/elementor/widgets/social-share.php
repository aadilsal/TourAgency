<?php

use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class Havezic_Elementor_Social_Share extends Elementor\Widget_Base {

    public function get_name() {
        return 'havezic-social-share';
    }

    public function get_title() {
        return esc_html__('Havezic Social Share', 'havezic');
    }

    public function get_icon() {
        return 'eicon-share';
    }

    public function get_categories() {
        return array('havezic-addons');
    }

    protected function register_controls() {
    }

    protected function render() {
        havezic_social_share();
    }
}

$widgets_manager->register(new Havezic_Elementor_Social_Share());
