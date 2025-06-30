import jwt from "jsonwebtoken";
import { Request, Response } from "express-serve-static-core";
import User from "../models/User";
import sorter from "../utils/sorter";
import {
  IUser,
  IUserFilter,
  IUserRequest,
  IUserQueryParams,
  IUserResults,
} from "../@types/IUser";
import Client from "../models/Client";
import { Types } from "mongoose";

export async function userSignIn(req: Request, res: Response) {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    console.log(`User: ${user}`);

    if (!user) {
      res.status(404).json({ message: "Invalid credentials!" });
      return;
    }
    if (!user.comparePassword(password)) {
      res.status(404).json({ message: "Invalid credentials!!" });
      return;
    }
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
      },
      process.env.SECRET_KEY || "notsosecret",
      { expiresIn: "24h" }
    );

    res.cookie("token", token, {
      httpOnly: true, // Prevent JavaScript access
      secure: false, // Use HTTPS in production
      sameSite: "strict", // Protect against CSRF
      maxAge: 24 * 60 * 60 * 1000, // 1 day expiration
    });
    res.json({ message: "Login successful", token: token });
  } catch (error) {
    console.error(`Error [userSignIn]: ${error}`);
    res.status(400).json(error);
  }
}

export async function userSignUp(req: Request, res: Response) {
  try {
    const body = req.body;
    const user = new User(body);
    const userResult = await user.save();

    const clientCheck = await Client.findOne({
      firstName: userResult.firstName,
      middleName: userResult.middleName,
      lastName: userResult.lastName,
      extensionName: userResult.extensionName,
    });

    if (clientCheck && userResult) {
      clientCheck.user = new Types.ObjectId(user._id);
      clientCheck.save();
    } else if (userResult) {
      const client = new Client({
        firstName: userResult.firstName,
        middleName: userResult.middleName,
        lastName: userResult.lastName,
        contactNo: userResult.contactNo,
        email: userResult.email,
        user: new Types.ObjectId(user._id),
      });
      client.save();
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.SECRET_KEY || "notsosecret",
      { expiresIn: "1h" }
    );
    res.status(201).json({ token });
  } catch (error) {
    console.error(`Error [userSignUp]: ${error}`);
    res.status(400).json(error);
  }
}

export async function userSignOut(req: Request, res: Response) {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });

    res.status(200).json({ message: "Signed-out successfully." });
  } catch (error) {
    console.error(`Error [userSignOut]: ${error}`);
    res.status(400).json(error);
  }
}

export async function getCurrentUser(req: IUserRequest, res: Response) {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json(user);
  } catch (error) {
    console.error(`Error [getCurrentUser]: ${error}`);
    res.status(400).json(error);
  }
}

export async function getUsers(
  req: Request<{}, {}, {}, IUserQueryParams>,
  res: Response
) {
  try {
    const {
      firstName,
      middleName,
      lastName,
      extensionName,
      fullName,
      username,
      email,
      role,
      personnel,
      exclude,
      noPage,
    } = req.query;

    const filter: IUserFilter = {};
    const sortResult = await sorter(req.query.sort);

    if (firstName)
      filter.firstName = { $regex: firstName + ".*", $options: "i" };
    if (middleName)
      filter.middleName = { $regex: middleName + ".*", $options: "i" };
    if (lastName) filter.lastName = { $regex: lastName + ".*", $options: "i" };
    if (username) filter.username = { $regex: username + ".*", $options: "i" };
    if (email) filter.email = { $regex: email + ".*", $options: "i" };
    if (extensionName)
      filter.extensionName = { $regex: extensionName + ".*", $options: "i" };
    if (role) filter.role = { $regex: role + ".*", $options: "i" };
    if (personnel) filter.role = { $in: ["staff"] };
    if (fullName)
      filter.$or = [
        { firstName: { $regex: fullName, $options: "i" } },
        { lastName: { $regex: fullName, $options: "i" } },
      ];
    if (exclude) filter._id = { $ne: exclude };

    const page: number = Number(req.query.page) || 1;
    const limit: number = req.query.limit || 10;
    const skip: number = (page - 1) * limit;

    let users = [];

    console.log(filter);

    if (role && personnel) {
      console.log("1");
      res.status(400).json({
        message:
          "Query parameters are conflict, role and personnel should not be used at the same time.",
      });
      return;
    }

    if (noPage) {
      console.log("4");
      users = await User.find(filter).select("-password").sort(sortResult);
      res.json(users);
      return;
    }

    users = await User.find(filter)
      .select("-password")
      .sort(sortResult)
      .skip(skip)
      .limit(limit);
    const total = await User.find(filter).countDocuments();
    // const total = users.length

    const results: IUserResults = {
      results: users,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    };
    res.json(results);
  } catch (error) {
    console.error(`Error [getUsers]: ${error}`);
    res.status(400).json(error);
  }
}

