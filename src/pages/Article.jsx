import { Link, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import ArticleCards from '../components/ArticleCards.jsx';
import NotFound from './NotFound.jsx';
import useSeo from '../useSeo.js';
import { isRtl } from '../seo.js';
import { formatDate } from '../utils.js';
import { useApi } from '../api.js';
import { useSite, Loading } from '../data/SiteData.jsx';

export default function Article() {
  const { slug } = useParams();
  const { getCategory, latest: newest } = useSite();
  const { data, error } = useApi(`/api/posts/${encodeURIComponent(slug)}`);
  const post = data?.post;
  const postCategory = post && getCategory(post.category);
  useSeo(data === undefined ? { loading: true } : post ? { post, category: postCategory } : { notFound: true });

  if (data === undefined && !error) return <Loading />;
  if (!post) return <NotFound />;

  const category = postCategory ?? { slug: post.category, name: post.category };
  const dir = isRtl(post.lang) ? 'rtl' : undefined;
  const latest = newest.filter((p) => p.slug !== post.slug).slice(0, 6);
  const { related } = data;

  return (
    <>
      <div className="container detail-layout" id="mainContainer">
        {/* Each article is written in its own language; right-to-left scripts (Arabic, Urdu...) flip only the text */}
        <main className="main-content" lang={post.lang || 'en'}>
          <nav className="breadcrumb">
            <Link to="/">Home</Link> - <Link to={`/category/${category.slug}`}>{category.name}</Link> -{' '}
            <span>{post.title}</span>
          </nav>
          <h1 dir={dir}>{post.title}</h1>
          <div className="post-meta">
            <span>
              <i className="fa-regular fa-calendar"></i> {formatDate(post.date)}
            </span>
            <Link to={`/category/${category.slug}`}>
              <i className="fa-regular fa-folder"></i> {category.name}
            </Link>
          </div>
          {post.image && <img src={post.image} alt={post.title} className="post-image" />}
          <div className="post-content" dir={dir}>
            {post.excerpt && <p className="lead">{post.excerpt}</p>}
            {/* Content is HTML written in the admin panel's editor */}
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
        </main>
        <Sidebar posts={latest} />
      </div>
      {related.length > 0 && (
        <div className="container related">
          <h2 className="section-title">
            Related <span>Articles</span>
          </h2>
          <ArticleCards posts={related} />
        </div>
      )}
    </>
  );
}
