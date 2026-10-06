/**
 * Parse an `action` attribute into an array of action objects.
 *
 * Shared by every element that turns a click into `pendo-action`, so `pendo-button` and
 * `pendo-action-row` cannot disagree about what an action string means. The client reads the
 * resulting objects (`guideId`, `stepId`, `url`...) by name, so a second copy that drifted would
 * produce a control that renders, clicks, and does nothing.
 *
 * Supports, for backward compatibility and composability:
 *   - "dismiss", "next-step", "previous-step", "submit-poll"
 *   - "link:URL", "launch-guide:GUIDE_ID", "go-to-step:STEP_ID", "snooze:DURATION_MS"
 *   - a JSON object:  '{"action":"go-to-step","stepId":"abc123"}'
 *   - a JSON array of either, for several actions at once
 *
 * @param {string} attr - The action attribute value
 * @param {string} [linkTarget] - Where a `link:` action opens; defaults to a new tab
 * @returns {Array} Array of action objects
 */
export function parseActionAttribute(attr, linkTarget = '_blank') {
    if (!attr) return [];

    const trimmed = attr.trim();

    // Array of actions: [{"action":"submit-poll"},{"action":"dismiss"}]
    if (trimmed.startsWith('[')) {
        try {
            return JSON.parse(trimmed);
        } catch (e) {
            return [];
        }
    }

    // Single action object: {"action":"go-to-step","stepId":"abc"}
    if (trimmed.startsWith('{')) {
        try {
            return [JSON.parse(trimmed)];
        } catch (e) {
            return [];
        }
    }

    // String with colon param: "action:param"
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex !== -1) {
        const actionType = trimmed.substring(0, colonIndex);
        const param = trimmed.substring(colonIndex + 1);

        // Map known parameterized actions to proper object format
        switch (actionType) {
            case 'link':
                return [{ action: 'link', url: param, target: linkTarget }];
            case 'launch-guide':
                return [{ action: 'launch-guide', guideId: param }];
            case 'go-to-step':
                return [{ action: 'go-to-step', stepId: param }];
            case 'snooze':
                return [{ action: 'snooze', duration: parseInt(param, 10) || null }];
            default:
                return [{ action: actionType, param }];
        }
    }

    // Simple string action: "dismiss", "next-step", etc.
    return [{ action: trimmed }];
}
