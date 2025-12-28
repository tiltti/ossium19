/**
 * DX7 Algorithm Visual Display
 *
 * Renders the 32 FM algorithms as ball diagrams with clear
 * modulator/carrier distinction and level-based layout.
 */

import { LcdColor } from './LcdScreen';

// Operator colors matching the FM panel
const OP_COLORS = [
  '#ff6b6b',  // OP1 - Red
  '#ffd93d',  // OP2 - Yellow
  '#6bcb77',  // OP3 - Green
  '#4d96ff',  // OP4 - Blue
  '#c792ea',  // OP5 - Purple
  '#ff9f43',  // OP6 - Orange
];

// Algorithm definition: which ops modulate which, carriers, feedback
interface FmAlgorithm {
  // For each operator (0-5), list which operators it modulates (1-based indices)
  mod: number[][];  // mod[0] = operators that op1 modulates
  carriers: number[];  // 1-based operator numbers
  feedback: number;    // 1-based operator number, 0 = none
}

// All 32 FM algorithms (matching Rust/JUCE implementation)
const FM_ALGORITHMS: FmAlgorithm[] = [
  // ALG 1: Serial 1→2→3→4→5→6
  { mod: [[2], [3], [4], [5], [6], []], carriers: [6], feedback: 1 },
  // ALG 2: 1fb, 2→3→4→5→6
  { mod: [[], [3], [4], [5], [6], []], carriers: [6], feedback: 2 },
  // ALG 3: 1→3, 2→3→4→5→6
  { mod: [[3], [3], [4], [5], [6], []], carriers: [6], feedback: 3 },
  // ALG 4: 1→2→3→4→5→6 with FB on 4
  { mod: [[2], [3], [4], [5], [6], []], carriers: [6], feedback: 4 },
  // ALG 5: 1→2, 3→4, 5→6 (parallel pairs)
  { mod: [[2], [], [4], [], [6], []], carriers: [2, 4, 6], feedback: 1 },
  // ALG 6: 1→2, 3→4, 5→6 with FB on 5
  { mod: [[2], [], [4], [], [6], []], carriers: [2, 4, 6], feedback: 5 },
  // ALG 7: 1→2, 3→(4,5,6)
  { mod: [[2], [], [4, 5, 6], [], [], []], carriers: [2, 4, 5, 6], feedback: 1 },
  // ALG 8: 1→2, 3→4→(5,6)
  { mod: [[2], [], [4], [5, 6], [], []], carriers: [2, 5, 6], feedback: 4 },
  // ALG 9: 1→2, 3→4→5→6 with FB on 2
  { mod: [[2], [], [4], [5], [6], []], carriers: [2, 6], feedback: 2 },
  // ALG 10: 3→(1,2), 4→5→6
  { mod: [[], [], [1, 2], [5], [6], []], carriers: [1, 2, 6], feedback: 3 },
  // ALG 11: 1→2, 3→4→5→6 with FB on 3
  { mod: [[2], [], [4], [5], [6], []], carriers: [2, 6], feedback: 3 },
  // ALG 12: 1→2, 3→4, 5→6 with FB on 2
  { mod: [[2], [], [4], [], [6], []], carriers: [2, 4, 6], feedback: 2 },
  // ALG 13: 1→2, 3→(4,5,6) with FB on 3
  { mod: [[2], [], [4, 5, 6], [], [], []], carriers: [2, 4, 5, 6], feedback: 3 },
  // ALG 14: 1→2→(3,4,5,6)
  { mod: [[2], [3, 4, 5, 6], [], [], [], []], carriers: [3, 4, 5, 6], feedback: 1 },
  // ALG 15: 1→2, 3→4→(5,6)
  { mod: [[2], [], [4], [5, 6], [], []], carriers: [2, 5, 6], feedback: 1 },
  // ALG 16: 1→(2,3,4,5,6)
  { mod: [[2, 3, 4, 5, 6], [], [], [], [], []], carriers: [2, 3, 4, 5, 6], feedback: 1 },
  // ALG 17: 1→(2,3), 4→5, 6
  { mod: [[2, 3], [], [], [5], [], []], carriers: [2, 3, 5, 6], feedback: 1 },
  // ALG 18: 1→2→3, 4→(5,6)
  { mod: [[2], [3], [], [5, 6], [], []], carriers: [3, 5, 6], feedback: 3 },
  // ALG 19: 1→2, 3→(4,5), 6
  { mod: [[2], [], [4, 5], [], [], []], carriers: [2, 4, 5, 6], feedback: 1 },
  // ALG 20: 1→2, 3→4, 5, 6
  { mod: [[2], [], [4], [], [], []], carriers: [2, 4, 5, 6], feedback: 3 },
  // ALG 21: 1→2, 3, 4, 5, 6
  { mod: [[2], [], [], [], [], []], carriers: [2, 3, 4, 5, 6], feedback: 3 },
  // ALG 22: 1→(2,3,4,5), 6
  { mod: [[2, 3, 4, 5], [], [], [], [], []], carriers: [2, 3, 4, 5, 6], feedback: 1 },
  // ALG 23: 1→2, 3→(4,5), 6
  { mod: [[2], [], [4, 5], [], [], []], carriers: [2, 4, 5, 6], feedback: 3 },
  // ALG 24: 1→2, 3→4, 5, 6 with FB on 6
  { mod: [[2], [], [4], [], [], []], carriers: [2, 4, 5, 6], feedback: 6 },
  // ALG 25: 1→2, 3, 4, 5, 6 with FB on 6
  { mod: [[2], [], [], [], [], []], carriers: [2, 3, 4, 5, 6], feedback: 6 },
  // ALG 26: 3→(1,2), 6→(4,5)
  { mod: [[], [], [1, 2], [], [], [4, 5]], carriers: [1, 2, 4, 5], feedback: 6 },
  // ALG 27: 3→(1,2), 5→4, 6
  { mod: [[], [], [1, 2], [], [4], []], carriers: [1, 2, 4, 6], feedback: 5 },
  // ALG 28: 1→2→3, 4, 5→6
  { mod: [[2], [3], [], [], [6], []], carriers: [3, 4, 6], feedback: 1 },
  // ALG 29: 1→2, 3, 4→5, 6
  { mod: [[2], [], [], [5], [], []], carriers: [2, 3, 5, 6], feedback: 1 },
  // ALG 30: 1→2→3, 4→5, 6
  { mod: [[2], [3], [], [5], [], []], carriers: [3, 5, 6], feedback: 1 },
  // ALG 31: 1, 2, 3, 4, 5→6
  { mod: [[], [], [], [], [6], []], carriers: [1, 2, 3, 4, 6], feedback: 6 },
  // ALG 32: All parallel (no modulation)
  { mod: [[], [], [], [], [], []], carriers: [1, 2, 3, 4, 5, 6], feedback: 6 },
];

