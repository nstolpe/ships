'use strict'

module.exports = {
    /**
     * Enum-like immutable object with 3 states.
     */
    TrinaryState: Object.freeze({
        POSITIVE: 1,
        NEUTRAL: 0,
        NEGATIVE: -1
    }),
    angleToVector: angle => {
        return {
            x: Math.cos(angle),
            y: Math.sin(angle)
        }
    },
    toDegrees: angle => {
        return angle * (180 / Math.PI);
    },
    toRadians: angle => {
        return angle * (Math.PI / 180);
    },
    clamp: (num, low, high) => {
        return num < low ? low : num > high ? high : num;
    },
    /**
     * Checks is a value is numeric
     * https://stackoverflow.com/questions/9716468/is-there-any-function-like-isnumeric-in-javascript-to-validate-numbers#answer-9716488
     */
    isNumeric: n => {
        return !isNaN(parseFloat(n)) && isFinite(n);
    },
    /**
     * Generates a random int between min and max, inclusive on both ends.
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random#Getting_a_random_integer_between_two_values_inclusive
     */
    randomInt: (min, max) => {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    /**
     * Returns an object of arguments retrieved from `location.search` of a `window` object.
     */
    locationArgs: win => {
        let search;

        try {
            search = win.location.search;
        } catch(e) {
            console.warn('Invalid window object, could not access `location.search`.');
            return {};
        }

        const args = {};
        const params = search.replace(/^\?/, '').split('&');

        params.forEach((p, i) => {
            let param = p.split('=');

            // single length param is either empty or true.
            if (param.length < 2)
                if (param[0]) args[param[0]] = true;

            // 2 arg param sets a key and value
            if (param.length === 2)
                args[param[0]] = param[1];
        });

        return args;
    },
    /**
     * Normalizes a radian angle to keep it between -2PI and 2PI
     *
     * @param number angle  The angle that may need normalization.
     */
    normalizeAngle: angle => {
        const limit = 2 * Math.PI;
        let normalized = angle;
        if (angle >= limit)
            normalized -= limit * Math.floor(normalized / limit);
        else if (angle <= -limit)
            normalized += limit * Math.floor(normalized / -limit);

        return normalized;
    },
    /**
     * Attempts to safely retrieve a nested property from a `source` object.
     * The `propString` determines the levels and names of properties, with the
     * names/levels delineatd by a period.
     * ex: The desired target object is `bar`, the parent/source object is foo
     *     var foo = {
     *         baz: {
     *            gaz: {}
     *                bar: 'bar'
     *            }
     *         }
     *     }
     *     property(foo, 'baz.gaz.bar');
     *     > 'bar'
     *
     * @param source     {object}
     * @param keys {string|array}
     * @param fallback
     * @return varies
     */
    property: (source, keys, fallback) => {
        const kkeys = typeof keys === 'string' ?
            keys.split('.') :
            !Array.isArray(keys) ? [] : keys;
        return kkeys.reduce((obj, key) => obj && obj[key] ? obj[key] : fallback, source);
    }
};
