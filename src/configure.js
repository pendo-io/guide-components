/**
 * Configure custom component mappings for Pendo guide elements.
 *
 * This allows customers to map their design system components
 * to Pendo elements for consistent styling.
 *
 * @param {Object} components - Map of component names to implementations
 * @param {Function} [components.button] - Custom button component
 * @param {Function} [components.title] - Custom title/heading component
 * @param {Function} [components.text] - Custom text/paragraph component
 *
 * @example
 * import { configurePendoComponents } from '@pendo/guide-components';
 * import { Button, Heading, Text } from '@acme/design-system';
 *
 * configurePendoComponents({
 *   button: Button,
 *   title: Heading,
 *   text: Text
 * });
 */
export function configurePendoComponents(components) {
    if (!window.__pendoComponents) {
        window.__pendoComponents = {};
    }

    Object.assign(window.__pendoComponents, components);
}

/**
 * Get the current component configuration.
 * @returns {Object} The current component mappings
 */
export function getPendoComponents() {
    return window.__pendoComponents || {};
}

/**
 * Clear all custom component mappings.
 */
export function clearPendoComponents() {
    window.__pendoComponents = {};
}
