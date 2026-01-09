import React from 'react';
import { X } from 'lucide-react';

const ImagePreviewModal = ({ isOpen, onClose, imageUrl, title }) => {
    if (!isOpen) return null;

    return (
        <div 
            style={{ 
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
                background: 'rgba(0,0,0,0.9)', zIndex: 10000, 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(5px)'
            }}
            onClick={onClose} // Click ra ngoài thì đóng
        >
            {/* Nút đóng */}
            <button 
                onClick={onClose}
                style={{ 
                    position: 'absolute', top: '20px', right: '20px', 
                    background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
                    width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'white', zIndex: 10001
                }}
            >
                <X size={24} />
            </button>

            {/* Ảnh Full */}
            <div 
                style={{ maxWidth: '90%', maxHeight: '90%', position: 'relative' }}
                onClick={(e) => e.stopPropagation()} // Click vào ảnh không đóng
            >
                <img 
                    src={imageUrl} 
                    alt={title} 
                    style={{ 
                        maxWidth: '100%', maxHeight: '90vh', 
                        objectFit: 'contain', borderRadius: '8px',
                        boxShadow: '0 0 20px rgba(0,0,0,0.5)'
                    }} 
                />
                {title && (
                    <p style={{ 
                        color: 'white', textAlign: 'center', marginTop: '10px', 
                        fontSize: '16px', fontWeight: '500' 
                    }}>
                        {title}
                    </p>
                )}
            </div>
        </div>
    );
};

export default ImagePreviewModal;