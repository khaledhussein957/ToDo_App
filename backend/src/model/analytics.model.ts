import mongoose, { Document } from "mongoose";

export interface IAnalytics extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    totalCategories: number;
    totalNotifications: number;
    totalSharedTasks: number;
    createdAt: Date;
}

const AnalyticsSchema = new mongoose.Schema<IAnalytics>({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    pendingTasks: { type: Number, default: 0 },
    totalCategories: { type: Number, default: 0 },
    totalNotifications: { type: Number, default: 0 },
    totalSharedTasks: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});

const Analytics = mongoose.model<IAnalytics>("Analytics", AnalyticsSchema);

export default Analytics;