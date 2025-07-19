import { useState, useRef, useCallback, useEffect } from 'react';

const useAudioRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const chunksRef = useRef([]);
  const recordingStartTimeRef = useRef(null);
  const totalProcessedTimeRef = useRef(0);

  // Audio level monitoring with improved sensitivity
  const updateAudioLevel = useCallback(() => {
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteTimeDomainData(dataArray); // Use time domain for better voice detection
      
      // Calculate RMS (Root Mean Square) for better audio level detection
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const sample = (dataArray[i] - 128) / 128; // Convert to -1 to 1 range
        sum += sample * sample;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      
      // Apply logarithmic scaling and amplification for better visibility
      const level = Math.min(1, rms * 5); // Amplify by 5x and cap at 1
      setAudioLevel(level);
      
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      // Initialize timestamp tracking
      recordingStartTimeRef.current = Date.now();
      totalProcessedTimeRef.current = 0;
      
      // Request microphone access with better audio settings
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: false, // Disable for better raw audio
          noiseSuppression: false, // Disable for better raw audio
          autoGainControl: false,  // Disable for consistent levels
          volume: 1.0
        }
      });
      
      streamRef.current = stream;
      
      // Set up audio context for level monitoring and raw audio capture
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000
      });
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      // Optimize analyzer settings for voice detection
      analyserRef.current.fftSize = 2048; // Larger for better resolution
      analyserRef.current.smoothingTimeConstant = 0.3; // Less smoothing for responsiveness
      
      updateAudioLevel();
      
      // Set up MediaRecorder with WAV format (more reliable than WebM chunks)
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus', // Keep WebM for full recording
        audioBitsPerSecond: 128000 // Higher bitrate for better quality
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      // For real-time processing, we'll use a different approach
      // Set up ScriptProcessorNode for raw audio data
      const bufferSize = 4096;
      const processor = audioContextRef.current.createScriptProcessor(bufferSize, 1, 1);
      let audioBuffer = [];
      let lastProcessTime = Date.now();
      
      processor.onaudioprocess = async (event) => {
        const inputBuffer = event.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);
        
        // Collect audio data
        audioBuffer.push(...inputData);
        
        // Process every 6 seconds of audio (96000 samples at 16kHz)
        if (audioBuffer.length >= 96000) {
          const now = Date.now();
          if (now - lastProcessTime >= 5000) { // Minimum 5 second interval
            lastProcessTime = now;
            
            try {
              // Check if AI service is initialized first
              if (window.electronAPI) {
                const status = await window.electronAPI.aiGetStatus();
                if (!status.initialized) {
                  console.log('AI service not initialized, attempting to initialize...');
                  const initResult = await window.electronAPI.aiInitialize();
                  if (!initResult.success) {
                    throw new Error('Failed to initialize AI service: ' + initResult.error);
                  }
                }
                
                setIsProcessing(true);
                
                // Convert float32 audio data to WAV format
                const wavBuffer = createWavBuffer(audioBuffer.slice(-96000), 16000);
                const uint8Array = new Uint8Array(wavBuffer);
                const hexString = Array.from(uint8Array)
                  .map(byte => byte.toString(16).padStart(2, '0'))
                  .join('');
                
                console.log(`Processing audio segment: ${wavBuffer.byteLength} bytes WAV, hex length: ${hexString.length}`);
                
                const result = await window.electronAPI.processAudioChunk(hexString, 16000);
                
                console.log('Whisper.cpp result:', result);
                
                if (result && result.success && result.result && result.result.text) {
                  console.log('Raw Whisper.cpp text:', result.result.text);
                  console.log('Raw Whisper.cpp segments:', result.result.segments);
                  
                  // Adjust timestamps to be relative to the start of the meeting
                  const adjustedSegments = result.result.segments.map(segment => ({
                    ...segment,
                    start: segment.start + totalProcessedTimeRef.current,
                    end: segment.end + totalProcessedTimeRef.current
                  }));
                  
                  console.log('Adjusted segments:', adjustedSegments);
                  
                  // Emit real-time transcription event
                  window.dispatchEvent(new CustomEvent('realtimeTranscription', {
                    detail: {
                      text: result.result.text,
                      segments: adjustedSegments,
                      language: result.result.language
                    }
                  }));
                  
                  // Save transcription segments to database if we have a meeting ID
                  if (window.electronAPI && window.currentMeetingId) {
                    try {
                      const saveResult = await window.electronAPI.saveLiveTranscriptionSegments(
                        adjustedSegments,
                        window.currentMeetingId
                      );
                      if (saveResult.success) {
                        console.log('Saved live transcription segments to database');
                      }
                    } catch (saveError) {
                      console.error('Failed to save live transcription:', saveError);
                    }
                  }
                  
                  console.log('Real-time transcription:', result.result.text);
                }
                
                // Update total processed time based on actual audio chunk duration
                // Each chunk is 6 seconds (96000 samples at 16kHz)
                totalProcessedTimeRef.current += 6;
              }
            } catch (err) {
              console.error('Error processing audio chunk:', err);
              setError(`Audio processing error: ${err.message}`);
            } finally {
              setIsProcessing(false);
            }
          }
          
          // Keep only the last 6 seconds of audio data
          audioBuffer = audioBuffer.slice(-96000);
        }
      };
      
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      
      // Handle data available for full recording
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      // Handle recording stop
      mediaRecorder.onstop = () => {
        setIsRecording(false);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (processor) {
          processor.disconnect();
        }
      };
      
      // Handle errors
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        setError(`Recording error: ${event.error.message}`);
      };
      
      // Start recording with longer chunks for full recording
      mediaRecorder.start(10000); // 10 second chunks for full recording
      setIsRecording(true);
      
    } catch (err) {
      console.error('Error starting recording:', err);
      setError(err.message);
    }
  }, [updateAudioLevel]);

  // Helper function to create WAV buffer from float32 audio data
  const createWavBuffer = (audioData, sampleRate) => {
    const length = audioData.length;
    const buffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);
    
    // Convert float32 to int16
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, audioData[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
    
    return buffer;
  };

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      
      // Clean up streams and contexts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Reset timestamp tracking
      recordingStartTimeRef.current = null;
      totalProcessedTimeRef.current = 0;
      
      setAudioLevel(0);
    }
  }, [isRecording]);

  // Save complete recording
  const saveRecording = useCallback(async (meetingId) => {
    if (chunksRef.current.length === 0) {
      throw new Error('No audio data to save');
    }
    
    try {
      console.log(`Recording completed for meeting ${meetingId}`);
      console.log(`Number of audio chunks: ${chunksRef.current.length}`);
      
      // Clear chunks since transcription was saved live
      chunksRef.current = [];
      
      // Return success since transcription was already saved during recording
      return { success: true, result: { text: 'Transcription saved during recording' } };
      
    } catch (err) {
      console.error('Error completing recording:', err);
      throw err;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return {
    isRecording,
    isProcessing,
    error,
    audioLevel,
    startRecording,
    stopRecording,
    saveRecording,
  };
};

export default useAudioRecording; 