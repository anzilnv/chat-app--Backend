import cloudnary from "../lib/cloudnary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.models.js"
import bcrypt from "bcryptjs"

export const signup = async (req, res) => {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        if (password.length < 6) {
            return res.status(400).json({ message: "password must be least 6 characteres" })
        }
        const user = await User.findOne({ email })

        if (user) return res.status(400).json({ message: "Email already exist" })

        //hash password used pakage is used "bcryptjs"
        //eg:(123456789 => QDAKFHAUFJUXVYBAUFCAWVFAIWM) 
        const salt = await bcrypt.genSalt(10)
        const hashPassword = await bcrypt.hash(password, salt)

        const newUser = new User({
            fullName,
            email,
            password: hashPassword
        })
        if (newUser) {
            //generate token here
            generateToken(newUser._id, res)
            await newUser.save();
            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePic: newUser.profilePic,
            })
        } else {
            res.status(400).json({ message: "Invalid user data " })
        }
    } catch (error) {
        console.log("Error in login controller", error.message)
        res.status(500).json({ message: "Internal sever Error" })
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body
    try {
        const user = await User.findOne({ email })

        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" })
        }
        const ispassword = await bcrypt.compare(password, user.password);
        if (!ispassword) {
            return res.status(400).json({ message: "Invalid email or password" })
        }
        generateToken(user._id, res)

        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,

        })

    } catch (error) {
        console.log("Error in signup controller", error.message)
        res.status(500).json({ message: "Internal sever Error" })
    }
}

export const logout = (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 })
        res.status(200).json({ message: "Logged out successfully" })
    } catch (error) {
        console.log("Error in logout controller", error.message)
        res.status(500).json({ message: "Internal sever Error" })
    }
}

export const updateProfile = async (req, res) => {
    try {
        const { profilePic } = req.body;
        const userId = req.user._id;
        if (!profilePic) {
            return res.status(400).json({ message: "Please add a profile picture" })
        }

        const uplaodResponse = await cloudnary.uploader.upload(profilePic);
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePic: uplaodResponse.secure_url },
            { new: true })
        res.status(200).json(updatedUser);
    } catch (error) {
        console.log("Error in updated profile", error.message)
        res.status(500).json({ message: "Internal sever Error" })
    }
}

export const checkAuth = async (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.log("Error in checkAuth profile", error.message)
        res.status(500).json({ message: "Internal sever Error" })
    }
}

