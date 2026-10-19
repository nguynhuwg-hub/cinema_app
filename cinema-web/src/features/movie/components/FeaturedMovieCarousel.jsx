import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './FeaturedMovieCarousel.css';

const AUTO_ADVANCE_MS = 1500;
const ANIMATION_DURATION_MS = 780;

const getSlotOffset = (movieIndex, activeIndex, count) => {
  const offset = (movieIndex - activeIndex + count) % count;
  return offset > count / 2 ? offset - count : offset;
};

const MoviePoster = ({ movie, position, onSelect }) => {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <button
      type="button"
      className={`featured-3d-poster ${position.isActive ? 'is-active' : ''}`}
      style={{
        '--poster-x': `${position.x}px`,
        '--poster-z': `${position.z}px`,
        '--poster-angle': `${position.angle}deg`,
        '--poster-scale': position.scale,
        '--poster-depth': position.depth,
      }}
      onClick={() => onSelect(movie)}
      aria-label={`Chọn phim ${movie.title}`}
      aria-current={position.isActive ? 'true' : undefined}
      tabIndex={position.isVisible ? 0 : -1}
    >
      {movie.posterUrl && !imageFailed ? (
        <img
          src={movie.posterUrl}
          alt={`Poster phim ${movie.title}`}
          loading={position.isActive ? 'eager' : 'lazy'}
          draggable="false"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="featured-3d-poster-fallback">{movie.title}</span>
      )}
      <span className="featured-3d-poster-vignette" aria-hidden="true" />
    </button>
  );
};

