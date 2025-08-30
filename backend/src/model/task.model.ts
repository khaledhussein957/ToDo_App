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
    document: string;
}

const TodoSchema = new mongoose.Schema<ITask>({
  title: { type: String, required: true },
  description: { type: String },
  completed: { type: Boolean, default: false },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
  dueDate: { type: Date },
  priority: {
    type: String,
    enum: ["high", "medium", "low"],
    default: "medium",
  },
  tags: [{ type: String }],
  recurrence: {
    type: String,
    enum: ["Daily", "Weekly", "Monthly", null],
    default: null,
  },
  document: {
    type: String,
    default: "",
},
},{
    timestamps: true,
});

const Task = mongoose.model<ITask>("Task", TodoSchema);

export default Task;
