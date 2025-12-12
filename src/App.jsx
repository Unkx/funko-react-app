// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom"; // Import routing components


import reactLogo from '/src/assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import WelcomeSite from "./WelcomeSite";
import { NetworkProvider } from './NetworkContext'; // Importujemy kontekst
import SearchSite from "./SearchSite";

function App() {
  const [count, setCount] = React.useState(0);

  return (
    <BrowserRouter>
      {/* Header */}
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>

      {/* Define routes */}
      <Routes>
        {/* Root route with Layout as the wrapper */}
        <Route path="/" element={<Layout />} />
        <Route path="/welcome" element={<WelcomeSite />} />
        <Route path="/searchsite" element={<SearchSite />} />
        <Route path="/loginregistersite" element={<LoginSite/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;