'use client';
import { useState } from 'react';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';

export default function UploadPage() {
  const supabase = useSupabaseClient();
  const session = useSession();
  const [gridId, setGridId] = useState<string>('');
  const [color, setColor] = useState('#FF0000');
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!session || !file || !gridId) return;

    // 1. Upload photo to Supabase Storage
    const fileName = `${session.user.id}-${gridId}-${Date.now()}.jpg`;
    const { data: uploadData } = await supabase.storage
      .from('grid-photos')
      .upload(fileName, file);

    // 2. Get public URL of the photo
    const { data: urlData } = await supabase.storage
      .from('grid-photos')
      .getPublicUrl(fileName);

    // 3. Update grid photo and color
    await supabase
      .from('grids')
      .update({
        photo_url: urlData.publicUrl,
        curtain_color: color,
      })
      .eq('id', gridId)
      .eq('user_id', session.user.id);

    alert('Upload success!');
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Upload Photo to Your Grid</h1>
      <div className="flex flex-col gap-4 max-w-md">
        <input
          type="number"
          placeholder="Enter Grid ID (1-10000)"
          value={gridId}
          onChange={(e) => setGridId(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
        <input
          type="file"
          accept="image/jpeg,image/png"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button
          onClick={handleUpload}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Upload
        </button>
      </div>
    </div>
  );
}