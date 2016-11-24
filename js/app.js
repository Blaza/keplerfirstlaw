// singleton class Orbiter which handles all drawing
var Orbiter = (function() {
  // private variables
  var r = null;
  // set the offset of the Sun's x coordinate from center
  var sunOffset = 50;
  // set padding for canvas
  var canvasPadding = 10;

  // private methods
  function resetCanvas() {
    r.clear();
  }

  //  calculate parameters needed for drawing the orbit
  function calcParams(a, e) {
    // calculate the center of the canvas, keeping in mind the padding
    var width = r.width - 2*canvasPadding;
    var height = r.height - 2*canvasPadding;
    var centerX = width / 2 + canvasPadding;
    var centerY = height / 2 + canvasPadding;
    var sunX = centerX - sunOffset;
    var sunY = centerY;

    // calculate semi-minor axis
    var b = a * Math.sqrt(1 - e*e);

    // calculate focus point distance from ellipse center
    var c = Math.sqrt(a*a - b*b);

    // Scaling factor for astronomical unit so the ellipse will fit to canvas.
    // Formula derived on paper with some basic geometry.
    var AU = Math.min(sunX/(a-c), (width-sunX)/(a+c));

    //scale a, b and c to reflect AU
    aAU = a*AU;
    bAU = b*AU;
    cAU = c*AU;

    ellipseX = sunX + cAU;
    ellipseY = sunY;


    var params = { a: aAU,
                   b: bAU,
                   c: cAU,
                   cX: centerX,
                   cY: centerY,
                   eX: ellipseX,
                   eY: ellipseY,
                   sX: sunX,
                   sY: sunY,
                   AU: AU };

    return params;
  }

  function drawOrbit(sma, ecc) {
    params = calcParams(sma, ecc);

    // draw the orbit ellipse
    r.ellipse(params.eX, params.eY, params.a, params.b).attr({stroke:'white'});

    // draw the sun
    r.circle(params.sX, params.sY, 8, 8).attr({fill:'yellow'})
  }

  return { // public interface
    load: function(containerStr, width, height) {
      if(!r) {
        r = Raphael(containerStr, width, height);
        r.canvas.style.backgroundColor = "#030321";
      }
    },
    setOrbit: function(sma, ecc) {
      resetCanvas();
      // turn arguments to numbers for security
      drawOrbit(parseFloat(sma),parseFloat(ecc));
    }
  };
})();

$(function() {
  var sma = $("#smaInput").val();
  var ecc = $("#eccInput").val();
  Orbiter.load("canvas", 616, 616);
  Orbiter.setOrbit(sma, ecc);

  $("#setButton").click(function(){
    var sma = $("#smaInput").val();
    var ecc = $("#eccInput").val();
    Orbiter.setOrbit(sma, ecc);
  });
});

