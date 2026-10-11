import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: () => import("@/layouts/MainLayout.vue"),
    children: [
      { path: "",
        name: 'home-page',
        component: () => import("@/pages/IndexPage.vue")
      },
      {
        path: "profile",
        name: "profile",
        component: () => import("@/pages/ProfilePage.vue"),
        meta: { is_auth: true }
      },
      {
        path: "sessions",
        name: "sessions",
        component: () => import("@/pages/SessionsPage.vue")
      },
      {
        path: "movies/:slug",
        name: "movie",
        component: () => import("@/pages/MoviePage.vue") }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("@/pages/ErrorNotFound.vue")
  }
];

export default routes;
