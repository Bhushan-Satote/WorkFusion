import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyTasks, updateMyTaskStatus } from '../store/taskStore';
import { FaTasks, FaSpinner, FaCheckCircle, FaFilter } from 'react-icons/fa';

const statusBadgeClasses = (s) => (
  s === 'Done'
    ? 'bg-green-50 text-green-700 border border-green-200'
    : s === 'In Progress'
    ? 'bg-blue-50 text-blue-700 border border-blue-200'
    : 'bg-gray-50 text-gray-700 border border-gray-200'
);

const priorityBadgeClasses = (p) => (
  p === 'High'
    ? 'bg-red-50 text-red-700 border border-red-200'
    : p === 'Medium'
    ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
    : 'bg-green-50 text-green-700 border border-green-200'
);

const actionBtnClasses = {
  default:
    'px-3 py-1.5 text-xs rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40',
  todo: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100',
  inprogress: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  done: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
};

const rowAccentClasses = (s) => (
  s === 'Done' ? 'border-blue-500' : s === 'In Progress' ? 'border-[#418EFD]' : 'border-gray-200'
);

const EmployeeTasks = () => {
  const dispatch = useDispatch();
  const { tasks, isLoading, error } = useSelector((state) => state.tasks);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    dispatch(fetchMyTasks());
  }, [dispatch]);

  const counts = useMemo(() => {
    const c = { all: tasks?.length || 0, todo: 0, inprogress: 0, done: 0 };
    tasks?.forEach((t) => {
      if (t.status === 'To-do') c.todo += 1;
      else if (t.status === 'In Progress') c.inprogress += 1;
      else if (t.status === 'Done') c.done += 1;
    });
    return c;
  }, [tasks]);

  const filtered = useMemo(() => {
    if (filter === 'all') return tasks;
    if (filter === 'todo') return tasks.filter((t) => t.status === 'To-do');
    if (filter === 'inprogress') return tasks.filter((t) => t.status === 'In Progress');
    if (filter === 'done') return tasks.filter((t) => t.status === 'Done');
    return tasks;
  }, [tasks, filter]);

  const handleStatusChange = async (task, nextStatus) => {
    await dispatch(updateMyTaskStatus({ taskId: task._id, status: nextStatus }));
  };

  const FilterChip = ({ value, label, count }) => (
    <button
      onClick={() => setFilter(value)}
      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
        filter === value
          ? 'bg-blue-50 text-blue-700 border-blue-200'
          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
      }`}
      aria-pressed={filter === value}
    >
      <span className="font-medium">{label}</span>
      <span className="ml-2 inline-flex items-center justify-center text-xs px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600">
        {count}
      </span>
    </button>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border">
          {/* Header */}
          <div className="relative overflow-hidden bg-gradient-to-r from-[#377ff5] via-[#418EFD] to-[#8BBAFC] text-white rounded-2xl p-4 sm:p-6 shadow-lg border border-[#8BBAFC]/40">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start md:items-center">
                <div className="p-2.5 sm:p-3 bg-white/15 rounded-xl mr-2.5 sm:mr-3">
                  <FaTasks className="text-white text-xl sm:text-2xl" />
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold leading-tight tracking-tight">My Tasks</h3> <div className="mt-1 h-1.5 w-24 sm:w-28 bg-gradient-to-r from-white/80 to-white/20 rounded-full animate-[pulse_2.5s_ease-in-out_infinite]"></div>
                  <p className="text-white/90 text-xs sm:text-sm mt-1">Stay on top of your work across projects</p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden sm:flex items-center gap-2">
                  <FilterChip value="all" label="All" count={counts.all} />
                  <FilterChip value="todo" label="To-do" count={counts.todo} />
                  <FilterChip value="inprogress" label="In Progress" count={counts.inprogress} />
                  <FilterChip value="done" label="Done" count={counts.done} />
                </div>
                <div className="sm:hidden flex items-center">
                  <div className="relative">
                    <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="pl-9 pr-3 py-2 rounded-lg bg-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/60 border border-white/40 backdrop-blur-sm"
                    >
                      <option className="text-gray-800" value="all">All</option>
                      <option className="text-gray-800" value="todo">To-do</option>
                      <option className="text-gray-800" value="inprogress">In Progress</option>
                      <option className="text-gray-800" value="done">Done</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {isLoading ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-40 mb-2" />
                          <div className="h-3 bg-gray-100 rounded w-24" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-16" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-5 bg-gray-200 rounded-full w-20" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-5 bg-gray-200 rounded-full w-24" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-16" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-7 bg-gray-200 rounded w-28" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex items-center justify-center py-6 text-gray-500">
                  <FaSpinner className="animate-spin mr-2" /> Loading tasks...
                </div>
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-4">
                {String(error)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex p-4 rounded-full bg-gray-50 mb-4">
                  <FaTasks className="text-3xl text-gray-400" />
                </div>
                <p className="text-gray-700 font-medium">No tasks found</p>
                <p className="text-gray-500 text-sm mt-1">Try switching the filter to see more tasks.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg divide-[#8BBAFC]/20 border border-[#8BBAFC]/20">
                <table className="min-w-full divide-y ">
                  <thead className="bg-blue-500 ">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Task</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#8BBAFC]/20">
                    {filtered.map((t) => (
                      <tr key={t._id} className={`group hover:bg-[#418EFD]/5 transition-colors `}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[320px]">{t.title}</div>
                          <div className="text-xs text-gray-500">Created by {t.created_by?.name || 'Unknown'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[#418EFD]/10 text-[#418EFD] border border-[#8BBAFC]/40">
                            {t.project_id?.project_details?.name || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${priorityBadgeClasses(
                              t.priority
                            )}`}
                          >
                            {t.priority || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span
                              className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${statusBadgeClasses(
                                t.status
                              )}`}
                            >
                              {t.status}
                            </span>
                            <span className="text-xs text-gray-500 mt-1">
                              {t.status_last_changed_at
                                ? new Date(t.status_last_changed_at).toLocaleString()
                                : t.updatedAt
                                ? new Date(t.updatedAt).toLocaleString()
                                : ''}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {t.due_date ? new Date(t.due_date).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-wrap gap-2">
                            {t.status !== 'To-do' && (
                              <button
                                onClick={() => handleStatusChange(t, 'To-do')}
                                className={`${actionBtnClasses.default} ${actionBtnClasses.todo}`}
                                aria-label="Mark as To-do"
                              >
                                To-do
                              </button>
                            )}
                            {t.status !== 'In Progress' && (
                              <button
                                onClick={() => handleStatusChange(t, 'In Progress')}
                                className={`${actionBtnClasses.default} ${actionBtnClasses.inprogress}`}
                                aria-label="Mark as In Progress"
                              >
                                In Progress
                              </button>
                            )}
                            {t.status !== 'Done' && (
                              <button
                                onClick={() => handleStatusChange(t, 'Done')}
                                className={`${actionBtnClasses.default} ${actionBtnClasses.done}`}
                                aria-label="Mark as Done"
                              >
                                Mark Done
                              </button>
                            )}
                            {t.status === 'Done' && (
                              <span className="inline-flex items-center text-green-600 text-xs">
                                <FaCheckCircle className="mr-1" /> Completed
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                  <span>
                    Showing <span className="font-medium text-gray-700">{filtered.length}</span> of{' '}
                    <span className="font-medium text-gray-700">{counts.all}</span> tasks
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeTasks;
