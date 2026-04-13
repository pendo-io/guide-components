/**
 * Mock Pendo Client
 *
 * A minimal simulation of pendo-client for testing HTML guides.
 * Implements the core HtmlGuides plugin flow without actual server communication.
 */

class MockPendo {
    constructor(config = {}) {
        this.visitor = config.visitor || { id: 'anonymous' };
        this.account = config.account || { id: 'unknown' };
        this.guides = [];
        this.activeGuides = [];
        this.eventLog = [];

        // Create guide container
        this._guideContainer = null;

        console.log('[MockPendo] Initialized', { visitor: this.visitor, account: this.account });
    }

    /**
     * Initialize with guide data
     */
    initialize(guides = []) {
        this.guides = guides.map(g => this._hydrateGuide(g));
        console.log('[MockPendo] Loaded guides:', this.guides.map(g => g.id));
    }

    /**
     * Show a specific guide by ID
     */
    showGuideById(guideId) {
        const guide = this.guides.find(g => g.id === guideId);
        if (!guide) {
            console.warn('[MockPendo] Guide not found:', guideId);
            return false;
        }

        if (guide.isShown()) {
            console.log('[MockPendo] Guide already shown:', guideId);
            return false;
        }

        console.log('[MockPendo] Showing guide:', guideId);
        guide.show('api');
        return true;
    }

    /**
     * Hide all active guides
     */
    hideGuides() {
        this.activeGuides.forEach(g => g.hide());
        this.activeGuides = [];
    }

    /**
     * Get currently active guides
     */
    getActiveGuides() {
        return this.guides.filter(g => g.isShown());
    }

    /**
     * Log an event (for debugging)
     */
    track(eventName, properties = {}) {
        const event = { eventName, properties, timestamp: Date.now() };
        this.eventLog.push(event);
        console.log('[MockPendo] Track:', eventName, properties);
    }

    /**
     * Hydrate a guide with behaviors
     */
    _hydrateGuide(guideData) {
        const pendo = this;
        let shown = false;
        let activeStepIndex = 0;

        const guide = {
            ...guideData,
            steps: guideData.steps.map((step, i) => this._hydrateStep(step, i, guideData)),

            isShown() {
                return shown;
            },

            getActiveStep() {
                return guide.steps[activeStepIndex];
            },

            show(reason = 'auto') {
                if (shown) return;
                shown = true;
                pendo.activeGuides.push(guide);

                const step = guide.getActiveStep();
                if (step) {
                    step.show(reason);
                }

                pendo.track('guideSeen', { guide_id: guide.id, reason });
            },

            hide() {
                if (!shown) return;
                shown = false;

                guide.steps.forEach(step => step.hide());
                pendo.activeGuides = pendo.activeGuides.filter(g => g.id !== guide.id);

                pendo.track('guideDismissed', { guide_id: guide.id });
            },

            advanceStep() {
                const currentStep = guide.steps[activeStepIndex];
                if (currentStep) {
                    currentStep.hide();
                }

                if (activeStepIndex < guide.steps.length - 1) {
                    activeStepIndex++;
                    const nextStep = guide.steps[activeStepIndex];
                    if (nextStep) {
                        nextStep.show('advanced');
                    }
                    pendo.track('guideAdvanced', { guide_id: guide.id, step_index: activeStepIndex });
                } else {
                    // Last step - dismiss guide
                    guide.hide();
                }
            },

            previousStep() {
                const currentStep = guide.steps[activeStepIndex];
                if (currentStep) {
                    currentStep.hide();
                }

                if (activeStepIndex > 0) {
                    activeStepIndex--;
                    const prevStep = guide.steps[activeStepIndex];
                    if (prevStep) {
                        prevStep.show('previous');
                    }
                }
            }
        };

        // Link steps back to guide
        guide.steps.forEach(step => {
            step._guide = guide;
        });

        return guide;
    }

    /**
     * Hydrate a step with behaviors
     */
    _hydrateStep(stepData, index, guideData) {
        const pendo = this;
        let container = null;
        let rendered = false;

        const step = {
            ...stepData,
            _guide: null, // Set after guide creation

            isRendered() {
                return rendered;
            },

            show(reason = 'auto') {
                if (rendered) return;

                const htmlContent = step.attributes?.htmlContent || step.htmlContent;
                if (!htmlContent) {
                    console.warn('[MockPendo] No HTML content for step:', step.id);
                    return;
                }

                container = pendo._renderStep(step, guideData, htmlContent);
                if (container) {
                    rendered = true;
                    pendo._setupStepListeners(container, step);
                    pendo.track('stepSeen', { guide_id: guideData.id, step_id: step.id, reason });
                }
            },

            hide() {
                if (!rendered || !container) return;
                pendo._destroyStep(container);
                container = null;
                rendered = false;
            }
        };

        return step;
    }

