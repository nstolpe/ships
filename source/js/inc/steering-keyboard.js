'use strict'

const Util = require( './util.js' );

function keyboard( which ) {
	var key = {};
	key.which = which;
	key.isDown = false;
	key.isUp = true;
	key.press = undefined;
	key.release = undefined;
	
	//The `downHandler`
	key.downHandler = function( e ) {
		if ( e.which === key.which ) {
			if ( key.isUp && key.press ) key.press( e );
			key.isDown = true;
			key.isUp = false;
		}
		e.preventDefault();
	};

	//The `upHandler`
	key.upHandler = function( e ) {
		if ( e.which === key.which ) {
			if ( key.isDown && key.release ) key.release( e );
			key.isDown = false;
			key.isUp = true;
		}
		e.preventDefault();
	};

	//Attach event listeners
	window.addEventListener( "keydown", key.downHandler.bind( key ), false );
	window.addEventListener( "keyup", key.upHandler.bind( key ), false );
	return key;
}

function setupInput() {
	let W = keyboard( 87 );
	let A = keyboard( 65 );
	let S = keyboard( 83 );
	let D = keyboard( 68 );
	let H = keyboard( 72 );
	let J = keyboard( 74 );
	let K = keyboard( 75 );
	let L = keyboard( 76 );
	let X = keyboard( 88 );
	let R = keyboard( 82 );

	R.press = e => {
		if ( e.ctrlKey ) window.location.reload();
	}

	X.release = () => {
		window.dispatchEvent( new Event( 'dock' ) );
	}
	W.press = () => {
		turtle.positionAcceleration = Util.TrinaryState.POSITIVE;
		turtle.activePositionAcceleration = true;
	}
	W.release = () => {
		if ( S.isDown ) {
			turtle.positionAcceleration = Util.TrinaryState.NEGATIVE;
		} else {
			turtle.positionAcceleration = Util.TrinaryState.NEUTRAL;
			turtle.activePositionAcceleration = false;
		}
	}

	S.press = () => {
		turtle.positionAcceleration = Util.TrinaryState.NEGATIVE;
		turtle.activePositionAcceleration = true;
	}
	S.release = () => {
		if ( W.isDown ) {
			turtle.positionAcceleration = Util.TrinaryState.POSITIVE;
		} else {
			turtle.positionAcceleration = Util.TrinaryState.NEUTRAL;
			turtle.activePositionAcceleration = false;
		}
	}

	A.press = () => {
		turtle.rotationAcceleration = Util.TrinaryState.NEGATIVE;
	}
	A.release = () => {
		if ( D.isDown ) {
			turtle.rotationAcceleration = Util.TrinaryState.POSITIVE;
		} else {
			turtle.rotationAcceleration = Util.TrinaryState.NEUTRAL;
		}
	}

	D.press = () => {
		turtle.rotationAcceleration = Util.TrinaryState.POSITIVE;
	}
	D.release = () => {
		if ( A.isDown ) {
			turtle.rotationAcceleration = Util.TrinaryState.NEGATIVE;
		} else {
			turtle.rotationAcceleration = Util.TrinaryState.NEUTRAL;
		}
	}

	H.press = () => {
		turtle.children[ 'cannon-left-mid' ].rotationAcceleration = Util.TrinaryState.POSITIVE;
		turtle.children[ 'cannon-left-bow' ].rotationAcceleration = Util.TrinaryState.POSITIVE;
		turtle.children[ 'cannon-left-aft' ].rotationAcceleration = Util.TrinaryState.POSITIVE;
	}
	H.release = () => {
		if ( !J.isDown ) {
			turtle.children[ 'cannon-left-mid' ].rotationAcceleration = Util.TrinaryState.NEUTRAL;
			turtle.children[ 'cannon-left-bow' ].rotationAcceleration = Util.TrinaryState.NEUTRAL;
			turtle.children[ 'cannon-left-aft' ].rotationAcceleration = Util.TrinaryState.NEUTRAL;
		}
	}

	J.press = () => {
		turtle.children[ 'cannon-left-mid' ].rotationAcceleration = Util.TrinaryState.NEGATIVE;
		turtle.children[ 'cannon-left-bow' ].rotationAcceleration = Util.TrinaryState.NEGATIVE;
		turtle.children[ 'cannon-left-aft' ].rotationAcceleration = Util.TrinaryState.NEGATIVE;
	}
	J.release = () => {
		if ( !H.isDown ) {
			turtle.children[ 'cannon-left-mid' ].rotationAcceleration = Util.TrinaryState.NEUTRAL;
			turtle.children[ 'cannon-left-bow' ].rotationAcceleration = Util.TrinaryState.NEUTRAL;
			turtle.children[ 'cannon-left-aft' ].rotationAcceleration = Util.TrinaryState.NEUTRAL;
		}
	}

	K.press = () => {
		turtle.children[ 'cannon-right-mid' ].rotationAcceleration = Util.TrinaryState.POSITIVE;
		turtle.children[ 'cannon-right-bow' ].rotationAcceleration = Util.TrinaryState.POSITIVE;
		turtle.children[ 'cannon-right-aft' ].rotationAcceleration = Util.TrinaryState.POSITIVE;
	}
	K.release = () => {
		if ( !L.isDown ) {
			turtle.children[ 'cannon-right-mid' ].rotationAcceleration = Util.TrinaryState.NEUTRAL;
			turtle.children[ 'cannon-right-bow' ].rotationAcceleration = Util.TrinaryState.NEUTRAL;
			turtle.children[ 'cannon-right-aft' ].rotationAcceleration = Util.TrinaryState.NEUTRAL;
		}
	}

	L.press = () => {
		turtle.children[ 'cannon-right-mid' ].rotationAcceleration = Util.TrinaryState.NEGATIVE;
		turtle.children[ 'cannon-right-bow' ].rotationAcceleration = Util.TrinaryState.NEGATIVE;
		turtle.children[ 'cannon-right-aft' ].rotationAcceleration = Util.TrinaryState.NEGATIVE;
	}
	L.release = () => {
		if ( !K.isDown ) {
			turtle.children[ 'cannon-right-mid' ].rotationAcceleration = Util.TrinaryState.NEUTRAL;
			turtle.children[ 'cannon-right-bow' ].rotationAcceleration = Util.TrinaryState.NEUTRAL;
			turtle.children[ 'cannon-right-aft' ].rotationAcceleration = Util.TrinaryState.NEUTRAL;
		}
	}
}

module.exports = function() {
	setupInput();
}
