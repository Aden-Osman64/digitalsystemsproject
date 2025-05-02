import React, { useEffect, useState } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { contractAddress, contractABI } from '../contracts/contractConfig';
import { formatEther } from 'viem';
import dynamic from 'next/dynamic';
import Notification from '../components/Notification';
import { sepolia } from 'wagmi/chains';

interface Project {
  id: number;
  creator: string;
  title: string;
  description: string;
  targetAmount: string;
  raisedAmount: string;
  imageUrl: string;
  isActive: boolean;
  deadline: number;
}

interface NotificationState {
  message: string;
  type: 'success' | 'error';
}

interface Milestone {
  description: string;
  amount: string;
  isCompleted: boolean;
  isFunded: boolean;
}

declare global {
  interface Window {
    loadedProjects?: Project[];
  }
}

const ManageProjectsContent: React.FC = () => {
  const { address } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const [projects, setProjects] = useState<(Project & { milestones: Milestone[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);

  const { data: projectCount } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getProjectCount',
  });

  const fetchMilestones = async (projectId: number) => {
    try {
      const publicClient = (await import('viem')).createPublicClient({ chain: sepolia, transport: (await import('viem')).http() });
      const milestoneCount = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'getMilestoneCount',
        args: [BigInt(projectId)],
      });
      const loadedMilestones: Milestone[] = [];
      for (let i = 0; i < Number(milestoneCount); i++) {
        const milestoneData = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: contractABI,
          functionName: 'getMilestoneDetails',
          args: [BigInt(projectId), BigInt(i)],
        });
        loadedMilestones.push({
          description: milestoneData[0],
          amount: formatEther(milestoneData[1]),
          isCompleted: milestoneData[2],
          isFunded: milestoneData[3],
        });
      }
      return loadedMilestones;
    } catch (error) {
      return [];
    }
  };

  const fetchProjects = async () => {
    if (!address || !projectCount) {
      setLoading(false);
      return;
    }
    try {
      const count = Number(projectCount);
      const loadedProjects: (Project & { milestones: Milestone[] })[] = [];
      for (let i = 0; i < count; i++) {
        try {
          const result = await fetch('/api/getProjectDetails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              projectId: i,
              contractAddress 
            }),
          });
          const response = await result.json();
          if (response.error) continue;
          const [
            creator,
            title,
            description,
            targetAmount,
            raisedAmount,
            imageUrl,
            isActive,
            deadline
          ] = response.data;
          if (creator.toLowerCase() === address.toLowerCase()) {
            const milestones = await fetchMilestones(i);
            loadedProjects.push({
              id: i,
              creator,
              title,
              description,
              targetAmount: formatEther(BigInt(targetAmount)),
              raisedAmount: formatEther(BigInt(raisedAmount)),
              imageUrl,
              isActive,
              deadline: Number(deadline),
              milestones
            });
          }
        } catch (err) {
          continue;
        }
      }
      setProjects(loadedProjects);
      setLoading(false);
      if (typeof window !== 'undefined') {
        window.loadedProjects = loadedProjects;
        console.log('Projects available in window.loadedProjects:', window.loadedProjects);
      }
    } catch (err) {
      setError('Failed to fetch projects. Please try again later.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [address, projectCount]);

  const handleCancelProject = async (projectId: number) => {
    setCancellingId(projectId);
    try {
      await writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'cancelProject',
        args: [projectId],
        chain: sepolia,
        account: address,
      });
      setNotification({ message: 'Project cancelled!', type: 'success' });
      // Refresh the project list after a short delay
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      setNotification({ message: 'Failed to cancel project', type: 'error' });
    } finally {
      setCancellingId(null);
    }
  };

  const handleWithdrawFunds = async (projectId: number) => {
    setWithdrawingId(projectId);
    try {
      await writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'withdrawFunds',
        args: [projectId],
        chain: sepolia,
        account: address,
      });
      setNotification({ message: 'Funds withdrawn successfully!', type: 'success' });
      // Refresh the project list after a short delay
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      setNotification({ message: 'Failed to withdraw funds', type: 'error' });
    } finally {
      setWithdrawingId(null);
    }
  };

  if (!address) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning">
          Please connect your wallet to manage projects.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading your projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <h1 className="text-center mb-4">Manage Your Projects</h1>
      
      {projects.length === 0 ? (
        <div className="alert alert-info">
          You haven't created any projects yet. <a href="/create">Create your first project</a>
        </div>
      ) : (
        <div className="row">
          {projects.map((project) => (
            <div key={project.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100">
                {project.imageUrl && (
                  <img 
                    src={project.imageUrl} 
                    className="card-img-top" 
                    alt={project.title}
                    style={{ height: '200px', objectFit: 'cover' }}
                  />
                )}
                <div className="card-body">
                  <h5 className="card-title">{project.title}</h5>
                  <p className="card-text">{project.description}</p>
                  
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
                        style={{ 
                          width: `${(parseFloat(project.raisedAmount) / parseFloat(project.targetAmount)) * 100}%` 
                        }}
                      >
                        {Math.round((parseFloat(project.raisedAmount) / parseFloat(project.targetAmount)) * 100)}%
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      Deadline: {new Date(project.deadline).toLocaleDateString()}
                    </small>
                    <span className={`badge ${project.isActive ? 'bg-success' : 'bg-danger'}`}>
                      {project.isActive ? 'Active' : 'Ended'}
                    </span>
                  </div>
                </div>
                <div className="card-footer">
                  <div className="d-grid gap-2">
                    <button 
                      className="btn btn-primary"
                      onClick={() => window.location.href = `/project/${project.id}`}
                    >
                      View Details
                    </button>
                    {project.isActive ? (
                      <button 
                        className="btn btn-danger"
                        disabled={isPending || cancellingId === project.id}
                        onClick={() => handleCancelProject(project.id)}
                      >
                        {isPending && cancellingId === project.id ? 'Cancelling...' : 'Cancel Project'}
                      </button>
                    ) : (
                      <button
                        className="btn btn-success"
                        onClick={() => handleWithdrawFunds(project.id)}
                        disabled={withdrawingId === project.id || project.raisedAmount === '0'}
                      >
                        {withdrawingId === project.id ? 'Withdrawing...' : 'Withdraw Funds'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-2">
                <h6>Milestones</h6>
                {project.milestones.length === 0 ? (
                  <p className="text-muted">No milestones yet.</p>
                ) : (
                  <ul className="list-group">
                    {project.milestones.map((milestone, idx) => (
                      <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                        <span>
                          <strong>{milestone.description}</strong> <br />
                          <small>{milestone.amount} ETH</small>
                        </span>
                        <span>
                          {milestone.isCompleted ? (
                            <span className="badge bg-success me-1">Completed</span>
                          ) : (
                            <span className="badge bg-secondary me-1">Incomplete</span>
                          )}
                          {milestone.isFunded && <span className="badge bg-info">Funded</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ManageProjects = dynamic(() => Promise.resolve(ManageProjectsContent), {
  ssr: false,
});

export default ManageProjects; 