// Build text description for algorithm
function buildDescription(algo: FmAlgorithm): string {
  // Build MOD string
  const modParts: string[] = [];
  for (let i = 0; i < 6; i++) {
    if (algo.mod[i].length > 0) {
      const targets = algo.mod[i];
      if (targets.length === 1) {
        modParts.push(`${i + 1}→${targets[0]}`);
      } else {
        modParts.push(`${i + 1}→(${targets.join(',')})`);
      }
    }
  }

  const parts: string[] = [];
  if (modParts.length > 0) {
    parts.push(modParts.join(', '));
  }
  parts.push(`OUT: ${algo.carriers.join(',')}`);
  if (algo.feedback > 0) {
    parts.push(`FB: ${algo.feedback}`);
  }

  return parts.join('  ');
}

// Calculate layout positions for operators using level-based approach
interface OpLayout {
  op: number;  // 1-6
  x: number;   // pixel position
  y: number;   // pixel position
  isCarrier: boolean;
  hasFeedback: boolean;
}

function calculateLayout(algo: FmAlgorithm, width: number, height: number): OpLayout[] {
  const carriers = new Set(algo.carriers);

  // Calculate level for each operator (distance from being a carrier)
  // Carriers are level 0, their direct modulators are level 1, etc.
  const level: number[] = Array(6).fill(-1);

  // Start with carriers at level 0
  for (const c of algo.carriers) {
    level[c - 1] = 0;
  }

  // Iteratively assign levels to modulators
  let changed = true;
  let iterations = 0;
  while (changed && iterations < 10) {
    changed = false;
    iterations++;
    for (let i = 0; i < 6; i++) {
      if (level[i] >= 0) continue; // already assigned

      // Find if we modulate anyone with a known level
      for (const target of algo.mod[i]) {
        const targetLevel = level[target - 1];
        if (targetLevel >= 0) {
          const newLevel = targetLevel + 1;
          if (level[i] < 0 || newLevel > level[i]) {
            level[i] = newLevel;
            changed = true;
          }
        }
      }
    }
  }

  // Any unassigned operators (shouldn't happen, but safety)
  for (let i = 0; i < 6; i++) {
    if (level[i] < 0) level[i] = 0;
  }

  // Find max level
  const maxLevel = Math.max(...level);

  // Group operators by level
  const byLevel: number[][] = [];
  for (let l = 0; l <= maxLevel; l++) {
    byLevel[l] = [];
  }
  for (let i = 0; i < 6; i++) {
    byLevel[level[i]].push(i + 1);
  }

  // Sort operators within each level for consistent display
  for (const ops of byLevel) {
    ops.sort((a, b) => a - b);
  }

  // Calculate positions
  const layouts: OpLayout[] = [];
  const paddingX = 30;
  const paddingTop = 40;  // For title
  const paddingBottom = 25;  // For output line only
  const availableHeight = height - paddingTop - paddingBottom;
  const availableWidth = width - paddingX * 2;

  const minBallSpacing = 38;  // Minimum vertical space between balls

  // Check if we have a long single chain that needs zigzag layout
  const needsZigzag = maxLevel >= 4 && carriers.size === 1;

  if (needsZigzag) {
    // Zigzag layout for long chains: split into 2 rows
    // Top row: first half of chain (left to right)
    // Bottom row: second half of chain (right to left, connecting to top)
    const midLevel = Math.ceil(maxLevel / 2);
    const topRowY = paddingTop + availableHeight * 0.25;
    const bottomRowY = paddingTop + availableHeight * 0.75;

    // Count ops in each row
    let topRowCount = 0;
    let bottomRowCount = 0;
    for (let lvl = 0; lvl <= maxLevel; lvl++) {
      if (lvl > midLevel) topRowCount += byLevel[lvl].length;
      else bottomRowCount += byLevel[lvl].length;
    }

    // Position operators
    let topIdx = 0;
    let bottomIdx = 0;

    for (let lvl = maxLevel; lvl >= 0; lvl--) {
      const ops = byLevel[lvl];
      if (ops.length === 0) continue;

      if (lvl > midLevel) {
        // Top row - left to right
        const spacing = availableWidth / (topRowCount + 1);
        for (const op of ops) {
          const x = paddingX + spacing * (topIdx + 1);
          layouts.push({
            op,
            x,
            y: topRowY,
            isCarrier: carriers.has(op),
            hasFeedback: algo.feedback === op,
          });
          topIdx++;
        }
      } else {
        // Bottom row - continue from where top row ended, going right
        const spacing = availableWidth / (bottomRowCount + 1);
        for (const op of ops) {
          const x = paddingX + spacing * (bottomIdx + 1);
          layouts.push({
            op,
            x,
            y: bottomRowY,
            isCarrier: carriers.has(op),
            hasFeedback: algo.feedback === op,
          });
          bottomIdx++;
        }
      }
    }
  } else {
    // Standard level-based layout (works well for short chains)
    const numRows = maxLevel + 1;
    const idealRowHeight = availableHeight / numRows;
    const rowHeight = Math.max(idealRowHeight, minBallSpacing);

    // Adjust starting Y if rows would overflow
    const totalRowsHeight = rowHeight * numRows;
    const startY = totalRowsHeight > availableHeight
      ? paddingTop
      : paddingTop + (availableHeight - totalRowsHeight) / 2 + rowHeight / 2;

    // Position operators
    for (let lvl = 0; lvl <= maxLevel; lvl++) {
      const ops = byLevel[lvl];
      if (ops.length === 0) continue;

      // Y position: higher levels at top, carriers (level 0) at bottom
      const y = startY + (maxLevel - lvl) * rowHeight;

      // X positions: spread evenly across width
      const spacing = availableWidth / (ops.length + 1);

      for (let i = 0; i < ops.length; i++) {
        const op = ops[i];
        const x = paddingX + spacing * (i + 1);

        layouts.push({
          op,
          x,
          y,
          isCarrier: carriers.has(op),
          hasFeedback: algo.feedback === op,
        });
      }
    }
  }

  return layouts;
}

