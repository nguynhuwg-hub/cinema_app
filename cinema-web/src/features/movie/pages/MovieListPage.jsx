import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { genreApi, movieApi } from '../api/movieApi';
import FeaturedMovieCarousel from '../components/FeaturedMovieCarousel';

const MovieListPage = () => {
  const [movies, setMovies] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [genres, setGenres] = useState([]);
  const [status, setStatus] = useState('');
  const [genreId, setGenreId] = useState('');

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
  return (
    <>
      <div className="page-shell">
        {posterMovies.length > 0 && (
          <FeaturedMovieCarousel
            key={`${keyword}|${status}|${genreId}`}
            movies={posterMovies}
          />
        )}
        <div className="catalog-toolbar"><div className="search-wrap"><span>⌕</span><input className="search-input" placeholder="Tìm phim, diễn viên..." value={keyword} onChange={(event) => setKeyword(event.target.value)} /></div><select value={genreId} onChange={(event) => setGenreId(event.target.value)}><option value="">Tất cả thể loại</option>{genres.map((genre) => <option key={genre.id} value={genre.id}>{genre.name}</option>)}</select><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Tất cả trạng thái</option><option value="NOW_SHOWING">Đang chiếu</option><option value="COMING_SOON">Sắp chiếu</option><option value="END_SHOWING">Đã kết thúc</option></select></div>
        <div className="catalog-heading"><div><p className="eyebrow">CINEFLIX LIBRARY</p><h2>Khám phá phim</h2></div><span>{movies.length} tựa phim</span></div>
        {loading && <p className="muted">Đang tải phim...</p>}
        {error && <p className="form-error">{error}</p>}
        {!loading && !error && <div className="movie-row">{movies.map((movie) => <Link className="netflix-card" to={`/movies/${movie.id}`} key={movie.id}><div className="poster-wrap">{movie.posterUrl ? <img src={movie.posterUrl} alt={movie.title} loading="lazy" /> : <span>NO POSTER</span>}<span className="card-rating">★ {movie.avgRating ? Number(movie.avgRating).toFixed(1) : '—'}</span></div><div className="movie-card-body"><h3>{movie.title}</h3><p>{movie.durationMinutes} phút · {movie.status === 'NOW_SHOWING' ? 'Đang chiếu' : movie.status}</p></div></Link>)}</div>}
        {!loading && !error && movies.length === 0 && <p className="muted">Chưa có phim phù hợp.</p>}
      </div>
    </>
  );
};

export default MovieListPage;
