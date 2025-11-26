import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import axios from '../../api/axios';

const AttendanceActions = () => {
  const [cameraStatus, setCameraStatus] = useState('initializing');
  const [videoReady, setVideoReady] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [checkInStatus, setCheckInStatus] = useState('');
  const [checkOutStatus, setCheckOutStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Load face-api.js models
  const loadModels = useCallback(async () => {
    try {
      console.log('Loading face models...');
      setCameraStatus('loading-models');
      
      // Try multiple CDN sources for models
      const modelUrls = [
        'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights',
        'https://cdn.jsdelivr.net/npm/face-api.js@1.6.1/weights',
        'https://unpkg.com/face-api.js@1.6.1/weights'
      ];

      let modelsLoaded = false;
      for (const baseUrl of modelUrls) {
        try {
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(baseUrl),
            faceapi.nets.faceLandmark68Net.loadFromUri(baseUrl),
            faceapi.nets.faceRecognitionNet.loadFromUri(baseUrl)
          ]);
          console.log('Face models loaded successfully from:', baseUrl);
          modelsLoaded = true;
          break;
        } catch (error) {
          console.log('Failed to load from:', baseUrl, error.message);
          continue;
        }
      }

      if (!modelsLoaded) {
        throw new Error('Failed to load models from all sources');
      }

      setModelsLoaded(true);
      setCameraStatus('models-ready');
    } catch (error) {
      console.error('Error loading face models:', error);
      setCameraStatus('model-error');
    }
  }, []);

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    try {
      console.log('Requesting camera permission...');
      setCameraStatus('requesting-permission');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      console.log('Camera permission granted, stream obtained');
      setCameraStatus('stream-obtained');
      
      streamRef.current = stream;
      console.log('Stream tracks:', stream.getTracks());

      // Wait for video element to be available
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds with 100ms intervals
      
      while (!videoRef.current && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!videoRef.current) {
        throw new Error('Video element not found after waiting');
      }

      const video = videoRef.current;
      video.srcObject = stream;
      
      // Wait for video to be ready
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Video ready timeout'));
        }, 10000); // 10 second timeout

        const onLoadedMetadata = () => {
          clearTimeout(timeout);
          resolve();
        };

        const onCanPlay = () => {
          clearTimeout(timeout);
          resolve();
        };

        video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
        video.addEventListener('canplay', onCanPlay, { once: true });
        
        // If already ready, resolve immediately
        if (video.readyState >= 2 && video.videoWidth > 0) {
          clearTimeout(timeout);
          resolve();
        }
      });

      console.log('Video is ready, dimensions:', video.videoWidth, 'x', video.videoHeight);
      setVideoReady(true);
      setCameraStatus('ready');
      
      // Ensure video is playing
      try {
        await video.play();
      } catch (playError) {
        console.log('Auto-play failed, but video is ready:', playError.message);
      }

    } catch (error) {
      console.error('Camera initialization error:', error);
      setCameraStatus('error');
    }
  }, []);

  // Initialize everything
  useEffect(() => {
    const init = async () => {
      await loadModels();
      if (modelsLoaded) {
        await initializeCamera();
      }
    };
    
    init();
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [loadModels, modelsLoaded, initializeCamera]);

  // Debug function
  const debugVideo = () => {
    const video = videoRef.current;
    if (video) {
      console.log('=== VIDEO DEBUG INFO ===');
      console.log('Video element:', video);
      console.log('Video dimensions:', { width: video.videoWidth, height: video.videoHeight });
      console.log('Video readyState:', video.readyState);
      console.log('Video srcObject:', video.srcObject);
      console.log('Video error:', video.error);
      console.log('=== END VIDEO DEBUG ===');
    } else {
      console.log('Video ref is null');
    }
  };

  // Check-in function
  const handleCheckIn = async () => {
    if (!videoReady || !modelsLoaded) {
      setCheckInStatus('Camera not ready');
      return;
    }

    setIsProcessing(true);
    setCheckInStatus('Processing...');

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (!video || !canvas) {
        throw new Error('Video or canvas not available');
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      console.log('Canvas dimensions set to:', canvas.width, 'x', canvas.height);
      
      // Draw current video frame
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      console.log('Image drawn to canvas, attempting face detection...');
      
      // Detect face with more lenient options
      let detection = await faceapi.detectSingleFace(
        canvas, 
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 224,
          scoreThreshold: 0.3
        })
      ).withFaceLandmarks().withFaceDescriptor();

      if (!detection) {
        // Try with different detection options
        console.log('First detection failed, trying alternative method...');
        detection = await faceapi.detectSingleFace(
          canvas,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 320,
            scoreThreshold: 0.1
          })
        ).withFaceLandmarks().withFaceDescriptor();
        
        if (!detection) {
          throw new Error('No face detected. Please ensure your face is clearly visible and well-lit.');
        }
        
        console.log('Alternative detection successful');
      }

      console.log('Face detected successfully, descriptor length:', detection.descriptor.length);
      
      // Send check-in request
      const response = await axios.post('/attendance/check-in', {
        descriptor: Array.from(detection.descriptor)
      });

      if (response.data.success) {
        setCheckInStatus('Check-in successful!');
      } else {
        setCheckInStatus('Check-in failed: ' + response.data.message);
      }
    } catch (error) {
      console.error('Check-in error:', error);
      console.log('Backend response data:', error.response?.data);
      if (error.response?.status === 400) {
        const backendMessage = error.response?.data?.message || 'Invalid request data';
        setCheckInStatus('Error: ' + backendMessage);
      } else if (error.message.includes('No face detected')) {
        setCheckInStatus('Error: ' + error.message);
      } else {
        setCheckInStatus('Error: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Check-out function
  const handleCheckOut = async () => {
    if (!videoReady || !modelsLoaded) {
      setCheckOutStatus('Camera not ready');
      return;
    }

    setIsProcessing(true);
    setCheckOutStatus('Processing...');

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (!video || !canvas) {
        throw new Error('Video or canvas not available');
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      console.log('Canvas dimensions set to:', canvas.width, 'x', canvas.height);
      
      // Draw current video frame
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      console.log('Image drawn to canvas, attempting face detection...');
      
      // Detect face with more lenient options
      let detection = await faceapi.detectSingleFace(
        canvas, 
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 224,
          scoreThreshold: 0.3
        })
      ).withFaceLandmarks().withFaceDescriptor();

      if (!detection) {
        // Try with different detection options
        console.log('First detection failed, trying alternative method...');
        detection = await faceapi.detectSingleFace(
          canvas,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 320,
            scoreThreshold: 0.1
          })
        ).withFaceLandmarks().withFaceDescriptor();
        
        if (!detection) {
          throw new Error('No face detected. Please ensure your face is clearly visible and well-lit.');
        }
        
        console.log('Alternative detection successful');
      }

      console.log('Face detected successfully, descriptor length:', detection.descriptor.length);
      
      // Send check-out request
      const response = await axios.post('/attendance/check-out', {
        descriptor: Array.from(detection.descriptor)
      });

      if (response.data.success) {
        setCheckOutStatus('Check-out successful!');
      } else {
        setCheckOutStatus('Check-out failed: ' + response.data.message);
      }
    } catch (error) {
      console.error('Check-out error:', error);
      console.log('Backend response data:', error.response?.data);
      if (error.response?.status === 400) {
        const backendMessage = error.response?.data?.message || 'Invalid request data';
        setCheckOutStatus('Error: ' + backendMessage);
      } else if (error.message.includes('No face detected')) {
        setCheckOutStatus('Error: ' + error.message);
      } else {
        setCheckOutStatus('Error: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Retry camera initialization
  const retryCamera = () => {
    setCameraStatus('initializing');
    setVideoReady(false);
    initializeCamera();
  };

  if (cameraStatus === 'error') {
    return (
      <div className="text-center p-6">
        <h3 className="text-xl font-semibold text-red-600 mb-4">Camera Error</h3>
        <p className="text-gray-600 mb-4">Failed to initialize camera</p>
        <button
          onClick={retryCamera}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retry Camera
        </button>
      </div>
    );
  }

  if (cameraStatus === 'model-error') {
    return (
      <div className="text-center p-6">
        <h3 className="text-xl font-semibold text-red-600 mb-4">Model Loading Error</h3>
        <p className="text-gray-600 mb-4">Failed to load face recognition models</p>
        <button
          onClick={loadModels}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retry Loading Models
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-center mb-6">Attendance Management</h2>
      
      {/* Camera Status
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">Camera Status:</h3>
        <p className="text-sm text-gray-600">
          {cameraStatus === 'initializing' && 'Initializing camera...'}
          {cameraStatus === 'requesting-permission' && 'Requesting camera permission...'}
          {cameraStatus === 'stream-obtained' && 'Camera stream obtained, waiting for video...'}
          {cameraStatus === 'loading-models' && 'Loading face recognition models...'}
          {cameraStatus === 'models-ready' && 'Models loaded, initializing camera...'}
          {cameraStatus === 'ready' && 'Camera ready for attendance'}
        </p>
      </div> */}

      {/* Video and Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="font-semibold mb-2">Live Camera Feed</h3>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded bg-gray-800 opacity-50"
          />
          {/* <button
            onClick={debugVideo}
            className="mt-2 bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
          >
            Debug Video
          </button> */}
        </div>
        
        <div>
          <h3 className="font-semibold mb-2">Captured Image</h3>
          <canvas
            ref={canvasRef}
            className="w-full rounded bg-gray-200 border-2 border-dashed border-gray-400"
            style={{ height: '240px' }}
          />
        </div>
      </div>

      {/* Attendance Actions */}
      {videoReady && modelsLoaded && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center">
            <button
              onClick={handleCheckIn}
              disabled={isProcessing}
              className="bg-green-500 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed w-full"
            >
              Check In
            </button>
            {checkInStatus && (
              <p className={`mt-2 text-sm ${checkInStatus.includes('successful') ? 'text-green-600' : 'text-red-600'}`}>
                {checkInStatus}
              </p>
            )}
          </div>
          
          <div className="text-center">
            <button
              onClick={handleCheckOut}
              disabled={isProcessing}
              className="bg-red-500 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed w-full"
            >
              Check Out
            </button>
            {checkOutStatus && (
              <p className={`mt-2 text-sm ${checkOutStatus.includes('successful') ? 'text-green-600' : 'text-red-600'}`}>
                {checkOutStatus}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Loading States */}
      {!videoReady && (
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Initializing camera...</p>
        </div>
      )}

      {!modelsLoaded && (
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading face recognition models...</p>
        </div>
      )}
    </div>
  );
};

export default AttendanceActions;
