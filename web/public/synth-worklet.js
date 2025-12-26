// AudioWorklet Processor for OSSIAN-19 Synthesizers
// Ring buffer pattern with message passing for WASM integration

class SynthWorkletProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();

    // Configurable buffer sizes via processorOptions
    // FM synth needs larger buffers due to higher CPU load
    const processorOptions = options.processorOptions || {};
    this.bufferSize = processorOptions.bufferSize || 1024;
    this.numBuffers = processorOptions.numBuffers || 4;

    this.buffers = [];
    for (let i = 0; i < this.numBuffers; i++) {
      this.buffers.push({
        left: new Float32Array(this.bufferSize),
        right: new Float32Array(this.bufferSize),
        ready: false,
      });
    }

    this.currentBuffer = 0;
    this.bufferPosition = 0;
    this.isPlaying = false;
    this.underruns = 0;

    this.port.onmessage = (event) => {
      const { type, data } = event.data;

      switch (type) {
        case 'buffer':
          const { index, left, right } = data;
          if (index >= 0 && index < this.numBuffers) {
            this.buffers[index].left.set(new Float32Array(left));
            this.buffers[index].right.set(new Float32Array(right));
            this.buffers[index].ready = true;
          }
          break;

        case 'start':
          // Start playing immediately - request buffers and begin
          // First buffers may cause brief silence but lower latency
          this.isPlaying = true;
          for (let i = 0; i < this.numBuffers; i++) {
            this.requestBuffer(i);
          }
          break;

        case 'stop':
          this.isPlaying = false;
          for (const buf of this.buffers) {
            buf.left.fill(0);
            buf.right.fill(0);
            buf.ready = false;
          }
          this.currentBuffer = 0;
          this.bufferPosition = 0;
          break;

        case 'panic':
          // Immediate silence
          for (const buf of this.buffers) {
            buf.left.fill(0);
            buf.right.fill(0);
            buf.ready = false;
          }
          break;
      }
    };

    this.port.postMessage({ type: 'ready' });
  }

  requestBuffer(index) {
    this.buffers[index].ready = false;
    this.port.postMessage({
      type: 'requestBuffer',
      data: { index, size: this.bufferSize },
    });
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    if (!output || output.length < 2) return true;

    const outLeft = output[0];
    const outRight = output[1];
    const frameCount = outLeft.length;

    if (!this.isPlaying) {
      outLeft.fill(0);
      outRight.fill(0);
      return true;
    }

    let framesWritten = 0;

    while (framesWritten < frameCount) {
      const buffer = this.buffers[this.currentBuffer];

      if (!buffer.ready) {
        // Buffer underrun
        for (let i = framesWritten; i < frameCount; i++) {
          outLeft[i] = 0;
          outRight[i] = 0;
        }
        this.underruns++;
        if (this.underruns % 100 === 1) {
          this.port.postMessage({
            type: 'underrun',
            data: { count: this.underruns },
          });
        }
        break;
      }

      const framesAvailable = this.bufferSize - this.bufferPosition;
      const framesToCopy = Math.min(framesAvailable, frameCount - framesWritten);

      for (let i = 0; i < framesToCopy; i++) {
        outLeft[framesWritten + i] = buffer.left[this.bufferPosition + i];
        outRight[framesWritten + i] = buffer.right[this.bufferPosition + i];
      }

      this.bufferPosition += framesToCopy;
      framesWritten += framesToCopy;

      if (this.bufferPosition >= this.bufferSize) {
        this.requestBuffer(this.currentBuffer);
        this.currentBuffer = (this.currentBuffer + 1) % this.numBuffers;
        this.bufferPosition = 0;
      }
    }

    return true;
  }
}

registerProcessor('synth-worklet-processor', SynthWorkletProcessor);
