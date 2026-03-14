import React, { useEffect, useRef, useState } from 'react';
import logger from '../../utils/logger';
import { X, Camera, Upload, AlertCircle, CheckCircle } from 'lucide-react';

export default function AssetQRScanner({ open = false, onClose = () => {}, onScan = () => {}, onAssetScanned = () => {} }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState('');
  const [detectorAvailable, setDetectorAvailable] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    init();
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedDeviceId]);

  const init = async () => {
    setError('');
    setResult(null);
    setIsLoading(true);
    logger.info('Scanner initializing...');

    // Check BarcodeDetector support
    if ('BarcodeDetector' in window && window.BarcodeDetector.getSupportedFormats) {
      try {
        const supported = await window.BarcodeDetector.getSupportedFormats();
        const isQrSupported = supported.includes('qr_code');
        setDetectorAvailable(isQrSupported);
        logger.info('BarcodeDetector available:', isQrSupported);
      } catch (err) {
        logger.warn('BarcodeDetector check failed:', err);
        setDetectorAvailable(false);
      }
    } else {
      logger.warn('BarcodeDetector not available in this browser');
      setDetectorAvailable(false);
    }

    // enumerate devices
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const all = await navigator.mediaDevices.enumerateDevices();
        const cams = all.filter(d => d.kind === 'videoinput');
        setDevices(cams);
        if (!selectedDeviceId && cams.length > 0) setSelectedDeviceId(cams[0].deviceId);
      }
    } catch (err) {
      logger.warn('Could not enumerate devices', err);
    }

    // start camera
    startCamera();
    setIsLoading(false);
  };

  const startCamera = async () => {
    stopCamera();
    try {
      const constraints = {
        video: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : { facingMode: 'environment' }
      };
      logger.info('Starting camera with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        logger.info('Camera started successfully');
      }
      setScanning(true);
      tick();
    } catch (err) {
      logger.error('Camera error:', err);
      setError('Unable to access camera. Please allow camera access or try uploading an image.');
    }
  };

  const stopCamera = () => {
    setScanning(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
  };

  const cleanup = () => {
    stopCamera();
    setError('');
    setResult(null);
  };

  const tick = async () => {
    if (!scanning) return;
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState >= 2) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        if (detectorAvailable) {
          const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
          // createImageBitmap is supported in modern browsers
          try {
            const bitmap = await createImageBitmap(canvas);
            const codes = await detector.detect(bitmap);
            if (codes && codes.length > 0) {
              const raw = codes[0].rawValue || codes[0].rawText || (codes[0].rawValue && String(codes[0].rawValue));
              logger.info('✓ QR Code detected:', raw);
              setResult(raw);
              onScan(raw);
              onAssetScanned(raw);
              stopCamera();
              return;
            }
          } catch (err) {
            // ignore detection errors and continue
            logger.warn('Detection error:', err);
          }
        }
      }
    } catch (err) {
      logger.error('Scan tick error', err);
    }

    setTimeout(() => requestAnimationFrame(tick), 500);
  };

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const bitmap = await createImageBitmap(file);
      if ('BarcodeDetector' in window && window.BarcodeDetector.getSupportedFormats) {
        try {
          const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
          const codes = await detector.detect(bitmap);
          if (codes && codes.length > 0) {
            const raw = codes[0].rawValue || codes[0].rawText || (codes[0].rawValue && String(codes[0].rawValue));
            setResult(raw);
            onScan(raw);
            onAssetScanned(raw);
            return;
          }
        } catch (err) {
          logger.error('File detection error', err);
        }
      }
      setError('Could not detect a QR code in the provided image.');
    } catch (err) {
      logger.error('File read error', err);
      setError('Failed to read file');
    }
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[95vw] md:w-auto max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Scan QR Code</h3>
          </div>
          <button 
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            onClick={handleClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Video Area */}
            <div className="md:col-span-2">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video 
                  ref={videoRef} 
                  muted 
                  playsInline 
                  className="w-full h-56 md:h-96 object-cover" 
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                
                {/* Scanner Frame Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-44 h-44 md:w-56 md:h-56 border-2 border-green-400 rounded-lg relative">
                    {/* Corner markers */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-green-400"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-green-400"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-green-400"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-green-400"></div>
                  </div>
                </div>

                {/* Status Text */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-black/60 text-white px-4 py-2 rounded-lg text-sm font-medium">
                    {isLoading ? 'Initializing...' : result ? '✓ Scanned' : 'Align QR code'}
                  </div>
                </div>
              </div>
            </div>

            {/* Controls Sidebar */}
            <div className="flex flex-col gap-4">
              {/* Camera Selection */}
              {devices.length > 1 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Camera</label>
                  <select 
                    value={selectedDeviceId || ''} 
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {devices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Camera'}</option>)}
                  </select>
                </div>
              )}

              {/* File Upload */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Image
                </label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFile}
                  className="block w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" 
                />
              </div>

              {/* Status Messages */}
              {error && (
                <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {result && (
                <div className="flex gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-green-900 font-medium">Scanned Successfully</p>
                    <p className="text-green-700 text-xs mt-1 break-all">{result}</p>
                  </div>
                </div>
              )}

              {!detectorAvailable && (
                <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700">QR scanning unavailable. Try uploading an image or use Chrome.</p>
                </div>
              )}

              {/* Close Button */}
              <button 
                className="w-full mt-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-lg transition-colors"
                onClick={handleClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
