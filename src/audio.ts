export type AudioBus = {
  resume: () => void
  slash: () => void
  hit: () => void
  hurt: () => void
  dash: () => void
  jutsu: () => void
  pickup: () => void
  ui: () => void
  fanfare: () => void
  toggleMute: () => boolean
  muted: () => boolean
  pump: () => void
}

export function createAudio(): AudioBus {
  let ctx: AudioContext | null = null
  let muted = false
  let nextNote = 0
  let step = 0
  let drone: OscillatorNode | null = null
  const scale = [220, 261.63, 293.66, 329.63, 392, 329.63, 293.66, 261.63]

  function ac(): AudioContext | null {
    const Ctor = globalThis.AudioContext
    if (!Ctor) return null
    if (!ctx) ctx = new Ctor()
    return ctx
  }

  function tone(freq: number, dur: number, type: OscillatorType, gainValue: number, when = 0): void {
    const audio = ac()
    if (!audio || muted) return
    const start = when > 0 ? when : audio.currentTime
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, start)
    gain.gain.setValueAtTime(gainValue, start)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    osc.connect(gain)
    gain.connect(audio.destination)
    osc.start(start)
    osc.stop(start + dur + 0.02)
  }

  function noise(dur: number, gainValue: number): void {
    const audio = ac()
    if (!audio || muted) return
    const length = Math.floor(audio.sampleRate * dur)
    const buffer = audio.createBuffer(1, length, audio.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length)
    const source = audio.createBufferSource()
    source.buffer = buffer
    const filter = audio.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 900
    const gain = audio.createGain()
    gain.gain.value = gainValue
    source.connect(filter)
    filter.connect(gain)
    gain.connect(audio.destination)
    source.start()
  }

  return {
    resume() {
      const audio = ac()
      if (!audio) return
      if (audio.state === 'suspended') void audio.resume()
      if (!drone && !muted) {
        const osc = audio.createOscillator()
        const gain = audio.createGain()
        osc.type = 'sine'
        osc.frequency.value = 110
        gain.gain.value = 0.018
        osc.connect(gain)
        gain.connect(audio.destination)
        osc.start()
        drone = osc
      }
      nextNote = audio.currentTime + 0.05
    },
    slash() {
      noise(0.08, 0.08)
      tone(520, 0.07, 'square', 0.03)
    },
    hit() {
      tone(180, 0.08, 'triangle', 0.05)
      noise(0.05, 0.05)
    },
    hurt() {
      tone(140, 0.16, 'sawtooth', 0.04)
    },
    dash() {
      noise(0.1, 0.07)
      tone(360, 0.1, 'sine', 0.03)
    },
    jutsu() {
      tone(440, 0.18, 'triangle', 0.04)
      tone(660, 0.22, 'sine', 0.03)
    },
    pickup() {
      tone(520, 0.08, 'sine', 0.04)
      tone(780, 0.12, 'sine', 0.03)
    },
    ui() {
      tone(660, 0.06, 'square', 0.02)
    },
    fanfare() {
      tone(392, 0.2, 'triangle', 0.04)
      tone(523.25, 0.28, 'triangle', 0.04)
    },
    toggleMute() {
      muted = !muted
      if (drone) drone.frequency.value = muted ? 0 : 110
      return muted
    },
    muted: () => muted,
    pump() {
      const audio = ac()
      if (!audio || muted) {
        if (audio) nextNote = audio.currentTime + 0.05
        return
      }
      while (nextNote < audio.currentTime + 0.25) {
        const freq = scale[step % scale.length] ?? 220
        tone(freq, 0.28, 'triangle', 0.02, nextNote)
        nextNote += 0.46
        step += 1
      }
    },
  }
}
