'use client';

import { useEffect, useRef } from 'react';

interface AudioNotifierProps {
  shouldPlay: boolean;
  soundUrl: string;
  resetCondition: any;
}

export default function AudioNotifier({ shouldPlay, soundUrl, resetCondition }: AudioNotifierProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayed = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio(soundUrl);
      audioRef.current.preload = 'auto';
    }
  }, [soundUrl]);

  useEffect(() => {
    if (shouldPlay && !hasPlayed.current && audioRef.current) {
      audioRef.current.play().catch(error => {
        // Autoplay is often blocked by browsers until a user interaction.
        // We can log this, but for this use case, we'll accept it might not play automatically.
        console.warn("Audio play failed. This can happen if the user hasn't interacted with the page yet.", error);
      });
      hasPlayed.current = true;
    }
  }, [shouldPlay]);

  // Reset the `hasPlayed` flag when the reset condition changes
  useEffect(() => {
    hasPlayed.current = false;
  }, [resetCondition]);

  return null; // This component does not render anything
}
