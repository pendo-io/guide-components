/**
 * Mock Guides Data
 *
 * Static guide definitions for testing the HTML guide rendering flow.
 * These simulate what would come from the Pendo server.
 */

const mockGuides = [
    // Welcome Guide - Simple lightbox announcement
    {
        id: 'welcome',
        name: 'Welcome Guide',
        steps: [
            {
                id: 'welcome-step-1',
                layoutType: 'lightbox',
                htmlContent: `
                    <pendo-guide>
                        <pendo-close-button></pendo-close-button>
                        <pendo-guide-content>
                            <pendo-title>Welcome to Acme Dashboard!</pendo-title>
                            <pendo-paragraph>
                                We're excited to have you here. This quick tour will show you
                                the key features of your new dashboard.
                            </pendo-paragraph>
                            <pendo-paragraph>
                                You'll learn how to manage projects, track tasks, and
                                collaborate with your team.
                            </pendo-paragraph>
                        </pendo-guide-content>
                        <pendo-guide-footer>
                            <pendo-button action="next-step" variant="primary">Get Started</pendo-button>
                        </pendo-guide-footer>
                    </pendo-guide>
                `
            }
        ],
        buildingBlocks: {
            container: {
                background: '#ffffff',
                borderColor: '#e5e7eb',
                borderRadius: '12px',
                shadowColor: 'rgba(0, 0, 0, 0.15)',
                shadowOffsetVertical: '8px',
                shadowRadius: '24px'
            },
            primaryButton: {
                background: '#4F46E5',
                fontColor: '#ffffff',
                fontFamily: 'Inter, system-ui, sans-serif'
            },
            title: {
                fontColor: '#1f2937'
            },
            paragraph: {
                fontColor: '#6b7280'
            }
        }
    },

    // Feature Tour - Multi-step walkthrough
    {
        id: 'feature-tour',
        name: 'Feature Tour',
        steps: [
            {
                id: 'tour-step-1',
                layoutType: 'tooltip',
                layoutPosition: 'bottom',
                elementPathRule: '#new-project-btn',
                htmlContent: `
                    <pendo-guide>
                        <pendo-close-button></pendo-close-button>
                        <pendo-guide-content>
                            <pendo-title>Create New Projects</pendo-title>
                            <pendo-paragraph>
                                Click this button to start a new project. You can add tasks,
                                assign team members, and set deadlines.
                            </pendo-paragraph>
                        </pendo-guide-content>
                        <pendo-guide-footer>
                            <pendo-button action="next-step" variant="primary">Next</pendo-button>
                        </pendo-guide-footer>
                    </pendo-guide>
                `
            },
            {
                id: 'tour-step-2',
                layoutType: 'tooltip',
                layoutPosition: 'left',
                elementPathRule: '#export-btn',
                htmlContent: `
                    <pendo-guide>
                        <pendo-close-button></pendo-close-button>
                        <pendo-guide-content>
                            <pendo-title>Export Your Data</pendo-title>
                            <pendo-paragraph>
                                Need to share reports? Use the Export button to download
                                your data in various formats.
                            </pendo-paragraph>
                        </pendo-guide-content>
                        <pendo-guide-footer>
                            <pendo-button action="previous-step" variant="secondary">Back</pendo-button>
                            <pendo-button action="next-step" variant="primary">Next</pendo-button>
                        </pendo-guide-footer>
                    </pendo-guide>
                `
            },
            {
                id: 'tour-step-3',
                layoutType: 'tooltip',
                layoutPosition: 'left',
                elementPathRule: '#settings-icon',
                htmlContent: `
                    <pendo-guide>
                        <pendo-close-button></pendo-close-button>
                        <pendo-guide-content>
                            <pendo-title>Customize Settings</pendo-title>
                            <pendo-paragraph>
                                Access your account settings, integrations, and preferences here.
                            </pendo-paragraph>
                        </pendo-guide-content>
                        <pendo-guide-footer>
                            <pendo-button action="previous-step" variant="secondary">Back</pendo-button>
                            <pendo-button action="dismiss" variant="primary">Done</pendo-button>
                        </pendo-guide-footer>
                    </pendo-guide>
                `
            }
        ],
        buildingBlocks: {
            container: {
                background: '#1e293b',
                borderRadius: '8px'
            },
            primaryButton: {
                background: '#3b82f6',
                fontColor: '#ffffff'
            },
            secondaryButton: {
                background: 'transparent',
                fontColor: '#94a3b8',
                borderColor: '#475569'
            },
            title: {
                fontColor: '#f8fafc'
            },
            paragraph: {
                fontColor: '#cbd5e1'
            }
        }
    },

    // NPS Survey
    {
        id: 'nps-survey',
        name: 'NPS Survey',
        steps: [
            {
                id: 'nps-step-1',
                layoutType: 'slideout',
                layoutPosition: 'bottom-right',
                htmlContent: `
                    <pendo-guide>
                        <pendo-close-button></pendo-close-button>
                        <pendo-guide-content>
                            <pendo-title>Quick Feedback</pendo-title>
                            <pendo-paragraph>
                                How likely are you to recommend Acme Dashboard to a colleague?
                            </pendo-paragraph>
                            <pendo-nps poll-id="nps-main"></pendo-nps>
                        </pendo-guide-content>
                        <pendo-guide-footer>
                            <pendo-button action="next-step" variant="primary">Submit</pendo-button>
                        </pendo-guide-footer>
                    </pendo-guide>
                `
            },
            {
                id: 'nps-step-2',
                layoutType: 'slideout',
                layoutPosition: 'bottom-right',
                htmlContent: `
                    <pendo-guide>
                        <pendo-close-button></pendo-close-button>
                        <pendo-guide-content>
                            <pendo-title>Thanks for your feedback!</pendo-title>
                            <pendo-paragraph>
                                What's the main reason for your score?
                            </pendo-paragraph>
                            <pendo-open-text poll-id="nps-followup" placeholder="Tell us more..."></pendo-open-text>
                        </pendo-guide-content>
                        <pendo-guide-footer>
                            <pendo-button action="dismiss" variant="primary">Submit</pendo-button>
                        </pendo-guide-footer>
                    </pendo-guide>
                `
            }
        ],
        buildingBlocks: {
            container: {
                background: '#ffffff',
                borderRadius: '12px',
                shadowColor: 'rgba(0, 0, 0, 0.2)',
                shadowOffsetVertical: '8px',
                shadowRadius: '32px'
            },
            primaryButton: {
                background: '#10b981',
                fontColor: '#ffffff'
            },
            title: {
                fontColor: '#1f2937'
            },
            paragraph: {
                fontColor: '#6b7280'
            }
        }
    },

    // Feedback Poll - Multiple poll types
    {
        id: 'feedback',
        name: 'Feedback Poll',
        steps: [
            {
                id: 'feedback-step-1',
                layoutType: 'lightbox',
                htmlContent: `
                    <pendo-guide>
                        <pendo-close-button></pendo-close-button>
                        <pendo-guide-content>
                            <pendo-title>Help Us Improve</pendo-title>
                            <pendo-paragraph>How would you rate your experience today?</pendo-paragraph>
                            <pendo-emoji-scale poll-id="mood-check"></pendo-emoji-scale>
                        </pendo-guide-content>
                        <pendo-guide-footer>
                            <pendo-button action="next-step" variant="primary">Continue</pendo-button>
                        </pendo-guide-footer>
                    </pendo-guide>
                `
            },
            {
                id: 'feedback-step-2',
                layoutType: 'lightbox',
                htmlContent: `
                    <pendo-guide>
                        <pendo-close-button></pendo-close-button>
                        <pendo-guide-content>
                            <pendo-title>Rate Our Features</pendo-title>
                            <pendo-paragraph>How useful do you find the dashboard analytics?</pendo-paragraph>
                            <pendo-star-rating poll-id="feature-rating" max="5"></pendo-star-rating>
                        </pendo-guide-content>
                        <pendo-guide-footer>
                            <pendo-button action="previous-step" variant="secondary">Back</pendo-button>
                            <pendo-button action="next-step" variant="primary">Continue</pendo-button>
                        </pendo-guide-footer>
                    </pendo-guide>
                `
            },
            {
                id: 'feedback-step-3',
                layoutType: 'lightbox',
                htmlContent: `
                    <pendo-guide>
                        <pendo-close-button></pendo-close-button>
                        <pendo-guide-content>
                            <pendo-title>One More Thing</pendo-title>
                            <pendo-paragraph>On a scale of 1-10, how easy was the onboarding process?</pendo-paragraph>
                            <pendo-number-scale poll-id="ease-rating" min="1" max="10" low-label="Very Difficult" high-label="Very Easy"></pendo-number-scale>
                        </pendo-guide-content>
                        <pendo-guide-footer>
                            <pendo-button action="previous-step" variant="secondary">Back</pendo-button>
                            <pendo-button action="dismiss" variant="primary">Submit</pendo-button>
                        </pendo-guide-footer>
                    </pendo-guide>
                `
            }
        ],
        buildingBlocks: {
            container: {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '16px'
            },
            primaryButton: {
                background: '#ffffff',
                fontColor: '#667eea'
            },
            secondaryButton: {
                background: 'transparent',
                fontColor: '#ffffff',
                borderColor: 'rgba(255, 255, 255, 0.3)'
            },
            title: {
                fontColor: '#ffffff'
            },
            paragraph: {
                fontColor: 'rgba(255, 255, 255, 0.9)'
            }
        }
    },

    // Banner - Top notification
    {
        id: 'banner',
        name: 'Announcement Banner',
        steps: [
            {
                id: 'banner-step-1',
                layoutType: 'banner',
                layoutPosition: 'top',
                htmlContent: `
                    <pendo-guide>
                        <pendo-guide-content style="display: flex; align-items: center; justify-content: center; gap: 16px; padding: 8px;">
                            <pendo-paragraph style="margin: 0;">
                                🎉 <strong>New Feature:</strong> Dark mode is now available!
                                Check your settings to enable it.
                            </pendo-paragraph>
                            <pendo-button action="link" url="/settings" variant="secondary" style="padding: 4px 12px; font-size: 0.75rem;">
                                Try it now
                            </pendo-button>
                            <pendo-close-button style="position: static;"></pendo-close-button>
                        </pendo-guide-content>
                    </pendo-guide>
                `
            }
        ],
        buildingBlocks: {
            container: {
                background: '#1e40af',
                borderRadius: '0'
            },
            secondaryButton: {
                background: 'rgba(255, 255, 255, 0.2)',
                fontColor: '#ffffff',
                borderColor: 'transparent'
            },
            paragraph: {
                fontColor: '#ffffff'
            }
        }
    }
];

// Export for use
window.mockGuides = mockGuides;
