import { Web3Storage } from 'web3.storage';

const token = process.env.NEXT_PUBLIC_WEB3_STORAGE_TOKEN;
if (!token) {
  console.error('Web3.Storage token is not set in environment variables');
}

const client = new Web3Storage({ token: token || '' });

export const uploadToIPFS = async (file: File): Promise<string> => {
  try {
    if (!token) {
      throw new Error('Web3.Storage token is not configured');
    }
    
    console.log('Starting IPFS upload...');
    const cid = await client.put([file]);
    console.log('Upload successful, CID:', cid);
    
    const url = `https://${cid}.ipfs.w3s.link/${file.name}`;
    console.log('Generated URL:', url);
    
    return url;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw new Error(`Failed to upload file to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}; 