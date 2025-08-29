import mongoose, { Document } from "mongoose";

export interface ICategory extends Document {
    name: string;
    userId: mongoose.Schema.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const CategorySchema = new mongoose.Schema<ICategory>({
    name: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
}, {
    timestamps: true,
});

const Category = mongoose.model<ICategory>("Category", CategorySchema);

export default Category;