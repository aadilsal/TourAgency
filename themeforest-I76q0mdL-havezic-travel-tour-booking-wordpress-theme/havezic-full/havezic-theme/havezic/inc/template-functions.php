<?php

if (!function_exists('havezic_display_comments')) {
    /**
     * Rocland display comments
     *
     * @since  1.0.0
     */
    function havezic_display_comments() {
        // If comments are open or we have at least one comment, load up the comment template.
        if (comments_open() || 0 !== intval(get_comments_number())) :
            comments_template();
        endif;
    }
}

if (!function_exists('havezic_comment')) {
    /**
     * Rocland comment template
     *
     * @param array $comment the comment array.
     * @param array $args the comment args.
     * @param int $depth the comment depth.
     *
     * @since 1.0.0
     */
    function havezic_comment($comment, $args, $depth) {
        if ('div' === $args['style']) {
            $tag       = 'div';
            $add_below = 'comment';
        } else {
            $tag       = 'li';
            $add_below = 'div-comment';
        }
        ?>
        <<?php echo esc_attr($tag) . ' '; ?><?php comment_class(empty($args['has_children']) ? '' : 'parent'); ?> id="comment-<?php comment_ID(); ?>">

        <div class="comment-body">
            <div class="comment-author vcard">
                <?php echo get_avatar($comment, 80); ?>
            </div>
            <?php if ('div' !== $args['style']) : ?>
            <div id="div-comment-<?php comment_ID(); ?>" class="comment-content">
                <?php endif; ?>
                <div class="comment-head">
                    <div class="comment-meta commentmetadata">
                        <?php printf('<cite class="fn">%s</cite>', get_comment_author_link()); ?>
                        <?php if ('0' === $comment->comment_approved) : ?>
                            <em class="comment-awaiting-moderation"><?php echo esc_html__('Your comment is awaiting moderation.', 'havezic'); ?></em>
                            <br/>
                        <?php endif; ?>

                        <a href="<?php echo esc_url(htmlspecialchars(get_comment_link($comment->comment_ID))); ?>"
                           class="comment-date">
                            <?php echo '<time datetime="' . get_comment_date('c') . '">' . get_comment_date() . '</time>'; ?>
                        </a>
                    </div>
                </div>
                <div class="comment-text">
                    <?php comment_text(); ?>
                </div>
                <div class="reply">
                    <?php
                    comment_reply_link(
                        array_merge(
                            $args, array(
                                'add_below' => $add_below,
                                'depth'     => $depth,
                                'max_depth' => $args['max_depth'],
                            )
                        )
                    );
                    ?>
                    <?php edit_comment_link(esc_html__('Edit', 'havezic'), '  ', ''); ?>
                </div>
                <?php if ('div' !== $args['style']) : ?>
            </div>
        <?php endif; ?>
        </div>
        <?php
    }
}

if (!function_exists('havezic_credit')) {
    /**
     * Display the theme credit
     *
     * @return void
     * @since  1.0.0
     */
    function havezic_credit() {
        ?>
        <div class="site-info">
            <?php echo apply_filters('havezic_copyright_text', $content = '&copy; ' . date('Y') . ' ' . '<a class="site-url" href="' . esc_url(site_url()) . '">' . esc_html(get_bloginfo('name')) . '</a>' . esc_html__('. All Rights Reserved.', 'havezic')); ?>
        </div><!-- .site-info -->
        <?php
    }
}

if (!function_exists('havezic_social')) {
    function havezic_social() {
        $social_list = havezic_get_theme_option('social_text', []);
        if (empty($social_list)) {
            return;
        }
        ?>
        <div class="havezic-social">
            <ul>
                <?php

                foreach ($social_list as $social_item) {
                    ?>
                    <li><a href="<?php echo esc_url($social_item); ?>"></a></li>
                    <?php
                }
                ?>

            </ul>
        </div>
        <?php
    }
}

if (!function_exists('havezic_site_branding')) {
    /**
     * Site branding wrapper and display
     *
     * @return void
     * @since  1.0.0
     */
    function havezic_site_branding() {
        ?>
        <div class="site-branding">
            <?php echo havezic_site_title_or_logo(); ?>
        </div>
        <?php
    }
}

if (!function_exists('havezic_site_title_or_logo')) {
    /**
     * Display the site title or logo
     *
     * @param bool $echo Echo the string or return it.
     *
     * @return string
     * @since 2.1.0
     */
    function havezic_site_title_or_logo() {
        ob_start();
        the_custom_logo(); ?>
        <div class="site-branding-text">
            <?php if (is_front_page()) : ?>
                <h1 class="site-title"><a href="<?php echo esc_url(home_url('/')); ?>"
                                          rel="home"><?php bloginfo('name'); ?></a></h1>
            <?php else : ?>
                <p class="site-title"><a href="<?php echo esc_url(home_url('/')); ?>"
                                         rel="home"><?php bloginfo('name'); ?></a></p>
            <?php endif; ?>

            <?php
            $description = get_bloginfo('description', 'display');

            if ($description || is_customize_preview()) :
                ?>
                <p class="site-description"><?php echo esc_html($description); ?></p>
            <?php endif; ?>
        </div><!-- .site-branding-text -->
        <?php
        $html = ob_get_clean();
        return $html;
    }
}

