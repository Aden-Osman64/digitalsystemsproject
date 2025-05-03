import React, { useEffect, useState } from 'react';
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

const HomeContent: React.FC = () => {
  const { address } = useAccount();
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Get the total number of projects
  const { data: projectCount } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'getProjectCount',
    chainId: sepolia.id,
  });

  useEffect(() => {
    const loadFeaturedProjects = async () => {
      try {
        setLoading(true);
        if (!projectCount) return;

        const count = Number(projectCount);
        const loadedProjects: Project[] = [];

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

            // Only include projects that have an image and are active
            if (imageUrl && isActive) {
              loadedProjects.push({
                id: i,
                creator,
                title,
                description,
                targetAmount: formatEther(BigInt(targetAmount)),
                raisedAmount: formatEther(BigInt(raisedAmount)),
                imageUrl,
                isActive,
                deadline: Number(deadline) * 1000
              });
            }
          } catch (err) {
            console.error(`Error loading project ${i}:`, err);
          }
        }

        // Sort by raised amount and take top 3
        const sortedProjects = loadedProjects
          .sort((a, b) => parseFloat(b.raisedAmount) - parseFloat(a.raisedAmount))
          .slice(0, 3);

        setFeaturedProjects(sortedProjects);
      } catch (err) {
        console.error('Error loading featured projects:', err);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedProjects();
  }, [projectCount]);

  return (
    <div>
      {/* Hero Section */}
      <section className="py-5 text-white text-center" style={{ background: 'linear-gradient(90deg, #2563eb 0%, #1e40af 100%)', minHeight: '480px', display: 'flex', alignItems: 'center' }}>
        <div className="container py-5">
          <h1 className="display-4 fw-bold mb-3">Transparent Funding for Impactful Projects</h1>
          <p className="lead mb-4">
            Support community initiatives with blockchain-powered transparency. Every donation is traceable, and funds are only released when milestones are achieved.
          </p>
          <div className="d-flex justify-content-center gap-3">
            <a href="/projects" className="btn btn-primary btn-lg">Explore Projects</a>
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section className="bg-white py-5">
        <div className="container">
          <h2 className="text-center mb-5">Featured Projects</h2>
          {loading ? (
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading featured projects...</p>
            </div>
          ) : featuredProjects.length > 0 ? (
            <div className="row row-cols-1 row-cols-md-3 g-4 justify-content-center">
              {featuredProjects.map((project) => (
                <div key={project.id} className="col">
                  <div className="card h-100 shadow-sm">
                    <img
                      src={project.imageUrl}
                      className="card-img-top"
                      alt={project.title}
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                    <div className="card-body">
                      <h5 className="card-title">{project.title}</h5>
                      <p className="card-text text-muted" style={{ minHeight: 48 }}>{project.description}</p>
                      <div className="progress mb-2">
                        <div 
                          className="progress-bar" 
                          role="progressbar" 
                          style={{ width: `${(parseFloat(project.raisedAmount) / parseFloat(project.targetAmount)) * 100}%` }}
                        >
                          {Math.round((parseFloat(project.raisedAmount) / parseFloat(project.targetAmount)) * 100)}%
                        </div>
                      </div>
                      <div className="d-flex justify-content-between">
                        <small>Raised: {project.raisedAmount} ETH</small>
                        <small>Target: {project.targetAmount} ETH</small>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center">
              <p>No featured projects available yet.</p>
              {!address && (
                <p className="text-muted">
                  Connect your wallet to create a new project.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-light py-5">
        <div className="container">
          <h2 className="text-center mb-5">How It Works</h2>
          <div className="row g-4">
            <div className="col-md-3">
              <div className="card h-100 text-center p-4">
                <div className="mb-3"><span className="fs-1 text-primary">🔗</span></div>
                <h5 className="fw-bold">Connect Wallet</h5>
                <p className="text-muted">Link your crypto wallet to make secure donations using ETH.</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card h-100 text-center p-4">
                <div className="mb-3"><span className="fs-1 text-success">🧑‍🤝‍🧑</span></div>
                <h5 className="fw-bold">Choose Project</h5>
                <p className="text-muted">Browse initiatives and select those that align with your values.</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card h-100 text-center p-4">
                <div className="mb-3"><span className="fs-1 text-info">🎯</span></div>
                <h5 className="fw-bold">Fund Milestones</h5>
                <p className="text-muted">Your donation is held in smart contracts until project milestones are verified.</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card h-100 text-center p-4">
                <div className="mb-3"><span className="fs-1 text-warning">📈</span></div>
                <h5 className="fw-bold">Track Impact</h5>
                <p className="text-muted">View transparent proof of progress stored permanently on IPFS.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Our Platform Is Different Section */}
      <section className="bg-dark text-white py-5">
        <div className="container">
          <h2 className="text-center mb-5">Why Our Platform Is Different</h2>
          <div className="row g-4 justify-content-center">
            <div className="col-md-4">
              <div className="text-center p-4">
                <div className="mb-3"><span className="fs-1 text-primary">🔒</span></div>
                <h5 className="fw-bold">Blockchain Transparency</h5>
                <p>Every transaction is recorded on the blockchain, creating an immutable audit trail of all donations.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="text-center p-4">
                <div className="mb-3"><span className="fs-1 text-success">✅</span></div>
                <h5 className="fw-bold">Milestone-Based Funding</h5>
                <p>Funds are only released when project milestones are verified, ensuring accountability.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="text-center p-4">
                <div className="mb-3"><span className="fs-1 text-warning">🗂️</span></div>
                <h5 className="fw-bold">IPFS Proof Storage</h5>
                <p>Project updates and evidence are stored on IPFS, making them tamper-proof and permanently accessible.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Export the component with dynamic import to prevent hydration errors
const Home = dynamic(() => Promise.resolve(HomeContent), {
  ssr: false,
});

export default Home; 