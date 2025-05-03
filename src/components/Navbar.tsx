import React from 'react';
import dynamic from 'next/dynamic';
import { useAccount } from 'wagmi';

const WalletConnect = dynamic(() => import('./WalletConnect'), {
  ssr: false,
});

// Client-only component for Manage Projects link
const ManageProjectsLink = dynamic(() => Promise.resolve(() => {
  const { isConnected } = useAccount();
  if (!isConnected) return null;
  return (
    <li className="nav-item">
      <a className="nav-link" href="/manage">
        Manage Projects
      </a>
    </li>
  );
}), { ssr: false });

// Client-only component for Create Project link
const CreateProjectLink = dynamic(() => Promise.resolve(() => {
  const { isConnected } = useAccount();
  if (!isConnected) return null;
  return (
    <li className="nav-item">
      <a className="nav-link" href="/create">
        Create Project
      </a>
    </li>
  );
}), { ssr: false });

const Navbar: React.FC = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark" style={{ 
      background: 'linear-gradient(90deg, #1a1a1a 0%, #2d2d2d 100%)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      padding: '1rem 0'
    }}>
      <div className="container">
        <a className="navbar-brand d-flex align-items-center" href="/" style={{ fontSize: '1.5rem', fontWeight: '600' }}>
          <span style={{ color: '#4f46e5' }}>Clear</span>
          <span style={{ color: '#fff' }}>Fund</span>
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto" style={{ gap: '1rem' }}>
            <li className="nav-item">
              <a className="nav-link nav-link-custom" href="/" style={{ 
                fontWeight: '500',
                transition: 'color 0.2s ease'
              }}>
                Home
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link nav-link-custom" href="/projects" style={{ 
                fontWeight: '500',
                transition: 'color 0.2s ease'
              }}>
                Projects
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link nav-link-custom" href="/help" style={{ 
                fontWeight: '500',
                transition: 'color 0.2s ease'
              }}>
                Help
              </a>
            </li>
            <CreateProjectLink />
            <ManageProjectsLink />
          </ul>
          <div className="d-flex align-items-center">
            <WalletConnect />
          </div>
        </div>
      </div>
      <style jsx>{`
        .nav-link-custom:hover {
          color: #4f46e5 !important;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;