if (!function_exists('havezic_primary_navigation')) {
    /**
     * Display Primary Navigation
     *
     * @return void
     * @since  1.0.0
     */
    function havezic_primary_navigation() {
        ?>
        <nav class="main-navigation" role="navigation"
             aria-label="<?php esc_attr_e('Primary Navigation', 'havezic'); ?>">
            <?php
            wp_nav_menu(apply_filters('havezic_nav_menu_args', [
                'fallback_cb'     => '__return_empty_string',
                'theme_location'  => 'primary',
                'container_class' => 'primary-navigation',
            ]));
            ?>
        </nav>
        <?php
    }
}

if (!function_exists('havezic_mobile_navigation')) {
    /**
     * Display Handheld Navigation
     *
     * @return void
     * @since  1.0.0
     */
    function havezic_mobile_navigation() {
        if (isset(get_nav_menu_locations()['handheld']) && isset(get_nav_menu_locations()['handheld_categories'])) {
            ?>
            <div class="mobile-nav-tabs">
                <ul>
                    <?php if (isset(get_nav_menu_locations()['handheld'])) { ?>
                        <li class="mobile-tab-title mobile-pages-title active" data-menu="pages">
                            <span><?php echo esc_html(get_term(get_nav_menu_locations()['handheld'], 'nav_menu')->name); ?></span>
                        </li>
                    <?php } ?>
                    <?php if (isset(get_nav_menu_locations()['handheld_categories'])) { ?>
                        <li class="mobile-tab-title mobile-categories-title" data-menu="categories">
                            <span><?php echo esc_html(get_term(get_nav_menu_locations()['handheld_categories'], 'nav_menu')->name); ?></span>
                        </li>
                    <?php } ?>
                </ul>
            </div>
            <?php
        }
        ?>
        <nav class="mobile-menu-tab mobile-navigation mobile-pages-menu active"
             aria-label="<?php esc_attr_e('Mobile Navigation', 'havezic'); ?>">
            <?php
            wp_nav_menu(
                array(
                    'theme_location'  => 'handheld',
                    'container_class' => 'handheld-navigation',
                )
            );
            ?>
        </nav>
        <?php
        if (isset(get_nav_menu_locations()['handheld_categories'])) {

            ?>
            <nav class="mobile-menu-tab mobile-navigation-categories mobile-categories-menu"
                 aria-label="<?php esc_attr_e('Mobile Navigation', 'havezic'); ?>">
                <?php
                wp_nav_menu(
                    array(
                        'theme_location'  => 'handheld_categories',
                        'container_class' => 'handheld-navigation',
                    )
                );
                ?>
            </nav>
            <?php
        }
    }
}

if (!function_exists('havezic_homepage_header')) {
    /**
     * Display the page header without the featured image
     *
     * @since 1.0.0
     */
    function havezic_homepage_header() {
        edit_post_link(esc_html__('Edit this section', 'havezic'), '', '', '', 'button havezic-hero__button-edit');
        ?>
        <header class="entry-header">
            <?php
            the_title('<h1 class="entry-title">', '</h1>');
            ?>
        </header><!-- .entry-header -->
        <?php
    }
}

if (!function_exists('havezic_page_header')) {
    /**
     * Display the page header
     *
     * @since 1.0.0
     */
    function havezic_page_header() {

        if (is_front_page() || !is_page_template('default')) {
            return;
        }

        if (havezic_is_elementor_activated() && etb_after_header_enabled()) {
            return;
        }

        ?>
        <header class="entry-header">
            <?php
            if (has_post_thumbnail()) {
                havezic_post_thumbnail('full');
            }
            the_title('<h1 class="entry-title">', '</h1>');
            ?>
        </header><!-- .entry-header -->
        <?php
    }
}

if (!function_exists('havezic_page_content')) {
    /**
     * Display the post content
     *
     * @since 1.0.0
     */
    function havezic_page_content() {
        ?>
        <div class="entry-content">
            <?php the_content(); ?>
            <?php
            wp_link_pages(
                array(
                    'before' => '<div class="page-links">' . esc_html__('Pages:', 'havezic'),
                    'after'  => '</div>',
                )
            );
            ?>
        </div><!-- .entry-content -->
        <?php
    }
}

