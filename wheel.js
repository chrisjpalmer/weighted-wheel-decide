var isMouseDown = false;
var lastX = 0;
var lastY = 0;
var midX = 249;
var midY = 249;
var startAngle = 0;
var isMuted = false;

var choiceTextSize = [];
var spinTimeout = null;
var spinArcStart = 10;
var spinTime = 0;
var spinTimeTotal = 0;
var spinAngleEnd = 0;

var ctx;
var ctxTop;

// Check available screen size so wheel doesn't go outside
var maxHeight = window.screen.availHeight;
var maxWidth = window.screen.availWidth;
var wheelSize = 300;
var canvasWidth = 300;
var wheelImage = new Image();

function wheelMouseMove(e) {
  if (isMouseDown == true) {
    var x =
      e.clientX +
      document.documentElement.scrollLeft +
      document.body.scrollLeft;
    var y =
      e.clientY + document.documentElement.scrollTop + document.body.scrollTop;
    var spinAngle = 0;
    if (x > midX) {
      if (y > midY) {
        spinAngle = (lastX - x - (lastY - y)) * 0.01;
      } else {
        spinAngle = (0 - (lastX - x) - (lastY - y)) * 0.01;
      }
    } else {
      if (y > midY) {
        spinAngle = (lastX - x + (lastY - y)) * 0.01;
      } else {
        spinAngle = (0 - (lastX - x) + (lastY - y)) * 0.01;
      }
    }
    startAngle += (spinAngle * 10 * Math.PI) / 180;
    lastX = x;
    lastY = y;
    drawRouletteWheelImage(spinAngle * 10);
  }
}
function wheelMouseMove2(x, y) {
  if (isMouseDown == true) {
    var spinAngle = 0;
    if (x > midX) {
      if (y > midY) {
        spinAngle = (lastX - x - (lastY - y)) * 0.01;
      } else {
        spinAngle = (0 - (lastX - x) - (lastY - y)) * 0.01;
      }
    } else {
      if (y > midY) {
        spinAngle = (lastX - x + (lastY - y)) * 0.01;
      } else {
        spinAngle = (0 - (lastX - x) + (lastY - y)) * 0.01;
      }
    }

    startAngle += (spinAngle * 10 * Math.PI) / 180;

    lastX = x;
    lastY = y;
    drawRouletteWheelImage(spinAngle * 10);
  }
}
function wheelMouseUp(e) {
  isMouseDown = false;
}

var audio1ended = true;
var audio2ended = true;
var audio3ended = true;

function playSound() {
  if (isMuted == false) {
    var audio = document.getElementById("wheelAudio");
    if (audio1ended) {
      audio1ended = false;
      audio.play();
      audio.addEventListener(
        "ended",
        function () {
          audio1ended = true;
        },
        false
      );
    } else if (audio2ended) {
      audio2ended = false;
      var audio2 = document.getElementById("wheelAudio2");
      audio2.play();
      audio2.addEventListener(
        "ended",
        function () {
          audio2ended = true;
        },
        false
      );
    } else if (audio3ended) {
      audio3ended = false;
      var audio3 = document.getElementById("wheelAudio3");
      audio3.play();
      audio3.addEventListener(
        "ended",
        function () {
          audio3ended = true;
        },
        false
      );
    }
  }
}

function toggleMute(button) {
  var audio = document.getElementById("wheelAudio");
  if (isMuted == true) {
    //audio.volume = 1;
    button.value = "Mute";
    button.src = "images/wd-audio-on.png";
    isMuted = false;
  } else {
    //audio.volume = 0;
    button.value = "Unmute";
    button.src = "images/wd-audio-off.png";
    isMuted = true;
  }
}

function addTouchEventListeners() {
  return;
  var wheeldiv = document.getElementById("wheelcanvastop");
  wheeldiv.addEventListener(
    "touchmove",
    function (e) {
      e.preventDefault();
      var touch = e.touches[0];
      wheelMouseMove2(touch.pageX, touch.pageY);
    },
    false
  );

  wheeldiv.addEventListener(
    "touchstart",
    function (e) {
      e.preventDefault();
      var touch = e.touches[0];
      wheelMouseDown(touch);
    },
    false
  );

  wheeldiv.addEventListener(
    "touchend",
    function (e) {
      e.preventDefault();
      var touch = e.touches[0];
      wheelMouseUp(touch);
      spin();
    },
    false
  );
}

function clearTopCanvas() {
  var canvasTop = document.getElementById("wheelcanvastop");
  if (canvasTop.getContext) {
    ctxTop = canvasTop.getContext("2d");
    ctxTop.clearRect(0, 0, canvasWidth, canvasWidth);
  }
}

function draw() {
  setChoiceFontSizes();
  drawRouletteWheel();
  setWheelImageSource();
}

function drawArrow() {
  var canvasTop = document.getElementById("wheelcanvastop");
  if (canvasTop.getContext) {
    ctxTop = canvasTop.getContext("2d");

    //Arrow
    ctxTop.fillStyle = "black";
    ctxTop.beginPath();
    // Left Side
    ctxTop.moveTo(0, WHEEL.wheelRadius + 5);
    ctxTop.lineTo(0, WHEEL.wheelRadius - 5);
    ctxTop.lineTo(13, WHEEL.wheelRadius);
    ctxTop.lineTo(0, WHEEL.wheelRadius + 5);

    ctxTop.fill();
    //ctxTop.translate( canvas.width/2 , canvas.height/2 );
  }
}

