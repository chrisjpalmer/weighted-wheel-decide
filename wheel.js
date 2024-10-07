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


var WHEEL = { tbId: 0 };
var defaultColors = ["#B8D430", "#3AB745", "#029990", "#9999ff",
  "#d59aff", "#ff9ab3", "#ffaf9a", "#F80120",
  "#F35B20", "#FB9A00", "#FFCC00", "#FEF200",
];
var defaultChoices = ["Adrian","Conor","DA","Matt","Luke","Brett","Chris","Ben","Sam","Devam"];		

function bootstrapWheel() {
  const form = document.querySelector("form");
  form.addEventListener("submit", applyWheelChanges);

  const urlParams = new URLSearchParams(window.location.search);

  // set the choice target
  const choiceTarget = urlParams.get('s');
  if (choiceTarget) {
    WHEEL.choiceTarget = choiceTarget.toLowerCase()
  }

  // validate the choice mode
  const choiceMode = urlParams.get('m'); // choose, chooseanyway, gaslighting
  if(!!choiceMode) {
    if(choiceMode !== 'choose' && choiceMode !== 'chooseanyway' && choiceMode != 'gaslighting') {
      console.log('choice mode unsupported')
    }
    if (choiceMode === 'gaslighting') {
      console.log('Not implemented yet')
    }
    console.log('choice mode is', choiceMode)
    WHEEL.choiceMode = choiceMode;
  }
 


  initWheel();
  setWheelChoices(defaultChoices, defaultColors, true);
  putSettings(defaultChoices, defaultColors);
  addTouchEventListeners();
}

function setWeightedVariables(choices) {
  var weights = [];
  WHEEL.numOptionsWeighted = choices.length;
  if (weights.length > 0) {
    for (var i = 0; i < weights.length; i++) {
      WHEEL.numOptionsWeighted += weights[i] - 1;
    }
  }
  WHEEL.arc = Math.PI / (WHEEL.numOptionsWeighted / 2);
  wedgeAngle = (Math.PI * 2) / WHEEL.numOptionsWeighted;
  WHEEL.weights = weights;
}

function applyWheelChanges(event) {
  event.preventDefault();

  const data = new FormData(event.target);

  const value = Object.fromEntries(data.entries());

  let choices = Object.keys(value).filter(k => k.startsWith("_c")).map(k => value[k]).filter(v => v !== "");
  console.log({ choices });
  let colors = value.cols.split(",")
  if (colors.length == 0) {
    colors = defaultColors;
  }

  setWheelChoices(choices, colors, true);
}



function putSettings(choices, colors) {
  // clear the box
  var txtChoices = document.getElementById("txtChoices");
  txtChoices.innerHTML = "";
  
  for (var i = 0; i < choices.length; i++) {
    addElement(choices[i]);
  }

  colsFEl = document.getElementById("color-input")
  colsFEl.value = colors.join(",")
}

function initWheel() {
    WHEEL.canv = document.getElementById("wheelcanvas");
    WHEEL.canvTop = document.getElementById("wheelcanvastop");

  
    canvasWidth = 500;
    WHEEL.canv.width = canvasWidth;
    WHEEL.canv.height = canvasWidth;
    WHEEL.wheelSize = canvasWidth;
    WHEEL.canvTop.width = canvasWidth;
    WHEEL.canvTop.height = canvasWidth;
    var canvOuter = document.getElementById("wheelcanvasOuter");
    canvOuter.style.width = canvasWidth + "px";
    canvOuter.style.height = canvasWidth + "px";
}

function setWheelChoices(choices, colors, clickToSpin) {
  WHEEL = { 
      canv: WHEEL.canv,
     canvTop: WHEEL.canvTop,
     wheelSize: WHEEL.wheelSize,
     choiceTarget: WHEEL.choiceTarget,
     choiceMode: WHEEL.choiceMode,
     tbId: WHEEL.tbId 
  };
  WHEEL.choices = choices;
  WHEEL.colors = colors;
  WHEEL.numcolors = colors.length;


  WHEEL.numcolors = colors.length;
  WHEEL.numoptions = choices.length;

  setWeightedVariables(choices);

  if (WHEEL.numOptionsWeighted % 2 == 1) {
    isOddNumberOfChoices = true;
    isFirstSpinCycle = true;
  }

 if (clickToSpin) {

    var context = WHEEL.canvTop.getContext("2d");
    var imageObj = new Image();

    imageObj.onload = function () {
      context.drawImage(imageObj, 0, 0, canvasWidth, canvasWidth);
    };
    imageObj.src = "https://wheeldecide.com/images/WD-Click-to-Spin.png";
  }

  WHEEL.wheelRadius = WHEEL.wheelSize * 0.5;
  WHEEL.outsideRadius = WHEEL.wheelRadius;
  WHEEL.textRadius = WHEEL.wheelRadius * 0.9;
  WHEEL.insideRadius = WHEEL.wheelRadius * 0.1;

  
  draw();
}

