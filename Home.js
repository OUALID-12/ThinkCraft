import React, { useState } from 'react';
import './Home.css';
import DiagramEditor from './components/DiagramEditor';
import backgroundImage from './assets/background.jpg';

const LandingPage = () => {
  const [showDiagramEditor, setShowDiagramEditor] = useState(false);

  const handleNewProjectClick = () => {
    setShowDiagramEditor(true);
  };

  return (
    <div
      className={`landing-page ${showDiagramEditor ? 'editor-active' : ''}`}
      style={{
        backgroundImage: !showDiagramEditor ? `url(${backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        height: '100vh',
        width: '100%',
        margin: 0,
        padding: 0,
        backgroundAttachment: 'fixed',
      }}
    >
      {!showDiagramEditor ? (
        <>
          
          <div className="buttons-container">
            <div className="actions">
              <button className="new-project-btn" onClick={handleNewProjectClick}>
              Class Diagram
              </button>
            </div>

            <div className="extra-actions">
              <button className="help-btn">Use Case Diagram</button>
              <button className="settings-btn">Sequence Diagram</button>
            </div>
          </div>
          

         
        </>
      ) : (
        <DiagramEditor />
      )}
    </div>
  );
};

export default LandingPage;
