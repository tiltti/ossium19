// Signal Routing Diagram - Visual representation of oscillator and filter signal flow
import { SynthParams } from '../audio/engine';

interface SignalRoutingProps {
  params: SynthParams;
  width?: number;
  height?: number;
  accentColor?: string;
}

// Waveform icons
const waveformPaths: Record<string, string> = {
  sine: 'M0,12 Q6,0 12,12 Q18,24 24,12',
  saw: 'M0,22 L12,2 L12,22 L24,2',
  square: 'M0,22 L0,2 L12,2 L12,22 L24,22 L24,2',
  triangle: 'M0,22 L6,2 L18,22 L24,2',
};

export function SignalRouting({
  params,
  width = 620,
  height = 135,
  accentColor = '#64c8ff',
}: SignalRoutingProps) {
  const fmColor = '#ff8c42';
  const filterColor = '#a080ff';

  const osc1Active = params.osc1Level > 0;
  const osc2Active = params.osc2Level > 0;
  const subActive = params.subLevel > 0;
  const noiseActive = params.noiseLevel > 0;
  const fmActive = params.fmAmount > 0;
  const anyActive = osc1Active || osc2Active || subActive || noiseActive;

  // Layout - all blocks same height for clean look
  const blockH = 58;
  const blockY = 24; // Space for OSC1 arc above
  const centerY = blockY + blockH / 2;

  // Block positions - more spacing
  const osc1X = 12;
  const osc1W = 72;
  const osc2X = 100;
  const osc2W = 72;
  const mixX = 210;
  const mixW = 52;
  const filterX = 300;
  const filterW = 95;
  const vcaX = 430;
  const vcaW = 52;

  return (
    <div
      style={{
        background: '#0a0a0a',
        borderRadius: 6,
        padding: 8,
        border: '1px solid #333',
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Title */}
        <text x={10} y={14} fill={accentColor} fontSize={10} fontWeight="bold" letterSpacing={1}>
          SIGNAL FLOW
        </text>

        {/* FM arc from OSC2 to OSC1 - goes BELOW with dashed line */}
        {fmActive && (
          <g>
            <path
              d={`M${osc2X + osc2W / 2},${blockY + blockH + 4}
                  C${osc2X + osc2W / 2},${blockY + blockH + 22} ${osc1X + osc1W / 2},${blockY + blockH + 22} ${osc1X + osc1W / 2},${blockY + blockH + 4}`}
              fill="none"
              stroke={fmColor}
              strokeWidth={2}
              strokeDasharray="4,3"
            />
            {/* Arrow pointing up to OSC1 */}
            <polygon
              points={`${osc1X + osc1W / 2},${blockY + blockH + 2} ${osc1X + osc1W / 2 - 4},${blockY + blockH + 8} ${osc1X + osc1W / 2 + 4},${blockY + blockH + 8}`}
              fill={fmColor}
            />
            {/* FM label - positioned on the arc below */}
            <text
              x={(osc1X + osc1W / 2 + osc2X + osc2W / 2) / 2}
              y={blockY + blockH + 26}
              textAnchor="middle"
              fill={fmColor}
              fontSize={9}
              fontWeight="bold"
            >
              FM {params.fmRatio}:1
            </text>
          </g>
        )}

        {/* OSC 1 */}
        <g transform={`translate(${osc1X}, ${blockY})`} opacity={osc1Active ? 1 : 0.35}>
          <rect width={osc1W} height={blockH} rx={4} fill="#0d1418" stroke={osc1Active ? accentColor : '#333'} strokeWidth={1.5} />
          <text x={osc1W / 2} y={14} textAnchor="middle" fill={accentColor} fontSize={9} fontWeight="bold">OSC 1</text>
          <g transform={`translate(${(osc1W - 24) / 2}, 20)`}>
            <path d={waveformPaths[params.osc1Waveform] || waveformPaths.sine} fill="none" stroke={accentColor} strokeWidth={1.5} />
          </g>
          <rect x={6} y={blockH - 12} width={osc1W - 12} height={4} rx={2} fill="#1a1a1a" />
          <rect x={6} y={blockH - 12} width={(osc1W - 12) * params.osc1Level} height={4} rx={2} fill={accentColor} />
        </g>

        {/* OSC 2 */}
        <g transform={`translate(${osc2X}, ${blockY})`} opacity={osc2Active ? 1 : 0.35}>
          <rect width={osc2W} height={blockH} rx={4} fill="#0d1418" stroke={osc2Active ? accentColor : '#333'} strokeWidth={1.5} />
          <text x={osc2W / 2} y={14} textAnchor="middle" fill={accentColor} fontSize={9} fontWeight="bold">OSC 2</text>
          <g transform={`translate(${(osc2W - 24) / 2}, 20)`}>
            <path d={waveformPaths[params.osc2Waveform] || waveformPaths.sine} fill="none" stroke={accentColor} strokeWidth={1.5} />
          </g>
          <rect x={6} y={blockH - 12} width={osc2W - 12} height={4} rx={2} fill="#1a1a1a" />
          <rect x={6} y={blockH - 12} width={(osc2W - 12) * params.osc2Level} height={4} rx={2} fill={accentColor} />
        </g>

        {/* Audio lines from OSCs to MIX */}
        {(osc1Active || osc2Active) && (
          <g>
            {/* OSC1 line - curves ABOVE OSC2 */}
            {osc1Active && (
              <path
                d={`M${osc1X + osc1W},${centerY - 8}
                    C${osc1X + osc1W + 20},${centerY - 8} ${osc1X + osc1W + 20},${blockY - 12} ${osc2X + osc2W / 2},${blockY - 12}
                    L${mixX - 20},${blockY - 12}
                    C${mixX - 10},${blockY - 12} ${mixX - 10},${centerY - 8} ${mixX - 15},${centerY - 8}`}
                fill="none"
                stroke={accentColor}
                strokeWidth={2}
                opacity={0.8}
              />
            )}
            {/* OSC2 line - straight to mix */}
            {osc2Active && (
              <line x1={osc2X + osc2W} y1={centerY} x2={mixX - 15} y2={centerY + 8} stroke={accentColor} strokeWidth={2} opacity={0.8} />
            )}
            {/* Merge point */}
            <path
              d={`M${mixX - 15},${centerY - 10} L${mixX - 15},${centerY + 10} L${mixX},${centerY} Z`}
              fill="none"
              stroke={accentColor}
              strokeWidth={2}
              opacity={0.8}
            />
          </g>
        )}

        {/* MIX */}
        <g transform={`translate(${mixX}, ${blockY})`} opacity={anyActive ? 1 : 0.35}>
          <rect width={mixW} height={blockH} rx={4} fill="#0d1418" stroke={anyActive ? accentColor : '#333'} strokeWidth={1.5} />
          <text x={mixW / 2} y={14} textAnchor="middle" fill={accentColor} fontSize={9} fontWeight="bold">MIX</text>
          {/* Level indicators */}
          {[
            { y: 20, value: params.osc1Level, active: osc1Active, label: '1' },
            { y: 32, value: params.osc2Level, active: osc2Active, label: '2' },
            { y: 44, value: params.subLevel, active: subActive, label: 'S' },
          ].map((item) => (
            <g key={item.label} opacity={item.active ? 1 : 0.3}>
              <text x={6} y={item.y + 6} fill="#666" fontSize={7}>{item.label}</text>
              <rect x={14} y={item.y} width={30} height={5} rx={1} fill="#1a1a1a" />
              <rect x={14} y={item.y} width={30 * item.value} height={5} rx={1} fill={item.active ? accentColor : '#444'} />
            </g>
          ))}
        </g>

        {/* Arrow MIX to FILTER */}
        {anyActive && (
          <g>
            <line x1={mixX + mixW} y1={centerY} x2={filterX - 6} y2={centerY} stroke={accentColor} strokeWidth={2} opacity={0.8} />
            <polygon points={`${filterX},${centerY} ${filterX - 6},${centerY - 4} ${filterX - 6},${centerY + 4}`} fill={accentColor} opacity={0.8} />
          </g>
        )}

        {/* FILTER */}
        <g transform={`translate(${filterX}, ${blockY})`} opacity={anyActive ? 1 : 0.35}>
          <rect width={filterW} height={blockH} rx={4} fill="#0d1418" stroke={filterColor} strokeWidth={1.5} />
          <text x={filterW / 2} y={14} textAnchor="middle" fill={filterColor} fontSize={9} fontWeight="bold">FILTER</text>
          {/* Filter curve */}
          <g transform="translate(8, 20)">
            <rect width={filterW - 16} height={24} rx={2} fill="#0a0a10" />
            {(() => {
              const norm = Math.log(params.filterCutoff / 20) / Math.log(20000 / 20);
              const w = filterW - 16;
              const cx = norm * w * 0.75;
              const peak = 20 - params.filterResonance * 16;
              return <path d={`M0,20 L${cx},20 Q${cx + 4},${peak} ${cx + 10},22 L${w},24`} fill="none" stroke={filterColor} strokeWidth={1.5} />;
            })()}
          </g>
          <text x={filterW / 2} y={blockH - 4} textAnchor="middle" fill="#666" fontSize={7}>
            {params.filterCutoff >= 1000 ? `${(params.filterCutoff / 1000).toFixed(1)}k` : Math.round(params.filterCutoff)}Hz
          </text>
        </g>

        {/* Arrow FILTER to VCA */}
        {anyActive && (
          <g>
            <line x1={filterX + filterW} y1={centerY} x2={vcaX - 6} y2={centerY} stroke={filterColor} strokeWidth={2} opacity={0.8} />
            <polygon points={`${vcaX},${centerY} ${vcaX - 6},${centerY - 4} ${vcaX - 6},${centerY + 4}`} fill={filterColor} opacity={0.8} />
          </g>
        )}

        {/* VCA */}
        <g transform={`translate(${vcaX}, ${blockY})`} opacity={anyActive ? 1 : 0.35}>
          <rect width={vcaW} height={blockH} rx={4} fill="#0d1418" stroke={accentColor} strokeWidth={1.5} />
          <text x={vcaW / 2} y={14} textAnchor="middle" fill={accentColor} fontSize={9} fontWeight="bold">VCA</text>
          {/* Volume meter */}
          <rect x={10} y={22} width={vcaW - 20} height={24} rx={2} fill="#1a1a1a" />
          <rect x={10} y={22 + 24 * (1 - params.masterVolume)} width={vcaW - 20} height={24 * params.masterVolume} rx={2} fill={accentColor} />
          <text x={vcaW / 2} y={blockH - 4} textAnchor="middle" fill="#888" fontSize={8}>{Math.round(params.masterVolume * 100)}%</text>
        </g>

        {/* Output arrow */}
        {anyActive && (
          <g>
            <line x1={vcaX + vcaW} y1={centerY} x2={vcaX + vcaW + 20} y2={centerY} stroke={accentColor} strokeWidth={2} opacity={0.8} />
            <polygon points={`${vcaX + vcaW + 26},${centerY} ${vcaX + vcaW + 20},${centerY - 4} ${vcaX + vcaW + 20},${centerY + 4}`} fill={accentColor} opacity={0.8} />
          </g>
        )}
        <text x={vcaX + vcaW + 32} y={centerY + 4} fill="#666" fontSize={10}>OUT</text>

        {/* Legend */}
        <g transform={`translate(${width - 85}, 8)`}>
          <line x1={0} y1={4} x2={12} y2={4} stroke={accentColor} strokeWidth={2} />
          <text x={16} y={7} fill="#555" fontSize={8}>Audio</text>
          <line x1={45} y1={4} x2={57} y2={4} stroke={fmColor} strokeWidth={2} strokeDasharray="3,2" />
          <text x={61} y={7} fill="#555" fontSize={8}>FM</text>
        </g>
      </svg>
    </div>
  );
}
