import { useEffect, useState, useRef } from 'react';
import { Oscilloscope } from './Oscilloscope';
import { StereoMeter } from './StereoMeter';

interface VisualizationPanelProps {
  audioContext: AudioContext | null;
  masterNode: AudioNode | null;
  // Colors
  primaryColor?: string;
  secondaryColor?: string;
}

export function VisualizationPanel({
  audioContext,
  masterNode,
  primaryColor = '#64c8ff',
  secondaryColor = '#ff8c42',
}: VisualizationPanelProps) {
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [analyserL, setAnalyserL] = useState<AnalyserNode | null>(null);
  const [analyserR, setAnalyserR] = useState<AnalyserNode | null>(null);
  const splitterRef = useRef<ChannelSplitterNode | null>(null);

  useEffect(() => {
    if (!audioContext || !masterNode) {
      setAnalyser(null);
      setAnalyserL(null);
      setAnalyserR(null);
      return;
    }

    // Create main analyser for oscilloscope
    const mainAnalyser = audioContext.createAnalyser();
    mainAnalyser.fftSize = 2048;
    mainAnalyser.smoothingTimeConstant = 0.3;

    // Create stereo analyser setup
    const splitter = audioContext.createChannelSplitter(2);
    const analyserLeft = audioContext.createAnalyser();
    const analyserRight = audioContext.createAnalyser();
    analyserLeft.fftSize = 256;
    analyserRight.fftSize = 256;

    // Connect: masterNode -> mainAnalyser (for oscilloscope)
    // Also: masterNode -> splitter -> L/R analysers
    try {
      masterNode.connect(mainAnalyser);
      masterNode.connect(splitter);
      splitter.connect(analyserLeft, 0);
      splitter.connect(analyserRight, 1);

      splitterRef.current = splitter;
      setAnalyser(mainAnalyser);
      setAnalyserL(analyserLeft);
      setAnalyserR(analyserRight);
    } catch {
      // Connection might fail if nodes are invalid
    }

    return () => {
      try {
        mainAnalyser.disconnect();
        splitter.disconnect();
        analyserLeft.disconnect();
        analyserRight.disconnect();
      } catch {
        // Ignore disconnection errors
      }
    };
  }, [audioContext, masterNode]);

  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        padding: 8,
        background: '#0d0d0d',
        borderRadius: 6,
        border: '1px solid #333',
        alignItems: 'flex-start',
      }}
    >
      {/* Oscilloscope */}
      <Oscilloscope
        analyser={analyser}
        width={200}
        height={80}
        color={primaryColor}
      />

      {/* Stereo Meter */}
      <StereoMeter
        analyserL={analyserL}
        analyserR={analyserR}
        width={50}
        height={88}
        colorL={primaryColor}
        colorR={secondaryColor}
      />
    </div>
  );
}
