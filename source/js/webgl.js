import * as PIXI from 'pixi.js';
import React from "react";
import { render } from "react-dom";

document.oncontextmenu = e => e.preventDefault();
class Thirixarax extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            menu: {
                active: false,
                style: {
                    background: 'black',
                    width: '100px',
                    height: '100px',
                    position: 'absolute',
                    top: 0,
                    left: 0
                }
            },
            app: null
        };
    }
    componentDidMount() {
        const resolution = Math.min(2, devicePixelRatio);
        this.app = new PIXI.Application(
            this.canvas.clientWidth * resolution,
            this.canvas.clientHeight * resolution,
            {
                view: this.canvas,
                resolution: resolution,
                autoresize: true,
                backgroundColor: 0xff00ff
            }
        );
        const graphics = new PIXI.Graphics();
        const sprite = new PIXI.Sprite(PIXI.Texture.fromImage('/assets/images/turtle.png'));
        const blur = new PIXI.filters.BlurFilter(10);
        sprite.filters = [blur];
        graphics.filters = [blur];
        this.app.stage.addChild(graphics);
        this.app.stage.addChild(sprite);
        sprite.x = 400;
        sprite.y = 400;
        graphics.x = 200;
        graphics.y = 200;
        graphics.lineStyle(1, 0x9dffb7, 1);
        graphics.beginFill(0x00ff00);
        graphics.drawRect(100, 100, 50, 50);
        graphics.endFill();
        this.app.ticker.add( delta => {
            graphics.x += delta;
            graphics.y += delta;
            sprite.x += delta * .5;
            sprite.y += delta * .5;
        });
    }
    render() {
        const props = Object.assign({
            id: 'view',
            className: 'view'
        }, this.props);

        const on = e => {
            e.persist();
            this.setState((prev, props) => {
                const state = {
                    menu: {
                        active: true,
                        style: Object.assign({}, prev.menu.style, {
                            left: `${e.clientX}px`,
                            top: `${e.clientY}px`
                        })
                    }
                };
                return Object.assign({}, prev, state);
            });
        };
        const off = (e) => this.setState((prev, props) => {
            prev.menu.active = false;
            return prev;
        });
        return(
            // <div id={props.id + '-wrapper'} className={props.className + '-wrapper'}>
            //     <canvas onContextMenu={on} ref={ref => this.canvas = ref} key={props.id} className={props.className} id={props.id} />
            //     {
            //         this.state.menu.active ? <div key="foo" onClick={off} style={this.state.menu.style} className="foo"></div> : null
            //     }
            // </div>
        );
    }
}

render(
    // <Thirixarax className="view" id="view"/>,
    document.getElementById('game')
);
// const style = {
//     fill: 'red'
// };
// const text = <Text key="hello" cursor={'crosshair'} interactive={true} text="hello" x={20} y={20} style={style}/>;
// const text2 = <Text key="goodbye" text="goodbye" x={120} y={200} style={style}/>;

// class Gfx extends Graphics {
//     componentDidMount() {
//         super.componentDidMount();
//         debugger;
//     }
// }
// const gfx = <Gfx/>;
// const gfx = <Graphics key="gfx" cursor={'crosshair'} interactive={true} fillAlpha={.5}/>;
// gfx.lineStyle(1, 0x9dffb7, 1);
// gfx.beginFill(0x00ff00);
// gfx.drawRect(100, 100, 50, 50);
// const children = [text, text2,gfx];