if (!function_exists('havezic_post_header')) {
    /**
     * Display the post header with a link to the single post
     *
     * @param string $size the post thumbnail size.
     *
     * @since 1.0.0
     * Display post thumbnail
     *
     * @uses has_post_thumbnail()
     * @uses the_post_thumbnail
     * @var $size . thumbnail|medium|large|full|$custom
     */
    function havezic_post_header($size = 'post-thumbnail') {
        ?>

        <header class="entry-header <?php echo has_post_thumbnail() ? esc_attr('header-post-thumbnail') : ''; ?>">

            <?php if (is_single()) { ?>
                <div class="entry-header-content">
                    <?php
                    the_title('<h1 class="beta entry-title">', '</h1>');
                    ?>
                    <div class="entry-meta">
                        <?php havezic_post_meta(['show_cat' => true, 'show_date' => true, 'show_author' => true, 'show_comment' => false]); ?>
                    </div>
                    <?php if (is_single()) {
                        the_excerpt();
                    } ?>
                </div>

                <?php
            } else { ?>
                <?php if (has_post_thumbnail()) {
                    echo '<div class="post-thumbnail">';
                    the_post_thumbnail($size ? $size : 'post-thumbnail');
                    echo '</div>';
                } ?>
                <div class="entry-meta">
                    <?php havezic_post_meta(['show_cat' => true, 'show_date' => true, 'show_author' => true, 'show_comment' => false]); ?>
                </div>
                <?php
                the_title('<h2 class="gamma entry-title"><a href="' . esc_url(get_permalink()) . '" rel="bookmark">', '</a></h2>');
            } ?>
        </header><!-- .entry-header -->
        <?php if (is_single() && has_post_thumbnail()) {
            echo '<div class="post-thumbnail">';
            the_post_thumbnail($size ? $size : 'post-thumbnail');
            echo '</div>';
        } ?>
        <?php
    }
}

if (!function_exists('havezic_post_content')) {
    /**
     * Display the post content with a link to the single post
     *
     * @since 1.0.0
     */
    function havezic_post_content() {
        ?>
        <div class="entry-content">
            <?php

            /**
             * Functions hooked in to havezic_post_content_before action.
             *
             */
            do_action('havezic_post_content_before');


            if (is_single()) {
                the_content(
                    sprintf(
                    /* translators: %s: post title */
                        esc_html__('Read More', 'havezic') . ' %s',
                        '<span class="screen-reader-text">' . get_the_title() . '</span>'
                    )
                );
            } else { ?>
                <div class="entry-excerpt"> <?php the_excerpt(); ?></div>
            <?php }
            if (!is_single()) { ?>
                <?php echo '<div class="more-link-wrap"><a class="more-link link-background" href="' . get_permalink() . '"><span class="elementor-button-icon left"><i class="havezic-icon-arrow-small-right"></i></span>' . esc_html__('Read More', 'havezic') . '<span class="elementor-button-icon right"><i class="havezic-icon-arrow-small-right"></i></span></a></div>'; ?>
            <?php }
            /**
             * Functions hooked in to havezic_post_content_after action.
             *
             */
            do_action('havezic_post_content_after');

            wp_link_pages(
                array(
                    'before' => '<div class="page-links">' . esc_html__('Pages:', 'havezic'),
                    'after'  => '</div>',
                )
            );
            ?>
        </div><!-- .entry-content -->
        <?php
    }
}

if (!function_exists('havezic_post_meta')) {
    /**
     * Display the post meta
     *
     * @since 1.0.0
     */
    function havezic_post_meta($atts = array()) {
        global $post;
        if ('post' !== get_post_type()) {
            return;
        }

        extract(
            shortcode_atts(
                array(
                    'show_date'    => true,
                    'show_cat'     => true,
                    'show_author'  => false,
                    'show_comment' => true,
                ),
                $atts
            )
        );
        $author = '';
        // Author.
        if ($show_author == 1) {
            $author_id = $post->post_author;
            $author    = sprintf(
                '<div class="post-author"><span class="text-author">%1$s</span><a href="%2$s" class="url fn" rel="author">%3$s</a></div>',
                esc_html__('By ', 'havezic'),
                esc_url(get_author_posts_url(get_the_author_meta('ID'))),
                esc_html(get_the_author_meta('display_name', $author_id))
            );
        }

        $posted_on = '';
        // Posted on.
        if ($show_date) {

            $time_string = '<time class="entry-date published updated" datetime="%1$s">%2$s</time>';

            if (get_the_time('U') !== get_the_modified_time('U')) {
                $time_string = '<time class="entry-date published" datetime="%1$s">%2$s</time><time class="updated" datetime="%3$s">%4$s</time>';
            }

            $time_string = sprintf(
                $time_string,
                esc_attr(get_the_date('c')),
                esc_html(get_the_date()),
                esc_attr(get_the_modified_date('c')),
                esc_html(get_the_modified_date())
            );

            $posted_on = '<div class="posted-on">' . sprintf('<a href="%1$s" rel="bookmark">%2$s</a>', esc_url(get_permalink()), $time_string) . '</div>';
        }

        $categories_list = get_the_category_list(', ');
        $categories      = '';
        if ($show_cat && $categories_list) {
            // Make sure there's more than one category before displaying.
            $categories = '<div class="categories-link"><span class="screen-reader-text">' . esc_html__('Categories', 'havezic') . '</span>' . $categories_list . '</div>';
        }


        echo wp_kses(
            sprintf(' %3$s %1$s %2$s', $posted_on, $author, $categories), array(
                'div'  => array(
                    'class' => array(),
                ),
                'span' => array(
                    'class' => array(),
                ),
                'i'    => array(
                    'class' => array(),
                ),
                'a'    => array(
                    'href'  => array(),
                    'rel'   => array(),
                    'class' => array(),
                ),
                'time' => array(
                    'datetime' => array(),
                    'class'    => array(),
                )
            )
        );

        if ($show_comment) { ?>
            <div class="meta-reply">
                <?php
                comments_popup_link(esc_html__('Comment (0)', 'havezic'), esc_html__('comment (1)', 'havezic'), esc_html__('Comments (%)', 'havezic'));
                ?>
            </div>
            <?php
        }

    }
}


