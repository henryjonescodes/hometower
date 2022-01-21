import './App.css';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Tower from './pages/Tower';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Tower/>} exact/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
