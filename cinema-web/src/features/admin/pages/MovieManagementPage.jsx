import { useEffect, useState } from 'react';
import { genreApi, movieApi } from '../../movie/api/movieApi';

const emptyMovie = { title: '', description: '', durationMinutes: '', releaseDate: '', posterUrl: '', trailerUrl: '', language: 'Vietnamese', status: 'COMING_SOON', genreIds: [] };
const MovieManagementPage = () => {
  const [movies, setMovies] = useState([]); const [genres, setGenres] = useState([]); const [form, setForm] = useState(emptyMovie); const [editing, setEditing] = useState(null); const [message, setMessage] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const load = () => movieApi.getAll().then(setMovies);
  useEffect(() => {
    load().catch(() => setDeleteError('Không thể tải lại danh sách phim.'));
    genreApi.getAll().then(setGenres).catch(() => setDeleteError('Không thể tải danh sách thể loại.'));
  }, []);
  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const submit = async (event) => { event.preventDefault(); const payload = { ...form, durationMinutes: Number(form.durationMinutes), genreIds: form.genreIds.map(Number) }; if (editing) await movieApi.update(editing, payload); else await movieApi.create(payload); setForm(emptyMovie); setEditing(null); setMessage('Đã lưu phim thành công.'); load(); };
  const remove = async (movie) => {
    if (!window.confirm(`Xóa phim "${movie.title}"?`)) return;

    setDeleteError('');
    setDeletingId(movie.id);
    let deleted = false;
    try {
      await movieApi.remove(movie.id);
      deleted = true;
      setMovies((currentMovies) => currentMovies.filter((item) => item.id !== movie.id));
      setMessage(`Đã xóa phim "${movie.title}".`);
      await load();
    } catch (requestError) {
      if (deleted) {
        setDeleteError('Phim đã được xóa nhưng không thể tải lại danh sách. Hãy làm mới trang.');
      } else {
        const status = requestError.response?.status;
        const serverMessage = requestError.response?.data?.message
          || requestError.response?.data?.error
          || (typeof requestError.response?.data === 'string' ? requestError.response.data : '');
        const statusMessage = status === 403
          ? 'Tài khoản hiện tại không có quyền xóa phim.'
          : status === 404
            ? 'Không tìm thấy phim cần xóa.'
            : status === 409
              ? 'Máy chủ từ chối xóa do phim còn dữ liệu liên quan.'
              : !requestError.response
                ? 'Không kết nối được máy chủ. Hãy kiểm tra backend và kết nối mạng.'
                : `Yêu cầu xóa thất bại (HTTP ${status}).`;
        setDeleteError(serverMessage ? `${statusMessage} Chi tiết: ${serverMessage}` : statusMessage);
      }
    } finally {
      setDeletingId(null);
    }
  };
  return <div className="admin-page"><div className="admin-page-heading"><p className="eyebrow">CONTENT STUDIO</p><h1>Quản lý phim</h1></div><div className="admin-split"><form className="admin-form" onSubmit={submit}><h2>{editing ? 'Chỉnh sửa phim' : 'Thêm phim mới'}</h2><input name="title" placeholder="Tên phim" value={form.title} onChange={change} required /><textarea name="description" placeholder="Mô tả" value={form.description} onChange={change} /><div className="form-grid"><input name="durationMinutes" type="number" placeholder="Thời lượng (phút)" value={form.durationMinutes} onChange={change} required /><input name="releaseDate" type="date" value={form.releaseDate} onChange={change} /></div><div className="form-grid"><input name="posterUrl" placeholder="Poster URL" value={form.posterUrl} onChange={change} /><input name="trailerUrl" placeholder="Trailer URL" value={form.trailerUrl} onChange={change} /></div><div className="form-grid"><input name="language" placeholder="Ngôn ngữ" value={form.language} onChange={change} /><select name="status" value={form.status} onChange={change}><option value="COMING_SOON">Sắp chiếu</option><option value="NOW_SHOWING">Đang chiếu</option><option value="END_SHOWING">Đã kết thúc</option></select></div><label>Thể loại<select multiple value={form.genreIds.map(String)} onChange={(event) => setForm({ ...form, genreIds: [...event.target.selectedOptions].map((option) => option.value) })}>{genres.map((genre) => <option key={genre.id} value={genre.id}>{genre.name}</option>)}</select></label><button className="primary-button">{editing ? 'Cập nhật phim' : 'Tạo phim'}</button>{editing && <button type="button" className="text-button" onClick={() => { setEditing(null); setForm(emptyMovie); }}>Hủy chỉnh sửa</button>}{message && <p className="form-success">{message}</p>}</form><div className="admin-table-wrap">{deleteError && <p className="form-error" role="alert">{deleteError}</p>}<table className="admin-table"><thead><tr><th>Phim</th><th>Trạng thái</th><th>Đánh giá</th><th /></tr></thead><tbody>{movies.map((movie) => <tr key={movie.id}><td><strong>{movie.title}</strong><small>{movie.durationMinutes} phút</small></td><td>{movie.status}</td><td>★ {movie.avgRating || '—'}</td><td><button className="table-button" onClick={() => { setEditing(movie.id); setForm({ ...emptyMovie, ...movie, genreIds: movie.genres?.map((genre) => genre.id) || [] }); }}>Sửa</button><button className="table-button danger" disabled={deletingId === movie.id} onClick={() => remove(movie)}>{deletingId === movie.id ? 'Đang xóa...' : 'Xóa'}</button></td></tr>)}</tbody></table></div></div></div>;
};
export default MovieManagementPage;
