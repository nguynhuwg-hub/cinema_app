
import { useEffect, useState } from 'react';
import { movieApi } from '../../movie/api/movieApi';
import { cinemaApi, hallApi } from '../../cinema/api/cinemaApi';
import { showtimeApi } from '../../showtime/api/showtimeApi';

const ShowtimeManagementPage = () => {
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [halls, setHalls] = useState([]);
  const [showtimes, setShowtimes] = useState([]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const [form, setForm] = useState({
    movieId: '',
    cinemaId: '',
    hallId: '',
    startTime: '',
    basePrice: '',
  });

  const getErrorMessage = (requestError, fallback) => {
    const data = requestError.response?.data;
    return typeof data?.message === 'string' && data.message.trim()
      ? data.message
      : fallback;
  };

  const load = async () => {
    const data = await showtimeApi.getAll();
    setShowtimes(data || []);
  };

  useEffect(() => {
    movieApi.getAll().then(setMovies).catch((requestError) => {
      setError(getErrorMessage(
        requestError,
        'Không thể tải danh sách phim.'
      ));
    });

    cinemaApi.getAll().then(setCinemas).catch((requestError) => {
      setError(getErrorMessage(
        requestError,
        'Không thể tải danh sách cụm rạp.'
      ));
    });

    load().catch((requestError) => {
      setError(
        requestError.response?.status === 403
          ? 'Không có quyền xem danh sách suất chiếu (SHOWTIME_READ).'
          : getErrorMessage(
              requestError,
              'Không thể tải danh sách suất chiếu.'
            )
      );
    });
  }, []);

  const setField = (name, value) => {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const cinemaChanged = async (value) => {
    setForm((previous) => ({
      ...previous,
      cinemaId: value,
      hallId: '',
    }));

    setHalls([]);

    if (!value) return;

    try {
      const data = await hallApi.getByCinema(value);
      setHalls(data || []);
    } catch (requestError) {
      setError(getErrorMessage(
        requestError,
        'Không thể tải danh sách phòng chiếu.'
      ));
    }
  };

  const selectedMovie = movies.find(
    (movie) => String(movie.id) === form.movieId
  );

  const calculatedEndTime = () => {
    if (!form.startTime || !selectedMovie?.durationMinutes) {
      return '';
    }

    const endTime = new Date(form.startTime);

    endTime.setMinutes(
      endTime.getMinutes() + selectedMovie.durationMinutes
    );

    const pad = (value) => String(value).padStart(2, '0');

    return (
      `${endTime.getFullYear()}-` +
      `${pad(endTime.getMonth() + 1)}-` +
      `${pad(endTime.getDate())}T` +
      `${pad(endTime.getHours())}:` +
      `${pad(endTime.getMinutes())}`
    );
  };

  const submit = async (event) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    const formatDateTime = (dt) =>
      dt && dt.length === 16 ? `${dt}:00` : dt;

    try {
      await showtimeApi.create({
        movieId: Number(form.movieId),
        hallId: Number(form.hallId),
        startTime: formatDateTime(form.startTime),
        basePrice: Number(form.basePrice),
      });
    } catch (requestError) {
      const serverMessage = requestError.response?.data?.message;

      setError(
        requestError.response?.status === 403
          ? `Tài khoản không có quyền tạo suất chiếu.${
              serverMessage ? ` Chi tiết: ${serverMessage}` : ''
            }`
          : getErrorMessage(
              requestError,
              'Không thể tạo suất chiếu. Vui lòng kiểm tra thông tin.'
            )
      );

      return;
    }

    setForm({
      movieId: '',
      cinemaId: '',
      hallId: '',
      startTime: '',
      basePrice: '',
    });

    try {
      await load();
      setSuccess('Tạo suất chiếu thành công.');
    } catch (requestError) {
      setError(getErrorMessage(
        requestError,
        'Đã tạo suất chiếu nhưng không tải lại được danh sách.'
      ));
    }
  };

  // Xử lý xóa suất chiếu
  const handleDelete = async (showtime) => {
    if (deletingId !== null) return;

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa suất chiếu "${showtime.movieTitle}" ` +
      `tại phòng "${showtime.hallName}" không?\n\n` +
      'Thao tác này không thể hoàn tác.'
    );

    if (!confirmed) return;

    setError('');
    setSuccess('');
    setDeletingId(showtime.id);

    try {
      await showtimeApi.remove(showtime.id);

      setShowtimes((previous) =>
        previous.filter((item) => item.id !== showtime.id)
      );

      setSuccess(
        `Đã xóa suất chiếu "${showtime.movieTitle}" thành công.`
      );
    } catch (requestError) {
      const status = requestError.response?.status;

      if (status === 403) {
        setError(
          'Tài khoản hiện tại không có quyền xóa suất chiếu.'
        );
      } else if (status === 404) {
        setError(
          'Suất chiếu không tồn tại hoặc đã bị xóa.'
        );
      } else if (status === 409) {
        setError(getErrorMessage(
          requestError,
          'Không thể xóa suất chiếu vì đang có dữ liệu liên quan, ' +
          'chẳng hạn đơn đặt vé hoặc ghế đã được sử dụng.'
        ));
      } else {
        setError(getErrorMessage(
          requestError,
          'Không thể xóa suất chiếu. Vui lòng thử lại.'
        ));
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <p className="eyebrow">SCHEDULE CONTROL</p>
        <h1>Quản lý suất chiếu</h1>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {success && (
        <p
          role="status"
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            border: '1px solid #2d8050',
            borderRadius: '8px',
            color: '#65d995',
            background: 'rgba(45, 128, 80, 0.12)',
          }}
        >
          {success}
        </p>
      )}

      <div className="admin-split">
        <form className="admin-form compact" onSubmit={submit}>
          <h2>Tạo suất chiếu</h2>

          <select
            value={form.movieId}
            onChange={(e) => setField('movieId', e.target.value)}
            required
          >
            <option value="">Chọn phim</option>
            {movies.map((movie) => (
              <option value={movie.id} key={movie.id}>
                {movie.title}
              </option>
            ))}
          </select>

          <select
            value={form.cinemaId}
            onChange={(e) => cinemaChanged(e.target.value)}
            required
          >
            <option value="">Chọn cụm rạp</option>
            {cinemas.map((cinema) => (
              <option value={cinema.id} key={cinema.id}>
                {cinema.name}
              </option>
            ))}
          </select>

          <select
            value={form.hallId}
            onChange={(e) => setField('hallId', e.target.value)}
            required
          >
            <option value="">Chọn phòng</option>
            {halls.map((hall) => (
              <option value={hall.id} key={hall.id}>
                {hall.name}
              </option>
            ))}
          </select>

          <div className="form-grid">
            <label>
              Bắt đầu
              <input
                type="datetime-local"
                value={form.startTime}
                onChange={(e) =>
                  setField('startTime', e.target.value)
                }
                required
              />
            </label>

            <label>
              Kết thúc (tự tính)
              <input
                type="datetime-local"
                value={calculatedEndTime()}
                readOnly
                required
              />
            </label>
          </div>

          <input
            type="number"
            min="1"
            placeholder="Giá vé"
            value={form.basePrice}
            onChange={(e) =>
              setField('basePrice', e.target.value)
            }
            required
          />

          <button className="primary-button" type="submit">
            Tạo suất chiếu
          </button>
        </form>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Phim</th>
                <th>Phòng</th>
                <th>Bắt đầu</th>
                <th>Giá</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {showtimes.map((showtime) => (
                <tr key={showtime.id}>
                  <td>{showtime.movieTitle}</td>
                  <td>{showtime.hallName}</td>
                  <td>
                    {new Date(showtime.startTime)
                      .toLocaleString('vi-VN')}
                  </td>
                  <td>
                    {Number(showtime.basePrice || 0)
                      .toLocaleString('vi-VN')} đ
                  </td>
                  <td>
                    <button
                      type="button"
                      className="table-button danger"
                      disabled={deletingId !== null}
                      onClick={() => handleDelete(showtime)}
                    >
                      {deletingId === showtime.id
                        ? 'Đang xóa...'
                        : 'Xóa'}
                    </button>
                  </td>
                </tr>
              ))}

              {showtimes.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    Chưa có suất chiếu nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ShowtimeManagementPage;
