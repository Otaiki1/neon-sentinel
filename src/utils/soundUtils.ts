/**
 * Lightweight Audio System for React DOM components
 * Used for playing UI clicks and ambient BGM outside of the Phaser canvas
 */

import { getGameplaySettings } from "../services/settingsService";

const BGM_PLAYLIST = [
    '/sounds/game-environment.mp3',
    '/sounds/game-environment-1.mp3',
    '/sounds/game-environment-2.mp3',
    '/sounds/game-environment-3.mp3',
    '/sounds/game-environment-4.mp3',
    '/sounds/game-environment-5.mp3',
    '/sounds/game-scene-1.mp3'
];

class SoundController {
    private bgmAudio: HTMLAudioElement | null = null;
    private sfxAudio: HTMLAudioElement | null = null;
    private isMuted: boolean = false;

    constructor() {
        if (typeof window !== 'undefined') {
            const settings = getGameplaySettings();
            this.isMuted = !settings.audio.soundEnabled;

            const initialTrack = BGM_PLAYLIST[Math.floor(Math.random() * BGM_PLAYLIST.length)];
            this.bgmAudio = new Audio(initialTrack);
            this.bgmAudio.loop = false; // Disable loop to allow rotation
            this.bgmAudio.volume = 0.2;
            
            this.bgmAudio.addEventListener('ended', () => {
                this.playNextBGM();
            });

            this.sfxAudio = new Audio('/sounds/ui-click.mp3');
            this.sfxAudio.volume = 0.6;
            
            // Allow multiple concurrent click sounds
            this.sfxAudio.addEventListener('ended', () => {
                if (this.sfxAudio) {
                    this.sfxAudio.currentTime = 0;
                }
            });
        }
    }

    public playClick() {
        if (this.isMuted || !this.sfxAudio) return;
        
        // Clone node to allow rapid overlapping clicks
        const clickClone = this.sfxAudio.cloneNode() as HTMLAudioElement;
        clickClone.volume = this.sfxAudio.volume;
        clickClone.play().catch(e => console.warn('Audio play failed (maybe no interaction yet)', e));
    }

    public playBGM() {
        if (this.isMuted || !this.bgmAudio) return;
        this.bgmAudio.play().catch(e => console.warn('BGM play failed (maybe no interaction yet)', e));
    }

    public stopBGM() {
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0;
        }
    }

    public toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopBGM();
        } else {
            this.playBGM();
        }
        return this.isMuted;
    }
    
    public setMuted(mute: boolean) {
        this.isMuted = mute;
        if (this.isMuted) {
            this.stopBGM();
        } else {
            this.playBGM();
        }
    }

    public getMutedState() {
        return this.isMuted;
    }

    private playNextBGM() {
        if (!this.bgmAudio) return;
        const randomTrack = BGM_PLAYLIST[Math.floor(Math.random() * BGM_PLAYLIST.length)];
        this.bgmAudio.src = randomTrack;
        if (!this.isMuted) {
            this.bgmAudio.play().catch(e => console.warn('BGM play failed', e));
        }
    }
}

// Export singleton instance
export const soundManager = new SoundController();
