import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseQuery";

export const authApi = createApi({
    reducerPath: "authApi",
    baseQuery,
    tagTypes: ["Auth"],
    endpoints: (builder) => ({
        login: builder.mutation({
            query: (credentials) => ({
                url: "/auth/login",
                method: "POST",
                body: credentials,
            }),
            invalidatesTags: ["Auth"],
        }),
        register: builder.mutation({
            query: (credentials) => ({
                url: "/auth/register",
                method: "POST",
                body: credentials,
            }),
            invalidatesTags: ["Auth"],
        }),
    }),
});

export const { useLoginMutation, useRegisterMutation } = authApi;