import mongoose, { Document } from "mongoose";

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    avatar: string;

    createdAt: Date;
    updatedAt: Date;
};

const userSchema = new mongoose.Schema<IUser>({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        trim: true,
    },
    avatar: {
        type: String,
        default: null,
    },
}, {
    timestamps: true,
});

const User = mongoose.model<IUser>("User", userSchema);

export default User;
