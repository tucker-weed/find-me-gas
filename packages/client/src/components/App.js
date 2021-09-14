import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import "./App.css";
import SpotifyController from "./spotify-controller.js";

function App() {
  return (
    <div className="App">
      <Router>
        <Switch>
          <Route
            path="/:slug"
            render={(routeProps) => (
              <SpotifyController postAuth={routeProps.match.params.slug} />
            )}
          />
          <Route path="/" render={() => <SpotifyController postAuth={""} />} />
        </Switch>
      </Router>
    </div>
  );
}

export default App;