const FeaturedMovieCarousel = ({ movies }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(
    () => typeof document === 'undefined' || !document.hidden,
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(
    () => (typeof window === 'undefined' ? 1280 : window.innerWidth),
  );
  const dragStartX = useRef(null);
  const dragged = useRef(false);
  const resetDragTimer = useRef(null);
  const transitionTimer = useRef(null);

  useEffect(() => {
    const syncVisibility = () => setIsDocumentVisible(!document.hidden);
    document.addEventListener('visibilitychange', syncVisibility);
    return () => document.removeEventListener('visibilitychange', syncVisibility);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncPreference = () => setPrefersReducedMotion(mediaQuery.matches);
    syncPreference();
    mediaQuery.addEventListener('change', syncPreference);
    return () => mediaQuery.removeEventListener('change', syncPreference);
  }, []);

  useEffect(() => {
    let resizeFrame = 0;
    const syncWidth = () => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(() => setViewportWidth(window.innerWidth));
    };
    window.addEventListener('resize', syncWidth);
    return () => {
      window.removeEventListener('resize', syncWidth);
      window.cancelAnimationFrame(resizeFrame);
    };
  }, []);

  useEffect(() => () => {
    window.clearTimeout(resetDragTimer.current);
    window.clearTimeout(transitionTimer.current);
  }, []);

  const move = useCallback((direction) => {
    if (movies.length < 2) return;
    setActiveIndex((current) => (current + direction + movies.length) % movies.length);
  }, [movies.length]);

  useEffect(() => {
    if (movies.length < 2 || isHovered || isDragging || !isDocumentVisible) {
      return undefined;
    }
    const timer = window.setInterval(() => move(1), AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [movies.length, isHovered, isDragging, isDocumentVisible, move]);

  const selectMovie = (movie) => {
    const index = movies.findIndex(({ id }) => id === movie.id);
    if (index >= 0) setActiveIndex(index);
  };

  const handlePointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragStartX.current = event.clientX;
  };

  const handlePointerUp = (event) => {
    if (dragStartX.current === null) return;
    const distance = event.clientX - dragStartX.current;
    dragStartX.current = null;
    if (Math.abs(distance) < 48) return;

    dragged.current = true;
    setIsDragging(true);
    move(distance < 0 ? 1 : -1);
    window.clearTimeout(transitionTimer.current);
    transitionTimer.current = window.setTimeout(() => setIsDragging(false), ANIMATION_DURATION_MS);
    window.clearTimeout(resetDragTimer.current);
    resetDragTimer.current = window.setTimeout(() => { dragged.current = false; }, 0);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      move(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      move(1);
    }
  };

  const radiusX = Math.min(430, Math.max(205, viewportWidth * 0.42));
  const radiusZ = Math.min(190, Math.max(100, viewportWidth * 0.16));
  const currentIndex = movies.length ? activeIndex % movies.length : 0;
  const activeMovie = movies[currentIndex];
  const visiblePosters = movies
    .map((movie, index) => {
      const offset = getSlotOffset(index, currentIndex, movies.length);
      const angle = offset * 30;
      const radians = (angle * Math.PI) / 180;
      const normalizedOffset = Math.abs(offset);
      return {
        movie,
        offset,
        position: {
          x: Math.sin(radians) * radiusX,
          z: Math.cos(radians) * radiusZ - radiusZ,
          angle: -angle,
          scale: normalizedOffset === 0 ? 1 : normalizedOffset === 1 ? 0.78 : 0.62,
          depth: 5 - normalizedOffset,
          isActive: normalizedOffset === 0,
          isVisible: normalizedOffset <= 2,
        },
      };
    })
    .filter(({ position }) => position.isVisible)
    .sort((left, right) => left.position.depth - right.position.depth);

  if (!activeMovie) return null;

  const genreNames = activeMovie.genres?.map((genre) => genre.name).filter(Boolean) || [];
  const statusLabel = activeMovie.status === 'NOW_SHOWING'
    ? 'ĐANG CHIẾU'
    : activeMovie.status === 'COMING_SOON'
      ? 'SẮP CHIẾU'
      : activeMovie.status || 'PHIM NỔI BẬT';

  return (
    <section
      className="featured-movie-carousel"
      aria-label="Phim nổi bật"
      data-reduced-motion={prefersReducedMotion}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="home-cinema-background" aria-hidden="true">
        {activeMovie.posterUrl && (
          <div
            className="home-backdrop is-visible"
            key={activeMovie.id}
            style={{ backgroundImage: `url("${activeMovie.posterUrl}")` }}
          />
        )}
        <div className="home-background-shade" />
      </div>

      <div className="featured-carousel-heading">
        <p className="eyebrow">CINEF · TUYỂN CHỌN ĐIỆN ẢNH</p>
        <h1>Điện ảnh, theo cách của bạn.</h1>
        <p>Chọn một câu chuyện, tìm suất chiếu và bước vào thế giới của bộ phim bạn yêu thích.</p>
      </div>

      <div className="featured-3d-stage">
        <div
          className="featured-3d-track"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => { dragStartX.current = null; setIsDragging(false); }}
          onLostPointerCapture={() => { dragStartX.current = null; }}
          onDragStart={(event) => event.preventDefault()}
          aria-live="off"
        >
          {visiblePosters.map(({ movie, position }) => (
            <MoviePoster
              key={movie.id}
              movie={movie}
              position={position}
              onSelect={selectMovie}
            />
          ))}
        </div>

        <button
          className="featured-3d-arrow previous"
          type="button"
          onClick={() => move(-1)}
          aria-label="Phim trước"
          disabled={movies.length < 2}
        >
          <span aria-hidden="true">←</span>
        </button>
        <button
          className="featured-3d-arrow next"
          type="button"
          onClick={() => move(1)}
          aria-label="Phim tiếp theo"
          disabled={movies.length < 2}
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <div className="featured-movie-caption" key={activeMovie.id}>
        <div className="featured-movie-meta">
          <span>{statusLabel}</span>
          {genreNames.length > 0 && <span>{genreNames.join(' · ')}</span>}
          {activeMovie.durationMinutes && <span>{activeMovie.durationMinutes} phút</span>}
          {activeMovie.avgRating > 0 && (
            <span className="featured-movie-rating">★ {Number(activeMovie.avgRating).toFixed(1)}</span>
          )}
        </div>
        <h2>{activeMovie.title}</h2>
        <p>{activeMovie.description || 'Khám phá bộ phim và các suất chiếu đang mở bán tại CineF.'}</p>
        <div className="featured-movie-actions">
          <Link className="hero-button" to={`/movies/${activeMovie.id}`}>Đặt vé ngay <span>→</span></Link>
          <Link className="featured-detail-link" to={`/movies/${activeMovie.id}`}>Xem chi tiết</Link>
        </div>
      </div>

      <div className="featured-carousel-footer">
        <div className="featured-carousel-count" aria-live="polite">
          <span>{String(currentIndex + 1).padStart(2, '0')}</span>
          <i aria-hidden="true">/</i>
          {String(movies.length).padStart(2, '0')}
        </div>
        <div className="featured-carousel-progress" aria-hidden="true">
          <span style={{ '--progress': `${((currentIndex + 1) / movies.length) * 100}%` }} />
        </div>
        <span className="featured-carousel-hint">KÉO ĐỂ KHÁM PHÁ</span>
      </div>
    </section>
  );
};

export default FeaturedMovieCarousel;
