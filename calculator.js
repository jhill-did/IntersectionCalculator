
let canvas;
let context;

let circleCenter = { x: 256, y: 214 };
let circleRadius = 137;

let intersections = [];
let lineSegments = [
  {
    start: { x: 80, y: 277 },
    end: { x: 438, y: 207 }
  }
];

let currentTool = 'Line';

let isMouseDown = false;
let currentMouseOffset = { x: 0, y: 0 };

function init() {
  canvas = document.getElementById('canvas')
  context = canvas.getContext('2d');

  window.addEventListener('mousedown', mouseDown);
  window.addEventListener('mouseup', mouseUp);
  window.addEventListener('mousemove', mouseMove);

  // Start drawing.
  setInterval(draw, 0.01666666666);
}

function mouseDown(event) {
  if (event.target === canvas) {
    isMouseDown = true;

    if (currentTool === 'Line') {
      let segment = {
        start: {
          x: event.offsetX,
          y: event.offsetY
        },
        end: {
          x: event.offsetX,
          y: event.offsetY
        }
      };
      lineSegments.push(segment);
    }
    else {
      circleCenter.x = event.offsetX;
      circleCenter.y = event.offsetY;

      circleRadius = 0;
    }
  }
}

function mouseUp(event) {
  isMouseDown = false;
}

function mouseMove(event) {
  if (isMouseDown) {
    if (currentTool === 'Line') {
      let currentLine = lineSegments[lineSegments.length - 1];
      currentLine.end.x = event.offsetX;
      currentLine.end.y = event.offsetY;
    }
    else {
      circleRadius = Math.sqrt(Math.pow(circleCenter.x - event.offsetX, 2) + Math.pow(circleCenter.y - event.offsetY, 2));
    }
  }

  currentMouseOffset.x = event.offsetX;
  currentMouseOffset.y = event.offsetY;
}

function draw() {
  updateDisplayValues();
  calculateIntersections();
  calculateAngles();

  context.clearRect(0, 0, 512, 512);

  context.beginPath();
  context.ellipse(circleCenter.x, circleCenter.y, circleRadius, circleRadius, 0, 0, 360 * (180 / Math.PI));
  context.stroke();

  context.fillStyle = 'black';
  context.beginPath();
  context.ellipse(circleCenter.x, circleCenter.y, 1, 1, 0, 0, 360 * (180 / Math.PI));
  context.fill();

  if (isMouseDown) {
    if (currentTool === 'Circle') {
      context.strokeStyle = 'green';
      context.beginPath();
      context.moveTo(circleCenter.x, circleCenter.y);
      context.lineTo(currentMouseOffset.x, currentMouseOffset.y);
      context.stroke();
      context.strokeStyle = 'black';
    }
  }

  for (lineSegment of lineSegments) {
    context.beginPath();
    context.moveTo(lineSegment.start.x, lineSegment.start.y);
    context.lineTo(lineSegment.end.x, lineSegment.end.y);
    context.stroke();
  }

  for (intersection of intersections) {
    const mouseDistance = Math.sqrt(Math.pow(currentMouseOffset.x - intersection.x, 2) + Math.pow(currentMouseOffset.y - intersection.y, 2));
    if (mouseDistance <= 4) {
      context.fillStyle = 'lime';
      context.beginPath();
      context.ellipse(intersection.x, intersection.y, 4, 4, 0, 0, 360 * (180 / Math.PI));
      context.fill();
      context.font = "18px Arial Bold";
      const labelText = `(${Math.round(intersection.x)}, ${Math.round(intersection.y)})`;
      const textWidth = context.measureText(labelText).width;

      console.log(textWidth);
      context.fillStyle = 'white';
      context.fillRect(intersection.x + 9, intersection.y - 10 - 18, textWidth + 2, 24);

      context.fillStyle = 'lime';
      context.fillText(labelText, intersection.x + 10, intersection.y - 10);
    }
    else {
      context.fillStyle = 'red';
      context.beginPath();
      context.ellipse(intersection.x, intersection.y, 4, 4, 0, 0, 360 * (180 / Math.PI));
      context.fill();
    }
  }
}

function updateDisplayValues() {
  document.getElementById('circleCenterText').textContent = `(${circleCenter.x}, ${circleCenter.y})`;
  document.getElementById('circleRadiusText').textContent = `${parseFloat(circleRadius + '').toFixed(4)}`;

  const lineSegmentsText = document.getElementById('lineSegmentsText');
  lineSegmentsText.innerHTML = '';

  for (lineSegment of lineSegments) {
    lineSegmentsText.innerHTML += `<div>(${lineSegment.start.x}, ${lineSegment.start.y}) & (${lineSegment.end.x}, ${lineSegment.end.y})</div>`;
  }

  if (lineSegments.length === 0) {
    lineSegmentsText.innerHTML = 'None';
  }

  // Clear current intersections.
  const intersectionsText = document.getElementById('intersectionsText');
  intersectionsText.innerHTML = '';

  // List new ones.
  for (intersection of intersections) {
    const roundedX = parseFloat(intersection.x + '').toFixed(0);
    const roundedY = parseFloat(intersection.y + '').toFixed(0);
    intersectionsText.innerHTML += `<div>(${roundedX}, ${roundedY})</div>`;
  }

  if (intersections.length === 0) {
    intersectionsText.innerHTML = 'None';
  }
}