function setWheelImageSource() {
  var canvas = document.getElementById("wheelcanvas");
  if (canvas.getContext) {
    ctx = canvas.getContext("2d");
    wheelImage.src = canvas.toDataURL();
  }
}

function drawRouletteWheelImage(spinAngle) {
  var canvas = document.getElementById("wheelcanvas");
  if (canvas.getContext) {
    ctx = canvas.getContext("2d");
    //ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(wheelImage, -canvas.width / 2, -canvas.width / 2);
    ctx.rotate((spinAngle * Math.PI) / 180);
  }
}
var wedgeAngle = 360 / 12;
var angleSinceBeep = 0;
var timeSinceBeep = 0;
var isFirstSpinCycle = false;
var isOddNumberOfChoices = false;
var lastChoiceBeepedFor = -1;
function rotateWheelImage() {
  spinTime += 30;
  if (spinTime >= spinTimeTotal) {
    if(WHEEL.choices.includes(WHEEL.choiceTarget)) {
      rotateToTarget(WHEEL.choiceTarget);
    } else {
      stopRotateWheelImage();
    }
    return;
  }
  var spinAngle =
    spinAngleStart - easeOut(spinTime, 0, spinAngleStart, spinTimeTotal);
  var spinAngleRad = (spinAngle * Math.PI) / 180;
  startAngle += spinAngleRad;

  // determine whether to play the sound
  playSoundIfNeededWithWeights(); //playSoundIfNeeded(spinAngleRad);

  // spin the wheel image
  drawRouletteWheelImage(spinAngle);
  clearTimeout(spinTimeout);
  spinTimeout = setTimeout("rotateWheelImage()", 30);
}

function rotateToTarget(target) {
  spinTime += 30;
  console.log("current choice", getCurrentChoiceWithWeights())
  if (target == getCurrentChoiceWithWeights().text) {
    stopRotateWheelImage();
    return;
  }
  // var spinAngle =
  //   spinAngleStart - easeOut(spinTime, 0, spinAngleStart, spinTimeTotal);
  var spinAngle = 2;
  var spinAngleRad = (spinAngle * Math.PI) / 180;
  startAngle += spinAngleRad;


  // determine whether to play the sound
  playSoundIfNeededWithWeights(); //playSoundIfNeeded(spinAngleRad);

  // spin the wheel image
  drawRouletteWheelImage(spinAngle);
  clearTimeout(spinTimeout);
  spinTimeout = setTimeout(() => rotateToTarget(target), 30);
}

function playSoundIfNeeded(spinAngleRad) {
  if (
    isOddNumberOfChoices &&
    isFirstSpinCycle &&
    angleSinceBeep > wedgeAngle / 2 &&
    timeSinceBeep > 30
  ) {
    timeSinceBeep = 0;
    angleSinceBeep = startAngle % (wedgeAngle / 2);
    isFirstSpinCycle = false;
    playSound();
  } else if (angleSinceBeep > wedgeAngle && timeSinceBeep > 30) {
    timeSinceBeep = 0;
    angleSinceBeep = startAngle % wedgeAngle;
    if (isOddNumberOfChoices) {
      angleSinceBeep -= wedgeAngle / 2;
    }
    playSound();
  } else {
    angleSinceBeep += spinAngleRad;
    timeSinceBeep += 30;
  }
}

function playSoundIfNeededWithWeights() {
  // use "startAngle" to check if the current angle is passed the next angle that
  // should beep. may need to add another variable tracking what the last angle it
  // beeped for
  if (timeSinceBeep > 30) {
    var currChoiceIndex = getCurrentChoiceWithWeights().index;
    if (currChoiceIndex != lastChoiceBeepedFor) {
      lastChoiceBeepedFor = currChoiceIndex;
      timeSinceBeep = 0;
      playSound();
    } else {
      timeSinceBeep += 30;
    }
  } else {
    timeSinceBeep += 30;
  }
}

function easeOut(t, b, c, d) {
  var ts = (t /= d) * t;
  var tc = ts * t;
  return b + c * (tc + -3 * ts + 3 * t);
}

function getCurrentChoice() {
  var degrees = (startAngle * 180) / Math.PI + 180; // left side, not top
  var arcd = (WHEEL.arc * 180) / Math.PI;
  var index = Math.floor((360 - (degrees % 360)) / arcd);
  var text = WHEEL.choices[index];
  var choice = { text: text, index: index };
  return choice;
}
function getCurrentChoiceWithWeights() {
  var degrees = (startAngle * 180) / Math.PI + 180; // left side, not top
  var arcd = (WHEEL.arc * 180) / Math.PI;
  var degreesMod = 360 - (degrees % 360);
  var weightedIndex = 0;
  for (var index = 0; index < WHEEL.choices.length; index++) {
    var weight = 1;
    if (WHEEL.weights.length > index) {
      weight = WHEEL.weights[index];
    }
    weightedIndex += weight;
    if (degreesMod < weightedIndex * arcd) {
      var text = WHEEL.choices[index];
      var choice = { text: text, index: index };
      return choice;
    }
  }
  var index = Math.floor((360 - (degrees % 360)) / arcd);
  var text = WHEEL.choices[index];
  var choice = { text: text, index: index };
  return choice;
}
