'use client';
import { useState, useEffect } from 'react';
import MP3Uploader from '@/components/MP3Uploader';

export default function CatalogPage() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      const response = await fetch('/api/catalog/tracks');
      const data = await response.json();
      setTracks(data.tracks || []);
    } catch (error) {
      console.error('Failed to fetch tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Music Catalog</h1>
      
      <div className="mb-12">
        <MP3Uploader onUploadSuccess={fetchTracks} />
      </div>

      <h2 className="text-2xl font-bold mb-4">Your Tracks</h2>
      {loading ? (
        <p>Loading...</p>
      ) : tracks.length === 0 ? (
        <p className="text-gray-500">No tracks uploaded yet</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tracks.map(track => (
            <div key={track.id} className="border rounded-lg p-4 shadow">
              <h3 className="font-bold">{track.title}</h3>
              <p className="text-gray-600">{track.artist}</p>
              {track.public_url && (
                <audio controls src={track.public_url} className="w-full mt-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
