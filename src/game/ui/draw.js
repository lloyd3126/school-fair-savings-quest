import { COLORS, FONT_FAMILY, toCssColor } from './theme.js';

export function addPanel(scene, container, x, y, width, height, options = {}) {
  const panel = scene.add.graphics();
  panel.fillStyle(options.fill ?? COLORS.surface, 1);
  panel.fillRoundedRect(x, y, width, height, options.radius ?? 18);
  if (options.stroke !== false) {
    panel.lineStyle(options.lineWidth ?? 1, options.strokeColor ?? COLORS.line, 1);
    panel.strokeRoundedRect(x, y, width, height, options.radius ?? 18);
  }
  container.add(panel);
  return panel;
}

export function addText(scene, container, x, y, content, options = {}) {
  const text = scene.add.text(x, y, content, {
    fontFamily: options.fontFamily ?? FONT_FAMILY,
    fontSize: `${options.fontSize ?? 16}px`,
    fontStyle: options.bold ? 'bold' : 'normal',
    color: toCssColor(options.color ?? COLORS.ink),
    align: options.align ?? 'left',
    lineSpacing: options.lineSpacing ?? 3,
    wordWrap: options.wrapWidth ? { width: options.wrapWidth } : undefined,
  });
  text.setOrigin(options.originX ?? 0, options.originY ?? 0);
  container.add(text);
  return text;
}

export function addButton(scene, container, x, y, width, height, label, onClick, options = {}) {
  const color = options.fill ?? COLORS.green;
  const hoverColor = options.hoverFill ?? COLORS.greenHover;
  const disabled = Boolean(options.disabled);
  const background = scene.add.graphics();
  const draw = (fill) => {
    background.clear();
    background.fillStyle(disabled ? COLORS.line : fill, 1);
    background.fillRoundedRect(x, y, width, height, options.radius ?? 14);
    if (options.stroke !== false) {
      background.lineStyle(1, disabled ? COLORS.line : (options.strokeColor ?? fill), 1);
      background.strokeRoundedRect(x, y, width, height, options.radius ?? 14);
    }
  };
  draw(color);

  const hitArea = scene.add.zone(x, y, width, height).setOrigin(0);
  if (!disabled) {
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerover', () => draw(hoverColor));
    hitArea.on('pointerout', () => draw(color));
    hitArea.on('pointerdown', onClick);
  }

  const text = scene.add.text(x + width / 2, y + height / 2, label, {
    fontFamily: FONT_FAMILY,
    fontSize: `${options.fontSize ?? 16}px`,
    fontStyle: options.bold === false ? 'normal' : 'bold',
    color: toCssColor(disabled ? COLORS.muted : (options.textColor ?? COLORS.surface)),
    align: 'center',
    lineSpacing: 2,
    wordWrap: { width: width - 18 },
  }).setOrigin(0.5);

  container.add([background, hitArea, text]);
  return hitArea;
}

export function addImage(scene, container, x, y, texture, width, height) {
  const image = scene.add.image(x, y, texture).setDisplaySize(width, height);
  container.add(image);
  return image;
}

export function addProgressBar(scene, container, x, y, width, height, value, max, options = {}) {
  const progress = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  const graphics = scene.add.graphics();
  graphics.fillStyle(options.track ?? COLORS.surfaceAlt, 1);
  graphics.fillRoundedRect(x, y, width, height, height / 2);
  if (progress > 0) {
    graphics.fillStyle(options.fill ?? COLORS.green, 1);
    graphics.fillRoundedRect(x, y, Math.max(height, width * progress), height, height / 2);
  }
  container.add(graphics);
  return graphics;
}
