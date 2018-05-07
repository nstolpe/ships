'use strict';

const RegisterComponent = function({
    tag,
    template = '<div></div>',
    styles = '',
    connectedCallbacks = [],
    disconnectedCallbacks = [],
    adoptedCallbacks = [],
    attributeChangedCallbacks = [],
    observedAttributes
} = {}) {
    if (typeof tag !== 'string' || tag.length < 2 || tag.indexOf('-') < 0)
        return console.warn(`Failed to register '${tag}' custom component. Invalid tag.`);

    const component = function() {
        return Reflect.construct(HTMLElement, [], component);
    }

    component.prototype = Object.create(HTMLElement.prototype);

    if (Array.isArray(observedAttributes) && observedAttributes.length) {
        Object.defineProperty(component, 'observedAttributes', {
          get: function() { return observedAttributes; }
        });
    }

    component.prototype.connectedCallback = function() {
        const style = document.createElement('style');
        style.textContent = styles;
        this.attachShadow({ mode:'open' });
        this.shadowRoot.innerHTML = template;
        this.shadowRoot.insertBefore(style, this.shadowRoot.firstChild);
        connectedCallbacks.forEach(cb => cb.call(this));
    }

    component.prototype.disconnectedCallback = function() {
        disconnectedCallbacks.forEach(cb => cb.call(this));
    }

    component.prototype.adoptedCallback = function() {
        adoptedCallbacks.forEach(cb => cb.call(this));
    }

    component.prototype.attributeChangedCallback = function(name, oldValue, newValue) {
        attributeChangedCallbacks.forEach(cb => cb.call(this, name, oldValue, newValue));
    }

    customElements.define(tag, component);
}

module.exports = RegisterComponent;
