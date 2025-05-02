import React, { useState } from 'react';
import { Web3Storage } from 'web3.storage';

interface FileUploaderProps {
  projectId: number;
  onUploadSuccess: (link: string) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ projectId, onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      // Initialize Web3.Storage client
      const client = new Web3Storage({ token: process.env.NEXT_PUBLIC_WEB3_STORAGE_TOKEN || '' });
      
      // Upload file
      const cid = await client.put([file]);
      const ipfsLink = `https://${cid}.ipfs.w3s.link/${file.name}`;
      
      onUploadSuccess(ipfsLink);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <div className="mb-3">
        <label htmlFor="file" className="form-label">Upload Progress Document</label>
        <input
          type="file"
          className="form-control"
          id="file"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </div>
      <button
        className="btn btn-primary w-100"
        onClick={handleUpload}
        disabled={!file || isUploading}
      >
        {isUploading ? 'Uploading...' : 'Upload to IPFS'}
      </button>
    </div>
  );
};

export default FileUploader; 