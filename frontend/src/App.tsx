import RecordingScreen from "./screens/recordingScreen";
import HomeScreen from "./screens/homeScreen";

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
          <Route path="/recording" component={RecordingScreen}/>
          <Route path="/" component={HomeScreen}/>
        </Switch>
      </div>
    </Router>
  );
}