if (!function_exists('havezic_post_date')) {
    function havezic_post_date() {

        $time_string = '<time class="entry-date published updated" datetime="%1$s">%2$s</time>';

        if (get_the_time('U') !== get_the_modified_time('U')) {
            $time_string = '<time class="entry-date published" datetime="%1$s">%2$s</time><time class="updated" datetime="%3$s">%4$s</time>';
        }

        $time_string = sprintf(
            $time_string,
            esc_attr(get_the_date('c')),
            esc_html(get_the_date()),
            esc_attr(get_the_modified_date('c')),
            esc_html(get_the_modified_date())
        );

        echo '<div class="posted-on">' . sprintf('<a href="%1$s" rel="bookmark">%2$s</a>', esc_url(get_permalink()), $time_string) . '</div>';

    }
}


if (!function_exists('havezic_get_allowed_html')) {
    function havezic_get_allowed_html() {
        return apply_filters(
            'havezic_allowed_html',
            array(
                'br'     => array(),
                'i'      => array(),
                'b'      => array(),
                'u'      => array(),
                'em'     => array(),
                'del'    => array(),
                'a'      => array(
                    'href'  => true,
                    'class' => true,
                    'title' => true,
                    'rel'   => true,
                ),
                'strong' => array(),
                'span'   => array(
                    'style' => true,
                    'class' => true,
                ),
            )
        );
    }
}

if (!function_exists('havezic_edit_post_link')) {
    /**
     * Display the edit link
     *
     * @since 2.5.0
     */
    function havezic_edit_post_link() {
        edit_post_link(
            sprintf(
                wp_kses(__('Edit <span class="screen-reader-text">%s</span>', 'havezic'),
                    array(
                        'span' => array(
                            'class' => array(),
                        ),
                    )
                ),
                get_the_title()
            ),
            '<div class="edit-link">',
            '</div>'
        );
    }
}

if (!function_exists('havezic_categories_link')) {
    /**
     * Prints HTML with meta information for the current cateogries
     */
    function havezic_categories_link() {

        // Get Categories for posts.
        $categories_list = get_the_category_list('');

        if ('post' === get_post_type() && $categories_list) {
            // Make sure there's more than one category before displaying.
            echo '<div class="categories-link"><span class="screen-reader-text">' . esc_html__('Categories', 'havezic') . '</span>' . $categories_list . '</div>';
        }
    }
}

if (!function_exists('havezic_post_taxonomy')) {
    /**
     * Display the post taxonomies
     *
     * @since 2.4.0
     */
    function havezic_post_taxonomy() {
        /* translators: used between list items, there is a space after the comma */

        /* translators: used between list items, there is a space after the comma */
        $tags_list = get_the_tag_list('', ' ');
        ?>
        <aside class="entry-taxonomy">
            <?php if ($tags_list) : ?>
                <div class="tags-links">
                    <span class="tags-text screen-reader-text"><?php echo esc_html(_n('Tag:', 'Tags:', count(get_the_tags()), 'havezic')); ?></span>
                    <?php printf('%s', $tags_list); ?>
                </div>
            <?php endif; ?>
            <?php havezic_social_share(); ?>
        </aside>
        <?php
    }
}

if (!function_exists('havezic_paging_nav')) {
    /**
     * Display navigation to next/previous set of posts when applicable.
     */
    function havezic_paging_nav() {

        $args = array(
            'type'      => 'list',
            'prev_text' => esc_html__('', 'havezic'),
            'next_text' => esc_html__('', 'havezic'),
        );
        the_posts_pagination($args);
    }
}

