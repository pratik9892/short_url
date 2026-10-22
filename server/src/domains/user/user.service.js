import { ConflictError } from "../../errors/conflictError.js";
import { NotFound } from "../../errors/notFound.js";
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
      const userExists = await this.UserRepository.getUser(
        null,
        userData.email,
        true,
        false
      );

      if (!userExists) {
        throw new UnauthorizedError("Invalid Credentials");
      }

      if (!userExists.password) {
        throw new UnauthorizedError(
          "This account uses Google sign-in. Continue with Google."
        );
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

  async loginWithGoogleProfile(profile) {
    const { googleId, email, fullName, avatar } = profile;

    if (!googleId || !email) {
      throw new UnauthorizedError("Google account did not provide email");
    }

    let user = await this.UserRepository.findByGoogleId(googleId);

    if (!user) {
      user = await this.UserRepository.findByEmail(email);

      if (user) {
        // Link Google to an existing email/password account
        user = await this.UserRepository.linkGoogleAccount(user._id, {
          googleId,
          avatar,
        });
      } else {
        const username = await this.#uniqueUsernameFromEmail(email);
        user = await this.UserRepository.register({
          username,
          fullName: fullName || username,
          email,
          password: null,
          googleId,
          avatar,
          authProvider: "google",
        });

        try {
          await emailQueue.add("sendWelcomeEmail", {
            email,
            username,
          });
        } catch (queueError) {
          console.error("Failed to enqueue welcome email", queueError);
        }
      }
    }

    const { accessToken, refreshToken } = await this.createAuthTokens(user);
    return { user, tokens: { accessToken, refreshToken } };
  }

  async #uniqueUsernameFromEmail(email) {
    const local = String(email)
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 16) || "user";

    let candidate = local;
    let i = 0;
    while (await this.UserRepository.usernameExists(candidate)) {
      i += 1;
      candidate = `${local}${i}`.slice(0, 20);
      if (i > 50) {
        candidate = `user${Date.now().toString(36)}`.slice(0, 20);
        break;
      }
    }
    return candidate;
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

      if (!loggedUser.password) {
        throw new ConflictError(
          "Password login is not set for this Google account"
        );
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
