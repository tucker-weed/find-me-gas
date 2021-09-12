import React, { useState } from "react";
import "./App.css";
import axios from "axios";

const config = {
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
  },
};

function App() {
  const [message, setMessage] = useState("");

  return (
    <div className="App">
      <span>{message}</span>
      <br />
      <button
        onClick={() => {
          axios
            .get("http://localhost:6001", config)
            .then(({ data }) => setMessage(message + data + " "));
        }}
      >
        ping
      </button>
    </div>
  );
}

export default App;
