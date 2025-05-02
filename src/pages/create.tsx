import React, { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { useRouter } from 'next/router';
import Notification from '../components/Notification';
import { contractAddress, contractABI } from '../contracts/contractConfig';

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

      const imageUrl = imagePreview || '';

      // Create project on blockchain
      const result = await writeContract({
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'createProject',
        args: [
          formData.title,
          formData.description,
          BigInt(parseFloat(formData.targetAmount) * 1e18), // Convert ETH to Wei
          imageUrl, // Use the preview or uploaded image URL
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
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <h1 className="text-center mb-4">Create New Project</h1>
          
          {notification && (
            <Notification
              message={notification.message}
              type={notification.type}
              onClose={() => setNotification(null)}
            />
          )}

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
              />
              {imagePreview && (
                <div className="mt-2">
                  <img src={imagePreview} alt="Preview" style={{ maxWidth: 200, borderRadius: 8 }} />
                </div>
              )}
            </div>

            <button 
              type="submit" 
              className="btn btn-primary w-100"
              disabled={isPending || !address}
            >
              {isPending ? 'Creating...' : 'Create Project'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateProject; 