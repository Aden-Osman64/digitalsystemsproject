import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { contractAddress, contractABI } from '../../contracts/contractConfig';
import { formatEther, parseEther } from 'viem';
import { createPublicClient, http } from 'viem';
import Notification from '../../components/Notification';
import dynamic from 'next/dynamic';

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

interface Milestone {
  description: string;
  amount: string;
  isCompleted: boolean;
  isFunded: boolean;
  imageUrl?: string;
}

interface Project {
  creator: string;
  title: string;
  description: string;
  targetAmount: string;
  raisedAmount: string;
  imageUrl: string;
  isActive: boolean;
  deadline: number;
  milestones: Milestone[];
}

const ProjectDetailsContent: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { address } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const [contributionAmount, setContributionAmount] = useState('');
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newMilestone, setNewMilestone] = useState({ description: '', amount: '' });
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [milestoneImages, setMilestoneImages] = useState<{ [key: number]: File | null }>({});
  const [milestoneImagePreviews, setMilestoneImagePreviews] = useState<{ [key: number]: string }>({});
  const [milestoneSubmissions, setMilestoneSubmissions] = useState<{ [key: number]: boolean }>({});

  console.log('Router Query:', router.query);
  console.log('Project ID from query:', id);
  console.log('Router is ready:', router.isReady);

  // Convert project ID to BigInt safely
  const projectId = React.useMemo(() => {
    if (!router.isReady || !id) {
      console.log('Router not ready or no ID:', { isReady: router.isReady, id });
      return undefined;
    }
    try {
      const numId = Number(id);
      console.log('Converted ID to number:', numId);
      if (isNaN(numId) || numId < 0) {
        console.log('Invalid number:', numId);
        return undefined;
      }
      const bigIntId = BigInt(numId);
      console.log('Converted to BigInt:', bigIntId);
      return bigIntId;
    } catch (error) {
      console.error('Error converting project ID:', error);
      return undefined;
    }
  }, [id, router.isReady]);

  console.log('Final projectId:', projectId);

  const { data: projectData, isLoading: isLoadingProject } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'getProjectDetails',
    args: [projectId ?? BigInt(0)],
    chainId: sepolia.id,
  });

  console.log('Contract call params:', {
    address: contractAddress,
    functionName: 'getProjectDetails',
    args: [projectId ?? BigInt(0)],
    chainId: sepolia.id
  });

  const { data: userContribution, isLoading: isLoadingContribution } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'getContributionAmount',
    args: projectId && address ? [projectId, address as `0x${string}`] : undefined,
    chainId: sepolia.id,
    query: {
      enabled: !!projectId && !!address,
    },
  });

  const project: Project | null = projectData ? {
    creator: projectData[0],
    title: projectData[1],
    description: projectData[2],
    targetAmount: formatEther(projectData[3]),
    raisedAmount: formatEther(projectData[4]),
    imageUrl: projectData[5],
    isActive: projectData[6],
    deadline: Number(projectData[7]) * 1000,
    milestones: [],
  } : null;

  useEffect(() => {
    if (!router.isReady) return;
    
    if (!id) {
      setError('Invalid project ID');
      return;
    }

    console.log('Project data loaded:', projectData);
  }, [router.isReady, id, projectData]);

  const fetchMilestones = async (projectId: bigint) => {
    try {
      const milestoneCount = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'getMilestoneCount',
        args: [projectId],
      });
      console.log('Fetched milestoneCount:', milestoneCount, 'for projectId:', projectId);

      const loadedMilestones: Milestone[] = [];
      for (let i = 0; i < Number(milestoneCount); i++) {
        const milestoneData = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: contractABI,
          functionName: 'getMilestoneDetails',
          args: [projectId, BigInt(i)],
        });
        console.log(`Fetched milestoneData for index ${i}:`, milestoneData);

        loadedMilestones.push({
          description: milestoneData[0],
          amount: formatEther(milestoneData[1]),
          isCompleted: milestoneData[2],
          isFunded: milestoneData[3],
          imageUrl: milestoneData[4],
        });
      }
      console.log('Final loadedMilestones:', loadedMilestones);
      setMilestones(loadedMilestones);
    } catch (error) {
      console.error('Error fetching milestones:', error);
    }
  };

  useEffect(() => {
    if (projectId !== undefined) {
      fetchMilestones(projectId);
    }
  }, [projectId]);

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !project || !contributionAmount || projectId === undefined) return;

    try {
      const amount = parseEther(contributionAmount);
      if (amount <= BigInt(0)) {
        setNotification({
          message: 'Please enter a valid contribution amount',
          type: 'error',
        });
        return;
      }

      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'contribute',
        args: [projectId],
        value: amount,
        chain: sepolia,
        account: address,
      });

      setNotification({
        message: 'Contribution successful!',
        type: 'success',
      });

      // Refresh the page after 2 seconds
      setTimeout(() => {
        router.reload();
      }, 2000);
    } catch (error) {
      console.error('Error contributing:', error);
      setNotification({
        message: `Failed to contribute: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
      });
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || projectId === undefined) {
      setNotification({
        message: 'Please connect your wallet',
        type: 'error',
      });
      return;
    }

    try {
      console.log('Adding milestone with data:', {
        projectId,
        description: newMilestone.description,
        amount: parseEther(newMilestone.amount),
      });

      const result = await writeContract({
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'addMilestone',
        args: [
          projectId,
          newMilestone.description,
          parseEther(newMilestone.amount),
        ],
        chain: sepolia,
        account: address,
      });

      console.log('Milestone added successfully:', result);

      setNotification({
        message: 'Milestone added successfully!',
        type: 'success',
      });
      setIsAddingMilestone(false);
      setNewMilestone({ description: '', amount: '' });
      fetchMilestones(projectId);
    } catch (error) {
      console.error('Error adding milestone:', error);
      setNotification({
        message: `Failed to add milestone: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
      });
    }
  };

  const handleMilestoneImageChange = (milestoneId: number, file: File | null) => {
    setMilestoneImages((prev) => ({ ...prev, [milestoneId]: file }));
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMilestoneImagePreviews((prev) => ({ ...prev, [milestoneId]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    } else {
      setMilestoneImagePreviews((prev) => {
        const copy = { ...prev };
        delete copy[milestoneId];
        return copy;
      });
    }
  };

  const handleCompleteMilestone = async (milestoneId: number) => {
    if (!address || projectId === undefined) return;
    if (!milestoneImages[milestoneId]) {
      setNotification({
        message: 'Please upload an image to complete this milestone.',
        type: 'error',
      });
      return;
    }

    try {
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'completeMilestone',
        args: [projectId, BigInt(milestoneId)],
        chain: sepolia,
        account: address,
      });

      setNotification({
        message: 'Milestone marked as completed!',
        type: 'success',
      });
      fetchMilestones(projectId);
    } catch (error) {
      setNotification({
        message: `Failed to complete milestone: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
      });
    }
  };

  const handleWithdrawMilestoneFunds = async (milestoneId: number) => {
    if (!address || projectId === undefined) return;

    try {
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'withdrawMilestoneFunds',
        args: [projectId, BigInt(milestoneId)],
        chain: sepolia,
        account: address,
      });

      setNotification({
        message: 'Milestone funds withdrawn successfully!',
        type: 'success',
      });
      fetchMilestones(projectId);
    } catch (error) {
      setNotification({
        message: `Failed to withdraw milestone funds: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
      });
    }
  };

  // Add this function to handle withdrawFunds for the creator
  const handleWithdrawFunds = async () => {
    if (!address || projectId === undefined) return;
    try {
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'withdrawFunds',
        args: [projectId],
        chain: sepolia,
        account: address,
      });
      setNotification({
        message: 'Funds withdrawn successfully!',
        type: 'success',
      });
      setTimeout(() => router.reload(), 2000);
    } catch (error) {
      setNotification({
        message: `Failed to withdraw funds: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
      });
    }
  };

  const handleSubmitMilestone = (milestoneId: number) => {
    setMilestoneSubmissions((prev) => ({ ...prev, [milestoneId]: true }));
    setNotification({
      message: 'Milestone submitted for review!',
      type: 'success',
    });
  };

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  if (isLoadingProject) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          Project not found. Please make sure you have selected a valid project.
        </div>
      </div>
    );
  }

  const progress = (parseFloat(project.raisedAmount) / parseFloat(project.targetAmount)) * 100;
  const deadline = new Date(project.deadline).toLocaleDateString();

  return (
    <div className="container py-5">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="row">
        <div className="col-md-8">
          {project.imageUrl ? (
            <img 
              src={project.imageUrl} 
              className="img-fluid rounded mb-4" 
              alt={project.title}
            />
          ) : (
            <div 
              className="bg-secondary rounded mb-4" 
              style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <span className="text-white">No Image</span>
            </div>
          )}

          <h1>{project.title}</h1>
          <p className="text-muted">
            Created by: {project.creator.slice(0, 6)}...{project.creator.slice(-4)}
          </p>
          <p>{project.description}</p>

          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Project Status</h5>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span>Progress</span>
                  <span>
                    {project.raisedAmount} ETH / {project.targetAmount} ETH
                  </span>
                </div>
                <div className="progress">
                  <div 
                    className="progress-bar" 
                    role="progressbar" 
                    style={{ width: `${progress}%` }}
                  >
                    {Math.round(progress)}%
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-between">
                <span>Deadline: {deadline}</span>
                <span className={`badge ${project.isActive ? 'bg-success' : 'bg-danger'}`}>
                  {project.isActive ? 'Active' : 'Ended'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Contribute to Project</h5>
              {!project.isActive ? (
                <p className="text-danger">This project has ended.</p>
              ) : !address ? (
                <p className="text-muted">Please connect your wallet to contribute.</p>
              ) : (
                <>
                  <form onSubmit={handleContribute}>
                    <div className="mb-3">
                      <label htmlFor="amount" className="form-label">Amount (ETH)</label>
                      <input
                        type="number"
                        className="form-control"
                        id="amount"
                        value={contributionAmount}
                        onChange={(e) => setContributionAmount(e.target.value)}
                        step="0.01"
                        min="0.01"
                        required
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="btn btn-primary w-100"
                      disabled={isPending}
                    >
                      {isPending ? 'Contributing...' : 'Contribute'}
                    </button>
                  </form>

                  {isLoadingContribution ? (
                    <div className="mt-3">
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span className="ms-2">Loading your contribution...</span>
                    </div>
                  ) : userContribution ? (
                    <div className="mt-3">
                      <p className="text-muted">
                        Your contribution: {formatEther(BigInt(userContribution.toString()))} ETH
                      </p>
                    </div>
                  ) : null}
                </>
              )}

              {!project.isActive && address?.toLowerCase() === project.creator.toLowerCase() && parseFloat(project.raisedAmount) > 0 && (
                <button
                  className="btn btn-success w-100 mb-3"
                  onClick={handleWithdrawFunds}
                  disabled={isPending}
                >
                  {isPending ? 'Withdrawing...' : 'Withdraw All Funds'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h3>Milestones</h3>
        {address?.toLowerCase() === project?.creator.toLowerCase() && project.isActive && (
          <button
            className="btn btn-primary mb-3"
            onClick={() => setIsAddingMilestone(true)}
          >
            Add Milestone
          </button>
        )}

        {isAddingMilestone && (
          <div className="card mb-3">
            <div className="card-body">
              <h5 className="card-title">Add New Milestone</h5>
              <form onSubmit={handleAddMilestone}>
                <div className="mb-3">
                  <label htmlFor="milestoneDescription" className="form-label">Description</label>
                  <input
                    type="text"
                    className="form-control"
                    id="milestoneDescription"
                    value={newMilestone.description}
                    onChange={(e) => setNewMilestone(prev => ({ ...prev, description: e.target.value }))}
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="milestoneAmount" className="form-label">Amount (ETH)</label>
                  <input
                    type="number"
                    className="form-control"
                    id="milestoneAmount"
                    value={newMilestone.amount}
                    onChange={(e) => setNewMilestone(prev => ({ ...prev, amount: e.target.value }))}
                    step="0.01"
                    min="0.01"
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="d-flex gap-2">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isPending}
                  >
                    {isPending ? 'Adding...' : 'Add Milestone'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsAddingMilestone(false)}
                    disabled={isPending}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="list-group">
          {milestones.map((milestone, index) => (
            <div key={index} className="list-group-item">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-1">Milestone {index + 1}</h5>
                  <p className="mb-1">{milestone.description}</p>
                  <small className="text-muted">Amount: {milestone.amount} ETH</small>
                  {milestoneImagePreviews[index] && (
                    <div className="mt-2">
                      <img src={milestoneImagePreviews[index]} alt="Milestone Preview" style={{ maxWidth: 120, maxHeight: 120, borderRadius: 8 }} />
                    </div>
                  )}
                  {milestoneSubmissions[index] && (
                    <div className="mt-2">
                      <span className="badge bg-warning text-dark">Submitted for Review</span>
                    </div>
                  )}
                </div>
                <div className="d-flex gap-2">
                  {address?.toLowerCase() === project?.creator.toLowerCase() && !milestone.isCompleted && project.isActive && (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        id={`milestone-image-upload-${index}`}
                        onChange={e => handleMilestoneImageChange(index, e.target.files ? e.target.files[0] : null)}
                      />
                      <label htmlFor={`milestone-image-upload-${index}`} className="btn btn-outline-secondary btn-sm">
                        {milestoneImages[index] ? 'Change Image' : 'Upload Image'}
                      </label>
                      <button
                        className="btn btn-info"
                        onClick={() => handleSubmitMilestone(index)}
                        disabled={milestoneSubmissions[index]}
                      >
                        {milestoneSubmissions[index] ? 'Submitted' : 'Submit for Review'}
                      </button>
                      <button
                        className="btn btn-success"
                        onClick={() => handleCompleteMilestone(index)}
                      >
                        Mark Complete
                      </button>
                    </>
                  )}
                  {milestone.isCompleted && (
                    <span className="badge bg-success">Completed</span>
                  )}
                  {milestone.isFunded && (
                    <span className="badge bg-info">Funded</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Export the component with dynamic import to prevent hydration errors
const ProjectDetails = dynamic(() => Promise.resolve(ProjectDetailsContent), {
  ssr: false,
});

export default ProjectDetails; 