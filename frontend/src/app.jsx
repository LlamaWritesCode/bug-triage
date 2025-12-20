import { useState } from 'preact/hooks';
import { BugCollector } from './collector';

// Start recording signals immediately
const collector = new BugCollector();

export function App() {
  const [status, setStatus] = useState("Idle");

const sendReport = async () => {
    setStatus("Capturing...");
    const bundle = collector.getBundle();
    
    try {
      const response = await fetch('http://localhost:3000/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bundle),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Server responded:", result);
        setStatus("Sent!");
        alert("Bug reported successfully!");
      } else {
        setStatus("Error");
        console.error("Server error:", response.statusText);
      }
    } catch (error) {
      setStatus("Failed");
      console.error("Could not connect to backend:", error);
    }

    setTimeout(() => setStatus("Idle"), 2000);
  };
  
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Bug Reporter (JS Version)</h1>
      
      <button onClick={() => console.error("Database Error: 500")}>
        Trigger Fake Error
      </button>

      <button 
        onClick={sendReport}
        style={{
          position: 'fixed', bottom: '20px', right: '20px',
          padding: '15px 25px', borderRadius: '50px',
          backgroundColor: '#ff4757', color: 'white', border: 'none',
          cursor: 'pointer', fontWeight: 'bold'
        }}
      >
        {status === "Idle" ? "Report Bug" : status}
      </button>
    </div>
  );
}