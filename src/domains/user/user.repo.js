import { NotFound } from "../../errors/NotFound.js";
import { User } from "./user.model.js";

export class UserRepository {
  async register(userData) {
    try {
      console.log("user register func start user repo");
      const user = await User.create({
        username: userData.username.toLowerCase(),
        fullName: userData.fullName,
        email: userData.email,
        password: userData.password,
      });
      console.log(user + " user repo create user func");

      return user;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async getUserWithId(id) {
    try {
      const user = await User.findById(id).select("-password -refreshToken");
      if (!user) {
        throw new NotFound("User", id);
      }
      return user;
    } catch (error) {
      throw error;
    }
  }

  async getUser(username,email,shouldThrow = true, withPassword = false) {
    try {
      let user;
      let queryConditions = [];
      let selectFields = "-password -refreshToken";

      if(email){
        queryConditions.push({email : email})
      } 

      if(username){
        queryConditions.push({username : username.toLowerCase()})
      }

      let query = {$or : queryConditions}

      user = await User.findOne(query);

      if (!user) {
        if (shouldThrow) {
          throw new NotFound("User", username || email);
        }
        return null;
      }
      return user;
    } catch (error) {
      throw error;
    }
  }

  async updateUser(id, userData) {
    try {
      const updatedUser = await User.findByIdAndUpdate(
        id,
        {
          username: userData.username,
          fullName: userData.fullName,
          email: userData.email,
        },
        { new: true }
      );

      if (!updatedUser) {
        throw new NotFound("Update User", id);
      }
      return updatedUser;
    } catch (error) {
      throw error;
    }
  }

  async updateRefreshToken(id, refreshToken) {
    try {
      const updatedRefreshToken = await User.findByIdAndUpdate(
        id,
        {
          refreshToken: refreshToken,
        },
        { new: true }
      );

      if (!updatedRefreshToken) {
        throw new NotFound("Refresh Token", id);
      }
    } catch (error) {
      throw error;
    }
  }
}
