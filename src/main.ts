import "./style.css";

const title = document.createElement("h1");
title.textContent = "Let's Paint";
document.body.append(title);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
document.body.append(canvas);

const ctx = canvas.getContext("2d")!;

class Line {
  points: { x: number; y: number }[] = [];
  width: number;

  constructor(x: number, y: number, width: number) {
    this.points.push({ x, y });
    this.width = width;
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length > 1) {
      ctx.beginPath();
      const first = this.points[0]!;
      ctx.moveTo(first.x, first.y);
      for (const { x, y } of this.points) {
        ctx.lineTo(x, y);
      }
      ctx.lineWidth = this.width;
      ctx.stroke();
    }
  }
}

const lines: Line[] = [];
const redoLines: Line[] = [];
let currentLine: Line | null = null;
const cursor = { active: false, x: 0, y: 0 };
let isDirty = true;
let currentWidth = 2;

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  currentLine = new Line(cursor.x, cursor.y, currentWidth);
  lines.push(currentLine);
  redoLines.splice(0, redoLines.length);

  drawingChanged();
});

canvas.addEventListener("mousemove", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  if (currentLine) {
    currentLine.drag(cursor.x, cursor.y);
    drawingChanged();
  }

  drawingChanged();
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  currentLine = null;

  drawingChanged();
});

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const line of lines) {
    line.display(ctx);
  }

  if (cursor.active) {
    ctx.beginPath();
    ctx.arc(cursor.x, cursor.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  isDirty = false;
}

function markDirty() {
  if (!isDirty) {
    isDirty = true;
    requestAnimationFrame(redraw);
  }
}

function drawingChanged() {
  canvas.dispatchEvent(new Event("drawing-changed"));
}

canvas.addEventListener("drawing-changed", markDirty);

const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
document.body.append(clearButton);

clearButton.addEventListener("click", () => {
  if (ctx) {
    lines.splice(0, lines.length);
    drawingChanged();
  }
});

const undoButton = document.createElement("button");
undoButton.innerHTML = "undo";
document.body.append(undoButton);

undoButton.addEventListener("click", () => {
  if (ctx && lines.length > 0) {
    const line = lines.pop()!;
    redoLines.push(line);
    drawingChanged();
  }
});

const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";
document.body.append(redoButton);

redoButton.addEventListener("click", () => {
  if (ctx && redoLines.length > 0) {
    const line = redoLines.pop()!;
    lines.push(line);
    drawingChanged();
  }
});

const thinButton = document.createElement("button");
thinButton.innerHTML = "thin";
document.body.append(thinButton);

const thickButton = document.createElement("button");
thickButton.innerHTML = "thick";
document.body.append(thickButton);

function selected(width: number) {
  currentWidth = width;
  thinButton.classList.toggle("selected", width === 2);
  thickButton.classList.toggle("selected", width === 6);
}

thinButton.addEventListener("click", () => selected(2));
thickButton.addEventListener("click", () => selected(6));

selected(2);

redraw();
