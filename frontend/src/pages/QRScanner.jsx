import React, { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { 
  QrCode, 
  FileText, 
  Building, 
  User, 
  Archive, 
  Calendar,
  Phone,
  AlertCircle,
  CheckCircle,
  Camera,
  X,
  Download,
  Upload
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const QRScanner = () => {
  const [scannedDocument, setScannedDocument] = useState(null);
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const scannerRef = useRef(null);
  const html5QrcodeRef = useRef(null);

  const onScanSuccess = (decodedText, decodedResult) => {
    console.log('QR Code scanned:', decodedText);
    
    try {
      // Parse the QR code data (should be JSON)
      const scannedData = JSON.parse(decodedText);
      
      setScannedDocument(scannedData);
      setScanResult(decodedText);
      setError('');
      
      // Stop the scanner
      stopScanner();
      
    } catch (err) {
      setError('Invalid QR code. This doesn\'t appear to be a document QR code.');
      console.error('Error parsing QR code:', err);
    }
  };

  const onScanFailure = (error) => {

  };

  const startScanner = () => {
    setShowScanner(true);
    setError('');
    
    // Wait for the DOM element to be rendered
    setTimeout(() => {
      if (scannerRef.current && !html5QrcodeRef.current) {
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };
        
        html5QrcodeRef.current = new Html5QrcodeScanner("qr-reader", config, false);
        html5QrcodeRef.current.render(onScanSuccess, onScanFailure);
      }
    }, 100);
  };

  const stopScanner = () => {
    if (html5QrcodeRef.current) {
      html5QrcodeRef.current.clear().then(() => {
        html5QrcodeRef.current = null;
        setShowScanner(false);
      }).catch(err => {
        console.error('Error stopping scanner:', err);
        setShowScanner(false);
      });
    } else {
      setShowScanner(false);
    }
  };

  const downloadReceipt = async () => {
    if (!scannedDocument?.id) return;
    
    setIsDownloading(true);
    try {
      
      const response = await axios.post(
        `${API_URL}/documents/${scannedDocument.id}/generate-receipt`,
        {},
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `document_receipt_${scannedDocument.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download receipt. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const resetScanner = () => {
    setScannedDocument(null);
    setScanResult(null);
    setError('');
    stopScanner();
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-6">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <QrCode size={32} />
            QR Code Scanner
          </h1>
          <p className="text-purple-100 mt-2">
            Scan QR codes from document receipts to view information instantly
          </p>
        </div>

        <div className="p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3 text-red-800">
                <AlertCircle size={20} />
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Scanner Controls */}
          {!showScanner && !scannedDocument && (
            <div className="text-center py-12">
              <div className="bg-purple-50 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6">
                <QrCode size={64} className="text-purple-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Ready to Scan
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Use your camera to scan QR codes from document receipts. The scanner supports both camera and file upload.
              </p>
              
              <button
                onClick={startScanner}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors flex items-center gap-3 mx-auto"
              >
                <Camera size={24} />
                Start Scanner
              </button>
            </div>
          )}

          {/* QR Scanner */}
          {showScanner && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Scan QR Code
                </h3>
                <button
                  onClick={stopScanner}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Scanner container */}
              <div className="max-w-md mx-auto">
                <div id="qr-reader" ref={scannerRef}></div>
              </div>
              
              <p className="text-center text-gray-600 mt-4">
                Position the QR code within the scanning area. The scanner will automatically detect and process the code.
              </p>
            </div>
          )}

          {/* Scanned Document Information */}
          {scannedDocument && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3 text-green-800">
                  <CheckCircle size={24} />
                  <h3 className="text-xl font-semibold">Document Scanned Successfully!</h3>
                </div>
                <button
                  onClick={resetScanner}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <QrCode size={16} />
                  Scan Another
                </button>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                {/* Document Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                      {scannedDocument.title}
                    </h2>
                    <p className="text-gray-600">
                      {scannedDocument.description || 'No description available'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      ID #{scannedDocument.id}
                    </span>
                  </div>
                </div>

                {/* Document Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <FileText size={20} />
                      Document Information
                    </h3>

                    {scannedDocument.departement && (
                      <div className="flex items-center gap-3">
                        <Building size={18} className="text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Department</p>
                          <p className="font-medium text-gray-800">{scannedDocument.departement}</p>
                        </div>
                      </div>
                    )}

                    {scannedDocument.date_registered && (
                      <div className="flex items-center gap-3">
                        <Calendar size={18} className="text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Date Registered</p>
                          <p className="font-medium text-gray-800">{formatDate(scannedDocument.date_registered)}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <User size={20} />
                      Owner & Location
                    </h3>

                    {scannedDocument.owner_name && (
                      <div className="flex items-center gap-3">
                        <User size={18} className="text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Owner</p>
                          <p className="font-medium text-gray-800">{scannedDocument.owner_name}</p>
                        </div>
                      </div>
                    )}

                    {scannedDocument.owner_contact && (
                      <div className="flex items-center gap-3">
                        <Phone size={18} className="text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Contact</p>
                          <p className="font-medium text-gray-800">{scannedDocument.owner_contact}</p>
                        </div>
                      </div>
                    )}

                    {(scannedDocument.shelf_code || scannedDocument.box_number || scannedDocument.folder_number) && (
                      <div className="flex items-center gap-3">
                        <Archive size={18} className="text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Storage Location</p>
                          <p className="font-medium text-gray-800">
                            {[
                              scannedDocument.shelf_code && `Shelf: ${scannedDocument.shelf_code}`,
                              scannedDocument.box_number && `Box: ${scannedDocument.box_number}`,
                              scannedDocument.folder_number && `Folder: ${scannedDocument.folder_number}`
                            ].filter(Boolean).join(' • ') || 'No location specified'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={downloadReceipt}
                    disabled={isDownloading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    {isDownloading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download size={20} />
                        Download Receipt
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Raw Data (for debugging)
              <details className="mt-4">
                <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                  Show Raw QR Code Data
                </summary>
                <pre className="mt-2 bg-gray-100 p-4 rounded-lg text-xs overflow-auto">
                  {scanResult}
                </pre>
              </details> */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;