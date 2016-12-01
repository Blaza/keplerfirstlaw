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

  function drawScale() {
    var AU = params.AU;
    var scaleRef;
    var L;

    // Using some math done on paper we calculate the needed scale factor and
    // it's size in pixels for the scale.
    if(AU < 50){
      var cmp = 50/AU;
      var i = 0;
      do {
        scaleRef = Math.pow(10, i%2==0?i/2:(i-1)/2)*Math.pow(5, i%2);
        i++;
      }
      while(scaleRef < cmp)
    }
    else if(AU > 150){
      var cmp = 150/AU;
      var i = 0;
      do {
        scaleRef = Math.pow(10, i%2==0?-i/2:(-i-1)/2)*Math.pow(5, i%2);
        i++;
      }
      while(scaleRef > cmp)
    }
    else {
      scaleRef = 1;
    }

    L = scaleRef * AU;
    // draw scale reference and text above it
    r.path(["M", 515-L/2, 50, "L", 515+L/2, 50]).attr({stroke:'#cccccc',
                                                       'stroke-width':4});
    r.text(515, 25,"Scale:\n"+ scaleRef + " AU").attr({fill:'#eeeeee',
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

