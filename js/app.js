// Utility class for javascript sequences using generators
var Sequencer = (function() {
  // First we will define the sequence of all integers
  function* ints(){
    yield 0;
    var i=1;
    while(true){
      yield i;
      yield -i;
      i++;
    }
  }
  // function used to map a function to every element of generator
  function* map(it, f) {
    for (let x of it) {
      yield f(x);
    }
  }
  // function to filter elements of the generator, using condition function f
  function* filter(it, f) {
    for (let x of it) {
      if (f(x)) {
        yield x;
      }
    }
  }

  return { // public interface
    makeSequence: function(f) {
      return map(ints(), f);
    },
    filter: function(it, f){
      return filter(it, f);
    }
  };
})();

// singleton class Orbiter which handles all drawing
var Orbiter = (function() {
  // private variables
  // Raphael instance which controls all drawing
  var r = null;
  // current orbit parameters
  var params = {};
  // set the offset of the Sun's x coordinate from center
  var sunOffset = 50;
  // set padding for canvas
  var cPadding = 20;
  // scale for period times. This will represent Earth orbit animation time
  // and scale to that.
  var periodScale = 5000;

  // private methods
  function resetCanvas() {
    r.clear();
  }

  function setUpAnimation(){
    Raphael.el.animateAlong = function(path, duration, repetitions) {
      var element = this;
      element.path = path;
      element.pathLen = element.path.getTotalLength();
      duration = (typeof duration === "undefined") ? 5000 : duration;
      repetitions = (typeof repetitions === "undefined") ? 1 : repetitions;

      r.customAttributes.along = function(u) {
      var v = 1-u;
      var point = this.path.getPointAtLength(v * this.pathLen),
          attrs = { cx: point.x, cy: point.y };
      this.rotateWith && (attrs.transform = 'r'+point.alpha);
      return attrs;
      };

      element.attr({along:0});
      var anim = Raphael.animation({along: 1}, duration);
      element.animate(anim.repeat(repetitions));
    };
  }

  //  calculate parameters needed for drawing the orbit
  function calcParams(a, e) {
    // calculate the center of the canvas, keeping in mind the padding
    var width = r.width - 2*cPadding;
    var height = r.height - 2*cPadding;
    var centerX = width / 2 + cPadding;
    var centerY = height / 2 + cPadding;
    var sunX = centerX - sunOffset;
    var sunY = centerY;

    // calculate semi-minor axis
    var b = a * Math.sqrt(1 - e*e);

    // calculate focus point distance from ellipse center
    var c = Math.sqrt(a*a - b*b);

    // calculate orbit period using Kepler's third law a^3/T^2 = const.
    var period = periodScale * Math.sqrt(a*a*a);

    // Scaling factor for astronomical unit so the ellipse will fit to canvas.
    // Formula derived on paper with some basic geometry.
    var AU = Math.min((sunX-cPadding)/(a-c), (width-sunX+cPadding)/(a+c));

    //scale a, b and c to reflect AU
    aAU = a*AU;
    bAU = b*AU;
    cAU = c*AU;

    ellipseX = sunX + cAU;
    ellipseY = sunY;

    // set objects parameters params
    params = { a: aAU,
               b: bAU,
               c: cAU,
               cX: centerX,
               cY: centerY,
               eX: ellipseX,
               eY: ellipseY,
               sX: sunX,
               sY: sunY,
               T: period,
               AU: AU };

    return params;
  }

  function drawOrbit() {
    // draw the orbit ellipse
    var ellipse = "M" + (params.eX - params.a) + "," + params.eY + " a " +
                   params.a + "," + params.b + " 0 1,1 0,0.1";

    var orbit = r.path(ellipse).attr({stroke:'white'});

    // draw planet at perihelion
    var planet = r.circle(params.sX-(params.a-params.c),
                           params.sY, 7).attr({fill:'lightblue'})

    planet.animateAlong(orbit, params.T, Infinity);

    // draw the sun
    r.circle(params.sX, params.sY, 10).attr({fill:'yellow'})
    r.text(params.sX, params.sY - 20, "Sun").attr({fill:'#eeeeee'});
  }

  // Calculate the needed reference value for the scale, given the AU size in
  // pixels. We only get minWidth because maxWidth must be 5*minWidth  to ensure
  // we always get inside our model of scales 0.05,0.1,0.5,1,5,10,50,...
  // Using some math done on paper we calculate the needed scale factor and
  // it's size in pixels for the scale.
  function calcScaleRef(AU, minWidth){
    var maxWidth = 5*minWidth;
    // our sequence can be defined with a formula like below.
    var seq = Sequencer.makeSequence(i => Math.pow(10, i%2==0 ? i/2 : (i-1)/2)*
                                       Math.pow(5, Math.abs(i)%2));
    // We want the first element that is higher than minWidth/AU and lower than
    // maxWidth/AU. We make a generator which filters our sequence in order to
    // get such elements
    var flt = Sequencer.filter(seq, x => (minWidth/AU < x && x < maxWidth/AU))
    // and return the first (and only) element of that generator.
    return flt.next()['value'];
  }

  function drawScale() {
    var AU = params.AU;
    var scaleRef;
    var L;

    scaleRef = calcScaleRef(AU, 36);

    L = scaleRef * AU;
    // draw scale reference and text above it
    r.path(["M", 519-L/2, 47, "L", 519+L/2, 47]).attr({stroke:'#cccccc',
                                                       'stroke-width':2});
    r.path(["M", 519-L/2, 42, "L", 519-L/2, 52]).attr({stroke:'#cccccc',
                                                       'stroke-width':1});
    r.path(["M", 519+L/2, 42, "L", 519+L/2, 52]).attr({stroke:'#cccccc',
                                                       'stroke-width':1});
    r.text(519, 22,"Scale:\n"+ scaleRef + " AU").attr({fill:'#eeeeee',
                                               'font-size':14});

  }

  return { // public interface
    load: function(containerStr, width, height) {
      if(!r) {
        r = Raphael(containerStr, width, height);
        r.canvas.style.backgroundColor = "#030321";
       setUpAnimation();
      }
    },
    setOrbit: function(sma, ecc, art) {
      resetCanvas();
      // one Earth orbit time will be 1000ms / art yrs/s
      periodScale = 1000 / parseFloat(art);
      // turn arguments to numbers for safety
      calcParams(parseFloat(sma),parseFloat(ecc));
      drawOrbit();
      drawScale();
    }
  };
})();

$(function() {
  var sma = $("#smaInput").val();
  var ecc = $("#eccInput").val();
  var art = $("#artInput").val();
  Orbiter.load("canvas", 616, 616);
  Orbiter.setOrbit(sma, ecc, art);

  $("#setButton").click(function(){
    var sma = $("#smaInput").val();
    var ecc = $("#eccInput").val();
    var art = $("#artInput").val();
    Orbiter.setOrbit(sma, ecc, art);
  });
});

