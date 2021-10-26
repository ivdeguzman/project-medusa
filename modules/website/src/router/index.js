import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "../views/Dashboard.vue";

const routes = [
    {
        path: "/",
        component: Dashboard,
        children: [
            {
                path: "",
                component: () => import("../views/MainMenu"),
            },
            {
                path: "/sections",
                component: () => import("../views/Sections"),
            },
            {
                path: "/professors",
                component: () => import("../views/Professors"),
            },
            {
                path: "/staff",
                component: () => import("../views/Staff"),
            },
        ],
    },
];

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes,
});

export default router;
