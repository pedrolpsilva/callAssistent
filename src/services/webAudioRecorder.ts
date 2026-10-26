export class WebAudioRecorder {
  private micStream: MediaStream | null = null;
  private displayStream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private onStopSharingCallback?: () => void;

  public isRecording = false;
  public isPaused = false;
  public hasTabAudio = false;

  async start(onStopSharing?: () => void): Promise<{ hasTabAudio: boolean }> {
    this.chunks = [];
    this.onStopSharingCallback = onStopSharing;

    // 1. Captura Microfone Local (Pedro Luiz)
    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // 2. Captura Áudio da Guia / Janela da Reunião (Google Meet, Teams, YouTube)
    // O Chrome exige video: true, mas gravaremos apenas o áudio
    try {
      this.displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
    } catch (err: any) {
      // Se o usuário cancelar a seleção de tela, libera o mic e cancela
      this.cleanupStreams();
      throw new Error('Seleção de guia/tela cancelada. É necessário selecionar a reunião para capturar as outras vozes.');
    }

    const tabAudioTracks = this.displayStream.getAudioTracks();
    this.hasTabAudio = tabAudioTracks.length > 0;

    // Se o usuário clicar em "Interromper compartilhamento" na barra azul do Chrome
    this.displayStream.getVideoTracks().forEach((track) => {
      track.onended = () => {
        if (this.onStopSharingCallback) {
          this.onStopSharingCallback();
        }
      };
    });

    // 3. Mescla os fluxos via Web Audio API
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioCtx = new AudioContextClass();
    const dest = this.audioCtx.createMediaStreamDestination();

    // Conecta microfone
    const micSource = this.audioCtx.createMediaStreamSource(this.micStream);
    micSource.connect(dest);

    // Conecta áudio da reunião/guia se houver faixa de som
    if (this.hasTabAudio) {
      const displayAudioStream = new MediaStream(tabAudioTracks);
      const displaySource = this.audioCtx.createMediaStreamSource(displayAudioStream);
      displaySource.connect(dest);
    }

    // 4. Inicia MediaRecorder
    let mimeType = 'audio/webm;codecs=opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else {
        mimeType = '';
      }
    }

    const options = mimeType ? { mimeType } : undefined;
    this.mediaRecorder = new MediaRecorder(dest.stream, options);

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.chunks.push(e.data);
      }
    };

    this.mediaRecorder.start(250); // Coleta a cada 250ms
    this.isRecording = true;
    this.isPaused = false;

    return { hasTabAudio: this.hasTabAudio };
  }

  pause() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      this.isPaused = true;
    }
  }

  resume() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      this.isPaused = false;
    }
  }

  async stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        this.cleanupStreams();
        return reject(new Error('Gravador não inicializado'));
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const finalBlob = new Blob(this.chunks, { type: mimeType });
        this.cleanupStreams();
        this.isRecording = false;
        this.isPaused = false;
        resolve(finalBlob);
      };

      try {
        if (this.mediaRecorder.state !== 'inactive') {
          this.mediaRecorder.stop();
        } else {
          const finalBlob = new Blob(this.chunks, { type: 'audio/webm' });
          this.cleanupStreams();
          resolve(finalBlob);
        }
      } catch (e) {
        this.cleanupStreams();
        reject(e);
      }
    });
  }

  private cleanupStreams() {
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    if (this.displayStream) {
      this.displayStream.getTracks().forEach((t) => t.stop());
      this.displayStream = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
  }
}

export const webAudioRecorder = new WebAudioRecorder();
