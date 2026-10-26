export default {
  routes: [
    {
      method: 'GET',
      path: '/profiles/:username',
      handler: 'profile.show',
      config: {},
    },
  ],
};