if (!function_exists('havezic_post_nav')) {
    /**
     * Display navigation to next/previous post when applicable.
     */
    function havezic_post_nav() {

        $prev_post      = get_previous_post();
        $next_post      = get_next_post();
        $args           = [];
        $thumbnail_prev = '';
        $thumbnail_next = '';

        if ($prev_post) {
            $thumbnail_prev = get_the_post_thumbnail($prev_post->ID, array(80, 80));
        };

        if ($next_post) {
            $thumbnail_next = get_the_post_thumbnail($next_post->ID, array(80, 80));
        };


        if ($next_post) {
            $args['next_text'] = '<span class="nav-content"><span class="reader-text">' . esc_html__('Next post', 'havezic') . ' </span><span class="title">%title</span></span>' . $thumbnail_next;
        }
        if ($prev_post) {
            $args['prev_text'] = $thumbnail_prev . '<span class="nav-content"><span class="reader-text">' . esc_html__('Previous post', 'havezic') . ' </span><span class="title">%title</span></span> ';
        }

        the_post_navigation($args);

    }
}

if (!function_exists('havezic_posted_on')) {
    /**
     * Prints HTML with meta information for the current post-date/time and author.
     *
     * @deprecated 2.4.0
     */
    function havezic_posted_on() {
        _deprecated_function('havezic_posted_on', '2.4.0');
    }
}

if (!function_exists('havezic_homepage_content')) {
    /**
     * Display homepage content
     * Hooked into the `homepage` action in the homepage template
     *
     * @return  void
     * @since  1.0.0
     */
    function havezic_homepage_content() {
        while (have_posts()) {
            the_post();

            get_template_part('content', 'homepage');

        } // end of the loop.
    }
}

if (!function_exists('havezic_get_sidebar')) {
    /**
     * Display havezic sidebar
     *
     * @uses get_sidebar()
     * @since 1.0.0
     */
    function havezic_get_sidebar() {
        get_sidebar();
    }
}

if (!function_exists('havezic_post_thumbnail')) {
    /**
     * Display post thumbnail
     *
     * @param string $size the post thumbnail size.
     *
     * @uses has_post_thumbnail()
     * @uses the_post_thumbnail
     * @var $size . thumbnail|medium|large|full|$custom
     * @since 1.5.0
     */
    function havezic_post_thumbnail($size = 'post-thumbnail') {
        if (has_post_thumbnail()) {
            echo '<div class="post-thumbnail">';
            the_post_thumbnail($size ? $size : 'post-thumbnail');
            echo '</div>';
        }
    }
}

if (!function_exists('havezic_header_account')) {
    function havezic_header_account() {

        if (!havezic_get_theme_option('show_header_account', true)) {
            return;
        }

        $account_link = wp_login_url();

        ?>
        <div class="site-header-account">
            <a href="<?php echo esc_url($account_link); ?>">
                <i class="havezic-icon-user"></i>
                <span class="account-content">
                    <?php
                    if (!is_user_logged_in()) {
                        esc_attr_e('Sign in', 'havezic');
                    } else {
                        $user = wp_get_current_user();
                        echo esc_html($user->display_name);
                    }

                    ?>
                </span>
            </a>
            <div class="account-dropdown">

            </div>
        </div>
        <?php
    }

}

if (!function_exists('havezic_template_account_dropdown')) {
    function havezic_template_account_dropdown() {
        if (!havezic_get_theme_option('show_header_account', true)) {
            return;
        }
        ?>
        <div class="account-wrap d-none">
            <div class="account-inner <?php if (is_user_logged_in()): echo "dashboard"; endif; ?>">
                <?php if (is_user_logged_in()) {
                    havezic_account_dropdown();
                }
                ?>
            </div>
        </div>
        <?php
    }
}

