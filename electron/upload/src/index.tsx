import React from "react"
import { createRoot } from "react-dom/client"
import App from "./App"
import "./index.css"

const container = document.getElementById("root")

if (!container) {
  throw new Error("Root element not found")
}

const root = createRoot(container)

window.addEventListener('error', (event) => {
  const errorDiv = document.createElement('div');
  errorDiv.style.color = 'red';
  errorDiv.style.padding = '20px';
  errorDiv.style.background = 'white';
  errorDiv.innerHTML = `<h1>Runtime Error</h1><pre>${event.error?.message || event.message}</pre><pre>${event.error?.stack}</pre>`;
  document.body.prepend(errorDiv);
});

window.addEventListener('unhandledrejection', (event) => {
  const errorDiv = document.createElement('div');
  errorDiv.style.color = 'red';
  errorDiv.style.padding = '20px';
  errorDiv.style.background = 'white';
  errorDiv.innerHTML = `<h1>Unhandled Promise Rejection</h1><pre>${event.reason?.message || event.reason}</pre><pre>${event.reason?.stack}</pre>`;
  document.body.prepend(errorDiv);
});

try {
  root.render(<App />)
} catch (e: any) {
  container.innerHTML = `<div style="color:red;padding:20px"><h1>Render Error</h1><pre>${e.message}</pre><pre>${e.stack}</pre></div>`
}

