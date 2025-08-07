
import { useEffect, useRef, useCallback } from 'react';
import { Settings } from '../types';

const useVarioAudio = (verticalSpeed: number, settings: Settings, isMuted: boolean = false) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<number | null>(null);

  const baseFreq = 440; // A4
  const maxFreq = 1200;
  const sinkFreq = 220;

  const stopBeep = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (gainRef.current) {
      gainRef.current.gain.cancelScheduledValues(audioContextRef.current!.currentTime);
      gainRef.current.gain.setTargetAtTime(0, audioContextRef.current!.currentTime, 0.01);
    }
  }, []);

  const startLiftBeep = useCallback((vSpeed: number) => {
    stopBeep();
    if (!audioContextRef.current || !oscillatorRef.current || !gainRef.current || isMuted) return;

    const liftStrength = Math.min(vSpeed / 5, 1); // Normalize lift up to 5 m/s
    const frequency = baseFreq + liftStrength * (maxFreq - baseFreq);
    const cadence = 600 - liftStrength * 500; // ms between beeps
    const beepDuration = 100 + liftStrength * 100;

    oscillatorRef.current.frequency.setTargetAtTime(frequency, audioContextRef.current.currentTime, 0.01);

    const beep = () => {
        if (!gainRef.current || !audioContextRef.current) return;
        gainRef.current.gain.setTargetAtTime(0.3, audioContextRef.current.currentTime, 0.01);
        gainRef.current.gain.setTargetAtTime(0, audioContextRef.current.currentTime + beepDuration / 1000, 0.02);
    };

    beep();
    intervalRef.current = window.setInterval(beep, cadence);
  }, [isMuted, stopBeep]);


  const startSinkTone = useCallback(() => {
    stopBeep();
     if (!audioContextRef.current || !oscillatorRef.current || !gainRef.current || isMuted) return;

    oscillatorRef.current.frequency.setTargetAtTime(sinkFreq, audioContextRef.current.currentTime, 0.05);
    gainRef.current.gain.setTargetAtTime(0.2, audioContextRef.current.currentTime, 0.1);
  }, [isMuted, stopBeep]);


  useEffect(() => {
    // Initialize AudioContext on user interaction (or attempt to)
    if (!audioContextRef.current) {
      try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = context;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        
        oscillator.type = 'sine';
        oscillator.connect(gain);
        gain.connect(context.destination);
        gain.gain.setValueAtTime(0, context.currentTime);
        oscillator.start();
        
        oscillatorRef.current = oscillator;
        gainRef.current = gain;
      } catch (e) {
        console.error("Web Audio API is not supported in this browser or requires user interaction.", e);
      }
    }

    return () => {
        stopBeep();
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    if (!audioContextRef.current || isMuted) {
      stopBeep();
      return;
    }
    
    if (verticalSpeed > settings.liftThreshold) {
      startLiftBeep(verticalSpeed);
    } else if (verticalSpeed < settings.sinkThreshold) {
      startSinkTone();
    } else {
      stopBeep();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verticalSpeed, settings, isMuted]); // stopBeep, startLiftBeep, startSinkTone are stable

  // Function to resume audio context on user gesture
  const resumeAudio = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  return { resumeAudio };
};

export default useVarioAudio;
