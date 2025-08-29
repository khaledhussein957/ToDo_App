import mongoose, { Document, Schema } from "mongoose";

export interface ITask extends Document {
    title: string;
    description: string;
    completed: boolean;
    userId: mongoose.Schema.Types.ObjectId;
    categoryId: mongoose.Schema.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    dueDate: Date;
    priority: string;
    tags: string[];
    recurrence: string;
    attachments: string[];
    sharedWith: mongoose.Schema.Types.ObjectId[];
}

const TodoSchema = new mongoose.Schema<ITask>({
  title: { type: String, required: true },
  description: { type: String },
  completed: { type: Boolean, default: false },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: "Category" }, // new field
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  dueDate: { type: Date },
  priority: {
    type: String,
    enum: ["High", "Medium", "Low"],
    default: "Medium",
  },
  tags: [{ type: String }],
  recurrence: {
    type: String,
    enum: ["Daily", "Weekly", "Monthly", null],
    default: null,
  },
  attachments: [{ type: String }],
  sharedWith: [{ type: Schema.Types.ObjectId, ref: "User" }],
},{
    timestamps: true,
});

const Task = mongoose.model<ITask>("Task", TodoSchema);

export default Task;