if (!function_exists('havezic_form_login')) {
    function havezic_form_login() {
        if (!is_user_logged_in()) {
            if (havezic_is_ba_booking_activated()):

                $account_page = intval(BABE_Settings::$settings['my_account_page']);
                $account_link = get_the_permalink($account_page);

                ?>
                <div class="account-wrap mfp-hide" id="havezic-login-form">
                    <div class="my_account_page_content_wrapper">
                        <?php echo BABE_My_account::get_login_form(); ?>
                        <?php if (get_option('users_can_register')) : ?>
                            <div class="login_registration">
                                <span><?php esc_html_e('Do not have an account?', 'havezic'); ?></span>
                                <div class="registration_link">
                                    <a class="btn-register js-btn-register-popup"
                                       href="#havezic-register-form"><?php esc_html_e('Register', 'havezic'); ?></a>
                                </div>
                            </div>

                        <?php endif; ?>
                    </div>
                </div>
                <div class="account-wrap mfp-hide" id="havezic-register-form">
                    <div class="my_account_page_content_wrapper">

                        <?php if (get_option('users_can_register')) : ?>

                            <div id="signup_form" class="havezic-form-popup login_reg_content">
                                <h3 class="havezic-login-title"><?php esc_html_e('Sign Up', 'havezic'); ?></h3>
                                <form name="registration_form" id="registration_form"
                                      action="<?php echo esc_url(BABE_Settings::get_my_account_page_url(array('action' => 'registration'))); ?>"
                                      method="post">

                                    <div class="new-username">
                                        <label for="new_username"><?php esc_html_e('Username *', 'havezic'); ?></label>
                                        <input type="text" name="new_username" id="new_username" class="input" value=""
                                               size="20" required="required">
                                        <div class="new-username-check-msg"><?php esc_html_e('This username already exists*', 'havezic'); ?></div>
                                    </div>

                                    <div class="new-first-name">
                                        <label for="new_first_name"><?php esc_html_e('First name', 'havezic'); ?></label>
                                        <input type="text" name="new_first_name" id="new_first_name" class="input"
                                               value="" size="20" required="required">
                                    </div>
                                    <div class="new-last-name">
                                        <label for="new_last_name"><?php esc_html_e('Last name', 'havezic'); ?></label>
                                        <input type="text" name="new_last_name" id="new_last_name" class="input"
                                               value="" size="20" required="required">
                                    </div>

                                    <div class="new-email">
                                        <label for="new_email"><?php esc_html_e('Your email *', 'havezic'); ?></label>
                                        <input type="text" name="new_email" id="new_email" class="input" value=""
                                               size="20" required="required">
                                        <div class="new-email-check-msg"><?php esc_html_e('This email already exists', 'havezic'); ?></div>
                                    </div>
                                    <div class="new-email">
                                        <label for="new_email_confirm"><?php esc_html_e('Confirm email *', 'havezic'); ?></label>
                                        <input type="text" name="new_email_confirm" id="new_email_confirm" class="input"
                                               value="" size="20" required="required">
                                    </div>
                                    <input type="hidden" name="nonce" value="<?php echo esc_attr(wp_create_nonce('babe-nonce')) ?>">
                                    <div class="new-submit">
                                        <input type="submit" name="new-submit" id="new-submit"
                                               class="button button-primary"
                                               value="<?php esc_attr_e('Sign up', 'havezic'); ?>">
                                        <div class="form-spinner"><i class="fas fa-spinner fa-spin"></i></div>
                                    </div>
                                </form>
                                <div class="login_registration">
                                    <span><?php esc_html_e('Already have an account?', 'havezic'); ?></span>
                                    <div class="registration_link">
                                        <a class="btn-login js-btn-login-popup"
                                           href="#havezic-login-form"><?php esc_html_e('Login', 'havezic'); ?></a>
                                    </div>
                                </div>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>

            <?php else: ?>
                <div class="account-wrap mfp-hide" id="havezic-login-form">
                    <div class="login-form-head">
                        <span class="login-form-title"><?php echo esc_html__('Sign in', 'havezic') ?></span>
                        <?php if (get_option('users_can_register')) : ?>
                            <span class="pull-right">
                        <a class="register-link" href="<?php echo esc_url(wp_registration_url()); ?>"
                           title="<?php echo esc_attr__('Register', 'havezic'); ?>"><?php echo esc_html__('Create an Account', 'havezic'); ?></a>
                    </span>
                        <?php endif; ?>
                    </div>
                    <form class="havezic-login-form-ajax" data-toggle="validator">
                        <p>
                            <label><?php echo esc_html__('Username or email', 'havezic'); ?>
                                <span class="required">*</span></label>
                            <input name="username" type="text" required
                                   placeholder="<?php echo esc_attr__('Username', 'havezic') ?>">
                        </p>
                        <p>
                            <label><?php echo esc_html__('Password', 'havezic'); ?> <span class="required">*</span></label>
                            <input name="password" type="password" required
                                   placeholder="<?php echo esc_attr__('Password', 'havezic') ?>">
                        </p>
                        <button type="submit" data-button-action
                                class="btn btn-primary btn-block w-100 mt-1"><?php esc_html_e('Login', 'havezic') ?></button>
                        <input type="hidden" name="action" value="havezic_login">
                        <?php wp_nonce_field('ajax-havezic-login-nonce', 'security-login'); ?>
                    </form>
                    <div class="login-form-bottom">
                        <a href="<?php echo wp_lostpassword_url(get_permalink()); ?>" class="lostpass-link"
                           title="<?php esc_attr_e('Lost your password?', 'havezic'); ?>"><?php echo esc_html__('Lost your password?', 'havezic'); ?></a>
                    </div>
                </div>
            <?php
            endif;
        } else { ?>
            <div class="account-wrap" id="havezic-dashboard" style="display: none;">
                <div class="account-inner dashboard">
                    <?php havezic_account_dropdown(); ?>
                </div>
            </div>
            <?php
        }
    }
}

