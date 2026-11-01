import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { cinemaApi } from '../api/cinemaApi';
import { showtimeApi } from '../../showtime/api/showtimeApi';
import './CinemaShowtimesPage.css';

const getMonday = (date) => {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
};

const toDateParam = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDate = (date) => date.toLocaleDateString('vi-VN', {
  day: 'numeric',
  month: 'long',
});

const formatLongDate = (date) => date.toLocaleDateString('vi-VN', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const formatTime = (dateTime) => new Date(dateTime).toLocaleTimeString('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
});

const CinemaShowtimesPage = () => {
  const { id } = useParams();
  const [cinema, setCinema] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [loadedScheduleKey, setLoadedScheduleKey] = useState('');
  const [cinemaError, setCinemaError] = useState(null);
  const [scheduleError, setScheduleError] = useState(null);
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => toDateParam(new Date()));
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + index);
      return date;
    }),
    [weekStart],
  );
  const scheduleKey = `${id}:${toDateParam(weekStart)}:${toDateParam(weekDays[6])}`;
  const loading = loadedScheduleKey !== scheduleKey;
  const error = cinemaError?.id === id
    ? cinemaError.message
    : scheduleError?.id === id
      ? scheduleError.message
      : '';
  const activeDate = weekDays.some((date) => toDateParam(date) === selectedDate)
    ? selectedDate
    : toDateParam(weekDays[0]);
  const selectedShowtimes = showtimes.filter(
    (showtime) => showtime.startTime?.slice(0, 10) === activeDate,
  );
  const moviesForSelectedDay = selectedShowtimes.reduce((movies, showtime) => {
    const movieKey = showtime.movieId ?? showtime.movieTitle;
    const movie = movies.find((item) => item.key === movieKey);
    if (movie) {
      movie.screenings.push(showtime);
    } else {
      movies.push({ key: movieKey, showtime, screenings: [showtime] });
    }
    return movies;
  }, []);
  const selectedDateObject = weekDays.find((date) => toDateParam(date) === activeDate);

  useEffect(() => {
    let active = true;
    cinemaApi.getById(id)
      .then((cinemaData) => {
        if (active) {
          setCinema(cinemaData);
          setCinemaError(null);
        }
      })
      .catch((requestError) => {
        if (active) {
          setCinemaError({
            id,
            message: requestError.response?.data?.message || 'Không thể tải thông tin cụm rạp.',
          });
        }
      });

    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    let active = true;

    showtimeApi.getAll({
      cinemaId: id,
      startDate: toDateParam(weekStart),
      endDate: toDateParam(weekDays[6]),
    })
      .then((showtimeData) => {
        if (active) {
          setShowtimes(showtimeData || []);
          setScheduleError(null);
        }
      })
      .catch((requestError) => {
        if (active) {
          setScheduleError({
            id,
            message: requestError.response?.data?.message || 'Không thể tải suất chiếu của cụm rạp.',
          });
        }
      })
      .finally(() => {
        if (active) setLoadedScheduleKey(scheduleKey);
      });

    return () => { active = false; };
  }, [id, weekStart, weekDays, scheduleKey]);

  const changeWeek = (offset) => {
    setWeekStart((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + offset * 7);
      return next;
    });
  };

  const weekLabel = `${formatDate(weekDays[0])} – ${weekDays[6].toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}`;

  if (loading) return <div className="page-shell"><p className="muted">Đang tải suất chiếu...</p></div>;
  if (error) return <div className="page-shell"><p className="form-error">{error}</p></div>;

  return (
    <div className="page-shell cinema-showtimes-page">
      <Link className="back-link" to="/cinemas">← Tất cả cụm rạp</Link>
      <section className="cinema-week-heading">
        <div className="cinema-week-copy">
          <p className="eyebrow">{cinema?.cityName || 'CINEFLIX'} · LỊCH CHIẾU</p>
          <h1>{cinema?.name || 'Suất chiếu'}</h1>
          <p className="muted">{cinema?.address}</p>
        </div>
        <div className="week-total">
          <strong>{showtimes.length}</strong>
          <span>suất chiếu trong tuần</span>
        </div>
      </section>
      <section className="weekly-schedule" aria-label="Lịch chiếu phim theo tuần">
        <div className="weekly-schedule-toolbar">
          <div>
            <p className="eyebrow">LỊCH CHIẾU CẢ TUẦN</p>
            <h2>{weekLabel}</h2>
          </div>
          <div className="week-navigation">
            <button type="button" onClick={() => changeWeek(-1)} aria-label="Tuần trước">←</button>
            <button type="button" onClick={() => setWeekStart(getMonday(new Date()))}>Tuần này</button>
            <button type="button" onClick={() => changeWeek(1)} aria-label="Tuần sau">→</button>
          </div>
        </div>
        <div className="week-day-picker" role="tablist" aria-label="Chọn ngày chiếu">
          {weekDays.map((date) => {
            const dateParam = toDateParam(date);
            const dayShowtimeCount = showtimes.filter(
              (showtime) => showtime.startTime?.slice(0, 10) === dateParam,
            ).length;
            const isSelected = dateParam === activeDate;
            const isToday = dateParam === toDateParam(new Date());
            return (
              <button
                aria-selected={isSelected}
                className={`week-day-button${isSelected ? ' is-selected' : ''}`}
                key={dateParam}
                onClick={() => setSelectedDate(dateParam)}
                role="tab"
                type="button"
              >
                <span className="week-day-name">
                  {date.toLocaleDateString('vi-VN', { weekday: 'short' })}
                </span>
                <strong className="week-day-number">
                  {date.toLocaleDateString('vi-VN', { day: 'numeric' })}
                </strong>
                <span className="week-day-count">
                  {loading ? '…' : `${dayShowtimeCount} suất`}
                </span>
                {isToday && <span className="week-day-today">Hôm nay</span>}
              </button>
            );
          })}
        </div>
        <section className="selected-day-schedule" aria-live="polite" role="tabpanel">
          <header className="selected-day-heading">
            <div>
              <p className="eyebrow">SUẤT CHIẾU TRONG NGÀY</p>
              <h3>{selectedDateObject ? formatLongDate(selectedDateObject) : ''}</h3>
            </div>
            <span>{selectedShowtimes.length} suất · {moviesForSelectedDay.length} phim</span>
          </header>
          {loading ? (
            <p className="schedule-empty">Đang tải lịch chiếu...</p>
          ) : moviesForSelectedDay.length === 0 ? (
            <div className="schedule-empty">
              <span className="schedule-empty-icon" aria-hidden="true">✦</span>
              <h4>Chưa có suất chiếu trong ngày này</h4>
              <p>Hãy chọn một ngày khác trong tuần để khám phá lịch chiếu.</p>
            </div>
          ) : (
            <div className="daily-movie-list">
              {moviesForSelectedDay.map(({ key, showtime, screenings }) => (
                <article className="daily-movie-card" key={key}>
                  <div className="daily-movie-poster">
                    {showtime.moviePosterUrl
                      ? <img src={showtime.moviePosterUrl} alt={`Poster phim ${showtime.movieTitle}`} />
                      : <span>POSTER</span>}
                  </div>
                  <div className="daily-movie-content">
                    <div className="daily-movie-topline">
                      <div>
                        <Link className="daily-movie-title" to={`/movies/${showtime.movieId}`}>
                          {showtime.movieTitle}
                        </Link>
                        <p className="daily-movie-genres">
                          {showtime.movieGenres?.length ? showtime.movieGenres.join(' · ') : 'Thể loại đang cập nhật'}
                        </p>
                      </div>
                      <span className="daily-movie-rating">
                        ★ {showtime.movieAvgRating ? Number(showtime.movieAvgRating).toFixed(1) : '—'}
                      </span>
                    </div>
                    <p className="daily-movie-meta">
                      {showtime.movieReleaseDate ? `${showtime.movieReleaseDate} · ` : ''}
                      {showtime.movieDurationMinutes ? `${showtime.movieDurationMinutes} phút` : ''}
                      {showtime.movieLanguage ? ` · ${showtime.movieLanguage}` : ''}
                      {showtime.movieStatus ? ` · ${showtime.movieStatus}` : ''}
                    </p>
                    <p className="daily-movie-description">
                      {showtime.movieDescription || 'Thông tin mô tả đang được cập nhật.'}
                    </p>
                    {showtime.movieTrailerUrl && (
                      <a className="daily-movie-trailer" href={showtime.movieTrailerUrl} target="_blank" rel="noreferrer">
                        Xem trailer ↗
                      </a>
                    )}
                    <div className="daily-screenings">
                      <span className="daily-screenings-label">CHỌN SUẤT</span>
                      <div className="daily-screening-options">
                        {screenings.map((screening) => (
                          <Link className="daily-screening-option" key={screening.id} to={`/showtimes/${screening.id}`}>
                            <strong>{formatTime(screening.startTime)}</strong>
                            <span>{screening.hallName}</span>
                            <small>{screening.basePrice?.toLocaleString('vi-VN')} đ</small>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </div>
  );
};

export default CinemaShowtimesPage;
