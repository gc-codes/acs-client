import React, { useState } from 'react';
import './App.css';
import Login from './Login';
import Dashboard from './Dashboard';

function App() {
  const [userDetails, setUserDetails] = useState(null);
  const [page, setPage] = useState("login");

  function getContent()
  {
    if (page === 'login')
    {
      return <Login {...{setUserDetails, setPage, userDetails}} />;
    }
    else if (page === 'dashboard')
    {
      return <Dashboard {...{userDetails}} />;
    }
  }

  return (
    <div className="App">
      {getContent()}
    </div>
  );
}

export default App;
