'use strict'

const RegisterComponent = require('app/dom/register-component');
const Util = require('app/util');

const register = function({ hub } = {}) {
    hub = hub || {
        addSubscription: () => undefined,
        sendMessage: () => undefined
    };

    const universalOptions = {
        name: '',
        positionX: 0,
        positionY: 0,
        scaleX: 1,
        scaleY: 1,
        restitution: 0,
        friction: 0.1,
        tint: 0xffffff
    };

    const createOptions = {
        circle: {
            radius: 50,
            fill: '0xffffff',
            stroke: '0x000000',
            strokeWidth: 1
        },
        rectangle: {
            width: 50,
            height: 50,
            fill: '0xffffff',
            stroke: '0x000000',
            strokeWidth: 1
        }
    };

    const modes = {};

    const propertyInputTemplate = ({ name, value } = {}) => {
        return `
            <li>
                <label>${name}</label>
                <input type="text" class="${name}" value="${value}">
            </li>
        `;
    };

    const createObjectTemplate = type => {
        return `<li><a href="#" data-type="${type}">${type}</a></li>`;
    };

    const createModeTemplate = (type, fields) => {
        const modeKey = `create::${type}`;
        return `
            <ul id="${modeKey}" class="menu create">
                <li><strong>New: ${type}</strong></li>
                ${Object.keys(fields).reduce((acc, curr) => acc + propertyInputTemplate({ name: curr, value: fields[curr]}), '')}
                <li><a href="#" class="cancel"><<<</a></li>
            </ul>
        `;
    };

    const mainModeTemplate = () => {
        return `
            <ul id="main" class="menu main">
                <li><strong>Create</strong></li>
                ${Object.keys(createOptions).reduce((acc, curr) => acc + createObjectTemplate(curr), '')}
            </ul>
        `;
    };

    const setCreate = function(type, options) {
        if (!modes[type]) {
            const template = createModeTemplate(type, options);
            const html = Util.stringToHTML(template);
            html.querySelector('.cancel').addEventListener('click', e => {
                e.preventDefault();
                this.dataset.mode = 'main';
            }, false);
            modes[type] = html;
        }
        hub.sendMessage({
            type: 'add-actor',
            data: { type: type.substr(8), ...options }
        });
        this.shadowRoot.appendChild(modes[type]);
    };

    const setMain = function() {
        if (!modes.main) {
            const template = mainModeTemplate();
            const html = Util.stringToHTML(template);
            modes.main = html;
            html.querySelectorAll('a').forEach(a => {
                a.addEventListener('click', e => {
                    const type = e.target.dataset.type;
                    e.preventDefault();
                    this.dataset.mode = `create::${type}`;
                }, false);
            });
        }
        this.shadowRoot.appendChild(modes.main);
    }

    const setMode = function(oldMode, newMode) {
        console.log(oldMode, newMode);
        if (modes[oldMode]) modes[oldMode].hidden = true;
        if (modes[newMode]) modes[newMode].hidden = false;
        switch (true) {
            case newMode === 'main':
                setMain.call(this);
                break;
            case newMode.substr(0,8) === 'create::':
                let options = Object.assign(
                    {},
                    {
                        ...universalOptions,
                        positionX: parseInt(this.style.left, 10) ,
                        positionY: parseInt(this.style.top, 10)
                    },
                    createOptions[newMode.substr(8)]
                );
                setCreate.call(this, newMode, options);
                break;
            default:
                break
        }
    };

    RegisterComponent({
        connectedCallbacks: [
            function() {
                this.draggable = true;
                this.dataset.mode = 'main';
            }
        ],
        attributeChangedCallbacks: [
            function(name, ov, nv) {
                if (name === 'data-mode') setMode.call(this, ov, nv);
            }
        ],
        template: ``,
        styles: `
            :host {
                position: absolute;
            }
            ul {
                position: relative;
                list-style: none;
                font-size: 14px;
                line-height: 1.5;
                background: #efefef;
                padding: .5em;
                margin: 0;
            }
            ul li {

            }
            a {
                text-decoration: none;
            }
        `,
        tag: 'ui-menu',
        observedAttributes:['hidden', 'data-mode']
    });
}

module.exports = register;
