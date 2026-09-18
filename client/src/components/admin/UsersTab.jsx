import { USER_ROLES } from "./shared.js";

export function UsersTab({
  users,
  onRoleChange,
  onToggleBlock,
}) {
  return (
    <>
      <div className="page-title">
        <h1>Users</h1>
        <p>Manage roles and account access.</p>
      </div>

      <div className="table-wrap panel">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>

                <td>
                  <select
                    value={user.role}
                    onChange={(event) =>
                      onRoleChange(
                        user,
                        event.target.value
                      )
                    }
                  >
                    {USER_ROLES.map((role) => (
                      <option
                        key={role}
                        value={role}
                      >
                        {role}
                      </option>
                    ))}
                  </select>
                </td>

                <td>
                  {user.isBlocked ? "Blocked" : "Active"}
                </td>

                <td>
                  <button
                    className="text-button"
                    onClick={() => onToggleBlock(user)}
                  >
                    {user.isBlocked
                      ? "Unblock"
                      : "Block"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
