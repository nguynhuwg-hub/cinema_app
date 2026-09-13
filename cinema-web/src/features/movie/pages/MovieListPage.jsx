import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { genreApi, movieApi } from '../api/movieApi';

const MovieListPage = () => {
  const [movies, setMovies] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [genres, setGenres] = useState([]);
  const [status, setStatus] = useState('');
  const [genreId, setGenreId] = useState('');
  const [activePoster, setActivePoster] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError('');
    movieApi.getAll({ keyword: keyword || undefined, status: status || undefined, genreId: genreId || undefined })
      .then(setMovies)
      .catch(() => setError('Không thể tải danh sách phim. Hãy kiểm tra kết nối backend.'))
      .finally(() => setLoading(false));
  }, [keyword, status, genreId]);

  useEffect(() => { genreApi.getAll().then(setGenres).catch(() => setGenres([])); }, []);

  const posterMovies = useMemo(() => movies.filter((movie) => movie.posterUrl), [movies]);
  const featured = posterMovies[activePoster] || movies[0];

  useEffect(() => { setActivePoster(0); }, [keyword, status, genreId]);

  useEffect(() => {
    if (posterMovies.length < 2) return undefined;
    const timer = window.setInterval(() => setActivePoster((current) => (current + 1) % posterMovies.length), 6500);
    return () => window.clearInterval(timer);
  }, [posterMovies.length]);

  const movePoster = (direction) => {
    if (!posterMovies.length) return;
    setActivePoster((current) => (current + direction + posterMovies.length) % posterMovies.length);
  };

  return (
    <>
      <div className="home-cinema-background" aria-hidden="true">
        {posterMovies.map((movie, index) => <div className={`home-backdrop ${index === activePoster ? 'is-visible' : ''}`} key={movie.id} style={{ backgroundImage: `url(${movie.posterUrl})` }} />)}
        <div className="home-background-shade" />
      </div>
      <div className="page-shell">
        <section className="netflix-hero">
          <div className="hero-shade" />
          <div className="hero-content">
            <p className="eyebrow">CINEFLIX ORIGINAL EXPERIENCE</p>
            <h1>Điện ảnh, theo cách của bạn.</h1>
            <p>Chọn một câu chuyện, tìm suất chiếu và bước vào thế giới của bộ phim bạn yêu thích.</p>
          </div>
          {featured && <div className="featured-carousel" key={featured.id}>
            <button className="carousel-arrow" onClick={() => movePoster(-1)} aria-label="Poster trước">‹</button>
            <div className="featured-poster-frame"><img src={featured.posterUrl} alt={featured.title} /><span className="featured-rating">★ {featured.avgRating ? Number(featured.avgRating).toFixed(1) : '—'}</span></div>
            <button className="carousel-arrow" onClick={() => movePoster(1)} aria-label="Poster tiếp theo">›</button>
            <div className="featured-copy"><p className="eyebrow">{featured.status === 'NOW_SHOWING' ? 'ĐANG CHIẾU' : featured.status}</p><h2>{featured.title}</h2><p>{featured.description || `${featured.durationMinutes} phút · Khám phá ngay tại Cineflix.`}</p><Link className="hero-button" to={`/movies/${featured.id}`}>Xem chi tiết <span>→</span></Link></div>
          </div>}
          {posterMovies.length > 1 && <div className="hero-pager">{posterMovies.map((movie, index) => <button className={index === activePoster ? 'active' : ''} key={movie.id} onClick={() => setActivePoster(index)} aria-label={`Xem poster ${movie.title}`} />)}</div>}
        </section>
        <div className="catalog-toolbar"><div className="search-wrap"><span>⌕</span><input className="search-input" placeholder="Tìm phim, diễn viên..." value={keyword} onChange={(event) => setKeyword(event.target.value)} /></div><select value={genreId} onChange={(event) => setGenreId(event.target.value)}><option value="">Tất cả thể loại</option>{genres.map((genre) => <option key={genre.id} value={genre.id}>{genre.name}</option>)}</select><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Tất cả trạng thái</option><option value="NOW_SHOWING">Đang chiếu</option><option value="COMING_SOON">Sắp chiếu</option><option value="END_SHOWING">Đã kết thúc</option></select></div>
        <div className="catalog-heading"><div><p className="eyebrow">CINEFLIX LIBRARY</p><h2>Khám phá phim</h2></div><span>{movies.length} tựa phim</span></div>
        {loading && <p className="muted">Đang tải phim...</p>}
        {error && <p className="form-error">{error}</p>}
        {!loading && !error && <div className="movie-row">{movies.map((movie) => <Link className="netflix-card" to={`/movies/${movie.id}`} key={movie.id}><div className="poster-wrap">{movie.posterUrl ? <img src={movie.posterUrl} alt={movie.title} /> : <span>NO POSTER</span>}<span className="card-rating">★ {movie.avgRating ? Number(movie.avgRating).toFixed(1) : '—'}</span></div><div className="movie-card-body"><h3>{movie.title}</h3><p>{movie.durationMinutes} phút · {movie.status === 'NOW_SHOWING' ? 'Đang chiếu' : movie.status}</p></div></Link>)}</div>}
        {!loading && !error && movies.length === 0 && <p className="muted">Chưa có phim phù hợp.</p>}
      </div>
    </>
  );
};

export default MovieListPage;
