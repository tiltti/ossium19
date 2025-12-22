// Wood side panel component for hardware synth aesthetic

interface WoodPanelProps {
  side: 'left' | 'right';
}

export function WoodPanel({ side }: WoodPanelProps) {
  // CSS gradient to simulate walnut wood grain - richer, more visible colors
  const woodGradient = `
    linear-gradient(
      ${side === 'left' ? '90deg' : '270deg'},
      #3d2817 0%,
      #5c3d28 10%,
      #4a3020 25%,
      #6b4830 40%,
      #5c3d28 55%,
      #4a3020 70%,
      #5c3d28 85%,
      #3d2817 100%
    )
  `;

  // Horizontal grain lines for texture
  const grainLines = `
    repeating-linear-gradient(
      0deg,
      transparent 0px,
      transparent 4px,
      rgba(0,0,0,0.12) 4px,
      rgba(0,0,0,0.12) 5px,
      transparent 5px,
      transparent 10px,
      rgba(100,60,30,0.08) 10px,
      rgba(100,60,30,0.08) 11px
    )
  `;

  return (
    <div
      style={{
        width: 28,
        alignSelf: 'stretch',
        background: woodGradient,
        position: 'relative',
        borderRadius: side === 'left' ? '6px 0 0 6px' : '0 6px 6px 0',
        boxShadow: side === 'left'
          ? 'inset -3px 0 6px rgba(0,0,0,0.4), 2px 0 6px rgba(0,0,0,0.4)'
          : 'inset 3px 0 6px rgba(0,0,0,0.4), -2px 0 6px rgba(0,0,0,0.4)',
        flexShrink: 0,
      }}
    >
      {/* Grain overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: grainLines,
          borderRadius: 'inherit',
          opacity: 0.7,
        }}
      />
      {/* Highlight edge */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          [side]: 0,
          width: 3,
          height: '100%',
          background: side === 'left'
            ? 'linear-gradient(180deg, rgba(140,100,70,0.5) 0%, rgba(80,50,30,0.2) 100%)'
            : 'linear-gradient(180deg, rgba(80,50,30,0.2) 0%, rgba(140,100,70,0.5) 100%)',
          borderRadius: 'inherit',
        }}
      />
      {/* Screws/rivets for realism */}
      <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)' }}>
        <Screw />
      </div>
      <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)' }}>
        <Screw />
      </div>
    </div>
  );
}

function Screw() {
  return (
    <div
      style={{
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #666 0%, #333 50%, #444 100%)',
        boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.2), inset -1px -1px 2px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.4)',
        position: 'relative',
      }}
    >
      {/* Screw slot */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '70%',
          height: 2,
          background: '#1a1a1a',
          transform: 'translate(-50%, -50%) rotate(45deg)',
          borderRadius: 1,
        }}
      />
    </div>
  );
}
