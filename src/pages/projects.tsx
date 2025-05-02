import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAccount, useReadContract } from 'wagmi';
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

const ProjectsContent: React.FC = () => {
  const router = useRouter();
  const { address } = useAccount();
  const [projects, setProjects] = useState<(Project & { milestones: Milestone[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Get details for each project
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
            console.log(`Fetching project ${i}`);
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

            console.log(`Project ${i} data:`, response.data);

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

            console.log(`Project ${i} processed:`, loadedProjects[loadedProjects.length - 1]);
          } catch (err) {
            console.error(`Error loading project ${i}:`, err);
          }
        }

        console.log('All loaded projects:', loadedProjects);
        setProjects(loadedProjects);
      } catch (err) {
        console.error('Error loading projects:', err);
        setError('Failed to load projects. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [projectCount]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const calculateProgress = (raised: string, target: string) => {
    const raisedNum = parseFloat(raised);
    const targetNum = parseFloat(target);
    return Math.min((raisedNum / targetNum) * 100, 100);
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading projects...</p>
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
      <h1 className="text-center mb-4">All Projects</h1>
      
      {projects.length === 0 ? (
        <div className="text-center">
          <p>No projects found. Be the first to create one!</p>
          {!address && (
            <p className="text-muted">
              Connect your wallet to create a new project.
            </p>
          )}
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {projects.map((project) => (
            <div key={project.id} className="col">
              <div className="card h-100">
                {project.imageUrl ? (
                  <img 
                    src={project.imageUrl} 
                    className="card-img-top" 
                    alt={project.title}
                    style={{ height: '200px', objectFit: 'cover' }}
                  />
                ) : (
                  <div 
                    className="card-img-top bg-secondary" 
                    style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <span className="text-white">No Image</span>
                  </div>
                )}
                
                <div className="card-body">
                  <h5 className="card-title">{project.title}</h5>
                  <p className="card-text text-muted">
                    Created by: {project.creator.slice(0, 6)}...{project.creator.slice(-4)}
                  </p>
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
                        style={{ width: `${calculateProgress(project.raisedAmount, project.targetAmount)}%` }}
                      >
                        {Math.round(calculateProgress(project.raisedAmount, project.targetAmount))}%
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      Deadline: {formatDate(project.deadline)}
                    </small>
                    <span className={`badge ${project.isActive ? 'bg-success' : 'bg-danger'}`}>
                      {project.isActive ? 'Active' : 'Ended'}
                    </span>
                  </div>
                </div>

                <div className="card-footer">
                  <button 
                    className="btn btn-primary w-100"
                    onClick={() => router.push(`/project/${project.id}`)}
                  >
                    View Details
                  </button>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Export the component with dynamic import to prevent hydration errors
const Projects = dynamic(() => Promise.resolve(ProjectsContent), {
  ssr: false,
});

export default Projects; 