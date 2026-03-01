'use client';
import { useState, useEffect } from 'react';
import styles from './SplitVerification.module.css';

export default function SplitVerification({ trackId, participantEmail }) {
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [trackInfo, setTrackInfo] = useState(null);

  useEffect(() => {
    // Load track info when component mounts
    if (trackId) {
      fetchTrackInfo();
    }
  }, [trackId]);

  const fetchTrackInfo = async () => {
    try {
      const response = await fetch(`/api/splits/verify-page/${trackId}`);
      const data = await response.json();
      setTrackInfo(data);
    } catch (err) {
      console.error('Failed to load track info:', err);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setVerifying(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/splits/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          track_id: trackId,
          participant_email: participantEmail,
          verification_code: verificationCode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Verification failed');
      }

      setResult(data);
      
      // If verification successful, reload track info
      if (data.is_verified) {
        fetchTrackInfo();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  if (!trackInfo) {
    return <div className={styles.loading}>Loading verification page...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Pre-Release Split Verification</h1>
        <div className={styles.trackInfo}>
          <h2>{trackInfo.track_title}</h2>
          <p>by {trackInfo.track_artist}</p>
        </div>
      </div>

      <div className={styles.statusBar}>
        <div className={styles.statusItem}>
          <span className={styles.label}>Status:</span>
          <span className={`${styles.status} ${styles[trackInfo.status]}`}>
            {trackInfo.status.toUpperCase()}
          </span>
        </div>
        <div className={styles.statusItem}>
          <span className={styles.label}>Verifications:</span>
          <span>{trackInfo.verified_count}/{trackInfo.participant_count}</span>
        </div>
      </div>

      {!result ? (
        <form onSubmit={handleVerify} className={styles.verifyForm}>
          <div className={styles.formGroup}>
            <label>Verification Code</label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-digit code"
              maxLength="6"
              required
              disabled={verifying}
            />
            <small>Check your email for the verification code</small>
          </div>

          {error && (
            <div className={styles.error}>
              ❌ {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={verifying}
            className={styles.verifyButton}
          >
            {verifying ? 'Verifying...' : 'Verify Split Agreement'}
          </button>
        </form>
      ) : (
        <div className={styles.successCard}>
          <h3>✅ Verification Successful!</h3>
          
          <div className={styles.participantInfo}>
            <p><strong>Name:</strong> {result.participant_name}</p>
            <p><strong>Role:</strong> {result.participant_role}</p>
            <p><strong>Percentage:</strong> {result.percentage}%</p>
            <p><strong>Verified at:</strong> {new Date(result.verified_at).toLocaleString()}</p>
          </div>

          <div className={styles.handshakeInfo}>
            <h4>Digital Handshake Verification</h4>
            <p>Track Authenticity: {result.digital_handshake.verified ? '✅ Verified' : '❌ Failed'}</p>
          </div>

          <div className={styles.agreementHash}>
            <h4>Agreement Fingerprint</h4>
            <code>{result.agreement_hash.substring(0, 32)}...</code>
            <p className={styles.hashNote}>
              This SHA-256 hash proves the agreement hasn't been tampered with
            </p>
          </div>

          <button 
            onClick={() => setResult(null)}
            className={styles.newCodeButton}
          >
            Enter Another Code
          </button>
        </div>
      )}

      <div className={styles.footer}>
        <p>
          <strong>Legal Notice:</strong> This verification creates a binding record of 
          your split agreement. Combined with the Digital Handshake, it provides 
          court-admissible evidence of your ownership percentage.
        </p>
      </div>
    </div>
  );
}
