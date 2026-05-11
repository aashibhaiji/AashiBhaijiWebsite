/**
 * GradualBlur — vanilla port of @react-bits/GradualBlur-JS-CSS
 * Props match the user's Usage example (no behavioral changes to those values).
 */
(function () {
  var CURVE_FUNCTIONS = {
    linear: function (p) {
      return p;
    },
    bezier: function (p) {
      return p * p * (3 - 2 * p);
    },
    'ease-in': function (p) {
      return p * p;
    },
    'ease-out': function (p) {
      return 1 - Math.pow(1 - p, 2);
    },
    'ease-in-out': function (p) {
      return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    }
  };

  function getGradientDirection(position) {
    return (
      {
        top: 'to top',
        bottom: 'to bottom',
        left: 'to left',
        right: 'to right'
      }[position] || 'to bottom'
    );
  }

  function mergeConfigs() {
    var out = {};
    for (var i = 0; i < arguments.length; i++) {
      var c = arguments[i];
      if (!c) continue;
      for (var k in c) {
        if (Object.prototype.hasOwnProperty.call(c, k)) out[k] = c[k];
      }
    }
    return out;
  }

  var DEFAULT_CONFIG = {
    position: 'bottom',
    strength: 2,
    height: '6rem',
    divCount: 5,
    exponential: false,
    zIndex: 1000,
    animated: false,
    duration: '0.3s',
    easing: 'ease-out',
    opacity: 1,
    curve: 'linear',
    responsive: false,
    target: 'parent',
    className: '',
    style: {}
  };

  var userProps = {
    target: 'page',
    position: 'bottom',
    height: '7rem',
    strength: 1.5,
    divCount: 5,
    curve: 'bezier',
    exponential: false,
    opacity: 0.8
  };

  function mount() {
    var config = mergeConfigs(DEFAULT_CONFIG, userProps);
    var curveFunc = CURVE_FUNCTIONS[config.curve] || CURVE_FUNCTIONS.linear;
    var isPageTarget = config.target === 'page';
    var z = isPageTarget ? config.zIndex + 100 : config.zIndex;

    var outer = document.createElement('div');
    outer.className =
      'gradual-blur gradual-blur-page' +
      (config.className ? ' ' + config.className : '');
    outer.setAttribute('aria-hidden', 'true');

    var inner = document.createElement('div');
    inner.className = 'gradual-blur-inner';

    var increment = 100 / config.divCount;
    var currentStrength = config.strength;

    for (var i = 1; i <= config.divCount; i++) {
      var progress = i / config.divCount;
      progress = curveFunc(progress);

      var blurValue;
      if (config.exponential) {
        blurValue = Math.pow(2, progress * 4) * 0.0625 * currentStrength;
      } else {
        blurValue = 0.0625 * (progress * config.divCount + 1) * currentStrength;
      }

      var p1 = Math.round((increment * i - increment) * 10) / 10;
      var p2 = Math.round(increment * i * 10) / 10;
      var p3 = Math.round((increment * i + increment) * 10) / 10;
      var p4 = Math.round((increment * i + increment * 2) * 10) / 10;

      var gradient = 'transparent ' + p1 + '%, black ' + p2 + '%';
      if (p3 <= 100) gradient += ', black ' + p3 + '%';
      if (p4 <= 100) gradient += ', transparent ' + p4 + '%';

      var direction = getGradientDirection(config.position);
      var mask = 'linear-gradient(' + direction + ', ' + gradient + ')';
      var blurRem = blurValue.toFixed(3) + 'rem';

      var layer = document.createElement('div');
      layer.style.position = 'absolute';
      layer.style.inset = '0';
      layer.style.webkitMaskImage = mask;
      layer.style.maskImage = mask;
      layer.style.backdropFilter = 'blur(' + blurRem + ')';
      layer.style.webkitBackdropFilter = 'blur(' + blurRem + ')';
      layer.style.opacity = String(config.opacity);
      inner.appendChild(layer);
    }

    outer.appendChild(inner);

    outer.style.position = isPageTarget ? 'fixed' : 'absolute';
    outer.style.pointerEvents = 'none';
    outer.style.opacity = '1';
    outer.style.zIndex = String(z);

    if (config.position === 'top' || config.position === 'bottom') {
      outer.style.height = config.height;
      outer.style.width = '100%';
      outer.style[config.position] = '0';
      outer.style.left = '0';
      outer.style.right = '0';
    } else {
      outer.style.width = config.height;
      outer.style.height = '100%';
      outer.style[config.position] = '0';
      outer.style.top = '0';
      outer.style.bottom = '0';
    }

    if (config.style && typeof config.style === 'object') {
      for (var sk in config.style) {
        if (Object.prototype.hasOwnProperty.call(config.style, sk)) {
          outer.style[sk] = config.style[sk];
        }
      }
    }

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      outer.style.display = 'none';
    }

    document.body.appendChild(outer);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
