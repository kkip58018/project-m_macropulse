import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

const UserApprovals = () => {
  const queryClient = useQueryClient();

  const { data: pending, isLoading: pendingLoading } = useQuery({
    queryKey: ['pendingUsers'],
    queryFn: () => api.get('/admin/users/pending/').then(res => res.data),
  });

  const { data: approved, isLoading: approvedLoading } = useQuery({
    queryKey: ['approvedUsers'],
    queryFn: () => api.get('/admin/users/approved/').then(res => res.data),
  });

  const approveUser = useMutation({
    mutationFn: (userId) => api.post(`/admin/users/${userId}/approve/`),
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingUsers']);
      queryClient.invalidateQueries(['approvedUsers']);
    },
    onError: (error) => alert(`Error: ${error.response?.data?.error || error.message}`),
  });

  if (pendingLoading || approvedLoading) return <div className="text-gray-400">Loading...</div>;

  return (
    <div className="text-white">
      <h2 className="text-2xl font-bold mb-4">👥 User Approvals</h2>

      <div className="bg-dark-200 p-4 rounded-lg border border-dark-300 mb-6">
        <h3 className="text-lg font-semibold mb-3 text-yellow-400">⏳ Pending Approval</h3>
        {pending && pending.length > 0 ? (
          <div className="space-y-2">
            {pending.map((user) => (
              <div key={user.id} className="flex items-center justify-between bg-dark-300 p-3 rounded">
                <div>
                  <span className="text-white">{user.email}</span>
                  <span className="text-gray-400 text-sm ml-4">
                    Joined: {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={() => approveUser.mutate(user.id)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded text-sm transition"
                  disabled={approveUser.isPending}
                >
                  Approve
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No pending approvals.</p>
        )}
      </div>

      <div className="bg-dark-200 p-4 rounded-lg border border-dark-300">
        <h3 className="text-lg font-semibold mb-3 text-green-400">✅ Approved Users</h3>
        {approved && approved.length > 0 ? (
          <div className="space-y-2">
            {approved.map((user) => (
              <div key={user.id} className="flex items-center justify-between bg-dark-300 p-3 rounded">
                <div>
                  <span className="text-white">{user.email}</span>
                  <span className="text-gray-400 text-sm ml-4">
                    {user.is_admin ? '👑 Admin' : '👤 User'}
                  </span>
                  <span className="text-gray-400 text-sm ml-4">
                    Joined: {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No approved users.</p>
        )}
      </div>
    </div>
  );
};

export default UserApprovals;