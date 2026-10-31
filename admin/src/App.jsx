import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { api, getToken, setToken } from './api.js';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Posts from './pages/Posts.jsx';
import PostEditor from './pages/PostEditor.jsx';
import Categories from './pages/Categories.jsx';
import Homepage from './pages/Homepage.jsx';
import Messages from './pages/Messages.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = still checking the saved session

  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener('auth:logout', onLogout);
    if (getToken()) {
      api('/auth/me')
        .then((d) => setUser(d.username))
        .catch(() => setUser(null));
    } else {
      setUser(null);
    }
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  if (user === undefined)
    return (
      <div className="center-screen">
        <div className="spinner"></div>
      </div>
    );

  if (!user) return <Login onLogin={setUser} />;

  return (
    <Routes>
      <Route element={<Layout user={user} onLogout={logout} />}>
        <Route index element={<Dashboard />} />
        <Route path="posts" element={<Posts />} />
        <Route path="posts/new" element={<PostEditor />} />
        <Route path="posts/:id" element={<PostEditor />} />
        <Route path="categories" element={<Categories />} />
        <Route path="homepage" element={<Homepage />} />
        <Route path="messages" element={<Messages />} />
        <Route path="settings" element={<Settings onUserChange={setUser} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
