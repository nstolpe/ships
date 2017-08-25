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
	key.downHandler = function( event ) {
		if ( event.which === key.which ) {
			if ( key.isUp && key.press ) key.press();
			key.isDown = true;
			key.isUp = false;
		}
		event.preventDefault();
	};

	//The `upHandler`
	key.upHandler = function( event ) {
		if ( event.which === key.which ) {
			if ( key.isDown && key.release ) key.release();
			key.isDown = false;
			key.isUp = true;
		}
		event.preventDefault();
	};

	//Attach event listeners
	window.addEventListener( "keydown", key.downHandler.bind( key ), false );
	window.addEventListener( "keyup", key.upHandler.bind( key ), false );
	return key;
}

function setupInput() {
	let W = keyboard( 87 ),
		A = keyboard( 65 ),
		S = keyboard( 83 ),
		D = keyboard( 68 ),
		H = keyboard( 72 ),
		J = keyboard( 74 ),
		K = keyboard( 75 ),
		L = keyboard( 76 ),
		X = keyboard( 88 );

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
