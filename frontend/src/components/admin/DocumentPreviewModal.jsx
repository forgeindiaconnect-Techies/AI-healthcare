import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { X, ZoomIn, ZoomOut, Download, ExternalLink, Maximize, ChevronLeft, ChevronRight } from 'lucide-react';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { colors } from '../../../theme/colors';
import { Spinner, Button } from '../../ui/SharedUI';

// Set up pdf.js worker for react-pdf (Vite compatible)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const DocumentPreviewModal = ({ 
  isOpen, 
  onClose, 
  documentMetadata, 
  previewUrl, 
  doctorName,
  isLoading,
  error
}) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  // Reset state when modal opens with a new document
  useEffect(() => {
    if (isOpen) {
      setPageNumber(1);
      setScale(1.0);
    }
  }, [isOpen, previewUrl]);

  if (!isOpen) return null;

  const isPdf = documentMetadata?.mimeType === 'application/pdf';
  const isImage = documentMetadata?.mimeType?.startsWith('image/');
  const isUnsupported = !isPdf && !isImage;

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3.0));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const handleFitToWidth = () => setScale(1.0);

  const handlePrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages || 1));

  const handleOpenInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownload = () => {
    if (previewUrl) {
      const a = document.createElement('a');
      a.href = previewUrl;
      a.download = documentMetadata?.fileName || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{documentMetadata?.name || 'Document Preview'}</h2>
            <p className="text-sm text-gray-500">
              Doctor: <span className="font-medium text-gray-700">{doctorName}</span> • 
              Uploaded: {documentMetadata?.uploadedAt ? new Date(documentMetadata.uploadedAt).toLocaleDateString() : 'N/A'} • 
              Type: {isPdf ? 'PDF Document' : isImage ? 'Image' : 'Unsupported'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between p-3 border-b border-gray-100 bg-white gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={handleZoomOut} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Zoom Out"><ZoomOut size={18} /></button>
            <span className="text-sm font-medium w-12 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={handleZoomIn} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Zoom In"><ZoomIn size={18} /></button>
            <div className="w-px h-6 bg-gray-200 mx-1"></div>
            <button onClick={handleFitToWidth} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Fit to width"><Maximize size={18} /></button>
          </div>

          {isPdf && numPages && (
            <div className="flex items-center gap-3">
              <button onClick={handlePrevPage} disabled={pageNumber <= 1} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"><ChevronLeft size={18} /></button>
              <span className="text-sm">Page <span className="font-medium">{pageNumber}</span> of {numPages}</span>
              <button onClick={handleNextPage} disabled={pageNumber >= numPages} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"><ChevronRight size={18} /></button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleOpenInNewTab} style={{ padding: '6px 12px', fontSize: '13px' }} icon={<ExternalLink size={16} />}>
              Open in New Tab
            </Button>
            <Button variant="primary" onClick={handleDownload} style={{ padding: '6px 12px', fontSize: '13px' }} icon={<Download size={16} />}>
              Download
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4 md:p-8 relative">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100/80 z-10">
              <Spinner size={40} color={colors.primary} />
              <p className="mt-4 text-gray-600 font-medium">Loading document...</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-red-100 max-w-md">
              <div className="text-red-500 mb-4 flex justify-center"><X size={48} /></div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Document could not be loaded</h3>
              <p className="text-gray-500 mb-6">{error}</p>
              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={handleOpenInNewTab}>Open in New Tab</Button>
              </div>
            </div>
          )}

          {!isLoading && !error && previewUrl && (
            <div className="shadow-lg bg-white transition-transform duration-200" style={{ transformOrigin: 'top center' }}>
              {isPdf && (
                <Document
                  file={previewUrl}
                  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                  onLoadError={() => console.error("Error while loading document")}
                  loading={<div className="p-12"><Spinner size={30} /></div>}
                  error={<div className="p-12 text-red-500">Unable to preview this PDF. Open it in a new tab or download it.</div>}
                >
                  <Page 
                    pageNumber={pageNumber} 
                    scale={scale} 
                    renderTextLayer={false} 
                    renderAnnotationLayer={false}
                    className="shadow-sm"
                  />
                </Document>
              )}

              {isImage && (
                <img 
                  src={previewUrl} 
                  alt={documentMetadata?.name} 
                  style={{ transform: `scale(${scale})`, transformOrigin: 'top center', transition: 'transform 0.2s' }}
                  className="max-w-full h-auto object-contain"
                />
              )}

              {isUnsupported && (
                <div className="p-12 text-center max-w-md">
                  <div className="bg-gray-100 p-6 rounded-full inline-block mb-4">
                    <ExternalLink size={48} className="text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Preview is not available for this file type.</h3>
                  <p className="text-gray-500 mb-6">Please open the document in a new tab or download it to view.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;
