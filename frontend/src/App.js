import RecordingScreen from "./recordingScreen";
import HomeScreen from "./homeScreen";

import { useEffect } from 'react';

import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";

export default function App() {
  useEffect(() => {
    document.title = "PWww 🎭";
  });
  return (
    <Router>
      <div>
        <Switch>
          <Route path="/">
            <HomeScreen />
          </Route>
          <Route path="/recording">
            <RecordingScreen />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}