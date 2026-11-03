import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Article from './pages/Article.jsx';
import Category from './pages/Category.jsx';
import Search from './pages/Search.jsx';
import Blog from './pages/Blog.jsx';
import PrivacyPolicy from './pages/PrivacyPolicy.jsx';
import About from './pages/About.jsx';
import ContactUs from './pages/ContactUs.jsx';
import NotFound from './pages/NotFound.jsx';

function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/category/:slug" element={<Category />} />
        <Route path="/search" element={<Search />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacypolicy" element={<PrivacyPolicy />} />
        <Route path="/contactus" element={<ContactUs />} />
        <Route path="/:slug" element={<Article />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </>
  );
}
