import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { useRouter } from 'next/router';
import Notification from '../components/Notification';
import { contractAddress, contractABI } from '../contracts/contractConfig';
import dynamic from 'next/dynamic';

const remixVM = {
  id: 1337,
  name: 'Remix VM',
  network: 'remix',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
    public: { http: ['http://127.0.0.1:8545'] },
  },
  testnet: true,
};

interface FormErrors {
  title?: string;
  description?: string;
  targetAmount?: string;
}

const CreateProject: React.FC = () => {
  const router = useRouter();
  const { address } = useAccount();
  const { writeContract, isPending } = useWriteContract();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetAmount: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [isWalletConnected, setIsWalletConnected] = useState(!!address);

  useEffect(() => {
    setIsWalletConnected(!!address);
  }, [address]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.targetAmount) {
      newErrors.targetAmount = 'Target amount is required';
    } else if (parseFloat(formData.targetAmount) <= 0) {
      newErrors.targetAmount = 'Target amount must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  // Pinata upload logic (for demo/dev only; do not expose keys in production)
  const PINATA_API_KEY = '6c44f7bc1c436ba35956';
  const PINATA_API_SECRET = 'c432573c208d7f51077cd9509c317b056742bf2c740330fb7f336265b24f6d59';

  const uploadImageToPinata = async (file: File): Promise<string> => {
    const data = new FormData();
    data.append('file', file);
    const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_API_SECRET
      } as any,
      body: data
    });
    if (!res.ok) throw new Error('Failed to upload image to Pinata');
    const json = await res.json();
    return `https://gateway.pinata.cloud/ipfs/${json.IpfsHash}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submit button clicked');
    
    if (!address) {
      console.log('No address found');
      setNotification({ message: 'Please connect your wallet', type: 'error' });
      return;
    }

    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    try {
      console.log('Attempting to create project with data:', {
        address,
        contractAddress,
        formData,
        chain: sepolia
      });

      let imageUrl = '';
      if (imageFile) {
        setUploadingImage(true);
        try {
          imageUrl = await uploadImageToPinata(imageFile);
        } catch (err) {
          setNotification({ message: 'Image upload failed. Please try again.', type: 'error' });
          setUploadingImage(false);
          return;
        }
        setUploadingImage(false);
      }

      // Create project on blockchain
      const result = await writeContract({
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'createProject',
        args: [
          formData.title,
          formData.description,
          BigInt(parseFloat(formData.targetAmount) * 1e18), // Convert ETH to Wei
          imageUrl, // Use the Pinata IPFS URL
          BigInt(30) // 30 days duration
        ],
        chain: sepolia,
        account: address as `0x${string}`,
      });

      console.log('Contract write result:', result);

      setNotification({ 
        message: 'Project creation transaction sent!', 
        type: 'success' 
      });

      // Redirect to home page after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error: any) {
      console.error('Detailed error:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error data:', error.data);
      
      let errorMessage = 'Unknown error occurred';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      }
      
      setNotification({ 
        message: `Error creating project: ${errorMessage}`, 
        type: 'error' 
      });
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      <div className="container py-5">
        {/* Hero Section */}
        <div className="text-center mb-5" style={{ padding: '2.5rem 0 2rem 0', borderRadius: '1.5rem', background: 'rgba(255,255,255,0.95)', boxShadow: '0 4px 24px rgba(80,80,120,0.08)' }}>
          <img src="https://img.icons8.com/color/96/add-property.png" alt="Create Project" style={{ width: 80, marginBottom: 18, borderRadius: '50%', boxShadow: '0 2px 12px rgba(80,80,120,0.10)' }} />
          <h1 className="display-4 mb-2" style={{ fontWeight: 700, color: '#4f46e5' }}>Create New Project</h1>
          <p className="lead" style={{ color: '#444', fontWeight: 500 }}>Launch your idea and start raising funds from the community.</p>
        </div>
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card shadow-sm border-0" style={{ borderRadius: '1.25rem', background: 'rgba(255,255,255,0.97)', boxShadow: '0 4px 24px rgba(80,80,120,0.08)' }}>
              <div className="card-body p-4">
                {notification && (
                  <Notification
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                  />
                )}
                {!isWalletConnected ? (
                  <div className="alert alert-warning text-center">
                    Please connect your wallet to create a project.
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label htmlFor="title" className="form-label">Project Title</label>
                      <input
                        type="text"
                        className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        style={{ borderRadius: '0.7em' }}
                      />
                      {errors.title && (
                        <div className="invalid-feedback">{errors.title}</div>
                      )}
                    </div>
                    <div className="mb-3">
                      <label htmlFor="description" className="form-label">Description</label>
                      <textarea
                        className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        required
                        style={{ borderRadius: '0.7em' }}
                      />
                      {errors.description && (
                        <div className="invalid-feedback">{errors.description}</div>
                      )}
                    </div>
                    <div className="mb-3">
                      <label htmlFor="targetAmount" className="form-label">Target Amount (ETH)</label>
                      <input
                        type="number"
                        className={`form-control ${errors.targetAmount ? 'is-invalid' : ''}`}
                        id="targetAmount"
                        name="targetAmount"
                        value={formData.targetAmount}
                        onChange={handleChange}
                        step="0.01"
                        min="0.01"
                        required
                        style={{ borderRadius: '0.7em' }}
                      />
                      {errors.targetAmount && (
                        <div className="invalid-feedback">{errors.targetAmount}</div>
                      )}
                    </div>
                    <div className="mb-3">
                      <label htmlFor="image" className="form-label">Project Image</label>
                      <input
                        type="file"
                        className="form-control"
                        id="image"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={uploadingImage}
                        style={{ borderRadius: '0.7em' }}
                      />
                      {imagePreview && (
                        <div className="mt-2 text-center">
                          <img src={imagePreview} alt="Preview" style={{ maxWidth: 200, borderRadius: 12, boxShadow: '0 2px 8px rgba(80,80,120,0.10)' }} />
                        </div>
                      )}
                      {uploadingImage && <div className="text-info mt-2">Uploading image to IPFS via Pinata...</div>}
                    </div>
                    <button 
                      type="submit" 
                      className="btn btn-primary w-100 mt-2"
                      style={{ fontWeight: 600, borderRadius: '0.7em', background: 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)', border: 'none' }}
                      disabled={isPending}
                    >
                      {isPending ? 'Creating...' : 'Create Project'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default dynamic(() => Promise.resolve(CreateProject), { ssr: false }); 