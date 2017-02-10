const stage = document.getElementById('canvas'),
	ctx = stage.getContext('2d');

// let i = 0;

function draw(delta) {
	let bg = '#000000';

	ctx.clearRect(0, 0, stage.width, stage.height);

	ctx.fillStyle = bg;
	ctx.fillRect(0, 0, stage.width, stage.height);

	ctx.save();

	ctx.translate(250, 250);
	ctx.rotate((Math.PI * i / 16) / 4);

	ctx.fillStyle = 'red';
	ctx.fillRect(-40, -40, 80, 80);

	ctx.restore();
	i++;
	window.requestAnimationFrame(draw);
}

window.requestAnimationFrame(draw);

const Renderer = function(options) {
	let delta;
	options = options || {};

	return {
		fps: options.fps || 30,
		now: undefined,
		then: undefined,
		delta() {
			return delta;
		},
		interval() {
			return 1000 / this.fps;
		},
		render() {
			if (this.then === undefined) this.then = Date.now();
			requestAnimationFrame(this.render);
			this.now = Date.now();
			delta = this.now - this.then;
			if (delta > this.interval()) {
				this.then = this.now - (delta % this.interval());
				draw(delta);
			}
		}
	}
}
// let renderer = Renderer();
// var fps = 30;
// var now;
// var then = Date.now();
// var interval = 1000/fps;
// var delta;
  
// function draw() {
// 	requestAnimationFrame(draw);

// 	now = Date.now();
// 	delta = now - then;
// 	if (delta > interval) {
// 	then = now - (delta % interval);
// 	// ... Code for Drawing the Frame ...
// 	}
// }

// draw();
