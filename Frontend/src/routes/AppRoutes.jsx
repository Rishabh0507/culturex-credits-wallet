import { Routes, Route } from 'react-router-dom';
import Placeholder from '../pages/Placeholder';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Placeholder />} />
    </Routes>
  );
}
