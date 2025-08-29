import mongoose, { Document } from "mongoose";

export interface INotification extends Document {
    title: string;
    message: string;
    userId: mongoose.Schema.Types.ObjectId;
    taskId: mongoose.Schema.Types.ObjectId;
    createdAt: Date;
    notifyAt: Date;
    sent: boolean;
}

const NotificationSchema = new mongoose.Schema<INotification>({
    title: { type: String, required: true },
    message: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    createdAt: { type: Date, default: Date.now },
    notifyAt: { type: Date, required: true },
    sent: { type: Boolean, default: false },
});

const Notification = mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;