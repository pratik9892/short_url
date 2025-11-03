import { ConflictError } from "../../errors/conflictError.js";
import { NotFound } from "../../errors/NotFound.js";
import { UnauthorizedError } from "../../errors/unauthorizedError.js";
import { emailQueue } from "../../infrastructure/queue/emailQueue.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt.util.js";
import bcrypt from "bcrypt";

export class UserService {
  constructor(userRepository) {
    this.UserRepository = userRepository;
  }

  async createAuthTokens(user) {
    const refreshToken = generateRefreshToken({ userId: user._id });
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    console.log(refreshToken,hashedRefreshToken , "refresh and hashed refresh in createauthtokesn");
    

    const tokensave = await this.UserRepository.updateRefreshToken(
      user._id,
      hashedRefreshToken
    );

    const accessToken = generateAccessToken({ userId: user._id });
    console.log(accessToken , "accessToken in auth tokens");
    
    return { refreshToken, accessToken };
  }

  async register(userData) {
    try {
      const userExists = await this.UserRepository.getUser(
        userData.username,
        userData.email,
        false
      );

      if (userExists) {
        throw new ConflictError("User exists with same credentials");
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const registeredUser = await this.UserRepository.register({
        username: userData.username,
        fullName: userData.fullName,
        email: userData.email,
        password: hashedPassword,
      });

      
      await emailQueue.add('sendWelcomeEmail' , {
        email : userData.email,
        username : userData.username
      })

      return registeredUser;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async login(userData) {
    try {
      //we will get userdata such as username and password from controller
      //we first get the user from findbyusername
      //if we donnot get user tell user to register and if we get user move to next step
      //if we find user we will compare the password given by user and one in the db
      //if pass is correct generate tokens and save if pass is wrong send wrong pass error
      const userExists = await this.UserRepository.getUser(
        null,
        userData.email,
        true,
        false
      );

      if (!userExists) {
        throw new UnauthorizedError("Invalid Credentials");
      }

      const isPasswordCorrect = await bcrypt.compare(
        userData.password,
        userExists.password
      );

      if (!isPasswordCorrect) {
        throw new UnauthorizedError("Invalid Credentials");
      }

      const { accessToken, refreshToken } = await this.createAuthTokens(
        userExists
      );

      return { user: userExists, tokens: { accessToken, refreshToken } };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async logout(userId) {
    try {
      const logoutUser = await this.UserRepository.updateRefreshToken(
        userId,
        null
      );

      return logoutUser;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async getUser(userId) {
    try {
      const user = await this.UserRepository.getUserWithId(userId);

      if (!user) {
        throw new NotFound("User", "");
      }

      return user;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async updateUser(userId, userData) {
    try {
      const updatedUser = await this.UserRepository.updateUser(
        userId,
        userData
      );

      return updatedUser;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async updatePassword(userId, oldPassword, newPassword) {
    try {
      const loggedUser = await this.UserRepository.getUserWithId(userId);

      if (!loggedUser) {
        throw new NotFound("User not found", userId);
      }

      const isPassCorrect = await bcrypt.compare(
        oldPassword,
        loggedUser.password
      );
      console.log(isPassCorrect);

      if (!isPassCorrect) {
        throw new ConflictError("Old Password is incorrect");
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      const updatedPassword = await this.UserRepository.updatePassword(
        userId,
        hashedNewPassword
      );
      console.log(updatedPassword);

      return updatedPassword;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async refreshAccessToken(refreshToken){
    try {
        // we get refreshtoken
        // we use jwt.verify and get the _id from the token
        // use getuser to get the user and its refresh token
        // then the user we got from the getuser we then compare the user.refreshtoken and the refreshtoken we have got
        //if mismatch send error
        // if same call generate tokens functions and send tokens to controller layer

        // mistakes while implementing
        // createAuthToken func returns {refreshToken , accessToken}
        // i was doing {newAcessTOkens , newRefreshToken} = await createAuthToken(userData)
        // which is wrong same mistake in controller


        const decodedToken = verifyRefreshToken(refreshToken)
        
        if(!decodedToken){
            throw new ConflictError("Unauthorized Request")
        }

        const userFromToken = await this.UserRepository.getUserWithId(decodedToken.userId)

        if(!userFromToken || !userFromToken.refreshToken){
            throw new NotFound("User not Found" , 'User')
        }

        const isTokenMatch = await bcrypt.compare(refreshToken,userFromToken.refreshToken)
        
        if(!isTokenMatch){
            await this.UserRepository.updateRefreshToken(userFromToken._id,null)
            throw new ConflictError("Token mismatched")
        }

        const {refreshToken:newRefreshToken , accessToken:newAccessToken} = await this.createAuthTokens(userFromToken)
        
        return {newAccessToken , newRefreshToken}


    } catch (error) {
        console.log(error)
        throw error
    }
  }
}
