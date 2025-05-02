import React from 'react';

interface Project {
  id: number;
  title: string;
  description: string;
  targetAmount: number;
  raisedAmount: number;
  imageUrl?: string;
}

interface DonationCardProps {
  project: Project;
  isSelected: boolean;
  onSelect: () => void;
}

const DonationCard: React.FC<DonationCardProps> = ({ project, isSelected, onSelect }) => {
  const progressPercentage = (project.raisedAmount / project.targetAmount) * 100;

  return (
    <div 
      className={`card ${isSelected ? 'border-primary' : ''} h-100`}
      onClick={onSelect}
      style={{ cursor: 'pointer' }}
    >
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
        
        <div className="progress mb-3">
          <div 
            className="progress-bar" 
            role="progressbar" 
            style={{ width: `${progressPercentage}%` }}
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            {progressPercentage.toFixed(1)}%
          </div>
        </div>
        
        <div className="d-flex justify-content-between">
          <span>Raised: {project.raisedAmount} ETH</span>
          <span>Target: {project.targetAmount} ETH</span>
        </div>
      </div>
    </div>
  );
};

export default DonationCard; 