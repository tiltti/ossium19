/**
 * DX7 Algorithm Visual Display
 *
 * Renders the 32 DX7 algorithms as block diagrams
 * similar to the original DX7 front panel.
 */

import { LcdColor } from './LcdScreen';

// Define the visual layout for each algorithm
// Each operator is positioned on a grid, with connections showing modulation
// Format: { op: number, x: number, y: number, modulates?: number[], feedback?: boolean }
interface OperatorPosition {
  op: number;  // 1-6
  x: number;   // 0-4 column
  y: number;   // 0-3 row (0 = top, 3 = bottom/output)
  modulates?: number[];  // Which operators this one modulates
  feedback?: boolean;    // Has self-feedback loop
}

interface AlgorithmLayout {
  operators: OperatorPosition[];
  carriers: number[];  // Which operators output to audio
}

// DX7 Algorithm layouts (1-32)
// These match the original Yamaha DX7 algorithm topologies
const DX7_ALGORITHM_LAYOUTS: AlgorithmLayout[] = [
  // Algorithm 1: 6→5→4→3→2→1 (serial)
  { operators: [
    { op: 6, x: 2, y: 0, modulates: [5], feedback: true },
    { op: 5, x: 2, y: 1, modulates: [4] },
    { op: 4, x: 2, y: 2, modulates: [3] },
    { op: 3, x: 1, y: 2, modulates: [2] },
    { op: 2, x: 1, y: 3, modulates: [1] },
    { op: 1, x: 0, y: 3 },
  ], carriers: [1] },

  // Algorithm 2: (6fb)→5→4→3→(2+1)
  { operators: [
    { op: 6, x: 2, y: 0, modulates: [5], feedback: true },
    { op: 5, x: 2, y: 1, modulates: [4] },
    { op: 4, x: 2, y: 2, modulates: [3] },
    { op: 3, x: 1, y: 2, modulates: [2, 1] },
    { op: 2, x: 0, y: 3 },
    { op: 1, x: 1, y: 3 },
  ], carriers: [1, 2] },

  // Algorithm 3: 6→5→4→(3+2→1)
  { operators: [
    { op: 6, x: 2, y: 0, modulates: [5], feedback: true },
    { op: 5, x: 2, y: 1, modulates: [4] },
    { op: 4, x: 2, y: 2, modulates: [3] },
    { op: 3, x: 1, y: 3 },
    { op: 2, x: 0, y: 2, modulates: [1] },
    { op: 1, x: 0, y: 3 },
  ], carriers: [1, 3] },

  // Algorithm 4: 6→5→4→3, 6fb mod 3 and 1
  { operators: [
    { op: 6, x: 2, y: 0, modulates: [5], feedback: true },
    { op: 5, x: 2, y: 1, modulates: [4] },
    { op: 4, x: 2, y: 2, modulates: [3] },
    { op: 3, x: 2, y: 3 },
    { op: 2, x: 0, y: 2, modulates: [1] },
    { op: 1, x: 0, y: 3 },
  ], carriers: [1, 3] },

  // Algorithm 5: 6→5, 4→3, 2→1 (two parallel stacks)
  { operators: [
    { op: 6, x: 2, y: 1, modulates: [5], feedback: true },
    { op: 5, x: 2, y: 2 },
    { op: 4, x: 1, y: 1, modulates: [3] },
    { op: 3, x: 1, y: 2 },
    { op: 2, x: 0, y: 1, modulates: [1] },
    { op: 1, x: 0, y: 2 },
  ], carriers: [1, 3, 5] },

  // Algorithm 6: 6→5, 4→3, 2→1 with fb on 6
  { operators: [
    { op: 6, x: 2, y: 0, modulates: [5], feedback: true },
    { op: 5, x: 2, y: 1 },
    { op: 4, x: 1, y: 0, modulates: [3] },
    { op: 3, x: 1, y: 1 },
    { op: 2, x: 0, y: 0, modulates: [1] },
    { op: 1, x: 0, y: 1 },
  ], carriers: [1, 3, 5] },

  // Algorithm 7: (6+5)→4→3→2→1
  { operators: [
    { op: 6, x: 2, y: 0, modulates: [4], feedback: true },
    { op: 5, x: 1, y: 0, modulates: [4] },
    { op: 4, x: 1.5, y: 1, modulates: [3] },
    { op: 3, x: 1.5, y: 2, modulates: [2] },
    { op: 2, x: 1.5, y: 3, modulates: [1] },
    { op: 1, x: 0.5, y: 3 },
  ], carriers: [1] },

  // Algorithm 8: 4→3→2→1, 6→5 (parallel carrier 5)
  { operators: [
    { op: 6, x: 2, y: 1, modulates: [5], feedback: true },
    { op: 5, x: 2, y: 2 },
    { op: 4, x: 0, y: 0, modulates: [3] },
    { op: 3, x: 0, y: 1, modulates: [2] },
    { op: 2, x: 0, y: 2, modulates: [1] },
    { op: 1, x: 0, y: 3 },
  ], carriers: [1, 5] },

  // Algorithm 9: 6→5, 4→3, 2→1 with cross-mod
  { operators: [
    { op: 6, x: 2, y: 0, modulates: [5] },
    { op: 5, x: 2, y: 1 },
    { op: 4, x: 1, y: 0, modulates: [3] },
    { op: 3, x: 1, y: 1, feedback: true },
    { op: 2, x: 0, y: 0, modulates: [1] },
    { op: 1, x: 0, y: 1 },
  ], carriers: [1, 3, 5] },

  // Algorithm 10: 3fb→2→1, 6→5→4
  { operators: [
    { op: 6, x: 2, y: 0, modulates: [5] },
    { op: 5, x: 2, y: 1, modulates: [4] },
    { op: 4, x: 2, y: 2 },
    { op: 3, x: 0, y: 0, modulates: [2], feedback: true },
    { op: 2, x: 0, y: 1, modulates: [1] },
    { op: 1, x: 0, y: 2 },
  ], carriers: [1, 4] },

  // Algorithm 11: 6→5→4, 3fb→2→1
  { operators: [
    { op: 6, x: 2, y: 0, modulates: [5], feedback: true },
    { op: 5, x: 2, y: 1, modulates: [4] },
    { op: 4, x: 2, y: 2 },
    { op: 3, x: 0, y: 0, modulates: [2] },
    { op: 2, x: 0, y: 1, modulates: [1] },
    { op: 1, x: 0, y: 2 },
  ], carriers: [1, 4] },

  // Algorithm 12: 6→5→4, 3→2→1 parallel
  { operators: [
    { op: 6, x: 2, y: 0, modulates: [5] },
    { op: 5, x: 2, y: 1, modulates: [4] },
    { op: 4, x: 2, y: 2 },
    { op: 3, x: 0, y: 0, modulates: [2], feedback: true },
    { op: 2, x: 0, y: 1, modulates: [1] },
    { op: 1, x: 0, y: 2 },
  ], carriers: [1, 4] },

  // Algorithm 13: 6→5→4, 3→2→1
  { operators: [
    { op: 6, x: 2, y: 0, modulates: [5], feedback: true },
    { op: 5, x: 2, y: 1, modulates: [4] },
    { op: 4, x: 2, y: 2 },
    { op: 3, x: 0, y: 0, modulates: [2] },
    { op: 2, x: 0, y: 1, modulates: [1] },
    { op: 1, x: 0, y: 2 },
  ], carriers: [1, 4] },

  // Algorithm 14: 6→5→4→3, 2→1
  { operators: [
    { op: 6, x: 2, y: 0, modulates: [5], feedback: true },
    { op: 5, x: 2, y: 1, modulates: [4] },
    { op: 4, x: 2, y: 2, modulates: [3] },
    { op: 3, x: 2, y: 3 },
    { op: 2, x: 0, y: 2, modulates: [1] },
    { op: 1, x: 0, y: 3 },
  ], carriers: [1, 3] },

  // Algorithm 15: 6→5→4→3, 2→1
  { operators: [
    { op: 6, x: 2, y: 0, modulates: [5] },
    { op: 5, x: 2, y: 1, modulates: [4] },
    { op: 4, x: 2, y: 2, modulates: [3] },
    { op: 3, x: 2, y: 3 },
    { op: 2, x: 0, y: 2, modulates: [1], feedback: true },
    { op: 1, x: 0, y: 3 },
  ], carriers: [1, 3] },

  // Algorithm 16: 6→(5,4,3)→2→1 branch
  { operators: [
    { op: 6, x: 2, y: 0, modulates: [5], feedback: true },
    { op: 5, x: 2, y: 1, modulates: [4, 3, 2] },
    { op: 4, x: 3, y: 2, modulates: [1] },
    { op: 3, x: 2, y: 2, modulates: [1] },
    { op: 2, x: 1, y: 2, modulates: [1] },
    { op: 1, x: 2, y: 3 },
  ], carriers: [1] },

  // Algorithm 17: 6→(5,4,3)→2→1
  { operators: [
    { op: 6, x: 2, y: 0, modulates: [5] },
    { op: 5, x: 2, y: 1, modulates: [4, 3, 2] },
    { op: 4, x: 3, y: 2, modulates: [1] },
    { op: 3, x: 2, y: 2, modulates: [1], feedback: true },
    { op: 2, x: 1, y: 2, modulates: [1] },
    { op: 1, x: 2, y: 3 },
  ], carriers: [1] },

  // Algorithm 18: 6→5→4, 6→3→2→1
  { operators: [
    { op: 6, x: 1, y: 0, modulates: [5, 3], feedback: true },
    { op: 5, x: 2, y: 1, modulates: [4] },
    { op: 4, x: 2, y: 2 },
    { op: 3, x: 0, y: 1, modulates: [2] },
    { op: 2, x: 0, y: 2, modulates: [1] },
    { op: 1, x: 0, y: 3 },
  ], carriers: [1, 4] },

  // Algorithm 19: 6→5→4, 3→(2,1)
  { operators: [
    { op: 6, x: 2, y: 0, modulates: [5], feedback: true },
    { op: 5, x: 2, y: 1, modulates: [4] },
    { op: 4, x: 2, y: 2 },
    { op: 3, x: 0, y: 1, modulates: [2, 1] },
    { op: 2, x: 0, y: 2 },
    { op: 1, x: 1, y: 2 },
  ], carriers: [1, 2, 4] },

  // Algorithm 20: 3→(2,1), 6→(5,4)
  { operators: [
    { op: 6, x: 2, y: 0, modulates: [5, 4] },
    { op: 5, x: 2, y: 1 },
    { op: 4, x: 3, y: 1 },
    { op: 3, x: 0, y: 0, modulates: [2, 1], feedback: true },
    { op: 2, x: 0, y: 1 },
    { op: 1, x: 1, y: 1 },
  ], carriers: [1, 2, 4, 5] },

  // Algorithm 21: 6→(5,4), 3→(2,1)
  { operators: [
    { op: 6, x: 2, y: 0, modulates: [5, 4], feedback: true },
    { op: 5, x: 2, y: 1 },
    { op: 4, x: 3, y: 1 },
    { op: 3, x: 0, y: 0, modulates: [2, 1] },
    { op: 2, x: 0, y: 1 },
    { op: 1, x: 1, y: 1 },
  ], carriers: [1, 2, 4, 5] },

  // Algorithm 22: 6→(5,4,3), 2→1
  { operators: [
    { op: 6, x: 2, y: 0, modulates: [5, 4, 3], feedback: true },
    { op: 5, x: 1, y: 1 },
    { op: 4, x: 2, y: 1 },
    { op: 3, x: 3, y: 1 },
    { op: 2, x: 0, y: 0, modulates: [1] },
    { op: 1, x: 0, y: 1 },
  ], carriers: [1, 3, 4, 5] },

  // Algorithm 23: 6→(5,4), 3→2, 1
  { operators: [
    { op: 6, x: 2, y: 0, modulates: [5, 4], feedback: true },
    { op: 5, x: 2, y: 1 },
    { op: 4, x: 3, y: 1 },
    { op: 3, x: 1, y: 0, modulates: [2] },
    { op: 2, x: 1, y: 1 },
    { op: 1, x: 0, y: 1 },
  ], carriers: [1, 2, 4, 5] },

  // Algorithm 24: 6→(5,4,3), 2, 1
  { operators: [
    { op: 6, x: 2, y: 0, modulates: [5, 4, 3], feedback: true },
    { op: 5, x: 1, y: 1 },
    { op: 4, x: 2, y: 1 },
    { op: 3, x: 3, y: 1 },
    { op: 2, x: 0, y: 0 },
    { op: 1, x: 0, y: 1 },
  ], carriers: [1, 2, 3, 4, 5] },

  // Algorithm 25: 6→(5,4), 3, 2, 1
  { operators: [
    { op: 6, x: 2, y: 0, modulates: [5, 4], feedback: true },
    { op: 5, x: 2, y: 1 },
    { op: 4, x: 3, y: 1 },
    { op: 3, x: 1, y: 1 },
    { op: 2, x: 0, y: 0 },
    { op: 1, x: 0, y: 1 },
  ], carriers: [1, 2, 3, 4, 5] },

  // Algorithm 26: 6→5, 3→2, 4, 1
  { operators: [
    { op: 6, x: 3, y: 0, modulates: [5], feedback: true },
    { op: 5, x: 3, y: 1 },
    { op: 4, x: 2, y: 1 },
    { op: 3, x: 1, y: 0, modulates: [2] },
    { op: 2, x: 1, y: 1 },
    { op: 1, x: 0, y: 1 },
  ], carriers: [1, 2, 4, 5] },

  // Algorithm 27: 6→5, 3→2, 4, 1
  { operators: [
    { op: 6, x: 3, y: 0, modulates: [5] },
    { op: 5, x: 3, y: 1 },
    { op: 4, x: 2, y: 1 },
    { op: 3, x: 1, y: 0, modulates: [2], feedback: true },
    { op: 2, x: 1, y: 1 },
    { op: 1, x: 0, y: 1 },
  ], carriers: [1, 2, 4, 5] },

  // Algorithm 28: 6→5→4, 3, 2, 1
  { operators: [
    { op: 6, x: 2, y: 0, modulates: [5], feedback: true },
    { op: 5, x: 2, y: 1, modulates: [4] },
    { op: 4, x: 2, y: 2 },
    { op: 3, x: 1, y: 2 },
    { op: 2, x: 0, y: 1 },
    { op: 1, x: 0, y: 2 },
  ], carriers: [1, 2, 3, 4] },

  // Algorithm 29: 6→5, 4, 3, 2, 1
  { operators: [
    { op: 6, x: 3, y: 0, modulates: [5], feedback: true },
    { op: 5, x: 3, y: 1 },
    { op: 4, x: 2, y: 1 },
    { op: 3, x: 1, y: 1 },
    { op: 2, x: 0, y: 0 },
    { op: 1, x: 0, y: 1 },
  ], carriers: [1, 2, 3, 4, 5] },

  // Algorithm 30: 6→5→4, 3, 2, 1
  { operators: [
    { op: 6, x: 2, y: 0, modulates: [5], feedback: true },
    { op: 5, x: 2, y: 1, modulates: [4] },
    { op: 4, x: 2, y: 2 },
    { op: 3, x: 1, y: 2 },
    { op: 2, x: 0, y: 2 },
    { op: 1, x: 0, y: 1 },
  ], carriers: [1, 2, 3, 4] },

  // Algorithm 31: 6→5, 4, 3, 2, 1
  { operators: [
    { op: 6, x: 3, y: 0, modulates: [5], feedback: true },
    { op: 5, x: 3, y: 1 },
    { op: 4, x: 2, y: 1 },
    { op: 3, x: 1, y: 1 },
    { op: 2, x: 0.5, y: 1 },
    { op: 1, x: 0, y: 1 },
  ], carriers: [1, 2, 3, 4, 5] },

  // Algorithm 32: 6, 5, 4, 3, 2, 1 (all additive)
  { operators: [
    { op: 6, x: 3, y: 0, feedback: true },
    { op: 5, x: 2.5, y: 0 },
    { op: 4, x: 2, y: 0 },
    { op: 3, x: 1.5, y: 0 },
    { op: 2, x: 1, y: 0 },
    { op: 1, x: 0.5, y: 0 },
  ], carriers: [1, 2, 3, 4, 5, 6] },
];

