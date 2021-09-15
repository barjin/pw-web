import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from 'react-router-dom';
import RecordingScreen from './screens/RecordingScreen';
import HomeScreen from './screens/HomeScreen';

export default function App() : JSX.Element {
  useEffect(() => {
    document.title = 'PWww 🎭';
  });
  return (
    <Router>
      <div>
        <Switch>
          <Route path="/recording" component={RecordingScreen} />
          <Route path="/" component={HomeScreen} />
        </Switch>
      </div>
    </Router>
  );
}
