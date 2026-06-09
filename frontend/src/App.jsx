import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Books from './pages/Books';
import BookDetail from './pages/BookDetail';
import Authors from './pages/Authors';
import Categories from './pages/Categories';
import Loans from './pages/Loans';
import Members from './pages/Members';
import MemberDetail from './pages/MemberDetail';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/books" element={<Books />} />
          <Route path="/books/:id" element={<BookDetail />} />
          <Route path="/authors" element={<Authors />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/profile" element={<Profile />} />

          <Route element={<ProtectedRoute roles={['ADMIN', 'LIBRARIAN']} />}>
            <Route path="/members" element={<Members />} />
            <Route path="/members/:id" element={<MemberDetail />} />
          </Route>
        </Route>
      </Route>

      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
