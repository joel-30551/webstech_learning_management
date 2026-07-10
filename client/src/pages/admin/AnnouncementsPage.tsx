import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  Eye,
  Pin,
  PinOff,
  Archive,
  ArchiveRestore,
  Megaphone,
  AlertTriangle,
} from 'lucide-react';

import '../../styles/admin/AnnouncementsPage.css';


interface Announcement {
  _id: string;
  title: string;
  message: string;
  targetAudience: 'all' | 'students' | 'teachers' | 'streams';
  targetStreams: string[];
  priority: 'normal' | 'important' | 'urgent';
  status: 'active' | 'archived';
  pinned: boolean;
  postedAt: string;
  expiresAt?: string;
  postedBy?: string;
  readCount?: number;
  totalRecipients?: number;
}

interface AnnouncementForm {
  title: string;
  message: string;
  targetAudience: Announcement['targetAudience'];
  targetStreams: string[];
  priority: Announcement['priority'];
  pinned: boolean;
  expiresAt: string;
}

const emptyForm: AnnouncementForm = {
  title: '',
  message: '',
  targetAudience: 'all',
  targetStreams: [],
  priority: 'normal',
  pinned: false,
  expiresAt: '',
};

const audienceOptions: {
  value: Announcement['targetAudience'];
  label: string;
}[] = [
    {
      value: 'all',
      label: 'All Students',
    },
    {
      value: 'teachers',
      label: 'Teachers',
    },
    {
      value: 'streams',
      label: 'Specific Streams',
    },
  ];

const priorityOptions: {
  value: Announcement['priority'];
  label: string;
}[] = [
    {
      value: 'normal',
      label: 'Normal',
    },
    {
      value: 'important',
      label: 'Important',
    },
    {
      value: 'urgent',
      label: 'Urgent',
    },
  ];

const availableStreams = [
  'Science',
  'Business',
  'General Arts',
  'Visual Arts',
  'Home Economics',
];

const audienceLabel = (a: Announcement) => {
  if (a.targetAudience === 'streams') {
    return a.targetStreams?.length
      ? a.targetStreams.join(', ')
      : 'Specific Streams';
  }

  return (
    audienceOptions.find(
      option => option.value === a.targetAudience
    )?.label || a.targetAudience
  );
};

