import "./style.css";

const title = document.createElement("h1");
title.textContent = "Let's Paint";
document.body.append(title);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
document.body.append(canvas);

const ctx = canvas.getContext("2d")!;

type Point = { x: number; y: number };
type Line = Point[];

const lines: Line[] = [];
const redoLines: Line[] = [];
let currentLine: Line | null = null;
const cursor = { active: false, x: 0, y: 0 };

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  currentLine = [];
  lines.push(currentLine);
  redoLines.splice(0, redoLines.length);
  currentLine.push({ x: cursor.x, y: cursor.y });

  redraw();
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.active && ctx && currentLine) {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;

    currentLine.push({ x: cursor.x, y: cursor.y });

    redraw();
  }
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  currentLine = null;

  redraw();
});

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const line of lines) {
    if (line.length > 1) {
      ctx.beginPath();
      const { x, y } = line[0]!;
      ctx.moveTo(x, y);
      for (const { x, y } of line) {
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
}

const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
document.body.append(clearButton);

clearButton.addEventListener("click", () => {
  if (ctx) {
    lines.splice(0, lines.length);
    redraw();
  }
});
