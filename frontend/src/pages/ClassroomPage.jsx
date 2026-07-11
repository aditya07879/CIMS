import { School, Megaphone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { classroomAPI, mentorAPI } from '../api/services.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Layout } from '../components/common/Layout.jsx';
import { Spinner, Alert, EmptyState, PageHeader, Modal, Select } from '../components/common/index.jsx';
import { DEPARTMENTS, SECTIONS } from '../utils/helpers.js';

const ClassroomPage = () => {
  const { user } = useAuth();
  const [classroom, setClassroom] = useState(null);
  const [allClassrooms, setAllClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const isAdmin = user.role === 'admin';
  const isMentor = user.role === 'mentor';

  useEffect(() => {
    const fetch = async () => {
      try {
        if (isAdmin) {
          const { data } = await classroomAPI.getAll();
          setAllClassrooms(data.data);
        } else if (isMentor) {
          // Mentors are NOT enrolled in a classroom; use their assignment endpoint
          const { data } = await mentorAPI.getClassrooms();
          setAllClassrooms(data.data || []);
        } else {
          // Students: fetch the single classroom they are enrolled in
          const { data } = await classroomAPI.getMy();
          setClassroom(data.data);
        }
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load classroom');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [isAdmin, isMentor]);

  if (loading) return <Layout><div className="flex justify-center pt-20"><Spinner size="lg" /></div></Layout>;

  return (
    <Layout>
      <PageHeader
        title={isAdmin ? 'All Classrooms' : isMentor ? 'My Classrooms' : 'My Classroom'}
        subtitle={isAdmin ? `${allClassrooms.length} classrooms` : undefined}
        action={(isAdmin || isMentor)   && (
          <button className="btn-primary text-sm" onClick={() => setCreateOpen(true)}>+ Create Classroom</button>
        )}
      />

      <Alert message={error} />

      {isAdmin ? (
        <AdminClassroomList
          classrooms={allClassrooms}
          onRefresh={() => classroomAPI.getAll().then(r => setAllClassrooms(r.data.data))}
          createOpen={createOpen}
          setCreateOpen={setCreateOpen}
        />
      ) : isMentor ? (
        <MentorClassroomList
          classrooms={allClassrooms}
          createOpen={createOpen}
          setCreateOpen={setCreateOpen}
          onRefresh={() => mentorAPI.getClassrooms().then(r => setAllClassrooms(r.data.data || []))}
        />
      ) : (
        <StudentClassroomView classroom={classroom} />
      )}
    </Layout>
  );
};

const StudentClassroomView = ({ classroom }) => {
  if (!classroom) return <EmptyState LucideIcon={School} title="No classroom assigned" subtitle="Contact admin to get assigned" />;
  return (
    <div className="space-y-4">
      <div className="card p-5">
        <h2 className="font-semibold text-lg text-gray-100 mb-1">
          {classroom.department} — Year {classroom.year}, Section {classroom.section}
        </h2>
        <p className="text-sm text-gray-400">
          Mentor: <span className="text-gray-200">{classroom.mentor?.name || 'Not assigned'}</span>
          {classroom.mentor?.email && <span className="text-gray-500"> ({classroom.mentor.email})</span>}
        </p>
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-surface-border">
          <h3 className="font-medium text-gray-200">Students ({classroom.students?.length ?? 0})</h3>
        </div>
        <div className="divide-y divide-surface-border">
          {classroom.students?.map(s => (
            <div key={s._id} className="px-5 py-3 flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center text-xs font-semibold text-brand-400">
                {s.name[0]}
              </div>
              <div>
                <p className="text-sm text-gray-200">{s.name}</p>
                <p className="text-xs text-gray-500">{s.rollNumber || s.email}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AdminClassroomList = ({ classrooms, onRefresh, createOpen, setCreateOpen }) => {
  const [form, setForm] = useState({ department: 'CSE', year: '1', section: 'A' });
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setErr('');
    try {
      await classroomAPI.create({ ...form, year: parseInt(form.year) });
      setCreateOpen(false);
      onRefresh();
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed');
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      {classrooms.length === 0 ? (
        <EmptyState LucideIcon={School} title="No classrooms yet" subtitle="Create the first classroom" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classrooms.map(c => (
            <div key={c._id} className="card p-5">
              <div className="font-semibold text-gray-100 mb-1">
                {c.department} — Year {c.year}{c.section}
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Mentor: {c.mentor?.name || <span className="text-yellow-500">Unassigned</span>}
              </p>
              <Link to={`/issues?classroomId=${c._id}`} className="text-xs text-brand-400 hover:text-brand-300">
                View Issues →
              </Link>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create Classroom">
        {err && <div className="mb-3 text-sm text-red-400">{err}</div>}
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select label="Dept" value={form.department} onChange={v => setForm(f => ({ ...f, department: v }))}
              options={DEPARTMENTS.map(d => ({ value: d, label: d }))} />
            <Select label="Year" value={form.year} onChange={v => setForm(f => ({ ...f, year: v }))}
              options={[1,2,3,4].map(y => ({ value: String(y), label: `Year ${y}` }))} />
            <Select label="Section" value={form.section} onChange={v => setForm(f => ({ ...f, section: v }))}
              options={SECTIONS.map(s => ({ value: s, label: s }))} />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={creating}>
            {creating ? 'Creating...' : 'Create Classroom'}
          </button>
        </form>
      </Modal>
    </>
  );
};

export default ClassroomPage;

// Mentor view: read-only list of their assigned classrooms
const MentorClassroomList = ({ classrooms, createOpen, setCreateOpen, onRefresh }) => {
  const [form, setForm] = useState({ department: 'CSE', year: '1', section: 'A' });
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState('');
  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setErr('');
    try {
      await classroomAPI.create({ ...form, year: parseInt(form.year) });
      setCreateOpen(false);
      onRefresh();
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed');
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      {classrooms.length === 0 ? (
        <EmptyState LucideIcon={School} title="No classrooms assigned" subtitle="Contact admin to get assigned to a classroom" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classrooms.map(c => (
            <div key={c._id} className="card p-5">
              <div className="font-semibold text-gray-100 mb-1">
                {c.department} — Year {c.year}, Section {c.section}
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Students: {c.students?.length ?? 0}
              </p>
              <Link to={`/issues?classroomId=${c._id}`} className="text-xs text-brand-400 hover:text-brand-300">
                View Issues →
              </Link>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create Classroom">
        {err && <div className="mb-3 text-sm text-red-400">{err}</div>}
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select label="Dept" value={form.department} onChange={v => setForm(f => ({ ...f, department: v }))}
              options={DEPARTMENTS.map(d => ({ value: d, label: d }))} />
            <Select label="Year" value={form.year} onChange={v => setForm(f => ({ ...f, year: v }))}
              options={[1,2,3,4].map(y => ({ value: String(y), label: `Year ${y}` }))} />
            <Select label="Section" value={form.section} onChange={v => setForm(f => ({ ...f, section: v }))}
              options={SECTIONS.map(s => ({ value: s, label: s }))} />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={creating}>
            {creating ? 'Creating...' : 'Create Classroom'}
          </button>
        </form>
      </Modal>
    </>
  );
};