if (!function_exists('')) {
    function havezic_account_dropdown() { ?>
        <?php if (has_nav_menu('my-account')) : ?>
            <nav class="social-navigation" role="navigation" aria-label="<?php esc_attr_e('Dashboard', 'havezic'); ?>">
                <?php
                wp_nav_menu(array(
                    'theme_location' => 'my-account',
                    'menu_class'     => 'account-links-menu',
                    'depth'          => 1,
                ));
                ?>
            </nav><!-- .social-navigation -->
        <?php else: ?>
            <?php
            $check_role               = false;
            if (havezic_is_ba_booking_activated()) {
                $user_info  = wp_get_current_user();
                $check_role = BABE_My_account::validate_role($user_info);
            }

            if ($check_role):
                $nav_arr = Havezic_BA_Booking::list_account_menu($check_role);
                $current_nav_slug_arr = BABE_My_account::get_current_nav_slug($nav_arr);
                $current_nav_slug     = key($current_nav_slug_arr);
                $depth                = 0;

                ?>
                <ul class="account-dashboard">
                    <?php
                    foreach ($nav_arr as $nav_slug => $nav_item) {

                        $current_page_class = 'my_account_nav_item my_account_nav_item_' . $nav_slug . ' my_account_nav_item_' . $depth;
                        $current_page_class .= $current_nav_slug == $nav_slug ? ' my_account_nav_item_current' : ''; ?>
                        <li class="<?php echo esc_attr($current_page_class); ?>">
                            <?php
                            if (is_array($nav_item)) {
                                $nav_item['title'] = isset($nav_item['title']) ? $nav_item['title'] : '';
                                ?>

                                <?php
                                printf("%s", Havezic_BA_Booking::get_nav_html($nav_item, $current_nav_slug, ($depth + 1)));
                            } else {
                                printf("%s", Havezic_BA_Booking::get_nav_item_html($nav_slug, $nav_item, $depth));
                            } ?>
                        </li>
                        <?php
                    }
                    ?>
                </ul>

            <?php else: ?>
                <ul class="account-dashboard">
                    <li>
                        <a class="nav-link" href="<?php echo esc_url(get_dashboard_url(get_current_user_id())); ?>"
                           title="<?php esc_attr_e('Dashboard', 'havezic'); ?>"><?php esc_html_e('Dashboard', 'havezic'); ?></a>
                    </li>
                    <li>
                        <a class="nav-link" title="<?php esc_attr_e('Log out', 'havezic'); ?>" class="tips"
                           href="<?php echo esc_url(wp_logout_url(home_url())); ?>"><?php esc_html_e('Log Out', 'havezic'); ?></a>
                    </li>
                </ul>
            <?php endif; ?>
        <?php endif;

    }
}

if (!function_exists('havezic_header_search_popup')) {
    function havezic_header_search_popup() {
        ?>
        <div class="site-search-popup">
            <div class="site-search-popup-wrap">
                <div class="site-search widget_search">
                    <?php get_search_form(); ?>
                </div>
                <a href="#" class="site-search-popup-close">
                    <svg class="close-icon" xmlns="http://www.w3.org/2000/svg" width="23.691" height="22.723" viewBox="0 0 23.691 22.723">
                        <g transform="translate(-126.154 -143.139)">
                            <line x2="23" y2="22" transform="translate(126.5 143.5)" fill="none" stroke="CurrentColor" stroke-width="1"></line>
                            <path d="M0,22,23,0" transform="translate(126.5 143.5)" fill="none" stroke="CurrentColor" stroke-width="1"></path>
                        </g>
                    </svg>
                </a>
            </div>
        </div>
        <?php
    }
}

if (!function_exists('havezic_header_search_button')) {
    function havezic_header_search_button() {
        add_action('wp_footer', 'havezic_header_search_popup', 1);
        ?>
        <div class="site-header-search">
            <a href="#" class="button-search-popup"><i class="havezic-icon-search"></i></a>
        </div>
        <?php
    }
}

if (!function_exists('havezic_mobile_nav')) {
    function havezic_mobile_nav() {
        if (isset(get_nav_menu_locations()['handheld'])) {
            ?>
            <div class="havezic-mobile-nav">
                <div class="menu-scroll-mobile">
                    <?php
                    havezic_site_branding();
                    ?>
                    <a href="#" class="mobile-nav-close"><i class="havezic-icon-times"></i></a>
                    <?php
                    havezic_mobile_navigation();
                    havezic_social();
                    ?>
                </div>
            </div>
            <div class="havezic-overlay"></div>
            <?php
        }
    }
}

if (!function_exists('havezic_mobile_nav_button')) {
    function havezic_mobile_nav_button() {
        if (isset(get_nav_menu_locations()['handheld'])) {
            ?>
            <a href="#" class="menu-mobile-nav-button">
				<span
                        class="toggle-text screen-reader-text"><?php echo esc_html(apply_filters('havezic_menu_toggle_text', esc_html__('Menu', 'havezic'))); ?></span>
                <div class="havezic-icon">
                    <span class="icon-1"></span>
                    <span class="icon-2"></span>
                    <span class="icon-3"></span>
                </div>
            </a>
            <?php
        }
    }
}

