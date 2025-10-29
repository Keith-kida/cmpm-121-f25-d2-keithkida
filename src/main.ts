import "./style.css";

// ——— Title & Canvas Setup ———
const title = document.createElement("h1");
title.textContent = "Let's Paint";
document.body.append(title);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
document.body.append(canvas);

const ctx = canvas.getContext("2d")!;

// ——— Class Definitions ———

class Line {
  points: { x: number; y: number }[] = [];
  width: number;
  color: string;

  constructor(x: number, y: number, width: number, color: string) {
    this.points.push({ x, y });
    this.width = width;
    this.color = color;
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
      ctx.strokeStyle = this.color;
      ctx.stroke();
    }
  }
}
class ToolPreview {
  x: number;
  y: number;
  width: number;

  constructor(x: number, y: number, width: number) {
    this.x = x;
    this.y = y;
    this.width = width;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.fillStyle = currentColor;
    ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}
class Sticker {
  x: number;
  y: number;
  emoji: string;
  size: number;

  constructor(x: number, y: number, emoji: string, size: number) {
    this.x = x;
    this.y = y;
    this.emoji = emoji;
    this.size = size;
  }

  drag(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.font = `${this.size}px serif`;
    ctx.fillText(this.emoji, this.x, this.y);
  }
}

// ——— Drawing State ———
const drawingElements: (Line | Sticker)[] = [];
const redoElements: (Line | Sticker)[] = [];
let currentLine: Line | null = null;
let toolPreview: ToolPreview | Sticker | null = null;
const cursor = { active: false, x: 0, y: 0 };
const animalStickers = ["🦊", "🦝", "🐮", "😺", "🐺"];
let currentSticker: string | null = null;
let isDirty = true;
let currentWidth = 4;
let currentColor = "black";

// ——— UI: Undo/Redo Buttons ———
const clearButton = document.createElement("button");
clearButton.innerHTML = "clear all";
document.body.append(clearButton);

const undoButton = document.createElement("button");
undoButton.innerHTML = "undo action";
document.body.append(undoButton);

const redoButton = document.createElement("button");
redoButton.innerHTML = "redo action";
document.body.append(redoButton);

// ——— UI: Draw Buttons ———
const drawButton = document.createElement("button");
drawButton.textContent = "Marker/Color Change";
document.body.append(drawButton);

// ——— UI: Line Width Controls ———
const thinButton = document.createElement("button");
thinButton.innerHTML = "delicate";
document.body.append(thinButton);

const thickButton = document.createElement("button");
thickButton.innerHTML = "bold";
document.body.append(thickButton);

const stickerContainer = document.createElement("div");
document.body.append(stickerContainer);

// Sticker customization
const customSticker = document.createElement("button");
customSticker.innerHTML = "Add Emoji";
document.body.append(customSticker);

// ——— Export Function ———
const exportButton = document.createElement("button");
exportButton.innerHTML = "export";
document.body.append(exportButton);

// ——— Event Listeners ———

// ——— Drawing Logic ———
canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  if (currentSticker) {
    const sticker = new Sticker(e.offsetX, e.offsetY, currentSticker, 24);
    drawingElements.push(sticker);
    drawingChanged();
    return;
  }

  currentLine = new Line(cursor.x, cursor.y, currentWidth, currentColor);
  drawingElements.push(currentLine);
  redoElements.splice(0, redoElements.length);

  drawingChanged();
});

canvas.addEventListener("mousemove", (e) => {
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  if (currentLine) {
    currentLine.drag(cursor.x, cursor.y);
    drawingChanged();
  }

  canvas.dispatchEvent(new Event("tool-moved"));
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  currentLine = null;

  drawingChanged();
});

canvas.addEventListener("drawing-changed", markDirty);
canvas.addEventListener("tool-moved", () => {
  if (!cursor.active) {
    if (currentSticker) {
      toolPreview = new Sticker(cursor.x, cursor.y, currentSticker, 24);
    } else {
      toolPreview = new ToolPreview(cursor.x, cursor.y, currentWidth);
    }
  } else {
    toolPreview = null;
  }
  markDirty();
});

clearButton.addEventListener("click", () => {
  if (ctx) {
    drawingElements.splice(0, drawingElements.length);
    markDirty();
  }
});

undoButton.addEventListener("click", () => {
  if (ctx && drawingElements.length > 0) {
    const line = drawingElements.pop()!;
    redoElements.push(line);
    markDirty();
  }
});

redoButton.addEventListener("click", () => {
  if (ctx && redoElements.length > 0) {
    const line = redoElements.pop()!;
    drawingElements.push(line);
    markDirty();
  }
});

drawButton.addEventListener("click", () => {
  currentColor = "hsl(" + Math.random() * 360 + ", 100%, 50%)";
  currentSticker = null;
  toolPreview = null;
  canvas.dispatchEvent(new Event("tool-moved"));
});

thinButton.addEventListener("click", () => selected(4));
thickButton.addEventListener("click", () => selected(8));

customSticker.addEventListener("click", () => {
  const emoji = prompt("Enter your custom emoji:");
  if (emoji) {
    animalStickers.push(emoji);
    renderStickers();
  }
});

exportButton.addEventListener("click", () => {
  exportImage();
});

// REDRAW
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const line of drawingElements) {
    line.display(ctx);
  }

  if (cursor.active) {
    ctx.beginPath();
    ctx.arc(cursor.x, cursor.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  if (toolPreview) {
    if (toolPreview instanceof Sticker) {
      toolPreview.display(ctx);
    } else {
      toolPreview.draw(ctx);
    }
  }

  isDirty = false;
}

// Mark dirty
function markDirty() {
  if (!isDirty) {
    isDirty = true;
    requestAnimationFrame(redraw);
  }
}

function drawingChanged() {
  canvas.dispatchEvent(new Event("drawing-changed"));
}

function selected(width: number) {
  currentWidth = width;
  thinButton.classList.toggle("selected", width === 4);
  thickButton.classList.toggle("selected", width === 8);
}

function renderStickers() {
  const oldButtons = document.querySelectorAll(".sticker-btn");
  oldButtons.forEach((btn) => btn.remove());

  animalStickers.forEach((emoji) => {
    const btn = document.createElement("button");
    btn.classList.add("sticker-btn");
    btn.textContent = emoji;
    stickerContainer.append(btn);
    btn.addEventListener("click", () => {
      currentSticker = emoji;
      toolPreview = null;
      canvas.dispatchEvent(new Event("tool-moved"));
    });
  });
}

function exportImage() {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = canvas.width * 4;
  exportCanvas.height = canvas.height * 4;
  const exportCtx = exportCanvas.getContext("2d")!;

  exportCtx.scale(4, 4);

  for (const line of drawingElements) {
    line.display(exportCtx);
  }

  const dataUrl = exportCanvas.toDataURL();
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = "my_drawing.png";
  link.click();
}

renderStickers();
redraw();
