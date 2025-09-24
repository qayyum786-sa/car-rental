import { findByUsername, createUser, getAllUsers, getCounts } from "../dal/users-dal";
import bcrypt from "bcryptjs";

const userService = {
  findByUsername: async (username) => {
    return await findByUsername(username);
  },

  createUser: async (username, password, name, role) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    return await createUser(username, hashedPassword, name, role);
  },

  getAllUsers: async (skip, limit, searchText) => {
    return await getAllUsers(skip, limit, searchText);
  },

  getCounts: async (is_active) => {
    return await getCounts(is_active);
  },

    generateUsername: async (mobile) => {
        let baseUsername = mobile || `user_${Date.now()}`;
        const existingUser = await findByUsername(baseUsername);
        if (!existingUser) {
            return baseUsername;
        }

        return `${baseUsername}_${Date.now()}`;
  }


};

export default userService;