function calculateIntersections() {
  // Reset intersections for this frame.
  intersections = [];

  for (line of lineSegments) {
    // compute the distance between A and B
    const lineLength = Math.sqrt(Math.pow(line.end.x - line.start.x, 2) + Math.pow(line.end.y - line.start.y, 2));

    // compute the direction vector D from A to B
    const lineDirection = {
      x: (line.end.x - line.start.x) / lineLength,
      y: (line.end.y - line.start.y) / lineLength
    };

    // Now the line equation is x = Dx*t + Ax, y = Dy*t + Ay with 0 <= t <= 1.

    // compute the value t of the closest point to the circle center (Cx, Cy)
    // t = Dx*(Cx-Ax) + Dy*(Cy-Ay)
    const closestPoint = (
      lineDirection.x * (circleCenter.x - line.start.x) + lineDirection.y * (circleCenter.y - line.start.y)
    );

    // This is the projection of C on the line from A to B.

    // compute the coordinates of the point E on line and closest to C
    const linePoint = {
      x: closestPoint * lineDirection.x + line.start.x,
      y: closestPoint * lineDirection.y + line.start.y
    };
    // Ex = t*Dx+Ax
    // Ey = t*Dy+Ay

    // compute the distance from E to C
    // LEC = sqrt( (Ex-Cx)²+(Ey-Cy)² )
    const linePointToCircleDistance = (
      Math.sqrt(Math.pow(linePoint.x - circleCenter.x, 2) + Math.pow(linePoint.y - circleCenter.y, 2))
    );

    // test if the line intersects the circle
    if( linePointToCircleDistance < circleRadius )
    {
      // compute distance from t to circle intersection point
      // dt = sqrt( R² - LEC²)
      const closestPointDistance = Math.sqrt(Math.pow(circleRadius, 2) - Math.pow(linePointToCircleDistance, 2));

      // compute first intersection point
      // Fx = (t-dt)*Dx + Ax
      // Fy = (t-dt)*Dy + Ay
      const firstIntersection = {
        x: (closestPoint - closestPointDistance) * lineDirection.x + line.start.x,
        y: (closestPoint - closestPointDistance) * lineDirection.y + line.start.y
      };

      // compute second intersection point
      // Gx = (t+dt)*Dx + Ax
      // Gy = (t+dt)*Dy + Ay
      const secondIntersection = {
        x: (closestPoint + closestPointDistance) * lineDirection.x + line.start.x,
        y: (closestPoint + closestPointDistance) * lineDirection.y + line.start.y
      }

      // Cull point if it's beyond the bounds of our line segment.
      let lineSegmentBounds = {
        left: Math.min(line.start.x, line.end.x),
        top: Math.min(line.start.y, line.end.y),
        right: Math.max(line.start.x, line.end.x),
        bottom: Math.max(line.start.y, line.end.y)
      };

      if (firstIntersection.x >= lineSegmentBounds.left && firstIntersection.x <= lineSegmentBounds.right && firstIntersection.y >= lineSegmentBounds.top && firstIntersection.y <= lineSegmentBounds.bottom ) {
        intersections.push(firstIntersection);
      }

      if (secondIntersection.x >= lineSegmentBounds.left && secondIntersection.x <= lineSegmentBounds.right && secondIntersection.y >= lineSegmentBounds.top && secondIntersection.y <= lineSegmentBounds.bottom) {
        intersections.push(secondIntersection);
      }
    }
    else if(linePointToCircleDistance === circleRadius) { // else test if the line is tangent to circle
        // tangent point to circle is E
        intersections.push(linePoint);
    }
    else {
      // line doesn't touch circle
    }
  }
}

function calculateAngles() {
  for (intersection of intersections) {

  }
}

function toggleTool() {
  const clearButton = document.getElementById('clearButtonContainer');

  if (currentTool === 'Line') {
    currentTool = 'Circle';
    clearButton.style.display = 'none';
  }
  else {
    currentTool = 'Line';
    clearButton.style.display = 'block';
  }

  document.getElementById('currentToolButton').textContent = currentTool;
}

function clearLineSegments() {
  lineSegments = [];
}

init();
