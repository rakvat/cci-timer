import { Asset } from 'expo-asset';
import { Platform } from 'react-native';

export const GONG_SOUND = require('../../assets/audio/gong.wav') as number;

let audioContext: AudioContext | null = null;
let gongBufferPromise: Promise<AudioBuffer> | null = null;

function getWebAudioContext(): AudioContext | null {
  if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') return null;
  audioContext ??= new window.AudioContext();
  return audioContext;
}

export function prepareTimerEndSound(): void {
  if (Platform.OS !== 'web') return;

  const context = getWebAudioContext();
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
      console.warn('Could not prepare the timer end sound for web playback.', error);
      throw error;
    });
  void gongBufferPromise.catch(() => undefined);
}

export function playTimerEndSound(nativePlayback: () => void): void {
  if (Platform.OS !== 'web') {
    nativePlayback();
    return;
  }

  const context = getWebAudioContext();
  if (!context || !gongBufferPromise) {
    playWebAudioFallback();
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
    .catch(playWebAudioFallback);
}

function playWebAudioFallback(): void {
  const audio = new Audio(Asset.fromModule(GONG_SOUND).uri);
  audio.preload = 'auto';
  void audio.play().catch((error) => {
    console.warn('Could not play the timer end sound in this browser.', error);
  });
}
