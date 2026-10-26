export default {
  routes: [
    {
      method: 'POST',
      path: '/replies/:documentId/best-answer',
      handler: 'reply.markBestAnswer',
      config: {},
    },
  ],
};
