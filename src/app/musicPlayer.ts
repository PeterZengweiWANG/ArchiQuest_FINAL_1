export default class MusicPlayer {
    private audioElement: HTMLAudioElement;
    private tracks: string[];
    private currentTrackIndex: number;
  
    constructor(tracks: string[]) {
      this.audioElement = new Audio();
      this.tracks = tracks;
      this.currentTrackIndex = 0;
      this.loadTrack(this.currentTrackIndex);
    }
  
    private loadTrack(index: number) {
      this.audioElement.src = this.tracks[index];
      this.audioElement.loop = true;
      this.audioElement.load();
    }
  
    play() {
      this.audioElement.play();
    }
  
    pause() {
      this.audioElement.pause();
    }
  
    nextTrack() {
      this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length;
      this.loadTrack(this.currentTrackIndex);
      this.play();
    }
  
    previousTrack() {
      this.currentTrackIndex = (this.currentTrackIndex - 1 + this.tracks.length) % this.tracks.length;
      this.loadTrack(this.currentTrackIndex);
      this.play();
    }
  }