// LCD phosphor colors
const LCD_COLORS: Record<LcdColor, { bg: string; fg: string; glow: string }> = {
  green: { bg: '#0a1f0a', fg: '#33ff66', glow: '#33ff6644' },
  amber: { bg: '#1a1200', fg: '#ffaa00', glow: '#ffaa0044' },
  blue: { bg: '#0a1520', fg: '#44aaff', glow: '#44aaff44' },
  white: { bg: '#1a1a1a', fg: '#ffffff', glow: '#ffffff44' },
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
  width = 280,
  height = 200,
  color = 'amber',
  showNumber = true,
  interactive = false,
  onSelect,
}: Dx7AlgorithmDisplayProps) {
  const algo = FM_ALGORITHMS[algorithm];
  const colors = LCD_COLORS[color];
  const layout = calculateLayout(algo, width, height);

  const radius = Math.min(16, Math.max(10, width / 20));
  const outputY = height - 18;  // Closer to bottom since no description text

  // Build position lookup for drawing connections
  const posMap = new Map<number, { x: number; y: number }>();
  for (const l of layout) {
    posMap.set(l.op, { x: l.x, y: l.y });
  }

  return (
    <div
      onClick={() => interactive && onSelect?.(algorithm)}
      style={{
        width,
        height,
        background: colors.bg,
        borderRadius: 8,
        border: `1px solid ${colors.fg}33`,
        position: 'relative',
        cursor: interactive ? 'pointer' : 'default',
        boxShadow: `inset 0 0 30px ${colors.bg}, 0 0 10px ${colors.glow}`,
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
            fontSize: 16,
            fontWeight: 'bold',
            color: colors.fg,
            textShadow: `0 0 10px ${colors.fg}`,
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
        {/* Draw modulation connections */}
        {layout.map((fromOp) => {
          const targets = algo.mod[fromOp.op - 1];
          if (targets.length === 0) return null;

          const from = posMap.get(fromOp.op)!;

          return targets.map((targetOp) => {
            const to = posMap.get(targetOp);
            if (!to) return null;

            // Calculate connection points at circle edges
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const normX = dx / dist;
            const normY = dy / dist;

            const x1 = from.x + normX * (radius + 2);
            const y1 = from.y + normY * (radius + 2);
            const x2 = to.x - normX * (radius + 6);
            const y2 = to.y - normY * (radius + 6);

            // Arrow head
            const arrowSize = 6;
            const angle = Math.atan2(dy, dx);
            const arrowAngle = 0.5;

            return (
              <g key={`conn-${fromOp.op}-${targetOp}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#888888"
                  strokeWidth={2}
                  opacity={0.8}
                />
                {/* Arrow head */}
                <polygon
                  points={`
                    ${x2},${y2}
                    ${x2 - arrowSize * Math.cos(angle - arrowAngle)},${y2 - arrowSize * Math.sin(angle - arrowAngle)}
                    ${x2 - arrowSize * Math.cos(angle + arrowAngle)},${y2 - arrowSize * Math.sin(angle + arrowAngle)}
                  `}
                  fill="#888888"
                />
              </g>
            );
          });
        })}

        {/* Draw feedback loops */}
        {layout
          .filter((l) => l.hasFeedback)
          .map((l) => {
            const loopRadius = radius * 0.7;
            return (
              <g key={`fb-${l.op}`}>
                <path
                  d={`M ${l.x + radius + 2} ${l.y - 4}
                      C ${l.x + radius + loopRadius * 2} ${l.y - loopRadius * 1.5}
                        ${l.x + radius + loopRadius * 2} ${l.y + loopRadius * 1.5}
                        ${l.x + radius + 2} ${l.y + 4}`}
                  fill="none"
                  stroke="#ffaa00"
                  strokeWidth={2}
                  opacity={0.9}
                />
                {/* Small arrow */}
                <polygon
                  points={`
                    ${l.x + radius + 2},${l.y + 4}
                    ${l.x + radius + 8},${l.y + 8}
                    ${l.x + radius + 8},${l.y}
                  `}
                  fill="#ffaa00"
                />
              </g>
            );
          })}

        {/* Draw output line */}
        <line
          x1={30}
          y1={outputY}
          x2={width - 30}
          y2={outputY}
          stroke="#555555"
          strokeWidth={3}
        />
        <text
          x={width / 2}
          y={outputY + 14}
          textAnchor="middle"
          fontSize={10}
          fill="#666666"
          fontFamily="monospace"
        >
          OUTPUT
        </text>

        {/* Draw carrier output lines to output bar */}
        {layout
          .filter((l) => l.isCarrier)
          .map((l) => (
            <line
              key={`out-${l.op}`}
              x1={l.x}
              y1={l.y + radius + 2}
              x2={l.x}
              y2={outputY - 2}
              stroke={OP_COLORS[l.op - 1]}
              strokeWidth={2}
              opacity={0.6}
            />
          ))}

        {/* Draw operator balls */}
        {layout.map((l) => {
          const opColor = OP_COLORS[l.op - 1];

          return (
            <g key={`op-${l.op}`}>
              {l.isCarrier ? (
                // Filled ball for carrier
                <>
                  {/* Outer glow */}
                  <circle
                    cx={l.x}
                    cy={l.y}
                    r={radius + 3}
                    fill={opColor}
                    opacity={0.25}
                  />
                  {/* Main fill */}
                  <circle
                    cx={l.x}
                    cy={l.y}
                    r={radius}
                    fill={opColor}
                  />
                  {/* White border */}
                  <circle
                    cx={l.x}
                    cy={l.y}
                    r={radius}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth={2}
                    opacity={0.6}
                  />
                </>
              ) : (
                // Outline ball for modulator
                <>
                  {/* Semi-transparent fill */}
                  <circle
                    cx={l.x}
                    cy={l.y}
                    r={radius}
                    fill={opColor}
                    opacity={0.2}
                  />
                  {/* Colored border */}
                  <circle
                    cx={l.x}
                    cy={l.y}
                    r={radius}
                    fill="none"
                    stroke={opColor}
                    strokeWidth={2.5}
                  />
                </>
              )}

              {/* Operator number */}
              <text
                x={l.x}
                y={l.y + 5}
                textAnchor="middle"
                fontSize={radius * 0.9}
                fontWeight="bold"
                fontFamily="monospace"
                fill={l.isCarrier ? '#000000' : opColor}
              >
                {l.op}
              </text>
            </g>
          );
        })}
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

export function Dx7AlgorithmGrid({ selected, onSelect, color = 'amber' }: Dx7AlgorithmGridProps) {
  const colors = LCD_COLORS[color];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(16, 1fr)',
        gap: 2,
        padding: 4,
        background: colors.bg,
        borderRadius: 4,
        border: `1px solid ${colors.fg}44`,
      }}
    >
      {Array.from({ length: 32 }, (_, i) => (
        <div
          key={i}
          onClick={() => onSelect(i)}
          style={{
            width: 26,
            height: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 'bold',
            fontFamily: 'monospace',
            color: selected === i ? '#000' : colors.fg,
            background: selected === i ? colors.fg : 'transparent',
            border: `1px solid ${colors.fg}66`,
            borderRadius: 2,
            cursor: 'pointer',
            transition: 'all 0.1s',
          }}
        >
          {i + 1}
        </div>
      ))}
    </div>
  );
}