//FUNCTION TO ADD TEXT BOX ELEMENT
function addElement(textValue) {
    WHEEL.tbId = WHEEL.tbId + 1;
    var contentID = document.getElementById("txtChoices");
    var newTBDiv = document.createElement("div");
    newTBDiv.setAttribute("id", "strText" + WHEEL.tbId);
    newTBDiv.setAttribute("class", "input-group");
    newTBDiv.innerHTML =
      "<input onfocus='addElement(\"\")' class='form-control' type='text' id='_c" +
      WHEEL.tbId +
      "' name='_c" +
      WHEEL.tbId +
      "'/><span class='input-group-btn' id='basic-addon2'><input type='button' value='X' onclick='removeElementID(" +
      WHEEL.tbId +
      ");' tabindex='1000'></span>";
    newTBDiv.children[0].value = textValue;
    contentID.appendChild(newTBDiv);
}

//FUNCTION TO REMOVE TEXT BOX ELEMENT
function removeElement() {
    var contentID = document.getElementById("txtChoices");
    contentID.removeChild(
      document.getElementById("strText" + WHEEL.tbId)
    );
}

function removeElementID(tbId) {
  var contentID = document.getElementById("txtChoices");
  contentID.removeChild(document.getElementById("strText" + tbId));
}

function wheelMouseDown(e) {
  clearTopCanvas();
  drawArrow();
  var wheeldiv = document.getElementById("wheelcanvastop");
  midX =
    wheeldiv.offsetLeft +
    WHEEL.wheelRadius +
    wheeldiv.offsetParent.offsetLeft +
    wheeldiv.offsetParent.offsetParent.offsetLeft;
  midY =
    wheeldiv.offsetTop +
    WHEEL.wheelRadius +
    wheeldiv.offsetParent.offsetTop +
    wheeldiv.offsetParent.offsetParent.offsetTop;
  lastX = e.clientX;
  lastY = e.clientY;
  isMouseDown = true;
}

function drawRouletteWheel() {
  startAngle = 0;
  var canvas = document.getElementById("wheelcanvas");
  WHEEL.choicesMap = {}
  if (canvas.getContext) {
    ctx = canvas.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, WHEEL.canv.width, WHEEL.canv.height);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 0;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.font = "bold 12px sans-serif";
    var weightedIndex = 0;

    for (var i = 0; i < WHEEL.numoptions; i++) {
      var weightedArc = WHEEL.arc;
      var weight = 1;
      if (WHEEL.weights.length > i) {
        weight = WHEEL.weights[i];
        weightedArc = WHEEL.arc * weight;
      }

      var angle = startAngle + weightedIndex * WHEEL.arc;
      ctx.fillStyle = WHEEL.colors[i % WHEEL.numcolors];
      ctx.beginPath();
      var endAngle = angle + weightedArc;
      // Chrome 43.0.2357.81 m arc issue
      if (endAngle > 6.282 && endAngle < 6.284) {
        endAngle = 6.282;
      }
      ctx.arc(0, 0, WHEEL.outsideRadius, angle, endAngle, false);
      ctx.arc(0, 0, WHEEL.insideRadius, endAngle, angle, true);
      ctx.fill();
      ctx.save();

      if (i % 2 == 0) {
        ctx.fillStyle = "#000000";
      } else if (i % 2 == 1) {
        ctx.fillStyle = "#ffffff";
      }
      var angHalfArc = angle + weightedArc * 0.5 - 0.04;
      ctx.translate(
        Math.cos(angHalfArc) * WHEEL.textRadius,
        Math.sin(angHalfArc) * WHEEL.textRadius
      );
      ctx.rotate(angHalfArc + Math.PI);
      var text = WHEEL.choices[i];
      WHEEL.choicesMap[text.toLowerCase()] = {startAngle:angle, endAngle: endAngle};
      ctx.font = "bold " + choiceTextSize[i] + "px sans-serif";

      textHWidth = ctx.measureText(text).width;
      if (textHWidth > WHEEL.textRadius - 30) {
        text = text.substring(0, 27) + "...";
      }

      ctx.fillText(text, 0, 0);
      weightedIndex += weight;
      ctx.restore();
    }

    drawArrow();
    console.log(WHEEL.choicesMap)
  }
}

