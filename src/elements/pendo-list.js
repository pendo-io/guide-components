import { PendoBaseElement } from '../base-element.js';

/**
 * <pendo-list> - List element (bullet or numbered)
 *
 * Attributes:
 * - type: "bullet" (default), "numbered", "check"
 *
 * Children should be <pendo-list-item> elements
 *
 * Example:
 *   <pendo-list type="numbered">
 *     <pendo-list-item>First item</pendo-list-item>
 *     <pendo-list-item>Second item</pendo-list-item>
 *   </pendo-list>
 *
 *   <pendo-list type="check">
 *     <pendo-list-item checked>Completed task</pendo-list-item>
 *     <pendo-list-item>Pending task</pendo-list-item>
 *   </pendo-list>
 */
export class PendoList extends PendoBaseElement {
    connectedCallback() {
        const type = this.getAttribute('type') || 'bullet';
        this.classList.add('pendo-list', `pendo-list--${type}`);
        this.setAttribute('role', 'list');

        // Convert to appropriate list element
        const isNumbered = type === 'numbered';
        const listEl = document.createElement(isNumbered ? 'ol' : 'ul');
        listEl.className = 'pendo-list__items';

        // Process children
        const items = this.querySelectorAll('pendo-list-item');
        items.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'pendo-list__item';
            li.setAttribute('role', 'listitem');

            if (type === 'check') {
                const checked = item.hasAttribute('checked');
                const icon = document.createElement('span');
                icon.className = `pendo-list__check ${checked ? 'pendo-list__check--checked' : ''}`;
                icon.innerHTML = checked ? '&#10003;' : '&#9675;'; // checkmark or circle
                li.appendChild(icon);
            }

            const content = document.createElement('span');
            content.className = 'pendo-list__content';
            content.innerHTML = item.innerHTML;
            li.appendChild(content);

            listEl.appendChild(li);
        });

        // Clear and append
        this.innerHTML = '';
        this.appendChild(listEl);
    }
}

/**
 * <pendo-list-item> - Individual list item
 *
 * Attributes:
 * - checked: For check lists, marks item as complete
 */
export class PendoListItem extends PendoBaseElement {
    // Content is processed by parent PendoList
}

customElements.define('pendo-list', PendoList);
customElements.define('pendo-list-item', PendoListItem);
