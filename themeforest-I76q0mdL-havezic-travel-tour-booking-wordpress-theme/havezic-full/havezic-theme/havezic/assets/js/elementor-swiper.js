class havezicSwiperBase extends elementorModules.frontend.handlers.Base {
    getDefaultSettings() {
        return {
            selectors: {
                carousel: `.${elementorFrontend.config.swiperClass}`,
                slideContent: '.swiper-slide',
            },
        };
    }

    getDefaultElements() {
        const selectors = this.getSettings('selectors');
        const elements = {
            $swiperContainer: this.$element.find(selectors.carousel),
        };
        elements.$slides = elements.$swiperContainer.find(selectors.slideContent);
        return elements;
    }

    getSwiperSettings() {
        const elementSettings = this.getElementSettings(),
            slidesToShow = elementSettings.slides_to_show || 3,
            isSingleSlide = 1 === slidesToShow,
            elementorBreakpoints = elementorFrontend.config.responsive.activeBreakpoints,
            defaultSlidesToShowMap = {
                mobile: 1,
                tablet: isSingleSlide ? 1 : 2,
            };


        const swiperOptions = {
            slidesPerView: slidesToShow,
            loop: 'yes' === elementSettings.infinite,
            speed: elementSettings.speed,
            handleElementorBreakpoints: true,
            watchSlidesVisibility: true
        };
        swiperOptions.breakpoints = {};
        let lastBreakpointSlidesToShowValue = slidesToShow;
        let lastBreakpointSpaceBetweenValue = 0;
        if (elementSettings.spaceBetween) {
            swiperOptions.spaceBetween = elementSettings.spaceBetween.size;
            lastBreakpointSpaceBetweenValue = elementSettings.spaceBetween.size || 0;
        }

        Object.keys(elementorBreakpoints).reverse().forEach((breakpointName) => {
            // Tablet has a specific default `slides_to_show`.
            const defaultSlidesToShow = defaultSlidesToShowMap[breakpointName] ? defaultSlidesToShowMap[breakpointName] : lastBreakpointSlidesToShowValue;
            swiperOptions.breakpoints[elementorBreakpoints[breakpointName].value] = {
                slidesPerView: +elementSettings['slides_to_show_' + breakpointName] || defaultSlidesToShow,
                slidesPerGroup: +elementSettings['slides_to_scroll_' + breakpointName] || 1,
            };
            lastBreakpointSlidesToShowValue = +elementSettings['slides_to_show_' + breakpointName] || defaultSlidesToShow;
            if (typeof elementSettings['spaceBetween_' + breakpointName] !== 'undefined') {
                swiperOptions.breakpoints[elementorBreakpoints[breakpointName].value]['spaceBetween'] = +elementSettings['spaceBetween_' + breakpointName].size || lastBreakpointSpaceBetweenValue;
                lastBreakpointSpaceBetweenValue = +elementSettings['spaceBetween_' + breakpointName].size || 0;
            }
        });

        if ('yes' === elementSettings.autoplay) {
            swiperOptions.autoplay = {
                delay: elementSettings.autoplay_speed,
                disableOnInteraction: 'yes' === elementSettings.pause_on_interaction,
            };
        }

        if ('yes' === elementSettings.mousewheel) {
            swiperOptions.mousewheel = true;
        }

        if ('yes' === elementSettings.autoheight) {
            swiperOptions.autoHeight = true;
        }else {
            swiperOptions.autoHeight = false;
        }

        if ('yes' === elementSettings.lazyload) {
            swiperOptions.lazy = true;
        }

        if ('yes' === elementSettings.enable_centeredSlides) {
            swiperOptions.centeredSlides = true;
        }

        if (isSingleSlide) {
            swiperOptions.effect = elementSettings.effect;
            if ('fade' === elementSettings.effect) {
                swiperOptions.fadeEffect = {crossFade: true};
            }
        } else {
            if ('fade' === elementSettings.effect) {
                swiperOptions.effect = 'fade';
                swiperOptions.fadeEffect = {crossFade: true};
            }
            else {
                swiperOptions.slidesPerGroup = +elementSettings.slides_to_scroll || 1;
            }
        }

        const showArrows = 'arrows' === elementSettings.navigation || 'both' === elementSettings.navigation,
            showDots = 'dots' === elementSettings.navigation || 'both' === elementSettings.navigation || 'custom' === elementSettings.navigation;
        if (showArrows) {
            swiperOptions.navigation = {
                prevEl: this.$element.find('.elementor-swiper-button-prev').get(0),
                nextEl: this.$element.find('.elementor-swiper-button-next').get(0),
            };
        }
        if (showDots) {
            swiperOptions.pagination = {
                el: this.$element.find('.swiper-pagination').get(0),
                type: 'bullets',
                clickable: true,
            };
        }

        if (typeof elementSettings.enable_scrollbar !== 'undefined' && elementSettings.enable_scrollbar === 'yes') {
            swiperOptions.scrollbar = {
                el: this.$element.find('.swiper-scrollbar').get(0),
                hide: false,
                draggable: true,
            }
            swiperOptions.loop = false;
        }


        if (typeof elementSettings.enable_fraction !== 'undefined' && elementSettings.enable_fraction === 'yes') {
            swiperOptions.pagination = {
                el: this.$element.find('.swiper-pagination').get(0),
                type: "fraction",
            }
            swiperOptions.loop = true;
        }


        if ('vertical' === elementSettings.direction) {
            swiperOptions.direction = 'vertical';
            swiperOptions.slidesPerView = 1;
            swiperOptions.breakpoints = {};
            swiperOptions.loop = false;
            swiperOptions.on = {
                init: function (swiper) {
                    const currentSlide = swiper.slides[swiper.activeIndex];
                    const currentSlideItem = currentSlide.children[0];
                    jQuery(swiper.$el).css({
                        height: currentSlideItem.clientHeight
                    });
                },
                slideChange: function (swiper) {
                    const currentSlide = swiper.slides[swiper.activeIndex];
                    const currentSlideItem = currentSlide.children[0];
                    jQuery(swiper.$el).css({
                        height: currentSlideItem.clientHeight
                    });
                },
            }
        }

        return swiperOptions;
    }

    updateSwiperOption(propertyName) {
        const elementSettings = this.getElementSettings(),
            newSettingValue = elementSettings[propertyName],
            params = this.swiper.params;
        // Handle special cases where the value to update is not the value that the Swiper library accepts.
        switch (propertyName) {
            case 'image_spacing_custom':
                params.spaceBetween = newSettingValue.size || 0;
                break;
            case 'autoplay_speed':
                params.autoplay.delay = newSettingValue;
                break;
            case 'speed':
                params.speed = newSettingValue;
                break;
        }
        this.swiper.update();
    }

    getChangeableProperties() {
        return {
            pause_on_hover: 'pauseOnHover',
            autoplay_speed: 'delay',
            speed: 'speed',
            image_spacing_custom: 'spaceBetween',
        };
    }

    onElementChange(propertyName) {
        const changeableProperties = this.getChangeableProperties();
        if (changeableProperties[propertyName]) {
            // 'pause_on_hover' is implemented by the handler with event listeners, not the Swiper library.
            if ('pause_on_hover' === propertyName) {
                const newSettingValue = this.getElementSettings('pause_on_hover');
                this.togglePauseOnHover('yes' === newSettingValue);
            } else {
                this.updateSwiperOption(propertyName);
            }
        }
    }

    onEditSettingsChange(propertyName) {
        if ('activeItemIndex' === propertyName) {
            this.swiper.slideToLoop(this.getEditSettings('activeItemIndex') - 1);
        }
    }

    async bindEvents() {
        const elementSettings = this.getElementSettings();
        if (!this.elements.$swiperContainer.length || 2 > this.elements.$slides.length) {
            return;
        }

        const Swiper = elementorFrontend.utils.swiper;
        this.swiper = await new Swiper(this.elements.$swiperContainer, this.getSwiperSettings());
        // Expose the swiper instance in the frontend
        this.elements.$swiperContainer.data('swiper', this.swiper);
        if ('yes' === elementSettings.pause_on_hover) {
            this.togglePauseOnHover(true);
        }

        this.animate();
    }

    animate() {
        var slides = this.swiper.$wrapperEl.find('.swiper-slide');
        var currentSlide = jQuery(slides).filter('.swiper-slide-active');
        currentSlide.addClass('animated');

        this.swiper.on('slideChange', () => {
            var slides_lookbook = this.swiper.$wrapperEl.find('.elementor-widget-havezic-image-lookbook');
            slides_lookbook.trigger('slideChange');
        });

        this.swiper.on('slideChangeTransitionEnd', () => {
            var slides = this.swiper.$wrapperEl.find('.swiper-slide');
            var visibleSlides = jQuery(slides).filter('.swiper-slide-active');
            visibleSlides.addClass('animated');

            slides.removeClass('swiper-ken-burn-active');
            visibleSlides.addClass('swiper-ken-burn-active');
        });

        this.swiper.on('slideChangeTransitionStart', () => {
            var slides = this.swiper.$wrapperEl.find('.swiper-slide');
            slides.removeClass('animated');
        });
    }

    togglePauseOnHover(toggleOn) {
        if (toggleOn) {
            this.elements.$swiperContainer.on({
                mouseenter: () => {
                    this.swiper.autoplay.stop();
                },
                mouseleave: () => {
                    this.swiper.autoplay.start();
                },
            });
        } else {
            this.elements.$swiperContainer.off('mouseenter mouseleave');
        }
    }
}