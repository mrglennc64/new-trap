'use client';
import { useParams, useSearchParams } from 'next/navigation';
import SplitVerification from '@/components/SplitVerification';
import styles from './page.module.css';

export default function PreReleaseVerificationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  const trackId = params.trackId;
  const email = searchParams.get('email') || '';

  return (
    <div className={styles.page}>
      <SplitVerification 
        trackId={trackId} 
        participantEmail={email}
      />
    </div>
  );
}