function spin() {
  clearTopCanvas();
  drawArrow();
  var minTimeToSpin = 5;
  var timeRange = 4;
  var minAngleToStartRotating = 20;
  var angleRange = 30;
  spinTime = 0;
  spinTimeTotal = minTimeToSpin * 1000;
  angleSinceBeep = 0;
  timeSinceBeep = 0;

  slowDown = false;
  spinAngleStart = Math.random() * angleRange + minAngleToStartRotating;
  // setWheelImageSource();
  rotateWheelImage();
}

function setChoiceFontSizes() {
  // get the font size of each choice
  var canvas = document.getElementById("wheelcanvas");
  if (canvas.getContext) {
    ctx = canvas.getContext("2d");
    choiceTextSize = [];
    for (var i = 0; i < WHEEL.numoptions; i++) {
      var text = WHEEL.choices[i];
      ctx.font = "bold 18px sans-serif";
      var textHWidth = ctx.measureText(text).width;
      if (textHWidth > WHEEL.textRadius - 30) {
        ctx.font = "bold 15px sans-serif";
        textHWidth = ctx.measureText(text).width;
        if (textHWidth > WHEEL.textRadius - 30) {
          choiceTextSize.push("12");
        } else {
          choiceTextSize.push("15");
        }
      } else {
        choiceTextSize.push("18");
      }
    }
  }
}

function normalizeAngle(ang) {
  return ang % (Math.PI*2)
}

function choiceAngle(ang) {
  // map the angle to where it is regarding the choice
  // that the left hand marker points to
  return 2*Math.PI - (normalizeAngle(ang + Math.PI))
}

function stopRotateWheelImage() {
  clearTimeout(spinTimeout);

  var choice = getCurrentChoiceWithWeights();
  let winner = '';
  if (WHEEL.choiceMode == 'chooseanyway' && !!WHEEL.choiceTarget) {
    winner = WHEEL.choiceTarget;
    
  } else {
    winner = choice.text;

    // removal code
    var choices = WHEEL.choices.filter(v => v !== winner);
    setWheelChoices(choices, WHEEL.colors, false);
  }
  
  announceWinner(toTitleCase(winner))  
}

function announceWinner(winner) {
  var canvasTop = document.getElementById("wheelcanvastop");
  if (canvasTop.getContext) {
    ctxTop = canvasTop.getContext("2d");

    ctxTop.font = "bold 30px sans-serif";
    var textHWidth = ctxTop.measureText(winner).width * 0.5;
    if (textHWidth > WHEEL.wheelRadius) {
      ctxTop.font = "bold 12px sans-serif";
      textHWidth = ctxTop.measureText(winner).width * 0.5;
    }

    var imageObj = new Image();

    imageObj.onload = function () {
      ctxTop.drawImage(imageObj, 0, 0, canvasWidth, canvasWidth);
      ctxTop.fillStyle = "white";
      ctxTop.fillText(winner, canvasWidth / 2 - textHWidth, canvasWidth / 2 + 10);
    };
    imageObj.src =
      "https://wheeldecide.com/images/stop-message-gradient-500.png";
    if (!isMuted) {
      var audioFinal = document.getElementById("wheelAudioFinal");
      audioFinal.play();
    }
  }
}

function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
}

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
    if(WHEEL.choiceMode == 'choose' && WHEEL.choices.map(s => s.toLowerCase()).includes(WHEEL.choiceTarget)) {
      rotateToTarget(WHEEL.choiceTarget);
    } else {
      stopRotateWheelImage();
      console.log("spinAngleStart", spinAngleStart)
    }
    return;
  }

  // some logs:
  // var targetAngles = WHEEL.choicesMap[getCurrentChoiceWithWeights().text]
  // console.log("current", choiceAngle(startAngle), "target", targetAngles.startAngle)

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
  var targetAngles = WHEEL.choicesMap[target]

  var arcLength = Math.abs(targetAngles.endAngle - targetAngles.startAngle)/2;
  var offset = Math.random() * arcLength;
  var desired = targetAngles.startAngle + offset;
  
  var cur = choiceAngle(startAngle);
  if (Math.abs(desired - cur) < 0.1) {
    stopRotateWheelImage();
    return;
  }
  
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