const AnnouncementPage: React.FC = () => {

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [search, setSearch] = useState('');
  const [filterAudience, setFilterAudience] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');


  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);


  const [form, setForm] = useState<AnnouncementForm>(emptyForm);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);


  const [viewItem, setViewItem] = useState<Announcement | null>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<Announcement | null>(null);

  const [archiveTarget, setArchiveTarget] =
    useState<Announcement | null>(null);

  const [archiveLoading, setArchiveLoading] =
    useState(false);



  const fetchAnnouncements = useCallback(async () => {

    setLoading(true);
    setFetchError('');


    const params = new URLSearchParams();


    if (search)
      params.append('search', search);


    if (filterAudience)
      params.append('targetAudience', filterAudience);


    if (filterStatus)
      params.append('status', filterStatus);



    try {

      const res = await fetch(
        `/api/announcements?${params.toString()}`,
        {
          headers: {
            Authorization:
              `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );


      if (!res.ok)
        throw new Error(
          `Request failed (${res.status})`
        );


      const data = await res.json();


      setAnnouncements(
        Array.isArray(data)
          ? data
          : []
      );


    } catch (err) {

      console.error(
        'Failed to load announcements:',
        err
      );

      setFetchError(
        'Could not load announcements. Check API connection.'
      );

      setAnnouncements([]);

    } finally {

      setLoading(false);

    }

  }, [
    search,
    filterAudience,
    filterStatus,
  ]);



  useEffect(() => {

    fetchAnnouncements();

  }, [fetchAnnouncements]);




  const openAdd = () => {

    setEditing(null);
    setFormError('');
    setForm(emptyForm);
    setShowModal(true);

  };



  const openEdit = (a: Announcement) => {

    setEditing(a);


    setForm({
      title: a.title,
      message: a.message,
      targetAudience: a.targetAudience,
      targetStreams: a.targetStreams || [],
      priority: a.priority,
      pinned: a.pinned,
      expiresAt:
        a.expiresAt
          ? a.expiresAt.slice(0, 10)
          : '',
    });


    setFormError('');
    setShowModal(true);

  };



  const toggleStream = (stream: string) => {

    setForm(current => ({
      ...current,

      targetStreams:
        current.targetStreams.includes(stream)

          ? current.targetStreams.filter(
            s => s !== stream
          )

          : [
            ...current.targetStreams,
            stream,
          ],
    }));

  };



  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();


    setFormError('');


    if (
      form.targetAudience === 'streams' &&
      form.targetStreams.length === 0
    ) {

      setFormError(
        'Select at least one stream.'
      );

      return;

    }


    setFormLoading(true);



    const payload = {

      title: form.title,

      message: form.message,

      targetAudience:
        form.targetAudience,

      targetStreams:
        form.targetAudience === 'streams'
          ? form.targetStreams
          : [],

      priority:
        form.priority,

      pinned:
        form.pinned,

      expiresAt:
        form.expiresAt || null,

    };



    const url = editing
      ? `/api/announcements/${editing._id}`
      : '/api/announcements';


    const method = editing
      ? 'PUT'
      : 'POST';



    try {

      const res = await fetch(
        url,
        {
          method,

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${localStorage.getItem('token')}`,
          },

          body:
            JSON.stringify(payload),
        }
      );


      const data = await res.json();



      if (!res.ok) {

        setFormError(
          data.message ||
          'Operation failed.'
        );

        return;

      }



      setShowModal(false);

      fetchAnnouncements();



    } catch {

      setFormError(
        'Network error. Please try again.'
      );


    } finally {

      setFormLoading(false);

    }

  };
  const handleDelete = async () => {
    if (!deleteTarget) return;

    await fetch(
      `/api/announcements/${deleteTarget._id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization:
            `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    setDeleteTarget(null);
    fetchAnnouncements();
  };



  const handleToggleArchive = async () => {

    if (!archiveTarget) return;


    setArchiveLoading(true);


    const nextStatus =
      archiveTarget.status === 'archived'
        ? 'active'
        : 'archived';


    try {

      await fetch(
        `/api/announcements/${archiveTarget._id}/status`,
        {
          method: 'PATCH',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${localStorage.getItem('token')}`,
          },

          body:
            JSON.stringify({
              status: nextStatus,
            }),
        }
      );


      setArchiveTarget(null);

      fetchAnnouncements();


    } finally {

      setArchiveLoading(false);

    }

  };



  const handleTogglePin = async (
    a: Announcement
  ) => {

    try {

      await fetch(
        `/api/announcements/${a._id}`,
        {
          method: 'PUT',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${localStorage.getItem('token')}`,
          },

          body:
            JSON.stringify({
              ...a,
              pinned: !a.pinned,
            }),
        }
      );


      fetchAnnouncements();


    } catch {

      // Ignore pin errors

    }

  };



  return (

    <div className="mgmt-page">


      {/* Header */}
      <div className="mgmt-header">

        <div>

          <h2>
            Internal Announcement System
          </h2>

          <p>
            Post announcements to students,
            teachers, or specific streams.
          </p>

        </div>


        <button
          id="btn"
          className="btn-add"
          onClick={openAdd}
        >

          <Plus size={16} />

          New Announcement

        </button>

      </div>




      {/* Toolbar */}
      <div
        id="toolbar"
        className="mgmt-toolbar"
      >

        <div className="search-box">

          <Search size={16} />

          <input

            placeholder="Search by title or message..."

            value={search}

            onChange={
              e =>
                setSearch(e.target.value)
            }

          />

        </div>



        <div
          id="filter"
          className="filter-group"
        >

          <div className="filter-select">

            <select
              value={filterAudience}
              onChange={
                e =>
                  setFilterAudience(
                    e.target.value
                  )
              }
            >

              <option value="">
                All Audiences
              </option>


              {audienceOptions.map(o => (

                <option
                  key={o.value}
                  value={o.value}
                >

                  {o.label}

                </option>

              ))}

            </select>


            <ChevronDown size={14} />

          </div>



          <div className="filter-select">

            <select
              value={filterStatus}
              onChange={
                e =>
                  setFilterStatus(
                    e.target.value
                  )
              }
            >

              <option value="active">
                Active
              </option>

              <option value="archived">
                Archived
              </option>

              <option value="">
                All
              </option>

            </select>


            <ChevronDown size={14} />

          </div>


        </div>


      </div>




      <p className="record-count">

        {announcements.length}

        {' '}

        announcement
        {announcements.length !== 1 && 's'}
        {' '}found

      </p>




      {/* Announcement Cards */}
      <div className="announcements-list">


        {loading ? (

          <p className="table-state">
            Loading announcements...
          </p>


        ) : fetchError ? (

          <p className="table-state table-state-error">
            {fetchError}
          </p>


        ) : announcements.length === 0 ? (

          <p className="table-state">

            No announcements found.
            Post one to get started.

          </p>


        ) : (


          announcements.map(a => (

            <div

              key={a._id}

              className={
                `announcement-card ${a.status === 'active'
                  ? 'announcement-unread'
                  : ''
                }`
              }

            >


              <div className="announcement-icon">

                <Megaphone size={22} />

              </div>




              <div className="announcement-body">



                <div className="announcement-top">


                  <h4>
                    {a.title}
                  </h4>



                  <div>


                    {a.priority === 'urgent' && (

                      <span className="badge-red">

                        <AlertTriangle size={11} />

                        Urgent

                      </span>

                    )}



                    {a.pinned && (

                      <span
                        className="badge-red"
                        style={{
                          marginLeft: 8
                        }}
                      >

                        <Pin size={11} />

                        Pinned

                      </span>

                    )}


                  </div>


                </div>





                <p
                  className="
                    announcement-message
                    clamped
                  "
                >

                  {a.message}

                </p>





                <div className="announcement-meta">


                  <span>
                    Audience:
                    {' '}
                    {audienceLabel(a)}
                  </span>



                  <span>

                    Posted:
                    {' '}

                    {
                      a.postedAt
                        ? new Date(
                          a.postedAt
                        ).toLocaleDateString()

                        : '—'
                    }

                  </span>



                  <span>

                    Status:
                    {' '}
                    {a.status}

                  </span>



                  {
                    typeof a.readCount === 'number' &&
                    typeof a.totalRecipients === 'number' && (

                      <span>

                        Read:
                        {' '}
                        {a.readCount}
                        /
                        {a.totalRecipients}

                      </span>

                    )
                  }



                </div>





                <div
                  className="td-actions"
                  style={{
                    marginTop: 14
                  }}
                >


                  <button
                    className="action-btn view-btn"
                    title="View"
                    onClick={() =>
                      setViewItem(a)
                    }
                  >

                    <Eye size={15} />

                  </button>



                  <button
                    className="action-btn lock-btn"
                    title={
                      a.status === 'archived'
                        ? 'Restore'
                        : 'Archive'
                    }

                    onClick={() =>
                      setArchiveTarget(a)
                    }
                  >

                    {
                      a.status === 'archived'
                        ? <ArchiveRestore size={15} />
                        : <Archive size={15} />
                    }

                  </button>



                  <button
                    className="action-btn edit-btn"
                    title="Edit"
                    onClick={() =>
                      openEdit(a)
                    }
                  >

                    <Pencil size={15} />

                  </button>



                  <button
                    className="action-btn delete-btn"
                    title="Delete"
                    onClick={() =>
                      setDeleteTarget(a)
                    }
                  >

                    <Trash2 size={15} />

                  </button>



                  <button
                    className="pin-btn"
                    title={
                      a.pinned
                        ? 'Unpin'
                        : 'Pin'
                    }
                    onClick={() =>
                      handleTogglePin(a)
                    }
                  >

                    {
                      a.pinned
                        ? <Pin
                          size={15}
                          fill="currentColor"
                        />

                        : <PinOff size={15} />
                    }

                  </button>



                </div>



              </div>



            </div>


          ))

        )}


      </div>
      {/* Add/Edit Modal */}
      {showModal && (

        <div
          className="modal-overlay"
          onClick={() => setShowModal(false)}
        >

          <div
            className="modal-box modal-large"
            onClick={
              e => e.stopPropagation()
            }
          >

            <div className="modal-header">

              <h3>
                {
                  editing
                    ? 'Edit Announcement'
                    : 'New Announcement'
                }
              </h3>


              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >

                <X size={18} />

              </button>

            </div>



            {
              formError && (

                <p className="modal-error">
                  {formError}
                </p>

              )
            }




            <form
              className="modal-form"
              onSubmit={handleSubmit}
            >


              <div className="form-group">

                <label>
                  Title *
                </label>


                <input
                  required
                  value={form.title}
                  onChange={
                    e =>
                      setForm({
                        ...form,
                        title: e.target.value
                      })
                  }
                />

              </div>





              <div className="form-group">

                <label>
                  Message *
                </label>


                <textarea

                  required

                  rows={5}

                  value={form.message}

                  onChange={
                    e =>
                      setForm({
                        ...form,
                        message: e.target.value
                      })
                  }

                  placeholder="
                    Write the announcement content...
                  "

                />

              </div>





              <div className="form-row">


                <div className="form-group">

                  <label>
                    Target Audience *
                  </label>


                  <select

                    value={
                      form.targetAudience
                    }

                    onChange={
                      e =>
                        setForm({
                          ...form,
                          targetAudience:
                            e.target.value as Announcement['targetAudience']
                        })
                    }

                  >

                    {
                      audienceOptions.map(o => (

                        <option
                          key={o.value}
                          value={o.value}
                        >

                          {o.label}

                        </option>

                      ))
                    }

                  </select>

                </div>





                <div className="form-group">

                  <label>
                    Priority
                  </label>


                  <select

                    value={form.priority}

                    onChange={
                      e =>
                        setForm({
                          ...form,
                          priority:
                            e.target.value as Announcement['priority']
                        })
                    }

                  >

                    {
                      priorityOptions.map(o => (

                        <option
                          key={o.value}
                          value={o.value}
                        >

                          {o.label}

                        </option>

                      ))
                    }

                  </select>

                </div>


              </div>





              {
                form.targetAudience === 'streams' && (

                  <div className="form-group">

                    <label>
                      Select Streams *
                    </label>


                    <div className="permission-grid">


                      {
                        availableStreams.map(stream => (

                          <label
                            key={stream}
                            className="permission-check"
                          >

                            <input

                              type="checkbox"

                              checked={
                                form.targetStreams.includes(
                                  stream
                                )
                              }

                              onChange={() =>
                                toggleStream(stream)
                              }

                            />

                            {stream}

                          </label>

                        ))
                      }


                    </div>


                  </div>

                )
              }






              <div className="form-row">


                <div className="form-group">

                  <label>
                    Expires On (optional)
                  </label>


                  <input

                    type="date"

                    value={
                      form.expiresAt
                    }

                    onChange={
                      e =>
                        setForm({
                          ...form,
                          expiresAt:
                            e.target.value
                        })
                    }

                  />

                </div>





                <div className="form-group">

                  <label
                    className="permission-check"
                    style={{
                      marginTop: 28
                    }}
                  >

                    <input

                      type="checkbox"

                      checked={
                        form.pinned
                      }

                      onChange={
                        e =>
                          setForm({
                            ...form,
                            pinned:
                              e.target.checked
                          })
                      }

                    />

                    Pin to top of dashboard

                  </label>

                </div>


              </div>






              <div className="modal-actions">


                <button

                  type="button"

                  className="btn-cancel"

                  onClick={() =>
                    setShowModal(false)
                  }

                >

                  Cancel

                </button>





                <button

                  id="btn"

                  type="submit"

                  className="btn-submit"

                  disabled={formLoading}

                >

                  {
                    formLoading
                      ? 'Posting...'
                      : editing
                        ? 'Save Changes'
                        : 'Post Announcement'
                  }

                </button>


              </div>


            </form>


          </div>


        </div>

      )}







      {/* View Modal */}
      {viewItem && (

        <div
          className="modal-overlay"
          onClick={() => setViewItem(null)}
        >

          <div
            className="modal-box"
            onClick={
              e => e.stopPropagation()
            }
          >

            <div className="modal-header">

              <h3>
                {viewItem.title}
              </h3>


              <button
                className="modal-close"
                onClick={() => setViewItem(null)}
              >

                <X size={18} />

              </button>


            </div>




            <div className="profile-grid">

              <ProfileRow
                label="Audience"
                value={audienceLabel(viewItem)}
              />

              <ProfileRow
                label="Priority"
                value={viewItem.priority}
              />

              <ProfileRow
                label="Status"
                value={viewItem.status}
              />

              <ProfileRow
                label="Pinned"
                value={
                  viewItem.pinned
                    ? 'Yes'
                    : 'No'
                }
              />

              <ProfileRow
                label="Posted"
                value={
                  viewItem.postedAt
                    ? new Date(
                      viewItem.postedAt
                    ).toLocaleString()
                    : '—'
                }
              />


              <ProfileRow
                label="Expires"
                value={
                  viewItem.expiresAt
                    ? new Date(
                      viewItem.expiresAt
                    ).toLocaleDateString()
                    : 'Never'
                }
              />

            </div>





            <p className="announcement-view-message">

              {viewItem.message}

            </p>



          </div>

        </div>

      )}







      {/* Archive Confirmation */}
      {archiveTarget && (

        <div
          className="modal-overlay"
          onClick={() => setArchiveTarget(null)}
        >

          <div
            className="modal-box confirm-box"
            onClick={
              e => e.stopPropagation()
            }
          >

            <div className="modal-header">

              <h3>

                {
                  archiveTarget.status === 'archived'
                    ? 'Restore Announcement'
                    : 'Archive Announcement'
                }

              </h3>


              <button
                className="modal-close"
                onClick={() =>
                  setArchiveTarget(null)
                }
              >

                <X size={18} />

              </button>


            </div>




            <p className="confirm-text">

              {
                archiveTarget.status === 'archived'

                  ? (
                    <>
                      Restore
                      {' '}
                      <strong>
                        {archiveTarget.title}
                      </strong>
                      {' '}
                      back to active feed?
                    </>
                  )

                  : (
                    <>
                      Move
                      {' '}
                      <strong>
                        {archiveTarget.title}
                      </strong>
                      {' '}
                      to archive?
                    </>
                  )
              }

            </p>



            <div className="modal-actions">


              <button
                className="btn-cancel"
                onClick={() =>
                  setArchiveTarget(null)
                }
              >

                Cancel

              </button>



              <button
                className="btn-delete-confirm"
                onClick={handleToggleArchive}
                disabled={archiveLoading}
              >

                {
                  archiveLoading
                    ? 'Working...'
                    : archiveTarget.status === 'archived'
                      ? 'Yes, Restore'
                      : 'Yes, Archive'
                }

              </button>


            </div>


          </div>


        </div>

      )}







      {/* Delete Confirmation */}
      {deleteTarget && (

        <div
          className="modal-overlay"
          onClick={() => setDeleteTarget(null)}
        >

          <div
            className="modal-box confirm-box"
            onClick={
              e => e.stopPropagation()
            }
          >

            <div className="modal-header">

              <h3>
                Confirm Delete
              </h3>


              <button
                className="modal-close"
                onClick={() =>
                  setDeleteTarget(null)
                }
              >

                <X size={18} />

              </button>


            </div>




            <p className="confirm-text">

              Are you sure you want to permanently delete

              {' '}

              <strong>
                {deleteTarget.title}
              </strong>

              ?

            </p>




            <div className="modal-actions">


              <button
                className="btn-cancel"
                onClick={() =>
                  setDeleteTarget(null)
                }
              >

                Cancel

              </button>



              <button
                className="btn-delete-confirm"
                onClick={handleDelete}
              >

                Yes, Delete

              </button>


            </div>


          </div>


        </div>

      )}


    </div>

  );

};




const ProfileRow = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (

  <div className="profile-row">

    <span className="profile-label">
      {label}
    </span>


    <span className="profile-value">
      {value}
    </span>


  </div>

);
export default AnnouncementPage;