if (!function_exists('havezic_language_switcher')) {
    function havezic_language_switcher() {
        $languages = apply_filters('wpml_active_languages', []);
        if (havezic_is_wpml_activated() && count($languages) > 0) {
            ?>
            <div class="havezic-language-switcher">
                <ul class="menu">
                    <li class="item">
                        <div class="language-switcher-head">
                            <span class="title"><?php echo esc_html($languages[ICL_LANGUAGE_CODE]['translated_name']); ?></span>
                            <i class="havezic-icon-angle-down"></i>
                        </div>

                        <ul class="sub-item">
                            <?php
                            foreach ($languages as $key => $language) {
                                if (ICL_LANGUAGE_CODE === $key) {
                                    continue;
                                }
                                ?>
                                <li>
                                    <a href="<?php echo esc_url($language['url']) ?>">
                                        <img width="18" height="12" src="<?php echo esc_url($language['country_flag_url']) ?>" alt="<?php esc_attr($language['default_locale']) ?>">
                                        <span><?php echo esc_html($language['translated_name']); ?></span>
                                    </a>
                                </li>
                                <?php
                            }
                            ?>
                        </ul>
                    </li>
                </ul>
            </div>
            <?php
        }

    }
}


if (!function_exists('havezic_footer_default')) {
    function havezic_footer_default() {
        get_template_part('template-parts/copyright');
    }
}

if (!function_exists('havezic_social_share')) {
    function havezic_social_share() {
        get_template_part('template-parts/socials');
    }
}

if (!function_exists('havezic_pingback_header')) {
    /**
     * Add a pingback url auto-discovery header for single posts, pages, or attachments.
     */
    function havezic_pingback_header() {
        if (is_singular() && pings_open()) {
            echo '<link rel="pingback" href="', esc_url(get_bloginfo('pingback_url')), '">';
        }
    }
}


if (!function_exists('havezic_update_comment_fields')) {
    function havezic_update_comment_fields($fields) {

        $commenter = wp_get_current_commenter();
        $req       = get_option('require_name_email');
        $aria_req  = $req ? "aria-required='true'" : '';

        $fields['author']
            = '<p class="comment-form-author">
			<input id="author" name="author" type="text" placeholder="' . esc_attr__('Your Name *', 'havezic') . '" value="' . esc_attr($commenter['comment_author']) .
              '" size="30" ' . $aria_req . ' />
		</p>';

        $fields['email']
            = '<p class="comment-form-email">
			<input id="email" name="email" type="email" placeholder="' . esc_attr__('Email Address *', 'havezic') . '" value="' . esc_attr($commenter['comment_author_email']) .
              '" size="30" ' . $aria_req . ' />
		</p>';

        $fields['url']
            = '<p class="comment-form-url">
			<input id="url" name="url" type="url" placeholder="' . esc_attr__('Your Website', 'havezic') . '" value="' . esc_attr($commenter['comment_author_url']) .
              '" size="30" />
			</p>';

        return $fields;
    }
}

add_filter('comment_form_default_fields', 'havezic_update_comment_fields');


if (!function_exists('havezic_comment_form_defaults')) {
    function havezic_comment_form_defaults($defaults) {
        $defaults['submit_button'] = '<button name="%1$s" type="submit" id="%2$s" class="%3$s button-style"><span class="elementor-button-icon left"><i class="havezic-icon-arrow-small-right"></i></span>%4$s<span class="elementor-button-icon right"><i class="havezic-icon-arrow-small-right"></i></span></button>';
        return $defaults;
    }
}

add_filter('comment_form_defaults', 'havezic_comment_form_defaults');

function havezic_replace_categories_list($output, $args) {
    if ($args['show_count'] = 1) {
        $pattern     = '#<li([^>]*)><a([^>]*)>(.*?)<\/a>\s*\(([0-9]*)\)\s*#i';  // removed ( and )
        $replacement = '<li$1><a$2><span class="cat-name">$3</span> <span class="cat-count">($4)</span></a>';
        return preg_replace($pattern, $replacement, $output);
    }
    return $output;
}

add_filter('wp_list_categories', 'havezic_replace_categories_list', 10, 2);

function havezic_replace_archive_list($link_html, $url, $text, $format, $before, $after, $selected) {
    if ($format == 'html') {
        $pattern     = '#<li><a([^>]*)>(.*?)<\/a>&nbsp;\s*\(([0-9]*)\)\s*#i';  // removed ( and )
        $replacement = '<li><a$1><span class="archive-name">$2</span> <span class="archive-count">($3)</span></a>';
        return preg_replace($pattern, $replacement, $link_html);
    }
    return $link_html;
}

add_filter('get_archives_link', 'havezic_replace_archive_list', 10, 7);


add_filter('bcn_breadcrumb_title', 'havezic_breadcrumb_title_swapper', 3, 10);
function havezic_breadcrumb_title_swapper($title, $type, $id) {
    if (in_array('home', $type)) {
        $title = esc_html__('Home', 'havezic');
    }
    return $title;
}

if (!function_exists('havezic_single_author')) {
    function havezic_single_author() {
        get_template_part('template-parts/author');
    }
}

if (!function_exists('render_html_back_to_top')) {
    function render_html_back_to_top() {
        echo <<<HTML
        <a href="#" class="scrollup"><i class="havezic-icon-arrow-small-up"></i></a>
HTML;

    }
}