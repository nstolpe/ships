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
		L = keyboard( 76 );

	W.press = () => {
		turtle.positionAcceleration = Util.TernaryState.PLUS;
		turtle.activePositionAcceleration = true;
	}
	W.release = () => {
		if ( !S.isDown ) {
			turtle.positionAcceleration = Util.TernaryState.EQUAL;
			turtle.activePositionAcceleration = false;
		}
	}

	S.press = () => {
		turtle.positionAcceleration = Util.TernaryState.MINUS;
		turtle.activePositionAcceleration = true;
	}
	S.release = () => {
		if ( !W.isDown ) {
			turtle.positionAcceleration = Util.TernaryState.EQUAL;
			turtle.activePositionAcceleration = false;
		}
	}

	A.press = () => {
		turtle.rotationAcceleration = Util.TernaryState.MINUS;
		turtle.children[ 'rudder' ].rotationAcceleration = Util.TernaryState.PLUS;
	}
	A.release = () => {
		if ( !D.isDown ) {
			turtle.rotationAcceleration = Util.TernaryState.EQUAL;
			turtle.children[ 'rudder' ].rotationAcceleration = Util.TernaryState.EQUAL;
		}
	}

	D.press = () => {
		turtle.rotationAcceleration = Util.TernaryState.PLUS;
		turtle.children[ 'rudder' ].rotationAcceleration = Util.TernaryState.MINUS;
		turtle.children[ 'rudder' ].stabilizingRotation = false;
	}
	D.release = () => {
		if ( !A.isDown ) {
			turtle.rotationAcceleration = Util.TernaryState.EQUAL;
			turtle.children[ 'rudder' ].rotationAcceleration = Util.TernaryState.EQUAL;
		}
	}

	H.press = () => {
		turtle.children[ 'cannon-left-mid' ].rotationAcceleration = Util.TernaryState.PLUS;
		turtle.children[ 'cannon-left-bow' ].rotationAcceleration = Util.TernaryState.PLUS;
		turtle.children[ 'cannon-left-aft' ].rotationAcceleration = Util.TernaryState.PLUS;
	}
	H.release = () => {
		if ( !J.isDown ) {
			turtle.children[ 'cannon-left-mid' ].rotationAcceleration = Util.TernaryState.EQUAL;
			turtle.children[ 'cannon-left-bow' ].rotationAcceleration = Util.TernaryState.EQUAL;
			turtle.children[ 'cannon-left-aft' ].rotationAcceleration = Util.TernaryState.EQUAL;
		}
	}

	J.press = () => {
		turtle.children[ 'cannon-left-mid' ].rotationAcceleration = Util.TernaryState.MINUS;
		turtle.children[ 'cannon-left-bow' ].rotationAcceleration = Util.TernaryState.MINUS;
		turtle.children[ 'cannon-left-aft' ].rotationAcceleration = Util.TernaryState.MINUS;
	}
	J.release = () => {
		if ( !H.isDown ) {
			turtle.children[ 'cannon-left-mid' ].rotationAcceleration = Util.TernaryState.EQUAL;
			turtle.children[ 'cannon-left-bow' ].rotationAcceleration = Util.TernaryState.EQUAL;
			turtle.children[ 'cannon-left-aft' ].rotationAcceleration = Util.TernaryState.EQUAL;
		}
	}

	K.press = () => {
		turtle.children[ 'cannon-right-mid' ].rotationAcceleration = Util.TernaryState.PLUS;
		turtle.children[ 'cannon-right-bow' ].rotationAcceleration = Util.TernaryState.PLUS;
		turtle.children[ 'cannon-right-aft' ].rotationAcceleration = Util.TernaryState.PLUS;
	}
	K.release = () => {
		if ( !L.isDown ) {
			turtle.children[ 'cannon-right-mid' ].rotationAcceleration = Util.TernaryState.EQUAL;
			turtle.children[ 'cannon-right-bow' ].rotationAcceleration = Util.TernaryState.EQUAL;
			turtle.children[ 'cannon-right-aft' ].rotationAcceleration = Util.TernaryState.EQUAL;
		}
	}

	L.press = () => {
		turtle.children[ 'cannon-right-mid' ].rotationAcceleration = Util.TernaryState.MINUS;
		turtle.children[ 'cannon-right-bow' ].rotationAcceleration = Util.TernaryState.MINUS;
		turtle.children[ 'cannon-right-aft' ].rotationAcceleration = Util.TernaryState.MINUS;
	}
	L.release = () => {
		if ( !K.isDown ) {
			turtle.children[ 'cannon-right-mid' ].rotationAcceleration = Util.TernaryState.EQUAL;
			turtle.children[ 'cannon-right-bow' ].rotationAcceleration = Util.TernaryState.EQUAL;
			turtle.children[ 'cannon-right-aft' ].rotationAcceleration = Util.TernaryState.EQUAL;
		}
	}
}

module.exports = function() {
	setupInput();
}