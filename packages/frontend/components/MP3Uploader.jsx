'use client';
import { useState, useRef } from 'react';
import styles from './MP3Uploader.module.css';

export default function MP3Uploader({ onUploadSuccess }) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadedTrack, setUploadedTrack] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const formRef = useRef(null);

  const handleUpload = async (file, metadata) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('artist', metadata.artist);
    formData.append('title', metadata.title);
    formData.append('isrc', metadata.isrc);

    setIsUploading(true);
    setUploadStatus(null);

    try {
      const response = await fetch('/api/catalog/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setUploadStatus('success');
        setUploadProgress(100);
        setUploadedTrack(data);
        if (onUploadSuccess) onUploadSuccess(data);
      } else {
        setUploadStatus('error');
        alert('Upload failed: ' + (data.detail || 'Unknown error'));
      }
    } catch (error) {
      setUploadStatus('error');
      alert('Error uploading file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const file = e.target.file.files[0];
    const metadata = {
      artist: e.target.artist.value,
      title: e.target.title.value,
      isrc: e.target.isrc.value
    };
    handleUpload(file, metadata);
  };

  const resetForm = () => {
    setUploadProgress(0);
    setUploadStatus(null);
    setUploadedTrack(null);
    setIsUploading(false);
    if (formRef.current) {
      formRef.current.reset();
    }
  };

  return (
    <div className={styles.uploader}>
      <h2>Upload MP3 Track</h2>
      
      {!uploadedTrack ? (
        <form ref={formRef} onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Artist Name *</label>
            <input type="text" name="artist" required disabled={isUploading} />
          </div>
          
          <div className={styles.formGroup}>
            <label>Track Title *</label>
            <input type="text" name="title" required disabled={isUploading} />
          </div>
          
          <div className={styles.formGroup}>
            <label>ISRC Code (optional)</label>
            <input type="text" name="isrc" disabled={isUploading} />
          </div>
          
          <div className={styles.formGroup}>
            <label>MP3 File *</label>
            <input 
              type="file" 
              name="file" 
              accept=".mp3,audio/mpeg" 
              required 
              disabled={isUploading}
            />
          </div>
          
          <button type="submit" disabled={isUploading} className={styles.uploadButton}>
            {isUploading ? 'Uploading...' : 'Upload Track'}
          </button>
          
          {uploadStatus === 'error' && (
            <p className={styles.error}>Upload failed. Please try again.</p>
          )}
        </form>
      ) : (
        <div className={styles.successCard}>
          <h3>✅ Upload Successful!</h3>
          <p><strong>Track ID:</strong> {uploadedTrack.track_id}</p>
          <p><strong>Artist:</strong> {uploadedTrack.artist}</p>
          <p><strong>Title:</strong> {uploadedTrack.title}</p>
          <p><strong>ISRC:</strong> {uploadedTrack.isrc || 'N/A'}</p>
          <p><strong>Hash:</strong> <code>{uploadedTrack.hash?.substring(0, 20)}...</code></p>
          
          {uploadedTrack.public_url && (
            <div className={styles.preview}>
              <h4>Preview:</h4>
              <audio controls src={uploadedTrack.public_url} className={styles.audioPlayer} />
              <a 
                href={uploadedTrack.public_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.streamLink}
              >
                🔗 Open Stream URL
              </a>
            </div>
          )}
          
          <button onClick={resetForm} className={styles.uploadAnother}>
            Upload Another Track
          </button>
        </div>
      )}
    </div>
  );
}
