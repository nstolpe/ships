// Mz The Turning Moment of the ship about the steering (ie Z or yaw) axis;

anchor


// L/2 The distance of the rudder from the turning axis, approximated as 1/2 the ship's length L;

Math.abs( rudder.anchor - anchor );


// v The current linear velocity of the ship (relative to the water, not the land nearby, so take into account any current).;

positionVelocity


// w The current rotational (yaw) velocity of the ship about the Z-axis, measured CCW in radians per second;

rotationVelocity


// p0,p1,p2 The constant, linear and quadratic coefficients respectively of angular friction (ie resistance to turning) for the water (these control how quickly the ship stops turning when the rudder returns to straight, and impose a limitation on how sharply the rudder can be turned before losing any effect.)

trial and error?


// A the area of the rudder

rudder.z * rudder.y ( make it )


// d the density of the water

trial and error?


// theta the current rudder angle measured CCW from straight back in radians
rudder.currentAngle

rotation


// delta-t is your time interval.

delta

// Cd is coefficient of increased drag due to a non-neutral rudder position.
?

rudderTorque = 

var speed = 0.0;
var angleVel= 0.0;

var maxThrust = 3.0;
var minThrust = -1.0;
var maxTurn = 180.0;
var minTurn = -180.0;

var targetThrust = 0.0;
var targetTurnVel = 0.0;

var actualThrust = 0.0;
var actualTurnVel= 0.0;

var thrustResponseTime = 1.5;
var turnResponseTime = 1.0;

var thrustSensitivity = 1.0;
var turnSensitivity = 3.0;

var dragTime = 3.0;
var centerTime = 1.0; 

var mass = 1.0;
var momInertia = 1.0;

var angleDeg = 0.0;
var turnSpeed=0.6;

function onUpdate() {
	if ( keys.up ) {
		targetThrust += system.timerDelta * thrustSensitivity;
	}
	
	if ( keys.down ) {
		targetThrust -= system.timerDelta * thrustSensitivity;
	}

	if ( keys.left ) {
		targetTurnVel -= system.timerDelta * turnSensitivity;
	} else if ( keys.right ) {
		targetTurnVel += system.timerDelta * turnSensitivity;
	} else {
		targetTurnVel = targetTurnVel;
	}

	if ( targetThrust < minThrust ) targetThrust = minThrust;

	if ( targetThrust > maxThrust ) targetThrust = maxThrust;

	if ( targetTurnVel < minTurn ) targetTurnVel = minTurn;

	if ( targetTurnVel > maxTurn ) targetTurnVel = maxTurn;

	actualThrust += ( targetThrust - actualThrust ) * Math.exp( -system.timerDelta / thrustResponseTime );
	actualTurnVel += ( targetTurnVel - actualTurnVel ) * Math.exp( -system.timerDelta / turnResponseTime );

	speed += system.timerDelta * actualThrust / mass;
	angleDeg += system.timerDelta * actualTurnVel * speed / momInertia;

	speed *= Math.exp( -system.timerDelta / dragTime );
	targetTurnVel *= Math.exp( -system.timerDelta / centerTime );

	object.posVelocity.x = Math.sin( UtilMath.degToRad( angleDeg ) ) * speed;
	object.posVelocity.z = Math.cos( UtilMath.degToRad( angleDeg ) ) * speed;

	object.rot = new Rotation(0, angleDeg, 0);
}
