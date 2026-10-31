import ArticleCards from './ArticleCards.jsx';

export default function LatestArticles({ posts, title = 'Latest' }) {
  return (
    <div className="article-container">
      <div className="container article-class">
        <h2>
          <span className="Latest">{title}</span> <span className="art-color">Articles</span>
        </h2>
        <ArticleCards posts={posts} />
      </div>
    </div>
  );
}
