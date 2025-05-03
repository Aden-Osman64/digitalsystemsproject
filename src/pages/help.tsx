import React from 'react';
import Head from 'next/head';

const steps = [
  {
    title: 'Install MetaMask',
    description: "Download and install the MetaMask extension from the official website or your browser's extension store.",
    image: 'https://img.icons8.com/color/96/metamask-logo.png',
    link: 'https://metamask.io/download/'
  },
  {
    title: 'Create or Import a Wallet',
    description: 'Open MetaMask and follow the prompts to create a new wallet or import an existing one using your seed phrase.',
    image: 'https://img.icons8.com/fluency/96/wallet.png',
    link: null
  },
  {
    title: 'Connect MetaMask to This Site',
    description: 'Click the Connect Wallet button on our site. MetaMask will prompt you to approve the connection.',
    image: 'https://img.icons8.com/fluency/96/link.png',
    link: null
  },
  {
    title: 'Switch to the Correct Network',
    description: 'Make sure MetaMask is set to the Sepolia test network (or the network this app uses). You can switch networks in the MetaMask dropdown.',
    image: 'https://img.icons8.com/fluency/96/network.png',
    link: null
  },
];

const Help = () => (
  <>
    <Head>
      <title>How to Connect with MetaMask | Help</title>
    </Head>
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      paddingBottom: 0
    }}>
      <div className="container py-5">
        {/* Hero Section */}
        <div className="text-center mb-5" style={{ padding: '2.5rem 0 2rem 0', borderRadius: '1.5rem', background: 'rgba(255,255,255,0.95)', boxShadow: '0 4px 24px rgba(80,80,120,0.08)' }}>
          <img src="https://img.icons8.com/color/96/metamask-logo.png" alt="MetaMask Logo" style={{ width: 90, marginBottom: 18, borderRadius: '50%', boxShadow: '0 2px 12px rgba(80,80,120,0.10)' }} />
          <h1 className="display-4 mb-2" style={{ fontWeight: 700, color: '#4f46e5' }}>How to Connect with MetaMask</h1>
          <p className="lead" style={{ color: '#444', fontWeight: 500 }}>Follow these steps to get started with MetaMask and connect your wallet to our platform.</p>
        </div>
        {/* Steps Section */}
        <div className="row g-4 mb-5">
          {steps.map((step, idx) => (
            <div className="col-12 col-md-6 col-lg-3" key={idx}>
              <div className="card h-100 shadow-sm border-0 step-card" style={{ borderRadius: '1.25rem', transition: 'transform 0.18s, box-shadow 0.18s' }}>
                <div className="card-body text-center d-flex flex-column align-items-center justify-content-center">
                  <img src={step.image} alt={step.title} style={{ width: 64, height: 64, marginBottom: 16, borderRadius: '50%', background: '#f5f7fa', boxShadow: '0 2px 8px rgba(80,80,120,0.08)' }} />
                  <h5 className="card-title mb-2" style={{ fontWeight: 600, color: '#4f46e5' }}>{step.title}</h5>
                  <p className="card-text mb-2" style={{ color: '#333', minHeight: 60 }}>{step.description}</p>
                  {step.link && (
                    <a href={step.link} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm mt-auto">Go to MetaMask</a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Troubleshooting Section */}
        <div className="row justify-content-center mb-5">
          <div className="col-lg-8">
            <div className="alert alert-info p-4" style={{ borderRadius: '1.25rem', background: 'rgba(79,70,229,0.08)', border: 'none', color: '#333' }}>
              <h5 style={{ color: '#4f46e5', fontWeight: 600 }}>Troubleshooting Tips</h5>
              <ul className="mb-1" style={{ fontSize: '1.08rem' }}>
                <li>Make sure your browser supports MetaMask (Chrome, Firefox, Brave, Edge).</li>
                <li>If you don't see the connect prompt, refresh the page and try again.</li>
                <li>Ensure you are on the correct network (Sepolia testnet, etc.).</li>
                <li>MetaMask not detected? <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">Install MetaMask</a>.</li>
                <li>Still having issues? Try disabling other wallet extensions or contact support.</li>
              </ul>
            </div>
          </div>
        </div>
        {/* Support Section */}
        <div className="text-center pb-5">
          <div style={{ display: 'inline-block', background: 'rgba(79,70,229,0.08)', borderRadius: '1.25rem', padding: '2rem 2.5rem', boxShadow: '0 2px 12px rgba(80,80,120,0.08)' }}>
            <h5 style={{ color: '#4f46e5', fontWeight: 600 }}>Need more help?</h5>
            <p style={{ color: '#333', fontSize: '1.1rem' }}>
              Visit the <a href="https://metamask.io/faqs/" target="_blank" rel="noopener noreferrer">MetaMask FAQ</a> or <a href="https://support.metamask.io/" target="_blank" rel="noopener noreferrer">MetaMask Support</a>.
            </p>
          </div>
        </div>
      </div>
      <style jsx>{`
        .step-card:hover {
          transform: translateY(-6px) scale(1.03);
          box-shadow: 0 8px 32px rgba(79,70,229,0.13);
        }
      `}</style>
    </div>
  </>
);

export default Help; 