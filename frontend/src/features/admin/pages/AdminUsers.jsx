import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, Filter, MoreVertical, ShieldCheck, Trash2, UserX, Users, Search, X } from "lucide-react";
import StatusBadge from "../components/StatusBadge.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import AdminEmptyState from "../components/AdminEmptyState.jsx";
import AdminAlert from "../components/AdminAlert.jsx";
import AdminTableSkeleton from "../components/AdminTableSkeleton.jsx";
import { authClient } from "../../../lib/authClient.js";
import { deleteUser, fetchUser, fetchUsers, updateUserRole, updateUserStatus } from "../../../api/adminApi.js";
import { toast } from "../../../lib/toast.js";

const PAGE_SIZE = 10;

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [openMenu, setOpenMenu] = useState(null);
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [mutationError, setMutationError] = useState("");
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [mutatingUserId, setMutatingUserId] = useState("");
  const [detailState, setDetailState] = useState({
    open: false,
    loading: false,
    error: "",
    user: null,
    stats: null,
  });
  const { data: session } = authClient.useSession();
  const currentAdminId = session?.user?.id || "";

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setFetchError("");

    try {
      const response = await fetchUsers({
        search,
        role: roleFilter,
        status: statusFilter,
        page,
        limit: PAGE_SIZE,
      });

      setUsers(Array.isArray(response.users) ? response.users : []);
      setPagination({
        total: Number(response.total || 0),
        totalPages: Math.max(1, Number(response.totalPages || 1)),
      });
    } catch (error) {
      setFetchError(error.message || "Could not load admin users.");
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, search, statusFilter]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadUsers();
    }, search ? 250 : 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadUsers, search]);

  async function executeAction(action, user) {
    if (!user?.id) return;

    setMutationError("");
    setMutatingUserId(user.id);

    try {
      if (action === "suspend") {
        const nextStatus = user.status === "active" ? "suspended" : "active";
        await updateUserStatus(user.id, nextStatus);
        toast.success(nextStatus === "suspended" ? "User blocked." : "User unblocked.");
      } else if (action === "promote") {
        await updateUserRole(user.id, "admin");
        toast.success("User promoted to admin.");
      } else if (action === "demote") {
        await updateUserRole(user.id, "user");
        toast.success("Admin access removed.");
      } else if (action === "delete") {
        await deleteUser(user.id);
        toast.success("User deleted.");
      }

      setConfirm(null);
      setOpenMenu(null);
      await loadUsers();
    } catch (error) {
      setMutationError(error.message || "The user update could not be completed.");
    } finally {
      setMutatingUserId("");
    }
  }

  async function openUserDetails(user) {
    if (!user?.id) return;

    setOpenMenu(null);
    setDetailState({
      open: true,
      loading: true,
      error: "",
      user: null,
      stats: null,
    });

    try {
      const response = await fetchUser(user.id);
      setDetailState({
        open: true,
        loading: false,
        error: "",
        user: response.user || null,
        stats: response.stats || null,
      });
    } catch (error) {
      setDetailState({
        open: true,
        loading: false,
        error: error.message || "Could not load user details.",
        user: null,
        stats: null,
      });
    }
  }

  function closeUserDetails() {
    setDetailState({
      open: false,
      loading: false,
      error: "",
      user: null,
      stats: null,
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">User Management</h2>
        <p className="mt-1 text-sm text-gray-400">Manage accounts, roles, and access across the platform.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email..."
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB6C3]"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <select
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB6C3]"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>
        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB6C3]"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {fetchError ? <AdminAlert title="We could not load users." message={fetchError} onRetry={loadUsers} /> : null}
      {mutationError ? <AdminAlert title="The last user action failed." message={mutationError} /> : null}

      {loading ? (
        <AdminTableSkeleton rows={6} columns={7} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {["Name", "Email", "Role", "Status", "Joined", "Last Active", ""].map((header) => (
                    <th key={header} className="whitespace-nowrap px-5 py-3.5 text-left font-semibold text-gray-600">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10">
                      <AdminEmptyState
                        icon={Users}
                        title="No users matched these filters"
                        description="Try clearing your search or adjusting the role and status filters."
                      />
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const isCurrentAdmin = user.id === currentAdminId;

                    return (
                    <tr key={user.id} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-[#FF385C]">
                            {(user.avatarInitial || user.name?.charAt(0) || "?").toUpperCase()}
                          </div>
                          <span className="whitespace-nowrap font-medium text-gray-800">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">{user.email}</td>
                      <td className="px-5 py-3.5"><StatusBadge value={user.role} /></td>
                      <td className="px-5 py-3.5"><StatusBadge value={user.status} /></td>
                      <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">{user.joinedAt}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">{user.lastActive}</td>
                      <td className="relative px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                          className="rounded-lg p-1.5 transition-colors hover:bg-gray-100"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-400" />
                        </button>
                        {openMenu === user.id ? (
                          <div className="absolute right-4 top-10 z-20 w-44 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
                            <button
                              type="button"
                              onClick={() => void openUserDetails(user)}
                              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-600 transition-colors hover:bg-sky-50 hover:text-sky-600"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View details
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setConfirm({
                                  action: "suspend",
                                  user,
                                  label: user.status === "active" ? "Block user" : "Unblock user",
                                });
                              }}
                              disabled={user.id === currentAdminId}
                              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-600 transition-colors hover:bg-orange-50 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-gray-600"
                            >
                              <UserX className="h-3.5 w-3.5" />
                              {user.status === "active" ? "Block" : "Unblock"}
                            </button>
                            {user.role !== "admin" ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirm({
                                    action: "promote",
                                    user,
                                    label: "Promote to admin",
                                  });
                                }}
                                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-600 transition-colors hover:bg-rose-50 hover:text-[#FF385C]"
                              >
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Promote
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirm({
                                    action: "demote",
                                    user,
                                    label: "Remove admin access",
                                  });
                                }}
                                disabled={user.id === currentAdminId}
                                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-600 transition-colors hover:bg-rose-50 hover:text-[#FF385C] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-gray-600"
                              >
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Demote
                              </button>
                            )}
                            <div className="border-t border-gray-50" />
                            <button
                              type="button"
                              onClick={() => {
                                setConfirm({
                                  action: "delete",
                                  user,
                                  label: "Delete user",
                                });
                              }}
                              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-500 transition-colors hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3.5 text-sm">
            <span className="text-xs text-gray-400">
              Showing {pagination.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, pagination.total)} of {pagination.total} users
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="rounded-lg p-1.5 transition-colors hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4 text-gray-500" />
              </button>
              {Array.from({ length: pagination.totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={`h-8 w-8 rounded-lg text-xs font-semibold transition-colors ${
                    pageNumber === page ? "bg-[#FF385C] text-white" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
                disabled={page === pagination.totalPages}
                className="rounded-lg p-1.5 transition-colors hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      )}

      {detailState.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-2xl rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">User details</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Review account details, activity, and current access.
                </p>
              </div>
              <button
                type="button"
                onClick={closeUserDetails}
                className="rounded-xl p-2 transition-colors hover:bg-gray-100"
                aria-label="Close details"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-5">
              {detailState.loading ? (
                <div className="space-y-3">
                  <div className="h-5 w-40 animate-pulse rounded bg-gray-100" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <div key={index} className="rounded-2xl border border-gray-100 p-4">
                        <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
                        <div className="mt-3 h-4 w-32 animate-pulse rounded bg-gray-100" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : detailState.error ? (
                <AdminAlert title="We could not load this user." message={detailState.error} />
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DetailCard label="Email" value={detailState.user?.email} />
                    <DetailCard label="Joined" value={detailState.user?.joinedAt} />
                    <DetailCard label="Role" value={detailState.user?.role} badge />
                    <DetailCard label="Status" value={detailState.user?.status} badge />
                    <DetailCard label="Last active" value={detailState.user?.lastActive} />
                    <DetailCard label="Questions" value={detailState.stats?.questions} />
                    <DetailCard label="Accuracy" value={`${detailState.stats?.accuracy ?? 0}%`} />
                    <DetailCard label="Uploads" value={detailState.stats?.uploads} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={!!confirm}
        title={confirm?.label ?? ""}
        description={
          confirm?.action === "delete"
            ? `Delete ${confirm?.user?.email}? This permanently removes the account.`
            : confirm?.action === "suspend"
              ? `${confirm?.user?.status === "active" ? "Block" : "Unblock"} ${confirm?.user?.email}?`
              : confirm?.action === "demote"
                ? `Remove admin access from ${confirm?.user?.email}?`
                : `Grant admin access to ${confirm?.user?.email}?`
        }
        confirmLabel={confirm?.label ?? "Confirm"}
        confirmVariant={confirm?.action === "delete" || confirm?.action === "suspend" || confirm?.action === "demote" ? "danger" : "primary"}
        onConfirm={() => executeAction(confirm.action, confirm.user)}
        onCancel={() => {
          setConfirm(null);
          setOpenMenu(null);
        }}
      />

      {mutatingUserId ? (
        <p className="text-xs font-medium text-gray-400">Saving changes for user {mutatingUserId.slice(0, 8)}...</p>
      ) : null}
    </div>
  );
}

function DetailCard({ label, value, badge = false }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">{label}</p>
      {badge ? (
        <div className="mt-3">
          <StatusBadge value={String(value || "")} />
        </div>
      ) : (
        <p className="mt-2 text-sm font-medium text-gray-800">{value ?? "N/A"}</p>
      )}
    </div>
  );
}
