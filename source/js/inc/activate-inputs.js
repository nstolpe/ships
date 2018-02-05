import VJS from 'virtualjoystick.js';
// @TODO clean up and make better. events should be attached to react canvas.
module.exports = {
    activate(hub) {
        const touchJoystick = Object.create(VJS.prototype);
        VJS.call(touchJoystick, {
            container: document.getElementById('screen'),
            limitStickTravel: true,
            stickRadius: 20,
            baseRadius: 40,
            travelRadius: 30,
            strokeStyle: 'rgba(0, 255, 255, 0.25)'
        });
        touchJoystick.addEventListener('touchStart', function(e) {
            console.log(e);
        });
        touchJoystick.addEventListener('touchMove', function(e) {
            const up = this.up();
            const down = this.down();
            const left = this.left();
            const right = this.right();
            const angle = Math.atan2( this._stickY - this._baseY, this._stickX - this._baseX) * 180 / Math.PI;
            const xDiff = this._stickX - this._baseX;
            const yDiff = this._stickY - this._baseY;
            const distance = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
            // console.log('x: ' + this.deltaX());
            // console.log('y: ' + this.deltaY());
            // console.log(`%cangle: ${ angle }`, 'color: white; background-color: black;');
            // console.log(`%cdistance: ${ distance }`, 'color: cyan; background-color: red;');
            // if (up || down)
            //     hub.sendMessage({ type: 'player-input-thrust', data: up ? 1 * .1: -1 * .1});
            // else
            //     hub.sendMessage({ type: 'player-input-thrust', data: 0 });

            // if (left || right)
            //     hub.sendMessage({ type: 'player-input-turn', data: right ? 1 * .2 : -1 * .2 });
            // else
            //     hub.sendMessage({ type: 'player-input-turn', data: 0 });

            if (this.deltaY()) {
                // console.log(1 * .1 * -this.deltaY() / this._travelRadius)
                hub.sendMessage({ type: 'player-input-thrust', data: 1 * .05 * -this.deltaY() / this._travelRadius });
            }
            if (this.deltaX()) {
                // console.log(1 * .1 * this.deltaX() / this._travelRadius)
                hub.sendMessage({ type: 'player-input-turn', data: 1 * .2 * this.deltaX() / this._travelRadius });
            }

    //     -90
    //      |
    // 180--|--0
    //      |
    //      90
        });
        touchJoystick.addEventListener('touchEnd', function(e) {
            hub.sendMessage({ type: 'player-input-thrust', data: 0 });
            hub.sendMessage({ type: 'player-input-turn', data: 0 });
        });
        document.getElementById('view').addEventListener('keydown', e => {
            let type;
            let data;

            switch (e.which) {
                // W
                case 87:
                    if (!e.repeat) {
                        type = 'player-input-thrust';
                        data = 1 * .05;
                    }
                    break;
                // S
                case 83:
                    if (!e.repeat) {
                        type = 'player-input-thrust';
                        data = -1 * .05;
                    }
                    break;
                // A
                case 65:
                    if (!e.repeat) {
                        type = 'player-input-turn'
                        data = -1 * .2;
                    }
                    break;
                // D
                case 68:
                    if (!e.repeat) {
                        type = 'player-input-turn'
                        data = 1 * .2;
                    }
                    break;
                // P
                case 80:
                    if (!e.repeat) {
                        type = 'player-input-boost'
                        data = 20;
                    }
                    break;
                // <
                case 188:
                    if (e.shiftKey && !e.repeat) {
                        type = 'player-input-rotate-viewport'
                        data = -1;
                    }
                    break;
                // >
                case 190:
                    if (e.shiftKey && !e.repeat) {
                        type = 'player-input-rotate-viewport'
                        data = 1;
                    }
                    break;
                default:
                    break;
            }

            if (type !== undefined && data !== undefined)
                hub.sendMessage({ type: type, data: data });
        }, false);

        document.getElementById('view').addEventListener('keyup', e => {
            let type;
            let data;

            switch (e.which) {
                // W
                case 87:
                    type = 'player-input-thrust';
                    data = 0;
                    break;
                // S
                case 83:
                    type = 'player-input-thrust';
                    data = 0;
                    break;
                // A
                case 65:
                    type = 'player-input-turn';
                    data = 0;
                    break;
                // D
                case 68:
                    type = 'player-input-turn';
                    data = 0;
                    break;
                // X
                case 88:
                    type = 'player-input-dock';
                    data = 0;
                    break;
                default:
                    break;
            }

            if (type !== undefined && data !== undefined)
                hub.sendMessage({ type: type, data: data });
        }, false);

        document.getElementById('view').addEventListener('wheel', e => {
            // the zoom delta needs to be inverted and scaled.
            if (e.deltaY !== 0)
                hub.sendMessage({ type: 'zoom', data: e.deltaY * -0.001 });
        }, false);

        // disable context clicks so PIXI can catch them
        document.getElementById('view').addEventListener('contextmenu', e => {
            console.log(e.target.id);
            e.preventDefault();
        }, false);
        document.getElementById('game').addEventListener('contextmenu', e => {
            console.log(e.target.id);
            e.preventDefault();
        }, false);
    }
};