// LCD phosphor colors
const LCD_COLORS: Record<LcdColor, { bg: string; fg: string; glow: string; carrier: string; mod: string }> = {
  green: {
    bg: '#0a1f0a',
    fg: '#33ff66',
    glow: '#33ff6644',
    carrier: '#66ffaa',
    mod: '#33ff66',
  },
  amber: {
    bg: '#1a1200',
    fg: '#ffaa00',
    glow: '#ffaa0044',
    carrier: '#ffcc44',
    mod: '#ff8800',
  },
  blue: {
    bg: '#0a1520',
    fg: '#44aaff',
    glow: '#44aaff44',
    carrier: '#66ccff',
    mod: '#3388dd',
  },
  white: {
    bg: '#1a1a1a',
    fg: '#ffffff',
    glow: '#ffffff44',
    carrier: '#ffffff',
    mod: '#aaaaaa',
  },
};

interface Dx7AlgorithmDisplayProps {
  algorithm: number;  // 0-31
  width?: number;
  height?: number;
  color?: LcdColor;
  showNumber?: boolean;
  interactive?: boolean;
  onSelect?: (algo: number) => void;
}

export function Dx7AlgorithmDisplay({
  algorithm,
  width = 180,
  height = 140,
  color = 'green',
  showNumber = true,
  interactive = false,
  onSelect,
}: Dx7AlgorithmDisplayProps) {
  const layout = DX7_ALGORITHM_LAYOUTS[algorithm];
  const colors = LCD_COLORS[color];

  // Calculate grid dimensions
  const padding = 16;
  const boxSize = 22;
  const boxSpacing = 32;

  // Find bounds of the layout
  const maxX = Math.max(...layout.operators.map(op => op.x));
  const maxY = Math.max(...layout.operators.map(op => op.y));

  // Scale to fit
  const scaleX = (width - padding * 2) / ((maxX + 1) * boxSpacing);
  const scaleY = (height - padding * 2 - (showNumber ? 20 : 0)) / ((maxY + 1) * boxSpacing);
  const scale = Math.min(scaleX, scaleY, 1);

  // Get position for an operator
  const getPos = (op: OperatorPosition) => ({
    x: padding + op.x * boxSpacing * scale + boxSize / 2,
    y: padding + op.y * boxSpacing * scale + boxSize / 2 + (showNumber ? 20 : 0),
  });

  return (
    <div
      onClick={() => interactive && onSelect?.(algorithm)}
      style={{
        width,
        height,
        background: colors.bg,
        borderRadius: 4,
        border: `1px solid ${colors.fg}33`,
        position: 'relative',
        cursor: interactive ? 'pointer' : 'default',
        boxShadow: `inset 0 0 20px ${colors.bg}, 0 0 10px ${colors.glow}`,
        overflow: 'hidden',
      }}
    >
      {/* Algorithm number */}
      {showNumber && (
        <div
          style={{
            position: 'absolute',
            top: 6,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 11,
            fontWeight: 'bold',
            color: colors.fg,
            textShadow: `0 0 6px ${colors.fg}`,
            fontFamily: 'monospace',
          }}
        >
          ALG {algorithm + 1}
        </div>
      )}

      {/* SVG for connections and operators */}
      <svg
        width={width}
        height={height}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {/* Draw connections */}
        {layout.operators.map((op) => {
          if (!op.modulates) return null;
          const from = getPos(op);
          return op.modulates.map((targetOp) => {
            const target = layout.operators.find((o) => o.op === targetOp);
            if (!target) return null;
            const to = getPos(target);
            return (
              <line
                key={`${op.op}-${targetOp}`}
                x1={from.x}
                y1={from.y + boxSize * scale / 2}
                x2={to.x}
                y2={to.y - boxSize * scale / 2}
                stroke={colors.mod}
                strokeWidth={2 * scale}
                opacity={0.8}
              />
            );
          });
        })}

        {/* Draw feedback loops */}
        {layout.operators
          .filter((op) => op.feedback)
          .map((op) => {
            const pos = getPos(op);
            const loopRadius = 8 * scale;
            return (
              <path
                key={`fb-${op.op}`}
                d={`M ${pos.x + boxSize * scale / 2} ${pos.y}
                    C ${pos.x + boxSize * scale / 2 + loopRadius * 2} ${pos.y - loopRadius}
                      ${pos.x + boxSize * scale / 2 + loopRadius * 2} ${pos.y + loopRadius}
                      ${pos.x + boxSize * scale / 2} ${pos.y}`}
                fill="none"
                stroke={colors.fg}
                strokeWidth={1.5 * scale}
                opacity={0.7}
              />
            );
          })}

        {/* Draw operators */}
        {layout.operators.map((op) => {
          const pos = getPos(op);
          const isCarrier = layout.carriers.includes(op.op);
          const size = boxSize * scale;

          return (
            <g key={op.op}>
              {/* Glow effect for carriers */}
              {isCarrier && (
                <rect
                  x={pos.x - size / 2 - 2}
                  y={pos.y - size / 2 - 2}
                  width={size + 4}
                  height={size + 4}
                  fill={colors.carrier}
                  opacity={0.2}
                  rx={3}
                />
              )}

              {/* Operator box */}
              <rect
                x={pos.x - size / 2}
                y={pos.y - size / 2}
                width={size}
                height={size}
                fill={colors.bg}
                stroke={isCarrier ? colors.carrier : colors.mod}
                strokeWidth={isCarrier ? 2 : 1.5}
                rx={2}
              />

              {/* Operator number */}
              <text
                x={pos.x}
                y={pos.y + 4 * scale}
                textAnchor="middle"
                fontSize={12 * scale}
                fontWeight="bold"
                fontFamily="monospace"
                fill={isCarrier ? colors.carrier : colors.fg}
                style={{ textShadow: `0 0 4px ${colors.fg}` }}
              >
                {op.op}
              </text>
            </g>
          );
        })}

        {/* Output symbol (ground/speaker) for carriers */}
        {layout.carriers.length > 0 && (
          <g>
            {layout.carriers.map((carrierId) => {
              const carrier = layout.operators.find((op) => op.op === carrierId);
              if (!carrier) return null;
              const pos = getPos(carrier);
              const y = pos.y + boxSize * scale / 2 + 6 * scale;

              return (
                <g key={`out-${carrierId}`}>
                  <line
                    x1={pos.x}
                    y1={pos.y + boxSize * scale / 2}
                    x2={pos.x}
                    y2={y}
                    stroke={colors.carrier}
                    strokeWidth={1.5 * scale}
                  />
                  <line
                    x1={pos.x - 6 * scale}
                    y1={y}
                    x2={pos.x + 6 * scale}
                    y2={y}
                    stroke={colors.carrier}
                    strokeWidth={2 * scale}
                  />
                </g>
              );
            })}
          </g>
        )}
      </svg>
    </div>
  );
}

// Algorithm grid selector showing all 32 algorithms
interface Dx7AlgorithmGridProps {
  selected: number;  // 0-31
  onSelect: (algo: number) => void;
  color?: LcdColor;
}

export function Dx7AlgorithmGrid({ selected, onSelect, color = 'green' }: Dx7AlgorithmGridProps) {
  const colors = LCD_COLORS[color];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gap: 4,
        padding: 8,
        background: colors.bg,
        borderRadius: 6,
        border: `1px solid ${colors.fg}44`,
        boxShadow: `inset 0 0 30px ${colors.bg}`,
      }}
    >
      {Array.from({ length: 32 }, (_, i) => (
        <div
          key={i}
          onClick={() => onSelect(i)}
          style={{
            width: 32,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 'bold',
            fontFamily: 'monospace',
            color: selected === i ? '#000' : colors.fg,
            background: selected === i ? colors.fg : 'transparent',
            border: `1px solid ${colors.fg}66`,
            borderRadius: 3,
            cursor: 'pointer',
            textShadow: selected === i ? 'none' : `0 0 4px ${colors.fg}`,
            transition: 'all 0.1s',
          }}
        >
          {i + 1}
        </div>
      ))}
    </div>
  );
}
