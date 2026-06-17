export default {
  type: 'admin',
  routes: [
    {
      method: 'GET',
      path: '/overrides',
      handler: 'admin.getOverrides',
      config: {
        policies: [],
      },
    },
  ],
};
