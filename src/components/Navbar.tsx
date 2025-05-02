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

const Navbar: React.FC = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <a className="navbar-brand" href="/">
          Micro-Donation Platform
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
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <a className="nav-link active" href="/">
                Home
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/projects">
                Projects
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/create">
                Create Project
              </a>
            </li>
            <ManageProjectsLink />
          </ul>
          <div className="d-flex">
            <WalletConnect />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;