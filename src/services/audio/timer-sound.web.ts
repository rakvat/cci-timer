import { Asset } from 'expo-asset';
import { GONG_SOUND } from '@/constants/audio';

let audioContext: AudioContext | null = null;
let gongBufferPromise: Promise<AudioBuffer> | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') return null;
  audioContext ??= new window.AudioContext();
  return audioContext;
}

/** Unlocks web audio and preloads the gong. Must be called from a user gesture. */
export function prepareTimerSound(): void {
  const context = getAudioContext();
  if (!context) return;

  void context.resume().catch(() => undefined);
  if (gongBufferPromise) return;

  const uri = Asset.fromModule(GONG_SOUND).uri;
  gongBufferPromise = fetch(uri)
    .then((response) => {
      if (!response.ok) throw new Error(`Could not load gong audio: ${response.status}`);
      return response.arrayBuffer();
    })
    .then((data) => context.decodeAudioData(data))
    .catch((error) => {
      gongBufferPromise = null;
      console.warn('Could not prepare the timer sound for web playback.', error);
      throw error;
    });
  void gongBufferPromise.catch(() => undefined);
}

export function playTimerSound(): void {
  const context = getAudioContext();
  if (!context || !gongBufferPromise) {
    playAudioElementFallback();
    return;
  }

  void gongBufferPromise
    .then(async (buffer) => {
      if (context.state === 'suspended') await context.resume();
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.start();
    })
    .catch(playAudioElementFallback);
}

function playAudioElementFallback(): void {
  const audio = new Audio(Asset.fromModule(GONG_SOUND).uri);
  audio.preload = 'auto';
  void audio.play().catch((error) => {
    console.warn('Could not play the timer sound in this browser.', error);
  });
}