    /**
     * Render a step to the DOM
     */
    _renderStep(step, guide, htmlContent) {
        // Check if guide-components is loaded
        if (!customElements.get('pendo-guide')) {
            console.error('[MockPendo] @pendo/guide-components not loaded!');
            return null;
        }

        const totalSteps = guide.steps.length;
        const stepIndex = guide.steps.findIndex(s => s.id === step.id);

        // Create container
        const container = document.createElement('div');
        container.className = 'pendo-html-guide';
        container.setAttribute('data-step-id', step.id);
        container.setAttribute('data-guide-id', guide.id);
        container.id = 'pendo-html-' + step.id;

        // Inject step/total-steps for multi-step progress
        let html = htmlContent;
        if (totalSteps > 1) {
            html = html.replace(
                '<pendo-guide',
                `<pendo-guide step="${stepIndex + 1}" total-steps="${totalSteps}"`
            );
        }

        container.innerHTML = html;

        // Apply theme if present
        const guideEl = container.querySelector('pendo-guide');
        if (guideEl && guide.buildingBlocks) {
            this._applyTheme(guideEl, guide.buildingBlocks);
        }

        // Apply layout
        this._applyLayout(container, step);

        // Append to guide container
        this._getGuideContainer().appendChild(container);

        return container;
    }

    /**
     * Apply theme CSS custom properties
     */
    _applyTheme(guideEl, buildingBlocks) {
        const bb = buildingBlocks;
        const css = {};

        // Container styles
        const container = bb.container || {};
        if (container.background) css['--pendo-bg'] = container.background;
        if (container.borderColor) css['--pendo-border'] = container.borderColor;
        if (container.borderRadius) css['--pendo-radius'] = container.borderRadius;

        // Shadow
        if (container.shadowColor) {
            const h = container.shadowOffsetHorizontal || '0px';
            const v = container.shadowOffsetVertical || '0px';
            const blur = container.shadowRadius || '0px';
            const spread = container.shadowSpread || '0px';
            css['--pendo-shadow'] = `${h} ${v} ${blur} ${spread} ${container.shadowColor}`;
        }

        // Primary button
        const primaryButton = bb.primaryButton || {};
        if (primaryButton.background) css['--pendo-primary'] = primaryButton.background;
        if (primaryButton.hover?.background) css['--pendo-primary-hover'] = primaryButton.hover.background;
        if (primaryButton.fontFamily) css['--pendo-font'] = primaryButton.fontFamily;

        // Text colors
        if (bb.title?.fontColor) css['--pendo-text'] = bb.title.fontColor;
        if (bb.paragraph?.fontColor) css['--pendo-text-muted'] = bb.paragraph.fontColor;

        // Apply properties
        Object.entries(css).forEach(([prop, value]) => {
            guideEl.style.setProperty(prop, value);
        });
    }

    /**
     * Apply layout styling
     */
    _applyLayout(container, step) {
        const guideEl = container.querySelector('pendo-guide');
        if (!guideEl) return;

        const layoutType = step.buildingBlockLayoutType || step.layoutType || 'lightbox';
        const layoutPosition = step.layoutPosition || 'bottom';

        switch (layoutType) {
            case 'tooltip':
                this._applyTooltipLayout(container, guideEl, step, layoutPosition);
                break;

            case 'banner':
                this._applyBannerLayout(container, guideEl, layoutPosition);
                break;

            case 'slideout':
                this._applySlideoutLayout(container, guideEl, layoutPosition);
                break;

            case 'lightbox':
            default:
                this._applyLightboxLayout(container, guideEl);
                break;
        }
    }

