import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { contractAddress, contractABI } from '../contracts/contractConfig';
import { formatEther } from 'viem';
import dynamic from 'next/dynamic';

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

interface Milestone {
  description: string;
  amount: string;
  isCompleted: boolean;
  isFunded: boolean;
}

const ManageProjectsContent: React.FC = () => {
  const router = useRouter();
  const { address } = useAccount();
  const [projects, setProjects] = useState<(Project & { milestones: Milestone[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const { writeContractAsync } = useWriteContract();
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  // Get the total number of projects
  const { data: projectCount } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'getProjectCount',
    chainId: sepolia.id,
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

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!projectCount) {
          console.log('No project count available');
          setLoading(false);
          return;
        }

        const count = Number(projectCount);
        console.log('Project count:', count);

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
            
            if (response.error) {
              console.error(`Error loading project ${i}:`, response.error);
              continue;
            }

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

            // Only include projects created by the current user
            if (creator.toLowerCase() === address?.toLowerCase()) {
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
                deadline: Number(deadline) * 1000,
                milestones
              });
            }
          } catch (err) {
            console.error(`Error loading project ${i}:`, err);
          }
        }

        setProjects(loadedProjects);
      } catch (err) {
        console.error('Error loading projects:', err);
        setError('Failed to load projects. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (address) {
      loadProjects();
    }
  }, [projectCount, address]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const calculateProgress = (raised: string, target: string) => {
    const raisedNum = parseFloat(raised);
    const targetNum = parseFloat(target);
    return Math.min((raisedNum / targetNum) * 100, 100);
  };

  const handleCancelProject = async (projectId: number) => {
    setCancelingId(projectId);
    setTxError(null);
    try {
      await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'cancelProject',
        args: [BigInt(projectId)],
        chain: sepolia,
        account: address as `0x${string}`,
      });
      // Refresh projects after cancellation
      window.location.reload();
    } catch (err: any) {
      setTxError(err?.message || 'Transaction failed');
    } finally {
      setCancelingId(null);
    }
  };

  const handleWithdrawFunds = async (projectId: number) => {
    setWithdrawingId(projectId);
    setWithdrawError(null);
    try {
      await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'withdrawFunds',
        args: [BigInt(projectId)],
        chain: sepolia,
        account: address as `0x${string}`,
      });
      window.location.reload();
    } catch (err: any) {
      setWithdrawError(err?.message || 'Transaction failed');
    } finally {
      setWithdrawingId(null);
    }
  };

  if (!address) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        <div className="container py-5">
          <div className="text-center">
            <h2 style={{ fontWeight: 700, color: '#4f46e5' }}>Manage Projects</h2>
            <p className="lead">Please connect your wallet to manage your projects.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        <div className="container py-5">
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading your projects...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        <div className="container py-5">
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      <div className="container py-5">
        {/* Hero Section */}
        <div className="text-center mb-5" style={{ padding: '2.5rem 0 2rem 0', borderRadius: '1.5rem', background: 'rgba(255,255,255,0.95)', boxShadow: '0 4px 24px rgba(80,80,120,0.08)' }}>
          <img src="https://img.icons8.com/color/96/ethereum.png" alt="Manage Projects" style={{ width: 80, marginBottom: 18, borderRadius: '50%', boxShadow: '0 2px 12px rgba(80,80,120,0.10)' }} />
          <h1 className="display-4 mb-2" style={{ fontWeight: 700, color: '#4f46e5' }}>Manage Your Projects</h1>
          <p className="lead" style={{ color: '#444', fontWeight: 500 }}>View, manage, and track the progress of your created projects.</p>
        </div>
        {projects.length === 0 ? (
          <div className="text-center">
            <p>You haven't created any projects yet.</p>
            <a href="/create" className="btn btn-primary">
              Create Your First Project
            </a>
          </div>
        ) : (
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
            {projects.map((project) => (
              <div key={project.id} className="col">
                <div className="card h-100 shadow-sm border-0 project-card" style={{ borderRadius: '1.25rem', transition: 'transform 0.18s, box-shadow 0.18s' }}>
                  {project.imageUrl ? (
                    <img 
                      src={project.imageUrl} 
                      className="card-img-top" 
                      alt={project.title}
                      style={{ height: '200px', objectFit: 'cover', borderTopLeftRadius: '1.25rem', borderTopRightRadius: '1.25rem' }}
                    />
                  ) : (
                    <div 
                      className="card-img-top bg-secondary" 
                      style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: '1.25rem', borderTopRightRadius: '1.25rem' }}
                    >
                      <span className="text-white">No Image</span>
                    </div>
                  )}
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title mb-1" style={{ fontWeight: 600, color: '#4f46e5' }}>{project.title}</h5>
                    <p className="card-text mb-2" style={{ color: '#333', minHeight: 48 }}>{project.description}</p>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span>Progress</span>
                        <span>
                          {project.raisedAmount} ETH / {project.targetAmount} ETH
                        </span>
                      </div>
                      <div className="progress" style={{ height: 10, borderRadius: 8 }}>
                        <div 
                          className="progress-bar bg-gradient" 
                          role="progressbar" 
                          style={{ width: `${calculateProgress(project.raisedAmount, project.targetAmount)}%`, background: 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)', borderRadius: 8 }}
                        >
                          <span style={{ fontSize: '0.9em', color: '#fff', fontWeight: 500 }}>
                            {Math.round(calculateProgress(project.raisedAmount, project.targetAmount))}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <small className="text-muted">
                        Deadline: {formatDate(project.deadline)}
                      </small>
                      <span className={`badge ${project.isActive ? 'bg-success' : 'bg-danger'}`} style={{ fontSize: '0.97em', padding: '0.5em 0.9em', borderRadius: '0.7em' }}>
                        {project.isActive ? 'Active' : 'Ended'}
                      </span>
                    </div>
                    <div className="mb-2">
                      <h6 style={{ fontWeight: 600, color: '#4f46e5', fontSize: '1.05em' }}>Milestones</h6>
                      {project.milestones.length === 0 ? (
                        <p className="text-muted">No milestones yet.</p>
                      ) : (
                        <ul className="list-group list-group-flush">
                          {project.milestones.map((milestone, idx) => (
                            <li key={idx} className="list-group-item d-flex justify-content-between align-items-center" style={{ fontSize: '0.97em', background: 'transparent' }}>
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
                    <button 
                      className="btn btn-primary w-100 mt-auto"
                      style={{ fontWeight: 600, borderRadius: '0.7em', background: 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)', border: 'none' }}
                      onClick={() => router.push(`/project/${project.id}`)}
                    >
                      Manage Project
                    </button>
                    {/* Cancel Project button for active projects */}
                    {project.isActive && (
                      <button
                        className="btn btn-danger w-100 mt-2"
                        onClick={() => handleCancelProject(project.id)}
                        disabled={cancelingId === project.id}
                        style={{ fontWeight: 600, borderRadius: '0.7em' }}
                      >
                        {cancelingId === project.id ? 'Cancelling...' : 'Cancel Project'}
                      </button>
                    )}
                    {/* Withdraw Funds button for ended projects */}
                    {!project.isActive && (
                      <button
                        className="btn btn-success w-100 mt-2"
                        onClick={() => handleWithdrawFunds(project.id)}
                        disabled={withdrawingId === project.id || parseFloat(project.raisedAmount) === 0}
                        style={{ fontWeight: 600, borderRadius: '0.7em' }}
                      >
                        {withdrawingId === project.id ? 'Withdrawing...' : 'Withdraw Funds'}
                      </button>
                    )}
                    {/* Show error if transaction fails */}
                    {txError && cancelingId === project.id && (
                      <div className="alert alert-danger mt-2" role="alert">
                        {txError}
                      </div>
                    )}
                    {withdrawError && withdrawingId === project.id && (
                      <div className="alert alert-danger mt-2" role="alert">
                        {withdrawError}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <style jsx>{`
        .project-card:hover {
          transform: translateY(-6px) scale(1.03);
          box-shadow: 0 8px 32px rgba(79,70,229,0.13);
        }
      `}</style>
    </div>
  );
};

// Export the component with dynamic import to prevent hydration errors
const ManageProjects = dynamic(() => Promise.resolve(ManageProjectsContent), {
  ssr: false,
});

export default ManageProjects; 