export async function getUser(req: Request, res: Response) {
  try {
    const user: IUser = await User.findById(req.params.id).select("-password");
    if (!user) {
      res.status(404).json({ messsage: "User not found" });
      return;
    }
    res.json(user);
  } catch (error) {
    console.error(`Error [getUserById]: ${error}`);
    res.status(400).json(error);
  }
}

export async function getClientDetails(req: IUserRequest, res: Response) {
  try {
    const clientDetails = await Client.find({
      user: new Types.ObjectId(req.userId),
    });
    if (!clientDetails) {
      res.status(404).json({ message: "`Client Details` not found." });
      return;
    }

    res.json(clientDetails[0]);
  } catch (error) {
    console.error(`Error [getClientDetails]: ${error}`);
    res.status(400).json(error);
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const user: IUser = await User.findById(req.params.id).select("-password");

    if (!user) {
      res.status(404).json({ messsage: "User not found" });
      return;
    }

    user.avatar = req.body.avatar;
    user.username = req.body.username;
    user.email = req.body.email;
    user.firstName = req.body.firstName;
    user.middleName = req.body.middleName;
    user.lastName = req.body.lastName;
    user.extensionName = req.body.extensionName;
    user.contactNo = req.body.contactNo;
    user.email = req.body.email;
    user.role = req.body.role;
    user.isActive = req.body.isActive;
    user.save();

    res.json(user);
  } catch (error) {
    console.error(`Error [updateUser]: ${error}`);
    res.status(400).json(error);
  }
}

export async function changePassword(req: Request, res: Response) {
  try {
    const user: IUser = await User.findById(req.params.id).select("-username");
    if (!user) {
      res.status(404).json({ messsage: "User not found" });
      return;
    }

    user.password = req.body.password;
    const done = user.save();
    if (!done) {
      res.status(400).json({ message: "Something went wrong." });
      return;
    }

    res.status(200).json({ message: "Successfully changed the password." });
  } catch (error) {
    console.error(`Error [changePassword]: ${error}`);
    res.status(400).json(error);
  }
}

export async function getTotalUserRoles(
  req: Request<{}, {}, {}, IUserQueryParams>,
  res: Response
) {
  try {
    const { total, totalSuperAdmin, totalAdmin, totalStaff, totalUser } =
      req.query;

    let result = {};

    if (total) {
      const total = await User.countDocuments();
      result = { ...result, total: total };
    }
    if (totalSuperAdmin) {
      const total = await User.find({ role: "superadmin" }).countDocuments();
      result = { ...result, totalSuperAdmin: total };
    }
    if (totalAdmin) {
      const total = await User.find({ role: "admin" }).countDocuments();
      result = { ...result, totalAdmin: total };
    }
    if (totalStaff) {
      const total = await User.find({ role: "staff" }).countDocuments();
      result = { ...result, totalStaff: total };
    }
    if (totalUser) {
      const total = await User.find({ role: "user" }).countDocuments();
      result = { ...result, totalUser: total };
    }

    res.json(result);
  } catch (error) {
    console.error(`Error [getTotalUserRoles]: ${error}`);
    res.status(400).json(error);
  }
}
