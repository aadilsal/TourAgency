<?php

use Elementor\Controls_Manager;

/**
 * Add widget all-items to Elementor
 *
 * @since   1.3.13
 */
class Havezic_BABE_Elementor_RatingFilter_Widget extends \Elementor\Widget_Base {

    /**
     * Get widget name.
     *
     * @return string Widget name.
     */
    public function get_name() {
        return 'babe-rating-filter';
    }

    /**
     * Get widget title.
     *
     * @return string Widget title.
     */
    public function get_title() {
        return esc_html__('Rating Filter', 'havezic');
    }

    /**
     * Get widget icon.
     *
     * @return string Widget icon.
     */
    public function get_icon() {
        return 'eicon-site-search';
    }

    /**
     * Get widget keywords.
     *
     * Retrieve the list of keywords the widget belongs to.
     *
     * @return array Widget keywords.
     */
    public function get_keywords() {
        return ['filter', 'rating', 'search', 'search filter', 'book everything'];
    }

    /**
     * Get widget categories.
     *
     * @return array Widget categories.
     */
    public function get_categories() {
        return ['book-everything-elements'];
    }


    public function get_script_depends() {
        return ['havezic-ba-rating-filter.js'];
    }


    protected function register_controls() {
        $this->start_controls_section(
            'section_content_wrapper',
            [
                'label' => esc_html__('Content', 'havezic'),
                'tab'   => \Elementor\Controls_Manager::TAB_CONTENT,

            ]
        );

        $this->add_control(
            'style_arrow',
            [
                'label'        => esc_html__('Choose Layout', 'havezic'),
                'type'         => \Elementor\Controls_Manager::SELECT,
                'options'      => [
                    'style-1' => esc_html__('Vertical', 'havezic'),
                    'style-2' => esc_html__('Horizontal', 'havezic')
                ],
                'default'      => 'style-1',
                'prefix_class' => 'layout-'
            ]
        );

        $this->end_controls_section();

        $this->start_controls_section(
            'section_rating_filter_style',
            [
                'label' => esc_html__('Rating Star', 'havezic'),
                'tab'   => \Elementor\Controls_Manager::TAB_STYLE,

            ]
        );

        $this->add_responsive_control(
            'rating_size',
            [
                'label'     => esc_html__('Size star', 'havezic'),
                'type'      => Controls_Manager::SLIDER,
                'range'     => [
                    'px' => [
                        'min' => 0,
                        'max' => 100,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .post-total-rating-stars .rating-stars' => 'font-size: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_control(
            'rating_color',
            [
                'label'     => esc_html__('Color star', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'default'   => '',
                'selectors' => [
                    '{{WRAPPER}} .post-rating-stars:not(:hover) .star,{{WRAPPER}} .post-total-rating-stars:not(:hover) .star' => 'color: {{VALUE}};',
                ]
            ]
        );

        $this->add_control(
            'rating_color_hover',
            [
                'label'     => esc_html__('Hover color star', 'havezic'),
                'type'      => Controls_Manager::COLOR,
                'default'   => '',
                'selectors' => [
                    '{{WRAPPER}} .post-rating-stars:hover .star,{{WRAPPER}} .post-total-rating-stars:hover .star' => 'color: {{VALUE}};',
                ]
            ]
        );

        $this->add_responsive_control(
            'rating_spacing',
            [
                'label'      => esc_html__('Spacing', 'havezic'),
                'type'       => Controls_Manager::SLIDER,
                'range'      => [
                    'px' => [
                        'min' => 0,
                        'max' => 100,
                    ],
                ],
                'size_units' => ['px', 'em'],
                'selectors'  => [
                    '{{WRAPPER}}.layout-style-1 .post-total-rating-stars:not(:last-child)' => 'margin-bottom: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}}.layout-style-2 .post-total-rating-stars:not(:last-child)' => 'margin-right: {{SIZE}}{{UNIT}};',
                ],
            ]
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
        $stars_num = BABE_Settings::get_rating_stars_num();
        ?>
        <div class="rating-filter-inner">
            <?php for ($star = $stars_num; $star >= 1; $star--): ?>
                <div class="post-total-rating-stars stars">
                    <div class="input-square">
                        <?php

                        $selected = (isset($_GET['rating_value']) && $_GET['rating_value'] == $star) ? 'checked' : '';
                        ?>
                        <input id="rating-filter-<?php echo esc_attr($star); ?>" type="radio" class="rating-filter" name="rating_value" value="<?php echo round($star, 2); ?>" <?php echo esc_attr($selected); ?>>
                        <label for="rating-filter-<?php echo esc_attr($star); ?>">
                            <span class="star-rating">
                                <span>
                                <?php
                                for ($i = 1; $i <= $stars_num; $i++) {
                                    echo '<i class="havezic-icon-star"></i>';
                                }
                                ?></span>
                                <span style="width:<?php echo esc_attr((($star / $stars_num) * 100));?>%">
                                <?php
                                for ($i = 1; $i <= $stars_num; $i++) {
                                    echo '<i class="havezic-icon-star"></i>';
                                }
                                ?></span>
                            </span>
                        </label>
                    </div>
                </div>
            <?php endfor; ?>
        </div>
        <?php
    }
}

$widgets_manager->register(new Havezic_BABE_Elementor_RatingFilter_Widget());