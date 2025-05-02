import { useState } from 'react';
import DonationCard from '../components/DonationCard';
import DonationForm from '../components/DonationForm';
import FileUploader from '../components/FileUploader';
import TransactionDetails from '../components/TransactionDetails';

// Dummy data for donation projects
const dummyProjects = [
  {
    id: 1,
    title: 'Clean Water Initiative',
    description: 'Providing clean water access to rural communities',
    targetAmount: 10000,
    raisedAmount: 5000,
  },
  {
    id: 2,
    title: 'Education Fund',
    description: 'Supporting underprivileged students with educational resources',
    targetAmount: 15000,
    raisedAmount: 7500,
  },
];

export default function Home() {
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [ipfsLink, setIpfsLink] = useState<string>('');

  return (
    <div className="container py-5">
      <h1 className="text-center mb-5">Blockchain Micro-Donation Platform</h1>

      <div className="row">
        <div className="col-md-8">
          <h2 className="mb-4">Available Projects</h2>
          <div className="row">
            {dummyProjects.map((project) => (
              <div key={project.id} className="col-md-6 mb-4">
                <DonationCard
                  project={project}
                  isSelected={selectedProject === project.id}
                  onSelect={() => setSelectedProject(project.id)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="col-md-4">
          {selectedProject && (
            <>
              <h2 className="mb-4">Make a Donation</h2>
              <DonationForm
                projectId={selectedProject}
                onDonationSuccess={(hash) => setTransactionHash(hash)}
              />
              
              <h2 className="mt-5 mb-4">Upload Progress</h2>
              <FileUploader
                projectId={selectedProject}
                onUploadSuccess={(link) => setIpfsLink(link)}
              />
            </>
          )}
        </div>
      </div>

      {(transactionHash || ipfsLink) && (
        <div className="row mt-5">
          <div className="col-12">
            <TransactionDetails
              transactionHash={transactionHash}
              ipfsLink={ipfsLink}
            />
          </div>
        </div>
      )}
    </div>
  );
} 