    _applyLightboxLayout(container, guideEl) {
        guideEl.classList.add('pendo-guide--lightbox');

        Object.assign(container.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '10000'
        });

        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'pendo-backdrop';
        Object.assign(backdrop.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: '-1'
        });

        backdrop.addEventListener('click', () => {
            guideEl.dispatchEvent(new CustomEvent('pendo-action', {
                detail: { action: 'dismiss' },
                bubbles: true
            }));
        });

        container.insertBefore(backdrop, container.firstChild);
    }

    _applyTooltipLayout(container, guideEl, step, position) {
        guideEl.classList.add('pendo-guide--tooltip', `pendo-guide--tooltip-${position}`);

        const selector = step.elementPathRule || step.target;
        if (!selector) {
            console.warn('[MockPendo] Tooltip has no target, falling back to lightbox');
            this._applyLightboxLayout(container, guideEl);
            return;
        }

        const target = document.querySelector(selector);
        if (!target) {
            console.warn('[MockPendo] Tooltip target not found:', selector);
            this._applyLightboxLayout(container, guideEl);
            return;
        }

        const rect = target.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const tooltipWidth = 320; // Approximate tooltip width
        const padding = 16;

        // Use fixed positioning relative to viewport
        let top, left;

        switch (position) {
            case 'top':
                top = rect.top - 8;
                left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
                break;

            case 'left':
                top = rect.top + (rect.height / 2);
                left = rect.left - tooltipWidth - 8;
                break;

            case 'right':
                top = rect.top + (rect.height / 2);
                left = rect.right + 8;
                break;

            case 'bottom':
            default:
                top = rect.bottom + 8;
                left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
                break;
        }

        // Clamp left position to keep tooltip on screen
        left = Math.max(padding, Math.min(left, viewportWidth - tooltipWidth - padding));

        Object.assign(container.style, {
            position: 'fixed',
            top: top + 'px',
            left: left + 'px',
            zIndex: '10000',
            maxWidth: tooltipWidth + 'px'
        });

        // Adjust vertical centering for left/right positions
        if (position === 'left' || position === 'right') {
            container.style.transform = 'translateY(-50%)';
        } else if (position === 'top') {
            container.style.transform = 'translateY(-100%)';
        }
    }

    _applyBannerLayout(container, guideEl, position) {
        guideEl.classList.add('pendo-guide--banner', `pendo-guide--banner-${position}`);

        const isTop = position === 'top';
        Object.assign(container.style, {
            position: 'fixed',
            top: isTop ? '0' : 'auto',
            bottom: isTop ? 'auto' : '0',
            left: '0',
            right: '0',
            zIndex: '10000'
        });
    }

    _applySlideoutLayout(container, guideEl, position) {
        guideEl.classList.add('pendo-guide--slideout', `pendo-guide--slideout-${position}`);

        Object.assign(guideEl.style, {
            maxWidth: '360px',
            maxHeight: '80vh',
            overflowY: 'auto'
        });

        const isRight = position.includes('right');
        const isTop = position.includes('top');
        const isBottom = position.includes('bottom');

        const containerStyles = {
            position: 'fixed',
            zIndex: '10000'
        };

        if (isTop) {
            containerStyles.top = '16px';
        } else if (isBottom) {
            containerStyles.bottom = '16px';
        } else {
            containerStyles.top = '50%';
            containerStyles.transform = 'translateY(-50%)';
        }

        if (isRight) {
            containerStyles.right = '16px';
        } else {
            containerStyles.left = '16px';
        }

        Object.assign(container.style, containerStyles);
        guideEl.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';
    }

    /**
     * Setup event listeners on step container
     */
    _setupStepListeners(container, step) {
        const pendo = this;

        // Listen for pendo-action events
        container.addEventListener('pendo-action', (e) => {
            const { actions } = e.detail;
            console.log('[MockPendo] Actions:', actions);

            // Process each action in the array
            for (const actionObj of actions) {
                const { action } = actionObj;

                switch (action) {
                    case 'next-step':
                        step._guide.advanceStep();
                        break;

                    case 'previous-step':
                        step._guide.previousStep();
                        break;

                    case 'dismiss':
                        step._guide.hide();
                        break;

                    case 'link':
                        if (actionObj.url) {
                            window.open(actionObj.url, actionObj.target || '_blank');
                        }
                        break;

                    case 'launch-guide':
                        if (actionObj.guideId) {
                            pendo.showGuideById(actionObj.guideId);
                        }
                        break;
                }
            }
        });

        // Listen for pendo-response events (polls)
        container.addEventListener('pendo-response', (e) => {
            const { pollId, value, type } = e.detail;
            console.log('[MockPendo] Poll response:', { pollId, value, type });

            pendo.track('pollResponse', {
                guide_id: step._guide.id,
                step_id: step.id,
                poll_id: pollId,
                value,
                type
            });
        });
    }

    /**
     * Destroy a step container
     */
    _destroyStep(container) {
        if (container && container.parentNode) {
            container.remove();
        }

        // Clean up empty guide container
        const guideContainer = document.getElementById('pendo-guide-container');
        if (guideContainer && guideContainer.children.length === 0) {
            guideContainer.remove();
            this._guideContainer = null;
        }
    }

    /**
     * Get or create the guide container
     */
    _getGuideContainer() {
        if (!this._guideContainer) {
            this._guideContainer = document.getElementById('pendo-guide-container');
            if (!this._guideContainer) {
                this._guideContainer = document.createElement('div');
                this._guideContainer.id = 'pendo-guide-container';
                document.body.appendChild(this._guideContainer);
            }
        }
        return this._guideContainer;
    }
}

// Export for use
window.MockPendo = MockPendo;
