// Audio Recorder Module for Voice Instructions

class VoiceRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.audioBlob = null;
    this.recordingStartTime = null;
    this.timerInterval = null;
  }

  async startRecording() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };
      
      this.mediaRecorder.onstop = () => {
        this.audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.cleanup();
      };
      
      this.mediaRecorder.start();
      this.recordingStartTime = Date.now();
      this.startTimer();
      
      return { success: true };
    } catch (error) {
      console.error('Recording error:', error);
      return { success: false, error: error.message };
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
      this.stopTimer();
    }
  }

  startTimer() {
    const timerEl = document.getElementById('recordingTimer');
    if (!timerEl) return;
    
    timerEl.style.display = 'block';
    this.timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      // Auto-stop at max duration
      if (elapsed >= CONFIG.app.maxVoiceDurationSeconds) {
        this.stopRecording();
        toast.warning('Maximum recording time reached');
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  async uploadToGoogleDrive(fileName) {
    if (!this.audioBlob) {
      return { success: false, error: 'No recording available' };
    }

    try {
      // This will be implemented with Google Drive API
      // For now, return mock data
      console.log('Uploading to Google Drive:', fileName);
      
      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const fileId = 'mock-file-id-' + Date.now();
      const fileUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      
      return { 
        success: true, 
        fileId: fileId,
        fileUrl: fileUrl
      };
    } catch (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }
  }

  getAudioBlob() {
    return this.audioBlob;
  }

  playRecording() {
    if (!this.audioBlob) return;
    
    const audioUrl = URL.createObjectURL(this.audioBlob);
    const audio = new Audio(audioUrl);
    audio.play();
  }

  cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  reset() {
    this.audioChunks = [];
    this.audioBlob = null;
    this.cleanup();
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VoiceRecorder;
}
